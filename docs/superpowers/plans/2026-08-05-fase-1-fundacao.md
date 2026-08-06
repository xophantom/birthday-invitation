# Fase 1 — Fundação: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Estabelecer a base whitelabel do convite — configuração tipada do evento, tema em tokens, tipografia e componentes de UI reutilizáveis — de modo que todas as fases seguintes só consumam essas peças.

**Architecture:** Todo dado específico do evento vive em `config/event.config.ts`, validado por zod e lido exclusivamente por `getEventConfig()`. As cores viram CSS custom properties aplicadas no `<html>` a partir dessa config, e o Tailwind v4 as expõe como utilitários via `@theme inline`. Componentes de UI são burros e sem regra de negócio.

**Tech Stack:** Next.js 16.3.0 (App Router), React 19.2, TypeScript 5, Tailwind CSS v4, zod 4.

## Global Constraints

Valem para **todas** as tarefas deste plano e dos planos seguintes:

- **Sem TDD.** O `tmp/prompt.md` determina que não se escreve teste antes da implementação e que não há cobertura ampla. Apenas três testes pontuais existirão no projeto inteiro (sessão, schema de RSVP, cálculo de redimensionamento), e nenhum deles está nesta fase. A verificação aqui é `tsc --noEmit`, `npm run lint`, `npm run build` e inspeção visual.
- **Nenhum componente importa `config/event.config.ts` diretamente.** Sempre `getEventConfig()` de `lib/config.ts`, ou props vindas de um Server Component.
- **Cores de marca sempre em token** (`bg-esmeralda`, `text-ouro`, `text-creme`, `text-erro`). Hex apenas em `app/globals.css` e `config/event.config.ts`. Exceção: preto puro para sombra e escurecimento (`shadow-black/30`, `backdrop:bg-black/80`) é profundidade, não cor de marca.
- **Tailwind v4:** não existe `tailwind.config.js`. Tokens são declarados com `@theme inline` dentro de `app/globals.css`.
- **Next.js 16:** `middleware.ts` não existe mais — o arquivo é `proxy.ts` na raiz. `params` e `searchParams` são Promises. `cookies()` é assíncrono.
- **Todo texto de interface em pt-BR**, com acentuação correta.
- **Toda animação respeita `prefers-reduced-motion`.**
- **Alias de import:** `@/*` mapeia para a raiz do projeto (`./*`), já configurado no `tsconfig.json`.
- **Commits em pt-BR**, no formato `tipo: descrição`.

---

## Estrutura de arquivos desta fase

| Arquivo | Responsabilidade |
|---|---|
| `config/event.schema.ts` | Contrato `EventConfig` em zod — a forma de qualquer evento |
| `config/event.config.ts` | A instância: dados da Alice |
| `config/fonts.ts` | Instâncias `next/font` (exceção ao whitelabel: exige import estático) |
| `lib/config.ts` | `getEventConfig()` — único ponto de leitura, valida na primeira chamada |
| `lib/date.ts` | Formatação de data em pt-BR a partir do ISO da config |
| `app/globals.css` | Tokens `@theme inline`, reset e estilos de base |
| `app/layout.tsx` | Root: fontes, `lang="pt-BR"`, CSS vars da config |
| `app/(site)/layout.tsx` | Moldura ornamental do convite |
| `app/(admin)/layout.tsx` | Layout sóbrio do admin |
| `components/ui/*` | `Button`, `Card`, `FormField`, `Modal`, `Ornament` |
| `components/invitation/SectionShell.tsx` | Casca das cinco seções do menu |
| `public/poster.jpeg` | A arte (movida da raiz do repo) |

---

### Task 1: Dependências, variáveis de ambiente e assets

**Files:**
- Modify: `package.json`
- Modify: `.gitignore:34`
- Create: `.env.example`
- Move: `poster.jpeg` → `public/poster.jpeg`

**Interfaces:**
- Consumes: nada (primeira tarefa)
- Produces: `zod@^4.4.3` disponível para a Task 2; `public/poster.jpeg` disponível para a Fase 2

- [ ] **Step 1: Instalar as dependências desta fase**

Apenas o que a Fase 1 usa. Drizzle, Blob e afins entram nas fases que os consomem — instalar antes só polui o `package.json`.

```bash
npm install zod@^4.4.3
```

- [ ] **Step 2: Mover a arte para `public/`**

O arquivo ainda não está sob controle de versão, então `git mv` falharia — use `mv` e adicione depois.

