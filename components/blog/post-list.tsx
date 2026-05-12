import { Flex, Text } from '@radix-ui/themes'
import { PostCard } from './post-card'
import type { PostMeta } from '@/types/content'

export function PostList({ items }: { items: Array<{ slug: string; frontmatter: PostMeta }> }) {
  if (items.length === 0) {
    return <Text color="gray">还没有文章。</Text>
  }
  return (
    <Flex direction="column" gap="3">
      {items.map((item) => (
        <PostCard key={item.slug} slug={item.slug} frontmatter={item.frontmatter} />
      ))}
    </Flex>
  )
}
