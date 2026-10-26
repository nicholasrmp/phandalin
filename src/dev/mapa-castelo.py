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
# O livro: "grossas cortinas tapam a passagem por um PAR de arcos", e entre
# os dois fica o braseiro de pedra. Entao sao dois vaos, nao quatro -- a
# revisao de encontros tinha pedido quatro para a luta nao virar fila, mas
# fidelidade ganha e o santuario cresceu de outro jeito (a abside).
CORTINAS = [(13, 4), (16, 4)]
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


# `olha` escolhe a vista do sprite (board.spriteDirecional): (1,0) e sudeste,
# (0,1) sudoeste, (0,-1) nordeste. O eixo comprido do desenho tem de correr
# com a pegada: medido, a peca "sudeste" do PixelLab deita o objeto no eixo
# contrario, entao a pegada que corre em x pede (0,1) e a que corre em y
# pede (1,0).
# A PEGADA de cada movel de mais de uma casa. O passe que empurra movel de
# tras da parede mexia casa por casa: a banheira de duas casas saia com uma
# casa deslocada e a outra no lugar, virando dois sprites sobrepostos com um
# buraco no meio. Guardando a pegada, ou a peca inteira anda, ou nenhuma anda.
PECAS = []


def movel(g, casas, olha=(1, 0)):
    for (x, y) in casas:
        casa(x, y, g, 1)
    x, y = casas[0]
    o = {'tipo': g, 'x': x + OX, 'y': y + OY, 'olha': {'dx': olha[0], 'dy': olha[1]}}
    OBJETOS.append(o)
    # Em casa da GRADE (com OX/OY somados), que e onde `T` vive — o passe que
    # empurra o movel mexe em T, nao nas coordenadas do desenho da planta.
    PECAS.append({'g': g, 'casas': [(x + OX, y + OY) for (x, y) in casas], 'obj': o})


for x in R(2, 5):
    casa(x, 4, 'p')                       # 6: palha e colchonetes
casa(6, 2, 'g')                           # 6: as armas na parede
casa(8, 2, 'i'); casa(9, 2, 'i'); casa(10, 4, 'i')     # 5: barris e sacos
movel('a', [(14, 2), (15, 2)], (0, 1))    # 9: o altar
# 8: o braseiro de pedra do livro, com o carvao e a estatueta enterrada,
# fica ENTRE os dois arcos das cortinas.
casa(14, 5, 'f')
movel('N', [(10, 15), (11, 15), (12, 15)], (0, 1))   # 7: a mesa comprida do banquete
casa(14, 15, 'e')                         # 7: braseiro de cobre
casa(21, 3, 'i'); casa(21, 6, 'i'); casa(20, 2, 'i')   # 11: caixas e barris
for y in R(10, 13):
    casa(23, y, 'p')                      # 12: palha ao longo da parede leste
casa(21, 12, 'e')                         # 12: braseiro
# 13: a mesa e a estante viraram entulho junto da parede; o chao fica livre
# para o urso, que e Grande.
# 13: o livro diz que a torre foi livraria e sala de trabalho, e que nada
# dela restou inteiro -- entulho e caixotes encostados na parede.
# O caixote de (21,17) — jogo (25,20) — travava o urso-coruja na torre: ele é
# Grande (2x2) e a pegada da ancora ao lado do vao caia em cima dele. Medido:
# 27 ancoras alcancaveis, TODAS dentro da torre, e dos 39 pontos de fora com
# linha de visao ele alcancava um. Movido para (24,19), jogo (28,22).
casa(24, 19, 'i'); casa(24, 16, 'i'); casa(20, 18, 'E'); casa(26, 18, 'E')
BAU_URSO = (25, 16)
casa(*BAU_URSO, 't')                      # 13: o bau na borda do andar caido
movel('D', [(27, 2), (28, 2), (27, 3), (28, 3)], (0, 1))   # 14: a cama grande
casa(25, 7, 'm')                          # 14: a mesa redonda
casa(28, 5, 'e')                          # 14: braseiro
movel('B', [(29, 6), (29, 7)], (1, 0))    # 14: a banheira de azulejo
movel('I', [(3, 12), (4, 12)], (0, 1))    # 1: a folha caida do portao, no terraco

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
        abriu = False
        for i, (c, (a, b)) in enumerate(viz):
            # So dentro da MESMA sala: abrir para a vizinha criaria ligacao
            # que o livro nao tem (foi assim que nasceu um arco entre o
            # santuario e a ruina).
            if c in '#+J' and T[b][a] not in ',MxRE' and REG[b][a] == REG[Y][X]:
                abriu = True
                if i == 0:
                    PN[Y][X] = '/'
                elif i == 1:
                    PO[Y][X] = '/'
                elif i == 2:
                    PN[Y + 1][X] = '/'
                else:
                    PO[Y][X + 1] = '/'
                break
        # Nao havia por onde abrir sem inventar ligacao: a casa vira escombro,
        # que e o que uma sala em ruina tem num canto fechado.
        if not abriu:
            T[Y][X] = 'E'


