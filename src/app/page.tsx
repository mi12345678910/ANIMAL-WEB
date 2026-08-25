"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { getAnimal, getBehavior } from "@/animals/registry";
import { useApp } from "@/lib/store";
import { TopBar } from "@/components/TopBar";
import { BehaviorPanel } from "@/components/BehaviorPanel";
import { ExplanationCard } from "@/components/ExplanationCard";
import { ChatPanel } from "@/components/ChatPanel";

// The viewport pulls in three.js, so keep it out of the server bundle.
const Viewport = dynamic(() => import("@/components/scene/Viewport").then((m) => m.Viewport), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center text-sm text-[var(--muted)]">
      Preparing the 3D viewport…
    </div>
  ),
});

export default function Page() {
  const animalId = useApp((s) => s.animalId);
  const behaviorId = useApp((s) => s.behaviorId);
  const panelOpen = useApp((s) => s.panelOpen);

  const animal = getAnimal(animalId);
  const behavior = getBehavior(animal, behaviorId);

  return (
    <main
      className="flex h-dvh flex-col overflow-hidden"
      // Species accent flows into every glass surface below.
      style={{ ["--accent" as string]: animal.accent }}
    >
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
              aria-label="Behaviour controls and explanation"
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
