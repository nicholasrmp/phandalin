# -*- coding: utf-8 -*-
"""
Os itens da aventura do Brenn como RESKIN, SEM GASTAR GERACOES:
a Lightbringer (a cabeca da maca vira ouro, nas tres armaduras) e a
Dragonguard (o aco das placas vira bronze, menos a arma).

ONDE ESTA A CABECA. A Dara tinha a medida da espada de cada quadro (o
`armas.json` das pastas `-sem-arma`); o Brenn nao tem. A cabeca da maca e
achada pela FORMA: e uma ilha de aco (cercada de contorno preto) pequena,
redonda, encostada no vazio e a mais longe do centro da figura. As outras
ilhas pequenas de aco -- ombreira, fivela -- ficam rente ao corpo. O cinza da
sobreveste passa no teste de cor do aco, mas e uma mancha grande e nao
encosta no vazio.

Saida: pastas `<origem>-lightbringer`, prontas para o importador.
"""
import importlib.util
import json
import shutil
from pathlib import Path
from PIL import Image

AQUI = Path(__file__).resolve().parent
_spec = importlib.util.spec_from_file_location('rd', AQUI / 'reskins-dara.py')
rd = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(rd)

C_ = rd.R / 'cleric-2e171ced'


def ilhas_de_aco(px, x0, y0, C):
    acos = {(x, y) for y in range(C) for x in range(C) if rd.aco(px[x0 + x, y0 + y])}
    visto, saida = set(), []
    for p0 in acos:
        if p0 in visto:
            continue
        pilha, comp = [p0], []
        visto.add(p0)
        while pilha:
            x, y = pilha.pop()
            comp.append((x, y))
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    q = (x + dx, y + dy)
                    if q in acos and q not in visto:
                        visto.add(q)
                        pilha.append(q)
        saida.append(comp)
    return saida


