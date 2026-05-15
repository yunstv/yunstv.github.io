import type { Metadata } from 'next'
import { Flex, Heading, Text } from '@radix-ui/themes'
import { TextToImageTool } from '@/components/tools/text-to-image-tool'

export const metadata: Metadata = {
  title: '文本转图片',
  description: '把终端 Claude 输出粘贴进来，一键导出几种风格的截图。',
}

export default function TextToImagePage() {
  return (
    <Flex direction="column" gap="5" py="4">
      <Flex direction="column" gap="2">
        <Heading size="8">文本转图片</Heading>
        <Text size="3" color="gray">
          把终端里 Claude 的输出复制过来粘贴到左侧，右侧会同步出现几种风格的预览，点右上角的按钮即可下载或复制 PNG。
        </Text>
      </Flex>
      <TextToImageTool />
    </Flex>
  )
}
