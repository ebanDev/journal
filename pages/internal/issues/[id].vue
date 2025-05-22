<template>
  <div class="flex gap-6 w-full">
    <!-- Left: Articles in this édition -->
    <section class="flex-[3] container mx-auto p-8 ">
      <h1 class="text-2xl font-bold mb-4">Articles de l'Édition</h1>
      <div v-if="loadingArticles">
        <UPlaceholder class="h-6 w-1/3 mb-4" />
        <div class="space-y-4">
          <UPlaceholder class="h-40" />
          <UPlaceholder class="h-40" />
        </div>
      </div>
      <div v-else>
        <div v-if="articles.length" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6">
          <UCard v-for="article in articles" :key="article.id" class="mb-4">
            <template #header>
              <h2 class="text-lg font-medium">{{ article.title }}</h2>
            </template>
            <div>
              <p class="text-sm text-gray-700 line-clamp-5 mb-2">
                {{ article.metadata.description || 'Pas de description' }}
              </p>
              <span class="text-sm bg-secondary-300 px-2 py-1 rounded-full text-black">
                {{ article.draft ? 'Brouillon' : 'Prêt' }}
              </span>
            </div>
            <template #footer>
              <UButton size="sm" :to="`/internal/articles/${article.id}`">Modifier</UButton>
            </template>
          </UCard>
        </div>
        <div v-else class="text-gray-500">Aucun article dans cette édition.</div>
      </div>
    </section>

    <!-- Right: Settings panel (always visible) -->
    <aside class="flex-[1] bg-secondary-50 p-6 rounded shadow-sm flex flex-col">
      <h2 class="text-xl font-semibold mb-4">Paramètres de l’Édition</h2>
      <div class="space-y-4 flex-1 overflow-y-auto">
        <UFormField label="Titre">
          <UInput v-model="form.title" />
        </UFormField>
        <UFormField label="Slug">
          <UInput v-model="form.slug" />
        </UFormField>
        <UFormField label="Description">
          <UTextarea v-model="form.description" rows="3" class="w-full resize-none" />
        </UFormField>
        <UFormField label="Statut">
          <select v-model="form.status" class="border rounded px-2 py-1 w-full">
            <option value="draft">Brouillon</option>
            <option value="ready">Prêt</option>
            <option value="published">Publié</option>
          </select>
        </UFormField>
      </div>
      <div class="mt-auto flex justify-between">
        <UButton color="primary" @click="saveEdition" :loading="saving">Enregistrer</UButton>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useSupabaseClient } from '#imports'

const supabase = useSupabaseClient()
const route = useRoute()
const router = useRouter()
const editionId = String(route.params.id)

// Form state
const form = reactive({ title: '', slug: '', description: '', status: 'draft' })
const saving = ref(false)

// Articles list
const articles = ref<Array<{id:string; title:string}>>([])
const loadingArticles = ref(true)

// Channels
let issueChannel: RealtimeChannel
let articlesChannel: RealtimeChannel

// Load edition and nested articles
async function fetchEdition() {
  saving.value = false
  // get edition settings
  const { data: ed } = await supabase
    .from('issues')
    .select('title, slug, description, status, articles(id, title, draft, metadata)')
    .eq('id', editionId)
    .single()
  if (!ed) return router.push('/internal/issues')
  form.title = ed.title
  form.slug = ed.slug ?? ''
  form.description = ed.description ?? ''
  form.status = ed.status
  articles.value = ed.articles || []
  loadingArticles.value = false
}

// Save edition changes
async function saveEdition() {
  saving.value = true
  const { error } = await supabase
    .from('issues')
    .update({ title: form.title, slug: form.slug, description: form.description, status: form.status })
    .eq('id', editionId)
  if (error) console.error(error)
  saving.value = false
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