# ENCHER AS SALAS. Medido antes deste passe: 619 casas de piso e 58 com
# alguma coisa -- 90% de piso liso. Sala vazia nao parece sala, parece
# maquete, e e o defeito que mais pesava no mapa.
#
# A REGRA e o que o livro diz de cada area: quem mora ali, o que faz ali e em
# que estado o lugar esta. A palha e o entulho sao PISO (anda-se por cima, o
# entulho custa o dobro), entao entram soltos pela sala e fazem o papel do
# decalque de chao; caixote, arca, mesa, armeiro e pedra caida BARRAM o passo
# e so entram ENCOSTADOS NA PAREDE, como movel de verdade, com uma casa de
# folga entre um e outro.
#
# Tres travas, nesta ordem: nao encostar na passagem (a casa de um vao e as
# vizinhas dela ficam livres), nao fechar caminho (depois de cada peca, o
# chao da sala tem de continuar inteiro) e um teto por sala, para a sala nao
# virar deposito.
CHEIO = {
    #                     piso solto        encostado na parede      teto
    'guarda':            ('pp',             'igm',                   0.30),
    'alojamentoHob':     ('ppx',            'itm',                   0.30),
    'postoNorte':        ('p',              'ig',                    0.26),
    'postoSul':          ('p',              'ig',                    0.26),
    'banquete':          ('xx',             'imt',                   0.26),
    'despensa':          ('x',              'iit',                   0.34),
    'santuario':         ('x',              'f',                     0.18),
    'salaoEscuro':       ('xx',             'Ef',                    0.20),
    'salaoArmadilha':    ('xxx',            'E',                     0.22),
    'corredor':          ('x',              '',                      0.14),
    'torreSul':          ('xx',             'iE',                    0.26),
    'torreUrso':         ('ppx',            'E',                     0.18),   # o urso e Grande: chao livre
    'ruina':             ('xxx',            'E',                     0.30),
    'rei':               ('x',              'tim',                   0.22),
    'terraco':           ('xx',             'E',                     0.20),
}
PISO_LIVRE = set('Lpxcvdj')     # por onde se anda (o entulho custa o dobro, mas passa)


def embaralha(X, Y, n):
    return ((X * 73856093) ^ (Y * 19349663) ^ (n * 83492791)) % 1000 / 1000


def casas_da_sala(nome):
    return [(X, Y) for Y in range(H) for X in range(W) if REG[Y][X] == nome and T[Y][X] == 'L']


def junto_de_vao(X, Y):
    # A casa de um vao e as oito em volta dela ficam livres: movel na boca da
    # porta e o jeito mais rapido de estragar um mapa tatico.
    for i in (-1, 0, 1):
        for j in (-1, 0, 1):
            ax, ay = X + i, Y + j
            if not (0 <= ax < W and 0 <= ay < H):
                continue
            for (gx, gy, grade) in ((ax, ay, PN), (ax, ay, PO),
                                    (ax, ay + 1, PN), (ax + 1, ay, PO)):
                if 0 <= gx < W and 0 <= gy < H and grade[gy][gx] in '+/':
                    return True
    return False


def encosta_parede(X, Y):
    return (PN[Y][X] == '#' or PO[Y][X] == '#'
            or (Y + 1 < H and PN[Y + 1][X] == '#')
            or (X + 1 < W and PO[Y][X + 1] == '#'))


def inteira(casas):
    # O chao da sala continua de uma peca so?
    livres = [c for c in casas if T[c[1]][c[0]] in PISO_LIVRE]
    if not livres:
        return False
    vistas, fila = {livres[0]}, [livres[0]]
    alvo = set(livres)
    while fila:
        X, Y = fila.pop()
        for (dx, dy) in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = (X + dx, Y + dy)
            if n in alvo and n not in vistas and passa_aresta(X, Y, n[0], n[1]):
                vistas.add(n); fila.append(n)
    return len(vistas) == len(livres)


