"""Gera o terreno da EMBOSCADA DOS GOBLINS a partir do mapa pintado.

    python src/dev/mapa-emboscada.py            # imprime as linhas para colar em `game/encounter.js`

O mapa é o primeiro encontro de A Mina Perdida de Phandelver: a Trilha Triboar cortando a mata, os cavalos mortos
na estrada e as moitas dos dois lados, de onde os goblins saltam. O desenho é NOSSO — gerado no OpenArt
(Nano Banana Pro, 2304x1856), cortado na grade e reduzido para `public/mapas/emboscada.webp`, 1760x1360, que são
80 px por casa cravados em 22 por 17. O terreno sai DELE, por cor: nada aqui é desenhado à mão. Como o arquivo
medido é o MESMO que o jogo carrega, qualquer um reproduz esta saída com o repositório na mão.

COMO A ESTRADA É ACHADA, e por que não basta um corte de cor. A copa da mata tem vãos escuros que, medidos, dão a
mesma dessaturação da terra batida — separar só por "pouco verde" transforma meia floresta em estrada. O que
separa de verdade é pouco verde E claro (brilho > 100): a terra do caminho fica entre 104 e 150, o vão de copa
entre 22 e 96.

E a estrada não sai inteira: a carroça tombada corta a faixa na coluna 4 e os cavalos mortos na coluna 18, então o
maior pedaço conexo é só o miolo. Por isso se juntam TODOS os pedaços com 4 casas ou mais (os de uma casa são vão
de copa) e, coluna a coluna, o que estiver ENTRE a primeira e a última casa de terra é corredor: o que ali não for
terra clara é o objeto que a cortou — carroça a oeste, cavalo a leste.

Duas correções que a medida pediu. A coluna 4 não tem UMA casa de terra (a carroça a tapa inteira), então o
corredor de cada coluna é tirado de uma janela de ±2 colunas; e a carroça transborda para baixo da faixa, então o
objeto CRESCE do corredor para as vizinhas escuras e sem verde (verde < 5, que é o que separa madeira de sombra
de copa). Sem o crescimento a traseira da carroça virava moita.

Fora do corredor, a distância até ele decide: 1 ou 2 casas vira `%` espinheiro (terreno difícil, a moita de onde o
livro faz os goblins saltarem), 3 ou mais vira `T` mata fechada, que barra passo e visão.
"""
import os
from collections import deque

import numpy as np
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
IMAGEM = os.path.join(RAIZ, 'public', 'mapas', 'emboscada.webp')
W, H = 22, 17
PASSO = 80.0                # a imagem já vem cortada na grade: 1760x1360 = 22 x 17 casas de 80 px
X0, Y0 = 0.0, 0.0
CLARO = 100                 # terra batida acima disto; vão de copa abaixo
VERDE = 8                   # excesso de verde: acima disto é folha, não terra
MINIMO = 4                  # pedaço de estrada menor que isto é vão de copa, não caminho
JANELA = 1                  # colunas de cada lado que emprestam a largura do corredor a uma coluna tapada
MADEIRA = 5                 # excesso de verde abaixo disto, e escuro: é objeto, não sombra de copa
OESTE = 10                  # objeto na estrada à esquerda desta coluna é carroça; à direita, cavalo


def amostrar():
    """A cor mediana do miolo de cada casa (60% centrais), para a borda do ladrilho não pesar."""
    im = Image.open(IMAGEM).convert('RGB')
    a = np.asarray(im).astype(np.float32)
    saida = []
    for cy in range(H):
        linha = []
        for cx in range(W):
            xs = [int(X0 + (cx + t) * PASSO) for t in np.linspace(0.2, 0.8, 7)]
            ys = [int(Y0 + (cy + t) * PASSO) for t in np.linspace(0.2, 0.8, 7)]
            xs = [x for x in xs if 0 <= x < im.width]
            ys = [y for y in ys if 0 <= y < im.height]
            bloco = a[np.ix_(ys, xs)].reshape(-1, 3)
            linha.append(np.median(bloco, axis=0))
        saida.append(linha)
    return saida


def pedacos(terra):
    """Os pedaços 4-conexos de terra clara, em ordem de tamanho."""
    visto = [[False] * W for _ in range(H)]
    saida = []
    for y in range(H):
        for x in range(W):
            if not terra[y][x] or visto[y][x]:
                continue
            visto[y][x] = True
            fila = [(x, y)]
            grupo = []
            while fila:
                px, py = fila.pop()
                grupo.append((px, py))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = px + dx, py + dy
                    if 0 <= nx < W and 0 <= ny < H and terra[ny][nx] and not visto[ny][nx]:
                        visto[ny][nx] = True
                        fila.append((nx, ny))
            saida.append(grupo)
    return sorted(saida, key=len, reverse=True)


def main():
    c = amostrar()
    verde = lambda p: p[1] - (p[0] + p[2]) / 2
    brilho = lambda p: float(p.mean())
    terra = [[verde(c[y][x]) < VERDE and brilho(c[y][x]) > CLARO for x in range(W)] for y in range(H)]

    estrada = {p for grupo in pedacos(terra) if len(grupo) >= MINIMO for p in grupo}
    g = [['T'] * W for _ in range(H)]
    objeto = lambda x: 'C' if x < OESTE else 'h'
    for x in range(W):
        vizinhanca = [y for dx in range(-JANELA, JANELA + 1) for y in range(H) if (x + dx, y) in estrada]
        if not vizinhanca:
            continue
        for y in range(min(vizinhanca), max(vizinhanca) + 1):
            g[y][x] = ':' if (x, y) in estrada else objeto(x)

    # o objeto cresce do corredor para fora: a carroça tombada passa da faixa de terra, e a traseira dela não é moita
    fila = deque((x, y) for y in range(H) for x in range(W) if g[y][x] in ('C', 'h'))
    while fila:
        x, y = fila.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if not (0 <= nx < W and 0 <= ny < H) or g[ny][nx] != 'T':
                continue
            if verde(c[ny][nx]) < MADEIRA and brilho(c[ny][nx]) < CLARO:
                g[ny][nx] = objeto(nx)
                fila.append((nx, ny))

    # mancha escura de UMA ou DUAS casas é sombra ou poça, não destroço: só clarão de 3 para cima vale. Depois do
    # crescimento, e não antes: a garupa dos cavalos chega ao corredor por fora, e sozinha parecia poça.
    for grupo in pedacos([[g[y][x] in ('C', 'h') for x in range(W)] for y in range(H)]):
        if len(grupo) < 3:
            for x, y in grupo:
                g[y][x] = ':'

    # a distância até o corredor: 1 ou 2 casas é moita, daí para fora é mata fechada
    dist = [[None] * W for _ in range(H)]
    fila = deque()
    for y in range(H):
        for x in range(W):
            if g[y][x] != 'T':
                dist[y][x] = 0
                fila.append((x, y))
    while fila:
        x, y = fila.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < W and 0 <= ny < H and dist[ny][nx] is None:
                dist[ny][nx] = dist[y][x] + 1
                fila.append((nx, ny))
    for y in range(H):
        for x in range(W):
            if g[y][x] == 'T' and dist[y][x] is not None and dist[y][x] <= 2:
                g[y][x] = '%'

    for linha in g:
        print(f"    '{''.join(linha)}',")


if __name__ == '__main__':
    main()
