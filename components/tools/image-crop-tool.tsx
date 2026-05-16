'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
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

type ImageItem = {
  dataUrl: string
  width: number
  height: number
}

type StyleId = 'square' | 'circle' | 'landscape' | 'portrait'

type StyleDef = {
  id: StyleId
  name: string
  hint: string
  aspect: number // width / height
  circle: boolean
}

const STYLES: StyleDef[] = [
  { id: 'square', name: '1:1 正方形', hint: '头像 · 社交贴图', aspect: 1, circle: false },
  { id: 'circle', name: '圆形头像', hint: '透明背景圆形 PNG', aspect: 1, circle: true },
  { id: 'landscape', name: '16:9 横屏', hint: '封面 · 缩略图', aspect: 16 / 9, circle: false },
  { id: 'portrait', name: '9:16 全竖屏', hint: 'Stories · Reels', aspect: 9 / 16, circle: false },
]

type Rect = { x: number; y: number; w: number; h: number }

export function ImageCropTool() {
  const [image, setImage] = useState<ImageItem | null>(null)
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const [focused, setFocused] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pasteAreaRef = useRef<HTMLDivElement>(null)

  const setFromFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    const dataUrl = await readFileAsDataUrl(file)
    const { width, height } = await loadImageDims(dataUrl)
    setImage({ dataUrl, width, height })
  }, [])

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLDivElement>) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of Array.from(items)) {
        if (!item.type.startsWith('image/')) continue
        const file = item.getAsFile()
        if (file) {
          e.preventDefault()
          void setFromFile(file)
          return
        }
      }
    },
    [setFromFile],
  )

  const handleFiles = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) void setFromFile(file)
      e.target.value = ''
    },
    [setFromFile],
  )

  const handleClear = () => setImage(null)
  const handlePickFiles = () => fileInputRef.current?.click()
  const handleAreaClick = () => pasteAreaRef.current?.focus()
  const handleAreaKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handlePickFiles()
    }
  }

  const open = openIdx !== null

  return (
    <Flex direction="column" gap="4">
      <Card>
        <Flex direction="column" gap="2">
          <Flex justify="between" align="center" wrap="wrap" gap="2">
            <Text size="2" weight="medium">图片输入</Text>
            <Flex align="center" gap="3" wrap="wrap">
              <Text size="1" color="gray">
                {image
                  ? `${image.width}×${image.height}`
                  : '尚未粘贴图片'}
              </Text>
              <Button
                size="1"
                variant="soft"
                color="gray"
                onClick={handlePickFiles}
              >
                <ImageIcon /> 从文件选择
              </Button>
              {image && (
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
              cursor: image ? 'default' : 'pointer',
              background: focused ? 'var(--accent-a2)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {image ? (
              <ImagePreview image={image} focused={focused} />
            ) : (
              <EmptyHint focused={focused} />
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFiles}
          />
        </Flex>
      </Card>

      <Grid columns={{ initial: '2', sm: '4' }} gap="3">
        {STYLES.map((s, i) => (
          <StyleChip
            key={s.id}
            styleDef={s}
            disabled={image === null}
            onClick={() => setOpenIdx(i)}
          />
        ))}
      </Grid>

      <PreviewDialog
        open={open}
        image={image}
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
    </Flex>
  )
}

const EmptyHint = ({ focused }: { focused: boolean }) => (
  <Flex
    align="center"
    justify="center"
    direction="column"
    gap="2"
    style={{ color: 'var(--gray-10)', textAlign: 'center' }}
  >
    <ImageIcon width={32} height={32} />
    <Text size="3" color="gray">
      {focused ? '已就绪，按 ⌘V / Ctrl+V 粘贴图片' : '点击此处，然后粘贴图片'}
    </Text>
    <Text size="1" color="gray">
      新粘贴会替换当前图 · 回车 / 空格也可打开文件选择
    </Text>
  </Flex>
)

