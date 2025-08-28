<template>
  <div class="flex h-full w-full">
    <!-- Left Sidebar: Editions List (1/3) -->
    <div class="w-1/3 bg-white border-r border-gray-200 flex flex-col">
      <!-- Header -->
      <div class="p-6 border-b border-gray-200 flex-shrink-0">
        <div class="flex justify-between items-center">
          <h1 class="text-xl font-bold">Éditions</h1>
          <UButton size="sm" icon="i-mingcute-add-line" @click="openCreateEditionModal" color="primary">
            Nouvelle Édition
          </UButton>
        </div>
      </div>

      <!-- Editions List -->
      <div class="flex-1 overflow-y-auto p-4">
        <div v-if="pendingEditions" class="space-y-2">
          <USkeleton class="h-16 w-full" v-for="i in 3" :key="i" />
        </div>
        <div v-else-if="editions && editions.length" class="space-y-2">
          <div 
            v-for="edition in editions" 
            :key="edition.id"
            class="group flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            :class="{ 'bg-primary-50 border border-primary-200': selectedEdition?.id === edition.id }"
            @click="selectEdition(edition)"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="font-medium text-sm truncate">{{ edition.title }}</h3>
                <UBadge 
                  :color="getStatusColor(edition.status)" 
                  size="sm" 
                  variant="soft"
                >
                  {{ translateEditionStatus(edition.status) }}
                </UBadge>
              </div>
              <p class="text-xs text-gray-500 truncate">
                {{ edition.description || 'Pas de description' }}
              </p>
              <div v-if="edition.published_at" class="text-xs text-gray-400 mt-1">
                {{ new Date(edition.published_at).toLocaleDateString() }}
              </div>
            </div>
            <div class="flex items-center gap-1">
              <UButton 
                icon="i-mingcute-settings-2-line" 
                size="sm" 
                variant="ghost" 
                color="neutral"
                class="opacity-0 group-hover:opacity-100 transition-opacity"
                @click.stop="openEditionSettings(edition)"
              />
              <UButton 
                icon="i-mingcute-delete-2-line" 
                size="sm" 
                variant="ghost" 
                color="error"
                class="opacity-0 group-hover:opacity-100 transition-opacity"
                @click.stop="askDelete(edition)"
              />
            </div>
          </div>
        </div>
        <div v-else class="text-center text-gray-500 py-8">
          <UIcon name="i-mingcute-book-2-line" class="w-8 h-8 mx-auto mb-2" />
          <p class="text-sm">Aucune édition</p>
        </div>
      </div>
    </div>

    <!-- Right Panel: Articles (2/3) -->
    <div class="flex-1 flex flex-col">
      <!-- Header -->
      <div class="p-6 border-b border-gray-200 bg-white flex-shrink-0">
        <div v-if="selectedEdition" class="flex justify-between items-center gap-4">
          <div class="flex-1 min-w-0">
            <h2 class="text-xl font-bold">{{ selectedEdition.title }}</h2>
            <p class="text-sm text-gray-600 mt-1 line-clamp-3">{{ selectedEdition.description || 'Pas de description' }}</p>
          </div>
          <UButton 
            size="sm" 
            icon="i-mingcute-add-line" 
            :to="`/internal/articles/new?issue=${selectedEdition.id}`"
            color="primary"
            class="flex-shrink-0"
          >
            Nouvel Article
          </UButton>
        </div>
        <div v-else class="text-center py-8">
          <UIcon name="i-mingcute-arrow-left-line" class="w-6 h-6 mx-auto mb-2 text-gray-400" />
          <p class="text-gray-500">Sélectionnez une édition pour voir ses articles</p>
        </div>
      </div>

      <!-- Articles List -->
      <div class="flex-1 overflow-y-auto p-6">
        <div v-if="loadingArticles" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <USkeleton class="h-32" v-for="i in 4" :key="i" />
        </div>
        <div v-else-if="selectedEdition && articles.length">
          <!-- Articles grid (3 per row) -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
            <UCard 
              v-for="article in articles"
              :key="article.id"
              class="cursor-pointer hover:shadow-md transition-shadow flex flex-col h-full"
              @click="router.push(`/internal/articles/${article.id}`)"
            >
              <template #header>
                <div class="flex items-start justify-between">
                  <div class="flex-1 min-w-0">
                    <h3 class="font-medium truncate text-sm">{{ article.title }}</h3>
                    <div class="flex items-center gap-2 mt-1">
                      <UBadge 
                        :color="article.draft ? 'neutral' : 'success'" 
                        size="sm" 
                        variant="soft"
                      >
                        {{ article.draft ? 'Brouillon' : 'Prêt' }}
                      </UBadge>
                      <UBadge 
                        v-if="article.featured" 
                        color="warning" 
                        size="sm" 
                        variant="soft"
                      >
                        À la une
                      </UBadge>
                      <UBadge 
                        v-if="article.slug && analyticsData.has(article.slug)" 
                        color="info" 
                        size="sm" 
                        variant="soft"
                        :icon="loadingAnalytics ? 'i-mingcute-loading-line' : 'i-mingcute-eye-line'"
                      >
                        {{ analyticsData.get(article.slug)?.views || 0 }} vues
                      </UBadge>
                    </div>
                  </div>
                </div>
              </template>
              <div class="flex flex-col h-full">
                <!-- Cover image -->
                <div v-if="article.cover" class="mb-3 flex-shrink-0">
                  <img 
                    :src="article.cover" 
                    :alt="article.title"
                    class="w-full h-24 object-cover rounded"
                    @error="article.cover = ''"
                  />
                </div>
                <!-- Description -->
                <div class="flex-1">
                  <p class="text-xs text-gray-600 description-clamp">
                    {{ article.description || 'Pas de description' }}
                  </p>
                </div>
              </div>
            </UCard>
          </div>
        </div>
        <div v-else-if="selectedEdition" class="text-center py-16">
          <UIcon name="i-mingcute-file-line" class="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p class="text-gray-500 mb-6">Aucun article dans cette édition</p>
          <UButton 
            :to="`/internal/articles/new?issue=${selectedEdition.id}`"
            color="primary"
            variant="soft"
            class="flex-shrink-0"
          >
            Créer le premier article
          </UButton>
        </div>
      </div>
    </div>

    <!-- Edition Settings Modal -->
    <UModal v-model:open="showSettingsModal" title="Paramètres de l'édition">
      <template #body>
        <div v-if="editingEdition" class="space-y-4">
          <UFormField label="Titre" required>
            <UInput v-model="editingEdition.title" placeholder="Titre de l'édition" class="w-full" />
          </UFormField>

          <UFormField label="Lien" required>
            <UInput v-model="editingEdition.slug" placeholder="lien-de-l-edition" class="w-full">
              <template #leading>
                <span class="text-gray-500">/</span>
              </template>
            </UInput>
          </UFormField>

          <UFormField label="Description">
            <UTextarea 
              v-model="editingEdition.description" 
              placeholder="Description de l'édition"
              :rows="3"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Statut">
            <USelect
              v-model="editingEdition.status"
              :items="statusOptions"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Date de publication">
            <UInput 
              v-model="editingEdition.published_at" 
              type="date"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Image de couverture">
            <div class="flex items-center space-x-2">
              <UInput 
                v-model="editingEdition.cover" 
                placeholder="https://example.com/image.jpg"
                class="flex-1"
              />
              <UButton 
                icon="i-tabler-upload" 
                size="sm" 
                @click="triggerFileUploadSettings"
                variant="outline"
              />
              <input type="file" ref="fileInputSettings" class="hidden" accept="image/*" @change="handleFileUploadSettings" />
            </div>
            <div v-if="editingEdition.cover" class="mt-2">
              <img 
                :src="editingEdition.cover" 
                alt="Aperçu" 
                class="w-full h-32 object-cover rounded"
                @error="editingEdition.cover = ''"
              />
            </div>
          </UFormField>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton 
            color="secondary" 
            @click="showSettingsModal = false"
          >
            Annuler
          </UButton>
          <UButton 
            color="primary" 
            @click="saveEditionSettings"
            :loading="savingSettings"
          >
            Enregistrer
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="showDeleteModal" title="Confirmer la suppression">
      <template #body>
        <div>
          <p class="mb-2">
            Voulez-vous vraiment supprimer l'édition 
            <strong>{{ editionToDelete?.title }}</strong> ?
          </p>
          <p class="text-sm text-gray-500">Cette action est irréversible.</p>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton 
            color="secondary" 
            @click="showDeleteModal = false"
            :disabled="deleting"
          >
            Annuler
          </UButton>
          <UButton 
            color="error" 
            @click="confirmDelete"
            :loading="deleting"
          >
            Supprimer
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Create Edition Modal -->
    <UModal v-model:open="showCreateModal" title="Nouvelle édition">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Titre" required>
            <UInput v-model="newEdition.title" placeholder="Titre de l'édition" class="w-full" />
          </UFormField>

          <UFormField label="Lien" required>
            <UInput v-model="newEdition.slug" placeholder="lien-de-l-edition" class="w-full">
              <template #leading>
                <span class="text-gray-500">/</span>
              </template>
            </UInput>
          </UFormField>

          <UFormField label="Description">
            <UTextarea 
              v-model="newEdition.description" 
              placeholder="Description de l'édition"
              :rows="3"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Statut">
            <USelect
              v-model="newEdition.status"
              :items="statusOptions"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Date de publication">
            <UInput 
              v-model="newEdition.published_at" 
              type="date"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Image de couverture">
            <div class="flex items-center space-x-2">
              <UInput 
                v-model="newEdition.cover" 
                placeholder="https://example.com/image.jpg"
                class="flex-1"
              />
              <UButton 
                icon="i-tabler-upload" 
                size="sm" 
                @click="triggerFileUploadCreate"
                variant="outline"
              />
              <input type="file" ref="fileInputCreate" class="hidden" accept="image/*" @change="handleFileUploadCreate" />
            </div>
            <div v-if="newEdition.cover" class="mt-2">
              <img 
                :src="newEdition.cover" 
                alt="Aperçu" 
                class="w-full h-32 object-cover rounded"
                @error="newEdition.cover = ''"
              />
            </div>
          </UFormField>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton 
            color="secondary" 
            @click="showCreateModal = false"
          >
            Annuler
          </UButton>
          <UButton 
            color="primary" 
            @click="createEdition"
            :loading="creatingEdition"
          >
            Créer l'édition
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSupabaseClient, useToast } from '#imports'
import { useDb } from '~/composables/useDb'
import { useAnalytics } from '~/composables/useAnalytics'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Tables } from '~/types/database.types'

