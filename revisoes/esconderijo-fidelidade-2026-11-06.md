# Esconderijo dos Goblins (cap. 2) — pente fino contra o livro

6 de novembro de 2026. Parecer do `fidelidade-aventura` sobre a Caverna Dentegrosso, **reproduzido achado por
achado no motor**. O que segue é o veredito depois de medir, não o parecer cru: dos 12 achados dele, **4 eram
reais** e estão consertados, **5 eram falsos** (o código já fazia, e com a medida escrita ao lado) e **3 são
desvios declarados** — agora com o número que os justifica gravado no próprio código, para o próximo revisor não
os reabrir.

Provas: `testes-cenas.mjs` **68/68** (era 67), `testes-regras.mjs` 508/508, `testes-investigar.mjs` 27/27,
`testes-passivas.mjs` 255/255, `testes-sala.mjs` 141/141.

## Consertados

### 1. Dava para entrar no esconderijo inteiro sem os vigias existirem — 191 casas

O gatilho dos vigias era uma faixa de coordenadas: `y >= 14 && x >= 10`. A fileira **y = 13** ficava de fora, e ela
é a boca da caverna. Medido no motor:

| casa | sala | distância ao abrigo de ripas | o posto vê? | disparava? |
|---|---|---|---|---|
| (10,13) (11,13) (12,13) | `passagem` | **15 pés** | sim | **não** |
| (13,13) | `vigias` — a sala DELES | 15 pés | sim | **não** |
| (10,12) (11,12) (12,12) | `passagem` | 20 pés | sim | **não** |

Pelo lado seco **oeste** da água dava para sair da grama em (9,13), pisar em (10,13) e subir. Inundando o mapa com
a regra antiga a partir da chegada do grupo: **191 casas alcançadas sem os vigias notarem — `passagem`, `vigias`,
`canil`, `ponte`, `covil`, `pocos` e `chefe`.** As sete salas. Os 100 de XP do posto e o aviso ao Klarg ficavam no
mato para sempre.

Consertado em `capitulo2.js olhoDoPosto`: o posto nota quem está **a leste da água, numa das três salas da boca, a
até 20 pés e com linha de visão**. Medido para escolher o raio: de fora o grupo chega a 55–60 pés e os vigias já o
veem, então visão sozinha abriria a cena em emboscada; é o `x >= 10` que guarda a clareira da trilha (área 1, onde
o livro põe o grupo), e com ele até 30 pés não acende nada lá. A 20 pés o laço fecha a boca (y 12 e 13) e deixa em
paz a goela funda (y 11 a 25 pés, y 10 a 30). O riacho continua decidindo o TEXTO: quem entra pela faixa seca não
atravessa riacho nenhum, e dizer que atravessou seria mentir para o jogador — são quatro falas agora, não duas.

**A prova é permanente e é da PLANTA**, em `testes-cenas.mjs`: tira do tabuleiro cada casa que o posto nota e
exige que, da chegada, não se alcance nenhuma casa de dentro. Quem repintar o mapa e abrir outra porta pelo mato
quebra o teste.

### 2. A Linene pagava as 50 po sem a carroça

`capitulo2.js` gravava `suprimentosDaCompanhia: true` **sempre**. O capítulo 1 já guarda a resposta —
`carroca: outcome === 'vitoria'` —, e na derrota da emboscada da estrada a carroça se perde. O grupo que a perdeu
recebia da Escudo Leão por entregar o que não tinha. Agora a bandeira lê `campanha.capitulo1.carroca`.

### 3. A enchente vinha no passo seguinte, sem os dois turnos

O gatilho já guardava `{ turnos: 2 }`, o atraso do livro (os goblins dos tanques rompem o dique ao sinal da
ponte). **Ninguém lia o campo**: `enchente()` corria na primeira chamada depois do assobio. Dado morto, e a
armadilha da cena perdia o que a torna armadilha — os dois turnos para sair da passagem, subir nos degraus do canil
ou correr para a boca. Agora o campo decide, com dois avisos (a pedra raspando, depois o riacho turvo).
`{ turnos: 0 }` — o dique rompido pelo próprio grupo — continua caindo na hora.

### 4. O barril do covil era desenho morto

Único objeto **pintado** do esconderijo sem verbo nenhum. A casa (2,6) barra passo e ficou **sem sala** na pintura,
então as pistas de `covil` não a alcançavam: nem faísca passiva, nem Procurar, nem Investigar. Agora a pista vem
pelo GLIFO, e a varredura de ±2 casas de `casasNotadas` a acende das casas em volta. Não dá tesouro: o barril é da
pintura da FA, não do livro, e no livro o covil não tem nada além da algibeira do Yeemik — o cheiro de couro
curtido que o livro põe na sala é o que está dentro dele.

E de passagem: **Iarno Alberk → Iarno Albrek** na fala do Sildar, como nos outros cinco lugares e no livro.

## Falsos — o código já fazia

