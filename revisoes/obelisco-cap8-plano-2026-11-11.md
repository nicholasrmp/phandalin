# O capítulo 8 do Obelisco, "Além de uma Estrela sem Luz" — o plano medido (2026-11-11)

O de-para sala a sala do livro está em `_referencias/obelisco58/cap8.md` (fora do repositório). Este arquivo é o que
o jogo tem, o que falta e em que ordem, e as medidas que decidem.

O grupo ENTRA no 10º nível, sobe ao 11º ao tocar o furo no fundo da Poça Salgada e ao 12º ao matar os três fanáticos;
a Refração de Ilvaash, na volta, é a última luta da campanha.

## 1. O que já existe

**As criaturas, quase todas.** De uns trinta blocos com lugar fixo, o bestiário do MM (que entrou como dado) e os
capítulos 5 a 7 já trazem: a aranha defasadora, o ashenwight psiônico, o cavaleiro e o guerreiro githyanki, o zelote
aberrante, a fusão de carne, o espectador, o flumph, o aglomerado e a gêmula encefálicos, a armadilha de intelecto (o
Intellect Snare, de Talhundereth), o observador, o mago, o arcanaloth, o verme púrpura, o guardião-escudo, o plebeu, o
aboleth, o elemental da água, a naga espiritual, o perseguidor invisível, o mezzoloth, o brutamonte umbral, o nicaloth,
o profeta devorador de mentes e o espectro.

**Os mapas, todos.** A Forgotten Adventures tem os nove: o Labirinto Salgado (66x80, com o covil do dragão à parte, 15x15)
e os oito lugares do Vazio (a Cúpula de Cristal, a Ponte Vazia, o Charco da Dúvida, o Nematódeo, o Miasma Ocludente, a
Estátua Tombada, o Campo de Batalha Lamentoso e a Ânima de Ilvaash). As cenas do Foundry estão em `mapas/_cenas/`
e a arte em `mapas/`, as duas fora do repositório e da publicação.

## 2. Feito: as criaturas que faltavam (2026-11-11)

Em `rules/monsters/obelisco8.js`, à mão, com os números do livro lidos do 5e.tools e o texto nosso:

| Bloco | ND | Onde | O motor novo que ele pediu |
|---|---|---|---|
| Devorador de Mentes Clarividente | 11 | a Ânima (os três fanáticos) | a reação **Distorcer a Realidade** (+4 de CA contra o golpe que acertou, e um teleporte de 18 m; `combat.js`, traço `distorcerARealidade`); o **Desatar o Vazio** numa esfera de 9 m a até 18 m dele (`alcanceFt` na área que nasce num ponto, `ai.js`); o Extrair Cérebro contra quem o tentáculo INCAPACITOU (`exige: 'agarradoIncapacitado'`) |
| Lowarnizel | 9 | B17 | o **Sopro da Singularidade**, que prende os pés até o começo do turno seguinte dele (`ateInicioDoTurnoDoDono` na ação especial) |
| Refração de Ilvaash | 15 | B22, na volta | a **Garra Dissonante** que derruba a concentração (`quebraConcentracao` no golpe), de 3 m ou de 36 m; a **Quebra-Mente** lendária, sem teste (`semTeste` com `condition` em `livro-motor.js`, condição `quebraMente`) |
| Crânio Flamejante | 4 | B4 | nada: o bloco do MM, com a Bola de Fogo do espaço de 3º círculo (o nosso `caveiraCandente` é outro, do 4º nível) |
| Cabeça da Chishinix | 3 | a Ânima | a gêmula, devagar |
| Zelote Aberrante Tentaculado | 8 | B18 | a Explosão Mental em cone |
| Nellik | 9 | o Campo de Batalha | o machado que soma 1d12 contra aberração (`danoExtra.contra`, que já existia) |
| Varakkta | 8 | B7 | a espada grande de reserva |

**Três defeitos antigos que saíram junto:**
- **O bloco com Resistência Lendária E magia por dia perdia a magia** (`monsters.js`): os `recursos` do bloco
  sobrescreviam os usos por dia. Pegava o clarividente, a Refração e o **empíreo do MM**, que lutava sem as magias dele.
- **O perseguidor invisível não atacava** (`importar-bestiario.mjs`, traço novo `sempreInvisivel`): o importador dava a
  ele e ao poltergeist o traço do quasit, que some por vontade e só ataca quem está pela metade da vida. Os dois são
  invisíveis SEMPRE pelo livro, e atacar não os revela. Medido: três perseguidores contra o grupo do 11º tiravam 0% da
  vida; agora tiram 36%.
- **O baixador de fichas parava no primeiro token que o espelho não tem** (`baixar-fichas.py`): agora pula e diz quais.

**Achado e não mexido:** a espada de prata do cavaleiro githyanki do MM não conta como mágica no nosso bloco (o
importador não marca), então a Varakkta, que o livro quer SEM a de prata, ficou igual ao cavaleiro nesse ponto.

Provado em `testes-obelisco8.mjs`.

## 3. As lutas, medidas em campo aberto

