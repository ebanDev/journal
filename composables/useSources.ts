export interface Source {
  id: string
  title: string
  url?: string
  author?: string
  type: 'website' | 'book' | 'article' | 'other'
  description?: string
  accessed?: string // Date when source was accessed
}

export interface SourceReference {
  sourceId: string
  page?: string
  note?: string
}

export const useSources = () => {
  const sources = ref<Source[]>([])

  // Generate a unique ID for a new source
  const generateSourceId = (): string => {
    return `source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Add a new source
  const addSource = (sourceData: Omit<Source, 'id'>): Source => {
    const newSource: Source = {
      ...sourceData,
      id: generateSourceId()
    }
    sources.value.push(newSource)
    return newSource
  }

  // Remove a source
  const removeSource = (sourceId: string): void => {
    const index = sources.value.findIndex(s => s.id === sourceId)
    if (index > -1) {
      sources.value.splice(index, 1)
    }
  }

  // Update an existing source
  const updateSource = (sourceId: string, updates: Partial<Omit<Source, 'id'>>): void => {
    const source = sources.value.find(s => s.id === sourceId)
    if (source) {
      Object.assign(source, updates)
    }
  }

  // Get a source by ID
  const getSource = (sourceId: string): Source | undefined => {
    return sources.value.find(s => s.id === sourceId)
  }

  // Get the citation number for a source (1-based index)
  const getSourceCitationNumber = (sourceId: string): number => {
    const index = sources.value.findIndex(s => s.id === sourceId)
    return index === -1 ? 0 : index + 1
  }

  // Generate citation marker for insertion into text
  const generateCitationMarker = (sourceId: string, reference?: SourceReference): string => {
    const number = getSourceCitationNumber(sourceId)
    if (number === 0) return ''
    
    let marker = `^${number}`
    if (reference?.page) {
      marker += `:${reference.page}`
    }
    return marker
  }

  // Parse sources from JSON format (for loading from database)
  const loadSources = (sourcesJson: any[]): void => {
    console.log('loadSources called with:', sourcesJson)
    if (Array.isArray(sourcesJson)) {
      // Clear existing sources first
      sources.value = []
      // Add new sources
      sources.value = sourcesJson.filter(s => s && typeof s === 'object' && s.id)
      console.log('Sources loaded, current sources:', sources.value)
    } else {
      console.warn('loadSources called with non-array:', sourcesJson)
    }
  }

  // Export sources to JSON format (for saving to database)
  const exportSources = (): Source[] => {
    return sources.value
  }

  // Clear all sources
  const clearSources = (): void => {
    sources.value = []
  }

  // Format a source for display in references list
  const formatSourceCitation = (source: Source): string => {
    const parts: string[] = []
    
    if (source.author) {
      parts.push(source.author)
    }
    
    if (source.title) {
      parts.push(`"${source.title}"`)
    }
    
    if (source.url) {
      try {
        const domain = new URL(source.url).hostname
        parts.push(domain)
      } catch {
        parts.push(source.url)
      }
    }
    
    if (source.accessed) {
      parts.push(`Consulté le ${new Date(source.accessed).toLocaleDateString('fr-FR')}`)
    }
    
    return parts.join(', ')
  }

  return {
    sources: readonly(sources),
    addSource,
    removeSource,
    updateSource,
    getSource,
    getSourceCitationNumber,
    generateCitationMarker,
    loadSources,
    exportSources,
    clearSources,
    formatSourceCitation
  }
}
