import Link from 'next/link'
import type { ReactNode } from 'react'
import { Ornament } from '@/components/ui/Ornament'

type SectionShellProps = {
  title: string
  subtitle?: string
  children: ReactNode
}

export function SectionShell({ title, subtitle, children }: SectionShellProps) {
  return (
    <main className="flex w-full flex-1 flex-col px-5 py-10">
      <header className="flex flex-col items-center gap-4 text-center">
        <Ornament placement="top" />
        <h1 className="font-display text-4xl text-accent-light">{title}</h1>
        {subtitle && <p className="max-w-prose text-foreground/80">{subtitle}</p>}
      </header>

      <div className="mt-10 flex-1">{children}</div>

      <footer className="mt-12 flex justify-center">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-full border border-accent/50 px-6 text-sm text-accent-light transition-colors hover:bg-accent/10"
        >
          Voltar ao convite
        </Link>
      </footer>
    </main>
  )
}
