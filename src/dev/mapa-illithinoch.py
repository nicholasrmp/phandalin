# -*- coding: utf-8 -*-
"""
ILLITHINOCH (o Obelisco, capítulo 7): a fortaleza dos devoradores de mentes, 2 milhas abaixo do fim do túnel, sobre o
battlemap da Forgotten Adventures ("Illithinoch", 33 x 43). A cena do Foundry é a do repositório público da FA
(`mapas/_cenas/illithinoch-33x43.json`, fora do repositório), importada por:

    python src/dev/importar-foundry.py mapas/_cenas/illithinoch-33x43.json public/mapas/fa/illithinoch.jpg \\
        --chao-pela-cor --editor src/dev/_tmp/illithinoch.json

O CHÃO SAI DA GEOMETRIA DAS PAREDES (o mesmo de `mapa-tunel-cap7.py`): a cor da arte não serve aqui — o fundo roxo de
fora das salas é tão claro quanto o chão, e a importação deu 1.419 casas de chão e nenhuma de rocha. As paredes da FA se
desenham numa grade fina (as PORTAS ficam de fora, abertas), a inundação sai do salão da estátua, e a casa coberta é
chão. Aqui o traço continua barrando o passo: os corredores da fortaleza têm duas casas de largura, e as portas são
arestas de traço.

As salas, pelo livro e pela arte: X10 no canto noroeste (a fenda para o Labirinto dos Olhos), as celas de X9 abaixo, X7 e
X8 a oeste, os portões (X1) e o salão da estátua (X2) a oeste no meio, X3 no centro, o cosmológio (X5, a fenda para o
Oco da Desova) e a biblioteca (X6) a sudoeste, o laboratório (X4, a fenda para as Trincheiras) ao sul, a piscina de
alimentação (X11) no meio, o cérebro (X15) e a câmara do ritual (X16) ao norte, o auditório (X13) a leste, o quarto da
Chishinix (X14) a nordeste e os casulos (X12) a sudeste.

Rode: python src/dev/mapa-illithinoch.py   (escreve `src/game/illithinoch-mapa.js` depois das provas no motor)
"""
import importlib.util
import json
import os

import numpy as np
from PIL import Image, ImageDraw

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SAIDA = os.path.join(RAIZ, 'src', 'game', 'illithinoch-mapa.js')


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
SEMENTE = (9, 26)       # o salão da estátua (X2)
LIVRES = set('_LV')

# as salas, por retângulos (x0, y0, x1, y1), na ordem em que se testam
SALAS = [
    ('X10', (2, 1, 12, 6)),
    ('X9', (2, 8, 12, 11)),
    ('X16', (13, 1, 22, 7)),
    ('X15', (13, 8, 22, 15)),
    ('X14', (23, 2, 29, 7)),
    ('X13', (22, 8, 29, 15)),
    ('X7', (3, 14, 8, 19)),
    ('X8', (9, 16, 13, 19)),
    ('X11', (14, 16, 24, 20)),
    ('X1', (0, 23, 4, 29)),
    ('X2', (5, 21, 15, 29)),
    ('X3', (16, 21, 19, 29)),
    ('X12', (20, 21, 31, 40)),
    ('X5', (3, 30, 12, 37)),
    ('X6', (5, 38, 13, 40)),
    ('X4', (13, 30, 19, 40)),
    ('corredor', (0, 0, 32, 42)),
]


def sala_de(x, y):
    for sid, (x0, y0, x1, y1) in SALAS:
        if x0 <= x <= x1 and y0 <= y <= y1:
            return sid
    return None