```bash
mv poster.jpeg public/poster.jpeg
git add public/poster.jpeg
```

- [ ] **Step 3: Permitir o versionamento do `.env.example`**

O `.gitignore` atual tem `.env*` na linha 34, que engoliria o arquivo de exemplo. Adicione a exceção logo abaixo:

```gitignore
# env files (can opt-in for committing if needed)
.env*
!.env.example
```

- [ ] **Step 4: Criar o `.env.example`**

Documenta todas as variáveis do projeto inteiro, mesmo as que só serão usadas em fases seguintes — é o arquivo que um novo dev lê primeiro.

```bash
# Neon / Postgres (fase 3)
DATABASE_URL=

# Vercel Blob (fase 4)
BLOB_READ_WRITE_TOKEN=

# Admin (fase 5)
ADMIN_PASSWORD=
SESSION_SECRET=

# URL base — usada na OG image e no QR Code (fases 4 e 6)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Teto de fotos antes de recusar novos uploads (fase 4)
# 1000 ≈ 840MB no Blob (~800KB full + ~40KB thumb por foto), com margem sobre o 1GB do plano Hobby
PHOTOS_GLOBAL_LIMIT=1000
```

- [ ] **Step 5: Verificar que o projeto ainda compila**

Run: `npm run build`
Expected: build conclui sem erro. O `app/page.tsx` ainda é o do scaffold — isso é esperado, a Fase 2 o substitui.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json .gitignore .env.example public/poster.jpeg
git commit -m "chore: adiciona zod, env de exemplo e move a arte para public"
```

---

### Task 2: Contrato `EventConfig` e loader

**Files:**
- Create: `config/event.schema.ts`
- Create: `config/event.config.ts`
- Create: `lib/config.ts`
- Create: `lib/date.ts`

**Interfaces:**
- Consumes: `zod` (Task 1)
- Produces:
  - `type EventConfig` — o objeto validado
  - `getEventConfig(): EventConfig`
  - `formatEventDate(iso: string): { weekday: string; day: string; month: string; year: string; time: string; full: string }`

- [ ] **Step 1: Escrever o schema**

Este arquivo é o contrato do whitelabel: o que precisa existir para *qualquer* evento renderizar.

```ts
// config/event.schema.ts
import { z } from 'zod'

export const eventConfigSchema = z.object({
  celebrant: z.object({
    name: z.string().min(1),
    monogram: z.string().min(1).max(3),
    age: z.number().int().positive(),
  }),
  event: z.object({
    /** ISO 8601 com offset. Ex.: 2026-12-11T19:00:00-03:00 */
    startsAt: z.string().datetime({ offset: true }),
    timeZone: z.string().min(1),
  }),
  venue: z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    mapsQuery: z.string().min(1),
    notes: z.array(z.string()),
  }),
  guide: z.array(z.string()).min(1),
  gifts: z.object({
    clothingSize: z.string().nullable(),
    shoeSize: z.string().nullable(),
    preferences: z.array(z.string()),
    pixKey: z.string().nullable(),
  }),
  dressCode: z.object({
    avoid: z.array(z.string()).min(1),
    reason: z.string().min(1),
  }),
  theme: z.object({
    colors: z.object({
      esmeralda: z.string(),
      esmeraldaFundo: z.string(),
      jade: z.string(),
      ouro: z.string(),
      ouroClaro: z.string(),
      creme: z.string(),
    }),
    poster: z.string().min(1),
  }),
  media: z.object({
    /** null enquanto o arquivo não existir — a UI se adapta sozinha */
    openingVideo: z.string().nullable(),
    soundtrack: z.string().nullable(),
  }),
  photos: z.object({
    maxPerUpload: z.number().int().positive(),
    maxFileSizeMb: z.number().positive(),
  }),
})

export type EventConfig = z.infer<typeof eventConfigSchema>
```

- [ ] **Step 2: Escrever a instância da Alice**

Os campos de presente estão `null` de propósito: são o conteúdo que o anfitrião ainda vai fornecer. A UI da Fase 2 omite o que for `null` em vez de mostrar campo vazio.

```ts
// config/event.config.ts
import type { EventConfig } from './event.schema'

