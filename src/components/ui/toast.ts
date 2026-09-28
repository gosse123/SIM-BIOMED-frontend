export interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
  duration?: number
}

type ToastInput = Omit<Toast, 'id'>

let addToastFn: ((toast: ToastInput) => void) | null = null

export function toast(type: Toast['type'], message: string, duration?: number) {
  addToastFn?.({ type, message, duration })
}

export function registerToastListener(fn: (t: ToastInput) => void): () => void {
  addToastFn = fn
  return () => {
    if (addToastFn === fn) addToastFn = null
  }
}