def chao_pelas_paredes(b):
    w, h = len(b['terreno'][0]), len(b['terreno'])
    im = Image.new('L', (w * SUB, h * SUB), 0)
    d = ImageDraw.Draw(im)
    for t, tipo in zip(b['tracos'], b['tracosTipo']):
        if tipo != '+':
            d.line([(x * SUB, y * SUB) for x, y in t], fill=255, width=3)
    ImageDraw.floodfill(im, (SEMENTE[0] * SUB + SUB // 2, SEMENTE[1] * SUB + SUB // 2), 128)
    a = np.asarray(im)
    return {(x, y) for y in range(h) for x in range(w) if (a[y * SUB:(y + 1) * SUB, x * SUB:(x + 1) * SUB] == 128).mean() >= COBRE}


def montar():
    b = json.load(open(os.path.join(RAIZ, 'src', 'dev', '_tmp', 'illithinoch.json'), encoding='utf-8'))
    chao = chao_pelas_paredes(b)
    w, h = len(b['terreno'][0]), len(b['terreno'])
    # a fortaleza é LAJE (construída); a passagem dos portões, que é caverna, fica de caverna
    t = [[('_' if sala_de(x, y) == 'X1' else 'L') if (x, y) in chao else 'R' for x in range(w)] for y in range(h)]
    # X15: a piscina de salmoura em volta do cérebro (nada-se; o cérebro nada a 3 m)
    for y in range(9, 13):
        for x in range(15, 21):
            if t[y][x] == 'L':
                t[y][x] = 'V'
    # o livro: luz fraca verde em toda a fortaleza (os pontinhos do Reino Distante)
    luz = ['1' * w for _ in range(h)]
    luzes = Z.luzes_da_fa(b)
    for l in luzes:
        l['semChama'] = True
        l['tipo'] = 'magia'
    terreno = [''.join(l) for l in t]
    interativos = [
        Z.obj(1, 26, 'portoesDeIllithinoch', 'Olhar os portões', 'Duas folhas de pedra polida, altas como três homens, sem maçaneta nem '
              'fechadura à vista. Pela fresta escapa uma luz verde e parada.'),
        Z.obj(12, 26, 'estatuaQuePinga', 'Olhar a estátua', 'Um devorador de mentes de pedra esverdeada, do tamanho de uma casa, com um '
              'cérebro em cada mão. Das mãos pinga um muco verde, devagar, numa poça.'),
        Z.obj(18, 25, 'perfumes', 'Olhar a banheira', 'Uma banheira com manchas azuis e cheiro de flor do campo, uma mesa de frascos e um '
              'armário com dezenas de mantos iguais. Ninguém mexe aqui há dias.'),
        Z.obj(8, 32, 'orrery', 'Olhar o orrery', 'Um orrery de ferro enorme, que gira sozinho, devagar: sóis, planetas e cometas de um céu '
              'que não é este. As esferas têm marcas de garra.'),
        Z.obj(5, 34, 'girinosSecos', 'Olhar os bichos secos', 'Criaturas secas no chão perto do rasgo, encolhidas como folhas: girinos de '
              'um palmo, alguns com braços e dentes demais.', 'investigar', 10, 'Girinos de slaad. No Reino Distante eles crescem '
              'sem precisar de hospedeiro; aqui, longe dele, secaram antes de virar slaadi.'),
        Z.obj(8, 39, 'cristaisDeMemoria', 'Olhar as estantes', 'Estantes curvas com quarenta cristais coloridos, quase todos cobertos de '
              'pó de séculos.', 'investigar', 13, 'Três cristais são bem mais novos que os outros, e um deles não é cristal de '
              'memória: guarda outra coisa.'),
        Z.obj(6, 16, 'jarrasDeCristal', 'Olhar a sala', 'Quatro cadeiras acolchoadas, uma prateleira baixa com jarras de cristal, uma '
              'tigela de frutas murchas e copos com água velha.'),
        Z.obj(11, 17, 'cartasDeVoalsh', 'Ler as cartas', 'Cartas inacabadas em Subcomum, para sacerdotes kuo-toa, matriarcas drow e chefes '
              'duergar, todas no mesmo tom: amizade de mentira, um pedido de tributo, um insulto, e a promessa de que um dia todos '
              'serão governados pela remetente.'),
        Z.obj(6, 9, 'arranhoesDasCelas', 'Olhar as grades', 'Retalhos de roupa presos nas grades e arranhões frescos no chão. Alguns em '
              'Comum: "três monstros mandam em todos", "Phandalin ainda espera", e um coração com "Tera" dentro.'),
        Z.obj(7, 3, 'lajesDeExperimento', 'Olhar as lajes', 'Lajes de pedra com presilhas em forma de crânio e manchas velhas de sangue. '
              'Numa delas, um nothic aberto ao meio, pela metade do trabalho.'),
        Z.obj(19, 18, 'piscinaVazia', 'Olhar a piscina', 'Uma piscina com murete enfeitado de cérebros e espinhas, vazia, só com mofo no '
              'fundo. Do teto pendem grilhões enferrujados.'),
        Z.obj(26, 11, 'auditorio', 'Olhar o auditório', 'Bancos em volta de um púlpito e uma escada que sobe a uma galeria alta, a oeste. '
              'O pó nos bancos tem marcas de joelhos.'),
        Z.obj(25, 4, 'poltronaDeChishinix', 'Olhar a poltrona', 'Uma poltrona enorme, larga demais para qualquer um, de um lado de uma '
              'parede grossa. Do outro, uma escrivaninha e um armário.'),
        Z.obj(17, 2, 'nichoDoRitual', 'Olhar o nicho', 'Um nicho raso na parede norte, só pedra, cercado de runas fracas que se apagam.',
              'investigar', 12, 'O nicho era, muito pouco tempo atrás, um portal aberto para o Reino Distante.'),
        Z.obj(21, 4, 'paredeDePlanos', 'Olhar a parede leste', 'A parede leste, lisa, coberta de linhas, formas e fórmulas por cima umas '
              'das outras. No meio da bagunça, um desenho claro: o nicho ligado a três runas maiores, uma cercada de tentáculos, '
              'uma de caroços como verrugas, uma de rabisco de labirinto.', 'lembrar', 11, 'O portal está escorado por runas '
              'postas em três fendas perto daqui, e está fechado. O que restou de cada runa reabriria o nicho.', 'Arcanismo'),
        Z.obj(14, 4, 'discosDeMetal', 'Olhar a mesa', 'Potes vazios, cristais esfarelados e discos de metal com um cérebro sangrando '
              'gravado. Atrás de um, em Subcomum, um grito de louvor a Ilvaash.'),
    ]
    pontos = {
        'grupo': [{'x': 0, 'y': 25}, {'x': 1, 'y': 25}, {'x': 0, 'y': 26}, {'x': 1, 'y': 26}], 'olhar': {'dx': 1, 'dy': 0},
        'shalghast': {'x': 10, 'y': 24}, 'ulthundul': {'x': 10, 'y': 27},
        'comandante': {'x': 17, 'y': 33}, 'lutadores': [{'x': 16, 'y': 35}, {'x': 18, 'y': 35}, {'x': 17, 'y': 36}],
        'slaadVermelho': {'x': 8, 'y': 33}, 'slaadAzul': {'x': 9, 'y': 35},
        'oshundo': {'x': 6, 'y': 17},
        'ahooshathan': {'x': 7, 'y': 4}, 'nothicsX10': [{'x': 5, 'y': 3}, {'x': 9, 'y': 3}],
        'duoro': {'x': 19, 'y': 18}, 'larnon': {'x': 21, 'y': 19},
        'nothicsX12': [{'x': 22, 'y': 25}, {'x': 26, 'y': 25}, {'x': 22, 'y': 32}, {'x': 26, 'y': 32}, {'x': 24, 'y': 36}, {'x': 28, 'y': 36}],
        'gulguush': {'x': 26, 'y': 4}, 'homunculo': {'x': 27, 'y': 4}, 'esconderijo': {'x': 25, 'y': 6},
        'cerebro': {'x': 17, 'y': 10},
        'nicho': {'x': 17, 'y': 2},
        'fendaTrincheiras': {'x': 18, 'y': 40}, 'fendaOco': {'x': 3, 'y': 34}, 'fendaLabirinto': {'x': 3, 'y': 2},
        'estatua': {'x': 12, 'y': 26}, 'cristais': {'x': 8, 'y': 39}, 'perfumes': {'x': 18, 'y': 25}, 'casuloVelho': {'x': 21, 'y': 37},
        'cartas': {'x': 11, 'y': 17}, 'casuloDeVoalsh': {'x': 12, 'y': 18}, 'armario': {'x': 28, 'y': 6},
        'saida': [{'x': 0, 'y': 25}, {'x': 0, 'y': 26}],
    }
    paredes = {lado: list(b['paredes'][lado]) for lado in ('n', 'o')}
    tracos, tipos = list(b['tracos']), list(b['tracosTipo'])
    # AS CELAS DE X9: as grades da FA (paredes invisíveis) viram aresta com vão, e as três portas das celas ficavam no
    # meio do nada ("porta que não separa", `conferir-paredes.mjs`). As celas estão vazias no livro: as portas saem.
    for x, y, lado in ((6, 11, 'n'), (6, 11, 'o'), (8, 11, 'n')):
        linha = paredes[lado][y]
        paredes[lado][y] = linha[:x] + '.' + linha[x + 1:]
    dentroDeX9 = lambda tr: all(2 <= px <= 12.5 and 8 <= py <= 12.5 for px, py in tr)
    fica = [i for i, (tr, tp) in enumerate(zip(tracos, tipos)) if not (tp == '+' and dentroDeX9(tr))]
    tracos, tipos = [tracos[i] for i in fica], [tipos[i] for i in fica]
    # as FOLHAS das portas (sem a lista, nenhuma porta abre nem se desenha): toda aresta '+'
    folhas = []
    for y in range(h):
        for x in range(w):
            if paredes['n'][y][x] == '+':
                folhas.append([{'x': x, 'y': y - 1}, {'x': x, 'y': y}])
            if paredes['o'][y][x] == '+':
                folhas.append([{'x': x - 1, 'y': y}, {'x': x, 'y': y}])
    mapa = {
        'terreno': terreno, 'luz': luz, 'paredes': paredes, 'folhas': folhas,
        'tracos': tracos, 'tracosTipo': tipos, 'luzes': luzes, 'fundo': Z.fundo('illithinoch'),
        'interativos': interativos,
    }
    return mapa, pontos


def salas_de(terreno):
    salas = {}
    for y, l in enumerate(terreno):
        for x, g in enumerate(l):
            if g in LIVRES:
                salas.setdefault(sala_de(x, y), []).append({'x': x, 'y': y})
    return salas


def abertas(mapa):
    """O mapa com toda porta aberta (para provar que todo ponto se alcança)."""
    m = json.loads(json.dumps(mapa))
    m['tracosTipo'] = [None if tp == '+' else tp for tp in m['tracosTipo']]
    m['tracos'] = [tr for tr, tp in zip(mapa['tracos'], mapa['tracosTipo']) if tp != '+']
    m['tracosTipo'] = [tp for tp in mapa['tracosTipo'] if tp != '+']
    for lado in ('n', 'o'):
        m['paredes'][lado] = [l.replace('+', '/') for l in m['paredes'][lado]]
    return m


def main():
    um = lambda v: json.dumps(v, ensure_ascii=False, separators=(', ', ': '))
    mapa, pontos = montar()
    pontos['salas'] = salas_de(mapa['terreno'])
    prova = {k: v for k, v in pontos.items() if k not in ('salas', 'olhar', 'saida')}
    V.provas('ILLITHINOCH', abertas(mapa), prova, {'slaadVermelho': 2, 'slaadAzul': 2, 'cerebro': 2})
    print('salas: ' + ', '.join(f'{k} {len(v)}' for k, v in sorted(pontos['salas'].items(), key=lambda kv: str(kv[0]))))
    linhas = ['export const MAPA_ILLITHINOCH = {']
    for k, v in mapa.items():
        if isinstance(v, list) and v and isinstance(v[0], str):
            linhas.append(f'  {k}: [\n' + ''.join(f'    {um(l)},\n' for l in v) + '  ],')
        elif k == 'paredes':
            linhas.append('  paredes: {\n' + ''.join(f'    {lado}: [\n' + ''.join(f'      {um(l)},\n' for l in v[lado]) + '    ],\n' for lado in ('n', 'o')) + '  },')
        elif k in ('interativos', 'luzes', 'tracos', 'folhas'):
            linhas.append(f'  {k}: [\n' + ''.join(f'    {um(t)},\n' for t in v) + '  ],')
        else:
            linhas.append(f'  {k}: {um(v)},')
    linhas.append('};')
    cab = ('// ILLITHINOCH (o Obelisco, capítulo 7), sobre o battlemap da Forgotten Adventures.\n'
           '// GERADO por `src/dev/mapa-illithinoch.py` — mude lá e rode de novo.\n')
    with open(SAIDA, 'w', encoding='utf-8', newline='\n') as f:
        f.write(cab + '\n' + '\n'.join(linhas) + '\n\nexport const PONTOS_ILLITHINOCH = ' + um(pontos) + ';\n')
    print(f'escrito: {SAIDA}')


if __name__ == '__main__':
    main()
