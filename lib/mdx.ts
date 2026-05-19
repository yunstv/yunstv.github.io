import fs from 'node:fs/promises'
import path from 'node:path'
import { glob } from 'glob'
import matter from 'gray-matter'
import { bundleMDX } from 'mdx-bundler'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import { rehypeHighlight } from './rehype/highlight'

const CONTENT_DIR = path.join(process.cwd(), 'content')

export type ContentType = 'posts' | 'projects' | 'pages'

export interface ContentFile<T> {
  slug: string
  frontmatter: T
  code: string
}

export async function listSlugs(type: ContentType): Promise<string[]> {
  const dir = path.join(CONTENT_DIR, type)
  try {
    await fs.access(dir)
  } catch {
    return []
  }
  const files = await glob('*.mdx', { cwd: dir })
  return files.map((f) => f.replace(/\.mdx$/, ''))
}

export async function listAll<T>(
  type: ContentType
): Promise<Array<{ slug: string; frontmatter: T }>> {
  const slugs = await listSlugs(type)
  const items = await Promise.all(
    slugs.map(async (slug) => {
      const file = await fs.readFile(path.join(CONTENT_DIR, type, `${slug}.mdx`), 'utf-8')
      const { data } = matter(file)
      return { slug, frontmatter: data as T }
    })
  )
  return items
    .filter(
      (it) => process.env.NODE_ENV === 'development' || !(it.frontmatter as { draft?: boolean }).draft
    )
    .sort((a, b) => {
      // YAML parses bare `date: 2026-05-18` into a JS Date object, so we
      // can't rely on String() lexical compare (would produce
      // "Mon May 18 2026 ..." and sort by weekday name). Normalize via
      // Date.getTime() — accepts both Date and ISO string inputs.
      const fa = a.frontmatter as { date?: Date | string; updated?: Date | string }
      const fb = b.frontmatter as { date?: Date | string; updated?: Date | string }
      const ta = new Date(fa.date ?? fa.updated ?? 0).getTime()
      const tb = new Date(fb.date ?? fb.updated ?? 0).getTime()
      return tb - ta
    })
}

export async function getBySlug<T>(type: ContentType, slug: string): Promise<ContentFile<T>> {
  const filePath = path.join(CONTENT_DIR, type, `${slug}.mdx`)
  const source = await fs.readFile(filePath, 'utf-8')

  const { code, frontmatter } = await bundleMDX({
    source,
    mdxOptions(options) {
      options.remarkPlugins = [
        ...(options.remarkPlugins ?? []),
        remarkGfm,
      ]
      options.rehypePlugins = [
        ...(options.rehypePlugins ?? []),
        rehypeSlug,
        rehypeHighlight,
      ]
      return options
    },
  })

  return {
    slug,
    frontmatter: frontmatter as T,
    code,
  }
}
