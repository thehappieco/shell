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
// A frame is another document: the keys pressed in it (Mailie's message,
// drawn in a sandboxed srcdoc frame) never reach this one, so after a press
// here, a click into the frame and a Tab out of it, the control Tab lands
// on would show no ring (shell 1.6.2). No engine tells this document that
// a click moved focus into a frame. What reaches it, as the engines driven
// for 1.6.2 sent it (Google Chrome 156; Playwright's Chromium, with and
// without site isolation forced, Firefox and WebKit), is this:
// - the pointer goes onto the frame: a mouseover on the frame's own
//   element, for a mouse and a finger alike, where the engine draws the
//   frame in this page's process. Chrome draws a cross-site frame, and a
//   sandboxed one, in a process of its own (its site isolation; Playwright's
//   Chromium does not unless told to), and there only the frame's border,
//   which this document draws, sends one;
// - what had focus here, if anything had, loses it. Chromium and WebKit
//   take it at the click into the frame: a focusout with no relatedTarget,
//   while the body is document.activeElement. Firefox takes it only when
//   focus next moves (for the person in the frame, at its first Tab), while
//   the frame's element is document.activeElement: a focusout with no
//   relatedTarget when that Tab stays in the frame, and naming the control
//   here it reaches when the frame holds nothing focusable (a plain-text
//   message), which that one Tab leaves;
// - focus comes back: a Tab out of the frame focuses a control here, which
//   the browser, having seen the Tab, marks :focus-visible. Its focusin
//   has no relatedTarget, but for that Firefox Tab, where it names the
//   control that lost focus.
// Such a focusin takes POINTER_INPUT off, so the control Tab lands on
// rings, and a press here quiets the rings again.
//
// A focus the page moves itself can look the same: it comes with no
// relatedTarget whenever nothing here had focus or what had it lost it, and
// the browsers ring some of those by their own rules (a text field always;
// another element at times in each engine, such as after a key was used).
// So the focusin counts only when all three of these hold:
// - focus was in a frame, by one of these signs:
//   - a focusout here while a frame's element (an iframe, frame, object or
//     embed of this document) was document.activeElement (Firefox's), with
//     no pointerdown, pointerup, click or focusin here since: this sign
//     counts whatever the focusin's relatedTarget;
//   - or, for a focusin with no relatedTarget only:
//     - the pointer went onto a frame's element since the latest
//       pointerdown here: a mouseover on one, or that pointerdown on one
//       (its border);
//     - or a control here lost focus with no relatedTarget, with no
//       pointerdown, pointerup, click or focusin here since, while
//       document.hasFocus() was true (as it is when focus moves into one of
//       its frames) and while it could still hold focus as it then was: in
//       the page, enabled, not inert, drawn (checkVisibility: a box, no
//       ancestor with content-visibility: hidden, visibility: visible), and
//       focusable by a tabindex whose value is an integer, by being
//       editable (an editing host, whose tabIndex reads -1), by being a
//       dialog, by being an option (a customizable select's picker focuses
//       one), by being a scroller that scrolls (Chromium and Firefox let the
//       keyboard reach one), or by a tabIndex of 0 or more (a kind focusable
//       by default; a link or an area only with an href); and it is still
//       in the page when focus comes back. Inert is
//       what Chromium computes (CSS's interactivity), through every shadow
//       root; elsewhere, the inert attribute on the control or an element
//       it is drawn in, up through an open shadow root's slot and through
//       each shadow host. Inside an open shadow root, the control is the one
//       the event's composed path starts at (a web component's button,
//       which the event's target names by its host); inside a closed one,
//       its host, judged as itself (a custom element is focusable only by a
//       tabindex of its own). Chromium also takes focus to nowhere from a
//       control a script disables, makes inert (as the shell's workspace
//       panel turns while it fades) or hides (display, visibility, or
//       content-visibility on an ancestor), from one that loses its
//       tabindex, its href, its being editable or its focusability by
//       default (a summary another one displaces), and, just before it goes,
//       from one the page takes out; the other engines from some of these.
//       None of those counts, but where a closed shadow root hides it (the
//       limits below). Neither does a press's own blur, which comes before
//       that press's release or click, or, for a press that becomes a
//       native drag, its dragstart and pointercancel: Firefox's at a
//       press here after a click into a frame, while the frame's element
//       is still document.activeElement, included;
// - it comes more than PRESS_FOCUS_MS after the latest pointerdown,
//   pointerup or click here, each counted from when this document handled
//   it: the later of its timeStamp and the document's clock then, since
//   Chromium and WebKit stamp a press when the system saw it and a focus
//   when it is dispatched, so a press the busy main thread held back would
//   look older than it is. A press's own focus comes well within that, in
//   Chromium, Firefox and WebKit alike: on the press itself, or once a menu
//   or dialog it opened or closed has run its motion (the language dialog
//   gives focus back about 200 ms after the click that closed it); Safari
//   rings where a modal dialog a click opened puts focus, with no
//   relatedTarget when nothing here had focus, at once. It does not matter
//   whether the press moved focus: a second press on what already has
//   focus, a press whose mousedown is held back (holdNextPress, a menu's
//   head, the crossfade's) and a press outside anything focusable each
//   count;
// - the browser marks the control it lands on :focus-visible (inside an
//   open shadow root, the control itself: the engines mark a web
//   component's button so, never its host): Firefox gives focus back from
//   a dialog a click closed with no relatedTarget and no ring.
//
// The limits.
// - A Tab out of a frame within PRESS_FOCUS_MS of the latest press here (a
//   press, a click into the frame and a Tab out of it, all within a second)
//   is taken for that press's own focus: the control it lands on shows no
//   ring, and the rings stay hidden until the next key pressed in this
//   document.
// - Focus that reached a frame with no sign brings no ring back on its way
//   out: the rings stay hidden until the next key pressed here. In Chrome,
//   with the frame in a process of its own, that is a click into it while
//   nothing here has focus, as after a press on text outside anything
//   focusable: the shell's main area (tabindex -1) takes focus at a press
//   in it that focuses nothing else and whose mousedown no script
//   prevents, but a page's body and the shell's side column do not; and a
//   click into it from a control in a closed shadow root whose host has no
//   tabindex, since the focusout names the host. In Chromium and WebKit, it
//   is also focus a script puts on the frame's element (its focus()): the
//   focusout names that element, a focusin on it follows, and the Tab out
//   comes from it. And a frame inside a shadow root gives neither of a
//   frame's own signs, since the mouseover and document.activeElement name
//   the shadow's host: only a control here that lost focus to it with no
//   relatedTarget is a sign.
// - Once a sign has come, a focus the page itself moves more than
//   PRESS_FOCUS_MS after the latest press, onto an element the browser
//   rings, can pass for a Tab out: it takes POINTER_INPUT off, so it rings
//   (as a text field does anyway), and the rings show wherever the browser
//   puts them until the next press here. After Firefox's sign, that is such
//   a focus from anywhere, the page moving focus out of the frame; after
//   the pointer's or a control's, only one with no relatedTarget: a focus
//   the page moves from a control here keeps the class. The pointer's sign
//   lasts until the next pointerdown here, though the page itself has moved
//   focus back out of the frame meanwhile. Some signs come with no person
//   in a frame: the pointer crossing a frame on its way across the page,
//   where the engine draws the frame in this page's process; a script
//   putting focus into a frame: in Chromium and WebKit, by the frame's
//   contentWindow.focus(), which takes focus from the control here to
//   nowhere, and in Firefox, by that or by the frame's element's focus(),
//   after which its focusout comes at the next move; and some that a page
//   with no frame meets too: a script's blur() of the control that has
//   focus; in Chromium, the page moving that control within the page
//   (taken out and put back, as a keyed list reorders), which Chromium
//   blurs as it goes and which is back when focus comes (Firefox and WebKit
//   sent no focusout for such a move); and what a closed shadow root hides
//   from this document: a control in one whose host has a tabindex of its
//   own, which the page disables, makes inert, hides or takes out while the
//   host stays (in Chromium, and in Firefox but for one taken out, for
//   which it sent no focusout; WebKit kept focus on the host), and, in
//   Firefox, which computes no interactivity, a control drawn in such a
//   root's slot whose wrapper there the page makes inert (WebKit took focus
//   from the button at its press).
//
// The rule it enforces: trackInput adds its nine listeners (pointerdown,
// pointerup, click, pointercancel, dragstart, mouseover, focusout, keydown,
// focusin) to a document
// once, however often a host or the shell calls it; they are passive,
// capture-phase listeners on the document, never on the window. They read
// nothing but the event's kind, its timeStamp and its key; for a
// pointerdown and a mouseover, whether its target is a frame's element;
// for a focusout, its relatedTarget, the first element of its composed
// path, document.activeElement, whether the document has focus, and
// whether that element is in the page, disabled, inert (its computed
// interactivity, and the inert attribute on it and on what it is drawn
// in), drawn and focusable (its tabindex, its href, whether it is
// editable, its tag, its tabIndex, its computed overflow and its scroll
// and client sizes); for a focusin, its relatedTarget,
// the first element of its composed path, whether the browser marks it
// :focus-visible, and whether the control that lost focus is still in the
// page; and at a press, the document's clock. Per document, a number holds
// when the latest press was handled, two flags whether the pointer has gone
// onto a frame since and whether focus was in a frame, and a reference the
// control that lost focus to nowhere since. It reads the DOM's own
// properties as it walks up from that control, so an element a page names
// after one (an input named parentNode is its form's parentNode) cannot
// send the walk round. It runs no timer and stores nothing. holdNextPress adds its own
// three capture-phase listeners (mousedown, click, dblclick) to a document
// once; they read the events' times and places, and act only on the press
// that continues a held one.

