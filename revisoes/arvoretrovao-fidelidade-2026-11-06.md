# Árvore Trovão contra o livro — 2026-11-06

Parecer do `fidelidade-aventura` sobre a cena reconstruída no battlemap da Forgotten Adventures, mais o que
eu reproduzi, o que consertei e o que fica. Regra do projeto: o revisor devolve parecer, quem conserta é quem
chamou, e cada achado só vale depois de reproduzido.

## O que eu reproduzi e confirmei

| Achado | Medida |
|---|---|
| Reidoth e a caixa da Mirna na MESMA casa | os dois em (18,4) |
| Reidoth a 20 casas da mobília do acampamento dele | acampamento em (19-21, 24-25), ele em `ervas` |
| O dragão fora do covil | a fumaça verde da FA está em (31,7); `celulas.torre` são 16 casas em (27-30, 3-6) |
| O gerador não era reprodutível | duas rodadas davam MD5 diferentes e a estátua mudava de casa |

O último não estava no parecer: apareceu porque o revisor rodou o gerador por engano e o arquivo mudou.

## O que eu consertei

- **O gerador virou reprodutível.** `vivas` é um conjunto de strings, e a ordem de um conjunto muda a cada
  processo (o Python embaralha o hash). Duas escolhas por `min` sobre ele — a casa da estátua e a casa mais
  perto para onde uma luz anda — saíam diferentes. Ordenado antes do `min`. Provado: três rodadas, mesmo MD5.
- **Reidoth saiu de cima da caixa da Mirna.** `meio()` ganhou `exceto`, e o ponto dele exclui as casas dos
  objetos escondidos. Agora (17,5) e (16,5).
- **`inundar` ganhou semente travável** (4º campo), que o terreno da torre vai usar quando for pintado. Hoje
  nenhum prédio a usa.

## O que eu TENTEI e medi que não funciona

Fica escrito para ninguém repetir.

- **Semear a torre na fumaça verde (31,7):** cai numa mancha de 2 casas. O marcador da FA fica AO LADO da
  coisa, como os `.svg` dela — a fumaça está no vão entre o galpão e o anel.
- **Inundar o prédio pela PAREDE em vez da cor:** vaza pela própria porta, pela soleira de pedra. A estalagem
  inchou de 16 para 38 casas e as ervas para 41.
- **Abrir as portas durante a inundação** (para a torre pegar salão e anel de uma vez): mesmo vazamento.
- **Semear no aro do anel (34,4):** `celulas.torre` vira um anel de 17 casas com buraco no meio, e a torre
  deixa de ser cômodo — `testes-cenas.mjs` acusa borda aberta e o dragão 2 x 2 não alcança a porta. (O que
  serve é semear DENTRO do anel, em (34,5), e inundar pela parede: ver o item 1 acima.)
- **Acrescentar o que o prédio CERCA** (tapar buracos): custava 2 casas à torre que quebravam a conferência
  de borda fechada, mais 1 ao celeiro, 1 à casa9 e 3 à casa7, sem ganho.

## O que fica, e por quê

1. ~~A TORRE DO DRAGÃO ESTÁ NO GALPÃO AO LADO.~~ **CONSERTADO no mesmo dia.** O que destravou foi perguntar
   se a torre tem porta: ela tem UMA, entre (30,5) e (31,5), e 25 arestas de parede. Sendo um cômodo
   FECHADO, a parede serve de instrumento onde a cor falhava — inundar de dentro, de (34,5), com a porta
   fechada, devolve as 24 casas do anel sem vazar. `inundar` ganhou um modo "só pela parede" para cômodos
   fechados e medidos. Hoje `celulas.torre` são as 24 casas do anel (31-36, 3-8), o dragão dorme em (34,5),
   `portaDaTorre` é (31,5) e o tesouro foi junto. O teste do dragão passou a permitir espremer na porta, que
   é o que o livro dá (nenhuma porta desta planta é larga).
2. **Reidoth mora em `ervas` e acampa em `florestal`**, a 20 casas. Decisão de conteúdo: ou ele vai para o
   acampamento, ou a mobília vem para perto dele.
