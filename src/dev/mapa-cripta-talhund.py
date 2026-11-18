# -*- coding: utf-8 -*-
"""
A CRIPTA DOS TALHUND (o Obelisco, capítulo 6), debaixo de Talhundereth, sobre o battlemap da Forgotten Adventures
("Crypt of the Talhund", 44 x 33; a cena do Foundry do repositório público da FA, em `mapas/_cenas/`).

O import:  SEMENTES="40,26;..." python src/dev/importar-foundry.py mapas/_cenas/crypt-of-the-talhund-44x33.json \\
               public/mapas/fa/cripta-talhund.jpg --editor src/dev/_tmp/cripta.json --chao-pela-cor
(uma luz só, o brilho da esmeralda: o derivador precisa de uma semente por sala; e a água de P5 e a escada encostam na
borda do mapa, por isso o chão sai recortado pela cor antes das sementes).

AS SALAS SÃO AS DO LIVRO, MEDIDAS: o mapa oficial ("Map 6.4", no 5e.tools) marca as 21 regiões P1 a P18 com polígono.
Com o santuário (P14) e o patamar (P1) de âncoras, a escala é de 42,5 px do mapa oficial por casa da FA, e cada centro
de sala cai na sala certa da FA:
  P1 o patamar de baixo (os quatro sarcófagos e as duas estátuas)   P2 o salão fantasmagórico (o corredor de baixo)
  P3 as três salas de preparo, ligadas                              P4 três antessalas do santuário (oeste, sul, leste)
  P5 a câmara alagada (a hidra e a água viva)                       P6 a aproximação dos honrados (o crânio na porta)
  P7 o relicário (o esqueleto sem cabeça; a parede norte caída)     P8 os mortos honrados (os catorze nichos, o golem)
  P9 o túmulo do historiador (a alavanca; o Rivibiddel)             P10 o túmulo da fundadora
  P11 a aproximação dos valentes (a estátua; a parede que desliza)  P11a o corredor estreito (a diagonal oeste)
  P12 os mortos valentes (as catorze lajes)                         P13 o túmulo da general (três lajes; a alavanca)
  P14 o santuário giratório (a esmeralda)                           P15 os mortos abençoados (os catorze nichos)
  P16 o salão assombrado (a diagonal leste)                         P17 o túmulo do arquiteto (a múmia, o guardião)
  P18 a câmara do obelisco (o carrinho com o fragmento)

O QUE O FOUNDRY NÃO TEM E O LIVRO PEDE, como parede que o roteiro abre (`pontos.secretas`):
  - as três SECRETAS para as antessalas P4 (de P3, de P11a, de P16) — na FA, duas são porta comum e a de P3 nem porta;
  - o ANEL do santuário entre cada P4 e o disco: pedra maciça até as duas alavancas girarem o santuário;
  - a PAREDE QUE DESLIZA entre P11 e P15: sobe junto com o giro.
A água de P5 sai pela COR (o azul-ardósia da água funda), e é poço: nada-se, e a hidra e a água viva moram nela.

A arte não entra no repositório nem na publicação (licença da FA). Rode: python src/dev/mapa-cripta-talhund.py
(escreve `src/game/cripta-mapa.js` depois das provas no motor)
"""
import importlib.util
import json
import os
import math
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SAIDA = os.path.join(RAIZ, 'src', 'game', 'cripta-mapa.js')
ARTE = os.path.join(RAIZ, 'public', 'mapas', 'fa', 'cripta-talhund.jpg')


