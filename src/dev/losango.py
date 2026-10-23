# -*- coding: utf-8 -*-
"""
A geometria do ladrilho do tabuleiro, num lugar so.

Os numeros vem do motor, nao de estimativa: `board.js` define TW = 64 e
TH = 32, e o `diamond()` desenha os vertices em (sx, sy), (sx+32, sy+16),
(sx, sy+32) e (sx-32, sy+16). Todo script que gera, recorta ou mede ladrilho
importa daqui, para nao existir uma segunda copia de uma conta sutil.
"""
from PIL import Image

TW, TH = 64, 32
LIFT = 22


def no_losango(x, y):
    """
    O pixel (x, y) de uma celula 64x32 pertence a ESTE ladrilho?

    E a PARTICAO EXATA do losango 2:1 no passo (32, 16), e ela nao e a conta
    obvia. A conta obvia -- |x - cx|/32 + |y - cy|/16 <= 1 -- deixa as duas
    fileiras do meio com 62 px em vez de 64, e as falhas dos vizinhos se
    alinham: medido, 560 buracos num remendo de 6x6.

    A particao certa cresce de 4 em 4 nas fileiras 0-15 (4, 8, ..., 64) e
    recomeca em 60 nas 16-31, encolhendo de 4 em 4 ate zero. Soma 1.024, que e
    a area exata de uma celula da rede. Medido num remendo de 8x8: zero buraco
    e zero sobreposicao.

    A ponta de cima tem 4 px de largura -- e o que o PixelLab chama de
    `tile_flat_top_px: 4`, "modern".
    """
    if y < 16:
        return 30 - 2 * y <= x <= 33 + 2 * y
    k = y - 15
    return 2 * k <= x <= 63 - 2 * k


def recortar_topo(im, ox=None, oy=None):
    """
    Recorta o losango do topo pela particao exata.

    `ox, oy` e o canto da celula 64x32 dentro da imagem. Sem eles, o canto sai
    da caixa do desenho: topo da caixa e topo do losango, e o losango ocupa a
    largura inteira.
    """
    rgba = im.convert('RGBA')
    if ox is None or oy is None:
        bb = rgba.getbbox()
        ox, oy = bb[0], bb[1]
    out = Image.new('RGBA', (TW, TH), (0, 0, 0, 0))
    s, d = rgba.load(), out.load()
    for y in range(TH):
        for x in range(TW):
            sx, sy = x + ox, y + oy
            if no_losango(x, y) and 0 <= sx < rgba.width and 0 <= sy < rgba.height:
                d[x, y] = s[sx, sy]
    return out


def remendo(ladrilhos, n=6, escolher=None, fundo=(27, 22, 16, 255)):
    """
    N x N ladrilhos no passo do tabuleiro, para olhar a repeticao.

    `escolher(gx, gy)` devolve o indice do ladrilho de cada casa; sem ele, usa
    sempre o primeiro -- que e justamente o teste do papel de parede.
    """
    w = n * TW + TW
    h = n * TH + TH + 8
    r = Image.new('RGBA', (w, h), fundo)
    ox = w // 2 - TW // 2
    for gx in range(n):
        for gy in range(n):
            i = escolher(gx, gy) if escolher else 0
            r.alpha_composite(ladrilhos[i], (ox + (gx - gy) * TW // 2, 4 + (gx + gy) * TH // 2))
    return r


def furos(ladrilho):
    """Pixels transparentes DENTRO da particao: o desenho nao cobriu o losango."""
    px = ladrilho.convert('RGBA').load()
    return sum(1 for y in range(TH) for x in range(TW)
               if no_losango(x, y) and px[x, y][3] == 0)
