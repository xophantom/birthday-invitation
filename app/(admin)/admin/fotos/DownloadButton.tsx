'use client'

import { downloadZip } from 'client-zip'
import { useState } from 'react'
import { getDownloadUrls } from './download-actions'
import { triggerBlobDownload } from './trigger-download'
import { Button } from '@/components/ui/Button'

type DownloadEntry = { url: string; name: string }

/**
 * Quantas fotos são buscadas em paralelo. Também é o teto de blobs de origem
 * vivos ao mesmo tempo: ~25 × 800KB ≈ 20MB.
 */
const BATCH_SIZE = 25

async function fetchEntry(entry: DownloadEntry) {
  const response = await fetch(entry.url)
  if (!response.ok) throw new Error(`Falha ao baixar ${entry.name}`)

  return { name: entry.name, input: await response.blob() }
}

/**
 * Entrega as fotos ao `client-zip` lote a lote, em vez de montar o array
 * inteiro antes de compactar.
 *
 * `downloadZip` aceita um `ForAwaitable` (`AsyncIterable | Iterable`) e
 * consome cada entrada sob demanda, gravando-a no stream do zip antes de
 * pedir a próxima — é o uso que o próprio README da biblioteca recomenda
 * para entradas buscadas por `fetch`. Como cada `batch` sai de escopo ao fim
 * da iteração, os blobs já escritos ficam sem referência e o coletor pode
 * liberá-los; o array de origem nunca cresce além de `BATCH_SIZE`.
 *
 * Antes desta mudança o array acumulava **todas** as fotos até o fim: no teto
 * de 1000 fotos a ~800KB, ~800MB de blobs de origem vivos ao mesmo tempo,
 * somados ao zip resultante. Como o `client-zip` armazena sem compressão, o
 * zip final continua tendo o tamanho da soma das fotos — o que esta mudança
 * elimina é a *segunda* cópia, não a primeira.
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

      // O progresso avança por lote, não por foto: com 1000 fotos, um
      // setState por foto seriam 1000 renderizações só para mexer num texto.
      const blob = await downloadZip(
        streamPhotoBlobs(entries, (fetched) =>
          setProgress(
            fetched < entries.length
              ? `Baixando ${fetched} de ${entries.length}...`
              : 'Compactando...'
          )
        )
      ).blob()

      // O texto muda, mas o botão continua desabilitado (`progress` segue
      // não-nulo) até a promise abaixo resolver: só então o object URL do
      // zip foi revogado e é seguro liberar um novo download. Dois toques
      // seguidos criariam dois zips inteiros vivos ao mesmo tempo — no teto
      // de 1000 fotos deste evento, quase 1,6GB, o bastante para matar a aba
      // num celular. Zerar `progress` mais cedo (como antes) reabilitava o
      // botão na hora, mesmo com o zip anterior ainda preso na memória pelos
      // ~3s de folga do `triggerBlobDownload` (ver o comentário lá: é só o
      // tempo do navegador *começar* a gravação, não do download inteiro
      // terminar) — daí o texto abaixo não prometer mais que isso.
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
