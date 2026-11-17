import type { Metadata } from 'next'
import { FullPageEmbed } from '@/components/embed/full-page-embed'

export const metadata: Metadata = {
  title: '灰港 · 开放世界',
  description: '灰港 · 开放世界小 demo',
}

export default function CityPage() {
  return <FullPageEmbed src="/three-dimensional/city-sandbox/index.html" title="灰港 · 开放世界小 demo" />
}
