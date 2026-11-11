# Mansão Tresendar / Esconderijo Marcarrubra (cap. 3) — pente fino contra o livro

6 de novembro de 2026. Parecer do `fidelidade-aventura` **reproduzido no motor**, achado por achado. A tabela das
12 áreas dele fecha: planta, tesouro, XP e CDs batem com o livro. O que segue é o veredito das 15 observações
por gravidade, e o que foi feito de cada uma.

Provas depois das mudanças: `testes-cenas.mjs` 68/68, `testes-regras.mjs` 508/508, `testes-mansao.mjs` **24/24**,
`testes-itens-fora.mjs` 33/33, `vitest` 400/400, `conferir-paredes` e `conferir-cena` com 0 achados.

## Consertados

### A1. O que SÓ os bugbears sabiam, e o jogo não entregava

A Intimidação CD 15 contra os bugbears já existia (`capitulo3-mansao.js:1026`) e o nó `confessa` pagava em
PLANTA: a chave com o de tapa-olho, o quarto do mago depois da oficina, a porta de trás para o depósito. Só que
no livro o que os bugbears têm de exclusivo é outra coisa — **o caminho do Castelo Dentefino**. Eles vieram de
lá, e o soldo passou por lá.

E o buraco era visível de dentro do próprio capítulo: o **Droop** tem um nó `castelo` cuja fala é *"Droop não
sabe o caminho… pega um, aperta, ele fala"*, com a pista registrada no diário. O jogo apontava para um informante
que não existia. Agora existe: a confissão ganha a terceira fala (nordeste de Phandalin, mata adentro, do outro
lado do rio, ruína de pedra com um rei goblin) e grava a pista em `camp.vila.pistas`, como as outras.

**Não pus a Caverna Onda Eco na boca deles**, que era a outra metade do achado: dessa só o mapa do Gundren fala, e
o livro faz o grupo achá-lo no Castelo. Dar o lugar da mina aqui atalharia o capítulo 4 inteiro.

### A2. O Cajado de Defesa não era de vidro, e tinha seis cargas

`src/rules/items/phandelver.js` descrevia a peça que dá o NOME ao Cajavidro como *"bordão de ponta recurvada com
seis cargas"*. O bloco do próprio Cajavidro (`monsters/humanoides.js`) já falava de **cajado de vidro com dez
cargas**, e o ataque dele se chama "Cajado de vidro". Duas verdades para a mesma peça, e quem acha a peça na
Mansão lê a descrição, não o bloco. Agora o item é o do livro: vidro fosco, **dez cargas**, Armadura Arcana por
uma e Escudo Arcano por duas, **1d6 + 4 ao amanhecer**.

**E o achado puxou outro, maior, que o revisor pediu ao contrário.** Ele queria que o item ganhasse o "+1 de CA"
do bloco. Fui ver: o **+1 era invenção nossa**, e contra o próprio livro — a ficha do Cajavidro lá diz *"CA 12 (15
com Armadura Arcana)"*, e o cajado do livro **não dá bônus de CA nenhum**: ele CONJURA, e quem defende é a magia.
Então o bloco desceu de **CA 16 para 15** (13 da Armadura Arcana + 2 de DES), com o Escudo Arcano levando a 20
quando ele o ergue. `testes-regras.mjs` fixava o 16; passou a fixar o 15, com o motivo escrito ao lado do assert.

## Decisão do dono, não minha

**A3. O Vigia Ciclópico marcado `fonte: 'MM'`.** O revisor quer `'aventura'`, porque o livro traz o bloco no
apêndice. O comentário em `aberracoes.js` diz, literalmente, que os números são do Livro dos Monstros *"a pedido
do dono"*, e que o nome e a arte continuam nossos. Isso é escolha de licenciamento do projeto, não defeito de
fidelidade — fica como está até o dono dizer o contrário. (A "Estranha Intuição" ser só texto, e o nó `intuicao`
não rolar Enganação contra Intuição, **isso** é lacuna de regra, e entra na lista abaixo.)

## Feitos agora (segunda rodada)

As dez observações que tinham ficado de fora voltaram, uma a uma, com o motor na mão. **Quatro eram defeito,
três eram falsas** (e uma delas falsa por culpa de um comentário NOSSO), e três seguem como desvio declarado.
`testes-mansao.mjs` foi de 19 para **24**.

### O alarme que tocava sozinho (A4, e o comentário que mentia)

