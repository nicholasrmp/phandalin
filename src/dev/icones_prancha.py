# -*- coding: utf-8 -*-
"""
Converte uma folha gerada e monta o que os revisores olham.

    python src/dev/icones_prancha.py <pasta-da-folha>

A pasta precisa de `folha.png` e `especificacao.json` (escritos por
`icones_lote.py`). Saem, na mesma pasta:
- `icones.js`     — as grades, no formato de src/art/icons.js;
- `embarcado/`    — cada ícone 32x32 em PNG;
- `revisao.png`   — cada ícone ampliado 4x com o nome, para achar a CAUSA;
- `real.png`      — tamanho real, sobre o fundo do HUD e sobre o pergaminho
                    da ficha, para julgar se LÊ;
- `medidas.json`  — ocupação, pixels órfãos, fração escura, célula vazia.

As medidas são as que decidiram a escolha do OpenArt contra o PixelLab:
ocupação perto de 55% e salpicado abaixo de ~18% leem; abaixo de ~25% de
ocupação o ícone some.
"""
import json
import subprocess
import sys
from pathlib import Path
from PIL import Image, ImageDraw

AQUI = Path(__file__).resolve().parent
HUD = (36, 30, 24)
PERGAMINHO = (214, 196, 155)


def medir(im):
    px = im.load()
    W, H = im.size
    opacos = orf = escuros = 0
    for y in range(H):
        for x in range(W):
            c = px[x, y]
            if c[3] == 0:
                continue
            opacos += 1
            lum = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]
            escuros += lum < 60
            viz = [px[a, b] for a, b in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1))
                   if 0 <= a < W and 0 <= b < H]
            orf += not any(v == c for v in viz)
    return {'ocupacao': round(opacos / (W * H), 3),
            'orfaos': round(orf / max(1, opacos), 3),
            'escuro': round(escuros / max(1, opacos), 3)}


def main():
    pasta = Path(sys.argv[1])
    esp = json.loads((pasta / 'especificacao.json').read_text(encoding='utf-8'))
    col, lin = esp['colunas'], esp['linhas']
    r = subprocess.run([sys.executable, str(AQUI / 'importar-icones.py'), str(pasta),
                        '--colunas', str(col), '--linhas', str(lin),
                        '--saida', str(pasta / 'icones.js'), '--export', 'ICONES_LOTE', '--prefixo', ''],
                       capture_output=True, text=True, encoding='utf-8')
    print(r.stdout.strip().splitlines()[0] if r.stdout else r.stderr)
    for l in r.stdout.splitlines():
        if 'AVISO' in l:
            print(l)

    # O terceiro campo, quando existe, são as opções de conversão (`somente`).
    nomes = [it[0] for it in esp['icones']]
    medidas = {}
    Z, COLS = 4, 6
    cel = 32 * Z + 16
    rev = Image.new('RGB', (COLS * cel + 16, ((len(nomes) + COLS - 1) // COLS) * (32 * Z + 28) + 10), HUD)
    dr = ImageDraw.Draw(rev)
    real = Image.new('RGB', (len(nomes) * 40 + 20, 100), HUD)
    real.paste(PERGAMINHO, (0, 50, real.width, 100))
    for i, n in enumerate(nomes):
        f = pasta / 'embarcado' / f'{n}.png'
        x, y = 12 + (i % COLS) * cel, 20 + (i // COLS) * (32 * Z + 28)
        dr.text((x, y - 15), n.split('-', 1)[-1][:22], fill=(201, 162, 39))
        if not f.exists():
            medidas[n] = {'vazio': True}
            dr.text((x + 30, y + 50), 'VAZIO', fill=(224, 85, 60))
            continue
        im = Image.open(f).convert('RGBA')
        medidas[n] = medir(im)
        v = im.resize((32 * Z, 32 * Z), Image.NEAREST)
        rev.paste(v, (x, y), v)
        real.paste(im, (12 + i * 40, 9), im)
        real.paste(im, (12 + i * 40, 59), im)
    rev.save(pasta / 'revisao.png')
    real.save(pasta / 'real.png')
    (pasta / 'medidas.json').write_text(json.dumps(medidas, indent=1), encoding='utf-8')
    ok = [m for m in medidas.values() if not m.get('vazio')]
    if ok:
        med = lambda k: sum(m[k] for m in ok) / len(ok)
        print(f'{len(ok)}/{len(nomes)} icones | ocupacao {med("ocupacao"):.1%} | orfaos {med("orfaos"):.1%} '
              f'| escuro {med("escuro"):.1%} | vazios {len(nomes) - len(ok)}')


if __name__ == '__main__':
    main()
