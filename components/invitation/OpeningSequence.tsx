'use client'

import { motion, useReducedMotion } from 'motion/react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { GoldParticles } from '@/components/invitation/GoldParticles'
import { useMusicStore } from '@/stores/music-store'

const MotionImage = motion.create(Image)

type OpeningSequenceProps = {
  monogram: string
  celebrantName: string
  poster: string
  videoSrc: string | null
  onFinish: () => void
}

export function OpeningSequence({
  monogram,
  celebrantName,
  poster,
  videoSrc,
  onFinish,
}: OpeningSequenceProps) {
  // The soundtrack can only start from a user gesture — browsers block audio
  // autoplay, and iOS Safari enforces it strictly. So the sequence opens on a
  // tap gate: that tap unlocks playback, and the video and the music begin in
  // the same commit. Without it the video would play over silence, and the
  // music would only come in later, when the guest tapped something else.
  const [entered, setEntered] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const start = useMusicStore((state) => state.start)
  const prefersReducedMotion = useReducedMotion()
  // A full-screen video is exactly the vestibular trigger the reduced-motion
  // preference exists to avoid, so fall back to the animated sequence even
  // when videoSrc is configured.
  const showVideo = Boolean(videoSrc) && !prefersReducedMotion

  useEffect(() => {
    if (!entered) return
    const timer = setTimeout(() => setShowButton(true), showVideo ? 1000 : 3200)
    return () => clearTimeout(timer)
  }, [entered, showVideo])

  // `autoPlay` alone left the video at readyState 0 in testing — the element
  // mounts after the gate tap, and a deprioritised tab never starts the load.
  // A black opening is the worst failure this screen has, so we ask explicitly
  // now that the gate has given us a user gesture. Muted throughout: the
  // soundtrack is the audio.
  useEffect(() => {
    if (!entered || !showVideo) return
    videoRef.current?.play().catch(() => {})
  }, [entered, showVideo])

  // `start()` flips the store flag the still-mounted `<audio>` in MusicPlayer
  // reacts to. It runs in the effect right after this click, well inside the
  // transient activation window the autoplay policy grants.
  function handleEnter() {
    start()
    setEntered(true)
  }

  // The music already started at the gate, so entering only ends the opening.
  function handleOpen() {
    onFinish()
  }

  if (!entered) {
    return (
      <section className="relative flex min-h-dvh flex-col overflow-hidden bg-surface-deep">
        <button
          type="button"
          onClick={handleEnter}
          className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-6 px-6 text-center"
        >
          <span className="font-display text-7xl text-accent-light">{monogram}</span>
          <span className="font-display text-2xl tracking-[0.3em] text-foreground uppercase">
            {celebrantName}
          </span>
          <span className="mt-4 inline-flex min-h-11 items-center rounded-full border border-accent/50 px-6 text-sm text-accent-light">
            Toque para abrir o convite
          </span>
        </button>
      </section>
    )
  }

  return (
    <section className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-surface-deep px-6">
      {showVideo ? (
        <video
          ref={videoRef}
          src={videoSrc ?? undefined}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <>
          <MotionImage
            src={poster}
            alt=""
            aria-hidden
            fill
            sizes="430px"
            initial={{ opacity: 0, scale: 1.12 }}
            animate={{ opacity: 0.55, scale: 1 }}
            transition={{ duration: 2.4, ease: 'easeOut' }}
            className="object-cover"
          />
          <GoldParticles />
        </>
      )}

      <div className="relative flex flex-col items-center gap-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="font-display text-7xl text-accent-light drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
        >
          {monogram}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1 }}
          className="font-display text-2xl tracking-[0.3em] text-foreground uppercase"
        >
          {celebrantName}
        </motion.p>

        {showButton && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            <Button size="lg" onClick={handleOpen}>
              Abrir convite
            </Button>
          </motion.div>
        )}
      </div>

      <button
        type="button"
        onClick={handleOpen}
        className="absolute bottom-6 right-6 min-h-11 px-3 text-xs text-foreground/60 underline underline-offset-4 drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] hover:text-foreground"
      >
        Pular
      </button>
    </section>
  )
}
