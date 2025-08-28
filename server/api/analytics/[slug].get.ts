import { defineEventHandler, getRouterParam, createError } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import { getClient } from '@umami/api-client'

export default defineEventHandler(async (event) => {
  try {
    // Check if user is authenticated
    const user = await serverSupabaseUser(event)
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const slug = getRouterParam(event, 'slug')
    if (!slug) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Article slug is required'
      })
    }

    // Check if required environment variables are present
    const clientUserId = process.env.UMAMI_API_CLIENT_USER_ID
    const clientSecret = process.env.UMAMI_API_CLIENT_SECRET
    const endpoint = process.env.UMAMI_API_CLIENT_ENDPOINT
    const websiteId = process.env.UMAMI_WEBSITE_ID

    if (!clientSecret || !endpoint || !clientUserId || !websiteId) {
      console.error('environment variables UMAMI_API_CLIENT_USER_ID, UMAMI_API_CLIENT_SECRET, UMAMI_API_CLIENT_ENDPOINT, or UMAMI_WEBSITE_ID are missing')
      throw createError({
        statusCode: 500,
        statusMessage: 'Analytics configuration missing'
      })
    }

    // Initialize Umami API client
    const client = getClient({
      userId: clientUserId,
      secret: clientSecret,
      apiEndpoint: endpoint,
    })

    // Calculate date range for the last 30 days
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 256)

    // Get page views for the specific article
    const { ok, data, error } = await client.getWebsiteStats(websiteId, {
      startAt: startDate.getTime(),
      endAt: endDate.getTime(),
      url: `/articles/${slug}`
    })

    if (!ok) {
      console.error('Umami API error:', error, data, ok, slug)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch analytics data'
      })
    }

    return {
      slug,
      views: data?.pageviews?.value || 0,
      visitors: data?.visitors?.value || 0,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    }
  } catch (error: any) {
    console.error('Analytics API error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
