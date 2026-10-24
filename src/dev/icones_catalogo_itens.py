# -*- coding: utf-8 -*-
"""
CATÁLOGO DE ÍCONES — ITENS (um ícone por item do catálogo de src/rules/items).

Armas, armaduras, escudo, munição, equipamento de aventura, ferramentas,
montarias e veículos, itens mágicos e os itens da campanha. A chave do ícone é
`item-<id>`, o mesmo id do catálogo; `iconeDeItem` (src/view/ficha.js) procura
essa chave antes do ícone genérico antigo.

Os conceitos ficam em `icones_catalogo_itens.txt`, uma linha por item:
    id | categoria | conceito
`conceito` é o que vai para o gerador, em inglês: UM objeto, forma grande,
sem texto, com cores da paleta; irmãos (poções, anéis, +1/+2/+3) se separam
por forma ou cor, nunca por número escrito.
"""
from pathlib import Path

CONCEITOS = Path(__file__).with_name('icones_catalogo_itens.txt')


def entradas():
    for linha in CONCEITOS.read_text(encoding='utf-8').strip().splitlines():
        id_, categoria, conceito = [x.strip() for x in linha.split('|', 2)]
        yield {'id': id_, 'categoria': categoria, 'prefixo': 'item-', 'conceito': conceito}
