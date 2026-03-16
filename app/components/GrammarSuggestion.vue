<template>
  <Teleport to="body">
    <div
      v-if="isOpen && grammarData"
      class="fixed z-[9999] w-80 rounded-lg border border-gray-200 bg-white shadow-lg"
      :style="{ left: panelX + 'px', top: panelY + 'px' }"
      @click.stop
      @mousedown.stop
    >
      <div class="p-4 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-medium text-red-600">
            <Icon name="i-mingcute-magic-2-line" class="mr-1" />
            Suggestion grammaticale
          </h3>
          <UButton icon="i-mingcute-close-line" size="xs" variant="ghost" @click="close" />
        </div>

        <div class="text-sm text-gray-700 bg-gray-50 p-2 rounded">
          {{ grammarData.message }}
        </div>

        <div class="space-y-2">
          <div v-if="grammarData.replacements && grammarData.replacements.length > 0">
            <div class="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Recommandations</div>
            <div class="space-y-1">
              <UButton
                v-for="(replacement, index) in grammarData.replacements.slice(0, 5)"
                :key="index"
                @click="applyReplacement(replacement)"
                variant="outline" color="neutral" size="sm" block class="justify-start"
              >
                <Icon name="i-mingcute-arrow-right-line" class="mr-1" />
                "{{ replacement }}"
              </UButton>
            </div>
          </div>

          <div class="space-y-1">
            <div class="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Actions</div>
            <UButton @click="ignoreError" variant="outline" color="neutral" size="sm" block class="justify-start">
              <Icon name="i-mingcute-close-line" class="mr-1" />
              Ignorer
            </UButton>
            <UButton
              v-if="grammarData.word"
              @click="addToVocabulary"
              variant="outline" color="neutral" size="sm" block class="justify-start"
            >
              <Icon name="i-mingcute-book-2-line" class="mr-1" />
              Ajouter « {{ grammarData.word }} » au vocabulaire
            </UButton>
          </div>
        </div>

        <div class="text-xs text-gray-500 border-t pt-2">
          Propulsé par <a href="https://languagetool.org" target="_blank" class="text-amber-600 underline">LanguageTool</a>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onUnmounted } from 'vue'

export interface GrammarData {
  message: string
  replacements: string[]
  ruleId?: string
  word?: string
}

export interface GrammarSuggestionProps {
  position: { x: number; y: number }
  grammarData: GrammarData | null
  onApplyReplacement: (replacement: string) => void
  onIgnore: () => void
  onAddToVocabulary: (word: string) => void
}

const props = defineProps<GrammarSuggestionProps>()
const emit = defineEmits<{ close: [] }>()

const isOpen = ref(false)

const panelX = computed(() => {
  const x = props.position.x - 160 // 160 = half of w-80 (320px)
  return Math.max(8, Math.min(x, window.innerWidth - 328))
})
const panelY = computed(() => props.position.y + 8)

function onOutsideClick() { close() }

const show = async () => {
  isOpen.value = true
  await nextTick()
  // Defer binding so the originating click doesn't immediately close the panel
  setTimeout(() => document.addEventListener('click', onOutsideClick), 0)
}

const close = () => {
  isOpen.value = false
  document.removeEventListener('click', onOutsideClick)
  emit('close')
}

onUnmounted(() => document.removeEventListener('click', onOutsideClick))

const applyReplacement = (replacement: string) => { props.onApplyReplacement(replacement); close() }
const ignoreError = () => { props.onIgnore(); close() }
const addToVocabulary = () => { if (props.grammarData?.word) props.onAddToVocabulary(props.grammarData.word); close() }

defineExpose({ show, close })
</script>
