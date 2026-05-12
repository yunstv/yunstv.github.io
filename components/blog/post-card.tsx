import Link from 'next/link'
import { Card, Flex, Heading, Text } from '@radix-ui/themes'
import { Time } from '@/components/shared/time'
import { Tag } from '@/components/shared/tag'
import type { PostMeta } from '@/types/content'

export function PostCard({ slug, frontmatter }: { slug: string; frontmatter: PostMeta }) {
  return (
    <Card asChild size="2" variant="surface">
      <Link href={`/blog/${slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <Flex direction="column" gap="2">
          <Heading size="4" as="h3">{frontmatter.title}</Heading>
          {frontmatter.description && (
            <Text size="2" color="gray">{frontmatter.description}</Text>
          )}
          <Flex align="center" gap="3" mt="1" wrap="wrap">
            <Time value={frontmatter.date} />
            {frontmatter.tags?.map((t) => <Tag key={t} name={t} />)}
          </Flex>
        </Flex>
      </Link>
    </Card>
  )
}
