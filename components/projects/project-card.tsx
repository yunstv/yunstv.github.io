import Link from 'next/link'
import { Badge, Card, Flex, Heading, Text } from '@radix-ui/themes'
import type { ProjectMeta } from '@/types/content'

const STATUS_COLOR: Record<ProjectMeta['status'], React.ComponentProps<typeof Badge>['color']> = {
  active: 'green',
  wip: 'amber',
  archived: 'gray',
}

export function ProjectCard({ slug, frontmatter }: { slug: string; frontmatter: ProjectMeta }) {
  return (
    <Card asChild size="2" variant="surface">
      <Link href={`/projects/${slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <Flex direction="column" gap="2" height="100%">
          <Flex align="center" justify="between" gap="2">
            <Heading size="4" as="h3">{frontmatter.name}</Heading>
            <Badge color={STATUS_COLOR[frontmatter.status]} variant="soft">
              {frontmatter.status}
            </Badge>
          </Flex>
          <Text size="2" color="gray">{frontmatter.description}</Text>
          <Flex gap="2" mt="auto" wrap="wrap">
            {frontmatter.stack.map((s) => (
              <Badge key={s} variant="outline" color="gray" radius="full">{s}</Badge>
            ))}
          </Flex>
        </Flex>
      </Link>
    </Card>
  )
}
