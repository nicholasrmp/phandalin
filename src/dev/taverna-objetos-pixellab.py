# -*- coding: utf-8 -*-
"""
Os OBJETOS da taverna no PixelLab (MULTIJOGADOR.md, T-16), no estilo da referencia
do dono: taverna de madeira velha e tijolo vermelho, quente, de luz de lareira.

ISTO GASTA GERACOES (cada peca vai pelo `/create-object-pro-flash`, 8 vistas). Sem
`--go` so imprime o plano e o saldo.

    PIXELLAB_TOKEN=<token> python -P src/dev/taverna-objetos-pixellab.py --peca lareira
    PIXELLAB_TOKEN=<token> python -P src/dev/taverna-objetos-pixellab.py --peca lareira --go
    PIXELLAB_TOKEN=<token> python -P src/dev/taverna-objetos-pixellab.py --todas --go

Reaproveita `chamar`, `urls` e `medir` de `objetos-pixellab.py` (sem alterar aquele
script) e a paleta de `taverna-pixellab.py`. Saida em
`_referencias/pixellab/objetos/<peca>/<id>/`. Entrar no atlas do jogo e da sessao do
Cenario (`dev/montar-cenario.py`).

O token vem SO da variavel de ambiente, nunca de arquivo.
"""
import argparse
import importlib.util
import json
import os
import time
import urllib.request
from pathlib import Path

from PIL import Image

AQUI = Path(__file__).resolve().parents[2]
SAIDA = AQUI / '_referencias' / 'pixellab' / 'objetos'


def carregar(nome_do_arquivo, apelido):
    spec = importlib.util.spec_from_file_location(apelido, Path(__file__).with_name(nome_do_arquivo))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


obj = carregar('objetos-pixellab.py', 'objetos_pixellab')
kit = carregar('taverna-pixellab.py', 'taverna_pixellab')
PALETA = kit.PALETA
PIXEL = obj.PIXEL

ESTILO = ('for a cozy medieval tavern in an isometric tactical RPG, warm firelit colours, aged dark oak '
          'wood and red brick, lived-in. No ground, no people. Dark brown selective outline, not black. ')


def peca(descricao, largura, altura, semente):
    return {
        'description': f'The object FILLS THE WHOLE CANVAS WIDTH, edge to edge. {descricao} {ESTILO}{PIXEL}',
        'view': 'low top-down',
        'image_size': {'width': largura, 'height': altura},
        'n_directions': 8,
        'seed': semente,
        'target_palette': {'colors': PALETA},
    }


PECAS = {
    # A peca que decide a cara da sala: a lareira de pedra com o arco de tijolo e o fogo aceso.
    'lareira': peca('A big stone fireplace with a grey stone arch and chimney breast, a roaring '
                    'fire with bright orange and yellow flames and glowing embers, iron fire dogs '
                    'and a small iron grate. About 96 px tall.', 128, 128, 20261210),
    # O balcao comprido do bar, de tabuas, com canecas e uma vela.
    'balcao': peca('A long wooden tavern bar counter of dark oak planks with a rounded front, '
                   'three times longer than wide, with wooden mugs, a tankard, a lit candle and a '
                   'bottle on top. About 44 px tall.', 160, 96, 20261211),
    # A mesa redonda de conversa e de carta.
    'mesaRedonda': peca('A round wooden tavern table on a thick central leg, scarred top with '
                        'playing cards, a pewter mug and a lit candle on it. About 36 px tall.', 80, 80, 20261212),
    # O banquinho.
    'banquinho': peca('A small round three-legged wooden stool, worn seat. About 24 px tall.', 48, 48, 20261213),
    # O barril de cerveja no cavalete.
    'barrilCerveja': peca('A large oak ale keg lying on a wooden rack with iron hoops and a brass '
                          'tap, a little foam dripping. About 40 px tall.', 72, 72, 20261214),
    # A escada de madeira, que sobe para o andar de cima da taverna.
    'escada': peca('A straight wooden staircase with a plank handrail and posts, climbing '
                   'diagonally, worn steps. About 80 px tall.', 128, 128, 20261215),
    # O lampiao de pe: a luz da taverna longe da lareira.
    'lampiao': peca('A tall wrought iron standing candelabra holding five lit candles with '
                    'small flames and drips of wax. About 70 px tall.', 64, 96, 20261216),
    # A prateleira de garrafas que fica atras do balcao.
    'prateleira': peca('A wooden wall shelf unit with three shelves full of colourful glass '
                       'bottles, flasks and jars of potions, one shelf with mugs. About 70 px tall.', 112, 112, 20261217),
}


