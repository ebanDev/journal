<template>
  <div class="prose max-w-none">
    <template v-for="segment in renderedSegments" :key="segment.key">
      <div
        v-if="segment.type === 'html'"
        class="article-content__html contents"
        v-html="segment.content"
      ></div>
      <ChartNodePublic
        v-else
        class="my-6"
        :csv-data="segment.chart.csvData"
        :chart-type="segment.chart.chartType"
        :title="segment.chart.title"
        :x-label="segment.chart.xLabel"
        :y-label="segment.chart.yLabel"
        :options="segment.chart.options"
        :colors="segment.chart.colors"
        :series-names="segment.chart.seriesNames"
        :icons="segment.chart.icons"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import ChartNodePublic from '~/components/ChartNodePublic.vue'

interface Props {
  content: string
}

const props = defineProps<Props>()

type ChartType = 'bar' | 'line' | 'pie' | 'stackedArea'

type ChartSegment = {
  type: 'chart'
  key: string
  chart: {
    csvData: string
    chartType: ChartType
    title: string
    xLabel: string
    yLabel: string
    options: string
    colors: string
    seriesNames: string
    icons: string
  }
}

type HtmlSegment = {
  type: 'html'
  key: string
  content: string
}

type Segment = ChartSegment | HtmlSegment

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')

