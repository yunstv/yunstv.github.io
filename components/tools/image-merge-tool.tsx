'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import {
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Grid,
  IconButton,
  Text,
  Tooltip,
} from '@radix-ui/themes'
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  Cross2Icon,
  DownloadIcon,
  ImageIcon,
  ReloadIcon,
} from '@radix-ui/react-icons'
import { CropDialog, type CropImage } from './crop-dialog'

type ImageItem = {
  id: string
  dataUrl: string
  width: number
  height: number
  // Snapshot of the pasted/picked image kept so the user can revert any
  // crop performed via the cross-tool CropDialog flow.
  original?: { dataUrl: string; width: number; height: number }
}

type CropTarget = { id: string; image: CropImage }

type StyleId = 'hTight' | 'hGap' | 'vTight' | 'vGap'

const STYLES: { id: StyleId; name: string; hint: string }[] = [
  { id: 'hTight', name: '横向紧凑', hint: '一字排开 · 无缝衔接' },
  { id: 'hGap', name: '横向间距', hint: '一字排开 · 等距留白' },
  { id: 'vTight', name: '纵向紧凑', hint: '上下堆叠 · 无缝衔接' },
  { id: 'vGap', name: '纵向间距', hint: '上下堆叠 · 等距留白' },
]

const GAP_PX = 16
// Cap the cross-axis so we don't blow up the canvas with 4K-plus inputs
const MAX_CROSS_AXIS = 4096

