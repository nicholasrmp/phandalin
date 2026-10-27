# Gera `src/game/mansao.js`: terreno, paredes, altura e luz do esconderijo dos
# Marcarrubra, embaixo da Mansão Tresendar (Parte 2 da aventura, áreas 1-12).
#
#   python src/dev/mapa-mansao.py
#
# A GRADE É A DA PLANTA DE REFERÊNCIA, casa por casa: 30 x 20, 1 casa = 1,5 m, sem
# deslocamento (a casa (x, y) daqui é o quadrado (x, y) da imagem). A imagem fica em
# `_referencias/` (fora do repositório) e só dá a ORGANIZAÇÃO: nós não copiamos a arte.
# As paredes são FINAS, de borda (`paredes.n` e `paredes.o`, como no castelo): a parede fica
# na aresta entre duas casas e não come casa nenhuma, então toda sala tem o tamanho da planta.
#
# COMO SE LÊ. Cada casa de piso pertence a uma REGIÃO (sala, corredor, caverna). Onde duas
# regiões se encostam há parede (`#`), salvo onde a planta abre uma passagem (ABERTURAS). Entre
# a caverna e a pedra não há parede: a pedra é a casa `R`. Entre uma sala construída e a pedra
# há parede de alvenaria. Portas, as secretas, a trancada e as grades das celas são arestas.
#
# Alturas (um nível = 1,5 m): o oeste é mais baixo que o leste, como o livro diz. Leste e
# caverna no nível 4; oeste (salas 9-12) no 3; a fenda no 0 (seis metros abaixo); o anel de
# pedra do porão no 5, com as escadinhas entre os dois pisos.
import json
from collections import deque
from pathlib import Path

W, H = 30, 20
R = lambda a, b: range(a, b + 1)

T = [['R'] * W for _ in range(H)]            # glifo de cada casa (R = pedra, fora do esconderijo)
A = [[3] * W for _ in range(H)]              # altura (a pedra longe de tudo fica no 3)
L = [[0] * W for _ in range(H)]              # luz: 2 claro, 1 penumbra, 0 breu
REG = [[None] * W for _ in range(H)]         # região de cada casa de piso
CAVERNA = {'caverna', 'fenda'}               # regiões que se abrem umas para as outras sem parede

PROPS = []                                   # mobília de arte própria: {tipo 'prop', x, y, variante, espelhar?}
DECOR = []                                   # candeeiros nas paredes: {x, y, lado 'N'|'O', tipo}
DEGRAUS = []                                 # casas de escada (só o desenho dos degraus)


def casa(x, y, reg, g='L', h=4, luz=1):
    T[y][x] = g
    A[y][x] = h
    L[y][x] = luz
    REG[y][x] = reg


def retang(reg, x0, y0, x1, y1, g='L', h=4, luz=1):
    for y in R(y0, y1):
        for x in R(x0, x1):
            casa(x, y, reg, g, h, luz)


def glifo(x, y, g):
    T[y][x] = g


def prop(x, y, variante, bloqueia=True, espelhar=False):
    """Uma peça do atlas: `^` barra o passo e dá cobertura; `&` é chão de passar (a variante vem da anotação)."""
    T[y][x] = '^' if bloqueia else '&'
    item = {'tipo': 'prop', 'x': x, 'y': y, 'variante': variante}
    if espelhar:
        item['espelhar'] = True
    PROPS.append(item)


# ------------------------------------------------------------ o oeste (nível 3) ----
retang('oficina', 2, 2, 5, 5, 'L', 3, 2)                      # 11 a oficina do mago (4 x 4)
retang('quartoMago', 6, 2, 9, 4, 'L', 3, 2)                   # 12 o quarto do Cajavidro (4 x 3)
retang('estarRubro', 2, 7, 6, 11, 'L', 3, 2)                  # 10 a sala de estar (5 x 5)
retang('guardasBugbear', 2, 15, 6, 17, 'L', 3, 2)             # 9 o alojamento dos bugbears (5 x 3)

# O corredor de cima: do pé da oficina até a caverna, com a escada de dois lances.
for (x, h) in [(4, 3), (5, 3), (6, 3), (7, 4), (8, 4)]:
    casa(x, 6, 'corredorNorte', 'L', h, 1)
