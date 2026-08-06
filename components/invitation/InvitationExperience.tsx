'use client'

import { useEffect, useRef, useState } from 'react'
import { MenuGrid } from '@/components/invitation/MenuGrid'
import { OpeningSequence } from '@/components/invitation/OpeningSequence'
import { PosterHero } from '@/components/invitation/PosterHero'

const SEEN_KEY = 'convite:abertura-vista'

// Fonte da verdade em memória: sobrevive à navegação client-side (voltar ao
// menu e entrar em outra seção) mesmo quando o sessionStorage está bloqueado
// (webview com privacidade restrita). Só perde o valor num recarregamento
// completo da página — aí sim a abertura reaparece, o que é aceitável.
let seenThisSession = false

type InvitationExperienceProps = {
  monogram: string
  celebrantName: string
  age: number
  poster: string
  videoSrc: string | null
  date: {
    weekday: string
    day: string
    month: string
    year: string
    time: string
  }
}

export function InvitationExperience({
  monogram,
  celebrantName,
  age,
  poster,
  videoSrc,
  date,
}: InvitationExperienceProps) {
  const mainRef = useRef<HTMLElement>(null)
  const [showOpening, setShowOpening] = useState(false)

  useEffect(() => {
    if (seenThisSession) return
    try {
      // sessionStorage só existe no cliente — ler no corpo do componente
      // quebraria a hidratação. Isto é sincronização com um sistema externo
      // (a API de armazenamento do navegador), o caso que a regra documenta
      // como exceção; não há como mover esta leitura para fora do efeito.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (sessionStorage.getItem(SEEN_KEY) !== '1') setShowOpening(true)
    } catch {
      // Armazenamento indisponível: sem como confirmar "já visto", então
      // mostramos a abertura. A flag em memória evita repeti-la a cada volta
      // ao menu dentro desta mesma sessão.
      setShowOpening(true)
    }
  }, [])

  function handleFinish() {
    seenThisSession = true
    try {
      sessionStorage.setItem(SEEN_KEY, '1')
    } catch {
      // Sem persistência, a flag em memória ainda garante que a abertura não
      // repita enquanto o convidado navegar entre as seções. Ela só volta a
      // aparecer se a página for recarregada de verdade — comportamento
      // aceitável, o que não pode é travar o convidado numa tela vazia.
    }
    setShowOpening(false)
    mainRef.current?.focus()
  }

  return (
    <>
      <main ref={mainRef} tabIndex={-1} className="flex flex-1 flex-col">
        <h1 className="sr-only">{`Convite de aniversário de ${celebrantName} — ${age} anos`}</h1>
        <PosterHero poster={poster} celebrantName={celebrantName} date={date} />
        <MenuGrid />
      </main>
      {showOpening && (
        <div className="fixed inset-0 z-40">
          <OpeningSequence
            monogram={monogram}
            celebrantName={celebrantName}
            poster={poster}
            videoSrc={videoSrc}
            onFinish={handleFinish}
          />
        </div>
      )}
    </>
  )
}
