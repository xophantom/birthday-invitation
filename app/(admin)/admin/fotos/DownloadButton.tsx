'use client'

import { downloadZip } from 'client-zip'
import { useState } from 'react'
import { getDownloadUrls } from './download-actions'
import { Button } from '@/components/ui/Button'

const BATCH_SIZE = 25

async function fetchBatch(entries: { url: string; name: string }[]) {
  return Promise.all(
    entries.map(async (entry) => {
      const response = await fetch(entry.url)
      if (!response.ok) throw new Error(`Falha ao baixar ${entry.name}`)
      return { name: entry.name, input: await response.blob() }
    })
  )
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

      const files: { name: string; input: Blob }[] = []

      for (let index = 0; index < entries.length; index += BATCH_SIZE) {
        const batch = entries.slice(index, index + BATCH_SIZE)
        files.push(...(await fetchBatch(batch)))
        setProgress(`Baixando ${files.length} de ${entries.length}...`)
      }

      setProgress('Compactando...')
      const blob = await downloadZip(files).blob()

      const href = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = href
      anchor.download = onlyFavorites ? 'fotos-favoritas.zip' : 'fotos-da-festa.zip'
      anchor.click()
      URL.revokeObjectURL(href)

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
      {progress && <p className="text-xs text-foreground/70">{progress}</p>}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