/** POINTER_INPUT is the class on <html> while the last input was a pointer's. */
export const POINTER_INPUT = 'thc-shell-input-pointer'

/** Keys that never move focus on their own: holding one keeps the pointer's quiet. */
const MODIFIERS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Fn', 'AltGraph'])

/** The documents already tracked. */
const tracked = new WeakSet<Document>()

/**
 * ringed says whether the browser itself marks target :focus-visible: it
 * would ring it, having seen the input that focused it. An engine that
 * cannot tell (no :focus-visible) says no.
 */
function ringed(target: EventTarget | null): boolean {
  try {
    return (target as Element | null)?.matches?.(':focus-visible') === true
  } catch {
    return false
  }
}

/**
 * PRESS_FOCUS_MS is how long after the latest press of the pointer here a
 * focus from outside this document is still taken for that press's own, in
 * ms, from when the document handled the press: five times the latest one
 * the engines put (a dialog giving focus back once its motion has run,
 * about 200 ms after the press).
 */
export const PRESS_FOCUS_MS = 1000

/** The elements that hold another document: the pointer going onto one may move focus into it. */
const FRAMES = new Set(['iframe', 'frame', 'object', 'embed'])

/** isFrame says whether target is the element of a frame of this document. */
function isFrame(target: EventTarget | null): boolean {
  const name = (target as Element | null)?.localName
  return name !== undefined && FRAMES.has(name)
}

