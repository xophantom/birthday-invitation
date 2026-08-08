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
 * Shown when the upload itself fails. `error.message` is never surfaced here:
 * the `@vercel/blob` SDK discards the error response body and throws its own
 * English message ("Failed to retrieve the client token"), even when our token
 * route replied with a curated pt-BR one.
 *
 * That same SDK message covers both "storage cap reached" and any other token
 * failure, so branching on it would mislabel ordinary failures. Hence wording
 * that doesn't promise a retry will work, and offers a way out if it doesn't.
 */
const ERRO_ENVIO_GENERICO =
  'Não conseguimos enviar esta foto. Tente novamente e, se continuar sem funcionar, avise os anfitriões.'

/**
 * Not `crypto.randomUUID()`: that API only exists in a secure context, so on
 * `http://192.168.x.x:3000` — exactly how photo upload gets tested from a real
 * phone — it is `undefined` and `addFiles` throws a synchronous TypeError.
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
        // `useImageCompression` errors are already curated pt-BR — safe to
        // show to the guest as they are.
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
          // `registerPhoto` messages are already curated pt-BR.
          update(item.id, { status: 'error', error: result.message ?? ERRO_ENVIO_GENERICO })
          return
        }

        update(item.id, { status: 'done' })
      } catch (error) {
        // Party wifi drops mid-upload as a rule, not an exception. Neither
        // that nor any SDK failure reaches the guest as `error.message`.
        console.error('Falha no envio da foto ao armazenamento:', error)
        update(item.id, { status: 'error', error: ERRO_ENVIO_GENERICO })
      }
    },
    [compress, uploaderName, update]
  )

  const uploadAll = useCallback(async () => {
    // Sequential on purpose: on party wifi, eight parallel uploads tend to
    // take each other down rather than finish faster.
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
