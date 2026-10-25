# -*- coding: utf-8 -*-
"""
A TIRA DE OITO VISTAS DA GELATINA OCRE, montada aqui e sem gastar geracao.

Por que nao foi o PixelLab que girou: em duas voltas (`gelatinaOcre-8478a6b0`
e `-1fc7506c`) o modelo esticou o pseudopode num gancho alto e fino nas
vistas do meio, e o dono quer o toco curto e grosso da imagem oficial dele.

Por que montar a tira resolve: uma gosma amorfa NAO TEM FRENTE NEM COSTAS. A
mesma figura serve para as oito direcoes; o que muda e o lado para onde o
toco aponta, e isso e um espelho. As tres vistas do oeste sao espelhadas, e
nas de norte a figura desce 2 px (esta mais longe da camera).

Saida: `_referencias/pixellab/gelatina-ref/tira.png`, 8 quadros de 80 px na
ordem das rotacoes (sul, sudeste, leste, nordeste, norte, noroeste, oeste,
sudoeste). O `criar-pixellab.py` a registra como personagem (`'tira'`).
"""
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parents[2]
REF = RAIZ / '_referencias' / 'pixellab' / 'gelatina-ref'
DIRECOES = ['south', 'south-east', 'east', 'north-east',
            'north', 'north-west', 'west', 'south-west']
ESPELHA = {'north-west', 'west', 'south-west'}
RECUA = {'north', 'north-east', 'north-west'}

sul = Image.open(REF / 'sul.png').convert('RGBA')
L = sul.width
tira = Image.new('RGBA', (L * len(DIRECOES), L), (0, 0, 0, 0))
for i, d in enumerate(DIRECOES):
    cel = sul.transpose(Image.FLIP_LEFT_RIGHT) if d in ESPELHA else sul.copy()
    if d in RECUA:
        quadro = Image.new('RGBA', (L, L), (0, 0, 0, 0))
        quadro.paste(cel, (0, 2), cel)
        cel = quadro
    tira.paste(cel, (i * L, 0), cel)
tira.save(REF / 'tira.png')
print(REF / 'tira.png', tira.size)
