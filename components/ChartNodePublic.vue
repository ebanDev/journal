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
}

const props = defineProps<Props>()

const { parseCSVToChartData, formatPieChartData, generateChartOptions, CHART_COLORS } = useChart()

// Chart components mapping
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

  return generateChartOptions(
    props.chartType,
    props.title,
    props.xLabel,
    props.yLabel,
    customOptions
  ) as any
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
