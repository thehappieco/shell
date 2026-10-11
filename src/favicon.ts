// The tab icon of a page that wears the company's symbol (id. and the
// console), after the site's: the kit's colorido_margem_arredondada (the
// outline on a white rounded card) on a light page, its
// branco_margem_arredondada (white on the indigo card) on a dark one. Each
// host serves both under the names below (web/scripts/brand-marks.mjs
// writes them from brand/source), and its index.html starts with the pair
// that follows the system's color scheme, a 32 px PNG for browsers without
// SVG icons, and the apple-touch-icon. An app keeps its own icon and never
// calls this.
//
// The rule it enforces: the head's SVG icons say the theme the page shows,
// including one chosen by hand, not only the system's. A host calls
// applyFavicon whenever it applies a theme: "light" or "dark" leaves exactly
// one SVG icon, a fresh element each time (Firefox keeps a cached icon when
// only href changes); "system" puts back the media pair, which follows the
// system on its own, with no listener. It touches nothing but the head's
// <link rel="icon" type="image/svg+xml"> elements: the PNG and the
// apple-touch-icon stay as index.html wrote them. No storage, no timer.

import { THEMES, type Theme } from './types.js'

/** The light page's icon: the outline on a white rounded card. */
export const FAVICON_LIGHT = '/favicon-light.svg'
/** The dark page's icon: white on the indigo rounded card. */
export const FAVICON_DARK = '/favicon-dark.svg'

const SVG_ICONS = 'link[rel="icon"][type="image/svg+xml"]'

/** applyFavicon makes the head's SVG icons say theme; a value that is not a theme is "system". */
export function applyFavicon(theme: Theme, doc: Document | undefined = globalThis.document): void {
  const head = doc?.head
  if (doc === undefined || head === undefined || head === null) return
  const th: Theme = (THEMES as readonly string[]).includes(theme) ? theme : 'system'
  for (const old of head.querySelectorAll(SVG_ICONS)) old.remove()
  // Before the other icons, as index.html orders them.
  const before = head.querySelector('link[rel="icon"], link[rel="apple-touch-icon"]')
  const add = (href: string, media?: string): void => {
    const link = doc.createElement('link')
    link.rel = 'icon'
    link.type = 'image/svg+xml'
    if (media !== undefined) link.media = media
    link.href = href
    head.insertBefore(link, before)
  }
  if (th === 'light') add(FAVICON_LIGHT)
  else if (th === 'dark') add(FAVICON_DARK)
  else {
    add(FAVICON_LIGHT, '(prefers-color-scheme: light)')
    add(FAVICON_DARK, '(prefers-color-scheme: dark)')
  }
}
