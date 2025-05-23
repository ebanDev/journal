<template>
  <div class="flex bg-white h-screen overflow-auto">
    <!-- Editor Area -->
    <div :class="['flex-1 px-8 py-6 transition-all', isPanelOpen ? 'mr-80' : 'mx-auto']">
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
      <BubbleMenu v-if="editor" :editor="editor" :tippy-options="{ duration: 100 }"
        class="bg-white rounded-lg shadow p-1 flex gap-1">
        <UButton v-for="b in buttons" :key="b.icon" :icon="b.icon" size="xs" variant="ghost" color="neutral"
          :class="b.active() ? 'bg-amber-100 text-amber-700' : ''" @click="b.command" :title="b.title" />
      </BubbleMenu>

      <!-- Content -->
      <EditorContent :editor="editor"
        class="prose prose-headings:text-stone-700 prose-h1:text-3xl prose-h2:font-extrabold max-w-full w-[800px] min-h-full"
        @click="editor.value?.chain().focus().run()" />
    </div>

    <!-- Properties Panel -->
    <transition name="slide">
      <div v-if="isPanelOpen" class="fixed right-0 top-0 h-full w-80 bg-secondary-50 shadow p-4 flex flex-col z-30">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Propriétés</h3>
          <UButton icon="i-tabler-x" color="neutral" size="xs" variant="ghost" @click="isPanelOpen = false" />
        </div>

        <!-- Tabs -->
        <UTabs v-model="activeTab" :items="tabItems" class="w-full mb-4" :content="false" />

        <div class="space-y-4 flex-1 overflow-y-auto">
          <UFormField label="Slug">
            <UInput v-model="meta.slug" placeholder="mon-article" class="w-full" />
          </UFormField>

          <!-- Cover preview -->
          <div v-if="meta.cover" class="mb-4">
            <img :src="meta.cover" alt="Cover preview" class="w-full h-auto rounded" />
          </div>

          <UFormField label="Cover URL">
            <div class="flex items-center space-x-2">
              <UInput v-model="meta.cover" placeholder="https://..." class="flex-1" />
              <UButton icon="i-tabler-upload" size="sm" @click="triggerFileUpload" title="Upload cover" />
              <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleFileUpload" />
            </div>
          </UFormField>

          <UFormField label="Description">
            <UTextarea v-model="meta.description" placeholder="Courte description..." class="w-full resize-none" />
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

          <UFormField label="À la une">
            <USwitch v-model="meta.featured" />
          </UFormField>

          <div>
            <span class="font-medium">Mots&nbsp;: </span>{{ wordCount }}
          </div>
          <div>
            <span class="font-medium">Dernière sauvegarde&nbsp;: </span>{{ lastSaved }}
          </div>
        </div>

        <div class="mt-auto space-y-2">
          <UButton block color="primary" @click="publish" :loading="saveState === 'loading'"
            :icon="saveState === 'success' ? 'i-mingcute-checkbox-line' : 'i-mingcute-save-2-line'">
            <template v-if="saveState === 'success'">Sauvegardé</template>
            <template v-else>Sauvegarder</template>
          </UButton>
          <UButton block variant="ghost" @click="goBack">Retour à la liste</UButton>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSupabaseClient, useSupabaseUser, useToast } from '#imports'
import { EditorContent, useEditor, BubbleMenu } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import debounce from 'lodash/debounce'
import { useDb } from '~/composables/useDb'

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
    CharacterCount.configure({ limit: 50000 })
  ],
  content: '',
  autofocus: 'end',
  onUpdate: () => debouncedSave()
})
const meta = reactive({ slug: '', cover: '', description: '', featured: false })
const categories = ref<string[]>([])
const selectedCategories = ref<string[]>([])

