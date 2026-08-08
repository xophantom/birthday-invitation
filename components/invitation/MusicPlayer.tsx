'use client'

import { useEffect, useRef } from 'react'
import { useMusicStore } from '@/stores/music-store'

export function MusicPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const hasStarted = useMusicStore((state) => state.hasStarted)
  const isMuted = useMusicStore((state) => state.isMuted)
  const isOpeningVisible = useMusicStore((state) => state.isOpeningVisible)
  const start = useMusicStore((state) => state.start)
  const toggleMute = useMusicStore((state) => state.toggleMute)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !hasStarted) return
    // play() rejeita se o navegador não considerar o gesto válido; ignorar é o
    // comportamento correto — o convite não deve quebrar por causa da trilha.
    audio.play().catch(() => {})
  }, [hasStarted])

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = isMuted
  }, [isMuted])

  function handleClick() {
    if (!hasStarted) {
      // Nem toda sessão passa pela abertura (reload direto, link para /manual
      // compartilhado). Este clique é o único gesto do usuário disponível
      // nesses casos, então ele mesmo destrava a reprodução.
      start()
      audioRef.current?.play().catch(() => {})
      return
    }
    toggleMute()
  }

  const ariaLabel = !hasStarted
    ? 'Iniciar música'
    : isMuted
      ? 'Reativar música'
      : 'Silenciar música'

  // Este componente é irmão do <main> do convite (vive no layout do grupo),
  // então o `inert` que a InvitationExperience aplica enquanto a abertura
  // está em cena não o alcança, e z-index nunca afetou ordem de tabulação:
  // sem isto o botão continuava alcançável por `Tab` e presente na árvore de
  // acessibilidade, invisível atrás de uma tela opaca. Sai inteiro de cena
  // em vez de receber `inert` porque o <audio> tem `preload="none"` e nada
  // toca antes do primeiro gesto — não há reprodução em curso para
  // interromper. Assim que a abertura termina ele volta como sempre foi.
  if (isOpeningVisible) return null

  return (
    <>
      <audio ref={audioRef} src={src} loop preload="none" />
      <button
        type="button"
        onClick={handleClick}
        aria-label={ariaLabel}
        className="fixed bottom-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-accent/40 bg-surface/80 text-accent-light backdrop-blur-sm transition-colors hover:bg-surface"
      >
        {hasStarted && isMuted ? '🔇' : '🎵'}
      </button>
    </>
  )
}
