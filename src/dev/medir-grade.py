"""Mede a GRADE DESENHADA num mapa pintado e diz como ele encaixa no jogo.

    python src/dev/medir-grade.py _referencias/mapas/emboscada.png
    python src/dev/medir-grade.py <imagem> --casas 28x22      # confere contra um mapa que já existe

Devolve o passo da grade em pixels, quantas casas cabem na imagem e o bloco `fundo` pronto para colar no mapa
(ou para o editor, ferramenta 8).

COMO MEDE, e por que assim. O perfil de claridade da imagem, somado ao longo do outro eixo, tem um pico periódico
onde estão as linhas da grade; o gradiente realça a linha e o módulo de Fourier acha o período. Duas lições que
custaram caro antes:

- MEDIR A IMAGEM INTEIRA. Numa faixa estreita (cinco períodos) o pico cai num harmônico: num mapa da Casa da Morte
  isso deu 101 px onde o certo era 69, e eu cheguei a concluir que a campanha estava desalinhada. Não estava.
- CONFERIR CONTRA A CONTA. Se a imagem tem 2048 px e o mapa tem 30 casas, a casa tem 68,3 px. O passo medido tem de
  bater com isso; quando não bate, ou a imagem não está alinhada ou a medida pegou um harmônico.
- NEM TODO MAPA TEM GRADE DESENHADA, e aí não há o que medir. Nos mapas da Casa da Morte a tábua do assoalho se
  repete a cada 22 px e o pico cai nela: o x dava 22 e o y dava 159, que não é grade nenhuma. Grade de verdade dá o
  MESMO passo nos dois eixos, então é isso que se exige antes de responder. Para mapa sem grade, o caminho é outro:
  `alinhar-mapa-pintado.py`, que casa o desenho com uma planta que já existe.
"""
import os
import sys

import numpy as np
from PIL import Image


def perfil(a, por_x):
    """O gradiente do perfil de claridade ao longo de um eixo, sem a média."""
    p = a.mean(axis=0 if por_x else 1)
    g = np.abs(np.diff(p, prepend=p[:1]))
    return g - g.mean()


def medir(g, menor=12.0, maior=260.0, passo=0.25):
    """O período que mais aparece no sinal, e a fase dele (onde cai a primeira linha)."""
    melhor = (0.0, -1.0, 0.0)
    i = np.arange(len(g))
    for T in np.arange(menor, min(maior, len(g) / 3), passo):
        ang = i * 2 * np.pi / T
        re = float((g * np.cos(ang)).sum())
        im = float((g * np.sin(ang)).sum())
        f = np.hypot(re, im)
        if f > melhor[1]:
            melhor = (float(T), f, float(np.arctan2(im, re)))
    T, forca, fase = melhor
    # a fase diz onde está a PRIMEIRA linha da grade; `x0` do `fundo` é onde cai o canto da casa (0,0), que é a
    # mesma coisa medida do outro lado — daí o complemento.
    primeira = (T - ((-fase / (2 * np.pi)) * T) % T) % T
    return {'passo': round(T, 2), 'desloc': round(primeira, 1), 'nitidez': round(forca / max(1e-6, np.abs(g).sum()), 3)}


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return
    caminho = sys.argv[1]
    casas = None
    if '--casas' in sys.argv:
        w, h = sys.argv[sys.argv.index('--casas') + 1].lower().split('x')
        casas = (int(w), int(h))
    im = Image.open(caminho).convert('RGB')
    a = np.asarray(im).astype(np.float32).mean(axis=2)
    gx = medir(perfil(a, True))
    gy = medir(perfil(a, False))
    print(f'{os.path.basename(caminho)}  {im.width} x {im.height} px')
    print(f"  passo medido: {gx['passo']} px em x (nitidez {gx['nitidez']}), {gy['passo']} em y ({gy['nitidez']})")
    # grade de verdade dá o mesmo passo nos dois eixos; se discordam, o pico é de outra coisa (tábua, telha, tijolo)
    concordam = abs(gx['passo'] - gy['passo']) <= max(1.5, 0.04 * max(gx['passo'], gy['passo']))
    if not concordam and not casas:
        print(f"  os dois eixos NÃO CONCORDAM ({gx['passo']} contra {gy['passo']}): esta imagem não tem grade desenhada,")
        print('  ou o pico caiu numa textura que se repete (tábua, telha). Use `alinhar-mapa-pintado.py`, que casa o')
        print('  desenho com uma planta que já existe, ou enquadre a olho no /editor.html (ferramenta 8).')
        return
    passo = (gx['passo'] + gy['passo']) / 2
    print(f'  cabem {im.width / passo:.1f} x {im.height / passo:.1f} casas na imagem')
    if casas:
        esperado_x = im.width / casas[0]
        esperado_y = im.height / casas[1]
        erro = max(abs(gx['passo'] - esperado_x), abs(gy['passo'] - esperado_y))
        print(f'  para {casas[0]} x {casas[1]} casas a conta pede {esperado_x:.2f} e {esperado_y:.2f} px'
              f" — diferença de {erro:.2f} px ({'confere' if erro < 2 else 'NÃO CONFERE'})")
        passo = (esperado_x + esperado_y) / 2
    print('\n  "fundo": ' + f'{{ "nome": "{os.path.basename(caminho)}", "url": "/_referencias/mapas/{os.path.basename(caminho)}",'
          f' "escala": {round(passo, 2)}, "x0": {gx["desloc"]}, "y0": {gy["desloc"]}, "giro": 0, "opacidade": 1 }}')


if __name__ == '__main__':
    main()
