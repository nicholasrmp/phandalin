# -*- coding: utf-8 -*-
"""
Reduz uma folha importada por um FATOR, mantendo pixel art: cantos duros, a
MESMA paleta, nenhum pixel meio transparente.

POR QUE EXISTE. O dragao verde foi desenhado do tamanho de um dragao ADULTO
(Enorme, 3x3 casas) e o JOVEM e Grande (2x2): ele ficou quase o dobro do ogro,
que e da mesma categoria, e transbordava do proprio chao. O tamanho original
fica guardado (`_referencias/pixellab/dragaoVerde-ref/folhas-tamanho-grande`)
para o adulto, e o jovem sai daqui. Parte SEMPRE das originais -- repetir ou
mudar o fator nunca reduz uma figura ja reduzida.

COMO. A folha e uma ampliacao 3x de um desenho logico (`S`), entao a conta e
feita no desenho LOGICO: encolhe-se com area ponderada (Lanczos sobre cor
pre-multiplicada, para a cor da borda nao sangrar para o fundo), o alfa vira
tudo-ou-nada, e cada cor cai na mais proxima da paleta da folha original. So
depois volta a ampliar 3x. O resultado e um desenho nitido na grade nova, nao
uma imagem borrada.

    python src/dev/reduzir-folha.py --origem PASTA --saida PASTA --fator 0.726 NOME [NOME...]

Depois, `importar-pixellab.py --enxugar NOME --chave PERFIL` apara a sobra.
"""
import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
S = 3


def paleta_da(logica):
    """As cores opacas do desenho, da mais comum para a menos."""
    px = logica.reshape(-1, 4)
    px = px[px[:, 3] > 0][:, :3].astype(np.uint32)
    cod = (px[:, 0] << 16) | (px[:, 1] << 8) | px[:, 2]
    cores, n = np.unique(cod, return_counts=True)
    ordem = np.argsort(-n)
    cores = cores[ordem]
    return np.stack([(cores >> 16) & 255, (cores >> 8) & 255, cores & 255], axis=1).astype(np.int32)


def reduzir_celula(cel, novo, paleta):
    """Uma celula LOGICA (h, w, 4) -> (novo_h, novo_w, 4), so com cores da paleta."""
    a = cel[:, :, 3:4].astype(np.float32) / 255
    pre = np.dstack([cel[:, :, :3].astype(np.float32) * a, a[:, :, 0] * 255]).astype(np.float32)
    canais = [np.array(Image.fromarray(pre[:, :, i], 'F').resize(novo, Image.LANCZOS)) for i in range(4)]
    pre = np.dstack(canais)
    alfa = np.clip(pre[:, :, 3], 0, 255)
    opaco = alfa >= 128
    rgb = np.clip(pre[:, :, :3] / np.maximum(alfa[:, :, None] / 255, 1e-3), 0, 255)
    saida = np.zeros((novo[1], novo[0], 4), dtype=np.uint8)
    ys, xs = np.nonzero(opaco)
    if len(ys):
        cor = rgb[ys, xs][:, None, :]
        idx = np.argmin(((cor - paleta[None, :, :]) ** 2).sum(axis=2), axis=1)
        saida[ys, xs, :3] = paleta[idx]
        saida[ys, xs, 3] = 255
    return saida


def reduzir(png, js, fator, destino):
    meta = json.loads(js.read_text(encoding='utf-8'))
    im = Image.open(png).convert('RGBA')
    # o desenho logico: cada bloco 3x3 e um pixel
    logica = np.array(im)[S // 2::S, S // 2::S]
    paleta = paleta_da(logica)
    print(f'{png.name}: {im.width}x{im.height}, {len(paleta)} cores')
    nd = len(meta['dirs'])
    novas, y = {}, 0
    for nome, an in meta['anims'].items():
        lw, lh = an['fw'] // S, an['fh'] // S
        nw, nh = max(1, round(lw * fator)), max(1, round(lh * fator))
        novas[nome] = dict(an, x=0, y=y * S, fw=nw * S, fh=nh * S)
        y += nh * nd
    largura = max(a['fw'] * a['frames'] for a in novas.values())
    altura = sum(a['fh'] * nd for a in novas.values())
    nova = Image.new('RGBA', (largura, altura), (0, 0, 0, 0))
    for nome, an in meta['anims'].items():
        n = novas[nome]
        lw, lh = an['fw'] // S, an['fh'] // S
        for linha in range(nd):
            for f in range(an['frames']):
                x0, y0 = f * lw, (an['y'] // S) + linha * lh
                cel = logica[y0:y0 + lh, x0:x0 + lw]
                r = reduzir_celula(cel, (n['fw'] // S, n['fh'] // S), paleta)
                grande = Image.fromarray(r).resize((n['fw'], n['fh']), Image.NEAREST)
                nova.paste(grande, (f * n['fw'], n['y'] + linha * n['fh']))
    primeira = next(iter(novas.values()))
    saida = dict(meta, w=largura, h=altura, anims=novas, ground=round(meta['ground'] * fator),
                 cell=[primeira['fw'], primeira['fh']])
    destino.mkdir(parents=True, exist_ok=True)
    nova.save(destino / png.name, optimize=True)
    (destino / js.name).write_text(json.dumps(saida, indent=2), encoding='utf-8')
    print(f'  -> {largura}x{altura}  celula {primeira["fw"]}x{primeira["fh"]}  chao {saida["ground"]}')


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--origem', required=True, type=Path)
    p.add_argument('--saida', required=True, type=Path)
    p.add_argument('--fator', required=True, type=float)
    p.add_argument('nomes', nargs='+')
    a = p.parse_args()
    for n in a.nomes:
        reduzir(a.origem / f'{n}.png', a.origem / f'{n}.json', a.fator, a.saida)


if __name__ == '__main__':
    main()