3. ~~Gatilhos apontando para a zona errada.~~ **CORRIGIDO.** `ramos5` passou a disparar na própria zona
   (`matoLeste`, 49-56 x 17-24): o gatilho era `casa20`, a 10 casas do ramo mais próximo, de modo que pisar
   num quadrado de rua do nordeste acordava oito galhos invisíveis e entrar no mato onde eles moram não
   acordava ninguém. E `tecelagemSul` deixou de pegar casa alheia: a exceção era só a `embaixada`, escrita à
   mão, e agora vale para qualquer construção — a zona cobria 3 das 12 casas do armazém e 6 das 9 do
   acampamento do Reidoth, e como esta checagem vem antes da das aranhas, entrar no armazém acordava os
   galhos em vez delas. Medido depois: 0 casas de armazém e 0 de acampamento, e os 6 ninhos continuam
   disparando.
4. **Textos que descrevem prédio que o desenho não tem:** ferraria com chaminé e cabana dos ramos intacta.
   ~~Guarnição com parapeito~~ resolvida: a vista do alto deixou de ser mecânica e virou TEXTO (decisão do
   dono do projeto). Era `field.vistaExtra` acendendo a aldeia inteira enquanto o herói ficasse no telhado —
   e a guarnição é casca sem telhado na planta da FA. Agora o alçapão abre a escada de pedra que sobrou, e
   "Subir e olhar de cima" devolve quatro parágrafos com os rumos MEDIDOS a partir de (43,24): a torre a 29 m
   a noroeste, a estátua a 18 m, a casa de esquina a 11 m a sudeste, o celeiro a 12 m a sudoeste, o armazém a
   24 m. O grupo fica sabendo onde as coisas estão e continua sem ver quem está nelas — que é o que a fase
   pede, já que ela se ganha escolhendo o que encarar. ~~A abertura~~ foi reescrita: ela dizia "a única construção inteira" (são SETE
   com telhado), "ao redor dela não cresce nada" (CINCO copas encostam na torre) e "trinta centímetros de
   cinza" (o terreno não tem uma casa de cinza). O que sobrou dos três é decisão de conteúdo: a guarnição é
   casca sem telhado, e o roteiro faz o grupo SUBIR no telhado dela.
5. ~~Os 13 prédios "A CONFERIR" continuam sem nome medido.~~ **MEDIDO em 2026-11-06, e o resultado é grave:
   doze dos treze nomes estão errados, e com eles o conteúdo.** Ver a seção abaixo.

## O DE-PARA DOS TREZE PRÉDIOS, medido contra o mapa do livro

O que destravou foi achar que **o mapa oficial está dentro do PDF do livro** (`_referencias/livro/`, página
30 da numeração do arquivo, uma única imagem JPEG de 802x562). Ele traz os treze números em círculos
vermelhos, e os círculos se acham pela cor: `r - (g+b)/2 > 45` devolve treze manchas, uma por número.

Projetando os treze sobre a nossa grade de 58 x 38 (o quadro jogável do mapa do livro corresponde à imagem
inteira da FA), **cada número cai em cima de um prédio nosso diferente, sem colisão, e a ordem em x e em y
se preserva nos dois**. A planta da Forgotten Adventures é o mapa do livro redesenhado — o mesmo caso da
Mansão.

| nº | o que o livro põe ali | o nosso prédio | o nome que ele tem hoje |
|---|---|---|---|
| 1 | Cabana Ocidental — 2 ramos secos e o baú do comerciante | `casa10` | (área de rua, sem planta) |
| 2 | Cabana com Ramos — 6 ramos secos | `moinho` | moinho |
| 3 | O Cavalo Pardo, a taverna — 4 zumbis das cinzas | `ervas` | **a loja da herborista** |
| 4 | Reduto do Druida — **o Reidoth** | `casa7` | casa7 |
| 5 | Fazenda de Ramos — 8 ramos secos | `fazenda` | fazenda ✓ |
| 6 | Armazém Destruído — as aranhas | `escola` | escola |
| 7 | Torre do Dragão | `torre` | torre ✓ |
| 8 | Velha Ferraria — 2 zumbis | `celeiro` | celeiro |
| 9 | Loja do Herborista — a caixa da Mirna | `guarda` | **a velha guarnição** |
| 10 | Praça da Cidade — a estátua | `casa12` | casa12 |
| 11 | Velha Guarnição — 5 zumbis | `casa15` | casa15 |
| 12 | Cabana do Tecelão — 6 ramos | `loja` | loja |
| 13 | Cultistas de Dragão | `estalagem` | **a estalagem** |

