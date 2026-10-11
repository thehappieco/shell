<script setup lang="ts">
// A brand's symbol, drawn from the kit's own geometry (marks.ts, generated
// from the official files) and played with the kit's own choreography
// (marks.css). Colors are classes and data attributes, never a style
// attribute, so the pages' CSP (style-src 'self') holds:
//   - outline: the brand's color on a white interior (light pages);
//   - tile: white on the brand's color (dark pages);
//   - auto: outline, or tile under the dark theme, as Wappie's console does.
// The choreography plays once when asked (animate="load", or play()), and
// never under prefers-reduced-motion: the CSS animations stop by the kit's
// own media rule, and the happie smile's SMIL morph is simply not begun.
// While it plays, a draw-in part carries the kit's starting dash; at rest a
// part is the plain kit drawing.
//
// Every symbol replays when a mouse comes onto its host (hover="host", the
// owner's trademark; design 2026-10-10, 3.4): the nearest a, button or
// [data-thc-hover] around it, else the outermost SVG it is drawn in (the
// symbol itself, or the lockup it is part of). So a menu row, the brand
// link or a product card plays its symbol. The first play only sets the
// playing state; a replay rewinds the running CSS animations
// (getAnimations, currentTime 0, play), since taking the class off and on
// within one task restarts nothing, and begins the SMIL morphs again. A
// replay less than 1.2 s (the choreography's length) after the last start
// is ignored, measured on the event's timeStamp, so moving along the menu
// never stutters, and no timer runs. Touch never replays (a tap
// navigates), and nothing replays under prefers-reduced-motion.
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { FRAME_INNER, FRAME_OUTER, MARKS, type BrandId, type MarkPart } from './marks.js'

const props = withDefaults(
  defineProps<{
    brand: BrandId
    /** The width and height in CSS pixels, written as attributes so the box is kept before the stylesheet loads. */
    size?: number
    mode?: 'auto' | 'outline' | 'tile'
    animate?: 'load' | 'none'
    /** Whether a mouse on the symbol's host replays it. */
    hover?: 'host' | 'none'
    /** The accessible name; without one the symbol is decorative. */
    label?: string
  }>(),
  { size: 32, mode: 'auto', animate: 'none', hover: 'host', label: undefined },
)

/** The choreography's length: a replay sooner than this after the last start is ignored. */
const REPLAY_GAP_MS = 1200

const mark = computed(() => MARKS[props.brand])
const playing = ref(false)
const svg = ref<SVGSVGElement | null>(null)
/** When the choreography last started, on the clock of events' timeStamp; null before it ever did. */
let started: number | null = null
/** The element whose pointerenter replays the symbol, while one listens. */
let host: Element | null = null

/** reduced says whether the person asked for less motion; a browser without matchMedia animates. */
function reduced(): boolean {
  try {
    return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  } catch {
    return false
  }
}

/** now is the time on the clock of events' timeStamp (the page's time origin), or null without one. */
function now(): number | null {
  try {
    return globalThis.performance?.now() ?? null
  } catch {
    return null
  }
}

function partClass(p: MarkPart): string[] {
  return ['thc-shell-bm-part', `thc-shell-bm-${props.brand}-${p.id}`, `thc-shell-bm-k-${p.kind}`]
}

/** beginSmil begins, or begins again, the kit's SMIL morphs (the happie smile's). */
function beginSmil(el: SVGSVGElement): void {
  for (const a of Array.from(el.querySelectorAll('animate'))) {
    const begin = (a as SVGAnimationElement).beginElement
    if (typeof begin === 'function') begin.call(a)
  }
}

/**
 * play starts the choreography, or, once it has played, rewinds it: every
 * CSS animation of the symbol back to its start, then the SMIL morphs.
 * at is the start's time when an event gives it.
 */
async function play(at?: number): Promise<void> {
  if (reduced()) return
  started = at ?? now()
  const el = svg.value
  if (playing.value && el !== null) {
    for (const a of el.getAnimations?.({ subtree: true }) ?? []) {
      a.currentTime = 0
      a.play()
    }
    beginSmil(el)
    return
  }
  playing.value = true
  await nextTick()
  if (svg.value !== null) beginSmil(svg.value)
}

/** onEnter replays the symbol for a mouse coming onto its host, at most once per choreography. */
function onEnter(event: Event): void {
  if ((event as PointerEvent).pointerType !== 'mouse' || reduced()) return
  const at = event.timeStamp
  if (started !== null && at >= started && at - started < REPLAY_GAP_MS) return
  void play(at)
}

