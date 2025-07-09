<template>
  <div class="flex h-screen bg-[#FCFAF8] text-[#1d1c1c]">
    <div class="flex h-screen w-64 flex-col bg-white p-4">
      <NuxtLink to="/" class="font-serif font-bold pb-2">Contradiction·s</NuxtLink>
      <h3 class="font-bold pb-2">Espace interne</h3>
      <UNavigationMenu orientation="vertical" :items="items" class="data-[orientation=vertical]:w-48" color="primary" />
    </div>
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { NavigationMenuItem } from '@nuxt/ui'
import { useSupabaseClient, useSupabaseUser, useAsyncData } from '#imports'

// Fetch current member role
const client = useSupabaseClient()
const user = useSupabaseUser()
const { data: member } = await useAsyncData('currentMember', async () => {
  if (!user.value?.email) return null
  const { data } = await client.from('members').select('role').eq('email', user.value.email).single()
  return data
})
const isAdmin = computed(() => member.value?.role === 'admin')

// Base navigation items
const baseItems: NavigationMenuItem[] = [
  { label: 'Profil', icon: 'mingcute-user-1-line', to: '/internal/profile' },
  { label: 'Articles', icon: 'mingcute-news-line', to: '/internal/articles' },
  { label: 'Catégories', icon: 'mingcute-folder-2-line', to: '/internal/categories' },
  { label: 'La Veille', icon: 'mingcute-radar-line', to: '/internal/laveille' },
]

// Add Users panel for admins
if (isAdmin.value) {
  baseItems.push({ label: 'Utilisateurs', icon: 'mingcute-group-3-line', to: '/internal/users' })
}

const items = ref<NavigationMenuItem[][]>([baseItems])
</script>
