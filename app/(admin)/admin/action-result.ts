/**
 * Formato de retorno de toda Server Action do admin que reporta resultado à
 * tela. `ok` decide o estilo da mensagem (sucesso ou erro) e se o formulário
 * pode se limpar; `message` é o texto em pt-BR mostrado ao anfitrião.
 *
 * Mora num módulo comum, e não em cada `actions.ts`, porque um arquivo
 * `'use server'` só pode exportar funções assíncronas — um tipo compartilhado
 * ali funciona por acidente da apagação de tipos do TypeScript, não por
 * contrato. Antes desta leva havia duas declarações estruturalmente idênticas
 * (`AdminActionResult` e `SetFavoriteResult`), e a segunda não tinha
 * consumidor nenhum.
 */
export type AdminActionResult = { ok: boolean; message?: string }
