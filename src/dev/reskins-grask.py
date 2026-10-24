# -*- coding: utf-8 -*-
"""
A FURIA do Grask como RESKIN, SEM GASTAR GERACOES: uma aura vermelha de um
pixel em volta da silhueta, por fora do contorno preto. Testada contra pele
avermelhada (o verde-cinza virava lama) e contra as duas juntas: a aura
sozinha e o que mais se le no tabuleiro.

Saida: pastas `<origem>-furia`, prontas para o `importar-grask.sh`.
"""
import json
import shutil
import sys
from pathlib import Path
from PIL import Image

R = Path(__file__).resolve().parents[2] / '_referencias' / 'pixellab'
AURA = (214, 40, 30, 255)


def aura(folha, C):
    """Acende os pixels vazios encostados na figura, celula a celula."""
    px = folha.load()
    W, H = folha.size
    anel = []
    for y in range(H):
        for x in range(W):
            if px[x, y][3]:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                q = (x + dx, y + dy)
                # so dentro da mesma celula: a aura nao vaza para a vizinha
                if (0 <= q[0] < W and 0 <= q[1] < H and q[0] // C == x // C and q[1] // C == y // C
                        and px[q][3]):
                    anel.append((x, y))
                    break
    # sem aura abaixo dos pes: o importador ancora a figura pelo pixel mais
    # baixo, e a aura no chao subia o Grask 1 px ao entrar em furia
    fundo = {}
    for y in range(H):
        for x in range(W):
            if px[x, y][3]:
                k = (x // C, y // C)
                fundo[k] = max(fundo.get(k, -1), y)
    for x, y in anel:
        if y <= fundo.get((x // C, y // C), H):
            px[x, y] = AURA


def main(pastas):
    for origem in map(Path, pastas):
        jm = next(j for j in origem.glob('*.json') if j.name not in ('armas.json', 'meta.json'))
        meta = json.loads(jm.read_text(encoding='utf-8'))['spritesheet']
        folha = Image.open(origem / meta['path']).convert('RGBA')
        aura(folha, meta['cell_size']['width'])
        destino = origem.parent / f'{origem.name}-furia'
        if destino.exists():
            shutil.rmtree(destino)
        shutil.copytree(origem, destino)
        folha.save(destino / meta['path'])
        print(destino)


if __name__ == '__main__':
    main(sys.argv[1:])
