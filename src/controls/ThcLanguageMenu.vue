<script setup lang="ts">
// The page's language as a menu button (design 2026-10-10, 4.1), on every
// screen: the shell's header, the console's pages outside it, id.'s header,
// and, as a field, My account; and, as a list, the shell's account panel
// under 900 px (shell 1.3.0).
//
// The button shows the current language's flag (ThcFlag.vue) and a small
// chevron; the field variant shows its name too. A click opens a menu of
// the three languages, each its flag and its name in itself, marked with its
// lang; it opens with a fade, a 6 px slide and a slight scale, from the
// button. It follows the WAI-ARIA menu button pattern:
//   - the button has aria-haspopup="menu", aria-expanded, and aria-controls
//     while the menu is there (it is drawn only while open, so no style
//     attribute ever hides it); its name says "Idioma" and the language (the
//     language's own name marked with its lang); the menu is labelled by
//     the button;
//   - the items are menuitemradio, aria-checked on the current language;
//   - Enter, Space or ArrowDown on the button open the menu on the current
//     language; ArrowUp and ArrowDown move (round), Home and End go to the
//     first and the last; Enter or Space choose; Escape closes it and
//     returns focus to the button, and goes no further; Tab closes it and
//     focus moves on; a choice closes it and returns focus to the button;
//   - a click outside closes it: one capture listener, added only while the
//     menu is open (as the shell's workspace selector does).
//
// The list variant draws the three languages at once, with no menu: a
// radio group of their flags and names, each in its own lang, with one tab
// stop on the chosen language; a click, or the arrow keys from the focused
// one, ask for a language, and focus follows the language the host shows
// once it has answered (as the theme's segmented variant does).
//
// The rules it enforces: it only asks (change) and shows what the host
// passes back (value): the host applies and saves. Vue only: no storage, no
// timer, no style attribute; the animation is a CSS transition, none under
// prefers-reduced-motion. Its words are the shell's (i18n.ts), in the page's
// language (locale), and each language's name is LOCALE_NAMES's. Attributes
// the host passes (data-test, aria-busy, aria-describedby) land on the
// button, the control that keeps focus.
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { shellText } from '../i18n.js'
import { holdNextPress, type Press, pressedAt, soonAfter } from '../input.js'
import { type Locale, LOCALES } from '../types.js'
import { LOCALE_NAMES } from './locales.js'
import ThcFlag from './ThcFlag.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** The language the page speaks now. */
    value: Locale
    /** The language of the control's own words. */
    locale: Locale
    variant?: 'menu' | 'field' | 'list'
  }>(),
  { variant: 'menu' },
)
const emit = defineEmits<{ change: [locale: Locale] }>()

const uid = useId()
const open = ref(false)
const root = ref<HTMLElement | null>(null)
const button = ref<HTMLButtonElement | null>(null)
const menu = ref<HTMLElement | null>(null)
const list = ref<HTMLElement | null>(null)

const word = computed(() => shellText(props.locale, 'language'))
const title = computed(() => `${word.value}: ${LOCALE_NAMES[props.value]}`)

function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && (LOCALES as readonly string[]).includes(v)
}

function items(): HTMLElement[] {
  return Array.from(menu.value?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? [])
}

/** openMenu opens the menu with focus on the current language. */
async function openMenu(): Promise<void> {
  open.value = true
  await nextTick()
  const all = items()
  ;(all.find(i => i.dataset['value'] === props.value) ?? all[0])?.focus()
}

function close(focusButton: boolean): void {
  open.value = false
  if (focusButton) button.value?.focus()
}

function choose(l: Locale, event?: MouseEvent): void {
  if (event !== undefined) holdNextPress(event)
  close(true)
  if (l !== props.value) emit('change', l)
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
 * focus off the menu on it, so focus goes back to the language shown.
 */
function onButtonClick(event: MouseEvent): void {
  if (soonAfter(event, pressed)) {
    const all = items()
    if (open.value && !all.some(i => i === document.activeElement)) (all.find(i => i.dataset['value'] === props.value) ?? all[0])?.focus()
    return
  }
  pressed = pressedAt(event)
  byButton = true
  if (open.value) close(false)
  else void openMenu()
}

function onButtonKey(event: KeyboardEvent): void {
  if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'ArrowDown') return
  // The browser's own click for Enter and Space would toggle it again.
  event.preventDefault()
  void openMenu()
}

function onMenuKey(event: KeyboardEvent): void {
  const all = items()
  const at = all.indexOf(document.activeElement as HTMLElement)
  let to: number
  switch (event.key) {
    case 'ArrowDown':
      to = at < 0 ? 0 : (at + 1) % all.length
      break
    case 'ArrowUp':
      to = at < 0 ? all.length - 1 : (at - 1 + all.length) % all.length
      break
    case 'Home':
      to = 0
      break
    case 'End':
      to = all.length - 1
      break
    case 'Enter':
    case ' ': {
      event.preventDefault()
      const v = all[at]?.dataset['value']
      if (isLocale(v)) choose(v)
      return
    }
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
  event.preventDefault()
  all[to]?.focus()
}

/**
 * onFocusOut closes the menu when focus leaves the control for another
 * element. A mouse press inside the open menu (its padding, the gap between
 * two items, an item) never moves focus (the list's mousedown is
 * prevented), so the item that has it keeps the menu's keys.
 */
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

/** pick asks for a language from the list variant: the host shows it, or does not. */
function pick(l: Locale): void {
  if (l !== props.value) emit('change', l)
}

const STEPS: Readonly<Record<string, number>> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }

