# O Castelo Dentefino contra o livro — 2026-11-06

Parecer do `fidelidade-aventura` sobre o Castelo reconstruído no battlemap da Forgotten Adventures, mais o
que eu reproduzi medindo. Regra do projeto: o revisor devolve parecer, quem conserta é quem chamou, e cada
achado só vale depois de reproduzido. Nada foi corrigido ainda.

Medido com `montarCampo` + `hasLineOfSight` + `reachable` sobre `mapaDo('castelo')`, com o texto em pt-BR de
`_referencias/livro/mina-perdida-de-phandelver.pdf` (áreas 1 a 14) e com os **ladrilhos com nome da própria
cena da FA** (`mapas/_cenas/cragmaw-castle-31x22.json`, 35 ladrilhos, grade de 100 px, origem 800,600).

## O que a FA já dizia e nós não lemos

É o achado que destrava os outros três. A cena do Foundry traz ladrilhos COM NOME, e o CLAUDE.md já diz que
eles são "o índice das salas, de graça" — mas o gerador do Castelo nunca os leu. Convertidos para casa:

| ladrilho da FA | casa | tamanho | o que é |
|---|---|---|---|
| `Canvas.webp` | (18,3) | 2 x 3 | **a lona da área 11** |
| `Shrine.webp` | (12,7) | 5 x 5 | **a área 8, o Salão Escuro** |
| `ChapelTreasure.webp` | (13,8) | 1 x 1 | o tesouro dentro da 8 |
| `Shrine.webp` | (13,4) | 2 x 1 | o santuário da área 9 |
| `EntranceTrap.webp` | (9,10) | 3 x 2 | o fio da área 2 |
| `Barracks.webp` | (21,9) | 4 x 6 | o alojamento da área 12 |
| `BanquetIntact` + 2 variantes | (11-13,12) | ~4 x 4 | a mesa da área 7 |
| `BedIntact` / `BedWreck` | (24,4) / (25,7) | 4x6 / 3x3 | a cama da área 14 |

As nossas `guarda`, `salaoArmadilha`, `banquete`, `rei` e `santuario` caem em cima do ladrilho certo. As
três que erram são as três de baixo.

## ACHADOS CONFIRMADOS

### 1. A lona está na parede errada E a interação está morta. (ALTO)

Duas medidas independentes:

- **Aritmética.** `CASTELO.arestas.lona` é a aresta (18,8)|(18,9); o menu em `capitulo4-castelo.js:989` só
  aparece se `tile.y <= CASTELO.lona.y - 1`, e `CASTELO.lona` é (19,6), logo `y <= 5`. As casas da aresta
  têm y 8 e 9. **"Procurar uma entrada" nunca aparece, em nenhuma casa, para nenhum herói.**
- **Alcance.** A aresta (18,8)|(18,9) é interna: o gerador a faz de `ruina <-> salaoEscuro`
  (`mapa-castelo-fa.py:588`). Partindo do terraço, `reachable` alcança 378 casas, e nem (18,8) nem (18,9)
  estão entre elas. Ninguém procura de fora uma porta que só existe por dentro.

O livro (área 11): *"Lonas empoeiradas escondem a entrada NORTE para esta área... Se os personagens
estiverem ativamente procurando POR FORA do castelo por uma entrada escondida, eles podem fazer um teste de
Sabedoria (Percepção) com CD 10"*. E a ruína tem, além disso, *"uma grossa cortina ao sul e uma porta
intacta a leste"* — a (18,8)|(18,9) é a cortina do sul, não a lona.

**Onde a lona fica, medido:** a ruína tem duas portas na parede norte, (18,4)|(18,5) e (19,4)|(19,5), e o
ladrilho `Canvas.webp` da FA cobre exatamente (18,3)-(19,5). As casas de fora dessas portas, (18,4) e
(19,4), **são alcançáveis do terraço**; as de dentro, (18,5) e (19,5), não. É a porta de fora que o livro
descreve, apontada pela arte da própria FA.

### 2. O Salão Escuro (8) não é a nossa `salaoEscuro`. (ALTO)

A nossa `salaoEscuro` são 11 casas em (16-20, 9-12), e as portas dela, medidas, são **quatro**: norte para a
ruína, oeste para `postoNorte`, leste para `guarda`, sul para o corredor. É a **passagem central** do
castelo, que o livro não numera.