casa(8, 7, 'corredorNorte', 'L', 4, 1)
DEGRAUS += [{'x': 6, 'y': 6, 'eixo': 'x'}, {'x': 7, 'y': 6, 'eixo': 'x'}]

# O corredor do sul: da sala de estar até o alojamento dos bugbears, e o lance que sobe à caverna.
for (x, y, h) in [(3, 12, 3), (3, 13, 3), (3, 14, 3), (4, 14, 3), (5, 14, 4), (6, 14, 4)]:
    casa(x, y, 'corredorSul', 'L', h, 1)
DEGRAUS += [{'x': 4, 'y': 14, 'eixo': 'x'}, {'x': 5, 'y': 14, 'eixo': 'x'}]

# A escadinha secreta entre o quarto (12) e o depósito (7): 1 casa de largura, três de comprimento.
casa(10, 2, 'escadaSecreta', 'L', 3, 1)
casa(10, 3, 'escadaSecreta', 'L', 4, 1)
casa(10, 4, 'escadaSecreta', 'L', 4, 1)
DEGRAUS += [{'x': 10, 'y': 3, 'eixo': 'y'}]

# ------------------------------------------------------------ o leste (nível 4) ----
retang('deposito', 11, 2, 14, 4, 'L', 4, 1)                   # 7 o depósito (4 x 3) ...
casa(15, 2, 'deposito', 'L', 4, 1)                            # ... e o nicho de trás da porta secreta
retang('corredorArmas', 16, 2, 16, 4, 'L', 4, 1)              # o corredor do depósito de armas
retang('armas', 17, 2, 18, 4, 'L', 4, 1)                      # 6 o depósito de armas (2 x 3), trancado
retang('cripta', 16, 5, 19, 10, 'L', 4, 1)                    # 4 as criptas (4 x 6)
retang('jaulas', 20, 2, 22, 8, 'L', 4, 2)                     # 5 as jaulas (3 x 7)
retang('corredorFosso', 20, 9, 27, 10, 'L', 4, 0)             # 3 o corredor do fosso (8 x 2)
casa(26, 11, 'passagemPorao', 'L', 4, 1)                      # a passagem entre o corredor e o porão

# 1 O porão com a cisterna (8 x 6, com dois entalhes de pedra); a parte clara no 4, o anel de pedra no 5.
for y in R(12, 17):
    for x in R(20, 27):
        if (x, y) in {(23, 12), (24, 12), (23, 17), (24, 17)}:
            continue                                          # os entalhes de pedra (a planta tem dois, de cada lado)
        cinza = y in (12, 17) and x >= 25          # o patamar de pedra: só as fileiras 12 e 17; as quatro escadinhas descem dele
        casa(x, y, 'poraoCisterna', 'L', 5 if cinza else 4, 2)
retang('poraoCisterna', 20, 14, 22, 15, 'V', 3, 2)            # a cisterna (3 x 2), um nível abaixo do piso
DEGRAUS += [{'x': 25, 'y': 13, 'eixo': 'y'}, {'x': 25, 'y': 16, 'eixo': 'y'},
            {'x': 27, 'y': 13, 'eixo': 'y'}, {'x': 27, 'y': 16, 'eixo': 'y'}]
for (x, y) in [(25, 13), (25, 16), (27, 13), (27, 16)]:
    A[y][x] = 4
casa(28, 14, 'entrada', 'L', 4, 1)                            # a porta da escada da cozinha, a leste
casa(29, 14, 'entrada', 'L', 4, 1)

# 2 O alojamento dos Marcarrubra (3 x 4 e o vestíbulo da porta) e o túnel da secreta da cisterna.
retang('alojamentoRubro', 16, 12, 18, 15, 'L', 4, 2)
casa(19, 13, 'alojamentoRubro', 'L', 4, 2)
for (x, y) in [(14, 15), (15, 15), (15, 16), (15, 17), (16, 17), (17, 17), (18, 17), (19, 17)]:
    casa(x, y, 'tunelCisterna', 'L', 4, 0)

