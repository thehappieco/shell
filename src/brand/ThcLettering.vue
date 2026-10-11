<script setup lang="ts">
// The company's lettering, "the happie co.", in Quicksand Bold as the kit's
// own contours (marks.ts): no font is loaded. It takes the text color
// (currentColor), and its final dot is at 55% opacity, as the brand manual
// says. Decorative: the host names the link or heading it sits in.
import { LETTERING } from './marks.js'

withDefaults(defineProps<{ /** The height in CSS pixels. */ height?: number }>(), { height: 18 })

const [, , w, h] = LETTERING.viewBox.split(' ').map(Number) as [number, number, number, number]
const ratio = w / h
</script>

<template>
  <svg
    class="thc-shell-lettering"
    :viewBox="LETTERING.viewBox"
    :height="height"
    :width="Math.round(height * ratio * 100) / 100"
    aria-hidden="true"
    focusable="false"
  >
    <g :transform="LETTERING.transform">
      <path
        v-for="(g, i) in LETTERING.glyphs"
        :key="i"
        :class="{ 'thc-shell-lettering-dot': g.dot }"
        :transform="`translate(${g.x} 0)`"
        :d="g.d"
      />
    </g>
  </svg>
</template>

<style>
.thc-shell-lettering {
  display: block;
  flex: 0 0 auto;
  fill: currentColor;
}

.thc-shell-lettering-dot {
  opacity: 0.55;
}
</style>
