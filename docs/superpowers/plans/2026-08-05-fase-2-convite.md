# Fase 2 — Convite: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar o convite navegável: abertura animada, pôster com a data, menu e as cinco seções — com trilha sonora persistindo entre rotas.

**Architecture:** A raiz monta abertura → pôster → menu como Client Component orquestrado por estado de sessão. O player de áudio vive no layout `(site)`, fora da árvore de páginas, para sobreviver à navegação. As seções consomem `SectionShell` e recebem conteúdo de `getEventConfig()`.

**Tech Stack:** Next.js 16.3.0, React 19.2, Tailwind v4, motion 13, zustand 5.

## Global Constraints

Valem para **todas** as tarefas (repetidos da Fase 1 — o executor pode estar lendo apenas este arquivo):

- **Sem TDD.** Nenhum teste automatizado nesta fase. Verificação por `tsc --noEmit`, `npm run lint`, `npm run build` e inspeção visual no navegador.
- **Nenhum componente importa `config/event.config.ts` diretamente.** Sempre `getEventConfig()` de `lib/config.ts`, ou props vindas de um Server Component.
- **Cores de marca sempre em token** (`bg-surface`, `text-accent`, `text-foreground`, `text-danger`). Hex apenas em `app/globals.css` e `config/event.config.ts`. Exceção: preto puro para sombra e escurecimento (`shadow-black/30`, `backdrop:bg-black/80`) é profundidade, não cor de marca.
- **Tailwind v4:** sem `tailwind.config.js`; tokens em `@theme inline` no `app/globals.css`.
- **Next.js 16:** `params`/`searchParams` são Promises; `cookies()` é assíncrono.
- **Todo texto de interface em pt-BR**, com acentuação correta.
- **Toda animação respeita `prefers-reduced-motion`.**
- **Alias de import:** `@/*` → raiz do projeto.
- **Commits em pt-BR**, formato `tipo: descrição`.

## Contexto herdado da Fase 1

Disponível para uso, com estas assinaturas exatas:

```ts
getEventConfig(): EventConfig                         // lib/config.ts
formatEventDate(iso, timeZone): {                     // lib/date.ts
  weekday, day, month, year, time, full               // todos string
}
<Button variant="primary"|"ghost" size="md"|"lg" />   // components/ui/Button.tsx
<Card />                                              // components/ui/Card.tsx
<FormField label htmlFor error hint optional />        // components/ui/FormField.tsx
<Modal open onClose title />                          // components/ui/Modal.tsx
<Ornament placement="top"|"bottom"|"divider" />       // components/ui/Ornament.tsx
<SectionShell title subtitle />                       // components/invitation/SectionShell.tsx
```

Campos relevantes de `EventConfig`: `celebrant.{name,monogram,age}`, `event.{startsAt,timeZone}`, `venue.{name,address,mapsQuery,notes}`, `guide: string[]`, `gifts.{clothingSize,shoeSize,preferences,pixKey}`, `dressCode.{avoid,reason}`, `theme.poster`, `media.{openingVideo,soundtrack}`.

---

## Estrutura de arquivos desta fase

| Arquivo | Responsabilidade |
|---|---|
| `stores/music-store.ts` | Estado do player (único estado que atravessa rotas) |
| `components/invitation/MusicPlayer.tsx` | Elemento `<audio>` + botão de mudo, montado no layout |
| `components/invitation/GoldParticles.tsx` | Partículas douradas em CSS puro |
| `components/invitation/OpeningSequence.tsx` | A abertura em três tempos + slot de vídeo |
| `components/invitation/PosterHero.tsx` | A arte com data e horário sobrepostos |
| `components/invitation/MenuGrid.tsx` | Os cinco itens do menu |
| `components/invitation/menu-items.ts` | Rótulos e rotas do menu |
| `app/(site)/page.tsx` | Orquestra abertura → pôster → menu |
| `app/(site)/manual/page.tsx` | Manual do convidado |
| `app/(site)/presentes/page.tsx` | Sugestões de presente |
| `app/(site)/dress-code/page.tsx` | Dress code |
| `app/(site)/local/page.tsx` | Local com mapa |
| `app/(site)/confirmar/page.tsx` | Casca — a Fase 3 substitui pelo formulário |

