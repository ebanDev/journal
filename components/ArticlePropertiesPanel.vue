<template>
  <transition name="slide">
    <div v-if="isOpen" class="fixed right-0 top-0 h-full w-80 bg-white shadow p-4 flex flex-col z-30">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Propriétés</h3>
        <UButton icon="i-tabler-x" color="neutral" size="xs" variant="ghost" @click="$emit('close')" />
      </div>

      <!-- Tabs -->
      <UTabs v-model="activeTab" :items="tabItems" class="w-full mb-4" :content="false" />

      <div class="space-y-4 flex-1 overflow-y-auto" v-if="activeTab === '0'">
        <!-- Properties Tab Content -->
        <div class="mb-4">
          <UTabs v-model="activePropertiesTab" :items="propertiesTabItems" class="w-full" :content="false" />
        </div>

        <div v-if="activePropertiesTab === '0'" class="space-y-4">
          <!-- General Properties -->
          <UFormField label="Lien">
            <UInput v-model="meta.slug" placeholder="mon-article" class="w-full">
              <template #leading>
                <span class="text-gray-500">/</span>
              </template>
            </UInput>
          </UFormField>

          <!-- Cover preview -->
          <div v-if="meta.cover" class="mb-4">
            <img :src="meta.cover" alt="Aperçu de l'illustration" class="w-full h-auto rounded" />
          </div>

          <UFormField label="URL de l'illustration">
            <div class="flex items-center space-x-2">
              <UInput v-model="meta.cover" placeholder="https://..." class="flex-1" />
              <UTooltip text="Télécharger une couverture">
                <UButton 
                  icon="i-tabler-upload" 
                  size="sm" 
                  :loading="isUploadingCover"
                  @click="triggerCoverUpload" 
                />
              </UTooltip>
              <input 
                type="file" 
                ref="coverFileInput" 
                class="hidden" 
                accept="image/*" 
                @change="handleCoverUpload" 
              />
            </div>
          </UFormField>

          <UFormField label="Description">
            <UTextarea 
              v-model="meta.description" 
              placeholder="Courte description..." 
              class="w-full resize-none" 
            />
          </UFormField>

          <UFormField label="Catégories">
            <USelectMenu 
              v-model="selectedCategories" 
              create-item 
              :items="categories" 
              multiple
              placeholder="Ajouter des catégories..." 
              class="w-full" 
              @create="onCreateCategory" 
            />
          </UFormField>

          <UFormField label="Article à la une">
            <USwitch v-model="meta.featured" />
          </UFormField>

          <UFormField label="Vérification grammaticale (session)">
            <USwitch v-model="meta.grammarCheckEnabled" />
          </UFormField>

          <div v-if="!meta.grammarCheckEnabled" class="text-sm text-amber-600 bg-amber-50 p-2 rounded">
            <Icon name="i-mingcute-information-line" class="mr-1" />
            La vérification grammaticale est désactivée pour cette session
          </div>

          <div v-if="meta.grammarCheckEnabled" class="text-sm text-gray-600 bg-gray-50 p-2 rounded">
            <Icon name="i-mingcute-magic-2-line" class="mr-1" />
            Vérification grammaticale française active
            <div class="text-xs mt-1 text-gray-500">
              Propulsé par <a href="https://languagetool.org" target="_blank" class="underline">LanguageTool</a>
            </div>
          </div>

          <div>
            <span class="font-medium">Nombre de mots&nbsp;: </span>{{ wordCount }}
          </div>
          <div>
            <span class="font-medium">Dernière sauvegarde&nbsp;: </span>{{ lastSaved }}
          </div>
        </div>

        <div v-else-if="activePropertiesTab === '1'" class="space-y-4">
          <!-- Publication Status Tab -->
          <UFormField label="Statut de publication">
            <USelect 
              v-model="publicationStatus" 
              :items="publicationStatusOptions"
              @change="$emit('publication-status-change')" 
              class="w-full"
            />
          </UFormField>

          <UFormField label="Partager l'article">
            <UInput 
              disabled
              :value="publicationStatus === 'published' ? 'https://sursaut-revue.fr/article/' + meta.slug : 'https://sursaut-revue.fr/preview/' + meta.id"
              class="w-full"
            >
              <template #trailing>
                <UButton 
                  icon="mingcute:external-link-line" 
                  size="sm" 
                  @click="navigateTo(publicationStatus === 'published' ? '/article/' + meta.slug : '/preview/' + meta.id, {
                    external: true,
                    open: {
                      target: '_blank'
                    }
                  })"
                />
              </template>
          </UInput>
          </UFormField>

          <div v-if="publicationStatus === 'published'" class="text-sm text-green-600">
            <Icon name="i-mingcute-checkbox-line" class="mr-1" />
            Article publié{{ meta.publishedAt ? ` le ${new Date(meta.publishedAt).toLocaleDateString('fr-FR')}` : '' }}
          </div>

          <div v-else class="text-sm text-gray-600">
            <Icon name="i-mingcute-edit-line" class="mr-1" />
            Article en brouillon
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === '1'" class="space-y-4 flex-1 overflow-y-auto">
        <!-- Sources Tab Content -->
        <SourcesManager 
          ref="sourcesManager" 
          :editor="editor" 
          @sources-changed="$emit('sources-changed', $event)" 
        />
      </div>

      <div class="mt-auto space-y-2">
        <UButton 
          block 
          color="primary" 
          @click="$emit('save')" 
          :loading="saveState === 'loading'"
          :icon="saveState === 'success' ? 'i-mingcute-checkbox-line' : 'i-mingcute-save-2-line'"
        >
          <template v-if="saveState === 'success'">Sauvegardé</template>
          <template v-else>Sauvegarder</template>
        </UButton>
        <UButton 
          block 
          color="error" 
          variant="outline" 
          @click="$emit('delete')" 
          icon="i-mingcute-delete-2-line"
        >
          Supprimer l'article
        </UButton>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import type { Source as SourceType } from '~/composables/useSources'
