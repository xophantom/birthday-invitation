import type { Metadata } from 'next'
import { AddGuestForm } from './AddGuestForm'
import { GuestTable } from './GuestTable'
import { requireAdmin } from '@/lib/auth/session'
import { countConfirmedGuests, listRsvps } from '@/lib/db/queries/rsvp'

export const metadata: Metadata = {
  title: 'Convidados',
  robots: { index: false, follow: false },
}

export default async function Page() {
  await requireAdmin()

  const [guests, totals] = await Promise.all([listRsvps(), countConfirmedGuests()])

  return (
    <div className="flex flex-col gap-8">
      <section className="flex gap-4">
        <div className="rounded-2xl border border-accent/25 px-6 py-4">
          <p className="text-xs uppercase tracking-widest text-foreground/60">Confirmações</p>
          <p className="font-display text-4xl text-accent-light">{totals.confirmations}</p>
        </div>
        <div className="rounded-2xl border border-accent/25 px-6 py-4">
          <p className="text-xs uppercase tracking-widest text-foreground/60">Pessoas</p>
          <p className="font-display text-4xl text-accent-light">{totals.people}</p>
        </div>
      </section>

      <AddGuestForm />
      <GuestTable guests={guests} />
    </div>
  )
}
