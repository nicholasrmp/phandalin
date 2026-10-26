# Desenha a PRÉVIA de um mapa do jogo como imagem, para olhar o traçado sem
# precisar abrir a partida e andar até lá.
#
#   python src/dev/mapa-previa.py arvoretrovao
#   python src/dev/mapa-previa.py castelo cume poco
#
# Sai um PNG por mapa em `_previa-<nome>.png`, na raiz. NÃO é o desenho do
# jogo: é planta baixa, de cima, uma cor por glifo, com a grade e as
# coordenadas na borda. Serve para responder "a vila parece uma vila?" e
# "cadê o buraco?" em um olhar, que é o que a saída em texto do gerador não
# responde.
#
# Lê o `.js` gerado em vez do `.py`: o que importa é o mapa que o jogo carrega.
import json
import re
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw
except ImportError:
    raise SystemExit('precisa do Pillow: pip install pillow')

RAIZ = Path(__file__).resolve().parents[2]
JOGO = RAIZ / 'src' / 'game'

# Uma cor por glifo. A regra que faz a prévia servir: ESTRUTURA ESCURA, CHÃO
# CLARO. A primeira versão punha parede, cinza e laje todas no mesmo cinza
# médio, e o mapa saía uma mancha só — não dava para ver onde estava a casa.
CORES = {
    ',': (104, 132, 72),    # capim
    ':': (166, 142, 92),    # caminho de terra
    'v': (146, 138, 124),   # cinza do vulcão
    'd': (182, 170, 150),   # cacos (chao de dentro)
    'j': (96, 120, 84),     # musgo
    'c': (190, 184, 168),   # ossos
    'L': (196, 188, 174),   # laje de dentro
    'x': (120, 110, 98),    # entulho
    '%': (76, 104, 60),     # espinheiro
    'T': (38, 62, 40),      # mata
    'E': (92, 78, 70),      # parede quebrada
    'M': (58, 54, 58),      # alvenaria de pe
    'R': (84, 82, 80),
    'b': (70, 100, 56),     # arbusto
    'r': (128, 124, 118),   # pedra
    'q': (92, 108, 132),    # poço
    'A': (150, 146, 140),   # estátua / coluna
    'C': (122, 92, 60),     # carroça
    'K': (140, 100, 52),    # baú
    't': (150, 112, 60),    # arca
    'm': (134, 100, 64),    # mesa
    's': (160, 140, 84),    # mantimentos
    'i': (146, 116, 74),    # caixotes
    'u': (126, 96, 58),     # barris
    'z': (164, 148, 116),   # leito
    'F': (200, 120, 52),    # fogueira
    'a': (170, 160, 150),   # altar
    'k': (150, 144, 132),   # pedregal
    'l': (170, 140, 90),    # escada
    '_': (120, 112, 104),   # chão de caverna
    'w': (90, 120, 150), 'W': (70, 100, 140), '=': (140, 110, 70),
    'n': (150, 130, 100), 'G': (100, 100, 110), 'S': (84, 82, 80),
    'Q': (120, 118, 126), 'O': (30, 30, 34), 'H': (96, 90, 84),
    'Y': (110, 94, 76), 'P': (130, 108, 74), 'e': (190, 110, 50),
    'f': (90, 84, 78), 'g': (120, 116, 110), 'p': (178, 162, 110),
    'i2': (0, 0, 0),
}
FALTA = (255, 0, 160)       # glifo sem cor: aparece berrante, de propósito

LADO = 14                   # pixels por casa
MARGEM = 26


