<template>
  <header class="flex justify-between px-8 w-screen items-center py-4 bg-[#FFFDFD]">
    <NuxtLink to="/">
      <h1 class="font-serif text-3xl">Contradiction·s</h1>
      <h2 class="font-bold text-base">Le journal des luttes de Bordeaux</h2>
    </NuxtLink>
    <div class="relative">
      <UInput
        class="w-96"
        v-model="searchQuery"
        @input="onSearch"
        @focus="onFocus"
        @blur="onBlur"
        placeholder="Rechercher..."
        icon="tabler-search"
        variant="outline"
      />
      <transition name="fade">
        <div v-if="showResults" class="absolute bg-white shadow rounded-lg w-full max-h-60 overflow-auto z-10" @mouseover="isResultsHovered = true" @mouseleave="isResultsHovered = false">
          <ul>
            <li v-for="(item, idx) in articles" :key="idx" class="px-2 py-2 hover:bg-secondary-200 cursor-pointer">
              <NuxtLink :to="`/article/${item.metadata.slug}`" class="flex items-center gap-4">
                <img v-if="item.metadata.cover" :src="item.metadata.cover" alt="" class="w-16 h-16 object-cover rounded-lg"/>
                <div>
                  <h3 class="text-base font-semibold">{{ item.title }}</h3>
                </div>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </transition>
    </div>
    <div class="flex gap-2 items-center">
      <UButton label="Tous les articles" icon="tabler-news" href="/articles" color="secondary" size="md"/>
      <UButton label="La veille" icon="tabler-radar-2" href="/la-veille" color="secondary" size="md"/>
      <UButton :label="userName" icon="tabler-user-circle" href="/internal" size="md" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { debounce } from 'lodash-es'
import { ref, computed } from 'vue'
const supabase = useSupabaseClient()
const searchQuery = ref('')
const articles = ref<any[]>([])
const isSearchFocused = ref(false)
const isResultsHovered = ref(false)
const showResults = computed(() => articles.value.length > 0 && (isSearchFocused.value || isResultsHovered.value))

const onSearch = debounce(async () => {
  if (!searchQuery.value) {
    articles.value = []
    return
  }
  const { data, error } = await supabase.functions.invoke('search', {
    body: JSON.stringify({ search: searchQuery.value }),
  })
  if (error) console.error(error)
  else {
    console.log(data)
    articles.value = data
  }
}, 300)

const onFocus = () => { isSearchFocused.value = true }
const onBlur = () => { isSearchFocused.value = false }

const user = useSupabaseUser()
const userName = ref('')

if (user?.value?.email) {
  const { data } = await useSupabaseClient()
      .from('members')
      .select('full_name')
      .eq('email', user.value.email)
      .single()
  userName.value = data?.full_name
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
