// What the shell draws, worked out from its props (shell contract 3.3) as
// plain data, so the component only renders it and the rules can be tested
// without a page:
//   - with data: the brand, the workspace selector, the groups Espaço (the
//     workspace's sections), Apps (one entry per app, to its overview) and
//     Minha conta (since 1.6.0: Perfil, the data's account pages, Minhas
//     compras among them, then Segurança, id.'s account page, when the data
//     names one), and a header with the title (the h1 and the menu's current
//     link say where the person is: there is no breadcrumb since 1.3.0), the
//     theme toggle and the language menu when the host can keep a change (it
//     passes both handlers), then the avatar, and, for an app, its tabs: the
//     overview, the console's AI tab, then each screen the person's role
//     reaches, or one tab that opens the app's own page while it is not in
//     the shell;
//   - the avatar's menu (since 1.6.0): the person's initials and name, the
//     Minha conta group's links, "Aparência e idioma" (a link to the
//     profile) for a host that cannot keep a change, and "Sair", to the
//     console's sign-out page; under 900 px the theme and the language too,
//     for a host that can (Shell.vue's AvatarMenu decides the width);
//   - while the data loads with a kept answer the host passes (initial,
//     since 1.4.0; decision 0047): the kept answer drawn as data, in the
//     host's language, when it is for the host's console origin and, on an
//     app, for the app session's own person (subject); read-only when the
//     host says so (the console, until its fresh answer arrives): every link
//     keeps its href but follows nothing, and the selector does not open;
//   - while the data loads (result null): a quiet column, the brand alone,
//     with no selector or group, so the column fills once when the data
//     arrives rather than drawing the app's own links and swapping them for
//     the console's; the header keeps the app's mark and name and the
//     host's title, as without data, and draws no avatar. With no fallback
//     (the console's pages of an app), a product of the kit named by the
//     place is drawn as its symbol and written name, from the kit alone;
//   - without data (signed out, the console not answering, or another
//     person's console): the app's own menu, a notice and one link, and no
//     avatar: nothing of the person.
// A link is current as the page shown (aria-current="page") only when it
// leads to that page; the app's entry while one of its screens shows, and
// the workspace on an account page, are where the person is ("true").
// Every href is built by paths.ts, or is the data's checked
// account_security_url; every word is the data's, i18n.ts's, or, while
// loading, a product of the kit's own written name (brand/marks.ts).

import { NAMES, PRODUCT_BRAND_IDS, type ProductBrandId } from './brand/marks.js'
import { type ShellKey, localText, shellText } from './i18n.js'
import { APP_AI_TAB, checkReturnPath, consoleHomeURL, consoleURL, hopPath, screenURL, signInURL, signOutURL, visibleScreens } from './paths.js'
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
  account: 'person',
  purchases: 'receipt',
  security: 'shield',
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
  /** Whether every workspace's page (workspaces_path) is the page shown. */
  allCurrent: boolean
}

