#!/usr/bin/env node
import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')

// slug → local repo path
const PROJECTS = {
  'unibase-website':           '/Users/zhaolihua/www/work-program/mixlabs-web/workspace/projects/unibase-website',
  'unibase-explorer':          '/Users/zhaolihua/www/work-program/mixlabs-web/workspace/projects/unibase-explorer',
  'bitagent-frontend':         '/Users/zhaolihua/www/work-program/mixlabs-web/workspace/projects/bitagent-frontend',
  'bitagent-home':             '/Users/zhaolihua/www/work-program/mixlabs-web/workspace/projects/bitagent-home',
  'unibase-x402-website':      '/Users/zhaolihua/www/work-program/mixlabs-web/workspace/projects/unbase-x402-website',
  'knowledge-frontend':        '/Users/zhaolihua/www/work-program/mixlabs-web/workspace/projects/knowledge-frontend',
  'react-element-in-viewport': '/Users/zhaolihua/www/private-program/workspace/packages/react-components/element-in-viewport',
}

for (const [slug, repoPath] of Object.entries(PROJECTS)) {
  if (!existsSync(repoPath)) {
    console.warn(`SKIP ${slug}: path missing ${repoPath}`)
    continue
  }
  let raw
  try {
    raw = execSync(`git log --pretty=format:%ad --date=short`, {
      cwd: repoPath,
      encoding: 'utf-8',
      maxBuffer: 32 * 1024 * 1024,
    })
  } catch (e) {
    console.warn(`SKIP ${slug}: git log failed ${e.message}`)
    continue
  }
  const dates = raw.split('\n').filter(Boolean)
  if (dates.length === 0) {
    console.warn(`SKIP ${slug}: no commits`)
    continue
  }
  const buckets = new Map()
  for (const d of dates) buckets.set(d, (buckets.get(d) ?? 0) + 1)
  const sorted = [...buckets.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  const since = sorted[0][0]
  const until = sorted[sorted.length - 1][0]
  const total = dates.length
  const out = {
    total,
    since,
    until,
    buckets: sorted.map(([date, count]) => ({ date, count })),
  }
  const dir = resolve(ROOT, 'public/projects', slug)
  mkdirSync(dir, { recursive: true })
  writeFileSync(resolve(dir, 'activity.json'), JSON.stringify(out))
  console.log(`OK  ${slug}: ${total} commits, ${since} → ${until}, ${sorted.length} active days`)
}
