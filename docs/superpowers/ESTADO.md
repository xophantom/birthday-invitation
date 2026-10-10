# Estado do projeto — leia isto primeiro

**As seis fases estão completas.** O que falta não é código: é o deploy e a verificação em produção, que dependem da sua conta e dos dados reais do evento.

**Branch:** `feat/acabamento` (repositório local, sem remote)
**Estado da árvore:** limpa. `npm run typecheck`, `npm run lint`, `npm test` (3 arquivos, 15 casos) e `npm run build` passam.

## Antes do deploy — nesta ordem

**1. Trocar as credenciais do admin.** O `.env` ainda tem `ADMIN_PASSWORD=admin` e `SESSION_SECRET=123`, valores de teste. O código agora exige 16 e 32 caracteres, então **o login está quebrado até você trocar** — isso é de propósito: o `jose` assina sem reclamar com chave de 3 bytes, e um HMAC-SHA256 assim cai offline em segundos para quem capturar um cookie, passando a forjar sessões de admin para sempre.

```
openssl rand -base64 48   # → SESSION_SECRET
openssl rand -base64 24   # → ADMIN_PASSWORD
```

Guarde a senha num gerenciador. Com valor curto, o login mostra "Configuração de acesso indisponível." e o motivo real fica no log.

**2. Cadastrar as variáveis na Vercel ANTES do build de produção.** `NEXT_PUBLIC_SITE_URL` é congelada em build time — cadastrar depois não conserta sem novo build. Ela vem **vazia** no `.env.example` de propósito: o valor `http://localhost:3000` que estava lá era o que transportava localhost para produção.

**3. Deployar.** `npx vercel`, cadastrar as variáveis, `npx vercel --prod`.

## Depois do deploy — em ordem de risco

**1. `/admin/qrcode` logado, em produção, antes de imprimir qualquer folha.** Passa se o aviso vermelho **não** aparece e a linha "Aponta para" mostra o domínio real. É o único item cujo erro é irreversível: com a folha já na mesa da festa, um QR apontando para localhost mata a coleta de fotos inteira e não há conserto.

**2. Escanear o QR impresso com um celular em dados móveis** (não no mesmo wifi). Passa se abre `/fotos` no domínio real e o formulário aparece.

**3. Colar o link numa conversa real do WhatsApp.** Passa se o card aparece com a arte à esquerda e nome, data e local à direita. O risco de tamanho foi tratado: o PNG da OG image passava de 800 KB, acima dos ~300 KB relatados como limite prático do WhatsApp, e agora a rota converte para JPEG no build (~75 KB). Se ainda assim o card não aparecer, use `?v=2` na URL para furar o cache do WhatsApp antes de investigar outra causa.

**4. Abrir o seletor de fotos num iPhone real.** Se não abrir, o único caminho de envio da festa está morto.

**5. Primeiro upload de ponta a ponta.** Passa se aparecem 2 arquivos no Blob, 1 linha em `photos`, e o log **não** contém `recusou uma URL fora do formato esperado`. Se falhar, cada foto vira 2 órfãos e 0 linhas, o teto nunca dispara porque conta linhas, e ninguém percebe até a festa acabar.

**6. `/admin` em aba anônima.** Passa se vai para `/login`, e não para a tela de erro.

**7. Sessão expirada no meio da ação.** Logado, apague o cookie `convite_admin` pelo DevTools e então adicione uma confirmação, toque uma estrela e clique "Baixar todas". Passa se os três levam a `/login` e nada é gravado.

**8. Orientação EXIF.** Envie uma foto na vertical e outra deitado, e abra a URL full. Passa se as duas saem em pé.

**9. HEIC de iPhone**, com "Alta eficiência" ligada. Passa se chega como JPEG.

**10. Download no celular que você vai usar na festa.** Com pelo menos 30 fotos, "Baixar todas". Passa se o `.zip` aparece em Arquivos e abre. Se a aba recarregar, é memória — use o download individual do lightbox.

**11. Falha e retentativa.** Modo avião no meio do envio. Passa se o item mostra a mensagem em pt-BR, o retry recupera, e ao final existe **uma** linha.

