import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'md' | 'lg'
}

/** Every variant needs a visible `disabled:` state: `cursor-not-allowed`
 *  doesn't exist on touch, where a disabled button just looks enabled and
 *  silently ignores taps. */
const variants = {
  primary:
    'bg-accent text-surface-deep hover:bg-accent-light disabled:bg-accent/40',
  ghost:
    'border border-accent/50 text-accent-light hover:border-accent hover:bg-accent/10 disabled:border-accent/20 disabled:text-accent-light/40 disabled:hover:border-accent/20 disabled:hover:bg-transparent',
  // Confirmation of a destructive action only. The gold of `primary` reads as
  // "go ahead", and mid-party the colour is read before the label.
  danger:
    'bg-danger text-surface-deep hover:bg-danger/80 disabled:bg-danger/40',
} as const

const sizes = {
  md: 'min-h-11 px-5 text-sm',
  lg: 'min-h-13 px-8 text-base',
} as const

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-full font-sans font-medium tracking-wide transition-colors disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  )
}
