# -*- coding: utf-8 -*-
"""
O REPOUSO DE ZORZULA (capítulo 5 do Obelisco), a partir das cenas do Foundry da Forgotten Adventures
(`mapas/_cenas/zorzulas-rest-*.json`, importadas por `importar-foundry.py --editor src/dev/_tmp/zorzula-*.json`).

A ARTE é a da FA, grátis ("Zorzula's Rest": `mapas/Zorzulas_Rest/`, copiada para `public/mapas/fa/`; nenhuma das duas
pastas entra no repositório). Ela cai 1 para 1 na planta da cena do Foundry (100 px por casa, origem 0,0), e foi medida
com `prova-fundo.py`. O que vem do Foundry é a PLANTA — paredes, portas, a secreta, os janelões —; o que vem da ARTE são
os móveis, a lava (a casa de azul vivo) e a água da fonte; e o que vem do livro é o que cada sala FAZ.

O POSTO (o nível de cima, 33 x 20): a faixa de fora (Z1), o portão, o vestíbulo (Z2), o refeitório (Z3) e o corredor
de baixo, o dormitório (Z4) com o poço do elevador, as latrinas (Z5) e a fonte termal atrás da secreta (Z6), a forja
(Z7) com os janelões para o mar de lava, a cozinha (Z8) com a despensa (Z9) e o túnel da Bessie, a suíte do capitão
(Z10) e o cofre (Z11) atrás das runas.

Rode: python src/dev/mapa-zorzula.py   (escreve `src/game/zorzula-mapas.js`, depois de provar os pontos no motor)
"""
import importlib.util
import json
import os
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SAIDA = os.path.join(RAIZ, 'src', 'game', 'zorzula-mapas.js')

# as provas no motor são as mesmas das lutas da vila
_spec = importlib.util.spec_from_file_location('vila', os.path.join(RAIZ, 'src', 'dev', 'mapa-cap5-vila-fa.py'))
_vila = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_vila)


def carregar(nome):
    return json.load(open(os.path.join(RAIZ, 'src', 'dev', '_tmp', f'zorzula-{nome}.json'), encoding='utf-8'))


def inundar(w, h, semente, passa):
    """As casas alcançáveis de `semente`, andando de casa em casa enquanto `passa(a, b)` deixar."""
    vistos = {semente}
    fila = [semente]
    while fila:
        x, y = fila.pop()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            q = (x + dx, y + dy)
            if 0 <= q[0] < w and 0 <= q[1] < h and q not in vistos and passa((x, y), q):
                vistos.add(q)
                fila.append(q)
    return vistos


def aresta(par, a, b):
    """O glifo da aresta entre duas casas vizinhas (`paredes.n` guarda a de cima, `paredes.o` a da esquerda)."""
    (ax, ay), (bx, by) = a, b
    if ax == bx:
        y = max(ay, by)
        return par['n'][y][ax]
    x = max(ax, bx)
    return par['o'][ay][x]


def por_aresta(par, a, b, glifo):
    (ax, ay), (bx, by) = a, b
    if ax == bx:
        lado, x, y = 'n', ax, max(ay, by)
    else:
        lado, x, y = 'o', max(ax, bx), ay
    linha = par[lado][y]
    par[lado][y] = linha[:x] + glifo + linha[x + 1:]


ARTE_DO_POSTO = os.path.join(RAIZ, 'public', 'mapas', 'fa', 'zorzula-posto.jpg')
_imagens = {}


def eh_lava(caminho, casa):
    """A casa é lava na arte? A lava do Zorzula é AZUL VIVO: azul alto, claro, bem acima do vermelho."""
    from PIL import Image
    if caminho not in _imagens:
        _imagens[caminho] = Image.open(caminho).convert('RGB')
    im = _imagens[caminho]
    x, y = casa
    r = g = b = 0
    n = 0
    for dy in range(10, 100, 20):
        for dx in range(10, 100, 20):
            pr, pg, pb = im.getpixel((x * 100 + dx, y * 100 + dy))
            r += pr; g += pg; b += pb; n += 1
    r, g, b = r / n, g / n, b / n
    return b > 55 and b > r + 45   # medido: a lava dá 59..210 de azul com vermelho perto de zero; a pedra, azul menos de 45 acima do vermelho


def luzes_da_fa(b, trocas=None, fora=()):
    """AS LUZES DA CENA DO FOUNDRY, como o importador as traduziu (cor, cone, claro e penumbra). `trocas` muda o tipo de uma
    luz pela casa; `fora` tira as que não fazem nada aqui (a luz da lua lá fora, de dia)."""
    out = []
    for l in b['luzes']:
        k = (l['pos']['x'], l['pos']['y'])
        if k in fora:
            continue
        l = dict(l)
        if trocas and k in trocas:
            l['tipo'] = trocas[k]
        # A LAVA E O CRISTAL NÃO SE APAGAM: a luz do sulco de lava, da cascata e do cristal ilumina sem ser chama
        # (`semChama`, `game/fogo.js`). Só o que é fogo de verdade (o fogão da cozinha) ganha o botão de apagar.
        if l['tipo'] not in ('fogueira', 'tocha', 'braseiro', 'lanterna'):
            l['semChama'] = True
        out.append(l)
    return out


def peca(id_, nome, x, y, w, h, ligada=False):
    """Uma PEÇA DE ARTE do pacote da FA que o roteiro acende (`mapa.sobreposicoes`): o suporte vazio, o cofre vazio."""
    return {'id': id_, 'url': f'/mapas/fa/{nome}.jpg', 'x': x, 'y': y, 'w': w, 'h': h, 'ligada': ligada}


# O TÚNEL LATERAL das minas, casa a casa (lido da peça "Tunnel3" sobre a arte)
TUNEL_LATERAL = [(22, 6), (22, 7), (22, 9), (22, 10), (21, 10)]


def cortar_tracos(tracos, tipos, fora):
    """Corta de cada polilinha os segmentos cujo meio cai onde `fora(x, y)`; o resto vira polilinhas separadas."""
    novos, novos_tipos = [], []
    for t, tp in zip(tracos, tipos):
        atual = [t[0]]
        for a, b in zip(t, t[1:]):
            if fora((a[0] + b[0]) / 2, (a[1] + b[1]) / 2):
                if len(atual) > 1:
                    novos.append(atual); novos_tipos.append(tp)
                atual = [b]
            else:
                atual.append(b)
        if len(atual) > 1:
            novos.append(atual); novos_tipos.append(tp)
    return novos, novos_tipos