export interface MenuModel {
  /**
   * The kept answer drawn read-only (since 1.4.0): every link keeps its
   * href but follows nothing, and the workspace selector does not open.
   */
  readOnly: boolean
  /** While the shell's data loads: the column draws the brand alone, with no selector or group. */
  loading: boolean
  brandHref: string
  brandLabel: string
  navLabel: string
  selector: WorkspaceSelector | null
  groups: MenuGroup[]
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

/**
 * AvatarModel is the header's avatar and its menu (since 1.6.0, in place of
 * the side menu's foot and of 1.3.0's account panel): the person's initials
 * and name, then the Minha conta group's links, "Aparência e idioma" for a
 * host that cannot keep a change, and "Sair". Drawn only with data.
 */
export interface AvatarModel {
  /** The person's display name, drawn beside the circle at 900 px and wider; null without one. */
  name: string | null
  /** Up to two letters for the circle (initials), or null for the neutral person glyph. */
  initials: string | null
  /** The button's own words, before the name: "Sua conta". */
  label: string
  /** Whether one of the group's links is the page shown: the button is highlighted. */
  current: boolean
  /** The Minha conta group's links, as the side menu draws them. */
  items: MenuLink[]
  /** "Aparência e idioma", a link to the profile, for a host that passes no handlers (an app); null for one that does. */
  appearance: { href: string; label: string; current: boolean } | null
  /**
   * Under 900 px, for a host that passes both handlers, the menu holds the
   * theme toggle and the language's flag in one row: the row's name
   * ("Aparência e idioma"), and the words of the language's dialog, its
   * title ("Idioma") and its close button ("Fechar").
   */
  prefsLabel: string
  languageLabel: string
  closeLabel: string
  /** "Sair": the console's sign-out page, or the host's own sign-out (Shell.vue's signOut). */
  signOut: { href: string; label: string }
}

export interface HeadModel {
  title: string
  app: AppMark | null
  tabsLabel: string
  tabs: HeadLink[]
  back: { href: string; label: string } | null
  notice: { kind: 'signed-out' | 'unavailable' | 'other-account'; text: string; href: string; link: string } | null
  /**
   * The theme toggle and the language menu, when the host passes both
   * handlers: what they show is the data's theme and language, or, before
   * or without data, "system" and the host's language. At 900 px and wider
   * the header draws them; under it the avatar's menu does.
   */
  controls: { theme: Theme; locale: Locale } | null
  /** The avatar and its menu: null without data (loading, signed out, unavailable, another person's console). */
  avatar: AvatarModel | null
}

/**
 * ShellMode is what the shell draws from: the data (ready), a kept answer
 * while the data loads (kept, since 1.4.0), nothing yet (loading), or no
 * data (signed-out, unavailable, other-account).
 */
export type ShellMode = 'loading' | 'kept' | 'ready' | 'signed-out' | 'unavailable' | 'other-account'

export interface ShellView {
  mode: ShellMode
  lang: Locale
  menu: MenuModel
  head: HeadModel
  /** The page's color: an app's own on its pages, else the console's indigo (tokens.css, .thc-tone-*). */
  tone: AppColor
  /** Whether a kept answer is drawn read-only (MenuModel.readOnly). */
  readOnly: boolean
  /** Words the component needs around the model. */
  words: { skip: string; menu: string; closeMenu: string; newTab: string; loading: string }
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
  /**
   * The kept answer the host passes while result is null (decision 0047):
   * drawn only when it is for consoleOrigin and, when subject is given, for
   * that person; a host with its own menu (an app: fallback) gets it drawn
   * only with a subject. A result that is not null replaces it.
   */
  initial?: ShellData | null | undefined
  /** Whether a kept answer is drawn read-only (the console, until its fresh answer arrives). */
  readOnly?: boolean | undefined
}

/**
 * initials is up to two letters of a display name, for the avatar's circle
 * (since 1.6.0): the name in NFC, then the first letter of its first word
 * and of its last word (one letter for a one-word name), each upper-cased
 * in the person's language. A word's letter is its first letter or digit,
 * so a parenthesis or a quote before it does not stand in for it. A name
 * with no letter at all is null: the circle then holds the neutral glyph.
 */
export function initials(name: string | null, locale: Locale = 'en'): string | null {
  if (name === null) return null
  const words = name.normalize('NFC').trim().split(/\s+/).filter(w => w !== '')
  const letter = (w: string | undefined) => (w === undefined ? '' : (/[\p{L}\p{N}]/u.exec(w)?.[0] ?? '').toLocaleUpperCase(locale))
  const first = letter(words[0])
  const last = words.length > 1 ? letter(words[words.length - 1]) : ''
  const out = first + last
  return out === '' ? null : out
}

/**
 * keptData is the kept answer the shell may draw while the data loads: the
 * host's initial, when it is for the host's console origin and for the
 * app session's own person. A host with its own menu (an app) passes a
 * subject for it to be drawn at all; the console passes neither.
 */
function keptData(input: ShellInput): ShellData | null {
  const k = input.initial ?? null
  if (input.result !== null || k === null || k.console_origin !== input.consoleOrigin) return null
  if (input.subject !== undefined) return input.subject === k.sub ? k : null
  return input.fallback === undefined ? k : null
}

/** buildView is everything the shell draws for its props. */
export function buildView(input: ShellInput): ShellView {
  const kept = keptData(input)
  const data = input.result?.status === 'ready' ? input.result.data : kept
  const other = input.result?.status === 'ready' && input.subject !== undefined && input.subject !== input.result.data.sub
  let mode: ShellMode
  if (input.result === null) mode = kept === null ? 'loading' : 'kept'
  else if (input.result.status !== 'ready') mode = input.result.status
  else mode = other ? 'other-account' : 'ready'
  // A kept answer speaks the host's language, which the host set from it
  // (an app) or remembers (the console): a choice made while signed out
  // never disagrees with the menu.
  const lang = mode === 'ready' && data !== null ? data.locale : input.locale
  const tx = (k: ShellKey, p?: Readonly<Record<string, string>>) => shellText(lang, k, p)
  const words = { skip: tx('skip'), menu: tx('menu'), closeMenu: tx('closeMenu'), newTab: tx('newTab'), loading: tx('loading') }
  const back = backLink(input, tx)
  let built: { menu: MenuModel; head: HeadModel }
  if (mode === 'ready' && data !== null) built = readyView(input, data, lang, tx, back)
  else if (mode === 'kept' && data !== null) built = readyView(input, data, lang, tx, back, { theme: input.theme ?? data.theme, locale: input.locale })
  else if (mode === 'loading') built = loadingView(input, tx, back)
  else built = fallbackView(input, mode, lang, tx, back)
  const readOnly = mode === 'kept' && input.readOnly === true
  const menu: MenuModel = { ...built.menu, readOnly }
  return { mode, lang, words, menu, head: built.head, tone: built.head.app?.color ?? 'indigo', readOnly }
}

type Tx = (k: ShellKey, p?: Readonly<Record<string, string>>) => string

function backLink(input: ShellInput, tx: Tx): HeadModel['back'] {
  const p = checkReturnPath(input.returnPath ?? null)
  return p === null ? null : { href: `${input.consoleOrigin}${p}`, label: tx('backToConsole') }
}

function workspaceName(w: ShellWorkspace, tx: Tx): string {
  return w.kind === 'personal' || w.name === null ? tx('personal') : w.name
}

/**
 * readyView is the shell drawn from data: the fresh answer, or a kept one,
 * whose header controls show the host's theme and language (shown) rather
 * than the kept ones.
 */
function readyView(
  input: ShellInput,
  data: ShellData,
  lang: Locale,
  tx: Tx,
  back: HeadModel['back'],
  shown: { theme: Theme; locale: Locale } = { theme: data.theme, locale: data.locale },
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
  // Minha conta (since 1.6.0): Perfil (the data's profile), the account's
  // pages, then Segurança, id.'s account page, when the data names one.
  const security = data.account_security_url ?? null
  const accountLinks: MenuLink[] = [
    ...sectionLinks([menu.profile, ...menu.account]),
    ...(security === null
      ? []
      : [{ id: 'security', href: security, label: tx('security'), current: null, icon: SECTION_ICONS['security'] ?? 'dot', app: null, newTab: false, note: null }]),
  ]
  const groups: MenuGroup[] = [
    { id: 'workspace', label: tx('groupWorkspace'), app: null, links: sectionLinks(menu.workspace) },
    { id: 'apps', label: tx('groupApps'), app: null, links: appLinks },
    { id: 'account', label: tx('groupAccount'), app: null, links: accountLinks },
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
          allCurrent: place.kind === 'console' && place.section === 'workspaces',
        }

  const profileHref = `${origin}${menu.profile.path}`
  const avatar: AvatarModel = {
    name: data.display_name,
    initials: initials(data.display_name, lang),
    label: tx('yourAccount'),
    current: accountLinks.some(l => l.current === 'page'),
    items: accountLinks,
    appearance: input.controls === true ? null : { href: profileHref, label: tx('appearance'), current: isSection(menu.profile) },
    prefsLabel: tx('appearance'),
    languageLabel: tx('language'),
    closeLabel: tx('close'),
    signOut: { href: signOutURL(origin), label: tx('signOut') },
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
      readOnly: false,
      loading: false,
      brandHref: `${origin}${menu.workspaces_path}`,
      brandLabel: tx('home'),
      navLabel: tx('nav'),
      selector,
      groups,
    },
    head: {
      title,
      app: app === null ? null : { letter: app.letter, color: app.color, brand: appBrand(app.id) },
      tabsLabel: app === null ? '' : tx('screensOf', { app: app.name }),
      tabs,
      back,
      notice: null,
      controls: input.controls === true ? shown : null,
      avatar,
    },
  }
}

