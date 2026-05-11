'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { Theme } from '@radix-ui/themes'
import type { ReactNode } from 'react'

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <Theme accentColor="iris" grayColor="slate" radius="medium" panelBackground="solid">
        {children}
      </Theme>
    </NextThemesProvider>
  )
}
