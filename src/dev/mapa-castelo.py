# Gera `src/game/castelo.js`: o terreno, a altura e a luz do Castelo
# Dentefino (Parte 3 da aventura, areas 1-14).
#
#   python src/dev/mapa-castelo.py
#
# A ORGANIZACAO segue o mapa da aventura (1 casa = 1,5 m, como la); o
# DESENHO da grade e nosso: as torres redondas viram salas retas, as paredes
# ocupam casas inteiras. Os FATOS ficam: o terraco com escadas na frente dos
# portoes quebrados (1), o salao da armadilha (2) com o fio diante da porta
# para o salao escuro (8), os postos de arqueiro com seteiras para o terraco
# (3), as torres do sudoeste (4) e do noroeste (6), a despensa (5), o salao
# de banquete (7), o santuario do norte atras das cortinas (9), o portao
# traseiro de ferro (10), a torre em ruinas com a lona que esconde a saida
# norte (11), a guarda com seteira para o leste (12), a torre trancada do
# urso-coruja (13) e os aposentos do rei (14).
#
# Alturas (um nivel = 1,5 m): o chao do castelo e o terraco no nivel 1; a
# encosta em volta no 0 (as seteiras ficam acima de quem esta fora); as
# paredes um nivel acima do chao.
#
# Glifos: , capim · L piso · M parede · J seteira (parede vazada: barra o
# passo, nao a visao; cobertura) · x entulho (dificil) · E pedra caida ·
# p palha · g armeiro · i caixotes · a altar · e braseiro · N mesa do
# banquete · D cama do rei · B banheira · I portao caido · m mesa · t bau.
# Margem em volta do corpo: as torres redondas saltam para fora dele. O
# jogo soma `desloc` (OX-2, OY) as coordenadas da cena, que nasceram com
# OX=2 e OY=0.
OX, OY = 4, 3
W, H = 39, 28
T = [[','] * W for _ in range(H)]
A = [[0] * W for _ in range(H)]
L = [[2] * W for _ in range(H)]            # luz: dia claro fora

R = lambda a, b: range(a, b + 1)


def pinta(xs, ys, g, h=None, luz=None):
    for y in ys:
        for x in xs:
            X, Y = x + OX, y + OY
            T[Y][X] = g
            if h is not None:
                A[Y][X] = h
            if luz is not None:
                L[Y][X] = luz


def casa(x, y, g, h=None, luz=None):
    pinta([x], [y], g, h, luz)


# O corpo do castelo: parede macica, que as salas cavam depois.
pinta(R(1, 29), R(1, 19), 'M', 2, 1)
# Cantos que nao sao castelo (as torres sao redondas no livro).
for (x, y) in [(1, 1), (29, 1), (1, 19), (29, 19), (12, 1), (17, 1), (22, 1), (7, 19), (8, 19)]:
    casa(x, y, ',', 0, 2)

SALAS = {}


def sala(nome, xs, ys, luz=1):
    pinta(xs, ys, 'L', 1, luz)
    SALAS[nome] = (xs.start + OX, ys.start + OY, xs.stop - 1 + OX, ys.stop - 1 + OY)


# 1. O terraco, fora das paredes, com escada para a encosta.
pinta(R(0, 5), R(8, 12), 'L', 1, 2)
SALAS['terraco'] = (0 + OX, 8 + OY, 5 + OX, 12 + OY)
# Os outros comodos.
sala('alojamentoHob', R(2, 6), R(2, 4))       # 6
sala('despensa', R(8, 10), R(2, 5))           # 5
sala('santuario', R(13, 16), R(2, 3))         # 9
sala('postoNorte', R(2, 7), R(6, 6))          # 3 (norte)
sala('salaoArmadilha', R(7, 11), R(8, 11))    # 2
sala('salaoEscuro', R(13, 16), R(5, 12), 0)   # 8: nem de dia entra luz
sala('ruina', R(18, 21), R(2, 6))             # 11
sala('rei', R(24, 28), R(2, 8))               # 14
sala('guarda', R(20, 23), R(10, 14))          # 12
sala('postoSul', R(2, 7), R(14, 14))          # 3 (sul)
sala('torreSul', R(2, 6), R(16, 18))          # 4
sala('banquete', R(9, 14), R(14, 17))         # 7
sala('corredor', R(16, 18), R(14, 18))        # o salao do portao traseiro
sala('torreUrso', R(20, 25), R(16, 18), 0)    # 13: seteiras fechadas, escuro

