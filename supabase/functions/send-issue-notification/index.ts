import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface Issue {
  id: string
  title: string
  slug: string
  description: string | null
  cover: string | null
  published_at: string
}

interface OneSignalNotificationPayload {
  app_id: string
  included_segments: string[]
  headings: { [key: string]: string }
  contents: { [key: string]: string }
  url?: string
  large_icon?: string
  big_picture?: string
  data?: { [key: string]: any }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { issue } = await req.json() as { issue: Issue }
    
    if (!issue) {
      return new Response(
        JSON.stringify({ error: 'Issue data is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get OneSignal configuration from environment
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

    // Prepare notification payload
    const siteUrl = Deno.env.get('SITE_URL') || 'https://sursaut-revue.fr'
    const issueUrl = `${siteUrl}/issues/${issue.id}`
    
    const notificationPayload: OneSignalNotificationPayload = {
      app_id: oneSignalAppId,
      included_segments: ['All'], // Send to all subscribers
      headings: {
        'fr': `📰 Nouveau numéro: ${issue.title}`,
        'en': `📰 New Issue: ${issue.title}`
      },
      contents: {
        'fr': issue.description || 'Un nouveau numéro de la Revue Sursaut! est disponible.',
        'en': issue.description || 'A new issue of Revue Sursaut! is available.'
      },
      url: issueUrl,
      data: {
        issue_id: issue.id,
        issue_slug: issue.slug,
        type: 'new_issue'
      }
    }

    // Add large icon and big picture if cover is available
    if (issue.cover) {
      const coverUrl = issue.cover.startsWith('http') 
        ? issue.cover 
        : `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/covers/${issue.cover}`
      
      notificationPayload.large_icon = coverUrl
      notificationPayload.big_picture = coverUrl
    }

    // Send notification via OneSignal REST API
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${oneSignalRestApiKey}`
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
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
