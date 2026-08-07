# Estado do projeto — leia isto primeiro

Ponto de entrada para retomar o trabalho numa sessão nova. Atualizado ao fim da Fase 5.

**Branch:** `feat/admin` (repositório local, sem remote)
**Progresso:** 5 de 6 fases completas
**Estado da árvore:** limpa. `npm run typecheck`, `npm run lint`, `npm test` (15 testes) e `npm run build` passam.

## Como retomar

Abra uma sessão nova na raiz do projeto e diga o que quer fazer, por exemplo:

> Retome o projeto do convite a partir da Fase 6. Leia `docs/superpowers/ESTADO.md` primeiro.

O agente deve, nesta ordem:

1. Ler este arquivo
2. Ler `docs/superpowers/specs/2026-08-05-convite-design.md` (o design aprovado)
3. Ler o plano da fase a executar em `docs/superpowers/plans/`
4. Invocar a skill `superpowers:subagent-driven-development`, que foi o processo usado nas cinco primeiras fases

Durante a execução, o ledger da fase vive em `.superpowers/sdd/<nome-do-plano>/progress.md`, que é git-ignored. **Ao fechar a fase, copie o ledger para `docs/superpowers/ledgers/` antes de apagar o workspace** — é onde ficam os das fases 1 a 5, e é o único registro detalhado que sobrevive. Este arquivo consolida só o que um agente precisa para retomar.

## Duas pendências operacionais — antes de qualquer coisa

**1. O login do admin está quebrado de propósito até você trocar as credenciais.** O `.env` tem `ADMIN_PASSWORD=admin` e `SESSION_SECRET=123`, valores de teste. A Fase 5 adicionou uma guarda de tamanho mínimo (16 e 32 caracteres) porque o `jose` assina feliz com chave de 3 bytes — e um HMAC-SHA256 com chave assim cai offline em segundos para quem capturar um cookie, passando a forjar sessões admin para sempre sem nunca precisar da senha. Rode:

```
openssl rand -base64 48   # → SESSION_SECRET
openssl rand -base64 24   # → ADMIN_PASSWORD
```

Guarde a senha num gerenciador. Com valor curto, o login mostra "Configuração de acesso indisponível." e o motivo real fica no log do servidor.

**2. A migração `drizzle/0001_daily_firebird.sql` continua sem ser aplicada.** Ela cria o índice único em `photos.full_pathname`, que impede alguém de encher o teto de armazenamento com POSTs repetidos na Server Action pública de fotos. Rode `npm run db:migrate`.

## O que está pronto

| Fase | Entrega | Commits |
|---|---|---|
| 1 — Fundação | `EventConfig` tipada e validada, tema em tokens CSS, tipografia, cinco componentes de UI, grupos de rota `(site)` e `(admin)` | até `d8c8753` |
| 2 — Convite | Abertura animada, pôster com data, menu, cinco seções, player de trilha | até `e7c86ca` |
| 3 — RSVP | Neon + Drizzle, schema com migração aplicada, validação com teste, camada de queries, Server Action, formulário | até `d8d0b63` |
| 4 — Fotos | Compressão no navegador, upload direto ao Blob, registro no banco, teto global, rota do QR Code | até `1bb155e` |
| 5 — Admin | Sessão em JWT assinado, login, convidados com adição manual e soft delete, revisão de fotos com favoritas, download em zip | até `934a97f` |

Rotas: `/`, `/manual`, `/presentes`, `/dress-code`, `/local`, `/confirmar`, `/fotos`, `/login`, `/admin`, `/admin/fotos`, o route handler `/api/photos/upload` e o `proxy.ts`.

## O que falta

**Fase 6 — Acabamento:** OG image, favicon e ícone de app, QR Code para impressão, revisão de acessibilidade, README, deploy.

### Escopo que caiu no vão e precisa entrar na Fase 6

Encontrado nos reviews, exigido pelo design aprovado, e não previsto em nenhum plano:

