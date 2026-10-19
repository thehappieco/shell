// A page the browser prerenders (shell 1.4.0): Chrome and Edge load the
// page the person is about to open in the background, from the speculation
// rules of the page they are on, and swap it in when they click. Its script
// runs before anyone sees it, so every side effect waits until the person
// arrives: a navigation, a write to browser storage, a focus. While it is
// being prerendered document.prerendering is true; the prerenderingchange
// event says it is shown. Reads (GET /v1/shell, a session) may run at once.
//
// The rule it enforces: whenActivated runs its callback at once on a page
// that is shown, and once, at prerenderingchange, on a page being
// prerendered; callbacks deferred together run in the order they were
// given, one listener each. It listens on the document only, runs no timer
// and touches no storage. A browser that does not prerender never sets
// document.prerendering, so everything runs at once there, as before.

/** ActivationDocument is the part of a document this needs; tests pass their own. */
export type ActivationDocument = Pick<Document, 'addEventListener'> & { readonly prerendering?: boolean }

function currentDocument(): ActivationDocument | undefined {
  return typeof document === 'undefined' ? undefined : (document as ActivationDocument)
}

/** isPrerendering says whether doc is being prerendered: nobody sees it yet. */
export function isPrerendering(doc: ActivationDocument | undefined = currentDocument()): boolean {
  return doc?.prerendering === true
}

/**
 * whenActivated runs fn now on a page that is shown, or once the person
 * arrives on a page being prerendered. A host puts every side effect of its
 * boot behind it: a navigation, a storage write, a focus.
 */
export function whenActivated(fn: () => void, doc: ActivationDocument | undefined = currentDocument()): void {
  if (doc === undefined || !isPrerendering(doc)) {
    fn()
    return
  }
  doc.addEventListener('prerenderingchange', () => fn(), { once: true })
}

/** activated resolves now on a page that is shown, or once the person arrives on a page being prerendered. */
export function activated(doc: ActivationDocument | undefined = currentDocument()): Promise<void> {
  return new Promise(resolve => whenActivated(resolve, doc))
}