**12. Orçamento real de armazenamento.** Depois de ~10 fotos, divida os bytes do Blob pelo número de pares. Se ficar bem acima de ~840KB, `PHOTOS_GLOBAL_LIMIT=1000` não cabe em 1GB.

**13. Modal, teclado, `prefers-reduced-motion` e zoom a 200%.** Os únicos itens da varredura de acessibilidade que ninguém conseguiu testar interativamente — o modal exige login, e os outros dois exigem configuração do sistema.

**14. Onde olhar na noite.** Confirme que acha os logs da função na Vercel em menos de um minuto, pelo celular. É o único diagnóstico disponível durante o evento.

## Decisões suas que ficaram em aberto

**A arte traz o nome real escrito nela.** `public/poster.jpeg` tem o nome da aniversariante no banner. Verifiquei que o nome, o local e o endereço reais aparecem em **zero** arquivos de texto versionados — os que aparecem no design e nos ledgers são os anonimizados. A imagem é o único vazamento. Se o repositório for público, o nome fica visível para quem abrir o arquivo.

**`accept="image/*"` no seletor de fotos.** Acrescentar `.heic,.heif` faria a validação por extensão valer também no seletor. O revisor julgou que tokens de extensão só ampliam o filtro e não mudariam a oferta do Safari iOS, mas ninguém testou num iPhone.

**Conteúdo pendente, tudo uma linha na config:** `gifts.clothingSize`, `gifts.shoeSize`, `gifts.pixKey`, `media.soundtrack` e `media.openingVideo` continuam `null`. A interface se adapta sozinha.

**Ao preencher `media.soundtrack`, teste a abertura num celular.** O botão de música fica escondido enquanto a abertura está em cena — foi corrigido na Fase 6 —, mas essa combinação nunca rodou com áudio real.

## Dívida técnica registrada

Nada aqui bloqueia o evento. Em ordem de quanto importa:

- **Órfãos no armazenamento não são auto-limitados, e o teto não os enxerga** porque conta linhas da tabela. Não há caminho de limpeza. Uma varredura que compare blobs com linhas resolveria — o `@vercel/blob` tem `list()`.
- **`lib/db/index.ts` — o `.bind()` do Proxy descarta own properties de funções.** `db.$client.query(...)` estoura. Latente: nada usa o escape hatch de SQL cru.
- **`isPhotosPathname` aceita `photos/../x`.** Não explorável na cadeia atual. Fechar custa `&& !value.includes('..')`.
- **O guarda do QR Code cobre loopback, não IP de LAN** (`192.168.x.x`, `.local`). Exigiria alguém cadastrar um IP de rede local à mão no painel.
- **`app/(site)/not-found.tsx` é inalcançável hoje** — `notFound()` não é chamado em lugar nenhum, e quem atende o 404 é o da raiz. Rede de segurança de quatro linhas.
- **`npm test` imprime aviso do Vite** (`configLoader: 'native'`) porque `package.json` não tem `"type": "module"`. Mudar isso mexe na resolução de módulo do projeto inteiro.

## Como o projeto foi construído

Seis fases, cada uma com plano em `docs/superpowers/plans/` e ledger em `docs/superpowers/ledgers/`. O design aprovado está em `docs/superpowers/specs/2026-08-05-convite-design.md`.

Os ledgers registram o que os reviews acharam e por que cada decisão foi tomada — inclusive as que contrariaram o plano. Se for retomar o projeto ou adaptá-lo a outro evento, eles valem mais que o código.

O processo foi `superpowers:subagent-driven-development`: um subagente implementa, outro revisa, um terceiro re-revisa a correção. As Fases 4 e 5 registram uma calibração de ritmo pedida no meio do caminho, e o custo dela — na Fase 5, os cinco achados Importantes do review final estavam todos nos grupos que pularam o review por tarefa.

## Convenções do projeto