def passa_aresta(ax, ay, bx, by):
    if bx == ax + 1:
        return PO[ay][bx] not in '#J'
    if bx == ax - 1:
        return PO[ay][ax] not in '#J'
    if by == ay + 1:
        return PN[by][ax] not in '#J'
    return PN[ay][ax] not in '#J'


def barra(g):
    return g in 'itmgfEa'


for nome, (solto, parede, teto) in CHEIO.items():
    casas = casas_da_sala(nome)
    if not casas:
        continue
    todas = [(X, Y) for Y in range(H) for X in range(W) if REG[Y][X] == nome]
    limite = int(len(todas) * teto)
    postos = sum(1 for (X, Y) in todas if T[Y][X] not in 'L,')
    # Ordem determinista, para o mapa sair igual toda vez.
    casas.sort(key=lambda c: embaralha(c[0], c[1], 3))
    for (X, Y) in casas:
        if postos >= limite:
            break
        if junto_de_vao(X, Y):
            continue
        vizinho = any(T[Y + j][X + i] not in 'L,' for i in (-1, 0, 1) for j in (-1, 0, 1)
                      if 0 <= X + i < W and 0 <= Y + j < H and (i or j))
        na_parede = encosta_parede(X, Y)
        if na_parede and parede and not vizinho:
            g = parede[int(embaralha(X, Y, 11) * len(parede))]
        elif solto and embaralha(X, Y, 5) < 0.5:
            g = solto[int(embaralha(X, Y, 13) * len(solto))]
        else:
            continue
        T[Y][X] = g
        if barra(g) and not inteira(casas):
            T[Y][X] = 'L'          # fechou caminho: desfaz
            continue
        postos += 1


# DECALQUES NO CHAO. O piso liso, mesmo com oito ladrilhos sorteados e
# espelhados, nao CONTA nada: ele so preenche. O decalque conta -- ossos
# roidos dizem o que o urso come, a mancha diz onde alguem sangrou, o musgo
# diz que a chuva entra ali, os cacos dizem que o lugar foi saqueado.
#
# Sao chao livre (kind 0): nao mexem em passo, visao nem cobertura. Por isso
# podem ir em qualquer casa, inclusive na boca da porta -- uma mancha na
# soleira e exatamente o que se espera de uma.
MARCAS = {
    'torreUrso':      ('cccj', 0.14),   # o covil: osso por toda parte
    'banquete':       ('cvd', 0.12),    # restos, gordura, louca quebrada
    'ruina':          ('jjd', 0.16),    # a chuva entra: musgo nas juntas
    'terraco':        ('jd', 0.10),
    'salaoArmadilha': ('dd', 0.12),     # reboco e pedra caida
    'salaoEscuro':    ('vj', 0.10),     # a capela abandonada
    'santuario':      ('v', 0.08),      # o sangue do que se oferece ali
    'rei':            ('v', 0.06),
    'guarda':         ('d', 0.08),
    'alojamentoHob':  ('dv', 0.08),
    'postoNorte':     ('d', 0.08),
    'postoSul':       ('d', 0.08),
    'despensa':       ('d', 0.08),
    'corredor':       ('d', 0.08),
    'torreSul':       ('dj', 0.10),
}
for nome, (marcas, quanto) in MARCAS.items():
    casas = [(X, Y) for Y in range(H) for X in range(W)
             if REG[Y][X] == nome and T[Y][X] == 'L']
    casas.sort(key=lambda c: embaralha(c[0], c[1], 17))
    for (X, Y) in casas[:max(1, int(len(casas) * quanto))]:
        T[Y][X] = marcas[int(embaralha(X, Y, 23) * len(marcas))]

# MOVEL ATRAS DE PAREDE. A parede de borda tem 87 px: ela esconde a casa logo
# atras dela na tela (a do norte e a do oeste). Um movel ali aparece pela
# metade, espiando por cima do muro, e le como se estivesse EM CIMA da parede.
# Entao ele anda uma casa para a frente, se houver chao livre. Criatura nao
# precisa disto: a parede esmaece quando cobre alguem.
MOVEIS = set('pgiaetBNDIefm')
TAPA = '#+J'


