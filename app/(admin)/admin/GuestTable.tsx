'use client'

import { startTransition, useActionState, useState } from 'react'
import type { AdminActionResult } from './action-result'
import { deleteRsvp } from './actions'
import { EditGuestForm } from './EditGuestForm'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { Rsvp } from '@/lib/db'

/** `guestId` scopes the message to one guest. Without it, a failure removing
 *  guest A would linger in state and resurface inside guest B's modal. */
type DeleteState = AdminActionResult & { guestId?: string }

const initialState: DeleteState = { ok: true }

export function GuestTable({ guests }: { guests: Rsvp[] }) {
  const [confirming, setConfirming] = useState<Rsvp | null>(null)
  const [editing, setEditing] = useState<Rsvp | null>(null)

  const [state, action, pending] = useActionState(
    async (previous: DeleteState, formData: FormData): Promise<DeleteState> => {
      const result = await deleteRsvp(previous, formData)

      // Close only on success, so a DB failure leaves the modal open with the
      // message instead of pretending the guest was removed. `startTransition`
      // is required for state updates after an `await`; without it the close
      // lands a frame before the table refreshes.
      if (result.ok) startTransition(() => setConfirming(null))

      return { ...result, guestId: String(formData.get('id') ?? '') }
    },
    initialState
  )

  const counts = new Map<string, number>()
  for (const guest of guests) {
    const key = guest.fullName.trim().toLowerCase()
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  if (guests.length === 0) {
    return <p className="text-foreground/60">Nenhuma confirmação ainda.</p>
  }

  const showError = Boolean(
    confirming && !state.ok && state.message && state.guestId === confirming.id
  )

  // Esc and backdrop clicks close the <dialog> natively, so `confirming` can
  // already be null when the removal fails and the in-modal error paragraph
  // never mounts. Being the complement of `showError`, the two are never
  // visible at once.
  const showErrorOutsideModal = Boolean(!showError && !state.ok && state.message)

  return (
    <>
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
                    {/* Under the guest's own name, so the list reads as who is
                        coming with whom. */}
                    {guest.companionNames.length > 0 && (
                      <ul
                        aria-label={`Acompanhantes de ${guest.fullName}`}
                        className="mt-1.5 flex flex-col gap-0.5 text-foreground/70"
                      >
                        {guest.companionNames.map((name, index) => (
                          <li key={index}>+ {name}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-foreground/80">{guest.phone ?? '—'}</td>
                  <td className="py-3 pr-4 text-foreground/80">
                    {guest.companionsCount}
                    {/* Only the guest form collects names; manual entries and
                        RSVPs from before it asked for them carry just the
                        count. Said outright so it doesn't read as a bug. */}
                    {guest.companionsCount > 0 && guest.companionNames.length === 0 && (
                      <span className="mt-1 block text-xs text-foreground/50">sem nomes</span>
                    )}
                  </td>
                  <td className="max-w-xs py-3 pr-4 break-words text-foreground/80">
                    {guest.message ?? '—'}
                  </td>
                  <td className="py-3 pr-4">
                    <span className="rounded-full border border-accent/30 px-2 py-0.5 text-xs text-foreground/70">
                      {guest.source === 'admin' ? 'manual' : 'convidado'}
                    </span>
                  </td>
                  <td className="py-3">
                    {/* The names are in the `aria-label`s because every row
                        has the same two buttons. "Remover" opens the
                        confirmation; it does not remove. */}
                    <div className="flex">
                      <button
                        type="button"
                        onClick={() => setEditing(guest)}
                        aria-label={`Editar ${guest.fullName}`}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm text-accent-light underline underline-offset-4 hover:bg-accent/10 hover:no-underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirming(guest)}
                        aria-label={`Remover ${guest.fullName}`}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm text-danger underline underline-offset-4 hover:bg-danger/10 hover:no-underline"
                      >
                        Remover
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showErrorOutsideModal && (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Editar confirmação">
        {/* Keyed so opening another guest starts from that guest's data
            rather than whatever was typed for the previous one. */}
        {editing && (
          <EditGuestForm key={editing.id} guest={editing} onClose={() => setEditing(null)} />
        )}
      </Modal>

      <Modal
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        title="Remover confirmação"
      >
        {confirming && (
          <form action={action} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={confirming.id} />

            <div>
              <h2 className="font-display text-xl text-accent-light">Remover confirmação</h2>
              <p className="mt-2 text-sm text-foreground/80">
                Tirar <strong className="text-foreground">{confirming.fullName}</strong> da lista
                {confirming.companionsCount > 0 &&
                  ` e ${confirming.companionsCount} acompanhante${
                    confirming.companionsCount > 1 ? 's' : ''
                  } do total`}
                ?
              </p>
              <p className="mt-2 text-xs text-foreground/60">
                O total do buffet cai na hora. Não há como desfazer por esta tela.
              </p>
            </div>

            {showError && (
              <p role="alert" className="text-sm text-danger">
                {state.message}
              </p>
            )}

            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="ghost" onClick={() => setConfirming(null)} disabled={pending}>
                Cancelar
              </Button>
              <Button variant="danger" type="submit" disabled={pending}>
                {pending ? 'Removendo...' : 'Remover'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}
