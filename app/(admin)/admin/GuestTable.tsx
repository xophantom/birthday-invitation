import type { Rsvp } from '@/lib/db'
import { deleteRsvp } from './actions'

export function GuestTable({ guests }: { guests: Rsvp[] }) {
  const counts = new Map<string, number>()
  for (const guest of guests) {
    const key = guest.fullName.trim().toLowerCase()
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  if (guests.length === 0) {
    return <p className="text-foreground/60">Nenhuma confirmação ainda.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[46rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-accent/20 text-left text-foreground/60">
            <th className="py-3 pr-4 font-medium">Nome</th>
            <th className="py-3 pr-4 font-medium">Telefone</th>
            <th className="py-3 pr-4 font-medium">Acomp.</th>
            <th className="py-3 pr-4 font-medium">Recado</th>
            <th className="py-3 pr-4 font-medium">Origem</th>
            <th className="py-3" />
          </tr>
        </thead>
        <tbody>
          {guests.map((guest) => {
            const duplicated = (counts.get(guest.fullName.trim().toLowerCase()) ?? 0) > 1

            return (
              <tr key={guest.id} className="border-b border-accent/10 align-top">
                <td className="py-3 pr-4 break-words">
                  {guest.fullName}
                  {duplicated && (
                    <span
                      title="Existe outra confirmação com este mesmo nome"
                      className="ml-2 rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent-light"
                    >
                      nome repetido
                    </span>
                  )}
                </td>
                <td className="py-3 pr-4 text-foreground/80">{guest.phone ?? '—'}</td>
                <td className="py-3 pr-4 text-foreground/80">{guest.companionsCount}</td>
                <td className="max-w-xs py-3 pr-4 break-words text-foreground/80">
                  {guest.message ?? '—'}
                </td>
                <td className="py-3 pr-4">
                  <span className="rounded-full border border-accent/30 px-2 py-0.5 text-xs text-foreground/70">
                    {guest.source === 'admin' ? 'manual' : 'convidado'}
                  </span>
                </td>
                <td className="py-3">
                  <form action={deleteRsvp}>
                    <input type="hidden" name="id" value={guest.id} />
                    <button
                      type="submit"
                      className="text-xs text-danger underline underline-offset-4 hover:text-danger/80"
                    >
                      Remover
                    </button>
                  </form>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
