# -*- coding: utf-8 -*-
"""
Gera um ladrilho isometrico no PixelLab e mede se ele serve ao tabuleiro.

ISTO GASTA GERACOES. Sem `--go` so imprime o plano.

A GEOMETRIA NAO E NEGOCIAVEL, e foi lida do motor, nao estimada:

    TW = 64, TH = 32          losango de 64 x 32 px
    passo = (32, 16)          por quadrado, em coordenadas de tela
    LIFT = 22                 um nivel de elevacao

O `diamond()` do board.js desenha os vertices em (sx, sy), (sx+32, sy+16),
(sx, sy+32) e (sx-32, sy+16). Entao o topo do ladrilho tem exatamente 64 de
largura por 32 de altura -- a razao 2:1 que a documentacao do PixelLab chama
de `isometric_tile_size: 32`.

O QUE SE MEDE, antes de gerar as outras variacoes:

  1. O desenho cabe no losango de 64x32, sem vazar e sem sobrar.
  2. Nao ha pixel de alfa parcial. Borda meio transparente e o que cria
     costura visivel quando dois ladrilhos encostam.
  3. Ladrilhos vizinhos emendam sem buraco nem sobreposicao.

O item 3 e o que separa ladrilho de sprite, e ele NAO depende da arte: e
geometria de pixel. Ver `no_losango` em losango.py, que e a particao exata -- a primeira
versao deste arquivo media emenda contando sobreposicao, e acusava como
defeito a face lateral, que e justamente o que deve ficar sob o vizinho.

O que a geometria nao resolve e a REPETICAO: um ladrilho so, com feicoes
marcantes, repetido no tabuleiro inteiro vira papel de parede. Isso e
conteudo, e se resolve com variacoes sem feicao e objetos espalhados.
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

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from losango import TW, TH, LIFT, recortar_topo  # noqa: E402

BASE = 'https://api.pixellab.ai/v2'
AQUI = Path(__file__).resolve().parents[2]
SAIDA = AQUI / '_referencias' / 'pixellab' / 'ladrilhos'



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
        raise SystemExit(f'HTTP {e.code} em {metodo} {caminho}: '
                         f'{e.read().decode(errors="replace")[:600]}')


def medir(im):
    """O placar do ladrilho: cabe no losango, borda dura, emenda sem costura."""
    rgba = im.convert('RGBA')
    px = rgba.load()
    w, h = im.size
    bb = rgba.getbbox()
    if bb is None:
        return {'tamanho': im.size, 'vazio': True}
    # O topo do losango e o topo da caixa; o centro dele fica TH/2 abaixo. O
    # que sobra para baixo do losango e a face lateral do ladrilho.
    cx = (bb[0] + bb[2] - 1) / 2
    cy = bb[1] + TH / 2 - 0.5
    parcial = fora = acesos = topo = 0
    for y in range(h):
        for x in range(w):
            a = px[x, y][3]
            if 0 < a < 255:
                parcial += 1
            if a == 0:
                continue
            acesos += 1
            d = abs(x - cx) / (TW / 2) + abs(y - cy) / (TH / 2)
            if d <= 1.02:
                topo += 1
            elif y < cy:
                # Acima do meio do losango e fora dele: vazou para cima.
                fora += 1
    losango = TW * TH // 2
    return {'tamanho': im.size, 'caixa': bb,
            'largura_altura': (bb[2] - bb[0], bb[3] - bb[1]),
            'face_lateral_px': (bb[3] - bb[1]) - TH,
            'alfa_parcial': parcial, 'vazou_acima': fora,
            'cobertura_do_topo': f'{topo}/{losango} ({100 * topo / losango:.0f}%)'}


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--descricao', required=True)
    p.add_argument('--nome', required=True)
    p.add_argument('--forma', default='thin tile',
                   choices=['thin tile', 'thick tile', 'block'])
    p.add_argument('--go', action='store_true')
    p.add_argument('--buscar', metavar='TILE_ID',
                   help='so baixa e mede um ladrilho ja pedido; nao gera nada')
    a = p.parse_args()

    token = os.environ.get('PIXELLAB_TOKEN')
    if not token:
        raise SystemExit('defina PIXELLAB_TOKEN no ambiente')

    corpo = {
        'description': a.descricao,
        'isometric_tile_size': TH,       # 32 -> losango de 64 x 32
        'isometric_tile_shape': a.forma,
        # A lona tem a largura exata do losango e altura folgada: o PixelLab
        # decide onde o losango cai dentro dela, e o `medir` descobre onde.
        'image_size': {'width': TW, 'height': 64},
        # SEM CONTORNO, e isso nao e gosto. Um contorno em cada ladrilho vira
        # uma grade preta desenhada no tabuleiro inteiro. O `drawTile` ja passa
        # um traco de 22% de preto na borda do losango -- e essa a grade, e
        # ela e uma so.
        'outline': 'lineless',
        'shading': 'medium shading',
        'detail': 'medium detail',
    }
    print('PLANO: 1 ladrilho')
    print(json.dumps(corpo, indent=2, ensure_ascii=False))
    saldo = chamar(token, 'GET', '/balance')[1]['subscription']
    print(f'saldo: {saldo["generations"]:.0f} de {saldo["total"]:.0f}')
    if not a.go and not a.buscar:
        print('\n(seco: nada foi gerado. use --go)')
        return

    if a.buscar:
        status, r = 202, {'tile_id': a.buscar}
    else:
        status, r = chamar(token, 'POST', '/create-isometric-tile', corpo)
    print('status', status, '| usage', r.get('usage'))
    img = r.get('image')
    # O 202 devolve um `tile_id` e a imagem chega depois. Enquanto gera, a
    # consulta responde 423 com "Tile is still being generated".
    if img is None and r.get('tile_id'):
        tid = r['tile_id']
        print(f'gerando ({tid})', end='', flush=True)
        inicio = time.time()
        while img is None:
            if time.time() - inicio > 600:
                raise SystemExit('\ntempo esgotado esperando o ladrilho')
            time.sleep(8)
            print('.', end='', flush=True)
            try:
                _, d = chamar(token, 'GET', f'/isometric-tiles/{tid}')
            except SystemExit as e:
                if 'still being generated' in str(e) or 'HTTP 423' in str(e):
                    continue
                raise
            img = d.get('image')
        print()
    if img is None:
        raise SystemExit(f'resposta sem imagem: {json.dumps(r)[:400]}')
    dados = base64.b64decode(img['base64'] if isinstance(img, dict) else img)

    SAIDA.mkdir(parents=True, exist_ok=True)
    arq = SAIDA / f'{a.nome}.png'
    arq.write_bytes(dados)
    im = Image.open(io.BytesIO(dados))
    print(f'\n{arq}')
    print(json.dumps(medir(im), indent=2))
    # A face lateral fica de fora: o motor so desenha lateral quando o
    # quadrado esta elevado, e ai ele mesmo a pinta. O que vai para o jogo e
    # o losango do topo, recortado pela particao exata.
    t = recortar_topo(im)
    t.save(SAIDA / f'{a.nome}-topo.png')
    print(f'topo: {SAIDA / (a.nome + "-topo.png")}')
    depois = chamar(token, 'GET', '/balance')[1]['subscription']
    print(f'saldo depois: {depois["generations"]:.0f} '
          f'(gastou {saldo["generations"] - depois["generations"]:.0f})')


if __name__ == '__main__':
    main()
