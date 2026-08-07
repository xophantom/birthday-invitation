'use client'

import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormField } from '@/components/ui/FormField'
import { usePhotoUpload } from '@/hooks/use-photo-upload'

const statusLabel: Record<string, string> = {
  pending: 'Na fila',
  compressing: 'Preparando...',
  uploading: 'Enviando...',
  done: 'Enviada',
  error: 'Falhou',
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
  const { items, addFiles, uploadAll, retry, reset } = usePhotoUpload(name)

  const allDone = items.length > 0 && items.every((item) => item.status === 'done')
  const doneCount = items.filter((item) => item.status === 'done').length
  const errorCount = items.filter((item) => item.status === 'error').length
  // Quantas fotos ainda precisam de ação — não `items.length`: `uploadAll`
  // pula quem já está `done`, então depois de um envio parcial (algumas
  // prontas, outras falhas) o rótulo do botão deve refletir só o que falta,
  // não o total original.
  const pendingCount = items.length - doneCount

  /**
   * Região viva persistente (nunca desmontada) para o progresso do envio.
   * `<ul>`/`<Card>` só existem depois que o convidado escolhe fotos, e uma
   * região `aria-live` criada nesse momento não é garantida de ser
   * reconhecida como "viva" por todo leitor de tela antes da primeira
   * mudança de conteúdo. Este resumo textual, montado desde o primeiro
   * paint e recalculado a cada render a partir de `items`, evita depender
   * dessa garantia: qualquer leitor de tela que já registrou a região
   * (presente desde sempre) ouve o resumo mudar. `aria-atomic` garante que a
   * frase inteira seja lida, não só o trecho que mudou.
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

  function handleSelect(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    // Limpa o valor para que escolher os mesmos arquivos de novo (depois de
    // um reset) dispare `onChange` de novo — o navegador não avisa se o
    // `value` do input não mudar.
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

    const notImage = files.find((file) => !file.type.startsWith('image/'))
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
          className={inputClass}
        />
      </FormField>

      {/*
        O input real fica sempre fora da árvore de foco/acessibilidade
        (`hidden`, não `sr-only`): quem aciona o seletor de arquivos é o
        `<button>` visível abaixo, via `fileInputRef.current.click()`. Um
        `<label>` estilizado (a forma original) não é um parada de Tab —
        só controles de formulário recebem foco por teclado — então quem
        navega por teclado caía direto no input `sr-only`, invisível, sem
        nenhum indício de onde o foco estava. Com um `<button>` de verdade,
        o alvo grande e visível é o próprio parado de Tab, e recebe o anel
        de foco global (`:focus-visible` em app/globals.css).
      */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleSelect}
        className="hidden"
      />

      {/*
        Escondido assim que existem itens na lista: `addFiles` substitui a
        lista inteira a cada seleção, então deixar o seletor visível depois
        de escolher fotos (ou de já ter enviado algumas) deixaria uma nova
        seleção apagar da tela o registro do que já foi enviado com sucesso.
        O caminho de volta ao seletor é sempre "Enviar mais fotos" (reset).
      */}
      {items.length === 0 && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-describedby="photos-hint"
          className="flex min-h-30 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-accent/40 px-6 text-center transition-colors hover:border-accent"
        >
          <span aria-hidden className="text-3xl text-accent">
            ✦
          </span>
          <span className="text-foreground">Toque para escolher as fotos</span>
          <span id="photos-hint" className="text-xs text-foreground/60">
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
                    <Button variant="ghost" onClick={() => retry(item.id)}>
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
          <div
            ref={successRef}
            role="status"
            aria-live="polite"
            tabIndex={-1}
            className="outline-none"
          >
            <p className="font-display text-2xl text-accent-light">Fotos enviadas. Obrigado!</p>
          </div>
          <Button variant="ghost" onClick={reset}>
            Enviar mais fotos
          </Button>
        </Card>
      ) : (
        items.length > 0 && (
          <Button size="lg" onClick={handleSend} disabled={busy}>
            {busy ? 'Enviando...' : `Enviar ${pendingCount} foto(s)`}
          </Button>
        )
      )}
    </div>
  )
}
