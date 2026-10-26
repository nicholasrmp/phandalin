# -*- coding: utf-8 -*-
"""
ACRESCENTA a arte da taverna aos atlas do jogo, sem regerar o que ja existe.

    python -P src/dev/acrescentar-taverna.py [--previa]

Nao gasta geracao: so recorta o que o PixelLab ja devolveu (`taverna-pixellab.py`,
`taverna-objetos-pixellab.py`, `taverna-personagens-pixellab.py`) e poe ao pe dos tres
atlas de `src/art/folhas/`:

    cenario   prop-taverna-<peca>: a mobilia e os frequentadores (um quadro por peca, ja na
              vista certa para a camera fixa), com a ancora no centro da pegada
    chao      tabuasTaverna: o piso de tabuas (4 variacoes, recortadas pela particao exata)
    faces     tijolo: as faixas de parede de tijolo com vigas (4 variacoes esq/dir)

POR QUE ACRESCENTAR, E NAO REGERAR. Os montadores (`montar-cenario.py`, `montar-chao.py`,
`montar-faces.py`) leem lotes de `_referencias/` e escolhem quadros um a um: rodar um de novo
para pôr uma peca mexeria em tudo. Aqui as pecas novas entram embaixo e o resto fica byte
a byte como estava. E IDEMPOTENTE: cada atlas guarda em `_taverna` onde comecam as linhas
novas; rodar de novo corta a partir dali e acrescenta outra vez.

COMO O TABULEIRO ACHA CADA COISA.
  - A mobilia e `prop` (`board.varianteDaProp`): um glifo `^` e uma anotacao
    `{ tipo: 'prop', x, y, variante }` no mapa (`game/taverna.js`). O quadro sai de
    `prop-<variante>`, ancorado no centro da casa em que a anotacao esta.
  - Peca de varias casas e desenhada na casa da FRENTE da pegada (a ultima a ser desenhada,
    senao o chao das casas da frente a cobre), e as outras casas da pegada levam a variante
    `nada` (um quadro de 1 pixel transparente) so para bloquear o passo.
  - A ancora vem do tamanho da pegada: o centro da pegada fica `(16 (ny - nx), -8 (nx + ny - 2))`
    px da casa da frente, e o centro do desenho cai nele.

O quadro de cada peca e a vista que a camera fixa pede: o objeto de frente para o interior da
sala, na parede do norte (olha para o sudoeste, `+y`) ou na do oeste (olha para o sudeste, `+x`).
"""
import argparse
import glob
import json
import urllib.request
from pathlib import Path

from PIL import Image

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from losango import no_losango  # noqa: E402

AQUI = Path(__file__).resolve().parents[2]
REF = AQUI / '_referencias' / 'pixellab'
FOLHAS = AQUI / 'src' / 'art' / 'folhas'
LARGURA_DO_ATLAS = 1024
MARGEM = 2

# Cada peca da mobilia: de onde vem, que vista, quantas casas ocupa (nx ao longo de +x, ny ao
# longo de +y), e o tanto de "pe" do desenho acima da quina de baixo (`pe`).
# `conjunto`/`n`: o candidato escolhido (`frame_urls_<n>.png`) de uma leva de `taverna-objetos-1dir.py`,
# que sai na projecao da grade (uma vista so: a camera do jogo e fixa). `espelho`: a peca de parede do
# norte, virada para a parede do oeste. `folga`: quantos px o pe da peca fica acima da quina de baixo
# da casa da frente (a peca de uma casa assenta no centro dela, a de parede encosta no fundo).
OBJETOS = {
    # `recuo`: meia casa de volta para a parede ('N' = a do norte, 'O' = a do oeste): o desenho sai com
    # folga atras, e a estante tem de ficar ENCOSTADA. `fogo`: quantos quadros de fogo (so a lareira).
    'lareira':       {'conjunto': 'tavernaParede', 'n': 2, 'folga': 4, 'fogo': 6},
    'prateleira':    {'conjunto': 'tavernaParede', 'n': 0, 'folga': 4, 'recuo': 'N'},
    'prateleiraB':   {'conjunto': 'tavernaParede', 'n': 1, 'folga': 4, 'recuo': 'N'},
    'prateleiraO':   {'conjunto': 'tavernaParede', 'n': 0, 'folga': 4, 'espelho': True, 'recuo': 'O'},
    'caixote':       {'conjunto': 'tavernaPecas', 'n': 12, 'folga': 6},
    'escada':        {'conjunto': 'tavernaEscada', 'n': 0, 'folga': 2},
    'balcao':        {'conjunto': 'tavernaBalcao', 'n': 0, 'folga': 2},
    'mesaRedonda':   {'conjunto': 'tavernaPecas', 'n': 2, 'folga': 9},
    'mesaCartas':    {'conjunto': 'tavernaPecas', 'n': 0, 'folga': 9},
    'mesaVela':      {'conjunto': 'tavernaPecas', 'n': 1, 'folga': 9},
    'banquinho':     {'conjunto': 'tavernaPecas', 'n': 3, 'folga': 7, 'escala': 0.7},
    'barrilCerveja': {'conjunto': 'tavernaPecas', 'n': 5, 'folga': 6},
    'lampiao':       {'conjunto': 'tavernaPecas', 'n': 7, 'folga': 9},
}