---

### Task 1: Player de música com slot de áudio

**Files:**
- Create: `stores/music-store.ts`
- Create: `components/invitation/MusicPlayer.tsx`
- Modify: `app/(site)/layout.tsx`
- Modify: `package.json`

**Interfaces:**
- Consumes: `getEventConfig()`
- Produces:
  - `useMusicStore` com `{ isPlaying: boolean; isMuted: boolean; hasStarted: boolean; start(): void; toggleMute(): void }`
  - `<MusicPlayer src={string} />` montado no layout `(site)`

- [ ] **Step 1: Instalar as dependências da fase**

```bash
npm install zustand@^5.0.14 motion@^13.0.0
```

- [ ] **Step 2: Criar o store**

Zustand em vez de Context porque este estado muda com frequência (mudo/desmudo) e é lido em pontos distantes da árvore — Context re-renderizaria tudo abaixo dele.

```ts
// stores/music-store.ts
import { create } from 'zustand'

type MusicState = {
  /** Vira true no primeiro gesto do usuário — é o que destrava o áudio no navegador. */
  hasStarted: boolean
  isMuted: boolean
  start: () => void
  toggleMute: () => void
}

export const useMusicStore = create<MusicState>((set) => ({
  hasStarted: false,
  isMuted: false,
  start: () => set({ hasStarted: true }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
}))
```

- [ ] **Step 3: Criar o `MusicPlayer`**

O componente inteiro não renderiza nada quando não há trilha configurada — é assim que o slot plugável funciona: `media.soundtrack` continua `null` até o arquivo chegar, e nenhum botão de som aparece.

```tsx
// components/invitation/MusicPlayer.tsx
'use client'

import { useEffect, useRef } from 'react'
import { useMusicStore } from '@/stores/music-store'

export function MusicPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const hasStarted = useMusicStore((state) => state.hasStarted)
  const isMuted = useMusicStore((state) => state.isMuted)
  const toggleMute = useMusicStore((state) => state.toggleMute)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !hasStarted) return
    // play() rejeita se o navegador não considerar o gesto válido; ignorar é o
    // comportamento correto — o convite não deve quebrar por causa da trilha.
    audio.play().catch(() => {})
  }, [hasStarted])

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = isMuted
  }, [isMuted])

  return (
    <>
      <audio ref={audioRef} src={src} loop preload="auto" />
      {hasStarted && (
        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? 'Ativar música' : 'Desativar música'}
          className="fixed bottom-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-accent/40 bg-surface/80 text-accent-light backdrop-blur-sm transition-colors hover:bg-surface"
        >
          {isMuted ? '🔇' : '🎵'}
        </button>
      )}
    </>
  )
}
```

- [ ] **Step 4: Montar o player no layout `(site)`**

Fica no layout, não na página: com navegação client-side do App Router, o layout não remonta ao trocar de rota, então a música atravessa a navegação sem cortar.

```tsx
// app/(site)/layout.tsx
import { MusicPlayer } from '@/components/invitation/MusicPlayer'
import { getEventConfig } from '@/lib/config'

export default function SiteLayout({ children }: LayoutProps<'/'>) {
  const { media } = getEventConfig()

  return (
    <div className="relative flex min-h-dvh flex-col bg-surface-deep">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.65)_100%)]"
      />
      <div className="relative flex flex-1 flex-col">{children}</div>
      {media.soundtrack && <MusicPlayer src={media.soundtrack} />}
    </div>
  )
}
```

- [ ] **Step 5: Verificar**

Run: `npx tsc --noEmit && npm run build`
Expected: sem erros. Como `media.soundtrack` é `null`, nenhum áudio é montado — comportamento esperado até o mp3 chegar.

- [ ] **Step 6: Commit**

```bash
git add stores/ components/invitation/MusicPlayer.tsx "app/(site)/layout.tsx" package.json package-lock.json
git commit -m "feat: adiciona player de musica com slot de trilha opcional"
```

