// Reading the shell's data: GET /v1/shell on the console (shell contract 1).
//
// The rules it enforces:
//   - one simple request per call: credentials included (the console's
//     SameSite=Lax cookie goes with a same-site fetch), no header of the
//     page's own (so no preflight), never cached, never redirected;
//   - 200 with an answer of exactly the right shape is "ready", 401 is
//     "signed-out", and anything else is "unavailable": another status, no
//     answer, an answer that is not JSON, a v other than 1, a member of the
//     wrong type, or a console_origin other than the origin asked;
//   - what comes back is a new object holding only the members the shell
//     knows, each checked: unknown members are dropped, and nothing of the
//     answer is ever parsed as HTML or kept anywhere but in memory.
//
// The caller asks once per document load, never on a timer or in a retry
// loop (1.1).

import { APP_AI_TAB, APP_OVERVIEW_TAB, checkReturnPath, fillPath, isShellId, isWebOrigin, isWorkspaceId } from './paths.js'
import { isTheme } from './theme.js'
import {
  APP_COLORS,
  type AppColor,
  LOCALES,
  type Locale,
  type LocalText,
  ROLES,
  type Role,
  type ShellApp,
  type ShellData,
  type ShellMenu,
  type ShellResult,
  type ShellScreen,
  type ShellSection,
  type ShellWorkspace,
} from './types.js'

/** FetchLike is the part of fetch loadShell uses; hosts and tests may pass their own. */
export type FetchLike = (input: string, init: RequestInit) => Promise<Response>

/** The console's path for the shell's data. */
export const SHELL_PATH = '/v1/shell'

const UNAVAILABLE: ShellResult = Object.freeze({ status: 'unavailable' })
const SIGNED_OUT: ShellResult = Object.freeze({ status: 'signed-out' })

/**
 * loadShell asks the console at consoleOrigin for the shell's data. It never
 * throws: every failure is a result.
 */
export async function loadShell(
  consoleOrigin: string,
  fetchFn: FetchLike = (input, init) => fetch(input, init),
): Promise<ShellResult> {
  if (!isWebOrigin(consoleOrigin)) return UNAVAILABLE
  let res: Response
  try {
    res = await fetchFn(`${consoleOrigin}${SHELL_PATH}`, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      redirect: 'error',
    })
  } catch {
    return UNAVAILABLE
  }
  if (res.status === 401) return SIGNED_OUT
  if (res.status !== 200) return UNAVAILABLE
  let body: unknown
  try {
    body = JSON.parse(await res.text())
  } catch {
    return UNAVAILABLE
  }
  const data = parseShell(body, consoleOrigin)
  return data === null ? UNAVAILABLE : { status: 'ready', data }
}

// ---------------------------------------------------------------------------
// The shape (1.2). Each reader returns the checked value, or throws Bad,
// which parseShell turns into null.
// ---------------------------------------------------------------------------

class Bad extends Error {}

function bad(): never {
  throw new Bad()
}

type Obj = Record<string, unknown>

function obj(v: unknown): Obj {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) bad()
  return v as Obj
}

function list(v: unknown): unknown[] {
  if (!Array.isArray(v)) bad()
  return v
}

/** text is a non-empty string of at most max characters with no control character. */
function text(v: unknown, max = 200): string {
  if (typeof v !== 'string' || v === '' || v.length > max || /[\u0000-\u001f\u007f-\u009f]/.test(v)) bad()
  return v
}

/**
 * name is a display name or a team's name: null stays null, and a string
 * that is empty, too long or holds a control character is shown as no name
 * at all (id. and the console refuse such names before they are stored).
 */
function name(v: unknown): string | null {
  if (v === null) return null
  if (typeof v !== 'string') bad()
  const s = v.trim()
  return s === '' || s.length > 200 || /[\u0000-\u001f\u007f-\u009f]/.test(s) ? null : s
}

function oneOf<T extends string>(v: unknown, set: readonly T[]): T {
  if (typeof v !== 'string' || !(set as readonly string[]).includes(v)) bad()
  return v as T
}

function id(v: unknown): string {
  if (!isShellId(v)) bad()
  return v
}

function localText(v: unknown): LocalText {
  const o = obj(v)
  const out = {} as Record<Locale, string>
  for (const l of LOCALES) out[l] = text(o[l], 64)
  return Object.freeze(out)
}

