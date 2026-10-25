# -*- coding: utf-8 -*-
"""
Apaga o floco de teia que o PixelLab deixou em cima do abdomen da aranha
gigante no andar (oeste e sudoeste): pixels claros (creme) na metade de cima
da figura, nas animacoes sem ataque. As presas cor de marfim ficam embaixo
da cabeca e nao sao tocadas. Roda depois do `importar-pixellab.py`.
"""
import colorsys
import json
from pathlib import Path
from PIL import Image

FOLHAS = Path(__file__).resolve().parent.parent / 'art' / 'folhas'
for nome in ['aranhaGigante', 'aranhaGiganteTeia']:
    meta = json.loads((FOLHAS / f'{nome}.json').read_text(encoding='utf-8'))
    im = Image.open(FOLHAS / f'{nome}.png').convert('RGBA')
    px = im.load()
    tirados = 0
    for an, a in meta['anims'].items():
        if an in ('attack', 'down', 'sleep', 'dead'):
            continue
        for di in range(len(meta['dirs'])):
            for f in range(a['frames']):
                x0, y0 = f * a['fw'], a['y'] + di * a['fh']
                cel = im.crop((x0, y0, x0 + a['fw'], y0 + a['fh']))
                bb = cel.getbbox()
                if not bb:
                    continue
                corte = bb[1] + int(0.45 * (bb[3] - bb[1]))
                for y in range(bb[1], corte):
                    for x in range(bb[0], bb[2]):
                        r, g, b, al = px[x0 + x, y0 + y]
                        if not al:
                            continue
                        h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
                        if v > 0.72 and s < 0.3:
                            px[x0 + x, y0 + y] = (0, 0, 0, 0)
                            tirados += 1
                # O contorno preto do floco fica sozinho: sai o preto que nao
                # encosta em nenhuma cor (o passo de 3 e o pixel logico).
                for y in range(bb[1], corte):
                    for x in range(bb[0], bb[2]):
                        r, g, b, al = px[x0 + x, y0 + y]
                        if not al or max(r, g, b) > 8:
                            continue
                        perto = False
                        for dy in (-3, 0, 3):
                            for dx in (-3, 0, 3):
                                xx, yy = x + dx, y + dy
                                if 0 <= xx < a['fw'] and 0 <= yy < a['fh']:
                                    q = px[x0 + xx, y0 + yy]
                                    if q[3] and max(q[:3]) > 8:
                                        perto = True
                        if not perto:
                            px[x0 + x, y0 + y] = (0, 0, 0, 0)
                            tirados += 1
    im.save(FOLHAS / f'{nome}.png', optimize=True)
    print(nome, tirados, 'pixels claros tirados')
