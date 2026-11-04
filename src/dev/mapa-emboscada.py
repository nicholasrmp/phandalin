"""Gera o terreno da EMBOSCADA DOS GOBLINS a partir do mapa pintado.

    python src/dev/mapa-emboscada.py            # imprime as linhas para colar em `game/encounter.js`

O mapa é o primeiro encontro de A Mina Perdida de Phandelver: a Trilha Triboar cortando a mata, os cavalos mortos
na estrada e as moitas dos dois lados, de onde os goblins saltam. O desenho é o de verdade (Venatus Maps, em
`_referencias/mapas/`, fora do versionamento), e o terreno sai DELE, por cor — não à mão.

    verde forte  -> `T` mata fechada (barra passo e visão)
    verde fraco  -> `,` grama do acostamento
    areia        -> `:` estrada
    escuro na estrada -> `C` carroça / `h` cavalo morto (cobertura)

E a primeira fileira de mata COLADA na estrada vira `%` espinheiro: terreno difícil. É a moita onde o livro põe os
goblins — eles ganham cobertura e quem vai atrás paga o dobro para entrar.
"""
import os

import numpy as np
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
IMAGEM = os.path.join(RAIZ, '_referencias', 'mapas', 'emboscada-goblin.png')
PASSO = 37.38
X0, Y0 = 0.3, 3.4
W, H = 22, 17


def cores():
    im = Image.open(IMAGEM).convert('RGB')
    a = np.asarray(im).astype(np.float32)
    saida = []
    for cy in range(H):
        linha = []
        for cx in range(W):
            amostra = []
            for ax in np.linspace(0.2, 0.8, 5):
                for ay in np.linspace(0.2, 0.8, 5):
                    ix = int(X0 + (cx + ax) * PASSO)
                    iy = int(Y0 + (cy + ay) * PASSO)
                    if 0 <= ix < im.width and 0 <= iy < im.height:
                        amostra.append(a[iy, ix])
            linha.append(np.median(np.array(amostra), axis=0) if amostra else np.zeros(3))
        saida.append(linha)
    return saida


def main():
    c = cores()
    verde = lambda p: p[1] - (p[0] + p[2]) / 2
    brilho = lambda p: float(p.mean())
    # 1) o básico, pela cor
    g = [[('T' if verde(p) > 16 else ',' if verde(p) > 6 else ':') for p in linha] for linha in c]
    # 2) o que é escuro em cima da estrada é carroça ou cavalo morto: cobertura
    dentroDaEstrada = lambda x, y: all(
        0 <= y + dy < H and 0 <= x + dx < W and g[y + dy][x + dx] in (':', 'C', 'h')
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)))
    for y in range(H):
        for x in range(W):
            # O chão da estrada fica entre 170 e 192; o acostamento sombreado chega a 135, daí o corte em 125.
            # E só vale no MEIO da estrada: na beira a sombra da mata é escura do mesmo jeito, e não é objeto.
            if g[y][x] == ':' and brilho(c[y][x]) < 125 and dentroDaEstrada(x, y):
                g[y][x] = 'C' if x < 6 else 'h'
    # 3) a mata colada na estrada vira espinheiro: é a moita de onde os goblins saltam
    chao = {':', ','}
    for y in range(H):
        for x in range(W):
            if g[y][x] != 'T':
                continue
            # vizinhança de quatro, e não de oito: a moita é um anel fino na beira, não meia floresta
            if any(0 <= y + dy < H and 0 <= x + dx < W and g[y + dy][x + dx] in chao
                   for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1))):
                g[y][x] = '%'
    for linha in g:
        print(f"    '{''.join(linha)}',")


if __name__ == '__main__':
    main()
