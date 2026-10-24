# -*- coding: utf-8 -*-
"""
Monta o atlas das FACES LATERAIS (`src/art/folhas/faces.png` e `.json`) a
partir de um lote de blocos isometricos do `tiles-pro` do PixelLab
(`ladrilhos-pro.py --conjunto paredes --profundidade 0.6875`).

POR QUE UM LOTE SO, E ESSA PROFUNDIDADE. Blocos pedidos um a um saem cada um
com seu "pintor": a alvenaria veio creme, roxa e rosa. Num lote, os
dezesseis saem no mesmo tom. E `tile_depth_ratio` mede a face em fracoes de
32 px: 0,6875 da 22 px, exatamente um nivel do motor -- a face inteira vira
a faixa, sem recorte no meio.

    python src/dev/montar-faces.py

Um bloco do PixelLab vem com o losango do topo e as duas faces de baixo,
coerentes entre si. O motor desenha a face de um quadrado elevado nivel a
nivel (22 px cada, `LIFT`), entao daqui sai, por bloco, UMA FAIXA de um nivel
de cada face, que o tabuleiro empilha quantas vezes a altura pedir:

    face esquerda: colunas 0..31, linhas 16 + x//2 ate +22 (abaixo do topo)
    face direita:  colunas 32..63, linhas 16 + (63 - x)//2 ate +22

Recortada assim, a faixa tem a borda de cima na mesma inclinacao da aresta
do losango e a de baixo paralela a ela: a faixa do nivel seguinte encaixa
sem buraco e sem sobreposicao.

O topo do bloco tambem serve: e o alto da parede de alvenaria (as pedras em
corte), e vai para o atlas como uma fileira de ladrilhos 64 x 32.

Os arquivos de entrada vem de fora (`_referencias/`, fora do repositorio).
"""
import json
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from losango import TW, TH, LIFT, recortar_topo  # noqa: E402

AQUI = Path(__file__).resolve().parents[2]
LOTE = AQUI / '_referencias' / 'pixellab' / 'ladrilhos-pro' / '5523ee99-24ad-4112-b6be-ee7f192b98a8'
SAIDA = AQUI / 'src' / 'art' / 'folhas'

# Material -> blocos. A alvenaria e a parede construida do porao; o penhasco
# e a rocha natural (a fenda, a caverna).
MATERIAIS = {
    'alvenaria': [0, 1, 2, 3, 4, 5, 6, 7],
    'penhasco': [8, 9, 10, 11, 12, 13, 14, 15],
}
FW = TW // 2            # largura de uma face
FH = TH // 2 + LIFT     # altura da faixa: a rampa da aresta mais um nivel


def faixa(im, ox, oy, lado):
    """A faixa de um nivel de uma face, com alfa fora do paralelogramo."""
    out = Image.new('RGBA', (FW, FH), (0, 0, 0, 0))
    s, d = im.load(), out.load()
    for x in range(FW):
        sx = ox + x + (FW if lado == 'dir' else 0)
        topo = x // 2 if lado == 'esq' else (FW - 1 - x) // 2
        for r in range(LIFT):
            sy = oy + TH // 2 + topo + r
            if 0 <= sx < im.width and 0 <= sy < im.height:
                px = s[sx, sy]
                if px[3]:
                    d[x, topo + r] = px[:3] + (255,)
    return out


def main():
    linhas = []      # (material, [(esq, dir, topo)])
    for mat, nomes in MATERIAIS.items():
        vs = []
        for n in nomes:
            arq = LOTE / f'tile_{n}.png'
            if not arq.exists():
                print(f'  ({n}: ainda nao existe, pulando)')
                continue
            im = Image.open(arq).convert('RGBA')
            bb = im.getbbox()
            ox, oy = bb[0], bb[1]
            esq, dir_ = faixa(im, ox, oy, 'esq'), faixa(im, ox, oy, 'dir')
            cheio = sum(1 for p in esq.getdata() if p[3]) + sum(1 for p in dir_.getdata() if p[3])
            print(f'{mat}-{n:<4} caixa {bb}  faces com {cheio}/{2 * FW * LIFT} px')
            vs.append((esq, dir_, recortar_topo(im, ox, oy)))
        if vs:
            linhas.append((mat, vs))

    larg = max(len(vs) for _, vs in linhas) * TW
    alt = len(linhas) * (FH + TH)
    atlas = Image.new('RGBA', (larg, alt), (0, 0, 0, 0))
    meta = {'fw': FW, 'fh': FH, 'tw': TW, 'th': TH, 'faces': {}, 'topos': {}}
    y = 0
    for mat, vs in linhas:
        for i, (esq, dir_, topo) in enumerate(vs):
            atlas.alpha_composite(esq, (i * TW, y))
            atlas.alpha_composite(dir_, (i * TW + FW, y))
            atlas.alpha_composite(topo, (i * TW, y + FH))
        meta['faces'][mat] = {'y': y, 'n': len(vs)}
        meta['topos'][mat] = {'y': y + FH, 'n': len(vs)}
        y += FH + TH
    atlas.save(SAIDA / 'faces.png', optimize=True)
    (SAIDA / 'faces.json').write_text(json.dumps(meta, indent=1), encoding='utf-8')
    print(SAIDA / 'faces.png', atlas.size)


if __name__ == '__main__':
    main()
