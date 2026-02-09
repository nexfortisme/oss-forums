<script setup lang="ts">
import { ref } from 'vue'
import type { Comment } from '../types/forum'
import { formatDate } from '../lib/format'
import CommentComposer from './CommentComposer.vue'

defineOptions({ name: 'CommentTree' })

export type CommentNode = Comment & { children: CommentNode[] }

const props = defineProps<{ node: CommentNode }>()
const emit = defineEmits<{ reply: [parentId: string, body: string] }>()

const isReplying = ref(false)

const handleReply = (body: string) => {
  emit('reply', props.node.id, body)
  isReplying.value = false
}

const forwardReply = (parentId: string, body: string) => {
  emit('reply', parentId, body)
}
</script>

<template>
  <div class="comment-item">
    <div class="comment-item__header">
      <span class="comment-item__author">{{ node.author }}</span>
      <span class="comment-item__timestamp">{{ formatDate(node.createdAt) }}</span>
    </div>
    <p class="comment-item__body">{{ node.body }}</p>
    <button class="comment-item__reply" type="button" @click="isReplying = !isReplying">
      {{ isReplying ? 'Cancel' : 'Reply' }}
    </button>
    <div v-if="isReplying" class="comment-item__composer">
      <CommentComposer
        :autofocus="true"
        submit-label="Reply"
        placeholder="Write a reply..."
        @submit="handleReply"
      />
    </div>
  </div>
  <div v-if="node.children.length" class="comment-children">
    <CommentTree
      v-for="child in node.children"
      :key="child.id"
      :node="child"
      @reply="forwardReply"
    />
  </div>
</template>

<style scoped>
.comment-item {
  background: #ffffff;
  border-radius: 1rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  padding: 1rem 1.2rem;
  display: grid;
  gap: 0.6rem;
}

.comment-item__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.comment-item__author {
  font-weight: 600;
}

.comment-item__timestamp {
  font-size: 0.85rem;
  color: rgba(15, 23, 42, 0.6);
}

.comment-item__body {
  margin: 0;
  white-space: pre-wrap;
  color: rgba(15, 23, 42, 0.78);
}

.comment-item__reply {
  border: none;
  background: transparent;
  color: rgba(15, 23, 42, 0.7);
  font-weight: 600;
  padding: 0;
  cursor: pointer;
  width: fit-content;
}

.comment-item__composer {
  margin-top: 0.5rem;
}

.comment-children {
  margin-left: 1.5rem;
  padding-left: 1rem;
  border-left: 2px dashed rgba(15, 23, 42, 0.1);
  display: grid;
  gap: 0.9rem;
}

@media (max-width: 720px) {
  .comment-children {
    margin-left: 0.8rem;
    padding-left: 0.6rem;
  }
}
</style>
