<script setup lang="ts">
// ThcShell: the side menu, the header and the look that the console and
// every app draw (decision 0033, shell contract 3). The console draws it
// around its own pages; an app around its settings screens, on its own
// origin. What it draws is menu.ts's, from the props alone. A host draws it
// from its page's first frame: while the data loads (result null) the side
// column holds the brand alone and the header the app's mark and name, and
// the same component then fills in, without drawing again what it already
// shows.
//
// The rules it enforces:
//   - every link is a plain <a href>: no window.open, no postMessage, no
//     frames. A click on a link to this document's own origin goes through
//     the host's navigate when it passes one (the console's router); any
//     other link is the browser's navigation;
//   - text is interpolated, never parsed as HTML; colors are classes (the
//     pages' CSP is style-src 'self'), so no value from the data reaches CSS;
//   - nothing is stored, and nothing runs on a timer: the only listeners are
//     the selector's, the language menu's and the account panel's outside
//     clicks while they are open, the drawer's width, the theme toggle's
//     system scheme, each symbol's mouse on its hover host, and the
//     window's click (to see that the browser follows a link, below) and
//     pageshow;
//   - under 900 px the menu is a modal <dialog> behind the header's menu
//     button (one header row, as Wappie's console: the button, the title,
//     the host's actions and the account button):
//     Escape, the close button or any link closes it, and focus returns to
//     the button, except after a link the host routes (navigate): the host
//     then puts focus on its new page, and the dialog's close event, which
//     the browser fires later as a task of its own, must not take it back;
//   - under 900 px the header's theme toggle, language menu and "Aparência
//     e idioma" are not drawn (display: none): the account button at the
//     right (the person's avatar) opens a panel instead, a disclosure
//     (aria-expanded, aria-controls while open) with the profile, the
//     workspace shown (to every workspace), then the theme and the
//     language, or "Aparência e idioma". Escape closes it back to its
//     button and goes no further, and a click outside, focus leaving it or
//     any link closes it. At 900 px and wider the button is not drawn;
//   - the header has no breadcrumb (since 1.3.0): the h1 and the menu's
//     current link say where the person is. The h1 takes focus by script,
//     for screen readers, at each page (the host's router; tabindex -1),
//     and draws no focus ring, since it is no control;
//   - an app's tabs scroll sideways when they overflow, and only they do:
//     no scrollbar, an edge fade where the browser can tell the scroll
//     position in CSS (scroll-driven animations), and the current tab
//     scrolled into view when the shell is drawn and whenever it changes;
//   - a link the browser follows (not one the host routes, opens in a new
//     tab or window, or that a modified click opens elsewhere, nor a
//     fragment of this page) marks the page as leaving: the content area
//     gives way to a loading mark ("Carregando…", a status, aria-busy on
//     the content) until the document goes, while the menu and the header
//     stay as they are; a page the browser brings back from its
//     back/forward cache (pageshow, persisted) drops the mark;
//   - "Sair" at the foot of the menu is the host's (the console puts its
//     own button there); a host that puts nothing there gets the shell's
//     link to the console's sign-out page, with data (ShellMenu.vue);
//   - on an app's pages the title row is the app's: for a product of the
//     kit, its symbol and its written name as the kit's contours inside the
//     h1, whose text stays as hidden text (the page's name for assistive
//     technology, and what the host's focus lands on); the current tab, or
//     the menu's current entry, says which of the app's pages this is. Any
//     other app keeps its letter badge beside the h1's text;
//   - the header's theme toggle and language menu (controls/) are drawn
//     only for a host that passes both changeTheme and changeLocale, a host
//     that can keep the change; any other keeps "Aparência e idioma", the
//     link to Minha conta. They show the data's theme and language (or,
//     without data, the host's theme and locale), which the host patches
//     when it shows a change, and again if it puts one back.
//
// It never applies the theme or the language on its own: a host calls
// applyTheme, and changes its own language.
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import ThcMark from './brand/ThcMark.vue'
import ThcName from './brand/ThcName.vue'
import ThcLanguageMenu from './controls/ThcLanguageMenu.vue'
import ThcThemeToggle from './controls/ThcThemeToggle.vue'
import { buildView } from './menu.js'
import ShellMenu from './ShellMenu.vue'
import type { Locale, ShellFallback, ShellPlace, ShellResult, Theme } from './types.js'

const props = withDefaults(
  defineProps<{
    /** The host's configured console origin; every console link uses it. */
    consoleOrigin: string
    /** null while loading: the column draws the brand alone, and the header as without data. */
    result: ShellResult | null
    place: ShellPlace
    /** The current workspace, or null on account pages. */
    workspace: string | null
    /** The host's language before or without data. */
    locale: Locale
    /** The app session's sub: apps pass it, the console does not. */
    subject?: string
    /** The app's own menu, drawn without data; while loading, only its mark and name, in the header. */
    fallback?: ShellFallback
    /** An already-checked console path: "Voltar ao console" goes there. */
    returnPath?: string | null
    /** How the host routes a link to its own origin. */
    navigate?: (path: string) => void
    /** The h1's text when the host names the page itself (a page that is not found); else the shell names it. */
    title?: string | null
    /** What a theme chosen in the header does; with changeLocale, the header draws the controls. */
    changeTheme?: (theme: Theme) => void
    /** What a language chosen in the header does; with changeTheme, the header draws the controls. */
    changeLocale?: (locale: Locale) => void
    /** The host's theme before or without data (signed out, the console not answering): the theme toggle shows it then. */
    theme?: Theme
  }>(),
  { subject: undefined, fallback: undefined, returnPath: null, navigate: undefined, title: null, changeTheme: undefined, changeLocale: undefined, theme: undefined },
)

const view = computed(() =>
  buildView({
    consoleOrigin: props.consoleOrigin,
    result: props.result,
    place: props.place,
    workspace: props.workspace,
    locale: props.locale,
    subject: props.subject,
    fallback: props.fallback,
    returnPath: props.returnPath,
    title: props.title,
    controls: props.changeTheme !== undefined && props.changeLocale !== undefined,
    theme: props.theme,
  }),
)

function onTheme(theme: Theme): void {
  props.changeTheme?.(theme)
}

