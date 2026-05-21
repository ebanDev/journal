import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

interface Article {
  id: string
  title: string
  slug: string | null
  description: string | null
  cover: string | null
  published_at: string | null
}

interface OneSignalNotificationPayload {
  app_id: string
  included_segments: string[]
  headings: { [key: string]: string }
  contents: { [key: string]: string }
  url?: string
  large_icon?: string
  big_picture?: string
  data?: { [key: string]: unknown }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { article } = await req.json() as { article?: Article }

    if (!article) {
      return new Response(
        JSON.stringify({ error: 'Article data is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID')
    const oneSignalRestApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY')

    if (!oneSignalAppId || !oneSignalRestApiKey) {
      return new Response(
        JSON.stringify({ error: 'OneSignal configuration missing' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const siteUrl = Deno.env.get('SITE_URL') || 'https://sursaut-revue.fr'
    const articleUrl = article.slug
      ? `${siteUrl}/${article.slug}`
      : `${siteUrl}/articles`

    const notificationPayload: OneSignalNotificationPayload = {
      app_id: oneSignalAppId,
      included_segments: ['All'],
      headings: {
        fr: `Nouvel article: ${article.title}`,
        en: `New article: ${article.title}`
      },
      contents: {
        fr: article.description || 'Un nouvel article de Sursaut! est disponible.',
        en: article.description || 'A new Sursaut! article is available.'
      },
      url: articleUrl,
      data: {
        article_id: article.id,
        article_slug: article.slug,
        type: 'new_article'
      }
    }

    if (article.cover) {
      const coverUrl = article.cover.startsWith('http')
        ? article.cover
        : `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/covers/${article.cover}`

      notificationPayload.large_icon = coverUrl
      notificationPayload.big_picture = coverUrl
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${oneSignalRestApiKey}`
      },
      body: JSON.stringify(notificationPayload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OneSignal API error:', errorText)
      return new Response(
        JSON.stringify({
          error: 'Failed to send notification',
          details: errorText
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const result = await response.json()
    console.log('Notification sent successfully:', result)

    return new Response(
      JSON.stringify({
        success: true,
        notification_id: result.id,
        recipients: result.recipients
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error sending notification:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
