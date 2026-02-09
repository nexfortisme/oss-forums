<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ channelName: string; canPost: boolean; userLabel: string }>()

const emit = defineEmits<{ submit: [body: string] }>()

const body = ref('')

const submitPost = () => {
  if (!props.canPost) return
  emit('submit', body.value)
  body.value = ''
}
</script>

<template>
  <form class="new-post" @submit.prevent="submitPost">
    <div class="new-post__header">
      <h3>Post in {{ channelName }}</h3>
      <span class="new-post__note">Drafting in plain text for now.</span>
    </div>
    <div v-if="canPost" class="new-post__composer">
      <textarea
        v-model="body"
        rows="6"
        placeholder="Share an update, question, or announcement..."
      ></textarea>
      <div class="new-post__actions">
        <button type="submit" :disabled="!body.trim()">Publish post</button>
      </div>
    </div>
    <div v-else class="new-post__locked">
      <p>Signed in as {{ userLabel }}. Posting is limited to members and admins.</p>
      <p>Switch to a member account to start a new thread.</p>
    </div>
  </form>
</template>

<style scoped>
.new-post {
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 1.25rem;
  padding: 1.5rem;
  display: grid;
  gap: 1rem;
}

.new-post__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.new-post__note {
  font-size: 0.85rem;
  color: rgba(15, 23, 42, 0.6);
}

.new-post__composer {
  display: grid;
  gap: 1rem;
}

textarea {
  width: 100%;
  border-radius: 1rem;
  border: 1px solid rgba(15, 23, 42, 0.12);
  padding: 1rem;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.95rem;
  resize: vertical;
}

textarea:focus {
  outline: 2px solid rgba(15, 23, 42, 0.2);
  border-color: rgba(15, 23, 42, 0.4);
}

.new-post__actions {
  display: flex;
  justify-content: flex-end;
}

.new-post__locked {
  background: rgba(15, 23, 42, 0.04);
  border-radius: 0.9rem;
  padding: 1rem;
  color: rgba(15, 23, 42, 0.7);
}

button {
  border: none;
  border-radius: 999px;
  padding: 0.6rem 1.4rem;
  background: #0f172a;
  color: #f8f6ee;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
  box-shadow: none;
}

button:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 20px rgba(15, 23, 42, 0.15);
}

@media (max-width: 720px) {
  .new-post__header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
