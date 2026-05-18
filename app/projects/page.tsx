import type { Metadata } from 'next'
import { Flex, Heading, Text } from '@radix-ui/themes'
import { listAll } from '@/lib/mdx'
import type { ProjectMeta } from '@/types/content'
import { ProjectGrid } from '@/components/projects/project-grid'
import { ViewsTabs } from '@/components/timeline/views-tabs'
import { projectsToTimelineItems } from '@/lib/timeline'

export const metadata: Metadata = {
  title: 'Projects',
  description: '我做过的项目',
}

export default async function ProjectsPage() {
  const projects = await listAll<ProjectMeta>('projects')
  const timelineItems = projectsToTimelineItems(projects)
  return (
    <Flex direction="column" gap="5" py="4">
      <Flex direction="column" gap="2">
        <Heading size="8">Projects</Heading>
        <Text size="3" color="gray">折腾过的东西。共 {projects.length} 个。</Text>
      </Flex>
      <ViewsTabs
        items={timelineItems}
        listSlot={<ProjectGrid items={projects} />}
        listLabel="网格"
        unit="个"
      />
    </Flex>
  )
}
