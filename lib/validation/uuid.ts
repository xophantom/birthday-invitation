/**
 * UUID format accepted by Postgres.
 *
 * Every `id` in this project arrives through an externally reachable channel:
 * a Server Action called by direct POST, a hand-replayed `<form action>`, a
 * pagination cursor from the query string. A malformed value makes the
 * Postgres driver reject the parameter and throw inside the query, so callers
 * must screen it before touching the DB.
 *
 * No `g` flag, so `test()` keeps no `lastIndex` and this is safe to share.
 */
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
