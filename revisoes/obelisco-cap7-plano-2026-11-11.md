# O capítulo 7 do Obelisco, "Fendas na Realidade": o plano medido (2026-11-11)

O de-para sala a sala está em `_referencias/obelisco58/cap7.md` (fora do repositório). Aqui fica o que o jogo já tem,
o que falta e em que ordem. O grupo chega no 9º nível, e o marco do 10º vem ao abrir o portal em X16.

## 1. O que já existe

**Mapas da FA, com a arte no disco** (nada disso entra no repositório nem na publicação):

| Lugar | Cena do Foundry | Arte |
|---|---|---|
| A vila: a briga no Santuário da Sorte | `phandalin-alleys-15x20` (o mapa da 1ª luta do capítulo 5) | sim |
| O túnel: J1 a J4, os grells | não há cena JSON | `Phandelver_Encounters_4/GrellCaves_14x16` |
| O túnel: J5 a J7, o behir | não há cena JSON | `Phandelver_Encounters_4/BehirLair_15x17` |
| O túnel: J8 a J10, as bocas | não há cena JSON | `Phandelver_Encounters_4/GibberingGrotto_16x16` |
| Illithinoch, X1 a X16 | `illithinoch-33x43` | `Illithinoch/` (com a sobreposição da piscina do cérebro ancião) |
| Fenda 1: Trincheiras de Alimentação | `feeder-trenches-32x22` | `Phandelver_Encounters_5/FeederTrenches_32x22` |
| Fenda 2: Oco da Desova | `spawn-hollow-33x25` | `SpawnHollow/` |
| Fenda 3: Labirinto dos Olhos | `labyrinth-of-eyes-51x38` | `Phandelver_Encounters_5/LabyrinthOfEyes_51x38` (com o ladrilho do olho que rola) |

Os três mapas do túnel não têm cena de Foundry: a planta sai da arte, como a das Minas de Zorzula.

**Criaturas que o jogo já tem**: grell, plebeu, berserker, behir, boca tagarela, devorador de mentes, os três slaadi e o
girino, fanático do culto, homúnculo, doninha, devorador de intelecto, quaggoth e thonot, fomoriano, horror-gancho,
troglodita, barlgura, cogumelo guinchador, os goblins psíquicos e o nothic.

**Motor que o jogo já tem e o capítulo pede**:
- golpe não letal, que contra NPC já existe;
- relógio de campanha (`game/relogio.js`);
- atordoado, com teste a cada turno (`repete`);
- agarrão que acaba com quem agarra;
- engolir (`livro-motor.js`);
- os fantasmas do cloaker (`fantasmas`);
- aura (`inicioDoDono`);
- magias por dia;
- `resistenciaAMagia`;
- `naoSeguraALuta`;
- a cena com duas plantas: a cripta que gira.

## 2. As onze criaturas que faltam (Obelisco)

1. **Morador infectado**: o berserker com a Pancada Psíquica no lugar do machado.
2. **Grell psíquico**.
3. **Fusão de carne**: a fusão das bocas.
4. **Cloaker mutante**.
5. **Oshundo, o alhoon**.
6. **Nothic devorador de mentes**: o nothic com a Rajada Mental.
7. **Zelote aberrante**.
8. **Profeta devorador de mentes**.
9. **Cérebro ancião infectado**.
10. **Ocular**.
11. **Gnawble**: a doninha que não anda.

Elas são feitas à mão, como as dos capítulos 5 e 6, por dois motivos: o importador pula as cópias (`_copy`) e não lê
ação bônus.

O motor que elas pedem e o jogo ainda não tem:
- vários agarrados ao mesmo tempo, com dano no começo do turno de cada um (o cérebro ancião);
- a reação que revida quando o dono leva dano (a Repreensão Obsessiva da ocular);
- a cura no acerto (o Toque Gélido do alhoon);
- o golpe que dobra o dano contra quem está amedrontado;
- a ação bônus que puxa (a Distorção do Vazio);
- o teste de identidade no começo do turno (o cloaker mutante).

## 3. A ordem do trabalho

