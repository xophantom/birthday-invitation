# Fase 6 — Acabamento: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar o projeto: card de compartilhamento no WhatsApp, ícones, telas de erro temáticas, QR Code para impressão, revisão de acessibilidade, README de portfólio e deploy.

**Architecture:** OG image e favicon gerados por código com `ImageResponse`, evitando assets manuais que saem de sincronia com a config. Telas de erro reaproveitam a moldura do convite. O QR Code é gerado no servidor a partir de `NEXT_PUBLIC_SITE_URL`.

**Tech Stack:** `next/og` (ImageResponse), qrcode 1.5.

## Global Constraints

Valem para **todas** as tarefas:

- **Sem TDD.** Nenhum teste novo nesta fase — os três do projeto já existem. Verificação por `npm test`, `npm run build` e inspeção.
- **`ImageResponse` só suporta flexbox** e um subconjunto de CSS. `display: grid` não funciona, e todo elemento com mais de um filho precisa de `display: flex` explícito.
- **Nenhum componente importa `config/event.config.ts` diretamente.** Sempre `getEventConfig()`.
- **Nenhuma cor literal em componente.** Exceção justificada: `ImageResponse` não enxerga classes do Tailwind, então as cores vêm da config em estilo inline.
- **Toda página e Server Action do admin chama `requireAdmin()`.**
- **Todo texto de interface em pt-BR**, com acentuação correta.
- **Alias de import:** `@/*` → raiz do projeto.
- **Commits em pt-BR**, formato `tipo: descrição`.

## Contexto herdado

```ts
getEventConfig(): EventConfig                  // lib/config.ts
formatEventDate(iso, timeZone)                 // lib/date.ts
requireAdmin(): Promise<void>                  // lib/auth/session.ts
<SectionShell />, <Ornament />, <Button />     // components/
```

---

## Estrutura de arquivos desta fase

| Arquivo | Responsabilidade |
|---|---|
| `app/opengraph-image.tsx` | Card 1200×630 do WhatsApp |
| `app/icon.tsx` | Favicon gerado do monograma |
| `app/apple-icon.tsx` | Ícone de app iOS |
| `app/(site)/error.tsx` | Erro dentro da moldura do convite |
| `app/(site)/not-found.tsx` | 404 temático |
| `app/global-error.tsx` | Rede de segurança do layout raiz |
| `app/(admin)/admin/qrcode/page.tsx` | QR Code para impressão |
| `assets/fonts/CormorantGaramond-Bold.ttf` | Fonte para a OG image |
| `README.md` | Documentação de portfólio |

---

### Task 1: Telas de erro e 404

**Files:**
- Create: `app/(site)/error.tsx`
- Create: `app/(site)/not-found.tsx`
- Create: `app/global-error.tsx`

**Interfaces:**
- Consumes: `Ornament`, `Button`
- Produces: nada consumido por outras tarefas

- [ ] **Step 1: Erro dentro do convite**

Erro precisa parecer parte do convite, não tela de framework. `error.tsx` é sempre Client Component.

```tsx
// app/(site)/error.tsx
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Ornament } from '@/components/ui/Ornament'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Erro na área do convite:', error)
  }, [error])

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <Ornament placement="top" />
      <h1 className="font-display text-3xl text-ouro-claro">
        Algo não saiu como esperado
      </h1>
      <p className="max-w-prose text-creme/80">
        Tente novamente em instantes. Se continuar assim, avise a família.
      </p>
      <Button onClick={reset}>Tentar de novo</Button>
    </main>
  )
}
```

- [ ] **Step 2: 404 temático**

```tsx
// app/(site)/not-found.tsx
import Link from 'next/link'
import { Ornament } from '@/components/ui/Ornament'

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <Ornament placement="top" />
      <h1 className="font-display text-3xl text-ouro-claro">Página não encontrada</h1>
      <p className="max-w-prose text-creme/80">
        Esta parte do convite não existe.
      </p>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center rounded-full border border-ouro/50 px-6 text-sm text-ouro-claro transition-colors hover:bg-ouro/10"
      >
        Voltar ao convite
      </Link>
    </main>
  )
}
```