export const eventConfig: EventConfig = {
  celebrant: {
    name: 'Alice Fernandes',
    monogram: 'AF',
    age: 15,
  },
  event: {
    startsAt: '2026-12-11T19:00:00-03:00',
    timeZone: 'America/Sao_Paulo',
  },
  venue: {
    name: 'Espaço Jardim das Acácias',
    address: 'Rua das Acácias, 500 - Jardim Botânico, Porto Alegre - RS, 90000-000',
    mapsQuery: 'Espaço Jardim das Acácias, Rua das Acácias, 500, Porto Alegre - RS',
    notes: ['O local possui estacionamento próprio.'],
  },
  guide: [
    'Confirme sua presença com antecedência.',
    'Seja pontual.',
    'Este convite é exclusivo e pessoal.',
    'Sinta-se à vontade para tirar fotos.',
    'Evite atrapalhar o trabalho do fotógrafo oficial.',
    'Aproveite a festa!',
  ],
  gifts: {
    clothingSize: null,
    shoeSize: null,
    preferences: [
      'Perfumes de fragrância doce',
      'Maquiagem',
      'Acessórios dourados',
    ],
    pixKey: null,
  },
  dressCode: {
    avoid: ['Tons de verde'],
    reason: 'O verde é a cor da debutante e fica reservado a ela na festa.',
  },
  theme: {
    colors: {
      esmeralda: '#0B2E1E',
      esmeraldaFundo: '#071A11',
      jade: '#A9C64C',
      ouro: '#C9A227',
      ouroClaro: '#E8C766',
      creme: '#F3EAD3',
    },
    poster: '/poster.jpeg',
  },
  media: {
    openingVideo: null,
    soundtrack: null,
  },
  photos: {
    maxPerUpload: 10,
    maxFileSizeMb: 15,
  },
}
```

- [ ] **Step 3: Escrever o loader**

A validação roda uma vez e o resultado é memoizado. Se a config estiver malformada, o app falha no boot com mensagem clara — melhor do que renderizar um convite quebrado.

```ts
// lib/config.ts
import { z } from 'zod'
import { eventConfig } from '@/config/event.config'
import { eventConfigSchema, type EventConfig } from '@/config/event.schema'

let cached: EventConfig | null = null

export function getEventConfig(): EventConfig {
  if (cached) return cached

  const result = eventConfigSchema.safeParse(eventConfig)
  if (!result.success) {
    throw new Error(
      `config/event.config.ts inválido:\n${JSON.stringify(z.treeifyError(result.error), null, 2)}`
    )
  }

  cached = result.data
  return cached
}
```

`z.treeifyError` é a API do zod 4 para transformar o erro em estrutura legível — em versões anteriores seria `error.format()`.

- [ ] **Step 4: Escrever os helpers de data**

Nada de data escrita à mão na config: tudo deriva do ISO, para que trocar de evento não exija reescrever textos.

```ts
// lib/date.ts
type EventDateParts = {
  weekday: string
  day: string
  month: string
  year: string
  time: string
  full: string
}

export function formatEventDate(iso: string, timeZone: string): EventDateParts {
  const date = new Date(iso)
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('pt-BR', { timeZone, ...options }).format(date)

  return {
    weekday: part({ weekday: 'long' }),
    day: part({ day: '2-digit' }),
    month: part({ month: 'long' }),
    year: part({ year: 'numeric' }),
    time: part({ hour: '2-digit', minute: '2-digit' }),
    full: part({ dateStyle: 'full', timeStyle: 'short' }),
  }
}
```

- [ ] **Step 5: Verificar tipos e validação**

Run: `npx tsc --noEmit`
Expected: sem erros.

Confirme que a config é aceita e que a data formata como esperado. Crie `scripts/check-config.ts` com caminhos **relativos** — o alias `@/*` depende do resolvedor do Next e não vale fora dele:

```ts
// scripts/check-config.ts
import { getEventConfig } from '../lib/config'
import { formatEventDate } from '../lib/date'

const config = getEventConfig()
console.log(formatEventDate(config.event.startsAt, config.event.timeZone))
```

`lib/config.ts` importa `@/config/event.config`; troque esse import por `../config/event.config` se a execução falhar a resolver o alias.

```bash
npm install -D tsx@^4.23.8
npx tsx scripts/check-config.ts
```

Expected: `weekday: 'sexta-feira'`, `day: '11'`, `month: 'dezembro'`, `year: '2026'`, `time: '19:00'`.

Se a verificação passar, apague o script — ele existe só para esta conferência:

```bash
rm scripts/check-config.ts
```

- [ ] **Step 6: Commit**

```bash
git add config/ lib/config.ts lib/date.ts
git commit -m "feat: adiciona EventConfig tipada, loader e formatação de data"
```

---

### Task 3: Tema em tokens e tipografia

**Files:**
- Modify: `app/globals.css` (substitui o conteúdo do scaffold)
- Create: `config/fonts.ts`
- Modify: `app/layout.tsx` (substitui o conteúdo do scaffold)

**Interfaces:**
- Consumes: `getEventConfig()` (Task 2)
- Produces: utilitários `bg-esmeralda`, `bg-esmeralda-fundo`, `text-ouro`, `text-ouro-claro`, `text-creme`, `text-jade` e as famílias `font-display` / `font-sans`, disponíveis em todos os componentes das fases seguintes

- [ ] **Step 1: Definir as fontes**

Exceção consciente ao whitelabel: `next/font` exige import estático, então trocar tipografia significa editar este arquivo. Está documentado no spec.

```ts
// config/fonts.ts
import { Cormorant_Garamond, Jost } from 'next/font/google'

export const fontDisplay = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})

export const fontSans = Jost({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})
```

- [ ] **Step 2: Reescrever o `globals.css`**

Os valores em `:root` são fallbacks; o `RootLayout` os sobrescreve inline a partir da config. Por isso `@theme inline` referencia as variáveis em vez de hex literais — é o que permite trocar a paleta sem tocar em componente.

```css
@import "tailwindcss";

:root {
  --brand-esmeralda: #0B2E1E;
  --brand-esmeralda-fundo: #071A11;
  --brand-jade: #A9C64C;
  --brand-ouro: #C9A227;
  --brand-ouro-claro: #E8C766;
  --brand-creme: #F3EAD3;
  /* Erro não vem da config: vermelho de alerta é convenção de interface,
     não decisão de marca, e nenhuma festa deveria escolher o seu. */
  --brand-erro: #F3A6A0;
}