# Os frequentadores (`taverna-personagens-pixellab.py`): um quadro de 64 x 64 por vista, baixado
# de `rotation_urls` (a tira do zip nao diz a ordem das direcoes).
# Cada um olha para o que esta fazendo (a camera e uma so; o que muda e para onde a figura vira):
# +y e `south-west`, +x e `south-east`.
NPCS = {
    'toblen': {'pasta': 'toblen', 'vista': 'south-west'},          # atras do balcao, olhando a sala
    'magoVermelho': {'pasta': 'magoVermelho', 'vista': 'south-east'},   # olhando o fogo da lareira
    'chapeuRoxo': {'pasta': 'chapeuRoxo', 'vista': 'south-east'},  # a oeste da mesa, olhando-a
    'lenhador': {'pasta': 'lenhador', 'vista': 'south-west'},      # ao norte da mesa de cartas
    'corsario': {'pasta': 'corsario', 'vista': 'south-west'},      # ao norte da outra mesa
    'mascarada': {'pasta': 'mascarada', 'vista': 'south-east'},    # a oeste da mesa de cartas
}

# O piso: as pecas `floor` do kit (a lona de 102 x 115 traz o losango do chao em (19, 73)).
KIT = REF / 'kits' / 'taverna' / 'kit' / '910113b5-e2c7-417d-97d7-fd995f74eafc'
PECAS_DE_PISO = [0, 44, 56, 57]
ORIGEM_DO_LOSANGO = (19, 73)

# As faixas de parede de tijolo: de cada peca `sides` (N mostra a face 'esq', W a 'dir').
FACES_DO_KIT = {'esq': [('sides', 'N', 38), ('partition_wall', 'N', 38)],
                'dir': [('sides', 'W', 32), ('partition_wall', 'W', 32)]}


def ultimo(padrao):
    ds = sorted(glob.glob(str(REF / padrao / '*')) if '*' not in padrao else glob.glob(str(REF / padrao)),
                key=lambda p: Path(p).stat().st_mtime)
    return Path(ds[-1])


def carregar(nome):
    meta = json.loads((FOLHAS / f'{nome}.json').read_text(encoding='utf-8'))
    img = Image.open(FOLHAS / f'{nome}.png').convert('RGBA')
    return meta, img


def cortar_do_marcador(meta, img, chave_do_corte):
    """Tira do atlas o que uma rodada anterior acrescentou (as linhas abaixo de `_taverna`)."""
    y0 = meta.get('_taverna', {}).get('y0')
    if y0 is None:
        return img
    return img.crop((0, 0, img.width, y0))


def estender(img, altura_nova):
    novo = Image.new('RGBA', (img.width, altura_nova), (0, 0, 0, 0))
    novo.alpha_composite(img, (0, 0))
    return novo


# ------------------------------------------------------------------------------ cenario --

def quadro_do_objeto(spec):
    pasta = ultimo(f"objetos/{spec['conjunto']}/*")
    im = Image.open(pasta / f"frame_urls_{spec['n']}.png").convert('RGBA')
    im = im.crop(im.getbbox())
    if spec.get('escala'):                       # so o banquinho: o desenho saiu grande para a mesa
        im = im.resize((round(im.width * spec['escala']), round(im.height * spec['escala'])), Image.NEAREST)
    return im.transpose(Image.FLIP_LEFT_RIGHT) if spec.get('espelho') else im


