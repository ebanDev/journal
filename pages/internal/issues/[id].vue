<template>
  <div class="flex gap-6 w-full">
    <!-- Left: Articles in this édition -->
    <section class="flex-[3] container mx-auto p-8 ">
      <div class="w-full flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Articles de l'Édition</h1>
        <UButton size="lg" :to="`/internal/articles/new?issue=${editionId}`">Nouvel Article</UButton>
      </div>

      <div v-if="loadingArticles">
        <UPlaceholder class="h-6 w-1/3 mb-4" />
        <div class="space-y-4">
          <UPlaceholder class="h-40" />
          <UPlaceholder class="h-40" />
        </div>
      </div>
      <div v-else>
        <div v-if="articles.length" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6">
          <UCard v-for="article in articles" :key="article.id" class="mb-4 cursor-pointer" @click="router.push(`/internal/articles/${article.id}`)">
            <template #header>
              <h2 class="text-lg font-medium truncate">{{ article.title }}</h2>
              <div class="mt-1">
                <UBadge color="secondary" variant="soft" :label="article.draft ? 'Brouillon' : 'Prêt'" />
              </div>
            </template>
            <div>
              <p class="text-sm text-gray-700 line-clamp-5 mb-2">
                {{ article.metadata?.description || 'Pas de description' }}
              </p>
            </div>
          </UCard>
        </div>
        <div v-else class="text-gray-500">Aucun article dans cette édition.</div>
      </div>
    </section>

    <!-- Right: Settings panel (always visible) -->
    <aside class="flex-[1] bg-secondary-50 p-6 rounded shadow-sm flex flex-col">
      <h2 class="text-xl font-semibold mb-2">Paramètres de l’Édition</h2>
      <UTabs
        v-model="activeStatusTab"
        :items="statusTabs"
        class="w-full mb-4"
        :content="false"
        item-attribute="value"
      />
      <div class="space-y-4 flex-1 overflow-y-auto">
        <UFormField label="Titre">
          <UInput v-model="form.title" />
        </UFormField>
        <UFormField label="Slug">
          <UInput v-model="form.slug" />
        </UFormField>
        <UFormField label="Description">
          <UTextarea v-model="form.description" :rows="3" class="w-full resize-none" />
        </UFormField>
        <UFormField label="Date de publication">
          <UPopover>
            <UButton color="neutral" variant="subtle" icon="i-lucide-calendar">
              {{ calendarDate ? dateFormatter.format(calendarDate.toDate(getLocalTimeZone())) : 'Sélectionner une date' }}
            </UButton>
            <template #content>
              <UCalendar v-model="calendarDate as any" class="p-2" />
            </template>
          </UPopover>
        </UFormField>
        <UFormField label="Image de couverture">
          <div class="flex items-center space-x-2">
            <UInput v-model="form.cover" placeholder="URL de l'image de couverture" class="flex-1" />
            <UButton icon="i-tabler-upload" size="sm" @click="triggerFileUpload" title="Télécharger une image" />
            <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleFileUpload" />
          </div>
          <div v-if="form.cover" class="mt-2">
            <img :src="form.cover" alt="Aperçu de la couverture" class="w-full max-h-40 object-contain rounded" />
          </div>
        </UFormField>
      </div>
      <div class="mt-auto space-y-2">
        <UButton
          block
          color="primary"
          @click="saveEdition"
          :loading="saveState === 'loading'"
          :icon="saveState === 'success' ? 'i-mingcute-checkbox-line' : 'i-mingcute-save-2-line'"
        >
          <template v-if="saveState === 'success'">Sauvegardé</template>
          <template v-else>Enregistrer</template>
        </UButton>
        <UButton block color="error" variant="soft" @click="askDelete">Supprimer l’édition</UButton>
      </div>
    </aside>
    <UModal v-model:open="showDeleteModal">
      <template #title>
        Confirmer la suppression
      </template>
      <template #body>
        <div class="py-2">
          Voulez-vous vraiment supprimer l’édition <b>{{ form.title }}</b> ?
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="primary" @click="confirmDelete" :loading="deleting">Supprimer</UButton>
          <UButton @click="showDeleteModal = false" :disabled="deleting" color="secondary">Annuler</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useSupabaseClient } from '#imports'
import { useDb } from '~/composables/useDb'
import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'

const supabase = useSupabaseClient()
const { getIssueById, getArticles, deleteIssueById } = useDb()
const route = useRoute()
const router = useRouter()
const editionId = String(route.params.id)

