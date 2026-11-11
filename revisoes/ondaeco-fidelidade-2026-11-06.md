# A Caverna Onda Eco contra o livro — 2026-11-06

Parecer do `fidelidade-aventura` sobre o capítulo 5, mais o pente fino mecânico que eu rodei antes e o que
reproduzi de cada achado. Regra do projeto: o revisor devolve parecer, quem conserta é quem chamou, e cada
achado só vale depois de reproduzido.

## O pente fino mecânico — um defeito, consertado

Rodado antes do revisor, sobre o motor: alcance, postos, peças, portas, saída.

**SEIS CASAS DE CHÃO QUE NINGUÉM ALCANÇAVA.** (5,33), (5,34), (6,34), (30,78), (36,11) e (51,9) — chão de
verdade, dentro das áreas, que a chegada não alcança nem com as 17 portas abertas. **O gerador as contava
desde sempre**, numa linha de relatório que ninguém lia (`casas de area sem alcance (fora agua e fosso): 6`),
e nunca as consertava. A conta de componentes que ele já fazia não as pega porque roda sobre `CHAO`, que
inclui o fosso e a água funda: a (36,11) tem rocha nos quatro lados menos o fosso de (35,11), então em `CHAO`
ela faz parte de um pedaço grande e só o motor, que não deixa pisar no fosso, a isola.

Chão que ninguém pisa é pior que rocha: entra na conta de área, na escolha de posto e no desenho. **Agora
viram rocha, e o gerador se recusa a escrever se sobrar alguma.**

O resto passou limpo: as 20 áreas alcançáveis (2.974 de 2.974 casas), 55 postos de bando em chão livre sem
sobreposição, 194 peças em casa que o menu enxerga e todas com texto de Examinar, 17 portas com folha e
nenhuma no maciço, 9 casas de saída e 11 degraus alcançáveis.

## A resposta que eu queria: as oito áreas vazias estão CERTAS

Eu tinha estranhado que as áreas 1, 5, 7, 8, 10, 13, 16 e 17 não tivessem criatura nenhuma. **O livro não
povoa nenhuma delas**, e o revisor conferiu uma a uma: a 1 tem o corpo do Tharden e o acampamento, a 5 os
corpos e o cofre, a 7 é refúgio ("nenhum monstro vem aqui"), a 8 tem o gás, a 10 o esqueleto no lago, a 13 os
ossos de cenário e a aura, a 16 o jato d'água, a 17 é a passagem baixa. Os monstros dessas áreas só entram
pela tabela de Monstros Vagando. **E as contagens das outras doze batem todas**: stirges 10, esqueletos 9,
ghouls 3+4, bugbears 5/3/2, zumbis 8, caveira 1, aranhas 4, Vhalak, Nezznar, Mormesk, espectador, gosma.

## O QUE EU CONSERTEI

### A chama verde era laranja, e o tipo estava escrito ali

O gerador tinha a tupla `((26,27,'braseiro'), (9,9,'fogueira'), (65,37,'chama verde'))` e a linha seguinte
**jogava o tipo fora**, escrevendo `'tipo': 'fogueira'` nas três. As três luzes da mina saíam laranja com
animação de fogo, inclusive a chama verde da Forja das Magias, que o livro descreve como *"um braseiro no
qual uma estranha luz verde"*. `rules/luz.js` já tinha o tipo `magica` com pulso.

Agora o braseiro do alojamento é `braseiro`, a fogueira do templo é `fogueira`, e a chama verde da forja é
`magica` com `cor: '#5bff8f'`.

### A caveira flamejante não tinha luz nenhuma

O livro, área 12: *"uma caveira envolta por uma chama verde"*. Ela existia como ninho e como peça, e não
acendia nada. Ganhou luz própria, verde, de 10 pés — menor que a da forja, porque é uma caveira e não um
braseiro.

### A caverna dos fungos ficava meio escura

O livro, área 8: *"os fungos verde-brilhantes permitem que as criaturas possam ver **toda a caverna** sem
ajuda de visão no escuro ou uma fonte de luz"*. Acendíamos **uma casa por fungo**, e a área ficava com 124
casas em penumbra e o resto no breu. Medido depois: **155 de 155 casas livres em penumbra, zero no breu**.

