import { MusicPlayer } from '@/components/invitation/MusicPlayer'
import { getEventConfig } from '@/lib/config'
import type { ReactNode } from 'react'

export default function SiteLayout({ children }: { children: ReactNode }) {
  const { media } = getEventConfig()

  return (
    <div className="relative flex min-h-dvh flex-col bg-surface-deep">
      {/* Vinheta: escurece as bordas e faz a arte parecer emoldurada em telas largas. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.65)_100%)]"
      />
      <div className="relative flex flex-1 flex-col">{children}</div>
      {media.soundtrack && <MusicPlayer src={media.soundtrack} />}
    </div>
  )
}
