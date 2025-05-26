<template>
  <div class="container max-w-4xl mx-auto md:px-4 md:py-8">
    <div v-if="category">
      <div class="flex items-center flex-row md:gap-8 gap-4 mb-12 relative">
        <img v-if="category.cover" :src="category.cover"
          class="w-full h-36 md:h-56 brightness-50 object-cover rounded-b-lg shadow md:rounded-lg" :alt="category.name" />
        <h1 class="font-serif text-center text-4xl md:text-6xl mb-2 absolute text-white w-full">{{ category.name }}</h1>
      </div>
      <div class="px-4 md:px-0">
        <h2 class="font-serif text-2xl mb-4">Articles de la catégorie</h2>
        <ArticlesWall v-if="articles.length" :articles="articles" />
        <div v-else class="text-gray-500">Aucun article dans cette catégorie.</div>
      </div>
    </div>
    <div v-else class="text-center py-20">
      <p>Catégorie introuvable.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useDb } from '~/composables/useDb'

const route = useRoute()
const { getCategories, getArticles } = useDb()
const category = ref<any>(null)
const articles = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  loading.value = true
  const slug = route.params.slug
  const categories = await getCategories()
  category.value = (categories || []).find((c: any) => c.name.toLowerCase().replace(/\s+/g, '-') === slug)
  if (category.value) {
    articles.value = await getArticles([{ type: 'category', id: category.value.id }])
  }
  loading.value = false
})
</script>