const supabase = useSupabaseClient()
const { getIssues, deleteIssueById, getArticles } = useDb()
const { getMultipleArticleViews } = useAnalytics()
const router = useRouter()
const toast = useToast()

// State
const selectedEdition = ref<Tables<'issues'> | null>(null)
const articles = ref<any[]>([])
const analyticsData = ref<Map<string, any>>(new Map())
const loadingArticles = ref(false)
const loadingAnalytics = ref(false)
const showSettingsModal = ref(false)
const showDeleteModal = ref(false)
const showCreateModal = ref(false)
const editingEdition = ref<Tables<'issues'> | null>(null)
const editionToDelete = ref<Tables<'issues'> | null>(null)
const newEdition = ref({
  title: '',
  slug: '',
  description: '',
  status: 'draft',
  cover: '',
  published_at: ''
})
const savingSettings = ref(false)
const deleting = ref(false)
const creatingEdition = ref(false)
const fileInputSettings = ref<HTMLInputElement>()
const fileInputCreate = ref<HTMLInputElement>()

// Load editions with proper typing
const { data: editions, pending: pendingEditions, refresh: refreshEditions } = await useAsyncData('editions', async () => {
  try {
    return await getIssues()
  } catch (error) {
    console.error(error)
    return []
  }
})

// Computed
const otherEditions = computed(() => 
  (editions.value || []).filter((e: Tables<'issues'>) => e.id !== selectedEdition.value?.id)
)

