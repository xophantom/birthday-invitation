/**
 * Formato de uuid v4 aceito pelo Postgres.
 *
 * Todo `id` deste projeto entra por um canal alcançável de fora — Server
 * Action chamada por POST direto, `<form action>` reenviado à mão, cursor de
 * paginação vindo da querystring. Um valor fora do formato faz o driver do
 * Postgres rejeitar o parâmetro e lançar dentro da query; quem chama precisa
 * barrar antes de tocar o banco. Como o invariante é o mesmo nos três pontos,
 * ele mora aqui: três cópias divergindo silenciosamente seria pior que a
 * indireção.
 *
 * Sem a flag `g`, então `test()` não guarda `lastIndex` entre chamadas e pode
 * ser compartilhado com segurança.
 */
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
