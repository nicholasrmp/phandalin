# -*- coding: utf-8 -*-
"""
Gera objetos de cenario de uma direcao no PixelLab e mede cada candidato.

ISTO GASTA GERACOES (10 a 25 por chamada). Sem `--go` so imprime o plano.

POR QUE `/create-1-direction-object` PARA ARVORE, ARBUSTO E PEDRA.
Os tres sao quase simetricos: girar a camera nao pede direcoes novas. E uma
chamada so rende a familia inteira -- 16 candidatos a 84 px -- no mesmo
estilo, que foi a licao do chao: variacoes pedidas juntas saem do mesmo
"pintor". `item_descriptions` controla a silhueta de cada candidato.

Nao se misturam os tres numa chamada: cada candidato preenche a tela inteira,
e o arbusto sairia do tamanho da arvore.

A ESPECIFICACAO veio do revisor de cenario (`.claude/agents/revisor-cenario-iso.md`):
tamanho, ancora, paleta e o aceite medido abaixo.

O ACEITE, rodado em todo candidato:
  1. zero pixel com alfa parcial (borda meio transparente vira halo);
  2. perimetro / raiz(area) <= 24 -- arte nativa da ~20; arte reduzida de
     ilustracao deu 34 neste projeto;
  3. sem chao nem sombra pintados nas linhas de baixo.
"""
import argparse
import json
import math
import os
import time
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image

BASE = 'https://api.pixellab.ai/v2'
AQUI = Path(__file__).resolve().parents[2]
SAIDA = AQUI / '_referencias' / 'pixellab' / 'objetos'

FOLHA = ['#101a12', '#1a2c1c', '#243f24', '#33572e', '#4a7236', '#6b8f43', '#93ad57']
TRONCO = ['#24170f', '#3d2819', '#5a3d26', '#7a5838']
GRANITO = ['#1e1f22', '#3a3b3e', '#56575a', '#77766f', '#9e998b']

PIXEL = ('Native pixel art at final size, hard pixels, no anti-aliasing, no gradients, '
         'no semi-transparent pixels, transparent background, no ground, no grass, '
         'no cast shadow. Light from the upper left.')

MADEIRA = ['#22160e', '#3e2a1b', '#5e4029', '#85603d', '#ab8558']
LONA = ['#6b6350', '#968a6c', '#c2b48f']
FERRO = ['#2a2a2e', '#55565c']
BAIO = ['#25170f', '#45291a', '#683d25', '#8c5734']

# Carroca e cavalo sao ASSIMETRICOS: vistos das quatro rotacoes da camera,
# pedem as diagonais. Vao pelo `/create-object-pro-flash`, que custa 6 geracoes
# a primeira imagem e 2 as rotacoes (consultado em /pro-flash/cost) -- 8 no
# total pelas oito direcoes. A sonda de uma direcao so economizaria 2.
#
# Sem `smart` na paleta: a API recusa (422) em objeto de varias direcoes,
# porque as oito vistas tem de usar exatamente as mesmas cores.
PRO_FLASH = {
    'carroca': {
        'description': (
            'Medieval wooden supply wagon, four spoked wheels with iron rims, open bed loaded '
            'with two crates, one barrel and grain sacks under a tied canvas tarp, empty shafts '
            'resting on the ground at the front, no animals. Weathered brown planks. About 40 px '
            'tall above the ground. Dark brown selective outline, not black. ' + PIXEL),
        'view': 'low top-down',
        'image_size': {'width': 128, 'height': 128},
        'n_directions': 8,
        'seed': 20261023,
        'target_palette': {'colors': MADEIRA + LONA + FERRO},
    },
    'cavalo': {
        'description': (
            'Dead horse lying on its side across a dirt road, legs stiff and straight, bay coat, '
            'black mane and tail, saddle with saddlebags, three arrows with black feathers and '
            'pale wooden shafts stuck in the flank and neck, small solid dark blood pool under '
            'the chest. Low and long: body about 16 px tall, arrows reaching at most 28 px. '
            'Dark selective outline, not black. ' + PIXEL),
        'view': 'low top-down',
        'image_size': {'width': 96, 'height': 64},
        'n_directions': 8,
        'seed': 20261024,
        'target_palette': {'colors': BAIO + ['#141012', '#3e2a1b', '#5e4029', '#141418',
                                             '#8a6a44', '#b8996a', '#4a1510', '#6e2418']},
    },
}

