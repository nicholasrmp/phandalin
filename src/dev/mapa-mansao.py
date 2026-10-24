# Gera `src/game/mansao.js`: terreno, altura e luz do esconderijo dos
# Marcarrubra, embaixo da Mansão Tresendar (Parte 2 da aventura, áreas 1-12).
#
#   python src/dev/mapa-mansao.py
#
# A ORGANIZAÇÃO segue o mapa da aventura (a imagem fica em `_referencias/`,
# fora do repositório): 1 casa = 1,5 m, como lá. O DESENHO da grade é nosso:
# paredes viram casas inteiras, e algumas salas encolhem uma casa para caber
# a parede entre elas. Os FATOS do livro ficam: o que liga com o quê, onde
# estão as portas secretas, a cisterna, a fenda com duas pontes e duas
# colunas, as jaulas, os sarcófagos, o corredor do fosso.
#
# Alturas (um nível = 1,5 m): o oeste é mais baixo que o leste, como o livro
# diz. Leste e caverna no nível 4; oeste (salas 9-12) no 3; a fenda no 0 (seis
# metros abaixo); o patamar da entrada da área 1 no 6, com degraus.
#
# Glifos de hoje (arte própria vem depois, no PixelLab): R parede · _ chão ·
# W cisterna · = ponte · x fundo da fenda (pedregulho) · A coluna de pedra ·
# s barris, caixas e prateleiras · z beliche · K baú · m mesa · Q sarcófago · G grade das
# jaulas · S porta secreta (parede até ser achada; a cena abre).
W, H = 31, 21
T = [['R'] * W for _ in range(H)]
A = [[0] * W for _ in range(H)]
L = [[0] * W for _ in range(H)]          # luz: 2 claro, 1 penumbra, 0 breu

R = lambda a, b: range(a, b + 1)


def pinta(xs, ys, g, h, luz=None):
    for y in ys:
        for x in xs:
            T[y][x] = g
            A[y][x] = h
            if luz is not None:
                L[y][x] = luz


def casa(x, y, g, h=None, luz=None):
    T[y][x] = g
    if h is not None:
        A[y][x] = h
    if luz is not None:
        L[y][x] = luz


SECRETAS = {}     # nome -> (x, y, altura do chão quando aberta)

# --------------------------------------------------------- 11. Oficina ----
pinta(R(2, 5), R(2, 4), '_', 3, 2)
for y in R(2, 4): casa(2, y, 's')                     # prateleiras de livros
casa(3, 3, 'm'); casa(3, 4, 'm')                     # bancada de trabalho
casa(6, 3, '_', 3, 2)                                # porta para 12
casa(4, 5, '_', 3, 2)                                # porta para o corredor

# ------------------------------------------------- 12. Quarto do Cajavidro ----
pinta(R(7, 9), R(2, 3), '_', 3, 2)
casa(8, 2, 'm')                                      # escrivaninha (a carta)
casa(9, 3, 'z'); casa(7, 2, 'K')                     # cama e o baú, longe da porta
SECRETAS['quarto'] = (10, 2, 3)                      # nordeste do quarto
casa(11, 2, '_', 3, 1)                               # o vão da passagem
SECRETAS['passagem'] = (11, 3, 4)                    # e a segunda porta, para o 7

# --------------------------------------- corredor oeste e as escadas ----
pinta(R(4, 6), [6], '_', 3, 1)                      # antecâmara entre 11 e 10
casa(7, 6, '_', 3, 1)                                # pé da escada
pinta(R(7, 10), [5], '_', 4, 1)                      # corredor de cima, para a caverna

# ------------------------------------------------- 10. Sala de estar ----
pinta(R(2, 6), R(8, 11), '_', 3, 2)
casa(6, 7, '_', 3, 2)                                # porta, desencontrada da do 11
casa(3, 8, 'm'); casa(4, 8, 'm')                     # a mesa do jogo
casa(2, 11, 's'); casa(5, 11, 's'); casa(6, 11, 's') # barris de cerveja
casa(3, 12, '_', 3, 2)                               # porta para o sul
casa(3, 13, '_', 3, 1)
pinta(R(4, 6), [13], '_', 3, 1)                      # passagem para a caverna
casa(7, 13, '_', 4, 1)                               # degrau acima

# --------------------------------------------- 9. Alojamento dos guardas ----
casa(3, 14, '_', 3, 2)                               # porta
pinta(R(2, 6), R(15, 18), '_', 3, 2)
for (x, y) in [(2, 15), (6, 15), (2, 18), (6, 18)]: casa(x, y, 'z')

# --------------------------------------------- 8. A caverna da fenda ----
caverna = [
    # (y, x0, x1) — a caverna é irregular; a fenda corta pelo meio
    (5, 10, 14), (6, 8, 14), (7, 8, 14), (8, 8, 14), (9, 8, 14), (10, 8, 14),
    (11, 8, 14), (12, 8, 14), (13, 7, 14), (14, 8, 14), (15, 8, 14), (16, 8, 14),
    (17, 9, 19), (18, 10, 14), (19, 10, 11),
]
for (y, x0, x1) in caverna:
    pinta(R(x0, x1), [y], '_', 4, 0)