def tapado(X, Y):
    # A parede tem 87 px e esconde umas tres casas de profundidade: o movel
    # nao pode estar nas duas primeiras fileiras atras dela.
    return any(PN[Y + k][X] in TAPA or PO[Y][X + k] in TAPA
               for k in (1, 2) if Y + k < H and X + k < W)


def livre(X, Y, pegada):
    # Casa que serve de destino: dentro do mapa, chao livre (ou casa da
    # propria peca, que vai ser esvaziada), nao escondida por parede e LONGE
    # DE VAO. Sem a ultima trava, este passe empurrava um caixote para a boca
    # da porta e selava a sala inteira -- foi o que aconteceu com a despensa e
    # o alojamento, 84 casas sem caminho.
    if not (0 <= X < W - 1 and 0 <= Y < H - 1):
        return False
    if (X, Y) not in pegada and T[Y][X] != 'L':
        return False
    if junto_de_vao(X, Y):
        return False
    return not tapado(X, Y)


def empurra(pegada):
    # A peca anda INTEIRA, uma casa de cada vez, ou nao anda. Devolve o
    # deslocamento aplicado, ou None.
    if not any(tapado(X, Y) for (X, Y) in pegada):
        return None
    conj = set(pegada)
    for (dx, dy) in ((0, -1), (-1, 0), (0, -2), (-2, 0)):
        destino = [(X + dx, Y + dy) for (X, Y) in pegada]
        if not all(livre(nx, ny, conj) for (nx, ny) in destino):
            continue
        guardado = [(T[Y][X], A[Y][X]) for (X, Y) in pegada]
        for (X, Y) in pegada:
            T[Y][X] = 'L'
        for (nx, ny), (g, alt) in zip(destino, guardado):
            T[ny][nx] = g
            A[ny][nx] = alt
        return (dx, dy)
    return None


# Primeiro as pecas de pegada declarada, inteiras.
for peca in PECAS:
    d = empurra(peca['casas'])
    if d:
        peca['casas'] = [(X + d[0], Y + d[1]) for (X, Y) in peca['casas']]
        peca['obj']['x'] += d[0]
        peca['obj']['y'] += d[1]
# Depois o resto, que e de uma casa so.
de_peca = {c for peca in PECAS for c in peca['casas']}
for Y in range(H - 1):
    for X in range(W - 1):
        if T[Y][X] not in MOVEIS or (X, Y) in de_peca:
            continue
        d = empurra([(X, Y)])
        if d:
            for o in OBJETOS:
                if o['x'] == X and o['y'] == Y:
                    o['x'], o['y'] = X + d[0], Y + d[1]

# DECORACAO DE PAREDE. Pendurada na face da parede de borda: tocha, quadro,
# bandeira, musgo, teia, corrente, cranio, armas, escudo. Serve a tres
# coisas: a parede grande deixa de ser um paredao liso, o jogador ganha coisa
# para examinar (a cena trata a tocha e o quadro em
# `capitulo4-castelo.js`) e cada sala passa a ter cara propria.
#
# A escolha e determinista (um embaralhador pelo x e pelo y), para o mapa sair
# igual toda vez que se regenera.
DECOR = []


def mistura(x, y, n):
    return ((x * 73856093) ^ (y * 19349663) ^ (n * 83492791)) % 1000 / 1000


# Que decoracao cada sala usa, na ordem de preferencia, e quao cheia ela fica.
# O que cada sala pendura, pelo que o LIVRO diz dela, e quao cheia ela fica.
# Nao e gosto: e leitura do texto da aventura.
#   rei: trofeus nas paredes e peles (o livro lista os dois);
#   salao escuro: capela antiga, figuras aladas, sem fogo;
#   santuario: dedicado a Maglubiyet, manto sobre o altar;
#   banquete: salao sujo, ossos e restos;
#   guarda e alojamento: tropa, logo armas e escudos;
#   torre do urso: escura DE PROPOSITO, para a besta ficar calma;
#   ruina: aberta ao tempo, mato nas pedras;
#   armadilha: antiga sala de estar, argamassa caida, nada pendurado;
#   terraco: a fortaleza tem de parecer abandonada por fora.
GOSTO = {
    'rei': (['cranio', 'bandeira', 'cranio', 'escudo'], 0.5),
    'salaoEscuro': (['quadro', 'teia', 'quadro', 'musgo'], 0.4),
    'santuario': (['bandeira', 'cranio', 'quadro'], 0.5),
    'banquete': (['cranio', 'teia', 'cranio'], 0.4),
    'guarda': (['armas', 'escudo', 'armas'], 0.5),
    'alojamentoHob': (['armas', 'escudo', 'armas'], 0.45),
    'torreUrso': (['corrente', 'teia', 'musgo'], 0.5),
    'ruina': (['musgo', 'teia', 'musgo'], 0.5),
    'despensa': (['corrente', 'teia'], 0.35),
    'torreSul': (['escudo', 'teia'], 0.35),
    'salaoArmadilha': (['musgo', 'teia'], 0.25),
    'corredor': (['teia', 'musgo'], 0.3),
    'postoNorte': (['armas', 'escudo'], 0.4),
    'postoSul': (['armas', 'escudo'], 0.4),
    'terraco': ([], 0),
}
PADRAO = (['musgo', 'teia'], 0.25)
# Onde nao ha fogo aceso: o livro poe o salao escuro sem luz nenhuma, a torre
# do urso escura de proposito, e a ruina e a cheu aberto.
SEM_FOGO = {'salaoEscuro', 'torreUrso', 'ruina', 'terraco'}

