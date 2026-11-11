# A vila, o Poço, o Cume e a Agatha — pente fino contra o livro

6 de novembro de 2026. As quatro cenas de Phandelver que ainda não tinham passado pelo revisor de fidelidade.
Dois pareceres, reproduzidos achado por achado no motor. Com estas, **as nove cenas da aventura estão
combadas** — faltava só a Casa da Morte, que está parada por decisão do dono.

Provas depois das mudanças: `testes-cenas` 68/68, `testes-regras` 509/509, `testes-mansao` 24/24, `sala`
141/141, `save` 45/45, `vitest` 400/400, `conferir-paredes` e `conferir-cena` em 0 achados,
`conferir-colagem --min 10` em 0 trechos, `testes-conferir-cena` 5/5.

## O achado mais caro foi contra mim

O revisor da vila apontou que **a Linene paga pela carga da Escudo Leão, não pela carroça do Gundren** — e
quem tinha amarrado as duas coisas fui eu, hoje de manhã, "consertando" um achado do revisor do Esconderijo.

Medido: a carga da Escudo Leão são os sacos e caixas com o leão azul da **área 8**, debaixo dos quais está o
baú do Klarg — e `podeEncerrar` exige `estado.bauAchado`. Quem termina o capítulo 2 **esteve lá e viu**. O
livro paga as 50 po por trazer a carga **ou por dizer onde ela está**, e as duas valem para quem viu. A
carroça não entra nessa conta.

Desfeito: `suprimentosDaCompanhia` volta a ser `true`, e a carroça decide só o TEXTO do fim de capítulo — com
ela, os sacos vão junto; sem ela, ficam onde estão e o grupo vai contar à dona onde foram parar. A lição é a
mesma da sessão inteira, agora do outro lado: **um conserto sem medida é um defeito novo**.

## ALTA: o ogro dormia em cima do baú

`mapa-cume-fa.py` ancorava o **Gog** em (4,10). Ogro é criatura **Grande**, e Grande ocupa **2x2**: a pegada
dele cobria também **(5,11)**, que é o caixote do bando — superfície `bau`, que barra o passo.

| casa da pegada | estava |
|---|---|
| (4,10) | caverna, livre |
| (5,10) | caverna, livre |
| (4,11) | caverna, livre |
| **(5,11)** | **`bau`, barra o passo** |

Nem a prova do gerador nem a conta de inimigo do `conferir-cena` viam, **porque as duas olhavam só a âncora**.

Três consertos, não um:
1. O Gog dorme agora em **(3,11)**, o canto sudoeste — encostado no caixote em vez de em cima dele.
2. O gerador do Cume passou a provar a **pegada inteira** de todo posto. Testado com dentes: devolvendo o Gog
   a (4,10), ele se recusa a escrever com *"gog e 2x2 e a pegada dele pega (5,11), que barra o passo"*.
3. `conferir-cena.mjs` passou a conferir a pegada de toda criatura de `buildFoes` (`footprintOf`: Grande 2x2,
   Enorme 3x3, Imenso 4x4), e a acusar sobreposição casa a casa. **Varridas as vinte cenas: 0 achados** — o
   Gog era o único. `testes-conferir-cena.mjs` ganhou o caso e foi a 5/5.

## Poço da Coruja Velha — cinco consertos pequenos, todos reais

- **O Kost recuava para a planta antiga.** `recolher()` o punha em (9,11), coordenada da planta de 26x22,
  aposentada quando o Poço virou o battlemap da FA (18x22). A constante `DIANTE_DA_TENDA` (6,11) já existia e
  era usada em dois outros lugares. Ele recuava para o meio do pátio em vez da porta da tenda.
- **O saque prometia electro.** O texto dizia "20 de electro, 20 de ouro" e o inventário recebia 30 de ouro —
  o jogo não tem peça de electro, e o cabeçalho do arquivo já dizia isso. Agora o texto conta a troca.
- **A caixa do cheiro de morte saía do mapa** (`x1: 21` num mapa de 18 colunas). Resto da planta antiga.
- **O cabeçalho prometia o que o código não faz:** "dois a cada três rodadas" (o código usa quatro) e "com o
  grupo abaixo do nível 3, a torre tem oito" (`ZUMBIS = 6`, sem ramo de nível). Os dois corrigidos.
- **"O dono está aí dentro"** aparecia com o Kost em pé do lado de fora — ele sai da tenda assim que o grupo
  chega. Virou "o dono está de olho".

O resto do Poço bate: os gatilhos, a conversa que segura os zumbis (inclusive no meio da luta), Arcanismo 10
na tatuagem, História 10 no manto, os dois pedidos dele, o tesouro item a item, os 800 e os 200 XP.

## Cume da Wyvern — duas decisões, agora com o número ao lado

- **O vigia de costas para o campo.** No livro ele monta guarda; o revisor quer virá-lo. Medido: a encosta da
  FA tem 18x24 e quase nenhum anteparo — **o vigia é visto de 311 das 347 casas livres**, e o grupo já chega a
  85 pés dele com linha de visão. Virado para fora, ele nota quem vem de qualquer lugar e a cena perde a
  aproximação furtiva que o próprio capítulo oferece. Fica de costas, com a medida escrita ao lado.
- **O XP: 1.600 onde o livro dá 1.250.** Aqui o revisor tem razão e eu **não decidi** — a função se chama
  `darXpDoLivro` e em todas as outras cenas o número é o do livro. O argumento do 1.600 (a soma dos nossos
  blocos) está escrito e é defensável, mas é nosso, e nada no código dizia que era desvio. Agora diz, em voz
  alta, e fica **por decidir**: ou se volta aos 1.250, ou se assume a exceção e ela vale para as outras cenas.

