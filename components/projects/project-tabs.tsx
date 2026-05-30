'use client'

import { Box, Flex, Tabs } from '@radix-ui/themes'
import { FileTextIcon, ImageIcon } from '@radix-ui/react-icons'
import { MDXContent } from '@/components/mdx/mdx-content'
import { ScreenshotsGallery } from './screenshots-gallery'
import type { ScreenshotMeta } from '@/types/content'

interface Props {
  code: string
  screenshots?: ScreenshotMeta[]
  demo?: string
}

export function ProjectTabs({ code, screenshots, demo }: Props) {
  const hasShots = !!screenshots && screenshots.length > 0

  return (
    <Tabs.Root defaultValue="content">
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
      </Box>
    </Tabs.Root>
  )
}