# Portas e passagens (piso no lugar da parede).
PORTAS = {
    'portoes': (6, 10),          # 1 -> 2, os portoes quebrados
    'norte': (7, 7),             # 2 -> posto norte
    'despensa': (9, 6),          # 2 -> 5 (com (9,7))
    'hob': (7, 3),               # 5 -> 6
    'escuro': (12, 9),           # 2 -> 8, a porta do fio
    'sul': (7, 12),              # 2 -> posto sul (com (7,13))
    'banquete': (9, 12),         # 2 -> 7 (com (9,13))
    'torreSul': (2, 15),         # posto sul -> 4 (no canto: nao alinha com as seteiras)
    'ruina': (17, 6),            # 8 -> 11
    'rei': (22, 4),              # 11 -> 14 (com (23,4))
    'reiGuarda': (23, 9),        # 12 -> 14
    'corredorBanquete': (15, 15),
    'corredorGuarda': (19, 14),
}
for (x, y) in PORTAS.values():
    casa(x, y, 'L', 1, 1)
# Os portoes quebrados tem duas folhas: duas casas.
casa(6, 11, 'L', 1, 1)
casa(9, 7, 'L', 1, 1); casa(7, 13, 'L', 1, 1); casa(9, 13, 'L', 1, 1); casa(23, 4, 'L', 1, 1)
casa(24, 9, 'L', 1, 1)              # a porta da guarda para o rei tem duas casas
# As cortinas entre o salao escuro e o santuario: as arcadas, largas o
# bastante para uma luta nao virar fila.
CORTINAS = [(13, 4), (14, 4), (15, 4), (16, 4)]
for (x, y) in CORTINAS:
    casa(x, y, 'L', 1, 0)
# O corredor de cortina entre a ruina (11) e a guarda (12).
for y in R(7, 10):
    casa(19, y, 'L', 1, 1)

# As torres sao redondas (no livro, sete torres encostadas). Na grade, cada
# uma vira um disco: piso ate o raio `r`, um anel de parede logo depois, e o
# canto do retangulo velho que sobra do lado de fora volta a ser capim.
# `fora` aponta para o lado de fora (so ali o canto e raspado); `trava` diz
# quais casas nao mudam (paredes divididas com outras salas, portas).
def torre(nome, cx, cy, r, fora, trava):
    sx, sy = SALAS[nome][:2]
    luz = L[sy][sx]
    dist = lambda x, y: ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
    todas = [(x, y) for y in range(-OY, H - OY) for x in range(-OX, W - OX) if not trava(x, y)]
    for (x, y) in todas:
        g, d = T[y + OY][x + OX], dist(x, y)
        if d <= r:
            if g in 'M,':
                pinta([x], [y], 'L', 1, luz)
        elif d <= r + 1:
            if g in ',L':
                pinta([x], [y], 'M', 2, 1)
        elif d <= r + 3 and g == 'M' and (x - cx) * fora[0] + (y - cy) * fora[1] > 0:
            pinta([x], [y], ',', 0, 2)
    # A sala passa a ser a caixa do piso redondo.
    piso = [(x, y) for (x, y) in todas if dist(x, y) <= r]
    SALAS[nome] = (min(x for x, _ in piso) + OX, min(y for _, y in piso) + OY,
                   max(x for x, _ in piso) + OX, max(y for _, y in piso) + OY)


torre('alojamentoHob', 3.5, 2.5, 3.9, (-1, -1), lambda x, y: y >= 5 or x >= 7)            # 6
torre('torreSul', 3.5, 17.5, 3.9, (-1, 1), lambda x, y: y <= 15 or x >= 8)                # 4
torre('rei', 26.5, 5, 4.4, (1, 0), lambda x, y: x <= 23 or y >= 9)                       # 14
torre('torreUrso', 22.5, 17.5, 3.9, (0, 1), lambda x, y: y <= 15 or x <= 19 or x >= 27)  # 13
torre('santuario', 14.5, 3.5, 3.0, (0, -1), lambda x, y: y >= 4 or x <= 12 or x >= 17)    # 9: a abside

