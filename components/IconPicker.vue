<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { UModal, UInput, UButton } from '#components'

const props = defineProps<{
  modelValue: string,
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const searchQuery = ref('')
const showSheet = ref(false)
const icons = ref<string[]>([])
const displayedIcons = ref<string[]>([])
const isLoading = ref(false)
const pageSize = 100
const currentPage = ref(0)
const loadingMore = ref(false)

const filteredIcons = computed(() => {
  if (!searchQuery.value) return icons.value
  return icons.value.filter(icon =>
    icon.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const loadMoreIcons = () => {
  if (loadingMore.value) return
  loadingMore.value = true
  const start = currentPage.value * pageSize
  const newIcons = filteredIcons.value.slice(start, start + pageSize)
  displayedIcons.value = [...displayedIcons.value, ...newIcons]
  currentPage.value++
  loadingMore.value = false
}

const observerTarget = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const ICONS_URL = 'https://raw.githubusercontent.com/iconify/icon-sets/refs/heads/master/json/mingcute.json'

onMounted(async () => {
  isLoading.value = true
  try {
    const response = await fetch(ICONS_URL)
    const data = await response.json()
    icons.value = Object.keys(data.icons)
    displayedIcons.value = icons.value.slice(0, pageSize)
  } catch (error) {
    console.error('Failed to load icons:', error)
  }
  isLoading.value = false

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && displayedIcons.value.length < filteredIcons.value.length) {
        loadMoreIcons()
      }
    },
    { threshold: 0.5 }
  )
  if (observerTarget.value) {
    observer.observe(observerTarget.value)
  }
})

onUnmounted(() => {
  if (observer && observerTarget.value) observer.disconnect()
})

watch(searchQuery, () => {
  currentPage.value = 0
  displayedIcons.value = filteredIcons.value.slice(0, pageSize)
})

function close() {
  showSheet.value = false
  searchQuery.value = ''
}

function open() {
  showSheet.value = true
}

function selectIcon(icon: string) {
  emit('update:modelValue', icon)
  close()
}
</script>

<template>
  <div>
    <!-- Trigger Button -->
    <UButton @click="open" color="primary" variant="soft">
      <span class="w-8 h-8 flex items-center justify-center bg-primary-500 rounded-full">
        <Icon v-if="modelValue" :icon="'mingcute:' + modelValue" class="w-6 h-6 text-white" />
        <Icon v-else icon="mingcute:add-line" class="w-6 h-6 text-white" />
      </span>
      <span class="flex-1 text-left">
        <span class="text-sm">{{ placeholder || 'Sélectionner une icône' }}</span>
        <span v-if="modelValue" class="block text-xs text-gray-500">{{ modelValue }}</span>
      </span>
      <Icon icon="mingcute:down-line" class="w-4 h-4 text-gray-400" />
    </UButton>

    <UModal v-model:open="showSheet" title="Choisir une icône">
      <template #body>
        <div class="flex items-center mb-2 gap-2">
          <UInput v-model="searchQuery" placeholder="Rechercher une icône..." class="flex-1" />
          <UButton @click="close" color="secondary" size="sm">Annuler</UButton>
        </div>
        <div class="overflow-y-auto" style="max-height: 60vh;">
          <div v-if="isLoading" class="p-4 text-center text-gray-500">
            <span class="animate-spin inline-block"><Icon icon="mingcute:loading-line" class="w-6 h-6" /></span>
            Chargement des icônes...
          </div>
          <div v-else-if="displayedIcons.length === 0" class="p-4 text-center text-gray-500">
            Aucune icône trouvée
          </div>
          <div v-else class="grid grid-cols-6 gap-3">
            <button v-for="icon in displayedIcons" :key="icon" @click="selectIcon(icon)"
              class="aspect-square rounded-xl flex items-center justify-center transition-all"
              :class="modelValue === icon ? 'bg-primary/10' : 'hover:bg-gray-50'">
              <Icon :icon="'mingcute:' + icon" class="w-6 h-6" />
            </button>
            <div ref="observerTarget" class="col-span-6 h-4" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
/* Add smooth scrolling */
.overflow-y-auto {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}
</style>
