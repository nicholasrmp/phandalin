# -*- coding: utf-8 -*-
"""
AS ILHAS DO VAZIO SEM FIM (o Obelisco, capítulo 8), sobre os battlemaps da Forgotten Adventures: a Cúpula de Cristal, a
Ponte Vazia, o Charco da Dúvida, o Nematódeo, o Miasma Ocludente, a Estátua Tombada e o Campo de Batalha Lamentoso (a
Ânima de Ilvaash é a parte seguinte). As cenas do Foundry ficam em `mapas/_cenas/` (fora do repositório) e se importam com
`importar-foundry.py` para `src/dev/_tmp/vazio-<ilha>.json`; a arte vai para `public/mapas/fa/vazio-<ilha>.jpg`.

NO VAZIO TODO MUNDO VOA (o livro): a casa fora da ilha não é abismo, é ar, e se atravessa. Então o terreno é todo
passável, e quem barra é a parede da FA (a cúpula, a torre, a base da estátua, o corpo do Nematódeo, a pirâmide). O que
cada ilha tem de próprio:
  - a CÚPULA usa a arte de dentro (a FA dá as duas), porque a luta é lá dentro;
  - a PONTE tem o RIO, achado pela cor da arte dentro de faixas que seguem o leito (o fundo do Vazio também é azul);
  - o MIASMA é névoa mortal em todo o mapa (uma região de dano no começo do turno, e a vista embaçada em toda casa);
  - o NEMATÓDEO tem o lago de ácido do estômago (uma região de dano para quem entra ou começa o turno nele, e não voa);
  - a ESTÁTUA tem a porta da base FECHADA como parede: só a língua de metal, na boca da estátua, a abre;
  - o CHARCO tem a trilha marcada pela FA como parede; aqui ela só corta a vista (o mato fechado), porque se voa por cima.

Rode: python src/dev/mapa-vazio.py   (escreve `src/game/vazio-mapas.js` depois das provas no motor)
"""
import importlib.util
import json
import os

import numpy as np
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SAIDA = os.path.join(RAIZ, 'src', 'game', 'vazio-mapas.js')


