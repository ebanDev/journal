<template>
  <div class="container mx-auto py-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Éditions</h1>
      <div class="flex gap-2">
        <UButton size="lg" to="/internal/issues/new">Nouvelle Édition</UButton>
      </div>
    </div>

    <div v-if="pendingEditions">
      <div class="space-y-4">
        <UPlaceholder class="h-6 w-1/3" />
        <div class="space-y-6">
          <UPlaceholder class="h-8 w-1/4" />
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <UPlaceholder class="h-40" />
            <UPlaceholder class="h-40" />
            <UPlaceholder class="h-40" />
          </div>
        </div>
      </div>
    </div>

    <div v-else>
      <div v-if="editions.length" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <UCard v-for="edition in editions" :key="edition.id" class="relative cursor-pointer"
          @click="router.push(`/internal/issues/${edition.id}`)">
          <template #header>
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <h3 class="text-lg font-medium truncate">{{ edition.title }}</h3>
                <div class="mt-1">
                  <UBadge color="secondary" variant="soft"
                    :label="translateEditionStatus(edition.status)" />
                </div>
              </div>
              <UButton icon="mingcute-delete-2-line" size="xs" variant="soft" class="ml-2"
                @click.stop="askDelete(edition)" :aria-label="`Supprimer l'édition ${edition.title}`" />
            </div>
          </template>
          <div class="py-2">
            <p class="text-sm text-gray-700 mb-2">
              {{ edition.description || 'Pas de description' }}
            </p>
            <div class="text-xs text-gray-500 mt-1" v-if="edition.published_at">Publié : {{ edition.published_at ? new
              Date(edition.published_at).toLocaleDateString() : '—' }}</div>
          </div>
        </UCard>
      </div>
      <div v-else class="text-center text-gray-500 py-10">Aucune édition pour le moment.</div>
    </div>

    <UModal v-model:open="showDeleteModal">
      <template #title>
        Confirmer la suppression
      </template>
      <template #body>
        <div class="py-2">
          Voulez-vous vraiment supprimer l’édition <b>{{ editionToDelete?.title }}</b> ?
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
const supabase = useSupabaseClient()
const { getIssues, deleteIssueById } = useDb()
const router = useRouter()

// Load editions
const { data: editions = [], pending: pendingEditions, refresh: refreshEditions } = await useAsyncData('editions', async () => {
  try {
    return await getIssues()
  } catch (error) {
    console.error(error)
    return []
  }
})

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

// Delete logic
const showDeleteModal = ref(false)
const editionToDelete = ref(null)
const deleting = ref(false)

function askDelete(edition) {
  editionToDelete.value = edition
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!editionToDelete.value) return
  deleting.value = true
  try {
    await deleteIssueById(editionToDelete.value.id)
    showDeleteModal.value = false
    editionToDelete.value = null
    await refreshEditions()
  } catch (e) {
    // Optionally show error
  } finally {
    deleting.value = false
  }
}
</script>
