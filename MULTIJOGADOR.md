# Multijogador, save e lobby — as regras

> **Status: proposta, com as decisões do autor de 2026-10-26 já registradas.
> Nada disto está implementado.**
> Cada regra tem um código (`S-03`, `L-07`, `J-12`, `T-05`…) para ser citada,
> aceita, trocada ou cortada. Quando uma decisão ainda é do autor, ela aparece
> como **[aberta]** e tem uma recomendação ao lado.

Convenções: **[decidido]** o autor decidiu; **[requisito]** foi pedido pelo
autor; **[proposta]** é recomendação; **[aberta]** espera decisão; **[medido]** é
fato conferido no código em 2026-10-26.

### Decisões do autor (2026-10-26)

1. **O lobby é uma taverna andável**, onde os jogadores se encontram, conversam e
   chamam outros para uma aventura (`T-01`).
2. **O destino é o B3**: taverna **pública**, com quadro de grupos abertos
   (`T-08`, seção 9). O caminho até lá passa por degraus (B0, B1, B2); o
   documento propõe os degraus, mas **o destino é decidido**.
3. **A persona do jogador na taverna é um dos heróis que já existem** (`T-02`).
4. **A taverna deve poder ser reaproveitada numa campanha** (`T-12`).

O que **continua em aberto** está na seção 10 (`D1` a `D10`). Em especial, **não
foi decidido** o método de login (`C-02`).

---

## 1. O que existe hoje

| Fato | Valor | |
|---|---|---|
| Save | **não existe**. Só o volume e o mudo ficam em `localStorage` (`phandalin:audio`) | [medido] |
| "Continuar" do menu | só reabre a partida **em memória**; fechar a aba perde tudo | [medido] |
| Motor de regras (`src/rules/`) | 47 arquivos, ~20 mil linhas, **0 acopladas à interface** | [medido] |
| Campanha (`src/game/`) | 35 arquivos, ~21,8 mil linhas; **16 arquivos / ~10 mil linhas** dependem da interface; **214 chamadas** de `narrar()`/`painel()` | [medido] |
| Cada cena | cria um **`Encounter` novo**; a campanha passa adiante por `config.continuarCom` (heróis vivos) e `app.campanha` | [medido] |
| Heróis | 12 prontos; o grupo é de **4**; serializam em JSON **sem perder nada** (6,7 KB para os 4, no 5º nível) | [medido] |
| `app.campanha` | objeto simples: `viagem`, `vila`, `vigias`, `feitos`, `utilidade`, `flags`, e um bloco por cena (`mansao`, `castelo`, `poco`…). Nenhuma atribuição de `Map`/`Set`/função encontrada | [medido] |
| RNG | semeado (`core/rng.js`). **Duas exceções** que mudam estado: `rngDaVila` em `game/phandalin.js:113` e `game/conyberry.js:34` usam `Math.random` | [medido] |
| Visão | só existe **no escuro**: `visaoDoGrupo` soma o que cada herói enxerga com a luz. **Ao ar livre não há névoa de guerra** | [medido] |
| Combate | iniciativa **por lado**: o grupo age junto, depois os inimigos | [medido] |
| Dinheiro | é do **grupo** (`game/comercio.js`) | [medido] |
| Piloto automático de herói | não existe no jogo. Existe uma política em `src/dev/balance.js` (`playCharacter`), do simulador de equilíbrio. `invocado.auto` só vale para criaturas invocadas | [medido] |
| Servidor | o Worker de hoje só serve arquivos (`wrangler.toml`, sem `main`). O README prevê "um Durable Object por grupo, servidor autoritativo" | [medido] |

### Divergência com o README

O README (linhas 142 e 286) diz que o motor "move para o servidor sem
reescrita" e que o multijogador será "servidor autoritativo". **Para `rules/`
isso é verdade** (0 linhas acopladas). **Para a campanha não é**: as cenas foram
escritas como fluxos assíncronos de tela, e esse código não roda num servidor sem
ser reescrito. A decisão `D1` (seção 10) trata disso, e o README deve ser
atualizado depois dela.

---

## 2. Princípios

- **P1 · O save é da campanha, não da sessão.** Sala é casca; campanha é o que dura.
- **P2 · Ninguém joga o herói de outro jogador.** Nem o anfitrião.
- **P3 · Multijogador não muda regra de D&D.** Muda *quem decide*.
- **P4 · Solo é uma sala de um jogador sem rede.** Mesmo caminho de código: o que
  funciona em sala funciona sozinho, e o contrário também.
- **P5 · Falhar para o lado seguro.** Queda de conexão nunca perde mais que a
  cena em andamento.

---

## 3. Vocabulário

| Termo | Significa |
|---|---|
| **Campanha** | a aventura em andamento: `campanha` + heróis + posição na história |
| **Save** | a gravação da campanha num ponto seguro |
| **Sala** | o encontro de jogadores em torno de **uma** campanha, com um código |
| **Anfitrião** | quem abriu a sala; seu navegador roda o jogo (ver `D1`) |
| **Líder** | quem decide as escolhas da narrativa; começa sendo o anfitrião |
| **Jogador** | uma pessoa na sala, identificada por um `jogadorId` anônimo |
| **Herói** | uma das 12 fichas prontas. O campo novo é `jogadorId` |
| **Taverna** | o lobby social: uma cena andável onde os jogadores se encontram (seção 13) |
| **Persona** | o avatar do jogador na taverna: um dos heróis existentes (`T-02`) |
| **Marcador** | o anel ou losango colorido sob os pés, atribuído pela taverna (`T-05`) |
| **Instância** | uma cópia da taverna com até ~16 jogadores (`T-10`) |
| **Mesa de grupo** | a mesa de 4 lugares onde se forma um grupo para uma aventura (`T-07`) |
| **Convidado / conta** | quem entra sem login, e quem entra com Google ou Discord (seção 14) |

> **Cuidado com "D1".** Neste documento, `D1`…`D10` são **decisões**. O banco de
> dados do Cloudflare também se chama D1 e aqui é sempre escrito **"banco D1"**.

