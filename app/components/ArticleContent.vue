<template>
  <div class="prose max-w-none">
    <div v-html="processedContent"></div>
    
    <!-- Render charts separately -->
    <div v-for="(chart, index) in chartNodes" :key="`chart-${index}`" class="my-6">
      <ChartNodePublic 
        :csv-data="chart.csvData"
        :chart-type="chart.chartType"
        :title="chart.title"
        :x-label="chart.xLabel"
        :y-label="chart.yLabel"
        :options="chart.options"
        :colors="chart.colors"
        :series-names="chart.seriesNames"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ChartNodePublic from '~/components/ChartNodePublic.vue'

interface Props {
  content: string
}

const props = defineProps<Props>()

const chartNodes = computed(() => {
  if (!props.content) return []
  
  const charts: any[] = []
  
  // Find chart nodes in the HTML and extract their data
  const chartRegex = /<div[^>]*?data-chart[^>]*?><\/div>/gi
  
  let match
  while ((match = chartRegex.exec(props.content)) !== null) {
    try {
      const fullMatch = match[0]
      
      // Helper function to extract attribute values with proper quote handling
      const extractAttribute = (attrName: string): string => {
        // Look for the attribute with either single or double quotes
        const patterns = [
          new RegExp(`${attrName}\\s*=\\s*"([^"]*)"`, 'i'),
          new RegExp(`${attrName}\\s*=\\s*'([^']*)'`, 'i')
        ]
        
        for (const pattern of patterns) {
          const attrMatch = fullMatch.match(pattern)
          if (attrMatch && attrMatch[1]) {
            // Decode HTML entities
            return attrMatch[1]
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/&#x27;/g, "'")
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
          }
        }
        return ''
      }
      
      const csvData = extractAttribute('data-csv-data')
      const chartType = extractAttribute('data-chart-type') || 'bar'
      const title = extractAttribute('data-title')
      const xLabel = extractAttribute('data-x-label')
      const yLabel = extractAttribute('data-y-label')
      const options = extractAttribute('data-options') || '{}'
      const colors = extractAttribute('data-colors') || '{}'
      const seriesNames = extractAttribute('data-series-names') || '{}'
      
      if (csvData) {
        charts.push({
          csvData,
          chartType,
          title,
          xLabel,
          yLabel,
          options,
          colors,
          seriesNames
        })
      }
    } catch (e) {
      console.warn('Error parsing chart data:', e)
    }
  }
  
  return charts
})

const processedContent = computed(() => {
  if (!props.content) return ''
  
  let processed = props.content
  
  // Remove chart nodes from the HTML (they will be rendered separately)
  processed = processed.replace(/<div[^>]*?data-chart[^>]*?><\/div>/gi, '')
  
  // Process source marks
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
