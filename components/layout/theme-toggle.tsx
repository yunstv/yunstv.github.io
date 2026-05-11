'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { IconButton } from '@radix-ui/themes'
import { SunIcon, MoonIcon } from '@radix-ui/react-icons'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <IconButton variant="ghost" size="2" aria-label="Toggle theme">
        <SunIcon />
      </IconButton>
    )
  }

  const isDark = resolvedTheme === 'dark'
  return (
    <IconButton
      variant="ghost"
      size="2"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </IconButton>
  )
}
