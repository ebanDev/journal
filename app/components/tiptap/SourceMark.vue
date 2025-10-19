<template>
  <UPopover mode="hover" :open-delay="200" :close-delay="300">
    <span class="source-mark inline-flex items-center gap-1 px-1 py-0.5 text-sm bg-amber-50 text-amber-800 rounded border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer group">
      <Icon name="i-mingcute-book-2-line" class="text-xs" />
      <MarkViewContent />
    </span>
    
    <template #content>
      <div class="p-4 max-w-sm space-y-3">
        <div class="flex justify-between items-start gap-2">
          <div class="space-y-2 flex-1">
            <h4 class="font-semibold text-gray-900">{{ sourceData.title || 'Source' }}</h4>
            <p v-if="sourceData.description" class="text-sm text-gray-600 line-clamp-3">
              {{ sourceData.description }}
            </p>
          </div>
          <UButton 
            @click="deleteSource"
            size="xs" 
            variant="ghost" 
            color="error"
            icon="i-mingcute-delete-2-line"
            title="Supprimer la source"
          />
        </div>
        
        <div v-if="sourceData.url" class="pt-2 border-t border-gray-100">
          <a 
            :href="sourceData.url" 
            target="_blank" 
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            <Icon name="i-mingcute-external-link-line" class="text-xs" />
            Voir la source
          </a>
        </div>
        
        <div v-if="sourceData.author || sourceData.publishedAt" class="pt-2 border-t border-gray-100 space-y-1">
          <p v-if="sourceData.author" class="text-xs text-gray-500">
            Par {{ sourceData.author }}
          </p>
          <p v-if="sourceData.publishedAt" class="text-xs text-gray-500">
            {{ formatDate(sourceData.publishedAt) }}
          </p>
        </div>
      </div>
    </template>
  </UPopover>
</template>

<script>
import { MarkViewContent, markViewProps } from '@tiptap/vue-3'

export default {
  components: {
    MarkViewContent,
  },
  props: markViewProps,
  computed: {
    sourceData() {
      try {
        return JSON.parse(this.mark.attrs.sourceData || '{}')
      } catch {
        return {}
      }
    }
  },
  methods: {
    formatDate(dateString) {
      try {
        return new Date(dateString).toLocaleDateString('fr-FR')
      } catch {
        return dateString
      }
    },
    deleteSource() {
      // Try multiple approaches to get the editor and remove this mark
      const editor = this.editor
      
      if (!editor) {
        console.warn('No editor available for source deletion')
        return
      }

      try {
        // Approach 1: Try to use the current selection if user has clicked on the source
        if (editor.isActive('source')) {
          editor.chain().focus().unsetMark('source').run()
          return
        }

        // Approach 2: Find and remove this specific source mark
        const sourceData = this.mark.attrs.sourceData
        const doc = editor.state.doc
        let found = false

        doc.descendants((node, pos) => {
          if (found) return false
          
          if (node.marks) {
            for (const mark of node.marks) {
              if (mark.type.name === 'source' && mark.attrs.sourceData === sourceData) {
                // Create a selection over this node and remove the mark
                const tr = editor.state.tr
                tr.setSelection(editor.state.selection.constructor.create(doc, pos, pos + node.nodeSize))
                tr.removeMark(pos, pos + node.nodeSize, editor.schema.marks.source)
                editor.view.dispatch(tr)
                found = true
                return false
              }
            }
          }
        })
        
        if (!found) {
          // Fallback: just unset all source marks in current selection
          editor.chain().focus().unsetMark('source').run()
        }
      } catch (error) {
        console.error('Error deleting source:', error)
        // Final fallback
        editor.chain().focus().unsetMark('source').run()
      }
    }
  }
}
</script>

<style scoped>
.source-mark {
  text-decoration: none !important;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
