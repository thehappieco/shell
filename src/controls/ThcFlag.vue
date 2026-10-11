<script setup lang="ts">
// A language's flag (design 2026-10-10, 4.1): Brazil for pt-BR, the United
// Kingdom for en, and Spain for es (the plain bands, without the arms, as a
// flag is drawn this small). Each is drawn for a 4:3 box, so the three line
// up; the United Kingdom's red diagonals are centred, which reads the same at
// this size.
//
// The rules it enforces: inline SVG with no id attribute, no clipPath and no
// <defs>, so two flags on one page never share or collide on a reference;
// the SVG's own viewport crops what runs past its box. The corners are
// rounded and ringed by a hairline in the text's color by CSS, so a light
// flag still reads on a light page. Its colors are the countries', the only
// colors the shell draws that are not its tokens. Decorative: the
// language's name is the control's text.
import { computed } from 'vue'
import type { Locale } from '../types.js'

const props = withDefaults(
  defineProps<{
    locale: Locale
    /** The width in CSS pixels; the height is three quarters of it. */
    size?: number
  }>(),
  { size: 20 },
)

const height = computed(() => Math.round((props.size * 3) / 4))
</script>

<template>
  <span class="thc-shell-ctl-flag" aria-hidden="true" data-test="flag" :data-locale="locale">
    <svg viewBox="0 0 24 18" :width="size" :height="height" focusable="false">
      <template v-if="locale === 'pt-BR'">
        <rect width="24" height="18" fill="#009c3b" />
        <path d="M12 1.9L22.1 9 12 16.1 1.9 9z" fill="#ffdf00" />
        <circle cx="12" cy="9" r="4.2" fill="#002776" />
        <path d="M7.86 9.7Q12 7.2 16.05 10.05" fill="none" stroke="#ffffff" stroke-width="0.9" />
      </template>
      <template v-else-if="locale === 'en'">
        <rect width="24" height="18" fill="#012169" />
        <path d="M0 0L24 18M24 0L0 18" stroke="#ffffff" stroke-width="3.6" />
        <path d="M0 0L24 18M24 0L0 18" stroke="#c8102e" stroke-width="1.2" />
        <path d="M12 0V18M0 9H24" stroke="#ffffff" stroke-width="6" />
        <path d="M12 0V18M0 9H24" stroke="#c8102e" stroke-width="3.6" />
      </template>
      <template v-else>
        <rect width="24" height="18" fill="#aa151b" />
        <rect y="4.5" width="24" height="9" fill="#f1bf00" />
      </template>
    </svg>
  </span>
</template>

<style>
/* The flag's box: rounded corners, and a hairline ring drawn over the flag
   in the text's color at low strength, so white or yellow at the edge still
   shows its border in either theme. */
.thc-shell-ctl-flag {
  position: relative;
  display: inline-block;
  flex: 0 0 auto;
  overflow: hidden;
  border-radius: 3px;
  line-height: 0;
  vertical-align: middle;
}

.thc-shell-ctl-flag > svg {
  display: block;
}

.thc-shell-ctl-flag::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--thc-text) 24%, transparent);
  pointer-events: none;
}
</style>
