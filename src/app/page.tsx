"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { getAnimal, getBehavior } from "@/animals/registry";
import { useApp } from "@/lib/store";
import { TopBar } from "@/components/TopBar";
import { BehaviorPanel } from "@/components/BehaviorPanel";
import { ExplanationCard } from "@/components/ExplanationCard";
import { ChatPanel } from "@/components/ChatPanel";
import { localizeAnimal } from "@/i18n/localize";
import { useLocaleSync, useT } from "@/i18n/useT";
import { STRINGS } from "@/i18n/strings";
import { DEFAULT_LOCALE } from "@/i18n/config";

// The viewport pulls in three.js, so keep it out of the server bundle.
const Viewport = dynamic(() => import("@/components/scene/Viewport").then((m) => m.Viewport), {
  ssr: false,
  // A module-level loader cannot use hooks, so it shows the default locale.
  // It is on screen for a fraction of a second before the viewport mounts.
  loading: () => (
    <div className="grid h-full place-items-center text-sm text-[var(--muted)]">
      {STRINGS[DEFAULT_LOCALE].preparingViewport}
    </div>
  ),
});

export default function Page() {
  useLocaleSync();
  const t = useT();
  const locale = useApp((s) => s.locale);
  const animalId = useApp((s) => s.animalId);
  const behaviorId = useApp((s) => s.behaviorId);
  const panelOpen = useApp((s) => s.panelOpen);

  // Translate once here and pass the result down, so no child needs to know
  // that localisation exists. Memoised because it rebuilds the behaviour array,
  // and a fresh array every render would defeat the children's memoisation.
  const animal = useMemo(() => localizeAnimal(getAnimal(animalId), locale), [animalId, locale]);
  const behavior = getBehavior(animal, behaviorId);

  return (
    <main
      className="accent-scope flex h-dvh flex-col overflow-hidden"
      /*
       * Both accent variants are published here; globals.css picks the right
       * one per theme. A single shared accent cannot work — a hue bright enough
       * for a dark background is unreadable under white text on a light one.
       */
      style={
        {
          "--accent-l": animal.accent.light,
          "--accent-d": animal.accent.dark,
        } as React.CSSProperties
      }
    >
      <div className="app-backdrop" aria-hidden />
      <TopBar animal={animal} />

      <div className="flex min-h-0 flex-1 gap-3 px-3 pb-3 lg:gap-4 lg:px-4 lg:pb-4">
        {/* 3D viewport */}
        <section className="glass relative min-w-0 flex-1 overflow-hidden rounded-2xl">
          <Viewport animal={animal} behavior={behavior} />
        </section>

        {/* Side panel: behaviour buttons + the synced explanation card */}
        <AnimatePresence initial={false}>
          {panelOpen && (
            <motion.aside
              initial={{ opacity: 0, x: 24, width: 0 }}
              animate={{ opacity: 1, x: 0, width: "22rem" }}
              exit={{ opacity: 0, x: 24, width: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="scroll-slim hidden shrink-0 overflow-y-auto overflow-x-hidden lg:block"
              aria-label={t.panelAriaLabel}
            >
              <div className="flex w-[22rem] flex-col gap-3 pr-0.5">
                <div className="glass rounded-2xl p-4">
                  <BehaviorPanel animal={animal} />
                </div>
                <ExplanationCard behavior={behavior} />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Below lg the panel becomes a bottom sheet so the viewport keeps the space. */}
      <div className="scroll-slim max-h-[42dvh] shrink-0 space-y-3 overflow-y-auto px-3 pb-3 lg:hidden">
        <div className="glass rounded-2xl p-4">
          <BehaviorPanel animal={animal} />
        </div>
        <ExplanationCard behavior={behavior} />
      </div>

      {/* Floating collapsible chat */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3">
        <ChatPanel animal={animal} />
      </div>
    </main>
  );
}
