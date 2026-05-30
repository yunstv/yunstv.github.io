'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Badge, Box, Dialog, Flex, ScrollArea, Text, Tooltip } from '@radix-ui/themes'
import { ImageIcon } from '@radix-ui/react-icons'
import dayjs from 'dayjs'
import type { TimelineItem } from './types'

export function DayDialog({
  open,
  onOpenChange,
  date,
  items,
  unit = '篇',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: string
  items: TimelineItem[]
  unit?: string
}) {
  const [active, setActive] = useState<string | null>(null)

  const allTags = useMemo(() => {
    const set = new Set<string>()
    for (const it of items) {
      for (const t of it.tags) set.add(t)
    }
    return Array.from(set).sort()
  }, [items])

  const filtered = useMemo(
    () => (active ? items.filter((it) => it.tags.includes(active)) : items),
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
          {date ? dayjs(date).format('YYYY-MM-DD') : ''} · {items.length} {unit}
        </Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="3">
          点击标签筛选当天内容
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
              <Text color="gray">该标签下没有内容。</Text>
            ) : (
              filtered.map((it) => (
                <Link
                  key={it.slug}
                  href={it.href}
                  style={{ color: 'inherit', textDecoration: 'none' }}
                >
                  <Box
                    p="3"
                    style={{
                      borderRadius: 8,
                      border: '1px solid var(--gray-a4)',
                    }}
                  >
                    <Flex align="center" gap="2">
                      <Text as="div" weight="medium">
                        {it.title}
                      </Text>
                      {it.screenshots && it.screenshots > 0 ? (
                        <Tooltip content={`${it.screenshots} 张快照`}>
                          <Flex
                            align="center"
                            gap="1"
                            style={{ color: 'var(--accent-11)', flexShrink: 0 }}
                          >
                            <ImageIcon />
                            <Text size="1">{it.screenshots}</Text>
                          </Flex>
                        </Tooltip>
                      ) : null}
                    </Flex>
                    {it.description && (
                      <Text as="div" size="2" color="gray" mt="1">
                        {it.description}
                      </Text>
                    )}
                    {it.tags.length > 0 && (
                      <Flex gap="2" wrap="wrap" mt="2">
                        {it.tags.map((t) => (
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