def _carregar(nome):
    spec = importlib.util.spec_from_file_location(nome.replace('-', '_'), os.path.join(RAIZ, 'src', 'dev', nome + '.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


Z = _carregar('mapa-zorzula')          # obj, luzes_da_fa, fundo
V = _carregar('mapa-cap5-vila-fa')     # provas
E = _carregar('mapa-encruzilhada')     # alcancaveis

P = lambda x, y: {'x': x, 'y': y}


def base(nome, fundo=None, tracos_como=None):
    b = json.load(open(os.path.join(RAIZ, 'src', 'dev', '_tmp', f'vazio-{nome}.json'), encoding='utf-8'))
    w, h = len(b['terreno'][0]), len(b['terreno'])
    tipos = list(b.get('tracosTipo') or [None] * len(b['tracos']))
    if tracos_como:
        tipos = [tracos_como if tp is None else tp for tp in tipos]
    luzes = Z.luzes_da_fa(b)
    for l in luzes:
        l['semChama'] = True
        l['tipo'] = 'magia'
    return {
        'terreno': ['_' * w for _ in range(h)], 'luz': ['2' * w for _ in range(h)],
        'paredes': {lado: list(b['paredes'][lado]) for lado in ('n', 'o')},
        'tracos': b['tracos'], 'tracosTipo': tipos, 'luzes': luzes, 'fundo': Z.fundo(fundo or f'vazio-{nome}'),
        'interativos': [],
    }, b


def por_aresta(paredes, x, y, lado, g):
    linha = paredes[lado][y]
    paredes[lado][y] = linha[:x] + g + linha[x + 1:]


def sem_tracos(m, b, tipo):
    """Tira do mapa os traços de um tipo (a porta que a cena abre), e a aresta deles fica com a cena."""
    fica = [(t, tp) for t, tp in zip(m['tracos'], m['tracosTipo']) if tp != tipo]
    m['tracos'], m['tracosTipo'] = [t for t, _ in fica], [tp for _, tp in fica]


def cupula():
    m, b = base('cupula', fundo='vazio-cupula-dentro')
    dentro = [P(x, y) for y in range(39) for x in range(32) if ((x + 0.5 - 16) ** 2 + (y + 0.5 - 16.3) ** 2) <= 5.6 ** 2]
    m['interativos'] = [
        Z.obj(15, 33, 'furoDaCupula', 'Olhar o furo', 'Um ponto de escuridão prateada no chão da plataforma: a estrela sem luz, deste lado.'),
        Z.obj(16, 23, 'aberturaDaCupula', 'Olhar a cúpula', 'Uma cúpula de cristal enegrecido no alto da ilha, da largura de uma casa grande, '
              'com uma abertura no pé da passarela. Lá dentro, vultos enormes e imóveis.'),
    ]
    pontos = {
        'grupo': [P(15, 32), P(16, 32), P(15, 31), P(16, 31)], 'olhar': {'dx': 0, 'dy': -1},
        'furo': P(15, 33),
        'guardioes': [P(13, 13), P(18, 13), P(12, 17), P(19, 17), P(15, 14)],
        'refens': [P(12, 14), P(20, 14), P(12, 19), P(20, 19)],
        'dentro': dentro,
    }
    return m, pontos


RIO = [(7, 2, 11, 8), (9, 7, 14, 14), (11, 13, 17, 18), (12, 21, 18, 26), (15, 25, 21, 31), (18, 30, 25, 38)]


def ponte():
    m, b = base('ponte')
    img = np.asarray(Image.open(os.path.join(RAIZ, 'public', 'mapas', 'fa', 'vazio-ponte.jpg')).convert('RGB')).astype(int)
    t = [list(l) for l in m['terreno']]
    for x0, y0, x1, y1 in RIO:
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                c = img[y * 100:(y + 1) * 100, x * 100:(x + 1) * 100].reshape(-1, 3).mean(0)
                if c[2] > c[0] + 15 and c[2] > 70:
                    t[y][x] = 'W'
    m['terreno'] = [''.join(l) for l in t]
    m['folhas'] = [[P(21, 17), P(21, 18)]]
    m['interativos'] = [
        Z.obj(16, 19, 'meioDaPonte', 'Olhar a ponte', 'Uma ponte de pedra lisa sobre o rio escuro. No meio dela, o chão tem um desenho '
              'que quase não se vê.', 'investigar', 19, 'Um símbolo mágico gravado na pedra, armado. Quem pisa nele se arrisca.'),
        Z.obj(14, 24, 'rioEscuro', 'Olhar o rio', 'Um rio escuro de nove metros de largura, que dá a volta na ilha como um anel. Não se vê '
              'o fundo.', 'percepcao', 16, 'Alguma coisa grande se mexe lá embaixo, devagar.'),
        Z.obj(20, 15, 'escritorioDaTorre', 'Subir a torre', 'Três andares de escada até um escritório aceso por uma chama que não se apaga. '
              'À mesa, sentado, um homem sem cabeça, numa mesa coberta de sangue velho.', 'medicina', 12, 'O crânio explodiu de dentro '
              'para fora, há meses.'),
    ]
    pontos = {
        'grupo': [P(5, 31), P(6, 31), P(5, 32), P(6, 32)], 'olhar': {'dx': 1, 'dy': -1},
        'simbolo': [P(15, 19), P(16, 19), P(15, 20), P(16, 20)],
        'aboleth': P(14, 24), 'elemental': P(11, 11), 'escritorio': P(20, 15),
    }
    return m, pontos


def estatua():
    m, b = base('estatua')
    sem_tracos(m, b, '+')
    for y in (14, 15):
        por_aresta(m['paredes'], 20, y, 'o', '#')
    m['interativos'] = [
        Z.obj(9, 26, 'bocaDaEstatua', 'Olhar a boca da estátua', 'A cabeça de metal de um devorador de mentes, cravada na ilha, de túnica e '
              'tentáculos — e, debaixo dos tentáculos, uma boca humana aberta, com o toco de uma língua.', 'investigar', 15,
              'O toco é uma alavanca. Não mexe sem a parte que falta.'),
        Z.obj(21, 15, 'sorrisoDaBase', 'Olhar a base', 'Um cubo de metal sem enfeite nenhum, só um sorriso humano enorme, sem rosto em volta. '
              'Lá de dentro vêm marteladas fracas.'),
    ]
    pontos = {
        'grupo': [P(23, 25), P(24, 25), P(23, 26), P(24, 26)], 'olhar': {'dx': -1, 'dy': -1},
        'boca': P(9, 26), 'porta': [{'a': P(19, y), 'b': P(20, y)} for y in (14, 15)], 'sorriso': P(21, 15),
        'refens': [P(15, 13), P(17, 13), P(15, 16), P(17, 16)],
    }
    return m, pontos


def miasma():
    m, b = base('miasma')
    w, h = 35, 45
    casas = [f'{x},{y}' for y in range(h) for x in range(w)]
    m['regioes'] = [{
        'id': 'nevoaMortal', 'nome': 'a névoa mortal', 'casas': casas, 'quando': ['comecaTurno'], 'pegaQuemVoa': True,
        'efeitos': [{'tipo': 'dano', 'dados': '5d8', 'dano': 'veneno', 'teste': {'atributo': 'con', 'cd': 17, 'metade': True}}],
    }]
    m['embacado'] = [P(x, y) for y in range(h) for x in range(w)]
    m['interativos'] = [Z.obj(17, 20, 'linguaDeMetal', 'Olhar a fita de metal', 'Numa ilha de terra de sete metros, uma fita de metal de um '
                              'palmo de largura, áspera de um lado, com a ponta quebrada.')]
    pontos = {
        'grupo': [P(17, 1), P(18, 1), P(16, 1), P(17, 2)], 'olhar': {'dx': 0, 'dy': 1},
        'lingua': P(17, 20), 'perseguidores': [P(10, 14), P(25, 24), P(16, 31)],
    }
    return m, pontos


def nematodeo():
    m, b = base('nematodeo')
    lago = [f'{x},{y}' for y in range(37, 46) for x in range(0, 15)]
    m['regioes'] = [{
        'id': 'acidoDoEstomago', 'nome': 'o lago de ácido', 'casas': lago, 'quando': ['entrar', 'comecaTurno'],
        'efeitos': [{'tipo': 'dano', 'dados': '6d10', 'dano': 'ácido'}],
    }]
    # A BOCA E A TENDA: a caverna da boca (o que se alcança de dentro dela) encosta no lado de fora pela boca, e na
    # garganta pela tenda de osso. A FA as desenha fechadas; a cena abre a boca na chegada, e a armadilha a fecha e abre a
    # tenda (`vazio.js`).
    cave = E.alcancaveis(m, P(22, 7))
    fora = E.alcancaveis(m, P(30, 18))
    garganta = E.alcancaveis(m, P(17, 14))
    def arestas_entre(a, b):
        out = []
        for k in a:
            x, y = map(int, k.split(','))
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                if f'{x + dx},{y + dy}' in b:
                    out.append({'a': P(x, y), 'b': P(x + dx, y + dy)})
        return out
    bolsa = E.alcancaveis(m, P(13, 33))
    # a MEMBRANA se mexe de dentro da garganta, da casa encostada na bolsa do líquido
    junto = sorted((k for k in garganta if any(f'{int(k.split(",")[0]) + dx},{int(k.split(",")[1]) + dy}' in bolsa
                                              for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))), key=lambda k: int(k.split(',')[1]))
    assert junto, 'a bolsa não encosta na garganta'
    mx, my = map(int, junto[0].split(','))
    m['interativos'] = [
        Z.obj(20, 10, 'tendaDeOsso', 'Olhar a tenda de osso', 'No fundo da caverna, uma tenda de osso duro como pedra fecha a passagem para '
              'uma garganta.'),
        Z.obj(mx, my, 'membrana', 'Olhar a membrana', 'Uma membrana grossa e translúcida segura um líquido que lateja, como um cérebro '
              'derretido.', 'medicina', 10, 'Rasgá-la toda faria a criatura vomitar tudo o que tem dentro. Um furo pequeno, no ponto certo, '
              'só a faria abrir a boca.'),
    ]
    boca = arestas_entre(cave, fora)
    tenda = arestas_entre(cave, garganta)
    assert boca and tenda, f'boca {len(boca)}, tenda {len(tenda)}'
    pontos = {
        'arestasDaBoca': boca, 'arestasDaTenda': tenda,
        'dentroDaBoca': [P(*map(int, k.split(','))) for k in cave],
        'garganta': [P(*map(int, k.split(','))) for k in garganta],
        'grupo': [P(28, 18), P(29, 18), P(28, 19), P(29, 19)], 'olhar': {'dx': -1, 'dy': -1},
        'tenda': P(20, 10), 'membrana': P(mx, my), 'bolsa': [P(*map(int, k.split(','))) for k in bolsa],
        # os dois ardis saem da garganta, logo depois da tenda
        'ardis': [P(*map(int, k.split(','))) for k in sorted(garganta, key=lambda k: abs(int(k.split(',')[0]) - 20) + abs(int(k.split(',')[1]) - 10))[3:12:7]],
    }
    return m, pontos


def charco():
    # a trilha que a FA marca como parede: aqui só corta a vista (o mato fechado), porque no Vazio se voa por cima
    m, b = base('charco', tracos_como='E')
    # as arestas que o importador derivou da trilha também saem: a trilha só corta a vista
    m['paredes'] = {lado: ['.' * len(m['terreno'][0]) for _ in m['terreno']] for lado in ('n', 'o')}
    m['interativos'] = [
        Z.obj(23, 26, 'espantalho', 'Olhar a árvore', 'Debaixo da árvore mais perto do píer, um cadáver oco de couro cinzento, de chifres, '
              'escorado com galhos e com o próprio tridente: um espantalho.', 'lembrar', 13, 'Um mezzoloth, um mercenário dos baixos '
              'planos. Isto é um aviso para os outros.', 'Arcanismo'),
        Z.obj(22, 4, 'pedraDoValsyx', 'Olhar a pedra', 'Uma pedra baixa como altar no fundo da clareira, com um livro encharcado em cima.'),
        Z.obj(6, 37, 'arbustosEsculpidos', 'Olhar os arbustos', 'Arbustos podados em forma de bichos, cada um com uma pedra leitosa no '
              'meio da folhagem.'),
    ]
    pontos = {
        'grupo': [P(26, 29), P(27, 29), P(26, 30), P(27, 30)], 'olhar': {'dx': -1, 'dy': -1},
        'valsyx': P(22, 5), 'charnyz': P(6, 34), 'pedra': P(22, 4), 'arbustos': P(6, 37),
        'clareira': [P(x, y) for y in range(1, 9) for x in range(17, 28)],
        'vale': [P(x, y) for y in range(30, 41) for x in range(2, 12)],
    }
    return m, pontos


def campo():
    m, b = base('campo')
    m['folhas'] = [[P(23, 30), P(23, 31)]]
    m['interativos'] = [
        Z.obj(13, 16, 'entradaDaPiramide', 'Olhar a pirâmide', 'Uma pirâmide quebrada de vinte metros, rachada de cima a baixo, com a '
              'entrada ladeada de estátuas de insetos de pé.'),
        Z.obj(22, 33, 'moinho', 'Olhar o moinho', 'Um moinho de pedra e madeira queimadas. Três pás giram sem vento; a quarta está caída. '
              'A fumaça não chega perto dele.'),
        Z.obj(10, 30, 'campoDeOssos', 'Olhar o campo', 'Prédios caídos, árvores secas, crateras, e ossos com lanças e espadas enfiadas. '
              'Os lamentos vêm de todo lado e de lugar nenhum.'),
    ]
    pontos = {
        'grupo': [P(17, 42), P(18, 42), P(17, 43), P(18, 43)], 'olhar': {'dx': 0, 'dy': -1},
        'piramide': [P(x, y) for y in range(14, 20) for x in range(16, 22)],
        'w1': [P(17, 15), P(20, 15), P(18, 18), P(20, 18)],
        'moinhoDentro': P(22, 32), 'nellik': P(22, 32), 'frevvik': P(21, 35),
        'patrulhas': [[P(7, 27), P(8, 27)], [P(28, 9), P(29, 9)]],
    }
    return m, pontos


# A ÂNIMA DE ILVAASH (mapa 8.9 do livro, a FA "Ilvaash's Anima"): a bacia de tentáculos de pedra. Quem voa até ela é puxado
# para a plataforma de chegada, e é por ela e pela escada que se entra: o lado de fora da parede é rocha (não se dá a volta
# na ilha), e o de dentro se reparte nas salas do livro pela distância andando (o custo do motor). A1 é a entrada de baixo,
# A3 a câmara dos discípulos à esquerda (as seis lajes na parede, o altar com a estátua-cérebro), A2 o refeitório à direita
# (as mesas, os tubos), A4 o mirante de cima com o obelisco no estrado, e a COVA redonda no meio, que é de A4.
# A ALTURA (a plataforma a +3 m, A4 a +3 m, o estrado a +6 m) fica de fora: no Vazio todos voam, e ela não barra ninguém.
SEMENTES_DA_ANIMA = {'1': (22, 23), '2': (35, 15), '3': (10, 15), '4': (23, 8), 'c': (23, 15)}
PLATAFORMA_DA_ANIMA = [(x, y) for y in range(28, 32) for x in range(19, 27)] + [(x, 32) for x in range(20, 26)]


def custos(mapa, sementes):
    """O custo andando de cada semente a cada casa (o `reachable` do motor)."""
    import subprocess
    prog = r"""
import { montarCampo } from 'file:///@BASE@/src/game/campo.js';
const f = montarCampo(JSON.parse(process.env.MAPA));
const out = {};
for (const [k, s] of Object.entries(JSON.parse(process.env.SEMENTES))) out[k] = Object.fromEntries([...f.reachable({ x: s[0], y: s[1] }, 100000, () => false)].map(([c, n]) => [c, n.cost]));
console.log(JSON.stringify(out));
""".replace('@BASE@', RAIZ.replace(chr(92), '/'))
    r = subprocess.run(['node', '--import', './src/dev/cena-node/register.mjs', '--input-type=module', '-e', prog], cwd=RAIZ,
                       capture_output=True, text=True, encoding='utf-8', env={**os.environ, 'MAPA': json.dumps(mapa), 'SEMENTES': json.dumps(sementes)})
    if r.returncode:
        raise SystemExit(r.stderr)
    return json.loads(r.stdout.strip().splitlines()[-1])


def anima():
    m, b = base('anima')
    w, h = len(m['terreno'][0]), len(m['terreno'])
    # o losango em volta do obelisco (uma seteira da FA) sai: quem ocupa o estrado é o próprio obelisco, que se golpeia
    fica = [(t, tp) for t, tp in zip(m['tracos'], m['tracosTipo']) if tp != 'J']
    m['tracos'], m['tracosTipo'] = [t for t, _ in fica], [tp for _, tp in fica]
    # o DENTRO: tapada a fileira da escada, o que se alcança de A1
    t = [['_'] * w for _ in range(h)]
    for x in range(17, 29):
        t[28][x] = 'R'
    m_fechado = {**m, 'terreno': [''.join(l) for l in t]}
    dentro = E.alcancaveis(m_fechado, {'x': 22, 'y': 23})
    plataforma = {f'{x},{y}' for x, y in PLATAFORMA_DA_ANIMA}
    m['terreno'] = [''.join('_' if f'{x},{y}' in dentro or f'{x},{y}' in plataforma else 'R' for x in range(w)) for y in range(h)]
    # as salas: cada casa de dentro é da semente mais perto andando
    cs = custos(m, {k: list(v) for k, v in SEMENTES_DA_ANIMA.items()})
    salas = []
    for y in range(h):
        linha = ''
        for x in range(w):
            k = f'{x},{y}'
            if k in plataforma:
                linha += 'p'
            elif k in dentro:
                linha += min((cs[s].get(k, 1e9), s) for s in SEMENTES_DA_ANIMA)[1]
            else:
                linha += '.'
        salas.append(linha.replace('c', '4'))
    m['sobreposicoes'] = [Z.peca('obeliscoQuebrado', 'vazio-anima-obelisco-quebrado', 16, 2, 15, 10)]
    m['interativos'] = [
        Z.obj(22, 29, 'plataformaDaAnima', 'Olhar a plataforma', 'Uma plataforma de pedra presa à borda da bacia, com uma escada larga que '
              'sobe entre tentáculos que ondulam devagar. Das arcadas pendem correntes com globos violeta acesos.'),
        Z.obj(23, 15, 'covaDaAnima', 'Olhar a cova', 'Uma cova rasa e redonda, cheia de névoa. Dentro dela, pequena como um brinquedo, '
              'está Phandalin: as casas tortas aparecem e somem, e da névoa sobem gritos com vozes que vocês conhecem.'),
        Z.obj(38, 14, 'tubosDaAnima', 'Olhar os tubos', 'Três tubos de metal da grossura de um braço descem do teto, pingando um líquido '
              'roxo e grosso. Têm uma boca na ponta, à altura da mão.'),
        Z.obj(37, 20, 'prateleiraDaAnima', 'Olhar a prateleira', 'Uma prateleira torta presa à parede de tentáculos, com potes de '
              'carne e um frasco que brilha vermelho por dentro.'),
        Z.obj(8, 13, 'lajesDaAnima', 'Olhar as lajes', 'Seis lajes de pedra saem da parede como camas, ou bancos. Estão limpas e '
              'nunca foram usadas: esperam gente que ainda não chegou.'),
        Z.obj(15, 15, 'altarDaAnima', 'Olhar o altar', 'Um altar com uma estátua de um cérebro humanoide da altura de um homem, '
              'cravejada de diamantes. Sobre o altar, tabuletas de pedra cobertas de escrita.'),
        Z.obj(22, 8, 'obeliscoDaAnima', 'Olhar o obelisco', 'Num estrado, um obelisco negro remendado, com costuras de energia verde '
              'viva correndo entre os pedaços. Onde falta pedaço, a costura fecha o buraco do mesmo jeito.'),
    ]
    pontos = {
        'grupo': [P(21, 30), P(22, 30), P(23, 30), P(24, 30)], 'olhar': {'dx': 0, 'dy': -1},
        'chishinix': P(22, 23), 'cabeca': P(23, 24), 'cabecaNoAlto': P(24, 11), 'hashutu': P(35, 17), 'voalsh': P(21, 9),
        'a4': [P(19, 9), P(26, 9), P(23, 10)],
        'profetas': [P(10, 13), P(11, 17)],
        'obelisco': P(22, 6), 'tubos': P(38, 14), 'prateleira': P(37, 20), 'altar': P(15, 15), 'lajes': P(8, 13),
        'cova': P(23, 15), 'saida': P(22, 31),
        'salas': salas,
    }
    return m, pontos


def alcancaveis_abrindo(mapa, arestas, de):
    """As casas que o motor alcança com estas arestas abertas (por cima das que o traço deriva)."""
    import subprocess
    prog = r'''
import { montarCampo } from 'file:///@BASE@/src/game/campo.js';
import { ARESTA } from 'file:///@BASE@/src/core/grid.js';
const f = montarCampo(JSON.parse(process.env.MAPA));
for (const e of JSON.parse(process.env.ARESTAS)) f.porAresta(e.a.x, e.a.y, e.b.x, e.b.y, ARESTA.aberta);
console.log(JSON.stringify([...f.reachable(JSON.parse(process.env.DE), 100000, () => false).keys()]));
'''.replace('@BASE@', RAIZ.replace(chr(92), '/'))
    r = subprocess.run(['node', '--import', './src/dev/cena-node/register.mjs', '--input-type=module', '-e', prog], cwd=RAIZ,
                       capture_output=True, text=True, encoding='utf-8',
                       env={**os.environ, 'MAPA': json.dumps(mapa), 'ARESTAS': json.dumps(arestas), 'DE': json.dumps(de)})
    if r.returncode:
        raise SystemExit(r.stderr)
    return set(json.loads(r.stdout.strip().splitlines()[-1]))


ILHAS = [('CUPULA', cupula), ('PONTE', ponte), ('ESTATUA', estatua), ('MIASMA', miasma), ('NEMATODEO', nematodeo),
         ('CHARCO', charco), ('CAMPO', campo), ('ANIMA', anima)]


def main():
    um = lambda v: json.dumps(v, ensure_ascii=False, separators=(', ', ': '))
    saida = ['// AS ILHAS DO VAZIO SEM FIM (o Obelisco, capítulo 8), sobre os battlemaps da Forgotten Adventures.',
             '// GERADO por `src/dev/mapa-vazio.py` — mude lá e rode de novo.', '']
    tudo = {}
    for chave, fn in ILHAS:
        mapa, pontos = fn()
        prova = {k: v for k, v in pontos.items() if k not in ('olhar', 'dentro', 'porta', 'clareira', 'vale', 'piramide', 'patrulhas', 'simbolo',
                                                              'arestasDaBoca', 'arestasDaTenda', 'dentroDaBoca', 'garganta', 'bolsa', 'salas')}
        if chave == 'NEMATODEO':
            # lá dentro só se chega pela boca, e a garganta só pela tenda: a prova é do motor, com as arestas abertas
            dentro = alcancaveis_abrindo(mapa, pontos['arestasDaBoca'] + pontos['arestasDaTenda'], pontos['grupo'][0])
            for k in ('tenda', 'ardis'):
                for q in [].concat(pontos[k]) if False else (pontos[k] if isinstance(pontos[k], list) else [pontos[k]]):
                    assert f"{q['x']},{q['y']}" in dentro, f'{k} não se alcança pela boca e pela tenda'
            assert all(f"{q['x']},{q['y']}" not in E.alcancaveis(mapa, pontos['grupo'][0]) for q in [pontos['tenda']]), 'a garganta se alcança sem a boca'
            prova = {k: v for k, v in prova.items() if k not in ('tenda', 'ardis', 'membrana')}
        # o chão que nada alcança, com tudo o que o roteiro abre aberto (a boca e a tenda do Nematódeo, a base da Estátua,
        # as portas), vira rocha: o corpo do Nematódeo e a bolsa da membrana, o corpo da estátua caída, as estatuetas e os
        # cantos do moinho do Campo
        abre = (pontos.get('arestasDaBoca', []) + pontos.get('arestasDaTenda', []) + pontos.get('porta', []))
        m_aberto = json.loads(json.dumps(mapa))
        for lado in ('n', 'o'):
            m_aberto['paredes'][lado] = [l.replace('+', '/') for l in m_aberto['paredes'][lado]]
        alc = alcancaveis_abrindo(m_aberto, abre + [{'a': q['a'], 'b': q['b']} for q in []], pontos['grupo'][0])
        t = [list(l) for l in mapa['terreno']]
        soltas = 0
        for y, l in enumerate(t):
            for x, g in enumerate(l):
                if g in '_W' and f'{x},{y}' not in alc:
                    t[y][x] = 'R'
                    soltas += 1
        mapa['terreno'] = [''.join(l) for l in t]
        if 'embacado' in mapa:
            mapa['embacado'] = [c for c in mapa['embacado'] if mapa['terreno'][c['y']][c['x']] != 'R']
        print(f'  {chave}: {soltas} casa(s) de chão que nada alcança viraram rocha')
        # a Estátua: os reféns estão DENTRO da base fechada; prova-se com a porta aberta
        m_prova = json.loads(json.dumps(mapa))
        for lado in ('n', 'o'):
            m_prova['paredes'][lado] = [l.replace('+', '/') for l in m_prova['paredes'][lado]]
        m_prova['tracosTipo'] = [None if tp == '+' else tp for tp in m_prova['tracosTipo']]
        m_prova['tracos'] = [t for t, tp in zip(mapa['tracos'], mapa['tracosTipo']) if tp != '+']
        m_prova['tracosTipo'] = [tp for tp in mapa['tracosTipo'] if tp != '+']
        if chave == 'ESTATUA':
            for q in pontos['porta']:
                por_aresta(m_prova['paredes'], q['b']['x'], q['b']['y'], 'o', '.')
        V.provas(chave, m_prova, prova, {'aboleth': 2, 'elemental': 2, 'obelisco': 2})
        if chave == 'ESTATUA':
            alc = E.alcancaveis(mapa, pontos['grupo'][0])
            assert f"{pontos['refens'][0]['x']},{pontos['refens'][0]['y']}" not in alc, 'a base da estátua se alcança sem a língua'
        tudo[chave] = pontos
        linhas = [f'export const MAPA_VAZIO_{chave} = {{']
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
        saida += linhas + ['']
    saida.append('export const PONTOS_VAZIO = ' + um(tudo) + ';')
    with open(SAIDA, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(saida) + '\n')
    print(f'escrito: {SAIDA}')


if __name__ == '__main__':
    main()
