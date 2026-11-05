# Esconderijo Cragmaw — de-para do livro para o mapa da Forgotten Adventures

O Capítulo 2 (`src/game/capitulo2.js`) foi escrito sobre a NOSSA planta de 40×28 (`game/esconderijo.js`). Este
documento leva cada área, cada ponto e cada coordenada para o battlemap **Cragmaw Hideout [30×20]** da FA,
importado do Foundry (`src/dev/importar-foundry.py`, ver CLAUDE.md). É o mapa da obra — ainda nada mudou no jogo.

**Fontes.** O livro: *A Mina Perdida de Phandelver*, pp. 7–12, em `_referencias/livro/` (fora do repositório).
A planta do livro: `_referencias/caverna/referencia-esconderijo.jpg`. O mapa da FA e a cena do Foundry dele.
Os FATOS (quem está onde, quantos, CDs, dano, tesouro) são do livro e têm de bater; as palavras aqui são nossas.

**Prova visual:** `_referencias/esconderijo-fa/de-para.png` (fora do repositório, porque é arte da FA).

> **EXECUTADO no mesmo dia.** O capítulo 2 roda sobre este mapa: `src/dev/mapa-esconderijo-fa.mjs` gera
> `game/esconderijo.js` (terreno, altura, salas e os `PONTOS_DO_ESCONDERIJO` que o capítulo lê), e
> `capitulo2.js` não tem mais número de casa nenhum. Onde a construção se afastou da proposta abaixo, foi por
> medida — está na seção **O que mudou na construção**, no fim.

---

## Como as áreas foram situadas

O mapa da FA é um redesenho da planta do livro: mesma topologia, as oito áreas no mesmo lugar relativo. Cinco
delas a própria cena do Foundry marca, e não foi preciso adivinhar:

| âncora da cena do Foundry | o que prova |
|---|---|
| `Light00` (8×6 casas em 1,3) + luz em (3,6) | a fogueira de cozinha do **covil (6)** |
| `Light01` (10×10 em 19,8) + luz em (23,13) | a fogueira de **Klarg (8)** |
| `ChestOpen` (2×2 em 26,15) | o baú de Klarg, entre os suprimentos da **área 8** |
| `Bridge` (4×4 em 14,3) | a **ponte (5)** |
| `FirstBreak` (21,3) e `SecondBreak` (23,3) | as **duas barragens** dos tanques (7) — a primeira e a segunda enchente |
| `Collapse` (4×3 em 8,5) | o **ressalto frágil** da passagem oeste (4) |
| `WaterSurge00..06`, de (18,2) até (8,10) | o caminho da **enchente**, dos tanques até a saída |

As outras três saem do desenho: o **abrigo de ripas** dos vigias em (13,16)–(14,17), a leste do riacho; a
**câmara dos ossos**, com a estalagmite das correntes em (15,10), que é o canil; e a cachoeira em (28,7), a leste
dos tanques, que o livro põe exatamente ali.

A fronteira de cada área, casa a casa, saiu por **distância de caminhada** a partir de uma âncora por área,
com as paredes importadas decidindo — cobriu as 330 casas de chão:

```
    0         1         2
    012345678901234567890123456789
 2  .........555555..555..........
 3  ........65...555555555777.....
 4  ..6666.66.....555555557777....
 5  ..6666666....55555..5.7.7777..
 6  ..66666644444455.5..7.7777777.
 7  ..66666....4444..555777777777.
 8  ..6666666...44.......7.77777..
 9  ..66.66666.444.33......77777..
10  ....666666.4433333......88....
11  ...........4433333....888.....
12  ......111.4443..333...8888.8..
13  11111111114442...3....888888..
14  11111111112222222....8888888..
15  11111111112222222222...88888..
16  11111111112222222222...88888..
17  1111111112222222.2222.........
18  11111111122222.222222.........
19  111.11111222.222222222........
```

| área | casas | onde |
|---|---|---|
| 1 entrada | 69 | a clareira a OESTE do riacho, x 0–10, y 12–19 |
| 2 vigias | 62 | o mato a LESTE do riacho, x 10–21, y 13–19 |
| 3 canil | 17 | a câmara x 13–18, y 9–13 |
| 4 passagem | 25 | a subida ao lado do riacho, x 9–13, y 6–13, mais a passagem oeste em y 6 |
| 5 ponte | 39 | o anel de túneis altos do norte, x 9–21, y 2–7 |
| 6 covil | 45 | a câmara noroeste, x 2–10, y 3–10 |
| 7 tanques | 40 | o nordeste, x 20–28, y 3–9 |
| 8 Klarg | 33 | o sudeste, x 21–28, y 10–16 |

