# -*- coding: utf-8 -*-
"""
Os cajados da aventura do Ilvan como RESKIN do bordao, SEM GASTAR GERACOES:

  Cajado de Defesa  madeira clara de bétula, cristal de ouro
  Cajado Aranha     madeira negra arroxeada, cristal verde-veneno

ONDE ESTA O CAJADO. A madeira do cajado e o couro do cinto e da bolsa sao o
mesmo castanho; o que separa e a GEOMETRIA: o cajado e reto e comeca no
cristal. Ver `cajado`.

Saida: pastas `<origem>-<item>`, prontas para o importador.
"""
import colorsys
import json
import shutil
from pathlib import Path
from PIL import Image

R = Path(__file__).resolve().parents[2] / '_referencias' / 'pixellab'
W = R / 'wizard-864b31dd'


def hsv(p):
    return colorsys.rgb_to_hsv(*(c / 255 for c in p[:3]))


def rgb(h, s, v):
    return tuple(round(c * 255) for c in colorsys.hsv_to_rgb(h % 1, max(0, min(1, s)), max(0, min(1, v))))


def madeira(p):
    h, s, v = hsv(p)
    return p[3] and 0.02 <= h <= 0.13 and 0.25 <= s <= 0.85 and 0.12 <= v <= 0.85


def cristal(p):
    h, s, v = hsv(p)
    return p[3] and 0.42 <= h <= 0.58 and s > 0.25 and v > 0.55


def ilhas(px, x0, y0, C, teste):
    pts = {(x, y) for y in range(C) for x in range(C) if teste(px[x0 + x, y0 + y])}
    visto, saida = set(), []
    for p0 in pts:
        if p0 in visto:
            continue
        pilha, comp = [p0], []
        visto.add(p0)
        while pilha:
            x, y = pilha.pop()
            comp.append((x, y))
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    q = (x + dx, y + dy)
                    if q in pts and q not in visto:
                        visto.add(q)
                        pilha.append(q)
        saida.append(comp)
    return saida


def cajado(px, x0, y0, C):
    """
    (madeira, cristal) do cajado neste quadro.

    O CRISTAL e o ponto de partida: o azul que encosta na madeira (os olhos
    tambem sao azul-claros, mas encostam na pele; a luz da magia e azul, mas
    grande e solta no ar). Da madeira junto do cristal tira-se a DIRECAO do
    cajado, e e madeira tudo o que cai numa faixa estreita ao longo dela --
    inclusive o pedaco depois da mao, que a mao separa do resto. O cinto e a
    bolsa tem a mesma cor, mas so a parte que o cajado cruza cai na faixa.
    """
    madeiras = {(x, y) for y in range(C) for x in range(C) if madeira(px[x0 + x, y0 + y])}
    viz = [(dx, dy) for dx in (-2, -1, 0, 1, 2) for dy in (-2, -1, 0, 1, 2)]
    encosta = [k for k in ilhas(px, x0, y0, C, cristal)
               if any((x + dx, y + dy) in madeiras for x, y in k for dx, dy in viz)]
    azuis = [k for k in encosta if len(k) <= 40]
    if azuis:
        crist = max(azuis, key=len)
    elif encosta:
        # o cristal brilhando na magia vira uma ilha so com a luz: vale o
        # pedaco dela junto da madeira
        perto_da_madeira = {(x + dx, y + dy) for x, y in madeiras for dx in range(-3, 4) for dy in range(-3, 4)}
        crist = [p for p in max(encosta, key=len) if p in perto_da_madeira]
    else:
        return set(), set()
    cx = sum(p[0] for p in crist) / len(crist)
    cy = sum(p[1] for p in crist) / len(crist)
    # a madeira mais perto do cristal: os 12 px de madeira ligados a ele
    perto = sorted(madeiras, key=lambda p: (p[0] - cx) ** 2 + (p[1] - cy) ** 2)[:14]
    if len(perto) < 4:
        return set(), set(crist)
    mx = sum(p[0] for p in perto) / len(perto)
    my = sum(p[1] for p in perto) / len(perto)
    ux, uy = mx - cx, my - cy
    n = (ux * ux + uy * uy) ** 0.5 or 1
    ux, uy = ux / n, uy / n                      # do cristal para baixo, ao longo do cajado
    pau = set()
    for x, y in madeiras:
        t = (x - cx) * ux + (y - cy) * uy
        d = abs(-(x - cx) * uy + (y - cy) * ux)
        if -2 <= t <= 70 and d <= 2.2:
            pau.add((x, y))
    return pau, set(crist)

def defesa(p, parte):
    h, s, v = hsv(p)
    if parte == 'madeira':
        return rgb(0.11, s * 0.35, min(1, v * 1.35 + 0.12))     # betula clara
    return rgb(0.13, 0.75, min(1, v * 1.05))                    # ouro


def aranha(p, parte):
    h, s, v = hsv(p)
    if parte == 'madeira':
        return rgb(0.78, s * 0.45, v * 0.55)                    # negra arroxeada
    return rgb(0.30, 0.85, v)                                   # verde-veneno


def reskin(origem, nome, cor):
    jm = next(j for j in origem.glob('*.json') if j.name not in ('armas.json', 'meta.json'))
    meta = json.loads(jm.read_text(encoding='utf-8'))['spritesheet']
    C = meta['cell_size']['width']
    folha = Image.open(origem / meta['path']).convert('RGBA')
    px = folha.load()
    for r in meta['rows']:
        n = len(r['directions']) if r['type'] == 'rotations' else r['frame_count']
        for f in range(n):
            x0, y0 = f * C, r['row'] * C
            pau, azul = cajado(px, x0, y0, C)
            for parte, pts in (('madeira', pau), ('cristal', azul)):
                for x, y in pts:
                    p = px[x0 + x, y0 + y]
                    px[x0 + x, y0 + y] = (*cor(p, parte), p[3])
    destino = origem.parent / f'{origem.name}-{nome}'
    if destino.exists():
        shutil.rmtree(destino)
    shutil.copytree(origem, destino)
    folha.save(destino / meta['path'])
    print(destino.relative_to(R))


def main():
    reskin(W / 'anim', 'cajado-defesa', defesa)
    reskin(W / 'anim', 'cajado-aranha', aranha)


if __name__ == '__main__':
    main()
