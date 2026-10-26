# -*- coding: utf-8 -*-
"""
Gera objetos de cenario de uma direcao no PixelLab e mede cada candidato.

ISTO GASTA GERACOES (10 a 25 por chamada). Sem `--go` so imprime o plano.

POR QUE `/create-1-direction-object` PARA ARVORE, ARBUSTO E PEDRA.
Os tres sao quase simetricos: girar a camera nao pede direcoes novas. E uma
chamada so rende a familia inteira -- 16 candidatos a 84 px -- no mesmo
estilo, que foi a licao do chao: variacoes pedidas juntas saem do mesmo
"pintor". `item_descriptions` controla a silhueta de cada candidato.

Nao se misturam os tres numa chamada: cada candidato preenche a tela inteira,
e o arbusto sairia do tamanho da arvore.

A ESPECIFICACAO veio do revisor de cenario (`.claude/agents/revisor-cenario-iso.md`):
tamanho, ancora, paleta e o aceite medido abaixo.

O ACEITE, rodado em todo candidato:
  1. zero pixel com alfa parcial (borda meio transparente vira halo);
  2. perimetro / raiz(area) <= 24 -- arte nativa da ~20; arte reduzida de
     ilustracao deu 34 neste projeto;
  3. sem chao nem sombra pintados nas linhas de baixo.
"""
import argparse
import json
import math
import os
import time
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image

BASE = 'https://api.pixellab.ai/v2'
AQUI = Path(__file__).resolve().parents[2]
SAIDA = AQUI / '_referencias' / 'pixellab' / 'objetos'

FOLHA = ['#101a12', '#1a2c1c', '#243f24', '#33572e', '#4a7236', '#6b8f43', '#93ad57']
TRONCO = ['#24170f', '#3d2819', '#5a3d26', '#7a5838']
GRANITO = ['#1e1f22', '#3a3b3e', '#56575a', '#77766f', '#9e998b']

PEDRA_MINA = ['#2a2724', '#4a4640', '#6e665a', '#8f8574']
PIXEL = ('Native pixel art at final size, hard pixels, no anti-aliasing, no gradients, '
         'no semi-transparent pixels, transparent background, no ground, no grass, '
         'no cast shadow. Light from the upper left.')

MADEIRA = ['#22160e', '#3e2a1b', '#5e4029', '#85603d', '#ab8558']
LONA = ['#6b6350', '#968a6c', '#c2b48f']
FERRO = ['#2a2a2e', '#55565c']
BAIO = ['#25170f', '#45291a', '#683d25', '#8c5734']

# Carroca e cavalo sao ASSIMETRICOS: vistos das quatro rotacoes da camera,
# pedem as diagonais. Vao pelo `/create-object-pro-flash`, que custa 6 geracoes
# a primeira imagem e 2 as rotacoes (consultado em /pro-flash/cost) -- 8 no
# total pelas oito direcoes. A sonda de uma direcao so economizaria 2.
#
# Sem `smart` na paleta: a API recusa (422) em objeto de varias direcoes,
# porque as oito vistas tem de usar exatamente as mesmas cores.
PRO_FLASH = {
    'carroca': {
        'description': (
            'Medieval wooden supply wagon, four spoked wheels with iron rims, open bed loaded '
            'with two crates, one barrel and grain sacks under a tied canvas tarp, empty shafts '
            'resting on the ground at the front, no animals. Weathered brown planks. About 40 px '
            'tall above the ground. Dark brown selective outline, not black. ' + PIXEL),
        'view': 'low top-down',
        'image_size': {'width': 128, 'height': 128},
        'n_directions': 8,
        'seed': 20261023,
        'target_palette': {'colors': MADEIRA + LONA + FERRO},
    },
    'cavalo': {
        'description': (
            'Dead horse lying on its side across a dirt road, legs stiff and straight, bay coat, '
            'black mane and tail, saddle with saddlebags, three arrows with black feathers and '
            'pale wooden shafts stuck in the flank and neck, small solid dark blood pool under '
            'the chest. Low and long: body about 16 px tall, arrows reaching at most 28 px. '
            'Dark selective outline, not black. ' + PIXEL),
        'view': 'low top-down',
        'image_size': {'width': 96, 'height': 64},
        'n_directions': 8,
        'seed': 20261024,
        'target_palette': {'colors': BAIO + ['#141012', '#3e2a1b', '#5e4029', '#141418',
                                             '#8a6a44', '#b8996a', '#4a1510', '#6e2418']},
    },
}

# NAO USADO NO JOGO: as duas levas sairam numa perspectiva propria, que nao
# bate com o angulo da grade -- a ponte parecia torta. O tabuleiro desenha a
# ponte casa por casa com as tabuas do atlas do chao (`board.desenharPonte`).
# Fica aqui como registro do que foi tentado.
PRO_FLASH['ponte'] = {
    # A ponte do esconderijo cruza o canal do riacho: um tabuleiro quadrado
    # de 2 x 2 casas, com corrimao nos dois lados compridos. Tem direcao (o
    # corrimao corre num eixo so), por isso vai pelas oito vistas.
    'description': (
        'The bridge FILLS THE WHOLE CANVAS WIDTH, edge to edge: it is a big object, not a small '
        'one in the middle. '
        'Short rickety wooden footbridge for an isometric tactical RPG cave, seen as a square '
        'deck of weathered planks laid crosswise, with a low railing of wooden posts and a '
        'rope along both long sides, two thick log beams underneath at the ends. The deck is '
        'flat and level, about as long as it is wide. No water, no ground, no rocks. Weathered '
        'brown wood, hemp rope. Dark brown selective outline, not black. ' + PIXEL),
    'view': 'low top-down',
    # A primeira leva (128 x 96) saiu com uns 70 px de largura: metade da
    # pegada de 2 x 2 casas, que tem 128 px na tela. Tela maior e o pedido de
    # encher a largura.
    'image_size': {'width': 160, 'height': 128},
    'n_directions': 8,
    'seed': 20261027,
    'target_palette': {'colors': MADEIRA + ['#8a7a55', '#b8a77a']},
}

PRO_FLASH['estalagem'] = {
    # Teste de comparação com a rota Tripo3D + Blender (Estalagem Stonehill,
    # Phandalin). Mesma descrição do modelo 3D.
    'description': (
        'The building FILLS THE WHOLE CANVAS WIDTH. A newly built two-story frontier inn for an '
        'isometric fantasy tactical RPG: ground floor of rough-cut grey fieldstone, upper floor of '
        'rustic timber framing, steep wooden shingle roof, one stone chimney, a small covered porch '
        'with a hanging wooden sign over the door, shuttered windows. Rectangular footprint about '
        '1.3 times longer than wide. No ground, no people. Dark brown selective outline, not black. '
        + PIXEL),
    'view': 'low top-down',
    'image_size': {'width': 224, 'height': 224},
    'n_directions': 8,
    'seed': 20261028,
    'target_palette': {'colors': MADEIRA + GRANITO + ['#6b4a2e', '#8c6a46']},
}

# A RUA DE PHANDALIN: duas casas e a taverna, cada uma com pegada de 3 x 3
# casas (o PixelLab enche ~70% da tela: 256 px dao uns 185 de largura, que e
# a base de 3 casas). Especificacao em
# `_referencias/cenario-rua-mansao/especificacao.md`. Telhado mais escuro que
# a estrada, parede mais clara: senao some tudo no marrom.
PEDRA = ['#3a3b3e', '#56575a', '#77766f', '#9e998b']
REBOCO = ['#a89f86', '#c2b48f', '#d8cdb0']
PRO_FLASH['casa-a'] = {
    'description': (
        'The building FILLS THE WHOLE CANVAS WIDTH, edge to edge. Small frontier cottage for an '
        'isometric tactical RPG, square footprint, one storey: low rough fieldstone walls, cream '
        'plaster upper part, thick thatched roof in straw ochre, one small stone chimney, one plank '
        'door about as tall as a goblin, one shuttered window. Walls up to the eaves about 50 px '
        'tall, ridge no higher than 90 px. Weathered, lived in. No ground, no people. Dark brown '
        'selective outline, not black. ' + PIXEL),
    'view': 'low top-down',
    'image_size': {'width': 256, 'height': 256},
    'n_directions': 8,
    'seed': 20261101,
    'target_palette': {'colors': PEDRA + REBOCO + MADEIRA[:3] + ['#6e5a2c', '#8f7a3e', '#b39d5c']},
}
PRO_FLASH['casa-b'] = {
    'description': (
        'The building FILLS THE WHOLE CANVAS WIDTH, edge to edge. Frontier house for an isometric '
        'tactical RPG, square footprint: timber-framed upper floor over a low fieldstone base, '
        'steep roof of dark weathered wooden shingles (very dark brown-grey, darker than a dirt '
        'road), tall stone chimney, small lean-to porch on one side, two shuttered windows, plank '
        'door. Eaves about 56 px, ridge no higher than 90 px. No ground, no people. Dark brown '
        'selective outline, not black. ' + PIXEL),
    'view': 'low top-down',
    'image_size': {'width': 256, 'height': 256},
    'n_directions': 8,
    'seed': 20261102,
    'target_palette': {'colors': PEDRA + REBOCO + MADEIRA[:3] + ['#2e2a2a', '#463d3c', '#5c504a', '#76665a']},
}
PRO_FLASH['taverna'] = {
    'description': (
        'The building FILLS THE WHOLE CANVAS WIDTH, edge to edge. Rowdy frontier tavern for an '
        'isometric tactical RPG, square footprint, one and a half storeys: stone ground floor, '
        'plaster and dark timber upper floor with two dormer windows glowing warm orange, steep '
        'slate blue-grey roof (cold dark grey-blue, never red), two stone chimneys, wide double '
        'plank door under a small covered porch, and a hanging wooden sign painted with a sleeping '
        'giant lying on his side. Eaves about 72 px, ridge no higher than 120 px. No ground, no '
        'people. Dark brown selective outline, not black. ' + PIXEL),
    'view': 'low top-down',
    'image_size': {'width': 256, 'height': 256},
    'n_directions': 8,
    'seed': 20261103,
    'target_palette': {'colors': PEDRA + REBOCO + MADEIRA[:3] + ['#2c3038', '#434a55', '#5c6470', '#f0a030']},
}

