# Convite Digital — Alice 15 Anos

**Data do design:** 05/08/2026
**Evento:** sexta-feira, 11/12/2026, 19h — Espaço Jardim das Acácias, Porto Alegre/RS
**Stack:** Next.js 16.3 (App Router), React 19.2, Tailwind v4, Neon/Postgres via Drizzle, Vercel Blob

## Objetivo

Convite digital para os 15 anos da Alice Fernandes, tema Princesa Tiana, com quatro funções: apresentar o evento, receber confirmações de presença, coletar fotos dos convidados via QR Code durante a festa, e dar ao anfitrião uma área administrativa para gerenciar ambos.

O projeto também é peça de portfólio e deve ser adaptável a outros eventos (whitelabel por configuração). Isso eleva o padrão de código esperado, mas não autoriza abstração especulativa: a régua é fronteira nítida, não quantidade de camadas.

## Decisões tomadas

| Tema | Decisão | Por quê |
|---|---|---|
| Abertura | Animação própria a partir da arte, com slots plugáveis para vídeo e áudio | Vídeo e trilha ainda não existem; os slots evitam retrabalho quando chegarem |
| Navegação | Rota própria por seção, com transição | URL compartilhável, telas leves, alinhado ao `prompt.md` |
| Moderação de fotos | Booleano `is_favorite` no lugar de `pending/approved/rejected` | Não existe mural público; três estados custariam UI de moderação sem resolver problema real |
| Auth admin | Senha única em variável de ambiente + cookie de sessão assinado | Um único operador; tabela de usuários seria superfície sem contrapartida |
| Upload | Nome do convidado opcional | Atrito no meio da festa derruba envios |
| Dados | Drizzle + drizzle-kit | Tipagem inferida e migrações versionadas, coerente com o objetivo de portfólio |
| Whitelabel | `EventConfig` tipada em arquivo + tema em tokens CSS | Dá a fronteira quase toda com fração do custo de um CMS |

### Decisões conscientemente descartadas

- **CMS no banco para conteúdo estático** — o site passaria a depender do banco para renderizar texto que nunca muda.
- **Multi-evento por slug/subdomínio** — vira produto, não convite.
- **Presets de tema extras** — só o tema Tiana tem arte real; paletas não usadas seriam enfeite.
- **Bloqueio de RSVP duplicado por nome** — homônimos são plausíveis; o pior erro seria o convidado real não conseguir confirmar. O admin vê repetidos destacados e decide.

## Arquitetura

### A fronteira de configuração

Tudo específico do evento vive em um lugar, validado por zod:

```
config/
  event.schema.ts    # contrato: EventConfig + validação
  event.config.ts    # instância (Alice Fernandes)
lib/config.ts        # getEventConfig() — único ponto de leitura
```

`EventConfig` cobre: celebrante (nome, monograma, idade), data (ISO + formatação pt-BR), local (nome, endereço, query do mapa, observações), manual do convidado, presentes (tamanhos, preferências, Pix), dress code (cores a evitar + motivo), tema (cores, fontes, assets) e slots opcionais (`openingVideo`, `soundtrack`).

**Regra:** nenhum componente importa `event.config.ts` diretamente — todos recebem via props de Server Component ou chamam `getEventConfig()`. É o que torna o whitelabel real e permite trocar a fonte por banco no futuro mexendo em uma função.

### Tema em tokens

```css
@theme inline {
  --color-esmeralda: var(--brand-esmeralda);
  --color-ouro: var(--brand-ouro);
  --color-jade: var(--brand-jade);
}
```

As `--brand-*` são definidas em `:root` e sobrescritas inline pelo `RootLayout` a partir da config. Utilitários permanecem estáticos; só os valores trocam.

Tipografia é a exceção: `next/font` exige import estático, então as fontes ficam em `config/fonts.ts`. Escolha: **Cormorant Garamond** (display), **Jost** (corpo e formulários), script discreta para o monograma.

### Rotas

