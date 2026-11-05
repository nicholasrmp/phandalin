# Phandalin

RPG tático cooperativo no navegador, com as regras do **SRD 5.1**. Até 4 pessoas
numa campanha, combate por turnos em grade de 1,5 m vista de cima, como num VTT.

```bash
npm install
npm run dev      # http://localhost:5190
npm run build
```

`http://localhost:5190/estilos.html` mostra as quatro direções visuais que foram
avaliadas no começo do projeto.

---

## Estado atual

Protótipo de **combate** jogável: um encontro contra goblins, com os quatro
personagens prontos no 2º nível. Sem campanha, sem rede, sem conta — ainda.

O que já funciona:

- **Iniciativa por lado.** Rola-se uma vez para o grupo e uma para os inimigos;
  o lado inteiro age antes de passar a vez. Corta a fila de espera que mata jogo
  tático com 4 humanos.
- **Combate completo**: ação, ação bônus, reação, movimento em pés, ataque de
  oportunidade, vantagem/desvantagem com motivo explícito, crítico, cobertura,
  testes de resistência, concentração, testes de morte.
- **Quatro classes no 2º nível**, cada uma com seu verbo tático: Retomar o
  Fôlego e Ação Surpreendente (Guerreira), Ataque Furtivo e Ação Ardilosa
  (Ladino), Preservar a Vida e Discípulo da Vida (Clérigo), Esculpir Magias
  (Mago).
- **Magias** nos cinco formatos que o motor entende: ataque mágico, teste de
  resistência, dano automático, cura e bônus com concentração.
- **Elevação**: subir um nível custa o dobro (escalada, pelo SRD), o platô dá
  cobertura contra quem está embaixo e corta linha de visão.
- **IA de monstro** que fecha distância antes de atirar, foca em quem está
  machucado e usa Escapada Ágil quando se vê cercada.
- **Arte gerada por código**: nenhum arquivo de imagem no repositório.
- **Câmera que gira** em quatro orientações (`Q` / `E`), para enxergar atrás do
  platô e do paredão.
- **Som gerado por código**: nenhum arquivo de áudio, tudo saindo de
  osciladores e ruído. Cada golpe tem altura levemente diferente, então repetir
  quarenta ataques não vira metralhadora de um som só. `M` liga e desliga.
- **Animação própria por arma**: corte largo de espada, duas estocadas rápidas
  de adaga, pancada de maça com salto e rachadura no chão, flecha com rastro,
  azagaia girando, presas fechando na mordida, três riscos de garra.
- **Animação própria por magia**: coluna de luz da Chama Sagrada, bola de fogo
  com rastro que vira labareda, lasca de gelo que estilhaça, os três dardos do
  Míssil Mágico em sequência, cone de fogo acendendo de perto para longe, "z"
  subindo de cada alvo do Sono, pontos de luz na cura.
- **Condições com efeito contínuo**: quem queima tem chamas lambendo a figura e
  brasas subindo; atordoado tem estrelas girando; caído fica deitado com poeira;
  abençoado ganha argola dourada; lento arrasta setas; esquivando tem brilho.

### O criador de personagem

Na tela do grupo, o cartão **Criar herói** abre o criador (`src/game/criador.js`, tela em `src/view/menu-herois.js`):
nome, gênero, raça (as do Livro do Jogador que o motor joga, menos o humano variante), classe, antecedente (os quatro do
SRD 5.2: Acólito, Criminoso, Sábio, Soldado), atributos pelo conjunto padrão ou por compra de 27 pontos, perícias e uma
história curta. O resumo ao lado é a ficha montada pelo motor, ao vivo.

A **imagem da ficha** segue o anel dinâmico do Foundry: o jogador manda só a arte, escolhe zoom e enquadramento, e o
jogo a recorta no círculo e põe o anel do grupo em volta. Ela é reduzida para um webp de 192 px (`src/view/arte-upload.js`)
e mora na definição do herói, com a chave de retrato `arte:<id>` (`src/art/arte-propria.js`): toda tela que pede um
retrato o tira dela. Sem imagem, o retrato é a inicial do nome.

