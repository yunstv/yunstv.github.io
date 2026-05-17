'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Badge, Box, Button, Card, Flex, Heading, Text } from '@radix-ui/themes'
import dayjs from 'dayjs'
import { PostsDayDialog } from './posts-day-dialog'
import type { PostMeta } from '@/types/content'

type Item = { slug: string; frontmatter: PostMeta }
const MAX_PER_DAY = 3

export function TimelineView({ items }: { items: Item[] }) {
  const grouped = useMemo(() => {
    const map = new Map<string, Item[]>()
    for (const it of items) {
      const d = dayjs(it.frontmatter.date).format('YYYY-MM-DD')
      const arr = map.get(d) ?? []
      arr.push(it)
      map.set(d, arr)
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [items])

  const [activeDate, setActiveDate] = useState<string | null>(null)
  const activeItems = useMemo(
    () => (activeDate ? grouped.find(([d]) => d === activeDate)?.[1] ?? [] : []),
    [grouped, activeDate]
  )

  if (grouped.length === 0) {
    return <Text color="gray">还没有文章。</Text>
  }

  return (
    <Box>
      <Box pl="5" style={{ borderLeft: '2px solid var(--gray-a4)' }}>
        {grouped.map(([date, list]) => {
          const visible = list.slice(0, MAX_PER_DAY)
          const overflow = list.length - visible.length
          return (
            <Box key={date} mb="5" style={{ position: 'relative' }}>
              <Box
                style={{
                  position: 'absolute',
                  left: -27,
                  top: 10,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: 'var(--accent-9)',
                  border: '2px solid var(--color-background)',
                }}
              />
              <Flex align="baseline" gap="3" mb="2">
                <Heading size="3" as="h3">
                  {date}
                </Heading>
                <Text size="1" color="gray">
                  {list.length} 篇
                </Text>
              </Flex>
              <Flex direction="column" gap="2">
                {visible.map((it) => (
                  <Card key={it.slug} asChild variant="surface">
                    <Link
                      href={`/blog/${it.slug}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <Flex direction="column" gap="1">
                        <Text weight="medium">{it.frontmatter.title}</Text>
                        {it.frontmatter.description && (
                          <Text size="2" color="gray">
                            {it.frontmatter.description}
                          </Text>
                        )}
                        {it.frontmatter.tags && it.frontmatter.tags.length > 0 && (
                          <Flex gap="2" wrap="wrap" mt="1">
                            {it.frontmatter.tags.map((t) => (
                              <Badge key={t} variant="soft" color="gray" radius="full">
                                {t}
                              </Badge>
                            ))}
                          </Flex>
                        )}
                      </Flex>
                    </Link>
                  </Card>
                ))}
                {overflow > 0 && (
                  <Flex>
                    <Button
                      variant="ghost"
                      size="2"
                      onClick={() => setActiveDate(date)}
                    >
                      更多 +{overflow}
                    </Button>
                  </Flex>
                )}
              </Flex>
            </Box>
          )
        })}
      </Box>
      <PostsDayDialog
        open={activeDate !== null}
        onOpenChange={(o) => {
          if (!o) setActiveDate(null)
        }}
        date={activeDate ?? ''}
        items={activeItems}
      />
    </Box>
  )
}
