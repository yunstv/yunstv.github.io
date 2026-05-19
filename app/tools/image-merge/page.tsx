import type { Metadata } from 'next'
import { Flex, Heading, Text } from '@radix-ui/themes'
import { ImageMergeTool } from '@/components/tools/image-merge-tool'

export const metadata: Metadata = {
  title: '图片拼接',
  description: '粘贴多张图片，按横向/纵向 + 紧凑/间距四种风格合成一张长图。',
}

export default function ImageMergePage() {
  return (
    <Flex direction="column" gap="5" py="4">
      <Flex direction="column" gap="2">
        <Heading size="8">图片拼接</Heading>
        <Text size="3" color="gray">
          点击下方区域后按 ⌘V / Ctrl+V 粘贴图片，可多次粘贴。小图能拖拽排序，挑一种风格点开预览，即可下载或复制 PNG。
        </Text>
        <Text size="2" color="gray" id="busuanzi_container_page_pv" style={{ display: 'none' }}>
          使用 <span id="busuanzi_value_page_pv">--</span> 次
        </Text>
      </Flex>
      <ImageMergeTool />
    </Flex>
  )
}
