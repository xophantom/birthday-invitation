# Convite Digital de Aniversário

Convite digital para uma festa de 15 anos (tema Princesa Tiana), com confirmação de
presença, coleta de fotos dos convidados via QR Code impresso na mesa da festa e uma área
administrativa protegida onde o anfitrião gerencia tudo. É também peça de portfólio: pensado
para ser adaptável a outro evento por configuração, sem reescrever componentes.

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 ·
Neon/Postgres via Drizzle · Vercel Blob

## Whitelabel

Todo conteúdo específico do evento vive em `config/event.config.ts`, validado por zod contra o
contrato em `config/event.schema.ts`. Nenhum componente importa esse arquivo diretamente:
todos passam por `getEventConfig()` (`lib/config.ts`).

**Esse arquivo é versionado, e é por isso que o convite é deployável.** A primeira versão o
mantinha git-ignored, para não publicar nome, endereço e data reais — mas `lib/config.ts` o
importa estaticamente, e import estático se resolve em build-time: a Vercel builda a partir do
clone do git, então um arquivo ausente do repositório derruba o build com `Module not found`,
sem chance de fallback em runtime. Como o convite é um site público — os mesmos dados aparecem
na home, na página do local e na OG image —, mantê-los fora do repositório protegia pouco e
custava o deploy. Se você for adaptar isto a um evento cujos dados não podem ser públicos,
mantenha o repositório privado; esconder só este arquivo não é uma opção que funcione.
`config/event.config.example.ts` fica como referência da forma esperada, com dados fictícios.

Adaptar para outra festa: editar a config e trocar a arte em `public/poster.jpeg`. As cores
de marca viram CSS custom properties (`--brand-*`), aplicadas inline no layout raiz a partir
da config, e o Tailwind as expõe como utilitários via `@theme inline` — não há cor de marca
em hex literal em componente algum. A única exceção documentada é `app/global-error.tsx`, que
cobre a falha do próprio layout raiz: se ele quebrou, as custom properties podem nem existir,
então essa tela usa valores fixos de propósito.

## Decisões de arquitetura

**Upload direto ao Blob, sem passar pelo servidor.** Server Actions têm limite de corpo
(~4,5MB) e o convidado costuma enviar várias fotos de uma vez. O route handler
(`app/api/photos/upload/route.ts`) apenas emite um token assinado e aplica o teto global de
armazenamento antes de autorizar o envio.

**Registro por Server Action em vez do callback `onUploadCompleted`.** O callback do Blob não
dispara em localhost sem túnel, o que inviabilizaria o desenvolvimento, e chega por arquivo —
quebrando o pareamento full+thumbnail, que só existe depois que os dois blobs sobem.

**Compressão própria em duas versões, no navegador — sem biblioteca de compressão e sem Web
Worker dedicado.** Full em 2048px e thumbnail em 400px, via `createImageBitmap` + canvas +
`toBlob` (`hooks/use-image-compression.ts`). O cálculo de redimensionamento
(`lib/photos/resize.ts`) é uma função pura coberta por teste, e é o próprio código do projeto
que decide o tamanho final — nada delegado a uma biblioteca de compressão. Sem Web Worker
porque `createImageBitmap` já decodifica fora da thread principal e `toBlob` é assíncrono; o
que sobra na thread principal é só o `drawImage`, pequeno o bastante para não travar a
interface. O grid de revisão do admin carrega os thumbnails; a versão full só é buscada ao
ampliar a foto.

**HEIC convertido no navegador, com o Safari como plano B.** O público desta festa é
majoritariamente iPhone, e o padrão da câmera do iPhone é HEIC — formato que nem
`createImageBitmap` nem a maioria dos navegadores decodifica. `heic2any` é a única dependência
de runtime deste pipeline, carregada sob demanda (`await import`) porque é pesada e a maior
parte dos envios não precisa dela. A detecção olha tipo MIME **e** extensão: o `type` de um
`.heic` chega vazio em vários ambientes, e confiar só nele deixaria passar direto para a
decodificação um arquivo que precisa de conversão.

O interessante é o que acontece quando a conversão falha. A `heic2any` instalada é a 0.0.4 e
engasga em variantes reais (HDR, 10-bit, HEIC com múltiplas imagens). Nesse caso o código
**devolve o arquivo original em vez de encerrar** — o Safari decodifica HEIC nativamente,
então o caminho alternativo de decodificação (`<img>` + `.decode()`, que existe por outro
motivo: engines antigas que rejeitam `imageOrientation: 'from-image'`) ainda tem chance de
abrir o mesmo arquivo que a biblioteca não abriu. Justamente no aparelho onde o formato é mais
provável, o navegador é a rede de segurança. A mensagem de erro específica de HEIC não se
perde: ela só deixa de ser lançada cedo demais, e volta a ser lançada se a decodificação
nativa também falhar.

**`<img>` para as fotos do Blob, `next/image` para os assets do convite.** As miniaturas já
saem prontas em ~40KB do navegador do convidado; reprocessá-las gastaria transformações pagas
sem ganho algum. `next/image` cobre o pôster e a arte da sequência de abertura.

**Zip montado no navegador.** Empacotar centenas de fotos numa função serverless estouraria o
tempo limite; no navegador não há esse teto e os bytes vão direto do Blob ao disco.