`src/dev/medir-obelisco8.mjs 30`: cada luta no nível em que o livro a põe, 30 vezes, nas mesmas sementes, sem as paredes,
o rio, a névoa ou o obelisco. Não é a cena: é o peso de cada elenco antes de a cena existir.

| Luta (nível) | Vitória | Alguém cai | Morte | Rodadas | Vida que sobra |
|---|---|---|---|---|---|
| B3: duas aranhas defasadoras e dois ashenwights (10º) | 100% | 7% | 3% | 4,1 | 72% |
| B4: cinco crânios flamejantes (10º) | 20% | 100% | 90% | 9,1 | 7% |
| B6: quatro espectros (a música mal tocada) (10º) | 100% | 27% | 20% | 6,5 | 81% |
| B7: Varakkta e dois guerreiros (10º) | 100% | 0% | 0% | 2,6 | 94% |
| B9: Shalfi e o Jitterjaws (10º) | 100% | 7% | 0% | 3,7 | 69% |
| B12: o aglomerado e quatro gêmulas (10º) | 50% | 97% | 97% | 6,9 | 21% |
| B14: o Mublinesh (observador) (10º) | 10% | 83% | 67% | 7,7 | 44% |
| B17: Lowarnizel e Gossa (10º) | 100% | 23% | 7% | 4,6 | 67% |
| B18: dois zelotes tentaculados (10º) | 87% | 57% | 13% | 5 | 38% |
| B21: a Ashripask (10º) | 100% | 0% | 0% | 3,6 | 92% |
| B22: o verme púrpura (10º) | 27% | 87% | 43% | 7,9 | 15% |
| Cúpula: cinco guardiões-escudo (11º) | 3% | 97% | 57% | 12,4 | 2% |
| Ponte: o aboleth e o elemental da água (11º) | 100% | 0% | 0% | 4,2 | 90% |
| Charco: as duas nagas (11º) | 100% | 0% | 0% | 3 | 96% |
| Nematódeo: duas armadilhas de intelecto (11º) | 77% | 47% | 27% | 7,7 | 54% |
| Miasma: três perseguidores invisíveis (11º) | 100% | 37% | 0% | 8,2 | 64% |
| Campo W1: três mezzoloths e o brutamonte (11º) | 63% | 73% | 20% | 9,7 | 39% |
| Campo W2: a Nellik e o Frevvik (11º) | 100% | 10% | 3% | 5,5 | 81% |
| Ânima: os três clarividentes e a cabeça (sem o obelisco) (11º) | 0% | 100% | 70% | 3,1 | 0% |
| Ânima: um clarividente e a cabeça (A1) (11º) | 53% | 83% | 73% | 8,8 | 22% |
| Refração de Ilvaash (12º) | 3% | 100% | 23% | 7,4 | 0% |
| Refração e o verme púrpura (12º) | 0% | 100% | 30% | 5,2 | 0% |

**O que estas medidas dizem, antes de haver cena:**
- **As lutas OBRIGATÓRIAS do fim são muito mais duras que o resto.** A Ânima com os três fanáticos juntos (6 ou 7
  fragmentos) é 0% sem o obelisco, e é para ser: o livro a faz vencível pelo contragolpe do obelisco, que manda o dano
  dele para o fanático mais perto. A Refração sozinha vence o grupo simulado do 12º em quase todas as lutas: a
  Quebra-Mente lendária dá desvantagem nos testes, e a Explosão Mental logo depois (Inteligência CD 19) atordoa os quatro
  por um minuto, com a desvantagem renovada a cada rodada. Isso é o livro; o grupo simulado não tem os itens mágicos que
  o capítulo espalha nem quem resista bem em Inteligência.
- **Os cinco crânios (B4) e o observador (B14) são mortais no 10º**, e o livro os põe assim (B4 dá o dobro de um
  encontro mortal no ajuste do Livro do Mestre). Os dois se evitam: os crânios só acordam se alguém mexer nos corpos, e o
  observador não ataca quem anda com um devorador e foge abaixo de 50 PV.
- **O verme púrpura em campo aberto não é a regra dele**: no livro ele bate e vai embora, e nunca fica mais de duas
  rodadas. A medida de verdade é a da Poça.

## 4. O que falta, na ordem

1. ~~**O Labirinto Salgado**~~ (feito, seção 5) (B1 a B22), sobre a cena da FA: as três portas mentais, os bastões e a corrente viva (Con CD
   15, 4d10 por elo), os lobos como regiões (vantagem em Percepção, ninguém cai, Ajudar como ação bônus, entender
   qualquer língua), o relógio (o portal de B1 por 7 dias, as portas que fecham em 1 hora, o Shalfi que fura o teto de
   B17 em 1 ou 2 dias), a armadilha de arame de B15 e as conversas (Varakkta, Jomlus, os flumphs, Lowarnizel e Gossa,
   Ashripask).
