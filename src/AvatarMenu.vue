<script setup lang="ts">
// The header's avatar and its menu (since 1.6.0; shell contract 3.3), drawn
// from menu.ts's AvatarModel, only with data: a button with the person's
// initials in a circle (or a neutral glyph) and, at 900 px and wider, their
// display name; its menu holds the person (the circle and the name, not
// interactive), the Minha conta group's links, "Aparência e idioma" for a
// host that cannot keep a change (an app), under 900 px the theme and the
// language for a host that can (the console), then a separator and "Sair",
// in the danger color.
//
// It follows the WAI-ARIA menu button pattern, as the language menu does
// (controls/ThcLanguageMenu.vue):
//   - the button has aria-haspopup="menu", aria-expanded, and aria-controls
//     while the menu is there (drawn only while open); the menu is labelled
//     by the button, which is named "Sua conta" and the person's name;
//   - Enter, Space or ArrowDown on the button open the menu on its first
//     item, ArrowUp on its last; a click opens it on its first item;
//   - in the menu, ArrowDown and ArrowUp move through every item (round),
//     Home and End go to the first and the last, ArrowRight and ArrowLeft
//     move inside the row of the theme and the language; Enter or Space act
//     as a click does: a link is followed, the theme moves on in place;
//     Escape closes it and returns focus to the button, and goes no
//     further; Tab closes it and focus moves on;
//   - a click outside closes it (one capture listener, added only while it
//     is open), and so do focus leaving it, a link, "Sair", and whatever
//     Shell.vue closes it for (another page, the window crossing 900 px).
//
// The theme and the language (under 900 px, for a host with both handlers)
// are one row of two icon buttons, as the header draws them from 900 px:
// the theme toggle (controls/ThcThemeToggle.vue), whose click asks for the
// next mode and keeps the menu open, then the language's flag. Both are
// items of the menu (role menuitem), so the menu stays one menu. The flag
// closes the menu and opens the language's choice in the middle of the
// screen: a modal <dialog> (showModal, as the drawer), titled "Idioma",
// listing every language with its flag and its name in itself, the one
// shown marked aria-current; it opens with focus on that one, the arrows,
// Home and End move in the list, and Enter, Space or a click choose, which
// closes it and asks the host; Escape, a click on the backdrop and its
// close button close it and change nothing; however it closes, focus goes
// back to the avatar's button. The list scrolls on its own once it is
// longer than the dialog's height (Shell.vue's rules), so more languages fit.
//
// A Space acts on its press, so its release is held back wherever focus
// can be then (the menu, the list, the avatar's button): a button never
// acts twice, nor does the one focus moved to.
//
// Every link is a plain <a href>, followed through Shell.vue (the follow
// event: the host's navigate, the loading mark, nothing while read-only);
// "Sair" through the signOut event, so the host's beforeSignOut runs first.
// While a kept answer is drawn read-only the menu opens, its links follow
// nothing, and "Sair" says it is disabled; the theme and the language keep
// working. Text is interpolated, never parsed as HTML; nothing is stored,
// nothing runs on a timer. Since 1.6.1 the menu fades and drops in and out
// (a <Transition>), the dialog fades out before it closes (motion.ts's
// whenStill), and the second click of a double-click is no new request.
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import type { AvatarModel } from './menu.js'
import { holdNextPress, type Press, pressedAt, soonAfter } from './input.js'
import { whenStill } from './motion.js'
import ShellIcon from './ShellIcon.vue'
import ThcFlag from './controls/ThcFlag.vue'
import ThcThemeToggle from './controls/ThcThemeToggle.vue'
import { LOCALE_NAMES } from './controls/locales.js'
import { type Locale, LOCALES, type Theme } from './types.js'

