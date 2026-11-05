"""GERA o mapa do Poço da Coruja Velha (`game/poco.js`) sobre o battlemap da Forgotten Adventures.

    python src/dev/importar-foundry.py mapas/_cenas/old-owl-well-18x22.json <imagem> \
        --editor src/dev/_tmp/old-owl-well-18x22.json
    python src/dev/mapa-poco-fa.py

O primeiro passo traz da cena do Foundry o que ela sabe: a grade, as 47 paredes (como traço livre, com tipo — a
aba da tenda é etérea, vê-se através dela e se passa) e a aresta de casa derivada delas. ESTE passo põe por cima
o que o Foundry NÃO tem — o terreno — e acha os PONTOS que o capítulo 4 usa.

O TERRENO SAI DA COR DO DESENHO, não da mão: capim onde a arte é verde, laje onde é cinza (matiz e saturação em
HSV, 30% da casa decide). Com o mapa pintado por baixo, o glifo serve de regra e de reserva para quem joga sem a
arte; não precisa de artista nenhum.

OS PONTOS, e como cada um foi MEDIDO (nada de olhômetro):

    torre    o anel de pedra tem centro em (12,4 , 5,65) e raio 3,6 casas, medido nas pontas do traço. O
             retângulo x 10..14, y 3..8 cabe inteiro dentro dele — é onde os zumbis esperam, e a cena põe um
             em cada casa dele. ATENÇÃO: o anel está QUEBRADO, como manda a ruína; a inundação de dentro
             alcança o mapa todo. Não há "só se entra por aqui", e a cena não precisa disso.
    porta    a boca principal, por onde o caminho do poço entra: (9,9) -> (10,8). Os zumbis saem em
             `porta.x - 1`, que é (9,8). Há outra brecha no sudeste, em (15,8-9); a ficção usa esta.
    tenda    as quatro paredes da barraca de Kost estão na cena, de (5,8) a (8,11), com a aba (`move: 0`) ao
             sul: o interior é x 5..7, y 8..10.
    poco     o poço em si, com roldana e balde, na casa (5,14) — conferido OLHANDO o desenho ampliado, depois de
             o centróide dos pixels escuros dar (4,73 , 14,77) e me levar à casa errada: a sombra e o balde
             puxam o centro para fora da boca. A casa leva o glifo `q`, que barra passo: fica-se ao lado dele,
             como se fica de um poço, e é isso que acende "Encher os cantis" no capítulo.
    patio    o retângulo da laje, pela classificação de cor.
    saida    a trilha de terra que desce ao sul e sai do mapa em y 21.

A ARTE NÃO ENTRA no repositório nem na publicação (licença da FA): `mapas/` e `public/mapas/fa/` estão no
`.gitignore`, e `verificar-publicavel.mjs` falha o build se ela estiver em `public/`. Sem o arquivo, a cena abre
com o ladrilho do glifo — por isso o terreno é pintado, e não deixado todo igual.
"""
import json
import os
import pathlib
import subprocess
import sys

import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ENTRADA = os.path.join(RAIZ, 'src', 'dev', '_tmp', 'old-owl-well-18x22.json')
IMAGEM = os.path.join(RAIZ, 'mapas', 'OldOwlWell', 'FA_Battlemaps', 'OldOwlWell_18x22',
                      'JPG', '100ppi', 'OldOwlWell_Gridless_18x22_100ppi.jpg')
SAIDA = os.path.join(RAIZ, 'src', 'game', 'poco.js')

# Os pontos, medidos (ver o cabeçalho). Mexeu no mapa, meça de novo com `provas()` abaixo.
PORTA = (10, 8)
POCO_ = (5, 14)
TORRE = {'x0': 10, 'y0': 3, 'x1': 14, 'y1': 8}
TENDA = [(x, y) for y in range(8, 11) for x in range(5, 8)]
PATIO = {'x0': 2, 'y0': 6, 'x1': 15, 'y1': 17}
SAIDA_CASAS = [(4, 21), (5, 21)]


