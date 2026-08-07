import type { ReactNode } from 'react'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/session'
import { signOut } from './actions'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin()

  return (
    <>
      <header className="flex items-center justify-between border-b border-accent/20 px-5 py-4">
        <nav className="flex gap-5 text-sm">
          <Link href="/admin" className="text-accent-light hover:underline">
            Convidados
          </Link>
          <Link href="/admin/fotos" className="text-accent-light hover:underline">
            Fotos
          </Link>
        </nav>
        <form action={signOut}>
          <button type="submit" className="text-sm text-foreground/70 hover:text-foreground">
            Sair
          </button>
        </form>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">{children}</main>
    </>
  )
}
