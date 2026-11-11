# -*- coding: utf-8 -*-
"""
O TERRENO DA REGIÃO, lido do MAPA OFICIAL do Obelisco ("Sword Coast region surrounding Phandalin", versão de jogador,
1700 x 2216 px, em `public/mapas/oficial/regiao-jogador.webp`, fora do repositório).

O mapa é dividido em células de 23 px (1,24 milha; o hexágono impresso tem 92,6 px = 5 milhas). Cada célula ganha um
terreno, e a viagem anda por elas (`rules/regiao-terreno.js`):

  .  campo        normal                     T  trilha/estrada  normal, em qualquer terreno
  f  mata         difícil (metade da marcha) h  colina           difícil
  m  montanha     difícil                    ~  mar              não se anda

COMO SE LÊ (medido, não achado):
  - o terreno pelo AGRUPAMENTO das células por cor e textura (k-médias, 9 grupos): o mar é azul e liso, a mata é escura
    e riscada, o campo é claro e liso, a colina é castanha com os montinhos desenhados. Cada grupo foi nomeado olhando a
    sobreposição na arte (`--prova` desenha);
  - a célula AMBÍGUA (o verde das bordas, entre mata, campo e colina) herda o terreno da maioria das vizinhas;
  - as SERRAS (a das Montanhas da Espada e a do Monte Hotenow) são escuras e riscadas como a mata, e o agrupamento as
    confunde: entram por contorno, desenhado sobre o mapa;
  - as ESTRADAS e TRILHAS são os pixels vermelhos (a Estrada Alta é linha cheia; a Trilha de Triboar e as outras,
    pontilhado). Célula com vermelho é trilha.
  - a moldura e a legenda do mapa são campo (ninguém viaja por lá).

Rode: python src/dev/mapa-regiao-terreno.py [--prova]   (escreve `src/rules/regiao-terreno.js`)
"""
import os
import sys
import json
import numpy as np
from PIL import Image, ImageDraw

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ARTE = os.path.join(RAIZ, 'public', 'mapas', 'oficial', 'regiao-jogador.webp')
SAIDA = os.path.join(RAIZ, 'src', 'rules', 'regiao-terreno.js')
C = 23

# o nome de cada grupo do k-médias (semente fixa: o mesmo agrupamento toda vez), pela sobreposição na arte
GRUPO = {0: 'h', 1: '?', 2: '~', 3: '.', 4: 'f', 5: '~', 6: 'h', 7: 'f', 8: '.'}

# as serras, por contorno (px do mapa)
SERRAS = [
    # as Montanhas da Espada, do Monte Icespire até os mineiros sumidos
    # (a crista escura: de leste, depois do Icespire, para sudoeste até os mineiros sumidos e a beira da Estrada Alta)
    # (as encostas verdes também são serra: a crista arborizada em volta do Icespire e ao sul dos mineiros)
    [(800, 1880), (940, 1850), (1100, 1790), (1180, 1690), (1200, 1580), (1400, 1560), (1660, 1530), (1670, 1680),
     (1520, 1690), (1400, 1760), (1280, 1850), (1120, 1940), (960, 2030), (800, 2040)],
    # o Monte Hotenow e a crista que desce dele
    [(480, 360), (660, 340), (840, 380), (840, 460), (660, 640), (500, 680), (460, 520)],
]
# a moldura e a legenda
FORA = [(0, 0, 1700, 40), (0, 0, 40, 2216), (1660, 0, 1700, 2216), (0, 2176, 1700, 2216), (80, 1500, 380, 2160)]