# O Poco da Coruja Velha: a tenda do Mago Vermelho (pegada 2 x 2; tem porta
# de um lado, por isso oito vistas).
PRO_FLASH['tenda'] = {
    'description': (
        'The tent FILLS THE WHOLE CANVAS WIDTH, edge to edge. Colorful striped canvas pavilion tent '
        'of a wealthy traveling wizard for an isometric tactical RPG, square footprint, red and '
        'ochre vertical stripes, peaked roof on a central pole with a small pennant, guy ropes and '
        'wooden stakes, one front flap tied open showing a dark interior. About 60 px tall. No '
        'ground, no people. Dark brown selective outline, not black. ' + PIXEL),
    'view': 'low top-down',
    'image_size': {'width': 128, 'height': 128},
    'n_directions': 8,
    'seed': 20261110,
    'target_palette': {'colors': ['#561010', '#8a1e1e', '#b8402c', '#d4a63c', '#e8c870', '#f2e2b0',
                                  '#3e2a1b', '#5e4029', '#85603d', '#968a6c', '#1a1414']},
}

# O CASTELO DENTEFINO: os moveis de varias casas, com direcao (oito vistas).
# Especificacao em `_referencias/revisao-castelo/objetos-spec.md`.
SANGUE = ['#4a1510', '#6e2418']
OURO = ['#b39d5c', '#d4a63c']
PRO_FLASH['altar'] = {
    'description': (
        'The altar FILLS THE WHOLE CANVAS WIDTH. Carved grey stone altar in a ruined castle shrine '
        'for an isometric tactical RPG: a long rectangular block twice as long as wide, worn relief '
        'carvings of winged figures on the sides, a dirty red-brown bloodstained cloth draped over '
        'the top, a small golden chalice, a knife and a censer standing on one end. About 44 px '
        'tall. No ground. Dark selective outline, not black. ' + PIXEL),
    'view': 'low top-down',
    'image_size': {'width': 128, 'height': 128},
    'n_directions': 8,
    'seed': 20261120,
    'target_palette': {'colors': GRANITO + SANGUE + OURO},
}
# Sonda de projecao (NAO USADA): a vista 'high top-down' deixou o eixo do
# altar entre 9 e 50 graus, pior que a 'low top-down' (19 a 28; a grade e
# 26,6). Fica o registro.
PRO_FLASH['altar2'] = dict(PRO_FLASH['altar'], view='high top-down', seed=20261125, description=(
    'The altar FILLS THE WHOLE CANVAS WIDTH. Standard 2:1 isometric game projection: the long '
    'axis of the altar runs along the isometric grid, about 26 degrees from horizontal in the '
    'diagonal views. ') + PRO_FLASH['altar']['description'].split('WIDTH. ', 1)[1])
PRO_FLASH['banheira'] = {
    'description': (
        'The bathtub FILLS THE WHOLE CANVAS WIDTH. Long rectangular sunken-looking bathtub of a '
        'bugbear king for an isometric tactical RPG castle bedroom: low walls covered in cream and '
        'blue-green glazed ceramic tiles, a dark stone rim, murky still water inside, twice as long '
        'as wide, about 22 px tall. No ground. Dark selective outline, not black. ' + PIXEL),
    'view': 'low top-down',
    'image_size': {'width': 128, 'height': 96},
    'n_directions': 8,
    'seed': 20261121,
    'target_palette': {'colors': GRANITO + ['#17313a', '#35647d', '#c2b48f', '#968a6c']},
}
PRO_FLASH['mesaBanquete'] = {
    'description': (
        'The table FILLS THE WHOLE CANVAS WIDTH, edge to edge. Very long heavy wooden banquet '
        'table, three times longer than wide, with a plank bench along each long side, gnawed '
        'bones, pewter plates, wooden mugs and a tipped-over jug on top, for an isometric tactical '
        'RPG goblin feast hall. About 36 px tall. No ground, no people. Dark brown selective '
        'outline, not black. ' + PIXEL),
    'view': 'low top-down',
    'image_size': {'width': 160, 'height': 128},
    'n_directions': 8,
    'seed': 20261122,
    'target_palette': {'colors': MADEIRA + LONA + FERRO},
}
PRO_FLASH['camaRei'] = {
    'description': (
        'The bed FILLS THE WHOLE CANVAS WIDTH, edge to edge. Huge crude bed of a bugbear king for '
        'an isometric tactical RPG: a wide low wooden frame on a square footprint piled with thick '
        'brown and grey animal furs, a tall roughly carved wooden headboard on one side, about '
        '24 px tall, headboard up to 36 px. No ground, no people. Dark brown selective outline, '
        'not black. ' + PIXEL),
    'view': 'low top-down',
    'image_size': {'width': 128, 'height': 128},
    'n_directions': 8,
    'seed': 20261123,
    'target_palette': {'colors': MADEIRA + BAIO + ['#6e6c66', '#8f8a7f', '#b39d5c']},
}
PRO_FLASH['portaoQuebrado'] = {
    'description': (
        'The gate FILLS THE WHOLE CANVAS WIDTH. One broken leaf of a heavy wooden castle gate '
        'lying fallen on the floor for an isometric tactical RPG: thick vertical planks bound '
        'with green-tarnished bronze straps and big rivets, splintered holes, a missing corner, '
        'twice as long as wide, flat on the ground, about 16 px tall. No ground, no wall. Dark '
        'brown selective outline, not black. ' + PIXEL),
    'view': 'low top-down',
    'image_size': {'width': 128, 'height': 96},
    'n_directions': 8,
    'seed': 20261124,
    'target_palette': {'colors': MADEIRA + ['#2f4a3a', '#4e7a5e', '#7aa287']},
}

# UMA VISTA SO. Desde que a camera ficou fixa, objeto de cenario nao precisa
# das oito vistas: so a que o `olha` dele pede. Aqui `n_directions: 1` devolve
# a vista frontal ('south'), que o montador guarda sob o nome que o tabuleiro
# procura. Mede-se a altura em px na descricao porque a escala e o defeito
# que mais aparece: uma criatura Media tem 45 a 62 px nesta grade.
PRO_FLASH['banheira2'] = {
    'description': (
        'The bathtub FILLS THE WHOLE CANVAS WIDTH, edge to edge, lying along the view diagonal '
        'that descends to the right. Long rectangular sunken bathtub of a bugbear king for an '
        'isometric tactical RPG castle bedroom: low walls of cream and blue-green glazed ceramic '
        'tiles with a dark stone rim, murky still water inside, twice as long as wide, only 22 px '
        'tall. No ground. Dark selective outline, not black. ' + PIXEL),
    'view': 'low top-down',
    'image_size': {'width': 96, 'height': 64},
    'n_directions': 1,
    'seed': 20261140,
    'target_palette': {'colors': GRANITO + ['#17313a', '#35647d', '#c2b48f', '#968a6c']},
}
PRO_FLASH['mesaBanquete2'] = {
    'description': (
        'The table FILLS THE WHOLE CANVAS WIDTH, edge to edge, lying along the view diagonal that '
        'descends to the right. Very long heavy wooden banquet table, three times longer than '
        'wide, with a plank bench along each long side, gnawed bones, pewter plates and a tipped '
        'jug on top, for an isometric tactical RPG goblin feast hall. About 34 px tall. No ground, '
        'no people. Dark brown selective outline, not black. ' + PIXEL),
    'view': 'low top-down',
    'image_size': {'width': 128, 'height': 64},
    'n_directions': 1,
    'seed': 20261141,
    'target_palette': {'colors': MADEIRA + LONA + FERRO},
}