export function ImageMergeTool() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const [focused, setFocused] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)
  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pasteAreaRef = useRef<HTMLDivElement>(null)

  const addImages = useCallback(async (files: File[]) => {
    const valid = files.filter((f) => f.type.startsWith('image/'))
    if (valid.length === 0) return
    const loaded = await Promise.all(valid.map(loadFileAsImageItem))
    setImages((prev) => [...prev, ...loaded])
  }, [])

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLDivElement>) => {
      const items = e.clipboardData?.items
      if (!items) return
      const files: File[] = []
      for (const item of Array.from(items)) {
        if (!item.type.startsWith('image/')) continue
        const file = item.getAsFile()
        if (file) files.push(file)
      }
      if (files.length === 0) return
      e.preventDefault()
      void addImages(files)
    },
    [addImages],
  )

  const handleFiles = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : []
      void addImages(files)
      e.target.value = ''
    },
    [addImages],
  )

  const handleRemove = (id: string) => {
    setImages((prev) => prev.filter((p) => p.id !== id))
  }

  const handleOpenCrop = (img: ImageItem) => {
    setCropTarget({
      id: img.id,
      image: {
        dataUrl: img.dataUrl,
        width: img.width,
        height: img.height,
      },
    })
  }

  const handleConfirmCrop = (result: CropImage) => {
    if (!cropTarget) return
    const targetId = cropTarget.id
    setImages((prev) =>
      prev.map((p) => {
        if (p.id !== targetId) return p
        // Capture the very first paste as `original` so multiple successive
        // crops still revert to the source, not to a previous crop.
        const original = p.original ?? {
          dataUrl: p.dataUrl,
          width: p.width,
          height: p.height,
        }
        return {
          ...p,
          dataUrl: result.dataUrl,
          width: result.width,
          height: result.height,
          original,
        }
      }),
    )
  }

  const handleRestore = (id: string) => {
    setImages((prev) =>
      prev.map((p) => {
        if (p.id !== id || !p.original) return p
        return {
          ...p,
          dataUrl: p.original.dataUrl,
          width: p.original.width,
          height: p.original.height,
          original: undefined,
        }
      }),
    )
  }

  const handleClear = () => setImages([])

  const handlePickFiles = () => fileInputRef.current?.click()

  const handleAreaClick = () => pasteAreaRef.current?.focus()

  const handleAreaKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Allow Enter / Space to open the file picker as a non-paste fallback
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handlePickFiles()
    }
  }

  const handleDragStart = (e: DragEvent<HTMLDivElement>, idx: number) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(idx))
    setDragIdx(idx)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>, idx: number) => {
    if (dragIdx === null) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (overIdx !== idx) setOverIdx(idx)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>, target: number) => {
    e.preventDefault()
    if (dragIdx !== null && dragIdx !== target) {
      setImages((prev) => moveItem(prev, dragIdx, target))
    }
    setDragIdx(null)
    setOverIdx(null)
  }

  const handleDragEnd = () => {
    setDragIdx(null)
    setOverIdx(null)
  }

  const open = openIdx !== null
  const totalBytes = images.reduce((acc, i) => acc + i.dataUrl.length, 0)
  const heavy = totalBytes > 20 * 1024 * 1024

  return (
    <Flex direction="column" gap="4">
      <Card>
        <Flex direction="column" gap="2">
          <Flex justify="between" align="center" wrap="wrap" gap="2">
            <Text size="2" weight="medium">图片输入</Text>
            <Flex align="center" gap="3" wrap="wrap">
              <Text size="1" color={heavy ? 'amber' : 'gray'}>
                {images.length} 张
                {totalBytes > 0 && ` · 约 ${formatBytes(totalBytes)}`}
                {heavy && ' · 数据量较大，导出可能稍慢'}
              </Text>
              <Button
                size="1"
                variant="soft"
                color="gray"
                onClick={handlePickFiles}
              >
                <ImageIcon /> 从文件选择
              </Button>
              {images.length > 0 && (
                <PlainButton onClick={handleClear}>清空</PlainButton>
              )}
            </Flex>
          </Flex>

          <div
            ref={pasteAreaRef}
            tabIndex={0}
            role="region"
            aria-label="图片粘贴区，按 Cmd+V 或 Ctrl+V 粘贴图片"
            onPaste={handlePaste}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onClick={handleAreaClick}
            onKeyDown={handleAreaKeyDown}
            style={{
              minHeight: 'clamp(220px, calc(100vh - 460px), 70vh)',
              borderRadius: 10,
              border: focused
                ? '2px solid var(--accent-9)'
                : '2px dashed var(--gray-a6)',
              padding: 16,
              outline: 'none',
              transition: 'border-color 120ms, background 120ms',
              cursor: images.length === 0 ? 'pointer' : 'default',
              background: focused ? 'var(--accent-a2)' : 'transparent',
            }}
          >
            {images.length === 0 ? (
              <EmptyHint focused={focused} />
            ) : (
              <Flex gap="3" wrap="wrap" role="list">
                {images.map((img, idx) => (
                  <ThumbCard
                    key={img.id}
                    img={img}
                    idx={idx}
                    isDragging={dragIdx === idx}
                    isOver={overIdx === idx && dragIdx !== idx}
                    onRemove={() => handleRemove(img.id)}
                    onOpenCrop={() => handleOpenCrop(img)}
                    onRestore={() => handleRestore(img.id)}
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </Flex>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={handleFiles}
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
            disabled={images.length === 0}
            onClick={() => setOpenIdx(i)}
          />
        ))}
      </Grid>

      <PreviewDialog
        open={open}
        images={images}
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
      />

      <CropDialog
        open={cropTarget !== null}
        image={cropTarget?.image ?? null}
        onOpenChange={(v) => !v && setCropTarget(null)}
        onConfirm={handleConfirmCrop}
        confirmTooltip="确认裁切并替换原图"
      />
    </Flex>
  )
}

const EmptyHint = ({ focused }: { focused: boolean }) => (
  <Flex
    align="center"
    justify="center"
    direction="column"
    gap="2"
    style={{ height: '100%', minHeight: 200, color: 'var(--gray-10)' }}
  >
    <ImageIcon width={32} height={32} />
    <Text size="3" color="gray">
      {focused ? '已就绪，按 ⌘V / Ctrl+V 粘贴图片' : '点击此处，然后粘贴图片'}
    </Text>
    <Text size="1" color="gray">
      支持多次粘贴 · 小图可拖拽排序 · 回车 / 空格也可打开文件选择
    </Text>
  </Flex>
)

const PlainButton = ({
  onClick,
  children,
}: {
  onClick: () => void
  children: ReactNode
}) => (
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

type ThumbCardProps = {
  img: ImageItem
  idx: number
  isDragging: boolean
  isOver: boolean
  onRemove: () => void
  onOpenCrop: () => void
  onRestore: () => void
  onDragStart: (e: DragEvent<HTMLDivElement>) => void
  onDragOver: (e: DragEvent<HTMLDivElement>) => void
  onDrop: (e: DragEvent<HTMLDivElement>) => void
  onDragEnd: () => void
}

const ThumbCard = ({
  img,
  idx,
  isDragging,
  isOver,
  onRemove,
  onOpenCrop,
  onRestore,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: ThumbCardProps) => {
  const [hovered, setHovered] = useState(false)
  const isModified = !!img.original
  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRemove()
  }
  const handleRestoreClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRestore()
  }
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={onOpenCrop}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="listitem"
      aria-label={`第 ${idx + 1} 张图，${img.width}×${img.height}${isModified ? '，已裁切' : ''}，点击编辑、拖动重排`}
      title="单击编辑 · 拖动排序"
      style={{
        position: 'relative',
        width: 104,
        height: 104,
        borderRadius: 8,
        overflow: 'hidden',
        opacity: isDragging ? 0.35 : 1,
        outline: isOver
          ? '2px solid var(--accent-9)'
          : isModified
            ? '1.5px solid var(--accent-a8)'
            : '1px solid var(--gray-a5)',
        outlineOffset: isOver ? 2 : 0,
        cursor: 'pointer',
        background: 'var(--gray-a3)',
        transition: 'opacity 120ms, outline-offset 120ms',
        flexShrink: 0,
      }}
    >
      <img
        src={img.dataUrl}
        alt=""
        draggable={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          pointerEvents: 'none',
        }}
      />
      <span
        style={{
          position: 'absolute',
          top: 4,
          left: 4,
          background: isModified
            ? 'var(--accent-9)'
            : 'rgba(0,0,0,.6)',
          color: 'white',
          padding: '1px 6px',
          borderRadius: 4,
          fontSize: 11,
          fontFamily: 'ui-monospace, monospace',
          lineHeight: 1.4,
        }}
      >
        {idx + 1}
        {isModified && ' ✎'}
      </span>
      <IconButton
        size="1"
        variant="solid"
        color="red"
        onClick={handleRemoveClick}
        aria-label={`移除第 ${idx + 1} 张图`}
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          width: 20,
          height: 20,
          minWidth: 20,
        }}
      >
        <Cross2Icon />
      </IconButton>
      {isModified && hovered && (
        <Tooltip content="复原到粘贴时的原图">
          <IconButton
            size="1"
            variant="solid"
            color="blue"
            onClick={handleRestoreClick}
            aria-label={`复原第 ${idx + 1} 张图`}
            style={{
              position: 'absolute',
              bottom: 4,
              right: 4,
              width: 20,
              height: 20,
              minWidth: 20,
            }}
          >
            <ReloadIcon />
          </IconButton>
        </Tooltip>
      )}
    </div>
  )
}

