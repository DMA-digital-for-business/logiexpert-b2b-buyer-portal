import { getFallbackLocale } from '../pickLocaleBundle';

import it from './it.json';

type LocaleMessages = Record<string, string>;

// Filenames use underscores for BCP-47 region tags (fr_FR.json); runtime codes use dashes (fr-FR).
const localeLoaders: Record<string, () => Promise<LocaleMessages>> = {
  fr: () => import('./fr.json').then((m) => m.default),
  es: () => import('./es.json').then((m) => m.default),
  en: () => import('./en.json').then((m) => m.default),
};

// Returns true when a static bundle covers the given code — either an exact
// match or via the base-language fallback (mirrors pickLocaleBundle's logic).
// en is always covered by the statically imported bundle even though it has no localeLoader entry.
function isSupportedLocale(code: string): boolean {
  if (code === 'it' || code in localeLoaders) {
    return true;
  }
  const fallback = getFallbackLocale(code);
  return fallback !== null && (fallback === 'it' || fallback in localeLoaders);
}

export { it, isSupportedLocale, localeLoaders };
