import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import type { EditorView } from 'prosemirror-view'
import type { Node as PMNode } from '@tiptap/pm/model'
import { useVocabulary } from '~/composables/useVocabulary'

type LTMatch = {
  message: string
  offset: number
  length: number
  shortMessage?: string
  replacements?: { value: string }[]
  rule: { id: string; description?: string; issueType?: string; subId?: string }
}

type ParagraphInfo = {
  node: PMNode
  text: string
  offset: number
  from: number
  to: number
  lastModified: number
  mathNodes: Array<{ textOffset: number; docStart: number; docEnd: number }>
}

export const LT_PLUGIN_KEY = new PluginKey('lt-grammar-check')

export interface GrammarCheckOptions {
  endpoint: string
  language: string
  level?: 'default' | 'picky'
  debounceMs?: number
  modificationThreshold?: number
  isEnabled?: () => boolean
  onShowSuggestion?: (position: { x: number; y: number }, data: any, range: { from: number; to: number }) => void
}

function debounce<F extends (...args: any[]) => void>(fn: F, ms: number) {
  let t: number | undefined
  return (...args: Parameters<F>) => {
    if (t) window.clearTimeout(t)
    t = window.setTimeout(() => fn(...args), ms)
  }
}

function extractParagraphs(view: EditorView, modifiedPositions: Set<number>): ParagraphInfo[] {
  const paragraphs: ParagraphInfo[] = []
  let globalOffset = 0
  const now = Date.now()

  view.state.doc.descendants((node, pos) => {
    if (node.type.name === 'paragraph' && node.textContent.trim()) {
      const text = node.textContent
      const from = pos + 1
      const to = pos + node.nodeSize - 1

      const mathNodes: Array<{ textOffset: number; docStart: number; docEnd: number }> = []
      let textOffset = 0

      node.forEach((child, childOffset) => {
        const docStart = from + childOffset
        if (child.type && (child.type.name === 'inlineMath' || child.type.name === 'blockMath')) {
          mathNodes.push({ textOffset, docStart, docEnd: docStart + child.nodeSize })
        }
        textOffset += child.isText ? (child.text?.length ?? 0) : child.textContent.length
      })

      const wasModified = Array.from(modifiedPositions).some(p => p >= from && p <= to)

      paragraphs.push({
        node, text, offset: globalOffset, from, to,
        lastModified: wasModified ? now : 0,
        mathNodes
      })

      globalOffset += text.length + 2 // +2 matches the '\n\n' join used in checkWithLT
    }
    return true
  })

  return paragraphs
}

// Maps a paragraph-local character range to ProseMirror document positions.
// localStart and length are relative to paragraph.text — do NOT add paragraph.offset.
function mapOffsetsToPositions(
  localStart: number,
  length: number,
  paragraph: ParagraphInfo
): { from: number; to: number } | null {
  const localEnd = localStart + length

  if (localStart < 0 || localEnd > paragraph.text.length) return null

  let fromPos: number | null = null
  let toPos: number | null = null
  let textCursor = 0

  paragraph.node.forEach((child, childOffset) => {
    if (fromPos !== null && toPos !== null) return

    const childText = child.isText ? child.text ?? '' : child.textContent
    const childLength = childText.length
    if (childLength === 0) return

    const childEnd = textCursor + childLength

    if (fromPos === null && localStart >= textCursor && localStart <= childEnd)
      fromPos = paragraph.from + childOffset + (localStart - textCursor)

    if (localEnd >= textCursor && localEnd <= childEnd)
      toPos = paragraph.from + childOffset + (localEnd - textCursor)

    textCursor = childEnd
  })

  if (fromPos === null) fromPos = paragraph.from
  if (toPos === null) toPos = paragraph.to
  if (fromPos >= toPos) return null

  return { from: fromPos, to: toPos }
}

function matchesNearMathNode(paragraph: ParagraphInfo, from: number, to: number): boolean {
  return paragraph.mathNodes.some(({ docStart, docEnd }) => {
    const start = Math.max(paragraph.from, docStart - 1)
    const end = Math.min(paragraph.to, docEnd + 1)
    return from <= end && to >= start
  })
}

async function checkWithLT(
  endpoint: string,
  text: string,
  language: string,
  level?: 'default' | 'picky'
): Promise<LTMatch[]> {
  if (text.length > 20000) text = text.substring(0, 20000)

  const body = new URLSearchParams()
  body.set('text', text)
  body.set('language', language)
  if (level && level !== 'default') body.set('level', level)

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    if (!res.ok) throw new Error(`LanguageTool error: ${res.status}`)
    const json = await res.json()
    return json.matches as LTMatch[]
  } catch (error) {
    console.warn('LanguageTool API error:', error)
    return []
  }
}

