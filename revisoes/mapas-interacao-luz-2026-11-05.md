# As dezoito cenas: objeto interativo, luz, inimigo e porta

Parecer de 2026-11-05. A pergunta foi: depois de consertar a luz da Mansão, da Onda Eco e do Cume,
**passou alguma coisa nos outros mapas** sobre objeto interagível, iluminação dinâmica, inimigo e porta?

Tudo aqui foi **medido rodando o motor** sobre as dezoito cenas de `conferir-paredes.mjs`, não lido.
Nada foi corrigido neste parecer além do que já está commitado (`2c7e96e`, `5f4bc3e`); o que sobrou de
achado está no fim, com o que custa.

---

## O que cada cena declara

| cena | grade | mobília | portas | trancas | luzes | inimigos |
|---|---|---|---|---|---|---|
| emboscada | 22x17 | 0 | 0 | 0 | 0 | 3 |
| ermo | 22x15 | 0 | 0 | 0 | 0 | 0 |
| ermoNoite | 22x15 | 1 | 0 | 0 | 1 | 0 |
| rua | 22x14 | 0 | 0 | 0 | 0 | 4 |
| esconderijo | 30x20 | 0 | 0 | 0 | 2 | 19 |
| mansao / mansaoTunel | 30x20 | 22 | 11 | 0 | 11 | 24 |
| poco | 18x22 | 0 | 0 | 0 | 0 | 0 |
| cume | 18x24 | 0 | 0 | 0 | 1 | 0 |
| castelo | 39x28 | 0 | 5 | 0 | 13 | 0 |
| arvoreTrovao | 91x68 | 93 | 0 | 0 | 0 | 0 |
| ondaEco | 73x90 | 194 | 17 | 0 | 3 | 0 |
| casaDaMorte 1 a 4 | 12x19 a 8x13 | 61 / 28 / 19 / 26 | 0 / 0 / 0 / 1 | 0 | 0 | 0 / 0 / 3 / 1 |
| casaDaMortePorao 1 e 2 | 26x25 / 20x15 | 14 / 13 | 0 | 0 | 0 | 14 / 1 |

(Poço, Cume, Castelo e Árvore Trovão trazem o bando pela cena e não por `buildFoes`, daí o 0.)

---

## O que está limpo (medido, 0 achados)

**Estrutura.** Nenhum inimigo nasce em casa que o passo não admite; nenhum nasce em cima de outro; toda
luz e todo objeto interativo tem casa vizinha de onde mexer nele (o menu pede 1,5 m); nenhuma tranca
aponta para aresta que não é porta nem fica sem CD. Virou prova permanente em `testes-cenas.mjs`
(*o que o mapa declara se pode usar*), e foi falsificada: pondo um inimigo na rocha, dois na mesma casa,
uma luz cercada e uma tranca torta, ela acusa os quatro.

**A mobília desenhada TEM o que fazer.** Era a suspeita mais forte, e não se confirmou: rodando cada cena
e perguntando à própria cena (`capitulo.interacoes`) casa por casa —

| cena | casas de mobília | com ação da cena |
|---|---|---|
| Onda Eco | 194 | **194** (50 variantes) |
| Árvore Trovão | 93 | **93** (40 variantes) |
| Casa da Morte | — | 264 a 609 ações por andar (`gatilhos-casadamorte.mjs`) |
| Castelo | 0 peças de arte | 147 de 1032 casas de chão |

Toda peça responde pelo menos "Examinar", e as que o livro destaca respondem mais (a estátua de Dumathoin
dá *Reconhecer*, *Examinar os olhos de perto* e *Subir e arrancar um olho*).

**Chama desenhada que ficou fora da regra: nenhuma que importe.** Procurei peça de fogo (fogueira,
braseiro, lareira, tocha, vela, candelabro, fornalha, forja) sem luz correspondente. Três, e as três estão
certas: a `fogueiraPanela` da Árvore Trovão (57,54) está ao sol, em casa que a grade já põe clara; a
`fornalha` da Onda Eco (42,29) é a fornalha **apagada** que o texto da cena descreve; e o `candelabro` da
Mansão (6,2) fica num quarto que a tocha de (6,4) já acende inteiro — dar luz a ele criaria exatamente a
luz inerte que acabamos de tirar do jogo, e o teste novo o acusaria.