**Só `torre` e `fazenda` estão certos.** Os outros onze nomes foram lidos do desenho, e o conteúdo foi
pendurado neles — então o conteúdo foi junto:

- **O Reidoth mora na taverna.** Ele está em `ervas`, que é a área 3, O Cavalo Pardo; o Reduto do Druida
  (área 4) é a nossa `casa7`, onde hoje moram dois ramos secos. Isto também explica o item 2 desta lista: ele
  "acampa a 20 casas de onde mora" porque mora no prédio errado.
- **A caixa da Mirna está na guarnição.** Ela está em `ervas` junto com o Reidoth; o livro a põe na Loja do
  Herborista, que é a nossa `guarda`.
- **Os três ninhos de zumbi estão trocados entre si**: os 4 do Cavalo Pardo estão na `estalagem` (que é a
  área 13, dos cultistas), os 2 da ferraria estão em `ferraria` (que o livro não numera), e os 5 da guarnição
  estão em `guarda` (que é a loja da herborista).
- **Os ninhos de ramo seco idem**: os 2 da área 1 estão em `casa7` (área 4) e os 6 da área 2 em `celeiro`
  (área 8).
- **A estátua** é escolhida por heurística ("a casa de largo mais perto do meio da aldeia") e caiu em
  (31,20), o meio do mapa; o livro a põe na Praça da Cidade, área 10, no quadrante nordeste.
- **`prefeito` e `casa10` não são área de rua.** A área 1 é `casa10` e a área 2 são as DUAS cabanas vizinhas
  ("estas cabanas estão em ruínas, uma ao lado da outra"), que são `prefeito` e `moinho`. As duas que o
  gerador não conseguiu recortar pela cor são justamente duas das numeradas.

### A prova de que o de-para não depende do quadro lido a olho

O círculo do número é **etiqueta**: fica AO LADO da construção, não em cima dela — a mesma lição dos
marcadores `.svg` da FA que o CLAUDE.md já registra. Medido: ancorar o quadro pelo círculo do 7 para ele cair
no centro da nossa torre **piora tudo**, de 5 acertos diretos para 2, com colisão.

O que vale é o vizinho mais perto, e a prova dele é a estabilidade. Sacudindo as quatro bordas do quadro em
±4 px — 81 quadros — **doze dos treze não mudam de prédio em quadro nenhum**, e a atribuição nunca tem
colisão. O único que oscila é o 10, a Praça da Cidade, entre `casa12` e `casa20`: e ela não é construção, é o
largo da estátua.

## O CONSERTO, no mesmo dia

Os treze prédios foram renomeados pelas áreas do livro, e o conteúdo foi atrás:

| o que mudou | antes | agora |
|---|---|---|
| Reidoth | na taverna (`ervas`) | **(14,28), dentro do Reduto do Druida** |
| o acampamento dele (cama, panela, secador) | em `florestal`, a 20 casas | junto dele, no Reduto |
| a caixa da Mirna | na guarnição | **(43,25), na Loja do Herborista** |
| o baú do comerciante | em `casa7` | **(4,13), na Cabana Ocidental (área 1)** |
| os 5 zumbis da guarnição | em `guarda` (= área 9) | na `guarnicao` (área 11) |
| os 4 do Cavalo Pardo | na `estalagem` (= área 13) | no `cavaloPardo` (área 3) |
| os 2 da ferraria | na `ferraria` (sem número) | na `velhaFerraria` (área 8) |
| os 2 ramos da área 1 | em `casa7` (= área 4) | na `cabanaOcidental` |
| os 6 ramos da área 2 | em `celeiro` (= área 8) | na `cabanaDosRamos` |
| os 8 ramos da área 5 | no mato do NORDESTE, a 30 casas | **no mato a LESTE da fazenda**, (26,30)-(30,38) |
| os 6 ramos da área 12 | num retângulo do centro-oeste | **nos arbustos ao SUL do tecelão**, (43,23)-(48,27) |
| os 6 cultistas e o cofre | em `casa9` | nos `cultistas` (área 13) |
| a barricada do culto | sobre `casa9` | sobre os `cultistas` |
| a estátua | (31,20), "o largo mais perto do meio da aldeia" | **(36,12), o largo mais perto da praça (área 10)** |

