<template>
  <div
    v-if="show"
    class="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg w-96 max-h-[90vh] overflow-y-auto"
    :style="{ left: position.x + 'px', top: position.y + 'px' }"
  >
    <div class="space-y-4 p-4">
      <div class="flex justify-between items-center">
        <h3 class="font-semibold text-gray-900">Insérer un graphique</h3>
        <UButton
          size="xs"
          variant="ghost"
          color="neutral"
          icon="i-mingcute-close-line"
          @click="$emit('cancel')"
        />
      </div>

      <!-- Quick Chart Types -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Type de graphique</label>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="type in chartTypes"
            :key="type.value"
            type="button"
            class="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:border-amber-300 hover:bg-amber-50 transition-colors group"
            :class="{ 'border-amber-400 bg-amber-50': selectedChartType === type.value }"
            @click="selectChartType(type.value)"
          >
            <Icon :name="type.icon" class="text-xl text-gray-600 group-hover:text-amber-600 mb-1" />
            <span class="text-xs text-gray-700 group-hover:text-amber-700">{{ type.label }}</span>
          </button>
        </div>
      </div>

      <!-- CSV Data Source -->
      <div class="space-y-3">
        <label class="block text-sm font-medium text-gray-700">Source des données</label>
        
        <!-- Tab selector -->
        <div class="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            class="flex-1 px-3 py-1 text-sm font-medium rounded-md transition-colors"
            :class="dataSource === 'upload' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'"
            @click="dataSource = 'upload'"
          >
            Fichier
          </button>
          <button
            type="button"
            class="flex-1 px-3 py-1 text-sm font-medium rounded-md transition-colors"
            :class="dataSource === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'"
            @click="dataSource = 'manual'"
          >
            Manuel
          </button>
          <button
            type="button"
            class="flex-1 px-3 py-1 text-sm font-medium rounded-md transition-colors"
            :class="dataSource === 'template' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'"
            @click="dataSource = 'template'"
          >
            Modèle
          </button>
        </div>

        <!-- File Upload -->
        <div v-if="dataSource === 'upload'" class="space-y-3">
          <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
            <input
              ref="fileInput"
              type="file"
              accept=".csv"
              class="hidden"
              @change="handleFileUpload"
            />
            <Icon name="i-mingcute-file-upload-line" class="text-2xl text-gray-400 mb-2 mx-auto" />
            <p class="text-sm text-gray-600 mb-2">
              <button
                type="button"
                class="text-amber-600 hover:text-amber-800 font-medium"
                @click="triggerFileUpload"
              >
                Sélectionner un fichier CSV
              </button>
            </p>
            <p class="text-xs text-gray-500">
              Format: CSV avec en-têtes dans la première ligne
            </p>
          </div>
        </div>

        <!-- Manual Input -->
        <div v-if="dataSource === 'manual'" class="space-y-2">
          <UTextarea
            v-model="csvInput"
            :rows="6"
            placeholder="Mois,Ventes,Revenus&#10;Janvier,100,50000&#10;Février,120,60000&#10;Mars,90,45000"
            class="font-mono text-sm"
          />
          <p class="text-xs text-gray-500">
            Première ligne: en-têtes des colonnes. Lignes suivantes: données.
          </p>
        </div>

        <!-- Templates -->
        <div v-if="dataSource === 'template'" class="space-y-3">
          <div class="grid gap-2">
            <button
              v-for="(template, key) in CSV_TEMPLATES"
              :key="key"
              type="button"
              class="text-left p-3 border border-gray-200 rounded-lg hover:border-amber-300 hover:bg-amber-50 transition-colors"
              @click="loadTemplate(template.data)"
            >
              <div class="font-medium text-gray-900 text-sm">{{ template.name }}</div>
              <div class="text-xs text-gray-600 mt-1">{{ template.description }}</div>
            </button>
          </div>
        </div>
      </div>

      <!-- Chart Configuration -->
      <div class="space-y-3">
        <UInput
          v-model="chartTitle"
          placeholder="Titre du graphique (optionnel)"
          size="sm"
        />
      </div>

      <!-- Preview (if data is available) -->
      <div v-if="previewData && previewData.datasets.length > 0" class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Aperçu</label>
        <div class="border border-gray-200 rounded p-2" style="height: 180px;">
          <component 
            :is="previewChartComponent"
            :data="previewData"
            :options="previewOptions"
            class="max-w-full max-h-full"
          />
        </div>
        <p class="text-xs text-gray-500 text-center">
          {{ previewData.labels.length }} point(s) de données • {{ previewData.datasets.length }} série(s)
        </p>
      </div>

      <!-- Error Display -->
      <div v-if="csvError" class="rounded-md bg-red-50 p-3">
        <div class="flex">
          <Icon name="i-mingcute-warning-line" class="text-red-400 text-sm mr-2 mt-0.5 flex-shrink-0" />
          <p class="text-sm text-red-700">{{ csvError }}</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-2 pt-2 border-t border-gray-100 sticky bottom-0 bg-white">
        <UButton
          size="sm"
          variant="ghost"
          color="neutral"
          @click="$emit('cancel')"
        >
          Annuler
        </UButton>
        <UButton
          size="sm"
          variant="solid"
          color="primary"
          :disabled="!previewData || previewData.datasets.length === 0"
          @click="createChart"
        >
          Insérer
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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
  show: boolean
  position: { x: number; y: number }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  cancel: []
  'create-chart': [{
    csvData: string
    chartType: string
    title: string
  }]
}>()

