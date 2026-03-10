<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  placeholder?: string
  submitLabel?: string
  autofocus?: boolean
  disabled?: boolean
  disabledMessage?: string
}>()

const emit = defineEmits<{ submit: [body: string] }>()

const body = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

watch(
  () => props.autofocus,
  (value) => {
    if (value) {
      requestAnimationFrame(() => {
        textareaRef.value?.focus()
      })
    }
  },
  { immediate: true },
)

const submit = () => {
  if (props.disabled) return
  emit('submit', body.value)
  body.value = ''
}
</script>

<template>
  <form class="comment-composer" @submit.prevent="submit">
    <textarea
      ref="textareaRef"
      v-model="body"
      rows="4"
      :placeholder="placeholder || 'Write a comment...'"
      :disabled="disabled"
    ></textarea>
    <div class="comment-composer__actions">
      <button type="submit" :disabled="disabled || !body.trim()">
        {{ submitLabel || 'Post comment' }}
      </button>
    </div>
    <p v-if="disabled" class="comment-composer__disabled">
      {{ disabledMessage || 'Sign in with a member account to reply.' }}
    </p>
  </form>
</template>

<style scoped>
.comment-composer {
  display: grid;
  gap: 0.75rem;
}

textarea {
  width: 100%;
  border-radius: 0.9rem;
  border: 1px solid rgba(15, 23, 42, 0.12);
  padding: 0.85rem 1rem;
  font-family: 'Noto Sans', sans-serif;
  font-size: 0.95rem;
  resize: vertical;
}

textarea:focus {
  outline: 2px solid rgba(15, 23, 42, 0.2);
  border-color: rgba(15, 23, 42, 0.4);
}

textarea:disabled {
  background: rgba(15, 23, 42, 0.05);
  cursor: not-allowed;
}

.comment-composer__actions {
  display: flex;
  justify-content: flex-end;
}

button {
  border: none;
  border-radius: 999px;
  padding: 0.5rem 1.2rem;
  background: #0f172a;
  color: #f8f6ee;
  font-weight: 600;
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.comment-composer__disabled {
  margin: 0;
  font-size: 0.8rem;
  color: rgba(15, 23, 42, 0.55);
}
</style>
