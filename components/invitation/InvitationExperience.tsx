'use client'

import { useEffect, useRef, useState } from 'react'
import { MenuGrid } from '@/components/invitation/MenuGrid'
import { OpeningSequence } from '@/components/invitation/OpeningSequence'
import { OPENING_SEEN_KEY } from '@/components/invitation/opening-seen'
import { PosterHero } from '@/components/invitation/PosterHero'
import type { EventDateParts } from '@/lib/date'
import { useMusicStore } from '@/stores/music-store'

// In-memory source of truth: survives client-side navigation even when
// sessionStorage is blocked (restricted-privacy webviews). Lost on a full
// reload, which brings the opening back — acceptable.
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
  // Starts true so the server renders the opening; a guest who already saw it
  // is caught by the inline script before paint, and dismissed below once
  // hydrated. Client-side navigation back here skips it via the memory flag.
  const [showOpening, setShowOpening] = useState(() => !seenThisSession)
  // The music button lives in the group layout, a sibling of <main>, so the
  // `inert` below can't reach it. This store flag is how it hears about the
  // opening; `showOpening` still drives what this tree renders.
  const setOpeningVisible = useMusicStore((state) => state.setOpeningVisible)
  // Restricts the focus effect below to a real shown -> hidden transition,
  // never a returner's hydration, where the server-rendered opening is
  // dismissed without ever having been seen.
  const openingWasShownRef = useRef(false)

  useEffect(() => {
    if (seenThisSession) return

    let alreadySeen: boolean
    try {
      // Client-only API: reading it in the component body would break
      // hydration. Syncing with an external store is the documented exception.
      alreadySeen = sessionStorage.getItem(OPENING_SEEN_KEY) === '1'
    } catch {
      // Storage unavailable: can't confirm "already seen", so show it. The
      // in-memory flag still prevents repeats within this session.
      alreadySeen = false
    }

    if (alreadySeen) {
      seenThisSession = true
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowOpening(false)
      return
    }

    openingWasShownRef.current = true
    setOpeningVisible(true)
  }, [setOpeningVisible])

  // Unmounting mid-opening would leave the global flag on and hide the music
  // button for the rest of the session.
  useEffect(() => () => setOpeningVisible(false), [setOpeningVisible])

  function handleFinish() {
    seenThisSession = true
    try {
      sessionStorage.setItem(OPENING_SEEN_KEY, '1')
    } catch {
      // The in-memory flag is enough; what matters is not stranding the guest
      // on a blank screen.
    }
    // State only. Focusing <main> has to wait for the effect below: `inert` is
    // removed when this setState commits, and `.focus()` on a still-inert node
    // is silently refused, leaving the guest with no focus at all.
    setShowOpening(false)
    setOpeningVisible(false)
  }

  useEffect(() => {
    if (showOpening || !openingWasShownRef.current) return
    mainRef.current?.focus()
    openingWasShownRef.current = false
  }, [showOpening])

  return (
    <>
      <main
        ref={mainRef}
        tabIndex={-1}
        // The opening is opaque and full-screen, but that alone leaves this
        // content in the tab order: Tab would land on an invisible menu link
        // behind it. `inert` removes the whole subtree while it lasts.
        inert={showOpening}
        className="flex flex-1 flex-col"
      >
        <h1 className="sr-only">{`Convite de aniversário de ${celebrantName} — ${age} anos`}</h1>
        <PosterHero poster={poster} celebrantName={celebrantName} date={date}>
          <MenuGrid />
        </PosterHero>
      </main>
      {showOpening && (
        // z-[60] sits above the MusicPlayer's z-50. The player's button is
        // withheld during the opening, so this is defence in depth for any
        // future `fixed` element that would otherwise win the hit test.
        // Capped at the frame width so the opening stays inside the column.
        // `in-data-opening-seen:hidden` hides it before hydration for a
        // guest who already saw it (see opening-seen.ts).
        <div className="fixed inset-0 z-[60] mx-auto max-w-frame bg-surface-deep in-data-opening-seen:hidden">
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
