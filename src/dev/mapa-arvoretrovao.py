# Gera `src/game/arvoretrovao.js`: as ruínas de Árvore Trovão (Parte 3).
#
#   python src/dev/mapa-arvoretrovao.py
#   python src/dev/mapa-previa.py arvoretrovao      (para OLHAR o resultado)
#
# A ESCALA, medida duas vezes — e a primeira estava errada. O mapa de
# referência que o dono mandou tem grade de 10 pés. A primeira medição achou
# 53 px por quadrado (30 x 21), e era um período que a grade não tem: ampliando
# o capim aberto a 4x e a 8x, as linhas finas ficam a 37 px uma da outra. Seis
# ajustes independentes, em faixas de capim aberto na horizontal e na vertical,
# deram entre 36,2 e 37,1 px, média 36,7. A imagem tem 1668 x 1251 px, então
# são 45,5 x 34 quadrados de 10 pés.
#
# Na nossa grade de 5 pés cada quadrado deles vale 2 x 2 casas, e o mapa
# COMPLETO tem 91 x 68 casas, ou 455 x 340 pés — seis vezes a área do
# esconderijo (40 x 28), que era o maior do jogo. Com a escala errada o mapa
# saía com um terço da área, e as construções com interior de 2 casas.
#
# O RECORTE existe (`RECORTE`, em px) mas está zerado: o dono pediu o mapa
# completo. Para cortar de novo os campos vazios da borda, mude RECORTE, W e H.
#
# COMO A TRANSPOSIÇÃO É FEITA. Cada construção está declarada em COORDENADAS DA
# IMAGEM, lidas a olho sobre a referência, e o gerador converte para a grade.
# Declarar em pixel deixa a transposição auditável, prédio por prédio, contra a
# imagem — e põe o recorte e a escala num lugar só, em vez de espalhados em
# números mágicos pelo arquivo.
#
# OS NOMES são os da referência, e é ela que resolve o conteúdo: cada casa tem
# função (ferraria, tecelagem, moinho, escola, estalagem), então o que cada uma
# guarda não precisa ser inventado do nada.
#
# AS PAREDES:
#   - `E` desabamento é COBERTURA (`core/grid.js`, kind 3): barra o passo e dá
#     +2 de CA. Na altura 1 ela também BARRA A VISÃO, porque o
#     `hasLineOfSight` corta a vista quando a casa do meio é mais alta que as
#     pontas — o interior de cada casca só se vê pelo vão. É proposital: o
#     pedestal é o que faz ruína parecer ruína em isométrico;
#   - `M` alvenaria barra passo e visão. Fica na Torre do Dragão, no Salão do
#     Prefeito grudado nela, e na Estalagem, que o culto ocupa.
#
# Glifos: , capim · : caminho · T mata · w água · E parede quebrada ·
# M alvenaria · L laje · d cacos · v cinza · c ossos · x entulho · % espinheiro
# · b arbusto · r pedra · q poço · A estátua · F fogueira · a altar · z leito ·
# u barris · i caixotes · K baú · t arca · m mesa · s mantimentos · p palha.

import math
import re
from pathlib import Path

LADO_PX = 36.7                 # um quadrado de 10 pés da referência, em px
RECORTE = (0, 0)               # canto noroeste do recorte, em px da imagem
W, H = 91, 68

T = [[','] * W for _ in range(H)]
A = [[0] * W for _ in range(H)]
L = [[2] * W for _ in range(H)]

R = lambda a, b: range(a, b + 1)


def cel(px, py):
    """Pixel da referência -> casa da nossa grade."""
    return (round((px - RECORTE[0]) / LADO_PX * 2),
            round((py - RECORTE[1]) / LADO_PX * 2))


def caixa(p):
    (x0, y0), (x1, y1) = cel(p[0], p[1]), cel(p[2], p[3])
    # O canto de baixo é EXCLUSIVO: `cel` arredonda os dois cantos, e incluir os
    # dois fazia toda caixa sair uma casa maior em cada eixo que o desenho —
    # numa construção de 4 casas, 25% de área a mais.
    x1, y1 = max(x0, x1 - 1), max(y0, y1 - 1)
    return (max(0, min(x0, W - 1)), max(0, min(y0, H - 1)),
            max(0, min(x1, W - 1)), max(0, min(y1, H - 1)))


def dentro(x, y):
    return 0 <= x < W and 0 <= y < H


def _ruido(x, y):
    h = (x * 73856093) ^ (y * 19349663)
    return ((h ^ (h >> 13)) & 0xFFFF) / 0xFFFF


def _campo(x, y, escala, semente=0):
    """Ruído em MANCHAS de `escala` casas, não por casa.

    O `_ruido` sorteia cada casa sozinha, e por isso a cinha que ele espalhava
    saía salpico: um ponto aqui, um ali, nada que o olho leia como monte. Este
    sorteia nos cantos de uma malha larga e interpola entre eles, com a curva
    suave `t²(3-2t)` — sem ela a mancha sai em losango, porque a interpolação
    reta deixa a quina da malha aparecendo.
    """
    fx, fy = x / escala, y / escala
    ix, iy = math.floor(fx), math.floor(fy)
    tx, ty = fx - ix, fy - iy
    tx = tx * tx * (3 - 2 * tx)
    ty = ty * ty * (3 - 2 * ty)

    def n(a, b):
        return _ruido(a * 31 + semente, b * 17 + semente * 3)

    de_cima = n(ix, iy) * (1 - tx) + n(ix + 1, iy) * tx
    de_baixo = n(ix, iy + 1) * (1 - tx) + n(ix + 1, iy + 1) * tx
    return de_cima * (1 - ty) + de_baixo * ty


def casa(x, y, g, h=None, luz=None):
    if not dentro(x, y):
        return
    T[y][x] = g
    if h is not None:
        A[y][x] = h
    if luz is not None:
        L[y][x] = luz


def pinta(xs, ys, g, h=None, luz=None):
    for y in ys:
        for x in xs:
            casa(x, y, g, h, luz)


def pontos(lista, g, h=None, luz=None):
    for (x, y) in lista:
        casa(x, y, g, h, luz)


# ----------------------------------------------- as vinte e uma construções ----
# (id, nome, caixa em px da referência, tipo de parede, lado da porta)
# O lado: 'n' norte, 's' sul, 'l' leste, 'o' oeste. A porta sai no meio dele,
# com duas casas de largura, e o gerador confere depois se ela abre mesmo.
PREDIOS = [
    # A fazenda e o celeiro dividem parede na referência; aqui ficam separados
    # por uma casa, senão as duas paredes se sobrepõem na conversão.
    # Porta ao NORTE: é por ali que o caminho do trigo chega, na referência.
    ('fazenda',    'a casa da fazenda',        [(525, 340, 596, 410)],   'ruina',   'n'),
    # Encostado na fazenda: na referência os dois dividem UMA parede-mestra, e a
    # caixa antiga deixava um beco de 1 casa entre eles.
    ('celeiro',    'o celeiro da fazenda',     [(606, 340, 680, 410)],   'ruina',   's'),
    # No lugar da referência de novo. Na escala errada eu precisei empurrá-lo
    # 106 px para oeste porque a torre inflada passava por cima dele. Na escala
    # certa a torre tem 3 casas de raio, que é o que o dragão (2 x 2) pede, e o
    # Salão termina onde a torre começa — grudado nela, como no desenho.
    ('prefeito',   'o Salão do Prefeito',      [(780, 336, 860, 418)],   'inteira', 's'),
    # A ESTALAGEM É UM COMPLEXO, como na referência: o corpo, a ala de hóspedes
    # e a cocheira ligados. Separá-los em três prédios não funcionava — a ala
    # tem 1,3 quadrado de altura, menos que as três casas que um cômodo precisa
    # para ter interior, e esticá-la fazia ela invadir a cocheira.
    ('estalagem',  'a Estalagem do Javali',    [(1185, 230, 1270, 322),
                                                (1152, 332, 1270, 404),
                                                (1190, 410, 1270, 452)], 'inteira', 'o'),
    ('guarda',     'a Guarda da Vila',         (345, 482, 424, 554),   'ruina',   'l'),
    ('escola',     'a Escola',                 (458, 554, 544, 634),   'ruina',   's'),
    ('casa7',      'a casa das três janelas',  (568, 562, 662, 664),   'ruina',   'n'),
    ('moinho',     'o Moinho',                 (1000, 486, 1054, 550), 'ruina',   'l'),
    ('casa9',      'a casa de esquina',        (1106, 562, 1184, 654), 'ruina',   'o'),
    ('casa10',     'a casa do largo',          (1250, 486, 1304, 554), 'ruina',   'o'),
    ('ervas',      'a Fazenda de Ervas',       (528, 742, 624, 844),   'ruina',   'l'),
    ('casa12',     'a casa do beco',           (676, 832, 794, 924),   'ruina',   'o'),
    ('loja',       'a Loja da Vila',           (792, 738, 964, 812),   'ruina',   's'),
    ('ferraria',   'a Ferraria',               (886, 842, 980, 934),   'ruina',   'l'),
    ('casa15',     'a casa estreita',          (1036, 738, 1092, 804), 'ruina',   's'),
    ('tecelagem',  'a Tecelagem',              (1120, 798, 1188, 880), 'ruina',   'o'),
    # Em L, como no desenho: a ala estreita ao norte e o corpo ao sul. Como
    # retângulo único ela saía 4 x 6 com um quintal fechado de mata ao sul.
    ('embaixada',  'a Embaixada de Neverwinter', [(1259, 774, 1302, 853), (1222, 847, 1302, 926)], 'ruina', 's'),
    ('pescaria',   'a Pescaria',               (1410, 772, 1528, 860), 'ruina',   'n'),
    ('casa19',     'o casebre do sul',         (524, 968, 576, 1024),  'ruina',   'l'),
    # Os dois cômodos do nome: a referência vai até y ~1130, e a caixa antiga
    # parava no primeiro (5 x 5 em vez de 5 x 7).
    ('casa20',     'a casa de dois cômodos',   (676, 1000, 770, 1130), 'ruina',   'l'),
    ('florestal',  'o posto do Guarda-Florestal', (936, 956, 1064, 1034), 'ruina', 's'),
]

TORRE_PX = (915, 395, 56)              # a Torre do Dragão: centro x, y, raio
PRACA_PX = (1048, 228, 1252, 534)      # C, a Praça
LAGO_PX = (1388, 432, 1570, 660)       # D, o Lago Trovão
BOSQUES = [
    ('dragao', (938, 176, 1084, 324)),     # A, o Bosque do Dragão
    ('vila',   (672, 438, 954, 704)),      # B, o Bosque da Vila
    ('trovao', (248, 636, 454, 834)),      # E, os Bosques de Trovão
    ('sul',    (1146, 946, 1422, 1082)),   # F, a Floresta do Sul
]


# ----------------------------------------- o terreno, LIDO DA IMAGEM ----
# A primeira versão deste gerador DESENHAVA o terreno: bosques como elipses
# deformadas, caminhos como linhas que serpenteiam entre pontos, a mata de borda
# por ruído. Ficou parecida e não ficou FIEL — o dono apontou duas casas coladas
# com 4 quadrados dentro, onde a referência tem 16 casas, e disse que o mapa não
# era o mapa que ele mandou analisar.
#
# Agora o terreno sai da PRÓPRIA IMAGEM, casa por casa: cada casa de 5 pés cobre
# um bloco de 18,35 px, e a classe dela vem de quais cores dominam o bloco. Os
# limiares foram calibrados olhando a máscara de cada classe sobre a imagem, e
# a máscara reproduz a planta inteira — estradas, o lago, o campo de trigo, as
# quatro manchas de mata, as 21 construções.
#
# O QUE VEM DA IMAGEM: capim, caminho, água, trigo, mata, arbusto e a pegada de
# cada construção. O QUE CONTINUA DECLARADO: a lista de construções (nome, tipo
# de parede, lado da porta) e o conteúdo delas, que a imagem não tem.
import numpy as np
from PIL import Image

