"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Behavior, Tone } from "@/animals/types";
import { useT } from "@/i18n/useT";
import type { Strings } from "@/i18n/strings";

const TONE_VAR: Record<Tone, string> = {
  positive: "var(--tone-positive)",
  neutral: "var(--tone-neutral)",
  caution: "var(--tone-caution)",
  alert: "var(--tone-alert)",
};

const toneLabel = (t: Strings): Record<Tone, string> => ({
  positive: t.toneComfortable,
  neutral: t.toneAroused,
  caution: t.toneStressed,
  alert: t.toneNeedsSpace,
});

/** Staggered reveal so the card assembles rather than popping in. */
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.045, delayChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
};

export function ExplanationCard({ behavior }: { behavior: Behavior | null }) {
  const t = useT();
  const TONE_LABEL = toneLabel(t);
  return (
    <AnimatePresence mode="wait">
      {behavior ? (
        <motion.article
          key={behavior.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="glass overflow-hidden rounded-2xl"
          aria-live="polite"
        >
          <div className="h-1 w-full" style={{ background: TONE_VAR[behavior.tone] }} />

          <motion.div variants={container} initial="hidden" animate="show" className="p-5">
            <motion.header variants={item}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xl" aria-hidden>
                  {behavior.icon}
                </span>
                <span
                  className="tone-pill rounded-full px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider"
                  style={{ background: TONE_VAR[behavior.tone] }}
                >
                  {TONE_LABEL[behavior.tone]}
                </span>
              </div>
              <h3 className="text-lg font-semibold leading-tight">{behavior.card.title}</h3>
              <p className="mt-1.5 text-[0.8rem] italic leading-relaxed text-[var(--muted)]">
                {behavior.card.tagline}
              </p>
            </motion.header>

            <motion.section variants={item} className="mt-5">
              <h4 className="mb-2 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                {t.keyVisualCues}
              </h4>
              <ul className="space-y-2">
                {behavior.card.cues.map((cue) => (
                  <li key={cue.part} className="flex gap-2.5 text-[0.8rem] leading-relaxed">
                    <span
                      className="accent-chip mt-0.5 h-fit shrink-0 rounded-md px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide"
                    >
                      {cue.part}
                    </span>
                    <span className="text-[var(--fg)]/85">{cue.text}</span>
                  </li>
                ))}
              </ul>
            </motion.section>

            <motion.section variants={item} className="mt-5">
              <h4 className="mb-2 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                {t.whatItMeans}
              </h4>
              <p className="text-[0.8rem] leading-relaxed text-[var(--fg)]/85">{behavior.card.meaning}</p>
            </motion.section>

            <motion.section variants={item} className="mt-5">
              <h4 className="mb-2 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                {t.howToRespond}
              </h4>
              <ul className="space-y-1.5">
                {behavior.card.respond.map((r, i) => (
                  <li key={i} className="flex gap-2 text-[0.8rem] leading-relaxed text-[var(--fg)]/85">
                    <span className="accent-bg mt-[0.35rem] h-1 w-1 shrink-0 rounded-full" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </motion.section>

            {behavior.card.avoid && (
              <motion.aside
                variants={item}
                className="mt-5 rounded-xl p-3.5"
                style={{
                  background: "color-mix(in srgb, var(--tone-alert) 10%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--tone-alert) 30%, transparent)",
                }}
              >
                <h4 className="mb-1 flex items-center gap-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: "var(--tone-alert)" }}>
                  <span aria-hidden>⚠</span> {t.avoid}
                </h4>
                <p className="text-[0.78rem] leading-relaxed text-[var(--fg)]/85">{behavior.card.avoid}</p>
              </motion.aside>
            )}
          </motion.div>
        </motion.article>
      ) : (
        <motion.div
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="glass rounded-2xl p-6 text-center"
        >
          <div className="mb-2 text-3xl" aria-hidden>
            👋
          </div>
          <h3 className="text-sm font-semibold">{t.emptyCardTitle}</h3>
          <p className="mt-1.5 text-[0.78rem] leading-relaxed text-[var(--muted)]">
            {t.emptyCardBody}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
