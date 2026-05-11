import Link from 'next/link'
import { Flex, Heading, Text, Link as RLink } from '@radix-ui/themes'

export default function NotFound() {
  return (
    <Flex direction="column" gap="4" py="9" align="center">
      <Heading size="9">404</Heading>
      <Text size="4" color="gray">这里啥也没有。</Text>
      <RLink asChild>
        <Link href="/">← 回首页</Link>
      </RLink>
    </Flex>
  )
}
