<template>
  <div class="flex h-screen overflow-auto">
    <!-- Editor Area -->
    <div :class="['flex-1 px-8 py-6 transition-all', isPanelOpen ? 'mr-80' : 'mx-auto']">
      <!-- Back Button -->
      <div class="fixed top-4 left-60 z-20">
        <UButton icon="i-mingcute-arrow-left-line" variant="ghost" color="neutral" :loading="saveState === 'loading'"
          :disabled="saveState === 'loading'" @click="navigateBack">
          <template v-if="saveState === 'loading'">En attente de la sauvegarde</template>
          <template v-else></template>
        </UButton>
      </div>

      <!-- Floating Actions -->
      <div class="fixed top-4 right-4 flex gap-2 z-20">
        <UButton v-if="saveState === 'loading'" icon="i-mingcute-sandglass-line" variant="ghost" color="neutral"
          title="Sauvegarde en cours" />
        <UButton v-else-if="saveState === 'error'" icon="mingcute-warning-line" variant="ghost" color="error"
          title="Erreur lors de la sauvegarde" />
        <UButton v-else icon="i-mingcute-checkbox-line" variant="ghost" color="neutral" title="Sauvegardé" />
        <UButton icon="mingcute-settings-2-line" variant="ghost" color="neutral" @click="isPanelOpen = !isPanelOpen"
          :title="isPanelOpen ? 'Masquer les propriétés' : 'Afficher les propriétés'" />
      </div>

      <!-- Title -->
      <textarea v-model="title" placeholder="Titre de l´article..." ref="titleRef" @input="autoResize" rows="1"
        class="w-full text-4xl font-extrabold bg-transparent border-none focus:outline-none my-4 resize-none overflow-hidden whitespace-pre-line break-words" />

      <!-- Bubble Menu -->
      <BubbleMenu v-if="editor" :editor="editor" :options="{ offset: 6, placement: 'top' }">
        <div class="bg-white rounded-lg shadow p-1 flex gap-1">

          <!-- Other format buttons -->
          <UTooltip v-for="b in buttonsWithoutLink" :key="b.icon" :text="b.title">
            <UButton :icon="b.icon" size="xs" variant="ghost" color="neutral"
              :class="b.active() ? 'bg-amber-100 text-amber-700' : ''" @click="b.command" />
          </UTooltip>
          <!-- Source button (non-popover) -->
          <UTooltip text="Source">
            <UButton icon="i-mingcute-book-2-line" size="xs" variant="ghost" color="neutral"
              :class="editor && editor.isActive('source') ? 'bg-amber-100 text-amber-700' : ''"
              @click.stop="openSourcePopover" />
          </UTooltip>
        </div>
      </BubbleMenu>

      <!-- Source Popover (outside BubbleMenu) -->
      <UPopover v-model:open="showLinkPopover" :content="{ side: 'bottom', align: 'start' }">
        <!-- Invisible trigger positioned at the source button location -->
        <div ref="sourceButtonRef" class="absolute pointer-events-none" 
          :style="{ left: buttonPosition.x + 'px', top: buttonPosition.y + 'px', width: '1px', height: '1px' }" />
        
        <template #content>
          <div class="p-4 space-y-3 w-80" @click.stop @mousedown.stop>
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-medium">Ajouter une source</h3>
              <UButton icon="i-mingcute-close-line" size="xs" variant="ghost" @click="cancelLink" />
            </div>
            
            <!-- Search existing sources -->
            <div class="space-y-2">
              <UInput v-model="sourceSearchQuery" placeholder="Rechercher une source..." class="w-full" 
                icon="i-mingcute-search-line" />
              
              <!-- Sources list -->
              <div class="max-h-32 overflow-y-auto space-y-1">
                <div v-for="(source, index) in filteredSources" :key="index"
                  class="p-2 hover:bg-gray-50 rounded cursor-pointer text-sm border border-gray-200"
                  @click="selectExistingSource(index)">
                  <div class="font-medium truncate">{{ source.title }}</div>
                  <div class="text-gray-500 text-xs truncate">{{ source.url }}</div>
                </div>
                
                <div v-if="filteredSources.length === 0 && sourceSearchQuery" 
                  class="p-2 text-sm text-gray-500 text-center">
                  Aucune source trouvée
                </div>
              </div>
            </div>
            
            <!-- Add new source button -->
            <div class="pt-2">
              <UButton block variant="outline" icon="i-mingcute-add-line" @click="createNewSource">
                Ajouter une source
              </UButton>
            </div>
          </div>
        </template>
      </UPopover>

      <!-- Content -->
      <EditorContent :editor="editor"
        class="prose prose-headings:text-stone-700 prose-h1:text-3xl prose-h2:font-extrabold max-w-full w-[800px] min-h-full"
        @click="editor?.chain().focus().run()" />
    </div>

    <!-- Properties Panel -->
    <transition name="slide">
      <div v-if="isPanelOpen" class="fixed right-0 top-0 h-full w-80 bg-white shadow p-4 flex flex-col z-30">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Propriétés</h3>
          <UButton icon="i-tabler-x" color="neutral" size="xs" variant="ghost" @click="isPanelOpen = false" />
        </div>

        <!-- Tabs -->
        <UTabs v-model="activeTab" :items="tabItems" class="w-full mb-4" :content="false" />

        <div class="space-y-4 flex-1 overflow-y-auto" v-if="activeTab === '0'">
          <!-- Properties Tab Content -->
          <div class="mb-4">
            <UTabs v-model="activePropertiesTab" :items="propertiesTabItems" class="w-full" :content="false" />
          </div>

          <div v-if="activePropertiesTab === '0'" class="space-y-4">
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
                  <UButton icon="i-tabler-upload" size="sm" @click="triggerFileUpload" />
                </UTooltip>
                <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleFileUpload" />
              </div>
            </UFormField>

            <UFormField label="Description">
              <UTextarea v-model="meta.description" placeholder="Courte description..." class="w-full resize-none" />
            </UFormField>

            <UFormField label="Catégories">
              <USelectMenu v-model="selectedCategories" create-item :items="categories" multiple
                placeholder="Ajouter des catégories..." class="w-full" @create="onCreateCategory" />
            </UFormField>

            <UFormField label="Article à la une">
              <USwitch v-model="meta.featured" />
            </UFormField>

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
              <USelect v-model="publicationStatus" :items="publicationStatusOptions"
                @change="onPublicationStatusChange" />
            </UFormField>

            <div v-if="publicationStatus === 'published'" class="text-sm text-green-600">
              <Icon name="i-mingcute-checkbox-line" class="mr-1" />
              Article publié{{ meta.publishedAt ? ` le ${new Date(meta.publishedAt).toLocaleDateString('fr-FR')}` : ''
              }}
            </div>

            <div v-else class="text-sm text-gray-600">
              <Icon name="i-mingcute-edit-line" class="mr-1" />
              Article en brouillon
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === '1'" class="space-y-4 flex-1 overflow-y-auto">
          <!-- Sources Tab Content -->
          <SourcesManager ref="sourcesManager" :editor="editor" @sources-changed="onSourcesChanged" />
        </div>

        <div class="mt-auto space-y-2">
          <UButton block color="primary" @click="publish" :loading="saveState === 'loading'"
            :icon="saveState === 'success' ? 'i-mingcute-checkbox-line' : 'i-mingcute-save-2-line'">
            <template v-if="saveState === 'success'">Sauvegardé</template>
            <template v-else>Sauvegarder</template>
          </UButton>
          <UButton block color="error" variant="outline" @click="deleteArticle" icon="i-mingcute-delete-2-line">
            Supprimer l'article
          </UButton>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSupabaseClient, useSupabaseUser, useToast } from '#imports'
