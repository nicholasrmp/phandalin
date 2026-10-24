# -*- coding: utf-8 -*-
"""
Gera VARIAS variacoes de ladrilho isometrico numa chamada so, no PixelLab.

ISTO GASTA GERACOES. Sem `--go` so imprime o plano.

POR QUE ESTA ROTA E NAO `/create-isometric-tile`.

A outra gera um ladrilho por chamada, e cada chamada tem o seu proprio
"pintor": quatro gramas pedidas separadamente saem com quatro luzes, quatro
paletas e quatro graos diferentes, e lado a lado no tabuleiro isso aparece.
O `tiles-pro` recebe as variacoes NUMERADAS numa descricao so -- "1). grama
2). grama com trevo 3). estrada..." -- e as desenha juntas, no mesmo estilo.

Tres parametros que nao sao gosto:

  tile_flat_top_px = 4    a ponta do losango com 4 px, que e exatamente a
                          fileira 0 da particao exata de `losango.py`.
  tile_depth_ratio = 0    sem face lateral. O motor so desenha lateral quando
                          o quadrado esta elevado, e ai ele mesmo a pinta.
  outline_mode = segmentation
                          zonas de cor sem contorno; a documentacao diz que da
                          "bordas mais limpas para emendar". Contorno em cada
                          ladrilho viraria uma grade preta no tabuleiro.

Os arquivos baixados vem de fora: vao para uma pasta propria, nunca para
perto do codigo.
"""
import argparse
import json
import os
import time
import urllib.error
import urllib.request
from pathlib import Path

BASE = 'https://api.pixellab.ai/v2'
AQUI = Path(__file__).resolve().parents[2]
SAIDA = AQUI / '_referencias' / 'pixellab' / 'ladrilhos-pro'

ESTILO = ('True pixel art isometric ground tiles for a grounded fantasy tactical RPG. '
          'Hard square pixels, no anti-aliasing, no blur, no gradients, every pixel fully '
          'opaque. Flat colour fills with hard-edged tonal steps. Muted earthy palette, '
          'light from the upper left. Each tile is evenly lit edge to edge with no vignette, '
          'no border and no darker rim, so identical tiles placed side by side show no seam. '
          'Small details sit in the INTERIOR of the tile and never along its edges. '
          'No objects, no stones larger than a pixel or two, nothing outside the tile shape.')

