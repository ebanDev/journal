<template>
  <!-- Mobile profile experience -->
  <div class="md:hidden min-h-screen bg-[#FCFAF8] text-[#1d1c1c] flex flex-col pb-24">
    <div class="flex-1 overflow-y-auto">
      <div class="max-w-md mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6 pb-10">
        <header class="flex items-start justify-between">
          <div>
            <p class="font-serif text-2xl font-bold leading-tight">Sursaut!</p>
            <p class="text-sm text-gray-500">Espace interne</p>
          </div>
        </header>

        <div class="bg-white rounded-2xl shadow-sm p-6 space-y-6">
          <div class="flex flex-col items-center text-center gap-3">
            <div class="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-700 rounded-full flex items-center justify-center">
              <UIcon name="mingcute:user-1-line" class="w-8 h-8 text-white" />
            </div>
            <div>
              <p class="text-xl font-semibold text-gray-900">{{ profileName }}</p>
              <p class="text-sm text-gray-500">{{ profileEmail }}</p>
            </div>
            <UBadge :color="profileRoleColor" class="uppercase tracking-wide">{{ profileRoleLabel }}</UBadge>
          </div>

          <div class="space-y-4 text-sm">
            <div class="flex items-start justify-between gap-4">
              <p class="text-gray-500">Année universitaire</p>
              <p class="font-medium text-right text-gray-900">{{ profileUniYear }}</p>
            </div>
            <div class="flex items-start justify-between gap-4">
              <p class="text-gray-500">Téléphone</p>
              <p class="font-medium text-right text-gray-900">{{ profilePhone }}</p>
            </div>
          </div>

          <div class="rounded-xl bg-primary-50 text-primary-700 p-4 text-sm leading-relaxed">
            <p>Vous consultez une version simplifiée de votre profil.</p>
            <p class="mt-2">Les autres sections de l'espace interne sont disponibles depuis un ordinateur.</p>
            <p class="mt-2">Pour mettre à jour vos informations, utilisez l'espace interne sur desktop.</p>
          </div>

          <div class="flex flex-col gap-3">
            <AdminMembersSheet v-if="isAdmin" />
            <UButton
              variant="ghost"
              color="error"
              icon="mingcute-exit-line"
              @click="logout"
            >
              Se déconnecter
            </UButton>
          </div>
        </div>

        <p class="text-xs text-center text-gray-400">Besoin d'accéder à l'ensemble des outils&nbsp;? Connectez-vous depuis un ordinateur.</p>
      </div>
    </div>
    <TabBar class="md:hidden w-full shadow-t border-t border-gray-200" />
  </div>

  <!-- Desktop layout -->
  <div class="hidden md:flex h-screen bg-[#FCFAF8] text-[#1d1c1c] overflow-hidden">
    <div class="flex h-full w-56 flex-col bg-white p-4 border-r border-gray-200 flex-shrink-0">
      <NuxtLink to="/" class="font-serif font-bold pb-2">Sursaut!</NuxtLink>
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
import { useSupabaseClient, useSupabaseUser, useAsyncData, useToast } from '#imports'
import type { RealtimeChannel } from '@supabase/supabase-js'

// Fetch current member role
const client = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()

const { data: member, pending: memberPending } = await useAsyncData('currentMember', async () => {
  if (!user.value?.email) return null
  const { data } = await client
    .from('members')
    .select('email, full_name, role, uni_year, phone')
    .eq('email', user.value.email)
    .single()
  return data
})
const isAdmin = computed(() => member.value?.role === 'admin')
const isEditor = computed(() => member.value?.role === 'editor' || member.value?.role === 'admin')

const translateRole = (role?: string) => {
  switch (role) {
    case 'admin':
      return 'Administrateur'
    case 'editor':
      return 'Éditeur'
    default:
      return 'Membre'
  }
}

const profileName = computed(() => member.value?.full_name || user.value?.user_metadata?.full_name || 'Votre Profil')
const profileEmail = computed(() => member.value?.email || user.value?.email || 'Email indisponible')
const profileRoleLabel = computed(() => translateRole(member.value?.role) || 'Membre')
const profileUniYear = computed(() => memberPending.value ? 'Chargement...' : member.value?.uni_year || 'Non renseignée')
const profilePhone = computed(() => memberPending.value ? 'Chargement...' : member.value?.phone || 'Non renseigné')
const profileRoleColor = computed(() => {
  switch (member.value?.role) {
    case 'admin':
      return 'primary'
    case 'editor':
      return 'secondary'
    default:
      return 'secondary'
  }
})

async function logout() {
  const { error } = await client.auth.signOut()
  if (error) {
    toast.add({
      title: 'Erreur',
      description: `Impossible de vous déconnecter: ${error.message}`,
      color: 'error',
      icon: 'tabler:alert-triangle'
    })
    return
  }

  toast.add({
    title: 'Déconnecté',
    description: 'À bientôt sur Sursaut!',
    color: 'success',
    icon: 'tabler:check'
  })
  navigateTo('/')
}

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
    label: 'Radar', 
    icon: 'mingcute-radar-line', 
    to: '/internal/radar',
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
let laveilleChannel: RealtimeChannel | null = null

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
    laveilleChannel = null
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

<style scoped>
.shadow-t {
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}
</style>
