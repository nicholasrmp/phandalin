# -*- coding: utf-8 -*-
"""
Yeemik e Droop, os goblins com nome, SEM GASTAR GERACOES: a folha do goblin
do PixelLab (`src/art/folhas/goblin.png`) com a pele recolorida e uma faixa
pintada na testa de cada quadro.

A TESTA E ACHADA PELA PELE: a primeira pele na coluna central da cabeca
(a mais alta de todas e a ponta da orelha). A faixa e pintada so sobre pixels
de pele nas duas primeiras fileiras logicas dessa testa, entao ela acompanha
o formato da cabeca em todas as direcoes e em todos os quadros, inclusive no
golpe. De costas nao ha pele no alto da cabeca e a faixa nao aparece -- que e
o certo, ela fica na frente.

    Yeemik  pele verde-oliva (o look `yeemik`) e faixa vermelha de chefe
    Droop   pele cinza-esverdeada palida (o look `droop`) e atadura de pano encardido

A folha e ampliada 3x (`s` do json): o trabalho e feito na escala da arte e
ampliado de volta, para cada pixel continuar um bloco 3x3.

    python src/dev/reskins-goblins.py
"""
import colorsys
import json
import shutil
from pathlib import Path
from PIL import Image

FOLHAS = Path(__file__).resolve().parents[2] / 'src' / 'art' / 'folhas'


def hsv(p):
    return colorsys.rgb_to_hsv(*(c / 255 for c in p[:3]))


def rgb(h, s, v, a=255):
    r, g, b = colorsys.hsv_to_rgb(h % 1, max(0, min(1, s)), max(0, min(1, v)))
    return (round(r * 255), round(g * 255), round(b * 255), a)


def e_pele(p):
    if not p[3]:
        return False
    h, s, v = hsv(p)
    return 0.10 <= h <= 0.17 and s > 0.45 and v > 0.3


GOBLINS = {
    # pele: (matiz, fator de saturacao, fator de valor); faixa: duas cores (luz, sombra)
    'yeemik': {'pele': (0.22, 0.75, 0.82), 'faixa': [(184, 40, 40, 255), (122, 24, 30, 255)]},
    'droop': {'pele': (0.26, 0.35, 0.85), 'faixa': [(205, 184, 138, 255), (118, 90, 62, 255)]},
}


def reskin(cel, cfg, faixa=True):
    px = cel.load()
    W, H = cel.size
    pele = [[e_pele(px[x, y]) for x in range(W)] for y in range(H)]
    # A testa: a pele mais alta e a ponta das ORELHAS (pontudas, acima da
    # testa). A testa e a primeira pele na coluna CENTRAL da cabeca (a mediana
    # da pele dos 12 px de cima), e a faixa vai dali ate onde a pele da mesma
    # fileira se estende.
    alto = next((y for y in range(H) if any(pele[y])), None)
    topo = None
    if alto is not None:
        xs = sorted(x for y in range(alto, min(H, alto + 12)) for x in range(W) if pele[y][x])
        cx = xs[len(xs) // 2]
        topo = next((y for y in range(alto, min(H, alto + 16))
                     if any(pele[y][x] for x in range(max(0, cx - 2), min(W, cx + 3)))), None)
    if topo is not None and faixa:
        # A largura da testa e meia cabeca para cada lado da coluna central;
        # a ponta da orelha fica de fora (ela esta mais longe que isso).
        x0, x1 = cx - 6, cx + 6
        for y in (topo + 1, topo + 2):
            for x in range(max(0, x0), min(W, x1 + 1)):
                if y < H and pele[y][x]:
                    px[x, y] = cfg['faixa'][0 if y == topo + 1 else 1]
                    pele[y][x] = False
    h0, fs, fv = cfg['pele']
    for y in range(H):
        for x in range(W):
            if pele[y][x]:
                h, s, v = hsv(px[x, y])
                px[x, y] = rgb(h0 + (h - 0.13) * 0.5, s * fs, v * fv, px[x, y][3])


def main():
    meta = json.loads((FOLHAS / 'goblin.json').read_text(encoding='utf-8'))
    folha = Image.open(FOLHAS / 'goblin.png').convert('RGBA')
    S = meta['s']
    cw = meta['cell'][0]
    # Caido, dormindo e morto sao vistos de cima: a pele mais alta e o topo da
    # cabeca e a faixa viraria uma touca. Nessas animacoes nao ha faixa.
    sem_faixa = min(meta['anims'][a]['y'] for a in ('down', 'sleep', 'dead'))
    # De costas (linhas 3, 4 e 5 de cada animacao: NE, N, NO) a pele mais alta e
    # a orelha e a faixa cairia nela. A faixa fica na frente: sem faixa ali.
    de_costas = {3, 4, 5}
    for nome, cfg in GOBLINS.items():
        nova = Image.new('RGBA', folha.size)
        for y0 in range(0, folha.height, cw):
            for x0 in range(0, folha.width, cw):
                cel = folha.crop((x0, y0, x0 + cw, y0 + cw))
                if not cel.getbbox():
                    continue
                arte = cel.resize((cw // S, cw // S), Image.NEAREST)
                reskin(arte, cfg, faixa=y0 < sem_faixa and (y0 // cw) % 8 not in de_costas)
                nova.paste(arte.resize((cw, cw), Image.NEAREST), (x0, y0))
        nova.save(FOLHAS / f'{nome}.png')
        shutil.copyfile(FOLHAS / 'goblin.json', FOLHAS / f'{nome}.json')
        print(FOLHAS / f'{nome}.png')


if __name__ == '__main__':
    main()
