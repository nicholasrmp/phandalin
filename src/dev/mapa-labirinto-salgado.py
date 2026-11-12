# -*- coding: utf-8 -*-
"""
O LABIRINTO SALGADO (o Obelisco, capítulo 8): o domínio de Ilvaash, em forma de cérebro, do outro lado do portal de
Illithinoch, sobre o battlemap da Forgotten Adventures ("Briny Maze", 66 x 80) e o covil do dragão à parte (15 x 15). As
cenas do Foundry são as do repositório público da FA (`mapas/_cenas/`, fora do repositório), importadas por:

    python src/dev/importar-foundry.py mapas/_cenas/briny-maze-66x80.json public/mapas/fa/labirinto-salgado.jpg \\
        --editor src/dev/_tmp/labirinto-salgado.json
    python src/dev/importar-foundry.py mapas/_cenas/briny-maze-dragons-den-15x15.json public/mapas/fa/covil-lowarnizel.jpg \\
        --editor src/dev/_tmp/covil-lowarnizel.json

O CHÃO SAI DA GEOMETRIA DAS PAREDES (o mesmo de Illithinoch e das fendas): as paredes da FA se desenham numa grade fina, a
inundação sai de cada sala, e a casa coberta é chão.

AS SALAS vêm do MAPA DO LIVRO (o 8.1, com os rótulos B1 a B22, em `_referencias/obelisco58/mapas/`, fora do repositório),
casado com a grade da FA pela fenda do meio e pelas três portas: a da frente em y 18, a central em y 36, a traseira em
y 50, e o que cada sala tem no desenho caiu onde o livro o põe (os bastões de B7 no nicho junto de B14, o buraco de B16 na
linha etérea da FA, as cabeças de B4 na parede curva). Cada casa de chão é da sala cujo rótulo está mais perto ANDANDO,
com todas as portas abertas.

AS PORTAS MENTAIS (as três da fenda) e a PASSAGEM SECRETA de B11 ("S" no mapa do livro) nascem FECHADAS, como parede: a
cena as abre (`labirinto-salgado.js`). A FA as desenhava como portas comuns, que o menu de porta abriria com a mão.

Rode: python src/dev/mapa-labirinto-salgado.py   (escreve `src/game/labirinto-salgado-mapa.js` depois das provas)
"""
import importlib.util
import json
import os

import numpy as np
from PIL import Image, ImageDraw

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SAIDA = os.path.join(RAIZ, 'src', 'game', 'labirinto-salgado-mapa.js')


