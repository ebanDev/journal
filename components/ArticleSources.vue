<template>
  <div v-if="sources && sources.length > 0" class="mt-12 border-t border-gray-200 pt-8">
    <h3 class="text-xl font-semibold mb-6 text-gray-900 font-serif">Sources et références</h3>
    <div class="space-y-6">
      <div 
        v-for="(source, index) in sources" 
        :key="source.id"
        :data-source-id="source.id"
        class="flex gap-4 text-sm text-gray-700 transition-colors duration-300 hover:bg-secondary-200 -mx-2 px-2 py-2 rounded"
      >
        <div class="flex-shrink-0">
          <span class="inline-flex items-center justify-center w-7 h-7 bg-primary-100 text-primary-800 text-sm font-medium rounded-full">
            {{ index + 1 }}
          </span>
        </div>
        <div class="flex-1 space-y-2">
          <div class="font-medium text-gray-900 text-base leading-relaxed">{{ source.title }}</div>
          <div v-if="source.author" class="text-gray-600">
            <UIcon name="i-mingcute-user-4-line" class="w-4 h-4 inline mr-1" />
            {{ source.author }}
          </div>
          <div v-if="source.url" class="break-all">
            <a 
              :href="source.url" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="text-primary-600 hover:text-primary-800 hover:underline inline-flex items-center gap-1 transition-colors"
            >
              <UIcon name="i-mingcute-link-line" class="w-4 h-4" />
              {{ formatUrl(source.url) }}
              <UIcon name="i-mingcute-external-link-line" class="w-3 h-3" />
            </a>
          </div>
          <div v-if="source.description" class="text-gray-600 italic leading-relaxed">
            {{ source.description }}
          </div>
          <div v-if="source.accessed" class="text-xs text-gray-500 flex items-center gap-1">
            <UIcon name="i-mingcute-calendar-line" class="w-3 h-3" />
            Consulté le {{ formatDate(source.accessed) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Source } from '~/composables/useSources'

interface Props {
  sources: Source[]
}

defineProps<Props>()

const formatUrl = (url: string): string => {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('fr-FR')
  } catch {
    return dateString
  }
}
</script>