import { EditorContent, useEditor } from '@tiptap/vue-3'
// @ts-ignore
import { BubbleMenu } from '@tiptap/vue-3/menus'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Link from '@tiptap/extension-link'
import { DragHandle } from '@tiptap/extension-drag-handle'
import { Source } from '~/extensions/source'
import debounce from 'lodash/debounce'
import { useDb } from '~/composables/useDb'
import type { Source as SourceType } from '~/composables/useSources'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
const route = useRoute()
const toast = useToast()
const id = String(route.params.id)
const { getCategories, setArticleCategories, getArticleCategories } = useDb()

// State
const title = ref('')
const titleRef = ref<HTMLTextAreaElement | null>(null)
const editor = useEditor({
  extensions: [
    StarterKit,
    Placeholder.configure({ placeholder: 'Rédigez...' }),
    CharacterCount.configure({ limit: 50000 }),
    DragHandle,
    Source,
  ],
  content: '',
  autofocus: 'end',
  onUpdate: () => debouncedSave()
})
const meta = reactive({
  slug: '',
  cover: '',
  description: '',
  featured: false,
  publishedAt: null as string | null,
  sources: [] as SourceType[]
})
const categories = ref<string[]>([])
const selectedCategories = ref<string[]>([])
const sourcesManager = ref<any>(null)
// Link popover state
const linkUrl = ref<string>('')
const selectedSourceIdx = ref<number | undefined>(undefined)
const showLinkPopover = ref<boolean>(false)
const sourceButtonRef = ref<HTMLElement | null>(null)
const buttonPosition = ref({ x: 0, y: 0 })
const sourceSearchQuery = ref<string>('')

