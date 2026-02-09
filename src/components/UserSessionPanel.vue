<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const selectedUserId = ref<string>(auth.currentUserId.value ?? '')

watch(
  auth.currentUserId,
  (value) => {
    selectedUserId.value = value ?? ''
  },
)

const currentLabel = computed(() => auth.currentUser.value?.name ?? 'Signed out')
const roleLabel = computed(() => auth.currentUser.value?.role ?? 'viewer')

const login = () => {
  if (selectedUserId.value) {
    auth.login(selectedUserId.value)
  }
}
</script>

<template>
  <div class="session-panel">
    <div class="session-panel__identity">
      <span class="session-panel__label">Session</span>
      <span class="session-panel__name">{{ currentLabel }}</span>
      <span class="session-panel__role">{{ roleLabel }}</span>
    </div>
    <div class="session-panel__actions">
      <select v-model="selectedUserId">
        <option disabled value="">Select a user</option>
        <option v-for="user in auth.users" :key="user.id" :value="user.id">
          {{ user.name }} · {{ user.role }}
        </option>
      </select>
      <button type="button" @click="login">Log in</button>
      <button type="button" class="ghost" @click="auth.logout">Log out</button>
    </div>
    <p class="session-panel__hint">JWT-ready flow: this is a mocked login state only.</p>
  </div>
</template>

<style scoped>
.session-panel {
  display: grid;
  gap: 0.6rem;
  background: rgba(15, 23, 42, 0.06);
  padding: 0.75rem 1rem;
  border-radius: 1rem;
}

.session-panel__identity {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.session-panel__label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: rgba(15, 23, 42, 0.5);
}

.session-panel__name {
  font-weight: 600;
}

.session-panel__role {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  background: #0f172a;
  color: #f8f6ee;
}

.session-panel__actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

select {
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.15);
  padding: 0.4rem 0.8rem;
  background: #ffffff;
  font-size: 0.85rem;
}

button {
  border: none;
  border-radius: 999px;
  padding: 0.4rem 0.9rem;
  background: #0f172a;
  color: #f8f6ee;
  font-weight: 600;
  cursor: pointer;
}

button.ghost {
  background: transparent;
  border: 1px solid rgba(15, 23, 42, 0.2);
  color: #0f172a;
}

.session-panel__hint {
  margin: 0;
  font-size: 0.75rem;
  color: rgba(15, 23, 42, 0.55);
}
</style>