CONJUNTOS = {
    'arvore': {
        'description': (
            'Single deciduous oak tree for an isometric tactical RPG forest edge. '
            'Lumpy round canopy of 4-6 leaf clusters filling about 90% of the canvas width, '
            'canopy top touching the top edge, short thick trunk under the canopy, trunk base '
            'centered 4 px above the bottom edge. Lit clusters top-left, deep shadow lower '
            'right. Dark green selective 1-pixel outline, not black. ' + PIXEL),
        'size': 84,
        'view': 'top-down',
        'item_descriptions': [
            'oak, symmetric canopy, trunk visible 12 px',
            'oak, canopy leaning slightly left',
            'oak, canopy leaning slightly right',
            'oak, canopy with three big lobes on top',
            'oak, wide flat-topped canopy, trunk visible 10 px',
            'oak, canopy with one small gap showing a branch',
            'oak seen in a dense forest, canopy reaching the bottom, no trunk visible',
            'oak seen in a dense forest, two-lobed canopy reaching the bottom, no trunk visible',
        ],
        'target_palette': {'colors': FOLHA + TRONCO},
    },
    # ARVORE ALTA. A primeira leva saiu com 63-78 px de altura, contra 40-46
    # dos personagens: razao de 1,4 a 1,9, que le como arbusto grande. Em
    # jogo tatico isometrico a arvore fica com 3,5 a 4 vezes o personagem. A
    # 168 px a rota rende 4 candidatos por chamada; duas chamadas com
    # silhuetas diferentes dao a variedade.
    'arvore-alta': {
        'description': (
            'Single tall mature deciduous oak tree for an isometric tactical RPG forest, seen '
            'from a low three-quarter top-down camera. Large rounded canopy of many leaf clusters '
            'filling about 90% of the canvas width and the top two thirds of the canvas, thick '
            'trunk and some visible roots in the lower third, trunk base centered 4 px above the '
            'bottom edge. Lit clusters top-left, deep shadow lower right. Dark green selective '
            '1-pixel outline, not black. ' + PIXEL),
        'size': 168,
        'view': 'top-down',
        'item_descriptions': [
            'tall oak, broad round canopy, straight trunk',
            'tall oak, canopy leaning slightly left, trunk with a fork',
            'tall oak, tall oval canopy, slender trunk',
            'tall oak, wide uneven canopy with three big lobes',
        ],
        'target_palette': {'colors': FOLHA + TRONCO},
    },
    'arvore-alta-2': {
        'description': (
            'Single tall mature deciduous oak tree for an isometric tactical RPG forest, seen '
            'from a low three-quarter top-down camera. Large canopy filling about 90% of the '
            'canvas width and the top two thirds, thick trunk in the lower third, trunk base '
            'centered 4 px above the bottom edge. Lit clusters top-left, deep shadow lower right. '
            'Dark green selective 1-pixel outline, not black. ' + PIXEL),
        'size': 168,
        'view': 'top-down',
        'item_descriptions': [
            'tall oak, canopy leaning slightly right, gnarled trunk',
            'tall oak, very dense dark canopy, short thick trunk',
            'tall oak, canopy with a gap showing a branch',
            'tall oak, two-lobed canopy, twin trunk',
        ],
        'target_palette': {'colors': FOLHA + TRONCO},
    },
    # Arbusto e pedra herdam o estilo da ARVORE ESCOLHIDA: a imagem de estilo
    # e a copa dela sobre dois losangos de grama do chao. Com `style_images`
    # a rota nao aceita `size` -- o tamanho sai da imagem de estilo (56 e 40).
    'arbusto': {
        'description': (
            'Low dense shrub thicket for an isometric tactical RPG, same leaves as the reference '
            'tree. About 52 px wide and 32 px tall, sitting on the bottom of the canvas, 3-4 '
            'rounded leaf clumps with a few dark gaps, no flowers. Dark green selective outline, '
            'not black. ' + PIXEL),
        'view': 'top-down',
        'estilo': ['arbusto-estilo.png'],
        'item_descriptions': ['shrub, three clumps, lower on the right',
                              'shrub, four round clumps', 'shrub, long and low, two clumps'],
        'target_palette': {'colors': FOLHA},
    },
    'pedra': {
        'description': (
            'Weathered grey granite boulder for an isometric tactical RPG. About 36 px wide and '
            '26 px tall, sitting on the bottom of the canvas, irregular rounded shape with one '
            'flat facet on top, a little green moss on the top-left, two small cracks. Dark '
            'selective outline, not black. ' + PIXEL),
        'view': 'top-down',
        'estilo': ['pedra-estilo.png'],
        'item_descriptions': ['single round boulder', 'boulder with a split crack',
                              'flat wide boulder', 'two stacked stones'],
        'target_palette': {'colors': GRANITO + FOLHA[2:5]},
    },
    # O ESCONDERIJO DOS GOBLINS (capitulo 2). Uma casa cada, quase simetricos:
    # uma direcao basta. A estalagmite e cobertura -- precisa subir acima da
    # cintura de um goblin (~40 px) sem virar coluna --; os mantimentos sao o
    # saque das carrocas; o espinheiro e terreno dificil, nao cobertura: baixo
    # e ralo, para nao ler como moita.
    'estalagmite': {
        'description': (
            'Single cave stalagmite for an isometric tactical RPG, rising from the ground: a '
            'tapering cone of wet dark grey limestone, about 22 px wide at the base and 44 px '
            'tall, slightly irregular with two or three ring ridges, base centered at the bottom '
            'of the canvas. Lit from the upper left, deep shadow on the right. Dark selective '
            'outline, not black. ' + PIXEL),
        'size': 64,
        'view': 'top-down',
        'item_descriptions': ['tall slender stalagmite', 'short thick stalagmite',
                              'stalagmite with a small second spike beside it',
                              'stalagmite slightly leaning, broken tip'],
        'target_palette': {'colors': ['#141312', '#24221f', '#38342f', '#4f4942', '#6b635a', '#8a8175']},
    },
    'mantimentos': {
        'description': (
            'Small pile of stolen supplies for an isometric tactical RPG cave: wooden crates, '
            'grain sacks and a small barrel stacked together, about 46 px wide and 34 px tall, '
            'sitting on the bottom of the canvas. Weathered brown wood, pale canvas sacks, dark '
            'iron bands. Lit from the upper left. Dark brown selective outline, not black. '
            + PIXEL),
        'size': 64,
        'view': 'top-down',
        'item_descriptions': ['two crates and a sack', 'a barrel and two sacks',
                              'three stacked crates', 'one crate, one barrel, one sack'],
        'target_palette': {'colors': MADEIRA + LONA + FERRO},
    },
    'espinheiro': {
        'description': (
            'Low tangle of thorny briar brambles for an isometric tactical RPG, wild bramble '
            'canes arching low with sharp thorns and a few small dark leaves, sparse with gaps '
            'showing through, about 52 px wide and only 18 px tall, sitting on the bottom of the '
            'canvas, no flowers, no berries. Dark green and brown. Selective outline, not black. '
            + PIXEL),
        'size': 64,
        'view': 'top-down',
        'item_descriptions': ['briar tangle, wide and flat', 'briar with three arching canes',
                              'sparse briar patch', 'briar tangle, denser on the left'],
        'target_palette': {'colors': FOLHA[:5] + TRONCO[:3]},
    },
    # As camas do bando: no covil e na caverna do chefe, como no mapa da
    # aventura. Chatas no chao -- passa-se por cima --, entao baixas: so
    # pele e palha, nada que suba acima de 10 px.
    'leito': {
        'description': (
            'Goblin bedroll on a cave floor for an isometric tactical RPG: a ragged animal fur '
            'and a rolled grey wool blanket on a thin layer of straw, lying flat on the ground, '
            'about 44 px wide and only 14 px tall, sitting on the bottom of the canvas. Muted '
            'browns and greys. Lit from the upper left. Dark selective outline, not black. '
            + PIXEL),
        'size': 64,
        'view': 'top-down',
        'item_descriptions': ['fur pelt with a rolled blanket', 'straw pallet with a dirty blanket',
                              'two overlapping furs', 'bedroll with a small leather pillow'],
        'target_palette': {'colors': ['#1d1611', '#3b2a1c', '#5c4430', '#806247', '#a68a63',
                                      '#4a4a4a', '#6e6c66', '#8f8a7f', '#b39d5c']},
    },
    # O posto dos vigias (area 2): ripas de madeira presas entre galhos,
    # formando um biombo baixo atras do qual os goblins se agacham. Uma casa
    # por segmento.
    'tocaia': {
        'description': (
            'Crude goblin lookout screen for an isometric tactical RPG: a short section of rough '
            'wooden slats and sticks lashed together with rope, propped between two forked '
            'branches, with a few leafy twigs woven in as camouflage, about 44 px wide and 30 px '
            'tall, sitting on the bottom of the canvas. Weathered brown wood, green leaves. Lit '
            'from the upper left. Dark brown selective outline, not black. ' + PIXEL),
        'size': 64,
        'view': 'top-down',
        'item_descriptions': ['slat screen, straight', 'slat screen, slightly leaning',
                              'slat screen with leafy branches', 'slat screen, one slat broken'],
        'target_palette': {'colors': MADEIRA + FOLHA[1:6]},
    },
    # A fogueira de Klarg: a unica luz do esconderijo.
    'fogueira': {
        'description': (
            'Small campfire for an isometric tactical RPG cave: a ring of dark stones around '
            'burning logs and glowing embers, short orange and yellow flames, about 34 px wide '
            'and 30 px tall, sitting on the bottom of the canvas. Dark selective outline, not '
            'black. ' + PIXEL),
        'size': 64,
        'view': 'top-down',
        'item_descriptions': ['campfire, flames medium', 'campfire, low flames and big embers',
                              'campfire with a spit over it', 'campfire, stones uneven'],
        'target_palette': {'colors': ['#141312', '#38342f', '#5c554d', '#3e2a1b', '#5e4029',
                                      '#8c2a12', '#d0581c', '#f0a030', '#ffe080']},
    },
    # O porao da mansao: mesa e sarcofago, de uma casa cada.
    'mesa': {
        'description': (
            'Sturdy square wooden table for an isometric tactical RPG dungeon room, about 48 px '
            'wide and 34 px tall counting the top, thick legs, scarred top, looks the same from '
            'all sides, sitting on the bottom of the canvas. Weathered brown wood. Lit from the '
            'upper left. Dark brown selective outline, not black. ' + PIXEL),
        'size': 64,
        'view': 'top-down',
        'item_descriptions': ['bare table', 'table with two pewter mugs', 'table with a scroll and a candle stub',
                              'table with a loaf and a knife', 'table with scattered coins',
                              'table with a bowl and a spoon', 'table with a rolled map', 'table with an open book'],
        'target_palette': {'colors': MADEIRA + LONA + FERRO},
    },
    'sarcofago': {
        'description': (
            'Stone sarcophagus on a crypt floor for an isometric tactical RPG, low and long, '
            'about 50 px long and 30 px tall, heavy grey stone lid carved with a relief of a '
            'robed figure with folded hands, chipped corners, seen from the front-left, sitting '
            'on the bottom of the canvas. Lit from the upper left. Dark selective outline, not '
            'black. ' + PIXEL),
        'size': 64,
        'view': 'top-down',
        'item_descriptions': ['sarcophagus, carved robed figure on the lid', 'sarcophagus with a cracked lid',
                              'sarcophagus with moss on the corners', 'sarcophagus with a plain lid and runes'],
        'target_palette': {'colors': GRANITO + ['#4a7236', '#33572e']},
    },
    # O poco velho do patio do Poco da Coruja Velha.
    'pocoVelho': {
        'description': (
            'Old round stone well for an isometric tactical RPG ruin, low weathered stone ring wall '
            'about 40 px wide and 22 px tall, a simple wooden crossbeam frame with a rope and a new '
            'wooden bucket, dark water deep inside, looks the same from all sides, sitting on the '
            'bottom of the canvas. Lit from the upper left. Dark selective outline, not black. ' + PIXEL),
        'size': 64,
        'view': 'top-down',
        'item_descriptions': ['old stone well with a wooden frame and bucket', 'old stone well, a few stones missing',
                              'old stone well with moss at the base', 'old stone well, bucket resting on the rim'],
        'target_palette': {'colors': GRANITO + MADEIRA[:4] + ['#17313a', '#4a7236']},
    },
    # O TAMANHO VEM DA TELA, NAO DA DESCRICAO. Medido: pedir "about 40 px
    # wide" numa tela de 64 devolve 60 px do mesmo jeito -- o objeto enche a
    # tela que se pede. Entao bau, braseiro e companhia saem numa tela do
    # tamanho que eles tem de ter no tabuleiro (a casa tem 64 de largura).
    'bau3': {
        'description': (
            'Sturdy wooden treasure chest for an isometric tactical RPG, closed lid, dark iron '
            'bands and a heavy lock, seen from the front-left, sitting on the bottom of the '
            'canvas. Weathered brown wood. Lit from the upper left. Dark brown selective outline, '
            'not black. ' + PIXEL),
        'size': 44,
        'view': 'top-down',
        'item_descriptions': ['closed chest with iron bands', 'closed chest, rounded lid',
                              'closed chest with a padlock', 'closed chest, worn corners'],
        'target_palette': {'colors': MADEIRA + FERRO + ['#b39d5c']},
    },
    'braseiro3': {
        'description': (
            'Fire brazier for an isometric tactical RPG castle hall, looks the same from all '
            'sides: a shallow round bowl of stone or metal on a low base, glowing coals and short '
            'flames, sitting on the bottom of the canvas. Lit from the upper left. Dark selective '
            'outline, not black. ' + PIXEL),
        'size': 48,
        'view': 'top-down',
        'item_descriptions': ['grey stone bowl on a low base, flames',
                              'grey stone bowl on a low base, cold dark coals, no fire',
                              'green-tinted copper bowl on a low iron tripod, flames',
                              'green-tinted copper bowl on a low iron tripod, embers'],
        'target_palette': {'colors': GRANITO[:4] + ['#5e3a1e', '#8a5a2a', '#3f7a5c',
                                                    '#8c2a12', '#d0581c', '#f0a030', '#ffe080']},
    },
    # Uma tela de 128 devolve QUATRO objetos, nao dezesseis: a quantidade de
    # `item_descriptions` tem de bater, senao a API recusa com 422.
    'arvore3': {
        'description': (
            'Full-grown oak tree for an isometric tactical RPG forest edge, with a visible thick '
            'brown trunk under a broad round canopy of layered green foliage, sitting on the '
            'bottom of the canvas. Lit from the upper left. Dark selective outline, not black. ' + PIXEL),
        'size': 112,
        'view': 'top-down',
        'item_descriptions': ['broad round oak', 'oak leaning slightly, forked trunk',
                              'dense dark oak', 'old gnarled oak with a thinner canopy'],
        'target_palette': {'colors': FOLHA + TRONCO},
    },
    # A palha: a primeira leva desenhou uma LAJE de pedra debaixo do capim, e
    # no tabuleiro aquilo lia como palete, nao como colchao. Aqui se pede so
    # a palha, e escura: o piso do castelo tem luminancia ~68.
    'palha2': {
        'description': (
            'Loose straw sleeping pallet for an isometric tactical RPG goblin lair: ONLY a flat '
            'heap of dull brown-gold straw with a threadbare grey blanket thrown over it, lying '
            'directly on nothing. NO stone slab, NO floor tile, NO base, NO platform under it. '
            'About 44 px wide and only 14 px tall, ankle height. Dull and dirty, not bright '
            'yellow. Lit from the upper left. Dark selective outline, not black. ' + PIXEL),
        'size': 64,
        'view': 'top-down',
        'item_descriptions': ['straw heap with a blanket', 'bare straw heap', 'straw heap, scattered',
                              'straw heap with a small sack'],
        'target_palette': {'colors': ['#2a1f12', '#4c3e1f', '#66572c', '#85733f', '#3b3a36', '#56554f']},
    },
    # DECORACAO DE PAREDE do castelo. Nao fica no chao: fica pendurada na
    # face da parede de borda, que corre na diagonal da grade. Por isso se
    # pede a peca JA na face isometrica, descendo para a direita; o tabuleiro
    # espelha para a outra face. Tela de 32: peca pequena, do tamanho de um
    # braco, que e o que uma tocha tem.
    # ARVORE TROVAO (ver `OBJETOS-ARVORE-TROVAO.md`). Mobilia de casa abandonada
    # de uma vila soterrada pela cinza: tudo velho, empoeirado e quebrado, do
    # tamanho de uma casa do tabuleiro (uns 36 px).
    'moveisRuina': {
        'description': (
            'Single piece of furniture for an isometric tactical RPG, from an abandoned frontier '
            'village house buried in volcanic ash thirty years ago: weathered, dusty, partly '
            'broken, covered in grey ash. About 36 px wide and 32 px tall, sitting on the bottom '
            'of the canvas, seen from the front-left. Lit from the upper left. Dark brown '
            'selective outline, not black. ' + PIXEL),
        'size': 64,
        'view': 'top-down',
        'item_descriptions': [
            'rough wooden bench', 'three-legged stool', 'small cupboard with open doors',
            'narrow bed with a straw mattress', 'cast iron stove with a short pipe',
            'wooden chair with one leg broken', 'empty bent bookshelf', 'washing tub',
            'small wooden cradle', 'wooden wardrobe with doors ajar', 'spinning wheel',
            'hay-filled feeding trough', 'crooked shelf with cracked jars',
            'writing desk with an inkpot', 'water bucket on a stool',
            'pile of rags and broken pottery',
        ],
        'target_palette': {'colors': MADEIRA + LONA + FERRO + ['#4a4640', '#7c776c']},
    },
    # A mobilia que o livro e o mapa pedem por lugar: taverna, tecelagem, escola,
    # moinho, ferraria, mesa posta, cama de viuva, rede de pesca.
    'cenaRuina': {
        'description': (
            'Single large prop for an isometric tactical RPG, from an abandoned frontier village '
            'buried in volcanic ash thirty years ago: old, dusty, broken, covered in grey ash. '
            'About 40 px wide and 36 px tall, sitting on the bottom of the canvas, seen from the '
            'front-left. Lit from the upper left. Dark brown selective outline, not black. ' + PIXEL),
        'size': 64,
        'view': 'top-down',
        'item_descriptions': [
            'big oak brewing vat with iron hoops', 'row of two small beer barrels on a rack',
            'broken weaving loom with tangled thread', 'two-level wooden bunk bed',
            'blacksmith anvil on a tree stump', 'large leather forge bellows',
            'cracked slate blackboard on an easel', 'broken millstone half buried in flour dust',
            'set table with ash-covered plates and cups', 'wide bed with a faded patchwork quilt',
            'axe stuck in a chopping block', 'stiff fishing nets hung on a frame',
            'rotten sack of grain split open', 'stack of broken planks and a ladder',
            'wooden table with a few tools', 'small iron-bound strongbox, lid open and empty',
        ],
        'target_palette': {'colors': MADEIRA + LONA + FERRO + ['#4a4640', '#7c776c', '#8a1e1e']},
    },
    # Decoracao de parede em plano, para as casas arruinadas. Teia de fio opaco.
    'decorRuina': {
        'description': (
            'Wall fixture for an isometric tactical RPG, mounted flat ON a stone wall face that '
            'runs down to the right at 27 degrees, seen from the front-left. The piece lies in the '
            'plane of that wall. No wall behind it, no floor, no shadow on the ground. Old, '
            'weathered, ruined. Lit from the upper left. Dark selective outline, not black. ' + PIXEL),
        'size': 32,
        'view': 'top-down',
        'item_descriptions': [
            'spider web filling a wall corner, thin 1-pixel opaque strands',
            'torn web with dangling strands', 'dense web with a trapped dead fly',
            'small web between two stones', 'green moss creeping up from the bottom',
            'dark moss with wet streaks', 'lichen on stone, pale green circles',
            'ivy vine climbing', 'torn faded tapestry hanging by one corner',
            'crooked empty picture frame', 'dark water stain running down the wall',
            'hole in the plaster showing bare stones', 'bundle of dry hanging herbs',
            'cracked wooden shield on a nail', 'rusty horseshoe on a nail',
            'scorch mark of black soot',
        ],
        'target_palette': {'colors': GRANITO + MADEIRA[:3] + FERRO
                           + ['#33572e', '#4a7236', '#b39d5c', '#8a1e1e', '#cfc6ae', '#2e2b27']},
    },
    # Portas quebradas, no plano da parede, como o `vaoDeParede`.
    'vaoRuina': {
        'description': (
            'Doorway piece for an isometric tactical RPG, seen flat ON a stone wall face that runs '
            'down to the right at 27 degrees. Only the opening and its frame. The piece lies in '
            'the plane of that wall. No wall beyond the frame, no floor, no shadow on the ground. '
            'Tall and narrow, about 30 px wide and 46 px tall. Ruined, old, covered in grey ash. '
            'Lit from the upper left. Dark selective outline, not black. ' + PIXEL),
        'size': 48,
        'view': 'top-down',
        'item_descriptions': [
            'broken wooden door hanging from one hinge, in a cracked stone frame',
            'rotten wooden door fallen halfway inward, in a stone frame',
            'burnt door, charred black planks, in a stone frame',
            'open stone archway with a collapsed corner, rubble at the base',
            'door boarded up with rough planks nailed across, in a stone frame',
            'door ajar by a hand, dark gap, in a worn stone frame',
            'empty stone doorway with a bent iron hinge, no door',
            'door with a thick timber bar across and a cracked lintel',
        ],
        'target_palette': {'colors': GRANITO + MADEIRA + FERRO + ['#4a4640', '#2e2b27', '#4a7236']},
    },
    # Cercas e portoes soltos (o jardim, o pomar, a fazenda).
    'cercaRuina': {
        'description': (
            'Single piece of wooden fencing for an isometric tactical RPG village, old and '
            'broken: about 52 px wide and 34 px tall, sitting on the bottom of the canvas, seen '
            'from the front-left, running along the diagonal of the ground. Weathered grey-brown '
            'wood, grey ash. Lit from the upper left. Dark brown selective outline, not black. '
            + PIXEL),
        'size': 64,
        'view': 'top-down',
        'item_descriptions': [
            'closed wooden farm gate with a crossbar, sagging', 'open wooden farm gate swung wide',
            'broken gate hanging from one hinge', 'section of sharpened stake fence',
            'section of fence with two stakes missing', 'low section of stone and plank fence collapsed',
            'two fence posts with rotten rails fallen', 'wooden gate posts with a rope tied across',
        ],
        'target_palette': {'colors': MADEIRA + FERRO + ['#4a4640', '#7c776c']},
    },
    # ARVORE TROVAO, o que o livro pede e a arte ainda nao tinha (ver `OBJETOS-ARVORE-TROVAO.md`,
    # secao 5): o armazem das aranhas, o altar dos cultistas, as camas de campo do reduto do
    # druida, o tesouro do dragao, o alcapao da guarnicao e a placa do aviso.
    'livroRuina': {
        'description': (
            'Single prop for an isometric tactical RPG, from the ruined village of Thundertree '
            'buried in volcanic ash thirty years ago: old, dusty, grim. About 40 px wide and 36 px '
            'tall, sitting on the bottom of the canvas, seen from the front-left. Lit from the '
            'upper left. Dark brown selective outline, not black. ' + PIXEL),
        'size': 64,
        'view': 'top-down',
        'item_descriptions': [
            'upright spider-silk cocoon wrapped around a dead elf in studded leather, grey web strands',
            'fat spider-silk cocoon lying wrapped around a body, thick grey web',
            'dead giant spider on its back with curled legs, dark brown and black',
            'dead giant spider curled up, legs folded, grey with dust',
            'bedroll with a ragged brown blanket laid flat',
            'bedroll with a pillow and a rolled blanket laid flat',
            'pile of animal furs laid as a bed',
            'small campfire ring of stones with a black iron cooking pot, glowing embers',
            'wooden herb drying rack with bundles of hanging herbs',
            'low stone altar with a huge green dragon scale the size of a plate on top',
            'iron candle stand with melted candles and dripping wax',
            'heap of gold coins, silver goblets and a dagger, a dragon hoard',
            'small scatter of gold coins and one silver goblet',
            'closed wooden trapdoor with an iron ring handle set flat in the floor',
            'open wooden trapdoor leaning back, a dark hole beneath, set flat in the floor',
            'wooden signpost with a board and a painted skull as a warning',
        ],
        'target_palette': {'colors': MADEIRA + LONA + FERRO + GRANITO + [
            '#4a4640', '#cfc6ae', '#2f4a2c', '#33572e', '#4a7236', '#8a1e1e', '#d0a030', '#f0d060',
            '#7c776c', '#2e2b27']},
    },
    # A estatua de Palien na praca (o livro a poe no centro): de madeira, num pedestal baixo.
    'estatuaPalien': {
        'description': (
            'Weathered wooden statue of a warrior holding a spear and a round shield, standing on a '
            'low stone pedestal, for an isometric tactical RPG village square. About 40 px wide and '
            '90 px tall including the pedestal, sitting on the bottom of the canvas, seen from the '
            'front-left. Old grey wood, cracks, ivy on the legs, grey ash. Lit from the upper left. '
            'Dark brown selective outline, not black. ' + PIXEL),
        'size': 128,
        'view': 'top-down',
        'item_descriptions': [
            'upright statue with spear and shield, ivy on the legs',
            'statue leaning slightly, spear broken, moss on the pedestal',
            'statue with a cracked shield and a green patina, weeds at the pedestal',
            'statue with its head tilted, charred on one side, ash on the shoulders',
        ],
        'target_palette': {'colors': MADEIRA + GRANITO + ['#4a4640', '#7c776c', '#33572e', '#4a7236', '#2e2b27']},
    },
    # Janelas e placas, no plano da parede (como a decoracao de parede).
    'janelaRuina': {
        'description': (
            'Wall fixture for an isometric tactical RPG, mounted flat ON a stone wall face that '
            'runs down to the right at 27 degrees, seen from the front-left. The piece lies in the '
            'plane of that wall. No wall behind it, no floor, no shadow on the ground. Old, '
            'weathered, ruined. Lit from the upper left. Dark selective outline, not black. ' + PIXEL),
        'size': 32,
        'view': 'top-down',
        'item_descriptions': [
            'narrow stone window frame with closed wooden shutters',
            'narrow stone window frame with shutters hanging half open',
            'narrow stone window frame with one shutter broken and fallen',
            'narrow stone window frame, empty, dark inside',
            'narrow stone window frame with rotten boards nailed across',
            'narrow stone window frame with a cracked pane of glass',
            'hanging tavern sign with a painted pony and a mug, on an iron bracket',
            'wooden notice board with torn papers',
        ],
        'target_palette': {'colors': GRANITO + MADEIRA + FERRO + ['#4a4640', '#cfc6ae', '#8a1e1e', '#d0a030', '#2e2b27']},
    },
    # ARVORE TROVAO, a vegetacao que faltava (ver `OBJETOS-ARVORE-TROVAO.md`, secao 4): a mata era
    # a mesma meia duzia de copas. Aqui, o que um vulcao deixa: arvore morta, queimada, coberta de
    # cinza, e as que escaparam. Tela de 128: uns 100 px de altura, como as outras.
    'arvoresMortas': {
        'description': (
            'Single tree for an isometric tactical RPG forest in a village buried in volcanic ash '
            'thirty years ago, TALL: about 100 px tall and 80 px wide, two and a half times the '
            'height of a person, with a visible trunk, sitting on the bottom of the canvas. Lit from '
            'the upper left. Dark selective outline, not black. ' + PIXEL),
        'size': 128,
        'view': 'top-down',
        'item_descriptions': [
            'charred dead tree with bare black branches, no leaves',
            'grey ash-covered dead tree with a few brown leaves clinging',
            'old oak with half of its crown burned away, the rest still green',
            'dead leaning oak with ivy climbing the trunk',
        ],
        'target_palette': {'colors': FOLHA + TRONCO + ['#1a1a1a', '#2e2b27', '#4a4640', '#7c776c']},
    },
    'arvoresVivas': {
        'description': (
            'Single tree for an isometric tactical RPG forest, TALL: about 100 px tall and 80 px '
            'wide, two and a half times the height of a person, with a visible trunk, sitting on the '
            'bottom of the canvas. Lit from the upper left. Dark selective outline, not black. '
            + PIXEL),
        'size': 128,
        'view': 'top-down',
        'item_descriptions': [
            'tall dark pine with drooping branches',
            'old twisted oak with a hollow trunk',
            'sparse birch with yellowing leaves',
            'dark dense triangular spruce',
        ],
        'target_palette': {'colors': FOLHA + TRONCO + ['#c2b48f', '#968a6c', '#b39d5c']},
    },
    'arbustosRuina': {
        'description': (
            'Low ground cover for an isometric tactical RPG village buried in volcanic ash: about '
            '44 px wide and 30 px tall, sitting on the bottom of the canvas. Lit from the upper '
            'left. Dark brown or dark green selective outline, not black. ' + PIXEL),
        'size': 64,
        'view': 'top-down',
        'item_descriptions': [
            'dry brown bush with bare twigs', 'ash-grey withered shrub', 'fern clump with arching fronds',
            'tall wild grass tuft, drying', 'nettle and weed clump', 'bush with small white flowers',
            'half-dead green shrub', 'low bramble with red berries',
        ],
        'target_palette': {'colors': FOLHA + TRONCO + ['#4a4640', '#7c776c', '#cfc6ae', '#8a1e1e']},
    },
    # Detalhes de capim: tufos pequenos (uns 16 x 12 px) que o tabuleiro espalha no gramado, por
    # sorteio de casa, sem mudar nenhuma regra do chao.
    'tufosRuina': {
        'description': (
            'Tiny ground detail for an isometric tactical RPG grass field: about 16 px wide and '
            '12 px tall, sitting on the bottom of the canvas. Lit from the upper left. No outline '
            'or a very thin dark green one. ' + PIXEL),
        'size': 32,
        'view': 'top-down',
        'item_descriptions': [
            'tuft of tall grass', 'two small white flowers', 'yellow dandelions', 'small stone cluster',
            'clover patch', 'dry grass tuft', 'mushroom pair', 'fallen twig', 'purple wildflower',
            'thistle', 'pebble with moss', 'short reeds',
        ],
        'target_palette': {'colors': FOLHA + ['#cfc6ae', '#b39d5c', '#6b6350', '#8a1e1e', '#7a4a8a', '#c2b48f']},
    },
    # CAVERNA ONDA ECO (Parte 4): o que a mina dos anoes tem de movel, de entulho, de fungo e de pedra.
    # Tela de 64 = 16 candidatos; tela de 128 = 4. Luz de tocha, de cima a esquerda.
    'minaPecas': {
        'description': (
            'Single prop for an isometric tactical RPG, from an abandoned dwarven silver mine under a '
            'mountain, five hundred years old: stone and iron and rotten wood, covered in dust. About 36 px '
            'wide and 32 px tall, sitting on the bottom of the canvas, seen from the front-left. Lit from the '
            'upper left. Dark selective outline, not black. ' + PIXEL),
        'size': 64,
        'view': 'top-down',
        'item_descriptions': [
            'dwarven stone bunk bed carved from the rock with a rotten straw mat',
            'long stone assayer counter with three iron balance scales',
            'heavy stone dwarven table with a stone bench',
            'iron-bound strongbox with a rusted lock, closed',
            'barricade made of a broken wooden table and planks piled up',
            'wooden mine cart loaded with raw silver ore',
            'empty wooden mine cart on small iron wheels',
            'pile of raw ore chunks and black coal',
            'rack of old pickaxes and shovels',
            'pile of sacks, small barrels and supplies of a mining camp',
            'unlit copper lantern standing on the floor',
            'pile of rusted dwarven plate armor over a dwarf skeleton',
            'pile of rusted crude orc armor over an orc skeleton',
            'heap of scattered bones and a cracked skull',
            'miner bedroll with a small camp pack and a mug',
            'dead bearded dwarf miner lying on his back in leather, boots on',
        ],
        'target_palette': {'colors': PEDRA_MINA + MADEIRA + FERRO + ['#7a4a2a', '#a8683a', '#c9c3b0']},
    },
    'minaCenario': {
        'description': (
            'Single piece of natural cave scenery for an isometric tactical RPG, in an abandoned dwarven '
            'mine under a mountain: pale stone, fungi and rubble. About 40 px wide and 40 px tall, sitting on '
            'the bottom of the canvas, seen from the front-left. Lit from the upper left. Dark selective '
            'outline, not black. ' + PIXEL),
        'size': 64,
        'view': 'top-down',
        'item_descriptions': [
            'giant pale mushroom about five feet tall with a wide cap',
            'cluster of glowing green puffball fungi',
            'single inflated grey-green puffball fungus',
            'tall stalagmite crusted with pale fungus',
            'low mound of orange fungal mat with tiny caps',
            'tall pale limestone stalagmite',
            'pair of short stalagmites growing together',
            'pile of fallen rock rubble',
            'big fallen square stone block',
            'natural rock column from floor to ceiling',
            'dressed dwarven stone pillar with a plain capital',
            'broken dwarven stone pillar, half fallen',
            'coil of thick hemp rope tied to a stalagmite',
            'small heap of glowing mineral crystals in the rock',
            'cluster of tall slender cave mushrooms',
            'cluster of pale shells beside a rock',
        ],
        'target_palette': {'colors': PEDRA_MINA + ['#3d5a2a', '#6f9a3a', '#b8d63c', '#c9c3b0', '#7a4a2a']},
    },
    'minaGrandes': {
        'description': (
            'One large prop for an isometric tactical RPG, from an abandoned dwarven silver mine under a '
            'mountain: carved stone, iron and old wood. About 100 px wide and 100 px tall, sitting on the bottom '
            'of the canvas, seen from the front-left. Lit from the upper left. Dark selective outline, not '
            'black. ' + PIXEL),
        'size': 128,
        'view': 'top-down',
        'item_descriptions': [
            'carved stone statue of a stern bearded dwarf god in a mountain-shaped helm holding a pickaxe, on an octagonal stone base',
            'cold iron smelting furnace with a tall chimney, a heap of coal and mechanical bellows beside it',
            'old wooden water wheel with an iron rim mounted over a stone channel',
            'ornate iron brazier on a stone base burning with bright magical green flame',
        ],
        'target_palette': {'colors': PEDRA_MINA + MADEIRA + FERRO + ['#7a4a2a', '#a8683a', '#3fa34d', '#9be07a']},
    },
    'minaGrandes2': {
        'description': (
            'One large prop for an isometric tactical RPG, from an abandoned dwarven silver mine under a '
            'mountain: carved stone, iron and old wood. About 100 px wide and 90 px tall, sitting on the bottom '
            'of the canvas, seen from the front-left. Lit from the upper left. Dark selective outline, not '
            'black. ' + PIXEL),
        'size': 128,
        'view': 'top-down',
        'item_descriptions': [
            'long dwarven stone altar with carved reliefs and an iron offering bowl',
            'enchanter workbench with an anvil, tools and faintly glowing blue runes',
            'war table with unrolled maps, candles and a carved black spider ornament',
            'large wooden mine hoist frame with a rope and an iron bucket over a dark shaft',
        ],
        'target_palette': {'colors': PEDRA_MINA + MADEIRA + FERRO + ['#7a4a2a', '#a8683a', '#3a5fa0', '#6fa0d8']},
    },
    'paredeDecor': {
        'description': (
            'Wall fixture for an isometric tactical RPG castle, mounted flat ON a stone wall '
            'face that runs down to the right at 27 degrees, seen from the front-left. The piece '
            'lies in the plane of that wall. No wall behind it, no floor, no shadow on the '
            'ground. Grim, old and weathered. Lit from the upper left. Dark selective outline, '
            'not black. ' + PIXEL),
        'size': 32,
        'view': 'top-down',
        'item_descriptions': [
            'iron wall sconce holding a burning torch, orange flame',
            'iron wall sconce holding a spent black torch, no flame',
            'small old oil painting in a cracked gilt frame, dark portrait',
            'ragged red cloth banner hanging from an iron rod',
            'patch of green moss spreading over the stones',
            'grey cobweb stretched across the corner of the wall',
            'rusty iron chain with an open shackle bolted to the wall',
            'animal skull nailed to the wall as a goblin trophy',
        ],
        'target_palette': {'colors': GRANITO + MADEIRA[:3] + FERRO
                           + ['#8c2a12', '#d0581c', '#f0a030', '#ffe080',
                              '#33572e', '#4a7236', '#b39d5c', '#8a1e1e']},
    },
    # PORTAS E ARCOS DA PAREDE DE BORDA. Mesma ideia da decoracao: a peca ja
    # vem desenhada NO PLANO da face isometrica, que desce para a direita, e o
    # tabuleiro espelha para a outra face. O vao tem uns 64 px de altura por
    # 32 de largura na tela, entao a tela de 48 cobre a folha inteira.
    'vaoDeParede': {
        'description': (
            'Doorway piece for an isometric tactical RPG castle, seen flat ON a stone wall face '
            'that runs down to the right at 27 degrees. Only the opening and its frame: the door '
            'leaf, the stone jambs on each side and the stone lintel or arch above. The piece '
            'lies in the plane of that wall. No wall beyond the frame, no floor, no shadow on the '
            'ground. Tall and narrow, about 30 px wide and 46 px tall. Grim, old and weathered. '
            'Lit from the upper left. Dark selective outline, not black. ' + PIXEL),
        'size': 48,
        'view': 'top-down',
        'item_descriptions': [
            'closed heavy wooden door of vertical planks with iron bands and a ring handle, in a plain stone frame',
            'open stone archway with a rounded arch, pitch dark inside',
            'closed iron-bound wooden door, barred shut with a thick timber across it',
            'open stone archway with a heavy ragged curtain hanging across it',
        ],
        'target_palette': {'colors': GRANITO + MADEIRA + FERRO + ['#2f4a3a', '#4e7a5e', '#8a1e1e', '#561010']},
    },
    # O bau do tesouro do bando. A primeira leva saiu com 59 px de largura --
    # do tamanho de um heroi; um bau de verdade tem uns 40 x 34.
    'bau2': {
        'description': (
            'Sturdy wooden treasure chest for an isometric tactical RPG, closed lid, dark iron '
            'bands and a heavy lock, SMALL: about 40 px wide and only 34 px tall, a third of the '
            'height of a person, sitting on the bottom of the canvas, seen from the front-left. '
            'Weathered brown wood. Lit from the upper left. Dark brown selective outline, not '
            'black. ' + PIXEL),
        'size': 64,
        'view': 'top-down',
        'item_descriptions': ['closed chest with iron bands', 'closed chest, rounded lid',
                              'closed chest with a padlock', 'closed chest, worn corners'],
        'target_palette': {'colors': MADEIRA + FERRO + ['#b39d5c']},
    },
    # O braseiro: a primeira leva deu pedestais de 60 px, altos demais.
    'braseiro2': {
        'description': (
            'Fire brazier for an isometric tactical RPG castle hall, looks the same from all '
            'sides: a shallow round bowl of stone or metal on a LOW base, glowing coals and short '
            'flames, SMALL: about 34 px wide and 40 px tall counting the flames, reaching a '
            "person's waist, sitting on the bottom of the canvas. Lit from the upper left. Dark "
            'selective outline, not black. ' + PIXEL),
        'size': 64,
        'view': 'top-down',
        'item_descriptions': ['grey stone bowl on a low base, flames',
                              'grey stone bowl on a low base, cold dark coals, no fire',
                              'green-tinted copper bowl on a low iron tripod, flames',
                              'green-tinted copper bowl on a low iron tripod, embers'],
        'target_palette': {'colors': GRANITO[:4] + ['#5e3a1e', '#8a5a2a', '#3f7a5c',
                                                    '#8c2a12', '#d0581c', '#f0a030', '#ffe080']},
    },
    # A arvore da borda da mata saiu com 65 a 80 px: muda, do tamanho de um
    # heroi. Uma arvore adulta tem o dobro.
    'arvore2': {
        'description': (
            'Full-grown oak tree for an isometric tactical RPG forest edge, TALL: about 110 px '
            'tall and 90 px wide, two and a half times the height of a person, with a visible '
            'thick brown trunk under a broad round canopy of layered green foliage, sitting on '
            'the bottom of the canvas. Lit from the upper left. Dark selective outline, not '
            'black. ' + PIXEL),
        'size': 128,
        'view': 'top-down',
        'item_descriptions': ['broad round oak', 'oak leaning slightly', 'oak with a forked trunk',
                              'dense dark oak', 'oak with a thinner canopy', 'tall narrow oak',
                              'oak with two trunks', 'old gnarled oak'],
        'target_palette': {'colors': FOLHA + TRONCO},
    },
    # O bau do tesouro do bando.
    'bau': {
        'description': (
            'Sturdy wooden treasure chest for an isometric tactical RPG, closed lid, dark iron '
            'bands and a heavy lock, about 34 px wide and 28 px tall, sitting on the bottom of '
            'the canvas, seen from the front-left. Weathered brown wood. Lit from the upper left. '
            'Dark brown selective outline, not black. ' + PIXEL),
        'size': 64,
        'view': 'top-down',
        'item_descriptions': ['closed chest with iron bands', 'closed chest, rounded lid',
                              'closed chest with a padlock', 'closed chest, worn corners'],
        'target_palette': {'colors': MADEIRA + FERRO + ['#b39d5c']},
    },
    # O CASTELO DENTEFINO: os moveis de uma casa.
    'braseiro': {
        'description': (
            'Fire brazier for an isometric tactical RPG castle hall, looks the same from all '
            'sides: a round metal or stone bowl full of glowing coals and short orange flames on '
            'a short pedestal or tripod, about 30 px wide and 36 px tall, sitting on the bottom of '
            'the canvas. Lit from the upper left. Dark selective outline, not black. ' + PIXEL),
        'size': 64,
        'view': 'top-down',
        'item_descriptions': ['grey carved stone bowl on a thick pedestal, flames',
                              'grey carved stone bowl on a thick pedestal, cold dark coals, no fire',
                              'green-tinted copper bowl on an iron tripod, tall flames',
                              'green-tinted copper bowl on an iron tripod, low flames and embers'],
        'target_palette': {'colors': GRANITO[:4] + ['#5e3a1e', '#8a5a2a', '#3f7a5c',
                                                    '#8c2a12', '#d0581c', '#f0a030', '#ffe080']},
    },
    'armeiro': {
        'description': (
            'Wooden weapon rack for an isometric tactical RPG castle barracks: two upright posts '
            'with crossbars holding spears, swords and a round shield, about 44 px wide and 46 px '
            'tall, sitting on the bottom of the canvas, seen from the front-left. Weathered brown '
            'wood, grey steel. Lit from the upper left. Dark brown selective outline, not black. ' + PIXEL),
        'size': 64,
        'view': 'top-down',
        'item_descriptions': ['rack full of spears', 'rack with swords and a round shield',
                              'half empty rack with maces', 'rack with greatswords and a feathered staff'],
        'target_palette': {'colors': MADEIRA + FERRO + ['#77766f', '#9e998b']},
    },
    'palha': {
        'description': (
            'Straw sleeping pallet on a stone floor for an isometric tactical RPG goblin lair: a '
            'flat mat of loose golden straw with a threadbare grey blanket, about 44 px wide and '
            'only 14 px tall, sitting on the bottom of the canvas. Lit from the upper left. Dark '
            'selective outline, not black. ' + PIXEL),
        'size': 64,
        'view': 'top-down',
        'item_descriptions': ['straw mat with a blanket', 'bare straw mat', 'two stacked straw mats',
                              'straw mat with a small sack'],
        'target_palette': {'colors': ['#3b2a1c', '#6e5a2c', '#8f7a3e', '#b39d5c', '#6e6c66', '#8f8a7f']},
    },
    'desabamento': {
        'description': (
            'Heap of collapsed castle masonry for an isometric tactical RPG: broken grey cut stone '
            'blocks, shards of wall and dusty gravel piled irregularly, about 50 px wide and 32 px '
            'tall, sitting on the bottom of the canvas. Lit from the upper left. Dark selective '
            'outline, not black. ' + PIXEL),
        'size': 64,
        'view': 'top-down',
        'item_descriptions': ['low flat heap of gravel and shards', 'tall heap of cut stone blocks',
                              'heap with a splintered wooden beam sticking out', 'heap with one big carved block',
                              'heap of small blocks', 'heap of blocks with a broken column piece'],
        'target_palette': {'colors': GRANITO + MADEIRA[:3]},
    },
    # A GRADE DE CELA do esconderijo dos Marcarrubra (as jaulas da familia Dendrar).
    # Hoje o tabuleiro desenha sete barras em codigo (`board.js`, `objeto ===
    # 'grade'`), porque o atlas nao tem o grupo `grade` -- e `SOMBRA_DO_BAIXO` ja
    # o espera. As tres casas de cada cela formam uma FILEIRA no eixo x, que na
    # tela DESCE PARA A DIREITA a 27 graus: a peca vive no plano dessa linha (a
    # mesma geometria do `vaoDeParede`) e leva um poste em cada ponta, para as
    # casas emendarem. 32 px de largura = de meio de aresta a meio de aresta.
    'grade': {
        'description': (
            'Section of iron prison cell bars for an isometric tactical RPG dungeon, seen flat '
            'ON a vertical plane that runs down to the right at 27 degrees, like a short stretch '
            'of fence: a row of thick vertical iron bars set in a heavy horizontal iron rail at '
            'the bottom and another at the top, with a stout vertical iron post at the left end '
            'and at the right end so that several pieces placed in a row join into one long '
            'barred wall. See-through between the bars. About 34 px wide and 40 px tall, a '
            'little taller than a person is wide, sitting on the bottom of the canvas. No wall '
            'behind, no floor, no shadow on the ground. Old, dark and rusty. Lit from the upper '
            'left. Dark selective outline, not black. ' + PIXEL),
        'size': 48,
        'view': 'top-down',
        'item_descriptions': [
            'plain dark iron bars with round tips, top and bottom rail',
            'rusty iron bars with pointed spear tips sticking up above the top rail',
            'iron bars with one horizontal cross bar in the middle, top and bottom rail',
            'thick iron bars on a low rough stone curb at the bottom, top rail',
        ],
        'target_palette': {'colors': GRANITO + FERRO + ['#6a4a30', '#8a5a30']},
    },
}

