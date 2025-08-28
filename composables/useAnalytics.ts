interface AnalyticsData {
  slug: string
  views: number
  visitors: number
  period: {
    start: string
    end: string
  }
}

export const useAnalytics = () => {
  const analyticsCache = new Map<string, AnalyticsData>()

  const getArticleViews = async (slug: string): Promise<AnalyticsData | null> => {
    try {
      // Check cache first
      if (analyticsCache.has(slug)) {
        return analyticsCache.get(slug)!
      }

      const data = await $fetch<AnalyticsData>(`/api/analytics/${slug}`)
      
      // Cache the result for 5 minutes
      analyticsCache.set(slug, data)
      setTimeout(() => analyticsCache.delete(slug), 5 * 60 * 1000)
      
      return data
    } catch (error) {
      console.error(`Failed to fetch analytics for ${slug}:`, error)
      return null
    }
  }

  const getMultipleArticleViews = async (slugs: string[]): Promise<Map<string, AnalyticsData>> => {
    const results = new Map<string, AnalyticsData>()
    
    // Process in batches to avoid overwhelming the API
    const batchSize = 5
    for (let i = 0; i < slugs.length; i += batchSize) {
      const batch = slugs.slice(i, i + batchSize)
      const promises = batch.map(async (slug) => {
        const data = await getArticleViews(slug)
        if (data) {
          results.set(slug, data)
        }
      })
      
      await Promise.all(promises)
      
      // Small delay between batches
      if (i + batchSize < slugs.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    return results
  }

  return {
    getArticleViews,
    getMultipleArticleViews
  }
}
