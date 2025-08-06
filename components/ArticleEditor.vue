<template>
  <div class="flex h-screen overflow-auto">
    <!-- Editor Area -->
    <div :class="['flex-1 px-8 py-6 transition-all', isPanelOpen ? 'mr-80' : 'mx-auto']">
      <!-- Back Button -->
      <div class="fixed top-4 left-60 z-20">
        <UButton 
          icon="i-mingcute-arrow-left-line" 
          variant="ghost" 
          color="neutral" 
          :loading="saveState === 'loading'"
          :disabled="saveState === 'loading'" 
          @click="navigateBack"
        >
          <template v-if="saveState === 'loading'">En attente de la sauvegarde</template>
          <template v-else></template>
        </UButton>
      </div>

      <!-- Floating Actions -->
      <div class="fixed top-4 right-4 flex gap-2 z-20">
        <UButton 
          v-if="saveState === 'loading'" 
          icon="i-mingcute-sandglass-line" 
          variant="ghost" 
          color="neutral"
          title="Sauvegarde en cours" 
        />
        <UButton 
          v-else-if="saveState === 'error'" 
          icon="mingcute-warning-line" 
          variant="ghost" 
          color="error"
          title="Erreur lors de la sauvegarde" 
        />
        <UButton 
          v-else 
          icon="i-mingcute-checkbox-line" 
          variant="ghost" 
          color="neutral" 
          title="Sauvegardé" 
        />

        <UButton 
          icon="mingcute-settings-2-line" 
          variant="ghost" 
          color="neutral" 
          @click="isPanelOpen = !isPanelOpen"
          :title="isPanelOpen ? 'Masquer les propriétés' : 'Afficher les propriétés'" 
        />
      </div>

      <!-- Title -->
      <textarea 
        v-model="title" 
        placeholder="Titre de l´article..." 
        ref="titleRef" 
        @input="autoResize" 
        rows="1" 
        autocomplete="off" 
        autocorrect="off" 
        autocapitalize="off" 
        spellcheck="false"
        class="w-full text-4xl font-extrabold bg-transparent border-none focus:outline-none my-4 resize-none overflow-hidden whitespace-pre-line break-words" 
      />

      <!-- Sticky Toolbar -->
      <div class="sticky top-2 z-10 mb-4">
        <EditorToolbar 
          v-if="editor" 
          :editor="editor" 
          @open-source-popover="openSourcePopover"
          @open-chart-popover="openChartPopover"
        />
      </div>

      <!-- Source Popover -->
      <SourcePopover
        :show="showSourcePopover"
        :position="sourcePopoverPosition"
        :sources="meta.sources"
        :search-query="sourceSearchQuery"
        @select-source="selectExistingSource"
        @create-source="createNewSource"
        @cancel="cancelSourcePopover"
        @update:search-query="sourceSearchQuery = $event"
      />

      <!-- Chart Popover -->
      <ChartPopover
        :show="showChartPopover"
        :position="chartPopoverPosition"
        @create-chart="createChart"
        @cancel="cancelChartPopover"
      />

      <!-- Content -->
      <EditorContent 
        :editor="editor"
        class="prose prose-headings:text-stone-700 prose-h1:text-3xl prose-h2:font-extrabold max-w-full w-[800px] min-h-full"
        autocomplete="off" 
        autocorrect="off" 
        autocapitalize="off" 
        spellcheck="false" 
        @click="editor?.chain().focus().run()" 
      />
        
      <!-- Grammar Suggestion Popup -->
      <GrammarSuggestion
        ref="grammarSuggestionRef"
        :position="grammarSuggestionPosition"
        :grammar-data="grammarSuggestionData"
        :on-apply-replacement="applyGrammarReplacement"
        :on-ignore="ignoreGrammarError"
        @close="closeGrammarSuggestion"
      />
    </div>

    <!-- Properties Panel -->
    <ArticlePropertiesPanel
      :is-open="isPanelOpen"
      :editor="editor"
      :meta="meta"
      @update:meta="updateMeta"
      v-model:selected-categories="selectedCategories"
      v-model:publication-status="publicationStatus"
      :categories="categories"
      :save-state="saveState"
      :word-count="wordCount"
      :last-saved="lastSaved"
      @close="isPanelOpen = false"
      @save="save"
      @delete="deleteArticle"
      @publication-status-change="onPublicationStatusChange"
      @sources-changed="onSourcesChanged"
      @create-category="onCreateCategory"
      ref="propertiesPanel"
    />
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSupabaseClient, useSupabaseUser, useToast } from '#imports'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { DecorationSet } from 'prosemirror-view'
import { PluginKey } from 'prosemirror-state'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import { DragHandle } from '@tiptap/extension-drag-handle'
import { CustomImage } from '~/extensions/custom-image'
import { Source } from '~/extensions/source'
import { Chart } from '~/extensions/chart'
import { GrammarCheck, LT_PLUGIN_KEY, triggerFullGrammarCheck } from '~/extensions/grammar-check'
import debounce from 'lodash/debounce'
import { useDb } from '~/composables/useDb'
import { useImageUpload } from '~/composables/useImageUpload'
import type { Source as SourceType } from '~/composables/useSources'

