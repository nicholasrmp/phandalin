# -*- coding: utf-8 -*-
"""
Recorta o logotipo gerado sobre magenta chapado e grava o PNG transparente.

Os geradores de imagem do OpenArt não devolvem alfa, então o logotipo é pedido
sobre #FF00FF e o fundo sai aqui. Magenta porque é a cor mais longe de latão,
ouro e bronze: nenhum pixel do metal chega perto dela, e o recorte não come
letra.

Como sai cada pixel:
  alfa      pela distância ao magenta, medida num eixo que o metal não usa:
            o quanto o verde fica ABAIXO do vermelho e do azul. Magenta puro
            tem verde 0 e vermelho = azul = 255; o latão tem verde alto.
  cor       na borda (alfa parcial), a cor é "desmisturada" do magenta — o
            pixel é metal * a + magenta * (1 - a), então metal = (pixel -
            magenta * (1 - a)) / a. Sem isso a borda fica rosada.
  sobra     manchas soltas de fundo (o gerador às vezes deixa um degradê) saem
            pelo maior componente conexo: o logotipo é tudo que encosta nele.

Uso:
  python src/dev/recortar-logo.py ENTRADA.png SAIDA.png [--largura 1200]
"""
import argparse

import numpy as np
from PIL import Image


def recortar(im, largura=None):
    rgb = np.asarray(im.convert('RGB')).astype(np.float32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    # Fundo: amostra das bordas da imagem, que é onde só há magenta.
    borda = np.concatenate([rgb[:8].reshape(-1, 3), rgb[-8:].reshape(-1, 3),
                            rgb[:, :8].reshape(-1, 3), rgb[:, -8:].reshape(-1, 3)])
    fundo = np.median(borda, axis=0)

    # "Magentice": quanto o verde fica abaixo do menor entre vermelho e azul.
    # No fundo é ~255; no metal é negativa ou perto de zero.
    mag = np.minimum(r, b) - g
    mag_fundo = min(fundo[0], fundo[2]) - fundo[1]
    # Rampa: abaixo de 25% do magenta do fundo é metal opaco; acima de 70%,
    # fundo transparente; no meio, borda.
    a = 1.0 - np.clip((mag / mag_fundo - 0.25) / 0.45, 0, 1)

    # Só o que está ligado ao logotipo fica (tira manchas soltas do fundo).
    from scipy import ndimage  # noqa: PLC0415 — só este script precisa
    rotulos, n = ndimage.label(a > 0.5)
    if n > 1:
        tamanhos = ndimage.sum(np.ones_like(a), rotulos, range(1, n + 1))
        grandes = {i + 1 for i, t in enumerate(tamanhos) if t >= tamanhos.max() * 0.002}
        manter = np.isin(rotulos, list(grandes))
        # A borda suave em volta do que fica também fica.
        manter = ndimage.binary_dilation(manter, iterations=3)
        a = np.where(manter, a, 0)

    # Desmistura a cor da borda.
    seguro = np.maximum(a, 1e-3)[..., None]
    cor = (rgb - fundo * (1 - a[..., None])) / seguro
    cor = np.clip(cor, 0, 255)
    saida = np.dstack([cor, a * 255]).astype(np.uint8)
    out = Image.fromarray(saida, 'RGBA')
    out = out.crop(out.getbbox())
    if largura and out.width > largura:
        out = out.resize((largura, round(out.height * largura / out.width)), Image.LANCZOS)
    return out


def main():
    p = argparse.ArgumentParser()
    p.add_argument('entrada')
    p.add_argument('saida')
    p.add_argument('--largura', type=int, default=None)
    a = p.parse_args()
    out = recortar(Image.open(a.entrada), a.largura)
    out.save(a.saida, optimize=True)
    alfa = np.asarray(out)[..., 3]
    print(f'{a.saida}  {out.size}  opacos {np.mean(alfa > 250):.0%}  borda {np.mean((alfa > 5) & (alfa < 250)):.1%}')


if __name__ == '__main__':
    main()
