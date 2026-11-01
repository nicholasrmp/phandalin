# -*- coding: utf-8 -*-
"""
A MOBILIA DA CASA DA MORTE numa vista so, a da grade (isometrica 2:1, de frente e a esquerda): cada peca nasce do tamanho da pegada dela.

ISTO GASTA GERACOES. Sem `--go` so imprime o plano e o saldo.

    python -P src/dev/casa-objetos-1dir.py --conjunto casaPecas
    PIXELLAB_TOKEN=<token> python -P src/dev/casa-objetos-1dir.py --conjunto casaPecas --go

Por que de novo: as oito vistas do `create-object-pro-flash` (`objetos-pixellab.py`, conjuntos `casa*`) saem numa perspectiva propria, que nao
bate com a grade (o tabuleiro e 2:1, a casa mede 64 x 32 px): as pecas ficavam grandes, tortas e sem apoio no chao. A rota de UMA direcao
(`create-1-direction-object`) sai na projecao certa. A vista unica e a de frente e a esquerda (a peca olha para o sudoeste, `+y`, e as de parede
ficam no plano da parede do NORTE, que desce para a direita a 27 graus); a vista para a parede do oeste (`+x`) e o ESPELHO dela, feito no atlas.

O TAMANHO VEM DA PEGADA. Uma casa tem 64 px de largura na tela (a diagonal do losango). Uma peca de `nx` casas ao longo de x e `ny` ao longo de y
ocupa (nx + ny) * 32 px de largura. Peca de UMA casa sai numa tela de 64 (16 candidatos, 40 px de largura); as de duas casas, numa de 128 (4
candidatos); a escadaria (2 x 3 casas, 160 px), numa de 168.
"""
import importlib.util
from pathlib import Path


def carregar(nome_do_arquivo, apelido):
    spec = importlib.util.spec_from_file_location(apelido, Path(__file__).with_name(nome_do_arquivo))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


obj = carregar('objetos-pixellab.py', 'objetos_pixellab')
PIXEL = obj.PIXEL

ESTILO = ('for a gothic manor in an isometric tactical RPG, carved dark oak, burgundy velvet, brass fittings and '
          'black marble, tidy and well kept, warm candlelight. Lit from the upper left. Dark brown selective '
          'outline, not black. ')

PALETA = obj.PALETA_CASA

DE_UMA_CASA = ('Single prop that fits ONE floor tile, about 40 px wide, sitting on the bottom of the canvas, seen '
               'from the front-left in isometric 2:1 view, ')
DE_PAREDE = ('Tall furniture piece lying flat IN THE PLANE of a wall face that runs down to the right at 27 degrees, '
             'ONE floor tile wide (about 40 px) and about 60 px tall, seen from the front-left, sitting on the bottom '
             'of the canvas. No wall behind it, no floor, no shadow on the ground. ')

