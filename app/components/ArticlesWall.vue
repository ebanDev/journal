<template>
  <masonry-wall 
    :items="articles" 
    :column-width="width" 
    :gap="gap"
  >
    <template #default="{ item: article, index }">
      <ArticleCard 
        :article="article" 
        :showCover="shouldShowCover(index)" 
      />
    </template>
  </masonry-wall>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  articles: ArticleWithCategories[]
  width?: number
  gap?: number
  coverFrequency?: number
}>(), {
  width: 250,
  gap: 16,
  coverFrequency: -1
})

function shouldShowCover(index: number): boolean {
  if (props.coverFrequency === -1) return true
  if (props.coverFrequency === 0) return false
  return index % props.coverFrequency === 0
}
</script>
