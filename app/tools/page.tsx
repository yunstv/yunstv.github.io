import type { Metadata } from 'next'
import { Flex, Heading, Text } from '@radix-ui/themes'
import { ToolsList, type ToolItem } from '@/components/tools/tools-list'

export const metadata: Metadata = {
  title: 'Tools',
  description: '一些自用的小工具。',
}

const TOOLS: ToolItem[] = [
  {
    href: '/tools/text-to-image',
    name: '文本转图片',
    desc: '把终端里 Claude 的输出粘贴进来，导出成几种风格的截图，方便分享和存档。',
  },
  {
    href: '/tools/image-merge',
    name: '图片拼接',
    desc: '粘贴多张图片，拖拽排序，按横向/纵向 + 紧凑/间距四种风格一键合成长图。',
  },
  {
    href: '/tools/image-crop',
    name: '图片裁切',
    desc: '粘贴一张图，拖动选定重点区域，按 1:1 / 圆形 / 16:9 / 9:16 四种比例导出。',
  },
]

export default function ToolsPage() {
  return (
    <Flex direction="column" gap="5" py="4">
      <Flex direction="column" gap="2">
        <Heading size="8">Tools</Heading>
        <Text size="3" color="gray">一些自用的小工具。共 {TOOLS.length} 个。</Text>
        <Text size="2" color="gray" id="busuanzi_container_page_pv" style={{ display: 'none' }}>
          访问 <span id="busuanzi_value_page_pv">--</span> 次
        </Text>
      </Flex>
      <ToolsList tools={TOOLS} />
    </Flex>
  )
}