/** A canonical UUID that stands in for {workspace} when a template is checked. */
const SAMPLE_WORKSPACE = '00000000-0000-4000-8000-000000000000'

/** consolePath is a console path template: filled, it is a return path; its only placeholder is {workspace}. */
function consolePath(v: unknown): string {
  if (typeof v !== 'string') bad()
  const filled = fillPath(v, SAMPLE_WORKSPACE)
  if (filled === null || /[{}]/.test(filled) || checkReturnPath(filled) !== filled) bad()
  return v
}

const SCREEN_PATH = /^\/[A-Za-z0-9_/-]*(\?workspace=\{workspace\})?$/

/** screenPath is a screen's template on its app's origin (CheckShellApps' rule). */
function screenPath(v: unknown): string {
  if (typeof v !== 'string' || v.length > 128 || !SCREEN_PATH.test(v) || v.includes('//')) bad()
  return v
}

function section(v: unknown): ShellSection {
  const o = obj(v)
  return { id: id(o['id']), path: consolePath(o['path']), title: localText(o['title']) }
}

function sections(v: unknown): ShellSection[] {
  const out = list(v).map(section)
  if (new Set(out.map(s => s.id)).size !== out.length) bad()
  return out
}

function screen(v: unknown): ShellScreen {
  const o = obj(v)
  const sid = id(o['id'])
  // The console's own tabs of an app's page are no screen's.
  if (sid === APP_OVERVIEW_TAB || sid === APP_AI_TAB) bad()
  return { id: sid, path: screenPath(o['path']), min_role: oneOf<Role>(o['min_role'], ROLES), title: localText(o['title']) }
}

function app(v: unknown): ShellApp {
  const o = obj(v)
  const letter = o['letter']
  if (typeof letter !== 'string' || !/^[A-Z]$/.test(letter)) bad()
  const origin = o['origin']
  if (!isWebOrigin(origin)) bad()
  const inShell = o['in_shell']
  if (typeof inShell !== 'boolean') bad()
  const screens = list(o['screens']).map(screen)
  if (new Set(screens.map(s => s.id)).size !== screens.length) bad()
  // Outside the shell, the screens are one page of the app's own.
  if (!inShell && screens.some(s => s.path !== screens[0]?.path)) bad()
  return {
    id: id(o['id']),
    name: text(o['name'], 64),
    origin,
    letter,
    color: oneOf<AppColor>(o['color'], APP_COLORS),
    in_shell: inShell,
    overview: consolePath(o['overview']),
    ai: consolePath(o['ai']),
    screens,
  }
}

function workspace(v: unknown): ShellWorkspace {
  const o = obj(v)
  const wid = o['id']
  if (!isWorkspaceId(wid)) bad()
  const kind = oneOf(o['kind'], ['personal', 'team'] as const)
  const n = name(o['name'])
  // A personal workspace has no name.
  return { id: wid, kind, name: kind === 'personal' ? null : n, role: oneOf<Role>(o['role'], ROLES) }
}

function menu(v: unknown): ShellMenu {
  const o = obj(v)
  const apps = list(o['apps']).map(app)
  if (new Set(apps.map(a => a.id)).size !== apps.length) bad()
  return {
    workspace: sections(o['workspace']),
    account: sections(o['account']),
    profile: section(o['profile']),
    workspaces_path: consolePath(o['workspaces_path']),
    apps,
  }
}

/**
 * parseShell checks one answer of GET /v1/shell (1.2) for consoleOrigin,
 * the origin it was asked of, and returns a clean copy, or null when any
 * member the shell needs is missing or of the wrong type.
 */
export function parseShell(value: unknown, consoleOrigin: string): ShellData | null {
  try {
    const o = obj(value)
    if (o['v'] !== 1) bad()
    if (o['console_origin'] !== consoleOrigin || !isWebOrigin(consoleOrigin)) bad()
    const sub = o['sub']
    if (!isWorkspaceId(sub)) bad()
    const theme = o['theme']
    if (!isTheme(theme)) bad()
    const workspaces = list(o['workspaces']).map(workspace)
    if (new Set(workspaces.map(w => w.id)).size !== workspaces.length) bad()
    return {
      v: 1,
      console_origin: consoleOrigin,
      sub,
      display_name: name(o['display_name']),
      locale: oneOf<Locale>(o['locale'], LOCALES),
      theme,
      workspaces,
      menu: menu(o['menu']),
    }
  } catch (err) {
    if (err instanceof Bad) return null
    throw err
  }
}
