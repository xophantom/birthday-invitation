# Estado do projeto — leia isto primeiro

Ponto de entrada para retomar o trabalho numa sessão nova. Atualizado ao fim da Fase 4.

**Branch:** `feat/convite` (repositório local, sem remote)
**Progresso:** 4 de 6 fases completas
**Estado da árvore:** limpa. `npm run typecheck`, `npm run lint`, `npm test` (10 testes) e `npm run build` passam.

## Como retomar

Abra uma sessão nova na raiz do projeto e diga o que quer fazer, por exemplo:

> Retome o projeto do convite a partir da Fase 5. Leia `docs/superpowers/ESTADO.md` primeiro.

O agente deve, nesta ordem:

1. Ler este arquivo
2. Ler `docs/superpowers/specs/2026-08-05-convite-design.md` (o design aprovado)
3. Ler o plano da fase a executar em `docs/superpowers/plans/`
4. Invocar a skill `superpowers:subagent-driven-development`, que foi o processo usado nas quatro primeiras fases

Os ledgers detalhados de cada fase executada ficam em `.superpowers/sdd/<nome-do-plano>/progress.md` e **não são versionados** — este arquivo consolida o que sobrevive deles.

## Pendência operacional — antes de qualquer coisa

**A migração `drizzle/0001_daily_firebird.sql` foi gerada mas não aplicada.** Ela cria um índice único em `photos.full_pathname`, que é o que impede alguém de encher o teto de armazenamento com POSTs diretos repetidos na Server Action pública. Rode `npm run db:migrate` — não foi rodado durante a Fase 4 porque `DATABASE_URL` aponta para o banco de produção do evento e essa é uma ação sua, não de um agente.

Se o banco já tiver `full_pathname` duplicado, a migração falha. Improvável (o Blob adiciona sufixo aleatório), mas confira antes.

## O que está pronto

| Fase | Entrega | Commits |
|---|---|---|
| 1 — Fundação | `EventConfig` tipada e validada, tema em tokens CSS, tipografia, cinco componentes de UI, grupos de rota `(site)` e `(admin)` | até `d8c8753` |
| 2 — Convite | Abertura animada, pôster com data, menu, cinco seções, player de trilha | até `e7c86ca` |
| 3 — RSVP | Neon + Drizzle, schema com migração aplicada, validação com teste, camada de queries, Server Action, formulário funcionando | até `d8d0b63` |
| 4 — Fotos | Compressão no navegador, upload direto ao Blob, registro no banco, teto global, rota do QR Code | até `1bb155e` |

Rotas existentes: `/`, `/manual`, `/presentes`, `/dress-code`, `/local`, `/confirmar`, `/fotos` e o route handler `/api/photos/upload`.

**O convite já pode circular** — confirmações de presença e fotos são gravadas.

## O que falta

- **Fase 5 — Admin:** sessão com `jose`, lista de convidados, revisão de fotos, download em zip.
- **Fase 6 — Acabamento:** OG image, ícones, QR Code para impressão, revisão de acessibilidade, README, deploy.

## Verificação manual da Fase 4 — ainda não feita

Nenhum teste automatizado executa a pipeline de fotos: `createImageBitmap`, `canvas` e `toBlob` só existem no navegador, e o projeto tem três testes no total por decisão do design. Esta lista é a única barreira que sobra, em ordem de risco.

1. **Abrir o seletor num iPhone real (Safari iOS).** Passa se o seletor abre e a lista popula. Se falhar, o único caminho de envio da festa está morto.
2. **Primeiro upload real de ponta a ponta.** Passa se aparecem exatamente 2 arquivos no painel do Blob (`photos/…-full.jpg` e `-thumb.jpg`), a tabela `photos` ganha **1** linha com as quatro colunas de URL/pathname preenchidas, e o log da função **não** contém `recusou uma URL fora do formato esperado`. É este passo que valida a regex do store contra o formato real — se falhar, cada tentativa vira 2 órfãos e 0 linhas, o teto nunca dispara (ele conta linhas) e ninguém percebe até a festa acabar.
3. **Orientação EXIF.** Envie uma foto tirada na vertical e outra deitado, e **abra a URL full**. Passa se as duas saem em pé.
4. **HEIC de iPhone.** Com "Alta eficiência" ligada na câmera, envie uma foto. Passa se chega como JPEG e abre.
5. **Falha e retentativa.** Ative o modo avião no meio do envio. Passa se o item vai para "Falhou" com a mensagem em pt-BR visível, "Tentar de novo" recupera, e ao final existe **uma** linha para aquela foto.
6. **Lote parcial e saída.** 3 fotos, uma falhando. Passa se o contador do botão reflete só o que falta, "Tentar de novo" só aparece na que falhou, e "Escolher outras fotos" devolve ao seletor sem apagar o que já subiu.
7. **Limites.** 11 fotos → mensagem de máximo; um PDF → recusa; arquivo acima de 15MB → recusa. Todas antes de qualquer compressão.
8. **Dois convidados simultâneos.** Passa se os dois lotes completam e o total de linhas bate.
9. **Orçamento de armazenamento real.** Depois de ~10 fotos, divida os bytes do painel do Blob pelo número de pares. Se a média ficar bem acima de ~840KB, `PHOTOS_GLOBAL_LIMIT=1000` não cabe em 1GB e o valor precisa cair **antes** da festa.
10. **Onde olhar na noite.** Confirme que você acha os logs da função na Vercel em menos de um minuto, pelo celular. É o único diagnóstico disponível durante o evento.

