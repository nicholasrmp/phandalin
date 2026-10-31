# -*- coding: utf-8 -*-
"""
Passa um efeito do `/vfx` do PixelLab (folha .png + .json, de `efeito-pixellab.py`) para src/art/efeitos.js.

    python src/dev/importar-pixellab-efeito.py _referencias/pixellab/efeitos/pele-de-pedra pele-de-pedra [--remover nome1,nome2]

A folha ja e pixel art de verdade (nao precisa da reducao que `importar-efeitos.py` faz): cada pixel opaco vira a cor mais
proxima da paleta `P`, e o fundo transparente vira '.'. Os quadros mantem o tamanho do canvas do PixelLab (64x96, por exemplo);
`lado` e a ALTURA do quadro, como no conversor das folhas do OpenArt.
"""
import json
import re
import sys
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parents[2]
SAIDA = RAIZ / 'src' / 'art' / 'efeitos.js'
PALETA = ['#e8eef5', '#aab6c6', '#6b7686', '#b0875a', '#8a6236', '#e8c35a', '#a6822c',
          '#e0553c', '#6ea8e8', '#e2b183', '#f4f0e4', '#6fc07a', '#a579d8', '#2a2430']
CHAVES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e']


def rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def mais_proxima(c):
    return min(zip(CHAVES, map(rgb, PALETA)), key=lambda p: sum((c[i] - p[1][i]) ** 2 for i in range(3)))[0]


def main():
    pasta, nome = Path(sys.argv[1]), sys.argv[2]
    remover = []
    if '--remover' in sys.argv:
        remover = sys.argv[sys.argv.index('--remover') + 1].split(',')
    base = pasta.name
    quadros = []
    if '--clip' in sys.argv:
        # Peca do game pack (o efeito SEM o sprite embutido): `pacote/manifest.json` diz a folha, as colunas e o tamanho do quadro.
        nome_clip = sys.argv[sys.argv.index('--clip') + 1]
        manifest = json.loads((pasta / 'pacote' / 'manifest.json').read_text(encoding='utf-8'))
        clip = next(c for c in manifest['clips'] if c['name'] == nome_clip)
        folha = Image.open(pasta / 'pacote' / clip['sheets'][0]['file']).convert('RGBA')
        cols, w, h = clip['sheets'][0]['columns'], clip['frame']['w'], clip['frame']['h']
        meta = {'meta': {'anchor': manifest['anchor'], 'offset': clip['offset']}}
        retangulos = [{'x': (i % cols) * w, 'y': (i // cols) * h, 'w': w, 'h': h} for i in range(clip['frames'])]
    else:
        folha = Image.open(pasta / f'{base}.png').convert('RGBA')
        meta = json.loads((pasta / f'{base}.json').read_text(encoding='utf-8'))
        retangulos = [f['frame'] for f in meta['frames']]
    for r in retangulos:
        im = folha.crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h']))
        px = im.load()
        quadros.append([''.join('.' if px[x, y][3] < 128 else mais_proxima(px[x, y][:3]) for x in range(im.width)) for y in range(im.height)])
    texto = SAIDA.read_text(encoding='utf-8')
    efeitos = json.loads(re.search(r'EFEITOS = (\{.*?\n\});', texto, re.S).group(1))
    for n in remover:
        efeitos.pop(n, None)
    efeitos[nome] = {'lado': len(quadros[0]), 'quadros': quadros}
    corpo = json.dumps(efeitos, indent=1, ensure_ascii=False)
    SAIDA.write_text(
        '// Quadros de animação dos efeitos de magia, em pixel art na paleta `P`.\n'
        '// GERADO por src/dev/importar-efeitos.py a partir de folhas do OpenArt (e por importar-pixellab-efeito.py, do /vfx do PixelLab).\n'
        '// Para refazer um efeito, gere a folha de novo e rode o conversor.\n\n'
        f'export const EFEITOS = {corpo};\n', encoding='utf-8')
    print(f'{nome}: {len(quadros)} quadros de {len(quadros[0][0])}x{len(quadros[0])}; {meta["meta"]}')


if __name__ == '__main__':
    main()