const statusOptions = [
  { label: 'Brouillon', value: 'draft' },
  { label: 'Prêt', value: 'ready' },
  { label: 'Publié', value: 'published' }
]

// Functions
function translateEditionStatus(status: string) {
  switch (status) {
    case 'draft': return 'Brouillon'
    case 'ready': return 'Prêt'
    case 'published': return 'Publié'
    default: return status
  }
}

function getStatusColor(status: string): 'neutral' | 'primary' | 'success' {
  switch (status) {
    case 'draft': return 'neutral'
    case 'ready': return 'primary'
    case 'published': return 'success'
    default: return 'neutral'
  }
}

function getEditionActions(edition: Tables<'issues'>) {
  return [[
    {
      label: 'Paramètres',
      icon: 'i-mingcute-settings-2-line',
      click: () => openEditionSettings(edition)
    },
    {
      label: 'Supprimer',
      icon: 'i-mingcute-delete-2-line',
      click: () => askDelete(edition)
    }
  ]]
}

async function selectEdition(edition: Tables<'issues'>) {
  selectedEdition.value = edition
  analyticsData.value.clear() // Clear previous analytics data
  await loadArticles(edition.id)
}

async function loadArticles(editionId: string) {
  loadingArticles.value = true
  try {
    articles.value = await getArticles([{ type: 'issue', id: editionId }]) || []
    
    // Load analytics data for articles with slugs
    const articlesWithSlugs = articles.value.filter(article => article.slug)
    if (articlesWithSlugs.length > 0) {
      loadingAnalytics.value = true
      const slugs = articlesWithSlugs.map(article => article.slug)
      analyticsData.value = await getMultipleArticleViews(slugs)
      loadingAnalytics.value = false
    }
  } catch (error) {
    console.error('Error loading articles:', error)
    articles.value = []
  } finally {
    loadingArticles.value = false
  }
}

