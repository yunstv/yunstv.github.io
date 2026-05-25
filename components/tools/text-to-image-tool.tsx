'use client'

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  Box,
  Card,
  Dialog,
  Flex,
  Grid,
  IconButton,
  Text,
  TextArea,
  Tooltip,
} from '@radix-ui/themes'
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  Cross2Icon,
  DownloadIcon,
  Pencil2Icon,
} from '@radix-ui/react-icons'
import { toBlob, toPng } from 'html-to-image'
import { CropDialog, blobToCropImage, type CropImage } from './crop-dialog'

const SAMPLE = `把 Claude 在终端里输出的文字粘贴到这里。

下方四个风格卡片是按需渲染的——点开才会生成预览，不会因为粘贴长文本而卡死浏览器。

## 支持的标记
- 段落、列表、加粗都能识别
- **加粗文本**、\`inline code\`
- 多行文本会保留缩进与换行

1. 编号列表也支持
2. 第二项

> 引用块在"便签 / Markdown 风"里会单独排版

\`\`\`
const greet = (name) => \`Hello, \${name}\`
console.log(greet('world'))
\`\`\`
`

type StyleId = 'terminal' | 'codeCard' | 'minimal' | 'note'

const STYLES: { id: StyleId; name: string; hint: string }[] = [
  { id: 'terminal', name: '终端深色风', hint: '黑底等宽，还原 CLI' },
  { id: 'codeCard', name: '代码卡片风', hint: '渐变背景，适合分享' },
  { id: 'minimal', name: '极简白纸', hint: '白底正文，便于存档' },
  { id: 'note', name: '便签 / Markdown 风', hint: '米色便签，渲染 MD' },
]

const HEAVY_THRESHOLD = 30_000

// Use the node's intrinsic content-box size so html-to-image captures the
// full preview even when the modal viewport is narrower or shorter than it.
// Without this, fit-content / overflow can leave the rendered node smaller
// than its real content, and the captured PNG ends up truncated.
const getFullSize = (
  node: HTMLElement,
): { width: number; height: number } => ({
  width: Math.max(node.scrollWidth, node.offsetWidth),
  height: Math.max(node.scrollHeight, node.offsetHeight),
})

// All four styled presets render at a fixed natural width.
const STYLED_PREVIEW_WIDTH = 720

// Browsers cap canvas (and the SVG backing html-to-image) at a max pixel
// dimension. Safari / iOS sit around 8192 px on either axis; beyond that the
// output gets silently cropped. Cap the effective pixel ratio so the worst
// axis stays within the safe range.
const MAX_CANVAS_DIM = 8192
const safePixelRatio = (
  size: { width: number; height: number },
  ideal: number,
): number => {
  const byW = MAX_CANVAS_DIM / Math.max(1, size.width)
  const byH = MAX_CANVAS_DIM / Math.max(1, size.height)
  return Math.max(1, Math.min(ideal, byW, byH))
}

