# -*- coding: utf-8 -*-
"""
A ENCRUZILHADA DA FORCA (o Obelisco, capítulo 6): o velho entreposto subterrâneo de duergar, svirfneblin e drow, onde
está o terceiro fragmento do obelisco. Sobre o battlemap da Forgotten Adventures ("Gibbet Crossing", 68 x 91; a cena do
Foundry do repositório público da FA, em `mapas/_cenas/`).

A ARTE vem em duas metades de 200 px por casa (`mapas/GibbetCrossing/.../GibbetCrossing_part1|2_Gridless`), juntadas e
reduzidas a 100 px por casa em `public/mapas/fa/encruzilhada.jpg`, com as peças da FA ao lado (o armário de G19 e as
artes sem torre e sem fragmento).

O import:  SEMENTES="15,17;23,19;..." python src/dev/importar-foundry.py mapas/_cenas/gibbet-crossing-68x91.json \\
               public/mapas/fa/encruzilhada.jpg --chao-pela-cor --editor src/dev/_tmp/encruzilhada-cor.json
(o recorte pela cor deixa de fora o vazio preto entre as cavernas; sem ele, o lado de fora vazava pelos dois túneis que
saem pela borda do mapa).

A PLANTA BATE COM O LIVRO SALA A SALA, ancorada nos ladrilhos com nome da cena da FA (o fragmento em G25, a torre em G14,
o armário em G19, a névoa em G12, as gaiolas em G6):
  a oficina duergar, a OESTE:  G1 a entrada (o desabamento do fundo), G2 o depósito, G3 a oficina das gaiolas, G4 o
      alojamento (e o nicho das mesas), o corredor oeste, G5 o mostruário, G6 a prisão, G9 a mina esgotada;
  o cruzamento:                G8 a caverna abobadada, G7 a escada para a passagem alagada (e a passagem, submersa);
  o enclave svirfneblin, NE:   G10 o túnel desabado, G11 a passagem para Talhundereth (a fenda ao norte dá em T1),
      G12 a sala de recepção embaçada, G13 os quartos, G14 a torre tombada;
  os salões drow, SUL e SE:    G15 a delegação duergar, G16 a câmara de negociação, G17 a delegação drow, G18 a
      passagem drow, G19 a recepção dos Azfadiel, G20 o santuário, G21 a recepção dos Triestoroth, G22 a sala mofada,
      G23 o salão da matança, G24 a sala da guarda, G25 o cofre.

O QUE O FOUNDRY NÃO TEM E O LIVRO PEDE:
  - a TORRE LAMACENTA é casa bloqueada (alvenaria) até encolher: a ponta dela tampa o corredor de G23 logo abaixo da
    porta do cofre. O contorno dela, que a FA traçou como seteira, sai dos traços;
  - o ARMÁRIO de G19 tampa a porta para G20 até alguém o arrastar;
  - a porta entre G16 e a escada de G20 é SECRETA (Percepção CD 15): parede até lá;
  - as portas do corredor oeste para G5, G6 e G9 e a do cofre, que a cena da FA não trouxe como porta;
  - a seteira entre G24 e G23 (a FA a desenhou e não a traçou): as seteiras dão cobertura a quem está em G24;
  - a ÁGUA: a passagem de G7 submersa (funda), e os 60 cm de G16, G17 e G18 e os mais de 30 de G22 (rasa: terreno
    difícil, anda-se). Em G18 ela vale onde a arte é água (cinza, contra o marrom da pedra seca);
  - as gaiolas de G6 (grade), as estátuas de G21 (pedra) e o mofo marrom de G22 (região que fere).

A arte não entra no repositório nem na publicação (licença da FA); sem ela no disco, o tabuleiro desenha o chão pelo
glifo. Rode: python src/dev/mapa-encruzilhada.py   (escreve `src/game/encruzilhada-mapa.js` depois das provas no motor)
"""
import importlib.util
import json
import os

import numpy as np
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SAIDA = os.path.join(RAIZ, 'src', 'game', 'encruzilhada-mapa.js')
ARTE = os.path.join(RAIZ, 'public', 'mapas', 'fa', 'encruzilhada.jpg')