## O QUE EU DESCARTO

**"A redução de níveis no templo é desvio sem marcação" — FALSO.** O revisor pediu "ou se declara a regra no
código e no README, ou se tira". Ela **está declarada**, com a medida, três linhas acima do código
(`capitulo5-ondaeco.js`): *"O LIVRO é para o 5º nível. Um grupo mais verde que isso chega ao templo e perde
sempre (medido: 0% de vitória nos níveis 3 e 4), então o DMG manda ajustar"*. É uma decisão medida e
assinada, não um número solto.

**"Monstros Vagando só rola em descanso" — PARCIAL.** O livro: *"se os personagens gastarem um longo tempo em
uma dada área, você pode checar... rolando um d20. Numa rolagem de 17-20"* — e, duas frases antes, *"use-os
esparsamente"*. Descansar É gastar um longo tempo numa área. A leitura estreita, e vale discutir alargá-la,
mas não é infidelidade.

## SEGUNDA LEVA: os três ALTOS e o primeiro MÉDIO

### O fosso e a fenda se atravessam, com o teste do livro

Os dois eram buraco e nada mais — `fosso` barra o passo, e não havia verbo nenhum para descer. O livro dá a
mesma regra aos dois, mudando só a CD e a profundidade: *"subir ou descer pela parede do fosso sem uma corda
requer Força (Atletismo) CD 15"* (área 1, 3 m) e *"a fenda tem 6 metros... Atletismo CD 10"* (área 18), com a
mesma falha nos dois — *"quem falhar no teste por 5 ou mais cai e leva 1d6 de dano de concussão a cada 3
metros caídos, ficando derrubado no chão"*.

O fundo não é casa do mapa (o buraco é casa que barra o passo), então quem passa **sai do outro lado**:
desce, atravessa o fundo e sobe. Quem cai fica no próprio lado, caído, com 1d6 no fosso e 2d6 na fenda. É a
tradução honesta do que a planta comporta, e o texto diz isso. **Conferido no jogo**: "Descer pelo fosso" em
(12,73) e "Descer pela fenda" nas três bordas da fenda que testei.

### O espectador cego vai embora

O livro: *"se o espectador for cego de alguma forma, ele desaparece de volta para seu plano natal,
convencido de que não pode mais fazer a tarefa para a qual foi invocado"*. É a saída que o grupo compra com
uma magia em vez de com os pontos de vida dele, e não existia: cego, ele continuava lutando às cegas como
qualquer monstro. Agora, no turno dele, se estiver com a condição `cego`, some — e dá o mesmo XP da saída
pela conversa.

### O teto cai em cima de todo mundo

O desabamento da estátua (área 19) contava só `herois()`. O livro diz *"cada criatura na sala"*: arrancar o
segundo olho no meio da luta derrubava o templo sobre os personagens e deixava as aranhas e o Nezznar de pé,
sem um arranhão. Agora é cada criatura viva da área 19.

### Escutar vale em toda porta fechada

