import type { Metadata } from 'next'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = {
  title: 'Entrar',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
      <h1 className="font-display text-3xl text-accent-light">Área da família</h1>
      <LoginForm />
    </main>
  )
}