# 8 A caverna da fenda. A margem de cada fileira (as casas de chão de caverna) e a fenda no meio, que só se cruza
# pelas duas pontes. A pedra em volta é `R`.
CHAO_CAVERNA = {
    5: [12, 13],
    6: [12, 13, 14],
    7: [9, 12, 13, 14],
    8: [9, 12, 13, 14],
    9: [9, 12, 13, 14],
    10: [9, 12, 13],
    11: [8, 9, 12, 13],
    12: [8, 9, 12, 13],
    13: [8, 9, 12, 13],
    14: [7, 8, 9, 12, 13],
    15: [8, 9, 12, 13],
    16: [9, 10],
    17: [10], 18: [10], 19: [10],
}
fenda = {6: (10, 11), 7: (10, 11), 8: (10, 11), 9: (10, 11), 10: (10, 11), 11: (10, 11), 12: (10, 11), 13: (10, 11),
         14: (10, 11), 15: (10, 11)}      # a fenda tem 2 casas de largura e some em y=15; as pontes têm 2 casas, como as tábuas da planta
for y, xs in CHAO_CAVERNA.items():
    for x in xs:
        casa(x, y, 'caverna', '_', 4, 0)
for y, (x0, x1) in fenda.items():
    for x in R(x0, x1):
        casa(x, y, 'fenda', 'x', 0, 0)
# As duas pontes, de leste a oeste, no nível da caverna. A do sul é a podre.
PONTES = {'norte': 8, 'sul': 14}
for y in PONTES.values():
    for x in R(*fenda[y]):
        casa(x, y, 'fenda', '=', 4, 0)
# As duas colunas grossas da caverna: nas bordas da fenda, uma em cada lado.
glifo(12, 9, 'A'); glifo(9, 13, 'A')

# ------------------------------------------------------------ paredes de borda ----
PN = [['.'] * W for _ in range(H)]           # a aresta do NORTE de cada casa (com a casa de cima)
PO = [['.'] * W for _ in range(H)]           # a aresta do OESTE de cada casa (com a casa da esquerda)


def aresta(a, b):
    """A grade e o índice da aresta entre as casas vizinhas `a` e `b`."""
    (ax, ay), (bx, by) = a, b
    if bx == ax + 1:
        return PO, bx, by
    if bx == ax - 1:
        return PO, ax, ay
    if by == ay + 1:
        return PN, bx, by
    return PN, ax, ay


def poe(a, b, cod):
    g, x, y = aresta(a, b)
    g[y][x] = cod


def grupo(reg):
    return 'cave' if reg in CAVERNA else reg


for Y in range(H):
    for X in range(W):
        for (VX, VY), g in (((X, Y - 1), PN), ((X - 1, Y), PO)):
            if VX < 0 or VY < 0:
                continue
            a, b = REG[Y][X], REG[VY][VX]
            if a is None and b is None:
                continue
            if a is None or b is None:
                # A pedra: parede de alvenaria só para sala construída; a caverna tem a própria rocha.
                if grupo(a or b) == 'cave':
                    continue
                g[Y][X] = '#'
            elif grupo(a) != grupo(b):
                g[Y][X] = '#'

# As aberturas da planta: passagens sem parede nem porta (o depósito abre para a caverna; as escadas dão na caverna).
ABERTURAS = [
    ((12, 4), (12, 5)), ((13, 4), (13, 5)),        # o depósito, de pedra quebrada, abre para a caverna
    ((8, 7), (9, 7)),                              # o patamar do corredor de cima dá na margem oeste
    ((6, 14), (7, 14)),                            # o lance do corredor do sul dá na caverna
    ((13, 15), (14, 15)),                          # a margem leste dá no túnel de pedra
    ((26, 10), (26, 11)), ((26, 11), (26, 12)),    # a passagem do corredor do fosso para o porão
    ((3, 14), (4, 14)),                            # o corredor do sul dobra para a escada
]
for (a, b) in ABERTURAS:
    if a != b:
        poe(a, b, '.')

