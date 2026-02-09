<script setup lang="ts">
import type { Post } from '../types/forum'
import { formatDate } from '../lib/format'

const props = defineProps<{ post: Post; channelSlug: string; commentCount: number }>()

const title = props.post.title ?? props.post.body.split('\n')[0]
</script>

<template>
  <RouterLink
    :to="`/channels/${channelSlug}/posts/${post.id}`"
    class="post-card"
    :aria-label="`Open ${title}`"
  >
    <div class="post-card__header">
      <h3>{{ title }}</h3>
      <span class="post-card__meta">{{ formatDate(post.createdAt) }}</span>
    </div>
    <p class="post-card__body">{{ post.body }}</p>
    <div class="post-card__footer">
      <span class="post-card__author">{{ post.author }}</span>
      <span class="post-card__comments">{{ commentCount }} comments</span>
    </div>
  </RouterLink>
</template>

<style scoped>
.post-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.2rem 1.4rem;
  background: #ffffff;
  border-radius: 1rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  text-decoration: none;
  color: inherit;
  transition: border 0.2s ease, transform 0.2s ease;
}

.post-card:hover {
  transform: translateY(-2px);
  border-color: rgba(15, 23, 42, 0.2);
}

.post-card__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.post-card__header h3 {
  margin: 0;
  font-size: 1.05rem;
}

.post-card__meta {
  font-size: 0.85rem;
  color: rgba(15, 23, 42, 0.6);
}

.post-card__body {
  margin: 0;
  color: rgba(15, 23, 42, 0.75);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-card__footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: rgba(15, 23, 42, 0.65);
}

.post-card__author {
  font-weight: 600;
}

@media (max-width: 720px) {
  .post-card__header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
