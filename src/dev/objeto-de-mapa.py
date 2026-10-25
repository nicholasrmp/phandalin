# -*- coding: utf-8 -*-
"""
Gera um OBJETO DE MAPA no PixelLab, casando o estilo com o nosso tabuleiro.

    PIXELLAB_TOKEN=... python src/dev/objeto-de-mapa.py --objeto banheira --go

ISTO GASTA GERACOES. Sem `--go` so imprime o plano.

POR QUE ESTA ROTA. `/map-objects` recebe uma IMAGEM DE FUNDO -- uma captura
do nosso mapa -- e desenha o objeto no estilo dela: mesma paleta, mesma luz,
mesmo grao de pixel. E o que o PixelLab chama de criador de objetos de mapa,
e serve ao que `objetos-pixellab.py` nao resolve: peca que tem de parecer
que sempre esteve naquele mapa.

O QUE ELA NAO RESOLVE: o eixo. Objeto comprido continua saindo com o eixo
quase horizontal; por isso as pecas pedidas aqui sao de UMA CASA, onde nao
existe eixo comprido para errar.

A captura de fundo sai de `_referencias/revisao-castelo/castelo-v12.png` (ou
da mais recente): o recorte e de uma area de chao limpa, para o modelo pegar
o ladrilho e a luz, e nao um movel.
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
SAIDA = AQUI / '_referencias' / 'pixellab' / 'objetos-de-mapa'
FUNDO = AQUI / '_referencias' / 'revisao-castelo' / 'castelo-v12.png'
# A API exige que o fundo tenha EXATAMENTE o tamanho do objeto pedido (ela
# nao redimensiona: reamostrar pixel art destruiria a grade). Entao o recorte
# sai do tamanho de `image_size`, a partir deste canto.
CANTO = (1100, 600)

OBJETOS = {
    # A banheira do rei: numa casa so. A de duas casas saia com o eixo a uns
    # 12 graus, contra os 26,6 da grade -- no tabuleiro ela ficava atravessada.
    'banheira': {
        'description': ('sunken stone bathtub with cream and blue-green glazed tiles, '
                        'still murky water inside, low rim, seen from above at an angle'),
        'image_size': {'width': 64, 'height': 48},
    },
    # A folha caida do portao, tambem numa casa.
    'portao': {
        'description': ('broken wooden gate leaf lying flat on the ground, thick planks '
                        'with green tarnished bronze straps, splintered, seen from above at an angle'),
        'image_size': {'width': 64, 'height': 48},
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


def base64Png(im):
    buf = io.BytesIO()
    im.save(buf, format='PNG')
    return {'type': 'base64', 'format': 'png', 'base64': base64.b64encode(buf.getvalue()).decode()}


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--objeto', required=True, choices=list(OBJETOS))
    p.add_argument('--go', action='store_true')
    p.add_argument('--buscar', metavar='OBJECT_ID')
    a = p.parse_args()
    token = os.environ.get('PIXELLAB_TOKEN')
    if not token:
        raise SystemExit('defina PIXELLAB_TOKEN no ambiente')

    corpo = dict(OBJETOS[a.objeto])
    w, h = corpo['image_size']['width'], corpo['image_size']['height']
    fundo = Image.open(FUNDO).convert('RGBA').crop((CANTO[0], CANTO[1], CANTO[0] + w, CANTO[1] + h))
    corpo.update({
        'view': 'low top-down',
        'outline': 'selective outline',
        'shading': 'medium shading',
        'detail': 'medium detail',
        'background_image': base64Png(fundo),
    })
    _, b = chamar(token, 'GET', '/balance')
    antes = b['subscription']['generations']
    print('PLANO:', a.objeto, '| fundo', fundo.size, '| saldo', f'{antes:.0f}')
    if not a.go and not a.buscar:
        print('(seco: nada foi gerado. use --go)')
        return

    oid = a.buscar
    if not oid:
        _, r = chamar(token, 'POST', '/map-objects', corpo)
        oid = r.get('object_id') or r.get('id')
        print('pedido:', oid)

    inicio = time.time()
    while True:
        st, d = chamar(token, 'GET', f'/map-objects/{oid}')
        if st == 200 and d and (d.get('image') or d.get('storage_urls') or d.get('url')):
            break
        if time.time() - inicio > 900:
            raise SystemExit('tempo esgotado')
        time.sleep(10)

    destino = SAIDA / a.objeto / str(oid)
    destino.mkdir(parents=True, exist_ok=True)
    (destino / 'meta.json').write_text(json.dumps(d, indent=2)[:20000], encoding='utf-8')
    # A resposta traz a imagem em base64 ou uma URL, conforme a rota.
    img = d.get('image')
    if isinstance(img, dict) and img.get('base64'):
        (destino / 'objeto.png').write_bytes(base64.b64decode(img['base64']))
    else:
        url = d.get('url') or next(iter((d.get('storage_urls') or {}).values()), None)
        pedido = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(pedido, timeout=120) as resp:
            (destino / 'objeto.png').write_bytes(resp.read())
    im = Image.open(destino / 'objeto.png')
    print('saiu', im.size, 'caixa', im.convert('RGBA').getbbox())
    _, b = chamar(token, 'GET', '/balance')
    print(f'saldo depois: {b["subscription"]["generations"]:.0f} (gastou {antes - b["subscription"]["generations"]:.0f})')
    print('pasta:', destino)


if __name__ == '__main__':
    main()