function openEditionSettings(edition: Tables<'issues'>) {
  editingEdition.value = { ...edition }
  showSettingsModal.value = true
}

async function saveEditionSettings() {
  if (!editingEdition.value) return
  
  savingSettings.value = true
  try {
    const { error } = await supabase
      .from('issues')
      .update({
        title: editingEdition.value.title,
        slug: editingEdition.value.slug,
        description: editingEdition.value.description,
        status: editingEdition.value.status,
        published_at: editingEdition.value.published_at,
        cover: editingEdition.value.cover
      })
      .eq('id', editingEdition.value.id)
    
    if (error) throw error
    
    showSettingsModal.value = false
    await refreshEditions()
    
    // Update selected edition if it's the one being edited
    if (selectedEdition.value?.id === editingEdition.value.id) {
      selectedEdition.value = editingEdition.value
    }
  } catch (error) {
    console.error('Error saving edition settings:', error)
  } finally {
    savingSettings.value = false
  }
}

function askDelete(edition: Tables<'issues'>) {
  editionToDelete.value = edition
  showDeleteModal.value = true
}

function confirmDeleteEdition() {
  if (editingEdition.value) {
    editionToDelete.value = editingEdition.value
    showSettingsModal.value = false
    showDeleteModal.value = true
  }
}

function openCreateEditionModal() {
  newEdition.value = {
    title: '',
    slug: '',
    description: '',
    status: 'draft',
    cover: '',
    published_at: ''
  }
  showCreateModal.value = true
}

