<template>
  <NuxtLink :to="`/articles/${article.slug}`" class="group">
    <div class="bg-[var(--color-amber-150)] rounded-lg hover:bg-secondary-200 transition-colors flex flex-col">
      <img v-if="showCover && article.cover" :src="article.cover" class="object-cover w-full h-32 rounded-t-lg" :alt="article.title" />
      <div class="p-3">
        <div v-if="article.categories && article.categories.length" class="flex flex-wrap gap-2 mb-1">
          <NuxtLink 
            v-for="cat in article.categories" 
            :key="cat.name"
            :to="`/category/${cat.name.toLowerCase().replace(/\s+/g, '-')}`"
            @click.stop
            class="hover:opacity-80 transition-opacity"
          >
            <UBadge 
              color="secondary"
              :label="cat.name" 
              :icon="cat.icon ? 'mingcute:' + cat.icon : undefined" 
            />
          </NuxtLink>
        </div>
        <h3 class="text-lg font-bold mb-1 text-black">{{ article.title }}</h3>
        <p class="text-gray-600 text-sm line-clamp-3">{{ article.description }}</p>
        <div class="text-xs text-gray-600 mt-2" v-if="article.published_at">Publié le {{ formatDate(article.published_at) }}</div>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { ArticleWithCategories } from '~/composables/useDb'

 withDefaults(defineProps<{
   article: ArticleWithCategories
   showCover?: boolean
}>(), {
  showCover: true
})

function formatDate(date: string) {
  return date ? new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : ''
}
</script>