O revisor disse que **o rato do mago não entra no tabuleiro**. Medido: ele entra, e sempre entrou — (4,4), lado
neutro, 1 PV, sem ataque, em `encounter.js foesMansao`. **O que mentia era um comentário nosso**, no alto do
`capitulo3-mansao.js`: *"O rato não entra no tabuleiro (simplificação nossa)"*. O revisor leu e acreditou. Está
corrigido, e com a medida ao lado.

E ao conferir apareceu o defeito de verdade: o aviso saía **com o rato vivo, morto ou desacordado**, e o painel
narrava *"um rato marrom corre por baixo da bancada"* mesmo depois de o grupo o ter matado. O alarme tocando sem
ninguém para tocá-lo. Agora, bicho fora de combate, a oficina fica em silêncio e o mestre, de costas — e **não**
inventei teste de Furtividade para passar por ele vivo: o livro não dá essa chance, e a planta concorda (medido:
nenhuma casa de fora da oficina tem linha de visão até (4,4), então não há como abatê-lo antes de entrar; quem
não quer o aviso usa a passagem secreta do 7, que é a alternativa do próprio livro).

### O Droop acorda com uma ação (A7)

O livro: inconsciente por 1d10 minutos, e **outra criatura pode acordá-lo com uma ação**. No jogo o despertar
estava grudado no SAQUE: só revirando o cinto do Mosk o goblin voltava a si. Grupo que vencesse os bugbears e não
revirasse nada ficava com um informante dormindo para sempre — e é ele que conta as quatro portas secretas, a
senha da cripta e o caminho do Castelo. Agora qualquer herói encostado nele o sacode, e o saque continua
acordando quem ainda estiver dormindo.

### A Estranha Intuição virou rolagem (A3b)

O traço do bloco é um teste **resistido** — a Intuição do vigia contra a Enganação do alvo — e quem perde tem um
fato lido em voz alta. O nó `intuicao` da conversa era decoração: nenhum dado caía, e o único traço próprio da
criatura não existia como regra em lugar nenhum. Agora rola, um herói por vez, e o segredo que o olho lê é
**verdade do estado do jogo**: o manto vermelho roubado em quem não é Marcarrubra, o cajado de vidro, a chave do
Mosk, a senha da cripta que o Droop contou. Ler o manto **não** quebra o disfarce — o olho fala para a mesa, não
para os bandidos.

### O quadro "o que os Marcarrubra sabem" (A5)

O livro tem um quadro com esse nome e o jogo entregava dois itens dele num nó só. Capturar bandido para
interrogar o jogo não tem (só o Cajavidro se rende), e montar rendição para `marcarrubra` seria mecânica nova —
então o quadro sai por onde o grupo **pode** falar com eles: a mesa dos bêbados, de manto vermelho. Quatro
assuntos novos — os presos das jaulas e o entalhador que eles mataram, onde fica a pilhagem (galpão, sala
trancada, e o que é bom vai para o quarto do chefe), a cripta em que ninguém entra sem manto —, mais a
**Intimidação CD 13** para o que eles não oferecem: *tem alguém acima do mago, e quem traz a carta são os
peludos*. Falhar põe a sala em cima do grupo.

### A poção que ele bebia sem ter (A9)

A fuga do Cajavidro **já era** a do livro (ele sai pelas secretas, seis casas por passo do grupo, e os
guarda-costas ficam no quarto), então essa parte do achado era falsa. O que era real: o frasco de invisibilidade
dele é o da **bolsa de fuga no fundo da cisterna**, que o jogo já deixa o grupo achar e já grava
(`salvo.bolsa`) — e ele bebia mesmo assim, o que já estava na mochila de um herói. Agora, achada a bolsa, ele
enfia a mão no cinto, a mão volta vazia, e é alcançado de corpo inteiro.

### A mesa, os mantos e as colunas (A12, A13, A15)

- **Derrubar a mesa** é a distração que o livro sugere na sala 10, com as pilhas de moeda do jogo de pedrinhas.
  Entrou como ação nomeada, e custa algo: as moedas se espalham, e o verbo do dinheiro passa a ser *Catar o
  dinheiro do chão*, com o rubi debaixo da estante.
- **Os mantos do depósito** tinham duas verdades no mesmo botão: o `detalhe` dizia "uma dúzia pendurada na
  porta" e o texto, "pilha dobrada num canto". Ficaram nos ganchos, como no livro.
