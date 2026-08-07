# SDD ledger — plan: docs/superpowers/plans/2026-08-05-fase-1-fundacao.md

Branch: feat/convite (repositório local, sem remote)
Baseline: build limpo em 6924a6a, sem suíte de testes ainda

Pre-flight scan — 3 defeitos do plano corrigidos antes da Task 1:
- Task 1 Step 2: `git mv naiara-bg.jpeg` falharia (arquivo untracked) → `mv` + `git add`
- Task 5: `LayoutProps<'/'>` nos layouts de grupo → `{ children: ReactNode }`
  (o tipo é gerado por rota e o grupo `(admin)` ainda não tem página)
- Task 2 Step 5: verificação via `npx tsx -e` com alias `@/*` não resolveria
  fora do Next → script temporário com caminhos relativos

Task 1: complete (commits e1c9fe2..9393149, review clean)
Task 1: minor (deferred): relatório do implementador alegou que zod já estava
  em package.json; o diff mostra que foi adicionado. Código correto, narrativa
  do relatório imprecisa. Sem impacto no shipped code.

Task 2: fix round 1/5 (1 addressed, 0 open — árvore suja: package.json com tsx
  ficou fora do commit; commits 446149f..7e989e1)
Task 2: complete (commits 9393149..7e989e1, review clean)
Task 2: minor (deferred): `EventDateParts` em lib/date.ts não é exportado;
  consumidores precisam de `ReturnType<typeof formatEventDate>` para nomear a
  forma. Espelha o brief, não é desvio do implementador.

Task 3: fix round 1/5 (1 addressed, 0 open — relatório omitia lint e build;
  correção documental, sem commit novo; HEAD segue ee22399)
  Re-review não dispatchado: diff de código vazio. Verificado pelo controlador
  que o relatório passou a conter os dois comandos com saída literal.
Task 3: complete (commits 7e989e1..ee22399, review clean)
Task 3: minor (deferred): cast largo `as React.CSSProperties` nas CSS vars
  inline do RootLayout (plan-mandated) — typo em `--brand-*` não seria pego
  pelo tsc. Alternativa: `React.CSSProperties & Record<'--brand-${string}', string>`.
Task 3: minor (deferred): `--font-display: var(--font-display)` no @theme
  inline lê como auto-referência à primeira vista (é LHS=chave do tema,
  RHS=custom property do next/font). Merece um comentário no globals.css.

Task 4: fix round 1/5 (2 addressed, 0 open — ambos plan-mandated, decididos
  pelo humano: área morta do backdrop do Modal e ausência de token de erro;
  commits bf7914e..977f28f)
  Plano sincronizado com as decisões em 431a096 (docs).
Task 4: complete (commits ee22399..977f28f, review clean)
Task 4: minor (deferred): `Modal` recebe `title` mas só o usa como aria-label,
  sem contrapartida visível — consumidor precisa duplicar o texto como heading.
Task 4: minor (deferred): `FormField` suprime `hint` quando há `error`;
  descarta orientação de formato justo quando o usuário mais precisa.
Task 4: minor (deferred): `Ornament` tem enum de 3 valores mas 'top' e
  'divider' renderizam idêntico.

Task 5: complete (commits 977f28f..37553b1, review clean)
  ⚠️ resolvidos pelo controlador:
  - mudança fora do brief em app/layout.tsx (37553b1): legítima. O reviewer
    validou contra node_modules/next/dist/docs — o exemplo canônico de Root
    Layout usa `{ children: ReactNode }`, e o validator gerado impõe o mesmo
    LayoutConfig<"/"> aos três layouts. A premissa do brief é que estava errada.
  - tokens podem não resolver (Tailwind v4 no-op silencioso): verificado no CSS
    compilado — .bg-esmeralda, .bg-esmeralda-fundo, .text-creme, .text-erro,
    .text-ouro-claro e .border-ouro\/50 todos presentes.
Task 5: minor (deferred): relatório não registrou o erro de tipo pré-fix que
  motivou tocar app/layout.tsx, exigindo arqueologia para auditar.

FASE 1 COMPLETA — 5/5 tarefas. Segue para revisão final da branch.

REVISÃO FINAL (opus, 6924a6a..37553b1) — "Ready to merge: with fixes".
Achou 8 Important que as revisões por tarefa não podiam ver, e triou os
8 minors deferidos (3 a resolver, 5 dívida aceitável).

Fix wave única (37553b1..134ea1c, 6 commits), 9 correções, todas ADDRESSED
no re-review escopado:
  1. `body` e `:focus-visible` para @layer base — estavam fora de layer e
     venciam @layer utilities, fazendo todo botão virar retângulo ao receber
     foco por teclado. `:root { --brand-* }` fica fora de layer de propósito
     (sustenta o global-error.tsx da Fase 6), agora com comentário.
  2. ciclo `--font-sans: var(--font-sans)` — inválido por spec, funcionava por
     acidente de cascata; quebraria na tela de erro da Fase 6. Variáveis do
     next/font renomeadas para `--font-*-family`.
  3. Modal disparava onClose duas vezes no backdrop e sozinho no fechamento
     programático — evento nativo `close` passa a ser o único caminho.
  4. `title.template` no metadata (10 páginas das fases seguintes dependiam).
  5. FormField: ids de hint/erro derivados de htmlFor, hint deixa de sumir
     quando há erro, contrato documentado em JSDoc.
  6. `EventDateParts` exportado + guard de ISO inválido.
  7. tokens renomeados para funcionais (decisão do humano): surface,
     surfaceDeep, highlight, accent, accentLight, foreground, danger.
  8. dados reais fora do repo (decisão do humano): event.config.example.ts
     versionado, event.config.ts no .gitignore e fora do índice.
  9. menores: z.iso.datetime(), contraste AA do "(opcional)", type="button"
     padrão, script typecheck, comentário no Ornament, SVGs do scaffold
     removidos, scripts/ vazio removido.

Task final: parked — JSDoc do FormField documenta
  `aria-describedby={error ? errorId : hintId}`, mas hint e erro agora
  coexistem; seguir o contrato à risca deixaria o hint sem vínculo.
  ruling: real, não load-bearing (FormField não tem consumidor no código).
  Sem segunda fix wave por processo. Endereçado no plano da Fase 3, que cria
  o primeiro consumidor: helper `describedBy()` referencia ambos os ids.

LIMPEZA DE HISTÓRICO — concluída. Bundle de segurança em
  scratchpad/backup-completo.bundle antes de começar.
  Precisou de quatro passadas, cada uma revelando alcance que a anterior
  não cobria:
  1. index-filter removendo config/event.config.ts do range da branch
  2. tree-filter anonimizando docs (*.md) e renomeando o asset
  3. tree-filter cobrindo .tsx/.ts (o cartão de teste tinha o nome) e o
     nome do arquivo do spec, que carregava "naiara"
  4. msg-filter — uma mensagem de commit ainda dizia "design do convite
     digital Naiara 15 anos"
  A lição: `main` também precisava ser filtrada. O commit que criou os seis
  planos (6924a6a) estava fora do range da branch, então a branch só mostrava
  as remoções contra ele — os dados viviam na main.
  Verificação final: `git rev-list --all --objects` e `git log --all -p`
  ambos com zero ocorrências.

PENDENTE (decisão do humano, não bloqueia nada, prazo: Fase 6/publicação):
  a arte em public/poster.jpeg traz o nome real escrito no banner sob o
  brasão. Texto do repo está anonimizado; a imagem não. Saídas: publicar
  assumindo isso, ou versionar arte genérica e ignorar a real como a config.
