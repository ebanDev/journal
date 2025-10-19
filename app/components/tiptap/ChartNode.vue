<template>
  <NodeViewWrapper class="chart-node-wrapper">
    <div class="chart-container rounded-lg p-4 relative shadow-xs"
      :class="{ 'border-amber-400': selected }">
      <!-- Actions -->
      <div class="flex gap-1 absolute top-2 right-2 z-10">
        <UButton size="xs" variant="ghost" color="neutral" icon="i-mingcute-edit-line" title="Modifier le graphique"
          @click="showEditor = true" />
        <UButton size="xs" variant="ghost" color="error" icon="i-mingcute-delete-2-line" title="Supprimer le graphique"
          @click="deleteChart" />
      </div>

      <!-- Chart Display -->
      <div v-if="chartData && chartData.datasets.length > 0" class="chart-display">
        <!-- Chart Component -->
        <div class="w-full" style="height: 400px;">
          <component :is="chartComponent" :data="chartData" :options="computedOptions" class="max-w-full max-h-full" />
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state text-center py-8">
        <Icon name="i-mingcute-chart-bar-line" class="text-4xl text-gray-400 mb-3 mx-auto" />
        <p class="text-gray-500 mb-4">Aucune donnée de graphique disponible</p>
        <UButton size="sm" variant="solid" color="primary" icon="i-mingcute-file-upload-line"
          @click="showEditor = true">
          Importer des données CSV
        </UButton>
      </div>
    </div>

    <!-- Chart Editor Modal -->
    <UModal v-model:open="showEditor">
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold">
            Modifier le graphique
          </h3>
          <UButton size="xs" variant="ghost" color="neutral" icon="i-mingcute-close-line" @click="showEditor = false" />
        </div>
      </template>

      <template #body>
        <!-- Tab Navigation -->
        <div class="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
          <button type="button" class="flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors"
            :class="activeTab === 'general' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'"
            @click="activeTab = 'general'">
            Général
          </button>
          <button type="button" class="flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors"
            :class="activeTab === 'appearance' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'"
            @click="activeTab = 'appearance'">
            Apparence
          </button>
          <button v-if="selectedChartType !== 'pie'" type="button" class="flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors"
            :class="activeTab === 'options' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'"
            @click="activeTab = 'options'">
            Options
          </button>
        </div>

        <!-- General Tab -->
        <div v-if="activeTab === 'general'" class="space-y-6">
          <!-- Chart Configuration -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-3">
              <label class="block text-sm font-medium text-gray-700">Type de graphique</label>
              <USelect v-model="selectedChartType" :items="chartTypeOptions" placeholder="Sélectionner un type" />
            </div>

            <div class="space-y-3">
              <label class="block text-sm font-medium text-gray-700">Titre du graphique</label>
              <UInput v-model="chartTitle" placeholder="Titre du graphique (optionnel)" />
            </div>

            <div class="space-y-3">
              <label class="block text-sm font-medium text-gray-700">Label axe X</label>
              <UInput v-model="xAxisLabel" placeholder="Label axe X (optionnel)" />
            </div>

            <div class="space-y-3">
              <label class="block text-sm font-medium text-gray-700">Label axe Y</label>
              <UInput v-model="yAxisLabel" placeholder="Label axe Y (optionnel)" />
            </div>
          </div>

          <!-- Series Names Configuration -->
          <div v-if="chartData && chartData.datasets.length > 0" class="space-y-4">
            <label class="block text-sm font-medium text-gray-700">Noms des séries</label>
            <div class="space-y-3">
              <div v-for="(dataset, index) in chartData.datasets" :key="index" class="flex items-center gap-3">
                <span class="text-sm text-gray-600 w-16">Série {{ index + 1 }}</span>
                <UInput v-model="seriesNames[index]" :placeholder="dataset.label || `Série ${index + 1}`"
                  class="flex-1" />
              </div>
            </div>
          </div>
        </div>

        <!-- Appearance Tab -->
        <div v-if="activeTab === 'appearance'" class="space-y-6">
          <!-- Color Customization for Pie Charts -->
          <div v-if="selectedChartType === 'pie' && chartData && chartData.labels.length > 0" class="space-y-4">
            <label class="block text-sm font-medium text-gray-700">Couleurs des secteurs</label>
            <div class="space-y-3">
              <div v-for="(label, index) in chartData.labels" :key="index"
                :data-drag-target="index"
                class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
                :class="{ 
                  'bg-blue-50 border-blue-300': draggedIndex === index,
                  'bg-green-50 border-green-300': dragOverIndex === index && draggedIndex !== index
                }">
                <div class="flex items-center gap-2">
                  <!-- Drag handle -->
                  <div class="cursor-move text-gray-400 hover:text-gray-600" @mousedown="startDrag(index, 'slice')">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"></path>
                    </svg>
                  </div>
                  <div class="w-4 h-4 rounded border border-gray-300"
                    :style="{ backgroundColor: selectedColors[index] || CHART_COLORS[index % CHART_COLORS.length] }"
                    title="Couleur actuelle"></div>
                  <span class="text-sm font-medium text-gray-700 flex-1">{{ label }}</span>
                </div>

                <!-- Color presets -->
                <div class="flex gap-1">
                  <button v-for="color in CHART_COLORS.slice(0, 8)" :key="color" type="button"
                    class="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    :style="{ backgroundColor: color }" @click="setDatasetColor(index, color)" :title="color"></button>
                  
                  <!-- Delete button for pie slices (only show if more than 1 slice) -->
                  <button v-if="chartData.labels.length > 1" type="button"
                    class="w-6 h-6 rounded border border-red-300 bg-red-50 hover:bg-red-100 transition-colors text-red-600 hover:text-red-700 ml-2"
                    @click="deleteSlice(index)" title="Supprimer ce secteur">
                    <svg class="w-3 h-3 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Icon Customization for Pie Charts -->
          <div v-if="selectedChartType === 'pie' && chartData && chartData.labels.length > 0" class="space-y-4">
            <label class="block text-sm font-medium text-gray-700">Icônes des secteurs</label>
            <div class="space-y-3">
              <div v-for="(label, index) in chartData.labels" :key="index"
                class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 rounded border border-gray-300"
                    :style="{ backgroundColor: selectedColors[index] || CHART_COLORS[index % CHART_COLORS.length] }">
                  </div>
                  <span class="text-sm font-medium text-gray-700 flex-1">{{ label }}</span>
                </div>

                <!-- Icon picker -->
                <div class="flex gap-2 items-center">
                  <IconPicker
                    v-model="selectedIcons[index]"
                    :placeholder="`Icône pour ${label}`"
                  />
                  <!-- Clear icon button -->
                  <button v-if="selectedIcons[index]" type="button"
                    class="w-6 h-6 rounded border border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-700"
                    @click="selectedIcons[index] = ''" title="Supprimer l'icône">
                    <svg class="w-3 h-3 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Color Customization for Other Chart Types -->
          <div v-else-if="chartData && chartData.datasets.length > 0" class="space-y-4">
            <label class="block text-sm font-medium text-gray-700">Couleurs des séries</label>
            <div class="space-y-3">
              <div v-for="(dataset, index) in chartData.datasets" :key="index"
                :data-drag-target="index"
                class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
                :class="{ 
                  'bg-blue-50 border-blue-300': draggedIndex === index && dragType === 'series',
                  'bg-green-50 border-green-300': dragOverIndex === index && draggedIndex !== index && dragType === 'series'
                }">
                <div class="flex items-center gap-2">
                  <!-- Drag handle for stackedArea -->
                  <div v-if="selectedChartType === 'stackedArea'" class="cursor-move text-gray-400 hover:text-gray-600" @mousedown="startDrag(index, 'series')">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"></path>
                    </svg>
                  </div>
                  <div class="w-4 h-4 rounded border border-gray-300"
                    :style="{ backgroundColor: selectedColors[index] || (Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[0] : dataset.backgroundColor) }"
                    title="Couleur actuelle"></div>
                  <span class="text-sm font-medium text-gray-700 flex-1">{{ seriesNames[index] || dataset.label }}</span>
                </div>

                <!-- Color presets -->
                <div class="flex gap-1">
                  <button v-for="color in CHART_COLORS.slice(0, 8)" :key="color" type="button"
                    class="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    :style="{ backgroundColor: color }" @click="setDatasetColor(index, color)" :title="color"></button>
                  
                  <!-- Delete button for series (only show if more than 1 series) -->
                  <button v-if="chartData.datasets.length > 1" type="button"
                    class="w-6 h-6 rounded border border-red-300 bg-red-50 hover:bg-red-100 transition-colors text-red-600 hover:text-red-700 ml-2"
                    @click="deleteSeries(index)" title="Supprimer cette série">
                    <svg class="w-3 h-3 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Options Tab -->
        <div v-if="activeTab === 'options'" class="space-y-6">
          <!-- Grid and Axis Options (not for pie charts) -->
          <div v-if="selectedChartType !== 'pie'" class="space-y-4">
            <label class="block text-sm font-medium text-gray-700">Options de grille et d'axes</label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-3">
                <UCheckbox v-model="showGridX" label="Afficher grille axe X" />
              </div>

              <div class="space-y-3">
                <UCheckbox v-model="showGridY" label="Afficher grille axe Y" />
              </div>

              <div class="space-y-3" v-if="['line', 'stackedArea'].includes(selectedChartType)">
                <UCheckbox v-model="showPoints" label="Afficher les points de données" />
              </div>

              <div class="space-y-3">
                <label class="block text-sm font-medium text-gray-700">Valeur minimum axe Y</label>
                <UInput v-model.number="yMin" type="number" placeholder="Auto" />
              </div>

              <div class="space-y-3">
                <label class="block text-sm font-medium text-gray-700">Valeur maximum axe Y</label>
                <UInput v-model.number="yMax" type="number" placeholder="Auto" />
              </div>
            </div>
          </div>
        </div>

        <!-- Chart Preview (always visible) -->
        <div v-if="modifiedChartData" class="space-y-3 mt-6 pt-6 border-t border-gray-200">
          <label class="block text-sm font-medium text-gray-700">Aperçu</label>
          <div class="border border-gray-200 rounded-lg p-4" style="height: 300px;">
            <component :is="chartComponent" :data="modifiedChartData" :options="previewOptions"
              class="max-w-full max-h-full" />
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton variant="ghost" color="neutral" @click="showEditor = false">
            Annuler
          </UButton>
          <UButton variant="solid" color="primary" @click="saveChart">
            Mettre à jour le graphique
          </UButton>
        </div>
      </template>
    </UModal>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'
