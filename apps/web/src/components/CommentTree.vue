<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Comment } from '../types/forum'
import { formatDate } from '../lib/format'
import { useAuthStore } from '../stores/auth'
import { useForumStore } from '../stores/forum'
import CommentComposer from './CommentComposer.vue'

defineOptions({ name: 'CommentTree' })

export type CommentNode = Comment & { children: CommentNode[] }

const props = defineProps<{ node: CommentNode; canReply: boolean; canModerate: boolean }>()
const emit = defineEmits<{ reply: [parentId: string, body: string] }>()

const store = useForumStore()
const auth = useAuthStore()

const isReplying = ref(false)
const showAdminTools = ref(false)
const removalReason = ref('')

const moderation = computed(() => props.node.moderation)
const isRemoved = computed(() => moderation.value?.status === 'removed')
const moderator = computed(() =>
  moderation.value?.actorId ? auth.getUserById(moderation.value.actorId) : null,
)

const canReplyToComment = computed(() => props.canReply && !isRemoved.value)
const disabledReplyMessage = computed(() =>
  isRemoved.value
    ? 'Replies are disabled because this comment was removed.'
    : 'Sign in with a member account to reply.',
)

const handleReply = (body: string) => {
  if (!canReplyToComment.value) return
  emit('reply', props.node.id, body)
  isReplying.value = false
}

const handleRemove = () => {
  store.removeComment(props.node.id, removalReason.value)
  removalReason.value = ''
  showAdminTools.value = false
}

const forwardReply = (parentId: string, body: string) => {
  emit('reply', parentId, body)
}
</script>

<template>
  <div class="comment-item">
    <div class="comment-item__header">
      <div class="comment-item__header-left">
        <span class="comment-item__author">{{ node.author }}</span>
        <span v-if="isRemoved" class="comment-item__status">Removed</span>
      </div>
      <span class="comment-item__timestamp">{{ formatDate(node.createdAt) }}</span>
    </div>
    <p v-if="!isRemoved" class="comment-item__body">{{ node.body }}</p>
    <div v-else class="comment-item__removed">
      <p>This comment has been removed by an admin.</p>
      <p v-if="moderation?.reason" class="comment-item__removed-reason">“{{ moderation.reason }}”</p>
      <p v-if="moderator" class="comment-item__removed-meta">
        Action by {{ moderator.username }} · {{ formatDate(moderation?.createdAt ?? '') }}
      </p>
    </div>
    <div class="comment-item__actions">
      <button
        class="comment-item__reply"
        type="button"
        :disabled="!canReplyToComment"
        @click="isReplying = !isReplying"
      >
        {{ isReplying ? 'Cancel' : 'Reply' }}
      </button>
      <button
        v-if="canModerate"
        class="comment-item__admin-toggle"
        type="button"
        @click="showAdminTools = !showAdminTools"
      >
        {{ showAdminTools ? 'Hide admin tools' : 'Admin tools' }}
      </button>
    </div>
    <div v-if="showAdminTools" class="comment-item__admin">
      <textarea
        v-model="removalReason"
        rows="2"
        placeholder="Reason for removing this comment."
      ></textarea>
      <div class="comment-item__admin-actions">
        <button type="button" :disabled="isRemoved || !removalReason.trim()" @click="handleRemove">
          Remove comment
        </button>
      </div>
    </div>
    <div v-if="isReplying" class="comment-item__composer">
      <CommentComposer
        :autofocus="true"
        :disabled="!canReplyToComment"
        :disabled-message="disabledReplyMessage"
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
      :can-reply="canReply"
      :can-moderate="canModerate"
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

.comment-item__header-left {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
}

.comment-item__author {
  font-weight: 600;
}

.comment-item__status {
  background: rgba(239, 68, 68, 0.15);
  color: #b91c1c;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
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

.comment-item__removed {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 0.9rem;
  padding: 0.8rem 1rem;
  color: rgba(127, 29, 29, 0.9);
}

.comment-item__removed-reason {
  margin: 0.4rem 0 0;
  font-weight: 600;
}

.comment-item__removed-meta {
  margin: 0.3rem 0 0;
  font-size: 0.8rem;
  color: rgba(127, 29, 29, 0.8);
}

.comment-item__actions {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.comment-item__reply,
.comment-item__admin-toggle {
  border: none;
  background: transparent;
  color: rgba(15, 23, 42, 0.7);
  font-weight: 600;
  padding: 0;
  cursor: pointer;
  width: fit-content;
}

.comment-item__reply:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.comment-item__admin {
  background: rgba(15, 23, 42, 0.05);
  border-radius: 0.9rem;
  padding: 0.8rem;
  display: grid;
  gap: 0.6rem;
}

.comment-item__admin textarea {
  border-radius: 0.6rem;
  border: 1px solid rgba(15, 23, 42, 0.12);
  padding: 0.5rem 0.6rem;
  font-family: inherit;
}

.comment-item__admin-actions {
  display: flex;
  justify-content: flex-end;
}

.comment-item__admin button {
  border: none;
  border-radius: 999px;
  padding: 0.4rem 1rem;
  background: #b91c1c;
  color: #f8f6ee;
  font-weight: 600;
  cursor: pointer;
}

.comment-item__admin button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