```
app/
  (site)/                    # layout com player de música + moldura ornamental
    layout.tsx
    page.tsx                 # abertura → pôster → menu
    manual/ presentes/ dress-code/ confirmar/ local/
    fotos/page.tsx           # destino do QR Code
  (admin)/                   # layout sóbrio, sem música
    login/page.tsx
    admin/
      layout.tsx             # requireAdmin()
      page.tsx               # convidados
      fotos/page.tsx
      qrcode/page.tsx
  api/photos/upload/route.ts # emite token do Blob
  opengraph-image.tsx
proxy.ts                     # ex-middleware: redirect otimista
```

Dois grupos de rotas porque os layouts são genuinamente diferentes: o site tem áudio persistente e moldura dourada, o admin não. `login` fica fora de `admin/` para não cair no layout protegido.

### Camadas

```
lib/db/          schema.ts (Drizzle) + queries/ (data access layer)
lib/auth/        session.ts — sign/verify HMAC, requireAdmin()
lib/blob.ts      helpers do Vercel Blob
components/ui/          Button, Card, Modal, FormField, Ornament (sem regra de negócio)
components/invitation/  OpeningSequence, PosterHero, MenuGrid, SectionShell
components/photos/      PhotoUploader, PhotoGrid, Lightbox
components/admin/       GuestTable, PhotoReviewGrid
hooks/           use-image-compression, use-photo-upload, use-rsvp-form
stores/          music-store.ts (Zustand)
```

Zustand cobre apenas o player, único estado que atravessa rotas. Progresso de upload vive inteiro dentro de `/fotos` e não vai para store global.

`SectionShell` centraliza moldura, título ornamentado e botão de voltar — cada uma das cinco seções do menu vira essencialmente conteúdo.

## Particularidades do Next.js 16

Verificadas em `node_modules/next/dist/docs/`, divergem do que os documentos originais assumiam:

1. **`middleware.ts` virou `proxy.ts`** (raiz). O doc é explícito: proxy não é solução de autorização, apenas checagem otimista.
2. **Server Actions são alcançáveis por POST direto**, fora da UI — toda action que muta dados valida auth internamente.
3. **`refresh()` de `next/cache`** complementa `revalidatePath`.
4. **`ImageResponse`** suporta apenas flexbox e um subconjunto de CSS — sem grid.

## Modelo de dados

```ts
// lib/db/schema.ts
export const rsvpSource = pgEnum('rsvp_source', ['guest', 'admin'])
export const rsvpStatus = pgEnum('rsvp_status', ['confirmed', 'removed'])

export const rsvps = pgTable('rsvps', {
  id: uuid().primaryKey().defaultRandom(),
  fullName: text('full_name').notNull(),
  phone: text(),
  companionsCount: integer('companions_count').notNull().default(0),
  message: text(),
  source: rsvpSource().notNull().default('guest'),
  status: rsvpStatus().notNull().default('confirmed'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('idx_rsvps_status').on(t.status)])

export const photos = pgTable('photos', {
  id: uuid().primaryKey().defaultRandom(),
  fullUrl: text('full_url').notNull(),
  thumbUrl: text('thumb_url').notNull(),
  fullPathname: text('full_pathname').notNull(),
  thumbPathname: text('thumb_pathname').notNull(),
  uploadedBy: text('uploaded_by'),
  isFavorite: boolean('is_favorite').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('idx_photos_created_at').on(t.createdAt)])
```

Diferenças em relação ao `tmp/mapeamento-banco-neon.md`: `is_favorite` no lugar dos três status, e os `pathname` guardados além das URLs — sem eles não há como apagar um blob depois.

Migrações via `drizzle-kit generate` + `migrate`, versionadas no repo.

## Fluxos

### RSVP

O mesmo schema zod serve os dois lados: `react-hook-form` valida no client para feedback imediato, a Server Action revalida no servidor.

```
useRsvpForm → createRsvp(data) → zod.parse → insert → revalidatePath('/admin') → agradecimento
```

