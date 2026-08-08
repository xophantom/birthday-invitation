'use client'

import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormField } from '@/components/ui/FormField'
import { usePhotoUpload, type UploadStatus } from '@/hooks/use-photo-upload'

/** Keyed by `UploadStatus` so a new status breaks the typecheck here instead
 *  of silently rendering `undefined` in the list. */
const statusLabel: Record<UploadStatus, string> = {
  pending: 'Na fila',
  compressing: 'Preparando...',
  uploading: 'Enviando...',
  done: 'Enviada',
  error: 'Falhou',
}

/** Mirrors the HEIC extension check in `use-image-compression.ts`: `.heic`
 *  files often have an empty `type`, and without this the UI would reject a
 *  photo the compression step knows how to convert. */
function isSupportedImage(file: File): boolean {
  return file.type.startsWith('image/') || /\.hei[cf]$/i.test(file.name)
}

const inputClass =
  'min-h-11 w-full rounded-xl border border-accent/30 bg-surface-deep/60 px-4 text-foreground placeholder:text-foreground/40'

type PhotoUploaderProps = {
  maxPerUpload: number
  maxFileSizeMb: number
}

export function PhotoUploader({ maxPerUpload, maxFileSizeMb }: PhotoUploaderProps) {
  const [name, setName] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const successRef = useRef<HTMLDivElement>(null)
  const selectButtonRef = useRef<HTMLButtonElement>(null)
  // Keeps the focus effect below from firing on first paint, when the list is
  // empty because nothing has happened yet.
  const hadItemsRef = useRef(false)
  const { items, addFiles, uploadAll, retry, reset } = usePhotoUpload(name)

  const allDone = items.length > 0 && items.every((item) => item.status === 'done')
  const doneCount = items.filter((item) => item.status === 'done').length
  const errorCount = items.filter((item) => item.status === 'error').length
  // Not `items.length`: `uploadAll` skips items already `done`, so after a
  // partial send the button should count only what is left.
  const pendingCount = items.length - doneCount
  /**
   * Covers a standalone "retry", which `busy` does not: after a partial send
   * `busy` is already false while the retried photo is still uploading, and
   * pressing "Enviar" then would upload it a second time — duplicating both
   * blobs and the `photos` row. Both buttons gate on `busy || inFlight`.
   */
  const inFlight = items.some(
    (item) => item.status === 'compressing' || item.status === 'uploading'
  )

  /**
   * Feeds a live region that is mounted from first paint and never unmounted.
   * An `aria-live` region created at the same moment its text appears is not
   * reliably announced by every screen reader.
   */
  const liveMessage =
    items.length === 0
      ? ''
      : allDone
        ? 'Todas as fotos foram enviadas.'
        : `${doneCount} de ${items.length} fotos enviadas${
            errorCount > 0 ? `, ${errorCount} com falha` : ''
          }.`

  useEffect(() => {
    if (allDone) {
      successRef.current?.focus()
    }
  }, [allDone])

  /**
   * `reset()` unmounts the card and remounts the file picker. Without this,
   * focus falls to `<body>` and keyboard users tab from the top of the page
   * every time they go back to the picker.
   */
  useEffect(() => {
    if (items.length > 0) {
      hadItemsRef.current = true
      return
    }
    if (hadItemsRef.current) {
      selectButtonRef.current?.focus()
      hadItemsRef.current = false
    }
  }, [items.length])

  function handleSelect(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    // Clear so picking the same files again still fires `onChange`.
    event.target.value = ''
    setInputError(null)

    if (files.length === 0) return

    if (files.length > maxPerUpload) {
      setInputError(`Envie no máximo ${maxPerUpload} fotos por vez.`)
      return
    }

    const tooBig = files.find((file) => file.size > maxFileSizeMb * 1024 * 1024)
    if (tooBig) {
      setInputError(`"${tooBig.name}" passa de ${maxFileSizeMb}MB.`)
      return
    }

    const notImage = files.find((file) => !isSupportedImage(file))
    if (notImage) {
      setInputError(`"${notImage.name}" não é uma imagem.`)
      return
    }

    addFiles(files)
  }

  async function handleSend() {
    setBusy(true)
    await uploadAll()
    setBusy(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveMessage}
      </div>

      <FormField
        label="Seu nome"
        htmlFor="uploaderName"
        optional
        hint="Assim sabemos de quem veio a foto — mas pode pular."
      >
        <input
          id="uploaderName"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          aria-describedby="uploaderName-hint"
          aria-invalid={false}
          className={inputClass}
        />
      </FormField>

      {/*
        Hidden with `sr-only`, never `display:none`: a programmatic `.click()`
        on a `display:none` file input has a history of not opening the picker
        in WebKit — and this screen is the party's only upload path, reached
        from a printed QR code, with nobody around to debug it.

        `tabIndex={-1}` + `aria-hidden` keep the still-rendered input out of
        the tab order; the visible `<button>` below is the real tab stop.
      */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleSelect}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      />

      {/*
        Hidden once the list has items: `addFiles` replaces the whole list, so
        a new selection would erase the record of what was already sent. The
        way back to the picker is always `reset()`.
      */}
      {items.length === 0 && (
        <button
          ref={selectButtonRef}
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex min-h-30 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-accent/40 px-6 text-center transition-colors hover:border-accent"
        >
          <span aria-hidden className="text-3xl text-accent">
            ✦
          </span>
          <span className="text-foreground">Toque para escolher as fotos</span>
          {/* No aria-describedby: as a descendant this text is already part
              of the button's accessible name, and linking it would make the
              screen reader say it twice. */}
          <span className="text-xs text-foreground/60">
            Até {maxPerUpload} por vez, {maxFileSizeMb}MB cada
          </span>
        </button>
      )}

      {inputError && (
        <p role="alert" className="text-sm text-danger">
          {inputError}
        </p>
      )}

      {items.length > 0 && (
        <Card>
          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-2 border-b border-accent/10 pb-3 last:border-none last:pb-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground/90">
                    {item.name}
                  </span>
                  <span
                    className={
                      item.status === 'error'
                        ? 'shrink-0 text-xs text-danger'
                        : item.status === 'done'
                          ? 'shrink-0 text-xs text-highlight'
                          : 'shrink-0 text-xs text-foreground/60'
                    }
                  >
                    {statusLabel[item.status]}
                  </span>
                </div>
                {item.status === 'error' && (
                  <div className="flex flex-col items-start gap-2">
                    {item.error && (
                      <p className="text-xs break-words text-danger">{item.error}</p>
                    )}
                    <Button
                      variant="ghost"
                      onClick={() => retry(item.id)}
                      disabled={busy || inFlight}
                    >
                      Tentar de novo
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {allDone ? (
        <Card className="flex flex-col items-center gap-4 text-center">
          {/* No role/aria-live: the persistent live region already announces
              this, and the focus move below delivers it a second time. */}
          <div ref={successRef} tabIndex={-1} className="outline-none">
            <p className="font-display text-2xl text-accent-light">Fotos enviadas. Obrigado!</p>
          </div>
          <Button variant="ghost" onClick={reset}>
            Enviar mais fotos
          </Button>
        </Card>
      ) : (
        items.length > 0 && (
          <div className="flex flex-col gap-3">
            <Button size="lg" onClick={handleSend} disabled={busy || inFlight}>
              {busy || inFlight ? 'Enviando...' : `Enviar ${pendingCount} foto(s)`}
            </Button>
            {/* Escape hatch: a permanently failing photo never lets `allDone`
                turn true, so without this the only way out is a reload. */}
            {!busy && !inFlight && (
              <div className="flex flex-col items-center gap-1">
                <Button variant="ghost" onClick={reset}>
                  Escolher outras fotos
                </Button>
                {doneCount > 0 && (
                  <p className="text-xs text-foreground/60">
                    As {doneCount} foto(s) já enviada(s) continuam salvas.
                  </p>
                )}
              </div>
            )}
          </div>
        )
      )}
    </div>
  )
}