const props = defineProps<{
  model: AvatarModel
  /** The theme and the language the page shows, for a host that can keep a change; null for one that cannot. */
  controls: { theme: Theme; locale: Locale } | null
  /** Under 900 px: the menu then holds the theme and the language (for a host with controls). */
  narrow: boolean
  /** The language of the shell's own words. */
  lang: Locale
  /** A kept answer drawn read-only: the menu opens, its links follow nothing, "Sair" is disabled. */
  readOnly: boolean
}>()
const emit = defineEmits<{
  follow: [event: MouseEvent, href: string]
  signOut: [event: MouseEvent, href: string]
  theme: [theme: Theme]
  locale: [locale: Locale]
}>()

const uid = useId()
const open = ref(false)
const root = ref<HTMLElement | null>(null)
const button = ref<HTMLButtonElement | null>(null)
const menu = ref<HTMLElement | null>(null)
const languages = ref<HTMLDialogElement | null>(null)
const languageList = ref<HTMLElement | null>(null)
const themeToggle = ref<InstanceType<typeof ThcThemeToggle> | null>(null)
/** languagesOpen says the language's dialog is open: its list is drawn only then. */
const languagesOpen = ref(false)

/** languageTitle is the flag's title, as the header's: "Idioma: Português (Brasil)". */
const languageTitle = computed(() => (props.controls === null ? undefined : `${props.model.languageLabel}: ${LOCALE_NAMES[props.controls.locale]}`))

/** items are the menu's items in their order: its links, the theme toggle and the flag, then "Sair". */
function items(): HTMLElement[] {
  return Array.from(menu.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
}

/** openMenu opens the menu with focus on its first item, or its last. */
async function openMenu(at: 'first' | 'last'): Promise<void> {
  open.value = true
  await nextTick()
  const all = items()
  ;(at === 'first' ? all[0] : all[all.length - 1])?.focus()
}

/** close closes the menu; focus goes back to the button when asked (Escape, a link to the page shown). */
function close(focusButton: boolean): void {
  if (!open.value) return
  open.value = false
  if (focusButton) button.value?.focus()
}

defineExpose({ close })

/**
 * A press on the menu's head, a gap or a separator would move focus out of
 * it (to the page's main area), leaving its keys dead: it is held back. A
 * press on a link or a button goes on, so a link drags and a button takes
 * focus as everywhere else (1.6.1); where Safari gives a button none, the
 * toggle takes it back (onTheme), and the flag closes the menu anyway.
 */
function onPopPress(event: MouseEvent): void {
  if (!(event.target instanceof Element) || event.target.closest('a[href], button') === null) event.preventDefault()
}

/** The pointer's last press on the button, for soonAfter. */
let pressed: Press | null = null
/** byButton says the button's own press is what opens or closes the menu now. */
let byButton = false
// Opened or closed any other way (a key, Escape, a press outside, a link),
// the next press on the button is a new request, however soon it comes.
watch(
  open,
  () => {
    if (!byButton) pressed = null
    byButton = false
  },
  { flush: 'sync' },
)

/**
 * The button's click. A press that continues the one before (the second of
 * a double-click: soonAfter) is no new request (shell 1.6.1); Safari moved
 * focus off the menu on it, so focus goes back in.
 */
function onButtonClick(event: MouseEvent): void {
  if (soonAfter(event, pressed)) {
    if (open.value && menu.value !== null && !menu.value.contains(document.activeElement)) items()[0]?.focus()
    return
  }
  pressed = pressedAt(event)
  byButton = true
  if (open.value) close(false)
  else void openMenu('first')
}

function onButtonKey(event: KeyboardEvent): void {
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    void openMenu('last')
    return
  }
  if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'ArrowDown') return
  // The browser's own click for Enter and Space would toggle it again.
  event.preventDefault()
  void openMenu('first')
}

/** holdSpace holds back a Space's release: its press already acted, here or where focus was. */
function holdSpace(event: KeyboardEvent): void {
  if (event.key === ' ') event.preventDefault()
}