// Properties tabs
const propertiesTabItems = [
  { label: 'Général', icon: 'i-mingcute-settings-2-line' },
  { label: 'Publication', icon: 'i-mingcute-time-line' }
]

// Publication status
const publicationStatus = ref<'draft' | 'published'>('draft')
const publicationStatusOptions = [
  { label: 'Brouillon', value: 'draft' },
  { label: 'Publié', value: 'published' }
]

function onCreateCategory(item: string) {
  if (!categories.value.includes(item)) {
    categories.value.push(item)
  }
  if (!selectedCategories.value.includes(item)) {
    selectedCategories.value.push(item)
  }
}

// Sources management
const onSourcesChanged = (sources: SourceType[]) => {
  meta.sources = sources
  debouncedSave()
}

// Publication status management
const onPublicationStatusChange = () => {
  if (publicationStatus.value === 'published' && !meta.publishedAt) {
    meta.publishedAt = new Date().toISOString()
  }
  debouncedSave()
}

const isPanelOpen = ref(false)
const lastSavedDate = ref<Date | null>(null)
const saveState = ref<'default' | 'loading' | 'success' | 'error'>('default')

// Computed
const lastSaved = computed(
  () => (lastSavedDate.value ? lastSavedDate.value.toLocaleString() : 'Jamais')
)
const wordCount = computed(
  () => editor.value?.getText().split(/\s+/).filter((w) => w).length || 0
)

// Filtered sources based on search query
const filteredSources = computed(() => {
  if (!sourceSearchQuery.value.trim()) {
    return meta.sources
  }
  const query = sourceSearchQuery.value.toLowerCase()
  return meta.sources.filter(source => 
    source.title.toLowerCase().includes(query) || 
    (source.url && source.url.toLowerCase().includes(query))
  )
})

// Tabs definition
const tabItems = [
  { label: 'Propriétés', icon: 'i-mingcute-settings-2-line' },
  { label: 'Sources', icon: 'i-mingcute-book-2-line' }
]

// default tabs based on draft
const activeTab = ref('0')
const activePropertiesTab = ref('0')

