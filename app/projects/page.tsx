import type { Metadata } from 'next'
import { Flex, Heading, Text } from '@radix-ui/themes'
import { listAll } from '@/lib/mdx'
import type { ProjectMeta } from '@/types/content'
import { ProjectGrid } from '@/components/projects/project-grid'

export const metadata: Metadata = {
  title: 'Projects',
  description: '我做过的项目',
}

export default async function ProjectsPage() {
  const projects = await listAll<ProjectMeta>('projects')
  return (
    <Flex direction="column" gap="5" py="4">
      <Flex direction="column" gap="2">
        <Heading size="8">Projects</Heading>
        <Text size="3" color="gray">折腾过的东西。共 {projects.length} 个。</Text>
      </Flex>
      <ProjectGrid items={projects} />
    </Flex>
  )
}
