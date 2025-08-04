import { defineEventHandler, getQuery } from 'h3'
import * as cheerio from 'cheerio'

export default defineEventHandler(async (event) => {
  const { url } = getQuery(event)
  if (!url || typeof url !== 'string') {
    return { error: 'URL parameter is required' }
  }
  try {
    const decodedUrl = decodeURIComponent(url)
    if (!/^https?:\/\//.test(decodedUrl)) {
      return { error: 'Invalid URL format' }
    }
    // Verify if the URL is youtube, and if so we use youtube's API to fetch metadata
    
    if (decodedUrl.includes('youtube.com') || decodedUrl.includes('youtu.be')) {

      const apiKey = process.env.YOUTUBE_API_KEY
      if (!apiKey) {
        return { error: 'YouTube API key is not configured' }
      }
      const videoId = decodedUrl.split('v=')[1]?.split('&')[0] || decodedUrl.split('/').pop()
      console.log('Fetching YouTube metadata for ID:', videoId)
      if (!videoId) {
        return { error: 'Invalid YouTube video ID' }
      }
      const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet`
      const apiRes = await fetch(apiUrl)
      const apiData = await apiRes.json()
      if (apiData.items.length > 0) {
        const { title, description, thumbnails, channelTitle } = apiData.items[0].snippet
        return { title, description, cover: thumbnails.high.url, source: channelTitle }
      }
    }
    const res = await fetch(decodeURIComponent(url))
    const html = await res.text()
    const $ = cheerio.load(html)
    const title = $('head > title').text() || ''
    const description = $('meta[name="description"]').attr('content')
      || $('meta[property="og:description"]').attr('content')
      || ''
    const cover = $('meta[property="og:image"]').attr('content') || ''
    const source = $('meta[property="og:site_name"]').attr('content') || ''
    return { title, description, cover, source }
  } catch (err: any) {
    return { error: err.message }
  }
})
