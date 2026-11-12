# -*- coding: utf-8 -*-
"""
AS TRÊS FENDAS DE ILLITHINOCH (o Obelisco, capítulo 7): pedaços do Reino Distante atrás dos rasgos de X4, X5 e X10, cada
um com a runa que escora o portal de X16 e o gnawble que nasce dela. Sobre os battlemaps da Forgotten Adventures; as
cenas do Foundry são as do repositório público da FA (`mapas/_cenas/`), importadas por `importar-foundry.py ... --editor
src/dev/_tmp/<nome>.json` (trincheiras, oco-da-desova, labirinto-dos-olhos).

  as TRINCHEIRAS DE ALIMENTAÇÃO (32 x 22), de X4: a entrada dos sulcos (F1) com o rasgo no alto à direita, o refeitório das
      três calhas (F2), a bacia da cascata (F3) e os três tanques com o nicho da runa (F4);
  o OCO DA DESOVA (33 x 25), de X5: a caverna de entrada (S1) com o rasgo à direita e os dois glifos nas duas passagens, o
      funil do redemoinho (S2), a câmara do vórtice (S3) embaixo à esquerda e o nicho da runa (S4);
  o LABIRINTO DOS OLHOS (51 x 38), de X10: a câmara do olhar (L1) com o rasgo embaixo, a ESFERA QUE ROLA no meio (L3), os
      becos (L2 a ocular, L4 o ladrão, L5 o vidro, L6 a runa) e o covil do Golcuus (L7) em cima à direita.

O CHÃO SAI DA GEOMETRIA DAS PAREDES (como no túnel e em Illithinoch): a parede etérea da FA (as escadas) e as portas não
contam, e a casa coberta pela inundação é chão.

A ESFERA DO LABIRINTO tem DUAS configurações, e a cena do Foundry traz as duas: as paredes ligadas com a marca do módulo
(`EntranceWalls1`) e as desligadas (a segunda). Aqui as duas viram listas de ARESTA (o labirinto é todo em linhas de
grade), e o roteiro troca uma pela outra quando o grupo gira a esfera (`fendas.js`); a arte do olho girado é a peça da
FA, girada 90 graus, que acende junto (`labirinto-olho-girado.webp`, fora do repositório).

Rode: python src/dev/mapa-fendas.py   (escreve `src/game/fendas-mapas.js` depois das provas no motor)
"""
import importlib.util
import json
import math
import os

import numpy as np
from PIL import Image, ImageDraw

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SAIDA = os.path.join(RAIZ, 'src', 'game', 'fendas-mapas.js')


