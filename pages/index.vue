<template>
  <div class="container mx-auto px-4 pt-4 md:py-8 flex flex-col lg:flex-row gap-4 lg:gap-12">
    <!-- À la une section -->
    <section class="flex-[3] w-full lg:w-auto">
      <h1 class="font-serif text-3xl md:text-4xl mb-1 md:mb-2">À la une</h1>
      <p v-if="latestEdition" class="text-gray-600 mb-3">Dernière édition : {{ latestEdition.title }}</p>
      <p v-else class="text-gray-600 mb-3">Aucune édition publiée</p>

      <div class="flex gap-4 flex-col justify-start pt-2">
        <div v-for="(article, index) in featuredArticles" :key="article.slug" class="group">
          <!-- Featured article card -->
          <NuxtLink :to="`/article/${article.slug}`">
            <div :class="['overflow-hidden flex flex-col md:flex-row md:gap-12 items-center bg-[var(--color-amber-150)] md:bg-transparent md:hover:bg-[var(--color-amber-150)] rounded-lg', index % 2 === 1 ? 'md:flex-row-reverse' : '']">
              <img v-if="article.cover" :src="article.cover" class="object-cover flex-none h-32 w-full md:h-auto md:w-1/3 aspect-square rounded-sm"
                :alt="article.title" />
              <div v-else class="w-full h-full bg-gray-100 flex items-center justify-center">
                <span class="text-gray-400">No image</span>
              </div>

              <div class="p-4">
                <div v-if="article.categories && article.categories.length" class="flex flex-wrap gap-2 mb-2">
                  <span v-for="cat in article.categories" :key="cat" class="text-xs sm:text-sm bg-secondary-300 py-1 px-2 rounded-full text-black">{{ cat }}</span>
                </div>
                <h2 class="font-serif text-base md:text-2xl font-medium mb-1 md:mb-3 text-black">
                  {{ article.title }} 
                </h2>
                <p class="hidden md:block text-gray-600 mb-4 text-sm leading-[1.3] !line-clamp-5">{{ article.description }}</p>
                <div class="text-xs text-gray-600">{{ formatDate(article.published_at) }}</div>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Separator -->
    <div class="hidden lg:block shrink-0 self-stretch w-px bg-gray-300"></div>

    <!-- La veille section -->
    <section class="flex-[1] w-full lg:flex-[1] lg:w-auto">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-serif text-2xl">La veille</h2>
        <NuxtLink to="/la-veille" class="text-sm hover:underline">Voir tout</NuxtLink>
      </div>
      <p class="text-gray-600 mb-6">Une sélection de contenus d'autres médias à lire, à écouter, à suivre.</p>

      <div class="space-y-2">
        <div v-for="item in veille" :key="item.id" class="group">
          <NuxtLink :to="item.url" target="_blank" class="block hover:bg-[var(--color-amber-150)] transition-colors rounded-lg">
            <div class="flex items-center gap-2">
              <div class="w-28 h-28 rounded-lg bg-gray-100 flex shrink-0 items-center justify-center">
                <img v-if="item.cover" :src="item.cover" class="object-cover rounded-lg w-full h-full" :alt="item.title" />
                <span v-else class="text-gray-400">No image</span>
              </div>
              <div class="flex flex-col gap-1 p-2">
                <span class="text-xs bg-secondary-300 block w-max py-1 px-2 rounded-full text-black">
                  {{ item.type }}
                </span>
                <h3 class="text-lg font-bold text-black line-clamp-2">{{ item.title }}</h3>
                <p class="text-gray-600 text-sm line-clamp-2">{{ item.source }}</p>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>

  <!-- Other articles section below -->
  <section class="container mx-auto mt-10 p-4">
    <h2 class="font-serif text-2xl mb-3">Autres articles</h2>
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div v-for="(article, idx) in limitedOtherArticles" :key="article.slug" class="group">
        <NuxtLink :to="`/articles/${article.slug}`">
          <div class="flex flex-col bg-white rounded-lg shadow hover:bg-[var(--color-amber-100)] transition-colors">
            <img v-if="article.cover" :src="article.cover" class="object-cover w-full h-32 rounded-t-lg" :alt="article.title" />
            <div class="p-3">
              <div v-if="article.categories && article.categories.length" class="flex flex-wrap gap-2 mb-1">
                <span v-for="cat in article.categories" :key="cat" class="text-xs bg-secondary-300 py-1 px-2 rounded-full text-black">{{ cat }}</span>
              </div>
              <h3 class="font-serif text-lg font-medium mb-1 text-black">{{ article.title }}</h3>
              <p class="text-gray-600 text-sm line-clamp-3">{{ article.description }}</p>
              <div class="text-xs text-gray-600 mt-2">{{ formatDate(article.published_at) }}</div>
            </div>
          </div>
        </NuxtLink>
      </div>
      <!-- Édition complète card -->
      <NuxtLink v-if="latestEdition" :to="`/issues/${latestEdition.slug}`" class="group relative">
        <div class="relative w-full h-48 md:h-64 rounded-lg overflow-hidden cursor-pointer">
          <img v-if="latestEdition.cover" :src="latestEdition.cover" class="absolute inset-0 w-full h-full object-cover" :alt="latestEdition.title" />
          <div class="absolute inset-0 bg-black/40 flex items-center justify-center flex-col text-center px-4 gap-4">
            <UBadge color="primary" size="lg">Voir plus</UBadge>
            <span class="font-serif text-2xl md:text-3xl font-bold text-white text-center drop-shadow-lg">{{ latestEdition.title }}</span>
          </div>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useSupabaseClient, useAsyncData } from '#imports'