def fundo(nome):
    return {'nome': f'{nome}.jpg', 'url': f'/mapas/fa/{nome}.jpg', 'escala': 100, 'x0': 0, 'y0': 0, 'giro': 0, 'opacidade': 1}


def obj(x, y, id_, rotulo, texto, verbo=None, cd=None, achado=None, titulo=None, alcance=None, oculto=False):
    o = {'x': x, 'y': y, 'id': id_, 'rotulo': rotulo, 'texto': texto, **({'alcance': alcance} if alcance else {}),
         **({'oculto': True} if oculto else {})}
    if achado:
        o['pista'] = {'verbo': verbo, 'cd': cd, 'achado': achado, **({'titulo': titulo} if titulo else {})}
        o['olhar'] = True
    return o


# ------------------------------------------------------------------------------------------------- o posto ----
SALAS_DO_POSTO = {
    # id: (semente, o que é)
    'Z1': ((16, 1), 'a faixa de fora, ao pé do paredão'),
    'Z2': ((15, 5), 'o vestíbulo'),
    'Z4': ((6, 12), 'o dormitório'),
    'Z5': ((10, 9), 'as latrinas'),
    'Z6': ((6, 6), 'a fonte termal'),
    'Z7': ((15, 15), 'a forja do mirante'),
    'Z8': ((21, 9), 'a cozinha'),
    'Z10': ((25, 10), 'a suíte do capitão'),
}


