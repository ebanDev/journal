<template>
  <div class="container mx-auto px-4 py-8 min-h-screen">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Gestionnaire La Veille</h1>
      <div class="flex items-center gap-3">
        <UBadge 
          v-if="displayedPendingCount > 0" 
          color="primary" 
          size="md" 
          variant="soft"
        >
          {{ displayedPendingCount }} en attente
        </UBadge>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex gap-4 mb-6 flex-wrap">
      <USelect
        v-model="selectedStatus"
        :options="statusOptions"
        option-attribute="label"
        value-attribute="value"
        placeholder="Tous les statuts"
        @update:model-value="fetchSubmissions"
        class="min-w-48"
      />
      <USelect
        v-model="selectedType"
        :options="typeOptions"
        option-attribute="label"
        value-attribute="value"
        placeholder="Tous les types"
        @update:model-value="fetchSubmissions"
        class="min-w-48"
      />
      <UInput
        v-model="searchQuery"
        placeholder="Rechercher..."
        icon="i-mingcute-search-line"
        @input="debouncedSearch"
        class="min-w-64"
      />
    </div>

    <div v-if="loading" class="space-y-4">
      <div class="h-6 w-1/3 mb-4 bg-gray-200 rounded animate-pulse" />
      <div class="space-y-4">
        <USkeleton class="h-40 w-full" v-for="i in 3" :key="i" />
      </div>
    </div>

    <div v-else-if="submissions.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <UCard v-for="item in submissions" :key="item.id" class="hover:shadow-md transition-shadow">
        <template #header>
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <h2 class="text-lg font-semibold text-gray-900 truncate">{{ item.title }}</h2>
              <div class="flex items-center gap-2 mt-1 flex-wrap">
                <UBadge 
                  :color="getStatusColor(item.status)" 
                  size="sm" 
                  variant="soft"
                >
                  {{ getStatusLabel(item.status) }}
                </UBadge>
                <UBadge 
                  color="neutral" 
                  size="sm" 
                  variant="outline"
                >
                  {{ item.type }}
                </UBadge>
                <span class="text-xs text-gray-500">
                  {{ formatDate(item.submitted_at) }}
                </span>
              </div>
            </div>
            <div class="flex gap-1">
              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                icon="i-mingcute-edit-line"
                @click="editSubmission(item)"
              />
              <UButton
                size="xs"
                color="error"
                variant="ghost"
                icon="i-mingcute-delete-2-line"
                @click="confirmDelete(item)"
                :loading="processingIds.has(item.id)"
              />
            </div>
          </div>
        </template>
        
        <div class="space-y-3">
          <div v-if="item.description" class="text-sm text-gray-700">
            <p class="leading-relaxed line-clamp-3">{{ item.description }}</p>
          </div>
          <div v-else class="text-sm text-gray-500 italic">
            Aucune description fournie
          </div>
          
          <div v-if="item.url" class="flex items-center gap-2">
            <UIcon name="i-mingcute-link-line" class="w-4 h-4 text-gray-400 flex-shrink-0" />
            <a 
              :href="item.url" 
              target="_blank" 
              rel="noopener noreferrer"
              class="text-blue-600 hover:text-blue-800 underline text-sm truncate"
            >
              {{ item.url }}
            </a>
          </div>

          <div v-if="item.source" class="flex items-center gap-2">
            <UIcon name="i-mingcute-news-line" class="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span class="text-sm text-gray-600 truncate">{{ item.source }}</span>
          </div>

          <div v-if="item.cover" class="flex items-center gap-2">
            <img :src="item.cover" alt="Couverture" class="w-16 h-16 object-cover rounded" />
          </div>
        </div>
        
        <template #footer>
          <div class="flex justify-between items-center">
            <div class="text-xs text-gray-500 flex items-center gap-3">
              <span class="flex items-center gap-1">
                <UIcon name="i-mingcute-user-line" class="w-3 h-3" />
                {{ item.submitter_id ? 'Utilisateur' : 'Anonyme' }}
              </span>
              <span class="flex items-center gap-1">
                <UIcon name="i-mingcute-thumb-up-line" class="w-3 h-3" />
                {{ item.vote_count || 0 }}
              </span>
            </div>
            <div class="flex gap-2">
              <UButton 
                v-if="item.status === 'pending'"
                size="sm" 
                color="success" 
                icon="i-mingcute-check-line"
                @click="updateStatus(item.id, 'approved')"
                :loading="processingIds.has(item.id)"
              >
                Approuver
              </UButton>
              <UButton 
                v-if="item.status !== 'rejected'"
                size="sm" 
                color="error" 
                icon="i-mingcute-close-line"
                @click="updateStatus(item.id, 'rejected')"
                :loading="processingIds.has(item.id)"
              >
                Rejeter
              </UButton>
            </div>
          </div>
        </template>
      </UCard>
    </div>
    
    <div v-else class="text-center py-16">
      <UIcon name="i-mingcute-radar-line" class="w-12 h-12 mx-auto mb-4 text-gray-300" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">Aucune soumission trouvée</h3>
      <p class="text-gray-500">Aucune soumission ne correspond aux filtres sélectionnés.</p>
    </div>

    <!-- Edit Modal -->
    <UModal v-model="showEditModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">
            Modifier la soumission
          </h3>
        </template>
        
        <div class="space-y-4">
          <UFormGroup label="Titre" required>
            <UInput v-model="editForm.title" placeholder="Titre de la soumission" />
          </UFormGroup>
          
          <UFormGroup label="URL">
            <UInput v-model="editForm.url" placeholder="https://..." />
          </UFormGroup>
          
          <UFormGroup label="Description">
            <UTextarea v-model="editForm.description" placeholder="Description de la soumission" :rows="3" />
          </UFormGroup>
          
          <UFormGroup label="Type">
            <USelect 
              v-model="editForm.type" 
              :options="typeOptions.filter(t => t.value !== 'all')" 
              option-attribute="label"
              value-attribute="value"
            />
          </UFormGroup>
          
          <UFormGroup label="Source">
            <UInput v-model="editForm.source" placeholder="Source de l'information" />
          </UFormGroup>
          
          <UFormGroup label="Image de couverture">
            <UInput v-model="editForm.cover" placeholder="URL de l'image" />
          </UFormGroup>
          
          <UFormGroup label="Statut">
            <USelect 
              v-model="editForm.status" 
              :options="statusOptions.filter(s => s.value !== 'all')" 
              option-attribute="label"
              value-attribute="value"
            />
          </UFormGroup>
        </div>
        
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" @click="cancelEdit">Annuler</UButton>
            <UButton 
              @click="saveSubmission" 
              :loading="saving"
              :disabled="!editForm.title"
            >
              Modifier
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal v-model="showDeleteModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">Confirmer la suppression</h3>
        </template>
        
        <p class="text-gray-700">
          Êtes-vous sûr de vouloir supprimer la soumission "{{ deletingSubmission?.title }}" ?
          Cette action est irréversible.
        </p>
        
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" @click="showDeleteModal = false">Annuler</UButton>
            <UButton 
              color="error" 
              @click="deleteSubmission"
              :loading="deleting"
            >
              Supprimer
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useSupabaseClient, useToast } from '#imports'
import type { RealtimeChannel } from '@supabase/supabase-js'