function onLocale(locale: Locale): void {
  props.changeLocale?.(locale)
}

/**
 * brandTitle says the h1 is the app's written name as the kit's contours: on
 * a kit product's own pages, where the shell names the page. A page the host
 * names itself (a page that is not found) keeps its words visible, with the
 * app's symbol beside them.
 */
const brandTitle = computed(() => Boolean(view.value.head.app?.brand) && props.title === null)

const uid = useId()
const main = ref<HTMLElement | null>(null)
const drawer = ref<HTMLDialogElement | null>(null)
const menuButton = ref<HTMLButtonElement | null>(null)
const drawerOpen = ref(false)
/** routed says the drawer is closing for a link the host routes: the host moves focus, not the close event. */
let routed = false

function skip(): void {
  main.value?.focus()
}

function openDrawer(): void {
  const d = drawer.value
  if (d === null || drawerOpen.value) return
  drawerOpen.value = true
  if (typeof d.showModal === 'function') d.showModal()
  else d.setAttribute('open', '')
}

function closeDrawer(): void {
  const d = drawer.value
  if (d !== null && d.open) d.close()
  else drawerClosed()
}

/**
 * drawerClosed is the dialog's close event, however it closed: focus goes
 * back to the button, unless the host has routed a link and owns focus.
 */
function drawerClosed(): void {
  if (!drawerOpen.value) return
  drawerOpen.value = false
  if (routed) {
    routed = false
    return
  }
  menuButton.value?.focus()
}

function onCancel(event: Event): void {
  event.preventDefault()
  closeDrawer()
}

function onDrawerKey(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return
  event.preventDefault()
  closeDrawer()
}

/** A click on the backdrop lands on the dialog itself, outside its panel. */
function onDrawerClick(event: MouseEvent): void {
  if (event.target === drawer.value) closeDrawer()
}

/** samePath is a link's path, query and fragment when it is on this document's origin, else null. */
function samePath(href: string): string | null {
  const here = globalThis.location
  if (here === undefined) return null
  try {
    const u = new URL(href, here.href)
    return u.origin === here.origin ? `${u.pathname}${u.search}${u.hash}` : null
  } catch {
    return null
  }
}

/** routedPath is the path navigate takes for this click, or null when the browser follows the link. */
function routedPath(event: MouseEvent, href: string): string | null {
  if (props.navigate === undefined || event.defaultPrevented || event.button !== 0) return null
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null
  const target = (event.currentTarget as HTMLAnchorElement | null)?.getAttribute?.('target')
  if (target === '_blank') return null
  return samePath(href)
}

/**
 * leaves says the browser itself will follow this click to another
 * document: a plain click with the main button, on a link that opens here
 * (no target of its own, no download), to an http(s) address that is not a
 * fragment of this same page. A link the host routes never gets here.
 */
function leaves(event: MouseEvent, href: string): boolean {
  if (event.defaultPrevented || event.button !== 0) return false
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false
  const a = event.currentTarget as HTMLAnchorElement | null
  const target = a?.getAttribute?.('target') ?? ''
  if ((target !== '' && target !== '_self') || a?.hasAttribute?.('download') === true) return false
  const here = globalThis.location
  if (here === undefined) return false
  try {
    const u = new URL(href, here.href)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
    return !(u.hash !== '' && u.origin === here.origin && u.pathname === here.pathname && u.search === here.search)
  } catch {
    return false
  }
}

/** leaving says the browser is following one of the shell's links: the content area shows the loading mark. */
const leaving = ref(false)
/** pending is the click that may leave, until it has reached the window unprevented. */
let pending: Event | null = null

/** follow is every link's click: the panel and the drawer close, and a link to this origin goes through navigate. */
function follow(event: MouseEvent, href: string): void {
  const path = routedPath(event, href)
  // A link to the page already shown changes no page, so nothing else takes
  // focus: the panel gives it back to its button.
  const here = (event.currentTarget as HTMLElement | null)?.getAttribute?.('aria-current') === 'page'
  closeAccount(here)
  if (drawerOpen.value) {
    routed = path !== null
    closeDrawer()
  }
  if (path !== null && props.navigate !== undefined) {
    event.preventDefault()
    dropLeaving()
    props.navigate(path)
    return
  }
  pending = leaves(event, href) ? event : null
}

/** dropLeaving gives the page back: the browser did not go (stopped, refused) or the host routed. */
function dropLeaving(): void {
  pending = null
  leaving.value = false
}
// While the mark shows, the next key or press in this page means the
// browser did not go (the person stopped it, or refused to leave): the page
// is theirs again.
watch(leaving, now => {
  if (now) {
    document.addEventListener('keydown', dropLeaving, true)
    document.addEventListener('pointerdown', dropLeaving, true)
  } else {
    document.removeEventListener('keydown', dropLeaving, true)
    document.removeEventListener('pointerdown', dropLeaving, true)
  }
})

/**
 * onWindowClick is the end of a click's way up: a link's click that nothing
 * prevented on its way (the host's own handlers included) is one the
 * browser now follows.
 */
function onWindowClick(event: Event): void {
  if (event !== pending) return
  pending = null
  if (!event.defaultPrevented) leaving.value = true
}

/** onPageShow drops the mark when the browser brings this page back from its back/forward cache. */
function onPageShow(event: PageTransitionEvent): void {
  if (event.persisted) dropLeaving()
}

// The account button's panel, under 900 px.
const account = ref<HTMLElement | null>(null)
const accountButton = ref<HTMLButtonElement | null>(null)
const accountOpen = ref(false)

function closeAccount(focusButton: boolean): void {
  if (!accountOpen.value) return
  accountOpen.value = false
  if (focusButton) accountButton.value?.focus()
}

function toggleAccount(): void {
  if (accountOpen.value) closeAccount(false)
  else accountOpen.value = true
}

/** onAccountKey: this Escape is the panel's alone, and focus goes back to its button. */
function onAccountKey(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || !accountOpen.value) return
  event.preventDefault()
  event.stopPropagation()
  closeAccount(true)
}

/** onAccountFocusOut closes the panel when focus moves on to anything outside it. */
function onAccountFocusOut(event: FocusEvent): void {
  const to = event.relatedTarget as Node | null
  if (to !== null && account.value !== null && !account.value.contains(to)) closeAccount(false)
}

