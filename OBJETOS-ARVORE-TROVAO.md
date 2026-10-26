# Arte de cenário para as Ruínas de Árvore Trovão — o que gerar no PixelLab

**ATUALIZAÇÃO (26/10/2026): foi gerado e importado.** Gastaram-se ~220 gerações no PixelLab (saldo 3.537 → 3.317): cinco kits de parede em ruína (`trovao*`, só as faces entraram no atlas `ruinas`), pisos (`lajeRuina`, `tabuaRuina`, `trigo`, `cinza`, `lago`), 32 peças de mobília (`moveisRuina`, `cenaRuina`, grupos `prop-*`), 64 peças de decoração de parede (`decorRuina`), 16 vãos quebrados (`vaoRuina`, usados na porta fechada das casas arruinadas) e 16 cercas e portões (`cercaRuina`, geradas e ainda sem uso no mapa). Depois vieram as peças do livro (`livroRuina`: casulo do elfo, aranhas mortas, camas de campo, fogueira com panela, secador de ervas, altar com a escama, candelabro, tesouro do dragão, alçapão, placa de perigo; `estatuaPalien`; `janelaRuina`: janelas e a placa do Cavalo Pardo; `teiaChao`), ~65 gerações. Os 8 pedidos prioritários abaixo (árvores novas, arbustos, tufos) seguem em aberto. O texto original do pedido, abaixo, fica como histórico.

Este arquivo é o pedido, revisado por um diretor de arte de cenário depois de contar o que o mapa realmente desenha. A primeira versão tinha 54 objetos; esta tem 8 pedidos prioritários e uma lista curta de objetos de cena, porque a maior parte da repetição que você viu **não vem de objeto**.

Fonte do conteúdo de cada lugar: *A Mina Perdida de Phandelver*, parte 3, "Ruinas Árvore Trovão" (pp. 30–34), áreas 1 a 13. O texto é nosso: o livro dá os fatos (o que existe, onde, que teste, que tesouro), não as frases.

## 1. Onde está a repetição (contado no mapa de 91 × 68 casas)

| O que se repete | Casas | Variantes que existem | Por quê |
|---|---|---|---|
| **Cinza** do vulcão (`v`) | 223 (antes do corte; hoje ~124) | 3 | usa o chão `mancha`, uma laje com respingo de sangue |
| **Trigo** (`p`) | 98 | 4 | desenhado como colchão de palha sobre laje |
| **Lago** (`w`) | 99 | 2 | dois ladrilhos de riacho, sem margem |
| **Copas** de árvore | 292 desenhos | 6 | a mata inteira é a mesma meia dúzia de sprites; nenhuma árvore morta ou queimada numa vila que um vulcão matou |
| **Arbustos** | 302 | 8 | idem |
| **Decoração de parede** | 45 peças | teia 1, musgo 1 | 60% das peças são teia ou musgo, de um desenho só |
| **Barril / caixote / saco** | 16 | 12 pilhas mistas | os três usam o **mesmo** atlas `mantimentos`; era onde eu apontava no começo, mas são só 16 casas |

Ou seja: os pedidos de **chão e vegetação** valem mais que qualquer objeto avulso.

## 2. Faça antes de gastar um crédito (custo zero)

1. **Separar as 12 pilhas de `mantimentos` em três grupos** — caixote, barril, saco — usando só índices do atlas que já existe. Pelo que se vê na prancha: caixotes {0, 1, 4, 10}, barris {3, 5, 6, 11}, sacos/misto {2, 7, 8, 9} (confirmar no jogo antes de gravar).
2. **Piso sob móvel de dentro de casa:** barril sobre grama e leito/baú sobre "remendo de caverna" dentro de casa de pedra. *Já tratado no tabuleiro*: casa de sala pinta laje.
3. **Usar o que está desenhado e sem uso:** pedra, desabamento, fogueira, braseiro, tocaia, sarcófago e a árvore de borda existem no atlas e o mapa não os põe.
4. **Decoração de parede ociosa:** há 64 candidatos em `_referencias/pixellab/objetos/paredeDecor/` e só 23 foram curados. Servem sem custo: 11 prateleira de poções e 34 ramalhete de ervas (herborista), 14 quadro de avisos, 17 troféu de cervo, 21 relógio, 29 sino, 35 alvo de tiro (guarnição), 44 e 50 chaveiros, 47 caveira com vela, 54 escudo com maça, 52 cogumelos de tronco (segunda variante de musgo), 28 pano rasgado (tecelagem).
5. **Troca de paleta** (já existe `recolorir.py`): `barril_cultista`, `beliche_cultistas`, `cofre_tributo`, bandeiras.

