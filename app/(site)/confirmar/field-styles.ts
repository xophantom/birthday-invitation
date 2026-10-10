export const inputClass =
  'min-h-11 w-full rounded-xl border border-accent/30 bg-surface-deep/60 px-4 text-foreground placeholder:text-foreground/40'

/**
 * `FormField` renders hint and error with ids derived from `htmlFor` but does
 * not own the input, so pointing at them is the caller's job. Both can be
 * visible at once: listing only the error would leave on-screen guidance
 * silent for screen reader users.
 */
export function describedBy(htmlFor: string, hasHint: boolean, hasError: boolean) {
  const ids = [hasHint && `${htmlFor}-hint`, hasError && `${htmlFor}-error`]
  const value = ids.filter(Boolean).join(' ')
  return value || undefined
}
