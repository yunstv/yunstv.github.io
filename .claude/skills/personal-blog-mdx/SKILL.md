---
name: personal-blog-mdx
description: |
  实施一个基于 Next.js 16 + Radix Themes + mdx-bundler 的个人博客与作品集站点。
  内容用 MDX 文件存储在仓库中，零数据库依赖，通过 Git 管理版本，部署到 Vercel/Cloudflare Pages。
  适用场景：博客文章、项目合集、工作经历、关于页面，后续可叠加 giscus 评论、Vercel Analytics、Upstash Redis 计数。
---

# 个人博客实施指南（MDX 方案）

## 0. 技术栈确认

已确认依赖（见 package.json），无需新增包：

- **框架**：Next.js 16 (App Router) + React 19 + TypeScript
- **UI**：Radix Themes 3 + Radix Primitives + next-themes（深色模式）
- **样式**：Tailwind CSS 4（布局/微调）+ Stitches（继承自 Radix）
- **MDX**：mdx-bundler + gray-matter + rehype-slug + refractor（代码高亮）+ unified/unist
- **工具**：glob（扫文件）、dayjs（时间）、clsx + tailwind-merge（class 合并）

> 注意：`bignumber.js`、`compare-versions`、`parse-numeric-range`、`qs` 若未实际使用可后续清理。
> Tailwind v4 用 `@tailwindcss/postcss`，不再用 `tailwind.config.js`，主题在 CSS 里用 `@theme` 定义。

## 1. 项目目录结构

```
yunstv.github.io/
├── app/
│   ├── layout.tsx                  # 根布局，挂 Radix Theme + ThemeProvider
│   ├── page.tsx                    # 首页：自我介绍 + 最近文章 + 精选项目
│   ├── globals.css                 # Tailwind v4 入口 + 自定义样式
│   ├── about/
│   │   └── page.tsx                # 关于页（来自哪里、技术栈历程）
│   ├── blog/
│   │   ├── page.tsx                # 文章列表
│   │   └── [slug]/page.tsx         # 文章详情
│   ├── projects/
│   │   ├── page.tsx                # 项目合集列表
│   │   └── [slug]/page.tsx         # 项目详情
│   ├── work/
│   │   └── page.tsx                # 工作经历时间线（可选）
│   ├── uses/
│   │   └── page.tsx                # 装备/工具页（可选）
│   ├── now/
│   │   └── page.tsx                # 当前在做什么（可选）
│   ├── rss.xml/route.ts            # RSS（Phase 5 加）
│   └── api/
│       └── views/[slug]/route.ts   # 浏览量（Phase 5 加）
│
├── content/                        # 所有 MDX 内容
│   ├── posts/
│   │   ├── hello-world.mdx
│   │   └── my-first-bug.mdx
│   ├── projects/
│   │   ├── project-a.mdx
│   │   └── project-b.mdx
│   └── pages/                      # about/uses/now 这类长文页面
│       ├── about.mdx
│       └── uses.mdx
│
├── components/
│   ├── layout/
│   │   ├── site-header.tsx         # 顶部导航 + 主题切换
│   │   ├── site-footer.tsx
│   │   └── theme-toggle.tsx
│   ├── mdx/
│   │   ├── mdx-content.tsx         # 客户端组件，调用 getMDXComponent
│   │   ├── mdx-components.tsx      # 自定义 MDX 组件映射（a/pre/img/Callout 等）
│   │   ├── code-block.tsx          # 代码块（refractor 高亮 + 复制按钮）
│   │   └── callout.tsx             # 自定义 <Callout> 组件供 MDX 引用
│   ├── blog/
│   │   ├── post-card.tsx
│   │   └── post-list.tsx
│   ├── projects/
│   │   ├── project-card.tsx
│   │   └── project-grid.tsx
│   └── shared/
│       ├── tag.tsx
│       └── time.tsx                # dayjs 包装的时间显示
│
├── lib/
│   ├── mdx.ts                      # 核心：扫描 + 解析 + 编译 MDX
│   ├── content.ts                  # 上层封装：getAllPosts / getPostBySlug 等
│   ├── rehype/
│   │   └── highlight.ts            # 基于 refractor 的代码高亮 rehype 插件
│   └── utils.ts                    # cn() 等工具
│
├── public/
│   ├── images/                     # 文章/项目配图
│   └── favicon.ico
│
├── types/
│   └── content.ts                  # PostMeta / ProjectMeta 类型定义
│
├── next.config.mjs
├── postcss.config.mjs              # Tailwind v4 走 PostCSS 插件
├── tsconfig.json
└── package.json
```

