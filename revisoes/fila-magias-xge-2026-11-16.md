# A fila de magias do Xanathar (2026-11-16)

A fila é `src/dev/magias/xge-pendente.json`, escrita por `src/dev/importar-magias.mjs xge`. Provas em
`src/dev/testes-magias-xge.mjs` (38 no arquivo, 8 novas).

## A medida

| Motivo | Antes | Depois |
|---|---|---|
| o motor ainda não faz o que ela faz | 21 | **3** |
| leva 1 minuto ou mais para conjurar | 0 | 9 |
| só se narraria | 0 | 2 |
| **na fila** | **21** | **14** |

- **As de 1 minuto ou mais** (Cerimônia, Criar Homúnculo, Bosque do Druida, Encontrar Corcel Maior, Chamado Infernal,
  Fortaleza Poderosa, Laço, Templo dos Deuses, Servo Minúsculo) já tinham esse motivo desde a leva do PHB; faltava rodar o
  importador do Xanathar de novo.
- **Moldar Água e Escrita Celeste** só se narrariam: a forma da água e as letras no céu não mudam nada no tabuleiro.
- **Ficam três**, que têm o que fazer e pedem motor que não cabia nesta leva:
  - o **Controlar Ventos**: três modos, com o vento que dá desvantagem e a corrente que muda a queda;
  - o **Aprimorar Perícia**: a especialização numa perícia, que só vale de verdade explorando, e o sistema de magia fora da
    luta ainda não pergunta qual perícia;
  - a **Gaiola de Almas**: a reação quando um humanoide morre, e os seis usos da alma presa.

## As sete que entraram

| Magia | No jogo | O que fica de fora |
|---|---|---|
| Vínculo com Besta (1º) | a fera aliada de Inteligência 3 ou menos ataca com vantagem quem está a 1,5 m de quem conjurou (`vinculoBestial`, `livro-motor.js vantagemNoAtaque`) | o elo telepático |
| Metamorfose em Massa (9º) | o motor da Metamorfose, para até dez de um lado só (a opção): o inimigo vira rã (Sabedoria resiste), o aliado vira a fera mais forte que o nível dele deixa | escolher uma fera por alvo |
| Dispersar (6º) | até cinco a 9 m somem e reaparecem a até 36 m: os inimigos (Sabedoria resiste) na casa livre e à vista mais LONGE do grupo, os aliados na mais longe dos inimigos | escolher a casa de cada um |
| Ossos da Terra (6º) | até seis pilares (o Ctrl+clique das dobras da muralha marca os cinco primeiros, `pontosLivres`; o clique põe o último) viram casa de rocha, que barra passo e vista | erguer quem está em cima e esmagá-lo no teto (o pilar só nasce em chão livre); quebrar o pilar; os dois pilares a mais por círculo |
| Invocar Demônios Menores (3º) | o d6: dois quasits, quatro dretches ou oito manes, o dobro no 6º e o triplo no 8º. Eles são HOSTIS A TODOS (`tornarHostilATodos`): miram qualquer um que não seja demônio, de qualquer lado (`enemiesOf` → `alvosDoHostil`), ninguém os comanda, o grupo pode atacá-los (`main.js`), e não seguram a luta. Somem com a concentração | o círculo de sangue que protege quem conjura |
| Invocar Demônio Maior (4º) | o mais forte que o círculo deixa (barlgura no 4º; vrock, hezrou, glabrezu, yochlol) obedece; no fim de cada turno dele, Carisma contra a CD (`fimDoTurnoDoDemonio`), e passando vira hostil a todos | o nome verdadeiro (a desvantagem no Carisma) e o círculo de sangue |
| Fúria da Natureza (5º) | o quadrado de 18 m, e três coisas nos turnos de quem conjura: as árvores do mapa encostadas na área açoitam os inimigos a 3 m (Destreza ou 4d6 cortante, no começo), as raízes prendem o inimigo da área mais perto (Força, `contido` com a CD de escape, no fim), e a ação bônus Pedra da Fúria (`magias-concedidas.js pedraDaIra`): ataque de magia, 3d8 e Força ou cai | o mato que é terreno difícil só para os inimigos: o motor não tem terreno difícil de um lado só |

## O que esta leva achou no caminho

- **O importador de magias sorteava de novo a nota de som de TODA magia do livro a cada rodada** (`notasDasMagias`): a nota
  menos usada muda quando entram magias novas, e a magia que o jogador já conhecia mudava de altura. Nas três levas de hoje
  isso me fez devolver as notas à mão. Agora a magia que já tinha nota, no mesmo timbre, a mantém, e só a nova (ou a que
  mudou de timbre) ganha uma; reimportar PHB, Tasha, Xanathar e AI sem mudar nada dá zero diferença.
- **Magia de efeito livre (`kind: 'livro'`) toca o timbre de maldição** se ninguém disser outra coisa. As três invocações
  desta leva (os dois demônios e a Fúria) passaram para o de invocação, e as de tabuleiro para o de utilidade, porque três
  notas da maldição passavam do teto de seis magias.