O herói criado vai para o rol do navegador (`src/game/herois-criados.js`) e passa pelo mesmo caminho dos doze prontos:
tela de preparo (talento, magias, equipamento), `criacao.js montarHeroi` e o motor de progressão. A partida guarda a
definição na própria config, então o save abre noutro navegador. `node --import ./src/dev/cena-node/register.mjs
src/dev/testes-criador.mjs` monta as 336 combinações de raça, classe e gênero.

Na **sala do multijogador**, o lobby tem "Trazer um herói seu": o herói criado entra na mesa na mão de quem o trouxe, e
os outros navegadores recebem a definição pela visão da sala e a imagem numa mensagem à parte (MULTIJOGADOR.md, L-06b).
`src/dev/testes-sala-criados.mjs` prova as regras, a porta do servidor e a montagem.

### Como a animação conversa com o motor

O motor resolve tudo de uma vez: quando o evento de dano chega, os PV já
caíram. A camada de desenho guarda um `impactDelay` e **segura o número e o
clarão** até o instante em que a animação chega no alvo — a flecha pousar, o
dardo estourar. A barra de vida acompanha com transição suave e deixa um rastro
vermelho do dano recém-tomado.

Nada disso altera estado de jogo: se todos os efeitos forem descartados, a
partida continua idêntica. É o que mantém o motor pronto para ir ao servidor.

`view/fx.js` tem o **vocabulário** (arco, estocada, pilar, chamas, lascas…) e
`view/visuals.js` tem as **frases** — o que cada arma e cada magia mostram.
Separar os dois significa que dar visual a uma magia nova é escrever uma receita
de cinco linhas, sem tocar no motor de desenho.

### Regras da casa

Uma só, e está marcada no código (`HOUSE_RULES` em `rules/combat.js`):

> **Incêndio.** No SRD, dano de fogo não incendeia ninguém. Aqui uma magia de
> fogo tem 35% de chance de pegar, e a criatura sofre 1d4 no início do turno
> dela, por 2 rodadas.

Existe porque dá leitura visual ao combate — a criatura pega fogo na tela — e
porque recompensa escolher a natureza certa. `HOUSE_RULES.ignite.enabled = false`
devolve o jogo às regras do livro.

Teste de fumaça, pelo console do navegador em modo dev:

```js
__app.autoPlay()   // joga o combate inteiro sozinho e devolve o resultado
__app.enc          // estado do encontro
```

---

## Licenças — leia antes de adicionar conteúdo

O projeto depende de **dois** instrumentos diferentes, e eles cobrem coisas
diferentes. O detalhamento está em [NOTICE.md](NOTICE.md); o resumo:

| O quê | Instrumento | Pode? |
|---|---|---|
| Regras, magias, monstros do SRD | **CC-BY-4.0** (SRD 5.1) | Sim, com atribuição. Irrevogável. |
| Nomes de lugares e personagens dos Reinos | **Fan Content Policy** da WotC | Sim, se o jogo for **gratuito** e trouxer o aviso. Revogável. |
| Texto, mapas e encontros de módulos publicados | — | **Não.** Nem de graça. |

É por isso que **motor e campanha são separados** no código: a licença das
regras é irrevogável, a política de fã não é. Se um dia a política mudar,
troca-se o arquivo de campanha e o motor continua de pé.

Nada neste repositório foi extraído de sites que hospedam os livros sem licença.
Todo texto de aventura é escrito do zero.

---

## Mapa do código

