import { Heading, Link as RLink, Text, Code, Separator } from '@radix-ui/themes'
import NextLink from 'next/link'
import type { MDXComponents } from 'mdx/types'
import { CodeBlock } from './code-block'
import { Callout } from './callout'

export const mdxComponents: MDXComponents = {
  h1: (props) => <Heading as="h1" size="8" mt="6" mb="4" {...props} />,
  h2: (props) => <Heading as="h2" size="6" mt="6" mb="3" {...props} />,
  h3: (props) => <Heading as="h3" size="5" mt="5" mb="2" {...props} />,
  h4: (props) => <Heading as="h4" size="4" mt="4" mb="2" {...props} />,
  p: (props) => <Text as="p" size="3" mb="3" {...props} />,
  a: ({ href, children, ...rest }) => {
    const isInternal = typeof href === 'string' && (href.startsWith('/') || href.startsWith('#'))
    if (isInternal && typeof href === 'string') {
      return (
        <RLink asChild>
          <NextLink href={href}>{children}</NextLink>
        </RLink>
      )
    }
    return (
      <RLink href={href as string} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </RLink>
    )
  },
  ul: (props) => <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyle: 'disc' }} {...props} />,
  ol: (props) => <ol style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyle: 'decimal' }} {...props} />,
  li: (props) => <li style={{ marginBottom: '0.25rem' }} {...props} />,
  blockquote: (props) => (
    <blockquote
      style={{
        borderLeft: '3px solid var(--gray-7)',
        paddingLeft: '1rem',
        margin: '1rem 0',
        color: 'var(--gray-11)',
      }}
      {...props}
    />
  ),
  hr: () => <Separator my="5" size="4" />,
  code: (props) => <Code {...props} />,
  pre: (props) => <CodeBlock {...props} />,
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src as string} alt={alt ?? ''} style={{ maxWidth: '100%', borderRadius: 'var(--radius-3)' }} />
  ),
  Callout,
}