export const GrammarCheck = Extension.create<GrammarCheckOptions>({
  name: 'grammarCheck',

  addOptions() {
    return {
      endpoint: 'https://api.languagetool.org/v2/check',
      language: 'fr',
      level: 'picky',
      debounceMs: 1000,
      modificationThreshold: 60000,
      isEnabled: () => true,
      onShowSuggestion: undefined,
    }
  },

  addProseMirrorPlugins() {
    const { endpoint, language, level, debounceMs, modificationThreshold, isEnabled, onShowSuggestion } = this.options
    const { isAllowed } = useVocabulary()
    let modifiedPositions = new Set<number>()
    let lastCheckTime = 0

    return [
      new Plugin({
        key: LT_PLUGIN_KEY,

        state: {
          init: () => DecorationSet.empty,
          apply(tr, old) {
            if (tr.docChanged) {
              tr.mapping.maps.forEach(map => {
                map.forEach((oldStart, oldEnd) => {
                  modifiedPositions.add(oldStart)
                  modifiedPositions.add(oldEnd)
                })
              })
            }

            let decorations = old.map(tr.mapping, tr.doc)
            const meta = tr.getMeta(LT_PLUGIN_KEY)
            if (meta?.set !== undefined) decorations = meta.set || DecorationSet.empty
            return decorations
          },
        },

        view: (view) => {
          let destroyed = false

          const runGrammarCheck = async (forceFullCheck = false) => {
            if (destroyed || !isEnabled?.()) return

            const now = Date.now()
            const paragraphs = extractParagraphs(view, modifiedPositions)

            const paragraphsToCheck = forceFullCheck
              ? paragraphs.filter(p => p.text.trim().length > 0)
              : paragraphs.filter(p => p.lastModified > 0 && (now - p.lastModified) < modificationThreshold!)

            if (paragraphsToCheck.length === 0) return
            if (!forceFullCheck && now - lastCheckTime < 3000) return

            lastCheckTime = now

            const textToCheck = paragraphsToCheck.map(p => p.text).join('\n\n')
            if (!textToCheck.trim()) return

            try {
              const matches = await checkWithLT(endpoint, textToCheck, language, level)
              const decos: Decoration[] = []

              let combinedOffset = 0
              const offsetMappings = paragraphsToCheck.map(paragraph => {
                const mapping = { paragraph, startOffset: combinedOffset, endOffset: combinedOffset + paragraph.text.length }
                combinedOffset += paragraph.text.length + 2
                return mapping
              })

              for (const match of matches) {
                const mapping = offsetMappings.find(m => match.offset >= m.startOffset && match.offset < m.endOffset)
                if (!mapping) continue

                const localStart = match.offset - mapping.startOffset
                const positions = mapOffsetsToPositions(localStart, match.length, mapping.paragraph)
                if (!positions || positions.to <= positions.from) continue
                if (matchesNearMathNode(mapping.paragraph, positions.from, positions.to)) continue

                const word = mapping.paragraph.text.slice(localStart, localStart + match.length)
                if (isAllowed(word)) continue

                const severity = match.rule?.issueType || 'misspelling'
                const ltData = {
                  message: match.message,
                  replacements: (match.replacements || []).map(r => r.value).slice(0, 5),
                  ruleId: match.rule?.id,
                  word,
                }

                decos.push(
                  Decoration.inline(positions.from, positions.to, {
                    class: `lt-underline ${severity === 'misspelling' ? 'lt-spelling' : 'lt-grammar'}`,
                    title: match.shortMessage || match.message || 'Problème détecté',
                  }, { ltData })
                )
              }

              let newDecorations = LT_PLUGIN_KEY.getState(view.state) as DecorationSet

              if (forceFullCheck) {
                newDecorations = DecorationSet.empty
              } else {
                paragraphsToCheck.forEach(p => {
                  newDecorations = newDecorations.remove(newDecorations.find(p.from, p.to))
                })
              }

              if (decos.length > 0) newDecorations = newDecorations.add(view.state.doc, decos)

              view.dispatch(view.state.tr.setMeta(LT_PLUGIN_KEY, { set: newDecorations }))

              if (forceFullCheck) {
                modifiedPositions.clear()
              } else {
                paragraphsToCheck.forEach(p => {
                  for (let pos = p.from; pos <= p.to; pos++) modifiedPositions.delete(pos)
                })
              }
            } catch (error) {
              console.warn('Grammar check failed:', error)
            }
          }

          const debouncedCheck = debounce(runGrammarCheck, debounceMs!);
          (view.dom as any).__grammarCheckPlugin = { runFullCheck: () => runGrammarCheck(true) }

          return {
            update(view, prevState) {
              if (!prevState.doc.eq(view.state.doc)) debouncedCheck()
            },
            destroy() {
              destroyed = true
              delete (view.dom as any).__grammarCheckPlugin
            },
          }
        },

        props: {
          decorations(state) {
            return LT_PLUGIN_KEY.getState(state) as DecorationSet
          },

          handleClick(view, pos, event) {
            const target = event.target as HTMLElement
            if (!target.classList.contains('lt-underline') || !onShowSuggestion) return false

            const decoState = LT_PLUGIN_KEY.getState(view.state) as DecorationSet
            const deco = decoState.find(Math.max(0, pos - 1), pos + 2).find(d => (d.spec as any)?.ltData)
            if (!deco) return false

            const rect = target.getBoundingClientRect()
            onShowSuggestion(
              { x: rect.left + rect.width / 2, y: rect.bottom + 8 },
              (deco.spec as any).ltData,
              { from: deco.from, to: deco.to }
            )
            return true
          },
        },
      }),
    ]
  },
})

export function triggerFullGrammarCheck(view: EditorView) {
  if ((view.dom as any).__grammarCheckPlugin) {
    ;(view.dom as any).__grammarCheckPlugin.runFullCheck()
  }
}
