# O pente fino nos mapas que faltavam — 2026-11-06

Depois de o Castelo e a Árvore Trovão passarem pelo revisor de fidelidade, levei o **mesmo método** às três
cenas de Phandelver que ainda não tinham passado: Esconderijo, Mansão e Onda Eco. Este arquivo é o resultado,
e a conclusão curta é **nenhuma das três tem o defeito da Árvore Trovão**.

## O método, e por que ele ficou barato

Os mapas oficiais do livro estão **dentro do PDF**, um por página, como imagem JPEG — e eu só descobri isso
procurando o de Árvore Trovão. Varrendo as 64 páginas e contando os círculos vermelhos de cada imagem
(`r - (g+b)/2 > 45`, manchas de 45 px ou mais), saem os mapas numerados:

| página do PDF | mapa | áreas |
|---|---|---|
| 8 | **Cragmaw Hideout** | 8 |
| 20 | **Redbrand Hideout** | 12 |
| 30 | **Ruins of Thundertree** | 13 |
| 38 | **Cragmaw Castle** | 14 |
| 42 | **Wave Echo Cave** | 20 |

O detector erra para mais nas ILUSTRAÇÕES (tinta vermelha em pintura), então o que separa mapa de pintura é
olhar — mas são cinco imagens, não sessenta e quatro.

A conferência é a mesma dos dois pareceres anteriores: pôr o mapa do livro e o battlemap da Forgotten
Adventures lado a lado, com as nossas salas marcadas por cima do segundo, e ver se a topologia bate.

## Esconderijo (Cragmaw Hideout) — JÁ ESTAVA FEITO

`revisoes/esconderijo-de-para-2026-11-04.md` já faz isto, e melhor do que eu faria agora: **cinco das oito
áreas estão ancoradas nos ladrilhos nomeados da própria cena do Foundry** (`Light00` na fogueira do covil,
`Light01` na de Klarg, `ChestOpen` no baú dele, `Bridge` na ponte, `FirstBreak`/`SecondBreak` nas duas
barragens, `Collapse` no ressalto frágil). As outras três saem do desenho, e a fronteira de cada área saiu por
distância de caminhada, cobrindo as 330 casas de chão. Nada a fazer.

## Mansão (Redbrand Hideout) — O DE-PARA BATE

Comparado o mapa da página 20 com a nossa planta de 30 x 20: **é a mesma planta, e os nossos nomes
correspondem**. A fenda central do livro (área 8) é a mesma fenda no nosso mapa; a oficina do mago (11) está
no nosso canto noroeste, as jaulas (5) à direita, a entrada (1) na ponta leste, o porão da cisterna (2) no
centro-sul.

Isso era o esperado e agora está conferido: a nossa planta é decalque do mapa oficial do Roll20, e a da FA
saiu do mesmo mapa do livro — o CLAUDE.md já registrava que as duas batem 1 para 1, medido com
`prova-fundo.py` e pelo brilho. O que faltava era conferir os NOMES contra os números, e eles batem.

## Onda Eco (Wave Echo Cave) — AS VINTE ÁREAS ESTÃO LÁ, E NO LUGAR CERTO

> **Correção.** A primeira versão desta seção dizia "só 13 das 20 áreas existem" e que 79% do chão não
> pertencia a área nenhuma. **Estava errado, e o erro foi meu: eu medi o campo errado.** `MAPA_ONDA_ECO.salas`
> tem as TREZE construções de pedra lavrada (templo, alojamentos, forja, guarita...), e é só isso que ele tem
> de ser; as áreas do livro estão em `ONDA_ECO.areas`, e **as vinte estão declaradas**, cada uma com o
> retângulo e o nome do livro no comentário, em `src/dev/mapa-ondaeco.py AREAS_RET`. Medido de novo no campo
> certo: **2.580 das 2.979 casas de chão (87%) estão dentro de uma das vinte áreas**, e o resto são os
> corredores entre elas.

