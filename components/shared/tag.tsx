import { Badge } from '@radix-ui/themes'

export function Tag({ name }: { name: string }) {
  return (
    <Badge variant="soft" color="gray" radius="full">
      {name}
    </Badge>
  )
}
