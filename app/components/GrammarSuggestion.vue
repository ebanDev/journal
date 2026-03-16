<template>
  <UPopover v-model:open="isOpen" mode="hover" :open-delay="200" :close-delay="300">
    <!-- Invisible trigger positioned at the clicked location -->
    <div 
      ref="triggerRef" 
      class="absolute pointer-events-none" 
      :style="{ left: position.x + 'px', top: position.y + 'px', width: '1px', height: '1px' }" 
    />
    
    <template #content>
      <div class="p-4 space-y-3 w-80" v-if="grammarData" @click.stop @mousedown.stop>
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-medium text-red-600">
            <Icon name="i-mingcute-magic-2-line" class="mr-1" />
            Suggestion grammaticale
          </h3>
          <UButton icon="i-mingcute-close-line" size="xs" variant="ghost" @click="close" />
        </div>
        
        <!-- Error message -->
        <div class="text-sm text-gray-700 bg-gray-50 p-2 rounded">
          {{ grammarData.message }}
        </div>
        
        <!-- Suggestions -->
        <div v-if="grammarData.replacements && grammarData.replacements.length > 0" class="space-y-2">
          <div class="text-xs font-medium text-gray-600 uppercase tracking-wide">
            Recommandations
          </div>
          <div class="space-y-1">
            <UButton
              v-for="(replacement, index) in grammarData.replacements.slice(0, 5)"
              :key="index"
              @click="applyReplacement(replacement)"
              variant="outline"
              color="neutral"
              size="sm"
              block
              class="justify-start"
            >
              <Icon name="i-mingcute-arrow-right-line" class="mr-1" />
              "{{ replacement }}"
            </UButton>
            
            <!-- Ignore -->
            <UButton
              @click="ignoreError"
              variant="outline"
              color="neutral"
              size="sm"
              block
              class="justify-start"
            >
              <Icon name="i-mingcute-close-line" class="mr-1" />
              Ignorer
            </UButton>

            <!-- Add to vocabulary (only shown for spelling errors that have an actual word) -->
            <UButton
              v-if="grammarData.word"
              @click="addToVocabulary"
              variant="outline"
              color="neutral"
              size="sm"
              block
              class="justify-start"
            >
              <Icon name="i-mingcute-book-2-line" class="mr-1" />
              Ajouter « {{ grammarData.word }} » au vocabulaire
            </UButton>
          </div>
        </div>
        
        <!-- If no suggestions, show ignore + add to vocabulary -->
        <div v-else class="space-y-2">
          <div class="text-xs font-medium text-gray-600 uppercase tracking-wide">
            Actions
          </div>
          <div class="space-y-1">
            <UButton
              @click="ignoreError"
              variant="outline"
              color="neutral"
              size="sm"
              block
              class="justify-start"
            >
              <Icon name="i-mingcute-close-line" class="mr-1" />
              Ignorer
            </UButton>

            <UButton
              v-if="grammarData.word"
              @click="addToVocabulary"
              variant="outline"
              color="neutral"
              size="sm"
              block
              class="justify-start"
            >
              <Icon name="i-mingcute-book-2-line" class="mr-1" />
              Ajouter « {{ grammarData.word }} » au vocabulaire
            </UButton>
          </div>
        </div>
        
        <!-- LanguageTool attribution -->
        <div class="text-xs text-gray-500 border-t pt-2">
          Propulsé par <a href="https://languagetool.org" target="_blank" class="text-amber-600 underline">LanguageTool</a>
        </div>
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

export interface GrammarData {
  message: string
  replacements: string[]
  ruleId?: string
  /** The literal text that was flagged, used for "add to vocabulary". */
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
const emit = defineEmits<{
  close: []
}>()

const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)

// Methods
const show = async () => {
  isOpen.value = true
  await nextTick()
}

const close = () => {
  isOpen.value = false
  emit('close')
}

const applyReplacement = (replacement: string) => {
  props.onApplyReplacement(replacement)
  close()
}

const ignoreError = () => {
  props.onIgnore()
  close()
}

const addToVocabulary = () => {
  if (props.grammarData?.word) {
    props.onAddToVocabulary(props.grammarData.word)
  }
  close()
}

// Expose methods for parent component
defineExpose({
  show,
  close
})
</script>