/**
 * own is the element a focus event is about: its target, or inside an open
 * shadow root the control itself, which the event's target names by its
 * host (composedPath; a closed shadow root keeps it hidden, so its host).
 */
function own(event: Event): Element | null {
  try {
    const first = event.composedPath()[0] as Element | undefined
    return first?.nodeType === 1 ? first : (event.target as Element | null)
  } catch {
    return event.target as Element | null
  }
}

/**
 * dom reads name of node as the DOM defines it, on node's prototypes: the
 * document, and a form, let an element named name stand for the property
 * itself (`<form name="host">` is document.host, `<input name="parentNode">`
 * a form's parentNode), and a walk up through such a name could go round.
 */
function dom(node: object, name: string): unknown {
  for (let proto = Object.getPrototypeOf(node) as object | null; proto !== null; proto = Object.getPrototypeOf(proto) as object | null) {
    const property = Object.getOwnPropertyDescriptor(proto, name)
    if (property !== undefined) return property.get === undefined ? property.value : property.get.call(node)
  }
  return undefined
}

/**
 * inert says whether el is inert: it, or an element it is drawn in, has the
 * inert attribute. Chromium computes it for the flat tree (CSS's
 * interactivity), closed shadow roots included; elsewhere it goes up the
 * flat tree itself: from an element to the slot it is drawn in (an open
 * shadow root's: a closed one's is hidden from this document, so up to its
 * host instead), else to its parent, and from a shadow root to its host.
 */
