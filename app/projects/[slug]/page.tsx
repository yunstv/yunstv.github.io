import fs from 'node:fs/promises'
import path from 'node:path'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Badge, Flex, Heading, Link as RLink, Text } from '@radix-ui/themes'
import { getBySlug, listSlugs } from '@/lib/mdx'
import type { ProjectMeta } from '@/types/content'
import { ProjectTabs } from '@/components/projects/project-tabs'
import type { RepoActivityData } from '@/components/projects/repo-activity-view'

async function loadActivity(slug: string): Promise<RepoActivityData | undefined> {
  const p = path.join(process.cwd(), 'public/projects', slug, 'activity.json')
  try {
    const raw = await fs.readFile(p, 'utf-8')
    return JSON.parse(raw) as RepoActivityData
  } catch {
    return undefined
  }
}

type Params = Promise<{ slug: string }>

export async function generateStaticParams() {
  const slugs = await listSlugs('projects')
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  try {
    const { frontmatter } = await getBySlug<ProjectMeta>('projects', slug)
    return { title: frontmatter.name, description: frontmatter.description }
  } catch {
    return { title: 'Not found' }
  }
}

export default async function ProjectPage({ params }: { params: Params }) {
  const { slug } = await params
  let project
  try {
    project = await getBySlug<ProjectMeta>('projects', slug)
  } catch {
    notFound()
  }
  const { frontmatter, code } = project
  const activity = await loadActivity(slug)

  return (
    <article>
      <Flex direction="column" gap="3" py="4" mb="4">
        <Heading size="8">{frontmatter.name}</Heading>
        <Text size="3" color="gray">{frontmatter.description}</Text>
        <Flex gap="2" wrap="wrap" align="center">
          <Badge color="iris" variant="soft">{frontmatter.status}</Badge>
          {frontmatter.stack.map((s) => (
            <Badge key={s} variant="outline" color="gray" radius="full">{s}</Badge>
          ))}
        </Flex>
        <Flex gap="3" wrap="wrap" align="center">
          {frontmatter.github && (
            <RLink href={frontmatter.github} target="_blank" rel="noopener noreferrer" size="2">
              GitHub →
            </RLink>
          )}
          {frontmatter.demo && (
            <RLink href={frontmatter.demo} target="_blank" rel="noopener noreferrer" size="2">
              Demo →
            </RLink>
          )}
          <Text size="2" color="gray" id="busuanzi_container_page_pv" style={{ display: 'none' }}>
            · 阅读 <span id="busuanzi_value_page_pv">--</span> 次
          </Text>
        </Flex>
      </Flex>
      <ProjectTabs
        code={code}
        screenshots={frontmatter.screenshots}
        demo={frontmatter.demo}
        activity={activity}
      />
    </article>
  )
}