REF = Path(__file__).resolve().parents[2] / '_referencias' / 'arvoretrovao' / 'thundertree.webp'
if not REF.exists():
    raise SystemExit('ERRO: falta a imagem de referencia em ' + str(REF))
_img = np.asarray(Image.open(REF).convert('RGB')).astype(float) / 255
IMG_H, IMG_W, _ = _img.shape
_mx, _mn = _img.max(2), _img.min(2)
_v = _mx
_s = np.where(_mx > 0, (_mx - _mn) / np.maximum(_mx, 1e-6), 0)
_d = np.maximum(_mx - _mn, 1e-6)
_r, _g, _b = _img[..., 0], _img[..., 1], _img[..., 2]
_h = np.where(_mx == _r, ((_g - _b) / _d) % 6,
              np.where(_mx == _g, (_b - _r) / _d + 2, (_r - _g) / _d + 4)) * 60

M_AGUA = (_h > 185) & (_h < 225) & (_s > 0.28)
M_TRIGO = (_h > 35) & (_h < 52) & (_s > 0.40) & (_v > 0.55) & (_v < 0.80)
M_CAMINHO = (_h > 30) & (_h < 56) & (_s > 0.12) & (_s < 0.42) & (_v > 0.66) & ~M_TRIGO
M_PEDRA = (_s < 0.11) & (_v > 0.28) & (_v < 0.92)
M_ARVORE = (_v < 0.46) & (_s > 0.14) & (_h > 60) & (_h < 170)
M_COPA = (_v >= 0.46) & (_v < 0.62) & (_h > 88) & (_h < 140) & (_s > 0.18)

# O título e a legenda cobrem um pedaço da planta: não há o que ler ali.
SEM_DADO = [(0, 0, 432, 78), (0, 775, 218, IMG_H)]

CEL = LADO_PX / 2          # px por casa de 5 pés


def _bloco(cx, cy):
    x0, x1 = int(RECORTE[0] + cx * CEL), int(RECORTE[0] + (cx + 1) * CEL)
    y0, y1 = int(RECORTE[1] + cy * CEL), int(RECORTE[1] + (cy + 1) * CEL)
    return x0, min(x1, IMG_W), y0, min(y1, IMG_H)


def _sem_dado(cx, cy):
    px, py = RECORTE[0] + (cx + .5) * CEL, RECORTE[1] + (cy + .5) * CEL
    return any(a <= px < c and b <= py < d for (a, b, c, d) in SEM_DADO)


PEDRA = set()                  # casas de construção, antes de dividi-las por prédio
for _cy in range(H):
    for _cx in range(W):
        if _sem_dado(_cx, _cy):
            continue
        _x0, _x1, _y0, _y1 = _bloco(_cx, _cy)
        if _x1 <= _x0 or _y1 <= _y0:
            continue
        _n = (_x1 - _x0) * (_y1 - _y0)
        _f = lambda m: m[_y0:_y1, _x0:_x1].sum() / _n
        _arv = _f(M_ARVORE) + 0.5 * _f(M_COPA)
        if _f(M_AGUA) > 0.40:
            T[_cy][_cx] = 'w'
        elif _f(M_TRIGO) > 0.40:
            T[_cy][_cx] = 'p'
        elif _f(M_PEDRA) > 0.45:
            PEDRA.add((_cx, _cy))
        # 0,18 e não 0,28: a estrada tem 25 px de largura, uma casa e meia, e
        # com o limiar alto ela saía em pedaços — só os trechos que caíam bem no
        # meio de uma casa passavam.
        elif _f(M_CAMINHO) > 0.18:
            T[_cy][_cx] = ':'
        elif _arv > 0.42:
            T[_cy][_cx] = 'T'
        elif _arv > 0.24:
            T[_cy][_cx] = 'b'


def _vizinhos(x, y, conjunto, diag=True):
    for j in (-1, 0, 1):
        for i in (-1, 0, 1):
            if (i or j) and (diag or not (i and j)) and (x + i, y + j) in conjunto:
                yield (x + i, y + j)


# LIMPEZA: o bloco de 18 px pega o ruído do desenho (uma árvore solta, um traço
# de caminho). Casa de mata sem mata ao lado volta a ser capim.
_arv = {(x, y) for y in range(H) for x in range(W) if T[y][x] in 'Tb'}
for (x, y) in sorted(_arv):
    if sum(1 for _ in _vizinhos(x, y, _arv)) < 2:
        T[y][x] = ','
_cam = {(x, y) for y in range(H) for x in range(W) if T[y][x] == ':'}
for (x, y) in sorted(_cam):
    if sum(1 for _ in _vizinhos(x, y, _cam)) < 2:
        T[y][x] = ','
print('casas lidas da imagem: mata', sum(r.count('T') for r in T),
      '· arbusto', sum(r.count('b') for r in T), '· caminho', sum(r.count(':') for r in T),
      '· agua', sum(r.count('w') for r in T), '· pedra', len(PEDRA))

# LACUNAS DE ESTRADA. O limiar de caminho por bloco deixa buracos onde a estrada
# da referência é mais fina ou passa por baixo de uma árvore: a estrada do oeste
# morria em x=15, no meio do capim, a oito casas do resto dela. Cada par abaixo
# é um trecho que o desenho mostra contínuo; a linha reta entre os dois pontos
# (em px da imagem) vira caminho onde havia capim, mata ou arbusto.
LACUNAS_PX = [
    ((236, 392), (352, 432)),          # a estrada do oeste, até o resto dela
]
_ligadas = 0
for (pa, pb) in LACUNAS_PX:
    (x0_, y0_), (x1_, y1_) = cel(*pa), cel(*pb)
    n_ = max(abs(x1_ - x0_), abs(y1_ - y0_), 1)
    for i_ in range(n_ + 1):
        x_ = round(x0_ + (x1_ - x0_) * i_ / n_)
        y_ = round(y0_ + (y1_ - y0_) * i_ / n_)
        if dentro(x_, y_) and T[y_][x_] in ',bT':
            T[y_][x_] = ':'
            _ligadas += 1
print('casas de estrada ligadas nas lacunas:', _ligadas)

# ----------------------------------------------------------- construções ----
# A pegada de cada prédio é a MANCHA DE PEDRA que cai dentro da caixa declarada
# (que só diz "este é o prédio nº 7"). Ela é o INTERIOR.
#
# AS PAREDES SÃO DE BORDA, como no castelo (`mapa-castelo.py`): a parede não
# ocupa casa, ela é a ARESTA entre duas casas. A versão anterior punha uma
# casa inteira de pedra caída em volta de cada prédio, e saía repetitivo — a
# mesma pilha de escombros com a mesma cabeça de estátua, de ponta a ponta de
# cada parede. A parede de borda é uma peça contínua, tem porta de verdade,
# pode ter brecha, e a decoração (musgo, teia, bandeira) pendura NELA.
def _centro(c):
    return (RECORTE[0] + (c[0] + .5) * CEL, RECORTE[1] + (c[1] + .5) * CEL)


def _dist_caixa(px, py, b):
    dx = max(b[0] - px, 0, px - b[2])
    dy = max(b[1] - py, 0, py - b[3])
    return (dx * dx + dy * dy) ** 0.5


_dono = {}
_caixas_de = {pid: [tuple(p) for p in (pxs if isinstance(pxs, list) else [pxs])]
              for (pid, _n, pxs, _t, _l) in PREDIOS}
for c in sorted(PEDRA):
    px, py = _centro(c)
    melhor, dm = None, 1e9
    for pid, caixas in _caixas_de.items():
        for b in caixas:
            dd = _dist_caixa(px, py, b)
            if dd < dm:
                melhor, dm = pid, dd
    if melhor is not None and dm <= 0.35 * CEL:      # dentro da caixa, ou colada nela
        _dono.setdefault(melhor, set()).add(c)

INTERIOR, VAOS, CAIXAS, CORPOS = {}, {}, {}, {}


def _preenche_vazios(cs):
    """Fecha os buracos de uma casa: o traço escuro da parede interna rouba uma
    casa do meio da mancha, e a casa sairia com um furo dentro."""
    caixa_ = (min(c[0] for c in cs), min(c[1] for c in cs), max(c[0] for c in cs), max(c[1] for c in cs))
    out = set(cs)
    for y in R(caixa_[1], caixa_[3]):
        for x in R(caixa_[0], caixa_[2]):
            if (x, y) in out:
                continue
            em_linha = [(x - 1, y) in cs or (x - 2, y) in cs, (x + 1, y) in cs or (x + 2, y) in cs,
                        (x, y - 1) in cs or (x, y - 2) in cs, (x, y + 1) in cs or (x, y + 2) in cs]
            if (em_linha[0] and em_linha[1]) or (em_linha[2] and em_linha[3]):
                out.add((x, y))
    return out


_resumo = []
_reservadas = set()
for (pid, nome, pxs, tipo, lado) in PREDIOS:
    pegada = _dono.get(pid, set())
    caixas = _caixas_de[pid]
    area_ref = sum((b[2] - b[0]) * (b[3] - b[1]) for b in caixas) / (CEL * CEL)
    if len(pegada) < 4:
        pegada = set()
        for b in caixas:
            for y in R(int(b[1] / CEL + .5), int(b[3] / CEL - .5)):
                for x in R(int(b[0] / CEL + .5), int(b[2] / CEL - .5)):
                    pegada.add((x, y))
    pegada = _preenche_vazios(pegada)
    # CASA RETANGULAR É RETANGULAR. O bloco de 18 px come a casa de borda onde o
    # traço da parede cai torto, e uma casa de 4 x 4 saía com 12 casas de chão
    # em vez de 16 — o dono contou 16 na referência, e tinha razão. Se a mancha
    # cobre 70% do retângulo que a envolve, a casa é o retângulo; o L e a
    # estalagem, que cobrem menos, ficam como a mancha os desenhou.
    bx0, by0 = min(c[0] for c in pegada), min(c[1] for c in pegada)
    bx1, by1 = max(c[0] for c in pegada), max(c[1] for c in pegada)
    retangulo = {(x, y) for y in R(by0, by1) for x in R(bx0, bx1)}
    # SÓ PARA PRÉDIO DE UMA CAIXA: a estalagem (três alas) cobre 83% do retângulo
    # que a envolve, e virava um bloco de 72 casas com entalhes de capim dentro
    # da pegada — a desenhada tem ~60.
    if len(caixas) == 1 and len(pegada) >= 0.7 * len(retangulo):
        pegada = retangulo
        # O RETÂNGULO PELO TAMANHO E PELO CENTRO, e não pelos dois cantos: a
        # fazenda mede 71 px, 3,9 casas, e arredondar cada canto sozinho dava 3
        # colunas onde o desenho tem 4. A largura é a medida arredondada, e o
        # centro é o do desenho.
        if len(caixas) == 1:
            b = caixas[0]
            lw = max(2, round((b[2] - b[0]) / CEL))
            lh = max(2, round((b[3] - b[1]) / CEL))
            x0 = round((b[0] + b[2]) / 2 / CEL - lw / 2)
            y0 = round((b[1] + b[3]) / 2 / CEL - lh / 2)
            pegada = {(x, y) for y in range(y0, y0 + lh) for x in range(x0, x0 + lw)
                      if (x, y) not in _reservadas}
    _reservadas |= pegada
    INTERIOR[pid] = pegada
    _resumo.append((pid, len(INTERIOR[pid]), area_ref))

_visto = {c: pid for pid, cs in INTERIOR.items() for c in cs}

# A TORRE: círculo de pedra. O centro e o raio saem da imagem. Redonda: a mancha
# de pedra, lida em blocos de casa, sai um retângulo de 6 x 7.
TCXF, TCYF = TORRE_PX[0] / CEL, TORRE_PX[1] / CEL            # em unidades de casa
_RINT = TORRE_PX[2] / CEL - 0.15
INTERIOR['torre'] = {(x, y) for y in range(H) for x in range(W)
                     if ((x + .5 - TCXF) ** 2 + (y + .5 - TCYF) ** 2) ** 0.5 <= _RINT
                     and (x, y) not in _visto}
