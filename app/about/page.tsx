import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Avatar, Flex, Heading } from '@radix-ui/themes'
import { getBySlug } from '@/lib/mdx'
import type { PageMeta } from '@/types/content'
import { MDXContent } from '@/components/mdx/mdx-content'

const SLUG = 'about'
// GitHub serves the current avatar for any public user at `<user>.png`,
// redirecting to avatars.githubusercontent.com. No API token, no rate limit
// for cached image fetches.
const AVATAR_URL = 'https://github.com/yunstv.png'

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
      <Flex align="center" gap="4" py="4" mb="4" wrap="wrap">
        <Avatar
          src={AVATAR_URL}
          fallback="Y"
          alt="Yuns 的 GitHub 头像"
          size="6"
          radius="full"
        />
        <Heading size="8">{page.frontmatter.title}</Heading>
      </Flex>
      <MDXContent code={page.code} />
    </article>
  )
}
