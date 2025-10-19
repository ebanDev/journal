import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import type { EditorView } from 'prosemirror-view'
import type { Command } from '@tiptap/core'

type LTMatch = {
  message: string
  offset: number
  length: number
  shortMessage?: string
  replacements?: { value: string }[]
  rule: { id: string; description?: string; issueType?: string; subId?: string }
}

type ParagraphInfo = {
  text: string
  offset: number
  from: number
  to: number
  lastModified: number
}

export const LT_PLUGIN_KEY = new PluginKey('lt-grammar-check')

export interface GrammarCheckOptions {
  endpoint: string
  language: string
  level?: 'default' | 'picky'
  debounceMs?: number
  modificationThreshold?: number // Only check paragraphs modified within this time (ms)
  isEnabled?: () => boolean // Function to check if grammar checking is enabled
  onShowSuggestion?: (position: { x: number; y: number }, data: any, range: { from: number; to: number }) => void
}

function debounce<F extends (...args: any[]) => void>(fn: F, ms: number) {
  let t: number | undefined
  return (...args: Parameters<F>) => {
    if (t) window.clearTimeout(t)
    t = window.setTimeout(() => fn(...args), ms)
  }
}

/**
 * Extract paragraphs from the document with their positions and modification times
 */
function extractParagraphs(view: EditorView, modifiedPositions: Set<number>): ParagraphInfo[] {
  const paragraphs: ParagraphInfo[] = []
  let globalOffset = 0
  const now = Date.now()

  view.state.doc.descendants((node, pos) => {
    if (node.type.name === 'paragraph' && node.textContent.trim()) {
      const text = node.textContent
      const from = pos + 1 // Start of paragraph content
      const to = pos + node.nodeSize - 1 // End of paragraph content
      
      // Check if this paragraph was recently modified
      const wasModified = Array.from(modifiedPositions).some(modPos => 
        modPos >= from && modPos <= to
      )
      
      paragraphs.push({
        text,
        offset: globalOffset,
        from,
        to,
        lastModified: wasModified ? now : 0
      })
      
      globalOffset += text.length + 1 // +1 for paragraph separator
    }
    return true
  })

  return paragraphs
}

/**
 * Map LanguageTool offsets back to ProseMirror positions within a paragraph
 */
function mapOffsetsToPositions(
  match: LTMatch, 
  paragraph: ParagraphInfo
): { from: number; to: number } | null {
  const localStart = match.offset - paragraph.offset
  const localEnd = localStart + match.length
  
  // Ensure the match is within this paragraph
  if (localStart < 0 || localEnd > paragraph.text.length) {
    return null
  }
  
  return {
    from: paragraph.from + localStart,
    to: paragraph.from + localEnd
  }
}

