import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Channel, Comment, Post } from '../types/forum'
import { slugify } from '../lib/slug'
import { useAuthStore } from './auth'

const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

const getAuthToken = () => sessionStorage.getItem('auth_token')

// ---------- API shape adapters ----------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adaptChannel = (raw: any): Channel => ({
  id: raw.id,
  slug: slugify(raw.name),
  name: raw.name,
  description: raw.description,
  accent: raw.accent ?? '#1d4ed8',
  guidelines: Array.isArray(raw.guidelines)
    ? raw.guidelines
    : (typeof raw.guidelines === 'string' ? JSON.parse(raw.guidelines) : []),
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adaptPost = (raw: any): Post => {
  const post: Post = {
    id: raw.id,
    channelId: raw.channel_id,
    title: raw.title ?? undefined,
    body: raw.body,
    author: raw.author_id,
    createdAt: raw.created_at,
  }
  if (raw.moderation_status === 'removed') {
    post.moderation = {
      status: 'removed',
      reason: raw.moderation_reason ?? '',
      actorId: raw.moderated_by ?? '',
      createdAt: raw.moderated_at ?? '',
    }
  }
  return post
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adaptComment = (raw: any): Comment => {
  const comment: Comment = {
    id: raw.id,
    postId: raw.post_id,
    parentId: raw.parent_id ?? undefined,
    body: raw.body,
    author: raw.author_id,
    createdAt: raw.created_at,
  }
  if (raw.moderation_status === 'removed') {
    comment.moderation = {
      status: 'removed',
      reason: raw.moderation_reason ?? '',
      actorId: raw.moderated_by ?? '',
      createdAt: raw.moderated_at ?? '',
    }
  }
  return comment
}

// ---------- Helpers ----------

const ensureUniqueSlug = (desired: string, existing: string[]) => {
  if (!existing.includes(desired)) return desired
  let suffix = 2
  let next = `${desired}-${suffix}`
  while (existing.includes(next)) {
    suffix += 1
    next = `${desired}-${suffix}`
  }
  return next
}

// ---------- Store ----------

export const useForumStore = defineStore('forum', () => {
  const auth = useAuthStore()
  const channels = ref<Channel[]>([])
  const posts = ref<Post[]>([])
  const comments = ref<Comment[]>([])

  const channelCount = computed(() => channels.value.length)

  const getChannelBySlug = (slug: string) =>
    channels.value.find((channel) => channel.slug === slug)

  const getChannelById = (id: string) =>
    channels.value.find((channel) => channel.id === id)

  const getPostsByChannelId = (channelId: string, includeRemoved = false) =>
    posts.value
      .filter((post) => post.channelId === channelId)
      .filter((post) => includeRemoved || !post.moderation)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const getPostById = (postId: string) => posts.value.find((post) => post.id === postId)

  const getCommentsByPostId = (postId: string) =>
    comments.value
      .filter((comment) => comment.postId === postId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  const getCommentCountForPost = (postId: string) =>
    comments.value.filter((comment) => comment.postId === postId).length

  // ---------- API: Load ----------

  const loadChannels = async () => {
    try {
      const res = await fetch(`${apiBase}/channels`)
      if (!res.ok) return
      const data = (await res.json()) as unknown[]
      channels.value = data.map(adaptChannel)
    } catch {
      // network unavailable — leave store as-is
    }
  }

  const loadChannelBySlug = async (slug: string) => {
    try {
      if (channels.value.length === 0) {
        await loadChannels()
      }
      const channel = channels.value.find((c) => c.slug === slug)
      if (!channel) return

      const res = await fetch(`${apiBase}/channels/${encodeURIComponent(channel.name)}`)
      if (!res.ok) return
      const data = (await res.json()) as { channel: unknown; posts: unknown[] }

      const adapted = adaptChannel(data.channel)
      const idx = channels.value.findIndex((c) => c.id === adapted.id)
      if (idx >= 0) channels.value[idx] = adapted
      else channels.value.push(adapted)

      const newPosts = (data.posts ?? []).map(adaptPost)
      posts.value = posts.value.filter((p) => p.channelId !== adapted.id)
      posts.value.push(...newPosts)
    } catch {
      // network unavailable
    }
  }

  const loadPost = async (postId: string) => {
    try {
      const res = await fetch(`${apiBase}/posts/${postId}`)
      if (!res.ok) return
      const data = (await res.json()) as { post: unknown; comments: unknown[] }
      if (!data.post) return

      const adaptedPost = adaptPost(data.post)
      const idx = posts.value.findIndex((p) => p.id === adaptedPost.id)
      if (idx >= 0) posts.value[idx] = adaptedPost
      else posts.value.push(adaptedPost)

      const newComments = (data.comments ?? []).map(adaptComment)
      comments.value = comments.value.filter((c) => c.postId !== postId)
      comments.value.push(...newComments)
    } catch {
      // network unavailable
    }
  }

  // ---------- API: Mutations ----------

  const addPost = async (channelId: string, body: string, title: string) => {
    const trimmedBody = body.trim()
    const trimmedTitle = title.trim()
    if (!trimmedBody || !trimmedTitle || !auth.canPost) return

    try {
      const res = await fetch(`${apiBase}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          channel_id: channelId,
          title: trimmedTitle,
          body: trimmedBody,
        }),
      })
      if (!res.ok) return
      const newPost = await res.json()
      posts.value.unshift(adaptPost(newPost))
    } catch {
      // network unavailable
    }
  }

  const addComment = async (postId: string, body: string, parentId?: string) => {
    const trimmed = body.trim()
    if (!trimmed || !auth.canPost) return

    try {
      const res = await fetch(`${apiBase}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          post_id: postId,
          body: trimmed,
          parent_id: parentId ?? null,
        }),
      })
      if (!res.ok) return
      const newComment = await res.json()
      comments.value.push(adaptComment(newComment))
    } catch {
      // network unavailable
    }
  }

  const addChannel = async (payload: {
    name: string
    description: string
    slug?: string
    accent?: string
    guidelines?: string[]
  }) => {
    if (!auth.isAdmin) return

    const name = payload.name.trim()
    const description = payload.description.trim()
    if (!name || !description) return

    try {
      const res = await fetch(`${apiBase}/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          name,
          description,
          accent: payload.accent?.trim() || '#1d4ed8',
          guidelines: payload.guidelines?.length
            ? payload.guidelines
            : ['Share the purpose of the channel in the first post.'],
        }),
      })
      if (!res.ok) return
      const newChannel = await res.json()
      const adapted = adaptChannel(newChannel)
      const existingSlugs = channels.value.map((c) => c.slug)
      adapted.slug = ensureUniqueSlug(adapted.slug, existingSlugs)
      channels.value.unshift(adapted)
    } catch {
      // network unavailable
    }
  }

  const removePost = async (postId: string, reason: string) => {
    if (!auth.canModerate) return

    try {
      const res = await fetch(`${apiBase}/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      })
      if (!res.ok) return

      // Mark locally as removed so the view shows the moderation state until next load
      const post = posts.value.find((item) => item.id === postId)
      if (post) {
        post.moderation = {
          status: 'removed',
          reason: reason.trim() || 'Removed by admin.',
          actorId: auth.currentUser?.id ?? 'system',
          createdAt: new Date().toISOString(),
        }
      }
    } catch {
      // network unavailable
    }
  }

  const removeComment = async (commentId: string, reason: string) => {
    if (!auth.canModerate) return

    try {
      const res = await fetch(`${apiBase}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      })
      if (!res.ok) return

      const comment = comments.value.find((item) => item.id === commentId)
      if (comment) {
        comment.moderation = {
          status: 'removed',
          reason: reason.trim() || 'Removed by admin.',
          actorId: auth.currentUser?.id ?? 'system',
          createdAt: new Date().toISOString(),
        }
      }
    } catch {
      // network unavailable
    }
  }

  return {
    channels,
    posts,
    comments,
    channelCount,
    getChannelBySlug,
    getChannelById,
    getPostsByChannelId,
    getPostById,
    getCommentsByPostId,
    getCommentCountForPost,
    loadChannels,
    loadChannelBySlug,
    loadPost,
    addPost,
    addComment,
    addChannel,
    removePost,
    removeComment,
  }
})