for c in list(PEDRA):                      # a mancha da torre não é de nenhum prédio
    if ((c[0] + .5 - TCXF) ** 2 + (c[1] + .5 - TCYF) ** 2) ** 0.5 <= TORRE_PX[2] / CEL + 1.0:
        _visto.setdefault(c, 'torre')
if len(INTERIOR['torre']) < 12:
    raise SystemExit('ERRO: o disco da torre tem so ' + str(len(INTERIOR['torre'])) + ' casas')
for c in INTERIOR['torre']:
    _visto[c] = 'torre'

LADOS = {pid: lado for (pid, _n, _p, _t, lado) in PREDIOS}
TIPOS = {pid: tipo for (pid, _n, _p, tipo, _l) in PREDIOS}
LADOS['torre'], TIPOS['torre'] = 's', 'inteira'
NOMES = {pid: nome for (pid, nome, _p, _t, _l) in PREDIOS}
NOMES['torre'] = 'a Torre do Dragão'

# As casas de pedra que nenhum prédio reclamou são ruído (o número da legenda, o
# rótulo "E" no meio da mata): viram capim.
for c in PEDRA:
    if c not in _visto:
        T[c[1]][c[0]] = ','

# O chão de dentro. Laje em todas; os decalques (cacos, mancha, musgo) vêm depois.
# Ruína é a céu aberto (luz 2), casa de pé fica em penumbra (luz 1).
for pid, cs in INTERIOR.items():
    for (x, y) in cs:
        casa(x, y, 'L', 0, 1 if TIPOS[pid] == 'inteira' else 2)
    CORPOS[pid] = cs

print('interior de cada construcao (casas de 5 pes) contra a area da referencia:')
for pid, n, ref in _resumo + [('torre', len(INTERIOR['torre']), math.pi * (TORRE_PX[2] / CEL) ** 2)]:
    print(f'  {pid:10} {n:4} casas   (a imagem tem ~{ref:.0f})')

# --------------------------------------------------- as paredes de borda ----
# PN[y][x] é a aresta NORTE da casa (x, y); PO[y][x] a aresta OESTE. Os códigos
# são os do motor (`core/grid.js`): '#' parede, '/' arco, '+' porta fechada.
PN = [['.'] * W for _ in range(H)]
PO = [['.'] * W for _ in range(H)]
REG = lambda x, y: _visto.get((x, y)) if dentro(x, y) else None
for y in range(H):
    for x in range(W):
        a = REG(x, y)
        for (vx, vy, grade) in ((x, y - 1, PN), (x - 1, y, PO)):
            if vx < 0 or vy < 0:
                continue
            if a != REG(vx, vy):
                grade[y][x] = '#'

# A PORTA: duas arestas lado a lado, no lado que o desenho mostra. A aresta de
# fora do prédio, no lado pedido, que dá para capim (não para outro prédio).
def _aresta_do_lado(x, y, lado):
    """(grade, gx, gy, casa_de_fora) da aresta da casa (x, y) no `lado`."""
    if lado == 'n':
        return PN, x, y, (x, y - 1)
    if lado == 's':
        return PN, x, y + 1, (x, y + 1)
    if lado == 'o':
        return PO, x, y, (x - 1, y)
    return PO, x + 1, y, (x + 1, y)


def _abre_porta(pid):
    cs = INTERIOR[pid]
    xs = [c[0] for c in cs]
    ys = [c[1] for c in cs]
    mx, my = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    ordem = [LADOS[pid]] + [l for l in 'sneo' if l != LADOS[pid]]
    for lado in ordem:
        cand = []
        for (x, y) in cs:
            grade, gx, gy, fora = _aresta_do_lado(x, y, lado)
            if fora in cs or REG(*fora) is not None or not dentro(*fora):
                continue
            if grade[gy][gx] != '#':
                continue
            cand.append(((x, y), (grade, gx, gy), fora))
        if not cand:
            continue
        eixo = 0 if lado in 'ns' else 1            # a porta corre ao longo deste eixo
        cand.sort(key=lambda c: abs(c[0][eixo] - (mx, my)[eixo]))
        _, aresta, fora = cand[0]
        escolhidas = [cand[0]]
        # LARGURA DA PORTA: duas casas, MENOS em prédio de lado curto. Na
        # referência a porta tem ~0,6 de casa, e numa casa de 3 x 3 ela ocupava
        # 2/3 da parede. Só a torre e as casas de lado 5 ou mais ganham duas.
        lado_do_predio = max(c[eixo] for c in cs) - min(c[eixo] for c in cs) + 1
        if lado_do_predio >= 5 or pid == 'torre':
            for c2 in cand[1:]:
                if abs(c2[0][eixo] - cand[0][0][eixo]) == 1 and c2[0][1 - eixo] == cand[0][0][1 - eixo]:
                    escolhidas.append(c2)
                    break
        vaos = []
        passo = {'n': (0, -1), 's': (0, 1), 'o': (-1, 0), 'l': (1, 0)}[lado]
        lateral = (1, 0) if passo[0] == 0 else (0, 1)
        for (cel_, (grade, gx, gy), fora) in escolhidas:
            grade[gy][gx] = '/'
            vaos.append((cel_, fora, lado))
            # O AVENTAL DA PORTA: três casas de fundo e uma de folga para cada
            # lado, livres de mata e arbusto. Só a casa de FORA era limpa, e o
            # pátio que sobrava tinha 1 casa de fundo: uma criatura Grande (2 x 2)
            # passava pela porta de duas casas e encalhava logo depois — o dragão
            # não saía da torre (13 âncoras, todas dentro), e 9 das 22
            # construções estavam vedadas a Grande.
            for k in range(0, 3):
                for l in (-1, 0, 1):
                    ax = fora[0] + passo[0] * k + lateral[0] * l
                    ay = fora[1] + passo[1] * k + lateral[1] * l
                    if dentro(ax, ay) and REG(ax, ay) is None and T[ay][ax] in 'Tb':
                        casa(ax, ay, ',', 0)
        return vaos
    raise SystemExit('ERRO: nao achei lado livre para a porta de ' + pid)


for pid in list(INTERIOR):
    VAOS[pid] = _abre_porta(pid)

FOLHAS_EXTRA = []

# A PORTA ENTRE O SALÃO E A TORRE. Na referência a torre só se entra pelo
# Salão do Prefeito, por uma porta na parede que os dois dividem — a "cabana
# anexa" do livro, que tem uma porta para dentro e a torre atrás dela. A porta
# de fora da torre, que o gerador abre por regra, continua existindo.
_comuns = sorted((x, y) for y in range(H) for x in range(W)
                 if REG(x - 1, y) == 'prefeito' and REG(x, y) == 'torre')
