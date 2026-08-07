# Estado do projeto — leia isto primeiro

Ponto de entrada para retomar o trabalho numa sessão nova. Atualizado ao fim da Fase 3.

**Branch:** `feat/convite` (repositório local, sem remote)
**Progresso:** 3 de 6 fases completas
**Estado da árvore:** limpa. `npm run typecheck`, `npm run lint`, `npm test` (4 testes) e `npm run build` passam.

## Como retomar

Abra uma sessão nova na raiz do projeto e diga o que quer fazer, por exemplo:

> Retome o projeto do convite a partir da Fase 4. Leia `docs/superpowers/ESTADO.md` primeiro.

O agente deve, nesta ordem:

1. Ler este arquivo
2. Ler `docs/superpowers/specs/2026-08-05-convite-design.md` (o design aprovado)
3. Ler o plano da fase a executar em `docs/superpowers/plans/`
4. Invocar a skill `superpowers:subagent-driven-development`, que foi o processo usado nas três primeiras fases

Os ledgers detalhados de cada fase executada estão em `.superpowers/sdd/<nome-do-plano>/progress.md`. **Eles não estão versionados** (há um `.gitignore` com `*` dentro de `.superpowers/sdd/`), então existem apenas neste computador. Este arquivo consolida o que importa deles.

## O que está pronto

| Fase | Entrega | Commits |
|---|---|---|
| 1 — Fundação | `EventConfig` tipada e validada, tema em tokens CSS, tipografia, cinco componentes de UI, grupos de rota `(site)` e `(admin)` | até `d8c8753` |
| 2 — Convite | Abertura animada, pôster com data, menu, cinco seções, player de trilha | até `e7c86ca` |
| 3 — RSVP | Neon + Drizzle, schema com migração aplicada, validação com teste, camada de queries, Server Action, formulário funcionando | até `d8d0b63` |

Rotas existentes: `/`, `/manual`, `/presentes`, `/dress-code`, `/local`, `/confirmar`.

**O convite já pode circular** — confirmações de presença são gravadas no banco.

## O que falta

- **Fase 4 — Fotos:** compressão no navegador, upload direto ao Vercel Blob, rota do QR Code. O `BLOB_READ_WRITE_TOKEN` já está configurado no `.env`.
- **Fase 5 — Admin:** sessão com `jose`, lista de convidados, revisão de fotos, download em zip.
- **Fase 6 — Acabamento:** OG image, ícones, QR Code para impressão, revisão de acessibilidade, README, deploy.

## Pendências abertas

### Precisam de decisão sua

**A arte traz o nome real escrito nela.** `public/poster.jpeg` tem o nome da aniversariante no banner sob o brasão. Todo o texto do repositório e do histórico foi anonimizado (nome, endereço, local — inclusive nas mensagens de commit), mas a imagem não. Se o repositório for público, o nome fica visível para quem abrir o arquivo. Saídas: publicar assumindo isso, ou versionar uma arte genérica e ignorar a real como já é feito com `config/event.config.ts`. Decisão natural para a Fase 6, junto do deploy.

**Conteúdo de presentes ainda não fornecido.** `gifts.clothingSize`, `gifts.shoeSize` e `gifts.pixKey` estão `null` em `config/event.config.ts`. A página `/presentes` omite os blocos vazios por design — ela melhora sozinha quando você preencher, sem mexer em código.

**Trilha e vídeo de abertura não existem.** `media.soundtrack` e `media.openingVideo` são `null`. Os slots estão prontos: basta salvar os arquivos em `public/` e apontar a config.

### Trabalho técnico registrado

**Re-review pendente.** A última leva de correções da Fase 3 (range `99d7d3b..d8d0b63`) não passou pelo re-review adversarial que as demais receberam — a sessão acabou no limite de contexto. Foi verificada diretamente (typecheck, lint, testes, build e inspeção do módulo alterado), mas vale um olhar independente antes da Fase 4.

**Colisão de alvo de toque.** O botão de som (`fixed bottom-5 right-5`, `z-50`) sobrepõe o "Pular" da abertura (`absolute bottom-6 right-6`, `z-40`) em cerca de 40×40px, e vence o hit-test. Está dormente enquanto não houver trilha configurada. A correção já está descrita no checklist de acessibilidade do plano da Fase 6.

**Glifo com risco de tofu.** `❧` (U+2767) aparece em `app/(site)/presentes/page.tsx` e no `Ornament`. Cobertura irregular em Android. Também no checklist da Fase 6.

## Convenções que o projeto adotou

Um agente que retome precisa respeitar estas, que valem para todas as fases:

- **Whitelabel:** nenhum componente importa `config/event.config.ts` diretamente — sempre `getEventConfig()` de `lib/config.ts`. É a fronteira que torna o convite adaptável a outro evento.
- **Cores de marca sempre em token** (`bg-surface`, `text-accent`, `text-foreground`, `text-danger`, `text-highlight`). Exceção: preto puro para sombra e escurecimento. Hex apenas em `app/globals.css` e na config.
- **Sem TDD, três testes no projeto inteiro** — decisão explícita do `tmp/prompt.md`. Dois já existem (schema de RSVP, cálculo de redimensionamento vem na Fase 4); o terceiro é a sessão do admin, na Fase 5.
- **Estilos de base vão em `@layer base`.** Declarações fora de layer vencem `@layer utilities` no CSS moderno — isso já causou um defeito real (o `:focus-visible` sobrescrevendo o arredondamento dos botões).
- **`prefers-reduced-motion`:** a regra CSS só alcança animações CSS. As do `motion` são JavaScript e dependem do `MotionProvider` já montado no layout `(site)`.
- **Toda Server Action que muta dados revalida a entrada no servidor** — elas são alcançáveis por POST direto, fora da UI.
- **Nenhum gate client-only pode ser dono do primeiro paint.** A raiz já renderizou uma `div` vazia no servidor por causa disso; o uploader da Fase 4 tem a mesma forma e não deve repetir o padrão.
- **Acesso a `sessionStorage` sempre em `try/catch`** — ele lança em webview embutida com armazenamento bloqueado, que é como um link do WhatsApp abre.
- **Todo texto de interface em pt-BR**, com acentuação correta.
- **Commits em pt-BR**, formato `tipo: descrição`.

## Particularidades do Next.js 16 já verificadas

Estas divergem do que a maioria dos exemplos assume, e estão confirmadas nos docs em `node_modules/next/dist/docs/`:

- `middleware.ts` não existe — o arquivo é `proxy.ts`, na raiz. E ele **não** é solução de autorização, apenas redirect otimista.
- `params` e `searchParams` são Promises; `cookies()` é assíncrono.
- `ImageResponse` suporta apenas flexbox — `display: grid` não funciona, e todo elemento com filhos precisa de `display: flex` explícito.
- Tailwind v4 não tem `tailwind.config.js`; tokens vão em `@theme inline` no `globals.css`. Gradientes são `bg-linear-to-*`, não `bg-gradient-to-*`.

## Ambiente

O `.env` (git-ignored) precisa ter `DATABASE_URL` e `BLOB_READ_WRITE_TOKEN`, ambos já configurados. `ADMIN_PASSWORD` e `SESSION_SECRET` são gerados na Fase 5. Veja `.env.example` para a lista completa.

O `drizzle.config.ts` lê `.env.local` e `.env`, nessa ordem de precedência.

`config/event.config.ts` é git-ignored e contém os dados reais do evento. O versionado é `config/event.config.example.ts`, com dados fictícios.