obj.CONJUNTOS.update({
    # Pecas de UMA casa (16 candidatos, 64 px de tela): as de parede, os assentos e as pequenas.
    'casaPecas': {
        'description': DE_UMA_CASA + ESTILO + PIXEL,
        'size': 64,
        'view': 'top-down',
        'item_descriptions': [
            'high-backed manor armchair, burgundy velvet seat and back, carved dark oak arms and legs, facing down-left',
            'wing-back manor armchair, burgundy velvet with brass studs, dark oak legs, facing down-left',
            'wall piece in the plane of a wall face running down to the right at 27 degrees, ONE tile wide: manor fireplace of black marble with brass trim, deep arched firebox with a lit orange fire and logs, about 56 px tall',
            'wall piece in the plane of a wall face running down to the right at 27 degrees, ONE tile wide: carved dark oak fireplace surround with a marble mantel, a roaring orange fire, about 56 px tall',
            'wall piece in the plane of a wall face running down to the right at 27 degrees, ONE tile wide: tall dark oak library bookcase packed with red, brown and green leather books, about 62 px tall',
            'wall piece in the plane of a wall face running down to the right at 27 degrees, ONE tile wide: tall dark oak bookcase with brass rail, books and a skull on the top shelf, about 62 px tall',
            'wall piece in the plane of a wall face running down to the right at 27 degrees, ONE tile wide: tall dark oak wardrobe with two carved doors and brass handles, about 62 px tall',
            'wall piece in the plane of a wall face running down to the right at 27 degrees, ONE tile wide: dark oak wardrobe with carved burgundy panels, crown molding, about 62 px tall',
            'wall piece in the plane of a wall face running down to the right at 27 degrees, ONE tile wide: black cast-iron kitchen stove with a stovepipe, a kettle and a red pot on top, about 56 px tall',
            'wall piece in the plane of a wall face running down to the right at 27 degrees, ONE tile wide: black iron stove with an oven door and brass handle, stovepipe rising, about 56 px tall',
            'tall standing brass candelabra on a round base, five lit candles',
            'dark mahogany writing desk with green leather top, an inkwell, a quill, papers and a brass lamp, three drawers on its left',
            'dark mahogany writing desk with papers and a stack of books, drawers on the right',
            'full suit of plate armor standing upright on a small dark wooden plinth, wolf-head helm, holding a spear, about 60 px tall',
            'small dark wooden baby cradle on curved rockers, black funeral shroud, cobwebs',
            'heavy iron-bound dark oak chest with a domed lid and brass lock, closed',
        ],
        'target_palette': {'colors': PALETA},
    },
    # Pecas de duas casas ao longo de x (desce para a direita): a mesa. Tela de 128 = 4 candidatos.
    'casaMesa': {
        'description': ('ONE long table TWO floor tiles long (about 96 px) and one tile deep, running down to the right '
                        'at 27 degrees, seen from the front-left in isometric 2:1 view, about 30 px tall, sitting on the '
                        'bottom of the canvas. No ground, no chairs. ' + ESTILO + PIXEL),
        'size': 128,
        'view': 'top-down',
        'item_descriptions': [
            'polished mahogany dining table with white runner, silver candlesticks, plates and goblets',
            'mahogany dining table with a burgundy tablecloth, candelabra, plates and wine goblets',
            'mahogany dining table with carved legs, a white runner, two candelabras and a fruit bowl',
            'dark oak dining table set with silver plates, goblets and one candelabra',
        ],
        'target_palette': {'colors': PALETA},
    },
    # Pecas de duas casas ao longo de y (desce para a esquerda): a cama, a tina e o cravo.
    'casaCamaIso': {
        'description': ('ONE narrow bed TWO floor tiles long (about 96 px) and one tile wide, its long side running down '
                        'to the left at 27 degrees, seen from the front-left in isometric 2:1 view, headboard at the '
                        'upper end, about 28 px tall (headboard 38 px), sitting on the bottom of the canvas. No ground. '
                        + ESTILO + PIXEL),
        'size': 128,
        'view': 'top-down',
        'item_descriptions': [
            'single bed, dark oak frame, tall carved headboard, burgundy quilt and a white pillow',
            'single bed, dark oak frame with brass knobs, burgundy quilt, white pillow',
            'single bed with straw mattress and a grey blanket, plain wooden frame, simple headboard',
            'single bed, dark oak frame, burgundy velvet quilt, two pillows, carved footboard',
        ],
        'target_palette': {'colors': PALETA},
    },
    'casaTinaIso': {
        'description': ('ONE clawfoot bathtub TWO floor tiles long (about 96 px) and one tile wide, its long side running '
                        'down to the left at 27 degrees, seen from the front-left in isometric 2:1 view, about 24 px '
                        'tall, sitting on the bottom of the canvas. No ground. ' + ESTILO + PIXEL),
        'size': 128,
        'view': 'top-down',
        'item_descriptions': [
            'old wooden clawfoot bathtub with brass taps at one end, empty and dusty, cobwebs',
            'old iron clawfoot bathtub with brass taps, empty and dusty',
            'old wooden bathtub with brass claw feet, empty, cobwebs',
            'old enamel clawfoot bathtub with a wooden rim, empty and dusty',
        ],
        'target_palette': {'colors': PALETA},
    },
    'casaCravoIso': {
        'description': ('ONE harpsichord TWO floor tiles long (about 96 px) and one tile wide, its long side running '
                        'down to the left at 27 degrees, the keyboard on the long side facing down-right, with a small '
                        'bench in front, seen from the front-left in isometric 2:1 view, about 36 px tall, sitting on '
                        'the bottom of the canvas. No ground. ' + ESTILO + PIXEL),
        'size': 128,
        'view': 'top-down',
        'item_descriptions': [
            'elegant painted harpsichord with raised lid, ivory keys, dark oak legs and a burgundy bench',
            'dark oak harpsichord with gold trim, raised lid, ivory keys, a small bench',
            'harpsichord with a burgundy painted lid, ivory keys, carved legs, a cushioned bench',
            'black lacquer harpsichord with brass trim, raised lid, a small bench',
        ],
        'target_palette': {'colors': PALETA},
    },
    # A escadaria de marmore vermelho, de 2 x 3 casas (160 px).
    'casaEscadaria': {
        'description': ('Grand curved staircase of RED MARBLE, TWO floor tiles wide by THREE tiles long (about 160 px '
                        'wide), a half circle of wide steps winding around a round well, carved dark oak banister, '
                        'rising toward the back-right, about 60 px tall at the high end, seen from the front-left in '
                        'isometric 2:1 view, sitting on the bottom of the canvas. No ground. ' + ESTILO + PIXEL),
        'size': 168,
        'view': 'top-down',
        'item_descriptions': [
            'red marble curved staircase, black newel post, dark oak banister, the well open on the left',
            'red marble curved staircase with carpet runner, carved oak banister',
            'red marble half-circle staircase with brass banister rail, black marble newel',
            'wide red marble curved staircase, carved dark oak banister with balusters',
        ],
        'target_palette': {'colors': PALETA},
    },
})

if __name__ == '__main__':
    obj.main()
