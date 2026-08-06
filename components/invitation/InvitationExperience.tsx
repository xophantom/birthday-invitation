'use client'

import { useEffect, useState } from 'react'
import { MenuGrid } from '@/components/invitation/MenuGrid'
import { OpeningSequence } from '@/components/invitation/OpeningSequence'
import { PosterHero } from '@/components/invitation/PosterHero'

const SEEN_KEY = 'convite:abertura-vista'

type InvitationExperienceProps = {
  monogram: string
  celebrantName: string
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
  poster,
  videoSrc,
  date,
}: InvitationExperienceProps) {
  // undefined = ainda não sabemos se a abertura já foi vista nesta sessão.
  const [showOpening, setShowOpening] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowOpening(sessionStorage.getItem(SEEN_KEY) !== '1')
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
  }

  if (showOpening === undefined) {
    return <div className="min-h-dvh bg-surface-deep" />
  }

  if (showOpening) {
    return (
      <OpeningSequence
        monogram={monogram}
        celebrantName={celebrantName}
        poster={poster}
        videoSrc={videoSrc}
        onFinish={handleFinish}
      />
    )
  }

  return (
    <>
      <PosterHero poster={poster} celebrantName={celebrantName} date={date} />
      <MenuGrid />
    </>
  )
}