def terreno(w, h):
    """Capim onde o desenho é verde, laje onde é cinza. 30% da casa decide."""
    hsv = np.asarray(Image.open(IMAGEM).convert('HSV')).astype(float)
    linhas = []
    for y in range(h):
        linha = ''
        for x in range(w):
            bloco = hsv[y * 100:(y + 1) * 100, x * 100:(x + 1) * 100]
            matiz, sat = bloco[:, :, 0], bloco[:, :, 1]
            verde = ((matiz > 35) & (matiz < 95) & (sat > 60)).mean()
            linha += ',' if verde > 0.30 else 'L'
        linhas.append(linha)
    return linhas


def provas(base, t):
    """Confere, rodando o MOTOR, que os pontos medidos continuam de pé. Falha alto se algum saiu do lugar."""
    base_url = pathlib.Path(RAIZ).as_uri()
    programa = f'''
const {{ montarCampo }} = await import('{base_url}/src/game/campo.js');
const {{ Battlefield }} = await import('{base_url}/src/core/grid.js');
const m = JSON.parse(process.env.MAPA);
const f = montarCampo(m);
const erros = [];
const anda = (x, y) => !f.blocksMove(x, y);
for (const [nome, x, y] of [['porta', {PORTA[0]}, {PORTA[1]}], ['saida da porta', {PORTA[0] - 1}, {PORTA[1]}],
                            ['saida', {SAIDA_CASAS[0][0]}, {SAIDA_CASAS[0][1]}]]) {{
  if (!anda(x, y)) erros.push(`${{nome}} (${{x}},${{y}}) caiu em casa bloqueada`);
}}
// o poço BARRA passo (é um obstáculo): o que se confere é a superfície, que o capítulo escuta, e um lado livre
if (f.surfaceAt({POCO_[0]}, {POCO_[1]}) !== 'pocoVelho') erros.push(`o poco (${POCO_[0]},${POCO_[1]}) nao tem a superficie pocoVelho`);
if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => anda({POCO_[0]} + dx, {POCO_[1]} + dy))) {{
  erros.push('nao da para chegar ao lado do poco');
}}
const alc = f.reachable({{ x: {POCO_[0]}, y: {POCO_[1]} }}, 4000);
for (const [nome, x, y] of [['dentro da torre', 13, 4], ['a saida ao sul', {SAIDA_CASAS[0][0]}, {SAIDA_CASAS[0][1]}]]) {{
  if (!alc.has(`${{x}},${{y}}`)) erros.push(`${{nome}} (${{x}},${{y}}) nao se alcanca do poco`);
}}
// toda casa da torre tem de ser chao: a cena poe um zumbi em cada uma
for (let y = {TORRE['y0']}; y <= {TORRE['y1']}; y++) for (let x = {TORRE['x0']}; x <= {TORRE['x1']}; x++) {{
  if (!anda(x, y)) erros.push(`a torre tem casa bloqueada em (${{x}},${{y}})`);
  else if (!alc.has(`${{x}},${{y}}`)) erros.push(`o grupo nao alcanca a torre em (${{x}},${{y}})`);
}}
const cam = Battlefield.pathFrom(alc, {{ x: 13, y: 4 }}).map((p) => `${{p.x}},${{p.y}}`);
if (!cam.includes('{PORTA[0]},{PORTA[1]}')) erros.push(`o caminho mais curto ate a torre nao passa pela boca: ${{cam.join(' ')}}`);
console.log(JSON.stringify(erros));
'''
    m = dict(base)
    m['terreno'] = t
    r = subprocess.run(['node', '--import', './src/dev/cena-node/register.mjs', '--input-type=module', '-e', programa],
                       cwd=RAIZ, capture_output=True, text=True, env={**os.environ, 'MAPA': json.dumps(m)})
    if r.returncode:
        sys.exit(f'nao consegui rodar o motor:\n{r.stderr.strip()}')
    erros = json.loads(r.stdout.strip().splitlines()[-1])
    if erros:
        sys.exit('OS PONTOS NAO BATEM COM O MAPA:\n  - ' + '\n  - '.join(erros))
    print('  provas: porta, poço, saída e torre conferidos no motor')