const supabase = useSupabaseClient()
const toast = useToast()

// Data
const submissions = ref<Array<any>>([])
const loading = ref(true)
const processingIds = ref<Set<string>>(new Set())
const saving = ref(false)
const deleting = ref(false)

// Filters
const selectedStatus = ref('all')
const selectedType = ref('all')
const searchQuery = ref('')

// Modals
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const editingSubmission = ref<any>(null)
const deletingSubmission = ref<any>(null)

// Forms
const editForm = ref({
  title: '',
  url: '',
  description: '',
  type: 'article',
  source: '',
  cover: '',
  status: 'pending'
})

// Options
const statusOptions = [
  { label: 'Tous', value: 'all' },
  { label: 'En attente', value: 'pending' },
  { label: 'Approuvé', value: 'approved' },
  { label: 'Rejeté', value: 'rejected' }
]

const typeOptions = [
  { label: 'Tous', value: 'all' },
  { label: 'Article', value: 'article' },
  { label: 'Vidéo', value: 'video' },
  { label: 'Podcast', value: 'podcast' },
  { label: 'Livre', value: 'book' },
  { label: 'Autre', value: 'other' }
]

// Computed
const pendingCount = computed(() => 
  submissions.value.filter(s => s.status === 'pending').length
)

const displayedPendingCount = computed(() => {
  if (selectedStatus.value === 'all') {
    return submissions.value.filter(s => s.status === 'pending').length
  }
  return 0 // Don't show count when filtering
})

// Debounced search
let searchTimeout: NodeJS.Timeout
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchSubmissions()
  }, 300)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'warning'
    case 'approved': return 'success'
    case 'rejected': return 'error'
    default: return 'neutral'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending': return 'En attente'
    case 'approved': return 'Approuvé'
    case 'rejected': return 'Rejeté'
    default: return status
  }
}

async function fetchSubmissions() {
  loading.value = true
  try {
    let query = supabase
      .from('laveille')
      .select(`
        id, title, url, description, submitted_at, submitter_id, 
        status, type, cover, source,
        vote_count:laveille_votes(count)
      `)
      .order('submitted_at', { ascending: false })

    // Apply status filter
    if (selectedStatus.value !== 'all') {
      query = query.eq('status', selectedStatus.value)
    }

    // Apply type filter
    if (selectedType.value !== 'all') {
      query = query.eq('type', selectedType.value)
    }

    // Apply search filter
    if (searchQuery.value.trim()) {
      query = query.or(`title.ilike.%${searchQuery.value}%,description.ilike.%${searchQuery.value}%`)
    }

    const { data, error } = await query
    
    if (error) {
      console.error('Erreur lors du chargement:', error)
      toast.add({
        title: 'Erreur de chargement',
        description: 'Impossible de charger les soumissions.',
        color: 'error',
        icon: 'i-mingcute-alert-line'
      })
    } else {
      // Process vote counts
      submissions.value = (data || []).map(item => ({
        ...item,
        vote_count: Array.isArray(item.vote_count) ? item.vote_count.length : 0
      }))
    }
  } catch (error) {
    console.error('Erreur inattendue:', error)
    toast.add({
      title: 'Erreur inattendue',
      description: 'Une erreur inattendue s\'est produite.',
      color: 'error',
      icon: 'i-mingcute-alert-line'
    })
  } finally {
    loading.value = false
  }
}