def main():
    p = argparse.ArgumentParser()
    g = p.add_mutually_exclusive_group(required=True)
    g.add_argument('--peca', choices=list(PECAS))
    g.add_argument('--todas', action='store_true')
    p.add_argument('--go', action='store_true')
    p.add_argument('--buscar', metavar='OBJECT_ID', help='baixa um pedido ja feito, sem gastar (com --peca)')
    a = p.parse_args()
    token = os.environ.get('PIXELLAB_TOKEN')
    if not token:
        raise SystemExit('defina PIXELLAB_TOKEN no ambiente')

    nomes = list(PECAS) if a.todas else [a.peca]
    _, b = obj.chamar(token, 'GET', '/balance')
    inicio_geral = b['subscription']['generations']
    print(f'saldo: {inicio_geral:.0f} | pecas: {", ".join(nomes)}')
    if not a.go and not a.buscar:
        for n in nomes:
            c = PECAS[n]
            print(f'  {n:14} {c["image_size"]["width"]}x{c["image_size"]["height"]}  8 vistas')
        print('(seco: nada foi gerado. use --go)')
        return

    for nome in nomes:
        corpo = PECAS[nome]
        oid = a.buscar
        if not oid:
            _, r = obj.chamar(token, 'POST', '/create-object-pro-flash', corpo)
            oid = r['object_id']
            print(f'\n{nome}: pedido {oid}')
        t0 = time.time()
        while True:
            st, d = obj.chamar(token, 'GET', f'/objects/{oid}')
            tem_url = st == 200 and d and any(True for _ in obj.urls({k: d.get(k) for k in ('frame_urls', 'storage_urls', 'rotation_urls')}))
            if tem_url and d.get('status') not in ('pending', 'processing', 'queued', 'running'):
                break
            if st == 200 and d and d.get('status') in ('failed', 'error'):
                print(f'  {nome}: falhou: {json.dumps(d)[:300]}')
                d = None
                break
            if time.time() - t0 > 1800:
                print(f'  {nome}: tempo esgotado')
                d = None
                break
            time.sleep(12)
        if not d:
            continue
        destino = SAIDA / nome / oid
        destino.mkdir(parents=True, exist_ok=True)
        (destino / 'meta.json').write_text(json.dumps(d, indent=2), encoding='utf-8')
        vistos = set()
        print(f"  {'arquivo':26} {'larg x alt':11} {'alfa':>5} {'borda':>6} {'cores':>6}")
        for chave, url in obj.urls({k: d.get(k) for k in ('frame_urls', 'storage_urls', 'rotation_urls')}):
            if url in vistos:
                continue
            vistos.add(url)
            arq = destino / f"{chave.replace('.', '_').replace('[', '_').replace(']', '')}.png"
            pedido = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(pedido, timeout=120) as resp:
                arq.write_bytes(resp.read())
            try:
                m = obj.medir(Image.open(arq))
            except Exception as e:  # um arquivo que nao e imagem nao derruba a leva
                print(f'  {arq.name}: nao e imagem ({e})')
                continue
            print(f"  {arq.name:26} {str(m['larg_alt']):11} {m['alfa_parcial']:5} {m['borda']!s:>6} {m['cores']:6}")
        print('  pasta:', destino)
        if a.buscar:
            break
    _, b = obj.chamar(token, 'GET', '/balance')
    print(f'\nsaldo depois: {b["subscription"]["generations"]:.0f} (gastou {inicio_geral - b["subscription"]["generations"]:.0f})')


if __name__ == '__main__':
    main()
