/**
 * Required prefix for every photo blob in the store.
 *
 * Shared by the two halves of one defence: the upload route decides *where a
 * guest may write*, and the register action decides *which path may become a
 * row*. If they disagreed, a caller could get a token for anywhere in the
 * store — and blobs outside `photos/` never become rows, so that storage would
 * be invisible to the row-counting global cap.
 *
 * The prefix is also what makes `del(pathname)` safe when a photo is deleted:
 * without it, a caller-chosen pathname could wipe any blob in the store.
 */
export const PHOTOS_PATHNAME_PREFIX = 'photos/'

export function isPhotosPathname(value: string): boolean {
  return value.startsWith(PHOTOS_PATHNAME_PREFIX)
}
