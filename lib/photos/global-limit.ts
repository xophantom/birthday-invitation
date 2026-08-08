import 'server-only'

const DEFAULT_PHOTOS_GLOBAL_LIMIT = 1000

export const PHOTOS_LIMIT_REACHED_MESSAGE = 'Limite de armazenamento atingido.'

let cachedPhotosGlobalLimit: number | undefined

/**
 * Global cap on stored photos, in full+thumb pairs — the same unit
 * `countPhotos()` returns.
 *
 * Shared by the two independent entry points that need the same rule: the
 * upload token route stops whoever uploads bytes, and the register action
 * stops whoever skips the route and POSTs the row directly. A cap worth 1000
 * on one path and something else on the other would be no cap at all.
 *
 * Read lazily so the value isn't frozen at module import, and an absent or
 * malformed value falls back to the default instead of becoming a silent
 * `NaN` that would make every comparison fail and remove the cap entirely.
 */
export function getPhotosGlobalLimit(): number {
  if (cachedPhotosGlobalLimit === undefined) {
    const raw = process.env.PHOTOS_GLOBAL_LIMIT
    const parsed = raw === undefined ? Number.NaN : Number(raw)
    cachedPhotosGlobalLimit =
      Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_PHOTOS_GLOBAL_LIMIT
  }
  return cachedPhotosGlobalLimit
}
