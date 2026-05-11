import '@radix-ui/themes/styles.css'
import './globals.css'

import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Container } from '@radix-ui/themes'
import { ThemeProvider } from '@/components/theme-provider'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://yunstv.github.io'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'yunstv',
    template: '%s · yunstv',
  },
  description: '个人博客与作品集 — 用 Next.js + MDX 写的。',
  openGraph: {
    type: 'website',
    siteName: 'yunstv',
    locale: 'zh_CN',
    url: SITE_URL,
  },
  twitter: { card: 'summary_large_image' },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <SiteHeader />
          <Container size="3" py="6">
            <main>{children}</main>
          </Container>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  )
}