/** onListKey moves from the focused language to the next or previous one, then puts focus on the language the host shows. */
async function onListKey(event: KeyboardEvent): Promise<void> {
  const step = STEPS[event.key]
  if (step === undefined) return
  event.preventDefault()
  const from = (event.target as HTMLElement | null)?.dataset?.['value']
  const at = LOCALES.indexOf(isLocale(from) ? from : props.value)
  const to = LOCALES[(at + step + LOCALES.length) % LOCALES.length]
  if (to !== undefined) pick(to)
  await nextTick()
  focusChecked()
}

/** focusChecked puts focus on the language the host shows, while focus is in the list. */
function focusChecked(): void {
  const el = list.value
  if (el === null || !el.contains(globalThis.document?.activeElement ?? null)) return
  el.querySelector<HTMLElement>('[aria-checked="true"]')?.focus()
}
// A host may show the change after a wait of its own (the console decides
// it once its session is known): focus follows the value when it arrives.
watch(
  () => props.value,
  () => focusChecked(),
  { flush: 'post' },
)

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
  <div v-if="variant === 'list'" ref="list" class="thc-shell-ctl-lang-list" role="radiogroup" :aria-label="word" :data-value="value" v-bind="$attrs" @keydown="onListKey">
    <button
      v-for="l in LOCALES"
      :key="l"
      type="button"
      role="radio"
      class="thc-shell-ctl-item thc-shell-ctl-lang-option"
      :aria-checked="l === value ? 'true' : 'false'"
      :tabindex="l === value ? 0 : -1"
      :lang="l"
      data-test="language-option"
      :data-value="l"
      @click="pick(l)"
    >
      <ThcFlag :locale="l" :size="22" />
      <span class="thc-shell-ctl-item-name">{{ LOCALE_NAMES[l] }}</span>
      <svg v-if="l === value" class="thc-shell-ctl-check" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12l5 5 9-10" /></svg>
    </button>
  </div>
  <div v-else ref="root" class="thc-shell-ctl-lang" :class="`thc-shell-ctl-lang-${variant}`" @focusout="onFocusOut">
    <button
      :id="`${uid}-button`"
      ref="button"
      type="button"
      class="thc-shell-ctl-lang-button"
      aria-haspopup="menu"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="open ? `${uid}-menu` : undefined"
      :title="variant === 'menu' ? title : undefined"
      :data-value="value"
      v-bind="$attrs"
      @click="onButtonClick"
      @keydown="onButtonKey"
    >
      <ThcFlag :locale="value" :size="variant === 'field' ? 24 : 22" />
      <span class="thc-shell-ctl-hidden">{{ word }}: </span>
      <span :class="variant === 'field' ? 'thc-shell-ctl-lang-name' : 'thc-shell-ctl-hidden'" :lang="value">{{ LOCALE_NAMES[value] }}</span>
      <svg class="thc-shell-ctl-chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6" /></svg>
    </button>
    <Transition name="thc-shell-ctl-pop">
      <ul
        v-if="open"
        :id="`${uid}-menu`"
        ref="menu"
        class="thc-shell-ctl-menu"
        role="menu"
        :aria-labelledby="`${uid}-button`"
        data-test="language-menu"
        @keydown="onMenuKey"
        @mousedown.prevent
      >
        <li
          v-for="l in LOCALES"
          :key="l"
          class="thc-shell-ctl-item"
          role="menuitemradio"
          :aria-checked="l === value ? 'true' : 'false'"
          tabindex="-1"
          :lang="l"
          data-test="language-option"
          :data-value="l"
          @click="choose(l, $event)"
        >
          <ThcFlag :locale="l" :size="22" />
          <span class="thc-shell-ctl-item-name">{{ LOCALE_NAMES[l] }}</span>
          <svg v-if="l === value" class="thc-shell-ctl-check" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12l5 5 9-10" /></svg>
        </li>
      </ul>
    </Transition>
  </div>
</template>

<style>
/* The language control, on the --thc-* tokens: a round button with the
   flag (touch sized under 900 px), or a field's outline with the flag and
   the name (My account); the menu is a raised panel under it, at its right
   edge in a header and at its left edge as a field, which grows from the
   button. */

.thc-shell-ctl-lang {
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
  max-width: 100%;
}

.thc-shell-ctl-hidden {
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

.thc-shell-ctl-lang-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: var(--thc-target);
  height: var(--thc-target);
  padding: 0 7px 0 10px;
  border: 0;
  border-radius: var(--thc-radius-pill);
  background: transparent;
  color: var(--thc-muted);
  font: inherit;
  cursor: pointer;
}