// Define function to handle source insertion via prompt or existing sources
// Handlers for Popover source insertion
const selectExistingSource = (sourceIndex: number) => {
  if (!editor.value) return
  
  const sourceData = meta.sources[sourceIndex]
  if (!sourceData) return

  // Insert source mark with the source data
  editor.value.chain().focus().setSource({
    sourceData: JSON.stringify(sourceData)
  }).run()

  // Reset popover
  cancelLink()
}

const createNewSource = () => {
  // Close the popover and open the sidebar on Sources tab
  showLinkPopover.value = false
  isPanelOpen.value = true
  activeTab.value = '1' // Switch to Sources tab
  
  // Tell the SourcesManager to open the new source dialog
  nextTick(() => {
    if (sourcesManager.value) {
      sourcesManager.value.openNewSourceDialog()
    }
  })
}

const applySourceInPopover = () => {
  if (!editor.value) return

  let sourceData = null

  if (selectedSourceIdx.value !== undefined) {
    // Use existing source from the sources list
    sourceData = meta.sources[selectedSourceIdx.value]
  } else if (linkUrl.value.trim()) {
    // Create a new source from URL
    sourceData = {
      url: linkUrl.value.trim(),
      title: linkUrl.value.trim(), // Will be updated when source is added to the sources list
      description: '',
      author: '',
      publishedAt: ''
    }
  }

  if (!sourceData) return

  // Insert source mark with the source data
  editor.value.chain().focus().setSource({
    sourceData: JSON.stringify(sourceData)
  }).run()

  // Reset popover
  linkUrl.value = ''
  selectedSourceIdx.value = undefined
  showLinkPopover.value = false
}

const cancelLink = () => {
  linkUrl.value = ''
  selectedSourceIdx.value = undefined
  sourceSearchQuery.value = ''
  showLinkPopover.value = false
}

const openSourcePopover = (event: MouseEvent) => {
  console.log('Opening source popover')
  // Get the button position relative to the viewport
  const button = event.target as HTMLElement
  const rect = button.getBoundingClientRect()
  buttonPosition.value = {
    x: rect.left + rect.width / 2, // Center of the button
    y: rect.bottom + 8 // Just below the button
  }
  showLinkPopover.value = true
}

// Format buttons
const buttons = [
  // @ts-ignore
  { icon: 'i-mingcute-heading-1-line', command: () => { editor.value?.chain().focus().toggleHeading({ level: 1 }).run() }, active: () => editor.value?.isActive('heading', { level: 1 }) ?? false, title: 'Titre 1' },
  // @ts-ignore
  { icon: 'i-mingcute-heading-2-line', command: () => { editor.value?.chain().focus().toggleHeading({ level: 2 }).run() }, active: () => editor.value?.isActive('heading', { level: 2 }) ?? false, title: 'Titre 2' },
  // @ts-ignore
  { icon: 'i-mingcute-heading-3-line', command: () => { editor.value?.chain().focus().toggleHeading({ level: 3 }).run() }, active: () => editor.value?.isActive('heading', { level: 3 }) ?? false, title: 'Titre 3' },
  { icon: 'i-mingcute-code-line', command: () => { editor.value?.chain().focus().toggleCodeBlock().run() }, active: () => editor.value?.isActive('codeBlock') ?? false, title: 'Code' },
  // @ts-ignore
  { icon: 'i-mingcute-bold-line', command: () => { editor.value?.chain().focus().toggleBold().run() }, active: () => editor.value?.isActive('bold') ?? false, title: 'Gras' },
  // @ts-ignore
  { icon: 'i-mingcute-italic-line', command: () => { editor.value?.chain().focus().toggleItalic().run() }, active: () => editor.value?.isActive('italic') ?? false, title: 'Italique' },
  // @ts-ignore
  { icon: 'i-mingcute-strikethrough-line', command: () => { editor.value?.chain().focus().toggleStrike().run() }, active: () => editor.value?.isActive('strike') ?? false, title: 'Barré' },
  { icon: 'i-mingcute-list-check-line', command: () => { editor.value?.chain().focus().toggleBulletList().run() }, active: () => editor.value?.isActive('bulletList') ?? false, title: 'Liste puces' },
  { icon: 'i-mingcute-list-ordered-line', command: () => { editor.value?.chain().focus().toggleOrderedList().run() }, active: () => editor.value?.isActive('orderedList') ?? false, title: 'Liste numérotée' },
  // @ts-ignore
  { icon: 'i-mingcute-quote-right-line', command: () => { editor.value?.chain().focus().toggleBlockquote().run() }, active: () => editor.value?.isActive('blockquote') ?? false, title: 'Citation' },
]
const buttonsWithoutLink = buttons

