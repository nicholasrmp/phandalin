# -*- coding: utf-8 -*-
"""
Monta o atlas das FACES EM RUINA (`src/art/folhas/ruinas.png` e `.json`) a
partir dos kits de construcao do PixelLab de Arvore Trovao (`kit-predio.py`,
kits `trovao*`).

POR QUE FACES, E NAO AS PECAS DO KIT. A parede de borda do jogo e DESENHADA, nao
um sprite (`board.js`, `faceDaParede`): o sprite do kit tem tampa nas duas pontas
e deixa talho nas quinas. O que o kit empresta e a TEXTURA da face -- pedra
rachada, furo, fuligem, entulho no pe -- e a quebra do topo e recortada no
tabuleiro, por aresta.

Cada peca `sides` do kit e um bloco de parede com uma face grande (a do norte
mostra a face 'esq', a do oeste a 'dir'). Daqui sai, por material e por face,
faixas de UM nivel (22 px, `LIFT`) com a mesma forma das do atlas das `faces`:
32 x 38, o paralelogramo da aresta com a borda de cima inclinada 1:2. O tabuleiro
empilha uma faixa de BASE (nivel 0: entulho e mato), faixas de MEIO e uma de TOPO.

    python src/dev/montar-ruinas.py [--previa]
"""
import json
import sys
from pathlib import Path

from PIL import Image

AQUI = Path(__file__).resolve().parents[2]
KITS = AQUI / '_referencias' / 'pixellab' / 'kits'
SAIDA = AQUI / 'src' / 'art' / 'folhas'
LIFT = 22
FW, FH = 32, 38          # a faixa: largura de uma face; rampa da aresta (16) + um nivel (22)

# material -> (pasta do kit, andares do kit)
MATERIAIS = {
    'leve': 'trovaoLeve/0f86029a-a961-4cfe-ad9a-6aab3ea8a554',
    'pesada': 'trovaoPesada/1261b6cd-351f-4c8e-88ca-5f4a47673b71',
    'escombros': 'trovaoEscombros/ce274a88-4431-4147-964c-1eb818418a25',
    'alta': 'trovaoAlta/b2b8e4eb-8b75-498e-aeed-0a64f1ca0ca0',
}
# A coluna esquerda da face grande dentro da lona de 102 px, por peca.
FACES = {
    'esq': [('sides', 'N', 38), ('partition_wall', 'N', 38)],
    'dir': [('sides', 'W', 32), ('partition_wall', 'W', 32)],
}


def peca(base, familia, lado):
    r = json.loads((base / 'regras.json').read_text(encoding='utf-8'))
    return r['parts'][familia][lado]


