import { Callout as RCallout } from '@radix-ui/themes'
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
  return (
    <RCallout.Root color={COLOR[type]} my="3">
      <RCallout.Icon>{ICON[type]}</RCallout.Icon>
      <RCallout.Text>{children}</RCallout.Text>
    </RCallout.Root>
  )
}
