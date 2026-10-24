# -*- coding: utf-8 -*-
"""
Apaga pedacos SOLTOS de uma direcao da folha: tudo o que nao esta ligado a
figura principal e tem menos de `--maximo` pixels (sobras de arma que a
edicao deixou fora do corpo, lascas do original na borda da janela).

Uso: python src/dev/limpar-soltos.py --fonte <pasta> --perfil <perfil> --direcoes south [--maximo 150]
"""
import argparse
import importlib.util
import json
from pathlib import Path
from PIL import Image

AQUI = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('eq', AQUI / 'editar-quadros.py')
eq = importlib.util.module_from_spec(spec)
spec.loader.exec_module(eq)


def pedacos(px, L):
    cheios = {(x, y) for y in range(L) for x in range(L) if px[x, y][3]}
    visto, comps = set(), []
    for p0 in cheios:
        if p0 in visto:
            continue
        pilha, comp = [p0], []
        visto.add(p0)
        while pilha:
            x, y = pilha.pop()
            comp.append((x, y))
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    q = (x + dx, y + dy)
                    if q in cheios and q not in visto:
                        visto.add(q)
                        pilha.append(q)
        comps.append(comp)
    return sorted(comps, key=len, reverse=True)


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--fonte', required=True)
    p.add_argument('--perfil', required=True)
    p.add_argument('--direcoes', required=True)
    p.add_argument('--maximo', type=int, default=150)
    a = p.parse_args()
    eq.ATAQUE = eq.ATAQUE_POR_PERFIL[a.perfil]
    fonte = Path(a.fonte)
    jm = next(j for j in fonte.glob('*.json') if j.name not in ('armas.json', 'meta.json'))
    meta = json.loads(jm.read_text(encoding='utf-8'))['spritesheet']
    L = meta['cell_size']['width']
    folha = Image.open(fonte / meta['path']).convert('RGBA')
    for d in a.direcoes.split(','):
        for r, c in eq.quadros_da_direcao(meta, d):
            cel = folha.crop((c * L, r * L, (c + 1) * L, (r + 1) * L))
            px = cel.load()
            comps = pedacos(px, L)
            fora = [k for k in comps[1:] if len(k) < a.maximo]
            for k in fora:
                for x, y in k:
                    px[x, y] = (0, 0, 0, 0)
            if fora:
                print(f'{d} {r}:{c}  apagados {[len(k) for k in fora]}')
            folha.paste(cel, (c * L, r * L))
    folha.save(fonte / meta['path'])


if __name__ == '__main__':
    main()