const ImagePreview = ({
  image,
  focused,
}: {
  image: ImageItem
  focused: boolean
}) => (
  <Flex direction="column" align="center" gap="2">
    <img
      src={image.dataUrl}
      alt="已粘贴的图片"
      draggable={false}
      style={{
        maxWidth: '100%',
        maxHeight: 'min(50vh, 480px)',
        objectFit: 'contain',
        borderRadius: 6,
        boxShadow: '0 4px 18px rgba(0,0,0,.08)',
      }}
    />
    <Text size="1" color="gray">
      {focused ? '再次按 ⌘V / Ctrl+V 可替换' : '点选下方风格预览，或聚焦后粘贴替换'}
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

const StyleChip = ({
  styleDef,
  disabled,
  onClick,
}: {
  styleDef: StyleDef
  disabled: boolean
  onClick: () => void
}) => (
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
      aria-label={`${styleDef.name} · ${styleDef.hint}${disabled ? ' · 请先粘贴图片' : ''}`}
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChipPreview styleDef={styleDef} />
        </Box>
        <Flex direction="column" gap="1">
          <Text size="2" weight="medium">{styleDef.name}</Text>
          <Text size="1" color="gray">{styleDef.hint}</Text>
        </Flex>
      </Flex>
    </button>
  </Card>
)

const ChipPreview = ({ styleDef }: { styleDef: StyleDef }) => {
  // Render a mini representation of the crop aspect; circle gets a round shape.
  const base = 'var(--gray-12)'
  if (styleDef.circle) {
    return (
      <div
        style={{ width: 34, height: 34, background: base, borderRadius: '50%' }}
      />
    )
  }
  const isLandscape = styleDef.aspect > 1
  const long = 44
  const short = Math.round(long / Math.max(styleDef.aspect, 1 / styleDef.aspect))
  const w = isLandscape ? long : short
  const h = isLandscape ? short : long
  return (
    <div style={{ width: w, height: h, background: base, borderRadius: 3 }} />
  )
}

type PreviewDialogProps = {
  open: boolean
  image: ImageItem | null
  activeIdx: number
  onOpenChange: (v: boolean) => void
  onPrev: () => void
  onNext: () => void
}

const PreviewDialog = ({
  open,
  image,
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
          {open ? STYLES[activeIdx].name : '裁切预览'}
        </Dialog.Title>
        {open && image && (
          <DialogBody
            image={image}
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
  image: ImageItem
  activeIdx: number
  onPrev: () => void
  onNext: () => void
  onClose: () => void
}

const DialogBody = ({
  image,
  activeIdx,
  onPrev,
  onNext,
  onClose,
}: DialogBodyProps) => {
  const active = STYLES[activeIdx]
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [cropRect, setCropRect] = useState<Rect>(() =>
    centerCropRect(image.width, image.height, active.aspect),
  )

  // Reset crop when image or style aspect changes.
  useEffect(() => {
    setCropRect(centerCropRect(image.width, image.height, active.aspect))
    setCopied(false)
    setErr(null)
  }, [image, active.aspect])

  const handleReset = () => {
    setCropRect(centerCropRect(image.width, image.height, active.aspect))
  }

  const handleDownload = useCallback(async () => {
    if (busy) return
    setBusy(true)
    setErr(null)
    try {
      const blob = await cropImageToBlob(image, cropRect, active.circle)
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
  }, [busy, image, cropRect, active])

  const handleCopy = useCallback(async () => {
    if (busy) return
    setBusy(true)
    setErr(null)
    try {
      const blob = await cropImageToBlob(image, cropRect, active.circle)
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
  }, [busy, image, cropRect, active])

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
              {activeIdx + 1} / {STYLES.length} · {active.hint} · 输出 {Math.round(cropRect.w)}×{Math.round(cropRect.h)}
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
          <Tooltip content="居中重置">
            <IconButton
              size="2"
              variant="soft"
              color="gray"
              onClick={handleReset}
              aria-label="居中重置"
            >
              <ReloadIcon />
            </IconButton>
          </Tooltip>
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
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        <Box
          style={{
            flex: 3,
            padding: 24,
            overflow: 'hidden',
            background:
              'repeating-conic-gradient(var(--gray-a3) 0 25%, transparent 0 50%) 0 0 / 16px 16px',
          }}
        >
          <CropEditor
            image={image}
            cropRect={cropRect}
            onChange={setCropRect}
            circle={active.circle}
          />
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
          }}
        >
          <Flex direction="column" gap="1">
            <Text size="2" weight="medium">实时预览</Text>
            <Text size="1" color="gray">
              输出 {Math.round(cropRect.w)}×{Math.round(cropRect.h)}
            </Text>
          </Flex>
          <PreviewPane
            image={image}
            cropRect={cropRect}
            circle={active.circle}
          />
        </Box>
      </Box>
    </>
  )
}

const PreviewPane = ({
  image,
  cropRect,
  circle,
}: {
  image: ImageItem
  cropRect: Rect
  circle: boolean
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setSize({ w: width, h: height })
    })
    ro.observe(node)
    return () => ro.disconnect()
  }, [])

  // Scale = how many displayed px per natural px in the preview pane
  const scale = useMemo(() => {
    if (size.w === 0 || size.h === 0) return 0
    if (cropRect.w === 0 || cropRect.h === 0) return 0
    return Math.min(size.w / cropRect.w, size.h / cropRect.h)
  }, [size, cropRect.w, cropRect.h])

  const previewW = cropRect.w * scale
  const previewH = cropRect.h * scale

  return (
    <div
      ref={ref}
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'repeating-conic-gradient(var(--gray-a3) 0 25%, transparent 0 50%) 0 0 / 10px 10px',
        borderRadius: 6,
        padding: 8,
      }}
    >
      {scale > 0 && (
        <div
          style={{
            position: 'relative',
            width: previewW,
            height: previewH,
            overflow: 'hidden',
            borderRadius: circle ? '50%' : 4,
            boxShadow: '0 4px 14px rgba(0,0,0,.12)',
          }}
        >
          <img
            src={image.dataUrl}
            alt="裁切结果预览"
            draggable={false}
            style={{
              position: 'absolute',
              width: image.width * scale,
              height: image.height * scale,
              left: -cropRect.x * scale,
              top: -cropRect.y * scale,
              maxWidth: 'none',
              display: 'block',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        </div>
      )}
    </div>
  )
}