---

### Task 2: Partículas douradas

**Files:**
- Create: `components/invitation/GoldParticles.tsx`

**Interfaces:**
- Consumes: nada
- Produces: `<GoldParticles count={number} />`

- [ ] **Step 1: Criar o componente**

CSS puro em vez de lib de partículas: são pontos com opacidade oscilante, e uma dependência para isso seria peso sem retorno. As posições são determinísticas (derivadas do índice) porque `Math.random()` no render quebraria a hidratação — servidor e cliente gerariam valores diferentes.

```tsx
// components/invitation/GoldParticles.tsx
export function GoldParticles({ count = 28 }: { count?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }, (_, index) => {
        // Distribuição pseudoaleatória estável: mesmo resultado no servidor e no cliente.
        const left = (index * 37) % 100
        const top = (index * 61) % 100
        const size = 2 + (index % 3)
        const delay = (index % 7) * 0.4
        const duration = 3 + (index % 5) * 0.6

        return (
          <span
            key={index}
            className="absolute rounded-full bg-accent-light motion-safe:animate-pulse"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${size}px`,
              height: `${size}px`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              opacity: 0.5,
              boxShadow: '0 0 6px 1px rgba(232, 199, 102, 0.6)',
            }}
          />
        )
      })}
    </div>
  )
}
```

O prefixo `motion-safe:` faz o Tailwind aplicar a animação apenas quando o usuário não pediu movimento reduzido.

- [ ] **Step 2: Verificar**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add components/invitation/GoldParticles.tsx
git commit -m "feat: adiciona particulas douradas em css"
```

---

### Task 3: Sequência de abertura

**Files:**
- Create: `components/invitation/OpeningSequence.tsx`

**Interfaces:**
- Consumes: `GoldParticles` (Task 2), `useMusicStore` (Task 1), `Button`
- Produces: `<OpeningSequence monogram poster videoSrc onFinish />` — `videoSrc: string | null`, `onFinish: () => void`

- [ ] **Step 1: Criar o componente**

O botão "Abrir convite" é o gesto que destrava o áudio: navegadores bloqueiam autoplay com som, e transformar essa exigência em parte da narrativa é melhor do que um aviso pedindo para clicar.

O slot de vídeo está aqui: se `videoSrc` existir, o vídeo substitui a animação inteira; enquanto for `null`, roda a sequência em três tempos.

```tsx
// components/invitation/OpeningSequence.tsx
'use client'

import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { GoldParticles } from '@/components/invitation/GoldParticles'
import { useMusicStore } from '@/stores/music-store'

type OpeningSequenceProps = {
  monogram: string
  celebrantName: string
  poster: string
  videoSrc: string | null
  onFinish: () => void
}

export function OpeningSequence({
  monogram,
  celebrantName,
  poster,
  videoSrc,
  onFinish,
}: OpeningSequenceProps) {
  const [showButton, setShowButton] = useState(false)
  const start = useMusicStore((state) => state.start)

  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), videoSrc ? 1000 : 3200)
    return () => clearTimeout(timer)
  }, [videoSrc])

  function handleOpen() {
    start()
    onFinish()
  }

  return (
    <section className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-surface-deep px-6">
      {videoSrc ? (
        <video
          src={videoSrc}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <>
          <motion.img
            src={poster}
            alt=""
            aria-hidden
            initial={{ opacity: 0, scale: 1.12 }}
            animate={{ opacity: 0.55, scale: 1 }}
            transition={{ duration: 2.4, ease: 'easeOut' }}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <GoldParticles />
        </>
      )}

      <div className="relative flex flex-col items-center gap-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="font-display text-7xl text-accent-light drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
        >
          {monogram}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1 }}
          className="font-display text-2xl tracking-[0.3em] text-foreground uppercase"
        >
          {celebrantName}
        </motion.p>

        {showButton && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            <Button size="lg" onClick={handleOpen}>
              Abrir convite
            </Button>
          </motion.div>
        )}
      </div>

      <button
        type="button"
        onClick={handleOpen}
        className="absolute bottom-6 right-6 text-xs text-foreground/60 underline underline-offset-4 hover:text-foreground"
      >
        Pular
      </button>
    </section>
  )
}
```