.thc-shell-ctl-lang-button:hover,
.thc-shell-ctl-lang-button[aria-expanded='true'] {
  background: var(--thc-hover);
  color: var(--thc-text);
}

.thc-shell-ctl-lang-button:focus-visible,
.thc-shell-ctl-item:focus-visible {
  outline: var(--thc-focus-width) solid var(--thc-tone);
  outline-offset: 2px;
}

.thc-shell-ctl-chevron {
  transition: transform var(--thc-motion-open, 240ms) var(--thc-ease, cubic-bezier(0.22, 0.61, 0.36, 1));
}

.thc-shell-ctl-chevron,
.thc-shell-ctl-check {
  width: 14px;
  height: 14px;
  flex: 0 0 auto;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.thc-shell-ctl-lang-button[aria-expanded='true'] .thc-shell-ctl-chevron {
  transform: rotate(180deg);
}

/* As a field: the outline of a select, the name beside the flag. */
.thc-shell-ctl-lang-field {
  width: 100%;
  max-width: 20rem;
}

.thc-shell-ctl-lang-field .thc-shell-ctl-lang-button {
  justify-content: flex-start;
  gap: 10px;
  width: 100%;
  height: auto;
  min-height: var(--thc-target);
  padding: 0 12px;
  border: 1px solid var(--thc-field-line);
  border-radius: var(--thc-radius-sm);
  background: var(--thc-input);
  color: var(--thc-text);
  text-align: left;
}

.thc-shell-ctl-lang-field .thc-shell-ctl-lang-button:hover,
.thc-shell-ctl-lang-field .thc-shell-ctl-lang-button[aria-expanded='true'] {
  background: var(--thc-input);
  border-color: var(--thc-tone);
}

.thc-shell-ctl-lang-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thc-shell-ctl-lang-field .thc-shell-ctl-chevron {
  margin-left: auto;
  color: var(--thc-muted);
}

.thc-shell-ctl-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 13.5rem;
  margin: 0;
  padding: 6px;
  list-style: none;
  background: var(--thc-raised);
  border: 1px solid var(--thc-line);
  border-radius: var(--thc-radius-md);
  box-shadow: var(--thc-shadow-pop);
  transform-origin: top right;
}

.thc-shell-ctl-lang-field .thc-shell-ctl-menu {
  right: auto;
  left: 0;
  transform-origin: top left;
}

.thc-shell-ctl-item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: var(--thc-target);
  padding: 6px 10px;
  border-radius: var(--thc-radius-nav);
  color: var(--thc-text);
  font-size: 13.5px;
  font-weight: 550;
  line-height: 1.3;
  cursor: pointer;
}

.thc-shell-ctl-item:hover,
:where(:root:not(.thc-shell-input-pointer)) .thc-shell-ctl-item:focus-visible {
  background: var(--thc-hover);
}

.thc-shell-ctl-item[aria-checked='true'] {
  color: var(--thc-tone);
  font-weight: 650;
}

.thc-shell-ctl-item-name {
  min-width: 0;
  overflow-wrap: anywhere;
}

.thc-shell-ctl-check {
  margin-left: auto;
}

/* As a list (the shell's account panel): the menu's items, always there. */
.thc-shell-ctl-lang-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.thc-shell-ctl-lang-option {
  width: 100%;
  border: 0;
  background: transparent;
  font: inherit;
  font-size: 13.5px;
  font-weight: 550;
  line-height: 1.3;
  text-align: left;
}

.thc-shell-ctl-lang-option[aria-checked='true'] {
  background: var(--thc-tone-tint);
}

.thc-shell-ctl-pop-enter-active {
  transition:
    opacity var(--thc-motion-open, 240ms) var(--thc-ease, cubic-bezier(0.22, 0.61, 0.36, 1)),
    transform var(--thc-motion-open, 240ms) var(--thc-ease, cubic-bezier(0.22, 0.61, 0.36, 1));
}

.thc-shell-ctl-pop-leave-active {
  transition:
    opacity var(--thc-motion-close, 180ms) var(--thc-ease, cubic-bezier(0.22, 0.61, 0.36, 1)),
    transform var(--thc-motion-close, 180ms) var(--thc-ease, cubic-bezier(0.22, 0.61, 0.36, 1));
  pointer-events: none;
}

.thc-shell-ctl-pop-enter-from,
.thc-shell-ctl-pop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}

@media (min-width: 900px) {
  .thc-shell-ctl-lang-button {
    height: var(--thc-control);
    min-width: var(--thc-control);
  }

  .thc-shell-ctl-lang-field .thc-shell-ctl-lang-button {
    height: auto;
    min-height: var(--thc-control);
  }

  .thc-shell-ctl-item {
    min-height: var(--thc-control);
  }
}

@media (prefers-reduced-motion: reduce) {
  .thc-shell-ctl-pop-enter-active,
  .thc-shell-ctl-pop-leave-active,
  .thc-shell-ctl-chevron {
    transition: none;
  }

  .thc-shell-ctl-lang-button[aria-expanded='true'] .thc-shell-ctl-chevron {
    transform: none;
  }
}
</style>
