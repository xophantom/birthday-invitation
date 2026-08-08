'use client'

import { downloadZip } from 'client-zip'
import { useState } from 'react'
import { getDownloadUrls } from './download-actions'
import { triggerBlobDownload } from './trigger-download'
import { Button } from '@/components/ui/Button'

type DownloadEntry = { url: string; name: string }

/** Photos fetched in parallel, and therefore the cap on source blobs alive at
 *  once: ~25 x 800KB = ~20MB. */
const BATCH_SIZE = 25

async function fetchEntry(entry: DownloadEntry) {
  const response = await fetch(entry.url)
  if (!response.ok) throw new Error(`Falha ao baixar ${entry.name}`)

  return { name: entry.name, input: await response.blob() }
}

/**
 * Feeds photos to `client-zip` batch by batch instead of building the whole
 * array up front. `downloadZip` consumes an async iterable on demand, writing
 * each entry into the zip stream before asking for the next, so each batch
 * goes out of scope and can be collected — the source side never grows past
 * `BATCH_SIZE`.
 *
 * At the 1000-photo cap that is the difference between ~20MB and ~800MB of
 * source blobs held alongside the resulting zip.
 */
async function* streamPhotoBlobs(
  entries: DownloadEntry[],
  onBatchFetched: (fetched: number) => void
): AsyncGenerator<{ name: string; input: Blob }> {
  for (let index = 0; index < entries.length; index += BATCH_SIZE) {
    const batch = await Promise.all(entries.slice(index, index + BATCH_SIZE).map(fetchEntry))

    onBatchFetched(Math.min(index + BATCH_SIZE, entries.length))
    yield* batch
  }
}

export function DownloadButton() {
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleDownload(onlyFavorites: boolean) {
    setError(null)
    setProgress('Preparando...')

    try {
      const entries = await getDownloadUrls(onlyFavorites)

      if (entries.length === 0) {
        setProgress(null)
        setError(onlyFavorites ? 'Nenhuma foto favoritada.' : 'Nenhuma foto enviada.')
        return
      }

      // Progress advances per batch: one setState per photo would be 1000
      // renders just to update a line of text.
      const blob = await downloadZip(
        streamPhotoBlobs(entries, (fetched) =>
          setProgress(
            fetched < entries.length
              ? `Baixando ${fetched} de ${entries.length}...`
              : 'Compactando...'
          )
        )
      ).blob()

      // The button stays disabled (`progress` non-null) until the promise
      // below resolves and the zip's object URL is revoked. Two quick taps
      // would hold two whole zips at once — near 1.6GB at this event's cap,
      // enough to kill the tab on a phone.
      setProgress('Salvando o arquivo...')
      await triggerBlobDownload(blob, onlyFavorites ? 'fotos-favoritas.zip' : 'fotos-da-festa.zip')

      setProgress(null)
    } catch (downloadError) {
      console.error('Falha no download em lote:', downloadError)
      setProgress(null)
      setError('Não foi possível concluir o download. Tente novamente.')
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => handleDownload(true)} disabled={progress !== null}>
          Baixar favoritas
        </Button>
        <Button onClick={() => handleDownload(false)} disabled={progress !== null}>
          Baixar todas
        </Button>
      </div>
      {progress && (
        <p role="status" className="text-xs text-foreground/70">
          {progress}
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
