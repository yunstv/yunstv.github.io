---
name: tool-illustration
description: |
  为 /tools 页面的「图文」tab 设计并落地一张手写 SVG 卡通插图。
  当用户新增工具（在 app/tools/page.tsx 的 TOOLS 数组里加条目，或新建 app/tools/<slug>/page.tsx）
  并希望它在「图文」tab 里有配图时触发。
  产出物：在 components/tools/tool-illustrations.tsx 里追加一个 SVG 组件 + 在 TOOL_ILLUSTRATIONS 注册表里登记 href。
  缺省 fallback：未注册的工具会渲染 <FallbackIllustration />（带 + 号的占位框），不会报错。
---

# Tools 插图生成指南

## 0. 何时触发

- 用户说"给 xx 工具画一张图"、"图文 tab 里加 xx 的插图"、"为新工具补插图"
- 用户在 `app/tools/page.tsx` 的 `TOOLS` 数组里加了新条目，或新建了 `app/tools/<slug>/page.tsx`
- 用户问"这个工具图文模式里怎么显示"——先看 `TOOL_ILLUSTRATIONS` 有没有注册，没注册的话用这个 skill 加

## 1. 目标文件

- **追加 SVG 组件**：[components/tools/tool-illustrations.tsx](../../../components/tools/tool-illustrations.tsx)
- **注册到映射表**：同一文件底部的 `TOOL_ILLUSTRATIONS` Record
- **不要改动**：[components/tools/tools-list.tsx](../../../components/tools/tools-list.tsx) — 它通过 `getToolIllustration(href)` 自动取，加完不需要再动

## 2. 设计约束（必须遵守，保证全站风格一致）

| 项 | 值 | 说明 |
| - | - | - |
| viewBox | `0 0 100 80` | 5:4 横向，渲染时塞进 aspect-5/3 的 accent-a2 背景框 |
| 颜色 | `currentColor` | 必须用 `<IllustrationFrame>` 包裹（它设了 `color: var(--accent-9)`），子元素全部 `stroke="currentColor"` / `fill="currentColor"`。**不要硬编码颜色** —— 主题切换和换 accent 时会跟着变 |
| 主线粗 | `strokeWidth="2"` | 主体轮廓 |
| 细节线粗 | `strokeWidth="1.5"` | 图标内的小细节、辅助形状 |
| 强调线粗 | `strokeWidth="2.5"` | 角标、关键箭头 |
| 填充层次 | `fillOpacity` 0.08 / 0.16 / 0.25 / 0.35 | 越靠后/越上层越深；纯背景框用 0.08 |
| 圆角 | `rx="3"` 主框，`rx="6"` 大圆角 | 别用尖角，太硬 |
| 端点/接头 | `strokeLinecap="round"` `strokeLinejoin="round"` | 所有 path/line 默认带上 |
| 最小细节 | ≥ 3px | 卡片实际尺寸约 160–240px 宽，再小看不清 |

## 3. 设计流程

### Step 1 · 提取语义关键词
读工具的 `name` 和 `desc`，挑出 **1 个核心动作** + **1 个核心对象**。
不要试图把 desc 里所有功能都画出来，挑最有代表性的一个。

**示例**：

| 工具 | 关键词 | 选定隐喻 |
| - | - | - |
| 文本转图片 | "文本" + "图片" + "转" | 左侧带文本行的纸 → 箭头 → 右侧带山+太阳的图 |
| 图片拼接 | "多张" + "拼接" | 三张错位重叠的图片框 |
| 图片裁切 | "选区" + "裁切" | 整张图 + 4 角 L 形角标 + 虚线裁剪框 |

### Step 2 · 构图

100×80 画布的常用版式：

- **左→右流程**（适合"转换"类）：左 36 宽 + 中间箭头 + 右 28 宽
- **横向并列**（适合"多个 / 拼接"类）：3 个 30+ 宽的方块沿 x 轴错位摆放
- **居中叠加**（适合"选区 / 处理"类）：80 宽主体居中 + 上层叠加辅助元素
- **单一聚焦**（兜底）：60 宽居中元素 + 简单装饰

### Step 3 · 复用元件

下面这些"原子"可以直接抄，新插图大概率拼这些就够：

```tsx
// 1. 一张"图片"（带太阳 + 山）
<rect x={X} y={Y} width={W} height={H} rx="3" stroke="currentColor" strokeWidth="2"
      fill="currentColor" fillOpacity="0.08" />
<circle cx={X+8} cy={Y+8} r="2.5" fill="currentColor" /> {/* 太阳 */}
<path d={`M${X+2} ${Y+H-6} L${X+10} ${Y+H-14} L${X+18} ${Y+H-8} L${X+W-8} ${Y+H-14} L${X+W-2} ${Y+H-8} L${X+W-2} ${Y+H-2} L${X+2} ${Y+H-2} Z`}
      fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /> {/* 山 */}

// 2. 一页"文本"
<rect x={X} y={Y} width={W} height={H} rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
<line x1={X+6} y1={Y+12} x2={X+W-6} y2={Y+12} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
{/* 重复多行，y 递增 8，x2 留点变化更像真实文字 */}

// 3. 箭头 →
<path d="M50 40 L62 40 M62 40 L58 36 M62 40 L58 44"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

// 4. 4 个角标（选区）
<path d="M22 30 L22 22 L30 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
<path d="M70 22 L78 22 L78 30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
<path d="M78 52 L78 60 L70 60" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
<path d="M30 60 L22 60 L22 52" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />

// 5. 虚线裁剪框
<rect x={X} y={Y} width={W} height={H} stroke="currentColor" strokeWidth="1.8"
      strokeDasharray="4 3" fill="none" />

// 6. 文档 / 纸张（适合 "文本/笔记/MDX" 类工具）
<rect x={X} y={Y} width={W} height={H} rx="3" stroke="currentColor" strokeWidth="2"
      fill="currentColor" fillOpacity="0.08" />
<path d={`M${X+W-8} ${Y} L${X+W} ${Y+8} L${X+W-8} ${Y+8} Z`} fill="currentColor" fillOpacity="0.2" /> {/* 折角 */}
```

