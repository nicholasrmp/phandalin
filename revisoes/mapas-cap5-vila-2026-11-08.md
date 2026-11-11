# Revisão dos mapas novos do capítulo 5 (e da cabana da Agatha) — 2026-11-08

Pedido do dono: antes de seguir, revisar os mapas que entraram — paredes, luz dinâmica, objetos interativos, portas,
inimigos, NPCs, terreno difícil. Medido, não olhado: os quatro conferidores do projeto (agora com as quatro cenas
novas na lista: `conferir-paredes`, `conferir-cena`, `inventario-cenas`, `conferir-luzes-fa`), a prova visual da
regra por cima da arte (`prova-fundo.py`), a máscara de copa pela diferença entre duas artes, e as cenas abertas no
navegador.

## O que estava certo

- **Paredes**: na caverna do poço, a rocha da regra cobre a pedra pintada e as paredes seguem a borda (prova
  visual); no acampamento, troncos e tendas barram. Zero achados nos dois conferidores, nas quatro cenas.
- **Portas**: nenhuma das três cenas tem porta que importe. As do Foundry no telhado são do térreo (ver abaixo).
- **Inimigos**: todo ponto de criatura cai em chão livre e alcançável (as provas do gerador no motor), inclusive a
  pegada 2x2 do otyugh. No navegador, cada luta abre com o elenco do livro onde o desenho o põe.
- **NPCs**: estas cenas não têm NPC no tabuleiro (os da vila ficam nas cenas de conversa).

## O que faltava, e entrou (`src/dev/mapa-cap5-vila-fa.py`, `game/obelisco5-lutas.js`)

| Mapa | Achado | Correção |
|---|---|---|
| Caverna | as pedras grandes do leito (11,11), (11,15), (11,16) e (2,10) eram chão: andava-se através delas | pedra (`r`): barra o passo e dá cobertura |
| Caverna | o entulho da represa dos goblins era chão liso | terreno difícil (`x`) em (4..6, 2) |
| Caverna | a luz do poço vinha como TOCHA (dava para "apagar" a luz do dia) | luz fixa (`luar`), com a cor da FA |
| Caverna | o túnel desmoronado do livro não existia | no fim da luta, cavar (1 h, −10 min por ajudante): marca a entrada alternativa para Zorzula (`feito.tunelDoPoco`) |
| Acampamento | **sem luz nenhuma**: as duas fogueiras da FA ficaram de fora | fogo (`F`) e luz de fogueira (15/15 pés) em (5,10) e (8,15) |
| Acampamento | a mata fechada da borda era capim | terreno difícil (`~`) onde a COPA está: a casa em que mais da metade dos pixels muda entre a arte do dia e a sem copas (77 casas, todas na borda) |
| Acampamento | as copas não cobriam quem passa por baixo | `frente` pela cor, a mesma do ermo e da emboscada |
| Telhado | os três prédios em volta (galpão, casa do sudeste, casa do sul) eram chão | casa (`H`), pelo contorno do telhado no desenho |
| Telhado | carroça, caixotes, barris e fardos de feno eram chão | cobertura (`C`, `o`) |
| Telhado | **sem luz nenhuma**, e a luta não escurecia à noite | as duas lanternas de FORA da FA (as outras três são de dentro dos prédios) acendem no escuro (`soNoEscuro`); a cena escurece a 0,8 se a vila estiver à noite, como a briga de rua |
| Acampamento | idem | escurece à noite também |

## O que fica, de propósito

- **Telhado**: a cena do Foundry deste mapa é do TÉRREO (paredes de dentro dos prédios). A luta é EM CIMA, então a
  regra é feita aqui: o telhado da taverna a 6 m (quatro níveis), a rua embaixo. Ninguém desce do telhado durante a
  luta — o livro não dá escada, e quem foge (os goblins) sai do mapa.
- **Objetos interativos marcados no mapa**: nenhum, nas três (na primeira revisão). Ver "O cenário vivo", abaixo:
  entraram depois, a pedido do dono. Os "interruptores" da cena do Foundry são os botões de ligar a fogueira pintada,
  que aqui já nasce acesa.
- **Paredes redundantes na caverna** (84 entre duas casas de rocha): o aviso fraco do `conferir-paredes` sumiu depois
  da regeração; nunca afetaram o jogo.
- **A cabana da Agatha** (`covilAgatha`): planta nossa, sem arte da FA (não há battlemap dela) e sem luz — a banshee
  é a única luz que o livro descreve ali. Zero achados nos conferidores.

