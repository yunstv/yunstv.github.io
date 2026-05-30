export interface PostMeta {
  title: string
  description: string
  date: string
  updated?: string
  tags?: string[]
  cover?: string
  draft?: boolean
}

export interface ScreenshotMeta {
  src: string
  title: string
  description?: string
  route?: string
}

export interface ProjectMeta {
  name: string
  description: string
  date: string
  status: 'active' | 'archived' | 'wip'
  stack: string[]
  github?: string
  demo?: string
  cover?: string
  featured?: boolean
  screenshots?: ScreenshotMeta[]
}

export interface PageMeta {
  title: string
  description?: string
  updated?: string
}
