import { Box, Callout as RCallout } from '@radix-ui/themes'
import { InfoCircledIcon, ExclamationTriangleIcon, CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons'
import type { ReactNode } from 'react'

type CalloutType = 'info' | 'warning' | 'success' | 'danger'

const COLOR: Record<CalloutType, React.ComponentProps<typeof RCallout.Root>['color']> = {
  info: 'blue',
  warning: 'amber',
  success: 'green',
  danger: 'red',
}

const ICON: Record<CalloutType, ReactNode> = {
  info: <InfoCircledIcon />,
  warning: <ExclamationTriangleIcon />,
  success: <CheckCircledIcon />,
  danger: <CrossCircledIcon />,
}

export function Callout({
  type = 'info',
  children,
}: {
  type?: CalloutType
  children: ReactNode
}) {
  // `RCallout.Text` always renders as `<p>`, and MDX produces `<p>` for each
  // paragraph — multi-paragraph Callout content would nest `<p>` inside `<p>`
  // and trigger a hydration error. Use a `<Box>` (renders as `<div>`) with
  // Radix's `rt-CalloutText` class so the text aligns correctly next to the
  // icon, but block-level children remain valid HTML.
  return (
    <RCallout.Root color={COLOR[type]} my="3">
      <RCallout.Icon>{ICON[type]}</RCallout.Icon>
      <Box className="rt-CalloutText">{children}</Box>
    </RCallout.Root>
  )
}
