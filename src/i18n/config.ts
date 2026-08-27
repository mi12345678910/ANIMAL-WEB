/**
 * Locale plumbing shared by the client store and the inline boot script.
 *
 * Two locales only, and English is the source of truth: every translatable
 * string lives in English in its original file, and Chinese arrives as an
 * overlay keyed by a stable id. A missing translation therefore falls back to
 * readable English rather than a blank or a key name.
 */
export const LOCALES = ["en", "zh"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Shared with the boot script in `layout.tsx`; keep the two in step. */
export const LOCALE_STORAGE_KEY = "bll-locale";

/** `<html lang>` value per locale. `zh-Hans` is the script-level tag. */
export const HTML_LANG: Record<Locale, string> = {
  en: "en",
  zh: "zh-Hans",
};

/** Name of each locale written in that locale, for the switcher. */
export const LOCALE_LABEL: Record<Locale, string> = {
  en: "English",
  zh: "中文",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
