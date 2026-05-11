import Link from 'next/link'
import { Container, Flex, Text } from '@radix-ui/themes'
import { ThemeToggle } from './theme-toggle'

const NAV = [
  { href: '/blog', label: 'Blog' },
  { href: '/projects', label: 'Projects' },
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
            <Text weight="bold" size="4">yunstv</Text>
          </Link>
          <Flex align="center" gap="5">
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
