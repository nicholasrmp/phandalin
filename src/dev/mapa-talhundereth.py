# -*- coding: utf-8 -*-
"""
TALHUNDERETH (o Obelisco, capítulo 6): o templo anão de Dumathoin tomado pelo Culto do Obelisco, sobre o battlemap da
Forgotten Adventures ("Talhundereth", 35 x 44; a cena do Foundry do repositório público da FA, em `mapas/_cenas/`).

O import:  SEMENTES="17,2;..." python src/dev/importar-foundry.py mapas/_cenas/talhundereth-35x44.json \\
               public/mapas/fa/talhundereth.jpg --editor src/dev/_tmp/talhundereth.json
(as SEMENTES são uma casa por sala: a cena tem só duas luzes, e o derivador semeava só nelas — sobravam 91 casas).

A PLANTA BATE COM O LIVRO SALA A SALA (lida na arte com a grade numerada):
  T1 a caverna da entrada, com o túnel baixo para oeste     T2 o Salão do Aprofundamento, a escadaria
  T3 a capela menor (as três estátuas, o altar a leste)      T4 o aposento do sacerdote, desabado
  T5 a câmara de treino (os cavaletes ao norte)              T6 o aposento do mestre de treino (o machado)
  T7 o arsenal                                              T8 o cofre, dentro do arsenal (o piso de mosaico)
  T9 a sala de estar (as quatro cadeiras, o sangue)          T10 os sete quartos em volta dela
  T11 a sala comum (os baús a oeste, a abertura entupida)    T12 a cozinha (o forno aceso)
  T13 a despensa                                            T14 a sala de leitura (os três colchonetes)
  T15 o quarto do bibliotecário                             T16 a biblioteca
  T17 a estátua desfigurada, no nicho do salão entulhado     T18 a câmara da purificação (as quatro bacias)
  T19 o salão da procissão (as colunas)                      T20 a entrada da cripta (o disco, a escada)
  T21 o salão de culto (o altar partido, o fragmento)

O QUE O FOUNDRY NÃO TEM E O LIVRO PEDE:
  - a porta entre T13 e T15 é SECRETA no livro (na FA é porta comum): aqui é parede até alguém achá-la;
  - a porta do COFRE (T7/T8) tem três fechaduras: parede até a cena abrir as três;
  - a porta da CRIPTA (T20) só abre com o disco resolvido: parede até lá;
  - o vão do desabamento entre T4 e o cofre só deixa passar quem é Pequeno: rocha até o grupo tirar as pedras.

A arte não entra no repositório nem na publicação (licença da FA); sem ela no disco, o tabuleiro desenha o chão pelo
glifo. Rode: python src/dev/mapa-talhundereth.py   (escreve `src/game/talhundereth-mapa.js` depois das provas no motor)
"""
import importlib.util
import json
import os

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SAIDA = os.path.join(RAIZ, 'src', 'game', 'talhundereth-mapa.js')


