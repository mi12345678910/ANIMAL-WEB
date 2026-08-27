import type { Animal, Behavior } from "@/animals/types";
import type { GuideEntry } from "@/knowledge/guide";
import type { Locale } from "./config";
import { ANIMALS_ZH, type BehaviorTranslation } from "./content/animals.zh";
import { GUIDE_ZH, type GuideTranslation } from "./content/guide.zh";

/**
 * Merges the Chinese overlays onto the canonical English data.
 *
 * Deliberately not a React module: the retriever and the chat route need the
 * same resolution server-side, and duplicating the fallback rules is how the
 * two would drift apart.
 *
 * Fallback is per field, not per object. A behaviour with a translated title
 * but no translated cues shows Chinese where Chinese exists and English
 * elsewhere, which is far more useful than an all-or-nothing switch.
 */

function localizeBehavior(behavior: Behavior, t: BehaviorTranslation | undefined): Behavior {
  if (!t) return behavior;
  return {
    ...behavior,
    label: t.label,
    card: {
      ...behavior.card,
      title: t.title,
      tagline: t.tagline,
      // Matched by index; a short array leaves the remaining cues in English.
      cues: behavior.card.cues.map((cue, i) => t.cues[i] ?? cue),
      meaning: t.meaning,
      respond: t.respond.length > 0 ? t.respond : behavior.card.respond,
      // Only carry `avoid` when the English card had one, so a stray
      // translation cannot invent a warning block that does not exist.
      avoid: behavior.card.avoid ? (t.avoid ?? behavior.card.avoid) : undefined,
    },
  };
}

export function localizeAnimal(animal: Animal, locale: Locale): Animal {
  if (locale === "en") return animal;
  const t = ANIMALS_ZH[animal.id];
  if (!t) return animal;
  return {
    ...animal,
    name: t.name,
    blurb: t.blurb,
    starterQuestions: t.starterQuestions ?? animal.starterQuestions,
    behaviors: animal.behaviors.map((b) => localizeBehavior(b, t.behaviors?.[b.id])),
  };
}

/** Species name alone — used for citation labels, where the rest is wasted work. */
export function localizeAnimalName(animalId: string, fallback: string, locale: Locale): string {
  if (locale === "en") return fallback;
  return ANIMALS_ZH[animalId]?.name ?? fallback;
}

export interface LocalizedGuideEntry {
  title: string;
  meaning: string;
  whatToDo: string[];
}

export function localizeGuideEntry(entry: GuideEntry, locale: Locale): LocalizedGuideEntry {
  if (locale === "en") return entry;
  const t = GUIDE_ZH[entry.id];
  if (!t) return entry;
  return {
    title: t.title,
    meaning: t.meaning,
    whatToDo: t.whatToDo.length > 0 ? t.whatToDo : entry.whatToDo,
  };
}

/** Raw overlay lookups, for the retriever's bilingual index. */
export function guideTranslation(id: string): GuideTranslation | undefined {
  return GUIDE_ZH[id];
}

export function behaviorTranslation(
  animalId: string,
  behaviorId: string,
): BehaviorTranslation | undefined {
  return ANIMALS_ZH[animalId]?.behaviors?.[behaviorId];
}