import { useDb } from '~/composables/useDb'

// Interfaces
interface Article {
  title: string
  slug: string
  cover?: string
  description?: string
  categories?: string[]
  featured: boolean
  published_at: string
}
interface VeilleEntry {
  id: string
  title: string
  url?: string
  description?: string
  cover?: string
  source?: string
  type: string
}
interface Edition {
  title: string
  articles: Article[]
}

const { getIssues, getArticles } = useDb()
const client = useSupabaseClient()

function formatDate(date: string) {
  return new Date(date).toLocaleDateString()
}

// Fetch latest published edition using getIssues
const { data: latestEdition, refresh: refreshEdition } = await useAsyncData<Edition | null>('latestEdition', async () => {
  const issues = await getIssues()
  const published = (issues || []).filter((i: any) => i.status === 'published')
  if (!published.length) return null
  const editionId = published[0].id
  // Fetch articles with new schema fields
  published[0].articles = await getArticles(editionId)
  return published[0] as Edition
})

const featuredArticles = computed(() =>
  latestEdition.value?.articles?.filter(a => a.featured) || []
)
const otherArticles = computed(() =>
  latestEdition.value?.articles?.filter(a => !a.featured) || []
)

const articleLimit = ref(9)
onMounted(() => {
  const updateLimit = () => {
    articleLimit.value = window.innerWidth < 768 ? 3 : 9
  }
  updateLimit()
  window.addEventListener('resize', updateLimit)
})
onUnmounted(() => {
  window.removeEventListener('resize', () => {})
})
const limitedOtherArticles = computed(() => otherArticles.value.slice(0, articleLimit.value))

// Fetch latest veille entries (unchanged)
const { data: veille = [], refresh: refreshVeille } = await useAsyncData<VeilleEntry[]>('veille', async () => {
  const { data } = await client
    .from('laveille')
    .select('id, title, url, description, cover, source, type')
    .eq('status', 'approved')
    .order('submitted_at', { ascending: false })
    .limit(5)
  return data ?? []
})

let realtimeEditionChannel: RealtimeChannel
let realtimeVeilleChannel: RealtimeChannel
onMounted(() => {
  realtimeEditionChannel = client
    .channel('public:issues')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, () => refreshEdition())
    .subscribe()
  realtimeVeilleChannel = client
    .channel('public:laveille')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'laveille' }, () => refreshVeille())
    .subscribe()
})

onUnmounted(() => {
  client.removeChannel(realtimeEditionChannel)
  client.removeChannel(realtimeVeilleChannel)
})

useHead({
  title: 'Contradiction·s - À la une',
  meta: [
    { name: 'description', content: 'Dernière édition de Contradiction·s' },
    { property: 'og:title', content: 'Contradiction·s - À la une' },
    { property: 'og:description', content: 'Dernière édition de Contradiction·s' },
  ],
})
</script>