```
src/
  core/
    rng.js        RNG semeado — toda rolagem passa por aqui
    dice.js       d20 com vantagem, crítico, dano, resistência
    grid.js       grade de 1,5 m: distância, caminho, visão, elevação
  rules/          ← o motor. Puro: não sabe desenhar.
    abilities.js  modificadores, proficiência, perícias, CD de magia
    equipment.js  armas e armaduras, cálculo de CA
    conditions.js condições e o que cada uma muda mecanicamente
    spells.js     magias declarativas
    party.js      os quatro personagens prontos
    monsters.js   blocos de estatística do SRD
    combat.js     o encontro: turnos, ataques, dano, morte
    ai.js         IA dos monstros
  art/
    looks.js      paleta + traços de cada figura (inclusive equipamento)
    draw.js       o pintor: look → pixels
    sheet.js      folha de sprites, contorno automático, cache
  view/           ← só desenha e traduz clique. Não conhece regra.
    tabuleiro-topo.js  o tabuleiro visto de cima (mapa pintado, ficha redonda)
    hud.js        fichas, barra de ações, log de rolagens
  main.js         liga tudo
```

A separação `rules/` ↔ `view/` não é estética: o motor é autoritativo e puro,
então **move para o servidor sem reescrita** quando entrar o multiplayer.

---

## Por que vista de cima

O jogo começou isométrico: das quatro direções de `/estilos.html`, foi a escolhida,
pela elevação que se via. Em 2026-11-05 o isométrico saiu, e o jogo ficou só com a
vista de cima, no modelo do Foundry VTT — battlemap pintado por baixo, ficha redonda
com a arte da criatura, parede por traço, luz em raio.

O que pesou: o battlemap pintado (que é como mesa de RPG on-line se joga) só se
encaixa de cima; a ficha com imagem dispensa uma folha de sprites de 8 direções por
criatura; e o clique em quadrado é exato. A elevação continua valendo na regra,
só não se desenha.

---

## Mapas

Mapa é texto. `src/main.js`:

```
'.'      chão
'#'      parede (bloqueia movimento e visão)
'~'      terreno difícil (custa o dobro)
'o'      cobertura (+2 de CA, bloqueia movimento)
'1'..'9' elevação, cada nível = 1,5 m
```

### O editor de cenário

`/editor.html` (`npm run dev`, depois abra o endereço) monta um mapa **visto de cima**: pinta piso, põe parede, porta, arco e
grade por aresta, coloca objetos do atlas (inclusive peças de várias casas), pinta a altura do terreno, define salas e os quatro pontos de
partida, e cresce ou encolhe o mapa por qualquer borda. Desfaz e refaz (Ctrl+Z, Ctrl+Y), guarda sozinho no navegador e exporta e importa JSON.
Abre qualquer mapa do jogo para retocar. A caixa "Exploração livre" faz o jogo abrir o mapa sem iniciativa e sem inimigos; desligada, abre em
combate por turnos. "Testar no jogo" abre `?encontro=editor`. A lógica está em `src/game/mapa-editor.js` (testes: `src/dev/testes-editor.mjs`).

**Decalcar um mapa pintado, como no Roll20.** A vista é a de cima (`src/dev/vista-topo.js`), que é onde um battlemap pintado se
encaixa — o isométrico saiu do editor. Na ferramenta 8, "Mapa de fundo":
carregue a imagem, **arraste um retângulo por cima de N x M quadrados desenhados nela** e diga quantos são — daí saem a escala e a fase da
grade. Depois é só desenhar por cima o que é parede, porta e arco (ferramenta 2), e o resto do editor (salas, altura, partida) funciona igual.
Há ainda giro de 90°, opacidade, arrastar a imagem e "crescer o mapa até cobrir a imagem".

**Regiões (ferramenta R).** Uma área do mapa que faz algo quando alguém entra, sai, ou começa e termina o turno nela, como a Region do
Foundry: o fosso escondido, a placa de pressão que abre outra área, o mato que atrasa, o chão que range. Desenha-se por área (pincel,
retângulo, polígono, balde) e os efeitos se escolhem no painel: texto, dano com teste, condição, parar o passo, terreno difícil, acender
uma sobreposição, ligar outra região, teleporte. Marcada como **escondida**, ela é uma armadilha completa sem roteiro nenhum: a Percepção
passiva nota antes, o Procurar e o Encontrar Armadilhas acham. O motor (`src/rules/regioes.js`) a executa no passo de qualquer criatura,
e o formato de cada efeito está no cabeçalho dele.

