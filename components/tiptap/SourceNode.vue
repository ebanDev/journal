<template>
  <UPopover mode="hover" :open-delay="200" :close-delay="300">
    <span class="source-mark inline-flex items-center gap-1 px-1 py-0.5 text-sm bg-amber-50 text-amber-800 rounded border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer">
      <Icon name="i-mingcute-book-2-line" class="text-xs" />
      <MarkViewContent />
    </span>
    
    <template #content>
      <div class="p-4 max-w-sm space-y-3">
        <div class="space-y-2">
          <h4 class="font-semibold text-gray-900">{{ sourceData.title || 'Source' }}</h4>
          <p v-if="sourceData.description" class="text-sm text-gray-600 line-clamp-3">
            {{ sourceData.description }}
          </p>
        </div>
        
        <div v-if="sourceData.url" class="pt-2 border-t border-gray-100">
          <a 
            :href="sourceData.url" 
            target="_blank" 
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            <Icon name="i-mingcute-external-link-line" class="text-xs" />
            Voir la source
          </a>
        </div>
        
        <div v-if="sourceData.author || sourceData.publishedAt" class="pt-2 border-t border-gray-100 space-y-1">
          <p v-if="sourceData.author" class="text-xs text-gray-500">
            Par {{ sourceData.author }}
          </p>
          <p v-if="sourceData.publishedAt" class="text-xs text-gray-500">
            {{ formatDate(sourceData.publishedAt) }}
          </p>
        </div>
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MarkViewContent, markViewProps } from '@tiptap/vue-3'

const props = defineProps(markViewProps)

const sourceData = computed(() => {
  try {
    return JSON.parse(props.mark.attrs.sourceData || '{}')
  } catch {
    return {}
  }
})

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('fr-FR')
  } catch {
    return dateString
  }
}
</script>

<style scoped>
.source-mark {
  text-decoration: none !important;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
