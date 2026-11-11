"""GERA os mapas das três lutas pequenas do capítulo 5 do Obelisco (`game/obelisco5-mapas.js`) sobre os battlemaps
da Forgotten Adventures.

    python src/dev/importar-foundry.py mapas/_cenas/well-cavern-17x25.json <imagem> --nome caverna-do-poco.jpg \
        --editor src/dev/_tmp/caverna-do-poco.json
    python src/dev/importar-foundry.py mapas/_cenas/goblin-camp-18x23.json <imagem> --nome acampamento-sawplee.jpg \
        --editor src/dev/_tmp/acampamento-sawplee.json
    python src/dev/mapa-cap5-vila-fa.py

O QUE CADA UM É, e de onde saem os pontos (olhando o desenho com a grade por cima, e conferido no motor abaixo):

  a CAVERNA DO POÇO (C1b, a FA "Well Cavern" 17x25): o leito seco do rio subterrâneo. A luz do dia cai pelo poço em
      (6..7, 8..9) — é por ali que o grupo desce pela corda; o lixo e a carniça ficam no canto sul, onde o otyugh
      espera. A caverna é breu na grade; a única luz é a do poço (`luar`: luz fixa, não chama que se apaga).
  o ACAMPAMENTO (C2b, a FA "Goblin Camp" 18x23, de dia): clareira na mata, duas fogueiras (5,10) e (8,15), tendas em
      volta; a trilha entra pelo sudoeste. Ao ar livre, então capim e dia claro.
  o TELHADO (C4b, a FA "Rooftop Stash" 17x22, a arte COM os telhados): a luta é EM CIMA do Gigante Adormecido, que tem
      dois andares. A cena do Foundry deste mapa é do TÉRREO (as paredes de dentro dos prédios), e lá em cima elas não
      valem: o telhado grande da taverna (x 3..10, y 7..12, o andar de cima um pouco mais estreito) vira terreno
      ALTO — quatro níveis, 6 m — e a rua em volta fica embaixo, a mais de um nível, que o motor trata como parede.
      Quem cai do telhado cai na rua. O grupo chega pela chaminé, encostada no lado oeste.

O QUE A CENA DO FOUNDRY NÃO TRAZ, e entra aqui (medido na revisão de 2026-11-08, com `prova-fundo.py` por cima da
arte e `conferir-luzes-fa.mjs`):
  caverna     as PEDRAS GRANDES soltas no leito (11,11), (11,15), (11,16) e (2,10) são cobertura (`r`): sem isso se
              andava através delas. O entulho da represa no alto (4..6, 2) é terreno difícil (`x`).
  acampamento a MATA FECHADA da borda é terreno difícil (`~`): ela sai da diferença entre a arte do dia e a mesma arte
              SEM COPAS (a casa em que mais da metade dos pixels muda é copa). As DUAS FOGUEIRAS (5,10) e (8,15) são
              fogo (`F`) e luz (a FA as dá com 15 pés de claro e 30 de penumbra). As copas cobrem quem passa por
              baixo (`frente`, a máscara pela cor, a mesma do ermo e da emboscada).
  telhado     os OUTROS PRÉDIOS (o galpão de palha, a casa do sudeste, a do sul) barram o passo (`H`), achados pelo
              contorno do telhado no desenho; a carroça (`C`), os caixotes, os barris e os fardos de feno (`o`) são
              cobertura. As duas lanternas de FORA da FA (as outras três são de dentro dos prédios) acendem quando a
              cena escurece (`soNoEscuro`), e a cena escurece se a luta for à noite (`obelisco5-lutas.js`).

A ARTE não entra no repositório nem na publicação (licença da FA): mora em `public/mapas/fa/`, que o `.gitignore`
cobre. Sem ela, as cenas abrem com o ladrilho do glifo.
"""
import json
import os
import subprocess
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TMP = os.path.join(RAIZ, 'src', 'dev', '_tmp')
SAIDA = os.path.join(RAIZ, 'src', 'game', 'obelisco5-mapas.js')


def carregar(nome):
    return json.load(open(os.path.join(TMP, f'{nome}.json'), encoding='utf-8'))


def fundo(nome):
    return {'nome': f'{nome}.jpg', 'url': f'/mapas/fa/{nome}.jpg', 'escala': 100, 'x0': 0, 'y0': 0, 'giro': 0, 'opacidade': 1}


PEDRAS_DA_CAVERNA = [(11, 11), (11, 15), (11, 16), (2, 10)]
ENTULHO_DA_CAVERNA = [(4, 2), (5, 2), (6, 2)]


def trocar(terreno, casas, glifo, so_em=None):
    t = [list(l) for l in terreno]
    for x, y in casas:
        if so_em is None or t[y][x] in so_em:
            t[y][x] = glifo
    return [''.join(l) for l in t]


def caverna():
    b = carregar('caverna-do-poco')
    luzes = [{**l, 'tipo': 'luar'} for l in b['luzes']]
    terreno = trocar(b['terreno'], PEDRAS_DA_CAVERNA, 'r', '_')
    terreno = trocar(terreno, ENTULHO_DA_CAVERNA, 'x', '_')
    mapa = {'terreno': terreno, 'luz': 'escuro', 'luzes': luzes, 'interativos': INTERATIVOS_CAVERNA, 'paredes': b['paredes'], 'tracos': b['tracos'],
            **({'tracosTipo': b['tracosTipo']} if b.get('tracosTipo') else {}), 'fundo': fundo('caverna-do-poco')}
    pontos = {
        'grupo': [{'x': 6, 'y': 9}, {'x': 7, 'y': 9}, {'x': 6, 'y': 10}, {'x': 7, 'y': 10}],
        'olhar': {'dx': 0, 'dy': 1},
        'otyugh': {'x': 5, 'y': 17},
        'luzDoPoco': {'x': 7, 'y': 9},
        'desmoronamento': {'x': 5, 'y': 2},
    }
    return mapa, pontos, {'otyugh': 2}