O "Pular" fica visível desde o primeiro segundo — quem já viu a abertura não deve ser obrigado a esperá-la.

- [ ] **Step 2: Verificar**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add components/invitation/OpeningSequence.tsx
git commit -m "feat: adiciona sequencia de abertura com slot de video"
```

---

### Task 4: Pôster com data

**Files:**
- Create: `components/invitation/PosterHero.tsx`

**Interfaces:**
- Consumes: `formatEventDate` (Fase 1)
- Produces: `<PosterHero poster celebrantName date />` onde `date` é o retorno de `formatEventDate`

- [ ] **Step 1: Criar o componente**

Duas decisões visuais que vêm do formato da arte (693×895, retrato):

1. **Mobile ocupa a tela; desktop vira cartão.** Esticar 693px em tela larga pixelaria. O entorno recebe o verde esmeralda (token `surface-deep`), e a arte fica emoldurada em proporção de convite.
2. **A data vai sobre um gradiente que sobe da base**, não direto sobre a arte. A parte inferior da imagem é o vestido claro, onde texto dourado desapareceria. O gradiente garante contraste independente do que esteja atrás.

O nome não se repete em texto: a arte já traz "alice fernandes" no banner.

```tsx
// components/invitation/PosterHero.tsx
import Image from 'next/image'

type PosterHeroProps = {
  poster: string
  celebrantName: string
  date: {
    weekday: string
    day: string
    month: string
    year: string
    time: string
  }
}

