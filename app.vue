<template>
  <UApp>
    <VitePwaManifest />
    <NuxtLayout>
      <NuxtPage />
      <Analytics />
    </NuxtLayout>
    <PwaInstallPrompt />
  </UApp>
</template>

<script setup>
import { Analytics } from '@vercel/analytics/nuxt';
</script>
