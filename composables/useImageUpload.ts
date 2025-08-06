import { ref, readonly } from 'vue'
import { useSupabaseClient, useToast } from '#imports'

export interface ImageUploadOptions {
  bucket?: string
  folder?: string
  maxSizeBytes?: number
  allowedTypes?: string[]
}

export const useImageUpload = (options: ImageUploadOptions = {}) => {
  const supabase = useSupabaseClient()
  const toast = useToast()
  
  const {
    bucket = 'covers',
    folder = 'articles',
    maxSizeBytes = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']
  } = options

  const isUploading = ref(false)
  const uploadProgress = ref(0)

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Type de fichier non supporté. Types autorisés: ${allowedTypes.join(', ')}`
      }
    }

    if (file.size > maxSizeBytes) {
      const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024))
      return {
        valid: false,
        error: `Fichier trop volumineux. Taille maximale: ${maxSizeMB}MB`
      }
    }

    return { valid: true }
  }

  const generateUniqueFileName = (file: File): string => {
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const fileExt = file.name.split('.').pop()
    return `${folder}/${timestamp}-${randomString}.${fileExt}`
  }

  const uploadImage = async (file: File): Promise<string> => {
    const validation = validateFile(file)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    isUploading.value = true
    uploadProgress.value = 0

    try {
      const fileName = generateUniqueFileName(file)
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw new Error(error.message)
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      uploadProgress.value = 100
      
      toast.add({
        title: 'Image téléchargée',
        color: 'success',
        icon: 'i-tabler-check',
        description: 'L\'image a été téléchargée avec succès.'
      })

      return publicUrlData.publicUrl
    } catch (error: any) {
      console.error('Image upload failed:', error)
      
      toast.add({
        title: 'Échec du téléchargement',
        color: 'error',
        icon: 'i-tabler-x',
        description: error.message || 'Une erreur est survenue lors du téléchargement de l\'image.'
      })
      
      throw error
    } finally {
      isUploading.value = false
      uploadProgress.value = 0
    }
  }

  const uploadMultipleImages = async (files: File[]): Promise<string[]> => {
    const results: string[] = []
    
    for (const file of files) {
      try {
        const url = await uploadImage(file)
        results.push(url)
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error)
        // Continue with other files even if one fails
      }
    }
    
    return results
  }

  return {
    isUploading: readonly(isUploading),
    uploadProgress: readonly(uploadProgress),
    uploadImage,
    uploadMultipleImages,
    validateFile
  }
}
