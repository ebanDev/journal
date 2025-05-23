<template>
  <div class="max-w-3xl mx-auto py-8 px-4">
    <div v-if="article">
      <h1 class="font-serif text-4xl mb-4">{{ article.title }}</h1>
      <p class="text-gray-500 mb-6">{{ formatDate(article.published_at) }}</p>

      <div v-if="article.cover" class="mb-6">
        <img :src="article.cover" alt="Cover" class="w-full rounded" />
      </div>

      <p v-if="article.description" class="text-gray-600 mb-6">
        {{ article.description }}
      </p>

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

const supabase = useSupabaseClient()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const slug = String(route.params.slug)

interface Article {
  title: string
  content: string
  published_at: string
  cover?: string
  description?: string
  categories?: string[]
  draft?: boolean
  slug?: string
}

const article = ref<Article | null>(null)

const formatDate = (date: string) => new Date(date).toLocaleDateString()

const fetchArticle = async () => {
  const { data, error } = await supabase
    .from('articles')
    .select('title,content,published_at,cover,description')
    .eq('draft', false)
    .eq('slug', slug)
    .single()

  if (error || !data) {
    toast.error('Article non trouvé')
    router.push('/')
    return
  }

  article.value = data
}

onMounted(fetchArticle)
</script>