1. **As criaturas**, cada mecânica com um teste que falha sem ela (`testes-obelisco7.mjs`).
2. **A vila**: os três moradores infectados no Santuário da Sorte (para dominar, não matar), a Gwyn e a Grista, e o
   Wheel-of-Fortune no Gigante Adormecido, com as pistas de reserva.
3. **O túnel**: a viagem de 14 horas na tela da região, com um teste por hora contra a tabela do livro, e as três
   cavernas sobre a arte da FA. As cavernas são: os grells e os presos em J4; o behir, que negocia em dracônico; e as
   bocas, com o cloaker que move o cadáver do Thorgran.
4. **Illithinoch**: as portas que abrem pelo olhar e avisam o cérebro ancião; o Vínculo Psíquico; o Oshundo que conversa
   e quer os cristais; a rendição do Ahooshathan; e o cérebro ancião.
5. **As três fendas**: a exposição ao Reino Distante, que pede um teste de Constituição na primeira entrada de cada fenda;
   os gnawbles; o vórtice do Oco; e o olho que rola do Labirinto, com duas plantas.
6. **O portal e o marco do 10º**.
7. **Os cristais mentais**: nove, cada um uma metamagia de uso único.

Cada luta entra medida, nas salas de verdade (os moldes de `medir-*.mjs`).

## 4. Feito: as criaturas (2026-11-11)

As onze criaturas estão em `rules/monsters/obelisco7.js`. Cada mecânica tem uma prova em `testes-obelisco7.mjs` (24
testes), escrita para falhar sem o código que mede. As fichas vêm dos tokens do Obelisco no 5e.tools
(`fichas-5etools.json`), e as três condições novas têm ícone de traço:
- `duplicatas`: as cópias do cloaker mutante;
- `apertoPsiquico`: o tentáculo do cérebro ancião;
- `desalento`: o Choro da ocular.

**O defeito antigo que apareceu.** O `ateFimDoTurnoDele` das ações especiais vinha com `rounds: 1`. Posta no turno do
dono, a condição acabava no fim desse mesmo turno. Por isso o Gemido do fantasma, o Cuspe Cegante e o Olhar
Aterrorizante do bestiário do MM nunca chegavam a valer no turno do grupo. Hoje a conta pula o fim do turno em que a
condição nasce.

**Medido em campo aberto**: 40 lutas por sala, grupo de 9º nível, as mesmas sementes
(`src/dev/medir-obelisco7.mjs 40 9`).

| Sala | Vitória | Alguém cai | Morte | Rodadas | Vida que sobra |
|---|---|---|---|---|---|
| Vila: três moradores | 100% | 0% | 0% | 2,9 | 94% |
| J3: quatro grells | 100% | 0% | 0% | 3,0 | 96% |
| J6: o behir | 100% | 48% | 10% | 5,5 | 63% |
| J7: dois grells e o psíquico | 100% | 0% | 0% | 2,9 | 98% |
| J9: seis bocas | 100% | 0% | 0% | 3,3 | 99% |
| J9, recuando: a fusão de carne | 100% | 0% | 0% | 2,1 | 92% |
| J10: a capa mutante | 100% | 8% | 0% | 3,9 | 74% |
| X2: dois devoradores | 100% | 3% | 0% | 3,5 | 80% |
| X7: o Oshundo | **75%** | 40% | **33%** | 9,2 | 44% |
| X10: devorador e dois nothics | 100% | 0% | 0% | 3,0 | 85% |
| X11: o zelote e o fanático | 100% | 23% | 0% | 2,7 | 72% |
| X12: seis nothics | 100% | 0% | 0% | 3,2 | 88% |
| X14: o profeta e o homúnculo | 100% | 3% | 3% | 3,0 | 92% |
| X15: o cérebro ancião | **75%** | 73% | **50%** | 7,5 | 22% |
| L7: a ocular | 98% | 20% | 3% | 3,4 | 47% |