## 2. 内容 Schema（frontmatter 约定）

**文章 `content/posts/*.mdx`**：

```yaml
---
title: 我的第一个 Bug
description: 一句话摘要，用于列表页和 SEO
date: 2025-03-14
updated: 2025-04-01          # 可选
tags: [debugging, story]
cover: /images/posts/bug.jpg # 可选
draft: false                 # true 则不在生产环境显示
---
```

**项目 `content/projects/*.mdx`**：

```yaml
---
name: Yunstv Player
description: 一句话介绍
date: 2024-09-01             # 起始时间，用于排序
status: active               # active | archived | wip
stack: [Next.js, TypeScript, Tailwind]
github: https://github.com/yunstv/xxx
demo: https://xxx.example.com
cover: /images/projects/xxx.jpg
featured: true               # 首页是否精选展示
---
```

**长文页面 `content/pages/*.mdx`**：

```yaml
---
title: 关于我
description: ...
updated: 2025-05-01
---
```

## 3. 核心实现：lib/mdx.ts

这是整个项目的引擎，所有内容读取都过它。

```ts
// lib/mdx.ts
import fs from 'node:fs/promises'
import path from 'node:path'
import { glob } from 'glob'
import matter from 'gray-matter'
import { bundleMDX } from 'mdx-bundler'
import rehypeSlug from 'rehype-slug'
import { rehypeHighlight } from './rehype/highlight'

const CONTENT_DIR = path.join(process.cwd(), 'content')

export type ContentType = 'posts' | 'projects' | 'pages'

export interface ContentFile<T> {
  slug: string
  frontmatter: T
  code: string          // mdx-bundler 编译后的可执行代码
  readingTime?: number  // 可选
}

/** 列出某类内容下所有 slug（不编译，仅读 frontmatter） */
export async function listSlugs(type: ContentType): Promise<string[]> {
  const files = await glob('*.mdx', { cwd: path.join(CONTENT_DIR, type) })
  return files.map((f) => f.replace(/\.mdx$/, ''))
}

/** 读取并解析某类下所有文件的 frontmatter，用于列表页 */
export async function listAll<T>(type: ContentType): Promise<Array<{ slug: string; frontmatter: T }>> {
  const slugs = await listSlugs(type)
  const items = await Promise.all(
    slugs.map(async (slug) => {
      const file = await fs.readFile(path.join(CONTENT_DIR, type, `${slug}.mdx`), 'utf-8')
      const { data } = matter(file)
      return { slug, frontmatter: data as T }
    })
  )
  // 生产环境过滤 draft
  return items
    .filter((it) => process.env.NODE_ENV === 'development' || !(it.frontmatter as any).draft)
    .sort((a, b) => {
      const da = (a.frontmatter as any).date || (a.frontmatter as any).updated || ''
      const db = (b.frontmatter as any).date || (b.frontmatter as any).updated || ''
      return db.localeCompare(da)
    })
}

/** 编译单篇 MDX（用于详情页） */
export async function getBySlug<T>(type: ContentType, slug: string): Promise<ContentFile<T>> {
  const filePath = path.join(CONTENT_DIR, type, `${slug}.mdx`)
  const source = await fs.readFile(filePath, 'utf-8')

  const { code, frontmatter } = await bundleMDX({
    source,
    mdxOptions(options) {
      options.rehypePlugins = [
        ...(options.rehypePlugins ?? []),
        rehypeSlug,
        rehypeHighlight,
      ]
      return options
    },
  })

  return {
    slug,
    frontmatter: frontmatter as T,
    code,
  }
}
```

## 4. 代码高亮 rehype 插件

```ts
// lib/rehype/highlight.ts
import { visit } from 'unist-util-visit'
import { refractor } from 'refractor'
import { toHtml } from 'hast-util-to-html'
import { toString } from 'hast-util-to-string'
import type { Root, Element } from 'hast'

export function rehypeHighlight() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'pre') return
      const codeEl = node.children.find(
        (c): c is Element => c.type === 'element' && c.tagName === 'code'
      )
      if (!codeEl) return

      const langClass = (codeEl.properties?.className as string[] | undefined)?.find((c) =>
        c.startsWith('language-')
      )
      const lang = langClass?.replace('language-', '') || 'text'
      const raw = toString(codeEl)

      try {
        const highlighted = refractor.highlight(raw, lang)
        codeEl.children = highlighted.children as Element['children']
      } catch {
        // 不支持的语言，保持原样
      }
    })
  }
}
```

