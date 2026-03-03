import { db } from '../persistance/database'

const demoChannels = [
  {
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

type DemoPost = {
  channelName: string
  title: string
  body: string
  createdAt: string
}

const demoPosts: DemoPost[] = [
  {
    channelName: 'Announcements',
    title: 'Week 6 Shipping Notes',
    body: 'We shipped the new audit log export today. Metrics look good and onboarding is 18% faster.\n\nNext: we are rolling out the search upgrade in two waves on Wednesday.',
    createdAt: '2026-02-01T14:18:00.000Z',
  },
  {
    channelName: 'Announcements',
    title: 'Incident Review: File Sync Lag',
    body: 'Summary: 27 minutes of delayed processing caused by a queue backlog.\n\nWe have added alerting on the queue depth and are adding automatic backpressure.',
    createdAt: '2026-02-03T09:12:00.000Z',
  },
  {
    channelName: 'Build Logs',
    title: 'Prototype: Personal Activity Feed',
    body: 'Built a quick prototype for a personal activity feed with local caching. Initial results show a 400ms win on repeat visits.\n\nNeed to decide on the final card density.',
    createdAt: '2026-02-04T16:45:00.000Z',
  },
  {
    channelName: 'Build Logs',
    title: 'Search Query Planner Notes',
    body: 'The query planner is now pruning 12% more of low-signal clauses. The tradeoff is a small latency hit on complex queries.\n\nCollecting more traces today.',
    createdAt: '2026-02-05T11:05:00.000Z',
  },
  {
    channelName: 'Help Desk',
    title: 'Webhook Retry Policy Clarification',
    body: 'Does anyone know if webhook retries back off exponentially? We are seeing a burst of retries that look linear.',
    createdAt: '2026-02-06T17:30:00.000Z',
  },
]

type DemoComment = {
  postTitle: string
  body: string
  createdAt: string
  parentBody?: string
}

const demoComments: DemoComment[] = [
  {
    postTitle: 'Week 6 Shipping Notes',
    body: 'Love the onboarding win. Can we add screenshots of the new flow to the release note?',
    createdAt: '2026-02-01T15:10:00.000Z',
  },
  {
    postTitle: 'Week 6 Shipping Notes',
    body: 'Yes! I can grab them after the meeting and post here.',
    createdAt: '2026-02-01T15:22:00.000Z',
    parentBody: 'Love the onboarding win. Can we add screenshots of the new flow to the release note?',
  },
  {
    postTitle: 'Prototype: Personal Activity Feed',
    body: 'The caching idea sounds solid. How are we invalidating when roles change?',
    createdAt: '2026-02-04T18:02:00.000Z',
  },
  {
    postTitle: 'Prototype: Personal Activity Feed',
    body: 'Right now it is a 5 minute TTL. We should hook into permission events.',
    createdAt: '2026-02-04T18:14:00.000Z',
    parentBody: 'The caching idea sounds solid. How are we invalidating when roles change?',
  },
  {
    postTitle: 'Webhook Retry Policy Clarification',
    body: 'Retries back off exponentially after the second attempt. I can pull the spec.',
    createdAt: '2026-02-06T18:02:00.000Z',
  },
]

export const seedDemoData = () => {
  if (Bun.env.SEED_DEMO_CHANNELS !== 'true') {
    return
  }

  const channelCount = (db.query('SELECT COUNT(*) AS count FROM channels').get() as { count: number }).count
  if (channelCount > 0) {
    return
  }

  const adminUser = db.query("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1").get() as { id: string } | null
  if (!adminUser) {
    console.warn('Seed: no admin user found, skipping demo data.')
    return
  }

  console.log('Seeding demo data...')

  // Insert channels
  const channelIds: Record<string, string> = {}
  for (const channel of demoChannels) {
    const channelId = Bun.randomUUIDv7()
    db.query(
      'INSERT INTO channels (id, name, description, accent, guidelines) VALUES (?, ?, ?, ?, ?)',
    ).run(channelId, channel.name, channel.description, channel.accent, JSON.stringify(channel.guidelines))
    channelIds[channel.name] = channelId
  }

  // Insert posts
  const postIds: Record<string, string> = {}
  for (const post of demoPosts) {
    const channelId = channelIds[post.channelName]
    if (!channelId) continue
    const postId = Bun.randomUUIDv7()
    db.query(
      'INSERT INTO posts (id, channel_id, author_id, title, body, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(postId, channelId, adminUser.id, post.title, post.body, post.createdAt)
    postIds[post.title] = postId
  }

  // Insert comments
  const commentIds: Record<string, string> = {}
  for (const comment of demoComments) {
    const postId = postIds[comment.postTitle]
    if (!postId) continue
    const commentId = Bun.randomUUIDv7()
    const parentId = comment.parentBody ? (commentIds[comment.parentBody] ?? null) : null
    db.query(
      'INSERT INTO comments (id, post_id, author_id, parent_id, body, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(commentId, postId, adminUser.id, parentId, comment.body, comment.createdAt)
    commentIds[comment.body] = commentId
  }

  console.log(
    `Seeded ${demoChannels.length} channels, ${demoPosts.length} posts, ${demoComments.length} comments.`,
  )
}
