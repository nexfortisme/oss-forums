<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useForumStore } from '../stores/forum'
import NewPostForm from '../components/NewPostForm.vue'
import PostList from '../components/PostList.vue'

const props = defineProps<{ channelSlug: string }>()
const store = useForumStore()
const auth = useAuthStore()

const channel = computed(() => store.getChannelBySlug(props.channelSlug))
const posts = computed(() =>
  channel.value ? store.getPostsByChannelId(channel.value.id) : [],
)

const replyCount = computed(() =>
  posts.value.reduce((total, post) => total + store.getCommentCountForPost(post.id), 0),
)

const commentCounts = computed(() => {
  const counts: Record<string, number> = {}
  posts.value.forEach((post) => {
    counts[post.id] = store.getCommentCountForPost(post.id)
  })
  return counts
})

const handlePostSubmit = (body: string) => {
  if (!channel.value) return
  store.addPost(channel.value.id, body)
}
</script>

<template>
  <section v-if="channel" class="channel-view">
    <div class="channel-view__intro">
      <div>
        <p class="channel-view__eyebrow">Channel</p>
        <h1>{{ channel.name }}</h1>
        <p class="channel-view__description">{{ channel.description }}</p>
      </div>
      <div class="channel-view__meta" :style="{ borderColor: channel.accent }">
        <div>
          <span class="meta-label">Posts</span>
          <span class="meta-value">{{ posts.length }}</span>
        </div>
        <div>
          <span class="meta-label">Replies</span>
          <span class="meta-value">{{ replyCount }}</span>
        </div>
      </div>
    </div>

    <div class="channel-view__grid">
      <div class="channel-view__main">
        <NewPostForm
          :channel-name="channel.name"
          :can-post="auth.canPost"
          :user-label="auth.currentUser?.username || 'Guest'"
          @submit="handlePostSubmit"
        />

        <div class="channel-view__posts">
          <h2>Recent posts</h2>
          <p v-if="!posts.length" class="empty-state">No posts yet. Start the conversation!</p>
          <PostList
            v-else
            :posts="posts"
            :channel-slug="channel.slug"
            :comment-counts="commentCounts"
          />
        </div>
      </div>

      <aside class="channel-view__sidebar">
        <div class="sidebar-card">
          <h3>Posting guide</h3>
          <ul>
            <li v-for="item in channel.guidelines" :key="item">{{ item }}</li>
          </ul>
        </div>
        <div class="sidebar-card">
          <h3>Channel focus</h3>
          <p>
            Use this space to keep updates aligned with the channel theme. Anything outside of
            scope should move to a more relevant channel.
          </p>
        </div>
      </aside>
    </div>
  </section>

  <section v-else class="empty-state">
    <h1>Channel not found</h1>
    <p>Try a different channel from the list.</p>
    <RouterLink to="/channels" class="ghost-link">Back to channels</RouterLink>
  </section>
</template>

<style scoped>
.channel-view {
  display: grid;
  gap: 2rem;
}

.channel-view__intro {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.channel-view__eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.75rem;
  color: rgba(15, 23, 42, 0.6);
}

.channel-view__intro h1 {
  margin: 0.3rem 0 0.5rem;
  font-family: 'Fraunces', serif;
  font-size: 2.2rem;
}

.channel-view__description {
  margin: 0;
  color: rgba(15, 23, 42, 0.7);
  max-width: 38rem;
}

.channel-view__meta {
  border: 2px solid;
  border-radius: 1.5rem;
  padding: 1.2rem 1.5rem;
  display: grid;
  gap: 0.8rem;
  min-width: 12rem;
  background: #ffffff;
}

.meta-label {
  font-size: 0.8rem;
  color: rgba(15, 23, 42, 0.6);
  display: block;
}

.meta-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.channel-view__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 2rem;
}

.channel-view__main {
  display: grid;
  gap: 2rem;
}

.channel-view__posts h2 {
  margin: 0 0 1rem;
  font-size: 1.4rem;
}

.empty-state {
  color: rgba(15, 23, 42, 0.6);
}

.channel-view__sidebar {
  display: grid;
  gap: 1.5rem;
}

.sidebar-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 1.2rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  padding: 1.3rem;
  box-shadow: 0 18px 30px rgba(15, 23, 42, 0.06);
}

.sidebar-card h3 {
  margin: 0 0 0.8rem;
}

.sidebar-card ul {
  margin: 0;
  padding-left: 1.1rem;
  display: grid;
  gap: 0.5rem;
  color: rgba(15, 23, 42, 0.7);
}

.sidebar-card p {
  margin: 0;
  color: rgba(15, 23, 42, 0.7);
}

.ghost-link {
  display: inline-flex;
  margin-top: 1rem;
  text-decoration: none;
  color: #0f172a;
  font-weight: 600;
}

@media (max-width: 980px) {
  .channel-view__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .channel-view__intro {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
