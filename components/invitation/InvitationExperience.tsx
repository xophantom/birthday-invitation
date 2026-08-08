'use client'

import { useEffect, useRef, useState } from 'react'
import { MenuGrid } from '@/components/invitation/MenuGrid'
import { OpeningSequence } from '@/components/invitation/OpeningSequence'
import { PosterHero } from '@/components/invitation/PosterHero'
import type { EventDateParts } from '@/lib/date'
import { useMusicStore } from '@/stores/music-store'

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
  date: Pick<EventDateParts, 'weekday' | 'day' | 'month' | 'year' | 'time'>
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
  // O botão de música vive em app/(site)/layout.tsx, irmão do <main> — o
  // `inert` abaixo não o alcança. Este é o canal que avisa o `MusicPlayer`
  // para sair de cena enquanto a abertura durar. Continua sendo `showOpening`
  // quem manda no que esta árvore renderiza; a store só espelha.
  const setOpeningVisible = useMusicStore((state) => state.setOpeningVisible)
  // true assim que a abertura é exibida; volta a false depois de devolver o
  // foco ao <main>. Guarda o efeito abaixo para só agir numa transição real
  // de "mostrando" para "escondida" — nunca no primeiro paint, quando
  // `showOpening` já nasce false para quem tem a sessão marcada como vista.
  const openingWasShownRef = useRef(false)

  useEffect(() => {
    if (seenThisSession) return

    let shouldShow: boolean
    try {
      // sessionStorage só existe no cliente — ler no corpo do componente
      // quebraria a hidratação. Isto é sincronização com um sistema externo
      // (a API de armazenamento do navegador), o caso que a regra documenta
      // como exceção; não há como mover esta leitura para fora do efeito.
      shouldShow = sessionStorage.getItem(SEEN_KEY) !== '1'
    } catch {
      // Armazenamento indisponível: sem como confirmar "já visto", então
      // mostramos a abertura. A flag em memória evita repeti-la a cada volta
      // ao menu dentro desta mesma sessão.
      shouldShow = true
    }
    if (!shouldShow) return

    // Os dois no mesmo lugar de propósito: mostrar a abertura e esconder o
    // botão de música acontecem no mesmo commit, sem um quadro intermediário
    // em que o botão ainda esteja focável por trás da tela opaca.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowOpening(true)
    setOpeningVisible(true)
  }, [setOpeningVisible])

  // Rede de segurança para desmontagem com a abertura ainda em cena: a flag
  // vive numa store global, então deixá-la ligada esconderia o botão de
  // música pelo resto da sessão.
  useEffect(() => () => setOpeningVisible(false), [setOpeningVisible])

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
    // Só troca o estado aqui. Focar o <main> tem que esperar o próximo
    // efeito (abaixo): `inert` só sai do nó depois que este `setState`
    // for de fato commitado, e `.focus()` chamado nesta mesma função,
    // antes do commit, mira um elemento que ainda está inert — o
    // navegador recusa silenciosamente e o convidado fica sem foco algum.
    setShowOpening(false)
    // Devolve o botão de música ao mesmo commit em que a abertura sai de
    // cena — daqui em diante ele volta a se comportar como sempre.
    setOpeningVisible(false)
  }

  useEffect(() => {
    if (showOpening) {
      openingWasShownRef.current = true
      return
    }
    if (openingWasShownRef.current) {
      mainRef.current?.focus()
      openingWasShownRef.current = false
    }
  }, [showOpening])

  return (
    <>
      <main
        ref={mainRef}
        tabIndex={-1}
        // Enquanto a abertura está em cena ela é opaca e cobre a tela
        // inteira, mas sem isto o conteúdo daqui debaixo (pôster, menu)
        // continuava na ordem de tabulação normal: Tab a partir da raiz
        // parava num link do menu invisível, escondido atrás da abertura,
        // sem contorno nenhum à vista. `inert` tira a subárvore inteira do
        // foco e da árvore de acessibilidade enquanto durar.
        inert={showOpening}
        className="flex flex-1 flex-col"
      >
        <h1 className="sr-only">{`Convite de aniversário de ${celebrantName} — ${age} anos`}</h1>
        <PosterHero poster={poster} celebrantName={celebrantName} date={date} />
        <MenuGrid />
      </main>
      {showOpening && (
        // z-[60], acima do z-50 do MusicPlayer (components/invitation/MusicPlayer.tsx):
        // a abertura é opaca e cobre a tela inteira, mas como z-40 < z-50 o
        // botão de som (fixed, fora desta árvore) ainda vencia o hit-test e
        // ficava visível por cima dela — um toque impreciso no canto ligava a
        // música em vez de acionar "Pular". Hoje o botão nem chega a
        // renderizar enquanto a abertura dura (`isOpeningVisible` na store),
        // o que resolve foco, hit-test e árvore de acessibilidade de uma vez;
        // o z-[60] fica como defesa em profundidade para qualquer outro
        // elemento `fixed` que venha a existir acima desta camada.
        <div className="fixed inset-0 z-[60]">
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