---

## Área por área: o livro, e onde fica no mapa da FA

### Características gerais (todas as áreas)
A caverna **sobe por dentro do morro**; a entrada é no pé dele. Teto de 6 a 9 m com estalactites. Áreas 1 e 2 a
céu aberto, o resto **no escuro**. Pedregulho é terreno difícil; estalagmite dá cobertura. A água abafa o som:
ouvir a área vizinha pede **Percepção CD 15**. O riacho tem meio metro, é frio e lento — anda-se nele sem custo.

### 1 — Entrada da caverna
**Livro:** a trilha chega a uma caverna larga ao pé do morro, com o riacho saindo dela e mata fechada em volta.
O caminho seco para dentro corre pela **margem leste** do riacho; o mato da área 2 não se atravessa pelo lado
oeste. Barulho do grupo ali (discutir alto, acampar, cortar lenha) faz os vigias atacarem pelo mato, com
**cobertura de ¾**.
**FA:** a trilha chega pelo oeste da clareira (1,16). O riacho desce por x 10–11, de y 12 até a borda. O caminho
seco é a faixa de terra em x 12–14, y 12–15. A boca é por volta de (11–13, 12).

### 2 — Vigias goblin
**Livro:** a leste do riacho, uma clareira no mato virou posto de vigia, com **ripas de madeira** formando um
abrigo. **2 goblins**, preguiçosos. Se notam o grupo na área 1, atiram pelo mato e talvez surpreendam; senão,
notam quando alguém **cruza para o lado leste** do riacho, e ninguém fica surpreso. Quem vai na frente com
cuidado testa **Furtividade contra a Percepção passiva** deles. O mato é terreno difícil e dá **meia cobertura**.
**FA:** o abrigo de ripas está desenhado em **(13,16)–(14,17)**, no meio do mato verde de x 11–20, y 15–19.

### 3 — Canil
**Livro:** logo na entrada da caverna, **alguns degraus de pedra** sobem a uma câmara pequena no **lado leste**
da passagem, que fede a bicho. **3 lobos** acorrentados a um **bastão de ferro cravado na base de uma
estalagmite**; **não alcançam os degraus**. Acalmar: **Lidar com Animais CD 15 (10 com comida)**. Vendo alguém
fora do alcance, puxam: **Força CD 15**, depois **CD 10**, e soltam. Um goblin ou bugbear solta um lobo com a
ação. **Fissura** na parede leste: uma **chaminé de 9 m até a área 8**, com lixo na base. Subir ou descer:
**Atletismo CD 10** (sucesso: meio deslocamento; 6–9: não sai do lugar; 5 ou menos: cai, 1d6 a cada 3 m).
**FA:** a câmara x 13–18, y 9–13, com **ossos no chão** e a **estalagmite em (15,10)**. Lixo na ponta leste
em (16–17, 10): a base da chaminé.

### 4 — Passagem estreita
**Livro:** daqui em diante é escuro. A passagem principal **começa a subir**, com o riacho caindo pelo **lado
oeste**. Nas sombras, do outro lado do riacho, uma **passagem lateral vai para oeste** (até o covil). Daqui já
se vê a ponte da área 5, **6 m acima**; notar o goblin dela é **Percepção contra a Furtividade** dele, e ele nota
quem traz luz ou chega sem cuidado — e aí não ataca: **vai até a área 7 mandar soltar a enchente**. A passagem
oeste é **entulho, terreno difícil**, e a elevação entre os dois níveis é **frágil**: mais de 45 kg a quebra,
tudo rola para leste, **Destreza CD 10**, 2d6 (metade se passar) e derrubado se falhar.
**FA:** a subida é x 11–13, y 7–13, com o riacho em x 12–13. A passagem oeste é a faixa de entulho em y 6,
x 8–11, sob o ladrilho `Collapse` — o ressalto frágil.

