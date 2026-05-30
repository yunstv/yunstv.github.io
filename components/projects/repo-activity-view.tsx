'use client'

import { useMemo, useState } from 'react'
import { Box, Flex, SegmentedControl, Text, Tooltip } from '@radix-ui/themes'
import dayjs from 'dayjs'

export interface RepoActivityData {
  total: number
  since: string
  until: string
  buckets: { date: string; count: number }[]
}

const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const WEEKDAY_LABELS: Array<string | null> = [null, '一', null, '三', null, '五', null]

function levelColor(count: number, max: number): string {
  if (count === 0) return 'var(--gray-a3)'
  if (max <= 0) return 'var(--accent-a5)'
  const r = count / max
  if (r >= 0.75) return 'var(--accent-a11)'
  if (r >= 0.5) return 'var(--accent-a9)'
  if (r >= 0.25) return 'var(--accent-a7)'
  return 'var(--accent-a5)'
}

export function RepoActivityView({ data }: { data: RepoActivityData }) {
  const byDate = useMemo(() => {
    const map = new Map<string, number>()
    for (const b of data.buckets) map.set(b.date, b.count)
    return map
  }, [data])

  const years = useMemo(() => {
    const yStart = dayjs(data.since).year()
    const yEnd = dayjs(data.until).year()
    const ys: number[] = []
    for (let y = yEnd; y >= yStart; y--) ys.push(y)
    return ys
  }, [data])

  const [year, setYear] = useState<number>(years[0])

  const { columns, monthMarkers, totalInYear, maxInYear } = useMemo(() => {
    const yearStart = dayjs(`${year}-01-01`)
    const yearEnd = dayjs(`${year}-12-31`)
    const gridStart = yearStart.day(0)
    const gridEnd = yearEnd.day(6)
    const totalDays = gridEnd.diff(gridStart, 'day') + 1
    const cols: Array<Array<{ date: string; count: number; inYear: boolean }>> = []
    let total = 0
    let max = 0
    for (let i = 0; i < totalDays; i += 7) {
      const week: Array<{ date: string; count: number; inYear: boolean }> = []
      for (let j = 0; j < 7; j++) {
        const d = gridStart.add(i + j, 'day')
        const inYear = d.year() === year
        const dateStr = d.format('YYYY-MM-DD')
        const count = byDate.get(dateStr) ?? 0
        if (inYear) {
          total += count
          if (count > max) max = count
        }
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
    return { columns: cols, monthMarkers: markers, totalInYear: total, maxInYear: max }
  }, [year, byDate])

  return (
    <Box>
      <Flex align="center" justify="between" mb="3" wrap="wrap" gap="3">
        <Flex gap="3" align="baseline" wrap="wrap">
          <Text size="2" color="gray">
            {year} 年共{' '}
            <Text style={{ color: 'var(--accent-11)' }}>{totalInYear}</Text> 次提交
          </Text>
          <Text size="1" color="gray">
            · 累计 {data.total} · {data.since} → {data.until}
          </Text>
        </Flex>
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
            <Flex direction="column" gap="1" mr="1" style={{ width: 16 }}>
              {WEEKDAY_LABELS.map((label, i) => (
                <Box
                  key={i}
                  style={{ height: 12, display: 'flex', alignItems: 'center' }}
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
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        background: cell.inYear ? levelColor(cell.count, maxInYear) : 'transparent',
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
                      content={`${cell.date} · ${cell.count} 次提交`}
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
        <Text size="1" color="gray">少</Text>
        {[0, 1, 2, 3, 4].map((lv) => (
          <Box
            key={lv}
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              background: levelColor(lv === 0 ? 0 : Math.ceil(maxInYear * [0, 0.1, 0.3, 0.55, 0.8][lv]), maxInYear),
              outline: '1px solid var(--gray-a3)',
            }}
          />
        ))}
        <Text size="1" color="gray">多</Text>
      </Flex>
    </Box>
  )
}