A figura **não entra no mapa nem no repositório**: fica no IndexedDB do navegador, porque quase sempre é arte comercial de terceiros. O que o
mapa guarda é só o enquadramento, em `mapa.fundo` — `{ nome, escala, x0, y0, giro, opacidade }`, com `escala` em pixels da imagem por casa e
`x0`/`y0` dizendo onde cai, em pixels da imagem já girada, o canto da casa (0,0).

### O tabuleiro visto de cima

**É a única vista do jogo.** Grade quadrada, mapa pintado por baixo quando o mapa tem um, parede livre, e a
criatura como **ficha redonda** — anel da disposição, barra de vida e nome, no estilo do Foundry e do Roll20.

**As marcas da ficha**, como o Foundry as põe no token (`tabuleiro-topo.js marcasDaFicha`): um anel dourado que pulsa
em quem está agindo (o herói escolhido, ou o inimigo que a IA joga, `enc.agindo`); quem do lado da vez já agiu fica em
cinza; a concentração é um anel azul tracejado que gira; e as condições aparecem como até três selos no alto do anel,
da que mais muda a próxima decisão para a que só atrapalha, com "+N" para as que não couberam. Só as condições com
ícone (onze, mais contido, preso nas vinhas e paralisado, que usam o ícone do parente); as outras ficam no HUD.

Ele está em `src/view/tabuleiro-topo.js`. Até 2026-11-05 herdava do `Board` isométrico (`board.js`, 4.800 linhas);
quando o isométrico saiu, o que a vista de cima usava dele — câmera, ponteiro, cartão de previsão, mira de área,
números flutuantes, efeitos — foi trazido para dentro da classe, e o resto foi apagado. A tabela das superfícies do
chão (`SUPERFICIE`), que o editor também usa, mora em `view/superficies.js`.

**A parede tem restrições separadas, como no Foundry.** Cada tipo de aresta diz o que faz com o passo, a visão, a luz e o
som (`src/core/grid.js`, `RESTRICOES`): a **etérea** parece parede e se atravessa, a **invisível** só barra o passo, a
**limitada** é a moita (a primeira deixa ver, a segunda não), a **janela** deixa ver e não passar, a **mão única** só
deixa passar num sentido. A **porta trancada** tem CD no mapa, e qualquer cena sem roteiro de porta ganha o menu de abrir
a fechadura, arrombar ou usar a chave (`src/game/portas.js`). Tudo na ferramenta 2 do editor.

**Parede não precisa ser geométrica.** Caverna, pedra e destroço são irregulares, e forçá-los na aresta de casa
destrói justamente o que os faz parecer o que são. O mapa guarda, além das arestas, os **traços livres**
(`mapa.tracos`): polilinhas em casas, com fração, como foram desenhadas. Quando há traço, é ele que o tabuleiro
desenha; a aresta de casa (`mapa.paredes`) continua existindo como **derivada**, e é o que a regra usa para barrar
movimento. Uma aresta é parede quando o traço SEPARA as duas casas — cruza o segmento que liga um centro ao outro —,
então o que se vê e o que a regra faz nascem da mesma linha.

No editor as duas aparecem: o traço em cima, a aresta derivada discreta por baixo, para dar para conferir. A
ferramenta **9, "Parede livre"**, desenha: clique e arraste para traçar o contorno como ele é, com **Shift** para
grudar nos cantos de casa quando a parede for reta. "Apagar traço" tira o traço inteiro e devolve as arestas que ele
tinha criado — a parede pintada à mão (ferramenta 2) e as portas postas em cima dele ficam, porque quem as pôs foi a
mão. A lógica está em `game/mapa-editor.js` (`tracarParede`, `apagarTraco`, `arestasDosTracos`), com testes.

**A LINHA DE VISÃO usa o traço, não o degrau.** Movimento continua na aresta — é ela que diz de que casa dá para ir
a que casa —, mas o olho é testado na geometria: `grid.js` cruza a reta de centro a centro com as polilinhas
(`tracoCortaVisao`), com um índice por casa para não ficar caro. Onde o traço cruza uma aresta que deixa ver (arco,
porta aberta, grade, seteira), o cruzamento não conta — senão o vão de porta, que o VTT traça por cima, nunca
deixaria enxergar.

