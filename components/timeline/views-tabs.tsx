'use client'

import type { ReactNode } from 'react'
import { Box, Flex, Tabs } from '@radix-ui/themes'
import {
  ActivityLogIcon,
  BarChartIcon,
  CalendarIcon,
  ListBulletIcon,
} from '@radix-ui/react-icons'
import { TimelineView } from './timeline-view'
import { CalendarView } from './calendar-view'
import { ActivityView } from './activity-view'
import type { TimelineItem } from './types'

export function ViewsTabs({
  items,
  listSlot,
  listLabel = '列表',
  listIcon = <ListBulletIcon />,
  unit = '篇',
}: {
  items: TimelineItem[]
  listSlot: ReactNode
  listLabel?: string
  listIcon?: ReactNode
  unit?: string
}) {
  return (
    <Tabs.Root defaultValue="timeline">
      <Tabs.List>
        <Tabs.Trigger value="timeline">
          <Flex align="center" gap="2">
            <ActivityLogIcon />
            时间轴
          </Flex>
        </Tabs.Trigger>
        <Tabs.Trigger value="list">
          <Flex align="center" gap="2">
            {listIcon}
            {listLabel}
          </Flex>
        </Tabs.Trigger>
        <Tabs.Trigger value="calendar">
          <Flex align="center" gap="2">
            <CalendarIcon />
            日历
          </Flex>
        </Tabs.Trigger>
        <Tabs.Trigger value="activity">
          <Flex align="center" gap="2">
            <BarChartIcon />
            活跃
          </Flex>
        </Tabs.Trigger>
      </Tabs.List>
      <Box pt="4">
        <Tabs.Content value="timeline">
          <TimelineView items={items} unit={unit} />
        </Tabs.Content>
        <Tabs.Content value="list">{listSlot}</Tabs.Content>
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