## Pendências abertas

### Precisam de decisão sua

**A arte traz o nome real escrito nela.** `public/poster.jpeg` tem o nome da aniversariante no banner sob o brasão. Todo o texto do repositório e do histórico foi anonimizado, mas a imagem não. Se o repositório for público, o nome fica visível. Saídas: publicar assumindo isso, ou versionar uma arte genérica e ignorar a real como já é feito com `config/event.config.ts`. Decisão natural para a Fase 6, junto do deploy.

**`accept="image/*"` no seletor de fotos.** Acrescentar `.heic,.heif` faria a validação por extensão (que aceita HEIC com `type` vazio, como Windows entrega) valer também no seletor. O revisor julgou que tokens de extensão só ampliam o filtro e não mudariam a oferta do Safari iOS, mas ninguém pôde testar num iPhone. Decida quando tiver um em mãos.

**Conteúdo de presentes ainda não fornecido.** `gifts.clothingSize`, `gifts.shoeSize` e `gifts.pixKey` estão `null` em `config/event.config.ts`. A página `/presentes` omite os blocos vazios por design — melhora sozinha quando você preencher.

**Trilha e vídeo de abertura não existem.** `media.soundtrack` e `media.openingVideo` são `null`. Os slots estão prontos: salve os arquivos em `public/` e aponte a config.

### Trabalho técnico registrado

**Órfãos no armazenamento não são auto-limitados, e o teto não os enxerga.** O teto conta linhas da tabela; um par que sobe e falha ao registrar consome armazenamento sem contar. Não há hoje nenhum caminho de limpeza. **A Fase 5 é a única que terá `list()` do Blob à mão** — vale incluir lá uma varredura que compare blobs com linhas.

**Quatro imprecisões de comentário, parkeadas no review final.** Nenhuma afeta comportamento: o comentário de `lib/photos/resize.test.ts:38` diz "três testes no total" quando a suíte tem 10; os de `app/api/photos/upload/route.ts:56-61` e `lib/photos/pathname.ts:8-12` inflam o ganho da checagem de prefixo (ela confina o namespace e blinda o `del(pathname)` da Fase 5, mas não torna o consumo visível ao teto); e `route.ts:31-34` atribui ao "design" um orçamento de ~840KB/par que não está escrito em lugar nenhum.

**`isPhotosPathname` aceita `photos/../x`.** Não é explorável na cadeia atual — o SDK manda o pathname como query param, sem colapso de caminho, e `pathnameMatchesUrl` reprova o registro porque `new URL()` normaliza. Fechar custa `&& !value.includes('..')` em `lib/photos/pathname.ts:21`.

**`lib/db/index.ts:39` — o `.bind()` do Proxy descarta own properties de funções.** `db.$client.query(...)` estoura. Latente: nada até aqui usa o escape hatch de SQL cru. **Avise quem executar a Fase 5**, que é onde SQL cru pode aparecer.

**Colisão de alvo de toque.** O botão de som (`fixed bottom-5 right-5`, `z-50`) sobrepõe o "Pular" da abertura (`absolute bottom-6 right-6`, `z-40`) em cerca de 40×40px, e vence o hit-test. Dormente enquanto não houver trilha configurada. Já está no checklist da Fase 6.

**Glifo com risco de tofu.** `❧` (U+2767) aparece em `app/(site)/presentes/page.tsx` e no `Ornament`. Cobertura irregular em Android. Também no checklist da Fase 6.

**Gestão de foco ao trocar de tela em `/fotos`.** "Escolher outras fotos" e "Enviar mais fotos" desmontam sem mover o foco, que cai no `<body>`. Entra na varredura de acessibilidade da Fase 6.

**Aviso do Vite na suíte.** `npm test` imprime `configLoader: 'native'` porque `package.json` não tem `"type": "module"`. Adicionar isso mexe na resolução de módulo do projeto inteiro — não vale às vésperas do evento.

## Convenções que o projeto adotou

Um agente que retome precisa respeitar estas, que valem para todas as fases:

