"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ANIMALS } from "@/animals/registry";
import { localizeAnimal } from "@/i18n/localize";
import type { Animal } from "@/animals/types";
import { useApp } from "@/lib/store";
import { useT } from "@/i18n/useT";
import { LOCALES, LOCALE_LABEL } from "@/i18n/config";

function ThemeToggle() {
  const t = useT();
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
      aria-label={theme === "dark" ? t.switchToLight : t.switchToDark}
      title={theme === "dark" ? t.switchToLight : t.switchToDark}
    >
      {theme === "dark" ? "☀️" : "\u{1F319}"}
    </button>
  );
}

/**
 * Two locales fit as a segmented control, which shows the alternative without a
 * click — better than a dropdown that hides "中文" behind a globe icon.
 */
function LanguageToggle() {
  const t = useT();
  const locale = useApp((s) => s.locale);
  const setLocale = useApp((s) => s.setLocale);

  return (
    <div
      className="glass flex h-10 items-center gap-0.5 rounded-xl p-1"
      role="group"
      aria-label={t.language}
    >
      {LOCALES.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            onClick={() => setLocale(l)}
            aria-pressed={active}
            lang={l === "zh" ? "zh-Hans" : "en"}
            className={`focusable rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              active ? "accent-bg" : "text-[var(--muted)] hover:text-[var(--fg)]"
            }`}
          >
            {LOCALE_LABEL[l]}
          </button>
        );
      })}
    </div>
  );
}

function AnimalSelector({ animal }: { animal: Animal }) {
  const t = useT();
  const locale = useApp((s) => s.locale);
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
        aria-label={t.chooseSpecies}
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
            {ANIMALS.map((raw) => {
              // Options list every species, so each row needs translating here
              // rather than relying on the one localised animal from the page.
              const a = localizeAnimal(raw, locale);
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
                        {t.comingSoonBadge}
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
  const t = useT();
  const { panelOpen, togglePanel, chatOpen, toggleChat } = useApp();

  return (
    <header className="flex items-center gap-3 px-4 py-3">
      <div className="flex items-center gap-2.5 pr-1">
        <div
          className="accent-soft-bg grid h-9 w-9 place-items-center rounded-xl text-lg"
          aria-hidden
        >
          🐾
        </div>
        <div className="hidden sm:block">
          <h1 className="text-sm font-semibold leading-tight">{t.appTitle}</h1>
          <p className="text-[0.68rem] leading-tight text-[var(--muted)]">{t.appTagline}</p>
        </div>
      </div>

      <AnimalSelector animal={animal} />

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={togglePanel}
          className="focusable glass hidden h-10 items-center gap-2 rounded-xl px-3 text-xs font-medium transition hover:brightness-110 lg:flex"
          aria-pressed={panelOpen}
        >
          {panelOpen ? t.hidePanel : t.showPanel}
        </button>
        <button
          onClick={toggleChat}
          className="focusable glass flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-medium transition hover:brightness-110"
          aria-pressed={chatOpen}
        >
          <span aria-hidden>💬</span>
          <span className="hidden sm:inline">{t.ask}</span>
        </button>
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
