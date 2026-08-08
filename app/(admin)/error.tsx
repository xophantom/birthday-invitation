'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

/**
 * Without this, a DB failure on an admin screen would land on Next's raw error
 * page. Deliberately no `Ornament`: no other `(admin)` screen uses the
 * invitation's decorative frame.
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
