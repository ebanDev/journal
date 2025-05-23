<template>
  <div class="flex items-center justify-center h-screen">
    <p class="text-gray-600">Creating new article...</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSupabaseUser } from '#imports'
import { useDb } from '~/composables/useDb'

const user = useSupabaseUser()
const router = useRouter()
const route = useRoute()
const { createNewArticle } = useDb()
const editionId = route.query.issue as string | undefined

onMounted(async () => {
  if (!user.value) return router.push('/login')
  try {
    const article = await createNewArticle({
      title: '',
      content: '',
      author_id: user.value.id,
      issue_id: editionId,
    })
    router.replace(`/internal/articles/${article.id}`)
  } catch (error) {
    console.error(error)
  }
})
</script>
