// What the shell draws, worked out from its props (shell contract 3.3) as
// plain data, so the component only renders it and the rules can be tested
// without a page:
//   - with data: the brand, the workspace selector, the groups Espaço (the
//     workspace's sections), Da conta (the account's) and Apps (one entry
//     per app, to its overview), the profile and "Sair", and a header with
//     the breadcrumb (Console / {workspace, or Sua conta} / {page}), the
//     title, the theme toggle and the language menu when the host can keep
//     a change (it passes both handlers), else "Aparência e idioma", a link
//     to Minha conta, and, for an app, its tabs: the overview,
//     the console's AI tab, then each screen the person's role reaches, or
//     one tab that opens the app's own page while it is not in the shell;
//   - without data (signed out, the console not answering, or another
//     person's console): the app's own menu, a notice and one link.
// A link is current as the page shown (aria-current="page") only when it
// leads to that page; the app's entry while one of its screens shows, and
// the workspace on an account page, are where the person is ("true").
// Every href is built by paths.ts; every word is the data's or i18n.ts's.

import { PRODUCT_BRAND_IDS, type ProductBrandId } from './brand/marks.js'
import { type ShellKey, localText, shellText } from './i18n.js'
import { APP_AI_TAB, checkReturnPath, consoleURL, hopPath, screenURL, signInURL, signOutURL, visibleScreens } from './paths.js'
import type {
  AppColor,
  Locale,
  ShellData,
  ShellFallback,
  ShellPlace,
  ShellResult,
  ShellScreen,
  ShellSection,
  ShellWorkspace,
  Theme,
} from './types.js'

/** The icons the menu knows, by section id; any other section gets a plain dot. */
export const SECTION_ICONS: Readonly<Record<string, string>> = Object.freeze({
  general: 'home',
  members: 'users',
  access: 'key',
  plan: 'card',
  storage: 'disk',
  activity: 'clock',
  settings: 'gear',
  contacts: 'book',
  ai: 'spark',
})

export interface AppMark {
  letter: string
  color: AppColor
  /** The brand kit's product for this app (its id is one), drawn as its symbol and written name; else null: the letter badge and the text. */
  brand: ProductBrandId | null
}

/** appBrand is the kit's product of an app id, when it is one (never the company's own). */
export function appBrand(id: string): ProductBrandId | null {
  return (PRODUCT_BRAND_IDS as readonly string[]).includes(id) ? (id as ProductBrandId) : null
}

/**
 * Current is how a link is current: "page" when it leads to the page shown,
 * "true" when it leads to where the person is but not to this page (an
 * app's overview while one of its screens shows; a workspace's General from
 * an account page), null otherwise. Both draw the highlight.
 */
export type Current = 'page' | 'true' | null

export interface MenuLink {
  id: string
  href: string
  label: string
  current: Current
  icon: string | null
  app: AppMark | null
  /** A link that opens in a new tab (an app's own page, not in the shell). */
  newTab: boolean
  /** A short note after the label ("abre no app"). */
  note: string | null
}

export interface MenuGroup {
  id: string
  label: string
  /** The app's mark beside the label (the fallback menu's one group). */
  app: AppMark | null
  links: MenuLink[]
}

export interface WorkspaceItem {
  id: string
  href: string | null
  name: string
  detail: string
  initial: string
  personal: boolean
  current: Current
}

export interface WorkspaceSelector {
  label: string
  switchLabel: string
  /** The workspace the page is in, or null when it names none the person has: the button then asks to choose one. */
  shown: WorkspaceItem | null
  chooseLabel: string
  items: WorkspaceItem[]
  allHref: string
  allLabel: string
}

export interface ProfileLink {
  href: string
  name: string | null
  initials: string | null
  label: string
  current: boolean
}

export interface MenuModel {
  brandHref: string
  brandLabel: string
  navLabel: string
  selector: WorkspaceSelector | null
  groups: MenuGroup[]
  profile: ProfileLink | null
  /** "Sair", a link to the console's sign-out page, drawn when the host puts nothing of its own at the foot. */
  signOut: { href: string; label: string } | null
}

export interface HeadLink {
  id: string
  href: string
  label: string
  current: boolean
  /** A link that opens the app's own page in a new tab (an app not in the shell). */
  newTab: boolean
  note: string | null
}

