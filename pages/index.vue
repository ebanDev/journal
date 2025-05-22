<template>
  <div class="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-4 lg:gap-12">
    <!-- À la une section -->
    <section class="flex-[3] w-full lg:w-auto">
      <h1 class="font-serif text-4xl mb-2 md:pl-4">À la une</h1>
      <p v-if="latestEdition" class="text-gray-600 mb-3 pl-4">Dernière édition : {{ latestEdition.title }}</p>
      <p v-else class="text-gray-600 mb-3 md:pl-4">Aucune édition publiée</p>

      <div class="flex gap-2 flex-col justify-start">
        <div v-for="(article, index) in latestEdition?.articles || []" :key="article.metadata.slug" class="group">
          <!-- Featured article card -->
          <NuxtLink :to="`/article/${article.metadata.slug}`">
            <div :class="['overflow-hidden flex-col md:flex-row gap-12 items-center hover:bg-[var(--color-amber-150)] p-4 rounded-lg', index % 2 === 1 ? 'flex-col-reverse md:flex-row-reverse' : '']">
              <img v-if="article.metadata.cover" :src="article.metadata.cover" class="object-cover flex-none h-32 w-full md:h-auto md:w-1/3 aspect-square rounded-sm"
                :alt="article.title" />
              <div v-else class="w-full h-full bg-gray-100 flex items-center justify-center">
                <span class="text-gray-400">No image</span>
              </div>

              <div>
                <div class="text-sm bg-secondary-300 block w-max py-1 px-2 rounded-full text-black mb-2">Géopolitique</div>
                <h2 class="font-serif text-lg md:text-2xl font-medium mb-3 text-black">
                  {{ article.title }} 
                </h2>
                <p class="hidden md:block text-gray-600 mb-4 text-sm leading-[1.3] line-clamp-5">{{ article.metadata.description }}</p>
                <div class="text-xs text-gray-500">{{ formatDate(article.published_at) }}</div>
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

      <div class="space-y-0">
        <div v-for="item in veille" :key="item.id" class="group">
          <NuxtLink :to="item.url" target="_blank" class="block hover:bg-[var(--color-amber-150)] p-2 transition-colors rounded-lg">
            <div class="flex items-center gap-4">
              <div class="w-28 h-28 rounded-lg bg-gray-100 flex shrink-0 items-center justify-center">
                <img v-if="item.cover" :src="item.cover" class="object-cover rounded-lg w-full h-full" :alt="item.title" />
                <span v-else class="text-gray-400">No image</span>
              </div>
              <div class="flex flex-col gap-1">
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
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useSupabaseClient, useAsyncData } from '#imports'

// Interfaces
interface ArticleFeatured {
  title: string
  metadata: { slug: string; cover?: string; description?: string }
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
  articles: ArticleFeatured[]
}

// Supabase client
const client = useSupabaseClient()

// Date formatter
function formatDate(date: string) {
  return new Date(date).toLocaleDateString()
}

// Fetch latest published edition
const { data: latestEdition, refresh: refreshEdition } = await useAsyncData<Edition | null>('latestEdition', async () => {
  const { data: rawData } = await client
    .from('issues')
    .select('title, articles(title, metadata, published_at)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1)
    .single()
  return rawData ? (rawData as Edition) : null
})

// Fetch latest veille entries
const { data: veille = [], refresh: refreshVeille } = await useAsyncData<VeilleEntry[]>('veille', async () => {
  const { data } = await client
    .from('laveille')
    .select('id, title, url, description, cover, source, type')
    .eq('status', 'approved')
    .order('submitted_at', { ascending: false })
    .limit(5)
  return data ?? []
})

// Realtime subscriptions
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
</script>
