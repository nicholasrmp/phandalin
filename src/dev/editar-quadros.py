# -*- coding: utf-8 -*-
"""
Edita, por frase, SO os quadros de uma folha do PixelLab que o motor usa, e
grava uma copia da folha com eles trocados. O importador le a copia.

ISTO GASTA GERACOES DA CONTA. Sem `--go` o script so imprime o plano.

POR QUE ESTE E NAO O `editar-pixellab.py`. Aquele edita as oito vistas
paradas para uma PREVIA. Este conserta uma animacao ja gerada: a cauda que o
modelo inventou na Dara, onde a capa creme da calca virou escama vermelha.
Gerar a animacao de novo sortearia outro defeito; a `edit-animation-v2`
mantem a pose (94-100% da silhueta nas previas) e muda so o que a frase pede.

UMA DIRECAO POR PEDIDO. Os quadros de uma direcao -- o parado, os quatro do
andar e os dois do ataque -- sao a mesma figura vista do mesmo lado, que e o
caso para o qual a edicao foi feita ("coerencia entre quadros").

A JANELA DE 80. A edicao aceita 9 quadros ate 80 px e so 4 acima disso, e as
celulas das animacoes sao de 96. Entao cada direcao e recortada numa janela de
80x80, a MESMA para os sete quadros, centrada na uniao das figuras. Se a
uniao passa de 80 -- ao sul, a espada erguida e a ponta baixada somam 84 --,
o que fica fora da janela volta do original sem mudanca: a frase mexe na
cintura e nas pernas, nunca na ponta da espada.

Custo declarado: 10 geracoes por pedido.
"""
import argparse
import base64
import io
import json
import os
import re
import shutil
import time
import urllib.error
import urllib.request
from pathlib import Path
from PIL import Image

BASE = 'https://api.pixellab.ai/v2'
RAIZ = Path(__file__).resolve().parents[2]
JANELA = 80

EDICOES = {
    'dara-sem-cauda': (
        'Remove the dragon tail: she is a dragonborn and has NO tail. The red '
        'scaly tail behind her legs must disappear completely. In its place keep '
        'only a short cream-white cloth flap of her trousers hanging straight '
        'down behind the knees, plain cream with no red, not pointed and not '
        'curling. Keep everything else exactly the same: the red dragonborn '
        'head and horns, the chain mail, the cream tabard with red trim, the '
        'belt, the steel shield with the red dragon emblem, the longsword, the '
        'pose and position in every frame, the direction each frame faces and '
        'the colours.'
    ),
}

# Quadros que o motor usa por direcao, nos grupos da folha do PixelLab: o
# parado (rotacoes), o andar 1-4 e os dois do ataque escolhidos no perfil
# `fighter` de `importar-pixellab.py`.
ATAQUE_DARA = {'south': [2, 5], 'south-east': [3, 5], 'east': [2, 4],
               'north-east': [5, 8], 'north': [4, 2], 'north-west': [3, 6],
               'west': [3, 6], 'south-west': [3, 6]}


def quadros_da_direcao(meta, dir_):
    """[(fileira, coluna)] dos quadros usados nesta direcao."""
    rot = next(r for r in meta['rows'] if r['type'] == 'rotations')
    grupos = {}
    for r in meta['rows']:
        if r['type'] == 'animation':
            grupos.setdefault(re.sub(r'_\d+$', '', r['animation']), {})[r['direction']] = r
    return ([(rot['row'], rot['directions'].index(dir_))] +
            [(grupos['walk'][dir_]['row'], f) for f in (1, 2, 3, 4)] +
            [(grupos['attack-dir'][dir_]['row'], f) for f in ATAQUE_DARA[dir_]])


