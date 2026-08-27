import type { Animal } from "./types";
import { dog } from "./dog";
import { horse } from "./horse";
import { cat } from "./cat";
import { hamster } from "./hamster";
import { bird } from "./bird";

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
/** Ready species first, then the "Soon" placeholders, in selector order. */
export const ANIMALS: Animal[] = [dog, cat, horse, hamster, bird];

export const DEFAULT_ANIMAL_ID = dog.id;

export function getAnimal(id: string): Animal {
  return ANIMALS.find((a) => a.id === id) ?? dog;
}

export function getBehavior(animal: Animal, behaviorId: string | null) {
  if (!behaviorId) return null;
  return animal.behaviors.find((b) => b.id === behaviorId) ?? null;
}
