<template>
  <div class="prose max-w-none" v-html="processedContent"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  content: string
}

const props = defineProps<Props>()

const processedContent = computed(() => {
  if (!props.content) return ''
  
  // Process the HTML content to replace source marks with interactive elements
  let processed = props.content
  
  // Find all elements with data-source-data attribute and transform them
  // Use a more flexible regex to catch various quote escaping patterns
  processed = processed.replace(
    /<span([^>]*?data-source-data\s*=\s*['"](.*?)['"][^>]*?)>(.*?)<\/span>/gi,
    (match, beforeContent, sourceDataEncoded, textContent) => {
      try {
        // Decode HTML entities
        let sourceDataStr = sourceDataEncoded
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&#x27;/g, "'")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
        
        // Parse the JSON data
        const sourceData = JSON.parse(sourceDataStr)
        
        // Generate unique ID
        const sourceId = `source-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
        
        // Return enhanced span with proper styling and icon
        return `<span class="source-mark inline-flex items-center gap-1 px-1 py-0.5 bg-amber-50 text-amber-800 rounded border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer" data-source-data='${JSON.stringify(sourceData)}' data-source-id="${sourceId}"><svg class="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M5 21V3h14v18l-7-3-7 3zm2-3.236l5-2.143 5 2.143V5H7v12.764z"/></svg>${textContent}</span>`
      } catch (e) {
        // If JSON parsing fails, still style it as a source but without functionality
        return `<span class="source-mark inline-flex items-center gap-1 px-1 py-0.5 bg-amber-50 text-amber-800 rounded border border-amber-200 cursor-pointer"><svg class="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M5 21V3h14v18l-7-3-7 3zm2-3.236l5-2.143 5 2.143V5H7v12.764z"/></svg>${textContent}</span>`
      }
    }
  )
  
  return processed
})
</script>

<style scoped>
:deep(.source-mark:hover) {
  background-color: rgb(254 243 199) !important; /* amber-100 */
}
</style>
