'use client'

import { Box, Tabs } from '@radix-ui/themes'
import { PostList } from './post-list'
import { TimelineView } from './timeline-view'
import { CalendarView } from './calendar-view'
import { ActivityView } from './activity-view'
import type { PostMeta } from '@/types/content'

type Item = { slug: string; frontmatter: PostMeta }

export function BlogTabs({ items }: { items: Item[] }) {
  return (
    <Tabs.Root defaultValue="list">
      <Tabs.List>
        <Tabs.Trigger value="list">列表</Tabs.Trigger>
        <Tabs.Trigger value="timeline">时间轴</Tabs.Trigger>
        <Tabs.Trigger value="calendar">日历</Tabs.Trigger>
        <Tabs.Trigger value="activity">活跃</Tabs.Trigger>
      </Tabs.List>
      <Box pt="4">
        <Tabs.Content value="list">
          <PostList items={items} />
        </Tabs.Content>
        <Tabs.Content value="timeline">
          <TimelineView items={items} />
        </Tabs.Content>
        <Tabs.Content value="calendar">
          <CalendarView items={items} />
        </Tabs.Content>
        <Tabs.Content value="activity">
          <ActivityView items={items} />
        </Tabs.Content>
      </Box>
    </Tabs.Root>
  )
}
