# -*- coding: utf-8 -*-
"""
ACRESCENTA ao atlas do cenario (`src/art/folhas/cenario.png` e `.json`) a MOBILIA E AS PORTAS FEITAS PARA A CASA DA MORTE, sem gerar nada
(so recorta o que `objetos-pixellab.py --conjunto casa...` e `portas-pixellab.py` baixaram):

    prop-casa-<peca>:<direcao>   a peca virada para onde o mapa manda. <direcao> e para onde a peca OLHA, em eixos do mapa:
                                 +y (sudoeste na tela: a peca encostada na parede do norte), +x (sudeste: na parede do oeste),
                                 -y (nordeste) e -x (noroeste). So as direcoes que o mapa usa estao no atlas.
    portaCasa                    a folha de cada porta, de frente: carvalho (andares de baixo), velha (3o andar e sotao), ferro (portao)

Por que isto existe: a mobilia do atlas antigo tinha UMA vista por peca, e a peca de quem olhava para a parede errada (a lareira de costas
para a sala) nao tinha como ser virada. O PixelLab devolve as oito vistas de cada objeto; aqui se escolhe a que cada eixo do mapa pede.

Idempotente, como os outros `acrescentar-*`: o atlas guarda em `_casaObjetos` onde as linhas novas comecam; rodar de novo corta dali.
Este script e chamado no fim de `acrescentar-casa.py` (que e chamado no fim de `acrescentar-taverna.py`).

    python -P src/dev/acrescentar-casa-objetos.py
"""
import importlib.util
import json
from pathlib import Path

from PIL import Image

AQUI = Path(__file__).resolve().parents[2]
REF = AQUI / '_referencias' / 'pixellab'
FOLHAS = AQUI / 'src' / 'art' / 'folhas'
LARGURA_DO_ATLAS = 1024
MARGEM = 2