ARTE_DO_ACAMPAMENTO = os.path.join(RAIZ, 'mapas', 'GoblinCamp', 'FA_Battlemaps', 'GoblinCamp_18x23', 'JPG', '100ppi')
FOGUEIRAS = [(5, 10), (8, 15)]


def copas_do_acampamento(w, h):
    """A casa em que mais da metade dos pixels muda entre a arte do dia e a sem copas é copa de árvore."""
    from PIL import Image, ImageChops
    dia = Image.open(os.path.join(ARTE_DO_ACAMPAMENTO, 'GoblinCamp_Day_Gridless_18x23_100ppi.jpg')).convert('L')
    sem = Image.open(os.path.join(ARTE_DO_ACAMPAMENTO, 'GoblinCamp_Day_NoCanopy_Gridless_18x23_100ppi.jpg')).convert('L')
    dif = ImageChops.difference(dia, sem).point(lambda v: 255 if v > 25 else 0)
    copas = set()
    for y in range(h):
        for x in range(w):
            hist = dif.crop((x * 100, y * 100, x * 100 + 100, y * 100 + 100)).histogram()
            if hist[255] / 10000 > 0.5:
                copas.add((x, y))
    return copas


def acampamento():
    b = carregar('acampamento-sawplee')
    terreno = [l.replace('_', ',') for l in b['terreno']]
    w, h = len(terreno[0]), len(terreno)
    terreno = trocar(terreno, sorted(copas_do_acampamento(w, h)), '~', ',')
    terreno = trocar(terreno, FOGUEIRAS, 'F', ',~')
    luzes = [{'pos': {'x': x, 'y': y}, 'claro': 15, 'penumbra': 15, 'tipo': 'fogueira'} for x, y in FOGUEIRAS]
    mapa = {'terreno': terreno, 'luzes': luzes, 'interativos': INTERATIVOS_ACAMPAMENTO, 'paredes': b['paredes'], 'tracos': b['tracos'],
            **({'tracosTipo': b['tracosTipo']} if b.get('tracosTipo') else {}), 'fundo': fundo('acampamento-sawplee'),
            'frente': {'cor': {'verde': 12, 'escuro': 92}}}
    pontos = {
        'grupo': [{'x': 2, 'y': 20}, {'x': 3, 'y': 20}, {'x': 2, 'y': 21}, {'x': 3, 'y': 21}],
        'olhar': {'dx': 1, 'dy': -1},
        'goblins': [{'x': 5, 'y': 11}, {'x': 4, 'y': 12}, {'x': 7, 'y': 12}],
        'fogueiras': [{'x': 5, 'y': 10}, {'x': 8, 'y': 15}],
    }
    return mapa, pontos, {}


# o telhado grande da taverna: o andar de cima (y 7) é mais estreito que o resto
TELHADO = {(x, y) for y in range(8, 13) for x in range(3, 11)} | {(x, 7) for x in range(4, 10)}


# os outros prédios, pelo contorno do telhado no desenho (em casas, com fração): a casa entra se o centro dela cai dentro
PREDIOS = [
    [(9.9, 1.9), (12.1, 1.9), (12.1, 6.1), (9.9, 6.1)],              # o galpão de palha, ao norte
    [(12.9, 11.2), (16.7, 12.6), (15.0, 16.3), (11.8, 14.6)],         # a casa do sudeste, de viés
    [(7.4, 17.4), (13.1, 18.6), (12.6, 22.0), (7.0, 21.0)],           # a casa do sul, de viés
]
CARROCA = [(13.0, 8.8), (17.0, 10.2), (16.6, 11.6), (13.2, 10.3)]
COBERTURA = [(6, 13), (7, 13), (1, 11), (2, 11), (2, 12), (2, 13), (7, 5), (8, 5), (9, 5)]
LANTERNAS = [(7, 17), (15, 11)]                                     # as de fora; a FA as dá a (7.6,18.8) e (15.5,12.2)


