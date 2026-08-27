import type { Animal } from "./types";

/**
 * Placeholder entry — listed in the selector as "Soon" and not selectable.
 * See `hamster.ts` for what a `coming-soon` species does and does not need.
 *
 * Scoped to parrots rather than "birds" in general: almost all companion-bird
 * body language people ask about — crest position, pinning eyes, beak grinding,
 * feather fluffing — is parrot behaviour, and a chicken or a finch would need a
 * different signal set entirely.
 *
 * White on the light accent is 6.44:1; the dark value is 10.14:1 on the dark
 * background.
 */
export const bird: Animal = {
  id: "bird",
  name: "Bird",
  icon: "\u{1F99C}",
  status: "coming-soon",
  accent: { light: "#1f5fa8", dark: "#93c5fd" },
  blurb: "Parrots & budgies · Psittaciformes",
  behaviors: [],
  starterQuestions: [],
};
