<template>
  <Analytics />
  <UApp>
    <VitePwaManifest />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <PwaInstallPrompt />
  </UApp>
</template>

<script setup>
import { Analytics } from '@vercel/analytics/nuxt';
</script>
