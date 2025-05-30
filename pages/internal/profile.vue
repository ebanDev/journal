<script setup lang="ts">
import type { Tables } from '~/types/database.types'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const profile = ref<Tables<'members'>>({} as Tables<'members'>)
const status = ref<string | null>(null)

async function loadProfile() {
  if (!user.value?.email) return
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('email', user.value.email)
    .single()
  if (error) {
    status.value = `Error loading profile: ${error.message}`
  } else if (data) {
    profile.value = data
  }
}

async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    status.value = `Error logging out: ${error.message}`
  } else {
    status.value = 'Logged out successfully'
    navigateTo('/')
  }
}

onMounted(loadProfile)
</script>

<template>
  <UCard class="w-xl h-max mt-8">
    <template #header>
      <h2 class="text-xl font-semibold">Your Profile</h2>
    </template>

    <div class="space-y-4">
      <UFormField name="email" label="Email">
        <UInput v-model="profile.email" disabled />
      </UFormField>

      <UFormField name="full_name" label="Full Name">
        <UInput v-model="profile.full_name" placeholder="Enter your full name" disabled />
      </UFormField>

      <UFormField name="uni_year" label="University Year">
        <UInput v-model="profile.uni_year" placeholder="e.g. Sophomore" disabled />
      </UFormField>

      <UFormField name="phone" label="Phone">
        <UInput v-model="profile.phone" placeholder="Your phone number" disabled />
      </UFormField>

      <UFormField name="role" label="Role">
        <USelect v-model="profile.role" disabled :items="['member', 'editor', 'admin']">
        </USelect>
      </UFormField>

      <UButton label="Logout" icon="tabler-logout" @click="logout" />
    </div>

    <p v-if="status" class="mt-4 text-center text-sm text-gray-600">{{ status }}</p>
  </UCard>
</template>