- [ ] **Step 3: Rede de segurança global**

Este arquivo cobre falhas no próprio layout raiz, quando nem o tema carregou. Por isso ele traz `<html>` e `<body>` próprios e cores literais — é a única situação em que os tokens podem não existir.

```tsx
// app/global-error.tsx
'use client'

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          backgroundColor: '#071A11',
          color: '#F3EAD3',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: '1.5rem',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', color: '#E8C766' }}>
          Não conseguimos carregar o convite
        </h1>
        <button
          type="button"
          onClick={reset}
          style={{
            minHeight: 44,
            padding: '0 1.5rem',
            borderRadius: 999,
            backgroundColor: '#C9A227',
            color: '#071A11',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Tentar de novo
        </button>
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Verificar**

Run: `npm run dev`, acesse `http://localhost:3000/rota-que-nao-existe`
Expected: 404 com moldura dourada e botão de voltar, não a tela padrão do Next.

- [ ] **Step 5: Commit**

```bash
git add "app/(site)/error.tsx" "app/(site)/not-found.tsx" app/global-error.tsx
git commit -m "feat: adiciona telas de erro e 404 tematicas"
```

---

### Task 2: OG image e ícones

**Files:**
- Create: `assets/fonts/CormorantGaramond-Bold.ttf`
- Create: `app/opengraph-image.tsx`
- Create: `app/icon.tsx`
- Create: `app/apple-icon.tsx`
- Delete: `app/favicon.ico`

**Interfaces:**
- Consumes: `getEventConfig`, `formatEventDate`
- Produces: card de compartilhamento e ícones

- [ ] **Step 1: Baixar a fonte para a OG image**

`ImageResponse` não enxerga `next/font` — a fonte precisa ser lida como arquivo.

```bash
mkdir -p assets/fonts
curl -L -o assets/fonts/CormorantGaramond-Bold.ttf "https://github.com/google/fonts/raw/main/ofl/cormorantgaramond/CormorantGaramond%5Bwght%5D.ttf"
```

Se a URL falhar, baixe manualmente em [fonts.google.com/specimen/Cormorant+Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) e salve o arquivo com esse nome.

- [ ] **Step 2: Escrever a OG image**

A arte é retrato (693×895) e o card é paisagem (1200×630), então a composição divide a tela: recorte vertical da arte à esquerda, informações à direita. Esticar a arte para preencher deformaria a Tiana.

A imagem é embutida como data URI porque `ImageResponse` roda isolado e não resolve caminhos relativos de `public/`.

```tsx
// app/opengraph-image.tsx
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { getEventConfig } from '@/lib/config'
import { formatEventDate } from '@/lib/date'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Convite de 15 anos'

export default async function Image() {
  const config = getEventConfig()
  const date = formatEventDate(config.event.startsAt, config.event.timeZone)
  const { colors } = config.theme

  const [poster, font] = await Promise.all([
    readFile(join(process.cwd(), 'public', 'poster.jpeg')),
    readFile(join(process.cwd(), 'assets', 'fonts', 'CormorantGaramond-Bold.ttf')),
  ])

  const posterSrc = `data:image/jpeg;base64,${poster.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundColor: colors.esmeraldaFundo,
        }}
      >
        <img
          src={posterSrc}
          alt=""
          width={430}
          height={630}
          style={{ width: 430, height: 630, objectFit: 'cover' }}
        />

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 18,
            padding: '0 64px',
          }}
        >
          <div style={{ display: 'flex', fontSize: 84, color: colors.ouro }}>
            {config.celebrant.monogram}
          </div>
          <div style={{ display: 'flex', fontSize: 62, color: colors.ouroClaro }}>
            {config.celebrant.name}
          </div>
          <div style={{ display: 'flex', fontSize: 40, color: colors.creme }}>
            {config.celebrant.age} anos
          </div>
          <div
            style={{
              display: 'flex',
              width: 180,
              height: 2,
              backgroundColor: colors.ouro,
              margin: '10px 0',
            }}
          />
          <div style={{ display: 'flex', fontSize: 30, color: colors.creme }}>
            {date.weekday}, {date.day} de {date.month} de {date.year} · {date.time}
          </div>
          <div style={{ display: 'flex', fontSize: 26, color: colors.jade }}>
            {config.venue.name}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Cormorant', data: font, style: 'normal', weight: 700 }],
    }
  )
}
```

Todo `<div>` com filhos leva `display: flex` explícito — `ImageResponse` falha sem isso.

- [ ] **Step 3: Escrever o favicon**

Gerado por código a partir do monograma: um `.ico` manual sairia de sincronia se o evento mudasse.

```tsx
// app/icon.tsx
import { ImageResponse } from 'next/og'
import { getEventConfig } from '@/lib/config'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

