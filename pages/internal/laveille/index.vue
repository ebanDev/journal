<template>
  <div class="container mx-auto py-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Soumissions La Veille</h1>
      <UBadge 
        v-if="submissions.length" 
        :color="submissions.length > 0 ? 'primary' : 'neutral'" 
        size="md" 
        variant="soft"
      >
        {{ submissions.length }} en attente
      </UBadge>
    </div>

    <div v-if="loading" class="space-y-4">
      <div class="h-6 w-1/3 mb-4 bg-gray-200 rounded animate-pulse" />
      <div class="space-y-4">
        <USkeleton class="h-40 w-full" v-for="i in 3" :key="i" />
      </div>
    </div>

    <div v-else-if="submissions.length" class="space-y-4">
      <UCard v-for="item in submissions" :key="item.id" class="hover:shadow-md transition-shadow">
        <template #header>
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <h2 class="text-lg font-semibold text-gray-900 truncate">{{ item.title }}</h2>
              <div class="flex items-center gap-2 mt-1">
                <UBadge 
                  color="neutral" 
                  size="sm" 
                  variant="soft"
                >
                  En attente
                </UBadge>
                <span class="text-xs text-gray-500">
                  {{ formatDate(item.submitted_at) }}
                </span>
              </div>
            </div>
          </div>
        </template>
        
        <div class="space-y-3">
          <div v-if="item.description" class="text-sm text-gray-700">
            <p class="leading-relaxed">{{ item.description }}</p>
          </div>
          <div v-else class="text-sm text-gray-500 italic">
            Aucune description fournie
          </div>
          
          <div v-if="item.url" class="flex items-center gap-2">
            <UIcon name="i-mingcute-link-line" class="w-4 h-4 text-gray-400" />
            <a 
              :href="item.url" 
              target="_blank" 
              rel="noopener noreferrer"
              class="text-blue-600 hover:text-blue-800 underline text-sm truncate"
            >
              {{ item.url }}
            </a>
          </div>
        </div>
        
        <template #footer>
          <div class="flex justify-between items-center">
            <div class="text-xs text-gray-500">
              <UIcon name="i-mingcute-user-line" class="w-3 h-3 inline mr-1" />
              Soumis {{ item.submitter_id ? 'par un utilisateur' : 'anonymement' }}
            </div>
            <div class="flex gap-2">
              <UButton 
                size="sm" 
                color="success" 
                icon="i-mingcute-check-line"
                @click="approve(item.id)"
                :loading="processingIds.has(item.id)"
              >
                Approuver
              </UButton>
              <UButton 
                size="sm" 
                color="error" 
                icon="i-mingcute-delete-2-line"
                @click="remove(item.id)"
                :loading="processingIds.has(item.id)"
              >
                Supprimer
              </UButton>
            </div>
          </div>
        </template>
      </UCard>
    </div>
    
    <div v-else class="text-center py-16">
      <UIcon name="i-mingcute-radar-line" class="w-12 h-12 mx-auto mb-4 text-gray-300" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">Aucune soumission en attente</h3>
      <p class="text-gray-500">Toutes les soumissions ont été traitées ou il n'y en a pas encore.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useSupabaseClient, useToast } from '#imports'
import type { RealtimeChannel } from '@supabase/supabase-js'

const supabase = useSupabaseClient()
const toast = useToast()
const submissions = ref<Array<any>>([])
const loading = ref(true)
const processingIds = ref<Set<string>>(new Set())

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function fetchPending() {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('laveille')
      .select('id, title, url, description, submitted_at, submitter_id')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: false })
    
    if (error) {
      console.error('Erreur lors du chargement:', error)
      toast.add({
        title: 'Erreur de chargement',
        description: 'Impossible de charger les soumissions en attente.',
        color: 'error',
        icon: 'i-mingcute-alert-line'
      })
    } else {
      submissions.value = data || []
    }
  } catch (error) {
    console.error('Erreur inattendue:', error)
    toast.add({
      title: 'Erreur inattendue',
      description: 'Une erreur inattendue s\'est produite.',
      color: 'error',
      icon: 'i-mingcute-alert-line'
    })
  } finally {
    loading.value = false
  }
}

async function approve(id: string) {
  processingIds.value.add(id)
  try {
    const { error } = await supabase
      .from('laveille')
      .update({ status: 'approved' })
      .eq('id', id)
    
    if (error) {
      console.error('Erreur lors de l\'approbation:', error)
      toast.add({
        title: 'Erreur d\'approbation',
        description: 'Impossible d\'approuver cette soumission.',
        color: 'error',
        icon: 'i-mingcute-alert-line'
      })
    } else {
      toast.add({
        title: 'Soumission approuvée',
        description: 'La soumission a été approuvée avec succès.',
        color: 'success',
        icon: 'i-mingcute-check-line'
      })
      await fetchPending()
    }
  } catch (error) {
    console.error('Erreur inattendue:', error)
    toast.add({
      title: 'Erreur inattendue',
      description: 'Une erreur inattendue s\'est produite.',
      color: 'error',
      icon: 'i-mingcute-alert-line'
    })
  } finally {
    processingIds.value.delete(id)
  }
}

async function remove(id: string) {
  processingIds.value.add(id)
  try {
    const { error } = await supabase
      .from('laveille')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Erreur lors de la suppression:', error)
      toast.add({
        title: 'Erreur de suppression',
        description: 'Impossible de supprimer cette soumission.',
        color: 'error',
        icon: 'i-mingcute-alert-line'
      })
    } else {
      toast.add({
        title: 'Soumission supprimée',
        description: 'La soumission a été supprimée avec succès.',
        color: 'success',
        icon: 'i-mingcute-check-line'
      })
      await fetchPending()
    }
  } catch (error) {
    console.error('Erreur inattendue:', error)
    toast.add({
      title: 'Erreur inattendue',
      description: 'Une erreur inattendue s\'est produite.',
      color: 'error',
      icon: 'i-mingcute-alert-line'
    })
  } finally {
    processingIds.value.delete(id)
  }
}

// Real-time subscription for laveille changes
let laveilleChannel: RealtimeChannel

onMounted(() => {
  fetchPending()
  
  laveilleChannel = supabase
    .channel('public:laveille')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'laveille'
    }, () => {
      // Refresh pending submissions when any change occurs
      fetchPending()
    })
    .subscribe()
})

onUnmounted(() => {
  if (laveilleChannel) {
    supabase.removeChannel(laveilleChannel)
  }
})
</script>
