'use client'

import { useState, useTransition } from 'react'
import { setFavorite } from './actions'
import { triggerBlobDownload } from './trigger-download'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { Photo } from '@/lib/db'
import { sanitizeUploaderName } from '@/lib/photos/filename'

/**
 * Fallback de download individual exigido pelo design: é a saída quando o zip
 * inteiro não é viável no aparelho — centenas de fotos num celular. Busca só
 * a foto aberta e a salva pelo mesmo caminho do lote.
 *
 * Não é um `<a download>` apontando direto para o Blob: o atributo `download`
 * é ignorado em URL de outra origem, então o toque abriria a imagem numa aba
 * em vez de salvá-la. Buscar e criar um object URL da mesma origem faz o
 * `download` valer. Se a busca falhar, a mensagem oferece justamente aquele
 * caminho manual, em vez de deixar o anfitrião sem saída.
 */
function PhotoDownloadButton({ photo }: { photo: Photo }) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'error'>('idle')

  async function handleClick() {
    setStatus('pending')

    try {
      const response = await fetch(photo.fullUrl)
      if (!response.ok) throw new Error(`Resposta ${response.status} ao baixar a foto`)

      triggerBlobDownload(
        await response.blob(),
        `${sanitizeUploaderName(photo.uploadedBy)}-${photo.id.slice(0, 8)}.jpg`
      )
      setStatus('idle')
    } catch (error) {
      console.error('Falha ao baixar foto individual:', error)
      setStatus('error')
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button variant="ghost" onClick={handleClick} disabled={status === 'pending'}>
        {status === 'pending' ? 'Baixando...' : 'Baixar esta foto'}
      </Button>
      {status === 'error' && (
        <p role="alert" className="text-xs text-danger">
          Não foi possível baixar.{' '}
          <a
            href={photo.fullUrl}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4"
          >
            Abra a foto
          </a>{' '}
          e salve pelo navegador.
        </p>
      )}
    </div>
  )
}

export function PhotoReviewGrid({ photos }: { photos: Photo[] }) {
  const [opened, setOpened] = useState<Photo | null>(null)
  const [favorites, setFavorites] = useState<Record<string, boolean>>({})
  const [favoriteError, setFavoriteError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  /**
   * O estado guarda só o que este componente alterou; o resto vem das props.
   *
   * "Carregar mais" é uma soft navigation para `/admin/fotos?cursor=…`: o
   * componente é reconciliado na mesma posição da árvore e **não remonta**,
   * então um `useState` inicializado a partir de `photos` continuaria com o
   * mapa da primeira página para sempre. Toda foto da página 2 em diante cairia
   * em `undefined` — estrela vazia numa foto favoritada, `aria-pressed` omitido
   * (o botão perde a semântica de toggle) e, como `!undefined === true`, o
   * primeiro toque regravaria `true` em vez de desfavoritar.
   */
  function isFavorite(photo: Photo): boolean {
    return favorites[photo.id] ?? photo.isFavorite
  }

  // Otimista no toque, mas não mentiroso: se a Server Action devolver erro
  // ou a chamada de rede falhar, a estrela volta ao estado anterior e o
  // anfitrião vê um aviso — em vez de achar que salvou quando não salvou.
  function toggle(photo: Photo) {
    const next = !isFavorite(photo)
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
              aria-pressed={isFavorite(photo)}
              aria-label={isFavorite(photo) ? 'Remover das favoritas' : 'Marcar como favorita'}
              className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-lg"
            >
              {isFavorite(photo) ? '★' : '☆'}
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
            <figcaption className="flex flex-wrap items-center justify-between gap-3 text-sm text-foreground/70">
              <span>{opened.uploadedBy ?? 'Convidado não identificado'}</span>
              <div className="flex items-center gap-3">
                {/* Chaveado pelo id: cada foto aberta começa com o botão limpo,
                    sem herdar o "Baixando..." ou o erro da foto anterior. */}
                <PhotoDownloadButton key={opened.id} photo={opened} />
                <button
                  type="button"
                  onClick={() => setOpened(null)}
                  className="inline-flex min-h-11 items-center px-2 text-accent-light underline underline-offset-4"
                >
                  Fechar
                </button>
              </div>
            </figcaption>
          </figure>
        )}
      </Modal>
    </>
  )
}