def posto():
    b = carregar('outpost-33x20')
    w, h = len(b['terreno'][0]), len(b['terreno'])
    par = {k: list(v) for k, v in b['paredes'].items()}

    # O PORTÃO: a FA o faz de duas portas, uma em cada face da passagem. O livro tem uma porta dupla só: fica a de
    # fora (aresta norte da casa 3), e a passagem (15,3)-(16,3) é chão.
    for x in (15, 16):
        por_aresta(par, (x, 3), (x, 4), '.')
    # A PORTA DA FA ENTRE A SUÍTE E A QUINA DO COFRE abriria o cofre sem as runas: vira parede. O cofre é o de três
    # casas (24..26, 7), atrás da secreta (25,8).
    por_aresta(par, (23, 7), (23, 8), '#')
    for x in (24, 25, 26):
        por_aresta(par, (x, 7), (x, 8), '#' if x != 25 else '+')
    por_aresta(par, (23, 7), (24, 7), '#')
    por_aresta(par, (26, 7), (27, 7), '#')
    for x in (24, 25, 26):
        por_aresta(par, (x, 6), (x, 7), '#')
    # OS JANELÕES DA FORJA: a FA os faz de parede invisível (só barra o passo). Janela: barra o passo e o som, deixa
    # a vista e a luz — o mar de lava se vê de dentro.
    for lado in ('n', 'o'):
        par[lado] = [l.replace('I', 'W') for l in par[lado]]
    # AS SETEIRAS (o livro): uma de cada lado do portão, a 3 m do chão, com o parapeito por dentro.
    por_aresta(par, (13, 3), (13, 4), 'J')
    por_aresta(par, (18, 3), (18, 4), 'J')
    # A JANELA da cozinha para o refeitório (o livro: um lado vê o outro).
    por_aresta(par, (19, 9), (20, 9), 'W')
    # A FORJA FECHA A LESTE: a FA deixa uma fresta em (23,14) para a encosta, e por ela a forja vazava para o lado de
    # fora inteiro. O livro não dá saída nenhuma à forja além da porta barricada e da esteira.
    por_aresta(par, (22, 14), (23, 14), '#')

    portas = lambda g: g in '+'
    barra = lambda a, b: aresta(par, a, b) not in '.'
    sala = {}
    for sid, (sem, _) in SALAS_DO_POSTO.items():
        for c in inundar(w, h, sem, lambda a, b2: not barra(a, b2)):
            sala.setdefault(c, sid)
    # o vestíbulo, o refeitório e o corredor são uma área só na planta: separa-se por linha
    for (x, y), sid in list(sala.items()):
        if sid == 'Z2':
            sala[(x, y)] = 'Z2' if y <= 6 else ('Z3' if y <= 11 else 'corredor')
    sala[(15, 3)] = sala[(16, 3)] = 'Z2'
    for x in (24, 25, 26):
        sala[(x, 7)] = 'Z11'
    sala[(22, 7)] = 'Z9'
    sala[(21, 7)] = 'Z9'
    sala[(22, 6)] = 'Z9'

    # O TÚNEL DA BESSIE (Z9): da despensa (22,7) ao lado de fora (22,5), engatinhando. Aberto DEPOIS das salas, senão
    # a faixa de fora entrava na cozinha pelo túnel.
    por_aresta(par, (22, 5), (22, 6), '.')
    por_aresta(par, (22, 6), (22, 7), '.')
    por_aresta(par, (21, 6), (22, 6), '#')
    por_aresta(par, (22, 6), (23, 6), '#')

    # O MAR DE LAVA (atrás dos janelões) e o que fica fora de tudo. Entre o que fica de fora, é lava a casa que a ARTE
    # pinta de azul vivo; o resto é a encosta de pedra escura, que não se pisa (a primeira versão, sem a arte, fazia lava
    # de tudo o que ficava ao sul dos janelões, e a pedra dos dois lados virava lava).
    fora = inundar(w, h, (16, 19), lambda a, b2: not barra(a, b2) and b2 not in sala)
    lava = {c for c in fora if eh_lava(ARTE_DO_POSTO, c)}
    terreno = []
    luz = []
    for y in range(h):
        lt, ll = [], []
        for x in range(w):
            s = sala.get((x, y))
            if s == 'Z1':
                lt.append('k'); ll.append('2')
            elif s:
                # por dentro, quem acende é a LUZ da FA (os sulcos de lava azul): a grade fica no escuro
                lt.append('L'); ll.append('0')
            elif (x, y) in lava:
                lt.append('('); ll.append('2')
            else:
                lt.append('R'); ll.append('0')
        terreno.append(lt)
        luz.append(ll)

    def pinta(cs, g):
        for x, y in cs:
            terreno[y][x] = g

    # a fonte termal: água funda, 4,5 m (nada-se)
    pinta([c for c, s in sala.items() if s == 'Z6'], '_')
    pinta([(x, y) for x in (6, 7, 8) for y in (6, 7)], 'W')
    # o poço do elevador quebrado, 9 m até a mina (Z12)
    pinta([(4, 10)], 'O')
    sala[(4, 10)] = 'Z4'
    # o túnel da Bessie: engatinha-se
    pinta([(22, 6)], 'x')
    # O REFEITÓRIO: três mesas compridas de pedra, com bancos dos dois lados. Na ARTE (a 100 px por casa) a mesa do
    # meio enche a fileira 9, e as outras duas caem EM CIMA de uma linha da grade (entre 7 e 8, entre 10 e 11): nenhuma
    # casa as representa. A do meio é casa de mesa; as duas da linha são ARESTA de mesa — barram o passo, deixam ver e dão
    # cobertura a quem está do outro lado, como a seteira (`J`), e sobre o mapa pintado não se desenham. Assim os bancos
    # (as fileiras 7, 8, 10 e 11) ficam livres para quem come.
    pinta([(x, 9) for x in range(14, 19)], 'm')
    for x in range(14, 19):
        por_aresta(par, (x, 7), (x, 8), 'J')
        por_aresta(par, (x, 10), (x, 11), 'J')
    # O DORMITÓRIO: beliches (passa-se por cima)
    pinta([(5, 9), (6, 9), (7, 9), (8, 9), (5, 12), (5, 13), (5, 14), (5, 15), (8, 13), (8, 14)], 'z')
    # AS LATRINAS: o cocho de água turva no meio
    pinta([(10, 9)], 'V')
    # A FORJA: as três bigornas de pedra, o fosso de cristal e o entulho ao pé da esteira
    pinta([(14, 15), (16, 15), (18, 15)], 'o')
    pinta([(15, 16), (16, 16)], 'o')
    pinta([(21, 13), (22, 13)], 'x')
    # A COZINHA: o fogão aceso e os sacos; a despensa: barris e caixotes
    pinta([(20, 7)], 'e')
    pinta([(20, 9), (20, 10), (22, 8), (22, 9), (22, 10)], 's')
    pinta([(22, 7)], 's')
    # A SUÍTE: a cama de dossel e a escrivaninha
    pinta([(26, 8), (26, 9)], 'D')
    pinta([(24, 8)], 'm')

    terreno = [''.join(l) for l in terreno]
    luz = [''.join(l) for l in luz]
    # AS FOLHAS das portas (sem elas nenhuma porta abre)
    folhas = []
    for y in range(h):
        for x in range(w):
            if par['n'][y][x] == '+':
                folhas.append([{'x': x, 'y': y - 1}, {'x': x, 'y': y}])
            if par['o'][y][x] == '+':
                folhas.append([{'x': x - 1, 'y': y}, {'x': x, 'y': y}])
    # As DUAS SECRETAS são parede até alguém achá-las, e então a cena abre a aresta (como as da Mansão): a das
    # latrinas para a fonte e a das runas para o cofre.
    secretas = {'fonte': {'a': {'x': 8, 'y': 7}, 'b': {'x': 9, 'y': 7}}, 'cofre': {'a': {'x': 25, 'y': 7}, 'b': {'x': 25, 'y': 8}}}
    for s_ in secretas.values():
        por_aresta(par, (s_['a']['x'], s_['a']['y']), (s_['b']['x'], s_['b']['y']), '#')
    # a secreta não é porta: aberta, vira vão, e não tem folha
    pares_secretos = [sorted([(s_['a']['x'], s_['a']['y']), (s_['b']['x'], s_['b']['y'])]) for s_ in secretas.values()]
    folhas = [f for f in folhas if sorted([(f[0]['x'], f[0]['y']), (f[1]['x'], f[1]['y'])]) not in pares_secretos]
    # As trancas: a porta da suíte (Destreza 15 com ferramentas, Força 15 para arrombar; a chave é do Ruxithid).
    trancas = [{'aresta': '23,12,O', 'cd': 15, 'forca': 15, 'chave': 'chaveDaSuite'}]

    salas = {}
    for (x, y), s in sala.items():
        salas.setdefault(s, []).append({'x': x, 'y': y})
    for v in salas.values():
        v.sort(key=lambda c: (c['y'], c['x']))

    mapa = {
        'terreno': terreno, 'luz': luz, 'paredes': {k: v for k, v in par.items()}, 'folhas': folhas,
        'trancas': trancas, 'interativos': INTERATIVOS_POSTO + INTERATIVOS_POSTO_MAIS, 'fundo': fundo('zorzula-posto'),
        # as 18 luzes da cena do Foundry, menos as duas de luar lá fora (de dia não acendem nada); a do fogão da cozinha
        # é fogo (apaga-se), e a do fosso de cristal da forja é cristal (não se apaga)
        'luzes': luzes_da_fa(b, trocas={(20, 7): 'fogueira', (16, 16): 'magica'}, fora={(7, 1), (23, 1)}),
        # as peças do pacote: o que se tira da forja e do cofre deixa o lugar vazio no desenho
        'sobreposicoes': [peca('semArmadura', 'zorzula-sem-armadura', 9, 14, 1, 1), peca('semLanca', 'zorzula-sem-lanca', 13, 13, 2, 1),
                          peca('semEspada', 'zorzula-sem-espada', 16, 13, 2, 1), peca('semTesouro', 'zorzula-sem-tesouro', 24, 7, 3, 1),
                          # O PARAPEITO (o livro: liga as duas seteiras, por cima da porta, com a alavanca). A FA o dá como
                          # peça de cima; aqui ele fica aceso e por BAIXO das fichas, porque os vigias ficam em cima dele
                          peca('parapeito', 'zorzula-parapeito', 13, 3, 6, 3, ligada=True)],
    }
    pontos = {
        'grupo': [{'x': 15, 'y': 1}, {'x': 16, 'y': 1}, {'x': 14, 'y': 1}, {'x': 17, 'y': 1}],
        'olhar': {'dx': 0, 'dy': 1},
        'vigias': [{'x': 13, 'y': 4}, {'x': 18, 'y': 4}],
        # OS BANCOS (o livro: comendo à mesa): as fileiras 7 e 8 em volta da primeira mesa, 10 e 11 em volta da última;
        # quem sobra fica de pé nas pontas
        'refeitorio': [{'x': x, 'y': y} for y in (7, 8, 10, 11) for x in range(14, 19)] + [{'x': x, 'y': y} for y in (7, 8, 10, 11) for x in (13, 19)],
        'dormitorio': [{'x': 5, 'y': 9}, {'x': 7, 'y': 9}, {'x': 5, 'y': 13}, {'x': 5, 'y': 15}, {'x': 8, 'y': 14}, {'x': 6, 'y': 9}],
        # o livro: "imitam o trabalho de forja" — um em cada bigorna de pedra
        'ferais': [{'x': 14, 'y': 14}, {'x': 16, 'y': 14}, {'x': 18, 'y': 14}],
        'bessie': {'x': 21, 'y': 9},
        'alavanca': {'x': 15, 'y': 4},
        'portao': [{'x': 15, 'y': 3}, {'x': 16, 'y': 3}],
        'elevador': {'x': 4, 'y': 10},
        'esteira': {'x': 20, 'y': 14},
        'fonte': {'x': 6, 'y': 6},
        'runas': {'x': 25, 'y': 8},
        'jarro': {'x': 23, 'y': 10},
        'cama': {'x': 26, 'y': 8},
        'escrivaninha': {'x': 24, 'y': 8},
        'cofre': [{'x': 24, 'y': 7}, {'x': 25, 'y': 7}, {'x': 26, 'y': 7}],
        'despensa': {'x': 21, 'y': 7},
        'tunel': {'x': 22, 'y': 6},
        'salas': salas,
        'secretas': secretas,
    }
    return mapa, pontos, {}


