<script setup lang="ts">
import type { Tables } from '~/types/database.types'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()
const profile = ref<Tables<'members'>>({} as Tables<'members'>)
const originalProfile = ref<Tables<'members'>>({} as Tables<'members'>)
const isEditing = ref(false)
const isSaving = ref(false)

async function loadProfile() {
  if (!user.value?.email) {
    navigateTo('/login')
    return
  }
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('email', user.value.email)
    .single()
  if (error) {
    toast.add({
      title: 'Erreur',
      description: `Erreur lors du chargement du profil: ${error.message}`,
      color: 'error',
      icon: 'tabler:alert-triangle'
    })
  } else if (data) {
    profile.value = data
    originalProfile.value = data
  }
}

async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    toast.add({
      title: 'Erreur',
      description: `Erreur lors de la déconnexion: ${error.message}`,
      color: 'error',
      icon: 'tabler:alert-triangle'
    })
  } else {
    toast.add({
      title: 'Déconnecté',
      description: 'Vous avez été déconnecté avec succès',
      color: 'success',
      icon: 'tabler:check'
    })
    navigateTo('/')
  }
}

const translateRole = (role: string) => {
  switch (role) {
    case 'admin':
      return 'Administrateur'
    case 'editor':
      return 'Éditeur'
    default:
      return 'Membre'
  }
}

async function saveProfile() {
  if (!user.value?.email) return
  isSaving.value = true
  
  const { error } = await supabase
    .from('members')
    .update({
      full_name: profile.value.full_name,
      uni_year: profile.value.uni_year,
      phone: profile.value.phone
    })
    .eq('email', user.value.email)
  
  if (error) {
    toast.add({
      title: 'Erreur',
      description: `Erreur lors de la sauvegarde: ${error.message}`,
      color: 'error',
      icon: 'tabler:alert-triangle'
    })
  } else {
    toast.add({
      title: 'Profil mis à jour',
      description: 'Vos informations ont été sauvegardées avec succès',
      color: 'success',
      icon: 'tabler:check'
    })
    originalProfile.value = { ...profile.value }
    isEditing.value = false
  }
  isSaving.value = false
}

function cancelEdit() {
  profile.value = { ...originalProfile.value }
  isEditing.value = false
}

function enableEdit() {
  originalProfile.value = { ...profile.value }
  isEditing.value = true
}

onMounted(loadProfile)
</script>

<template>
  <div class="min-h-screen py-4 md:py-8">
    <!-- Mobile navigation header -->
    <div class="md:hidden mb-6 px-4">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-bold text-gray-900">Profil</h1>
        <UButton 
          to="/" 
          variant="outline" 
          size="sm"
          icon="mingcute-home-3-line"
        >
          Accueil
        </UButton>
      </div>
    </div>

    <div class="max-w-2xl mx-auto px-4">
      <!-- Section En-tête -->
      <div class="text-center mb-6 md:mb-8">
        <div class="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-primary-500 to-secondary-700 rounded-full mx-auto mb-4 flex items-center justify-center">
          <UIcon name="mingcute:user-1-line" class="w-8 h-8 md:w-16 md:h-16 text-xl text-white" />
        </div>
        <h1 class="text-2xl md:text-3xl font-bold text-gray-900">{{ profile.full_name || 'Votre Profil' }}</h1>
        <p class="text-gray-600 mt-2">{{ translateRole(profile.role) || 'Membre' }}</p>
      </div>

      <!-- Carte Profil -->
      <UCard class="shadow-lg">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold text-gray-900">Votre Profil</h2>
            <div class="flex items-center gap-2">
              <UBadge :color="translateRole(profile.role) === 'Administrateur' ? 'primary' : translateRole(profile.role) === 'Éditeur' ? 'secondary' : 'secondary'">
                {{ translateRole(profile.role) || 'membre' }}
              </UBadge>
              <UButton 
                v-if="!isEditing"
                size="sm"
                icon="mingcute:pencil-line"
                variant="outline"
                @click="enableEdit"
              >
                Modifier
              </UButton>
            </div>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UFormField name="full_name" label="Nom complet">
            <UInput 
              v-model="profile.full_name" 
              placeholder="Entrez votre nom complet" 
              :disabled="!isEditing"
            >
              <template #leading>
                <UIcon name="mingcute:user-1-line" class="w-4 h-4 text-gray-400" />
              </template>
            </UInput>
          </UFormField>

          <UFormField name="email" label="Adresse email">
            <UInput v-model="profile.email" disabled>
              <template #leading>
                <UIcon name="mingcute:mail-line" class="w-4 h-4 text-gray-400" />
              </template>
            </UInput>
          </UFormField>

          <UFormField name="uni_year" label="Année universitaire">
            <UInput 
              v-model="profile.uni_year" 
              placeholder="ex. Deuxième année" 
              :disabled="!isEditing"
            >
              <template #leading>
                <UIcon name="mingcute:calendar-line" class="w-4 h-4 text-gray-400" />
              </template>
            </UInput>
          </UFormField>

          <UFormField name="phone" label="Numéro de téléphone">
            <UInput 
              v-model="profile.phone" 
              placeholder="Votre numéro de téléphone" 
              :disabled="!isEditing"
            >
              <template #leading>
                <UIcon name="mingcute:phone-line" class="w-4 h-4 text-gray-400" />
              </template>
            </UInput>
          </UFormField>
        </div>

        <template #footer>
          <div class="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div v-if="isEditing" class="flex flex-col sm:flex-row gap-2">
              <UButton 
                label="Enregistrer" 
                icon="mingcute:check-line"
                color="primary"
                :loading="isSaving"
                @click="saveProfile"
                class="w-full sm:w-auto"
              />
              <UButton 
                label="Annuler" 
                icon="mingcute:close-line"
                variant="outline"
                :disabled="isSaving"
                @click="cancelEdit"
                class="w-full sm:w-auto"
              />
            </div>
            <div v-else></div>
            <UButton 
              label="Se déconnecter" 
              icon="mingcute:exit-line" 
              color="error" 
              variant="outline"
              @click="logout"
              class="w-full sm:w-auto"
            />
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>