# O disco de uma torre pode encostar o piso no capim onde a trava segurou o
# canto velho: fecha com parede (o terraco e a unica borda aberta).
tx0, ty0, tx1, ty1 = SALAS['terraco']
for Y in range(H):
    for X in range(W):
        if T[Y][X] != ',':
            continue
        viz = [(X + i, Y + j) for i in (-1, 0, 1) for j in (-1, 0, 1)
               if 0 <= X + i < W and 0 <= Y + j < H]
        if any(T[b][a] not in ',M' and not (tx0 <= a <= tx1 and ty0 <= b <= ty1) for a, b in viz):
            T[Y][X], A[Y][X], L[Y][X] = 'M', 2, 1

# Portas fechadas: o portao traseiro de ferro (10), trancado, e a porta da
# torre do urso, presa com uma tranca de madeira, e a porta escorada entre a
# guarda e a torre do urso.
PORTAO_TRASEIRO = (17, 19)
PORTA_URSO = [(19, 16), (19, 17)]       # duas casas: o urso-coruja e Grande
PORTA_ESCORADA = (22, 15)
# A lona da torre em ruinas, que esconde a saida norte (11).
LONA = (19, 1)

# 4: o livro fala de uma passagem curva pelos escombros, a leste; aqui ela
# termina nos escombros mesmo (uma saida para fora pulava o portao e o
# terraco).
# Os escombros: montes que nao se atravessam e entulho que atrasa.
for (x, y) in [(5, 17), (6, 16), (18, 2), (18, 3), (18, 4), (9, 16), (9, 17), (10, 17), (24, 2)]:
    casa(x, y, 'E', 1, 1)
# O fio: as cinco casas na frente da porta do salao escuro, entulho em todas
# (por (11,8) dava para contornar sem pisar).
ARMADILHA = [(11, 8), (11, 9), (11, 10), (10, 9), (10, 10)]
for (x, y) in ARMADILHA + [(2, 18), (19, 3), (19, 6), (13, 12)]:
    casa(x, y, 'x', 1, None)

# Seteiras: os postos de arqueiro olham o terraco; a guarda olha o leste.
# A de x=6 olhava para o salao da armadilha, nao para o terraco: fica parede.
SETEIRAS = [(2, 7), (3, 7), (4, 7), (5, 7), (2, 13), (3, 13), (4, 13), (5, 13),
            (24, 10), (24, 11), (24, 12), (24, 13), (30, 4), (30, 6)]
# A seteira fica na altura do piso: o motor corta a visao por desnivel, e a
# fenda tem de deixar ver (e atirar) dos dois lados.
for (x, y) in SETEIRAS:
    casa(x, y, 'J', 1, 1)

# Mobilia, com os moveis proprios do castelo (glifos em grid.js). Os de
# varias casas ganham uma anotacao com o lado para onde olham.
OBJETOS = []


def movel(g, casas, olha=(1, 0)):
    for (x, y) in casas:
        casa(x, y, g, 1)
    x, y = casas[0]
    OBJETOS.append({'tipo': g, 'x': x + OX, 'y': y + OY, 'olha': {'dx': olha[0], 'dy': olha[1]}})


for x in R(2, 5):
    casa(x, 4, 'p')                       # 6: palha e colchonetes
casa(6, 2, 'g')                           # 6: as armas na parede
casa(8, 2, 'i'); casa(9, 2, 'i'); casa(10, 4, 'i')     # 5: barris e sacos
movel('a', [(14, 2), (15, 2)])            # 9: o altar
casa(14, 7, 'f')                          # 8: o braseiro de pedra (frio)
movel('N', [(10, 15), (11, 15), (12, 15)])   # 7: a mesa comprida do banquete
casa(14, 15, 'e')                         # 7: braseiro de cobre
casa(21, 3, 'i'); casa(21, 6, 'i'); casa(20, 2, 'i')   # 11: caixas e barris
for y in R(10, 13):
    casa(23, y, 'p')                      # 12: palha ao longo da parede leste
