<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-[#FFFDFD] shadow-t py-2 flex justify-around">
    <NuxtLink
      v-for="item in navItems"
      :key="item.label"
      :to="item.href"
      class="flex flex-col items-center p-2 rounded transition-colors duration-200"
      :class="item.active ? 'text-primary-700 bg-primary-50' : 'text-gray-600 bg-[#FFFDFD]'"
    >
      <Icon
        :name="item.icon"
        class="text-2xl mb-1 transition-colors duration-200"
      />
      <span class="text-xs font-semibold transition-colors duration-200">
        {{ item.label }}
      </span>
    </NuxtLink>
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
  icon: 'tabler-home',
  label: 'Accueil',
  active: currentPath.value == '/'
}, {
  href: '/articles',
  icon: 'tabler-news',
  label: 'Articles',
  active: currentPath.value == '/articles' || currentPath.value.startsWith('/article/')
}, {
  href: '/la-veille',
  icon: 'tabler-radar-2',
  label: 'La veille',
  active: currentPath.value == '/la-veille'
}, {
  href: '/search',
  icon: 'tabler-search',
  label: 'Recherche',
  active: currentPath.value == '/search'
}, {
  href: '/internal',
  icon: 'tabler-user-circle',
  label: 'Compte',
  active: currentPath.value == '/internal' || currentPath.value.startsWith('/internal/')
}])
</script>
