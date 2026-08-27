import { ANIMALS, getAnimal } from "@/animals/registry";
import { GUIDE } from "@/knowledge/guide";

/**
 * Retrieval layer for the knowledge chat.
 *
 * `LocalRetriever` indexes two corpora side by side:
 *
 *   - the behaviour cards in the animal registry, which are tied to poses the
 *     3D rigs can actually show; and
 *   - the transcribed body-language guide in `@/knowledge/guide`, which covers
 *     the other ~58 signals (purring, hissing, yawning, bolting) that no model
 *     can demonstrate but readers still ask about.
 *
 * Both are plain data, so the chat is useful with no external services.
 *
 * To move to a real embedding-backed pipeline, implement `Retriever` against
 * your vector database and return it from `getRetriever()`. Nothing else in the
 * app changes — the API route and the chat UI only speak this interface.
 */

export interface RetrievedChunk {
  id: string;
  /** Human-readable source label, surfaced as a citation chip in the UI. */
  title: string;
  /** Page number when the chunk came from a PDF. */
  page?: number;
  text: string;
  /** Higher is more relevant. Scale is retriever-specific. */
  score: number;
  /**
   * Where the chunk came from, so the API route can compose a short answer from
   * structured fields instead of echoing the whole passage. Absent for chunks
   * from an external vector store, which carry prose only.
   */
  source?:
    | { kind: "behavior"; animalId: string; behaviorId: string }
    | { kind: "guide"; entryId: string };
}

export interface RetrieveOptions {
  animalId?: string;
  /** The behaviour the user is currently viewing, used to bias retrieval. */
  behaviorId?: string;
  topK?: number;
}

export interface Retriever {
  retrieve(query: string, options?: RetrieveOptions): Promise<RetrievedChunk[]>;
}

const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "do", "does", "did",
  "my", "your", "his", "her", "its", "their", "our", "i", "you", "he", "she", "it",
  "they", "we", "what", "why", "how", "when", "where", "who", "which", "that",
  "this", "these", "those", "and", "or", "but", "if", "of", "to", "in", "on", "at",
  "for", "with", "about", "as", "by", "from", "so", "than", "then", "there", "can",
  "could", "should", "would", "will", "just", "not", "no", "me",
]);

function tokenize(text: string): string[] {
  return (
    text
      .toLowerCase()
      // Drop apostrophes so "Jacobson's" indexes as "jacobsons" -> "jacobson",
      // then treat every other non-alphanumeric as a separator. Hyphens have to
      // split: keeping them meant "Belly-Up" was one token that a search for
      // "belly up" could never match.
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOPWORDS.has(t))
  );
}

/**
 * Crude suffix folding so "ears" matches "ear" and "wagging" matches "wag".
 * Doubled final consonants are collapsed ("wagging" -> "wagg" -> "wag").
 */
function stem(token: string): string {
  const undouble = (s: string) =>
    s.length > 2 && s[s.length - 1] === s[s.length - 2] && !"aeiou".includes(s[s.length - 1])
      ? s.slice(0, -1)
      : s;

  if (token.length > 5 && token.endsWith("ing")) return undouble(token.slice(0, -3));
  if (token.length > 4 && token.endsWith("ed")) return undouble(token.slice(0, -2));
  if (token.length > 4 && token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (token.length > 3 && token.endsWith("es")) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith("s")) return token.slice(0, -1);
  return token;
}

interface Doc {
  id: string;
  animalId: string;
  title: string;
  text: string;
  tokens: Map<string, number>;
  /**
   * Tokens from the signal's own name, scored separately. Matching the name of
   * a signal is much stronger evidence than matching a word buried in prose —
   * without this, "ears pinned back" lost to a card that merely happened to use
   * "ears", "back" and "listening" several times each.
   */
  titleTokens: Set<string>;
  /** Origin, mirrored onto the chunk so the route can rebuild a short answer. */
  origin: NonNullable<RetrievedChunk["source"]>;
  /** Total indexed tokens, for BM25 length normalisation. */
  length: number;
  page?: number;
  /**
   * Terms that should match but are not in `text` — synonyms a reader might
   * type. Indexed like body text but never shown, so answers stay clean.
   */
  keywords?: string[];
}

let corpus: Doc[] | null = null;
/** Inverse document frequency per term, so ubiquitous words carry little weight. */
let idf: Map<string, number> | null = null;
/** Mean document length, the reference point for BM25's length normalisation. */
let avgDocLength = 1;

/**
 * BM25 parameters. `K1` saturates term frequency — the tenth mention of "tail"
 * says little more than the third. `B` controls how hard long documents are
 * penalised; both are the standard defaults.
 *
 * Length normalisation is what makes the two corpora comparable. Behaviour
 * cards carry cues, meaning, advice and a warning, so they are several times
 * longer than a guide entry. Without normalising, a card outscored a guide
 * entry whose title was an exact match for the question.
 */
const K1 = 1.2;
const B = 0.75;

function buildIdf(docs: Doc[]): Map<string, number> {
  const df = new Map<string, number>();
  for (const doc of docs) {
    for (const term of doc.tokens.keys()) df.set(term, (df.get(term) ?? 0) + 1);
  }
  const n = docs.length;
  const map = new Map<string, number>();
  // +1 in the numerator keeps terms that appear everywhere slightly above zero,
  // so a query made entirely of common words still returns something.
  for (const [term, count] of df) map.set(term, Math.log((n + 1) / count));
  return map;
}

