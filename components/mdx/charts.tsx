import type { ReactNode } from 'react'

/**
 * 极简 SVG 图表组件，供 MDX 文章内嵌（在 components/mdx/mdx-components.tsx 注册）。
 *
 * 设计约定（站点 dataviz 规范）：
 * - 横向条形，条厚 ≤ 24px，数据端 4px 圆角、基线端直角
 * - 每根条的数值直接标注在条尾，因此不画刻度轴，网格线只有一条基线
 * - 文字一律用灰色墨阶（--gray-11/12），系列色只出现在标记上
 * - hover / 键盘聚焦：<title> 原生提示 + 标记轻微变淡（样式在 globals.css）
 * - 版本对比统一配色：TS 6 = var(--gray-9)，TS 7 = var(--accent-9)，浅深色自动适配
 * - 阶段序数色阶 --chart-phase-{1,2,3} 定义在 globals.css（浅深色各一组，经校验器验证）
 */

const W = 680
const LABEL_RIGHT = 168 // 行标签列右缘
const PLOT_X = 180 // 条形起点（基线位置）
const PLOT_W = 396 // 条形最大长度
const FONT = 'var(--font-sans, system-ui, sans-serif)'

const INK = 'var(--gray-12)'
const INK_2 = 'var(--gray-11)'
const BASELINE = 'var(--gray-6)'
const OLD_COLOR = 'var(--gray-9)' // TS 6 / 背景对照
const NEW_COLOR = 'var(--accent-9)' // TS 7 / 强调

/** 数据端右侧 4px 圆角、基线端直角的条形路径 */
function barPath(x: number, y: number, w: number, h: number, r = 4): string {
  const rr = Math.max(0, Math.min(r, w, h / 2))
  const x2 = x + w
  return [
    `M${x},${y}`,
    `H${x2 - rr}`,
    `A${rr},${rr} 0 0 1 ${x2},${y + rr}`,
    `V${y + h - rr}`,
    `A${rr},${rr} 0 0 1 ${x2 - rr},${y + h}`,
    `H${x}`,
    'Z',
  ].join(' ')
}

function ChartFrame({
  height,
  caption,
  children,
}: {
  height: number
  caption?: string
  children: ReactNode
}) {
  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      style={{ width: '100%', height: 'auto', display: 'block', margin: '1rem 0' }}
      role="img"
      aria-label={caption}
    >
      {children}
    </svg>
  )
}

/** 单根条的 hover / 键盘焦点包裹层：原生 <title> 提示 + 轻微变淡 */
function Mark({ title, children }: { title: string; children: ReactNode }) {
  return (
    <g className="mdx-chart-mark" tabIndex={0} role="img" aria-label={title}>
      <title>{title}</title>
      {children}
    </g>
  )
}

function LegendSwatch({ x, color, label }: { x: number; color: string; label: string }) {
  return (
    <g>
      <rect x={x} y={10} width={12} height={12} rx={3} fill={color} />
      <text x={x + 17} y={20} fontSize={13} fill={INK_2} fontFamily={FONT}>
        {label}
      </text>
    </g>
  )
}

export interface BenchGroup {
  label: string
  /** 旧版（灰色，背景对照）数值 */
  v6: number
  /** 新版（强调色）数值 */
  v7: number
}

/** 分组横向条形图：每个分组两根条（旧版 / 新版），如冷启动与增量检查耗时对比 */
export function BenchBarChart({
  groups,
  unit = 's',
  decimals = 2,
  seriesNames = ['TypeScript 6.0.3（JS 编译器）', 'TypeScript 7.0.2（Go 原生）'],
  caption,
}: {
  groups: BenchGroup[]
  unit?: string
  decimals?: number
  seriesNames?: [string, string]
  caption?: string
}) {
  const max = Math.max(...groups.flatMap((g) => [g.v6, g.v7]))
  const fmt = (v: number) => `${v.toFixed(decimals)}${unit}`

  const barH = 16
  const pairGap = 7
  const groupGap = 34
  const legendH = 32
  const pairH = barH * 2 + pairGap
  const totalH = legendH + groups.length * pairH + (groups.length - 1) * groupGap + 8

  return (
    <ChartFrame height={totalH} caption={caption}>
      <LegendSwatch x={PLOT_X} color={OLD_COLOR} label={seriesNames[0]} />
      <LegendSwatch x={PLOT_X + 250} color={NEW_COLOR} label={seriesNames[1]} />
      {groups.map((g, i) => {
        const top = legendH + i * (pairH + groupGap)
        const center = top + pairH / 2 + 4
        const w6 = Math.max((g.v6 / max) * PLOT_W, 2)
        const w7 = Math.max((g.v7 / max) * PLOT_W, 2)
        return (
          <g key={g.label}>
            <text x={LABEL_RIGHT} y={center} textAnchor="end" fontSize={13} fill={INK_2} fontFamily={FONT}>
              {g.label}
            </text>
            <Mark title={`${seriesNames[0]} · ${g.label}：${fmt(g.v6)}`}>
              <path d={barPath(PLOT_X, top, w6, barH)} fill={OLD_COLOR} />
            </Mark>
            <text
              x={PLOT_X + w6 + 8}
              y={top + barH / 2 + 4}
              fontSize={13}
              fill={INK}
              fontWeight={600}
              fontFamily={FONT}
            >
              {fmt(g.v6)}
            </text>
            <Mark title={`${seriesNames[1]} · ${g.label}：${fmt(g.v7)}`}>
              <path d={barPath(PLOT_X, top + barH + pairGap, w7, barH)} fill={NEW_COLOR} />
            </Mark>
            <text
              x={PLOT_X + w7 + 8}
              y={top + barH + pairGap + barH / 2 + 4}
              fontSize={13}
              fill={INK}
              fontWeight={600}
              fontFamily={FONT}
            >
              {fmt(g.v7)}
            </text>
          </g>
        )
      })}
      <line
        x1={PLOT_X}
        y1={legendH}
        x2={PLOT_X}
        y2={totalH - 8}
        stroke={BASELINE}
        strokeWidth={1}
        shapeRendering="crispEdges"
      />
    </ChartFrame>
  )
}

