"""Gera o terreno do ERMO — o mapa dos encontros de viagem na estrada — a partir do desenho.

    python src/dev/mapa-ermo.py            # imprime as linhas para colar em `game/encounter.js`

O desenho é NOSSO: gerado no OpenArt (Nano Banana 2 Lite, 1264x848), cortado na grade e levado para
`public/mapas/ermo.webp`, 1760x1200, que são 80 px por casa cravados em 22 por 15. O terreno sai DELE, por cor.
O mapa antigo era desenhado em código: uma estrada retangular de duas casas atravessando o campo em linha reta,
quatro borrões de mata nos cantos e dezoito moitas salpicadas uma a uma.

AS QUATRO PERGUNTAS, nesta ordem — a ordem importa, porque pedra e estrada se confundem em duas das três medidas:

  pedra      SATURAÇÃO baixa (< 20). É o que separa o pedregulho cinza da terra batida: as duas são claras e
             sem verde, mas a estrada é areia morna (saturação 45 a 55) e a pedra é cinza puro (0 a 14).
  estrada    pouco verde (< 16) e clara (> 148). A terra do caminho mede 150 a 180 de brilho; a grama, 100 a 145.
  mata       escura (< 92) e verde. Separar COPA de MOITA por cor não funciona — as duas são verde escuro com
             contorno preto —, então vale a forma: o aglomerado que ENCOSTA NA BORDA do mapa é bosque (`T`, barra
             passo e visão), e o que fica no meio é o espinheiro da curva (`b`, cobertura que não barra visão).
             É o que o desenho mostra: as árvores estão nos cantos, a moita abraça a curva da estrada.
  grama      todo o resto.
"""
import os
import sys
from collections import deque

import numpy as np
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
IMAGEM = os.path.join(RAIZ, 'public', 'mapas', 'ermo.webp')
W, H = 22, 15
PASSO = 80.0                # a imagem já vem cortada na grade: 1760x1200 = 22 x 15 casas de 80 px
CINZA = 20                  # saturação abaixo disto é pedregulho, não terra
VERDE = 16                  # excesso de verde acima disto é folha
CLARO = 148                 # brilho acima disto, sem verde, é a terra do caminho
ESCURO = 92                 # brilho abaixo disto, com verde, é copa ou moita


def amostrar():
    """A cor mediana do miolo de cada casa (70% centrais), para o contorno preto do desenho não pesar."""
    im = Image.open(IMAGEM).convert('RGB')
    a = np.asarray(im).astype(np.float32)
    saida = []
    for cy in range(H):
        linha = []
        for cx in range(W):
            xs = [min(im.width - 1, int((cx + t) * PASSO)) for t in np.linspace(0.15, 0.85, 9)]
            ys = [min(im.height - 1, int((cy + t) * PASSO)) for t in np.linspace(0.15, 0.85, 9)]
            linha.append(np.median(a[np.ix_(ys, xs)].reshape(-1, 3), axis=0))
        saida.append(linha)
    return saida


def grupos(marcadas):
    """Os aglomerados 4-conexos de casas marcadas."""
    resto = set(marcadas)
    saida = []
    while resto:
        p = resto.pop()
        fila = deque([p])
        g = {p}
        while fila:
            x, y = fila.popleft()
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                v = (x + dx, y + dy)
                if v in resto:
                    resto.discard(v)
                    g.add(v)
                    fila.append(v)
        saida.append(g)
    return saida


def main():
    c = amostrar()
    verde = lambda p: p[1] - (p[0] + p[2]) / 2
    brilho = lambda p: float(p.mean())
    satura = lambda p: float(p.max() - p.min())

    g = [[','] * W for _ in range(H)]
    escuras = []
    for y in range(H):
        for x in range(W):
            p = c[y][x]
            if satura(p) < CINZA:
                g[y][x] = 'r'
            elif verde(p) < VERDE and brilho(p) > CLARO:
                g[y][x] = ':'
            elif brilho(p) < ESCURO and verde(p) > 12:
                escuras.append((x, y))

    # copa ou moita: quem encosta na borda do mapa é bosque; o que fica no meio é espinheiro
    for grupo in grupos(escuras):
        naBorda = any(x == 0 or y == 0 or x == W - 1 or y == H - 1 for x, y in grupo)
        for x, y in grupo:
            g[y][x] = 'T' if naBorda else 'b'

    # BOLSÃO FECHADO VIRA MATA. O recorte por cor deixa, aqui e ali, duas casas de grama cercadas de copa — em
    # (19,13) deste desenho. Ninguém chega nelas e ninguém as vê; `src/dev/conferir-paredes.mjs` acusa, com razão.
    # Some-se o maior pedaço andável e tudo que ficou de fora vira `T`.
    andavel = {(x, y) for y in range(H) for x in range(W) if g[y][x] != 'T'}
    pedacos = sorted(grupos(andavel), key=len, reverse=True)
    for pedaco in pedacos[1:]:
        for x, y in pedaco:
            g[y][x] = 'T'
    if len(pedacos) > 1:
        # no erro padrão: a saída é para colar, e comentário no meio do vetor não cola
        print(f'{sum(len(p) for p in pedacos[1:])} casa(s) de bolsão fechado viraram mata', file=sys.stderr)

    for linha in g:
        print(f"    '{''.join(linha)}',")


if __name__ == '__main__':
    main()
