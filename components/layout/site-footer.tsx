import { Container, Flex, Text } from '@radix-ui/themes'
import { GitHubLogoIcon, TwitterLogoIcon } from '@radix-ui/react-icons'
import { SOCIAL } from '@/lib/social'

export function SiteFooter() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--gray-a4)',
        marginTop: '4rem',
      }}
    >
      <Container size="3">
        <Flex align="center" justify="between" py="5">
          <Text size="2" color="gray">
            © {new Date().getFullYear()} yunstv. Built with Next.js + MDX.
          </Text>
          <Flex align="center" gap="4">
            <a
              href={SOCIAL.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              style={{ color: 'var(--gray-11)', display: 'inline-flex' }}
            >
              <GitHubLogoIcon width="18" height="18" />
            </a>
            <a
              href={SOCIAL.twitter}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter / X"
              style={{ color: 'var(--gray-11)', display: 'inline-flex' }}
            >
              <TwitterLogoIcon width="18" height="18" />
            </a>
          </Flex>
        </Flex>
      </Container>
    </footer>
  )
}
