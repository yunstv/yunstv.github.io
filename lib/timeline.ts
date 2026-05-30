import type { TimelineItem } from '@/components/timeline/types'
import type { PostMeta, ProjectMeta } from '@/types/content'

export function postsToTimelineItems(
  items: Array<{ slug: string; frontmatter: PostMeta }>
): TimelineItem[] {
  return items.map(({ slug, frontmatter }) => ({
    slug,
    href: `/blog/${slug}`,
    title: frontmatter.title,
    description: frontmatter.description,
    date: frontmatter.date,
    tags: frontmatter.tags ?? [],
  }))
}

export function projectsToTimelineItems(
  items: Array<{ slug: string; frontmatter: ProjectMeta }>
): TimelineItem[] {
  return items.map(({ slug, frontmatter }) => ({
    slug,
    href: `/projects/${slug}`,
    title: frontmatter.name,
    description: frontmatter.description,
    date: frontmatter.date,
    tags: frontmatter.stack ?? [],
    screenshots: frontmatter.screenshots?.length,
  }))
}
