# -*- coding: utf-8 -*-
"""
A tira da CORUJA-URSO que se anima, sem geracao.

1. As vistas vieram GIRADAS uma casa (a "sul" e a sudeste): a ordem certa e
   7, 0, 1, ..., 6.
2. O laranja do bico VAZOU em manchinhas pelo pelo, que os modelos do dono nao
   tem. Mancha laranja cercada de pelo (5 ou mais dos 8 vizinhos sao pelo
   arroxeado) vira o claro do pelo; o bico e o olho, cercados de creme e de
   contorno, ficam.

    python src/dev/coruja-tira.py
"""
import colorsys
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parents[2]
FONTE = RAIZ / '_referencias/pixellab/corujaUrso-e4daa996/Coruja-urso-Idle.png'
SAIDA = RAIZ / '_referencias/pixellab/edicoes/coruja-urso-direcoes/tira.png'
ORDEM = [7, 0, 1, 2, 3, 4, 5, 6]


def hsv(p):
    return colorsys.rgb_to_hsv(*(c / 255 for c in p[:3]))


def laranja(p):
    h, s, v = hsv(p)
    return p[3] and 0.04 <= h <= 0.16 and s > 0.35 and v > 0.35


def pelo(p):
    h, s, v = hsv(p)
    return p[3] and (0.6 <= h <= 0.95) and s < 0.4 and 0.12 < v < 0.75


def limpar(cel):
    px = cel.load()
    W, H = cel.size
    for _ in range(3):
        trocar = []
        for y in range(1, H - 1):
            for x in range(1, W - 1):
                if not laranja(px[x, y]):
                    continue
                n = sum(pelo(px[x + dx, y + dy]) for dy in (-1, 0, 1) for dx in (-1, 0, 1))
                if n >= 4:
                    trocar.append((x, y))
        for x, y in trocar:
            v = hsv(px[x, y])[2]
            px[x, y] = (138, 128, 152, 255) if v > 0.6 else (110, 102, 122, 255)
        if not trocar:
            break


def main():
    im = Image.open(FONTE).convert('RGBA')
    lado = im.height
    tira = Image.new('RGBA', im.size)
    for i, k in enumerate(ORDEM):
        cel = im.crop((k * lado, 0, (k + 1) * lado, lado))
        limpar(cel)
        tira.paste(cel, (i * lado, 0))
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    tira.save(SAIDA)
    print(SAIDA)


if __name__ == '__main__':
    main()