- **`error.tsx` por segmento não existe em lugar nenhum.** O design é explícito: "erro não pode parecer tela do Next". Hoje qualquer falha de banco numa tela do admin mostra a tela crua do framework.
- **`not-found.tsx` temático** também é exigido pelo design e não foi feito.
- **O README precisa registrar o procedimento de revogação de emergência da sessão:** trocar `SESSION_SECRET` e redeployar. A mitigação existe, mas ninguém sabe dela às 23h.
- O design mapeia `components/admin/{GuestTable,PhotoReviewGrid}`; eles ficaram em `app/(admin)/admin/`. Colocation defensável, mas é desvio não registrado — decida se normaliza ou documenta.
- `lib/photos/pathname.ts:14-17` promete que o prefixo "torna seguro o `del(pathname)` que a Fase 5 vai usar" — a Fase 5 não tem exclusão de foto. Expectativa pendurada desde a Fase 4.

## Verificação manual pendente

Nenhum teste automatizado cobre telas nem a pipeline de fotos: o projeto tem três testes no total, por decisão explícita do design, e eles cobrem lógica pura (schema de RSVP, cálculo de redimensionamento, assinatura de sessão).

### Fase 5 — admin, em ordem de risco

1. **Trocar as credenciais** (pendência 1 acima) e entrar em `/login`. Passa se a senha certa leva a `/admin` e a errada mostra "Senha incorreta." — e não "Configuração de acesso indisponível.", que denuncia segredo curto.
2. **A porta, em aba anônima.** `/admin` e `/admin/fotos` sem sessão. Passa se ambas redirecionam para `/login` sem mostrar dado nenhum. Depois, autenticado, confirme que `/login` ainda abre — é a armadilha do route group.
3. **Sessão expirada no meio da ação.** Logado, apague o cookie `convite_admin` pelo DevTools e então adicione uma confirmação, toque uma estrela e clique "Baixar todas". Passa se os três levam a `/login` e nada é gravado. É a prova de que as Server Actions não confiam no layout.
4. **Download no celular que você vai usar na festa.** Com pelo menos 30 fotos, toque "Baixar todas". Passa se o `.zip` aparece de fato em Arquivos e abre com as fotos numeradas. Se o progresso terminar e nenhum arquivo aparecer, é a âncora; se a aba recarregar, é memória — nesse caso use o download individual do lightbox.
5. **CORS do Vercel Blob.** É a premissa não verificada do download: o `fetch` cruza origem. Passa se o console não mostra erro de CORS durante o item 4.
6. **Paginação das fotos.** Favorite uma foto da segunda página (`PAGE_SIZE = 60`) e clique "Carregar mais". Passa se ela aparece com estrela cheia.
7. **Remoção de convidado.** Remova um RSVP e confira no `db:studio` que a linha continua com `status: 'removed'` e que os contadores caíram.
8. **Lightbox e teclado.** Amplie, feche com `Esc`, com o backdrop e com o botão. Passa se os três fecham.

### Fase 4 — fotos, em ordem de risco

1. **Abrir o seletor num iPhone real.** Se não abrir, o único caminho de envio da festa está morto.
2. **Primeiro upload de ponta a ponta**, conferindo que a regex do store bate com a URL real. Passa se aparecem 2 arquivos no Blob, 1 linha em `photos`, e o log **não** contém `recusou uma URL fora do formato esperado`. Se falhar, cada foto vira 2 órfãos e 0 linhas, o teto nunca dispara porque conta linhas, e ninguém percebe até a festa acabar.
3. **Orientação EXIF.** Envie uma foto na vertical e outra deitado, e abra a URL full. Passa se as duas saem em pé.
4. **HEIC de iPhone**, com "Alta eficiência" ligada. Passa se chega como JPEG.
5. **Falha e retentativa.** Modo avião no meio do envio. Passa se o item mostra a mensagem em pt-BR, o retry recupera, e ao final existe **uma** linha.
6. **Limites.** 11 fotos, um PDF, um arquivo acima de 15MB — as três recusas antes de qualquer compressão.
7. **Orçamento real.** Depois de ~10 fotos, divida os bytes do Blob pelo número de pares. Se ficar bem acima de ~840KB, `PHOTOS_GLOBAL_LIMIT=1000` não cabe em 1GB.
8. **Onde olhar na noite.** Confirme que acha os logs da função na Vercel em menos de um minuto, pelo celular.

