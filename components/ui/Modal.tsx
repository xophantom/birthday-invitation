'use client'

import { useEffect, useRef, type ReactNode } from 'react'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(event) => {
        // The dialog is unstyled, so its own area IS the backdrop: a click
        // targeting it happened outside the content. Closing natively rather
        // than calling onClose keeps the "close" event as the single source of
        // truth for backdrop, Esc and programmatic closes alike.
        if (event.target === ref.current) ref.current?.close()
      }}
      className="m-auto w-[min(92vw,64rem)] bg-transparent p-0 backdrop:bg-black/80"
    >
      <div className="max-h-[90dvh] overflow-y-auto rounded-2xl border border-accent/30 bg-surface p-4 text-foreground">
        {children}
      </div>
    </dialog>
  )
}
