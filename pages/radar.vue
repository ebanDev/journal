<template>
  <div class="container max-w-4xl mx-auto p-4 space-y-4">
    <h1 class="text-3xl font-serif md:mt-4">Radar</h1>
    <p>
      Radar est un espace de partage d'articles, vidéos, podcasts et autres contenus intéressants. Vous pouvez soumettre vos trouvailles pour les partager avec la communauté.
    </p>
    <section>
      <!-- Send Article Form -->
      <div class="flex flex-col bg-secondary-300 p-3 rounded-lg mb-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-lg font-semibold pl-2">Envoyer un article</span>
          <div v-if="isProcessingSharedContent" class="flex items-center space-x-2 text-amber-600">
            <Icon name="mingcute:loading-line" class="animate-spin" />
            <span class="text-sm">Contenu partagé en cours...</span>
          </div>
        </div>
        <div class="flex">
          <UInput v-model="form.url"
            placeholder="https://www.contretemps.eu/pcf-marxisme-1960-1980-economie-marxiste/" class="flex-grow" />
          <UButton size="sm" @click="submitArticle" class="ml-2" :loading="fetchingMetadata" icon="tabler-send"
            :disabled="!form.url" />
        </div>
      </div>

      <!-- Filters -->
      <div class="flex space-x-4 mb-4">
        <USelect v-model="filter"
          :items="[
            { label: '7 jours', value: 'last7days' },
            { label: 'Ce mois-ci', value: 'thismonth' },
            { label: 'Cette année', value: 'thisyear' },
            { label: 'Tout le temps', value: 'alltime' },
          ]"
          placeholder="Filtrer" class="w-40" icon="tabler-filter" />
        <USelect v-model="sort"
          :items="[
            { label: 'Votes', value: 'votes' },
            { label: 'Date', value: 'date' }
          ]"
          placeholder="Trier" class="w-40" icon="tabler-arrows-sort" />
      </div>

      <ClientOnly>
        <div v-if="entries.length">
          <div v-for="item in displayedEntries" :key="item.id" class="flex items-start p-4 rounded-lg bg-white shadow mb-4">
            <!-- votes -->
            <div class="flex flex-col items-center mr-4">
              <UButton size="sm" :icon="votedIds.has(item.id) ? 'tabler-heart-off' : 'tabler-heart'"
                :color="votedIds.has(item.id) ? 'secondary' : 'primary'" @click="vote(item.id)" />
              <span class="mt-1 text-sm">{{ item.voteCount }}</span>
            </div>
            <!-- content -->
            <NuxtLink :to="item.url || '#'" target="_blank" class="flex-1">
              <div class="flex justify-between items-center">
                <h3 class="md:text-lg text-base font-medium">{{ item.title }}</h3>
                <h4 v-if="item.source" class="text-sm text-gray-600">{{ item.source }}</h4>
                <div class="flex items-center space-x-2">
                  <UBadge :label="item.type" color="secondary" />
                </div>
              </div>
              <p v-if="item.description" class="text-gray-600 mt-1 text-sm line-clamp-4">{{ item.description }}</p>
            </NuxtLink>
          </div>
        </div>
        <div v-else class="text-gray-500 text-center py-10">Aucun article trouvé.</div>
      </section>
    </div>
  </ClientOnly>

  <component v-model:open="openSubmitModal" title="Envoyer un article" :loading="fetchingMetadata" :is="isMobile ? UDrawer : UModal">
    <template #body>
      <div class="flex flex-col">
        <UFormField label="Titre" class="w-full">
          <UInput v-model="form.title" placeholder="Titre" class="mb-2 w-full" icon="tabler-pencil" />
        </UFormField>
        <UFormField label="URL" class="w-full mb-2">
          <div class="flex flex-row gap-2 items-center">
            <UInput v-model="form.url" placeholder="URL" class="w-full" icon="tabler-link" />
            <UButton size="sm" @click="fetchMetadata" class="ml-2 h-full" :loading="fetchingMetadata"
              icon="tabler-refresh" :disabled="!form.url" variant="outline" />
          </div>
        </UFormField>
        <UFormField label="Description" class="w-full" description="Un très court résumé de l'article.">
          <UTextarea v-model="form.description" placeholder="Description" class="mb-2 w-full" icon="tabler-align-left" />
        </UFormField>
        <UFormField label="Type" class="w-full">
          <USelect v-model="form.type"
            :items="[{ label: 'Article', value: 'article' }, {label: 'Livre', value: 'book'}, { label: 'Vidéo', value: 'video' }, { label: 'Podcast', value: 'podcast' }, { label: 'Autre', value: 'other' }]"
            placeholder="Sélectionner le type" class="mb-2 w-full" icon="tabler-category" />
        </UFormField>
        <div class="flex flex-row gap-2">
          <UFormField label="URL de l'image d'illustration" class="w-full">
            <UInput v-model="form.cover" placeholder="URL de l'image d'illustration" class="mb-2 w-full"
              icon="tabler-photo" />
          </UFormField>
          <img v-if="form.cover" :src="form.cover" alt="Aperçu de l'image" class="mt-2 w-auto h-12 rounded-lg" />
        </div>
        <UFormField label="Nom de la source" class="w-full">
          <UInput v-model="form.source" placeholder="Nom de la source" class="mb-2 w-full" icon="tabler-source-code" />
        </UFormField>
      </div>
    </template>
    <template #footer>
      <UButton label="Envoyer" @click="submitEntry" :loading="submitting" class="justify-center" />
      <UButton label="Annuler" @click="fetchingMetadata = false" color="secondary" class="justify-center" />
    </template>
  </component>
