# -*- coding: utf-8 -*-
"""
A Dragonguard do Torvik como RESKIN das placas, SEM GASTAR GERACOES: o aco
da armadura, do capacete e do escudo vira o bronze avermelhado da Dara; a
arma fica de aco.

ONDE ESTA A ARMA: no que as placas e a malha tem em comum. Procurar a
lamina pela forma confundia a espada com a greva e o capacete com a
ombreira; ver `dragonguard`.

Saida: pastas `<origem>-dragonguard`, prontas para o `importar-torvik.sh`.
"""
import importlib.util
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
_spec = importlib.util.spec_from_file_location('rb', AQUI / 'reskins-brenn.py')
rb = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(rb)
rd = rb.rd


def dragonguard(origem, malha):
    """
    O aco das PLACAS que nao esta na versao de MALHA da mesma folha vira
    bronze. As duas tem a mesma pose (a malha e edicao das placas): o que e aco
    nas duas, no mesmo lugar (um pixel de folga), e a arma, o capacete e o
    aro do escudo -- ficam de aco. O resto do aco e a armadura de placas.
    """
    meta, C, folha = rb.abrir(origem)
    _, _, outra = rb.abrir(malha)
    px, pm = folha.load(), outra.load()
    W, H = folha.size

    def aco_na_malha(x, y):
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                X, Y = x + dx, y + dy
                if 0 <= X < W and 0 <= Y < H and rd.aco(pm[X, Y]) and                         abs(rd.lum(pm[X, Y]) - rd.lum(px[x, y])) < 40 and not rd.xadrez(pm, X, Y, W, H):
                    return True
        return False

    # o capacete e de aco sempre: o quinto de cima de cada figura fica de fora
    # (placas e malha redesenham o capacete um pouco diferente, e o que nao
    # batia virava bronze em pontinhos)
    topo = {}
    for y in range(H):
        for x in range(W):
            if px[x, y][3]:
                k = (x // C, y // C)
                topo.setdefault(k, [y, y])[1] = y
    for y in range(H):
        for x in range(W):
            p = px[x, y]
            t0, t1 = topo.get((x // C, y // C), (0, 0))
            if y < t0 + (t1 - t0) // 5:
                continue
            if not p[3] or not rd.aco(p) or aco_na_malha(x, y):
                continue
            novo = rd.dragonguard(p)
            if novo:
                px[x, y] = (*novo, p[3])
    rb.salvar(origem, origem.parent / f'{origem.name}-dragonguard', meta, folha)


if __name__ == '__main__':
    # uso: reskins-torvik.py <placas> <malha> [<placas> <malha> ...]
    a = [Path(x).resolve() for x in sys.argv[1:]]
    for placas, malha in zip(a[::2], a[1::2]):
        dragonguard(placas, malha)
