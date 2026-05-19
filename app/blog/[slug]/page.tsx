import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Flex, Heading, Text } from '@radix-ui/themes'
import { getBySlug, listSlugs } from '@/lib/mdx'
import type { PostMeta } from '@/types/content'
import { MDXContent } from '@/components/mdx/mdx-content'
import { Time } from '@/components/shared/time'
import { Tag } from '@/components/shared/tag'

type Params = Promise<{ slug: string }>

export async function generateStaticParams() {
  const slugs = await listSlugs('posts')
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  try {
    const { frontmatter } = await getBySlug<PostMeta>('posts', slug)
    return {
      title: frontmatter.title,
      description: frontmatter.description,
    }
  } catch {
    return { title: 'Not found' }
  }
}

export default async function PostPage({ params }: { params: Params }) {
  const { slug } = await params
  let post
  try {
    post = await getBySlug<PostMeta>('posts', slug)
  } catch {
    notFound()
  }
  const { frontmatter, code } = post

  if (frontmatter.draft && process.env.NODE_ENV === 'production') {
    notFound()
  }

  return (
    <article>
      <Flex direction="column" gap="3" py="4" mb="4">
        <Heading size="8">{frontmatter.title}</Heading>
        {frontmatter.description && (
          <Text size="3" color="gray">{frontmatter.description}</Text>
        )}
        <Flex align="center" gap="3" wrap="wrap">
          <Time value={frontmatter.date} />
          {frontmatter.updated && (
            <Text size="2" color="gray">· updated <Time value={frontmatter.updated} /></Text>
          )}
          <Text size="2" color="gray" id="busuanzi_container_page_pv" style={{ display: 'none' }}>
            · 阅读 <span id="busuanzi_value_page_pv">--</span> 次
          </Text>
          {frontmatter.tags?.map((t) => <Tag key={t} name={t} />)}
        </Flex>
      </Flex>
      <MDXContent code={code} />
    </article>
  )
}