CONJUNTOS = {
    # Uma variacao so, para medir a geometria. NAO economiza: o tiles-pro
    # devolve sempre 16 ladrilhos e cobra ~10 geracoes, peca uma variacao ou
    # oito -- medido. Rendeu 16 gramados, que sao o chao de grama do jogo.
    'sonda': ESTILO + ' 1). short dark green grass, uniform.',
    # Estrada sem sulco de roda: o sulco corre no eixo da estrada, mas a trilha
    # do norte corre no outro eixo, e la ele ficaria atravessado. Variacao que
    # nao aponta para lado nenhum serve aos dois.
    'estrada': ESTILO + ' '
               '1). packed brown dirt road, uniform. '
               '2). packed brown dirt road with a few tiny pebbles. '
               '3). packed brown dirt road with slightly darker damp patches. '
               '4). packed brown dirt road with faint lighter dusty patches. '
               '5). packed brown dirt road with a few faint hoof prints. '
               '6). packed brown dirt road with a little loose gravel. '
               '7). packed brown dirt road with one or two thin dry cracks. '
               '8). packed brown dirt road, sun-baked and slightly lighter.',
    'chao': ESTILO + ' '
            '1). short dark green grass, uniform. '
            '2). short dark green grass with a few tiny clover leaves. '
            '3). short dark green grass with slightly lighter worn patches. '
            '4). short dark green grass with a few short taller blades. '
            '5). packed brown dirt road, uniform. '
            '6). packed brown dirt road with faint cart wheel ruts. '
            '7). packed brown dirt road with a few tiny pebbles. '
            '8). packed brown dirt road with slightly darker damp patches.',
    # O esconderijo dos goblins (capitulo 2). Chao, riacho e poco na MESMA
    # leva: lado a lado no mapa, com tres pintores diferentes, a margem do
    # riacho viraria uma costura de paleta.
    'caverna': ESTILO + ' Underground cave, dim and cool, seen by torchlight. '
               '1). dark grey-brown cave floor of packed earth and flat stone, uniform. '
               '2). dark grey-brown cave floor with a few tiny pebbles. '
               '3). dark grey-brown cave floor with a faint damp darker patch. '
               '4). dark grey-brown cave floor with a thin crack in the stone. '
               '5). dark grey-brown cave floor with a little grit and dust. '
               '6). dark grey-brown cave floor, slightly smoother flat stone. '
               '7). shallow clear stream water over dark pebbles, slight ripples, uniform. '
               '8). shallow clear stream water over dark pebbles with a little foam. '
               '9). deep still dark blue-green pool water, uniform. '
               '10). deep still dark blue-green pool water with a faint reflection.',
    # O topo da rocha (a massa entre os corredores, vista de cima), o entulho
    # e as tabuas da ponte.
    # O porao da Mansao Tresendar: lajes quentes (o piso da caverna e a
    # referencia de tom), a agua da cisterna e o fosso aberto.
    'masmorra': ESTILO + ' Cellar under a ruined manor, dim and warm, seen by torchlight. '
                '1). large square grey-brown flagstones with thin dark mortar joints, worn smooth, uniform. '
                '2). large square grey-brown flagstones with dark mortar joints and a few tiny chips. '
                '3). large square grey-brown flagstones, two slabs of slightly different tone. '
                '4). large square grey-brown flagstones with uneven joints. '
                '5). large square grey-brown flagstones, very worn and dusty. '
                '6). large square grey-brown flagstones with one thin diagonal crack. '
                '7). large square grey-brown flagstones with a small dark damp moss patch in the middle. '
                '8). large square grey-brown flagstones with a little fine grit. '
                '9). still dark green-black cistern water, flat, a few pale highlight pixels. '
                '10). still dark green-black cistern water with one faint ring. '
                '11). bottomless near-black pit, almost entirely black with a few dark grey flecks. '
                '12). bottomless near-black pit, black with faint dark brown bands.',
    # Faces laterais do porao (montar-faces.py): BLOCOS com face, todos numa
    # chamada para sairem no mesmo tom. Pedidos um a um, os de alvenaria
    # vieram creme, roxo e rosa.
    'paredes': ESTILO.replace('No objects,', 'Each tile is a solid block with its two side faces visible. No objects,') + ' '
               '1). cut-stone masonry block, warm grey-brown hewn stone courses with thin dark mortar, uniform. '
               '2). cut-stone masonry block, warm grey-brown courses, one slightly cracked stone. '
               '3). cut-stone masonry block, warm grey-brown courses, one darker repaired stone. '
               '4). cut-stone masonry block, warm grey-brown courses, slightly worn edges. '
               '5). cut-stone masonry block, warm grey-brown courses, a few chipped stones. '
               '6). cut-stone masonry block, warm grey-brown courses, faint dust. '
               '7). natural cave rock cliff block, dark cold grey stone, rough vertical strata. '
               '8). natural cave rock cliff block, dark cold grey stone, a long crack. '
               '9). natural cave rock cliff block, dark cold grey stone, small ledges. '
               '10). natural cave rock cliff block, dark cold grey stone, rough and uneven.',
    # O alto dos planaltos do Cume da Wyvern: pedra bege-acinzentada ao sol,
    # com capim duro nas frestas (o mapa de referencia do usuario).
    'planalto': ESTILO + ' Rocky hilltop in bright daylight, warm beige-grey stone. '
                '1). flat weathered beige-grey bedrock, uniform. '
                '2). flat weathered beige-grey bedrock with a few thin cracks. '
                '3). beige-grey bedrock with small loose pebbles. '
                '4). beige-grey bedrock with a tuft of dry yellow grass in a crack. '
                '5). beige-grey bedrock, slightly darker and rougher. '
                '6). beige-grey bedrock with faint lichen spots. '
                '7). beige-grey bedrock with a shallow worn dip. '
                '8). beige-grey bedrock with tiny scattered gravel.',
    'rocha': ESTILO + ' Underground cave, dim and cool, seen by torchlight. '
             '1). top of solid dark grey cave rock, rough and uneven, uniform. '
             '2). top of solid dark grey cave rock with a few small cracks. '
             '3). top of solid dark grey cave rock with faint lighter edges of stone. '
             '4). top of solid dark grey cave rock, slightly mossy dark green flecks. '
             '5). cave floor covered in loose broken rubble and small fallen rocks. '
             '6). cave floor covered in loose broken rubble, a few larger chunks. '
             '7). weathered wooden bridge planks laid side by side, dark brown, uniform. '
             '8). weathered wooden bridge planks laid side by side with a few iron nails.',
}


# Paleta forcada por conjunto. Paredes: alvenaria quente (topo claro, faces
# do porao) e rocha fria escura -- nunca azul saturado.
PALETAS = {
    'paredes': ['#1e1c1a', '#2a2724', '#3d3a35', '#57534b', '#6e695d', '#8d8878', '#a39e8c',
                '#1f2428', '#2c3035', '#3b3f44', '#4d5156', '#62666a'],
}


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
        corpo_erro = e.read().decode(errors='replace')[:600]
        if e.code == 423 or 'still being generated' in corpo_erro:
            return 423, None
        raise SystemExit(f'HTTP {e.code} em {metodo} {caminho}: {corpo_erro}')


