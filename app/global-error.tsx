'use client'

import { useEffect } from 'react'

/**
 * Covers a failure in the root layout itself, before the theme has loaded —
 * hence its own `<html>`/`<body>` and literal hex colours. The only screen
 * where that is correct: the `--brand-*` properties are applied inline by the
 * root layout, so if that is what broke, the tokens may not exist.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // In production the original message is replaced by a generic one, and only
  // `digest` links this failure to its server log entry.
  useEffect(() => {
    console.error('Erro no layout raiz:', error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          backgroundColor: '#071A11',
          color: '#F3EAD3',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: '1.5rem',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', color: '#E8C766' }}>
          Não conseguimos carregar o convite
        </h1>
        <button
          type="button"
          onClick={reset}
          style={{
            minHeight: 44,
            padding: '0 1.5rem',
            borderRadius: 999,
            backgroundColor: '#C9A227',
            color: '#071A11',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Tentar de novo
        </button>
      </body>
    </html>
  )
}
