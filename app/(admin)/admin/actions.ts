'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { destroyAdminSession, requireAdmin } from '@/lib/auth/session'
import { createRsvpRecord, removeRsvp } from '@/lib/db/queries/rsvp'
import { rsvpFormSchema } from '@/lib/validation/rsvp'

export type AdminActionResult = { ok: boolean; message?: string }

// Formulário de exclusão é um <form action> comum: alcançável por POST
// direto com qualquer valor em `id`, sem passar pela tabela. Um id que não
// bate com o formato de uuid faria o driver do Postgres rejeitar o parâmetro
// e lançar dentro da action, sem try/catch — o admin veria a tela de erro do
// Next em vez de, na pior hipótese, um no-op silencioso.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function addManualRsvp(
  _state: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  await requireAdmin()

  const parsed = rsvpFormSchema.safeParse({
    fullName: formData.get('fullName'),
    phone: formData.get('phone') ?? '',
    companionsCount: formData.get('companionsCount') ?? 0,
    message: formData.get('message') ?? '',
  })

  if (!parsed.success) {
    const flat = z.flattenError(parsed.error).fieldErrors
    return { ok: false, message: flat.fullName?.[0] ?? 'Confira os dados informados.' }
  }

  try {
    await createRsvpRecord(parsed.data, 'admin')
  } catch (error) {
    console.error('Falha ao adicionar confirmação manual:', error)
    return { ok: false, message: 'Não foi possível adicionar.' }
  }

  revalidatePath('/admin')
  return { ok: true }
}

export async function deleteRsvp(formData: FormData): Promise<void> {
  await requireAdmin()

  const id = String(formData.get('id') ?? '')
  if (!UUID_PATTERN.test(id)) return

  await removeRsvp(id)
  revalidatePath('/admin')
}

// Exceção deliberada à regra "toda action chama requireAdmin() primeiro":
// signOut só apaga o cookie de sessão e redireciona para /login. Exigir
// sessão válida para fazer logout criaria um estado sem saída para quem tem
// um cookie inválido ou expirado — o botão "Sair" pararia de funcionar
// justamente quando mais se precisa dele. Chamar sem sessão é inofensivo:
// na pior hipótese apaga um cookie que já não existia.
export async function signOut(): Promise<void> {
  await destroyAdminSession()
  redirect('/login')
}
