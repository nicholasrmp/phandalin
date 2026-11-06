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
5. **Os 13 prédios "A CONFERIR"** continuam sem nome medido. A cena da FA tem 0 notas e 0 desenhos; o revisor
   também não achou a planta do livro no repositório. Resolver isso é cruzar com o mapa do livro, à mão.

## Estado da bateria

30 suítes verdes, `cena-node/tesouros` com 12 confirmações, vitest 400/400, `conferir-paredes` 0 achados, e
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
