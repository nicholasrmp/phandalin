# Gera `src/game/esconderijo.js`: terreno, altura e luz do esconderijo.
#
#   python src/dev/mapa-esconderijo.py
#
# O mapa é pintado por regiões (rocha por padrão, e cada sala cavada nela),
# porque três grades de 40 x 28 escritas à mão saem do lugar uma da outra.
W, H = 40, 28
T = [['R'] * W for _ in range(H)]   # rocha
A = [[3] * W for _ in range(H)]     # altura (rocha alta)

def pinta(xs, ys, g, h=None):
    for y in ys:
        for x in xs:
            if 0 <= x < W and 0 <= y < H:
                T[y][x] = g
                if h is not None: A[y][x] = h

def casa(x, y, g, h=None): pinta([x], [y], g, h)
R = lambda a, b: range(a, b + 1)

# ---------------------------------------------------------------- FORA ----
# Encosta: a rocha recua de noroeste para sudeste. Tudo abaixo vira campo.
for y in R(16, 27):
    for x in R(0, 25):
        borda = {16: 11, 17: 13, 18: 25, 19: 25}.get(y, 25)
        if x <= borda: pinta([x], [y], ',', 0)
# A rocha do morro ainda desce no leste do campo.
for y in R(16, 27):
    for x in R(22, 25):
        if x - 22 > (y - 16) // 2: pinta([x], [y], 'R', 3)
# Mata na borda oeste e sul.
for y in R(16, 27):
    pinta(R(0, 1 if y < 22 else 2), [y], 'T', 0)
for x in R(0, 21):
    pinta([x], [27], 'T', 0)
    if x < 8 or x > 15: pinta([x], [26], 'T', 0)
for (x, y) in [(3, 17), (4, 17), (2, 18), (3, 18), (7, 16), (8, 16), (9, 17)]: casa(x, y, 'T', 0)
# Clareira a oeste (área 1): espinheiro e pedras soltas.
for (x, y) in [(5, 20), (6, 20), (6, 21), (9, 23), (10, 23)]: casa(x, y, '%', 0)
for (x, y) in [(4, 22), (8, 19)]: casa(x, y, 'r', 0)

# Riacho que sai da boca da caverna e desce para sudoeste (2 de largura).
leito = [(15, 16), (15, 17), (15, 18), (14, 19), (14, 20), (13, 21), (13, 22), (12, 23), (12, 24), (11, 25), (11, 26), (10, 27)]
for (x, y) in leito: pinta([x, x + 1], [y], 'w', 0)

# Matagal (área 2): a leste do riacho, moitas e espinheiro com vãos.
mato = ['bb%b.%bb', 'b%..b%.b', '%b.b%..%', 'b..%bb.b', '.b%b..%b', 'bb.%b%..']
for j, linha in enumerate(mato):
    for i, c in enumerate(linha):
        x, y = 17 + i, 20 + j
        if T[y][x] == ',':
            if c == 'b': casa(x, y, 'b', 0)
            elif c == '%': casa(x, y, '%', 0)

# ------------------------------------------------- BOCA E TÚNEL (área 1) ----
# A boca: margens secas dos dois lados do riacho.
pinta(R(14, 17), R(14, 17), '_', 0)
for y in R(14, 17): pinta([15, 16], [y], 'w', 0)
# O túnel do riacho sobe para o norte; margem seca a leste.
for y in R(7, 13):
    pinta(R(14, 17), [y], '_', 0)
    pinta([15, 16], [y], 'w', 0)
# Curva do riacho para leste no alto do túnel.
pinta(R(14, 18), R(5, 6), '_', 0)
pinta(R(15, 16), R(5, 6), 'w', 0)

# -------------------------------------------- CANAL DO RIACHO (sob a ponte) --
# O riacho vem dos poços pelo leste, num canal estreito de água.
pinta(R(17, 23), R(5, 6), 'w', 0)
pinta(R(24, 26), R(5, 6), 'w', 1)      # corredeira, um degrau acima
# A ponte (área 5): atravessa o canal de norte a sul, no nível 2.
pinta(R(20, 21), R(5, 6), '=', 2)
pinta(R(20, 21), R(3, 4), '_', 2)