## Pendências abertas

### Precisam de decisão sua

**A arte traz o nome real escrito nela.** `public/poster.jpeg` tem o nome da aniversariante no banner. Todo o texto do repositório foi anonimizado, mas a imagem não. Se o repositório for público, o nome fica visível. Decisão natural para a Fase 6, junto do deploy.

**`accept="image/*"` no seletor de fotos.** Acrescentar `.heic,.heif` faria a validação por extensão valer também no seletor. O revisor julgou que tokens de extensão só ampliam o filtro e não mudariam a oferta do Safari iOS, mas ninguém testou num iPhone.

**Conteúdo de presentes.** `gifts.clothingSize`, `gifts.shoeSize` e `gifts.pixKey` estão `null`. A página omite os blocos vazios por design.

**Trilha e vídeo de abertura.** `media.soundtrack` e `media.openingVideo` são `null`. Salve os arquivos em `public/` e aponte a config.

### Trabalho técnico registrado

**Dois defeitos de uma linha na Fase 5, parkeados, que mordem no cenário "anfitrião no celular durante a festa":** o botão de download volta a ficar habilitado enquanto o object URL do zip anterior ainda segura o blob por 60s (dois toques mantêm dois zips vivos, ~1,6GB); e fechar o modal de remoção por `Esc` ou backdrop **durante** a remoção faz a mensagem de falha nunca aparecer.

**Órfãos no armazenamento não são auto-limitados, e o teto não os enxerga** porque conta linhas. Não há caminho de limpeza. A Fase 5 tem `list()` do Blob à mão via `@vercel/blob` — vale uma varredura que compare blobs com linhas.

**`lib/db/index.ts:39` — o `.bind()` do Proxy descarta own properties de funções.** `db.$client.query(...)` estoura. Latente: nada usa o escape hatch de SQL cru.

**`isPhotosPathname` aceita `photos/../x`.** Não explorável na cadeia atual. Fechar custa `&& !value.includes('..')`.

**Acessibilidade para a varredura da Fase 6:** o `<p role="status">` do `AddGuestForm` é montado junto com o texto, caso que o próprio projeto documenta como não garantido; sucesso e erro se distinguem só pela cor; o botão de som (`z-50`) sobrepõe o "Pular" da abertura (`z-40`) em ~40×40px e vence o hit-test; `❧` (U+2767) tem cobertura irregular em Android; e "Escolher outras fotos" / "Enviar mais fotos" desmontam sem mover o foco.

**Aviso do Vite na suíte.** `npm test` imprime `configLoader: 'native'` porque `package.json` não tem `"type": "module"`. Mudar isso mexe na resolução de módulo do projeto inteiro.

## Convenções que o projeto adotou