### Step 4 · 写组件

```tsx
function MyNewToolIllustration() {
  return (
    <IllustrationFrame>
      {/* 你的 SVG 元素 */}
    </IllustrationFrame>
  )
}
```

**禁止：**
- ❌ 硬编码颜色（`stroke="#xxxxxx"`、`fill="red"`）
- ❌ 用 `var(--accent-9)` 直接写在属性里（SVG 属性不解析 CSS 变量；统一走 `IllustrationFrame` + `currentColor`）
- ❌ 引入外部 SVG 资源或图片
- ❌ 改 viewBox 尺寸

### Step 5 · 注册

在文件底部的 `TOOL_ILLUSTRATIONS` 对象追加一行：

```tsx
export const TOOL_ILLUSTRATIONS: Record<string, () => ReactNode> = {
  '/tools/text-to-image': TextToImageIllustration,
  '/tools/image-merge': ImageMergeIllustration,
  '/tools/image-crop': ImageCropIllustration,
  '/tools/<new-slug>': MyNewToolIllustration,  // ← 加这行
}
```

key 必须与 `app/tools/page.tsx` 里该工具的 `href` 字符串完全一致。

### Step 6 · 验收

1. `pnpm typecheck` 通过
2. `pnpm dev` 起本地，访问 `/tools`，切到「图文」tab 看新卡片
3. 切换暗色模式（如果站点支持），确认配色还跟随主题（不应该出现写死的颜色）
4. 浏览器开发者工具把根 `:root` 上的 accent token 改个值，确认插图颜色跟着变

## 4. 完整示例：给一个假想的"二维码生成"工具加图

```tsx
// 在 tool-illustrations.tsx 的其它 *Illustration 组件之后追加：

function QrCodeIllustration() {
  return (
    <IllustrationFrame>
      {/* 外框 */}
      <rect x="20" y="10" width="60" height="60" rx="4"
            stroke="currentColor" strokeWidth="2"
            fill="currentColor" fillOpacity="0.08" />

      {/* 三个定位角 */}
      <rect x="26" y="16" width="14" height="14" rx="2"
            stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="30" y="20" width="6" height="6" fill="currentColor" />
      <rect x="60" y="16" width="14" height="14" rx="2"
            stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="64" y="20" width="6" height="6" fill="currentColor" />
      <rect x="26" y="50" width="14" height="14" rx="2"
            stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="30" y="54" width="6" height="6" fill="currentColor" />

      {/* 散点（数据区） */}
      <rect x="46" y="18" width="4" height="4" fill="currentColor" fillOpacity="0.6" />
      <rect x="54" y="22" width="4" height="4" fill="currentColor" fillOpacity="0.6" />
      <rect x="48" y="40" width="4" height="4" fill="currentColor" fillOpacity="0.6" />
      <rect x="56" y="48" width="4" height="4" fill="currentColor" fillOpacity="0.6" />
      <rect x="64" y="56" width="4" height="4" fill="currentColor" fillOpacity="0.6" />
      <rect x="46" y="56" width="4" height="4" fill="currentColor" fillOpacity="0.6" />
    </IllustrationFrame>
  )
}

// 然后在底部追加注册：
//   '/tools/qrcode': QrCodeIllustration,
```

## 5. 常见错误

- **整张图看上去是空的** → 99% 是颜色没用 `currentColor`，或者忘了用 `IllustrationFrame` 包裹
- **暗色模式下看不清** → 用了非 `currentColor` 的硬色；或者 `fillOpacity` 太低（< 0.08）
- **TypeScript 报错 `Type 'string' is not assignable to "ruby"|...`** → 在某处误用了 Radix Themes 的 `color="accent"`；SVG 文件不应该出现 Radix props，只用原生 SVG 元素
- **新工具卡片显示了 + 号占位图** → 忘记在 `TOOL_ILLUSTRATIONS` 里注册 href
- **registry 的 key 写错** → 必须和 `app/tools/page.tsx` 里 `href` 字符串完全相同（含前导 `/`）

## 6. 一句话总结

读工具的 `name + desc` → 抠 1 个核心隐喻 → 拼第 3 节的原子元件 → 写 `XxxIllustration()` 组件包在 `<IllustrationFrame>` 里 → 在 `TOOL_ILLUSTRATIONS` 注册 href → typecheck + 本地预览。