def main():
    base = json.load(open(ENTRADA, encoding='utf-8'))
    h = len(base['terreno'])
    w = len(base['terreno'][0])
    t = terreno(w, h)
    # o poço é obstáculo, não chão: `q` barra passo e dá a superfície que o capítulo escuta
    linha = list(t[POCO_[1]])
    linha[POCO_[0]] = 'q'
    t[POCO_[1]] = ''.join(linha)
    provas(base, t)

    mapa = {
        'terreno': t,
        'paredes': base['paredes'],
        'tracos': base['tracos'],
        **({'tracosTipo': base['tracosTipo']} if base.get('tracosTipo') else {}),
        'fundo': {'nome': 'poco.jpg', 'url': '/mapas/fa/poco.jpg', 'escala': 100,
                  'x0': 0, 'y0': 0, 'giro': 0, 'opacidade': 1},
    }
    pontos = {
        'porta': {'x': PORTA[0], 'y': PORTA[1]},
        'poco': {'x': POCO_[0], 'y': POCO_[1]},
        'tenda': [{'x': x, 'y': y} for x, y in TENDA],
        'torre': TORRE,
        'patio': PATIO,
        'saida': [{'x': x, 'y': y} for x, y in SAIDA_CASAS],
    }
    cabecalho = (
        '// O POÇO DA CORUJA VELHA (Parte 3): a torre de vigia em ruínas, sobre o battlemap da Forgotten Adventures.\n'
        '//\n'
        '// GERADO por `src/dev/mapa-poco-fa.py` — mude lá e rode de novo. A planta é a da cena do Foundry (paredes\n'
        '// e aba da tenda), o terreno sai da COR do desenho, e os pontos abaixo foram medidos rodando o motor; o\n'
        '// gerador se recusa a escrever se algum deles sair do lugar.\n'
        '//\n'
        '// Glifos: , capim · L laje. Quem barra passo é a PAREDE (`tracos`, com a aresta derivada em `paredes`),\n'
        '// não o glifo — é por isso que não há mais rocha nem altura aqui: a torre é uma ruína sem teto.\n'
        '//\n'
        '// A ARTE não entra no repositório nem na publicação (licença da FA). Sem o arquivo em `public/mapas/fa/`,\n'
        '// a cena abre com o ladrilho do glifo.\n'
    )
    # compacto de propósito: `indent=2` põe cada número de traço numa linha e o arquivo passa de 400 linhas
    um = lambda v: json.dumps(v, ensure_ascii=False, separators=(', ', ': '))
    corpo = (
        'export const MAPA_POCO = {\n'
        '  terreno: [\n' + ''.join(f'    {um(l)},\n' for l in mapa['terreno']) + '  ],\n'
        '  paredes: {\n'
        + ''.join(f'    {lado}: [\n' + ''.join(f'      {um(l)},\n' for l in mapa['paredes'][lado]) + '    ],\n'
                  for lado in ('n', 'o'))
        + '  },\n'
        '  tracos: [\n' + ''.join(f'    {um(t)},\n' for t in mapa['tracos']) + '  ],\n'
        + (f'  tracosTipo: {um(mapa["tracosTipo"])},\n' if 'tracosTipo' in mapa else '')
        + f'  fundo: {um(mapa["fundo"])},\n'
        '};\n\n'
        'export const POCO = {\n'
        + ''.join(f'  {c}: {um(pontos[c])},\n' for c in pontos)
        + '};\n'
    )
    with open(SAIDA, 'w', encoding='utf-8', newline='\n') as f:
        f.write(cabecalho + '\n' + corpo)
    print('\n'.join(t))
    print(f'  escrito: {SAIDA}')


if __name__ == '__main__':
    main()
