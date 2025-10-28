<template>
  <div class="bg-white border border-gray-200 rounded-lg shadow-xs p-2 flex flex-wrap gap-1 items-center">
    <!-- Heading buttons -->
    <div class="flex gap-1">
      <UTooltip v-for="button in headingButtons" :key="button.icon" :text="button.title">
        <UButton 
          :icon="button.icon" 
          size="xs" 
          variant="ghost" 
          color="neutral"
          :class="button.active() ? 'bg-amber-100 text-amber-700' : ''" 
          @click="button.command" 
        />
      </UTooltip>
    </div>

    <!-- Separator -->
    <div class="w-px h-6 bg-gray-200 mx-1"></div>

    <!-- Text style buttons -->
    <div class="flex gap-1">
      <UTooltip v-for="button in textStyleButtons" :key="button.icon" :text="button.title">
        <UButton 
          :icon="button.icon" 
          size="xs" 
          variant="ghost" 
          color="neutral"
          :class="button.active() ? 'bg-amber-100 text-amber-700' : ''" 
          @click="button.command" 
        />
      </UTooltip>
    </div>

    <!-- Separator -->
    <div class="w-px h-6 bg-gray-200 mx-1"></div>

    <!-- List buttons -->
    <div class="flex gap-1">
      <UTooltip v-for="button in listButtons" :key="button.icon" :text="button.title">
        <UButton 
          :icon="button.icon" 
          size="xs" 
          variant="ghost" 
          color="neutral"
          :class="button.active() ? 'bg-amber-100 text-amber-700' : ''" 
          @click="button.command" 
        />
      </UTooltip>
    </div>

    <!-- Separator -->
    <div class="w-px h-6 bg-gray-200 mx-1"></div>

    <!-- Block elements -->
    <div class="flex gap-1">
      <UTooltip v-for="button in blockButtons" :key="button.icon" :text="button.title">
        <UButton 
          :icon="button.icon" 
          size="xs" 
          variant="ghost" 
          color="neutral"
          :class="button.active() ? 'bg-amber-100 text-amber-700' : ''" 
          @click="button.command" 
        />
      </UTooltip>

    </div>

    <!-- Separator -->
    <div class="w-px h-6 bg-gray-200 mx-1"></div>

    <!-- Media and content buttons -->
    <div class="flex gap-1">
      <!-- Image upload button -->
      <UTooltip text="Ajouter une image">
        <UButton 
          icon="mingcute:photo-album-line" 
          size="xs" 
          variant="ghost" 
          color="neutral"
          :loading="isUploading"
          @click="triggerImageUpload" 
        />
      </UTooltip>

      <!-- Source button -->
      <UTooltip text="Source">
        <UButton 
          icon="i-mingcute-book-2-line" 
          size="xs" 
          variant="ghost" 
          color="neutral"
          :class="editor && editor.isActive('source') ? 'bg-amber-100 text-amber-700' : ''"
          @click.stop="$emit('open-source-popover', $event)" 
        />
      </UTooltip>

      <!-- Chart button -->
      <UTooltip text="Graphique">
        <UButton 
          icon="i-mingcute-chart-bar-line" 
          size="xs" 
          variant="ghost" 
          color="neutral"
          :class="editor && editor.isActive('chart') ? 'bg-amber-100 text-amber-700' : ''"
          @click.stop="$emit('open-chart-popover', $event)" 
        />
      </UTooltip>

      <!-- Math button -->
      <UTooltip text="Formule mathématique">
        <UButton 
          icon="i-tabler-math-function" 
          size="xs" 
          variant="ghost" 
          color="neutral"
          :class="isMathActive ? 'bg-amber-100 text-amber-700' : ''"
          :disabled="!editor"
          @click="insertMath"
        />
      </UTooltip>
    </div>

    <!-- Hidden file input -->
    <input 
      ref="fileInput"
      type="file" 
      accept="image/*" 
      multiple
      class="hidden" 
      @change="handleImageUpload" 
    />
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import { useImageUpload } from '~/composables/useImageUpload'

interface Props {
  editor: Editor | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'open-source-popover': [event: MouseEvent]
  'open-chart-popover': [event: MouseEvent]
}>()

const { uploadImage, isUploading } = useImageUpload()
const fileInput = ref<HTMLInputElement | null>(null)
const isMathActive = computed(() => {
  const editorInstance = props.editor
  if (!editorInstance) return false
  return editorInstance.isActive('blockMath') || editorInstance.isActive('inlineMath')
})