</template>

<script setup lang="ts">
import {UModal, UDrawer} from '#components'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { VeilleEntry, VeilleInsert } from '~/composables/useDb'
import { useOptimizedDb } from '~/composables/useOptimizedDb'

const toast = useToast()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const db = useDb()
const { getOptimizedVeille } = useOptimizedDb()

const entries = ref<VeilleEntry[]>([])
const loading = ref(false)
const form = reactive({ title: '', url: '', description: '', type: 'article', cover: '', source: '' })
const fetchingMetadata = ref(false)
const submitting = ref(false)
const submitError = ref<string | null>(null)
const submitted = ref(false)
const votedIds = ref<Set<string>>(new Set())
const openSubmitModal = ref(false)
const filter = ref('last7days')
const sort = ref('votes')
const isMobile = ref(false)
const isProcessingSharedContent = ref(false)

const filteredEntries = computed(() => {
  const now = new Date()
  return entries.value.filter(entry => {
    if (filter.value === 'last7days') {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(now.getDate() - 7)
      return new Date(entry.submitted_at) >= sevenDaysAgo
    } else if (filter.value === 'thismonth') {
      return new Date(entry.submitted_at).getMonth() === now.getMonth() &&
             new Date(entry.submitted_at).getFullYear() === now.getFullYear()
    } else if (filter.value === 'thisyear') {
      return new Date(entry.submitted_at).getFullYear() === now.getFullYear()
    } else {
      return true // 'alltime'
    }
  })
})

const displayedEntries = computed(() => {
  const list = filteredEntries.value.slice()
  if (sort.value === 'votes') {
    return list.sort((a, b) => {
      // Primary sort by vote count (descending)
      const voteDiff = b.voteCount - a.voteCount
      if (voteDiff !== 0) return voteDiff
      
      // Secondary sort by date (most recent first) when votes are equal
      return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    })
  } else if (sort.value === 'date') {
    return list.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
  }
  return list
})

function setFilter(newFilter: string) {
  filter.value = newFilter
}

async function fetchMetadata() {
  if (!form.url) return
  fetchingMetadata.value = true
  try {
    const { title, description, cover, source, error } = await $fetch<any>('/api/metadata', { params: { url: encodeURIComponent(form.url) } })
    if (error) {
      console.error('Metadata error:', error)
    } else {
      form.title = title || form.title
      form.description = description || form.description
      form.cover = cover || form.cover
      form.source = source || form.source
    }
  } catch (err) {
    console.error('Fetch metadata failed:', err)
  } finally {
    fetchingMetadata.value = false
  }
}

// SSR data fetching with optimized caching
const { data: ssrEntries, refresh: refreshEntries } = await getOptimizedVeille()
const { data: ssrVotedIds, refresh: refreshVotes } = await useAsyncData('veille-votes', async () => {
  const votes = await db.getUserVeilleVotes(user.value?.id)
  return Array.from(votes) // Convert Set to Array for serialization
}, {
  default: () => [],
  server: false // Votes are user-specific, only fetch on client
})

// Initialize reactive refs with SSR data
entries.value = ssrEntries.value || []
votedIds.value = new Set(ssrVotedIds.value || [])

// Keep fetchEntries for manual refreshes
async function fetchEntries() {
  await refreshEntries()
  await refreshVotes()
  entries.value = ssrEntries.value || []
  votedIds.value = new Set(ssrVotedIds.value || [])
}