casa(21, 12, 'e')                         # 12: braseiro
# 13: a mesa e a estante viraram entulho junto da parede; o chao fica livre
# para o urso, que e Grande.
BAU_URSO = (25, 16)
casa(*BAU_URSO, 't')                      # 13: o bau na borda do andar caido
movel('D', [(27, 2), (28, 2), (27, 3), (28, 3)], (0, 1))   # 14: a cama grande
casa(25, 7, 'm')                          # 14: a mesa redonda
casa(28, 5, 'e')                          # 14: braseiro
movel('B', [(29, 6), (29, 7)], (0, 1))    # 14: a banheira de azulejo
movel('I', [(3, 12), (4, 12)])            # 1: a folha caida do portao, no terraco

# Paredes finas, como no livro: a parede macica que nao encosta em chao
# nenhum (o miolo entre as torres) nao e parede, e ruina a ceu aberto, com
# mato. Fica capim, abaixo do chao do castelo: nao se anda la de dentro.
miolo = [(X, Y) for Y in range(H) for X in range(W) if T[Y][X] == 'M'
         and all(T[Y + j][X + i] in 'M,' for i in (-1, 0, 1) for j in (-1, 0, 1)
                 if 0 <= X + i < W and 0 <= Y + j < H)]
for (X, Y) in miolo:
    T[Y][X], A[Y][X], L[Y][X] = ',', 0, 2

# A abside do santuario: os cantos de fora viram meia-lua (jogo (17,4) e
# (20,4) parede; (16,3) e (21,3) capim). E os bolsoes de capim de uma casa
# presos entre paredes voltam a ser parede.
for (x, y) in [(13, 1), (16, 1)]:
    casa(x, y, 'M', 2, 1)
for (x, y) in [(12, 0), (17, 0)]:
    casa(x, y, ',', 0, 2)
