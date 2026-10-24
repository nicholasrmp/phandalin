# -*- coding: utf-8 -*-
"""
Tira as MARCAS VERMELHAS soltas que o modelo pinta no golpe do Grask: a
"pintura de guerra" do pedido vira manchas nas costas, nos bracos e na barriga
dos quadros de ataque. A pintura de verdade e uma faixa no rosto, e fica: so
saem os vermelhos abaixo da cabeca (o quarto de cima da figura).

Cada pixel vermelho vira a media dos vizinhos que nao sao vermelhos -- a pele
ou o couro em volta.

Uso: python src/dev/limpar-vermelho.py <pasta> [<pasta> ...]
"""
import colorsys
import json
import sys
from pathlib import Path
from PIL import Image


def vermelho(p):
    h, s, v = colorsys.rgb_to_hsv(*(c / 255 for c in p[:3]))
    return p[3] and (h < 0.03 or h > 0.96) and s > 0.55 and v > 0.3


def limpar(pasta):
    pasta = Path(pasta)
    jm = next(j for j in pasta.glob('*.json') if j.name not in ('armas.json', 'meta.json'))
    meta = json.loads(jm.read_text(encoding='utf-8'))['spritesheet']
    C = meta['cell_size']['width']
    folha = Image.open(pasta / meta['path']).convert('RGBA')
    px = folha.load()
    trocados = 0
    for r in meta['rows']:
        if r['type'] != 'animation' or not r['animation'].startswith('attack'):
            continue
        for f in range(r['frame_count']):
            x0, y0 = f * C, r['row'] * C
            cel = folha.crop((x0, y0, x0 + C, y0 + C))
            bb = cel.getbbox()
            if not bb:
                continue
            cabeca = bb[1] + (bb[3] - bb[1]) // 4
            for _ in range(3):              # de fora para dentro da mancha
                for y in range(cabeca, C):
                    for x in range(C):
                        p = px[x0 + x, y0 + y]
                        if not vermelho(p):
                            continue
                        viz = [px[x0 + x + dx, y0 + y + dy] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
                               if 0 <= x + dx < C and 0 <= y + dy < C]
                        bons = [q for q in viz if q[3] and not vermelho(q)]
                        if len(bons) >= 2:
                            px[x0 + x, y0 + y] = tuple(sum(q[i] for q in bons) // len(bons) for i in range(3)) + (255,)
                            trocados += 1
    folha.save(pasta / meta['path'])
    print(pasta.name, trocados)


if __name__ == '__main__':
    for p in sys.argv[1:]:
        limpar(p)
