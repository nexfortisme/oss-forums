<script setup lang="ts">
import type { Post } from '../types/forum'
import PostCard from './PostCard.vue'

defineProps<{ posts: Post[]; channelSlug: string; commentCounts: Record<string, number> }>()
</script>

<template>
  <div class="post-list">
    <PostCard
      v-for="post in posts"
      :key="post.id"
      :post="post"
      :channel-slug="channelSlug"
      :comment-count="commentCounts[post.id] || 0"
    />
  </div>
</template>

<style scoped>
.post-list {
  display: grid;
  gap: 1rem;
}
</style>