> **Cuidado com "dono".** No código, *dono* já é **quem invocou** uma criatura
> (`alternarAutoDoDono`, `invocadosDe(dono)`). Para quem joga um herói, este
> documento usa **jogador** e o campo `jogadorId`, nunca "dono".

---

## 4. Save

- **S-01 · [requisito]** O jogo passa a ter save e carregar. O "Continuar" do menu
  abre o save mais recente, e não a memória.
- **S-02 · [proposta] Quando salva (automático).** (a) ao **entrar** numa cena nova,
  antes do `newEncounter`; (b) ao **sair** dela; (c) depois de cada `darXp` (são os
  marcos da aventura: o jogo já os chama em ~10 lugares); (d) ao descansar.
- **S-03 · [proposta] Salvar à mão** só em lugar seguro: explorando, sem combate e sem
  painel de narrativa aberto.
- **S-04 · [proposta] Combate não é salvável.** O `Encounter` guarda funções
  (`onEvent`, `onLog`, `aoComecar`) e não vira JSON. Se o jogo cai no meio de uma
  luta, volta ao último save, que é o **início da cena**. Isto é uma regra, não um
  defeito a consertar: salvar combate pede reescrever o motor.
- **S-05 · [proposta] O que o save guarda:**
  ```
  { versao, id, nome, criadoEm, atualizadoEm, tempoDeJogo,
    aventura, config,          // o `config` da cena a entrar (modo, capitulo, cenaDaVila…),
                               // SEM `continuarCom`: são os próprios `herois`, abaixo
    campanha,                  // app.campanha inteiro
    herois,                    // a ficha completa de cada um, com jogadorId
    xpPendente,
    jogadores: [{ jogadorId, nome }] }
  ```
- **S-06 · [proposta] Slots:** 1 autosave rotativo (os 3 últimos) e 3 manuais.
- **S-07 · [proposta] Versão e migração.** `versao` inteira, e uma função de
  migração por salto. O código já escreve `salvo.portas ??= []` em toda parte, o
  que torna save antigo compatível *para frente* de graça; a `versao` cobre o que
  `??=` não cobre (campo renomeado, formato mudado).
- **S-08 · [proposta] Onde fica no solo:** `localStorage`, chave `phandalin:save:<id>`
  (mesmo padrão de `phandalin:audio`). O save deve ter dezenas de KB, longe dos
  5 MB do limite; **a campanha ainda não foi medida**.
- **S-09 · [proposta] Exportar e importar** um arquivo `.phandalin.json`. É o backup,
  é como se muda de navegador, e é como se *hospeda um save de outra pessoa*.
- **S-10 · [proposta] Carregar nunca é parcial.** Valida o formato; se faltar herói
  ou se a versão for **mais nova** que o jogo, recusa com mensagem e não toca no
  estado atual.
- **S-11 · [proposta] Em sala,** o save da campanha mora na **nuvem** (a última cópia
  que o anfitrião enviou) e também no navegador dele. Quem for promovido a
  anfitrião (`J-41`) carrega da nuvem.
- **S-12 · [proposta]** Primeira tarefa da implementação: um teste de **ida e volta**
  (`JSON.parse(JSON.stringify(...))` igual ao original para `campanha` e `config`,
  ao fim de cada cena), porque é isso que prova que a lista de campos acima está
  completa. Os heróis já passam: 0 diferenças [medido]. `campanha` e `config`
  ainda não foram testados assim, só lidos.

---

## 5. Menu e fluxo de telas

```
Menu principal
 ├─ Continuar ............ abre o save mais recente (solo ou sala)
 ├─ Jogar solo
 │    ├─ Nova campanha ... aventura → grupo (4 dos 12) → preparo → jogar
 │    └─ Carregar ........ lista de saves → jogar
 ├─ Multijogador
 │    ├─ Entrar na taverna  escolher persona → taverna pública (a partir do B1)
 │    ├─ Criar sala ...... [nova campanha | carregar save] → taverna da sala
 │    ├─ Entrar numa sala  código ou link → taverna da sala
 │    └─ Retomar sala .... salas recentes deste navegador
 ├─ Opções
 ├─ Créditos
 └─ Sair
```

- **M-01 · [requisito]** "Multijogador" sai de "em breve" quando existir a Fase 2
  (seção 9): criar, entrar e lobby, mesmo antes de o jogo estar sincronizado.
- **M-02 · [proposta]** As telas **grupo** e **preparo** que já existem
  (`view/menu-herois.js`) viram as do lobby: o jogador escolhe e prepara *os seus*.
- **M-03 · [proposta]** O menu continua sendo uma camada por cima do jogo, como hoje.
  Em sala, abrir o menu **não pausa** os outros.
- **M-04 · [proposta]** A **taverna andável** (seção 13) é a porta de entrada do
  multijogador. O **lobby de tela** das regras `L-xx` continua existindo como
  **plano B** (a Fase 2 o entrega antes de a arte da taverna ficar pronta) e
  como a **interface da mesa de grupo** (`T-07`).

---

## 6. Sala e lobby

> Estas regras valem para a **sala privada** e para a **mesa de grupo** da taverna
> (`T-07`). Aparecem como telas (Fase 2) e, depois, dentro da taverna.

- **L-01 · [requisito] Criar sala.** O anfitrião escolhe **Nova campanha** (a aventura
  vem aqui) ou **Carregar save** (a aventura vem do save). Define 1 a 4 jogadores.
- **L-02 · [proposta] Código** de 6 caracteres de um alfabeto de 32 símbolos sem
  ambíguos (sem `0/O`, `1/I/L`): ~10⁹ combinações, não adivinhável. Há também o
  link `…/?sala=ABC123`. **Sem lista pública de salas no B0 e no B1**; o quadro de
  grupos abertos chega no B3 (`T-08`).
- **L-03 · [proposta] Entrar.** O jogador digita um nome; o jogo cria um
  `jogadorId` (UUID) em `localStorage`. **Sem contas no B0 e no B1**; contas chegam
  no B2 (seção 14). Quem volta no mesmo navegador reassume seu lugar.
- **L-04 · [proposta] Papéis:** anfitrião e jogador. **Líder** é um papel de
  partida, igual ao anfitrião no começo e transferível.
