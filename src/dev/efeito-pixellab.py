# -*- coding: utf-8 -*-
"""
Gera UM efeito de magia pelo `POST /vfx` do PixelLab ("o artista de efeitos") e baixa a folha.

ISTO GASTA GERACOES DA CONTA. Sem `--go` o script so imprime o plano e o saldo.
O token vem so de `PIXELLAB_TOKEN`, passado INLINE na linha de comando; nunca vai para arquivo.

    PIXELLAB_TOKEN=<token> python src/dev/efeito-pixellab.py --descricao "..." --nome pele-de-pedra
    PIXELLAB_TOKEN=<token> python src/dev/efeito-pixellab.py --descricao "..." --nome pele-de-pedra --go
    PIXELLAB_TOKEN=<token> python src/dev/efeito-pixellab.py --buscar <background_job_id> --nome pele-de-pedra

`--sprite caminho.png` manda a figura (PNG, ate 512x512): a aura "envolve" o sprite em vez de inventar um corpo.
`--artista lite` (padrao, ~1 geracao) ou `pro` (6 ou mais).

A saida vai para `_referencias/pixellab/efeitos/<nome>/` (fora do codigo). Quem passa para o jogo e
`importar-efeitos.py`, depois de olhar os quadros.
"""
import argparse
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

BASE = 'https://api.pixellab.ai/v2'
RAIZ = Path(__file__).resolve().parents[2]
SAIDA = RAIZ / '_referencias' / 'pixellab' / 'efeitos'
UA = 'Mozilla/5.0'


def token():
    t = os.environ.get('PIXELLAB_TOKEN')
    if not t:
        sys.exit('Falta PIXELLAB_TOKEN (passe inline na linha de comando; nao procuro em disco).')
    return t


def chamar(metodo, caminho, corpo=None):
    dados = json.dumps(corpo).encode('utf-8') if corpo is not None else None
    req = urllib.request.Request(BASE + caminho, data=dados, method=metodo, headers={
        'Authorization': f'Bearer {token()}', 'Content-Type': 'application/json', 'User-Agent': UA})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, json.loads(r.read().decode('utf-8') or '{}')
    except urllib.error.HTTPError as e:
        return e.code, {'erro': e.read().decode('utf-8', 'replace')[:600]}


def saldo():
    st, d = chamar('GET', '/balance')
    if st != 200:
        return None, d
    return d.get('subscription', {}).get('generations'), d


def baixar(url, destino):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=120) as r:
        destino.write_bytes(r.read())


def esperar(job):
    while True:
        st, d = chamar('GET', f'/background-jobs/{job}')
        if st == 423 or d.get('status') in ('processing', 'queued', 'pending', 'running'):
            time.sleep(7)
            continue
        return st, d


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--descricao')
    ap.add_argument('--nome', required=True)
    ap.add_argument('--sprite')
    ap.add_argument('--artista', default='lite', choices=['lite', 'pro'])
    ap.add_argument('--pacote', action='store_true', help='pede e baixa o game pack (o efeito SEM o sprite embutido: whole.png + manifest)')
    ap.add_argument('--go', action='store_true')
    ap.add_argument('--buscar')
    a = ap.parse_args()

    antes, info = saldo()
    print(f'saldo: {antes} geracoes' if antes is not None else f'saldo ilegivel: {info}')
    pasta = SAIDA / a.nome
    pasta.mkdir(parents=True, exist_ok=True)

    job = a.buscar
    if not job:
        if not a.descricao:
            sys.exit('Falta --descricao.')
        corpo = {'description': a.descricao, 'artist': a.artista, 'name': a.nome, 'game_pack': a.pacote}
        if a.sprite:
            corpo['sprite'] = {'type': 'base64', 'format': 'png', 'base64': base64.b64encode(Path(a.sprite).read_bytes()).decode()}
        print(f"plano: /vfx artist={a.artista} nome={a.nome} sprite={'sim' if a.sprite else 'nao'}\n  {a.descricao}")
        if not a.go:
            print('(seco: nada foi gerado. Rode de novo com --go.)')
            return
        st, d = chamar('POST', '/vfx', corpo)
        print('POST /vfx ->', st, {k: d.get(k) for k in ('background_job_id', 'status', 'quoted_generations', 'erro')})
        if st not in (200, 202):
            sys.exit(1)
        job = d['background_job_id']
        (pasta / 'trabalho.txt').write_text(job, encoding='utf-8')
    st, d = esperar(job)
    print('job ->', st, d.get('status'))
    resp = d.get('last_response') or {}
    (pasta / 'resposta.json').write_text(json.dumps(resp, indent=1, ensure_ascii=False)[:20000], encoding='utf-8')
    # `files` e um dicionario nome -> url (o zip do game pack so vem com --pacote).
    for nome, url in (resp.get('files') or {}).items():
        if url and (a.pacote or not nome.endswith('-game.zip')):
            baixar(url, pasta / nome)
            print('baixado', nome)
    depois, _ = saldo()
    if antes is not None and depois is not None:
        print(f'gastou {antes - depois} (em sessoes paralelas o delta mistura gastos de outras)')


if __name__ == '__main__':
    main()