2. ~~**A Poça Salgada**~~ (feito, seção 6): a descida de seis testes com o verme que bate e foge, e o marco do 11º.
3. **O Vazio**: as oito ilhas como mapas próprios onde todos voam; a viagem entre elas como tela, sorteando duas à vista;
   a Ânima depois de cinco. Cada ilha com a regra dela (a névoa mortal do Miasma, o símbolo da Ponte, a membrana do
   Nematódeo, a língua e a sala da Estátua, as nagas que renascem).
4. **A Ânima**: o obelisco que passa o dano ao fanático mais perto (em dobro se o grupo pegou um fragmento no capítulo
   6), a IA que foge dele depois do primeiro contragolpe, e o marco do 12º. **Medir com e sem o contragolpe.**
5. **A Refração** em B22 na volta, com o verme na 3ª rodada se ainda vive, e o fim da campanha.

**Uma decisão do dono, quando a Ânima e a Refração existirem:** se as duas lutas finais ficam como o livro (medidas
duríssimas para o grupo simulado) ou se se ajustam.

## 5. Feito: o Labirinto Salgado (2026-11-11)

O labirinto e o covil do Lowarnizel (B17) são duas cenas sobre os battlemaps da FA (`src/dev/mapa-labirinto-salgado.py`
→ `game/labirinto-salgado-mapa.js`; a lógica em `game/labirinto-salgado.js`). Entra-se pelo portal de X16 de Illithinoch,
aberto o portal ("Atravessar o portal"), e volta-se por ele de B1. O covil se alcança pela corda do buraco de B16.

**As salas saíram do mapa do livro.** O mapa 8.1 (com os rótulos B1 a B22, baixado do espelho do 5etools para
`_referencias/obelisco58/mapas/`, fora do repositório) casou com a grade da FA pela fenda do meio e pelas três portas,
e o que a arte desenha em cada sala caiu onde o livro o põe. Cada casa é da sala cujo rótulo está mais perto ANDANDO, pelo
custo do motor, cada hemisfério com as suas salas. A primeira divisão atravessava parede: a busca andava casa a casa sem
olhar a aresta. **E as portas guardam o que o livro quer**: com as três fechadas, do portal se chega a B1 até B10, B12 e
B13 — o gerador prova que B11 só se alcança achando a passagem, e B19 e B22 só pelas portas.

O que a cena faz, do livro:
- **As três portas mentais e a corrente viva** (Con CD 15, desvantagem de armadura de metal, 4d10 elétricos por elo): os
  bastões de B7 abrem a traseira, os do covil a central, os de B21 a da frente com quatro elos, os de B22 as três. Fecham
  sozinhas no descanso longo.
- **O lobo parietal** (ninguém cai, condição `loboParietal`), **o assobio de B15** (desvantagem em Inteligência e
  Sabedoria, condição `assobioDissonante`) e o occipital (vantagem nos testes de Percepção que a cena rola).
- **As salas:** B2 (os duergar e a capa), B3 (a luta, as teias fortes junto do fundo como `mapa.embacado`, e o ashenwight
  que se rende), B4 (os cinco crânios, chegando perto ou tocando), B5 (a espada de prata e a gosma que revela B1 a B5 na
  névoa), B6 (a música e os espectros), B7 (os githyanki: devolver a espada, conversar com Persuasão CD 15, ou lutar; os
  guerreiros se rendem com a Varakkta morta), B8 a B10 (o Shalfi e o Jomlus conversam; os tesouros), B11 (a passagem pela
  Percepção passiva 14 ou procurando, e os flumphs que se recrutam depois do encefálon), B12, B14 (o Mublinesh foge para
  B15 abaixo de 50 PV e espera lá), B15 (a armadilha de arame, achada com desvantagem e cortada com Destreza CD 16), B16, B18,
  B19 (a encenação e os cristais que debilitam), B20, B21 (a Ashripask, que encomenda a Nellik e conta dos flumphs) e B22.
- **O covil:** o Lowarnizel e a Gossa conversam; o descanso ali é o seguro, mas cobra Sabedoria CD 15 de cada um, ou um
  nível de exaustão.
- As duas peças de arte da FA que a cena acende: o corpo de B2 sem a capa e o calombo de B10 sem o livro.

**Medido nas salas** (`src/dev/medir-labirinto.mjs 30 10`, as portas abertas, o grupo do 10º):

| Sala | Vitória | Alguém cai | Morte | Rodadas | Vida que sobra |
|---|---|---|---|---|---|
| B3 as aranhas e os ashenwights | 100% | 10% | 3% | 5,2 | 62% |
| B4 os cinco crânios | 100% | 83% | 30% | 8,7 | 59% |
| B7 a Varakkta e os guerreiros | 100% | 43% | 0% | 3 | 74% |
| **B12 o aglomerado e as gêmulas** | **47%** | 80% | **67%** | 6,8 | 26% |
| **B14 o Mublinesh** | **27%** | 80% | **77%** | 6,6 | 47% |
| B18 os dois zelotes | 60% | 87% | 30% | 6 | 23% |

