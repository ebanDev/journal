<template>
  <div class="container mx-auto p-4 space-y-4">
    <h1 class="text-3xl font-serif">Les articles</h1>
    <div class="flex md:flex-row flex-col gap-4">
      <!-- Mobile: Button to open filters drawer -->
      <div class="block md:hidden mb-4 w-full">
        <UButton label="Filtrer" icon="mingcute-filter-line" @click="drawerOpen = true" size="lg" class="w-full justify-center" />
      </div>
      <!-- Desktop: Sidebar filters -->
      <div class="hidden md:block w-86 shrink-0 bg-secondary-200 rounded-lg p-4 h-full">
        <h2 class="text-xl font-bold mb-4">Filtrer</h2>
        <UTabs v-model="activeTab" :items="tabs" class="w-full" :content="false" />
        <div class="mt-4" v-if="activeTab === '0'">
          <ul class="grid grid-cols-2 gap-2">
            <li v-for="category in categories" :key="category.id" class="group relative w-full h-full aspect-square"
              @click="toggleFilter({ type: 'category', id: category.id, label: category.name })">
              <img :src="category.cover" alt="Category Image"
                class="w-full h-auto aspect-square object-cover rounded-lg mb-2 absolute inset-0" />
                <div class="absolute inset-0 opacity-75 bg-black group-hover:opacity-60 rounded-lg transition-all duration-150 pointer-events-none"
                :class="{ 'bg-primary-800 !opacity-60': filters.some(f => f.type === 'category' && f.id === category.id) }" ></div>
                <h3
                class="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-center h-full z-10 font-bold text-lg text-white cursor-pointer">
                {{ category.name }}</h3>
            </li>
          </ul>
        </div>
        <div class="mt-4" v-else>
          <ul class="space-y-2">
            <li v-for="issue in issues" :key="issue.id" class="flex items-center"
              @click="toggleFilter({ type: 'issue', id: issue.id, label: issue.title })">
              <div
                class="flex items-center gap-2 p-2 bg-white rounded-lg shadow hover:bg-secondary-100 w-full cursor-pointer transition-all duration-150"
                :class="{ '!bg-primary-500 !text-white': filters.some(f => f.type === 'issue' && f.id === issue.id) }">
                <img v-if="issue.cover" :src="issue.cover" class="w-16 h-16 object-cover rounded-md"
                  :alt="issue.title" />
                <div>
                  <h3 class="font-bold">{{ issue.title }}</h3>
                  <p class="text-sm text-gray-600" :class=" {'!text-gray-200' : filters.some(f => f.type ==='issue' && f.id === issue.id)}">{{ formatDate(issue.published_at) }}</p>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
      <!-- Mobile: UDrawer for filters -->
      <UDrawer v-model:open="drawerOpen" class="md:hidden">
        <template #content>
          <div class="p-4">
            <h2 class="text-xl font-bold mb-4">Filtrer</h2>
            <UTabs v-model="activeTab" :items="tabs" class="w-full" :content="false" />
            <div class="mt-4" v-if="activeTab === '0'">
              <ul class="grid grid-cols-2 gap-2">
                <li v-for="category in categories" :key="category.id" class="group relative w-full h-full aspect-square"
                  @click="toggleFilter({ type: 'category', id: category.id, label: category.name })">
                  <img :src="category.cover" alt="Category Image"
                    class="w-full h-auto aspect-square object-cover rounded-lg mb-2 absolute inset-0" />
                  <div class="absolute inset-0 opacity-75 bg-black group-hover:opacity-60 rounded-lg transition-all duration-150 pointer-events-none"
                    :class="{ 'bg-primary-800 !opacity-60': filters.some(f => f.type === 'category' && f.id === category.id) }"></div>
                  <h3
                    class="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-center h-full z-10 font-bold text-xl text-white cursor-pointer">
                    {{ category.name }}</h3>
                </li>
              </ul>
            </div>
            <div class="mt-4" v-else>
              <ul class="space-y-2">
                <li v-for="issue in issues" :key="issue.id" class="flex items-center"
                  @click="toggleFilter({ type: 'issue', id: issue.id, label: issue.title })">
                  <div
                    class="flex items-center gap-2 p-2 bg-white rounded-lg shadow hover:bg-secondary-100 w-full cursor-pointer transition-all duration-150"
                    :class="{ '!bg-primary-500 !text-white': filters.some(f => f.type === 'issue' && f.id === issue.id) }">
                    <img v-if="issue.cover" :src="issue.cover" class="w-16 h-16 object-cover rounded-md"
                      :alt="issue.title" />
                    <div>
                      <h3 class="font-bold">{{ issue.title }}</h3>
                      <p class="text-sm text-gray-600" :class=" {'!text-gray-200' : filters.some(f => f.type ==='issue' && f.id === issue.id)}">{{ formatDate(issue.published_at) }}</p>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </template>
      </UDrawer>
      <div class="w-full">
        <div class="flex items-center gap-2 mb-4 flex-wrap">
          <span class="flex items-center gap-2 text-lg font-bold">
            <Icon name="mingcute-filter-line" />
            Filtres :
          </span>
          <UBadge v-for="filter in filters" :key="filter.id" class="cursor-pointer group relative hover:bg-primary-600"
            color="primary" :label="filter.label"  @click="filters.splice(filters.indexOf(filter), 1)"
            :icon="filter.type === 'category' ? 'mingcute-folder-2-line' : 'mingcute-calendar-2-line'" >
            <template #trailing>
              <Icon name="tabler-x" class="text-white transition-colors" />
            </template>
          </UBadge>
          <UBadge v-if="filters.length === 0" color="secondary" label="Aucun"
            class="cursor-default" />
        </div>

        <ArticlesWall v-if="articles.length > 0" :articles="articles" />
        <div v-else class="text-center text-gray-500 mt-8 w-full h-full flex flex-col items-center justify-center">
          <Icon name="mingcute-sad-line" class="text-4xl mb-2" />
          <p>Aucun article trouvé avec les filtres sélectionnés.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAsyncData } from '#imports'
