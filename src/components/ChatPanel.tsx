"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Animal } from "@/animals/types";
import { useApp, type ChatMessage } from "@/lib/store";
import { useT } from "@/i18n/useT";
import type { Strings } from "@/i18n/strings";

/**
 * `crypto.randomUUID` only exists in a secure context. Opening the dev server
 * over a LAN IP (http://192.168.x.x:3000) is NOT secure, so it is undefined
 * there and throws — which previously killed the send handler and left the
 * panel permanently disabled. Always go through this.
 */
function newId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Renders the tiny subset of Markdown the answers actually use: `**bold**` for
 * the name of a signal, and `- ` lines as a bullet list.
 *
 * Answers used to be dropped into a `whitespace-pre-wrap` paragraph, which
 * showed the asterisks literally — `**Tail Swishing** — the mood is shifting`.
 * A full Markdown library would be far more than this needs; anything outside
 * these two rules is passed through as plain text.
 */
function inline(text: string, keyPrefix: string) {
  // Split on the bold delimiters, keeping the captured inner text. Odd indices
  // are the bold runs because the pattern has exactly one capture group.
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={`${keyPrefix}-${i}`} className="font-semibold">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

function RichText({ text }: { text: string }) {
  // Group consecutive "- " lines so they become one <ul> rather than several.
  const blocks: { kind: "p" | "ul"; lines: string[] }[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const isBullet = /^[-*]\s+/.test(trimmed);
    const last = blocks[blocks.length - 1];
    if (isBullet) {
      const item = trimmed.replace(/^[-*]\s+/, "");
      if (last?.kind === "ul") last.lines.push(item);
      else blocks.push({ kind: "ul", lines: [item] });
    } else {
      blocks.push({ kind: "p", lines: [trimmed] });
    }
  }

  return (
    <div className="space-y-1.5">
      {blocks.map((block, b) =>
        block.kind === "ul" ? (
          <ul key={b} className="ml-1 space-y-0.5">
            {block.lines.map((item, i) => (
              <li key={i} className="flex gap-1.5">
                <span aria-hidden className="select-none opacity-50">
                  •
                </span>
                <span>{inline(item, `${b}-${i}`)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p key={b}>{inline(block.lines[0], `${b}`)}</p>
        ),
      )}
    </div>
  );
}

function TypingIndicator() {
  const t = useT();
  return (
    <div className="flex items-center gap-1 px-1 py-1.5" aria-label={t.assistantTyping}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="typing-dot h-1.5 w-1.5 rounded-full bg-[var(--muted)]"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function Bubble({ message, t }: { message: ChatMessage; t: Strings }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[0.82rem] leading-relaxed ${
          isUser ? "accent-bg rounded-br-md" : "surface-raised rounded-bl-md text-[var(--fg)]"
        }`}
      >
        {message.pending ? (
          <TypingIndicator />
        ) : (
          <>
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <RichText text={message.content} />
            )}
            {message.sources && message.sources.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1 border-t border-[var(--surface-border)] pt-2">
                {message.sources.map((s, i) => (
                  <span
                    key={i}
                    className="accent-chip rounded-md px-1.5 py-0.5 text-[0.6rem]"
                  >
                    {s.title}
                    {s.page ? t.sourcePage(s.page) : ""}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

export function ChatPanel({ animal }: { animal: Animal }) {
  const { chatOpen, toggleChat, messages, addMessage, updateMessage, chatBusy, setChatBusy } = useApp();
  const behaviorId = useApp((s) => s.behaviorId);
  const locale = useApp((s) => s.locale);
  const t = useT();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  /**
   * Guards against double-submit without gating the UI on async state. If a
   * render ever left `chatBusy` stuck true, the old code refused every
   * subsequent send forever; this ref is always cleared in `finally`.
   */
  const inFlight = useRef(false);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, chatOpen]);

  // Reopening the panel should never inherit a stuck busy state from before.
  useEffect(() => {
    if (chatOpen) {
      inFlight.current = false;
      setChatBusy(false);
      inputRef.current?.focus();
    }
  }, [chatOpen, setChatBusy]);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || inFlight.current) return;

      inFlight.current = true;
      setInput("");
      setChatBusy(true);

      const pendingId = newId();
      // Snapshot the prior turns BEFORE appending this one, otherwise the
      // current question would be sent twice (once as history, once as
      // `message`). Read from the store rather than the render closure so
      // rapid successive sends still see the latest transcript.
      const history = useApp
        .getState()
        .messages.filter((m) => !m.pending)
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        addMessage({ id: newId(), role: "user", content: question });
        addMessage({ id: pendingId, role: "assistant", content: "", pending: true });

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: question,
            animalId: animal.id,
            // Context so the RAG backend can bias retrieval toward what the
            // user is currently looking at.
            behaviorId,
            // The answer's language, not just the UI's — the route picks the
            // translated card fields and tells the model which language to use.
            locale,
            history,
          }),
        });

        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const data = await res.json();
        updateMessage(pendingId, {
          content: data.reply ?? t.noResponse,
          sources: data.sources,
          pending: false,
        });
      } catch (err) {
        updateMessage(pendingId, {
          content: err instanceof Error ? t.chatUnreachable(err.message) : t.chatFailed,
          pending: false,
        });
      } finally {
        // Always runs, so the panel can never latch shut.
        inFlight.current = false;
        setChatBusy(false);
        inputRef.current?.focus();
      }
    },
    [addMessage, updateMessage, setChatBusy, animal.id, behaviorId, locale, t],
  );

  return (
    <AnimatePresence>
      {chatOpen && (
        <motion.aside
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="surface pointer-events-auto flex h-[min(30rem,72vh)] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl"
          aria-label={t.chatAriaLabel}
        >
          <header className="flex items-center gap-2.5 border-b border-[var(--surface-border)] px-4 py-3">
            <span
              className="accent-soft-bg grid h-7 w-7 place-items-center rounded-lg text-sm"
            >
              📚
            </span>
            <div className="flex-1">
              <h3 className="text-[0.8rem] font-semibold leading-tight">
                {t.chatHeading(animal.name)}
              </h3>
              <p className="text-[0.62rem] leading-tight text-[var(--muted)]">
                {t.chatSubheading}
              </p>
            </div>
            <button
              onClick={toggleChat}
              className="focusable grid h-7 w-7 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--accent-soft)]"
              aria-label={t.closeChat}
            >
              ✕
            </button>
          </header>

          <div ref={scrollRef} className="scroll-slim flex-1 space-y-2.5 overflow-y-auto px-4 py-3.5">
            {messages.length === 0 && (
              <p className="pt-2 text-center text-[0.78rem] leading-relaxed text-[var(--muted)]">
                {t.chatEmpty(animal.name)}
              </p>
            )}
            {messages.map((m) => (
              <Bubble key={m.id} message={m} t={t} />
            ))}
          </div>

          {/*
            Suggestions stay available for the whole conversation. Hiding them
            after the first reply made the panel look like it had stopped
            accepting questions.
          */}
          {animal.starterQuestions.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto border-t border-[var(--surface-border)] px-4 py-2">
              {animal.starterQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  disabled={chatBusy}
                  className="focusable shrink-0 rounded-full border border-[var(--surface-border)] px-2.5 py-1 text-[0.66rem] leading-tight whitespace-nowrap text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-40"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-end gap-2 border-t border-[var(--surface-border)] p-2.5"
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder={chatBusy ? t.chatThinking : t.chatPlaceholder}
              // Deliberately never disabled: the user can keep typing their next
              // question while an answer is still streaming back.
              className="scroll-slim max-h-24 flex-1 resize-none rounded-xl border border-[var(--surface-border)] bg-transparent px-3 py-2 text-[0.82rem] text-[var(--fg)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              disabled={!input.trim() || chatBusy}
              className="accent-bg focusable grid h-9 w-9 shrink-0 place-items-center rounded-xl transition disabled:opacity-35"
              aria-label={t.sendMessage}
            >
              ↑
            </button>
          </form>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
