import { useCallback } from "react"
import { toast as sonnerToast } from "sonner"

export type ToastType = "success" | "error" | "warning"

export interface ToastMessage {
  id: number
  message: string
  type: ToastType
}

export function useToast() {
  const toast = useCallback((message: string, type: ToastType = "success") => {
    if (type === "success") {
      sonnerToast.success(message)
    } else if (type === "error") {
      sonnerToast.error(message)
    } else if (type === "warning") {
      sonnerToast.warning(message)
    } else {
      sonnerToast(message)
    }
  }, [])

  const removeToast = useCallback(() => {}, [])

  return { toasts: [], toast, removeToast }
}
