# -*- coding: utf-8 -*-
"""
Recorta a folha de retratos do OpenArt (grade 4x3, ordem do elenco) em um
WEBP quadrado por look: `src/art/retratos/<look>.webp`.

A grade e achada pelas faixas escuras entre as celulas, nao por conta fixa:
o modelo nao garante celulas exatamente iguais.

Uso: python src/dev/recortar-retratos.py <folha.jpg> [--so look1,look2]
"""
import argparse
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parents[2]
ORDEM = ['fighter', 'rogue', 'cleric', 'wizard',
         'barbarian', 'druid', 'warlock', 'sorcerer',
         'paladin', 'ranger', 'monk', 'bard']
LADO = 256


def faixas(perfil, n, limiar):
    """Os n trechos claros (celulas) de um perfil de brilho medio."""
    claro = [v > limiar for v in perfil]
    trechos, ini = [], None
    for i, c in enumerate(claro + [False]):
        if c and ini is None:
            ini = i
        elif not c and ini is not None:
            trechos.append((ini, i))
            ini = None
    trechos.sort(key=lambda t: t[1] - t[0], reverse=True)
    return sorted(trechos[:n])


def main():
    p = argparse.ArgumentParser()
    p.add_argument('folha')
    p.add_argument('--so', help='so estes looks (para trocar um retrato refeito)')
    a = p.parse_args()
    im = Image.open(a.folha).convert('RGB')
    W, H = im.size
    cinza = im.convert('L')
    px = cinza.load()
    col = [sum(px[x, y] for y in range(H)) / H for x in range(W)]
    lin = [sum(px[x, y] for x in range(W)) / W for y in range(H)]
    # o vao entre celulas e uma faixa lisa no escuro mais fundo da folha; um
    # manto escuro dentro da celula nunca desce tanto (a media da coluna leva
    # o fundo ardosia junto)
    xs = faixas(col, 4, min(col) + 6)
    ys = faixas(lin, 3, min(lin) + 6)
    print('colunas', xs, 'linhas', ys)
    so = set(a.so.split(',')) if a.so else None
    destino = RAIZ / 'src' / 'art' / 'retratos'
    destino.mkdir(parents=True, exist_ok=True)
    for i, look in enumerate(ORDEM):
        if so and look not in so:
            continue
        (x0, x1), (y0, y1) = xs[i % 4], ys[i // 4]
        # quadrado do tamanho do lado menor, colado embaixo (o busto encosta na base)
        m = 4                                    # sem a linha clara da borda
        lado = min(x1 - x0, y1 - y0) - 2 * m
        cx = (x0 + x1) // 2
        caixa = (cx - lado // 2, y1 - m - lado, cx - lado // 2 + lado, y1 - m)
        im.crop(caixa).resize((LADO, LADO), Image.LANCZOS).save(destino / f'{look}.webp', quality=90)
        print(look, caixa)


if __name__ == '__main__':
    main()
