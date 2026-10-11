<script setup lang="ts">
// A product's name ("wappie.", "mailie.", ...) as the kit's own contours
// (its nome file, NAMES in marks.ts): Quicksand Bold, no font loaded, never
// HTML text. size is the H of the symbol it stands with, so the name is
// drawn at the kit's scale for that H (0.70 H: size 22 gives a 15.4 px em)
// and its box is the name's tight box at that scale. It is painted in the
// brand's registered color on a light page and in white on a dark one (the
// theme selectors ThcMark uses), the final dot at 55% (brand manual), with
// classes and data attributes only, so the pages' CSP (style-src 'self')
// holds. It never moves: only a symbol plays. Decorative: the host keeps
// the name as text (a thc-shell-hidden span, or an aria-label), so every
// name stays findable as text.
import { computed } from 'vue'
import { NAMES, type ProductBrandId } from './marks.js'

const props = withDefaults(
  defineProps<{
    brand: ProductBrandId
    /** The H, in CSS pixels, of the symbol the name stands with. */
    size?: number
  }>(),
  { size: 22 },
)

const name = computed(() => NAMES[props.brand])
const box = computed(() => name.value.viewBox.split(' ').map(Number) as [number, number, number, number])
const width = computed(() => Math.round(((props.size * box.value[2]) / 100) * 100) / 100)
const height = computed(() => Math.round(((props.size * box.value[3]) / 100) * 100) / 100)
</script>

<template>
  <svg
    class="thc-shell-name"
    :data-brand="brand"
    :viewBox="name.viewBox"
    :width="width"
    :height="height"
    aria-hidden="true"
    focusable="false"
  >
    <g :transform="name.transform">
      <path
        v-for="(g, i) in name.glyphs"
        :key="i"
        :class="{ 'thc-shell-name-dot': g.dot }"
        :transform="`translate(${g.x} 0)`"
        :d="g.d"
      />
    </g>
  </svg>
</template>

<style>
/* The colors of a name (brand manual: the registered colors, white). */
.thc-shell-name {
  display: block;
  flex: 0 0 auto;
  overflow: visible;
  fill: var(--thc-name-color);
}

.thc-shell-name[data-brand='wappie'] {
  --thc-name-color: #137659;
}

.thc-shell-name[data-brand='mailie'] {
  --thc-name-color: #b24b1e;
}

.thc-shell-name[data-brand='vaultie'] {
  --thc-name-color: #262a62;
}

.thc-shell-name[data-brand='authie'] {
  --thc-name-color: #176b80;
}

.thc-shell-name[data-brand='sophie'] {
  --thc-name-color: #7040a0;
}

.thc-shell-name[data-brand='nova'] {
  --thc-name-color: #a33960;
}

:root[data-theme='dark'] .thc-shell-name {
  fill: #ffffff;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) .thc-shell-name {
    fill: #ffffff;
  }
}

.thc-shell-name-dot {
  opacity: 0.55;
}
</style>