# ------------------------------------------- DEGRAUS E COVIL (áreas 4 e 6) --
# Da curva do túnel, degraus sobem para oeste.
casa(13, 6, '_', 1); casa(13, 5, '_', 1); casa(12, 6, '_', 2); casa(12, 5, '_', 2)
pinta(R(9, 11), R(5, 6), '_', 2)
pinta([12, 13], [7], 'x', 1)                 # entulho ao pé dos degraus
# Covil dos goblins (área 6).
for y in R(4, 11):
    for x in R(1, 9):
        if (x, y) in [(1, 4), (1, 11), (9, 11), (9, 4)]: continue
        pinta([x], [y], '_', 2)
pinta(R(7, 8), R(2, 3), '_', 2)          # o pescoço que sobe ao corredor
for (x, y) in [(3, 5), (6, 9), (5, 4)]: casa(x, y, 'A', 2)          # estalagmites
for (x, y) in [(2, 9), (3, 10), (3, 9)]: casa(x, y, 's', 2)         # mantimentos roubados
# O "palco" de Yeemik, um degrau acima do chão do covil.
pinta(R(1, 3), R(6, 8), '_', 3)

# ------------------------------------------------- O ANEL DO NORTE --------
# Do covil, um corredor sobe para o norte e corre para leste até a ponte.
pinta(R(7, 21), R(1, 2), '_', 2)

# Do sul da ponte, a passagem para leste até os poços.
pinta(R(20, 27), R(7, 8), '_', 2)

# ----------------------------------------------------- POÇOS (área 7) -------
for y in R(1, 12):
    for x in R(27, 38):
        if (x in (27, 38) and y in (1, 12)) or (x == 38 and y > 9): continue
        pinta([x], [y], '_', 2)
# Os dois poços, separados por uma língua de pedra solta (o dique).
for (x0, x1, y) in [(31, 37, 1), (30, 37, 2), (31, 37, 3), (33, 37, 5), (32, 37, 6), (34, 37, 7)]:
    pinta(R(x0, x1), [y], 'W', 2)
pinta(R(32, 37), [4], 'x', 2)
pinta(R(27, 30), R(5, 6), 'W', 2)       # o poço baixo vira a nascente do canal
for (x, y) in [(29, 9), (35, 10), (31, 8)]: casa(x, y, 'A', 2)

# --------------------------------------------------- KLARG (área 8) --------
pinta(R(30, 31), R(13, 14), '_', 2)
for y in R(15, 24):
    for x in R(27, 38):
        if (x in (27, 38) and y in (15, 24)) or (x == 27 and y > 21): continue
        pinta([x], [y], '_', 2)
for (x, y) in [(30, 18), (34, 20), (29, 22)]: casa(x, y, 'A', 2)
for (x, y) in [(36, 23), (37, 23), (37, 22), (35, 23), (37, 21)]: casa(x, y, 's', 2)   # o tesouro do bando

# ----------------------------------------------------- CANIL (área 3) ------
pinta(R(18, 19), R(12, 13), '_', 0)
casa(19, 12, '_', 1); casa(19, 13, '_', 1)
for y in R(10, 15):
    for x in R(20, 25):
        if (x, y) in [(20, 10), (25, 10), (20, 15), (25, 15)]: continue
        pinta([x], [y], '_', 1)
casa(23, 10, 'A', 1)
# A fenda de entulho do canil sobe até a caverna de Klarg.
pinta([26], R(14, 16), 'x', 2)

# ------------------------------------------------- mobília do bando ------
# As camas de pele e palha (passa-se por cima), a fogueira de Klarg e o baú.
for (x, y) in [(8, 5), (8, 10), (4, 11), (6, 11), (1, 10)]: casa(x, y, 'z', 2)   # covil
for (x, y) in [(36, 16), (37, 17)]: casa(x, y, 'z', 2)                           # Klarg
casa(32, 17, 'F', 2)
casa(36, 22, 'K', 2)