export default function Icon() {
  const { celebrant, theme } = getEventConfig()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.esmeralda,
          color: theme.colors.ouroClaro,
          fontSize: 32,
          fontWeight: 700,
          letterSpacing: -1,
        }}
      >
        {celebrant.monogram}
      </div>
    ),
    size
  )
}
```

- [ ] **Step 4: Escrever o ícone de app**

```tsx
// app/apple-icon.tsx
import { ImageResponse } from 'next/og'
import { getEventConfig } from '@/lib/config'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  const { celebrant, theme } = getEventConfig()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.esmeralda,
          color: theme.colors.ouroClaro,
          fontSize: 88,
          fontWeight: 700,
        }}
      >
        {celebrant.monogram}
      </div>
    ),
    size
  )
}
```

- [ ] **Step 5: Remover o favicon do scaffold**

Ele tem precedência sobre `icon.tsx` e mostraria o logo do Next.

```bash
git rm app/favicon.ico
```

- [ ] **Step 6: Completar os metadados de compartilhamento**

Em `app/layout.tsx`, substitua o objeto `metadata` por:

```tsx
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: `${config.celebrant.name} — ${config.celebrant.age} anos`,
  description: `Convite para os ${config.celebrant.age} anos de ${config.celebrant.name}. ${config.venue.name}.`,
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    title: `${config.celebrant.name} — ${config.celebrant.age} anos`,
    description: `Você está convidado! ${config.venue.name}.`,
  },
}
```

`metadataBase` é o que faz a OG image ser referenciada por URL absoluta — sem ele, o WhatsApp não carrega a prévia.

- [ ] **Step 7: Verificar**

Run: `npm run dev`, abra `http://localhost:3000/opengraph-image`

Expected: PNG 1200×630 com a arte à esquerda e monograma, nome, idade, data e local à direita, em serif dourada. Abra também `/icon` e confirme o monograma.

Se a geração falhar com erro de layout, procure um `<div>` com múltiplos filhos sem `display: flex`.

- [ ] **Step 8: Commit**

```bash
git add app/opengraph-image.tsx app/icon.tsx app/apple-icon.tsx app/layout.tsx assets/
git commit -m "feat: adiciona og image e icones gerados a partir da config"
```

---

### Task 3: QR Code para impressão

**Files:**
- Create: `app/(admin)/admin/qrcode/page.tsx`
- Modify: `app/(admin)/admin/layout.tsx`
- Modify: `package.json`

**Interfaces:**
- Consumes: `requireAdmin`, `getEventConfig`, `qrcode`
- Produces: a rota `/admin/qrcode`

- [ ] **Step 1: Instalar a biblioteca**

```bash
npm install qrcode@^1.5.4
npm install -D @types/qrcode@^1.5.6
```

- [ ] **Step 2: Escrever a página**

