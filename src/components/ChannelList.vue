<script setup lang="ts">
import type { Channel } from '../types/forum'
import ChannelCard from './ChannelCard.vue'

defineProps<{ channels: Channel[] }>()
</script>

<template>
  <div class="channel-list">
    <ChannelCard v-for="channel in channels" :key="channel.id" :channel="channel" />
  </div>
</template>

<style scoped>
.channel-list {
  display: grid;
  gap: 1.5rem;
}
</style>
