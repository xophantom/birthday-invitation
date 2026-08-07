'use client'

import { useActionState } from 'react'
import { signIn, type LoginState } from './actions'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'

const initialState: LoginState = {}

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, initialState)

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-5">
      <FormField label="Senha do administrador" htmlFor="password" error={state.error}>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!state.error}
          aria-describedby={state.error ? 'password-error' : undefined}
          className="min-h-11 w-full rounded-xl border border-accent/30 bg-surface/60 px-4 text-foreground"
        />
      </FormField>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  )
}
