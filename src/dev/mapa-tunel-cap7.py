# -*- coding: utf-8 -*-
"""
O TÚNEL DO CAPÍTULO 7 DO OBELISCO ("Journey through the Deep"): as três cavernas chaveadas da viagem de Phandalin a
Illithinoch, sobre os battlemaps da Forgotten Adventures ("Phandelver Encounters 4": Grell Caves, Behir Lair, Gibbering
Grotto). As cenas do Foundry são as do repositório público da FA (`mapas/_cenas/`, fora do repositório), importadas por:

    python src/dev/importar-foundry.py mapas/_cenas/grell-caves-14x16.json public/mapas/fa/cavernas-grells.jpg \\
        --chao-pela-cor --editor src/dev/_tmp/cavernas-grells.json
    (e o mesmo para behir-lair-15x17 -> toca-behir e gibbering-grotto-16x16 -> gruta-tagarela)

A PLANTA vem da cena (as paredes) e da arte (o chão pela cor); o que a cena não tem sai daqui, e cada ponto é provado no
motor antes de escrever:

  as CAVERNAS DOS GRELLS (14 x 16), J1 a J4: o cruzamento sangrento no túnel do alto (J1); o ABISMO (J2), a faixa
      escura do meio, que a cena da FA fecha com parede (aqui as bordas viram o ponto de onde se escala, CD 12); o covil
      dos grells (J3), o salão de estalagmites à esquerda, todo de terreno difícil; e a despensa (J4) embaixo, com a poça
      escura no canto sudeste.
  a TOCA DO BEHIR (15 x 17), J5 a J7: o túnel principal à esquerda, o cruzamento calcinado (J5) na curva do meio, o salão
      dos ossos (J6) à direita e o recanto dos carniceiros (J7) em cima, de teto baixo (aqui, terreno difícil: anda-se
      curvado). As duas aberturas estreitas para J7 são as paredes "etéreas" da FA (passam os grells, não o behir).
  a GRUTA TAGARELA (16 x 16), J8 a J10: o cruzamento borbulhante no túnel do alto (J8), o poço de carne afundado (J9) e as
      pedras de gancho (J10) na sala de baixo, com a saída para Illithinoch no fundo.

A arte não entra no repositório nem na publicação (licença da FA). Rode: python src/dev/mapa-tunel-cap7.py
(escreve `src/game/tunel-cap7-mapas.js`).
"""
import importlib.util
import json
import os

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SAIDA = os.path.join(RAIZ, 'src', 'game', 'tunel-cap7-mapas.js')