- **Whitelabel:** nenhum componente importa `config/event.config.ts` diretamente — sempre `getEventConfig()`.
- **Cores de marca sempre em token.** Exceções: preto puro para sombra, o `ImageResponse` (que não enxerga Tailwind) e o `global-error.tsx` (que roda quando os tokens podem não existir).
- **Sem TDD, três arquivos de teste no projeto inteiro** — decisão explícita. Cobrem lógica pura: schema de RSVP, cálculo de redimensionamento, assinatura de sessão.
- **Toda página e toda Server Action do admin chama `requireAdmin()` como primeira instrução**, e **nunca dentro de `try/catch`** — ele funciona lançando o `NEXT_REDIRECT`. Única exceção: `signOut`.
- **`(admin)` é route group e não gera segmento de URL.** `app/(admin)/layout.tsx` envolve **tanto** `/login` quanto `/admin`.
- **Todo módulo de `lib/` que lê ambiente ou banco começa com `import 'server-only'`.**
- **Toda Server Action que muta dados revalida a entrada no servidor**, e limite de recurso vale **também** na action, não só na rota que a UI chama.
- **Estilos de base vão em `@layer base`.**
- **Anúncio para leitor de tela: um canal só** — região viva persistente montada antes da mudança, ou gerenciamento de foco. Nunca os dois no mesmo nó.
- **Contrato do `Modal`:** fecha pelo evento nativo `close`. Nunca chame `onClose` direto.
- **Contrato do `FormField`:** quem passa o input liga `aria-describedby` e `aria-invalid`.
- **Nada de `crypto.randomUUID()` em código de cliente** — não existe em contexto inseguro.
- **`sessionStorage` sempre em `try/catch`** — lança em webview com armazenamento bloqueado.
- **Alvos de toque de 44px.** **Todo texto em pt-BR** acentuado. **Commits em pt-BR**, `tipo: descrição`.

## Particularidades do stack, verificadas

- `middleware.ts` não existe — é `proxy.ts`, na raiz, e **não** é autorização.
- `params` e `searchParams` são Promises; `cookies()` é assíncrono.
- **O `next build` do 16 não imprime mais `Size`/`First Load JS`** — removidas de propósito.
- **`ImageResponse` só suporta flexbox**, e todo elemento com mais de um filho precisa de `display: flex` explícito. Não enxerga `next/font` — a fonte é lida como arquivo, e precisa ser **estática**: o satori lida mal com fonte variável.
- **Um `not-found.tsx` dentro de route group não captura URL inexistente** — só `notFound()` chamado naquele grupo. URL sem rota cai no `app/not-found.tsx` raiz.
- **`NEXT_PUBLIC_*` é congelada em build time.** E variável declarada vazia no `.env` chega como string vazia, não `undefined` — `??` não a captura, `||` sim. `new URL('')` lança.
- **zod 4:** `z.string().url()` e `.email()` estão deprecados.
- **Drizzle:** `alias()` interpolado cru num template `sql` emite só o identificador, sem a tabela base. Use `db.select(...).as('nome')`. Timestamps chegam como `Date` truncado em milissegundo enquanto o Postgres guarda microssegundos.
- **`@vercel/blob`:** declarar `onUploadCompleted`, mesmo vazio, faz o serviço postar de volta por arquivo. E o SDK descarta o corpo de respostas não-ok.
- **`jose` não impõe tamanho mínimo de chave para HS256.**
- **`client-zip` armazena sem compressão.**
- **`useActionState` preserva os valores dos campos** entre submissões sem uma chave de reset.
- **React 19 trata `inert` como booleano de verdade** — `inert={false}` remove o atributo, ao contrário do React 18.

## Ambiente

`.env` (git-ignored) precisa de `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `ADMIN_PASSWORD` (≥16), `SESSION_SECRET` (≥32), `NEXT_PUBLIC_SITE_URL` e `PHOTOS_GLOBAL_LIMIT`. Veja `.env.example`, que documenta os mínimos e os comandos de geração.

**Revogação de emergência da sessão:** a sessão é stateless por decisão de design, então não há revogação por banco. Se um cookie vazar, troque `SESSION_SECRET` e redeploye — todos os tokens existentes deixam de valer.

`config/event.config.ts` é git-ignored e contém os dados reais. O versionado é `config/event.config.example.ts`.
