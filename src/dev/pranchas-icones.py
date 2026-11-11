"""PRANCHAS para julgar ícone novo (gerado no OpenArt) contra a coleção game-icons.net, e as MEDIDAS que comparam os dois.

    python src/dev/pranchas-icones.py <proprios.json> <pasta-de-saida> [--n 24]

Desenha os caminhos SVG sem biblioteca de SVG (o Windows daqui não tem cairo): curvas e arcos viram polígonos, e o
preenchimento é o `nonzero` do canvas (cada subcaminho soma +1 ou −1 pelo sentido). Escreve, na pasta:

- `cego-32.png` e `cego-20.png`: os novos MISTURADOS com ícones da coleção, numerados, em marfim sobre o escuro do
  jogo, no tamanho real. O revisor não sabe quais são os novos: se ele não os acha, eles não destoam.
- `gabarito.json`: quais números são os novos (para conferir o teste cego depois; não vai para o revisor).
- `lado-a-lado.png`: cada novo ao lado de quatro da coleção, grandes (128 px), para comparar traço e detalhe.
- `medidas.json`: espessura do traço (mediana da transformada de distância, em % do lado), densidade de detalhe
  (perímetro / raiz da área) e tinta, de cada novo e da coleção em percentis.
"""
import json
import math
import os
import random
import re
import sys

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FUNDO = (0x1d, 0x1a, 0x28)
TILE = (0x26, 0x23, 0x33)
ICONE = (0xe9, 0xe2, 0xd0)


# ---- caminho SVG -> polígonos ---------------------------------------------------------------------------------------

def tokens(d):
    return re.findall(r'[MmLlHhVvCcSsQqTtAaZz]|-?(?:\d+\.?\d*|\.\d+)(?:[eE]-?\d+)?', d)


def arco(x1, y1, rx, ry, phi, fa, fs, x2, y2, passos=16):
    if rx == 0 or ry == 0:
        return [(x2, y2)]
    rx, ry = abs(rx), abs(ry)
    cp, sp = math.cos(math.radians(phi)), math.sin(math.radians(phi))
    dx, dy = (x1 - x2) / 2, (y1 - y2) / 2
    x1p, y1p = cp * dx + sp * dy, -sp * dx + cp * dy
    lam = x1p ** 2 / rx ** 2 + y1p ** 2 / ry ** 2
    if lam > 1:
        rx, ry = rx * math.sqrt(lam), ry * math.sqrt(lam)
    num = rx ** 2 * ry ** 2 - rx ** 2 * y1p ** 2 - ry ** 2 * x1p ** 2
    den = rx ** 2 * y1p ** 2 + ry ** 2 * x1p ** 2
    co = math.sqrt(max(0, num / den)) if den else 0
    if fa == fs:
        co = -co
    cxp, cyp = co * rx * y1p / ry, -co * ry * x1p / rx
    cx = cp * cxp - sp * cyp + (x1 + x2) / 2
    cy = sp * cxp + cp * cyp + (y1 + y2) / 2
    ang = lambda ux, uy, vx, vy: math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)
    t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry)
    dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry)
    if not fs and dt > 0:
        dt -= 2 * math.pi
    elif fs and dt < 0:
        dt += 2 * math.pi
    pts = []
    for i in range(1, passos + 1):
        t = t1 + dt * i / passos
        x, y = rx * math.cos(t), ry * math.sin(t)
        pts.append((cp * x - sp * y + cx, sp * x + cp * y + cy))
    return pts