function onAccountOutside(event: Event): void {
  if (account.value !== null && !account.value.contains(event.target as Node)) closeAccount(false)
}

watch(accountOpen, now => {
  if (now) document.addEventListener('click', onAccountOutside, true)
  else document.removeEventListener('click', onAccountOutside, true)
})
// Another page (a host's route, the browser's history) closes it; an equal
// place drawn again (a host's new object for the same page) does not.
const placeKey = computed(() => {
  const p = props.place
  const where = p.kind === 'app' ? `app:${p.app}:${p.screen ?? ''}` : `console:${p.section}`
  return `${where}|${props.workspace ?? ''}`
})
watch(placeKey, () => {
  closeAccount(false)
  dropLeaving()
})

// The current tab, scrolled into its row when the shell is drawn and when it
// changes: the row is drawn again for another app (its key), so it starts
// at its first tab.
const tabsNav = ref<HTMLElement | null>(null)
const currentTab = computed(() => view.value.head.tabs.find(t => t.current)?.href ?? null)
const tabsKey = computed(() => (props.place.kind === 'app' ? `app:${props.place.app}` : 'console'))

function showCurrentTab(): void {
  const el = tabsNav.value?.querySelector<HTMLElement>('[aria-current="page"]')
  el?.scrollIntoView?.({ block: 'nearest', inline: 'center' })
}

watch(currentTab, showCurrentTab, { flush: 'post' })

// A drawer left open while the window grows past the breakpoint would keep
// the page inert behind a menu nobody sees; the account panel's button is
// not drawn there.
let wide: MediaQueryList | null = null
function onWide(e: MediaQueryListEvent): void {
  if (!e.matches) return
  closeDrawer()
  closeAccount(false)
}
onMounted(() => {
  wide = globalThis.matchMedia?.('(min-width: 900px)') ?? null
  wide?.addEventListener?.('change', onWide)
  window.addEventListener('click', onWindowClick)
  window.addEventListener('pageshow', onPageShow)
  showCurrentTab()
})
onBeforeUnmount(() => {
  wide?.removeEventListener?.('change', onWide)
  window.removeEventListener('click', onWindowClick)
  window.removeEventListener('pageshow', onPageShow)
  document.removeEventListener('click', onAccountOutside, true)
  document.removeEventListener('keydown', dropLeaving, true)
  document.removeEventListener('pointerdown', dropLeaving, true)
})
</script>

