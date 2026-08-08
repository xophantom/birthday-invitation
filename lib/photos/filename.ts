/**
 * `uploadedBy` is guest-typed free text (up to 120 chars) that becomes a file
 * name, both inside the batch zip and in the single-photo download. Path
 * separators, Windows-reserved characters and control codes would produce a
 * malformed zip entry or an unexpected extraction path.
 *
 * Deliberately not `server-only`: the single download runs in the browser and
 * needs the same naming rule as the server-built zip.
 */
const MAX_UPLOADER_NAME_LENGTH = 50

/**
 * Bidi controls are not ASCII controls and would slip past `\x00-\x1F`. A
 * U+202E (RIGHT-TO-LEFT OVERRIDE) mid-name makes the file manager render the
 * rest reversed, so a `.jpg` can display with a different extension. Covers
 * U+061C, U+200E/U+200F, U+202A-U+202E and U+2066-U+2069.
 *
 * Written as `\uXXXX` escapes because the characters themselves are invisible
 * — a literal here would make this very rule impossible to review.
 */
const UNSAFE_FILENAME_CHARS =
  /[\\/:*?"<>|\x00-\x1F\x7F\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g

export function sanitizeUploaderName(rawName: string | null): string {
  const cleaned = (rawName ?? '')
    .replace(UNSAFE_FILENAME_CHARS, '')
    .trim()
    .slice(0, MAX_UPLOADER_NAME_LENGTH)
    .replace(/[.\s]+$/, '')

  return cleaned.length > 0 ? cleaned : 'convidado'
}
