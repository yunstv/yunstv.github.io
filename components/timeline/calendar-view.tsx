'use client'

import { useMemo, useState } from 'react'
import { Box, Flex, Heading, IconButton, Text, Tooltip } from '@radix-ui/themes'
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons'
import dayjs, { type Dayjs } from 'dayjs'
import { DayDialog } from './day-dialog'
import type { TimelineItem } from './types'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export function CalendarView({
  items,
  unit = '篇',
}: {
  items: TimelineItem[]
  unit?: string
}) {
  const byDate = useMemo(() => {
    const map = new Map<string, TimelineItem[]>()
    for (const it of items) {
      const d = dayjs(it.date).format('YYYY-MM-DD')
      const arr = map.get(d) ?? []
      arr.push(it)
      map.set(d, arr)
    }
    return map
  }, [items])

  const initial = useMemo(() => {
    const first = items[0]?.date
    return first ? dayjs(first).startOf('month') : dayjs().startOf('month')
  }, [items])

  const [month, setMonth] = useState<Dayjs>(initial)
  const [activeDate, setActiveDate] = useState<string | null>(null)

  const grid = useMemo(() => {
    const start = month.startOf('month')
    const firstWeekday = start.day()
    const daysInMonth = month.daysInMonth()
    const cells: Array<{ key: string; date: Dayjs | null }> = []
    for (let i = 0; i < firstWeekday; i++) {
      cells.push({ key: `pad-pre-${i}`, date: null })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ key: `d-${d}`, date: month.date(d) })
    }
    while (cells.length % 7 !== 0) {
      cells.push({ key: `pad-post-${cells.length}`, date: null })
    }
    return cells
  }, [month])

  return (
    <Box>
      <Flex align="center" justify="between" mb="3">
        <Flex align="center" gap="2">
          <IconButton
            variant="ghost"
            onClick={() => setMonth((m) => m.subtract(1, 'month'))}
            aria-label="上个月"
          >
            <ChevronLeftIcon />
          </IconButton>
          <Heading size="4">{month.format('YYYY 年 M 月')}</Heading>
          <IconButton
            variant="ghost"
            onClick={() => setMonth((m) => m.add(1, 'month'))}
            aria-label="下个月"
          >
            <ChevronRightIcon />
          </IconButton>
        </Flex>
        <IconButton
          variant="ghost"
          onClick={() => setMonth(initial)}
          aria-label="回到最近月份"
          title="回到最近"
        >
          <Text size="1">今</Text>
        </IconButton>
      </Flex>

      <Box
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 6,
        }}
      >
        {WEEKDAYS.map((w) => (
          <Box key={w} style={{ textAlign: 'center', padding: '4px 0' }}>
            <Text size="1" color="gray">
              {w}
            </Text>
          </Box>
        ))}
        {grid.map((cell) => {
          if (!cell.date) {
            return <Box key={cell.key} style={{ aspectRatio: '1 / 1' }} />
          }
          const dateStr = cell.date.format('YYYY-MM-DD')
          const list = byDate.get(dateStr) ?? []
          const has = list.length > 0
          const inner = (
            <Box
              onClick={() => has && setActiveDate(dateStr)}
              style={{
                aspectRatio: '1 / 1',
                borderRadius: 6,
                border: '1px solid var(--gray-a4)',
                background: has ? 'var(--accent-a3)' : 'transparent',
                cursor: has ? 'pointer' : 'default',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                padding: 4,
              }}
            >
              <Text size="2" weight={has ? 'medium' : 'regular'} color={has ? undefined : 'gray'}>
                {cell.date.date()}
              </Text>
              {has && (
                <Text size="1" style={{ color: 'var(--accent-11)' }}>
                  · {list.length} ·
                </Text>
              )}
            </Box>
          )
          return (
            <Box key={cell.key}>
              {has ? (
                <Tooltip content={`${list.length} ${unit} · 点击查看`}>{inner}</Tooltip>
              ) : (
                inner
              )}
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
        items={activeDate ? byDate.get(activeDate) ?? [] : []}
        unit={unit}
      />
    </Box>
  )
}
