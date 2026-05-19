import Link from 'next/link'
import { Flex, Heading, Text, Link as RLink } from '@radix-ui/themes'
import { listAll } from '@/lib/mdx'
import type { PostMeta, ProjectMeta } from '@/types/content'
import { PostCard } from '@/components/blog/post-card'
import { ProjectCard } from '@/components/projects/project-card'
import { Grid } from '@radix-ui/themes'

export default async function HomePage() {
  const [posts, projects] = await Promise.all([
    listAll<PostMeta>('posts'),
    listAll<ProjectMeta>('projects'),
  ])
  const recentPosts = [...posts]
    .sort((a, b) => +new Date(b.frontmatter.date) - +new Date(a.frontmatter.date))
    .slice(0, 3)
  const featuredProjects = projects.filter((p) => p.frontmatter.featured).slice(0, 4)

  return (
    <Flex direction="column" gap="8" py="6">
      <section>
        <Flex direction="column" gap="3">
          <Heading size="9">Hi, I&apos;m Yuns 👋</Heading>
          <Text size="4" color="gray" style={{ maxWidth: '42rem' }}>
            软件工程师 · 业余写作者 · 偶尔折腾点东西。
            这里是我的博客与作品集——记录代码、想法和一些没什么用的实验。
          </Text>
        </Flex>
      </section>

      <section>
        <Flex align="baseline" justify="between" mb="4">
          <Heading size="6">最近文章</Heading>
          <RLink asChild size="2">
            <Link href="/blog">全部 →</Link>
          </RLink>
        </Flex>
        {recentPosts.length > 0 ? (
          <Flex direction="column" gap="3">
            {recentPosts.map((p) => (
              <PostCard key={p.slug} slug={p.slug} frontmatter={p.frontmatter} />
            ))}
          </Flex>
        ) : (
          <Text color="gray">还没有文章。</Text>
        )}
      </section>

      <section>
        <Flex align="baseline" justify="between" mb="4">
          <Heading size="6">精选项目</Heading>
          <RLink asChild size="2">
            <Link href="/projects">全部 →</Link>
          </RLink>
        </Flex>
        {featuredProjects.length > 0 ? (
          <Grid columns={{ initial: '1', sm: '2' }} gap="3">
            {featuredProjects.map((p) => (
              <ProjectCard key={p.slug} slug={p.slug} frontmatter={p.frontmatter} />
            ))}
          </Grid>
        ) : (
          <Text color="gray">还没有精选项目。</Text>
        )}
      </section>
    </Flex>
  )
}
