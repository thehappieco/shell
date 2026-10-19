<script setup lang="ts">
// The side menu (shell contract 3.3), drawn from menu.ts's model: the
// brand (the kit's symbol and lettering, brand/), the workspace selector, the groups, the profile, and the host's
// menu-footer, or "Sair" to the console's sign-out page when the host puts
// nothing there. While the shell's data loads it draws the brand alone:
// nothing below it, the host's menu-footer included, so the column fills
// once, under a brand that stays where it is. Shell.vue draws it twice when
// the drawer is open (in the side column, which small screens hide, and in
// the drawer), so its ids come from useId and it keeps no state but its own
// selector's.
//
// An app that is a product of the kit is drawn as the kit draws it: its
// symbol, then its written name as the kit's contours (ThcName), never as
// system-font text; the name stays in the link or the group label as hidden
// text, so it is the one the link is named by and found by. Any other app
// keeps its letter badge and its text. Hovering a row plays its symbol
// again (ThcMark's host rule).
//
// The selector is a disclosure: its button says whether the list is open
// (aria-expanded), and names the workspace the page is in, or asks to
// choose one when the page names none the person has; Escape closes the
// list and returns focus to the button, and goes no further (inside the
// drawer, it would close the drawer too), and a click outside or following
// a link closes it. Every entry is a plain link: following one is the
// browser's navigation, or the host's for a link on its own origin
// (Shell.vue decides, through the follow event; "Sair" through the signOut
// event, so the host's beforeSignOut runs first). While a kept answer is
// drawn read-only (since 1.4.0) the selector's button says it is disabled
// and does not open, and Shell.vue follows no link.
import { onBeforeUnmount, ref, useId, watch } from 'vue'
import ThcLockup from './brand/ThcLockup.vue'
import ThcMark from './brand/ThcMark.vue'
import ThcName from './brand/ThcName.vue'
import type { MenuModel } from './menu.js'

defineProps<{ model: MenuModel; newTab: string }>()
const emit = defineEmits<{ follow: [event: MouseEvent, href: string]; signOut: [event: MouseEvent, href: string] }>()

const uid = useId()
const open = ref(false)
const root = ref<HTMLElement | null>(null)
const button = ref<HTMLButtonElement | null>(null)

function onOutside(event: Event): void {
  if (root.value !== null && !root.value.contains(event.target as Node)) open.value = false
}

watch(open, now => {
  if (now) document.addEventListener('click', onOutside, true)
  else document.removeEventListener('click', onOutside, true)
})
onBeforeUnmount(() => document.removeEventListener('click', onOutside, true))

function closeSelector(event: KeyboardEvent): void {
  if (!open.value) return
  // This Escape is the list's alone: the drawer around it stays open.
  event.stopPropagation()
  event.preventDefault()
  open.value = false
  button.value?.focus()
}

function follow(event: MouseEvent, href: string): void {
  open.value = false
  emit('follow', event, href)
}

function signOut(event: MouseEvent, href: string): void {
  open.value = false
  emit('signOut', event, href)
}

/** toggle opens or closes the list, unless the kept answer is drawn read-only. */
function toggle(readOnly: boolean): void {
  open.value = readOnly ? false : !open.value
}
</script>