Remoção pelo admin é soft delete (`status: 'removed'`), preservando histórico. O total exibido é confirmados + acompanhantes.

### Upload de fotos

```
1. seleção      input multiple, accept="image/*"
2. validação    mime real + ≤15MB + máx 10 por envio
3. conversão    HEIC/HEIF → JPEG (heic2any, carregado sob demanda)
4. compressão   Web Worker: full 2048px q0.83 · thumb 400px q0.70
5. upload       @vercel/blob/client → browser direto ao Blob, token de /api/photos/upload
6. registro     Server Action registerPhoto() grava o par no banco
```

**Por que o upload não passa por Server Action:** o body tem limite de ~4.5MB e o convidado envia várias fotos de uma vez. O route handler apenas emite token assinado, e é onde o teto global de storage é aplicado — passando do limite configurado, recusa antes de queimar quota.

**Por que registro por action em vez de `onUploadCompleted`:** o callback do Blob não dispara em localhost sem túnel (inviabiliza desenvolvimento) e chega por arquivo, o que quebraria o pareamento full+thumb. `registerPhoto` valida que as URLs pertencem ao store do Blob e ao prefixo `photos/`.

Progresso de compressão e de upload são exibidos separadamente — comprimir 8 fotos leva segundos e sem sinalização parece travado.

### Admin

- **Convidados:** tabela com nome, telefone, acompanhantes, recado e origem (`guest`/`admin` com selo). Adição manual e remoção. Nomes repetidos destacados.
- **Fotos:** grid de thumbnails paginado por cursor em `created_at`, favoritar com um toque, lightbox para a versão full.
- **QR Code:** página que renderiza o QR de `/fotos` com moldura temática, pronta para impressão.

**Fotos do Blob são servidas com `<img>`, não `next/image`** — já saem do client no tamanho certo (thumb ~40KB), e reprocessá-las gastaria transformações pagas sem ganho. `next/image` fica para os assets estáticos do convite.

**Download em zip:** montado no browser com `client-zip`, em lotes, com botões separados para todas e só favoritas. Empacotar centenas de fotos numa função serverless estouraria o timeout; no browser os bytes vão direto do Blob ao disco. Fallback de download individual.

## Segurança

Cookie de sessão httpOnly, assinado com HMAC via Web Crypto, `SameSite=Lax` + `Secure` + expiração. `requireAdmin()` roda no layout do admin, em cada página e dentro de cada Server Action; `proxy.ts` faz apenas o redirect otimista.

**Limite conhecido:** sem estado compartilhado não há rate limiting confiável no login em ambiente serverless. Mitigação: senha longa gerada aleatoriamente e comparação em tempo constante. Proteção real exigiria Upstash Redis — fora de escopo, registrado como trade-off consciente.

## Erros

`error.tsx` por segmento com a moldura do convite (erro não pode parecer tela do Next), `not-found.tsx` temático, retry por foto no upload (se 7 de 8 subiram, só a que falhou repete), mensagem específica para estouro de quota, e log de erros de upload para acompanhar consumo durante o evento.

## Experiência visual

### Abertura

```
1. Véu          esmeralda sólido, partículas douradas surgindo
2. Revelação    arte em fade + zoom lento, ornamentos desenhando-se
3. Convite      monograma pulsa, data emerge, botão "Abrir convite"
```

O botão destrava o áudio: navegadores bloqueiam autoplay com som, então o gesto que a plataforma exige vira o gesto que a narrativa pede. A sequência roda uma vez por sessão (`sessionStorage`), com "pular" visível desde o início.

### Pôster

A arte (`poster.jpeg`, 693×895, retrato) não vira background esticado:

- **Mobile:** tela cheia, `object-cover` com foco no brasão.
- **Desktop:** cartão centralizado em proporção de convite, entorno em esmeralda + textura + vinheta gerados em CSS.

Sobre a arte vão apenas dia da semana, data e horário, nas faixas escuras laterais — nunca sobre o vestido claro. O nome não se repete: a arte já traz "alice fernandes".

