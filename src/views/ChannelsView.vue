<script setup lang="ts">
import { computed } from 'vue'
import { useForumStore } from '../stores/forum'
import ChannelList from '../components/ChannelList.vue'

const store = useForumStore()
const channels = computed(() => store.channels)
</script>

<template>
  <section class="page-hero">
    <div>
      <p class="eyebrow">Forum Hub</p>
      <h1>Keep conversations organized by channel.</h1>
      <p class="subtitle">
        Browse the topics below to post updates, ask questions, and keep project context in one
        place.
      </p>
    </div>
    <div class="page-hero__stats">
      <div class="stat-card">
        <span class="stat-card__value">{{ store.channelCount }}</span>
        <span class="stat-card__label">Active channels</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__value">{{ store.posts.length }}</span>
        <span class="stat-card__label">Total posts</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__value">{{ store.comments.length }}</span>
        <span class="stat-card__label">Threaded replies</span>
      </div>
    </div>
  </section>

  <section class="page-section">
    <ChannelList :channels="channels" />
  </section>
</template>

<style scoped>
.page-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2.5rem;
  align-items: center;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 2rem;
  padding: 2.5rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 30px 60px rgba(15, 23, 42, 0.08);
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.24em;
  font-size: 0.75rem;
  color: rgba(15, 23, 42, 0.6);
  margin-bottom: 0.8rem;
}

.page-hero h1 {
  font-size: 2.6rem;
  margin: 0 0 1rem;
  font-family: 'Fraunces', serif;
}

.subtitle {
  margin: 0;
  color: rgba(15, 23, 42, 0.7);
  max-width: 32rem;
}

.page-hero__stats {
  display: grid;
  gap: 1rem;
  min-width: 14rem;
}

.stat-card {
  background: #0f172a;
  color: #f8f6ee;
  border-radius: 1.2rem;
  padding: 1rem 1.2rem;
  display: grid;
  gap: 0.2rem;
}

.stat-card:nth-child(2) {
  background: #1d4ed8;
}

.stat-card:nth-child(3) {
  background: #047857;
}

.stat-card__value {
  font-size: 1.6rem;
  font-weight: 700;
}

.stat-card__label {
  font-size: 0.85rem;
  opacity: 0.8;
}

.page-section {
  margin-top: 2.5rem;
}

@media (max-width: 960px) {
  .page-hero {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .page-hero {
    padding: 1.8rem;
  }

  .page-hero h1 {
    font-size: 2rem;
  }
}
</style>