def previa(nome):
    js = (JOGO / f'{nome}.js').read_text(encoding='utf-8')
    m = re.search(r'=\s*(\{.*?\n\});', js, re.S)
    if not m:
        raise SystemExit(f'nao achei o mapa em {nome}.js')
    dados = json.loads(m.group(1))
    linhas = dados['terreno']
    h, w = len(linhas), len(linhas[0])
    img = Image.new('RGB', (w * LADO + MARGEM * 2, h * LADO + MARGEM * 2), (22, 20, 26))
    d = ImageDraw.Draw(img)
    desconhecidos = set()
    for y, linha in enumerate(linhas):
        for x, g in enumerate(linha):
            cor = CORES.get(g)
            if cor is None:
                cor = FALTA
                desconhecidos.add(g)
            x0, y0 = MARGEM + x * LADO, MARGEM + y * LADO
            d.rectangle([x0, y0, x0 + LADO - 1, y0 + LADO - 1], fill=cor)
    # PAREDES DE BORDA (castelo, Árvore Trovão): a aresta entre duas casas, não
    # uma casa de parede. # vira traço grosso escuro, / (arco) vira um traço
    # claro mais fino, + (porta fechada) um traço marrom.
    parede = dados.get('paredes')
    if parede:
        cores_aresta = {'#': ((30, 26, 30), 3), '/': ((236, 214, 120), 2), '+': ((150, 96, 40), 3), 'J': ((90, 90, 110), 2)}
        for y in range(h):
            for x in range(w):
                for grade, vertical in ((parede['n'], False), (parede['o'], True)):
                    c = grade[y][x] if x < len(grade[y]) else '.'
                    if c not in cores_aresta:
                        continue
                    cor, esp = cores_aresta[c]
                    x0, y0 = MARGEM + x * LADO, MARGEM + y * LADO
                    if vertical:
                        d.line([x0, y0, x0, y0 + LADO], fill=cor, width=esp)
                    else:
                        d.line([x0, y0, x0 + LADO, y0], fill=cor, width=esp)
    # A grade de dez em dez, e os números na borda: para ler coordenada do mapa
    # direto da imagem quando um bando nasce no lugar errado.
    for x in range(0, w + 1, 10):
        px = MARGEM + x * LADO
        d.line([px, MARGEM, px, MARGEM + h * LADO], fill=(255, 255, 255, 60), width=1)
        d.text((px + 2, 6), str(x), fill=(220, 220, 220))
    for y in range(0, h + 1, 10):
        py = MARGEM + y * LADO
        d.line([MARGEM, py, MARGEM + w * LADO, py], fill=(255, 255, 255, 60), width=1)
        d.text((4, py + 2), str(y), fill=(220, 220, 220))
    # Se o mapa publica `predios`, numera cada construcao em cima da planta e
    # poe a legenda ao lado: para CONFERIR posicao e tamanho contra a
    # referencia sem abrir o JSON.
    pred = None
    for achado in re.finditer(r'export const \w+\s*=\s*(\{.*?\n\});', js, re.S):
        try:
            pred = json.loads(achado.group(1)).get('predios') or pred
        except ValueError:
            pass
    if pred:
        legenda = []
        for n, (pid, p) in enumerate(pred.items(), 1):
            cx = MARGEM + (p['x0'] + p['x1'] + 1) * LADO // 2
            cy = MARGEM + (p['y0'] + p['y1'] + 1) * LADO // 2
            d.rectangle([cx - 8, cy - 6, cx + 8, cy + 6], fill=(250, 240, 200))
            d.text((cx - 6, cy - 5), str(n), fill=(20, 20, 20))
            larg, alt = p['x1'] - p['x0'] + 1, p['y1'] - p['y0'] + 1
            legenda.append(f"{n:2} {p['nome']}  {larg}x{alt} casas = {larg*5}x{alt*5} pes")
        img2 = Image.new('RGB', (img.width + 330, img.height), (22, 20, 26))
        img2.paste(img, (0, 0))
        d2 = ImageDraw.Draw(img2)
        for i, linha in enumerate(legenda):
            d2.text((img.width + 8, MARGEM + i * 15), linha, fill=(220, 215, 200))
        img, d = img2, d2
    d.text((MARGEM, MARGEM + h * LADO + 6),
           f'{nome}  ·  {w} x {h} casas  ·  {w * 5} x {h * 5} pes', fill=(210, 205, 195))
    saida = RAIZ / f'_previa-{nome}.png'
    img.save(saida)
    print(f'{saida}  ({w}x{h})')
    if desconhecidos:
        print('  glifos SEM COR (saem em rosa):', ' '.join(sorted(desconhecidos)))


for nome in (sys.argv[1:] or ['arvoretrovao']):
    previa(nome)