def dentro(pol, x, y):
    c = False
    j = len(pol) - 1
    for i in range(len(pol)):
        (xi, yi), (xj, yj) = pol[i], pol[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            c = not c
        j = i
    return c


def telhado():
    w, h = 17, 22
    t = []
    for y in range(h):
        linha = ''
        for x in range(w):
            cx, cy = x + 0.5, y + 0.5
            if (x, y) in TELHADO:
                linha += '4'
            elif any(dentro(p, cx, cy) for p in PREDIOS):
                linha += 'H'
            elif dentro(CARROCA, cx, cy):
                linha += 'C'
            elif (x, y) in COBERTURA:
                linha += 'o'
            else:
                linha += ':'
        t.append(linha)
    terreno = t
    luzes = []
    for x0, y0 in LANTERNAS:
        # lanterna de parede: a casa de rua mais perto, do lado de fora do prédio
        x, y = min(((x, y) for y in range(h) for x in range(w) if terreno[y][x] == ':'),
                   key=lambda q: (q[0] - x0) ** 2 + (q[1] - y0) ** 2)
        luzes.append({'pos': {'x': x, 'y': y}, 'claro': 15, 'penumbra': 25, 'tipo': 'lanterna', 'soNoEscuro': True})
    mapa = {'terreno': terreno, 'luzes': luzes, 'interativos': INTERATIVOS_TELHADO, 'fundo': fundo('telhado-gigante')}
    pontos = {
        'grupo': [{'x': 3, 'y': 10}, {'x': 3, 'y': 9}, {'x': 3, 'y': 11}, {'x': 4, 'y': 10}],
        'olhar': {'dx': 1, 'dy': 0},
        'chamine': {'x': 2, 'y': 10},
        'comandante': {'x': 9, 'y': 10},
        'lutadores': [{'x': 9, 'y': 8}, {'x': 9, 'y': 12}],
        'saco': {'x': 10, 'y': 10},
    }
    return mapa, pontos, {}


# ---------------------------------------------------------------- o TÉRREO do Gigante Adormecido (C4) ----
# A cena do Foundry do "Rooftop Stash" É o térreo: paredes, janelas e as portas dos quatro prédios. Duas coisas dela
# não servem como vieram:
#   - o BALCÃO do salão é, no Foundry, uma "parede" que barra o passo e deixa ver (as arestas `J` em volta de
#     (7..8, 8..11)). Fechado, ele isolava o fundo do bar e a cozinha, que o importador fez virar rocha. No livro os
#     goblins QUEBRARAM o balcão: aqui ele sai da regra e vira entulho (terreno difícil), e o fundo volta a ser chão;
#   - os interiores dos outros prédios também viraram rocha (bolsão sem saída, porque a derivação trata a porta como
#     fechada). Este mapa é todo ao ar livre: rocha não existe, então tudo volta a ser chão, e as portas separam.
# A FA dá o salão REVIRADO como peça (`Ransacked`, 8x9 a partir de (3,7)): é exatamente a cena do crime, então ele
# nasce aceso. Os telhados dos OUTROS prédios ficam por cima (cobrem quem entra neles, e desbotam onde há ficha); o
# da taverna fica apagado, porque é dentro dela que se anda.
BALCAO_J = {('o', 7, 8), ('o', 8, 8), ('n', 7, 9), ('n', 7, 11)}
BALCAO_QUEBRADO = [(7, 8), (7, 9), (7, 10)]
SALAO = {(x, y) for y in range(8, 13) for x in range(3, 11)}


def terreo():
    b = carregar('telhado-gigante')
    w, h = len(b['terreno'][0]), len(b['terreno'])
    paredes = {lado: [list(l) for l in b['paredes'][lado]] for lado in ('n', 'o')}
    for lado, x, y in BALCAO_J:
        assert paredes[lado][y][x] == 'J', f'o balcão não está onde a cena do Foundry o pôs: {lado} {x},{y} = {paredes[lado][y][x]}'
        paredes[lado][y][x] = '.'
    # os traços do balcão (tipo J dentro do salão) saem também: senão a reta da visão ainda os tomaria por parede
    tracos, tipos = [], []
    for t, tipo in zip(b['tracos'], b.get('tracosTipo') or [None] * len(b['tracos'])):
        if tipo == 'J' and all(3 <= px <= 11 and 7 <= py <= 12 for px, py in t):
            continue
        tracos.append(t)
        tipos.append(tipo)
    # A COZINHA, na cena da FA, é uma caixa fechada nos quatro lados (o traço [[9,8],[9,11],[9.5,11]] e as arestas em
    # volta de (9..10, 8..10)), e o livro manda revistá-la. Abre-se a passagem do fundo do bar para ela: o trecho mais
    # baixo da parede oeste, de y 10 a 11, sai do traço e da grade.
    assert paredes['o'][10][9] == '#', 'a parede da cozinha mudou de lugar na cena do Foundry'
    paredes['o'][10][9] = '.'
    cortados = []
    for t, tipo in zip(tracos, tipos):
        if t == [[9, 8], [9, 11], [9.5, 11]]:
            cortados += [([[9, 8], [9, 10]], tipo), ([[9, 11], [9.5, 11]], tipo)]
        else:
            cortados.append((t, tipo))
    assert len(cortados) == len(tracos) + 1, 'o traço da cozinha mudou na cena do Foundry'
    tracos, tipos = [t for t, _ in cortados], [k for _, k in cortados]
    terreno = []
    for y in range(h):
        terreno.append(''.join('.' if (x, y) in SALAO else ':' for x in range(w)))
    terreno = trocar(terreno, BALCAO_QUEBRADO, 'x')
    luzes = [
        {'pos': {'x': 3, 'y': 10}, 'claro': 10, 'penumbra': 20, 'tipo': 'fogueira'},                 # a lareira do salão
        {'pos': {'x': 6, 'y': 8}, 'claro': 10, 'penumbra': 15, 'tipo': 'lanterna', 'soNoEscuro': True},
        {'pos': {'x': 9, 'y': 11}, 'claro': 10, 'penumbra': 15, 'tipo': 'lanterna', 'soNoEscuro': True},
        {'pos': {'x': 7, 'y': 16}, 'claro': 15, 'penumbra': 25, 'tipo': 'lanterna', 'soNoEscuro': True},
        {'pos': {'x': 15, 'y': 11}, 'claro': 15, 'penumbra': 25, 'tipo': 'lanterna', 'soNoEscuro': True},
    ]
    sobre = [
        {'id': 'revirado', 'url': '/mapas/fa/Ransacked.webp', 'x': 3, 'y': 7, 'w': 8, 'h': 9, 'ligada': True},
        {'id': 'telhadoGalpao', 'url': '/mapas/fa/Roof4.webp', 'x': 9, 'y': 1, 'w': 4, 'h': 6, 'ligada': True, 'frente': True},
        {'id': 'telhadoSudeste', 'url': '/mapas/fa/Roof2.webp', 'x': 11, 'y': 10, 'w': 6, 'h': 7, 'ligada': True, 'frente': True},
        {'id': 'telhadoSul', 'url': '/mapas/fa/Roof3.webp', 'x': 6, 'y': 17, 'w': 7, 'h': 5, 'ligada': True, 'frente': True},
    ]
    # AS FOLHAS das portas: sem a lista, nenhuma porta abre nem fecha (`conferir-cena.mjs` acusa). Uma por porta da grade.
    folhas = []
    for y in range(h):
        for x in range(w):
            if paredes['n'][y][x] == '+':
                folhas.append([{'x': x, 'y': y - 1}, {'x': x, 'y': y}])
            if paredes['o'][y][x] == '+':
                folhas.append([{'x': x - 1, 'y': y}, {'x': x, 'y': y}])
    mapa = {'terreno': terreno, 'luzes': luzes, 'paredes': {k: [''.join(l) for l in v] for k, v in paredes.items()},
            'tracos': tracos, 'tracosTipo': tipos, 'folhas': folhas, 'sobreposicoes': sobre, 'interativos': INTERATIVOS_TERREO,
            'fundo': fundo('gigante-terreo')}
    pontos = {
        'grupo': [{'x': 5, 'y': 5}, {'x': 6, 'y': 5}, {'x': 4, 'y': 5}, {'x': 5, 'y': 4}],
        'olhar': {'dx': 0, 'dy': 1},
        'greska': {'x': 9, 'y': 11},
        'wheel': {'x': 8, 'y': 9},
        'balcao': [{'x': x, 'y': y} for x, y in BALCAO_QUEBRADO],
        'cozinha': [{'x': x, 'y': y} for x in (9, 10) for y in (8, 9, 10)],
        'lareira': {'x': 3, 'y': 10},
        'saida': [{'x': x, 'y': 0} for x in range(w)] + [{'x': 0, 'y': y} for y in range(h)] + [{'x': x, 'y': h - 1} for x in range(w)],
        # AS CASAS DEBAIXO DE CADA TELHADO: a casa cujo centro a arte do telhado cobre (alfa > 128). O telhado some quando
        # um herói entra (`obelisco5-terreo.js`), como o telhado do Foundry, senão o que está dentro fica escondido.
        'telhados': {t['id']: debaixo_do_telhado(t) for t in sobre if t['id'].startswith('telhado')},
    }
    return mapa, pontos, {}


def debaixo_do_telhado(t):
    from PIL import Image
    im = Image.open(os.path.join(RAIZ, 'public', t['url'].lstrip('/'))).convert('RGBA')
    px_x = im.size[0] / t['w']; px_y = im.size[1] / t['h']
    casas = []
    for j in range(t['h']):
        for i in range(t['w']):
            if im.getpixel((int((i + 0.5) * px_x), int((j + 0.5) * px_y)))[3] > 128:
                casas.append({'x': t['x'] + i, 'y': t['y'] + j})
    return casas



# ---------------------------------------------------------------- O CENÁRIO VIVO ----
# Os objetos que a arte desenha e que se pode olhar, revirar ou investigar (`mapa.interativos`: a marca dourada no
# tabuleiro, a ação no botão direito e, quando há, um teste com o verbo do livro). Nem todo tem prêmio: a maioria só diz
# o que a coisa é, conta algo útil ou inútil, ou faz rir. Texto nosso. Cada um numa casa onde a arte desenha a coisa.
def obj(x, y, id_, rotulo, texto, verbo=None, cd=None, achado=None, titulo=None, alcance=None):
    o = {'x': x, 'y': y, 'id': id_, 'rotulo': rotulo, 'texto': texto, **({'alcance': alcance} if alcance else {})}
    if achado:
        o['pista'] = {'verbo': verbo, 'cd': cd, 'achado': achado, **({'titulo': titulo} if titulo else {})}
        o['olhar'] = True  # o texto vale de graça; o teste é o que se acha a mais
    return o


INTERATIVOS_CAVERNA = [
    obj(5, 18, 'lixo', 'Revirar o lixo',
        'Ossos roídos, uma bota sem o par, a carcaça de um gato e uma colher de pau mordida até o meio. Pela marca, é a '
        'colher de servir da Stonehill: o Toblen jura há um mês que alguém a roubou. Ninguém roubou. Caiu no poço.',
        'investigar', 12, 'No fundo da pilha há coisa nova: cascas de pão, um odre furado, um pedaço de pano verde. O lixo '
        'de quem desceu pelo poço há poucos dias — e o otyugh, que comia o que caía, ficou sem saída quando o túnel fechou.',
        'O que o lixo conta'),
    obj(5, 2, 'represa', 'Olhar a represa',
        'Pedras escuras e lama, empilhadas até o teto, fecham o leito do rio subterrâneo. A água que passava aqui com força '
        'agora escorre em fios pelas frestas.',
        'investigar', 10, 'As pedras de baixo têm marcas frescas de picareta, e o teto acima delas foi derrubado de '
        'propósito. Quem fugiu por aqui fechou o caminho atrás de si para ninguém seguir.', 'O desmoronamento'),
    obj(7, 9, 'fundoDoPoco', 'Olhar para cima',
        'Lá em cima, um círculo de céu e a cabeça do Ander, que grita: "Está tudo bem aí embaixo?". Ele não espera a '
        'resposta para gritar de novo.',
        'rastrear', 10, 'No cascalho, pegadas descalças e pequenas, de pé de dedos compridos: cinco ou seis goblins caíram '
        'aqui, se levantaram e correram para o norte, direto para a represa.', 'Quem desceu pelo poço'),
    obj(6, 7, 'destrocos', 'Olhar os destroços',
        'Tábuas quebradas, um pedaço de manivela e um barril sem tampa: o que sobrou do balde e do sarilho do poço, que caíram '
        'junto com alguém. A corda deles foi cortada, não arrebentou.'),
    obj(11, 11, 'pedraLisa', 'Olhar a pedra',
        'Uma pedra de rio, lisa de séculos de água. Na ponta que fica fora do riacho, um sapo seco, achatado e muito '
        'ofendido com a vida.'),
]

INTERATIVOS_ACAMPAMENTO = [
    obj(8, 9, 'tendaChefe', 'Revirar a tenda',
        'Uma tenda remendada com três capas diferentes. Dentro: um cobertor fedorento, um saco de colheres roubadas (onze, '
        'nenhuma igual) e, riscado no couro da parede com carvão, um goblin de cabeça enorme e um cristal saindo dela, '
        'cercado de goblins menores ajoelhados.',
        'investigar', 12, 'O desenho do goblin de cristal é feito com cuidado, como coisa de devoção. Embaixo dele, em '
        'letras de criança, um nome: RUXITID. Escreveram errado o próprio chefe.', 'O desenho na tenda'),
    obj(9, 12, 'tendaRemedios', 'Revirar a tenda',
        'Faixas de pano sujo de sangue, um pote de unguento que cheira a peixe e uma boneca de palha de milho com a cara '
        'pintada. Alguém aqui sentiu falta de casa.'),
    obj(10, 17, 'tendaVazia', 'Revirar a tenda',
        'Vazia, a não ser por um cheiro forte de pé e uma meia de lã pendurada para secar. A meia é de gente grande: '
        'roubada de algum varal de Phandalin.'),
    obj(5, 10, 'panela', 'Olhar a panela',
        'Na fogueira, uma panela de ferro com um caldo grosso de cor indecisa. Algo boia nele. Melhor não saber o quê.',
        'investigar', 10, 'O que boia é uma bota cozida até amolecer. Não se sabe se era para comer ou se caiu.',
        'O ensopado'),
    obj(4, 11, 'sacosDeDormir', 'Olhar os sacos de dormir',
        'Três sacos de dormir pequenos, amassados no formato de quem se deitou ferido de lado. Restos de faixas e um '
        'cheiro de unguento ruim.'),
    obj(7, 13, 'pilha', 'Revirar a pilha',
        'O saque dos goblins, amontoado no meio do acampamento: um cata-vento de galo, a porta de um galinheiro, três '
        'tamancos de pés diferentes e a cabeça de um espantalho, com o chapéu. Nada que valha uma moeda. Tudo roubado de '
        'quintais da vila, pelo jeito por diversão.'),
    obj(6, 15, 'abrigo', 'Olhar o abrigo',
        'Um abrigo de lona azul esticada sobre dois galhos. A lona é a cobertura de uma carroça, e ainda tem pintado o '
        'nome do dono: Barthen. Ele vai gostar de saber onde ela foi parar.'),
    obj(3, 19, 'trilha', 'Olhar a trilha',
        'A trilha por onde vocês vieram, que volta a Phandalin em uma hora de caminhada.',
        'rastrear', 12, 'Mais pegadas SAÍRAM daqui do que voltaram: um grupo grande foi para leste, carregando alguma '
        'coisa pesada, que deixou um sulco no barro. Os sãos levaram a lasca embora e deixaram os feridos para trás.',
        'Para onde foram os outros'),
]

INTERATIVOS_TELHADO = [
    obj(2, 10, 'chamine', 'Olhar a chaminé',
        'Pedra quente e fuligem. Na borda, marcas de mãozinhas pretas: os goblins subiram por aqui antes de vocês.'),
    obj(8, 5, 'fardos', 'Olhar os fardos de feno',
        'Lá embaixo, ao lado do galpão, fardos de feno empilhados. Um gato laranja dorme em cima deles e não acorda nem com '
        'a briga no telhado ao lado.', alcance=30),
    obj(14, 10, 'carroca', 'Olhar a carroça',
        'Na rua, uma carroça carregada de caixotes, de varais no chão, esperando um cavalo que não vem. De cima do telhado '
        'dá para ler o que está escrito num caixote: PREGOS. Em outro: MAIS PREGOS.', alcance=40),
]

INTERATIVOS_TERREO = [
    obj(4, 9, 'mesaDeJantar', 'Olhar a mesa',
        'Uma mesa redonda que ninguém virou: ainda tem pão, um queijo e duas canecas. O queijo tem uma mordida pequena, '
        'de dentes pontudos. Quem mordeu achou ruim e deixou.'),
    obj(8, 8, 'garrafas', 'Olhar as garrafas',
        'Prateleiras de garrafas atrás do que era o balcão, quase todas inteiras. Os goblins quebraram meia taverna e não '
        'tocaram numa gota.',
        'investigar', 10, 'Ninguém que vem roubar uma taverna deixa a bebida. Eles vieram buscar uma coisa só, sabiam onde '
        'ela estava, e o resto foi raiva ou diversão.', 'Por que não levaram nada'),
    obj(9, 8, 'fogao', 'Olhar o fogão',
        'Um fogão de ferro com uma panela de algo que já foi sopa. A Greska cozinha mal e sabe disso; diz que quem quer '
        'comida boa vai à Stonehill.'),
    obj(10, 12, 'barris', 'Bater nos barris',
        'O primeiro soa cheio de cerveja. O segundo, oco. Dentro do oco, um goblin dormindo? Não: uma pilha de batatas '
        'brotando.'),
    obj(3, 8, 'alaude', 'Olhar o alaúde',
        'Um alaúde encostado na parede, com duas cordas arrebentadas. Ninguém na casa toca; ficou de um bardo que não pagou a '
        'conta. A Greska o guarda até ele voltar, o que, diz ela, vai ser nunca.'),
    obj(5, 11, 'mesaDoCanto', 'Olhar a mesa do canto',
        'Canecas pela metade, um prato de ossos e cartas espalhadas, viradas para cima: a partida acabou quando os goblins '
        'entraram. Quem ganhava tinha três reis. Quem perdia teve a sorte de a briga começar bem na hora.'),
    obj(8, 12, 'macas', 'Olhar o cesto',
        'Um cesto de maçãs verdes, azedas de doer o dente. Estão contadas: a Greska as usa numa torta que ninguém pede.'),
]


# A SEGUNDA LEVA (pedido do dono: "tem vários outros itens desenhados"): o resto do que a arte desenha, casa a casa,
# lido nas provas de grade de cada mapa a 100 px por casa.
INTERATIVOS_CAVERNA += [
    obj(7, 8, 'barrilECorda', 'Olhar o barril',
        'Um barrilzinho de água, rachado, e um rolo de corda vermelha encharcada. A corda é nova e boa: alguém da vila '
        'perdeu uma corda de dez moedas tentando tirar o balde lá de cima.'),
    obj(11, 9, 'raizes', 'Olhar as raízes',
        'Raízes grossas furam o teto e descem pela parede até o chão molhado. Lá em cima são as árvores atrás do moinho; '
        'aqui embaixo, um emaranhado onde se poderia pendurar o casaco.',
        'lembrar', 10, 'É carvalho, e velho. Um carvalho desses tem raiz até onde acha água, e foi pela raiz que o riacho '
        'abriu esta caverna: a pedra cede onde a raiz entra primeiro.', 'De onde vem a caverna'),
    obj(11, 14, 'riacho', 'Olhar a água',
        'O riacho corre raso e gelado para o sul e some no escuro, por baixo da rocha. Tem gosto de pedra e de ferro. Pela '
        'cor, dá para beber; pelo cheiro do otyugh rio acima, melhor não.'),
    obj(6, 13, 'papeis', 'Olhar os papéis',
        'Pedaços de papel espalhados pelo cascalho, que a água desbotou. Num deles ainda se lê uma conta da Stonehill: "dois '
        'quartos, uma semana, sopa". Alguém jogou a conta no poço em vez de pagar.'),
    obj(4, 16, 'lixoVelho', 'Olhar o monte',
        'Mais lixo, este velho e assentado: cacos de telha, uma ferradura, o cabo de uma faca e um sapato de criança. Coisas '
        'que caem num poço de vila em cinquenta anos.'),
]

INTERATIVOS_ACAMPAMENTO += [
    obj(8, 15, 'fogueira2', 'Olhar a fogueira',
        'Uma fogueira maior, de toras inteiras, feita para durar a noite. Em volta dela, ossos de coelho limpos e, num espeto, '
        'um pedaço de algo que ninguém teve coragem de comer.'),
    obj(10, 14, 'sacoDoBoneco', 'Olhar o saco de dormir',
        'Num saco de dormir, uma figurinha de gravetos amarrados com barbante: um goblin de cabeça grande. Alguém faz '
        'bonecos do chefe para dormir abraçado.'),
    obj(6, 8, 'sacoDoVigia', 'Olhar o saco de dormir',
        'Este fica afastado dos outros, virado para a mata, com uma pedra de amolar e uma pilha de seixos ao lado: o lugar de '
        'quem ficava de vigia, pronto para atirar pedra em quem chegasse.',
        'rastrear', 10, 'A grama em volta está amassada só de um lado: o vigia passou a noite olhando para leste, de onde os '
        'outros iam voltar, e não para a trilha de Phandalin, de onde vocês vieram.', 'Para onde olhava o vigia'),
    obj(7, 8, 'lenha', 'Olhar a lenha',
        'Galhos quebrados com a mão, nenhum cortado. Os goblins não têm machado, ou têm e não sabem para que serve.'),
    obj(11, 10, 'arvore', 'Olhar a árvore',
        'Um carvalho largo, de copa que cobre metade da clareira. Num galho baixo, alguém amarrou tiras de pano coloridas, '
        'roubadas de varal: enfeite, bandeira ou só porque era bonito.'),
    obj(8, 13, 'trapos', 'Olhar os trapos',
        'Trapos vermelhos embolados ao lado da pilha. Eram uma cortina: ainda têm as argolas. Alguém em Phandalin está com a '
        'janela pelada.'),
]

INTERATIVOS_TELHADO += [
    obj(2, 12, 'barrisDeFora', 'Olhar os barris', 'Lá embaixo, encostados na parede do Gigante, barris vazios esperando a '
        'carroça da cervejaria. Num deles, um machadinho de cozinha fincado na tampa.', alcance=15),
    obj(7, 13, 'caixasDaPorta', 'Olhar os caixotes', 'Embaixo da beira do telhado, junto à porta, caixotes de garrafas '
        'vazias. Uma das garrafas tem um bilhete dentro. Daqui de cima não dá para ler.', alcance=10),
    obj(12, 7, 'carrinho', 'Olhar o carrinho de mão', 'Um carrinho de mão virado de lado, perto do galpão, com a roda para '
        'cima, girando devagar com o vento.', alcance=30),
    obj(15, 16, 'toco', 'Olhar o toco', 'No quintal da casa do sudeste, um toco com um machado cravado. O dono parou de '
        'rachar lenha no meio, e a pilha de toras ao lado está pela metade.', alcance=40),
    obj(6, 17, 'caixotesDoSul', 'Olhar os caixotes', 'Atrás da casa do sul, caixotes empilhados e um jarro de barro. Da altura '
        'do telhado se vê o que não se vê da rua: um dos caixotes está cheio de batatas brotando.', alcance=30),
]

INTERATIVOS_TERREO += [
    # o salão
    obj(3, 12, 'cartaz', 'Olhar a mesa do cartaz',
        'Uma mesa redonda com uma caneca, uma garrafa e um cartaz pregado no tampo, onde alguém o deixou para ler. É do '
        'Harbin Wester: "Recompensa a quem souber dos ladrões". O goblin desenhado no cartaz parece um nabo com dentes.'),
    obj(7, 12, 'folhas', 'Olhar os papéis do chão',
        'Folhas impressas em Neverwinter, de semanas atrás, com o retrato de um nobre de bigode. Ninguém aqui as lê: a '
        'Greska as usa para embrulhar peixe, e cheiram a isso.'),
    obj(3, 7, 'lenhaDaVaranda', 'Olhar a lenha',
        'Na varanda, um caixote de lenha rachada para a lareira, empilhada com capricho. É a única coisa arrumada da '
        'taverna inteira esta manhã.'),
    # a cozinha
    obj(9, 10, 'farinha', 'Olhar os sacos de farinha',
        'Sacos de farinha, um deles rasgado a faca. A farinha espalhada pelo chão de pedra parece neve suja.',
        'rastrear', 10, 'Na farinha há pegadas pequenas e descalças, de dedos compridos: de cinco ou seis pares de pés, '
        'que pisaram aqui, rodaram em volta e saíram correndo.', 'Pegadas na farinha'),
    obj(10, 9, 'temperos', 'Olhar a prateleira',
        'Potes de barro com tampa de pano, cada um com um nome riscado: SAL, SAL, SAL GROSSO, SAL, PIMENTA (vazio). Explica '
        'muito sobre a comida da casa.'),
    # do lado de fora da taverna
    obj(1, 11, 'barrilMesa', 'Olhar o barril',
        'Um barril que serve de mesa ao lado da porta dos fundos. Em cima, um cutelo e uma lista de compras: "farinha, sal, '
        'sal, ovos, sal".'),
    obj(2, 12, 'barrisVazios', 'Bater nos barris', 'Ocos, todos. Esperam a carroça da cervejaria, que só passa uma vez por mês.'),
    obj(7, 13, 'caixasDaPorta', 'Olhar os caixotes',
        'Caixotes de garrafas vazias junto à porta da frente. Numa das garrafas, enrolado, um bilhete: "Greska, devo 3 pc. '
        'Pago semana que vem." A letra é de bêbado, e a data é do ano passado.'),
    obj(8, 13, 'tina', 'Olhar a tina',
        'Uma tina de água da chuva, com uma concha boiando. Serve para lavar as canecas. Ou servia, antes de alguém lavar '
        'os pés nela.'),
    # o galpão
    obj(8, 5, 'fardos', 'Olhar os fardos de feno',
        'Fardos de feno empilhados. Em cima deles, um gato laranja dorme e não abre os olhos para ninguém, nem para vocês.'),
    obj(11, 2, 'cocho', 'Olhar o cocho', 'Um cocho de água limpa, para um cavalo que não está aqui. Ao lado, ferraduras '
        'penduradas num prego, para dar sorte.'),
    obj(9, 3, 'barrilDeAgua', 'Olhar o barril de água', 'Um barril de água com tampa de pano, um saco amarrado e uma caneca '
        'de lata pendurada. A caneca tem uma mordida no aro. Não de cavalo.'),
    obj(11, 5, 'ferramentas', 'Olhar as ferramentas', 'Uma bancada com ancinho, forcado, pá e um rolo de mangueira de couro. '
        'Tudo do Gigante Adormecido, e tudo marcado a ferro com um G torto.'),
    obj(12, 5, 'carvao', 'Olhar o caixote', 'Um caixote de carvão e dois sacos de aveia. Um dos sacos foi roído por baixo: '
        'ratos, e o gato dos fardos não está nem aí.'),
    obj(12, 4, 'roda', 'Olhar a roda', 'Uma roda de carroça com dois raios quebrados, encostada no galpão desde que alguém '
        'prometeu consertá-la.'),
    obj(12, 7, 'carrinho', 'Olhar o carrinho de mão', 'Um carrinho de mão virado, com a roda para cima. Dentro, uma pá de '
        'esterco. Melhor não sentar.'),
    obj(15, 10, 'carroca', 'Olhar a carroça',
        'Uma carroça carregada de caixotes e sacos, de varais no chão. Num caixote, escrito a carvão: PREGOS. No outro: MAIS '
        'PREGOS. Alguém em Phandalin vai construir muita coisa.'),
    # a casa do sudeste
    obj(13, 12, 'camaSE', 'Olhar a cama', 'Uma cama de palha com um cobertor cinza jogado de qualquer jeito. Quem dorme '
        'aqui levantou com pressa ao ouvir a briga da taverna e não voltou para arrumar.'),
    obj(15, 13, 'bancada', 'Olhar a bancada',
        'Uma bancada de carpinteiro: serrote, plaina, martelo, um balde de pregos tortos e uma cadeira pela metade. É a '
        'cadeira nova do Gigante Adormecido, encomendada há um mês.',
        'investigar', 10, 'Na parede, riscos de medida e um desenho a carvão da chaminé do Gigante, que ele consertou no '
        'ano passado: dois palmos de largura por dentro. Um goblin passa folgado; um de vocês passa raspando.', 'A chaminé do Gigante'),
    obj(12, 13, 'prateleiraSE', 'Olhar a prateleira', 'Garrafas de vidro verde, vazias e lavadas, enfileiradas por tamanho. '
        'O dono da casa coleciona garrafas. Ninguém sabe por quê, e ele não diz.'),
    obj(15, 16, 'toco', 'Olhar o toco', 'Um toco com um machado cravado, e uma pilha de toras rachada só pela metade.'),
    # a casa do sul
    obj(10, 18, 'bau', 'Olhar o baú', 'Um baú aberto, com um vestido vermelho dobrado por cima. O vestido é de festa e '
        'nunca foi usado: ainda tem a linha do alfaiate presa na barra.'),
    obj(11, 19, 'camaS', 'Olhar a cama', 'Uma cama larga, arrumada com capricho, com a colcha esticada sem uma ruga. Dá até '
        'pena de olhar demais.'),
    obj(9, 19, 'tapete', 'Olhar o tapete', 'Um tapete verde, grande demais para a sala, com a barra dobrada para caber. Veio '
        'de longe, numa carroça, e é o orgulho da casa.'),
    obj(7, 19, 'caldeirao', 'Olhar o caldeirão', 'Ao pé da lareira, um caldeirão com um resto de sopa de batata, e um cesto '
        'de batatas ao lado. Cheira melhor que a comida do Gigante. Bem melhor.'),
    obj(9, 20, 'prateleiraS', 'Olhar a prateleira', 'Garrafas, uma panela, um livro de capa vermelha e um ferro de passar. O '
        'livro é de receitas, e a página da torta de maçã está marcada com uma fita.'),
    obj(6, 17, 'caixotesDoSul', 'Olhar os caixotes', 'Caixotes empilhados atrás da casa e um jarro de barro com água. Num '
        'dos caixotes, batatas brotando, esquecidas.'),
    obj(8, 18, 'lenhaDoSul', 'Olhar a lenha', 'Toras pequenas empilhadas junto à parede, cortadas todas do mesmo tamanho. '
        'Quem mora aqui é caprichoso até na lenha.'),
]


def provas(nome, mapa, pontos, pegadas):
    """Confere no motor: todo ponto de criatura em chão livre, a pegada inteira, e alcançável do grupo."""
    programa = r'''
import { montarCampo } from 'file:///@BASE@/src/game/campo.js';
const mapa = JSON.parse(process.env.MAPA);
const pontos = JSON.parse(process.env.PONTOS);
const pegadas = JSON.parse(process.env.PEGADAS);
const f = montarCampo(mapa);
const erros = [];
const lista = [];
for (const [k, v] of Object.entries(pontos)) {
  if (['olhar', 'luzDoPoco', 'desmoronamento', 'fogueiras', 'chamine', 'saco', 'saida', 'lareira', 'telhados'].includes(k)) continue;
  for (const [i, p] of [].concat(v).entries()) lista.push([`${k} ${i}`, p, pegadas[k] ?? 1]);
}
for (const [nome, p, lado] of lista) {
  for (let dy = 0; dy < lado; dy++) for (let dx = 0; dx < lado; dx++) {
    if (!f.inside(p.x + dx, p.y + dy) || f.blocksMove(p.x + dx, p.y + dy)) erros.push(`${nome} (${p.x + dx},${p.y + dy}) em casa bloqueada`);
  }
}
const g = pontos.grupo[0];
const alc = f.reachable(g, 100000, () => false);
for (const [nome, p] of lista) if (!alc.has(`${p.x},${p.y}`)) erros.push(`${nome} (${p.x},${p.y}) nao se alcanca do grupo`);
console.log(JSON.stringify(erros));
'''.replace('@BASE@', RAIZ.replace('\\', '/'))
    r = subprocess.run(['node', '--import', './src/dev/cena-node/register.mjs', '--input-type=module', '-e', programa],
                       cwd=RAIZ, capture_output=True, text=True, encoding='utf-8',
                       env={**os.environ, 'MAPA': json.dumps(mapa), 'PONTOS': json.dumps(pontos), 'PEGADAS': json.dumps(pegadas)})
    if r.returncode:
        sys.exit(f'{nome}: o motor falhou\n{r.stderr}')
    erros = json.loads(r.stdout.strip().splitlines()[-1])
    if erros:
        sys.exit(f'{nome}: OS PONTOS NAO BATEM COM O MAPA:\n  - ' + '\n  - '.join(erros))
    print(f'  {nome}: pontos conferidos no motor')


def main():
    um = lambda v: json.dumps(v, ensure_ascii=False, separators=(', ', ': '))
    partes = []
    pontos_todos = {}
    for chave, fn in (('CAVERNA_DO_POCO', caverna), ('ACAMPAMENTO_SAWPLEE', acampamento), ('TELHADO_GIGANTE', telhado),
                      ('GIGANTE_TERREO', terreo)):
        mapa, pontos, pegadas = fn()
        provas(chave, mapa, pontos, pegadas)
        linhas = [f'export const MAPA_{chave} = {{']
        for k, v in mapa.items():
            if isinstance(v, list) and v and isinstance(v[0], str):
                linhas.append(f'  {k}: [\n' + ''.join(f'    {um(l)},\n' for l in v) + '  ],')
            elif k == 'paredes':
                linhas.append('  paredes: {\n' + ''.join(f'    {lado}: [\n' + ''.join(f'      {um(l)},\n' for l in v[lado]) + '    ],\n' for lado in ('n', 'o')) + '  },')
            elif k in ('tracos', 'sobreposicoes', 'interativos'):
                linhas.append(f'  {k}: [\n' + ''.join(f'    {um(t)},\n' for t in v) + '  ],')
            else:
                linhas.append(f'  {k}: {um(v)},')
        linhas.append('};')
        partes.append('\n'.join(linhas))
        pontos_todos[chave] = pontos
    cabecalho = (
        '// AS TRÊS LUTAS PEQUENAS DO CAPÍTULO 5 DO OBELISCO, na vila: a caverna do poço da Barthen, o acampamento dos\n'
        '// goblins feridos e o telhado do Gigante Adormecido — sobre os battlemaps da Forgotten Adventures.\n'
        '//\n'
        '// GERADO por `src/dev/mapa-cap5-vila-fa.py` — mude lá e rode de novo. A ARTE não entra no repositório nem na\n'
        '// publicação (licença da FA).\n'
    )
    corpo = '\n\n'.join(partes) + '\n\nexport const PONTOS_CAP5_VILA = {\n' + ''.join(f'  {k}: {um(v)},\n' for k, v in pontos_todos.items()) + '};\n'
    with open(SAIDA, 'w', encoding='utf-8', newline='\n') as f:
        f.write(cabecalho + '\n' + corpo)
    print(f'escrito: {SAIDA}')


if __name__ == '__main__':
    main()