export interface HeadModel {
  crumbLabel: string
  crumb: string[]
  title: string
  app: AppMark | null
  tabsLabel: string
  tabs: HeadLink[]
  back: { href: string; label: string } | null
  notice: { kind: 'signed-out' | 'unavailable' | 'other-account'; text: string; href: string; link: string } | null
  /** "Aparência e idioma": the account's language and theme live in Minha conta. Null when the controls are drawn. */
  appearance: { href: string; label: string; current: boolean } | null
  /**
   * The theme toggle and the language menu, when the host passes both
   * handlers: what they show is the data's theme and language, or, before
   * or without data, "system" and the host's language.
   */
  controls: { theme: Theme; locale: Locale } | null
}

export type ShellMode = 'loading' | 'ready' | 'signed-out' | 'unavailable' | 'other-account'

export interface ShellView {
  mode: ShellMode
  lang: Locale
  menu: MenuModel
  head: HeadModel
  /** The page's color: an app's own on its pages, else the console's indigo (tokens.css, .thc-tone-*). */
  tone: AppColor
  /** Words the component needs around the model. */
  words: { skip: string; menu: string; closeMenu: string; newTab: string }
}

export interface ShellInput {
  consoleOrigin: string
  result: ShellResult | null
  place: ShellPlace
  workspace: string | null
  locale: Locale
  subject?: string | undefined
  fallback?: ShellFallback | undefined
  returnPath?: string | null | undefined
  title?: string | null | undefined
  /** Whether the host passes both changeTheme and changeLocale: the header then draws the controls. */
  controls?: boolean | undefined
  /** The host's theme before or without data, which the theme toggle shows then; "system" when absent. */
  theme?: Theme | undefined
}

/** initials is up to two letters of a name, for an avatar: the first and last words' first letters. */
export function initials(name: string | null): string | null {
  if (name === null) return null
  const words = name.trim().split(/\s+/).filter(w => w !== '')
  const first = words[0]
  if (first === undefined) return null
  const letter = (w: string) => Array.from(w)[0]?.toLocaleUpperCase() ?? ''
  const last = words.length > 1 ? words[words.length - 1] : undefined
  return letter(first) + (last === undefined ? '' : letter(last))
}

/** buildView is everything the shell draws for its props. */
export function buildView(input: ShellInput): ShellView {
  const data = input.result?.status === 'ready' ? input.result.data : null
  const other = data !== null && input.subject !== undefined && input.subject !== data.sub
  let mode: ShellMode
  if (input.result === null) mode = 'loading'
  else if (input.result.status !== 'ready') mode = input.result.status
  else mode = other ? 'other-account' : 'ready'
  const lang = mode === 'ready' && data !== null ? data.locale : input.locale
  const tx = (k: ShellKey, p?: Readonly<Record<string, string>>) => shellText(lang, k, p)
  const words = { skip: tx('skip'), menu: tx('menu'), closeMenu: tx('closeMenu'), newTab: tx('newTab') }
  const back = backLink(input, tx)
  const built = mode === 'ready' && data !== null ? readyView(input, data, lang, tx, back) : fallbackView(input, mode, lang, tx, back)
  return { mode, lang, words, ...built, tone: built.head.app?.color ?? 'indigo' }
}

type Tx = (k: ShellKey, p?: Readonly<Record<string, string>>) => string

function backLink(input: ShellInput, tx: Tx): HeadModel['back'] {
  const p = checkReturnPath(input.returnPath ?? null)
  return p === null ? null : { href: `${input.consoleOrigin}${p}`, label: tx('backToConsole') }
}

function workspaceName(w: ShellWorkspace, tx: Tx): string {
  return w.kind === 'personal' || w.name === null ? tx('personal') : w.name
}

