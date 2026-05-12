import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Flex, Heading } from '@radix-ui/themes'
import { getBySlug } from '@/lib/mdx'
import type { PageMeta } from '@/types/content'
import { MDXContent } from '@/components/mdx/mdx-content'

const SLUG = 'about'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { frontmatter } = await getBySlug<PageMeta>('pages', SLUG)
    return { title: frontmatter.title, description: frontmatter.description }
  } catch {
    return { title: 'About' }
  }
}

export default async function AboutPage() {
  let page
  try {
    page = await getBySlug<PageMeta>('pages', SLUG)
  } catch {
    notFound()
  }
  return (
    <article>
      <Flex direction="column" gap="3" py="4" mb="4">
        <Heading size="8">{page.frontmatter.title}</Heading>
      </Flex>
      <MDXContent code={page.code} />
    </article>
  )
}
