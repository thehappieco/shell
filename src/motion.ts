// The look's motion (shell 1.5.0, decision 0052): a change of theme or of
// language crossfades the whole page, the way thehappie.co does. The
// browser's View Transitions API takes a picture of the page, the host
// applies its change, and the picture fades into the new page over 0.3 s
// (tokens.css, under LOOK_CHANGING on <html>, so the timing is this
// crossfade's alone and no other view transition of a host takes it).
//
// The rule it enforces: changeLook runs the host's update exactly once,
// always. It runs it inside the crossfade when the browser can show one,
// and at once when it cannot or should not: no View Transitions API, the
// person asked for reduced motion, the page is hidden, or it is being
// prerendered (nobody would see it). Inside the crossfade it waits for
// Vue's next render after the update, so a language's new words are in the
// new picture rather than snapping in after it. It starts no timer, stores
// nothing and sets no style.
//
// A host calls it for a change it shows: a person's choice, or the
// account's look arriving over the one the page showed. It never calls it
// at boot, nor for a value the page already shows, which would fade the
// page into itself. Inside the crossfade the update runs a frame later
// than the call (the browser takes its picture first), so what the page
// shows is stale until then: a refusal's put-back, a save's echo or the
// account's look that arrives meanwhile, compared with it, would be
// judged no change and then overwritten by the update still on its way.
// lookChanger is how a host avoids that: while a crossfade's update has
// not run, every change joins that update, in the order asked for, so
// none runs ahead of an older one, none is dropped, and the crossfade
// fades into the last look asked for.

import { nextTick } from 'vue'
import { type ActivationDocument, isPrerendering } from './activation.js'

/** LOOK_CHANGING is the class on <html> while the look's crossfade runs. */
export const LOOK_CHANGING = 'thc-look-changing'

/** The part of a view transition this uses. */
interface ViewTransitionLike {
  readonly ready: Promise<unknown>
  readonly finished: Promise<unknown>
  readonly updateCallbackDone: Promise<unknown>
}

/** LookDocument is the part of a document changeLook needs; tests pass their own. */
export type LookDocument = ActivationDocument &
  Pick<Document, 'documentElement' | 'visibilityState'> & {
    startViewTransition?: (update: () => Promise<void>) => ViewTransitionLike
  }

/** How many crossfades are running: a newer one skips the one before, and the class stays until the last ends. */
let running = 0

function reducedMotion(): boolean {
  try {
    return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  } catch {
    return false
  }
}

/** LookValues is a change of the look: a language, a theme, or both; undefined leaves one as it is. */
export interface LookValues {
  readonly locale?: string | undefined
  readonly theme?: string | undefined
}

/** LookChanger is a host's one way to show a change of its look. */
export interface LookChanger {
  /** show shows next, which apply applies (and remembers). */
  show: (next: LookValues, apply: () => void) => void
  /** settled resolves once every change shown so far has run its apply. */
  settled: () => Promise<void>
}

/**
 * lookChanger returns the one way a host shows every change of its look:
 * its header's controls, My account, a save's answer and its refusal's
 * put-back, the account's look arriving. shown reads the language and the
 * theme the page shows now.
 *
 * While a crossfade's update has not run yet, a change joins it: its apply
 * runs in that update, after the ones before it, so the crossfade fades
 * into the last look asked for, and nothing runs ahead of an older change
 * or is dropped (a hidden page, reduced motion or a quick answer change
 * nothing about the order). Otherwise a change that differs from what the
 * page shows starts a crossfade, and one that does not runs at once, so
 * the page still remembers what it shows and never fades into itself.
 */
export function lookChanger(shown: () => { locale: string; theme: string }, doc?: LookDocument): LookChanger {
  let open: Array<() => void> | null = null
  let done: Promise<void> = Promise.resolve()
  const show = (next: LookValues, apply: () => void): void => {
    if (open !== null) {
      open.push(apply)
      return
    }
    const now = shown()
    const differs = (next.locale !== undefined && next.locale !== now.locale) || (next.theme !== undefined && next.theme !== now.theme)
    if (!differs) {
      apply()
      return
    }
    const applies = [apply]
    open = applies
    done = changeLook(() => {
      open = null
      let failed: { err: unknown } | null = null
      for (const a of applies) {
        try {
          a()
        } catch (err) {
          failed ??= { err }
        }
      }
      if (failed !== null) throw failed.err
    }, doc).catch(() => undefined)
  }
  return { show, settled: () => done }
}

/** now runs update at once, as a promise of its end. */
function now(update: () => void): Promise<void> {
  try {
    update()
    return Promise.resolve()
  } catch (err) {
    return Promise.reject(err)
  }
}

/**
 * changeLook runs update, the host's change of theme or language, inside
 * the look's crossfade, or at once where none can be shown. The promise
 * resolves once update has run; it never rejects for the crossfade's sake,
 * only when update itself throws.
 */
export function changeLook(update: () => void, doc: LookDocument | undefined = globalThis.document as LookDocument | undefined): Promise<void> {
  if (doc === undefined || typeof doc.startViewTransition !== 'function' || doc.visibilityState !== 'visible' || isPrerendering(doc) || reducedMotion()) {
    return now(update)
  }
  const root = doc.documentElement
  root.classList.add(LOOK_CHANGING)
  running++
  const done = (): void => {
    running--
    if (running === 0) root.classList.remove(LOOK_CHANGING)
  }
  let vt: ViewTransitionLike
  try {
    vt = doc.startViewTransition(async () => {
      update()
      await nextTick()
    })
  } catch {
    // A browser that refuses to start one (an old engine's signature).
    done()
    return now(update)
  }
  // A transition the browser skips (the page hidden meanwhile, a newer
  // one) rejects ready, and finished when the update threw; the update has
  // run all the same, so neither is an error of the page's.
  void vt.ready.catch(() => undefined)
  void vt.finished.then(done, done)
  return vt.updateCallbackDone.then(() => undefined)
}

/**
 * whenStill runs then once el has finished the CSS transitions and
 * animations running on el itself now: at once when none runs (no motion,
 * reduced motion, an engine without the Web Animations API), else when the
 * last one ends or is cancelled. Animations inside el (a symbol's
 * choreography, a spinner) are not waited for, nor is one that never ends.
 * The shell's dialogs close through it after their exit (shell 1.6.1), so
 * they slide or fade out instead of vanishing, with no timer: the
 * browser's own animations say when they are done.
 */
export function whenStill(el: Element, then: () => void): void {
  const running =
    typeof el.getAnimations === 'function'
      ? el.getAnimations().filter(a => a.playState !== 'finished' && a.effect?.getComputedTiming?.().endTime !== Infinity)
      : []
  if (running.length === 0) {
    then()
    return
  }
  void Promise.all(running.map(a => a.finished.then(() => undefined, () => undefined))).then(then)
}
