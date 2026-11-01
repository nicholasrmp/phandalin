# -*- coding: utf-8 -*-
"""
Acrescenta ao atlas das FACES (`src/art/folhas/faces.png` e `.json`) as paredes da CASA DA MORTE (Maldição de Strahd), cada uma em TRÊS
PEÇAS, porque a parede alta tem três níveis e cada nível é uma peça diferente:

    material         peça    onde fica                                  o que mostra
    painelCarvalho   topo    o nível de cima                            a moldura de mogno sobre o papel de parede bordô
    painelCarvalho   (meio)  os níveis do meio                          só o papel de parede, contínuo
    painelCarvalho   base    o nível de baixo                           o lambri e o rodapé
    madeiraVelha     topo / meio / base                                 o mesmo, no reboco velho, rachado e manchado

(O nome `painelCarvalho` ficou do primeiro desenho, de tábuas, que foi recusado: o material é papel de parede e lambri.)

Os blocos vêm de DOIS lotes do PixelLab (`ladrilhos-pro.py --conjunto casaDaMorteParedesA|B --profundidade 0.6875 --angulo 30`), um por
material, no mesmo tom; cada bloco dá uma faixa de um nível de cada face (as funções são as de `montar-faces.py`). No atlas, a chave
`painelCarvalho:topo` e `painelCarvalho:base` guardam as outras duas peças; `art/faces.js` escolhe pela altura do nível.

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
LOTES = AQUI / '_referencias' / 'pixellab' / 'ladrilhos-pro'
A = LOTES / 'e587d205-9ee6-451a-9dd6-e897b18d3485'     # papel de parede bordô e mogno (andares de baixo)
B = LOTES / 'be6d91f3-f9ef-4b9c-970d-a643b7086c0c'     # reboco velho (3º andar e sótão)

# Escolhidos olhando a folha de contato de cada lote. Fora: os de papel com treliça dourada forte (5, no lote A: briga com o resto), o
# marrom liso (8) e os de topo de bloco escuro; no lote B, os de fios soltos (5, 8).
MATERIAIS = {
    'painelCarvalho': {'lote': A, 'topo': [0, 1, 2, 3, 4], 'meio': [6, 7, 9, 10], 'base': [11, 12, 13, 14, 15]},
    'madeiraVelha': {'lote': B, 'topo': [0, 1, 2, 3, 4], 'meio': [6, 7, 9, 10], 'base': [11, 12, 13, 14, 15]},
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
    for chave in list(meta['faces']):
        if chave.split(':')[0] in MATERIAIS:
            meta['faces'].pop(chave)
    for mat in MATERIAIS:
        meta['topos'].pop(mat, None)
    y = img.height
    meta['_casa'] = {'y0': y}
    fh, tw = meta['fh'], meta['tw']
    linhas = []
    for mat, cfg in MATERIAIS.items():
        for papel in ('meio', 'topo', 'base'):
            vs = []
            for n in cfg[papel]:
                arq = cfg['lote'] / f'tile_{n}.png'
                if not arq.exists():
                    print(f'  ({mat} {papel} {n}: não existe, pulando)')
                    continue
                im = Image.open(arq).convert('RGBA')
                bb = im.getbbox()
                ox, oy = bb[0], bb[1]
                vs.append((mf.faixa(im, ox, oy, 'esq'), mf.faixa(im, ox, oy, 'dir'), mf.tapar(mf.recortar_topo(im, ox, oy))))
            if vs:
                linhas.append((mat if papel == 'meio' else f'{mat}:{papel}', mf.emparelhar(vs, f'{mat}:{papel}')))
    novo = Image.new('RGBA', (max(img.width, max(len(v) for _, v in linhas) * tw), y + len(linhas) * fh), (0, 0, 0, 0))
    novo.alpha_composite(img, (0, 0))
    for chave, vs in linhas:
        for i, (esq, dir_, _) in enumerate(vs):
            novo.alpha_composite(esq, (i * tw, y))
            novo.alpha_composite(dir_, (i * tw + meta['fw'], y))
        meta['faces'][chave] = {'y': y, 'n': len(vs)}
        y += fh
    novo.save(FOLHAS / 'faces.png', optimize=True)
    (FOLHAS / 'faces.json').write_text(json.dumps(meta, indent=1), encoding='utf-8')
    print('faces da casa:', {k: len(v) for k, v in linhas}, novo.size)


if __name__ == '__main__':
    main()
    # A mobília e as portas da casa vão para o atlas do cenário, que a taverna também corta: refaz sozinho, sem gastar geração.
    import subprocess
    import sys
    subprocess.run([sys.executable, '-P', str(Path(__file__).with_name('acrescentar-casa-objetos.py'))], check=True)