type StyleChipProps = {
  styleId: StyleId
  name: string
  hint: string
  disabled: boolean
  onClick: () => void
}

const StyleChip = ({
  styleId,
  name,
  hint,
  disabled,
  onClick,
}: StyleChipProps) => (
  <Card
    asChild
    style={{
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    }}
  >
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${name}风格预览，${hint}${disabled ? '，请先添加图片' : ''}`}
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
            background: 'var(--gray-a3)',
            padding: 6,
          }}
        >
          <ChipPreview styleId={styleId} />
        </Box>
        <Flex direction="column" gap="1">
          <Text size="2" weight="medium">{name}</Text>
          <Text size="1" color="gray">{hint}</Text>
        </Flex>
      </Flex>
    </button>
  </Card>
)

const CHIP_COLORS = ['#60a5fa', '#a78bfa', '#f472b6']

const ChipPreview = ({ styleId }: { styleId: StyleId }) => {
  if (styleId === 'hTight') {
    return (
      <div
        style={{
          display: 'flex',
          height: '100%',
          gap: 0,
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        {CHIP_COLORS.map((c, i) => (
          <div key={i} style={{ background: c, flex: 1 }} />
        ))}
      </div>
    )
  }
  if (styleId === 'hGap') {
    return (
      <div style={{ display: 'flex', height: '100%', gap: 4 }}>
        {CHIP_COLORS.map((c, i) => (
          <div key={i} style={{ background: c, flex: 1, borderRadius: 3 }} />
        ))}
      </div>
    )
  }
  if (styleId === 'vTight') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          gap: 0,
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        {CHIP_COLORS.map((c, i) => (
          <div key={i} style={{ background: c, flex: 1 }} />
        ))}
      </div>
    )
  }
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        gap: 3,
      }}
    >
      {CHIP_COLORS.map((c, i) => (
        <div key={i} style={{ background: c, flex: 1, borderRadius: 3 }} />
      ))}
    </div>
  )
}

type PreviewDialogProps = {
  open: boolean
  images: ImageItem[]
  activeIdx: number
  onOpenChange: (v: boolean) => void
  onPrev: () => void
  onNext: () => void
}

const PreviewDialog = ({
  open,
  images,
  activeIdx,
  onOpenChange,
  onPrev,
  onNext,
}: PreviewDialogProps) => {
  useEffect(() => {
    if (!open) return
    const onKey = (e: globalThis.KeyboardEvent) => {
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
            images={images}
            activeIdx={activeIdx}
            onPrev={onPrev}
            onNext={onNext}
            onClose={() => onOpenChange(false)}
          />
        )}
      </Dialog.Content>
    </Dialog.Root>
  )
}

type DialogBodyProps = {
  images: ImageItem[]
  activeIdx: number
  onPrev: () => void
  onNext: () => void
  onClose: () => void
}

const DialogBody = ({
  images,
  activeIdx,
  onPrev,
  onNext,
  onClose,
}: DialogBodyProps) => {
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const active = STYLES[activeIdx]
  const layout = useMemo(
    () => computeLayout(images, active.id),
    [images, active.id],
  )

  useEffect(() => {
    setCopied(false)
    setErr(null)
  }, [activeIdx])

  const handleDownload = useCallback(async () => {
    if (busy || images.length === 0) return
    setBusy(true)
    setErr(null)
    try {
      const blob = await renderLayoutToBlob(images, layout)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${active.id}-${Date.now()}.png`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setErr('导出失败')
      console.error(e)
    } finally {
      setBusy(false)
    }
  }, [active.id, busy, images, layout])

  const handleCopy = useCallback(async () => {
    if (busy || images.length === 0) return
    setBusy(true)
    setErr(null)
    try {
      const blob = await renderLayoutToBlob(images, layout)
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
  }, [busy, images, layout])

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
              {activeIdx + 1} / {STYLES.length} · {active.hint} · {images.length} 张
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
          <Tooltip content={copied ? '已复制到剪贴板' : '复制图片'}>
            <IconButton
              size="2"
              variant="soft"
              color={copied ? 'green' : 'gray'}
              onClick={handleCopy}
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
              onClick={handleDownload}
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
          overflow: 'auto',
          padding: 24,
          background:
            'repeating-conic-gradient(var(--gray-a3) 0 25%, transparent 0 50%) 0 0 / 16px 16px',
        }}
      >
        <div style={{ width: 'max-content', margin: '0 auto' }}>
          <LayoutRender layout={layout} images={images} />
        </div>
      </Box>
    </>
  )
}