export function TextToImageTool() {
  const [text, setText] = useState(SAMPLE)
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const [cropImage, setCropImage] = useState<CropImage | null>(null)

  // Closes the style preview and forwards the captured PNG into the crop dialog.
  const handleEditInCrop = (image: CropImage) => {
    setOpenIdx(null)
    setCropImage(image)
  }

  const open = openIdx !== null
  const isHeavy = text.length > HEAVY_THRESHOLD

  return (
    <Flex direction="column" gap="4">
      <Card>
        <Flex direction="column" gap="2">
          <Flex justify="between" align="center" wrap="wrap" gap="2">
            <Text size="2" weight="medium">输入</Text>
            <Flex align="center" gap="3">
              <Text size="1" color={isHeavy ? 'amber' : 'gray'}>
                {text.length.toLocaleString()} 字符
                {isHeavy && ' · 文本较长，预览渲染可能稍慢'}
              </Text>
              <Flex gap="2">
                <PlainButton onClick={() => setText('')}>清空</PlainButton>
                <Text size="1" color="gray">·</Text>
                <PlainButton onClick={() => setText(SAMPLE)}>恢复示例</PlainButton>
              </Flex>
            </Flex>
          </Flex>
          <TextArea
            size="2"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="粘贴 Claude 终端输出..."
            spellCheck={false}
            style={{
              fontFamily:
                'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
              height: 'clamp(220px, calc(100vh - 460px), 70vh)',
            }}
          />
        </Flex>
      </Card>

      <Grid columns={{ initial: '2', sm: '4' }} gap="3">
        {STYLES.map((s, i) => (
          <StyleChip
            key={s.id}
            styleId={s.id}
            name={s.name}
            hint={s.hint}
            onClick={() => setOpenIdx(i)}
          />
        ))}
      </Grid>

      <PreviewDialog
        open={open}
        text={text}
        activeIdx={openIdx ?? 0}
        onOpenChange={(v) => setOpenIdx(v ? openIdx : null)}
        onPrev={() =>
          setOpenIdx((i) =>
            i === null ? null : (i + STYLES.length - 1) % STYLES.length,
          )
        }
        onNext={() =>
          setOpenIdx((i) => (i === null ? null : (i + 1) % STYLES.length))
        }
        onEditInCrop={handleEditInCrop}
      />
      <CropDialog
        open={cropImage !== null}
        image={cropImage}
        onOpenChange={(v) => !v && setCropImage(null)}
      />
    </Flex>
  )
}

function PlainButton({
  onClick,
  children,
}: {
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Text size="1" color="gray" asChild>
      <button
        type="button"
        onClick={onClick}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          color: 'inherit',
          cursor: 'pointer',
        }}
      >
        {children}
      </button>
    </Text>
  )
}

function StyleChip({
  styleId,
  name,
  hint,
  onClick,
}: {
  styleId: StyleId
  name: string
  hint: string
  onClick: () => void
}) {
  return (
    <Card
      asChild
      style={{ cursor: 'pointer' }}
    >
      <button
        type="button"
        onClick={onClick}
        style={{
          appearance: 'none',
          background: 'transparent',
          border: 'none',
          textAlign: 'left',
          width: '100%',
          font: 'inherit',
          color: 'inherit',
          padding: 14,
        }}
      >
        <Flex direction="column" gap="2">
          <Box
            style={{
              height: 56,
              borderRadius: 8,
              ...chipPreviewStyle(styleId),
            }}
          />
          <Flex direction="column" gap="1">
            <Text size="2" weight="medium">{name}</Text>
            <Text size="1" color="gray">{hint}</Text>
          </Flex>
        </Flex>
      </button>
    </Card>
  )
}

function chipPreviewStyle(styleId: StyleId): React.CSSProperties {
  switch (styleId) {
    case 'terminal':
      return { background: '#0d1117', border: '1px solid #21262d' }
    case 'codeCard':
      return {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }
    case 'minimal':
      return { background: '#ffffff', border: '1px solid #e5e7eb' }
    case 'note':
      return {
        background: '#fdf6e3',
        border: '1px solid rgba(60,47,26,.15)',
      }
  }
}

function PreviewDialog({
  open,
  text,
  activeIdx,
  onOpenChange,
  onPrev,
  onNext,
  onEditInCrop,
}: {
  open: boolean
  text: string
  activeIdx: number
  onOpenChange: (v: boolean) => void
  onPrev: () => void
  onNext: () => void
  onEditInCrop: (image: CropImage) => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        onPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        onNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onPrev, onNext])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content
        aria-describedby={undefined}
        style={{
          width: '80vw',
          maxWidth: '80vw',
          height: '80vh',
          maxHeight: '80vh',
          padding: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Dialog.Title style={{ display: 'none' }}>
          {open ? STYLES[activeIdx].name : '预览'}
        </Dialog.Title>
        {open && (
          <DialogBody
            text={text}
            activeIdx={activeIdx}
            onPrev={onPrev}
            onNext={onNext}
            onClose={() => onOpenChange(false)}
            onEditInCrop={onEditInCrop}
          />
        )}
      </Dialog.Content>
    </Dialog.Root>
  )
}