def urls(no, caminho=''):
    """Todas as URLs dentro de `storage_urls`, com o caminho de chaves de cada uma."""
    if isinstance(no, str) and no.startswith('http'):
        yield caminho, no
    elif isinstance(no, dict):
        for k, v in no.items():
            yield from urls(v, f'{caminho}.{k}' if caminho else str(k))
    elif isinstance(no, list):
        for i, v in enumerate(no):
            yield from urls(v, f'{caminho}[{i}]')


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--conjunto', default='chao', choices=list(CONJUNTOS))
    p.add_argument('--go', action='store_true')
    p.add_argument('--buscar', metavar='TILE_ID', help='so baixa um pedido ja feito')
    p.add_argument('--semente', type=int, default=20261024)
    p.add_argument('--profundidade', type=float, default=0,
                   help='tile_depth_ratio: 0 sem face lateral; os blocos de parede pedem face')
    p.add_argument('--angulo', type=float, default=None,
                   help='tile_view_angle; 30 da o losango 2:1 (seno de 30 = 0,5)')
    a = p.parse_args()

    token = os.environ.get('PIXELLAB_TOKEN')
    if not token:
        raise SystemExit('defina PIXELLAB_TOKEN no ambiente')

    corpo = {
        'description': CONJUNTOS[a.conjunto],
        'tile_type': 'isometric',
        'tile_size': 64,
        # ALTURA EXPLICITA. Sem ela o PixelLab calcula a altura pelo angulo de
        # vista padrao e o losango sai com 64 x ~26 -- outra projecao. Medido
        # na primeira leva: 16 ladrilhos com caixa de 25 a 30 px de altura, e
        # de 158 a 311 pixels faltando dentro da particao exata. Esticar para
        # 32 seria escala quebrada (1,23x), que destroi pixel art; mudar o TH
        # do motor mexeria em criatura, camera e clique. Entao se pede certo.
        'tile_height': 32 if not a.profundidade else 64,
        'tile_depth_ratio': a.profundidade,
        # A segunda leva provou que `tile_height` so define a LONA: veio 64x32,
        # mas o losango dentro dela tinha 22 px de altura. O achatamento vem do
        # angulo da camera. Um losango 2:1 e um quadrado girado 45 graus e
        # visto de cima a um angulo cujo seno e 0,5 -- ou seja, 30 graus.
        'tile_flat_top_px': 4,
        'outline_mode': 'segmentation',
        'seed': a.semente,
    }
    if a.angulo is not None:
        corpo['tile_view_angle'] = a.angulo
    if a.conjunto in PALETAS:
        corpo['target_palette'] = {'colors': PALETAS[a.conjunto]}
    _, b = chamar(token, 'GET', '/balance')
    antes = b['subscription']['generations']
    print('PLANO')
    print(json.dumps({k: v for k, v in corpo.items() if k != 'description'}, indent=2))
    print(f'saldo: {antes:.0f}')
    if not a.go and not a.buscar:
        print('\n(seco: nada foi gerado. use --go)')
        return

    if a.buscar:
        tid = a.buscar
    else:
        _, r = chamar(token, 'POST', '/create-tiles-pro', corpo)
        tid = r['tile_id']
        print('pedido:', tid, '| usage', r.get('usage'))

    print('gerando', end='', flush=True)
    inicio = time.time()
    while True:
        st, d = chamar(token, 'GET', f'/tiles-pro/{tid}')
        if st != 423 and d and d.get('storage_urls'):
            break
        if time.time() - inicio > 900:
            raise SystemExit('\ntempo esgotado')
        print('.', end='', flush=True)
        time.sleep(10)
    print()

    destino = SAIDA / tid
    destino.mkdir(parents=True, exist_ok=True)
    (destino / 'meta.json').write_text(json.dumps(
        {'tile_id': tid, 'kind': d.get('kind'), 'tile_rules': d.get('tile_rules'),
         'storage_urls': d.get('storage_urls')}, indent=2), encoding='utf-8')
    print('kind:', d.get('kind'))
    for chave, url in urls(d['storage_urls']):
        nome = chave.replace('.', '_').replace('[', '_').replace(']', '')
        ext = Path(url.split('?')[0]).suffix or '.png'
        arq = destino / f'{nome}{ext}'
        # O CDN do PixelLab responde 403 ao `Python-urllib` padrao e 200 a
        # qualquer navegador -- testado com o mesmo URL. Nao e autenticacao: a
        # URL ja e publica; e o filtro de robos do CDN.
        pedido = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(pedido, timeout=120) as resp:
            arq.write_bytes(resp.read())
        print(f'  {chave:30} -> {arq.name}')

    _, b = chamar(token, 'GET', '/balance')
    print(f'saldo depois: {b["subscription"]["generations"]:.0f} '
          f'(gastou {antes - b["subscription"]["generations"]:.0f})')
    print(f'pasta: {destino}')


if __name__ == '__main__':
    main()