const encodeHtmlAttribute = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const enhanceSources = (html: string) => {
  let sourceIndex = 0
  return html.replace(
    /<span([^>]*?data-source-data\s*=\s*['"](.*?)['"][^>]*?)>(.*?)<\/span>/gi,
    (_match, _beforeContent, sourceDataEncoded, textContent) => {
      try {
        const sourceDataStr = decodeHtmlEntities(sourceDataEncoded)
        const sourceData = JSON.parse(sourceDataStr)
        const sourceId = `source-${sourceIndex++}`
        return `<span class="source-mark inline-flex items-center gap-1 px-1 py-0.5 bg-amber-50 text-amber-800 rounded border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer" data-source-data='${JSON.stringify(sourceData)}' data-source-id="${sourceId}"><svg class="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M5 21V3h14v18l-7-3-7 3zm2-3.236l5-2.143 5 2.143V5H7v12.764z"/></svg>${textContent}</span>`
      } catch (e) {
        return `<span class="source-mark inline-flex items-center gap-1 px-1 py-0.5 bg-amber-50 text-amber-800 rounded border border-amber-200 cursor-pointer"><svg class="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M5 21V3h14v18l-7-3-7 3zm2-3.236l5-2.143 5 2.143V5H7v12.764z"/></svg>${textContent}</span>`
      }
    }
  )
}

const renderMath = (html: string) => {
  const renderLatex = (latex: string, displayMode: boolean) => {
    try {
      return katex.renderToString(latex, {
        displayMode,
        throwOnError: false
      })
    } catch (error) {
      console.warn('Failed to render LaTeX:', error)
      return latex
    }
  }

  const inlineRegex = /<span(?=[^>]*data-type=(?:"|')inline-math(?:"|'))(?=[^>]*data-latex=(?:"|')([^"']*)(?:"|'))[^>]*><\/span>/gi
  const blockRegex = /<(div|span)(?=[^>]*data-type=(?:"|')block-math(?:"|'))(?=[^>]*data-latex=(?:"|')([^"']*)(?:"|'))[^>]*><\/\1>/gi

  let output = html

  output = output.replace(blockRegex, (fullMatch, tag, latexAttr) => {
    const latex = decodeHtmlEntities(latexAttr)
    const rendered = renderLatex(latex, true)
    const dataLatex = encodeHtmlAttribute(latex)
    const attrMatch = fullMatch.match(new RegExp(`^<${tag}([^>]*)>`, 'i'))
    const rawAttrs = attrMatch?.[1] ?? ''
    const cleanedAttrs = rawAttrs
      .replace(/\sdata-latex=("[^"]*"|'[^']*')/gi, '')
      .replace(/\sdata-type=("[^"]*"|'[^']*')/gi, '')
      .replace(/\sclass=("[^"]*"|'[^']*')/gi, '')
      .trim()
    const attrString = cleanedAttrs ? `${cleanedAttrs} ` : ''
    return `<${tag} ${attrString}class="tiptap-mathematics-render" data-type="block-math" data-latex="${dataLatex}">${rendered}</${tag}>`
  })

  output = output.replace(inlineRegex, (fullMatch, latexAttr) => {
    const latex = decodeHtmlEntities(latexAttr)
    const rendered = renderLatex(latex, false)
    const dataLatex = encodeHtmlAttribute(latex)
    const attrMatch = fullMatch.match(/^<span([^>]*)>/i)
    const rawAttrs = attrMatch?.[1] ?? ''
    const cleanedAttrs = rawAttrs
      .replace(/\sdata-latex=("[^"]*"|'[^']*')/gi, '')
      .replace(/\sdata-type=("[^"]*"|'[^']*')/gi, '')
      .replace(/\sclass=("[^"]*"|'[^']*')/gi, '')
      .trim()
    const attrString = cleanedAttrs ? `${cleanedAttrs} ` : ''
    return `<span ${attrString}class="tiptap-mathematics-render" data-type="inline-math" data-latex="${dataLatex}">${rendered}</span>`
  })

  return output
}

const enhanceContent = (html: string) => renderMath(enhanceSources(html))

const renderedSegments = computed<Segment[]>(() => {
  if (!props.content) return []

  const enhanced = enhanceContent(props.content)
  const segments: Segment[] = []
  const chartRegex = /<div[^>]*data-chart[^>]*>\s*<\/div>/gi

  let lastIndex = 0
  let match: RegExpExecArray | null
  let segmentIndex = 0

  while ((match = chartRegex.exec(enhanced)) !== null) {
    const [fullMatch] = match
    const start = match.index

    if (start > lastIndex) {
      const htmlSlice = enhanced.slice(lastIndex, start)
      if (htmlSlice.trim()) {
        segments.push({
          type: 'html',
          key: `html-${segmentIndex++}`,
          content: htmlSlice
        })
      }
    }

    const chartSegment = createChartSegment(fullMatch, `chart-${segmentIndex++}`)
    if (chartSegment) {
      segments.push(chartSegment)
    }

    lastIndex = start + fullMatch.length
  }

  const tail = enhanced.slice(lastIndex)
  if (tail.trim()) {
    segments.push({
      type: 'html',
      key: `html-${segmentIndex++}`,
      content: tail
    })
  }

  if (!segments.length) {
    return [{ type: 'html', key: 'html-0', content: enhanced }]
  }

  return segments
})

function createChartSegment(match: string, key: string): ChartSegment | null {
  const extractAttribute = (attrName: string): string => {
    const patterns = [
      new RegExp(`${attrName}\\s*=\\s*"([^"]*)"`, 'i'),
      new RegExp(`${attrName}\\s*=\\s*'([^']*)'`, 'i')
    ]

    for (const pattern of patterns) {
      const attrMatch = match.match(pattern)
      if (attrMatch && attrMatch[1]) {
        return decodeHtmlEntities(attrMatch[1])
      }
    }
    return ''
  }

  const csvData = extractAttribute('data-csv-data')
  if (!csvData) {
    return null
  }

  const chartTypeRaw = extractAttribute('data-chart-type') || 'bar'
  const chartType: ChartType = isChartType(chartTypeRaw) ? chartTypeRaw : 'bar'
  const title = extractAttribute('data-title')
  const xLabel = extractAttribute('data-x-label')
  const yLabel = extractAttribute('data-y-label')
  const optionsRaw = extractAttribute('data-options') || '{}'
  const colorsRaw = extractAttribute('data-colors') || '{}'
  const seriesNamesRaw = extractAttribute('data-series-names') || '{}'
  const iconsRaw = extractAttribute('data-icons') || '{}'

  return {
    type: 'chart',
    key,
    chart: {
      csvData,
      chartType,
      title,
      xLabel,
      yLabel,
      options: optionsRaw,
      colors: colorsRaw,
      seriesNames: seriesNamesRaw,
      icons: iconsRaw
    }
  }
}

function isChartType(value: string): value is ChartType {
  return value === 'bar' || value === 'line' || value === 'pie' || value === 'stackedArea'
}
</script>

<style scoped>
:deep(.contents) {
  display: contents;
}

:deep(.source-mark:hover) {
  background-color: rgb(254 243 199) !important; /* amber-100 */
}
</style>
