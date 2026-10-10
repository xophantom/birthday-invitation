import { MusicPlayer } from '@/components/invitation/MusicPlayer'
import { getEventConfig } from '@/lib/config'
import type { ReactNode } from 'react'

export default function SiteLayout({ children }: { children: ReactNode }) {
  const { media } = getEventConfig()

  return (
    <div className="relative flex min-h-dvh flex-col bg-surface-deep">
      {/* Vignette: darkens the edges so the column reads as framed on wide screens. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.65)_100%)]"
      />
      {/*
        The phone-width column every guest-facing screen lives in.

        Its own opaque background is load-bearing, not decoration. The
        vignette above is `fixed inset-0` and paints behind this column, so
        without a background it showed through wherever the column's content
        was transparent. On a wide viewport that goes unnoticed — the column
        sits in the vignette's transparent centre — but on a phone the column
        spans the full width, the vignette's edge darkening lands inside it,
        and a visible step appeared right where the opaque poster ends.
      */}
      <div className="relative mx-auto flex w-full max-w-frame flex-1 flex-col bg-surface-deep">
        {children}
      </div>
      {media.soundtrack && <MusicPlayer src={media.soundtrack} />}
    </div>
  )
}