# As portas comuns da planta: nascem FECHADAS (`+`, a planta as desenha com folha) e abrem e fecham de graça (a cena). Só a
# da escada da cozinha nasce aberta: o grupo chega pelos dois lados dela.
PORTAS_ABERTAS = [
    ((5, 3), (6, 3)),        # oficina - quarto
    ((4, 5), (4, 6)),        # oficina - corredor de cima
    ((4, 6), (4, 7)),        # corredor de cima - sala de estar
    ((3, 11), (3, 12)),      # sala de estar - corredor do sul
    ((3, 14), (3, 15)),      # corredor do sul - alojamento dos bugbears
    ((16, 4), (16, 5)),      # corredor do depósito de armas - cripta
    ((19, 5), (20, 5)),      # cripta - jaulas
    ((19, 9), (20, 9)),      # cripta - corredor do fosso (as duas folhas de cobre)
    ((19, 10), (20, 10)),
    ((27, 14), (28, 14)),    # porão - escada da cozinha
]
for (a, b) in PORTAS_ABERTAS:
    poe(a, b, '/' if (a, b) == ((27, 14), (28, 14)) else '+')
TRANCADA = ((16, 2), (17, 2))                       # a porta do depósito de armas: trancada
PORTAS = {'alojamento': ((19, 13), (20, 13))}       # a porta do alojamento: fechada
for (a, b) in [TRANCADA] + list(PORTAS.values()):
    poe(a, b, '+')
# As PORTAS SECRETAS são parede (`#`) até a cena achar; guardadas aqui só para a cena saber onde ficam.
SECRETAS = {
    'quarto': ((9, 2), (10, 2)),                    # o nordeste do quarto, para a escadinha
    'passagem': ((10, 4), (11, 4)),                 # a escadinha, para o depósito
    'deposito': ((15, 2), (16, 2)),                 # o nicho do depósito, para o corredor das armas
    'cisterna': ((19, 17), (20, 17)),               # o túnel, para o porão
}
# As grades das celas: arestas de seteira (barram o passo, não a visão). Duas fileiras, três casas cada.
CELAS = {'norte': [((x, 3), (x, 4)) for x in R(20, 22)], 'sul': [((x, 6), (x, 7)) for x in R(20, 22)]}
for pares in CELAS.values():
    for (a, b) in pares:
        poe(a, b, 'J')

# O fosso escondido, no meio do corredor 3: duas casas de comprimento, nas duas fileiras.
FOSSO = [(23, 9), (24, 9), (23, 10), (24, 10)]

# ------------------------------------------------------------ mobília ----
# A planta de referência mostra salas MOBILIADAS. As peças saem do atlas do cenário (as mesmas da mobília de Árvore
# Trovão). Regra: nenhuma peça fecha a passagem (o teste `testes-sala.mjs` mede que nenhuma casa de piso fica ilhada),
# nem pisa onde nasce gente ou onde há porta.
# 11 oficina: estantes ao longo da parede oeste, a bancada do alquimista, um balcão ao norte, barril e cesto.
prop(2, 2, 'estante'); prop(2, 3, 'prateleira'); prop(2, 4, 'estante'); prop(2, 5, 'prateleira')
prop(3, 2, 'prateleira')
prop(3, 3, 'mesaFerramentas'); prop(3, 4, 'tina')
prop(5, 5, 'saco')
glifo(5, 2, 'e')                                              # o alambique aceso (braseiro)
# 12 quarto: a escrivaninha da carta, o baú (um barril de ferragens) e a cama; a planta tem tapete e jarro.
glifo(7, 2, 'm'); glifo(7, 4, 'K'); glifo(9, 4, 'z')
prop(6, 2, 'candelabro')
# 7 depósito: palha e tábuas, um barril, caixotes e a mesa de ferramentas com corda.
prop(11, 2, 'tabuas'); prop(11, 3, 'cubaCerveja'); glifo(12, 2, 's'); prop(14, 3, 'ferramentas'); glifo(14, 4, 's')
# 6 depósito de armas: o cabide de armas e a prateleira de garrafas.
glifo(18, 2, 'g'); glifo(18, 3, 'g'); prop(18, 4, 'prateleira')
# 4 cripta: três sarcófagos de duas casas cada, um pilar caído, ossos e a tocha da parede leste.
SARCOFAGOS = [[(16, 6), (16, 7)], [(16, 8), (16, 9)], [(19, 6), (19, 7)]]
for s in SARCOFAGOS:
    for (x, y) in s:
        glifo(x, y, 'Q')
