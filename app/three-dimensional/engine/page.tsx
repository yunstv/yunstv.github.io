import type { Metadata } from 'next'
import { FullPageEmbed } from '@/components/embed/full-page-embed'

export const metadata: Metadata = {
  title: '内燃机 · 3D 声浪展厅',
  description: '十台顶奢燃油发动机 · 3D 声浪展厅',
}

export default function EnginePage() {
  return <FullPageEmbed src="/three-dimensional/engine.html" title="十台顶奢燃油发动机 · 3D 声浪展厅" />
}
