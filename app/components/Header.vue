<template>
  <header class="flex justify-between px-8 w-screen items-center py-4 bg-[#FFFDFD]">
    <NuxtLink to="/">
      <h1 class="font-serif text-3xl text-black">Sursaut<span class="text-primary-600">!</span></h1>
      <p class="font-bold text-base text-black">Le journal des luttes de Bordeaux</p>
    </NuxtLink>
    <div class="relative">
      <UInput class="w-96" v-model="searchQuery" @input="onSearch" @focus="onFocus" @blur="onBlur"
        placeholder="Rechercher..." icon="mingcute-search-line" variant="outline" />
      <transition name="fade">
        <div v-if="showResults" class="absolute bg-white shadow rounded-lg w-full max-h-60 overflow-auto z-10"
          @mouseover="isResultsHovered = true" @mouseleave="isResultsHovered = false">
          <ul>
            <li v-for="(item, idx) in articles" :key="idx" class="px-2 py-2 hover:bg-secondary-200 cursor-pointer">
              <NuxtLink :to="`/articles/${item.slug}`" class="flex items-center gap-4">
                <img v-if="item.cover" :src="item.cover" alt=""
                  class="w-16 h-16 object-cover rounded-lg" />
                <div>
                  <h3 class="text-base font-semibold">{{ item.title }}</h3>
                </div>
              </NuxtLink>
            </li>
            <NuxtLink :to="'/search?q=' + encodeURIComponent(searchQuery)"
              class="px-2 py-2 hover:bg-secondary-200 cursor-pointer flex items-center gap-4">
              <span class="text-sm text-gray-500 flex items-center justify-center gap-1 w-full">
                <Icon name="mingcute-add-line" class="text-gray-400" />
                Tous les résultats
              </span>
            </NuxtLink>
          </ul>
        </div>
      </transition>
    </div>
    <div class="flex gap-2 items-center">
      <UButton label="Tous les articles" icon="mingcute-news-line" href="/articles" color="secondary" size="md" />
      <UButton label="Radar" icon="mingcute-radar-line" href="/radar" color="secondary" size="md" />
      <UButton :label="userName" icon="mingcute-user-4-line" href="/internal/profile" size="md" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { debounce } from '~/utils/debounce'
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
  userName.value = data?.full_name || ''
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
