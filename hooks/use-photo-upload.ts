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
 *
 * Também não ramificamos por essa string para dizer "álbum cheio" quando o
 * teto de armazenamento é atingido: a mensagem do SDK nesse caso
 * (`"Failed to retrieve the client token"`) é idêntica à de qualquer outra
 * falha ao buscar o token (erro 500 genérico, rede caindo etc.), então
 * tentar distinguir pelo texto rotularia falhas comuns como "teto
 * atingido" incorretamente — pior do que a mensagem genérica. Por isso o
 * texto abaixo não promete que tentar de novo resolve (no teto, nunca
 * resolve) e dá um caminho para quando não resolver.
 */
const ERRO_ENVIO_GENERICO =
  'Não conseguimos enviar esta foto. Tente novamente e, se continuar sem funcionar, avise os anfitriões.'

/**
 * Identificador único de item, estável enquanto o item existe. Não usa
 * `crypto.randomUUID()` porque essa API só existe em contexto seguro
 * (HTTPS ou localhost) — em `http://192.168.x.x:3000`, exatamente como se
 * testa envio de foto num celular de verdade na rede local, ela é
 * `undefined` e chamar `addFiles` lança um `TypeError` síncrono: a lista
 * nunca popula e a tela não reage. O contador + timestamp + sufixo
 * aleatório abaixo não depende de contexto seguro, e é único entre
 * chamadas sucessivas de `addFiles` e entre arquivos de mesmo nome.
 */
let nextItemSequence = 0

function createItemId(): string {
  nextItemSequence += 1
  return `${Date.now()}-${nextItemSequence}-${Math.random().toString(36).slice(2, 8)}`
}

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
        id: createItemId(),
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