Medido nos três mapas importados, comparando com e sem traço (99 mil pares):

| mapa | pares | iguais | a grade deixava ver e o traço barra | o contrário |
|---|---|---|---|---|
| 6: Wave Echo Cave | 87.320 | 99,9% | 82 | **0** |
| 4: Redbrand Hideout | 8.556 | 99,5% | 46 | **0** |
| 2: Cragmaw Hideout | 3.306 | 99,1% | 30 | **0** |

A mudança é de mão única: o traço **só barra mais, nunca menos**. São os vazamentos que o degrau da grade abria numa
parede que o desenho fecha. Custo medido na Onda Eco (127 traços, 1.115 segmentos): 1,8 µs por par, e 2 ms para
montar o índice uma vez.

**E a COBERTURA passa a seguir a regra dos cantos do SRD.** Escolhe-se um canto da casa de quem ataca e traçam-se
linhas até os quatro cantos da casa do alvo: uma ou duas barradas dão meia cobertura (+2 de CA), três dão três
quartos (+5). Quem ataca escolhe o canto, então vale o melhor dos quatro. Antes a cobertura só olhava altura e
obstáculo — **parede não cobria**, porque na aresta de casa não há como traçar do canto.

Medido nos mapas importados, entre os pares que se enxergam: no Covil Cragmaw **70 de 272** mudaram (68 ganharam +2,
2 ganharam +5); no Covil Carrasco **99 de 518** (75 de +2, 24 de +5). É a quina da parede passando a valer o que o
livro diz que vale. Custo: 42 µs por par (dezesseis linhas de canto, cada uma contra o índice).

**A ÁREA DE MAGIA também.** A esfera já saía certa de graça, porque filtra por `hasLineOfSight`; faltavam os dois
caminhos que andam de casa em casa — o relâmpago e a explosão que contorna esquina. Os dois passaram a usar
`passaVisao`, que junta a aresta e o traço. Então Bola de Fogo não dobra mais a quina de uma parede que o desenho
fecha, e o Relâmpago para nela. A prévia sob o cursor não pode divergir: `tabuleiro-topo.js areaDaMira` chama o mesmo
`enc.areaDaMagia` do motor.

**O que não faz, e o isométrico fazia:** elevação desenhada (de cima, 1,5 m não aparece — a altura continua valendo
na regra, só não se vê) e a arte de cenário isométrica: onde o mapa não tem desenho pintado (a taverna), o chão é a cor
lisa da superfície e o móvel é o sprite do atlas deitado na casa, provisório.

### Conferir a planta contra um battlemap pintado

Para a Casa da Morte, o encaixe de cada andar num **battlemap pintado de verdade** (Morvold Press / Jeff Todd, em
`_referencias/casa-da-morte-morvold/`, fora do versionamento: arte comercial de terceiros, consulta apenas, não pode
ser publicada) foi **medido**, não estimado: `python src/dev/alinhar-mapa-pintado.py --provas` correlaciona a máscara
de pedra da imagem com as arestas da planta, acha giro, escala e origem, e grava a prova visual.

Os quatro andares da casa deram ~198 px por casa, giro 0 — o que também serve de **conferência de fidelidade**: a planta do jogo cai em cima
da planta publicada, parede por parede e porta por porta. As duas masmorras saíram em giro 90°, 76,8 e 128,2 px por casa, o que bate com a
conta (1920 px ÷ 25 casas e 1920 ÷ 15).

A medida automática só fecha quando as duas plantas **são a mesma**. Quando não são, ou quando o mapa é novo, o caminho é o do editor acima:
enquadrar à mão e decalcar.

### A emboscada dos goblins, do desenho

