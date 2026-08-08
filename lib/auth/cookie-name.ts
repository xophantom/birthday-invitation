/**
 * Admin session cookie name, isolated in a module without `server-only`.
 *
 * `lib/auth/session.ts` is `server-only` and can't be imported by `proxy.ts`,
 * which runs on the edge. Duplicating the literal would mean renaming the
 * cookie on one side leaves the other guarding a name that no longer exists,
 * with no compile error to warn about it.
 */
export const SESSION_COOKIE = 'convite_admin'