# ---------------------------------------------------------------------------------------------- as minas ----
ARTE_DAS_MINAS = os.path.join(RAIZ, 'public', 'mapas', 'fa', 'zorzula-minas.jpg')


def cor_media(caminho, casa):
    from PIL import Image
    if caminho not in _imagens:
        _imagens[caminho] = Image.open(caminho).convert('RGB')
    im = _imagens[caminho]
    x, y = casa
    px = [im.getpixel((x * 100 + dx, y * 100 + dy)) for dx in range(10, 100, 20) for dy in range(10, 100, 20)]
    return tuple(sum(p[i] for p in px) / len(px) for i in range(3))


# AS SALAS DAS MINAS, por retângulo na arte (a cena do Foundry não as separa: é uma caverna só, aberta):
#   Z12 a boca do elevador e o nó dos três túneis; Z13 a câmara dos vagonetes (o túnel de cima, com os esqueletos e
#   os vagonetes); Z16 a fossa (a caverna marrom de esgoto); Z17 o santuário de Ilsensine (a caverninha redonda com o
#   pedestal octogonal); Z18 o depósito (a caverna grande da direita, com a esteira e os caixotes); Z14 a caverna de
#   cristal (a roxa); Z15 a mina do penhasco (a passarela de madeira sobre a lava); Z19 a ponte até a pirâmide.
SALAS_DAS_MINAS = [
    ('Z19', (16, 13, 16, 18)),
    ('Z15', (10, 11, 23, 12)),
    ('Z12', (3, 4, 7, 9)),
    ('Z17', (19, 1, 23, 3)),
    ('Z13', (8, 1, 19, 4)),
    ('Z16', (8, 5, 21, 10)),
    ('Z18', (23, 2, 32, 17)),
    ('Z14', (3, 10, 10, 18)),
]