O encefálon e o observador são as lutas mortais do labirinto, e os dois o livro deixa contornar: o encefálon fica na
sala dele (os flumphs pedem a cabeça dele, e não é preciso dá-la), e o Mublinesh não vem atrás de ninguém. Os crânios
pesam menos na sala que em campo aberto (100% contra 20%): na sala o grupo não está junto quando a primeira Bola de Fogo cai.

**De fora, ditos:** a capa de aumento e o boné ainda não se usam (o jogo não tem item de cargas que voltam ao amanhecer);
a Bênção da Mente Solipsista do Jomlus; os flumphs que acompanham o grupo; o Mublinesh que fecha as portas com o raio; o
relógio do Shalfi, que fura o covil; a Varakkta que decide atacar Illithinoch; o Ajudar como ação bônus do lobo frontal; e
a descida da Poça, que é a próxima parte.

## 6. Feito: a Poça Salgada (2026-11-11)

`game/poca-salgada.js`: de B22 ("Mergulhar na poça") o grupo desce seis milhas num poço de água aberta, sem arte, onde
todos nadam. A cada milha, cada um rola o melhor entre Atletismo e Furtividade, CD 14, com vantagem se o grupo viu a Poça
pela ocular do Golcuus no capítulo 7 (`obelisco7.feito.viuAPiscinaSalobra`, que as fendas já gravavam). Quem falha chama
o verme púrpura (nadando a 15 m), que vem do escuro mirando quem falhou (`alvoPreferido`) e vai embora no fim do SEGUNDO
turno dele. No fundo, a estrela sem luz e o marco do 11º; tocá-la leva ao Vazio, que ainda não existe (o botão diz isso).
Sobe-se de volta à beira da poça.

**A decisão nossa, dita no arquivo:** o livro não diz o que acontece com quem está dentro do verme quando ele vai embora.
Aqui ele se afasta com a pessoa e não ataca mais ninguém (condição `vermeEmFuga`), e quem está dentro continua tentando
sair — o vômito do livro, 30 de dano num turno e Constituição CD 21 — até sair ou cair. A primeira versão deixava o verme
"indo embora" atacar quem nadava atrás dele, e ele engolia um segundo: a morte por descida caía de 77% para 57% com isso.

**Medido** (`src/dev/medir-poca.mjs 30 10`, a descida inteira, o grupo do 10º):

| | Chega ao fundo | Ataques do verme | Engolidos | Alguém morre | Vida que sobra |
|---|---|---|---|---|---|
| sem a ocular | 100% | 3,1 | 1,3 | 57% | 59% |
| com a ocular | 100% | 1,4 | 1,0 | 47% | 66% |

O grupo sempre chega, mas o verme engole mais de um por descida, e quem está dentro morre muito no simulador — que de
dentro joga mal (o clérigo engolido não faz nada). É o livro: um verme de ND 15 que bate e corre contra um grupo do 10º. A
vantagem da ocular corta os ataques pela metade, que é a recompensa que o livro dá a quem olhou.

## 7. Feito: o Vazio sem Fim (2026-11-11)

`game/vazio.js`, com os mapas de `src/dev/mapa-vazio.py` (`game/vazio-mapas.js`): as sete ilhas que não são a Ânima, cada
uma sobre o battlemap dela da FA, ligadas pela viagem do livro. A estrela sem luz do fundo da Poça leva à Cúpula; de cada
ilha se voa para uma das duas à vista, que o d8 sorteia na chegada (a atual e a Ânima rolam de novo, a Ânima enquanto o
grupo não viu cinco outras); o descanso longo rola de novo e cobra Sabedoria CD 15 ou um nível de exaustão. No Vazio todos
voam com o deslocamento a pé (`darVoo`), e o voo some de volta na Poça (`tirarVooDoVazio`). Os fanáticos levam os quatro
pedaços de Phandalin mais os do capítulo 6 que o grupo não pegou (`fragmentosDosFanaticos`), e é esse o número que os
presos da Cúpula contam.

O que cada ilha faz está no cabeçalho do `vazio.js`, regra a regra. **As decisões nossas:**
- **O Miasma** é névoa mortal no mapa inteiro (região de 5d8 de veneno, Constituição CD 17, e o mapa todo embaçado). A
  primeira versão punha a luta dos perseguidores DENTRO da névoa, e o grupo morria nela sem enxergar ninguém. O livro diz
  que eles não veem pela névoa e caçam quem leva a língua: aqui a travessia da nuvem custa duas rodadas de névoa na
  chegada e duas na saída (a nuvem tem 30 m de raio, e voando a 18 m por turno são duas), e os três atacam o ladrão na
  ilha SEGUINTE, fora dela.
- **A viagem** é de ilha em ilha: o ardil de quem voa sem rumo e a espera por uma ilha que sumiu ficam de fora.
- **A Nellik** conversa e só briga se o grupo atacar; o Frevvik toca a trompa, e as patrulhas que ainda andam no campo
  chegam 1d4 rodadas depois cada uma.

**Medido** (`src/dev/medir-vazio.mjs 30`, o grupo do 11º, a luta disparada pelo gatilho da cena):

