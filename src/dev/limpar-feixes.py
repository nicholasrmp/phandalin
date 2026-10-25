# -*- coding: utf-8 -*-
"""
Apaga os FEIXES que o PixelLab desenha saindo do sprite, mantendo o BRILHO
que fica nos olhos.

POR QUE: o raio que atravessa o tabuleiro e do motor (`visuals.js`), do
tamanho que a distancia pedir. O raio que o modelo desenha dentro da celula
morre cortado na borda e, pior, briga com o do motor -- dois raios, um curto
e um longo, saindo do mesmo bicho. Mas o CLARAO NOS OLHOS tem de ficar: e ele
que conta que a criatura esta disparando.

COMO: o corpo e tudo o que nao e luz. Dilatando essa massa alguns pixels,
sobra uma regiao "em cima da criatura". Luz dentro dela e brilho de olho e
fica; luz fora e feixe viajando e sai. Um raio e fino e comprido, entao a
maior parte dele cai fora da massa e some; o nucleo aceso, que nasce colado
no olho, sobrevive.

Uso: python src/dev/limpar-feixes.py <pasta-do-anim> [--raio 3] [--go]
Seco por padrao: so conta o que apagaria.
"""
import argparse
import colorsys
import json
from pathlib import Path
from PIL import Image


def e_luz(p):
    """Amarelo/laranja aceso ou branco quase puro."""
    r, g, b, a = p
    if not a:
        return False
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    return v > 0.72 and (s < 0.30 or (0.02 < h < 0.19 and s > 0.25))


def main():
    p = argparse.ArgumentParser()
    p.add_argument('pasta')
    p.add_argument('--raio', type=int, default=3, help='quantos px a massa do corpo cresce')
    p.add_argument('--animacao', default='attack', help='prefixo das fileiras a limpar')
    p.add_argument('--go', action='store_true')
    a = p.parse_args()

    pasta = Path(a.pasta)
    js = next(j for j in pasta.glob('*.json') if j.name not in ('armas.json', 'meta.json'))
    meta = json.loads(js.read_text(encoding='utf-8'))['spritesheet']
    im = Image.open(pasta / meta['path']).convert('RGBA')
    px = im.load()
    L = meta['cell_size']['width']
    fileiras = [r for r in meta['rows']
                if r['type'] == 'animation' and (r.get('animation') or '').startswith(a.animacao)]
    total = 0
    for r in fileiras:
        for col in range(r['frame_count']):
            x0, y0 = col * L, r['row'] * L
            luz = set()
            corpo = set()
            for y in range(L):
                for x in range(L):
                    q = px[x0 + x, y0 + y]
                    if not q[3]:
                        continue
                    (luz if e_luz(q) else corpo).add((x, y))
            if not luz or not corpo:
                continue
            # a massa do corpo, engordada: e ali que o brilho pode ficar
            perto = set()
            for (x, y) in corpo:
                for dy in range(-a.raio, a.raio + 1):
                    for dx in range(-a.raio, a.raio + 1):
                        perto.add((x + dx, y + dy))
            fora = [q for q in luz if q not in perto]
            total += len(fora)
            if a.go:
                for (x, y) in fora:
                    px[x0 + x, y0 + y] = (0, 0, 0, 0)
    print(f'{len(fileiras)} fileiras, {total} pixels de feixe {"apagados" if a.go else "a apagar"}')
    if a.go:
        im.save(pasta / meta['path'])


if __name__ == '__main__':
    main()
