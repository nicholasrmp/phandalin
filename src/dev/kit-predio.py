# -*- coding: utf-8 -*-
"""
Gera um KIT DE CONSTRUCAO isometrico no PixelLab (`tile_feature: building`).

ISTO GASTA GERACOES. Sem `--go` so imprime o plano.

POR QUE ESTE E O JEITO CERTO DAS PAREDES.

Desde que a camera ficou fixa, a parede do jogo nao ocupa casa: ela mora na
ARESTA entre duas casas (`core/grid.js`). O PixelLab tem uma rota feita para
isso: `tile_feature: 'building'` devolve um kit com CHAO, PAREDES QUE
EMENDAM, VAOS DE PORTA, PILAR e ESCADA, todos no mesmo estilo e ja na
projecao isometrica -- mais as regras de encaixe de cada peca, em
`tile_rules`.

A geometria do motor (de `board.js`):
    TW = 64, TH = 32     losango de 64 x 32
    LIFT = 22            um nivel de elevacao
Entao `tile_size: 64` com `tile_view_angle: 30` da o losango 2:1, como nos
ladrilhos de chao; `building_wall_tiles` diz quantos andares a parede tem.
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
SAIDA = AQUI / '_referencias' / 'pixellab' / 'kits'

GRANITO = ['#1e1f22', '#3a3b3e', '#56575a', '#77766f', '#9e998b']

KITS = {
    # O Castelo Dentefino: muralha de pedra lavrada e piso de laje.
    'castelo': {
        'description': ('Ruined stone castle interior for a grounded fantasy tactical RPG, '
                        'grim and weathered, moss in the cracks, no furniture, no people.'),
        'building_wall_description': 'thick walls of weathered grey cut stone blocks, chipped and mossy',
        'building_floor_description': 'worn grey flagstone floor',
        'building_floor2_description': 'walkway of grey cut stone along the top of the wall',
        'paleta': GRANITO,
    },
    # O porao da Mansao Tresendar: masmorra fechada, pedra tosca e laje.
    'masmorra': {
        'description': ('Old cellar dungeon under a ruined manor for a grounded fantasy tactical '
                        'RPG, damp and cramped, lit by torches, no furniture, no people.'),
        'building_wall_description': 'rough undressed stone cellar walls, damp, with saltpetre stains',
        'building_floor_description': 'cracked grey flagstone floor',
        'building_floor2_description': 'rough stone ledge along the top of the wall',
        'paleta': GRANITO,
    },
    # O Poco da Coruja Velha: muralha caida, pedra clara comida pelo tempo e
    # pelo mato.
    'ruina': {
        'description': ('Crumbling ruin of an old watchtower courtyard for a grounded fantasy '
                        'tactical RPG, open to the sky, weeds in the cracks, no furniture, no people.'),
        'building_wall_description': 'ruined pale limestone walls, broken tops, weeds and moss in the cracks',
        'building_floor_description': 'dirt and broken paving slabs with grass between them',
        'building_floor2_description': 'broken top of a ruined wall',
        'paleta': GRANITO + ['#4a7236', '#33572e'],
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


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--kit', default='castelo', choices=list(KITS))
    p.add_argument('--go', action='store_true')
    p.add_argument('--buscar', metavar='TILE_ID')
    p.add_argument('--andares', type=int, default=2, help='building_wall_tiles: 1 a 3')
    p.add_argument('--semente', type=int, default=20261130)
    a = p.parse_args()
    token = os.environ.get('PIXELLAB_TOKEN')
    if not token:
        raise SystemExit('defina PIXELLAB_TOKEN no ambiente')

    k = KITS[a.kit]
    corpo = {
        'description': k['description'],
        'tile_type': 'isometric',
        'tile_size': 64,
        'tile_height': 64,
        'tile_view_angle': 30,          # losango 2:1, como o chao
        'tile_flat_top_px': 4,
        'outline_mode': 'segmentation',
        'tile_feature': 'building',
        'building_layout': 'grid',
        'building_wall_tiles': a.andares,
        'building_wall_description': k['building_wall_description'],
        'building_floor_description': k['building_floor_description'],
        'building_floor2_description': k['building_floor2_description'],
        'seed': a.semente,
        'target_palette': {'colors': k['paleta']},
    }
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

    destino = SAIDA / a.kit / tid
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
