# -*- coding: utf-8 -*-
"""
Recolore uma folha de sprites do PixelLab por troca de paleta. NAO gasta
geracoes: e so Python em cima do PNG.

PREPARADO PARA AS SKINS. A decisao e tratar cor de escama e tom de aco como
skin, num sistema futuro. Este script e o teste que provou que funciona
(dara-recolor-teste.png) transformado em ferramenta; a versao final deve
morar no motor, na carga da folha, com cache, em vez de um PNG por skin.

POR QUE FUNCIONA. Os sprites do PixelLab nao tem alfa parcial e tem poucas
cores (a Dara tem ~60). Cada cor exata vira outra cor exata, e como todos os
quadros usam a mesma paleta, a folha inteira -- parado, andar, ataque, queda,
8 direcoes -- muda de uma vez.

O QUE ELE NAO SEPARA. As mascaras sao por cor, nao por material:
  - o vermelho das escamas e o mesmo do emblema do escudo e da barra da
    tunica, entao eles seguem a escama;
  - o cinza da armadura e o mesmo da espada e do escudo, entao o "aco
    dourado" doura a espada tambem.
E o giro de matiz simples tira o contraste das escamas prateadas: a versao
final deve mapear cada tom original, por ordem de luminosidade, numa rampa
escolhida a mao.

Uso:
  python src/dev/recolorir.py <entrada.png> <saida.png> escamas-azuis [aco-enegrecido ...]
  python src/dev/recolorir.py --lista
"""
import argparse
import colorsys
from PIL import Image


def _hsv(c):
    return colorsys.rgb_to_hsv(*(x / 255 for x in c))


def _cl(x):
    return max(0.0, min(1.0, x))


# Mascaras: que cores pertencem a cada material. Afinadas na Dara vermelha.
def escama(c):
    h, s, v = _hsv(c)
    hd = h * 360
    return (hd < 15 or hd > 340) and s > 0.55 and v > 0.2


def aco(c):
    h, s, v = _hsv(c)
    hd = h * 360
    return 180 <= hd <= 260 and s < 0.35 and v > 0.15


# Skins: (mascara, funcao que leva h, s, v da cor original para a nova).
SKINS = {
    'escamas-azuis': (escama, lambda h, s, v: (215 / 360, s, _cl(v * 1.05))),
    'escamas-bronze': (escama, lambda h, s, v: (32 / 360, s * 0.85, _cl(v * 1.2))),
    'escamas-prateadas': (escama, lambda h, s, v: (215 / 360, s * 0.12, _cl(v * 1.35 + 0.08))),
    'escamas-negras': (escama, lambda h, s, v: (h, s * 0.25, v * 0.55)),
    'aco-dourado': (aco, lambda h, s, v: (44 / 360, 0.55, _cl(v))),
    'aco-enegrecido': (aco, lambda h, s, v: (h, s, v * 0.55)),
}


def mapa_de_cores(img, skins):
    """Cor original -> cor nova, para cada cor opaca da imagem. As skins
    valem na ordem dada; uma cor ja trocada nao e testada de novo."""
    mapa = {}
    for _, (r, g, b, a) in img.getcolors(maxcolors=1 << 24):
        if not a:
            continue
        for nome in skins:
            teste, f = SKINS[nome]
            if teste((r, g, b)):
                nr, ng, nb = colorsys.hsv_to_rgb(*f(*_hsv((r, g, b))))
                mapa[(r, g, b, a)] = (round(nr * 255), round(ng * 255), round(nb * 255), a)
                break
    return mapa


def recolorir(img, skins):
    img = img.convert('RGBA')
    mapa = mapa_de_cores(img, skins)
    pixels = getattr(img, 'get_flattened_data', img.getdata)()
    img.putdata([mapa.get(p, p) for p in pixels])
    return img, len(mapa)


def main():
    p = argparse.ArgumentParser()
    p.add_argument('entrada', nargs='?')
    p.add_argument('saida', nargs='?')
    p.add_argument('skins', nargs='*')
    p.add_argument('--lista', action='store_true')
    a = p.parse_args()
    if a.lista or not (a.entrada and a.saida and a.skins):
        print('skins:', ', '.join(sorted(SKINS)))
        return
    for nome in a.skins:
        if nome not in SKINS:
            raise SystemExit(f'skin desconhecida: {nome}. Use --lista.')
    img, n = recolorir(Image.open(a.entrada), a.skins)
    img.save(a.saida)
    print(f'{a.saida}: {n} cores trocadas ({", ".join(a.skins)})')


if __name__ == '__main__':
    main()
