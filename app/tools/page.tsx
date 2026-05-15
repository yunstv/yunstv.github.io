import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, Flex, Heading, Text } from '@radix-ui/themes'

export const metadata: Metadata = {
  title: 'Tools',
  description: '一些自用的小工具。',
}

const TOOLS = [
  {
    href: '/tools/text-to-image',
    name: '文本转图片',
    desc: '把终端里 Claude 的输出粘贴进来，导出成几种风格的截图，方便分享和存档。',
  },
]

export default function ToolsPage() {
  return (
    <Flex direction="column" gap="5" py="4">
      <Flex direction="column" gap="2">
        <Heading size="8">Tools</Heading>
        <Text size="3" color="gray">一些自用的小工具。共 {TOOLS.length} 个。</Text>
      </Flex>
      <Flex direction="column" gap="3">
        {TOOLS.map((t) => (
          <Link key={t.href} href={t.href} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Card>
              <Flex direction="column" gap="1">
                <Text size="4" weight="medium">{t.name}</Text>
                <Text size="2" color="gray">{t.desc}</Text>
              </Flex>
            </Card>
          </Link>
        ))}
      </Flex>
    </Flex>
  )
}
