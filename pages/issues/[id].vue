<template>
  <div class="container mx-auto px-4 py-8">
    <div v-if="issue">
      <div class="flex flex-col-reverse items-center md:flex-row md:gap-8 gap-4 mb-12">
        <img v-if="issue.cover" :src="issue.cover" class="w-full md:w-auto md:max-h-112 rounded-lg shadow" :alt="issue.title" />
        <div class="flex-1 w-full">
          <h1 class="font-serif text-center md:text-left text-4xl md:text-4xl mb-2">{{ issue.title }}</h1>
          <div class="text-gray-500 hidden md:block mb-4">{{ formatDate(issue.published_at) }}</div>
          <p class="text-gray-700 hidden md:block">{{ issue.description }}</p>
        </div>
      </div>
      <h2 class="font-serif text-2xl mb-4">Articles de l'édition</h2>
      <ArticlesWall v-if="articles.length" :articles="articles" />
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
    articles.value = await getArticles([{ type: 'issue', id: issue.value.id }])
  }
  loading.value = false
})
</script>
