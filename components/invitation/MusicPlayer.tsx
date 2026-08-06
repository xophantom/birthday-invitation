'use client'

import { useEffect, useRef } from 'react'
import { useMusicStore } from '@/stores/music-store'

export function MusicPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const hasStarted = useMusicStore((state) => state.hasStarted)
  const isMuted = useMusicStore((state) => state.isMuted)
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

  return (
    <>
      <audio ref={audioRef} src={src} loop preload="auto" />
      {hasStarted && (
        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? 'Ativar música' : 'Desativar música'}
          className="fixed bottom-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-accent/40 bg-surface/80 text-accent-light backdrop-blur-sm transition-colors hover:bg-surface"
        >
          {isMuted ? '🔇' : '🎵'}
        </button>
      )}
    </>
  )
}