def minas():
    b = carregar('mines-33x25')
    w, h = len(b['terreno'][0]), len(b['terreno'])
    par = {k: list(v) for k, v in b['paredes'].items()}
    terreno = [list(l) for l in b['terreno']]
    for y in range(h):
        for x in range(w):
            if terreno[y][x] == 'R':
                continue
            r, g, bb = cor_media(ARTE_DAS_MINAS, (x, y))
            m = (r + g + bb) / 3
            roxo = bb > r + 15 and r > g + 10
            if bb > 45 and bb > r + 25 and not roxo:
                terreno[y][x] = '('                  # a lava, e a borda escura dela
            elif m < 16:
                terreno[y][x] = 'R'                  # o breu de fora da caverna
            elif r > bb + 12 and g > bb + 8 and 5 <= y <= 10 and 8 <= x <= 21:
                terreno[y][x] = 'w'                  # o esgoto da fossa: meio metro de água suja
            else:
                terreno[y][x] = '`'                  # chão de mina
    # À MÃO, o que a cor confunde com a lava: a PONTE de pedra (16, 13..17) e a PIRÂMIDE (14..18, 18..22), que é
    # estrutura (não se entra: a porta dela é a fechadura psíquica, na casa (16,18)).
    for y in range(13, 18):
        terreno[y][16] = '='
    for y in range(18, 23):
        for x in range(14, 19):
            terreno[y][x] = 'M'
    # a porta da FA fica DENTRO da pirâmide (16,18)-(16,19): aqui a pirâmide é maciça e a fechadura é roteiro
    for lado in ('n', 'o'):
        par[lado] = [l.replace('+', '#') for l in par[lado]]
    # a borda do penhasco: a mureta de grade e o paredão debaixo da passarela (10..23, 13), menos a ponte
    for x in range(10, 24):
        if x != 16:
            terreno[13][x] = 'R'
    # o PEDESTAL do santuário de Ilsensine (a estátua quebrada) e os VAGONETES parados no túnel
    for c in [(21, 2), (22, 2)]:
        terreno[c[1]][c[0]] = 'a'
    for c in [(12, 2), (11, 4), (15, 3)]:
        terreno[c[1]][c[0]] = 'o'
    # os ESQUELETOS dos anões, no chão (decalque: pisa-se em cima)
    for c in [(8, 3), (10, 3), (11, 3)]:
        terreno[c[1]][c[0]] = 'c'
    # os CAIXOTES e barris do depósito
    for c in [(27, 3), (28, 4), (28, 7), (28, 8), (29, 12), (29, 15)]:
        terreno[c[1]][c[0]] = 'i'
    # O TÚNEL LATERAL (a peça "Tunnel3" da FA; o livro: "túneis menores, livres para o mestre"): do túnel de cima ao
    # penhasco, em linha reta pela pedra, em x = 22. As outras duas peças de túnel da FA ficam de fora: a 1 refaz a fossa
    # e a 2 apaga o santuário de Ilsensine, duas salas do livro.
    for c in TUNEL_LATERAL:
        terreno[c[1]][c[0]] = '`'
    for y in range(6, 12):
        por_aresta(par, (22, y - 1), (22, y), '.')
    por_aresta(par, (21, 10), (22, 10), '.')
    por_aresta(par, (21, 10), (21, 11), '.')
    # O CHÃO QUE NINGUÉM ALCANÇA vira pedra: a borda escura da lava que a cor não pegou, solta no meio do lago.
    bloqueia = set('R(Moia')
    barra = lambda a, b2: aresta(par, a, b2) not in '.'
    alcance = inundar(w, h, (6, 6), lambda a, b2: not barra(a, b2) and terreno[b2[1]][b2[0]] not in bloqueia)
    for y in range(h):
        for x in range(w):
            if terreno[y][x] in '`wc=' and (x, y) not in alcance:
                terreno[y][x] = 'R'
    terreno = [''.join(l) for l in terreno]

    sala = {}
    for y in range(h):
        for x in range(w):
            if terreno[y][x] in 'R(M':
                continue
            for sid, (x0, y0, x1, y1) in SALAS_DAS_MINAS:
                if x0 <= x <= x1 and y0 <= y <= y1:
                    sala[(x, y)] = sid
                    break
            else:
                sala[(x, y)] = 'tunel'
    # A LUZ: os túneis no escuro (o livro); a lava brilha, e quem está a até duas casas dela fica na penumbra; a caverna
    # de cristal tem a luz roxa dos próprios cristais.
    # A LUZ: a lava brilha sozinha; o resto, no escuro, é aceso pelas LUZES da FA (o brilho da lava sobre a passarela e
    # a ponte, o roxo dos cristais). Os túneis de mina ficam no breu, como o livro manda.
    luz = [''.join('2' if terreno[y][x] == '(' else '0' for x in range(w)) for y in range(h)]
    salas = {}
    for (x, y), s_ in sala.items():
        salas.setdefault(s_, []).append({'x': x, 'y': y})
    for v in salas.values():
        v.sort(key=lambda c: (c['y'], c['x']))
    # O TRAÇO da FA (a parede como foi desenhada, em curva): a VISÃO e a luz seguem o contorno da caverna, e não os
    # degraus das casas. Corta-se o traço onde o túnel lateral atravessa a pedra, e a porta de dentro da pirâmide vira
    # parede (a pirâmide é maciça; a fechadura é roteiro).
    tracos, tipos = cortar_tracos(b['tracos'], b['tracosTipo'], lambda x, y: 21.5 <= x <= 23.0 and 5.5 <= y <= 11.0)
    tipos = [None if t == '+' else t for t in tipos]
    mapa = {'terreno': terreno, 'luz': luz, 'paredes': par, 'interativos': INTERATIVOS_MINAS + INTERATIVOS_MINAS_MAIS, 'fundo': fundo('zorzula-minas'),
            'luzes': luzes_da_fa(b), 'tracos': tracos, 'tracosTipo': tipos,
            'sobreposicoes': [peca('tunelLateral', 'zorzula-tunel-lateral', 20, 5, 5, 7, ligada=True)]}
    pontos = {
        'grupo': [{'x': 6, 'y': 6}, {'x': 7, 'y': 6}, {'x': 5, 'y': 6}, {'x': 5, 'y': 7}],
        'olhar': {'dx': 1, 'dy': 0},
        'elevador': {'x': 4, 'y': 6},
        'cristais': [{'x': 5, 'y': 12}, {'x': 4, 'y': 14}, {'x': 7, 'y': 17}, {'x': 9, 'y': 16}, {'x': 6, 'y': 10}],
        'chegadaEsteira': [{'x': 26, 'y': 9}, {'x': 27, 'y': 9}, {'x': 26, 'y': 8}, {'x': 25, 'y': 9}],
        'chegadaPlataforma': [{'x': 16, 'y': 16}, {'x': 16, 'y': 15}, {'x': 16, 'y': 14}, {'x': 15, 'y': 12}],
        'gricks': [{'x': 6, 'y': 12}, {'x': 8, 'y': 16}, {'x': 5, 'y': 15}],
        'ferais': [{'x': 12, 'y': 12}, {'x': 14, 'y': 11}, {'x': 18, 'y': 12}],
        'psionicos': [{'x': 13, 'y': 11}, {'x': 19, 'y': 11}, {'x': 21, 'y': 12}],
        'otyugh': {'x': 15, 'y': 7},
        'broca': {'x': 25, 'y': 5},
        'esqueletos': [{'x': 8, 'y': 3}, {'x': 10, 'y': 3}, {'x': 11, 'y': 3}],
        'vagonetes': [{'x': 12, 'y': 2}, {'x': 11, 'y': 4}, {'x': 15, 'y': 3}],
        'pedestal': {'x': 21, 'y': 2},
        'caixotes': [{'x': 27, 'y': 3}, {'x': 28, 'y': 4}, {'x': 29, 'y': 12}],
        'esteira': {'x': 26, 'y': 11},
        'fechadura': {'x': 16, 'y': 18},
        'salas': salas,
    }
    return mapa, pontos, {'otyugh': 2, 'broca': 3}


INTERATIVOS_MINAS_MAIS = [
    obj(13, 9, 'pedraDaFossa2', 'Olhar a outra pedra', 'Outra pedra redonda no esgoto, menor. Esta é pedra mesmo. Tem '
        'certeza? Tem. Quase.'),
    obj(28, 13, 'escadas', 'Olhar as escadas', 'Escadas de mão encostadas e caídas pelo chão do depósito, uma delas '
        'quebrada no meio. Usavam-nas para alcançar os baldes da esteira.'),
    obj(28, 9, 'barrisDeposito', 'Olhar os barris', 'Barris de água para os mineiros, com um caneco de lata preso por uma '
        'corrente. A água é velha, mas é água.'),
    obj(29, 14, 'sacos', 'Olhar os sacos', 'Sacos de lona com pó de rocha e uma pá enfiada num deles. O trabalho parou no '
        'meio de um dia qualquer.'),
    obj(12, 12, 'passarela', 'Olhar a passarela', 'Tábuas pregadas no paredão, sobre um trilho de vagonete. Algumas estão '
        'soltas, e lá embaixo, nove metros abaixo, a lava. Melhor não pular.'),
    obj(14, 2, 'trilhoDeCima', 'Olhar o vagonete virado', 'Um vagonete caído de lado, com minério derramado. As rodas ainda '
        'giram se alguém der um empurrão.'),
    obj(6, 15, 'cristalDoChao', 'Olhar o chão de cristal', 'O chão da caverna brilha roxo por baixo da poeira, e zumbe '
        'baixinho quando alguém pisa forte. O trilho desce em caracol pelo meio.'),
]