### 5 — A ponte
**Livro:** um túnel alto passa perto de um túnel largo mais baixo, e os goblins fizeram ali uma **ponte com
posto de vigia**. A passagem do riacho sobe mais uns degraus e **vira para leste**; vem barulho de cachoeira lá
da frente. A ponte fica **6 m acima do riacho**, ligando os dois túneis altos. **1 goblin** escondido nela
(Percepção contra Furtividade). Se vê o grupo, sinaliza a área 7 e **atira azagaias**. Escalar as paredes até
a ponte: **Atletismo CD 15**. A ponte tem **CA 5 e 10 PV**; a 0 ela quebra, e quem está em cima faz **Destreza
CD 10** ou cai, 2d6 e derrubado.
**Enchente:** os tanques da área 7 têm muros frágeis. No turno depois do sinal, os goblins de lá começam a
derrubá-los; no turno seguinte deles, a água desce **da área 7 até a área 1**. Quem está **na ponte ou subiu
pelas paredes** fica fora; quem está **na passagem da área 4 ou nos degraus da área 3** faz **Destreza CD 10**;
falhou, **Força CD 15** para se agarrar; falhou de novo, é derrubado e levado até a área 1, com **1d6**. Uma
segunda enchente só sai se o goblin da ponte mandar, depois de ver o efeito da primeira.
**FA:** as tábuas da ponte em **(15,4)–(16,5)**, na diagonal noroeste–sudeste, por cima do canal em x 13–15,
y 5–7. O anel de túneis altos é x 8–14, y 2–5, em volta de uma ilha de rocha.

### 6 — Covil dos goblins
**Livro:** caverna larga **dividida em duas por um ressalto de 3 m**, com uma escada natural entre as partes.
Fumaça de cozinha e cheiro de couro curtido. **6 goblins, um deles o líder (12 PV), Yeemik.** Os **cinco comuns
ficam perto do fogo na parte BAIXA (lado norte), perto da entrada**; o líder fica **em cima (lado sul)**.
**Sildar Hallwinter** está amarrado na **parte sul**, com **1 PV**. Vendo o grupo ganhar, Yeemik leva Sildar à
beira do ressalto e pede trégua; quer ser chefe no lugar de Klarg e propõe soltar Sildar em troca da cabeça
dele — e mesmo cumprido o trato, cobra resgate. Recusado, **joga Sildar do ressalto: 1d6, que o deixa a 0 PV**.
**Tesouro:** Yeemik leva uma algibeira com **3 dentes de ouro (1 po cada) e 15 pp**.
**FA:** a parte de baixo (norte, entrada, fogueira) é x 2–9, y 3–7, com a **fogueira em (3,6)**, colchões e um
barril; a entrada chega pelo leste em (6–9, 5–6). A **borda de 3 m** corre em y 7–8. A parte de cima (sul) é
x 2–10, y 8–10 — onde ficam Yeemik e Sildar.

### 7 — Caverna dos tanques
**Livro:** a caverna é **cortada ao meio por dois tanques largos**. Uma **cachoeira estreita no lado leste** os
enche, e eles transbordam no riacho que sai pela entrada. **Muros de pedra** fazem de barragem. Uma **saída larga
vai para o sul** (área 8) e **duas passagens pequenas para oeste**. A cachoeira abafa tudo: a área 8 não ouve a
luta daqui, nem o contrário. **3 goblins**; começada a luta aqui, **um corre avisar Klarg**.
**FA:** a água em x 21–28, y 3–8, cortada por uma **fileira de pedras em diagonal** de (22,6) a (27,8) — a
barragem. **Cachoeira em (28,7)–(29,7)**. Saída sul em x 22–26, y 9–11. Saída oeste pelo canal x 18–21, y 3–4.

### 8 — Caverna de Klarg
**Livro:** o saque do último mês está aqui. **Sacos e caixas** roubados empilhados na **parte sul**. A **oeste,
uma abertura pequena desce no escuro** (a chaminé). Ao **norte, uma abertura grande com degraus naturais**, e o
eco da água atrás. No meio, a **brasa de uma fogueira grande**: **1 de dano de fogo** a quem entra, **1d6** a
quem cai nela. **Klarg** (bugbear), o lobo **Serrote** e **2 goblins**. Os suprimentos dão **meia cobertura** e
levam a marca do **leão azul** da Leão-Escudo. **Escondido entre eles, um baú destrancado**; quem procura nos
suprimentos acha. Avisado, Klarg e o lobo **se escondem atrás das estalagmites** e os goblins atrás dos
suprimentos, para emboscar; desavisado, pode ser **surpreendido** — e o jeito mais fácil é **subir pela
chaminé**. **Morto o lobo, Klarg foge pela chaminé.**
**Tesouro:** o baú tem **600 pc, 110 pp, 2 poções de cura e uma estatueta de jade de sapo com olhos de ouro
(40 po)**. Devolver os suprimentos à Leão-Escudo vale **50 po** e a amizade de Linene.
**FA:** **fogueira em (23,13)**; suprimentos ao **sul** (x 23–28, y 15–16) e a **leste** (x 27–28, y 13–15);
**baú em (26,15)**; **estalagmites em (21,12), (21,13) e (28,13)**. As duas bocas escuras na parede oeste,
(21,12) e (21,13), são o alto da chaminé — e estão na rocha, então o ponto de subir/descer é a casa de chão
ao lado, **(22,12)**.