Duas lutas passam do orçamento do livro, e as duas seguem o bloco: foram lidas luta a luta, e não há defeito.
- **O Oshundo** abre com Dominar Monstro, atordoa em cone por um minuto com Inteligência CD 16 e recupera 14 PV a cada
  Toque Gélido que acerta. O Negar Magia dele anula o Raio Guiado do clérigo três vezes. O livro conta com a CONVERSA
  em X7: ele quer os cristais mentais e pode virar aliado. A cena tem de oferecer essa saída antes da luta.
- **O cérebro ancião** solta a Rajada Mental contra quem ele escolhe a 18 m: 5d10+5 e atordoado por um minuto, com
  Inteligência CD 17. Quatro rajadas por luta, em média. A sala de verdade dá ao grupo o muco da estátua de X2
  (resistência a psíquico por 10 minutos), e é com ele que a luta deve ser medida quando a cena existir.
- As lutas pequenas do túnel (J3, J7, J9) mal arranham o grupo de 9º nível. É o livro: o perigo da viagem vem da soma
  delas com os ~6 encontros da tabela, sem descanso.

## 5. Feito: a vila (2026-11-11)

**O que entrou:**
- `game/obelisco7-vila.js`: o fio da vila. O capítulo começa com o marco do 9º nível, depois que os três guardiões dos
  fragmentos caem.
- `game/obelisco7-lugares.js`: a briga no Santuário da Sorte, sobre o mapa do largo do capítulo 6 ("Phandalin Alleys",
  o mapa que o livro usa para ela).
- O modo do capítulo 7 do térreo do Gigante Adormecido (`obelisco5-terreo.js`): às escuras, o Wheel-of-Fortune atrás do
  balcão, a Gwyn junto, e o porão na cozinha.

**A ordem:**
1. A briga vem na primeira visita a qualquer lugar. Antes dela, o jogador escolhe "Bater para derrubar", que liga o
   golpe não letal do grupo inteiro.
2. Quem cai vivo vai para as celas do Harbin (`obelisco7.presos`), e quem morre fica em `obelisco7.mortos`. A Gwyn e a
   Greska chegam e abrem a missão do tiferino.
3. A conversa com o tiferino abre a missão de Illithinoch e a pista do buraco.
4. As duas pistas de reserva (os goblins presos se gabando, a fazendeira) valem enquanto ele não foi ouvido.

**O buraco do porão se vê, mas ainda não se desce.** A descida é o túnel, a próxima cena.

**Medido na sala de verdade** (`src/dev/medir-santuario7.mjs 60 9`):

| Como o grupo luta | Vitória | Os três vivos | Vivos em média | Alguém cai | Vida que sobra |
|---|---|---|---|---|---|
| Bate para derrubar, só de perto | 100% | 100% | 3,0 | 18% | 77% |
| Bate para derrubar, e o simulador ainda conjura e atira | 100% | 7% | 1,1 | 0% | 91% |
| Luta como for | 100% | 0% | 0 | 0% | 91% |

O livro quer os três vivos, e a regra só dá o não letal ao corpo a corpo: quem conjura uma Bola de Fogo mata. A luta
custa ao grupo cuidadoso uns 23% da vida, e dá para fazer.

**Dois defeitos que a medida e o navegador acharam:**
1. **O dano extra do mesmo golpe matava quem o golpe não letal derrubava.** O Golpe Divino do clérigo, a Marca do
   Caçador e o veneno da lâmina vêm depois do dano da arma. Ou derrubavam matando, ou matavam o desacordado. A primeira
   medida deu 2,67 de 3 vivos, e não 3. Hoje o golpe de perto em curso (`combat.js golpeDePerto`) conta como corpo a
   corpo para o resto dele.
2. **O retrato da ordem de turno quebrava com qualquer criatura sem `look` desenhado:** as do bestiário do MM, o
   Qunbraxel e as novas. O tabuleiro desenhava a ficha pelo bloco; o HUD pedia `c.look`, que vinha vazio. Agora o HUD
   cai no bloco, e `testes-cenas.mjs` recusa a chamada sem ele.

## 6. Feito: o túnel (2026-11-11)

