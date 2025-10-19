<template>
  <UPopover :open="show" @update:open="$emit('update:show', $event)" :content="{ side: 'bottom', align: 'start' }">
    <!-- Invisible trigger positioned at the source button location -->
    <div 
      class="absolute pointer-events-none" 
      :style="{ left: position.x + 'px', top: position.y + 'px', width: '1px', height: '1px' }" 
    />
    
    <template #content>
      <div class="p-4 space-y-3 w-80" @click.stop @mousedown.stop>
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-medium">Ajouter une source</h3>
          <UButton icon="i-mingcute-close-line" size="xs" variant="ghost" @click="$emit('cancel')" />
        </div>
        
        <!-- Search existing sources -->
        <div class="space-y-2">
          <UInput 
            :model-value="searchQuery"
            @update:model-value="$emit('update:search-query', $event)"
            placeholder="Rechercher une source..." 
            class="w-full" 
            icon="i-mingcute-search-line" 
          />
          
          <!-- Sources list -->
          <div class="max-h-32 overflow-y-auto space-y-1">
            <div 
              v-for="(source, index) in filteredSources" 
              :key="index"
              class="p-2 hover:bg-gray-50 rounded cursor-pointer text-sm border border-gray-200"
              @click="$emit('select-source', index)"
            >
              <div class="font-medium truncate">{{ source.title }}</div>
              <div class="text-gray-500 text-xs truncate">{{ source.url }}</div>
            </div>
            
            <div 
              v-if="filteredSources.length === 0 && searchQuery" 
              class="p-2 text-sm text-gray-500 text-center"
            >
              Aucune source trouvée
            </div>
          </div>
        </div>
        
        <!-- Add new source button -->
        <div class="pt-2">
          <UButton 
            block 
            variant="outline" 
            icon="i-mingcute-add-line" 
            @click="$emit('create-source')"
          >
            Ajouter une source
          </UButton>
        </div>
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Source as SourceType } from '~/composables/useSources'

interface Props {
  show: boolean
  position: { x: number; y: number }
  sources: SourceType[]
  searchQuery: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'select-source': [index: number]
  'create-source': []
  'cancel': []
  'update:search-query': [query: string]
  'update:show': [show: boolean]
}>()

// Computed
const filteredSources = computed(() => {
  if (!props.searchQuery.trim()) {
    return props.sources
  }
  const query = props.searchQuery.toLowerCase()
  return props.sources.filter(source => 
    source.title.toLowerCase().includes(query) || 
    (source.url && source.url.toLowerCase().includes(query))
  )
})
</script>
