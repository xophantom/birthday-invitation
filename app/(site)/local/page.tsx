import type { Metadata } from 'next'
import { SectionShell } from '@/components/invitation/SectionShell'
import { Card } from '@/components/ui/Card'
import { getEventConfig } from '@/lib/config'

export const metadata: Metadata = { title: 'Local' }

export default function Page() {
  const { venue } = getEventConfig()
  const query = encodeURIComponent(venue.mapsQuery)

  return (
    <SectionShell title="Local" subtitle={venue.name}>
      <div className="flex flex-col gap-5">
        <Card>
          <p className="text-foreground/90">{venue.address}</p>
          {venue.notes.map((note) => (
            <p key={note} className="mt-3 text-sm text-foreground/70">
              {note}
            </p>
          ))}
        </Card>

        <div className="overflow-hidden rounded-2xl border border-accent/25">
          <iframe
            title={`Mapa de ${venue.name}`}
            src={`https://www.google.com/maps?q=${query}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-64 w-full border-0"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${query}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-surface-deep transition-colors hover:bg-accent-light"
          >
            Abrir no Google Maps
          </a>
          <a
            href={`https://waze.com/ul?q=${query}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-accent/50 px-6 text-sm text-accent-light transition-colors hover:bg-accent/10"
          >
            Abrir no Waze
          </a>
        </div>
      </div>
    </SectionShell>
  )
}