/** 堆叠横向条形图：每行一根条、按阶段分段（序数色阶），如编译阶段耗时分解 */
export function PhaseStackChart({
  rows,
  segments,
  unit = 's',
  decimals = 2,
  caption,
}: {
  rows: { label: string; values: number[] }[]
  segments: { name: string }[]
  unit?: string
  decimals?: number
  caption?: string
}) {
  const colors = [
    'var(--chart-phase-1)',
    'var(--chart-phase-2)',
    'var(--chart-phase-3)',
  ]
  // 段内直接标注的墨色按各色阶明度选定（浅填配深墨、深填配白墨），随模式切换
  const inks = [
    'var(--chart-phase-1-ink)',
    'var(--chart-phase-2-ink)',
    'var(--chart-phase-3-ink)',
  ]
  const fmt = (v: number) => `${v.toFixed(decimals)}${unit}`

  const totals = rows.map((r) => r.values.reduce((a, b) => a + b, 0))
  const max = Math.max(...totals)
  const barH = 24
  const rowGap = 46
  const legendH = 32
  const gap = 2 // 段与段之间的表面留缝
  const minLabelW = 44 // 段内标注所需最小宽度，放不下就交给图例 + 数据表
  const totalH = legendH + rows.length * (barH + rowGap) + 8

  return (
    <ChartFrame height={totalH} caption={caption}>
      {segments.map((s, i) => (
        <LegendSwatch key={s.name} x={PLOT_X + i * 110} color={colors[i]} label={s.name} />
      ))}
      {rows.map((row, ri) => {
        const top = legendH + ri * (barH + rowGap)
        let cx = PLOT_X
        return (
          <g key={row.label}>
            <text
              x={LABEL_RIGHT}
              y={top + barH / 2 + 4}
              textAnchor="end"
              fontSize={13}
              fill={INK_2}
              fontFamily={FONT}
            >
              {row.label}
            </text>
            {row.values.map((v, si) => {
              const w = Math.max((v / max) * PLOT_W, 2)
              const x = cx
              const isLast = si === row.values.length - 1
              cx += w + (isLast ? 0 : gap)
              const showLabel = w >= minLabelW
              return (
                <Mark key={si} title={`${segments[si].name}：${fmt(v)}`}>
                  {isLast ? (
                    <path d={barPath(x, top, w, barH)} fill={colors[si]} />
                  ) : (
                    <rect x={x} y={top} width={w} height={barH} fill={colors[si]} />
                  )}
                  {showLabel && (
                    <text
                      x={x + w / 2}
                      y={top + barH / 2 + 4}
                      textAnchor="middle"
                      fontSize={12.5}
                      fill={inks[si]}
                      fontFamily={FONT}
                    >
                      {fmt(v)}
                    </text>
                  )}
                </Mark>
              )
            })}
            <text
              x={cx + 8}
              y={top + barH / 2 + 4}
              fontSize={13}
              fill={INK}
              fontWeight={600}
              fontFamily={FONT}
            >
              Σ {fmt(totals[ri])}
            </text>
          </g>
        )
      })}
      <line
        x1={PLOT_X}
        y1={legendH}
        x2={PLOT_X}
        y2={totalH - 8}
        stroke={BASELINE}
        strokeWidth={1}
        shapeRendering="crispEdges"
      />
    </ChartFrame>
  )
}

/** 强调式横向条形图：单一度量、逐项一条，highlight 项用强调色、其余灰色 */
export function SpeedupChart({
  items,
  unit = '×',
  decimals = 1,
  caption,
}: {
  items: { label: string; value: number; highlight?: boolean }[]
  unit?: string
  decimals?: number
  caption?: string
}) {
  const max = Math.max(...items.map((it) => it.value))
  const fmt = (v: number) => `${v.toFixed(decimals)}${unit}`
  const barH = 16
  const rowGap = 14
  const totalH = 8 + items.length * (barH + rowGap) + 8

  return (
    <ChartFrame height={totalH} caption={caption}>
      {items.map((it, i) => {
        const top = 8 + i * (barH + rowGap)
        const w = Math.max((it.value / max) * PLOT_W, 2)
        return (
          <g key={it.label}>
            <text
              x={LABEL_RIGHT}
              y={top + barH / 2 + 4}
              textAnchor="end"
              fontSize={13}
              fill={INK_2}
              fontFamily={FONT}
            >
              {it.label}
            </text>
            <Mark title={`${it.label}：${fmt(it.value)}`}>
              <path
                d={barPath(PLOT_X, top, w, barH)}
                fill={it.highlight ? NEW_COLOR : OLD_COLOR}
              />
            </Mark>
            <text
              x={PLOT_X + w + 8}
              y={top + barH / 2 + 4}
              fontSize={13}
              fill={INK}
              fontWeight={600}
              fontFamily={FONT}
            >
              {fmt(it.value)}
            </text>
          </g>
        )
      })}
      <line
        x1={PLOT_X}
        y1={8}
        x2={PLOT_X}
        y2={totalH - 8}
        stroke={BASELINE}
        strokeWidth={1}
        shapeRendering="crispEdges"
      />
    </ChartFrame>
  )
}
