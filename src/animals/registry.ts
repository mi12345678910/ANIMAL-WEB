import type { Animal } from "./types";
import { dog } from "./dog";

/**
 * The species registry.
 *
 * To add an animal: build an `Animal` object (its own file, like `dog.ts`),
 * drop the rigged model in `public/models/`, and add it to this array. The
 * selector, viewport, behaviour buttons, explanation cards and chat context all
 * read from here, so no component needs editing.
 *
 * A species with `status: "coming-soon"` renders in the selector as a disabled
 * entry and needs no model or behaviours.
 */

const cat: Animal = {
  id: "cat",
  name: "Cat",
  icon: "\u{1F408}",
  status: "coming-soon",
  accent: { light: "#6d3fd4", dark: "#c4b5fd" },
  blurb: "Domestic cat · Felis catus",
  behaviors: [],
  starterQuestions: [],
};

const horse: Animal = {
  id: "horse",
  name: "Horse",
  icon: "\u{1F40E}",
  status: "coming-soon",
  accent: { light: "#a8590c", dark: "#fcd34d" },
  blurb: "Domestic horse · Equus caballus",
  behaviors: [],
  starterQuestions: [],
};

export const ANIMALS: Animal[] = [dog, cat, horse];

export const DEFAULT_ANIMAL_ID = dog.id;

export function getAnimal(id: string): Animal {
  return ANIMALS.find((a) => a.id === id) ?? dog;
}

export function getBehavior(animal: Animal, behaviorId: string | null) {
  if (!behaviorId) return null;
  return animal.behaviors.find((b) => b.id === behaviorId) ?? null;
}
