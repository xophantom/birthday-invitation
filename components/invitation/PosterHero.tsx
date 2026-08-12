import Image from 'next/image'
import type { EventDateParts } from '@/lib/date'

type PosterHeroProps = {
  poster: string
  celebrantName: string
  date: Pick<EventDateParts, 'weekday' | 'day' | 'month' | 'year' | 'time'>
}

export function PosterHero({ poster, celebrantName, date }: PosterHeroProps) {
  return (
    <section className="flex flex-1 items-center justify-center">
      <div className="relative aspect-[693/895] w-full overflow-hidden">
        <Image
          src={poster}
          alt={`Convite de 15 anos de ${celebrantName}`}
          fill
          priority
          // The column never exceeds `--container-frame`, so one candidate
          // covers every viewport — no breakpoint branch to keep in sync.
          sizes="430px"
          className="object-cover"
        />

        {/* Gradient keeps the date legible over any part of the artwork. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-surface-deep via-surface-deep/85 to-transparent"
        />

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 px-6 pb-8 text-center">
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
      </div>
    </section>
  )
}