# A fenda: encosta na rocha ao norte (linha 5) e ao sul (linha 18) — só se
# cruza pelas pontes. Duas casas de largura, seis metros para baixo, pedregulho no fundo.
fenda = {5: (11, 12), 6: (11, 12), 7: (10, 12), 8: (10, 12), 9: (11, 12), 10: (11, 12), 11: (10, 11),
         12: (10, 11), 13: (10, 12), 14: (10, 12), 15: (11, 12), 16: (11, 12), 17: (11, 12), 18: (12, 13)}
for y, (x0, x1) in fenda.items():
    pinta(R(x0, x1), [y], 'x', 0, 0)
# As duas pontes, de leste a oeste, no nível da caverna. A do sul é a podre.
PONTES = {'norte': 8, 'sul': 14}
for y in PONTES.values():
    for x in R(*fenda[y]):
        casa(x, y, '=', 4, 0)
# As duas colunas grossas que seguram o teto.
casa(13, 9, 'A', 4); casa(9, 13, 'A', 4)

# ------------------------------------------------- 7. Depósito ----
pinta(R(12, 14), R(2, 3), '_', 4, 1)
pinta(R(12, 14), [4], '_', 4, 1)                     # abre para a caverna
casa(12, 2, 's'); casa(13, 2, 's'); casa(14, 4, 's')
SECRETAS['deposito'] = (15, 2, 4)                    # para o corredor do 6

# --------------------------------------- corredor do 6 e o 6, trancado ----
pinta([16], R(2, 3), '_', 4, 1)
casa(16, 4, '_', 4, 2)                               # porta para a cripta
TRANCADA = (17, 2)                                   # porta do depósito de armas
pinta(R(18, 19), R(2, 3), '_', 4, 1)
casa(19, 2, 's'); casa(19, 3, 's')                   # estantes de armas

# --------------------------------------------- 4. Criptas ----
pinta(R(16, 19), R(5, 10), '_', 4, 1)
for (x, y) in [(16, 6), (16, 9), (19, 6)]: casa(x, y, 'Q')   # sarcófagos
casa(20, 5, '_', 4, 1)                               # porta para as jaulas
casa(20, 10, '_', 4, 1)                              # porta para o corredor 3

# --------------------------------------------- 5. Jaulas ----
pinta(R(21, 23), R(2, 7), '_', 4, 2)
for x in R(21, 23):
    casa(x, 3, 'G'); casa(x, 6, 'G')                 # as grades
JAULAS = {'norte': (22, 3), 'sul': (22, 6)}          # portas das celas (na grade)
casa(23, 5, 's')                                     # a pilha de roupas

# --------------------------------------------- 3. Corredor do fosso ----
pinta(R(21, 28), R(9, 10), '_', 4, 0)
FOSSO = [(23, 9), (24, 9), (23, 10), (24, 10)]
casa(27, 11, '_', 4, 1)                              # porta ao pé da escada da área 1

# --------------------------------------------- 1. Porão ----
pinta(R(21, 27), R(12, 18), '_', 4, 2)
# A cisterna tem mureta: a água fica um nível acima do piso, e o motor
# desenha a borda de pedra. Entrar nela é escalar a mureta.
pinta(R(21, 23), R(14, 16), 'W', 5, 2)               # a cisterna
for x in R(21, 23): casa(x, 12, 's')
casa(22, 18, 's'); casa(23, 18, 's')
# Patamar de 1,5 x 4,5 m a leste, com duas escadinhas descendo para o porão.
pinta([28], R(13, 17), '_', 6, 2)
casa(27, 13, '_', 5, 2); casa(27, 17, '_', 5, 2)
for y in R(14, 16): casa(27, y, 'R')                 # parede de baixo do patamar
casa(29, 15, '_', 6, 2)                              # porta: escada da cozinha
PORTAS = {'alojamento': (20, 13, 4)}                 # porta para o 2: fechada
SECRETAS['cisterna'] = (20, 17, 4)                   # canto sudoeste

# --------------------------------------------- 2. Alojamento ----
pinta(R(16, 19), R(12, 15), '_', 4, 2)
casa(16, 12, 'z'); casa(18, 12, 'z')
for (x, y) in [(16, 15), (17, 15), (18, 15), (19, 14)]: casa(x, y, 's')

# Túnel da porta secreta da cisterna até a caverna (a passagem sul).
pinta(R(15, 19), [17], '_', 4, 0)

