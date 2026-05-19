import type { Metadata } from 'next'
import { Flex, Heading, Text } from '@radix-ui/themes'
import { ImageCropTool } from '@/components/tools/image-crop-tool'

export const metadata: Metadata = {
  title: '图片裁切',
  description: '粘贴一张图，拖动选定重点区域，按 1:1 / 圆形 / 16:9 / 9:16 四种比例导出。',
}

export default function ImageCropPage() {
  return (
    <Flex direction="column" gap="5" py="4">
      <Flex direction="column" gap="2">
        <Heading size="8">图片裁切</Heading>
        <Text size="3" color="gray">
          点击下方区域后按 ⌘V / Ctrl+V 粘贴图片（新粘贴会替换当前图）。选一种比例点开预览，可拖动裁切框选定重点区域，然后下载或复制 PNG。
        </Text>
        <Text size="2" color="gray" id="busuanzi_container_page_pv" style={{ display: 'none' }}>
          使用 <span id="busuanzi_value_page_pv">--</span> 次
        </Text>
      </Flex>
      <ImageCropTool />
    </Flex>
  )
}