def _carregar(nome):
    spec = importlib.util.spec_from_file_location(nome.replace('-', '_'), os.path.join(RAIZ, 'src', 'dev', nome + '.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


Z = _carregar('mapa-zorzula')          # obj, luzes_da_fa, fundo
V = _carregar('mapa-cap5-vila-fa')     # provas
E = _carregar('mapa-encruzilhada')     # alcancaveis

SUB = 20
COBRE = 0.35
LIVRES = set('_V')

# O RÓTULO DE CADA SALA, na grade da FA (lido do mapa 8.1 do livro), e o LOBO do cérebro a que ela pertence
ROTULOS = {
    'B1': (33, 71), 'B2': (14, 59), 'B3': (26, 62), 'B4': (53, 58), 'B5': (40, 61), 'B6': (55, 50), 'B7': (49, 43),
    'B8': (59, 37), 'B9': (56, 25), 'B10': (6, 52), 'B11': (5, 31), 'B12': (11, 34), 'B13': (26, 49), 'B14': (39, 47),
    'B15': (43, 30), 'B16': (52, 18), 'B18': (40, 13), 'B19': (25, 32), 'B20': (19, 21), 'B21': (12, 14), 'B22': (26, 17),
}
LOBO = {**{s: 'occipital' for s in ('B1', 'B2', 'B3', 'B4', 'B5')}, 'B6': 'temporal', 'B10': 'temporal',
        **{s: 'parietal' for s in ('B7', 'B8', 'B9', 'B11', 'B12', 'B13')},
        **{s: 'frontal' for s in ('B14', 'B15', 'B16', 'B18', 'B19', 'B20', 'B21', 'B22')}}

DIREITA = {'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B14', 'B15', 'B16', 'B18'}

# AS TRÊS PORTAS MENTAIS, na fenda do meio (aresta oeste da coluna 34): casas de y0 a y1
PORTAS = {'frente': (18, 21), 'central': (36, 39), 'traseira': (50, 53)}
# A PASSAGEM SECRETA de B11: a aresta oeste da casa (6, 43)
SECRETA = {'x': 6, 'y': 43, 'l': 'o'}


def chao_pelas_paredes(b, sementes):
    w, h = len(b['terreno'][0]), len(b['terreno'])
    im = Image.new('L', (w * SUB, h * SUB), 0)
    d = ImageDraw.Draw(im)
    for t, tipo in zip(b['tracos'], b.get('tracosTipo') or [None] * len(b['tracos'])):
        if tipo not in ('+', 'E'):
            d.line([(x * SUB, y * SUB) for x, y in t], fill=255, width=3)
    for sx, sy in sementes:
        if im.getpixel((sx * SUB + SUB // 2, sy * SUB + SUB // 2)) == 0:
            ImageDraw.floodfill(im, (sx * SUB + SUB // 2, sy * SUB + SUB // 2), 128)
    a = np.asarray(im)
    return {(x, y) for y in range(h) for x in range(w) if (a[y * SUB:(y + 1) * SUB, x * SUB:(x + 1) * SUB] == 128).mean() >= COBRE}


def aresta(paredes, x, y, lado, g):
    linha = paredes[lado][y]
    paredes[lado][y] = linha[:x] + g + linha[x + 1:]


def montar():
    b = json.load(open(os.path.join(RAIZ, 'src', 'dev', '_tmp', 'labirinto-salgado.json'), encoding='utf-8'))
    w, h = len(b['terreno'][0]), len(b['terreno'])
    chao = chao_pelas_paredes(b, list(ROTULOS.values()) + [(33, 75)])
    t = [['_' if (x, y) in chao else 'R' for x in range(w)] for y in range(h)]
    # B22: a POÇA SALGADA, uns 18 m de largura (a elipse da arte)
    for y in range(h):
        for x in range(w):
            if t[y][x] == '_' and ((x + 0.5 - 20.2) / 5.6) ** 2 + ((y + 0.5 - 7.9) / 5.2) ** 2 <= 1:
                t[y][x] = 'V'
    # o traço fica, menos as portas (a da FA abriria com a mão) e as duas etéreas (a lona de B15 e a borda do buraco de
    # B16, que só cortam a vista)
    tracos = [tr for tr, tp in zip(b['tracos'], b['tracosTipo']) if tp not in ('+',)]
    tipos = [tp for tp in b['tracosTipo'] if tp not in ('+',)]
    paredes = {lado: list(b['paredes'][lado]) for lado in ('n', 'o')}
    for lado in ('n', 'o'):
        paredes[lado] = [l.replace('+', '#') for l in paredes[lado]]
    for y0, y1 in PORTAS.values():
        for y in range(y0, y1 + 1):
            aresta(paredes, 34, y, 'o', '#')
    aresta(paredes, SECRETA['x'], SECRETA['y'], SECRETA['l'], '#')
    # LUZ PLENA, violeta, sem fonte, em todo o labirinto (o livro)
    luz = ['2' * w for _ in range(h)]
    luzes = Z.luzes_da_fa(b)
    for l in luzes:
        l['semChama'] = True
        l['tipo'] = 'magia'
    terreno = [''.join(l) for l in t]
    # B3: as TEIAS ESPECTRAIS cobrem tudo de leve, e as 4 casas junto da parede do fundo de vez (é onde os ashenwights ficam):
    # ali, o ataque contra quem está dentro tem desvantagem (`mapa.embacado`, o mesmo da sala embaçada da Encruzilhada)
    embacado = [{'x': x, 'y': y} for y in range(58, 69) for x in range(29, 33) if terreno[y][x] == '_']
    interativos = [
        Z.obj(30, 70, 'rastrosDaEntrada', 'Olhar o chão', 'O chão de carne guarda marcas, mas se fecha devagar sobre elas, como pele.',
              'percepcao', 15, 'Muitas criaturas saíram daqui para a esquerda, umas arrastadas: o bando dos fanáticos, com os presos. '
              'Mais tarde, três pares de botas foram para a direita.'),
        Z.obj(14, 58, 'duergarMortos', 'Olhar os corpos', 'Quatro anões de pele cinzenta, de armadura, mortos de arma há meses.',
              'investigar', 12, 'Todos têm a cabeça aberta, e a ferida é de depois da morte: alguma coisa vem roer.'),
        Z.obj(52, 55, 'muroDaSoberba', 'Olhar a parede curva', 'Cinco corpos fundidos na parede até o peito, de boca aberta num grito '
              'parado. Restos de mantos de mago.'),
        Z.obj(38, 58, 'tumorPregado', 'Olhar a bola pregada', 'Uma bola de vísceras do tamanho de um escudo, pregada na parede por uma '
              'espada grande de lâmina prateada e serrilhada. Embaixo, uma poça de gosma.'),
        Z.obj(57, 51, 'sombrasQueDancam', 'Olhar o nicho', 'No escuro de um nicho, sombras dançam sem corpo, no ritmo de uma flauta que '
              'ninguém está tocando.'),
        Z.obj(48, 46, 'bauDosGithyanki', 'Olhar o acampamento', 'Três sacos de dormir em volta de um baú, e dois bastões de metal de dois '
              'palmos saindo da parede do fundo.'),
        Z.obj(59, 37, 'barrileteDoShalfi', 'Olhar o nicho', 'Um saco de dormir imundo e um barrilete. Ninguém dorme aqui há dias.'),
        Z.obj(54, 23, 'buracoDoShalfi', 'Olhar a cova', 'Uma cova rasa num canto, de borda preta como carne morta.'),
        Z.obj(5, 49, 'livroDoJomlus', 'Olhar o livro', 'Um livro enorme aberto sobre um calombo de carne, de letras que parecem se mexer.'),
        Z.obj(4, 30, 'rasgoDosFlumphs', 'Olhar a parede do fundo', 'Um rasgo estreito na parede, por onde se vê um caleidoscópio de cores '
              'que doem. Bolhas sobem de nódulos na carne e estouram no ar.'),
        Z.obj(27, 49, 'restosDeRefeicao', 'Olhar os restos', 'Ossos e pedaços de carne, e farrapos de mantos de culto. Alguém morreu '
              'tentando abrir a porta enorme ao lado.'),
        Z.obj(39, 30, 'lonaDeB15', 'Olhar a lona', 'Uma lona rasgada pende do teto e esconde um quadrado no meio da sala. De dentro vem um '
              'assobio fino de arame esticado, que dá dor de cabeça.'),
        Z.obj(50, 18, 'buracoDeB16', 'Olhar atrás da bancada', 'Atrás da bancada tombada, um buraco de dois metros no chão. Uma corda com '
              'nós, amarrada no pé da bancada, desce para o escuro.'),
        Z.obj(42, 10, 'bauDosColecionadores', 'Olhar o nicho', 'Dois catres e um baú pequeno. Dentro, ferramentas que não servem: '
              'sovelas cegas, um martelo de cabeça presa por corrente, réguas de marcas erradas.'),
        Z.obj(24, 34, 'bibliotecariosMortos', 'Olhar os corpos', 'Três devoradores de mentes mortos no icor escuro, como se tivessem '
              'brigado entre si. Nas paredes, dezenas de cristais embutidos.', 'investigar', 14, 'Foi encenado: furos de tridente e '
              'cortes de machado grande, e nenhuma das armas está aqui.'),
        Z.obj(19, 21, 'cicatriz', 'Olhar a parede', 'A parede do nicho tem nós como cicatriz.', 'investigar', 12, 'Alguém cortou um ponto '
              'mole aqui, até o outro lado, e a carne se fechou. Não se corta de novo.'),
        Z.obj(14, 16, 'escrivaninhaDaAshripask', 'Olhar o nicho', 'Um catre dobrável com peles e uma escrivaninha portátil, e dois bastões '
              'cônicos saindo do chão, um de cada lado, a seis metros um do outro.'),
        Z.obj(31, 11, 'bastoesDaPoca', 'Olhar a poça', 'Uma poça de uns 18 m, de luz verde fraca lá no fundo, e grumos de carne boiando. '
              'Na beira, dois bastões cônicos quase se tocando.'),
    ]
    pontos = {
        'grupo': [{'x': 33, 'y': 74}, {'x': 34, 'y': 74}, {'x': 33, 'y': 73}, {'x': 34, 'y': 73}], 'olhar': {'dx': 0, 'dy': -1},
        'portal': {'x': 33, 'y': 76},
        'capa': {'x': 17, 'y': 56},
        'aranhas': [{'x': 24, 'y': 62}, {'x': 26, 'y': 66}], 'ashenwights': [{'x': 30, 'y': 61}, {'x': 30, 'y': 65}],
        'cabecas': {'x': 52, 'y': 55}, 'cranios': [{'x': 50, 'y': 57}, {'x': 52, 'y': 57}, {'x': 54, 'y': 57}, {'x': 51, 'y': 59}, {'x': 53, 'y': 59}],
        'espada': {'x': 38, 'y': 58},
        'sombras': {'x': 57, 'y': 51},
        'varakkta': {'x': 49, 'y': 43}, 'kianka': {'x': 47, 'y': 44}, 'vazzi': {'x': 50, 'y': 45}, 'bastoesB7': {'x': 45, 'y': 47}, 'bauB7': {'x': 48, 'y': 46},
        'barrilete': {'x': 59, 'y': 37},
        'shalfi': {'x': 55, 'y': 24}, 'jitterjaws': {'x': 57, 'y': 26},
        'jomlus': {'x': 7, 'y': 51}, 'livro': {'x': 5, 'y': 49},
        'flumphs': [{'x': 4, 'y': 27}, {'x': 5, 'y': 29}, {'x': 3, 'y': 33}, {'x': 6, 'y': 35}, {'x': 4, 'y': 24}, {'x': 5, 'y': 37}, {'x': 5, 'y': 33}],
        'rasgo': {'x': 4, 'y': 30},
        'secreta': {'a': {'x': 5, 'y': 43}, 'b': {'x': 6, 'y': 43}},
        'aglomerado': {'x': 11, 'y': 34}, 'gemulas': [{'x': 10, 'y': 32}, {'x': 13, 'y': 33}, {'x': 10, 'y': 36}, {'x': 12, 'y': 37}],
        'restos': {'x': 27, 'y': 49},
        'mublinesh': {'x': 40, 'y': 46}, 'esconderijoDoMublinesh': {'x': 44, 'y': 32},
        'lona': {'x': 39, 'y': 30}, 'arame': [{'x': x, 'y': y} for y in range(28, 32) for x in range(37, 41)],
        'buracoB16': {'x': 50, 'y': 18},
        'nouashu': {'x': 40, 'y': 16}, 'groushim': {'x': 38, 'y': 20}, 'bauB18': {'x': 42, 'y': 10},
        'bibliotecarios': {'x': 24, 'y': 34}, 'cristaisB19': {'x': 20, 'y': 27},
        'cicatriz': {'x': 19, 'y': 21},
        'ashripask': {'x': 13, 'y': 15}, 'bastoesB21': [{'x': 12, 'y': 18}, {'x': 16, 'y': 21}], 'escrivaninha': {'x': 14, 'y': 16},
        'bastoesB22': {'x': 31, 'y': 11}, 'poca': {'x': 20, 'y': 8},
        'portas': {k: [{'a': {'x': 33, 'y': y}, 'b': {'x': 34, 'y': y}} for y in range(y0, y1 + 1)] for k, (y0, y1) in PORTAS.items()},
    }
    mapa = {
        'terreno': terreno, 'luz': luz, 'paredes': paredes, 'tracos': tracos, 'tracosTipo': tipos, 'luzes': luzes,
        'fundo': Z.fundo('labirinto-salgado'), 'interativos': interativos, 'embacado': embacado,
        # as peças da FA que a cena acende: o corpo de B2 sem a capa, e o calombo de B10 sem o livro
        'sobreposicoes': [Z.peca('capaTirada', 'labirinto-capa-tirada', 17, 56, 2, 2), Z.peca('livroTirado', 'labirinto-livro-tirado', 5, 49, 2, 2)],
    }
    return mapa, pontos


def aberto(mapa, quais=('frente', 'central', 'traseira'), secreta=True):
    m = json.loads(json.dumps(mapa))
    for k in quais:
        y0, y1 = PORTAS[k]
        for y in range(y0, y1 + 1):
            aresta(m['paredes'], 34, y, 'o', '.')
    if secreta:
        aresta(m['paredes'], SECRETA['x'], SECRETA['y'], SECRETA['l'], '.')
    return m


def custos(mapa, pontos):
    """O custo de caminhada do motor (`field.reachable`) de cada ponto a cada casa, num processo só."""
    import subprocess
    prog = r'''
import { montarCampo } from 'file:///@BASE@/src/game/campo.js';
const f = montarCampo(JSON.parse(process.env.MAPA));
const out = {};
for (const [k, p] of Object.entries(JSON.parse(process.env.PONTOS))) {
  const r = f.reachable(p, 100000, () => false);
  out[k] = Object.fromEntries([...r.entries()].map(([q, n]) => [q, n.cost]));
}
console.log(JSON.stringify(out));
'''.replace('@BASE@', RAIZ.replace(chr(92), '/'))
    r = subprocess.run(['node', '--import', './src/dev/cena-node/register.mjs', '--input-type=module', '-e', prog], cwd=RAIZ,
                       capture_output=True, text=True, encoding='utf-8',
                       env={**os.environ, 'MAPA': json.dumps(mapa), 'PONTOS': json.dumps({k: {'x': x, 'y': y} for k, (x, y) in pontos.items()})})
    if r.returncode:
        raise SystemExit(r.stderr)
    return json.loads(r.stdout.strip().splitlines()[-1])


def salas_por_caminhada(mapa):
    """Cada casa de chão vai para a sala cujo RÓTULO está mais perto ANDANDO (o custo do motor, que respeita a parede de
    aresta), com tudo aberto."""
    c = custos(aberto(mapa), ROTULOS)
    terreno = mapa['terreno']
    salas = {}
    for y, l in enumerate(terreno):
        for x, g in enumerate(l):
            if g not in LIVRES:
                continue
            k = f'{x},{y}'
            # o VÃO de cada porta, do lado de cá (a coluna 33), é da sala do lado de cá: com a porta aberta na conta, a
            # sala do outro lado o levava
            vao = x == 33 and any(y0 <= y <= y1 for y0, y1 in PORTAS.values())
            if vao:
                k = f'{x - 1},{y}'
            # cada HEMISFÉRIO tem as salas dele (a fenda do meio separa, e as portas não contam); B1, embaixo, é dos dois
            lado = DIREITA if x >= 34 else set(ROTULOS) - DIREITA
            dono = min((sid for sid in ROTULOS if k in c[sid] and (sid in lado or sid == 'B1')), key=lambda sid: c[sid][k], default=None)
            if dono:
                salas.setdefault(dono, []).append({'x': x, 'y': y})
    return salas


def covil():
    b = json.load(open(os.path.join(RAIZ, 'src', 'dev', '_tmp', 'covil-lowarnizel.json'), encoding='utf-8'))
    w, h = len(b['terreno'][0]), len(b['terreno'])
    chao = chao_pelas_paredes(b, [(7, 7)])
    terreno = [''.join('_' if (x, y) in chao else 'R' for x in range(w)) for y in range(h)]
    mapa = {
        'terreno': terreno, 'luz': ['1' * w for _ in range(h)],
        'paredes': {lado: list(b['paredes'][lado]) for lado in ('n', 'o')}, 'tracos': b['tracos'], 'tracosTipo': [None] * len(b['tracos']),
        'luzes': [], 'fundo': Z.fundo('covil-lowarnizel'),
        'interativos': [
            Z.obj(4, 2, 'cordaDoCovil', 'Olhar a corda', 'A corda com nós sobe seis metros até o buraco no teto, a única saída daqui.'),
            Z.obj(1, 7, 'bastoesDoCovil', 'Olhar os bastões', 'Dois bastões de metal saindo da parede, a dois metros um do outro, '
                  'lisos de tão polidos.'),
        ],
    }
    pontos = {
        'grupo': [{'x': 4, 'y': 3}, {'x': 5, 'y': 3}, {'x': 4, 'y': 4}, {'x': 5, 'y': 4}], 'olhar': {'dx': 1, 'dy': 1},
        'corda': {'x': 4, 'y': 2}, 'bastoes': {'x': 1, 'y': 7}, 'lowarnizel': {'x': 8, 'y': 8}, 'gossa': {'x': 11, 'y': 10},
    }
    return mapa, pontos


def main():
    um = lambda v: json.dumps(v, ensure_ascii=False, separators=(', ', ': '))
    mapa, pontos = montar()
    # a casa de chão que nada alcança, com tudo aberto, vira rocha (as quinas da parede com um fio de chão; o
    # `conferir-paredes` as acusa, como nas fendas)
    alc = E.alcancaveis(aberto(mapa), pontos['grupo'][0])
    t = [list(l) for l in mapa['terreno']]
    soltas = 0
    for y, l in enumerate(t):
        for x, g in enumerate(l):
            if g in LIVRES and f'{x},{y}' not in alc:
                t[y][x] = 'R'
                soltas += 1
    mapa['terreno'] = [''.join(l) for l in t]
    mapa['embacado'] = [c for c in mapa['embacado'] if mapa['terreno'][c['y']][c['x']] in LIVRES]
    print(f'  {soltas} casa(s) solta(s) de chão viraram rocha')
    salas = salas_por_caminhada(mapa)
    falta = [s for s in ROTULOS if s not in salas]
    assert not falta, f'sala sem casa: {falta}'
    pontos['salas'] = salas
    pontos['lobos'] = {s: LOBO[s] for s in salas}
    # AS PROVAS NO MOTOR: com tudo aberto, todo ponto se alcança do portal
    prova = {k: v for k, v in pontos.items() if k not in ('salas', 'lobos', 'olhar', 'portas', 'secreta', 'poca', 'arame', 'lona')}
    V.provas('LABIRINTO_SALGADO', aberto(mapa), prova, {'mublinesh': 2, 'aglomerado': 2, 'jitterjaws': 2})
    # e com tudo FECHADO, quem se alcança do portal, sala a sala (é o que as portas guardam)
    fechado = E.alcancaveis(mapa, pontos['grupo'][0])
    so_secreta = E.alcancaveis(aberto(mapa, quais=(), secreta=True), pontos['grupo'][0])
    alcanca = lambda alc, s: any(f"{c['x']},{c['y']}" in alc for c in salas[s])
    do_portal = sorted((s for s in salas if alcanca(fechado, s)), key=lambda s: int(s[1:]))
    print('com as portas fechadas, do portal: ' + ', '.join(do_portal))
    assert not alcanca(fechado, 'B11'), 'B11 se alcança sem achar a passagem secreta'
    assert alcanca(so_secreta, 'B11'), 'achada a passagem, B11 não se alcança'
    assert not alcanca(fechado, 'B22'), 'B22 se alcança sem a porta da frente'
    assert not alcanca(fechado, 'B19'), 'B19 se alcança sem a porta central'
    print('salas: ' + ', '.join(f'{k} {len(v)}' for k, v in sorted(salas.items(), key=lambda kv: int(kv[0][1:]))))
    cmapa, cpontos = covil()
    calc = E.alcancaveis(cmapa, cpontos['grupo'][0])
    cmapa['terreno'] = [''.join(g if g not in LIVRES or f'{x},{y}' in calc else 'R' for x, g in enumerate(l)) for y, l in enumerate(cmapa['terreno'])]
    V.provas('COVIL_LOWARNIZEL', cmapa, {k: v for k, v in cpontos.items() if k != 'olhar'}, {'lowarnizel': 2})

    def bloco(nome, m):
        linhas = [f'export const {nome} = {{']
        for k, v in m.items():
            if isinstance(v, list) and v and isinstance(v[0], str):
                linhas.append(f'  {k}: [\n' + ''.join(f'    {um(l)},\n' for l in v) + '  ],')
            elif k == 'paredes':
                linhas.append('  paredes: {\n' + ''.join(f'    {lado}: [\n' + ''.join(f'      {um(l)},\n' for l in v[lado]) + '    ],\n' for lado in ('n', 'o')) + '  },')
            elif k in ('interativos', 'luzes', 'tracos', 'sobreposicoes'):
                linhas.append(f'  {k}: [\n' + ''.join(f'    {um(t)},\n' for t in v) + '  ],')
            else:
                linhas.append(f'  {k}: {um(v)},')
        return linhas + ['};', '']

    cab = ('// O LABIRINTO SALGADO e o covil do Lowarnizel (o Obelisco, capítulo 8), sobre os battlemaps da Forgotten Adventures.\n'
           '// GERADO por `src/dev/mapa-labirinto-salgado.py` — mude lá e rode de novo.\n\n')
    corpo = bloco('MAPA_LABIRINTO_SALGADO', mapa) + bloco('MAPA_COVIL_LOWARNIZEL', cmapa)
    with open(SAIDA, 'w', encoding='utf-8', newline='\n') as f:
        f.write(cab + '\n'.join(corpo) + '\nexport const PONTOS_LABIRINTO = ' + um(pontos) + ';\n'
                + '\nexport const PONTOS_COVIL = ' + um(cpontos) + ';\n')
    print(f'escrito: {SAIDA}')


if __name__ == '__main__':
    main()
