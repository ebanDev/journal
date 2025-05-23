<template>
  <div class="container mx-auto py-4 px-4">
    <div v-if="pending">
      <div class="space-y-4">
        <UPlaceholder class="h-6 w-1/3" />
        <div class="space-y-6">
          <UPlaceholder class="h-8 w-1/4" />
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <UPlaceholder class="h-40" />
            <UPlaceholder class="h-40" />
            <UPlaceholder class="h-40" />
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      <div v-if="editionsWithArticles.length">
        <section v-for="edition in editionsWithArticles" :key="edition.id" class="mb-12">
          <div class="flex items-center gap-4 mb-2">
            <h2 class="font-serif text-2xl">{{ edition.title }}</h2>
            <span v-if="edition.published_at" class="text-xs text-gray-500">Publié : {{ formatDate(edition.published_at) }}</span>
          </div>
          <p class="text-gray-600 mb-4">{{ edition.description }}</p>
          <div v-if="edition.articles && edition.articles.length" class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <NuxtLink v-for="article in edition.articles" :key="article.slug" :to="`/articles/${article.slug}`">
              <div class="flex flex-col bg-white rounded-lg shadow hover:bg-[var(--color-amber-100)] transition-colors">
                <img v-if="article.cover" :src="article.cover" class="object-cover w-full h-32 rounded-t-lg" :alt="article.title" />
                <div class="p-3">
                  <div v-if="article.categories && article.categories.length" class="flex flex-wrap gap-2 mb-1">
                    <UBadge v-for="cat in article.categories" :key="cat.name"
                      color="secondary"
                      :label="cat.name" :icon="cat.icon ? 'mingcute:' + cat.icon : undefined" />
                  </div>
                  <h3 class="font-serif text-lg font-medium mb-1 text-black">{{ article.title }}</h3>
                  <p class="text-gray-600 text-sm line-clamp-3">{{ article.description }}</p>
                  <div class="text-xs text-gray-600 mt-2">{{ formatDate(article.published_at) }}</div>
                </div>
              </div>
            </NuxtLink>
          </div>
          <div v-else class="text-gray-500 italic">Aucun article dans cette édition.</div>
        </section>
      </div>
      <div v-else class="text-center text-gray-500 py-10">Aucune édition pour le moment.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
const { getIssues, getArticles } = useDb()

const editionsWithArticles = ref<any[]>([])
const pending = ref(true)

function formatDate(date: string) {
  return date ? new Date(date).toLocaleDateString() : ''
}

const translateEditionStatus = (status: string) => {
  switch (status) {
    case 'draft':
      return 'Brouillon'
    case 'ready':
      return 'Prêt'
    case 'published':
      return 'Publié'
    default:
      return status
  }
}

onMounted(async () => {
  pending.value = true
  try {
    const allEditions = await getIssues()
    const editionsWithArts = await Promise.all(
      allEditions.map(async (edition: any) => {
        const articles = await getArticles(edition.id)
        return { ...edition, articles }
      })
    )
    editionsWithArticles.value = editionsWithArts
  } catch (e) {
    editionsWithArticles.value = []
  } finally {
    pending.value = false
  }
})
</script>
