import type { Metadata } from 'next'
import Link from 'next/link'
import { DownloadButton } from './DownloadButton'
import { PhotoReviewGrid } from './PhotoReviewGrid'
import { requireAdmin } from '@/lib/auth/session'
import { listPhotos } from '@/lib/db/queries/photos'

export const metadata: Metadata = {
  title: 'Fotos',
  robots: { index: false, follow: false },
}

const PAGE_SIZE = 60

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>
}) {
  await requireAdmin()

  const { cursor } = await searchParams
  const { items, nextCursor } = await listPhotos({ limit: PAGE_SIZE, cursor })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl text-accent-light">Fotos dos convidados</h1>
        <DownloadButton />
      </div>

      <PhotoReviewGrid photos={items} />

      {nextCursor && (
        <Link
          href={`/admin/fotos?cursor=${encodeURIComponent(nextCursor)}`}
          className="mx-auto inline-flex min-h-11 items-center rounded-full border border-accent/50 px-6 text-sm text-accent-light hover:bg-accent/10"
        >
          Carregar mais
        </Link>
      )}
    </div>
  )
}