# DECORACAO POUCA E ESPACADA. Parede cheia de enfeite nao enriquece a sala:
# o olho le a repeticao e para de ver cada peca. Entao valem quatro freios,
# do mais forte para o mais fraco:
#   1. duas casas de folga entre uma decoracao e a seguinte, em qualquer
#      direcao — nada de peca colada em peca;
#   2. um teto por tipo e por sala, baixo (uma bandeira, um quadro);
#   3. o mesmo tipo nunca duas vezes na MESMA FIADA de parede (a fileira que
#      o jogador ve de uma olhada) — era dai que vinha a cara de papel de
#      parede, com o mesmo musgo tres vezes seguidas;
#   4. um teto da sala inteira, sem contar as tochas, que sao luz e nao
#      enfeite.
ocupadas = set()
quantas = {}
fiadas = set()
total_sala = {}
LIMITE = {'tochaAcesa': 4, 'escudo': 2, 'armas': 2, 'bandeira': 1, 'cranio': 2,
          'quadro': 2, 'corrente': 1, 'musgo': 2, 'teia': 2, 'tochaApagada': 2}
TETO_SALA = 5


def fiada(X, Y, lado):
    # A fiada e a fileira de parede que corre junta na tela: a do norte anda
    # em X com Y parado, a do oeste anda em Y com X parado.
    return (lado, Y) if lado == 'N' else (lado, X)


def cabe(X, Y, lado, sala, tipo):
    if any((X + i, Y + j) in ocupadas for i in (-2, -1, 0, 1, 2) for j in (-2, -1, 0, 1, 2)):
        return False
    if quantas.get((sala, tipo), 0) >= LIMITE.get(tipo, 2):
        return False
    if (sala, tipo) + fiada(X, Y, lado) in fiadas:
        return False
    if tipo != 'tochaAcesa' and total_sala.get(sala, 0) >= TETO_SALA:
        return False
    return True


def pendura(X, Y, lado, sala, tipo):
    ocupadas.add((X, Y))
    quantas[(sala, tipo)] = quantas.get((sala, tipo), 0) + 1
    fiadas.add((sala, tipo) + fiada(X, Y, lado))
    if tipo != 'tochaAcesa':
        total_sala[sala] = total_sala.get(sala, 0) + 1
    DECOR.append({'x': X, 'y': Y, 'lado': lado, 'tipo': tipo})


# A TOCHA ilumina: uma a cada sete paredes da sala, e so onde ha fogo. Mais
# que isso e o castelo vira corredor de hotel.
contador = {}
for Y in range(H):
    for X in range(W):
        for lado, grade in (('N', PN), ('O', PO)):
            if grade[Y][X] != '#':
                continue
            sala = REG[Y][X]
            if sala not in (None, 'fora') and sala not in SEM_FOGO:
                n = contador.get(sala, 0)
                contador[sala] = n + 1
                if n % 7 == 0 and cabe(X, Y, lado, sala, 'tochaAcesa'):
                    pendura(X, Y, lado, sala, 'tochaAcesa')
                    continue
            if sala in (None, 'fora'):
                continue
            tipos, cheia = GOSTO.get(sala, PADRAO)
            r = mistura(X, Y, 1 if lado == 'N' else 2)
            if r > cheia:
                continue
            if not tipos:
                continue
            tipo = tipos[int(mistura(X, Y, 7) * len(tipos))]
            if tipo == 'tochaAcesa' and sala in SEM_FOGO:
                tipo = 'tochaApagada'
            if not cabe(X, Y, lado, sala, tipo):
                continue
            pendura(X, Y, lado, sala, tipo)

