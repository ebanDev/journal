<template>
  <!-- Mobile warning message -->
  <div class="md:hidden flex flex-col items-center justify-center h-screen bg-[#FCFAF8] text-[#1d1c1c] p-6">
    <div class="text-center max-w-sm">
      <div class="mb-6">
        <UIcon name="mingcute-computer-line" class="text-6xl text-gray-400 mx-auto mb-4" />
      </div>
      <h2 class="text-2xl font-serif font-bold text-gray-800 mb-4">
        Espace interne
      </h2>
      <p class="text-gray-600 mb-6 leading-relaxed">
        L'espace interne de <strong>Contradiction·s</strong> est conçu pour un usage sur ordinateur.
      </p>
      <p class="text-sm text-gray-500 mb-8">
        Veuillez vous connecter depuis un ordinateur pour accéder à toutes les fonctionnalités.
      </p>
      <UButton 
        to="/" 
        variant="outline" 
        color="primary"
        icon="mingcute-arrow-left-line"
        class="w-full"
      >
        Retour à l'accueil
      </UButton>
    </div>
  </div>

  <!-- Desktop layout -->
  <div class="hidden md:flex h-screen bg-[#FCFAF8] text-[#1d1c1c] overflow-hidden">
    <div class="flex h-full w-56 flex-col bg-white p-4 border-r border-gray-200 flex-shrink-0">
      <NuxtLink to="/" class="font-serif font-bold pb-2">Contradiction·s</NuxtLink>
      <h3 class="font-bold pb-2">Espace interne</h3>
      <UNavigationMenu orientation="vertical" :items="items" class="data-[orientation=vertical]:w-48" color="primary" />
    </div>
    <div class="flex-1 min-w-0 h-full overflow-hidden">
      <NuxtPage />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { NavigationMenuItem } from '@nuxt/ui'
import { useSupabaseClient, useSupabaseUser, useAsyncData } from '#imports'
import type { RealtimeChannel } from '@supabase/supabase-js'

// Fetch current member role
const client = useSupabaseClient()
const user = useSupabaseUser()
const { data: member } = await useAsyncData('currentMember', async () => {
  if (!user.value?.email) return null
  const { data } = await client.from('members').select('role').eq('email', user.value.email).single()
  return data
})
const isAdmin = computed(() => member.value?.role === 'admin')
const isEditor = computed(() => member.value?.role === 'editor' || member.value?.role === 'admin')

// Fetch pending submissions count for editors/admins with real-time updates
const { data: pendingCount, refresh: refreshPendingCount } = await useAsyncData('pendingLaveilleCount', async () => {
  if (!isEditor.value) return 0
  const { count } = await client
    .from('laveille')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
  return count || 0
}, {
  default: () => 0
})

// Base navigation items
const baseItems: NavigationMenuItem[] = [
  { label: 'Profil', icon: 'mingcute-user-1-line', to: '/internal/profile' },
  { label: 'Articles', icon: 'mingcute-news-line', to: '/internal/articles' },
  { label: 'Catégories', icon: 'mingcute-folder-2-line', to: '/internal/categories' },
  { 
    label: 'La Veille', 
    icon: 'mingcute-radar-line', 
    to: '/internal/laveille',
    ...(isEditor.value && pendingCount.value > 0 && {
      badge: pendingCount.value.toString()
    })
  },
]

// Add Users panel for admins
if (isAdmin.value) {
  baseItems.push({ label: 'Utilisateurs', icon: 'mingcute-group-3-line', to: '/internal/users' })
}

const items = ref<NavigationMenuItem[][]>([baseItems])

// Real-time subscription for laveille changes
let laveilleChannel: RealtimeChannel

onMounted(() => {
  if (isEditor.value) {
    laveilleChannel = client
      .channel('public:laveille')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'laveille',
        filter: 'status=eq.pending'
      }, () => {
        // Refresh the pending count when laveille table changes
        refreshPendingCount()
      })
      .subscribe()
  }
})

onUnmounted(() => {
  if (laveilleChannel) {
    client.removeChannel(laveilleChannel)
  }
})

// Watch for pendingCount changes to update the navigation items
watch(pendingCount, (newCount) => {
  const laveilleItem = baseItems.find(item => item.to === '/internal/laveille')
  if (laveilleItem && isEditor.value) {
    if (newCount > 0) {
      laveilleItem.badge = newCount.toString()
    } else {
      delete laveilleItem.badge
    }
    // Force reactivity update
    items.value = [baseItems]
  }
})
</script>
