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
        // Fecha ao clicar no backdrop: o alvo é o próprio dialog apenas fora do conteúdo.
        if (event.target === ref.current) onClose()
      }}
      className="m-auto max-h-[90dvh] w-[min(92vw,64rem)] rounded-2xl border border-ouro/30 bg-esmeralda p-4 text-creme backdrop:bg-black/80"
    >
      {children}
    </dialog>
  )
}
