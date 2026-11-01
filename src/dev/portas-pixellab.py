# -*- coding: utf-8 -*-
"""
AS PORTAS E O PORTAO DA CASA DA MORTE: a folha de cada porta, vista de frente (elevacao), para o tabuleiro
esticar no plano da parede (`board.acabamentoDoVao`).

    PIXELLAB_TOKEN=... python -P src/dev/portas-pixellab.py [--go] [--tipo portaCarvalho]

Seco sem `--go`. Cada pedido e uma imagem do Pixen (`/create-image-pixen`, fundo transparente); varias
sementes por tipo, e a melhor se escolhe olhando a folha de contato em `_referencias/pixellab/portas/`.
O tipo e o material da parede: `portaCarvalho` (1o e 2o andares), `portaVelha` (3o andar e sotao),
`portaoFerro` (o portao da frente da casa).
"""
import argparse
import base64
import json
import os
import urllib.request
from pathlib import Path

AQUI = Path(__file__).resolve().parents[2]
SAIDA = AQUI / '_referencias' / 'pixellab' / 'portas'
BASE = 'https://api.pixellab.ai/v2'

COMUM = ('Front elevation, flat orthographic view straight on, the door fills the whole canvas edge to edge '
         'with a rectangular outline, hard pixels, no anti-aliasing, transparent background, no wall, no '
         'frame around it, no cast shadow. Light from the upper left. ')

TIPOS = {
    'portaCarvalho': {
        'description': (COMUM + 'A single tall double-width manor door leaf of dark polished oak vertical planks '
                        'with two raised carved panels, black iron strap hinges at the top and bottom, a brass '
                        'ring handle and brass studs, well kept and glossy.'),
        'image_size': {'width': 64, 'height': 96},
    },
    'portaVelha': {
        'description': (COMUM + 'A single tall old abandoned door leaf of grey weathered splintered planks, '
                        'rusted black iron straps, a tarnished brass ring handle, cobwebs in the corners, '
                        'cracks, dusty.'),
        'image_size': {'width': 64, 'height': 96},
    },
    'portaoFerro': {
        'description': (COMUM + 'A tall wrought iron double gate of a gothic mansion, vertical black iron bars '
                        'with spear-point finials, two horizontal rails, an ornate scrollwork medallion in the '
                        'middle, a large rusted lock, slightly rusty, you can see through the bars.'),
        'image_size': {'width': 96, 'height': 96},
    },
}


def chamar(token, metodo, caminho, corpo=None):
    req = urllib.request.Request(f'{BASE}{caminho}', data=json.dumps(corpo).encode() if corpo else None, method=metodo)
    req.add_header('Authorization', f'Bearer {token}')
    if corpo:
        req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f'HTTP {e.code} em {caminho}: {e.read().decode(errors="replace")[:600]}')


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--go', action='store_true')
    p.add_argument('--tipo', choices=list(TIPOS))
    p.add_argument('--variacoes', type=int, default=3)
    a = p.parse_args()
    token = os.environ.get('PIXELLAB_TOKEN')
    if not token:
        raise SystemExit('defina PIXELLAB_TOKEN no ambiente')
    antes = chamar(token, 'GET', '/balance')['subscription']['generations']
    tipos = [a.tipo] if a.tipo else list(TIPOS)
    print(f'PLANO: {tipos} x {a.variacoes} | saldo {antes:.0f}')
    if not a.go:
        print('(seco: nada foi gerado. use --go)')
        return
    SAIDA.mkdir(parents=True, exist_ok=True)
    for t in tipos:
        for v in range(a.variacoes):
            corpo = dict(TIPOS[t], no_background=True, detail='highly detailed', outline='single color black outline',
                         seed=20261301 + 17 * v + len(t))
            r = chamar(token, 'POST', '/create-image-pixen', corpo)
            dados = r['image']['base64']
            (SAIDA / f'{t}-{v}.png').write_bytes(base64.b64decode(dados.split(',')[-1]))
            print(' ', t, v, 'ok')
    depois = chamar(token, 'GET', '/balance')['subscription']['generations']
    print(f'saldo depois: {depois:.0f} (gastou {antes - depois:.1f})')


if __name__ == '__main__':
    main()
