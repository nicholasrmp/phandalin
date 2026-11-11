# -*- coding: utf-8 -*-
"""
O CAPÍTULO 6 DO OBELISCO NA VILA: os três tabuleiros das missões, sobre os battlemaps da Forgotten Adventures
("Phandelver Encounters"; as cenas do Foundry do repositório público da FA, em `mapas/_cenas/`, importadas por
`importar-foundry.py --editor src/dev/_tmp/<nome>.json`).

  a CASA DE MARTHUNGRIM (9 x 12, "Marthungrim's Home"): a ruína anã 6 m abaixo do chão, onde três gêmulas encefálicas
      caíram pelo teto. O salão com o entulho da escada desabada debaixo do buraco, o quarto a nordeste, a despensa a
      sudeste e, ao sul, o santuário de Dumathoin com o esqueleto de Marthungrim e o diário.
  a MINA HARDYHAMMER (21 x 15): a boca escondida por entulho e mato, a câmara leste onde o monte errante psiônico
      espera, e a câmara oeste, por uma passagem de UMA casa (o monte é Grande e não entra: é por isso que os mineiros
      estão vivos), com o veio de prata no fundo.
  o LARGO (15 x 20, "Phandalin Alleys"): uma rua da vila entre casas, onde a vaca Daisy entra cambaleando.

A arte não entra no repositório nem na publicação (licença da FA); sem ela no disco, o tabuleiro desenha o chão pelo
glifo. Rode: python src/dev/mapa-cap6-vila-fa.py   (escreve `src/game/obelisco6-mapas.js` depois das provas no motor)
"""
import importlib.util
import json
import os

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SAIDA = os.path.join(RAIZ, 'src', 'game', 'obelisco6-mapas.js')


