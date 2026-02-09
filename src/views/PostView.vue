<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useForumStore } from '../stores/forum'
import { formatDate } from '../lib/format'
import CommentComposer from '../components/CommentComposer.vue'
import CommentThread from '../components/CommentThread.vue'

const props = defineProps<{ channelSlug: string; postId: string }>()
const store = useForumStore()
const auth = useAuthStore()

const channel = computed(() => store.getChannelBySlug(props.channelSlug))
const post = computed(() => store.getPostById(props.postId))
const comments = computed(() => store.getCommentsByPostId(props.postId))

const postInChannel = computed(() => {
  if (!channel.value || !post.value) return false
  return post.value.channelId === channel.value.id
})

const moderation = computed(() => post.value?.moderation)
const isRemoved = computed(() => moderation.value?.status === 'removed')
const moderator = computed(() =>
  moderation.value?.actorId ? auth.getUserById(moderation.value.actorId) : null,
)

const canReply = computed(() => auth.canPost.value && !isRemoved.value)
const disabledReplyMessage = computed(() => {
  if (isRemoved.value) {
    return 'Replies are disabled because the post was removed.'
  }
  return 'Sign in with a member account to reply.'
})

const removalReason = ref('')
const showAdminTools = ref(false)

const handleNewComment = (body: string) => {
  if (!canReply.value) return
  store.addComment(props.postId, body)
}

const handleRemovePost = () => {
  if (!post.value) return
  store.removePost(post.value.id, removalReason.value)
  removalReason.value = ''
}
</script>

<template>
  <section v-if="channel && post && postInChannel" class="post-view">
    <div class="post-view__header">
      <RouterLink :to="`/channels/${channel.slug}`" class="ghost-link">
        ← Back to {{ channel.name }}
      </RouterLink>
      <div class="post-view__title">
        <div class="post-view__title-row">
          <h1>{{ post.title || post.body.split('\n')[0] }}</h1>
          <span v-if="isRemoved" class="post-view__status">Removed</span>
        </div>
        <div class="post-view__meta">
          <span>{{ post.author }}</span>
          <span class="dot">•</span>
          <span>{{ formatDate(post.createdAt) }}</span>
        </div>
      </div>
      <p v-if="!isRemoved" class="post-view__body">{{ post.body }}</p>
      <div v-else class="post-view__removed">
        <p>This post has been removed by an admin.</p>
        <p v-if="moderation?.reason" class="post-view__removed-reason">
          “{{ moderation.reason }}”
        </p>
        <p v-if="moderator" class="post-view__removed-meta">
          Action by {{ moderator.name }} · {{ formatDate(moderation.createdAt) }}
        </p>
      </div>
      <div v-if="auth.canModerate" class="post-view__admin-toggle">
        <button type="button" @click="showAdminTools = !showAdminTools">
          {{ showAdminTools ? 'Hide admin tools' : 'Admin tools' }}
        </button>
      </div>
    </div>

    <div v-if="auth.canModerate && showAdminTools" class="post-view__admin">
      <div>
        <h3>Admin tools</h3>
        <p>Remove this post and leave a visible note for the author.</p>
      </div>
      <textarea
        v-model="removalReason"
        rows="3"
        placeholder="Share why the post was removed (required)."
      ></textarea>
      <div class="post-view__admin-actions">
        <button type="button" :disabled="isRemoved || !removalReason.trim()" @click="handleRemovePost">
          Remove post
        </button>
      </div>
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
        :disabled="!canReply"
        :disabled-message="disabledReplyMessage"
        @submit="handleNewComment"
      />
    </div>
    <p v-if="!comments.length" class="empty-state">No replies yet. Be the first to respond.</p>
    <CommentThread
      v-else
      :comments="comments"
      :post-id="post.id"
      :can-reply="canReply"
      :can-moderate="auth.canModerate"
    />
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

.post-view__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.post-view__status {
  background: rgba(239, 68, 68, 0.15);
  color: #b91c1c;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
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

.post-view__removed {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 1rem;
  padding: 1rem 1.2rem;
  color: rgba(127, 29, 29, 0.9);
}

.post-view__removed-reason {
  margin: 0.6rem 0 0;
  font-weight: 600;
}

.post-view__removed-meta {
  margin: 0.4rem 0 0;
  font-size: 0.85rem;
  color: rgba(127, 29, 29, 0.8);
}

.post-view__admin-toggle {
  display: flex;
  justify-content: flex-end;
}

.post-view__admin-toggle button {
  border: 1px solid rgba(15, 23, 42, 0.2);
  background: transparent;
  color: #0f172a;
  border-radius: 999px;
  padding: 0.4rem 1rem;
  font-weight: 600;
  cursor: pointer;
}

.post-view__admin {
  background: rgba(15, 23, 42, 0.04);
  border-radius: 1.4rem;
  padding: 1.5rem;
  display: grid;
  gap: 0.8rem;
  border: 1px dashed rgba(15, 23, 42, 0.2);
}

.post-view__admin h3 {
  margin: 0 0 0.2rem;
}

.post-view__admin p {
  margin: 0;
  color: rgba(15, 23, 42, 0.6);
}

.post-view__admin textarea {
  border-radius: 0.8rem;
  border: 1px solid rgba(15, 23, 42, 0.12);
  padding: 0.6rem 0.8rem;
  font-family: inherit;
}

.post-view__admin-actions {
  display: flex;
  justify-content: flex-end;
}

.post-view__admin button {
  border: none;
  border-radius: 999px;
  padding: 0.5rem 1.2rem;
  background: #b91c1c;
  color: #f8f6ee;
  font-weight: 600;
  cursor: pointer;
}

.post-view__admin button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

  .post-view__title-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
