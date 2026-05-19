---
name: github-contribution-wall
description: |
  在 Next.js 个人站点里，根据一个公开 GitHub 仓库 URL（或用户名），渲染类似 GitHub 个人主页的活跃贡献墙——
  53 × 7 日粒度热力图。零数据库依赖，纯 GitHub API + Next.js ISR 缓存。
  覆盖两种数据范围：
    A. 单仓库活跃度——用于项目详情页（`/projects/[slug]`）
    B. 多仓库聚合（用户总览）——用于首页 / about 页"我最近在做什么"模块
  REST API 走单仓库匿名调用，GraphQL API 走用户聚合（需 read-only token）。
---

# GitHub 贡献墙实施指南

## 0. 选型与责任划分

| 场景 | 数据源 | 粒度 | 是否需 token |
| - | - | - | - |
| 单仓库活跃度（项目详情页） | REST `/repos/{owner}/{repo}/commits` 翻页 + 自己分桶 | 日 | 否（匿名 60 req/h 够构建用） |
| 用户多仓库聚合（首页贡献墙） | GraphQL `user.contributionsCollection.contributionCalendar` | 日 | 是（read-only PAT） |

**为什么不混用**：

- REST 的 `stats/commit_activity` 只到周粒度，做不出 GitHub profile 那种 53×7 的小绿块——直接放弃
- REST 翻页 `/commits` 能做到日粒度，但**只能针对单仓库**——多仓库聚合就要拉 N 个仓库 × N 页，匿名额度一定爆
- GraphQL `contributionCalendar` 一次返回**用户在全 GitHub 的当日 commit / PR / issue 贡献数**，正是 profile 那块绿——但**必须鉴权**

所以两种实现并存，按页面选用对应 fetcher。

## 1. 仓库与用户名解析

外部输入是一个 URL 或字符串，统一解析成结构化对象：

```ts
// lib/github/parse.ts
export type RepoRef = { owner: string; repo: string }

export function parseRepoUrl(input: string): RepoRef | null {
  // 接受三种形式：
  //   https://github.com/owner/repo
  //   https://github.com/owner/repo.git
  //   owner/repo
  const m = input.trim().match(/^(?:https?:\/\/github\.com\/)?([^\/\s]+)\/([^\/\s\.]+)(?:\.git)?\/?$/)
  if (!m) return null
  return { owner: m[1], repo: m[2] }
}

export function parseUsername(input: string): string | null {
  // 接受 "yunstv" 或 "https://github.com/yunstv"
  const m = input.trim().match(/^(?:https?:\/\/github\.com\/)?([^\/\s]+)\/?$/)
  return m ? m[1] : null
}
```

> 不要在外面散落 `split('/')` 拼接，所有解析集中到这里。

## 2. 数据源 A：单仓库日粒度（REST）

### 2.1 端点

```
GET https://api.github.com/repos/{owner}/{repo}/commits
?since=2025-05-19T00:00:00Z
&until=2026-05-19T00:00:00Z
&per_page=100
&page=N
```

- 公开仓库**匿名也能调**，限速 60 req/h
- 每页 100 条，按 `Link` 响应头里的 `rel="next"` 翻页
- 返回每条 commit 的 `commit.author.date`（ISO 8601），按日分桶即可

### 2.2 lib/github/repo-activity.ts

```ts
import { type RepoRef } from './parse'

const GH_API = 'https://api.github.com'

type CommitDTO = {
  sha: string
  commit: { author: { date: string } | null }
}

export type DayBucket = { date: string; count: number } // date: 'YYYY-MM-DD'

const headers = (): Record<string, string> => {
  const h: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (process.env.GITHUB_TOKEN) {
    h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }
  return h
}

/** 拉过去 days 天的 commit，分桶到天 */
export async function fetchRepoActivity(
  ref: RepoRef,
  days = 365
): Promise<DayBucket[]> {
  const until = new Date()
  const since = new Date(until.getTime() - days * 86_400_000)

  const buckets = new Map<string, number>()
  // 初始化所有日期，零值占位（确保热力图没有 commit 的天也显示）
  for (let i = 0; i <= days; i++) {
    const d = new Date(since.getTime() + i * 86_400_000)
    buckets.set(toDateKey(d), 0)
  }

  let page = 1
  while (true) {
    const url = new URL(`${GH_API}/repos/${ref.owner}/${ref.repo}/commits`)
    url.searchParams.set('since', since.toISOString())
    url.searchParams.set('until', until.toISOString())
    url.searchParams.set('per_page', '100')
    url.searchParams.set('page', String(page))

    const res = await fetch(url, {
      headers: headers(),
      next: { revalidate: 3600 }, // ISR：1 小时复用
    })
    if (res.status === 404) return [] // 仓库私有或不存在
    if (!res.ok) throw new Error(`GitHub ${res.status} ${await res.text()}`)

    const commits = (await res.json()) as CommitDTO[]
    for (const c of commits) {
      const iso = c.commit.author?.date
      if (!iso) continue
      const key = toDateKey(new Date(iso))
      buckets.set(key, (buckets.get(key) ?? 0) + 1)
    }

    if (commits.length < 100) break // 最后一页
    page++
    if (page > 30) break // 兜底：3000 条 commit 上限，再多说明过滤错了
  }

  return Array.from(buckets, ([date, count]) => ({ date, count })).sort((a, b) =>
    a.date.localeCompare(b.date)
  )
}

function toDateKey(d: Date): string {
  // 用 UTC 还是本地时区——和 ContributionGrid 的"周起始"算法保持一致即可
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
```

