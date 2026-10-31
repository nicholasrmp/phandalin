# -*- coding: utf-8 -*-
"""
Tira o LADRILHO que o gerador às vezes desenha atrás dos ícones de uma folha (um retângulo de cantos redondos azul-lavanda, cinza-azulado...)
apesar do pedido "sem fundo". O conversor mede UM fundo (o magenta das bordas) e trata o ladrilho como desenho; aqui o ladrilho vira magenta.

    python src/dev/icones_limpar.py <pasta> --colunas 3 --linhas 2

Em cada célula, quatro sementes dentro do ladrilho dão a cor dele; se não é magenta, enche-se dali tudo o que está perto dessa cor (só o que se liga às
sementes: o desenho, cercado pelo contorno escuro, fica). Grava `folha.png` limpo (o original vai para `folha-bruta.png`).
"""
import argparse
import shutil
from collections import Counter
from pathlib import Path
from PIL import Image

MAGENTA = (255, 0, 255)


def perto(a, b, tol):
    return sum(abs(x - y) for x, y in zip(a, b)) <= tol


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('pasta')
    ap.add_argument('--colunas', type=int, required=True)
    ap.add_argument('--linhas', type=int, required=True)
    ap.add_argument('--tol', type=int, default=70)
    a = ap.parse_args()
    pasta = Path(a.pasta)
    bruta = pasta / 'folha-bruta.png'
    if not bruta.exists():
        shutil.copy(pasta / 'folha.png', bruta)
    im = Image.open(bruta).convert('RGB')
    px = im.load()
    W, H = im.size
    cw, ch = W / a.colunas, H / a.linhas
    limpas = 0
    for cy in range(a.linhas):
        for cx in range(a.colunas):
            x0, y0, x1, y1 = int(cx * cw), int(cy * ch), int((cx + 1) * cw), int((cy + 1) * ch)
            # SEMENTES: quatro pontos a 9% dos cantos da célula, que caem DENTRO do ladrilho (a célula tem margem magenta e o ladrilho vem
            # inscrito, de cantos redondos). Se a semente é magenta, não há ladrilho ali.
            sementes = [(int(x0 + cw * fx), int(y0 + ch * fy)) for fx in (0.09, 0.91) for fy in (0.09, 0.91)]
            cores = [px[s] for s in sementes if not perto(px[s], MAGENTA, 120)]
            if not cores:
                continue
            cor = Counter(cores).most_common(1)[0][0]
            fila = [s for s in sementes if perto(px[s], cor, a.tol)]
            visto = set()
            while fila:
                x, y = fila.pop()
                if (x, y) in visto or not (x0 <= x < x1 and y0 <= y < y1):
                    continue
                visto.add((x, y))
                if perto(px[x, y], cor, a.tol):
                    px[x, y] = MAGENTA
                    fila += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
            limpas += 1
    im.save(pasta / 'folha.png')
    print(f'{pasta.name}: {limpas} célula(s) com ladrilho limpas')


if __name__ == '__main__':
    main()
