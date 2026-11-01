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
PALETA_FLORESTA = ['#1b1612', '#2e261d', '#463a2c', '#62523f', '#7e6d55', '#4a4a44', '#6a6a62', '#8e8e82', '#2a2f26', '#3d4536', '#586347', '#8a6a44', '#a8a89a']

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
    # Poltrona de COSTAS (a que olha para a lareira, para longe da camera): 16 candidatos.
    'casaCadeiraCostas': {
        'description': ('Single manor armchair TURNED AWAY from the viewer, facing up-right: we see its tall BACK and one '
                        'side, about 40 px wide, sitting on the bottom of the canvas, seen in isometric 2:1 view, ' + ESTILO + PIXEL),
        'size': 64,
        'view': 'top-down',
        'item_descriptions': [
            'high-backed armchair seen from behind, burgundy velvet back with brass studs, carved dark oak top',
            'wing-back armchair seen from behind, burgundy velvet back, dark oak legs',
            'high-backed armchair seen from behind, plain burgundy velvet back, carved oak frame',
            'wing-back armchair seen from behind, deep red velvet with buttons, brass studs',
        ] * 4,
        'target_palette': {'colors': PALETA},
    },
    # O ABANDONO dos andares de cima: moveis sob lencol, teia, lixo. 16 candidatos de uma casa.
    'casaAbandono': {
        'description': DE_UMA_CASA + 'abandoned, dusty, cobwebs, ' + ESTILO + PIXEL,
        'size': 64,
        'view': 'top-down',
        'item_descriptions': [
            'armchair covered by a dusty white sheet draped to the floor, cobwebs',
            'wall piece in the plane of a wall face running down to the right at 27 degrees, ONE tile wide: tall wardrobe covered by a dusty white sheet, about 60 px tall',
            'small round table covered by a dusty white sheet, cobwebs',
            'two stacked wooden crates covered by a grey dusty sheet',
            'wall piece in the plane of a wall face running down to the right at 27 degrees, ONE tile wide: tall standing mirror covered by a dusty white sheet, about 60 px tall',
            'sofa covered by a dusty white sheet',
            'tailor dress mannequin standing under a dusty white sheet, about 56 px tall',
            'pile of folded old blankets and linen on the floor, dusty',
            'broken wooden chair lying on its side, cobwebs',
            'old open empty trunk with a cobweb across it',
            'stack of old books covered in thick cobwebs',
            'rolled up old carpet standing in a corner, dusty',
            'wall piece in the plane of a wall face running down to the right at 27 degrees, ONE tile wide: chest of drawers covered by a dusty sheet, about 40 px tall',
            'old wooden rocking horse toy, dusty, a cobweb on its head',
            'wall piece in the plane of a wall face running down to the right at 27 degrees, ONE tile wide: tall bookshelf covered by a dusty sheet, about 60 px tall',
            'cast iron floor candlestick with a burnt-out candle, wax drips and cobwebs',
        ],
        'target_palette': {'colors': PALETA},
    },
    # As mesmas pecas de parede VISTAS DE FRENTE E A DIREITA (a parede do OESTE, que desce para a esquerda): sem espelhar, a luz continua vindo
    # do alto a esquerda. 16 candidatos de uma casa.
    'casaPecasLeste': {
        'description': DE_UMA_CASA.replace('front-left', 'front-right') + ESTILO + PIXEL,
        'size': 64,
        'view': 'top-down',
        'item_descriptions': [
            'wall piece in the plane of a wall face running down to the LEFT at 27 degrees, ONE tile wide: manor fireplace of black marble with brass trim, deep arched firebox with a lit orange fire and logs, about 56 px tall',
            'wall piece in the plane of a wall face running down to the LEFT at 27 degrees, ONE tile wide: carved dark oak fireplace surround with a marble mantel, a roaring orange fire, about 56 px tall',
            'wall piece in the plane of a wall face running down to the LEFT at 27 degrees, ONE tile wide: tall dark oak library bookcase packed with red, brown and green leather books, about 62 px tall',
            'wall piece in the plane of a wall face running down to the LEFT at 27 degrees, ONE tile wide: tall dark oak bookcase with brass rail, books and a skull on the top shelf, about 62 px tall',
            'wall piece in the plane of a wall face running down to the LEFT at 27 degrees, ONE tile wide: tall dark oak wardrobe with two carved doors and brass handles, about 62 px tall',
            'wall piece in the plane of a wall face running down to the LEFT at 27 degrees, ONE tile wide: dark oak wardrobe with carved burgundy panels, crown molding, about 62 px tall',
            'wall piece in the plane of a wall face running down to the LEFT at 27 degrees, ONE tile wide: black cast-iron kitchen stove with a stovepipe, a kettle and a red pot on top, about 56 px tall',
            'wall piece in the plane of a wall face running down to the LEFT at 27 degrees, ONE tile wide: tall wardrobe covered by a dusty white sheet, about 60 px tall',
            'wall piece in the plane of a wall face running down to the LEFT at 27 degrees, ONE tile wide: chest of drawers covered by a dusty sheet, about 40 px tall',
            'high-backed manor armchair, burgundy velvet seat and back, carved dark oak arms and legs, facing down-right',
            'armchair covered by a dusty white sheet draped to the floor, cobwebs, facing down-right',
            'dark mahogany writing desk with green leather top, an inkwell, a quill, papers and a brass lamp, the kneehole facing down-right',
            'dark mahogany writing desk with papers and a stack of books, the kneehole facing down-right',
            'old wooden rocking horse toy, dusty, a cobweb on its head, facing down-right',
            'wall piece in the plane of a wall face running down to the LEFT at 27 degrees, ONE tile wide: COLD black marble fireplace with no fire, empty firebox with grey ashes and cobwebs, about 56 px tall',
            'sofa covered by a dusty white sheet, facing down-right',
        ],
        'target_palette': {'colors': PALETA},
    },
    # O que o texto promete e ainda nao existia: harpa, mesa redonda, lobos empalhados, tapete de tigre, barril, casa de bonecas...
    'casaFaltam': {
        'description': DE_UMA_CASA + ESTILO + PIXEL,
        'size': 64,
        'view': 'top-down',
        'item_descriptions': [
            'tall gilded concert harp standing on the floor, carved column, gold strings, facing down-left',
            'round dining table with a white tablecloth to the floor, one candle and a decanter, on a central pedestal',
            'stuffed grey wolf standing on a small wooden base, mouth open, glass eyes, facing down-left',
            'stuffed black wolf standing on a small wooden base, snarling, glass eyes, facing down-left',
            'stuffed white wolf standing on a small wooden base, head turned, glass eyes, facing down-left',
            'tiger skin rug lying FLAT on the floor with the head, striped orange and black, old and moth-eaten',
            'large oak wine barrel on a low wooden stand with a brass tap',
            'dollhouse, a perfect small replica of a gothic manor with many windows, standing on a low wooden table',
            'wooden rocking chair, dusty, cobwebs, facing down-left',
            'porcelain doll in a yellow dress sitting on a small wooden stool, cobwebs',
            'oak keg on a wooden rack with iron hoops',
            'small bedside nightstand with a lit candle, dark oak',
            'small bedside nightstand with an oil lamp, dark oak',
            'plain round wooden stool',
            'wall piece in the plane of a wall face running down to the right at 27 degrees, ONE tile wide: tall full-length standing mirror with a frame carved as ivy leaves and berries that look like eyeballs, about 60 px tall',
            'old bedside nightstand with a burnt out candle and cobwebs',
        ],
        'target_palette': {'colors': PALETA},
    },
    # O lustre da sala de jantar (pende do teto, desenhado alto sobre a mesa) e o VAO da escada do 3o andar (so o corrimao em volta do poco).
    'casaLustre': {
        'description': ('ONE hanging crystal chandelier with a black iron frame and about twelve lit candles, hanging in the air '
                        'with a short iron chain at the top, about 70 px wide and 60 px tall, seen from the front-left in isometric '
                        '2:1 view. No ceiling, no table, no ground. ' + ESTILO + PIXEL),
        'size': 96,
        'view': 'top-down',
        'item_descriptions': [
            'large crystal chandelier with a black iron frame, many lit candles and hanging crystal drops',
            'round black iron chandelier with two tiers of lit candles and crystal drops',
            'ornate brass and crystal chandelier with lit candles',
            'gothic wrought iron chandelier with lit candles and a small chain',
        ],
        'target_palette': {'colors': PALETA},
    },
    'casaVaoEscada': {
        'description': ('A stairwell opening seen from above, TWO floor tiles wide by TWO tiles long (about 128 px wide): a '
                        'half-round dark opening in the floor with NO steps, surrounded by a carved dark oak banister with '
                        'balusters and a black newel post, a rim of red marble, seen from the front-left in isometric 2:1 view, '
                        'about 36 px tall, sitting on the bottom of the canvas. No ground. ' + ESTILO + PIXEL),
        'size': 128,
        'view': 'top-down',
        'item_descriptions': [
            'round dark stairwell opening with a carved oak banister around it and a red marble rim, dusty, cobwebs',
            'half-round stairwell hole with an oak balustrade and a black newel post, dusty',
            'stairwell opening surrounded by an old oak banister with a missing baluster, cobwebs',
            'wide round stairwell opening with a carved dark oak banister, red marble edge',
        ],
        'target_palette': {'colors': PALETA},
    },
    # O que ainda faltava do texto: esqueletos, cadeiras de jantar, roupa de cama, mantos, baú de sapatos, bancada da cozinha.
    'casaMais': {
        'description': DE_UMA_CASA + ESTILO + PIXEL,
        'size': 64,
        'view': 'top-down',
        'item_descriptions': [
            'two tiny child skeletons lying FLAT on the dusty floor in tattered clothes, one hugging a rag doll, low and flat',
            'two small child skeletons lying side by side FLAT on the floor with a toy windmill, tattered clothes, low and flat',
            'adventurer skeleton in leather armor slumped over a heavy iron-footed dark oak chest with a half open lid, three small darts stuck in its ribs',
            'wall piece in the plane of a wall face running down to the right at 27 degrees, ONE tile wide: tall wooden shelf unit with folded linens, blankets and dry soap bars, dusty, about 56 px tall',
            'wall piece in the plane of a wall face running down to the right at 27 degrees, ONE tile wide: tall wooden shelf unit with folded grey blankets and bed sheets, cobwebs, about 56 px tall',
            'dining chair with arms, carved dark oak, burgundy velvet seat, high back, facing down-left',
            'dining chair with arms, carved dark oak with a tall slatted back, burgundy cushion, facing down-left',
            'dining chair with arms, carved dark oak, burgundy velvet seat, high back, facing down-right',
            'dining chair carved dark oak with a tall slatted back, burgundy cushion, facing down-right',
            'small dark oak shoe chest with brass handles, two drawers',
            'dark oak chest with a bloodstained sheet draped over a bundle shaped like a body, cobwebs',
            'standing wooden coat rack with three long black hooded cloaks hanging and a tall black hat on top',
            'wall piece in the plane of a wall face running down to the right at 27 degrees, ONE tile wide: wall hooks with long black hooded cloaks hanging, a tall hat on a shelf, about 56 px tall',
            'wall piece in the plane of a wall face running down to the right at 27 degrees, ONE tile wide: small wooden hatch door set in a stone shaft with a rope and pulley, a dumbwaiter, about 50 px tall',
            'oak water barrel with a brass tap and a bucket beneath it',
            'kitchen work counter in dark oak with a cutting board, a rolling pin, a knife and a loaf of bread on top',
        ],
        'target_palette': {'colors': PALETA},
    },
    # AS PECAS NO TAMANHO CERTO (a medida contra a pegada em `/tmp/calib`: poltrona de 56 px contra o heroi de 50, cama de 114 px contra 96, bau de 53 px):
    # o PixelLab enche a tela que se pede, entao o tamanho vem da TELA. 40 px = 36 candidatos de uma peca baixa (poltrona 36 px, bau 28 px).
    'casaPequenos': {
        'description': ('Single small piece of furniture that fits ONE floor tile, about 30 px wide and 34 px tall, sitting on the '
                        'bottom of the canvas, seen in isometric 2:1 view, ' + ESTILO + PIXEL),
        'size': 40,
        'view': 'top-down',
        'item_descriptions': (
            ['high-backed manor armchair, burgundy velvet seat and back, carved dark oak arms, facing down-left'] * 2
            + ['wing-back manor armchair, burgundy velvet with brass studs, facing down-left'] * 2
            + ['high-backed manor armchair, burgundy velvet, carved dark oak arms, facing down-right'] * 2
            + ['wing-back manor armchair, burgundy velvet with brass studs, facing down-right'] * 2
            + ['manor armchair seen from BEHIND, turned away from the viewer facing up-right, tall burgundy velvet back'] * 4
            + ['dining chair with arms, carved dark oak, burgundy velvet seat, high back, facing down-left'] * 2
            + ['dining chair with arms, carved dark oak with slatted back, burgundy cushion, facing down-left'] * 2
            + ['dining chair with arms, carved dark oak, burgundy velvet seat, high back, facing down-right'] * 2
            + ['dining chair with arms, carved dark oak with slatted back, burgundy cushion, facing down-right'] * 2
            + ['wooden rocking chair, dusty, cobwebs, facing down-left'] * 2
            + ['broken wooden chair lying on its side, cobwebs'] * 2
            + ['armchair covered by a dusty white sheet, facing down-left'] * 2
            + ['armchair covered by a dusty white sheet, facing down-right'] * 2
            + ['small iron-bound dark oak chest with a domed lid and brass lock, closed, only 26 px tall'] * 2
            + ['small dark oak chest with a bloodstained sheet draped over a bundle, cobwebs'] * 1
            + ['small dark wooden baby cradle on rockers, black funeral shroud, cobwebs, only 30 px tall'] * 1
        ),
        'target_palette': {'colors': PALETA},
    },
    'casaCama3': {
        'description': ('ONE narrow bed TWO floor tiles long (about 92 px) and one tile wide, its long side running down to the left at 27 degrees, seen from the front-left in isometric 2:1 view, headboard at the upper end, about 28 px tall (headboard 38 px), sitting on the bottom of the canvas. No ground. ' + ESTILO + PIXEL),
        'size': 96,
        'view': 'top-down',
        'item_descriptions': ['single bed, dark oak frame, tall carved gothic headboard, burgundy quilt, white pillow', 'single bed, dark oak frame with brass knobs, burgundy quilt, white pillow', 'single bed with straw mattress and a grey blanket, plain wooden frame, simple headboard', 'single bed, dark oak frame, dusty grey blanket, cobwebs, simple headboard'],
        'target_palette': {'colors': PALETA},
    },
    'casaMesa3': {
        'description': ('ONE long table TWO floor tiles long (about 92 px) and one tile deep, running down to the right at 27 degrees, seen from the front-left in isometric 2:1 view, about 30 px tall, sitting on the bottom of the canvas. No ground, no chairs. ' + ESTILO + PIXEL),
        'size': 96,
        'view': 'top-down',
        'item_descriptions': ['polished mahogany dining table with white runner, silver candlesticks, plates and goblets', 'mahogany dining table with a burgundy tablecloth, candelabra, plates and wine goblets', 'mahogany dining table with carved legs, white runner, two candelabras and a fruit bowl', 'dark oak dining table set with silver plates, goblets and one candelabrum'],
        'target_palette': {'colors': PALETA},
    },
    'casaTina3': {
        'description': ('ONE clawfoot bathtub TWO floor tiles long (about 92 px) and one tile wide, its long side running down to the right at 27 degrees, taps at the left end, seen from the front-left in isometric 2:1 view, about 24 px tall, sitting on the bottom of the canvas. No ground. ' + ESTILO + PIXEL),
        'size': 96,
        'view': 'top-down',
        'item_descriptions': ['old wooden clawfoot bathtub with brass taps, empty and dusty, cobwebs', 'old iron clawfoot bathtub with brass taps, empty and dusty', 'old wooden bathtub with brass claw feet, empty, cobwebs', 'old enamel clawfoot bathtub with a wooden rim, empty and dusty'],
        'target_palette': {'colors': PALETA},
    },
    'casaCravo3': {
        'description': ('ONE harpsichord TWO floor tiles long (about 92 px) and one tile wide, its long side running down to the left at 27 degrees, the keyboard on the long side facing down-right, with a small bench in front, seen from the front-left in isometric 2:1 view, about 36 px tall, sitting on the bottom of the canvas. No ground. ' + ESTILO + PIXEL),
        'size': 96,
        'view': 'top-down',
        'item_descriptions': ['elegant painted harpsichord with raised lid, ivory keys, dark oak legs and a burgundy bench', 'dark oak harpsichord with gold trim, raised lid, ivory keys, a small bench', 'harpsichord with a burgundy painted lid, ivory keys, carved legs, a cushioned bench', 'black lacquer harpsichord with brass trim, raised lid, a small bench'],
        'target_palette': {'colors': PALETA},
    },
    # A FLORESTA MORTA de fora da casa (Baroviá): arvores secas e pequenos restos, na mesma projecao 2:1.
    'casaArvoreMorta': {
        'description': ('ONE tall dead tree for a cursed dead forest, twisted bare black-brown trunk with gnarled leafless branches, '
                        'about 100 px tall, the foot of the trunk at the bottom centre of the canvas, seen in isometric 2:1 view, '
                        'lit from the upper left. No leaves, no grass, no ground. ' + PIXEL),
        'size': 128,
        'view': 'top-down',
        'item_descriptions': [
            'twisted dead oak with a thick trunk and bare spiky branches, grey bark, hollow knot',
            'tall dead pine, bare, split trunk, a few broken branches, grey and brown',
            'gnarled dead tree with claw-like branches reaching to the sides, cracked dark bark',
            'dead tree leaning to one side, bare crooked branches, a crow sitting on one branch',
        ],
        'target_palette': {'colors': PALETA_FLORESTA},
    },
    'casaMata': {
        'description': ('Single small piece of dead forest that fits ONE floor tile, about 36 px wide, sitting on the bottom of the canvas, '
                        'seen in isometric 2:1 view, grey and brown, lifeless, lit from the upper left. ' + PIXEL),
        'size': 64,
        'view': 'top-down',
        'item_descriptions': [
            'dead thorny bush, bare grey branches', 'dead thorny bush with a few dry brown leaves', 'dry dead shrub, tangled branches',
            'old tree stump with roots, grey, cracked', 'rotten tree stump with moss and a mushroom',
            'fallen dead log lying on the ground, broken branch', 'fallen rotten log with a hollow end',
            'pile of old bones and a skull half buried in grey dirt', 'mossy grey boulder with cracks', 'small pile of grey stones',
            'tuft of dry dead grass and weeds', 'tall dry dead grass clump',
            'rotten wooden signpost with a broken arrow board', 'crumbling mossy tombstone leaning', 'old broken wooden cart wheel leaning on stones',
            'bramble of dead thorny vines with a wilted flower',
        ],
        'target_palette': {'colors': PALETA_FLORESTA},
    },
})

