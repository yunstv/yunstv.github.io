import { Grid, Text } from '@radix-ui/themes'
import { ProjectCard } from './project-card'
import type { ProjectMeta } from '@/types/content'

export function ProjectGrid({
  items,
}: {
  items: Array<{ slug: string; frontmatter: ProjectMeta }>
}) {
  if (items.length === 0) {
    return <Text color="gray">还没有项目。</Text>
  }
  return (
    <Grid columns={{ initial: '1', sm: '2' }} gap="3">
      {items.map((it) => (
        <ProjectCard key={it.slug} slug={it.slug} frontmatter={it.frontmatter} />
      ))}
    </Grid>
  )
}
