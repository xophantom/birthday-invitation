'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import type { AdminActionResult } from './action-result'
import { destroyAdminSession, requireAdmin } from '@/lib/auth/session'
import { createRsvpRecord, removeRsvp } from '@/lib/db/queries/rsvp'
import { rsvpFormSchema } from '@/lib/validation/rsvp'
import { UUID_PATTERN } from '@/lib/validation/uuid'

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
  return { ok: true, message: 'Confirmação adicionada à lista.' }
}

export async function deleteRsvp(
  _state: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  await requireAdmin()

  // O formulário de exclusão é alcançável por POST direto com qualquer valor
  // em `id`, sem passar pela tabela. Um id fora do formato de uuid faria o
  // driver do Postgres rejeitar o parâmetro e lançar dentro da query.
  const id = String(formData.get('id') ?? '')
  if (!UUID_PATTERN.test(id)) {
    return { ok: false, message: 'Convidado inválido.' }
  }

  // Mesmo tratamento das actions irmãs: com o Neon instável no wifi da festa,
  // uma falha sem try/catch subiria como exceção não tratada e o anfitrião
  // veria a tela de erro crua do Next — este projeto não tem `error.tsx` em
  // nenhum segmento. Aqui a falha vira mensagem dentro do próprio modal.
  try {
    await removeRsvp(id)
  } catch (error) {
    console.error('Falha ao remover confirmação:', error)
    return { ok: false, message: 'Não foi possível remover. Tente novamente.' }
  }

  revalidatePath('/admin')
  return { ok: true }
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
