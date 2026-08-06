import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost'
  size?: 'md' | 'lg'
}

const variants = {
  primary:
    'bg-ouro text-esmeralda-fundo hover:bg-ouro-claro disabled:bg-ouro/40',
  ghost:
    'border border-ouro/50 text-ouro-claro hover:border-ouro hover:bg-ouro/10',
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
      className={`inline-flex items-center justify-center rounded-full font-sans font-medium tracking-wide transition-colors disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  )
}