<template>
  <div class="thc-shell-menu">
    <a
      class="thc-shell-brand"
      :href="model.brandHref"
      :aria-label="model.brandLabel"
      data-test="shell-brand"
      @click="follow($event, model.brandHref)"
    >
      <ThcLockup :size="44" layout="stacked" animate="load" />
    </a>

    <template v-if="!model.loading">
      <div v-if="model.selector" ref="root" class="thc-shell-selector" @keydown.escape="closeSelector($event)">
        <span class="thc-shell-selector-label" aria-hidden="true">{{ model.selector.label }}</span>
        <button
          ref="button"
          type="button"
          class="thc-shell-ws thc-shell-ws-button"
          :aria-expanded="open"
          :aria-controls="`${uid}-ws-panel`"
          :aria-labelledby="`${uid}-ws-switch ${uid}-ws-name`"
          :aria-describedby="model.selector.shown ? `${uid}-ws-detail` : undefined"
          :aria-disabled="model.readOnly ? 'true' : undefined"
          data-test="shell-workspace-button"
          @click="toggle(model.readOnly)"
        >
          <template v-if="model.selector.shown">
            <span class="thc-shell-ws-av" :class="model.selector.shown.personal ? 'thc-shell-ws-personal' : 'thc-shell-ws-team'" aria-hidden="true">{{
              model.selector.shown.initial
            }}</span>
            <span class="thc-shell-ws-text">
              <span :id="`${uid}-ws-name`" class="thc-shell-ws-name">{{ model.selector.shown.name }}</span>
              <span :id="`${uid}-ws-detail`" class="thc-shell-ws-detail">{{ model.selector.shown.detail }}</span>
            </span>
          </template>
          <template v-else>
            <span class="thc-shell-ws-av thc-shell-ws-none" aria-hidden="true">
              <svg class="thc-shell-icon" viewBox="0 0 24 24" focusable="false"><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></svg>
            </span>
            <span class="thc-shell-ws-text">
              <span :id="`${uid}-ws-name`" class="thc-shell-ws-name" data-test="shell-workspace-choose">{{ model.selector.chooseLabel }}</span>
            </span>
          </template>
          <span :id="`${uid}-ws-switch`" class="thc-shell-hidden">{{ model.selector.switchLabel }}</span>
          <svg class="thc-shell-chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6" /></svg>
        </button>
        <div v-show="open" :id="`${uid}-ws-panel`" class="thc-shell-ws-panel" data-test="shell-workspace-panel">
          <ul class="thc-shell-list">
            <li v-for="w in model.selector.items" :key="w.id">
              <a
                v-if="w.href"
                class="thc-shell-ws"
                :href="w.href"
                :aria-current="w.current ?? undefined"
                data-test="shell-workspace-item"
                :data-id="w.id"
                @click="follow($event, w.href)"
              >
                <span class="thc-shell-ws-av thc-shell-ws-av-sm" :class="w.personal ? 'thc-shell-ws-personal' : 'thc-shell-ws-team'" aria-hidden="true">{{
                  w.initial
                }}</span>
                <span class="thc-shell-ws-text">
                  <span class="thc-shell-ws-name">{{ w.name }}</span>
                  <span class="thc-shell-ws-detail">{{ w.detail }}</span>
                </span>
                <svg v-if="w.current" class="thc-shell-check" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12l5 5 9-10" /></svg>
              </a>
            </li>
          </ul>
          <a
            class="thc-shell-ws thc-shell-ws-all"
            :href="model.selector.allHref"
            :aria-current="model.selector.allCurrent ? 'page' : undefined"
            data-test="shell-all-workspaces"
            @click="follow($event, model.selector.allHref)"
            >{{ model.selector.allLabel }}</a
          >
        </div>
      </div>

      <nav class="thc-shell-nav" :aria-label="model.navLabel" data-test="shell-nav">
        <div v-for="g in model.groups" :key="g.id" class="thc-shell-group" :data-test="`shell-group-${g.id}`">
          <span :id="`${uid}-g-${g.id}`" class="thc-shell-group-label">
            <template v-if="g.app?.brand">
              <span class="thc-shell-pair" data-thc-hover data-test="shell-app-name">
                <ThcMark :brand="g.app.brand" :size="18" />
                <ThcName :brand="g.app.brand" :size="18" />
              </span>
              <span class="thc-shell-hidden">{{ g.label }}</span>
            </template>
            <template v-else>
              <span v-if="g.app" class="thc-shell-av thc-shell-av-xs" :class="`thc-shell-app-${g.app.color}`" aria-hidden="true">{{ g.app.letter }}</span>
              {{ g.label }}
            </template>
          </span>
          <ul class="thc-shell-list" :aria-labelledby="`${uid}-g-${g.id}`">
            <li v-for="l in g.links" :key="l.id">
              <a
                class="thc-shell-link"
                :class="{ 'thc-shell-current': l.current }"
                :href="l.href"
                :aria-current="l.current ?? undefined"
                :target="l.newTab ? '_blank' : undefined"
                :rel="l.newTab ? 'noopener' : undefined"
                data-test="shell-link"
                :data-id="l.id"
                @click="follow($event, l.href)"
              >
                <span v-if="l.app?.brand" class="thc-shell-pair" data-test="shell-app-name">
                  <ThcMark :brand="l.app.brand" :size="22" />
                  <ThcName :brand="l.app.brand" :size="22" />
                </span>
                <span v-else-if="l.app" class="thc-shell-av thc-shell-av-sm" :class="`thc-shell-app-${l.app.color}`" aria-hidden="true">{{ l.app.letter }}</span>
                <svg v-else-if="l.icon" class="thc-shell-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <template v-if="l.icon === 'home'"><path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" /></template>
                  <template v-else-if="l.icon === 'users'">
                    <circle cx="9" cy="8" r="3.5" />
                    <path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5" />
                    <path d="M16 4.5a3.5 3.5 0 0 1 0 7" />
                    <path d="M18 14.8c2 .7 3.2 2.4 3.5 5.2" />
                  </template>
                  <template v-else-if="l.icon === 'key'"><circle cx="8" cy="15" r="4" /><path d="M11 12l9-9M16 7l3 3M14 9l2 2" /></template>
                  <template v-else-if="l.icon === 'card'"><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M3 10h18" /><path d="M7 15h4" /></template>
                  <template v-else-if="l.icon === 'disk'">
                    <ellipse cx="12" cy="6" rx="8" ry="3" />
                    <path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
                    <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
                  </template>
                  <template v-else-if="l.icon === 'clock'"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></template>
                  <template v-else-if="l.icon === 'gear'">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" />
                  </template>
                  <template v-else-if="l.icon === 'book'">
                    <path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z" />
                    <circle cx="12" cy="10" r="2.5" />
                    <path d="M8.5 16c.6-1.6 1.9-2.5 3.5-2.5s2.9.9 3.5 2.5" />
                  </template>
                  <template v-else-if="l.icon === 'spark'">
                    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
                    <path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />
                  </template>
                  <template v-else><circle cx="12" cy="12" r="3" /></template>
                </svg>
                <span class="thc-shell-link-label" :class="{ 'thc-shell-hidden': Boolean(l.app?.brand) }">{{ l.label }}</span>
                <template v-if="l.newTab">
                  <span class="thc-shell-out" aria-hidden="true">↗</span>
                  <span class="thc-shell-hidden">{{ newTab }}</span>
                </template>
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <div class="thc-shell-foot">
        <a
          v-if="model.profile"
          class="thc-shell-link thc-shell-profile"
          :class="{ 'thc-shell-current': model.profile.current }"
          :href="model.profile.href"
          :aria-current="model.profile.current ? 'page' : undefined"
          data-test="shell-profile"
          @click="follow($event, model.profile.href)"
        >
          <span class="thc-shell-person" aria-hidden="true">
            <template v-if="model.profile.initials">{{ model.profile.initials }}</template>
            <svg v-else class="thc-shell-icon" viewBox="0 0 24 24" focusable="false">
              <circle cx="12" cy="9" r="3.5" />
              <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
            </svg>
          </span>
          <span class="thc-shell-ws-text">
            <span v-if="model.profile.name" class="thc-shell-ws-name" data-test="shell-profile-name">{{ model.profile.name }}</span>
            <span class="thc-shell-profile-label">{{ model.profile.label }}</span>
          </span>
        </a>
        <!-- The host's sign-out, or, without one, the console's sign-out page. -->
        <slot name="footer">
          <a
            v-if="model.signOut"
            class="thc-shell-link thc-shell-sign-out"
            :href="model.signOut.href"
            data-test="shell-sign-out"
            @click="signOut($event, model.signOut.href)"
          >
            <svg class="thc-shell-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
              <path d="M10 16l-4-4 4-4M6 12h10" />
            </svg>
            <span>{{ model.signOut.label }}</span>
          </a>
        </slot>
      </div>
    </template>
  </div>
</template>
