'use client'

import { useEffect } from 'react'
import { Check } from 'lucide-react'

export function Toast({
  message,
  onDismiss,
}: {
  message: string | null
  onDismiss: () => void
}) {
  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(onDismiss, 1800)
    return () => window.clearTimeout(timer)
  }, [message, onDismiss])

  return (
    // 항상 마운트해 두고 aria-live로 메시지 변화를 전달한다.
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-5"
    >
      {message && (
        <div className="animate-toast-in flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-caption font-medium text-background shadow-lg motion-reduce:animate-none">
          <Check aria-hidden="true" className="size-4" />
          {message}
        </div>
      )}
    </div>
  )
}
