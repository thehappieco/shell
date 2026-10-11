// The theme toggle's order (design 2026-10-10, 4.1), as plain functions so
// the rule can be tested without a page.
//
// The rule it enforces: on "system", the first click shows the opposite of
// what the system shows at that moment, the next one the other, then
// "system" again, so the first click always changes the page. The system's
// scheme is read when asked (prefers-color-scheme), never remembered; a
// browser without matchMedia reads as light.

import type { Theme } from '../types.js'

/** nextTheme is the mode a click asks for, from current, with the system dark or not. */
export function nextTheme(current: Theme, systemDark: boolean): Theme {
  const order: readonly Theme[] = systemDark ? ['system', 'light', 'dark'] : ['system', 'dark', 'light']
  const at = order.indexOf(current)
  return order[(at + 1) % order.length] ?? 'system'
}

/** prefersDark says whether the system shows a dark scheme now. */
export function prefersDark(): boolean {
  try {
    return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  } catch {
    return false
  }
}
