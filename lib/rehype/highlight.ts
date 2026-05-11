import { visit } from 'unist-util-visit'
import { refractor } from 'refractor'
import tsx from 'refractor/tsx'
import jsx from 'refractor/jsx'
import { toString } from 'hast-util-to-string'
import type { Root, Element, ElementContent } from 'hast'

refractor.register(tsx)
refractor.register(jsx)

const LANG_ALIASES: Record<string, string> = {
  ts: 'typescript',
  js: 'javascript',
  sh: 'bash',
  shell: 'bash',
  html: 'markup',
  xml: 'markup',
}

export function rehypeHighlight() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'pre') return
      const codeEl = node.children.find(
        (c): c is Element => c.type === 'element' && c.tagName === 'code'
      )
      if (!codeEl) return

      const classes = (codeEl.properties?.className as string[] | undefined) ?? []
      const langClass = classes.find((c) => c.startsWith('language-'))
      const rawLang = langClass?.replace('language-', '') || 'text'
      const lang = LANG_ALIASES[rawLang] ?? rawLang
      const raw = toString(codeEl)

      if (!refractor.registered(lang)) return

      try {
        const highlighted = refractor.highlight(raw, lang)
        codeEl.children = highlighted.children as ElementContent[]
        codeEl.properties = {
          ...(codeEl.properties ?? {}),
          className: ['refractor', `language-${rawLang}`],
        }
      } catch {
        // leave content unhighlighted on failure
      }
    })
  }
}