function inert(el: Element): boolean {
  try {
    if (getComputedStyle(el).getPropertyValue('interactivity') === 'inert') return true
  } catch {
    // No style to read: the walk alone.
  }
  for (let node: object | null = el; node !== null; ) {
    const element = dom(node, 'nodeType') === 1
    if (element && (dom(node, 'hasAttribute') as (this: object, name: string) => boolean).call(node, 'inert')) return true
    const next = ((element ? dom(node, 'assignedSlot') : null) ?? dom(node, 'parentNode') ?? null) as object | null
    node = next !== null && dom(next, 'nodeType') === 11 ? ((dom(next, 'host') as object | undefined) ?? null) : next
  }
  return false
}

/** XLINK is the namespace of an SVG link's older href. */
const XLINK = 'http://www.w3.org/1999/xlink'

/** INTEGER is HTML's rule for parsing an integer: what a tabindex counts by, any other value being no tabindex. */
const INTEGER = /^[\t\n\f\r ]*[+-]?\d/

/**
 * focusable says whether el can take focus by what lets a control take it,
 * as it is now: a tabindex whose value is an integer (`tabindex="x"`, or the
 * empty value Vue writes for a bound empty string, is none), being editable
 * (an editing host, whose tabIndex reads -1), being a dialog (which takes
 * focus itself, its tabIndex -1 in Chromium and WebKit), being an option (a
 * customizable select's picker focuses one, its tabIndex -1), being a
 * scroller that scrolls (Chromium and Firefox let the keyboard reach one
 * with nothing focusable in it, its tabIndex -1), or a tabIndex of 0 or
 * more (a kind focusable by default, whose tabIndex reads -1 once it is
 * not, as a summary another one displaces; a link or an area only with an
 * href, since its tabIndex reads 0 without one).
 */
function focusable(el: HTMLElement): boolean {
  if (INTEGER.test(el.getAttribute('tabindex') ?? '') || el.isContentEditable || el.localName === 'dialog') return true
  if (el.localName === 'a' || el.localName === 'area') return el.hasAttribute('href') || el.hasAttributeNS(XLINK, 'href')
  if (el.tabIndex >= 0 || el.localName === 'option') return true
  const style = getComputedStyle(el)
  const scrolls = (overflow: string) => overflow === 'auto' || overflow === 'scroll'
  return (scrolls(style.overflowY) && el.scrollHeight > el.clientHeight) || (scrolls(style.overflowX) && el.scrollWidth > el.clientWidth)
}

/**
 * couldHoldFocus says whether el, which lost focus with no relatedTarget,
 * could still hold it: it is in the page, enabled, not inert, drawn
 * (checkVisibility: a box, no ancestor with content-visibility: hidden,
 * visibility: visible; where an engine has no checkVisibility, a box), and
 * focusable. A control that stops being any of these can lose focus with no
 * relatedTarget, as one does whose focus moves into a frame.
 */
