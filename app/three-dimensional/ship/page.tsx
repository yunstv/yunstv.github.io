import type { Metadata } from 'next'
import { FullPageEmbed } from '@/components/embed/full-page-embed'

export const metadata: Metadata = {
  title: '运输船 · 3A 大作',
  description: '几猫3A大作 · 运输船',
}

export default function ShipPage() {
  return <FullPageEmbed src="/three-dimensional/ship.html" title="几猫3A大作 · 运输船" />
}
