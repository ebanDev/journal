import { ref, readonly } from 'vue'
import { convertWithPandoc } from '~/utils/pandoc'

export const useDocumentProcessor = () => {
  const isProcessing = ref(false)
  const error = ref<string | null>(null)

  const processDocument = async (file: File): Promise<{ title: string; content: string } | null> => {
    isProcessing.value = true
    error.value = null

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      let htmlContent = ''
      let title = file.name.replace(/\.[^/.]+$/, '') // Remove file extension

      switch (fileExtension) {
        case 'odt':
          htmlContent = await processODT(file)
          break
        case 'docx':
          htmlContent = await processDOCX(file)
          break
        case 'md':
          htmlContent = await processMarkdown(file)
          break
        default:
          throw new Error(`Format de fichier non supporté: ${fileExtension}`)
      }

      // Extract title from first h1 if present
      const titleMatch = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/)
      if (titleMatch) {
        title = titleMatch[1].replace(/<[^>]*>/g, '') // Remove HTML tags
        // Remove the first h1 from content
        htmlContent = htmlContent.replace(/<h1[^>]*>.*?<\/h1>/, '')
      }

      return {
        title: title.trim(),
        content: htmlContent.trim()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors du traitement du document'
      return null
    } finally {
      isProcessing.value = false
    }
  }

  const processODT = async (file: File): Promise<string> => {
    try {
      // Read ODT as binary data
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      
      console.log('ODT file size:', uint8Array.length, 'bytes')
      
      // Convert to base64 using a more reliable method
      const base64 = arrayBufferToBase64(arrayBuffer)
      
      console.log('Base64 length:', base64.length)
      
      // Use pandoc to convert ODT to HTML
      const html = await convertWithPandoc('-f odt -t html', base64)
      return html
    } catch (err) {
      console.error('ODT processing error:', err)
      throw new Error('Erreur lors du traitement du fichier ODT')
    }
  }

  const processDOCX = async (file: File): Promise<string> => {
    try {
      // Read DOCX as binary data
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      
      console.log('DOCX file size:', uint8Array.length, 'bytes')
      
      // Convert to base64 using a more reliable method
      const base64 = arrayBufferToBase64(arrayBuffer)
      
      console.log('Base64 length:', base64.length)
      
      // Use pandoc to convert DOCX to HTML
      const html = await convertWithPandoc('-f docx -t html', base64)
      return html
    } catch (err) {
      console.error('DOCX processing error:', err)
      throw new Error('Erreur lors du traitement du fichier DOCX')
    }
  }

  const processMarkdown = async (file: File): Promise<string> => {
    try {
      const text = await file.text()
      // Use pandoc to convert Markdown to HTML
      const html = await convertWithPandoc('-f markdown -t html', text)
      return html
    } catch (err) {
      throw new Error('Erreur lors du traitement du fichier Markdown')
    }
  }

  return {
    processDocument,
    isProcessing: readonly(isProcessing),
    error: readonly(error)
  }
}

// Helper function to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const len = bytes.byteLength
  
  // Process in chunks to avoid stack overflow with large files
  const chunkSize = 32768 // 32KB chunks
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize)
    binary += String.fromCharCode.apply(null, Array.from(chunk))
  }
  
  return btoa(binary)
}