def _carregar(nome):
    spec = importlib.util.spec_from_file_location(nome.replace('-', '_'), os.path.join(RAIZ, 'src', 'dev', nome + '.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


Z = _carregar('mapa-zorzula')          # obj, luzes_da_fa, peca, por_aresta
V = _carregar('mapa-cap5-vila-fa')     # provas

# as salas, por retângulos (x0, y0, x1, y1), na ordem em que se testam (a primeira que pega a casa fica com ela)
SALAS = [
    ('G25', (53, 31, 62, 37)),
    ('G24', (49, 44, 58, 51)),
    ('G23', (53, 38, 54, 43)), ('G23', (55, 42, 61, 43)), ('G23', (59, 44, 61, 53)), ('G23', (53, 52, 58, 53)),
    ('G23', (53, 54, 54, 56)),
    ('G22', (48, 56, 51, 66)),
    ('G21', (52, 53, 64, 69)),
    ('G13', (53, 17, 64, 29)),
    ('G12', (42, 17, 52, 33)),
    ('G14', (38, 33, 52, 46)),
    ('G11', (28, 0, 41, 17)),
    ('G10', (42, 6, 54, 16)),
    ('G4', (5, 15, 9, 24)), ('G4', (5, 25, 12, 31)),
    ('G1', (10, 13, 20, 21)),
    ('G2', (21, 15, 27, 23)),
    ('G3', (13, 22, 27, 33)),
    ('corredor', (2, 22, 5, 53)),
    ('G5', (5, 54, 17, 61)),
    ('G6', (4, 62, 11, 71)),
    ('G9', (6, 34, 20, 49)),
    ('G15', (27, 53, 31, 65)),
    ('G16', (22, 66, 35, 76)),
    ('G17', (36, 62, 40, 72)),
    ('G20', (24, 77, 35, 90)),
    ('G19', (36, 80, 61, 90)), ('G19', (36, 74, 44, 79)),
    ('G7', (0, 57, 26, 91)),
    ('G18', (40, 47, 52, 80)), ('G18', (48, 69, 67, 80)),
    ('G8', (18, 32, 40, 58)),
    ('superficie', (0, 0, 12, 13)),
]
LIVRES = set('L_xckdvlE]|W')

# A TORRE LAMACENTA tombada: a ponta que tampa o corredor de G23 e a base que ocupa a caverna de G14
TORRE_CORREDOR = [(53, 39), (54, 39), (53, 40), (54, 40), (53, 41), (54, 41)]
TORRE_CAVERNA = [(x, y) for y in range(40, 45) for x in range(46, 53)]
# o ARMÁRIO de G19, na parede oeste, em frente da porta do santuário
ARMARIO = [(37, 82), (38, 82), (37, 83), (38, 83), (37, 84), (38, 84), (37, 85), (38, 85)]
# as gaiolas de espinhos de G6, no fundo da prisão (a FA as desenha juntas: "CellTops", 8 x 5)
GAIOLAS = [(x, y) for y in range(67, 71) for x in range(5, 11)]
# o mofo marrom de G22: a mancha de 3 m no canto sul, e a crosta de gelo em volta
MOFO = [(49, 64), (50, 64), (49, 65), (50, 65)]


def sala_de(x, y):
    for sid, (x0, y0, x1, y1) in SALAS:
        if x0 <= x <= x1 and y0 <= y <= y1:
            return sid
    return None


_img = None


def agua_na_arte(x, y):
    """Casa de água pela cor: a água da FA é cinza neutro; a pedra seca, marrom (azul menos vermelho bem abaixo de zero)."""
    global _img
    if _img is None:
        Image.MAX_IMAGE_PIXELS = None
        _img = np.asarray(Image.open(ARTE).convert('RGB')).astype(float)
    a = _img[y * 100 + 15:y * 100 + 85, x * 100 + 15:x * 100 + 85].reshape(-1, 3).mean(0)
    return a[2] - a[0] >= -4


def montar():
    b = json.load(open(os.path.join(RAIZ, 'src', 'dev', '_tmp', 'encruzilhada-cor.json'), encoding='utf-8'))
    terreno = [list(l) for l in b['terreno']]
    w, h = len(terreno[0]), len(terreno)
    paredes = {lado: list(b['paredes'][lado]) for lado in ('n', 'o')}
    pinta = lambda cs, g: [terreno[y].__setitem__(x, g) for x, y in cs]

    # LAJE nas salas construídas, CAVERNA nas cavernas e túneis
    construidas = {'G1', 'G2', 'G3', 'G4', 'corredor', 'G5', 'G6', 'G12', 'G13', 'G15', 'G16', 'G17', 'G19', 'G20', 'G21',
                   'G22', 'G23', 'G24', 'G25'}
    for y in range(h):
        for x in range(w):
            if terreno[y][x] == '_' and sala_de(x, y) in construidas:
                terreno[y][x] = 'L'

    # O CORREDOR DE G23 até a porta do cofre: a ponta escura da torre o pintou de rocha pela cor
    pinta([(53, 38), (54, 38), (53, 42), (54, 42), (53, 43), (54, 43)], 'L')
    # a TORRE: alvenaria até encolher (o roteiro troca de volta)
    pinta(TORRE_CORREDOR, 'M')
    pinta([c for c in TORRE_CAVERNA if terreno[c[1]][c[0]] != 'R'], 'M')
    # o contorno da torre, que a FA traçou como seteira, sai das arestas (quem barra é a casa)
    for lado in ('n', 'o'):
        for y in range(36, 47):
            linha = paredes[lado][y]
            paredes[lado][y] = ''.join('.' if (44 <= x <= 56 and c == 'J') else c for x, c in enumerate(linha))
    # a parede oeste do corredor de G23, junto da torre (a torre não abre a caverna para o corredor)
    for y in range(39, 44):
        Z.por_aresta(paredes, (52, y), (53, y), '#')

    # AS PORTAS QUE A CENA DA FA NÃO TROUXE COMO PORTA: o corredor oeste para G9, G5 e G6, e o cofre
    for a, bb in [((4, 40), (5, 40)), ((4, 41), (5, 41)), ((5, 53), (5, 54)), ((6, 53), (6, 54)), ((5, 61), (5, 62)),
                  ((6, 61), (6, 62)), ((53, 37), (53, 38)), ((54, 37), (54, 38))]:
        Z.por_aresta(paredes, a, bb, '+')
    # OS CUBÍCULOS DE G21 E A DESPENSA DO SUDESTE: o chão escuro da arte os fez rocha pela cor, e as duas portas que a FA
    # trouxe como porta abriam em pedra; outras duas a parede que encosta no batente engoliu (revisão de 2026-11-13). Os
    # quartos estão desenhados, com cama, caixote e barril: viram laje, e as portas que faltavam voltam.
    pinta([(x, y) for y in range(56, 66) for x in (63, 64)] + [(x, y) for y in (66, 67) for x in range(61, 65)], 'L')
    pinta([(x, y) for y in (84, 85) for x in (55, 56)] + [(x, y) for y in range(84, 88) for x in range(57, 61)], 'L')
    for a, bb in [((62, 65), (63, 65)), ((54, 84), (55, 84))]:
        Z.por_aresta(paredes, a, bb, '+')
    # A SETEIRA entre G24 e G23: a parede leste de G24
    for y in range(46, 51):
        Z.por_aresta(paredes, (58, y), (59, y), 'J')

    # A ÁGUA
    for y in range(h):
        for x in range(w):
            if terreno[y][x] not in ('_', 'L'):
                continue
            s = sala_de(x, y)
            if s in ('G16', 'G17', 'G22'):
                terreno[y][x] = ']'
            elif s == 'G18' and agua_na_arte(x, y):
                terreno[y][x] = ']'
            elif s == 'G7' and (y >= 64 or x <= 16) and agua_na_arte(x, y):
                terreno[y][x] = 'W'
    # o armário, as gaiolas, as estátuas de G21 (dois anões, um drow, dois quaggoths e o basilisco, nas paredes)
    pinta(ARMARIO, 'g')
    pinta(GAIOLAS, 'G')
    pinta([(53, 56), (61, 56), (53, 63), (62, 63), (55, 66), (60, 66)], 'E')
    # G3: a forja apagada (a FA a cercou com parede invisível), e a gaiola montada no canto sudeste
    pinta([(25, 30)], 'G')
    # G14: o cofre de 1.300 peças de ouro, junto da base da torre
    pinta([(45, 42)], 'K')
    # G20: o altar de mármore na reentrância sul, e a mesa das lousas encostada na escada
    pinta([(30, 88), (31, 88)], 'a')
    pinta([(27, 80)], 'm')
    # G24: o trono de pedra na parede oeste
    pinta([(49, 49)], 'D')
    # G15: a mesa longa e baixa da delegação duergar
    pinta([(28, 55), (29, 55)], 'm')
    # G25: o fragmento no chão, perto dos ossos (cobertura: não se pisa nele)
    terreno = [''.join(l) for l in terreno]

    # A SECRETA DE G16: a porta do sul, para a escada que sobe ao santuário de G20
    secretas = {
        'escadaDoSantuario': {'a': {'x': 29, 'y': 75}, 'b': {'x': 29, 'y': 76}, 'tambem': [{'a': {'x': 30, 'y': 75}, 'b': {'x': 30, 'y': 76}}]},
    }
    for s_ in secretas.values():
        for par in [s_] + s_.get('tambem', []):
            Z.por_aresta(paredes, (par['a']['x'], par['a']['y']), (par['b']['x'], par['b']['y']), '#')

    # as FOLHAS das portas (sem a lista, nenhuma porta abre): toda aresta '+'
    folhas = []
    for y in range(h):
        for x in range(w):
            if paredes['n'][y][x] == '+':
                folhas.append([{'x': x, 'y': y - 1}, {'x': x, 'y': y}])
            if paredes['o'][y][x] == '+':
                folhas.append([{'x': x - 1, 'y': y}, {'x': x, 'y': y}])

    # A LUZ (o livro): os túneis naturais seguem acesos por chama contínua, e as SALAS são escuras. As luzes da FA são
    # as arandelas dos túneis — chama contínua não se apaga (`semChama`) — e o brilho verde do fragmento em G25.
    luz = ['0' * w for _ in range(h)]
    luzes = Z.luzes_da_fa(b, trocas={(60, 35): 'magia'}, fora=((43, 20),))
    for l in luzes:
        l['semChama'] = True
        if (l['pos']['x'], l['pos']['y']) != (60, 35):
            l['tipo'] = 'magia'
            l['cor'] = '#9fd2ff'

    salas = {}
    for y, l in enumerate(terreno):
        for x, g in enumerate(l):
            if g in LIVRES or g in 'maEDsiKgG':
                sid = sala_de(x, y)
                if sid:
                    salas.setdefault(sid, []).append({'x': x, 'y': y})

    # A NÉVOA DE G12 (o livro: a Nublar dos gnomos impregnou a sala): as casas de dentro, para o motor
    embacado = [c for c in salas.get('G12', []) if terreno[c['y']][c['x']] in LIVRES]

    sobre = [
        Z.peca('armario', 'encruzilhada-armario', 37, 82, 2, 4, ligada=True),
        Z.peca('semTorre', 'encruzilhada-sem-torre', 45, 38, 11, 8),
        Z.peca('semFragmento', 'encruzilhada-sem-fragmento', 59, 34, 2, 2),
    ]
    for s in sobre:
        s['url'] = s['url'].replace('.jpg', '.webp')

    # O MOFO MARROM de G22, como região: quem chega a 1,5 m pela primeira vez no turno, ou começa o turno ali, faz
    # Constituição CD 12 contra 4d10 de frio (metade se passar). A mancha e o anel em volta.
    anel = sorted({(x + dx, y + dy) for x, y in MOFO for dx in (-1, 0, 1) for dy in (-1, 0, 1)
                   if sala_de(x + dx, y + dy) == 'G22' and terreno[y + dy][x + dx] in LIVRES})
    regioes = [{
        'id': 'mofoMarrom', 'nome': 'O mofo marrom', 'casas': [f'{x},{y}' for x, y in anel],
        'quando': ['entrar', 'comecaTurno'],
        'efeitos': [{'tipo': 'texto', 'texto': 'O ar em volta da crosta marrom morde como inverno.'},
                    {'tipo': 'dano', 'dados': '4d10', 'dano': 'frio', 'teste': {'atributo': 'con', 'cd': 12, 'metade': True}}],
    }]

    mapa = {
        'terreno': terreno, 'luz': luz, 'paredes': paredes, 'folhas': folhas, 'luzes': luzes,
        'tracos': b['tracos'], 'tracosTipo': b.get('tracosTipo') or [None] * len(b['tracos']),
        'interativos': INTERATIVOS, 'sobreposicoes': sobre, 'regioes': regioes, 'embacado': embacado,
        'fundo': {'nome': 'encruzilhada.jpg', 'url': '/mapas/fa/encruzilhada.jpg', 'escala': 100, 'x0': 0, 'y0': 0, 'giro': 0, 'opacidade': 1},
    }
    # os traços do contorno da torre (a seteira da FA) saem: a torre é casa
    tipos = mapa['tracosTipo']
    mapa['tracos'] = [t for t, tp in zip(mapa['tracos'], tipos) if tp != 'J']
    mapa['tracosTipo'] = [tp for tp in tipos if tp != 'J']

    pontos = {
        # quem chega desce o túnel da superfície, a noroeste
        'grupo': [{'x': 4, 'y': 7}, {'x': 5, 'y': 7}, {'x': 5, 'y': 8}, {'x': 4, 'y': 6}],
        'olhar': {'dx': 1, 'dy': 1},
        'saida': [{'x': 0, 'y': 0}, {'x': 1, 'y': 0}, {'x': 2, 'y': 0}, {'x': 1, 'y': 1}, {'x': 2, 'y': 1}],
        # G11: a fenda ao norte, que sobe para T1 de Talhundereth; quem vem de lá chega aqui
        'fendaDeTalhundereth': [{'x': 34, 'y': 0}, {'x': 35, 'y': 0}, {'x': 34, 'y': 1}, {'x': 35, 'y': 1}],
        # G11: a porta reforçada, barrada do lado de G11
        'portaBarrada': {'aresta': '42,14,O', 'deDentro': {'x': 41, 'y': 14}, 'deFora': {'x': 42, 'y': 14}},
        # G3: os quatro ashenwights martelando diante da forja
        'ashenwights': [{'x': 18, 'y': 25}, {'x': 20, 'y': 25}, {'x': 22, 'y': 25}, {'x': 21, 'y': 27}],
        'gaiolaMontada': {'x': 25, 'y': 30},
        # G4: a mochila rasgada
        'mochila': {'x': 8, 'y': 21},
        # G6: a Vakketar, enrolada nas correntes frouxas
        'vakketar': {'x': 8, 'y': 64},
        # G8: o grick alfa enrolado numa estalactite a leste
        'grickAlfa': {'x': 37, 'y': 42},
        # G9: os seis gricks nos ninhos de muco
        'gricks': [{'x': 9, 'y': 38}, {'x': 12, 'y': 41}, {'x': 15, 'y': 39}, {'x': 10, 'y': 44}, {'x': 14, 'y': 44}, {'x': 16, 'y': 42}],
        # G10: os dois enroladores entre as pedras
        'enroladores': [{'x': 47, 'y': 11}, {'x': 51, 'y': 12}],
        # G12: onde o enrolador que sobra se esconde (logo dentro da porta noroeste)
        'recuoDoEnrolador': {'x': 44, 'y': 18},
        # G14: o Zoklork e os dois elementais, conversando junto da torre
        'zoklork': {'x': 43, 'y': 38}, 'elementais': [{'x': 41, 'y': 37}, {'x': 46, 'y': 36}],
        'torre': {'x': 46, 'y': 41}, 'cofreDaTorre': {'x': 45, 'y': 42},
        # G16: os quatro chuuls na água
        'chuuls': [{'x': 24, 'y': 68}, {'x': 29, 'y': 68}, {'x': 24, 'y': 73}, {'x': 30, 'y': 73}],
        # G19: o armário na frente da porta do santuário
        'armario': {'x': 38, 'y': 83},
        # G20: o Zuluthl, o altar e a mesa das lousas
        'zuluthl': {'x': 31, 'y': 84}, 'altar': {'x': 30, 'y': 88}, 'lousas': {'x': 27, 'y': 80},
        # G21: os cinco grimlocks e os dois basiliscos
        'grimlocksDoSalao': [{'x': 55, 'y': 58}, {'x': 58, 'y': 57}, {'x': 60, 'y': 59}, {'x': 56, 'y': 62}, {'x': 59, 'y': 64}],
        'basiliscos': [{'x': 54, 'y': 60}, {'x': 61, 'y': 61}],
        'estatuas': [{'x': 53, 'y': 56}, {'x': 61, 'y': 56}, {'x': 53, 'y': 63}, {'x': 62, 'y': 63}, {'x': 55, 'y': 66}, {'x': 60, 'y': 66}],
        # G23: os dois grimlocks martelando a torre
        'grimlocksDaTorre': [{'x': 53, 'y': 43}, {'x': 54, 'y': 43}],
        # G24: o Qunbraxel e os quatro grimlocks
        'qunbraxel': {'x': 54, 'y': 48}, 'grimlocksDaGuarda': [{'x': 53, 'y': 46}, {'x': 56, 'y': 46}, {'x': 52, 'y': 50}, {'x': 56, 'y': 50}],
        'mapaDeCarvao': {'x': 56, 'y': 51},
        'portaDaGuarda': {'x': 57, 'y': 43},
        # G25: o fragmento, os ossos dos três ladrões e o tesouro
        'fragmento': {'x': 59, 'y': 34}, 'tesouro': {'x': 61, 'y': 33}, 'ossos': {'x': 60, 'y': 36},
        'qunbraxelNoCofre': {'x': 57, 'y': 34}, 'grimlocksNoCofre': [{'x': 55, 'y': 33}, {'x': 55, 'y': 35}, {'x': 57, 'y': 32}, {'x': 57, 'y': 36}, {'x': 61, 'y': 35}, {'x': 59, 'y': 32}],
        'torreCorredor': [{'x': x, 'y': y} for x, y in TORRE_CORREDOR],
        'torreCaverna': [{'x': x, 'y': y} for x, y in TORRE_CAVERNA],
        'armarioCasas': [{'x': x, 'y': y} for x, y in ARMARIO],
        'mofo': [{'x': x, 'y': y} for x, y in MOFO],
        'secretas': secretas,
        'salas': salas,
    }
    return mapa, pontos


INTERATIVOS = [
    # G1
    Z.obj(12, 15, 'portaLabuta', 'Olhar a porta dupla', 'Duas folhas de pedra com uma palavra anã entalhada muitas vezes, uma '
          'embaixo da outra, como um castigo de escola.', 'lembrar', 10, 'A palavra é "labuta". Os duergar a escreviam nas '
          'portas da oficina.', 'História'),
    Z.obj(9, 19, 'xVermelho', 'Olhar o X vermelho', 'Um X grande, pintado de vermelho na porta oeste, ainda brilhante, como se '
          'alguém o tivesse refeito há pouco.', 'investigar', 12, 'A tinta é recente e foi passada por cima de outra, mais velha. '
          'Quem marcou isto quis dizer "por aqui se volta" — ou quis que alguém pensasse o contrário.'),
    Z.obj(15, 15, 'desabamentoDoFundo', 'Olhar o desabamento', 'O fundo da sala desabou: escória, pedra e terra até o teto. '
          'O túnel da superfície sobe daqui por mais de um quilômetro e meio.'),
    # G2
    Z.obj(24, 17, 'barrasDeFerro', 'Olhar as prateleiras', 'Barras de ferro de todos os tamanhos, comidas de ferrugem, que '
          'esfarelam na mão.', 'lembrar', 12, 'As marcas batidas no ferro são de ferreiros duergar, de um clã que os '
          'devoradores de mente apagaram há gerações.', 'História'),
    # G3
    Z.obj(20, 23, 'forjaApagada', 'Olhar a forja', 'Uma forja de anão, fria há séculos. Diante dela, o chão está marcado de '
          'pés que nunca saíram do lugar.'),
    Z.obj(24, 29, 'gaiolaDeEspinhos', 'Olhar a gaiola', 'Uma gaiola de ferro com os espinhos para dentro, montada e acabada. '
          'As dobradiças brilham: mitral.', 'investigar', 12, 'Ela dobra sobre si mesma num cubo do tamanho de um baú, em um '
          'minuto, se a pessoa souber onde apertar. Não tem fechadura.'),
    # G5
    Z.obj(12, 57, 'entalhesDoMostruario', 'Olhar os entalhes', 'Um duergar desdobra uma gaiola passo a passo, em seis quadros '
          'entalhados na parede. A pedra se desfaz nas bordas.'),
    # G6
    Z.obj(7, 66, 'gaiolasDaPrisao', 'Olhar as gaiolas', 'Duas gaiolas de espinhos do tamanho de um boi, entupidas de ossos e de '
          'carne podre. O cheiro chega antes da luz.'),
    # G8
    Z.obj(29, 50, 'portaDaGaiola', 'Olhar a porta dupla', 'Uma porta dupla com uma gaiola de espinhos entalhada de ponta a ponta.'),
    Z.obj(30, 40, 'ecosDoMercado', 'Escutar a caverna', 'Por um instante, a caverna se enche de vozes: alguém pechincha em anão, '
          'alguém ri em gnomês, alguém conta moedas. Some antes de se virar a cabeça.'),
    # G9
    Z.obj(11, 42, 'mucoDaMina', 'Olhar as frestas', 'Um muco grosso e nojento nas frestas da rocha, com pedaços de casca '
          'dentro.', 'lembrar', 13, 'Ninhos de grick. Onde há um ninho, há meia dúzia.', 'Natureza'),
    # G10
    Z.obj(48, 11, 'pedregulhos', 'Olhar as pedras', 'Blocos grandes de pedra caída fecham a curva do túnel. Alguns têm uma '
          'textura estranha, como couro molhado.', 'procurar', 15, 'Duas das "pedras" respiram.'),
    # G12
    Z.obj(47, 20, 'nevoaDaSala', 'Olhar a sala', 'Tudo aqui dentro parece visto debaixo d\'água: as bordas tremem, as distâncias '
          'mentem.', 'lembrar', 13, 'Nublar, impregnado na pedra. Os gnomos lançaram a magia no último desespero, e ela ficou. '
          'Quem é atacado aqui dentro é mais difícil de acertar.', 'Arcanismo'),
    # G13
    Z.obj(56, 23, 'quartosVazios', 'Entrar num quarto', 'Duas camas baixas de pedra e um baú de metal vazio. Por um segundo, '
          'você acorda de um sono que não dormiu, com a certeza de que alguém está na porta. Não há ninguém.'),
    # G14
    Z.obj(46, 39, 'torreLamacenta', 'Olhar a torre', 'Uma torre baixa e tombada, de pedra escura, atravessada na parede. Nós de '
          'lama saem e entram da superfície dela, devagar, sem parar.', 'lembrar', 15, 'Uma fortaleza instantânea: um objeto '
          'mágico que cresce de uma pedrinha. Encravada assim na rocha, nada a fere. Ela tem uma palavra de comando.', 'Arcanismo'),
    # G15
    Z.obj(29, 57, 'arcoDaDelegacao', 'Olhar o arco', 'Um arco de entalhes fundos e serrilhados sobre a escada que desce. Em '
          'cima, uma frase em anão.', 'lembrar', 10, '"Não confie em ninguém."', 'História'),
    # G17
    Z.obj(39, 64, 'escritaDrow', 'Olhar a escrita', 'Uma escrita delicada sobre a porta leste, em letras finas como teia.',
          'lembrar', 10, 'É élfico: "desconfie de todo estranho".', 'História'),
    # G19
    Z.obj(40, 84, 'moedasAranha', 'Olhar o armário', 'Um armário de metal encostado na parede oeste, com moedas de pernas de '
          'aranha gravadas na porta.', 'investigar', 12, 'O armário está vazio e fora do lugar: as marcas no chão mostram que '
          'alguém o arrastou até aqui, encostando-o na parede.'),
    # G21
    Z.obj(57, 61, 'estatuasRealistas', 'Olhar as estátuas', 'Seis estátuas encostadas nas paredes, realistas demais: dois anões, '
          'um drow, dois quaggoths e um basilisco. Todas com o rosto quebrado a marteladas.', 'investigar', 13,
          'Ninguém esculpe a costura de uma bota. Isto eram viajantes, e os rostos foram quebrados para que não voltem. O '
          'cascalho dos rostos ainda está no chão.'),
    # G22
    Z.obj(50, 62, 'crostaMarrom', 'Olhar a crosta', 'Uma crosta marrom sobre a água, num canto, fina como gelo. O ar em volta '
          'dela é gelado.', 'lembrar', 12, 'Mofo marrom: suga o calor de quem chega perto. O fogo o faz crescer; o frio o mata.',
          'Natureza'),
    # G7
    Z.obj(20, 62, 'escadaAlagada', 'Olhar a escada', 'Degraus toscos descem para uma água turva e parada, que cobre o túnel inteiro '
          'até o teto. Lá embaixo não se vê nada.', 'lembrar', 12, 'O túnel está alagado há décadas. Uma parte dele desabou para os '
          'salões dos drow, mais ao leste: quem nadasse o bastante sairia lá.', 'Natureza'),
    # G11
    Z.obj(40, 13, 'marcasNaPorta', 'Olhar a porta reforçada', 'Uma porta grossa, com o encaixe da barra deste lado. Na madeira, '
          'arranhões fundos e marcas de pancada, de fora para dentro.', 'rastrear', 12, 'Pés descalços, unhas compridas, muitos e '
          'sem pressa: grimlocks. Ninguém passou: as pegadas voltam todas para o túnel.'),
    # G16
    Z.obj(27, 70, 'mesaDeNegociacao', 'Olhar a mesa', 'O tampo de uma mesa de pedra aparece logo acima da água escura, com marcas '
          'de copo e de faca. Era aqui que duergar e drow pechinchavam.'),
    # G17
    Z.obj(38, 69, 'cadeirasEnferrujadas', 'Olhar as cadeiras', 'Armações de cadeira, de metal fino e enferrujado, saem da água. '
          'O assento, que era de seda, apodreceu faz tempo.'),
    # G18
    Z.obj(42, 65, 'portaPelaMetade', 'Olhar a porta', 'Só a metade de cima de uma porta sai da água, a oeste. A outra metade está '
          'no escuro, debaixo da superfície.'),
    # G19
    Z.obj(51, 79, 'moedaAranha', 'Olhar a porta', 'Uma moeda com pernas de aranha gravada na porta, e um nome em élfico embaixo.',
          'lembrar', 12, 'Azfadiel: uma casa drow de comércio, apagada pelos devoradores de mente há gerações.', 'História'),
    # G20
    Z.obj(29, 83, 'teiaDeMoedas', 'Olhar a teia', 'Uma teia cobre o teto do santuário inteiro, e moedas com perninhas de aranha '
          'andam por ela, devagar, tilintando.'),
    # G21
    Z.obj(57, 68, 'portaTriestoroth', 'Olhar a porta dupla', 'Uma adaga cravada num lingote, gravada na porta, e um nome em élfico.',
          'lembrar', 12, 'Triestoroth: uma casa drow rica, apagada pelos devoradores. Dizem que os cofres dela nunca foram achados.',
          'História'),
    Z.obj(54, 60, 'portaFria', 'Tocar a porta oeste', 'A porta oeste está fria ao toque, fria como pedra no inverno, aqui embaixo '
          'onde tudo é úmido e morno.', 'lembrar', 12, 'Frio assim, numa sala sem neve, é coisa viva: um mofo que come o calor.',
          'Natureza'),
    # G22
    Z.obj(50, 59, 'jantarMofado', 'Olhar a sala', 'Uma sala de jantar fina, alagada: seis cadeiras em volta de uma mesa grande, '
          'e lençóis de mofo pendurados nas varas onde ficavam as tapeçarias.'),
    # G23
    Z.obj(60, 48, 'seteiras', 'Olhar as seteiras', 'Fendas estreitas na parede oeste do corredor, da largura de uma mão. Do outro '
          'lado, alguém pode ver o corredor inteiro sem ser visto.'),
    # G25
    Z.obj(60, 36, 'ossosDosLadroes', 'Examinar os ossos', 'Os ossos de três drow, ainda de botas, sentados em volta da pedra negra. '
          'Nenhum tem marca de arma.', 'examinar', 12, 'Morreram de fome e de sede, aqui dentro, no meio do ouro. A porta estava '
          'fechada por fora.'),
    Z.obj(56, 32, 'facasCravejadas', 'Olhar as prateleiras', 'Prateleiras de facas com cabo de pedra preciosa, uma ao lado da outra, '
          'todas sem uso.'),
    # G24
    Z.obj(56, 51, 'mapaDeCarvao', 'Olhar o mapa de carvão', 'Um mapa enorme a carvão na parede sul, cheio de setas e notas em '
          'letras de devorador de mentes.'),
]


def alcancaveis(mapa, de):
    """As casas que o motor alcança a partir de `de` (o `reachable` do campo de verdade)."""
    import subprocess
    prog = r'''
import { montarCampo } from 'file:///@BASE@/src/game/campo.js';
const f = montarCampo(JSON.parse(process.env.MAPA));
console.log(JSON.stringify([...f.reachable(JSON.parse(process.env.DE), 100000, () => false).keys()]));
'''.replace('@BASE@', RAIZ.replace(chr(92), '/'))
    r = subprocess.run(['node', '--import', './src/dev/cena-node/register.mjs', '--input-type=module', '-e', prog], cwd=RAIZ,
                       capture_output=True, text=True, encoding='utf-8', env={**os.environ, 'MAPA': json.dumps(mapa), 'DE': json.dumps(de)})
    if r.returncode:
        raise SystemExit(r.stderr)
    return set(json.loads(r.stdout.strip().splitlines()[-1]))


def abrir_tudo(mapa, pontos):
    """O mapa ABERTO: portas abertas, a secreta achada, a torre encolhida e o armário arrastado."""
    aberto = json.loads(json.dumps(mapa))
    for lado in ('n', 'o'):
        aberto['paredes'][lado] = [l.replace('+', '/') for l in aberto['paredes'][lado]]
    for s_ in pontos['secretas'].values():
        for par in [s_] + s_.get('tambem', []):
            Z.por_aresta(aberto['paredes'], (par['a']['x'], par['a']['y']), (par['b']['x'], par['b']['y']), '/')
    t = [list(l) for l in aberto['terreno']]
    for c in pontos['torreCorredor'] + pontos['armarioCasas']:
        t[c['y']][c['x']] = 'L'
    aberto['terreno'] = [''.join(l) for l in t]
    return aberto


def main():
    um = lambda v: json.dumps(v, ensure_ascii=False, separators=(', ', ': '))
    mapa, pontos = montar()
    # OS BOLSÕES: chão que nem com tudo aberto se alcança (o vão entre as paredes dos salões drow e a rocha) vira rocha
    alc = alcancaveis(abrir_tudo(mapa, pontos), pontos['grupo'][0])
    fechou = 0
    t = [list(l) for l in mapa['terreno']]
    for y, l in enumerate(t):
        for x, g in enumerate(l):
            if g in '_L]' and f'{x},{y}' not in alc:
                t[y][x] = 'R'
                fechou += 1
    mapa['terreno'] = [''.join(l) for l in t]
    print(f'  {fechou} casas de bolsão viraram rocha')
    prova = {k: v for k, v in pontos.items() if k in ('grupo', 'ashenwights', 'vakketar', 'grickAlfa', 'gricks', 'enroladores',
                                                     'zoklork', 'elementais', 'chuuls', 'zuluthl', 'grimlocksDoSalao',
                                                     'basiliscos', 'grimlocksDaTorre', 'qunbraxel', 'grimlocksDaGuarda',
                                                     'qunbraxelNoCofre', 'grimlocksNoCofre', 'recuoDoEnrolador', 'mochila',
                                                     'fendaDeTalhundereth', 'saida')}
    aberto = abrir_tudo(mapa, pontos)
    V.provas('ENCRUZILHADA', aberto, prova, {'enroladores': 2, 'elementais': 2, 'chuuls': 2})
    linhas = ['export const MAPA_ENCRUZILHADA = {']
    for k, v in mapa.items():
        if isinstance(v, list) and v and isinstance(v[0], str):
            linhas.append(f'  {k}: [\n' + ''.join(f'    {um(l)},\n' for l in v) + '  ],')
        elif k == 'paredes':
            linhas.append('  paredes: {\n' + ''.join(f'    {lado}: [\n' + ''.join(f'      {um(l)},\n' for l in v[lado]) + '    ],\n' for lado in ('n', 'o')) + '  },')
        elif k in ('interativos', 'folhas', 'luzes', 'sobreposicoes', 'regioes'):
            linhas.append(f'  {k}: [\n' + ''.join(f'    {um(t)},\n' for t in v) + '  ],')
        else:
            linhas.append(f'  {k}: {um(v)},')
    linhas.append('};')
    cabecalho = (
        '// A ENCRUZILHADA DA FORCA (o Obelisco, capítulo 6), sobre o battlemap da Forgotten Adventures.\n'
        '// GERADO por `src/dev/mapa-encruzilhada.py` — mude lá e rode de novo.\n'
    )
    corpo = '\n'.join(linhas) + '\n\nexport const PONTOS_ENCRUZILHADA = ' + um(pontos) + ';\n'
    with open(SAIDA, 'w', encoding='utf-8', newline='\n') as f:
        f.write(cabecalho + '\n' + corpo)
    print(f'escrito: {SAIDA}')


if __name__ == '__main__':
    main()
