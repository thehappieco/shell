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
//     the selector's, the language menu's and the avatar menu's outside
//     clicks while they are open, the drawer's width, the theme toggle's
//     system scheme, each symbol's mouse on its hover host, the window's
//     click (to see that the browser follows a link, below) and pageshow,
//     and the document's pointerdown and keydown that tell a pointer from
//     a key (input.ts, since 1.6.1: a focus ring shows after a key only);
//   - menus, the drawer and the language's dialog open and close with
//     motion (since 1.6.1: tokens.css's --thc-motion-open and -close, on
//     thehappie.co's easing; none under reduced motion); a dialog closes
//     once its exit has run (motion.ts's whenStill), and a press that
//     continues the one before (a double-click's second, soon and on the
//     same spot: input.ts's soonAfter) is no new request, on a menu's
//     button, where a drawer or a dialog just opened, or under a menu that
//     an entry's press just closed (holdNextPress);
//   - under 900 px the menu is a modal <dialog> behind the header's menu
//     button (one header row, as Wappie's console: the button, the title,
//     the host's actions and the avatar):
//     Escape, the close button or any link closes it, and focus returns to
//     the button, except after a link the host routes (navigate): the host
//     then puts focus on its new page, and the dialog's close event, which
//     the browser fires later as a task of its own, must not take it back;
//   - the header ends with the avatar (since 1.6.0; AvatarMenu.vue), only
//     with data: the person's initials and, at 900 px and wider, their
//     name, a menu button whose menu holds the Minha conta group, "Aparência
//     e idioma" for a host that cannot keep a change, and "Sair". Under
//     900 px the header's theme toggle and language menu are not drawn
//     (display: none), and the avatar's menu holds them instead, as one
//     row: the same toggle, and the flag, which opens the language's
//     choice in a modal dialog in the middle of the screen. Another page,
//     or the window crossing 900 px, closes the menu;
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
//   - "Sair" is the avatar menu's last item (since 1.6.0; the side menu has
//     no foot): a link to the console's sign-out page, or, for a host that
//     passes signOut (the console), that host's own sign-out;
//   - on an app's pages the title row is the app's: for a product of the
//     kit, its symbol and its written name as the kit's contours inside the
//     h1, whose text stays as hidden text (the page's name for assistive
//     technology, and what the host's focus lands on); the current tab, or
//     the menu's current entry, says which of the app's pages this is. Any
//     other app keeps its letter badge beside the h1's text;
//   - the header's theme toggle and language menu (controls/) are drawn
//     only for a host that passes both changeTheme and changeLocale, a host
//     that can keep the change; any other gets "Aparência e idioma", the
//     link to the profile, in the avatar's menu. They show the data's theme
//     and language (or,
//     without data, the host's theme and locale), which the host patches
//     when it shows a change, and again if it puts one back.
//
//   - a kept answer (initial, since 1.4.0; decision 0047) is drawn while
//     the data loads, as the data would be, when it is for the host's
//     console origin and for the app session's own person (menu.ts); the
//     shell stores nothing itself: the host reads, keeps and erases it
//     (kept.ts's helpers). Read-only (the console, until its fresh answer
//     arrives): every link keeps its href, but a click on it follows nothing
//     and shows no loading mark, the workspace selector does not open
//     (aria-disabled), and the side column, the drawer's panel and the
//     tabs say they are busy (aria-busy); the theme and the language keep
//     working. The fresh result replaces it in place, under the same brand;
//   - "Sair" runs the host's beforeSignOut first (since 1.4.0): an app
//     erases its kept answer there, synchronously, before the browser
//     leaves. While read-only, "Sair" is disabled.
//
// It never applies the theme or the language on its own: a host calls
// applyTheme, and changes its own language.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ThcMark from './brand/ThcMark.vue'
import ThcName from './brand/ThcName.vue'
import AvatarMenu from './AvatarMenu.vue'
import ThcLanguageMenu from './controls/ThcLanguageMenu.vue'
import ThcThemeToggle from './controls/ThcThemeToggle.vue'
import { holdNextPress, type Press, pressedAt, soonAfter, trackInput } from './input.js'
import { buildView } from './menu.js'
import { whenStill } from './motion.js'
import ShellMenu from './ShellMenu.vue'
import type { Locale, ShellData, ShellFallback, ShellPlace, ShellResult, Theme } from './types.js'

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
    /**
     * The kept answer the host passes while result is null (decision 0047),
     * checked by the host with readKept: drawn only for consoleOrigin, and
     * on an app only for its subject. A result replaces it.
     */
    initial?: ShellData | null
    /** Whether the kept answer is drawn read-only: links follow nothing and the selector does not open. */
    readOnly?: boolean
    /** What the host does, synchronously, when the person follows the shell's "Sair": an app erases its kept answer. */
    beforeSignOut?: () => void
    /**
     * The host's own sign-out (since 1.6.0; the console's): "Sair" runs it,
     * after beforeSignOut, instead of following the link to the console's
     * sign-out page. Without it, "Sair" is that link.
     */
    signOut?: () => void
  }>(),
  {
    subject: undefined,
    fallback: undefined,
    returnPath: null,
    navigate: undefined,
    title: null,
    changeTheme: undefined,
    changeLocale: undefined,
    theme: undefined,
    initial: null,
    readOnly: false,
    beforeSignOut: undefined,
    signOut: undefined,
  },
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
    initial: props.initial,
    readOnly: props.readOnly,
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

