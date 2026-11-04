"""Confere, casa a casa, o encaixe de um mapa pintado na planta do jogo.

Pinta de VERMELHO as casas que o jogo bloqueia (rocha, parede macica) por cima do mapa pintado. Se o encaixe
estiver certo, o vermelho cai em cima da parede desenhada e o chao fica limpo. Imprime tambem a conta:
quanta casa de chao nosso cai sobre chao pintado, e quanta casa de rocha nossa cai fora dele.

    python src/dev/conferir-encaixe.py casaDaMortePorao1 [escala x0 y0]
"""
import json
import os
import sys

import numpy as np
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TMP = os.path.join(RAIZ, 'src', 'dev', '_tmp')
ARTE = os.path.join(RAIZ, '_referencias', 'casa-da-morte-morvold')


def carregar(cena):
    planta = json.load(open(os.path.join(TMP, 'plantas.json'), encoding='utf-8'))[cena]
    alinhamento = json.load(open(os.path.join(TMP, 'alinhamento.json'), encoding='utf-8'))[cena]
    return planta, alinhamento


def main():
    cena = sys.argv[1]
    p, a = carregar(cena)
    if len(sys.argv) > 4:
        a = {**a, 'escala': float(sys.argv[2]), 'x0': float(sys.argv[3]), 'y0': float(sys.argv[4])}
    im = Image.open(os.path.join(ARTE, a['arquivo'])).convert('RGB')
    if a.get('espelho'):
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
    if a['giro']:
        im = im.rotate(-a['giro'], expand=True)
    arr = np.asarray(im).astype(np.float32)
    bri = arr.mean(axis=2) / 255
    # chao pintado: cinza medio. A parede e quase preta; o fundo da folha e branco.
    pintado = (bri > 0.14) & (bri < 0.50)
    S, x0, y0 = a['escala'], a['x0'], a['y0']
    H, W = pintado.shape

    def amostra(x, y):
        v, n = 0, 0
        for ax in (0.3, 0.5, 0.7):
            for ay in (0.3, 0.5, 0.7):
                ix, iy = int(x0 + (x + ax) * S), int(y0 + (y + ay) * S)
                if 0 <= ix < W and 0 <= iy < H:
                    v += pintado[iy, ix]
                n += 1
        return v / n

    bloqueia = lambda x, y: p['terreno'][y][x] in 'RM'
    chao = [amostra(x, y) for y in range(p['h']) for x in range(p['w']) if not bloqueia(x, y)]
    rocha = [amostra(x, y) for y in range(p['h']) for x in range(p['w']) if bloqueia(x, y)]
    print(f"{cena}: {S} px/casa, origem ({x0}, {y0}), giro {a['giro']}")
    print(f'  chao nosso sobre chao pintado: {np.mean(chao):.3f}   (quanto mais perto de 1, melhor)')
    print(f'  rocha nossa sobre chao pintado: {np.mean(rocha):.3f}   (quanto mais perto de 0, melhor)')
    print(f'  nota = {np.mean(chao) - np.mean(rocha):+.3f}')

    saida = im.copy()
    tinta = Image.new('RGBA', im.size, (0, 0, 0, 0))
    from PIL import ImageDraw
    d = ImageDraw.Draw(tinta)
    for y in range(p['h']):
        for x in range(p['w']):
            if not bloqueia(x, y):
                continue
            d.rectangle([x0 + x * S, y0 + y * S, x0 + (x + 1) * S, y0 + (y + 1) * S], fill=(255, 40, 40, 90))
    for i in range(p['w'] + 1):
        d.line([x0 + i * S, y0, x0 + i * S, y0 + p['h'] * S], fill=(0, 255, 255, 70))
    for j in range(p['h'] + 1):
        d.line([x0, y0 + j * S, x0 + p['w'] * S, y0 + j * S], fill=(0, 255, 255, 70))
    saida = Image.alpha_composite(saida.convert('RGBA'), tinta).convert('RGB')
    destino = os.path.join(TMP, f'conferir-{cena}.png')
    saida.save(destino)
    print('  ', destino)


if __name__ == '__main__':
    main()