### Movimento e acessibilidade

Partículas em CSS puro, transições de rota com Framer Motion, stagger na entrada do menu — tudo respeitando `prefers-reduced-motion` (fades curtos, sem zoom, sem partículas). Animação de tela cheia dispara enjoo em quem tem sensibilidade vestibular.

Dourado sobre esmeralda passa em contraste apenas em tamanho de display; corpo de texto usa creme claro. Foco visível na navegação por teclado, labels reais nos formulários, lightbox com trap de foco e `Esc`, alvos de toque de 44px.

### OG image

`app/opengraph-image.tsx` com `ImageResponse` 1200×630. Como o OG é landscape e a arte é retrato: recorte vertical da arte à esquerda (brasão + tiara), bloco em esmeralda à direita com monograma, "Alice 15 anos", data por extenso e local. Apenas flexbox. Favicon e ícone de app derivam do mesmo monograma.

## Testes

Sem TDD e sem suíte ampla, conforme `tmp/prompt.md`. Três testes pontuais com Vitest, em lógica pura onde a falha é silenciosa e cara:

- assinatura e verificação do cookie de sessão
- validação do schema de RSVP nos limites (nome vazio, acompanhantes negativos)
- cálculo de redimensionamento da compressão (proporção preservada, tetos de 2048/400)

## Fases de entrega

| # | Fase | Entrega |
|---|---|---|
| 1 | Fundação | Config + zod, tema em tokens, fontes, layouts, componentes UI base |
| 2 | Convite | Abertura, pôster, menu, cinco seções estáticas |
| 3 | RSVP | Drizzle + Neon, migração, formulário, Server Action |
| 4 | Fotos | Compressão, upload direto ao Blob, registro, limites |
| 5 | Admin | Login, convidados, grid de fotos, favoritas, zip |
| 6 | Acabamento | OG image, favicon, QR Code, acessibilidade, README, deploy |

Cada fase fecha funcionando de ponta a ponta. A partir da fase 3 já é possível receber confirmações reais, o que importa porque os convites circulam antes de dezembro.

Tarefa avulsa incluída na fase 1: mover `poster.jpeg` da raiz do repositório para `public/`.

## Variáveis de ambiente

```
DATABASE_URL              # Neon
BLOB_READ_WRITE_TOKEN     # Vercel Blob
ADMIN_PASSWORD            # senha única do admin
SESSION_SECRET            # chave HMAC do cookie
NEXT_PUBLIC_SITE_URL      # base para OG image e QR Code
PHOTOS_GLOBAL_LIMIT       # teto de fotos antes de recusar novos uploads (default: 1000)
```

O default de 1000 vem do orçamento de storage: ~840KB por foto (full ~800KB + thumb ~40KB) contra o 1GB do plano Hobby dá ~1200 fotos no limite absoluto. Mil deixa margem para o admin não descobrir o teto no meio da festa.

`SESSION_SECRET` e `ADMIN_PASSWORD` são gerados aleatoriamente durante a fase 5 e entregues ao anfitrião — nunca escolhidos à mão, já que a ausência de rate limiting no login torna a entropia da senha a única defesa.

## Conteúdo pendente

Estes valores entram em `config/event.config.ts` e não bloqueiam nenhuma fase — o código lê da config, e a config nasce com valores marcados como provisórios:

- Presentes: tamanho de roupa, numeração de calçado, chave Pix

Já definidos: data (sexta-feira, 11/12/2026, 19h), local (Espaço Jardim das Acácias, com estacionamento próprio) e dress code (evitar tons de verde, cor reservada à debutante).

## Referências

- `tmp/readme.md` — escopo funcional
- `tmp/prompt.md` — diretrizes técnicas
- `tmp/prompt-estrategia-fotos.md` — estratégia de compressão e armazenamento
- `tmp/mapeamento-banco-neon.md` — mapeamento original do banco
</content>
</invoke>