// Helpers & CRUD
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
  if (!opts.silent) toast.add({
    title: "Sauvegardé",
    color: 'success',
    icon: 'tabler-check',
    description: 'L\'article a été sauvegardé avec succès.'
  })
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
  if (error) return toast.add({
    title: "Échec de la récupération",
    color: 'error',
    icon: 'tabler-x',
    description: error.message
  })
  title.value = data.title
  editor.value?.commands.setContent(data.content)
  meta.slug = data.slug || ''
  meta.cover = data.cover || ''
  meta.description = data.description || ''
  meta.featured = data.featured || false
  meta.publishedAt = data.published_at

  // Load sources
  try {
    meta.sources = data.sources ? JSON.parse(data.sources) : []
    console.log('Loaded sources from database:', meta.sources)
    // Load sources into the sources manager if it's ready
    if (sourcesManager.value && meta.sources.length > 0) {
      console.log('Loading sources into existing manager')
      sourcesManager.value.loadSources(meta.sources)
    }
  } catch (e) {
    console.error('Error parsing sources:', e)
    meta.sources = []
  }

  publicationStatus.value = data.draft ? 'draft' : 'published'
  lastSavedDate.value = data.published_at ? new Date(data.published_at) : null
  selectedCategories.value = await getArticleCategories(id)
  autoResize()
}

const publish = () => {
  save()
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

const triggerFileUpload = () => {
  fileInput.value?.click()
}

const handleFileUpload = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const { data, error } = await supabase.storage.from('covers').upload(`public/${file.name}`, file)
  if (error) return toast.add({ title: "Le téléchargement de l'image a échoué", color: 'error', icon: 'tabler-x', description: error.message })

  const { data: coverData } = supabase.storage.from('covers').getPublicUrl(data.path)
  meta.cover = coverData.publicUrl
}

const fileInput = ref<HTMLInputElement | null>(null)

onMounted(() => {
  fetchData()
})

// Clean up
onUnmounted(() => {
  // Cleanup if needed
})

// Navigation function
const navigateBack = () => {
  if (saveState.value === 'loading') {
    return // Prevent navigation while saving
  }
  router.push('/internal/articles')
}

// Helper function to generate slug from title
const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

// Watch title changes for auto-slug generation
watch(title, (newTitle) => {
  // Only auto-generate slug if:
  // 1. Article is in draft status
  // 2. Title is not empty
  // Note: We sync the slug with title for drafts even if slug already exists
  if (publicationStatus.value === 'draft' && newTitle.trim()) {
    meta.slug = generateSlug(newTitle)
  }
})

// Watch for sourcesManager to be ready and load sources
watch(sourcesManager, (newManager) => {
  if (newManager && meta.sources.length > 0) {
    console.log('Loading sources into manager:', meta.sources)
    newManager.loadSources(meta.sources)
  }
}, { immediate: true })

// Also watch for changes in meta.sources to reload into manager
watch(() => meta.sources, (newSources) => {
  if (sourcesManager.value && newSources.length > 0) {
    console.log('Sources changed, reloading into manager:', newSources)
    sourcesManager.value.loadSources(newSources)
  }
}, { deep: true })
</script>

<style scoped>
:deep(.tiptap) {
  border: 0;
  outline: none !important;
  box-shadow: none !important;
}
</style>