prop(18, 9, 'ossos', bloqueia=False); prop(18, 10, 'pilarQuebrado')
glifo(19, 8, 'e')
# 5 jaulas: palha nas duas celas, a pilha de roupa e a lanterna.
for (x, y) in [(20, 2), (22, 2), (21, 3), (20, 7), (22, 8), (21, 8)]:
    glifo(x, y, 'p')
glifo(22, 5, 's'); prop(22, 4, 'lanterna', bloqueia=False)
# 3 corredor do fosso: as duas colunas falsas junto da parede norte.
prop(22, 9, 'pilarQuebrado'); prop(26, 9, 'pilarQuebrado')
# 1 porão: barris no entalhe do norte, a cuba e os barris do sul, a cisterna no meio.
for x in R(20, 22):
    glifo(x, 12, 's')
glifo(21, 17, 's'); prop(22, 17, 'cubaCerveja')
# 2 alojamento dos Marcarrubra: dois beliches, a mesa, a bancada e a pilha de caixotes.
glifo(16, 12, 'z'); glifo(18, 12, 'z'); glifo(17, 15, 's'); glifo(18, 15, 's'); glifo(18, 14, 's'); prop(16, 15, 'banco')
# 10 sala de estar: duas mesas, a cuba de cerveja, um banco e as estantes da parede oeste.
glifo(3, 8, 'm'); glifo(4, 8, 'm'); glifo(5, 10, 'm')
glifo(6, 7, 's'); prop(2, 7, 'banco'); prop(2, 10, 'estante'); glifo(6, 11, 'e')
# 9 alojamento dos bugbears: quatro beliches, um em cada canto.
for (x, y) in [(2, 15), (5, 15), (2, 17), (5, 17)]:
    glifo(x, y, 'z')

# ------------------------------------------------------------ luz ----
LUZES = []
for (x, y, claro, penumbra, tipo) in [
    (5, 2, 20, 20, 'fogueira'),      # 11 oficina: o alambique aceso
    (6, 11, 20, 20, 'fogueira'),     # 10 sala de estar: o braseiro do jogo
    (19, 8, 15, 15, 'fogueira'),     # 4 cripta: a tocha da parede leste
    (7, 2, 15, 15, 'tocha'),         # 12 quarto: a vela da escrivaninha
    (22, 4, 15, 15, 'tocha'),        # 5 jaulas: a lanterna
    (4, 16, 15, 15, 'tocha'),        # 9 alojamento dos bugbears: a lamparina do teto
    (24, 13, 15, 15, 'tocha'),       # 1 porão: a lamparina de parede
]:
    LUZES.append({'pos': {'x': x, 'y': y}, 'claro': claro, 'penumbra': penumbra, 'tipo': tipo})

# Candeeiros nas paredes de TRÁS de cada sala (as arestas N e O, que ficam atrás da casa na câmera). Só nas salas com luz.
for (x, y, lado) in [(4, 2, 'N'), (8, 2, 'N'), (13, 2, 'N'), (17, 2, 'N'), (21, 2, 'N'), (3, 7, 'N'), (4, 15, 'N'),
                     (17, 12, 'N'), (24, 13, 'N'), (16, 7, 'O'), (2, 3, 'O'), (2, 9, 'O'), (2, 16, 'O')]:
    DECOR.append({'x': x, 'y': y, 'lado': lado, 'tipo': 'tochaAcesa'})

# ------------------------------------------------------------ altura das paredes ----
# Cada casa guarda os níveis das paredes do norte e do oeste dela (3 por padrão). A parede que fica na FRENTE de uma
# peça de mobília (a casa de trás, na vista da câmera, tem objeto) fica baixa, em 1 nível, para não escondê-la.
OBJETO = set('sKzmQeAgp^')
PA = [[3] * W for _ in range(H)]
for Y in range(H):
    for X in range(W):
        for (VX, VY), g in (((X, Y - 1), PN), ((X - 1, Y), PO)):
            if g[Y][X] not in '#+/J':
                continue
            if VX >= 0 and VY >= 0 and T[VY][VX] in OBJETO:
                PA[Y][X] = 1
# A decoração só fica em parede alta.
DECOR[:] = [d for d in DECOR if PA[d['y']][d['x']] >= 3]

