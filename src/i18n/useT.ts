"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/store";
import { HTML_LANG, LOCALE_STORAGE_KEY, isLocale } from "./config";
import { STRINGS, type Strings } from "./strings";

/** The UI dictionary for the active locale. */
export function useT(): Strings {
  return useApp((s) => STRINGS[s.locale]);
}

export function useLocale() {
  return useApp((s) => s.locale);
}

/**
 * Adopts the stored locale after mount.
 *
 * This deliberately does not run during render. The server has no access to
 * `localStorage`, so it always renders English; reading the stored value while
 * rendering on the client would produce different markup and throw a hydration
 * error, which in a production build takes down the whole page. Applying it in
 * an effect costs one extra paint in the rare case the stored locale is Chinese
 * and is the only correct option without a cookie and a server round trip.
 *
 * The theme uses a blocking inline script instead, because a wrong-colour flash
 * is far more jarring than a brief flash of the wrong language.
 */
export function useLocaleSync() {
  const locale = useApp((s) => s.locale);
  const setLocale = useApp((s) => s.setLocale);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    } catch {
      /* storage unavailable — stay on the default */
    }
    if (isLocale(stored) && stored !== locale) setLocale(stored);
    // Runs once: later changes go through `setLocale`, which sets `lang` itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale];
  }, [locale]);
}