async function updateStatus(id: string, status: string) {
  processingIds.value.add(id)
  try {
    const { error } = await supabase
      .from('laveille')
      .update({ status })
      .eq('id', id)
    
    if (error) {
      console.error('Erreur lors de la mise à jour:', error)
      toast.add({
        title: 'Erreur de mise à jour',
        description: 'Impossible de mettre à jour le statut.',
        color: 'error',
        icon: 'i-mingcute-alert-line'
      })
    } else {
      toast.add({
        title: 'Statut mis à jour',
        description: `Statut changé vers "${getStatusLabel(status)}".`,
        color: 'success',
        icon: 'i-mingcute-check-line'
      })
      await fetchSubmissions()
    }
  } catch (error) {
    console.error('Erreur inattendue:', error)
    toast.add({
      title: 'Erreur inattendue',
      description: 'Une erreur inattendue s\'est produite.',
      color: 'error',
      icon: 'i-mingcute-alert-line'
    })
  } finally {
    processingIds.value.delete(id)
  }
}

function editSubmission(submission: any) {
  editingSubmission.value = submission
  editForm.value = {
    title: submission.title || '',
    url: submission.url || '',
    description: submission.description || '',
    type: submission.type || 'article',
    source: submission.source || '',
    cover: submission.cover || '',
    status: submission.status || 'pending'
  }
  showEditModal.value = true
}

function cancelEdit() {
  showEditModal.value = false
  editingSubmission.value = null
  editForm.value = {
    title: '',
    url: '',
    description: '',
    type: 'article',
    source: '',
    cover: '',
    status: 'pending'
  }
}

async function saveSubmission() {
  if (!editForm.value.title) return
  
  saving.value = true
  try {
    const { error } = await supabase
      .from('laveille')
      .update({
        title: editForm.value.title,
        url: editForm.value.url || null,
        description: editForm.value.description || null,
        type: editForm.value.type,
        source: editForm.value.source || null,
        cover: editForm.value.cover || null,
        status: editForm.value.status
      })
      .eq('id', editingSubmission.value.id)
    
    if (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      toast.add({
        title: 'Erreur de sauvegarde',
        description: 'Impossible de sauvegarder les modifications.',
        color: 'error',
        icon: 'i-mingcute-alert-line'
      })
    } else {
      toast.add({
        title: 'Soumission modifiée',
        description: 'Les modifications ont été sauvegardées.',
        color: 'success',
        icon: 'i-mingcute-check-line'
      })
      cancelEdit()
      await fetchSubmissions()
    }
  } catch (error) {
    console.error('Erreur inattendue:', error)
    toast.add({
      title: 'Erreur inattendue',
      description: 'Une erreur inattendue s\'est produite.',
      color: 'error',
      icon: 'i-mingcute-alert-line'
    })
  } finally {
    saving.value = false
  }
}

function confirmDelete(submission: any) {
  deletingSubmission.value = submission
  showDeleteModal.value = true
}

async function deleteSubmission() {
  if (!deletingSubmission.value) return
  
  deleting.value = true
  try {
    const { error } = await supabase
      .from('laveille')
      .delete()
      .eq('id', deletingSubmission.value.id)
    
    if (error) {
      console.error('Erreur lors de la suppression:', error)
      toast.add({
        title: 'Erreur de suppression',
        description: 'Impossible de supprimer cette soumission.',
        color: 'error',
        icon: 'i-mingcute-alert-line'
      })
    } else {
      toast.add({
        title: 'Soumission supprimée',
        description: 'La soumission a été supprimée avec succès.',
        color: 'success',
        icon: 'i-mingcute-check-line'
      })
      showDeleteModal.value = false
      deletingSubmission.value = null
      await fetchSubmissions()
    }
  } catch (error) {
    console.error('Erreur inattendue:', error)
    toast.add({
      title: 'Erreur inattendue',
      description: 'Une erreur inattendue s\'est produite.',
      color: 'error',
      icon: 'i-mingcute-alert-line'
    })
  } finally {
    deleting.value = false
  }
}

// Real-time subscription for laveille changes
let laveilleChannel: RealtimeChannel

onMounted(() => {
  fetchSubmissions()
  
  laveilleChannel = supabase
    .channel('public:laveille')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'laveille'
    }, () => {
      // Refresh submissions when any change occurs
      fetchSubmissions()
    })
    .subscribe()
})

onUnmounted(() => {
  if (laveilleChannel) {
    supabase.removeChannel(laveilleChannel)
  }
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
})
</script>
