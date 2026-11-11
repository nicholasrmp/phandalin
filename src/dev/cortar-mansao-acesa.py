# -*- coding: utf-8 -*-
"""RECORTA A MANSÃO ACESA em uma peça por tocha. Rode com:

    python src/dev/cortar-mansao-acesa.py

A Forgotten Adventures publica o Redbrand Hideout em duas versões, apagada e ACESA, e as duas estavam no
disco: `public/mapas/fa/mansao.jpg` (a que o jogo usa) e `mansao-aceso.jpg` (que ninguém usava). Este script
corta a segunda no alcance de cada uma das onze luzes do mapa e grava as peças, que o gerador
(`mapa-mansao.py`) declara como `sobreposicoes` e amarra à luz pelo campo `sobreposicao`.

POR QUE ISSO IMPORTA. `game/fogo.js` apaga uma chama em três camadas — o desenho, a regra e o fogo que
queima —, e a do DESENHO só funciona se a luz trouxer `sobreposicao`. Medido nas onze cenas: **só o
Esconderijo tinha isso**, nas duas fogueiras dele. Em todas as outras, apagar uma tocha jogava o cômodo no
breu pela regra e deixava a pintura brilhando igual, que é o defeito que o próprio comentário de `fogo.js`
descreve ("sem isso o desenho continuaria mostrando a fogueira brilhando sobre uma sala que a regra já pôs no
escuro"). A Mansão era a maior dessas: onze tochas, nenhuma mexendo no desenho.

A ARTE DA FA NÃO ENTRA NO REPOSITÓRIO NEM NA PUBLICAÇÃO. Estes recortes nascem em `public/mapas/fa/`, que o
`.gitignore` cobre e que `src/dev/verificar-publicavel.mjs` barra no `prebuild` — joga-se com eles em
`npm run dev`, não se publica. Quem não tiver a arte no disco simplesmente não vê as peças: a cena abre igual.
"""
import json
import os
import re
import sys

from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FA = os.path.join(RAIZ, 'public', 'mapas', 'fa')
ACESA = os.path.join(FA, 'mansao-aceso.jpg')
MAPA = os.path.join(RAIZ, 'src', 'game', 'mansao.js')
PX = 100            # px por casa no battlemap da FA


def luzes_do_mapa():
    """As luzes que o gerador já escreveu em `game/mansao.js`, lidas de lá para não repetir número."""
    fonte = open(MAPA, encoding='utf-8').read()
    m = re.search(r'"luzes":\s*(\[.*?\]),\n  "', fonte, re.S)
    if not m:
        sys.exit('nao achei "luzes" em game/mansao.js — rode `python src/dev/mapa-mansao.py` antes')
    return json.loads(m.group(1))


def main():
    if not os.path.exists(ACESA):
        print(f'a versao acesa nao esta no disco ({ACESA}).')
        print('Ela e arte da Forgotten Adventures e nao vem no repositorio: sem ela, as pecas nao sao geradas')
        print('e a cena abre igual, so sem a troca de desenho ao apagar a tocha.')
        return 0

    im = Image.open(ACESA).convert('RGBA')
    larg, alt = im.size[0] // PX, im.size[1] // PX
    luzes = luzes_do_mapa()
    print(f'{ACESA}: {im.size[0]}x{im.size[1]} = {larg}x{alt} casas; {len(luzes)} luzes no mapa')

    pecas = []
    for i, l in enumerate(luzes):
        x, y = l['pos']['x'], l['pos']['y']
        # o raio da peça é o alcance da luz, em casas, com uma casa de folga para a borda do brilho
        raio = max(1, int(round(((l.get('claro', 0) + l.get('penumbra', 0)) / 5))) + 1)
        x0, y0 = max(0, x - raio), max(0, y - raio)
        x1, y1 = min(larg, x + raio + 1), min(alt, y + raio + 1)
        corte = im.crop((x0 * PX, y0 * PX, x1 * PX, y1 * PX))
        nome = f'mansao-acesa-{i}.webp'
        corte.save(os.path.join(FA, nome), 'WEBP', quality=88, method=4)
        pecas.append({'id': f'luzMansao{i}', 'url': f'/mapas/fa/{nome}',
                      'x': x0, 'y': y0, 'w': x1 - x0, 'h': y1 - y0, 'ligada': True})
        print(f'  ({x:2},{y:2}) {l.get("tipo", "tocha"):9} raio {raio} casas -> {nome} ({x1 - x0}x{y1 - y0})')

    saida = os.path.join(RAIZ, 'src', 'dev', '_mansao-acesa.json')
    json.dump(pecas, open(saida, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'\n{len(pecas)} pecas; a lista para o gerador ficou em {saida}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