/** step moves focus from the focused item to the one by places away among list, round. */
function step(list: HTMLElement[], from: HTMLElement | null, by: number): void {
  if (list.length === 0) return
  const at = from === null ? -1 : list.indexOf(from)
  const to = at < 0 ? (by > 0 ? 0 : list.length - 1) : (at + by + list.length) % list.length
  list[to]?.focus()
}

function onMenuKey(event: KeyboardEvent): void {
  const all = items()
  const focused = document.activeElement instanceof HTMLElement && all.includes(document.activeElement) ? document.activeElement : null
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      step(all, focused, 1)
      return
    case 'ArrowUp':
      event.preventDefault()
      step(all, focused, -1)
      return
    case 'ArrowRight':
    case 'ArrowLeft': {
      const group = focused?.closest('[role="group"]') ?? null
      if (group === null) return
      event.preventDefault()
      step(Array.from(group.querySelectorAll<HTMLElement>('[role="menuitem"]')), focused, event.key === 'ArrowRight' ? 1 : -1)
      return
    }
    case 'Home':
      event.preventDefault()
      all[0]?.focus()
      return
    case 'End':
      event.preventDefault()
      all[all.length - 1]?.focus()
      return
    case 'Enter':
    case ' ':
      if (focused === null) return
      event.preventDefault()
      // The item's own activation: a link followed through Shell.vue, the
      // theme moved on in place, the language's dialog opened.
      focused.click()
      return
    case 'Escape':
      // This Escape is the menu's alone: whatever holds it stays open.
      event.preventDefault()
      event.stopPropagation()
      close(true)
      return
    case 'Tab':
      close(false)
      return
    default:
      return
  }
}

/**
 * onTheme is the toggle's next mode: the host shows it, or does not, and the
 * menu stays open. Safari focuses no button on a press: focus may have gone
 * to the page's main area, which holds the menu, where its keys never
 * arrive, so it goes back to the toggle (1.6.1).
 */
function onTheme(theme: Theme): void {
  const toggle = (themeToggle.value?.$el as HTMLElement | undefined) ?? null
  if (open.value && toggle !== null && menu.value !== null && !menu.value.contains(document.activeElement)) toggle.focus()
  if (theme !== props.controls?.theme) emit('theme', theme)
}

/** options are the language's choices in the dialog, in their order. */
function options(): HTMLElement[] {
  return Array.from(languageList.value?.querySelectorAll<HTMLElement>('[data-value]') ?? [])
}

/** openLanguages is the flag's click: the menu closes, then the dialog opens on the language shown. */
async function openLanguages(event?: MouseEvent): Promise<void> {
  const d = languages.value
  if (d === null || languagesOpen.value) return
  languagesPressed = pressedAt(event)
  close(false)
  languagesOpen.value = true
  await nextTick()
  if (!d.open) {
    if (typeof d.showModal === 'function') d.showModal()
    else d.setAttribute('open', '')
  }
  const all = options()
  ;(all.find(o => o.dataset['value'] === props.controls?.locale) ?? all[0])?.focus()
}

/** languagesClosing says the dialog is fading out: it closes once still, and opens again only after. */
let languagesClosing = false
/** The press on the flag that opened the dialog, for soonAfter. */
let languagesPressed: Press | null = null

/**
 * A press that continues the one on the flag (a double-click's second, or
 * a quick tap) lands where the dialog just opened: on the backdrop, or on a
 * language under the flag on a phone. It is held back before it reaches
 * anything (1.6.1): its mousedown moves no focus off the language shown
 * (Safari would put it on the dialog itself, where the list's keys never
 * arrive), and its click neither closes the dialog nor picks a language.
 */
function onLanguagesDown(event: MouseEvent): void {
  if (soonAfter(event, languagesPressed)) event.preventDefault()
}

function onLanguagesPress(event: MouseEvent): void {
  if (!soonAfter(event, languagesPressed)) return
  event.preventDefault()
  event.stopPropagation()
  const all = options()
  if (!all.includes(document.activeElement as HTMLElement)) (all.find(o => o.dataset['value'] === props.controls?.locale) ?? all[0])?.focus()
}

