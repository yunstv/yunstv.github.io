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
        <Flex align="center" justify="between" py="5" wrap="wrap" gap="3">
          <Flex align="center" gap="3" wrap="wrap">
            <Text size="2" color="gray">
              © {new Date().getFullYear()} Yuns. Built with Next.js + MDX.
            </Text>
            {/*
              busuanzi populates these spans once the count arrives. The
              `busuanzi_container_*` wrapper stays hidden until then to
              avoid a "0 次" flash.
            */}
            <Text size="2" color="gray" id="busuanzi_container_site_pv" style={{ display: 'none' }}>
              · 访问 <span id="busuanzi_value_site_pv">--</span> 次
            </Text>
            <Text size="2" color="gray" id="busuanzi_container_site_uv" style={{ display: 'none' }}>
              · <span id="busuanzi_value_site_uv">--</span> 位访客
            </Text>
          </Flex>
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