def poligonos(d):
    t = tokens(d)
    i, cmd = 0, None
    x = y = sx = sy = 0.0
    ultimo_c = ultimo_q = None
    subs, atual = [], []

    def num():
        nonlocal i
        v = float(t[i])
        i += 1
        return v

    def bez(p0, p1, p2, p3, n=12):
        return [((1 - s) ** 3 * p0[0] + 3 * (1 - s) ** 2 * s * p1[0] + 3 * (1 - s) * s ** 2 * p2[0] + s ** 3 * p3[0],
                 (1 - s) ** 3 * p0[1] + 3 * (1 - s) ** 2 * s * p1[1] + 3 * (1 - s) * s ** 2 * p2[1] + s ** 3 * p3[1])
                for s in (k / n for k in range(1, n + 1))]

    def quad(p0, p1, p2, n=10):
        return [((1 - s) ** 2 * p0[0] + 2 * (1 - s) * s * p1[0] + s ** 2 * p2[0],
                 (1 - s) ** 2 * p0[1] + 2 * (1 - s) * s * p1[1] + s ** 2 * p2[1]) for s in (k / n for k in range(1, n + 1))]

    while i < len(t):
        if re.fullmatch(r'[A-Za-z]', t[i]):
            cmd = t[i]
            i += 1
            if cmd in 'Zz':
                if atual:
                    subs.append(atual)
                atual = []
                x, y = sx, sy
                ultimo_c = ultimo_q = None
                continue
        rel = cmd.islower()
        C = cmd.upper()
        if C == 'M':
            nx, ny = num(), num()
            if rel:
                nx, ny = x + nx, y + ny
            if atual:
                subs.append(atual)
            x, y, sx, sy = nx, ny, nx, ny
            atual = [(x, y)]
            cmd = 'l' if rel else 'L'
            ultimo_c = ultimo_q = None
        elif C == 'L':
            nx, ny = num(), num()
            if rel:
                nx, ny = x + nx, y + ny
            x, y = nx, ny
            atual.append((x, y))
            ultimo_c = ultimo_q = None
        elif C == 'H':
            nx = num()
            x = x + nx if rel else nx
            atual.append((x, y))
            ultimo_c = ultimo_q = None
        elif C == 'V':
            ny = num()
            y = y + ny if rel else ny
            atual.append((x, y))
            ultimo_c = ultimo_q = None
        elif C in 'CS':
            if C == 'C':
                x1, y1 = num(), num()
                if rel:
                    x1, y1 = x + x1, y + y1
            else:
                x1, y1 = (2 * x - ultimo_c[0], 2 * y - ultimo_c[1]) if ultimo_c else (x, y)
            x2, y2, x3, y3 = num(), num(), num(), num()
            if rel:
                x2, y2, x3, y3 = x + x2, y + y2, x + x3, y + y3
            atual += bez((x, y), (x1, y1), (x2, y2), (x3, y3))
            ultimo_c, ultimo_q = (x2, y2), None
            x, y = x3, y3
        elif C in 'QT':
            if C == 'Q':
                x1, y1 = num(), num()
                if rel:
                    x1, y1 = x + x1, y + y1
            else:
                x1, y1 = (2 * x - ultimo_q[0], 2 * y - ultimo_q[1]) if ultimo_q else (x, y)
            x2, y2 = num(), num()
            if rel:
                x2, y2 = x + x2, y + y2
            atual += quad((x, y), (x1, y1), (x2, y2))
            ultimo_q, ultimo_c = (x1, y1), None
            x, y = x2, y2
        elif C == 'A':
            rx, ry, phi, fa, fs, nx, ny = num(), num(), num(), num(), num(), num(), num()
            if rel:
                nx, ny = x + nx, y + ny
            atual += arco(x, y, rx, ry, phi, int(fa), int(fs), nx, ny)
            x, y = nx, ny
            ultimo_c = ultimo_q = None
        else:
            i += 1
    if atual:
        subs.append(atual)
    return subs


def mascara(caminhos, lado):
    """O ícone como máscara booleana lado×lado, com a regra nonzero."""
    acc = np.zeros((lado, lado), np.int32)
    k = lado / 512
    for d in caminhos:
        for sub in poligonos(d):
            if len(sub) < 3:
                continue
            pts = np.array([[px * k * 16, py * k * 16] for px, py in sub], np.int32)  # 4 bits de subpixel
            m = np.zeros((lado, lado), np.uint8)
            cv2.fillPoly(m, [pts], 1, lineType=cv2.LINE_8, shift=4)
            area = sum(sub[j][0] * sub[(j + 1) % len(sub)][1] - sub[(j + 1) % len(sub)][0] * sub[j][1] for j in range(len(sub)))
            acc += (1 if area > 0 else -1) * m.astype(np.int32)
    return acc != 0


def icone_rgb(caminhos, lado, super_=4):
    """Marfim sobre o azulejo escuro, suavizado (desenha 4x maior e reduz)."""
    m = mascara(caminhos, lado * super_).astype(np.float32)
    a = cv2.resize(m, (lado, lado), interpolation=cv2.INTER_AREA)[..., None]
    fundo = np.array(TILE, np.float32)[None, None, :]
    cor = np.array(ICONE, np.float32)[None, None, :]
    return (fundo * (1 - a) + cor * a).astype(np.uint8)


# ---- medidas ------------------------------------------------------------------------------------------------------

