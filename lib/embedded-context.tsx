'use client'

import { createContext, useContext } from 'react'

/**
 * Signals that a page-level view (lists, inventory, etc.) is rendered *inside*
 * another container — e.g. a workspace split pane — rather than as a full page.
 *
 * Full-page toolbars assume a 64px global top bar (`sticky top-16`) and a page
 * padding of `px-8` (hence the `-mx-8 px-8` bleed). Inside a pane those offsets
 * create a phantom gap at the top and horizontal overflow. When embedded, the
 * toolbar sticks to the pane's own scroll top (`top-0`) and bleeds to the pane
 * padding (`-mx-3 px-3`) instead.
 *
 * Defaults to `false`, so existing full-page usages are unaffected.
 */
const EmbeddedContext = createContext(false)

export const EmbeddedProvider = EmbeddedContext.Provider

export function useEmbedded() {
  return useContext(EmbeddedContext)
}

/** Toolbar wrapper classes that adapt to the embedded context. */
export function toolbarStickyClass(embedded: boolean) {
  return embedded ? 'top-0 -mx-3 px-3' : 'top-16 -mx-8 px-8'
}
