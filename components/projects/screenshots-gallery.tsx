'use client'

import Image from 'next/image'
import { Box, Card, Flex, Heading, Link as RLink, Text } from '@radix-ui/themes'
import type { ScreenshotMeta } from '@/types/content'

interface Props {
  shots: ScreenshotMeta[]
  demo?: string
}

export function ScreenshotsGallery({ shots, demo }: Props) {
  if (!shots || shots.length === 0) {
    return (
      <Text color="gray" size="2">
        暂无快照
      </Text>
    )
  }

  return (
    <Flex direction="column" gap="5">
      {shots.map((shot, i) => {
        const href =
          shot.route && demo ? `${demo.replace(/\/$/, '')}${shot.route}` : undefined
        return (
          <Card key={shot.src}>
            <Flex direction="column" gap="3">
              <Flex justify="between" align="baseline" gap="3" wrap="wrap">
                <Heading size="4">{shot.title}</Heading>
                {href && (
                  <RLink
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="2"
                  >
                    {shot.route} →
                  </RLink>
                )}
              </Flex>
              {shot.description && (
                <Text size="2" color="gray">
                  {shot.description}
                </Text>
              )}
              <Box
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '1440 / 900',
                  background: 'var(--gray-3)',
                  borderRadius: 'var(--radius-3)',
                  overflow: 'hidden',
                }}
              >
                <Image
                  src={shot.src}
                  alt={shot.title}
                  fill
                  loading={i === 0 ? 'eager' : 'lazy'}
                  sizes="(max-width: 768px) 100vw, 900px"
                  style={{ objectFit: 'contain' }}
                />
              </Box>
            </Flex>
          </Card>
        )
      })}
    </Flex>
  )
}
