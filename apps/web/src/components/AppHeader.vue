<script setup lang="ts">
import UserSessionPanel from './UserSessionPanel.vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
</script>

<template>
  <header class="app-header">
    <div class="app-header__inner">
      <div class="app-header__brand">
        <RouterLink to="/channels" class="brand">
          <span class="brand__mark">◎</span>
          <span class="brand__text">OSS Forums</span>
        </RouterLink>
        <nav class="app-header__nav">
          <RouterLink to="/channels" class="nav-link">Channels</RouterLink>
        </nav>
        <nav class="app-header__nav">
          <RouterLink to="/about-us" class="nav-link">About Us</RouterLink>
        </nav>
        <nav class="app-header__nav">
          <RouterLink to="/help" class="nav-link">Help</RouterLink>
        </nav>
      </div>
      <UserSessionPanel v-if="!auth.isExcludedDomain" />
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(12px);
  background: rgba(248, 246, 238, 0.9);
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.app-header__inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

.app-header__brand {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: inherit;
}

.brand__mark {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, #0ea5e9, #22c55e);
  color: #0f172a;
  display: grid;
  place-items: center;
  font-weight: 700;
}

.brand__text {
  font-family: 'Noto Sans', sans-serif;
  font-size: 1.25rem;
  letter-spacing: 0.02em;
}

.app-header__nav {
  display: flex;
  gap: 1rem;
}

.nav-link {
  text-decoration: none;
  color: #0f172a;
  font-weight: 600;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.05);
}

.nav-link.router-link-active {
  background: #0f172a;
  color: #f8f6ee;
}

@media (max-width: 960px) {
  .app-header__inner {
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .app-header__brand {
    flex: 1 1 auto;
  }

  :deep(.session-panel) {
    margin-left: auto;
  }
}
</style>