def dentro(pol, x, y):
    n = len(pol); ok = False
    j = n - 1
    for i in range(n):
        xi, yi = pol[i]; xj, yj = pol[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            ok = not ok
        j = i
    return ok


def ler():
    im = np.asarray(Image.open(ARTE).convert('RGB')).astype(np.float32)
    H, W, _ = im.shape
    nx, ny = W // C, H // C
    feat = []
    for j in range(ny):
        for i in range(nx):
            p = im[j * C:(j + 1) * C, i * C:(i + 1) * C].reshape(-1, 3)
            m = p.mean(0); s = p.std(0).mean(); lum = p.mean(1)
            feat.append([m[0], m[1], m[2], s * 1.5, (lum < 90).mean() * 120, (m[2] - m[0]) * 1.5])
    F = np.array(feat)
    rng = np.random.default_rng(1)
    cent = F[rng.choice(len(F), 9, replace=False)]
    for _ in range(60):
        lab = ((F[:, None, :] - cent[None]) ** 2).sum(-1).argmin(1)
        cent = np.array([F[lab == c].mean(0) if (lab == c).any() else cent[c] for c in range(9)])
    grade = [[GRUPO[int(lab[j * nx + i])] for i in range(nx)] for j in range(ny)]
    # o ambíguo herda a maioria das vizinhas (até não sobrar nenhum)
    for _ in range(10):
        mudou = False
        for j in range(ny):
            for i in range(nx):
                if grade[j][i] != '?':
                    continue
                viz = [grade[b][a] for a in range(i - 1, i + 2) for b in range(j - 1, j + 2)
                       if 0 <= a < nx and 0 <= b < ny and grade[b][a] not in '?~']
                if viz:
                    grade[j][i] = max(set(viz), key=viz.count); mudou = True
        if not mudou:
            break
    for j in range(ny):
        for i in range(nx):
            cx, cy = i * C + C / 2, j * C + C / 2
            if grade[j][i] == '?':
                grade[j][i] = '.'
            if grade[j][i] != '~' and any(dentro(s, cx, cy) for s in SERRAS):
                grade[j][i] = 'm'
            if any(x0 <= cx < x1 and y0 <= cy < y1 for x0, y0, x1, y1 in FORA):
                grade[j][i] = '.'
    # as estradas e trilhas: o vermelho
    red = (im[:, :, 0] > 150) & (im[:, :, 1] < 90) & (im[:, :, 2] < 90)
    for j in range(ny):
        for i in range(nx):
            n = red[j * C:(j + 1) * C, i * C:(i + 1) * C].sum()
            cx, cy = i * C + C / 2, j * C + C / 2
            if n >= 4 and not any(x0 <= cx < x1 and y0 <= cy < y1 for x0, y0, x1, y1 in FORA):
                grade[j][i] = 'T'
    return [''.join(l) for l in grade], nx, ny


def prova(linhas):
    base = Image.open(ARTE).convert('RGB')
    d = ImageDraw.Draw(base, 'RGBA')
    cor = {'.': (255, 255, 160, 60), 'f': (0, 120, 0, 110), 'h': (200, 120, 40, 110), 'm': (90, 90, 90, 150),
           '~': (0, 80, 255, 90), 'T': (255, 0, 0, 160)}
    for j, l in enumerate(linhas):
        for i, g in enumerate(l):
            d.rectangle([i * C, j * C, i * C + C - 1, j * C + C - 1], fill=cor[g])
    destino = os.path.join(os.environ.get('TEMP', '.'), 'regiao-terreno-prova.jpg')
    base.resize((850, 1108)).save(destino, quality=82)
    print('prova:', destino)


def main():
    linhas, nx, ny = ler()
    if '--prova' in sys.argv:
        prova(linhas)
    um = lambda v: json.dumps(v, ensure_ascii=False)
    corpo = (
        '// O TERRENO DA REGIÃO, lido do mapa oficial do Obelisco em células de 23 px (1,24 milha).\n'
        '// GERADO por `src/dev/mapa-regiao-terreno.py` — mude lá e rode de novo.\n'
        "// '.' campo · 'T' trilha ou estrada · 'f' mata · 'h' colina · 'm' montanha · '~' mar\n\n"
        f'export const CELULA_PX = {C};\n'
        f'export const TERRENO_DA_REGIAO = [\n' + ''.join(f'  {um(l)},\n' for l in linhas) + '];\n'
    )
    with open(SAIDA, 'w', encoding='utf-8', newline='\n') as f:
        f.write(corpo)
    conta = {g: sum(l.count(g) for l in linhas) for g in '.Tfhm~'}
    print(f'escrito: {SAIDA}  ({nx} x {ny})', conta)


if __name__ == '__main__':
    main()