# QUAL VAO TEM FOLHA DE PORTA. Nem todo vao e porta: o livro poe ARCADAS no
# salao escuro e no santuario -- pedra vazada, sem nada para fechar. Os outros
# vaos sao passagem de gente que mora aqui, e esses tem porta.
#
# A diferenca importa no jogo: so o vao com folha aparece no menu com "fechar
# a porta". Sem esta lista, o jogo deixava fechar um arco vazio, e uma porta
# de madeira nascia do nada no meio da arcada.
ARCADAS = {'salaoEscuro', 'santuario', 'ruina', 'terraco'}
FOLHAS = []
for Y in range(H):
    for X in range(W):
        for lado in ('N', 'O'):
            c = PN[Y][X] if lado == 'N' else PO[Y][X]
            if c not in '+/':
                continue
            aX, aY = (X, Y - 1) if lado == 'N' else (X - 1, Y)
            if not (0 <= aX < W and 0 <= aY < H):
                continue
            r1, r2 = REG[Y][X], REG[aY][aX]
            if r1 in ARCADAS and r2 in ARCADAS:
                continue               # arcada: vao vazado, sem folha
            FOLHAS.append([{'x': X, 'y': Y}, {'x': aX, 'y': aY}])

# ALTURA DA PAREDE, por casa. O castelo inteiro com 3 niveis vira uma caixa:
# o horizonte fica reto de ponta a ponta e nada diz o que e torre e o que e
# muro. As torres sobem um nivel; a ruina, que esta sem telhado e caindo,
# desce um. O resto fica no padrao.
TORRES = {'torreUrso', 'torreSul', 'postoNorte', 'postoSul'}
BAIXAS = {'ruina', 'terraco'}
PA = [[3] * W for _ in range(H)]
for Y in range(H):
    for X in range(W):
        r = REG[Y][X]
        if r in TORRES:
            PA[Y][X] = 4
        elif r in BAIXAS:
            PA[Y][X] = 2

# PAREDE SOLTA: a lamina que nao fecha nada. Sao os cotocos de parede que o
# livro deixa no meio do castelo arruinado -- nao travessam sala nenhuma e
# nao encostam em outra parede em ponta nenhuma. Em altura cheia ela fica
# como uma lousa plantada no chao, sem ler como nada. Rebaixada para UM
# nivel, lê como o que e: o resto de uma parede que caiu.


def ponta_livre(X, Y, lado, qual):
    def ar(ax, ay, l):
        if not (0 <= ax < W and 0 <= ay < H):
            return '.'
        return PN[ay][ax] if l == 'N' else PO[ay][ax]
    if lado == 'N':
        viz = ([(X - 1, Y, 'N'), (X, Y, 'O'), (X, Y - 1, 'O')] if qual == 'A'
               else [(X + 1, Y, 'N'), (X + 1, Y, 'O'), (X + 1, Y - 1, 'O')])
    else:
        viz = ([(X, Y - 1, 'O'), (X, Y, 'N'), (X - 1, Y, 'N')] if qual == 'A'
               else [(X, Y + 1, 'O'), (X, Y + 1, 'N'), (X - 1, Y + 1, 'N')])
    return all(ar(*v) not in '#+/J' for v in viz)


for Y in range(H):
    for X in range(W):
        arestas = [l for l in ('N', 'O') if (PN[Y][X] if l == 'N' else PO[Y][X]) in '#+/J']
        if not arestas:
            continue
        if all(ponta_livre(X, Y, l, 'A') and ponta_livre(X, Y, l, 'B') for l in arestas):
            PA[Y][X] = 1

# A MAO, por cima da regra. Nenhuma conta acerta o que fica feio: as paredes
# abaixo sao degraus da quina de fora do castelo, escolhidas uma a uma no
# olho, na pagina `/alturas.html?encontro=castelo&nivel=3` (que abre o mapa no
# tabuleiro de verdade e deixa clicar nas paredes). Para refazer a escolha,
# abra a pagina, clique, e cole aqui o que ela imprime.
PAREDES_BAIXAS = {
    (11, 2): 2,
    (12, 2): 2,
    (34, 4): 1,
    (21, 4): 1,
    (35, 5): 1,
    (35, 8): 1,
    (35, 10): 1,
    (4, 24): 1,
    (5, 25): 1,
    (24, 25): 1,
}
for (X, Y), niveis in PAREDES_BAIXAS.items():
    PA[Y][X] = niveis


