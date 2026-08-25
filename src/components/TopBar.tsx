"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ANIMALS } from "@/animals/registry";
import type { Animal } from "@/animals/types";
import { useApp } from "@/lib/store";

function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const current = (document.documentElement.getAttribute("data-theme") as "light" | "dark") ?? "dark";
    setTheme(current);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("bll-theme", next);
    } catch {
      /* storage unavailable — the toggle still works for this session */
    }
  };

  return (
    <button
      onClick={toggle}
      className="focusable glass grid h-10 w-10 place-items-center rounded-xl text-base transition hover:scale-105 active:scale-95"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
    >
      {theme === "dark" ? "☀️" : "\u{1F319}"}
    </button>
  );
}

function AnimalSelector({ animal }: { animal: Animal }) {
  const [open, setOpen] = useState(false);
  const setAnimal = useApp((s) => s.setAnimal);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="focusable glass flex items-center gap-3 rounded-xl px-3 py-2 transition hover:brightness-110"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-xl leading-none">{animal.icon}</span>
        <span className="text-left">
          <span className="block text-sm font-semibold leading-tight">{animal.name}</span>
          <span className="block text-[0.68rem] leading-tight text-[var(--muted)]">{animal.blurb}</span>
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-1 text-[0.6rem] text-[var(--muted)]"
          aria-hidden
        >
          ▼
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="glass-strong absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl p-1.5"
          >
            {ANIMALS.map((a) => {
              const disabled = a.status === "coming-soon";
              const active = a.id === animal.id;
              return (
                <li key={a.id}>
                  <button
                    role="option"
                    aria-selected={active}
                    disabled={disabled}
                    onClick={() => {
                      if (disabled) return;
                      setAnimal(a.id);
                      setOpen(false);
                    }}
                    className={`focusable flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                      disabled
                        ? "cursor-not-allowed opacity-45"
                        : active
                          ? "bg-[var(--accent-soft)]"
                          : "hover:bg-[var(--accent-soft)]"
                    }`}
                  >
                    <span className="text-xl">{a.icon}</span>
                    <span className="flex-1">
                      <span className="block text-sm font-medium">{a.name}</span>
                      <span className="block text-[0.68rem] text-[var(--muted)]">{a.blurb}</span>
                    </span>
                    {disabled ? (
                      <span className="rounded-full border border-[var(--glass-border)] px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-[var(--muted)]">
                        Soon
                      </span>
                    ) : active ? (
                      <span className="text-xs text-[var(--accent)]">●</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TopBar({ animal }: { animal: Animal }) {
  const { panelOpen, togglePanel, chatOpen, toggleChat } = useApp();

  return (
    <header className="flex items-center gap-3 px-4 py-3">
      <div className="flex items-center gap-2.5 pr-1">
        <div
          className="grid h-9 w-9 place-items-center rounded-xl text-lg"
          style={{ background: "var(--accent-soft)" }}
          aria-hidden
        >
          🐾
        </div>
        <div className="hidden sm:block">
          <h1 className="text-sm font-semibold leading-tight">Body Language Lab</h1>
          <p className="text-[0.68rem] leading-tight text-[var(--muted)]">Read the signals, not the stereotype</p>
        </div>
      </div>

      <AnimalSelector animal={animal} />

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={togglePanel}
          className="focusable glass hidden h-10 items-center gap-2 rounded-xl px-3 text-xs font-medium transition hover:brightness-110 lg:flex"
          aria-pressed={panelOpen}
        >
          {panelOpen ? "Hide" : "Show"} panel
        </button>
        <button
          onClick={toggleChat}
          className="focusable glass flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-medium transition hover:brightness-110"
          aria-pressed={chatOpen}
        >
          <span aria-hidden>💬</span>
          <span className="hidden sm:inline">Ask</span>
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