function DialogBody({
  text,
  activeIdx,
  onPrev,
  onNext,
  onClose,
  onEditInCrop,
}: {
  text: string
  activeIdx: number
  onPrev: () => void
  onNext: () => void
  onClose: () => void
  onEditInCrop: (image: CropImage) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [contentSize, setContentSize] = useState({ w: 0, h: 0 })
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const deferredText = useDeferredValue(text)
  const active = STYLES[activeIdx]

  useEffect(() => {
    setCopied(false)
    setErr(null)
  }, [activeIdx])

  // Track the styled preview's natural size so the live preview pane can
  // shrink to fit both axes without ever needing a scrollbar.
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const ro = new ResizeObserver(() => {
      setContentSize({ w: node.scrollWidth, h: node.scrollHeight })
    })
    ro.observe(node)
    return () => ro.disconnect()
  }, [])

  // NOTE: The viewport overlay (red box) is no longer driven by React state.
  // LivePreviewPane subscribes to `scrollRef` directly and positions the
  // overlay imperatively via rAF + transform, so scrolling a long preview
  // doesn't pay the cost of re-rendering this dialog every frame.

  // Pin the export width to the natural styled-preview width (720) and let
  // height grow with content. Using scrollWidth instead would inflate the
  // canvas when text fails to wrap inside html-to-image's foreignObject
  // clone, producing the "frame is 720 but text bleeds off the right" PNG.
  const exportSize = (
    node: HTMLElement,
  ): { width: number; height: number } => ({
    width: STYLED_PREVIEW_WIDTH,
    height: Math.max(node.scrollHeight, node.offsetHeight),
  })

  // html-to-image's cloneCSSStyle reads `getComputedStyle`, which resolves the
  // wrapper's `margin: 0 auto` into concrete pixel values (based on whatever
  // the live scroll container's width happens to be) and bakes them onto the
  // clone. Inside the 720-wide foreignObject those pixel margins then push the
  // content sideways and leave a blank strip on one edge of the PNG. Zero the
  // margins on the clone so the export matches the preview exactly.
  const EXPORT_STYLE_OVERRIDE = {
    margin: '0',
    marginLeft: '0',
    marginRight: '0',
    marginTop: '0',
    marginBottom: '0',
  } as const

  const onDownload = useCallback(async () => {
    if (!ref.current || busy) return
    setBusy(true)
    setErr(null)
    try {
      const size = exportSize(ref.current)
      const dataUrl = await toPng(ref.current, {
        pixelRatio: safePixelRatio(size, 2),
        cacheBust: true,
        style: EXPORT_STYLE_OVERRIDE,
        ...size,
      })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `${active.id}-${Date.now()}.png`
      a.click()
    } catch (e) {
      setErr('导出失败')
      console.error(e)
    } finally {
      setBusy(false)
    }
  }, [active.id, busy])

  const onCopy = useCallback(async () => {
    if (!ref.current || busy) return
    setBusy(true)
    setErr(null)
    try {
      const size = exportSize(ref.current)
      const blob = await toBlob(ref.current, {
        pixelRatio: safePixelRatio(size, 2),
        cacheBust: true,
        style: EXPORT_STYLE_OVERRIDE,
        ...size,
      })
      if (!blob) throw new Error('blob is null')
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ])
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (e) {
      setErr('当前浏览器不支持复制图片')
      console.error(e)
    } finally {
      setBusy(false)
    }
  }, [busy])

  const onEditInCropClick = useCallback(async () => {
    if (!ref.current || busy) return
    setBusy(true)
    setErr(null)
    try {
      const size = exportSize(ref.current)
      const blob = await toBlob(ref.current, {
        pixelRatio: safePixelRatio(size, 2),
        cacheBust: true,
        style: EXPORT_STYLE_OVERRIDE,
        ...size,
      })
      if (!blob) throw new Error('blob is null')
      const cropImage = await blobToCropImage(blob)
      onEditInCrop(cropImage)
    } catch (e) {
      setErr('打开裁切失败')
      console.error(e)
    } finally {
      setBusy(false)
    }
  }, [busy, onEditInCrop])

  const isStale = deferredText !== text

  return (
    <>
      <Flex
        align="center"
        justify="between"
        px="4"
        py="3"
        style={{ borderBottom: '1px solid var(--gray-a4)', flexShrink: 0 }}
      >
        <Flex align="center" gap="3">
          <Tooltip content="上一种风格 (←)">
            <IconButton
              size="2"
              variant="soft"
              color="gray"
              onClick={onPrev}
              aria-label="上一种风格"
            >
              <ChevronLeftIcon />
            </IconButton>
          </Tooltip>
          <Flex direction="column">
            <Text size="3" weight="medium">{active.name}</Text>
            <Text size="1" color="gray">
              {activeIdx + 1} / {STYLES.length} · {active.hint}
            </Text>
          </Flex>
          <Tooltip content="下一种风格 (→)">
            <IconButton
              size="2"
              variant="soft"
              color="gray"
              onClick={onNext}
              aria-label="下一种风格"
            >
              <ChevronRightIcon />
            </IconButton>
          </Tooltip>
        </Flex>
        <Flex align="center" gap="2">
          {err && (
            <Text size="1" color="red">
              {err}
            </Text>
          )}
          {isStale && (
            <Text size="1" color="gray">
              渲染中...
            </Text>
          )}
          <Tooltip content="在图片裁切中编辑">
            <IconButton
              size="2"
              variant="soft"
              color="gray"
              onClick={onEditInCropClick}
              disabled={busy}
              aria-label="在图片裁切中编辑"
            >
              <Pencil2Icon />
            </IconButton>
          </Tooltip>
          <Tooltip content={copied ? '已复制到剪贴板' : '复制图片'}>
            <IconButton
              size="2"
              variant="soft"
              color={copied ? 'green' : 'gray'}
              onClick={onCopy}
              disabled={busy}
              aria-label="复制图片"
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip content="下载 PNG">
            <IconButton
              size="2"
              variant="soft"
              color="gray"
              onClick={onDownload}
              disabled={busy}
              aria-label="下载图片"
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip content="关闭 (Esc)">
            <IconButton
              size="2"
              variant="soft"
              color="gray"
              onClick={onClose}
              aria-label="关闭"
            >
              <Cross2Icon />
            </IconButton>
          </Tooltip>
        </Flex>
      </Flex>
      <Box
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        <Box
          ref={scrollRef}
          style={{
            flex: 3,
            padding: 24,
            overflow: 'auto',
            background:
              'repeating-conic-gradient(var(--gray-a3) 0 25%, transparent 0 50%) 0 0 / 16px 16px',
          }}
        >
          {/*
            Block layout with an explicit pixel width matches the cloned DOM
            inside html-to-image's foreignObject 1:1 (flex sizing rules can
            diverge between flex and block contexts and cause subtle width
            drift in the capture). `margin: 0 auto` centers when there's free
            space and collapses to 0 on overflow, so the user can still scroll
            to the true leading edge.
          */}
          <div
            ref={ref}
            style={{ width: STYLED_PREVIEW_WIDTH, margin: '0 auto' }}
          >
            <StyledPreview styleId={active.id} text={deferredText} />
          </div>
        </Box>
        <Box
          style={{
            flex: 1,
            minWidth: 0,
            borderLeft: '1px solid var(--gray-a4)',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            background: '#1a1a1a',
          }}
        >
          <Flex direction="column" gap="1">
            <Text
              size="2"
              weight="medium"
              style={{ color: '#fafafa' }}
            >
              实时预览
            </Text>
            <Text size="1" style={{ color: '#a3a3a3' }}>
              导出即所见 · 缩放至侧栏宽度
            </Text>
          </Flex>
          <LivePreviewPane
            styleId={active.id}
            text={deferredText}
            contentSize={contentSize}
            scrollContainerRef={scrollRef}
            contentRef={ref}
          />
        </Box>
      </Box>
    </>
  )
}

