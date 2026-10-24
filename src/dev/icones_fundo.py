# -*- coding: utf-8 -*-
"""
Repinta de magenta o fundo de cada célula de uma folha de ícones.

    python src/dev/icones_fundo.py <pasta-da-folha>

O gerador às vezes ignora o "fundo magenta" em algumas células e as pinta de
cinza, branco ou rosa-claro (a refazer-16 e a itens-12 vieram assim). O
conversor acha UM fundo para a folha inteira, e essas células entram com um
quadrado opaco atrás do ícone. Aqui cada célula descobre a própria cor de
fundo pelos cantos (um pouco para dentro, para não pegar a linha da grade) e
a pinta de magenta por inundação a partir das bordas da célula. Lê folha.jpg
(o original) e grava folha.png; depois rode icones_prancha.py.
"""
import json
import sys
from collections import deque
from pathlib import Path

from PIL import Image

MAG = (255, 0, 255)


def perto(a, b, t):
    return sum(abs(x - y) for x, y in zip(a, b)) <= t * 3


def main(pasta):
    pasta = Path(pasta)
    esp = json.loads((pasta / 'especificacao.json').read_text(encoding='utf-8'))
    col, lin = esp['colunas'], esp['linhas']
    im = Image.open(pasta / 'folha.jpg').convert('RGB')
    W, H = im.size
    px = im.load()
    cw, ch = W / col, H / lin
    for r in range(lin):
        for c in range(col):
            x0, y0, x1, y1 = int(c * cw), int(r * ch), int((c + 1) * cw), int((r + 1) * ch)
            cantos = [px[x0 + 18, y0 + 18], px[x1 - 19, y0 + 18], px[x0 + 18, y1 - 19], px[x1 - 19, y1 - 19]]
            cantos = [k for k in cantos if not perto(k, MAG, 60)]
            # Só repinta se ao menos três cantos concordam: um canto só pode
            # ser a ponta do próprio desenho encostando na borda.
            base = max(set(cantos), key=lambda k: sum(perto(k, o, 24) for o in cantos)) if cantos else None
            if base is None or sum(perto(base, o, 24) for o in cantos) < 3:
                base = None
            fila = deque((x, y) for x in range(x0, x1) for y in (y0, y1 - 1))
            fila.extend((x, y) for y in range(y0, y1) for x in (x0, x1 - 1))
            visto = set()
            while fila:
                x, y = fila.popleft()
                if (x, y) in visto or not (x0 <= x < x1 and y0 <= y < y1):
                    continue
                visto.add((x, y))
                p = px[x, y]
                if not (perto(p, MAG, 60) or (base and perto(p, base, 30))):
                    continue
                px[x, y] = MAG
                fila.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    im.save(pasta / 'folha.png')
    print(f'{pasta.name}: fundo repintado')


if __name__ == '__main__':
    main(sys.argv[1])
