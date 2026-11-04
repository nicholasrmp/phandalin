"""Gera o terreno da RUA DE PHANDALIN a partir do desenho.

    python src/dev/mapa-rua.py            # imprime as linhas para colar em `game/encounter.js`

O desenho é NOSSO: gerado no OpenArt (Nano Banana 2 Lite, 1264x848), cortado na grade e levado para
`public/mapas/rua.webp`, 1760x1120, que são 80 px por casa cravados em 22 por 14.

METADE SAI DA COR, METADE SAI DA MÃO — e isto é a parte honesta desta ferramenta.

O chão sai da cor, como no Ermo: verde escuro é mata, verde médio é grama, claro e sem verde é terra batida (a
rua, os caminhos e o pátio dos barris, que para a regra valem o mesmo: chão livre).

O TELHADO NÃO SAI DA COR, e foi medido: a palha dos chalés e a terra da rua ficam na mesma faixa de matiz e de
brilho, e tentar separá-las por componente conexo também falha, porque o telhado da estalagem encosta na rua —
o preenchimento atravessa de um para o outro e engole os dois num borrão de 93 casas. Então as pegadas dos
prédios são DECALCADAS à mão da imagem, que é exatamente para isso que o editor tem a ferramenta 8 (mapa de
fundo) e o traço livre. Elas estão abaixo, em casas, e a prova visual de que batem com o desenho se faz com
`conferir-encaixe.py`.
"""
import os
import sys
from collections import deque

import numpy as np
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
IMAGEM = os.path.join(RAIZ, 'public', 'mapas', 'rua.webp')
W, H = 22, 14
PASSO = 80.0
VERDE = 12                  # excesso de verde acima disto é folha
ESCURO = 92                 # escuro e verde é copa

# Decalcadas da imagem, em casas (x1, y1, x2, y2 inclusivos). `Y` é o Gigante Adormecido, a estalagem do livro:
# telhado grande de quatro águas no meio do lado norte, com o pátio cercado de barris do lado leste.
PREDIOS = [
    ('H', 2, 2, 4, 4),      # a casa de pedra, a noroeste
    ('Y', 8, 0, 13, 4),     # o Gigante Adormecido
    ('H', 17, 2, 20, 4),    # a casa de telha, a nordeste
    ('H', 2, 9, 5, 11),     # o chalé de palha, a sudoeste
    ('H', 11, 9, 14, 11),   # o chalé de palha, a sudeste
]
BARRIS = [(14, 1), (15, 1), (14, 3)]        # o pátio da estalagem
HORTA = [(7, 12), (8, 12), (9, 12)]         # a horta do chalé do sul: passa-se, mas atrapalha


def amostrar():
    im = Image.open(IMAGEM).convert('RGB')
    a = np.asarray(im).astype(np.float32)
    return [[np.median(a[np.ix_(
        [min(im.height - 1, int((cy + t) * PASSO)) for t in np.linspace(0.2, 0.8, 7)],
        [min(im.width - 1, int((cx + t) * PASSO)) for t in np.linspace(0.2, 0.8, 7)],
    )].reshape(-1, 3), axis=0) for cx in range(W)] for cy in range(H)]


def grupos(celulas):
    resto = set(celulas)
    saida = []
    while resto:
        p = resto.pop()
        fila = deque([p])
        g = {p}
        while fila:
            x, y = fila.popleft()
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                v = (x + dx, y + dy)
                if v in resto:
                    resto.discard(v)
                    g.add(v)
                    fila.append(v)
        saida.append(g)
    return sorted(saida, key=len, reverse=True)


def main():
    c = amostrar()
    verde = lambda p: p[1] - (p[0] + p[2]) / 2
    brilho = lambda p: float(p.mean())

    g = [[',' if verde(c[y][x]) >= VERDE else ':' for x in range(W)] for y in range(H)]
    for y in range(H):
        for x in range(W):
            if g[y][x] == ',' and brilho(c[y][x]) < ESCURO:
                g[y][x] = 'T'

    for glifo, x1, y1, x2, y2 in PREDIOS:
        for y in range(y1, y2 + 1):
            for x in range(x1, x2 + 1):
                g[y][x] = glifo
    for x, y in BARRIS:
        g[y][x] = 'u'
    for x, y in HORTA:
        g[y][x] = '%'

    # bolsão fechado vira mata, como no Ermo: o recorte deixa cantos de grama que ninguém alcança
    andavel = {(x, y) for y in range(H) for x in range(W) if g[y][x] not in 'THYu'}
    pedacos = grupos(andavel)
    for pedaco in pedacos[1:]:
        for x, y in pedaco:
            g[y][x] = 'T'
    if len(pedacos) > 1:
        print(f'{sum(len(p) for p in pedacos[1:])} casa(s) de bolsão fechado viraram mata', file=sys.stderr)

    for linha in g:
        print(f"    '{''.join(linha)}',")


if __name__ == '__main__':
    main()
