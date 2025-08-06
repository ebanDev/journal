import Papa from 'papaparse'

export interface ChartDataset {
  label: string
  data: number[]
  backgroundColor: string | string[]
  borderColor: string | string[]
}

export interface ChartData {
  labels: string[]
  datasets: ChartDataset[]
}

export interface ParsedCSVResult {
  data: ChartData | null
  error: string | null
}

// Pre-defined color palette for charts
export const CHART_COLORS = [
  '#000000',    // Black
  '#333333',    // Dark gray
  '#666666',    // Medium gray
  '#7a1618',    // Dark red
  '#b8140b',    // Mredium red
  '#f28c8c',    // Light red
]

// Sample CSV templates for users
export const CSV_TEMPLATES = {
  sales: {
    name: 'Données de ventes',
    description: 'Ventes mensuelles par produit',
    data: `Mois,Produit A,Produit B,Produit C
Janvier,120,80,65
Février,140,90,70
Mars,110,85,80
Avril,130,95,75
Mai,150,100,85
Juin,165,110,90`
  },
  
  survey: {
    name: 'Résultats d\'enquête',
    description: 'Satisfaction par catégorie',
    data: `Catégorie,Très satisfait,Satisfait,Neutre,Insatisfait
Service client,45,30,15,10
Qualité produit,50,35,10,5
Livraison,40,40,15,5
Prix,25,45,20,10`
  },
  
  budget: {
    name: 'Répartition budget',
    description: 'Budget par département',
    data: `Département,Budget 2024
Marketing,250000
Développement,400000
Ventes,180000
Support,120000
RH,150000`
  },
  
  performance: {
    name: 'Performance équipe',
    description: 'Indicateurs trimestriels',
    data: `Trimestre,Objectifs atteints,Revenus,Satisfaction client
Q1 2024,85,1200000,4.2
Q2 2024,92,1350000,4.5
Q3 2024,88,1280000,4.3
Q4 2024,95,1480000,4.7`
  }
}

/**
 * Parse CSV data and convert to Chart.js format
 */
export function parseCSVToChartData(csvData: string): ParsedCSVResult {
  try {
    const result = Papa.parse(csvData.trim(), {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    })
    
    if (result.errors.length > 0) {
      return {
        data: null,
        error: `Erreur CSV: ${result.errors.map(e => e.message).join(', ')}`
      }
    }
    
    if (result.data.length === 0) {
      return {
        data: null,
        error: 'Aucune donnée trouvée dans le CSV'
      }
    }
    
    const data = result.data as any[]
    const headers = Object.keys(data[0])
    
    if (headers.length < 2) {
      return {
        data: null,
        error: 'Le CSV doit contenir au moins 2 colonnes (labels + données)'
      }
    }
    
    const labelColumn = headers[0]
    const dataColumns = headers.slice(1)
    
    // Extract labels
    const labels = data.map(row => String(row[labelColumn] || ''))
    
    // Create datasets
    const datasets: ChartDataset[] = dataColumns.map((column, index) => ({
      label: column,
      data: data.map(row => {
        const value = row[column]
        return typeof value === 'number' ? value : parseFloat(value) || 0
      }),
      backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
      borderColor: CHART_COLORS[index % CHART_COLORS.length],
    }))
    
    return {
      data: {
        labels,
        datasets
      },
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error: `Erreur de parsing: ${(error as Error).message}`
    }
  }
}

/**
 * Format chart data specifically for pie charts with multiple colors per slice
 */
export function formatPieChartData(chartData: ChartData): ChartData {
  if (!chartData.datasets || chartData.datasets.length === 0) return chartData
  
  // For pie charts, we want each slice to have a different color
  // Take the first dataset and assign different colors to each data point
  const firstDataset = chartData.datasets[0]
  
  return {
    labels: chartData.labels,
    datasets: [{
      ...firstDataset,
      backgroundColor: chartData.labels.map((_, index) => CHART_COLORS[index % CHART_COLORS.length]),
      borderColor: chartData.labels.map((_, index) => CHART_COLORS[index % CHART_COLORS.length])
    }]
  }
}

/**
 * Validate CSV file before processing
 */
export function validateCSVFile(file: File): { valid: boolean; error?: string } {
  // Check file size (max 1MB)
  if (file.size > 1024 * 1024) {
    return {
      valid: false,
      error: 'Le fichier CSV ne doit pas dépasser 1MB'
    }
  }
  
  // Check file type
  if (file.type && !file.type.includes('csv') && !file.name.endsWith('.csv')) {
    return {
      valid: false,
      error: 'Le fichier doit être au format CSV'
    }
  }
  
  return { valid: true }
}

/**
 * Generate chart options based on chart type and configuration
 */
