# -*- coding: utf-8 -*-
"""
A capa do Pip muda com a armadura, SEM GASTAR GERACOES: de couro ela e verde
(a do desenho), de couro batido e PRETA (escolha do dono). Sem isso a troca
de armadura quase nao se ve -- o couro some debaixo da capa.

A capa e o verde-escuro do desenho: matiz de verde, saturacao baixa a media e
valor ate 0,62. Os olhos tambem sao verdes, mas saturados, e ficam de fora.

Saida: pastas `<origem>-capa-preta`, prontas para o `importar-pip.sh`.
"""
import colorsys
import json
import shutil
from pathlib import Path
from PIL import Image

R = Path(__file__).resolve().parents[2] / '_referencias' / 'pixellab'
K = '-pip-armadura-couro-batido'
PASTAS = [
    R / 'rogue-bd64b4ff' / f'anim{K}',
    R / 'rogue-bd64b4ff' / f'anim-pip-arma-rapieira{K}',
    R / 'rogue-bd64b4ff' / f'anim-pip-queda-sem-arma{K}',
    R / 'rogueAdagas-3017fee5' / f'anim{K}',
    R / 'rogueAdagas-3017fee5' / f'anim-pip-arma-espadas{K}',
    R / 'rogueAdagas-3017fee5' / f'anim-pip-arma-espada-adaga{K}',
    R / 'rogueArco-d199eb86' / f'anim{K}',
    R / 'rogueBestaDeMao-d048c58d' / f'anim{K}',
]


def preta(p):
    h, s, v = colorsys.rgb_to_hsv(*(c / 255 for c in p[:3]))
    # os olhos sao verdes tambem, mas bem mais saturados que a capa
    if not (p[3] and 0.20 <= h <= 0.48 and 0.12 < s < 0.55 and v < 0.62):
        return None
    r, g, b = colorsys.hsv_to_rgb(0.66, s * 0.25, v * 0.72)    # preto azulado
    return (round(r * 255), round(g * 255), round(b * 255), p[3])


def main():
    for origem in PASTAS:
        jm = next(j for j in origem.glob('*.json') if j.name not in ('armas.json', 'meta.json'))
        meta = json.loads(jm.read_text(encoding='utf-8'))['spritesheet']
        folha = Image.open(origem / meta['path']).convert('RGBA')
        px = folha.load()
        for y in range(folha.height):
            for x in range(folha.width):
                novo = preta(px[x, y])
                if novo:
                    px[x, y] = novo
        destino = origem.parent / f'{origem.name}-capa-preta'
        if destino.exists():
            shutil.rmtree(destino)
        shutil.copytree(origem, destino)
        folha.save(destino / meta['path'])
        print(destino.relative_to(R))


if __name__ == '__main__':
    main()