function screenTab(s: ShellScreen, href: string, current: boolean, lang: Locale): HeadLink {
  return { id: s.id, href, label: localText(s.title, lang), current, newTab: false, note: null }
}

/**
 * fallbackHead is the header without data: the app's own mark (the
 * fallback's), and its screen's title or the host's. A product of the kit
 * is also named there, by its written name; any other app only by its
 * letter (since 1.3.0 there is no breadcrumb to name it). The mark stands in
 * for the fallback's when the loading view draws one of its own.
 */
function fallbackHead(
  input: ShellInput,
  tx: Tx,
  back: HeadModel['back'],
  notice: HeadModel['notice'],
  own: { mark: AppMark; name: string } | null = null,
): HeadModel {
  const place = input.place
  const fb = input.fallback ?? null
  const screenId = place.kind === 'app' ? place.screen : null
  const screen = fb?.screens.find(s => s.id === screenId) ?? null
  let title = screen?.title ?? fb?.name ?? own?.name ?? tx('brand')
  if (input.title !== undefined && input.title !== null && input.title !== '') title = input.title
  let app: AppMark | null = null
  if (fb !== null) app = { letter: fb.letter, color: fb.color, brand: appBrand(fb.app) }
  else if (own !== null) app = own.mark
  return {
    title,
    app,
    tabsLabel: '',
    tabs: [],
    back,
    notice,
    controls: input.controls === true ? { theme: input.theme ?? 'system', locale: input.locale } : null,
    avatar: null,
  }
}

