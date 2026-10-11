<script setup lang="ts">
// A theme's icon (design 2026-10-10, 4.1), for the toggle and the segmented
// choice (ThcThemeToggle.vue; internal, not exported): a sun for light, a
// moon for dark, and for system a circle whose left half is filled, with the
// sun's rays on its right side only. Stroked in currentColor, so the
// control's color is the icon's; decorative, since the control carries the
// words.
import type { Theme } from '../types.js'

defineProps<{ theme: Theme }>()
</script>

<template>
  <svg class="thc-shell-ctl-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" :data-icon="theme">
    <template v-if="theme === 'light'">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6L18 18M6 18l1.4-1.4M16.6 7.4L18 6" />
    </template>
    <template v-else-if="theme === 'dark'">
      <path d="M20.5 13.2A8.5 8.5 0 1 1 10.8 3.5a7 7 0 0 0 9.7 9.7z" />
    </template>
    <template v-else>
      <circle cx="12" cy="12" r="4" />
      <path class="thc-shell-ctl-fill" d="M12 8a4 4 0 0 0 0 8z" />
      <path d="M12 3.5v2M12 18.5v2M18.5 12h2M16.6 16.6L18 18M16.6 7.4L18 6" />
    </template>
  </svg>
</template>
