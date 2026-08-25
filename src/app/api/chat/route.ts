import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getRetriever, type RetrievedChunk } from "@/lib/rag";
import { getAnimal, getBehavior } from "@/animals/registry";

export const runtime = "nodejs";

interface ChatRequest {
  message?: string;
  animalId?: string;
  behaviorId?: string | null;
  history?: { role: "user" | "assistant"; content: string }[];
}

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_TURNS = 10;

const SYSTEM_PROMPT = `You are a careful, friendly guide to animal body language, embedded in an educational 3D web app.

Answer using the reference material provided in <context>. If the context does not cover the question, say so plainly and give general, well-established guidance instead of inventing specifics.

House rules:
- Keep answers to two or three short paragraphs, or a tight bulleted list.
- Describe observable signals (ear position, tail carriage, body weight, facial tension) rather than asserting what the animal feels.
- Read signals in combination. Warn against reading any single cue — a wagging tail especially — in isolation.
- Never advise punishing warning signals such as growling; explain that doing so removes the warning, not the fear.
- For anything involving a bite risk, sudden behaviour change, or possible pain, recommend a veterinarian or a qualified force-free behaviourist.
- You are not a substitute for veterinary care. Say so when it matters, without repeating it every time.`;

function buildContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "No reference material matched this question.";
  return chunks
    .map((c, i) => `[${i + 1}] ${c.title}\n${c.text}`)
    .join("\n\n---\n\n");
}

/**
 * Fallback answer used when no ANTHROPIC_API_KEY is configured. It is extractive
 * rather than generative: it surfaces the retrieved material directly so the
 * chat stays useful without any external service.
 */
function extractiveAnswer(chunks: RetrievedChunk[], animalName: string): string {
  if (chunks.length === 0) {
    return `I couldn't find anything on that in the ${animalName.toLowerCase()} reference library yet. Try asking about tail position, ear set, body posture, or a specific situation such as greeting or handling.`;
  }
  const top = chunks[0];
  const rest = chunks.slice(1, 3).map((c) => c.title);
  const lines = [
    `Here's what the reference library has on that, from **${top.title}**:`,
    "",
    top.text,
  ];
  if (rest.length) {
    lines.push("", `Related entries: ${rest.join(", ")}.`);
  }
  lines.push(
    "",
    "_Set an ANTHROPIC_API_KEY to get conversational answers instead of raw reference entries._",
  );
  return lines.join("\n");
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
    return NextResponse.json({ reply: extractiveAnswer(chunks, animal.name), sources });
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
    return NextResponse.json({ reply: extractiveAnswer(chunks, animal.name), sources });
  }
}
