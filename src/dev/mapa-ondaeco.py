# Gera `src/game/ondaeco.js`: a Caverna Onda Eco (Parte 4 da aventura).
#
#   python src/dev/mapa-ondaeco.py
#
# O MAPA VEM PRONTO, e na nossa grade: `WaveEchoCave_Grid_73x90_200ppi.jpg` tem 73 x 90
# quadrados de 5 pes a 200 px cada, exatamente as casas do jogo (a Arvore Trovao tinha
# quadrados de 10 pes e foi preciso medir a escala). A imagem fica em `_referencias/ondaeco/`
# (pasta ignorada pelo git), junto com as variantes por sala (portas, braseiros, o acampamento).
#
# COMO O TERRENO SAI DA IMAGEM:
#   - o CHAO DA CAVERNA e lido da textura: o fundo da rocha e preto liso, o chao tem pedra
#     e rachadura. Uma casa e chao se 50% ou mais dos blocos de 25 px dela tem textura;
#   - as SALAS de pedra lavrada (templo, alojamentos, fundicao, guarita...) estao declaradas
#     aqui, em casas, lidas da imagem e conferidas contra os recortes `Grid/*.jpg` (cada
#     recorte tem o nome da sala e cai numa posicao exata da grade, achada por correlacao);
#   - a AGUA, o abismo, o canal e os fungos sao regioes declaradas aqui (a cor sozinha
#     confunde agua escura com chao escuro).
#   - as PAREDES sao de borda (como no castelo e em Arvore Trovao): toda aresta entre uma sala
#     e o que nao e dela vira parede, e as PORTAS e ARCOS abrem nela onde o recorte mostra.
#
# AS AREAS DO LIVRO (1 a 20) estao em `AREAS`, em retangulos de casas: a cena (`game/capitulo5-
# ondaeco.js`) as usa para os gatilhos, sem escrever coordenada.

import json
import math
from pathlib import Path

import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
RAIZ = Path(__file__).resolve().parents[2]
IMG = RAIZ / '_referencias' / 'ondaeco' / 'WaveEchoCave_Grid_73x90_200ppi.jpg'
CACHE = RAIZ / '_trabalho' / 'oe_tex.npy'
W, H = 73, 90