### XP
**75** por chegar ao esconderijo (fecha a emboscada) e **275** por limpá-lo, que leva o grupo ao 2º nível.

---

## As coordenadas do capítulo 2: de → para

Tudo o que `capitulo2.js` e a cena em `encounter.js` fixam por casa. "A medir" quer dizer que depende do terreno
que ainda vai ser pintado (seção seguinte).

### Constantes do capítulo (`capitulo2.js`)

| o que é | hoje (40×28) | no mapa da FA (30×20) |
|---|---|---|
| `RIACHO_FORA` — a margem oeste do riacho, linha a linha | `{18:15 … 27:10}` | y 12–19, coluna ≈ 10 — **a medir** casa a casa no desenho |
| `atravessou(p)` — cruzou para o lado dos vigias | `y ≥ 18`, `x ≤ 26` | `y ≥ 13`, `x ≤ 21` (área 2) |
| `naPassagem` — por onde a enchente desce | retângulo x 13–26, y 5–17, altura ≤ 1 | áreas **4** e os degraus da **3**, mais o riacho até a 1; **fora a 5** — melhor por SALA que por retângulo |
| `RESSALTO` — a elevação frágil | (11,5), (11,6) | **(9,6), (10,6)** |
| `CHAMINE_BASE` | (25,13) | **(17,10)** |
| `CHAMINE_TOPO` | (28,16) | **(22,12)** |
| `DENTRO_DO_KLARG` | `x ≥ 27 && y ≥ 14` | a sala **8** (`salaDe(...) === 'chefe'`) |
| heróis "todos lá fora" (linha 336) | `y ≥ 16` | a sala **1** |
| retângulo de acalmar os lobos (1022) | x 18–25, y 10–15 | a sala **3** |
| goblin "em cima da ponte" (1052) | x 20–21, y 5–6 | **x 15–16, y 4–5** |
| "Romper o dique" (1088) | `entulho`, y = 4, x 32–37 | a barragem: `entulho` em x 21–26, y 3–7 |
| onde cai quem despenca da ponte (485) | (13,6) | (14,6) — o canal sob as tábuas |
| onde a enchente larga quem leva (532) | (16,19) | (9,15) — área 1, beira do riacho |
| onde Sildar cai ao ser jogado (595, 611) | (4,7) | (4,6) — parte de baixo do covil |
| para onde a água corre do dique (1071) | (19,6) | (20,6) — a saída oeste dos tanques |

### A cena (`encounter.js`, `variante === 'esconderijo'`)

| o que é | hoje | no mapa da FA |
|---|---|---|
| partida do grupo | (5,24) (6,25) (4,25) (7,25) | **(1,16) (2,16) (1,17) (2,17)**, olhando para leste |
| fogueira do covil | (5,6) | **(3,6)** |
| fogueira de Klarg | (32,17) | **(23,13)** |
| objeto `ponte` | (20,5), corrimão N–S | **(15,4)**, mas a ponte da FA corre na **diagonal** |

### O bando (`foesEsconderijo`)

| quem | hoje | no mapa da FA |
|---|---|---|
| 2 goblins vigias | (20,22) (22,23) | **(13,16) (14,17)** — dentro do abrigo de ripas |
| 3 lobos do canil | (21,11) (24,13) (22,13), corrente em (23,12) raio 10 pés | **(14,11) (16,11) (17,12)**, corrente em **(15,10)** — ver o alerta abaixo |
| goblin da ponte | (21,5) | **(16,5)** |
| goblins do covil | (4,6) (6,5) (6,7) (7,6) — **são 4** | **(4,5) (5,5) (4,7) (5,6) (6,5)** — **5, como no livro** |
| Yeemik | (5,10) | **(5,9)**, parte de cima |
| Sildar (neutro) | (4,10) | **(4,10)**, parte de cima — coincide |
| 3 goblins dos tanques | (29,8) (34,9) (36,8) | **(22,7) (25,7) (26,8)**, junto da barragem |
| Klarg | (30,19) | **(25,13)**, a leste da fogueira |
| Serrote | (33,20) | **(24,14)** |
| 2 goblins de Klarg | (29,17) (35,22) | **(25,15) (27,14)**, atrás dos suprimentos |

