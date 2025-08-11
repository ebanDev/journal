<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h4 class="font-medium">Sources</h4>
      <UButton size="xs" icon="i-mingcute-add-line" @click="showAddForm = !showAddForm" variant="outline">
        Ajouter
      </UButton>
    </div>

    <!-- Add Source Form -->
    <div v-if="showAddForm" class="p-3 rounded-lg bg-secondary-100 space-y-3 relative">
      <!-- Close (cross) button at top right -->
      <UButton size="xs" variant="ghost" icon="i-mingcute-close-line"
        class="absolute top-1.5 right-1.5 z-10 text-black hover:bg-gray-200" @click="cancelAddSource"
        aria-label="Fermer" />
      <UFormField label="URL de la source *">
        <div class="space-y-2">
          <div class="relative w-full">
            <UInput class="w-full" v-model="newSource.url" placeholder="https://exemple.com/article..."
              @input="handleUrlInput" @keyup.enter="handleUrlSubmit" />
            <div v-if="isLoadingMetadata" class="absolute right-2 top-1/2 transform -translate-y-1/2">
              <UIcon name="i-mingcute-loading-line" class="w-4 h-4 animate-spin text-gray-400" />
            </div>
          </div>
        </div>
      </UFormField>

      <!-- Manual form fields (shown after metadata fetch or manual toggle) -->
      <div v-if="showManualFields" class="space-y-3 pt-2">
        <UFormField label="Type de source">
          <USelect class="w-full" v-model="newSource.type" :items="sourceTypeOptions"
            placeholder="Sélectionner un type" />
        </UFormField>

        <UFormField label="Titre *">
          <UInput class="w-full" v-model="newSource.title" placeholder="Titre de la source"
            @keyup.enter="handleAddSource" />
        </UFormField>

        <UFormField label="Auteur">
          <UInput class="w-full" v-model="newSource.author" placeholder="Nom de l'auteur" />
        </UFormField>

        <UFormField label="Description">
          <UTextarea class="w-full" v-model="newSource.description" placeholder="Description ou notes..." :rows="2" />
        </UFormField>

        <!-- Confirm button when manual fields are shown -->
        <div class="flex gap-2 pt-2">
          <UButton size="xs" @click="handleAddSource" :disabled="!newSource.title.trim()" color="success">
            Confirmer
          </UButton>
          <UButton size="xs" variant="ghost" @click="showManualFields = false">
            Retour
          </UButton>
        </div>
      </div>

      <!-- Main action buttons (shown when manual fields are not visible) -->
      <div v-if="!showManualFields" class="flex gap-2">
        <UButton size="xs" @click="handleFetchAndValidate" :disabled="!newSource.url.trim()"
          :loading="isLoadingMetadata">
          {{ isLoadingMetadata ? 'Récupération...' : 'Ajouter' }}
        </UButton>
        <UButton size="xs" variant="ghost" @click="showManualForm" icon="i-mingcute-edit-line">
          Entrer manuellement
        </UButton>
        <!-- Removed Annuler button, replaced by cross at top right -->
      </div>
    </div>

    <!-- Sources List -->
    <div v-if="sources.length > 0" class="space-y-2">
      <div v-for="(source, index) in sources" :key="source.id"
        class="p-3 rounded-lg bg-secondary-100 hover:bg-secondary-200 transition-colors">
        <div class="flex justify-between items-start gap-2">
          <div class="flex-1 min-w-0">

            <div class="flex items-center gap-2 mb-2">
              <span
                class="inline-flex items-center justify-center w-5 h-5 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">
                {{ index + 1 }}
              </span>
              <span class="text-sm font-medium truncate flex-1">
                {{ source.title }}
              </span>
              <UBadge :label="sourceTypeLabels[source.type]" size="xs" color="neutral" />
              <div class="flex gap-1 ml-2">
                <UTooltip text="Supprimer cette source">
                  <UButton size="xs" icon="i-mingcute-delete-2-line" variant="ghost" color="error"
                    @click="handleRemoveSource(source.id)" />
                </UTooltip>
              </div>
            </div>

            <div v-if="source.author" class="text-xs text-gray-600 mb-1">
              Par {{ source.author }}
            </div>

            <div v-if="source.url" class="text-xs text-primary-600 mb-1">
              <a :href="source.url" target="_blank" class="hover:underline inline-flex items-center gap-1">
                {{ formatUrl(source.url) }}
                <UIcon name="i-mingcute-external-link-line" class="w-3 h-3" />
              </a>
            </div>

            <div v-if="source.description" class="text-xs text-gray-600">
              {{ source.description }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="!showAddForm" class="text-center py-8 text-gray-500 text-sm">
      <UIcon name="i-mingcute-book-2-line" class="w-8 h-8 mx-auto mb-2 text-gray-300" />
      <p>Aucune source ajoutée</p>
      <p class="text-xs text-gray-400 mt-1">Cliquez sur "Ajouter" pour commencer</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useSources, type Source } from '~/composables/useSources'

interface Props {
  editor?: any // Tiptap editor instance
  sources?: Source[] // Sources from article
}

const props = defineProps<Props>()

const emit = defineEmits<{
  sourcesChanged: [sources: Source[]]
}>()

