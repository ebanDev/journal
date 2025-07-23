<template>
  <div class="max-w-3xl mx-auto w-full py-8 px-4">
    <div v-if="article">
      <h1 class="font-serif text-4xl mb-4">{{ article.title }}</h1>
      <p class="text-gray-500 mb-6" v-if="article.published_at">{{ formatDate(article.published_at) }}</p>

      <div v-if="article.categories && article.categories.length" class="flex flex-wrap gap-2 mb-4">
        <NuxtLink 
          v-for="cat in article.categories" 
          :key="cat.name"
          :to="`/category/${cat.name.toLowerCase().replace(/\s+/g, '-')}`"
          class="hover:opacity-80 transition-opacity"
        >
          <UBadge 
            color="secondary" 
            :label="cat.name" 
            :icon="cat.icon ? 'mingcute:' + cat.icon : undefined" 
          />
        </NuxtLink>
      </div>

      <div v-if="article.cover" class="mb-6">
        <img :src="article.cover" alt="Cover" class="w-full rounded" />
      </div>

      <div class="prose max-w-none" v-html="article.content"></div>
    </div>
    <div v-else class="text-center py-20">
      <p>Chargement...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSupabaseClient, useToast } from '#imports'
import { useDb } from '~/composables/useDb'
import type {ArticleWithCategories} from '~/composables/useDb'

const supabase = useSupabaseClient()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const slug = String(route.params.slug)

const article = ref(null as ArticleWithCategories | null)

const formatDate = (date: string) => new Date(date).toLocaleDateString()

const { getArticleBySlug } = useDb()

const fetchArticle = async () => {
  try {
    const found = await getArticleBySlug(slug)
    if (!found) {
      toast.add({
        title: 'Article non trouvé',
        description: 'L\'article que vous cherchez n\'existe pas.',
        color: 'error',
      })
      router.push('/')
      return
    }
    article.value = found
    
    // Set up SEO meta tags dynamically when article is loaded
    setupSEO(found)
  } catch (e) {
    toast.add({
      title: 'Erreur',
      description: 'Erreur lors du chargement de l\'article',
      color: 'error',
    })
    router.push('/')
  }
}

const setupSEO = (articleData: ArticleWithCategories) => {
  const title = `${articleData.title} - Contradiction·s`
  const description = articleData.description || 
    `Lisez "${articleData.title}" sur Contradiction·s, le journal des luttes de Bordeaux.`
  
  const categories = articleData.categories?.map(cat => cat.name).join(', ') || ''
  const imageUrl = articleData.cover || 'https://journal-delta-rose.vercel.app/icon-512x512.png'
  const articleUrl = `https://journal-delta-rose.vercel.app/articles/${articleData.slug}`
  
  useSeoMeta({
    title,
    description,
    keywords: `${categories}, Bordeaux, luttes sociales, politique, journal`,
    author: 'Contradiction·s',
    
    // Open Graph
    ogTitle: title,
    ogDescription: description,
    ogImage: imageUrl,
    ogUrl: articleUrl,
    ogType: 'article',
    ogSiteName: 'Contradiction·s',
    ogLocale: 'fr_FR',
    
    // Twitter
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: imageUrl,
    
    // Article specific
    articleAuthor: ['Contradiction·s'],
    articlePublishedTime: articleData.published_at || '',
    articleSection: categories,
  })
  
  // Canonical link still needs useHead
  useHead({
    link: [
      { rel: 'canonical', href: articleUrl }
    ]
  })
}

onMounted(fetchArticle)
</script>