import Papa from 'papaparse'
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
import IconPicker from '~/components/IconPicker.vue'

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

ChartJS.defaults.color = 'oklch(55.3% 0.013 58.071)';
ChartJS.defaults.borderColor = 'oklch(55.3% 0.013 58.071)';
ChartJS.defaults.backgroundColor = 'oklch(55.3% 0.013 58.071)';
ChartJS.defaults.font.family = '"Sen", sans-serif'

const props = defineProps(nodeViewProps)

const { parseCSVToChartData, formatPieChartData, generateChartOptions, CHART_COLORS } = useChart()

// State
const showEditor = ref(false)
const selectedColors = ref<Record<number, string>>({})
const activeTab = ref('general')
// New configuration state
const showGridX = ref(true)
const showGridY = ref(true)
const yMin = ref<number | null>(null)
const yMax = ref<number | null>(null)
const showPoints = ref(true)
const seriesNames = ref<Record<number, string>>({})
const selectedIcons = ref<Record<number, string>>({})

// Drag and drop state
const draggedIndex = ref<number | null>(null)
const dragType = ref<'slice' | 'series' | null>(null)
const dragOverIndex = ref<number | null>(null)

// Form state
const selectedChartType = ref(props.node.attrs.chartType || 'bar')
const chartTitle = ref(props.node.attrs.title || '')
const xAxisLabel = ref(props.node.attrs.xLabel || '')
const yAxisLabel = ref(props.node.attrs.yLabel || '')