/** closeLanguages fades the dialog out and then closes it (shell 1.6.1); its close event gives focus back. */
function closeLanguages(): void {
  const d = languages.value
  if (d === null || !d.open) {
    languagesClosed()
    return
  }
  if (languagesClosing) return
  languagesClosing = true
  d.classList.add('thc-shell-closing')
  whenStill(d, () => {
    languagesClosing = false
    d.classList.remove('thc-shell-closing')
    if (d.open) d.close()
  })
}

/** languagesClosed is the dialog's close event, however it closed: focus goes back to the avatar's button. */
function languagesClosed(): void {
  if (!languagesOpen.value) return
  languagesOpen.value = false
  button.value?.focus()
}

/** pickLanguage is a choice in the dialog: it closes, and the host shows the language, or does not. */
function pickLanguage(l: Locale, event?: MouseEvent): void {
  if (event !== undefined) holdNextPress(event)
  closeLanguages()
  if (l !== props.controls?.locale) emit('locale', l)
}

function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && (LOCALES as readonly string[]).includes(v)
}

function onLanguagesCancel(event: Event): void {
  event.preventDefault()
  closeLanguages()
}

function onLanguagesKey(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return
  // This Escape is the dialog's alone.
  event.preventDefault()
  event.stopPropagation()
  closeLanguages()
}

/**
 * A click on the backdrop lands on the dialog itself, outside its panel. It
 * and the close button close the dialog, and a double-click's second press
 * reaches nothing under it once it is gone (holdNextPress).
 */
function onLanguagesClick(event: MouseEvent): void {
  if (event.target !== languages.value) return
  holdNextPress(event)
  closeLanguages()
}

function onLanguagesCloseClick(event: MouseEvent): void {
  holdNextPress(event)
  closeLanguages()
}

function onLanguageListKey(event: KeyboardEvent): void {
  const all = options()
  const focused = document.activeElement instanceof HTMLElement && all.includes(document.activeElement) ? document.activeElement : null
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      event.preventDefault()
      step(all, focused, 1)
      return
    case 'ArrowUp':
    case 'ArrowLeft':
      event.preventDefault()
      step(all, focused, -1)
      return
    case 'Home':
      event.preventDefault()
      all[0]?.focus()
      return
    case 'End':
      event.preventDefault()
      all[all.length - 1]?.focus()
      return
    case 'Enter':
    case ' ': {
      const v = focused?.dataset['value']
      if (!isLocale(v)) return
      event.preventDefault()
      pickLanguage(v)
      return
    }
    default:
      return
  }
}

/**
 * follow is a link's click: the menu closes, unless the kept answer is
 * drawn read-only (nothing follows then, and the menu stays as it is); a
 * link to the page already shown changes no page, so nothing else takes
 * focus: it goes back to the button. Shell.vue then routes or lets the
 * browser follow it.
 */
function follow(event: MouseEvent, href: string): void {
  if (!props.readOnly) {
    const here = (event.currentTarget as HTMLElement | null)?.getAttribute?.('aria-current') === 'page'
    close(here)
  }
  emit('follow', event, href)
}

/** signOut is "Sair"'s click: disabled while read-only; else the menu closes and Shell.vue signs out. */
function signOut(event: MouseEvent, href: string): void {
  if (props.readOnly) {
    event.preventDefault()
    return
  }
  close(false)
  holdNextPress(event)
  emit('signOut', event, href)
}

/**
 * Focus leaving the menu closes it. Safari focuses no button on a press:
 * pressing this very button moves focus to the nearest focusable ancestor
 * (the page's main area, which holds the menu), and closing then would
 * open it again on the click (shell 1.6.1). Focus going to an ancestor is
 * no leaving; a press outside the menu closes it through onOutside.
 */
function onFocusOut(event: FocusEvent): void {
  const to = event.relatedTarget as Node | null
  if (open.value && to !== null && root.value !== null && !root.value.contains(to) && !to.contains(root.value)) open.value = false
}