def medidas(caminhos):
    m = mascara(caminhos, 256).astype(np.uint8)
    if not m.any():
        return None
    dist = cv2.distanceTransform(m, cv2.DIST_L2, 5)
    # espessura: o dobro da distância à borda no ESQUELETO aproximado (os máximos locais)
    dil = cv2.dilate(dist, np.ones((3, 3), np.uint8))
    crista = (dist >= dil - 1e-6) & (m > 0) & (dist > 0.5)
    esp = float(np.median(dist[crista]) * 2 / 256 * 100) if crista.any() else 0.0
    # a espessura MÍNIMA (p10 da crista): pega a haste fina que a mediana esconde
    esp_min = float(np.percentile(dist[crista], 10) * 2 / 256 * 100) if crista.any() else 0.0
    cont, _ = cv2.findContours(m, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
    perim = sum(cv2.arcLength(c, True) for c in cont)
    area = float(m.sum())
    ys, xs = np.nonzero(m)
    caixa = (xs.max() - xs.min() + 1) * (ys.max() - ys.min() + 1)
    # a LEITURA EM 20 PX: o ícone reduzido a 20 (por área, como a tela) e binarizado, ampliado de volta, contra ele
    # mesmo em 96. Anel fino, espiral e linha de movimento somem na redução e derrubam a nota.
    m96 = mascara(caminhos, 96 * 4).astype(np.float32)
    m96 = cv2.resize(m96, (96, 96), interpolation=cv2.INTER_AREA) > 0.5
    m20 = cv2.resize(mascara(caminhos, 20 * 8).astype(np.float32), (20, 20), interpolation=cv2.INTER_AREA) > 0.5
    v20 = cv2.resize(m20.astype(np.uint8), (96, 96), interpolation=cv2.INTER_NEAREST) > 0
    iou = float((m96 & v20).sum() / max(1, (m96 | v20).sum()))
    return {'espessura%': round(esp, 2), 'espessuraMin%': round(esp_min, 2), 'detalhe': round(perim / math.sqrt(area), 1),
            'tinta': round(float(area / caixa), 2), 'leitura20': round(iou, 2)}


def pct(vs, p):
    s = sorted(vs)
    return s[min(len(s) - 1, int(len(s) * p))]


# ---- pranchas -----------------------------------------------------------------------------------------------------

def fonte(tam):
    for f in ('C:/Windows/Fonts/segoeui.ttf', 'C:/Windows/Fonts/arial.ttf'):
        if os.path.exists(f):
            return ImageFont.truetype(f, tam)
    return ImageFont.load_default()


def prancha(itens, lado, colunas, rotulo, caminho):
    cel = lado + 28
    linhas = math.ceil(len(itens) / colunas)
    img = Image.new('RGB', (colunas * cel + 16, linhas * (cel + 18) + 16), FUNDO)
    dr = ImageDraw.Draw(img)
    f = fonte(13)
    for n, cams in enumerate(itens):
        c, r = n % colunas, n // colunas
        x0, y0 = 8 + c * cel, 8 + r * (cel + 18)
        dr.rectangle([x0, y0, x0 + cel - 6, y0 + cel - 6], fill=TILE)
        img.paste(Image.fromarray(icone_rgb(cams, lado)), (x0 + (cel - 6 - lado) // 2, y0 + (cel - 6 - lado) // 2))
        dr.text((x0, y0 + cel - 4), rotulo(n), fill=(0xb9, 0xb3, 0xa6), font=f)
    img.save(caminho)


def main():
    proprios_arq, saida = sys.argv[1], sys.argv[2]
    n_col = int(sys.argv[sys.argv.index('--n') + 1]) if '--n' in sys.argv else 24
    os.makedirs(saida, exist_ok=True)
    dados = json.load(open(os.path.join(RAIZ, 'public', 'icones-traco.json'), encoding='utf8'))
    proprios = json.load(open(proprios_arq, encoding='utf8'))
    rng = random.Random(7)
    usados = sorted({v.split('+')[0] for v in dados['mapa'].values()})
    amostra = rng.sample(usados, n_col)

    # o teste cego: novos e coleção misturados
    mistura = [('novo', k, proprios[k]) for k in proprios] + [('colecao', n, dados['desenhos'][n]) for n in amostra]
    rng.shuffle(mistura)
    for lado in (32, 20):
        prancha([m[2] for m in mistura], lado, 8, lambda n: f'#{n + 1}', os.path.join(saida, f'cego-{lado}.png'))
    json.dump({f'#{i + 1}': f'{m[0]}:{m[1]}' for i, m in enumerate(mistura)}, open(os.path.join(saida, 'gabarito.json'), 'w'), indent=1)

    # lado a lado, grande: cada novo e quatro da coleção (os mesmos quatro de referência em toda linha)
    ref4 = amostra[:4]
    linhas = []
    for k in proprios:
        linhas += [proprios[k]] + [dados['desenhos'][n] for n in ref4]
    rot = []
    for k in proprios:
        rot += [f'NOVO {k}'[:22]] + [f'col. {n}'[:22] for n in ref4]
    prancha(linhas, 96, 5, lambda n: rot[n], os.path.join(saida, 'lado-a-lado.png'))

    # as medidas
    col = [medidas(dados['desenhos'][n]) for n in usados[:400]]
    col = [m for m in col if m]
    resumo = {k: [round(pct([m[k] for m in col], p), 2) for p in (0.1, 0.25, 0.5, 0.75, 0.9)] for k in ('espessura%', 'espessuraMin%', 'detalhe', 'tinta', 'leitura20')}
    novos = {k: medidas(v) for k, v in proprios.items()}
    json.dump({'colecao_p10_p25_p50_p75_p90': resumo, 'novos': novos}, open(os.path.join(saida, 'medidas.json'), 'w'), indent=1)
    print('coleção (p10, p25, p50, p75, p90):', resumo)
    for k, m in novos.items():
        fora = [n for n in resumo if not resumo[n][0] <= m[n] <= resumo[n][4]]
        print(f'  {k:28s} {m}  {"FORA em " + ", ".join(fora) if fora else "dentro"}')


if __name__ == '__main__':
    main()