- **L-05 · [requisito] O lobby mostra:** jogadores (conectado, desconectado,
  pronto), a aventura e o capítulo, e os **4 lugares do grupo**.
- **L-06 · [requisito] Cada jogador escolhe seu personagem**, entre os 12 prontos.
  Cada herói tem um jogador só; **Pegar** e **Largar**.
- **L-07 · [proposta] Distribuição.** O grupo é **sempre de 4**. Com 2 jogadores:
  2+2; com 3: 2+1+1; com 4: 1+1+1+1; sozinho: 4. Mínimo de 1 herói por jogador.
- **L-08 · [proposta] Herói sem jogador** joga em **piloto automático**. Isso
  **exige trabalho novo**: a política existente é `playCharacter`, em
  `src/dev/balance.js` (simulador de equilíbrio); precisa ser promovida a
  `src/rules/` e coberta por teste, e só serve para combate.
- **L-09 · [proposta] Preparo** (magias, talento, subclasse, equipamento): cada um
  prepara os seus. **P2:** o anfitrião não edita o herói de outro.
- **L-10 · [proposta] Save carregado em sala.** Cada herói já tem `jogadorId`. Quem
  entra com o mesmo `jogadorId` reassume o seu. Herói cujo jogador não está
  aparece como "*Dara, de Fulano* — **assumir**", e o anfitrião aprova.
- **L-11 · [proposta] Pronto e iniciar.** Todos marcam *pronto*; só o anfitrião
  *inicia*. Dá para iniciar com jogador ausente se o anfitrião o remover ou
  aceitar o piloto automático.
- **L-12 · [proposta]** O anfitrião pode **remover** jogador e **fechar** a sala.
  Sala sem ninguém por 30 min fecha; **o save permanece**.
- **L-13 · [proposta]** Chat de texto e **ping** no mapa. **[aberta]**, fase tardia.

---

## 7. Arquitetura

- **A-01 · [proposta] Anfitrião autoritativo.** O **navegador do anfitrião roda o
  jogo inteiro**, como hoje. Os outros mandam **intenções** (`mover`, `atacar`,
  `conjurar`, `usarItem`, `interagir`, `escolher`, `pronto`, `ping`) e recebem o
  que mudou. O Cloudflare (um **Durable Object por sala**, no mesmo Worker que já
  serve o site) **retransmite e guarda o save**; não conhece regra nenhuma. Ver `D1`.
- **A-02 · [proposta] A porta de narrativa.** `narrar(root, { formato, paginas,
  escolhas })` devolve uma `Promise` com a escolha, e é chamada 214 vezes. A saída
  é **trocar a implementação atrás da mesma assinatura**, sem editar nenhuma das
  214 chamadas: no solo ela mostra a tela local; na sala do anfitrião ela
  **transmite as páginas a todos** e só resolve quando o **líder** responde (ou,
  em painel sem escolha, quando o líder continua). Isto é o que faz o `A-01`
  caber, e é o primeiro pedaço de código a escrever (Fase 1).
- **A-03 · [proposta] O que o cliente recebe.** O `Encounter` não serializa
  (`S-04`), então o cliente **não replica o motor**. Recebe uma **visão da partida**
  (posições, PV, condições, zonas, o mapa) mais o fluxo de eventos que o motor já
  emite (`moved`, `attack`, `spell`, `heal`…), que é o que anima a tela. Ver `D2`.
- **A-04 · [proposta] Reconexão.** `jogadorId` + código da sala; o anfitrião reenvia
  a visão inteira.
- **A-05 · [proposta] Sem predição de movimento.** É cooperativo e a latência
  tolerável; a animação de caminhada esconde o atraso.
- **A-06 · [proposta] Segurança.** O anfitrião é confiável (são amigos). O Durable
  Object só confere que cada mensagem vem do jogador que **diz ser** dono do herói,
  limita tamanho e taxa, e guarda **apenas** o nome de exibição e o save.
- **A-07 · [proposta]** `Math.random` em `rngDaVila` (`phandalin.js`, `conyberry.js`) é
  **inofensivo** com anfitrião autoritativo (só o anfitrião rola), mas **quebraria**
  um modelo de replay determinístico. Fica anotado para `D2`.

- **A-08 · [feito, 2026-10-26] Vista em diferenças.** O anfitrião manda a vista **completa** de tempos em tempos (a cada 20
  publicações e a cada batimento de 3 s) e, entre elas, só os combatentes que **mudaram** (`game/partida-delta.js`). O convidado
  guarda a base; uma diferença que não casa com ela é ignorada até a próxima completa. O servidor guarda só a última completa (é
  o que quem entra recebe) e deixa passar as diferenças em ritmo mais folgado (50 ms) que as completas (200 ms).
- **A-09 · [feito, 2026-10-26] Autosave durante a cena.** Além do save na entrada de cena, o anfitrião manda o save a cada 30 s em
  lugar seguro (explorando, sem texto aberto): se ele cair, quem assume retoma de pouco antes.
- **A-10 · [feito, 2026-10-26] Pré-requisitos da taverna pública.** O **código da sala é sorteado pelo servidor**
  (`POST /api/nova-sala`), no máximo 6 por hora por IP, e conexões demais por minuto de um IP tomam 429 (`worker/limites.js`,
  `LimitadorDO`). Com `CODIGO_DO_SERVIDOR = "1"` (`wrangler.toml`) só abre sala quem pediu o código ao servidor; desligado por
  padrão (desenvolvimento e testes). **Moderação é humana** (seção 15): nada aqui a substitui.

