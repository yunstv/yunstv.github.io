import type { ComponentType, ReactNode } from 'react'
import {
  Component2Icon,
  CropIcon,
  FontFamilyIcon,
  LayersIcon,
} from '@radix-ui/react-icons'

/**
 * Hand-written SVG illustrations for tools.
 *
 * Style conventions (keep all new illustrations consistent):
 * - viewBox: "0 0 100 80"
 * - color: wrap in a parent that sets `color: var(--accent-9)` (already done by the
 *   <svg> root below), then use `stroke="currentColor"` / `fill="currentColor"` on
 *   children so the illustration tracks the active accent + light/dark theme.
 * - line weight: stroke="2" for primary shapes, "1.5" for fine detail, "2.5" for
 *   emphasis (e.g. corner brackets).
 * - soft fills: layered solid shapes get `fillOpacity` in 0.08 / 0.16 / 0.25 / 0.35
 *   tiers — the lower the layer (background), the lighter the fill.
 * - readability target: the illustration is rendered inside an ~aspect-5:3 box at
 *   ~160–240px wide on /tools. Avoid detail below ~3px.
 *
 * To add a new tool illustration, see .claude/skills/tool-illustration/SKILL.md.
 */

function IllustrationFrame({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 100 80"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      style={{ color: 'var(--accent-9)' }}
      aria-hidden
    >
      {children}
    </svg>
  )
}

function TextToImageIllustration() {
  return (
    <IllustrationFrame>
      <rect x="8" y="10" width="36" height="60" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="14" y1="22" x2="38" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="30" x2="34" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="38" x2="38" y2="38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="46" x2="30" y2="46" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="54" x2="36" y2="54" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M50 40 L62 40 M62 40 L58 36 M62 40 L58 44"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <rect
        x="66"
        y="20"
        width="28"
        height="40"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <circle cx="74" cy="30" r="2.5" fill="currentColor" />
      <path
        d="M68 52 L76 44 L82 50 L88 44 L92 48 L92 58 L68 58 Z"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </IllustrationFrame>
  )
}

function ImageMergeIllustration() {
  return (
    <IllustrationFrame>
      <rect
        x="6"
        y="14"
        width="34"
        height="34"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <circle cx="14" cy="22" r="2.5" fill="currentColor" />
      <path
        d="M9 44 L18 35 L26 43 L34 37 L37 40 L37 46 L9 46 Z"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <rect
        x="33"
        y="22"
        width="34"
        height="34"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <circle cx="41" cy="30" r="2.5" fill="currentColor" />
      <path
        d="M36 52 L45 43 L53 51 L61 45 L64 48 L64 54 L36 54 Z"
        fill="currentColor"
        fillOpacity="0.3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <rect
        x="60"
        y="30"
        width="34"
        height="34"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
        fill="currentColor"
        fillOpacity="0.16"
      />
      <circle cx="68" cy="38" r="2.5" fill="currentColor" />
      <path
        d="M63 60 L72 51 L80 59 L88 53 L91 56 L91 62 L63 62 Z"
        fill="currentColor"
        fillOpacity="0.35"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </IllustrationFrame>
  )
}

function ImageCropIllustration() {
  return (
    <IllustrationFrame>
      <rect
        x="10"
        y="14"
        width="80"
        height="52"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <circle cx="24" cy="26" r="3" fill="currentColor" />
      <path
        d="M14 58 L30 42 L46 56 L60 44 L82 62 L82 64 L14 64 Z"
        fill="currentColor"
        fillOpacity="0.22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <rect
        x="28"
        y="26"
        width="44"
        height="30"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeDasharray="4 3"
        fill="none"
      />
      <path d="M22 30 L22 22 L30 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M70 22 L78 22 L78 30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M78 52 L78 60 L70 60" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M30 60 L22 60 L22 52" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </IllustrationFrame>
  )
}

function FallbackIllustration() {
  return (
    <IllustrationFrame>
      <rect
        x="20"
        y="14"
        width="60"
        height="52"
        rx="6"
        stroke="currentColor"
        strokeWidth="2"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <path
        d="M50 30 L50 50 M40 40 L60 40"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </IllustrationFrame>
  )
}

/**
 * Registry keyed by tool `href` (e.g. "/tools/image-crop").
 *
 * To register a new illustration: add the component above, then add an entry
 * here. Tools without an entry render <FallbackIllustration />.
 */
export const TOOL_ILLUSTRATIONS: Record<string, () => ReactNode> = {
  '/tools/text-to-image': TextToImageIllustration,
  '/tools/image-merge': ImageMergeIllustration,
  '/tools/image-crop': ImageCropIllustration,
}

export function getToolIllustration(href: string): () => ReactNode {
  return TOOL_ILLUSTRATIONS[href] ?? FallbackIllustration
}

/**
 * Small monochrome icon shown next to each tool in the list/grid tabs.
 * Reuses Radix Icons so we don't carry a second set of hand-drawn glyphs.
 * Keyed by tool `href`; unknown tools render <Component2Icon /> as fallback.
 */
type IconType = ComponentType<{ width?: number | string; height?: number | string }>

export const TOOL_ICONS: Record<string, IconType> = {
  '/tools/text-to-image': FontFamilyIcon,
  '/tools/image-merge': LayersIcon,
  '/tools/image-crop': CropIcon,
}

export function getToolIcon(href: string): IconType {
  return TOOL_ICONS[href] ?? Component2Icon
}