INTERATIVOS_MINAS = [
    obj(4, 6, 'plataforma', 'Olhar a plataforma', 'Uma plataforma de pedra com grade de ferro, no fundo do poço do '
        'elevador. Lá em cima, nove metros acima, a luz azul do dormitório.'),
    obj(9, 4, 'teias', 'Olhar as teias', 'Teias velhas e grossas atravessam o túnel de parede a parede, cheias de poeira. '
        'A aranha que as fez foi embora há muito tempo, ou não foi.'),
    obj(18, 3, 'trilhos', 'Olhar os trilhos', 'Trilhos de ferro que somem nas duas pontas do túnel. Numa delas, uma '
        'alavanca de desvio enferrujada, travada no meio do caminho.'),
    obj(18, 7, 'pedraDaFossa', 'Olhar a pedra', 'Uma pedra redonda no meio do esgoto, coberta de uma crosta que se '
        'mexe devagar quando ninguém está olhando direto.'),
    obj(26, 12, 'esteiraDeBaixo', 'Olhar a esteira', 'A ponta de baixo da esteira de baldes, num laço de trilhos sobre '
        'rolos. Ela sobe pelo teto até a forja, lá em cima. Parada, com baldes cheios de minério esquecidos.'),
    obj(16, 14, 'ponte', 'Olhar a ponte', 'Uma ponte estreita de pedra lavrada sobre a lava, que vai dar numa pirâmide '
        'de obsidiana. O calor sobe pelos lados como de uma boca de forno.'),
    obj(16, 18, 'piramide', 'Olhar a porta da pirâmide', 'Uma porta dupla de obsidiana coberta de relevos: anões '
        'festejando, anões cuidando de feridos. No centro, canais circulares que brilham verde.',
        'lembrar', 15, 'É uma fechadura de mente: só se abre com dano psíquico, e o brilho verde cresce com cada golpe. '
        'Quem a fez queria que só os de mente forte passassem.', 'A fechadura psíquica'),
]


# ------------------------------------------------------------------------------------ o Santuário Índigo ----
def santuario():
    b = carregar('indigo-sanctum-21x25')
    w, h = len(b['terreno'][0]), len(b['terreno'])
    par = {k: [l.replace('I', '.') for l in v] for k, v in b['paredes'].items()}
    terreno = [list(l.replace('_', 'L')) for l in b['terreno']]
    # A LAVA (o livro: duas cascatas ladeiam a entrada e iluminam o lugar). Na planta da FA são os contornos de
    # parede invisível: os dois canais em gancho do salão, as duas cascatas ao lado do elevador e o lago lá embaixo,
    # fora do "U" de pedra onde a plataforma chega.
    lava = {(6, y) for y in range(5, 12)} | {(14, y) for y in range(5, 12)} | {(7, 4), (13, 4)}
    lava |= {(6, y) for y in range(14, 19)} | {(14, y) for y in range(14, 19)}
    dentro_do_u = {(x, 19) for x in range(8, 13)} | {(x, 20) for x in range(9, 12)}
    for y in range(19, h):
        for x in range(w):
            if terreno[y][x] in 'LR' and (x, y) not in dentro_do_u and (y >= 20 or terreno[y][x] == 'L'):
                if terreno[y][x] == 'L' or (y in (20, 21, 22) and 4 <= x <= 16):
                    lava.add((x, y))
    for x, y in lava:
        terreno[y][x] = '('
    for x, y in [(x, y) for y in range(h) for x in range(w) if terreno[y][x] == '(']:
        pass
    luz = [''.join('2' if c == '(' else '0' for c in l) for l in terreno]
    terreno = [''.join(l) for l in terreno]
    salas = {}
    for y in range(h):
        for x in range(w):
            if terreno[y][x] != 'L':
                continue
            s_ = 'oeste' if (x <= 4 and y >= 11) else 'leste' if (x >= 16 and y >= 11) else 'elevador' if (9 <= x <= 11 and y >= 17) else 'salao'
            salas.setdefault(s_, []).append({'x': x, 'y': y})
    # a mesa da sala de guerra (a arte)
    for x, y in [(18, 15), (18, 16)]:
        terreno[y] = terreno[y][:x] + 'm' + terreno[y][x + 1:]
    mapa = {'terreno': terreno, 'luz': luz, 'paredes': par, 'interativos': INTERATIVOS_SANTUARIO + INTERATIVOS_SANTUARIO_MAIS, 'fundo': fundo('santuario-indigo'),
            # as 15 luzes da FA: as cascatas, o brilho do salão e as duas alas
            'luzes': luzes_da_fa(b),
            # O PEDESTAL, quando a estátua desce para lutar: com a energia verde enquanto o Ruxithid a comanda, apagado
            # depois que ele morre. E o POÇO VAZIO, quando a plataforma está lá embaixo, na ponte.
            'sobreposicoes': [peca('pedestalVazio', 'santuario-pedestal-vazio', 9, 7, 3, 3), peca('pedestalEnergia', 'santuario-pedestal-energia', 9, 7, 3, 3),
                              peca('pocoVazio', 'santuario-poco-vazio', 9, 17, 3, 3)],
            # o traço da FA (as quinas em diagonal do salão); a parede invisível da borda da lava não corta a visão
            'tracos': b['tracos'], 'tracosTipo': b['tracosTipo']}
    pontos = {
        'grupo': [{'x': 10, 'y': 18}, {'x': 9, 'y': 18}, {'x': 11, 'y': 18}, {'x': 10, 'y': 19}],
        'olhar': {'dx': 0, 'dy': -1},
        'presos': [{'x': 2, 'y': 14}, {'x': 3, 'y': 14}, {'x': 2, 'y': 15}, {'x': 3, 'y': 15}],
        'refens': [{'x': 2, 'y': 17}, {'x': 3, 'y': 17}, {'x': 4, 'y': 17}],
        'ruxithid': {'x': 10, 'y': 4},
        'guardiao': {'x': 9, 'y': 7},
        'mapaDeGuerra': {'x': 18, 'y': 15},
        'salas': salas,
    }
    return mapa, pontos, {'guardiao': 2}