const main = ref<HTMLElement | null>(null)
const drawer = ref<HTMLDialogElement | null>(null)
const menuButton = ref<HTMLButtonElement | null>(null)
const drawerOpen = ref(false)
/** routed says the drawer is closing for a link the host routes: the host moves focus, not the close event. */
let routed = false

function skip(): void {
  main.value?.focus()
}

/** The press on the menu button that opened the drawer, for soonAfter. */
let drawerPressed: Press | null = null

function openDrawer(event?: MouseEvent): void {
  const d = drawer.value
  if (d === null || drawerOpen.value) return
  drawerPressed = pressedAt(event)
  drawerOpen.value = true
  if (typeof d.showModal === 'function') d.showModal()
  else d.setAttribute('open', '')
}

/** closing says the drawer is sliding out: it closes once still, and opens again only after. */
let closing = false

/**
 * closeDrawer slides the drawer out and then closes it (shell 1.6.1), or
 * closes it at once: now, for a link the browser or the host follows, whose
 * page must not wait behind a dialog that keeps it inert; and wherever no
 * motion runs (reduced motion, an engine without the Web Animations API).
 */
function closeDrawer(now = false): void {
  const d = drawer.value
  if (d === null || !d.open) {
    drawerClosed()
    return
  }
  if (now) {
    closing = false
    d.classList.remove('thc-shell-closing')
    d.close()
    return
  }
  if (closing) return
  closing = true
  d.classList.add('thc-shell-closing')
  whenStill(d, () => {
    if (!closing) return
    closing = false
    d.classList.remove('thc-shell-closing')
    if (d.open) d.close()
  })
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

/**
 * A press that continues the one on the menu button (a double-click's
 * second, or a quick tap) lands where the drawer is sliding in: on its
 * brand, a link or the backdrop. It is held back before it reaches any of
 * them (1.6.1): its mousedown moves no focus from where the drawer put it,
 * and its click neither follows a link nor closes the drawer.
 */
function onDrawerDown(event: MouseEvent): void {
  if (soonAfter(event, drawerPressed)) event.preventDefault()
}

function onDrawerPress(event: MouseEvent): void {
  if (!soonAfter(event, drawerPressed)) return
  event.preventDefault()
  event.stopPropagation()
}

/**
 * A click on the backdrop lands on the dialog itself, outside its panel. It
 * and the close button close the drawer, and a double-click's second press
 * reaches nothing under it once it is gone (holdNextPress).
 */
function onDrawerClick(event: MouseEvent): void {
  if (event.target !== drawer.value) return
  holdNextPress(event)
  closeDrawer()
}

function onCloseClick(event: MouseEvent): void {
  holdNextPress(event)
  closeDrawer()
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

/**
 * follow is every link's click: the drawer closes (the avatar's menu closes
 * itself), and a link to this origin goes through navigate. While the kept
 * answer is drawn read-only it follows nothing: the click is prevented, and
 * the page stays as it is.
 */
function follow(event: MouseEvent, href: string): void {
  if (view.value.readOnly) {
    event.preventDefault()
    return
  }
  // A double-click on a link acts once: its second press reaches nothing
  // the first one's menu, drawer or page left under the pointer (1.6.1).
  holdNextPress(event)
  const path = routedPath(event, href)
  if (drawerOpen.value) {
    routed = path !== null
    closeDrawer(true)
  }
  if (path !== null && props.navigate !== undefined) {
    event.preventDefault()
    dropLeaving()
    props.navigate(path)
    return
  }
  pending = leaves(event, href) ? event : null
}

/**
 * onSignOut is "Sair"'s click (the avatar's menu does not send it while
 * read-only): the host's beforeSignOut runs first; then the host's own
 * sign-out, or the browser follows the link to the console's sign-out page.
 * A click a handler prevented does neither.
 */
function onSignOut(event: MouseEvent, href: string): void {
  if (view.value.readOnly) {
    event.preventDefault()
    return
  }
  if (event.defaultPrevented) return
  props.beforeSignOut?.()
  if (props.signOut !== undefined) {
    event.preventDefault()
    props.signOut()
    return
  }
  follow(event, href)
}

/** The press whose click the browser is following, while the mark shows. */
let leavingPress: Press | null = null

/** dropLeaving gives the page back: the browser did not go (stopped, refused) or the host routed. */
function dropLeaving(): void {
  pending = null
  leavingPress = null
  leaving.value = false
}

/**
 * While the mark shows, the next key or press in this page means the
 * browser did not go (the person stopped it, or refused to leave): the page
 * is theirs again. The second press of the double-click that left is not
 * one: it continues the press the browser is following (soonAfter), and
 * reaches nothing (holdNextPress), so the mark stays (1.6.1).
 */
function onInputWhileLeaving(event: Event): void {
  if (event.type === 'pointerdown' && soonAfter(event, leavingPress)) return
  dropLeaving()
}
watch(leaving, now => {
  if (now) {
    document.addEventListener('keydown', onInputWhileLeaving, true)
    document.addEventListener('pointerdown', onInputWhileLeaving, true)
  } else {
    document.removeEventListener('keydown', onInputWhileLeaving, true)
    document.removeEventListener('pointerdown', onInputWhileLeaving, true)
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
  if (event.defaultPrevented) return
  leavingPress = pressedAt(event)
  leaving.value = true
}

/** onPageShow drops the mark when the browser brings this page back from its back/forward cache. */
function onPageShow(event: PageTransitionEvent): void {
  if (event.persisted) dropLeaving()
}

// The avatar's menu (AvatarMenu.vue), which closes itself on its own
// events; another page and the window crossing 900 px close it from here.
const avatar = ref<InstanceType<typeof AvatarMenu> | null>(null)
/** narrow says the window is under 900 px: the avatar's menu then holds the theme and the language. */
const narrow = ref(true)

// Another page (a host's route, the browser's history) closes it; an equal
// place drawn again (a host's new object for the same page) does not.
const placeKey = computed(() => {
  const p = props.place
  const where = p.kind === 'app' ? `app:${p.app}:${p.screen ?? ''}` : `console:${p.section}`
  return `${where}|${props.workspace ?? ''}`
})
watch(placeKey, () => {
  avatar.value?.close(false)
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
// the page inert behind a menu nobody sees; the avatar's menu holds other
// items on each side of it, so it closes either way.
let wide: MediaQueryList | null = null
function onWide(e: MediaQueryListEvent): void {
  narrow.value = !e.matches
  avatar.value?.close(false)
  if (e.matches) closeDrawer()
}
onMounted(() => {
  trackInput()
  wide = globalThis.matchMedia?.('(min-width: 900px)') ?? null
  narrow.value = wide?.matches !== true
  wide?.addEventListener?.('change', onWide)
  window.addEventListener('click', onWindowClick)
  window.addEventListener('pageshow', onPageShow)
  showCurrentTab()
})
onBeforeUnmount(() => {
  wide?.removeEventListener?.('change', onWide)
  window.removeEventListener('click', onWindowClick)
  window.removeEventListener('pageshow', onPageShow)
  document.removeEventListener('keydown', onInputWhileLeaving, true)
  document.removeEventListener('pointerdown', onInputWhileLeaving, true)
})
</script>

<template>
  <div
    class="thc-shell"
    :class="`thc-tone-${view.tone}`"
    :lang="view.lang"
    data-test="shell"
    :data-shell="view.mode"
    :data-tone="view.tone"
    :data-read-only="view.readOnly ? 'true' : undefined"
  >
    <a class="thc-shell-skip" href="#thc-shell-main" @click.prevent="skip">{{ view.words.skip }}</a>

    <aside class="thc-shell-side" :aria-busy="view.readOnly ? 'true' : undefined">
      <ShellMenu :model="view.menu" :new-tab="view.words.newTab" @follow="follow" />
    </aside>

    <dialog
      ref="drawer"
      class="thc-shell-drawer"
      :aria-label="view.menu.navLabel"
      data-test="shell-drawer"
      @close="drawerClosed"
      @cancel="onCancel"
      @keydown="onDrawerKey"
      @mousedown.capture="onDrawerDown"
      @click.capture="onDrawerPress"
      @click="onDrawerClick"
    >
      <div class="thc-shell-drawer-panel" :aria-busy="view.readOnly ? 'true' : undefined">
        <button type="button" class="thc-shell-close" data-test="shell-close" @click="onCloseClick">
          <svg class="thc-shell-icon thc-shell-icon-lg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" /></svg>
          <span class="thc-shell-hidden">{{ view.words.closeMenu }}</span>
        </button>
        <ShellMenu v-if="drawerOpen" :model="view.menu" :new-tab="view.words.newTab" @follow="follow" />
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
              <!-- The theme and the language, at 900 px and wider; under it they are in the avatar's menu. -->
              <div v-if="view.head.controls" class="thc-shell-head-prefs" data-test="shell-head-prefs">
                <ThcThemeToggle :value="view.head.controls.theme" :locale="view.lang" data-test="shell-theme" @change="onTheme" />
                <ThcLanguageMenu :value="view.head.controls.locale" :locale="view.lang" data-test="shell-language" @change="onLocale" />
              </div>
              <slot name="header-actions" />
              <!-- The person, with data only: the avatar and its menu. -->
              <AvatarMenu
                v-if="view.head.avatar"
                ref="avatar"
                :model="view.head.avatar"
                :controls="view.head.controls"
                :narrow="narrow"
                :lang="view.lang"
                :read-only="view.readOnly"
                @follow="follow"
                @sign-out="onSignOut"
                @theme="onTheme"
                @locale="onLocale"
              />
            </div>
          </div>

          <nav
            v-if="view.head.tabs.length > 0"
            :key="tabsKey"
            ref="tabsNav"
            class="thc-shell-tabs"
            :aria-label="view.head.tabsLabel"
            :aria-busy="view.readOnly ? 'true' : undefined"
            data-test="shell-tabs"
          >
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
   header's theme and language live in the avatar's menu. */

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

/* The drawer slides in from the left over a fading backdrop (1.6.1), and
   slides out before it closes (Shell.vue's closeDrawer, through motion.ts's
   whenStill). ::backdrop may not see custom properties in older engines,
   hence the literals beside them. */
.thc-shell-drawer[open] {
  transform: none;
  transition: transform var(--thc-motion-open, 240ms) var(--thc-ease, cubic-bezier(0.22, 0.61, 0.36, 1));
}

.thc-shell-drawer[open]::backdrop {
  opacity: 1;
  transition: opacity var(--thc-motion-open, 240ms) var(--thc-ease, cubic-bezier(0.22, 0.61, 0.36, 1));
}

@starting-style {
  .thc-shell-drawer[open] {
    transform: translateX(-100%);
  }

  .thc-shell-drawer[open]::backdrop {
    opacity: 0;
  }
}

.thc-shell-drawer.thc-shell-closing {
  transform: translateX(-100%);
  transition: transform var(--thc-motion-close, 180ms) var(--thc-ease, cubic-bezier(0.22, 0.61, 0.36, 1));
}

.thc-shell-drawer.thc-shell-closing::backdrop {
  opacity: 0;
  transition: opacity var(--thc-motion-close, 180ms) var(--thc-ease, cubic-bezier(0.22, 0.61, 0.36, 1));
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

.thc-shell-ws-detail {
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
  transition: transform var(--thc-motion-open) var(--thc-ease);
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
  transform-origin: top center;
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

/* A kept answer drawn read-only (1.4.0): its links and the selector wait
   for the fresh answer, which replaces it in a moment. */
.thc-shell[data-read-only='true'] .thc-shell-side a,
.thc-shell[data-read-only='true'] .thc-shell-drawer a,
.thc-shell[data-read-only='true'] .thc-shell-tabs a,
.thc-shell[data-read-only='true'] .thc-shell-avatar-menu a,
.thc-shell[data-read-only='true'] .thc-shell-ws-button {
  cursor: progress;
}

.thc-shell-person {
  width: 35px;
  height: 35px;
  border-radius: 999px;
  background: var(--thc-tone-tint);
  color: var(--thc-tone);
  font-size: 13px;
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

/* The theme and the language: at 900 px and wider only (the avatar's menu
   holds them below), and never focusable while hidden. */
.thc-shell-head-prefs {
  display: none;
  align-items: center;
  gap: 8px;
}

/* ---------- the avatar and its menu (since 1.6.0) ---------- */

.thc-shell-avatar {
  position: relative;
  flex: 0 0 auto;
}

/* Under 900 px the circle alone, a round target; from 900 px the name and
   a chevron beside it. */
.thc-shell-avatar-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: var(--thc-target);
  height: var(--thc-target);
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--thc-text);
  font: inherit;
  cursor: pointer;
}

.thc-shell-avatar-button:hover,
.thc-shell-avatar-button[aria-expanded='true'] {
  background: var(--thc-hover);
}

.thc-shell-avatar-button .thc-shell-person {
  width: 36px;
  height: 36px;
}

.thc-shell-avatar-current .thc-shell-person {
  background: var(--thc-tone);
  color: var(--thc-on-tone);
}

/* The name is part of the button's name everywhere; it is drawn from 900 px. */
.thc-shell-avatar-name {
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

.thc-shell-avatar-chevron {
  display: none;
}

.thc-shell-avatar-button[aria-expanded='true'] .thc-shell-avatar-chevron {
  transform: rotate(180deg);
}

.thc-shell-avatar-pop {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  width: min(300px, calc(100vw - 20px));
  max-height: calc(100vh - 84px);
  max-height: calc(100dvh - 84px);
  overflow-y: auto;
  padding: 8px;
  background: var(--thc-raised);
  border: 1px solid var(--thc-line);
  border-radius: var(--thc-radius-md);
  box-shadow: var(--thc-shadow-pop);
  transform-origin: top right;
}

/* The menus' motion (1.6.1): the avatar's menu and the workspace selector
   fade and drop in, and fade out a little faster; nothing under them takes
   a click while they leave. */
.thc-shell-pop-enter-active {
  transition:
    opacity var(--thc-motion-open) var(--thc-ease),
    transform var(--thc-motion-open) var(--thc-ease);
}

.thc-shell-pop-leave-active {
  transition:
    opacity var(--thc-motion-close) var(--thc-ease),
    transform var(--thc-motion-close) var(--thc-ease);
  pointer-events: none;
}

.thc-shell-pop-enter-from,
.thc-shell-pop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}

.thc-shell-avatar-head {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 52px;
  padding: 6px 10px 10px;
  margin-bottom: 4px;
  border-bottom: 1px solid var(--thc-line);
  color: var(--thc-text);
}

.thc-shell-avatar-head .thc-shell-ws-name {
  font-size: 14px;
}

.thc-shell-avatar-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.thc-shell-avatar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: var(--thc-target);
  padding: 8px 10px;
  border-radius: var(--thc-radius-nav);
  color: var(--thc-text);
  font-size: 13.5px;
  font-weight: 550;
  line-height: 1.3;
  text-decoration: none;
  cursor: pointer;
}

.thc-shell-avatar-item .thc-shell-icon {
  color: var(--thc-muted);
}

.thc-shell-avatar-item:hover,
:where(:root:not(.thc-shell-input-pointer)) .thc-shell-avatar-item:focus-visible {
  background: var(--thc-hover);
}

.thc-shell-avatar-item.thc-shell-current {
  background: var(--thc-tone-tint);
  color: var(--thc-tone);
  font-weight: 650;
}

.thc-shell-avatar-item.thc-shell-current .thc-shell-icon {
  color: inherit;
}

/* "Sair", in the danger color (tokens.css), on its own tint when pointed or focused. */
.thc-shell-avatar-out,
.thc-shell-avatar-out .thc-shell-icon {
  color: var(--thc-danger);
}

.thc-shell-avatar-out:hover,
:where(:root:not(.thc-shell-input-pointer)) .thc-shell-avatar-out:focus-visible {
  background: var(--thc-danger-bg);
}

.thc-shell-avatar-out[aria-disabled='true'] {
  opacity: 0.55;
  cursor: progress;
}

.thc-shell-avatar-sep {
  height: 1px;
  margin: 6px 4px;
  background: var(--thc-line);
}

/* Under 900 px, for a host with both handlers: the theme toggle and the
   language's flag side by side, as the header draws them from 900 px,
   centred in the menu with room between them (the owner, 2026-10-26). */
.thc-shell-avatar-prefs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 6px 4px;
}

:where(:root:not(.thc-shell-input-pointer)) .thc-shell-avatar-prefs .thc-shell-ctl-toggle:focus-visible,
:where(:root:not(.thc-shell-input-pointer)) .thc-shell-avatar-prefs .thc-shell-ctl-lang-button:focus-visible {
  background: var(--thc-hover);
  color: var(--thc-text);
}

/* The language's choice (since 1.6.0): a modal dialog in the middle of the
   screen (the browser's own centring of a modal dialog), whose list scrolls
   on its own once it is longer than the dialog's height. */
.thc-shell-lang-dialog {
  width: min(360px, calc(100vw - 32px));
  max-width: none;
  max-height: none;
  margin: auto;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--thc-line);
  border-radius: var(--thc-radius-md);
  background: var(--thc-raised);
  color: var(--thc-text);
  box-shadow: var(--thc-shadow-pop);
}

.thc-shell-lang-dialog::backdrop {
  /* Older engines give ::backdrop no custom properties: the literal is light's. */
  background: var(--thc-backdrop, rgb(20 23 46 / 0.42));
}

/* The language's dialog rises and fades in (1.6.1), and fades out before
   it closes (AvatarMenu.vue's closeLanguages). */
.thc-shell-lang-dialog[open] {
  opacity: 1;
  transform: none;
  transition:
    opacity var(--thc-motion-open, 240ms) var(--thc-ease, cubic-bezier(0.22, 0.61, 0.36, 1)),
    transform var(--thc-motion-open, 240ms) var(--thc-ease, cubic-bezier(0.22, 0.61, 0.36, 1));
}

.thc-shell-lang-dialog[open]::backdrop {
  opacity: 1;
  transition: opacity var(--thc-motion-open, 240ms) var(--thc-ease, cubic-bezier(0.22, 0.61, 0.36, 1));
}

@starting-style {
  .thc-shell-lang-dialog[open] {
    opacity: 0;
    transform: translateY(8px) scale(0.97);
  }

  .thc-shell-lang-dialog[open]::backdrop {
    opacity: 0;
  }
}

.thc-shell-lang-dialog.thc-shell-closing {
  opacity: 0;
  transform: scale(0.98);
  transition:
    opacity var(--thc-motion-close, 180ms) var(--thc-ease, cubic-bezier(0.22, 0.61, 0.36, 1)),
    transform var(--thc-motion-close, 180ms) var(--thc-ease, cubic-bezier(0.22, 0.61, 0.36, 1));
}

.thc-shell-lang-dialog.thc-shell-closing::backdrop {
  opacity: 0;
  transition: opacity var(--thc-motion-close, 180ms) var(--thc-ease, cubic-bezier(0.22, 0.61, 0.36, 1));
}

.thc-shell-lang-panel {
  display: flex;
  flex-direction: column;
  max-height: min(480px, calc(100vh - 32px));
  max-height: min(480px, calc(100dvh - 32px));
}

.thc-shell-lang-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px 8px 18px;
  border-bottom: 1px solid var(--thc-line);
}

.thc-shell-lang-title {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  font-size: 16px;
  font-weight: 650;
  line-height: 1.3;
}

.thc-shell-lang-close {
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
  width: var(--thc-target);
  height: var(--thc-target);
  padding: 0;
  border: 0;
  border-radius: var(--thc-radius-pill);
  background: transparent;
  color: var(--thc-muted);
  font: inherit;
  cursor: pointer;
}

.thc-shell-lang-close:hover {
  background: var(--thc-hover);
  color: var(--thc-text);
}

.thc-shell-lang-list {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 2px;
  min-height: 0;
  margin: 0;
  padding: 8px;
  overflow-y: auto;
  overscroll-behavior: contain;
  /* A language focused at an edge scrolls in with its focus ring. */
  scroll-padding-block: 8px;
  list-style: none;
}

.thc-shell-lang-option {
  width: 100%;
  border: 0;
  background: transparent;
  font-family: inherit;
  text-align: left;
}

.thc-shell-lang-list .thc-shell-lang-option[aria-current='true'] {
  background: var(--thc-tone-tint);
  color: var(--thc-tone);
  font-weight: 650;
}

/* Forced colors replace the tint: the language shown keeps an outline of its own. */
@media (forced-colors: active) {
  .thc-shell-lang-list .thc-shell-lang-option[aria-current='true'] {
    outline: 2px solid Highlight;
    outline-offset: -2px;
  }
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

/* A phone's one header row (the menu button, the title, the host's
   actions and the avatar) fits 375 px: under 400 px the gaps narrow and the
   title may wrap, and every control keeps its target. */
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

  .thc-shell-menu-button {
    display: none;
  }

  .thc-shell-head-prefs {
    display: flex;
  }

  /* The avatar with the person's name beside it. */
  .thc-shell-avatar-button {
    height: var(--thc-control);
    padding: 0 10px 0 2px;
  }

  .thc-shell-avatar-name {
    position: static !important;
    width: auto;
    height: auto;
    margin: 0;
    overflow: hidden;
    clip: auto;
    clip-path: none;
    max-width: 14rem;
    font-size: 13.5px;
    font-weight: 600;
    text-overflow: ellipsis;
  }

  .thc-shell-avatar-chevron {
    display: block;
    width: 14px;
    height: 14px;
    margin-left: 0;
  }

  .thc-shell-avatar-item {
    min-height: var(--thc-control);
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
  .thc-shell-ws-button[aria-expanded='true'] .thc-shell-chevron,
  .thc-shell-avatar-button[aria-expanded='true'] .thc-shell-avatar-chevron {
    transform: none;
  }

  /* No menu, drawer or dialog moves: each appears and goes at once. */
  .thc-shell-chevron,
  .thc-shell-pop-enter-active,
  .thc-shell-pop-leave-active,
  .thc-shell-drawer[open],
  .thc-shell-drawer[open]::backdrop,
  .thc-shell-drawer.thc-shell-closing,
  .thc-shell-drawer.thc-shell-closing::backdrop,
  .thc-shell-lang-dialog[open],
  .thc-shell-lang-dialog[open]::backdrop,
  .thc-shell-lang-dialog.thc-shell-closing,
  .thc-shell-lang-dialog.thc-shell-closing::backdrop {
    transition: none;
  }

  /* The loading mark stays still: its arc alone says it. */
  .thc-shell-spinner {
    animation: none;
  }
}
</style>