def cabeca_da_maca(px, x0, y0, C, maior=80, longe=12, alongada=2.2, cheia=0.4):
    """A ilha da cabeca da maca neste quadro, ou None."""
    opacos = [(x, y) for y in range(C) for x in range(C) if px[x0 + x, y0 + y][3]]
    if not opacos:
        return None
    cx = sorted(p[0] for p in opacos)[len(opacos) // 2]
    cy = sorted(p[1] for p in opacos)[len(opacos) // 2]

    def exposto(x, y):
        for dx in range(-2, 3):
            for dy in range(-2, 3):
                X, Y = x + dx, y + dy
                if not (0 <= X < C and 0 <= Y < C) or px[x0 + X, y0 + Y][3] == 0:
                    return True
        return False

    melhor, nota = None, -1
    for comp in ilhas_de_aco(px, x0, y0, C):
        xs = [p[0] for p in comp]
        ys = [p[1] for p in comp]
        w, h = max(xs) - min(xs) + 1, max(ys) - min(ys) + 1
        if not (5 <= len(comp) <= maior and min(w, h) >= 3 and max(w, h) <= alongada * min(w, h)
                and len(comp) >= cheia * w * h):
            continue
        if sum(exposto(x, y) for x, y in comp) < 0.25 * len(comp):
            continue
        mx, my = sum(xs) / len(xs), sum(ys) / len(ys)
        # o capacete (de placas) tambem e aco redondo e longe do centro: mas
        # fica em cima e no meio, e a maca erguida sai para o lado
        if my < cy and abs(mx - cx) < 7:
            continue
        d = ((mx - cx) ** 2 + (my - cy) ** 2) ** 0.5
        if d > nota:
            melhor, nota = comp, d
    return melhor if nota >= longe else None


# OS QUADROS EM QUE A FORMA ERRA, marcados OLHANDO (fileira:quadro da folha do
# PixelLab -> centro da cabeca, ou None quando ela some atras da perna). A
# pose e a mesma nas tres armaduras -- as edicoes de armadura mantem a pose --,
# entao a marca vale para todas. Ali a cabeca encosta na mao ou na perna e
# vira uma ilha so com elas; o que se pinta e o disco de aco em volta do
# ponto.
A_MAO = {
    (0, 1): (24, 51), (3, 1): (25, 51), (3, 2): (26, 50),      # sudeste
    (0, 2): (36, 52), (4, 2): None, (4, 3): (36, 52),          # leste
    (11, 8): (53, 41),                                         # nordeste, golpe
    (6, 3): (53, 46), (6, 4): (53, 45),                        # norte, andar
}
RAIO = 4


def disco(px, x0, y0, C, ponto):
    cx, cy = ponto
    return [(x, y) for y in range(max(0, cy - RAIO), min(C, cy + RAIO + 1))
            for x in range(max(0, cx - RAIO), min(C, cx + RAIO + 1))
            if (x - cx) ** 2 + (y - cy) ** 2 <= RAIO ** 2 and rd.aco(px[x0 + x, y0 + y])]


def perto_de(px, x0, y0, C, alvo, raio=6, maior=80):
    """A ilha de aco mais perto de `alvo` (o centro da cabeca num quadro
    vizinho). Para os quadros em que a cabeca encosta no corpo e o teste de
    forma nao a reconhece: o vizinho sabe onde ela estava."""
    melhor, dist = None, raio
    for comp in ilhas_de_aco(px, x0, y0, C):
        xs = [p[0] for p in comp]
        ys = [p[1] for p in comp]
        w, h = max(xs) - min(xs) + 1, max(ys) - min(ys) + 1
        # a mesma forma de cabeca: pequena, redonda e cheia
        if not (5 <= len(comp) <= maior and min(w, h) >= 3 and max(w, h) <= 2.2 * min(w, h)
                and len(comp) >= 0.4 * w * h):
            continue
        mx = sum(p[0] for p in comp) / len(comp)
        my = sum(p[1] for p in comp) / len(comp)
        d = ((mx - alvo[0]) ** 2 + (my - alvo[1]) ** 2) ** 0.5
        if d < dist:
            melhor, dist = comp, d
    return melhor


def centro(comp):
    return (sum(p[0] for p in comp) / len(comp), sum(p[1] for p in comp) / len(comp))


def cabecas(px, meta, C, **forma):
    """(fileira, quadro) -> pixels da cabeca da arma em cada quadro. A do
    martelo e mais comprida que a da maca (`alongada`, `cheia`)."""
    achadas, celulas, fileiras = {}, {}, {}
    for r in meta['rows']:
        n = len(r['directions']) if r['type'] == 'rotations' else r['frame_count']
        fileiras[r['row']] = r
        for f in range(n):
            celulas[(r['row'], f)] = (f * C, r['row'] * C)
            ilha = cabeca_da_maca(px, f * C, r['row'] * C, C, **forma)
            if ilha:
                achadas[(r['row'], f)] = ilha
    # onde a forma falhou, o vizinho: no andar e no golpe, o quadro anterior
    # ou o seguinte; no parado, o 1o quadro do andar na mesma direcao
    andar = {r['direction']: r['row'] for r in meta['rows']
             if r['type'] == 'animation' and r['animation'].startswith('walk')}
    for (row, f), (x0, y0) in celulas.items():
        if (row, f) in achadas:
            continue
        r = fileiras[row]
        viz = ([(andar.get(r['directions'][f]), 0)] if r['type'] == 'rotations'
               else [(row, f - 1), (row, f + 1)])
        for v in viz:
            if v in achadas:
                ilha = perto_de(px, x0, y0, C, centro(achadas[v]))
                if ilha:
                    achadas[(row, f)] = ilha
                    break
    for chave, ponto in A_MAO.items():
        if chave in celulas:
            x0, y0 = celulas[chave]
            achadas[chave] = disco(px, x0, y0, C, ponto) if ponto else []
    return achadas, celulas


def finas(px, x0, y0, C):
    """As ilhas de aco FINAS da besta: os bracos e a corda, na altura das
    maos. As grevas tambem sao finas, mas ficam embaixo, nas pernas."""
    opacos = [(x, y) for y in range(C) for x in range(C) if px[x0 + x, y0 + y][3]]
    if not opacos:
        return set()
    cy = sorted(p[1] for p in opacos)[len(opacos) // 2]
    saida = set()
    for comp in ilhas_de_aco(px, x0, y0, C):
        xs = [p[0] for p in comp]
        ys = [p[1] for p in comp]
        w, h = max(xs) - min(xs) + 1, max(ys) - min(ys) + 1
        # nem as grevas (embaixo) nem o aro do capacete (em cima)
        if not cy - 12 <= sum(ys) / len(ys) <= cy + 6:
            continue
        if len(comp) <= 80 and (max(w, h) > 2.2 * min(w, h) or len(comp) < 0.4 * w * h):
            saida.update(comp)
    return saida


def abrir(origem):
    jm = next(j for j in origem.glob('*.json') if j.name not in ('armas.json', 'meta.json'))
    meta = json.loads(jm.read_text(encoding='utf-8'))['spritesheet']
    return meta, meta['cell_size']['width'], Image.open(origem / meta['path']).convert('RGBA')


def salvar(origem, destino, meta, folha):
    if destino.exists():
        shutil.rmtree(destino)
    shutil.copytree(origem, destino)
    folha.save(destino / meta['path'])
    print(destino.relative_to(rd.R))


def reskin(origem):
    """A Lightbringer: a cabeca da maca vira ouro."""
    meta, C, folha = abrir(origem)
    px = folha.load()
    achadas, celulas = cabecas(px, meta, C)
    for (row, f), ilha in achadas.items():
        x0, y0 = celulas[(row, f)]
        for x, y in ilha:
            p = px[x0 + x, y0 + y]
            px[x0 + x, y0 + y] = (*rd.lightbringer(p, 0), p[3])
    salvar(origem, origem.parent / f'{origem.name}-lightbringer', meta, folha)


def dragonguard(origem, arma):
    """
    A Dragonguard: o aco da armadura, do capacete e do escudo vira o bronze
    avermelhado da Dara; a arma fica de aco. `arma` diz como achar a arma:
    'cabeca' (maca: a mesma cabeca da Lightbringer), 'martelo' (idem, mais
    comprida), 'besta' (os
    bracos finos de aco) ou None (a Lightbringer, ja de ouro, e o corpo no
    chao).
    """
    meta, C, folha = abrir(origem)
    px = folha.load()
    poupar = {}
    if arma in ('cabeca', 'martelo'):
        forma = {'alongada': 3.5, 'cheia': 0.3, 'maior': 140} if arma == 'martelo' else {}
        achadas, _ = cabecas(px, meta, C, **forma)
        poupar = {k: set(v) for k, v in achadas.items()}
    for r in meta['rows']:
        n = len(r['directions']) if r['type'] == 'rotations' else r['frame_count']
        for f in range(n):
            x0, y0 = f * C, r['row'] * C
            fica = poupar.get((r['row'], f), set())
            if arma == 'besta':
                fica = finas(px, x0, y0, C)
            for y in range(C):
                for x in range(C):
                    p = px[x0 + x, y0 + y]
                    if not p[3] or (x, y) in fica:
                        continue
                    novo = rd.dragonguard(p)
                    if novo:
                        px[x0 + x, y0 + y] = (*novo, p[3])
    salvar(origem, origem.parent / f'{origem.name}-dragonguard', meta, folha)


def main():
    for pasta in ('anim', 'anim-brenn-armadura-malha', 'anim-brenn-armadura-placas-brenn-capacete'):
        if (C_ / pasta).exists():
            reskin(C_ / pasta)
    # a Dragonguard e um peitoral: veste as placas (com o capacete)
    P = '-brenn-armadura-placas-brenn-capacete'
    B_ = rd.R / 'clericBesta-2bafcbc5'
    dragonguard(C_ / f'anim{P}', 'cabeca')
    dragonguard(C_ / f'anim-brenn-arma-martelo{P}', 'martelo')
    dragonguard(C_ / f'anim{P}-lightbringer', None)
    # na besta, separar os bracos de aco da armadura deixava o arco ora bronze
    # ora aco de um quadro para o outro; tudo bronze ao menos nao pisca
    dragonguard(B_ / f'anim{P}', None)
    dragonguard(C_ / 'anim-brenn-armadura-placas-brenn-queda-sem-escudo-brenn-capacete', None)


if __name__ == '__main__':
    main()
