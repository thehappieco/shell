// The kept answer (decision 0047, shell 1.4.0): the last answer of GET
// /v1/shell a host showed, which it keeps in its own origin's local storage
// under KEPT_SHELL_KEY, so a new page draws the menu and the header in its
// first frame and only the content area waits.
//
// The rule it enforces: what is kept is a checked copy, written by keptText
// from data that passes parseShell, holding only the members the shell
// knows (contract 1.2: the account's sub and display name, its open
// workspaces with their ids, names and the role in each, its language and
// theme, and the menu; never an email, a key, a token or app data); what is
// read back is checked again, as a fresh answer is (readKept: parseShell
// with the host's configured console origin), and anything else is null.
// Neither touches storage: the host reads and writes the key itself, and
// erases it at a sign-out, a 401, another account, and, on an app, when its
// own session has ended (decision 0047). The shell never stores anything:
// it only draws the kept answer a host passes it (ThcShell's initial).

import { parseShell } from './load.js'
import type { ShellData } from './types.js'

/** KEPT_SHELL_KEY is the one storage key of the kept answer, on the console and on every app. */
export const KEPT_SHELL_KEY = 'thehappie-shell.last'

/** MAX_KEPT_TEXT is the longest kept text read or written, in UTF-16 code units: far above any real answer. */
export const MAX_KEPT_TEXT = 65_536

/**
 * keptText is what a host keeps for data: the JSON of its checked copy, or
 * null when data does not pass parseShell for its own console origin, or
 * would be longer than MAX_KEPT_TEXT. A host that gets null keeps nothing.
 */
export function keptText(data: ShellData): string | null {
  let copy: ShellData | null
  try {
    copy = parseShell(JSON.parse(JSON.stringify(data)), data.console_origin)
  } catch {
    return null
  }
  if (copy === null) return null
  const text = JSON.stringify(copy)
  return text.length > MAX_KEPT_TEXT ? null : text
}

/**
 * readKept is the kept answer in text for consoleOrigin (the host's
 * configured console origin), or null for anything that is not text, is
 * longer than MAX_KEPT_TEXT, is not JSON, or does not pass parseShell for
 * that origin. It never throws.
 */
export function readKept(text: unknown, consoleOrigin: string): ShellData | null {
  if (typeof text !== 'string' || text === '' || text.length > MAX_KEPT_TEXT) return null
  try {
    return parseShell(JSON.parse(text), consoleOrigin)
  } catch {
    return null
  }
}