- **A pilha de roupa das jaulas** estava PROMETIDA no comentário do próprio gerador (*"5 jaulas: palha nas duas
  celas, a pilha de roupa e a lanterna"*) e nunca era pintada. Entrou em (20,3).
- **As duas colunas falsas** do corredor do fosso eram desenhadas como `pilarQuebrado`. Coluna falsa tem de
  parecer coluna, senão a junta se vê de longe e não há o que achar: viraram `pilarAnao`. A quebrada continua na
  cripta, onde o desabamento é parte da sala. São 23 peças agora, e os dois conferidores seguem em 0 achados.

### Falsos, medidos

- **A6, o disfarce com os bugbears.** A árvore já tem cinco saídas — passar, perguntar, apertar (Intimidação CD
  15), atacar de surpresa e sair em paz —, não "só passa ou luta". Mandá-los contra "traidores" pediria um
  TERCEIRO lado no motor (hoje são `party`, `foes` e `neutro`): é funcionalidade, não conserto.
- **A8, a senha da cripta.** O vigia "sabe o que os Marcarrubra sabem" — e os Marcarrubra **não sabem a senha**.
  Isso agora está dito em jogo, no nó `ossos` da mesa: *"Tem uma palavra que faz eles pararem. O chefe sabe. A
  gente, não."* Só o Cajavidro e o Droop, que o ouviu falar, a têm. Não é lacuna.
- **O anjo triste e as portas de cobre esverdeadas** não entraram: não consegui confirmá-los no livro, e o
  revisor também não conferiu a pintura. Pôr estátua de anjo na planta por lembrança de leitura é exatamente o
  que esta rodada tentou não fazer.

## Segue como desvio declarado

- **A10. O bloco `marcarrubra`** (CA 13, 16 PV, multiataque, ND 1/2) contra o bandido do SRD que o livro usa
  (CA 12, 11 PV, ND 1/8). Era a maior divergência numérica da cena e ficou marcada como "vale medir um dia".
  **MEDIDO** — `src/dev/medir-marcarrubra.mjs`, 300 lutas por caso nas três salas de bandido (alojamento com
  3, jaulas com 2, sala de estar com 4 envenenados), as mesmas sementes nas duas colunas:

  | grupo de 2º nível | nosso bloco | bandido do SRD |
  |---|---|---|
  | vitórias do grupo | 100% | 100% |
  | vida que sobra | **89%** | **95%** |
  | lutas com alguém a 0 PV | 6% | 1% |
  | lutas com alguém morto | 0% | 0% |

  No 3º nível a diferença encolhe para 92% contra 96%. O nosso bloco custa **seis pontos percentuais de vida
  do grupo por luta** e não matou ninguém em 900 lutas. Não é duro demais: é o que impede que as três salas de
  bandido sejam NADA — com o bloco do livro o grupo sai delas com 95% da vida e ninguém encosta no chão.
  **Fica como está**, com o número gravado no bloco e os quatro valores travados em `testes-regras.mjs`.
- **A11. O bugbear que dorme até a rodada 4** e os **dois guarda-costas** do Cajavidro: inventados, declarados,
  com a medição ao lado no código.
- **A14. A luz** usa `tocha` e `fogueira` onde o livro fala em lâmpadas de óleo. A grade de luz da Mansão foi
  medida e fechada em 5 de novembro; fica como registro.

## Texto perto demais do livro

**FEITO**, os cinco. E a medida mudou o achado: `src/dev/conferir-colagem.py` mostrou que nenhum deles
compartilhava uma frase com o livro — o que havia era a ORDEM DAS IDEIAS. A carta passou a ser lida de baixo
para cima; a conversa com o Iarno preso saiu da ordem do quadro do livro para a ordem DELE (a vaidade primeiro,
o drow só quando o assunto é dinheiro); o diário do Urmon começa pela obsessão e termina no nome; o Talon ganhou
o falcão como detalhe notado depois; e a piada do tapa-olho virou outra piada. Tudo, com a medida que o decidiu,
em `revisoes/colagem-2026-11-06.md`.

## O que o revisor não conseguiu conferir

A imagem do mapa oficial (ele confiou no de-para), a pintura e a posição de `folhas` e `decor` na tela, os
sprites, e o texto do apêndice sobre o Mosk. Ele também não rodou o jogo — só leitura mais Node para a planta.
