import { Node, mergeAttributes } from '@tiptap/core'
import { Fragment } from '@tiptap/pm/model'
import { TextSelection } from '@tiptap/pm/state'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    sidenote: {
      insertSidenote: () => ReturnType
    }
  }
}

const numberAttribute = {
  default: 1,
  parseHTML: (element: HTMLElement) => Number(element.getAttribute('data-sidenote-number') || '1'),
  renderHTML: (attributes: { number: number }) => ({
    'data-sidenote-number': attributes.number,
  }),
}

export const SidenoteNote = Node.create({
  name: 'sidenoteNote',
  content: 'text*',
  marks: 'bold italic underline',
  defining: true,

  addAttributes() {
    return { number: numberAttribute }
  },

  parseHTML() {
    return [{ tag: 'aside[data-sidenote-note]', contentElement: '.sidenote-note__content' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'aside',
      mergeAttributes(HTMLAttributes, { 'data-sidenote-note': '', class: 'sidenote-note' }),
      ['span', { class: 'sidenote-note__number', contenteditable: 'false' }, `${node.attrs.number}.`],
      ['span', { class: 'sidenote-note__content' }, 0],
    ]
  },
})

export const SidenoteRef = Node.create({
  name: 'sidenoteRef',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return { number: numberAttribute }
  },

  parseHTML() {
    return [{ tag: 'sup[data-sidenote-ref]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'sup',
      mergeAttributes(HTMLAttributes, {
        class: 'sidenote-ref',
        'data-sidenote-ref': node.attrs.number,
        contenteditable: 'false',
      }),
      String(node.attrs.number),
    ]
  },
})

export const SidenoteBody = Node.create({
  name: 'sidenoteBody',
  content: 'paragraph',
  defining: true,

  addAttributes() {
    return { number: numberAttribute }
  },

  parseHTML() {
    return [{ tag: 'div[data-sidenote-body]', contentElement: '.sidenote-body__content' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-sidenote-body': '', class: 'sidenote-body' }),
      ['div', { class: 'sidenote-body__content' }, 0],
    ]
  },
})

export const Sidenote = Node.create({
  name: 'sidenote',
  group: 'block',
  content: 'sidenoteNote sidenoteBody',
  defining: true,
  isolating: true,

  addAttributes() {
    return { number: numberAttribute }
  },

  parseHTML() {
    return [{ tag: 'div[data-sidenote-row]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-sidenote-row': '', class: 'sidenote-row' }), 0]
  },

  addCommands() {
    return {
      insertSidenote:
        () =>
        ({ state, dispatch }) => {
          const { $from, empty } = state.selection
          if (!empty || !$from.parent.isTextblock || $from.parent.type.name !== 'paragraph') return false

          const rowType = state.schema.nodes.sidenote
          const noteType = state.schema.nodes.sidenoteNote
          const bodyType = state.schema.nodes.sidenoteBody
          const refType = state.schema.nodes.sidenoteRef
          const paragraphType = state.schema.nodes.paragraph
          if (!rowType || !noteType || !bodyType || !refType || !paragraphType) return false

          let number = 1
          state.doc.descendants(node => {
            if (node.type === rowType) {
              number = Math.max(number, Number(node.attrs.number || 0) + 1)
            }
          })

          const paragraph = $from.parent
          const paragraphStart = $from.before()
          const before = paragraph.content.cut(0, $from.parentOffset)
          const after = paragraph.content.cut($from.parentOffset)
          const note = noteType.create({ number })
          const reference = refType.create({ number })
          const bodyContent = before.append(Fragment.from(reference)).append(after)
          const bodyParagraph = paragraphType.create(paragraph.attrs, bodyContent)
          const body = bodyType.create({ number }, bodyParagraph)
          const row = rowType.create({ number }, [note, body])
          const tr = state.tr.replaceWith(paragraphStart, paragraphStart + paragraph.nodeSize, row)
          tr.setSelection(TextSelection.create(tr.doc, paragraphStart + 2))

          dispatch?.(tr.scrollIntoView())
          return true
        },
    }
  },
})

export default Sidenote
