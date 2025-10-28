declare module 'katex' {
  import type katexDefault from 'katex/types/katex'

  export * from 'katex/types/katex'
  const katex: typeof katexDefault
  export default katex
}