- **A árvore não entra na área da magia**: ela é casa bloqueada, e a área para nela. A conta das árvores da Fúria usa a
  árvore encostada na área, calculada na hora de conjurar.
- **O quadrado mirado (`square`) parte do canto clicado**, não do centro: um quadrado de 18 m mirado em (8,6) vai até (19,17).
  É assim em todas as magias de quadrado do motor; quem escreve prova para elas mira pelo canto.
- No navegador: o nome dos demônios saía com espaço duplo ("Manes  1"), porque o sufixo já vem com o espaço.

## As quatro que sobravam (2026-11-16, a mesma tarde)

Com elas, **nenhuma fila de magia (PHB, Xanathar, Tasha, AI) tem mais "o motor ainda não faz"**: o que sobra leva 1 minuto
ou mais para conjurar, ou só se narraria. Provas em `testes-magias-xge.mjs` (43 no arquivo, 5 novas).

| Magia | No jogo | O que fica de fora |
|---|---|---|
| Aprimorar Perícia (Xanathar, 5º) | a especialização numa perícia treinada do aliado tocado (`periciaAprimorada`, lida em `abilities.js skillBonus`); na luta a perícia é uma das opções, e EXPLORANDO ela também se conjura (`utilidade-livros.js`, `escolhe: 'pericia'`): a tela pergunta entre as perícias treinadas do alvo | nada |
| Controlar Ventos (Xanathar, 5º) | o cubo de 30 m (`zona.vento`) com os três modos: as rajadas e a corrente descendente dão desvantagem ao ataque de ARMA à distância que passa pelo cubo ou mira quem está nele (`attackModifiers`, que agora sabe se o ataque é de magia, `deMagia`); a descendente derruba quem voa ao entrar ou começar o turno nela (Força); a ascendente corta à metade a queda dentro dela. A ação Mudar o Vento troca o modo ou para | as rajadas são sempre as fortes; o deslocamento dobrado contra o vento (o motor não tem terreno de uma direção só) e o pulo mais alto |
| Gaiola de Almas (Xanathar, 6º) | a reação sai sozinha, como a Queda Suave, quando um humanoide que quem a tem pronta vê morre a até 18 m e ele não tem alma presa (`livro-motor.js gaiolaDeAlmas`, chamada nas duas mortes do motor: a do herói, `morrer`, e a do monstro); seis usos, pelas ações bônus Roubar Vida (2d8 PV) e Emprestar Experiência (vantagem na próxima jogada de ataque, teste ou resistência, gasta na jogada de verdade e não na prévia); o morto não volta com o Revivificar enquanto a alma estiver presa | perguntar à alma e os olhos do morto (só se narrariam) |
| Míssil Mágico de Jim (AI, 1º) | um `raios` com regra própria (`dardosDeJim`): as jogadas saem TODAS antes do dano, o crítico é 5d4 e um 1 natural em qualquer uma estoura os dardos em quem conjurou, 1 de energia por dardo. O Jim Darkmagic do bestiário passou a tê-lo no lugar do Míssil Mágico comum (`importar-bestiario.mjs MAGIA_DE_OUTRO_NOME`, agora vazio) | o Escudo e a Imagem Espelhada contra cada dardo (a jogada é a do motor, sem o caminho inteiro do ataque de magia) |

Achados no caminho: **o monstro morre por um caminho e o herói por outro** (`applyDamage` marca `dead` no monstro sem passar
por `morrer`): a Gaiola só pegou os dois depois de entrar nos dois lugares. E a Gaiola caiu numa nota de maldição que já
tinha seis magias: foi para o timbre de utilidade da necromancia. O cubo do vento e a Fúria da Natureza ganharam cor no
tabuleiro (`tabuleiro-topo.js`) e arte das que já existem (`fx.js`: o vento da Muralha de Vento, as vinhas): nenhuma geração.

### A Gaiola pergunta (2026-11-16)

A primeira versão gastava a reação e o espaço de 6º círculo sozinha, como a Queda Suave. Agora o HERÓI é perguntado. O
motor resolve a morte no meio do golpe e não tem como parar ali, então deixa uma OFERTA (`enc.ofertasDaGaiola`, o evento
`ofertaDaGaiola`), e a tela (`main.js perguntarGaiola`) abre o painel logo depois da ação: "Prender a alma" ou "Deixar ir".
Numa sala, quem responde é o jogador daquele herói (`prenderAtor`, o mesmo caminho das decisões da narrativa). Aceitar
depois só vale na mesma rodada e se nada mudou (a reação, o espaço, o corpo: `livro-motor.js aceitarGaiola`). O MONSTRO que
a tem reage sozinho, e o simulador pode fazer o herói reagir sozinho com `enc.gaiolaSemPerguntar`. Só se oferece a alma de
um humanoide INIMIGO. Provado em `testes-magias-xge.mjs` (44 no arquivo) e no navegador, com o clique no painel.