A área 8 do livro é *"um salão alto e estreito... parte de uma capela ou templo... Ao norte, grossas
cortinas tapam a passagem por um par de arcos"*, e ao norte dela fica o santuário (9). No nosso mapa o
santuário é (12-15, 3-6) e logo ao sul dele, na mesma faixa de x, há uma faixa de chão **sem sala nenhuma**
em y 7-8 e, abaixo dela, a nossa `postoNorte` em (12-15, 9-11). Junto, (12-15, 7-11) — que é, casa por
casa, o ladrilho `Shrine.webp` 5 x 5 da FA, com o `ChapelTreasure` em (13,8) dentro.

Consequência: o grick, o braseiro frio com a estatueta, os entalhes angelicais e o `OLHO_DA_SALA` do salão
escuro estão todos na passagem, e na área 8 de verdade nascem dois arqueiros goblins que o livro não põe
lá.

### 3. Os postos de arqueiro (área 3) não existem. (ALTO)

Este não depende de ler o mapa do livro, só do que o livro diz que os postos FAZEM: *"As aberturas para
arqueiros ficam em frente à porta, oferecendo um bom campo de tiro para o terraço em frente aos portões do
castelo."*

Medido:

- **`postoNorte`: 0 pares com linha de visão para o terraço**, de 12 x 48 = 576 testados.
- **`postoSul`: 8 pares de 720**, e os oito saem de (9,20), (10,20) e (11,20) — a borda do capim — vendo 1 a
  5 casas do canto oposto do mapa.
- **0 das 43 seteiras do mapa têm um lado no terraço.**

Ou seja: a sala cuja única razão de existir é atirar no terraço não vê o terraço de lugar nenhum. Os dois
goblins do norte estão dentro da área 8, e os dois do sul no capim de fora, perto do portão traseiro — que
o livro descreve como *"trancada, mas não é vigiada"*.

### 4. A porta escorada está na parede errada. (ALTO)

`CASTELO.arestas.portaEscorada` é (20,11)|(21,11), medido como `salaoEscuro <-> guarda` — a porta oeste do
alojamento dos guardas. O livro (área 12): *"O muro ao SUL está desmoronado, mas uma porta de madeira
bloqueada naquela direção ainda está firme"*, e a área 13 do outro lado: *"A porta para esta sala foi
mantida fechada com uma barra grossa de madeira"*. É a mesma porta, ao sul da 12, e no nosso mapa ela
existe: (21,14)|(21,15), `guarda <-> torreUrso`, hoje só `portaUrso`. O teste de Força CD 15 está na porta
errada, e a porta que o livro bloqueia não tem teste nenhum.

### 5. A mobília do rei não segue o desenho, e a banheira está no quarto. (MÉDIO)

Superfície por casa da sala do rei (24-27, 4-9), medida no motor:

- **`camaRei` em quatro casas separadas** — (25,4), (26,6), (25,7), (26,9) —, espalhadas pela sala inteira.
  O livro tem *"uma grande cama ao norte"*, e a FA pinta `BedIntact` como um bloco.
- **`banheira` em (25,8) e (26,7)**, dentro do quarto do rei. O livro põe a banheira de azulejo na **Sala
  Noroeste**, *"uma câmara parcialmente derrubada que foi um confortável banheiro"* — outro cômodo. No nosso
  mapa esse cômodo existe como chão sem sala em (21-23, 4-9) e está vazio.
- **`mesa` em (26,4) e (26,8)**, duas mesas em metades opostas. O livro tem uma mesa redonda, ao sul, perto
  da porta.

A causa é a receita de mobília: ela distribui o glifo pelas casas pintadas na ordem em que aparecem, sem
perguntar o que a FA pintou naquela casa. Então o Examinar pode mentir — o jogador vê o destroço da cama e
o jogo diz "banheira de cobre".

### 6. Vyerith não pode fazer a emboscada do livro. (MÉDIO)

O livro: *"se os vilões forem avisados..., Vyerith se esconde atrás da porta a nordeste, deixando-a
entreaberta e esperando atacar um intruso pelas costas"*. A sala do rei tem **uma só porta** no nosso mapa,
(23,5)|(24,5), e o posto da Vyerith é (27,9): medido, **20 pés da porta**. Não há porta atrás da qual ela
esteja. Gundren, em (24,4), está a 5 pés da porta (isso bate), mas a 4 casas da `mesa` mais perto, e o
livro o põe *"próximo ao canto sudeste da sala"*, ao lado da mesa redonda.

### 7. O Examinar do armeiro contradiz o nosso próprio roteiro. (MÉDIO)