@theme inline {
  --color-esmeralda: var(--brand-esmeralda);
  --color-esmeralda-fundo: var(--brand-esmeralda-fundo);
  --color-jade: var(--brand-jade);
  --color-ouro: var(--brand-ouro);
  --color-ouro-claro: var(--brand-ouro-claro);
  --color-creme: var(--brand-creme);
  --color-erro: var(--brand-erro);

  --font-display: var(--font-display);
  --font-sans: var(--font-sans);
}

body {
  background-color: var(--brand-esmeralda-fundo);
  color: var(--brand-creme);
  font-family: var(--font-sans), system-ui, sans-serif;
}

/* Foco visível e consistente em toda navegação por teclado. */
:focus-visible {
  outline: 2px solid var(--brand-ouro-claro);
  outline-offset: 3px;
  border-radius: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 3: Reescrever o `RootLayout`**

Aqui as cores da config viram CSS vars. Note `lang="pt-BR"` — o scaffold vinha com `en`, e isso afeta leitores de tela e hifenização.

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import { fontDisplay, fontSans } from '@/config/fonts'
import { getEventConfig } from '@/lib/config'
import './globals.css'

const config = getEventConfig()

export const metadata: Metadata = {
  title: `${config.celebrant.name} — ${config.celebrant.age} anos`,
  description: `Convite para os ${config.celebrant.age} anos de ${config.celebrant.name}.`,
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  const { colors } = config.theme

  return (
    <html
      lang="pt-BR"
      className={`${fontDisplay.variable} ${fontSans.variable} h-full antialiased`}
      style={
        {
          '--brand-esmeralda': colors.esmeralda,
          '--brand-esmeralda-fundo': colors.esmeraldaFundo,
          '--brand-jade': colors.jade,
          '--brand-ouro': colors.ouro,
          '--brand-ouro-claro': colors.ouroClaro,
          '--brand-creme': colors.creme,
        } as React.CSSProperties
      }
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
```

`LayoutProps<'/'>` é o tipo gerado pelo Next 16 — já usado pelo scaffold, mantenha.

- [ ] **Step 4: Verificar que os tokens funcionam**

Substitua temporariamente o conteúdo de `app/page.tsx` por um cartão de teste:

```tsx
export default function Page() {
  return (
    <main className="flex flex-1 items-center justify-center bg-esmeralda">
      <div className="rounded-lg border border-ouro/40 p-8 text-center">
        <p className="font-display text-4xl text-ouro-claro">Alice</p>
        <p className="mt-2 font-sans text-creme">11 de dezembro de 2026</p>
      </div>
    </main>
  )
}
```

Run: `npm run dev` e abra `http://localhost:3000`
Expected: fundo esmeralda, "Alice" em serif dourada, data em creme com sans-serif. Se as cores não aplicarem, os tokens não estão sendo gerados — revise o bloco `@theme inline`.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css app/layout.tsx app/page.tsx config/fonts.ts
git commit -m "feat: adiciona tema em tokens e tipografia do convite"
```

---

### Task 4: Componentes de UI base

**Files:**
- Create: `components/ui/Button.tsx`
- Create: `components/ui/Card.tsx`
- Create: `components/ui/FormField.tsx`
- Create: `components/ui/Modal.tsx`
- Create: `components/ui/Ornament.tsx`

**Interfaces:**
- Consumes: tokens de tema (Task 3)
- Produces:
  - `<Button variant="primary" | "ghost" size="md" | "lg" />` — estende `ButtonHTMLAttributes`
  - `<Card />` — estende `HTMLAttributes<HTMLDivElement>`
  - `<FormField label htmlFor error hint>{children}</FormField>`
  - `<Modal open onClose title>{children}</Modal>`
  - `<Ornament placement="top" | "bottom" | "divider" />`

- [ ] **Step 1: `Button`**

Sem lib de variantes — são duas variantes e dois tamanhos. `min-h-11` não é enfeite: é o alvo de toque mínimo para quem usa o convite de pé, no escuro.

```tsx
// components/ui/Button.tsx
import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost'
  size?: 'md' | 'lg'
}

const variants = {
  primary:
    'bg-ouro text-esmeralda-fundo hover:bg-ouro-claro disabled:bg-ouro/40',
  ghost:
    'border border-ouro/50 text-ouro-claro hover:border-ouro hover:bg-ouro/10',
} as const

const sizes = {
  md: 'min-h-11 px-5 text-sm',
  lg: 'min-h-13 px-8 text-base',
} as const

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full font-sans font-medium tracking-wide transition-colors disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  )
}
```

- [ ] **Step 2: `Card`**

```tsx
// components/ui/Card.tsx
import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-ouro/25 bg-esmeralda/70 p-6 shadow-lg shadow-black/30 backdrop-blur-sm ${className}`}
      {...props}
    />
  )
}
```