// Edition type for type safety
interface Edition {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  status: string;
  published_at?: string;
  cover?: string;
}

// Form state
const form = reactive({ title: '', slug: '', description: '', status: 'draft', published_at: '', cover: '' })
const saving = ref(false)
const calendarDate = ref<CalendarDate | null>(null)
const fileInput = ref<HTMLInputElement | null | undefined>(null)
const dateFormatter = new DateFormatter('fr-FR', { dateStyle: 'medium' })

// Articles list
const articles = ref<Array<{id:string; title:string; draft?:boolean; metadata?:any}>>([])
const loadingArticles = ref(true)

// Delete modal state
const showDeleteModal = ref(false)
const deleting = ref(false)

const statusTabs = [
  { label: 'Brouillon', value: 'draft', icon: 'i-mingcute-edit-line' },
  { label: 'Prêt', value: 'ready', icon: 'i-mingcute-checkbox-line' },
  { label: 'Publié', value: 'published', icon: 'i-mingcute-rocket-line' }
]
const activeStatusTab = ref('draft')

// Save button state: 'default' | 'loading' | 'success'
const saveState = ref<'default' | 'loading' | 'success'>('default')

const translateEditionStatus = (status: string) => {
  switch (status) {
    case 'draft':
      return 'Brouillon'
    case 'ready':
      return 'Prêt'
    case 'published':
      return 'Publié'
    default:
      return status
  }
}

function askDelete() {
  showDeleteModal.value = true
}
async function confirmDelete() {
  deleting.value = true
  try {
    await deleteIssueById(editionId)
    router.push('/internal/issues')
  } catch (e) {
    // Optionally show error
  } finally {
    deleting.value = false
    showDeleteModal.value = false
  }
}

// Channels
let issueChannel: RealtimeChannel
let articlesChannel: RealtimeChannel

// Load edition and nested articles
async function fetchEdition() {
  saving.value = false
  // get edition settings
  const ed = await getIssueById(editionId) as Edition | null
  if (!ed) return router.push('/internal/issues')
  form.title = ed.title
  form.slug = ed.slug ?? ''
  form.description = ed.description ?? ''
  form.status = ed.status
  form.cover = ed.cover || ''
  if (ed.published_at) {
    const d = new Date(ed.published_at)
    calendarDate.value = new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
    form.published_at = d.toISOString().split('T')[0]
  } else {
    calendarDate.value = null
    form.published_at = ''
  }
  activeStatusTab.value = ed.status || 'draft'
  articles.value = await getArticles([{type: 'issue', id: editionId}]) || []
  loadingArticles.value = false
}

async function handleFileUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const { data, error } = await supabase.storage.from('covers').upload(`public/${file.name}`, file)
  if (error) return
  const { data: coverData } = supabase.storage.from('covers').getPublicUrl(data.path)
  form.cover = coverData.publicUrl
}

function triggerFileUpload() {
  (fileInput.value as HTMLInputElement)?.click();
}

// Save edition changes
async function saveEdition() {
  saveState.value = 'loading'
  const publishedAtIso = calendarDate.value ? calendarDate.value.toDate(getLocalTimeZone()).toISOString() : null
  const { error } = await supabase
    .from('issues')
    .update({ title: form.title, slug: form.slug, description: form.description, status: activeStatusTab.value, published_at: publishedAtIso, cover: form.cover })
    .eq('id', editionId)
  if (error) {
    saveState.value = 'default'
    return
  }
  form.status = activeStatusTab.value
  form.published_at = publishedAtIso ? publishedAtIso.split('T')[0] : ''
  saveState.value = 'success'
  setTimeout(() => { saveState.value = 'default' }, 2000)
}

// Delete edition
async function deleteEdition() {
  if (!confirm('Supprimer cette édition ?')) return
  const { error } = await supabase.from('issues').delete().eq('id', editionId)
  if (error) console.error(error)
  else router.push('/internal/issues')
}

onMounted(() => {
  fetchEdition()
  // realtime for edition settings
  issueChannel = supabase
    .channel(`public:issues:id=eq.${editionId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'issues', filter: `id=eq.${editionId}` }, fetchEdition)
    .subscribe()
  // realtime for articles in edition
  articlesChannel = supabase
    .channel('public:articles')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'articles', filter: `issue_id=eq.${editionId}` }, fetchEdition)
    .subscribe()
})

onUnmounted(() => {
  supabase.removeChannel(issueChannel)
  supabase.removeChannel(articlesChannel)
})
</script>