CONJUNTOS = {
    'arvore': {
        'description': (
            'Single deciduous oak tree for an isometric tactical RPG forest edge. '
            'Lumpy round canopy of 4-6 leaf clusters filling about 90% of the canvas width, '
            'canopy top touching the top edge, short thick trunk under the canopy, trunk base '
            'centered 4 px above the bottom edge. Lit clusters top-left, deep shadow lower '
            'right. Dark green selective 1-pixel outline, not black. ' + PIXEL),
        'size': 84,
        'view': 'top-down',
        'item_descriptions': [
            'oak, symmetric canopy, trunk visible 12 px',
            'oak, canopy leaning slightly left',
            'oak, canopy leaning slightly right',
            'oak, canopy with three big lobes on top',
            'oak, wide flat-topped canopy, trunk visible 10 px',
            'oak, canopy with one small gap showing a branch',
            'oak seen in a dense forest, canopy reaching the bottom, no trunk visible',
            'oak seen in a dense forest, two-lobed canopy reaching the bottom, no trunk visible',
        ],
        'target_palette': {'colors': FOLHA + TRONCO},
    },
    # ARVORE ALTA. A primeira leva saiu com 63-78 px de altura, contra 40-46
    # dos personagens: razao de 1,4 a 1,9, que le como arbusto grande. Em
    # jogo tatico isometrico a arvore fica com 3,5 a 4 vezes o personagem. A
    # 168 px a rota rende 4 candidatos por chamada; duas chamadas com
    # silhuetas diferentes dao a variedade.
    'arvore-alta': {
        'description': (
            'Single tall mature deciduous oak tree for an isometric tactical RPG forest, seen '
            'from a low three-quarter top-down camera. Large rounded canopy of many leaf clusters '
            'filling about 90% of the canvas width and the top two thirds of the canvas, thick '
            'trunk and some visible roots in the lower third, trunk base centered 4 px above the '
            'bottom edge. Lit clusters top-left, deep shadow lower right. Dark green selective '
            '1-pixel outline, not black. ' + PIXEL),
        'size': 168,
        'view': 'top-down',
        'item_descriptions': [
            'tall oak, broad round canopy, straight trunk',
            'tall oak, canopy leaning slightly left, trunk with a fork',
            'tall oak, tall oval canopy, slender trunk',
            'tall oak, wide uneven canopy with three big lobes',
        ],
        'target_palette': {'colors': FOLHA + TRONCO},
    },
    'arvore-alta-2': {
        'description': (
            'Single tall mature deciduous oak tree for an isometric tactical RPG forest, seen '
            'from a low three-quarter top-down camera. Large canopy filling about 90% of the '
            'canvas width and the top two thirds, thick trunk in the lower third, trunk base '
            'centered 4 px above the bottom edge. Lit clusters top-left, deep shadow lower right. '
            'Dark green selective 1-pixel outline, not black. ' + PIXEL),
        'size': 168,
        'view': 'top-down',
        'item_descriptions': [
            'tall oak, canopy leaning slightly right, gnarled trunk',
            'tall oak, very dense dark canopy, short thick trunk',
            'tall oak, canopy with a gap showing a branch',
            'tall oak, two-lobed canopy, twin trunk',
        ],
        'target_palette': {'colors': FOLHA + TRONCO},
    },
    # Arbusto e pedra herdam o estilo da ARVORE ESCOLHIDA: a imagem de estilo
    # e a copa dela sobre dois losangos de grama do chao. Com `style_images`
    # a rota nao aceita `size` -- o tamanho sai da imagem de estilo (56 e 40).
    'arbusto': {
        'description': (
            'Low dense shrub thicket for an isometric tactical RPG, same leaves as the reference '
            'tree. About 52 px wide and 32 px tall, sitting on the bottom of the canvas, 3-4 '
            'rounded leaf clumps with a few dark gaps, no flowers. Dark green selective outline, '
            'not black. ' + PIXEL),
        'view': 'top-down',
        'estilo': ['arbusto-estilo.png'],
        'item_descriptions': ['shrub, three clumps, lower on the right',
                              'shrub, four round clumps', 'shrub, long and low, two clumps'],
        'target_palette': {'colors': FOLHA},
    },
    'pedra': {
        'description': (
            'Weathered grey granite boulder for an isometric tactical RPG. About 36 px wide and '
            '26 px tall, sitting on the bottom of the canvas, irregular rounded shape with one '
            'flat facet on top, a little green moss on the top-left, two small cracks. Dark '
            'selective outline, not black. ' + PIXEL),
        'view': 'top-down',
        'estilo': ['pedra-estilo.png'],
        'item_descriptions': ['single round boulder', 'boulder with a split crack',
                              'flat wide boulder', 'two stacked stones'],
        'target_palette': {'colors': GRANITO + FOLHA[2:5]},
    },
}

