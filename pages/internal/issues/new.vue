<template>
  <div class="flex items-center justify-center h-screen">
    <p class="text-gray-600">Creating new issue...</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Database } from '#supabase/database'
import { useSupabaseClient, useSupabaseUser } from '#imports'

const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()
const router = useRouter()

onMounted(async () => {
  if (!user.value) return router.push('/login')
  const { data, error } = await supabase
    .from('issues')
    .insert({ title: '', status: 'draft' })
    .select('id')
    .single()
  if (error) {
    console.error(error)
    return
  }
  router.replace(`/internal/issues/${data.id}`)
})
</script>
