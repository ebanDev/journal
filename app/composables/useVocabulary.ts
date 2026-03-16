const STORAGE_KEY = 'grammar-vocabulary-v1'

let _words: Set<string> | null = null

function getWords(): Set<string> {
  if (_words === null) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : []
      _words = new Set(Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string').map(v => v.toLowerCase()) : [])
    } catch {
      _words = new Set()
    }
  }
  return _words
}

function persist(words: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...words]))
  } catch { /* quota / SSR — ignore */ }
}

export function useVocabulary() {
  function isAllowed(word: string): boolean {
    return getWords().has(word.toLowerCase())
  }

  function addWord(word: string): void {
    const key = word.toLowerCase()
    const words = getWords()
    if (!words.has(key)) { words.add(key); persist(words) }
  }

  function removeWord(word: string): void {
    const words = getWords()
    if (words.delete(word.toLowerCase())) persist(words)
  }

  function getAll(): string[] {
    return [...getWords()]
  }

  return { isAllowed, addWord, removeWord, getAll }
}