# Variedade que faltava: cama de crianca (uma casa, pequena) e mais arvores mortas.
obj.CONJUNTOS.update({
    'casaCamaInfantil': {
        'description': ('Single small CHILD bed that fits about ONE floor tile, about 38 px wide and 26 px tall, its long side running '
                        'down to the left at 27 degrees, sitting on the bottom of the canvas, seen from the front-left in isometric 2:1 view, ' + ESTILO + PIXEL),
        'size': 64,
        'view': 'top-down',
        'item_descriptions': [
            'small child bed, dark oak frame, faded blue quilt, small pillow, a toy sword leaning on it, dusty',
            'small child bed with a high headboard carved with stars, faded blue quilt, cobwebs',
            'tiny wooden child bed, grey blanket and a teddy bear, dusty, cobwebs',
            'small child bed, dark oak, patched yellow quilt, a rag doll on the pillow, cobwebs',
        ] * 4,
        'target_palette': {'colors': PALETA},
    },
    'casaArvoreMorta2': {
        'description': ('ONE tall dead tree for a cursed dead forest, twisted bare black-brown trunk with gnarled leafless branches, '
                        'about 100 px tall, the foot of the trunk at the bottom centre of the canvas, seen in isometric 2:1 view, '
                        'lit from the upper left. No leaves, no grass, no ground. ' + PIXEL),
        'size': 128,
        'view': 'top-down',
        'item_descriptions': [
            'dead willow with long bare drooping branches, grey bark',
            'burnt dead tree, charred black trunk, broken top, a few spiky branches',
            'tall thin dead birch, white-grey peeling bark, bare twigs',
            'dead tree with a huge twisted root base and a hollow trunk, bare branches',
        ],
        'target_palette': {'colors': PALETA_FLORESTA},
    },
})

if __name__ == '__main__':
    obj.main()
