# Gera `src/game/cume.js`: o terreno, a altura e a luz do Cume da Wyvern
# (Parte 3 da aventura).
#
#   python src/dev/mapa-cume.py
#
# O TRACADO vem do mapa que o usuario mandou (`_referencias/cume/
# mapa-usuario.jpg`, fora do repositorio): um desfiladeiro de terra entre
# planaltos de pedra, com dois acampamentos no fundo -- o da carroca, a
# oeste, e o das camas e fogueiras, ao norte --, campo e arvores a sudeste.
# Lido a olho e passado para a nossa grade de 1,5 m; nada e copiado pixel a
# pixel. Os FATOS sao do livro: o acampamento orc escondido no cume, a
# entrada de uma caverna ao pe de um paredao, e um orc de vigia atras de uma
# pedra uns 20 m fora dela.
#
# Alturas (um nivel = 1,5 m): o fundo do desfiladeiro e o campo no 0; o alto
# dos planaltos no 2 (o paredao nao se sobe -- so pela escada de cordas, que
# os orcs deixaram no planalto do meio). A caverna fica no 0, cavada no
# planalto leste, no escuro.
#
# Glifos: , capim · : terra batida · k alto do planalto (pedregal) · R rocha
# (parede da caverna) · _ chao da caverna · T arvore · r pedra · b moita ·
# z cama de palha · u barris e caixotes · F fogueira · C carroca (2 x 2) ·
# K bau · l escada de cordas.
W, H = 30, 21
T = [[','] * W for _ in range(H)]
A = [[0] * W for _ in range(H)]
L = [[2] * W for _ in range(H)]        # luz: dia claro, menos dentro da caverna

R = lambda a, b: range(a, b + 1)


def pinta(xs, ys, g, h=None):
    for y in ys:
        for x in xs:
            T[y][x] = g
            if h is not None:
                A[y][x] = h


def casa(x, y, g, h=None):
    T[y][x] = g
    if h is not None:
        A[y][x] = h


# --------------------------------------------------- os planaltos (alto) ----
# O norte inteiro e pedra alta; o desfiladeiro e cavado nele.
pinta(R(0, 29), R(0, 9), 'k', 2)
pinta(R(0, 1), R(10, 15), 'k', 2)         # a borda oeste do vale
pinta(R(0, 5), R(16, 20), 'k', 2)         # o planalto baixo do sudoeste

# ------------------------------------------- o desfiladeiro (terra, no 0) ----
# O acampamento da carroca, a noroeste.
pinta(R(1, 5), R(1, 4), ':', 0)
# O vale do oeste, descendo ate o campo do sul.
pinta(R(2, 4), R(5, 15), ':', 0)
pinta(R(5, 6), R(12, 15), ':', 0)
# O corredor de cima, do acampamento da carroca ate o das camas.
pinta(R(6, 13), R(3, 4), ':', 0)
casa(6, 2, ':', 0); casa(7, 2, ':', 0)
# O acampamento das camas e fogueiras, ao norte.
pinta(R(13, 23), R(1, 4), ':', 0)
# A passagem estreita do sudeste, do acampamento ate o campo.
pinta(R(16, 17), R(5, 9), ':', 0)
casa(18, 9, ':', 0)

# O planalto do meio: alto, cercado de paredao, com a escada de cordas
# subindo do corredor de cima.
pinta(R(7, 14), R(5, 11), 'k', 2)
ESCADA = (12, 4)                          # no corredor, ao pe do paredao
casa(12, 5, 'l', 1)                       # o degrau do meio da escada
# A segunda escada, do lado sul, longe do vigia: quem quer o alto do planalto
# para atirar nao precisa passar por ele.
ESCADA2 = (10, 13)                        # pintada depois do campo, abaixo

# ------------------------------------------------- o campo, a sudeste ----
pinta(R(7, 29), R(12, 20), ',', 0)
pinta(R(15, 29), R(10, 11), ',', 0)
pinta(R(18, 29), R(9, 9), ',', 0)
pinta(R(24, 29), R(5, 8), ',', 0)
pinta(R(26, 29), R(0, 4), ',', 0)
pinta(R(6, 6), R(16, 20), ',', 0)
# Arvores: o bosque do meio do campo, o do sul e a mata da borda leste.
for (x, y) in [(16, 12), (17, 12), (18, 12), (16, 13), (17, 13), (19, 13), (15, 13),
               (20, 16), (21, 16), (20, 17), (21, 17), (22, 17), (20, 18), (21, 18),
               (29, 0), (29, 1), (28, 0), (29, 5), (29, 6), (28, 6), (29, 11), (29, 12), (28, 12)]:
    casa(x, y, 'T', 0)
# Pedras e moitas no campo.
for (x, y) in [(25, 10), (14, 13), (28, 3), (27, 3), (8, 19), (12, 17)]:
    casa(x, y, 'r', 0)
for (x, y) in [(23, 14), (25, 17), (10, 14), (13, 20), (26, 19)]:
    casa(x, y, 'b', 0)
# Os troncos caidos onde o vale encontra o campo.
casa(6, 15, 'r', 0)
casa(10, 12, 'l', 1)                      # a segunda escada (ver ESCADA2)