**A mobília seguiu o NOME e não a construção.** Mover a lista junto com o prédio deixaria o barril de cerveja
no covil dos cultistas e a bigorna no celeiro. O que manda é o que a peça é: o barril e a cuba foram para a
taverna, a bigorna para a ferraria, o tear para o tecelão, e o **alçapão para a guarnição** — é ele que o
capítulo abre para subir.

**E a vista do alto foi remedida.** Os quatro parágrafos davam rumos a partir de (43,24), que era a antiga
`guarda`; a guarnição de verdade é a construção do canto nordeste, em (47,4). Daí a torre está a **20 m a
oeste** (era "29 m a noroeste"), a praça e a estátua a 13 e 17 m a sudoeste, o tecelão a 25 m ao sul, o
armazém a 34 m, e a fileira da taverna, da ferraria e da fazenda a uns 43 m, toda a sudoeste.

**Um defeito novo que o conserto revelou:** três peças de mobília foram parar em soleira de porta, e
`conferir-paredes` acusou "porta no maciço". A causa é que as listas são as mesmas mas as construções têm
outro formato — e o gerador da Árvore Trovão, ao contrário do do Castelo, não reservava as duas casas de cada
porta. Agora reserva.

### O que fica

- **`cabanaOcidental` e `cabanaDoLado` continuam área de rua**, um quadrado de 3x3 em volta da semente. São a
  área 1 e a outra metade da área 2 — "estas cabanas estão em ruínas, uma ao lado da outra" —, e são
  justamente as duas que a cor não recorta (o piso de dentro é mais verde que o capim de fora). Quem quiser a
  planta delas desenha no editor.
- **Duas construções continuam "A CONFERIR"**, `casaSudeste` e `casaNordeste`: o livro não as numera.

## Estado da bateria

31 suítes verdes, `cena-node/tesouros` com 12 confirmações, `testes-cenas` 67/67, vitest 400/400,
`conferir-paredes` e `conferir-cena` com 0 achados, e
o gerador reprodutível (duas rodadas, mesmo MD5).


## Adendo de 2026-11-06, depois do parecer

- **A torre foi para o lugar certo** (item 1 acima), e com ela o dragão, a arca e o tesouro.
- **As duas aranhas que a FA desenha no capim** viraram objeto, nas casas em que a pintura as põe — (28,9) e
  (32,9) —, com Examinar e um teste de Natureza CD 13 que lê o que as matou (veneno em nuvem, vindo da torre).
- **Varredura do que a cena da FA declara** (ladrilhos com nome, sons posicionais, luzes) contra o que temos:
  onze itens, nove já cobertos. Os dois que faltavam viraram objeto: a **lareira acesa** da cabana
  (`CottageFireplace`, com luz de fogueira e som de lenha queimando em cima dela, e nenhum objeto nosso) e a
  **porta caída** do galpão da torre (`FallenDoor`).
- **`prefeito` e `casa10` continuam área de rua, e agora por TRÊS medidas**, não uma: a cor não separa (o piso
  delas é mais verde que o capim de fora); a parede não fecha (12 arestas e 0 portas cada; inundar por ela
  enche 86% e 97% da caixa, contra 22% na torre); e **a própria FA só declara 8 e 10 paredes ali**, contra 36
  na torre — ela não as fechou de propósito, porque são alicerce na altura do joelho, que se atravessa.