**As três cavernas** saem das cenas do Foundry no repositório da FA (`behir-lair-15x17`, `gibbering-grotto-16x16`,
`grell-caves-14x16`, em `mapas/_cenas/`) e da arte do "Phandelver Encounters 4". O gerador é `src/dev/mapa-tunel-cap7.py`,
que escreve `game/tunel-cap7-mapas.js`. A cena é `game/tunel-cap7.js`.

**Uma lição de planta.** As passagens destas cavernas são mais estreitas que uma casa, e a aresta que o motor deriva do
traço da FA as fechava: o túnel do alto não chegava ao covil dos grells. Aqui o chão sai da GEOMETRIA das paredes. Elas
se desenham numa grade fina de 20 subcasas por casa, a inundação sai do grupo, e a casa é chão quando a água cobre 35%
dela. Quem barra o passo passa a ser a casa (rocha), e cada traço vira parede etérea, que só corta a vista. As
aberturas "etéreas" da FA (as do recanto do behir) não entram na inundação como parede.

**O que o livro pede, e onde:**
- **A viagem:** 12 milhas, 14 horas, e um d20 por hora contra a tabela do túnel (`rolarViagem`). Com tochas, o bando
  embosca (as rolagens de Furtividade de cada um); na luz do fungo, ninguém surpreende ninguém. A escolha é feita uma vez,
  na primeira descida.
- **J1 a J4:** o rastro e os goblins mortos. O abismo se atravessa por Atletismo CD 12, e quem falha cai 3d6; com
  Percepção passiva 14, alguém vê a prata lá embaixo, e quem desce acha o diário do Thorgran. Os quatro grells lutam até
  morrer. Os três presos (Oskar, Cathlette, Aida) são escoltados até a vila ou vão sozinhos.
- **J5 a J7:**
  - O behir é vulnerável a psíquico, fica preso ao seu salão e foge abaixo de 50 PV.
  - Antes de lutar, ele pede em dracônico que o grupo tire os grells de cima. Quem não fala dracônico entende pelo gesto.
  - Os grells não entram na luta com o behir. Morto o behir, eles vêm caçar o grupo depois de três passos fora do recanto.
  - O ninho tem as penas, o ouro e a pomada de Keoghtom (4 doses, cura 2d8+2). A mochila tem a escrita do Thorgran e o
    cristal mental.
- **J8 a J10:**
  - As seis bocas ficam escondidas na lama até alguém pisar no poço.
  - Quem RECUA (fora do poço e a mais de 4,5 m de todas) encerra a luta, e as que sobram voltam como fusão de carne na
    passagem seguinte.
  - A capa mutante testa Sabedoria CD 12 no começo de cada turno, com vantagem enquanto ouve as bocas. Falhando, fala
    como o Thorgran (`testeNoInicio.aoFalhar`); passando, delira.
- **A saída para Illithinoch:** mostra os portões; a fortaleza é a próxima cena.

**O cristal mental ainda não tem efeito.** O item existe e diz que, por ora, vale o que um gemólogo pagar. O efeito
pede que o jogador arme o cristal antes de conjurar, e isso é a interface do passo dos nove cristais.

**A VIAGEM INTEIRA, medida** (`src/dev/medir-tunel7.mjs 40 9`):
- o mesmo grupo de 9º nível desce os quatro trechos, com a vida, os espaços e os recursos acumulando;
- enfrenta a tabela do livro e as salas chaveadas (o behir foge, a capa testa a Sabedoria);
- o clérigo cura com os espaços que sobram entre uma luta e a outra, que o simulador do grupo não fazia sozinho;
- as lutas são em campo aberto.

| Como o grupo descansa | Chega aos portões | Lutas | Com um morto | Vida na chegada |
|---|---|---|---|---|
| Não descansa | 10% | 8,7 | 8% | 42% |
| Descanso curto entre as cavernas | 15% | 9,4 | 5% | 69% |
| Curtos, e um longo na toca do behir | 57% | 10,7 | 25% | 79% |
| Um longo em cada caverna | 78% | 11,4 | 30% | 88% |