Atenção: troca de paleta **não** faz forma ("caixote quebrado" e "barril quebrado" precisam de pixel novo, ou de uma edição por estados do objeto). E espelhar um prop inverte a luz do alto à esquerda, então só vale para peça de parede.

## 3. As regras do que se pede ao PixelLab

Os números abaixo foram lidos do OpenAPI do PixelLab pelo revisor, nesta sessão; **confirme com uma sonda antes de uma leva grande**.

- Rota de objeto: `POST /create-1-direction-object`, com `view: top-down` (a rota **não aceita "isometric"**: a projeção vem de `view`), `size` 64 (rende 16 candidatos; 32 rende 64; 168 rende 4) e `target_palette.colors` fechada.
- Ladrilho de chão: `POST /create-tiles-pro`, que o projeto já usa em `src/dev/ladrilhos-pro.py` (`tile_type: isometric`, `tile_size: 64`, `outline_mode: segmentation`, descrição numerada "1). … 2). …").
- A câmera é fixa: **toda peça precisa de uma vista só**. Os "Dir 2" da lista antiga caem para 1.
- Medida em pixel, nunca em metro ("3 metros" não vira altura). Heróis medem 40–46 px; um prop 1×1 fica entre 26 e 40 px de largura, e acima de 46 px de altura só se for deliberado.
- Oclusão: até 22 px de altura é decalque de piso (nunca sprite alto: cobriria os pés de quem pisa); 23–46 px é cobertura; acima de 46 px esmaece quando há alguém atrás e ganha entrada na sombra.
- Nunca pedir chão, cenário nem "translúcido": o motor desenha a sombra, e meia-transparência gera pixel parcial.
- Estilo comum a anexar a todo pedido de objeto (as travas das levas anteriores deste projeto):

```
Native pixel art at final size, hard pixels, no anti-aliasing, no gradients,
no semi-transparent pixels, transparent background, no ground, no grass,
no cast shadow. Light from the upper left. Dark brown selective outline, not black.
```

- Paletas (as de `src/dev/objetos-pixellab.py`): madeira `#22160e #3e2a1b #5e4029 #85603d #ab8558`; pedra `#1e1f22 #3a3b3e #56575a #77766f #9e998b`; ferro `#2a2a2e #55565c`; lona `#6b6350 #968a6c #c2b48f`; palha `#4c3e1f #66572c #85733f`; folhagem (limitada ao verde de `#6b8f43`, para não ficar mais viva que o chão) `#101a12 #1a2c1c #243f24 #33572e #4a7236`.

## 4. Os 8 pedidos prioritários (maior ganho contra a repetição)

| # | O quê | Rota | Casas afetadas | Hoje |
|---|---|---|---|---|
| 1 | **Trigo**: 10 ladrilhos de campo maduro | tiles-pro | 98 | 4 colchões sobre laje |
| 2 | **Cinza**: 8 ladrilhos, cinza quente sem vermelho | tiles-pro | ~124 | 3 manchas de sangue |
| 3 | **Lago e margem**: 6 de água, 4 de areia com junco | tiles-pro | 99 | 2 |
| 4 | **Árvores novas**: 8 espécies (morta, queimada, conífera, carvalho torto…) | objeto 168 px | 292 | 6 copas |
| 5 | **Arbustos e mato**: 8 (seco, samambaia, urtiga…) | objeto 64 px | 302 | 8 |
| 6 | **Teia e musgo de parede**: 4 + 4 | objeto 32 px | 27 de 45 peças | 1 + 1 |
| 7 | **Mobília 1×1**: 16 peças distintas numa chamada | objeto 64 px | 14 prédios com 0 ou 1 móvel | — |
| 8 | **Tufos**: 12 detalhes de 12–20 px para o capim | objeto 32 px | 3.450 casas de capim liso | 0 |

