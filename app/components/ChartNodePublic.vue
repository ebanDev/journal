<template>
  <div class="chart-public-wrapper">
    <div class="chart-container rounded-lg p-4 bg-white shadow-sm border border-gray-200">
      <!-- Chart Display -->
      <div v-if="chartData && chartData.datasets.length > 0" class="chart-display">
        <!-- Chart Component -->
        <div class="w-full md:aspect-[16/9] aspect-[4/3]">
          <component :is="chartComponent" :data="chartData" :options="computedOptions" class="max-w-full max-h-full" />
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state text-center py-8">
        <Icon name="i-mingcute-chart-bar-line" class="text-4xl text-gray-400 mb-3 mx-auto" />
        <p class="text-gray-500">Graphique non disponible</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Bar, Line, Pie } from 'vue-chartjs'
import { useChart } from '~/composables/useChart'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface Props {
  csvData: string
  chartType: 'bar' | 'line' | 'pie' | 'stackedArea'
  title?: string
  xLabel?: string
  yLabel?: string
  options?: string
  colors?: string
  seriesNames?: string
  icons?: string
}

const props = defineProps<Props>()

const { parseCSVToChartData, formatPieChartData, generateChartOptions, CHART_COLORS } = useChart()

// Cache for loaded icon images
const iconImageCache = new Map<string, HTMLImageElement>()

// Function to load SVG icon and convert to image
async function loadIconImage(iconName: string): Promise<HTMLImageElement | null> {
  // Check cache first
  if (iconImageCache.has(iconName)) {
    return iconImageCache.get(iconName)!
  }

  try {
    // Fetch SVG from Iconify API
    const response = await fetch(`https://api.iconify.design/mingcute/${iconName}.svg?color=%23374151&width=32&height=32`)
    if (!response.ok) throw new Error('Failed to fetch icon')
    
    const svgText = await response.text()
    
    // Create image from SVG
    const img = new Image()
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(svgBlob)
    
    return new Promise((resolve) => {
      img.onload = () => {
        URL.revokeObjectURL(url)
        iconImageCache.set(iconName, img)
        resolve(img)
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve(null)
      }
      img.src = url
    })
  } catch (error) {
    console.warn('Failed to load icon:', iconName, error)
    return null
  }
}

// Chart.js plugin for rendering icons in pie charts
const iconPlugin = {
  id: 'iconPlugin',
  async beforeDraw(chart: any) {
    if (chart.config.type !== 'pie') return
    
    const savedIcons = chart.config.options.plugins?.iconPlugin?.icons
    if (!savedIcons) return
    
    // Preload all required icons
    const iconPromises = Object.values(savedIcons).map((iconName: any) => {
      if (iconName && typeof iconName === 'string') {
        return loadIconImage(iconName.replace('mingcute:', ''))
      }
      return Promise.resolve(null)
    })
    
    await Promise.all(iconPromises)
  },
  afterDraw(chart: any) {
    if (chart.config.type !== 'pie') return
    
    const ctx = chart.ctx
    const meta = chart.getDatasetMeta(0)
    const savedIcons = chart.config.options.plugins?.iconPlugin?.icons
    
    if (!savedIcons || !meta.data) return
    
    meta.data.forEach((segment: any, index: number) => {
      const iconName = savedIcons[index]
      if (!iconName) return
      
      // Get the center point of the segment
      const { x, y } = segment.getCenterPoint()
      
      // Draw a white circle as background for the icon
      ctx.save()
      ctx.fillStyle = 'white'
      ctx.beginPath()
      ctx.arc(x, y, 24, 0, 2 * Math.PI)
      ctx.fill()
      
      // Add subtle border to the circle
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.lineWidth = 1
      ctx.stroke()
      
      // Draw the icon image if available
      const cleanIconName = iconName.replace('mingcute:', '')
      const iconImage = iconImageCache.get(cleanIconName)
      
      if (iconImage) {
        const iconSize = 20
        ctx.drawImage(
          iconImage,
          x - iconSize / 2,
          y - iconSize / 2,
          iconSize,
          iconSize
        )
      } else {
        // Fallback to text if image not loaded
        ctx.font = '10px sans-serif'
        ctx.fillStyle = '#374151'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const iconText = cleanIconName.split('-')[0]?.charAt(0)?.toUpperCase() || '?'
        ctx.fillText(iconText, x, y)
      }
      
      ctx.restore()
    })
  }
}

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  iconPlugin
)
const chartComponents = {
  bar: Bar,
  line: Line,
  pie: Pie,
  stackedArea: Line
}

