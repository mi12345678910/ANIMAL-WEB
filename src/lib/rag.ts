import { ANIMALS } from "@/animals/registry";

/**
 * Retrieval layer for the knowledge chat.
 *
 * The app ships with `LocalRetriever`, which indexes the behaviour cards that
 * already live in the animal registry. That makes the chat useful on day one
 * with no external services.
 *
 * To move to a real PDF-backed RAG pipeline, implement `Retriever` against your
 * vector database and return it from `getRetriever()`. Nothing else in the app
 * needs to change — the API route and the chat UI only speak this interface.
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
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
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
  behaviorId: string;
  title: string;
  text: string;
  tokens: Map<string, number>;
}

let corpus: Doc[] | null = null;
/** Inverse document frequency per term, so ubiquitous words carry little weight. */
let idf: Map<string, number> | null = null;

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

/** Flatten every behaviour card in the registry into searchable documents. */
function buildCorpus(): Doc[] {
  const docs: Doc[] = [];
  for (const animal of ANIMALS) {
    for (const b of animal.behaviors) {
      const parts = [
        b.card.title,
        b.card.tagline,
        ...b.card.cues.map((c) => `${c.part}: ${c.text}`),
        b.card.meaning,
        ...b.card.respond,
        b.card.avoid ?? "",
      ];
      const text = parts.filter(Boolean).join("\n");
      const tokens = new Map<string, number>();
      for (const t of tokenize(text)) {
        const s = stem(t);
        tokens.set(s, (tokens.get(s) ?? 0) + 1);
      }
      docs.push({
        id: `${animal.id}:${b.id}`,
        animalId: animal.id,
        behaviorId: b.id,
        title: `${animal.name} · ${b.card.title}`,
        text,
        tokens,
      });
    }
  }
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
      for (const qt of queryTokens) {
        const weight = idf!.get(qt) ?? Math.log(corpus!.length + 1);
        const exact = doc.tokens.get(qt);
        if (exact) {
          score += (2 + Math.log1p(exact)) * weight;
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
      if (behaviorId && doc.behaviorId === behaviorId) score += 1.5;
      return { doc, score };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(({ doc, score }) => ({
        id: doc.id,
        title: doc.title,
        text: doc.text,
        score,
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
