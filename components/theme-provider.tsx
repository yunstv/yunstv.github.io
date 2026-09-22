'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Theme } from '@radix-ui/themes'
import type { ReactNode } from 'react'

export type ThemeSetting = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'theme'

const ThemeContext = createContext<{
  resolvedTheme: ResolvedTheme
  setTheme: (setting: ThemeSetting) => void
}>({ resolvedTheme: 'light', setTheme: () => {} })

function resolveSetting(setting: string | null): ThemeSetting {
  return setting === 'light' || setting === 'dark' ? setting : 'system'
}

function applyTheme(setting: ThemeSetting): ResolvedTheme {
  const dark =
    setting === 'dark' ||
    (setting === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
  return dark ? 'dark' : 'light'
}

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light')

  useEffect(() => {
    setResolvedTheme(applyTheme(resolveSetting(localStorage.getItem(THEME_STORAGE_KEY))))

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onMediaChange = () => {
      if (resolveSetting(localStorage.getItem(THEME_STORAGE_KEY)) === 'system') {
        setResolvedTheme(applyTheme('system'))
      }
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY || event.key === null) {
        setResolvedTheme(applyTheme(resolveSetting(event.newValue)))
      }
    }
    media.addEventListener('change', onMediaChange)
    window.addEventListener('storage', onStorage)
    return () => {
      media.removeEventListener('change', onMediaChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const setTheme = useCallback((setting: ThemeSetting) => {
    localStorage.setItem(THEME_STORAGE_KEY, setting)
    setResolvedTheme(applyTheme(setting))
  }, [])

  const value = useMemo(() => ({ resolvedTheme, setTheme }), [resolvedTheme, setTheme])

  return (
    <ThemeContext.Provider value={value}>
      <Theme accentColor="iris" grayColor="slate" radius="medium" panelBackground="solid">
        {children}
      </Theme>
    </ThemeContext.Provider>
  )
}