**Um booleano de favorita no lugar de `pending/approved/rejected`.** Não existe mural
público, então três estados não controlariam a visibilidade de nada — só adicionariam UI de
moderação para um problema inexistente.

**Autorização na camada de dados, não no proxy.** `proxy.ts` (ex-`middleware.ts`, renomeado
no Next 16) só confere se o cookie de sessão existe e redireciona — é checagem otimista. A
verificação real (`requireAdmin()`, em `lib/auth/session.ts`) roda no layout do admin, em
cada página e dentro de cada Server Action, porque Server Actions são alcançáveis por POST
direto, fora da UI.

**Índice único em `photos.full_pathname`.** O registro de uma foto (`registerPhoto`, Server
Action pública — o convidado não faz login) valida formato, mas não autentica quem chama. Sem
o índice, repetir o mesmo POST centenas de vezes gravaria centenas de linhas para a mesma URL,
enchendo o teto global de armazenamento (`PHOTOS_GLOBAL_LIMIT`) sem subir um único byte — e
derrubando o envio de fotos para todos os convidados no meio da festa. A migração está em
`drizzle/0001_daily_firebird.sql`.

## Segurança

**Limite conhecido: sem rate limiting no login.** Em ambiente serverless não existe estado
compartilhado para contá-lo de forma confiável. A mitigação é senha longa gerada
aleatoriamente, comparada em tempo constante (`timingSafeEqual`), com tamanho mínimo exigido
em código — ver a tabela de variáveis abaixo.

**Limite conhecido: o teto de armazenamento conta linhas no banco, não bytes no Blob.** Um
blob que sobe e nunca chega a virar linha (falha entre o upload e o registro) fica órfão:
consome espaço real, mas não é contado por `PHOTOS_GLOBAL_LIMIT` nem aparece em nenhuma tela.
Não há rotina de limpeza automática para esses órfãos.

**Sessão stateless — sem revogação por banco.** A sessão do admin é um JWT assinado (HS256,
via `jose`) guardado num cookie httpOnly; não existe tabela de sessões nem qualquer estado do
lado do servidor para invalidar um token antes da expiração (7 dias). **Se um cookie de
sessão vazar, o único jeito de revogar o acesso é trocar `SESSION_SECRET` e fazer um novo
deploy** — isso invalida de uma vez todo token já emitido, inclusive o do próprio admin, que
precisa entrar de novo. Não existe outro procedimento de emergência.

## Testes

Três arquivos de teste, 15 casos, deliberadamente — o projeto é de escopo pequeno e prazo
curto, e a cobertura se concentra em lógica pura, onde uma falha é silenciosa e cara:

- `lib/auth/token.test.ts` — assinatura e verificação do token de sessão
- `lib/validation/rsvp.test.ts` — validação do schema de RSVP nos limites (nome vazio,
  acompanhantes negativos, coerção de tipo)
- `lib/photos/resize.test.ts` — cálculo de redimensionamento das imagens (proporção
  preservada, tetos de 2048/400px, piso de 1px em proporções extremas)

```bash
npm test
```

## Rodando localmente

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

| Variável | Para quê |
|---|---|
| `DATABASE_URL` | Postgres do Neon |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob |
| `ADMIN_PASSWORD` | Senha do `/admin` — mínimo de 16 caracteres. Gere com `openssl rand -base64 24` |
| `SESSION_SECRET` | Chave HMAC do cookie de sessão — mínimo de 32 caracteres. Gere com `openssl rand -base64 48` |
| `NEXT_PUBLIC_SITE_URL` | Base da OG image e do QR Code. Pode ficar vazia em desenvolvimento; **em produção precisa ser o domínio real, sem barra no final**. Vazia ou apontando para localhost, `/admin/qrcode` mostra um aviso que também sai no papel |
| `PHOTOS_GLOBAL_LIMIT` | Teto de fotos armazenadas (default 1000 ≈ 840MB, com margem sobre o 1GB do plano Hobby) |

Os mínimos de `ADMIN_PASSWORD` e `SESSION_SECRET` existem porque a biblioteca `jose` assina e
verifica HS256 sem reclamar de chave curta — nada nela impede um `SESSION_SECRET` de 3
caracteres, que cai offline em segundos para quem capturar um cookie de sessão e passa a
forjar sessões de admin indefinidamente. Um valor abaixo do mínimo não quebra o build: a tela
de login mostra só "Configuração de acesso indisponível.", e o motivo real fica no log do
servidor.

## Estrutura

```
app/(site)/     convite público — abertura, menu, seções, envio de fotos
app/(admin)/    login e área administrativa (GuestTable e PhotoReviewGrid ficam
                colocados em app/(admin)/admin/, junto das rotas que os usam)
app/api/        route handler que emite o token de upload do Vercel Blob
config/         contrato e instância do evento, fontes
lib/            db (schema, queries), auth, validação de RSVP, helpers de fotos
components/     ui/ (genéricos), invitation/, errors/
hooks/          compressão de imagem, upload de fotos, formulário de RSVP
stores/         music-store.ts (Zustand) — único estado que atravessa rotas
proxy.ts        ex-middleware (renomeado no Next 16) — só o redirect otimista do admin
```