**A tabela do livro (45% por hora, ~6 encontros) faz do túnel uma travessia de 9 a 11 lutas.** Sem descanso longo, o
grupo simulado quase nunca chega. As derrotas caem na gruta, depois de tudo: as bocas e a capa. Duas ressalvas: o
simulador joga pior que uma pessoa (não usa poção, não foge, não evita luta), e nas salas de verdade a lama, o teto
baixo e o abismo mudam o peso de cada luta. **Decisão do dono (2026-11-11): fica a tabela do livro**, um teste por
hora. O túnel é uma travessia de verdade, e quem desce tem de descansar no caminho.

## 7. Feito: Illithinoch (2026-11-11)

**A fortaleza** sai da cena do Foundry da FA (`illithinoch-33x43`) e da arte. O gerador é `src/dev/mapa-illithinoch.py`,
que escreve `game/illithinoch-mapa.js`. A cena é `game/illithinoch.js`. A saída da gruta tagarela agora leva aos
portões.

**A planta.** A cor da arte não separa o chão: o fundo roxo de fora das salas é tão claro quanto o piso, e a importação
deu 1.419 casas de chão e nenhuma de rocha. O chão sai da geometria das paredes, como no túnel, com as portas abertas na
inundação. Aqui o traço continua barrando o passo, porque os corredores têm duas casas de largura e as portas são arestas
de traço. As 16 salas caem onde o livro e a arte as põem.

**As celas de X9 ficaram sem porta.** As grades da FA, viradas em aresta, não fecham as celas, e as três portas ficavam
num vão (`conferir-paredes.mjs`: "porta que não separa"). As celas estão vazias no livro, e o que conta nelas são os
arranhões, então as portas saíram.

**O que o livro pede, e onde:**
- **As portas de pedra abrem pelo olhar** (a cena tem as próprias portas). A primeira põe a fortaleza em ALERTA, e com o
  alerta o Gulguush se esconde atrás da poltrona para emboscar. A porta fecha sozinha dez passos depois, se o vão estiver
  livre.
- **O vínculo psíquico:** quem fica incapacitado aqui, ou deita num casulo, ganha o vínculo, e o rompe com uma ação
  (Carisma CD 17, e 3d6 psíquicos). O motor ganhou o evento `incapacitado`, que avisa a cena.
- **O qualith** nas portas de X3, X7, X8 e X14: Inteligência CD 18 para ler; quem falha faz Sabedoria CD 13 contra 5d6.
- **X2:** a pergunta, a Enganação contra a Intuição deles (CD 16) e o muco da estátua, a beber ou a levar num frasco.
- **X4:** os goblins. **X5:** os slaadi mandam sair, e atacam se o grupo fica.
- **X6:** os cristais de memória, com a tabela do livro, e o cristal elevado.
- **X7:** o Oshundo conversa antes de lutar e vira aliado em troca dos cristais mentais; ele dá os mapas.
- **X10:** o Ahooshathan se rende e conta o que sabe. **X11:** a Enganação CD 12 contra o Duoro; o Larnon foge se ele cai.
- **X12:** os seis nothics e o cristal distante. **X14:** o livro do Gulguush e as duas poções.
- **X15:** o cérebro luta até a morte; morto, os sigilos param e os vínculos se rompem; os cristais estão no fundo da piscina.
- **X16:** os testes do nicho e da parede de planos. **O PORTAL:** com os três gnawbles a 6 m do nicho, ele abre, e vêm a
  visão dos presos e o marco do 10º nível.
- **As três fendas** (X4, X5, X10) se olham; atravessá-las é a próxima parte.

**Medido na fortaleza** (`src/dev/medir-illithinoch.mjs 30 9`), com o grupo entrando pela sala e as portas abertas.
O simulador do grupo não encara porta, e na primeira medida a Dara e o Pip ficavam no corredor do lado de fora de X4, sem
lutar, e a luta empatava em 41 rodadas.

