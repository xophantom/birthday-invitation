'use client'

import { useState, useTransition } from 'react'
import { setFavorite } from './actions'
import { Modal } from '@/components/ui/Modal'
import type { Photo } from '@/lib/db'

export function PhotoReviewGrid({ photos }: { photos: Photo[] }) {
  const [opened, setOpened] = useState<Photo | null>(null)
  const [favorites, setFavorites] = useState<Record<string, boolean>>(
    Object.fromEntries(photos.map((photo) => [photo.id, photo.isFavorite]))
  )
  const [favoriteError, setFavoriteError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // Otimista no toque, mas não mentiroso: se a Server Action devolver erro
  // ou a chamada de rede falhar, a estrela volta ao estado anterior e o
  // anfitrião vê um aviso — em vez de achar que salvou quando não salvou.
  function toggle(photo: Photo) {
    const next = !favorites[photo.id]
    setFavorites((current) => ({ ...current, [photo.id]: next }))
    setFavoriteError(null)

    startTransition(async () => {
      try {
        const result = await setFavorite(photo.id, next)
        if (!result.ok) {
          setFavorites((current) => ({ ...current, [photo.id]: !next }))
          setFavoriteError(result.message ?? 'Não foi possível salvar a alteração.')
        }
      } catch (error) {
        console.error('Falha ao favoritar foto:', error)
        setFavorites((current) => ({ ...current, [photo.id]: !next }))
        setFavoriteError('Não foi possível salvar a alteração. Tente novamente.')
      }
    })
  }

  if (photos.length === 0) {
    return <p className="text-foreground/60">Nenhuma foto enviada ainda.</p>
  }

  return (
    <>
      {favoriteError && (
        <p role="alert" className="text-sm text-danger">
          {favoriteError}
        </p>
      )}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo) => (
          <li key={photo.id} className="relative">
            <button
              type="button"
              onClick={() => setOpened(photo)}
              className="block w-full overflow-hidden rounded-xl border border-accent/20"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.thumbUrl}
                alt={
                  photo.uploadedBy
                    ? `Foto enviada por ${photo.uploadedBy}`
                    : 'Foto enviada por um convidado'
                }
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
            </button>

            <button
              type="button"
              onClick={() => toggle(photo)}
              aria-pressed={favorites[photo.id]}
              aria-label={
                favorites[photo.id] ? 'Remover das favoritas' : 'Marcar como favorita'
              }
              className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-lg"
            >
              {favorites[photo.id] ? '★' : '☆'}
            </button>
          </li>
        ))}
      </ul>

      <Modal open={opened !== null} onClose={() => setOpened(null)} title="Foto ampliada">
        {opened && (
          <figure className="flex flex-col gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={opened.fullUrl}
              alt=""
              className="max-h-[75dvh] w-full rounded-xl object-contain"
            />
            <figcaption className="flex items-center justify-between text-sm text-foreground/70">
              <span>{opened.uploadedBy ?? 'Convidado não identificado'}</span>
              <button
                type="button"
                onClick={() => setOpened(null)}
                className="text-accent-light underline underline-offset-4"
              >
                Fechar
              </button>
            </figcaption>
          </figure>
        )}
      </Modal>
    </>
  )
}