`castelo-exames.js:24` diz do armeiro: *"Sobraram quatro, e nenhuma delas combina com as outras"*.
`capitulo4-castelo.js:929`, na mesma sala: *"tudo pendurado, tudo em ordem, nada no chão"*. Uma das duas
frases é falsa para quem clica nas duas, e o livro está do lado da segunda (14 armas em ordem).

### 8. O Escutar no portão traseiro devolve silêncio. (MÉDIO)

A opção de Escutar (`capitulo4-castelo.js:841`) conta `moradoresEm(sala)`, e o `corredor` tem 0 criaturas,
então o portão traseiro responde silêncio. O livro (área 10): quem escuta nas seteiras do portão ouve **a
área 7** — *"um ocasional barulho de louça e goblins irritados discutindo sobre se os pratos precisam ser
limpos"*. O portão traseiro é a porta do fundo do banquete, não de uma sala vazia.

## ACHADOS QUE EU NÃO REPRODUZI

Ficam listados como o revisor os deu, sem a minha medida — quem os for consertar mede primeiro.

- Os nomes das salas que o revisor declarou certos (santuário, salão da armadilha, banquete, rei,
  alojamento hobgoblin, torre do urso, torre sul, despensa, corredor, terraço): conferi só as cinco que
  caem sobre ladrilho nomeado da FA.
- O 3N e o 3S que o revisor propõe em (5-9, 8) e (6-8, 14): são chão sem sala no nosso mapa, mas **não medi
  se dali se vê o terraço**, e sem seteira para o terraço em lugar nenhum do mapa a pergunta continua
  aberta.