**Alerta do canil.** O canil da FA é menor que o nosso. Com a corrente em (15,10) e raio de 10 pés, um lobo
alcança (13,10)–(13,11) — **os degraus**, e o livro é claro que eles **não alcançam os degraus**. Ou a corrente
vai para a ponta leste, ou o raio cai para 5 pés. Medir na construção.

---

## O que o mapa importado NÃO tem, e o capítulo precisa

O import do Foundry é só `_` (caverna) e `R` (rocha), e **não tem camada de altura**. Mas o capítulo lê terreno
e altura em quase tudo — então o porte inclui **pintar**, não só mover coordenada.

**Terreno, por glifo que o capítulo consulta:**

| glifo | onde vai | quem usa |
|---|---|---|
| `riacho` | o canal, de (28,7) pelos tanques, sob a ponte, descendo por x 12–13 até a borda | o fluxo e a enchente |
| `ponte` | as tábuas, (15,4)–(16,5) | "Cortar as cordas da ponte" |
| `entulho` | a passagem oeste (y 6, x 8–11); base e topo da chaminé; a barragem (x 21–26, y 3–7) | chaminé, dique, terreno difícil |
| `arbusto` / `espinheiro` | o mato da área 2, e a margem oeste que o livro diz ser impenetrável | "Vasculhar o mato", a cobertura |
| `tocaia` | o abrigo de ripas, (13,16)–(14,17) | "Vasculhar o mato" |
| `mantimentos` / `bau` | os suprimentos ao sul e a leste da área 8; o baú em (26,15) | "Revirar os suprimentos", meia cobertura |
| `A` (estalagmite) | (15,10) no canil; (21,12), (21,13), (28,13) em Klarg; as dos tanques | cobertura, a corrente dos lobos |
| `rocha` | já vem do import | "Escutar" |

**Altura (1 nível = 1,5 m):**

| onde | nível | por quê |
|---|---|---|
| áreas 1 e 2 | 0 | o pé do morro |
| a passagem da área 4 | sobe de 0 a 1 | "começa a subir"; `naPassagem` pede altura ≤ 1 |
| o canil | 1 | "alguns degraus" acima da passagem |
| o covil, parte de baixo | 2 | mais alto que a entrada |
| o covil, parte de cima | **4** | o ressalto de **3 m** acima da de baixo |
| a ponte | **4** acima do canal sob ela | **6 m** acima do riacho |
| tanques e Klarg | 3 a 4 | a caverna sobe por dentro; os degraus ao norte de Klarg |

**A ponte por cima do riacho** é o ponto mais delicado: no desenho as tábuas passam **sobre** o canal, e uma
casa da grade não guarda dois andares. A planta antiga resolvia com o objeto `ponte` sobre o canal; o porte tem
de fazer o mesmo, e decidir que casas são "a ponte" e quais são "o riacho embaixo".

---

## Livro × capítulo: o que diverge hoje

Achados de fidelidade, independentes do mapa. Nenhum foi corrigido.

1. ~~**Falta um goblin no covil.**~~ **Achado errado — é decisão medida.** O livro põe 5 goblins + Yeemik e o jogo
   põe 4, mas de propósito, e o motivo está escrito em `foesEsconderijo`: com cinco, o covil dava 900 de XP
   ajustado, "mortal" para quatro heróis de 2º nível, com **18% de derrota medida**; com quatro, **95,5% de
   vitória**. Ficou como está.
2. **A ponte quebra de outro jeito.** No livro ela tem **CA 5 e 10 PV** e cai quando chega a 0; escalar até ela é
   **Atletismo CD 15**. No jogo é "Cortar as cordas", **Atletismo CD 10**. É adaptação nossa — vale marcar como tal.
3. **A fogueira de Klarg** cobra o 1 de dano de quem entra; o **1d6 de quem cai nela** não achei no código.
4. **Revistar o corpo nunca aparece no esconderijo.** O sistema existe (`game/saque.js`), mas só abre para quem
   está em `TESOURO_POR_INIMIGO`, e lá só há `nezznar`, `iarno` e `hobgoblin`. Nenhuma das 19 criaturas daqui
   (`goblin`, `lobo`, `yeemik`, `sildar`, `klarg`) tem entrada. O tesouro do livro **existe**, mas por roteiro:
   a algibeira de Yeemik sai na conversa do covil (linha 901) e o baú sai de "Revirar os suprimentos"
   (linha 802), com os números certos. Pelo livro, **o único tesouro que está num corpo é a algibeira de
   Yeemik** — o baú de Klarg está entre os suprimentos, não com ele. Pôr a algibeira na tabela exige tirá-la do
   roteiro, senão ela sai duas vezes.