# CADA PECA E UMA VISTA SO (`casa-objetos-1dir.py`, rota de uma direcao, na projecao da grade): a de frente e a esquerda, que olha para o
# sudoeste (`+y`, a peca da parede do norte). Para a parede do oeste (`+x`, sudeste) o desenho e o ESPELHO dela. `n` e o candidato escolhido
# (`frame_urls_<n>.png`), olhando a folha de contato. `folga`: quantos px o pe do desenho fica acima da quina de baixo da pegada.
# `fogo`: quadros de fogo; `apagar`: a lareira sem fogo (os andares abandonados).
PECAS = {
    'lareira': {'conjunto': 'casaPecas', 'n': 2, 'dirs': ['+y', '+x'], 'folga': 4, 'fogo': 6, 'leste': 0},
    'lareiraB': {'conjunto': 'casaPecas', 'n': 3, 'dirs': ['+y', '+x'], 'folga': 4, 'fogo': 6, 'leste': 1},
    'lareiraApagada': {'conjunto': 'casaPecas', 'n': 2, 'dirs': ['+y', '+x'], 'folga': 4, 'apagar': True, 'leste': 14},
    'cadeira': {'conjunto': 'casaPecas', 'n': 1, 'dirs': ['+y', '+x'], 'folga': 6, 'leste': 9},
    'estante': {'conjunto': 'casaPecas', 'n': 4, 'dirs': ['+y', '+x'], 'folga': 4, 'leste': 2},
    'estanteB': {'conjunto': 'casaPecas', 'n': 5, 'dirs': ['+y', '+x'], 'folga': 4, 'leste': 3},
    'guardaRoupaB': {'conjunto': 'casaPecas', 'n': 7, 'dirs': ['+y', '+x'], 'folga': 4, 'leste': 5},
    'guardaRoupa': {'conjunto': 'casaPecas', 'n': 6, 'dirs': ['+y', '+x'], 'folga': 4, 'leste': 4},
    'fogao': {'conjunto': 'casaPecas', 'n': 8, 'dirs': ['+y', '+x'], 'folga': 4, 'leste': 6},
    'candelabro': {'conjunto': 'casaPecas', 'n': 10, 'dirs': ['+y'], 'folga': 6},
    'escrivaninha': {'conjunto': 'casaPecas', 'n': 11, 'dirs': ['+y', '+x'], 'folga': 6, 'leste': 11},
    'armadura': {'conjunto': 'casaPecas', 'n': 13, 'dirs': ['+y'], 'folga': 4},
    'berco': {'conjunto': 'casaPecas', 'n': 14, 'dirs': ['+y'], 'folga': 6},
    'bau': {'conjunto': 'casaPecas', 'n': 15, 'dirs': ['+y'], 'folga': 6},
    # as compridas: a direcao e o EIXO em que corre o comprimento (+x desce a direita, +y desce a esquerda)
    'mesaJantar': {'conjunto': 'casaMesa', 'n': 2, 'dirs': ['+x'], 'folga': 6},
    'cama': {'conjunto': 'casaCamaIso', 'n': 0, 'dirs': ['+y'], 'folga': 6},
    'camaVelha': {'conjunto': 'casaCamaIso', 'n': 2, 'dirs': ['+y'], 'folga': 6},
    'tina': {'conjunto': 'casaTinaIso', 'n': 0, 'dirs': ['+x'], 'folga': 6},
    'cravo': {'conjunto': 'casaCravoIso', 'n': 2, 'dirs': ['+y'], 'folga': 6, 'ax': 60},
    # a poltrona de COSTAS (olha para a lareira, para longe da camera): -y como saiu, -x espelhada
    'cadeiraCostas': {'conjunto': 'casaCadeiraCostas', 'n': 2, 'dirs': ['-y', '-x'], 'folga': 6},
    # o ABANDONO dos andares de cima (`casaAbandono`): moveis sob lencol, teia e lixo
    'poltronaCoberta': {'conjunto': 'casaAbandono', 'n': 0, 'dirs': ['+y', '+x'], 'folga': 6, 'leste': 10},
    'armarioCoberto': {'conjunto': 'casaAbandono', 'n': 1, 'dirs': ['+y', '+x'], 'folga': 4, 'leste': 7},
    'caixotes': {'conjunto': 'casaAbandono', 'n': 3, 'dirs': ['+y'], 'folga': 6},
    'espelhoCoberto': {'conjunto': 'casaAbandono', 'n': 4, 'dirs': ['+y', '+x'], 'folga': 4},
    'sofaCoberto': {'conjunto': 'casaAbandono', 'n': 5, 'dirs': ['+y', '+x'], 'folga': 6, 'leste': 15},
    'manequim': {'conjunto': 'casaAbandono', 'n': 6, 'dirs': ['+y'], 'folga': 6},
    'cobertores': {'conjunto': 'casaAbandono', 'n': 7, 'dirs': ['+y'], 'folga': 6},
    'cadeiraQuebrada': {'conjunto': 'casaAbandono', 'n': 8, 'dirs': ['+y'], 'folga': 6},
    'livrosTeia': {'conjunto': 'casaAbandono', 'n': 10, 'dirs': ['+y'], 'folga': 6},
    'comodaCoberta': {'conjunto': 'casaAbandono', 'n': 12, 'dirs': ['+y', '+x'], 'folga': 4, 'leste': 8},
    'cavaloDePau': {'conjunto': 'casaAbandono', 'n': 13, 'dirs': ['+y', '+x'], 'folga': 6, 'leste': 13},
    'castical': {'conjunto': 'casaAbandono', 'n': 15, 'dirs': ['+y'], 'folga': 6},
    # o que o texto promete (`casaFaltam`): vista unica, de frente e a esquerda
    'harpa': {'conjunto': 'casaFaltam', 'n': 0, 'dirs': ['+y'], 'folga': 6},
    'mesaRedonda': {'conjunto': 'casaFaltam', 'n': 1, 'dirs': ['+y'], 'folga': 6},
    'loboA': {'conjunto': 'casaFaltam', 'n': 2, 'dirs': ['+y'], 'folga': 6},
    'loboB': {'conjunto': 'casaFaltam', 'n': 3, 'dirs': ['+y'], 'folga': 6},
    'loboC': {'conjunto': 'casaFaltam', 'n': 4, 'dirs': ['+y'], 'folga': 6},
    'tigre': {'conjunto': 'casaFaltam', 'n': 5, 'dirs': ['+y'], 'folga': 14},
    'barril': {'conjunto': 'casaFaltam', 'n': 6, 'dirs': ['+y'], 'folga': 6},
    'casaDeBonecas': {'conjunto': 'casaFaltam', 'n': 7, 'dirs': ['+y'], 'folga': 6},
    'cadeiraBalanco': {'conjunto': 'casaFaltam', 'n': 8, 'dirs': ['+y'], 'folga': 6},
    'boneca': {'conjunto': 'casaFaltam', 'n': 9, 'dirs': ['+y'], 'folga': 6},
    'criado': {'conjunto': 'casaFaltam', 'n': 11, 'dirs': ['+y'], 'folga': 6},
    'criadoVelho': {'conjunto': 'casaFaltam', 'n': 15, 'dirs': ['+y'], 'folga': 6},
    'espelhoHera': {'conjunto': 'casaFaltam', 'n': 14, 'dirs': ['+y'], 'folga': 4},
    # a escadaria dos andares abandonados: a mesma, desbotada e escurecida
    'escadariaVelha': {'conjunto': 'casaEscadaria', 'n': 3, 'dirs': ['+x'], 'folga': 2, 'envelhecer': True},
    # o lustre PENDE do teto: a folga alta o ergue, e `dx`/`dy` (px de tela) o centram sobre a mesa; o vao da escada do 3o andar e so o corrimao
    'lustre': {'conjunto': 'casaLustre', 'n': 0, 'dirs': ['+y'], 'folga': 46, 'dx': 16, 'dy': -24},
    'vaoEscada': {'conjunto': 'casaVaoEscada', 'n': 0, 'dirs': ['+x'], 'folga': 2},
    'escadaria': {'conjunto': 'casaEscadaria', 'n': 3, 'dirs': ['+x'], 'folga': 2},
}


