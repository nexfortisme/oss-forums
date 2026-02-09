<script setup lang="ts">
import { reactive } from 'vue'

type Payload = {
  name: string
  slug?: string
  description: string
  accent?: string
  guidelines?: string[]
}

const emit = defineEmits<{ submit: [payload: Payload] }>()

const form = reactive({
  name: '',
  slug: '',
  description: '',
  accent: '#1d4ed8',
  guidelines: '',
})

const submit = () => {
  if (!form.name.trim() || !form.description.trim()) return
  emit('submit', {
    name: form.name,
    slug: form.slug,
    description: form.description,
    accent: form.accent,
    guidelines: form.guidelines
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
  })

  form.name = ''
  form.slug = ''
  form.description = ''
  form.accent = '#1d4ed8'
  form.guidelines = ''
}
</script>

<template>
  <form class="new-channel" @submit.prevent="submit">
    <div class="new-channel__header">
      <div>
        <h2>Create a channel</h2>
        <p>Admin-only. Channels organize topics and routes automatically.</p>
      </div>
      <button type="submit" :disabled="!form.name.trim() || !form.description.trim()">
        Create channel
      </button>
    </div>
    <div class="new-channel__grid">
      <label>
        Name
        <input v-model="form.name" type="text" placeholder="Customer Success" />
      </label>
      <label>
        Slug (optional)
        <input v-model="form.slug" type="text" placeholder="customer-success" />
      </label>
      <label>
        Accent color
        <input v-model="form.accent" type="color" />
      </label>
      <label class="full">
        Description
        <textarea
          v-model="form.description"
          rows="3"
          placeholder="What belongs in this channel?"
        ></textarea>
      </label>
      <label class="full">
        Guidelines (one per line)
        <textarea
          v-model="form.guidelines"
          rows="3"
          placeholder="Share key expectations for posts."
        ></textarea>
      </label>
    </div>
  </form>
</template>

<style scoped>
.new-channel {
  background: #ffffff;
  border-radius: 1.6rem;
  padding: 1.5rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.06);
  display: grid;
  gap: 1.2rem;
}

.new-channel__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.new-channel__header h2 {
  margin: 0 0 0.4rem;
}

.new-channel__header p {
  margin: 0;
  color: rgba(15, 23, 42, 0.6);
}

.new-channel__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

label {
  display: grid;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: rgba(15, 23, 42, 0.7);
}

label.full {
  grid-column: 1 / -1;
}

input,
textarea {
  border-radius: 0.8rem;
  border: 1px solid rgba(15, 23, 42, 0.12);
  padding: 0.6rem 0.8rem;
  font-family: inherit;
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
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .new-channel__grid {
    grid-template-columns: 1fr;
  }
}
</style>