def _carregar(nome):
    spec = importlib.util.spec_from_file_location(nome.replace('-', '_'), os.path.join(RAIZ, 'src', 'dev', nome + '.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


Z = _carregar('mapa-zorzula')          # obj, luzes_da_fa, peca, por_aresta
V = _carregar('mapa-cap5-vila-fa')     # provas

# as salas, por retângulos (x0, y0, x1, y1), na ordem em que se testam (a primeira que pega a casa fica com ela)
SALAS = [
    ('T1', (10, 0, 20, 5)),
    ('T6', (28, 5, 31, 8)),
    ('T5', (22, 5, 27, 12)),
    ('T10no', (4, 6, 6, 9)), ('T10n', (8, 6, 10, 9)), ('T10ne', (12, 6, 14, 9)),
    ('T10o', (2, 12, 5, 14)), ('T10se', (11, 14, 14, 16)), ('T10so', (4, 16, 6, 20)), ('T10s', (10, 17, 12, 20)),
    ('T9', (5, 10, 15, 16)),
    ('T2', (16, 5, 19, 22)),
    ('T8', (25, 18, 28, 21)),
    ('T7', (25, 13, 32, 21)),
    ('T3', (20, 11, 23, 20)),
    ('T4', (21, 21, 24, 23)),
    ('T11', (2, 22, 14, 28)),
    ('T12', (3, 29, 8, 33)),
    ('T13', (3, 34, 6, 38)),
    ('T15', (7, 34, 9, 36)),
    ('T14', (10, 33, 16, 36)),
    ('T16', (8, 37, 16, 41)),
    ('T18', (21, 27, 25, 31)),
    ('T20', (21, 32, 26, 34)),
    ('T19', (26, 27, 32, 35)),
    ('T21', (19, 35, 33, 42)),
    ('T17', (9, 28, 20, 33)),
]
LIVRES = set('L_xckdvlE')


def sala_de(x, y):
    for sid, (x0, y0, x1, y1) in SALAS:
        if x0 <= x <= x1 and y0 <= y <= y1:
            return sid
    return None


def montar():
    b = json.load(open(os.path.join(RAIZ, 'src', 'dev', '_tmp', 'talhundereth.json'), encoding='utf-8'))
    terreno = [list(l) for l in b['terreno']]
    w, h = len(terreno[0]), len(terreno)
    # LAJE em todo o templo (a construção anã), CAVERNA no T1 e no túnel oeste
    for y in range(h):
        for x in range(w):
            if terreno[y][x] == '_':
                terreno[y][x] = '_' if sala_de(x, y) == 'T1' else 'L'
    pinta = lambda cs, g: [terreno[y].__setitem__(x, g) for x, y in cs]
    # T2: o muro de pedregulhos do desabamento antigo, no fim da escadaria (terreno difícil)
    pinta([(17, 21), (18, 21), (19, 21), (17, 22), (19, 22)], 'x')
    # a quina de baixo, atrás da parede do entulho, não se alcança: rocha
    pinta([(16, 21), (16, 22)], 'R')
    # T9: as quatro cadeiras de pedra viradas umas para as outras, e o sangue
    pinta([(7, 12), (9, 12), (7, 14), (9, 14)], 'm')
    pinta([(8, 13)], 'v')
    # T3: as três estátuas de gente ajoelhada nos cantos, e o altar na parede leste
    pinta([(21, 15), (23, 15), (23, 19)], 'E')
    pinta([(23, 17)], 'a')
    # T4: a cama de pedra com peles
    pinta([(22, 23)], 'D')
    # T6: a mesa e a cama de pedra
    pinta([(31, 6)], 'm')
    # T11: a mesa longa partida em dois, e os baús de metal empilhados a oeste
    pinta([(6, 25), (7, 25), (9, 25), (10, 25)], 'm')
    pinta([(3, 23), (4, 23), (3, 24)], 'i')
    # T12: as bancadas ficam na arte (a fileira de cima é a passagem da cozinha)
    # os blocos de alvenaria em volta da cozinha e do forno, que a cor tomou por chão (são cinza-claro na arte): rocha
    pinta([(5, 29), (6, 29), (7, 29), (8, 29), (8, 30), (8, 31), (8, 32), (9, 32), (8, 33), (9, 33), (7, 33), (6, 33), (5, 33),
           (10, 33), (9, 34), (11, 33), (10, 32), (11, 32)], 'R')
    # T13: as prateleiras ficam na arte; à esquerda dela, fora da parede, rocha
    pinta([(3, 35), (3, 36), (3, 37)], 'R')
    # T15: a cama larga
    pinta([(7, 34)], 'D')
    # T16: as estantes ao longo das paredes ficam na arte; o pó dos livros no chão
    # T17: o entulho do salão
    pinta([(16, 29), (17, 29), (18, 29)], 'x')
    # o pé do entulho que fica do lado de lá da parede do salão: rocha
    pinta([(13, 29), (14, 29), (15, 29)], 'R')
    # T21: o altar partido (o fragmento em cima)
    pinta([(22, 38)], 'a')
    terreno = [''.join(l) for l in terreno]

    paredes = {lado: list(b['paredes'][lado]) for lado in ('n', 'o')}
    # AS TRÊS PORTAS QUE O ROTEIRO ABRE são parede até lá (`pontos.secretas`): a secreta T13/T15, o cofre e a cripta
    secretas = {
        'bibliotecario': {'a': {'x': 6, 'y': 36}, 'b': {'x': 7, 'y': 36}},
        'cofre': {'a': {'x': 28, 'y': 20}, 'b': {'x': 29, 'y': 20}},
        'cripta': {'a': {'x': 22, 'y': 33}, 'b': {'x': 23, 'y': 33}},
    }
    for s_ in secretas.values():
        Z.por_aresta(paredes, (s_['a']['x'], s_['a']['y']), (s_['b']['x'], s_['b']['y']), '#')

    # as FOLHAS das portas (sem a lista, nenhuma porta abre): toda aresta '+' que sobrou
    folhas = []
    for y in range(h):
        for x in range(w):
            if paredes['n'][y][x] == '+':
                folhas.append([{'x': x, 'y': y - 1}, {'x': x, 'y': y}])
            if paredes['o'][y][x] == '+':
                folhas.append([{'x': x - 1, 'y': y}, {'x': x, 'y': y}])

    # NO ESCURO (o livro: as arandelas estão sem tocha há eras). As duas luzes da FA: o forno da cozinha (a brasa que
    # os drow mantêm) e o brilho verde do fragmento no altar de T21.
    luz = ['0' * w for _ in range(h)]
    luzes = Z.luzes_da_fa(b, trocas={(8, 32): 'braseiro', (22, 39): 'magia'})
    for l in luzes:
        if (l['pos']['x'], l['pos']['y']) == (22, 39):
            l['semChama'] = True
        # a brasa do forno: a FA a pôs no tijolo, aqui ela fica na boca do forno, do lado da cozinha
        if (l['pos']['x'], l['pos']['y']) == (8, 32):
            l['pos'] = {'x': 6, 'y': 31}

    salas = {}
    for y, l in enumerate(terreno):
        for x, g in enumerate(l):
            if g in LIVRES or g in 'maEDsi':
                sid = sala_de(x, y)
                if sid:
                    salas.setdefault(sid, []).append({'x': x, 'y': y})

    sobre = [
        Z.peca('cavaletesVazios', 'talhundereth-cavaletes', 23, 5, 4, 1),
        Z.peca('machadoTirado', 'talhundereth-machado', 29, 8, 3, 1),
        Z.peca('cofreVazio', 'talhundereth-cofre-vazio', 25, 18, 3, 4),
        Z.peca('fornoApagado', 'talhundereth-cozinha-apagada', 4, 30, 5, 3),
        Z.peca('altarSemFragmento', 'talhundereth-altar', 21, 37, 3, 4),
    ]

    mapa = {
        'terreno': terreno, 'luz': luz, 'paredes': paredes, 'folhas': folhas, 'luzes': luzes,
        'tracos': b['tracos'], 'tracosTipo': b.get('tracosTipo') or [None] * len(b['tracos']),
        'interativos': INTERATIVOS, 'sobreposicoes': sobre,
        'fundo': {'nome': 'talhundereth.jpg', 'url': '/mapas/fa/talhundereth.jpg', 'escala': 100, 'x0': 0, 'y0': 0, 'giro': 0, 'opacidade': 1},
    }
    pontos = {
        # quem chega desce a caverna larga do norte
        'grupo': [{'x': 17, 'y': 1}, {'x': 18, 'y': 1}, {'x': 17, 'y': 2}, {'x': 18, 'y': 2}],
        'olhar': {'dx': 0, 'dy': 1},
        'saida': [{'x': 16, 'y': 0}, {'x': 17, 'y': 0}, {'x': 18, 'y': 0}, {'x': 19, 'y': 0}, {'x': 20, 'y': 0}],
        'tunelOeste': {'x': 10, 'y': 4},
        # T2: os dois galeb duhr junto do desabamento, parados como pedra
        'galebs': [{'x': 17, 'y': 20}, {'x': 19, 'y': 20}],
        'portaDaCapela': [{'x': 19, 'y': 17}, {'x': 19, 'y': 18}],
        # T3: a Honna nos encaixes do altar, e o Cameren com a laje e o estilete
        'honna': {'x': 22, 'y': 17}, 'cameren': {'x': 22, 'y': 19},
        # T4: o vão do desabamento para o cofre (rocha até tirarem as pedras)
        'vaoDoCofre': {'x': 25, 'y': 22}, 'pontaDoVao': {'x': 24, 'y': 22}, 'dentroDoCofre': {'x': 25, 'y': 21},
        # T5: o horror de elmo e as duas armaduras, nos cavaletes
        'horror': {'x': 24, 'y': 7}, 'armaduras': [{'x': 23, 'y': 6}, {'x': 26, 'y': 6}],
        'machado': {'x': 30, 'y': 8},
        # T7: os seis mefits e o wight, escondidos
        'mefits': [{'x': 27, 'y': 15}, {'x': 30, 'y': 16}, {'x': 31, 'y': 18}, {'x': 29, 'y': 21}, {'x': 32, 'y': 20}, {'x': 30, 'y': 19}],
        'wight': {'x': 31, 'y': 16},
        'portaDoCofre': {'x': 29, 'y': 20},
        'tesouro': {'x': 26, 'y': 19},
        # T9 e T10: o sangue da cabra, e o Falfark no quarto noroeste com a gêmula de guarda
        'sangue': {'x': 8, 'y': 13},
        'falfark': {'x': 5, 'y': 7}, 'gemulaDoFalfark': {'x': 4, 'y': 8},
        # T11: a armadilha de intelecto atrás dos baús, e o baú da jarra
        'armadilha': {'x': 2, 'y': 25}, 'bauDaJarra': {'x': 4, 'y': 24},
        # T12: a mochila do drow
        'mochila': {'x': 4, 'y': 32},
        # T14 e T15: os três drow e os dois irmãos
        'drows': [{'x': 11, 'y': 35}, {'x': 12, 'y': 34}, {'x': 13, 'y': 35}],
        'irmaos': [{'x': 8, 'y': 35}, {'x': 8, 'y': 36}],
        'mapaDosIrmaos': {'x': 8, 'y': 34},
        # T16: o Livro de Granito, e onde os elementais sobem do chão
        'livro': {'x': 12, 'y': 40}, 'elementais': [{'x': 9, 'y': 39}, {'x': 14, 'y': 39}],
        # T17: a Malinia nos ombros da estátua, e as quatro gêmulas ao pé
        'malinia': {'x': 17, 'y': 32}, 'gemulasDaEstatua': [{'x': 16, 'y': 32}, {'x': 19, 'y': 32}, {'x': 16, 'y': 31}, {'x': 19, 'y': 31}],
        'estatua': {'x': 18, 'y': 32},
        # T18: o Ontharyx e os três, em círculo
        'ontharyx': {'x': 23, 'y': 28}, 'cultistas': [{'x': 22, 'y': 29}, {'x': 24, 'y': 29}, {'x': 23, 'y': 30}],
        'torneira': {'x': 22, 'y': 28},
        # T20: o disco, na parede oeste
        'disco': {'x': 23, 'y': 34}, 'escadaDaCripta': [{'x': 21, 'y': 33}, {'x': 22, 'y': 33}, {'x': 21, 'y': 34}, {'x': 22, 'y': 34}],
        # T21: o aglomerado, do lado oeste, e o fragmento no altar
        'aglomerado': {'x': 20, 'y': 39}, 'fragmento': {'x': 22, 'y': 38},
        'secretas': secretas,
        'salas': salas,
    }
    return mapa, pontos


INTERATIVOS = [
    # T1
    Z.obj(17, 4, 'contrabandista', 'Olhar o rolo de pano', 'Um rolo de pano grosso escora uma das folhas da porta. Dentro, um homem '
          'seco como couro velho, de botas boas e sem bolsa nenhuma: alguém chegou antes de vocês para as moedas.',
          'examinar', 10, 'Morreu há meses, de uma pancada na nuca. Quem o pôs aqui usou o corpo para segurar a porta aberta.'),
    Z.obj(18, 5, 'portaDupla', 'Olhar a porta dupla', 'Duas folhas de pedra do tamanho de três homens, cada uma com uma montanha e '
          'uma gema entalhadas. A dobradiça é de pedra também: os anões não confiavam no ferro para durar.'),
    Z.obj(11, 3, 'tunelBaixo', 'Olhar o túnel baixo', 'Uma fenda na parede da caverna abre um túnel de um metro e meio de altura, '
          'com degraus cavados de vez em quando, descendo para oeste. Pegadas finas e recentes, de botas macias.',
          'rastrear', 13, 'Quatro ou cinco pessoas leves, andando em fila, todas na mesma direção: entraram por aqui, vindas de baixo.'),
    # T2
    Z.obj(17, 9, 'entalhesDoSalao', 'Olhar os entalhes', 'Montanhas, veios de ouro e anões curvados sobre gemas. Em cada patamar, '
          'uma estátua de sacerdote com as mãos fechadas em volta de alguma coisa que ninguém vê.'),
    Z.obj(18, 22, 'desabamento', 'Olhar o desabamento', 'Pedras do tamanho de bois fecham o fim da escadaria. O salão continuava '
          'lá embaixo, antes de o teto vir abaixo.', 'investigar', 12,
          'O desabamento é velho, de séculos, e não foi acidente: as pedras de baixo estão rachadas de dentro para fora, como se '
          'alguma coisa tivesse empurrado a montanha com a mente.'),
    # T3
    Z.obj(21, 16, 'estatuaAjoelhada', 'Olhar a estátua', 'Um homem ajoelhado, de mãos juntas e boca aberta, em pedra cinzenta. O '
          'cinto dele tem uma faca de verdade, de aço, enferrujando na bainha de pedra.', 'investigar', 11,
          'Não é escultura: ninguém esculpe as costuras da roupa e a sujeira das unhas. Isto foi uma pessoa.'),
    Z.obj(23, 18, 'altarDeGemas', 'Olhar o altar', 'Um altar cheio de encaixes vazios, de todos os tamanhos, onde ficavam gemas. '
          'Cada encaixe tem as marcas de um pé de cabra.'),
    # T4
    Z.obj(22, 22, 'camaDeHonna', 'Olhar a cama', 'Uma cama de pedra coberta de peles boas, de lobo e de urso. Um espelho de mão '
          'virado para baixo, quebrado de propósito.'),
    # T5
    Z.obj(25, 9, 'marcasDeGolpes', 'Olhar as paredes', 'Talhos de machado e de espada na pedra, em fileiras, à altura do peito de um '
          'anão. Alguém treinou aqui por muitos anos, sempre os mesmos golpes.'),
    # T6
    Z.obj(30, 8, 'machadoGrande', 'Olhar o machado', 'Um machado grande e surrado num suporte de metal. A lâmina não vale nada. O '
          'cabo, de ferro escuro, tem um botão no punho.', 'investigar', 12,
          'O cabo não é cabo: é uma haste que se trava no ar quando se aperta o botão.'),
    # T7
    Z.obj(31, 17, 'escudosQuebrados', 'Olhar as prateleiras', 'Escudos rachados e virotes tortos, só. Quem saqueou o arsenal levou '
          'o que prestava, e deixou o resto para a poeira.'),
    Z.obj(28, 21, 'fechaduras', 'Olhar a porta do cofre', 'Uma porta de pedra com três montanhas entalhadas, cada uma com uma fechadura '
          'no pico. A do meio está aberta. As outras duas estão cheias de poeira até a boca.'),
    # T9
    Z.obj(8, 13, 'sangueDaCabra', 'Olhar o sangue', 'Uma das cadeiras está coberta de sangue fresco. Ossos espalhados em volta, '
          'roídos e quebrados.', 'examinar', 10,
          'São ossos de cabra, e a cabra foi morta aqui, em cima da cadeira, com uma faca. Ninguém comeu: foi sacrifício.'),
    # T11
    Z.obj(8, 26, 'mesaPartida', 'Olhar a mesa', 'Uma mesa comprida de pedra, partida ao meio de um golpe só. A rachadura sai de '
          'um amassado do tamanho de uma cabeça.'),
    Z.obj(13, 25, 'aberturaEntupida', 'Olhar a abertura', 'Entulho e ossos tapam a abertura maior: ossos de anão e ossos que não '
          'são de anão, compridos demais, com crânios abertos como ovos.'),
    # T12
    Z.obj(6, 31, 'pia', 'Olhar a pia', 'Uma pia de pedra com água limpa até a borda. Enquanto vocês olham, ela se esvazia sozinha, '
          'gorgolejando, e volta a encher.', 'lembrar', 12,
          'Encantamento anão: a pia se esvazia e se enche de água limpa a cada hora. O forno ao lado nunca esfria. As duas são '
          'pesadas demais para levar.', 'Arcanismo'),
    # T13
    Z.obj(5, 36, 'prateleiras', 'Olhar as prateleiras', 'Mantimentos podres, barris e caixas vazios. Cheira a farinha que virou '
          'pedra.'),
    # T16
    Z.obj(14, 38, 'livrosDePo', 'Olhar as estantes', 'Estantes do chão ao teto, com livros que viraram pó. Alguns, de páginas de '
          'metal, ainda estão inteiros: a fé de Dumathoin, lapidação, minas esquecidas, tudo em anão.'),
    # T17
    Z.obj(18, 31, 'estatuaDesfigurada', 'Olhar a estátua', 'Um anão erudito de três metros, sobre um pedestal de quatro e meio. A '
          'cabeça está sendo talhada de novo: o rosto virou uma coisa de muitos olhos, com a boca aberta num grito.'),
    # T18
    Z.obj(22, 27, 'baciaDeFungo', 'Olhar a bacia quebrada', 'A torneira de metal pinga água turva dentro de uma bacia entupida de '
          'fungo cinzento, que cresce enquanto vocês olham.', 'lembrar', 13,
          'O fungo é comestível e a água que passa por ele alimenta. Mas ele está contaminado pela pedra: é disso que os '
          'cultistas vivem, e é isso que os muda.', 'Natureza'),
    # T19
    Z.obj(29, 31, 'colunasDevotas', 'Olhar as colunas', 'Anões devotos de picareta na mão sobem pelas colunas. A pintura sumiu, '
          'menos nos olhos e nas mãos postas, e por isso todos parecem doentes e desconfiados.'),
    # T21
    Z.obj(19, 38, 'reiAnao', 'Olhar a estátua do rei', 'Um rei anão de martelo na mão, entalhado na parede oeste. As colunas em '
          'volta estão quebradas e pretas, como se tivessem queimado por dentro.'),
]


def main():
    um = lambda v: json.dumps(v, ensure_ascii=False, separators=(', ', ': '))
    mapa, pontos = montar()
    prova = {k: v for k, v in pontos.items() if k in ('grupo', 'galebs', 'honna', 'cameren', 'horror', 'armaduras', 'mefits', 'wight',
                                                     'falfark', 'gemulaDoFalfark', 'armadilha', 'drows', 'irmaos', 'elementais',
                                                     'malinia', 'gemulasDaEstatua', 'ontharyx', 'cultistas', 'aglomerado')}
    aberto = json.loads(json.dumps(mapa))
    for lado in ('n', 'o'):
        aberto['paredes'][lado] = [l.replace('+', '/') for l in aberto['paredes'][lado]]
    for s_ in pontos['secretas'].values():
        Z.por_aresta(aberto['paredes'], (s_['a']['x'], s_['a']['y']), (s_['b']['x'], s_['b']['y']), '/')
    V.provas('TALHUNDERETH', aberto, prova, {'aglomerado': 2})
    linhas = ['export const MAPA_TALHUNDERETH = {']
    for k, v in mapa.items():
        if isinstance(v, list) and v and isinstance(v[0], str):
            linhas.append(f'  {k}: [\n' + ''.join(f'    {um(l)},\n' for l in v) + '  ],')
        elif k == 'paredes':
            linhas.append('  paredes: {\n' + ''.join(f'    {lado}: [\n' + ''.join(f'      {um(l)},\n' for l in v[lado]) + '    ],\n' for lado in ('n', 'o')) + '  },')
        elif k in ('interativos', 'folhas', 'luzes', 'sobreposicoes'):
            linhas.append(f'  {k}: [\n' + ''.join(f'    {um(t)},\n' for t in v) + '  ],')
        else:
            linhas.append(f'  {k}: {um(v)},')
    linhas.append('};')
    cabecalho = (
        '// TALHUNDERETH (o Obelisco, capítulo 6), sobre o battlemap da Forgotten Adventures.\n'
        '// GERADO por `src/dev/mapa-talhundereth.py` — mude lá e rode de novo.\n'
    )
    corpo = '\n'.join(linhas) + '\n\nexport const PONTOS_TALHUNDERETH = ' + um(pontos) + ';\n'
    with open(SAIDA, 'w', encoding='utf-8', newline='\n') as f:
        f.write(cabecalho + '\n' + corpo)
    print(f'escrito: {SAIDA}')


if __name__ == '__main__':
    main()
