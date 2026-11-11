"""A COR POR PEÇA do ícone de traço (tema Esmalte): a rolha da poção numa cor e o frasco noutra.

O QUE FUNCIONA, medido (2026-11-10, três revisores em sonnet sobre pranchas de antes e depois dos 285 primeiros, e as
medidas de `avaliar-pecas.py`): 160 melhoraram, 117 deram na mesma, 8 pioraram, e só os 160 ficaram. Funciona a cor de
MATERIAL na peça concreta — ouro (48 de 55 melhoraram), osso, madeira, couro, planta, pedra, aço na lâmina — e a cor de
efeito que É o conceito (a chama laranja, o raio amarelo, o rosto vermelho da fúria). Falha a cor de efeito viva em
peça que não pede (olhos verdes, faíscas de duas cores, um pulmão verde, chama azul no ícone de fogo: frio acertou 8 de
25, psíquico 3 de 12) e a peça pequena (a mediana da maior peça dos que deram na mesma tinha 26 px em 20, contra 44 dos
que melhoraram). O parecer de cada um fica em `_referencias/icones-pecas/avaliacao/parecer-todos.json`.

    python src/dev/pecas-icones.py folha <pasta> <chave1,chave2,...>
        desenha uma prancha por lote, com cada PEÇA do ícone numerada e pintada numa cor provisória, e grava
        `<pasta>/indice.json` (chave -> número de peças), para quem escolhe as cores ver o que é cada peça.
    python src/dev/pecas-icones.py gerar <escolhas.json>
        lê `{ chave: { "<n>": "<família>" } }` e escreve `src/dev/icones-traco/pecas.json` com o desenho de cada peça
        escolhida, que `importar-icones-traco.mjs` junta ao arquivo do jogo.

O QUE É PEÇA: a coleção desenha cada ícone como um caminho com vários subcaminhos; as peças são os de FORA (os furos
são subcaminhos em sentido contrário, dentro de uma peça) com pelo menos 3% da área. Só dá para pintar à parte o que o
desenho separa de verdade: a lâmina e o cabo que se tocam são uma peça só.

COMO SAI: o subcaminho de uma peça começa num `m` RELATIVO ao ponto onde o anterior acabou, então ele não pode ser
copiado solto. Aqui o caminho é lido inteiro (`pranchas-icones.py`), o começo de cada subcaminho vira `M x y` absoluto
e a peça leva junto os furos que caem dentro dela (o ponto inicial do furo dentro do polígono da peça). O jogo pinta o
ícone inteiro na cor da família e por cima, peça a peça, as escolhidas na família delas (`art/icons.js desenharTraco`).
"""
import json
import math
import os
import re
import sys
import importlib.util as iu