if _comuns:
    _x, _y = _comuns[len(_comuns) // 2]
    PO[_y][_x] = '/'
    FOLHAS_EXTRA.append([{'x': _x, 'y': _y}, {'x': _x - 1, 'y': _y}])
    print('porta Salao<->torre em', (_x, _y), 'de', len(_comuns), 'arestas dividas')
else:
    print('AVISO: o Salao e a torre nao dividem parede; sem porta interna')


def _divide(pid, eixo, c):
    """Parede interna: o prédio da referência tem dois cômodos com uma porta no meio."""
    cs = INTERIOR[pid]
    arestas = []
    if eixo == 'x':       # entre as colunas c-1 e c
        for y in range(H):
            if (c - 1, y) in cs and (c, y) in cs:
                arestas.append((PO, c, y))
    else:                 # entre as linhas c-1 e c
        for x in range(W):
            if (x, c - 1) in cs and (x, c) in cs:
                arestas.append((PN, x, c))
    if len(arestas) < 3:
        print('AVISO: divisoria de', pid, 'em', eixo, c, 'tem so', len(arestas), 'aresta(s)')
        return
    for (grade, gx, gy) in arestas:
        grade[gy][gx] = '#'
    grade, gx, gy = arestas[len(arestas) // 2]
    grade[gy][gx] = '/'
    a = (gx, gy)
    b = (gx - 1, gy) if grade is PO else (gx, gy - 1)
    FOLHAS_EXTRA.append([{'x': a[0], 'y': a[1]}, {'x': b[0], 'y': b[1]}])


# AS DIVISÓRIAS que a referência mostra: a loja, o posto do Guarda-Florestal e a
# casa de dois cômodos têm uma parede no meio, com porta. Antes cada prédio era
# uma sala só (a loja 9 x 4, a casa dos "dois cômodos" com um).
_divide('loja', 'x', round(862 / CEL))
_divide('florestal', 'x', round(1006 / CEL))
_divide('casa20', 'y', round(1072 / CEL))

# SEM BRECHAS. A versão anterior abria 26 brechas nas casas arruinadas, onde "o
# muro caiu", e o dono pediu o contrário: as paredes de todas as construções
# ficam de pé, inteiras. A ruína continua lendo como ruína pelo que está DENTRO
# (sem telhado, entulho, musgo, teia, cacos), não por muro furado.
BRECHAS = 0

# ALTURA DA PAREDE, por casa (o castelo faz igual: a caixa de altura única lê
# como caixa). Todo muro sobe 3 níveis e a torre 4 — nenhum fica baixo.
PA = [[3] * W for _ in range(H)]
for y in range(H):
    for x in range(W):
        for (vx, vy) in ((x, y), (x, y - 1), (x - 1, y)):
            if REG(vx, vy) == 'torre':
                PA[y][x] = 4

# O QUE A IMAGEM NÃO TEM: cada prédio publicado com o retângulo e o nome.
for pid, cs in INTERIOR.items():
    CAIXAS[pid] = {'nome': NOMES[pid], 'tipo': TIPOS[pid],
                   'x0': min(c[0] for c in cs), 'y0': min(c[1] for c in cs),
                   'x1': max(c[0] for c in cs), 'y1': max(c[1] for c in cs)}

# A torre publica centro e raio em casas, para o teste e a cena perguntarem o que
# é dentro de verdade: ela é REDONDA, e a caixa mente.
TORRE = {'x0': CAIXAS['torre']['x0'], 'y0': CAIXAS['torre']['y0'],
         'x1': CAIXAS['torre']['x1'], 'y1': CAIXAS['torre']['y1'],
         'cx': round(TCXF - .5, 2), 'cy': round(TCYF - .5, 2),
         'raio': round(max(((c[0] - (TCXF - .5)) ** 2 + (c[1] - (TCYF - .5)) ** 2) ** 0.5
                           for c in INTERIOR['torre']), 2)}
TCX, TCY = round(TCXF - .5), round(TCYF - .5)
PORTA_TORRE = VAOS['torre'][0][1]          # a casa de FORA da porta, que é onde se pisa antes de entrar
if (TCX + 1, TCY - 1) in INTERIOR['torre']:
    casa(TCX + 1, TCY - 1, 't', 0)          # a arca do tesouro

# O LAGO ARREDONDADO. O contorno lido em blocos de casa saía em escada, e a
# referência é uma gota com praia. Duas passadas de maioria 3 x 3 arredondam a
# borda, e uma faixa de caminho (areia) em volta faz a margem.
for _ in range(2):
    _nova = [row[:] for row in T]
    for y in range(1, H - 1):
        for x in range(1, W - 1):
            if REG(x, y) is not None or T[y][x] in 'TL':
                continue
            viz = sum(1 for j in (-1, 0, 1) for i in (-1, 0, 1) if T[y + j][x + i] == 'w')
            if viz >= 5:
                _nova[y][x] = 'w'
            elif viz <= 2 and T[y][x] == 'w':
                _nova[y][x] = ','
    T[:] = _nova
for y in range(1, H - 1):
    for x in range(1, W - 1):
        if T[y][x] in ',v' and REG(x, y) is None and any(T[y + j][x + i] == 'w' for j in (-1, 0, 1) for i in (-1, 0, 1)):
            if _ruido(x * 3 + 1, y * 5 + 2) < 0.7:
                T[y][x] = ':'

# O lago, a praça e a estátua: o que a cena publica deles.
_agua = [(x, y) for y in range(H) for x in range(W) if T[y][x] == 'w']
LAGO = {'x0': min(c[0] for c in _agua), 'y0': min(c[1] for c in _agua),
        'x1': max(c[0] for c in _agua), 'y1': max(c[1] for c in _agua)}
PX0, PY0, PX1, PY1 = caixa(PRACA_PX)
PRACA = {'x0': PX0, 'y0': PY0, 'x1': PX1, 'y1': PY1}
ESTATUA = cel(1152, 486)
casa(*ESTATUA, 'A', 0)
# O poço do largo: a cena tem a interação ("Olhar o poço") desde a versão
# antiga, e a praça era onde ele ficava.
_poco = (ESTATUA[0] - 2, ESTATUA[1] + 1)
if dentro(*_poco) and T[_poco[1]][_poco[0]] in ',:v' and REG(*_poco) is None:
    casa(_poco[0], _poco[1], 'q', 0)
BOSQUE_CAIXA = {}
for (bid, px) in BOSQUES:
    x0, y0, x1, y1 = caixa(px)
    BOSQUE_CAIXA[bid] = {'x0': x0, 'y0': y0, 'x1': x1, 'y1': y1}

# A chegada é a estrada do sul, a uns três quadrados da borda: a saída
# ('Voltar à trilha') fica na borda mesmo, e o grupo não nasce em cima dela.
CHEGADA = cel(618, 1120)
GRUPO = [(CHEGADA[0] + dx, CHEGADA[1] + dy) for (dx, dy) in ((0, 0), (-1, 0), (1, 0), (0, 1))]
for (gx, gy) in GRUPO + [(CHEGADA[0] + i, H - 2) for i in (-1, 0, 1)]:
    if T[gy][gx] in 'Tb':
        casa(gx, gy, ':', 0)


# ------------------------------------------------- mobília e decalques ----
# O QUE SOBROU DE QUEM TRABALHAVA EM CADA CASA, pela função que o nome dá a ela
# (a ferraria tem bigorna, a tecelagem tem tear, o moinho tem saca de grão), e
# no estado que um lugar abandonado há trinta anos tem. A regra é a do castelo:
# o piso solto (palha, entulho, leito) é chão de passar; o móvel que BARRA só
# entra ENCOSTADO NA PAREDE, com uma casa de folga entre um e outro, nunca na
# boca da porta e nunca escondido atrás de parede (a parede de borda tem 87 px
# e esconde duas casas de profundidade).
#
# O baú e a arca NÃO entram aqui: a cena abre qualquer baú e qualquer arca como
# o tesouro de Mormesk e o do dragão. Um de cada, na casa certa, e mais nenhum.
#                  piso solto   encostado na parede   teto (fração do interior)
FUNCAO = {
    'fazenda':   ('pp',  'iu',  0.30), 'celeiro':   ('ppx', 'sis', 0.36),
    'prefeito':  ('x',   'mi',  0.22), 'estalagem': ('xx',  'mum', 0.24),
    'guarda':    ('x',   'gi',  0.26), 'escola':    ('x',   'mmi', 0.26),
    'casa7':     ('z',   'mu',  0.24), 'moinho':    ('x',   'ss',  0.40),
    'casa9':     ('z',   'mu',  0.24), 'casa10':    ('z',   'u',   0.30),
    'ervas':     ('x',   'sis', 0.30), 'casa12':    ('x',   'mi',  0.22),
    'loja':      ('x',   'iuim', 0.30), 'ferraria': ('x',   'mue', 0.26),
    'casa15':    ('z',   'u',   0.30), 'tecelagem': ('x',   'mi',  0.26),
    'embaixada': ('x',   'mi',  0.22), 'pescaria':  ('x',   'usi', 0.30),
    'casa19':    ('z',   'u',   0.34), 'casa20':    ('z',   'mu',  0.24),
    'florestal': ('x',   'gim', 0.24), 'torre':     ('xx',  'i',   0.12),
}
BARRA_MOVEL = set('imgusKtqe')
TAPA = '#+J'


def _aresta_barra(grade, x, y):
    return 0 <= y < H and 0 <= x < W and grade[y][x] in TAPA


def _embaralha(x, y, n):
    return ((x * 73856093) ^ (y * 19349663) ^ (n * 83492791)) % 1000 / 1000


def _tapado(x, y):
    # A parede de 66 px cobre a casa de TRÁS dela na tela, e também as
    # diagonais: os caixotes do Salão (46,19) ficavam 99% atrás da quina da
    # torre (47,20), que a conta em linha reta não via.
    for (dx, dy) in ((0, 1), (1, 0), (0, 2), (2, 0), (1, 1), (2, 1), (1, 2), (2, 2)):
        if _aresta_barra(PN, x + dx, y + dy) or _aresta_barra(PO, x + dx, y + dy):
            return True
    return False


def _junto_de_vao(x, y):
    for i in (-1, 0, 1):
        for j in (-1, 0, 1):
            ax, ay = x + i, y + j
            for (gx, gy, grade) in ((ax, ay, PN), (ax, ay, PO), (ax, ay + 1, PN), (ax + 1, ay, PO)):
                if 0 <= gx < W and 0 <= gy < H and grade[gy][gx] in '/+':
                    return True
    return False


def _encosta(x, y):
    return (PN[y][x] == '#' or PO[y][x] == '#'
            or (y + 1 < H and PN[y + 1][x] == '#') or (x + 1 < W and PO[y][x + 1] == '#'))


def _passa_aresta(ax, ay, bx, by):
    if bx == ax + 1:
        return PO[ay][bx] not in TAPA
    if bx == ax - 1:
        return PO[ay][ax] not in TAPA
    if by == ay + 1:
        return PN[by][ax] not in TAPA
    return PN[ay][ax] not in TAPA


def _piso_inteiro(cs):
    """O chão do prédio continua de uma peça só (e a porta continua ligada)?"""
    livres = [c for c in cs if T[c[1]][c[0]] not in BARRA_MOVEL]
    if not livres:
        return False
    alvo = set(livres)
    vistas, fila = {livres[0]}, [livres[0]]
    while fila:
        x, y = fila.pop()
        for (dx, dy) in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = (x + dx, y + dy)
            if n in alvo and n not in vistas and _passa_aresta(x, y, n[0], n[1]):
                vistas.add(n)
                fila.append(n)
    return len(vistas) == len(livres)


for pid, (solto, parede, teto) in FUNCAO.items():
    cs = sorted(INTERIOR[pid], key=lambda c: _embaralha(c[0], c[1], 3))
    limite = max(1, int(len(INTERIOR[pid]) * teto))
    postos = 0
    for (x, y) in cs:
        if postos >= limite:
            break
        if _junto_de_vao(x, y) or _tapado(x, y):
            continue
        vizinho = any(T[y + j][x + i] not in 'Ldvcj' for i in (-1, 0, 1) for j in (-1, 0, 1)
                      if (i or j) and (x + i, y + j) in INTERIOR[pid])
        if _encosta(x, y) and parede and not vizinho:
            g = parede[int(_embaralha(x, y, 11) * len(parede))]
        elif solto and _embaralha(x, y, 5) < 0.5:
            g = solto[int(_embaralha(x, y, 13) * len(solto))]
        else:
            continue
        T[y][x] = g
        if g in BARRA_MOVEL and not _piso_inteiro(INTERIOR[pid]):
            T[y][x] = 'L'
            continue
        postos += 1

# PISO MÍNIMO DE MÓVEIS. As regras acima (encostado, longe do vão, fora da
# sombra da parede da frente, sem vizinho) deixavam 14 dos 22 prédios com zero ou
# uma peça de mobília: escola, casa9, casa10 e tecelagem não tinham nenhuma. Quem
# fica abaixo do piso ganha peças com as regras relaxadas — mantém só o vão livre
# e o chão inteiro.
for pid, (solto, parede, _teto) in FUNCAO.items():
    cs = INTERIOR[pid]
    piso = 3 if len(cs) >= 24 else (2 if len(cs) >= 12 else 1)
    postos = sum(1 for (x, y) in cs if T[y][x] in BARRA_MOVEL | set('pz'))
    for (x, y) in sorted(cs, key=lambda c: _embaralha(c[0], c[1], 61)):
        if postos >= piso:
            break
        if T[y][x] != 'L' or _junto_de_vao(x, y) or not _encosta(x, y):
            continue
        g = (parede or solto)[int(_embaralha(x, y, 67) * len(parede or solto))]
        T[y][x] = g
        if g in BARRA_MOVEL and not _piso_inteiro(cs):
            T[y][x] = 'L'
            continue
        postos += 1

# O baú de Mormesk, na casa do beco, e o único baú do mapa. A primeira escolha
# é encostado na parede, longe da porta e fora da sombra da parede da frente; se
# a casa não tiver tal lugar (a porta mudou de lado), relaxa uma regra de cada vez.
_bau_ok = False
for _rigor in (3, 2, 1, 0):
    for (x, y) in sorted(INTERIOR['casa12'], key=lambda c: _embaralha(c[0], c[1], 29)):
        if T[y][x] != 'L':
            continue
        if _rigor >= 3 and not _encosta(x, y):
            continue
        if _rigor >= 2 and _junto_de_vao(x, y):
            continue
        if _rigor >= 1 and _tapado(x, y):
            continue
        T[y][x] = 'K'
        if _piso_inteiro(INTERIOR['casa12']):
            _bau_ok = True
            BAU_MORMESK = {'x': x, 'y': y}
            break
        T[y][x] = 'L'
    if _bau_ok:
        break
if not _bau_ok:
    raise SystemExit('ERRO: nao achei onde pôr o baú de Mormesk na casa12')

# DECALQUES NO CHÃO: o que o abandono deixou. O piso liso só preenche; o
# decalque conta — cacos dizem que o lugar foi saqueado, musgo que a chuva
# entra (as ruínas não têm telhado), osso e mancha que algo morou ali.
MARCAS = {'ruina': ('jjd', 0.16), 'inteira': ('dv', 0.08)}
for pid, cs in INTERIOR.items():
    marcas, quanto = MARCAS[TIPOS[pid]]
    livres = sorted((c for c in cs if T[c[1]][c[0]] == 'L'), key=lambda c: _embaralha(c[0], c[1], 17))
    for (x, y) in livres[:max(1, int(len(livres) * quanto))]:
        T[y][x] = marcas[int(_embaralha(x, y, 23) * len(marcas))]
for (x, y) in INTERIOR['torre']:        # o covil do dragão: osso
    if T[y][x] == 'L' and _embaralha(x, y, 31) < 0.12:
        T[y][x] = 'c'

# O GRAU DE RUINA (0 inteira ... 3 toco) de cada construcao, lido pela decoracao e emitido
# no fim para o tabuleiro.
GRAU_DE_RUINA = {
    'torre': 0, 'prefeito': 1, 'estalagem': 1, 'guarda': 1, 'casa9': 1, 'florestal': 1,
    'escola': 2, 'casa7': 2, 'moinho': 2, 'casa10': 2, 'ervas': 2, 'ferraria': 2,
    'casa15': 2, 'embaixada': 2,
    'fazenda': 3, 'celeiro': 3, 'casa12': 3, 'loja': 3, 'tecelagem': 3, 'pescaria': 3,
    'casa19': 3, 'casa20': 3,
}

# ---------------------------------------------- mobília de casa abandonada ----
# O que sobrou de quem morava ou trabalhava em cada casa, desenhado de verdade (PixelLab,
# `objetos-pixellab.py --conjunto moveisRuina|cenaRuina`). Um glifo por regra
# (`^` barra, `&` é chão de passar) e a PEÇA vai na anotação `objetos` (tipo 'prop',
# variante = nome do grupo do atlas do cenário, `montar-cenario.py`). Duas coisas:
# parte do mobiliário antigo (mesa, caixote, barril, saco, leito) é TROCADA por uma peça
# do tema da casa, e algumas peças novas entram encostadas na parede. Nada fecha o chão
# (`_piso_inteiro`) nem entra na boca da porta.
PROP_BAIXO = {'banquinho', 'baldeBanco', 'trapos', 'saco', 'tabuas'}
BARRA_MOVEL.add('^')
_GERAL = ['banco', 'banquinho', 'armario', 'cama', 'cadeira', 'estante', 'tina', 'berco',
          'guardaRoupa', 'roca', 'prateleira', 'escrivaninha', 'baldeBanco', 'trapos', 'mesaPosta']
TEMA_PROP = {
    'casa': _GERAL,
    'fazenda': ['cocho', 'saco', 'tabuas', 'tina', 'machadoTora', 'banco', 'cama', 'baldeBanco'],
    'celeiro': ['cocho', 'saco', 'saco', 'tabuas', 'tina', 'machadoTora', 'trapos'],
    'casa20': ['cocho', 'saco', 'tabuas', 'tina', 'banco', 'baldeBanco', 'trapos'],
    'estalagem': ['cubaCerveja', 'barrisRack', 'mesaPosta', 'banco', 'banquinho', 'cadeira',
                  'prateleira', 'beliche', 'fogao', 'cubaCerveja'],
    'ferraria': ['bigorna', 'fole', 'mesaFerramentas', 'tabuas', 'saco', 'baldeBanco', 'fogao'],
    'tecelagem': ['tear', 'roca', 'banquinho', 'trapos', 'estante', 'tear', 'cadeira'],
    'escola': ['lousa', 'banco', 'banco', 'escrivaninha', 'estante', 'cadeira', 'tabuas'],
    'moinho': ['mo', 'saco', 'saco', 'tabuas', 'cocho', 'tina', 'baldeBanco'],
    'pescaria': ['redes', 'tina', 'baldeBanco', 'saco', 'tabuas', 'mesaFerramentas'],
    'loja': ['prateleira', 'estante', 'mesaFerramentas', 'armario', 'saco', 'guardaRoupa', 'tina'],
    'ervas': ['prateleira', 'estante', 'prateleira', 'armario', 'saco', 'tina', 'banquinho'],
    'guarda': ['beliche', 'beliche', 'mesaFerramentas', 'banco', 'armario', 'cofreVazio'],
    'prefeito': ['escrivaninha', 'estante', 'cadeira', 'mesaPosta', 'armario', 'camaViuva'],
    'embaixada': ['escrivaninha', 'estante', 'cadeira', 'armario', 'banco', 'mesaPosta'],
    'florestal': ['mesaFerramentas', 'banco', 'estante', 'saco', 'machadoTora', 'trapos'],
    'casa7': ['cama', 'banco', 'armario', 'trapos', 'banquinho', 'tina'],
    'casa9': ['banco', 'mesaPosta', 'trapos', 'banquinho', 'cama', 'cadeira'],
}
PROPS = []
_pecas_por_predio = {}


def _prop(x, y, v):
    T[y][x] = '&' if v in PROP_BAIXO else '^'
    PROPS.append({'tipo': 'prop', 'x': x, 'y': y, 'variante': v})


def _desfaz(x, y, antigo):
    T[y][x] = antigo
    PROPS.pop()


# O que cada glifo antigo vira, e com que chance. `g` fica como estava no resto.
TROCA_PROP = {'m': 0.8, 'i': 0.75, 'u': 0.75, 's': 0.75, 'z': 0.7}
for pid, cs in INTERIOR.items():
    if pid == 'torre':
        continue
    tema = TEMA_PROP.get(pid, TEMA_PROP['casa'])
    for (x, y) in sorted(cs):
        chance = TROCA_PROP.get(T[y][x])
        if chance is None or _embaralha(x, y, 41) >= chance:
            continue
        antigo = T[y][x]
        _prop(x, y, tema[int(_embaralha(x, y, 43) * len(tema))])
        if not _piso_inteiro(cs):
            _desfaz(x, y, antigo)
    # Pecas novas, encostadas na parede, longe do vao, fora da sombra da parede da frente.
    alvo = max(2, int(len(cs) * 0.20))
    postas = sum(1 for p in PROPS if (p['x'], p['y']) in cs)
    # Duas passadas: a primeira so encostado na parede; a segunda aceita o meio da sala.
    for rigor in (1, 0):
      for (x, y) in sorted(cs, key=lambda c: _embaralha(c[0], c[1], 47 + rigor)):
        if postas >= alvo:
            break
        if T[y][x] not in 'Ldvj' or _junto_de_vao(x, y) or _tapado(x, y) or (rigor and not _encosta(x, y)):
            continue
        antigo = T[y][x]
        _prop(x, y, tema[int(_embaralha(x, y, 49) * len(tema))])
        if not _piso_inteiro(cs):
            _desfaz(x, y, antigo)
            continue
        postas += 1
    _pecas_por_predio[pid] = sum(1 for p in PROPS if (p['x'], p['y']) in cs)
print('mobilia (props):', len(PROPS), '| por predio:', _pecas_por_predio)

# O PISO de cada construcao: assoalho de tabua nas casas de gente, laje rachada nas de pedra.
PISO_TABUA = {'fazenda', 'estalagem', 'casa7', 'casa9', 'casa10', 'casa12', 'casa15', 'casa19',
              'casa20', 'ervas', 'loja', 'pescaria', 'tecelagem', 'florestal', 'escola', 'embaixada'}
PISOS = {pid: ('tabua' if pid in PISO_TABUA else 'lajeRuina') for pid in INTERIOR}

# -------------------------------------------- decoração pendurada na parede ----
# Pouca e espaçada, com os mesmos freios do castelo: duas casas de folga entre
# uma peça e a seguinte, um teto por tipo e por prédio, e o mesmo tipo nunca duas
# vezes na mesma fiada. Parede de ruína (2 níveis) só leva musgo e teia — o que
# nasce NA pedra; o resto ficaria pendurado no ar.
GOSTO = {
    'fazenda': (['musgo', 'teia', 'mancha', 'ervas'], 0.5), 'celeiro': (['teia', 'mancha', 'reboco', 'musgo'], 0.5),
    'prefeito': (['bandeira', 'tapecaria', 'moldura', 'musgo'], 0.55),
    'estalagem': (['tapecaria', 'moldura', 'teia', 'ferradura', 'bandeira'], 0.5),
    'guarda': (['armas', 'escudo', 'aviso', 'musgo'], 0.5), 'escola': (['moldura', 'aviso', 'teia', 'pergaminho'], 0.45),
    'casa7': (['musgo', 'teia', 'ervas', 'mancha'], 0.4), 'moinho': (['teia', 'mancha', 'reboco'], 0.45),
    'casa9': (['musgo', 'moldura', 'tapecaria'], 0.4),
    'casa10': (['teia', 'musgo', 'mancha'], 0.4), 'ervas': (['ervas', 'ervas', 'musgo', 'prateleira'], 0.55),
    'casa12': (['teia', 'moldura', 'fuligem'], 0.45),
    'loja': (['moldura', 'teia', 'chaves', 'prateleira'], 0.45), 'ferraria': (['fuligem', 'ferradura', 'teia', 'corrente'], 0.45),
    'casa15': (['teia', 'liquen', 'mancha'], 0.45), 'tecelagem': (['tapecaria', 'teia', 'moldura'], 0.45),
    'embaixada': (['bandeira', 'escudo', 'moldura'], 0.55), 'pescaria': (['corrente', 'teia', 'musgo', 'mancha'], 0.45),
    'casa19': (['musgo', 'mancha', 'liquen'], 0.4), 'casa20': (['teia', 'musgo', 'ervas'], 0.4),
    'florestal': (['armas', 'cranio', 'peles', 'ervas'], 0.45),
    'torre': (['corrente', 'cranio', 'teia'], 0.5),
}
# O que nasce NA pedra: o que sobra numa parede baixa, onde nada fica pendurado.
NASCE_NA_PEDRA = ['musgo', 'teia', 'liquen', 'mancha', 'fuligem', 'reboco']
# A estalagem é onde o culto se abriga, e a torre é o covil: lá há fogo aceso.
COM_FOGO = {'estalagem'}
PENDURA = {'tochaAcesa', 'tochaApagada', 'quadro', 'bandeira', 'armas', 'escudo', 'cranio', 'corrente',
           'tapecaria', 'moldura', 'ferradura', 'chaves', 'aviso', 'pergaminho', 'prateleira', 'peles', 'ervas'}
LIMITE = {'tochaAcesa': 3, 'escudo': 1, 'armas': 1, 'bandeira': 1, 'cranio': 1,
          'quadro': 1, 'corrente': 1, 'musgo': 2, 'teia': 2}
TETO_PREDIO = 4
DECOR = []
_ocupadas, _quantas, _fiadas, _total = set(), {}, set(), {}


def _cabe(x, y, lado, pid, tipo):
    if any((x + i, y + j) in _ocupadas for i in (-2, -1, 0, 1, 2) for j in (-2, -1, 0, 1, 2)):
        return False
    if _quantas.get((pid, tipo), 0) >= LIMITE.get(tipo, 2):
        return False
    fiada = (lado, y) if lado == 'N' else (lado, x)
    if (pid, tipo) + fiada in _fiadas:
        return False
    if tipo != 'tochaAcesa' and _total.get(pid, 0) >= TETO_PREDIO:
        return False
    return True


def _pendura(x, y, lado, pid, tipo):
    _ocupadas.add((x, y))
    _quantas[(pid, tipo)] = _quantas.get((pid, tipo), 0) + 1
    _fiadas.add((pid, tipo) + ((lado, y) if lado == 'N' else (lado, x)))
    if tipo != 'tochaAcesa':
        _total[pid] = _total.get(pid, 0) + 1
    DECOR.append({'x': x, 'y': y, 'lado': lado, 'tipo': tipo})


for y in range(H):
    for x in range(W):
        pid = REG(x, y)
        if not pid:
            continue
        for lado, grade, (vx, vy) in (('N', PN, (x, y - 1)), ('O', PO, (x - 1, y))):
            if grade[y][x] != '#' or REG(vx, vy) == pid:
                continue
            if pid in COM_FOGO and _embaralha(x, y, 41) < 0.18 and _cabe(x, y, lado, pid, 'tochaAcesa'):
                _pendura(x, y, lado, pid, 'tochaAcesa')
                continue
            tipos, cheia = GOSTO.get(pid, (['musgo', 'teia'], 0.3))
            if _embaralha(x, y, 1 if lado == 'N' else 2) > cheia:
                continue
            tipo = tipos[int(_embaralha(x, y, 7) * len(tipos))]
            if tipo in PENDURA and (PA[y][x] < 3 or GRAU_DE_RUINA.get(pid, 2) >= 3):
                tipo = NASCE_NA_PEDRA[int(_embaralha(x, y, 9) * len(NASCE_NA_PEDRA))]
            if _cabe(x, y, lado, pid, tipo):
                _pendura(x, y, lado, pid, tipo)

# A TORRE NUNCA SAÍA COM PEÇA: o laço acima compartilha o freio de "duas casas de
# folga" entre prédios, e o arco da torre, encostado no Salão, perdia todas para
# as peças da parede vizinha. A torre é o lugar central da fase, então ganha as
# suas por último, longe só umas das outras — a corrente, o crânio do que o dragão
# comeu e a teia dos antigos moradores.
_cand_torre = []
for (x, y) in sorted(INTERIOR['torre']):
    for lado, grade, (vx, vy) in (('N', PN, (x, y - 1)), ('O', PO, (x - 1, y))):
        if grade[y][x] == '#' and REG(vx, vy) is None:
            _cand_torre.append((x, y, lado))
_cand_torre.sort(key=lambda c: _embaralha(c[0], c[1], 53))
_postos_torre = []
for (x, y, lado) in _cand_torre:
    if len(_postos_torre) >= 3:
        break
    if all(abs(x - px) + abs(y - py) >= 3 for (px, py, _l) in _postos_torre):
        _postos_torre.append((x, y, lado))
for (tipo, (x, y, lado)) in zip(['corrente', 'cranio', 'teia'], _postos_torre):
    DECOR.append({'x': x, 'y': y, 'lado': lado, 'tipo': tipo})

LUZES = [{'pos': {'x': d['x'], 'y': d['y']}, 'claro': 15, 'penumbra': 15, 'tipo': 'tocha'}
         for d in DECOR if d['tipo'] == 'tochaAcesa']

# QUAL VÃO TEM FOLHA DE PORTA: todos. O dono pediu as portas e as entradas
# construídas, então toda construção tem a sua folha, que abre e fecha pelo
# menu (`capitulo4-arvoretrovao.js`) como no castelo. O vão fica ABERTO no
# mapa: o passeio e a IA andam por ele, e fechar é escolha de quem joga.
FOLHAS = []
for pid, vaos in VAOS.items():
    if GRAU_DE_RUINA.get(pid, 2) >= 3:      # a porta apodreceu e caiu: o vao ficou aberto
        continue
    for (dentro_, fora, _lado) in vaos:
        FOLHAS.append([{'x': fora[0], 'y': fora[1]}, {'x': dentro_[0], 'y': dentro_[1]}])
FOLHAS += FOLHAS_EXTRA
print('decoracao de parede:', len(DECOR), '· tochas:', len(LUZES), '· folhas de porta:', len(FOLHAS))


# ------------------------------------ os cantos que a cena usa ----
# A cena dispara cada encontro ao ENTRAR NUM RETÂNGULO, e não por raio: raio
# vaza por cima de parede, e já vazou — o anel de 20 pés das aranhas alcançava
# sete casas do porão, do outro lado da alvenaria, e abrir o baú acordava
# aranhas sem caminho até o grupo.
#
# Os retângulos saem DAQUI, do arquivo que desenha o chão deles, e não da
# cena. Enquanto estavam escritos lá, trocar o mapa deixava cada gatilho
# apontando para o lugar errado sem ninguém notar: é exatamente o que
# aconteceu quando este mapa passou de 44 x 30 para 54 x 38.
JARDIM_PX = (1179, 551, 1338, 684)     # o espinheirado a leste: os infectados
POMAR_PX = (250, 817, 489, 1003)       # o pomar morto do sudoeste: as aranhas

JX0, JY0, JX1, JY1 = caixa(JARDIM_PX)
for y in R(JY0, JY1):
    for x in R(JX0, JX1):
        if T[y][x] == ',' and _campo(x, y, 2.4, 61) < 0.66:
            casa(x, y, '%', 0)        # kind 2: atravessa, mas custa o dobro
JARDIM = {'x0': JX0, 'y0': JY0, 'x1': JX1, 'y1': JY1}

# O pomar: fileira de árvore seca, não mata fechada. Esparso de propósito —
# o grupo tem de poder entrar, ver a teia e decidir, que é o aviso que as
# aranhas ganharam depois de medirem 18% de morte de herói no 3º nível.
PX0_, PY0_, PX1_, PY1_ = caixa(POMAR_PX)
for y in R(PY0_, PY1_):
    for x in R(PX0_, PX1_):
        if T[y][x] in ',b':
            casa(x, y, 'T' if _campo(x, y, 1.9, 83) < 0.30 else ',', 0)
# A aranha da ponta ocupa 2 x 2 a partir de x=26 e passava de x1: seis casas
# coladas nela ficavam fora do gatilho, e o grupo a atacava sem acordar a outra.
POMAR = {'x0': PX0_, 'y0': PY0_, 'x1': PX1_ + 1, 'y1': PY1_}
# O fundo do pomar, onde elas acordam: o miolo, com duas casas de margem, para
# o grupo ver a teia antes de pisar nele.
# O fundo vai até uma casa da borda: com duas de margem, o ninho de x=26 ficava
# numa faixa onde o grupo encostava nas aranhas sem acordá-las.
POMAR_FUNDO = {'x0': PX0_ + 2, 'y0': PY0_ + 2, 'x1': PX1_ + 1, 'y1': PY1_ - 1}

# ----------------------------------------------------------- a cinza ----
# Trinta anos de cinza do Hotenow: DERIVA, não cobertor. Com densidade alta a
# prévia mostrava o meio do mapa virando uma mancha cinzenta única, em que não
# se distinguia parede de chão — cinza, laje e parede quebrada são todas
# cinzentas. Ela se acumula no caminho e junto das paredes, e deixa o capim
# aparecer.
CENTRO = ((PX0 + PX1) // 2, (PY0 + PY1) // 2)
for y in range(H):
    for x in range(W):
        if T[y][x] not in ',:':
            continue
        d = max(abs(x - CENTRO[0]) / (W / 2), abs(y - CENTRO[1]) / (H / 2))
        # 0,16 sobre o caminho: com 0,34 a cinza cobria a estrada e a praça, e a
        # prévia perdia as ruas que são o que dá forma à vila.
        chance = (0.16 if T[y][x] == ':' else 0.11) * (1.0 - 0.8 * d)
        if any(dentro(x + i, y + j) and T[y + j][x + i] in 'MET'
               for i, j in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            chance += 0.12
        # `_campo` e não `_ruido`: sorteando casa por casa, a cinza saía
        # SALPICO — pontos soltos que leem como sujeira de imagem, não como
        # monte de cinza. Em manchas de umas quatro casas ela vira deriva, que
        # é o que trinta anos de vento fazem.
        if _campo(x, y, 4.2, 7) < chance * 1.9:
            casa(x, y, 'v', 0)
# A CINZA SÓ SE ACUMULA ONDE O VENTO A DEIXA: junto das paredes e das árvores.
# No capim aberto ela virava manchas soltas — "bueiros", disse o diretor de arte
# — e na praça cobria o calçamento inteiro de cinza escura e carvão. Fica só a
# que tem parede de prédio a até duas casas, e nenhum grupo com menos de 4 casas.
def _perto_de_parede(x, y, r=4):
    return any(REG(x + i, y + j) is not None for i in range(-r, r + 1) for j in range(-r, r + 1))


_cinza = {(x, y) for y in range(H) for x in range(W) if T[y][x] == 'v'}
for (x, y) in _cinza:
    if not _perto_de_parede(x, y):
        T[y][x] = ':' if PRACA['x0'] <= x <= PRACA['x1'] and PRACA['y0'] <= y <= PRACA['y1'] else ','
_cinza = {(x, y) for y in range(H) for x in range(W) if T[y][x] == 'v'}
_visitado = set()
for c0 in sorted(_cinza):
    if c0 in _visitado:
        continue
    grupo, fila = {c0}, [c0]
    while fila:
        cx_, cy_ = fila.pop()
        for (ix, iy) in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
            n = (cx_ + ix, cy_ + iy)
            if n in _cinza and n not in grupo:
                grupo.add(n)
                fila.append(n)
    _visitado |= grupo
    if len(grupo) < 4:
        for (x, y) in grupo:
            T[y][x] = ','
print('casas de cinza:', sum(l.count('v') for l in T))

# ---------------------------------------------------------------- selo ----
# O QUE BARRA O PASSO, LIDO DO MOTOR e não escrito à mão.
#
# Esta lista já esteve escrita aqui, e já errou duas vezes: faltou o altar, e
# antes disso faltou o mobiliário inteiro — mesa, barril, caixote, baú, arca,
# poço — o que fazia o selo dizer "3 casas presas" onde o motor via 12. Lista
# que uma pessoa mantém diverge do que o motor lê, e a divergência passa
# calada porque os dois lados parecem concordar.
#
# Então o `kind` sai de `core/grid.js`, que é a fonte: 1 é parede, 3 é
# cobertura, e os dois barram o passo. Se alguém acrescentar um móvel lá, ele
# entra aqui sozinho.
def _bloqueios_do_motor():
    grid = (Path(__file__).resolve().parents[1] / 'core' / 'grid.js').read_text(encoding='utf-8')
    corpo = grid[grid.index('export const GLIFOS = {'):]
    corpo = corpo[:corpo.index(chr(10) + chr(125) + chr(59))]
    achados = re.findall(r"'(.)':\s*\{\s*kind:\s*(\d)", corpo)
    if len(achados) < 30:
        raise SystemExit(f'ERRO: li so {len(achados)} glifos de grid.js; o formato mudou?')
    return {g for (g, k) in achados if k in ('1', '3')}, len(achados)


BLOQUEIA, _lidos = _bloqueios_do_motor()
print(f'bloqueios lidos de grid.js: {len(BLOQUEIA)} de {_lidos} glifos')


def _anda(x, y):
    return dentro(x, y) and T[y][x] not in BLOQUEIA


def _aresta(ax, ay, bx, by):
    """O código da aresta entre duas casas vizinhas NO EIXO, como `Battlefield.aresta`."""
    if bx == ax + 1 and by == ay:
        return PO[by][bx] if bx < W else '.'
    if bx == ax - 1 and by == ay:
        return PO[ay][ax]
    if by == ay + 1 and bx == ax:
        return PN[by][bx] if by < H else '.'
    return PN[ay][ax]


def _passa(ax, ay, bx, by):
    """O mesmo que `Battlefield.passa`: na diagonal, as QUATRO arestas da quina."""
    if ax == bx or ay == by:
        return _aresta(ax, ay, bx, by) not in '#+J'
    return (_aresta(ax, ay, bx, ay) not in '#+J' and _aresta(bx, ay, bx, by) not in '#+J'
            and _aresta(ax, ay, ax, by) not in '#+J' and _aresta(ax, by, bx, by) not in '#+J')


def _passo(x, y, nx, ny):
    if not _anda(nx, ny) or abs(A[ny][nx] - A[y][x]) > 1:
        return False
    # Regra de quina, como `reachable` faz: o `stepBlocked` não a tem.
    if nx != x and ny != y and not _anda(nx, y) and not _anda(x, ny):
        return False
    # E a parede de BORDA: o passo não cruza aresta de parede.
    return _passa(x, y, nx, ny)


# A CASA DE PARTIDA TAMBÉM VALE. O selo antigo só validava o destino de cada
# passo, então saindo de uma casa bloqueada ele espalhava pelo mapa inteiro e
# dizia que estava tudo bem — enquanto o motor, que valida a casa atual, parava
# na hora e via 641 casas presas.
if not _anda(*CHEGADA):
    raise SystemExit('ERRO: a chegada ' + str(CHEGADA) + ' esta bloqueada (' + T[CHEGADA[1]][CHEGADA[0]] + ')')
# ELOS SÓ-DIAGONAIS. A regra de quina do motor ("não corta quina entre duas
# paredes") proíbe passar de uma casa de caminho para a diagonal quando as duas
# casas ortogonais são mata: o caminho da referência, desenhado em diagonal,
# virava uma fileira de casas isoladas, e o gerador as selava. Foi assim que o
# segundo ramo da torre para o leste sumiu — a torre e o Salão ficaram com uma
# entrada só. Abre uma das duas casas ortogonais.
_elos = 0
for (x, y) in [(x, y) for y in range(H) for x in range(W) if T[y][x] in ':v']:
    for (dx, dy) in ((1, 1), (1, -1)):
        nx, ny = x + dx, y + dy
        # `v` (cinza) também: ela cobre o caminho, e os elos de caminho que a
        # cinza pegou eram justamente os que o selo deixava de fora.
        if not dentro(nx, ny) or T[ny][nx] not in ':v':
            continue
        o1, o2 = (nx, y), (x, ny)
        if T[o1[1]][o1[0]] in 'Tb' and T[o2[1]][o2[0]] in 'Tb' and REG(*o1) is None and REG(*o2) is None:
            casa(o1[0], o1[1], ':', 0)
            _elos += 1
print('elos so-diagonais abertos:', _elos)


def _alcancaveis():
    """Tudo que o andarilho do motor alcança a partir da chegada."""
    vistas = {CHEGADA}
    fila = [CHEGADA]
    while fila:
        cx2, cy2 = fila.pop()
        if not _anda(cx2, cy2):
            continue
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                if not dx and not dy:
                    continue
                nx, ny = cx2 + dx, cy2 + dy
                if (nx, ny) in vistas or not _passo(cx2, cy2, nx, ny):
                    continue
                vistas.add((nx, ny))
                fila.append((nx, ny))
    return vistas


# TRILHA DA PORTA. A imagem tem casas no meio da mata, e o terreno lido dela
# fecha o caminho: a porta abre para um bolsão de árvore sem saída. Na
# referência cada casa tem um caminho até a estrada, que o desenho esconde
# debaixo da copa. Então, de cada porta que não chega à estrada, o gerador
# abre uma trilha pela mata (anda por mato e arbusto, para na primeira casa
# alcançável) e a marca como caminho. Parede e interior de outro prédio não se
# cortam.
_vistas = _alcancaveis()
_trilhas = 0
for _pid in list(CORPOS):
    if any(c in _vistas for c in CORPOS[_pid]):
        continue
    _ini = [fora for (_dentro, fora, _lado) in VAOS[_pid] if fora not in _visto]
    _de = {c: None for c in _ini}
    _fila_t = list(_ini)
    _achou = None
    while _fila_t and _achou is None:
        c = _fila_t.pop(0)
        if c in _vistas:
            _achou = c
            break
        for (i, j) in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = (c[0] + i, c[1] + j)
            if n in _de or not dentro(*n) or n in _visto:
                continue
            if T[n[1]][n[0]] in BLOQUEIA and T[n[1]][n[0]] not in 'Tb':
                continue
            _de[n] = c
            _fila_t.append(n)
    if _achou is None:
        continue
    c = _achou
    while c is not None:
        if T[c[1]][c[0]] in 'Tb':
            casa(c[0], c[1], ':', 0)
        c = _de[c]
    _trilhas += 1
    _vistas = _alcancaveis()
print('trilhas abertas da porta ate a estrada:', _trilhas)

# A CLAREIRA DOS PRÉDIOS. A copa de uma árvore alta mede ~150 px e cobre a casa
# que está ATRÁS dela na tela (ao norte e a oeste dela). As árvores ao sul e a
# leste de um prédio escondem o interior dele: tecelagem 92% do chão coberto,
# celeiro 87%, torre 75%, estalagem 70%, Embaixada 61%, e quatro portas com mais
# da metade tapada. As matas continuam: só a franja de 4 casas ao sul e a leste
# de cada prédio (1 nos outros lados) perde as árvores altas — os arbustos ficam.
_clareira = 0
_zona_limpa = set()
for pid, cs in INTERIOR.items():
    xs = [c[0] for c in cs]
    ys = [c[1] for c in cs]
    for y in range(min(ys) - 1, max(ys) + 5):
        for x in range(min(xs) - 1, max(xs) + 5):
            if dentro(x, y) and T[y][x] == 'T' and REG(x, y) is None:
                T[y][x] = ','
                _zona_limpa.add((x, y))
                _clareira += 1
print('arvores tiradas da frente dos predios:', _clareira)


# A REDE DE GRANDE. O dragão (2 x 2) alcançava 22 âncoras fora da torre, numa
# bolsa fechada por três árvores: a luta virava uma torre de tiro. O pátio da
# porta tinha sido aberto, mas o caminho dele até a vila não. Procura, pelo menor
# número de casas de mata a limpar, um caminho de 2 x 2 da chegada até o pátio da
# porta da torre, da loja, da escola e da Embaixada, e limpa só esse caminho.
def _grande_cabe(x, y, limpa=False):
    """Custo de ocupar o 2 x 2 em (x, y): None se não dá, senão as casas de mata a limpar."""
    custo = 0
    for j in (0, 1):
        for i in (0, 1):
            cx, cy = x + i, y + j
            if not dentro(cx, cy) or (cx, cy) in _visto:
                return None
            g_ = T[cy][cx]
            if g_ in 'Tb':
                custo += 1
            elif g_ in BLOQUEIA:
                return None
    return custo


def _grande_passo(x, y, dx, dy):
    """O passo de âncora (x, y) para (x+dx, y+dy), com as regras de `Battlefield.reachable`."""
    nx, ny = x + dx, y + dy
    if not all(_passa(x + i, y + j, x + i + dx, y + j + dy) for j in (0, 1) for i in (0, 1)):
        return False
    # Parede de borda DENTRO da pegada nova (`paredeNaPegada`): o 2 x 2 não
    # cabe atravessado por uma parede.
    if (PO[ny][nx + 1] in '#+J' or PO[ny + 1][nx + 1] in '#+J'
            or PN[ny + 1][nx] in '#+J' or PN[ny + 1][nx + 1] in '#+J'):
        return False
    # "Não corta quina entre duas paredes", contada na ÂNCORA, como o motor faz:
    # na diagonal, se as duas casas ao lado da âncora estão bloqueadas, não passa.
    # A conta anterior só olhava as arestas e abria caminhos que o motor recusava
    # (o dragão continuava com 22 âncoras fora da torre).
    if dx and dy:
        def bloq(cx, cy):
            return not dentro(cx, cy) or T[cy][cx] in BLOQUEIA
        if bloq(x + dx, y) and bloq(x, y + dy):
            return False
    return True


def _caminho_grande(origem, alvos):
    import heapq
    fila = [(0, origem)]
    custo = {origem: 0}
    de = {origem: None}
    while fila:
        c0, a = heapq.heappop(fila)
        if c0 > custo.get(a, 1e9):
            continue
        if a in alvos:
            caminho = []
            while a is not None:
                caminho.append(a)
                a = de[a]
            return caminho
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                if not dx and not dy:
                    continue
                n = (a[0] + dx, a[1] + dy)
                cn = _grande_cabe(*n)
                if cn is None or not _grande_passo(a[0], a[1], dx, dy):
                    continue
                novo = c0 + 1 + cn * 4          # limpar mata custa mais que andar
                if novo < custo.get(n, 1e9):
                    custo[n] = novo
                    de[n] = a
                    heapq.heappush(fila, (novo, n))
    return None


_orig = None
for (ox, oy) in ((CHEGADA[0], CHEGADA[1]), (CHEGADA[0] - 1, CHEGADA[1]), (CHEGADA[0], CHEGADA[1] - 1)):
    if _grande_cabe(ox, oy) == 0:
        _orig = (ox, oy)
        break
_limpas = 0
if _orig:
    for _pid in ('torre', 'loja', 'escola', 'embaixada'):
        fora = VAOS[_pid][0][1]
        alvos = {(fora[0] + i, fora[1] + j) for i in (-1, 0) for j in (-1, 0)}
        alvos = {a for a in alvos if _grande_cabe(*a) is not None}
        cam = _caminho_grande(_orig, alvos)
        if not cam:
            print('AVISO: sem caminho de Grande ate a porta de', _pid)
            continue
        for (ax, ay) in cam:
            for j in (0, 1):
                for i in (0, 1):
                    if T[ay + j][ax + i] in 'Tb':
                        casa(ax + i, ay + j, ',', 0)
                        _limpas += 1
print('casas de mata limpas para a rede de Grande:', _limpas)
# O alcance de 1 x 1 PRECISA SER REFEITO: ele foi calculado antes de a clareira e a
# rede de Grande abrirem casas, e o selo desfazia tudo que o cálculo velho não
# conhecia — o dragão continuava com 22 âncoras fora da torre.
_vistas = _alcancaveis()

_seladas = 0
for y in range(H):
    for x in range(W):
        if _anda(x, y) and (x, y) not in _vistas:
            # Na franja que acabou de ser limpa a casa selada vira ARBUSTO, não mata:
            # arbusto bloqueia o passo do mesmo jeito mas não tem copa, e a copa era
            # justamente o que escondia o interior do prédio.
            T[y][x] = 'b' if (x, y) in _zona_limpa else 'T'
            A[y][x] = 0
            _seladas += 1
print('casas inalcancaveis seladas:', _seladas)
# CONFERÊNCIA DA REDE DE GRANDE, depois do selo: o selo desfaz o que o 1 x 1 não
# alcança, e a rede de Grande pode ter sido desfeita junto.
if _orig:
    for _pid in ('torre', 'loja', 'escola', 'embaixada'):
        _fora = VAOS[_pid][0][1]
        _alvos = {(_fora[0] + i, _fora[1] + j) for i in (-1, 0) for j in (-1, 0)}
        _alvos = {a for a in _alvos if _grande_cabe(*a) == 0}
        _cam = _caminho_grande(_orig, _alvos) if _alvos else None
        _custo = None if not _cam else sum(_grande_cabe(*a) or 0 for a in _cam)
        print('  rede de Grande ate a porta de', _pid + ':', 'SEM caminho' if not _cam else f'{len(_cam)} passos, {_custo} casa(s) de mata ainda no caminho')

# TODA CONSTRUÇÃO TEM DE SER ENTRÁVEL: regra do dono, e aqui ela vira
# verificação. Se um vão ficar tapado, o gerador estoura em vez de publicar uma
# casa que ninguém abre.
# A torre também é um prédio (`INTERIOR['torre']`), então o guarda de interior
# cobre a colisão dela com o Salão: a versão em que ela era um círculo à parte
# deixou o Salão ser erguido em cima dela sem ninguém reclamar.

_fechadas = []
for pid in CORPOS:
    if not any(c in _vistas for c in CORPOS[pid]):
        _fechadas.append(pid + ' (' + str(CAIXAS[pid]['x0']) + ',' + str(CAIXAS[pid]['y0']) + ')')
if _fechadas:
    # Mostra a vizinhança de cada uma: o que tranca a porta se vê melhor do que
    # se descreve (R = alcançável, as demais letras são o terreno).
    for _pid in CORPOS:
        _cx_ = CAIXAS[_pid]
        if (_pid + ' (' + str(_cx_['x0']) + ',' + str(_cx_['y0']) + ')') in _fechadas:
            print('--', _pid, 'porta em', sorted(VAOS[_pid]))
            for _y in range(max(0, _cx_['y0'] - 3), min(H, _cx_['y1'] + 4)):
                print('  ', ''.join(('R' if (x_, _y) in _vistas and T[_y][x_] in ',:' else T[_y][x_])
                                    for x_ in range(max(0, _cx_['x0'] - 3), min(W, _cx_['x1'] + 4))))
    raise SystemExit('ERRO: construcao sem entrada: ' + '; '.join(_fechadas))
print('as ' + str(len(PREDIOS)) + ' construcoes + a torre estao entraveis')


# -------------------------------------------- onde cada bando nasce ----
# AS POSIÇÕES SAEM DAQUI, não da cena. Estavam escritas na cena, e quando o
# mapa passou de 44 x 30 para 54 x 38 elas continuaram apontando para as casas
# antigas: o dragão nascia num pedaço de rua a 14 casas da torre dele, e um
# galho infectado nascia dentro de parede. O teste pegou dois casos; o resto
# teria passado calado, porque casa errada que por acaso é chão não reclama.
#
# Isto roda DEPOIS DO SELO de propósito: assim toda vaga é alcançável pelo
# andarilho do motor, e não só livre. Criatura em casa que ninguém alcança não
# dá luta — dá uma simulação que roda até o limite de rodadas sem ninguém agir.
def _vagas(regiao, quantas, onde, dentro_de=None):
    """`quantas` casas livres, alcançáveis e espalhadas dentro da região."""
    if dentro_de is not None:
        cands = [c for c in sorted(dentro_de) if T[c[1]][c[0]] in 'Ldvcjpxz']
    else:
        cands = [(x, y) for y in R(regiao['y0'], regiao['y1'])
                 for x in R(regiao['x0'], regiao['x1'])]
    cands = [c for c in cands if _anda(*c) and c in _vistas]
    if len(cands) < quantas:
        raise SystemExit('ERRO: ' + onde + ' tem ' + str(len(cands))
                         + ' vaga(s) alcancavel(is), e a cena precisa de ' + str(quantas))
    # Espalha: a cada passo pega a candidata mais longe das já escolhidas.
    escolhidas = [cands[len(cands) // 2]]
    while len(escolhidas) < quantas:
        escolhidas.append(max(
            (c for c in cands if c not in escolhidas),
            key=lambda c: min((c[0] - e[0]) ** 2 + (c[1] - e[1]) ** 2 for e in escolhidas)))
    return [{'x': x, 'y': y} for (x, y) in escolhidas]


# O dragão é GRANDE: ocupa 2 x 2, então não basta uma casa livre — precisa de
# um quadrado de quatro, todo ele chão da torre.
_miolo = [c for c in sorted(_vistas) if c in INTERIOR['torre']]
_cabe = [c for c in _miolo
         if all((c[0] + i, c[1] + j) in _miolo for i in (0, 1) for j in (0, 1))]
if not _cabe:
    raise SystemExit('ERRO: o dragao (2 x 2) nao cabe no salao da torre')
_dragao = min(_cabe, key=lambda c: (c[0] - TCX) ** 2 + (c[1] - TCY) ** 2)

# AS ARANHAS SÃO GRANDES E FICAM JUNTAS, e as duas coisas são medidas, não
# gosto: elas ocupam 2 x 2, e o revisor mediu que as três na BOCA do pomar
# derrubam alguém em 18 a 23% das lutas, enquanto espalhá-las para o fundo faz
# a terceira medir igual a não existir. Então aqui não vale o espalhador de
# cima — vale juntar na beira por onde o grupo chega, que é o lado leste,
# porque a chegada fica no sul da vila e o pomar é o canto sudoeste.
_boca = (POMAR['x1'], (POMAR['y0'] + POMAR['y1']) // 2)
_grandes = [c for c in sorted(_vistas)
            if POMAR['x0'] <= c[0] <= POMAR['x1'] and POMAR['y0'] <= c[1] <= POMAR['y1']
            and all((c[0] + i, c[1] + j) in _vistas
                    and _anda(c[0] + i, c[1] + j) for i in (0, 1) for j in (0, 1))]
_aranhas = []
for c in sorted(_grandes, key=lambda c: (c[0] - _boca[0]) ** 2 + (c[1] - _boca[1]) ** 2):
    if len(_aranhas) >= 2:
        break
    if all((c[0] - a[0]) ** 2 + (c[1] - a[1]) ** 2 >= 4 for a in _aranhas):
        _aranhas.append(c)
if len(_aranhas) < 2:
    raise SystemExit('ERRO: o pomar so tem ' + str(len(_aranhas))
                     + ' ancoragem(ns) 2 x 2 para as aranhas, e a cena quer 2')

# OS BANDOS DO LIVRO. Cada um mora na construção que o livro lhe dá (ver
# `OBJETOS-ARVORE-TROVAO.md`, "Mapa do livro para o nosso mapa"), nas quantidades
# do livro: ramos secos 2 / 6 / 8 / 6 (áreas 1, 2, 5, 12) e zumbis das cinzas
# 4 / 2 / 5 (áreas 3, 8, 11). As áreas de mato (5 e 12) nascem numa FRANJA em
# volta do prédio, porque o livro as põe "nos arbustos" e "no mato a leste".
def _franja(pid, x0, y0, x1, y1):
    """Caixa em torno da construção `pid`, em casas relativas à caixa dela."""
    c = CAIXAS[pid]
    return {'x0': c['x0'] + x0, 'y0': c['y0'] + y0, 'x1': c['x1'] + x1, 'y1': c['y1'] + y1}


_ZONA_MATO_LESTE = _franja('casa20', 3, -1, 9, 1)      # o mato a leste da fazenda de ramos
_ZONA_TECELAGEM_SUL = _franja('tecelagem', -2, 2, 3, 6)    # os arbustos ao sul da tecelagem

NINHOS = {
    'infectados': _vagas(JARDIM, 7, 'o espinheirado a leste'),
    'aranhas': [{'x': x, 'y': y} for (x, y) in _aranhas],
    'zumbis': _vagas(None, 5, 'a velha guarnição (área 11)', dentro_de=CORPOS['guarda']),
    'zumbisCavalo': _vagas(None, 4, 'o Cavalo Pardo (área 3)', dentro_de=CORPOS['estalagem']),
    'zumbisFerraria': _vagas(None, 2, 'a velha ferraria (área 8)', dentro_de=CORPOS['ferraria']),
    'ramos1': _vagas(None, 2, 'a cabana ocidental (área 1)', dentro_de=CORPOS['casa7']),
    'ramos2': _vagas(None, 6, 'a cabana com ramos (área 2)',
                     dentro_de=CORPOS['fazenda'] | CORPOS['celeiro']),
    'ramos5': _vagas(_ZONA_MATO_LESTE, 8, 'o mato a leste da fazenda de ramos (área 5)'),
    'ramos12': _vagas(_ZONA_TECELAGEM_SUL, 6, 'os arbustos ao sul da tecelagem (área 12)'),
    'culto': _vagas(None, 4, 'a loja onde o culto se abriga', dentro_de=CORPOS['loja']),
    'mormesk': _vagas(None, 1, 'a casa do beco, onde Mormesk ronda',
                      dentro_de=CORPOS['casa12']),
    'reidoth': _vagas(None, 1, 'o posto do Guarda-Florestal',
                      dentro_de=CORPOS['florestal']),
    'dragao': [{'x': _dragao[0], 'y': _dragao[1]}],
}
print('vagas: ' + ', '.join(f'{k} {len(v)}' for k, v in NINHOS.items()))

# OS DOIS OBJETOS ESCONDIDOS DO LIVRO. Nenhum dos dois está desenhado: o livro os
# põe sob uma lajota (o baú da cabana ocidental) e num compartimento sob as
# prateleiras (a caixa da herborista), e SÓ UMA BUSCA os revela — então a cena
# troca a casa por um baú quando o teste passa. Aqui o gerador só reserva a casa
# (piso livre, encostada na parede, longe da porta e de onde um bando nasce).
_ocupadas_por_ninho = {(p['x'], p['y']) for lista in NINHOS.values() for p in lista}


def _escondido(pid, onde):
    for (x, y) in sorted(INTERIOR[pid], key=lambda c: _embaralha(c[0], c[1], 71)):
        if (T[y][x] == 'L' and _encosta(x, y) and not _junto_de_vao(x, y)
                and (x, y) not in _ocupadas_por_ninho):
            return {'x': x, 'y': y}
    raise SystemExit('ERRO: nao achei casa para o objeto escondido de ' + onde)


OBJETOS_ESCONDIDOS = {
    'bauMercador': _escondido('casa7', 'a cabana ocidental'),
    'caixaMirna': _escondido('ervas', 'a loja do herborista'),
}
print('objetos escondidos:', OBJETOS_ESCONDIDOS)

import json

CABECALHO = (
    '// AS RUINAS DE ARVORE TROVAO (Parte 3): a vila que o vulcao matou, a\n'
    '// torre redonda que o dragao tomou, e o mato que virou bicho.\n'
    '//\n'
    '// Gerado por `src/dev/mapa-arvoretrovao.py` - mude la e rode de novo.\n'
    '// Para OLHAR: `python src/dev/mapa-previa.py arvoretrovao`.\n'
    '//\n'
    '// 91 x 68 casas = 455 x 340 pes, o maior mapa do jogo. O terreno e LIDO da\n'
    '// imagem de referencia (grade de 10 pes = 36,7 px = 2 x 2 casas): capim,\n'
    '// caminho, agua, trigo, mata e a pegada de cada construcao.\n'
    '//\n'
    '// As paredes sao de BORDA, como no castelo: `paredes.n` e `paredes.o` dizem a\n'
    '// aresta norte e a aresta oeste de cada casa (# parede, / arco, + porta\n'
    '// fechada), e `paredes.alt` a altura dela. A pegada de cada construcao e o\n'
    '// interior; a parede vem por fora, entre as casas.\n'
    '//\n'
    '// Glifos: , capim - : caminho - T mata - b arbusto - w agua - p palha (o\n'
    '// trigo) - L laje - d cacos - v cinza - c ossos - x entulho - % espinheiro\n'
    '// - q poco - A estatua - z leito - u barris - i caixotes - K bau - t arca -\n'
    '// m mesa - s mantimentos - g armeiro.\n'
)
# O GRAU DE RUINA de cada construcao (0 inteira, 1 de pe, 2 perdeu o alto, 3 toco).
# O tabuleiro troca a pedra (kits `trovao*` do PixelLab, `montar-ruinas.py`) e
# recorta o topo por aresta. O livro diz quais ainda se sustentam: a casa de pedra
# dos cultistas ("a mais inteira da vila"), a guarnicao, a estalagem, a torre e o
# reduto do druida; as duas casas da area 2 ("paredes meio caidas"), o armazem e a
# tecelagem (entulho no joelho) estao no outro extremo.
PR = [[0] * W for _ in range(H)]
for _pid, _cs in INTERIOR.items():
    for (_x, _y) in _cs:
        PR[_y][_x] = GRAU_DE_RUINA.get(_pid, 2)
print('ruina por grau:', {g: sum(1 for l in PR for v in l if v == g) for g in (0, 1, 2, 3)})

# O TERRENO EMITIDO: o chao de fora ganha a arte nova (trigo, cinza, lago e a margem de
# areia). A logica acima usa os glifos de sempre; so aqui eles viram os glifos da arte,
# e so FORA das construcoes (dentro delas 'p' e palha, 'v' e mancha).
_dentro = set().union(*INTERIOR.values())
TE = [row[:] for row in T]
_conta_arte = {'X': 0, 'Z': 0, 'S': 0, 'y': 0}
for _y in range(H):
    for _x in range(W):
        _g = T[_y][_x]
        if (_x, _y) in _dentro:
            continue
        _novo = {'p': 'X', 'v': 'Z', 'w': 'S'}.get(_g)
        if _g == ':' and any(0 <= _x + _i < W and 0 <= _y + _j < H and T[_y + _j][_x + _i] == 'w'
                             for _i in (-1, 0, 1) for _j in (-1, 0, 1)):
            _novo = 'y'
        if _novo:
            TE[_y][_x] = _novo
            _conta_arte[_novo] += 1
print('arte de chao de fora:', _conta_arte)

dados = {
    'paredes': {'n': [''.join(l) for l in PN], 'o': [''.join(l) for l in PO],
                'alt': [''.join(str(v) for v in l) for l in PA],
                'ruina': [''.join(str(v) for v in l) for l in PR]},
    'terreno': [''.join(l) for l in TE],
    'altura': [''.join(str(v) for v in l) for l in A],
    'luz': [''.join(str(v) for v in l) for l in L],
    'luzes': LUZES,
}
extra = {
    'chegada': {'x': CHEGADA[0], 'y': CHEGADA[1]},
    'grupo': [{'x': gx, 'y': gy} for (gx, gy) in GRUPO],
    'saida': [{'x': CHEGADA[0] + i, 'y': H - 2} for i in (-1, 0, 1)],
    'estatua': {'x': ESTATUA[0], 'y': ESTATUA[1]},
    'praca': PRACA,
    'lago': LAGO,
    'torre': TORRE,
    'portaDaTorre': {'x': PORTA_TORRE[0], 'y': PORTA_TORRE[1]},
    'bosques': BOSQUE_CAIXA,
    'jardim': JARDIM,
    'pomar': POMAR,
    'pomarFundo': POMAR_FUNDO,
    'zumbis': {k: CAIXAS['embaixada'][k] for k in ('x0', 'y0', 'x1', 'y1')},
    'reidoth': NINHOS['reidoth'][0],
    'ninhos': NINHOS,
    'props': PROPS,
    'pisos': PISOS,
    'objetos': {**OBJETOS_ESCONDIDOS, 'bauMormesk': BAU_MORMESK},
    'zonas': {'matoLeste': _ZONA_MATO_LESTE, 'tecelagemSul': _ZONA_TECELAGEM_SUL},
    'predios': CAIXAS,
    # As casas de cada cômodo: o tabuleiro dissolve a parede da sala em que o
    # grupo entrou (`board.desenharParedes`).
    'celulas': {pid: [{'x': x, 'y': y} for (x, y) in sorted(cs)] for pid, cs in INTERIOR.items()},
    'decor': DECOR,
    'folhas': FOLHAS,
}
saida = Path(__file__).resolve().parents[1] / 'game' / 'arvoretrovao.js'
saida.write_text(
    CABECALHO + '\nexport const MAPA_ARVORE_TROVAO = '
    + json.dumps(dados, indent=2, ensure_ascii=False) + ';\n\n'
    + 'export const ARVORE_TROVAO = '
    + json.dumps(extra, indent=2, ensure_ascii=False) + ';\n',
    encoding='utf-8', newline='\n')
print('escrito:', saida.name)
