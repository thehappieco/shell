// The shell's data, as GET /v1/shell answers it (shell contract 1.2), and
// what a host hands the shell component (3.2).
//
// The members keep the wire's snake_case, so an answer and its parsed form
// read the same. Every value here has passed parseShell (load.ts): a host
// never builds a ShellData from anything else.

export const LOCALES = ['pt-BR', 'en', 'es'] as const
/** Locale is the account's one language (decision 0030). */
export type Locale = (typeof LOCALES)[number]

export const THEMES = ['system', 'light', 'dark'] as const
/** Theme is the console's preference: "system" follows prefers-color-scheme. */
export type Theme = (typeof THEMES)[number]

/** The roles of a workspace, strongest first (decision 0004). */
export const ROLES = ['owner', 'admin', 'member'] as const
export type Role = (typeof ROLES)[number]

/** An app's color is one of these token names, never a CSS value: the shell draws it with a class. */
export const APP_COLORS = ['green', 'rust', 'violet', 'blue', 'indigo'] as const
export type AppColor = (typeof APP_COLORS)[number]

/** LocalText is one title in each of the three languages. */
export type LocalText = Readonly<Record<Locale, string>>

export interface ShellWorkspace {
  id: string
  kind: 'personal' | 'team'
  /** null for a personal workspace. */
  name: string | null
  role: Role
}

/** ShellSection is one of the console's own pages; path is a console path template. */
export interface ShellSection {
  id: string
  path: string
  title: LocalText
}

/** ShellScreen is one of an app's screens; path is a template on the app's origin. */
export interface ShellScreen {
  id: string
  path: string
  /** The weakest role the shell shows the screen to; the app still decides. */
  min_role: Role
  title: LocalText
}

export interface ShellApp {
  id: string
  name: string
  /** The app's origin: https, or http on a development *.localhost name. */
  origin: string
  letter: string
  color: AppColor
  /** Whether the app serves its screens inside the shell; while false, they open in a new tab. */
  in_shell: boolean
  /** The app's overview: a console path template. */
  overview: string
  /** The console's AI tab of the app (which model does each function): a console path template. */
  ai: string
  /**
   * The app's screens. While in_shell is false they are one page of the
   * app's own, at one path, which the shell opens as one entry.
   */
  screens: ShellScreen[]
}

export interface ShellMenu {
  workspace: ShellSection[]
  account: ShellSection[]
  profile: ShellSection
  workspaces_path: string
  apps: ShellApp[]
}

export interface ShellData {
  v: 1
  console_origin: string
  sub: string
  display_name: string | null
  locale: Locale
  theme: Theme
  /** Open workspaces only, the personal one first. */
  workspaces: ShellWorkspace[]
  menu: ShellMenu
}

/** ShellResult is what loadShell found: the data, no console session (401), or anything else. */
export type ShellResult = { status: 'ready'; data: ShellData } | { status: 'signed-out' } | { status: 'unavailable' }

/**
 * ShellPlace is where the page is: a console section (a section id, or
 * "account" or "workspaces"), or an app's page: its screen, null for the
 * console's overview of that app, or "ai" (APP_AI_TAB) for the console's AI
 * tab of it, a name no screen may take.
 */
export type ShellPlace = { kind: 'console'; section: string } | { kind: 'app'; app: string; screen: string | null }

export interface ShellFallbackScreen {
  id: string
  title: string
  href: string
}

/**
 * ShellFallback is an app's own menu, drawn when the console answers
 * without data for it (signed out, not answering, another account). While
 * the data loads the shell draws only its mark and name, in the header.
 */
export interface ShellFallback {
  app: string
  name: string
  letter: string
  color: AppColor
  screens: ShellFallbackScreen[]
}
