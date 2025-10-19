<template>
  <div class="min-h-screen flex items-center justify-center py-8">
    <div class="max-w-2xl w-full mx-auto px-4">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Créer un nouvel article</h1>
        <p class="text-gray-600">Choisissez comment vous souhaitez créer votre article</p>
      </div>

      <!-- Two Main Options -->
      <div v-if="!isProcessing && !isCreating" class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <!-- Blank Page Option -->
        <UCard class="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-primary-500" @click="createBlankArticle">
          <div class="text-center py-8">
            <div class="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
              <UIcon name="i-tabler-file-plus" class="w-8 h-8 text-primary-600" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Page Vide</h3>
            <p class="text-gray-600 mb-4">Commencer avec un article vierge et écrire le contenu depuis zéro</p>
          </div>
        </UCard>

        <!-- Upload Document Option -->
        <UCard class="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-secondary-500" @click="triggerFileUpload">
          <div class="text-center py-8">
            <div class="w-16 h-16 mx-auto mb-4 bg-secondary-100 rounded-full flex items-center justify-center">
              <UIcon name="i-tabler-upload" class="w-8 h-8 text-secondary-600" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Importer un document existant</h3>
            <p class="text-gray-600 mb-4">Importer un document LibreOffice, Word ou Markdown existant</p>
          </div>
        </UCard>
      </div>

      <!-- Processing State -->
      <div v-if="isProcessing" class="max-w-md mx-auto">
        <UCard>
          <div class="text-center py-8">
            <div class="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <UIcon name="i-tabler-loader-2" class="w-8 h-8 text-blue-500 animate-spin" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Traitement du document</h3>
            <p class="text-gray-600 mb-4">Extraction et conversion du contenu en cours...</p>
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p class="text-blue-700 text-sm">{{ uploadedFile?.name }}</p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Error State -->
      <div v-if="error && !isProcessing" class="max-w-md mx-auto">
        <UCard>
          <div class="text-center py-8">
            <div class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <UIcon name="i-tabler-alert-circle" class="w-8 h-8 text-red-500" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Erreur de traitement</h3>
            <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p class="text-red-700 text-sm">{{ error }}</p>
            </div>
            <UButton @click="resetForm" variant="outline">
              Réessayer
            </UButton>
          </div>
        </UCard>
      </div>

      <!-- Hidden file input -->
      <input
        ref="fileInput"
        type="file"
        accept=".odt,.docx,.md"
        @change="handleFileUpload"
        class="hidden"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSupabaseUser, useToast } from '#imports'
import { useDb } from '~/composables/useDb'
import { useDocumentProcessor } from '~/composables/useDocumentProcessor'

const user = useSupabaseUser()
const router = useRouter()
const route = useRoute()
const toast = useToast()
const { createNewArticle } = useDb()
const { processDocument, isProcessing, error } = useDocumentProcessor()

const editionId = route.query.issue as string | undefined
const isCreating = ref(false)
const uploadedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement>()

const formState = reactive({
  title: '',
  content: ''
})

const createBlankArticle = async () => {
  if (!user.value) {
    await router.push('/login')
    return
  }
  
  isCreating.value = true
  try {
    const article = await createNewArticle({
      title: '',
      content: '',
      author_id: user.value.id,
      issue_id: editionId,
    })
    
    toast.add({
      title: 'Article créé',
      color: 'success',
      icon: 'i-tabler-check',
      description: 'Article vierge créé avec succès.'
    })
    
    await router.replace(`/internal/articles/${article.id}`)
  } catch (error) {
    console.error(error)
    toast.add({
      title: 'Erreur',
      color: 'error',
      icon: 'i-tabler-x',
      description: 'Une erreur est survenue lors de la création de l\'article.'
    })
  } finally {
    isCreating.value = false
  }
}

const triggerFileUpload = () => {
  fileInput.value?.click()
}

const handleFileUpload = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  uploadedFile.value = file
  
  const result = await processDocument(file)
  if (result) {
    formState.title = result.title || file.name.replace(/\.[^/.]+$/, '')
    formState.content = result.content
    
    // Automatically create the article after successful processing
    await createArticle()
  }
}

const createArticle = async () => {
  if (!user.value) {
    await router.push('/login')
    return
  }
  
  isCreating.value = true
  try {
    const article = await createNewArticle({
      title: formState.title,
      content: formState.content,
      author_id: user.value.id,
      issue_id: editionId,
    })
    
    toast.add({
      title: 'Article créé',
      color: 'success',
      icon: 'i-tabler-check',
      description: 'L\'article a été créé avec succès.'
    })
    
    await router.replace(`/internal/articles/${article.id}`)
  } catch (error) {
    console.error(error)
    toast.add({
      title: 'Erreur',
      color: 'error',
      icon: 'i-tabler-x',
      description: 'Une erreur est survenue lors de la création de l\'article.'
    })
  } finally {
    isCreating.value = false
  }
}

const resetForm = () => {
  uploadedFile.value = null
  formState.title = ''
  formState.content = ''
  // Clear the file input
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Redirect to login if not authenticated
onMounted(async () => {
  if (!user.value) {
    await router.push('/login')
  }
})
</script>
