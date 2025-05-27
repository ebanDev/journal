<template>
  <div class="container mx-auto py-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Gestion des utilisateurs</h1>
      <UButton size="lg" color="primary" @click="inviteUser">Inviter un utilisateur</UButton>
    </div>

    <div v-if="loading">
      <UPlaceholder class="h-6 w-1/3 mb-4" />
      <UPlaceholder class="h-8" />
      <UPlaceholder class="h-8" />
    </div>

    <div v-else>
      <div class="overflow-auto">
        <table class="min-w-full table-auto">
          <thead>
            <tr class="bg-gray-100">
              <th class="px-4 py-2">Email</th>
              <th class="px-4 py-2">Nom complet</th>
              <th class="px-4 py-2">Année</th>
              <th class="px-4 py-2">Téléphone</th>
              <th class="px-4 py-2">Rôle</th>
              <th class="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in members" :key="member.email" class="border-b">
              <td class="px-4 py-2">{{ member.email }}</td>
              <td class="px-4 py-2"><UInput v-model="member.full_name" /></td>
              <td class="px-4 py-2"><UInput v-model="member.uni_year" /></td>
              <td class="px-4 py-2"><UInput v-model="member.phone" /></td>
              <td class="px-4 py-2">
                <select v-model="member.role" class="border rounded px-2 py-1">
                  <option value="member">Membre</option>
                  <option value="editor">Éditeur</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td class="px-4 py-2 space-x-2">
                <UButton size="sm" color="success" @click="saveMember(member.email)">Enregistrer</UButton>
                <UButton size="sm" color="error" @click="deleteMember(member.email)">Supprimer</UButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useSupabaseClient } from '#imports'
import type { Tables } from '~/types/database.types'
const supabase = useSupabaseClient()
const members = ref<Tables<'members'>[]>([])
const loading = ref(true)
let membersChannel: RealtimeChannel

async function fetchMembers() {
  loading.value = true
  const { data, error } = await supabase
    .from('members')
    .select('*')
  if (error) console.error(error)
  else members.value = data ?? []
  loading.value = false
}

async function saveMember(email: string) {
  const member = members.value.find(m => m.email === email)
  if (!member) return
  const { error } = await supabase
    .from('members')
    .update({ full_name: member.full_name, uni_year: member.uni_year, phone: member.phone, role: member.role })
    .eq('email', email)
  if (error) console.error(error)
}

async function deleteMember(email: string) {
  const confirmed = confirm(`Supprimer ${email}?`)
  if (!confirmed) return
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('email', email)
  if (error) console.error(error)
}

async function inviteUser() {
  const email = prompt('Email de l\'utilisateur à inviter:')
  if (!email) return
  const { error } = await supabase.functions.invoke('send-invite', { body: { email } })
  if (error) console.error(error)
}

onMounted(() => {
  fetchMembers()
  membersChannel = supabase
    .channel('public:members')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => fetchMembers())
    .subscribe()
})

onUnmounted(() => {
  supabase.removeChannel(membersChannel)
})
</script>