O pedido 8 exige código no tabuleiro (sorteio cosmético por coordenada, sem mudar a regra do chão). Os pedidos 1–3 são ladrilhos e pedem uma linha nova no atlas de chão e uma superfície própria (`trigo`), em vez do colchão de palha.

Prompts prontos, com as correções (sem "isometric", sem chão, tamanho em pixel):

**1. Trigo (ladrilho)**
```
1). ripe golden wheat field, dense upright stalks 2). wheat with a few bent stalks
3). wheat with a thin dirt gap 4). trampled wheat, stalks lying flat 5). thin wheat with dry
stubble 6). wheat with a few green weeds 7). dense wheat, taller heads 8). wheat with a small
bare patch 9). old harvested stubble 10). wheat leaning one way. Flat ground tiles, full
diamond covered edge to edge, no outline, seamless.
paleta: #4c3e1f #66572c #85733f #a68a4a #2a3a21 #36492c
```

**2. Cinza (ladrilho)**
```
1). volcanic ash drift on grass, grey-brown powder with grass blades poking through
2). thin ash layer on grass 3). ash with a few small dark pebbles 4). thick smooth ash drift
5). ash with footprints 6). ash with a few charred twigs 7). ash mixed into a dirt road
8). ash with wind ripples. Flat ground tiles, warm grey, no red, no blood, no stone paving,
full diamond, no outline.
paleta: #4a4640 #66625a #7c776c #9a948a #2e2b27 #36492c #2a3a21 #7d5d40
```

**3. Lago e margem (ladrilho)**
```
1). calm dark lake water 2). water with small ripples 3). water with a lily pad 4). deeper dark water
5). water with a reflection streak 6). water with floating dead leaves 7). sandy shore meeting dark
water, sand on the upper-left 8). shore tile with reeds 9). wet sand 10). dry sand.
Flat ground tiles, full diamond, no outline.
paleta: #1b393f #17313a #35647d #4a8099 #c2b48f #968a6c #6b6350 #36492c
```

**4. Árvores novas** — objeto, `size: 168`, uma descrição por candidato:
`charred dead tree, bare black branches` · `grey ash-covered dead tree, few brown leaves` · `tall dark pine, drooping branches` · `old twisted oak with a hollow trunk` · `sparse birch with yellowing leaves` · `oak with half the crown burned away` · `dark dense triangular spruce` · `leaning oak with ivy on the trunk`. Copa ocupa ~90% da largura, base do tronco centrada a 4 px do fundo.

**5. Arbustos** — objeto, `size: 64`, ~44 px de largura por 32 de altura: `dry brown bush, bare twigs` · `ash-grey withered shrub` · `fern clump, arching fronds` · `tall wild grass tuft, drying` · `nettle and weed clump` · `bush with small white flowers` · `half-dead green shrub` · `low bramble with red berries`.

**6. Teia e musgo de parede** — objeto, `size: 32`, ~28 px quadrados, desenhado achatado na face da parede, vista de frente: `spider web filling a wall corner, thin 1-pixel opaque strands` · `torn web with dangling strands` · `dense web with a trapped dead fly` · `small web between two stones` · `green moss creeping up from the bottom` · `dark moss with wet streaks` · `lichen on stone, pale green circles` · `ivy vine climbing`. Fio de teia em 1 px **opaco**.

