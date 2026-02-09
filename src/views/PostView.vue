<script setup lang="ts">
import { computed } from 'vue'
import { useForumStore } from '../stores/forum'
import { formatDate } from '../lib/format'
import CommentComposer from '../components/CommentComposer.vue'
import CommentThread from '../components/CommentThread.vue'

const props = defineProps<{ channelSlug: string; postId: string }>()
const store = useForumStore()

const channel = computed(() => store.getChannelBySlug(props.channelSlug))
const post = computed(() => store.getPostById(props.postId))
const comments = computed(() => store.getCommentsByPostId(props.postId))

const postInChannel = computed(() => {
  if (!channel.value || !post.value) return false
  return post.value.channelId === channel.value.id
})

const handleNewComment = (body: string) => {
  store.addComment(props.postId, body)
}
</script>

<template>
  <section v-if="channel && post && postInChannel" class="post-view">
    <div class="post-view__header">
      <RouterLink :to="`/channels/${channel.slug}`" class="ghost-link">
        ← Back to {{ channel.name }}
      </RouterLink>
      <div class="post-view__title">
        <h1>{{ post.title || post.body.split('\n')[0] }}</h1>
        <div class="post-view__meta">
          <span>{{ post.author }}</span>
          <span class="dot">•</span>
          <span>{{ formatDate(post.createdAt) }}</span>
        </div>
      </div>
      <p class="post-view__body">{{ post.body }}</p>
    </div>

    <div class="post-view__comments">
      <div class="post-view__comments-header">
        <h2>Threaded replies</h2>
        <span>{{ comments.length }} total</span>
      </div>
      <div class="post-view__composer">
        <CommentComposer
          placeholder="Respond with context, links, or next steps..."
          submit-label="Add reply"
          @submit="handleNewComment"
        />
      </div>
      <p v-if="!comments.length" class="empty-state">No replies yet. Be the first to respond.</p>
      <CommentThread v-else :comments="comments" :post-id="post.id" />
    </div>
  </section>

  <section v-else class="empty-state">
    <h1>Post not found</h1>
    <p>The post might have moved, or the channel slug does not match.</p>
    <RouterLink to="/channels" class="ghost-link">Back to channels</RouterLink>
  </section>
</template>

<style scoped>
.post-view {
  display: grid;
  gap: 2.5rem;
}

.post-view__header {
  background: #ffffff;
  border-radius: 2rem;
  padding: 2.5rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 30px 50px rgba(15, 23, 42, 0.08);
  display: grid;
  gap: 1.5rem;
}

.post-view__title h1 {
  margin: 0 0 0.6rem;
  font-size: 2rem;
  font-family: 'Fraunces', serif;
}

.post-view__meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: rgba(15, 23, 42, 0.6);
  font-size: 0.9rem;
}

.dot {
  font-size: 0.6rem;
}

.post-view__body {
  margin: 0;
  white-space: pre-wrap;
  color: rgba(15, 23, 42, 0.75);
  line-height: 1.6;
}

.post-view__comments {
  display: grid;
  gap: 1.5rem;
}

.post-view__comments-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.post-view__comments-header span {
  color: rgba(15, 23, 42, 0.6);
}

.post-view__composer {
  background: rgba(255, 255, 255, 0.85);
  border-radius: 1.4rem;
  padding: 1.3rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.empty-state {
  color: rgba(15, 23, 42, 0.6);
}

.ghost-link {
  text-decoration: none;
  color: #0f172a;
  font-weight: 600;
}

@media (max-width: 720px) {
  .post-view__header {
    padding: 1.6rem;
  }
}
</style>