- **A-11 · [feito, 2026-10-26] B1, a taverna pública.** Menu → Multijogador → **Taverna pública** (nome, sem código). O diretório
  (`worker/diretorio.js`, `DiretorioDO`) manda o jogador para a instância **mais cheia que ainda tem vaga** (até 14 para quem chega;
  a lotação é de 16: 8 cores × 2 formas de marcador), ou abre uma nova com código sorteado no servidor (`GET /api/taverna`). Só o
  servidor abre uma taverna pública (`criar` com `publica`, e só com código do diretório). Nela só se anda, fala por **frases
  prontas**, troca de persona e **senta nas 4 mesas de 4 lugares**; herói, pronto e partida são das salas privadas. Quem cai ou
  sai some (as vagas não ficam presas) e o posto de anfitrião passa adiante, sem poderes. O **dono da mesa** (o primeiro a sentar)
  aperta "Abrir a sala": pede um código ao servidor (`POST /api/nova-sala`, 6 por hora por IP), manda `abrir-mesa`, e a mesa toda
  recebe um `convite` e entra sozinha na sala privada, que o dono cria (quem chega antes da sala abrir tenta de novo, 8 vezes).
  Cada instância informa ao diretório quantos jogadores tem. **Não é o degrau B2:** não há contas, texto livre nem moderação.
  Em `game/sala.js` (`publica`, `mesas`, `sentar`, `levantar`, `abrir-mesa`), `worker/*`, `view/taverna-tela.js`, `view/menu-sala.js`.
- **A-12 · [feito, 2026-10-26] Layout da partida em sala.** A barra de cima do convidado tem uma linha (sala, **jogadores** com a
  cor de cada um e ✓ de quem está pronto, e os botões, com os dois descansos num só "Descanso ▾") e uma de **cartões de herói**
  (retrato, dono, vida, o que resta do turno; clicar no seu o seleciona). O anfitrião tem a mesma faixa de jogadores no topo. A
  decisão ("quem decide" ou votação) é uma faixa no pé do pergaminho. O lobby da sala privada usa **duas colunas** (jogadores,
  corda e pendências à esquerda; heróis à direita), e o que falta para iniciar fica à vista.

---

## 8. Regras dentro do jogo

### Exploração

- **J-01 · [requisito]** Cada jogador **move seus heróis livremente**, ao mesmo
  tempo que os outros. O anfitrião aplica as intenções na ordem em que chegam.
- **J-02 · [proposta]** Nada de teletransporte: um clique gera um **caminho**, e o herói
  anda nele na velocidade da animação. Duas pessoas não ocupam a mesma casa; quem
  chegou depois recebe recusa.
- **J-03 · [decidido, 2026-10-26] Corda (`D4`).** Na exploração **cada jogador vai com o
  personagem aonde quiser, e a tela dele o segue**: o padrão é *Livre*. O anfitrião pode
  escolher *Grupo unido* no lobby: um herói só vai para uma casa a até 12 casas de algum
  outro herói ("o grupo se separaria demais"). Feito em `game/corda.js`.
- **J-04 · [proposta]** Os gatilhos da cena (`depoisDeMover`: armadilha, descoberta,
  aviso) disparam **para quem pisou**. O que se descobre (porta secreta, baú) vale
  **para todos**.
- **J-05 · [requisito, aberta] Visão própria (`D3`).** Cada jogador vê o que **os seus
  heróis** enxergam. Recomendação: (a) o que cada um vê *agora* é só dos seus
  heróis; (b) o que **alguém já viu** fica revelado para todos, esmaecido; (c) os
  **aliados aparecem sempre**, para ninguém perder o amigo. **Custo real:** no
  escuro é pequeno (filtrar `visaoDoGrupo` pelo `jogadorId`); **ao ar livre é
  funcionalidade nova**, porque hoje não há névoa de guerra ali.
- **J-06 · [proposta]** Painel de narrativa aberto **pausa** o movimento de todos,
  como no solo. Fica curto de propósito.

### Combate

- **J-10 · [proposta]** Qualquer gatilho começa o combate **para o grupo todo**; cada herói
  fica onde está.
- **J-11 · [proposta] Fase do grupo simultânea.** A iniciativa já é por lado, então todos
  agem **ao mesmo tempo**, cada um com os seus heróis, em qualquer ordem. Ninguém
  espera a vez de outro.
- **J-12 · [aberta] Fim da fase (`D6`).** Acaba quando todos terminam, ou no **tempo
  limite** (sugestão: 120 s; o anfitrião pode desligar). Quem não agiu **passa**.
- **J-13 · [proposta] Reações continuam automáticas, como hoje.** O ataque de
  oportunidade dispara sozinho antes de o alvo sair do alcance, e Queda Suave e
  Contramágica são conjuradas pelo motor sem perguntar [medido]. Perguntar ao
  jogador seria uma regra nova **também no solo** (`P3`, `P4`), então fica como
  melhoria futura **[aberta]**: pergunta ao jogador do herói, com 8 s, e sem
  resposta não reage.
- **J-14 · [proposta] Ações concorrentes** valem pela ordem em que chegam ao anfitrião.
  A segunda vê o estado já atualizado e, se ficou inválida (o alvo morreu), é
  recusada com mensagem.
- **J-15 · [proposta]** Na fase dos inimigos o anfitrião roda a IA e todos assistem.
- **J-16 · [proposta]** Herói caído segue as regras de hoje (teste de morte); seu jogador
  vira espectador do mapa. **Derrota** (todos caídos): tela de derrota, e o anfitrião
  escolhe *carregar o último save* ou *sair*.

### Narrativa

- **J-07 · [decidido, 2026-10-26] Quem controla quem.** Cada jogador controla **um** herói. O **anfitrião** só
  controla o dele, mais os que **sobram** quando há menos de quatro jogadores (os que nenhum outro pegou). Os heróis de quem
  caiu ficam no piloto automático até a pessoa voltar.
- **J-09 · [decidido, 2026-10-26] Paridade.** **Tudo o que o anfitrião vê e faz dentro da aventura, os convidados também veem e
  fazem; nada é exclusivo do anfitrião, exceto SALVAR a aventura.** O anfitrião só roda o jogo (A-01): o que ele tem a mais é
  técnico, não de poder. Cada funcionalidade nova nasce com o lado do convidado, e o que ainda só o anfitrião faz é dívida
  (lista na auditoria do final desta seção, a manter).
