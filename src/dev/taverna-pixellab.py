# -*- coding: utf-8 -*-
"""
A arte da TAVERNA no PixelLab (MULTIJOGADOR.md, T-16): o kit de parede e piso
no estilo da referencia do dono (taverna de madeira e tijolo, quente, de luz de
lareira), na projecao isometrica do motor.

ISTO GASTA GERACOES. Sem `--go` so imprime o plano e o saldo.

    PIXELLAB_TOKEN=<token> python -I src/dev/taverna-pixellab.py --peca kit
    PIXELLAB_TOKEN=<token> python -I src/dev/taverna-pixellab.py --peca kit --go
    PIXELLAB_TOKEN=<token> python -I src/dev/taverna-pixellab.py --peca kit --buscar TILE_ID

Pecas:
    kit     chao de tabuas, parede de tijolo com vigas, portas, escada (`building`, ~25)
    chao    16 variacoes de tabuas e de tapete (`create-tiles-pro`, ~10)

Os objetos (balcao, lareira, mesas, barris...) vao por `objetos-pixellab.py`, que ja
sabe as rotas de uma e de oito direcoes; este script cobre so o que e ladrilho.
Saida em `_referencias/pixellab/kits/taverna/` (fora do codigo; o atlas do jogo e da
sessao do Cenario, `dev/montar-cenario.py`).

O token vem SO da variavel de ambiente, nunca de arquivo.
"""
import argparse
import json
import os
import time
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image

BASE = 'https://api.pixellab.ai/v2'
AQUI = Path(__file__).resolve().parents[2]
SAIDA = AQUI / '_referencias' / 'pixellab' / 'kits' / 'taverna'

# As cores da pintura de referencia: madeira velha de ponta a ponta, tijolo
# vermelho, pedra cinza da lareira, e o laranja do fogo e das velas.
PALETA = [
    '#1b1210', '#2e1c12', '#4a2a16', '#6b3f1d', '#8a5426', '#a8692f', '#c98a3d', '#e6b565',   # madeira
    '#5a1f18', '#7d2e20', '#a54130', '#c9603a',                                                 # tijolo
    '#3b3b3e', '#5d5d62', '#8b8a88',                                                            # pedra
    '#e8862c', '#f6b94a', '#fde08a',                                                            # fogo e vela
]

PECAS = {
    'kit': {
        'description': ('Cozy medieval tavern interior for a fantasy tactical RPG, warm and lived-in, '
                        'lit by a fireplace, red brick walls with dark timber beams and posts, wide '
                        'wooden plank floor, no furniture, no people.'),
        'building_wall_description': ('red brick wall with thick dark oak timber beams and posts, '
                                      'warm firelit tones, aged mortar'),
        'building_floor_description': 'wide worn wooden planks, warm brown, with dark gaps between the boards',
        'building_floor2_description': 'wooden loft walkway of planks along the top of the wall',
        'andares': 2,
        'semente': 20261201,
    },
    'chao': {
        'description': ('Cozy medieval tavern floor for a fantasy tactical RPG, warm firelit tones. '
                        '1). wide worn wooden planks, warm brown. 2). wide worn wooden planks, darker, '
                        'with a stain. 3). wide worn wooden planks laid crosswise. 4). wooden planks '
                        'with scattered straw. 5). a red woven rug with a gold border over planks. '
                        '6). planks with a dark spilled-ale stain. 7). old planks with a knot and a '
                        'nail head. 8). planks lighter and sun-bleached near a window.'),
        'semente': 20261202,
    },
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
        if e.code == 423:
            return 423, None
        raise SystemExit(f'HTTP {e.code} em {metodo} {caminho}: {e.read().decode(errors="replace")[:700]}')


def corpo_de(peca):
    k = PECAS[peca]
    corpo = {
        'description': k['description'],
        'tile_type': 'isometric',
        'tile_size': 64,
        'tile_view_angle': 30,          # losango 2:1, como o chao do jogo
        'tile_flat_top_px': 4,
        'outline_mode': 'segmentation',
        'seed': k['semente'],
        'target_palette': {'colors': PALETA},
    }
    if peca == 'kit':
        corpo.update({
            'tile_height': 64,
            'tile_feature': 'building',
            'building_layout': 'grid',
            'building_wall_tiles': k['andares'],
            'building_wall_description': k['building_wall_description'],
            'building_floor_description': k['building_floor_description'],
            'building_floor2_description': k['building_floor2_description'],
        })
    else:
        corpo.update({'tile_height': 32, 'tile_depth_ratio': 0})
    return corpo


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--peca', default='kit', choices=list(PECAS))
    p.add_argument('--go', action='store_true')
    p.add_argument('--buscar', metavar='TILE_ID')
    a = p.parse_args()
    token = os.environ.get('PIXELLAB_TOKEN')
    if not token:
        raise SystemExit('defina PIXELLAB_TOKEN no ambiente')

    corpo = corpo_de(a.peca)
    _, b = chamar(token, 'GET', '/balance')
    antes = b['subscription']['generations']
    print('PLANO'); print(json.dumps({x: v for x, v in corpo.items() if x != 'description'}, indent=2))
    print(f'saldo: {antes:.0f}')
    if not a.go and not a.buscar:
        print('(seco: nada foi gerado. use --go)')
        return

    tid = a.buscar
    if not tid:
        _, r = chamar(token, 'POST', '/create-tiles-pro', corpo)
        tid = r['tile_id']
        print('pedido:', tid, '| usage', r.get('usage'))

    inicio = time.time()
    while True:
        st, d = chamar(token, 'GET', f'/tiles-pro/{tid}')
        if st == 200 and d and d.get('storage_urls'):
            break
        if time.time() - inicio > 1800:
            raise SystemExit('tempo esgotado')
        time.sleep(12)

    destino = SAIDA / a.peca / tid
    destino.mkdir(parents=True, exist_ok=True)
    (destino / 'meta.json').write_text(json.dumps(d, indent=2, ensure_ascii=False), encoding='utf-8')
    print('kind:', d.get('kind'), '| pecas:', len(d['storage_urls']))
    for nome, url in sorted(d['storage_urls'].items()):
        arq = destino / f'{nome}.png'
        pedido = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(pedido, timeout=120) as resp:
            arq.write_bytes(resp.read())
        im = Image.open(arq)
        print(f'  {nome:28} {im.size}')
    regras = d.get('tile_rules')
    if regras:
        (destino / 'regras.json').write_text(json.dumps(regras, indent=2, ensure_ascii=False), encoding='utf-8')
        print('regras de encaixe em regras.json')
    _, b = chamar(token, 'GET', '/balance')
    print(f'saldo depois: {b["subscription"]["generations"]:.0f} (gastou {antes - b["subscription"]["generations"]:.0f})')
    print('pasta:', destino)


if __name__ == '__main__':
    main()