function readyView(
  input: ShellInput,
  data: ShellData,
  lang: Locale,
  tx: Tx,
  back: HeadModel['back'],
): { menu: MenuModel; head: HeadModel } {
  const origin = input.consoleOrigin
  const place = input.place
  const { menu } = data
  const current = data.workspaces.find(w => w.id === input.workspace) ?? null
  const personal = data.workspaces.find(w => w.kind === 'personal') ?? data.workspaces[0] ?? null
  // Workspace links need a workspace: the current one, else the personal one.
  const linkWs = current ?? personal
  const linkId = linkWs?.id ?? null
  const role = current?.role ?? null

  const app = place.kind === 'app' ? (menu.apps.find(a => a.id === place.app) ?? null) : null
  const tab = place.kind === 'app' ? place.screen : null
  const aiTab = app !== null && tab === APP_AI_TAB
  const screen = app !== null && tab !== null && !aiTab ? (app.screens.find(s => s.id === tab) ?? null) : null
  const isSection = (s: ShellSection) => place.kind === 'console' && place.section === s.id
  const workspaceSection = place.kind === 'console' ? (menu.workspace.find(isSection) ?? null) : null
  const accountSection = place.kind === 'console' ? (menu.account.find(isSection) ?? (isSection(menu.profile) ? menu.profile : null)) : null
  // Any console page that is not one of a workspace's sections is the account's.
  const onAccount = place.kind === 'console' && workspaceSection === null

  const sectionLinks = (list: ShellSection[]): MenuLink[] =>
    list.flatMap(s => {
      const href = consoleURL(origin, s.path, linkId)
      if (href === null) return []
      const here: Current = isSection(s) ? 'page' : null
      return [{ id: s.id, href, label: localText(s.title, lang), current: here, icon: SECTION_ICONS[s.id] ?? 'dot', app: null, newTab: false, note: null }]
    })
  const appLinks: MenuLink[] = menu.apps.flatMap(a => {
    const href = consoleURL(origin, a.overview, linkId)
    if (href === null) return []
    // The entry leads to the overview: the page itself only there.
    let here: Current = null
    if (app?.id === a.id) here = tab === null ? 'page' : 'true'
    return [{ id: a.id, href, label: a.name, current: here, icon: null, app: { letter: a.letter, color: a.color, brand: appBrand(a.id) }, newTab: false, note: null }]
  })
  const groups: MenuGroup[] = [
    { id: 'workspace', label: tx('groupWorkspace'), app: null, links: sectionLinks(menu.workspace) },
    { id: 'account', label: tx('groupAccount'), app: null, links: sectionLinks(menu.account) },
    { id: 'apps', label: tx('groupApps'), app: null, links: appLinks },
  ].filter(g => g.links.length > 0)

  const general = menu.workspace.find(s => s.id === 'general') ?? menu.workspace[0] ?? null
  /** samePlaceIn is this page's place in another workspace: the same section, tab or screen, else its General. */
  const samePlaceIn = (wid: string): string | null => {
    if (workspaceSection !== null) return consoleURL(origin, workspaceSection.path, wid)
    if (app !== null) {
      if (aiTab) return consoleURL(origin, app.ai, wid)
      if (screen !== null) return screenURL(app, screen, wid)
      return consoleURL(origin, app.overview, wid)
    }
    return general === null ? `${origin}${menu.workspaces_path}` : consoleURL(origin, general.path, wid)
  }
  const item = (w: ShellWorkspace): WorkspaceItem => {
    const name = workspaceName(w, tx)
    // On an account page the item leads to the workspace's General, not here.
    let here: Current = null
    if (current?.id === w.id) here = onAccount ? 'true' : 'page'
    return {
      id: w.id,
      href: samePlaceIn(w.id),
      name,
      detail: `${w.kind === 'personal' ? tx('personal') : tx('team')} · ${tx(`role.${w.role}`)}`,
      initial: Array.from(name)[0]?.toLocaleUpperCase() ?? '?',
      personal: w.kind === 'personal',
      current: here,
    }
  }
  const selector: WorkspaceSelector | null =
    linkWs === null
      ? null
      : {
          label: tx('workspaceLabel'),
          switchLabel: tx('switchWorkspace'),
          // A workspace the person does not have is never shown as chosen.
          shown: current === null ? null : item(current),
          chooseLabel: tx('chooseWorkspace'),
          items: data.workspaces.map(item),
          allHref: `${origin}${menu.workspaces_path}`,
          allLabel: tx('allWorkspaces'),
        }

  const profile: ProfileLink = {
    href: `${origin}${menu.profile.path}`,
    name: data.display_name,
    initials: initials(data.display_name),
    label: localText(menu.profile.title, lang),
    current: isSection(menu.profile),
  }

  // The header.
  let label: string
  if (workspaceSection !== null) label = localText(workspaceSection.title, lang)
  else if (accountSection !== null) label = localText(accountSection.title, lang)
  else if (place.kind === 'console' && place.section === 'workspaces') label = tx('workspaces')
  else if (app !== null) label = app.name
  else label = input.title !== undefined && input.title !== null && input.title !== '' ? input.title : tx('brand')
  let title = label
  if (screen !== null) title = localText(screen.title, lang)
  else if (aiTab && app !== null) title = tx('aiIn', { app: app.name })
  if (input.title !== undefined && input.title !== null && input.title !== '') title = input.title
  // Console / {workspace, or Sua conta on an account page} / {page}.
  const crumb = [tx('brand')]
  if (onAccount) crumb.push(tx('yourAccount'))
  else if (current !== null) crumb.push(workspaceName(current, tx))
  if (label !== tx('brand')) crumb.push(label)

  const tabs: HeadLink[] = []
  if (app !== null) {
    const overview = consoleURL(origin, app.overview, linkId)
    if (overview !== null) tabs.push({ id: 'overview', href: overview, label: tx('overview'), current: tab === null, newTab: false, note: null })
    const ai = consoleURL(origin, app.ai, linkId)
    if (ai !== null) tabs.push({ id: APP_AI_TAB, href: ai, label: tx('ai'), current: aiTab, newTab: false, note: null })
    if (app.in_shell) {
      for (const s of visibleScreens(app, role)) {
        const href = screenURL(app, s, linkId)
        if (href === null) continue
        tabs.push(screenTab(s, href, screen?.id === s.id, lang))
      }
    } else {
      // Its screens are one page of its own until it serves them in the
      // shell: one tab opens it, rather than one per screen it does not
      // serve yet.
      const page = app.screens[0]
      const href = page === undefined ? null : screenURL(app, page, linkId)
      if (href !== null) tabs.push({ id: 'open', href, label: tx('openApp', { app: app.name }), current: false, newTab: true, note: tx('opensInApp') })
    }
  }

  return {
    menu: {
      brandHref: `${origin}${menu.workspaces_path}`,
      brandLabel: tx('home'),
      navLabel: tx('nav'),
      selector,
      groups,
      profile,
      signOut: { href: signOutURL(origin), label: tx('signOut') },
    },
    head: {
      crumbLabel: tx('breadcrumb'),
      crumb,
      title,
      app: app === null ? null : { letter: app.letter, color: app.color, brand: appBrand(app.id) },
      tabsLabel: app === null ? '' : tx('screensOf', { app: app.name }),
      tabs,
      back,
      notice: null,
      appearance: input.controls === true ? null : { href: `${origin}${menu.profile.path}`, label: tx('appearance'), current: isSection(menu.profile) },
      controls: input.controls === true ? { theme: data.theme, locale: data.locale } : null,
    },
  }
}