for Y in range(1, H - 1):
    for X in range(1, W - 1):
        if T[Y][X] == ',' and all(T[Y + j][X + i] == 'M' for i, j in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            T[Y][X], A[Y][X], L[Y][X] = 'M', 2, 1

# PAREDES FINAS (de borda), como nos isometricos pintados: a parede deixa de
# ocupar casa e vira a aresta entre duas salas. A conversao parte do desenho
# de parede grossa acima:
#   1. cada casa de chao dentro de uma sala e daquela sala; o chao fora das
#      salas (corredor) vira regiao propria; o capim e "fora";
#   2. as casas de parede, de porta, de seteira e de porta fechada vao para a
#      sala mais proxima (em empate, a do norte/oeste): a parede grossa some e
#      as salas crescem ate o meio dela;
#   3. onde duas regioes diferentes se encostam ha aresta: arco ('/') se uma
#      das casas era porta, seteira ('J'), porta fechada ('+') ou parede ('#').
#      Entre o terraco e o capim nao ha parede.
from collections import deque
PJ = lambda p: (p[0] + OX, p[1] + OY)
ABERTAS = {PJ(p) for p in list(PORTAS.values()) + [(6, 11), (9, 7), (7, 13), (9, 13), (23, 4), (24, 9)] + CORTINAS}
# Arcos que o desenho antigo fazia com casa de piso e a conversao nao via: o
# corredor de cortina que liga a ruina (11) a guarda (12).
ARCOS = {frozenset({PJ((19, 6)), PJ((19, 7))}), frozenset({PJ((19, 10)), PJ((20, 10))})}
FECHADAS = {'portaoTraseiro': [PJ(PORTAO_TRASEIRO)], 'portaUrso': [PJ(p) for p in PORTA_URSO],
            'portaEscorada': [PJ(PORTA_ESCORADA)], 'lona': [PJ(LONA)]}
FECHADA_DE = {c: k for k, l in FECHADAS.items() for c in l}
CORTINAS_J = {PJ(p) for p in CORTINAS}
SETEIRAS_J = {(X, Y) for Y in range(H) for X in range(W) if T[Y][X] == 'J'}
ESPECIAIS = ABERTAS | set(FECHADA_DE) | SETEIRAS_J
REG = [[None] * W for _ in range(H)]
for nome, (x0, y0, x1, y1) in sorted(SALAS.items(), key=lambda kv: (kv[1][1], kv[1][0])):
    for Y in range(y0, y1 + 1):
        for X in range(x0, x1 + 1):
            if T[Y][X] not in ',M' and REG[Y][X] is None and (X, Y) not in ESPECIAIS:
                REG[Y][X] = nome
n_corr = 0
for Y in range(H):
    for X in range(W):
        if T[Y][X] == ',':
            REG[Y][X] = 'fora'
        elif T[Y][X] != 'M' and REG[Y][X] is None and (X, Y) not in ESPECIAIS:
            nome = f'corredor{n_corr}'; n_corr += 1
            fila = [(X, Y)]; REG[Y][X] = nome
            while fila:
                cx, cy = fila.pop()
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < W and 0 <= ny < H and REG[ny][nx] is None and T[ny][nx] not in ',M'                             and (nx, ny) not in ESPECIAIS:
                        REG[ny][nx] = nome; fila.append((nx, ny))
# Atras de cada seteira da guarda e do rei fica o lado de fora: sem isto a
# sala engolia a parede e a fenda passava a dar para dentro do castelo.
for (x, y) in [(25, 10), (25, 11), (25, 12), (25, 13), (31, 4), (31, 6)]:
    REG[y + OY][x + OX] = 'fora'
# O terraco e de fora: nao cresce sobre a parede (a muralha fica do castelo).
fila = deque((X, Y) for Y in range(H) for X in range(W) if REG[Y][X] not in (None, 'fora', 'terraco'))
while fila:
    cx, cy = fila.popleft()
    for nx, ny in ((cx, cy - 1), (cx - 1, cy), (cx + 1, cy), (cx, cy + 1)):
        if 0 <= nx < W and 0 <= ny < H and REG[ny][nx] is None:
            REG[ny][nx] = REG[cy][cx]; fila.append((nx, ny))
LUZ_DA = {}
for Y in range(H):
    for X in range(W):
        if REG[Y][X] is None:
            REG[Y][X] = 'fora'
        if T[Y][X] not in 'MJ,' and REG[Y][X] != 'fora':
            LUZ_DA.setdefault(REG[Y][X], L[Y][X])
EXTERIOR = {'fora', 'terraco'}
PN = [['.'] * W for _ in range(H)]
PO = [['.'] * W for _ in range(H)]
ARESTAS = {k: [] for k in FECHADAS}
for Y in range(H):
    for X in range(W):
        for (VX, VY), grade in (((X, Y - 1), PN), ((X - 1, Y), PO)):
            if VX < 0 or VY < 0:
                continue
            a, b = REG[Y][X], REG[VY][VX]
            if a == b or (a in EXTERIOR and b in EXTERIOR):
                continue
            par = {(X, Y), (VX, VY)}
            if frozenset(par) in ARCOS:
                cod = '/'
            elif par & set(CORTINAS_J):
                # A cortina e um vao no eixo norte-sul; de lado, e parede.
                cod = '/' if VX == X else '#'
            elif par & ABERTAS:
                cod = '/'
            elif par & set(FECHADA_DE):
                cod = '+'
                ARESTAS[FECHADA_DE[next(iter(par & set(FECHADA_DE)))]].append(
                    [{'x': VX, 'y': VY}, {'x': X, 'y': Y}])
            elif par & SETEIRAS_J:
                cod = 'J'
            else:
                cod = '#'
            grade[Y][X] = cod
# O fio: a porta do salao escuro tem de ser um nicho, senao da para chegar
# nela pelo sul sem pisar no entulho (a sala cresceu sobre a parede velha).
for Y in (12, 13):
    PN[Y][PJ((14, 0))[0]] = '#'

# As casas de parede viram chao da sala que as ganhou (ou capim, se de fora).
for Y in range(H):
    for X in range(W):
        if T[Y][X] in 'MJ':
            if REG[Y][X] == 'fora':
                T[Y][X], A[Y][X], L[Y][X] = ',', 0, 2
            else:
                T[Y][X], A[Y][X], L[Y][X] = 'L', 1, LUZ_DA.get(REG[Y][X], 1)

# Bolsao: casa de piso fechada por arestas dos quatro lados. Abre a do oeste
# (a ruina tem escombro do lado leste, e e la que a casa fica presa).
for Y in range(1, H - 1):
    for X in range(1, W - 1):
        if T[Y][X] in ',M' or REG[Y][X] == 'fora':
            continue
        viz = [(PN[Y][X], (X, Y - 1)), (PO[Y][X], (X - 1, Y)),
               (PN[Y + 1][X] if Y + 1 < H else '#', (X, Y + 1)),
               (PO[Y][X + 1] if X + 1 < W else '#', (X + 1, Y))]
        # Fechada dos quatro lados por aresta, ou por aresta e por bloqueio
        # (escombro, movel): abre a primeira aresta que leva a chao livre.
        preso = all(c in '#+J' or T[b][a] in ',MxRE' for c, (a, b) in viz)
        if not preso:
            continue
        for i, (c, (a, b)) in enumerate(viz):
            if c in '#+J' and T[b][a] not in ',MxRE':
                if i == 0:
                    PN[Y][X] = '/'
                elif i == 1:
                    PO[Y][X] = '/'
                elif i == 2:
                    PN[Y + 1][X] = '/'
                else:
                    PO[Y][X + 1] = '/'
                break


# ---------------------------------------------------------------- saida ----
import json
from pathlib import Path

o = lambda p: {'x': p[0] + OX, 'y': p[1] + OY}
cab = '''// O CASTELO DENTEFINO (Parte 3): as áreas 1-14 do livro, numa grade nossa.
//
// Gerado por `src/dev/mapa-castelo.py` — mude lá e rode de novo.
//
// Glifos: , capim · L piso · M parede · J seteira · x entulho · E pedra
// caída · p palha · g armeiro · i caixotes · a altar · e braseiro · N mesa do
// banquete · D cama do rei · B banheira · I portão caído · m mesa · t baú. Alturas em dígitos (um nível = 1,5 m). Luz: 2 claro, 1 penumbra,
// 0 breu.
'''
dados = {
    'objetos': OBJETOS,
    'paredes': {'n': [''.join(l) for l in PN], 'o': [''.join(l) for l in PO]},
    'terreno': [''.join(l) for l in T],
    'altura': [''.join(str(v) for v in l) for l in A],
    'luz': [''.join(str(v) for v in l) for l in L],
}
extra = {
    'salas': {k: {'x0': a, 'y0': b, 'x1': c, 'y1': d} for k, (a, b, c, d) in SALAS.items()},
    'portas': {k: o(p) for k, p in PORTAS.items()},
    'portaoTraseiro': o(PORTAO_TRASEIRO),
    'portaUrso': [o(p) for p in PORTA_URSO],
    'portaEscorada': o(PORTA_ESCORADA),
    'lona': o(LONA),
    'armadilha': [o(p) for p in ARMADILHA],
    'bauUrso': o(BAU_URSO),
    'cortinas': [o(p) for p in CORTINAS],
    'desloc': {'x': OX - 2, 'y': OY},
    'arestas': ARESTAS,
    # As casas de cada sala DEPOIS da conversao: as salas cresceram sobre as
    # paredes velhas, e o retangulo de `salas` cobre so parte delas.
    'celulas': {nome: [{'x': X, 'y': Y} for Y in range(H) for X in range(W)
                       if REG[Y][X] == nome and T[Y][X] != ',']
                for nome in SALAS},
}
saida = Path(__file__).resolve().parents[1] / 'game' / 'castelo.js'
saida.write_text(
    cab + '\nexport const MAPA_CASTELO = ' + json.dumps(dados, indent=2, ensure_ascii=False) + ';\n\n'
    + 'export const CASTELO = ' + json.dumps(extra, indent=2, ensure_ascii=False) + ';\n',
    encoding='utf-8', newline='\n')
print('\n'.join(dados['terreno']))