ESTILOS = AQUI / '_referencias' / 'pixellab' / 'objetos' / 'estilo'


def chamar(token, metodo, caminho, corpo=None, espera=300):
    req = urllib.request.Request(f'{BASE}{caminho}',
                                 data=json.dumps(corpo).encode() if corpo else None,
                                 method=metodo)
    req.add_header('Authorization', f'Bearer {token}')
    if corpo:
        req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, timeout=espera) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        corpo_erro = e.read().decode(errors='replace')[:700]
        if e.code == 423:
            return 423, None
        raise SystemExit(f'HTTP {e.code} em {metodo} {caminho}: {corpo_erro}')


def urls(no, caminho=''):
    if isinstance(no, str) and no.startswith('http'):
        yield caminho, no
    elif isinstance(no, dict):
        for k, v in no.items():
            yield from urls(v, f'{caminho}.{k}' if caminho else str(k))
    elif isinstance(no, list):
        for i, v in enumerate(no):
            yield from urls(v, f'{caminho}[{i}]')


def medir(im):
    """O aceite do revisor de cenario, em numeros."""
    rgba = im.convert('RGBA')
    px = rgba.load()
    w, h = rgba.size
    parcial = acesos = perim = 0
    lums = []
    op = lambda x, y: 0 <= x < w and 0 <= y < h and px[x, y][3] > 0
    for y in range(h):
        for x in range(w):
            a = px[x, y][3]
            if 0 < a < 255:
                parcial += 1
            if a == 0:
                continue
            acesos += 1
            r, g, b, _ = px[x, y]
            lums.append(0.299 * r + 0.587 * g + 0.114 * b)
            perim += sum(1 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)) if not op(x + dx, y + dy))
    bb = rgba.getbbox()
    lums.sort()
    return {
        'caixa': bb, 'larg_alt': (bb[2] - bb[0], bb[3] - bb[1]) if bb else None,
        'alfa_parcial': parcial,
        'borda': round(perim / math.sqrt(acesos), 1) if acesos else None,
        'lum_mediana': round(lums[len(lums) // 2], 1) if lums else None,
        'cores': len({px[x, y][:3] for y in range(h) for x in range(w) if px[x, y][3]}),
    }


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--conjunto', required=True, choices=list(CONJUNTOS) + list(PRO_FLASH))
    p.add_argument('--go', action='store_true')
    p.add_argument('--buscar', metavar='OBJECT_ID')
    a = p.parse_args()
    token = os.environ.get('PIXELLAB_TOKEN')
    if not token:
        raise SystemExit('defina PIXELLAB_TOKEN no ambiente')

    # Sem `seed`: esta rota recusa o campo com 422 ("extra inputs are not
    # permitted"). A reprodutibilidade vem de guardar os candidatos baixados.
    rota = '/create-object-pro-flash' if a.conjunto in PRO_FLASH else '/create-1-direction-object'
    corpo = dict(PRO_FLASH.get(a.conjunto) or CONJUNTOS[a.conjunto])
    if 'estilo' in corpo:
        import base64
        corpo['style_images'] = [
            {'type': 'base64', 'format': 'png',
             'base64': base64.b64encode((ESTILOS / n).read_bytes()).decode()}
            for n in corpo.pop('estilo')]
    _, b = chamar(token, 'GET', '/balance')
    antes = b['subscription']['generations']
    print(f'PLANO: {a.conjunto} | saldo {antes:.0f}')
    if not a.go and not a.buscar:
        print(json.dumps({k: v for k, v in corpo.items() if k != 'description'}, indent=2))
        print('(seco: nada foi gerado. use --go)')
        return

    if a.buscar:
        oid = a.buscar
    else:
        _, r = chamar(token, 'POST', rota, corpo)
        oid = r['object_id']
        print('pedido:', oid, '| quadros:', r.get('n_frames'))

    inicio = time.time()
    while True:
        st, d = chamar(token, 'GET', f'/objects/{oid}')
        # Pronto e quando ha URL e o status ja saiu da fila. Nao se compara o
        # nome exato do status: a documentacao nao o fixa, e esperar por um
        # nome errado faria o script dormir ate o tempo esgotar.
        tem_url = st == 200 and d and any(
            True for _ in urls({k: d.get(k) for k in ('frame_urls', 'storage_urls', 'rotation_urls')}))
        pronto = tem_url and d.get('status') not in ('pending', 'processing', 'queued', 'running')
        if pronto:
            break
        if st == 200 and d and d.get('status') in ('failed', 'error'):
            raise SystemExit(f'falhou: {json.dumps(d)[:400]}')
        if time.time() - inicio > 1800:
            raise SystemExit('tempo esgotado')
        time.sleep(12)

    destino = SAIDA / a.conjunto / oid
    destino.mkdir(parents=True, exist_ok=True)
    (destino / 'meta.json').write_text(json.dumps(d, indent=2), encoding='utf-8')
    vistos = set()
    print(f"\n{'arquivo':28} {'larg x alt':11} {'alfa':>5} {'borda':>6} {'lum':>6} {'cores':>6}")
    for chave, url in urls({k: d.get(k) for k in ('frame_urls', 'storage_urls', 'rotation_urls')}):
        if url in vistos:
            continue
        vistos.add(url)
        nome = chave.replace('.', '_').replace('[', '_').replace(']', '')
        arq = destino / f'{nome}.png'
        # O CDN responde 403 ao User-Agent padrao do Python.
        pedido = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(pedido, timeout=120) as resp:
            arq.write_bytes(resp.read())
        try:
            m = medir(Image.open(arq))
        except Exception as e:  # um arquivo que nao e imagem nao derruba a leva
            print(f'  {arq.name}: nao e imagem ({e})')
            continue
        print(f"{arq.name:28} {str(m['larg_alt']):11} {m['alfa_parcial']:5} "
              f"{m['borda']!s:>6} {m['lum_mediana']!s:>6} {m['cores']:6}")
    _, b = chamar(token, 'GET', '/balance')
    print(f'\nsaldo depois: {b["subscription"]["generations"]:.0f} '
          f'(gastou {antes - b["subscription"]["generations"]:.0f})')
    print('pasta:', destino)


if __name__ == '__main__':
    main()
