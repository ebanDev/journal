<template>
  <div class="flex flex-col gap-3">
    <UButton
      color="primary"
      variant="soft"
      icon="mingcute:group-3-line"
      class="w-full justify-center"
      @click="openSheet"
    >
      Liste des adhérents
    </UButton>

    <UDrawer
      v-model:open="isOpen"
      direction="bottom"
      class="z-[200] max-h-[85vh]"
      :ui="drawerUi"
      @close="closeSheet"
    >
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-lg font-semibold text-gray-900">Liste des adhérents</p>
            <p class="text-xs text-gray-500">
              {{ members.length }} adhérent{{ members.length > 1 ? '·e·s' : '' }}
            </p>
          </div>
          <div class="flex items-center gap-1">
            <UButton
              size="sm"
              variant="ghost"
              color="neutral"
              icon="mingcute:refresh-2-line"
              :loading="loading"
              @click.stop="refresh"
            />
            <UButton
              size="sm"
              variant="ghost"
              color="neutral"
              icon="mingcute:close-line"
              @click="closeSheet"
            />
          </div>
        </div>
      </template>

      <template #body>
        <div class="flex flex-col gap-3">
          <UInput
            v-model="search"
            icon="mingcute:search-line"
            placeholder="Rechercher par nom ou email"
          />

          <div class="max-h-[55vh] overflow-y-auto pr-1">
            <div v-if="loading" class="flex flex-col items-center justify-center gap-2 py-10 text-gray-500">
              <UIcon name="mingcute:loading-3-line" class="h-6 w-6 animate-spin" />
              <span>Chargement des adhérents...</span>
            </div>

            <div v-else-if="error" class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {{ error }}
            </div>

            <div v-else-if="filteredMembers.length === 0" class="py-10 text-center text-sm text-gray-500">
              Aucun adhérent ne correspond à la recherche.
            </div>

            <ul v-else class="divide-y divide-gray-100">
              <li v-for="memberItem in filteredMembers" :key="memberItem.email" class="py-3">
                <p class="font-medium text-gray-900">{{ memberItem.full_name || 'Nom non renseigné' }}</p>
                <p class="text-sm text-gray-500">{{ memberItem.email }}</p>
                <div class="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <UBadge size="xs" :color="roleColor(memberItem.role)">
                    {{ translateRole(memberItem.role) }}
                  </UBadge>
                  <span v-if="memberItem.uni_year">{{ memberItem.uni_year }}</span>
                  <span v-if="memberItem.phone" class="flex items-center gap-1">
                    <UIcon name="mingcute:phone-line" class="h-3.5 w-3.5" />
                    {{ memberItem.phone }}
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </template>
    </UDrawer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Tables } from '~/types/database.types'

const supabase = useSupabaseClient()
const toast = useToast()

const isOpen = ref(false)
const loading = ref(false)
const error = ref('')
const members = ref<Tables<'members'>[]>([])
const search = ref('')

const drawerUi = {
  content: 'max-w-full sm:max-w-lg mx-auto rounded-t-3xl bg-white shadow-lg',
  container: 'flex flex-col gap-4 px-4 pb-6 pt-3',
  body: 'flex flex-col gap-3',
  handle: 'mx-auto mb-2 h-1.5 w-16 rounded-full bg-gray-200'
}

const filteredMembers = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return members.value
  return members.value.filter(member => {
    const name = member.full_name?.toLowerCase() || ''
    const email = member.email?.toLowerCase() || ''
    return name.includes(term) || email.includes(term)
  })
})

function translateRole(role?: string | null) {
  switch (role) {
    case 'admin':
      return 'Administrateur'
    case 'editor':
      return 'Éditeur'
    default:
      return 'Membre'
  }
}

function roleColor(role?: string | null) {
  switch (role) {
    case 'admin':
      return 'primary'
    case 'editor':
      return 'secondary'
    default:
      return 'neutral'
  }
}

async function fetchMembers() {
  loading.value = true
  error.value = ''
  const { data, error: fetchError } = await supabase
    .from('members')
    .select('email, full_name, role, uni_year, phone, joined_at, user_id')
    .order('full_name')

  if (fetchError) {
    error.value = `Impossible de charger les adhérents: ${fetchError.message}`
    toast.add({
      title: 'Erreur',
      description: error.value,
      color: 'error',
      icon: 'tabler:alert-triangle'
    })
  } else {
    members.value = data || []
  }

  loading.value = false
}

async function openSheet() {
  isOpen.value = true
}

watch(isOpen, async open => {
  if (open && !members.value.length) {
    await fetchMembers()
  }
})

function closeSheet() {
  isOpen.value = false
}

async function refresh() {
  if (loading.value) return
  await fetchMembers()
}
</script>