const {
  sources,
  addSource,
  removeSource,
  generateCitationMarker,
  exportSources,
  loadSources: loadSourcesComposable
} = useSources()

// Watch props.sources and load them automatically
watch(() => props.sources, (newSources) => {
  if (newSources && Array.isArray(newSources)) {
    loadSourcesComposable(newSources)
  }
}, { immediate: true, deep: true })

const showAddForm = ref(false)
const isLoadingMetadata = ref(false)
const urlSuggestion = ref<any>(null)
const urlInputTimeout = ref<NodeJS.Timeout | null>(null)
const showManualFields = ref(false)

const newSource = reactive({
  title: '',
  author: '',
  url: '',
  type: 'website' as Source['type'],
  description: ''
})

const sourceTypeOptions = [
  { label: 'Site web', value: 'website' },
  { label: 'Livre', value: 'book' },
  { label: 'Article', value: 'article' },
  { label: 'Autre', value: 'other' }
]

const sourceTypeLabels = {
  website: 'Web',
  book: 'Livre',
  article: 'Article',
  other: 'Autre'
}

const resetNewSource = () => {
  newSource.title = ''
  newSource.author = ''
  newSource.url = ''
  newSource.type = 'website'
  newSource.description = ''
  urlSuggestion.value = null
  showManualFields.value = false
}

const handleUrlInput = async () => {
  if (urlInputTimeout.value) {
    clearTimeout(urlInputTimeout.value)
  }

  urlSuggestion.value = null

  if (!newSource.url.trim()) {
    return
  }

  // Basic URL validation - must start with http/https
  if (!newSource.url.startsWith('http://') && !newSource.url.startsWith('https://')) {
    return
  }

  // Additional validation
  try {
    new URL(newSource.url)
  } catch {
    return
  }

  urlInputTimeout.value = setTimeout(async () => {
    isLoadingMetadata.value = true
    try {
      const response = await fetch(`/api/metadata?url=${encodeURIComponent(newSource.url)}`)
      const metadata = await response.json()

      if (metadata.title && !metadata.error) {
        urlSuggestion.value = metadata
      }
    } catch (error) {
      console.error('Error fetching metadata:', error)
    } finally {
      isLoadingMetadata.value = false
    }
  }, 500)
}

const applyUrlSuggestion = () => {
  if (urlSuggestion.value) {
    newSource.title = urlSuggestion.value.title || newSource.title
    newSource.author = urlSuggestion.value.source || newSource.author
    newSource.description = urlSuggestion.value.description || newSource.description
    showManualFields.value = true
    urlSuggestion.value = null
  }
}

const showManualForm = () => {
  showManualFields.value = true
  urlSuggestion.value = null
}

const handleUrlSubmit = () => {
  if (urlSuggestion.value) {
    applyUrlSuggestion()
  } else if (newSource.url.trim()) {
    showManualForm()
  }
}

const formatUrl = (url: string): string => {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

const handleFetchAndValidate = async () => {
  if (!newSource.url.trim()) return

  // If manual fields are already shown and we have a title, just add the source
  if (showManualFields.value && newSource.title.trim()) {
    handleAddSource()
    return
  }

  // Validate URL
  if (!newSource.url.startsWith('http://') && !newSource.url.startsWith('https://')) {
    showManualForm()
    return
  }

  try {
    new URL(newSource.url)
  } catch {
    showManualForm()
    return
  }

  // Fetch metadata
  isLoadingMetadata.value = true
  try {
    const response = await fetch(`/api/metadata?url=${encodeURIComponent(newSource.url)}`)
    const metadata = await response.json()

    if (metadata.title && !metadata.error) {
      // Apply metadata and show editable fields
      newSource.title = metadata.title || ''
      newSource.author = metadata.source || ''
      newSource.description = metadata.description || ''
      showManualFields.value = true
    } else {
      // No metadata found, show manual form
      showManualForm()
    }
  } catch (error) {
    console.error('Error fetching metadata:', error)
    showManualForm()
  } finally {
    isLoadingMetadata.value = false
  }
}

const handleAddSource = () => {
  if (!newSource.url.trim()) return

  let defaultTitle = newSource.title.trim()
  if (!defaultTitle) {
    try {
      defaultTitle = new URL(newSource.url).hostname
    } catch {
      defaultTitle = newSource.url
    }
  }

  const sourceData = {
    title: defaultTitle,
    author: newSource.author.trim() || undefined,
    url: newSource.url.trim(),
    type: newSource.type,
    description: newSource.description.trim() || undefined,
    accessed: new Date().toISOString()
  }

  addSource(sourceData)
  resetNewSource()
  showAddForm.value = false

  // Emit the updated sources
  emit('sourcesChanged', exportSources())
}

const cancelAddSource = () => {
  if (urlInputTimeout.value) {
    clearTimeout(urlInputTimeout.value)
  }
  resetNewSource()
  showAddForm.value = false
}

const handleRemoveSource = (sourceId: string) => {
  removeSource(sourceId)
  emit('sourcesChanged', exportSources())
}

// Expose methods for parent component
defineExpose({
  getSources: exportSources,
  openNewSourceDialog: () => {
    showAddForm.value = true
  }
})
</script>