# As folhas de porta (arco com folha de madeira): as portas comuns, a trancada e a do alojamento.
FOLHAS = [[{'x': a[0], 'y': a[1]}, {'x': b[0], 'y': b[1]}] for (a, b) in PORTAS_ABERTAS + [TRANCADA] + list(PORTAS.values())]

# ---------------------------------------------------------------- saída ----
alt = lambda v: str(v) if v < 10 else 'abcdefghij'[v - 10]
cab = '''// O ESCONDERIJO DOS MARCARRUBRA (Parte 2): os porões da Mansão Tresendar.
//
// Gerado por `src/dev/mapa-mansao.py` — mude lá e rode de novo.
//
// A grade é a da planta de referência, casa por casa (30 x 20), com paredes finas de borda.
// Áreas do livro: 1 porão com a cisterna (entrada pela escada da cozinha, a
// leste) · 2 alojamento · 3 corredor do fosso · 4 criptas · 5 jaulas ·
// 6 depósito de armas (trancado) · 7 depósito · 8 caverna da fenda (entrada
// pelo túnel do Carp, ao sul) · 9 alojamento dos bugbears · 10 sala de estar ·
// 11 oficina do mago · 12 quarto do Cajavidro.
//
// Glifos: R pedra · L laje · _ chão de caverna · V cisterna · = ponte · x fundo da fenda ·
// A coluna · s barris e caixotes · z beliche · K baú · m mesa · Q sarcófago · e braseiro ·
// g cabide de armas · p palha · ^ & mobília de arte própria. Alturas em dígitos (um nível = 1,5 m).
// Luz: 2 claro, 1 penumbra, 0 breu.
'''
ponto = lambda p: {'x': p[0], 'y': p[1]}
par = lambda p: {'a': ponto(p[0]), 'b': ponto(p[1])}
dados = {
    'luzes': LUZES,
    'terreno': [''.join(l) for l in T],
    'altura': [''.join(alt(v) for v in l) for l in A],
    'luz': [''.join(str(v) for v in l) for l in L],
    'paredes': {'n': [''.join(l) for l in PN], 'o': [''.join(l) for l in PO],
                'alt': [''.join(str(v) for v in l) for l in PA]},
}
nomes = sorted({r for linha in REG for r in linha if r and r not in CAVERNA})   # a caverna não é sala: o piso dela é de terra
extra = {
    'salas': {n: [{'x': x, 'y': y} for y in range(H) for x in range(W) if REG[y][x] == n] for n in nomes},
    'secretas': {k: par(v) for k, v in SECRETAS.items()},
    'trancada': par(TRANCADA),
    'portas': {k: par(v) for k, v in PORTAS.items()},
    'celas': {k: [par(p) for p in v] for k, v in CELAS.items()},
    'pontes': PONTES, 'fenda': {str(k): v for k, v in fenda.items()},
    'fosso': [{'x': x, 'y': y} for (x, y) in FOSSO],
    'entradas': {'cozinha': {'x': 29, 'y': 14}, 'tunel': {'x': 10, 'y': 19}},
    'portasComuns': [par(p) for p in PORTAS_ABERTAS],
    # Os três sarcófagos da cripta, cada um de duas casas (um anel de platina por sarcófago, e não por casa).
    'sarcofagos': [[ponto(c) for c in s] for s in SARCOFAGOS],
    # As grades das celas (aresta de barra): a chave 'x,y,N' é a aresta do NORTE da casa de baixo.
    'grades': [f'{b[0]},{b[1]},N' for pares in CELAS.values() for (a, b) in pares],
    'props': PROPS, 'decor': DECOR, 'degraus': DEGRAUS, 'folhas': FOLHAS,
}
saida = Path(__file__).resolve().parents[1] / 'game' / 'mansao.js'
saida.write_text(
    cab + '\nexport const MAPA_MANSAO = ' + json.dumps(dados, indent=2, ensure_ascii=False) + ';\n\n'
    + 'export const MANSAO = ' + json.dumps(extra, indent=2, ensure_ascii=False) + ';\n',
    encoding='utf-8', newline='\n')
print('\n'.join(dados['terreno']))
print()
print('\n'.join(dados['altura']))
print()
print('\n'.join(dados['paredes']['n']))
print()
print('\n'.join(dados['paredes']['o']))
