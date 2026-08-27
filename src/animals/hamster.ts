import type { Animal } from "./types";

/**
 * Placeholder entry — listed in the selector as "Soon" and not selectable.
 *
 * A `coming-soon` species needs no model, rig, behaviours or starter questions:
 * `TopBar` disables the row and never calls `setAnimal`, so nothing downstream
 * ever receives it. When the hamster is built, add `model`, `rig`, `idle`,
 * `behaviors` and `starterQuestions` here and flip `status` to `"ready"` — no
 * component or registry change is needed beyond that.
 *
 * Accent is set now so the species has a settled identity the day it ships.
 * White on the light value is 6.21:1; the dark value is 10.08:1 on the dark
 * background. Rose keeps it clear of the dog's teal and the horse's amber.
 */
export const hamster: Animal = {
  id: "hamster",
  name: "Hamster",
  icon: "\u{1F439}",
  status: "coming-soon",
  accent: { light: "#a8385b", dark: "#f9a8d4" },
  blurb: "Syrian hamster · Mesocricetus auratus",
  behaviors: [],
  starterQuestions: [],
};
