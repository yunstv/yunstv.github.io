'use client'

import Link from 'next/link'
import { DropdownMenu, Text } from '@radix-ui/themes'
import { ChevronDownIcon } from '@radix-ui/react-icons'

export type NavMenuItem = { href: string; label: string }

/** Header nav entry that groups several pages under a dropdown. */
export function NavMenu({ label, items }: { label: string; items: NavMenuItem[] }) {
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger>
        <button
          type="button"
          style={{
            all: 'unset',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            color: 'var(--gray-12)',
          }}
        >
          <Text size="2">{label}</Text>
          <ChevronDownIcon width={14} height={14} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content size="2" align="start">
        {items.map((it) => (
          <DropdownMenu.Item key={it.href} asChild>
            <Link href={it.href}>{it.label}</Link>
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}
