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
    // play() rejects when the browser doesn't accept the gesture; ignoring is
    // correct — the invitation must not break over the soundtrack.
    audio.play().catch(() => {})
  }, [hasStarted])

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = isMuted
  }, [isMuted])

  function handleClick() {
    if (!hasStarted) {
      // Not every session goes through the opening (direct reload, a shared
      // deep link), so this click is the only user gesture available to
      // unlock playback.
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

  // This lives in the group layout, a sibling of the invitation's <main>, so
  // the `inert` applied there can't reach it — and z-index never affected tab
  // order. Unmounting rather than going `inert` is safe because `<audio>` uses
  // `preload="none"` and nothing plays before the first gesture.
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