- [ ] **Step 3: `FormField`**

Label real associada por `htmlFor` — placeholder não substitui label, some ao digitar e não é lido de forma confiável por leitores de tela. O erro usa `role="alert"` para ser anunciado.

```tsx
// components/ui/FormField.tsx
import type { ReactNode } from 'react'

type FormFieldProps = {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  optional?: boolean
  children: ReactNode
}

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  optional,
  children,
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="font-sans text-sm text-creme">
        {label}
        {optional && <span className="ml-1 text-creme/50">(opcional)</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-creme/60">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-erro">
          {error}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: `Modal`**

Usa o `<dialog>` nativo, que já entrega trap de foco, fechamento por `Esc` e camada de topo sem `z-index` — bem menos código do que uma implementação manual, e mais acessível.

```tsx
// components/ui/Modal.tsx
'use client'

import { useEffect, useRef, type ReactNode } from 'react'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(event) => {
        // O dialog não tem estilo próprio, então sua área É o backdrop:
        // um clique cujo alvo é ele mesmo aconteceu fora do conteúdo.
        if (event.target === ref.current) onClose()
      }}
      className="m-auto w-[min(92vw,64rem)] bg-transparent p-0 backdrop:bg-black/80"
    >
      <div className="max-h-[90dvh] overflow-y-auto rounded-2xl border border-ouro/30 bg-esmeralda p-4 text-creme">
        {children}
      </div>
    </dialog>
  )
}
```

O `bg-transparent p-0` no `<dialog>` não é cosmético: com padding ou fundo próprios, a faixa entre a borda do dialog e o conteúdo também satisfaz `event.target === ref.current`, e o modal fecharia com o usuário clicando visualmente dentro dele. Todo o visual mora no wrapper interno, dimensionado pelo conteúdo.

- [ ] **Step 5: `Ornament`**

Filete dourado que separa blocos. `aria-hidden` porque é puramente decorativo.

```tsx
// components/ui/Ornament.tsx
type OrnamentProps = {
  placement?: 'top' | 'bottom' | 'divider'
}

