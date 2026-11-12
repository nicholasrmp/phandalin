# Os capítulos 5 a 8 do Obelisco — o que existe, o que falta e em que ordem (2026-11-08)

A segunda metade de *Phandelver and Below* é outra campanha: do 5º ao 12º nível, com os devoradores de mente de
Ilvaash, o obelisco netherese partido e o Reino Distante. O dono pediu para começar. Este arquivo é o MAPA DO
TRABALHO, medido; o de-para sala a sala de cada capítulo foi feito lendo o livro inteiro (quatro leitores, um por
capítulo, sobre o texto do 5e.tools e o JSON da aventura) e está em `_referencias/obelisco58/cap5.md` a `cap8.md` —
fora do repositório, porque é resumo feito em cima do livro e não passou pelo conferidor de colagem. Tudo o que for
para o jogo se escreve de novo, com as nossas palavras.

## 1. O tamanho, em números

| Capítulo | Nível | Lugares | Criaturas citadas | Que o jogo já tem |
|---|---|---|---|---|
| 5 — Caminhos de Perigo | 5º → 7º | a vila (4 cenas de crime), a caverna do poço, o acampamento, o telhado, o Repouso de Zorzula, o Santuário Índigo | 19 | goblin, grick, plebeu, acólito |
| 6 — O Obelisco Partido | 7º → 9º | a volta a Phandalin, Talhundereth, a Cripta dos Talhund, a Travessia da Forca | ~45 | quase nenhuma |
| 7 — Fendas na Realidade | 9º → 10º | a vila infectada, a viagem pelo fundo, Illithinoch, as três fendas | ~40 | grell, plebeu |
| 8 — Além de uma Estrela sem Luz | 10º → 12º | o Labirinto Salgado, o Vazio Sem Fim (8 nódulos), a Ânima e a Refração de Ilvaash | ~45 | wraith, spectator, mago, plebeu |

**Os níveis sobem por MARCO** em todos os quatro capítulos (dois marcos por capítulo). Medido no capítulo 5: somando
todas as lutas de sala que o livro quer lutadas, cada herói ganha ~5.700 XP e não sai do 5º. É o mesmo caso já
medido na Onda Eco. **Decisão: seguir o livro** — o marco dá o nível (o XP sobe até o piso do nível do marco), e o XP
das lutas continua valendo entre um marco e outro.

## 2. Os mapas: a Forgotten Adventures tem quase tudo

As cenas do Foundry (paredes, portas e luzes) estão baixadas em `mapas/_cenas/` (29 novas), e a ARTE está no disco do
dono para quase todas. Nada disso entra no repositório nem na publicação (`.gitignore`, `verificar-publicavel.mjs`).

| Lugar | Cena da FA | Arte no disco |
|---|---|---|
| Caverna do poço (cap. 5) | `well-cavern-17x25` | sim |
| Acampamento goblin (5) | `goblin-camp-18x23` | sim |
| Santuário da Sorte (5) | `phandalin-alleys-15x20` | sim |
| Telhado do Gigante Adormecido (5) | (`RoofTopStash_17x22`, sem cena JSON) | sim |
| Repouso de Zorzula (5) | `zorzulas-rest-outpost-33x20`, `-mines-33x25`, `-indigo-sanctum-21x25` | **não** (abre com o ladrilho) |
| Talhundereth (6) | `talhundereth-35x44` | sim |
| Cripta dos Talhund (6) | `crypt-of-the-talhund-44x33` | sim |
| Travessia da Forca (6) | `gibbet-crossing-68x91` e cinco partes | o mapa grande, sim |
| Illithinoch (7) | `illithinoch-33x43` | sim |
| As três fendas (7) | `feeder-trenches-32x22`, `spawn-hollow-33x25`, `labyrinth-of-eyes-51x38` | sim |
| Labirinto Salgado (8) | `briny-maze-66x80` | sim |
| Os nódulos do Vazio (8) | `crystal-dome`, `emptybridge`, `mire-of-doubt`, `the-nematode`, `occluding-miasma`, `toppled-statue`, `wailing-battlefield`, `ilvaashs-anima` | sim, todos |

O leitor do capítulo 7 concluiu que "os mapas são da Wizards e terão de ser desenhados por nós". **Está errado**: a FA
publicou todos, e a arte está aqui. Fica de fora só a viagem pelo fundo do capítulo 7, que é tela de viagem.

## 3. O que o motor precisa, por ordem de quem pede primeiro

**Capítulo 5** (os goblins psíquicos, os ashenwights, o otyugh mutante, a broca, o Ruxithid, o guardião-escudo):
- **Explosão ao morrer** (Mental Burst: 1,5 m, Inteligência CD 13, psíquico), em cadeia se dois morrem juntos.
- **Efeito de uso único com prazo**: "−1d4 no próximo d20" (Lâmina Psíquica) e "desvantagem no próximo ataque" (Estilhaço Necrótico).
- **Recarga 5–6 em ação e em ação bônus** (hoje só o sopro de dragão tem): Rasgo Sináptico, Tentáculos Cerebrais, Coroa Psiônica, Rajada de Calor.
- **Reação para um aliado** (Escudo Psiônico: +3 de CA depois de saber que acertaria) e **ordem que gasta a reação de um aliado** (Comando de Combate).
- **Resistência Lendária** (Ruxithid, 2/dia) — o motor não tem.
- **Objeto alvo com imunidade seletiva** (a fechadura que só aceita dano psíquico; as espirais de cristal que revidam). O molde é `golpearMuralha`.
- **Derrota que não acaba o jogo** (o refeitório de Zorzula quer subjugar: o grupo acorda preso no Santuário).
- **Teste de grupo com contagem de sucessos** (o reparo da Bolsa, o santuário de Tymora).
- **Ligação mestre–guardião** (o guardião-escudo fica inerte quando o Ruxithid cai; a reação dele divide o dano do mestre).

**Capítulos 6 a 8** acrescentam (lista do de-para, a medir quando chegar a hora): a Rajada Mental em cone de 18 m e o
Extrair Cérebro dos devoradores de mente; criaturas que geram inimigos no meio da luta (o aglomerado encefálico);
mapa que muda em jogo (a cripta que gira); ações lendárias e de covil (os chefes finais); o voo de todo mundo e a
gravidade por ilha no Vazio; o obelisco que passa o dano ao fanático mais próximo (a única forma de vencer a luta
final); estado de campanha que atravessa capítulos (fragmentos achados ou perdidos, a corrupção visível de cada
herói, relógios de dias).

## 4. A ordem do trabalho

1. **Capítulo 5, criaturas primeiro**: os sete blocos do Obelisco e os dois do SRD, cada um com o que o motor precisa
   para ele, e cada mecânica com teste que falha sem ela. Sem os blocos nenhuma cena do capítulo existe.
2. **Capítulo 5, a vila**: o contrato do Harbin, as quatro cenas de crime sobre o mapa da vila, as quatro pistas, a
   Gwyn, a tabela de travessuras, e as três lutas pequenas (caverna do poço, acampamento, telhado) sobre os mapas da FA.
3. **Capítulo 5, o Repouso de Zorzula e o Santuário Índigo**: importar as três cenas da FA, as máquinas a cristal, as
   salas de conversa (refeitório, dormitório, penhasco), a fumaça, as portas de senha e psíquica, o Ruxithid.
4. Os marcos (6º e 7º) e a ponte para o capítulo 6.
5. Capítulos 6, 7 e 8, na ordem, cada um começando por relê-lo inteiro e medir o de-para contra o que já existe.

Cada luta entra MEDIDA (`balance.js`, os moldes de `medir-*.mjs`): o de-para já mostra salas que passam do dobro do
limite mortal do DMG no papel (o refeitório, a forja, o penhasco), e o livro conta com conversa e rendição nelas.

## 5. O que já está feito