# ------------------------------------------- ANTEPAROS (revisão de mapa) -
# Sem estas pedras, as linhas retas e a fogueira de Klarg faziam cada sala ser
# vista de outra a 90 pés (170 com tocha) e a exploração não existia: medido
# pelo revisor de mapa, os gatilhos de longe caem de 282 para 37 casas.
casa(31, 13, 'R'); casa(30, 15, 'R'); casa(30, 11, 'R')   # corredor poços->Klarg: 1 casa e cotovelo
# O cotovelo acima parou cedo: sobrava uma diagonal quase reta dos poços até
# a fogueira de Klarg. Medido com `hasLineOfSight`: 13 casas do lado dos poços
# viam o bando do chefe. Com estas duas, 5 — e as cinco são a própria porta e
# os dois degraus de descida, ou seja, só se vê Klarg pisando na soleira.
casa(29, 11, 'R'); casa(28, 10, 'R')                       # fecha a diagonal poços->Klarg
casa(27, 17, 'R'); casa(28, 17, 'R')                       # anteparo na saída da fenda
casa(16, 6, 'R')                                           # pedra na curva do riacho
casa(14, 5, 'R'); casa(10, 6, 'R')                         # quina na curva e pilar no patamar dos degraus
casa(27, 7, 'R'); casa(28, 8, 'R')                         # cotovelo na entrada dos poços
# O trecho do canal a leste da ponte CONTINUA água: o riacho desce dos poços,
# passa por baixo da ponte e entra no túnel, como no mapa da aventura (e a
# enchente do dique desce por ele). A linha de visão que sobra ao longo do
# canal é a da aventura: os goblins dos poços vigiam o riacho.
pinta(R(18, 19), [13], 'R')                                # porta do canil com 1 casa
casa(23, 10, '_', 1); casa(23, 12, 'A', 1)                 # a estalagmite das correntes, no meio do canil

# ------------------------------------------ CONFERIDO COM O LIVRO ---------
# Ajustes depois de ler a descrição de cada área na aventura.

# Área 1: o caminho seco entra pelo lado DIREITO (leste) do riacho; a margem
# oeste do túnel é água. Para ir ao oeste (área 4) atravessa-se o riacho.
for y in R(7, 17):
    if T[y][14] == '_': casa(14, y, 'w', 0)

# Área 2: no meio do mato, uma clareira aberta com ripas de madeira fazendo um
# abrigo para os vigias. O mato em volta é terreno difícil, não parede.
# (19,21) era um '%' que a regra de quina selava: chão onde ninguém entra nem
# sai. Vira moita, como as vizinhas.
mato = ['%%b%%b%%',
        '%bbPPP%b',
        'b%P,,,P%',
        '%%P,,,%b',
        'b%%,%%b%',
        '%b%%b%%%']
for j, linha in enumerate(mato):
    for i, c in enumerate(linha):
        x, y = 17 + i, 20 + j
        if T[y][x] in ',b%':
            casa(x, y, c, 0)

# Área 3: a fenda do fundo do canil é uma CHAMINÉ de 9 m até a área 8 — sobe-se
# escalando (Atletismo), não andando. Na base, o lixo jogado lá de cima.
pinta([26], R(14, 16), 'R')
casa(25, 13, 'x', 1)

# Área 4: a passagem ocidental é cheia de entulho e íngreme.
for (x, y) in [(10, 5), (11, 5), (11, 6), (12, 5), (12, 6)]: casa(x, y, 'x')

# Área 5: a ponte fica 6 m (quatro níveis) acima do riacho, ligando dois
# túneis no alto: o anel do norte e a passagem que vai aos poços.
pinta(R(20, 21), R(5, 6), '=', 4)
pinta(R(20, 21), R(3, 4), '_', 4)
for y in R(1, 2):
    for x in R(7, 21):
        if T[y][x] == '_': A[y][x] = 4
casa(7, 3, '_', 3); casa(8, 3, '_', 3)          # o pescoço desce ao covil
for x in R(20, 27):
    for y in R(7, 8):
        if T[y][x] == '_': A[y][x] = 4
# O riacho sobe em degraus irregulares do canal até os poços.
for x, h in [(22, 1), (23, 2), (24, 3), (25, 4), (26, 4)]:
    for y in R(5, 6): casa(x, y, 'w', h)

