# -*- coding: utf-8 -*-
"""
Junta os ícones aprovados de todas as folhas em módulos de grade, um por
categoria, e os escreve em src/art/.

    python src/dev/icones_consolidar.py

Fontes, em ordem — a posterior vence a anterior, que é como uma folha de
refação substitui o ícone reprovado:
  1. _referencias/icones/magias/embarcado/          (as 15 primeiras magias)
  2. _referencias/icones/lote/folha-NN/embarcado/   (o catálogo inteiro)
     _referencias/icones/lote/novos-NN/embarcado/   (o que entrou depois:
                                                      emblemas de classe etc.)
  3. _referencias/icones/lote/refazer-NN/embarcado/ (as refações)

Só entra o que a revisão não mandou refazer: cada pasta de lote pode ter um
`veredito.json` (escrito a partir do revisor-chefe) com a lista `refazer`, e
esses ficam de fora até uma refação trazê-los aprovados.

Saem `src/art/icones-magias.js`, `icones-acoes.js`, `icones-racas.js` e
`icones-classes.js`. A conversão PNG -> grade é exata: os PNG já estão
presos às 14 cores de `P`.
"""
import json
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parents[2]
ICONES = RAIZ / '_referencias' / 'icones'
PALETA = ['#e8eef5', '#aab6c6', '#6b7686', '#b0875a', '#8a6236', '#e8c35a', '#a6822c',
          '#e0553c', '#6ea8e8', '#e2b183', '#f4f0e4', '#6fc07a', '#a579d8', '#2a2430']
CHAVES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e']
CHAVE = {tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)): k for h, k in zip(PALETA, CHAVES)}

MODULOS = {
    'magia-': ('icones-magias.js', 'ICONES_MAGIAS', 'magias (Livro do Jogador; as fora do SRD vêm marcadas phb no catálogo)'),
    'acao-': ('icones-acoes.js', 'ICONES_ACOES', 'ações de combate'),
    'raca-': ('icones-racas.js', 'ICONES_RACAS', 'traços de raça do SRD 5.1'),
    'classe-': ('icones-classes.js', 'ICONES_CLASSES', 'recursos de classe do SRD 5.1'),
}


def grade(png):
    im = Image.open(png).convert('RGBA')
    assert im.size == (32, 32), png
    linhas = []
    for y in range(32):
        l = ''
        for x in range(32):
            r, g, b, a = im.getpixel((x, y))
            l += '.' if a == 0 else CHAVE[(r, g, b)]
        linhas.append(l)
    return linhas


def recusados(pasta):
    v = pasta / 'veredito.json'
    if not v.exists():
        return set()
    return set(json.loads(v.read_text(encoding='utf-8')).get('refazer', []))


def main():
    fontes = [ICONES / 'magias']
    fontes += sorted(ICONES.glob('lote/folha-*'))
    fontes += sorted(ICONES.glob('lote/novos-*'))
    fontes += sorted(ICONES.glob('lote/refazer-*'))
    escolhidos = {}
    for pasta in fontes:
        emb = pasta / 'embarcado'
        if not emb.exists():
            continue
        fora = recusados(pasta)
        for png in sorted(emb.glob('*.png')):
            chave = png.stem if '-' in png.stem else f'magia-{png.stem}'
            if chave in fora:
                continue
            escolhidos[chave] = (png, pasta.name)

    for prefixo, (arquivo, export, rotulo) in MODULOS.items():
        itens = sorted((k, v) for k, v in escolhidos.items() if k.startswith(prefixo))
        blocos = []
        for k, (png, origem) in itens:
            corpo = '\n'.join(f"    '{l}'," for l in grade(png))
            blocos.append(f"  '{k}': [\n{corpo}\n  ],")
        cab = (f'// Ícones de {rotulo}: 32x32, na paleta `P` de icons.js.\n'
               f'// GERADO por src/dev/icones_consolidar.py a partir das folhas do OpenArt\n'
               f'// revisadas pelos agentes revisor-icone-* e revisor-icones. Para corrigir um\n'
               f'// ícone à mão, edite a grade aqui; para refazer, gere uma folha de refação.\n')
        (RAIZ / 'src' / 'art' / arquivo).write_text(
            cab + f'\nexport const {export} = {{\n' + '\n'.join(blocos) + '\n};\n',
            encoding='utf-8', newline='\n')
        print(f'{arquivo:20} {len(itens):4} ícones')


if __name__ == '__main__':
    main()