async function submitEntry() {
  submitError.value = null
  submitted.value = false
  submitting.value = true
  
  const payload: VeilleInsert = {
    title: form.title,
    type: form.type,
    ...(form.url && { url: form.url }),
    ...(form.description && { description: form.description }),
    ...(form.cover && { cover: form.cover }),
    ...(form.source && { source: form.source })
  }
  
  try {
    await db.submitVeilleEntry(payload)
    submitted.value = true
    form.title = ''
    form.url = ''
    form.description = ''
    form.type = 'article'
    form.cover = ''
    form.source = ''
    openSubmitModal.value = false
    
    // Different message and behavior for authenticated vs anonymous users
    if (user.value) {
      // Authenticated user - auto-approved, refresh list immediately
      await fetchEntries()
      toast.add({
        title: 'Article publié',
        color: 'success',
        description: 'Votre article a été publié avec succès.',
        icon: 'mingcute-check-line',
      })
    } else {
      // Anonymous user - requires approval
      toast.add({
        title: 'Article soumis',
        color: 'success',
        description: 'Votre article a été soumis avec succès. Il sera examiné par notre équipe.',
        icon: 'mingcute-check-line',
      })
    }
  } catch (error: any) {
    submitError.value = error.message
    toast.add({
      title: 'Erreur',
      color: 'error',
      description: error.message,
      icon: 'mingcute-alert-line',
    })
  } finally {
    submitting.value = false
  }
}

let veilleChannel: RealtimeChannel
async function vote(id: string) {
  const isVoted = votedIds.value.has(id)
  
  try {
    if (isVoted) {
      await db.unvoteVeilleEntry(id, user.value?.id)
      // Update UI after successful database operation
      votedIds.value.delete(id)
      const entry = entries.value.find(e => e.id === id)
      if (entry) entry.voteCount--
    } else {
      await db.voteVeilleEntry(id, user.value?.id)
      // Update UI after successful database operation
      votedIds.value.add(id)
      const entry = entries.value.find(e => e.id === id)
      if (entry) entry.voteCount++
    }
  } catch (err) {
    console.error('Vote error:', err)
    toast.add({
      title: 'Erreur',
      color: 'error',
      description: 'Impossible de traiter votre vote. Veuillez réessayer.',
      icon: 'mingcute-alert-line',
    })
  }
}

async function submitArticle() {
  if (!form.url) return
  
  form.title = ''
  form.description = ''
  form.cover = ''
  form.source = ''
  await fetchMetadata()
  openSubmitModal.value = true
}

onMounted(() => {
  isMobile.value = window.innerWidth < 768
  
  // Check for shared content from URL parameters
  const route = useRoute()
  const sharedTitle = route.query.title as string
  const sharedText = route.query.text as string  
  const sharedUrl = route.query.url as string
  
  if (sharedUrl) {
    isProcessingSharedContent.value = true
    
    // Pre-fill form with shared data
    form.title = sharedTitle || ''
    form.url = sharedUrl
    form.description = sharedText || ''
    
    // Fetch metadata for shared URL and open modal
    fetchMetadata().then(() => {
      isProcessingSharedContent.value = false
      openSubmitModal.value = true
    }).catch(() => {
      isProcessingSharedContent.value = false
      openSubmitModal.value = true
    })
  }
  
  // Data is already available from SSR, no need to fetch again
  // Just set up realtime subscriptions
  veilleChannel = supabase
    .channel('public:laveille')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'laveille' }, (payload) => {
      if ((payload.new as any)?.status === 'approved') fetchEntries()
    })
    .subscribe()
  // Don't subscribe to vote changes to avoid conflicts with optimistic updates
  // Votes will be refreshed when the page is reloaded
})

onUnmounted(() => {
  supabase.removeChannel(veilleChannel)
})

// SEO setup
useSeoMeta({
  title: 'Radar - Sursaut!',
  description: 'Radar de Sursaut! : découvrez une sélection de contenus d\'autres médias à lire, à écouter, à suivre. Partagez et votez pour vos trouvailles.',
  keywords: 'veille, articles, médias, partage, Bordeaux, luttes sociales, politique',
  
  // Open Graph
  ogTitle: 'Radar - Sursaut!',
  ogDescription: 'Une sélection de contenus d\'autres médias à lire, à écouter, à suivre. Partagez et votez pour vos trouvailles.',
  ogImage: 'https://sursaut-revue.fr/icon-512x512.png',
  ogUrl: 'https://sursaut-revue.fr/radar',
  ogType: 'website',
  ogSiteName: 'Sursaut!',
  ogLocale: 'fr_FR',
  
  // Twitter
  twitterCard: 'summary_large_image',
  twitterTitle: 'Radar - Sursaut!',
  twitterDescription: 'Une sélection de contenus d\'autres médias à lire, à écouter, à suivre.',
  twitterImage: 'https://sursaut-revue.fr/icon-512x512.png',
})

// Canonical link
useHead({
  link: [
    { rel: 'canonical', href: 'https://sursaut-revue.fr/radar' }
  ]
})
</script>
