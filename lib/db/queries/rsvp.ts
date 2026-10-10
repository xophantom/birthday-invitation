import 'server-only'
import { desc, eq, sql } from 'drizzle-orm'
import { db, rsvps, type Rsvp } from '@/lib/db'
import type { RsvpFormValues } from '@/lib/validation/rsvp'

function emptyToNull(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

/**
 * Either the companions' names (guest form), from which the count follows, or
 * just the count (admin's manual entry). Never both, so the two can't disagree.
 */
type RsvpRecordValues = Pick<RsvpFormValues, 'fullName' | 'phone' | 'message'> &
  ({ companionNames: string[] } | { companionsCount: number })

export async function createRsvpRecord(
  values: RsvpRecordValues,
  source: 'guest' | 'admin'
): Promise<Rsvp> {
  const companionNames = 'companionNames' in values ? values.companionNames.map((n) => n.trim()) : []

  const [created] = await db
    .insert(rsvps)
    .values({
      fullName: values.fullName.trim(),
      phone: emptyToNull(values.phone),
      companionsCount: 'companionNames' in values ? companionNames.length : values.companionsCount,
      companionNames,
      message: emptyToNull(values.message),
      source,
    })
    .returning()

  return created
}

export async function listRsvps(): Promise<Rsvp[]> {
  return db
    .select()
    .from(rsvps)
    .where(eq(rsvps.status, 'confirmed'))
    .orderBy(desc(rsvps.createdAt))
}

export async function removeRsvp(id: string): Promise<void> {
  // Soft delete: keeps the history of who had confirmed.
  await db
    .update(rsvps)
    .set({ status: 'removed', updatedAt: new Date() })
    .where(eq(rsvps.id, id))
}

export async function countConfirmedGuests() {
  const [row] = await db
    .select({
      confirmations: sql<number>`count(*)::int`,
      people: sql<number>`(count(*) + coalesce(sum(${rsvps.companionsCount}), 0))::int`,
    })
    .from(rsvps)
    .where(eq(rsvps.status, 'confirmed'))

  return row ?? { confirmations: 0, people: 0 }
}