def fogo(q, quadro, total):
    """O fogo da lareira mexendo: a ponta das chamas sobe e desce por coluna e o brilho alterna.

    So mexe nos pixels de chama (laranja e amarelo vivos) da boca da lareira; o resto do desenho
    fica igual em todos os quadros."""
    import math
    w, h = q.size
    px = q.load()

    def chama(c):
        r, g, b, a = c
        return a > 0 and r > 190 and 70 < g < 235 and b < 120 and r - b > 110

    zona = [(x, y) for y in range(int(h * 0.42), h) for x in range(w) if chama(px[x, y])]
    if not zona:
        return q
    x0, x1 = min(x for x, _ in zona), max(x for x, _ in zona)
    y1 = max(y for _, y in zona)
    fundo = (34, 14, 10, 255)
    out = q.copy()
    po = out.load()
    for x in range(x0, x1 + 1):
        ys = [y for y in range(int(h * 0.42), h) if chama(px[x, y])]
        if not ys:
            continue
        topo = min(ys)
        fase = quadro / total * 2 * math.pi
        d = round(2.6 * math.sin(fase + x * 0.9) + 1.4 * math.sin(2 * fase + x * 1.7))
        if d < 0:                                # a chama sobe: acende acima do topo
            for k in range(1, -d + 1):
                y = topo - k
                if y >= 0 and po[x, y][3] and not chama(po[x, y]) and po[x, y][0] < 120:
                    po[x, y] = (240, 150, 40, 255) if k == 1 else (255, 214, 90, 255)
        elif d > 0:                              # a chama baixa: apaga a ponta
            for k in range(d):
                y = topo + k
                if y < y1 - 1:
                    po[x, y] = fundo
    # o brilho: alguns pixels trocam entre amarelo e laranja a cada quadro
    for x, y in zona:
        if (x * 7 + y * 13 + quadro * 5) % 3 == 0 and po[x, y][3]:
            r, g, b, a = po[x, y]
            po[x, y] = (255, 214, 90, 255) if g < 170 else (240, 140, 36, 255)
    return out


def quadro_do_npc(spec):
    pasta = ultimo(spec['pasta'] + '-*')
    meta = json.loads((pasta / 'meta.json').read_text(encoding='utf-8'))
    url = meta['rotation_urls'][spec['vista']]
    arq = pasta / f"vista-{spec['vista']}.png"
    if not arq.exists():
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=120) as r:
            arq.write_bytes(r.read())
    im = Image.open(arq).convert('RGBA')
    return im.crop(im.getbbox())


def ancora_da_pegada(q, folga):
    """(ax, ay): o pixel do desenho que cai no CENTRO DA CASA DA FRENTE da pegada.

    O ponto mais baixo do desenho e a quina de baixo da pegada, que fica a 16 px do centro da casa
    da frente; `folga` e quanto ele fica acima dela. Na horizontal, o ponto mais baixo manda."""
    w, h = q.size
    a = q.split()[3].load()
    xs = [x for x in range(w) if a[x, h - 1] > 0]
    ax = round(sum(xs) / len(xs)) if xs else w // 2
    return ax, h - 1 - (16 - folga)


