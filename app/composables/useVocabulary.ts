const STORAGE_KEY = 'grammar-vocabulary-v1'

function loadFromStorage(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set((parsed as unknown[]).filter(v => typeof v === 'string').map((v) => (v as string).toLowerCase()))
  } catch {
    return new Set()
  }
}

function saveToStorage(words: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...words]))
  } catch {
    // localStorage unavailable (SSR, private mode quota, etc.) — silently ignore
  }
}

// Module-level singleton so every call site shares the same reactive state.
// Lazy-initialised on first use so SSR doesn't blow up.
let _words: Set<string> | null = null

function getWords(): Set<string> {
  if (_words === null) {
    _words = loadFromStorage()
  }
  return _words
}

export function useVocabulary() {
  /**
   * Returns true when `word` (case-insensitive) is in the allowlist.
   */
  function isAllowed(word: string): boolean {
    return getWords().has(word.toLowerCase())
  }

  /**
   * Add `word` to the allowlist and persist it.
   */
  function addWord(word: string): void {
    const key = word.toLowerCase()
    const words = getWords()
    if (!words.has(key)) {
      words.add(key)
      saveToStorage(words)
    }
  }

  /**
   * Remove `word` from the allowlist and persist.
   */
  function removeWord(word: string): void {
    const words = getWords()
    if (words.delete(word.toLowerCase())) {
      saveToStorage(words)
    }
  }

  /**
   * The full allowlist as a plain array (for display purposes).
   */
  function getAll(): string[] {
    return [...getWords()]
  }

  return { isAllowed, addWord, removeWord, getAll }
}
