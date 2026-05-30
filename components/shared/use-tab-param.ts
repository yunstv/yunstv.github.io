'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Syncs a Tabs component's selected value with a URL query param so that
 * sharing/reloading a link lands on the same tab.
 *
 * Behavior:
 * - Initial state matches the SSG-rendered HTML (= `defaultValue`) to avoid
 *   hydration warnings. After mount, the URL is read once and the tab snaps
 *   to whatever `?<paramName>=...` says (single frame, usually invisible).
 * - When the user switches tabs, the URL is updated via the native
 *   `history.replaceState` API — no Next.js router involvement → no scroll
 *   jump, no extra back-button entries.
 * - When the new value equals `defaultValue`, the param is stripped from the
 *   URL so the default page URL stays clean (`/tools` not `/tools?tab=illustrated`).
 *
 * Caveats:
 * - Does not validate the URL value. A malformed `?tab=bogus` will leave the
 *   Tabs without an active trigger; the user just clicks any tab to recover.
 * - Each Tabs group on the same route must use a distinct `paramName`,
 *   otherwise they'll fight over the same URL slot.
 */
export function useTabParam(
  paramName: string,
  defaultValue: string,
): [string, (next: string) => void] {
  const [value, setValueState] = useState<string>(defaultValue)

  useEffect(() => {
    const search = new URLSearchParams(window.location.search)
    const fromUrl = search.get(paramName)
    if (fromUrl) setValueState(fromUrl)
  }, [paramName])

  const setValue = useCallback(
    (next: string) => {
      setValueState(next)
      const url = new URL(window.location.href)
      if (next === defaultValue) {
        url.searchParams.delete(paramName)
      } else {
        url.searchParams.set(paramName, next)
      }
      window.history.replaceState(null, '', url.toString())
    },
    [paramName, defaultValue],
  )

  return [value, setValue]
}
