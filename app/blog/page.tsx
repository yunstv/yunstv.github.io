import type { Metadata } from 'next'
import { Flex, Heading, Text } from '@radix-ui/themes'
import { listAll } from '@/lib/mdx'
import type { PostMeta } from '@/types/content'
import { PostList } from '@/components/blog/post-list'
import { ViewsTabs } from '@/components/timeline/views-tabs'
import { postsToTimelineItems } from '@/lib/timeline'

export const metadata: Metadata = {
  title: 'Blog',
  description: '文章列表',
}

export default async function BlogPage() {
  const posts = await listAll<PostMeta>('posts')
  const timelineItems = postsToTimelineItems(posts)
  return (
    <Flex direction="column" gap="5" py="4">
      <Flex direction="column" gap="2">
        <Heading size="8">Blog</Heading>
        <Text size="3" color="gray">想到什么写什么。共 {posts.length} 篇。</Text>
      </Flex>
      <ViewsTabs
        items={timelineItems}
        listSlot={<PostList items={posts} />}
        unit="篇"
      />
    </Flex>
  )
}