# DECORACAO SO EM PAREDE QUE A SUSTENTE. Tocha, quadro, bandeira, armas,
# escudo, cranio e corrente ficam na altura do peito: numa parede rebaixada
# elas flutuam acima da pedra, penduradas no ar. Musgo e teia nao penduram --
# nascem NA pedra --, entao continuam valendo numa parede de dois niveis;
# numa de um nivel, que e cotoco de parede caida, nao fica nada.
PENDURA = {'tochaAcesa', 'tochaApagada', 'quadro', 'bandeira', 'armas',
           'escudo', 'cranio', 'corrente'}


def cabe_na_altura(d):
    niveis = PA[d['y']][d['x']]
    if niveis >= 3:
        return True
    if niveis <= 1:
        return False
    return d['tipo'] not in PENDURA


tirados = [d for d in DECOR if not cabe_na_altura(d)]
DECOR[:] = [d for d in DECOR if cabe_na_altura(d)]
if tirados:
    print('decoracao tirada de parede baixa: %d (%s)'
          % (len(tirados), ', '.join('%s em %d,%d' % (d['tipo'], d['x'], d['y']) for d in tirados)))

# FOGO QUE ILUMINA. A tocha de parede e o braseiro eram so desenho: o castelo
# ficava num breu chapado, com as tochas como pontinhos sem pocaO de luz. Agora
# cada fogo aceso vira fonte em `field.luzes` (src/rules/luz.js), entao ele
# clareia a sala de verdade, no desenho E na regra -- o que casa com o livro,
# onde a parte ocupada da fortaleza esta acesa.
#
# A tocha de parede alumia menos que a tocha na mao de um heroi (20 pes), para
# o corredor nao ficar lavado; o braseiro, que e fogo grande, alumia mais.
LUZES = []
for d in DECOR:
    if d['tipo'] == 'tochaAcesa':
        LUZES.append({'x': d['x'], 'y': d['y'], 'claro': 15, 'penumbra': 15, 'tipo': 'tocha'})
for Y in range(H):
    for X in range(W):
        if T[Y][X] == 'e':          # braseiro aceso
            LUZES.append({'x': X, 'y': Y, 'claro': 20, 'penumbra': 20, 'tipo': 'fogueira'})

# CONFERENCIA. O mapa so sai se o chao do castelo continuar inteiro com as
# portas abertas. E barato de medir e caro de descobrir no jogo.
ANDA = {g for g in 'L,pxzwF_:k' } | {'1', '2', '3'}
chao = [(X, Y) for Y in range(H) for X in range(W) if T[Y][X] in 'Lpxcvdj']
if chao:
    vistas, fila = {chao[0]}, [chao[0]]
    alvo = set(chao)
    while fila:
        X, Y = fila.pop()
        for (dx, dy) in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = (X + dx, Y + dy)
            if n in alvo and n not in vistas and passa_aresta(X, Y, n[0], n[1]):
                vistas.add(n); fila.append(n)
    if len(vistas) != len(chao):
        fora = sorted(set(chao) - vistas)
        raise SystemExit('CHAO PARTIDO: %d casas sem caminho, por exemplo %s'
                         % (len(fora), fora[:8]))
    print('chao inteiro: %d casas, todas alcancaveis' % len(chao))

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
    'paredes': {'n': [''.join(l) for l in PN], 'o': [''.join(l) for l in PO],
                'alt': [''.join(str(v) for v in l) for l in PA]},
    'terreno': [''.join(l) for l in T],
    'altura': [''.join(str(v) for v in l) for l in A],
    'luz': [''.join(str(v) for v in l) for l in L],
    # Em casa da grade, como o terreno e a decoracao -- nao no sistema do
    # retangulo das salas, que e o que `o()` desloca.
    'luzes': [{'pos': {'x': f['x'], 'y': f['y']},
               'claro': f['claro'], 'penumbra': f['penumbra'], 'tipo': f['tipo']} for f in LUZES],
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
    'decor': DECOR,
    # Os vaos que tem folha de porta (os outros sao arcada vazada).
    'folhas': FOLHAS,
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
