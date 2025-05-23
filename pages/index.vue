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
          <NuxtLink :to="`/articles/${article.slug}`">
            <div
              :class="['overflow-hidden flex flex-col md:flex-row md:gap-12 items-center bg-[var(--color-amber-150)] md:bg-transparent md:hover:bg-[var(--color-amber-150)] rounded-lg', index % 2 === 1 ? 'md:flex-row-reverse' : '']">
              <img v-if="article.cover" :src="article.cover"
                class="object-cover flex-none h-32 w-full md:h-auto md:w-1/3 aspect-square rounded-sm"
                :alt="article.title" />
              <div v-else class="w-full h-full bg-gray-100 flex items-center justify-center">
                <span class="text-gray-400">No image</span>
              </div>

              <div class="p-4">
                <div v-if="article.categories && article.categories.length" class="flex flex-wrap gap-2 mb-2">
                  <UBadge v-for="cat in article.categories" :key="cat.name"
                    color="secondary"
                    :label="cat.name" :icon="cat.icon ? 'mingcute:' + cat.icon : undefined" />
                </div>
                <h2 class="font-serif text-base md:text-2xl font-medium mb-1 md:mb-3 text-black">
                  {{ article.title }}
                </h2>
                <p class="hidden md:block text-gray-600 mb-4 text-sm leading-[1.3] !line-clamp-5">{{ article.description
                  }}</p>
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
          <NuxtLink :to="item.url" target="_blank"
            class="block hover:bg-[var(--color-amber-150)] transition-colors rounded-lg">
            <div class="flex items-center gap-2">
              <div class="w-28 h-28 rounded-lg bg-gray-100 flex shrink-0 items-center justify-center">
                <img v-if="item.cover" :src="item.cover" class="object-cover rounded-lg w-full h-full"
                  :alt="item.title" />
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
    <h1 class="font-serif text-3xl md:text-4xl mb-8 text-center">Autres articles</h1>
    <masonry-wall :items="limitedOtherArticles" :column-width="300" :gap="16">
      <template #default="{ item: article, index: idx }">
        <NuxtLink :to="`/articles/${article.slug}`" class="group">
          <div class="bg-secondary-100 hover:bg-[var(--color-amber-200)] transition-colors rounded-lg">
            <img v-if="idx % 2 === 0 && article.cover" :src="article.cover"
              class="object-cover w-full h-40 rounded-t-lg" :alt="article.title" />
            <div class="p-3">
              <div v-if="article.categories && article.categories.length" class="flex flex-wrap gap-2 mb-1">
                <UBadge v-for="cat in article.categories" :key="cat.name"
                  color="secondary"
                  :label="cat.name" :icon="cat.icon ? 'mingcute:' + cat.icon : undefined" />
              </div>
              <h3 class="font-extrabold text-lg mb-1 text-black">{{ article.title }}</h3>
              <p class="text-gray-600 text-sm line-clamp-3">{{ article.description }}</p>
            </div>
          </div>
        </NuxtLink>
      </template>
    </masonry-wall>
  </section>
  <section class="container mx-auto mt-10 p-4">
    <h1 class="font-serif text-3xl md:text-4xl mb-8 text-center">Catégories</h1>
    <div class="relative">
      <div class="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4">
        <NuxtLink v-for="cat in categories" :key="cat.id" :to="`/articles?category=${cat.slug}`"
          class="group rounded-lg min-w-[260px] max-w-xs h-64 flex flex-col items-center justify-between shadow-sm snap-center relative overflow-hidden">
          <div v-if="cat.cover" class="absolute inset-0 w-full h-full">
            <img :src="cat.cover" :alt="cat.name" class="object-cover w-full h-full transition-transform group-hover:scale-105 duration-200" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
          </div>
          <div class="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-2 py-4 text-white z-10">
            <div class="flex items-center gap-2 text-xl">
              <Icon :name="'mingcute:' + cat.icon" />
              <span class="font-bold text-center">{{ cat.name }}</span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>
  </section>
  <section class="container mx-auto mt-10 p-4 pb-12">
    <h2 class="font-serif text-3xl md:text-4xl mb-8 text-center">Éditions</h2>
    <!-- A swiper --->
    <ClientOnly>
      <swiper-container :slidesPerView="'auto'" :centeredSlides="true"
        :grabCursor="true" :effect="'coverflow'" :initialSlide="1"
        :coverflowEffect="{ rotate: 0, stretch: 0, depth: 100, modifier: 1, scale: .9, slideShadows: true }"
        >
        <swiper-slide v-for="issue in issues" :key="issue.id" class="flex justify-center w-auto max-w-[80%] h-auto">
          <NuxtLink :to="`/issues/${issue.slug}`"
            class="bg-secondary-100 hover:bg-[var(--color-amber-200)] transition-colors rounded-lg p-3 h-auto">
            <img v-if="issue.cover" :src="issue.cover" class="object-contain w-auto h-auto max-w-full max-h-128 rounded-t-lg"
              :alt="issue.title" />
          </NuxtLink>
        </swiper-slide>
      </swiper-container>
    </ClientOnly>
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

const { getIssues, getArticles, getCategories } = useDb()
const client = useSupabaseClient()

const issues = await getIssues() as Array<{ id: string; slug: string; cover?: string; title: string }>
const categories = await getCategories() as Array<{ id: string; slug: string; name: string }>

function formatDate(date: string) {
  return new Date(date).toLocaleDateString()
}

// Fetch latest published edition using getIssues
const { data: latestEdition, refresh: refreshEdition } = await useAsyncData<Edition | null>('latestEdition', async () => {
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
  window.removeEventListener('resize', () => { })
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

<style>
.swiper-slide-shadow-coverflow {
  background: rgba(0, 0, 0, 0.4);
  border-radius: .5rem;
  transition: background 0.15s ease;
}
</style>
