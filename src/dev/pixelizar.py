# -*- coding: utf-8 -*-
"""
Passa um render 3D (de `render-iso.py`) para pixel art no estilo do jogo.

  python src/dev/pixelizar.py ENTRADA.png SAIDA.png [CORES]

Três passos, nenhum deles muda o tamanho (o render já sai na escala certa):
  1. alfa duro: borda meio transparente vira halo sobre o chão escuro;
  2. paleta reduzida (padrão 28 cores, mediana): o degradê liso do render
     vira faixas de cor, que é o que a pixel art tem;
  3. contorno seletivo: o pixel da borda escurece (não vira preto), como o
     contorno marrom-escuro dos objetos do PixelLab.
"""
import sys

from PIL import Image


def pixelizar(im, cores=28):
    im = im.convert('RGBA')
    w, h = im.size
    px = im.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            px[x, y] = (r, g, b, 255 if a >= 128 else 0)
    rgb = Image.new('RGB', (w, h), (0, 0, 0))
    rgb.paste(im, mask=im.split()[3])
    q = rgb.quantize(colors=cores, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    out.paste(q, mask=im.split()[3])
    o = out.load()
    borda = []
    for y in range(h):
        for x in range(w):
            if o[x, y][3] == 0:
                continue
            if any(not (0 <= x + dx < w and 0 <= y + dy < h) or o[x + dx, y + dy][3] == 0
                   for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                borda.append((x, y))
    for x, y in borda:
        r, g, b, a = o[x, y]
        o[x, y] = (int(r * 0.42), int(g * 0.38), int(b * 0.36), 255)
    return out


if __name__ == '__main__':
    cores = int(sys.argv[3]) if len(sys.argv) > 3 else 28
    pixelizar(Image.open(sys.argv[1]), cores).save(sys.argv[2])
    print('ok', sys.argv[2])
