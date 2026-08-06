'use client'

import { motion } from 'motion/react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
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
  const [showButton, setShowButton] = useState(false)
  const start = useMusicStore((state) => state.start)

  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), videoSrc ? 1000 : 3200)
    return () => clearTimeout(timer)
  }, [videoSrc])

  function handleOpen() {
    start()
    onFinish()
  }

  return (
    <section className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-surface-deep px-6">
      {videoSrc ? (
        <video
          src={videoSrc}
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
            sizes="(min-width: 640px) 28rem, 100vw"
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
        className="absolute bottom-6 right-6 min-h-11 px-3 text-xs text-foreground/60 underline underline-offset-4 hover:text-foreground"
      >
        Pular
      </button>
    </section>
  )
}
