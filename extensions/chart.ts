import { Node } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import ChartNode from '~/components/tiptap/ChartNode.vue'

export interface ChartOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    chart: {
      /**
       * Insert a chart with CSV data
       */
      setChart: (attributes: { 
        csvData: string
        chartType: 'bar' | 'line' | 'pie' | 'stackedArea'
        title?: string
        xLabel?: string
        yLabel?: string
        options?: Record<string, any>
        colors?: Record<string, any>
        seriesNames?: Record<string, any>
      }) => ReturnType
      /**
       * Update chart attributes
       */
      updateChart: (attributes: Partial<{
        csvData: string
        chartType: 'bar' | 'line' | 'pie' | 'stackedArea'
        title?: string
        xLabel?: string
        yLabel?: string
        options?: Record<string, any>
        colors?: Record<string, any>
        seriesNames?: Record<string, any>
      }>) => ReturnType
      /**
       * Delete the current chart
       */
      deleteChart: () => ReturnType
    }
  }
}

export const Chart = Node.create<ChartOptions>({
  name: 'chart',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  group: 'block',

  content: '',

  marks: '',

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      csvData: {
        default: '',
        parseHTML: element => element.getAttribute('data-csv-data') || '',
        renderHTML: attributes => {
          return {
            'data-csv-data': attributes.csvData,
          }
        },
      },
      chartType: {
        default: 'bar',
        parseHTML: element => element.getAttribute('data-chart-type') || 'bar',
        renderHTML: attributes => {
          return {
            'data-chart-type': attributes.chartType,
          }
        },
      },
      title: {
        default: '',
        parseHTML: element => element.getAttribute('data-title') || '',
        renderHTML: attributes => {
          return {
            'data-title': attributes.title,
          }
        },
      },
      xLabel: {
        default: '',
        parseHTML: element => element.getAttribute('data-x-label') || '',
        renderHTML: attributes => {
          return {
            'data-x-label': attributes.xLabel,
          }
        },
      },
      yLabel: {
        default: '',
        parseHTML: element => element.getAttribute('data-y-label') || '',
        renderHTML: attributes => {
          return {
            'data-y-label': attributes.yLabel,
          }
        },
      },
      options: {
        default: '{}',
        parseHTML: element => element.getAttribute('data-options') || '{}',
        renderHTML: attributes => {
          return {
            'data-options': attributes.options,
          }
        },
      },
      colors: {
        default: '{}',
        parseHTML: element => element.getAttribute('data-colors') || '{}',
        renderHTML: attributes => {
          return {
            'data-colors': attributes.colors,
          }
        },
      },
      seriesNames: {
        default: '{}',
        parseHTML: element => element.getAttribute('data-series-names') || '{}',
        renderHTML: attributes => {
          return {
            'data-series-names': attributes.seriesNames,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-chart]',
        getAttrs: element => ({
          csvData: element.getAttribute('data-csv-data') || '',
          chartType: element.getAttribute('data-chart-type') || 'bar',
          title: element.getAttribute('data-title') || '',
          xLabel: element.getAttribute('data-x-label') || '',
          yLabel: element.getAttribute('data-y-label') || '',
          options: element.getAttribute('data-options') || '{}',
          colors: element.getAttribute('data-colors') || '{}',
          seriesNames: element.getAttribute('data-series-names') || '{}',
        }),
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-chart': '', ...HTMLAttributes }]
  },

  addCommands() {
    return {
      setChart:
        attributes =>
        ({ commands, state }) => {
          const { selection } = state
          const position = selection.$head

          return commands.insertContentAt(position.pos, {
            type: this.name,
            attrs: {
              csvData: attributes.csvData,
              chartType: attributes.chartType,
              title: attributes.title || '',
              xLabel: attributes.xLabel || '',
              yLabel: attributes.yLabel || '',
              options: typeof attributes.options === 'string' 
                ? attributes.options 
                : JSON.stringify(attributes.options || {}),
              colors: typeof attributes.colors === 'string'
                ? attributes.colors
                : JSON.stringify(attributes.colors || {}),
              seriesNames: typeof attributes.seriesNames === 'string'
                ? attributes.seriesNames
                : JSON.stringify(attributes.seriesNames || {}),
            },
          })
        },
      updateChart:
        attributes =>
        ({ commands }) => {
          const updateAttrs: any = { ...attributes }
          if (typeof attributes.options !== 'string' && attributes.options) {
            updateAttrs.options = JSON.stringify(attributes.options)
          }
          if (typeof attributes.colors !== 'string' && attributes.colors) {
            updateAttrs.colors = JSON.stringify(attributes.colors)
          }
          if (typeof attributes.seriesNames !== 'string' && attributes.seriesNames) {
            updateAttrs.seriesNames = JSON.stringify(attributes.seriesNames)
          }
          return commands.updateAttributes(this.name, updateAttrs)
        },
      deleteChart:
        () =>
        ({ commands }) => {
          return commands.deleteSelection()
        },
    }
  },

  addNodeView() {
    return VueNodeViewRenderer(ChartNode)
  },
})

export default Chart
