import type { Metadata } from 'next'
import { NotFoundContent } from '@/components/errors/NotFoundContent'

/** Mesmo título do 404 da raiz — ver `app/not-found.tsx`. */
export const metadata: Metadata = {
  title: 'Página não encontrada',
}

export default function NotFound() {
  return <NotFoundContent />
}