## Provas

`src/dev/testes-obelisco5.mjs` ganhou "os mapas das lutas": as pedras que barram e cobrem, as fogueiras e a luz, a
mata só na borda (e mais de 60 casas dela), a copa por cima, os prédios que barram, a carroça e as lanternas que só
acendem no escuro.

## Depois da revisão: o TÉRREO do Gigante Adormecido virou tabuleiro

Pedido do dono, ao ver que o telhado era a única parte jogável: o salão onde o crime aconteceu agora se anda
(`game/obelisco5-terreo.js`, mapa `giganteTerreo` em `game/obelisco5-mapas.js`). É a cena do Foundry do "Rooftop
Stash" (que é o térreo) com três consertos, medidos:

- **o balcão**: no Foundry é uma "parede" que barra o passo e deixa ver, e o importador fechou o fundo do bar e a
  cozinha como rocha. Os goblins o quebraram (o livro): ele sai da regra e vira entulho, terreno difícil;
- **a cozinha**: a cena da FA a fecha nos quatro lados, e o livro manda revistá-la. Abriu-se a passagem do fundo do
  bar para ela (o trecho de y 10 a 11 da parede oeste, na grade E no traço, para a visão concordar com o passo);
- **as portas**: as quatro (a da frente da taverna e as dos outros três prédios) vieram sem folha e não abriam
  (`conferir-cena.mjs` pegou); o gerador as tira da grade.

A FA dá o salão REVIRADO como peça (`Ransacked`), e ela nasce acesa; os telhados dos outros prédios ficam por cima.
No tabuleiro: o balcão (o risco "Zorz isteve aki", a pista do nome), a cozinha (Percepção CD 15, a trilha de moedas), a
lareira (sobe pela chaminé ao tabuleiro do telhado), e a Greska e o Wheel-of-Fortune no salão, com o "Conversar" de
sempre. A dona é a GRESKA, uma orc: o capítulo 5 do livro a chama de Grista, uma anã, mas o capítulo 2 do mesmo livro
já a tinha feito orc, e o jogo mantém a mesma pessoa. Jogado no navegador: a entrada pela vila, o salão com a arte da
FA, e a chaminé até a luta do telhado.

## O cenário vivo: o que a arte desenha se olha (2026-11-08)

Pedido do dono: "nem todo item interativo precisa ter tesouro ou recompensa" — pode dizer o que a coisa é, contar algo
útil ou inútil, ou ser engraçado, para o lugar parecer habitado. Entraram 23 objetos (`mapa.interativos`, no gerador
`mapa-cap5-vila-fa.py`), cada um numa casa onde a arte DESENHA a coisa (conferido com o recorte de cada mapa marcado
por cima: um alçapão que a arte não tinha saiu, e os barris desceram uma casa):

| Mapa | Objetos | Com teste |
|---|---|---|
| Caverna do poço | o lixo do otyugh (a colher da Stonehill), a represa, o fundo do poço (o Ander gritando lá de cima), os destroços do sarilho, a pedra com o sapo | lixo (Investigação 12: o lixo novo de quem desceu), represa (Investigação 10: marcas de picareta, fechada de propósito), fundo do poço (Sobrevivência 10: as pegadas para a represa) |
| Acampamento | as três tendas, a panela, os sacos de dormir, a pilha de saque (cata-vento, cabeça de espantalho), o abrigo de lona do Barthen, a trilha | a tenda do chefe (Investigação 12: o desenho do goblin de cristal e o nome escrito errado), a panela (a bota cozida), a trilha (Sobrevivência 12: os sãos foram para leste com a lasca) |
| Telhado | a chaminé, os fardos com o gato, a carroça de pregos | — (os dois de longe têm alcance de 30 e 40 pés: olha-se de cima) |
| Térreo | a mesa de jantar (o queijo mordido), as garrafas intactas, o fogão, os barris (batatas), o alaúde sem dono, a mesa das cartas, o cesto de maçãs | as garrafas (Investigação 10: vieram buscar uma coisa só) |

Nenhum dá ouro ou item: o tesouro do livro continua onde estava (as moedas da cozinha, o saco do telhado). O que o
teste dá é informação a mais.

**Duas mudanças de motor que isso pediu**:
- o objeto com teste (`pista`) escondia o texto de graça: o menu só mostrava o verbo. Agora `olhar: true` mostra os
  dois — o que a coisa é, de graça, e o teste a mais (`game/interacoes.js`);