- **J-09a · [feito, 2026-10-26] Auditoria da paridade.** O que o convidado já faz, igual ao anfitrião:
  - **Interagir** (botão direito numa casa): o convidado pede, o anfitrião monta o menu **para o herói dele** (`game/interacoes.js`,
    `main.js: contextoDeFora`) e o devolve só a ele pela porta da narrativa (`contexto-abrir`); a escolha volta pelo número da opção.
    Ficha e seleção acontecem na tela de quem clicou (`local`). Magia com escolha de opção vai pela barra.
  - **Magias de utilidade** (menu, barra de magias) e as perguntas delas: a narrativa vai a todos e responde o dono do herói.
  - **Subir de nível:** cada jogador escolhe as magias do **seu** herói na própria tela, em paralelo (`view/nivel-tela.js`,
    `definirPortaDeNivel`); sem resposta em 2 min valem as sugeridas. **Preparar magia** pela ficha (`prepararDeFora`).
  - **Descanso curto e longo:** qualquer jogador pede, o grupo vota. No curto cada um gasta os dados do **seu** herói numa tabela
    que todos veem (`telaDoDescansoRemoto`); o anfitrião espera os "prontos" (até 2 min).
  - **Dormir, Acampar** e os outros botões da vila e da região: o jogador pede (`vila-acao`), o anfitrião roda, as escolhas
    dele são votadas.
  - **Páginas de texto:** qualquer jogador vira a última página e a cena segue. **Diário, missões e Registro** (rolagens e
    acontecimentos) vão na vista. **Alfinete** no mapa (Alt+clique) e **"Pronto para sair"** (a decisão de saída mostra quem está).
  - **Entrar com a partida em andamento:** fica com o herói que sobrava do anfitrião, ou só assiste (`heroiQueSobra`).
  - **Sem dívida de paridade.** Os mantimentos da estrada (meia ração) e a escolha do acampamento (lugar, fogo, vigia) são decisões
    **do grupo**, não de um herói: no solo já são uma tela só, e na sala vão a votação (J-20), igual para todos. O Registro do
    convidado guarda só o que chegou depois que ele entrou.
- **J-08 · [decidido, 2026-10-26] Loja, ficha e descanso.** Na loja cada jogador compra e vende **para o seu herói** (o
  dinheiro é do grupo); na ficha, cada um equipa e usa itens do seu herói. **Qualquer jogador pode pedir um descanso
  rápido**: o grupo vota (e quem não é o anfitrião gasta os dados de vida sugeridos). Feito em `view/loja.js`
  (`definirPortaDaLoja`), `main.js` (`lojaDaSala`, `negociarDeFora`, `equiparDeFora`, `pedirDescanso`).
- **J-20 · [decidido, 2026-10-26] Quem decide (`D5`), como no Baldur's Gate 3.** O diálogo
  ou a cena que um **personagem** começou é decidido pelo **jogador que controla esse
  personagem**; os outros leem as mesmas escolhas, sem poder clicar. Uma **decisão geral**,
  que não é de nenhum personagem, vai a **votação** entre os jogadores presentes: vence a
  maioria; no empate vale o voto do líder; sem voto, a primeira opção livre. Quem sobrou
  sozinho decide sem votar, e se o dono do personagem não responde o anfitrião pode decidir
  no lugar dele (após 60 s). Na **vila e na região**, o destino também é votado e o grupo vai
  **junto**. Feito em `game/decisao.js`, `main.js` (`abrirDecisao`, `votarLugar`) e
  `view/partida-tela.js`.
- **J-21 · [proposta]** Teste de perícia: rola o **herói que interagiu**.
- **J-22 · [proposta]** *Ajudar* (a ação do livro) entre jogadores: um herói dá vantagem
  ao teste de outro. Fase tardia.

### Vila, loja, descanso, viagem

- **J-30 · [proposta]** A bolsa de moedas é do **grupo** (já é). Cada jogador compra **para
  o próprio herói**; o anfitrião pode ligar *gasto com aprovação do líder*.
- **J-31 · [proposta]** **Descanso** só quando todos marcam *pronto*.
- **J-32 · [proposta]** **Viagem** (`game/regiao.js`: ritmo, mantimentos): o líder escolhe
  destino e ritmo; os mantimentos são do grupo.
- **J-33 · [proposta]** **Subir de nível:** cada um na sua tela, em paralelo; a cena segue
  quando todos confirmam, ou o líder força depois de 60 s.

### Conexão

- **J-40 · [proposta]** Jogador cai: seus heróis vão para **piloto automático** e voltam
  quando ele reconectar, **no começo da próxima fase**, nunca no meio de uma ação.
- **J-41 · [proposta]** Anfitrião cai: a sala **espera 10 min**. Qualquer jogador pode
  **assumir** carregando o último save da nuvem. Combate em curso **recomeça da
  cena** (`S-04`).
- **J-42 · [proposta]** Jogador sai de vez: seus heróis ficam em piloto automático até o
  anfitrião reatribuir.

---

## 9. Ordem de construção

Cada fase entrega algo que se joga, e nenhuma depende de acertar a seguinte.

| Fase | O que entra | Pronto quando |
|---|---|---|
| **F0** | Save e carregar, **solo** (`S-01`…`S-12`). O "Continuar" passa a funcionar | fechar a aba, abrir, continuar de onde parou; teste de ida e volta de cada cena |
| **F1** | **Porta de narrativa** (`A-02`), sem mudar o comportamento | os testes de hoje passam sem editar nenhuma das 214 chamadas |
| **F2** | **Lobby de tela**: criar, entrar, escolher herói, pronto, iniciar. Durable Object de retransmissão. **Sem jogo sincronizado**. É o plano B e a base da mesa de grupo | duas abas, dois jogadores, cada um pega um herói |
| **F3** | **A taverna andável da sala privada** (B0): a cena, os avatares com persona e marcador, o Toblen como menu, a mesa de grupo (`T-01`…`T-17`). É a **primeira sincronização de movimento**, e por isso antecipa o que antes era a exploração | dois jogadores andam pela taverna, conversam por emotes, sentam à mesa, formam o grupo e saem para a aventura |
| **F4** | Exploração sincronizada nas masmorras, com a visão de cada um | dois jogadores andam ao mesmo tempo e veem coisas diferentes |
| **F5** | Combate sincronizado (fase do grupo simultânea, reações) | uma luta inteira com 2 e com 4 jogadores |
| **F6** | Vila, loja, descanso, viagem, reconexão, troca de anfitrião, piloto automático | derrubar o anfitrião no meio e retomar |

