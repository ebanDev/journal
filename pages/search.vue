<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="font-serif text-2xl mb-4">Recherche</h1>
    <UInput
      class="w-full mb-4"
      v-model="searchQuery"
      @input="onSearch"
      placeholder="Rechercher..."
      icon="tabler-search"
      variant="outline"
    />
    <div v-if="articles.length" class="space-y-6">
      <div v-for="item in articles" :key="item.metadata.slug">
        <NuxtLink :to="`/article/${item.metadata.slug}`">
          <div class="group overflow-hidden hover:bg-[var(--color-amber-150)] p-4 rounded-lg flex flex-col sm:flex-row gap-4">
            <img v-if="item.metadata.cover" :src="item.metadata.cover" alt="" class="w-full sm:w-32 h-auto object-cover rounded-lg"/>
            <div class="flex-1">
              <div v-if="item.metadata.category" class="text-sm bg-secondary-300 inline-block py-1 px-2 rounded-full text-black mb-2">{{ item.metadata.category }}</div>
              <h3 class="font-semibold text-lg mb-2">{{ item.title }}</h3>
              <p v-if="item.metadata.description" class="text-gray-600 text-sm mb-2 line-clamp-3">{{ item.metadata.description }}</p>
              <div class="text-xs text-gray-500">{{ formatDate(item.published_at) }}</div>
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
</script>
