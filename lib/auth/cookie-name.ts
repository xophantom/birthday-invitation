/**
 * Nome do cookie de sessão do admin, isolado num módulo sem `server-only`.
 *
 * `lib/auth/session.ts` é `server-only` e não pode ser importado por
 * `proxy.ts` (roda no edge, fora do runtime de servidor do Next). Antes desta
 * extração o literal `'convite_admin'` estava duplicado nos dois arquivos:
 * renomear o cookie de um lado deixaria o outro protegendo (ou lendo) um
 * nome que não existe mais, sem nenhum erro de compilação para avisar.
 */
export const SESSION_COOKIE = 'convite_admin'