<template>
  <div class="thc-shell" :class="`thc-tone-${view.tone}`" :lang="view.lang" data-test="shell" :data-shell="view.mode" :data-tone="view.tone">
    <a class="thc-shell-skip" href="#thc-shell-main" @click.prevent="skip">{{ view.words.skip }}</a>

    <aside class="thc-shell-side">
      <ShellMenu :model="view.menu" :new-tab="view.words.newTab" @follow="follow">
        <template #footer><slot name="menu-footer" /></template>
      </ShellMenu>
    </aside>

    <dialog
      ref="drawer"
      class="thc-shell-drawer"
      :aria-label="view.menu.navLabel"
      data-test="shell-drawer"
      @close="drawerClosed"
      @cancel="onCancel"
      @keydown="onDrawerKey"
      @click="onDrawerClick"
    >
      <div class="thc-shell-drawer-panel">
        <button type="button" class="thc-shell-close" data-test="shell-close" @click="closeDrawer">
          <svg class="thc-shell-icon thc-shell-icon-lg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" /></svg>
          <span class="thc-shell-hidden">{{ view.words.closeMenu }}</span>
        </button>
        <ShellMenu v-if="drawerOpen" :model="view.menu" :new-tab="view.words.newTab" @follow="follow">
          <template #footer><slot name="menu-footer" /></template>
        </ShellMenu>
      </div>
    </dialog>

    <div class="thc-shell-body">
      <main id="thc-shell-main" ref="main" class="thc-shell-main" tabindex="-1">
        <div class="thc-shell-head">
          <div class="thc-shell-head-row">
            <button
              ref="menuButton"
              type="button"
              class="thc-shell-menu-button"
              aria-haspopup="dialog"
              :aria-expanded="drawerOpen"
              data-test="shell-menu-button"
              @click="openDrawer"
            >
              <svg class="thc-shell-icon thc-shell-icon-lg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
              <span class="thc-shell-hidden">{{ view.words.menu }}</span>
            </button>
            <div class="thc-shell-head-text">
              <div class="thc-shell-title-row">
                <ThcMark
                  v-if="view.head.app?.brand && !brandTitle"
                  :key="view.head.app.brand"
                  class="thc-shell-title-mark"
                  :brand="view.head.app.brand"
                  :size="36"
                  animate="load"
                />
                <span v-else-if="view.head.app && !view.head.app.brand" class="thc-shell-av thc-shell-av-lg" :class="`thc-shell-app-${view.head.app.color}`" aria-hidden="true">{{
                  view.head.app.letter
                }}</span>
                <h1
                  id="thc-shell-title"
                  class="thc-shell-title"
                  :class="{ 'thc-shell-title-brand': brandTitle }"
                  tabindex="-1"
                  data-test="shell-title"
                >
                  <template v-if="brandTitle && view.head.app?.brand">
                    <span :key="view.head.app.brand" class="thc-shell-pair thc-shell-title-pair" data-thc-hover data-test="shell-title-name">
                      <ThcMark class="thc-shell-title-mark" :brand="view.head.app.brand" :size="36" animate="load" />
                      <ThcName :brand="view.head.app.brand" :size="36" />
                    </span>
                    <span class="thc-shell-hidden">{{ view.head.title }}</span>
                  </template>
                  <template v-else>{{ view.head.title }}</template>
                </h1>
              </div>
            </div>
            <div class="thc-shell-actions">
              <!-- The theme and the language, at 900 px and wider; under it they are in the account panel. -->
              <div v-if="view.head.controls || view.head.appearance" class="thc-shell-head-prefs" data-test="shell-head-prefs">
                <template v-if="view.head.controls">
                  <ThcThemeToggle :value="view.head.controls.theme" :locale="view.lang" data-test="shell-theme" @change="onTheme" />
                  <ThcLanguageMenu :value="view.head.controls.locale" :locale="view.lang" data-test="shell-language" @change="onLocale" />
                </template>
                <a
                  v-if="view.head.appearance"
                  class="thc-shell-action"
                  :href="view.head.appearance.href"
                  :aria-label="view.head.appearance.label"
                  :title="view.head.appearance.label"
                  :aria-current="view.head.appearance.current ? 'page' : undefined"
                  data-test="shell-appearance"
                  @click="follow($event, view.head.appearance?.href ?? '')"
                >
                  <svg class="thc-shell-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <circle cx="12" cy="12" r="8.5" />
                    <path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.2 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.2-3.5-8.5s1.1-6.1 3.5-8.5z" />
                  </svg>
                </a>
              </div>
              <slot name="header-actions" />
              <!-- Under 900 px: the account button and its panel. -->
              <div v-if="view.head.account" ref="account" class="thc-shell-account" data-test="shell-account" @keydown="onAccountKey" @focusout="onAccountFocusOut">
                <button
                  ref="accountButton"
                  type="button"
                  class="thc-shell-account-button"
                  :class="{ 'thc-shell-account-current': view.head.account.current }"
                  :aria-expanded="accountOpen ? 'true' : 'false'"
                  :aria-controls="accountOpen ? `${uid}-account` : undefined"
                  data-test="shell-account-button"
                  @click="toggleAccount"
                >
                  <span class="thc-shell-person" aria-hidden="true">
                    <template v-if="view.head.account.initials">{{ view.head.account.initials }}</template>
                    <svg v-else class="thc-shell-icon" viewBox="0 0 24 24" focusable="false">
                      <circle cx="12" cy="9" r="3.5" />
                      <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
                    </svg>
                  </span>
                  <span class="thc-shell-hidden">{{ view.head.account.label }}</span>
                </button>
                <div v-if="accountOpen" :id="`${uid}-account`" class="thc-shell-account-panel" data-test="shell-account-panel">
                  <a
                    v-if="view.head.account.profile"
                    class="thc-shell-account-row"
                    :class="{ 'thc-shell-current': view.head.account.profile.current }"
                    :href="view.head.account.profile.href"
                    :aria-current="view.head.account.profile.current ? 'page' : undefined"
                    data-test="shell-account-profile"
                    @click="follow($event, view.head.account?.profile?.href ?? '')"
                  >
                    <span class="thc-shell-person" aria-hidden="true">
                      <template v-if="view.head.account.profile.initials">{{ view.head.account.profile.initials }}</template>
                      <svg v-else class="thc-shell-icon" viewBox="0 0 24 24" focusable="false">
                        <circle cx="12" cy="9" r="3.5" />
                        <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
                      </svg>
                    </span>
                    <span class="thc-shell-ws-text">
                      <span v-if="view.head.account.profile.name" class="thc-shell-ws-name" data-test="shell-account-name">{{ view.head.account.profile.name }}</span>
                      <span class="thc-shell-profile-label">{{ view.head.account.profile.label }}</span>
                    </span>
                  </a>
                  <a
                    v-if="view.head.account.workspace"
                    class="thc-shell-account-row"
                    :class="{ 'thc-shell-current': view.head.account.workspace.current }"
                    :href="view.head.account.workspace.href"
                    :aria-current="view.head.account.workspace.current ? 'page' : undefined"
                    :aria-labelledby="`${uid}-account-ws-switch ${uid}-account-ws-name`"
                    :aria-describedby="view.head.account.workspace.shown ? `${uid}-account-ws-detail` : undefined"
                    data-test="shell-account-workspace"
                    @click="follow($event, view.head.account?.workspace?.href ?? '')"
                  >
                    <template v-if="view.head.account.workspace.shown">
                      <span class="thc-shell-ws-av" :class="view.head.account.workspace.shown.personal ? 'thc-shell-ws-personal' : 'thc-shell-ws-team'" aria-hidden="true">{{
                        view.head.account.workspace.shown.initial
                      }}</span>
                      <span class="thc-shell-ws-text">
                        <span :id="`${uid}-account-ws-name`" class="thc-shell-ws-name">{{ view.head.account.workspace.shown.name }}</span>
                        <span :id="`${uid}-account-ws-detail`" class="thc-shell-ws-detail">{{ view.head.account.workspace.shown.detail }}</span>
                      </span>
                    </template>
                    <template v-else>
                      <span class="thc-shell-ws-av thc-shell-ws-none" aria-hidden="true">
                        <svg class="thc-shell-icon" viewBox="0 0 24 24" focusable="false">
                          <rect x="4" y="4" width="7" height="7" rx="1.5" />
                          <rect x="13" y="4" width="7" height="7" rx="1.5" />
                          <rect x="4" y="13" width="7" height="7" rx="1.5" />
                          <rect x="13" y="13" width="7" height="7" rx="1.5" />
                        </svg>
                      </span>
                      <span class="thc-shell-ws-text">
                        <span :id="`${uid}-account-ws-name`" class="thc-shell-ws-name" data-test="shell-account-choose">{{ view.head.account.workspace.chooseLabel }}</span>
                      </span>
                    </template>
                    <span :id="`${uid}-account-ws-switch`" class="thc-shell-hidden">{{ view.head.account.workspace.switchLabel }}</span>
                    <svg class="thc-shell-chevron thc-shell-chevron-next" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 6l6 6-6 6" /></svg>
                  </a>
                  <template v-if="view.head.controls">
                    <div class="thc-shell-account-group" data-test="shell-account-theme">
                      <span class="thc-shell-account-label" aria-hidden="true">{{ view.head.account.themeLabel }}</span>
                      <ThcThemeToggle variant="segmented" :value="view.head.controls.theme" :locale="view.lang" @change="onTheme" />
                    </div>
                    <div class="thc-shell-account-group" data-test="shell-account-language">
                      <span class="thc-shell-account-label" aria-hidden="true">{{ view.head.account.languageLabel }}</span>
                      <ThcLanguageMenu variant="list" :value="view.head.controls.locale" :locale="view.lang" @change="onLocale" />
                    </div>
                  </template>
                  <a
                    v-else-if="view.head.appearance"
                    class="thc-shell-account-row"
                    :class="{ 'thc-shell-current': view.head.appearance.current }"
                    :href="view.head.appearance.href"
                    :aria-current="view.head.appearance.current ? 'page' : undefined"
                    data-test="shell-account-appearance"
                    @click="follow($event, view.head.appearance?.href ?? '')"
                  >
                    <span class="thc-shell-account-icon" aria-hidden="true">
                      <svg class="thc-shell-icon" viewBox="0 0 24 24" focusable="false">
                        <circle cx="12" cy="12" r="8.5" />
                        <path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.2 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.2-3.5-8.5s1.1-6.1 3.5-8.5z" />
                      </svg>
                    </span>
                    <span class="thc-shell-ws-name">{{ view.head.appearance.label }}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <nav v-if="view.head.tabs.length > 0" :key="tabsKey" ref="tabsNav" class="thc-shell-tabs" :aria-label="view.head.tabsLabel" data-test="shell-tabs">
            <ul class="thc-shell-tab-list">
              <li v-for="tab in view.head.tabs" :key="tab.id">
                <a
                  class="thc-shell-tab"
                  :class="{ 'thc-shell-tab-current': tab.current }"
                  :href="tab.href"
                  :aria-current="tab.current ? 'page' : undefined"
                  :target="tab.newTab ? '_blank' : undefined"
                  :rel="tab.newTab ? 'noopener' : undefined"
                  data-test="shell-tab"
                  :data-id="tab.id"
                  @click="follow($event, tab.href)"
                >
                  <span>{{ tab.label }}</span>
                  <span v-if="tab.note" class="thc-shell-tab-note">{{ tab.note }}</span>
                  <template v-if="tab.newTab">
                    <span aria-hidden="true">↗</span>
                    <span class="thc-shell-hidden">{{ view.words.newTab }}</span>
                  </template>
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <!-- Always there, so the words are announced when they come. -->
        <div class="thc-shell-leaving" :class="{ 'thc-shell-leaving-on': leaving }" role="status" data-test="shell-leaving">
          <template v-if="leaving">
            <svg class="thc-shell-spinner" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" /></svg>
            <span>{{ view.words.loading }}</span>
          </template>
        </div>
        <!-- The page stays, dimmed, while the browser follows a link: the loading mark above says so. -->
        <div class="thc-shell-page" :class="{ 'thc-shell-page-leaving': leaving }" :aria-busy="leaving ? 'true' : undefined" data-test="shell-page">
          <p v-if="view.head.back" class="thc-shell-back-row">
            <a class="thc-shell-back" :href="view.head.back.href" data-test="shell-back" @click="follow($event, view.head.back?.href ?? '')">
              <span aria-hidden="true">← </span>{{ view.head.back.label }}
            </a>
          </p>

          <div v-if="view.head.notice" class="thc-shell-notice" role="status" data-test="shell-notice" :data-kind="view.head.notice.kind">
            <span>{{ view.head.notice.text }}</span>
            <a class="thc-shell-notice-link" :href="view.head.notice.href" data-test="shell-notice-link" @click="follow($event, view.head.notice?.href ?? '')">{{
              view.head.notice.link
            }}</a>
          </div>

          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<style>