def atualizar_cenario(previa):
    meta, img = carregar('cenario')
    img = cortar_do_marcador(meta, img, '_taverna')
    for g in [g for g in meta if g.startswith('prop-taverna-')]:
        del meta[g]
    y0 = img.height
    quadros = {}                                 # nome -> lista de (imagem, ax, ay)
    for nome, spec in OBJETOS.items():
        q = quadro_do_objeto(spec)
        ax, ay = ancora_da_pegada(q, spec['folga'])
        if spec.get('recuo') == 'N':             # meia casa para o norte: (+16, -8) na tela
            ax, ay = ax - 16, ay + 8
        elif spec.get('recuo') == 'O':           # meia casa para o oeste: (-16, -8)
            ax, ay = ax + 16, ay + 8
        n = spec.get('fogo')
        quadros[f'prop-taverna-{nome}'] = [(fogo(q, i, n), ax, ay) for i in range(n)] if n else [(q, ax, ay)]
    for nome, spec in NPCS.items():
        q = quadro_do_npc(spec)
        # Pe do personagem no centro da casa: a base do desenho, uns 5 px acima da borda.
        quadros[f'prop-taverna-{nome}'] = [(q, q.width // 2, q.height - 5)]
    quadros['prop-taverna-nada'] = [(Image.new('RGBA', (1, 1), (0, 0, 0, 0)), 0, 0)]

    # Empacota em prateleiras de 1024 de largura.
    x = y = fileira = 0
    posicoes = {}
    for nome, lista in quadros.items():
        for i, (q, _, _) in enumerate(lista):
            if x + q.width + MARGEM > LARGURA_DO_ATLAS:
                x, y = 0, y + fileira + MARGEM
                fileira = 0
            posicoes[(nome, i)] = (x, y)
            x += q.width + MARGEM
            fileira = max(fileira, q.height)
    altura_total = y0 + y + fileira + MARGEM
    img = estender(img, altura_total)
    for nome, lista in quadros.items():
        meta[nome] = {'todas': []}
        for i, (q, ax, ay) in enumerate(lista):
            px, py = posicoes[(nome, i)]
            img.alpha_composite(q, (px, y0 + py))
            meta[nome]['todas'].append({'x': px, 'y': y0 + py, 'w': q.width, 'h': q.height, 'ax': ax, 'ay': ay, 'origem': 'taverna'})
    meta['_taverna'] = {'y0': y0}
    img.save(FOLHAS / 'cenario.png', optimize=True)
    (FOLHAS / 'cenario.json').write_text(json.dumps(meta, indent=1), encoding='utf-8')   # a indentacao de sempre: o diff so mostra o que entrou
    print(f'cenario: +{sum(len(l) for l in quadros.values())} quadros, atlas {img.size}')
    return quadros


# ---------------------------------------------------------------------------------- chao --

def tapar(t):
    """Furo dentro do losango vira o vizinho aceso mais perto na fileira."""
    px = t.load()
    for y in range(32):
        cheios = [x for x in range(64) if px[x, y][3]]
        for x in range(64):
            if no_losango(x, y) and not px[x, y][3] and cheios:
                px[x, y] = px[min(cheios, key=lambda c: abs(c - x)), y]
    return t


def ladrilho_do_piso(n):
    im = Image.open(KIT / f'tile_{n}.png').convert('RGBA')
    ox, oy = ORIGEM_DO_LOSANGO
    corte = im.crop((ox, oy, ox + 64, oy + 32))
    out = Image.new('RGBA', (64, 32), (0, 0, 0, 0))
    s, d = corte.load(), out.load()
    for y in range(32):
        for x in range(64):
            if no_losango(x, y) and s[x, y][3]:
                d[x, y] = s[x, y][:3] + (255,)
    return tapar(out)


def atualizar_chao():
    meta, img = carregar('chao')
    img = cortar_do_marcador(meta, img, '_taverna')
    meta['fileiras'].pop('tabuasTaverna', None)
    y0 = img.height
    ls = [ladrilho_do_piso(n) for n in PECAS_DE_PISO]
    img = estender(img, y0 + 32)
    for i, t in enumerate(ls):
        img.alpha_composite(t, (i * 64, y0))
    meta['fileiras']['tabuasTaverna'] = {'y': y0, 'n': len(ls)}
    meta['_taverna'] = {'y0': y0}
    img.save(FOLHAS / 'chao.png', optimize=True)
    (FOLHAS / 'chao.json').write_text(json.dumps(meta, indent=2), encoding='utf-8')
    print(f'chao: tabuasTaverna x{len(ls)}, atlas {img.size}')
    return ls


# --------------------------------------------------------------------------------- faces --

TIJOLOS = ['#b4553a', '#a24a32', '#c2623f', '#933f2c', '#aa5035']
ARGAMASSA = '#5e463c'


def escurecer(im, f):
    out = im.copy()
    px = out.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            px[x, y] = (int(r * f), int(g * f), int(b * f), a)
    return out


def tijolo_plano(variante, escuro):
    """Um nivel de parede de tijolo, plano (32 x 22), que EMENDA dos lados e de cima para baixo:
    fileiras de 5, 6, 5 e 6 px (22), tijolos de 8 px, as fileiras alternadas em meio tijolo."""
    import random
    rng = random.Random(7000 + variante)
    hexa = lambda c: tuple(int(c[i:i + 2], 16) for i in (1, 3, 5))
    im = Image.new('RGBA', (32, 22), hexa(ARGAMASSA) + (255,))
    px = im.load()
    fileiras = [(0, 5), (5, 11), (11, 16), (16, 22)]
    for r, (a, b) in enumerate(fileiras):
        desloc = 4 if r % 2 else 0
        for k in range(-1, 5):
            x0 = k * 8 + desloc
            cor = hexa(rng.choice(TIJOLOS))
            for y in range(a + 1, b):
                for x in range(x0 + 1, x0 + 8):
                    c = cor
                    if y == a + 1:                       # luz no alto do tijolo
                        c = tuple(min(255, v + 18) for v in cor)
                    elif y == b - 1:                     # sombra embaixo
                        c = tuple(int(v * 0.8) for v in cor)
                    px[x % 32, y] = c + (255,)
        for _ in range(3):                               # lascas e manchas
            x, y = rng.randrange(32), rng.randrange(a + 1, b)
            px[x, y] = tuple(int(v * 0.72) for v in px[x, y][:3]) + (255,)
    return escurecer(im, 0.78) if escuro else im


def faixa_da_face(plano, lado):
    """A face em pe na grade 2:1: cada coluna desce meio pixel por pixel (esq: para a direita; dir: para a esquerda)."""
    out = Image.new('RGBA', (32, 38), (0, 0, 0, 0))
    for x in range(32):
        dy = (x // 2) if lado == 'esq' else (15 - x // 2)
        out.alpha_composite(plano.crop((x, 0, x + 1, 22)), (x, dy))
    return out


def atualizar_faces():
    meta, img = carregar('faces')
    img = cortar_do_marcador(meta, img, '_taverna')
    meta['faces'].pop('tijolo', None)
    y0 = img.height
    fw, fh = meta['fw'], meta['fh']
    n = 4
    img = estender(img, y0 + fh)
    por_lado = {'esq': [], 'dir': []}
    for i in range(n):
        e = faixa_da_face(tijolo_plano(i, False), 'esq')
        d = faixa_da_face(tijolo_plano(i, True), 'dir')
        img.alpha_composite(e, (i * 64, y0))
        img.alpha_composite(d, (i * 64 + fw, y0))
        por_lado['esq'].append(e)
        por_lado['dir'].append(d)
    meta['faces']['tijolo'] = {'y': y0, 'n': n}
    meta['_taverna'] = {'y0': y0}
    img.save(FOLHAS / 'faces.png', optimize=True)
    (FOLHAS / 'faces.json').write_text(json.dumps(meta, indent=1), encoding='utf-8')
    print(f'faces: tijolo x{n}, atlas {img.size}')
    return por_lado


def importlib_carregar(arquivo, apelido):
    import importlib.util
    spec = importlib.util.spec_from_file_location(apelido, Path(__file__).with_name(arquivo))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--previa', action='store_true', help='grava uma folha de contato em scratch (so olhar)')
    a = p.parse_args()
    quadros = atualizar_cenario(a.previa)
    pisos = atualizar_chao()
    faixas = atualizar_faces()
    if a.previa:
        saida = AQUI / '_referencias' / 'pixellab' / 'taverna-previa.png'
        f = Image.new('RGBA', (1100, 520), (34, 28, 40, 255))
        x = 4
        for nome, lista in quadros.items():
            q = lista[0][0]
            if x + q.width > 1090:
                break
            f.alpha_composite(q, (x, 4)); x += q.width + 6
        for i, t in enumerate(pisos):
            f.alpha_composite(t, (4 + i * 68, 200))
        for i, (e, d) in enumerate(zip(faixas['esq'], faixas['dir'])):
            f.alpha_composite(e, (4 + i * 70, 260)); f.alpha_composite(d, (4 + i * 70 + 32, 260))
        f.resize((f.width * 2, f.height * 2), Image.NEAREST).save(saida)
        print('previa:', saida)


if __name__ == '__main__':
    main()
