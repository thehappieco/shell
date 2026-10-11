// The theme: one attribute, data-theme on <html>, which tokens.css turns
// into a palette ("light" and "dark" fix it; "system" follows the
// browser's prefers-color-scheme). The shell never applies it on its own:
// a host that wants the account's theme (decision 0035) calls applyTheme
// with the answer's, as the console does with its session's. The shell
// stores nothing: a host that remembers the theme keeps its own memory.

import { THEMES, type Theme } from './types.js'

export function isTheme(v: unknown): v is Theme {
  return typeof v === 'string' && (THEMES as readonly string[]).includes(v)
}

/** applyTheme sets data-theme on the document's root element; a value that is not a theme is "system". */
export function applyTheme(theme: Theme, root: HTMLElement | undefined = globalThis.document?.documentElement): void {
  if (root !== undefined) root.dataset['theme'] = isTheme(theme) ? theme : 'system'
}