function StyledPreview({ styleId, text }: { styleId: StyleId; text: string }) {
  switch (styleId) {
    case 'terminal':
      return <TerminalStyle text={text} />
    case 'codeCard':
      return <CodeCardStyle text={text} />
    case 'minimal':
      return <MinimalStyle text={text} />
    case 'note':
      return <NoteStyle text={text} />
  }
}

function LivePreviewPane({
  styleId,
  text,
  contentSize,
  scrollContainerRef,
  contentRef,
}: {
  styleId: StyleId
  text: string
  contentSize: { w: number; h: number }
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
}) {
  const paneRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const [paneSize, setPaneSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const node = paneRef.current
    if (!node) return
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setPaneSize({ w: width, h: height })
    })
    ro.observe(node)
    return () => ro.disconnect()
  }, [])

  // Fit the styled preview to BOTH axes of the pane (never upscale, never
  // overflow).
  const zoom =
    paneSize.w > 0 &&
    paneSize.h > 0 &&
    contentSize.w > 0 &&
    contentSize.h > 0
      ? Math.min(
          paneSize.w / contentSize.w,
          paneSize.h / contentSize.h,
          1,
        )
      : 0

  const previewW = contentSize.w * zoom
  const previewH = contentSize.h * zoom
  const previewLeft = (paneSize.w - previewW) / 2
  const previewTop = (paneSize.h - previewH) / 2

  // Imperatively drive the red viewport box. Skipping React state per scroll
  // event means: no DialogBody re-render, no reconciliation cost, and we can
  // ride the compositor by setting transform + width/height directly. rAF
  // collapses multiple scroll events into a single paint-aligned update.
  useEffect(() => {
    const scroll = scrollContainerRef.current
    const content = contentRef.current
    const overlay = overlayRef.current
    if (!scroll || !content || !overlay) return
    if (zoom === 0) {
      overlay.style.display = 'none'
      return
    }

    let rafId: number | null = null

    const apply = () => {
      rafId = null
      const sr = scroll.getBoundingClientRect()
      const cr = content.getBoundingClientRect()
      const left = Math.max(0, sr.left - cr.left)
      const top = Math.max(0, sr.top - cr.top)
      const right = Math.min(cr.width, sr.right - cr.left)
      const bottom = Math.min(cr.height, sr.bottom - cr.top)
      const vw = Math.max(0, right - left)
      const vh = Math.max(0, bottom - top)
      if (vw === 0 || vh === 0) {
        overlay.style.display = 'none'
        return
      }
      overlay.style.display = 'block'
      overlay.style.transform = `translate(${previewLeft + left * zoom}px, ${previewTop + top * zoom}px)`
      overlay.style.width = `${vw * zoom}px`
      overlay.style.height = `${vh * zoom}px`
    }

    const schedule = () => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(apply)
    }

    apply()
    scroll.addEventListener('scroll', schedule, { passive: true })
    const ro = new ResizeObserver(schedule)
    ro.observe(scroll)
    ro.observe(content)

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      scroll.removeEventListener('scroll', schedule)
      ro.disconnect()
    }
  }, [zoom, previewLeft, previewTop, scrollContainerRef, contentRef])

  return (
    <div
      ref={paneRef}
      style={{
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {zoom > 0 && (
        <div
          style={{
            position: 'absolute',
            left: previewLeft,
            top: previewTop,
            width: previewW,
            height: previewH,
          }}
        >
          <div style={{ zoom }}>
            <StyledPreview styleId={styleId} text={text} />
          </div>
        </div>
      )}
      <div
        ref={overlayRef}
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          display: 'none',
          border: '2px solid #ef4444',
          boxShadow: '0 0 0 1px rgba(239, 68, 68, 0.25)',
          boxSizing: 'border-box',
          pointerEvents: 'none',
          willChange: 'transform, width, height',
        }}
      />
    </div>
  )
}

