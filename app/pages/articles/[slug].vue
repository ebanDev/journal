<template>
  <div class="max-w-3xl mx-auto w-full py-8 px-4">
    <div v-if="article">
      <h1 class="font-serif text-4xl mb-4">{{ article.title }}</h1>
      <div class="flex items-center justify-between mb-6">
        <p class="text-gray-500" v-if="article.published_at">{{ formatDate(article.published_at) }}</p>
        <!-- Edit button - only visible when connected -->
        <UButton 
          v-if="user" 
          label="Modifier l'article" 
          icon="i-mingcute-edit-line" 
          color="primary" 
          variant="outline"
          size="sm"
          :to="`/internal/articles/${article.id}`"
        />
      </div>

      <div v-if="article.categories && article.categories.length" class="flex flex-wrap gap-2 mb-4">
        <NuxtLink 
          v-for="cat in article.categories" 
          :key="cat.name"
          :to="`/category/${cat.name.toLowerCase().replace(/\s+/g, '-')}`"
          class="hover:opacity-80 transition-opacity"
        >
          <UBadge 
            color="secondary" 
            :label="cat.name" 
            :icon="cat.icon ? 'mingcute:' + cat.icon : undefined" 
          />
        </NuxtLink>
      </div>

      <div v-if="article.cover" class="mb-6">
        <div class="w-full rounded overflow-hidden bg-gray-100 aspect-[2/1]">
          <img
            :src="article.cover"
            alt="Cover"
            class="w-full h-full object-cover"
            :class="coverObjectPositionClass"
          />
        </div>
        <p v-if="article.cover_label" class="mt-2 text-sm text-gray-500 italic">
          {{ article.cover_label }}
        </p>
      </div>

      <div @click="handleCitationClick" @mouseover="handleSourceHover" @mouseleave="handleSourceLeave">
        <ArticleContent :content="article.content" />
      </div>

      <!-- Source Preview Popover -->
      <div 
        v-if="hoveredSource" 
        ref="sourcePopover"
        class="source-popover fixed z-50 p-4 max-w-sm space-y-3 bg-white rounded-lg shadow-lg border border-gray-200 cursor-pointer hover:shadow-xl"
        :style="{ left: popoverPosition.x + 'px', top: popoverPosition.y + 'px' }"
        @click="openSourceUrl"
        @mouseleave="hidePopover"
      >
        <div class="space-y-2">
          <h4 class="font-semibold text-gray-900">{{ hoveredSource.title || 'Source' }}</h4>
          <p v-if="hoveredSource.description" class="text-sm text-gray-600 line-clamp-3">
            {{ hoveredSource.description }}
          </p>
        </div>
        
        <div v-if="hoveredSource.author || hoveredSource.publishedAt" class="pt-2 border-t border-gray-100 space-y-1">
          <p v-if="hoveredSource.author" class="text-xs text-gray-500">
            Par {{ hoveredSource.author }}
          </p>
          <p v-if="hoveredSource.publishedAt" class="text-xs text-gray-500">
            {{ formatDate(hoveredSource.publishedAt) }}
          </p>
        </div>
        </div>

      <!-- Sources section -->
      <ArticleSources :sources="article.sources" />
    </div>
    <div v-else class="text-center py-20">
      <p>Chargement...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSupabaseClient, useSupabaseUser, useToast } from '#imports'
import { useDb } from '~/composables/useDb'
import type {ArticleWithCategories} from '~/composables/useDb'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const slug = String(route.params.slug)

const article = ref(null as ArticleWithCategories | null)

// Source preview state
const hoveredSource = ref(null as any)
const popoverPosition = ref({ x: 0, y: 0 })
const sourcePopover = ref<HTMLElement | null>(null)
let hoverTimeout: ReturnType<typeof setTimeout> | null = null

const formatDate = (date: string) => new Date(date).toLocaleDateString()

const coverObjectPositionClass = computed(() => {
  if (!article.value) return 'object-center'
  switch (article.value.cover_crop) {
    case 'top':
      return 'object-top'
    case 'bottom':
      return 'object-bottom'
    default:
      return 'object-center'
  }
})

const openSourceUrl = () => {
  if (hoveredSource.value && hoveredSource.value.url) {
    window.open(hoveredSource.value.url, '_blank', 'noopener,noreferrer')
    // Hide popover after click
    hoveredSource.value = null
  }
}

const hidePopover = () => {
  // Clear any timeout
  if (hoverTimeout) {
    clearTimeout(hoverTimeout)
    hoverTimeout = null
  }
  // Hide popover
  hoveredSource.value = null
}

const handleCitationClick = (event: Event) => {
  const target = event.target as HTMLElement
  
  // Handle source mark clicks - open URL in new tab if available
  if (target.classList.contains('source-mark') || target.closest('.source-mark')) {
    event.preventDefault()
    const sourceElement = target.classList.contains('source-mark') ? target : target.closest('.source-mark') as HTMLElement
    
    if (sourceElement) {
      const sourceDataAttr = sourceElement.getAttribute('data-source-data')
      if (sourceDataAttr) {
        try {
          const sourceData = JSON.parse(sourceDataAttr)
          if (sourceData.url) {
            window.open(sourceData.url, '_blank', 'noopener,noreferrer')
          }
        } catch (e) {
          console.warn('Failed to parse source data:', e)
        }
      }
    }
    return
  }
  
  // Handle citation reference clicks (if you have them)
  if (target.classList.contains('citation-ref')) {
    event.preventDefault()
    const sourceId = target.getAttribute('data-source-id')
    if (sourceId) {
      // Scroll to the corresponding source
      const sourceElement = document.querySelector(`[data-source-id="${sourceId}"]`)
      if (sourceElement) {
        sourceElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // Add a brief highlight effect
        const originalBackground = (sourceElement as HTMLElement).style.backgroundColor
        ;(sourceElement as HTMLElement).style.backgroundColor = '#fef3c7' // yellow-100
        ;(sourceElement as HTMLElement).style.transition = 'background-color 2s ease-out'
        setTimeout(() => {
          ;(sourceElement as HTMLElement).style.backgroundColor = originalBackground
        }, 2000)
      }
    }
  }
}

