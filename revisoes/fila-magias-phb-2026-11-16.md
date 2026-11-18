# A fila de magias do PHB (2026-11-16)

A fila é `src/dev/magias/phb-pendente.json`, escrita por `src/dev/importar-magias.mjs phb`: as magias do Livro do
Jogador que NÃO estão no jogo, cada uma com o motivo. Provas em `src/dev/testes-magias-livros.mjs` (20 no arquivo, 4 novas).

## A medida

| Motivo | Antes | Depois |
|---|---|---|
| o motor ainda não faz o que ela faz | 21 | **0** |
| leva 1 minuto ou mais para conjurar (sem tabela) | 0 | 14 |
| a mecânica está na tabela, mas leva 1 minuto ou mais | 7 | 7 |
| só se narraria | 10 | 14 |
| **na fila** | **38** | **35** |

As 21 de "o motor ainda não faz" eram três coisas misturadas, e a fila não dizia qual:

- **As que agem numa luta e cabiam no motor** entraram: a Forma Etérea, a Muralha Prismática e o Desejo (abaixo).
- **As de 1 minuto ou mais** (Antipatia/Simpatia, Projeção Astral, Despertar, Clone, Contingência, Convocação Instantânea de
  Drawmij, Fabricar, Encontrar o Caminho, Recipiente Arcano, Aliado Planar, Vínculo Planar, Simulacro, Símbolo, Círculo de
  Teletransporte) ficam fora pela regra já escrita no `CLAUDE.md`: não cabem num turno de luta, e o sistema de magia fora da
  luta (`rules/utilidade-livros.js`) não tem o que elas mudariam. O importador passou a dar esse motivo a toda magia longa
  sem tabela, em vez de "o motor ainda não faz".
- **As de uma ação que só abrem o que o jogo não tem** (Semiplano, Portal, Baú Secreto de Leomund, Sequestro) entram na
  regra do dono das que só se narrariam (`SO_SE_NARRARIAM`): o semiplano vazio, o portal para outro plano, o baú guardado
  no etéreo, o objeto escondido. Nenhuma tem o que mudar no tabuleiro.

## As três que entraram

| Magia | No jogo | O que fica de fora |
|---|---|---|
| Forma Etérea (7º) | quem conjura vai para o etéreo (`etereo`, a condição do Piscar: ninguém mira nem fere, e ele não ataca nem conjura) e NÃO volta sozinho no começo do turno, como o Piscar volta; a ação Voltar do Plano Etéreo (`magias-concedidas.js voltarDoEtereo`, a única magia que se conjura de lá, `doEtereo`) o traz de volta numa casa livre a até o deslocamento dele de onde sumiu, por cima de parede e de móvel | levar mais três por círculo acima do 7º; andar livre pelo etéreo, turno a turno |
| Muralha Prismática (9º) | a parede reta de 27 m, opaca, pela máquina das muralhas (`zona.prismatica`): quem entra passa pelas sete camadas com Destreza em cada (cinco de 10d6, a anil começa a petrificar, a violeta cega e no começo do próximo turno manda para outro plano quem falhar em Sabedoria, `banidoDoPlano`); quem conjurou e o lado dele passam sem nada; a luz plena de 30 m e mais 30 de penumbra; quem a vê a até 6 m faz Constituição ou fica cego por 1 minuto, quando ela surge e no começo de cada turno ali (`livro-motor.js inicioPrismatico`) | a esfera (o anel do motor é fixo em 6 m, e a esfera tem 9); quem CHEGA andando a 6 m não testa até o começo do turno; as camadas não se destroem uma a uma. A parede que passaria pelo espaço de alguém não sai: no livro a magia falha e o espaço se perde, aqui a mira recusa antes de gastar (achado no navegador, onde a primeira versão nascia em cima de dois goblins e os matava). No tabuleiro ela é a arte do Padrão Hipnótico, que já tem o arco-íris: nenhuma geração gasta |
| Desejo (9º) | duas das escolhas do livro, como opções da magia: a cura de até vinte aliados à vista (todos os PV, e o que a Restauração Maior tira: encanto, petrificação, maldição, um nível de exaustão, o máximo de PV perdido) e a resistência de até dez a um tipo de dano (`resistenciaDoDesejo`, sem duração, porque o livro não dá uma); e o desgaste: até o descanso longo, cada magia custa 1d10 necrótico por círculo (`estresseDoDesejo`), e um terço de chance de nunca mais conjurar o Desejo | duplicar outra magia (escolher entre centenas, com a mira de cada uma), criar um objeto, a imunidade a uma magia, desfazer uma jogada, e a Força 3 por dias |

## O que esta leva achou no caminho

- **A Forma Etérea dos monstros** (a nagpa, a Zuggtmoy, o dragão de esmeralda ancião) era, desde a leva das magias de uma
  ação, a FUGA para o etéreo (`fugirParaOEtereo`), porque a magia não existia. Com a magia no jogo, o importador a punha na
  lista de conjuração do monstro, que a IA não conjura, e tirava a fuga. Hoje o importador tira a magia da lista do monstro
  e mantém a fuga (`importar-bestiario.mjs`); os blocos dos seis bestiários saíram idênticos aos de antes.
- **O `canCast` refazia a conta de alcance e de vista** da casa mirada das magias de tabuleiro, e a volta do etéreo, que
  atravessa parede, era recusada por "sem linha de visão". As que conferem a casa por inteiro (`Livro.CASA_PROPRIA`) não
  passam mais pela conta de novo.
- **A nota de som**: o reimport do PHB sorteia de novo a nota das magias antigas, e mais uma vez elas voltaram à nota de
  antes; só as três novas ganharam nota.