const MONO_STACK =
  'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", "Courier New", monospace'
const SANS_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif'

function TerminalStyle({ text }: { text: string }) {
  return (
    <div
      style={{
        width: 720,
        background: '#0d1117',
        borderRadius: 12,
        boxShadow: '0 12px 32px rgba(0,0,0,.35)',
        overflow: 'hidden',
        fontFamily: MONO_STACK,
        color: '#e6edf3',
        fontSize: 13,
        lineHeight: 1.7,
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '10px 14px',
          background: '#161b22',
          borderBottom: '1px solid #21262d',
          alignItems: 'center',
        }}
      >
        <span style={dotStyle('#ff5f57')} />
        <span style={dotStyle('#febc2e')} />
        <span style={dotStyle('#28c840')} />
        <span
          style={{
            marginLeft: 12,
            color: '#7d8590',
            fontSize: 11,
            fontFamily: MONO_STACK,
          }}
        >
          ~ claude — 80×24
        </span>
      </div>
      <pre
        style={{
          margin: 0,
          padding: '18px 22px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
          background: 'transparent',
          fontFamily: MONO_STACK,
        }}
      >
        {text}
      </pre>
    </div>
  )
}

function CodeCardStyle({ text }: { text: string }) {
  return (
    <div
      style={{
        width: 720,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 32,
        borderRadius: 14,
      }}
    >
      <div
        style={{
          background: '#1e1e2e',
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,.3)',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 6,
            padding: '10px 14px',
            background: '#181825',
          }}
        >
          <span style={dotStyle('#f38ba8')} />
          <span style={dotStyle('#f9e2af')} />
          <span style={dotStyle('#a6e3a1')} />
        </div>
        <pre
          style={{
            margin: 0,
            padding: '20px 22px',
            color: '#cdd6f4',
            fontFamily: MONO_STACK,
            fontSize: 13,
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
            background: 'transparent',
          }}
        >
          {text}
        </pre>
      </div>
    </div>
  )
}

