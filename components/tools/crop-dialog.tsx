'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  Box,
  Dialog,
  Flex,
  IconButton,
  Text,
  Tooltip,
} from '@radix-ui/themes'
import {
  CheckIcon,
  CheckCircledIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  Cross2Icon,
  DownloadIcon,
  ReloadIcon,
} from '@radix-ui/react-icons'

export type CropImage = {
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

type Rect = { x: number; y: number; w: number; h: number }

const STYLES: StyleDef[] = [
  { id: 'square', name: '1:1 正方形', hint: '头像 · 社交贴图', aspect: 1, circle: false },
  { id: 'circle', name: '圆形头像', hint: '透明背景圆形 PNG', aspect: 1, circle: true },
  { id: 'landscape', name: '16:9 横屏', hint: '封面 · 缩略图', aspect: 16 / 9, circle: false },
  { id: 'portrait', name: '9:16 全竖屏', hint: 'Stories · Reels', aspect: 9 / 16, circle: false },
]

export const CROP_STYLE_IDS = STYLES.map((s) => s.id) as readonly StyleId[]
export type { StyleId as CropStyleId }

type CropDialogProps = {
  open: boolean
  image: CropImage | null
  initialStyleId?: StyleId
  onOpenChange: (open: boolean) => void
  /**
   * When provided, a confirm icon button is shown in the top-right actions.
   * Receives the cropped image (already loaded with dataUrl + dims) plus the
   * raw Blob in case the caller wants to upload or hash it directly.
   */
  onConfirm?: (result: CropImage, blob: Blob) => void
  /** Tooltip text shown on the confirm button. Defaults to "确认裁切并返回". */
  confirmTooltip?: string
}

export const CropDialog = ({
  open,
  image,
  initialStyleId = 'square',
  onOpenChange,
  onConfirm,
  confirmTooltip,
}: CropDialogProps) => {
  const [activeIdx, setActiveIdx] = useState(() => indexOfStyle(initialStyleId))

  // Each time the dialog opens (or the requested initial style changes while
  // open), snap back to the requested style. This makes invocations from
  // other tools start at a predictable preset.
  useEffect(() => {
    if (open) setActiveIdx(indexOfStyle(initialStyleId))
  }, [open, initialStyleId])

  const onPrev = useCallback(
    () => setActiveIdx((i) => (i + STYLES.length - 1) % STYLES.length),
    [],
  )
  const onNext = useCallback(
    () => setActiveIdx((i) => (i + 1) % STYLES.length),
    [],
  )

  useEffect(() => {
    if (!open) return
    const handleKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        onPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        onNext()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
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
            onConfirm={onConfirm}
            confirmTooltip={confirmTooltip ?? '确认裁切并返回'}
          />
        )}
      </Dialog.Content>
    </Dialog.Root>
  )
}

const indexOfStyle = (id: StyleId): number => {
  const i = STYLES.findIndex((s) => s.id === id)
  return i >= 0 ? i : 0
}

type DialogBodyProps = {
  image: CropImage
  activeIdx: number
  onPrev: () => void
  onNext: () => void
  onClose: () => void
  onConfirm?: (result: CropImage, blob: Blob) => void
  confirmTooltip: string
}

const DialogBody = ({
  image,
  activeIdx,
  onPrev,
  onNext,
  onClose,
  onConfirm,
  confirmTooltip,
}: DialogBodyProps) => {
  const active = STYLES[activeIdx]
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [cropRect, setCropRect] = useState<Rect>(() =>
    centerCropRect(image.width, image.height, active.aspect),
  )

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

  const handleConfirm = useCallback(async () => {
    if (busy || !onConfirm) return
    setBusy(true)
    setErr(null)
    try {
      const blob = await cropImageToBlob(image, cropRect, active.circle)
      const dataUrl = await blobToDataUrl(blob)
      const result: CropImage = {
        dataUrl,
        width: Math.max(1, Math.round(cropRect.w)),
        height: Math.max(1, Math.round(cropRect.h)),
      }
      onConfirm(result, blob)
      onClose()
    } catch (e) {
      setErr('裁切失败')
      console.error(e)
    } finally {
      setBusy(false)
    }
  }, [busy, image, cropRect, active.circle, onConfirm, onClose])

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
          {onConfirm && (
            <Tooltip content={confirmTooltip}>
              <IconButton
                size="2"
                variant="solid"
                color="green"
                onClick={handleConfirm}
                disabled={busy}
                aria-label={confirmTooltip}
              >
                <CheckCircledIcon />
              </IconButton>
            </Tooltip>
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

const CropEditor = ({
  image,
  cropRect,
  onChange,
  circle,
}: {
  image: CropImage
  cropRect: Rect
  onChange: (r: Rect) => void
  circle: boolean
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
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
    onChange({
      ...cropRect,
      x: clamp(newX, 0, image.width - cropRect.w),
      y: clamp(newY, 0, image.height - cropRect.h),
    })
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

const PreviewPane = ({
  image,
  cropRect,
  circle,
}: {
  image: CropImage
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
  image: CropImage,
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

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })

/** Convenience: turn a Blob into a CropImage with width/height resolved. */
export const blobToCropImage = async (blob: Blob): Promise<CropImage> => {
  const dataUrl = await blobToDataUrl(blob)
  const el = await loadHtmlImage(dataUrl)
  return { dataUrl, width: el.naturalWidth, height: el.naturalHeight }
}
