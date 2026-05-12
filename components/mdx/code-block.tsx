'use client'

import { useRef, useState } from 'react'
import { IconButton } from '@radix-ui/themes'
import { CopyIcon, CheckIcon } from '@radix-ui/react-icons'
import type { HTMLAttributes } from 'react'

export function CodeBlock(props: HTMLAttributes<HTMLPreElement>) {
  const preRef = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    const text = preRef.current?.innerText ?? ''
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <pre ref={preRef} {...props} />
      <IconButton
        size="1"
        variant="soft"
        color="gray"
        aria-label="Copy code"
        onClick={onCopy}
        style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </IconButton>
    </div>
  )
}
