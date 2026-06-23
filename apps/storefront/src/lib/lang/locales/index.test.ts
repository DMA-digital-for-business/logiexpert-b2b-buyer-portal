import { describe, expect, it } from 'vitest';

import { isSupportedLocale, localeLoaders } from '.';

describe('locales registry', () => {
  it('registers the italian locale bundle', () => {
    expect(localeLoaders.it).toBeTypeOf('function');
    expect(isSupportedLocale('it')).toBe(true);
  });

  it('supports italian regional variants through bare-language fallback', () => {
    expect(isSupportedLocale('it-IT')).toBe(true);
  });
});
