import Image from 'next/image'
import type { ReactNode } from 'react'
import type { EventDateParts } from '@/lib/date'

type PosterHeroProps = {
  poster: string
  celebrantName: string
  date: Pick<EventDateParts, 'weekday' | 'day' | 'month' | 'year' | 'time'>
  // Rendered over the bottom of the artwork, below the date.
  children?: ReactNode
}

export function PosterHero({ poster, celebrantName, date, children }: PosterHeroProps) {
  return (
    // `flex-1` stretches the section to at least the full screen, so the
    // poster fills it edge to edge instead of sitting in a fixed-ratio box.
    <section className="@container relative flex flex-1 flex-col overflow-hidden">
      <Image
        src={poster}
        alt={`Convite de 15 anos de ${celebrantName}`}
        fill
        priority
        // The column never exceeds `--container-frame`, so one candidate
        // covers every viewport — no breakpoint branch to keep in sync.
        sizes="430px"
        // When the screen is wider than the art, the crop comes off the
        // bottom (hidden under the menu anyway), never off the tiara.
        className="object-cover object-top"
      />

      {/*
        Keeps the face and the frog clear of the date. On a tall screen this
        just grows; on a short one it holds its ground and the page scrolls,
        rather than the menu climbing over the portrait.
      */}
      <div aria-hidden className="min-h-[50cqw] flex-1" />

      {/*
        The gradient lives on the content block itself, so it always spans
        exactly the date and the menu, however tall they wrap on a given phone.
      */}
      <div className="relative bg-linear-to-t from-surface-deep from-35% via-surface-deep/80 via-65% to-transparent pt-32">
        <div className="flex flex-col items-center gap-1 px-6 pb-8 text-center">
          <p className="font-sans text-xs uppercase tracking-[0.35em] text-foreground">
            {date.weekday}
          </p>
          <p className="font-display text-4xl text-accent-light">
            {date.day} de {date.month} de {date.year}
          </p>
          <p className="font-sans text-sm tracking-widest text-foreground">
            às {date.time}
          </p>
        </div>
        {children}
      </div>
    </section>
  )
}