| | Vitória | Alguém cai | Morte | Rodadas | Vida que sobra |
|---|---|---|---|---|---|
| **Cúpula, os cinco guardiões-escudo** | **0%** | 100% | **100%** | 11,2 | 0% |
| Ponte, o aboleth e o elemental | 87% | 43% | 0% | 5,9 | 58% |
| Charco, as duas nagas (pela charada) | 100% | 10% | 0% | 3,3 | 91% |
| **Nematódeo, as duas armadilhas de intelecto** | **23%** | 97% | **77%** | 12,1 | 12% |
| Os três perseguidores, na ilha seguinte | 67% | 63% | 3% | 11,9 | 40% |
| **Campo W1, a pirâmide** (100 lutas) | **7%** | 97% | 52% | 8,5 | 3% |
| Campo W2, a Nellik e o Frevvik, com a trompa | 77% | 90% | 70% | 18,4 | 37% |

**A Cúpula é o muro do Vazio**, como os revenants na cripta: cinco guardiões de ND 7 dão 29.000 XP ajustados, o dobro do
mortal do 11º, e cada um regenera 10 PV por turno. É o bloco do livro, e o livro deixa contornar: a luta só começa quando
alguém entra na cúpula, e quem não entra voa para outra ilha (os presos esperam). **O Nematódeo** pesa pela Cacofonia
das armadilhas, a mesma de Talhundereth: o grupo inteiro fica parado ouvindo na primeira rodada. **A pirâmide** pesa
pelos três mezzoloths colados no grupo dentro de uma sala de seis casas, resistentes a arma comum, e o grupo simulado
não tem arma mágica no 11º; em campo aberto a mesma luta dava 63%. O livro a deixa contornar matando a Nellik antes, que
os espalha.

**Três defeitos que a medida achou:**
- **O olhar do brutamonte umbral pegava quem não o via.** O Olhar Confuso entrou do MM como uma aura qualquer: pegava o
  cego, quem estava atrás de parede e quem desviava os olhos. Agora o importador o marca como `olhar` (`aura.olhar`), e a
  aura de olhar pede linha de visão e quem enxerga o dono (`podeVer`), e respeita o interruptor **Desviar os olhos** da
  medusa (`desviaOlhar`): não testa, mas ataca o brutamonte com desvantagem, e ele o ataca com vantagem. O interruptor
  aparece também EXPLORANDO (`hud.js tileDoOlhar`), porque o primeiro olhar vem no começo da luta, antes de qualquer
  turno. Os olhos recém-desviados não caem na limpeza do mesmo começo de turno (`nasceuEm`). O simulador do grupo desvia
  também do brutamonte (`balance.js`). Medido em 100 lutas, a pirâmide fica igual de olhos desviados (5% contra 7%): o
  que pesa ali são os mezzoloths.
- **A luta da Nellik empatava em 41 rodadas.** A medida punha o grupo dentro do moinho, de porta fechada, e o Frevvik
  ficava do lado de fora, sem alcançar ninguém. No jogo o grupo entra pela porta; a medida agora a abre (de 0% para 100%,
  e para 77% depois que a trompa passou a chamar as patrulhas de verdade: ver a seção 9).
- **A trompa devolvia as patrulhas como reforço novo**, e elas já estavam no tabuleiro, neutras: agora a trompa só as
  vira para a luta.

**De fora, ditos:** o "Bound" dos guardiões-escudo (não têm dono aqui), as pás do moinho e a fumaça do campo, e a Ânima
de Ilvaash, que é a parte seguinte, com a Refração.

## 8. Feito: a Ânima de Ilvaash (2026-11-11)

A oitava ilha do Vazio, em `game/vazio.js` (ela usa a viagem, o voo, o descanso e as lutas das outras), com o mapa da FA
"Ilvaash's Anima" em `src/dev/mapa-vazio.py`. Só fica à vista depois de cinco outras ilhas, e quem voa até ela desce na
plataforma de chegada: o lado de fora da parede é rocha, e entra-se pela escada. As SALAS do livro saem da distância
andando pelo custo do motor (`PONTOS_VAZIO.ANIMA.salas`): A1, a entrada de baixo; A3, a câmara dos discípulos à
esquerda (as seis lajes, o altar com a estátua-cérebro); A2, o refeitório à direita (os tubos, a prateleira); e A4, o
mirante de cima, com o obelisco no estrado e a cova redonda no meio, onde Phandalin aparece pequena na névoa. O desenho do
obelisco QUEBRADO, que a FA também dá, é uma sobreposição (`obeliscoQuebrado`) que acende quando ele vira pó.

**Os fanáticos ficam onde os pedaços mandam** (`salasDosFanaticos`): 4, a Chishinix em A1, o Hashutu em A2 e o Voalsh em
A4; 5, a Chishinix em A1 e os outros em A4; 6 ou 7, os três em A4; com 7, os dois profetas em A3. A Chishinix conversa
para ganhar tempo, pede os pedaços que o grupo trouxe, avisa os outros pela mente (o Hashutu sobe do refeitório para o
obelisco) e ataca; abaixo de 30 PV ela recua voando para junto dos outros, e a cabeça fica lutando. O Hashutu vê às
cegas a 18 m; o Voalsh só voa, a 9 m, e não cai.