ESTILOS = AQUI / '_referencias' / 'pixellab' / 'objetos' / 'estilo'


def chamar(token, metodo, caminho, corpo=None, espera=300):
    req = urllib.request.Request(f'{BASE}{caminho}',
                                 data=json.dumps(corpo).encode() if corpo else None,
                                 method=metodo)
    req.add_header('Authorization', f'Bearer {token}')
    if corpo:
        req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, timeout=espera) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        corpo_erro = e.read().decode(errors='replace')[:700]
        if e.code == 423:
            return 423, None
        raise SystemExit(f'HTTP {e.code} em {metodo} {caminho}: {corpo_erro}')


def urls(no, caminho=''):
    if isinstance(no, str) and no.startswith('http'):
        yield caminho, no
    elif isinstance(no, dict):
        for k, v in no.items():
            yield from urls(v, f'{caminho}.{k}' if caminho else str(k))
    elif isinstance(no, list):
        for i, v in enumerate(no):
            yield from urls(v, f'{caminho}[{i}]')


def medir(im):
    """O aceite do revisor de cenario, em numeros."""
    rgba = im.convert('RGBA')
    px = rgba.load()
    w, h = rgba.size
    parcial = acesos = perim = 0
    lums = []
    op = lambda x, y: 0 <= x < w and 0 <= y < h and px[x, y][3] > 0
    for y in range(h):
        for x in range(w):
            a = px[x, y][3]
            if 0 < a < 255:
                parcial += 1
            if a == 0:
                continue
            acesos += 1
            r, g, b, _ = px[x, y]
            lums.append(0.299 * r + 0.587 * g + 0.114 * b)
            perim += sum(1 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)) if not op(x + dx, y + dy))
    bb = rgba.getbbox()
    lums.sort()
    return {
        'caixa': bb, 'larg_alt': (bb[2] - bb[0], bb[3] - bb[1]) if bb else None,
        'alfa_parcial': parcial,
        'borda': round(perim / math.sqrt(acesos), 1) if acesos else None,
        'lum_mediana': round(lums[len(lums) // 2], 1) if lums else None,
        'cores': len({px[x, y][:3] for y in range(h) for x in range(w) if px[x, y][3]}),
    }


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--conjunto', required=True, choices=list(CONJUNTOS) + list(PRO_FLASH))
    p.add_argument('--go', action='store_true')
    p.add_argument('--buscar', metavar='OBJECT_ID')
    a = p.parse_args()
    token = os.environ.get('PIXELLAB_TOKEN')
    if not token:
        raise SystemExit('defina PIXELLAB_TOKEN no ambiente')

    # Sem `seed`: esta rota recusa o campo com 422 ("extra inputs are not
    # permitted"). A reprodutibilidade vem de guardar os candidatos baixados.
    rota = '/create-object-pro-flash' if a.conjunto in PRO_FLASH else '/create-1-direction-object'
    corpo = dict(PRO_FLASH.get(a.conjunto) or CONJUNTOS[a.conjunto])
    if 'estilo' in corpo:
        import base64
        corpo['style_images'] = [
            {'type': 'base64', 'format': 'png',
             'base64': base64.b64encode((ESTILOS / n).read_bytes()).decode()}
            for n in corpo.pop('estilo')]
    _, b = chamar(token, 'GET', '/balance')
    antes = b['subscription']['generations']
    print(f'PLANO: {a.conjunto} | saldo {antes:.0f}')
    if not a.go and not a.buscar:
        print(json.dumps({k: v for k, v in corpo.items() if k != 'description'}, indent=2))
        print('(seco: nada foi gerado. use --go)')
        return

    if a.buscar:
        oid = a.buscar
    else:
        _, r = chamar(token, 'POST', rota, corpo)
        oid = r['object_id']
        print('pedido:', oid, '| quadros:', r.get('n_frames'))

    inicio = time.time()
    while True:
        st, d = chamar(token, 'GET', f'/objects/{oid}')
        # Pronto e quando ha URL e o status ja saiu da fila. Nao se compara o
        # nome exato do status: a documentacao nao o fixa, e esperar por um
        # nome errado faria o script dormir ate o tempo esgotar.
        tem_url = st == 200 and d and any(
            True for _ in urls({k: d.get(k) for k in ('frame_urls', 'storage_urls', 'rotation_urls')}))
        pronto = tem_url and d.get('status') not in ('pending', 'processing', 'queued', 'running')
        if pronto:
            break
        if st == 200 and d and d.get('status') in ('failed', 'error'):
            raise SystemExit(f'falhou: {json.dumps(d)[:400]}')
        if time.time() - inicio > 1800:
            raise SystemExit('tempo esgotado')
        time.sleep(12)

    destino = SAIDA / a.conjunto / oid
    destino.mkdir(parents=True, exist_ok=True)
    (destino / 'meta.json').write_text(json.dumps(d, indent=2), encoding='utf-8')
    vistos = set()
    print(f"\n{'arquivo':28} {'larg x alt':11} {'alfa':>5} {'borda':>6} {'lum':>6} {'cores':>6}")
    for chave, url in urls({k: d.get(k) for k in ('frame_urls', 'storage_urls', 'rotation_urls')}):
        if url in vistos:
            continue
        vistos.add(url)
        nome = chave.replace('.', '_').replace('[', '_').replace(']', '')
        arq = destino / f'{nome}.png'
        # O CDN responde 403 ao User-Agent padrao do Python.
        pedido = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(pedido, timeout=120) as resp:
            arq.write_bytes(resp.read())
        try:
            m = medir(Image.open(arq))
        except Exception as e:  # um arquivo que nao e imagem nao derruba a leva
            print(f'  {arq.name}: nao e imagem ({e})')
            continue
        print(f"{arq.name:28} {str(m['larg_alt']):11} {m['alfa_parcial']:5} "
              f"{m['borda']!s:>6} {m['lum_mediana']!s:>6} {m['cores']:6}")
    _, b = chamar(token, 'GET', '/balance')
    print(f'\nsaldo depois: {b["subscription"]["generations"]:.0f} '
          f'(gastou {antes - b["subscription"]["generations"]:.0f})')
    print('pasta:', destino)


if __name__ == '__main__':
    main()