- **as três lutas voltavam à vila na hora da vitória**, então não havia tempo de olhar nada. Agora o mapa vira
  exploração depois da luta (`obelisco5-lutas.js prepararExploracao`), com uma saída: a corda do poço, a trilha do
  acampamento, a chaminé do telhado (que desce ao térreo). O túnel desmoronado se cava NA represa, explorando, e não
  mais num painel do fim da luta.

E o saco do telhado volta à GRESKA, não à Grista: o painel ainda usava o nome do capítulo 5 do livro.

Provas: `testes-obelisco5.mjs` "o cenário vivo" (mínimo de objetos por mapa, ids e casas sem repetir, texto de verdade,
verbo que o menu conhece, uma casa livre ao alcance de cada um; e, jogando a caverna até o fim, o menu do lixo com o
texto e o teste, a escavação na represa e a corda de volta) e as provas das saídas no acampamento e no telhado. No
navegador: a caverna vencida em exploração, os anéis dourados nos objetos e o painel do lixo.

### A segunda leva: tudo o que a arte desenha (2026-11-08)

O dono mostrou três recortes do térreo — a mesa das cartas, o alaúde e a mesa redonda do cartaz — e apontou que havia
muito mais desenhado. Lido cada mapa a 100 px por casa com a grade por cima (e, depois, cada objeto marcado de volta
sobre a arte para conferir a casa), os quatro mapas passaram de 23 para **67 objetos**: caverna 10, acampamento 14,
telhado 8, térreo 35.

- **Caverna**: o barril e a corda do poço, as raízes no teto (Lembrar CD 10: o carvalho que abriu a caverna), o riacho,
  os papéis desbotados (uma conta da Stonehill que alguém jogou no poço em vez de pagar), o monte de lixo velho. E dois
  textos corrigidos: a arte mostra a água CORRENDO pela caverna, então a represa a estrangula em fios em vez de secá-la.
- **Acampamento**: a outra fogueira, o boneco de gravetos do chefe, o saco do vigia (Ler os rastros CD 10: ele olhava
  para leste, não para a trilha), a lenha quebrada com a mão, o carvalho com tiras de pano roubadas, a cortina vermelha.
- **Telhado**: o que se vê de cima, com alcance de 10 a 40 pés — os barris com o cutelo, os caixotes da porta, o carrinho
  de mão, o toco com o machado, os caixotes atrás da casa do sul.
- **Térreo**: a mesa do cartaz do Harbin (o goblin parece um nabo com dentes), os papéis de Neverwinter que embrulham
  peixe, a lenha da varanda, a farinha com pegadas (Ler os rastros CD 10), a prateleira de SAL, o barril-mesa com a lista
  de compras, os barris vazios, o bilhete da dívida na garrafa, a tina; no galpão o feno com o gato, o cocho, o barril de
  água, as ferramentas, o carvão roído, a roda, o carrinho, a carroça de PREGOS; na casa do sudeste a cama, a bancada do
  carpinteiro (Investigação CD 10: a medida da chaminé — um goblin passa folgado, um de vocês passa raspando), as
  garrafas e o toco; na casa do sul o baú com o vestido, a cama, o tapete, o caldeirão, a prateleira com o livro de
  receitas, os caixotes e a lenha.

Ficaram de fora, de propósito: o que fica no balcão (é a cena "Examinar o balcão"), a lanterna da parede (já tem o
"Apagar" da luz) e uma mesinha da casa do sul que cai na mesma casa da cama.

**Os telhados dos vizinhos agora somem quando alguém entra** (`obelisco5-terreo.js atualizarTelhados`). O galpão e as
duas casas nasciam cobertos pela arte do telhado, e tudo o que havia dentro ficava escondido. As casas debaixo de cada
telhado saem do ALFA da própria arte (`PONTOS.GIGANTE_TERREO.telhados`: 8, 14 e 18 casas), e o telhado de um prédio só
se apaga com um herói dentro dele — como o telhado do Foundry. Com as quatro portas abertas, os 35 objetos do térreo se
alcançam a pé.

Provas: o mínimo de objetos por mapa subiu para os números de agora, e o teste do térreo prova os três telhados (o
objeto de dentro está debaixo dele, nasce coberto, some com a Dara dentro, volta quando ela sai). No navegador: a Dara
na casa do sul, o telhado dela apagado e os anéis do baú, da cama, do tapete e do caldeirão à vista, com a casa do
sudeste ainda coberta.
