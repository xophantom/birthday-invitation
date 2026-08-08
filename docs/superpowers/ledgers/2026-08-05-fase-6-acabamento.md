# SDD ledger — plan: docs/superpowers/plans/2026-08-05-fase-6-acabamento.md

Branch: feat/acabamento (criado a partir de `main` em d28590c)
Baseline: typecheck, lint, 15 testes e build limpos; árvore limpa

## Calibração de ritmo

Mantida a da Fase 5, que reduziu de 20+ para 7 despachos: tarefas agrupadas, review por tarefa só
onde há risco, sonnet por padrão, sem consulta ao parceiro em achado `plan-mandated`. Acabamento é
área de menor risco que autenticação, então **nenhum grupo leva review dedicado** — todos vão para
o review final único. Três grupos: (1+2) erros e OG image, (3+4) QR Code e acessibilidade,
(5) README.

## Pré-voo — conflitos encontrados no plano

**1. A substituição do `metadata` no `app/layout.tsx` destrói o template de título.** O plano manda
trocar o objeto inteiro por uma versão com `title` plano. O atual tem
`title: { default, template: '%s · Nome' }`, e **todas** as páginas dependem dele — `/fotos` declara
`title: 'Enviar fotos'` e conta com o template para virar "Enviar fotos · Nome". Resolução:
acrescentar `metadataBase` e `openGraph` **preservando** o objeto `title` existente.

**2. `app/(site)/not-found.tsx` não captura URL inexistente.** Com dois route groups e um layout
raiz, um `not-found` dentro de grupo só atende `notFound()` chamado nos segmentos daquele grupo —
URL que não casa rota nenhuma cai no `app/not-found.tsx` raiz, que o plano não cria. O próprio Step
4 do plano manda verificar `/rota-que-nao-existe` e esperar a tela temática: como escrito, falharia.
Resolução: criar também o da raiz.

**3. A fonte baixada é variável, e o `ImageResponse` (satori) não lida bem com fonte variável.** O
`curl` do plano baixa `CormorantGaramond[wght].ttf` e salva com nome `-Bold`. Resolução: obter uma
instância estática de peso 700. O projeto já usa `Cormorant_Garamond` com pesos estáticos
`['400','600','700']` em `config/fonts.ts`, então é o análogo correto.

**4. O grupo `(admin)` fica sem error boundary.** O plano cria `error.tsx` só em `(site)`. Falha de
banco numa tela do admin — Neon instável no wifi da festa — mostra a tela crua do Next. O ledger da
Fase 5 registrou isso como lacuna. Resolução: criar também o de `(admin)`.

**5. A cor do QR Code é hex literal em componente**, contra a Global Constraint do próprio plano
("nenhuma cor literal em componente"). Resolução: vir da config.

**6. Contagem de testes:** o plano diz 14 no Step 2 da Task 5. São **15**.

**7. O README do plano contém afirmações falsas sobre a implementação atual.** Detalhado no
despacho do grupo 3. Um README de portfólio que mente sobre o código é pior que nenhum.

## Fronteira do que não é meu

**O deploy (`npx vercel`, Task 5 Step 3) não é executado por agente.** Publica os dados reais do
evento, usa a conta do parceiro humano, e cadastrar variáveis de ambiente em produção é ação dele.
Entrego o projeto pronto para deployar e a lista do que verificar depois.

## Progresso

Grupo 1 (Tasks 1+2 — erros, 404, OG image, ícones): commits `d28590c..08d1043`.
Grupo 2 (Tasks 3+4 — QR Code, acessibilidade): commits `08d1043..3242a82`. 7 correções aplicadas.
Grupo 3 (Task 5 — README, sem deploy): commit `79dc3da`.

## Review final (`d28590c..79dc3da`)

Veredito: "com correções". **Um Crítico, quatro Importantes, nove Menores.**

Confirmado nos artefatos gerados, não só no código: o `title.template` sobreviveu (os prerenders
provam — `/fotos` vira "Enviar fotos · Nome"); o 404 da raiz devolve HTTP 404 com a tela temática;
a fonte embutida é estática (16 tabelas, **sem `fvar`**, `usWeightClass=700`); a OG image está
visualmente correta e o satori preservou os espaços da linha de data; os três geradores de imagem
são prerenderizados estáticos, o que elimina a armadilha de `readFile(process.cwd(), 'public')` não
existir no filesystem da função serverless; e o error boundary do admin não engole o `redirect()`
(verificado no fonte do Next: `getDerivedStateFromError` relança erro de router).

**C1 (Crítico) — o guarda do QR Code tem furo no valor errado mais provável.** Ele testa
`{!siteUrl && ...}`, ou seja, só variável **ausente**. Mas o `.env.example` traz
`NEXT_PUBLIC_SITE_URL=http://localhost:3000` **pré-preenchido** — a única variável do arquivo com
valor —, o README manda `cp .env.example .env`, e o plano manda "cadastre todas as variáveis para
Production". Seguindo isso, produção recebe localhost, `siteUrl` é truthy, o aviso não aparece, e o
QR sai impresso apontando para a máquina de desenvolvimento. **A coleta de fotos da festa inteira
morre com a folha já na mesa.** Causa raiz é metade do plano, mas o guarda é a última linha de
defesa antes da impressão.

