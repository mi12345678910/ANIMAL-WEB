"use client";

import { motion } from "framer-motion";
import type { Animal, Tone } from "@/animals/types";
import { useApp } from "@/lib/store";
import { useT } from "@/i18n/useT";

const TONE_VAR: Record<Tone, string> = {
  positive: "var(--tone-positive)",
  neutral: "var(--tone-neutral)",
  caution: "var(--tone-caution)",
  alert: "var(--tone-alert)",
};

export function BehaviorPanel({ animal }: { animal: Animal }) {
  const behaviorId = useApp((s) => s.behaviorId);
  const setBehavior = useApp((s) => s.setBehavior);
  const t = useT();

  if (!animal.behaviors.length) {
    return (
      <div className="glass rounded-2xl p-5 text-sm text-[var(--muted)]">
        {t.noBehaviours(animal.name)}
      </div>
    );
  }

  return (
    <section aria-label={t.behaviours}>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{t.behaviours}</h2>
        {behaviorId && (
          <button
            onClick={() => setBehavior(behaviorId)}
            className="focusable text-[0.68rem] text-[var(--muted)] underline-offset-2 hover:underline"
          >
            {t.reset}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {animal.behaviors.map((b) => {
          const active = b.id === behaviorId;
          const tone = TONE_VAR[b.tone];
          return (
            <motion.button
              key={b.id}
              onClick={() => setBehavior(b.id)}
              whileTap={{ scale: 0.97 }}
              aria-pressed={active}
              className="focusable glass relative overflow-hidden rounded-xl px-3 py-3 text-left transition hover:brightness-110"
              style={
                active
                  ? { borderColor: tone, boxShadow: `0 0 0 1px ${tone}, var(--glass-shadow)` }
                  : undefined
              }
            >
              {active && (
                <motion.span
                  layoutId="behavior-active"
                  className="absolute inset-0 -z-10"
                  style={{ background: tone, opacity: 0.12 }}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className="mb-1 block text-lg leading-none" aria-hidden>
                {b.icon}
              </span>
              <span className="block text-[0.78rem] font-medium leading-snug">{b.label}</span>
              <span
                className="mt-1.5 block h-0.5 w-6 rounded-full transition-all"
                style={{ background: tone, opacity: active ? 1 : 0.35, width: active ? "1.75rem" : "1rem" }}
              />
            </motion.button>
          );
        })}
      </div>

      <p className="mt-3 text-[0.68rem] leading-relaxed text-[var(--muted)]">
        {t.behaviourHint}
      </p>
    </section>
  );
}