def _carregar(nome):
    spec = importlib.util.spec_from_file_location(nome.replace('-', '_'), os.path.join(RAIZ, 'src', 'dev', nome + '.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


Z = _carregar('mapa-zorzula')          # obj, luzes_da_fa, fundo
V = _carregar('mapa-cap5-vila-fa')     # provas
E = _carregar('mapa-encruzilhada')     # alcancaveis

LIVRES = set('_xVOl')


def importado(nome):
    return json.load(open(os.path.join(RAIZ, 'src', 'dev', '_tmp', f'{nome}.json'), encoding='utf-8'))


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


SUB = 20          # subcasas por casa, na grade fina das paredes
COBRE = 0.35      # a casa é chão quando a inundação cobre ao menos isto dela


def chao_pelas_paredes(b, de):
    """O CHÃO PELA GEOMETRIA DAS PAREDES. As passagens destas cavernas são mais estreitas que uma casa, e a aresta que o
    motor deriva do traço da FA as fechava: o túnel do alto não chegava ao covil dos grells. Aqui as paredes se desenham
    numa grade fina, a inundação sai do grupo, e a casa é chão quando a água cobre `COBRE` dela. Quem barra o passo passa
    a ser a CASA (rocha), e o traço só corta a vista (vira etéreo, `E`)."""
    from PIL import Image, ImageDraw
    w, h = len(b['terreno'][0]), len(b['terreno'])
    im = Image.new('L', (w * SUB, h * SUB), 0)
    d = ImageDraw.Draw(im)
    # a parede ETÉREA da FA (`move: 0`) não barra o passo: é a abertura estreita para J7, por onde os grells passam
    for t, tipo in zip(b['tracos'], b.get('tracosTipo') or [None] * len(b['tracos'])):
        if tipo != 'E':
            d.line([(x * SUB, y * SUB) for x, y in t], fill=255, width=3)
    ImageDraw.floodfill(im, (de[0] * SUB + SUB // 2, de[1] * SUB + SUB // 2), 128)
    import numpy as np
    a = np.asarray(im)
    chao = set()
    for y in range(h):
        for x in range(w):
            q = a[y * SUB:(y + 1) * SUB, x * SUB:(x + 1) * SUB]
            if (q == 128).mean() >= COBRE:
                chao.add((x, y))
    return chao


def base(nome, de):
    """O import da cena: terreno, paredes, traços e as luzes de fungo da FA (chama nenhuma: brilho de fungo não se apaga)."""
    b = importado(nome)
    chao = chao_pelas_paredes(b, de)
    terreno = [['_' if (x, y) in chao else 'R' for x in range(len(b['terreno'][0]))] for y in range(len(b['terreno']))]
    luzes = Z.luzes_da_fa(b)
    for l in luzes:
        l['semChama'] = True
        l['tipo'] = 'magia'
    # O LIVRO: luz fraca em todo o túnel (fungo fosforescente pálido)
    luz = ['1' * len(terreno[0]) for _ in terreno]
    mapa = {
        'terreno': terreno, 'luz': luz,
        # o traço só corta a vista: quem barra o passo é a casa (ver `chao_pelas_paredes`)
        'paredes': {lado: ['.' * len(terreno[0]) for _ in terreno] for lado in ('n', 'o')},
        'tracos': b['tracos'], 'tracosTipo': ['E'] * len(b['tracos']),
        'luzes': luzes, 'fundo': Z.fundo(nome), 'interativos': [],
    }
    return mapa


def fechar_bolsoes(mapa, de):
    """Chão que o motor não alcança a partir do grupo vira rocha (o vão escuro entre as paredes da FA)."""
    t = [''.join(l) if isinstance(l, list) else l for l in mapa['terreno']]
    alc = E.alcancaveis({**mapa, 'terreno': t}, de)
    fechou = 0
    out = []
    for y, l in enumerate(t):
        linha = list(l)
        for x, g in enumerate(linha):
            if g in '_x' and f'{x},{y}' not in alc:
                linha[x] = 'R'
                fechou += 1
        out.append(''.join(linha))
    mapa['terreno'] = out
    return fechou


# ------------------------------------------------------------------------------------------ as cavernas ----
def grells():
    m = base('cavernas-grells', (5, 0))
    t = m['terreno']
    # J2, O ABISMO: rocha (não se anda por ele); atravessa-se pelas bordas, escalando (`tunel-cap7.js`)
    for y in range(7, 10):
        for x in range(6, 14):
            t[y][x] = 'R'
    # J3, o covil: o chão inteiro de estalagmite quebrada é terreno difícil (os grells voam)
    for y in range(2, 10):
        for x in range(1, 8):
            if t[y][x] == '_' and not (y <= 2 and x >= 6):
                t[y][x] = 'x'
    # J4, a poça escura atrás do murete
    for x, y in [(8, 13), (9, 13)]:
        t[y][x] = 'V'
    m['interativos'] = [
        Z.obj(10, 4, 'rastroDeSangue', 'Olhar o rastro', 'Um rastro de sangue seco, largo, como de algo arrastado, entra pela passagem '
              'lateral que desce para o sul. Perto dele, quatro corpos de goblin, roídos até o osso.', 'rastrear', 12,
              'Goblins em fila, e no meio deles pés de gente grande, arrastando-se. Na retaguarda, alguma coisa caiu do teto: '
              'três dos de pé grande foram levados pelo ar, não andando.'),
        Z.obj(10, 6, 'bordaDoAbismo', 'Olhar o abismo', 'A passagem acaba num abismo de uns cinco metros de largura e nove de fundo. '
              'Do outro lado, e de baixo, vem um choro abafado.'),
        Z.obj(4, 4, 'estalagmitesQuebradas', 'Olhar o salão', 'Estalactites e estalagmites quebradas em todo canto, e no chão '
              'entre elas, ossos de bicho e restos de goblin.'),
        Z.obj(9, 12, 'pocaEscura', 'Olhar a poça', 'Uma poça de água escura atrás de um murete de estalagmites. Tem gosto de metal, '
              'mas é boa de beber.'),
    ]
    m['terreno'] = [''.join(l) for l in t]
    pontos = {
        'grupo': [{'x': 5, 'y': 0}, {'x': 6, 'y': 0}, {'x': 5, 'y': 1}, {'x': 6, 'y': 1}], 'olhar': {'dx': 1, 'dy': 0},
        'grells': [{'x': 3, 'y': 3}, {'x': 5, 'y': 3}, {'x': 3, 'y': 6}, {'x': 5, 'y': 6}],
        'presos': [{'x': 5, 'y': 12}, {'x': 6, 'y': 12}, {'x': 6, 'y': 13}],
        'abismoNorte': {'x': 10, 'y': 6}, 'abismoSul': {'x': 10, 'y': 10},
        'entrada': [{'x': 4, 'y': 0}, {'x': 5, 'y': 0}], 'saida': [{'x': 13, 'y': 0}, {'x': 13, 'y': 1}],
    }
    return m, pontos, [('J3', (1, 2, 7, 9)), ('J2', (5, 7, 13, 9)), ('J1', (4, 0, 13, 6)), ('J4', (2, 10, 13, 15))]


def behir():
    m = base('toca-behir', (1, 1))
    t = m['terreno']
    # J7, o recanto de teto baixo: anda-se curvado (decisão nossa: o livro dá 1,5 m de teto e não diz o efeito)
    for y in range(2, 6):
        for x in range(5, 13):
            if t[y][x] == '_':
                t[y][x] = 'x'
    m['interativos'] = [
        Z.obj(3, 8, 'pedraQueimada', 'Olhar as paredes', 'A pedra aqui está raspada e queimada em listras, e o ar cheira a '
              'tempestade.', 'lembrar', 13, 'Listras assim são de um sopro de relâmpago, em linha, de bicho grande. Um behir, '
              'pelo tamanho. E ele mora perto.', 'Natureza'),
        Z.obj(5, 7, 'buracoAlto', 'Olhar o buraco no alto', 'Perto do teto, para o nordeste, uma abertura natural de poucos palmos. '
              'Na borda, a pedra está gasta e lisa, como se algo passasse por ali sempre.'),
        Z.obj(10, 8, 'ninhoDeOssos', 'Olhar o ninho', 'Uma depressão funda na parede, forrada de pedra moída, escamas azuis do tamanho '
              'de um prato e ossos queimados.'),
        Z.obj(9, 2, 'mochilaMofada', 'Olhar a mochila', 'Uma mochila mofada, encostada na parede norte, com a costura podre.'),
    ]
    m['terreno'] = [''.join(l) for l in t]
    pontos = {
        'grupo': [{'x': 1, 'y': 1}, {'x': 1, 'y': 2}, {'x': 0, 'y': 2}, {'x': 2, 'y': 2}], 'olhar': {'dx': 0, 'dy': 1},
        'behir': {'x': 9, 'y': 8},
        'grells': [{'x': 8, 'y': 3}, {'x': 10, 'y': 3}], 'vundru': {'x': 11, 'y': 4},
        'mochila': {'x': 9, 'y': 3}, 'ninho': {'x': 10, 'y': 9},
        'entrada': [{'x': 0, 'y': 0}, {'x': 1, 'y': 0}], 'saida': [{'x': 0, 'y': 13}, {'x': 0, 'y': 12}],
    }
    return m, pontos, [('J7', (4, 1, 12, 6)), ('J6', (7, 7, 13, 15)), ('J5', (2, 6, 6, 14)), ('tunel', (0, 0, 3, 15))]


def gruta():
    m = base('gruta-tagarela', (0, 1))
    t = m['terreno']
    m['interativos'] = [
        Z.obj(3, 1, 'fungoQueMuda', 'Olhar as paredes', 'O fungo das paredes muda de cor devagar, do verde ao roxo, e as pedras suam '
              'um muco transparente. De algum lugar adiante vem um borbulhar sem palavras.'),
        Z.obj(8, 4, 'pocoDeCarne', 'Olhar o poço', 'Lá embaixo, um poço de lama e restos. Bolotas de carne boiam nele, e algumas têm '
              'olhos.', 'percepcao', 15, 'Algumas bolotas piscam. E têm boca.'),
        Z.obj(5, 11, 'pedrasDeGancho', 'Olhar as pedras', 'Estalactites e estalagmites dobradas como barro mole em ganchos, do chão e '
              'do teto. São duras como qualquer pedra.'),
    ]
    m['terreno'] = [''.join(l) for l in t]
    pontos = {
        'grupo': [{'x': 0, 'y': 1}, {'x': 1, 'y': 1}, {'x': 0, 'y': 0}, {'x': 1, 'y': 0}], 'olhar': {'dx': 1, 'dy': 0},
        'bocas': [{'x': 6, 'y': 4}, {'x': 8, 'y': 3}, {'x': 9, 'y': 5}, {'x': 7, 'y': 6}, {'x': 10, 'y': 4}, {'x': 6, 'y': 6}],
        'mutante': {'x': 4, 'y': 11},
        'entrada': [{'x': 0, 'y': 0}, {'x': 0, 'y': 1}], 'saida': [{'x': 8, 'y': 14}],
    }
    return m, pontos, [('J8', (0, 0, 6, 2)), ('J8', (0, 3, 3, 7)), ('J9', (4, 2, 12, 8)), ('J10', (2, 9, 9, 14)), ('passagem', (9, 3, 15, 13))]


def main():
    um = lambda v: json.dumps(v, ensure_ascii=False, separators=(', ', ': '))
    saida = ['// O TÚNEL DO CAPÍTULO 7 DO OBELISCO: as três cavernas da viagem a Illithinoch, sobre os battlemaps da Forgotten Adventures.',
             '// GERADO por `src/dev/mapa-tunel-cap7.py` — mude lá e rode de novo.', '']
    pegadas = {'behir': 3, 'mutante': 2}
    tudo = {}
    for chave, fn in (('CAVERNAS_GRELLS', grells), ('TOCA_BEHIR', behir), ('GRUTA_TAGARELA', gruta)):
        mapa, pontos, retangulos = fn()
        fechou = fechar_bolsoes(mapa, pontos['grupo'][0])
        pontos['salas'] = salas_de(mapa['terreno'], retangulos)
        prova = {k: v for k, v in pontos.items() if k not in ('salas', 'olhar')}
        V.provas(chave, mapa, prova, pegadas)
        print(f'{chave}: {fechou} casas de bolsão viraram rocha; salas ' + ', '.join(f'{k} {len(v)}' for k, v in pontos['salas'].items()))
        tudo[chave] = pontos
        linhas = [f'export const MAPA_{chave} = {{']
        for k, v in mapa.items():
            if isinstance(v, list) and v and isinstance(v[0], str):
                linhas.append(f'  {k}: [\n' + ''.join(f'    {um(l)},\n' for l in v) + '  ],')
            elif k == 'paredes':
                linhas.append('  paredes: {\n' + ''.join(f'    {lado}: [\n' + ''.join(f'      {um(l)},\n' for l in v[lado]) + '    ],\n' for lado in ('n', 'o')) + '  },')
            elif k in ('interativos', 'luzes', 'tracos'):
                linhas.append(f'  {k}: [\n' + ''.join(f'    {um(t)},\n' for t in v) + '  ],')
            else:
                linhas.append(f'  {k}: {um(v)},')
        linhas.append('};')
        saida += linhas + ['']
    saida.append('export const PONTOS_TUNEL7 = ' + um(tudo) + ';')
    with open(SAIDA, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(saida) + '\n')
    print(f'escrito: {SAIDA}')


if __name__ == '__main__':
    main()