const handleSourceHover = (event: Event) => {
  const target = event.target as HTMLElement
  if (target.classList.contains('source-mark') || target.closest('.source-mark')) {
    const sourceElement = target.classList.contains('source-mark') ? target : target.closest('.source-mark') as HTMLElement
    
    if (sourceElement) {
      // Clear any existing timeout
      if (hoverTimeout) {
        clearTimeout(hoverTimeout)
      }
      
      // Set a delay before showing the popover
      hoverTimeout = setTimeout(() => {
        const sourceDataAttr = sourceElement.getAttribute('data-source-data')
        if (sourceDataAttr) {
          try {
            const sourceData = JSON.parse(sourceDataAttr)
            hoveredSource.value = sourceData
            
            // Position the popover
            const rect = sourceElement.getBoundingClientRect()
            const popoverWidth = 320 // Estimated popover width
            let x = rect.left + rect.width / 2 - popoverWidth / 2
            let y = rect.bottom + 8
            
            // Adjust position if it goes off screen
            if (x < 10) {
              x = 10
            }
            if (x > window.innerWidth - popoverWidth) {
              x = window.innerWidth - popoverWidth
            }
            
            // If popover would go below viewport, show it above
            if (y + 200 > window.innerHeight) { // Estimated popover height
              y = rect.top - 200 - 8
            }
            
            popoverPosition.value = { x, y }
          } catch (e) {
            console.warn('Failed to parse source data:', e)
          }
        }
      }, 200) // 200ms delay
    }
  }
}

const handleSourceLeave = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  const relatedTarget = event.relatedTarget as HTMLElement
  
  // Check if we're moving to the popover or staying within source elements
  if (relatedTarget && (
    relatedTarget.closest('.source-mark') || 
    relatedTarget === sourcePopover.value ||
    sourcePopover.value?.contains(relatedTarget)
  )) {
    return
  }
  
  // Clear timeout and hide popover after a delay
  if (hoverTimeout) {
    clearTimeout(hoverTimeout)
    hoverTimeout = null
  }
  
  // Shorter delay since popover is now clickable
  setTimeout(() => {
    if (!sourcePopover.value?.matches(':hover')) {
      hoveredSource.value = null
    }
  }, 50)
}

const { getArticleBySlug } = useDb()

const fetchArticle = async () => {
  try {
    const found = await getArticleBySlug(slug)
    if (!found) {
      toast.add({
        title: 'Article non trouvé',
        description: 'L\'article que vous cherchez n\'existe pas.',
        color: 'error',
      })
      router.push('/')
      return
    }
    article.value = found
    
    // Set up SEO meta tags dynamically when article is loaded
    setupSEO(found)
  } catch (e) {
    toast.add({
      title: 'Erreur',
      description: 'Erreur lors du chargement de l\'article',
      color: 'error',
    })
    router.push('/')
  }
}

const setupSEO = (articleData: ArticleWithCategories) => {
  const title = `${articleData.title} - Sursaut!`
  const description = articleData.description || 
    `Lisez "${articleData.title}" sur Sursaut!, le journal des luttes de Bordeaux.`
  
  const categories = articleData.categories?.map(cat => cat.name).join(', ') || ''
  const imageUrl = articleData.cover || 'https://sursaut-revue.fr/icon-512x512.png'
  const articleUrl = `https://sursaut-revue.fr/articles/${articleData.slug}`
  
  useSeoMeta({
    title,
    description,
    keywords: `${categories}, Bordeaux, luttes sociales, politique, journal`,
    author: 'Sursaut!',
    
    // Open Graph
    ogTitle: title,
    ogDescription: description,
    ogImage: imageUrl,
    ogUrl: articleUrl,
    ogType: 'article',
    ogSiteName: 'Sursaut!',
    ogLocale: 'fr_FR',
    
    // Twitter
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: imageUrl,
    
    // Article specific
    articleAuthor: ['Sursaut!'],
    articlePublishedTime: articleData.published_at || '',
    articleSection: categories,
  })
  
  // Canonical link still needs useHead
  useHead({
    link: [
      { rel: 'canonical', href: articleUrl }
    ]
  })
}

// Scroll handler to hide popover
const handleScroll = () => {
  if (hoveredSource.value) {
    // Clear any timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      hoverTimeout = null
    }
    // Hide popover immediately on scroll
    hoveredSource.value = null
  }
}

onMounted(() => {
  fetchArticle()
  // Add scroll listener
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  // Remove scroll listener
  window.removeEventListener('scroll', handleScroll)
  // Clear any pending timeout
  if (hoverTimeout) {
    clearTimeout(hoverTimeout)
  }
})
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.source-popover {
  animation: popover-slide-in 0.2s ease-out forwards;
}

@keyframes popover-slide-in {
  from {
    opacity: 0;
    transform: translateY(-1rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Add a subtle shadow transition */
.source-popover {
  transition: box-shadow 0.2s ease-out;
}
</style>