// Computed properties
const chartComponent = computed(() => {
  return chartComponents[props.chartType] || Bar
})

const chartData = computed(() => {
  if (!props.csvData) return null
  
  const result = parseCSVToChartData(props.csvData)

  if (result.data) {
    // For pie charts, format with multiple colors per slice
    if (props.chartType === 'pie') {
      const pieData = formatPieChartData(result.data)
      
      // Apply saved colors to the pie data if available
      if (props.colors) {
        try {
          const savedColors = JSON.parse(props.colors)
          if (Object.keys(savedColors).length > 0) {
            // For pie charts, saved colors should be applied to each slice
            pieData.datasets[0].backgroundColor = pieData.labels.map((_, index) => 
              savedColors[index] || (Array.isArray(pieData.datasets[0].backgroundColor) 
                ? pieData.datasets[0].backgroundColor[index] 
                : CHART_COLORS[index % CHART_COLORS.length])
            )
            pieData.datasets[0].borderColor = pieData.datasets[0].backgroundColor
          }
        } catch (e) {
          console.warn('Error parsing saved colors for pie chart:', e)
        }
      }
      
      return pieData
    }

    // For other chart types, apply saved colors and series names normally
    if (props.colors) {
      try {
        const savedColors = JSON.parse(props.colors)
        result.data.datasets = result.data.datasets.map((dataset, index) => ({
          ...dataset,
          backgroundColor: savedColors[index] || dataset.backgroundColor,
          borderColor: savedColors[index] || dataset.borderColor,
          // For stacked area charts, add fill property
          fill: props.chartType === 'stackedArea' ? 'origin' : false
        }))
      } catch (e) {
        console.warn('Error parsing saved colors:', e)
      }
    }

    // Apply saved series names
    if (props.seriesNames) {
      try {
        const savedSeriesNames = JSON.parse(props.seriesNames)
        result.data.datasets = result.data.datasets.map((dataset, index) => ({
          ...dataset,
          label: savedSeriesNames[index] || dataset.label,
        }))
      } catch (e) {
        console.warn('Error parsing saved series names:', e)
      }
    }
  }

  return result.data
})

const computedOptions = computed(() => {
  let customOptions = {}
  try {
    customOptions = JSON.parse(props.options || '{}')
  } catch (e) {
    console.warn('Invalid JSON in chart options:', e)
  }

  const baseOptions = generateChartOptions(
    props.chartType,
    props.title,
    props.xLabel,
    props.yLabel,
    customOptions
  ) as any

  // Add icon plugin for pie charts
  if (props.chartType === 'pie' && props.icons) {
    try {
      const savedIcons = JSON.parse(props.icons)
      if (!baseOptions.plugins) baseOptions.plugins = {}
      baseOptions.plugins.iconPlugin = { icons: savedIcons }
    } catch (e) {
      console.warn('Error parsing saved icons:', e)
    }
  }

  return baseOptions
})

// Set up chart defaults on mount
onMounted(() => {
  ChartJS.defaults.color = 'oklch(55.3% 0.013 58.071)';
  ChartJS.defaults.borderColor = 'oklch(55.3% 0.013 58.071)';
  ChartJS.defaults.backgroundColor = 'oklch(55.3% 0.013 58.071)';
  ChartJS.defaults.font.family = '"Sen", sans-serif'
})
</script>

<style scoped>
.chart-public-wrapper {
  margin: 1rem 0;
}

.chart-container {
  background: #fff;
}

.chart-display canvas {
  max-height: 400px !important;
}

:deep(.chart-container canvas) {
  border-radius: 0.375rem;
}
</style>