def _carregar(nome):
    spec = importlib.util.spec_from_file_location(nome.replace('-', '_'), os.path.join(RAIZ, 'src', 'dev', nome + '.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


Z = _carregar('mapa-zorzula')          # obj, luzes_da_fa, peca, por_aresta
V = _carregar('mapa-cap5-vila-fa')     # provas

SALAS = [
    ('P4s', (20, 23, 21, 24)), ('P4o', (14, 18, 15, 18)), ('P4l', (26, 18, 27, 18)),
    ('P14', (17, 14, 24, 22)),
    ('P13', (15, 2, 19, 7)), ('P12', (9, 2, 14, 11)), ('P11', (15, 8, 20, 13)), ('P15', (21, 6, 31, 13)),
    ('P17', (32, 11, 34, 18)), ('P18', (32, 12, 40, 22)),
    ('P1', (32, 24, 37, 30)), ('entrada', (38, 24, 43, 29)),
    ('P8', (3, 5, 8, 17)), ('P7', (6, 18, 8, 23)), ('P6', (4, 18, 5, 24)), ('P5', (0, 24, 8, 32)),
    ('P3', (11, 25, 31, 27)), ('P2', (9, 28, 31, 29)),
    ('P10', (10, 13, 13, 17)), ('P9', (12, 20, 15, 23)),
]
DIAGONAIS = [('P11a', (8.5, 24.5), (15.5, 13.5)), ('P16', (25.5, 13.5), (31.5, 22.5))]


def dist_seg(p, a, b):
    (px, py), (ax, ay), (bx, by) = p, a, b
    dx, dy = bx - ax, by - ay
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def sala_de(x, y):
    for sid, a, b in DIAGONAIS:
        if dist_seg((x + 0.5, y + 0.5), a, b) <= 1.1:
            return sid
    for sid, (x0, y0, x1, y1) in SALAS:
        if x0 <= x <= x1 and y0 <= y <= y1:
            return sid
    return None


def montar():
    b = json.load(open(os.path.join(RAIZ, 'src', 'dev', '_tmp', 'cripta.json'), encoding='utf-8'))
    terreno = [list(l.replace('_', 'L')) for l in b['terreno']]
    w, h = len(terreno[0]), len(terreno)
    pinta = lambda cs, g: [terreno[y].__setitem__(x, g) for x, y in cs if 0 <= x < w and 0 <= y < h]
    # P5: a ÁGUA pela cor (o azul-ardósia escuro), e o entulho da margem
    im = Image.open(ARTE).convert('RGB')
    escala = im.width / w
    for y in range(24, h):
        for x in range(0, 9):
            if terreno[y][x] == 'R':
                continue
            c = im.crop((int(x * escala), int(y * escala), int((x + 1) * escala), int((y + 1) * escala))).resize((1, 1)).getpixel((0, 0))
            if sum(c) / 3 < 75 and c[2] >= c[0] + 2:
                terreno[y][x] = 'W'
    # a porta entre P12 e P13 fica numa casa que a cor tomou por pedra; e o desenho da escada, separado por paredes, é pedra
    pinta([(14, 3)], 'L')
    pinta([(41, 25), (40, 26), (41, 26), (40, 27), (41, 27)], 'R')
    # P1: os quatro sarcófagos e as duas estátuas entre eles
    pinta([(33, 24), (36, 24), (33, 30), (36, 30)], 'Q')
    pinta([(34, 24), (35, 24), (34, 30), (35, 30)], 'E')
    # P7: o entulho da parede norte caída; P8/P7 se ligam por ele
    pinta([(6, 17), (7, 17), (6, 18), (7, 18)], 'x')
    # P10: o sarcófago da fundadora
    pinta([(11, 14)], 'Q')
    # P11: a estátua do guerreiro de machado erguido
    pinta([(18, 10)], 'E')
    # P13: as três lajes (a do meio, a da general)
    pinta([(16, 3), (17, 3), (18, 3)], 'Q')
    # P14: o pedestal da esmeralda
    pinta([(20, 18), (21, 18)], 'a')
    # P17: o sarcófago do arquiteto e o pedestal do guardião
    pinta([(33, 11)], 'Q')
    # P18: o carrinho de mina com o fragmento
    pinta([(38, 14)], 'C')
    # o entulho de P18 e de P2
    pinta([(34, 21), (35, 21), (35, 22)], 'x')
    terreno = [''.join(l) for l in terreno]

    paredes = {lado: list(b['paredes'][lado]) for lado in ('n', 'o')}
    # AS SECRETAS (parede até o roteiro abrir) e o que o giro abre
    secretas = {
        'P4o': {'a': {'x': 12, 'y': 18}, 'b': {'x': 13, 'y': 18}},
        'P4l': {'a': {'x': 27, 'y': 18}, 'b': {'x': 28, 'y': 18}},
        'P4s': {'a': {'x': 20, 'y': 24}, 'b': {'x': 20, 'y': 25}},
    }
    for s_ in secretas.values():
        Z.por_aresta(paredes, (s_['a']['x'], s_['a']['y']), (s_['b']['x'], s_['b']['y']), '#')
    # a antessala sul encosta em P3 por duas casas: a segunda aresta também é parede
    Z.por_aresta(paredes, (21, 24), (21, 25), '#')
    # o ANEL do santuário: rocha até o giro (as casas que ligam cada P4 ao disco)
    anel = {'o': [(16, 18), (17, 18)], 'l': [(24, 18), (25, 18)], 's': [(20, 22), (21, 22)]}
    t = [list(l) for l in terreno]
    for cs in anel.values():
        for x, y in cs:
            t[y][x] = 'R'
    # a PAREDE QUE DESLIZA entre P11 e P15 (a coluna 21): rocha até o giro
    parede_que_desliza = [(21, y) for y in range(8, 13)]
    # e as ARESTAS que o giro abre (o círculo desenhado no Foundry, e as duas faces da parede que desliza)
    arestas_do_giro = ([[(x - 1, 18), (x, 18)] for x in (16, 17, 18)] + [[(x - 1, 18), (x, 18)] for x in (24, 25, 26)]
                       + [[(x, y - 1), (x, y)] for x in (20, 21) for y in (22, 23)])
    arestas_da_parede = [[(x - 1, y), (x, y)] for x in (21, 22) for y in range(8, 13)]
    for x, y in parede_que_desliza:
        t[y][x] = 'R'
    terreno = [''.join(l) for l in t]

    folhas = []
    for y in range(h):
        for x in range(w):
            if paredes['n'][y][x] == '+':
                folhas.append([{'x': x, 'y': y - 1}, {'x': x, 'y': y}])
            if paredes['o'][y][x] == '+':
                folhas.append([{'x': x - 1, 'y': y}, {'x': x, 'y': y}])

    # NO ESCURO; a única luz é o brilho verde da esmeralda (não se apaga). Os entalhes de gema que brilham são enfeite.
    luz = ['0' * w for _ in range(h)]
    luzes = Z.luzes_da_fa(b, trocas={(21, 18): 'magia'})

    salas = {}
    for y, l in enumerate(terreno):
        for x, g in enumerate(l):
            if g != 'R':
                sid = sala_de(x, y)
                if sid:
                    salas.setdefault(sid, []).append({'x': x, 'y': y})

    sobre = [
        Z.peca('paredeAberta', 'cripta-parede-aberta', 20, 7, 3, 7),
        Z.peca('patamarCaido', 'cripta-patamar-caido', 32, 24, 6, 7),
        Z.peca('semFragmento', 'cripta-sem-fragmento', 37, 14, 3, 2),
        Z.peca('sarcofagoDoArquiteto', 'cripta-sarcofago-arquiteto', 32, 12, 3, 4),
        Z.peca('sarcofagoDaFundadora', 'cripta-sarcofago-fundadora', 10, 14, 3, 3),
        Z.peca('semEstatua', 'cripta-sem-estatua', 32, 11, 3, 2),
    ]

    mapa = {
        'terreno': terreno, 'luz': luz, 'paredes': paredes, 'folhas': folhas, 'luzes': luzes,
        'tracos': b['tracos'], 'tracosTipo': b.get('tracosTipo') or [None] * len(b['tracos']),
        'interativos': INTERATIVOS, 'sobreposicoes': sobre,
        'fundo': {'nome': 'cripta-talhund.jpg', 'url': '/mapas/fa/cripta-talhund.jpg', 'escala': 100, 'x0': 0, 'y0': 0, 'giro': 0, 'opacidade': 1},
    }
    agua = [{'x': x, 'y': y} for y, l in enumerate(terreno) for x, g in enumerate(l) if g == 'W']
    pontos = {
        # a escada que desce de T20, a leste
        'grupo': [{'x': 42, 'y': 26}, {'x': 42, 'y': 27}, {'x': 39, 'y': 28}, {'x': 40, 'y': 28}],
        'olhar': {'dx': -1, 'dy': 0},
        'escada': [{'x': 42, 'y': 25}, {'x': 43, 'y': 25}, {'x': 42, 'y': 26}],
        # P1: os quatro guardiões, cada um saindo do seu sarcófago
        'sarcofagosP1': [{'x': 33, 'y': 24}, {'x': 36, 'y': 24}, {'x': 33, 'y': 30}, {'x': 36, 'y': 30}],
        'revenantsP1': [{'x': 33, 'y': 25}, {'x': 36, 'y': 25}, {'x': 33, 'y': 29}, {'x': 36, 'y': 29}],
        'estatuasP1': [{'x': 34, 'y': 24}, {'x': 34, 'y': 30}],
        'saidaOesteP1': [{'x': 31, 'y': 28}, {'x': 31, 'y': 29}],
        # P5: a hidra dentro d'água e a água viva no fundo
        'agua': agua,
        'hidra': {'x': 2, 'y': 28}, 'aguaViva': {'x': 6, 'y': 30},
        # P6, P7, P8
        'cranio': {'x': 4, 'y': 20}, 'portaTorta': {'x': 5, 'y': 20},
        'esqueletoSemCabeca': {'x': 7, 'y': 20}, 'estojo': {'x': 8, 'y': 21},
        'golem': {'x': 5, 'y': 9},
        'corposP8': [{'x': 5, 'y': 7}, {'x': 6, 'y': 11}],
        # P9 e P10
        'rivibiddel': {'x': 13, 'y': 22}, 'alavancaP9': {'x': 15, 'y': 22}, 'sarcofagoP9': {'x': 14, 'y': 21},
        'fundadora': {'x': 11, 'y': 15}, 'sarcofagoP10': {'x': 11, 'y': 14},
        # P11 e P12: a estátua, e de onde saem os catorze
        'estatuaP11': {'x': 18, 'y': 10},
        'lajesP12': [{'x': 9 + (k % 2) * 3, 'y': 4 + k // 2} for k in range(14)],
        # P13: os três fantasmas e a alavanca
        'fantasmas': [{'x': 17, 'y': 4}, {'x': 16, 'y': 5}, {'x': 18, 'y': 5}], 'alavancaP13': {'x': 19, 'y': 4}, 'lajeDaGeneral': {'x': 17, 'y': 3},
        # P14: os três wraiths e a esmeralda
        'wraiths': [{'x': 19, 'y': 16}, {'x': 22, 'y': 16}, {'x': 20, 'y': 20}], 'esmeralda': {'x': 20, 'y': 18},
        'anel': {k: [{'x': x, 'y': y} for x, y in v] for k, v in anel.items()},
        'paredeQueDesliza': [{'x': x, 'y': y} for x, y in parede_que_desliza],
        'arestasDoGiro': [[{'x': a[0], 'y': a[1]}, {'x': b_[0], 'y': b_[1]}] for a, b_ in arestas_do_giro],
        'arestasDaParede': [[{'x': a[0], 'y': a[1]}, {'x': b_[0], 'y': b_[1]}] for a, b_ in arestas_da_parede],
        # P15: os seis guardas caídos
        'revenantsP15': [{'x': 24, 'y': 9}, {'x': 26, 'y': 9}, {'x': 28, 'y': 9}, {'x': 24, 'y': 11}, {'x': 26, 'y': 11}, {'x': 28, 'y': 11}],
        # P16: a assombração na porta de P17
        'portaP17': {'x': 31, 'y': 18},
        # P17: a múmia e o guardião
        'mumia': {'x': 33, 'y': 12}, 'guardiao': {'x': 33, 'y': 13}, 'projetos': {'x': 32, 'y': 16},
        # P18: o fragmento, e os sete entalhes de onde saem os espectros
        'fragmento': {'x': 38, 'y': 14},
        'entalhesP18': [{'x': 36, 'y': 13}, {'x': 40, 'y': 13}, {'x': 36, 'y': 16}, {'x': 40, 'y': 16}, {'x': 36, 'y': 19}, {'x': 40, 'y': 19}, {'x': 38, 'y': 21}],
        # P3: a armadura funerária, na sala oeste
        'armaduraFuneraria': {'x': 12, 'y': 26}, 'bacias': [{'x': 14, 'y': 26}, {'x': 20, 'y': 26}, {'x': 27, 'y': 26}],
        'secretas': secretas,
        'salas': salas,
    }
    return mapa, pontos


INTERATIVOS = [
    Z.obj(34, 27, 'lajeDoPatamar', 'Olhar a laje do patamar', 'Uma laje enorme no meio do patamar, gravada com montanhas e gemas. As letras anãs da '
          'borda pedem silêncio a quem desce.'),
    Z.obj(14, 28, 'procissao', 'Olhar o entalhe da procissão', 'Na parede sul, sacerdotes em fila levam corpos enrolados em pano. Os rostos dos '
          'sacerdotes foram raspados, todos, com alguma coisa afiada.'),
    Z.obj(14, 26, 'baciaDePomes', 'Olhar a bacia', 'Uma bacia funda cheia de pedras-pomes, gastas de tanto esfregar. Aqui se lavavam os mortos.'),
    Z.obj(20, 26, 'baciaVazia', 'Olhar a bacia', 'Uma bacia funda, vazia. Marcas redondas no fundo, dezenas delas: aqui havia gemas, e alguém as levou.',
          'investigar', 12, 'Quem as levou não usou as mãos: as marcas são de arrancar, de fora para dentro, como se as gemas tivessem sido puxadas pela mente.'),
    Z.obj(16, 4, 'lajesDaGeneral', 'Olhar as lajes', 'Três lajes, a do meio mais ornada. Na parede, uma anã de elmo puxa uma fileira de guerreiros contra '
          'gigantes, e os gigantes fogem.'),
    Z.obj(29, 9, 'nichosAbencoados', 'Olhar os nichos', 'Catorze nichos com sarcófagos, e em cada tampa um sacerdote de mãos postas que brilha fraco, '
          'como brasa debaixo da cinza.'),
    Z.obj(32, 16, 'projetos', 'Olhar os entalhes das paredes', 'As paredes inteiras são plantas: cada sala da cripta, cada passagem, cada porta — '
          'inclusive as que não parecem portas.', 'investigar', 10,
          'Estudando os entalhes, dá para achar toda porta secreta da cripta: há uma em cada uma das três salas que encostam no santuário redondo.'),
    Z.obj(13, 21, 'paredesDeLivros', 'Olhar as paredes', 'Livros abertos entalhados na pedra, de cima a baixo, com letra miúda: a obra do historiador, '
          'copiada pelos alunos. Mais fábula que história.'),
    # o que o livro descreve e a cena não usa em roteiro (revisão de 2026-11-13: a cripta era magra para olhar)
    Z.obj(37, 24, 'estatuasDoPatamar', 'Olhar as estátuas', 'Entre cada par de sarcófagos, um guerreiro anão de pedra, de pé, '
          'rachado do elmo às botas.'),
    Z.obj(15, 10, 'entalhesDeBatalha', 'Olhar os entalhes', 'Anões lutando por todas as paredes: contra gigantes, contra orcs, '
          'contra coisas que o entalhador nem sabia desenhar direito. Só a parede leste é lisa, lisa até demais.'),
    Z.obj(11, 6, 'lajesVazias', 'Olhar as lajes', 'Catorze lajes com o vão de um guerreiro deitado, e nenhuma ocupada. Nas paredes, '
          'sacerdotes de machado em punho, com um fogo claro saindo das mãos.'),
    Z.obj(28, 17, 'picosEntalhados', 'Olhar os entalhes', 'Picos de montanha enormes entalhados na parede, cada um em cima de uma '
          'gema pequena encravada na pedra.'),
    Z.obj(40, 17, 'mineirosEntalhados', 'Olhar os entalhes', 'Sete mineiros anões de picareta erguida, em tamanho natural.',
          'investigar', 12, 'Cada entalhe é uma tampa: atrás dele há um nicho, e no nicho um mineiro que virou sacerdote, os mais '
          'venerados de todos os Talhund.', 'Os sete mineiros'),
]


def main():
    um = lambda v: json.dumps(v, ensure_ascii=False, separators=(', ', ': '))
    mapa, pontos = montar()
    prova = {k: v for k, v in pontos.items() if k in ('grupo', 'revenantsP1', 'golem', 'rivibiddel', 'fundadora', 'fantasmas', 'wraiths', 'revenantsP15',
                                                     'mumia', 'guardiao', 'esqueletoSemCabeca')}
    aberto = json.loads(json.dumps(mapa))
    for lado in ('n', 'o'):
        aberto['paredes'][lado] = [l.replace('+', '/') for l in aberto['paredes'][lado]]
    for s_ in pontos['secretas'].values():
        Z.por_aresta(aberto['paredes'], (s_['a']['x'], s_['a']['y']), (s_['b']['x'], s_['b']['y']), '/')
    Z.por_aresta(aberto['paredes'], (21, 24), (21, 25), '/')
    t = [list(l) for l in aberto['terreno']]
    for cs in pontos['anel'].values():
        for c in cs:
            t[c['y']][c['x']] = 'L'
    for c in pontos['paredeQueDesliza']:
        t[c['y']][c['x']] = 'L'
    for a_, b_ in pontos['arestasDoGiro'] + pontos['arestasDaParede']:
        Z.por_aresta(aberto['paredes'], (a_['x'], a_['y']), (b_['x'], b_['y']), '/')
    aberto['terreno'] = [''.join(l) for l in t]
    V.provas('CRIPTA', aberto, prova, {'golem': 2, 'guardiao': 2})
    linhas = ['export const MAPA_CRIPTA = {']
    for k, v in mapa.items():
        if isinstance(v, list) and v and isinstance(v[0], str):
            linhas.append(f'  {k}: [\n' + ''.join(f'    {um(l)},\n' for l in v) + '  ],')
        elif k == 'paredes':
            linhas.append('  paredes: {\n' + ''.join(f'    {lado}: [\n' + ''.join(f'      {um(l)},\n' for l in v[lado]) + '    ],\n' for lado in ('n', 'o')) + '  },')
        elif k in ('interativos', 'folhas', 'luzes', 'sobreposicoes'):
            linhas.append(f'  {k}: [\n' + ''.join(f'    {um(t_)},\n' for t_ in v) + '  ],')
        else:
            linhas.append(f'  {k}: {um(v)},')
    linhas.append('};')
    cab = ('// A CRIPTA DOS TALHUND (o Obelisco, capítulo 6), sobre o battlemap da Forgotten Adventures.\n'
           '// GERADO por `src/dev/mapa-cripta-talhund.py` — mude lá e rode de novo.\n')
    with open(SAIDA, 'w', encoding='utf-8', newline='\n') as f:
        f.write(cab + '\n' + '\n'.join(linhas) + '\n\nexport const PONTOS_CRIPTA = ' + um(pontos) + ';\n')
    print('agua:', len(pontos['agua']), 'salas:', {k: len(v) for k, v in pontos['salas'].items()})
    print(f'escrito: {SAIDA}')


if __name__ == '__main__':
    main()