function couldHoldFocus(el: Element | null): el is Element {
  try {
    const e = el as HTMLElement | null
    if (e?.isConnected !== true || e.matches(':disabled') || !focusable(e) || inert(e)) return false
    return typeof e.checkVisibility === 'function' ? e.checkVisibility({ visibilityProperty: true, checkVisibilityCSS: true }) : e.getClientRects().length > 0
  } catch {
    return false
  }
}

/** trackInput starts following the person's input on doc, once. */
export function trackInput(doc: Document | undefined = globalThis.document): void {
  if (doc === undefined || tracked.has(doc)) return
  tracked.add(doc)
  /** lastPressAt is when this document handled its latest pointerdown, pointerup or click. */
  let lastPressAt = -Infinity
  /** ontoFrame says whether the pointer has gone onto a frame since the latest pointerdown here. */
  let ontoFrame = false
  /** left is the control that lost focus with no relatedTarget since the latest press event or focusin here, while it could still hold focus. */
  let left: Element | null = null
  /** framed says whether the latest focusout since the latest press event or focusin here came while a frame's element was the active element: focus was in that frame. */
  let framed = false
  const listen = { capture: true, passive: true } as const
  // The later of the event's timeStamp and the document's clock: Chromium
  // and WebKit stamp a press when the system saw it, which a busy main
  // thread may have held back long before it reaches the document. Each
  // press event also ends what a focusout said: a press's own blur comes
  // before its release or click, or, for a press that becomes a native
  // drag, which sends neither, before its dragstart (Chromium and Firefox
  // also send a pointercancel; WebKit only the dragstart).
  const pressed = (event: Event): void => {
    left = null
    framed = false
    let handled = event.timeStamp
    try {
      handled = (doc.defaultView ?? globalThis).performance.now()
    } catch {
      // A page with an element named defaultView: the event's own time.
    }
    lastPressAt = Math.max(event.timeStamp, handled)
  }
  doc.addEventListener(
    'pointerdown',
    event => {
      doc.documentElement.classList.add(POINTER_INPUT)
      ontoFrame = isFrame(event.target)
      pressed(event)
    },
    listen,
  )
  doc.addEventListener('pointerup', pressed, listen)
  doc.addEventListener('click', pressed, listen)
  doc.addEventListener('pointercancel', pressed, listen)
  doc.addEventListener('dragstart', pressed, listen)
  doc.addEventListener(
    'mouseover',
    event => {
      if (isFrame(event.target)) ontoFrame = true
    },
    listen,
  )
  doc.addEventListener(
    'focusout',
    event => {
      // Firefox takes focus from the control here only at the next move,
      // once it is in a frame: the frame's element is then the active one.
      framed = isFrame(doc.activeElement)
      // Chromium and WebKit take it at the click into the frame, to nowhere
      // this document knows, within this window, from a control that could
      // still hold it.
      const el = own(event)
      left = (event as FocusEvent).relatedTarget === null && doc.hasFocus() && couldHoldFocus(el) ? el : null
    },
    listen,
  )
  doc.addEventListener(
    'keydown',
    event => {
      if (!MODIFIERS.has(event.key)) doc.documentElement.classList.remove(POINTER_INPUT)
    },
    listen,
  )
  doc.addEventListener(
    'focusin',
    event => {
      const el = own(event)
      // Focus back from a frame, well after the latest press here, where
      // the browser would ring it: a key this document never saw.
      if (
        event.timeStamp - lastPressAt > PRESS_FOCUS_MS &&
        ringed(el) &&
        (framed || (event.relatedTarget === null && (ontoFrame || left?.isConnected === true)))
      ) {
        doc.documentElement.classList.remove(POINTER_INPUT)
      }
      left = null
      framed = false
    },
    listen,
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

/** The press on a menu's entry that closed the menu (its click and where it landed), held until the next click. */
let held: { doc: Document; event: Event; press: Press } | null = null
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
  held = { doc, event, press }
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
      if (h === null || h.doc !== doc || next === h.event) return
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