// Chart type options
const chartTypeOptions = [
  { value: 'bar', label: 'Barres' },
  { value: 'line', label: 'Ligne' },
  { value: 'pie', label: 'Secteurs' },
  { value: 'stackedArea', label: 'Aires Empilées' }
]

// Chart components mapping
const chartComponents = {
  bar: Bar,
  line: Line,
  pie: Pie,
  stackedArea: Line
}

// Computed properties
const chartTypeLabel = computed(() => {
  const option = chartTypeOptions.find(opt => opt.value === props.node.attrs.chartType)
  return option?.label || 'Graphique'
})

const chartComponent = computed(() => {
  return chartComponents[props.node.attrs.chartType as keyof typeof chartComponents] || Bar
})

const chartData = computed(() => {
  if (!props.node.attrs.csvData) return null
  const result = parseCSVToChartData(props.node.attrs.csvData)

  if (result.data) {
    // For pie charts, format with multiple colors per slice
    if (props.node.attrs.chartType === 'pie') {
      const pieData = formatPieChartData(result.data)
      
      // Apply saved colors to the pie data if available
      if (props.node.attrs.colors) {
        try {
          const savedColors = JSON.parse(props.node.attrs.colors)
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
    if (props.node.attrs.colors) {
      try {
        const savedColors = JSON.parse(props.node.attrs.colors)
        result.data.datasets = result.data.datasets.map((dataset, index) => ({
          ...dataset,
          backgroundColor: savedColors[index] || dataset.backgroundColor,
          borderColor: savedColors[index] || dataset.borderColor,
        }))
      } catch (e) {
        console.warn('Error parsing saved colors:', e)
      }
    }

    // Apply saved series names
    if (props.node.attrs.seriesNames) {
      try {
        const savedSeriesNames = JSON.parse(props.node.attrs.seriesNames)
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

const modifiedChartData = computed(() => {
  if (!chartData.value) return null

  // For pie charts, handle colors differently (each slice gets its own color)
  if (selectedChartType.value === 'pie') {
    const dataset = chartData.value.datasets[0]
    return {
      ...chartData.value,
      datasets: [{
        ...dataset,
        backgroundColor: chartData.value.labels.map((_, index) => 
          selectedColors.value[index] || (Array.isArray(dataset.backgroundColor) 
            ? dataset.backgroundColor[index] 
            : dataset.backgroundColor)
        ),
        borderColor: chartData.value.labels.map((_, index) => 
          selectedColors.value[index] || (Array.isArray(dataset.borderColor) 
            ? dataset.borderColor[index] 
            : dataset.borderColor)
        ),
        label: seriesNames.value[0] || dataset.label
      }]
    }
  }

  // For other chart types, handle normally
  const modifiedData = {
    ...chartData.value,
    datasets: chartData.value.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: selectedColors.value[index] || dataset.backgroundColor,
      borderColor: selectedColors.value[index] || dataset.borderColor,
      label: seriesNames.value[index] || dataset.label,
      // For stacked area charts, add fill property
      fill: selectedChartType.value === 'stackedArea' ? 'origin' : false
    }))
  }

  return modifiedData
})

const computedOptions = computed(() => {
  let customOptions = {}
  try {
    customOptions = JSON.parse(props.node.attrs.options || '{}')
  } catch (e) {
    console.warn('Invalid JSON in chart options:', e)
  }

  const baseOptions = generateChartOptions(
    props.node.attrs.chartType,
    props.node.attrs.title,
    props.node.attrs.xLabel,
    props.node.attrs.yLabel,
    customOptions
  ) as any

  // Add icon plugin for pie charts
  if (props.node.attrs.chartType === 'pie' && props.node.attrs.icons) {
    try {
      const savedIcons = JSON.parse(props.node.attrs.icons)
      if (!baseOptions.plugins) baseOptions.plugins = {}
      baseOptions.plugins.iconPlugin = { icons: savedIcons }
    } catch (e) {
      console.warn('Error parsing saved icons:', e)
    }
  }

  return baseOptions
})

const previewOptions = computed(() => {
  const isCircular = ['pie'].includes(selectedChartType.value)
  const isStacked = selectedChartType.value === 'stackedArea'

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: !!chartTitle.value,
        text: chartTitle.value,
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      legend: {
        display: true,
        position: isCircular ? ('bottom' as const) : ('top' as const)
      }
    },
    scales: isCircular ? {} : {
      x: {
        display: true,
        title: {
          display: !!xAxisLabel.value,
          text: xAxisLabel.value
        },
        grid: {
          display: showGridX.value
        },
        stacked: isStacked
      },
      y: {
        display: true,
        title: {
          display: !!yAxisLabel.value,
          text: yAxisLabel.value
        },
        grid: {
          display: showGridY.value
        },
        min: yMin.value,
        max: yMax.value,
        stacked: isStacked
      }
    },
    elements: ['line', 'stackedArea'].includes(selectedChartType.value) ? {
      point: {
        radius: showPoints.value ? 4 : 0,
        hoverRadius: 6,
        hitRadius: 8
      },
      line: {
        borderWidth: 3,
        tension: 0.1,
        fill: selectedChartType.value === 'stackedArea' ? 'origin' : false
      }
    } : undefined,
    interaction: ['line', 'stackedArea'].includes(selectedChartType.value) ? {
      intersect: false,
      mode: 'index'
    } : undefined
  } as any

  // Add icon plugin for pie charts with preview icons
  if (selectedChartType.value === 'pie' && Object.keys(selectedIcons.value).length > 0) {
    if (!baseOptions.plugins) baseOptions.plugins = {}
    baseOptions.plugins.iconPlugin = { icons: selectedIcons.value }
  }

  return baseOptions
})

// Methods
const setDatasetColor = (datasetIndex: number, color: string) => {
  selectedColors.value[datasetIndex] = color
}

// Drag and drop methods
const startDrag = (index: number, type: 'slice' | 'series') => {
  draggedIndex.value = index
  dragType.value = type
  dragOverIndex.value = null
  
  document.addEventListener('mousemove', handleDragMove)
  document.addEventListener('mouseup', handleDragEnd)
}

const handleDragMove = (event: MouseEvent) => {
  if (draggedIndex.value === null) return
  
  // Find the element under the cursor
  const elementBelow = document.elementFromPoint(event.clientX, event.clientY)
  const targetRow = elementBelow?.closest('[data-drag-target]')
  
  if (targetRow) {
    const targetIndex = parseInt(targetRow.getAttribute('data-drag-target') || '0')
    if (targetIndex !== draggedIndex.value) {
      dragOverIndex.value = targetIndex
    }
  } else {
    dragOverIndex.value = null
  }
}

const handleDragEnd = () => {
  if (draggedIndex.value !== null && dragOverIndex.value !== null && draggedIndex.value !== dragOverIndex.value) {
    reorderItems(draggedIndex.value, dragOverIndex.value)
  }
  
  draggedIndex.value = null
  dragType.value = null
  dragOverIndex.value = null
  document.removeEventListener('mousemove', handleDragMove)
  document.removeEventListener('mouseup', handleDragEnd)
}

const reorderItems = (fromIndex: number, toIndex: number) => {
  if (!chartData.value) return
  
  if (dragType.value === 'slice' && selectedChartType.value === 'pie') {
    // Reorder pie chart slices by updating the CSV data
    const result = parseCSVToChartData(props.node.attrs.csvData)
    if (!result.data) return
    
    const newLabels = [...result.data.labels]
    const newDatasets = result.data.datasets.map(dataset => ({
      ...dataset,
      data: [...dataset.data]
    }))
    
    // Move the items
    const [movedLabel] = newLabels.splice(fromIndex, 1)
    newLabels.splice(toIndex, 0, movedLabel)
    
    // Move data for all datasets
    newDatasets.forEach(dataset => {
      const [movedData] = dataset.data.splice(fromIndex, 1)
      dataset.data.splice(toIndex, 0, movedData)
    })
    
    // Convert back to CSV
    const headers = ['Label', ...newDatasets.map(d => d.label)]
    const rows = newLabels.map((label, index) => [
      label,
      ...newDatasets.map(dataset => dataset.data[index] || 0)
    ])
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    // Update the node attributes
    props.updateAttributes({
      csvData: csvContent
    })
    
    // Update colors mapping
    const newColors: Record<number, string> = {}
    Object.keys(selectedColors.value).forEach(key => {
      const oldIndex = parseInt(key)
      let newIndex = oldIndex
      
      if (oldIndex === fromIndex) {
        newIndex = toIndex
      } else if (fromIndex < toIndex && oldIndex > fromIndex && oldIndex <= toIndex) {
        newIndex = oldIndex - 1
      } else if (fromIndex > toIndex && oldIndex >= toIndex && oldIndex < fromIndex) {
        newIndex = oldIndex + 1
      }
      
      newColors[newIndex] = selectedColors.value[oldIndex]
    })
    selectedColors.value = newColors
    
  } else if (dragType.value === 'series' && selectedChartType.value === 'stackedArea') {
    // Reorder area chart series by updating the CSV data
    const result = parseCSVToChartData(props.node.attrs.csvData)
    if (!result.data) return
    
    const newDatasets = [...result.data.datasets]
    const [movedDataset] = newDatasets.splice(fromIndex, 1)
    newDatasets.splice(toIndex, 0, movedDataset)
    
    // Convert back to CSV
    const headers = ['Label', ...newDatasets.map(d => d.label)]
    const rows = result.data.labels.map((label, index) => [
      label,
      ...newDatasets.map(dataset => dataset.data[index] || 0)
    ])
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    // Update the node attributes
    props.updateAttributes({
      csvData: csvContent
    })
    
    // Update colors and series names mapping
    const newColors: Record<number, string> = {}
    const newSeriesNames: Record<number, string> = {}
    
    Object.keys(selectedColors.value).forEach(key => {
      const oldIndex = parseInt(key)
      let newIndex = oldIndex
      
      if (oldIndex === fromIndex) {
        newIndex = toIndex
      } else if (fromIndex < toIndex && oldIndex > fromIndex && oldIndex <= toIndex) {
        newIndex = oldIndex - 1
      } else if (fromIndex > toIndex && oldIndex >= toIndex && oldIndex < fromIndex) {
        newIndex = oldIndex + 1
      }
      
      newColors[newIndex] = selectedColors.value[oldIndex]
      if (seriesNames.value[oldIndex]) {
        newSeriesNames[newIndex] = seriesNames.value[oldIndex]
      }
    })
    
    selectedColors.value = newColors
    seriesNames.value = newSeriesNames
  }
}

const deleteSlice = (index: number) => {
  if (!chartData.value || chartData.value.labels.length <= 1) return
  
  // Parse the current CSV data
  const result = parseCSVToChartData(props.node.attrs.csvData)
  if (!result.data) return
  
  // Remove label and data at the specified index
  const newLabels = [...result.data.labels]
  const newDatasets = result.data.datasets.map(dataset => ({
    ...dataset,
    data: [...dataset.data]
  }))
  
  newLabels.splice(index, 1)
  newDatasets.forEach(dataset => {
    dataset.data.splice(index, 1)
  })
  
  // Convert back to CSV
  const headers = ['Label', ...newDatasets.map(d => d.label)]
  const rows = newLabels.map((label, labelIndex) => [
    label,
    ...newDatasets.map(dataset => dataset.data[labelIndex] || 0)
  ])
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
  
  // Update the node attributes
  props.updateAttributes({
    csvData: csvContent
  })
  
  // Update colors mapping
  const newColors: Record<number, string> = {}
  Object.keys(selectedColors.value).forEach(key => {
    const oldIndex = parseInt(key)
    if (oldIndex < index) {
      newColors[oldIndex] = selectedColors.value[oldIndex]
    } else if (oldIndex > index) {
      newColors[oldIndex - 1] = selectedColors.value[oldIndex]
    }
  })
  selectedColors.value = newColors
}

const deleteSeries = (index: number) => {
  if (!chartData.value || chartData.value.datasets.length <= 1) return
  
  // Parse the current CSV data
  const result = parseCSVToChartData(props.node.attrs.csvData)
  if (!result.data) return
  
  // Remove dataset at the specified index
  const newDatasets = [...result.data.datasets]
  newDatasets.splice(index, 1)
  
  // Convert back to CSV
  const headers = ['Label', ...newDatasets.map(d => d.label)]
  const rows = result.data.labels.map((label, labelIndex) => [
    label,
    ...newDatasets.map(dataset => dataset.data[labelIndex] || 0)
  ])
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
  
  // Update the node attributes
  props.updateAttributes({
    csvData: csvContent
  })
  
  // Update series names mapping
  const newSeriesNames: Record<number, string> = {}
  Object.keys(seriesNames.value).forEach(key => {
    const oldIndex = parseInt(key)
    if (oldIndex < index) {
      newSeriesNames[oldIndex] = seriesNames.value[oldIndex]
    } else if (oldIndex > index) {
      newSeriesNames[oldIndex - 1] = seriesNames.value[oldIndex]
    }
  })
  seriesNames.value = newSeriesNames
  
  // Update colors mapping
  const newColors: Record<number, string> = {}
  Object.keys(selectedColors.value).forEach(key => {
    const oldIndex = parseInt(key)
    if (oldIndex < index) {
      newColors[oldIndex] = selectedColors.value[oldIndex]
    } else if (oldIndex > index) {
      newColors[oldIndex - 1] = selectedColors.value[oldIndex]
    }
  })
  selectedColors.value = newColors
}

const saveChart = () => {
  // Prepare colors and options
  const colorsToSave = Object.keys(selectedColors.value).length > 0
    ? JSON.stringify(selectedColors.value)
    : ''
  const iconsToSave = Object.keys(selectedIcons.value).length > 0
    ? JSON.stringify(selectedIcons.value)
    : ''
  const opts: Record<string, any> = {
    gridX: showGridX.value,
    gridY: showGridY.value,
    yMin: yMin.value,
    yMax: yMax.value,
    showPoints: showPoints.value
  }
  props.updateAttributes({
    chartType: selectedChartType.value,
    title: chartTitle.value,
    xLabel: xAxisLabel.value,
    yLabel: yAxisLabel.value,
    colors: colorsToSave,
    options: JSON.stringify(opts),
    seriesNames: JSON.stringify(seriesNames.value),
    icons: iconsToSave
  })

  showEditor.value = false
}

const deleteChart = () => {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce graphique ?')) {
    props.deleteNode()
  }
}

// Initialize form when opening editor
watch(showEditor, (isOpen) => {
  if (isOpen && props.node.attrs.csvData) {
    activeTab.value = 'general'
    selectedChartType.value = props.node.attrs.chartType
    chartTitle.value = props.node.attrs.title
    xAxisLabel.value = props.node.attrs.xLabel
    yAxisLabel.value = props.node.attrs.yLabel

    // Load saved colors
    if (props.node.attrs.colors) {
      try {
        selectedColors.value = JSON.parse(props.node.attrs.colors)
      } catch (e) {
        console.warn('Error parsing saved colors:', e)
        selectedColors.value = {}
      }
    } else {
      selectedColors.value = {}
    }

    // For pie charts, initialize colors if none are set
    if (selectedChartType.value === 'pie' && Object.keys(selectedColors.value).length === 0 && chartData.value) {
      chartData.value.labels.forEach((_, index) => {
        selectedColors.value[index] = CHART_COLORS[index % CHART_COLORS.length]
      })
    }

    // Load config options
    try {
      const opts = JSON.parse(props.node.attrs.options || '{}')
      showGridX.value = opts.gridX !== false
      showGridY.value = opts.gridY !== false
      // Legacy support for general grid option
      if (opts.grid !== undefined) {
        showGridX.value = opts.grid
        showGridY.value = opts.grid
      }
      yMin.value = opts.yMin ?? null
      yMax.value = opts.yMax ?? null
      showPoints.value = opts.showPoints !== false
    } catch { }

    // Load series names
    try {
      seriesNames.value = JSON.parse(props.node.attrs.seriesNames || '{}')
    } catch { }

    // Load saved icons
    if (props.node.attrs.icons) {
      try {
        selectedIcons.value = JSON.parse(props.node.attrs.icons)
      } catch (e) {
        console.warn('Error parsing saved icons:', e)
        selectedIcons.value = {}
      }
    } else {
      selectedIcons.value = {}
    }
  }
})

// Watch for chart type changes to switch away from options tab for pie charts
watch(selectedChartType, (newType) => {
  if (newType === 'pie' && activeTab.value === 'options') {
    activeTab.value = 'general'
  }
})

// Watch for icon changes to preload them
watch(selectedIcons, async (newIcons) => {
  if (selectedChartType.value === 'pie' && Object.keys(newIcons).length > 0) {
    // Preload icons when they change
    const iconPromises = Object.values(newIcons).map((iconName: string) => {
      if (iconName) {
        return loadIconImage(iconName.replace('mingcute:', ''))
      }
      return Promise.resolve(null)
    })
    await Promise.all(iconPromises)
  }
}, { deep: true })

// Initialize colors on mount if chart has data
onMounted(() => {
  if (props.node.attrs.colors) {
    try {
      selectedColors.value = JSON.parse(props.node.attrs.colors)
    } catch (e) {
      console.warn('Error parsing saved colors:', e)
      selectedColors.value = {}
    }
  }
})
</script>

<style scoped>
.chart-node-wrapper {
  margin: 1rem 0;
}

.chart-container {
  background: #fff;
  position: relative;
  z-index: 1;
}

.chart-display canvas {
  max-height: 400px !important;
}

:deep(.chart-container canvas) {
  border-radius: 0.375rem;
}
</style>
