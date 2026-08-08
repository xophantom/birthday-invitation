# SDD ledger — plan: docs/superpowers/plans/2026-08-05-fase-2-convite.md

Branch: feat/convite (repositório local, sem remote)
Baseline: 9fbef7c — typecheck, lint e build limpos; árvore limpa

Herdado da Fase 1 (ledger em ../2026-08-05-fase-1-fundacao/progress.md):
- tokens têm nomes funcionais: surface, surface-deep, accent, accent-light,
  foreground, highlight, danger. O plano da Fase 2 já foi sincronizado.
- `config/event.config.ts` é gitignored; o versionado é o `.example.ts`.
- A arte é `public/poster.jpeg` (renomeada de naiara-bg.jpeg).
- `Modal` fecha só pelo evento nativo `close` — não chame `onClose` direto.
- `FormField` mostra hint e erro juntos; consumidor referencia os dois ids
  em `aria-describedby` (helper `describedBy()` documentado no plano da Fase 3).
- Estilos de base vão em `@layer base`; só as `--brand-*` ficam fora de layer.

Pre-flight scan: sem conflitos entre tarefas ou com as Global Constraints.
O plano da Fase 2 foi escrito depois do da Fase 1 e já incorpora as decisões.

Task 1: complete (commits 9fbef7c..c5fea0a, review clean)
  Plano corrigido em d27a350: a linha de interfaces prometia `isPlaying`,
  que o código do próprio plano não declara.
Task 1: minor (deferred): o relatório usou `git diff config/event.config.ts`
  como prova de que a alteração temporária foi revertida — mas o arquivo é
  gitignored, então esse comando volta vazio de qualquer jeito. A propriedade
  de segurança vale (o diff mostra só os 5 arquivos esperados), mas o método
  de verificação declarado não prova o que alega.
Task 1: minor (deferred): relatório rodou `npx tsc --noEmit` em vez de
  `npm run typecheck`, o comando que o plano nomeia. Equivalentes.

Task 2: fix round 1/5 (2 addressed, 0 open — ambos plan-mandated; commits
  9e6333c..f79655b). Não consultei o humano porque nenhum era escolha: o
  plano declara querer partículas oscilantes e cores em token, e o código
  que ele traz falhava em entregar as duas coisas. Corrigir realiza a
  intenção declarada em vez de contrariá-la.
  - boxShadow com rgba literal do dourado → color-mix sobre o token
  - `opacity: 0.5` inline anulava o animate-pulse (keyframe único em 50%,
    quadros 0%/100% vindos do valor subjacente): interpolava 0.5→0.5→0.5.
    As partículas nunca piscaram, e nada disso apareceria em typecheck,
    lint ou build.
  Plano sincronizado em 2b59c02.
Task 2: complete (commits d27a350..f79655b, review clean)

Task 3: fix round 1/5 (2 addressed, 0 open — commits 2381b99..8a4238c)
  Achado com alcance além da tarefa: a regra de prefers-reduced-motion no
  globals.css só cobre animações CSS. O `motion` anima via JavaScript e
  ignora media query sem `<MotionConfig reducedMotion="user">`. Todas as
  animações da fase — e as futuras — estavam ignorando a preferência, e o
  relatório do implementador afirmava o contrário sem base no código.
  Correção montada uma vez no layout (MotionProvider), cobrindo abertura,
  menu e transições de rota que ainda vêm.
  Junto: alvo de toque do "Pular" de ~30x16px para min-h-11 px-3.
  Plano sincronizado em 63e0107; snippet alinhado ao código em 6e39f2e.
Task 3: complete (commits f79655b..8a4238c, review clean)

Task 4: complete (commits 8a4238c..0f434bd, review clean)
Task 5: fix round 1/5 (1 addressed, 0 open — commits 8fc6bf3..91c1961)
  sessionStorage sem try/catch travaria o convite numa tela preta permanente
  em webview embutida ou com armazenamento bloqueado — o ambiente em que um
  link do WhatsApp abre. Fallback agora degrada para "primeira visita".
  Plano sincronizado em 3179436.
Task 5: complete (commits 0f434bd..91c1961, review clean)
Task 5: minor (deferred): a "simulação de falha" do relatório foi limpar o
  sessionStorage, o que exercita o caminho feliz e não o catch. A correção
  está correta por leitura do código, mas o teste não provou o que alegava.
  O caminho de exceção do sessionStorage segue sem verificação empírica.

Task 6: complete (commits 91c1961..6b2ffe2, review clean)
Task 6: minor (deferred): cast `as {label,value}[]` após .filter(Boolean) em
  presentes/page.tsx — um type guard seria seguro sem custo.
Task 6: minor (deferred): keys de lista usam o valor do item; quebraria em
  silêncio se o anfitrião cadastrar dois itens iguais.

FASE 2 COMPLETA — 6/6 tarefas. Rotas: / /confirmar /dress-code /local
/manual /presentes. typecheck, lint e build limpos; árvore limpa.

REVISÃO FINAL (opus, 9fbef7c..6b2ffe2) — "with fixes". Cinco Important que
as revisões por tarefa não podiam ver:
  1. trilha inalcançável — hasStarted só virava true na abertura, e a
     abertura só monta com storage vazio; quem recarregava ou entrava por
     link direto nunca via o botão de som
  2. `/` não renderizava nada no servidor — div vazia, sem <main> nem <h1>;
     tela preta na webview do WhatsApp até o bundle hidratar
  3. arte baixada duas vezes (150KB crus + 86KB otimizados, URLs distintas)
  4. degradação do sessionStorage repetia a abertura a cada volta ao menu,
     não a cada carregamento como o comentário prometia
  5. foco descartado na transição abertura → pôster
  Mais seis minors. Todos os 11 endereçados em uma fix wave
  (6b2ffe2..c07df65, 5 commits).

Fase 2: parked — a correção 1 introduziu colisão de alvos de toque: o botão
  de som (fixed bottom-5 right-5, z-50) sobrepõe o "Pular" da abertura
  (absolute bottom-6 right-6, z-40) em ~40x40px, e vence o hit-test.
  ruling: real, não load-bearing. Nenhuma fase seguinte depende da posição
  desses controles, e está dormente enquanto media.soundtrack for null.
  Sem segunda fix wave por processo. Endereçado no plano da Fase 6, no
  checklist de acessibilidade, onde colisão de alvo de toque pertence.

Fase 2: divergência registrada — o plano previa que a reestruturação do
  InvitationExperience eliminaria o `eslint-disable react-hooks/set-state-in-effect`.
  O implementador verificou na fonte do plugin que a regra percorre todos os
  blocos do efeito sem exceção para chamadas condicionais, então o disable
  segue necessário. Justificativa se sustenta; não é reestruturação pela metade.

Fase 2: minor (deferred): ❧ (U+2767) ainda aparece em presentes/page.tsx e no
  Ornament da Fase 1 — mesmo risco de tofu no Android que motivou trocar os
  glifos do menu.
Fase 2: minor (deferred): MotionImage da abertura não tem `priority`. Hoje
  irrelevante porque o PosterHero (sempre montado, com priority) resolve a
  mesma URL — vira problema se o PosterHero deixar de estar sempre montado.

Task 4: minor (deferred): a altura do gradiente do pôster é fração fixa
  (h-2/5), não derivada da altura do texto. Hoje sobra margem, mas um mês
  mais longo ou um bump de font-size poderia empurrar a primeira linha
  para a faixa transparente. Vale conferir visualmente quando a Task 5
  montar com a arte real.