INTERATIVOS_SANTUARIO_MAIS = [
    obj(8, 14, 'relevoOeste', 'Olhar o relevo do chão', 'Um rosto de anão enorme, de barba trançada, esculpido no chão e '
        'gasto por séculos de pés. Do outro lado, o mesmo rosto, espelhado. Os dois olham para a estátua.'),
    obj(10, 4, 'mezanino', 'Olhar o mezanino', 'Um patamar alto atrás da estátua, com o chão de pedra lisa e uma mancha '
        'mais clara onde alguém se sentava todo dia, sempre no mesmo lugar, virado para a parede.'),
    obj(4, 4, 'escadaOeste', 'Olhar a escada', 'Degraus largos que sobem pela quina até o mezanino. Os de baixo estão '
        'gastos; os de cima, intactos: quase ninguém subia.'),
    obj(10, 18, 'plataformaSantuario', 'Olhar a plataforma', 'Um octógono de pedra com o rosto de um anão gravado, que '
        'desce e sobe pelo poço sozinho. Para no lugar com um baque surdo.'),
]


INTERATIVOS_SANTUARIO = [
    obj(10, 10, 'estatua', 'Olhar o pedestal', 'Uma estátua enorme de uma anã sorrindo, de braços abertos, rachada de cima a '
        'baixo. Quem a esculpiu gostava dela.',
        'lembrar', 12, 'Os duergar não fazem estátua de quem sorri. Esta é mais velha que eles aqui: de anões do escudo, de '
        'antes da conquista, e alguém a pôs para trabalhar.', 'A estátua'),
    obj(6, 13, 'cascata', 'Olhar a cascata', 'Lava azul-arroxeada desce pela parede como água e some num canal, sem respingar. '
        'O calor arde no rosto a três metros.'),
    obj(18, 15, 'mapaDeGuerra', 'Olhar a mesa', 'Uma mesa de pedra com um mapa tosco da região, cheio de setas a carvão e '
        'três nomes escritos em letra caprichada: Travessia da Forca, Cripta dos Talhund e Talhundereth.',
        'investigar', 15, 'Embaixo do mapa, um esboço de uma coluna de pedra partida em sete pedaços: quatro riscados, '
        'três circulados.', 'O esboço da coluna'),
    obj(3, 12, 'cordas', 'Olhar as cordas', 'Cordas, correntes de ferro presas em argolas na parede e três esteiras de palha '
        'imunda. Um balde de água e outro que não é de água.'),
]


INTERATIVOS_POSTO_MAIS = [
    obj(13, 5, 'escadaCaracolO', 'Olhar a escada em caracol', 'Uma escada de pedra em caracol, apertada, que sobe até o '
        'parapeito das seteiras. Cada degrau tem um entalhe para o pé de um anão, pequeno demais para qualquer outro.'),
    obj(15, 5, 'painelDeRunas', 'Olhar o painel de runas', 'No chão, junto da porta, um painel de pedra com linhas de luz '
        'azul em forma de seta, que apontam para dentro. Brilham mais forte quando alguém passa.'),
    obj(9, 14, 'suporteArmadura', 'Olhar o suporte de armadura', 'Um suporte de madeira com um peitoral de bronze, sem as '
        'tiras de couro, esperando um dono.'),
    obj(16, 13, 'espadaNaParede', 'Olhar a espada na parede', 'Uma espada longa presa na parede por dois ganchos, com '
        'filigrana de prata no copo e o fio ainda por fazer. Ficou pela metade, como tudo nesta forja.'),
    obj(14, 15, 'bigorna', 'Olhar a bigorna', 'Uma bigorna de pedra preta, gasta no meio por séculos de martelo. Ainda está '
        'quente ao toque, e ninguém forja aqui há muito tempo.'),
    obj(15, 16, 'fossoDeCristal', 'Olhar o fosso de cristal', 'Um fosso raso cheio de lascas de cristal azul que brilham '
        'sozinhas. Restos do minério que a esteira trazia lá de baixo.'),
    obj(11, 15, 'trilhosForja', 'Olhar os trilhos', 'Trilhos sobre rolos de ferro que fazem uma volta inteira pela forja: era '
        'por aqui que os baldes carregados passavam pelas bigornas.'),
    obj(24, 10, 'livros', 'Olhar os livros no chão', 'Livros jogados no chão da suíte, abertos, com páginas arrancadas. Estão '
        'em anão, e alguém marcou a carvão, em goblin, o que achava importante: quase tudo sobre cristais.'),
    obj(24, 12, 'bauQuebrado', 'Olhar o baú quebrado', 'Um baú de ferro arrombado, vazio a não ser por uma bota velha e um '
        'monte de areia. Alguém já esteve aqui antes de vocês, e não achou o cofre.'),
    obj(7, 14, 'corda', 'Olhar o rolo de corda', 'Um rolo de corda jogado entre os beliches, com um nó de forca malfeito na '
        'ponta. Brincadeira de goblin, espera-se.'),
]