// Components
import EditorToolbar from '~/components/tiptap/EditorToolbar.vue'
import SourcePopover from '~/components/tiptap/SourcePopover.vue'
import ChartPopover from '~/components/tiptap/ChartPopover.vue'
import ArticlePropertiesPanel from '~/components/ArticlePropertiesPanel.vue'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
const route = useRoute()
const toast = useToast()
const id = String(route.params.id)
const { getCategories, setArticleCategories, getArticleCategories } = useDb()
const { uploadImage } = useImageUpload()

// State
const title = ref('')
const titleRef = ref<HTMLTextAreaElement | null>(null)
const isPanelOpen = ref(false)
const lastSavedDate = ref<Date | null>(null)
const saveState = ref<'default' | 'loading' | 'success' | 'error'>('default')

// Article metadata
const meta = reactive({
  id,
  slug: '',
  cover: '',
  description: '',
  featured: false,
  publishedAt: null as string | null,
  sources: [] as SourceType[],
  grammarCheckEnabled: true
})

// Categories
const categories = ref<string[]>([])
const selectedCategories = ref<string[]>([])

// Publication status
const publicationStatus = ref<'draft' | 'published'>('draft')

// Grammar check
const grammarSuggestionRef = ref<any>(null)
const grammarSuggestionData = ref<any>(null)
const grammarSuggestionPosition = ref({ x: 0, y: 0 })
const grammarReplacementRange = ref<{ from: number; to: number } | null>(null)

// Source popover
const showSourcePopover = ref(false)
const sourcePopoverPosition = ref({ x: 0, y: 0 })
const sourceSearchQuery = ref('')

// Chart popover
const showChartPopover = ref(false)
const chartPopoverPosition = ref({ x: 0, y: 0 })

// References
const propertiesPanel = ref<any>(null)

// Grammar check extension
const grammarCheckExtension = GrammarCheck.configure({
  language: 'fr',
  level: 'picky',
  debounceMs: 1000,
  modificationThreshold: 60000,
  isEnabled: () => meta.grammarCheckEnabled,
  onShowSuggestion: (position: { x: number; y: number }, data: any, range: { from: number; to: number }) => {
    grammarSuggestionPosition.value = position
    grammarSuggestionData.value = data
    grammarReplacementRange.value = range
    nextTick(() => {
      grammarSuggestionRef.value?.show()
    })
  },
})

// Editor
const editor = useEditor({
  extensions: [
    StarterKit,
    Placeholder.configure({ placeholder: 'Rédigez...' }),
    CharacterCount.configure({ limit: 50000 }),
    DragHandle,
    CustomImage.configure({
      onUpload: uploadImage,
      HTMLAttributes: {
        class: 'rounded-lg max-w-full h-auto mx-auto'
      }
    }),
    Source,
    Chart,
    grammarCheckExtension,
  ],
  content: '',
  autofocus: 'end',
  onUpdate: () => debouncedSave()
})

// Computed
const lastSaved = computed(
  () => (lastSavedDate.value ? lastSavedDate.value.toLocaleString() : 'Jamais')
)

const wordCount = computed(
  () => editor.value?.getText().split(/\s+/).filter((w) => w).length || 0
)

// Methods
const autoResize = () =>
  nextTick(() => {
    if (titleRef.value) {
      titleRef.value.style.height = 'auto'
      titleRef.value.style.height = titleRef.value.scrollHeight + 'px'
    }
  })