> 需要先注册语言：在 `lib/rehype/highlight.ts` 顶部 `import` 你常用的语言并 `refractor.register(...)`。
> 常用：tsx、typescript、javascript、bash、json、yaml、css、html、python、go、rust。

## 5. MDX 渲染组件（客户端）

```tsx
// components/mdx/mdx-content.tsx
'use client'
import { useMemo } from 'react'
import { getMDXComponent } from 'mdx-bundler/client'
import { mdxComponents } from './mdx-components'

export function MDXContent({ code }: { code: string }) {
  const Component = useMemo(() => getMDXComponent(code), [code])
  return <Component components={mdxComponents} />
}
```

```tsx
// components/mdx/mdx-components.tsx
import { Heading, Link, Text, Code } from '@radix-ui/themes'
import { CodeBlock } from './code-block'
import { Callout } from './callout'
import type { MDXComponents } from 'mdx/types'

export const mdxComponents: MDXComponents = {
  h1: (props) => <Heading as="h1" size="8" mt="6" mb="4" {...props} />,
  h2: (props) => <Heading as="h2" size="6" mt="6" mb="3" {...props} />,
  h3: (props) => <Heading as="h3" size="5" mt="5" mb="2" {...props} />,
  p: (props) => <Text as="p" size="3" mb="3" {...props} />,
  a: ({ href, ...rest }) => <Link href={href as string} {...rest} />,
  code: (props) => <Code {...props} />,
  pre: (props) => <CodeBlock {...props} />,
  Callout, // 在 MDX 里可以 <Callout type="warning">...</Callout>
}
```

## 6. 路由实现要点

**`app/blog/page.tsx`（Server Component）**：

```tsx
import { listAll } from '@/lib/mdx'
import type { PostMeta } from '@/types/content'
import { PostList } from '@/components/blog/post-list'

export default async function BlogPage() {
  const posts = await listAll<PostMeta>('posts')
  return <PostList items={posts} />
}
```

**`app/blog/[slug]/page.tsx`**：

```tsx
import { getBySlug, listSlugs } from '@/lib/mdx'
import { MDXContent } from '@/components/mdx/mdx-content'
import type { PostMeta } from '@/types/content'

export async function generateStaticParams() {
  const slugs = await listSlugs('posts')
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { frontmatter } = await getBySlug<PostMeta>('posts', slug)
  return { title: frontmatter.title, description: frontmatter.description }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { frontmatter, code } = await getBySlug<PostMeta>('posts', slug)
  return (
    <article>
      <header>
        <h1>{frontmatter.title}</h1>
        <time>{frontmatter.date}</time>
      </header>
      <MDXContent code={code} />
    </article>
  )
}
```

> Next.js 16 里 `params` 是 Promise，必须 await。这一点容易和老教程混淆。

## 7. Radix Themes 接入

**`app/layout.tsx`**：

```tsx
import '@radix-ui/themes/styles.css'
import './globals.css'
import { Theme } from '@radix-ui/themes'
import { ThemeProvider } from 'next-themes'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system">
          <Theme accentColor="iris" grayColor="slate" radius="medium">
            <SiteHeader />
            <main>{children}</main>
            <SiteFooter />
          </Theme>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

`next-themes` 和 Radix Themes 协作：把 `<Theme appearance>` 用 next-themes 的 `resolvedTheme` 控制，或者用 `<Theme>` 不传 appearance、靠 `<html class="dark">` 让 Radix 跟随。简单做法是后者。

## 8. Tailwind v4 配置

**`app/globals.css`**：

```css
@import 'tailwindcss';

@theme {
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
}

