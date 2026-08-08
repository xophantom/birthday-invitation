/**
 * Return shape of every admin Server Action that reports back to the screen.
 * `ok` drives the message style and whether the form may clear itself.
 *
 * In its own module rather than in an `actions.ts`, because a `'use server'`
 * file may only export async functions — a type exported from one works by
 * accident of type erasure, not by contract.
 */
export type AdminActionResult = { ok: boolean; message?: string }
