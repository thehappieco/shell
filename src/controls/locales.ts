// Each language's name in itself (design 2026-10-10, 4.1), shared by the
// console, id. and the shell's language menu, so the three name a language
// the same way.
//
// The rule it enforces: a language is named in its own language and marked
// with its lang wherever it is drawn, so a screen reader pronounces
// "Español" as Spanish on a page in Portuguese. Text only.

import type { Locale } from '../types.js'

export const LOCALE_NAMES: Readonly<Record<Locale, string>> = Object.freeze({
  'pt-BR': 'Português (Brasil)',
  en: 'English',
  es: 'Español',
})
