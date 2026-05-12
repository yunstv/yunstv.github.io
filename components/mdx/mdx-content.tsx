'use client'

import { useMemo } from 'react'
import { getMDXComponent } from 'mdx-bundler/client'
import { mdxComponents } from './mdx-components'

export function MDXContent({ code }: { code: string }) {
  const Component = useMemo(() => getMDXComponent(code), [code])
  return <Component components={mdxComponents} />
}
