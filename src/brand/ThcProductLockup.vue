<script setup lang="ts">
// A product's lockup, its logo_texto: the symbol, the name and the
// endorsement "by the happie co.", laid out as the kit's own file lays them
// out (PRODUCT_LOCKUP, NAMES and ENDORSEMENT in marks.ts, generated from
// it), in one SVG whose height is the symbol's, as ThcLockup is for the
// company. The symbol keeps its colors (outline on light, tile on dark) and
// replays its choreography when a mouse comes onto its host (ThcMark); the
// name is ThcName (the registered color, white on a dark page, its dot at
// 55%); the endorsement is #737686, #A3A7BA on a dark page, its dot at full
// opacity. Neither moves. For H of 40 px or more only: smaller, the
// endorsement cannot be read (brand manual). Decorative: the heading or the
// link around it names the product as text.
import { computed } from 'vue'
import { ENDORSEMENT, NAMES, PRODUCT_LOCKUP, type ProductBrandId } from './marks.js'
import ThcMark from './ThcMark.vue'
import ThcName from './ThcName.vue'

const props = withDefaults(
  defineProps<{
    brand: ProductBrandId
    /** The symbol's height in CSS pixels, which is the lockup's. */
    size?: number
    animate?: 'load' | 'none'
  }>(),
  { size: 44, animate: 'none' },
)

const box = computed(() => PRODUCT_LOCKUP[props.brand])
/** The top of the name's tight box, in the lockup's units: the name stays on its baseline. */
const nameY = computed(() => Number(NAMES[props.brand].viewBox.split(' ')[1]))
const width = computed(() => Math.round(props.size * (box.value.width / box.value.height) * 100) / 100)
</script>

<template>
  <svg
    class="thc-shell-product-lockup"
    :data-brand="brand"
    :viewBox="`0 0 ${box.width} ${box.height}`"
    :width="width"
    :height="size"
    aria-hidden="true"
    focusable="false"
    data-test="product-lockup-svg"
  >
    <ThcMark :brand="brand" :size="box.height" :animate="animate" />
    <ThcName :brand="brand" :size="box.height" :x="box.nameX" :y="nameY" />
    <g class="thc-shell-endorsement" :transform="ENDORSEMENT.transform">
      <path v-for="(g, i) in ENDORSEMENT.glyphs" :key="i" :transform="`translate(${g.x} 0)`" :d="g.d" />
    </g>
  </svg>
</template>

<style>
.thc-shell-product-lockup {
  display: block;
  flex: 0 0 auto;
  overflow: visible;
}

/* The endorsement (brand manual: #737686, and #A3A7BA on the white version). */
.thc-shell-endorsement {
  fill: #737686;
}

:root[data-theme='dark'] .thc-shell-endorsement {
  fill: #a3a7ba;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) .thc-shell-endorsement {
    fill: #a3a7ba;
  }
}
</style>
