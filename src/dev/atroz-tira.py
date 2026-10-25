# -*- coding: utf-8 -*-
"""
A tira do LOBO ATROZ que se anima, sem geracao.

1. As vistas vieram GIRADAS uma casa (como as do lobo): a "sul" olha para
   sudoeste. A ordem certa e 1..7 e depois a 0.
2. O pelo saiu cinza medio, quase o do lobo comum; o look `direWolf` e quase
   preto azulado, dois degraus abaixo. O valor do pelo desce 30% e puxa para o
   azul; o claro de verdade (dentes, olho) fica.

    python src/dev/atroz-tira.py
"""
import colorsys
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parents[2]
FONTE = RAIZ / '_referencias/pixellab/loboAtroz-46dd564f/Lobo_atroz-Idle.png'
SAIDA = RAIZ / '_referencias/pixellab/edicoes/lobo-atroz-direcoes/tira.png'
ORDEM = [1, 2, 3, 4, 5, 6, 7, 0]


def escurecer(p):
    h, s, v = colorsys.rgb_to_hsv(*(c / 255 for c in p[:3]))
    if v > 0.85:          # dentes e olho
        return p
    r, g, b = colorsys.hsv_to_rgb(0.61, min(1, s * 1.15 + 0.04), v * 0.7)
    return (round(r * 255), round(g * 255), round(b * 255), p[3])


def main():
    im = Image.open(FONTE).convert('RGBA')
    lado = im.height
    tira = Image.new('RGBA', im.size)
    for i, k in enumerate(ORDEM):
        tira.paste(im.crop((k * lado, 0, (k + 1) * lado, lado)), (i * lado, 0))
    px = tira.load()
    for y in range(tira.height):
        for x in range(tira.width):
            if px[x, y][3]:
                px[x, y] = escurecer(px[x, y])
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    tira.save(SAIDA)
    print(SAIDA)


if __name__ == '__main__':
    main()
