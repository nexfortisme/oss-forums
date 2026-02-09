import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Channel, Comment, Post } from '../types/forum'
import { slugify } from '../lib/slug'
import { useAuthStore } from './auth'

const seedChannels: Channel[] = [
  {
    id: 'channel-announce',
    slug: 'announcements',
    name: 'Announcements',
    description: 'Release notes, roadmap signals, and operational updates.',
    accent: '#f97316',
    guidelines: [
      'Keep posts short and scannable.',
      'Link to source issues or PRs when relevant.',
      'Tag launches with a date in the first line.',
    ],
  },
  {
    id: 'channel-build',
    slug: 'build-logs',
    name: 'Build Logs',
    description: 'Daily progress, experiments, and build notes from the team.',
    accent: '#0ea5e9',
    guidelines: [
      'Focus on what changed and why.',
      'Call out blockers explicitly.',
      'Summarize with a next step.',
    ],
  },
  {
    id: 'channel-help',
    slug: 'help-desk',
    name: 'Help Desk',
    description: 'Questions, answers, and troubleshooting threads.',
    accent: '#10b981',
    guidelines: [
      'Share context before the question.',
      'Include errors and repro steps.',
      'Close the loop when solved.',
    ],
  },
]

const seedPosts: Post[] = [
  {
    id: 'post-101',
    channelId: 'channel-announce',
    title: 'Week 6 Shipping Notes',
    body:
      'We shipped the new audit log export today. Metrics look good and onboarding is 18% faster.\n\nNext: we are rolling out the search upgrade in two waves on Wednesday.',
    author: 'Riley Park',
    createdAt: '2026-02-01T14:18:00.000Z',
  },
  {
    id: 'post-102',
    channelId: 'channel-announce',
    title: 'Incident Review: File Sync Lag',
    body:
      'Summary: 27 minutes of delayed processing caused by a queue backlog.\n\nWe have added alerting on the queue depth and are adding automatic backpressure.',
    author: 'Morgan Lee',
    createdAt: '2026-02-03T09:12:00.000Z',
  },
  {
    id: 'post-201',
    channelId: 'channel-build',
    title: 'Prototype: Personal Activity Feed',
    body:
      'Built a quick prototype for a personal activity feed with local caching. Initial results show a 400ms win on repeat visits.\n\nNeed to decide on the final card density.',
    author: 'Sam Torres',
    createdAt: '2026-02-04T16:45:00.000Z',
  },
  {
    id: 'post-202',
    channelId: 'channel-build',
    title: 'Search Query Planner Notes',
    body:
      'The query planner is now pruning 12% more of low-signal clauses. The tradeoff is a small latency hit on complex queries.\n\nCollecting more traces today.',
    author: 'Jordan Ellis',
    createdAt: '2026-02-05T11:05:00.000Z',
  },
  {
    id: 'post-301',
    channelId: 'channel-help',
    title: 'Webhook Retry Policy Clarification',
    body:
      'Does anyone know if webhook retries back off exponentially? We are seeing a burst of retries that look linear.',
    author: 'Alex Nguyen',
    createdAt: '2026-02-06T17:30:00.000Z',
  },
]

const seedComments: Comment[] = [
  {
    id: 'comment-1001',
    postId: 'post-101',
    body: 'Love the onboarding win. Can we add screenshots of the new flow to the release note?',
    author: 'Harper Chen',
    createdAt: '2026-02-01T15:10:00.000Z',
  },
  {
    id: 'comment-1002',
    postId: 'post-101',
    parentId: 'comment-1001',
    body: 'Yes! I can grab them after the meeting and post here.',
    author: 'Riley Park',
    createdAt: '2026-02-01T15:22:00.000Z',
  },
  {
    id: 'comment-1003',
    postId: 'post-201',
    body: 'The caching idea sounds solid. How are we invalidating when roles change?',
    author: 'Taylor Brooks',
    createdAt: '2026-02-04T18:02:00.000Z',
  },
  {
    id: 'comment-1004',
    postId: 'post-201',
    parentId: 'comment-1003',
    body: 'Right now it is a 5 minute TTL. We should hook into permission events.',
    author: 'Sam Torres',
    createdAt: '2026-02-04T18:14:00.000Z',
  },
  {
    id: 'comment-1005',
    postId: 'post-301',
    body: 'Retries back off exponentially after the second attempt. I can pull the spec.',
    author: 'Chris Patel',
    createdAt: '2026-02-06T18:02:00.000Z',
  },
]

const createId = (prefix: string) => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`
}

const deriveTitle = (body: string) => {
  const trimmed = body.trim().replace(/\s+/g, ' ')
  if (!trimmed) return 'Untitled post'
  if (trimmed.length <= 60) return trimmed
  return `${trimmed.slice(0, 60)}...`
}

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

export const useForumStore = defineStore('forum', () => {
  const auth = useAuthStore()
  const channels = ref<Channel[]>([...seedChannels])
  const posts = ref<Post[]>([...seedPosts])
  const comments = ref<Comment[]>([...seedComments])

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

  const addPost = (channelId: string, body: string) => {
    const trimmed = body.trim()
    if (!trimmed || !auth.canPost) return

    const newPost: Post = {
      id: createId('post'),
      channelId,
      title: deriveTitle(trimmed),
      body: trimmed,
      author: auth.currentUser?.name ?? 'Guest',
      createdAt: new Date().toISOString(),
    }

    posts.value.unshift(newPost)
  }

  const addComment = (postId: string, body: string, parentId?: string) => {
    const trimmed = body.trim()
    if (!trimmed || !auth.canPost) return

    const newComment: Comment = {
      id: createId('comment'),
      postId,
      parentId,
      body: trimmed,
      author: auth.currentUser?.name ?? 'Guest',
      createdAt: new Date().toISOString(),
    }

    comments.value.push(newComment)
  }

  const addChannel = (payload: {
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

    const baseSlug = slugify(payload.slug?.trim() || name)
    if (!baseSlug) return

    const slug = ensureUniqueSlug(
      baseSlug,
      channels.value.map((channel) => channel.slug),
    )

    const newChannel: Channel = {
      id: createId('channel'),
      slug,
      name,
      description,
      accent: payload.accent?.trim() || '#1d4ed8',
      guidelines:
        payload.guidelines && payload.guidelines.length
          ? payload.guidelines
          : ['Share the purpose of the channel in the first post.'],
    }

    channels.value.unshift(newChannel)
  }

  const removePost = (postId: string, reason: string) => {
    if (!auth.canModerate) return

    const post = posts.value.find((item) => item.id === postId)
    if (!post) return

    post.moderation = {
      status: 'removed',
      reason: reason.trim() || 'Removed by admin.',
      actorId: auth.currentUser?.id ?? 'system',
      createdAt: new Date().toISOString(),
    }
  }

  const removeComment = (commentId: string, reason: string) => {
    if (!auth.canModerate) return

    const comment = comments.value.find((item) => item.id === commentId)
    if (!comment) return

    comment.moderation = {
      status: 'removed',
      reason: reason.trim() || 'Removed by admin.',
      actorId: auth.currentUser?.id ?? 'system',
      createdAt: new Date().toISOString(),
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
    addPost,
    addComment,
    addChannel,
    removePost,
    removeComment,
  }
})
