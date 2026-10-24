# -*- coding: utf-8 -*-
"""
Os itens nomeados da aventura como RESKIN das folhas da Dara, SEM GASTAR
GERACOES: recolor em cima das folhas do PixelLab, antes da importacao.

  Talon         a espada: lamina clara puxada para o azul, punho de ouro
  Lightbringer  a maca: a cabeca vira ouro
  Hew           o machado: o aco puxa para o verde
  Dragonguard   as placas: o aco da armadura vira bronze avermelhado, a arma nao

ONDE ESTA A ARMA. O aco da arma e o da armadura sao o mesmo cinza, e as
edicoes de arma redesenharam o quadro inteiro -- comparar folhas nao separa.
O que separa e a MEDIDA: quando a arma colada por cima foi testada, o
extrator mediu em cada quadro a mao, o eixo e o alcance da espada (o
`armas.json` das pastas `-sem-arma`). As folhas de maca, machado e placas
foram editadas pedindo a arma "na mesma posicao e direcao da espada", entao a
arma de qualquer uma delas cai numa FAIXA ao longo daquele eixo, a partir da
mao. Dentro da faixa, aco e arma; fora, e armadura e escudo. Na malha, o
xadrez da cota sai da faixa tambem.

Saida: pastas `<origem>-<item>` ao lado das de origem, prontas para o
`importar-dara.sh reskins`.
"""
import colorsys
import json
import math
import shutil
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parents[2]
R = RAIZ / '_referencias' / 'pixellab'
M = R / 'fighterMalha-65b1e8af'
E = R / 'fighterSemEscudo-c29a9610'
D = R / 'fighterDuasMaos-6e0dc359'
A = R / 'fighterArco-e113e412'
B = R / 'fighterBesta-3269c32a'

# As medidas da arma, por postura (fileira:coluna da folha do PixelLab).
MEDIDAS = {
    'umaMaoEscudo': M / 'anim-dara-sem-cauda-sem-arma' / 'armas.json',
    'umaMao': E / 'anim-postura-sem-cauda-sem-arma' / 'armas.json',
    'duasMaos': D / 'anim-postura-sem-cauda-sem-arma' / 'armas.json',
}


def hsv(p):
    return colorsys.rgb_to_hsv(*(c / 255 for c in p[:3]))


def rgb(h, s, v):
    return tuple(round(c * 255) for c in colorsys.hsv_to_rgb(h % 1, max(0, min(1, s)), max(0, min(1, v))))


def aco(p):
    h, s, v = hsv(p)
    return p[3] and v > 0.16 and (s < 0.12 or (s < 0.42 and 0.5 <= h <= 0.75))


def lum(p):
    return 0.3 * p[0] + 0.59 * p[1] + 0.11 * p[2]


def xadrez(px, x, y, W, H):
    """Pixel de cota de malha: quase todos os vizinhos tem o tom oposto."""
    l = lum(px[x, y])
    n = opostos = 0
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        q = (x + dx, y + dy)
        if 0 <= q[0] < W and 0 <= q[1] < H and px[q][3]:
            n += 1
            opostos += abs(lum(px[q]) - l) > 28
    return n >= 3 and opostos >= 3


def faixa(med, W, H, largura, alem=5, cabo=2.5, cabeca=12):
    """Os pixels da faixa da arma: do pomo (3 px atras da mao) ate `alem` px
    depois da ponta medida. Estreita (`cabo`) ao longo do cabo e larga
    (`largura`) so nos ultimos `cabeca` px, onde fica a cabeca da maca ou o
    gume do machado: larga no cabo inteiro, ela engolia pedaco de perna e a
    armadura ali ficava sem o recolor."""
    (mx, my), (ux, uy) = med['mao'], med['eixo']
    antes, depois = med['alcance']
    fora = set()
    for y in range(H):
        for x in range(W):
            t = (x - mx) * ux + (y - my) * uy
            s = abs(-(x - mx) * uy + (y - my) * ux)
            if not -max(3, antes + 2) <= t <= depois + alem:
                continue
            if s <= (largura if t >= depois - cabeca else min(cabo, largura)):
                fora.add((x, y))
    return fora


def ilhas_da_arma(px, x0, y0, C, na_faixa, fracao=0.5, maior=600):
    """
    A faixa vira ILHAS INTEIRAS. Cada peca de aco e cercada pelo contorno
    preto, entao o gume de um machado grande e uma ilha separada das placas.
    Ilha de aco com boa parte dentro da faixa e arma -- inteira, inclusive a
    ponta do gume que sai dela; placa que o cabo cruza so encosta na faixa e
    continua armadura. O que nao e aco na faixa (o cabo de madeira) fica.
    """
    acos = {(x, y) for y in range(C) for x in range(C) if aco(px[x0 + x, y0 + y])}
    arma = {p for p in na_faixa if p not in acos}
    visto = set()
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
        dentro = sum(1 for q in comp if q in na_faixa)
        # metade dentro da faixa, e nada do tamanho de uma placa de costas
        if dentro and dentro >= fracao * len(comp) and len(comp) <= maior:
            arma.update(comp)
    return arma


# --- os recolores ---------------------------------------------------------------
def talon(p, t):
    h, s, v = hsv(p)
    if aco(p):
        return rgb(0.56, 0.24, min(1, v * 1.12 + 0.06))       # lamina clara, azulada
    if t < 5 and 0.02 <= h <= 0.16 and s > 0.25:             # guarda e punho
        return rgb(0.12, 0.62, min(1, v * 1.25 + 0.08))
    return None


