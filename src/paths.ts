// Every address the shell draws (shell contract 2): console links, app
// screens, the sign-in link and the hop, built only from the static registry
// the answer carries, a canonical workspace UUID and a checked console path.
//
// The rules it enforces:
//   - {workspace} is the one placeholder, and only a canonical UUID fills it;
//   - a return path is exactly a console path under is_return_path
//     (console.ReturnPath, the database's is_return_path), or nothing;
//   - return goes only onto an in-shell screen's link, percent-encoded, and
//     only when a console page asks for it.

import { type Locale, ROLES, type Role, type ShellApp, type ShellScreen, type Theme } from './types.js'

/** The one placeholder a path template has. */
export const WORKSPACE_PLACEHOLDER = '{workspace}'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/** isWorkspaceId says whether v is a canonical UUID (lowercase 8-4-4-4-12), as the console writes one. */
export function isWorkspaceId(v: unknown): v is string {
  return typeof v === 'string' && UUID.test(v)
}

/** The longest return path, in bytes (console.MaxReturnPathLen). */
export const MAX_RETURN_PATH = 256

const RETURN_PATH = /^\/([A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)*\/?)?$/

/**
 * checkReturnPath is p when it is a console path a link may return to, and
 * null otherwise: "/", or segments of [A-Za-z0-9_-] joined by single
 * slashes with an optional trailing one, at most 256 bytes, never /auth or
 * /v1 or below them. No scheme, host, query, fragment, backslash, encoded
 * character or dot segment survives.
 */
export function checkReturnPath(p: unknown): string | null {
  if (typeof p !== 'string' || p.length > MAX_RETURN_PATH || !RETURN_PATH.test(p)) return null
  if (/^\/(auth|v1)(\/|$)/.test(p)) return null
  return p
}

/**
 * readShellQuery reads an app screen's query (2.1): workspace when it is
 * exactly one canonical UUID, and return when it is exactly one console
 * path. A missing, malformed or repeated value is null.
 */
export function readShellQuery(search: string): { workspace: string | null; returnPath: string | null } {
  const q = new URLSearchParams(search)
  const ws = q.getAll('workspace')
  const ret = q.getAll('return')
  return {
    workspace: ws.length === 1 && isWorkspaceId(ws[0]) ? (ws[0] as string) : null,
    returnPath: ret.length === 1 ? checkReturnPath(ret[0]) : null,
  }
}

/**
 * fillPath fills a template's {workspace} with workspace. A template
 * without the placeholder is returned as it is; one with it needs a
 * canonical UUID, and is null without one.
 */
export function fillPath(template: string, workspace: string | null): string | null {
  if (!template.includes(WORKSPACE_PLACEHOLDER)) return template
  if (!isWorkspaceId(workspace)) return null
  return template.split(WORKSPACE_PLACEHOLDER).join(workspace)
}

/** consoleURL is a console path template, filled, on the console's origin; null when it cannot be filled. */
export function consoleURL(consoleOrigin: string, template: string, workspace: string | null): string | null {
  const path = fillPath(template, workspace)
  return path === null ? null : `${consoleOrigin}${path}`
}

/**
 * screenURL is an app screen's address in workspace. returnTo, a console
 * path, goes on as &return= only when it passes checkReturnPath and the app
 * serves its screens inside the shell; any other screen is the app's own
 * page, which knows no return.
 */
export function screenURL(app: ShellApp, screen: ShellScreen, workspace: string | null, returnTo?: string | null): string | null {
  const path = fillPath(screen.path, workspace)
  if (path === null) return null
  const back = returnTo === undefined || returnTo === null || !app.in_shell ? null : checkReturnPath(returnTo)
  if (back === null) return `${app.origin}${path}`
  return `${app.origin}${path}${path.includes('?') ? '&' : '?'}return=${encodeURIComponent(back)}`
}

/** The console's own tabs of an app's page, which no screen of the app's may be called. */
export const APP_OVERVIEW_TAB = 'overview'
export const APP_AI_TAB = 'ai'

/**
 * signOutURL is the console's page that signs out (3.3): a page with one
 * button, since only the console's own page may end its session.
 */
export function signOutURL(consoleOrigin: string): string {
  return `${consoleOrigin}/signout`
}

/**
 * signInURL is the console's sign-in (2.3): its /auth/login, back to
 * returnTo (a console path; /workspaces when it is not one), in locale and,
 * when the host gave one, its theme (decision 0050), both of which the
 * console sends on to id.
 */
export function signInURL(consoleOrigin: string, returnTo: string | null, locale: Locale, theme?: Theme): string {
  const q = new URLSearchParams({ return_to: checkReturnPath(returnTo) ?? '/workspaces', locale })
  if (theme !== undefined) q.set('theme', theme)
  return `${consoleOrigin}/auth/login?${q.toString()}`
}

/**
 * consoleHomeURL is the console's home, linked from a shell without the
 * console's data (signed out, not answering, another account): it carries
 * the page's language and, when the host gave one, its theme, as every link
 * between the ecosystem's pages does (decision 0050).
 */
export function consoleHomeURL(consoleOrigin: string, locale: Locale, theme?: Theme): string {
  const q = new URLSearchParams({ ui_locales: locale })
  if (theme !== undefined) q.set('ui_theme', theme)
  return `${consoleOrigin}/?${q.toString()}`
}

const SHELL_ID = /^[a-z][a-z0-9-]{0,31}$/

/** isShellId says whether v is an app, screen or section id of the registry. */
export function isShellId(v: unknown): v is string {
  return typeof v === 'string' && SHELL_ID.test(v)
}

/**
 * hopPath is the console page that brings a person back to an app's screen
 * after signing in (1.3): /workspaces/{workspace}/apps/{app}/{screen}, the
 * app's overview without a screen, and /workspaces without a valid
 * workspace or app.
 */
export function hopPath(app: string, screen: string | null, workspace: string | null): string {
  if (!isWorkspaceId(workspace) || !isShellId(app)) return '/workspaces'
  const overview = `/workspaces/${workspace}/apps/${app}`
  return screen !== null && isShellId(screen) ? `${overview}/${screen}` : overview
}

/**
 * roleAllows says whether role reaches min (owner > admin > member). With no
 * workspace there is no role, and nothing is filtered: the app decides.
 */
export function roleAllows(role: Role | null, min: Role): boolean {
  if (role === null) return true
  return ROLES.indexOf(role) <= ROLES.indexOf(min)
}

/** visibleScreens is an app's screens that role reaches, in the registry's order. */
export function visibleScreens(app: ShellApp, role: Role | null): ShellScreen[] {
  return app.screens.filter(s => roleAllows(role, s.min_role))
}

/**
 * isWebOrigin says whether s is exactly an origin a link may name: https,
 * or http on localhost or a *.localhost name (spec 7.1), with no
 * credentials, path, query or fragment.
 */
export function isWebOrigin(s: unknown): s is string {
  if (typeof s !== 'string') return false
  let u: URL
  try {
    u = new URL(s)
  } catch {
    return false
  }
  if (u.origin !== s || u.username !== '' || u.password !== '') return false
  const local = u.hostname === 'localhost' || u.hostname.endsWith('.localhost')
  return u.protocol === 'https:' || (u.protocol === 'http:' && local)
}
