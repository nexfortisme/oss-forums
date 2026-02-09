export type Channel = {
  id: string
  slug: string
  name: string
  description: string
  accent: string
  guidelines: string[]
}

export type Post = {
  id: string
  channelId: string
  title?: string
  body: string
  author: string
  createdAt: string
}

export type Comment = {
  id: string
  postId: string
  parentId?: string
  body: string
  author: string
  createdAt: string
}
