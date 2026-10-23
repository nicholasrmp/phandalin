# -*- coding: utf-8 -*-
"""
Divide o catálogo de ícones em folhas e escreve, para cada uma, a
especificação que `importar-icones.py` lê e o prompt que vai para o gerador.

    python src/dev/icones_lote.py planejar --por-folha 24
    python src/dev/icones_lote.py prompt 1          # imprime o prompt da folha 1

As folhas vão para `_referencias/icones/lote/folha-NN/` (fora do git): o que
entra no jogo é só a grade de texto que o conversor escreve depois.

O PROMPT É UM SÓ PARA TODAS AS FOLHAS, de propósito: o que mantém seiscentos
ícones parecendo um conjunto é a referência de estilo (as folhas já aprovadas)
mais regras idênticas em todo pedido. Variar o prompt entre folhas é variar o
estilo.
"""
import argparse
import importlib.util
import json
import math
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
SAIDA = RAIZ / '_referencias' / 'icones' / 'lote'
PALETA = ['#e8eef5', '#aab6c6', '#6b7686', '#b0875a', '#8a6236', '#e8c35a', '#a6822c',
          '#e0553c', '#6ea8e8', '#e2b183', '#f4f0e4', '#6fc07a', '#a579d8', '#2a2430']

# 24 por folha é 6x4: no 16:9 a 2K sobram ~450 px por célula, ~14 vezes o que
# o ícone final de 32 px precisa. Mais células derrubam a chance do gerador
# respeitar a contagem e a ordem.
GRADES = {15: (5, 3), 20: (5, 4), 24: (6, 4), 28: (7, 4), 30: (6, 5)}


def carregar(nome):
    p = Path(__file__).with_name(nome)
    spec = importlib.util.spec_from_file_location(nome[:-3], p)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def catalogo():
    return list(carregar('icones_catalogo_magias.py').entradas()) + \
        list(carregar('icones_catalogo_recursos.py').entradas())


def prompt(itens, colunas, linhas):
    ordem = []
    for r in range(linhas):
        cel = itens[r * colunas:(r + 1) * colunas]
        if not cel:
            break
        partes = '; '.join(f'({r * colunas + i + 1}) {x["conceito"]}' for i, x in enumerate(cel))
        ordem.append(f'Row {r + 1}: {partes}.')
    vazias = colunas * linhas - len(itens)
    fim = (f' Leave the last {vazias} cell(s) at the bottom-right completely empty.' if vazias else '')
    # CURTO DE PROPÓSITO: o Kling aceita até 2.500 caracteres, e a comparação
    # entre modelos só é justa se todos recebem o MESMO texto. As regras são
    # as mesmas da versão longa, ditas em menos palavras.
    return (
        f'Sprite sheet of {len(itens)} icons for a dark fantasy RPG, TRUE PIXEL ART. '
        'Match the attached reference sheets EXACTLY in style (pixel size, 1px dark outline, flat fills '
        'with hard steps, light from upper left, bold silhouettes, icon size in cell) but draw ONLY the new '
        'subjects below; never copy a reference icon.\n'
        f'Grid of {colunas} columns x {linhas} rows, evenly spaced, one icon centered per cell, left to right, '
        f'top to bottom, this exact order.{fim}\n' + '\n'.join(ordem) + '\n'
        'Each icon on a 32x32 pixel grid upscaled nearest-neighbour: crisp square pixels, no anti-aliasing, '
        'blur, gradients or soft shading. 1px #2a2430 outline. Subject fills most of its cell; dark subjects '
        'get bright highlights. No background shape behind icons.\n'
        'Only these colours: ' + ' '.join(PALETA) + '.\n'
        'Background: flat pure magenta #FF00FF everywhere. No text, letters, numbers, labels, grid lines or frames.'
    )


def planejar(por_folha):
    colunas, linhas = GRADES[por_folha]
    itens = catalogo()
    n = math.ceil(len(itens) / por_folha)
    SAIDA.mkdir(parents=True, exist_ok=True)
    indice = []
    for k in range(n):
        lote = itens[k * por_folha:(k + 1) * por_folha]
        pasta = SAIDA / f'folha-{k + 1:02d}'
        pasta.mkdir(exist_ok=True)
        esp = {
            'paleta': PALETA, 'colunas': colunas, 'linhas': linhas,
            # O nome do ícone já vai com o prefixo (`magia-`, `acao-`...):
            # o conversor roda com `--prefixo ''`.
            'icones': [[x['prefixo'] + x['id'], x['conceito']] for x in lote],
            'entradas': lote,
        }
        (pasta / 'especificacao.json').write_text(json.dumps(esp, indent=1, ensure_ascii=False), encoding='utf-8')
        (pasta / 'prompt.txt').write_text(prompt(lote, colunas, linhas), encoding='utf-8')
        cats = sorted({x['categoria'] for x in lote})
        indice.append({'folha': k + 1, 'n': len(lote), 'categorias': cats,
                       'de': lote[0]['prefixo'] + lote[0]['id'], 'ate': lote[-1]['prefixo'] + lote[-1]['id']})
    (SAIDA / 'indice.json').write_text(json.dumps(indice, indent=1, ensure_ascii=False), encoding='utf-8')
    print(f'{len(itens)} ícones em {n} folhas de {por_folha} ({colunas}x{linhas})')
    for f in indice:
        print(f"  folha {f['folha']:02d}  {f['n']:2d}  {','.join(f['categorias']):14}  {f['de']} .. {f['ate']}")


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest='cmd', required=True)
    p = sub.add_parser('planejar')
    p.add_argument('--por-folha', type=int, default=24, choices=sorted(GRADES))
    q = sub.add_parser('prompt')
    q.add_argument('folha', type=int)
    a = ap.parse_args()
    if a.cmd == 'planejar':
        planejar(a.por_folha)
    else:
        print((SAIDA / f'folha-{a.folha:02d}' / 'prompt.txt').read_text(encoding='utf-8'))


if __name__ == '__main__':
    main()
