import type { MetadataRoute } from 'next'
import { listAll } from '@/lib/mdx'
import type { PostMeta, ProjectMeta } from '@/types/content'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://yunstv.github.io'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, projects] = await Promise.all([
    listAll<PostMeta>('posts'),
    listAll<ProjectMeta>('projects'),
  ])

  const staticEntries: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/blog`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/projects`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.5 },
  ]

  const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: p.frontmatter.updated || p.frontmatter.date,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  const projectEntries: MetadataRoute.Sitemap = projects.map((p) => ({
    url: `${SITE_URL}/projects/${p.slug}`,
    lastModified: p.frontmatter.date,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticEntries, ...postEntries, ...projectEntries]
}
