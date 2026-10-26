// Which input the person used last (shell 1.6.1): a focus ring is for
// someone on the keyboard, so a ring shows only after a key. A press of a
// mouse, a pen or a finger puts POINTER_INPUT on <html>, and any key that
// is not a modifier alone takes it off; tokens.css then hides every focus
// ring (and the shell its focus tints) while the class is there.
//
// Browsers decide :focus-visible on their own, and differently: Safari
// draws a ring where a modal dialog puts focus when it opens and where it
// gives focus back when it closes, after a click as much as after a key,
// and the next focus a script moves then rings too. Tracking the input
// ourselves makes every engine agree with the person: after a click, no
// ring; after a key, the ring where focus is. Focus itself moves exactly as
// before, so a keyboard user loses nothing.
//
// The rule it enforces: trackInput adds its two listeners to a document
// once, however often a host or the shell calls it; they are passive,
// capture-phase listeners on the document, never on the window, and they
// read nothing but the event's kind and key. It runs no timer and stores
// nothing. holdNextPress adds its own three capture-phase listeners
// (mousedown, click, dblclick) to a document once; they read the events'
// times and places, and act only on the press that continues a held one.

/** POINTER_INPUT is the class on <html> while the last input was a pointer's. */
export const POINTER_INPUT = 'thc-shell-input-pointer'

/** Keys that never move focus on their own: holding one keeps the pointer's quiet. */
const MODIFIERS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Fn', 'AltGraph'])

/** The documents already tracked. */
const tracked = new WeakSet<Document>()

/** trackInput starts following the person's input on doc, once. */
export function trackInput(doc: Document | undefined = globalThis.document): void {
  if (doc === undefined || tracked.has(doc)) return
  tracked.add(doc)
  doc.addEventListener('pointerdown', () => doc.documentElement.classList.add(POINTER_INPUT), { capture: true, passive: true })
  doc.addEventListener(
    'keydown',
    event => {
      if (!MODIFIERS.has(event.key)) doc.documentElement.classList.remove(POINTER_INPUT)
    },
    { capture: true, passive: true },
  )
}

/** SOON_MS is how long after a press of the pointer another press still continues it (a double-click), in ms. */
export const SOON_MS = 300

/** NEAR_PX is how far from a press of the pointer, in CSS pixels each way, another press still lands on the same spot (a double-click, a double tap). */
export const NEAR_PX = 24

/** A press of the pointer: its click's time and where it landed. */
export interface Press {
  readonly at: number
  readonly x: number
  readonly y: number
}

/** CLICKS are the events a key or assistive technology makes too, with detail 0. */
const CLICKS = new Set(['click', 'dblclick', 'auxclick'])

/**
 * pointerEvent is event when a pointer made it, with a place, else null: a
 * press or a release (pointerdown, mousedown: Chromium gives a pointerdown
 * detail 0) always; a click only with detail above 0, since a key's or
 * assistive technology's click has 0.
 */
function pointerEvent(event: Event | undefined): MouseEvent | null {
  const e = event as MouseEvent | undefined
  if (e === undefined || typeof e.clientX !== 'number' || typeof e.clientY !== 'number') return null
  if (CLICKS.has(e.type) && !(typeof e.detail === 'number' && e.detail > 0)) return null
  return e
}

/**
 * soonAfter says whether event, a pointer's press or click, continues press:
 * it comes within SOON_MS of it and lands within NEAR_PX of where it landed.
 * That is the second press of a double-click, or a tap that lands where a
 * menu just slid in under the first, which continues the press before
 * rather than asking anew (shell 1.6.1). A click from a key or assistive
 * technology (detail 0) never does; neither does a deliberate press after
 * the moment has passed, however slow the system's double-click speed, nor a
 * quick press somewhere else, which is a new request. It reads the events'
 * own times and places: no timer.
 */
export function soonAfter(event: Event, press: Press | null): boolean {
  const e = pointerEvent(event)
  if (e === null || press === null) return false
  const gap = e.timeStamp - press.at
  return gap >= 0 && gap < SOON_MS && Math.abs(e.clientX - press.x) <= NEAR_PX && Math.abs(e.clientY - press.y) <= NEAR_PX
}

/** pressedAt is event's press when a pointer made it (a click: detail above 0), else null. */
export function pressedAt(event: Event | undefined): Press | null {
  const e = pointerEvent(event)
  return e === null ? null : { at: e.timeStamp, x: e.clientX, y: e.clientY }
}

/** The press on a menu's entry that closed the menu, held until the next click. */
let held: { doc: Document; press: Press } | null = null
/** The held press whose continuing click was just swallowed: its dblclick follows. */
let swallowed: { doc: Document; press: Press } | null = null
/** The documents whose presses are watched for a held press. */
const holding = new WeakSet<Document>()

/**
 * holdNextPress keeps the press that continues event, a pointer's click on
 * an entry that closes its menu (a link, a language) or on what closes a
 * dialog (its backdrop, its close button), from reaching what lies under
 * the menu or dialog while it fades, or once it is gone: the next press, if
 * it continues that one (soonAfter: soon, on the same spot), is held back in
 * the capture phase, once. Its mousedown does nothing (no focus moves, no
 * word is selected), and its click and its dblclick reach nothing. A
 * double-click on an entry then acts once, and never on the page beneath,
 * while a quick press anywhere else, on a page the host has just routed to
 * for instance, is the person's own. A click from a key does nothing here.
 */
export function holdNextPress(event: Event, doc: Document | undefined = globalThis.document): void {
  const press = pressedAt(event)
  if (doc === undefined || press === null) return
  held = { doc, press }
  swallowed = null
  if (holding.has(doc)) return
  holding.add(doc)
  doc.addEventListener(
    'mousedown',
    next => {
      const h = held
      if (h !== null && h.doc === doc && soonAfter(next, h.press)) next.preventDefault()
    },
    true,
  )
  doc.addEventListener(
    'click',
    next => {
      const h = held
      if (h === null || h.doc !== doc || next.timeStamp === h.press.at) return
      held = null
      if (!soonAfter(next, h.press)) return
      swallowed = h
      next.preventDefault()
      next.stopPropagation()
    },
    true,
  )
  doc.addEventListener(
    'dblclick',
    next => {
      const s = swallowed
      if (s === null || s.doc !== doc) return
      swallowed = null
      if (!soonAfter(next, s.press)) return
      next.preventDefault()
      next.stopPropagation()
    },
    true,
  )
}