O livro pede em duas áreas pelo nome — a 6 (*"escuta na porta com Percepção"*) e a 11 (*"Escutar CD 10 em
qualquer porta"*) —, e aqui só as **quatro portas trancadas** o ofereciam: o laço delas sai com `continue`
antes de chegar na parte das portas comuns. Agora vale nas **dezessete**, conferido no jogo, e quem está do
outro lado sai do mapa, não de um palpite — os bandos já têm posição desde o começo da cena.

## TERCEIRA LEVA: os médios

**A coleira dos zumbis.** O livro, área 12: os oito zumbis "se levantam e perseguem qualquer criatura viva
que entrar na sala, **mas não perseguem as criaturas para fora desta área por mais de 1 rodada**". Sem isso
os oito saíam atrás do grupo pelo canal e pela passagem e iam parar na caverna estrelada — a fundição ficava
vazia, e recuar virava a resposta a tudo. Agora, passada a rodada fora, o zumbi para, perde o interesse e
volta. **A caveira em chamas não tem coleira**: ela é inteligente, e o livro a põe para "prevenir que
intrusos passem".

**Barricar a porta do depósito.** O livro, área 7: "o depósito é um lugar seguro para descansar. Nenhum
monstro vem aqui. Além disso, a **porta do depósito está em bom estado e pode ser facilmente bloqueada ou
barricada pelo lado de dentro**". O refúgio já existia — só ali se dorme —, mas o verbo não: o grupo
descansava de porta aberta. Agora os barris rachados que o livro encosta na parede fecham a porta, de graça,
e saem de novo quando se quiser.

**Nundro vai junto, se o grupo quiser.** O livro: "Nundro fica agradecido se os aventureiros o resgatarem, e
**se oferece para ir junto** com eles". A árvore só o deixava ficar deitado na cela. Agora, depois do
reconhecimento, há a opção de levá-lo: ele pega um machado de um anão caído, entra no tabuleiro do lado do
grupo, e quem preferir deixá-lo em paz tem o que tinha. Os 200 XP são os mesmos nos dois caminhos — o livro
os dá por resgatá-lo, não por levá-lo.

**Nezznar entra invisível.** O livro, área 19: "se eles estiverem esperando problema, as aranhas se escondem
atrás dos pilares e **Nezznar conjura invisibilidade em si mesmo** ficando próximo da mesa". A furtividade
das aranhas já estava lá; a invisibilidade do drow não — ele esperava à vista, e entrar no templo já o
mostrava de pé.

## MAIS UM ACHADO DESCARTADO

**"Arcanismo na área 13 para sentir a aura" — FALSO.** Fui ler a área 13 inteira no livro: ela tem os
minerais que imitam um céu estrelado, as dúzias de esqueletos da batalha mágica de séculos atrás e as duas
construções de pedra de tamanho humano. **Não há aura mágica, não há teste de Arcanismo e não há "mais forte
ao norte".** O texto de entrada que temos basta.

## QUARTA LEVA: o que a FA pinta e o jogador não podia tocar

A cena do Foundry da Onda Eco traz **108 ladrilhos com nome** — três vezes os do Castelo —, e eles dizem onde
está cada coisa pintada. Convertidos para casa (grade de 100 px, origem 1900,2300) e cruzados com as nossas
194 peças, sobram **dois objetos de arte que não tinham interação nenhuma**, e os dois são exatamente os que
o revisor tinha listado como ambientação faltando:

| ladrilho da FA | casa | o que é |
|---|---|---|
| `collapsedcavernropes` | (29,10) 4x5 | **as cordas da fenda** (área 18) |
| `DarkPoolSkeleton` | (10,32) 2x4 | **o esqueleto do lago** (área 10) |

As cordas o livro cita duas vezes — "subir ou descer **sem usar a corda** requer Atletismo CD 10" —, e são
elas que os bugbears sobem. O esqueleto o livro põe "a três metros da margem, com flechas de orc entre as
costelas". Entraram as duas cordas (em 29,13 e 31,13, as casas livres dentro do ladrilho) e o esqueleto, na
praia de conchas em (11,33).

**E os três colchonetes da entrada.** O ladrilho `Camp` da FA fica em (9,71) e o marcador `fire` em (5,68), e
não havia **um `sacoDeDormir` sequer na área 1** — o acampamento do Tharden era chão vazio. São três, como o
livro diz.

**O Examinar passou a aceitar texto por ÁREA** (`variante@area`), como o do Castelo aceita por sala: a mesma
arte de ossos é "ossos de anão numa armadura" num corredor e é o afogado do lago na praia de conchas. Sem
isso, ou se inventava uma variante nova sem arte, ou o esqueleto do lago falava como um morto qualquer.

As peças foram de 194 para **200**, e os marcadores `.svg` da FA (`trap`, `skull`, `chest`, `fire`, `down`)
**não viraram objeto**: eles são etiqueta pregada ao lado da coisa, como o CLAUDE.md já registra, e as coisas
que eles apontam — o gás dos fungos, o tesouro do lago, os esqueletos da guarita — já existem.

## QUINTA LEVA: nenhuma área fica vazia, e os cinco textos foram reescritos

**As três áreas que ainda não tinham peça nenhuma ganharam o que o livro descreve nelas:**

- **2, Túneis da Mina** (379 casas livres, zero peças): o livro diz que "o fim das passagens está onde os
  mineradores desistiram" e que "várias das passagens terminam em paredes rochosas". Entraram oito peças do
  que eles largaram ao desistir — ferramentas, entulho de mina, um carrinho vazio, um montinho de minério,
  uma lanterna, um bloco caído.
- **16, Caverna Barulhenta** (49 casas): "uma margem ESTREITA fica em frente a uma larga caverna onde ferve
  uma extensão de água". Quatro peças de margem molhada: conchas na pedra, estalagmite, pedra de líquen.
- **17, Velho Córrego** (58 casas): "esta passagem está OBSTRUÍDA POR ROCHAS ARREDONDADAS E PEDREGULHOS".
  Cinco: blocos caídos, entulho e uma coluna natural.

As casas saem espalhadas (a cada passo, a mais longe das já escolhidas) e só em chão de mina, fora dos postos
de bando e da chegada. **Nenhuma das vinte áreas está sem peça agora**, e as peças foram de 194 para 201.

**E os cinco textos colados ao livro foram reescritos**, com a regra de sempre: os FATOS são do livro e ficam
(quantos, o que há, onde); o que muda é a lente. O defeito era repetir a ORDEM e a LISTA do original item a
item — as gravuras, depois os esqueletos, depois as lanternas, depois os stirges. Agora:

- **as stirges (3)** entram por quem olha: o chão puxa o olho, as paredes lavradas ninguém vê, e é o teto que
  guarda o que está vivo;
- **os ghouls (6)** entram pelo som, antes da sala — alguém quebrando osso com método, como quem janta só;
- **a fundição (12)** entra pela chama verde, que é a única coisa acesa em quinhentos anos, e só depois desce
  para a fornalha, os foles e o canal;
- **o lago (10)** entra pela água rasa que entrega o que guarda, e termina nas mãos que não largaram nada;
- **os avaliadores (5)** entram pelo que a sala fazia: o trabalho de um mês virando número.

## SEXTA LEVA: os dois últimos

**As seis lanternas da área 3.** O livro conta seis lanternas de cobre apagadas e "duas dúzias" de mortos; a
área tinha três lanternas e quatro grupos de ossos. Agora são **seis lanternas** e oito de ossos, espalhadas
pelas 151 casas dela.

**Os relevos, que não cabiam numa casa.** O livro os põe nas PAREDES — "relevos de anões e gnomos com a
picareta no ombro" —, e parede não é casa: não dá para pôr peça nelas. Viraram um verbo do LUGAR, como os
entalhes do Castelo: quem está encostado na rocha dentro da área 3 pode olhar o que está lavrado nela, uma
vez por herói. Sem teste, porque o livro não pede.

**O jato d'água da área 16 virou mecânica.** O livro: "quando o jato vem nesta caverna **a cada 2 minutos**,
ele aumenta a água em 3 metros. Depois de um minuto, o nível volta para sua profundidade normal de 6
metros". Era só texto de entrada. Dois minutos são vinte rodadas, e fora da luta o tempo se mede em passos:
a conta usa a mesma régua do gás dos fungos — a distância andada DENTRO da área, não o número de cliques —, e
a cada 60 pés o jato vem.

A margem fica a 4,5 m acima da água e ela sobe 3, então o jato **não cobre ninguém**: o perigo é a pedra
molhada, e quem falha numa salvaguarda de Destreza CD 10 vai ao chão. É o que a planta comporta — o nível da
água não é casa do mapa, e inventar afogamento onde o livro só faz a água subir seria pior que não ter nada.

## O QUE FICA

Nada do parecer.

## O que o revisor NÃO conseguiu conferir

As portas e passagens do mapa oficial contra a nossa planta (mediu só adjacência por corredor, e ela é
coerente); os blocos de estatística além de Mormesk, caveira e Nezznar; se `enc.emboscada` usa Percepção
passiva nas stirges; se `ondaeco-objetos.json` bate com o desenho.

## Estado da bateria

`testes-ondaeco` **11/11** (dois testes novos: as vinte áreas, e nenhuma casa sem alcance), `testes-cenas`
67/67, `testes-regras` 508/508, vitest 400/400, `conferir-paredes` e `conferir-cena` com 0 achados, e as
suítes vizinhas verdes. Conferido no jogo rodando, sem erro de console: o fosso, a fenda, e o Escutar nas
dezessete portas.
