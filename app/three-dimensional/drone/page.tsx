import type { Metadata } from 'next'
import { FullPageEmbed } from '@/components/embed/full-page-embed'

export const metadata: Metadata = {
  title: '无人机 · DJI Air 3S 拆解',
  description: 'DJI Air 3S · 3D 交互拆解可视化',
}

export default function DronePage() {
  return <FullPageEmbed src="/three-dimensional/drone.html" title="DJI Air 3S · 3D 交互拆解可视化" />
}
