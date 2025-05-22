<template>
  <div class="container mx-auto py-8">
    <h1 class="text-2xl font-bold mb-6">La Veille Submissions</h1>

    <div v-if="loading">
      <UPlaceholder class="h-6 w-1/3 mb-4" />
      <div class="space-y-4">
        <UPlaceholder class="h-40" />
        <UPlaceholder class="h-40" />
      </div>
    </div>

    <div v-else>
      <div v-if="submissions.length" class="space-y-4">
        <UCard v-for="item in submissions" :key="item.id">
          <template #header>
            <h2 class="text-lg font-semibold">{{ item.title }}</h2>
          </template>
          <div class="text-sm text-gray-700 mb-2">
            <p>{{ item.description || 'No description' }}</p>
            <a v-if="item.url" :href="item.url" target="_blank" class="text-blue-600 underline">Visit link</a>
          </div>
          <template #footer>
            <div class="flex space-x-2">
              <UButton size="sm" color="success" @click="approve(item.id)">Approve</UButton>
              <UButton size="sm" color="danger" @click="remove(item.id)">Delete</UButton>
            </div>
          </template>
        </UCard>
      </div>
      <div v-else class="text-center text-gray-500 py-10">No pending submissions.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSupabaseClient } from '#imports'

const supabase = useSupabaseClient()
const submissions = ref<Array<any>>([])
const loading = ref(true)

async function fetchPending() {
  loading.value = true
  const { data, error } = await supabase
    .from('laveille')
    .select('id, title, url, description')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: false })
  if (error) {
    console.error(error)
  } else {
    submissions.value = data || []
  }
  loading.value = false
}

async function approve(id: string) {
  const { error } = await supabase
    .from('laveille')
    .update({ status: 'approved' })
    .eq('id', id)
  if (error) console.error(error)
  else fetchPending()
}

async function remove(id: string) {
  const { error } = await supabase
    .from('laveille')
    .delete()
    .eq('id', id)
  if (error) console.error(error)
  else fetchPending()
}

await fetchPending()
</script>
