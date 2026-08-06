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
        // O dialog não tem estilo próprio, então sua área É o backdrop:
        // um clique cujo alvo é ele mesmo aconteceu fora do conteúdo.
        if (event.target === ref.current) onClose()
      }}
      className="m-auto w-[min(92vw,64rem)] bg-transparent p-0 backdrop:bg-black/80"
    >
      <div className="max-h-[90dvh] overflow-y-auto rounded-2xl border border-ouro/30 bg-esmeralda p-4 text-creme">
        {children}
      </div>
    </dialog>
  )
}