import cv2
import numpy as np
from PIL import Image, ImageDraw

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_sp = iu.spec_from_file_location('pranchas', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pranchas-icones.py'))
pr = iu.module_from_spec(_sp)
_sp.loader.exec_module(pr)

TOKEN = re.compile(r'[MmLlHhVvCcSsQqTtAaZz]|-?(?:\d+\.?\d*|\.\d+)(?:[eE]-?\d+)?')


def subcaminhos(d):
    """[(texto do subcaminho com começo absoluto, polígono)] na ordem do desenho."""
    polis = pr.poligonos(d)
    # as posições de cada M/m no texto e o começo absoluto de cada subcaminho (o 1º ponto do polígono)
    marcas = [m.start() for m in re.finditer(r'[Mm]', d)]
    saida = []
    for i, ini in enumerate(marcas):
        fim = marcas[i + 1] if i + 1 < len(marcas) else len(d)
        trecho = d[ini:fim]
        # os tokens COM a posição: procurar o texto do número cortava errado ("1" dentro de "18")
        toks = list(TOKEN.finditer(trecho))
        if i >= len(polis) or len(toks) < 3:
            continue
        x, y = polis[i][0]
        resto_toks = toks[3:]
        # par extra depois do m/M é lineto implícito: relativo no m, absoluto no M
        prefixo = ''
        if resto_toks and not re.fullmatch(r'[A-Za-z]', resto_toks[0].group()):
            prefixo = 'l' if toks[0].group() == 'm' else 'L'
        corpo = trecho[toks[2].end():]
        saida.append((f'M{x:.1f} {y:.1f}{prefixo}{corpo}', polis[i]))
    return saida


def area(p):
    return sum(p[j][0] * p[(j + 1) % len(p)][1] - p[(j + 1) % len(p)][0] * p[j][1] for j in range(len(p))) / 2


def dentro(pt, poli):
    return cv2.pointPolygonTest(np.array(poli, np.float32), (float(pt[0]), float(pt[1])), False) >= 0


def pecas(caminhos):
    """[{d, area}] das peças de fora (com os furos de dentro), da maior para a menor."""
    subs = []
    for d in caminhos:
        subs += subcaminhos(d)
    if not subs:
        return []
    maior = max(subs, key=lambda s: abs(area(s[1])))
    sinal = 1 if area(maior[1]) > 0 else -1
    fora = [(t, p) for t, p in subs if area(p) * sinal > 0]
    furos = [(t, p) for t, p in subs if area(p) * sinal < 0]
    total = sum(abs(area(p)) for _, p in fora)
    res = []
    for t, p in fora:
        a = abs(area(p))
        if a < 0.03 * total:
            continue
        meus = [ft for ft, fp in furos if dentro(fp[0], p)]
        res.append({'d': t + ''.join(meus), 'area': a})
    return sorted(res, key=lambda r: -r['area'])


CORES = [(233, 226, 208), (236, 138, 62), (114, 189, 236), (95, 208, 126), (234, 147, 200), (234, 188, 92), (173, 143, 230), (238, 118, 96)]


def folha(pasta, chaves):
    dados = json.load(open(os.path.join(RAIZ, 'public', 'icones-traco.json'), encoding='utf8'))
    os.makedirs(pasta, exist_ok=True)
    indice = {}
    itens = []
    for k in chaves:
        v = dados['mapa'].get(k)
        if not v or '+' in v:
            continue
        ps = pecas(dados['desenhos'][v])
        if len(ps) < 2:
            continue
        indice[k] = {'pecas': len(ps), 'familia': dados.get('familias', {}).get(k), 'desenho': v}
        itens.append((k, v, ps))
    lado, por_linha = 150, 6
    for lote in range(0, len(itens), 24):
        grupo = itens[lote:lote + 24]
        linhas = math.ceil(len(grupo) / por_linha)
        img = Image.new('RGB', (por_linha * (lado + 10) + 10, linhas * (lado + 46) + 10), (20, 18, 28))
        dr = ImageDraw.Draw(img)
        f = pr.fonte(12)
        fn = pr.fonte(15)
        for n, (k, v, ps) in enumerate(grupo):
            c, r = n % por_linha, n // por_linha
            x0, y0 = 10 + c * (lado + 10), 10 + r * (lado + 46)
            dr.rectangle([x0, y0, x0 + lado, y0 + lado], fill=(38, 35, 51))
            for i, p in enumerate(ps):
                m = pr.mascara([p['d']], lado * 4).astype(np.float32)
                m = cv2.resize(m, (lado, lado), interpolation=cv2.INTER_AREA)
                cor = np.array(CORES[i % len(CORES)], np.float32)
                bloco = np.asarray(img.crop((x0, y0, x0 + lado, y0 + lado)), np.float32)
                bloco = bloco * (1 - m[..., None]) + cor * m[..., None]
                img.paste(Image.fromarray(bloco.astype(np.uint8)), (x0, y0))
                ys, xs = np.nonzero(m > 0.5)
                if len(xs):
                    cx, cy = int(np.median(xs)), int(np.median(ys))
                    dr = ImageDraw.Draw(img)
                    dr.text((x0 + cx - 4, y0 + cy - 8), str(i), fill=(0, 0, 0), font=fn, stroke_width=2, stroke_fill=(255, 255, 255))
            dr.text((x0, y0 + lado + 3), k[:24], fill=(200, 195, 185), font=f)
            dr.text((x0, y0 + lado + 19), f'{v[:22]} · {len(ps)} peças', fill=(140, 135, 125), font=f)
        img.save(os.path.join(pasta, f'pecas-{lote // 24 + 1:02d}.png'))
    json.dump(indice, open(os.path.join(pasta, 'indice.json'), 'w'), indent=1)
    print(f'{len(itens)} ícones com 2+ peças, {math.ceil(len(itens) / 24)} pranchas em {pasta}')


def gerar(escolhas_arq):
    dados = json.load(open(os.path.join(RAIZ, 'public', 'icones-traco.json'), encoding='utf8'))
    escolhas = json.load(open(escolhas_arq, encoding='utf8'))
    saida = {}
    for k, por in escolhas.items():
        v = dados['mapa'].get(k)
        if not v:
            continue
        ps = pecas(dados['desenhos'][v.split('+')[0]])
        # `base` diz de que desenho a peça saiu: o importador recusa a peça se o ícone da chave mudar depois
        lista = [{'d': ps[int(i)]['d'], 'familia': fam, 'base': v.split('+')[0]} for i, fam in por.items() if int(i) < len(ps) and fam]
        if lista:
            saida[k] = lista
    arq = os.path.join(RAIZ, 'src', 'dev', 'icones-traco', 'pecas.json')
    json.dump(saida, open(arq, 'w', encoding='utf8'), ensure_ascii=False)
    print(f'{len(saida)} ícones com cor por peça, {sum(len(v) for v in saida.values())} peças -> {os.path.relpath(arq, RAIZ)}')


if __name__ == '__main__':
    if sys.argv[1] == 'folha':
        folha(sys.argv[2], sys.argv[3].split(','))
    else:
        gerar(sys.argv[2])