### A escada até o B3

O B3 é o **destino**; os degraus abaixo são o caminho e cada um tem um **portão**:
só se avança quando o anterior mostra sinal. Os degraus não são tecnicamente
obrigatórios (ver `D7`), mas cada um reduz o risco do seguinte.

| Degrau | O que é | Contas | Texto livre | Portão para o próximo |
|---|---|---|---|---|
| **B0** | Taverna da **sala privada** (F3). Só amigos, por código | não | só emotes | a sala privada funciona e tem jogadores de verdade |
| **B1** | Taverna **pública para convidados**: instâncias, persona, marcador, emotes. Sem texto livre | não (convidado) | **não** | sinal de uso e custo medido (`D7`); quantos jogadores simultâneos [aberta] |
| **B2** | **Contas** (`C-01`…`C-09`), texto livre com denunciar e silenciar, banimento, painel mínimo (`X-01`…`X-08`) | **sim** | sim, moderado | moderação funcionando e alguém responsável por ela (`X-04`); **`D1` reaberta** |
| **B3** | **Quadro de grupos abertos**, entrar por aprovação, mesas públicas, NPCs frequentadores (`T-08`, `T-15`) | sim | sim | — (**destino**) |

**Como testar sem navegador.** O motor roda em Node, e as intenções são mensagens
simples: dá para escrever um **anfitrião e clientes falsos** que trocam mensagens
em memória e conferem, por exemplo, que *o jogador B não consegue mover o herói
do jogador A* (`P2`).

---

## 10. Decisões em aberto