**O OBELISCO é um combatente** (`obeliscoDaAnima`, em `rules/monsters/obelisco8.js`): CA 17, imune a veneno e a psíquico,
não anda nem age, não segura a luta, e entra em toda luta da Ânima, porque se golpeia de qualquer lugar. Não tem PV: o
dano que ele levaria, depois das imunidades dele, vai para o fanático ligado a ele que está mais perto, onde quer que
esteja (`combat.js contragolpeDoObelisco`), em dobro se o grupo pegou ao menos um fragmento no capítulo 6. Os fanáticos
não sabem disso até o primeiro contragolpe; depois, parar numa casa que o deixa como o mais perto pesa como parar no fogo
(`ai.js pararPertoDoObelisco`), e eles param de pôr o obelisco nas próprias áreas. O tabuleiro só desenha o anel dele
(`pintadoNoMapa`), porque a pedra já está no mapa, e o retrato da ordem de turno é desenhado em código (`sheet.js
RETRATOS_DESENHADOS`), porque a arte da FA não entra no repositório. As tabuletas do altar (Arcanismo ou Investigação, CD
16) contam a fraqueza. Mortos os três fanáticos, o obelisco vira pó, sobe o 12º nível (`darMarco`), e da plataforma se volta
pela estrela sem luz para a Poça.

**Medido** (`src/dev/medir-anima.mjs 30`, o grupo do 11º; no alto, o grupo simulado IGNORA o obelisco ou BATE SÓ NELE):

| | Vitória | Alguém cai | Morte | Rodadas | Vida que sobra |
|---|---|---|---|---|---|
| A1, a Chishinix e a cabeça (4 pedaços) | 10% | 97% | 80% | 6,3 | 4% |
| A3, os dois profetas (7 pedaços) | 97% | 13% | 10% | 4,6 | 74% |
| A4, 5 pedaços: Hashutu e Voalsh, ignorando | 17% | 97% | 77% | 8 | 7% |
| **A4, 5 pedaços: Hashutu e Voalsh, batendo no obelisco (o dobro)** | **77%** | 33% | 30% | 3,4 | 64% |
| A4, 6 pedaços: os três e a cabeça, ignorando | 0% | 100% | 83% | 5,6 | 0% |
| **A4, 6 pedaços: os três e a cabeça, batendo no obelisco (o dobro)** | **23%** | 97% | 87% | 5,6 | 9% |
| A4, 7 pedaços: os três e a cabeça, ignorando | 0% | 100% | 83% | 5,4 | 0% |
| A4, 7 pedaços: os três e a cabeça, batendo no obelisco (sem dobro) | 0% | 100% | 83% | 4,7 | 0% |

**O obelisco é a chave, como o livro quer**: com o dobro, bater nele leva a luta de dois fanáticos de 17% para 77%, e a
de três de 0% para 23%. Com 7 pedaços o grupo não pegou fragmento nenhum, então não há dobro, e a luta mais dura vem sem
a ajuda. Mesmo assim os três juntos são o muro do capítulo: cada um tem o Desatar o Vazio, que atordoa por um minuto com
Inteligência CD 17, e o grupo simulado tem Inteligência baixa e nenhum item mágico. A Chishinix sozinha em A1 pesa mais
que em campo aberto (10% contra 53%), porque o gatilho da conversa põe o grupo colado nela. **A primeira medida achou um
defeito**: o Desatar o Vazio dos próprios fanáticos pegava o obelisco, e o contragolpe matava o Voalsh pela mão da
Chishinix. Antes do primeiro contragolpe isso continua valendo (eles não sabem); depois, a IA não põe mais o obelisco na
área.

**De fora, ditos:** a ALTURA (a plataforma, A4 e o estrado acima do chão; todos voam, e ela não barra ninguém), o cérebro
que sai do tubo do refeitório (só horror, sem valor de jogo), entregar os pedaços à Chishinix (ela ataca do mesmo jeito)
e a Refração de Ilvaash, na volta pela Poça, que é a última parte.

## 9. Feito: a Refração de Ilvaash e o fim do capítulo (2026-11-11)

Em `game/labirinto-salgado.js`. Quem volta da Ânima pela estrela sem luz e sobe da Poça sai na beira dela, em B22, com o
obelisco já em pó, e acha a Refração diante da porta da frente, a única saída (a pegada de 3x3 encostada nela). Ela luta
até ser destruída. O verme púrpura, se ainda vive, sobe da poça no começo da 3ª rodada; o que morre na Poça fica morto
(`poca-salgada.js`, `vermeMorto`). Vencida a Refração, o labirinto treme, os moradores que restam não incomodam mais, e
em B1 abre-se o segundo portal, para o resto do Reino Distante, ao lado do de Illithinoch, que começa a fechar. A PRIMEIRA
VOLTA A PHANDALIN é o epílogo (`obelisco7-vila.js epilogo`): a vila curada, a Garaele e a Halia de volta, a Gwyn atrás da
história; e a vila curada não tem mais as cenas do capítulo 7.