export function PosterHero({ poster, celebrantName, date }: PosterHeroProps) {
  return (
    <section className="flex flex-1 items-center justify-center px-0 py-0 sm:px-6 sm:py-10">
      <div className="relative aspect-[693/895] w-full max-w-none overflow-hidden sm:max-w-md sm:rounded-3xl sm:border sm:border-accent/30 sm:shadow-2xl sm:shadow-black/50">
        <Image
          src={poster}
          alt={`Convite de 15 anos de ${celebrantName}`}
          fill
          priority
          sizes="(min-width: 640px) 28rem, 100vw"
          className="object-cover"
        />

        {/* Gradiente que garante leitura da data sobre qualquer parte da arte. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-surface-deep via-surface-deep/85 to-transparent"
        />

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 px-6 pb-8 text-center">
          <p className="font-sans text-xs uppercase tracking-[0.35em] text-accent">
            {date.weekday}
          </p>
          <p className="font-display text-4xl text-accent-light">
            {date.day} de {date.month} de {date.year}
          </p>
          <p className="font-sans text-sm tracking-widest text-foreground">
            às {date.time}
          </p>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verificar**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add components/invitation/PosterHero.tsx
git commit -m "feat: adiciona poster do convite com data sobreposta"
```

---

### Task 5: Menu e montagem da raiz

**Files:**
- Create: `components/invitation/menu-items.ts`
- Create: `components/invitation/MenuGrid.tsx`
- Modify: `app/(site)/page.tsx` (substitui o cartão de teste da Fase 1)
- Create: `components/invitation/InvitationExperience.tsx`

**Interfaces:**
- Consumes: `OpeningSequence` (Task 3), `PosterHero` (Task 4), `getEventConfig`, `formatEventDate`
- Produces: `<MenuGrid />`; a rota `/` completa

- [ ] **Step 1: Definir os itens do menu**

```ts
// components/invitation/menu-items.ts
export const menuItems = [
  { href: '/manual', label: 'Manual do convidado', icon: '✦' },
  { href: '/presentes', label: 'Sugestões de presente', icon: '❧' },
  { href: '/dress-code', label: 'Dress code', icon: '✧' },
  { href: '/confirmar', label: 'Confirmar presença', icon: '❦' },
  { href: '/local', label: 'Local', icon: '✶' },
] as const
```

- [ ] **Step 2: Criar o `MenuGrid`**

```tsx
// components/invitation/MenuGrid.tsx
'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { menuItems } from '@/components/invitation/menu-items'

export function MenuGrid() {
  return (
    <nav aria-label="Menu do convite" className="mx-auto w-full max-w-md px-6 pb-16">
      <ul className="flex flex-col gap-3">
        {menuItems.map((item, index) => (
          <motion.li
            key={item.href}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.5 }}
          >
            <Link
              href={item.href}
              className="flex min-h-14 items-center gap-4 rounded-full border border-accent/30 bg-surface/60 px-6 text-foreground transition-colors hover:border-accent hover:bg-surface"
            >
              <span aria-hidden className="text-accent">
                {item.icon}
              </span>
              <span className="font-sans text-sm tracking-wide">{item.label}</span>
            </Link>
          </motion.li>
        ))}
      </ul>
    </nav>
  )
}
```

- [ ] **Step 3: Criar o orquestrador**

A abertura roda uma vez por sessão. `sessionStorage` só existe no cliente, então a leitura acontece dentro de `useEffect` — ler no render quebraria a hidratação.

```tsx
// components/invitation/InvitationExperience.tsx
'use client'

import { useEffect, useState } from 'react'
import { MenuGrid } from '@/components/invitation/MenuGrid'
import { OpeningSequence } from '@/components/invitation/OpeningSequence'
import { PosterHero } from '@/components/invitation/PosterHero'

const SEEN_KEY = 'convite:abertura-vista'

type InvitationExperienceProps = {
  monogram: string
  celebrantName: string
  poster: string
  videoSrc: string | null
  date: {
    weekday: string
    day: string
    month: string
    year: string
    time: string
  }
}

export function InvitationExperience({
  monogram,
  celebrantName,
  poster,
  videoSrc,
  date,
}: InvitationExperienceProps) {
  // undefined = ainda não sabemos se a abertura já foi vista nesta sessão.
  const [showOpening, setShowOpening] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    setShowOpening(sessionStorage.getItem(SEEN_KEY) !== '1')
  }, [])

  function handleFinish() {
    sessionStorage.setItem(SEEN_KEY, '1')
    setShowOpening(false)
  }

  if (showOpening === undefined) {
    return <div className="min-h-dvh bg-surface-deep" />
  }

  if (showOpening) {
    return (
      <OpeningSequence
        monogram={monogram}
        celebrantName={celebrantName}
        poster={poster}
        videoSrc={videoSrc}
        onFinish={handleFinish}
      />
    )
  }

  return (
    <>
      <PosterHero poster={poster} celebrantName={celebrantName} date={date} />
      <MenuGrid />
    </>
  )
}
```

- [ ] **Step 4: Montar a página raiz**

Server Component: lê a config no servidor e passa só o necessário para o cliente.

```tsx
// app/(site)/page.tsx
import { InvitationExperience } from '@/components/invitation/InvitationExperience'
import { getEventConfig } from '@/lib/config'
import { formatEventDate } from '@/lib/date'

export default function Page() {
  const config = getEventConfig()
  const date = formatEventDate(config.event.startsAt, config.event.timeZone)

  return (
    <InvitationExperience
      monogram={config.celebrant.monogram}
      celebrantName={config.celebrant.name}
      poster={config.theme.poster}
      videoSrc={config.media.openingVideo}
      date={date}
    />
  )
}
```

- [ ] **Step 5: Verificar no navegador**

Run: `npm run dev` e abra `http://localhost:3000`

Expected:
- A abertura roda: monograma AF aparece, nome surge, botão "Abrir convite" entra após ~3s
- Clicar em "Abrir convite" leva ao pôster com "sexta-feira / 11 de dezembro de 2026 / às 19:00"
- Os cinco itens do menu entram em cascata
- Recarregar a página vai direto ao pôster (abertura não repete na mesma sessão)
- Abrir em aba anônima mostra a abertura de novo

Verifique também com movimento reduzido ativado (macOS: Ajustes → Acessibilidade → Tela → Reduzir movimento). Expected: sem zoom, sem pulsação das partículas, conteúdo ainda legível e navegável.

- [ ] **Step 6: Commit**

```bash
git add components/invitation/ "app/(site)/page.tsx"
git commit -m "feat: monta abertura, poster e menu na raiz do convite"
```

---

### Task 6: As cinco seções do menu

**Files:**
- Create: `app/(site)/manual/page.tsx`
- Create: `app/(site)/presentes/page.tsx`
- Create: `app/(site)/dress-code/page.tsx`
- Create: `app/(site)/local/page.tsx`
- Create: `app/(site)/confirmar/page.tsx`

**Interfaces:**
- Consumes: `SectionShell`, `Card`, `Ornament`, `Button`, `getEventConfig`
- Produces: as cinco rotas do menu

- [ ] **Step 1: Manual do convidado**

```tsx
// app/(site)/manual/page.tsx
import type { Metadata } from 'next'
import { SectionShell } from '@/components/invitation/SectionShell'
import { getEventConfig } from '@/lib/config'

export const metadata: Metadata = { title: 'Manual do convidado' }

export default function Page() {
  const { guide } = getEventConfig()

  return (
    <SectionShell
      title="Manual do convidado"
      subtitle="Algumas combinações para que a noite seja perfeita para todo mundo."
    >
      <ul className="flex flex-col gap-4">
        {guide.map((item) => (
          <li key={item} className="flex items-start gap-3 text-foreground/90">
            <span aria-hidden className="mt-1 text-accent">
              ✦
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </SectionShell>
  )
}
```

- [ ] **Step 2: Sugestões de presente**

Os campos ainda não fornecidos são `null` na config. A página omite o que falta em vez de renderizar rótulo vazio — assim ela já funciona hoje e melhora sozinha quando o anfitrião preencher.

```tsx
// app/(site)/presentes/page.tsx
import type { Metadata } from 'next'
import { SectionShell } from '@/components/invitation/SectionShell'
import { Card } from '@/components/ui/Card'
import { getEventConfig } from '@/lib/config'

export const metadata: Metadata = { title: 'Sugestões de presente' }

export default function Page() {
  const { gifts, celebrant } = getEventConfig()

  const sizes = [
    gifts.clothingSize && { label: 'Tamanho de roupa', value: gifts.clothingSize },
    gifts.shoeSize && { label: 'Numeração de calçado', value: gifts.shoeSize },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <SectionShell
      title="Sugestões de presente"
      subtitle={`Se quiser presentear ${celebrant.name.split(' ')[0]}, aqui vão algumas ideias.`}
    >
      <div className="flex flex-col gap-5">
        {sizes.length > 0 && (
          <Card>
            <dl className="flex flex-col gap-3">
              {sizes.map((size) => (
                <div key={size.label} className="flex justify-between gap-4">
                  <dt className="text-foreground/70">{size.label}</dt>
                  <dd className="font-display text-xl text-accent-light">{size.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        )}

        {gifts.preferences.length > 0 && (
          <Card>
            <h2 className="font-display text-2xl text-accent-light">Preferências</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {gifts.preferences.map((preference) => (
                <li key={preference} className="flex items-start gap-3 text-foreground/90">
                  <span aria-hidden className="mt-1 text-accent">
                    ❧
                  </span>
                  <span>{preference}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {gifts.pixKey && (
          <Card>
            <h2 className="font-display text-2xl text-accent-light">Vale-presente via Pix</h2>
            <p className="mt-2 text-sm text-foreground/70">Chave Pix</p>
            <p className="mt-1 font-mono text-lg break-all text-foreground">{gifts.pixKey}</p>
          </Card>
        )}
      </div>
    </SectionShell>
  )
}
```

- [ ] **Step 3: Dress code**

```tsx
// app/(site)/dress-code/page.tsx
import type { Metadata } from 'next'
import { SectionShell } from '@/components/invitation/SectionShell'
import { Card } from '@/components/ui/Card'
import { getEventConfig } from '@/lib/config'

export const metadata: Metadata = { title: 'Dress code' }

export default function Page() {
  const { dressCode } = getEventConfig()

  return (
    <SectionShell title="Dress code" subtitle="Um pedido pequeno, com um motivo bonito.">
      <Card>
        <h2 className="font-display text-2xl text-accent-light">Cores a evitar</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {dressCode.avoid.map((color) => (
            <li
              key={color}
              className="rounded-full border border-highlight/60 px-4 py-2 text-sm text-highlight"
            >
              {color}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-foreground/85">{dressCode.reason}</p>
      </Card>
    </SectionShell>
  )
}
```

- [ ] **Step 4: Local**

O mapa é um `<iframe>` do Google Maps em modo embed sem chave de API, com `loading="lazy"` para não pesar a rota. Os botões abrem o app nativo quando existe.

```tsx
// app/(site)/local/page.tsx
import type { Metadata } from 'next'
import { SectionShell } from '@/components/invitation/SectionShell'
import { Card } from '@/components/ui/Card'
import { getEventConfig } from '@/lib/config'

export const metadata: Metadata = { title: 'Local' }

export default function Page() {
  const { venue } = getEventConfig()
  const query = encodeURIComponent(venue.mapsQuery)

  return (
    <SectionShell title="Local" subtitle={venue.name}>
      <div className="flex flex-col gap-5">
        <Card>
          <p className="text-foreground/90">{venue.address}</p>
          {venue.notes.map((note) => (
            <p key={note} className="mt-3 text-sm text-foreground/70">
              {note}
            </p>
          ))}
        </Card>

        <div className="overflow-hidden rounded-2xl border border-accent/25">
          <iframe
            title={`Mapa de ${venue.name}`}
            src={`https://www.google.com/maps?q=${query}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-64 w-full border-0"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${query}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-surface-deep transition-colors hover:bg-accent-light"
          >
            Abrir no Google Maps
          </a>
          <a
            href={`https://waze.com/ul?q=${query}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-accent/50 px-6 text-sm text-accent-light transition-colors hover:bg-accent/10"
          >
            Abrir no Waze
          </a>
        </div>
      </div>
    </SectionShell>
  )
}
```

- [ ] **Step 5: Casca de "Confirmar presença"**

A Fase 3 substitui o conteúdo pelo formulário. Esta casca existe para que o menu não tenha link quebrado ao fim da Fase 2 — cada fase termina com o app inteiro navegável.

```tsx
// app/(site)/confirmar/page.tsx
import type { Metadata } from 'next'
import { SectionShell } from '@/components/invitation/SectionShell'

export const metadata: Metadata = { title: 'Confirmar presença' }

export default function Page() {
  return (
    <SectionShell
      title="Confirmar presença"
      subtitle="O formulário de confirmação estará disponível em instantes."
    >
      <p className="text-center text-foreground/70">
        Estamos preparando esta parte do convite.
      </p>
    </SectionShell>
  )
}
```

- [ ] **Step 6: Verificar todas as rotas**

Run: `npm run build && npm run dev`

Expected: as cinco rotas abrem a partir do menu, cada uma com moldura, título dourado e botão "Voltar ao convite". A música (quando houver trilha) não corta ao navegar entre elas. A seção de presentes mostra apenas o bloco de preferências, já que tamanhos e Pix ainda são `null`.

Navegue por teclado (Tab) e confirme o contorno dourado de foco em todos os links e botões.

- [ ] **Step 7: Commit**

```bash
git add "app/(site)"
git commit -m "feat: adiciona as cinco secoes do menu do convite"
```

---

## Definição de pronto

A Fase 2 está completa quando:

- A abertura roda uma vez por sessão, com "Pular" funcional
- O pôster mostra dia da semana, data e horário legíveis sobre o gradiente
- Os cinco itens do menu levam a páginas completas
- Nenhuma rota do menu está quebrada
- Com `prefers-reduced-motion` ativo, nada anima e tudo continua utilizável
- `npm run build` conclui sem erros

**Pendências conhecidas, resolvidas em fases seguintes:** `/confirmar` é casca (Fase 3); não há OG image nem favicon próprios (Fase 6); a trilha e o vídeo continuam `null` até os arquivos existirem.

**Próxima fase:** `2026-08-05-fase-3-rsvp.md` — Neon, Drizzle e o formulário de confirmação.
</content>
