export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T> | undefined
  cancel: () => void
  flush: () => ReturnType<T> | undefined
  pending: () => boolean
}

export function debounce<T extends (...args: any[]) => any>(func: T, wait = 0): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  let lastArgs: Parameters<T> | undefined
  let lastThis: ThisParameterType<T> | undefined
  let result: ReturnType<T> | undefined

  const invoke = () => {
    timeoutId = undefined
    if (lastArgs) {
      result = func.apply(lastThis as ThisParameterType<T>, lastArgs)
      lastArgs = undefined
      lastThis = undefined
    }
  }

  const debounced = function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    lastArgs = args
    lastThis = this

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(invoke, wait)
    return result
  } as DebouncedFunction<T>

  debounced.cancel = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
      timeoutId = undefined
    }
    lastArgs = undefined
    lastThis = undefined
  }

  debounced.flush = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
      invoke()
    }
    return result
  }

  debounced.pending = () => timeoutId !== undefined

  return debounced
}

export default debounce