def ajustar(im, x0, lado):
    """O pe da face: y do canto de coluna 0 (esq) ou da coluna 0 (dir), pela mediana.

    A borda de baixo corre 1:2. Para a face 'esq' ela desce para a direita; para a
    'dir', sobe para a direita. Medir a coluna mais baixa de cada coluna e tirar
    a inclinacao da mediana aguenta o mato e o entulho que passam do pe.
    """
    px = im.load()
    desvios = []
    for c in range(FW):
        ys = [y for y in range(im.height) if px[x0 + c, y][3]]
        if not ys:
            continue
        pe = max(ys)
        inclin = c // 2 if lado == 'esq' else -(c // 2)
        desvios.append(pe - inclin)
    desvios.sort()
    return desvios[len(desvios) // 2]


def faixa(im, x0, pe0, lado, n):
    """A faixa do nivel `n` (0 = o do pe). Devolve (imagem, cobertura 0..1)."""
    out = Image.new('RGBA', (FW, FH), (0, 0, 0, 0))
    s, d = im.load(), out.load()
    dentro = cheios = 0
    for c in range(FW):
        topo = c // 2 if lado == 'esq' else (FW - 1 - c) // 2
        pe = pe0 + (c // 2 if lado == 'esq' else -(c // 2))
        for r in range(LIFT):
            sy = pe - (n + 1) * LIFT + 1 + r
            sx = x0 + c
            dentro += 1
            if 0 <= sy < im.height and s[sx, sy][3]:
                d[c, topo + r] = s[sx, sy][:3] + (255,)
                cheios += 1
    return out, cheios / dentro


def tapar(t):
    """Furo na arte vira o pixel opaco de cima (ou de baixo): a quebra e do tabuleiro."""
    px = t.load()
    for c in range(FW):
        col = [px[c, y][3] for y in range(FH)]
        if not any(col):
            continue
        a, b = col.index(255), FH - 1 - col[::-1].index(255)
        for y in range(a, b + 1):
            if not px[c, y][3]:
                px[c, y] = px[c, y - 1]
    return t


def main():
    previa = '--previa' in sys.argv
    linhas = []                 # (chave, imagem)
    meta = {'fw': FW, 'fh': FH, 'faixas': {}}
    for mat, pasta in MATERIAIS.items():
        base = KITS / pasta
        meta['faixas'][mat] = {}
        for lado, fontes in FACES.items():
            classes = {'base': [], 'meio': [], 'topo': []}
            for familia, qual, x0 in fontes:
                n = peca(base, familia, qual)
                im = Image.open(base / f'tile_{n}.png').convert('RGBA')
                pe0 = ajustar(im, x0, lado)
                ni = 0
                niveis = []
                # So os niveis que a parede tem de fato: acima disso a faixa pega o
                # TOPO do bloco (a tampa clara), que o tabuleiro desenha por conta propria.
                maximo = int((im.getbbox()[3] - im.getbbox()[1] - 16) / LIFT + 0.3)
                while ni < maximo:
                    f, cob = faixa(im, x0, pe0, lado, ni)
                    if cob < 0.55:
                        break
                    niveis.append(tapar(f))
                    ni += 1
                if not niveis:
                    continue
                classes['base'].append(niveis[0])
                for f in niveis[1:-1] or niveis[1:]:
                    classes['meio'].append(f)
                if len(niveis) > 1:
                    classes['topo'].append(niveis[-1])
                print(f'{mat:10} {lado} {familia:15} {qual}  x0={x0} pe={pe0}  {ni} niveis')
            if not classes['meio']:
                classes['meio'] = list(classes['base'])
            if not classes['topo']:
                classes['topo'] = list(classes['meio'])
            meta['faixas'][mat][lado] = {}
            for cl, lista in classes.items():
                meta['faixas'][mat][lado][cl] = []
                for f in lista:
                    meta['faixas'][mat][lado][cl].append(len(linhas))
                    linhas.append(f)
    atlas = Image.new('RGBA', (FW * 12, FH * ((len(linhas) + 11) // 12)), (0, 0, 0, 0))
    for i, f in enumerate(linhas):
        atlas.alpha_composite(f, ((i % 12) * FW, (i // 12) * FH))
    # o indice vira (x, y) no atlas
    for mat in meta['faixas'].values():
        for lado in mat.values():
            for cl in lado:
                lado[cl] = [{'x': (i % 12) * FW, 'y': (i // 12) * FH} for i in lado[cl]]
    atlas.save(SAIDA / 'ruinas.png', optimize=True)
    (SAIDA / 'ruinas.json').write_text(json.dumps(meta), encoding='utf-8')
    print('atlas', atlas.size, len(linhas), 'faixas')
    if previa:
        # cada material: faces 'esq' e 'dir', base / meio / topo lado a lado, em 3x
        P = Image.new('RGBA', (FW * 3 * 14, FH * 3 * 8), (44, 44, 44, 255))
        y = 0
        for mat, lados in meta['faixas'].items():
            for lado, classes in lados.items():
                x = 0
                for cl, lista in classes.items():
                    for it in lista:
                        t = atlas.crop((it['x'], it['y'], it['x'] + FW, it['y'] + FH)).resize((FW * 3, FH * 3), Image.NEAREST)
                        P.alpha_composite(t, (x, y)); x += FW * 3
                    x += FW * 3
                y += FH * 3
        P.save(AQUI / 'prints-arvoretrovao' / 'ruinas-faixas.png')


if __name__ == '__main__':
    main()
