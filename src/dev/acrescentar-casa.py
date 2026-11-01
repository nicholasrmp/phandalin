# -*- coding: utf-8 -*-
"""
Acrescenta ao atlas das FACES (`src/art/folhas/faces.png` e `.json`) as paredes da CASA DA MORTE (Maldição de Strahd): o painel de
carvalho polido dos andares de baixo (`painelCarvalho`) e a madeira velha e empoeirada do 3º andar e do sótão (`madeiraVelha`).

Os blocos vêm de UM lote do PixelLab (`ladrilhos-pro.py --conjunto casaDaMorteParedes --profundidade 0.6875 --angulo 30`), no mesmo tom.
Cada bloco dá uma faixa de um nível da face esquerda, da direita e o topo (as funções são as de `montar-faces.py`).

As linhas entram DEPOIS das da taverna (`acrescentar-taverna.py`), que corta o atlas no marcador dela: por isso ela chama este script no
fim. Rodar de novo é seguro: ele corta do marcador `_casa` e refaz. Sem gerar nada.

    python src/dev/acrescentar-casa.py
"""
import importlib.util
import json
from pathlib import Path

from PIL import Image

AQUI = Path(__file__).resolve().parents[2]
FOLHAS = AQUI / 'src' / 'art' / 'folhas'
LOTE = AQUI / '_referencias' / 'pixellab' / 'ladrilhos-pro' / '3f87a064-9acb-4934-8b41-dc331421382c'

# Escolhidos olhando a folha de contato do lote: o papel de parede bordô liso ou de padrão (0, 1, 3), sem os de borda inferior (6, 7: virava
# listra a cada nível), o laranja (2) e o manchado (4); e o reboco velho (9, 10, 11, 13, 14, 15), sem o de lascas na ponta (8) e o de oval (12).
# (O nome `painelCarvalho` ficou: é o material do atlas; o desenho agora é papel de parede.)
MATERIAIS = {
    'painelCarvalho': [0, 3, 1],
    'madeiraVelha': [9, 10, 11, 13, 14, 15],
}


def modulo(arquivo, apelido):
    spec = importlib.util.spec_from_file_location(apelido, Path(__file__).with_name(arquivo))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def main():
    mf = modulo('montar-faces.py', 'montar_faces')
    meta = json.loads((FOLHAS / 'faces.json').read_text(encoding='utf-8'))
    img = Image.open(FOLHAS / 'faces.png').convert('RGBA')
    y0c = meta.get('_casa', {}).get('y0')
    if y0c is not None and y0c <= img.height:
        img = img.crop((0, 0, img.width, y0c))
    for mat in MATERIAIS:
        meta['faces'].pop(mat, None)
        meta['topos'].pop(mat, None)
    y = img.height
    meta['_casa'] = {'y0': y}
    fh, th, tw = meta['fh'], meta['th'], meta['tw']
    linhas = []
    for mat, nomes in MATERIAIS.items():
        vs = []
        for n in nomes:
            arq = LOTE / f'tile_{n}.png'
            if not arq.exists():
                print(f'  ({n}: não existe, pulando)')
                continue
            im = Image.open(arq).convert('RGBA')
            bb = im.getbbox()
            ox, oy = bb[0], bb[1]
            vs.append((mf.faixa(im, ox, oy, 'esq'), mf.faixa(im, ox, oy, 'dir'), mf.tapar(mf.recortar_topo(im, ox, oy))))
        if vs:
            linhas.append((mat, mf.emparelhar(vs, mat)))
    novo = Image.new('RGBA', (max(img.width, max(len(v) for _, v in linhas) * tw), y + len(linhas) * (fh + th)), (0, 0, 0, 0))
    novo.alpha_composite(img, (0, 0))
    for mat, vs in linhas:
        for i, (esq, dir_, topo) in enumerate(vs):
            novo.alpha_composite(esq, (i * tw, y))
            novo.alpha_composite(dir_, (i * tw + meta['fw'], y))
            novo.alpha_composite(topo, (i * tw, y + fh))
        meta['faces'][mat] = {'y': y, 'n': len(vs)}
        meta['topos'][mat] = {'y': y + fh, 'n': len(vs)}
        y += fh + th
    novo.save(FOLHAS / 'faces.png', optimize=True)
    (FOLHAS / 'faces.json').write_text(json.dumps(meta, indent=1), encoding='utf-8')
    print('faces da casa:', {m: len(v) for m, v in linhas}, novo.size)


if __name__ == '__main__':
    main()
