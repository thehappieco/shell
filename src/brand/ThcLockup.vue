<script setup lang="ts">
// The company's lockup, the symbol with "the happie co.", laid out as the
// kit's own files lay it out (marks.ts, generated from them):
//   - horizontal (logo_texto_horizontal, LOCKUP): the lettering on one line,
//     at the manual's size (0.82 H) and gap (0.24 H);
//   - stacked (logo_texto_tres_linhas, LOCKUP_STACKED): "the", "happie" and
//     "co." on three lines beside the symbol, one body for the three.
// One SVG whose height is the symbol's, so no page sets the proportions by
// hand. The symbol keeps its colors (outline on light, tile on dark); the
// lettering takes currentColor, which the host sets to the brand ink. The
// symbol plays the kit's choreography once when asked (animate="load") and
// again when a mouse comes onto its host, by ThcMark's own rule: the link
// around the lockup, else the lockup itself; the lettering never moves, and
// nothing does under reduced motion. Decorative: the link or heading around
// it names it.
import { computed, ref } from 'vue'
import { LETTERING, LOCKUP, LOCKUP_STACKED } from './marks.js'
import ThcLettering from './ThcLettering.vue'
import ThcMark from './ThcMark.vue'

const props = withDefaults(
  defineProps<{
    /** The symbol's height in CSS pixels, which is the lockup's. */
    size?: number
    layout?: 'horizontal' | 'stacked'
    animate?: 'load' | 'none'
  }>(),
  { size: 28, layout: 'horizontal', animate: 'none' },
)

const [, letteringY, , letteringHeight] = LETTERING.viewBox.split(' ').map(Number) as [number, number, number, number]
const box = computed(() => (props.layout === 'stacked' ? LOCKUP_STACKED : LOCKUP))
const width = computed(() => Math.round(props.size * (box.value.width / box.value.height) * 100) / 100)

const mark = ref<InstanceType<typeof ThcMark> | null>(null)

defineExpose({ play: () => mark.value?.play() })
</script>

<template>
  <svg
    class="thc-shell-lockup"
    :viewBox="`0 0 ${box.width} ${box.height}`"
    :width="width"
    :height="size"
    :data-layout="layout"
    aria-hidden="true"
    focusable="false"
    data-test="brand-lockup-svg"
  >
    <ThcMark ref="mark" brand="happie" :size="box.height" :animate="animate" />
    <ThcLettering v-if="layout === 'horizontal'" :x="LOCKUP.letteringX" :y="letteringY" :height="letteringHeight" />
    <g v-else class="thc-shell-lockup-lines">
      <g v-for="line in LOCKUP_STACKED.lines" :key="line.label" :transform="line.transform">
        <path
          v-for="(g, i) in line.glyphs"
          :key="i"
          :class="{ 'thc-shell-lettering-dot': g.dot }"
          :transform="`translate(${g.x} 0)`"
          :d="g.d"
        />
      </g>
    </g>
  </svg>
</template>

<style>
.thc-shell-lockup {
  display: block;
  flex: 0 0 auto;
  overflow: visible;
}

.thc-shell-lockup-lines {
  fill: currentColor;
}
</style>