**Os goblins psíquicos dos Sawplee** (`goblinPsiLutador`, ND 2; `goblinPsiComandante`, ND 4), com as fichas do
5etools, e o que eles pediram ao motor, cada peça com teste que falha sem ela (`testes-regras.mjs`, "goblins
psíquicos"):
- a **Explosão Mental** ao morrer (`combat.js explosaoMental`), nos dois caminhos de morte, e que encadeia;
- a **Lâmina Psíquica** (`laminaPsiquica`: −1d4 no próximo ataque OU resistência, gasta no primeiro dos dois);
- o **Escudo Psiônico** (`escudoPsionico`: +3 de CA num aliado a 4,5 m, de reação, só quando faz errar);
- o **Rasgo Sináptico** (`rasgoSinaptico`, recarga 5–6 pela tabela de traços; a IA o mira onde pega dois heróis ou
  mais e nenhum aliado: `ai.js turnoDoComandantePsi`) e a condição `incapacitado`;
- o **Empurrão Telecinético** (ação bônus, antes de bater: o caído dá vantagem a quem está colado);
- a **Fortitude Mental** (`passivas.js`: vantagem contra medo e encanto).

**Medido** (200 lutas, campo aberto, grupo do 5º nível): três lutadores derrotam o grupo em 34% das vezes, e o
comandante com dois lutadores em 47% — contra três ogros, do mesmo ND e XP, a derrota é de 5%. Os números são os do
livro: cada lutador dá até ~19 de dano por turno e derruba antes de bater, mais ataque do que um ND 2 costuma ter. Duas
coisas a levar para as cenas: os heróis do simulador jogam pior que um jogador (gastam a ação estabilizando), e o
livro põe os três goblins do acampamento JÁ FERIDOS — a cena tem de nascê-los assim.

**O resto das criaturas do capítulo 5** — todas com a ficha do 5etools e com teste em `testes-regras.mjs`:

| Bloco | ND | O que o motor ganhou com ele |
|---|---|---|
| `ashenwightFeral` | 5 | o Estilhaço Necrótico deixa desvantagem no próximo ataque (`zombado`) |
| `ashenwightPsionico` | 7 | a **Coroa Psiônica** (`coroaPsionica`): encanto sem reação, a meia velocidade, 2d8 por turno, sem poder atacar quem a pôs |
| `otyugh` | 5 | a **doença da mordida** (`doencaDoOtyugh`: cura ou perde PV máximo a cada descanso longo) e a Pancada de Tentáculos nos agarrados |
| `otyughMutante` | 6 | o Hálito Virulento no começo do turno, e um golpe do multiataque TROCADO pela Pancada de Quitina (`trocouUmGolpe`) |
| `brocaInfernal` | 5 (Enorme) | a **investida** (6 m andados antes do golpe) e a Rajada de Calor que contorna quinas (inundação pelo chão, não reta) |
| `guardiaoEscudo` | 7 | Regeneração, e dois laços separados: `amuletoCom` (Vínculo e Escudo, de quem usa o amuleto) e `comandadoPor` (morto quem o comanda, fica inerte) |
| `ruxithid` | 5 | **Resistência Lendária** (`recursos.resistenciaLendaria`), Tentáculos Cerebrais e Comando de Combate (o aliado bate de reação) |
| `texugoGigante` | 1/4 | — (a Bessie, amistosa) |

O de-para dizia que a reação do guardião "fica com metade do dano do mestre": está errado. O bloco do SRD separa o
Vínculo (metade do dano, de quem usa o AMULETO) do Escudo (+2 de CA, colado). E o livro não dá amuleto a ninguém no
Santuário: o Ruxithid controla a estátua pela luz do cristal. Então ali só vale "morto ele, a estátua para". Com o
Vínculo ligado por engano, o grupo do 6º nível vencia 17,5% das vezes; com a regra do livro, 63%.

**Medido** (200 lutas, campo aberto): o otyugh do poço, no 5º, 97,5% de vitória do grupo; no 6º, os três ferais da
forja 87%, o otyugh mutante 100%, a broca 98,5%, os três gricks 99,5%, e o Ruxithid com o guardião **63%** (68,5% no
7º) — a luta mortal do capítulo, como o orçamento do livro já dizia (7.050 de XP ajustado contra 5.600 de limite
mortal no 6º).

**A metade da vila do capítulo 5** (`game/obelisco5-vila.js`, ligada em `phandalin.js`; testes em
`src/dev/testes-obelisco5.mjs`): depois do epílogo da Onda Eco (`campanha.aventuraConcluida`), a chegada à vila abre
a multidão na porta do Harbin (as cinco queixas para quem tem passiva 13) e o contrato (50 e 150 po por cabeça, ou 100
e 300 com Intimidação ou Persuasão CD 11). As quatro cenas de crime ficam nos lugares que o mapa da vila já tem — o
poço da Barthen e o Ander, o Câmbio da Halia (teste de grupo: dois sucessos de Força ou Destreza CD 12; falhando, ela
só fala no dia seguinte), o arco do Santuário (três sucessos de CD 15, cada falha 1d4) com a Tamara, e o balcão do
Gigante com a Grista e o Wheel-of-Fortune —, cada uma uma vez, e depois dela a vila volta ao normal. Depois de cada
cena, o d20 das travessuras; depois da primeira, a Gwyn, que fica na Stonehill juntando as pistas. Com as quatro ela
acha o posto; com menos, História CD 15. Achado o Repouso de Zorzula, o **marco** sobe o grupo ao 6º (`darMarco`: o XP
vai até o piso do nível, sem tirar nada de quem passou dele). Jogado no navegador do contrato ao marco.

**As três lutas da vila** (`game/obelisco5-lutas.js`, mapas em `game/obelisco5-mapas.js`, gerados por
`src/dev/mapa-cap5-vila-fa.py` a partir das cenas da FA, com as provas no motor): a CAVERNA DO POÇO ("Well Cavern",
desce-se pela corda com Atletismo CD 10 — quem cai leva 2d6 e acorda o otyugh; quem desce bem e passa na Furtividade
CD 11 dá a surpresa ao grupo), o ACAMPAMENTO ("Goblin Camp", três lutadores com metade dos PV — o livro diz "os
feridos" e não diz quanto; ao chegar o grupo ouve o nome do Ruxithid, a QUARTA PISTA; morto um, os outros se rendem e
contam do posto duergar) e o TELHADO ("Rooftop Stash", a arte com os telhados: a cena do Foundry é do térreo, então
as paredes de dentro saem e o telhado grande da taverna vira terreno alto, quatro níveis, com a rua embaixo; caído um,
os outros fogem e largam o saco, que volta à Grista ou fica com o grupo). Cada cena de crime termina oferecendo a sua
luta, e a visita seguinte ao lugar oferece de novo até ela ser feita. Jogado no navegador: a descida pela corda, a
caverna com a arte da FA, a luta e a volta à vila.

**O que falta da vila**: as travessuras que trazem goblins, que hoje se resolvem em cena (o grupo os espanta com
Intimidação CD 12); o túnel desmoronado da caverna do poço (cavar 1 hora leva perto do posto); e o Repouso de Zorzula
no mapa da região.

**O Repouso de Zorzula e o Santuário Índigo** (`game/zorzula-posto.js`, `game/zorzula-santuario.js`, mapas em
`game/zorzula-mapas.js`, gerados por `src/dev/mapa-zorzula.py`; testes em `src/dev/testes-zorzula.mjs`). A ARTE da FA
destes mapas foi baixada depois (a FA a dá de graça: `mapas/Zorzulas_Rest/`), e a primeira versão foi feita sem ela: a PLANTA vem das cenas do Foundry —
paredes, portas, as duas secretas, os janelões — e o resto foi lido do livro, sala a sala, com o tamanho de cada uma
conferido contra o de-para. O chão sai do glifo (laje dentro, pedra lá fora, e um glifo NOVO de lava, `(`, azul-arroxeada
como o livro manda, que barra o passo como o fosso). Se a arte chegar, é só pôr o `fundo`.

- **O posto** (Z1 a Z11): a fumaça (Constituição CD 10, imune por um dia); o portão — os vigias abrem com Persuasão ou
  Enganação CD 15 ou 25 po, e ameaçados ABREM A PORTA e saem para brigar (sem isso a luta não acabava: só têm golpe de
  perto), com o refeitório chegando na 4ª rodada; o túnel da Bessie, achado com Percepção 16 de fora ou pela despensa;
  o refeitório com o elenco rolado do livro (2d4 + 1d6 + 1d4), que bate para DERRUBAR — o golpe não letal passou a valer
  contra herói (`combat.js`: desacordado e estável, sem teste de morte), e a IA não bate em quem já caiu —, e o trato da
  forja pela Intimidação ou Persuasão CD 13; o dormitório (Furtividade 17, a pista da "sala azul"); a secreta das
  latrinas (passiva 13) e a fonte (1d6 a cada dez minutos, o respiradouro com Atletismo 18); o elevador (o cristal e o
  Arcanismo 16); a forja barricada (Atletismo 12), os três ferais e a pilha (Investigação 13); a despensa (Investigação
  15: as poções); a suíte trancada (a chave é do Ruxithid), o jarro do Hjoldak (passiva 15, Investigação 15 ou Atletismo
  20), o fundo falso da cama (Investigação 20, ou o Hjoldak mostra) e as quatro runas do cofre (a ordem errada: Destreza
  15 contra 3d8 do tipo da última).
- **A derrota que não acaba o jogo**: perdida a briga com o refeitório, o grupo acorda preso na ala oeste do Santuário
  (`comoPresos`), ao lado dos reféns.
- **O Santuário**: a conversa do Ruxithid (Intuição 16 vê os olhos revirando), a luta com ele e a estátua-guardião
  (morto ele, ela para), as vozes e as três lascas, Religião 13, os reféns soltos, a sala de guerra, o **marco do 7º**, e
  na volta a Phandalin o Harbin paga o resto do contrato.
- **O que falta do capítulo 5**: o NÍVEL DE BAIXO (as minas, Z12 a Z19 — a câmara dos vagonetes, a caverna de cristal e
  seus gricks, o penhasco dos ashenwights, a fossa do otyugh mutante, o santuário de Ilsensine, o depósito da broca e a
  ponte com a fechadura psíquica). Hoje o elevador conserta mas não desce, e a volta do Santuário é narrada. A planta das
  minas é a mais difícil de ler sem a arte: no Foundry, a lava, o chão e os andaimes não se distinguem.

**A arte chegou, e a medida mudou o que fora posto às cegas** (`prova-fundo.py`, 100 px por casa, origem 0,0, 1 para
1): paredes, salas, a fonte, os janelões e a lava caem certos; os MÓVEIS não — as mesas do refeitório estavam uma
fileira fora, a cama e a escrivaninha da suíte no canto errado, as bigornas da forja longe das de pedra que a arte
desenha. Todos foram trocados pelos da arte. A lava, que sem a arte era tudo ao sul dos janelões, agora é a casa que a
ARTE pinta de azul vivo (azul acima de 55 e 45 acima do vermelho; a pedra escura da encosta dá menos de 40), e a fonte
é água só no meio, com a borda de pedra. No Santuário, a estátua (o guardião) foi para o pedestal desenhado e o
Ruxithid para o mezanino logo acima. A arte das MINAS mostra o que a cena do Foundry não dizia: os túneis dos
vagonetes no alto, a fossa marrom, o santuário de Ilsensine na caverninha redonda, o depósito à direita com os
trilhos, a caverna de cristal roxa à esquerda, a passarela de madeira do penhasco e o lago de lava com a ponte até a
pirâmide.

**As minas (Z12 a Z19)** — `game/zorzula-minas.js`, mapa `ZORZULA_MINAS` em `game/zorzula-mapas.js`. A cena do Foundry
das minas é uma caverna só, aberta: as paredes dela contornam as galerias, mas não dizem onde é lava, esgoto ou
passarela. Isso saiu da ARTE: a lava pela cor (azul acima de 45 e 25 acima do vermelho, sem ser roxo), o esgoto da fossa
pelo marrom, o breu de fora pelo preto; à mão, só o que a cor confunde com a lava (a ponte de pedra e a pirâmide) e a
borda do penhasco. As salas são retângulos sobre a arte (a caverna é contínua), e o chão que ninguém alcança a partir do
elevador vira pedra. Cada sala faz o que o livro manda:
- Z13: os crânios abertos (Medicina ou Arcanismo 16), os braceletes de celeridade (Investigação 15), o cristal dos
  vagonetes e a viagem entre o depósito, o penhasco e o cristal;
- Z14: os três gricks, com a SURPRESA POR HERÓI pela Percepção ativa (CD 16) — o motor só sabia comparar com a passiva; a
  cena põe quem falhou na lista de quem "dorme" na emboscada (`enc.dormindo`) — e as espirais de cristal (CA 15, 25 PV,
  revidam com Destreza 16, 2d4; quebradas, 1d6 lascas que recarregam as máquinas sem gastar magia);
- Z15: os seis ashenwights, que só lutam se atacados; os psiônicos apontam a ponte por Persuasão 15 ou 50 po;
- Z16: o otyugh mutante (Furtividade 12; Arcanismo 15, com vantagem para quem viu o do poço; a picareta luminosa pela
  passiva 14);
- Z17: o santuário de Ilsensine (Religião 17; quem toca faz Carisma 20 ou fica VULNERÁVEL a psíquico; o anel);
- Z18: a broca infernal, o minério e os três caixotes lacrados (Atletismo 12);
- Z19: a fechadura psíquica (30 PV, só dano psíquico: as magias psíquicas preparadas de quem a ataca; ferramentas de
  ladrão CD 18; ou um goblin do trato, Intimidação ou Persuasão 12) e a plataforma até o Santuário.

O elevador consertado liga o dormitório à boca das minas, a esteira consertada liga a forja ao depósito (Acrobacia 15),
e a plataforma liga a ponte ao Santuário — nos dois sentidos. A saída com os reféns continua narrada: eles mal andam.
O CAPÍTULO 5 está inteiro. O que vem é a ponte para o capítulo 6.

**Os três mapas do Zorzula contra a cena do Foundry** (pedido do dono, medido com `inventario-cenas` e uma comparação
cena a cena). O que faltava, e entrou:
- **A luz.** Os três tinham ZERO luzes: a primeira versão trocou as da FA por uma grade fixa (penumbra azul em tudo), que
  não acende nem apaga. Agora são as luzes da cena (16 no posto — as 18 menos as duas de luar lá fora, que de dia não
  fazem nada —, 15 nas minas, 15 no Santuário), com a cor e o alcance da FA, e a grade fica no escuro por dentro: quem
  acende é a luz. Medido: o refeitório inteiro tem luz e toda ela vem das luzes da cena; os túneis das minas ficam no
  breu, como o livro manda; a caverna de cristal acende pelo roxo; o cofre selado fica no escuro. A luz de lava, de
  cascata e de cristal é `semChama` (não se apaga lava); só o fogão da cozinha é fogo, com o botão de apagar. O
  `conferir-cena` passou a não cobrar de luz sem chama as duas regras de chama (morar num móvel que segura fogo e ter
  casa livre encostada para alguém apagar).
- **As peças de arte do pacote.** A FA dá o desenho vazio do que se tira: o suporte da lança, o manequim do peitoral, a
  espada da parede, o cofre e o pedestal da estátua. Os quatro primeiros são `sobreposicoes` do posto, o último do
  Santuário, e o roteiro os acende: a busca na forja agora acha os dois itens que a arte DESENHA (a azagaia no suporte
  de lanças, o peitoral no manequim — o livro deixa o mestre escolher dois entre quatro), o cofre recolhido fica vazio, e
  a estátua que desce para lutar deixa o pedestal vazio. Numa visita seguinte o desenho continua vazio.
- **Os objetos para olhar**: o posto foi de 13 para 23, as minas de 7 para 14 e o Santuário de 4 para 8, lidos da arte
  (as escadas em caracol, o painel de runas, o suporte de armadura, a espada inacabada, a bigorna, o fosso de cristal,
  os livros e o baú da suíte; os barris, as escadas e os sacos do depósito, a passarela, o vagonete virado; os relevos,
  o mezanino e a plataforma do Santuário).

O que fica de fora, dito: o SOM de ambiente das cenas (o jogo ainda não toca som por região, em mapa nenhum); a peça
"Overhang" do posto (o parapeito por cima do vestíbulo, onde os vigias ficam — desenhá-lo por cima das fichas os
esconderia); os túneis laterais das minas (as peças Tunnel1/2/3 abrem passagens que o livro deixa ao mestre, sem
conteúdo) e as versões da esteira parada (NoConveyor) e do elevador e do pedestal com energia, cujo momento o livro não
dá. As paredes são as arestas derivadas da cena do Foundry: no posto, de paredes retas, batem; nas minas a visão segue o
contorno da caverna em degraus de casa.

**O restante da conferência, e o que o dono viu na tela** (2026-11-08). O refeitório aparecia com oito goblins numa fila
EM CIMA da primeira mesa: o livro os põe comendo, sentados à mesa, e as mesas da regra estavam fora do desenho. Medido
na arte a 100 px por casa, a mesa do meio enche a fileira 9 e as outras duas caem em cima de uma LINHA da grade (entre 7 e
8, entre 10 e 11) — nenhuma casa as representa. A do meio é casa de mesa; as duas da linha viraram ARESTA de mesa (`J`:
barra o passo, deixa ver, dá cobertura; sobre mapa pintado não se desenha). Os bancos (fileiras 7, 8, 10 e 11) são onde o
refeitório nasce, cada um de frente para a sua mesa, e só quem sobra fica de pé nas pontas. Os três ashenwights da forja
nascem cada um numa bigorna de pedra (o livro: "imitam o trabalho de forja"). As outras posições foram conferidas uma a
uma contra o livro e a arte: os vigias nas escadas das seteiras, o dormitório nos beliches, a Bessie na cozinha, os gricks
entre os cristais, os seis ashenwights na passarela do penhasco, o otyugh no meio da fossa, a broca no depósito, o
Ruxithid no mezanino, a estátua no pedestal e os reféns na ala oeste.

E as peças que ficavam de fora:
- o PARAPEITO ("Overhang"): a FA o dá como peça de cima; aqui fica aceso e por BAIXO das fichas, porque os vigias ficam
  em cima dele;
- o PEDESTAL: com a energia verde enquanto o Ruxithid comanda a estátua, apagado depois que ele morre;
- o POÇO VAZIO do elevador do Santuário: quem chega preso acha a plataforma lá embaixo, e ela sobe quando alguém vai até a
  boca do poço (o livro: ela sobe e desce sozinha);
- o TÚNEL LATERAL das minas (a peça "Tunnel3"; o livro: "túneis menores, livres para o mestre"), do túnel de cima ao
  penhasco pela pedra, em x = 22. As peças "Tunnel1" e "Tunnel2" ficam de fora: a 1 refaz a fossa e a 2 apaga o santuário
  de Ilsensine, duas salas do livro; e as duas "NoConveyor" tiram a esteira, que o livro tem;
- o TRAÇO da FA nas minas e no Santuário: a visão e a luz seguem a curva da caverna e as quinas em diagonal, e não os
  degraus das casas (cortado onde o túnel lateral atravessa a pedra). No posto, de paredes retas, a aresta já é a parede.

O SOM por região fica para o fim desta aventura, por decisão do dono.

## O capítulo 6 começou (2026-11-08)

Releu-se o de-para (`_referencias/obelisco58/cap6.md`): a volta a Phandalin com a Gwyn, três missões curtas (Pip e a
casa de Marthungrim, a vaca Daisy, os mineiros da Mina Hardyhammer) e os três fragmentos (Talhundereth, a Cripta dos
Talhund, a Encruzilhada da Forca). São perto de 30 tipos de criatura, uma dúzia nova no jogo, e a arte da FA de todos
os lugares está no disco (a casa de Marthungrim e a Mina Hardyhammer vêm nos pacotes "Phandelver Encounters"; as cenas
do Foundry delas, do repositório público da FA, estão em `mapas/_cenas/`).

**As criaturas da vila**, cada uma com a ficha do 5etools e teste em `testes-regras.mjs` que falha sem ela:
- a **Gêmula Encefálica** (ND 3): a Sanguessuga (ação bônus, Destreza CD 14) gruda no alvo e chupa 3d4 no começo de cada
  turno dele; sai com a ação de escapar (a Força CD 15 do livro, pela `escape` da condição) ou quando ela morre ou cai
  (`soltarAgarroesDe`). O livro a põe DENTRO do espaço do alvo; aqui ela fica colada e vai junto, porque duas fichas
  na mesma casa quebram tudo o que pergunta "quem está aqui". O campo é `gemulaEm`, e não `grudadoEm`: esse nome já era do
  stirge, e o simulador pegou a gêmula drenando sangue como ele;
- a **Gosma Cinzenta Psíquica** (ND 1/2): a gosma cinzenta do SRD com a variante do livro dos monstros — Inteligência 6 e
  o Esmagamento Psíquico (recarga 5–6, quem ela sente a 18 m, Inteligência CD 10, 3d6, metade se passar). O livro de
  aventura diz "Mind Blast", mas o bloco que ele cita dá o Esmagamento: vale o bloco. A corrosão de metal não entrou (o
  motor não tem penalidade permanente de arma);
- o **Monte Errante Psiônico** (ND 5): o monte errante do SRD; o Enfeitiçar Pessoa do dia já está gasto (foi assim que ele
  atraiu o mineiro), e a Ilusão Menor à vontade não muda a luta.

**Medido** (200 lutas, campo aberto, grupo do 7º): as três gêmulas da casa de Marthungrim vencem o grupo em 16% das vezes
e matam meio herói por luta — o livro as põe num buraco de 6 m, e atacadas de cima elas recuam, o que a cena tem de dar
ao grupo; as quatro gosmas da vaca, 0% (duas rodadas); o monte da mina, 0,5%.

### A vila do capítulo 6 (2026-11-08)

As três missões curtas entraram, sobre as cenas do Foundry da FA (`mapas/_cenas/marthungrims-home-9x12.json` e
`hardyhammer-mine-21x15.json`) e o largo da vila. O mapa sai de `src/dev/mapa-cap6-vila-fa.py`, que escreve
`game/obelisco6-mapas.js`; a história da vila mora em `game/obelisco6-vila.js` e as três cenas em
`game/obelisco6-lugares.js` (`mapa.cena = 'cap6lugar'`). O capítulo começa quando o Harbin paga o resto do contrato
(`capitulo6Ativo`).

- **A Gwyn** paga o café na Stonehill, traduz o mapa dos goblins e abre as três missões (fragmentos, Pip, mineiros).
- **A vaca vem até o grupo** na primeira volta pela vila: a Daisy no largo, e quem chega a 1,5 m dela a faz vomitar as
  quatro gosmas. As gosmas nascem em casa de uma pegada, não na 2x2 da vaca (o primeiro rascunho as fazia Grandes,
  achado no navegador). A vaca fica neutra; se uma magia de área a mata, o desfecho diz isso.
- **O Pip**: Sobrevivência CD 14 no rastro, ou a palavra do Carp, e o grupo desce na casa de Marthungrim. Atacadas de
  cima, as gêmulas recuam uma para cada cômodo e saem do tabuleiro, até um herói entrar no cômodo de uma delas (como o
  Droop da Mansão). Descer pela corda é luta na hora contra as três. O diário dá a pista da cripta; a volta dá cama e
  comida de graça na Stonehill.
- **Os mineiros**: a Halia conta a história, e a Mina Hardyhammer aparece no mapa da região. O livro diz que a câmara
  oeste é estreita demais para o monte. Pela regra de espremer do SRD ele passava (a passagem tem uma casa, e o Grande
  cabe apertado no espaço do Médio), e o teste pegou isso. Agora o monte leva `naoEspreme`, que `combat.js
  cabeApertado` respeita. Vencido, o Karthim marca Talhundereth e a renda começa: 250 po a cada 30 dias de jogo, por
  doze meses, cobrados na Bolsa (`rendaDevida`).

`src/dev/testes-obelisco6.mjs` (8 testes) cobre tudo isso. As três cenas foram jogadas no navegador até a vitória,
sem erro no console. O próximo passo é Talhundereth, com o lote de criaturas dele.

### Talhundereth (2026-11-08)

O templo de Dumathoin, sobre a cena do Foundry da FA (`mapas/_cenas/talhundereth-35x44.json`). O mapa sai de
`src/dev/mapa-talhundereth.py` e vai para `game/talhundereth-mapa.js`; a cena é `game/talhundereth.js` (`mapa.cena =
'talhundereth'`). O lugar aparece na região com a missão dos fragmentos.

**O import precisou de sementes.** A cena tem duas luzes num templo de vinte salas, e o derivador de paredes semeava só
nas luzes: sobravam 91 casas de chão. `derivar-paredes.mjs` passou a aceitar `SEMENTES="x,y;..."` (uma por sala), e deu
736. Lida com a grade numerada sobre a arte, **a planta bate com o livro sala a sala** (T1 a T21). O recorte pela cor
tomou por chão dois blocos de alvenaria em volta da cozinha (cinza-claro na arte), e o conferidor de paredes os pegou
como "chão ilhado". O que o Foundry não tem e o livro pede entrou como parede que o roteiro abre (`pontos.secretas`): a
secreta T13/T15 (porta comum na FA), a porta do cofre de três fechaduras e a da cripta; o vão de T4 para o cofre é rocha
até o grupo tirar as pedras, e quem é Pequeno passa espremido.

**Dez blocos novos** (`rules/monsters/talhundereth.js`), e o que o motor ganhou com eles, cada um com prova que falha
sem o código (`testes-talhundereth.mjs`, 27 provas):
- o OLHAR da medusa (`combat.js olharPetrificante`): Constituição CD 14 no começo do turno; falhar por 5 petrifica,
  falhar por menos deixa contido até o fim do próximo turno. As condições novas `petrificado`, `petrificando` e
  `olhosDesviados`, e o interruptor **Desviar os olhos** na barra do herói (só aparece com uma medusa na luta);
- a CARGA ROLANTE do galeb duhr reusa a `investida` da broca infernal — e isso achou um **defeito do capítulo 5**: o
  perfil do golpe não copiava `investida`, e a broca nunca embalou no jogo (o teste dela chamava a função à mão). Os
  PEDREGULHOS animados duram enquanto o galeb se concentra e caem com ele;
- a IMUNIDADE A MAGIAS do horror de elmo (Bola de Fogo, Calor no Metal, Relâmpago), pela magia em curso;
- o SOPRO SEM DANO (o do mefit cega) e a EXPLOSÃO DE POEIRA ao morrer;
- o VOO DEFENSIVO do mutante, a CACOFONIA e o SUGAR PENSAMENTOS da armadilha de intelecto (o tentáculo não laça
  quem é Grande: `onHit.imunes.tamanhos`);
- a FOME AGRESSIVA, o golpe que CONSOME e as CRIAS do aglomerado encefálico;
- o multiataque de DUAS FORMAS (`porArma`: três golpes de perto ou dois tiros de arco), a cerca de SALA
  (`casasPermitidas`: o horror e as armaduras não saem de T5) e a poção que dá condição (a de invulnerabilidade).

**A cena** segue o livro sala a sala: o aviso dos galebs, a capela que chega na 4ª rodada, a Honna que pede que se
ajoelhem (quem ajoelha é surpreendido; Intuição contra a Enganação dela vê a mentira), a rendição em T5, a emboscada em
T7 (Percepção 14), as três fechaduras com a poeira, o Falfark, a ilusão e a armadilha de T11, os drow e o pedido dos
Henlifel (o pai subjugado vale o periapto; morto depois de uma conversa, também), o Livro de Granito e os elementais que
não veem quem usa o símbolo de Dumathoin, a Malinia, a farsa do Ontharyx (Intuição 14), o disco (o Livro ensina;
Arcanismo ou Investigação 13; errar estoura uma vez, 4d10 de trovão) e o fragmento — deixado com o aglomerado vivo, um
dia depois os fanáticos o levaram para Illithinoch. **Ficam de fora, ditos**: o relógio da gêmula do Falfark, quebrar
o encaixe do disco com 20 de dano psíquico, e a cripta em si (a escada leva a ela; é a próxima cena).

**Medido** (60 lutas por sala, campo aberto, grupo do 7º): armaduras, mefits, Falfark, armadilha e elementais entre
97% e 100% de vitória; Ontharyx e os três, 85%; a Malinia e as quatro gêmulas, 68% (0,7 morto por luta); o aglomerado,
67% (1,7 morto por luta: ele engole quem cai); a Honna com os três galebs JUNTOS, 50% — na cena dois deles chegam na 4ª
rodada. São os elencos do livro; o capítulo é feito para o 7º ao 9º nível, e o XP dele leva o grupo ao 9º.

### A Cripta dos Talhund (2026-11-08)

Debaixo de Talhundereth, aberta pelo disco de T20 ("Descer à Cripta" troca de cena; a escada de volta devolve o grupo ao
pé da escada do templo). O mapa sai de `src/dev/mapa-cripta-talhund.py` e vai para `game/cripta-mapa.js`; a cena é
`game/cripta-talhund.js` (`mapa.cena = 'cripta'`, variante `criptaTalhund`). As salas foram achadas pelo mapa OFICIAL do
livro (as regiões numeradas do JSON da aventura, centróide de P1 a P18 levado à cena da FA), e a planta da FA bate com
elas sala a sala. A água de P5 vem da cor da arte (34 casas), as três secretas das antessalas (P4o, P4l, P4s) são parede
que o roteiro abre, e o giro do santuário abre as arestas do anel e desliza a parede entre P11 e P15.

**Oito blocos novos** (`rules/monsters/cripta.js`: revenant, hidra, água viva, golem de argila, fantasma, múmia,
esqueleto anão, gnomo das profundezas), e o que o motor ganhou, cada um com prova que falha sem o código
(`testes-cripta.mjs`, 21 provas): imunidade a dano NÃO MÁGICO (`immuneNaoMagico`); a absorção ácida do golem e a pressa
dele (recarga 5-6, +2 de CA e um golpe a mais); a regeneração do revenant, que fogo e radiante suspendem, e o OLHAR
VINGATIVO (paralisa; dano daquele revenant acaba o efeito); as CABEÇAS DA HIDRA, que nascem duas por cabeça perdida se o
turno passar sem dano de fogo e que mordem uma vez cada; o golpe que PUXA (`puxa` no perfil: a constrição da água viva);
o olhar terrível e a PODRIDÃO da múmia (`semCura`); a POSSESSÃO do fantasma (o corpo possuído luta do lado dele, e o
fantasma fica etéreo até a posse acabar); e a armadura de placas dos Talhund, que dá desvantagem aos mortos da cripta.

**E um defeito ANTIGO do motor**: o alcance do golpe corpo a corpo de MONSTRO parava em 5 pés no perfil
(`longRangeFt`), então a mordida de 10 pés do dragão verde, a constrição de 10 pés da água viva e todo golpe com alcance
nunca alcançavam a segunda casa. O perfil agora usa o `reachFt` do ataque; a prova é a mordida do dragão a 10 pés.

**O de-para estava errado num ponto, e o livro corrigiu**: a PURIFICAÇÃO não desliga a regeneração dos revenants (ela é
do bloco, e só fogo e radiante a suspendem), e quem tranca as salas não é a purificação inteira — é a PAZ, as cinco
assombrações apagadas. Em paz, a fundadora não se levanta, os fantasmas não aparecem, os abençoados não sobem, a múmia
não acorda, os espectros não saem e o revenant destruído não volta; sem a paz, ele se refaz noutro corpo e está lá um dia
depois. A purificação (paz + os fantasmas de P13 vencidos) só dá a bênção de Dumathoin (visão no escuro), menos a quem
tirou gema dos mortos. **P1 luta sempre**, com paz ou sem ela.

**Medido** (40 a 60 lutas por sala, campo aberto): no 8º nível, hidra e água viva 83% de vitória, golem 100% (0,4 morto
por luta), três wraiths 78%; no 9º, hidra 80%, wraiths 93%. **Os revenants são o muro**: os quatro de P1 vencem 0% no 8º
e 3% no 9º, e os seis de P15, 0%. É o bloco do livro — a VINGANÇA soma 4d6 contra todo vivo que invade, uns 50 de dano
por revenant por rodada — e a cena do livro conta com isso: P1 é para ser contornado (ninguém precisa mexer num
sarcófago, e a saída oeste é a única que acorda), e P15 só caça depois do giro. No navegador, a Dara sozinha ao lado dos
quatro de P1 caiu na primeira rodada inimiga. **Ficam de fora, ditos**: a assombração espontânea do descanso longo, a
perda diária de PV da podridão e a visão verdadeira de um minuto da bênção (fica no texto).

### O que tinha ficado de fora (2026-11-09)

O dono pediu que nada ficasse de fora. Foram três frentes: o que os comentários diziam "fica de fora", o que o livro
pede e a cena não fazia, e os **traços de monstro que eram só texto** — medidos, e não achados: dos 130 traços que os
blocos carregam, 71 não eram lidos pelo nome em lugar nenhum do motor. Um agente separou os que já valiam por campo do
bloco (o dreno de vida pelo `maxHpDrain`, a hidra pelas `cabecas`, o sopro, o voo) dos que eram só promessa. Prova de
tudo em `src/dev/testes-bestiario.mjs` (32 provas), `testes-cripta.mjs` (28), `testes-zorzula.mjs` (31), `testes-polvo.mjs`.

**A cripta**: a tabela de assombrações é o d6 do livro (a quinta e a sexta, as de horror do corpo, entraram); o descanso
longo antes da purificação traz uma assombração que não se apaga; quem é fiel de Dumathoin (`heroi.divindade`) sabe
apagar sem teste; a bênção dá visão no escuro EM CORES só a quem já tinha (havia um defeito: sempre dava) e a **Visão de
Dumathoin**, ação, visão verdadeira de 36 m por um minuto, uma vez por descanso (`visaoVerdadeira`); a podridão da múmia
tira 3d6 de PV máximo a cada descanso longo, não deixa o descanso curar, e Remover Maldição a tira e devolve o máximo.
**Talhundereth**: a gêmula do Falfark vira aglomerado em uma semana e o come; o encaixe do disco estoura com 20 de dano
psíquico (Arcanismo 14 percebe, o Ontharyx preso conta). **O Santuário Índigo**: a estátua guarda o Assassino
Fantasmagórico (a magia entrou no catálogo) e só o solta em quem não alcança — medido, soltar no primeiro turno deixava a
luta MAIS fácil (78% contra 63%), e com a regra a luta fica onde estava (64% no 6º, 69% no 7º); se a luta estiver fácil,
dois goblins psíquicos entram na quarta rodada e se rendem quando o Ruxithid cai. **A Onda Eco**: a caveira em chamas
volta a arder depois de uma hora (descanso, ou sair e voltar) se ninguém tratar os restos com água benta, Dissipar Magia
ou Remover Maldição; o polvo solta a nuvem de tinta e foge; o grell leva quem agarra.

**O motor ganhou**: movimento incorpóreo (parede e criatura como terreno difícil, 1d10 a quem termina dentro da pedra);
escavar (o elemental desliza pela rocha natural, a broca abre túnel que fica no mapa); a investida em LINHA RETA (a
última reta andada, na direção do alvo — era "6 m andados no turno"), com a do javali, do javali gigante, da cabra e o
salto do tigre; Implacável; o Ataque Furtivo de monstro (o `makeMonster` não copiava `features` nem `sneakAttack`);
Aparar de monstro; Sensibilidade à Luz Solar (sol = mapa sem grade de luz e cena clara); visão às cegas como visão;
Bravura, Devoção Sombria, Ascendência Feérica, Astúcia Gnômica, Pés Firmes e os sentidos apurados; o revenant que não se
expulsa, o spectator que não se surpreende, a hidra que não dorme; Absorção de Raios; Andar na Teia; a escalada do bloco;
o amorfo pela grade; o Furor do golem; Criar Espectro; a Suscetibilidade Antimágica; a água viva invisível na água e
presa a ela; o Susto e a forma de morcego do quasit; a Liderança do cavaleiro e a Ação Astuta do espião; a magia no turno
do mago, do acólito e do sacerdote (`ai.js conjuracaoGeral`) com a Eminência Divina; a Escuridão do drow para fugir, a
Sugestão e a Invisibilidade do Nezznar, a magia inata do drow de elite, e a psiônica do comandante goblin (Enfeitiçar
Pessoa, Sussurros Dissonantes e a Telecinese); a Visagem que envelhece e a da banshee repetida com desvantagem.

**Dois defeitos antigos que isso achou**: quem é Grande se ESPREMIA para fora da cerca (`casasPermitidas`, a água) —
o caminho apertado não perguntava pela cerca; e o ataque de oportunidade saía contra quem o atacante não VÊ (o drow
na própria Escuridão levava o golpe e morria). Os dois foram consertados no motor, para todos.

**Ficam de fora, ditos**: os traços dos monstros da Casa da Morte (o enxame, o mímico, a sombra, a armadura e a vassoura
de lá, a criança fantasma), porque o dono mandou não mexer nela; o fantasma não foge para o Plano Etéreo (os de P13 são
o que a purificação pede, e um que sumisse trancaria a cripta); e o que não tem como existir numa grade: a Detecção de
Vida da banshee (8 km), o Ler Pensamentos e a Percepção Estranha fora de diálogo, a Forma Imutável (o jogo não tem magia
de mudar a forma), o Monstro de Cerco (monstro não ataca objeto).

### Os livros de D&D como dado: o Monster Manual (2026-11-09)

O dono pediu os onze livros (PHB, MM, DMG, VGM, XGE, MTF, TCE, FTD, AI, BGG, SCAG), traduzidos, sem o que já temos. Medido
no 5etools: ~840 criaturas novas (as 942 com token), ~266 magias, ~110 subclasses, ~45 raças e sub-raças, ~80 talentos,
~880 itens. A ordem combinada: o bestiário do MM, o PHB, XGE/TCE, os outros bestiários, o DMG e a lore.

**O MM entrou inteiro**: 366 criaturas novas (as outras 84 o jogo já tinha, `src/dev/bestiario/ja-temos.json`), com
token, ficha e lore em pt-br. O texto saiu da API de lotes a US$ 0,0135 por criatura (US$ 4,69 as 347, mais US$ 0,31 da
amostra de 20 e US$ 0,22 do casamento das magias); os números saíram do dado, sem modelo. Os nomes de uma mesma família
saíam diferentes de um pedido para outro (dragão "feérico" e "das fadas", "mefit" e "mefite", rã e sapo com o mesmo
nome): `bestiario/mm-nomes.json` fixa o padrão. Dois cuidados que custaram: o nome traduzido do ghast ("Lívido") é o id
do wight da Casa da Morte, e o primeiro download sobrescreveu a ficha dele — hoje o importador desvia de todo id dos
blocos feitos à mão, e a ficha voltou do git; e quatro descrições de ataque repetiam a notação do bloco impresso, que o
conferidor de colagem pegou — eram golpes que o conversor não lia (dano fixo, dois dados, a teia sem dano), e lidos
como golpe o texto nem entra.

**O motor ganhou** as AÇÕES LENDÁRIAS (depois do turno de outra criatura: um golpe do bloco ou a área em volta, como o
golpe de asa; voltam no começo do lado dela) e a PRESENÇA ATERRADORA (junto do multiataque; quem passa ou se livra não
teme mais aquela criatura), e o golpe que dá metade a quem passa no teste. As 366 lutam no simulador sem quebrar
(`src/dev/varrer-bestiario.mjs`).

**A fila do motor** (`bestiario/mm-pendente.json`): 309 traços, 159 ações e 10 reações que ainda são só texto, 16
criaturas com alguma ação lendária fora do golpe e da área, 37 com magia que ainda não temos (41 magias distintas, que a
fase do PHB traz), 5 sem golpe nenhum. As mais comuns: o segundo sopro dos dragões metálicos (20), mudar de forma (13),
Regeneração (11), Investida (11), Teleporte (9), Visão do Diabo (9), Explosão ao Morrer (7), Frenesi de Sangue (7),
Enxame (7), Salto (5), Aparar (5). Enquanto a fila não anda, quem depende dela luta abaixo do livro — o rakshasa e o
senhor das múmias perdem para um grupo de 7º nível.

### A fila do motor do MM (2026-11-09)

A fila caiu de 309 traços, 159 ações e 10 reações para 39, 63 e 4. Três caminhos: o que é SABOR numa luta de tabuleiro
(telepatia, respirar na água, as cores da idade, mudar de forma, falar com sapos) continua como texto, fora da fila; o
que o motor já fazia e o conversor não ligava (Aparar, as camuflagens, Visão do Diabo, Evasão, Ataque Furtivo, Emboscador,
Ataque Surpresa, Investida/Bote/Investida Pisoteadora como `investida` do golpe, Explosão ao Morrer, escavador); e motor
novo. **O motor ganhou**: a REGENERAÇÃO bloqueável pelo dano certo (e o troll que a 0 PV cai sem morrer e só morre se
começar o turno sem regenerar — sem fogo ou ácido ele sempre levanta, como no livro: a varredura deixou o troll de pé
por 30 rodadas contra heróis que não usam fogo); o ENXAME que golpeia com o dado menor ferido; Frenesi de Sangue,
Imprudente, Voo Rasante, Rampage, Fúria Ferida, Deslocamento, Sensibilidade à Luz (de qualquer fonte), Evitar (a evasão
em qualquer teste), Resistência a Expulsar, Absorção de Fogo, Furtividade nas Sombras; as AURAS (a de fogo do balor no
começo do turno dele; a de medo e o fedor no começo do turno de quem está perto, com imunidade a quem passa); o CORPO
QUENTE; a explosão ao morrer que FERE; a LUZ PRÓPRIA (o azer acende); os DOIS SOPROS dos dragões metálicos com uma
recarga só (e o Sopro Repulsor, que empurra); o mergulho e a investida sem teste; e as AÇÕES ESPECIAIS genéricas — o
olhar, o grito, a nuvem, a rajada (área ou alvo, teste, dano, condição, usos por dia, recarga), o toque que cura e o
teleporte —, com a IA que escolhe quando usar cada uma. Prova em `testes-bestiario.mjs` (45 provas); a varredura das 366
não quebra nenhuma.

**Medido** (40 lutas, `luta-sim2`): o devorador de mentes contra o 7º e o yeti contra o 5º, 100%; o balor contra o 15º,
90%; o diabo das profundezas contra o 15º, 0%; o dragão vermelho adulto contra o 14º, 5% — mais duro do que o orçamento
do livro diz, e a pergunta fica aberta: o dragão está forte demais (lendárias + presença + sopro) ou o herói de 14º do
simulador está fraco (sem itens mágicos, IA simples)? O senhor das múmias e o rakshasa continuam fracos: o poder deles
é magia que ainda não temos (vem com o PHB). **O que sobra** na fila é cauda longa, quase tudo de uma criatura só: o
engolir (5), o encanto (5), o etéreo (3), os filhos da noite (3), a posse do capa negra, os raios oculares do observador
e do tirano da morte, o cone antimagia, o cubo gelatinoso, o pudim negro que se divide, e as ações lendárias que não são
golpe nem área.

### A cauda longa do MM (2026-11-09)

A fila do conversor chegou a **zero**: 0 traços, 0 ações, 0 reações, 0 criaturas com ação lendária sem motor e 0 sem
golpe (só ficam as 37 com magia que ainda não temos, que vêm com o PHB). O motor novo mora em `rules/livro-motor.js`,
para `combat.js` não crescer mais: cada função é a regra de um traço ou de uma ação do livro, e o combate a chama no
ponto certo do turno.

**O que entrou.** ENGOLIR de verdade (o sapo, a rã, o behir, o remorhaz, a tarrasca, e a mordida que engole do verme
púrpura e do kraken): o engolido fica DENTRO (`engolido`: cego, contido, fora do alcance de todos lá fora, golpeando só
quem o engoliu), sofre o ácido no começo de cada turno de quem o engoliu, sai caído quando ele morre, e é VOMITADO
quando quem está dentro faz o dano do livro num turno e o engolidor falha Constituição. O ENGOLFAR do cubo gelatinoso
(Destreza ou dentro dele; a Força CD 12 tira). As condições que sorteiam o turno: DESNORTEADO (o d8 da Tagarelice da
boca tagarela e do Olhar Confuso do brutamonte umbral), EUFÓRICO (o d6 do dragão feérico), o RAIO CONFUSO do
espectador. Deformado (a maldição do fomoriano), inebriado (o toque da lâmia), surdo, de costas (o flumph), meio
congelado (o elemental da água), Maldição Vil, Fortalecido, Energia Negativa, Escudo Cintilante, Grito de Guerra,
Aumentado (o duergar, com o dobro dos dados). Traços: Forma Fluida (atravessa e não se espreme), Camuflagem, Reativo
(a marilith reage a cada turno), Cai de Costas, Assassinar, Transferir Dano, Comandar Mortos-Vivos, Corroer (a arma
perde dano, a −5 se desfaz; o pudim come madeira), Liberdade de Movimento, Imunidade à Magia Limitada (o rakshasa),
Carapaça Refletora (a tarrasca, que num 6 devolve a magia), Congelar, Consumir Vida, Salto Etéreo, Chão Aberrante
(terreno difícil que anda com a boca), Máscara Perturbadora, Escudo Pegajoso (a arma presa não golpeia), Incitar
Rampage, Fantasmas (as cópias do capa negra, que somem na luz plena), Couro Farpado, Espetar. As ações: o etéreo e o
teleporte do unicórnio como FUGA (`naoSeguraALuta`), a forma de névoa, puxar e arremessar o agarrado, a escuridão que
anda com o manto sombrio, a telecinese do poltergeist, as antenas do monstro da ferrugem (a armadura de metal perde CA,
e `equipment.js armorClass` lê isso), as invocações (os Filhos da Noite chegam em 1d4 rodadas, as árvores do ente só
com árvore perto), o Rugido da androesfinge em três estágios, o Salto Mortal do bulette, e os alvos várias vezes, o
dreno que cura, a queda a 0 PV (com a condição de quem PASSA, no Uivo do semilich) e a vida máxima que cai. Os RAIOS
OCULARES do observador e do tirano da morte, que o conversor lia como um sopro em cubo de 3 m: dez raios sorteados sem
repetir, cada um num alvo fora do próprio cone, com a telecinese, o sono, a pedra (Destreza, não Constituição), o pó e a
morte. O CONE ANTIMÁGICO (dentro dele não se conjura nem se é alvo) e o CONE DE ENERGIA NEGATIVA (não se cura, e o
humanoide que cai ali levanta zumbi do tirano). As AÇÕES LENDÁRIAS passaram a ter catorze formas (golpe, área, alvo, a
ação especial de novo, raio, magia e truque, teleporte, mover, cura própria, escudo, reforço, corte da cura, a tinta do
kraken), escolhidas na ordem do que vale agora (`livro-motor.js escolherLendaria`).

**Defeitos que a cauda achou.** O agarrão das mordidas nunca era lido: o dado escreve `{@condition grappled} (escape`,
e a regra esperava `grappled (escape` — o sapo, o crocodilo e dezenas de outros mordiam sem segurar. O dano FIXO do
bloco ("1 de perfurante", a mordida do dragão feérico) quebrava o registro do ataque quando chegava como texto
(`dice.js parseDice` passou a aceitar o número sozinho). E quem vira pedra contava como de pé: o grupo inteiro
petrificado pela medusa ou pelo raio seguia "lutando" para sempre; hoje é derrota, como cair. E uma de tática, que a varredura mostrou: o observador apontava o cone antimágico para o grupo inteiro, e como o cone corta os raios dele também, passava a luta só mordendo (31 rodadas); hoje o cone deixa alguém de fora para os raios, e a mesma luta acaba em 5 a 7 rodadas. Provas em
`testes-bestiario.mjs` (55); a varredura das 366 não quebra nenhuma. Ficam sem fim, de propósito, o troll (sem fogo nem
ácido ele sempre levanta) e o rakshasa (os heróis do simulador só têm magia de 6º círculo ou menos, que não o tocam).

### As magias do PHB (2026-11-09)

O PHB tem 361 magias; 225 já estavam no jogo (`bestiario/magias-en.json`), e as **136 que faltavam** entraram como dado:
o texto pela API de lotes (US$ 0,80 ao todo, US$ 0,0059 cada, com as nossas palavras), os números do dado do 5etools.
**A lição desta leva: a leitura automática do dado não basta para magia.** O rascunho errava justo nas que importam — a
Barreira de Lâminas saía como dano num alvo só, a Palavra de Poder Atordoar ganhava um teste que o livro não dá, o Geas
virava dano psíquico, a Aura Sagrada virava uma área que cega —, então a mecânica de cada magia que o motor conjura está
numa tabela escrita à mão e conferida contra o livro (`src/dev/magias/ajustes-phb.mjs`), com a simplificação de cada
uma escrita na própria descrição. **33 conjuram** (Ferir, que não deixa abaixo de 1 PV e tira PV máximo; Praga; Onda
Destrutiva, que poupa os aliados; Tempestade de Fogo; Bola de Fogo Controlável; Esfera Congelante; Explosão Solar; Raio
Solar; Praga de Insetos e Nuvem Incendiária como zonas; Barreira de Lâminas como muralha; Tentáculos Negros; Terremoto;
Confusão; os três Dominar, que fazem o dominado golpear os próprios aliados no turno dele e se livrar a cada dano;
Sugestão em Massa; Carne para Pedra; Palavra de Poder Atordoar e Dança Irresistível, sem teste na hora; Enfraquecer o
Intelecto; Contágio; Viagem Planar como a magia de mandar embora; Globo de Invulnerabilidade, que barra magia de 5º ou
menos lançada de fora; Escudo de Fogo; Limpar a Mente; Visão da Verdade; Aura Sagrada; Destruição Cambaleante; Parar o
Tempo, com os turnos seguidos; Restauração Maior; Regeneração). **103 entram sem motor**: o texto aparece e o motor as
recusa ("ainda sem efeito no jogo") — utilidade de exploração, invocação, transformação, viagem; a fila delas é
`magias/phb-pendente.json`. O bestiário do MM tinha 37 criaturas esperando magias; hoje são **0**, e a IA do conjurador
ganhou a magia que tira alguém da luta (o lich abre com a Palavra de Poder; o senhor das múmias, com o Ferir).

**Medido** (30 lutas, `luta-sim2`): o lich contra o 17º, 20% de vitória do grupo; o senhor das múmias contra o 12º e o
arquimago contra o 9º, 100%. O rakshasa contra o 12º não acaba, e é o livro: imune a arma comum e a toda magia de 6º
círculo ou menos, ele só cai para um grupo com arma mágica, que o herói do simulador não tem. Provas em
`testes-magias-livros.mjs` (8); a bateria inteira segue verde, e a colagem em 0 (dois trechos do texto gerado
coincidiam com o livro e foram reescritos).

### As magias de combate do PHB (2026-11-09)

A segunda leva levou o PHB de 33 para **65 magias que conjuram** (das 136 que entraram); a fila tem 71. O motor ganhou o
tipo `kind: 'livro'`, o da magia que nenhum tipo antigo conjurava: o efeito mora em `livro-motor.js conjurarDoLivro`,
pelo nome (`efeito`). Entraram as **invocações** pelos pacotes do Conjurar Animais (Seres da Floresta, Inseto Gigante,
Animar Objetos — os objetos têm bloco próprio em `monsters/magias.js`, a tabela da magia por tamanho), as
**transformações** pelo motor da Forma Selvagem (Metamorfose, Metamorfose Verdadeira, Formas Animais, Mudar de Forma: o
inimigo vira rã, o aliado vira a fera mais forte que o nível permite, e a concentração que cai devolve a forma), **dano e
controle** (Spray Prismático com o d8 dos raios, Palavra Divina pelos PV de agora, Sinistro que fere a cada falha,
Inverter a Gravidade, Olhar Perturbador, Compulsão, Tempestade da Vingança em quatro estágios, um por turno), as
**prisões** (Jaula de Energia, Esfera Resiliente, Labirinto sem teste e com a saída por Inteligência CD 20), as **auras e
campos** (Concha Antivida, Aura de Vida, Aura de Pureza, Círculo de Poder, Campo Antimagia, Dissipar o Bem e o Mal), as
**peças conjuradas** (Mão de Bigby com os PV de quem a conjura, Espada de Mordenkainen, Vinha Agarradora), os **golpes**
(Destruição Banidora, que bane quem fica com 50 PV ou menos; Aljava Veloz, os dois tiros a mais; Conjurar Rajada) e a
**cura** (Cura Completa em Massa, Palavra de Poder Curar), e a Telecinésia.

**Duas coisas que a leva achou.** A área `cube` do motor sai de QUEM CONJURA (é a da Onda Trovejante): as magias de cubo
mirado à distância (Tempestade de Fogo, Tentáculos Negros, Jaula) estavam pegando o quadrado ao lado do mago, e passaram
ao `square` no ponto mirado. E a tradução deu à Mudar de Forma o mesmo nome da Metamorfose Verdadeira, e uma apagava a
outra no catálogo; o importador agora para quando dois nomes em pt-br saem iguais. **Ficam de fora, e por quê:** nove
magias da tabela levam 1 minuto ou mais para conjurar no livro (Regenerar, os quatro Conjurar de 1 minuto, Criar
Mortos-Vivos, Tsunami, Aprisionamento, Presciência) — não cabem num turno de luta, e o jogo ainda não prepara nada antes
dela; a mecânica está escrita na tabela e a fila diz o motivo. Forma Etérea, Símbolo e Muralha Prismática não entraram
nesta leva. Provas em `testes-magias-livros.mjs` (15).

### A magia de cada classe (2026-11-09)

As listas por classe já existiam (`game/criacao.js listaDaClasse`, lidas na criação e na escolha de magia ao subir de
nível), mas eram escritas à mão e cresciam junto com o motor. Medido contra o livro (o de-para do 5etools,
`spells/sources.json`, que diz quem aprende cada uma das 361 magias), elas tinham um **defeito antigo maior que as
magias novas: faltavam 114 magias feitas à mão nas listas das classes que o livro as dá** — a Bola de Fogo, o Relâmpago,
o Voo e a Velocidade do mago, o Imobilizar Pessoa de seis classes, a Restauração Menor de cinco. Só o Ilvan pronto as
tinha, porque o grimório dele foi escrito à mão: um mago criado pelo jogador nunca as aprenderia subindo de nível. Hoje
o importador de magias escreve `rules/magias-por-classe-phb.js` (todas as magias do jogo que o PHB conhece, as feitas à
mão inclusive, com as classes do livro), e a lista de cada classe soma isso às escritas à mão. Medido de novo: **290
magias conferidas, 0 faltando**. As 65 magias novas que conjuram entram assim nas listas: o mago passou de 119 para 148
magias até o 9º círculo, o paladino ganhou a Aura de Vida e a Destruição Banidora, e os patronos do bruxo ganharam o que
o PHB lhes dá e o motor agora tem (Dominar Fera, Dominar Pessoa, Tentáculos Negros, Telecinésia). A magia sem motor não
entra em lista nenhuma (`magiaTemRegra`): aprender uma magia que não faz nada seria gastar a vaga. Quatro magias de
domínio e de círculo do druida estavam com um id que não batia com o das novas e foram acertadas. Fica como estava, e
dito aqui: o paladino tem Elo de Proteção e Oração de Cura, que o PHB de 2014 não lhe dá e o de 2024 dá. Prova em
`testes-magias-livros.mjs`.

### As magias de exploração do PHB (2026-11-09)

A fila do PHB sem efeito caiu de 71 para **27**: 44 magias passaram a ter efeito fora da luta, pelo sistema que já existia
(`rules/utilidade.js`, com a tabela nova em `rules/utilidade-livros.js`, o texto em `game/magias-fora-livros.js`), e
entram nas listas das classes. A maior parte reaproveita um efeito pronto: as **perguntas** da Comunhão (Adivinhação,
uma; Contatar Outro Plano, cinco, e quem falha a Inteligência CD 15 sofre 6d6 e enlouquece até o descanso longo; Comunhão
com a Natureza, o que espera e o que está armado no lugar), o **olho** da Clarividência (Olho Arcano, Vidência), a
**palavra** do Enviar Mensagem (Telepatia, Vínculo Telepático), o **Alarme** (Cão Fiel, Santuário Particular, Consagrar,
Proibição, Vigilância e Proteção: ninguém pega o grupo de surpresa ali), o **abrigo** da Pequena Cabana (Mansão
Magnífica, com o banquete na despensa), o **disfarce** (Aparência Enganosa, o grupo inteiro), o **Reviver** (Ressurreição,
com a penalidade e toda a vida; Ressurreição Verdadeira, sem penalidade; Reencarnação). E entraram efeitos novos: a
**Lábia** faz do d20 um 15 nos testes de Carisma; a **Missão** (Geas) faz o NPC ceder ao teste social como a Sugestão, mas
por trinta dias e sem acabar ao ser cumprida; **Modificar Memória** apaga do NPC a desconfiança e a mente lida; **Lendas e
Histórias** conta a lore do bloco da criatura; **Localizar Criatura** marca no mapa o inimigo escondido mais perto;
**Regeneração** devolve toda a vida; **Banquete de Heróis** dá, por um dia, imunidade a medo e a veneno, vantagem em
Sabedoria e +2d10 de PV máximo, que somem com o relógio; **Presciência** é a condição de combate, oito horas.

**A VIAGEM POR MAGIA** é na tela da região (`game/viagem-magica.js`): ao escolher o destino, quem tem a magia pronta ganha
a opção ao lado dos ritmos de marcha. O **Teletransporte** segue a tabela do livro pela familiaridade — Phandalin é muito
familiar, o lugar visitado foi visto de passagem, o resto se conhece por descrição —, com o acidente (3d10 em cada um e rola
de novo), o lugar parecido (o conhecido mais perto) e o fora do alvo (o dia vai na caminhada). A **Palavra de Recordação**
volta a Phandalin; o **Transporte pelas Plantas** pede um destino visitado com mata a uns 6 km (o mapa do terreno da
região); o **Caminhar no Vento** cruza qualquer distância da região em horas, sem estrada nem teste de encontro.

**O que só se narra**, e por quê: Tranca Arcana, Criar Passagem, Moldar Rochas, Mover a Terra, Controlar a Água, Controlar
o Clima, Fabricar, Criação, Baú Secreto, Terreno Alucinógeno, Miragem Arcana, Ilusão Programada, Projetar Imagem, Sonho e
Encontrar o Caminho mudam o mundo de um jeito que o tabuleiro ainda não guarda (a parede, a rocha, o clima, o objeto, o
lugar ilusório): gastam o espaço e o tempo e são narradas, como o Disco Flutuante e a Escrita Ilusória já eram, e o texto
de cada uma diz isso. **Ficam sem efeito (27)**: as de 1 minuto de combate (os Conjurar, Criar Mortos-Vivos, Tsunami,
Aprisionamento), Forma Etérea, Símbolo e Muralha Prismática, e as de sistema novo (Desejo, Portal, Simulacro, Clone,
Semiplano, Projeção Astral, Isolamento, Aliado Planar, Vínculo Planar, Despertar, Convocação Instantânea, Recipiente
Arcano, Contingência, Círculo de Teletransporte — que pede um círculo de destino, e a região não tem nenhum —, Portal
Arcano Antipatia/Simpatia e Caminhar em Árvores, que pula de árvore em árvore dentro da cena e espera o tabuleiro ter árvores que a regra enxergue). Provas em `testes-exploracao-livros.mjs` (5).

### A magia que o jogo não faz fica fora do jogo (2026-11-09)

Pedido do dono: as 27 magias do PHB sem efeito e as 15 que só se narrariam **não estão mais no jogo**. O importador
(`importar-magias.mjs`) não as escreve em `SPELLS` nem no de-para `bestiario/magias-en.json`; elas ficam só na fila
(`magias/phb-pendente.json`), cada uma com o motivo (o motor ainda não faz; leva 1 minuto e espera a preparação fora da
luta; só se narraria). Com isso o catálogo do PHB tem **94 magias, todas com efeito**, e nenhuma lista de classe oferece
magia que não faz nada. O preço: 12 conjuradores do MM voltaram a ter "magia que ainda não temos" (a Vidência do lich
ficou, as de narrar e as de sistema novo saíram), e o importador do bestiário os lista na fila dele.

### O resto do PHB: o que já havia, e os antecedentes (2026-11-09)

Medido contra o dado do 5etools (`backgrounds.json`, `feats.json`, baixados para `_referencias/5etools/outros/`): **as
raças e as subclasses do PHB já estavam todas no jogo** — as 15 raças e sub-raças e as 40 subclasses. Faltavam 9 dos 13
**antecedentes** e os 42 **talentos** (o jogo tem os 10 talentos de origem de 2024, como regra da casa no 1º nível).
Entraram os nove antecedentes (`game/criador.js`): Charlatão, Artista, Herói do Povo, Artesão de Guilda, Eremita, Nobre,
Forasteiro, Marinheiro, Órfão, cada um com as duas perícias do livro, o talento de origem do antecedente de 2024 de mesmo
nome ou do mais parecido (Herói do Povo -> Fazendeiro, Artesão de Guilda -> Artesão, Forasteiro -> Guia, Órfão ->
Andarilho) e o motivo de ir a Phandalin (texto nosso, sem gancho do livro por trás). O padrão do criador passou a usar
alguns deles (bárbaro e patrulheiro, Forasteiro; druida e monge, Eremita; paladino, Nobre). Prova em `testes-criador.mjs`.

### Os talentos do PHB, no lugar do aumento (2026-11-09)

Pedido do dono: o talento de **origem** de 2024 continua no 1º nível, e **nos níveis de aumento** o jogador troca o aumento
de atributo por um dos talentos do Livro do Jogador de 2014. Entraram **41 dos 42**: o Combatente Montado fica de fora,
porque o jogo não tem montaria. Oito existem nas duas versões (Alerta, Sortudo, Atacante Selvagem, Curandeiro, Iniciado em
Magia, Habilidoso, Vigoroso, Brigão de Taverna): no nível de aumento vale a de 2014, e quem já tem a de origem não pega a
mesma. O Robusto é o mesmo talento nos dois livros e usa o id de origem, `vigoroso`.

**O caminho é o das magias.** `src/dev/traduzir-talentos.mjs phb --go` escreveu `src/dev/talentos/phb-pt.json` pela API de
lotes (42 talentos, US$ 0,16), e `src/dev/importar-talentos.mjs` escreve `rules/talentos-phb-texto.js` (nome e descrição,
nossas palavras). A REGRA é a tabela à mão `rules/talentos-phb.js` (pré-requisito, o +1, o treino, as magias, as manobras,
e o `noJogo`, a frase do que o talento faz aqui), e o que cada um faz na luta mora em `rules/talentos.js`, como os de
origem. A escolha: `progressao.subirNivel` aceita `escolhas.talento` no lugar de `escolhas.asi` (e recusa o talento num
nível que não dá aumento); `game/nivel.js escolhaDeAumento` monta as opções; `view/nivel-tela.js` pergunta antes de subir,
como a subclasse, com a escolha a mais do talento (o atributo, o elemento do Adepto, a lista de magias) já no que o talento
sugere. O resto das escolhas (perícias, armas, manobras, as magias) sai do padrão e aparece na linha do que o nível deu. A
ficha passou a mostrar os talentos do herói, os de origem inclusive, que antes não apareciam em lugar nenhum.

**O motor ganhou o que os talentos pediam e o jogo não tinha.** As ações de **Agarrar** e **Empurrar** do herói (o livro:
cada uma toma um golpe da ação de Atacar, Atletismo contra o melhor de Atletismo e Acrobacia do alvo, no máximo um tamanho
maior; agarrar pede mão livre, e o agarrão acaba quando quem segura se afasta; a fuga é a disputa, e não uma CD fixa) — só
monstro agarrava. A **recarga** da besta, que era catálogo e nunca regra: um disparo por ação, por mais ataques que o herói
tenha (o Especialista em Besta ignora). E os golpes de ação bônus dos talentos (`combat.js golpesDeTalento`, no menu do
clique): o golpe extra do Mestre em Armas Grandes depois de crítico ou derrubada, a outra ponta da haste, a besta de mão, o
empurrão do escudo, a Investida depois da Disparada (+5 com 3 m em linha reta), o agarrão do Brigão depois do soco.

**Decisão de jogo, a mesma de sempre:** o que o livro deixa escolher na hora o motor escolhe, e só quando rende. O −5/+10 do
Mestre em Armas Grandes e do Atirador de Elite entra quando o dano esperado com ele é maior (contra o ogro, CA 11, entra;
contra CA 19, não); as reações (Sentinela, Matador de Magos, Duelista Defensivo, o escudo que zera a metade do dano)
saem sozinhas quando mudam o resultado; o Conjurador de Guerra troca o ataque de oportunidade por um truque só quando o
truque rende mais que a arma, e nunca gasta espaço. O Líder Inspirador e os pontos do Sortudo valem por luta, como os de
origem já valiam.

**O que ficou de fora de cada um**, por não ter onde valer: a parte de sabedoria da Mente Aguçada (o norte, as horas), os
idiomas e cifras do Linguista, a voz imitada do Ator, o arrastar quem se agarra, e a cobertura que a Sentinela e o
Matador de Magos dariam contra magia de área. O dado do Adepto Marcial é d6, e no Mestre de Batalha ele soma aos da classe
com o dado da classe. O Atirador Arcano e o Iniciado usam o atributo de conjuração que o herói já tem.

**Um defeito antigo saiu junto: o Vigoroso de origem sumia no 2º nível.** O PV máximo é recalculado do zero a cada nível
(`progressao.js`), e o +2 entrava só na criação: o guerreiro com Vigoroso tinha 14 PV no 1º e 20 no 2º, quando o certo é
24. Hoje ele está em `bonusDeVida`, +2 por nível em todo nível. Provas em `testes-talentos-phb.mjs` (36).

### O humano variante (2026-11-09)

O criador (`game/criador.js`, tela em `view/menu-herois.js`) passou a oferecer o **humano variante** do Livro do Jogador:
+1 em dois atributos quaisquer (o Carisma vale, ao contrário do meio-elfo), uma perícia qualquer e um talento do PHB no
1º nível, **além** do talento de origem que todo herói ganha (regra da casa). O pré-requisito do talento se confere no herói
do 1º nível (`talentosDoVariante`): os atributos finais, o treino de armadura da classe e se a classe já conjura no 1º — o
guerreiro e o paladino não pegam o Conjurador de Guerra, o mago pega; o que não cabe aparece apagado, com o motivo. O
talento vai na definição (`talentoDaRaca`) e `criacao.js montarHeroi` o aplica por cima do de origem, pela mesma porta dos
níveis de aumento. O de origem não pode ser a versão de 2024 do mesmo talento (`origemEmConflito`): o padrão do preparo troca
sozinho, e escolher o repetido aparece como problema.

**O PV saía errado quando o talento mexia nele.** `montarHeroi` monta a ficha antes de pôr os talentos, e o PV não era
recalculado: o Vigoroso do variante e o +1 de Constituição do Durável não entravam no 1º nível. A conta do PV de
`subirNivel` virou função exposta (`progressao.recalcularVida`), e `montarHeroi` a chama no fim. **E o Móvel perdia os 3 m ao
carregar o save**: `racas.aplicarRaca` roda de novo no carregamento e reescrevia o deslocamento com o da raça; agora soma o
do talento. Provas em `testes-criador.mjs` (19, quatro novas).

### As magias do Guia de Xanathar (2026-11-09)

O mesmo caminho do PHB: `traduzir-magias.mjs xge --go` (95 magias, US$ 0,52), a tabela à mão `src/dev/magias/ajustes-xge.mjs`
conferida contra o dado do livro, e `importar-magias.mjs xge`, que escreve `rules/magias-livro-xge.js` e
`rules/magias-por-classe-xge.js`. **66 entram no jogo; 29 ficam na fila** (`magias/xge-pendente.json`): as de 1 minuto ou
mais de conjuração (Cerimônia, Armadilha, Servo Minúsculo, Encontrar Montaria Maior, Criar Homúnculo, Bosque Druídico,
Chamado Infernal, Fortaleza Poderosa, Templo dos Deuses), as que só se narrariam (Controlar Chamas, Moldar Terra, Moldar
Água, Escrita Celeste, Vínculo com Besta, Cochilo, Aprimorar Perícia) e as de sistema que o jogo não tem (os dois
Invocar Demônio, que chamam criatura que não obedece; Metamorfose em Massa; Dragão Ilusório; Redemoinho; Ossos da Terra;
Fúria da Natureza; Transmutar Rocha; Controlar Ventos; Esfera Aquosa; Pirotecnia, que pede uma chama no mapa; Dispersar;
Gaiola de Almas). A tradução deu o mesmo nome, Redemoinho, a Whirlwind e a Maelstrom: a Maelstrom virou **Turbilhão**.

**As listas das classes**: no Xanathar elas vêm em `classVariant`, com o livro que as definiu; o importador passou a ler
essa chave (só as do próprio livro: as listas opcionais do Tasha ficam para o Tasha). Os truques novos entram nos truques
de cada classe. E a CRIAÇÃO do herói lia só a lista escrita à mão do 1º círculo, não a completa: a Faca de Gelo e o
Absorver Elementos nunca apareciam ali. Agora lê `listaDaClasse`.

**O que o motor ganhou**, cada peça para uma ou mais magias:
- **A ação que uma magia concede** (`rules/magias-concedidas.js`): o sopro que o Sopro do Dragão dá a quem foi tocado (até a
  quem não conjura), os meteoros de Melf, as estrelas da Coroa, as pedras encantadas, o jato de cada Investidura, o raio da
  Esfera da Tempestade. São magias internas de círculo 0, sem escala de truque e fora de toda lista, que entram na lista de
  quem as tem enquanto a condição ou a concentração durar (`spells.js magiasProntas`); `cargaDe` gasta os usos e
  `daCondicao` tira o tipo, o dano e a CD da condição.
- **O efeito `conceder`** (`livro-motor.js`) que põe essas condições, com o tipo escolhido, as cargas, os PV temporários
  (Tenser, a Grande Árvore) e a espada da Lâmina Sombria, que entra na mão e sai quando a magia acaba.
- **Efeitos próprios**: o Raio do Caos (o tipo por um dos d8, e o salto quando os dois saem iguais), a Faca de Gelo (a
  explosão que pega o alvo e quem está colado, acertando ou não), a Transferência de Vida, o Golpe do Vento de Aço e a
  Ruína Elemental.
- **O teleporte que explode e que se repete**: o Passo Trovejante leva o aliado colado mais ferido e o estrondo fere quem
  ficou perto da saída; o Passo Distante teleporta de novo a cada ação bônus, sem espaço.
- **No teste da magia**: o dado maior contra quem já está ferido (Dobre Fúnebre), o dano inteiro mesmo no sucesso (Prisão
  Mental), a parte do dano que volta a quem conjurou (Enervação), o ácido que volta no fim do próximo turno (Esfera
  Vitriólica).
- **Na zona**: a que CURA o aliado, com usos (Espírito Curador), a que dá exaustão (Radiância Nauseante) e o truque de
  zona que cresce com o nível (a Fogueira).
- **A reação do Absorver Elementos**, automática quando o golpe elemental é de 8 ou mais, ou derrubaria.
- **Condições** com o que cada magia faz: a Palavra de Poder Dor (no máximo 3 m de passo), o Preso à Terra (o voo cai), o
  Golpe de Zéfiro (sem ataque de oportunidade, e uma vez vantagem e +1d8), o Vento Protetor, o Guardião da Natureza, a
  Sombra de Moil (que devolve 2d8 a quem acerta a 3 m), a Transformação de Tenser (um golpe a mais e nada de magia), as
  Investiduras e o Inimigos em Abundância, que ataca alguém sorteado como o confuso.
- A Dança Macabra é de concentração: os mortos caem quando ela acaba.

**O que a importação achou e corrigiu**: a condição nova `armaSagrada` (a Arma Sagrada do Xanathar) tinha o mesmo nome da
do paladino da Devoção e a apagava; a prova de passivas pegou, a da magia virou `armaSagradaDaMagia`, e uma prova nova
recusa nome de condição repetido. **O som**: o fogo passou de 24 magias e a maldição de 50, e as três notas de dano e as
oito das outras famílias não as separavam; abriram-se notas que só as magias dos livros usam (`GRAUS_DO_DANO` ganhou −4 e
5, e `GRAUS_EXTRA`, −7 e 14), e a magia feita à mão continua com o som de sempre.

Provas em `testes-magias-xge.mjs` (22). Uma varredura conjurou cada uma das 66 magias e das 9 ações concedidas numa luta, e
nenhuma lançou exceção.

### As magias do Caldeirão de Tasha (2026-11-09)

O mesmo caminho: `traduzir-magias.mjs tce --go` (21 magias, US$ 0,11), a tabela `src/dev/magias/ajustes-tce.mjs` e
`importar-magias.mjs tce` (`rules/magias-livro-tce.js`, `rules/magias-por-classe-tce.js`). **20 entram; 1 fica na fila**:
o Sonho do Véu Azul, de 10 minutos de conjuração, que leva o grupo a outro mundo. As listas opcionais que o Tasha dá às
magias do PHB (a "lista expandida" de cada classe) não entraram: são regra opcional do livro, e ficam para quando o dono
pedir.

**As nove invocações** chamam os espíritos de `rules/monsters/espiritos-tce.js`, um bloco-base por forma (a besta do ar,
da terra e da água; o feérico; a cria das sombras; o morto-vivo fantasmagórico, pútrido e esquelético; a aberração
observador, slaad e cria estelar; o constructo de argila, metal e pedra; o elemental dos quatro; o celestial vingador e
defensor; o corruptor demônio, diabo e yugoloth), com os números do bestiário do Tasha (baixado do espelho do 5etools para
`_referencias/5etools/bestiary/bestiary-tce.json`, fora do repositório). `escalarEspirito` faz a conta do livro na hora da
invocação: CA base + círculo, PV do mínimo + os de cada círculo acima, o ataque de magia de quem conjura, o dano + o
círculo, a CD de quem conjura nos efeitos e golpes iguais à metade do círculo. Cada espírito leva a sua cópia dos golpes —
`makeMonster` divide o array do bloco entre todos os que nascem dele, e escalar em cima do bloco mudaria o espírito
anterior. A figura é a ficha de uma criatura parecida (o lobo, a sombra, o observador, o golem de ferro, o deva...). O que
cada forma faz e o motor ainda não faz (os humores do feérico, a aura que envenena, a explosão do demônio) vai na nota da
magia.

**O resto**: a Lâmina Trovejante e a Lâmina de Chama Esverdeada (o golpe com a arma como parte do truque; o trovão em quem
sai do lugar por vontade, a chama que salta para quem está colado no alvo, e os dados a mais no 5º, 11º e 17º nível); a
Atração Elétrica; a Lasca Mental (−1d4 na próxima resistência); a Explosão de Lâminas; a Infusão Cáustica (o ácido no
começo de cada turno, uma condição que carrega o próprio dano, `danoNoInicio`); o Chicote Mental; a Fortaleza do
Intelecto; a Mortalha Espiritual (o dano a mais só a até 3 m, e quem é ferido não se cura até o próximo turno); a
Aparência Extraplanar; e a Lâmina do Desastre (a arma de magia que golpeia duas vezes e é de concentração).

Provas em `testes-magias-tce.mjs` (12). A varredura conjurou as 20 numa luta sem exceção, e os 22 espíritos acham ficha.

### A lista expandida do Tasha (2026-11-09)

O Tasha acrescenta magias à lista de cada classe ("Additional Spells"), das do PHB, do Xanathar e dele mesmo. No dado do
5etools são as entradas `classVariant` com `definedInSource: 'TCE'`: 122 ao todo, 111 de magias que o jogo tem.
`src/dev/lista-expandida-tce.mjs` escreve `rules/magias-por-classe-tce-expandida.js` (67 magias, magia -> classes), e
`game/criacao.js` a soma às listas, então valem na criação, na subida de nível e na preparação. Exemplos: o Comando do
bardo, o Auxílio e a Restauração Maior do patrulheiro, a Graxa e a Mão de Bigby do feiticeiro, a Aura de Vida e a
Explosão Solar do clérigo, o Sinistro do bruxo, o Cone de Frio do druida, a Oração de Cura do paladino, o Falar com os
Mortos do mago. Ficam de fora as oito que o jogo não tem (Antipatia/Simpatia, Semiplano, Portal, Vínculo Planar,
Muralha Prismática, Símbolo, Círculo de Teletransporte, Sonho do Véu Azul). O livro trata a lista como regra opcional;
aqui ela vale sempre. Prova em `testes-magias-tce.mjs`.

### As subclasses dos livros: o primeiro lote do Xanathar (2026-11-09)

Os livros pedidos trazem 68 subclasses: Xanathar 31, Tasha 26, Costa da Espada 6, Livro do Mestre 2, Fizban 2, Bigby 1.
O texto (o nome brasileiro da subclasse e o nome e a regra de cada recurso, com as nossas palavras) sai de
`src/dev/traduzir-subclasses.mjs <livro>` pela API de lotes, um pedido por subclasse: Xanathar e Tasha custaram US$ 0,74
(57 subclasses). A REGRA é uma tabela à mão por livro, `rules/classes/subclasses-xge.js`: as subclasses no formato das
feitas à mão (níveis, recursos, escalas, escolhas, magias do domínio) e, por recurso, o tipo, se o motor o faz ou por que
o jogo não o faz, e a nota do pedaço que fica de fora. `src/dev/importar-subclasses.mjs <livro>` casa a tabela com o texto
e escreve `rules/classes/caracteristicas-<livro>.js`; `classes/index.js` põe as subclasses nas classes (depois das feitas
à mão, então a do SRD continua sendo o padrão) e `classes/caracteristicas.js` põe os recursos no catálogo. O que os
recursos fazem numa luta mora em `rules/subclasses-livros.js`, chamado de ganchos de uma linha em `combat.js`. Uma
subclasse só entra quando o que ela faz em luta funciona; o resto da fila são as outras 60.

**Entraram oito.** Bárbaro: o **Guardião Ancestral** (a marca no primeiro acerto em Fúria, com a desvantagem e a
resistência; o Escudo Espiritual de 2d6 a 4d6 na reação; os Ancestrais Vingativos devolvendo o evitado), o **Arauto da
Tempestade** (a aura de deserto, mar ou tundra ao entrar em Fúria e como ação bônus; a Alma da Tempestade; a Tempestade
Protetora nos aliados da aura; a Tempestade Furiosa das três) e o **Fanático** (a Fúria Divina, o Foco Fanático, a
Presença Zelosa e a Fúria Além da Morte: a 0 PV em Fúria ele segue de pé, rola contra a morte, e as três falhas só o
matam quando a Fúria acaba). Bardo: o **Glamour** (o Manto de Inspiração; o Manto de Majestade, com o Comando sem espaço
como ação bônus enquanto a concentração dura, uma ação concedida de `magias-concedidas.js`; a Majestade Inquebrável, que
barra o ataque como o Santuário), as **Espadas** (cimitarra, armadura média, Duelismo ou Duas Armas, os três floreios
como interruptores, o passo de 3 m, o Ataque Extra e o d6 do mestre) e os **Sussurros** (as Lâminas Psíquicas).
Clérigo: a **Forja** (a bênção na armadura ou na arma, a Alma e o Santo da Forja, o Golpe Divino de fogo) e a
**Sepultura** (a cura no máximo em quem está a 0 PV, o Poupar os Moribundos a 9 m como ação bônus, o Caminho para a
Sepultura, a Sentinela na Porta da Morte, a Conjuração Potente e o Guardião das Almas). As duas do clérigo também estão
no criador, que escolhe o domínio no 1º nível.

**O que fica de fora, e por quê**, está na própria tabela (`semEfeito`): o que é de fora da luta e o jogo não tem —
Consultar os Espíritos, Guerreiro dos Deuses, a Apresentação Fascinante, as Palavras de Terror, o Manto de Sussurros, o
Saber das Sombras, a Bênção do Artesão e os Olhos da Sepultura. As reações automáticas (o Escudo Espiritual, a
Sentinela, o Foco Fanático) dizem na ficha quando saem. Os Golpes Abençoados, que o Tasha dá como opção à Forja e à
Sepultura, não entram: são regra opcional de outro livro.

**Um defeito antigo saiu junto**: a condição que dá vantagem nas jogadas de ataque (`vantagemNosAtaques`) não chegava ao
ataque, porque a soma das condições (`conditions.js conditionEffects`) não a lia. A Presciência prometia vantagem nos
ataques desde que entrou e nunca a deu; a Presença Zelosa expôs isso.

Provas em `testes-subclasses-xge.mjs` (20), todas sobre o Encounter de verdade.

### O segundo lote do Xanathar: guerreiro e ladino (2026-11-09)

**Entraram sete.** Guerreiro: o **Arqueiro Arcano** (a perícia de saber; o Disparo Arcano como interruptor, com dois usos
que voltam no descanso curto e cinco das oito opções — o Banidor, o Encantador, o Explosivo, o Debilitante e o Sombrio,
que dobram no 18º; a Flecha Mágica; o Disparo Curvo, que vira o erro para outro inimigo com a ação bônus; o Disparo
Sempre Pronto), o **Cavaleiro** (a Marca Inabalável, com a desvantagem do marcado e o golpe de ação bônus no turno
seguinte ao que ele fere outro; a Manobra de Proteção, +1d8 na CA e resistência ao que ainda acerta; Manter a Linha, em
que andar dentro do alcance provoca e o golpe que acerta para; a Investida Feroz pela reta andada; o Defensor
Vigilante, uma reação de oportunidade por criatura) e o **Samurai** (o Espírito de Luta; o Cortesão Elegante, com a
resistência de Sabedoria e a Persuasão; o Espírito Incansável; o Golpe Rápido, que troca a vantagem de um ataque por um
ataque a mais). Ladino: o **Espadachim** (o Gingado, a Audácia Desenfreada no Furtivo e na iniciativa, o Panache, a
Manobra Elegante, o Mestre Duelista), o **Batedor** (Natureza e Sobrevivência dobradas, +3 m, a vantagem na iniciativa e o
alvo exposto da 1ª rodada, o Golpe Súbito com o Furtivo de novo noutro alvo), o **Inquisitivo** (o Combate Perspicaz e o
Olho para Fraquezas) e o **Mentor** (a ajuda como ação bônus, a 9 m, e a Desorientação).

**De fora, com o motivo na tabela**: a montaria do Cavaleiro, o turno extra da Força Antes da Morte (o jogo não tem turno
fora da ordem), o passo de reação do Escaramuçador (nem movimento fora do turno), a Intuição contra mentira, o procurar
dentro da luta, as ilusões marcadas sem desfazê-las, os kits e idiomas do Mentor. Do Disparo Arcano ficam o Perfurante e
o Buscador, que não rolam ataque, e a Flecha Agarradora, que fere quem anda. O texto das cinco opções é nosso, escrito à
mão na tabela (`T` em `subclasses-xge.js`): o dado do livro guarda as opções fora da subclasse.

O motor ganhou o que eles pediam e não tinha: a reta andada sabe em que turno foi (`retaAndada.vez`), o ataque pode vir
com vantagem dada por quem chama (`resolveAttackBase` `vantagem`), e o Disparo Curvo refaz o ataque sem fazer a curva de
novo (`curvo`). A ajuda do Mentor só se gasta no ataque de verdade: o cálculo de vantagem também serve à prévia do
tabuleiro, e gastar ali a apagaria antes do golpe. Provas em `testes-subclasses-xge.mjs` (35). No navegador, os botões
do Espírito de Luta e do Disparo Banidor aparecem na barra e funcionam no clique.

### O terceiro lote do Xanathar: monge, paladino e patrulheiro (2026-11-09)

**Entraram oito.** Monge: o **Mestre Bêbado** (Atuação; a Rajada que dá Desengajar e +3 m; levantar por 1,5 m; o golpe
de perto que erra o monge acerta outro inimigo colado nele, por 1 ki; a Sorte do Bêbado, que tira a desvantagem por 2
de ki; e o Frenesi Embriagado, a Rajada que bate em cada inimigo colado), o **Kensei** (as armas kensei, treinadas e de
monge, à distância inclusive; o Aparo Ágil; o Tiro do Kensei; a arma mágica e o Golpe Hábil; Afiar a Lâmina; a
Precisão Infalível) e a **Alma Solar** (o Raio de Sol, uma "arma" de 9 m que não é item, e os dois raios de ação bônus
por 1 ki; o Golpe do Arco Abrasador, Mãos Flamejantes de ação bônus depois de atacar, pago em ki pelo caminho das
disciplinas elementais; a Explosão Solar Abrasadora, com 2d6 a mais por ki; o Escudo Solar). Paladino: a **Conquista**
(a Presença Conquistadora; o Golpe Guiado, que é o mesmo recurso do clérigo da Guerra; a Aura de Conquista, que para e
fere quem o paladino amedronta; a Repreensão Desdenhosa; o Conquistador Invencível) e a **Redenção** (o Emissário da
Paz; Repreender os Violentos; a Aura do Guardião, que toma para o paladino o golpe que derrubaria um aliado; o Espírito
Protetor; o Emissário da Redenção, que resiste a quem ele não feriu e devolve metade em radiante). Patrulheiro: o
**Perseguidor Sombrio** (Sabedoria na iniciativa e o ataque a mais da 1ª rodada; a Visão Umbral, que soma visão no
escuro e o esconde no breu de quem só vê por ela; a Mente de Ferro; a Rajada do Perseguidor; a Esquiva Sombria), o
**Andarilho do Horizonte** (o Guerreiro Planar; o Passo Etéreo, pelo etéreo que o Piscar já usa; o Golpe Distante; a
Defesa Espectral) e o **Matador de Monstros** (o Sentido do Caçador; a Presa do Matador; a Defesa Sobrenatural; o
Nêmesis dos Conjuradores, que entra pela mesma porta da Contramágica; o Contra-Ataque do Matador). As magias de
juramento e de subclasse do patrulheiro entram sempre prontas, menos o Círculo de Teletransporte, que o jogo não tem.

**De fora**: os suprimentos de cervejeiro e de caligrafia, o Detectar Portal (o jogo não tem portais planares), o
teleporte contra o Nêmesis e o teste de escapar do agarrão da Defesa Sobrenatural. O que o jogo decide sozinho está na
nota de cada recurso (as reações automáticas, o Golpe Distante saltando para o lado do alvo).

**O que o motor ganhou**: o golpe do monstro diz quem obriga a resistência (`forcandoTeste`), para a Defesa Sobrenatural
e o Contra-Ataque saberem que foi a presa; a magia de ki tem teto próprio (`teto: 'metade'`, a Alma Solar gasta até
metade do nível, e não a tabela dos Quatro Elementos); a arma que não é item não precisa estar na mão (`naoEItem`); e o
golpe redirecionado ACERTA a outra criatura, sem nova jogada nem alcance. No navegador, os botões da Presença
Conquistadora, do Passo Etéreo e do Afiar a Lâmina aparecem na barra e a Presença sai no clique. Provas em
`testes-subclasses-xge.mjs` (50).

### O último lote do Xanathar: os conjuradores (2026-11-09) — as 31 subclasses do livro estão no jogo

**Entraram oito.** Druida: os **Sonhos** (o Bálsamo da Corte de Verão, com a reserva de d6 e os PV temporários; os
Caminhos Ocultos, um teleporte de 18 m pago em usos, pela mira de casa que o Passo Nebuloso já usa) e o **Pastor** (o
Totem Espiritual do urso, do falcão e do unicórnio; o Invocador Poderoso, que dá 2 PV por dado de vida e golpes mágicos às
feras e fadas que as magias do druida chamam; o Espírito Guardião; a Invocação Fiel, quatro javalis gigantes quando ele
cai). Feiticeiro: a **Alma Divina** (a lista do clérigo na escolha de magias, a magia da afinidade, o Favorecido pelos
Deuses, a Cura Fortalecida, as Asas de Outro Mundo, a Recuperação Sobrenatural), a **Magia das Sombras** (visão de 36 m,
a Escuridão por 2 pontos de feitiçaria quando não há espaço, a Força do Túmulo, o Cão do Mau Agouro, o Caminhar nas
Sombras de uma sombra para outra, a Forma Umbral) e a **Tempestade** (o salto de 3 m pelo ar depois de uma magia, o
Coração da Tempestade, a Fúria da Tempestade, a Alma do Vento). Bruxo: o **Celestial** (Chama Sagrada e Luz de graça, a
Luz Curativa, a Alma Radiante, a Resiliência Celestial ao fim de cada descanso, a Vingança Abrasadora no lugar do teste
contra a morte) e o **Lâmina Maldita** (o Carisma na arma de uma mão, a maldição com a proficiência no dano e o crítico
com 19, a cura quando o amaldiçoado morre, o Espectro Amaldiçoado, a Armadura de Maldições, o Mestre das Maldições). E a
lista expandida dos dois patronos entra na escolha de magias do bruxo. Mago: a **Magia de Guerra** (a Deflexão Arcana,
que depois deixa só truques, a Astúcia Tática na iniciativa, o Surto de Poder, a Magia Durável, a Mortalha Defletora). As
cinco do feiticeiro e do bruxo também estão no criador, que escolhe a subclasse no 1º nível.

**De fora, com o motivo na tabela**: a Lareira de Luar e Sombra (acampamento no mapa), o Andarilho dos Sonhos (Sonho,
Vidência e Círculo de Teletransporte), a Fala da Floresta e o Falante dos Ventos (idiomas), o Guia da Tempestade (chuva e
vento com direção), e os pedaços que a nota de cada recurso diz: levar outra criatura pelos Caminhos Ocultos, enxergar
através da própria Escuridão, atravessar criaturas e objetos, dar voo aos aliados, os PV temporários dos aliados na
Resiliência Celestial, os surtos ganhos pela Contramágica. A lista do clérigo da Alma Divina vale ao subir de nível; na
tela de criação do 1º nível ainda entram só as do feiticeiro.

**O que o motor ganhou**: a ação de subclasse que se paga com um recurso próprio (`recursoDe`), a que só sai logo
depois de uma magia (`depoisDeMagia`) e a que só sai de uma sombra para outra (`exigeSombra`); a tabela de magias de
subclasse que é função do personagem (a afinidade da Alma Divina); e o voo do feiticeiro que conta como estar no ar.
**Um teste antigo** contava exatamente oito subclasses de mago: passou a contar as oito do Livro do Jogador, porque a
Magia de Guerra é a nona. No navegador, os três azulejos do Totem aparecem na barra, e a Luz Curativa do menu do aliado
curou o Pip de 58 para 66 PV com três dados. Provas em `testes-subclasses-xge.mjs` (64).

### O Caldeirão de Tasha, primeiro lote: bárbaro, bardo e clérigo (2026-11-09)

O Tasha tem 26 subclasses sem as do artífice, que não entram porque o jogo não tem a classe. O caminho é o mesmo do
Xanathar: a tabela à mão `rules/classes/subclasses-tce.js`, o texto de `importar-subclasses.mjs tce`
(`caracteristicas-tce.js`) e o motor em `rules/subclasses-livros.js`. Os Golpes Abençoados, que o próprio livro oferece
como troca do Golpe Divino e da Conjuração Potente, não entram: o jogo segue com o recurso de sempre.

**Entraram sete.** Bárbaro: o **Caminho da Fera** (a Fúria tem três botões, um por arma natural: a mordida que cura
abaixo da metade, as garras com o golpe a mais, a cauda de 3 m que soma 1d8 à CA na reação; a arma natural mágica no
6º; a Fúria Infecciosa; o Chamado da Caçada) e o **Caminho da Magia Selvagem** (os oito surtos da tabela do bárbaro ao
entrar em Fúria — o necrótico, o teleporte, o espírito que explode, a arma de energia, a retaliação, as luzes, as
flores e o raio que cega; a Magia Fortalecedora, que devolve um espaço de magia ou dá +1d3 nos ataques; a Resposta
Instável; o Surto Controlado). Bardo: a **Criação** (a Partícula de Potencial, que estoura em trovão no ataque e dá PV
temporários na resistência; a Apresentação Animada, com o item dançante em `monsters/espiritos-tce.js`) e a
**Eloquência** (a Língua de Prata, as Palavras Perturbadoras, a Inspiração Infalível e a Infecciosa). Clérigo: a
**Ordem** (a Voz da Autoridade, em que o aliado que a magia mira ataca com a reação; a Exigência da Ordem; a Encarnação
da Lei como interruptor; o Golpe Divino psíquico; a Ira da Ordem), a **Paz** (o Vínculo Encorajador, o Bálsamo da Paz,
o Vínculo Protetor, o Vínculo Expansivo) e o **Crepúsculo** (visão de 90 m, a Bênção Vigilante, o Santuário do
Crepúsculo, os Passos da Noite, a Mortalha). Os três domínios estão no criador.

**De fora, com o motivo na tabela**: a Consciência Mágica, a Atuação da Criação e o Crescendo Criativo, a Fala
Universal; e os pedaços da nota de cada recurso (nadar, escalar e o salto maior da Alma Bestial; largar o que segura na
Exigência; o Bálsamo da Paz, em que o clérigo não anda e cura quem alcançaria; a esfera do Santuário, que não muda a
luz do mapa).

**O que o motor ganhou**: a arma natural que só existe em Fúria (`daFuria`) e as três da Fera; o dado da Inspiração de
Bardo, que agora avisa quando é usado (`depoisDaInspiracao`, no ataque e na resistência); e a arma em lista que se
escolhe com a Fúria. No navegador, os três botões de Fúria da Fera aparecem na barra, e o da cauda põe o bárbaro em
Fúria com a cauda na mão. Provas em `testes-subclasses-tce.mjs` (13).

**A colagem pegou a tradução**: o texto dos Passos da Noite que veio do lote repetia dez palavras do livro. Ele foi
reescrito à mão na tabela (`texto` no recurso, que o gerador usa no lugar do traduzido), e o conferidor voltou a 0. A
tradução pelo lote pede as nossas palavras, mas não garante: o `conferir-colagem.py` roda depois de cada importação.

### O Caldeirão de Tasha, segundo lote: druida, guerreiro e monge (2026-11-09)

**Entraram sete.** Druida: os **Esporos** (o Halo de Esporos; a Entidade Simbiótica, pelo uso de Forma Selvagem, com
o halo em dobro e o necrótico no golpe; a Infestação Fúngica, que levanta como zumbi quem morre perto; os Esporos que
se Espalham, uma zona com o dado do halo; o Corpo Fúngico), as **Estrelas** (o Raio Guiado sem espaço pelo Mapa
Estelar; a Forma Estrelada com o Arqueiro, o Cálice e o Dragão, um botão por constelação; o Presságio Cósmico; as
Constelações Cintilantes, com 2d8, o voo do Dragão e a troca de constelação; o Cheio de Estrelas) e o **Fogo Selvagem**
(o espírito, em `monsters/espiritos-tce.js`, que chega queimando; o Laço Reforçado; as Chamas Cauterizantes que os
mortos deixam no chão; o Renascer em Chamas). Guerreiro: o **Guerreiro Psiônico** (os dados de energia psiônica, o
Campo Protetor, o Golpe Psiônico como interruptor, o Salto Psiônico, o Impulso Telecinético, a Mente Protegida, o
Baluarte de Força, o Mestre Telecinético com a Telecinésia sem espaço e o golpe de ação bônus) e o **Cavaleiro
Rúnico** (o Poder dos Gigantes; seis runas, escolhidas como as manobras — fogo, gelo, colina, pedra, nuvem e
tempestade —, com texto nosso escrito à mão, porque o livro as guarda fora da subclasse; o Escudo Rúnico; a Grande
Estatura; o Mestre das Runas; o Colosso Rúnico). Monge: a **Misericórdia** (a Mão da Cura e a Mão do Dano, o Toque do
Médico, a Rajada de Cura no lugar dos golpes, a Mão da Misericórdia Suprema que traz de volta quem morreu) e o **Eu
Astral** (os braços, que ferem em volta e golpeiam a 3 m com Sabedoria e energia; o semblante; o corpo, que desvia o
dano elemental e soma um dado no golpe; o despertar, com +2 de CA e o golpe a mais).

**De fora, com o motivo na tabela**: o Movimento Telecinético (mover outra criatura para uma casa escolhida), as
ferramentas e o idioma do Cavaleiro Rúnico, a aparência do Eu Astral, e os pedaços que a nota diz: virar Grande ou
Enorme, a luz da Forma Estrelada, o teleporte do espírito de fogo, a magia sair do espírito, e as vantagens em
perícia que as runas dão fora da luta.

**O que o motor ganhou**: a Rajada de Golpes que troca golpes por curas (`flurryOfBlows` com `modo` `curaUm` ou
`curaDois`); a escolha de runas no subir de nível (`runas`, ao lado das manobras e dos disparos); o voo que a condição
guarda na instância (o Salto Psiônico, o Dragão); o teste de concentração que se identifica (`contra.concentracao`),
para o Dragão; e a ação concedida que exige uma característica (`exigeCaracteristica`). No navegador, os botões das
runas, do Poder dos Gigantes e das três constelações aparecem, e a Runa do Gelo acende no clique. Provas em
`testes-subclasses-tce.mjs` (25).

### O Caldeirão de Tasha, terceiro lote: paladino, patrulheiro e ladino (2026-11-09)

**Entraram seis.** Paladino: a **Glória** (o Golpe Inspirador, que só aparece no turno da Destruição Divina e reparte
2d8 + nível de PV temporários; o Atleta Sem Igual; a Aura de Prontidão, +3 m no paladino e em quem começa o turno
colado nele; a Defesa Gloriosa, que põe o Carisma na CA e devolve o golpe que falhou; a Lenda Viva, com o erro que
acerta uma vez por turno e a resistência rolada de novo) e os **Vigilantes** (Abjurar o Extraplanar, que expulsa
aberração, celestial, elemental, feérico e corruptor até o primeiro dano; a Vontade do Vigilante; a Aura da Sentinela
na iniciativa do lado; a Repreensão Vigilante, que fere quem forçou o teste; o Baluarte Mortal, com visão verdadeira,
vantagem e o banimento de vez). Patrulheiro: o **Andarilho Feérico** (os Golpes Terríveis, uma vez por alvo no
turno; o Encanto Sobrenatural nos testes de Carisma e a perícia; a Reviravolta Sedutora, com a vantagem contra
encanto e medo e a reação que os devolve ao inimigo; o Invocar Feérico e o Passo Nebuloso sem espaço; o passo que leva
o aliado colado) e o **Guardião do Enxame** (o Enxame Reunido, interruptor entre morder e empurrar, uma vez por turno
em qualquer ataque; as Mãos Mágicas; a Maré Ondulante; o Enxame Poderoso, que derruba; a Dispersão do Enxame, que
resiste e teleporta). Ladino: o **Fantasma** (os Lamentos do Túmulo depois do Ataque Furtivo; os berloques de alma de
quem morre perto, com a vantagem na Constituição e na morte e o lamento de graça; o Caminhar Fantasma; o Amigo da
Morte, que fere as duas e deixa um berloque no descanso) e a **Lâmina da Alma** (os mesmos dados do Guerreiro
Psiônico; a lâmina de perto e arremessada, e a segunda como ação bônus; os Golpes Teleguiados; o Teletransporte
Psíquico, magia concedida que rola o alcance; o Véu Psíquico, que se rasga ao ferir ou forçar teste; o Rasgar a
Mente).

**De fora, com o motivo na tabela**: o Talento Psi-Reforçado (o jogo não diz ao teste de perícia quanto faltou) e os
Sussurros Psíquicos (idioma e conversa à distância). E os pedaços que a nota diz: carregar e saltar mais, gastar o
espaço de 5º círculo para repetir a Lenda Viva e o Baluarte, dispensar a concentração do Invocar Feérico, o enxame
deslocar o patrulheiro (e a meia cobertura disso), trocar a perícia do Fantasma no descanso, perguntar ao espírito
do berloque, atravessar criaturas no Caminhar Fantasma, e a mão livre da lâmina.

**O que o motor ganhou**: o golpe que muda de dono no meio da reação de defesa (a Defesa Gloriosa ataca de volta no
ramo do erro); o dano que avisa depois de entrar (`depoisDoDanoTce3`: o véu, a expulsão, o banimento); a resistência
que responde ao sucesso (`depoisDaResistenciaTce3`: a Repreensão, a Reviravolta) e ao fracasso (a Lenda); a aura que
soma na iniciativa do lado (`bestDex`); `armasDeCaracteristica` aceita lista. **E um defeito antigo da barra**: a arma
que não é item (`naoEItem`, o Raio de Sol do monge da Alma Solar desde o Xanathar) aparecia como "Sacar", e o clique
gastava a interação do turno sacando o que nasce na mão. Agora ela ataca direto. **E um buraco que fica**: o motor não
arremessa arma de perto (a adaga e a azagaia só golpeiam coladas); a lâmina arremessada é uma segunda forma da mesma
arma, e o arremesso de verdade das armas comuns segue em aberto. No navegador, os botões das duas lâminas e do enxame
aparecem, a arremessada acerta um goblin a 3 m, a segunda sai como ação bônus e o enxame morde uma vez só. Provas em
`testes-subclasses-tce.mjs` (37).

### O Caldeirão de Tasha, quarto lote: feiticeiro, bruxo e mago (2026-11-09)

**Entraram seis, e com elas as 26 do Tasha** (as do artífice não entram: o jogo não tem a classe). Feiticeiro: a **Mente
Aberrante** (as magias psiônicas e a Lasca Mental fora do limite; as Defesas Psíquicas; a Feitiçaria Psiônica, que paga a
magia psiônica com pontos quando não há espaço; a Revelação na Carne, um botão por benefício; a Implosão Distorcida,
magia concedida que fere e puxa todos a 9 m da saída, aliados também, como o livro manda) e a **Alma Mecânica** (as magias
mecânicas; Restaurar o Equilíbrio, que tira a vantagem do inimigo ou a desvantagem do aliado, no ataque e na
resistência; o Bastião da Lei, em si pela barra ou num aliado pelo menu; o Transe da Ordem; a Cavalgada Mecânica, que
cura 100 PV e desfaz as magias de 6º círculo ou menos que os inimigos puseram). Bruxo: o **Insondável** (o tentáculo,
magia concedida do tipo da Arma Espiritual, que volta pela ação bônus sem gastar outro uso; a Dádiva do Mar; a Alma
Oceânica; a Espiral Guardiã; os Tentáculos Agarradores, com o Evard sem espaço, os PV temporários e a concentração que o
dano não quebra) e o **Gênio** (quatro opções no criador, uma por tipo de gênio; a Ira do Gênio uma vez por turno; a
Dádiva Elemental; a lista expandida pelo tipo). Mago: a **Lâmina Cantante** (o treino; a Canção da Lâmina, que para de
escudo, de armadura média ou pesada, no golpe de duas mãos e incapacitado; o golpe que o truque deixa do Ataque Extra; a
Canção da Defesa; a Canção da Vitória) e a **Ordem dos Escribas** (o Grimório Desperto, interruptor do tipo de dano; o
pergaminho do Escrivão Mestre; a vantagem em Arcanismo).

**De fora, com o motivo na tabela**: a Fala Telepática, o Mergulho Insondável, o Refúgio Engarrafado e o Receptáculo
Santuário (o espaço dentro do objeto), o **Desejo Limitado** (o jogo não tem tela para escolher qualquer magia de qualquer
lista), a Pena de Mago, e a **Mente Manifesta**, porque o motor não conjura a partir de outro ponto que não o do
conjurador; com ela sai a metade de Um com a Palavra que anula o dano. Controlar a Água, Moldar a Pedra e Desejo também
faltam nas listas de patrono, porque o jogo não tem essas magias.

**O que o motor ganhou**: a magia concedida paga com um uso OU com pontos de feitiçaria (`recursoOuPontos`); a explosão
de saída que puxa (`explosaoNaSaida.puxa`); os ajustes de vantagem do golpe e da resistência que uma reação faz
(`ajustarModsTce4`, `equilibrioNaResistencia`); o d20 que não fica abaixo de 10 em ataque, resistência e teste; as
listas de patrono que dependem do herói (`listaDaClasse(classe, círculo, subclasse, herói)`); e a opção do criador que
já decide uma escolha da subclasse (`SUBCLASSES_1[].escolhas`). No navegador, a Canção da Lâmina acende com +5 de CA e
12 m de andar, e o Grimório troca para trovejante. Provas em `testes-subclasses-tce.mjs` (47).

### As subclasses dos outros livros: Costa da Espada, Livro do Mestre, Fizban e Bigby (2026-11-09)

**Entraram as onze.** A tradução custou US$ 0,13 (seis da Costa da Espada, duas do Mestre, duas do Fizban, uma do Bigby),
e cada livro ganhou a sua tabela (`classes/subclasses-scag.js`, `-dmg.js`, `-ftd.js`, `-bgg.js`). O Espadachim, o Mentor e a
Lâmina Cantante, que a Costa da Espada também traz, entram pelas versões revistas do Xanathar e do Tasha.

- **Costa da Espada**: o **Furioso de Batalha** (a armadura de espinhos, que entrou no catálogo; o golpe dos espinhos em
  Fúria, os 3 de perfurante no agarrão e em quem acerta de perto; o Abandono Descuidado; a Investida); o **Domínio
  Arcano** (dois truques do mago, a Abjuração Arcana que expulsa ou bane, o Quebra-Feitiços, a Maestria Arcana); o
  **Cavaleiro do Dragão Púrpura** (o Grito de Reunião no Retomar o Fôlego, o Surto Inspirador na Ação Surpreendente, a
  Persuasão dobrada, o Baluarte no Indomável); a **Longa Morte** (o Toque da Morte, a Hora da Colheita, a Maestria da
  Morte, o Toque da Longa Morte de 1 a 10 ki); a **Coroa** (o Desafio do Campeão, com a mesma cerca de 9 m do Duelo
  Compelido; Virar a Maré; a Lealdade Divina; o Espírito Indomável; o Campeão Exaltado); o **Imortal** (o morto-vivo que
  desiste do golpe, o Poupar os Moribundos, Desafiar a Morte, a Vida Indestrutível).
- **Livro do Mestre**: o **Domínio da Morte** (o Ceifador e o Aprimorado, que lançam de novo, de graça, no segundo alvo;
  o Toque da Morte como interruptor; a Destruição Inescapável; o Golpe Divino necrótico) e o **Quebrador de Juramento**
  (Controlar Mortos-Vivos, o Aspecto Terrível que só se repete longe dele, a Aura de Ódio, a Resistência Sobrenatural, o
  Senhor do Terror com as sombras de ação bônus).
- **Fizban**: o **Dragão Ascendente** (o sopro em cone ou linha no lugar de um golpe, a forma maior do 17º, o tipo do
  dragão também no punho, as Asas Desdobradas no Passo do Vento, o Aspecto da Serpe com a fúria explosiva, a percepção às
  cegas) e o **Guardião Dracônico** (o draco do bloco do livro, conferido no dado do Fizban: CA 14 + proficiência, 5 + 5 x
  nível de PV, mordida +3 + proficiência e 1d6 + proficiência; só esquiva sem a ordem; os Golpes Infundidos; o sopro; o
  elo que resiste; fica entre as lutas com os PV que tinha).
- **Bigby**: o **Caminho do Gigante** (o alcance a mais em Fúria, o Cutelo Elemental que muda o tipo, soma o dado e se
  arremessa, o Impulso Poderoso).

**De fora, com o motivo na tabela**: virar Grande ou Enorme (o gigante; o draco também não cresce), montar no draco,
idioma, doença, a pergunta ao espírito, e a meia cobertura e o arremesso de aliado que o jogo não decide sozinho.

**Dois defeitos antigos que vieram junto.** **O ND dos monstros não fica na instância**: o bloco guarda `cr: '1/4'` e
`makeMonster` não o copia, então o **Destruir Mortos-Vivos** do clérigo (`m.cr ?? 9`) nunca destruiu nada desde que
existe. Agora lê o bloco (`crEmNumero`), e há prova. **E arma que não é item aparecia como "Sacar"** — já corrigido no
lote anterior. Provas em `testes-subclasses-livros.mjs` (13).

### A Encruzilhada da Forca (2026-11-11) — o capítulo 6 está inteiro

O terceiro fragmento. As 25 salas do livro (G1 a G25) sobre a cena da FA "Gibbet Crossing" (68 x 91). A arte vem em duas
metades de 200 px por casa, juntadas em `public/mapas/fa/encruzilhada.jpg`, com as peças do armário, da sala sem torre e
do cofre sem fragmento. O mapa sai de `src/dev/mapa-encruzilhada.py`, e as provas no motor fecham 162 casas de bolsão e
conferem que todo ponto de criatura se alcança. A planta foi casada com o livro pelos ladrilhos com nome da cena da FA:
o fragmento cai em G25, a torre em G14, o armário em G19, a névoa em G12 e as gaiolas em G6.

**As criaturas.** Quase todo o elenco já estava no jogo, pelo bestiário do MM e pelo capítulo 5. Faltava só o Qunbraxel
(`rules/monsters/encruzilhada.js`), o devorador de mentes bruxo. Ele trouxe ao motor duas coisas:
- a condição presa ao agarrão (`onHit.comOAgarrao`): o tentáculo atordoa até o agarrão acabar, por qualquer caminho
  (`conditions.js removeCondition`);
- o golpe que exige um estado (`exige: 'agarradoAtordoado'`, `combat.js canAttack`): o Extrair Cérebro só vale contra um
  humanoide atordoado e agarrado por quem extrai.

**As regras de sala**:
- a SALA EMBAÇADA (`mapa.embacado`, `campo.js`, `combat.js`): desvantagem contra quem está em G12, salvo percepção às
  cegas ou visão verdadeira que alcancem o alvo;
- a ÁGUA RASA, glifo novo `]` (`aguaRasa`): terreno difícil, e não se nada nela. A passagem de G7 é funda. Em G18, a
  água vale onde a arte é cinza, contra o marrom da pedra seca;
- o MOFO MARROM, como região: Constituição CD 12 contra 4d10 de frio; morre com frio e cresce com fogo, pelo evento
  `spell`;
- a TORRE LAMACENTA, casa bloqueada até encolher, pela palavra (do Zoklork, em troca das ametistas ou da morte dos
  enroladores, ou das lousas de G20) ou pelo cascalho das estátuas de G21. Com o Qunbraxel vivo, ele e a guarda se
  mudam para o cofre;
- a BARRA de G11 (`trancas`, com a CD 15 do livro e a Força 21), que de dentro se tira com a mão;
- o ARMÁRIO de G19, a SECRETA de G16, o grick alfa que chama os gricks quando é ferido, o enrolador que recua para a
  névoa, a Vakketar presa à prisão, as seteiras de G24 e o fragmento que o Qunbraxel leva se o grupo sair sem ele.

**Os MARCOS do capítulo 6**, que não existiam (`game/obelisco6-marcos.js`): o 8º nível ao enfrentar o primeiro guardião
de fragmento (Talhundereth ou a Encruzilhada); o 9º ao vencer os três (o aglomerado de T21, os espectros de P18 e o
Qunbraxel). A passagem de T1 para G11 também passou a valer, nos dois sentidos, e a Encruzilhada entrou no mapa da
região, no segundo X das colinas de Starmetal (1608, 962 no mapa oficial).

**Medido** (`src/dev/medir-encruzilhada.mjs`, 100 lutas por sala, campo aberto; vitória / morte de alguém):

| Sala | 7º nível | 8º nível |
|---|---|---|
| G23+G24, o Qunbraxel e seis grimlocks | 88% / 28% | 96% / 27% |
| G14, o Zoklork e os elementais (só se o grupo atacar) | 58% / 24% | 90% / 17% |
| G6, a Vakketar | 94% / 8% | 99% / 6% |
| as outras seis salas | 95% a 100% / 0% a 6% | 98% a 100% / 0% a 2% |

Os 27% de morte da luta do Qunbraxel são o Extrair Cérebro, que mata quem ele zera. É o bloco do livro, e a cena dá ao
grupo as seteiras e a ordem dos grimlocks antes dele.

`testes-encruzilhada.mjs`: 21 provas. As suítes de regras, cenas, Talhundereth, cripta, regiões, bestiário, capítulo 6 e
investigar passam, e o `conferir-paredes` e o `conferir-cena` dão 0 achados. No navegador, a cena abre sobre a arte, o
grupo anda e o console fica limpo. A colagem com o livro é 0.

**Fora, dito**: a Telecinésia do Qunbraxel (o jogo não tem a magia). As gaiolas de G6 (500 lb cada) ficam onde estão;
só a gaiola montada de G3 se leva. A Vakketar só sai por um minuto: aqui, a cerca dela é a prisão, o mostruário e o
corredor. A conversa com ela é só flavor: ela sempre acaba atacando, como no livro.

### Os outros bestiários: Volo, Mordenkainen, Fizban, Bigby e Acquisitions Inc. (2026-11-12)

O mesmo caminho do MM, para os cinco seguintes na ordem do dono. O dado e a lore vieram do espelho
(`5etools-mirror-3/5etools-2014-src`) para `_referencias/5etools/bestiary/`; o texto em pt-br, pela API de lotes
(`traduzir-bestiario.mjs <livro> --go`); os números, pelo importador; as fichas, por `baixar-fichas.py --go`.

| Livro | Criaturas | Tradução | Pendente no motor |
|---|---|---|---|
| Volo (VGM) | 136 (e 7 cópias de outro bloco, que o importador pula) | US$ 1,98 | 106 traços, 27 ações, 8 reações, 5 com lendárias, 11 com magia que falta |
| Mordenkainen (MTF) | 140 | US$ 2,18 | 106 traços, 38 ações, 15 reações, 23 com lendárias, 17 com magia que falta |
| Fizban (FTD) | 85 | US$ 1,46 | 57 traços, 9 ações, 7 reações, 35 com lendárias, 5 com magia que falta |
| Bigby (BGG) | 72 | US$ 1,06 | 34 traços, 14 ações, 15 reações, 5 com magia que falta |
| Acquisitions Inc. (AI) | 22 | US$ 0,32 | 18 traços, 2 ações, 5 reações, 2 com magia que falta |
| **Total** | **455** | **US$ 7,01** (0,0154 por criatura, como no MM) | a fila de cada livro em `bestiario/<livro>-pendente.json` |

O jogo passou de 535 para 990 criaturas, todas com a ficha (821 dos livros em `public/fichas`). A **varredura**
(`varrer-bestiario.mjs <livro>`, cada criatura uma luta contra o grupo do nível do ND) não achou quebra nenhuma, e oito
lutas passaram de 30 rodadas. Delas, uma era defeito e uma era frase errada; as outras são impasse do simulador: o
recuperador é imune a arma comum, e o grupo simulado não tem outra; o Juiblex e o marut são lentos de matar; e o
Titivilus enfeitiça e amedronta quem poderia atacá-lo.

**O que se consertou para eles entrarem:**
- **Um livro apagava outro em silêncio.** Os ids "já usados" só contavam os blocos feitos à mão; o mesmo nome em pt-br em
  dois livros faria o segundo apagar o primeiro no `MONSTERS`. Agora os ids dos outros livros importados contam, e o
  livro que entra depois ganha o sufixo (só a vaca do Volo caiu nisso: `vacaVgm`, porque o capítulo 6 tem a dele). E a
  criatura cujo nome no livro já é o `nomeOriginal` de um bloco feito à mão fica de fora (nenhuma, nestes cinco; o MM
  fica fora da regra, porque o `ja-temos.json` dele foi casado à mão).
- **O couraçado astral engolia quem não devia, e a luta não acabava.** A mordida dele só engole quem ela derruba a 0 PV ou
  quem já está incapacitado, e até criatura Enorme; o importador perdeu as duas coisas (`engole.exige`, o tamanho escrito
  "of Huge size or smaller"). E a MASMORRA SEMIPLANAR (`masmorraSemiplanar`, `livro-motor.js naMasmorra`): quem ele engole
  não o fere de dentro e só sai com magia de viagem entre planos; o grupo todo lá dentro é derrota (`combat.js checkEnd`).
- **A regeneração do vegepigmeu dizia "sem fogo ou ácido"**, a frase do troll. O bloqueio já estava certo (frio, fogo e
  necrótico); a frase agora sai do bloco.
- **Três fichas não baixavam**: o espelho grava o arquivo sem acento e com o "æ" aberto (o Rothé é `Rothe.webp`, o Mörgæn
  é `Morgaen.webp`).
- "Unusual Nature" (não precisa de ar, comida, bebida nem sono), em 22 criaturas, é só descrição: foi para o `SABOR`.

**A fila do motor é a próxima frente**, como a do MM foi: 378 traços, ações e reações diferentes, e 63 criaturas com
ações lendárias que as catorze formas do motor não cobrem (quase todas os dragões do Fizban e os lordes demônios do
Mordenkainen). As magias que faltam aos conjuradores destes livros são poucas e de fora da luta (Controlar a Água em 9,
Símbolo em 6, Controlar o Clima em 5).

### A fila dos outros bestiários, primeira rodada: as ações lendárias (2026-11-12)

As criaturas com ação lendária sem motor caíram de **63 para 18**. Quase tudo era o importador não reconhecendo a
frase de uma forma que o motor já fazia:
- **o custo**: "Cost 2 Actions" (o Bael) e "(2 Actions)" (o comandante githyanki) viravam custo 1;
- **o golpe**: "attacks once with his mace", "makes one Claw or Tail attack" (a primeira das duas que o bloco tem), "makes
  one attack, either with its demonic weapon", "makes a melee attack with Heartcleaver", "uses Extract Brain" sem o "its",
  e a ação do bloco achada por parte do nome ("acid lash" é a Lash do Juiblex);
- **a magia**: "uses Psychic Step or Spellcasting" (os dragões de gema); "expends a spell slot to cast a 1st-, 2nd-, or
  3rd-level spell, 1 legendary action per level" vira três opções de custo 1 a 3, cada uma até o círculo do custo
  (`magiaLendaria` ganhou o teto de círculo); e a magia COM NOME ("casts acid splash", "casts crown of madness or
  dissonant whispers"), só ela, pelas magias que o jogo tem (`magias-en.json`);
- **o alvo único** escrito "at a creature that it can see", "around a creature", "targets one enemy";
- **o teleporte** que é uma ação do próprio bloco ("uses his Teleport action"), e o Mover do ki-rin, que o livro escreve
  "its half its speed".

E três formas novas no motor (`livro-motor.js escolherLendaria`): o **golpe que só existe como ação lendária** (a cauda
do Demogorgon, o toque do Juiblex), que entra no bloco só enquanto a ação dura; a **linha** com teste (o Raio Psíquico
do grande wyrm de ametista, 27 m por 3 m), mirada no inimigo que põe mais gente dentro; e as **lanças** que acertam sem
teste, cada uma num alvo (a Lança Arcana do grande wyrm negro). O nome da opção perdeu o "(Custa 2 Ações)" que a tradução
deixava (no MM também). **Um tropeço meu, que a prova pegou**: a área de linha do motor se chama `'linha'`, e com `'line'`
a conta caía no cubo e devolvia 168 casas. As formas novas também precisavam entrar na ordem do `escolherLendaria`.
Provas em `testes-bestiario.mjs` (59).

**O que sobra** é cauda longa de uma criatura cada: comandar um aliado a atacar (o senhor da guerra, a matriarca
drow), o elo psíquico do cérebro ancião, a tempestade em que o quintessente se desfaz, o casco do zaratan, os mortos que
o senhor das caveiras chama, a gravidade virada da anarca githzerai. E a fila de traços, ações e reações, que é a próxima
rodada: 376 itens diferentes em 439 casos, só 36 em mais de uma criatura.

### A fila dos outros bestiários, segunda rodada: traços e reações (2026-11-12)

A fila de traços caiu de **299 para 134** e a de reações de **50 para 36**, em quatro caminhos:
- **Só descrição** (o `SABOR`): o que só habilita uma ação que o bloco já tem (as runas dos gigantes do Bigby), o que já
  está no número ("included in its attacks", a CA que soma Inteligência ou Carisma), e o que é de fora da luta (sentidos a
  quilômetros, telepatia, rastro, memória, o que se escolhe ao invocar). Uns 90 nomes.
- **O que o motor já faz, com outro nome**: as camuflagens de planta e de mata, o Desengajar como ação bônus do xvart e
  do espadachim (a Ação Astuta), a resistência a encanto e a sono do neogi (a Ascendência Feérica), a sensibilidade ao
  sol do bodak, "não pode ser surpreendido", a carapaça que resiste a magia, a forma líquida e as explosões ao morrer com
  outros nomes (o Clarão da Morte do sombrio, a Morte Ígnea da fênix, o Portador Corrompido do orc de Yurtrus).
- **As AURAS lidas pela FRASE** e não pelo nome: "quem começa o turno a até X faz o teste ou sofre/fica" e "no começo do
  turno dele, cada criatura a até X". Entraram umas trinta: os eladrins, o olhar do bodak e o atordoante do gauth (como
  `olhar`, que se evita desviando os olhos), o Juiblex, o andarilho noturno, os rutterkins. A primeira versão ficou ANTES
  das regras com nome e roubou o Olhar Confuso do brutamonte do MM; e lia "se o bodak não estiver incapacitado" e "a menos
  que seja imune a amedrontado" como efeito. Hoje ela é a última regra, pula o `SABOR`, e tira essas frases antes.
- **Motor novo**: o **DESPERTAR** dos grandes wyrms do Fizban, dos aspectos de Tiamat e de Bahamut e da tartaruga-dragão
  anciã (a primeira vez que cairia a 0 PV, volta com 400 a 500 PV, o sopro recarregado e as resistências lendárias de
  volta); e as **REAÇÕES** de sempre, lidas pela frase (`reacaoLida`): a Esquiva Sobrenatural (a `uncannyDodge` do herói),
  a CA a mais contra um ataque com o bônus do bloco (o Escudo Mágico, a Armadura de Gelo: o `aparar` ganhou `apararBonus`
  e `apararTudo`), o revide com teste em quem fere ou em área (a `repreensao` da ocular ganhou condição, empurrão, área e
  o dano sem metade) e o revide com golpe, em quem fere ou em alguém ao acaso no alcance (`revide`).

Provas em `testes-bestiario.mjs` (61). **O que sobra** (134 traços, 63 ações, 36 reações, 18 lendárias) é quase todo de uma
criatura só: ação bônus de teleporte e de invisibilidade, ataques extras uma vez por turno, a explosão do oblex, o
caracol que perde tentáculos, os berços dos rebentos dos gigantes que viram outra criatura ao cair.

### A fila dos outros bestiários, terceira rodada: as ações (2026-11-12)

As ações eram a parte mais variada da fila: quase cada uma é de uma criatura só, e muitas são regra que o jogo não tem
(chamar servos, possuir corpos, a gravidade virada, o depósito de cérebros). O que se repetia era a FRASE de uma forma que
o motor já faz, e a leitura das ações especiais (`acaoEspecial`) e do golpe passou a aceitar:
- a linha escrita "in a line 60 feet long and 10 feet wide" (a Lança de Relâmpago da armanita, o Jato de Chamas do
  déspota duergar, que viram SOPRO em linha com a largura);
- "each enemy within 30 feet" (o Aspecto Aterrador do cavaleiro negro, o Uivo Funesto do cão yeth) e "Creatures within
  30 feet of the deep scion" (o Grito Psíquico);
- "targets one or two creatures" (o Envenenar Mente do amnizu, dois alvos);
- "until the end of the deep scion's next turn", com o nome de duas palavras (o grito durava um minuto);
- o golpe de "damage of a type chosen by the dracohydra", que não dizia o tipo: vira energia.

Um tropeço, que a comparação com o MM pegou: "in its space" (o toque da névoa vampírica) passou a valer como área de
1,5 m e encolheu uma área do MM que também dizia "within 60 feet"; hoje só vale quando a frase não traz alcance.

A fila ficou em **134 traços, 82 ações** (24 do Volo, 34 do Mordenkainen, 8 do Fizban, 14 do Bigby, 2 do Acquisitions),
**36 reações e 18 lendárias**, quase tudo de uma criatura só. Provas em `testes-bestiario.mjs` (62).
