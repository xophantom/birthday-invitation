'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Ornament } from '@/components/ui/Ornament'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Erro na área do convite:', error)
  }, [error])

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <Ornament placement="top" />
      <h1 className="font-display text-3xl text-accent-light">
        Algo não saiu como esperado
      </h1>
      <p className="max-w-prose text-foreground/80">
        Tente novamente em instantes. Se continuar assim, avise a família.
      </p>
      <Button onClick={reset}>Tentar de novo</Button>
    </main>
  )
}