INTERATIVOS_POSTO = [
    obj(16, 2, 'portaoFora', 'Olhar o portão',
        'Duas folhas de pedra lisa e escura, sem maçaneta nem fechadura do lado de fora, encaixadas no paredão. Uma de '
        'cada lado, a três metros do chão, uma fenda estreita na rocha: seteiras.',
        'investigar', 12, 'A pedra está gasta só na metade de baixo, na altura de quem a empurra: abre-se no braço, '
        'devagar, e quem a abre de dentro usa outra coisa — há um sulco de corrente no alto, sumindo pela rocha.',
        'Como o portão abre'),
    obj(12, 1, 'cascalho', 'Olhar o chão',
        'Cascalho preto, quente sob as botas, e nem um fio de mato. O ar treme acima das pedras e cheira a ovo podre.'),
    obj(21, 4, 'buracoBessie', 'Olhar a toca', 'Um buraco cavado na encosta, largo o bastante para alguém passar de '
        'gatinhas. As marcas de unha são grandes e paralelas: um bicho que cava muito e bem.',
        'rastrear', 12, 'As pegadas na terra fofa são de texugo — um texugo do tamanho de um cachorro grande — e vão e '
        'voltam muitas vezes. Ele mora lá dentro e sai para comer.', 'Quem cavou'),
    obj(15, 9, 'mesas', 'Olhar as mesas', 'Três mesas compridas de pedra, gastas por séculos de cotovelos. Os bancos '
        'são de anão: baixos demais para quase todo mundo e altos demais para um goblin, que senta de pernas balançando.'),
    obj(6, 11, 'beliches', 'Olhar os beliches', 'Beliches de pedra com colchões de palha nova sobre a velha. Cobertores '
        'roubados de Phandalin, um de cada cor. Debaixo de um, uma coleção de botões.'),
    obj(4, 10, 'pocoElevador', 'Olhar o poço', 'Um poço quadrado na parede, fechado por uma treliça de metal, que desce '
        'no escuro. Corre um ar morno lá de baixo. Uma plataforma de pedra está presa lá embaixo, torta.',
        'investigar', 10, 'O mecanismo está na parede: engrenagens de bronze e, no centro, um cristal iridescente rachado e '
        'apagado. É ele que movia a plataforma. Sem energia, o elevador não sobe nem desce.', 'O elevador quebrado'),
    obj(10, 8, 'latrina', 'Olhar as latrinas', 'Bancos de pedra com furos sobre uma vala. O cheiro dispensa descrição; '
        'alguém escreveu na parede, em goblin, o que parece ser uma lista de quem não lava as mãos.'),
    obj(6, 7, 'fonte', 'Olhar a fonte', 'Um poço natural de água turquesa, quente, com vapor subindo devagar até um '
        'buraco no teto, muito alto. A água é limpa e funda.',
        'lembrar', 12, 'Fonte termal: quem fica de molho nela se recupera mais depressa, e o buraco lá no alto é um '
        'respiradouro natural que sai na encosta — dá para subir por ele, mas é uma escalada difícil.', 'A fonte termal'),
    obj(14, 16, 'janeloes', 'Olhar pelos janelões', 'Janelões do chão ao teto, e lá fora, até onde a vista alcança, um mar '
        'de lava azul-arroxeada que borbulha devagar. O calor atravessa o vidro de rocha.'),
    obj(20, 14, 'esteira', 'Olhar a esteira', 'Lá no alto, uma esteira de baldes de ferro parada, que desce pela parede '
        'e some por um buraco no chão. Há uma escada alta encostada.',
        'investigar', 10, 'A esteira trazia minério lá de baixo até aqui. O motor dela é outro cristal apagado, igual ao do '
        'elevador.', 'A esteira de baldes'),
    obj(20, 7, 'fogao', 'Olhar o fogão', 'Um fogão de ferro com brasas, carne seca e ervas penduradas, sacos de grão e '
        'legumes pelo chão. Cheira bem. Bem demais para um posto de goblins.'),
    obj(26, 10, 'estandartes', 'Olhar os estandartes', 'Estandartes de pano com runas anãs, desbotados, e prateleiras '
        'com livros e jarros. Ninguém aqui lê anão.'),
    obj(24, 8, 'escrivaninha', 'Olhar a escrivaninha', 'Uma escrivaninha de mogno com um mapa aberto e bilhetes '
        'amassados. O mapa mostra salas e caminhos, mas não tem um nome escrito.',
        'investigar', 13, 'Os bilhetes são em goblin e falam de "o azul", de "as vozes" e de "a coluna". O mapa é uma '
        'cópia de outro, sem os nomes, e as setas dele saem daqui para longe, em três direções.', 'O mapa sem nomes'),
]


def main():
    um = lambda v: json.dumps(v, ensure_ascii=False, separators=(', ', ': '))
    partes = []
    pontos_todos = {}
    for chave, fn in (('ZORZULA_POSTO', posto), ('ZORZULA_MINAS', minas), ('ZORZULA_SANTUARIO', santuario)):
        mapa, pontos, pegadas = fn()
        pontos_prova = {k: v for k, v in pontos.items() if k not in ('salas', 'alavanca', 'portao', 'elevador', 'esteira', 'fonte',
                                                                   'runas', 'jarro', 'cama', 'escrivaninha', 'despensa', 'tunel',
                                                                   'secretas', 'mapaDeGuerra', 'ruxithid', 'refens', 'presos',
                                                                   'elevador', 'esqueletos', 'vagonetes', 'pedestal', 'caixotes', 'fechadura', 'cristais')}
        # A PROVA anda com as portas abertas e as secretas achadas: é o caminho que o grupo PODE fazer.
        aberto = json.loads(json.dumps(mapa))
        for lado in ('n', 'o'):
            aberto['paredes'][lado] = [l.replace('+', '/') for l in aberto['paredes'][lado]]
        for s_ in pontos.get('secretas', {}).values():
            a, b2 = (s_['a']['x'], s_['a']['y']), (s_['b']['x'], s_['b']['y'])
            por_aresta(aberto['paredes'], a, b2, '/')
        _vila.provas(chave, aberto, pontos_prova, pegadas)
        linhas = [f'export const MAPA_{chave} = {{']
        for k, v in mapa.items():
            if isinstance(v, list) and v and isinstance(v[0], str):
                linhas.append(f'  {k}: [\n' + ''.join(f'    {um(l)},\n' for l in v) + '  ],')
            elif k == 'paredes':
                linhas.append('  paredes: {\n' + ''.join(f'    {lado}: [\n' + ''.join(f'      {um(l)},\n' for l in v[lado]) + '    ],\n' for lado in ('n', 'o')) + '  },')
            elif k in ('interativos', 'folhas', 'trancas'):
                linhas.append(f'  {k}: [\n' + ''.join(f'    {um(t)},\n' for t in v) + '  ],')
            else:
                linhas.append(f'  {k}: {um(v)},')
        linhas.append('};')
        partes.append('\n'.join(linhas))
        pontos_todos[chave] = pontos
    cabecalho = (
        '// O REPOUSO DE ZORZULA (capítulo 5 do Obelisco): a planta das cenas do Foundry da Forgotten Adventures, com as salas,\n'
        '// a lava, a fonte e os móveis lidos do livro. A arte da FA destes mapas não está no disco: o chão sai do glifo.\n'
        '//\n'
        '// GERADO por `src/dev/mapa-zorzula.py` — mude lá e rode de novo.\n'
    )
    corpo = '\n\n'.join(partes) + '\n\nexport const PONTOS_ZORZULA = {\n' + ''.join(f'  {k}: {um(v)},\n' for k, v in pontos_todos.items()) + '};\n'
    with open(SAIDA, 'w', encoding='utf-8', newline='\n') as f:
        f.write(cabecalho + '\n' + corpo)
    print(f'escrito: {SAIDA}')


if __name__ == '__main__':
    main()