# Área 6: o covil é dividido por um degrau de 3 m. Parte de baixo (norte),
# junto à entrada, com a fogueira; parte de cima (sul), com Yeemik e Sildar.
# Uma escada natural liga as duas.
for y in R(4, 11):
    for x in R(1, 9):
        if T[y][x] in '_szAF': A[y][x] = 2 if y <= 7 else 4
for (x, y) in [(1, 7), (2, 5), (7, 7)]: casa(x, y, 'z', 2)   # camas na parte de baixo
for (x, y) in [(1, 10), (4, 11), (6, 11)]: casa(x, y, '_', 4)
casa(8, 10, 'z', 4)                                          # a cama de Yeemik
casa(5, 6, 'F', 2)                                           # o fogo da comida
casa(4, 8, '_', 3); casa(5, 8, '_', 3)                       # a escada natural

# Áreas 7 e 8: os poços no alto; a caverna de Klarg um pouco abaixo, ligada
# por degraus naturais de pedra.
for y in R(1, 12):
    for x in R(27, 38):
        if T[y][x] in '_WxA': A[y][x] = 4
casa(30, 13, '_', 4); casa(30, 14, '_', 3); casa(31, 14, '_', 3)
for y in R(15, 24):
    for x in R(27, 38):
        if T[y][x] in '_szAFKx': A[y][x] = 3
casa(28, 16, 'x', 3)                                         # a boca da chaminé, a oeste

# ------------------------------------------------- rocha em corte -------
# A rocha fica UM nível acima do chão vizinho (dois na encosta de fora): é a
# parede cortada dos jogos isométricos de masmorra. Rocha alta esconderia o
# corredor de trás inteiro.
from collections import deque
CHAO = set('_wW=xAs%,TbrzFKP')
fila = deque()
alt = [[None] * W for _ in range(H)]
for y in range(H):
    for x in range(W):
        if T[y][x] != 'R': continue
        viz = [(x + dx, y + dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1) if (dx or dy) and 0 <= x + dx < W and 0 <= y + dy < H]
        fl = [(vx, vy) for vx, vy in viz if T[vy][vx] in CHAO]
        if fl:
            # +2 só sobre o chão de fora (a encosta); sobre a caverna, +1.
            alt[y][x] = max(A[vy][vx] + (2 if (vy >= 16 and T[vy][vx] in ',Tbr%') else 1) for vx, vy in fl)
            fila.append((x, y))
while fila:
    x, y = fila.popleft()
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < W and 0 <= ny < H and T[ny][nx] == 'R' and alt[ny][nx] is None:
            alt[ny][nx] = alt[y][x]
            fila.append((nx, ny))
for y in range(H):
    for x in range(W):
        if T[y][x] == 'R': A[y][x] = alt[y][x] if alt[y][x] is not None else 3

# ---------------------------------------------------------------- luz ------
# 2 dia lá fora, 1 a boca da caverna, 0 o resto.
L = [['0'] * W for _ in range(H)]
for y in range(H):
    for x in range(W):
        if y >= 16 and x <= 25 and not (T[y][x] == 'R' and x >= 18): L[y][x] = '2'
for y in range(13, 18):
    for x in range(13, 19): L[y][x] = '1' if y < 16 else '2'

# ----------------------------------------------------------- saída --------
terreno = [''.join(r) for r in T]
altura = [''.join(str(a) for a in r) for r in A]
luz = [''.join(r) for r in L]
from pathlib import Path
# O cabeçalho (a explicação do mapa) mora no próprio .js e é preservado.
saida = Path(__file__).resolve().parents[1] / 'game' / 'esconderijo.js'
cabecalho = saida.read_text(encoding='utf-8').split('export const')[0] if saida.exists() else ''
NL = chr(10)
def bloco(nome, grade):
    return f"  {nome}: [" + NL + ''.join(f"    '{r}'," + NL for r in grade) + "  ]," + NL
saida.write_text(cabecalho + 'export const MAPA_ESCONDERIJO = {' + NL + bloco('terreno', terreno)
                 + bloco('altura', altura) + bloco('luz', luz) + '};' + NL, encoding='utf-8')
for t, a, l in zip(terreno, altura, luz):
    print(t, ' ', a, ' ', l)
