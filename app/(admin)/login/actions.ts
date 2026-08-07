'use server'

import { redirect } from 'next/navigation'
import { createAdminSession, verifyPassword } from '@/lib/auth/session'

export type LoginState = { error?: string }

export async function signIn(
  _state: LoginState,
  formData: FormData
): Promise<LoginState> {
  const password = String(formData.get('password') ?? '')

  if (!password) {
    return { error: 'Informe a senha.' }
  }

  let valid = false
  try {
    valid = verifyPassword(password)
  } catch (error) {
    console.error('Falha ao verificar senha:', error)
    return { error: 'Configuração de acesso indisponível.' }
  }

  if (!valid) {
    return { error: 'Senha incorreta.' }
  }

  await createAdminSession()
  redirect('/admin')
}