- Falta da besta pesada e da cota de malha do Sildar; mecânica do conhaque (2 copos no livro, "o terceiro já
  basta" em `gear.js:194`); o bando do Targor, que é opcional; o portão caído do terraço; 1 casa de palha no
  alojamento contra 4; a arca do urso em borda alta.
- As passagens que o livro chama de cortina (8↔9, 11, 12) viraram porta com folha — não medi se barram
  visão.
- As salas nascerem no breu contra o *"luz fraca de dia pelas seteiras"* do livro.
- Os trechos de texto que o revisor achou perto demais do original (linhas 603, 621-622, 957, 1061).

## ACHADO DO REVISOR QUE EU DESCARTO

**O terraço de 48 casas sem mobília "fora da muralha" não é defeito.** O próprio revisor concluiu isso no
item 3a dele, e eu confirmo pela medida: o terraço (0-5, 8-16) encosta direto no salão da armadilha em y11,
sem parede entre os dois — os portões estão quebrados, como o livro diz, e a área 1 é o pátio aberto diante
deles. Uma casa do salão da armadilha, (6,11), vê todas as 48 casas do terraço.

## Ordem de conserto, se for consertar

1. **`SALAS` refeita**, usando os ladrilhos nomeados da FA como semente em vez de caixa à mão: a 8
   verdadeira em (12-16, 7-11), uma `passagem` nova para a nossa `salaoEscuro` de hoje, e a Sala Noroeste em
   (21-23, 4-9). Isso conserta os achados 2 e 5 (a banheira ganha onde morar) de uma vez.
2. **A lona nas duas portas norte da ruína**, com a guarda do menu reescrita para "a casa clicada é a de
   fora da aresta" em vez da conta de y.
3. **O teste de Força na porta 12↔13**, e a de oeste solta.
4. **A mobília casada com o que a FA pinta**, casa a casa, em vez de distribuída na ordem.
5. **Os postos de arqueiro**: decidir onde ficam medindo a linha de visão para o terraço, e aceitar que sem
   seteira para o terraço no mapa da FA eles podem simplesmente não existir nesta planta.
6. Escutar no portão traseiro com o barulho do banquete; o Examinar do armeiro reescrito.

## Adendo: o que eu consertei, no mesmo dia

Os quatro ALTOS foram corrigidos, e com eles os dois MÉDIOS que vinham de carona na mesma mudança (a banheira
e a emboscada da Vyerith). Cada um ganhou **prova permanente** em `testes-cenas.mjs` — quatro testes novos,
que medem no motor em vez de confiar no arquivo gerado. A bateria foi de 60 para 64.

1. **A lona são as duas portas norte da ruína** (`portas_para_fora('ruina', lado='N')`), e a guarda do menu
   deixou de ser uma conta de `y` e passou a perguntar o que importa: a casa clicada é um lado de fora da
   lona, e quem clica não está dentro da ruína. Conferido no jogo rodando: de (18,3) o menu traz "Procurar uma
   entrada"; de (18,5), dentro, não traz. O ponto `CASTELO.lona` virou a casa de DENTRO, que é a que a fuga da
   Vyerith precisa.
2. **A área 8 é a capela.** `salaoEscuro` passou a ser a semente (13,9) na caixa (11,7)-(16,11) — 18 casas,
   contra 11 —, e o que era `salaoEscuro` virou `passagem`. As duas casas da fileira norte são os **dois
   arcos**, cada um com a sua porta para o santuário, com pedra entre eles; `pontos.cortinas` passou a ser
   elas. O braseiro frio caiu sozinho em **(13,8)**, entre os arcos, em cima do `ChapelTreasure.webp` da FA —
   o gerador o põe nas casas que o desenho mostra, e o desenho concorda com o livro. O grick nasce dentro.
3. **Os postos de arqueiro são os dois bolsos de entulho que flanqueiam a entrada**, (5-7, 8-9) e (6-7, 14-15),
   colados no salão da armadilha. A receita deles virou só entulho, como o livro ("esta pequena sala está
   cheia com detritos"), e os textos de espiar deixaram de prometer "uma fresta dando para o vale". **O campo
   de tiro para o terraço continua não existindo**, e isso agora é um teste: `assert.equal(paraOTerraco, 0)`.
   Preferi travar a medida a fingir que a planta a tem.
4. **A porta escorada virou a porta do urso**, que é uma porta só. No jogo ela oferece as três coisas:
   "Jogar carne pela fresta", "Levantar a tranca" e **"Arrombar a porta" (Força CD 15)** — e arrombar acorda o
   bicho igual, porque um estrondo não acorda menos que uma tranca caindo.
5. **A banheira mudou de cômodo.** Nasceu a sala `banheiro` (5 casas, 22-23 x 4-6), que só se alcança pelo
   quarto do rei, e o `B` passou a ser exigido nela. O quarto do rei ficou com zero banheiras.
6. **Vyerith e Gundren saíram do índice e foram para a geometria.** O capítulo agora acha a porta do quarto
   pelas `folhas`, põe a doppelganger na casa mais perto dela ("se esconde atrás da porta... esperando atacar
   um intruso pelas costas") e o anão na mais longe, que é o fundo da sala, ao lado da mesa redonda.

## Segunda leva, no mesmo dia: os três médios que faltavam

7. **CADA PALAVRA DA RECEITA DE MOBÍLIA É UMA PEÇA.** Era este o defeito de fundo do achado 5, e ele valia
   para as quinze salas: a receita dizia `DDDD`, mas cada cópia do glifo era posta por conta própria, na
   primeira casa pintada que coubesse. Medido antes: a cama do rei em (25,4), (26,6), (25,7) e (26,9) —
   **quatro camas de uma casa nos quatro cantos** — e duas mesas em metades opostas. Agora as casas de uma
   mesma palavra se colam, e uma palavra NOVA do mesmo glifo foge das outras (é assim que o banquete pode ter
   as "duas largas mesas de madeira" do livro, e a ruína os dois montes de escombro). Medido depois: a cama
   em um bloco de 4, a mesa do rei em um de 2, as do banquete em um de 6 — porque a FA as pinta encostadas.
   Só um pedaço solto sobrou no castelo inteiro, os caixotes da despensa, e barril em duas pilhas não é
   defeito. O gerador agora **conta e nomeia** as peças que saem partidas, em vez de calar.

   Com o algoritmo consertado, as receitas foram reescritas pelo que o livro descreve em cada área, em vez
   de herdadas da planta antiga — o alojamento hobgoblin tinha 23 peças para 4 casas úteis, a torre sul 22
   para 6. Isso trouxe junto duas coisas que o livro pede e faltavam: a **palha dos sacos de dormir** da
   torre sul ("vários sacos de dormir esfarrapados espalhados pelo que sobrou de espaço no chão"), e o chão
   do alojamento hobgoblin **limpo de entulho**, que é a frase exata do livro.

8. **O Examinar do armeiro deixou de contradizer o roteiro.** Dizia "sobraram quatro, e nenhuma delas
   combina", quatro linhas antes de o próprio capítulo dizer "tudo pendurado, tudo em ordem, nada no chão".
   O livro conta as armas uma a uma — cinco lanças, quatro espadas longas, três maças estrela, duas espadas
   largas e o bordão —, quinze, em suportes de parede. O armeiro está cheio.

9. **O Escutar passou a dizer o que o livro faz ouvir, em duas portas.** No **portão traseiro** a conta
   genérica contava os moradores do corredor, que são zero, e respondia "Silêncio"; o livro manda ouvir **a
   área 7**, "um ocasional barulho de louça e goblins irritados discutindo sobre se os pratos precisam ser
   limpos". E na **porta do quarto do rei** a conta dava "vozes baixas, duas ou três"; o livro dá a cena que
   o grupo precisa ouvir antes de entrar — "uma alta e grossa voz exigindo pagamento por algo e uma resposta
   calma e suave", que é o Grol negociando o mapa do Gundren com a Vyerith.

## Uma diferença de bússola que fica registrada

O livro põe no quarto do rei "uma grande cama ao norte" e "uma mesa redonda ao sul, próximo à porta". No
battlemap da FA é o contrário: o ladrilho `BedWreck` está em (25,7)-(27,9), o **sul** da sala, e a única
porta fica a noroeste. Como a regra deste projeto é que a pintura manda em onde a mobília fica, a cama ficou
no sul, em cima do desenho, e a mesa no norte. **O mapa manda no texto**, como já valeu no Cume.

## Terceira leva: o resto da lista

10. **CORTINA NÃO É PORTA.** O Foundry da FA não tem aresta de cortina e marcou as quatro como porta — e
    porta aqui barra o passo até alguém abrir. O livro as nomeia em três áreas: "ao norte, grossas cortinas
    tapam a passagem por um par de arcos" (8), "uma grossa cortina bloqueia a área ao sul" (11), "uma
    cortina está pendurada no caminho em forma de arco ao norte" (12). A aresta **etérea**
    (`core/grid.js RESTRICOES[5]`) é a tradução exata: passo LIVRE, visão e luz BARRADAS. Medido depois:
    atravessa-se sem abrir e não se vê o outro lado. As folhas de porta caíram de 25 para 21, que é o
    número certo: cortina não abre nem fecha.

    Isso obrigou a **apertar três caixas de sala**. Com o passo livre pelas cortinas, a caixa folgada fazia
    a sala de cima engolir a de baixo — o santuário descia pelos dois arcos e tomava a capela inteira, a
    ruína descia para a passagem, a guarda subia para o corredor nordeste. Onde a aresta não diz onde a
    sala acaba, quem diz é a caixa.

11. **A SALA COM SETEIRA E SEM CHAMA NASCE EM PENUMBRA**, e quem dá a regra é o livro, pelo avesso: a área
    13 está escura *"porque as aberturas para arqueiro aqui estão fechadas"* — se fechá-las escurece, é
    porque as abertas clareiam. A área 8 é a outra exceção escrita: *"mesmo de dia esta área não tem luz
    exterior"*. Antes o castelo inteiro nascia no breu. Agora são três salas em penumbra (passagem 11 casas,
    corredor 4, banheiro 5), e **a sala com fogo dentro continua no breu** — que é a lição já medida na
    Mansão e na Onda Eco: a sala que nasce clara faz a tocha dela não mudar casa nenhuma.

12. **A folha de portão caída existe, e está nos portões.** A chegada ao terraço diz "duas folhas podres,
    com ferragens verdes de azinhavre, **uma delas caída**", e não havia um `portaoCaido` no mapa inteiro —
    a FA desenha os portões na arte da muralha, não como móvel solto, então a peça nunca achava casa
    pintada. Virou exigida, e a primeira tentativa a pôs em **(0,13)**, a beira oeste do terraço, a dez
    casas da entrada. Com âncora na casa do terraço mais perto do salão da armadilha, ela foi para **(5,11)**,
    na boca dos portões.

13. **O equipamento do Sildar está completo.** O livro lista três coisas na despensa — *"uma cota de malha
    ensanguentada, uma besta pesada e uma espada longa sem bainha com o emblema de Neverwinter"* — e só a
    espada estava lá.

14. **O conhaque anão virou regra.** O livro: *"o barril contém o equivalente a vinte copos. Um personagem
    que beber um copo recupera 1 ponto de vida, mas um personagem que beber dois copos em menos de 1 hora
    fica envenenado por 1 hora."* Era tesouro puro, com uma descrição que dizia outra conta ("o terceiro já
    basta"). **A hora é o descanso curto**, que no SRD dura exatamente isso — o mesmo desenho do mal da água
    parada, que passa dormindo. Medido: 1º copo +1 PV, 2º copo envenena sem curar, o descanso curto limpa,
    e o barril marca os copos (17 de 20 depois de três).

15. **Os quatro trechos perto demais do original foram reescritos**, mantendo os fatos e mudando a lente:
    a escuta à porta do rei, a entrada no quarto, a chegada com o machado na nuca, o altar sob o pano e a
    bolsa no colchão.

    E **os dois textos de espiar os postos de arqueiro foram corrigidos de novo**: eu mesmo os tinha escrito
    prometendo "uma seteira estreita", e medido depois, esses dois bolsos não têm seteira nenhuma. Agora
    prometem o que o livro faz acontecer — um par de goblins atrás do entulho, que larga o arco e puxa a
    arma de mão quando alguém entra.

## Quarta leva: os dois últimos

16. **O BANDO DO TARGOR entrou**, e a conta de XP resolveu a ambiguidade do texto. O livro diz "três
    hobgoblins liderados por Targor Espada Sangrenta" e manda dividir **500 XP**; hobgoblin é ND 1/2
    (100 XP) e lobo ND 1/4 (50). Targor mais três hobgoblins dá 400, e os dois lobos dele fecham em
    **exatamente 500** — três ao todo daria 400, e o número do livro não bateria. São seis.

    Ele chega *"logo quando os personagens estiverem se preparando para sair"*, e só com o rei já caído, que
    é o que dá sentido à conversa. O livro dá a saída diplomática e ela virou árvore de diálogo: *"personagens
    espertos podem tentar usar a razão com Targor se fazendo pensar como um SUCESSOR de Grol ao invés de seu
    VINGADOR"*, Persuasão CD 15, e os 500 XP saem iguais tendo-se lutado ou negociado. O bando só pisa no
    tabuleiro se houver luta — assim o acordo não precisa desfazer nada.

    **Conferido jogando**: com o rei vencido, "Voltar à trilha" traz o bando, a opção aparece como
    `[Persuasão CD 15 · Brenn +1 · 35%]`, o sucesso abre caminho e os quatro heróis saem com 125 XP a mais
    cada (425, de 300), com `targor: 'acordo'` gravado.

17. **O baú do urso subiu para a borda alta.** Ele era uma `arca` no chão, com o Examinar de uma arca comum
    — e isso entregava de graça o que o livro cobra com Percepção CD 15: *"tudo que restou do segundo andar
    da torre é uma BORDA QUEBRADA, sobre a qual fica um velho baú de madeira. O baú é difícil de ser visto
    do chão"*. O Examinar passou a aceitar texto **por sala** (`sup@sala`), e na torre do urso a peça
    descreve o silo de nove metros e a língua de laje presa numa viga, sem dizer o que há em cima dela.

18. **Os nomes de sala "A CONFERIR" acabaram.** Eram nove; cada um foi conferido contra o livro ao longo
    destas quatro levas — a torre sul pelos três goblins e 150 XP, a ruína pelo ladrilho `Canvas.webp` da
    lona, a guarda pelo `Barracks.webp` 4x6, a despensa pelo equipamento do Sildar, os dois postos pelos
    bolsos de entulho ao lado da área 2, o corredor pela passagem do portão traseiro, o terraço pelo pátio
    da área 1, e a passagem por não ter número nenhum no livro. O gerador agora imprime **0 A CONFERIR**.

## O que FICA aberto

Nada do parecer. A única coisa medida que **não dá** para ter nesta planta é o campo de tiro da área 3 para
o terraço — das 43 seteiras do mapa da FA, nenhuma tem um lado no terraço —, e isso está travado num teste
em vez de esquecido.

## Estado da bateria

`testes-cenas` **67/67** (sete provas novas do Castelo), `testes-regras` **508/508** (a do conhaque),
vitest 400/400, `conferir-paredes` 0 achados, `conferir-cena` 0 achados, o gerador com **0 A CONFERIR**, e
as 24 suítes restantes verdes.

Conferido no jogo rodando, sem erro de console: a lona oferece "Procurar uma entrada" só por fora, a porta
do urso oferece as três opções (carne, tranca, arrombar), o portão traseiro e a porta do rei oferecem o
Escutar, a despensa oferece "Revirar a despensa", a folha de portão está em (5,11), a cortina deixa passar e
não deixa ver, e a passagem está em penumbra enquanto a capela segue no breu.
