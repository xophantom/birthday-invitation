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
        // Fechamos o <dialog> nativamente em vez de chamar onClose aqui: o
        // evento "close" disparado por close() é a única fonte de verdade,
        // cobrindo backdrop, Esc e fechamento programático sem duplicar o
        // callback nem disparar onClose quando o pai fecha por conta própria.
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
