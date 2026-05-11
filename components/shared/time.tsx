import dayjs from 'dayjs'
import { Text } from '@radix-ui/themes'

export function Time({ value, format = 'YYYY-MM-DD' }: { value?: string; format?: string }) {
  if (!value) return null
  const d = dayjs(value)
  return (
    <Text as="span" size="2" color="gray">
      <time dateTime={d.toISOString()}>{d.format(format)}</time>
    </Text>
  )
}