Gerada no servidor como data URL e desenhada dentro da moldura do convite — a folha vai para as mesas da festa, então precisa parecer parte da decoração.

`print:` são utilitários do Tailwind para o estilo de impressão: fundo branco e QR preto economizam tinta e aumentam a leitura pela câmera.

```tsx
// app/(admin)/admin/qrcode/page.tsx
import type { Metadata } from 'next'
import QRCode from 'qrcode'
import { requireAdmin } from '@/lib/auth/session'
import { getEventConfig } from '@/lib/config'

export const metadata: Metadata = {
  title: 'QR Code',
  robots: { index: false, follow: false },
}

export default async function Page() {
  await requireAdmin()

  const config = getEventConfig()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const target = `${baseUrl}/fotos`

  const dataUrl = await QRCode.toDataURL(target, {
    width: 720,
    margin: 1,
    color: { dark: '#071A11', light: '#FFFFFF' },
  })

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex w-full items-center justify-between print:hidden">
        <h1 className="font-display text-3xl text-ouro-claro">QR Code das fotos</h1>
        <p className="text-sm text-creme/60">Aponta para {target}</p>
      </div>

      <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-3xl border-2 border-ouro/50 bg-esmeralda p-8 text-center print:border-black print:bg-white">
        <p className="font-display text-3xl text-ouro-claro print:text-black">
          Tirou uma foto bonita?
        </p>
        <p className="text-sm text-creme/80 print:text-black">
          Aponte a câmera e compartilhe com a família de{' '}
          {config.celebrant.name.split(' ')[0]}.
        </p>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dataUrl}
          alt={`QR Code para ${target}`}
          width={280}
          height={280}
          className="rounded-xl bg-white p-3"
        />

        <p className="text-xs text-creme/60 print:text-black">
          As fotos ficam privadas, só a família vê.
        </p>
      </div>

      <p className="text-sm text-creme/60 print:hidden">
        Use Ctrl+P (ou Cmd+P) para imprimir.
      </p>
    </div>
  )
}
```

A impressão fica a cargo do próprio navegador: um botão chamando `window.print()` obrigaria a página inteira a virar Client Component para economizar dois toques.

- [ ] **Step 3: Adicionar o link na navegação do admin**

Em `app/(admin)/admin/layout.tsx`, dentro do `<nav>`, após o link de Fotos:

```tsx
<Link href="/admin/qrcode" className="text-ouro-claro hover:underline">
  QR Code
</Link>
```

- [ ] **Step 4: Verificar**

Run: `npm run dev`, acesse `/admin/qrcode`

Expected: cartão emoldurado com o QR. Escaneie com o celular e confirme que abre `/fotos`. Use a pré-visualização de impressão (Cmd+P) e confirme fundo branco com texto preto.

- [ ] **Step 5: Commit**

```bash
git add "app/(admin)/admin/qrcode" "app/(admin)/admin/layout.tsx" package.json package-lock.json
git commit -m "feat: adiciona pagina de qr code para impressao"
```

---

### Task 4: Revisão de acessibilidade

**Files:**
- Modify: conforme os achados

**Interfaces:**
- Consumes: tudo construído até aqui
- Produces: correções pontuais

- [ ] **Step 1: Percorrer o checklist**

Rode `npm run dev` e verifique cada item, corrigindo o que falhar:

| Verificação | Como testar | Esperado |
|---|---|---|
| Navegação por teclado | `Tab` da raiz até o fim do menu | Contorno dourado visível em todo elemento focável |
| Ordem de foco | `Tab` em `/confirmar` | Segue a ordem visual dos campos |
| Modal | Abrir foto no admin, `Tab` e `Esc` | Foco preso no modal; `Esc` fecha |
| Rótulos | Inspecionar os inputs | Todo input tem `<label>` com `htmlFor` correspondente |
| Erros anunciados | Enviar RSVP vazio | Mensagem com `role="alert"` |
| Movimento reduzido | Ativar no sistema, recarregar `/` | Sem zoom, sem pulsação, tudo utilizável |
| Contraste do corpo | Texto creme sobre esmeralda | Confortável; se algum texto pequeno estiver em dourado, troque para creme |
| Alvos de toque | Botões no celular | Mínimo 44px de altura |
| Idioma | Ver o `<html>` | `lang="pt-BR"` |
| Imagens | Inspecionar `alt` | Decorativas com `alt=""` + `aria-hidden`; informativas com texto real |
| Zoom | Ampliar para 200% no celular | Sem rolagem horizontal |

- [ ] **Step 2: Corrigir o que falhar**

Padrões de correção para os problemas mais prováveis:

- Texto pequeno em dourado sobre esmeralda: trocar `text-ouro` por `text-creme`. O dourado passa em contraste apenas em tamanho de display.
- Ícone decorativo sem `aria-hidden`: adicionar o atributo, para o leitor de tela não ler "✦".
- Botão com menos de 44px: aplicar `min-h-11`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "fix: ajustes de acessibilidade apos revisao manual"
```

---

### Task 5: README e deploy

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: tudo
- Produces: projeto publicado

- [ ] **Step 1: Escrever o README**

Este arquivo é o que um avaliador de portfólio lê primeiro. O que diferencia não é a lista de tecnologias — é explicar **por que** cada decisão foi tomada.

````markdown
# Convite Digital — 15 Anos

Convite digital para festa de 15 anos, com confirmação de presença, coleta de
fotos dos convidados via QR Code e área administrativa. Tema visual Princesa Tiana.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
Neon/Postgres com Drizzle · Vercel Blob

## Whitelabel

Todo conteúdo específico do evento vive em `config/event.config.ts`, validado
por zod contra o contrato em `config/event.schema.ts`. Nenhum componente importa
esse arquivo diretamente — todos passam por `getEventConfig()`.

Adaptar para outra festa: editar a config, trocar a arte em `public/` e
redeployar. As cores viram CSS custom properties aplicadas no layout raiz, e o
Tailwind as expõe como utilitários via `@theme inline` — não há hex literal em
componente algum.

## Decisões de arquitetura

**Upload direto ao Blob, sem passar pelo servidor.** Server Actions têm limite
de corpo (~4,5MB) e o convidado envia várias fotos de uma vez. O route handler
apenas emite token assinado e aplica o teto global de armazenamento.

**Registro por Server Action em vez do callback `onUploadCompleted`.** O
callback do Blob não dispara em localhost sem túnel, o que inviabilizaria o
desenvolvimento, e chega por arquivo — quebrando o pareamento full+thumbnail.

**Compressão em duas versões no navegador.** Full em 2048px e thumbnail em
400px, geradas em Web Worker. O grid de revisão carrega thumbnails; a versão
full só é buscada ao ampliar.

**`<img>` para as fotos do Blob, `next/image` para os assets do convite.** As
miniaturas já saem prontas em ~40KB; reprocessá-las gastaria transformações
pagas sem ganho algum.

**Zip montado no navegador.** Empacotar centenas de fotos numa função
serverless estoura o tempo limite; no navegador não há esse teto e os bytes vão
direto do Blob ao disco.

**Um booleano de favorita no lugar de `pending/approved/rejected`.** Não existe
mural público, então três estados não controlariam a visibilidade de nada — só
adicionariam UI de moderação para um problema inexistente.

**Autorização na camada de dados, não no proxy.** O `proxy.ts` (ex-middleware,
renomeado no Next 16) faz apenas redirect otimista. A verificação real roda em
`requireAdmin()`, chamada pelo layout, por cada página e dentro de cada Server
Action — que são alcançáveis por POST direto, fora da UI.

**Limite conhecido:** não há rate limiting no login. Em ambiente serverless não
existe estado compartilhado para contá-lo de forma confiável; a mitigação é
senha longa aleatória com comparação em tempo constante.

## Testes

Três testes, deliberadamente. O projeto é de escopo pequeno e prazo curto, e a
cobertura se concentra onde uma falha é silenciosa e cara: assinatura da sessão,
validação do RSVP nos limites e cálculo de redimensionamento das imagens.

```bash
npm test
```

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha as variáveis
npm run db:migrate
npm run dev
```

