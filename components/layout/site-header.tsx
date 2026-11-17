import Link from 'next/link'
import { Container, Flex, Text } from '@radix-ui/themes'
import { ThemeToggle } from './theme-toggle'
import { NavMenu, type NavMenuItem } from './nav-menu'

const THREE_D: NavMenuItem[] = [
  { href: '/three-dimensional/engine', label: '内燃机' },
  { href: '/three-dimensional/drone', label: '无人机' },
  { href: '/three-dimensional/ship', label: '运输船' },
  { href: '/three-dimensional/city', label: '灰港' },
]

const NAV = [
  { href: '/blog', label: 'Blog' },
  { href: '/projects', label: 'Projects' },
  { href: '/tools', label: 'Tools' },
  { href: '/about', label: 'About' },
]

export function SiteHeader() {
  return (
    <header
      style={{
        borderBottom: '1px solid var(--gray-a4)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backdropFilter: 'blur(8px)',
        background: 'var(--color-background)',
      }}
    >
      <Container size="3">
        <Flex align="center" justify="between" py="3">
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Text weight="bold" size="4">Yuns</Text>
          </Link>
          <Flex align="center" gap="5">
            <NavMenu label="three-dimensional" items={THREE_D} />
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                style={{ textDecoration: 'none', color: 'var(--gray-12)' }}
              >
                <Text size="2">{n.label}</Text>
              </Link>
            ))}
            <ThemeToggle />
          </Flex>
        </Flex>
      </Container>
    </header>
  )
}