def apagar(q):
    """A lareira sem fogo: o laranja e o amarelo da chama viram brasa morta e fuligem."""
    out = q.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a and r > 150 and r - b > 90:
                v = (r + g) // 3
                px[x, y] = (min(70, v), max(20, v // 3), max(16, v // 4), 255)
    return out


# A folha de cada porta: (arquivo, papel). Escolhidas olhando a folha de contato de `portas-pixellab.py`.
PORTAS = {'carvalho': 'portaCarvalho-0.png', 'velha': 'portaVelha-1.png', 'ferro': 'portaoFerro-0.png'}


def aclarar(q, fator=1.22):
    """Levanta o brilho da peca escura (mediana de luma abaixo de 60): mobilia de carvalho sobre parede e piso de carvalho se perdia."""
    px = q.load()
    lums = sorted((0.3 * r + 0.59 * g + 0.11 * b) for y in range(q.height) for x in range(q.width) for r, g, b, a in [px[x, y]] if a)
    if not lums or lums[len(lums) // 2] >= 60:
        return q
    out = q.copy()
    po = out.load()
    for y in range(q.height):
        for x in range(q.width):
            r, g, b, a = px[x, y]
            if a:
                po[x, y] = (min(255, int(r * fator)), min(255, int(g * fator)), min(255, int(b * fator)), 255)
    return out


def envelhecer(q):
    """A peca dos andares abandonados: desbotada (metade da cor) e mais escura."""
    out = q.copy()
    po = out.load()
    for y in range(q.height):
        for x in range(q.width):
            r, g, b, a = po[x, y]
            if a:
                v = int(0.3 * r + 0.59 * g + 0.11 * b)
                po[x, y] = (int((r + v) / 2 * 0.85), int((g + v) / 2 * 0.85), int((b + v) / 2 * 0.85), 255)
    return out


def posterizar(q, cores=24):
    """Menos cores (a porta saia com 50 a 70; a mobilia tem 5 a 21): a porta nao pode ser mais detalhada que tudo ao redor."""
    alfa = q.split()[3]
    p = q.convert('RGB').quantize(colors=cores, method=Image.Quantize.MEDIANCUT).convert('RGB').convert('RGBA')
    p.putalpha(alfa.point(lambda v: 255 if v > 0 else 0))
    return p


def modulo(arquivo, apelido):
    spec = importlib.util.spec_from_file_location(apelido, Path(__file__).with_name(arquivo))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def ultimo(conjunto):
    pastas = sorted((REF / 'objetos' / conjunto).glob('*'), key=lambda p: p.stat().st_mtime)
    return pastas[-1]


def main():
    tav = modulo('acrescentar-taverna.py', 'acrescentar_taverna')
    meta = json.loads((FOLHAS / 'cenario.json').read_text(encoding='utf-8'))
    img = Image.open(FOLHAS / 'cenario.png').convert('RGBA')
    y0c = meta.get('_casaObjetos', {}).get('y0')
    if y0c is not None and y0c <= img.height:
        img = img.crop((0, 0, img.width, y0c))
    for g in [g for g in meta if g.startswith('prop-casa-') or g == 'portaCasa']:
        del meta[g]

    quadros = {}
    for nome, spec in PECAS.items():
        pasta = ultimo(spec['conjunto'])
        base = Image.open(pasta / f"frame_urls_{spec['n']}.png").convert('RGBA')
        base = base.crop(base.getbbox())
        for d in spec['dirs']:
            if d == '+x' and spec.get('leste') is not None:        # a vista propria da parede do oeste: a luz continua a de cima a esquerda
                im = Image.open(ultimo('casaPecasLeste') / f"frame_urls_{spec['leste']}.png").convert('RGBA')
                q = im.crop(im.getbbox())
            else:
                q = base if d in ('+y', '-y') or spec['conjunto'] in ('casaEscadaria', 'casaTinaIso', 'casaVaoEscada') else base.transpose(Image.FLIP_LEFT_RIGHT)
            if spec.get('apagar') and not (d == '+x' and spec.get('leste') is not None):
                q = apagar(q)
            if spec.get('envelhecer'):
                q = envelhecer(q)
            elif spec['conjunto'] != 'casaAbandono':
                q = aclarar(q)
            ax, ay = tav.ancora_da_pegada(q, spec['folga'])
            ax -= spec.get('dx', 0)
            ay -= spec.get('dy', 0)
            if spec.get('ax') is not None:           # a ancora medida a mao, quando o pe mais baixo e de outra peca (o banco do cravo)
                ax = spec['ax']
            n = spec.get('fogo')
            quadros[f'prop-casa-{nome}:{d}'] = [(tav.fogo(q, i, n), ax, ay) for i in range(n)] if n else [(q, ax, ay)]
    portas = {}
    for papel, arq in PORTAS.items():
        im = Image.open(REF / 'portas' / arq).convert('RGBA')
        q = posterizar(im.crop(im.getbbox()))
        portas[papel] = [(q, q.width // 2, q.height)]

    y0 = img.height
    x = y = fileira = 0
    posicoes = {}
    todos = list(quadros.items()) + [('portaCasa', None)]
    lista_de = {nome: lista for nome, lista in quadros.items()}
    for nome, lista in lista_de.items():
        for i, (q, _, _) in enumerate(lista):
            if x + q.width + MARGEM > LARGURA_DO_ATLAS:
                x, y, fileira = 0, y + fileira + MARGEM, 0
            posicoes[(nome, i)] = (x, y)
            x += q.width + MARGEM
            fileira = max(fileira, q.height)
    for papel, lista in portas.items():
        for i, (q, _, _) in enumerate(lista):
            if x + q.width + MARGEM > LARGURA_DO_ATLAS:
                x, y, fileira = 0, y + fileira + MARGEM, 0
            posicoes[('portaCasa:' + papel, i)] = (x, y)
            x += q.width + MARGEM
            fileira = max(fileira, q.height)
    novo = Image.new('RGBA', (img.width, y0 + y + fileira + MARGEM), (0, 0, 0, 0))
    novo.alpha_composite(img, (0, 0))
    for nome, lista in lista_de.items():
        meta[nome] = {'todas': []}
        for i, (q, ax, ay) in enumerate(lista):
            px, py = posicoes[(nome, i)]
            novo.alpha_composite(q, (px, y0 + py))
            meta[nome]['todas'].append({'x': px, 'y': y0 + py, 'w': q.width, 'h': q.height, 'ax': ax, 'ay': ay, 'origem': 'casa'})
    meta['portaCasa'] = {}
    for papel, lista in portas.items():
        meta['portaCasa'][papel] = []
        for i, (q, ax, ay) in enumerate(lista):
            px, py = posicoes[('portaCasa:' + papel, i)]
            novo.alpha_composite(q, (px, y0 + py))
            meta['portaCasa'][papel].append({'x': px, 'y': y0 + py, 'w': q.width, 'h': q.height, 'ax': ax, 'ay': ay, 'origem': 'casa'})
    meta['_casaObjetos'] = {'y0': y0}
    novo.save(FOLHAS / 'cenario.png', optimize=True)
    (FOLHAS / 'cenario.json').write_text(json.dumps(meta, indent=1), encoding='utf-8')
    print(f'cenario da casa: +{sum(len(l) for l in lista_de.values())} quadros de mobilia, {len(portas)} portas, atlas {novo.size}')


if __name__ == '__main__':
    main()