**Medido** (`src/dev/medir-refracao.mjs 30`, o grupo do 12º, na sala de verdade):

| | Vitória | Alguém cai | Morte | Rodadas | Vida que sobra |
|---|---|---|---|---|---|
| A Refração (o verme morreu na Poça) | 3% | 100% | 33% | 15,1 | 7% |
| A Refração e o verme, que sobe na 3ª rodada | 0% | 100% | 23% | 6,1 | 0% |

**É o bloco do livro, e é a luta mais dura do jogo.** As três ações lendárias de Quebra-Mente dão desvantagem em todo
teste, ataque e salvaguarda; a Explosão Mental logo depois (Inteligência CD 19) atordoa o grupo por um minuto, e a
desvantagem renovada a cada rodada faz o teste de se livrar falhar de novo. O grupo simulado tem Inteligência baixa,
nenhum item mágico, e a arma comum dele sai pela metade contra ela. Em campo aberto já dava 3% (seção 3). O livro a
põe contra o grupo do 12º, e diz que, se ela vencer, o grupo fica preso no labirinto. **FICA O BLOCO DO LIVRO, por decisão do dono (2026-11-11)**: a Refração é o fim da campanha, e o 3% é do grupo simulado, sem item mágico nem quem resista em Inteligência.

**Três defeitos que a Refração achou:**
- **A trompa do Frevvik nunca chamava as patrulhas** no jogo: o motor chama `reinforcements` com o NÚMERO da rodada
  (`combat.js spawnReinforcements`), e a cena lia `enc.round` do argumento. A prova passava porque chamava a função com o
  `enc`; agora ela roda o `spawnReinforcements` de verdade.
- **A câmera abria no ponto de nascer do mapa, e não onde a cena pôs o grupo.** Quem sobe da Poça (ou sai do covil pelo
  buraco) nascia longe da câmera, com a névoa por cima: a tela parecia toda preta. `main.js` agora atualiza o foco
  inicial depois do `iniciar` da cena.
- (da Ânima) o retrato do obelisco, que quebrava a ordem de turno, já descrito na seção 8.

**De fora, ditos:** a Refração mirando reféns (o jogo não tem escolta: os presos da Cúpula e da Estátua esperam lá); a
hora que o portal de Illithinoch leva para fechar (o labirinto não conta minutos, e de B22 a B1 se anda em minutos); o
grupo de socorro que o livro sugere se a Refração vencer (a derrota encerra a partida, como nas outras cenas); o lado de
lá do segundo portal, que o livro deixa para outra aventura; e se os heróis ficam com as transformações do capítulo 7.
**Com isto o capítulo 8 está inteiro no jogo, e o Obelisco também.**

## 10. O que o labirinto deixava de fora, e a transformação (2026-11-12)

Lido de novo o "DE FORA" do `labirinto-salgado.js` contra o de-para (`_referencias/obelisco58/cap8.md`), entrou o que o
motor já sabia fazer ou pedia pouco. Provas em `testes-obelisco8.mjs` (57 testes).

| O livro | No jogo |
|---|---|
| B11: até sete flumphs acompanham quem mata o encefálon; fogem de ordem suicida ou de luta perdida | `chamarFlumphs`: nascem em toda luta do labirinto, do lado do grupo, agindo sozinhos (`invocado`, que não segura a luta nem vale XP); fogem com metade dos PV ou com metade do grupo no chão; o morto não volta |
| B10: 24 horas ouvindo o Jomlus dão a Bênção da Mente Solipsista | a conversa ganhou "ouvir a leitura"; passa um dia; quem ouviu ganha a ação `menteSolipsista` (1d8 em testes e resistências de INT e SAB, uma hora, sem reações, uma vez por descanso longo). O dado restrito a algumas habilidades é `habsDoBonus` na condição, lido na resistência, no teste em luta e no teste fora dela |
| B14: o Mublinesh fecha com o raio a porta que se abriu, se não vier devorador | seis passos de exploração depois da descarga dos bastões, a porta de B14 aberta fecha, a não ser que alguém esteja nela |
| B9: o buraco do Shalfi fura o covil em 1 ou 2 dias; empatam, e ganha o lado que o grupo ajudar; avisado, o dragão o espera | `passarUmDia`: o descanso do covil e a leitura passam o dia. Com o grupo no covil, o Shalfi cai do teto e o dragão e a Gossa lutam do lado do grupo. Longe, **decisão nossa**: avisado, o dragão vence; sem aviso, a sorte |
| B7: contado o portal, a Varakkta decide atacar Illithinoch | ela sai do labirinto com os guerreiros; na volta a Illithinoch, **decisão nossa** (o livro só diz que ela vai): os três estão mortos e levaram até dois devoradores |
| Lobo frontal: Ajudar é ação bônus | a condição `loboFrontal` e o "Ajudar (lobo frontal)" no menu do inimigo ao lado (`subclasses-livros.js ajudaDoLobo`) |

