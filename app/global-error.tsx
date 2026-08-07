'use client'

/**
 * Cobre falha no próprio layout raiz (`app/layout.tsx`), quando nem o tema
 * carregou — por isso traz `<html>` e `<body>` próprios e cores em hex
 * literal. É a única tela do projeto em que isso é correto: as custom
 * properties `--brand-*` são aplicadas inline pelo layout raiz, então se ele
 * é quem falhou, os tokens podem não existir.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
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
