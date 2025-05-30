import { defineEventHandler, getQuery } from 'h3'
import * as cheerio from 'cheerio'

export default defineEventHandler(async (event) => {
  const { url } = getQuery(event)
  if (!url || typeof url !== 'string') {
    return { error: 'URL parameter is required' }
  }
  try {
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
