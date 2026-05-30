'use client'

import { Box, Flex, Tabs } from '@radix-ui/themes'
import { BarChartIcon, FileTextIcon, ImageIcon } from '@radix-ui/react-icons'
import { MDXContent } from '@/components/mdx/mdx-content'
import { useTabParam } from '@/components/shared/use-tab-param'
import { ScreenshotsGallery } from './screenshots-gallery'
import { RepoActivityView, type RepoActivityData } from './repo-activity-view'
import type { ScreenshotMeta } from '@/types/content'

interface Props {
  code: string
  screenshots?: ScreenshotMeta[]
  demo?: string
  activity?: RepoActivityData
}

export function ProjectTabs({ code, screenshots, demo, activity }: Props) {
  const hasShots = !!screenshots && screenshots.length > 0
  const hasActivity = !!activity && activity.buckets.length > 0
  const [value, setValue] = useTabParam('tab', 'content')

  return (
    <Tabs.Root value={value} onValueChange={setValue}>
      <Tabs.List>
        <Tabs.Trigger value="content">
          <Flex align="center" gap="2">
            <FileTextIcon />
            内容
          </Flex>
        </Tabs.Trigger>
        {hasShots && (
          <Tabs.Trigger value="screenshots">
            <Flex align="center" gap="2">
              <ImageIcon />
              快照 {screenshots!.length}
            </Flex>
          </Tabs.Trigger>
        )}
        {hasActivity && (
          <Tabs.Trigger value="activity">
            <Flex align="center" gap="2">
              <BarChartIcon />
              提交 {activity!.total}
            </Flex>
          </Tabs.Trigger>
        )}
      </Tabs.List>
      <Box pt="4">
        <Tabs.Content value="content">
          <MDXContent code={code} />
        </Tabs.Content>
        {hasShots && (
          <Tabs.Content value="screenshots">
            <ScreenshotsGallery shots={screenshots!} demo={demo} />
          </Tabs.Content>
        )}
        {hasActivity && (
          <Tabs.Content value="activity">
            <RepoActivityView data={activity!} />
          </Tabs.Content>
        )}
      </Box>
    </Tabs.Root>
  )
}