// Format buttons configuration organized by groups
const headingButtons = computed(() => [
  {
    icon: 'i-mingcute-heading-1-line',
    // @ts-ignore
    command: () => props.editor?.chain().focus().toggleHeading({ level: 1 }).run(),
    active: () => props.editor?.isActive('heading', { level: 1 }) ?? false,
    title: 'Titre 1'
  },
  {
    icon: 'i-mingcute-heading-2-line',
    // @ts-ignore
    command: () => props.editor?.chain().focus().toggleHeading({ level: 2 }).run(),
    active: () => props.editor?.isActive('heading', { level: 2 }) ?? false,
    title: 'Titre 2'
  },
  {
    icon: 'i-mingcute-heading-3-line',
    // @ts-ignore
    command: () => props.editor?.chain().focus().toggleHeading({ level: 3 }).run(),
    active: () => props.editor?.isActive('heading', { level: 3 }) ?? false,
    title: 'Titre 3'
  }
])

const textStyleButtons = computed(() => [
  {
    icon: 'i-mingcute-bold-line',
    // @ts-ignore
    command: () => props.editor?.chain().focus().toggleBold().run(),
    active: () => props.editor?.isActive('bold') ?? false,
    title: 'Gras'
  },
  {
    icon: 'i-mingcute-italic-line',
    // @ts-ignore
    command: () => props.editor?.chain().focus().toggleItalic().run(),
    active: () => props.editor?.isActive('italic') ?? false,
    title: 'Italique'
  },
  {
    icon: 'i-mingcute-strikethrough-line',
    // @ts-ignore
    command: () => props.editor?.chain().focus().toggleStrike().run(),
    active: () => props.editor?.isActive('strike') ?? false,
    title: 'Barré'
  },
  {
    icon: 'i-mingcute-braces-line',
    // @ts-ignore
    command: () => props.editor?.chain().focus().toggleCode().run(),
    active: () => props.editor?.isActive('code') ?? false,
    title: 'Code'
  }
])

const listButtons = computed(() => [
  {
    icon: 'i-mingcute-list-check-line',
    command: () => { props.editor?.chain().focus().toggleBulletList().run() },
    active: () => props.editor?.isActive('bulletList') ?? false,
    title: 'Liste puces'
  },
  {
    icon: 'i-mingcute-list-ordered-line',
    command: () => { props.editor?.chain().focus().toggleOrderedList().run() },
    active: () => props.editor?.isActive('orderedList') ?? false,
    title: 'Liste numérotée'
  }
])

const blockButtons = computed(() => [
  {
    icon: 'i-mingcute-quote-right-line',
    // @ts-ignore
    command: () => props.editor?.chain().focus().toggleBlockquote().run(),
    active: () => props.editor?.isActive('blockquote') ?? false,
    title: 'Citation'
  },
  {
    icon: 'i-mingcute-code-line',
    command: () => props.editor?.chain().focus().toggleCodeBlock().run(),
    active: () => props.editor?.isActive('codeBlock') ?? false,
    title: 'Code'
  }
])

const triggerImageUpload = () => {
  fileInput.value?.click()
}

const handleImageUpload = async (event: Event) => {
  const files = (event.target as HTMLInputElement).files
  if (!files || !props.editor) return

  try {
    // Upload images one by one and insert them
    for (const file of Array.from(files)) {
      const imageUrl = await uploadImage(file)
      
      // Insert image into editor
      props.editor.chain().focus().setImage({
        src: imageUrl,
        alt: file.name.split('.')[0] // Use filename without extension as alt text
      }).run()
    }
  } catch (error) {
    console.error('Failed to upload and insert images:', error)
  } finally {
    // Reset file input
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

const insertMath = () => {
  if (!props.editor) return
  const latex = window.prompt('Entrez la formule LaTeX')
  if (!latex) return

  const { $from } = props.editor.state.selection
  const isInlineContext = $from.parent.inlineContent
  const chain = props.editor.chain().focus()

  if (isInlineContext) {
    chain.insertInlineMath({ latex }).run()
    return
  }

  if (!chain.insertBlockMath({ latex }).run()) {
    // fallback to inline if block insertion failed
    props.editor.chain().focus().insertInlineMath({ latex }).run()
  }
}
</script>