| Variável | Para quê |
|---|---|
| `DATABASE_URL` | Postgres do Neon |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob |
| `ADMIN_PASSWORD` | Senha do `/admin` — gere com `openssl rand -base64 24` |
| `SESSION_SECRET` | Chave do JWT de sessão — gere com `openssl rand -base64 32` |
| `NEXT_PUBLIC_SITE_URL` | Base da OG image e do QR Code |
| `PHOTOS_GLOBAL_LIMIT` | Teto de fotos (1000 ≈ 840MB, com margem sobre o 1GB do plano Hobby) |

## Estrutura

```
app/(site)      convite público — abertura, menu, seções, envio de fotos
app/(admin)     login e área administrativa
config/         contrato e instância do evento, fontes
lib/            db (schema, queries), auth, validação, helpers
components/     ui/ (genéricos), invitation/, admin/
hooks/          compressão, upload, formulário de RSVP
```
````

- [ ] **Step 2: Rodar a verificação completa**

```bash
npm test
npm run lint
npm run build
```

Expected: 14 testes passando, lint limpo, build sem erros.

- [ ] **Step 3: Publicar na Vercel**

```bash
npx vercel
```

No painel do projeto, em Settings → Environment Variables, cadastre todas as
variáveis do `.env.local` para Production. Aponte `NEXT_PUBLIC_SITE_URL` para o
domínio real — sem isso, a OG image e o QR Code apontam para localhost.

```bash
npx vercel --prod
```

- [ ] **Step 4: Verificar em produção**

| Verificação | Como |
|---|---|
| Convite abre | Acesse o domínio no celular |
| Card do WhatsApp | Cole o link numa conversa e confira a prévia |
| RSVP grava | Envie uma confirmação de teste e veja no `/admin` |
| Upload funciona | Envie uma foto por `/fotos` e confirme no `/admin/fotos` |
| Admin protegido | Abra `/admin` em aba anônima — deve ir para `/login` |
| QR Code | Escaneie o de `/admin/qrcode` com outro aparelho |

Se a prévia do WhatsApp não aparecer, confirme `metadataBase` e o valor de
`NEXT_PUBLIC_SITE_URL` — o WhatsApp mantém cache agressivo, então teste com um
parâmetro novo na URL (`?v=2`).

Apague a confirmação de teste pelo `/admin` depois.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: adiciona readme com decisoes de arquitetura"
```

---

## Definição de pronto

O projeto está completo quando:

- O link colado no WhatsApp mostra o card com a arte, o nome e a data
- Favicon e ícone de app mostram o monograma, não o logo do Next
- Erros e 404 aparecem dentro da moldura do convite
- O QR Code impresso leva ao envio de fotos
- O checklist de acessibilidade passa inteiro
- O README explica as decisões, não só as tecnologias
- Tudo funciona no domínio de produção

## Pendências que dependem de terceiros

Estas ficam abertas até os arquivos chegarem, e nenhuma exige código novo:

- **Trilha sonora:** salvar o mp3 em `public/` e apontar `media.soundtrack` na config
- **Vídeo de abertura:** salvar o mp4 em `public/` e apontar `media.openingVideo`
- **Presentes:** preencher `gifts.clothingSize`, `gifts.shoeSize` e `gifts.pixKey`

Cada uma é uma linha na config. A interface se adapta sozinha — é o que os slots
plugáveis da Fase 2 e as verificações de `null` da Fase 2 garantem.
</content>
