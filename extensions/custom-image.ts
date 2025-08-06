import { mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import Image from '@tiptap/extension-image'

export interface CustomImageOptions {
  inline: boolean
  allowBase64: boolean
  HTMLAttributes: Record<string, any>
  onUpload?: (file: File) => Promise<string>
}

export const CustomImage = Image.extend<CustomImageOptions>({
  name: 'customImage',

  addOptions() {
    return {
      ...this.parent?.(),
      inline: false,
      allowBase64: false,
      HTMLAttributes: {},
      onUpload: undefined,
    }
  },

  addProseMirrorPlugins() {
    const { onUpload } = this.options

    if (!onUpload) {
      return []
    }

    return [
      new Plugin({
        key: new PluginKey('imageUpload'),
        props: {
          handleDOMEvents: {
            drop: (view, event) => {
              const hasFiles = event.dataTransfer?.files?.length

              if (!hasFiles) {
                return false
              }

              const images = Array.from(event.dataTransfer.files).filter(file =>
                /image/i.test(file.type)
              )

              if (images.length === 0) {
                return false
              }

              event.preventDefault()

              const { schema } = view.state
              const coordinates = view.posAtCoords({
                left: event.clientX,
                top: event.clientY,
              })

              if (!coordinates) return false

              images.forEach(async image => {
                try {
                  const src = await onUpload(image)
                  const node = schema.nodes.customImage.create({ src })
                  const transaction = view.state.tr.insert(coordinates.pos, node)
                  view.dispatch(transaction)
                } catch (error) {
                  console.error('Image upload failed:', error)
                }
              })

              return true
            },
            paste: (view, event) => {
              const hasFiles = event.clipboardData?.files?.length

              if (!hasFiles) {
                return false
              }

              const images = Array.from(event.clipboardData.files).filter(file =>
                /image/i.test(file.type)
              )

              if (images.length === 0) {
                return false
              }

              event.preventDefault()

              const { schema } = view.state
              const { selection } = view.state

              images.forEach(async image => {
                try {
                  const src = await onUpload(image)
                  const node = schema.nodes.customImage.create({ src })
                  const transaction = view.state.tr.replaceSelectionWith(node)
                  view.dispatch(transaction)
                } catch (error) {
                  console.error('Image upload failed:', error)
                }
              })

              return true
            },
          },
        },
      }),
    ]
  },
})