**Árvore Trovão em penumbra não é o defeito da Mansão.** São 80 casas de laje em penumbra sem chama
nenhuma, mas por escolha escrita no gerador: *"Ruína é a céu aberto (luz 2), casa de pé fica em penumbra
(luz 1)"*. É uma aldeia à luz do dia; telhado inteiro escurece, e não há fogo aceso para apagar. O
**Castelo** é o mesmo caso, e também documentado: as salas nascem em penumbra porque a fortaleza é ruína
e entra luz pelos buracos do teto, com o salão escuro em breu por escolha explícita. Nos dois, apagar uma
tocha devolve a penumbra em vez do breu — e está certo assim.

---

## Achados

### 1. `mapa.interativos` e `capitulo.aoInteragir`: zero usuários nas dezoito cenas

A ferramenta 9 do editor e o importador do Foundry (os marcadores `.svg` da FA) produzem
`mapa.interativos`; `interacoes.js` sabe consumi-los e chamar `capitulo.aoInteragir`. **Nenhuma cena
declara um só objeto interativo, e nenhum capítulo implementa `aoInteragir`.** Tudo o que o jogador mexe
passa por `capitulo.interacoes`, que é outro caminho.

Não é defeito de jogo — o jogador não perde nada, porque o caminho que funciona cobre tudo. É defeito de
documentação: o `CLAUDE.md` descreve o canal como se ele estivesse em uso, e quem for marcar objeto no
editor vai descobrir que a cena não responde sem escrever `aoInteragir` primeiro.

**Custo:** grátis. Ou se escreve a verdade no `CLAUDE.md` ("a marca do editor fica guardada; para a cena
responder, ela precisa de `aoInteragir`"), ou se liga uma cena ao canal para ele deixar de ser teórico.

### 2. `mapa.trancas` e o menu de porta de `game/portas.js`: zero usuários

`portas.js` tem o menu completo de qualquer porta — abrir, fechar, abrir a fechadura com Destreza e
ferramentas de ladrão, arrombar com Força (CD + 5), usar a chave —, e `mapa.trancas` é o dado que o
alimenta. **Nenhuma cena declara uma tranca**, e as quatro cenas que têm porta (Mansão 11, Onda Eco 17,
Castelo 5, Casa da Morte 4 com 1) declaram todas `portasProprias: true`, que desliga esse menu. Ou seja:
o sistema genérico de porta nunca roda numa partida.

**Custo:** grátis a médio. A porta trancada do depósito de armas da Mansão existe e é tratada pelo
roteiro; passá-la para `mapa.trancas` tiraria código do capítulo e ganharia arrombar e fechadura de
graça. Mas é mexer em cena com 1.700 linhas de roteiro em cima — não é "grátis" de verdade.

### 3. `mapa.decor` é construído e nunca desenhado

`campo.js` monta `field.decor` a partir de `mapa.decor` (13 candeeiros na Mansão, mais os do Castelo e da
Árvore Trovão). **Nada em `src/view` lê `field.decor`.** É resto do tabuleiro isométrico, aposentado em
2026-11-05 quando o jogo passou a ser só a vista de cima.

Tem um lado bom acidental: se os candeeiros fossem desenhados, apagar a tocha de uma sala da Mansão
deixaria a sala no breu **com candeeiros acesos pintados na parede**, que é o defeito que acabamos de
tirar, de volta pela porta do desenho.

**Custo:** grátis para tirar o campo morto; uma tarde para desenhar os candeeiros na vista de cima, e aí
eles têm de consultar `luz.apagada` para não mentir.

### 4. O Cume tem 3 de 347 casas com ação da cena

O baú e as duas casas de saída. A fogueira, a palha onde os orcs dormem, os ossos e a boca da caverna só
recebem os verbos genéricos (Olhar, Procurar, Investigar, e agora Apagar a fogueira). Isso **não** é
regressão da planta nova: o `interacoes` do capítulo sempre teve só o baú e a saída. Mas o battlemap da
FA desenha bem mais do que a cena responde, e o Poço está no mesmo caminho com 27 de 395.

**Custo:** uma sessão de texto por cena, nenhuma geração de arte.

---

## Como reproduzir

```bash
node src/dev/testes-cenas.mjs            # as duas provas novas: estrutura e luz inerte
node --import ./src/dev/cena-node/register.mjs src/dev/conferir-paredes.mjs
node --import ./src/dev/cena-node/register.mjs src/dev/gatilhos-casadamorte.mjs
```