/* The shell's own rules, every class prefixed thc-shell-, on the --thc-*
   tokens of tokens.css: the pattern of Wappie's console (a white side
   column, a white header with the title, the page on grey), in the page's
   one tone (--thc-tone, the root's .thc-tone-* class). Mobile first: under
   900 px the side column hides and the menu lives in the drawer, and the
   header's theme and language live in the account button's panel. */

.thc-shell {
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--thc-bg);
  color: var(--thc-text);
  font-family: var(--thc-font-sans);
  font-size: var(--thc-text-size);
  line-height: var(--thc-line-height);
  -webkit-font-smoothing: antialiased;
}

.thc-shell *,
.thc-shell *::before,
.thc-shell *::after {
  box-sizing: border-box;
}

.thc-shell :focus-visible {
  outline: var(--thc-focus-width) solid var(--thc-tone);
  outline-offset: 2px;
}

.thc-shell-hidden {
  position: absolute !important;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

.thc-shell-skip {
  position: absolute;
  left: 1rem;
  top: -10rem;
  z-index: 30;
  padding: 0.6rem 1rem;
  border-radius: var(--thc-radius-sm);
  background: var(--thc-tone);
  color: var(--thc-on-tone);
  font-weight: 600;
}

.thc-shell-skip:focus {
  top: 0.5rem;
}

.thc-shell-icon {
  width: 19px;
  height: 19px;
  flex: 0 0 auto;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.thc-shell-icon-lg {
  width: 23px;
  height: 23px;
}

/* ---------- side column and drawer ---------- */

.thc-shell-side {
  display: none;
}

.thc-shell-menu {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 100%;
  padding: 26px 16px 18px;
}

.thc-shell-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: var(--thc-target);
  padding: 0 8px;
  color: var(--thc-brand-ink);
  text-decoration: none;
  border-radius: var(--thc-radius-nav);
}

.thc-shell-drawer {
  margin: 0;
  padding: 0;
  border: 0;
  border-right: 1px solid var(--thc-line);
  border-radius: 0 20px 20px 0;
  width: min(340px, calc(100vw - 38px));
  max-width: none;
  height: 100vh;
  height: 100dvh;
  max-height: none;
  background: var(--thc-surface);
  color: var(--thc-text);
  box-shadow: var(--thc-shadow-pop);
}

.thc-shell-drawer::backdrop {
  /* Older engines give ::backdrop no custom properties: the literal is light's. */
  background: var(--thc-backdrop, rgb(20 23 46 / 0.42));
}

.thc-shell-drawer-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.thc-shell-drawer .thc-shell-menu {
  padding: 22px 16px 18px;
}

.thc-shell-drawer .thc-shell-brand {
  margin-right: 52px;
}

.thc-shell-drawer .thc-shell-link {
  min-height: 48px;
}

.thc-shell-close {
  position: absolute;
  top: 22px;
  right: 14px;
  z-index: 1;
  display: inline-grid;
  place-items: center;
  width: var(--thc-target);
  height: var(--thc-target);
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--thc-muted);
  font: inherit;
  cursor: pointer;
}

