<script setup lang="ts"></script>

<template>
  <section class="not-found">
    <p class="eyebrow">404</p>
    <h1>We lost this thread.</h1>
    <p>The page you requested does not exist yet. Try heading back to the channels list.</p>
    <RouterLink to="/channels" class="ghost-link">Back to channels</RouterLink>
  </section>
</template>

<style scoped>
.not-found {
  display: grid;
  gap: 1rem;
  padding: 3rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 2rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 30px 50px rgba(15, 23, 42, 0.08);
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.24em;
  font-size: 0.75rem;
  color: rgba(15, 23, 42, 0.6);
}

.not-found h1 {
  margin: 0;
  font-size: 2.2rem;
  font-family: 'Fraunces', serif;
}

.ghost-link {
  text-decoration: none;
  color: #0f172a;
  font-weight: 600;
}
</style>
