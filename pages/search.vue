<template>
  <div class="container max-w-3xl mx-auto p-4">
    <h1 class="font-serif text-3xl md:text-4xl mb-4">Recherche</h1>
    <UInput
      class="w-full mb-4"
      v-model="searchQuery"
      @input="onSearch"
      placeholder="Rechercher..."
      icon="tabler-search"
      variant="outline"
      ref="searchInput"
    />
    <div v-if="articles.length" class="space-y-2">
      <div v-for="item in articles" :key="item.slug">
        <NuxtLink :to="`/articles/${item.slug}`">
          <div class="group overflow-hidden hover:bg-[var(--color-amber-150)] rounded-lg flex flex-col p-2 items-center sm:flex-row gap-4">
            <img v-if="item.cover" :src="item.cover" alt="" class="w-32 h-32 object-cover rounded-lg"/>
            <div class="flex-1">
              <div v-if="item.category" class="text-sm bg-secondary-300 inline-block py-1 px-2 rounded-full text-black mb-2">{{ item.category }}</div>
              <h3 class="font-semibold text-lg mb-2">{{ item.title }}</h3>
              <p v-if="item.description" class="text-gray-600 text-sm mb-2 line-clamp-3">{{ item.description }}</p>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>
    <p v-else-if="searched" class="text-center text-gray-600 mt-4">Aucun résultat.</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { debounce } from 'lodash-es'

const supabase = useSupabaseClient()
const searchQuery = ref('')
const articles = ref<any[]>([])
const searched = ref(false)
const route = useRoute()
const searchInput = useTemplateRef('searchInput')

onMounted(() => {
  const query = route.query.q
  if (query) {
    searchQuery.value = decodeURIComponent(query as string)
    onSearch()
  } else {
    searchInput.value?.inputRef?.focus()
  }
})

const onSearch = debounce(async () => {
  searched.value = true
  if (!searchQuery.value) {
    articles.value = []
    return
  }
  const { data, error } = await supabase.functions.invoke('search', {
    body: JSON.stringify({ search: searchQuery.value }),
  })
  if (error) console.error(error)
  else articles.value = data
}, 300)

// Format date similar to index.vue
function formatDate(date: string) {
  return new Date(date).toLocaleDateString()
}

// SEO setup
useSeoMeta({
  title: 'Recherche - Sursaut!',
  description: 'Recherchez dans tous les articles de Sursaut!, le journal des luttes de Bordeaux. Trouvez rapidement l\'information qui vous intéresse.',
  keywords: 'recherche, articles, Bordeaux, luttes sociales, politique, journal',
  robots: 'noindex, follow', // Search pages typically shouldn't be indexed
  
  // Open Graph
  ogTitle: 'Recherche - Sursaut!',
  ogDescription: 'Recherchez dans tous les articles de Sursaut!, le journal des luttes de Bordeaux.',
  ogImage: 'https://journal-delta-rose.vercel.app/icon-512x512.png',
  ogUrl: 'https://journal-delta-rose.vercel.app/search',
  ogType: 'website',
  ogSiteName: 'Sursaut!',
  ogLocale: 'fr_FR',
  
  // Twitter
  twitterCard: 'summary_large_image',
  twitterTitle: 'Recherche - Sursaut!',
  twitterDescription: 'Recherchez dans tous les articles de Sursaut!.',
  twitterImage: 'https://journal-delta-rose.vercel.app/icon-512x512.png',
})

// Canonical link
useHead({
  link: [
    { rel: 'canonical', href: 'https://journal-delta-rose.vercel.app/search' }
  ]
})
</script>