function onCreateCategory(item: string) {
  if (!categories.value.includes(item)) {
    categories.value.push(item)
  }
  if (!selectedCategories.value.includes(item)) {
    selectedCategories.value.push(item)
  }
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

// Tabs definition
const tabItems = [
  { label: 'Brouillon', icon: 'i-mingcute-edit-line' },
  { label: 'Prêt', icon: 'i-mingcute-checkbox-line' }
]

// default tabs based on draft
const activeTab = ref('0')

// Format buttons
const buttons = [
  { icon: 'i-mingcute-heading-1-line', command: () => editor.value?.chain().focus().toggleHeading({ level: 1 }).run(), active: () => editor.value?.isActive('heading', { level: 1 }) ?? false, title: 'H1' },
  { icon: 'i-mingcute-heading-2-line', command: () => editor.value?.chain().focus().toggleHeading({ level: 2 }).run(), active: () => editor.value?.isActive('heading', { level: 2 }) ?? false, title: 'H2' },
  { icon: 'i-mingcute-heading-3-line', command: () => editor.value?.chain().focus().toggleHeading({ level: 3 }).run(), active: () => editor.value?.isActive('heading', { level: 3 }) ?? false, title: 'H3' },
  { icon: 'i-mingcute-code-line', command: () => editor.value?.chain().focus().toggleCodeBlock().run(), active: () => editor.value?.isActive('codeBlock') ?? false, title: 'Code' },
  { icon: 'i-mingcute-bold-line', command: () => editor.value?.chain().focus().toggleBold().run(), active: () => editor.value?.isActive('bold') ?? false, title: 'Gras' },
  { icon: 'i-mingcute-italic-line', command: () => editor.value?.chain().focus().toggleItalic().run(), active: () => editor.value?.isActive('italic') ?? false, title: 'Italique' },
  { icon: 'i-mingcute-strikethrough-line', command: () => editor.value?.chain().focus().toggleStrike().run(), active: () => editor.value?.isActive('strike') ?? false, title: 'Barré' },
  { icon: 'i-mingcute-list-check-line', command: () => editor.value?.chain().focus().toggleBulletList().run(), active: () => editor.value?.isActive('bulletList') ?? false, title: 'Liste puces' },
  { icon: 'i-mingcute-list-ordered-line', command: () => editor.value?.chain().focus().toggleOrderedList().run(), active: () => editor.value?.isActive('orderedList') ?? false, title: 'Liste numérotée' },
  { icon: 'i-mingcute-quote-right-line', command: () => editor.value?.chain().focus().toggleBlockquote().run(), active: () => editor.value?.isActive('blockquote') ?? false, title: 'Citation' }
]

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
    draft: activeTab.value === '0',
    slug: meta.slug,
    cover: meta.cover,
    description: meta.description,
    featured: meta.featured
  }
  if (activeTab.value === '1') payload.published_at = new Date().toISOString()
  const { error } = await supabase.from('articles').update(payload).eq('id', id)
  if (error) {
    saveState.value = 'error'
    return toast.error('Save failed')
  }
  await setArticleCategories(id, selectedCategories.value)
  lastSavedDate.value = new Date()
  saveState.value = 'success'
  setTimeout(() => { saveState.value = 'default' }, 2000)
  if (!opts.silent) toast.success('Sauvegardé')
}
const debouncedSave = debounce(() => save({ silent: true }), 2000)

const fetchData = async () => {
  if (!user.value) return router.push('/login')
  // Fetch all categories
  categories.value = (await getCategories())?.map((c: any) => c.name) || []
  // Fetch article data
  const { data, error } = await supabase.from('articles')
    .select('title,content,draft,published_at,slug,cover,description,featured')
    .eq('id', id)
    .single()
  if (error) return toast.error('Load failed')
  title.value = data.title
  editor.value?.commands.setContent(data.content)
  meta.slug = data.slug || ''
  meta.cover = data.cover || ''
  meta.description = data.description || ''
  meta.featured = data.featured || false
  lastSavedDate.value = data.published_at ? new Date(data.published_at) : null
  activeTab.value = data.draft ? '0' : '1'
  selectedCategories.value = await getArticleCategories(id)
  autoResize()
}

const publish = () => {
  save()
}
const goBack = () => router.push('/internal/articles')

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

onMounted(fetchData)
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform .3s
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%)
}

:deep(.ProseMirror) {
  @apply min-h-[70vh] outline-none;
}
</style>