.thc-shell-close:hover {
  background: var(--thc-hover);
  color: var(--thc-text);
}

/* ---------- workspace selector ---------- */

.thc-shell-selector {
  position: relative;
}

.thc-shell-selector-label {
  display: block;
  padding: 0 12px 8px;
  font-size: 11px;
  font-weight: 600;
  color: var(--thc-muted);
}

.thc-shell-ws {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: var(--thc-target);
  padding: 6px 10px;
  border: 0;
  border-radius: var(--thc-radius-nav);
  background: transparent;
  color: var(--thc-text);
  font: inherit;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}

.thc-shell-ws:hover {
  background: var(--thc-hover);
}

.thc-shell-ws-button {
  min-height: 64px;
  padding: 12px;
  border: 1px solid var(--thc-line);
  border-radius: 13px;
  background: var(--thc-raised);
}

.thc-shell-ws-button .thc-shell-ws-av {
  width: 38px;
  height: 38px;
  border-radius: 11px;
}

.thc-shell-ws-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.thc-shell-ws-name {
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thc-shell-ws-detail,
.thc-shell-profile-label {
  font-size: 11px;
  color: var(--thc-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thc-shell-ws-av,
.thc-shell-av,
.thc-shell-person {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  font-weight: 650;
  line-height: 1;
}

.thc-shell-ws-av {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  font-size: 14px;
}

.thc-shell-ws-av-sm {
  width: 30px;
  height: 30px;
  border-radius: 8px;
}

.thc-shell-ws-personal {
  background: var(--thc-tone-tint);
  color: var(--thc-tone);
}

.thc-shell-ws-team {
  background: var(--thc-tone);
  color: var(--thc-on-tone);
}

.thc-shell-ws-none {
  border: 1px dashed var(--thc-line);
  color: var(--thc-muted);
}

.thc-shell-chevron,
.thc-shell-check {
  width: 16px;
  height: 16px;
  margin-left: auto;
  flex: 0 0 auto;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.thc-shell-chevron {
  color: var(--thc-muted);
}

.thc-shell-check {
  color: var(--thc-tone);
}

.thc-shell-ws-button[aria-expanded='true'] .thc-shell-chevron {
  transform: rotate(180deg);
}

.thc-shell-ws-panel {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 6px);
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px;
  background: var(--thc-raised);
  border: 1px solid var(--thc-line);
  border-radius: var(--thc-radius-md);
  box-shadow: var(--thc-shadow-pop);
}

.thc-shell-ws-all {
  margin-top: 4px;
  border-top: 1px solid var(--thc-line);
  border-radius: 0 0 var(--thc-radius-nav) var(--thc-radius-nav);
  color: var(--thc-tone);
  font-size: 13px;
  font-weight: 600;
}

.thc-shell-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* ---------- navigation ---------- */

.thc-shell-nav {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.thc-shell-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.thc-shell-group-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--thc-muted);
}

.thc-shell-link {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: var(--thc-target);
  padding: 9px 12px;
  border-radius: var(--thc-radius-nav);
  color: var(--thc-muted);
  font-size: 13.5px;
  font-weight: 550;
  line-height: 1.3;
  text-decoration: none;
}

.thc-shell-link:hover {
  background: var(--thc-hover);
  color: var(--thc-text);
}

.thc-shell-link.thc-shell-current {
  background: var(--thc-tone-tint);
  color: var(--thc-tone);
  font-weight: 650;
}

.thc-shell-link-label {
  min-width: 0;
  overflow-wrap: anywhere;
}

.thc-shell-out {
  margin-left: auto;
  font-size: 13px;
}

.thc-shell-av {
  border-radius: 7px;
  background: var(--thc-app-indigo);
  color: var(--thc-app-letter);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.16);
}

.thc-shell-av-xs {
  width: 18px;
  height: 18px;
  font-size: 10px;
  border-radius: 5px;
}

.thc-shell-av-sm {
  width: 22px;
  height: 22px;
  font-size: 12px;
  border-radius: 6px;
}

.thc-shell-av-lg {
  width: 36px;
  height: 36px;
  font-size: 16px;
  border-radius: 10px;
}

/* A product of the kit: its symbol and its written name side by side, each
   the kit's own drawing (simbolo, nome), 0.24 H apart and centered on each
   other (brand manual), at the H each place draws the symbol at. */
.thc-shell-pair {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
}

.thc-shell-link .thc-shell-pair {
  gap: calc(22px * 0.24);
}

.thc-shell-group-label .thc-shell-pair {
  gap: calc(18px * 0.24);
}

.thc-shell-title-pair {
  gap: calc(36px * 0.24);
  /* The written name gives way on a narrow phone rather than run under the
     header's controls: it shrinks, its viewBox keeping its proportions. */
  flex: 0 1 auto;
  min-width: 0;
  max-width: 100%;
}

.thc-shell-title-pair .thc-shell-name {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 100%;
  height: auto;
}

.thc-shell-app-green {
  background: var(--thc-app-green);
}

.thc-shell-app-rust {
  background: var(--thc-app-rust);
}

.thc-shell-app-violet {
  background: var(--thc-app-violet);
}

.thc-shell-app-blue {
  background: var(--thc-app-blue);
}

.thc-shell-app-indigo {
  background: var(--thc-app-indigo);
}

.thc-shell-foot {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 14px;
  border-top: 1px solid var(--thc-line);
}

.thc-shell-profile {
  min-height: 52px;
  color: var(--thc-text);
}

.thc-shell-profile .thc-shell-ws-name {
  font-size: 13px;
}

.thc-shell-sign-out {
  font-size: 13px;
}

.thc-shell-person {
  width: 35px;
  height: 35px;
  border-radius: 999px;
  background: var(--thc-tone-tint);
  color: var(--thc-tone);
  font-size: 13px;
}

.thc-shell-link.thc-shell-current .thc-shell-person {
  background: var(--thc-tone);
  color: var(--thc-on-tone);
}

.thc-shell-link.thc-shell-current .thc-shell-profile-label {
  color: inherit;
}

/* ---------- body and header ---------- */

.thc-shell-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.thc-shell-menu-button {
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
  width: var(--thc-target);
  height: var(--thc-target);
  margin-left: -6px;
  padding: 0;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--thc-text);
  font: inherit;
  cursor: pointer;
}

