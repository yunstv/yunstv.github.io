'use client'

import type { ReactNode } from 'react'
import { Box, Tabs } from '@radix-ui/themes'
import { TimelineView } from './timeline-view'
import { CalendarView } from './calendar-view'
import { ActivityView } from './activity-view'
import type { TimelineItem } from './types'

export function ViewsTabs({
  items,
  listSlot,
  listLabel = '列表',
  unit = '篇',
}: {
  items: TimelineItem[]
  listSlot: ReactNode
  listLabel?: string
  unit?: string
}) {
  return (
    <Tabs.Root defaultValue="list">
      <Tabs.List>
        <Tabs.Trigger value="list">{listLabel}</Tabs.Trigger>
        <Tabs.Trigger value="timeline">时间轴</Tabs.Trigger>
        <Tabs.Trigger value="calendar">日历</Tabs.Trigger>
        <Tabs.Trigger value="activity">活跃</Tabs.Trigger>
      </Tabs.List>
      <Box pt="4">
        <Tabs.Content value="list">{listSlot}</Tabs.Content>
        <Tabs.Content value="timeline">
          <TimelineView items={items} unit={unit} />
        </Tabs.Content>
        <Tabs.Content value="calendar">
          <CalendarView items={items} unit={unit} />
        </Tabs.Content>
        <Tabs.Content value="activity">
          <ActivityView items={items} unit={unit} />
        </Tabs.Content>
      </Box>
    </Tabs.Root>
  )
}