/**
 * placeMark is the mark and name of the app a page is in, drawn without
 * data: a product of the kit that the place names, as the kit draws and
 * writes it (never a value of the data's), in the console's tone until the
 * data names the app's color. Any other place has none.
 */
function placeMark(place: ShellPlace): { mark: AppMark; name: string } | null {
  if (place.kind !== 'app') return null
  const brand = appBrand(place.app)
  if (brand === null) return null
  const name = NAMES[brand].label
  return { mark: { letter: Array.from(name)[0]?.toLocaleUpperCase() ?? '', color: 'indigo', brand }, name }
}

/**
 * loadingView is what the shell draws while its data loads: the brand
 * alone in the column, and the header without data. No fallback link is
 * drawn, since the console's menu may replace it a moment later; the
 * fallback's mark (and a kit product's written name) stays in the header,
 * where the data draws the same. A host with no fallback (the console, on its pages of an app) gets
 * the mark and name of the product of the kit its place names.
 */
function loadingView(input: ShellInput, tx: Tx, back: HeadModel['back']): { menu: MenuModel; head: HeadModel } {
  const own = input.fallback === undefined ? placeMark(input.place) : null
  return {
    menu: {
      readOnly: false,
      loading: true,
      brandHref: consoleHomeURL(input.consoleOrigin, input.locale, input.theme),
      brandLabel: tx('home'),
      navLabel: tx('nav'),
      selector: null,
      groups: [],
    },
    head: fallbackHead(input, tx, back, null, own),
  }
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

  let notice: HeadModel['notice'] = null
  if (mode === 'signed-out') {
    const hop = place.kind === 'app' ? hopPath(place.app, place.screen, input.workspace) : '/workspaces'
    notice = { kind: 'signed-out', text: tx('signedOut'), href: signInURL(origin, hop, lang, input.theme), link: tx('signIn') }
  } else if (mode === 'unavailable' || mode === 'other-account') {
    const href = consoleHomeURL(origin, lang, input.theme)
    notice = { kind: mode, text: tx(mode === 'unavailable' ? 'unavailable' : 'otherAccount'), href, link: tx('openConsole') }
  }

  return {
    menu: {
      readOnly: false,
      loading: false,
      brandHref: consoleHomeURL(origin, lang, input.theme),
      brandLabel: tx('home'),
      navLabel: tx('nav'),
      selector: null,
      groups,
    },
    head: fallbackHead(input, tx, back, notice),
  }
}
