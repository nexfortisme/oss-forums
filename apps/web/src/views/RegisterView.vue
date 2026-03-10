<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const localError = ref('')
const isBusy = computed(() => auth.status === 'loading')

const submit = async () => {
  localError.value = ''

  if (!form.username || !form.password) {
    localError.value = 'Please fill out all required fields.'
    return
  }

  if (form.password !== form.confirmPassword) {
    localError.value = 'Passwords do not match.'
    return
  }

  const success = await auth.register({
    username: form.username,
    email: form.email,
    password: form.password,
  })

  if (success) {
    router.push('/channels')
  }
}
</script>

<template>
  <section class="register">
    <div class="register__card">
      <header>
        <h1>Create your account</h1>
        <p>Set up your OSS Forums profile in a minute or two.</p>
      </header>

      <form class="register__form" @submit.prevent="submit">
        <label>
          <span>Username</span>
          <input v-model.trim="form.username" type="text" autocomplete="username" />
        </label>
        <!-- <label>
          <span>Email</span>
          <input v-model.trim="form.email" type="email" autocomplete="email" />
        </label> -->
        <label>
          <span>Password</span>
          <input v-model="form.password" type="password" autocomplete="new-password" />
        </label>
        <label>
          <span>Confirm password</span>
          <input v-model="form.confirmPassword" type="password" autocomplete="new-password" />
        </label>

        <button type="submit" :disabled="isBusy">Create account</button>
      </form>

      <p v-if="localError" class="register__error">{{ localError }}</p>
      <p v-else-if="auth.error" class="register__error">{{ auth.error }}</p>

      <p class="register__footer">
        Already have an account?
        <RouterLink to="/channels">Return home</RouterLink>
      </p>
    </div>
  </section>
</template>

<style scoped>
.register {
  display: flex;
  justify-content: center;
  padding: 2rem 0 4rem;
}

.register__card {
  width: min(520px, 100%);
  background: rgba(248, 246, 238, 0.92);
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 1.5rem;
  padding: 2rem 2.5rem;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
}

header h1 {
  margin: 0 0 0.5rem;
  font-size: 2rem;
  font-family: 'Noto Sans', sans-serif;
}

header p {
  margin: 0 0 1.5rem;
  color: rgba(15, 23, 42, 0.7);
}

.register__form {
  display: grid;
  gap: 1rem;
}

label {
  display: grid;
  gap: 0.5rem;
  font-weight: 600;
  color: #0f172a;
}

input {
  border-radius: 0.75rem;
  border: 1px solid rgba(15, 23, 42, 0.15);
  padding: 0.6rem 0.9rem;
  font-size: 0.95rem;
  background: #ffffff;
}

button {
  margin-top: 0.5rem;
  border: none;
  border-radius: 999px;
  padding: 0.75rem 1.2rem;
  background: #0f172a;
  color: #f8f6ee;
  font-weight: 600;
  cursor: pointer;
}

.register__error {
  margin: 1rem 0 0;
  color: #b91c1c;
}

.register__footer {
  margin: 1.5rem 0 0;
  color: rgba(15, 23, 42, 0.65);
}
</style>