async function checkWithLT(
  endpoint: string, 
  text: string, 
  language: string, 
  level?: 'default' | 'picky'
): Promise<LTMatch[]> {
  // Respect the 20k character limit
  if (text.length > 20000) {
    text = text.substring(0, 20000)
  }
  
  const body = new URLSearchParams()
  body.set('text', text)
  body.set('language', language)
  if (level && level !== 'default') {
    body.set('level', level)
  }
  
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    
    if (!res.ok) {
      throw new Error(`LanguageTool error: ${res.status}`)
    }
    
    const json = await res.json()
    return json.matches as LTMatch[]
  } catch (error) {
    // Silently fail for free API rate limits
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
      modificationThreshold: 60000, // 1 minute
      isEnabled: () => true, // Default to enabled
      onShowSuggestion: undefined, // Callback for showing suggestions
    }
  },
  
  addProseMirrorPlugins() {
    const { endpoint, language, level, debounceMs, modificationThreshold, isEnabled, onShowSuggestion } = this.options
    let modifiedPositions = new Set<number>()
    let lastCheckTime = 0

    return [
      new Plugin({
        key: LT_PLUGIN_KEY,
        
        state: {
          init: () => DecorationSet.empty,
          apply(tr, old) {
            // Track modified positions
            if (tr.docChanged) {
              tr.steps.forEach((step) => {
                // Track document changes by examining the transaction mapping
                tr.mapping.maps.forEach(map => {
                  map.forEach((oldStart, oldEnd) => {
                    modifiedPositions.add(oldStart)
                    modifiedPositions.add(oldEnd)
                  })
                })
              })
            }
            
            // Apply decoration mapping
            let decorations = old.map(tr.mapping, tr.doc)
            
            // Check if we're setting new decorations or clearing them
            const meta = tr.getMeta(LT_PLUGIN_KEY)
            if (meta?.set !== undefined) {
              decorations = meta.set || DecorationSet.empty
            }
            
            return decorations
          },
        },
        
        view: (view) => {
          let destroyed = false
          
          const runGrammarCheck = async (forceFullCheck = false) => {
            if (destroyed || !isEnabled?.()) return
            
            const now = Date.now()
            const paragraphs = extractParagraphs(view, modifiedPositions)
            
            let paragraphsToCheck: ParagraphInfo[]
            
            if (forceFullCheck) {
              // Check all paragraphs
              paragraphsToCheck = paragraphs.filter(p => p.text.trim().length > 0)
            } else {
              // Only check paragraphs modified within the threshold
              paragraphsToCheck = paragraphs.filter(p => 
                p.lastModified > 0 && 
                (now - p.lastModified) < modificationThreshold!
              )
            }
            
            if (paragraphsToCheck.length === 0) {
              return
            }
            
            // Respect rate limits: max 20 requests per minute
            if (!forceFullCheck && now - lastCheckTime < 3000) { // 3 seconds between requests
              return
            }
            
            lastCheckTime = now
            
            // Combine paragraphs for checking
            const textToCheck = paragraphsToCheck.map(p => p.text).join('\n\n')
            
            if (!textToCheck.trim()) {
              return
            }
            
            try {
              const matches = await checkWithLT(endpoint, textToCheck, language, level)
              const decos: Decoration[] = []
              
              // Create a combined offset mapping
              let combinedOffset = 0
              const offsetMappings: { paragraph: ParagraphInfo; startOffset: number; endOffset: number }[] = []
              
              paragraphsToCheck.forEach(paragraph => {
                offsetMappings.push({
                  paragraph,
                  startOffset: combinedOffset,
                  endOffset: combinedOffset + paragraph.text.length
                })
                combinedOffset += paragraph.text.length + 2 // +2 for \n\n separator
              })
              
              // Map matches back to ProseMirror positions
              for (const match of matches) {
                // Find which paragraph this match belongs to
                const mapping = offsetMappings.find(m => 
                  match.offset >= m.startOffset && match.offset < m.endOffset
                )
                
                if (!mapping) continue
                
                // Adjust the match offset to be relative to the paragraph
                const adjustedMatch = {
                  ...match,
                  offset: match.offset - mapping.startOffset + mapping.paragraph.offset
                }
                
                const positions = mapOffsetsToPositions(adjustedMatch, mapping.paragraph)
                if (!positions || positions.to <= positions.from) continue
                
                const severity = match.rule?.issueType || 'misspelling'
                const className = severity === 'misspelling' ? 'lt-spelling' : 'lt-grammar'
                
                decos.push(
                  Decoration.inline(positions.from, positions.to, {
                    class: `lt-underline ${className}`,
                    title: match.shortMessage || match.message || 'Problème détecté',
                    'data-lt': JSON.stringify({
                      message: match.message,
                      replacements: (match.replacements || []).map(r => r.value).slice(0, 5),
                      ruleId: match.rule?.id,
                    }),
                    'data-from': positions.from.toString(),
                    'data-to': positions.to.toString(),
                  })
                )
              }
              
              // Get existing decorations
              const currentDecorations = LT_PLUGIN_KEY.getState(view.state) as DecorationSet
              let newDecorations = currentDecorations
              
              if (forceFullCheck) {
                // For full check, clear all existing decorations first
                newDecorations = DecorationSet.empty
              } else {
                // Remove decorations from recently modified paragraphs only
                paragraphsToCheck.forEach(paragraph => {
                  newDecorations = newDecorations.remove(
                    newDecorations.find(paragraph.from, paragraph.to)
                  )
                })
              }
              
              // Add new decorations
              if (decos.length > 0) {
                newDecorations = newDecorations.add(view.state.doc, decos)
              }
              
              const tr = view.state.tr.setMeta(LT_PLUGIN_KEY, { set: newDecorations })
              view.dispatch(tr)
              
              // Clear modified positions for checked paragraphs
              if (!forceFullCheck) {
                paragraphsToCheck.forEach(paragraph => {
                  for (let pos = paragraph.from; pos <= paragraph.to; pos++) {
                    modifiedPositions.delete(pos)
                  }
                })
              }
              
            } catch (error) {
              console.warn('Grammar check failed:', error)
            }
          }

          const debouncedCheck = debounce(runGrammarCheck, debounceMs!)
          
          // Store the runFullCheck function on the view DOM for external access
          ;(view.dom as any).__grammarCheckPlugin = {
            runFullCheck: () => runGrammarCheck(true)
          }

          return {
            update(view, prevState) {
              const docChanged = !prevState.doc.eq(view.state.doc)
              if (docChanged) {
                debouncedCheck()
              }
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
          
          // Handle clicks on grammar suggestions
          handleClick(view, pos, event) {
            const target = event.target as HTMLElement
            if (target.classList.contains('lt-underline')) {
              const ltData = target.getAttribute('data-lt')
              const fromAttr = target.getAttribute('data-from')
              const toAttr = target.getAttribute('data-to')
              
              if (ltData && fromAttr && toAttr && onShowSuggestion) {
                try {
                  const data = JSON.parse(ltData)
                  const from = parseInt(fromAttr)
                  const to = parseInt(toAttr)
                  
                  // Get click position for popup
                  const rect = target.getBoundingClientRect()
                  const position = {
                    x: rect.left + rect.width / 2,
                    y: rect.bottom + 8
                  }
                  
                  onShowSuggestion(position, data, { from, to })
                  return true
                } catch (e) {
                  console.warn('Failed to parse grammar data:', e)
                }
              }
            }
            return false
          },
        },
      }),
    ]
  },
})

// Utility function to trigger full grammar check
export function triggerFullGrammarCheck(view: EditorView) {
  if ((view.dom as any).__grammarCheckPlugin) {
    ;(view.dom as any).__grammarCheckPlugin.runFullCheck()
  }
}