.thc-shell-menu-button:hover {
  background: var(--thc-hover);
}

.thc-shell-main {
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
}

.thc-shell-main:focus {
  outline: none;
}

.thc-shell-head {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 68px;
  justify-content: center;
  padding: 12px 14px;
  background: var(--thc-surface);
  border-bottom: 1px solid var(--thc-line);
}

.thc-shell-head:has(> .thc-shell-tabs) {
  padding-bottom: 0;
}

.thc-shell-head-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.thc-shell-head-text {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.thc-shell-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.thc-shell-title {
  margin: 0;
  font-size: 20px;
  font-weight: 650;
  line-height: 1.15;
  letter-spacing: -0.02em;
  overflow-wrap: anywhere;
}

.thc-shell-title-brand {
  display: flex;
  align-items: center;
  min-width: 0;
}

/* The title takes focus by script at each page (tabindex -1), so a screen
   reader starts there; it is no control, so it draws no ring, whatever
   the browser makes of how focus came. */
.thc-shell .thc-shell-title:focus,
.thc-shell .thc-shell-title:focus-visible {
  outline: none;
}

.thc-shell-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex: 0 0 auto;
}

.thc-shell-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--thc-target);
  height: var(--thc-target);
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--thc-muted);
}

/* The theme and the language: at 900 px and wider only (the account
   panel holds them below), and never focusable while hidden. */
.thc-shell-head-prefs {
  display: none;
  align-items: center;
  gap: 8px;
}

/* ---------- the account button and its panel (under 900 px) ---------- */

.thc-shell-account {
  position: relative;
  flex: 0 0 auto;
}

.thc-shell-account-button {
  display: inline-grid;
  place-items: center;
  width: var(--thc-target);
  height: var(--thc-target);
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.thc-shell-account-button:hover,
.thc-shell-account-button[aria-expanded='true'] {
  background: var(--thc-hover);
}

.thc-shell-account-button .thc-shell-person {
  width: 36px;
  height: 36px;
}

.thc-shell-account-current .thc-shell-person,
.thc-shell-account-row.thc-shell-current .thc-shell-person {
  background: var(--thc-tone);
  color: var(--thc-on-tone);
}

.thc-shell-account-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: min(320px, calc(100vw - 20px));
  max-height: calc(100vh - 84px);
  max-height: calc(100dvh - 84px);
  overflow-y: auto;
  padding: 8px;
  background: var(--thc-raised);
  border: 1px solid var(--thc-line);
  border-radius: var(--thc-radius-md);
  box-shadow: var(--thc-shadow-pop);
}

.thc-shell-account-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 52px;
  padding: 8px 10px;
  border-radius: var(--thc-radius-nav);
  color: var(--thc-text);
  text-decoration: none;
}

.thc-shell-account-row:hover {
  background: var(--thc-hover);
}

.thc-shell-account-row.thc-shell-current {
  background: var(--thc-tone-tint);
}

.thc-shell-account-row .thc-shell-ws-text {
  flex: 1 1 auto;
}

.thc-shell-account-icon {
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
  width: 35px;
  height: 35px;
  border-radius: 999px;
  background: var(--thc-hover);
  color: var(--thc-muted);
}

.thc-shell-account-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 6px;
  padding: 12px 6px 4px;
  border-top: 1px solid var(--thc-line);
}

/* Without data the panel opens on the theme: no divider above it. */
.thc-shell-account-group:first-child {
  margin-top: 0;
  padding-top: 4px;
  border-top: 0;
}

.thc-shell-account-label {
  padding: 0 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--thc-muted);
}

.thc-shell-account-group .thc-shell-ctl-seg {
  display: flex;
  width: 100%;
}

.thc-shell-account-group .thc-shell-ctl-seg-item {
  flex: 1 1 0;
  justify-content: center;
  padding: 0 8px;
}

.thc-shell-action:hover {
  background: var(--thc-hover);
  color: var(--thc-text);
}

.thc-shell-action[aria-current='page'] {
  background: var(--thc-tone-tint);
  color: var(--thc-tone);
}

.thc-shell-back-row {
  margin: 0;
}

.thc-shell-back {
  display: inline-flex;
  align-items: center;
  min-height: var(--thc-target);
  color: var(--thc-tone);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
}

.thc-shell-back:hover {
  text-decoration: underline;
  text-underline-offset: 0.18em;
}

.thc-shell-notice {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  padding: 10px 14px;
  border: 1px solid color-mix(in srgb, var(--thc-tone) 22%, transparent);
  border-radius: var(--thc-radius-sm);
  background: var(--thc-tone-tint);
  color: var(--thc-text);
  font-size: 13px;
}

.thc-shell-notice[data-kind='unavailable'],
.thc-shell-notice[data-kind='other-account'] {
  border-color: var(--thc-tone);
  border-left-width: 4px;
}

.thc-shell-notice-link {
  display: inline-flex;
  align-items: center;
  min-height: var(--thc-target);
  padding: 0 14px;
  border-radius: var(--thc-radius-sm);
  background: var(--thc-tone);
  color: var(--thc-on-tone);
  font-weight: 600;
  text-decoration: none;
}

/* An app's tabs: one row, from edge to edge of the header (whose padding
   becomes the list's), that scrolls sideways when it overflows, by touch,
   trackpad or focus, with no scrollbar. Only the row scrolls. */
.thc-shell-tabs {
  margin: 0 -14px;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  scroll-padding-inline: 32px;
}

.thc-shell-tabs::-webkit-scrollbar {
  display: none;
}

.thc-shell-tab-list {
  margin: 0;
  padding: 0 10px;
  list-style: none;
  display: flex;
  flex-wrap: nowrap;
  gap: 4px;
  width: max-content;
  min-width: 100%;
}

.thc-shell-tab-list > li {
  flex: 0 0 auto;
}

/* Where the browser can tell the row's scroll position in CSS, its edges
   fade where more tabs wait: none at the start until it has scrolled, and
   none at the end once it has reached it; a row that fits never fades. */
