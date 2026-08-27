import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getRetriever, type RetrievedChunk } from "@/lib/rag";
import { getAnimal, getBehavior } from "@/animals/registry";
import { getGuideEntry } from "@/knowledge/guide";

export const runtime = "nodejs";

interface ChatRequest {
  message?: string;
  animalId?: string;
  behaviorId?: string | null;
  history?: { role: "user" | "assistant"; content: string }[];
}

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_TURNS = 10;

const SYSTEM_PROMPT = `You are a friendly guide to animal body language in an educational 3D web app. Your readers are ordinary pet owners, not professionals.

<context> holds passages from a body-language field guide, each one a signal with what it means and what to do about it. Answer from those passages. If they do not cover the question, say so plainly and give general, well-established guidance rather than inventing specifics.

Keep every answer SHORT and easy to read. Use this shape:
1. One plain sentence that answers the question directly. Put the name of the signal in **bold** at the front when there is one.
2. "Look for:" then at most three short bullets, each starting with "- ", naming what to watch (ears, tail, body, face). Skip this section entirely if the question is not about reading a signal.
3. "What to do:" then one sentence.

Hard limits: under 90 words total. Short sentences. Bold only the signal's name. No other formatting — no headings, no numbered lists, no tables. No preambles, caveats, or a summary at the end. No jargon unless you explain it in the same breath.

Always: describe what is observable rather than asserting what the animal feels; treat signals in combination, never a single cue alone; never advise punishing a warning like a growl; and if there is bite risk, pain, or a sudden change in behaviour, say to see a vet or a qualified force-free behaviourist.`;

function buildContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "No reference material matched this question.";
  return chunks
    .map((c, i) => `[${i + 1}] ${c.title}\n${c.text}`)
    .join("\n\n---\n\n");
}

/** First sentence of a passage, for one-line summaries. */
function firstSentence(text: string): string {
  const match = text.match(/^.*?[.!?](?=\s|$)/);
  return (match ? match[0] : text).trim();
}

/** Drop a trailing full stop so a cue reads cleanly as a bullet. */
function asCue(text: string): string {
  return firstSentence(text).replace(/\.$/, "");
}

/** Total characters of advice to show before it stops being skimmable. */
const ACTION_BUDGET = 300;

/**
 * Pick the actions to show under "What to do".
 *
 * Only the first one is not enough: several guide entries split their advice
 * across branches, and the source does not always lead with the branch a
 * worried reader needs. "Rearing" opens with foals playing in a pasture, so a
 * single-action answer told someone whose horse had just reared to enjoy the
 * view. Two fit inside a still-skimmable answer and cover both branches.
 */
function takeActions(actions: string[]): string[] {
  const picked: string[] = [];
  let budget = ACTION_BUDGET;
  for (const action of actions.slice(0, 2)) {
    if (picked.length > 0 && action.length > budget) break;
    picked.push(action);
    budget -= action.length;
  }
  return picked;
}

/**
 * Fallback answer used when no ANTHROPIC_API_KEY is configured.
 *
 * It is extractive rather than generative, but it must not simply echo the
 * whole reference card — that reads as a wall of text. Instead it composes the
 * same shape the model is asked for: one-line answer, a few cues, one action.
 */
function extractiveAnswer(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return `I don't have anything on that yet. Try asking about the tail, the ears, or how the body is held.`;
  }

  const top = chunks[0];

  // Guide entries are already written as meaning + actions, which is the shape
  // the answer wants.
  if (top.source?.kind === "guide") {
    const entry = getGuideEntry(top.source.entryId);
    if (entry) {
      const actions = takeActions(entry.whatToDo);
      return [
        `**${entry.title}** — ${entry.meaning}`,
        "",
        actions.length === 1
          ? `What to do: ${actions[0]}`
          : ["What to do:", ...actions.map((a) => `- ${a}`)].join("\n"),
      ].join("\n");
    }
  }

  if (top.source?.kind === "behavior") {
    const behavior = getBehavior(getAnimal(top.source.animalId), top.source.behaviorId);
    if (behavior) {
      const cues = behavior.card.cues.slice(0, 3).map((c) => `- ${c.part}: ${asCue(c.text)}`);
      // Neutral lead-in: the question may be a description of something seen, or
      // a general "what does X mean" — "that looks like…" only fits the first.
      return [
        `**${behavior.card.title}** — ${firstSentence(behavior.card.meaning)}`,
        "",
        "Look for:",
        ...cues,
        "",
        `What to do: ${firstSentence(behavior.card.respond[0])}`,
      ].join("\n");
    }
  }

  // A chunk from an external vector store has no structure — excerpt it.
  return `${firstSentence(top.text)}\n\nFrom **${top.title}**.`;
}

export async function POST(request: Request) {
  let body: ChatRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "A non-empty `message` is required." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message exceeds ${MAX_MESSAGE_LENGTH} characters.` },
      { status: 400 },
    );
  }

  const animal = getAnimal(body.animalId ?? "dog");
  const behavior = getBehavior(animal, body.behaviorId ?? null);

  let chunks: RetrievedChunk[] = [];
  try {
    chunks = await getRetriever().retrieve(message, {
      animalId: animal.id,
      behaviorId: behavior?.id,
      topK: 4,
    });
  } catch (err) {
    console.error("[chat] retrieval failed:", err);
    return NextResponse.json(
      { error: "The knowledge base is unavailable right now." },
      { status: 503 },
    );
  }

  const sources = chunks.map((c) => ({ title: c.title, page: c.page }));

  // Without a key the route still answers, straight from the retrieved material.
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ reply: extractiveAnswer(chunks), sources });
  }

  try {
    const client = new Anthropic();

    const history = (body.history ?? [])
      .filter((m) => typeof m.content === "string" && m.content.trim())
      .slice(-MAX_HISTORY_TURNS)
      .map((m) => ({ role: m.role, content: m.content }));

    const viewing = behavior
      ? `The user is currently viewing the "${behavior.card.title}" behaviour on the 3D ${animal.name.toLowerCase()} model.`
      : `The user is looking at the 3D ${animal.name.toLowerCase()} model without a behaviour selected.`;

    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [
        ...history,
        {
          role: "user",
          content: `${viewing}\n\n<context>\n${buildContext(chunks)}\n</context>\n\nQuestion: ${message}`,
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({
        reply: "I'm not able to answer that one. Try rephrasing, or ask about a specific body-language signal.",
        sources: [],
      });
    }

    const reply = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    return NextResponse.json({ reply: reply || "I didn't manage to produce an answer — try again?", sources });
  } catch (err) {
    console.error("[chat] generation failed:", err);
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "Rate limited — try again shortly." }, { status: 429 });
    }
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "The API key is invalid." }, { status: 500 });
    }
    // Retrieval worked even though generation did not, so still answer.
    return NextResponse.json({ reply: extractiveAnswer(chunks), sources });
  }
}