---

## O que mudou na construção

Cada desvio da proposta acima saiu de uma medida feita com o motor, não de gosto.

| o quê | proposta | construído | por quê |
|---|---|---|---|
| a ponte | (15,4)–(16,5), nível 4 | idem, **mais os patamares** (14,3), (15,3), (14,4) e (17,5)–(17,6), também no 4 | as paredes da FA desenham a ponte com patamar murado do lado do canal nas duas pontas. Postos no canal, eles ficavam soltos e a rota alta até os tanques **não existia** (medido). Agora há as duas rotas do livro: o canal por baixo e a ponte por cima |
| a corrente dos lobos | espeto em (15,10), raio a medir | espeto em **(16,11)**, raio **5 pés** | com o espeto na estalagmite, a mordida alcança os degraus (x 13), e o livro diz que não alcança. Em (16,11) fica a 15 pés deles |
| os degraus do canil | — | (13,10)–(13,12), nível 1 | o canil só se abre por **(13,10)→(14,10)**; as outras duas são muradas do lado da câmara |
| Klarg | (25,13), "atrás da estalagmite" | **(27,13)** | da soleira (24,10)/(25,10) **nenhuma casa tem meia cobertura** — ou se vê tudo, ou nada. O "atrás de uma estalagmite" fiel é a casa que a soleira não enxerga, encostada na estalagmite de (28,13), e a 30 pés da chaminé (fugir custa um turno) |
| Serrote | (24,14) | **(26,13)** | fora da vista da soleira, junto de Klarg |
| goblins de Klarg | (25,15), (27,14) | **(22,11), (27,12)** | em (24,15) um deles se via da coluna x 24 dos tanques inteira, e a luta de Klarg começava de dentro dos tanques. Em (26,14)/(26,15) só a aresta em degrau os escondia: quando a visão passou a seguir o traço da FA, cinco casas dos tanques os viam pelo corredor. Medido com a visão pela geometria: só 22,11, 26,13, 27,12 e 27,13 ficam fora da vista dos tanques e da soleira, e **nenhuma** casa dos tanques vê o bando |
| topo da chaminé | (22,12) | **(21,14)** | (22,12) colava na fogueira; (21,14) é a casa de chão ao lado do buraco desenhado na parede oeste |
| base da chaminé | (17,10) | **(18,12)** | a ponta leste do canil, onde a fenda sobe |
| goblins do covil | 5 | **4** | ver o achado 1 corrigido acima: decisão de balanceamento medida |

E o que entrou junto, além do porte:

- **Investigar** o cenário e os corpos (`game/investigar.js`): o melhor entre Investigação e Percepção, uma vez por
  herói em cada casa. Cada superfície tem um achado; o capítulo 2 acrescenta **pistas presas à arte** — a laje
  rachada (achá-la impede o desabamento), o canil visto dos degraus, o lixo da fenda, o rastro dos dois corpos no
  riacho, as caixas com o leão azul, o dique de pedra solta, a cachoeira. Corpo de goblin traz a marca Dentefino.
- **Fogueiras que apagam e acendem** (`game/fogo.js`): a luz sai da conta da visão e a pintura do cômodo aceso
  (`LightDen`, `LightCave`) some junto. Acender pede uma tocha. A brasa apagada não queima.
- **A arte que muda com a história**: o ressalto desabado, o baú aberto, a ponte caída e os dois diques rompidos
  são as peças do pacote da FA, acesas quando a coisa acontece.
- **A algibeira de Yeemik** saiu do roteiro e foi para o corpo dele: "Revistar o corpo" dá os 3 dentes de ouro e
  as 15 pp, uma vez.
- **A rocha que se toca conta no escuro**: num mapa traçado como os do Foundry, a parede corre na face da pedra e a
  casa de rocha nunca era "vista" — o "Escutar" do capítulo, que é na rocha, morria. Vale para rocha, estalagmite e
  objeto encostado sem parede no meio; nunca para criatura nem para o chão do outro lado de uma parede de casa.
