import type { Metadata } from 'next'
import { NotFoundContent } from '@/components/errors/NotFoundContent'

/** Without this the 404 inherits the root layout's `title.default` and
 *  announces itself as the invitation. */
export const metadata: Metadata = {
  title: 'Página não encontrada',
}

/**
 * Handles URLs matching no route at all. A `not-found.tsx` inside `(site)`
 * only covers `notFound()` calls within that group; Next falls back to this
 * root file for everything else. It still renders inside `app/layout.tsx`,
 * which applies the `--brand-*` palette, so it looks the same as the group
 * version without that group's frame.
 */
export default function NotFound() {
  return <NotFoundContent />
}