const { getIssues, getArticles, getCategories } = useDb()

const tabs = [
  { label: 'Catégories', icon: 'mingcute-folder-2-line' },
  { label: 'Éditions', icon: 'mingcute-calendar-2-line' },
]

const activeTab = ref('0')
const filters = ref<any[]>([])
const drawerOpen = ref(false)

const { data: ssrIssues } = await useAsyncData('issues', getIssues)
const { data: ssrCategories } = await useAsyncData('categories', getCategories)
const { data: ssrArticles } = await useAsyncData('articles', () => getArticles([]))

const issues = ref<any[]>(ssrIssues.value || [])
const categories = ref<any[]>(ssrCategories.value || [])
const articles = ref<any[]>(ssrArticles.value || [])

function toggleFilter(filter: any) {
  if (!filters.value.some(f => f.type === filter.type && f.id === filter.id)) {
    filters.value.push(filter)
  } else {
    filters.value = filters.value.filter(f => f.type !== filter.type || f.id !== filter.id)
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Fetch articles with current filters (client only)
async function fetchArticles() {
  const filterParams = filters.value.map((f: any) => ({ type: f.type, id: f.id }))
  articles.value = await getArticles(filterParams)
}

watch(filters, fetchArticles, { deep: true })

// SEO setup
useSeoMeta({
  title: 'Tous les articles - Contradiction·s',
  description: 'Parcourez tous les articles de Contradiction·s, le journal des luttes de Bordeaux. Découvrez nos analyses, reportages et réflexions sur les luttes sociales et politiques.',
  keywords: 'articles, Bordeaux, luttes sociales, politique, journal, actualité, analyses',
  
  // Open Graph
  ogTitle: 'Tous les articles - Contradiction·s',
  ogDescription: 'Parcourez tous les articles de Contradiction·s, le journal des luttes de Bordeaux. Découvrez nos analyses, reportages et réflexions sur les luttes sociales et politiques.',
  ogImage: 'https://contradictions.org/icon-512x512.png',
  ogUrl: 'https://contradictions.org/articles',
  ogType: 'website',
  ogSiteName: 'Contradiction·s',
  ogLocale: 'fr_FR',
  
  // Twitter
  twitterCard: 'summary_large_image',
  twitterTitle: 'Tous les articles - Contradiction·s',
  twitterDescription: 'Parcourez tous les articles de Contradiction·s, le journal des luttes de Bordeaux.',
  twitterImage: 'https://contradictions.org/icon-512x512.png',
})

// Canonical link
useHead({
  link: [
    { rel: 'canonical', href: 'https://contradictions.org/articles' }
  ]
})

</script>