const { parseCSVToChartData, formatPieChartData, CSV_TEMPLATES } = useChart()

// State
const selectedChartType = ref('bar')
const csvInput = ref('')
const chartTitle = ref('')
const csvError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const dataSource = ref<'upload' | 'manual' | 'template'>('upload')

// Chart types configuration
const chartTypes = [
  { value: 'bar', label: 'Barres', icon: 'i-mingcute-chart-bar-line' },
  { value: 'line', label: 'Ligne', icon: 'i-mingcute-chart-line-line' },
  { value: 'pie', label: 'Secteurs', icon: 'i-mingcute-chart-pie-line' },
  { value: 'stackedArea', label: 'Aires Empilées', icon: 'tdesign:chart-area-multi' }
]

// Chart components mapping
const chartComponents = {
  bar: Bar,
  line: Line,
  pie: Pie,
  stackedArea: Line
}

// Computed properties
const previewChartComponent = computed(() => {
  return chartComponents[selectedChartType.value as keyof typeof chartComponents] || Bar
})

const previewData = computed(() => {
  if (!csvInput.value.trim()) return null
  const result = parseCSVToChartData(csvInput.value)
  csvError.value = result.error || ''
  
  if (!result.data) return null
  
  // For pie charts, format with multiple colors per slice and only use first dataset
  if (selectedChartType.value === 'pie') {
    const pieData = formatPieChartData(result.data)
    return {
      labels: pieData.labels,
      datasets: [pieData.datasets[0]] // Only take the first dataset for pie charts
    }
  }
  
  // For other chart types with multiple datasets, keep all datasets
  return result.data
})

const previewOptions = computed(() => {
  const isCircular = ['pie'].includes(selectedChartType.value)
  const isStacked = selectedChartType.value === 'stackedArea'
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: !!chartTitle.value,
        text: chartTitle.value
      },
      legend: {
        display: true,
        position: isCircular ? ('bottom' as const) : ('top' as const),
        labels: {
          boxWidth: 12,
          fontSize: 10
        }
      }
    },
    scales: isCircular ? {} : {
      x: {
        display: true,
        ticks: {
          fontSize: 10
        },
        stacked: isStacked
      },
      y: {
        display: true,
        ticks: {
          fontSize: 10
        },
        stacked: isStacked
      }
    },
    elements: ['line', 'stackedArea'].includes(selectedChartType.value) ? {
      point: {
        radius: 2,
        hoverRadius: 4,
        hitRadius: 6
      },
      line: {
        borderWidth: 2,
        tension: 0.1,
        fill: selectedChartType.value === 'stackedArea' ? 'origin' : false
      }
    } : undefined,
    interaction: ['line', 'stackedArea'].includes(selectedChartType.value) ? {
      intersect: false,
      mode: 'index'
    } : undefined
  } as any
})

// Methods
const selectChartType = (type: string) => {
  selectedChartType.value = type
}

const triggerFileUpload = () => {
  fileInput.value?.click()
}

const handleFileUpload = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  
  try {
    const text = await file.text()
    csvInput.value = text
    dataSource.value = 'manual' // Switch to manual view to show the loaded data
  } catch (error) {
    csvError.value = `Erreur de lecture: ${(error as Error).message}`
  }
}

const loadTemplate = (templateData: string) => {
  csvInput.value = templateData
  dataSource.value = 'manual' // Switch to manual view to show the template
}

const createChart = () => {
  if (!previewData.value) return
  
  emit('create-chart', {
    csvData: csvInput.value,
    chartType: selectedChartType.value,
    title: chartTitle.value
  })
  
  // Reset form
  resetForm()
}

const resetForm = () => {
  csvInput.value = ''
  chartTitle.value = ''
  selectedChartType.value = 'bar'
  csvError.value = ''
  dataSource.value = 'manual'
}

// Reset form when popover is shown
watch(() => props.show, (isShown) => {
  if (isShown) {
    resetForm()
  }
})
</script>

<style scoped>
/* Custom styles for the popover */
</style>
