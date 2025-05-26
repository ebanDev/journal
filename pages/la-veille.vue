<template>
  <div class="container max-w-4xl mx-auto p-4 space-y-8">
    <h1 class="text-3xl font-serif">La Veille</h1>
    <section>
      <!-- Send Article Form -->
      <div class="flex flex-col bg-secondary-300 p-3 rounded-lg mb-4">
        <span class="text-lg font-semibold pl-2">Envoyer un article</span>
        <div class="flex">
          <UInput v-model="form.url"
            placeholder="https://www.contretemps.eu/pcf-marxisme-1960-1980-economie-marxiste/" class="flex-grow" />
          <UButton size="sm" @click="submitArticle" class="ml-2" :loading="fetchingMetadata" icon="tabler-send"
            :disabled="!form.url" />
        </div>
      </div>

      <!-- Filters -->
      <div class="flex space-x-4 mb-4">
        <USelect v-model="filter"
          :items="[
            { label: '7 jours', value: 'last7days' },
            { label: 'Ce mois-ci', value: 'thismonth' },
            { label: 'Cette année', value: 'thisyear' },
            { label: 'Tout le temps', value: 'alltime' },
          ]"
          placeholder="Filtrer" class="w-40" icon="tabler-filter" />
        <USelect v-model="sort"
          :items="[
            { label: 'Votes', value: 'votes' },
            { label: 'Date', value: 'date' }
          ]"
          placeholder="Trier" class="w-40" icon="tabler-arrows-sort" />
      </div>UModal

      <div v-if="entries.length">
        <div v-for="item in displayedEntries" :key="item.id" class="flex items-start p-4 rounded-lg bg-white shadow mb-4">
          <!-- votes -->
          <div class="flex flex-col items-center mr-4">
            <UButton size="sm" :icon="votedIds.has(item.id) ? 'tabler-heart-off' : 'tabler-heart'"
              :color="votedIds.has(item.id) ? 'secondary' : 'primary'" @click="vote(item.id)" />
            <span class="mt-1 text-sm">{{ item.voteCount }}</span>
          </div>
          <!-- content -->
          <NuxtLink :to="item.url" target="_blank" class="flex-1">
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-medium">{{ item.title }}</h3>
              <UBadge :label="item.type" color="secondary" />
            </div>
            <p v-if="item.description" class="text-gray-600 mt-1 text-sm">{{ item.description }}</p>
          </NuxtLink>
        </div>
      </div>
      <div v-else class="text-gray-500 text-center py-10">Aucun article trouvé.</div>
    </section>
  </div>

  <component v-model:open="openSubmitModal" title="Envoyer un article" :loading="fetchingMetadata" :is="isMobile ? UDrawer : UModal">
    <template #body>
      <div class="flex flex-col">
        <UFormField label="Titre" class="w-full">
          <UInput v-model="form.title" placeholder="Titre" class="mb-2 w-full" icon="tabler-pencil" />
        </UFormField>
        <UFormField label="URL" class="w-full mb-2">
          <div class="flex flex-row gap-2 items-center">
            <UInput v-model="form.url" placeholder="URL" class="w-full" icon="tabler-link" />
            <UButton size="sm" @click="fetchMetadata" class="ml-2 h-full" :loading="fetchingMetadata"
              icon="tabler-refresh" :disabled="!form.url" variant="outline" />
          </div>
        </UFormField>
        <UFormField label="Description" class="w-full" description="Un très court résumé de l'article.">
          <UTextarea v-model="form.description" placeholder="Description" class="mb-2 w-full" icon="tabler-align-left" />
        </UFormField>
        <UFormField label="Type" class="w-full">
          <USelect v-model="form.type"
            :items="[{ label: 'Article', value: 'article' }, { label: 'Vidéo', value: 'video' }, { label: 'Podcast', value: 'podcast' }, { label: 'Autre', value: 'other' }]"
            placeholder="Sélectionner le type" class="mb-2 w-full" icon="tabler-category" />
        </UFormField>
        <div class="flex flex-row gap-2">
          <UFormField label="URL de l'image d'illustration" class="w-full">
            <UInput v-model="form.cover" placeholder="URL de l'image d'illustration" class="mb-2 w-full"
              icon="tabler-photo" />
          </UFormField>
          <img v-if="form.cover" :src="form.cover" alt="Aperçu de l'image" class="mt-2 w-auto h-12 rounded-lg" />
        </div>
        <UFormField label="Nom de la source" class="w-full">
          <UInput v-model="form.source" placeholder="Nom de la source" class="mb-2 w-full" icon="tabler-source-code" />
        </UFormField>
      </div>
    </template>
    <template #footer>
      <UButton label="Submit" @click="submitEntry" :loading="submitting" class="justify-center" />
      <UButton label="Cancel" @click="fetchingMetadata = false" color="secondary" class="justify-center" />
    </template>
  </component>
</template>

<script setup lang="ts">
import {UModal, UDrawer} from '#components'
const toast = useToast()

interface VeilleEntry {
  id: string
  title: string
  url?: string
  description?: string
  laveille_votes?: Array<{ id: string }>
}

interface VeilleVote {
  article_id: string
}

interface EntryWithVotes {
  id: string
  title: string
  url?: string
  description?: string
  voteCount: number
}

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const entries = ref<EntryWithVotes[]>([])
const loading = ref(false)
const form = reactive({ title: '', url: '', description: '', type: 'article', cover: '', source: '' })
const fetchingMetadata = ref(false)
const submitting = ref(false)
const submitError = ref<string | null>(null)
const submitted = ref(false)
const votedIds = ref<Set<string>>(new Set())
const openSubmitModal = ref(false)
const filter = ref('last7days')
const sort = ref('votes')
const isMobile = ref(false)

