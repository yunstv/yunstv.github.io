'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Badge, Box, Dialog, Flex, ScrollArea, Text } from '@radix-ui/themes'
import dayjs from 'dayjs'
import type { PostMeta } from '@/types/content'

type Item = { slug: string; frontmatter: PostMeta }

export function PostsDayDialog({
  open,
  onOpenChange,
  date,
  items,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: string
  items: Item[]
}) {
  const [active, setActive] = useState<string | null>(null)

  const allTags = useMemo(() => {
    const set = new Set<string>()
    for (const it of items) {
      it.frontmatter.tags?.forEach((t) => set.add(t))
    }
    return Array.from(set).sort()
  }, [items])

  const filtered = useMemo(
    () => (active ? items.filter((it) => it.frontmatter.tags?.includes(active)) : items),
    [items, active]
  )

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) setActive(null)
        onOpenChange(v)
      }}
    >
      <Dialog.Content maxWidth="560px">
        <Dialog.Title>
          {date ? dayjs(date).format('YYYY-MM-DD') : ''} · {items.length} 篇
        </Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="3">
          点击标签筛选当天文章
        </Dialog.Description>

        {allTags.length > 0 && (
          <Flex gap="2" wrap="wrap" mb="3">
            <Badge
              variant={active === null ? 'solid' : 'soft'}
              color="gray"
              radius="full"
              onClick={() => setActive(null)}
              style={{ cursor: 'pointer' }}
            >
              全部
            </Badge>
            {allTags.map((t) => (
              <Badge
                key={t}
                variant={active === t ? 'solid' : 'soft'}
                color="gray"
                radius="full"
                onClick={() => setActive(t)}
                style={{ cursor: 'pointer' }}
              >
                {t}
              </Badge>
            ))}
          </Flex>
        )}

        <ScrollArea type="auto" style={{ maxHeight: '60vh' }}>
          <Flex direction="column" gap="2" pr="2">
            {filtered.length === 0 ? (
              <Text color="gray">该标签下没有文章。</Text>
            ) : (
              filtered.map((it) => (
                <Link
                  key={it.slug}
                  href={`/blog/${it.slug}`}
                  style={{ color: 'inherit', textDecoration: 'none' }}
                >
                  <Box
                    p="3"
                    style={{
                      borderRadius: 8,
                      border: '1px solid var(--gray-a4)',
                      transition: 'background 0.15s',
                    }}
                    className="post-day-row"
                  >
                    <Text as="div" weight="medium">
                      {it.frontmatter.title}
                    </Text>
                    {it.frontmatter.description && (
                      <Text as="div" size="2" color="gray" mt="1">
                        {it.frontmatter.description}
                      </Text>
                    )}
                    {it.frontmatter.tags && it.frontmatter.tags.length > 0 && (
                      <Flex gap="2" wrap="wrap" mt="2">
                        {it.frontmatter.tags.map((t) => (
                          <Badge key={t} variant="soft" color="gray" radius="full">
                            {t}
                          </Badge>
                        ))}
                      </Flex>
                    )}
                  </Box>
                </Link>
              ))
            )}
          </Flex>
        </ScrollArea>
      </Dialog.Content>
    </Dialog.Root>
  )
}