type CropEditorProps = {
  image: ImageItem
  cropRect: Rect
  onChange: (r: Rect) => void
  circle: boolean
}

const CropEditor = ({
  image,
  cropRect,
  onChange,
  circle,
}: CropEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ offsetX: number; offsetY: number } | null>(null)
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const node = containerRef.current
    if (!node) return
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setContainerSize({ w: width, h: height })
    })
    ro.observe(node)
    return () => ro.disconnect()
  }, [])

  // scale = displayed pixels per natural pixel
  const scale = useMemo(() => {
    if (containerSize.w === 0 || containerSize.h === 0) return 0
    return Math.min(
      containerSize.w / image.width,
      containerSize.h / image.height,
      1,
    )
  }, [containerSize, image.width, image.height])

  const displayW = image.width * scale
  const displayH = image.height * scale

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (scale === 0) return
    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)
    const frameRect = target.getBoundingClientRect()
    dragRef.current = {
      offsetX: e.clientX - frameRect.left,
      offsetY: e.clientY - frameRect.top,
    }
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || scale === 0) return
    const stage = containerRef.current?.querySelector(
      '[data-stage]',
    ) as HTMLElement | null
    if (!stage) return
    const stageRect = stage.getBoundingClientRect()
    const newDisplayX = e.clientX - stageRect.left - dragRef.current.offsetX
    const newDisplayY = e.clientY - stageRect.top - dragRef.current.offsetY
    const newX = newDisplayX / scale
    const newY = newDisplayY / scale
    const clampedX = clamp(newX, 0, image.width - cropRect.w)
    const clampedY = clamp(newY, 0, image.height - cropRect.h)
    onChange({ ...cropRect, x: clampedX, y: clampedY })
  }

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    dragRef.current = null
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {scale > 0 && (
        <div
          data-stage
          style={{
            position: 'relative',
            width: displayW,
            height: displayH,
            overflow: 'hidden',
          }}
        >
          <img
            src={image.dataUrl}
            alt=""
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
          <div
            ref={frameRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            role="slider"
            aria-label="裁切框，拖动可移动选区"
            aria-valuetext={`水平 ${Math.round(cropRect.x)}, 垂直 ${Math.round(cropRect.y)}, 宽 ${Math.round(cropRect.w)}, 高 ${Math.round(cropRect.h)}`}
            style={{
              position: 'absolute',
              left: cropRect.x * scale,
              top: cropRect.y * scale,
              width: cropRect.w * scale,
              height: cropRect.h * scale,
              border: '2px solid #ffffff',
              borderRadius: circle ? '50%' : 4,
              boxShadow:
                '0 0 0 9999px rgba(0, 0, 0, 0.55), inset 0 0 0 1px rgba(0, 0, 0, 0.35)',
              cursor: 'move',
              touchAction: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}
    </div>
  )
}

// --- helpers ---

const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v))

const centerCropRect = (
  imgW: number,
  imgH: number,
  aspect: number,
): Rect => {
  const imgAspect = imgW / imgH
  let w: number
  let h: number
  if (imgAspect > aspect) {
    h = imgH
    w = h * aspect
  } else {
    w = imgW
    h = w / aspect
  }
  return {
    x: (imgW - w) / 2,
    y: (imgH - h) / 2,
    w,
    h,
  }
}

const cropImageToBlob = async (
  image: ImageItem,
  rect: Rect,
  circle: boolean,
): Promise<Blob> => {
  const el = await loadHtmlImage(image.dataUrl)
  const outW = Math.max(1, Math.round(rect.w))
  const outH = Math.max(1, Math.round(rect.h))
  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas 2d context unavailable')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  if (circle) {
    ctx.beginPath()
    ctx.arc(outW / 2, outH / 2, Math.min(outW, outH) / 2, 0, Math.PI * 2)
    ctx.clip()
  }
  ctx.drawImage(el, rect.x, rect.y, rect.w, rect.h, 0, 0, outW, outH)
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('canvas toBlob returned null'))
      else resolve(blob)
    }, 'image/png')
  })
}

const loadHtmlImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image load failed'))
    img.src = src
  })

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
