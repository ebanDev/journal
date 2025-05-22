<template>
  <div class="flex h-screen">
    <div class="flex h-screen w-64 flex-col bg-secondary-50 p-4">
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
  { label: 'Articles', icon: 'tabler-news', to: '/internal/articles' },
  { label: 'La Veille', icon: 'tabler-radar-2', to: '/internal/laveille' },
  { label: 'Profil', icon: 'tabler-user', to: '/internal/profile' },
]

// Add Users panel for admins
if (isAdmin.value) {
  baseItems.push({ label: 'Utilisateurs', icon: 'tabler-users', to: '/internal/users' })
}

const items = ref<NavigationMenuItem[][]>([ baseItems ])
</script>