@property --thc-shell-tabs-start {
  syntax: '<length>';
  inherits: false;
  initial-value: 0px;
}

@property --thc-shell-tabs-end {
  syntax: '<length>';
  inherits: false;
  initial-value: 0px;
}

@keyframes thc-shell-tabs-fade {
  from {
    --thc-shell-tabs-start: 0px;
    --thc-shell-tabs-end: 32px;
  }

  12%,
  88% {
    --thc-shell-tabs-start: 32px;
    --thc-shell-tabs-end: 32px;
  }

  to {
    --thc-shell-tabs-start: 32px;
    --thc-shell-tabs-end: 0px;
  }
}

@supports (animation-timeline: scroll()) {
  .thc-shell-tabs {
    -webkit-mask-image: linear-gradient(
      to right,
      transparent 0,
      #000 var(--thc-shell-tabs-start),
      #000 calc(100% - var(--thc-shell-tabs-end)),
      transparent 100%
    );
    mask-image: linear-gradient(to right, transparent 0, #000 var(--thc-shell-tabs-start), #000 calc(100% - var(--thc-shell-tabs-end)), transparent 100%);
    animation: thc-shell-tabs-fade linear both;
    animation-timeline: scroll(self inline);
  }
}

.thc-shell-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: var(--thc-target);
  padding: 0 10px;
  border-bottom: 2px solid transparent;
  color: var(--thc-muted);
  font-size: 14px;
  font-weight: 550;
  text-decoration: none;
  white-space: nowrap;
}

/* Inside the scrolling row a ring outside the tab would be cut off. */
.thc-shell .thc-shell-tab:focus-visible {
  outline-offset: -2px;
}

.thc-shell-tab:hover {
  color: var(--thc-text);
}

.thc-shell-tab.thc-shell-tab-current {
  color: var(--thc-tone);
  border-bottom-color: var(--thc-tone);
  font-weight: 650;
}

.thc-shell-tab-note {
  font-size: 11px;
  font-weight: 500;
  padding: 1px 7px;
  border-radius: 6px;
  background: var(--thc-hover);
  color: var(--thc-muted);
}

.thc-shell-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
  padding: 18px 14px 32px;
}

/* While the browser follows a link: the page stays, dimmed, under the same
   menu and header, and the loading mark sits above it. It stays in the
   page's tree, so focus and assistive technology keep their place, and a
   navigation that does not happen gives it back at once. */
.thc-shell-page.thc-shell-page-leaving {
  opacity: 0.4;
  transition: opacity 0.15s ease-out;
}

.thc-shell-leaving-on {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 14px 0;
  color: var(--thc-muted);
  font-size: 13.5px;
  font-weight: 550;
}

@media (prefers-reduced-motion: reduce) {
  .thc-shell-page.thc-shell-page-leaving {
    transition: none;
  }
}

.thc-shell-spinner {
  width: 22px;
  height: 22px;
  flex: 0 0 auto;
  fill: none;
  stroke: var(--thc-tone);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-dasharray: 42 100;
  animation: thc-shell-spin 0.9s linear infinite;
}

@keyframes thc-shell-spin {
  to {
    transform: rotate(360deg);
  }
}

/* A phone's one header row (the menu button, the title, the theme toggle,
   the language menu and the profile) fits 375 px: under 400 px the gaps
   narrow and the title may wrap, and every control keeps its target. */
@media (max-width: 399.98px) {
  .thc-shell-head {
    padding-left: 10px;
    padding-right: 10px;
  }

  .thc-shell-head-row {
    gap: 6px;
  }

  .thc-shell-actions {
    gap: 2px;
  }

  .thc-shell-tabs {
    margin: 0 -10px;
  }

  .thc-shell-tab-list {
    padding: 0 6px;
  }

  .thc-shell-title-pair {
    gap: calc(30px * 0.24);
  }

  .thc-shell-title-pair .thc-shell-bm-svg,
  .thc-shell-title-row > .thc-shell-title-mark {
    width: 30px;
    height: 30px;
  }
}

/* ---------- wide screens: the side column ---------- */

@media (min-width: 900px) {
  .thc-shell {
    display: grid;
    grid-template-columns: var(--thc-side-width) minmax(0, 1fr);
  }

  .thc-shell-side {
    display: block;
    position: sticky;
    top: 0;
    height: 100vh;
    height: 100dvh;
    overflow-y: auto;
    border-right: 1px solid var(--thc-line);
    background: var(--thc-surface);
  }

  .thc-shell-menu-button,
  .thc-shell-account {
    display: none;
  }

  .thc-shell-head-prefs {
    display: flex;
  }

  .thc-shell-head {
    min-height: 80px;
    padding: 20px 36px;
  }

  .thc-shell-head:has(> .thc-shell-tabs) {
    padding-bottom: 0;
  }

  .thc-shell-head-text {
    gap: 7px;
  }

  .thc-shell-title {
    font-size: var(--thc-h1-size);
  }

  .thc-shell-tabs {
    margin: 2px -36px 0;
  }

  .thc-shell-tab-list {
    padding: 0 26px;
  }

  .thc-shell-action {
    width: var(--thc-control);
    height: var(--thc-control);
  }

  .thc-shell-tab,
  .thc-shell-back,
  .thc-shell-notice-link {
    min-height: var(--thc-control);
  }

  .thc-shell-page {
    padding: 28px 36px 48px;
  }
}

/* Between 900 and 1020 px, Wappie's narrower column and paddings. */
@media (min-width: 900px) and (max-width: 1020px) {
  .thc-shell {
    grid-template-columns: 236px minmax(0, 1fr);
  }

  .thc-shell-menu {
    padding: 22px 12px 16px;
  }

  .thc-shell-head {
    padding: 20px 24px;
  }

  .thc-shell-tabs {
    margin: 2px -24px 0;
  }

  .thc-shell-tab-list {
    padding: 0 14px;
  }

  .thc-shell-page {
    padding: 24px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .thc-shell-ws-button[aria-expanded='true'] .thc-shell-chevron {
    transform: none;
  }

  /* The loading mark stays still: its arc alone says it. */
  .thc-shell-spinner {
    animation: none;
  }
}
</style>