def textura():
    """Por casa, a fracao de blocos de 25 px com textura e luz: o chao (1) contra o vazio (0)."""
    if CACHE.exists():
        return np.load(CACHE)
    g = np.asarray(Image.open(IMG).convert('L')).astype(np.float32)
    b = 25
    h, w = g.shape
    blk = g.reshape(h // b, b, w // b, b)
    tex = (blk.std(axis=(1, 3)) >= 5) & (blk.mean(axis=(1, 3)) >= 14)
    t = tex.reshape(H, 8, W, 8).mean(axis=(1, 3))
    CACHE.parent.mkdir(exist_ok=True)
    np.save(CACHE, t)
    return t


def cores():
    """Cor media por casa (para separar a agua da rocha nas margens do lago do nordeste)."""
    cache = RAIZ / '_trabalho' / 'oe_mean.npy'
    if cache.exists():
        return np.load(cache)
    a = np.asarray(Image.open(IMG).convert('RGB')).astype(np.float32)
    m = a.reshape(H, 200, W, 200, 3).mean(axis=(1, 3))
    np.save(cache, m)
    return m


TEX = textura()
COR = cores()


def retangulos(lista):
    out = set()
    for (x0, y0, x1, y1) in lista:
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if 0 <= x < W and 0 <= y < H:
                    out.add((x, y))
    return out


# ------------------------------------------------------------ o chao da caverna ----
CHAO = {(x, y) for y in range(H) for x in range(W) if TEX[y][x] >= 0.5}


def _componentes(celulas):
    resto, saida = set(celulas), []
    while resto:
        c = resto.pop()
        fila, comp = [c], {c}
        while fila:
            x, y = fila.pop()
            for (dx, dy) in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                n = (x + dx, y + dy)
                if n in resto:
                    resto.discard(n)
                    comp.add(n)
                    fila.append(n)
        saida.append(comp)
    return saida


# AJUSTES A MAO sobre a leitura automatica (casas que a textura erra), em retangulos x0,y0,x1,y1.
ACRESCENTA = [(15, 67, 18, 68), (52, 19, 53, 20), (30, 3, 30, 5)]
TIRA = [(58, 4, 65, 9), (26, 76, 29, 76), (42, 76, 44, 76), (46, 81, 46, 82), (70, 38, 70, 38), (70, 45, 70, 49), (69, 59, 69, 59)]
CHAO |= retangulos(ACRESCENTA)
CHAO -= retangulos(TIRA)
for _comp in _componentes(CHAO):
    if len(_comp) < 5:
        CHAO -= _comp

# ------------------------------------------------------------------ as salas ----
# Interior de cada sala, em retangulos (x0, y0, x1, y1) inclusivos, menos `tira`.
SALAS = {
    'templo': {'r': [(4, 3, 13, 14)]},
    'sacerdote': {'r': [(14, 3, 19, 8)], 'tira': [(18, 3, 19, 4)]},
    'alojNorte': {'r': [(22, 23, 31, 30)]},
    'fundicao': {'r': [(38, 25, 49, 36)]},
    'forjaOficina': {'r': [(66, 31, 69, 34)]},
    'forja': {'r': [(62, 35, 69, 40), (62, 33, 65, 34)]},
    'magoA': {'r': [(64, 49, 69, 52)]},
    'magoB': {'r': [(64, 53, 69, 56)]},
    'magoC': {'r': [(64, 57, 69, 58)]},
    'alojSul': {'r': [(34, 53, 39, 62), (34, 51, 35, 52)]},
    'deposito': {'r': [(46, 51, 51, 56)]},
    'guarita': {'r': [(26, 77, 29, 82), (30, 79, 35, 84), (28, 83, 29, 84)]},
    'avaliadores': {'r': [(42, 77, 45, 84)]},
}
INTERIOR = {}
for _nome, _d in SALAS.items():
    INTERIOR[_nome] = retangulos(_d['r']) - retangulos(_d.get('tira', []))
SALA_DE = {}
for _nome, _cs in INTERIOR.items():
    for _c in _cs:
        SALA_DE[_c] = _nome
CHAO |= set(SALA_DE)
# O brilho que contorna cada parede (o "halo" do desenho) tem textura e virava chao em volta das salas:
# junto de uma sala so conta como chao a casa de textura forte (corredor de verdade).
for (_x, _y) in list(CHAO):
    if (_x, _y) in SALA_DE:
        continue
    if any((_x + _i, _y + _j) in SALA_DE for _i in (-1, 0, 1) for _j in (-1, 0, 1)) and TEX[_y][_x] < 0.8:
        CHAO.discard((_x, _y))
for _comp in _componentes(CHAO):
    if len(_comp) < 5:
        CHAO -= _comp
# Salas sem parede propria: cavernas de piso lavrado, abertas para os lados (a fundicao).
LIVRES = {'fundicao'}

# -------------------------------------------------- agua, abismo, canal, fungos ----
AGUA_FUNDA = set()     # lago, poco, mar do nordeste
# O lago escuro do oeste (area 10): do alto, a margem desce na diagonal para o sul.
for _y, _xr in zip(range(21, 35), (13, 13, 13, 13, 13, 12, 12, 12, 11, 11, 11, 10, 10, 9)):
    for _x in range(7, _xr + 1):
        AGUA_FUNDA.add((_x, _y))
# O mar do nordeste (area 16): so ficam de chao as margens (a rocha marrom); o resto e agua.
for _y in range(0, 24):
    for _x in range(51, W):
        if (_x, _y) in CHAO and not (COR[_y][_x][0] - COR[_y][_x][2] >= 3 and COR[_y][_x].mean() >= 20):
            AGUA_FUNDA.add((_x, _y))
# O mar fervente (area 16): o miolo e agua, e as faixas marrons que a textura achava chao sao ilhotas de rocha.
for _y in range(10, 20):
    for _x in range(53, 68):
        if (_x, _y) in CHAO:
            AGUA_FUNDA.add((_x, _y))
FOSSO = set()          # o abismo da area 18, o fosso da entrada (area 1)
FOSSO |= retangulos([(12, 73, 13, 74)])
# A fenda da caverna desmoronada (area 18): 6 m de fundo, com cordas atadas na borda oeste (27..30, 9..11).
FOSSO |= {c for c in retangulos([(31, 5, 35, 12)]) if c in CHAO}
CANAL = retangulos([(41, 31, 46, 34)])    # o canal seco da fundicao, 1,5 m abaixo do piso
FUNGOS = {(x, y) for (x, y) in CHAO
          if COR[y][x][1] - COR[y][x][2] >= 25 and COR[y][x][1] >= 50 and (x, y) not in SALA_DE}

for (x, y) in AGUA_FUNDA:
    CHAO.discard((x, y))

# --------------------------------------------------------------- o terreno ----
T = [['R'] * W for _ in range(H)]
for (x, y) in CHAO:
    T[y][x] = '`'
for (x, y), nome in SALA_DE.items():
    T[y][x] = '<'
for (x, y) in AGUA_FUNDA:
    T[y][x] = '|'
for (x, y) in FOSSO:
    T[y][x] = 'O'
for (x, y) in CANAL:
    T[y][x] = '['
for (x, y) in FUNGOS:
    T[y][x] = ';'
# A margem de conchas (o livro: camadas de conchas quebradas de mexilhao junto do lago escuro): o chao
# que encosta na agua do lago oeste e do mar do nordeste.
for (x, y) in list(CHAO):
    if T[y][x] == '`' and any((x + i, y + j) in AGUA_FUNDA for i in (-1, 0, 1) for j in (-1, 0, 1)):
        T[y][x] = '"'

# ---------------------------------------------------------------- as paredes ----
PN = [['.'] * W for _ in range(H)]
PO = [['.'] * W for _ in range(H)]


def anda(x, y):
    return 0 <= x < W and 0 <= y < H and T[y][x] not in 'R|'


for y in range(H):
    for x in range(W):
        a = SALA_DE.get((x, y))
        for (vx, vy, grade) in ((x, y - 1, PN), (x - 1, y, PO)):
            b = SALA_DE.get((vx, vy))
            if a == b or a in LIVRES or b in LIVRES:
                continue
            # parede so onde ha chao dos dois lados (contra a rocha a propria rocha ja fecha)
            if (a is not None and not (0 <= vx < W and 0 <= vy < H and T[vy][vx] != 'R')) or \
               (b is not None and T[y][x] == 'R'):
                continue
            grade[y][x] = '#'

# PORTAS (+ fechada, / aberta ou arco), por aresta entre duas casas vizinhas: (x1, y1, x2, y2, codigo).
PORTAS = [
    # O templo (19): as portas do sul (duas casas), e o arco do leste para o corredor das escadas.
    (8, 14, 8, 15, '+'), (9, 14, 9, 15, '+'), (13, 9, 14, 9, '/'), (13, 10, 14, 10, '/'),
    # Os aposentos do sacerdote (20): a porta do sul.
    (15, 8, 15, 9, '+'), (16, 8, 16, 9, '+'),
    # O alojamento norte (11): a porta do oeste e a do leste (trancada por dentro, com barricada).
    (21, 27, 22, 27, '+'), (31, 27, 32, 27, '+'),
    # A Forja das Magias (15): as portas duplas do oeste (rachadas, abertas) e a da oficina.
    (61, 37, 62, 37, '/'), (61, 38, 62, 38, '/'), (67, 34, 67, 35, '+'), (68, 34, 68, 35, '+'),
    (65, 32, 66, 32, '+'),
    # Os aposentos dos magos (14): a porta do oeste, a de dentro e as duas do fundo.
    (63, 51, 64, 51, '+'), (63, 52, 64, 52, '+'), (65, 52, 65, 53, '+'), (64, 56, 64, 57, '/'), (68, 56, 68, 57, '/'),
    # O alojamento sul (6): a porta do norte (oeste) e a do sul.
    (33, 55, 34, 55, '+'), (37, 62, 37, 63, '+'),
    # O deposito (7): a porta entreaberta.
    (48, 56, 48, 57, '+'),
    # A guarita (4) e o escritorio dos avaliadores (5).
    (35, 81, 36, 81, '+'), (35, 82, 36, 82, '+'), (41, 82, 42, 82, '+'),
]


def aresta(x1, y1, x2, y2, cod):
    if x2 == x1 + 1:
        PO[y1][x2] = cod
    elif x2 == x1 - 1:
        PO[y1][x1] = cod
    elif y2 == y1 + 1:
        PN[y2][x1] = cod
    else:
        PN[y1][x1] = cod


for (x1, y1, x2, y2, cod) in PORTAS:
    aresta(x1, y1, x2, y2, cod)

# ----------------------------------------------------------------- a saida ----
# O grupo entra pelo sudoeste (area 1): a ponta do tunel que sobe da superficie.
def _perto(x, y):
    melhor = None
    for (cx, cy) in CHAO:
        d = abs(cx - x) + abs(cy - y)
        if melhor is None or d < melhor[0]:
            melhor = (d, cx, cy)
    return melhor[1], melhor[2]


CHEGADA = _perto(2, 89)
GRUPO = []
for (_dx, _dy) in ((0, 0), (1, 0), (0, -1), (1, -1), (-1, 0), (2, 0), (0, 1), (-1, -1)):
    _c = (CHEGADA[0] + _dx, CHEGADA[1] + _dy)
    if _c in CHAO and _c not in GRUPO and len(GRUPO) < 4:
        GRUPO.append(_c)
print('chegada', CHEGADA, 'grupo', GRUPO)

# ---------------------------------------------------------------- os objetos ----
# As pecas do mapa (mobilia, entulho, fungos, estatuas) vem de `ondaeco-objetos.json`: lidas da imagem a
# olho (um revisor por regiao, conferido depois) e validadas AQUI: so em chao andavel, uma por casa, e
# nenhuma que feche o caminho (o chao continua de uma peca so, e toda porta continua ligada).
PASSA_BAIXO = {'ossos', 'ossosAnao', 'ossosOrc', 'sacoDeDormir', 'anaoMorto', 'conchasPedra', 'tapeteLaranja',
               'montinhoMinerio', 'lanterna', 'bolaInflada', 'teia'}
ANDAVEL = set('`<;"[')
GLIFO_DE = {'braseiro': 'e', 'fogueira': 'F', 'bau': 'K', 'sarcofago': 'Q', 'barril': 'u', 'teia': '$'}


def _passa(x1, y1, x2, y2):
    if x2 == x1 + 1:
        return PO[y1][x2] not in '#'
    if x2 == x1 - 1:
        return PO[y1][x1] not in '#'
    if y2 == y1 + 1:
        return PN[y2][x1] not in '#'
    return PN[y1][x1] not in '#'


def _alcanca(bloqueadas):
    ini = CHEGADA
    vistas, fila = {ini}, [ini]
    while fila:
        x, y = fila.pop()
        for (dx, dy) in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = (x + dx, y + dy)
            if n in vistas or not (0 <= n[0] < W and 0 <= n[1] < H):
                continue
            if T[n[1]][n[0]] in 'R|O' or n in bloqueadas or not _passa(x, y, n[0], n[1]):
                continue
            vistas.add(n)
            fila.append(n)
    return vistas


PROPS = []
_OBJ = RAIZ / 'src' / 'dev' / 'ondaeco-objetos.json'
if _OBJ.exists() and 'CHEGADA' in globals():
    _lista = json.loads(_OBJ.read_text(encoding='utf-8'))['objetos']
    _base = _alcanca(set())
    _bloq, _usadas, _recusadas = set(), set(), []
    for _o in _lista:
        _c = (_o['x'], _o['y'])
        if not (0 <= _c[0] < W and 0 <= _c[1] < H) or T[_c[1]][_c[0]] not in ANDAVEL or _c in _usadas:
            _recusadas.append((_o['v'], _c, 'casa invalida ou ocupada'))
            continue
        if _o['v'] not in PASSA_BAIXO and _o['v'] not in ('fogueira', 'teia'):
            if len(_alcanca(_bloq | {_c})) < len(_base) - len(_bloq) - 1:
                _recusadas.append((_o['v'], _c, 'fecharia o caminho'))
                continue
            _bloq.add(_c)
        _usadas.add(_c)
        if _o['v'] in GLIFO_DE:                 # peca que ja tem glifo proprio (braseiro, fogueira, bau...)
            T[_c[1]][_c[0]] = GLIFO_DE[_o['v']]
            continue
        _item = {'tipo': 'prop', 'x': _c[0], 'y': _c[1], 'variante': _o['v']}
        if _o.get('espelhar'):
            _item['espelhar'] = True
        PROPS.append(_item)
        T[_c[1]][_c[0]] = '&' if _o['v'] in PASSA_BAIXO else '^'
    print('objetos:', len(PROPS), 'recusados:', len(_recusadas), _recusadas[:12])

# ----------------------------------------------------------------- as areas ----
# As AREAS DO LIVRO (1 a 20), em retangulos de casas lidos do mapa. Valem so onde ha chao; um retangulo
# posterior toma a casa de um anterior (as salas pequenas vencem a caverna em que estao).
AREAS_RET = [
    ('13', [(52, 22, 72, 58)]),                 # a caverna estrelada (as duas construcoes leste, 14 e 15, estao nela)
    ('18', [(22, 2, 36, 21)]),                  # a caverna desmoronada, com a fenda a leste
    ('17', [(34, 0, 52, 14)]),                  # o velho corrego, a passagem baixa ate o mar
    ('16', [(51, 0, 72, 23)]),                  # a caverna barulhenta (o mar fervente do nordeste)
    ('10', [(5, 20, 16, 36)]),                  # o lago escuro
    ('2', [(0, 40, 30, 72)]),                   # os tuneis da mina
    ('9', [(17, 34, 50, 50)]),                  # a grande caverna (o lobo oeste, a elevacao dos ghouls, inclusive)
    ('1', [(3, 66, 22, 90)]),                   # a entrada da caverna
    ('3', [(30, 64, 42, 90)]),                  # a velha entrada (o tunel do sul)
    ('8', [(52, 57, 72, 74)]),                  # a caverna dos fungos
    ('12', [(38, 25, 49, 36)]),                 # a caverna de fundicao
    ('15', [(62, 31, 69, 41)]),                 # a forja das magias
    ('14', [(64, 49, 69, 58)]),                 # os aposentos dos magos
    ('11', [(22, 23, 31, 30)]),                 # o alojamento norte
    ('6', [(34, 51, 39, 62)]),                  # o alojamento sul
    ('7', [(46, 51, 51, 62)]),                  # o deposito desmoronado
    ('4', [(26, 77, 35, 84)]),                  # a velha guarita
    ('5', [(42, 77, 45, 84)]),                  # o escritorio dos avaliadores
    ('20', [(14, 3, 19, 8)]),                   # os aposentos do sacerdote
    ('19', [(4, 3, 13, 14)]),                   # o templo de Dumathoin
]
AREA_DE = {}
for _id, _rs in AREAS_RET:
    for _c in retangulos(_rs):
        if T[_c[1]][_c[0]] != 'R' and (T[_c[1]][_c[0]] != '|' or _id == '10'):     # so o lago (10) leva a agua funda
            AREA_DE[_c] = _id
AREAS = {}
for _c, _id in AREA_DE.items():
    AREAS.setdefault(_id, []).append({'x': _c[0], 'y': _c[1]})
for _id in AREAS:
    AREAS[_id].sort(key=lambda c: (c['y'], c['x']))

# ---------------------------------------------------------------- os bandos ----
# Onde cada bando nasce. Toda vaga e chao livre (sem peca) e ALCANCAVEL do grupo; as Grandes (aranhas, gosma)
# tem as quatro casas de que precisam, sem aresta de parede cortando a pegada.
_LIVRE = {(x, y) for y in range(H) for x in range(W) if T[y][x] in '`<"[;'}
_ALC = _alcanca(set())
_pequena = [c for c in _componentes(set(CHAO)) if len(c) < 2000 and len(c) > 100]
if _pequena:
    _ps = sorted(_pequena[0])
    print('componente solto: de', _ps[0], 'a', _ps[-1], '| quadro y', min(c[1] for c in _ps), max(c[1] for c in _ps), 'x', min(c[0] for c in _ps), max(c[0] for c in _ps))
    _grande = [c for c in _componentes(set(CHAO)) if len(c) > 2000][0]
    _melhor = min(((abs(a[0] - b[0]) + abs(a[1] - b[1]), a, b) for a in _ps for b in _grande))
    print('mais perto do resto:', _melhor)
print('alcancaveis a partir da chegada:', len(_ALC), 'de', len(_LIVRE), '| componentes do chao:', sorted((len(c) for c in _componentes(set(CHAO))), reverse=True)[:8])


def _livres(cels):
    return sorted(c for c in cels if c in _LIVRE and c in _ALC)


def _espalha(cels, n, ancora=None):
    """`n` casas espalhadas (a cada passo, a mais longe das ja escolhidas); a primeira e a mais perto da ancora."""
    cands = _livres(cels)
    if len(cands) < n:
        raise SystemExit('ERRO: so ha ' + str(len(cands)) + ' vaga(s) para ' + str(n))
    if ancora is None:
        ancora = cands[len(cands) // 2]
    esc = [min(cands, key=lambda c: (c[0] - ancora[0]) ** 2 + (c[1] - ancora[1]) ** 2)]
    while len(esc) < n:
        esc.append(max((c for c in cands if c not in esc),
                       key=lambda c: min((c[0] - e[0]) ** 2 + (c[1] - e[1]) ** 2 for e in esc)))
    return esc


_USADAS = set()


def _perto(ancora, n, raio=6):
    cs = [(ancora[0] + i, ancora[1] + j) for i in range(-raio, raio + 1) for j in range(-raio, raio + 1)]
    cs = [c for c in _livres(cs) if c not in _USADAS]
    cs.sort(key=lambda c: ((c[0] - ancora[0]) ** 2 + (c[1] - ancora[1]) ** 2, c))
    if len(cs) < n:
        raise SystemExit('ERRO: nada livre perto de ' + str(ancora))
    _USADAS.update(cs[:n])
    return cs[:n]


def _grandes(cels, n, ancora):
    """`n` blocos 2 x 2 livres (e sem parede no meio), o primeiro perto da ancora."""
    ok = []
    for (x, y) in sorted(cels):
        bl = [(x + i, y + j) for j in (0, 1) for i in (0, 1)]
        if not all(b in _LIVRE and b in _ALC and b in cels for b in bl):
            continue
        if not (_passa(x, y, x + 1, y) and _passa(x, y + 1, x + 1, y + 1) and _passa(x, y, x, y + 1) and _passa(x + 1, y, x + 1, y + 1)):
            continue
        ok.append((x, y))
    if len(ok) < n:
        raise SystemExit('ERRO: so ha ' + str(len(ok)) + ' bloco(s) 2 x 2')
    ok.sort(key=lambda c: (c[0] - ancora[0]) ** 2 + (c[1] - ancora[1]) ** 2)
    esc = [ok[0]]
    while len(esc) < n:
        esc.append(max((c for c in ok if c not in esc and all(abs(c[0] - e[0]) + abs(c[1] - e[1]) >= 3 for e in esc)),
                       key=lambda c: min((c[0] - e[0]) ** 2 + (c[1] - e[1]) ** 2 for e in esc)))
    return esc


def _area(i):
    return {(c['x'], c['y']) for c in AREAS[i]}


print('areas alcancaveis:', {k: str(len([c for c in v if (c['x'], c['y']) in _ALC])) + '/' + str(len(v)) for k, v in sorted(AREAS.items(), key=lambda kv: int(kv[0]))})
_isoladas = _componentes({c for c in _LIVRE if c not in _ALC})
for _comp in sorted(_isoladas, key=len, reverse=True)[:3]:
    if len(_comp) < 8:
        continue
    _m = min(((abs(a[0] - b[0]) + abs(a[1] - b[1]), a, b) for a in _comp for b in _ALC))
    print('ilha de', len(_comp), 'casas, x', min(c[0] for c in _comp), max(c[0] for c in _comp), 'y', min(c[1] for c in _comp), max(c[1] for c in _comp), '| a mais perto do resto:', _m)
_a3 = _area('3')
_a9_oeste = {c for c in _area('9') if c[0] <= 31}
NINHOS = {
    'stirges': _espalha(_a3, 10),                                   # area 3: pendurados no teto
    'esqueletos': _espalha(_area('4'), 9),                          # area 4: os ossos da guarita
    'ghoulsSul': _espalha(_area('6'), 3),                           # area 6: roendo ossos
    'ghoulsGrande': _espalha(_a9_oeste, 7),                         # area 9: na elevacao oeste
    'gosma': _grandes(_area('2'), 1, (12, 56)),                     # area 2: nos tuneis
    'bugbearsNorte': _espalha(INTERIOR['alojNorte'], 5),            # area 11
    'zumbis': _espalha(_area('12'), 8),                             # area 12
    'caveira': _perto((44, 29), 1),                                 # area 12: a caveira flamejante, sobre os mortos
    'mormesk': _perto((67, 54), 1),                                 # area 14: surge do chao
    'espectador': _perto((66, 38), 1),                              # area 15: atras do braseiro
    'bugbearsFenda': _perto((30, 7), 1) + _perto((30, 14), 1),      # area 18: sobem pelas cordas
    'bugbearGuarda': _perto((24, 10), 1),
    'vhalak': _perto((26, 13), 1),                                  # area 18: o doppelganger, de drow
    'nezznar': _perto((7, 9), 1),                                   # area 19
    'bugbearsTemplo': _perto((6, 9), 2),
    'aranhasTemplo': _grandes(INTERIOR['templo'] - set(_USADAS), 4, (9, 5)),
    'nundro': _perto((15, 6), 1),                                   # area 20
}
for _k, _v in NINHOS.items():
    NINHOS[_k] = [{'x': x, 'y': y} for (x, y) in _v]
print('bandos:', {k: len(v) for k, v in NINHOS.items()})



# A LUZ: a mina e escura (luz 0); so ha luz onde o livro a poe (braseiros, o acampamento, as chamas verdes).
L = [[0] * W for _ in range(H)]
LUZES = []
for (_x, _y), _n in SALA_DE.items():
    if _n in ('alojNorte', 'templo', 'forja', 'forjaOficina'):
        L[_y][_x] = 2
for (_x, _y) in FUNGOS:
    L[_y][_x] = 1
for (_x, _y, _tipo) in ((27, 28, 'braseiro'), (9, 9, 'fogueira'), (66, 38, 'chama verde')):
    LUZES.append({'pos': {'x': _x, 'y': _y}, 'claro': 20, 'penumbra': 20, 'tipo': 'fogueira'})

dados = {
    'paredes': {'n': [''.join(l) for l in PN], 'o': [''.join(l) for l in PO]},
    'terreno': [''.join(l) for l in T],
    'altura': ['0' * W for _ in range(H)],
    'luz': [''.join(str(v) for v in l) for l in L],
    'luzes': LUZES,
}
extra = {
    'chegada': {'x': CHEGADA[0], 'y': CHEGADA[1]},
    'grupo': [{'x': x, 'y': y} for (x, y) in GRUPO],
    'areas': AREAS,
    'props': PROPS,
    'ninhos': NINHOS,
    'folhas': [[{'x': x1, 'y': y1}, {'x': x2, 'y': y2}] for (x1, y1, x2, y2, cod) in PORTAS if cod == '+'],
    'saida': [{'x': x, 'y': y} for (x, y) in sorted(CHAO) if y >= 87 and x <= 8],
    'salas': {n: [{'x': x, 'y': y} for (x, y) in sorted(cs)] for n, cs in INTERIOR.items()},
}
saida = RAIZ / 'src' / 'game' / 'ondaeco.js'
CAB = ('// A CAVERNA ONDA ECO (Parte 4): a mina perdida do Pacto de Phandelver.\n//\n'
       '// Gerado por `src/dev/mapa-ondaeco.py` - mude la e rode de novo.\n'
       '// Glifos: R rocha - _ chao da caverna - L laje - W agua funda - O fosso - x canal - ; fungos.\n')
saida.write_text(CAB + '\nexport const MAPA_ONDA_ECO = ' + json.dumps(dados, indent=1, ensure_ascii=False)
                 + ';\n\nexport const ONDA_ECO = ' + json.dumps(extra, indent=1, ensure_ascii=False) + ';\n',
                 encoding='utf-8', newline='\n')
print('escrito:', saida.name, '| chao', sum(r.count('_') + r.count('L') for r in dados['terreno']),
      '| agua', len(AGUA_FUNDA), '| fungos', len(FUNGOS), '| areas', {k: len(v) for k, v in AREAS.items()})