- **Whitelabel:** nenhum componente importa `config/event.config.ts` diretamente — sempre `getEventConfig()` de `lib/config.ts`.
- **Cores de marca sempre em token** (`bg-surface`, `text-accent`, `text-foreground`, `text-danger`, `text-highlight`). Exceção: preto puro para sombra e escurecimento. Hex apenas em `app/globals.css` e na config.
- **Sem TDD, três testes no projeto inteiro** — decisão explícita do `tmp/prompt.md`. Dois já existem (schema de RSVP, cálculo de redimensionamento); o terceiro é a sessão do admin, na Fase 5.
- **Todo módulo de `lib/` que lê ambiente ou banco começa com `import 'server-only'`.** Sem isso, uma UI que importe uma constante de lá arrasta o módulo para o bundle do cliente, onde `process.env` é `undefined` e o valor cai para o default em silêncio.
- **Estilos de base vão em `@layer base`.** Declarações fora de layer vencem `@layer utilities` no CSS moderno — isso já causou um defeito real.
- **`prefers-reduced-motion`:** a regra CSS só alcança animações CSS. As do `motion` são JavaScript e dependem do `MotionProvider` do layout `(site)`.
- **Toda Server Action que muta dados revalida a entrada no servidor** — elas são alcançáveis por POST direto, fora da UI. E se houver limite de recurso, ele precisa ser aplicado **também** na action, não só na rota que a UI chama: as duas metades da mesma defesa não podem discordar.
- **Nenhum gate client-only pode ser dono do primeiro paint.**
- **Acesso a `sessionStorage` sempre em `try/catch`** — ele lança em webview embutida com armazenamento bloqueado, que é como um link do WhatsApp abre.
- **Contrato do `FormField`:** quem passa o input em `children` liga `aria-describedby` a `${htmlFor}-hint` e `${htmlFor}-error` (os que existirem) e passa `aria-invalid`. Está documentado no docblock do componente.
- **Anúncio para leitor de tela: escolha um canal, não dois.** Ou região viva persistente montada **antes** da mudança, ou gerenciamento de foco. Empilhar `role="status"` no mesmo nó que recebe foco faz o leitor falar duas vezes — o defeito já apareceu duas vezes neste projeto.
- **Nada de `crypto.randomUUID()` em código de cliente.** Ele não existe em contexto inseguro, e `http://192.168.x.x:3000` é exatamente como se testa no celular.
- **Todo texto de interface em pt-BR**, com acentuação correta.
- **Commits em pt-BR**, formato `tipo: descrição`.

## Particularidades do Next.js 16 e do stack já verificadas

Estas divergem do que a maioria dos exemplos assume, e estão confirmadas nos docs em `node_modules/next/dist/docs/`:

- `middleware.ts` não existe — o arquivo é `proxy.ts`, na raiz. E ele **não** é solução de autorização, apenas redirect otimista.
- `params` e `searchParams` são Promises; `cookies()` é assíncrono.
- **O `next build` do 16 não imprime mais as colunas `Size` e `First Load JS`** — foram removidas de propósito. Uma saída sem elas não é uma saída editada.
- `ImageResponse` suporta apenas flexbox — `display: grid` não funciona, e todo elemento com filhos precisa de `display: flex` explícito.
- Tailwind v4 não tem `tailwind.config.js`; tokens vão em `@theme inline` no `globals.css`. Gradientes são `bg-linear-to-*`.
- **zod 4:** `z.string().url()`, `.email()` e afins estão deprecados em favor de `z.url()`, `z.email()`.
- **Drizzle:** `alias()` de `drizzle-orm/pg-core` interpolado cru num template `sql\`\`` emite **só o identificador do alias**, sem a tabela base — a query quebra com `relation "x" does not exist`. Para subconsulta dentro de `sql\`\``, use `db.select(...).as('nome')`, que renderiza a tabela derivada completa. Interpolar o subselect direto gera parênteses duplos, que o Postgres lê como subconsulta escalar.
- **Timestamps do Drizzle chegam como `Date` do JS**, truncados em milissegundo, enquanto o Postgres guarda microssegundos. Cursor derivado desse `Date` perde linhas em silêncio. `listPhotos` resolve comparando a tupla `(created_at, id)` dentro do banco, com o cursor sendo só o UUID da última linha.
- **`@vercel/blob`:** declarar `onUploadCompleted`, mesmo vazio, faz o SDK derivar um `callbackUrl` e, em produção na Vercel, o serviço passa a fazer POST de volta por arquivo. E o SDK **descarta o corpo** de respostas não-ok da rota de token, então uma mensagem de erro específica que ela devolva nunca chega ao navegador.

## Ambiente

O `.env` (git-ignored) precisa ter `DATABASE_URL` e `BLOB_READ_WRITE_TOKEN`, ambos já configurados. `ADMIN_PASSWORD` e `SESSION_SECRET` são gerados na Fase 5. Veja `.env.example` para a lista completa.

**Confirme que `PHOTOS_GLOBAL_LIMIT` está setada no ambiente da Vercel.** Ausente, ela cai em 1000 sem aviso — que é o valor desejado, mas por acidente, e o mesmo silêncio esconderia um valor digitado errado.

O `drizzle.config.ts` lê `.env.local` e `.env`, nessa ordem de precedência.

`config/event.config.ts` é git-ignored e contém os dados reais do evento. O versionado é `config/event.config.example.ts`, com dados fictícios.
