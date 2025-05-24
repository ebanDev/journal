<template>
  <div class="bg-[#FCFAF8] pb-20 min-h-screen flex flex-col items-center overflow-x-hidden">
    <div class="hidden md:block">
      <Header />
    </div>
    <NuxtPage />
    <div class="md:hidden w-full">
      <Footer />
    </div>
  </div>
</template>

<script setup lang="ts">
import Header from '~/components/Header.vue'
import Footer from '~/components/Footer.vue'
</script>
