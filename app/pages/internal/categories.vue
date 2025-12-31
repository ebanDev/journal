<template>
  <div class="container max-w-3xl mx-auto py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Gestion des catégories</h1>
      <UButton icon="tabler-plus" @click="openAddModal" label="Ajouter" />
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div v-for="cat in categories" :key="cat.id" class="bg-white rounded-lg shadow flex flex-col gap-2">
        <img v-if="cat.cover" :src="cat.cover" class="w-full h-48 rounded-t-lg object-cover" :alt="cat.name" />
        <div class="flex items-center gap-2 px-4 py-2">
          <Icon v-if="cat.icon" :name="'mingcute:' + cat.icon" class="text-xl" />
          <span class="font-bold text-lg">{{ cat.name }}</span>
        </div>
        <div class="flex gap-2 px-4 pb-4">
          <UButton icon="tabler-edit" size="sm" @click="editCategory(cat)" label="Modifier" />
        </div>
      </div>
    </div>
    <UModal v-model:open="modalOpen" title="Catégorie" :loading="submitting">
      <template #body>
        <UFormField label="Nom" class="mb-2">
          <UInput v-model="form.name" placeholder="Nom de la catégorie" />
        </UFormField>
        <UFormField label="Icone" class="mb-2">
          <IconPicker v-model="form.icon" placeholder="Choisir une icone" />
        </UFormField>
        <UFormField label="Image de couverture" class="mb-2">
          <div class="flex gap-2">
            <UInput v-model="form.cover" placeholder="https://..." class="flex-1" />
            <UButton 
              icon="i-tabler-upload" 
              size="sm" 
              color="secondary"
              @click="triggerFileUpload"
              :loading="uploading"
            />
          </div>
          <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleFileUpload" />
        </UFormField>
        <img v-if="form.cover" :src="form.cover" class="w-24 h-12 rounded object-cover mt-2" />
      </template>
      <template #footer>
        <UButton label="Enregistrer" @click="saveCategory" :loading="submitting" />
        <UButton v-if="editingId" label="Supprimer" color="error" variant="soft" icon="tabler-trash" @click="deleteCategory" :loading="deleting" />
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useSupabaseClient, useToast } from '#imports'
import IconPicker from '~/components/IconPicker.vue'
import type { Tables } from '~/types/database.types'

const client = useSupabaseClient()
const toast = useToast()
const categories = ref<Tables<'categories'>[]>([])
const modalOpen = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const uploading = ref(false)
const fileInput = ref<HTMLInputElement>()
const form = reactive({ name: '', icon: '', cover: '' })
const editingId = ref<string | null>(null)

async function fetchCategories() {
  const { data } = await client.from('categories').select('*').order('name')
  categories.value = data || []
}

function openAddModal() {
  editingId.value = null
  form.name = ''
  form.icon = ''
  form.cover = ''
  modalOpen.value = true
}

function editCategory(cat: Tables<'categories'>) {
  editingId.value = cat.id || null
  form.name = cat.name
  form.icon = cat.icon || ''
  form.cover = cat.cover || ''
  modalOpen.value = true
}

async function saveCategory() {
  submitting.value = true
  try {
    if (editingId.value) {
      const { error } = await client.from('categories').update({ name: form.name, icon: form.icon, cover: form.cover }).eq('id', editingId.value)
      if (error) throw error
      
      toast.add({
        title: 'Catégorie modifiée',
        color: 'success',
        icon: 'tabler-check',
        description: 'La catégorie a été modifiée avec succès.'
      })
    } else {
      const { error } = await client.from('categories').insert({ name: form.name, icon: form.icon, cover: form.cover })
      if (error) throw error
      
      toast.add({
        title: 'Catégorie créée',
        color: 'success',
        icon: 'tabler-check',
        description: 'La catégorie a été créée avec succès.'
      })
    }
    
    modalOpen.value = false
    await fetchCategories()
  } catch (error: any) {
    console.error('Error saving category:', error)
    toast.add({
      title: 'Erreur',
      color: 'error',
      icon: 'tabler-x',
      description: error.message || 'Une erreur est survenue lors de la sauvegarde de la catégorie.'
    })
  } finally {
    submitting.value = false
  }
}

async function deleteCategory() {
  if (!editingId.value) return
  const confirmed = window.confirm('Supprimer cette catégorie ?')
  if (!confirmed) return

  const idToDelete = editingId.value
  const previousCategories = [...categories.value]
  deleting.value = true
  modalOpen.value = false
  editingId.value = null
  categories.value = categories.value.filter((cat) => cat.id !== idToDelete)

  try {
    const { error } = await client.from('categories').delete().eq('id', idToDelete)
    if (error) throw error

    toast.add({
      title: 'Catégorie supprimée',
      color: 'success',
      icon: 'tabler-check',
      description: 'La catégorie a été supprimée avec succès.'
    })
  } catch (error: any) {
    categories.value = previousCategories
    console.error('Error deleting category:', error)
    toast.add({
      title: 'Erreur',
      color: 'error',
      icon: 'tabler-x',
      description: error.message || 'Une erreur est survenue lors de la suppression de la catégorie.'
    })
  } finally {
    deleting.value = false
  }
}

const triggerFileUpload = () => {
  fileInput.value?.click()
}

const handleFileUpload = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  uploading.value = true
  try {
    // Generate a unique filename to avoid conflicts
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const fileName = `category-${timestamp}.${fileExt}`
    
    const { data, error } = await client.storage.from('covers').upload(`public/${fileName}`, file)
    if (error) {
      toast.add({ 
        title: "Le téléchargement de l'image a échoué", 
        color: 'error', 
        icon: 'tabler-x', 
        description: error.message 
      })
      return
    }

    const { data: coverData } = client.storage.from('covers').getPublicUrl(data.path)
    form.cover = coverData.publicUrl
    
    toast.add({
      title: 'Image téléchargée',
      color: 'success',
      icon: 'tabler-check',
      description: 'L\'image a été téléchargée avec succès.'
    })
  } catch (error: any) {
    console.error('Error uploading image:', error)
    toast.add({
      title: 'Erreur',
      color: 'error',
      icon: 'tabler-x',
      description: 'Une erreur est survenue lors du téléchargement de l\'image.'
    })
  } finally {
    uploading.value = false
  }
}

onMounted(fetchCategories)
</script>