async function confirmDelete() {
  if (!editionToDelete.value) return
  
  deleting.value = true
  try {
    await deleteIssueById(editionToDelete.value.id)
    showDeleteModal.value = false
    const deletedId = editionToDelete.value.id
    editionToDelete.value = null
    await refreshEditions()
    
    // Clear selection if deleted edition was selected
    if (selectedEdition.value?.id === deletedId) {
      selectedEdition.value = null
      articles.value = []
    }
  } catch (error) {
    console.error('Error deleting edition:', error)
  } finally {
    deleting.value = false
  }
}

const triggerFileUploadSettings = () => {
  fileInputSettings.value?.click()
}

const triggerFileUploadCreate = () => {
  fileInputCreate.value?.click()
}

const handleFileUploadSettings = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file || !editingEdition.value) return

  const { data, error } = await supabase.storage.from('covers').upload(`public/${file.name}`, file)
  if (error) return toast.add({ 
    title: "Le téléchargement de l'image a échoué", 
    color: 'error', 
    icon: 'tabler-x', 
    description: error.message 
  })

  const { data: coverData } = supabase.storage.from('covers').getPublicUrl(data.path)
  editingEdition.value.cover = coverData.publicUrl
}

const handleFileUploadCreate = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const { data, error } = await supabase.storage.from('covers').upload(`public/${file.name}`, file)
  if (error) return toast.add({ 
    title: "Le téléchargement de l'image a échoué", 
    color: 'error', 
    icon: 'tabler-x', 
    description: error.message 
  })

  const { data: coverData } = supabase.storage.from('covers').getPublicUrl(data.path)
  newEdition.value.cover = coverData.publicUrl
}

async function createEdition() {
  if (!newEdition.value.title || !newEdition.value.slug) return
  
  creatingEdition.value = true
  try {
    const { error } = await supabase
      .from('issues')
      .insert([{
        title: newEdition.value.title,
        slug: newEdition.value.slug,
        description: newEdition.value.description,
        status: newEdition.value.status,
        cover: newEdition.value.cover || null,
        published_at: newEdition.value.published_at || null
      }])
    
    if (error) throw error
    
    showCreateModal.value = false
    newEdition.value = {
      title: '',
      slug: '',
      description: '',
      status: 'draft',
      cover: '',
      published_at: ''
    }
    await refreshEditions()
    
    toast.add({
      title: 'Édition créée',
      color: 'success',
      icon: 'tabler-check',
      description: 'Nouvelle édition créée avec succès.'
    })
  } catch (error) {
    console.error('Error creating edition:', error)
    toast.add({
      title: 'Erreur',
      color: 'error',
      icon: 'tabler-x',
      description: 'Une erreur est survenue lors de la création de l\'édition.'
    })
  } finally {
    creatingEdition.value = false
  }
}

// Watch for status changes to auto-set publication date
watch(() => editingEdition.value?.status, (newStatus, oldStatus) => {
  if (editingEdition.value && newStatus === 'published' && oldStatus !== 'published') {
    // Auto-set publication date to today when changing to published
    const today = new Date().toISOString().split('T')[0]
    editingEdition.value.published_at = today
  }
})

watch(() => newEdition.value.status, (newStatus, oldStatus) => {
  if (newStatus === 'published' && oldStatus !== 'published') {
    // Auto-set publication date to today when changing to published in create modal
    const today = new Date().toISOString().split('T')[0]
    newEdition.value.published_at = today
  }
})

// Realtime subscriptions
let issuesChannel: RealtimeChannel

onMounted(() => {
  issuesChannel = supabase
    .channel('public:issues')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, () => refreshEditions())
    .subscribe()
})

onUnmounted(() => {
  supabase.removeChannel(issuesChannel)
})
</script>

<style scoped>
.drop-zone {
  min-height: 60px;
}

.description-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
