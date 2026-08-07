import Link from 'next/link'
import { Ornament } from '@/components/ui/Ornament'

/**
 * Compartilhado por `app/not-found.tsx` (URLs que não casam rota nenhuma) e
 * `app/(site)/not-found.tsx` (`notFound()` chamado dentro do grupo). Os dois
 * arquivos existem porque um `not-found` só dentro de `(site)` não cobre uma
 * URL totalmente desconhecida — ver decisão registrada no relatório da
 * Fase 6. Mantendo o conteúdo aqui, os dois ficam sempre idênticos.
 */
export function NotFoundContent() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <Ornament placement="top" />
      <h1 className="font-display text-3xl text-accent-light">Página não encontrada</h1>
      <p className="max-w-prose text-foreground/80">Esta parte do convite não existe.</p>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center rounded-full border border-accent/50 px-6 text-sm text-accent-light transition-colors hover:bg-accent/10"
      >
        Voltar ao convite
      </Link>
    </main>
  )
}
