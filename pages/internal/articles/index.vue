<template>
  <div class="container mx-auto py-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Éditions</h1>
      <div class="flex gap-2">
        <UButton size="lg" to="/internal/issues/new">Nouvelle Édition</UButton>
        <UButton size="lg" to="/internal/articles/new">Nouvel Article</UButton>
      </div>
    </div>

    <div v-if="pendingEditions">
      <div class="space-y-4">
        <UPlaceholder class="h-6 w-1/3" />
        <div class="space-y-6">
          <UPlaceholder class="h-8 w-1/4" />
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <UPlaceholder class="h-40" />
            <UPlaceholder class="h-40" />
            <UPlaceholder class="h-40" />
          </div>
        </div>
      </div>
    </div>

    <div v-else>
      <div v-if="editions.length" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <UCard v-for="edition in editions" :key="edition.id">
          <template #header>
            <h3 class="text-lg font-medium">{{ edition.title }}</h3>
          </template>
          <div class="py-2">
            <p class="text-sm text-gray-700 mb-2">
              {{ edition.description || 'Pas de description' }}
            </p>
            <span class="text-sm bg-secondary-300 px-2 py-1 rounded-full text-black">{{ translateEditionStatus(edition.status) }}</span>
            <div class="text-xs text-gray-500 mt-1" v-if="edition.published_at">Publié : {{ edition.published_at ? new Date(edition.published_at).toLocaleDateString() : '—' }}</div>
          </div>
          <template #footer>
            <UButton size="sm" :to="`/internal/issues/${edition.id}`">Voir l’Édition</UButton>
          </template>
        </UCard>
      </div>
      <div v-else class="text-center text-gray-500 py-10">Aucune édition pour le moment.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useSupabaseClient, useAsyncData } from '#imports'

// Edition type
interface Edition {
  id: string
  title: string
  status: 'draft' | 'ready' | 'published'
  published_at: string | null
}

const supabase = useSupabaseClient()

// Load editions
const { data: editions = [], pending: pendingEditions, refresh: refreshEditions } = await useAsyncData<Edition[]>('editions', async () => {
  const { data, error } = await supabase
    .from('issues')
    .select('id, title, status, published_at, description')
    .order('published_at', { ascending: false })
  if (error) {
    console.error(error)
    return []
  }
  return data
})

let issuesChannel: RealtimeChannel
onMounted(() => {
  issuesChannel = supabase
    .channel('public:issues')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, () => refreshEditions())
    .subscribe()
})

onUnmounted(() => {
  supabase.removeChannel(issuesChannel)
})

const translateEditionStatus = (status: string) => {
  switch (status) {
    case 'draft':
      return 'Brouillon'
    case 'ready':
      return 'Prêt'
    case 'published':
      return 'Publié'
    default:
      return status
  }
}
</script>