> 翻页上限 30（= 3000 commit）是兜底——单仓库一年 3000+ commit 已经是极个别项目，
> 触发时多半是参数算错了。

## 3. 数据源 B：多仓库聚合（GraphQL）

### 3.1 查询

```graphql
query ($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
    }
  }
}
```

- `contributionCount` 是当日 commit + PR + issue + code review 的总贡献数（和 profile 一致）
- 时间窗口最多 1 年
- **必须带 token**：`Authorization: Bearer ${GITHUB_TOKEN}`，scope 只需 `public_repo` 或纯 read

### 3.2 lib/github/user-contributions.ts

```ts
const GH_GRAPHQL = 'https://api.github.com/graphql'

const QUERY = /* GraphQL */ `
  query ($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`

type GqlDay = { date: string; contributionCount: number }
type GqlWeek = { contributionDays: GqlDay[] }
type GqlResp = {
  data?: {
    user: {
      contributionsCollection: {
        contributionCalendar: { totalContributions: number; weeks: GqlWeek[] }
      }
    } | null
  }
  errors?: Array<{ message: string }>
}

export type UserCalendar = {
  total: number
  days: { date: string; count: number }[]
}

export async function fetchUserCalendar(
  login: string,
  days = 365
): Promise<UserCalendar> {
  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error('GITHUB_TOKEN required for user calendar')

  const to = new Date()
  const from = new Date(to.getTime() - days * 86_400_000)

  const res = await fetch(GH_GRAPHQL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: QUERY,
      variables: { login, from: from.toISOString(), to: to.toISOString() },
    }),
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error(`GitHub GraphQL ${res.status}`)

  const json = (await res.json()) as GqlResp
  if (json.errors?.length) throw new Error(json.errors[0].message)
  const user = json.data?.user
  if (!user) return { total: 0, days: [] }

  const cal = user.contributionsCollection.contributionCalendar
  const flat = cal.weeks.flatMap((w) =>
    w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount }))
  )
  return { total: cal.totalContributions, days: flat }
}
```

## 4. 鉴权与限流

| 路径 | 是否需 token | 限速 | 来源 |
| - | - | - | - |
| REST 单仓库 commits（匿名） | 否 | 60 req/h per IP | 公网默认 |
| REST 单仓库 commits（带 token） | 推荐 | 5000 req/h | PAT |
| GraphQL 用户日历 | 必须 | 5000 points/h | PAT |

**配置方式**：

```bash
# .env.local
GITHUB_TOKEN=ghp_xxx   # Fine-grained PAT, scope: "Public Repositories (read-only)"
```

```
# Vercel: Project Settings → Environment Variables → GITHUB_TOKEN（仅 Production / Preview）
# Cloudflare Pages: Settings → Environment variables → encrypted
```

> 千万**不要**把 token 暴露给客户端——所有 fetch 都在 Server Component 里调，
> 客户端只拿到分桶后的 `{date, count}[]`，没有 token 信息。

## 5. ContributionGrid 组件（SVG）

53 × 7 网格——和 GitHub profile 视觉一致。SVG 比 CSS Grid 更利于 tooltip 和导出 PNG。

```tsx
// components/github/contribution-grid.tsx
import { Tooltip } from '@radix-ui/themes'

type Day = { date: string; count: number }

interface Props {
  days: Day[]                    // 已按日期升序排列、长度约 365
  weekStartsOn?: 0 | 1            // 0 = 周日（GitHub 默认），1 = 周一
  cell?: number                  // 单格边长，默认 11
  gap?: number                   // 间距，默认 3
  colorScale?: string[]          // 5 档颜色，默认 GitHub 配色
}

const DEFAULT_COLORS = [
  'var(--gray-3)',
  '#9be9a8',
  '#40c463',
  '#30a14e',
  '#216e39',
]

export function ContributionGrid({
  days,
  weekStartsOn = 0,
  cell = 11,
  gap = 3,
  colorScale = DEFAULT_COLORS,
}: Props) {
  if (days.length === 0) return null

  // 1. 找到包含 days[0] 的那一周的起点（往前推到 weekStartsOn）
  const first = new Date(days[0].date + 'T00:00:00Z')
  const dow = (first.getUTCDay() - weekStartsOn + 7) % 7
  const gridStart = new Date(first.getTime() - dow * 86_400_000)

  // 2. 计算每天的 (col, row)
  const indexed = days.map((d) => {
    const date = new Date(d.date + 'T00:00:00Z')
    const dayIdx = Math.floor((date.getTime() - gridStart.getTime()) / 86_400_000)
    return {
      ...d,
      col: Math.floor(dayIdx / 7),
      row: dayIdx % 7,
    }
  })

  const cols = Math.max(...indexed.map((d) => d.col)) + 1
  const width = cols * (cell + gap) - gap
  const height = 7 * (cell + gap) - gap

  // 3. 颜色分级（按 count 的分位，避免极端值拉低对比度）
  const max = Math.max(1, ...indexed.map((d) => d.count))
  const level = (count: number): number => {
    if (count === 0) return 0
    if (count >= max * 0.75) return 4
    if (count >= max * 0.5) return 3
    if (count >= max * 0.25) return 2
    return 1
  }

  return (
    <svg width={width} height={height} role="img" aria-label="Contribution heatmap">
      {indexed.map((d) => (
        <Tooltip key={d.date} content={`${d.date}: ${d.count} contributions`}>
          <rect
            x={d.col * (cell + gap)}
            y={d.row * (cell + gap)}
            width={cell}
            height={cell}
            rx={2}
            fill={colorScale[level(d.count)]}
          />
        </Tooltip>
      ))}
    </svg>
  )
}
```

**关键点**：

- **按分位分级**而不是固定阈值——一个冷门仓库最高一天 3 个 commit 也能显示出对比度
- 用 `var(--gray-3)` 这种 Radix 主题色让暗色模式自动适配，不要硬编码 `#ebedf0`
- `Tooltip` 是 Radix Themes 的，懒得用别的库

## 6. 集成 A：单仓库 → 项目详情页

```tsx
// app/projects/[slug]/page.tsx 节选
import { Suspense } from 'react'
import { ContributionGrid } from '@/components/github/contribution-grid'
import { fetchRepoActivity } from '@/lib/github/repo-activity'
import { parseRepoUrl } from '@/lib/github/parse'

async function RepoActivity({ url }: { url: string }) {
  const ref = parseRepoUrl(url)
  if (!ref) return null
  const days = await fetchRepoActivity(ref, 365)
  if (days.length === 0) return null
  return <ContributionGrid days={days} />
}

// 在主组件里：
{frontmatter.github && (
  <Suspense fallback={<div style={{ height: 100 }} />}>
    <RepoActivity url={frontmatter.github} />
  </Suspense>
)}
```

> `frontmatter.github` 已经在 [[personal-blog-mdx]] 定义的 `ProjectMeta` 里——直接复用。

## 7. 集成 B：多仓库聚合 → 首页 / about

```tsx
// app/page.tsx 或 app/about/page.tsx
import { fetchUserCalendar } from '@/lib/github/user-contributions'
import { ContributionGrid } from '@/components/github/contribution-grid'

export default async function HomePage() {
  const cal = await fetchUserCalendar('yunstv', 365)
  return (
    <section>
      <h2>过去一年 · {cal.total} 次贡献</h2>
      <ContributionGrid days={cal.days} />
    </section>
  )
}
```

## 8. 缓存与增量重建

| 部署平台 | 推荐策略 |
| - | - |
| Vercel | Server Component fetch 加 `next: { revalidate: 3600 }`，1 小时增量重建对应路由 |
| Cloudflare Pages | 同上 + `export const revalidate = 3600` |
| 纯静态导出 | 构建时拉一次；可加 GitHub Actions cron 触发 redeploy |

**为什么是 1 小时**：

- 个人站访问量小，5000 req/h 的 token 完全用不完
- 贡献墙不是实时数据，1 小时延迟用户无感
- 比"构建时锁死"更新鲜，比"每次请求都拉"更省额度

## 9. 常见坑

1. **REST `stats/commit_activity` 第一次返回 202**：GitHub 后台还在生成统计缓存。
   如果你贪图它的"一次返回 52 周"而用它，必须实现重试逻辑。
   本 skill 不用这个端点正是为了绕开这个坑。

2. **匿名 `/commits` 翻页限速很容易爆**：60 req/h 是 per IP。
   多仓库聚合或者多人访问的网站，**必须**配 token，否则触发 403 后没有友好兜底。

3. **`commit.author.date` 可能为 null**：force-push、rebase 残留的极少数 commit 会丢 author。
   代码里要 `if (!iso) continue`，不要直接 `.toISOString()` 炸掉。

4. **GraphQL `contributionCalendar` 含私有贡献**：默认只统计公开活动；
   想包含私有仓库要在用户的 *Profile settings → Contribution settings → Include private contributions* 打开。
   token scope 不影响这个开关——账号侧设置才是源头。

5. **时区**：`fetchRepoActivity` 里用 UTC 分桶，渲染时也按 UTC——
   不要中间加 `getDate()`（本地时区），跨时区运行（Vercel 不同 region）会少一天或多一天。

6. **私有 / 已删除仓库**：返回 404，不要让整个页面崩。
   `fetchRepoActivity` 里 `res.status === 404` 直接返回空数组，调用方判空跳过渲染。

7. **`weekStartsOn` 影响视觉但不影响数据**：GitHub profile 用周日起始（`0`），
   想本土化改成周一（`1`）也行——但保持和 GitHub 一致更不容易被误读为"我这周没干活"。

8. **不要在客户端组件里 fetch**：会暴露 token、限速也算到用户 IP。
   所有 GitHub API 调用都在 Server Component / Route Handler 里完成。

## 10. 实施顺序

**Step 1 - 基础设施（30 分钟）**
- `lib/github/parse.ts`：URL 解析
- `.env.local` 加 `GITHUB_TOKEN`
- 写一个 throwaway 脚本 `tsx scripts/test-github.ts` 调一次 `/commits` 验证 token 通

**Step 2 - 单仓库 fetcher（30 分钟）**
- `lib/github/repo-activity.ts`
- 用自己的某个仓库测一遍，确认日期分桶正确

**Step 3 - ContributionGrid 组件（45 分钟）**
- `components/github/contribution-grid.tsx`
- 暗色模式跑一遍，确认对比度

**Step 4 - 接入项目详情页（30 分钟）**
- 在 `app/projects/[slug]/page.tsx` 里读 `frontmatter.github`，Suspense 包起来
- 验证：仓库不存在 / 私有仓库都能优雅降级

**Step 5 - 用户聚合 fetcher（30 分钟）**
- `lib/github/user-contributions.ts`
- GraphQL 调通一次，对比 GitHub profile 上的总数

**Step 6 - 接入首页 / about（30 分钟）**
- 在 `app/page.tsx` 或 `app/about/page.tsx` 嵌入 ContributionGrid
- 配 `revalidate = 3600`

**Step 7 - 部署验证**
- Vercel 环境变量配 token
- 构建后访问，看 Network 面板确认 GitHub API 不是客户端调的

## 11. 可选扩展

- **多仓库列表叠加**：用 REST 拉多个仓库的 activity 后按日期合并，跳过 GraphQL。
  适合"我只在自己几个仓库活跃"的场景，避免 token 依赖。
- **Streak 统计**：基于 `days` 数组算连续提交天数，放在标题旁边显示
- **可点击的日期**：点击某天跳转 `https://github.com/{owner}/{repo}/commits/main?since=...&until=...`
- **导出 PNG**：复用主站的 [[text-to-image-tool]] 套路，把 `<ContributionGrid>` 截图为分享卡片
- **多年视图**：把 365 天改成 730 / 1095，纵向叠两行
- **commits / PR / issue 分类**：仅 GraphQL 路径可做，单仓库 REST 拉不到 PR / issue 维度

## 12. 类型定义汇总

```ts
// lib/github/types.ts
export type RepoRef = { owner: string; repo: string }
export type DayBucket = { date: string; count: number } // 'YYYY-MM-DD'
export type UserCalendar = {
  total: number
  days: DayBucket[]
}
```

## 13. 验收清单

- [ ] `pnpm dev` 起服务，访问任一带 `github` 字段的项目详情页，热力图渲染正常
- [ ] 删除 `frontmatter.github` 字段，页面不报错也不留空白
- [ ] 仓库 404 / 私有仓库，组件优雅降级（不显示）
- [ ] 切换暗色模式，灰色格子和绿色色阶都跟随
- [ ] Tooltip 显示日期和当日贡献数
- [ ] 浏览器 DevTools 的 Network 看不到 `api.github.com` 请求——证明在 Server 侧
- [ ] 没有 `GITHUB_TOKEN` 时，单仓库路径仍可工作（匿名），用户聚合路径报清晰错误
- [ ] `pnpm build` 通过，构建期完成所有 fetch；ISR 1 小时后重新拉取