def _carregar(nome):
    spec = importlib.util.spec_from_file_location(nome.replace('-', '_'), os.path.join(RAIZ, 'src', 'dev', nome + '.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


Z = _carregar('mapa-zorzula')          # obj, luzes_da_fa, fundo, peca, por_aresta
V = _carregar('mapa-cap5-vila-fa')     # provas
E = _carregar('mapa-encruzilhada')     # alcancaveis

SUB = 20
COBRE = 0.35
LIVRES = set('_xVWl')


def importado(nome):
    return json.load(open(os.path.join(RAIZ, 'src', 'dev', '_tmp', f'{nome}.json'), encoding='utf-8'))


def inundar(w, h, segmentos, sementes):
    im = Image.new('L', (w * SUB, h * SUB), 0)
    d = ImageDraw.Draw(im)
    for t in segmentos:
        d.line([(x * SUB, y * SUB) for x, y in t], fill=255, width=3)
    for sx, sy in sementes:
        if im.getpixel((sx * SUB + SUB // 2, sy * SUB + SUB // 2)) == 0:
            ImageDraw.floodfill(im, (sx * SUB + SUB // 2, sy * SUB + SUB // 2), 128)
    a = np.asarray(im)
    return {(x, y) for y in range(h) for x in range(w) if (a[y * SUB:(y + 1) * SUB, x * SUB:(x + 1) * SUB] == 128).mean() >= COBRE}


def base(nome, sementes, segmentos_extra=()):
    b = importado(nome)
    w, h = len(b['terreno'][0]), len(b['terreno'])
    tipos = b.get('tracosTipo') or [None] * len(b['tracos'])
    paredes_que_barram = [t for t, tp in zip(b['tracos'], tipos) if tp not in ('+', 'E')]
    chao = set()
    for extra in segmentos_extra or [[]]:
        chao |= inundar(w, h, paredes_que_barram + list(extra), sementes)
    terreno = [['_' if (x, y) in chao else 'R' for x in range(w)] for y in range(h)]
    luzes = Z.luzes_da_fa(b)
    for l in luzes:
        l['semChama'] = True
        l['tipo'] = 'magia'
    mapa = {
        'terreno': terreno, 'luz': ['1' * w for _ in range(h)],
        'paredes': {lado: list(b['paredes'][lado]) for lado in ('n', 'o')},
        'tracos': b['tracos'], 'tracosTipo': tipos, 'luzes': luzes, 'fundo': Z.fundo(nome), 'interativos': [],
    }
    return mapa, b


def salas_de(terreno, retangulos):
    salas = {}
    for y, l in enumerate(terreno):
        for x, g in enumerate(l):
            if g not in LIVRES:
                continue
            for sid, (x0, y0, x1, y1) in retangulos:
                if x0 <= x <= x1 and y0 <= y <= y1:
                    salas.setdefault(sid, []).append({'x': x, 'y': y})
                    break
    return salas


# ------------------------------------------------------------------------------------- as trincheiras ----
def trincheiras():
    m, b = base('trincheiras', [(23, 4)])
    t = m['terreno']
    # F4: os três tanques rasos (cada um com um nothic de bruços), num bloco de 4x2 casas com borda de metal: não se
    # entra, vê-se por cima, e a borda dá cobertura ('B', a mesma regra da banheira). Os tanques ficam na linha entre as
    # fileiras 16 e 17 da arte, e não em cima da 16.
    for x in range(10, 14):
        for y in (16, 17):
            t[y][x] = 'B'
    m['interativos'] = [
        Z.obj(23, 6, 'sulcosDeGosma', 'Olhar os sulcos', 'Dois sulcos atravessam a caverna e somem em túneis separados. Por eles '
              'escorre uma gosma roxa pálida, com cheiro de açúcar queimado, que vai embora por respiros no chão.', 'investigar', 12,
              'É o resto das calhas, sem gosto e sem nada que alimente. Fede, mas não faz mal.'),
        Z.obj(9, 7, 'calhas', 'Olhar as calhas', 'Três calhas compridas cheias de uma gosma roxa, alimentadas por uma poça no fim de '
              'uma passagem íngreme. Cheiro doce. No teto, uma abertura de um metro, de pele enrugada, fechada como uma pálpebra.'),
        Z.obj(19, 16, 'bacia', 'Olhar a bacia', 'Uma cascata de gosma roxa cai do alto numa bacia que alimenta a calha da sala. No '
              'fundo da bacia, alguma coisa quadrada.'),
        Z.obj(12, 17, 'tanques', 'Olhar os tanques', 'Três tanques rasos. Em cada um, um corpo espinhoso de bruços, boiando: nothics.'),
        Z.obj(12, 13, 'nichoDaRuna', 'Olhar o nicho', 'Num nicho da parede, uma runa tão apagada que não se lê a forma. Dela pende uma bola '
              'de pelo do tamanho de um coco, com uma boca cheia de dentes.'),
    ]
    m['terreno'] = [''.join(l) for l in t]
    pontos = {
        'grupo': [{'x': 23, 'y': 3}, {'x': 22, 'y': 4}, {'x': 24, 'y': 4}, {'x': 23, 'y': 5}], 'olhar': {'dx': 0, 'dy': 1},
        'rasgo': {'x': 23, 'y': 2},
        'grellsF2': [{'x': 8, 'y': 6}, {'x': 10, 'y': 8}, {'x': 12, 'y': 5}],
        'naruv': {'x': 22, 'y': 16}, 'grellF3': {'x': 24, 'y': 17},
        'bau': {'x': 19, 'y': 16}, 'bashudu': {'x': 12, 'y': 17}, 'runa': {'x': 12, 'y': 13},
    }
    return m, pontos, [('F1', (18, 2, 29, 12)), ('F2', (1, 2, 17, 12)), ('F4', (6, 13, 15, 19)), ('F3', (16, 13, 31, 19))]


# ------------------------------------------------------------------------------------- o oco da desova ----
def oco():
    m, b = base('oco-da-desova', [(28, 18)])
    t = m['terreno']
    # S2: o redemoinho, no ponto mais baixo do funil (água muito salgada, 1,5 m de fundo)
    t[5][18] = 'W'
    m['interativos'] = [
        Z.obj(25, 16, 'carneQueMigra', 'Olhar as paredes', 'Tudo aqui é carne áspera de verruga, dura como pedra, que range quando se '
              'pisa. Dela vem um barulho de chapinhar.', 'percepcao', 15, 'As paredes andam. Devagar, quase nada, tudo escorre do '
              'funil ao norte para o fundo do oco, a oeste.'),
        Z.obj(17, 6, 'redemoinho', 'Olhar o redemoinho', 'No fundo do funil, um redemoinho de água salgada, da largura de um homem. A '
              'carne do chão parece nascer da borda dele.'),
        Z.obj(5, 19, 'vortice', 'Olhar o vórtice', 'Num nicho junto ao teto, um vórtice de carne gira devagar, e as verrugas das paredes '
              'estão ligadas a ele por linhas de giz.'),
        Z.obj(10, 15, 'nichoDaRuna', 'Olhar o nicho', 'O único pedaço de carne que não se mexe, como uma pedra num rio. Numa runa apagada, '
              'uma bola de pelo rosado com uma boca de dentes.'),
    ]
    m['terreno'] = [''.join(l) for l in t]
    pontos = {
        'grupo': [{'x': 29, 'y': 18}, {'x': 28, 'y': 18}, {'x': 27, 'y': 18}, {'x': 28, 'y': 19}], 'olhar': {'dx': -1, 'dy': 0},
        'rasgo': {'x': 30, 'y': 18},
        'girinos': [{'x': x, 'y': y} for x, y in [(14, 4), (16, 3), (20, 4), (22, 6), (15, 7), (19, 8), (13, 6), (24, 5), (21, 8), (17, 8), (23, 7), (25, 6)]],
        'slaadVermelho': {'x': 19, 'y': 6},
        'chalaag': {'x': 8, 'y': 19}, 'vortice': {'x': 4, 'y': 21}, 'redemoinho': {'x': 18, 'y': 5},
        'runa': {'x': 10, 'y': 15},
        # os dois glifos, um em cada passagem de S1 (as peças "Trap" da FA)
        'glifoOeste': {'x': 18, 'y': 18}, 'glifoNorte': {'x': 26, 'y': 11},
    }
    return m, pontos, [('S4', (9, 13, 13, 16)), ('S2', (10, 1, 31, 12)), ('S1', (20, 13, 31, 21)), ('S3', (2, 16, 16, 22)),
                       ('passagem', (0, 0, 32, 24))]


# ------------------------------------------------------------------------------------- o labirinto ----
def segmentos_da_esfera():
    d = json.load(open(os.path.join(RAIZ, 'mapas', '_cenas', 'labyrinth-of-eyes-51x38.json'), encoding='utf-8'))
    ox, oy = 1300, 1000
    c1, c2 = [], []
    for w in d['walls']:
        desligada = w.get('move', 20) == 0 and w.get('sight', 20) == 0
        marcada = 'tagger' in (w.get('flags') or {})
        if not (marcada or desligada):
            continue
        c = w['c']
        seg = [((c[0] - ox) / 100, (c[1] - oy) / 100), ((c[2] - ox) / 100, (c[3] - oy) / 100)]
        (c2 if desligada else c1).append(seg)
    return c1, c2


def arestas_de(segs):
    """O segmento da FA, quase todo em linha de grade, vira as arestas de casa que ele cobre (o arco da borda da esfera
    se ajusta à linha mais perto)."""
    out = set()
    for (x0, y0), (x1, y1) in segs:
        if abs(x1 - x0) < abs(y1 - y0):
            x = round((x0 + x1) / 2)
            for y in range(math.floor(min(y0, y1) + 0.01), math.ceil(max(y0, y1) - 0.01)):
                out.add((x, y, 'o'))
        else:
            y = round((y0 + y1) / 2)
            for x in range(math.floor(min(x0, x1) + 0.01), math.ceil(max(x0, x1) - 0.01)):
                out.add((x, y, 'n'))
    return out


def labirinto():
    c1, c2 = segmentos_da_esfera()
    # o chão é o da inundação SEM as paredes da esfera (com elas, cada configuração esconde uma metade)
    m, b = base('labirinto-dos-olhos', [(26, 35), (43, 8), (7, 10), (41, 20), (30, 6), (27, 12), (27, 17), (27, 22), (22, 17), (32, 17)])
    t = m['terreno']
    # o traço que fica é só o fixo (as duas configurações da esfera viram arestas que o roteiro troca)
    fixos = [(tr, tp) for tr, tp in zip(b['tracos'], m['tracosTipo'])
             if not any(abs(tr[0][0] - s[0][0]) < 0.05 and abs(tr[0][1] - s[0][1]) < 0.05 for s in c1)]
    m['tracos'], m['tracosTipo'] = [tr for tr, _ in fixos], [tp for _, tp in fixos]
    # as paredes de aresta: só as que os traços fixos derivam se refazem no motor; aqui entram as da configuração 1
    e1, e2 = arestas_de(c1), arestas_de(c2)
    m['paredes'] = {lado: ['.' * len(t[0]) for _ in t] for lado in ('n', 'o')}
    for x, y, lado in e1:
        linha = m['paredes'][lado][y]
        m['paredes'][lado][y] = linha[:x] + '#' + linha[x + 1:]
    # L5: o vidro quebrado da galeria do Golcuus (terreno difícil)
    for x, y in [(29, 6), (30, 6), (31, 6), (32, 6)]:
        if t[y][x] == '_':
            t[y][x] = 'x'
    m['interativos'] = [
        Z.obj(26, 33, 'olhosQuePiscam', 'Olhar as paredes', 'As paredes de pedra úmida estão cheias de olhos, centenas, que piscam fora '
              'de tempo. Quando alguém anda para uma das saídas, todos se viram para ele de uma vez.'),
        Z.obj(41, 20, 'ocular', 'Olhar as hastes', 'Dez hastes de pedra saem da parede do fundo. Nove estão quebradas; a décima termina '
              'num copo do tamanho de um olho, e o chão em volta está manchado de rosa.'),
        Z.obj(7, 26, 'ladraoMorto', 'Olhar o cadáver', 'Um corpo seco, de couro rachado, encostado no fim do beco: um githyanki, pelo '
              'formato da cabeça, morto há anos. No cinto, cabos de cristal.', 'percepcao', 15, 'Os braços e as pernas estão menos '
              'secos que a cabeça e o peito, como se alguma coisa ainda corresse por eles.'),
        Z.obj(30, 6, 'vidroQuebrado', 'Olhar o vidro', 'Um monte de vidro colorido quebrado, cacos de vitrais e de esculturas, varridos '
              'para o fundo do beco num acesso de raiva.'),
        Z.obj(7, 10, 'nichoDaRuna', 'Olhar o fim do beco', 'O teto desce até a altura do peito. Lá no fundo, pendurada numa runa apagada, '
              'uma bola de pelo roxo com uma boca de dentes.'),
        Z.obj(44, 6, 'nichosDoGolcuus', 'Olhar os nichos', 'Três nichos rasos com mesas e ferramentas quebradas, separados por paredes '
              'finas de pedra.'),
    ]
    m['terreno'] = [''.join(l) for l in t]
    m['sobreposicoes'] = [Z.peca('olhoGirado', 'labirinto-olho-girado', 19, 9, 16, 16)]
    m['sobreposicoes'][0]['url'] = m['sobreposicoes'][0]['url'].replace('.jpg', '.webp')
    pontos = {
        'grupo': [{'x': 26, 'y': 35}, {'x': 27, 'y': 35}, {'x': 26, 'y': 34}, {'x': 27, 'y': 34}], 'olhar': {'dx': 0, 'dy': -1},
        'rasgo': {'x': 26, 'y': 36},
        'golcuus': {'x': 43, 'y': 8}, 'ocular': {'x': 41, 'y': 20}, 'ladrao': {'x': 7, 'y': 26}, 'runa': {'x': 7, 'y': 10},
        'vidro': {'x': 30, 'y': 6},
        'esfera': {'x': 27, 'y': 17},
        'config1': [{'x': x, 'y': y, 'l': l} for x, y, l in sorted(e1)],
        'config2': [{'x': x, 'y': y, 'l': l} for x, y, l in sorted(e2)],
    }
    return m, pontos, [('L3', (20, 10, 34, 24)), ('L7', (36, 2, 49, 11)), ('L6', (5, 9, 9, 11)), ('L2', (39, 17, 43, 23)),
                       ('L4', (5, 23, 10, 29)), ('L5', (27, 5, 34, 7)), ('L1', (20, 30, 34, 36)), ('corredor', (0, 0, 50, 37))]


def ilhas_viram_rocha(mapa, alcancadas):
    """A casa de chão que o motor não alcança de lugar nenhum vira rocha. A inundação pela geometria deixa casas soltas
    na borda da caverna (mais de 35% coberta por dentro, mas fechada pelas arestas que o traço deriva), e o
    `conferir-paredes` as acusa: ninguém pisa nelas, então não são chão."""
    t = [list(l) for l in mapa['terreno']]
    viraram = 0
    for y, l in enumerate(t):
        for x, g in enumerate(l):
            if g in LIVRES and f'{x},{y}' not in alcancadas:
                t[y][x] = 'R'
                viraram += 1
    mapa['terreno'] = [''.join(l) for l in t]
    return viraram


def girado(mapa, pontos):
    """O mapa com a esfera na segunda configuração (para provar que a metade de cima se alcança girando)."""
    m = json.loads(json.dumps(mapa))
    for q in pontos['config1']:
        linha = m['paredes'][q['l']][q['y']]
        m['paredes'][q['l']][q['y']] = linha[:q['x']] + '.' + linha[q['x'] + 1:]
    for q in pontos['config2']:
        linha = m['paredes'][q['l']][q['y']]
        m['paredes'][q['l']][q['y']] = linha[:q['x']] + '#' + linha[q['x'] + 1:]
    return m


def main():
    um = lambda v: json.dumps(v, ensure_ascii=False, separators=(', ', ': '))
    saida = ['// AS TRÊS FENDAS DE ILLITHINOCH (o Obelisco, capítulo 7), sobre os battlemaps da Forgotten Adventures.',
             '// GERADO por `src/dev/mapa-fendas.py` — mude lá e rode de novo.', '']
    tudo = {}
    for chave, fn in (('TRINCHEIRAS', trincheiras), ('OCO_DA_DESOVA', oco), ('LABIRINTO_DOS_OLHOS', labirinto)):
        mapa, pontos, retangulos = fn()
        # o chão é o que se alcança; no labirinto, com a esfera ABERTA (as arestas das duas configurações tiradas), que é
        # a soma do que se alcança girando
        aberto = json.loads(json.dumps(mapa))
        for q in pontos.get('config1', []):
            linha = aberto['paredes'][q['l']][q['y']]
            aberto['paredes'][q['l']][q['y']] = linha[:q['x']] + '.' + linha[q['x'] + 1:]
        print(f'  {chave}: {ilhas_viram_rocha(mapa, E.alcancaveis(aberto, pontos["grupo"][0]))} casa(s) solta(s) de chão viraram rocha')
        pontos['salas'] = salas_de(mapa['terreno'], retangulos)
        prova = {k: v for k, v in pontos.items() if k not in ('salas', 'olhar', 'config1', 'config2', 'esfera', 'rasgo', 'glifoOeste', 'glifoNorte', 'redemoinho', 'vortice', 'bashudu')}
        if chave == 'TRINCHEIRAS':
            # o Bashudu está NO tanque do meio, que não se entra; mexe-se nele da borda
            assert '12,18' in E.alcancaveis(mapa, pontos['grupo'][0]), 'a borda do tanque do meio não se alcança'
        if chave == 'LABIRINTO_DOS_OLHOS':
            # do rasgo, a metade de baixo com a esfera parada; a de cima (a runa, o Golcuus, a ocular) girando a esfera
            # A TRAVESSIA: com a esfera parada, do rasgo à borda dela; girada, dali à parte de cima do olho; parada de novo,
            # de lá ao norte (a runa e o Golcuus). Sem girar, o norte não se alcança.
            a = E.alcancaveis(mapa, pontos['grupo'][0])
            gir = girado(mapa, pontos)
            borda = [q for q in a if 19 <= int(q.split(',')[0]) <= 35 and 9 <= int(q.split(',')[1]) <= 25]
            b = set()
            for q in borda[::3]:
                if q not in b:
                    x, y = map(int, q.split(','))
                    b |= E.alcancaveis(gir, {'x': x, 'y': y})
            c = set()
            for q in list(b - a)[::4]:
                if q not in c:
                    x, y = map(int, q.split(','))
                    c |= E.alcancaveis(mapa, {'x': x, 'y': y})
            for k in ('runa', 'golcuus', 'vidro'):
                q = f"{pontos[k]['x']},{pontos[k]['y']}"
                assert q in c, f'girando a esfera, não se chega a {k}'
                assert q not in a, f'{k} se alcança do rasgo sem girar a esfera'
            for k in ('ladrao', 'ocular'):
                assert f"{pontos[k]['x']},{pontos[k]['y']}" in a, f'{k} não se alcança do rasgo'
            print('  LABIRINTO: sem girar, o norte não se alcança; girando e voltando, chega-se à runa e ao Golcuus')
        else:
            V.provas(chave, mapa, prova, {'slaadVermelho': 2, 'chalaag': 2})
        print(f'{chave}: salas ' + ', '.join(f'{k} {len(v)}' for k, v in pontos['salas'].items()))
        tudo[chave] = pontos
        linhas = [f'export const MAPA_{chave} = {{']
        for k, v in mapa.items():
            if isinstance(v, list) and v and isinstance(v[0], str):
                linhas.append(f'  {k}: [\n' + ''.join(f'    {um(l)},\n' for l in v) + '  ],')
            elif k == 'paredes':
                linhas.append('  paredes: {\n' + ''.join(f'    {lado}: [\n' + ''.join(f'      {um(l)},\n' for l in v[lado]) + '    ],\n' for lado in ('n', 'o')) + '  },')
            elif k in ('interativos', 'luzes', 'tracos', 'sobreposicoes'):
                linhas.append(f'  {k}: [\n' + ''.join(f'    {um(t)},\n' for t in v) + '  ],')
            else:
                linhas.append(f'  {k}: {um(v)},')
        linhas.append('};')
        saida += linhas + ['']
    saida.append('export const PONTOS_FENDAS = ' + um(tudo) + ';')
    with open(SAIDA, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(saida) + '\n')
    print(f'escrito: {SAIDA}')


if __name__ == '__main__':
    main()