**7. Mobília** — objeto, `size: 64`, ~36×36 px, "weathered and dusty, abandoned frontier house": `rough wooden bench` · `three-legged stool` · `small cupboard with open doors` · `narrow bed with straw mattress` · `cast iron stove with a short pipe` · `wooden chair, one leg broken` · `empty bookshelf, bent` · `washing tub` · `small cradle` · `wooden wardrobe, doors ajar` · `spinning wheel` · `hay-filled feeding trough` · `crooked shelf with cracked jars` · `writing desk with an inkpot` · `water bucket on a stool` · `pile of rags and broken pottery`.

**8. Tufos** — objeto, `size: 32`, ~16×12 px: `tuft of tall grass` · `two small white flowers` · `yellow dandelions` · `small stone cluster` · `clover patch` · `dry grass tuft` · `mushroom pair` · `fallen twig` · `purple wildflower` · `thistle` · `pebble with moss` · `short reeds`.

## 5. Objetos de cena, depois dos 8 (os que o livro pede)

O que o livro põe em cada lugar e o que o jogador faz. Tudo isto **ainda não está ligado na cena**: veja a seção 6.

| Id | Onde (livro → nosso prédio) | Interação (teste do livro) | Pedido |
|---|---|---|---|
| `bau_mercador` | área 2, cabana ocidental → `casa7` | **Percepção**: baú de moedas sob a lajota, entre raízes (700 pc, 160 pp, 90 po) | objeto 64 px, ~44×34: *small iron-bound wooden chest with a few thin tree roots curling over its lid*, sem chão e sem laje; as raízes e a lajota levantada ficam como decalque de chão |
| `bau_mago` | área 7, torre | tesouro do dragão: 800 pp, 150 po, 4 cálices de prata, 2 pergaminhos, o machado Hew (a ferrugem é falsa) | objeto 64 px, ~48×40: *large open treasure chest, lid thrown back, brimming with gold coins, silver goblets and a rusty dwarven battleaxe across the top*, sem chão |
| `teia_rua` | área 6, rua ao norte do armazém | terreno difícil; Força (Atletismo) CD 10 para passar, preso se falhar; CD 12 para soltar; vulnerável a fogo | **ladrilho**, não sprite: *dirt road tile covered by thick spider web, opaque 1-pixel white-grey strands, sticky knots* (4 variantes), tiles-pro |
| `casulo_elfo` | área 6, armazém → `loja` | busca: poção de cura e bolsa (23 po, 35 pp) no corpo | objeto 64 px, ~30×46: *upright spider-silk cocoon wrapped around a dead elf in studded leather*, sem parede nem chão |
| `estatua_palien` | área 10, praça | **História CD 15** reconhece Palien; **Força CD 20** a derruba | objeto 128 px, ~40×90 incluindo pedestal de 12: *weathered wooden statue of a warrior with spear and round shield on a low stone pedestal, leaning slightly, ivy on the legs*. Hoje é desenhada como estalagmite |
| `alcapao_guarnicao` | área 11 → `guarda` | sobe ao telhado com parapeito | ladrilho de laje com alçapão, 2 estados (fechado, aberto) |
| `janela_persiana` | todas as casas de pé | janela de 60 cm com persiana e vão de 15 cm: **três quartos de cobertura** | peça de parede, `size: 64`, ~30×36: *narrow stone window frame with wooden shutters* — 3 estados (fechada, entreaberta, quebrada) |
| `placas` | entrada da vila (aviso de perigo) e porta da taverna | ler o aviso | uma família de placas (uma de poste, uma pendurada na taverna com um cavalo e uma caneca); texto fora do sprite |

Já existem e **não** se pede: `porta_barrada` e a porta reforçada (as folhas de porta do atlas), `ramos_secos` (o `espinheiro`, 7 variantes), `poco_praca` (o `pocoVelho`), `fogueira`, `leito`, `armeiro`, `mesa`.
Ficam de fora por serem **arquitetura**, não prop (a torre é redonda, de parede alta): escada espiral, vigas, buraco no teto, chaminé. Leem pequenos demais e entram como "tralha" de um sprite só (pilhas de 3 a 5 itens): balança, ferramentas de ferreiro, livros podres, caixa escondida, cacos, armadura enferrujada.

