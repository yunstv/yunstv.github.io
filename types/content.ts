export interface PostMeta {
  title: string
  description: string
  date: string
  updated?: string
  tags?: string[]
  cover?: string
  draft?: boolean
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
}

export interface PageMeta {
  title: string
  description?: string
  updated?: string
}