export function Ornament({ placement = 'divider' }: OrnamentProps) {
  const rotation = placement === 'bottom' ? 'rotate-180' : ''

  return (
    <div aria-hidden className={`flex items-center justify-center gap-3 ${rotation}`}>
      <span className="h-px w-16 bg-linear-to-r from-transparent to-ouro/60" />
      <span className="text-ouro/80">❧</span>
      <span className="h-px w-16 bg-linear-to-l from-transparent to-ouro/60" />
    </div>
  )
}
```

- [ ] **Step 6: Verificar**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros.

- [ ] **Step 7: Commit**

```bash
git add components/ui/
git commit -m "feat: adiciona componentes de UI base do convite"
```

---

### Task 5: Grupos de rota e casca de seção

**Files:**
- Create: `app/(site)/layout.tsx`
- Create: `app/(admin)/layout.tsx`
- Create: `components/invitation/SectionShell.tsx`
- Move: `app/page.tsx` → `app/(site)/page.tsx`

**Interfaces:**
- Consumes: `Ornament` (Task 4), `getEventConfig()` (Task 2)
- Produces: `<SectionShell title subtitle>{children}</SectionShell>` — usado pelas cinco seções do menu na Fase 2

- [ ] **Step 1: Criar o layout do grupo `(site)`**

O grupo `(site)` não aparece na URL: `app/(site)/page.tsx` continua servindo `/`. Ele existe para separar a moldura do convite do layout do admin. O player de música entra aqui na Fase 2.

Os layouts de grupo recebem `children` tipado explicitamente, não `LayoutProps<'/'>`: esse tipo é gerado por rota, e o grupo `(admin)` ainda não tem página alguma, então não haveria tipo para ele. `LayoutProps` fica reservado ao `RootLayout`.

```tsx
// app/(site)/layout.tsx
import type { ReactNode } from 'react'

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-esmeralda-fundo">
      {/* Vinheta: escurece as bordas e faz a arte parecer emoldurada em telas largas. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.65)_100%)]"
      />
      <div className="relative flex flex-1 flex-col">{children}</div>
    </div>
  )
}
```

- [ ] **Step 2: Criar o layout do grupo `(admin)`**

Sóbrio de propósito: é ferramenta de trabalho, não convite. Sem vinheta, sem ornamento, sem música.

```tsx
// app/(admin)/layout.tsx
import type { ReactNode } from 'react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-esmeralda-fundo text-creme">
      {children}
    </div>
  )
}
```

- [ ] **Step 3: Mover a página raiz para dentro do grupo**

```bash
mkdir -p "app/(site)"
git mv app/page.tsx "app/(site)/page.tsx"
```

- [ ] **Step 4: Criar o `SectionShell`**

Isto é o que impede as cinco seções do menu de repetirem moldura, título e botão de voltar. Cada página vira essencialmente conteúdo.

```tsx
// components/invitation/SectionShell.tsx
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Ornament } from '@/components/ui/Ornament'

type SectionShellProps = {
  title: string
  subtitle?: string
  children: ReactNode
}

export function SectionShell({ title, subtitle, children }: SectionShellProps) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-10">
      <header className="flex flex-col items-center gap-4 text-center">
        <Ornament placement="top" />
        <h1 className="font-display text-4xl text-ouro-claro sm:text-5xl">{title}</h1>
        {subtitle && <p className="max-w-prose text-creme/80">{subtitle}</p>}
      </header>

      <div className="mt-10 flex-1">{children}</div>

      <footer className="mt-12 flex justify-center">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-full border border-ouro/50 px-6 text-sm text-ouro-claro transition-colors hover:bg-ouro/10"
        >
          Voltar ao convite
        </Link>
      </footer>
    </main>
  )
}
```

- [ ] **Step 5: Verificar**

Run: `npm run build`
Expected: build conclui. A rota `/` continua existindo (agora vinda de `app/(site)/page.tsx`) e renderiza sobre o fundo esmeralda com a vinheta.

Run: `npm run dev` e confirme que `http://localhost:3000` ainda mostra o cartão de teste, agora emoldurado pela vinheta.

- [ ] **Step 6: Commit**

```bash
git add "app/(site)" "app/(admin)" components/invitation/
git commit -m "feat: adiciona grupos de rota do site e do admin com casca de secao"
```

---

## Definição de pronto

A Fase 1 está completa quando:

- `npm run build` conclui sem erros nem warnings de tipo
- `getEventConfig()` valida a config e lança erro legível se ela for corrompida (teste manualmente: apague um campo obrigatório e rode `npm run dev`)
- Os utilitários de cor e as duas famílias tipográficas funcionam em qualquer componente
- Existem os dois grupos de rota, e `/` é servida por `app/(site)/page.tsx`
- `poster.jpeg` está em `public/` e não na raiz do repositório

**Próxima fase:** `2026-08-05-fase-2-convite.md` — abertura animada, pôster e as cinco seções do menu.
</content>
