# -*- coding: utf-8 -*-
"""
Anima um objeto de cenario ja no atlas (a roda d'agua da mina, por exemplo) pelo `/animate-pixminimax` do PixelLab.

ISTO GASTA GERACOES (1 por pedido, nos testes do repositorio). Sem `--go` so imprime o plano e o saldo.

    PIXELLAB_TOKEN=... python src/dev/animar-objeto.py --grupo prop-rodaDagua --nome roda --go
    PIXELLAB_TOKEN=... python src/dev/animar-objeto.py --buscar JOB_ID --nome roda     # rebaixa sem gastar

O quadro de partida e recortado do atlas (`src/art/folhas/cenario.png`). Os quadros voltam em
`_referencias/pixellab/animacoes-objetos/<nome>/f00.png ...` (o 0 e o quadro de entrada, sem mudanca).
"""
import argparse
import base64
import io
import json
import os
import time
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image

BASE = 'https://api.pixellab.ai/v2'
AQUI = Path(__file__).resolve().parents[2]
ATLAS = AQUI / 'src' / 'art' / 'folhas'
SAIDA = AQUI / '_referencias' / 'pixellab' / 'animacoes-objetos'


def chamar(token, metodo, caminho, corpo=None):
    req = urllib.request.Request(f'{BASE}{caminho}', data=json.dumps(corpo).encode() if corpo else None, method=metodo)
    req.add_header('Authorization', f'Bearer {token}')
    if corpo:
        req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        if e.code == 423:
            return 423, None
        raise SystemExit(f'HTTP {e.code} em {metodo} {caminho}: {e.read().decode(errors="replace")[:700]}')


def recortar(grupo):
    d = json.loads((ATLAS / 'cenario.json').read_text(encoding='utf-8'))
    q = d[grupo]['todas'][0]
    im = Image.open(ATLAS / 'cenario.png').convert('RGBA')
    return im.crop((q['x'], q['y'], q['x'] + q['w'], q['y'] + q['h']))


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--grupo', default='prop-rodaDagua')
    p.add_argument('--nome', required=True)
    p.add_argument('--acao', default='the big wooden water wheel turns slowly and steadily clockwise around its iron hub, '
                   'the spokes and paddle boards rotating; the stone walls and the plank floor stay perfectly still')
    p.add_argument('--sujeito', default='a wooden water wheel with iron rim and spokes on a stone mill housing')
    p.add_argument('--frames', type=int, default=8)
    p.add_argument('--go', action='store_true')
    p.add_argument('--buscar', metavar='JOB_ID')
    a = p.parse_args()
    token = os.environ.get('PIXELLAB_TOKEN')
    if not token:
        raise SystemExit('defina PIXELLAB_TOKEN no ambiente')
    _, b = chamar(token, 'GET', '/balance')
    antes = b['subscription']['generations']
    print(f'PLANO: {a.grupo} -> {a.nome} | {a.frames} quadros | saldo {antes:.0f}')
    if not a.go and not a.buscar:
        print('acao:', a.acao)
        print('(seco: nada foi gerado. use --go)')
        return
    destino = SAIDA / a.nome
    destino.mkdir(parents=True, exist_ok=True)
    if a.buscar:
        job = a.buscar
    else:
        quadro = recortar(a.grupo)
        quadro.save(destino / 'entrada.png')
        buf = io.BytesIO()
        quadro.save(buf, 'PNG')
        corpo = {
            'first_frame': {'type': 'base64', 'format': 'png', 'base64': base64.b64encode(buf.getvalue()).decode()},
            'description': a.acao, 'frame_count': a.frames, 'no_background': True,
            'view': 'low top-down', 'subject_description': a.sujeito,
        }
        _, r = chamar(token, 'POST', '/animate-pixminimax', corpo)
        job = r['background_job_id']
        print('trabalho:', job, '| usage:', r.get('usage'))
        (destino / 'trabalho.txt').write_text(job + '\n', encoding='utf-8')
    inicio = time.time()
    while True:
        st, d = chamar(token, 'GET', f'/background-jobs/{job}')
        if st == 200 and d and d.get('status') == 'completed':
            break
        if st == 200 and d and d.get('status') in ('failed', 'error'):
            raise SystemExit(f'falhou: {json.dumps(d)[:500]}')
        if time.time() - inicio > 1500:
            raise SystemExit('tempo esgotado')
        time.sleep(8)
    imgs = (d.get('last_response') or {}).get('images') or []
    print(len(imgs), 'quadros')
    for i, im in enumerate(imgs):
        if isinstance(im, dict):
            dado = im.get('base64') or im.get('image') or im.get('url')
        else:
            dado = im
        if isinstance(dado, str) and dado.startswith('http'):
            pedido = urllib.request.Request(dado, headers={'User-Agent': 'Mozilla/5.0'})
            bruto = urllib.request.urlopen(pedido, timeout=120).read()
        else:
            bruto = base64.b64decode(dado.split(',')[-1])
        Image.open(io.BytesIO(bruto)).convert('RGBA').save(destino / f'f{i:02d}.png')
    _, b = chamar(token, 'GET', '/balance')
    print(f'saldo depois: {b["subscription"]["generations"]:.0f} (gastou {antes - b["subscription"]["generations"]:.0f})')
    print('pasta:', destino)


if __name__ == '__main__':
    main()