/* 让 Tailwind 不覆盖 Radix Themes 的 button/heading 默认样式 */
@layer base {
  /* 按需添加 */
}
```

**`postcss.config.mjs`**：

```js
export default {
  plugins: { '@tailwindcss/postcss': {} },
}
```

## 9. 实施顺序（建议每步独立 commit）

**Step 1 - 骨架（约 2 小时）**
- 建目录结构（app/、content/、components/、lib/、types/）
- 写 `lib/mdx.ts`、`lib/rehype/highlight.ts`、`types/content.ts`
- 在 `content/posts/` 放 1 篇 hello-world.mdx 作为测试样本

**Step 2 - 布局（约 1 小时）**
- `app/layout.tsx` 接入 Radix Theme + ThemeProvider
- `components/layout/site-header.tsx` + 主题切换按钮
- `app/page.tsx` 占位首页

**Step 3 - Blog 路由（约 2 小时）**
- `app/blog/page.tsx` 列表
- `app/blog/[slug]/page.tsx` 详情
- `components/mdx/mdx-content.tsx` + `mdx-components.tsx` + `code-block.tsx`
- 验证文章能渲染、代码块高亮正常

**Step 4 - Projects 路由（约 1.5 小时）**
- 复用 Step 3 的模式，做 `app/projects/`
- `project-card.tsx` 设计精美一些（封面图 + stack 徽章 + 链接）

**Step 5 - 静态页面（约 1 小时）**
- `app/about/page.tsx` 读取 `content/pages/about.mdx`
- 同理 uses / now（可选）

**Step 6 - 首页组装（约 1 小时）**
- 自我介绍区
- 最近 3 篇文章（调 `listAll('posts')` 取前 3）
- 精选项目（filter `featured: true`）

**Step 7 - 收尾（约 1 小时）**
- `app/sitemap.ts`
- `app/robots.ts`
- `not-found.tsx`
- metadata（title、description、og）

**Step 8 - 部署**
- 推 GitHub，连 Vercel
- 配域名

**Phase 2（后续增量，不在首次实施范围）**：
- RSS：`app/rss.xml/route.ts`，扫文章生成 XML
- giscus 评论：在文章详情页底部嵌入
- Vercel Analytics：装 `@vercel/analytics`，layout 里加 `<Analytics />`
- 浏览量：Upstash Redis + `/api/views/[slug]` route
- 全文搜索：Pagefind（构建时索引，零运行时依赖）

## 10. 类型定义

```ts
// types/content.ts
export interface PostMeta {
  title: string
  description: string
  date: string
  updated?: string
  tags?: string[]
  cover?: string
  draft?: boolean
}

export interface ProjectMeta {
  name: string
  description: string
  date: string
  status: 'active' | 'archived' | 'wip'
  stack: string[]
  github?: string
  demo?: string
  cover?: string
  featured?: boolean
}

export interface PageMeta {
  title: string
  description?: string
  updated?: string
}
```

## 11. 常见坑提醒

1. **mdx-bundler 在 Vercel 构建**：需要 `process.env.ESBUILD_BINARY_PATH` 指向 esbuild 二进制。Next.js 默认能处理，但出问题时检查这个。
2. **Server Component vs Client Component**：`getMDXComponent` 必须在客户端调用，所以 `MDXContent` 一定标 `'use client'`，但读取/编译过程都在 Server Component 完成、只把 `code` 字符串传过去。
3. **Next.js 16 的 params 是 Promise**：`params: Promise<{ slug: string }>`，用前必须 `await`。
4. **Tailwind v4 不再用 tailwind.config.js**：所有主题配置进 CSS 的 `@theme` 块。
5. **Radix Themes 的 `<Theme>` 必须在客户端可用**：如果 `app/layout.tsx` 报错，给 `<Theme>` 外层包一个 `'use client'` 组件。
6. **代码块高亮缺语言**：refractor 不像 shiki 那样全量加载，必须显式 register。否则中文站常见的 bash/typescript/tsx 会渲染成纯文本。

## 12. 验收清单

实施完成后逐项确认：

- [ ] `pnpm dev` 起服务，访问 `/` 显示首页
- [ ] `/blog` 显示文章列表，点击进入详情
- [ ] 文章中的代码块有语法高亮
- [ ] 文章中的 `<Callout>` 组件能渲染
- [ ] `/projects` 显示项目卡片，点击进入项目详情
- [ ] `/about` 显示由 MDX 渲染的关于页
- [ ] 切换深色/浅色模式，Radix 组件颜色跟随
- [ ] frontmatter 里 `draft: true` 的文章在 `pnpm build` 后不可访问
- [ ] 文章按日期倒序排列
- [ ] `pnpm build` 无报错，所有路由静态生成
- [ ] metadata（title、description）正确出现在 HTML head