**A transformação dos heróis** (`game/transformacao.js`), a regra opcional do começo do livro, "Character
Transformation": entra só com o sim de cada jogador, perguntado na chegada à vila; um efeito sorteado por estágio, do 1º
(capítulo 5) ao 4º (capítulo 8), seguindo o estágio da vila (`vila-reino.js`); as frases aparecem na aba História da
ficha. O que vira regra é o exemplo do próprio livro — o estágio 3, resultado 1, dá vantagem em Carisma contra aberração
(`utilidade.js modificadores`) — e a reação do casal do covil, que cobra explicação de quem mostra a marca no corpo.
Vencida a Refração, cada um decide se fica com ela.

**E no Vazio:** a espera de 1d6 dias por uma ilha já vista (cada dia, um descanso com o teste de Sabedoria); a fumaça do
Campo como penumbra na grade de luz, menos a até 9 m do moinho enquanto duas das três pás girarem, e as pás como objetos
do livro (CA 13, 30 PV, imunes a veneno e psíquico) que se quebram pelo caminho das muralhas — quebrá-las com a Nellik
em paz a faz defender o moinho (decisão nossa); e a entrega dos pedaços à Chishinix, que deixa o obelisco inteiro, acorda
os profetas em A3 e tira o dobro do contragolpe (decisão nossa: o livro só diz que ela os pede), e ela ataca do mesmo
jeito. O cérebro do tubo de A2 já se tirava.

**Fica de fora, dito:** a Refração mirando reféns; o ardil do intelecto de quem voa sem rumo (aqui se viaja de ilha em ilha); o "Bound" dos guardiões-escudo (sem dono no Vazio); a altura da Ânima (todos voam); a hora do portal fechando; convencer o dragão a ir cavar atrás do
Shalfi (ele prefere esperar, e o jogo o deixa esperar); o grupo de socorro se a Refração vencer; e o lado de lá do segundo
portal, que o livro deixa para outra aventura.

## 11. O que ainda ficava de fora (2026-11-12, a pedido do dono)

O dono pediu tudo o que estava listado como de fora, menos o som (fica para depois). Provas em `testes-obelisco8.mjs`
(69 testes) e `testes-zorzula.mjs`.

| O livro | No jogo |
|---|---|
| Os oito reféns aceitam esperar, ou vêm junto; a Refração os mira para desesperar o grupo; o grupo é saudado em dobro se os trouxe | `refens-obelisco.js`: soltos, o grupo escolhe levar ou deixar (e chama os que esperam quando volta à ilha). Quem vem é plebeu do lado do grupo, sozinho e sem lutar (foge e se esquiva, `ai.js naoCombatente`), fica depois da luta, segue o grupo, sobe a Poça rolando a milha (com o verme atrás de quem falha), é mirado pela Refração (`alvosPreferidos`), e o epílogo conta quem voltou, quem morreu e quem ficou. **Decisão nossa**: quem ficou esperando fica no Vazio quando o portal fecha. A névoa do Miasma pega o refém também |
| O portal de Illithinoch fica aberto 7 dias, depois instável (Arcanismo CD 18; falhou, 24 horas); vencida a Refração, fecha em uma hora | Os dias são os do labirinto e os descansos no Vazio; instável, "Firmar o portal" pede o teste, e falhar trava até passar um dia. Depois da Refração, cada passo explorando é um minuto (**decisão nossa**: o labirinto não contava minutos), o descanso do covil e a descida da Poça o fecham; fechado, sem Mudança de Plano no jogo, resta o segundo portal |
| O segundo portal leva ao resto do Reino Distante (outra aventura) | Atravessá-lo é um fim de campanha narrado, com os ganchos do livro em palavras nossas |
| Se a Refração ou os fanáticos vencem, os heróis ficam presos no labirinto e a Gwyn manda buscar heróis em Neverwinter | `socorro-obelisco.js`: a derrota oferece o socorro; os antigos ficam colados em B22 com 1 PV; quatro heróis do rol que não estavam no grupo, no mesmo nível, chegam a B1; a Refração os espera em B22 (se o obelisco já é pó); vencida, solta-se os antigos, que voltam ao grupo |
| 1d6 ardis do intelecto por hora para quem vaga sem rumo | "Vagar pelo Vazio" no menu da viagem: uma hora, 1d6 ardis em volta do grupo, e duas ilhas novas à vista depois |
| A Ânima tem quatro alturas (0, +3 m, +3 m, +6 m) | `alturasDaAnima`: a plataforma e A4 a dois níveis, o estrado a quatro; dá cobertura e corta a visão, e quem voa não paga subida |
| O casal prefere esperar o Shalfi; o grupo pode convencê-los a ir | Persuasão CD 15 (**nossa**) no covil; convencidos, sobem cavando sob a cova de B9 quando o grupo chega, lutam do lado dele e descem depois |

**Fica de fora, dito:** o som de ambiente (o dono deixou para depois) e o "Bound" dos guardiões-escudo, que o próprio
livro diz não ter amuleto nem dono na Cúpula.