const filteredEntries = computed(() => {
  const now = new Date()
  return entries.value.filter(entry => {
    if (filter.value === 'last7days') {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(now.getDate() - 7)
      return new Date(entry.submitted_at) >= sevenDaysAgo
    } else if (filter.value === 'thismonth') {
      return new Date(entry.submitted_at).getMonth() === now.getMonth() &&
             new Date(entry.submitted_at).getFullYear() === now.getFullYear()
    } else if (filter.value === 'thisyear') {
      return new Date(entry.submitted_at).getFullYear() === now.getFullYear()
    } else {
      return true // 'alltime'
    }
  })
})

const displayedEntries = computed(() => {
  const list = filteredEntries.value.slice()
  if (sort.value === 'votes') {
    return list.sort((a, b) => b.voteCount - a.voteCount)
  } else if (sort.value === 'date') {
    return list.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
  }
  return list
})

function setFilter(newFilter: string) {
  filter.value = newFilter
}

async function fetchMetadata() {
  if (!form.url) return
  fetchingMetadata.value = true
  try {
    const { title, description, cover, source, error } = await $fetch<any>('/api/metadata', { params: { url: form.url } })
    if (error) {
      console.error('Metadata error:', error)
    } else {
      form.title = title || form.title
      form.description = description || form.description
      form.cover = cover || form.cover
      form.source = source || form.source
    }
  } catch (err) {
    console.error('Fetch metadata failed:', err)
  } finally {
    fetchingMetadata.value = false
  }
}

async function fetchEntries() {
  loading.value = true
  const { data, error } = await supabase
    .from('laveille')
    .select(`id, title, url, description, type, submitted_at, laveille_votes(id)`)
    .eq('status', 'approved')
  if (error) {
    console.error(error)
  } else if (data) {
    entries.value = (data as VeilleEntry[]).map(item => ({
      id: item.id,
      title: item.title,
      url: item.url,
      description: item.description,
      type: item.type,
      submitted_at: item.submitted_at,
      voteCount: item.laveille_votes?.length || 0
    }))
    // sort by voteCount descending
    entries.value.sort((a, b) => b.voteCount - a.voteCount)
    // fetch votes by current user
    votedIds.value.clear()
    if (user.value?.id) {
      const { data: votes } = await supabase
        .from('laveille_votes')
        .select('article_id')
        .eq('voter_id', user.value.id)
      if (votes) {
        (votes as VeilleVote[]).forEach(v => votedIds.value.add(v.article_id))
      }
    }
  }
  loading.value = false
}

async function submitEntry() {
  submitError.value = null
  submitted.value = false
  submitting.value = true
  const payload: any = {
    title: form.title,
    ...(form.url && { url: form.url }),
    ...(form.description && { description: form.description }),
    type: form.type,
    ...(form.cover && { cover: form.cover }),
    ...(form.source && { source: form.source })
  }
  const { error } = await supabase
    .from('laveille')
    .insert(payload)
  if (error) submitError.value = error.message
  else {
    submitted.value = true
    form.title = ''
    form.url = ''
    form.description = ''
    form.type = 'article'
    form.cover = ''
    form.source = ''
  }
  submitting.value = false
  openSubmitModal.value = false
  if (submitError.value) {
    toast.add({
      title: 'Erreur',
      color: 'error',
      description: submitError.value,
      icon: 'mingcute-alert-line',
    })
  } else {
    toast.add({
      title: 'Article soumis',
      color: 'success',
      description: 'Votre article a été soumis avec succès. Il sera examiné par notre équipe.',
      icon: 'mingcute-check-line',
    })
  }
}

let veilleChannel: RealtimeChannel
let votesChannel: RealtimeChannel
async function vote(id: string) {
  if (!user.value?.id) {
    toast.add({
      title: 'Erreur',
      color: 'error',
      description: 'Vous devez être connecté pour voter.',
      icon: 'mingcute-alert-line',
    })
    return
  }

  const isVoted = votedIds.value.has(id)
  // optimistic update
  if (isVoted) {
    votedIds.value.delete(id)
    const entry = entries.value.find(e => e.id === id)
    if (entry) entry.voteCount--
  } else {
    votedIds.value.add(id)
    const entry = entries.value.find(e => e.id === id)
    if (entry) entry.voteCount++
  }
  try {
    if (isVoted) {
      const { error } = await supabase
        .from('laveille_votes')
        .delete()
        .eq('article_id', id)
        .eq('voter_id', user.value.id)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('laveille_votes')
        .insert({ article_id: id, voter_id: user.value.id })
      if (error) throw error
    }
  } catch (err) {
    console.error(err)
    // revert on error
    if (isVoted) {
      votedIds.value.add(id)
      const entry = entries.value.find(e => e.id === id)
      if (entry) entry.voteCount++
    } else {
      votedIds.value.delete(id)
      const entry = entries.value.find(e => e.id === id)
      if (entry) entry.voteCount--
    }
  }
}

async function submitArticle() {
  if (!form.url) return
  form.title = ''
  form.description = ''
  form.cover = ''
  form.source = ''
  await fetchMetadata()
  openSubmitModal.value = true
}

onMounted(() => {
  isMobile.value = window.innerWidth < 768
  fetchEntries()
  // subscribe to new approved entries
  veilleChannel = supabase
    .channel('public:laveille')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'laveille' }, (payload) => {
      if (payload.new?.status === 'approved') fetchEntries()
    })
    .subscribe()
  // subscribe to vote changes
  votesChannel = supabase
    .channel('public:laveille_votes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'laveille_votes' }, () => fetchEntries())
    .subscribe()
})
onUnmounted(() => {
  supabase.removeChannel(veilleChannel)
  supabase.removeChannel(votesChannel)
})
</script>
