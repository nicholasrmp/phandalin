# -*- coding: utf-8 -*-
"""
O Klarg e o bugbear do PixelLab com o pelo DESCORADO, SEM GASTAR GERACOES:
mesmo corpo, mesmo couro preto, mesma clava, e a pelagem cor de osso do look
`klarg` (`src/art/looks/bestiario.js`) -- e o que o separa dos bugbears da
mansao de longe.

O pelo fulvo e a juba ruiva sao os laranjas do desenho (matiz 0,02-0,14,
saturacao media a alta). O que fica de fora: o couro preto (valor baixo), o
ferro (saturacao baixa), a madeira da clava (marrom escuro, valor < 0,45) e o
ambar dos olhos (saturado e claro: a mancha pequena que lia como olho).

    python src/dev/reskins-klarg.py <pasta-anim> [...]   ->  <pasta>-klarg
"""
import colorsys
import json
import shutil
import sys
from pathlib import Path
from PIL import Image


def osso(p):
    if not p[3]:
        return None
    h, s, v = colorsys.rgb_to_hsv(*(c / 255 for c in p[:3]))
    # a barba ruiva escura (matiz no vermelho): pardo, como a juba
    if (h < 0.02 or h > 0.95) and s > 0.4 and 0.2 < v < 0.8:
        r, g, b = colorsys.hsv_to_rgb(0.10, 0.22, v * 0.85)
        return (round(r * 255), round(g * 255), round(b * 255), p[3])
    if not (0.02 <= h <= 0.14 and s > 0.35 and v > 0.30):
        return None
    if s > 0.8 and v > 0.85:          # o ambar do olho
        return None
    if h < 0.07:                      # a juba ruiva: cinza-pardo
        r, g, b = colorsys.hsv_to_rgb(0.10, 0.22, v * 0.80)
    else:                             # o pelo fulvo: osso
        r, g, b = colorsys.hsv_to_rgb(0.11, s * 0.30, min(1.0, v * 1.02))
    return (round(r * 255), round(g * 255), round(b * 255), p[3])


def main():
    for arg in sys.argv[1:]:
        origem = Path(arg)
        jm = next(j for j in origem.glob('*.json') if j.name not in ('armas.json', 'meta.json'))
        meta = json.loads(jm.read_text(encoding='utf-8'))['spritesheet']
        folha = Image.open(origem / meta['path']).convert('RGBA')
        px = folha.load()
        for y in range(folha.height):
            for x in range(folha.width):
                novo = osso(px[x, y])
                if novo:
                    px[x, y] = novo
        destino = origem.parent / f'{origem.name}-klarg'
        if destino.exists():
            shutil.rmtree(destino)
        shutil.copytree(origem, destino)
        folha.save(destino / meta['path'])
        print(destino)


if __name__ == '__main__':
    main()