import { useImageUpload } from '~/composables/useImageUpload'

interface ArticleMeta {
  slug: string
  id: string
  cover: string
  description: string
  featured: boolean
  publishedAt: string | null
  sources: SourceType[]
  grammarCheckEnabled: boolean
}

interface Props {
  isOpen: boolean
  editor: Editor | null | undefined
  meta: ArticleMeta
  selectedCategories: string[]
  categories: string[]
  publicationStatus: 'draft' | 'published'
  saveState: 'default' | 'loading' | 'success' | 'error'
  wordCount: number
  lastSaved: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'close': []
  'save': []
  'delete': []
  'publication-status-change': []
  'sources-changed': [sources: SourceType[]]
  'create-category': [category: string]
  'update:meta': [meta: ArticleMeta]
  'update:selectedCategories': [categories: string[]]
  'update:publicationStatus': [status: 'draft' | 'published']
}>()

const { uploadImage, isUploading: isUploadingCover } = useImageUpload()

// Refs
const sourcesManager = ref<any>(null)
const coverFileInput = ref<HTMLInputElement | null>(null)

// Tabs
const tabItems = [
  { label: 'Propriétés', icon: 'i-mingcute-settings-2-line' },
  { label: 'Sources', icon: 'i-mingcute-book-2-line' }
]

const propertiesTabItems = [
  { label: 'Général', icon: 'i-mingcute-settings-2-line' },
  { label: 'Publication', icon: 'i-mingcute-time-line' }
]

const publicationStatusOptions = [
  { label: 'Brouillon', value: 'draft' },
  { label: 'Publié', value: 'published' }
]

const activeTab = ref('0')
const activePropertiesTab = ref('0')

// Computed properties with v-model support
const meta = computed({
  get: () => props.meta,
  set: (value) => emit('update:meta', value)
})

const selectedCategories = computed({
  get: () => props.selectedCategories,
  set: (value) => emit('update:selectedCategories', value)
})

const publicationStatus = computed({
  get: () => props.publicationStatus,
  set: (value) => emit('update:publicationStatus', value)
})

// Methods
const onCreateCategory = (item: string) => {
  emit('create-category', item)
}

const triggerCoverUpload = () => {
  coverFileInput.value?.click()
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    console.log('Copied to clipboard:', text)
  }).catch(err => {
    console.error('Failed to copy:', err)
  })
}

const handleCoverUpload = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  try {
    const imageUrl = await uploadImage(file)
    const updatedMeta = { ...props.meta, cover: imageUrl }
    emit('update:meta', updatedMeta)
  } catch (error) {
    console.error('Cover upload failed:', error)
  } finally {
    // Reset file input
    if (coverFileInput.value) {
      coverFileInput.value.value = ''
    }
  }
}

// Expose methods for parent component
defineExpose({
  sourcesManager,
  setActiveTab: (tab: string) => {
    activeTab.value = tab
  }
})
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
