# -*- coding: utf-8 -*-
"""
A MOBILIA da taverna numa vista so, a da grade (isometrica 2:1, de frente e a esquerda).

ISTO GASTA GERACOES. Sem `--go` so imprime o plano e o saldo.

    python -P src/dev/taverna-objetos-1dir.py --conjunto tavernaPecas
    PIXELLAB_TOKEN=<token> python -P src/dev/taverna-objetos-1dir.py --conjunto tavernaPecas --go

Por que de novo: as oito vistas do `create-object-pro-flash` (`taverna-objetos-pixellab.py`) saem
numa perspectiva propria que nao bate com a grade, e entortar o desenho pronto o amassa. Aqui a
rota e a de UMA direcao (`create-1-direction-object`), a mesma do bau, da mesa e das portas do
resto do jogo, que ja sai na projecao certa. Pecas de parede saem NO PLANO da parede, que corre
para baixo e para a direita a 27 graus (o tabuleiro espelha para a outra parede).

Reaproveita `objetos-pixellab.py` (`chamar`, `medir`, `main`, `PIXEL`) sem altera-lo: so
ACRESCENTA conjuntos ao dicionario dele. Saida em `_referencias/pixellab/objetos/<conjunto>/<id>/`.
Entrar no atlas e `acrescentar-taverna.py`. O token vem SO da variavel de ambiente.
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
MADEIRA = obj.MADEIRA
FERRO = obj.FERRO

# Madeira escura de carvalho, tijolo vermelho, pedra cinza e a luz quente de vela e de fogo.
PALETA = MADEIRA + FERRO + ['#6b3a22', '#8c4a2c', '#a8623a', '#56575a', '#77766f', '#9e998b',
                            '#d0581c', '#f0a030', '#ffe080', '#c8402a', '#7a7a82', '#b8b8c0']

ESTILO = ('for a cozy medieval tavern in an isometric tactical RPG, aged dark oak wood and red brick, '
          'lived-in, warm firelit colours. Lit from the upper left. Dark brown selective outline, '
          'not black. ')

obj.CONJUNTOS.update({
    # Pecas de UMA casa: tela de 64 = 16 candidatos, todos do mesmo pintor.
    'tavernaPecas': {
        'description': ('Single prop that fits ONE floor tile, about 40 px wide, sitting on the bottom '
                        'of the canvas, seen from the front-left in isometric 2:1 view, ' + ESTILO + PIXEL),
        'size': 64,
        'view': 'top-down',
        'item_descriptions': [
            'round wooden tavern table on a thick central leg, scarred top with playing cards and a pewter mug',
            'round wooden tavern table, bare scarred top with a lit candle',
            'round wooden tavern table with two pewter mugs and a loaf of bread',
            'small round three-legged wooden stool, worn seat',
            'small wooden stool with a back-less round seat, slightly taller',
            'large oak ale keg lying on a wooden rack, iron hoops and a brass tap, its long side facing down-right',
            'large oak ale keg lying on a wooden rack, iron hoops and a brass tap, its long side facing down-left',
            'tall wrought iron standing candelabra with five lit candles',
            'bar counter section, one tile long, dark oak planks, running down to the right at 27 degrees, with mugs on top',
            'bar counter section, one tile long, dark oak planks, running down to the right at 27 degrees, with a candle and a bottle on top',
            'bar counter section, one tile long, dark oak planks, running down to the right at 27 degrees, bare top',
            'bar counter end cap, rounded, dark oak planks, running down to the right at 27 degrees, with a tankard',
            'wooden crate with two bottles on top',
            'small round barrel standing upright, iron hoops',
            'iron bound wooden chest, closed',
            'bundle of firewood logs stacked in a low pile',
        ],
        'target_palette': {'colors': PALETA},
    },
    # Pecas de parede: NO PLANO da parede que desce para a direita; tela de 128 = 4 candidatos.
    'tavernaParede': {
        'description': ('Tall furniture piece lying flat IN THE PLANE of a wall face that runs down to the '
                        'right at 27 degrees, seen from the front-left, TWO floor tiles wide (about 64 px) '
                        'and about 90 px tall, sitting on the bottom of the canvas. No wall behind it, no '
                        'floor, no shadow on the ground. ' + ESTILO + PIXEL),
        'size': 128,
        'view': 'top-down',
        'item_descriptions': [
            'wooden wall shelf unit, three shelves full of colourful glass potion bottles, flasks and jars',
            'wooden wall shelf unit, three shelves of pewter mugs, bottles and a small barrel',
            'big stone fireplace with a grey stone arch, chimney breast, roaring orange fire and glowing embers, iron fire dogs',
            'big stone fireplace with a red brick arch, chimney breast, roaring fire, a mantel with candles',
        ],
        'target_palette': {'colors': PALETA},
    },
    # O balcao do bar numa peca so, de quatro casas (cada peca de uma casa deixava vao entre elas).
    'tavernaBalcao': {
        'description': ('ONE long bar counter FOUR floor tiles long (about 150 px) and one tile deep, running '
                        'down to the right at 27 degrees, seen from the front-left in isometric 2:1 view, '
                        'plank front, sturdy top, sitting on the bottom of the canvas. No ground. ' + ESTILO + PIXEL),
        'size': 168,
        'view': 'top-down',
        'item_descriptions': [
            'long dark oak bar counter, one rounded end, with pewter mugs, a bottle and a lit candle on top',
            'long dark oak bar counter with a brass rail on the front, tankards and a ledger on top',
            'long dark oak bar counter with plank front, a small beer tap and mugs on top',
            'long dark oak bar counter with square ends, bottles and a candle on top',
        ],
        'target_palette': {'colors': PALETA},
    },
    # A escada que sobe junto a parede do oeste.
    'tavernaEscada': {
        'description': ('Straight wooden staircase with plank handrail and posts, worn steps and red brick '
                        'side walls, climbing up toward the upper right along a wall, TWO tiles wide by '
                        'THREE tiles long, about 100 px tall, seen from the front-left in isometric 2:1 '
                        'view, sitting on the bottom of the canvas. No ground. ' + ESTILO + PIXEL),
        'size': 128,
        'view': 'top-down',
        'item_descriptions': [
            'wooden staircase, plank handrail on the open side, red brick side wall',
            'wooden staircase, turned balusters on the open side, dark oak',
            'wooden staircase with a small landing at the top, plank handrail',
            'wide shallow wooden staircase, thick newel posts',
        ],
        'target_palette': {'colors': PALETA},
    },
})

if __name__ == '__main__':
    obj.main()
