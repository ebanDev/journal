import { Mark } from '@tiptap/core'
import { VueMarkViewRenderer } from '@tiptap/vue-3'
import SourceMark from '~/components/tiptap/SourceMark.vue'

export interface SourceOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    source: {
      /**
       * Set a source mark
       */
      setSource: (attributes: { sourceData: string }) => ReturnType
      /**
       * Toggle a source mark
       */
      toggleSource: (attributes: { sourceData: string }) => ReturnType
      /**
       * Unset a source mark
       */
      unsetSource: () => ReturnType
    }
  }
}

export const Source = Mark.create<SourceOptions>({
  name: 'source',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      sourceData: {
        default: '{}',
        parseHTML: element => element.getAttribute('data-source-data') || '{}',
        renderHTML: attributes => {
          return {
            'data-source-data': attributes.sourceData,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-source-data]',
        getAttrs: element => ({
          sourceData: element.getAttribute('data-source-data') || '{}',
        }),
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0]
  },

  addCommands() {
    return {
      setSource:
        attributes =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes)
        },
      toggleSource:
        attributes =>
        ({ commands }) => {
          return commands.toggleMark(this.name, attributes)
        },
      unsetSource:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name)
        },
      removeSourceAtPosition:
        (from: number, to: number) =>
        ({ tr, dispatch }: { tr: any; dispatch: any }) => {
          if (dispatch) {
            tr.removeMark(from, to, this.type)
          }
          return true
        },
    }
  },

  addMarkView() {
    return VueMarkViewRenderer(SourceMark)
  },
})

export default Source