def janela(celulas, lado):
    """Uma janela JANELAxJANELA, igual para todas, centrada na uniao."""
    bbs = [c.getbbox() for c in celulas if c.getbbox()]
    u = (min(b[0] for b in bbs), min(b[1] for b in bbs),
         max(b[2] for b in bbs), max(b[3] for b in bbs))
    x = max(0, min(lado - JANELA, (u[0] + u[2]) // 2 - JANELA // 2))
    y = max(0, min(lado - JANELA, (u[1] + u[3]) // 2 - JANELA // 2))
    return (x, y, x + JANELA, y + JANELA), u


def b64(img):
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return base64.b64encode(buf.getvalue()).decode()


def chamar(token, metodo, caminho, corpo=None):
    req = urllib.request.Request(f'{BASE}{caminho}',
                                 data=json.dumps(corpo).encode() if corpo else None,
                                 method=metodo)
    req.add_header('Authorization', f'Bearer {token}')
    if corpo:
        req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f'HTTP {e.code} em {metodo} {caminho}: '
                         f'{e.read().decode(errors="replace")[:800]}')


def imagens_em(obj):
    achadas = []
    if isinstance(obj, dict):
        if isinstance(obj.get('base64'), str):
            achadas.append(obj['base64'])
        for v in obj.values():
            achadas += imagens_em(v)
    elif isinstance(obj, list):
        for v in obj:
            achadas += imagens_em(v)
    return achadas


def main():
    p = argparse.ArgumentParser()
    p.add_argument('edicao', choices=sorted(EDICOES))
    p.add_argument('--fonte', required=True, help='pasta da folha de animacoes do PixelLab')
    p.add_argument('--direcoes', required=True, help='separadas por virgula')
    p.add_argument('--go', action='store_true')
    a = p.parse_args()

    fonte = RAIZ / a.fonte
    jmeta = next(fonte.glob('*.json'))
    meta = json.loads(jmeta.read_text(encoding='utf-8'))['spritesheet']
    lado = meta['cell_size']['width']
    folha = Image.open(fonte / meta['path']).convert('RGBA')
    texto = EDICOES[a.edicao]
    if len(texto) > 1000:
        raise SystemExit(f'a frase tem {len(texto)} caracteres, o teto e 1000')

    plano = []
    for d in [x.strip() for x in a.direcoes.split(',') if x.strip()]:
        pos = quadros_da_direcao(meta, d)
        cels = [folha.crop((c * lado, r * lado, (c + 1) * lado, (r + 1) * lado)) for r, c in pos]
        jan, u = janela(cels, lado)
        fora = (u[0] < jan[0] or u[1] < jan[1] or u[2] > jan[2] or u[3] > jan[3])
        print(f'{d:11} {len(pos)} quadros  janela {jan}  uniao {u}'
              + ('  (passa da janela: o excesso volta do original)' if fora else ''))
        plano.append((d, pos, cels, jan))
    print(f'{len(plano)} pedidos x 10 = {10 * len(plano)} geracoes declaradas')

    token = os.environ.get('PIXELLAB_TOKEN')
    if not token:
        raise SystemExit('defina PIXELLAB_TOKEN no ambiente')
    print(f'saldo: {chamar(token, "GET", "/balance")["subscription"]["generations"]:.0f}')
    if not a.go:
        print('(seco: nada foi enviado. use --go)')
        return

    saida = RAIZ / '_referencias' / 'pixellab' / 'edicoes' / a.edicao
    saida.mkdir(parents=True, exist_ok=True)
    jobs = []
    for d, pos, cels, jan in plano:
        corpo = {
            'description': texto,
            'image_size': {'width': JANELA, 'height': JANELA},
            'no_background': True,
            'frames': [{'image': {'type': 'base64', 'base64': b64(c.crop(jan)), 'format': 'png'},
                        'size': {'width': JANELA, 'height': JANELA}} for c in cels],
        }
        r = chamar(token, 'POST', '/edit-animation-v2', corpo)
        print(f'{d}: trabalho {r["background_job_id"]}  usage={r.get("usage")}', flush=True)
        jobs.append((d, pos, cels, jan, r['background_job_id']))

    # A copia da folha: os quadros editados por cima, o resto igual.
    destino = fonte.parent / f'{fonte.name}-{a.edicao}'
    if not destino.exists():
        shutil.copytree(fonte, destino)
    nova = Image.open(destino / meta['path']).convert('RGBA')
    inicio = time.time()
    for d, pos, cels, jan, job in jobs:
        while True:
            st = chamar(token, 'GET', f'/background-jobs/{job}')
            if st.get('status') == 'completed':
                break
            if st.get('status') == 'failed':
                raise SystemExit(f'{d} falhou: {json.dumps(st)[:600]}')
            if time.time() - inicio > 1800:
                raise SystemExit('tempo esgotado')
            time.sleep(10)
        lr = st.get('last_response') or {}
        imgs = imagens_em(lr.get('quantized_images') or lr.get('images'))
        print(f'{d}: pronto, {len(imgs)} quadros, custo {st.get("usage")}', flush=True)
        tira = Image.new('RGBA', (JANELA * 2 * len(pos), JANELA))
        for i, ((r, c), cel) in enumerate(zip(pos, cels)):
            ed = Image.open(io.BytesIO(base64.b64decode(imgs[i]))).convert('RGBA')
            nova_cel = cel.copy()
            # Dentro da janela, o editado inteiro (inclusive o transparente,
            # para a cauda sumir); fora dela, o original.
            nova_cel.paste(ed, jan[:2])
            nova.paste(nova_cel, (c * lado, r * lado))
            tira.alpha_composite(cel.crop(jan), (i * 2 * JANELA, 0))
            tira.alpha_composite(ed, ((i * 2 + 1) * JANELA, 0))
        tira.save(saida / f'{d}.png')
    nova.save(destino / meta['path'])
    print(f'folha editada: {destino}')


if __name__ == '__main__':
    main()
