<template>
  <div class="container mx-auto py-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Gestion des utilisateurs</h1>
      <UButton size="lg" color="primary" @click="inviteUser">Inviter un utilisateur</UButton>
    </div>

    <div v-if="loading">
      <div class="h-6 w-1/3 mb-4 bg-gray-200 rounded animate-pulse" />
      <div class="h-8 bg-gray-200 rounded animate-pulse mb-2" />
      <div class="h-8 bg-gray-200 rounded animate-pulse" />
    </div>

    <div v-else>
      <div class="overflow-auto">
        <table class="min-w-full table-auto">
          <thead>
            <tr class="bg-secondary-200">
              <th class="px-4 py-2">Email</th>
              <th class="px-4 py-2">Nom complet</th>
              <th class="px-4 py-2">Année</th>
              <th class="px-4 py-2">Téléphone</th>
              <th class="px-4 py-2">Rôle</th>
              <th class="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in members" :key="member.email" class="border-b border-secondary-300">
              <td class="px-4 py-2">{{ member.email }}</td>
              <td class="px-4 py-2"><UInput v-model="member.full_name" class="w-full"/></td>
              <td class="px-4 py-2"><UInput v-model="member.uni_year" class="w-full"/></td>
              <td class="px-4 py-2"><UInput v-model="member.phone" class="w-full"/></td>
              <td class="px-4 py-2">
                <USelect
                  v-model="member.role"
                  :items="[
                  { label: 'Membre', value: 'member' },
                  { label: 'Éditeur', value: 'editor' },
                  { label: 'Admin', value: 'admin' }
                  ]"
                  option-attribute="label"
                  value-attribute="value"
                  class="w-40"
                />
              </td>
              <td class="px-4 py-2 space-x-2">
                <UButton size="sm" color="primary" @click="saveMember(member.email)">Enregistrer</UButton>
                <UButton size="sm" color="secondary" @click="deleteMember(member.email)">Supprimer</UButton>
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
import { useSupabaseClient, useToast } from '#imports'
import type { Tables } from '~/types/database.types'

const supabase = useSupabaseClient()
const toast = useToast()
const members = ref<Tables<'members'>[]>([])
const loading = ref(true)
let membersChannel: RealtimeChannel | null = null

async function fetchMembers() {
  loading.value = true
  const { data, error } = await supabase
    .from('members')
    .select('*')
  if (error) {
    console.error(error)
    toast.add({
      title: 'Erreur de chargement',
      color: 'error',
      icon: 'tabler-x',
      description: 'Impossible de charger la liste des utilisateurs.'
    })
  } else {
    members.value = data ?? []
  }
  loading.value = false
}

async function saveMember(email: string) {
  const member = members.value.find(m => m.email === email)
  if (!member) return
  
  const { error } = await supabase
    .from('members')
    .update({ full_name: member.full_name, uni_year: member.uni_year, phone: member.phone, role: member.role })
    .eq('email', email)
  
  if (error) {
    console.error(error)
    toast.add({
      title: 'Erreur de sauvegarde',
      color: 'error',
      icon: 'tabler-x',
      description: 'Impossible de sauvegarder les modifications de l\'utilisateur.'
    })
  } else {
    toast.add({
      title: 'Utilisateur modifié',
      color: 'success',
      icon: 'tabler-check',
      description: 'Les informations de l\'utilisateur ont été mises à jour avec succès.'
    })
  }
}

async function deleteMember(email: string) {
  const confirmed = confirm(`Supprimer ${email}?`)
  if (!confirmed) return
  
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('email', email)
  
  if (error) {
    console.error(error)
    toast.add({
      title: 'Erreur de suppression',
      color: 'error',
      icon: 'tabler-x',
      description: 'Impossible de supprimer l\'utilisateur.'
    })
  } else {
    toast.add({
      title: 'Utilisateur supprimé',
      color: 'success',
      icon: 'tabler-check',
      description: 'L\'utilisateur a été supprimé avec succès.'
    })
  }
}

async function inviteUser() {
  const email = prompt('Email de l\'utilisateur à inviter:')
  if (!email) return

  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) return

  const { error } = await supabase.functions.invoke('send-invite', { body: { email: normalizedEmail } })
  
  if (error) {
    console.error(error)
    toast.add({
      title: 'Erreur d\'invitation',
      color: 'error',
      icon: 'tabler-x',
      description: 'Impossible d\'envoyer l\'invitation à l\'utilisateur.'
    })
  } else {
    toast.add({
      title: 'Invitation envoyée',
      color: 'success',
      icon: 'tabler-check',
      description: 'L\'invitation a été envoyée avec succès à l\'utilisateur.'
    })
  }
}

onMounted(() => {
  fetchMembers()
  membersChannel = supabase
    .channel('public:members')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => fetchMembers())
    .subscribe()
})

onUnmounted(() => {
  if (membersChannel) {
    supabase.removeChannel(membersChannel)
    membersChannel = null
  }
})
</script>