- **Whitelabel:** nenhum componente importa `config/event.config.ts` diretamente — sempre `getEventConfig()` de `lib/config.ts`.
- **Cores de marca sempre em token.** Exceção: preto puro para sombra e escurecimento. Hex apenas em `app/globals.css` e na config.
- **Sem TDD, três testes no projeto inteiro** — decisão explícita. Os três existem: schema de RSVP, cálculo de redimensionamento, assinatura de sessão. Não adicione.
- **Toda página e toda Server Action do admin chama `requireAdmin()` como primeira instrução**, e **nunca dentro de `try/catch`** — ele funciona lançando o `NEXT_REDIRECT`, que um `catch` engoliria. A única exceção é `signOut`. O mesmo vale para `redirect()`.
- **`(admin)` é route group e não gera segmento de URL.** `app/(admin)/layout.tsx` envolve **tanto** `/login` quanto `/admin` — `requireAdmin()` não pode ir nele.
- **Todo módulo de `lib/` que lê ambiente ou banco começa com `import 'server-only'`.**
- **Toda Server Action que muta dados revalida a entrada no servidor** — são alcançáveis por POST direto. E se houver limite de recurso, ele precisa ser aplicado **também** na action, não só na rota que a UI chama.
- **Estilos de base vão em `@layer base`.** Declarações fora de layer vencem `@layer utilities` no CSS moderno.
- **Anúncio para leitor de tela: escolha um canal, não dois.** Ou região viva persistente montada **antes** da mudança, ou gerenciamento de foco. Empilhar `role="status"` no nó que recebe foco faz o leitor falar duas vezes.
- **Contrato do `Modal`:** fecha pelo evento nativo `close` do `<dialog>`. Nunca chame `onClose` direto; mude o estado do pai.
- **Contrato do `FormField`:** quem passa o input liga `aria-describedby` a `${htmlFor}-hint` e `${htmlFor}-error` e passa `aria-invalid`.
- **Nada de `crypto.randomUUID()` em código de cliente** — não existe em contexto inseguro, e `http://192.168.x.x:3000` é como se testa no celular.
- **Nenhum gate client-only pode ser dono do primeiro paint.**
- **`sessionStorage` sempre em `try/catch`** — lança em webview com armazenamento bloqueado, que é como um link do WhatsApp abre.
- **Alvos de toque de 44px.**
- **Todo texto de interface em pt-BR**, com acentuação correta. **Commits em pt-BR**, formato `tipo: descrição`.

## Particularidades do stack já verificadas

- `middleware.ts` não existe — o arquivo é `proxy.ts`, na raiz, e **não** é solução de autorização. O matcher `/admin/:path*` casa `/admin`, `/admin/` e `/admin/fotos`, e recusa `/adminx` (verificado compilando com o `path-to-regexp` interno do Next).
- `params` e `searchParams` são Promises; `cookies()` é assíncrono.
- **O `next build` do 16 não imprime mais as colunas `Size` e `First Load JS`** — foram removidas de propósito. Uma saída sem elas não é uma saída editada.
- `ImageResponse` suporta apenas flexbox — sem grid, e todo elemento com filhos precisa de `display: flex` explícito. **Relevante para a OG image da Fase 6.**
- Tailwind v4 não tem `tailwind.config.js`; tokens em `@theme inline`. Gradientes são `bg-linear-to-*`.
- **zod 4:** `z.string().url()` e `.email()` estão deprecados em favor de `z.url()`, `z.email()`.
- **Drizzle:** `alias()` interpolado cru num template `sql\`\`` emite só o identificador do alias, sem a tabela base — a query quebra. Use `db.select(...).as('nome')`. Interpolar o subselect direto gera parênteses duplos, que o Postgres lê como subconsulta escalar.
- **Timestamps do Drizzle chegam como `Date` do JS**, truncados em milissegundo, enquanto o Postgres guarda microssegundos. Cursor derivado desse `Date` perde linhas em silêncio.
- **`@vercel/blob`:** declarar `onUploadCompleted`, mesmo vazio, faz o SDK derivar um `callbackUrl` e o serviço passar a fazer POST de volta por arquivo. E o SDK **descarta o corpo** de respostas não-ok da rota de token.
- **`jose` não impõe tamanho mínimo de chave para HS256** — assina feliz com 3 bytes. A guarda é do nosso código.
- **`client-zip` armazena sem compressão** (método STORE). O zip final tem o tamanho da soma das fotos.
- **`useActionState` preserva os valores dos campos entre submissões** a menos que você controle uma chave de reset.

## Ambiente

`.env` (git-ignored) precisa de `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `ADMIN_PASSWORD` (≥16 caracteres) e `SESSION_SECRET` (≥32). Veja `.env.example`, que documenta os mínimos e os comandos de geração.

**Confirme que `PHOTOS_GLOBAL_LIMIT` está setada no ambiente da Vercel.** Ausente, cai em 1000 sem aviso — que é o valor desejado, mas por acidente.

`drizzle.config.ts` lê `.env.local` e `.env`, nessa ordem de precedência.

`config/event.config.ts` é git-ignored e contém os dados reais do evento. O versionado é `config/event.config.example.ts`.
