import Image from 'next/image'

type PosterHeroProps = {
  poster: string
  celebrantName: string
  date: {
    weekday: string
    day: string
    month: string
    year: string
    time: string
  }
}

export function PosterHero({ poster, celebrantName, date }: PosterHeroProps) {
  return (
    <section className="flex flex-1 items-center justify-center px-0 py-0 sm:px-6 sm:py-10">
      <div className="relative aspect-[693/895] w-full max-w-none overflow-hidden sm:max-w-md sm:rounded-3xl sm:border sm:border-accent/30 sm:shadow-2xl sm:shadow-black/50">
        <Image
          src={poster}
          alt={`Convite de 15 anos de ${celebrantName}`}
          fill
          priority
          sizes="(min-width: 640px) 28rem, 100vw"
          className="object-cover"
        />

        {/* Gradiente que garante leitura da data sobre qualquer parte da arte. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-surface-deep via-surface-deep/85 to-transparent"
        />

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 px-6 pb-8 text-center">
          <p className="font-sans text-xs uppercase tracking-[0.35em] text-accent">
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