function totalTokens(tokens: Map<string, number>): number {
  let n = 0;
  for (const count of tokens.values()) n += count;
  return n;
}

function countTokens(sources: string[]): Map<string, number> {
  const tokens = new Map<string, number>();
  for (const source of sources) {
    for (const t of tokenize(source)) {
      const s = stem(t);
      tokens.set(s, (tokens.get(s) ?? 0) + 1);
    }
  }
  return tokens;
}

function tokenSet(text: string): Set<string> {
  return new Set(tokenize(text).map(stem));
}

/** Flatten the behaviour cards and the body-language guide into one index. */
function buildCorpus(): Doc[] {
  const docs: Doc[] = [];

  for (const animal of ANIMALS) {
    for (const b of animal.behaviors) {
      const text = [
        b.card.title,
        b.card.tagline,
        ...b.card.cues.map((c) => `${c.part}: ${c.text}`),
        b.card.meaning,
        ...b.card.respond,
        b.card.avoid ?? "",
      ]
        .filter(Boolean)
        .join("\n");
      docs.push({
        id: `behavior:${animal.id}:${b.id}`,
        animalId: animal.id,
        title: `${animal.name} · ${b.card.title}`,
        text,
        tokens: countTokens([text]),
        titleTokens: tokenSet(`${b.card.title} ${b.card.tagline}`),
        length: 0,
        origin: { kind: "behavior", animalId: animal.id, behaviorId: b.id },
      });
    }
  }

  for (const entry of GUIDE) {
    const text = [entry.title, entry.meaning, ...entry.whatToDo].join("\n");
    docs.push({
      id: `guide:${entry.id}`,
      animalId: entry.animalId,
      title: `${getAnimal(entry.animalId).name} · ${entry.title}`,
      text,
      // Keywords are indexed but not part of `text`, so they never leak into a
      // rendered answer or a citation label.
      tokens: countTokens([text, ...(entry.keywords ?? [])]),
      // Only the signal's actual name earns the title boost. Keywords are
      // synonyms for recall, and giving them name-strength weight meant a
      // search for "belly up" matched "Rolling on the Floor" — which merely
      // lists "belly" as a keyword — over "Belly-Up / Lying on Back".
      titleTokens: tokenSet(entry.title),
      length: 0,
      origin: { kind: "guide", entryId: entry.id },
      page: entry.page,
      keywords: entry.keywords,
    });
  }

  for (const doc of docs) doc.length = totalTokens(doc.tokens);
  avgDocLength = docs.reduce((sum, d) => sum + d.length, 0) / Math.max(1, docs.length);

  return docs;
}

/**
 * Keyword retriever over the built-in behaviour library.
 * Scores by term overlap, with a boost for the behaviour on screen.
 */
export class LocalRetriever implements Retriever {
  async retrieve(query: string, options: RetrieveOptions = {}): Promise<RetrievedChunk[]> {
    corpus ??= buildCorpus();
    idf ??= buildIdf(corpus);
    const { animalId, behaviorId, topK = 4 } = options;

    const queryTokens = tokenize(query).map(stem);
    if (queryTokens.length === 0) return [];

    const pool = animalId ? corpus.filter((d) => d.animalId === animalId) : corpus;

    const scored = pool.map((doc) => {
      let score = 0;
      const norm = 1 - B + (B * doc.length) / avgDocLength;
      for (const qt of queryTokens) {
        const weight = idf!.get(qt) ?? Math.log(corpus!.length + 1);
        // A hit on the signal's own name counts for far more than a hit in the
        // body, and stacks with the term-frequency score below.
        if (doc.titleTokens.has(qt)) score += 2.5 * weight;
        const tf = doc.tokens.get(qt);
        if (tf) {
          score += weight * ((tf * (K1 + 1)) / (tf + K1 * norm));
          continue;
        }
        // Partial credit for prefix matches ("anxiety" vs "anxious").
        for (const dt of doc.tokens.keys()) {
          if (dt.startsWith(qt) || qt.startsWith(dt)) {
            score += 0.5 * (idf!.get(dt) ?? weight);
            break;
          }
        }
      }
      if (
        behaviorId &&
        doc.origin.kind === "behavior" &&
        doc.origin.behaviorId === behaviorId
      ) {
        score += 1.5;
      }
      return { doc, score };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(({ doc, score }) => ({
        id: doc.id,
        title: doc.title,
        page: doc.page,
        text: doc.text,
        score,
        source: doc.origin,
      }));
  }
}

/**
 * Placeholder for the PDF-backed vector store.
 *
 * Wiring this up is the only change needed to graduate from keyword search:
 *   1. Ingest your PDFs (chunk -> embed -> upsert) into a vector DB.
 *   2. Embed the incoming query with the same model.
 *   3. Return the nearest chunks, carrying `title` and `page` through so the
 *      chat UI can render citations.
 *
 * Then set `RAG_BACKEND=vector` and provide the connection details below.
 */
export class VectorRetriever implements Retriever {
  async retrieve(_query: string, _options: RetrieveOptions = {}): Promise<RetrievedChunk[]> {
    throw new Error(
      "VectorRetriever is not implemented yet. Connect your PDF vector database in src/lib/rag.ts.",
    );
  }
}

let retriever: Retriever | null = null;

export function getRetriever(): Retriever {
  if (retriever) return retriever;
  retriever = process.env.RAG_BACKEND === "vector" ? new VectorRetriever() : new LocalRetriever();
  return retriever;
}
