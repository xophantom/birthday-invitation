'use client'

import { useEffect, useRef, useState } from 'react'
import { MenuGrid } from '@/components/invitation/MenuGrid'
import { OpeningSequence } from '@/components/invitation/OpeningSequence'
import { PosterHero } from '@/components/invitation/PosterHero'

const SEEN_KEY = 'convite:abertura-vista'

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
    try {
      // sessionStorage só existe no cliente — ler no corpo do componente
      // quebraria a hidratação. Isto é sincronização com um sistema externo
      // (a API de armazenamento do navegador), o caso que a regra documenta
      // como exceção; não há como mover esta leitura para fora do efeito.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (sessionStorage.getItem(SEEN_KEY) !== '1') setShowOpening(true)
    } catch {
      // Armazenamento indisponível (privacidade restrita, webview embutida).
      // Degradar para "primeira visita" é melhor que travar numa tela vazia.
      setShowOpening(true)
    }
  }, [])

  function handleFinish() {
    try {
      sessionStorage.setItem(SEEN_KEY, '1')
    } catch {
      // Sem persistência a abertura repete no próximo carregamento — aceitável.
      // O que não pode é impedir o convidado de entrar.
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
