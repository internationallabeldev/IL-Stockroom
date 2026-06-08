'use client'

import { useState, useEffect, type Dispatch, type SetStateAction } from 'react'

/**
 * Drop-in replacement for `useState('')` on local search inputs.
 *
 * When the user picks a result in the global command palette, it navigates with
 * a `?q=<term>` query param. This hook reads that param once on mount, uses it
 * to seed the local search box, and then strips it from the URL (via the History
 * API, so it doesn't trigger a Next.js refetch). From then on the local state
 * owns the value, exactly like a normal `useState`.
 *
 * Seeding happens in an effect (not the initializer) to keep the server and
 * first client render identical and avoid hydration mismatches.
 */
export function useSearchSeed(param = 'q'): [string, Dispatch<SetStateAction<string>>] {
  const [search, setSearch] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const seed = params.get(param)
    if (!seed) return

    setSearch(seed)

    params.delete(param)
    const qs = params.toString()
    window.history.replaceState(
      null,
      '',
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
    )
  }, [param])

  return [search, setSearch]
}
