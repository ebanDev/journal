<template>
  <div class="flex h-full w-full flex-col">
    <div class="p-6 border-b border-gray-200 bg-white flex-shrink-0">
      <div class="flex justify-between items-center gap-4">
        <div>
          <h1 class="text-xl font-bold">Articles</h1>
          <p class="text-sm text-gray-600 mt-1">Tous les articles de la revue.</p>
        </div>
        <UButton
          size="sm"
          icon="i-mingcute-add-line"
          to="/internal/articles/new"
          color="primary"
          class="flex-shrink-0"
        >
          Nouvel Article
        </UButton>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-6">
      <div v-if="pending || loadingArticles" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <USkeleton v-for="i in 6" :key="i" class="h-56" />
      </div>

      <div v-else-if="articles.length" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 items-stretch">
        <UCard
          v-for="article in articles"
          :key="article.id"
          class="cursor-pointer hover:shadow-md transition-shadow flex flex-col h-full"
          @click="router.push(`/internal/articles/${article.id}`)"
        >
          <template #header>
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <h2 class="font-medium truncate text-sm">{{ article.title || 'Sans titre' }}</h2>
                <div class="flex items-center gap-2 mt-1 flex-wrap">
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
            <div v-if="article.cover" class="mb-3 flex-shrink-0">
              <img
                :src="article.cover"
                :alt="article.title || 'Article'"
                class="w-full h-24 object-cover rounded"
                @error="article.cover = ''"
              />
            </div>
            <div class="flex-1">
              <p class="text-xs text-gray-600 description-clamp">
                {{ article.description || 'Pas de description' }}
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <div v-else class="text-center py-16">
        <UIcon name="i-mingcute-file-line" class="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p class="text-gray-500 mb-6">Aucun article pour le moment</p>
        <UButton
          to="/internal/articles/new"
          color="primary"
          variant="soft"
          class="flex-shrink-0"
        >
          Créer le premier article
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSupabaseClient } from '#imports'
import { useDb } from '~/composables/useDb'
import { useAnalytics } from '~/composables/useAnalytics'
import type { RealtimeChannel } from '@supabase/supabase-js'

const supabase = useSupabaseClient()
const { getArticles } = useDb()
const { getMultipleArticleViews } = useAnalytics()
const router = useRouter()

const articles = ref<any[]>([])
const analyticsData = ref<Map<string, any>>(new Map())
const pending = ref(true)
const loadingArticles = ref(false)
const loadingAnalytics = ref(false)

let analyticsRequestToken = 0
let articlesChannel: RealtimeChannel | null = null

async function loadArticles() {
  loadingArticles.value = true
  try {
    articles.value = await getArticles() || []
  } catch (error) {
    console.error('Error loading articles:', error)
    articles.value = []
  } finally {
    pending.value = false
    loadingArticles.value = false
  }

  scheduleAnalyticsLoad()
}

function scheduleAnalyticsLoad() {
  const requestId = ++analyticsRequestToken
  const articlesWithSlugs = articles.value.filter(article => article.slug)

  if (!articlesWithSlugs.length) {
    analyticsData.value = new Map()
    loadingAnalytics.value = false
    return
  }

  analyticsData.value = new Map()
  loadingAnalytics.value = true

  const slugs = articlesWithSlugs.map(article => article.slug)
  void fetchAnalytics(slugs, requestId)
}

async function fetchAnalytics(slugs: string[], requestId: number) {
  try {
    const data = await getMultipleArticleViews(slugs)

    if (analyticsRequestToken === requestId) {
      analyticsData.value = new Map(data)
    }
  } catch (error) {
    console.error('Error loading analytics data:', error)
  } finally {
    if (analyticsRequestToken === requestId) {
      loadingAnalytics.value = false
    }
  }
}

onMounted(() => {
  void loadArticles()

  articlesChannel = supabase
    .channel('public:articles')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, () => {
      void loadArticles()
    })
    .subscribe()
})

onUnmounted(() => {
  if (articlesChannel) {
    supabase.removeChannel(articlesChannel)
    articlesChannel = null
  }
})
</script>

<style scoped>
.description-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