def lightbringer(p, t):
    if aco(p):
        h, s, v = hsv(p)
        return rgb(0.12, 0.7, min(1, v * 1.18 + 0.1))          # cabeca de ouro
    return None


def hew(p, t):
    if aco(p):
        h, s, v = hsv(p)
        return rgb(0.36, 0.22, v)                              # aco esverdeado
    return None


def dragonguard(p):
    if aco(p):
        h, s, v = hsv(p)
        return rgb(0.03, 0.5, v * 0.92)                        # bronze avermelhado
    return None


def reskin(origem, destino, postura, arma_fn=None, armadura_fn=None, largura=4, cabeca=12):
    """Recolore a folha de `origem` em `destino`: a arma com `arma_fn` (dentro
    da faixa), a armadura com `armadura_fn` (fora dela)."""
    jmeta = next(j for j in origem.glob('*.json') if j.name not in ('armas.json', 'meta.json'))
    meta = json.loads(jmeta.read_text(encoding='utf-8'))['spritesheet']
    C = meta['cell_size']['width']
    folha = Image.open(origem / meta['path']).convert('RGBA')
    medidas = json.loads(MEDIDAS[postura].read_text(encoding='utf-8')) if postura else {}
    px = folha.load()
    W, H = folha.size
    for r in meta['rows']:
        n = len(r['directions']) if r['type'] == 'rotations' else r['frame_count']
        for f in range(n):
            x0, y0 = f * C, r['row'] * C
            med = medidas.get(str(r['row']), {}).get(str(f))
            na_faixa = faixa(med, C, C, largura, cabeca=cabeca) if med else set()
            if med:
                na_faixa = ilhas_da_arma(px, x0, y0, C, na_faixa)
            (mx, my), (ux, uy) = (med['mao'], med['eixo']) if med else ((0, 0), (0, 1))
            for y in range(C):
                for x in range(C):
                    p = px[x0 + x, y0 + y]
                    if not p[3]:
                        continue
                    dentro = (x, y) in na_faixa
                    novo = None
                    if dentro and arma_fn:
                        if xadrez(px, x0 + x, y0 + y, W, H):
                            continue                           # cota de malha
                        novo = arma_fn(p, (x - mx) * ux + (y - my) * uy)
                    elif not dentro and armadura_fn:
                        novo = armadura_fn(p)
                    if novo:
                        px[x0 + x, y0 + y] = (*novo, p[3])
    if destino.exists():
        shutil.rmtree(destino)
    shutil.copytree(origem, destino)
    folha.save(destino / meta['path'])
    print(destino.relative_to(R))


def main():
    pc = '-armadura-placas'
    # as armas nomeadas, nas duas armaduras
    for sufixo in ('', pc):
        reskin(M / f'anim-dara-sem-cauda{sufixo}', M / f'anim-dara-sem-cauda{sufixo}-talon',
               'umaMaoEscudo', arma_fn=talon, largura=3)
        reskin(M / f'anim-dara-sem-cauda-arma-maca{sufixo}', M / f'anim-dara-sem-cauda-arma-maca{sufixo}-lightbringer',
               'umaMaoEscudo', arma_fn=lightbringer, largura=6)
        reskin(M / f'anim-dara-sem-cauda-arma-machado{sufixo}', M / f'anim-dara-sem-cauda-arma-machado{sufixo}-hew',
               'umaMaoEscudo', arma_fn=hew, largura=6)
    # a Dragonguard: as placas de todas as folhas, menos a arma
    # (a cabeca do machado grande e do malho fica mais perto da mao que a
    # ponta da espada verde de onde sairam as medidas: trecho largo maior)
    for origem, postura, larg in (
            (M / f'anim-dara-sem-cauda{pc}', 'umaMaoEscudo', 4),
            (E / f'anim-postura-sem-cauda{pc}', 'umaMao', 4),
            (M / f'anim-dara-sem-cauda-arma-maca{pc}', 'umaMaoEscudo', 6),
            (M / f'anim-dara-sem-cauda-arma-machado{pc}', 'umaMaoEscudo', 6),
            (D / f'anim-postura-sem-cauda{pc}', 'duasMaos', 5),
            (D / f'anim-postura-sem-cauda-arma-machado-grande{pc}', 'duasMaos', 13),
            (D / f'anim-postura-sem-cauda-arma-malho{pc}', 'duasMaos', 10),
            (A / f'anim-postura-sem-cauda{pc}', None, 0),
            (B / f'anim-postura-sem-cauda-cauda-creme{pc}', None, 0)):
        reskin(origem, origem.parent / f'{origem.name}-dragonguard', postura, armadura_fn=dragonguard,
               largura=larg, cabeca=26 if larg >= 10 else 12)
    # a Dragonguard COM a arma nomeada: a armadura em cima da folha ja recolorida
    for origem, larg in ((M / f'anim-dara-sem-cauda{pc}-talon', 4),
                         (M / f'anim-dara-sem-cauda-arma-maca{pc}-lightbringer', 6),
                         (M / f'anim-dara-sem-cauda-arma-machado{pc}-hew', 6)):
        reskin(origem, origem.parent / f'{origem.name}-dragonguard', 'umaMaoEscudo',
               armadura_fn=dragonguard, largura=larg)


if __name__ == '__main__':
    main()