function onOutside(event: Event): void {
  if (root.value !== null && !root.value.contains(event.target as Node)) open.value = false
}

// A press outside closes it too, with any button: a right or middle press
// fires no click (1.6.1).
watch(open, now => {
  if (now) {
    document.addEventListener('click', onOutside, true)
    document.addEventListener('pointerdown', onOutside, true)
  } else {
    document.removeEventListener('click', onOutside, true)
    document.removeEventListener('pointerdown', onOutside, true)
  }
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onOutside, true)
  document.removeEventListener('pointerdown', onOutside, true)
})
</script>

<template>
  <div ref="root" class="thc-shell-avatar" data-test="shell-avatar" @focusout="onFocusOut">
    <button
      :id="`${uid}-button`"
      ref="button"
      type="button"
      class="thc-shell-avatar-button"
      :class="{ 'thc-shell-avatar-current': model.current }"
      aria-haspopup="menu"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="open ? `${uid}-menu` : undefined"
      data-test="shell-avatar-button"
      @click="onButtonClick"
      @keydown="onButtonKey"
      @keyup="holdSpace"
    >
      <span class="thc-shell-person" aria-hidden="true" data-test="shell-avatar-circle">
        <template v-if="model.initials">{{ model.initials }}</template>
        <svg v-else class="thc-shell-icon" viewBox="0 0 24 24" focusable="false">
          <circle cx="12" cy="9" r="3.5" />
          <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
        </svg>
      </span>
      <span class="thc-shell-hidden">{{ model.label }}<template v-if="model.name">: </template></span>
      <span v-if="model.name" class="thc-shell-avatar-name" data-test="shell-avatar-name">{{ model.name }}</span>
      <svg class="thc-shell-chevron thc-shell-avatar-chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6" /></svg>
    </button>
    <Transition name="thc-shell-pop">
      <div v-if="open" class="thc-shell-avatar-pop" data-test="shell-avatar-pop" @mousedown="onPopPress">
        <div class="thc-shell-avatar-head" aria-hidden="true" data-test="shell-avatar-head">
          <span class="thc-shell-person">
            <template v-if="model.initials">{{ model.initials }}</template>
            <svg v-else class="thc-shell-icon" viewBox="0 0 24 24" focusable="false">
              <circle cx="12" cy="9" r="3.5" />
              <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
            </svg>
          </span>
          <span class="thc-shell-ws-name">{{ model.name ?? model.label }}</span>
        </div>
        <ul :id="`${uid}-menu`" ref="menu" class="thc-shell-avatar-menu" role="menu" :aria-labelledby="`${uid}-button`" data-test="shell-avatar-menu" @keydown="onMenuKey" @keyup="holdSpace">
          <li v-for="l in model.items" :key="l.id" role="none">
            <a
              class="thc-shell-avatar-item"
              :class="{ 'thc-shell-current': l.current }"
              role="menuitem"
              tabindex="-1"
              :href="l.href"
              :aria-current="l.current ?? undefined"
              data-test="shell-avatar-item"
              :data-id="l.id"
              @click="follow($event, l.href)"
            >
              <ShellIcon v-if="l.icon" :icon="l.icon" />
              <span class="thc-shell-link-label">{{ l.label }}</span>
            </a>
          </li>
          <li v-if="model.appearance" role="none">
            <a
              class="thc-shell-avatar-item"
              :class="{ 'thc-shell-current': model.appearance.current }"
              role="menuitem"
              tabindex="-1"
              :href="model.appearance.href"
              :aria-current="model.appearance.current ? 'page' : undefined"
              data-test="shell-appearance"
              @click="follow($event, model.appearance?.href ?? '')"
            >
              <svg class="thc-shell-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <circle cx="12" cy="12" r="8.5" />
                <path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.2 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.2-3.5-8.5s1.1-6.1 3.5-8.5z" />
              </svg>
              <span class="thc-shell-link-label">{{ model.appearance.label }}</span>
            </a>
          </li>
          <template v-if="controls && narrow">
            <li role="separator" class="thc-shell-avatar-sep" />
            <li role="none">
              <!-- The theme toggle and the language's flag, as the header draws them from 900 px. -->
              <div class="thc-shell-avatar-prefs" role="group" :aria-label="model.prefsLabel" data-test="shell-avatar-prefs">
                <ThcThemeToggle ref="themeToggle" :value="controls.theme" :locale="lang" role="menuitem" tabindex="-1" data-test="shell-avatar-theme" @change="onTheme" />
                <button
                  type="button"
                  class="thc-shell-ctl-lang-button"
                  role="menuitem"
                  tabindex="-1"
                  aria-haspopup="dialog"
                  :title="languageTitle"
                  :data-value="controls.locale"
                  data-test="shell-avatar-language"
                  @click="openLanguages"
                >
                  <ThcFlag :locale="controls.locale" :size="22" />
                  <span class="thc-shell-hidden">{{ model.languageLabel }}: </span>
                  <span class="thc-shell-hidden" :lang="controls.locale">{{ LOCALE_NAMES[controls.locale] }}</span>
                  <svg class="thc-shell-ctl-chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6" /></svg>
                </button>
              </div>
            </li>
          </template>
          <li role="separator" class="thc-shell-avatar-sep" />
          <li role="none">
            <a
              class="thc-shell-avatar-item thc-shell-avatar-out"
              role="menuitem"
              tabindex="-1"
              :href="model.signOut.href"
              :aria-disabled="readOnly ? 'true' : undefined"
              data-test="shell-sign-out"
              @click="signOut($event, model.signOut.href)"
            >
              <svg class="thc-shell-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
                <path d="M10 16l-4-4 4-4M6 12h10" />
              </svg>
              <span class="thc-shell-link-label">{{ model.signOut.label }}</span>
            </a>
          </li>
        </ul>
      </div>
    </Transition>
    <!-- The language's choice, in the middle of the screen; its list is drawn while it is open. -->
    <dialog
      v-if="controls"
      ref="languages"
      class="thc-shell-lang-dialog"
      :aria-labelledby="`${uid}-languages`"
      data-test="shell-language-dialog"
      @close="languagesClosed"
      @cancel="onLanguagesCancel"
      @keydown="onLanguagesKey"
      @mousedown.capture="onLanguagesDown"
      @click.capture="onLanguagesPress"
      @click="onLanguagesClick"
    >
      <div class="thc-shell-lang-panel">
        <div class="thc-shell-lang-head">
          <h2 :id="`${uid}-languages`" class="thc-shell-lang-title" data-test="shell-language-title">{{ model.languageLabel }}</h2>
          <button type="button" class="thc-shell-lang-close" data-test="shell-language-close" @click="onLanguagesCloseClick">
            <svg class="thc-shell-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" /></svg>
            <span class="thc-shell-hidden">{{ model.closeLabel }}</span>
          </button>
        </div>
        <ul v-if="languagesOpen" ref="languageList" class="thc-shell-lang-list" data-test="shell-language-list" @keydown="onLanguageListKey" @keyup="holdSpace">
          <li v-for="l in LOCALES" :key="l">
            <button
              type="button"
              class="thc-shell-ctl-item thc-shell-lang-option"
              :aria-current="l === controls.locale ? 'true' : undefined"
              :lang="l"
              data-test="language-option"
              :data-value="l"
              @click="pickLanguage(l, $event)"
            >
              <ThcFlag :locale="l" :size="22" />
              <span class="thc-shell-ctl-item-name">{{ LOCALE_NAMES[l] }}</span>
              <svg v-if="l === controls.locale" class="thc-shell-ctl-check" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12l5 5 9-10" /></svg>
            </button>
          </li>
        </ul>
      </div>
    </dialog>
  </div>
</template>
