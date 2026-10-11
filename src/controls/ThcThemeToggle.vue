<script setup lang="ts">
// The page's theme as one control (design 2026-10-10, 4.1), on every
// screen: the shell's header, the console's pages outside it, and id.'s
// header.
//
// The toggle is one round button with the mode's icon (ThemeIcon.vue): a
// sun, a moon, or the system's half sun, half moon. A click asks for the
// next mode (cycle.ts): on "system", the opposite of what the system shows
// at that moment, read then in prefers-color-scheme, so the first click
// always changes the page; then the other; then "system" again. Its name,
// and its title, say the mode now and the next one. The icon swaps with a
// short rotate and fade.
//
// The segmented variant (My account) draws the three modes with their icons
// and words as a radio group: one tab stop, on the chosen mode; the arrow
// keys ask for the next or the previous one, and focus follows the mode
// the host shows once it has answered, so a change the host drops leaves
// focus where the choice still is.
//
// The rules it enforces: it only asks (change) and shows what the host
// passes back (value): the host applies and saves. Vue only: no storage, no
// timer, no style attribute; the one listener follows the system's scheme
// for the toggle's name. Every animation is a CSS transition, and none runs
// under prefers-reduced-motion. Its words are the shell's (i18n.ts), in the
// page's language (locale). Attributes the host passes (data-test, aria-busy,
// aria-describedby, aria-labelledby) land on the button, or on the group.
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { shellText } from '../i18n.js'
import { type Locale, type Theme, THEMES } from '../types.js'
import { nextTheme, prefersDark } from './cycle.js'
import ThemeIcon from './ThemeIcon.vue'

const props = withDefaults(
  defineProps<{
    /** The mode the page shows now. */
    value: Theme
    /** The language of the control's words. */
    locale: Locale
    variant?: 'toggle' | 'segmented'
  }>(),
  { variant: 'toggle' },
)
const emit = defineEmits<{ change: [theme: Theme] }>()

const group = ref<HTMLElement | null>(null)
/** systemDark is the system's scheme, kept for the toggle's name; a click reads it again. */
const systemDark = ref(prefersDark())

const modeName = (th: Theme) => shellText(props.locale, `theme.${th}`)
const groupLabel = computed(() => shellText(props.locale, 'theme'))
const toggleLabel = computed(() =>
  shellText(props.locale, 'themeNow', { mode: modeName(props.value), next: modeName(nextTheme(props.value, systemDark.value)) }),
)

function onToggle(): void {
  systemDark.value = prefersDark()
  emit('change', nextTheme(props.value, systemDark.value))
}

function isTheme(v: unknown): v is Theme {
  return typeof v === 'string' && (THEMES as readonly string[]).includes(v)
}

function choose(th: Theme): void {
  if (th !== props.value) emit('change', th)
}

const STEPS: Readonly<Record<string, number>> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }

/** onGroupKey moves from the focused mode to the next or previous one, then puts focus on the mode the host shows. */
async function onGroupKey(event: KeyboardEvent): Promise<void> {
  const step = STEPS[event.key]
  if (step === undefined) return
  event.preventDefault()
  const from = (event.target as HTMLElement | null)?.dataset?.['value']
  const at = THEMES.indexOf(isTheme(from) ? from : props.value)
  const to = THEMES[(at + step + THEMES.length) % THEMES.length]
  if (to !== undefined) choose(to)
  await nextTick()
  group.value?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus()
}

let scheme: MediaQueryList | null = null
function onScheme(e: MediaQueryListEvent): void {
  systemDark.value = e.matches
}
onMounted(() => {
  try {
    scheme = globalThis.matchMedia?.('(prefers-color-scheme: dark)') ?? null
  } catch {
    scheme = null
  }
  scheme?.addEventListener?.('change', onScheme)
})
onBeforeUnmount(() => scheme?.removeEventListener?.('change', onScheme))
</script>

