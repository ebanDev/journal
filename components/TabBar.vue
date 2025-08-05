<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-[#FFFDFD] py-3 flex gap-1 justify-center z-150 flex-col items-center">
    <span class="text-base font-serif text-gray-800">Sursaut<span class="text-primary-600">!</span></span>
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

<script setup lang="ts">
const currentPath = computed(() => useRoute().path);
const { prefetchEssentialData } = useOptimizedDb()

// Preload all essential data and routes when TabBar mounts for instant navigation
onMounted(() => {
  // Preload all TabBar routes immediately
  const routes = ['/', '/articles', '/la-veille', '/search']
  routes.forEach(route => {
    preloadRouteComponents(route).catch(() => {})
  })
  
  // Prefetch essential data
  prefetchEssentialData()
})

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
  href: '/radar',
  icon: 'mingcute-radar-line',
  iconActive: 'mingcute-radar-fill',
  label: 'Radar',
  active: currentPath.value == '/radar'
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