O primeiro encontro de **A Mina Perdida de Phandelver** usa um battlemap pintado de verdade (Venatus Maps, em
`_referencias/mapas/`, fora do versionamento). E o terreno **sai do desenho**, por cor — não à mão:

    python src/dev/mapa-emboscada.py        # reclassifica e reimprime as linhas de `game/encounter.js`

    verde forte -> `T` mata fechada        areia -> `:` estrada
    verde fraco -> `,` grama do acostamento   escuro no MEIO da estrada -> `C` carroça, `h` cavalo morto

A primeira fileira de mata colada na estrada vira `%` espinheiro: terreno difícil, que é a moita onde o livro põe os
goblins. Eles ganham cobertura e quem vai atrás paga o dobro para entrar.

O corte do escuro só vale no meio da estrada: na beira, a sombra da mata é escura do mesmo jeito e não é objeto.
(O chão da estrada mede 170 a 192 de brilho, o acostamento sombreado chega a 135, e carroça e cavalo ficam abaixo
de 125.)

O mapa novo tem **22 x 17 casas**, contra 28 x 22 do que fizemos à mão, e é **mais fiel ao livro**: a trilha reta
com moita dos dois lados, sem a encruzilhada e os barrancos que tínhamos inventado. Os três goblins (três, e não os
quatro do livro — ver o comentário em `foesEmboscada`) mudaram para a moita, e o grupo entra pelo oeste, atrás da
carroça tombada.

### Trazer um mapa do Roll20

Uma página do Roll20 é **imagem + grade + paredes**, que é quase o nosso `mapa.fundo` mais as arestas. Dá para trazer
sem copiar nada à mão:

1. Com a campanha aberta, cole `src/dev/extrair-roll20.js` no console da aba. Ele define `__paginasDoRoll20()` e
   `__extrairPagina(nome)`.
2. `__extrairPagina('2: Cragmaw Hideout')` devolve a página já com as paredes **rasterizadas para arestas de casa** —
   o dado pesado (as polilinhas à mão livre) nunca sai do navegador. Salve em `_referencias/roll20/<nome>.json`.
3. `node src/dev/importar-roll20.mjs _referencias/roll20/<nome>.json --tapar-frestas --abrir-vaos` escreve um
   `<apelido>-mapa.json` por página (importe no `/editor.html`) e um `<apelido>-fichas.json` com as criaturas.

**Para jogar num deles:** abra o `-mapa.json` no `/editor.html` (Importar JSON) e clique em "Testar no jogo", ou
abra `/?vista=topo&encontro=editor`. A imagem vem do `files.d20.io` pelo endereço que o próprio mapa guarda em
`fundo.url` — nada é baixado nem entra no repositório.

A grade do Roll20 é travada em **70 px por casa**, então a imagem entra com `escala: 70` e a origem sai do canto do
gráfico. A regra da parede: uma aresta é parede quando o traço do Roll20 **separa** as duas casas, isto é, cruza o
segmento que liga um centro ao outro. Marcar "a aresta que o traço cruza" não funciona — um traço quase horizontal
cruza as linhas verticais da grade e viraria uma fileira de barras soltas.

**O Roll20 não guarda chão.** Um mapa dele é imagem e parede; quem sabe onde se pisa é o olho de quem joga. Por isso
o importador deixa a página inteira como chão e só a parede barra. O `--inundar` tenta deduzir rocha a partir das
fichas, mas só vale se o contorno fechar na nossa grade, e o relatório diz se fecha.

**E porta não vem**, por um motivo que vale saber: na iluminação dinâmica antiga do Roll20 a parede barra a **luz**,
não o movimento. O vão de porta é traçado como parede, para fechar a visão, e quem joga anda por cima. No nosso motor
uma aresta barra as duas coisas, então o mapa chega com os cômodos lacrados.

`--abrir-vaos` resolve isso sozinho onde dá: procura o **menor conjunto de arestas a abrir** para o chão voltar a ser
um pedaço só. Cada abertura liga dois cômodos que não se falavam, e é exatamente aí que a porta está; entre as
arestas que separam os mesmos dois cômodos escolhe a do **meio da divisa**, porque porta fica no meio da parede e não
na quina. As arestas abertas viram **arco** (vão livre) — quem quiser porta com folha troca na ferramenta 2.

