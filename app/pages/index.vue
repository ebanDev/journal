<template>
  <div class="container mx-auto px-4 pt-4 md:py-8 flex flex-col lg:flex-row gap-4 lg:gap-12">
    <!-- À la une section -->
    <section class="flex-[3] w-full lg:w-auto">
      <h2 class="font-serif text-3xl md:text-4xl mb-1 md:mb-2">À la une</h2>

      <div class="flex gap-4 flex-col justify-start pt-2">
        <div v-if="latestArticle" class="group">
          <NuxtLink :to="`/${latestArticle.slug}`">
            <div
              class="overflow-hidden flex flex-col md:flex-row md:gap-12 items-center bg-[var(--color-amber-150)] md:bg-transparent md:hover:bg-[var(--color-amber-150)] rounded-lg">
              <img v-if="latestArticle.cover" :src="latestArticle.cover"
                class="object-cover flex-none h-32 w-full md:h-auto md:w-1/3 aspect-square rounded-sm"
                :alt="latestArticle.title" />
              <div v-else class="w-full h-full bg-gray-100 flex items-center justify-center">
                <span class="text-gray-400">No image</span>
              </div>

              <div class="p-4">
                <div v-if="latestArticle.categories && latestArticle.categories.length" class="flex flex-wrap gap-2 mb-2">
                  <UBadge v-for="cat in latestArticle.categories" :key="cat.name" color="secondary" :label="cat.name"
                    :icon="cat.icon ? 'mingcute:' + cat.icon : undefined" />
                </div>
                <h2 class="font-serif text-base md:text-2xl font-medium mb-1 md:mb-3 text-black">
                  {{ latestArticle.title }}
                </h2>
                <p class="hidden md:block text-gray-600 mb-4 text-sm leading-[1.3] !line-clamp-5">{{ latestArticle.description
                  }}</p>
                <div class="text-xs text-gray-600" v-if="latestArticle.published_at">{{ formatDate(latestArticle.published_at) }}
                </div>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Separator -->
    <div class="hidden lg:block shrink-0 self-stretch w-px bg-gray-300"></div>

    <!-- Radar section -->
    <section class="flex-[1] w-full lg:flex-[1] lg:w-auto">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-serif text-3xl md:text-2xl">Radar</h2>
        <NuxtLink to="/radar" class="text-sm hover:underline">Voir tout</NuxtLink>
      </div>
      <p class="text-gray-600 mb-6">Une sélection de contenus d'autres médias à lire, à écouter, à suivre.</p>

      <div class="space-y-2">
        <div v-for="item in veille" :key="item.id" class="group">
          <NuxtLink :to="item.url || ''" target="_blank"
            class="block hover:bg-[var(--color-amber-150)] transition-colors rounded-lg">
            <div class="flex items-center gap-2">
              <div v-if="item.cover" class="size-20 md:size-28 rounded-lg bg-gray-100 flex shrink-0 items-center justify-center">
                <img :src="item.cover" class="object-cover rounded-lg w-full h-full"
                  :alt="item.title" />
              </div>
              <div class="flex flex-col gap-1 p-2">
                <UBadge v-if="item.type" color="secondary" :label="item.type" class="w-max" />
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
  <section class="container mx-auto mt-10 p-4 hidden md:block">
    <h2 class="font-serif text-3xl md:text-4xl mb-8 md:text-center">Autres articles</h2>
    <ArticlesWall :articles="limitedOtherArticles" :width="300" :gap="16" :coverFrequency="2" />
  </section>

  <section class="container mx-auto mt-10 p-4">
    <h2 class="font-serif text-3xl md:text-4xl mb-8 md:text-center">Catégories</h2>
    <div class="relative">
      <div class="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4">
        <NuxtLink v-for="cat in categories" :key="cat.id"
          :to="`/category/${cat.name.toLowerCase().replace(/\s+/g, '-')}`"
          class="group rounded-lg min-w-[260px] max-w-xs h-64 flex flex-col items-center justify-between shadow-sm snap-center relative overflow-hidden">
          <div v-if="cat.cover" class="absolute inset-0 w-full h-full">
            <img :src="cat.cover" :alt="cat.name"
              class="object-cover w-full h-full transition-transform group-hover:scale-105 duration-200" />
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

</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue'
import { useSupabaseClient, useAsyncData } from '#imports'
import { useOptimizedDb } from '~/composables/useOptimizedDb'

const { getOptimizedCategoriesWithArticles, getLatestArticles } = useOptimizedDb()
const client = useSupabaseClient()

// Use optimized data fetching with SSR and caching
const { data: categories } = await getOptimizedCategoriesWithArticles()
const { data: latestArticles } = await getLatestArticles()

function formatDate(date: string) {
  return new Date(date).toLocaleDateString()
}

// Computed properties for article display
const latestArticle = computed(() => latestArticles.value?.[0] || null)

const limitedOtherArticles = computed(() => {
  const allArticles = latestArticles.value || []
  return allArticles.slice(1, articleLimit.value + 1)
})

// Reactive variables for responsive behavior
const articleLimit = ref(9)

// Resize handler for responsive article display
onMounted(() => {
  const resizeHandler = () => {
    articleLimit.value = window.innerWidth < 768 ? 3 : 9
  }
  resizeHandler()
  window.addEventListener('resize', resizeHandler)
  
  onUnmounted(() => {
    window.removeEventListener('resize', resizeHandler)
  })
})

// Fetch latest veille entries (cached)
const { data: veille } = await useAsyncData('homepage-veille', async () => {
  const { data } = await client
    .from('laveille')
    .select('id, title, url, description, cover, source, type')
    .eq('status', 'approved')
    .order('submitted_at', { ascending: false })
    .limit(5)
  return data ?? []
}, {
  default: () => [],
  server: true
})

useSeoMeta({
  title: 'Sursaut!, le journal des luttes de Bordeaux',
  description: 'Le journal des luttes de Bordeaux, un espace pour partager et documenter les luttes sociales et politiques. Découvrez nos derniers articles.',
  keywords: 'Bordeaux, luttes sociales, politique, journal, actualité, analyses, Sursaut!',
  
  // Open Graph
  ogTitle: 'Sursaut!, le journal des luttes de Bordeaux',
  ogDescription: 'Le journal des luttes de Bordeaux, un espace pour partager et documenter les luttes sociales et politiques.',
  ogImage: 'https://sursaut-revue.fr/icon-512x512.png',
  ogUrl: 'https://sursaut-revue.fr',
  ogType: 'website',
  ogSiteName: 'Sursaut!',
  ogLocale: 'fr_FR',
  
  // Twitter
  twitterCard: 'summary_large_image',
  twitterTitle: 'Sursaut!, le journal des luttes de Bordeaux',
  twitterDescription: 'Le journal des luttes de Bordeaux, un espace pour partager et documenter les luttes sociales et politiques.',
  twitterImage: 'https://sursaut-revue.fr/icon-512x512.png',
})

// Canonical link
useHead({
  link: [
    { rel: 'canonical', href: 'https://sursaut-revue.fr' }
  ]
})
</script>

<style>
.swiper-slide-shadow-coverflow {
  background: rgba(0, 0, 0, 0.4);
  border-radius: .5rem;
  transition: background 0.15s ease;
}
</style>