const save = async (opts: { silent?: boolean } = {}) => {
  saveState.value = 'loading'
  const payload: any = {
    title: title.value,
    content: editor.value?.getHTML(),
    draft: publicationStatus.value === 'draft',
    slug: meta.slug,
    cover: meta.cover,
    description: meta.description,
    featured: meta.featured,
    sources: JSON.stringify(meta.sources)
  }
  
  if (publicationStatus.value === 'published' && meta.publishedAt) {
    payload.published_at = meta.publishedAt
  }
  
  const { error } = await supabase.from('articles').update(payload).eq('id', id)
  
  if (error) {
    saveState.value = 'error'
    return toast.add({
      title: "Échec de la sauvegarde",
      color: 'error',
      icon: 'tabler-x',
      description: error.message
    })
  }
  
  await setArticleCategories(id, selectedCategories.value)
  lastSavedDate.value = new Date()
  saveState.value = 'success'
  setTimeout(() => { saveState.value = 'default' }, 2000)
  
  if (!opts.silent) {
    toast.add({
      title: "Sauvegardé",
      color: 'success',
      icon: 'tabler-check',
      description: 'L\'article a été sauvegardé avec succès.'
    })
  }
}

const debouncedSave = debounce(() => save({ silent: true }), 2000)

const fetchData = async () => {
  if (!user.value) return router.push('/login')
  
  // Fetch all categories
  categories.value = (await getCategories())?.map((c: any) => c.name) || []
  
  // Fetch article data
  const { data, error } = await supabase.from('articles')
    .select('title,content,draft,published_at,slug,cover,description,featured,sources')
    .eq('id', id)
    .single()
    
  if (error) {
    return toast.add({
      title: "Échec de la récupération",
      color: 'error',
      icon: 'tabler-x',
      description: error.message
    })
  }
  
  title.value = data.title
  editor.value?.commands.setContent(data.content)
  meta.slug = data.slug || ''
  meta.cover = data.cover || ''
  meta.description = data.description || ''
  meta.featured = data.featured || false
  meta.publishedAt = data.published_at

  // Load sources
  try {
    // @ts-ignore: ignore typing for JSON.parse
    meta.sources = data.sources ? JSON.parse(data.sources) : []
  } catch (e) {
    console.error('Error parsing sources:', e)
    meta.sources = []
  }

  publicationStatus.value = data.draft ? 'draft' : 'published'
  lastSavedDate.value = data.published_at ? new Date(data.published_at) : null
  selectedCategories.value = await getArticleCategories(id)
  autoResize()
  
  // Run initial grammar check if enabled and content exists
  if (meta.grammarCheckEnabled && data.content && data.content.trim()) {
    setTimeout(() => {
      if (editor.value && editor.value.view) {
        triggerFullGrammarCheck(editor.value.view)
      }
    }, 1000)
  }
}

const deleteArticle = async () => {
  const confirm = window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')
  if (!confirm) return

  const { error } = await supabase.from('articles').delete().eq('id', id)
  if (error) {
    toast.add({
      title: "La suppression a échoué",
      color: 'error',
      icon: 'tabler-x',
      description: error.message
    })
    return
  }

  toast.add({
    title: "Article supprimé",
    color: 'success',
    icon: 'tabler-check',
    description: 'L\'article a été supprimé avec succès.'
  })
  router.push('/internal/articles')
}

const navigateBack = () => {
  if (saveState.value === 'loading') {
    return // Prevent navigation while saving
  }
  router.push('/internal/articles')
}

const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// Grammar check handlers
const applyGrammarReplacement = (replacement: string) => {
  if (!editor.value || !grammarReplacementRange.value) return
  
  const { from, to } = grammarReplacementRange.value
  const tr = editor.value.state.tr.insertText(replacement, from, to)
  editor.value.view.dispatch(tr)
  
  try {
    removeGrammarDecoration(from, to)
  } catch (error) {
    console.warn('Error removing grammar decoration:', error)
  }
  
  grammarSuggestionData.value = null
  grammarReplacementRange.value = null
}

