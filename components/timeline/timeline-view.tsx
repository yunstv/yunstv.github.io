'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Badge, Box, Button, Card, Flex, Heading, Text, Tooltip } from '@radix-ui/themes'
import { ImageIcon } from '@radix-ui/react-icons'
import dayjs from 'dayjs'
import { DayDialog } from './day-dialog'
import type { TimelineItem } from './types'

const MAX_PER_DAY = 3

export function TimelineView({
  items,
  unit = '篇',
}: {
  items: TimelineItem[]
  unit?: string
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, TimelineItem[]>()
    for (const it of items) {
      const d = dayjs(it.date).format('YYYY-MM-DD')
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
    return <Text color="gray">还没有内容。</Text>
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
                  {list.length} {unit}
                </Text>
              </Flex>
              <Flex direction="column" gap="2">
                {visible.map((it) => (
                  <Card key={it.slug} asChild variant="surface">
                    <Link
                      href={it.href}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <Flex direction="column" gap="1">
                        <Flex align="center" gap="2">
                          <Text weight="medium">{it.title}</Text>
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
                          <Text size="2" color="gray">
                            {it.description}
                          </Text>
                        )}
                        {it.tags.length > 0 && (
                          <Flex gap="2" wrap="wrap" mt="1">
                            {it.tags.map((t) => (
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
      <DayDialog
        open={activeDate !== null}
        onOpenChange={(o) => {
          if (!o) setActiveDate(null)
        }}
        date={activeDate ?? ''}
        items={activeItems}
        unit={unit}
      />
    </Box>
  )
}