## 6. Conteúdo do livro que a cena ainda não tem

A tabela mostra o que o livro põe em cada lugar e **o que a cena já faz** (✔ ligado, ✖ falta). Ligados: as áreas 1, 2, 3, 5, 8, 9, 11 e 12 (criaturas, tesouros e testes) e a fuga do dragão com metade dos PV. Faltam as áreas 4 (só a conversa), 6, 10 e 13 inteiras, e os detalhes de cada linha marcados com ✖.

| Livro | Lugar | Nosso prédio | O que o livro põe e a cena não tem |
|---|---|---|---|
| 1 | Cabana Ocidental | `casa7` | ✔ 2 ramos secos escondidos (Furtividade contra Percepção passiva; correm ajudar a área 2) |
| 2 | Cabana com Ramos (duas casas coladas) | `fazenda` + `celeiro` | ✔ 6 ramos; ✔ o baú de 700 pc, 160 pp, 90 po (na cabana ocidental, achado por Percepção CD 12) |
| 3 | O Cavalo Pardo (taverna) | `estalagem` | ✔ 4 zumbis das cinzas deitados (Brisa das Cinzas); ✖ tanques de cerveja (arte) |
| 4 | Reduto do Druida | `florestal` | porta reforçada; Reidoth |
| 5 | Fazenda de Ramos | `casa20` | ✔ 8 ramos em duas levas (4 + 4 na rodada seguinte) |
| 6 | Armazém Destruído | `loja` | 2 aranhas, teia, casulo com poção, 23 po e 35 pp |
| 7 | Torre do Dragão + cabana anexa | `torre` + `prefeito` | ✔ o baú (800 pp, 150 po, 4 cálices, Passo Nebuloso, Relâmpago, Hew); ✔ **o dragão foge com metade dos PV (2.000 XP por expulsá-lo, 3.900 por matá-lo)**; ✖ aranhas mortas |
| 8 | Velha Ferraria | `ferraria` | ✔ 2 zumbis das cinzas deitados |
| 9 | Loja do Herborista | `ervas` | ✔ caixa escondida (Percepção CD 15, automática com a missão da Mirna): colar com esmeralda; ✔ devolvê-lo à Mirna em Phandalin vale 200 XP |
| 10 | Praça | a praça | estátua de Palien |
| 11 | Velha Guarnição | `guarda` | ✔ 5 zumbis das cinzas deitados; ✖ alçapão, beliches |
| 12 | Cabana do Tecelão | `tecelagem` | ✔ 6 ramos nos arbustos ao sul (o barulho alerta o culto); ✖ tear quebrado (arte) |
| 13 | Cultistas do Dragão | `casa9` | 6 cultistas com Favric, casa trancada por dentro (Força CD 20 / CD 15), cofre com 3 diamantes e poção de voo |

Escola, moinho, casa10, casa12, casa15, casa19, embaixada e pescaria o livro não descreve: o conteúdo é nosso (ideias: lousa rachada com contas de criança; mó partida com farinha virada pedra de cinza; mesa posta com pratos cobertos de cinza; cama de viúva e um bilhete de despedida; machado cravado no cepo; redes duras de sal).

## 7. Custo

- Dos 8 pedidos: 3 chamadas de ladrilho (custo a conferir no painel antes) e 5 de objeto (10 a 25 gerações cada), em lotes de 16 candidatos por chamada.
- Os ~12 de cena, em 4 a 6 chamadas a mais.
- Nenhuma rota de 8 direções é necessária.
- **Sonda antes da leva**: 1 chamada de 3 objetos baixos e 1 de 2 altos, medindo o ângulo do eixo (a grade é 26,6°) e o aceite de `objetos-pixellab.py` (zero alfa parcial, sem chão pintado). Se a projeção sair torta, usar `/map-objects` com `view: low top-down` e um recorte de chão como fundo.