O de-para também está certo, e agora **medido** e não só olhado. Achando os vinte círculos vermelhos do mapa
da página 42 por cor e FORMA (matiz vermelho, saturação acima de 118, mancha de 8 px ou mais, caixa entre 7 e
22 px de lado) saem dezenove deles, e projetados na nossa grade de 73 x 90:

- **dezoito dos dezenove caem DENTRO da área que deveriam**, cada um numa área diferente;
- sacudindo o quadro do mapa em ±12 px nas quatro bordas — 81 quadros —, dezesseis não mudam de área;
- a única área que nenhum círculo aponta é a **11 (Alojamento Norte)**, que é justamente o círculo que o
  detector perdeu.

Cada sala de pedra lavrada cai dentro da área do livro correspondente:

| nossa sala | área do livro | onde |
|---|---|---|
| `templo` + `sacerdote` | 19 Templo de Dumathoin + 20 Aposentos do Sacerdote | noroeste, nas duas plantas |
| `alojNorte` | 11 Alojamento Norte | centro-oeste |
| `fundicao` | 12 Caverna de Fundição | centro |
| `forja` + `forjaOficina` | 15 Forja das Magias | leste |
| `magoA/B/C` | 14 Aposentos dos Magos | leste, abaixo da forja |
| `alojSul` | 6 Alojamento Sul | centro-sul |
| `deposito` | 7 Depósito Desmoronado | a leste do alojamento sul |
| `guarita` | 4 Velha Guarita | sul |
| `avaliadores` | 5 Escritório dos Avaliadores | sul, a leste da guarita |

A escala também bate: o mapa do livro é 1 quadrado = 10 pés, e os ~37 x 45 quadrados dele dão 74 x 90 casas
de 5 pés — a nossa planta tem 73 x 90.

E as dez cavernas — Entrada (1), Túneis da Mina (2), Velha Entrada (3), Caverna dos Fungos (8), Grande
Caverna (9), Lago Escuro (10), Caverna Estrelada (13), Caverna Barulhenta (16), Velho Córrego (17) e Caverna
Desmoronada (18) — também estão, com 191, 385, 151, 201, 373, 138, 270, 52, 63 e 199 casas. Quem as declarou
deixou o nome do livro no comentário de cada retângulo.

**O que de fato falta na Onda Eco é roteiro, não planta.** `capitulo5-ondaeco.js` tem 1.001 linhas e cita
`'templo'` sete vezes e quase nenhum outro nome — a cena implementa o templo e pouco mais. Mas o mapa onde
esse roteiro vai se apoiar está pronto e conferido.

**Prova permanente:** `testes-ondaeco.mjs` ganhou um teste que exige as vinte áreas, que elas não se
sobreponham (nenhuma casa com dois donos), que menos de 20% do chão fique fora de todas, e que cada uma das
treze salas de pedra esteja inteira dentro de uma área. A projeção dos círculos em si não vira teste porque
depende da imagem do livro, que não entra no repositório.

## Poço da Coruja Velha e Cume da Wyvern

Os dois foram refeitos sobre o battlemap da FA com gerador próprio (`mapa-poco-fa.py`, `mapa-cume-fa.py`), e
os dois **se recusam a escrever** se algum ponto do capítulo cair em parede ou ficar inalcançável. O livro não
numera áreas em nenhum dos dois — são um poço com torre e uma caverna —, então não há de-para a conferir.

## Conclusão

Das seis cenas de Phandelver com planta, **duas tinham o de-para errado e as duas foram consertadas** (o
Castelo e a Árvore Trovão, nos pareceres do mesmo dia). As outras quatro estão certas, e agora as quatro
estão CONFERIDAS: o Esconderijo pelos ladrilhos do Foundry, a Mansão e a Onda Eco contra os mapas oficiais
do livro, e o Poço e o Cume pelas provas dos geradores deles.

E fica uma lição de método, que me custou um relatório errado: **medir o campo certo**. Eu contei cobertura
em `salas` e concluí que faltavam sete áreas na Onda Eco. `salas` são as treze construções de pedra lavrada;
as vinte áreas do livro estão em `areas`, e estavam todas lá. Um número medido no campo errado é pior que
nenhum número, porque parece conclusão.