I1 — a OG image tem 746 KB (medido em `.next` e por `curl`), provavelmente acima do que o WhatsApp
aceita para prévia (~300 KB é o limite prático relatado). `ImageResponse` só emite PNG e metade da
tela é fotografia, o pior caso. O layout está certo; o que não dá para verificar por build é a
aceitação do WhatsApp. **Decisão do controlador: não corrigir preventivamente** — o revisor
ranqueou "verificar em produção primeiro" como opção 1, e a falha é recuperável (recolar o link),
ao contrário do QR impresso. Vai para a lista manual com o caminho de fallback documentado.
I2 — `metadataBase` cai para localhost sem guarda, e `NEXT_PUBLIC_*` é congelado em build time:
cadastrar a variável depois não conserta sem novo build.
I3 — o `inert` cobre o `<main>` mas **não** o botão de música, que vive no layout do grupo `(site)`,
fora daquela árvore. O `z-[60]` resolve o hit-test do ponteiro, mas o botão continua focável por
`Tab` e na árvore de acessibilidade, invisível atrás da abertura opaca — exatamente o defeito que o
`inert` foi escrito para eliminar, sobrevivendo no elemento errado. Dormente hoje
(`media.soundtrack` é `null`), vira real quando a trilha chegar, **depois desta última revisão**.
I4 — o aviso do QR Code é `text-danger` (salmão claro) sem estilo de impressão: na folha branca fica
com contraste ~2:1, praticamente invisível.

Veredito da varredura de acessibilidade: **as 7 correções são legítimas e nenhuma regrediu nada.**
O `inert` foi analisado a fundo — o React 19.2.8 trata `inert` como booleano de verdade, então
`inert={false}` remove o atributo (o comportamento tóxico era do React 18); a `OpeningSequence` é
irmã do `<main>` e nunca é alcançada; `prefers-reduced-motion` é ortogonal; e mover o `.focus()`
para efeito está certo, porque focar elemento ainda `inert` é recusado em silêncio.

README: **nenhuma afirmação factualmente errada** sobre o código de hoje, e zero dados reais do
evento. Duas imprecisões de grau (M5, M6).

parked — `app/(site)/not-found.tsx` é hoje inalcançável: `notFound()` não é chamado em lugar nenhum
do projeto, e quem atende o 404 é o da raiz. ruling: seguro-desemprego mandado pelo plano, custa
quatro linhas.

## Leva de correção do review final e re-review

Leva única em `79dc3da..437c1e8` (7 commits), **11/11 itens atendidos**. Re-review em opus: sem
quebra nova, e nenhuma das 7 correções de acessibilidade da fase foi desfeita.

**C1 fechado e verificado por execução** — o re-revisor extraiu a lógica do guarda e rodou 20 casos:
avisa para ausente, vazia, só espaços, `http://localhost:3000`, `https://localhost`, `127.0.0.1`,
`[::1]`, `0.0.0.0` e URL não-parseável; e **não** avisa para domínio real, inclusive nos casos
capciosos `https://localhost.exemplo.com` e `https://exemplo.com/localhost`. A escolha de comparar
`new URL(url).hostname` em vez de substring é o que faz esses dois passarem. Barra final normalizada
(`///` vira um `/fotos`).

**Duas decisões do implementador, ambas validadas:**

1. **Esvaziou `NEXT_PUBLIC_SITE_URL` no `.env.example`.** O valor pré-preenchido não comprava nada
   (o código já cai para localhost sozinho) e era o que transportava localhost para produção. Causa
   e sintoma ficaram fechados em separado — o guarda não depende dessa mudança.
2. **Usou `||` em vez do `??` que o review sugeria.** Variável declarada vazia chega como string
   vazia, não `undefined`, e o re-revisor confirmou por execução que `new URL('' ?? fallback)` lança
   `TypeError: Invalid URL` — o `??` teria derrubado o `next build` assim que alguém seguisse o
   próprio `.env.example`. Varredura de completude: `NEXT_PUBLIC_SITE_URL` é lida em exatamente dois
   lugares, ambos com `||`, **nenhum `??` sobrevivente**; e os outros quatro leitores de env do
   projeto já são imunes a string vazia.

**I3 verificado a fundo:** o botão de música volta ao estado exato depois da abertura (`hasStarted`
e `isMuted` vivem na store, desmontar o player não perde nada); "Pular" e "Abrir convite" passam
pelo mesmo handler, então a flag reseta nos dois caminhos; e uma sessão que já viu a abertura começa
com a flag correta, sem risco de esconder o botão para sempre.

Custo dos ícones com fonte embutida: **zero em produção.** Continuam prerenderizados estáticos, a
fonte de 76 KB é lida só em build time, e o PNG emitido cresceu de 968 para 1.150 bytes.

parked — o guarda do QR cobre loopback, não IP de LAN (`192.168.x.x`, `.local`). ruling: exigiria
alguém cadastrar um IP de rede local à mão no painel da Vercel; improvável no fluxo real.
parked — I1, a OG image de 746 KB. ruling: só se verifica colando o link em produção, e a falha é
recuperável, ao contrário do QR impresso. Primeiro teste pós-deploy.

FASE 6 COMPLETA — 5/5 tarefas, commits `d28590c..437c1e8`. Veredito do re-review: **pronto para
deploy**. O deploy em si é ação do dono do projeto.
