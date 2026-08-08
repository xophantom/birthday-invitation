/**
 * Time the object URL is kept alive after the click. Revoking on the next line
 * invalidates it before the transfer starts, and iOS Safari then cancels the
 * download without any error.
 *
 * The window only has to cover the browser *starting* to read the blob (a few
 * frames, unrelated to file size), so 3s is generous without making the host
 * wait for a multi-hundred-MB zip to finish writing.
 */
const REVOKE_DELAY_MS = 3_000

/**
 * Saves a ready `Blob` as a file. The returned promise resolves once the URL
 * has been revoked, which is how the caller knows it is safe to start another
 * download without keeping two whole zips in memory.
 *
 * The anchor is appended to the document before `click()`: in several browsers
 * a disconnected element triggers no navigation and the click is a silent
 * no-op.
 */

export function triggerBlobDownload(blob: Blob, fileName: string): Promise<void> {
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = href
  anchor.download = fileName
  anchor.rel = 'noopener'
  anchor.style.display = 'none'

  document.body.append(anchor)
  anchor.click()

  return new Promise((resolve) => {
    setTimeout(() => {
      anchor.remove()
      URL.revokeObjectURL(href)
      resolve()
    }, REVOKE_DELAY_MS)
  })
}