function MinimalStyle({ text }: { text: string }) {
  return (
    <div
      style={{
        width: 720,
        background: '#ffffff',
        color: '#111111',
        padding: '44px 48px',
        borderRadius: 4,
        border: '1px solid #e5e7eb',
        fontFamily: SANS_STACK,
        fontSize: 15,
        lineHeight: 1.8,
      }}
    >
      <div
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
        }}
      >
        {text}
      </div>
    </div>
  )
}

function NoteStyle({ text }: { text: string }) {
  return (
    <div
      style={{
        width: 720,
        background: '#fdf6e3',
        color: '#3c2f1a',
        padding: '40px 44px',
        borderRadius: 10,
        boxShadow: '0 6px 18px rgba(60,47,26,.12)',
        border: '1px solid rgba(60,47,26,.08)',
        fontFamily: SANS_STACK,
        fontSize: 15,
        lineHeight: 1.85,
      }}
    >
      <MarkdownRender text={text} />
    </div>
  )
}

function dotStyle(color: string): React.CSSProperties {
  return {
    display: 'inline-block',
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: color,
  }
}

function MarkdownRender({ text }: { text: string }) {
  const lines = text.split('\n')
  const out: ReactNode[] = []
  let codeBuf: string[] | null = null
  let ulBuf: ReactNode[] | null = null
  let olBuf: ReactNode[] | null = null

  const flushUl = () => {
    if (ulBuf) {
      out.push(
        <ul
          key={`ul-${out.length}`}
          style={{ paddingLeft: 22, margin: '6px 0' }}
        >
          {ulBuf}
        </ul>,
      )
      ulBuf = null
    }
  }
  const flushOl = () => {
    if (olBuf) {
      out.push(
        <ol
          key={`ol-${out.length}`}
          style={{ paddingLeft: 22, margin: '6px 0' }}
        >
          {olBuf}
        </ol>,
      )
      olBuf = null
    }
  }
  const flushLists = () => {
    flushUl()
    flushOl()
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('```')) {
      if (codeBuf === null) {
        flushLists()
        codeBuf = []
      } else {
        out.push(
          <pre
            key={`code-${out.length}`}
            style={{
              background: 'rgba(60,47,26,.08)',
              padding: '12px 14px',
              borderRadius: 6,
              fontFamily: MONO_STACK,
              fontSize: 13,
              margin: '10px 0',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: 1.6,
            }}
          >
            {codeBuf.join('\n')}
          </pre>,
        )
        codeBuf = null
      }
      continue
    }
    if (codeBuf !== null) {
      codeBuf.push(line)
      continue
    }

    const hm = line.match(/^(#{1,3})\s+(.+)$/)
    if (hm) {
      flushLists()
      const lvl = hm[1].length
      const size = lvl === 1 ? 24 : lvl === 2 ? 19 : 17
      out.push(
        <div
          key={`h-${i}`}
          style={{ fontSize: size, fontWeight: 700, margin: '14px 0 6px' }}
        >
          {renderInline(hm[2])}
        </div>,
      )
      continue
    }

    const ulm = line.match(/^\s*[-*]\s+(.+)$/)
    if (ulm) {
      flushOl()
      if (!ulBuf) ulBuf = []
      ulBuf.push(<li key={`li-${i}`}>{renderInline(ulm[1])}</li>)
      continue
    }
    const olm = line.match(/^\s*\d+\.\s+(.+)$/)
    if (olm) {
      flushUl()
      if (!olBuf) olBuf = []
      olBuf.push(<li key={`li-${i}`}>{renderInline(olm[1])}</li>)
      continue
    }

    if (/^>\s?/.test(line)) {
      flushLists()
      out.push(
        <blockquote
          key={`bq-${i}`}
          style={{
            borderLeft: '3px solid rgba(60,47,26,.3)',
            paddingLeft: 12,
            color: 'rgba(60,47,26,.75)',
            margin: '8px 0',
            fontStyle: 'italic',
          }}
        >
          {renderInline(line.replace(/^>\s?/, ''))}
        </blockquote>,
      )
      continue
    }

    if (line.trim() === '') {
      flushLists()
      out.push(<div key={`sp-${i}`} style={{ height: 8 }} />)
      continue
    }

    flushLists()
    out.push(<div key={`p-${i}`}>{renderInline(line)}</div>)
  }
  flushLists()
  if (codeBuf) {
    out.push(
      <pre
        key="code-final"
        style={{
          background: 'rgba(60,47,26,.08)',
          padding: '12px 14px',
          borderRadius: 6,
          fontFamily: MONO_STACK,
          fontSize: 13,
          margin: '10px 0',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          lineHeight: 1.6,
        }}
      >
        {codeBuf.join('\n')}
      </pre>,
    )
  }
  return <>{out}</>
}

function renderInline(line: string): ReactNode {
  const parts: ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g
  let last = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) parts.push(line.slice(last, m.index))
    const token = m[0]
    if (token.startsWith('**')) {
      parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>)
    } else {
      parts.push(
        <code
          key={key++}
          style={{
            background: 'rgba(60,47,26,.08)',
            padding: '1px 6px',
            borderRadius: 4,
            fontFamily: MONO_STACK,
            fontSize: '0.92em',
          }}
        >
          {token.slice(1, -1)}
        </code>,
      )
    }
    last = m.index + token.length
  }
  if (last < line.length) parts.push(line.slice(last))
  return <>{parts}</>
}
