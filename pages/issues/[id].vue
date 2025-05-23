<template>
  <div class="container mx-auto px-4 py-8">
    <div v-if="loading">
      <UPlaceholder class="h-8 w-1/2 mb-4" />
      <UPlaceholder class="h-6 w-1/3 mb-2" />
      <UPlaceholder class="h-64 w-full mb-6" />
      <UPlaceholder class="h-6 w-1/2 mb-4" />
    </div>
    <div v-else-if="issue">
      <div class="flex flex-col md:flex-row gap-8 mb-8">
        <img v-if="issue.cover" :src="issue.cover" class="w-full md:w-1/3 rounded-lg shadow" :alt="issue.title" />
        <div class="flex-1">
          <h1 class="font-serif text-3xl md:text-4xl mb-2">{{ issue.title }}</h1>
          <div class="text-gray-500 mb-4">{{ formatDate(issue.published_at) }}</div>
          <p class="text-lg text-gray-700 mb-4">{{ issue.description }}</p>
        </div>
      </div>
      <h2 class="font-serif text-2xl mb-4">Articles de l'édition</h2>
      <div v-if="articles.length" class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <NuxtLink v-for="article in articles" :key="article.slug" :to="`/articles/${article.slug}`">
          <div class="bg-white rounded-lg shadow hover:bg-[var(--color-amber-100)] transition-colors flex flex-col">
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
      <div v-else class="text-gray-500">Aucun article dans cette édition.</div>
    </div>
    <div v-else class="text-center py-20">
      <p>Édition introuvable.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useDb } from '~/composables/useDb'

const route = useRoute()
const { getIssues, getArticles } = useDb()
const issue = ref<any>(null)
const articles = ref<any[]>([])
const loading = ref(true)

function formatDate(date: string) {
  return date ? new Date(date).toLocaleDateString() : ''
}

onMounted(async () => {
  loading.value = true
  const slug = route.params.id
  const issues = await getIssues()
  issue.value = (issues || []).find((i: any) => i.slug === slug)
  if (issue.value) {
    articles.value = await getArticles(issue.value.id)
  }
  loading.value = false
})
</script>