| Sala | Vitória | Alguém cai | Morte | Rodadas | Vida que sobra |
|---|---|---|---|---|---|
| X2 os dois devoradores | 100% | 0% | 0% | 2,9 | 94% |
| X4 os goblins psíquicos | 100% | 13% | 0% | 3,7 | 68% |
| X5 os dois slaadi | 100% | 43% | 3% | 6,6 | 69% |
| X10 Ahooshathan e dois nothics | 100% | 0% | 0% | 2,5 | 88% |
| X11 Duoro e Larnon | 100% | 7% | 0% | 2,3 | 82% |
| X12 seis nothics | 100% | 23% | 20% | 8,9 | 56% |
| X14 o Gulguush | 100% | 3% | 0% | 3,7 | 89% |
| **X15 o cérebro ancião** | **60%** | 63% | **40%** | 6,2 | 33% |
| **X15 com o muco da estátua** | **93%** | 37% | 20% | 5,8 | 57% |

O X7 não está na tabela: o Oshundo conversa, e só luta se o grupo o ataca.

**O cérebro ancião é a luta do capítulo, e o muco da estátua é a chave dela, como o livro a montou.** Na sala, todo
mundo fica ao alcance dos tentáculos (9 m), que agarram os quatro desde a primeira rodada, e a Rajada Mental atordoa por
um minuto com Inteligência CD 17. No campo aberto eram 75% de vitória, porque o grupo começava longe dos tentáculos. O
X16 só se alcança passando por X15.

## 8. Feito: as fendas (2026-11-11)

As três fendas de Illithinoch são três cenas sobre os mapas da FA (`src/dev/mapa-fendas.py` → `game/fendas-mapas.js`;
a lógica em `game/fendas.js`). Atravessa-se pela fenda da fortaleza ("Atravessar a fenda"), e a volta põe o grupo na
boca dela (`config.chegada`). O chão sai da geometria das paredes, como no túnel e em Illithinoch.

- **Em todas:** a exposição ao Reino Distante (Constituição CD 12, envenenado por uma hora) na PRIMEIRA entrada de cada
  herói em cada fenda, e só nela; a fenda rompe o vínculo psíquico do cérebro; e o gnawble se colhe na runa, um por vez.
- **As Trincheiras:** os três grells do refeitório comum atacam quem entra; a Naruv e um grell no F3; as goladas de gosma
  (a primeira alimenta, a segunda pede Constituição CD 12); o baú com a tiara e o cristal acelerado; o Bashudu no tanque
  do meio; e o ALARME: o F3 vem na hora, o F2 seis passos depois.
- **O Oco da Desova:** os glifos (5d8 trovejantes, Destreza CD 12; Investigação CD 12 acha, e o achado não explode), que
  chamam o Chalaag invisível; os doze girinos e o slaad vermelho no S2; o Chalaag no S3; e o vórtice, que leva quem entra
  e o devolve pelo redemoinho.
- **O Labirinto dos Olhos:** a ESFERA gira de fora do anel e troca os túneis — as duas configurações são listas de
  aresta que `field.porAresta` alterna, e a arte girada é uma sobreposição (`olhoGirado`). O gerador PROVA que sem girar o
  norte (a runa, o Golcuus, o vidro) não se alcança, e que girando e desgirando, sim. A ocular mostra a Piscina Salobra e
  debilita quem falha em Inteligência CD 18; o ladrão morto solta 5d8 necróticos (Constituição CD 15) em quem o revista sem
  desarmar, e deixa quatro adagas de cristal; colher o gnawble com o Golcuus vivo o traz para interceptar; os nichos do L7.
- **Os itens novos:** os sete cristais mentais (a metamagia ainda não; por ora valem o que um gemólogo pagar), a tiara, as
  adagas de cristal, o rubi-olho, a estatueta de observador e os três gnawbles.

**Medido nas salas** (`src/dev/medir-fendas.mjs 30 9`, o grupo entrando pela sala, a exposição contando):

| Sala | Vitória | Alguém cai | Morte | Rodadas | Vida que sobra |
|---|---|---|---|---|---|
| F2 três grells | 100% | 0% | 0% | 3 | 95% |
| F3 a Naruv e um grell | 100% | 13% | 0% | 7,4 | 82% |
| S2 doze girinos e o slaad vermelho | 100% | 17% | 0% | 5,7 | 79% |
| **S3 o Chalaag** | **87%** | 20% | **7%** | 8,2 | 50% |
| L7 o Golcuus | 100% | 10% | 0% | 3,1 | 53% |

