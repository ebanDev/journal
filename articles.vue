<script setup lang="ts">
const supabase = useSupabaseClient()
const { data: articles, error } = await useAsyncData('articles', () =>
  supabase
    .from('articles')
    .select('id, title, content, author_id, published_at', 'draft')
    .order('published_at', { ascending: false })
)
</script>

<template>
  <div class="prose mx-auto">
    <NuxtLink to="/internal/articles/new" class="mb-4 inline-block px-4 py-2 bg-green-500 text-white rounded">New Article</NuxtLink>
    <ul>
      <li v-for="article in articles" :key="article.id" class="mb-8" v-if="article">
        <h2 class="text-2xl font-bold">{{ article.title }}</h2>
        <div v-html="article.content" class="mt-2"></div>
        <p class="text-sm text-gray-500 mt-1">Published: {{ new Date(article.published_at).toLocaleString() }}</p>
      </li>
    </ul>
  </div>
</template>