export function generateChartOptions(
  chartType: string,
  title?: string,
  xLabel?: string,
  yLabel?: string,
  customOptions: Record<string, any> = {}
) {
  const isCircular = ['pie', 'doughnut'].includes(chartType)
  const isStacked = chartType === 'stackedArea'
  
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: !!title,
        text: title,
        color: '#111',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        padding: {
          bottom: 20
        }
      },
      legend: {
        display: true,
        position: isCircular ? ('right' as const) : ('top' as const),
        labels: {
          padding: 20,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1
      }
    },
    scales: isCircular ? {} : {
      x: {
        display: true,
        title: {
          display: !!xLabel,
          text: xLabel,
          font: {
            weight: 'bold'
          }
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        stacked: isStacked
      },
      y: {
        display: true,
        title: {
          display: !!yLabel,
          text: yLabel,
          font: {
            weight: 'bold'
          }
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        beginAtZero: true,
        stacked: isStacked
      }
    }
  }
  
  // Use opts alias for custom options
  const opts = customOptions || {}
  // Apply custom grid display if requested
  if (opts.gridX === false && !isCircular) {
    ;(baseOptions.scales as any).x.grid.display = false
  }
  if (opts.gridY === false && !isCircular) {
    ;(baseOptions.scales as any).y.grid.display = false
  }
  // Legacy support for general grid option
  if (opts.grid === false && !isCircular) {
    ;(baseOptions.scales as any).x.grid.display = false
    ;(baseOptions.scales as any).y.grid.display = false
  }
  // Apply custom Y axis limits (only for non-circular charts)
  if (opts.yMin !== undefined && !isCircular) {
    ;(baseOptions.scales as any).y.min = opts.yMin
  }
  if (opts.yMax !== undefined && !isCircular) {
    ;(baseOptions.scales as any).y.max = opts.yMax
  }
  // Apply point display for line charts
  if (chartType === 'line' || chartType === 'stackedArea') {
    ;(baseOptions as any).elements = {
      point: {
        radius: opts.showPoints === false ? 0 : 4,
        hoverRadius: 6,
        hitRadius: 8
      },
      line: {
        borderWidth: 3,
        tension: 0.1,
        fill: chartType === 'stackedArea' ? 'origin' : false
      }
    }
    // Make tooltips work even when points are hidden
    ;(baseOptions as any).interaction = {
      intersect: false,
      mode: 'index'
    }
  }
  // Merge with other custom options, excluding our special keys
  const merged = {
    ...baseOptions,
    ...Object.fromEntries(
      Object.entries(opts).filter(
        ([key]) => !['grid','gridX','gridY','yMin','yMax','showPoints'].includes(key)
      )
    )
  }
  return merged
}

/**
 * Export chart data as CSV
 */
export function exportChartDataAsCSV(chartData: ChartData, filename: string = 'chart-data.csv'): void {
  if (!chartData.labels || !chartData.datasets) {
    throw new Error('Invalid chart data')
  }
  
  // Create CSV header
  const headers = ['Label', ...chartData.datasets.map(d => d.label)]
  
  // Create CSV rows
  const rows = chartData.labels.map((label, index) => [
    label,
    ...chartData.datasets.map(dataset => dataset.data[index] || 0)
  ])
  
  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
  
  // Download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

/**
 * Get chart type information
 */
export function getChartTypeInfo(chartType: string) {
  const chartTypes = {
    bar: {
      label: 'Barres',
      description: 'Idéal pour comparer des valeurs entre différentes catégories',
      icon: 'i-mingcute-chart-bar-line',
      supportsMultipleDatasets: true
    },
    line: {
      label: 'Ligne',
      description: 'Parfait pour montrer l\'évolution dans le temps',
      icon: 'i-mingcute-chart-line-line',
      supportsMultipleDatasets: true
    },
    pie: {
      label: 'Secteurs',
      description: 'Excellent pour afficher des proportions d\'un total',
      icon: 'i-mingcute-chart-pie-line',
      supportsMultipleDatasets: false
    },
    stackedArea: {
      label: 'Aires Empilées',
      description: 'Idéal pour montrer l\'évolution cumulée dans le temps avec zones remplies',
      icon: 'i-mingcute-chart-line-line',
      supportsMultipleDatasets: true
    }
  }
  
  return (chartTypes as Record<string, typeof chartTypes.bar>)[chartType] || chartTypes.bar
}

export const useChart = () => {
  return {
    parseCSVToChartData,
    formatPieChartData,
    validateCSVFile,
    generateChartOptions,
    exportChartDataAsCSV,
    getChartTypeInfo,
    CSV_TEMPLATES,
    CHART_COLORS
  }
}