def _carregar(nome):
    spec = importlib.util.spec_from_file_location(nome.replace('-', '_'), os.path.join(RAIZ, 'src', 'dev', nome + '.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


Z = _carregar('mapa-zorzula')          # luzes_da_fa, fundo, obj, por_aresta
V = _carregar('mapa-cap5-vila-fa')     # provas


def importado(nome):
    return json.load(open(os.path.join(RAIZ, 'src', 'dev', '_tmp', f'{nome}.json'), encoding='utf-8'))


def fundo(nome):
    return {'nome': f'{nome}.jpg', 'url': f'/mapas/fa/{nome}.jpg', 'escala': 100, 'x0': 0, 'y0': 0, 'giro': 0, 'opacidade': 1}


def salas_por_retangulo(terreno, retangulos, livres):
    sala = {}
    for y, l in enumerate(terreno):
        for x, g in enumerate(l):
            if g not in livres:
                continue
            for sid, (x0, y0, x1, y1) in retangulos:
                if x0 <= x <= x1 and y0 <= y <= y1:
                    sala.setdefault(sid, []).append({'x': x, 'y': y})
                    break
    return sala


# --------------------------------------------------------------------------------------------- a casa ----
def casa():
    b = importado('casa-marthungrim')
    terreno = [list(l.replace('_', 'L')) for l in b['terreno']]
    pinta = lambda cs, g: [terreno[y].__setitem__(x, g) for x, y in cs]
    # o ENTULHO da escada desabada, debaixo do buraco do teto (terreno difícil)
    pinta([(2, 3), (3, 3), (4, 3), (2, 4), (3, 4), (4, 4), (2, 5), (3, 5), (4, 5), (3, 6)], 'x')
    # a mesa redonda do salão, a cama do quarto, a laje do santuário com o esqueleto
    pinta([(1, 7), (2, 7)], 'm')
    pinta([(7, 3), (7, 4)], 'D')
    pinta([(3, 9)], 'Q')
    terreno = [''.join(l) for l in terreno]
    # NO ESCURO: 6 m debaixo da terra, só o buraco do teto deixa entrar a luz do dia (a luz da FA, em cima do entulho)
    luz = [''.join('0' for _ in l) for l in terreno]
    mapa = {'terreno': terreno, 'luz': luz, 'paredes': b['paredes'], 'luzes': Z.luzes_da_fa(b), 'tracos': b['tracos'],
            'tracosTipo': b.get('tracosTipo') or [None] * len(b['tracos']), 'interativos': INTERATIVOS_CASA, 'fundo': fundo('casa-marthungrim')}
    salas = salas_por_retangulo(terreno, [('quarto', (5, 1, 7, 4)), ('despensa', (6, 5, 7, 7)), ('sul', (2, 8, 6, 10)),
                                          ('salao', (1, 3, 5, 7))], set('Lx'))
    pontos = {
        # quem desce pela corda cai no alto do entulho, debaixo do buraco
        'grupo': [{'x': 3, 'y': 4}, {'x': 3, 'y': 5}, {'x': 4, 'y': 4}, {'x': 4, 'y': 5}],
        'olhar': {'dx': 0, 'dy': 1},
        # as três gêmulas nos escombros da escada (o livro)...
        'gemulas': [{'x': 2, 'y': 5}, {'x': 4, 'y': 3}, {'x': 3, 'y': 6}],
        # ...e para onde elas recuam quando atacadas de cima (o livro: "para os cômodos em volta")
        'refugios': [{'x': 6, 'y': 2}, {'x': 7, 'y': 6}, {'x': 5, 'y': 9}],
        'corda': {'x': 3, 'y': 4},
        'diario': {'x': 4, 'y': 9},
        'santuario': {'x': 3, 'y': 9},
        'salas': salas,
    }
    return mapa, pontos, {}


INTERATIVOS_CASA = [
    Z.obj(4, 9, 'esqueleto', 'Olhar o esqueleto', 'Os ossos de um anão, deitados ao pé da laje do santuário, ainda de cota de '
          'malha. A mão direita segura um martelo pequeno. A esquerda, um caderno de capa de couro.'),
    Z.obj(3, 10, 'santuarioDumathoin', 'Olhar o santuário', 'Uma laje de pedra entalhada com uma montanha que guarda uma gema '
          'no coração: o símbolo de Dumathoin, o guardião dos segredos debaixo da montanha. Velas de sebo derretidas há muito.',
          'lembrar', 12, 'Dumathoin é o deus anão das coisas escondidas na pedra e do descanso dos mortos. Paladinos dele juram '
          'devolver ao sono os mortos que não descansam.', 'Dumathoin'),
    Z.obj(2, 6, 'grade', 'Olhar a grade', 'Uma grade de ferro caída por cima do entulho, que era a porta de alguma coisa lá em '
          'cima. Torta pela queda.'),
    Z.obj(5, 6, 'cordas', 'Olhar as cordas', 'Cordas e sacos de mineiro, apodrecendo num canto. A corda que vocês trouxeram é '
          'bem mais nova.'),
    Z.obj(6, 2, 'mesaDoQuarto', 'Olhar a escrivaninha', 'Uma escrivaninha com papéis comidos de traça, um tinteiro seco e um '
          'desenho a carvão de uma montanha com um buraco no meio. Embaixo, uma palavra em anão: "Talhundereth".'),
    Z.obj(7, 7, 'caldeirao', 'Olhar o caldeirão', 'Um caldeirão de ferro com um resto preto no fundo, e prateleiras de potes '
          'vazios. Marthungrim cozinhava para um só.'),
    Z.obj(1, 7, 'mesaDoSalao', 'Olhar a mesa', 'Uma mesa redonda com um mapa velho, aberto, preso por quatro pedras. Os nomes '
          'estão em anão e a tinta desbotou.'),
]


# --------------------------------------------------------------------------------------------- a mina ----
def mina():
    b = importado('mina-hardyhammer')
    terreno = [list(l) for l in b['terreno']]
    for y in range(len(terreno)):
        for x in range(len(terreno[0])):
            if terreno[y][x] == '_':
                terreno[y][x] = ',' if y >= 10 else '`'
    pinta = lambda cs, g: [terreno[y].__setitem__(x, g) for x, y in cs]
    # a BOCA escondida (o livro): o entulho e o mato que a tapam
    pinta([(11, 10), (11, 11), (12, 11), (9, 12), (10, 13), (8, 13)], 'r')
    pinta([(5, 11), (6, 11), (5, 12), (13, 12), (14, 12), (14, 11)], '~')
    terreno = [''.join(l) for l in terreno]
    # dentro da mina, o escuro; fora, o dia
    luz = [''.join('2' if y >= 10 else '0' for _ in l) for y, l in enumerate(terreno)]
    mapa = {'terreno': terreno, 'luz': luz, 'paredes': b['paredes'], 'luzes': Z.luzes_da_fa(b), 'tracos': b['tracos'],
            'tracosTipo': b.get('tracosTipo') or [None] * len(b['tracos']), 'interativos': INTERATIVOS_MINA, 'fundo': fundo('mina-hardyhammer')}
    salas = salas_por_retangulo(terreno, [('oeste', (2, 2, 7, 8)), ('leste', (9, 2, 14, 7)), ('boca', (8, 7, 13, 9)),
                                          ('fora', (0, 10, 20, 14))], set('`,~'))
    pontos = {
        'grupo': [{'x': 9, 'y': 13}, {'x': 10, 'y': 12}, {'x': 8, 'y': 12}, {'x': 9, 'y': 14}],
        'olhar': {'dx': 0, 'dy': -1},
        'monte': {'x': 11, 'y': 4},
        'mineiros': [{'x': 4, 'y': 4}, {'x': 5, 'y': 5}, {'x': 4, 'y': 6}],
        'veio': {'x': 3, 'y': 3},
        'salas': salas,
    }
    return mapa, pontos, {'monte': 2}


INTERATIVOS_MINA = [
    Z.obj(9, 9, 'vagonete', 'Olhar o vagonete', 'Um vagonete de mina com a roda solta, tombado na boca do túnel. Lá dentro, uma '
          'picareta e um lampião sem óleo.'),
    Z.obj(9, 5, 'carrinho', 'Olhar o carrinho', 'Um carrinho de mão de madeira, com terra fresca: alguém trabalhava aqui há '
          'pouco tempo.'),
    Z.obj(3, 3, 'veioDePrata', 'Olhar a parede do fundo', 'A parede do fundo da câmara oeste brilha em fios finos quando a luz '
          'bate nela. Prata.',
          'investigar', 10, 'É um veio de verdade, largo e raso: dá para tirar prata daqui por anos, com um bom par de braços.',
          'O veio de prata'),
    Z.obj(12, 12, 'entulho', 'Olhar as pedras', 'Pedras caídas e mato alto tapando metade da boca da mina. Quem não soubesse '
          'que ela estava aqui passaria reto.'),
]


# ---------------------------------------------------------------------------------------------- o largo ----
def largo():
    b = importado('largo-phandalin')
    terreno = [list(l) for l in b['terreno']]
    # a casa do meio, aberta (a arte sem o telhado): por dentro é assoalho, e se entra pelas portas
    casa_do_meio = [(x, y) for y in range(9, 14) for x in range(5, 10)] + [(6, 14)]
    for y in range(len(terreno)):
        for x in range(len(terreno[0])):
            if (x, y) in casa_do_meio and terreno[y][x] == 'R':
                terreno[y][x] = 'U'
            elif terreno[y][x] == '_':
                terreno[y][x] = ':'
    # a pedra da fonte velha (o círculo de pedras do sul) e as carroças
    for c in [(3, 16), (4, 16), (5, 16), (3, 17), (5, 17), (4, 17)]:
        terreno[c[1]][c[0]] = 'r'
    for c in [(2, 9), (3, 9), (2, 10), (3, 10)]:
        terreno[c[1]][c[0]] = 'C'
    terreno = [''.join(l) for l in terreno]
    luz = [''.join('2' for _ in l) for l in terreno]
    folhas = []
    for y in range(len(terreno)):
        for x in range(len(terreno[0])):
            if b['paredes']['n'][y][x] == '+':
                folhas.append([{'x': x, 'y': y - 1}, {'x': x, 'y': y}])
            if b['paredes']['o'][y][x] == '+':
                folhas.append([{'x': x - 1, 'y': y}, {'x': x, 'y': y}])
    mapa = {'terreno': terreno, 'luz': luz, 'paredes': b['paredes'], 'folhas': folhas, 'tracos': b['tracos'],
            'tracosTipo': b.get('tracosTipo') or [None] * len(b['tracos']), 'interativos': INTERATIVOS_LARGO, 'fundo': fundo('largo-phandalin')}
    pontos = {
        'grupo': [{'x': 2, 'y': 4}, {'x': 2, 'y': 5}, {'x': 1, 'y': 4}, {'x': 1, 'y': 5}],
        'olhar': {'dx': 1, 'dy': 0},
        'vaca': {'x': 8, 'y': 5},
        'salas': {},
    }
    return mapa, pontos, {}


INTERATIVOS_LARGO = [
    Z.obj(4, 17, 'pocoVelho', 'Olhar o círculo de pedras', 'As pedras de uma fonte velha que secou, em roda. Crianças fizeram '
          'dela um forte, e há um graveto espetado no meio como bandeira.'),
    Z.obj(8, 1, 'horta', 'Olhar a horta', 'Repolhos enfileirados e um espantalho sem cabeça. A cabeça está na pilha de saque dos '
          'goblins, mas ninguém aqui sabe disso.'),
    Z.obj(2, 10, 'carroca', 'Olhar a carroça', 'Uma carroça de feno com a roda presa por uma pedra. O dono está em algum lugar '
          'contando a história da vaca para quem quiser ouvir.'),
]


def main():
    um = lambda v: json.dumps(v, ensure_ascii=False, separators=(', ', ': '))
    partes = []
    pontos_todos = {}
    for chave, fn in (('CASA_MARTHUNGRIM', casa), ('MINA_HARDYHAMMER', mina), ('LARGO_DA_VACA', largo)):
        mapa, pontos, pegadas = fn()
        prova = {k: v for k, v in pontos.items() if k not in ('salas', 'olhar', 'corda', 'diario', 'santuario', 'veio', 'refugios')}
        aberto = json.loads(json.dumps(mapa))
        for lado in ('n', 'o'):
            aberto['paredes'][lado] = [l.replace('+', '/') for l in aberto['paredes'][lado]]
        V.provas(chave, aberto, prova, pegadas)
        linhas = [f'export const MAPA_{chave} = {{']
        for k, v in mapa.items():
            if isinstance(v, list) and v and isinstance(v[0], str):
                linhas.append(f'  {k}: [\n' + ''.join(f'    {um(l)},\n' for l in v) + '  ],')
            elif k == 'paredes':
                linhas.append('  paredes: {\n' + ''.join(f'    {lado}: [\n' + ''.join(f'      {um(l)},\n' for l in v[lado]) + '    ],\n' for lado in ('n', 'o')) + '  },')
            elif k in ('interativos', 'folhas', 'luzes'):
                linhas.append(f'  {k}: [\n' + ''.join(f'    {um(t)},\n' for t in v) + '  ],')
            else:
                linhas.append(f'  {k}: {um(v)},')
        linhas.append('};')
        partes.append('\n'.join(linhas))
        pontos_todos[chave] = pontos
    cabecalho = (
        '// O CAPÍTULO 6 DO OBELISCO NA VILA: a casa de Marthungrim, a Mina Hardyhammer e o largo da vaca, sobre os battlemaps\n'
        '// da Forgotten Adventures. GERADO por `src/dev/mapa-cap6-vila-fa.py` — mude lá e rode de novo.\n'
    )
    corpo = '\n\n'.join(partes) + '\n\nexport const PONTOS_CAP6_VILA = {\n' + ''.join(f'  {k}: {um(v)},\n' for k, v in pontos_todos.items()) + '};\n'
    with open(SAIDA, 'w', encoding='utf-8', newline='\n') as f:
        f.write(cabecalho + '\n' + corpo)
    print(f'escrito: {SAIDA}')


if __name__ == '__main__':
    main()