Para isso o chão é deduzido pelo avesso: é o que a **borda do mapa não alcança**, e não o que as fichas alcançam.
A diferença decide o resultado — partindo das fichas, todo corredor sem ninguém dentro ficaria de fora, e aí os vãos
nem teriam chão dos dois lados para ligar.

`--tapar-frestas` fecha o contorno antes disso, pelo caminho inverso: acha o **corte mínimo** entre a borda do mapa e
as fichas, que por definição cai onde a passagem é mais estreita — que é onde está a fresta. Só age em página que já
tem parede, desiste se o corte passar de 14 arestas, e desfaz se o que sobrar dentro for menos de 20% do mapa (em
campo aberto o corte mínimo lacraria um cantinho em volta das fichas, e isso não é planta).

Antes de tudo isso o importador tira as **fichas estacionadas**: o mestre deixa pilhas de ficha sobrando de lado, em
fileira. Na Caverna Onda Eco são 66 "Ochre Jelly" enfileiradas, metade fora da planta, e eram elas que estragavam o
corte. Uma criatura posta no mapa não forma fileira reta de cinco ou mais do mesmo nome em casas seguidas.

Medido nas cinco páginas com parede, rodando `--tapar-frestas --abrir-vaos`:

| página | casas | chão | frestas tapadas | vãos abertos | pedaços | o motor reclama? |
|---|---|---|---|---|---|---|
| **2: Cragmaw Hideout** | 30 × 21 | 241 | 1 | 8 | 1 | **não** |
| **4: Redbrand Hideout** | 30 × 21 | 358 | 0 | 18 | 1 | **não** |
| **6: Wave Echo Cave** | 37 × 50 | 1.178 | 0 | 50 | 1 | **não** |
| 5: Cragmaw Castle | 31 × 21 | 319 | 3 | 39 | 3 | 271 casas isoladas |
| Ruins of Thundertree | 30 × 21 | — | recusado | — | — | mapa de campo aberto |

Três masmorras entram inteiras e sem um aviso sequer. A Árvore Trovão é ruína a céu aberto com duas fichas só: não há
contorno para fechar, e o importador se recusa a inventar um.

**E a grade das imagens confere.** Medindo o passo da grade desenhada em cada mapa, pela imagem inteira: Cragmaw
Hideout 69,0 px (a página pede 68,3), Redbrand 68,75 (68,27), Onda Eco 41,00 (40,95). As imagens estão alinhadas.
(Medir uma faixa estreita da imagem dá resposta errada — numa faixa de 5 períodos o pico sai em outro harmônico.)

### A escala das masmorras da Casa da Morte

O mapa do livro diz "One square = 5 feet": **um quadrado é uma casa** do jogo, nas duas masmorras. As plantas saem de
`src/dev/mapa-casadamorte.py` (`python src/dev/mapa-casadamorte.py`), desenhadas como a página do livro (norte à esquerda, como a rosa dos
ventos dele) e giradas 90° no fim para o norte do livro ficar em cima, de modo que os textos do livro valem sem tradução.

---

## Como adicionar conteúdo

**Monstro** — `src/rules/monsters.js` (só blocos do SRD) + um look em
`src/art/looks.js`. Um look é um objeto de ~10 linhas: paleta e traços
(`armorStyle`, `weapon`, `helm`, `shield`, `cloak`…). Não precisa desenhar nada.

**Magia** — `src/rules/spells.js`, escolhendo um dos cinco `kind` que o motor
entende (`attack`, `save`, `auto`, `heal`, `buff`). Sem código novo.

**Personagem** — `src/rules/party.js`.

**Traço visual novo** (um elmo diferente, uma arma nova) — aí sim é arte, em
`src/art/draw.js`. Vale o esforço: o traço passa a existir para todas as figuras.

---

## Deploy

**No ar:** <https://phandalin.sdz-games.workers.dev>

