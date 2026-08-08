import type { Metadata } from 'next'
import { NotFoundContent } from '@/components/errors/NotFoundContent'

/** Same title as the root 404 — see `app/not-found.tsx`. */
export const metadata: Metadata = {
  title: 'Página não encontrada',
}

export default function NotFound() {
  return <NotFoundContent />
}
