# -*- coding: utf-8 -*-
"""
Gera um modelo 3D no Tripo3D e baixa o .glb, para virar sprite de prédio.

ISTO GASTA CRÉDITOS. Sem `--go` só mostra o plano e o saldo.

POR QUE 3D PARA PRÉDIO. Objeto grande pedido direto ao gerador de pixel art
sai na perspectiva dele, não na do tabuleiro (a primeira ponte saiu torta).
Com o modelo, o Blender fotografa no ângulo EXATO do jogo e nas quatro
rotações da câmera (`src/dev/render-iso.py`), e a pegada no chão bate com as
casas.

A chave vem do ambiente (`TRIPO_KEY`), nunca do código nem de arquivo.
O que baixa vai para `_referencias/tripo/` (fora do repositório).

  TRIPO_KEY=... python src/dev/tripo-modelo.py --nome estalagem --go
"""
import argparse
import json
import os
import time
import urllib.error
import urllib.request
from pathlib import Path

BASE = 'https://api.tripo3d.ai/v2/openapi'
AQUI = Path(__file__).resolve().parents[2]
SAIDA = AQUI / '_referencias' / 'tripo'

ESTILO = ('Stylized low-poly game asset for an isometric fantasy RPG, hand-painted textures, '
          'clean readable shapes, muted earthy colors, no ground plane, no base, no people.')

MODELOS = {
    # Phandalin, parte 2 da aventura. A descrição segue o livro (estalagem
    # nova, de pedra bruta e madeira rústica, no centro da vila).
    'estalagem': ('A newly built two-story frontier inn: ground floor of rough-cut grey fieldstone, '
                  'upper floor of rustic timber framing, steep wooden shingle roof, one stone chimney, '
                  'a small covered porch with a hanging wooden sign over the door, shuttered windows. '
                  'Rectangular footprint about 1.3 times longer than wide. ' + ESTILO),
}


def chamar(chave, metodo, caminho, corpo=None):
    req = urllib.request.Request(f'{BASE}{caminho}', method=metodo,
                                 data=json.dumps(corpo).encode() if corpo else None)
    req.add_header('Authorization', f'Bearer {chave}')
    # A Cloudflare do Tripo recusa (1010) o User-Agent padrão do Python.
    req.add_header('User-Agent', 'Mozilla/5.0')
    if corpo:
        req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f'HTTP {e.code} em {caminho}: {e.read().decode(errors="replace")[:500]}')


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--nome', required=True, choices=list(MODELOS))
    p.add_argument('--go', action='store_true')
    p.add_argument('--buscar', metavar='TASK_ID')
    a = p.parse_args()
    chave = os.environ.get('TRIPO_KEY')
    if not chave:
        raise SystemExit('defina TRIPO_KEY no ambiente')
    saldo = chamar(chave, 'GET', '/user/balance')['data']['balance']
    print(f'saldo: {saldo}')
    if not a.go and not a.buscar:
        print('(seco: nada foi gerado. use --go)')
        return
    tid = a.buscar or chamar(chave, 'POST', '/task', {
        'type': 'text_to_model', 'prompt': MODELOS[a.nome], 'texture': True, 'pbr': False,
    })['data']['task_id']
    print('tarefa:', tid)
    inicio = time.time()
    while True:
        d = chamar(chave, 'GET', f'/task/{tid}')['data']
        if d['status'] in ('success', 'failed', 'cancelled', 'banned', 'expired', 'unknown'):
            break
        if time.time() - inicio > 900:
            raise SystemExit('tempo esgotado')
        time.sleep(8)
    if d['status'] != 'success':
        raise SystemExit(f'falhou: {json.dumps(d)[:400]}')
    destino = SAIDA / a.nome / tid
    destino.mkdir(parents=True, exist_ok=True)
    (destino / 'meta.json').write_text(json.dumps(d, indent=2), encoding='utf-8')
    saida = d.get('output', {})
    url = saida.get('pbr_model') or saida.get('model') or saida.get('base_model')
    for nome, u in [('modelo.glb', url), ('previa.webp', saida.get('rendered_image'))]:
        if not u:
            continue
        pedido = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(pedido, timeout=180) as r:
            (destino / nome).write_bytes(r.read())
        print(f'  {nome}')
    novo = chamar(chave, 'GET', '/user/balance')['data']['balance']
    print(f'saldo depois: {novo} (gastou {saldo - novo})')
    print('pasta:', destino)


if __name__ == '__main__':
    main()
