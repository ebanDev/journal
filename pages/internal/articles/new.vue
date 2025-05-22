<template>
  <div class="flex items-center justify-center h-screen">
    <p class="text-gray-600">Creating new article...</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSupabaseClient, useSupabaseUser } from '#imports'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

onMounted(async () => {
  if (!user.value) return router.push('/login')
  const { data, error } = await supabase
    .from('articles')
    .insert({ title: '', content: '', author_id: user.value.id, draft: true })
    .select('id')
    .single()
  if (error) {
    console.error(error)
    return
  }
  router.replace(`/internal/articles/${data.id}`)
})
</script>