function screenTab(s: ShellScreen, href: string, current: boolean, lang: Locale): HeadLink {
  return { id: s.id, href, label: localText(s.title, lang), current, newTab: false, note: null }
}

function fallbackView(
  input: ShellInput,
  mode: ShellMode,
  lang: Locale,
  tx: Tx,
  back: HeadModel['back'],
): { menu: MenuModel; head: HeadModel } {
  const origin = input.consoleOrigin
  const place = input.place
  const fb = input.fallback ?? null
  const screenId = place.kind === 'app' ? place.screen : null
  const groups: MenuGroup[] =
    fb === null
      ? []
      : [
          {
            id: 'app',
            label: fb.name,
            app: { letter: fb.letter, color: fb.color, brand: appBrand(fb.app) },
            links: fb.screens.map(s => ({
              id: s.id,
              href: s.href,
              label: s.title,
              current: screenId === s.id ? ('page' as const) : null,
              icon: null,
              app: null,
              newTab: false,
              note: null,
            })),
          },
        ]
  const screen = fb?.screens.find(s => s.id === screenId) ?? null
  let title = screen?.title ?? fb?.name ?? tx('brand')
  if (input.title !== undefined && input.title !== null && input.title !== '') title = input.title

  let notice: HeadModel['notice'] = null
  if (mode === 'signed-out') {
    const hop = place.kind === 'app' ? hopPath(place.app, place.screen, input.workspace) : '/workspaces'
    notice = { kind: 'signed-out', text: tx('signedOut'), href: signInURL(origin, hop, lang), link: tx('signIn') }
  } else if (mode === 'unavailable' || mode === 'other-account') {
    notice = { kind: mode, text: tx(mode === 'unavailable' ? 'unavailable' : 'otherAccount'), href: `${origin}/`, link: tx('openConsole') }
  }

  return {
    menu: {
      brandHref: `${origin}/`,
      brandLabel: tx('home'),
      navLabel: tx('nav'),
      selector: null,
      groups,
      profile: null,
      signOut: null,
    },
    head: {
      crumbLabel: tx('breadcrumb'),
      crumb: fb === null ? [tx('brand')] : [tx('brand'), fb.name],
      title,
      app: fb === null ? null : { letter: fb.letter, color: fb.color, brand: appBrand(fb.app) },
      tabsLabel: '',
      tabs: [],
      back,
      notice,
      appearance: null,
      controls: input.controls === true ? { theme: input.theme ?? 'system', locale: input.locale } : null,
    },
  }
}
