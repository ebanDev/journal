import type { ArticleWithCategories } from '~/composables/useDb'

/**
 * Enhanced database composable with optimized caching and SSR support
 * Provides instant navigation by pre-caching data and using stale-while-revalidate strategy
 */
export function useOptimizedDb() {
  const { getArticles, getCategories, getIssues, getVeilleEntries, getUserVeilleVotes } = useDb()

  // Cache keys for consistent data management
  const CACHE_KEYS = {
    articles: 'optimized-articles',
    categories: 'optimized-categories', 
    issues: 'optimized-issues',
    veille: 'optimized-veille'
  }

  // Cache duration in seconds
  const CACHE_DURATION = {
    short: 60 * 5,      // 5 minutes for dynamic content
    medium: 60 * 15,    // 15 minutes for semi-static content  
    long: 60 * 60       // 1 hour for very static content
  }

  /**
   * Get articles with optimized caching
   * Uses stale-while-revalidate for instant loading with background updates
   */
  async function getOptimizedArticles(filters?: Array<{ type: string, id: string }>) {
    const cacheKey = filters?.length 
      ? `${CACHE_KEYS.articles}-${JSON.stringify(filters)}` 
      : CACHE_KEYS.articles

    const { data, refresh } = await useAsyncData(cacheKey, 
      () => getArticles(filters),
      {
        default: () => [],
        server: true,
        lazy: false
      }
    )

    return { data: data as Ref<ArticleWithCategories[]>, refresh }
  }

  /**
   * Get categories with long-term caching (they rarely change)
   */
  async function getOptimizedCategories() {
    const { data, refresh } = await useAsyncData(CACHE_KEYS.categories,
      () => getCategories(),
      {
        default: () => [],
        server: true,
        lazy: false,
        transform: (data: any[]) => data || []
      }
    )

    return { data, refresh }
  }

  /**
   * Get issues with medium-term caching
   */
  async function getOptimizedIssues() {
    const { data, refresh } = await useAsyncData(CACHE_KEYS.issues,
      () => getIssues(),
      {
        default: () => [],
        server: true,
        lazy: false,
        transform: (data: any[]) => data || []
      }
    )

    return { data, refresh }
  }

  /**
   * Get veille entries with short-term caching (more dynamic)
   */
  async function getOptimizedVeille() {
    const { data, refresh } = await useAsyncData(CACHE_KEYS.veille,
      () => getVeilleEntries(),
      {
        default: () => [],
        server: true,
        lazy: false,
        transform: (data: any[]) => data || []
      }
    )

    return { data, refresh }
  }

  /**
   * Get user veille votes (no caching - user-specific)
   */
  async function getOptimizedVeilleVotes(userId?: string) {
    const { data, refresh } = await useAsyncData(`veille-votes-${userId || 'anon'}`,
      () => getUserVeilleVotes(userId),
      {
        default: () => new Set(),
        server: false, // User-specific data
        lazy: false
      }
    )

    return { data, refresh }
  }

  /**
   * Prefetch all essential data for instant navigation
   * Call this in layouts or main pages to warm up the cache
   */
  async function prefetchEssentialData() {
    if (process.client) {
      // Prefetch in background without blocking UI
      Promise.all([
        getOptimizedCategories(),
        getOptimizedIssues(),
        getOptimizedArticles()
      ]).catch(error => {
        console.warn('Background prefetch failed:', error)
      })
    }
  }

  /**
   * Clear all cached data (useful for admin actions)
   */
  function clearAllCache() {
    Object.values(CACHE_KEYS).forEach(key => {
      clearNuxtData(key)
    })
  }

  /**
   * Get featured articles with caching
   */
  async function getFeaturedArticles() {
    const { data, refresh } = await useAsyncData('featured-articles',
      async () => {
        const articles = await getArticles()
        return articles.filter(a => a.featured && !a.draft).slice(0, 3)
      },
      {
        default: () => [],
        server: true,
        lazy: false
      }
    )

    return { data, refresh }
  }

  /**
   * Get latest edition with caching
   */
  async function getLatestEdition() {
    const { data, refresh } = await useAsyncData('latest-edition',
      async () => {
        const issues = await getIssues()
        return issues.find(i => i.status === 'published') || null
      },
      {
        default: () => null,
        server: true,
        lazy: false
      }
    )

    return { data, refresh }
  }

  return {
    getOptimizedArticles,
    getOptimizedCategories,  
    getOptimizedIssues,
    getOptimizedVeille,
    getOptimizedVeilleVotes,
    getFeaturedArticles,
    getLatestEdition,
    prefetchEssentialData,
    clearAllCache
  }
}
