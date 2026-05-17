'use client'

import { useMemo, useState } from 'react'
import { Box, Flex, SegmentedControl, Text, Tooltip } from '@radix-ui/themes'
import dayjs from 'dayjs'
import { PostsDayDialog } from './posts-day-dialog'
import type { PostMeta } from '@/types/content'

type Item = { slug: string; frontmatter: PostMeta }

function levelColor(count: number): string {
  if (count === 0) return 'var(--gray-a3)'
  if (count === 1) return 'var(--accent-a5)'
  if (count === 2) return 'var(--accent-a7)'
  if (count <= 4) return 'var(--accent-a9)'
  return 'var(--accent-a11)'
}

const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const WEEKDAY_LABELS: Array<string | null> = [null, '一', null, '三', null, '五', null]

export function ActivityView({ items }: { items: Item[] }) {
  const byDate = useMemo(() => {
    const map = new Map<string, Item[]>()
    for (const it of items) {
      const d = dayjs(it.frontmatter.date).format('YYYY-MM-DD')
      const arr = map.get(d) ?? []
      arr.push(it)
      map.set(d, arr)
    }
    return map
  }, [items])

  const years = useMemo(() => {
    const set = new Set<number>()
    for (const it of items) {
      set.add(dayjs(it.frontmatter.date).year())
    }
    if (set.size === 0) set.add(dayjs().year())
    return Array.from(set).sort((a, b) => b - a)
  }, [items])

  const [year, setYear] = useState<number>(years[0])

  const { columns, monthMarkers, total } = useMemo(() => {
    const yearStart = dayjs(`${year}-01-01`)
    const yearEnd = dayjs(`${year}-12-31`)
    const gridStart = yearStart.day(0)
    const gridEnd = yearEnd.day(6)
    const totalDays = gridEnd.diff(gridStart, 'day') + 1
    const cols: Array<Array<{ date: string; count: number; inYear: boolean }>> = []
    let postsInYear = 0
    for (let i = 0; i < totalDays; i += 7) {
      const week: Array<{ date: string; count: number; inYear: boolean }> = []
      for (let j = 0; j < 7; j++) {
        const d = gridStart.add(i + j, 'day')
        const inYear = d.year() === year
        const dateStr = d.format('YYYY-MM-DD')
        const count = byDate.get(dateStr)?.length ?? 0
        if (inYear) postsInYear += count
        week.push({ date: dateStr, count: inYear ? count : 0, inYear })
      }
      cols.push(week)
    }
    const markers: Array<{ col: number; label: string }> = []
    let lastMonth = -1
    cols.forEach((col, idx) => {
      const firstInYear = col.find((c) => c.inYear)
      if (!firstInYear) return
      const m = dayjs(firstInYear.date).month()
      if (m !== lastMonth) {
        markers.push({ col: idx, label: MONTH_LABELS[m] })
        lastMonth = m
      }
    })
    return { columns: cols, monthMarkers: markers, total: postsInYear }
  }, [year, byDate])

  const [activeDate, setActiveDate] = useState<string | null>(null)

  return (
    <Box>
      <Flex align="center" justify="between" mb="3" wrap="wrap" gap="3">
        <Text size="2" color="gray">
          {year} 年共发布 <Text style={{ color: 'var(--accent-11)' }}>{total}</Text> 篇
        </Text>
        {years.length > 1 && (
          <SegmentedControl.Root
            value={String(year)}
            onValueChange={(v) => setYear(Number(v))}
            size="1"
          >
            {years.map((y) => (
              <SegmentedControl.Item key={y} value={String(y)}>
                {y}
              </SegmentedControl.Item>
            ))}
          </SegmentedControl.Root>
        )}
      </Flex>

      <Box style={{ overflowX: 'auto' }}>
        <Box style={{ display: 'inline-block', minWidth: 'max-content' }}>
          {/* Month markers */}
          <Flex gap="1" mb="1" style={{ paddingLeft: 20 }}>
            {columns.map((_, idx) => {
              const marker = monthMarkers.find((m) => m.col === idx)
              return (
                <Box key={idx} style={{ width: 12 }}>
                  {marker && (
                    <Text size="1" color="gray" style={{ whiteSpace: 'nowrap' }}>
                      {marker.label}
                    </Text>
                  )}
                </Box>
              )
            })}
          </Flex>

          <Flex gap="1">
            {/* Weekday labels */}
            <Flex direction="column" gap="1" mr="1" style={{ width: 16 }}>
              {WEEKDAY_LABELS.map((label, i) => (
                <Box
                  key={i}
                  style={{
                    height: 12,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {label && (
                    <Text size="1" color="gray">
                      {label}
                    </Text>
                  )}
                </Box>
              ))}
            </Flex>

            {columns.map((col, ci) => (
              <Flex key={ci} direction="column" gap="1">
                {col.map((cell) => {
                  const cellBox = (
                    <Box
                      onClick={() => cell.count > 0 && setActiveDate(cell.date)}
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        background: cell.inYear ? levelColor(cell.count) : 'transparent',
                        cursor: cell.count > 0 ? 'pointer' : 'default',
                        outline: cell.inYear ? '1px solid var(--gray-a3)' : 'none',
                      }}
                    />
                  )
                  if (!cell.inYear) {
                    return <Box key={cell.date}>{cellBox}</Box>
                  }
                  return (
                    <Tooltip
                      key={cell.date}
                      content={`${cell.date} · ${cell.count} 篇`}
                    >
                      {cellBox}
                    </Tooltip>
                  )
                })}
              </Flex>
            ))}
          </Flex>
        </Box>
      </Box>

      <Flex align="center" gap="2" mt="3" justify="end">
        <Text size="1" color="gray">
          少
        </Text>
        {[0, 1, 2, 4, 6].map((c) => (
          <Box
            key={c}
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              background: levelColor(c),
              outline: '1px solid var(--gray-a3)',
            }}
          />
        ))}
        <Text size="1" color="gray">
          多
        </Text>
      </Flex>

      <PostsDayDialog
        open={activeDate !== null}
        onOpenChange={(o) => {
          if (!o) setActiveDate(null)
        }}
        date={activeDate ?? ''}
        items={activeDate ? byDate.get(activeDate) ?? [] : []}
      />
    </Box>
  )
}