const LayoutRender = ({
  layout,
  images,
}: {
  layout: LayoutResult
  images: ImageItem[]
}) => {
  if (images.length === 0 || layout.canvasWidth === 0) {
    return (
      <div
        style={{
          padding: 40,
          color: '#999',
          background: '#fff',
          borderRadius: 8,
        }}
      >
        没有图片
      </div>
    )
  }
  const { canvasWidth, canvasHeight, positions, isGap } = layout
  return (
    <div
      style={{
        position: 'relative',
        width: canvasWidth,
        height: canvasHeight,
        background: isGap ? '#ffffff' : 'transparent',
      }}
    >
      {images.map((img, i) => {
        const pos = positions[i]
        if (!pos) return null
        return (
          <img
            key={img.id}
            src={img.dataUrl}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              left: pos.x,
              top: pos.y,
              width: pos.w,
              height: pos.h,
              display: 'block',
            }}
          />
        )
      })}
    </div>
  )
}

// --- helpers ---

type Rect = { x: number; y: number; w: number; h: number }

type LayoutResult = {
  canvasWidth: number
  canvasHeight: number
  positions: Rect[]
  isHorizontal: boolean
  isGap: boolean
  gap: number
}

const computeLayout = (
  images: ImageItem[],
  styleId: StyleId,
): LayoutResult => {
  const isHorizontal = styleId === 'hTight' || styleId === 'hGap'
  const isGap = styleId === 'hGap' || styleId === 'vGap'
  const gap = isGap ? GAP_PX : 0

  if (images.length === 0) {
    return {
      canvasWidth: 0,
      canvasHeight: 0,
      positions: [],
      isHorizontal,
      isGap,
      gap,
    }
  }

  // Cross-axis = height for horizontal, width for vertical.
  // Use the largest natural size so good-quality inputs stay sharp;
  // smaller inputs get gently upscaled to align with the rest.
  const rawCross = isHorizontal
    ? Math.max(...images.map((i) => i.height))
    : Math.max(...images.map((i) => i.width))
  const cross = Math.min(rawCross, MAX_CROSS_AXIS)

  const positions: Rect[] = []
  if (isHorizontal) {
    let x = 0
    const y = 0
    for (const img of images) {
      const h = cross
      const w = Math.max(1, Math.round((img.width * h) / img.height))
      positions.push({ x, y, w, h })
      x += w + gap
    }
    const totalW = x - gap
    return {
      canvasWidth: totalW,
      canvasHeight: cross,
      positions,
      isHorizontal,
      isGap,
      gap,
    }
  }

  let y = 0
  const x = 0
  for (const img of images) {
    const w = cross
    const h = Math.max(1, Math.round((img.height * w) / img.width))
    positions.push({ x, y, w, h })
    y += h + gap
  }
  const totalH = y - gap
  return {
    canvasWidth: cross,
    canvasHeight: totalH,
    positions,
    isHorizontal,
    isGap,
    gap,
  }
}

const loadHtmlImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image load failed'))
    img.src = src
  })

const renderLayoutToBlob = async (
  images: ImageItem[],
  layout: LayoutResult,
): Promise<Blob> => {
  const { canvasWidth, canvasHeight, positions, isGap } = layout
  if (canvasWidth === 0 || canvasHeight === 0) {
    throw new Error('no images to render')
  }
  const els = await Promise.all(images.map((img) => loadHtmlImage(img.dataUrl)))
  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas 2d context unavailable')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  // Fill only the gap area with white so the gaps read as clean dividers
  // (without this, transparent gaps look weird on dark viewers).
  if (isGap) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
  }

  for (let i = 0; i < els.length; i++) {
    const el = els[i]
    const pos = positions[i]
    if (!pos) continue
    ctx.drawImage(el, pos.x, pos.y, pos.w, pos.h)
  }

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('canvas toBlob returned null'))
      else resolve(blob)
    }, 'image/png')
  })
}

const moveItem = <T,>(arr: T[], from: number, to: number): T[] => {
  const next = arr.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

const loadFileAsImageItem = async (file: File): Promise<ImageItem> => {
  const dataUrl = await readFileAsDataUrl(file)
  const { width, height } = await loadImageDims(dataUrl)
  return { id: makeId(), dataUrl, width, height }
}

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

const loadImageDims = (
  src: string,
): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new Error('image load failed'))
    img.src = src
  })

const makeId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