/** hostOf is the element whose hover plays the symbol: see the rule above. */
function hostOf(el: SVGSVGElement): Element {
  const around = el.parentElement?.closest('a, button, [data-thc-hover]')
  if (around) return around
  let top: Element = el
  for (let up = el.parentElement?.closest('svg'); up; up = up.parentElement?.closest('svg')) top = up
  return top
}

onMounted(() => {
  if (props.animate === 'load') void play()
  if (props.hover === 'host' && svg.value !== null) {
    host = hostOf(svg.value)
    host.addEventListener('pointerenter', onEnter)
  }
})

onBeforeUnmount(() => {
  host?.removeEventListener('pointerenter', onEnter)
  host = null
})

defineExpose({ play: () => play() })
</script>

<template>
  <svg
    ref="svg"
    class="thc-shell-bm-svg"
    :data-brand="brand"
    :data-mode="mode"
    viewBox="0 0 90 90"
    :width="size"
    :height="size"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
    focusable="false"
  >
    <title v-if="label">{{ label }}</title>
    <g class="thc-shell-bm" :class="{ 'thc-shell-bm--play': playing }">
      <path class="thc-shell-bm-frame" :d="FRAME_OUTER" />
      <path class="thc-shell-bm-interior" :d="FRAME_INNER" />
      <g v-for="p in mark.parts" :key="p.id" class="thc-shell-bm-part-wrap" :class="`thc-shell-bm-${brand}-${p.id}-wrap`">
        <path
          :class="partClass(p)"
          :d="p.d"
          :stroke-width="p.width"
          :stroke-linecap="p.linecap"
          :stroke-linejoin="p.linejoin"
          :stroke-dasharray="playing ? p.dash?.array : undefined"
          :stroke-dashoffset="playing ? p.dash?.offset : undefined"
          :opacity="playing ? p.startOpacity : undefined"
        >
          <template v-if="playing">
            <animate
              v-for="(a, i) in p.smil ?? []"
              :key="i"
              :attributeName="a.attributeName"
              :values="a.values"
              :keyTimes="a.keyTimes"
              :keySplines="a.keySplines"
              :calcMode="a.calcMode"
              :dur="a.dur"
              :fill="a.fill"
              begin="indefinite"
            />
          </template>
        </path>
      </g>
    </g>
  </svg>
</template>

<style>
/* The colors of a symbol (brand manual: the registered colors, white). */
.thc-shell-bm-svg {
  display: block;
  flex: 0 0 auto;
  overflow: visible;
}

.thc-shell-bm-svg[data-brand='happie'] {
  --thc-bm-color: #242b5e;
}

.thc-shell-bm-svg[data-brand='wappie'] {
  --thc-bm-color: #137659;
}

.thc-shell-bm-svg[data-brand='mailie'] {
  --thc-bm-color: #b24b1e;
}

.thc-shell-bm-svg[data-brand='vaultie'] {
  --thc-bm-color: #262a62;
}

.thc-shell-bm-svg[data-brand='authie'] {
  --thc-bm-color: #176b80;
}

.thc-shell-bm-svg[data-brand='sophie'] {
  --thc-bm-color: #7040a0;
}

.thc-shell-bm-svg[data-brand='nova'] {
  --thc-bm-color: #a33960;
}

.thc-shell-bm-svg[data-mode='outline'],
.thc-shell-bm-svg[data-mode='auto'] {
  --thc-bm-frame: var(--thc-bm-color);
  --thc-bm-interior: #ffffff;
  --thc-bm-symbol: var(--thc-bm-color);
}

.thc-shell-bm-svg[data-mode='tile'],
:root[data-theme='dark'] .thc-shell-bm-svg[data-mode='auto'] {
  --thc-bm-frame: #ffffff;
  --thc-bm-interior: var(--thc-bm-color);
  --thc-bm-symbol: #ffffff;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) .thc-shell-bm-svg[data-mode='auto'] {
    --thc-bm-frame: #ffffff;
    --thc-bm-interior: var(--thc-bm-color);
    --thc-bm-symbol: #ffffff;
  }
}

.thc-shell-bm-frame {
  fill: var(--thc-bm-frame);
}

.thc-shell-bm-interior {
  fill: var(--thc-bm-interior);
}

.thc-shell-bm-k-fill {
  fill: var(--thc-bm-symbol);
}

.thc-shell-bm-k-stroke {
  fill: none;
  stroke: var(--thc-bm-symbol);
}

.thc-shell-bm-k-cut {
  fill: none;
  stroke: var(--thc-bm-interior);
}

.thc-shell-bm-k-cut-fill {
  fill: var(--thc-bm-interior);
}
</style>

<style src="./marks.css"></style>
