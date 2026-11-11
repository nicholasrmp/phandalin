# -*- coding: utf-8 -*-
"""
Corta uma FOLHA DE QUADROS gerada de uma vez só (o gerador desenha os 16 momentos da magia numa imagem) e grava
`public/efeitos/anim/<nome>.webp`, no mesmo formato que `importar-video-efeito.py` produz.

POR QUE ELE EXISTE, E QUANDO NÃO USAR: uma folha dessas custa UMA geração de imagem, contra uma de vídeo. Mas o gerador não sabe
o que é tempo: cada célula é um desenho novo, e não o quadro seguinte do anterior. Medido na mesma magia, a diferença entre
quadros vizinhos foi 99 na folha gerada e 27 na tirada de vídeo — a folha PISCA onde o vídeo escorre. Serve para fogo e faísca,
que tremem de verdade; não serve para o que gira ou escorre (portal, névoa, redemoinho).

As células saem de tamanhos diferentes e com calha branca, então o corte não supõe grade: acha as faixas ESCURAS em cada eixo.

    python src/dev/importar-folha-efeito.py <nome> <url ou arquivo> [--lado 192] [--contorno]
"""
import math
import sys
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image

RAIZ = Path(__file__).resolve().parents[2]
ORIG = RAIZ / '_referencias' / 'efeitos' / 'folhas'
SAIDA = RAIZ / 'public' / 'efeitos' / 'anim'
PISO = 20


def obter(origem, nome):
    ORIG.mkdir(parents=True, exist_ok=True)
    if not origem.startswith('http'):
        return Image.open(origem).convert('RGB')
    guardada = ORIG / f'{nome}.jpg'
    req = urllib.request.Request(origem, headers={'User-Agent': 'Mozilla/5.0'})
    guardada.write_bytes(urllib.request.urlopen(req, timeout=120).read())
    return Image.open(guardada).convert('RGB')


def faixas(perfil, minimo):
    """Os trechos seguidos em que o perfil é verdadeiro — as bandas escuras, que são as células."""
    saida, i = [], 0
    while i < len(perfil):
        if perfil[i]:
            j = i
            while j < len(perfil) and perfil[j]:
                j += 1
            if j - i >= minimo:
                saida.append((i, j))
            i = j
        else:
            i += 1
    return saida


def celulas(im):
    a = np.asarray(im.convert('L'), dtype=np.float32)
    escuro = a < 110
    h, w = a.shape
    linhas = faixas(escuro.mean(axis=1) > 0.3, h // 12)
    colunas = faixas(escuro.mean(axis=0) > 0.3, w // 12)
    return [(c0, l0, c1, l1) for (l0, l1) in linhas for (c0, c1) in colunas]


def preto_para_alfa(im, contorno):
    rgb = np.asarray(im.convert('RGB'), dtype=np.float32)
    m = rgb.max(axis=2)
    alfa = np.clip((m - PISO) * 255 / (255 - PISO), 0, 255)
    cor = np.where(m[..., None] > 0, rgb * 255 / np.maximum(m[..., None], 1), 0)
    if contorno:
        hh, ww = m.shape
        yy, xx = np.mgrid[0:hh, 0:ww]
        d = np.hypot(xx + 0.5 - ww / 2, yy + 0.5 - hh / 2) / (min(ww, hh) / 2)
        alfa = alfa * np.clip((1 - d) / 0.12, 0, 1)
    return Image.fromarray(np.dstack([np.clip(cor, 0, 255), alfa]).astype(np.uint8), 'RGBA')


def main():
    args = [a for i, a in enumerate(sys.argv[1:], 1) if not a.startswith('--') and not sys.argv[i - 1].startswith('--')]
    nome, origem = args[0], args[1]
    lado = int(sys.argv[sys.argv.index('--lado') + 1]) if '--lado' in sys.argv else 192
    im = obter(origem, nome)
    caixas = celulas(im)
    if not caixas:
        sys.exit('nenhuma célula achada: a folha não tem calha clara entre os quadros')
    quadros = [preto_para_alfa(im.crop(b).resize((lado, lado), Image.LANCZOS), '--contorno' in sys.argv) for b in caixas]
    colunas = math.ceil(math.sqrt(len(quadros)))
    linhas = math.ceil(len(quadros) / colunas)
    folha = Image.new('RGBA', (colunas * lado, linhas * lado))
    for i, q in enumerate(quadros):
        folha.paste(q, ((i % colunas) * lado, (i // colunas) * lado))
    SAIDA.mkdir(parents=True, exist_ok=True)
    destino = SAIDA / f'{nome}.webp'
    folha.save(destino, 'WEBP', quality=72, method=6, alpha_quality=80)
    print(f'{nome}: {len(quadros)} quadros de {lado}px, {destino.stat().st_size // 1024} KB')
    print(f"  '{nome}': {{ n: {len(quadros)}, colunas: {colunas} }},")


if __name__ == '__main__':
    main()
