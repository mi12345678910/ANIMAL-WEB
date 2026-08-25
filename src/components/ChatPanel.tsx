"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Animal } from "@/animals/types";
import { useApp, type ChatMessage } from "@/lib/store";

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 py-1.5" aria-label="Assistant is typing">
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

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[0.8rem] leading-relaxed ${
          isUser ? "rounded-br-md text-white" : "glass rounded-bl-md"
        }`}
        style={isUser ? { background: "var(--accent)" } : undefined}
      >
        {message.pending ? (
          <TypingIndicator />
        ) : (
          <>
            <p className="whitespace-pre-wrap">{message.content}</p>
            {message.sources && message.sources.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1 border-t border-[var(--glass-border)] pt-2">
                {message.sources.map((s, i) => (
                  <span
                    key={i}
                    className="rounded-md px-1.5 py-0.5 text-[0.6rem]"
                    style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                  >
                    {s.title}
                    {s.page ? ` · p.${s.page}` : ""}
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
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, chatOpen]);

  useEffect(() => {
    if (chatOpen) inputRef.current?.focus();
  }, [chatOpen]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || chatBusy) return;

    setInput("");
    setChatBusy(true);

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: question };
    const pendingId = crypto.randomUUID();
    addMessage(userMsg);
    addMessage({ id: pendingId, role: "assistant", content: "", pending: true });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          animalId: animal.id,
          // Context so the RAG backend can bias retrieval toward what the user
          // is currently looking at.
          behaviorId,
          history: messages.filter((m) => !m.pending).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      updateMessage(pendingId, {
        content: data.reply ?? "No response.",
        sources: data.sources,
        pending: false,
      });
    } catch (err) {
      updateMessage(pendingId, {
        content:
          err instanceof Error
            ? `Sorry — I couldn't reach the knowledge base. (${err.message})`
            : "Sorry — something went wrong.",
        pending: false,
      });
    } finally {
      setChatBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {chatOpen && (
        <motion.aside
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="glass-strong pointer-events-auto flex h-[min(30rem,72vh)] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl"
          aria-label="Knowledge chat"
        >
          <header className="flex items-center gap-2.5 border-b border-[var(--glass-border)] px-4 py-3">
            <span className="grid h-7 w-7 place-items-center rounded-lg text-sm" style={{ background: "var(--accent-soft)" }}>
              📚
            </span>
            <div className="flex-1">
              <h3 className="text-[0.8rem] font-semibold leading-tight">Ask about {animal.name.toLowerCase()}s</h3>
              <p className="text-[0.62rem] leading-tight text-[var(--muted)]">Answers from the reference library</p>
            </div>
            <button
              onClick={toggleChat}
              className="focusable grid h-7 w-7 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--accent-soft)]"
              aria-label="Close chat"
            >
              ✕
            </button>
          </header>

          <div ref={scrollRef} className="scroll-slim flex-1 space-y-2.5 overflow-y-auto px-4 py-3.5">
            {messages.length === 0 && (
              <div className="pt-2 text-center">
                <p className="text-[0.78rem] leading-relaxed text-[var(--muted)]">
                  Ask anything about {animal.name.toLowerCase()} body language — what a signal means, or what to
                  do about it.
                </p>
              </div>
            )}
            {messages.map((m) => (
              <Bubble key={m.id} message={m} />
            ))}
          </div>

          {messages.length === 0 && animal.starterQuestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-4 pb-2.5">
              {animal.starterQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="focusable rounded-full border border-[var(--glass-border)] px-2.5 py-1 text-[0.66rem] leading-tight text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
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
            className="flex items-end gap-2 border-t border-[var(--glass-border)] p-2.5"
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
              placeholder="Why is my dog yawning?"
              className="scroll-slim max-h-24 flex-1 resize-none rounded-xl border border-[var(--glass-border)] bg-transparent px-3 py-2 text-[0.8rem] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              disabled={!input.trim() || chatBusy}
              className="focusable grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white transition disabled:opacity-35"
              style={{ background: "var(--accent)" }}
              aria-label="Send message"
            >
              ↑
            </button>
          </form>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
