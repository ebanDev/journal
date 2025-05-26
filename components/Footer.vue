<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-[#FFFDFD] shadow-t py-3 flex gap-1 justify-center z-50 flex-col items-center">
    <h1 class="text-sm font-serif text-gray-600">Contradiction<span class="text-primary-700">·</span>s</h1>
    <div class="flex justify-around items-center w-full">
      <NuxtLink
      v-for="item in navItems"
      :key="item.label"
      :to="item.href"
      class="flex flex-col items-center px-2 rounded transition-colors duration-200 bg-[#FFFDFD] w-18"
      :class="item.active ? 'text-primary-700' : 'text-gray-600'"
    >
      <div class="rounded-full w-full flex items-center justify-center mb-1 py-1" :class="item.active ? 'bg-primary-50' : ''">
        <Icon
        :name="item.active ? item.iconActive : item.icon"
        class="text-2xl transition-colors duration-200"
      />
      </div>
      <span class="text-xs font-semibold transition-colors duration-200">
        {{ item.label }}
      </span>
    </NuxtLink>
    </div>
  </nav>
</template>


<style scoped>
.shadow-t {
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.050);
}
</style>

<script setup lang="ts">
const currentPath = computed(() => useRoute().path);

const navItems = computed(() => [{
  href: '/',
  icon: 'mingcute-home-3-line',
  iconActive: 'mingcute-home-3-fill',
  label: 'Accueil',
  active: currentPath.value == '/'
}, {
  href: '/articles',
  icon: 'mingcute-news-line',
  iconActive: 'mingcute-news-fill',
  label: 'Articles',
  active: currentPath.value == '/articles' || currentPath.value.startsWith('/article/')
}, {
  href: '/la-veille',
  icon: 'mingcute-radar-line',
  iconActive: 'mingcute-radar-fill',
  label: 'La veille',
  active: currentPath.value == '/la-veille'
}, {
  href: '/search',
  icon: 'mingcute-search-line',
  iconActive: 'mingcute-search-3-fill',
  label: 'Recherche',
  active: currentPath.value == '/search'
}, {
  href: '/internal',
  icon: 'mingcute-user-4-line',
  iconActive: 'mingcute-user-4-fill',
  label: 'Compte',
  active: currentPath.value == '/internal' || currentPath.value.startsWith('/internal/') || currentPath.value == '/login'
}])
</script>
