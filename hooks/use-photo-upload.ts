'use client'

import { upload } from '@vercel/blob/client'
import { useCallback, useState } from 'react'
import { registerPhoto } from '@/app/(site)/fotos/actions'
import { useImageCompression, type CompressedPair } from '@/hooks/use-image-compression'

export type UploadStatus = 'pending' | 'compressing' | 'uploading' | 'done' | 'error'

export type UploadItem = {
  id: string
  name: string
  file: File
  status: UploadStatus
  error?: string
}

/**
 * Mensagem genérica mostrada ao convidado quando o upload em si falha
 * (depois da compressão). Nunca usamos `error.message` dessa etapa: o SDK do
 * `@vercel/blob` e falhas de rede chegam em inglês e citam detalhe interno
 * (ex.: "Vercel Blob: Failed to retrieve the client token", ou o nome da
 * loja) — mesmo quando o motivo real é uma mensagem pt-BR que a nossa própria
 * rota de token devolveu, porque o SDK descarta o corpo da resposta de erro
 * e lança a mensagem genérica dele. Ver `uploadOne`.
 */
const ERRO_ENVIO_GENERICO = 'Não conseguimos enviar esta foto. Tente novamente.'

export function usePhotoUpload(uploaderName: string | null) {
  const { compress } = useImageCompression()
  const [items, setItems] = useState<UploadItem[]>([])

  const update = useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    )
  }, [])

  const addFiles = useCallback((files: File[]) => {
    setItems(
      files.map((file) => ({
        // `crypto.randomUUID()` em vez de `${index}-${file.name}`: o índice
        // reinicia a cada chamada e o nome do arquivo pode se repetir, então
        // duas seleções seguidas (ou dois arquivos de mesmo nome numa única
        // seleção) podiam colidir e uma sobrescrever o estado da outra.
        id: crypto.randomUUID(),
        name: file.name,
        file,
        status: 'pending' as const,
      }))
    )
  }, [])

  const uploadOne = useCallback(
    async (item: UploadItem) => {
      update(item.id, { status: 'compressing', error: undefined })

      let pair: CompressedPair
      try {
        pair = await compress(item.file)
      } catch (error) {
        // Erros daqui já são pt-BR e curados por useImageCompression (HEIC
        // não suportado, arquivo corrompido, canvas indisponível etc.) —
        // seguros para mostrar ao convidado como estão.
        console.error('Falha ao comprimir foto:', error)
        update(item.id, {
          status: 'error',
          error: error instanceof Error ? error.message : ERRO_ENVIO_GENERICO,
        })
        return
      }

      update(item.id, { status: 'uploading' })
      const stamp = `${Date.now()}-${item.id}`

      try {
        const [fullBlob, thumbBlob] = await Promise.all([
          upload(`photos/${stamp}-full.jpg`, pair.full, {
            access: 'public',
            handleUploadUrl: '/api/photos/upload',
          }),
          upload(`photos/${stamp}-thumb.jpg`, pair.thumb, {
            access: 'public',
            handleUploadUrl: '/api/photos/upload',
          }),
        ])

        const result = await registerPhoto({
          fullUrl: fullBlob.url,
          thumbUrl: thumbBlob.url,
          fullPathname: fullBlob.pathname,
          thumbPathname: thumbBlob.pathname,
          uploadedBy: uploaderName?.trim() || null,
        })

        if (!result.ok) {
          // Mensagem já pt-BR e genérica (registerPhoto, Task 5) — segura
          // para mostrar como está.
          update(item.id, { status: 'error', error: result.message ?? ERRO_ENVIO_GENERICO })
          return
        }

        update(item.id, { status: 'done' })
      } catch (error) {
        // Conexão de festa é ruim: rede caindo no meio do envio é o caso
        // comum aqui, não a exceção. Isso e qualquer outra falha do SDK do
        // Blob (teto de armazenamento, token expirado, loja indisponível)
        // chegam em inglês e com detalhe interno — nunca repassamos
        // `error.message` ao convidado, só ao console, para diagnóstico.
        console.error('Falha no envio da foto ao armazenamento:', error)
        update(item.id, { status: 'error', error: ERRO_ENVIO_GENERICO })
      }
    },
    [compress, uploaderName, update]
  )

  const uploadAll = useCallback(async () => {
    // Sequencial de propósito: conexão de festa é ruim, e paralelizar oito
    // uploads costuma derrubar todos em vez de acelerar.
    for (const item of items) {
      if (item.status === 'done') continue
      await uploadOne(item)
    }
  }, [items, uploadOne])

  const retry = useCallback(
    async (id: string) => {
      const item = items.find((candidate) => candidate.id === id)
      if (item) await uploadOne(item)
    },
    [items, uploadOne]
  )

  const reset = useCallback(() => setItems([]), [])

  return { items, addFiles, uploadAll, retry, reset }
}