<template>
  <button
    v-if="variant === 'toggle'"
    type="button"
    class="thc-shell-ctl-toggle"
    :aria-label="toggleLabel"
    :title="toggleLabel"
    :data-value="value"
    @click="onToggle"
  >
    <span class="thc-shell-ctl-icons">
      <Transition name="thc-shell-ctl-spin">
        <ThemeIcon :key="value" :theme="value" />
      </Transition>
    </span>
  </button>
  <div v-else ref="group" class="thc-shell-ctl-seg" role="radiogroup" :aria-label="groupLabel" :data-value="value" @keydown="onGroupKey">
    <button
      v-for="th in THEMES"
      :key="th"
      type="button"
      role="radio"
      class="thc-shell-ctl-seg-item"
      :aria-checked="th === value ? 'true' : 'false'"
      :tabindex="th === value ? 0 : -1"
      data-test="theme-option"
      :data-value="th"
      @click="choose(th)"
    >
      <ThemeIcon :theme="th" />
      <span>{{ modeName(th) }}</span>
    </button>
  </div>
</template>

<style>
/* The theme controls, on the --thc-* tokens: a round icon button the size
   of the header's actions (touch sized under 900 px), and a segmented
   choice in a field's outline whose chosen mode takes the page's tone. */

.thc-shell-ctl-toggle {
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

.thc-shell-ctl-toggle:hover {
  background: var(--thc-hover);
  color: var(--thc-text);
}

.thc-shell-ctl-toggle:focus-visible,
.thc-shell-ctl-seg-item:focus-visible {
  outline: var(--thc-focus-width) solid var(--thc-tone);
  outline-offset: 2px;
}

/* The leaving icon and the coming one share one cell while they swap. */
.thc-shell-ctl-icons {
  display: grid;
  place-items: center;
}

.thc-shell-ctl-icons > .thc-shell-ctl-icon {
  grid-area: 1 / 1;
}

.thc-shell-ctl-icon {
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.thc-shell-ctl-icon .thc-shell-ctl-fill {
  fill: currentColor;
}

.thc-shell-ctl-spin-enter-active,
.thc-shell-ctl-spin-leave-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}

.thc-shell-ctl-spin-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.6);
}

.thc-shell-ctl-spin-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.6);
}

.thc-shell-ctl-seg {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 2px;
  max-width: 100%;
  padding: 3px;
  border: 1px solid var(--thc-field-line);
  border-radius: 11px;
  background: var(--thc-input);
}

.thc-shell-ctl-seg-item {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: var(--thc-target);
  padding: 0 14px 0 11px;
  border: 0;
  border-radius: var(--thc-radius-sm);
  background: transparent;
  color: var(--thc-muted);
  font: inherit;
  font-size: var(--thc-text-size-sm);
  font-weight: 550;
  cursor: pointer;
}

.thc-shell-ctl-seg-item:hover {
  background: var(--thc-hover);
  color: var(--thc-text);
}

.thc-shell-ctl-seg-item[aria-checked='true'] {
  background: var(--thc-tone-tint);
  color: var(--thc-tone);
  font-weight: 650;
}

/* Forced colors (a Windows contrast theme) replace the fill and the text
   color with the system's: the chosen mode keeps an outline of its own. */
@media (forced-colors: active) {
  .thc-shell-ctl-seg-item[aria-checked='true'] {
    outline: 2px solid Highlight;
    outline-offset: -2px;
  }
}

.thc-shell-ctl-seg-item .thc-shell-ctl-icon {
  width: 18px;
  height: 18px;
}

@media (min-width: 900px) {
  .thc-shell-ctl-toggle {
    width: var(--thc-control);
    height: var(--thc-control);
  }

  .thc-shell-ctl-seg-item {
    min-height: calc(var(--thc-control) - 6px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .thc-shell-ctl-spin-enter-active,
  .thc-shell-ctl-spin-leave-active {
    transition: none;
  }
}
</style>