# O que é caverna natural (a 8, o túnel e a saída) fica chão de terra; o
# resto do porão, que foi construído, é piso de lajes (`L`).
NATURAL = {(x, y) for (y, x0, x1) in caverna for x in R(x0, x1)} | {(x, 17) for x in R(15, 19)}
for y in range(H):
    for x in range(W):
        if T[y][x] == '_' and (x, y) not in NATURAL:
            T[y][x] = 'L'
        if T[y][x] == 'W':
            T[y][x] = 'V'

# Portas secretas: parede até alguém achar.
for (x, y, _) in SECRETAS.values():
    T[y][x] = 'R'
T[TRANCADA[1]][TRANCADA[0]] = 'R'
for (x, y, _) in PORTAS.values():
    T[y][x] = 'R'

# ------------------------------------------------- paredes em corte ----
# A parede fica um nível acima do chão mais alto que ela toca: dá para ver o
# corredor de trás sem que a parede suma.
for y in range(H):
    for x in range(W):
        if T[y][x] == 'R':
            viz = [A[b][a] for a, b in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1),
                                        (x - 1, y - 1), (x + 1, y - 1), (x - 1, y + 1), (x + 1, y + 1))
                   if 0 <= a < W and 0 <= b < H and T[b][a] != 'R']
            A[y][x] = (max(viz) + 1) if viz else 5
            # A parede pega a luz da sala que ela fecha: numa sala clara, ela
            # aparece clara, e a porta achada acende com o resto.
            luzes = [L[b][a] for a, b in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1))
                     if 0 <= a < W and 0 <= b < H and T[b][a] != 'R']
            L[y][x] = max(luzes) if luzes else 0

# ------------------------------------------------- alvenaria e rocha ----
# Parede que encosta em sala construída (laje, cisterna, mesa…) é alvenaria
# (`M`); a que só encosta na caverna e na fenda é rocha natural (`R`). As
# portas secretas e a trancada ficam no corpo da alvenaria: abertas, viram
# laje (a cena troca a casa).
CONSTRUIDO = set('LVmQGsKz')
for y in range(H):
    for x in range(W):
        if T[y][x] != 'R':
            continue
        viz = [T[b][a] for a in (x - 1, x, x + 1) for b in (y - 1, y, y + 1)
               if 0 <= a < W and 0 <= b < H and (a, b) != (x, y)]
        if any(v in CONSTRUIDO for v in viz):
            T[y][x] = 'M'

# ---------------------------------------------------------------- saída ----
import json
from pathlib import Path

alt = lambda v: str(v) if v < 10 else 'abcdefghij'[v - 10]
cab = '''// O ESCONDERIJO DOS MARCARRUBRA (Parte 2): os porões da Mansão Tresendar.
//
// Gerado por `src/dev/mapa-mansao.py` — mude lá e rode de novo.
//
// Áreas do livro: 1 porão com a cisterna (entrada pela escada da cozinha, a
// leste) · 2 alojamento · 3 corredor do fosso · 4 criptas · 5 jaulas ·
// 6 depósito de armas (trancado) · 7 depósito · 8 caverna da fenda (entrada
// pelo túnel do Carp, ao sul) · 9 alojamento dos bugbears · 10 sala de estar ·
// 11 oficina do mago · 12 quarto do Cajavidro.
//
// Glifos: R parede · _ chão · W cisterna · = ponte · x fundo da fenda ·
// A coluna · s barris e estantes · z beliche · K baú · m mesa · Q sarcófago ·
// G grade. Alturas em dígitos (um nível = 1,5 m). Luz: 2 claro, 1 penumbra,
// 0 breu.
'''
dados = {
    'terreno': [''.join(l) for l in T],
    'altura': [''.join(alt(v) for v in l) for l in A],
    'luz': [''.join(str(v) for v in l) for l in L],
}
extra = {
    'secretas': {k: {'x': x, 'y': y, 'h': h} for k, (x, y, h) in SECRETAS.items()},
    'trancada': {'x': TRANCADA[0], 'y': TRANCADA[1], 'h': 4},
    'portas': {k: {'x': x, 'y': y, 'h': h} for k, (x, y, h) in PORTAS.items()},
    'pontes': PONTES, 'fenda': {str(k): v for k, v in fenda.items()},
    'fosso': [{'x': x, 'y': y} for (x, y) in FOSSO],
    'jaulas': {k: {'x': x, 'y': y} for k, (x, y) in JAULAS.items()},
    'entradas': {'cozinha': {'x': 29, 'y': 15}, 'tunel': {'x': 10, 'y': 19}},
}
saida = Path(__file__).resolve().parents[1] / 'game' / 'mansao.js'
saida.write_text(
    cab + '\nexport const MAPA_MANSAO = ' + json.dumps(dados, indent=2, ensure_ascii=False) + ';\n\n'
    + 'export const MANSAO = ' + json.dumps(extra, indent=2, ensure_ascii=False) + ';\n',
    encoding='utf-8', newline='\n')
print('\n'.join(dados['terreno']))
print()
print('\n'.join(dados['altura']))