```bash
npm run build
npx wrangler deploy
```

Publicado como **Worker com assets estáticos**, não como Cloudflare Pages. A
configuração está em `wrangler.toml`.

O motivo é concreto, não preferência: quando o multiplayer entrar, o Durable
Object de cada grupo vai viver **neste mesmo Worker**. Site e servidor de salas
no mesmo domínio significa um só deploy, sem CORS e sem dois lugares para
manter. O próprio wrangler já recomenda Workers para projetos novos.

Hoje `wrangler.toml` não tem `main`: é um Worker só de assets, servindo o build
do Vite. Para somar o servidor de salas, basta acrescentar `main` e o bloco
`[[durable_objects.bindings]]`.

`public/_headers` vai para a raiz do build e define o cache: os assets do Vite
têm hash no nome e são imutáveis, então ficam em cache para sempre; o HTML
revalida sempre. `.node-version` fixa o Node 20.

Para republicar a cada push sem rodar nada à mão, dá para ligar o build do
Workers pelo painel da Cloudflare apontando para este repositório
(build `npm run build`, deploy `npx wrangler deploy`).

---

## Balanceamento, medido

`src/dev/balance.js` é um simulador headless: roda o motor de regras sozinho,
sem tabuleiro nem espera, e devolve números. No console, em modo dev:

```js
const { simulate } = await import('/src/dev/balance.js');
simulate(120).resumo
```

A política do grupo no simulador é **competente, não ótima**: levanta quem cai,
estabiliza quando não há espaço de magia, cura antes de alguém cair se houver
folga, senão fecha distância e bate. Serve de linha de base — um grupo humano
coordenando deve se sair melhor que isso.

Curva atual, em 120 combates:

| | |
|---|---|
| vitórias | **73%** |
| combates com alguém caído | 52% |
| combates com morte definitiva | 10% |
| vida do grupo ao fim | 49% |
| rodadas | 6,7 em média, pico entre 5 e 8 |
| monstros mortos antes de agir | **0 de 6** |

Aquele último número era o problema. Antes, com iniciativa por lado, o grupo
despachava metade dos inimigos antes de qualquer um deles agir: goblins de 7 PV
morrem com um golpe. O conserto não foi "mais monstros" — foi monstro que
aguenta o primeiro turno (Hobgoblin, CA 18) e reforços que chegam na rodada 3.

### O que o simulador pegou que eu não teria visto

- **Exagerei na primeira tentativa**: de 100% para 8% de vitórias, com morte em
  38% dos combates. Sem medir, isso teria ido para o ar.
- **Curar melhor aumentou as mortes** (28% → 37%): o clérigo gastava os espaços
  curando antes e ficava sem nada para levantar quem caía. Isso expôs uma regra
  do SRD que faltava — **estabilizar** (ação, Medicina CD 10). Com ela, mortes
  caíram para 10%.
- **Mover um goblin dois quadrados mudou as vitórias de 64% para 90%.** O que
  parecia ajuste de posição era a IA jogando o platô fora: ela preferia corpo a
  corpo e fazia todo mundo descer, perdendo cobertura e gastando o dobro de
  movimento. Virou uma regra nova: quem está em terreno alto com arma à
  distância e linha de visão **fica e atira**.

## O que vem a seguir

1. **Equilíbrio.** O encontro atual está fácil demais: 6 testes automáticos, 6
   vitórias. Precisa de passe de ajuste.
2. **Campanha como dados**: cenas, gatilhos, diálogo, testes de perícia, loot.
3. **Multiplayer**: um Durable Object por grupo, servidor autoritativo. Como o
   motor já é puro e por turnos, é o degrau mais fácil de netcode que existe —
   e as rolagens acontecendo no servidor eliminam trapaça por construção.
4. Criação de personagem, evolução de nível, descanso.
5. Mais ângulos de sprite e um passe de paleta no cenário.

---

Código sob licença MIT (veja [LICENSE](LICENSE)). Conteúdo de regras e de
cenário sob os termos descritos em [NOTICE.md](NOTICE.md).
