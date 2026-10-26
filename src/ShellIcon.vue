<script setup lang="ts">
// A menu entry's icon (menu.ts's SECTION_ICONS), drawn by the side menu and
// the avatar's menu: decorative, so its link is named by its text alone. An
// icon the shell does not know is a plain dot.
defineProps<{ icon: string }>()
</script>

<template>
  <svg class="thc-shell-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <template v-if="icon === 'home'"><path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" /></template>
    <template v-else-if="icon === 'users'">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 7" />
      <path d="M18 14.8c2 .7 3.2 2.4 3.5 5.2" />
    </template>
    <template v-else-if="icon === 'key'"><circle cx="8" cy="15" r="4" /><path d="M11 12l9-9M16 7l3 3M14 9l2 2" /></template>
    <template v-else-if="icon === 'card'"><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M3 10h18" /><path d="M7 15h4" /></template>
    <template v-else-if="icon === 'disk'">
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
      <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
    </template>
    <template v-else-if="icon === 'clock'"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></template>
    <template v-else-if="icon === 'gear'">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" />
    </template>
    <template v-else-if="icon === 'book'">
      <path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="10" r="2.5" />
      <path d="M8.5 16c.6-1.6 1.9-2.5 3.5-2.5s2.9.9 3.5 2.5" />
    </template>
    <template v-else-if="icon === 'spark'">
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
      <path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />
    </template>
    <template v-else-if="icon === 'person'"><circle cx="12" cy="9" r="3.5" /><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" /></template>
    <template v-else-if="icon === 'receipt'">
      <path d="M6 3.5h12v17l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5z" />
      <path d="M9 8.5h6M9 12h6M9 15.5h3.5" />
    </template>
    <template v-else-if="icon === 'shield'">
      <path d="M12 3l7 3v5.5c0 4.4-3 7.9-7 9.5-4-1.6-7-5.1-7-9.5V6z" />
      <path d="M9 12l2.2 2.2L15.5 10" />
    </template>
    <template v-else><circle cx="12" cy="12" r="3" /></template>
  </svg>
</template>