O Chalaag é a luta das fendas: regenera 10 por turno, e o grupo entra envenenado pela exposição. As derrotas são dele,
não de defeito.

Conferido no navegador: as três abrem sem erro no console, a luta do S2 começa pelo "Às armas!" com os girinos na ordem de
turno, e a esfera, girada, acende a arte que encaixa no anel (conferido por composição sobre o mapa). `testes-obelisco7.mjs`
ganhou onze provas (64 no total).

**O `conferir-paredes` pegou 26 casas** que a primeira versão das fendas deixava como chão sem ninguém alcançar: os
tanques do F4 marcados uma fileira acima de onde a arte os desenha (o bloco é de 4x2 casas, na linha entre as fileiras 16
e 17), quinas arredondadas de parede com um fio de chão no Oco, e o norte do labirinto, que só se abre girando a esfera.
Os tanques viraram borda que não se entra e se vê por cima (`B`, a regra da banheira); o gerador agora transforma em
rocha toda casa de chão que o motor não alcança (no labirinto, com a esfera aberta), o que tirou 8 casas nas Trincheiras
e 23 no Oco; e o conferidor aprendeu que as arestas da primeira configuração da esfera abrem com o giro, como já sabia
das da cripta. O Bashudu fica DENTRO do tanque do meio, e a prova do gerador exige que a borda dele se alcance. As
medidas das salas são de antes disto; a troca não tirou chão de nenhuma sala onde se luta.

## 9. Feito: os cristais mentais (2026-11-11)

A regra veio do dado do livro (o `items.json` do espelho do 5etools, agora em `_referencias/5etools/itens/`, fora do
repositório): **qualquer conjurador** usa o cristal, numa magia de **uma ação**; um só por magia, e **não junto da
metamagia** do feiticeiro; usado, ele vira uma pedra comum de 50 po (`cristalApagado`).

- **No motor** (`combat.js cristalDaConjuracao`, `gastarCristal`): o cristal armado (`actor.cristalArmado`) entra pela mesma
  porta da metamagia (`metaAtiva`), com os números do cristal e não os do feiticeiro: a Cuidadosa e a Potencializada valem
  para TRÊS (criaturas, dados), e não para o Carisma; a Distante SOMA 30 m ao alcance, onde a metamagia o dobra (o toque
  vira 9 m nos dois). O cristal que não serve à magia (o Cuidadoso numa magia sem teste) fica armado para a próxima, e a
  magia de ação bônus não o gasta. A Prolongada saiu de `pagarMetamagia` para `prolongarMagia`, que os dois usam.
- **Na tela** (`hud.js`): um interruptor por cristal da mochila na barra de luta de quem conjura, como os da metamagia;
  armar um cristal troca o outro.
- **Uma diferença achada no caminho**: a Magia Cuidadosa do motor ZERA o dano de quem passa no teste, e o livro do
  cristal só faz passar (a Bola de Fogo ainda tira metade). O cristal segue o livro (`careful.zera`); a do feiticeiro
  ficou como estava, porque mexer nela é outra decisão. No SRD 5.1 ela também só faz passar.
- Os preços: o livro não dá preço; ficou 100 po o comum, 300 o incomum e 1.500 o raro, dentro das faixas do Guia de
  Xanathar para item mágico consumível.

Provado em `testes-obelisco7.mjs` (68 provas): o acelerado tira a Bola de Fogo da ação; o distante faz o Míssil Mágico
alcançar 45 m, e sem ele não alcança; o cuidadoso faz três aliados passarem e ainda tirarem metade; o que não serve fica;
a ação bônus não gasta; e o cristal vale no lugar da metamagia, sem gastar ponto de feitiçaria. Conferido no navegador:
armado pelo interruptor na luta das Trincheiras, o Míssil Mágico do Ilvan saiu como ação bônus pelo caminho do clique
(`tryCast`), o cristal virou pedra e o interruptor sumiu, sem erro no console.

**O capítulo 7 está completo.** O que sobra do Obelisco é o capítulo 8.
