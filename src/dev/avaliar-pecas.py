"""AVALIA A COR POR PEÇA dos ícones (tema Esmalte): para cada ícone com peças coloridas, a versão de uma cor só (a
família) ao lado da versão com as peças, e as medidas que dizem se a peça ajuda ou atrapalha.

    python src/dev/avaliar-pecas.py <pasta-de-saida>

Desenha o Esmalte como `art/icons.js desenharTraco` (degradê das duas cores da família, contorno escuro; sem o brilho,
que é enfeite), com as cores lidas de `PALETA_DO_ESMALTE`, em 48 e 24 px sobre o azulejo do jogo. Escreve:
- `antes-depois-NN.png`: por ícone, [uma cor 48] [peças 48] [uma cor 24] [peças 24];
- `medidas.json`: por ícone e por peça —
  · `contraste`: razão de contraste WCAG da cor média da peça contra o azulejo escuro (abaixo de 3 a peça some);
  · `distancia`: diferença de cor (ΔE em Lab) entre a peça e a família do ícone (abaixo de ~15 a troca não se vê);
  · `px20`: quantos pixels a peça ocupa no ícone de 20 px (abaixo de ~6 ela vira ruído);
  · `cores`: quantas famílias o ícone soma (mais de 3 tende a ficar carnavalesco).
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
AZULEJO = (0x1b, 0x19, 0x26)


def paleta():
    src = open(os.path.join(RAIZ, 'src', 'art', 'icons.js'), encoding='utf8').read()
    bloco = src[src.index('export const PALETA_DO_ESMALTE'):]
    bloco = bloco[:bloco.index('};')]
    return {m.group(1) or m.group(2): (m.group(3), m.group(4))
            for m in re.finditer(r"(?:'([^']+)'|(\w+)):\s*\['(#[0-9a-f]{6})',\s*'(#[0-9a-f]{6})'\]", bloco)}


def rgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.float32)


def degrade(lado, cima, baixo):
    """O degradê vertical do Esmalte: de `cima` a `baixo` até 62% da altura, depois `baixo`."""
    t = np.clip(np.arange(lado) / (lado * 0.62), 0, 1)[:, None, None]
    return rgb(cima)[None, None, :] * (1 - t) + rgb(baixo)[None, None, :] * t


def camada(img, caminhos, cores, lado, sup=4):
    """Pinta caminhos em Esmalte sobre `img` (float, lado×lado×3): contorno escuro e degradê."""
    m = pr.mascara(caminhos, lado * sup).astype(np.uint8)
    raio = max(1, int(round(512 * 0.033 * lado * sup / 512 * 0.92)))
    borda = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * raio + 1, 2 * raio + 1)))
    m = cv2.resize(m.astype(np.float32), (lado, lado), interpolation=cv2.INTER_AREA)[..., None]
    b = cv2.resize(borda.astype(np.float32), (lado, lado), interpolation=cv2.INTER_AREA)[..., None]
    escuro = np.array([8, 6, 12], np.float32)
    img = img * (1 - b * 0.85) + escuro * b * 0.85
    return img * (1 - m) + degrade(lado, *cores) * m, m[..., 0]


def desenhar(desenho, familia, pecas, pal, lado):
    img = np.tile(np.array(AZULEJO, np.float32), (lado, lado, 1))
    cores = pal.get(familia, pal['acao'])
    img, _ = camada(img, desenho, cores, lado)
    mascaras = []
    for pc in pecas or []:
        img, m = camada(img, [pc['d']], pal.get(pc['familia'], cores), lado)
        mascaras.append(m)
    return img.clip(0, 255).astype(np.uint8), mascaras


def lab(c):
    return cv2.cvtColor(np.uint8([[c]]), cv2.COLOR_RGB2LAB)[0, 0].astype(np.float32) * [100 / 255, 1, 1] - [0, 128, 128]


def luminancia(c):
    c = np.asarray(c, np.float32) / 255
    c = np.where(c <= 0.03928, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def contraste(a, b):
    la, lb = sorted([luminancia(a), luminancia(b)], reverse=True)
    return (la + 0.05) / (lb + 0.05)


def main():
    saida = sys.argv[1]
    os.makedirs(saida, exist_ok=True)
    dados = json.load(open(os.path.join(RAIZ, 'public', 'icones-traco.json'), encoding='utf8'))
    pal = paleta()
    chaves = sorted(dados.get('pecas', {}))
    medidas, linhas = {}, []
    for k in chaves:
        desenho = dados['desenhos'][dados['mapa'][k].split('+')[0]]
        fam = dados['familias'].get(k)
        pecas = dados['pecas'][k]
        a48, _ = desenhar(desenho, fam, None, pal, 48)
        b48, _ = desenhar(desenho, fam, pecas, pal, 48)
        a24, _ = desenhar(desenho, fam, None, pal, 24)
        b24, _ = desenhar(desenho, fam, pecas, pal, 24)
        _, m20 = desenhar(desenho, fam, pecas, pal, 20)
        base = pal.get(fam, pal['acao'])
        cor_base = (rgb(base[0]) + rgb(base[1])) / 2
        por = []
        for pc, m in zip(pecas, m20):
            c = pal.get(pc['familia'], base)
            media = (rgb(c[0]) + rgb(c[1])) / 2
            por.append({
                'familia': pc['familia'],
                'contraste': round(float(contraste(media, AZULEJO)), 2),
                'distancia': round(float(np.linalg.norm(lab(media) - lab(cor_base))), 1),
                'px20': round(float(m.sum()), 1),
            })
        medidas[k] = {'familia': fam, 'desenho': dados['mapa'][k], 'cores': len({fam, *[p['familia'] for p in pecas]}), 'pecas': por}
        linhas.append((k, a48, b48, a24, b24))
    # as pranchas: 4 colunas de ícone por linha, cada um com os 4 quadros
    f = pr.fonte(11)
    por_prancha, por_linha = 24, 4
    celula_w, celula_h = 48 * 2 + 24 * 2 + 30, 48 + 22
    for n0 in range(0, len(linhas), por_prancha):
        grupo = linhas[n0:n0 + por_prancha]
        img = Image.new('RGB', (por_linha * celula_w + 10, math.ceil(len(grupo) / por_linha) * celula_h + 10), (14, 13, 22))
        dr = ImageDraw.Draw(img)
        for i, (k, a48, b48, a24, b24) in enumerate(grupo):
            x0, y0 = 10 + (i % por_linha) * celula_w, 10 + (i // por_linha) * celula_h
            img.paste(Image.fromarray(a48), (x0, y0))
            img.paste(Image.fromarray(b48), (x0 + 50, y0))
            img.paste(Image.fromarray(a24), (x0 + 104, y0 + 12))
            img.paste(Image.fromarray(b24), (x0 + 130, y0 + 12))
            dr.text((x0, y0 + 50), f'{n0 + i + 1}. {k}'[:30], fill=(200, 195, 185), font=f)
        img.save(os.path.join(saida, f'antes-depois-{n0 // por_prancha + 1:02d}.png'))
    json.dump(medidas, open(os.path.join(saida, 'medidas.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    # o resumo das medidas
    fracas = [(k, p) for k, v in medidas.items() for p in v['pecas'] if p['contraste'] < 3]
    iguais = [(k, p) for k, v in medidas.items() for p in v['pecas'] if p['distancia'] < 15]
    miudas = [(k, p) for k, v in medidas.items() for p in v['pecas'] if p['px20'] < 6]
    muitas = [k for k, v in medidas.items() if v['cores'] > 3]
    print(f'{len(medidas)} ícones, {sum(len(v["pecas"]) for v in medidas.values())} peças')
    print(f'  peças que SOMEM no escuro (contraste < 3): {len(fracas)} — famílias: {sorted({p["familia"] for _, p in fracas})}')
    print(f'  peças IGUAIS à família (dE < 15): {len(iguais)}')
    print(f'  peças MIÚDAS em 20 px (< 6 px): {len(miudas)}')
    print(f'  ícones com mais de 3 cores: {len(muitas)}')


if __name__ == '__main__':
    main()
