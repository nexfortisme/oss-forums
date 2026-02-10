<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const form = reactive({
  username: '',
  password: '',
})

const currentLabel = computed(() => auth.currentUser?.username ?? 'Signed out')
const roleLabel = computed(() => auth.currentUser?.role.toUpperCase() ?? 'Viewer')
const isBusy = computed(() => auth.status === 'loading')

const submitLogin = async () => {
  if (!form.username || !form.password) return
  const success = await auth.login(form.username, form.password)
  if (success) {
    form.password = ''
  }
}

const disableLogin = computed(() => {
  // Check if the site is on a specific domain, e.g. "restricted.example.com"
  if (window.location.hostname === 'https://oss-forums.nexfortisme.workers.dev') {
    auth.setNullSession()
  }

  // Disable login if busy, or if fields are empty
  return isBusy.value || !form.username || !form.password
})

const goToRegister = () => {
  router.push({ name: 'register' })
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
      <template v-if="auth.isAuthenticated">
        <button type="button" class="ghost" :disabled="isBusy" @click="auth.logout">Log out</button>
      </template>
      <template v-else>
        <input
          v-model.trim="form.username"
          type="text"
          placeholder="Username"
          autocomplete="username"
          :disabled="disableLogin"
        />
        <input
          v-model="form.password"
          type="password"
          placeholder="Password"
          autocomplete="current-password"
          :disabled="disableLogin"
        />
        <button type="button" :disabled="isBusy || disableLogin" @click="submitLogin">
          Log in
        </button>
        <button
          type="button"
          class="ghost"
          :disabled="isBusy || disableLogin"
          @click="goToRegister"
        >
          Register
        </button>
      </template>
    </div>
    <p v-if="auth.error" class="session-panel__error">{{ auth.error }}</p>
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

input {
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

.session-panel__error {
  margin: 0;
  font-size: 0.75rem;
  color: #b91c1c;
}
</style>
