# -*- coding: utf-8 -*-
"""
Monta o atlas das PAREDES DE BORDA (`src/art/folhas/paredes.png` e `.json`)
a partir de um kit de construcao do PixelLab (`kit-predio.py`).

    python src/dev/montar-paredes.py

POR QUE O KIT, E NAO AS FACES.

Desde que a camera ficou fixa, a parede nao ocupa casa: ela mora na ARESTA
entre duas casas (`core/grid.js`). O PixelLab tem uma rota feita para isso --
`tile_feature: 'building'` --, que devolve CHAO, PAREDES QUE EMENDAM, VAOS DE
PORTA, PILAR e ESCADA no mesmo estilo, ja na projecao do tabuleiro.

Das familias do kit, a que serve e `sides`: medido, as pecas `partition_wall`
saem com tampa nas duas pontas e deixam um vao entre casas vizinhas; as
`sides` correm sem emenda. As `partition` sao de outro modelo (parede no
MEIO da casa, nao na aresta), e ficam de fora.

A ANCORAGEM. Cada peca do kit vem numa lona de 102 x 115 com o losango do
chao em (19, 73). O tabuleiro desenha o losango da casa com o canto esquerdo
em (sx - 32, sy). Entao a peca inteira entra em (sx - 32 - 19, sy - 73): e
disso que sai o `ax`/`ay` de cada recorte deste atlas.

As pecas do kit sao de 2 andares (`building_wall_tiles`), uns 64 px acima do
chao -- cerca de tres niveis de 22 px do motor. Nao se empilha nada: a parede
de borda e uma peca so.
"""
import json
from pathlib import Path

from PIL import Image

AQUI = Path(__file__).resolve().parents[2]
KIT = AQUI / '_referencias' / 'pixellab' / 'kits' / 'castelo' / '3bb40817-30e2-4cf0-820e-4939f86e220a'
SAIDA = AQUI / 'src' / 'art' / 'folhas'
TW, TH = 64, 32
ORIGEM = (19, 73)          # o losango do chao dentro da lona da peca

# O que o tabuleiro pede -> a peca do kit. 'N' e a aresta do norte da casa
# (com a de cima) e 'O' a do oeste (com a da esquerda).
PECAS = {
    'paredeN': ('sides', 'N'),
    'paredeO': ('sides', 'W'),
    'portaN': ('doors', 'Na'),
    'portaO': ('doors', 'Wa'),
    'arcoN': ('doors', 'Nb'),
    'arcoO': ('doors', 'Wb'),
    'pilar': ('pillar', None),
}


def main():
    regras = json.loads((KIT / 'regras.json').read_text(encoding='utf-8'))
    partes = regras['parts']
    recortes = []
    for nome, (familia, lado) in PECAS.items():
        n = partes[familia] if lado is None else partes[familia][lado]
        im = Image.open(KIT / f'tile_{n}.png').convert('RGBA')
        caixa = im.getbbox()
        recortes.append((nome, im.crop(caixa), caixa))

    larg = max(c.width for _, c, _ in recortes) + 2
    atlas = Image.new('RGBA', (larg * len(recortes), max(c.height for _, c, _ in recortes)), (0, 0, 0, 0))
    meta = {'pecas': {}, 'origem': {'x': ORIGEM[0], 'y': ORIGEM[1]}}
    for i, (nome, corte, caixa) in enumerate(recortes):
        atlas.alpha_composite(corte, (i * larg, 0))
        meta['pecas'][nome] = {
            'x': i * larg, 'y': 0, 'w': corte.width, 'h': corte.height,
            # Onde desenhar, a partir do canto esquerdo do losango da casa.
            'ax': caixa[0] - ORIGEM[0], 'ay': caixa[1] - ORIGEM[1],
        }
    atlas.save(SAIDA / 'paredes.png', optimize=True)
    (SAIDA / 'paredes.json').write_text(json.dumps(meta, indent=1), encoding='utf-8')
    print(SAIDA / 'paredes.png', atlas.size, f'{(SAIDA / "paredes.png").stat().st_size / 1024:.0f} KB')
    for nome, d in meta['pecas'].items():
        print(f'  {nome:10} {d["w"]:3} x {d["h"]:3}  em ({d["ax"]:+d}, {d["ay"]:+d})')


if __name__ == '__main__':
    main()