# ------------------------------------------------- a caverna dos orcs ----
# Cavada no planalto leste, abrindo para o acampamento das camas.
pinta(R(19, 27), R(5, 10), 'R', 3)
pinta(R(20, 26), R(6, 9), '_', 0)
# A boca tem duas casas de largura: o ogro, que é Grande, precisa de duas.
ENTRADA = (21, 5)
casa(21, 5, '_', 0); casa(22, 5, '_', 0)
# Penumbra la dentro: a fogueira deles, quase apagada, no fundo. As paredes
# ficam no escuro.
for y in R(5, 10):
    for x in R(19, 27):
        L[y][x] = 0
for y in R(6, 9):
    for x in R(20, 26):
        L[y][x] = 1
L[5][21] = L[5][22] = 1
casa(23, 8, 'F', 0)
BAU = (23, 6)
casa(*BAU, 'K', 0)
casa(20, 9, 'z'); casa(22, 9, 'z'); casa(26, 9, 'z')
# O campo a leste da caverna fica de fora da rocha: refaz a borda.
pinta(R(28, 29), R(5, 10), ',', 0)
for (x, y) in ((29, 5), (29, 6), (28, 6)):
    casa(x, y, 'T', 0)
# O vigia fica na saida da passagem, o mais longe da boca que este mapa
# permite (o livro fala em uns 20 m; aqui sao uns 7), com uma pedra a
# sudeste para se encostar. A passagem continua com duas casas livres: o
# ogro, que e Grande, precisa delas.
PEDRA_DO_VIGIA = (18, 10)
casa(*PEDRA_DO_VIGIA, 'r', 0)

# --------------------------------------------- os dois acampamentos ----
pinta(R(1, 2), R(3, 4), 'C', 0)           # a carroca
casa(4, 2, 'z'); casa(5, 2, 'z')          # palha e peles
casa(4, 1, 'u'); casa(5, 1, 'u')          # barris
for x in (14, 15, 16, 17):
    casa(x, 1, 'z')                       # camas de palha ao longo do paredao
casa(16, 3, 'F'); casa(20, 3, 'F')        # fogueiras
# Barris e caixote encostados no paredao norte, fora do caminho: o ogro
# precisa de duas casas livres para ir da caverna ao corredor.
casa(18, 1, 'u'); casa(19, 1, 'u'); casa(21, 1, 'u')

# ---------------------------------------------------------------- saida ----
# CHÃO PARTIDO. O mapa desenhava 122 casas pisáveis que ninguém alcança — 22%
# das andáveis —, entre elas um anel de planalto que é um mirante sobre o
# acampamento. O jogador vê terreno e não consegue ir; pior, um teleporte podia
# largar alguém lá sem volta. Aqui elas viram rocha, pela mesma regra de passo
# do motor: degrau de mais de um nível é parede.
BLOQUEIA = set('RT')
PARTIDA = (25, 18)      # onde o grupo chega


def _anda(x, y):
    return 0 <= x < W and 0 <= y < H and T[y][x] not in BLOQUEIA


def _passo(x, y, nx, ny):
    return _anda(nx, ny) and abs(A[ny][nx] - A[y][x]) <= 1


_vistas = {PARTIDA}
_fila = [PARTIDA]
while _fila:
    cx, cy = _fila.pop()
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            if not dx and not dy:
                continue
            nx, ny = cx + dx, cy + dy
            if (nx, ny) in _vistas or not _passo(cx, cy, nx, ny):
                continue
            _vistas.add((nx, ny))
            _fila.append((nx, ny))

_seladas = 0
for y in range(H):
    for x in range(W):
        if _anda(x, y) and (x, y) not in _vistas:
            T[y][x] = 'R'
            A[y][x] = 2
            _seladas += 1
print('casas de chao inalcancaveis seladas:', _seladas)

import json
from pathlib import Path

cab = '''// O CUME DA WYVERN (Parte 3): o acampamento orc no desfiladeiro.
//
// Gerado por `src/dev/mapa-cume.py` — mude lá e rode de novo.
//
// Glifos: , capim · : terra · k alto do planalto · R rocha · _ chão da
// caverna · T árvore · r pedra · b moita · z cama · u barris · F fogueira ·
// C carroça · K baú · l escada de cordas. Alturas em dígitos (um nível =
// 1,5 m). Luz: 2 claro, 0 breu (a caverna).
'''
dados = {
    'terreno': [''.join(l) for l in T],
    'altura': [''.join(str(v) for v in l) for l in A],
    'luz': [''.join(str(v) for v in l) for l in L],
}
extra = {
    'entrada': {'x': ENTRADA[0], 'y': ENTRADA[1]},
    'bau': {'x': BAU[0], 'y': BAU[1]},
    'pedraDoVigia': {'x': PEDRA_DO_VIGIA[0], 'y': PEDRA_DO_VIGIA[1]},
    'escada': {'x': ESCADA[0], 'y': ESCADA[1]},
    'escada2': {'x': ESCADA2[0], 'y': ESCADA2[1]},
    'vigia': {'x': 17, 'y': 9},
    'caverna': {'x0': 20, 'y0': 5, 'x1': 26, 'y1': 9},
    'saida': [{'x': x, 'y': 20} for x in range(24, 30)],
}
saida = Path(__file__).resolve().parents[1] / 'game' / 'cume.js'
saida.write_text(
    cab + '\nexport const MAPA_CUME = ' + json.dumps(dados, indent=2, ensure_ascii=False) + ';\n\n'
    + 'export const CUME = ' + json.dumps(extra, indent=2, ensure_ascii=False) + ';\n',
    encoding='utf-8', newline='\n')
print('\n'.join(dados['terreno']))
print()
print('\n'.join(dados['altura']))
