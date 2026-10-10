'use client'

import { MotionConfig, motion } from 'motion/react'
import Image from 'next/image'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/Button'
import { GoldParticles } from '@/components/invitation/GoldParticles'
import { useMusicStore } from '@/stores/music-store'

const MotionImage = motion.create(Image)

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/**
 * Not motion's `useReducedMotion`: that one reads matchMedia during the first
 * client render, and now that the opening is server-rendered a reduced-motion
 * device would hydrate a different tree than the server sent. The server
 * snapshot lets React hydrate as "no preference" and only then switch.
 */
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false
  )
}

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
  const prefersReducedMotion = usePrefersReducedMotion()
  // A full-screen video is exactly the vestibular trigger the reduced-motion
  // preference exists to avoid, so fall back to the animated sequence even
  // when videoSrc is configured.
  const showVideo = Boolean(videoSrc) && !prefersReducedMotion

  useEffect(() => {
    if (!entered) return
    const timer = setTimeout(() => setShowButton(true), showVideo ? 1000 : 3200)
    return () => clearTimeout(timer)
  }, [entered, showVideo])

  // The video sits behind the gate from the start so it can buffer while the
  // guest reads it; mounted only at the tap, it played after seconds of black
  // on a slow connection. It ships as preload="none" so its bytes don't
  // compete with the JavaScript that makes the gate respond, and is let loose
  // here, once hydrated.
  //
  // A tick later, not right away: child effects run before the parent's, and
  // for a guest who already saw the opening InvitationExperience unmounts it
  // in its own effect, in this same flush. Starting at once downloaded
  // ~150 KB of a video that was about to disappear.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (videoRef.current) videoRef.current.preload = 'auto'
    })
    return () => clearTimeout(timer)
  }, [showVideo])

  // `start()` flips the store flag the still-mounted `<audio>` in MusicPlayer
  // reacts to. It runs in the effect right after this click, well inside the
  // transient activation window the autoplay policy grants. The video is
  // muted, so its play() needs no gesture — but a black opening is the worst
  // failure this screen has, so ask for it explicitly rather than trusting
  // `autoPlay`, which left the element at readyState 0 in testing.
  function handleEnter() {
    start()
    setEntered(true)
    videoRef.current?.play().catch(() => {})
  }

  // The music already started at the gate, so entering only ends the opening.
  function handleOpen() {
    onFinish()
  }

  return (
    // The reduced-motion rule in globals.css only reaches CSS animations;
    // motion animates in JavaScript and needs to be told to honour it.
    <MotionConfig reducedMotion="user">
      <section className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-surface-deep px-6">
        {showVideo && (
          <video
            ref={videoRef}
            src={videoSrc ?? undefined}
            preload="none"
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {!entered ? (
          // Opaque, so the buffering video behind it never shows through.
          <button
            type="button"
            onClick={handleEnter}
            className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-6 bg-surface-deep px-6 text-center"
          >
            <span className="font-display text-7xl text-accent-light">{monogram}</span>
            <span className="font-display text-2xl tracking-[0.3em] text-foreground uppercase">
              {celebrantName}
            </span>
            <span className="mt-4 inline-flex min-h-11 items-center rounded-full border border-accent/50 px-6 text-sm text-accent-light">
              Toque para abrir o convite
            </span>
          </button>
        ) : (
          <>
            {!showVideo && (
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
          </>
        )}
      </section>
    </MotionConfig>
  )
}
