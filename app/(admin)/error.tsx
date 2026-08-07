'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

/**
 * O plano original (Fase 6) só cria `error.tsx` em `(site)`. Sem este
 * arquivo, uma falha de banco numa tela do admin (Neon instável, por
 * exemplo) cairia na tela crua do Next em vez de uma UI consistente com o
 * resto do grupo. Deliberadamente sem `Ornament`: `(admin)` não usa a
 * moldura decorativa do convite em nenhuma outra tela (ver `login/page.tsx`
 * e `admin/page.tsx`), só o título em `font-display` e conteúdo centralizado.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Erro na área administrativa:', error)
  }, [error])

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-display text-3xl text-accent-light">Algo não saiu como esperado</h1>
      <p className="max-w-prose text-foreground/80">Tente novamente em instantes.</p>
      <Button onClick={reset}>Tentar de novo</Button>
    </main>
  )
}