| achado | o que há de verdade |
|---|---|
| "o goblin não corre avisar o Klarg" | `capitulo2.js:880+`: avisar custa **um turno de goblin**, e o comentário explica por quê (antes, começar a luta dos poços já o deixava avisado mesmo que os três caíssem na primeira rodada) |
| "falta a condição de fuga do Klarg" | ele corre quando perde **metade** da vida, não na morte do Serrote. Medido em **1500 lutas**: com a fuga na morte do lobo, "matar o Serrote primeiro" era jogada dominante (99,1% contra 93,9%, e em 41% Klarg saía sem dar um golpe) |
| "o Sildar só conta 2 dos 4 fatos" | o revisor leu só o painel de fim de capítulo. A árvore de conversa dá os quatro: Aliança dos Lordes, Gundren e os irmãos acharam a entrada da mina, Castelo Dentefino a mando da Aranha Negra, e **Iarno Albrek sumido em Phandalin** — que `phandalin.js:46` e `:423` depois abrem como missão |
| "a fogueira do covil queima como a do Klarg" | é a regra genérica de brasa, e respeita o abafar de `game/fogo.js`: fogo aceso queima quem pisa e quem cai nele, nas duas fogueiras. Fogo de cozinha queima |
| "o esconderijo não tem prop nenhum" | **medi o campo errado da primeira vez e repito o conserto**: o esconderijo pinta seus objetos como GLIFO DE TERRENO (`u` barril, `F` fogueira, `K` baú, `s` mantimentos, `z` leito, `A` estalagmite, `x` entulho), não como `mapa.objetos`, e o capítulo dá verbo na superfície — entulho (chaminé, dique), mantimentos e baú, ponte, leito, poço, estalagmite, tocaia. O padrão da Onda Eco já estava cumprido por outro caminho; faltava só o barril |

## Desvios declarados — agora com o número no código

- **A ponte não se destrói.** O livro lhe dá CA 5 e 10 PV. Medido: trocando as duas casas de `ponte` por rocha, o
  alcançável a partir da chegada cai de **318 para 229 casas**, e a **área 7 inteira** — os dois tanques, o dique,
  a enchente, três goblins e o aviso ao Klarg — sai do jogo. Ponte destruível só com um segundo caminho para os
  tanques, que esta planta não tem. A medida está agora no comentário da ação.
- **O laço da trilha** é narração da viagem, fora do mapa (Percepção passiva 12, salvaguarda, pendurado de cabeça
  para baixo e cortado pelos outros). Sem condição de agarrado porque não há tabuleiro ali.
- **Elenco da emboscada e do covil** (3 goblins + 2 lobos na estrada; 4 goblins comuns no covil em vez de 5).
  As duas decisões estavam escritas no código, mas com números da PLANTA ANTERIOR — o próprio comentário da
  emboscada avisava. **REMEDIDAS no mapa de hoje**, as mesmas sementes nas duas colunas:

  | emboscada da estrada, 1º nível | nosso: 3 goblins + 2 lobos | livro: 4 goblins |
  |---|---|---|
  | vitórias | 97% | 99% |
  | alguma morte | **0%** | 1% |
  | alguém a 0 PV | 28% | 14% |
  | vida que sobra | 78% | 86% |

  A nossa **desgasta mais e mata menos** — sustos sem luto, que é o que se quer do primeiro combate da
  campanha. É o contrário do que o achado temia.

  | covil, 2º nível | nosso: 4 + Yeemik | livro: 5 + Yeemik |
  |---|---|---|
  | vitórias | 94% | 84% |
  | **derrotas** | **6%** | **16%** |
  | alguma morte | 5% | 10% |
  | vida que sobra | 70% | 56% |

  O quinto goblin **triplica a derrota e dobra as mortes**, numa sala que ainda tem o Yeemik, o refém e a
  negociação depois. As duas ficam como estão, agora com o número do mapa atual gravado em `foesEmboscada` e
  `foesEsconderijo`. Ferramentas: `src/dev/simular-emboscada.mjs [--livro]` e `src/dev/medir-covil.mjs
  [--livro]`. O de-para (`revisoes/esconderijo-de-para-2026-11-04.md`) já corrigiu o mesmo achado uma vez.
- **Yeemik com o bloco do Livro dos Monstros** (`fonte: 'MM'`): decisão comentada e travada por
  `testes-regras.mjs:1151`. O que ERA real: `src/rules/npcs.js` dizia `fonte: 'SRD'` com um comentário alegando
  "números de goblin comum", e as duas coisas eram falsas. Corrigido.

## O que fica para depois

**Nove trechos perto demais do livro**, em `capitulo1.js` e `capitulo2.js`. **FEITO** — e a medida mudou o
achado: `src/dev/conferir-colagem.py` mostrou que nenhum deles compartilhava uma frase com o original (o maior
trecho igual de todas as cenas tinha nove palavras, e era nome próprio). O que havia era a ORDEM DAS IDEIAS, e
foi ela que se reescreveu: o gancho do Gundren, a confissão do goblin, a boca da caverna, a fala do Sildar, o
painel de fim de capítulo e os dois `clima` que decalcavam a leitura em voz alta. A mesma medida achou o que
ninguém procurava — catorze citações LITERAIS do livro dentro de comentário de código, e a carga da carroça em
texto de jogo. Tudo em `revisoes/colagem-2026-11-06.md`.

## A lição que se repete

Dos 12 achados, 5 falsos e 3 desvios declarados: **8 de 12 eram decisão já medida e escrita no código**. O revisor
não lê comentário como regra — e tem razão em não ler. O que funciona é o que fiz em cima da ponte e do bypass:
**pôr o NÚMERO medido no comentário** e, quando dá, **uma prova permanente no teste**. Comentário sem número é
opinião; com número, é o parecer que já foi dado.
