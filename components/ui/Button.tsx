import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost'
  size?: 'md' | 'lg'
}

/**
 * Toda variante precisa de um estado `disabled:` visível. `cursor-not-allowed`
 * (aplicado abaixo, para todas) não existe em toque: num celular o botão
 * parece habilitado e simplesmente não responde. `ghost` desabilitado
 * enfraquece borda e texto pelo mesmo caminho que `primary` já usa para o
 * fundo.
 */
const variants = {
  primary:
    'bg-accent text-surface-deep hover:bg-accent-light disabled:bg-accent/40',
  ghost:
    'border border-accent/50 text-accent-light hover:border-accent hover:bg-accent/10 disabled:border-accent/20 disabled:text-accent-light/40 disabled:hover:border-accent/20 disabled:hover:bg-transparent',
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
