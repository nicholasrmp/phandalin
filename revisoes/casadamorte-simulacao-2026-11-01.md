# Casa da Morte: simulação de jogadores no motor (Node, sem navegador) — 2026-11-01

Nenhum arquivo do jogo foi alterado. Os scripts de simulação estão em
`C:\Users\Niczin\AppData\Local\Temp\claude\C--Users-Niczin-Downloads-Phandalin\2ecdb2a3-a125-4712-a294-5b08db111c3a\scratchpad\sim\`
(`lib.mjs`, `lib2.mjs`, `campanha.mjs`, `s1-estrutura.mjs`, `s-combates.mjs`, `s-finais.mjs`, `s-foice.mjs`, `s-probs.mjs`,
`s-escuro.mjs`, `s-alcapao.mjs`, `s-uso.mjs`, `t4.mjs`, `t5.mjs`, `t6.mjs`, `t11.mjs`, `t12.mjs`, `t13.mjs`). Rodar:
`<sim>\run.sh campanha.mjs` (com `GOD=1` para os heróis sobreviverem à campanha inteira; `ATE=1..5` para parar num andar).
`run.sh` usa um carregador próprio (`register2.mjs`) igual ao `cena-node/register.mjs`, mas com a subida de nível aplicada de verdade
(`subirUmNivel`), porque o stub do projeto devolve `[]` e o herói nunca passava ao 2º nível.

Base: o grupo real da campanha (`montarHeroi` de Dara, Pip, Brenn, Ilvan, nível 1; ao passar pelos marcos, 2 e 3), a cena de verdade
(`criarCasaDaMorte`), o pathfinder de `core/grid.js` (`reachableFor` + `moveAlong`, 60 pés por clique), o menu direito real
(`opcoesDaCasa` + `cena.interacoes`), a IA de combate (`dev/cena-node/jogador.mjs` e `rules/ai.js`). `testes-casadamorte.mjs`: 27/27 antes e depois.

## (a) O que foi simulado e se passou

| # | Simulação | Resultado |
|---|---|---|
| 1 | Clareira (3,13) → portão (aresta aberta, sem folha) → pórtico → sala de espera → salão | passou: 4 + 3 + 4 cliques (um por herói, 60 pés por clique). Portão e portas da casa são arcos abertos (0 cliques para abrir). Só existe uma porta fechada em todo o jogo (a do quarto 20) |
| 2 | Todos os cômodos do térreo (espera, salão, jantar, vestíbulo, cozinha, despensa, canil) | passou, com ressalva: o **vestiário 2B** não tem nenhuma casa livre (prop) e o texto dele nunca aparece (ver B1) |
| 3 | Varredura de TODAS as opções do botão direito do térreo (48 distintas: painéis, exame de 9 pontos, armário do canil com as ferramentas do Pip) | passou |
| 4 | 2º andar: salão superior, biblioteca, empregados, conservatório; gaveta (chave), estante (Percepção 13), sala secreta, carta, baú, livros | passou; carta dá escada + 2º nível a todos (300 XP) |
| 5 | Escadas 1→2, 2→3 (a pé: 0 cliques de mover, 2 de menu) | passou |
| 6 | 3º andar: todas as salas, joias, espelho, berço, varanda (Percepção 15), poço da escada | passou até o poço |
| 7 | **3º andar → sótão (escada secreta)** | **FALHOU** — a opção "Subir a escada secreta" nunca aparece (problema C1) |
| 8 | Sótão (com o workaround em memória do C1): salas, porta do 20 (chave), brinquedos, Rose e Thorn (conversa), ossos, casa de bonecas, restos da babá | passou |
| 9 | Escada em espiral do sótão → masmorra 1 | passou (opção oferecida; chegada em 22,2) |
| 10 | Masmorra 1: 4 lajes (Atletismo 15, um por herói), baús A..E, ossos de Rose/Thorn (paz e Inspiração), poço de espinhos, esfera/estátua, porta secreta leste (Percepção 10), tochas, caixa dos líderes | passou |
| 11 | Alçapão: masmorra → canil (subir), canil → masmorra (descer), `alcapaoCanil` | passou, mas um herói nasce dentro de móvel (A3) |
| 12 | Masmorra 1 → 2; ponte (Atletismo 20 e roda), porta da prisão (Percepção 15), relicário, monte de Lorghoth, ritual | passou; 1890/1890 casas livres alcançadas |
| 13 | Final A: sacrifício (com e sem paz das crianças) e volta pelos 6 andares até a estrada, possessão e intimidação, 3º nível | passou (3 mover + 6 dir + 6 menu + 2..12 texto) |
| 14 | Final B: culto negado, Lorghoth, a casa ataca (foices, fumaça), descida a pé | passou; achados A4 e (balanceamento) |
| 15 | Final C: sair sem resolver o culto | passou (brumas fecham o portão) |
| 16 | Cobertura das pistas: 112/115 verbos e passivas resolvidos (as 3 passivas que faltam exigem Percepção passiva maior que 13) | passou |
| 17 | Combates (13 gatilhos reais x 8 sementes, grupo nível 2): nenhum inimigo sem caminho, nenhum herói sem caminho, nenhum combate travado | passou (ver tabela de balanceamento) |
| 18 | Escuro da masmorra: sem tocha a casa do baú vira "Escuridão / Olhar"; com tocha oferece "Abrir o baú trancado" | passou (regra funciona) |

### Combates (8 sementes, nível 2, gatilho real; sem trapaça de PV)

| Combate | V / D | rodadas (média) | PV do grupo no fim |
|---|---|---|---|
| armadura animada (11) | 8 / 0 | 1,6 | 97% |
| vassoura animada (14) | 8 / 0 | 1,8 | 99% |
| espectro da babá, berçário (15B) | 8 / 0 | 2,0 | 94% |
| espectro da babá, baú do sótão (18) | 8 / 0 | 3,0 | 74% |
| Rose e Thorn atacadas (20) | 3 / 5 | 5,8 | 7% |
| centopeias (23D) | 8 / 0 | 2,6 | 77% |
| grick (28) | 8 / 0 | 3,8 | 82% |
| quatro carniçais (29) | 5 / 3 | 6,8 | 37% |
| cinco sombras (31) | 2 / 6 | 5,5 | 3% |
| mímico (33) | 8 / 0 | 7,5 | 81% |
| dois lívidos (34) | 8 / 0 | 6,3 | 69% |
| Lorghoth, culto negado (38) | **0 / 8** | 14,9 | 0% |
| Lorghoth atacado dormindo (surpresa nossa) | 8 / 0 | 8,1 | 68% |

Em nenhum caso houve `travou`, `foesSemCaminho` ou `heroisSemCaminho`. Os avisos "inerte" (Brenn, 4 turnos sem agir nas sombras e nos carniçais) são
limitação da política `jogador.mjs` do clérigo, não do jogo.

## (b) Problemas por gravidade

### CRÍTICA

**C1. 3º andar → sótão é impossível: a escada secreta nunca é oferecida no botão direito.**
- Reproduzir: `run.sh t6.mjs` (menu real em (4,8), (5,8), (6,8): só "Abrir a ficha, Poção…"), `run.sh t4.mjs` (tabela de todas as escadas:
  `casaDaMorte3 Subir a escada secreta … 4,8:escada/SEM_AREA/NAO`), ou `ATE=3 run.sh campanha.mjs` (registra o problema).
- Causa: as casas do poço (`ESCADA_SECRETA_3` = 4..6,8, sala `poco`) e a `sacadaSul` não pertencem a nenhuma `area` de `AREAS_TERCEIRO`
  (`t5.mjs`: "casaDaMorte3 poco[3]: 4,8 5,8 6,8 || sacadaSul[4]"). Em `capitulo-casadamorte.js:304` `interacoes()` faz
  `if (!area) { poraoInteracoes(...); return ops; }` e devolve antes do bloco das escadas (L428-442).
- Consequência: sem o sótão não há espiral, nem masmorras, nem Rose/Thorn, nem o 3º nível; o alçapão do canil só aparece "depois de visto de baixo" (circular).
  A aventura trava no 3º andar. O `testes-casadamorte.mjs` só testa 2→3.
- Correção: (1) em `casadamorte-alto.js` acrescentar `criarArea({ id: 'poco', area: '21', nome: 'A escada secreta', cel: [[3,7,5,7]], texto: [...] })`
  e uma área para `sacadaSul` `[[0,9,1,10]]`; (2) para não repetir a classe de erro, no `capitulo-casadamorte.js` mover o bloco das escadas para antes do
  `if (!area)` (ou fazer o ramo `!area` também empurrar as escadas); (3) teste: para cada `ANDARES[v].escadas`, com `escada/alcapao/portaCriancas`
  verdadeiros, afirmar que existe uma casa do `rect` onde `cena.interacoes` devolve `e.rotulo` (é o `t4.mjs`).

### ALTA

**A1. Trava probabilística na biblioteca (4,1% do grupo padrão).** "Procurar uma passagem nas estantes": Percepção CD 13, uma tentativa por herói
(`buscas.ja`, nunca `limpar`), bônus +3 nos quatro → P(ninguém passa) = 4,1% (`s-probs.mjs`). Sem a passagem não há carta, escada, 2º nível, sótão nem
masmorra. A Percepção passiva do grupo é 13 (10 + 3): a regra do próprio jogo (`pistasPassivas`) poderia abrir a estante sozinha ao entrar na biblioteca.
Arquivo: `capitulo-casadamorte.js` L367. Correção: tratar como passiva (CD 13 ≤ 13) e/ou `buscas.limpar('passagem')` depois de um descanso curto.

**A2. Trava probabilística na masmorra 2 (5,8% do grupo padrão; 63% só a ponte falha).** Chegar à câmara exige a ponte (Atletismo CD 20: Dara 30%, Brenn 10%,
Pip e Ilvan 0%) ou a porta da prisão (Percepção CD 15, 45% cada). A roda que baixa a ponte fica do OUTRO lado. Se os dois falham, o ritual nunca roda, `fim` nunca é
definido e o portão da casa não abre. `casadamorte-porao-cena.js` L448 (ponte) e L432 (prisão). Correção: dar ao Pé de Cabra (o Pip tem) vantagem na ponte, como
já se faz nas lajes (`algumTem('pedeCabra')`), e/ou aceitar "ajuda" ou nova tentativa depois de descanso.

**A3. "Tentar de novo" depois de um grupo caído apaga a campanha e troca os heróis.** `capitulo-casadamorte.js:283`:
`app.newEncounter({ ...config, continuarCom: null })`. Capturado em `t12.mjs`: `{"variante":"casaDaMortePorao2","modo":"campanha","aventura":"cos","entrada":"casaDaMortePorao1","continuarCom":null}`.
Em `main.js` (~L533-542) `continuarCom` nulo e sem `config.herois` cai em `makeParty({ nivel: config.nivel ?? 2 })` e executa `this.campanha = {}`: o jogador volta ao andar com o
grupo padrão do jogo e sem `escada`, `ponte`, `fim`, vencidos… Correção: guardar o grupo/estado do início da cena (ou do último ponto de save) e reentrar com `continuarCom` e `campanha` restaurados.

### MÉDIA

**M1. As escadas não exigem proximidade.** `capitulo-casadamorte.js:435` `motivo: null`. Da clareira de fora (grupo em 3,13), botão direito em qualquer casa da escadaria (5,6) → "Subir a escadaria de mármore"
leva o grupo ao 2º andar (`run.sh c1-terreo.mjs`; também vale para o alçapão, a espiral e as outras). Pula portão, portas e gatilhos (as foices da volta só valem no térreo). Correção: `motivo: ctx.longe(c, centroDaEscada, 10)` ou auto-andar até a escada.

**M2. Foice de porta: o estado `ondeEstava` nasce antes da chegada e a regra só olha o início e o fim do clique.** `casadamorte-fuga.js:32` calcula `ondeEstava` com as posições de `mapa.grupo`
(antes de `iniciar()` mover o grupo para `chegadas`). Medido em `s-foice.mjs` (fúria ligada): 3º andar chegando do sótão, 1 passo dentro da MESMA sala (suíte da babá) dispara a foice (sem porta nenhuma);
no sótão a volta a pé até a escada deu 4 foices (uma por herói) e no 3º andar zero, embora atravesse portas. Um clique de 60 pés que cruza duas portas conta no máximo uma. Correção: inicializar `ondeEstava` em `aoChegar` (depois do `chegada`)
e contar as portas pelo caminho (`moveAlong` devolve as casas) e não pelo par início/fim.

**M3. Heróis nascem dentro de móvel (casa bloqueada) em duas chegadas.** `casadamorte.js:219` (alçapão → canil: 4ª casa (4,11), `prop`) e `casadamorte.js:252` (espiral → sótão: 4ª casa (3,5), `prop`);
`s1-estrutura.mjs` ("PROBLEMA: 4,11(bloqueada,prop)"; `s-alcapao.mjs`: "Pip@4,11 sup=prop bloq=true"). O herói sai andando (36 casas alcançáveis), mas o sprite nasce sobreposto. Correção: trocar as casas por livres.

**M4. Balanceamento (nível 2, 8 sementes):** cinco sombras 75% de derrota, Lorghoth do culto negado 100% (8/8), Rose e Thorn atacadas 62%, carniçais 37%. O botão primário do ritual é "Descer do estrado sem sacrificar ninguém" = o caminho que entrega o grupo ao Lorghoth (0/8 vitórias). O jogo não avisa.

### BAIXA

- **B1.** Vestiário 2B (térreo) e armário dos uniformes 7B (2º andar) não têm casa livre: o cômodo é inalcançável e o texto de entrada nunca sai (`visitar` no `campanha.mjs`).
- **B2.** `sacadaSul` do 3º andar e o poço não têm área: nenhuma descrição ao entrar (mesma causa do C1).
- **B3.** O "Olhar" das escadas usa o texto genérico `OLHAR.escada` ("Escada de cordas… presas no alto do paredão", `interacoes.js:55`) na espiral e nas escadas de pedra da masmorra; a escadaria de mármore vira "Uma peça: Mobília ou carga" (`t11.mjs`).
- **B4.** Nenhum mapa da Casa da Morte liga `cliqueNoObjeto` (a Mansão liga, `encounter.js:363`): clicar no corpo de um móvel alto cai na casa de trás (`board.js:866-897`). Atenuado porque todo ponto de exame tem raio 1 ou mais.
- **B5.** "Rever as pistas" entra em TODO menu direito de toda casa (inclusive a floresta) assim que há uma descoberta (`casadamorte-pistas-cena.js:72-83`).
- **B6.** Na escadaria de mármore (5,5)/(5,5 do 2º) a única casa em que o herói pode pisar (`assoalho`) não oferece "Subir/Descer": só as casas `prop` oferecem.
- Observação: a abertura (`abrirBarovia`) não foi simulada (depende de UI). Cabeça de veado e bonecas existem só como pontos de exame; não há criatura delas no jogo (o livro também não tem).

## (c) Usabilidade (medida)

Campanha exaustiva simulada (todas as opções, fracasso + sucesso por herói, todos os combates): **514 cliques de mover + 484 botão direito + 484 escolhas de menu + 483 páginas de texto**
(a simulação não conta as trocas de herói: em tese 3 a 4 por trecho de grupo).

| Tarefa | Cliques medidos |
|---|---|
| Levar o grupo a um cômodo vizinho | 2 a 8, média 4,0 (33 trechos) — um clique por herói; mais 3 trocas de herói (Tab) = ~7 entradas |
| Clareira → salão (grupo) | 4 + 3 + 4 = 11 cliques (+ ~9 trocas de herói, estimativa) |
| Abrir portão e portas | 0 (arcos abertos); a única porta trancada: 2 cliques + 1 de texto com a chave |
| Examinar um ponto (1 perícia, 1 herói) | 1 direito + 1 menu + 1 texto = 3, mais a troca de herói e a caminhada |
| Trocar de andar (grupo já ao pé) | 2 (direito + menu) — e 2 também de longe (M1) |
| Descer à masmorra 2 da entrada da masmorra 1 | 8 cliques de caminhada + 2 |
| Volta do ritual à estrada (escadas remotas) | 3 mover + 6 dir + 6 menu + 2..12 texto |
| Opção recusada por "longe demais" na varredura | 32 recusas (herói x opção); em 8 opções o jogador teve de procurar a casa certa para ficar (estátua, roda, esqueleto da prisão) |

Outros números: o menu direito de um ponto de exame tem 7 a 10 linhas em média (máx. 13, com o herói ao lado); 56 pontos de exame e nenhum marcador no tabuleiro (nem passar o mouse mostra o nome);
nos andares 1 a 4, 9 de 34 pontos (26%) têm um nome que não aparece (nem por radical) no texto da sala (`s-uso.mjs`); na masmorra 1 o clique numa casa fora da luz dá só "Escuridão / Olhar" (`s-escuro.mjs`; da entrada, com uma tocha, só 2 dos 14 pontos de exame ficam visíveis).

Sugestões, em ordem de ganho:
1. **Mover o grupo com um clique** (líder + seguidores em formação, ou "Tab+clique" para todos): 33 trechos x 4 = 132 cliques viram ~33 e some a troca de herói.
2. **"Ir e usar"**: quando a opção está desabilitada por "longe demais", oferecer a mesma linha com "anda até lá" (o motivo já sabe a distância).
3. **Realce dos interativos**: contorno/brilho ao passar o mouse, tecla (por exemplo `H`) que acende todos os pontos de `PISTAS`/`ganchosMagicos` da sala (as coordenadas já existem), nome na dica do HUD (`hud.setHint`) e ponto no minimapa.
4. **"Procurar com o grupo"**: uma opção que faz cada herói tentar uma vez em sequência e para quando um passa (hoje são 4 x [trocar + direito + menu + texto]).
5. Tirar "Rever as pistas" de todo menu; botão fixo do diário (ou tecla `J`).
6. Aviso ao entrar na masmorra: "escuro: acenda uma tocha" (hoje o menu só diz "Escuridão").
7. Guardar no diário o texto da sala visitada (hoje o painel aparece uma vez e some).
8. Se as escadas continuarem remotas (M1), pedir ao menos que o grupo esteja no andar; se não, auto-andar até elas.

## Limitações do método

Sem navegador: oclusão, desenho do sprite e o que o olho vê não foram medidos (B4 vem da leitura de `board.js`). A subida de nível foi aplicada por `subirUmNivel` com escolhas padrão. Na campanha contínua os heróis receberam PV extra (`GOD=1`) só para não parar a varredura; os combates da tabela acima rodaram sem isso. A política dos heróis é a de `jogador.mjs`.
