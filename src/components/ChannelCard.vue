<script setup lang="ts">
import type { Channel } from '../types/forum'

defineProps<{ channel: Channel }>()
</script>

<template>
  <RouterLink :to="`/channels/${channel.slug}`" class="channel-card">
    <div class="channel-card__accent" :style="{ background: channel.accent }"></div>
    <div class="channel-card__content">
      <h3>{{ channel.name }}</h3>
      <p>{{ channel.description }}</p>
      <span class="channel-card__cta">Open channel →</span>
    </div>
  </RouterLink>
</template>

<style scoped>
.channel-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: #ffffff;
  border-radius: 1.25rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.06);
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.channel-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 30px 60px rgba(15, 23, 42, 0.08);
}

.channel-card__accent {
  width: 0.5rem;
  border-radius: 999px;
}

.channel-card__content h3 {
  margin: 0 0 0.4rem;
  font-size: 1.2rem;
}

.channel-card__content p {
  margin: 0 0 0.8rem;
  color: rgba(15, 23, 42, 0.7);
}

.channel-card__cta {
  font-weight: 600;
  color: rgba(15, 23, 42, 0.8);
}
</style>
