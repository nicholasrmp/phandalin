---
name: sprite-phandalin
description: O placar objetivo para julgar um sprite do Phandalin, e as regras que esta sessão descobriu medindo. Use ao desenhar, revisar ou comparar qualquer figura do jogo — goblin, criatura, NPC — e sempre antes de dizer que um sprite "ficou bom". Palavras-chave - sprite, pixel art, goblin, criatura, folha de sprites, silhueta, paleta, pintor, rig, esqueleto, direções, animação, draw.js, pintor.js, esqueleto.js, poses.js.
---

# Julgar um sprite do Phandalin

Este projeto já gastou uma sessão inteira descobrindo que **opinião não decide
sprite**. Três tentativas de arte foram recusadas pelo dono do projeto, e em
nenhuma delas o problema foi detectado antes de desenhar. O que destravou foi
medir contra um exemplo bom.

Use a skill `pixel-art` (instalada ao lado) para o ofício. Esta aqui é o que é
**específico deste jogo**: os números a bater e os erros já cometidos.

## O placar

Medido no goblin de referência do PixelLab, 195x216 px, e no nosso.

| medida | referência | o nosso ficou | o que significa |
|---|---|---|---|
| cores distintas | **13** | 30 | gradiente suave é erro; degrau duro é certo |
| perímetro | **1.916** | 1.108 | silhueta lisa demais, sem detalhe que quebre o contorno |
| perímetro ÷ √área | **12,88** | 8,39 | a mesma coisa, normalizada pelo tamanho |
| proporção larg÷alt | **0,90** | 0,52 | goblin é atarracado; o nosso saiu longilíneo |
| dispersão de altura entre direções | **1,4%** | — | é ISTO que prova "mesma criatura" |

Como medir: `_referencias/pixellab/medir_folha.py`, ou o trecho de contagem de
perímetro na bancada `/rig.html`.

## O TESTE DA SILHUETA é o que decide

Preencha a figura de uma cor só. Se ela não lê como a criatura, **nada do que
for pintado dentro salva**. O goblin da referência passa — corcunda, cimitarra
erguida, juba, escudo. O nosso virou uma caixa de correio.

Faça este teste ANTES de ajustar cor, sombra ou detalhe.

## Erros já cometidos aqui — não repita

**Identidade mede-se por ALTURA, não por massa.** A massa cai legitimamente
40% no perfil, porque a figura é mais estreita. Um limite de massa reprovaria
folhas corretas; já reprovou.

**Mais pixels não é mais qualidade.** A folha foi de 52x80 para 156x240 por
célula e o desenho só ficou maior. Resolução abre espaço; quem preenche é o
pintor.

**Sombreado radial é pillow shading.** O `bolha()` do `pintor.js` sombreia do
centro para fora. A skill `pixel-art` trata isso como marca de amador. Luz vem
de uma direção — alto-esquerda neste jogo.

**Contorno interno não é opcional.** Braço encostado no tronco, mesma cor, sem
linha entre os dois: o braço some. Já acontecia e foi consertado em
`pintor.js:separar()`.

**Eixos precisam da mesma unidade.** O rig tinha x e z em larguras de ombro e y
em alturas de figura. Funcionou até a primeira pose que rolava o corpo, e aí o
dorminhoco ficou de pé.

**Pose de descanso precisa de atitude.** Braços caídos ao lado do corpo lê como
manequim. A referência está em guarda até parada.

## A arquitetura, para saber onde mexer

```
src/art/rig/esqueleto.js   18 juntas em 3D, projeção com profundidade,
                           proporções nomeadas. Direções saem daqui.
src/art/rig/poses.js       as 7 animações como ângulos. Osso de comprimento
                           constante por construção — invariante testada.
src/art/rig/pintor.js      desenha carne sobre os ossos. É a peça fraca.
src/art/draw.js            o pintor antigo, 2.100 linhas, 70 figuras
                           funcionando. Ainda é o que o jogo usa.
/rig.html                  bancada: anima as 8 direções no tempo da folha.
```

Invariantes a não quebrar: osso com comprimento constante em todos os quadros
(erro exatamente 0 hoje), e `linhaDaDirecao` devolvendo o mesmo que a regra
antiga para a lista de três direções (0 divergências em 24 vetores).

## Antes de dizer "ficou bom"

1. Teste da silhueta.
2. Conte as cores. Passou de 16, está errado.
3. Meça o perímetro ÷ √área. Abaixo de 11, a forma é lisa demais.
4. Confira a proporção contra a criatura: goblin é largo e baixo.
5. Olhe nas 8 direções, não só de frente. O perfil é onde quebra.

## O tabuleiro mostra 40 px de altura, não 240

Medido na bancada, no goblin procedural: a figura tem **29x40 px LÓGICOS**
(87x120 físicos) numa célula de 156x240. `drawSprite` divide por `S` antes de
desenhar, então o tabuleiro vê 52x80 e a criatura ocupa 40 px. O S = 3 só
chega inteiro ao **retrato e à ficha**.

O pintor procedural sobrevive a essa divisão porque `px()` emite blocos de
3x3 **alinhados** — tirar 8 de cada 9 pixels devolve o desenho lógico exato.

**Consequência para arte importada:** ela precisa ser reduzida à altura
lógica, quantizada nessa resolução e só então ampliada por 3 com vizinho mais
próximo. Sem isso a divisão do tabuleiro sai salpicada. Prova: reampliar o
quadro reduzido tem de devolver o original pixel a pixel — 0 de 23 quadros
perderam informação depois do conserto.

## Paleta: 16 é para arte DESENHADA nesse orçamento

A skill `pixel-art` põe o teto em 8-16 por personagem. Arte que chega pronta
com seis materiais — pele, aço, madeira, osso, cabelo, contorno — precisa de
dezoito tons no mínimo. Espremer o goblin importado em 16 apagou o aço: a
paleta saiu sem nenhum cinza claro e a cimitarra ficou marrom. Em 24 voltou.

Dois erros de medição que custaram rodadas:
- **Ponderar a quantização por contagem de pixels.** O contorno preto é ~45%
  da figura e dominava o median-cut. Ponderar cada cor DISTINTA por `n**0.25`
  conserta.
- **Redimensionar RGBA com transparente preto.** O filtro mistura (0,0,0) na
  borda e suja o contorno. Preencher o transparente com a cor média antes de
  reduzir, e reduzir o alfa à parte.

## As 70 criaturas estouram o orçamento de cor. Todas.

Medido na `/ficha-sprite.html`, contando cores distintas na folha de cada
look, na resolução lógica:

| criatura | cores |
|---|---|
| specter | **284** |
| mormesk, wraith | 178 |
| agatha | 139 |
| daran, klarg | 134 |
| giantRat, giantBat | 29 |
| **goblin (folha importada)** | **24** |

**70 de 70 passam do teto de 16.** A única figura perto do orçamento é a
importada, justamente porque passou por uma quantização explícita.

A causa é o pintor: rampas interpoladas e alfa parcial geram cor nova a cada
passo. Isso é o "gradiente suave" que a skill `pixel-art` trata como erro — o
degrau duro é que é certo.

Consequência: enquanto cada look inventar as próprias cores, o elenco nunca
vai parecer um jogo só, por melhor que cada figura fique isolada. O conserto
é uma **paleta do projeto** travada em código, com o pintor e o importador
quantizando contra ela em vez de cada um deduzir a sua.
