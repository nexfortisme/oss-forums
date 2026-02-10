<script setup lang="ts">
import { onMounted } from 'vue'
import AppHeader from './components/AppHeader.vue'
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()

onMounted(() => {
  auth.refreshSession()
})
</script>

<template>
  <div class="app">
    <div class="app-background" aria-hidden="true"></div>
    <AppHeader />
    <main class="app-main">
      <RouterView />
    </main>
    <footer class="app-footer">
      <p>Built for discussion · Mock data only</p>
    </footer>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

:root {
  color-scheme: light;
  font-family: 'IBM Plex Sans', sans-serif;
  background-color: #f4efe5;
  color: #0f172a;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background: #f4efe5;
}

a {
  color: inherit;
}

.app {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

.app-background {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(800px 400px at 10% -10%, rgba(250, 204, 21, 0.25), transparent 60%),
    radial-gradient(900px 500px at 110% 10%, rgba(59, 130, 246, 0.2), transparent 55%),
    radial-gradient(700px 400px at 50% 120%, rgba(16, 185, 129, 0.18), transparent 50%);
  z-index: 0;
}

.app-main {
  position: relative;
  z-index: 1;
  max-width: 1100px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
}

.app-footer {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 1.5rem;
  color: rgba(15, 23, 42, 0.6);
}

button,
textarea {
  font-family: inherit;
}
</style>