const ignoreGrammarError = () => {
  if (!editor.value || !grammarReplacementRange.value) return
  
  const { from, to } = grammarReplacementRange.value
  
  try {
    removeGrammarDecoration(from, to)
  } catch (error) {
    console.warn('Error removing grammar decoration:', error)
  }
  
  grammarSuggestionData.value = null
  grammarReplacementRange.value = null
}

const removeGrammarDecoration = (from: number, to: number) => {
  if (!editor.value) return
  
  const currentDecorations = LT_PLUGIN_KEY.getState(editor.value.state) as DecorationSet
  
  if (!currentDecorations || typeof currentDecorations.find !== 'function') {
    console.warn('Grammar decorations not available or not initialized')
    return
  }
  
  const decorationsToRemove = currentDecorations.find(from, to)
  let newDecorations = currentDecorations
  
  decorationsToRemove.forEach(deco => {
    newDecorations = newDecorations.remove([deco])
  })
  
  const tr = editor.value.state.tr.setMeta(LT_PLUGIN_KEY, { set: newDecorations })
  editor.value.view.dispatch(tr)
}

const closeGrammarSuggestion = () => {
  grammarSuggestionData.value = null
  grammarReplacementRange.value = null
}

// Source popover handlers
const openSourcePopover = (event: MouseEvent) => {
  const button = event.target as HTMLElement
  const rect = button.getBoundingClientRect()
  sourcePopoverPosition.value = {
    x: rect.left + rect.width / 2,
    y: rect.bottom + 8
  }
  showSourcePopover.value = true
}

const selectExistingSource = (sourceIndex: number) => {
  if (!editor.value) return
  
  const sourceData = meta.sources[sourceIndex]
  if (!sourceData) return

  editor.value.chain().focus().setSource({
    sourceData: JSON.stringify(sourceData)
  }).run()

  cancelSourcePopover()
}

const createNewSource = () => {
  showSourcePopover.value = false
  isPanelOpen.value = true
  propertiesPanel.value?.setActiveTab('1')
  
  nextTick(() => {
    if (propertiesPanel.value?.sourcesManager) {
      propertiesPanel.value.sourcesManager.openNewSourceDialog()
    }
  })
}

const cancelSourcePopover = () => {
  sourceSearchQuery.value = ''
  showSourcePopover.value = false
}

// Chart popover handlers
const openChartPopover = (event: MouseEvent) => {
  const button = event.target as HTMLElement
  const rect = button.getBoundingClientRect()
  chartPopoverPosition.value = {
    x: rect.left + rect.width / 2,
    y: rect.bottom + 8
  }
  showChartPopover.value = true
}

const createChart = (chartData: { csvData: string, chartType: string, title: string }) => {
  if (!editor.value) return
  
  editor.value.chain().focus().setChart({
    csvData: chartData.csvData,
    chartType: chartData.chartType as any,
    title: chartData.title
  }).run()

  cancelChartPopover()
}

const cancelChartPopover = () => {
  showChartPopover.value = false
}

// Event handlers
const onPublicationStatusChange = () => {
  if (publicationStatus.value === 'published' && !meta.publishedAt) {
    meta.publishedAt = new Date().toISOString()
  }
  debouncedSave()
}

const onSourcesChanged = (sources: SourceType[]) => {
  meta.sources = sources
  debouncedSave()
}

const onCreateCategory = (item: string) => {
  if (!categories.value.includes(item)) {
    categories.value.push(item)
  }
  if (!selectedCategories.value.includes(item)) {
    selectedCategories.value.push(item)
  }
}

// Watchers
watch(title, (newTitle) => {
  if (publicationStatus.value === 'draft' && newTitle.trim()) {
    meta.slug = generateSlug(newTitle)
  }
})

watch(() => meta.grammarCheckEnabled, (enabled) => {
  if (!editor.value) return
  
  if (enabled) {
    console.log('Grammar check enabled')
  } else {
    const tr = editor.value.state.tr.setMeta(LT_PLUGIN_KEY, { set: DecorationSet.empty })
    editor.value.view.dispatch(tr)
    console.log('Grammar check disabled, decorations cleared')
  }
})

// Lifecycle
onMounted(() => {
  fetchData()
})

onUnmounted(() => {
  // Cleanup if needed
})
</script>

<style scoped>
:deep(.tiptap) {
  border: 0;
  outline: none !important;
  box-shadow: none !important;
}

:deep(.tiptap img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1rem 0;
}
</style>