## Vila de Phandalin — nenhum achado ALTO

As dez locações do livro existem, cada dona no lugar certo, nenhuma fundida nem cortada; as missões todas
estão, e os pagamentos do livro batem um a um (10 po por herói, 50, 100, 100, três poções, 500, 200). O XP
também: 400 na praça, 100, 200, 400, 200.

Consertado: **as 500 po do Sildar seguiam só a morte do Grol**, e o livro paga por *derrotar ou afugentar*.
Conferido que hoje dá no mesmo — nada no Castelo põe `grol.fugiu` —, mas a bandeira passou a ser a do livro e
não a de um caminho só.

## O que ficou anotado — e foi feito depois

Tudo o que a primeira passada deixou de fora foi corrigido na segunda. Por ordem de quanto muda a mesa:

- **`npcs.js` contradizia o livro em três NPCs**, e isso é pior que inventar: `quer` e `esconde` são nossos de
  propósito, mas inventar o que um NPC **sabe** muda a aventura por baixo do pano. A **Linene** "comprava de
  volta mercadoria roubada", o que a punha em contato com os ladrões — no livro ela não sabe quem a assalta, e
  é por isso que pergunta ao grupo; o que ela esconde agora é a conta, que saiu do bolso dela. A **Garaele**
  "já tentou duas vezes, ferida das duas"; no livro foi **uma**, e a banshee nem apareceu — o que é pior para
  ela, porque não há ferida que explique o fracasso. O **Harbin** era bloco `nobre` e "mestre da vila": virou
  **plebeu** e **chefe da vila**, que é o cargo do livro e a regra dele para quem não luta.
- **A Agatha ganhou o que o livro descreve e o jogo não mostrava:** a cabana **mobiliada** — mesa posta para
  ninguém, dois baús, louça em ordem, um sofá virado para uma lareira apagada há um século —, o **vento
  espectral** que mexe no cabelo e no manto dela sem mexer em mais nada, e o rosto, que o livro insiste em
  chamar de hediondo. E uma saída de **ameaça** separada da grosseria: as duas dão no mesmo (ela some para
  sempre), mas são gestos diferentes e o jogador merece escolher qual fez.
- **O XP do Cume voltou aos 1.250 do livro.** Estava em 1.600, a soma dos nossos blocos, com um argumento bom
  — e foi desfeito mesmo assim: a função se chama `darXpDoLivro` e as outras oito cenas pagam o número do
  livro. Exceção numa cena só não é equilíbrio, é inconsistência, e quem subisse de nível meia sessão mais
  cedo no Cume ia sentir falta no Castelo.
- **Os barris do Gigante Adormecido.** O texto da provocação sempre disse "um sentado num barril, os outros
  encostados nas colunas", e a briga acontecia em campo liso: quatro bandidos e quatro heróis sem um anteparo.
  Entraram como **terreno** (`u`, que barra o passo e dá meia cobertura) em (14,5) e (15,5), estendendo até a
  esquina o pátio de barris que a pintura já tem em x16. **Remedido em 300 lutas**: 96% de vitória, 3% de
  morte de herói, 73% de vida de pé — contra os 95,5%, 3,8% e 75% de antes. A cobertura entrou sem mexer no
  equilíbrio.
- **O cheiro de fumaça** na chegada ao Cume, que o livro põe antes de a caverna aparecer.
- **Um preço só para o quarto da estalagem.** A cena do Toblen cobrava metade a quem limpou a rua e nada a
  quem a vila deve favor; o botão "Dormir" do mapa cobrava sempre as 5 pp cheias. Dois preços para o mesmo
  quarto, conforme a porta por onde se entrava.
- **O motivo do XP do Cajavidro** passou a somar com o que já estava pendente, em vez de apagá-lo.
- **O cabeçalho de `phandalin.js` passou a listar os pagamentos que são NOSSOS** — as 25 po do Gundren, as 50
  po pela carta, a poção do Daran, os 150/75 po da Halia e do Harbin, as 15 po do Barthen, o quarto a meio
  preço. Nenhum é erro de número; somados inflacionam o capítulo em algumas centenas de ouro, e agora quem for
  medir a progressão sabe quais não são do livro.

### Dois achados que a medida derrubou

- **"O Poço e o Cume não têm peça nenhuma."** As duas cenas rodam **sobre o battlemap pintado da FA**, e o
  desenho já mostra a tenda, a fogueira, a palha e o caixote. Peça por cima seria desenhar cada coisa duas
  vezes — é a mesma razão que já estava escrita no mapa da rua (`objetos: []`). O que precisa valer como regra
  entra como **glifo de terreno**, e entra: o Cume tem palha, fogueira e caixote assim. Ficou registrado nos
  dois geradores, para o próximo revisor não reabrir. (O Poço também não tem luz de mapa, e está certo: é
  cena ao ar livre, de dia.)
- **"Falta a pedra atrás da qual o vigia se encolhe."** Medido: há rocha em (11,3), logo ao norte dele, e em
  (10,5) e (10,6), ao sul. O vigia está numa fresta entre duas pedras — a cobertura existe, é do mapa.

## A conta dos dois pareceres

Vinte e seis observações. **Dezesseis viraram conserto** — sete defeitos na primeira passada (um deles meu,
de hoje de manhã) e nove na segunda, entre correções de conteúdo, de texto e de equilíbrio —, duas eram
decisão que só precisava do número ao lado, e oito eram falsas: já estavam no código, ou pediam o que o
desenho já faz. O padrão da sessão inteira se manteve — com uma diferença importante: desta
vez o revisor pegou uma coisa que eu tinha quebrado, e pegou porque leu o livro em vez de ler o meu comentário.
