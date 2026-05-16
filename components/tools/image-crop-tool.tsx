'use client'

import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import {
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Text,
} from '@radix-ui/themes'
import { ImageIcon } from '@radix-ui/react-icons'
import {
  CropDialog,
  type CropImage,
  type CropStyleId,
} from './crop-dialog'

type StyleId = CropStyleId

type StyleChipDef = {
  id: StyleId
  name: string
  hint: string
  aspect: number
  circle: boolean
}

const STYLE_CHIPS: StyleChipDef[] = [
  { id: 'square', name: '1:1 正方形', hint: '头像 · 社交贴图', aspect: 1, circle: false },
  { id: 'circle', name: '圆形头像', hint: '透明背景圆形 PNG', aspect: 1, circle: true },
  { id: 'landscape', name: '16:9 横屏', hint: '封面 · 缩略图', aspect: 16 / 9, circle: false },
  { id: 'portrait', name: '9:16 全竖屏', hint: 'Stories · Reels', aspect: 9 / 16, circle: false },
]

export function ImageCropTool() {
  const [image, setImage] = useState<CropImage | null>(null)
  const [openStyle, setOpenStyle] = useState<StyleId | null>(null)
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

  return (
    <Flex direction="column" gap="4">
      <Card>
        <Flex direction="column" gap="2">
          <Flex justify="between" align="center" wrap="wrap" gap="2">
            <Text size="2" weight="medium">图片输入</Text>
            <Flex align="center" gap="3" wrap="wrap">
              <Text size="1" color="gray">
                {image ? `${image.width}×${image.height}` : '尚未粘贴图片'}
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
        {STYLE_CHIPS.map((s) => (
          <StyleChip
            key={s.id}
            styleDef={s}
            disabled={image === null}
            onClick={() => setOpenStyle(s.id)}
          />
        ))}
      </Grid>

      <CropDialog
        open={openStyle !== null}
        image={image}
        initialStyleId={openStyle ?? undefined}
        onOpenChange={(v) => setOpenStyle(v ? openStyle : null)}
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
  image: CropImage
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
  styleDef: StyleChipDef
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

const ChipPreview = ({ styleDef }: { styleDef: StyleChipDef }) => {
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
  const short = Math.round(
    long / Math.max(styleDef.aspect, 1 / styleDef.aspect),
  )
  const w = isLandscape ? long : short
  const h = isLandscape ? short : long
  return (
    <div style={{ width: w, height: h, background: base, borderRadius: 3 }} />
  )
}

// --- helpers ---

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