| | Decisão | Recomendação |
|---|---|---|
| **D1** | **Autoridade.** (a) anfitrião roda o jogo e o Cloudflare retransmite; (b) servidor roda o jogo, como diz o README | **(a)**, com a porta de narrativa (`A-02`). (b) pede reescrever ~10 mil linhas de cenas; (a) deixa (b) possível depois sem refazer as cenas. Perde-se a garantia "sem trapaça por construção", o que importa pouco em jogo cooperativo entre amigos |
| **D2** | **Como o cliente sabe o estado.** (a) visão da partida + eventos; (b) todos rodam o jogo com a mesma semente e as mesmas intenções (replay) | **(a)**. O RNG semeado torna (b) tentador, mas o replay exige determinismo total e `A-07` mostra duas exceções |
| **D3** | **Visão.** (a) só o que os seus heróis veem; (b) o grupo todo vê tudo; (c) própria + memória compartilhada + aliados sempre visíveis | **(c)**, com o aviso de que ao ar livre é funcionalidade nova |
| **D4** | **Corda.** *Unido*, *Livre* ou escolha do anfitrião | **Decidido:** padrão *Livre* (cada um vai aonde quiser, e a tela o segue); *Unido* por escolha do anfitrião |
| **D5** | **Narrativa.** Líder decide, ou votação | **Decidido (como no Baldur's Gate 3):** o jogador do personagem que começou a cena decide; decisão geral, votação; vila e região, votação e o grupo vai junto |
| **D6** | **Tempo da fase do grupo** e heróis por jogador | **120 s**, desligável; **grupo de 4** com a distribuição de `L-07` |
| **D7** | **Os degraus B1 e B2 são obrigatórios?** (a) sim, como portões; (b) pular o B1 e ir ao B3 **enxuto**: quadro de grupos abertos sem andar, sem texto livre, só opções prontas, anfitrião aprova quem entra | **(a)**. O B1 custa pouco depois do B0 e responde se alguém vem, quanto custa e que abuso aparece, **antes** de aceitar contas e moderação. (b) existe como atalho para o "chamar outros", com limite: sem conta, quem é expulso volta com outro navegador, e o quadro **fica vazio** quando há pouca gente |
| **D8** | **Login.** (a) Google e Discord; (b) só Google; (c) e-mail sem senha (link mágico); (d) senha própria | **(a)**. Discord combina com quem joga RPG, e nenhum guarda senha sua. **(d) não**: ver `C-02` |
| **D9** | **Quem modera, idade mínima e quanto tempo se guarda o chat** | **Aberta e a mais séria da escada.** Hoje o único moderador possível é o autor, e é tempo contínuo. Idade mínima e retenção pedem consulta jurídica (`C-07`) |
| **D10** | **Onde guardar as contas.** (a) banco D1 do Cloudflare; (b) Durable Object | **Decidir medindo**, no B2. O banco D1 grátis dá 5 milhões de leituras e 100 mil escritas por dia, e desde 2026-09-01 **a consulta falha** ao estourar |

> **`D1` será reaberta antes do B3.** A recomendação (anfitrião autoritativo) foi
> dada porque o anfitrião é **confiável entre amigos**. Com **estranhos** (B3) ele
> pode atrapalhar de propósito (expulsar, decidir sozinho, abandonar), e a
> garantia "sem trapaça por construção" do servidor autoritativo volta a pesar
> (`X-08`).

---

## 11. Riscos conhecidos

- **~10 mil linhas de cenas presas à interface** (medido). Mitigado por `A-02`; é o maior risco do projeto.
- **Estado do combate não serializa** (`S-04`). Mitigado por salvar só entre cenas.
- **Névoa de guerra ao ar livre não existe** (`J-05`). Se for cara demais, o plano B é visão compartilhada ao ar livre e própria só no escuro.
- **Limites do plano gratuito do Cloudflare** [conferido na documentação em 2026-10-26]: Workers e Durable Objects têm **100 mil requisições por dia**; Workers dão **10 ms de CPU por requisição**; Durable Objects dão 13.000 GB-s por dia e 5 GB de armazenamento. **Não achei o limite de conexões WebSocket do plano grátis**, e a página dos Durable Objects que li tinha ~5 meses: **a verificar** antes de apostar. Para a sala privada deve sobrar; para uma taverna pública com 16 por instância, **não está provado**.
- **Moderação (B2 e B3)** é trabalho humano contínuo, não de código (`D9`, `X-04`). É o maior custo da escada e o único que não some com mais engenharia.
- **Lei e privacidade (B2)**: conta guarda dado pessoal, e a LGPD se aplica, inclusive a menores, que num jogo de RPG com chat são prováveis (`C-07`). Isto não é aconselhamento jurídico.
- **Massa crítica (B1 a B3)**: taverna vazia é pior que nenhuma. Os NPCs frequentadores (`T-15`) amenizam, mas **não criam jogadores**.
- **Estranhos com anfitrião autoritativo (B3)**: `D1` e `X-08`.
- **Arte da taverna** depende de gerações do PixelLab e de aprovação (`T-16`), e do atlas de cenário, que é de **outra sessão**.
- **Piloto automático** depende de promover `playCharacter` (hoje em `dev/`) e de ele jogar bem fora do encontro padrão em que foi medido.
- **Ordem das intenções.** Duas ações no mesmo instante: vale a ordem de chegada ao anfitrião (`J-14`).
- **Política de Conteúdo de Fã da WotC:** o jogo precisa continuar gratuito (ver `NOTICE.md`). Sala, save e lobby não mudam isso; **qualquer cobrança por sala ou servidor mudaria**.

---

## 12. Fora de escopo, por enquanto

Voz · espectadores · proteção contra trapaça (**pesa mais com estranhos**, ver
`D1`) · celular · pagamentos de qualquer tipo (o jogo precisa continuar
gratuito, ver `NOTICE.md`).

**Saíram do "fora de escopo"** com a decisão pelo B3, mas **só entram nos degraus
indicados**: contas e login (B2), lista pública de salas e quadro de grupos
(B3), save pessoal na nuvem entre dispositivos (consequência das contas,
`C-09`).

---

## 13. A taverna

A taverna é o lobby social. É uma **cena de exploração** (o mesmo `Board` e
`Battlefield` das masmorras), **sem combate e sem regra de D&D ativa**, onde cada
jogador anda com **um** avatar. Na taverna o jogador controla **um** personagem;
os 1 a 4 heróis só existem dentro da aventura (`L-07`).

- **T-01 · [decidido]** O lobby do multijogador é uma **taverna andável**: os
  jogadores se encontram, conversam e chamam outros para uma aventura.
- **T-02 · [decidido]** A **persona** é **um dos heróis que já existem**. Hoje têm
  **arte final do PixelLab 7 dos 12**: Dara, Torvik, Grask, Brenn, Pip, Corin e
  Ilvan [medido]. **[proposta]** Os outros 5 (Maren, Vesh, Selane, Sylwen e
  Lirra) entram na lista quando ganharem folha; o look provisório pintado por
  código **não aparece** na taverna pública, porque destoaria.
- **T-03 · [proposta] A persona vira o herói ao sentar.** Ao sentar numa mesa de
  grupo e pegar um herói (`L-06`), o avatar passa a ser **aquele herói**, com a
  arma e a armadura que ele tem; ao levantar, volta à persona. Assim a
  unicidade mora só **dentro do grupo**, e a taverna aguenta qualquer lotação.
  **No B0** (sala de amigos) o avatar já **é** o herói que se vai jogar.
- **T-04 · [proposta] Equipamento cosmético** (fase posterior): armadura e arma
  entre as folhas já desenhadas. Há **120 folhas** nos 7 heróis (a Dara tem 36, o
  Torvik 21, o Grask 20), e o jogo já escolhe a folha pelo equipamento
  (`aplicarAparencia`, chave `herói@armadura-arma`). Algumas do Grask são o estado
  de fúria, e não equipamento. **Custo de arte: zero.**
- **T-05 · [proposta] Assinatura legível.** O que se vê **de longe** e **de perto**
  não é a mesma coisa:

  | Camada | Lê de longe? | Custo |
  |---|---|---|
  | Silhueta (o herói-base: halfling, draconata, anão) | sim | zero |
  | **Marcador no chão** (cor e forma, **atribuído pela instância**) | **sim, o melhor** | só código |
  | Equipamento (`T-04`) | de perto | zero de arte |
  | Placa do nome e título | de perto | só código |
  | Cor da figura (skins por paleta, já planejadas) | sim | quando o sistema existir |

  O marcador é **atribuído**, e não escolhido, para dois jogadores nunca terem o
  mesmo (8 cores × 2 formas = 16, cobre uma instância cheia, e a forma ajuda quem
  não distingue cores). Quem controla um avatar vê uma **seta** sobre ele.
- **T-06 · [proposta]** O **nome é único por instância**: o segundo "Gandalf" vira
  "Gandalf (2)". Duas pessoas podem ter a mesma figura; **nunca o mesmo nome nem
  o mesmo marcador**.
- **T-07 · [proposta] Mesa de grupo.** Mesas de **4 lugares**. Sentar abre o lobby
  do grupo (`L-05`…`L-11`, `M-02`): escolher o herói, preparar, marcar *pronto*.
  Quando o anfitrião da mesa inicia, o grupo sai da taverna para a aventura (uma
  sala privada com o seu save). **[aberta]** Ao terminar, o grupo volta à **mesma
  instância**, ou a uma instância nova?
- **T-08 · [decidido o destino; proposta o detalhe] Quadro de grupos abertos (B3).**
  Uma lista de mesas com vagas, aventura, capítulo e idioma, **só com opções
  prontas** (sem texto livre). **Entrar é pedir**, e o **anfitrião aprova**.
- **T-09 · [proposta] O Toblen é o menu em forma de personagem.** O **Quadro de
  aventuras** escolhe a aventura de uma campanha nova; o **Livro de saves**
  carrega uma campanha; o **balcão** dá ajuda. Hoje o Toblen existe só como
  diálogo (`rules/npcs.js`) e como `look` pintado por código em
  `art/looks/npcs.js`, **sem folha do PixelLab**: o sprite é arte nova (`T-16`).
- **T-10 · [proposta] Instâncias.** Até **~16 jogadores** por cópia da taverna
  (valor a ajustar depois de medir). Quando enche, abre outra; o jogador pode
  **trocar de taverna**; amigos entram na mesma por link ou código.
- **T-11 · [proposta] Espaço seguro.** Sem combate, sem dano, sem efeito de regra.
  Movimento por caminho, como `J-02`, com **taxa limitada** e interpolação no
  cliente.
- **T-12 · [requisito] Reaproveitável em campanha.** A mesma cena serve de
  **Estalagem Stonehill** na campanha solo, com o Toblen e os rumores que já
  existem em `game/phandalin.js`. Isto é `P4` aplicado: solo é uma taverna de um
  jogador.
- **T-13 · [proposta] Luz.** Lareira e lampiões são **fontes de luz declaradas como
  dados**; o motor já calcula a luz e desenha o brilho quente de braseiros e
  tochas. **Não é trabalho do PixelLab.** A taverna fica toda visível, sem névoa de
  guerra, o que a isenta do custo de `D3` ao ar livre.
- **T-14 · [proposta] Conversa.** B1: **emotes e frases prontas**. Texto livre só a
  partir do B2 (`X-02`), em **balões** sobre a cabeça.
- **T-15 · [proposta] NPCs frequentadores (B3).** Reaproveitam as folhas de NPC que
  já existem (Sildar, Nilsa, Mirna, Reidoth, Nars, o sacerdote…), com uma marca
  visual **distinta** da dos jogadores, e contam os **rumores** da estalagem.
  Dão vida à taverna quando há pouca gente, mas **não criam jogadores**.
- **T-16 · [proposta] Arte nova.** Inventário:
  - **Já existe** no atlas de cenário (1 desenho cada): `mesa`, `mesaBanquete`,
    `braseiro`, `bau`, `leito`, `mantimentos` (barris), `taverna` (a fachada) e 10
    quadros de `decorParede`.
  - **É novo:** balcão do bar, banquinhos, lareira, **quadro de avisos** (a peça
    que escolhe a aventura), barril de cerveja, prateleira, escada, lampião,
    tapete, porta, piso de tábuas e **o sprite do Toblen**.
  - **Coordenação:** o atlas (`art/folhas/cenario.*`, montado por
    `dev/montar-cenario.py`) é da **sessão do Cenário**, e as regras do projeto
    proíbem mexer em `art/folhas/`. A arte entra pelo pipeline dela.
- **T-17 · [proposta] Precedente técnico.** O fundo do menu (`view/menu-fundo.js`) já
  monta um `Encounter` **sem inimigos** e deixa o `Board` desenhá-lo. Os avatares
  da taverna são o mesmo: personagens sem uso de combate.

---

## 14. Contas e identidade

- **C-01 · [proposta]** A **sala privada** (B0) e a **taverna aberta a convidados**
  (B1) **não exigem conta**. O **B2** introduz contas, e elas passam a ser
  necessárias para **texto livre**, para o **quadro de grupos** e para o **save
  na nuvem**.
- **C-02 · [proposta] Login com Google e Discord. Sem senha própria.** Motivos
  conferidos na documentação do Cloudflare em 2026-10-26: o plano grátis dos
  Workers dá **10 ms de CPU por requisição**, e o WebCrypto só traz PBKDF2. As
  fontes **divergem** sobre as iterações viáveis (uma fala em ~20 a 80 mil dentro
  de 10 ms; um tutorial usa 600 mil), e scrypt e Argon2 **não são nativos**. Fora
  isso, senha própria traz e-mail de verificação e de recuperação, risco de
  vazamento e ataques por lista de senhas, e **a responsabilidade é sua**.
  **[aberta]** O autor **ainda não escolheu** o método (`D8`).
- **C-03 · [proposta] Guardar o mínimo:** o identificador estável do provedor,
  nome de exibição, persona, estado de banimento e datas. **E-mail só se for
  necessário** para contato.
- **C-04 · [proposta]** O `jogadorId` é **opaco** e pode ser **ligado a uma conta**
  depois: o convidado vincula e **não perde o herói**.
- **C-05 · [proposta]** Sessão por **cookie** `HttpOnly` e `SameSite`; o WebSocket
  se autentica com um token de vida curta.
- **C-06 · [aberta]** Onde guardar as contas: **banco D1** ou Durable Object (`D10`).
- **C-07 · [aberta]** **LGPD:** política de privacidade, termos de uso, exclusão de
  conta, **idade mínima e menores**. Consultar um profissional jurídico antes de
  abrir o B2.
- **C-08 · [aberta]** Proteção contra cadastro em massa (o Turnstile do
  Cloudflare é candidato; **a gratuidade não foi conferida**).
- **C-09 · [proposta]** A conta traz de bônus o **save na nuvem entre dispositivos**
  (`S-11`).

---

## 15. Moderação

- **X-01 · [proposta] B1:** só **emotes e frases prontas**. Nome de exibição limitado
  (sem espaços extremos, sem símbolos), e único (`T-06`).
- **X-02 · [proposta] B2: texto livre** com **denunciar, silenciar, bloquear**, filtro de
  palavras, limite de taxa, **links desativados** e balões sem histórico.
- **X-03 · [proposta]** Um **painel mínimo**: ver denúncias, banir conta, apagar nome,
  silenciar por tempo.
- **X-04 · [aberta] Quem modera?** Hoje, só o autor, e isso é **tempo contínuo**. É a
  decisão mais séria da escada (`D9`).
- **X-05 · [proposta]** Nomes passam por filtro e não podem imitar o de moderadores.
- **X-06 · [aberta]** **Retenção** dos registros de chat: sugestão de prazo curto
  (7 dias), a validar com `C-07`.
- **X-07 · [proposta] Banimento** por **conta** (Google ou Discord) e por **sala** (o
  anfitrião expulsa, e a pessoa fica na lista da sala).
- **X-08 · [proposta] Estranhos em aventura (B3).** `A-06` supõe um anfitrião
  confiável. Com estranhos, **reabrir `D1`** e, no mínimo, fazer o Durable Object
  conferir o que dá sem rodar o jogo: quem é dono de qual herói, alcance e
  limites de taxa, e permitir que o grupo **saia sem perder o herói** se o
  anfitrião abandonar.
