# -*- coding: utf-8 -*-
"""
Monta o atlas do chao a partir das levas do `tiles-pro` do PixelLab.

Uma fileira por superficie, dezesseis ladrilhos de 64 x 32 por fileira, cada
um recortado pela particao exata de `losango.py`. O tabuleiro desenha terreno
na resolucao logica e o losango do PixelLab ja tem o tamanho do motor, entao
aqui nao ha ampliacao: o ladrilho entra 1:1.

A ANCORA E A BASE, NAO O TOPO.
O topo da caixa do desenho nao serve: folhas de capim passam um ou dois
pixels acima da aresta de cima, e ancorar por elas desloca o recorte inteiro
para cima. A base do losango e a ultima fileira acesa, e essa nao tem nada
pendurado embaixo.
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
from losango import TW, TH, recortar_topo, furos, remendo  # noqa: E402

AQUI = Path(__file__).resolve().parents[2]
LEVAS = AQUI / '_referencias' / 'pixellab' / 'ladrilhos-pro'
SAIDA = AQUI / 'src' / 'art' / 'folhas'

# A leva de cada superficie. Sao as duas geradas com `tile_view_angle: 30`,
# que e o angulo que da o losango 2:1; as levas anteriores tinham a projecao
# errada e ficam de fora.
FILEIRAS = [
    ('grama', '14578cc6-1049-42ef-81db-d6939425af88'),
    ('estrada', '5f9237e2-b95e-4436-84c5-b20bcdb115e6'),
]


def _lum(c):
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


def _na_aresta(x, y):
    """Pixel da particao com algum vizinho fora dela: a aresta do losango."""
    from losango import no_losango
    return no_losango(x, y) and not all(
        no_losango(x + dx, y + dy)
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
        if 0 <= x + dx < TW and 0 <= y + dy < TH)


def tom_e_aresta(t):
    """Tom medio do miolo, e quanto a aresta e mais escura que ele."""
    from losango import no_losango
    px = t.load()
    miolo = [_lum(px[x, y]) for y in range(TH) for x in range(TW)
             if no_losango(x, y) and not _na_aresta(x, y)]
    aresta = [_lum(px[x, y]) for y in range(TH) for x in range(TW) if _na_aresta(x, y)]
    m = sum(miolo) / len(miolo)
    return m, sum(aresta) / len(aresta) - m


def limpar_aresta(t):
    """
    Tira o escurecimento da borda: cada pixel da aresta copia o vizinho de dentro.

    POR QUE. Mesmo pedindo "sem borda", o PixelLab escurece a aresta do losango
    em 2 a 8 de luminancia. Na grama, que e ruidosa, isso se perde; na
    estrada, que e lisa, vira uma treliça. E a grade TEM de existir -- o mapa
    de referencia tem grade --, mas ela deve vir do `drawTile`, que a desenha
    igual em toda superficie e com opacidade controlada, e nao meio assada na
    arte, mais forte num chao que no outro.

    Copiar o vizinho de dentro nao inventa cor: usa a paleta do proprio
    ladrilho, e o pixel art continua pixel art.
    """
    from losango import no_losango
    out = t.copy()
    s, d = t.load(), out.load()
    cx, cy = (TW - 1) / 2, (TH - 1) / 2
    for y in range(TH):
        for x in range(TW):
            if not _na_aresta(x, y):
                continue
            sx = 1 if x < cx else -1
            sy = 1 if y < cy else -1
            for dx, dy in ((sx, 0), (0, sy), (sx, sy), (2 * sx, 0), (0, 2 * sy)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < TW and 0 <= ny < TH and no_losango(nx, ny) and not _na_aresta(nx, ny):
                    d[x, y] = s[nx, ny]
                    break
    return out


# O QUE DECIDE SE UMA VARIACAO ENTRA.
#
# Sorteadas por casa, variacoes que diferem no TOM DE BASE viram um xadrez: cada
# losango aparece porque e mais claro ou mais escuro que o vizinho. Foi o que a
# estrada fez -- amplitude de tom de 33,8, contra 9,5 da grama, puxada por
# quatro variacoes "ressecada" e "empoeirada" de +14 a +25. E aresta mais
# escura que o miolo desenha a grade.
#
# Os limites sao os que a grama ja cumpre inteira, e ela foi o que pareceu
# chao de verdade. Aplicados a todas as superficies, decidem por medida.
DESVIO_MAX = 6.0       # do tom da mediana
ARESTA_MIN = -8.0      # aresta pode escurecer ate isto


def main():
    atlas = Image.new('RGBA', (16 * TW, len(FILEIRAS) * TH), (0, 0, 0, 0))
    meta = {'tw': TW, 'th': TH, 'fileiras': {}}
    previa = []
    for linha, (nome, leva) in enumerate(FILEIRAS):
        arqs = sorted((LEVAS / leva).glob('tile_*.png'),
                      key=lambda p: int(p.stem.split('_')[1]))
        assert len(arqs) == 16, f'{nome}: esperava 16 ladrilhos, achei {len(arqs)}'
        candidatos = []
        for a in arqs:
            im = Image.open(a).convert('RGBA')
            base = im.getbbox()[3]
            candidatos.append(recortar_topo(im, 0, base - TH))
        medidas = [tom_e_aresta(t) for t in candidatos]
        mediana = sorted(m for m, _ in medidas)[len(medidas) // 2]
        topos = []
        fora = []
        for i, (t, (m, a)) in enumerate(zip(candidatos, medidas)):
            if abs(m - mediana) <= DESVIO_MAX and a >= ARESTA_MIN:
                t = limpar_aresta(t)
                atlas.alpha_composite(t, (len(topos) * TW, linha * TH))
                topos.append(t)
            else:
                fora.append(f'{i} (tom {m - mediana:+.1f}, aresta {a:+.1f})')
        tons = [tom_e_aresta(t)[0] for t in topos]
        arestas = [tom_e_aresta(t)[1] for t in topos]
        print(f'{nome:8} entram {len(topos)}/16, amplitude de tom {max(tons) - min(tons):.1f}, '
              f'aresta-miolo depois da limpeza {min(arestas):+.1f} a {max(arestas):+.1f}'
              + (f' | fora: {", ".join(fora)}' if fora else ''))
        buracos = [furos(t) for t in topos]
        print(f'{"":8} furos por ladrilho: {buracos}')
        # Um ou dois pixels sem chao num losango de 1.024 nao aparecem; mais
        # que isso e ladrilho com a projecao errada e nao pode entrar.
        assert max(buracos) <= 4, f'{nome}: ladrilho com furo demais'
        meta['fileiras'][nome] = {'y': linha * TH, 'n': len(topos)}
        h = lambda gx, gy, n=len(topos): (gx * 73856093 ^ gy * 19349663) % n
        previa.append((nome, remendo(topos, n=6, escolher=h)))

    SAIDA.mkdir(parents=True, exist_ok=True)
    atlas.save(SAIDA / 'chao.png', optimize=True)
    (SAIDA / 'chao.json').write_text(json.dumps(meta, indent=2), encoding='utf-8')
    print(f'{SAIDA / "chao.png"}  {atlas.size}  {(SAIDA / "chao.png").stat().st_size / 1024:.0f} KB')

    Z = 2
    w = sum(r.width * Z + 10 for _, r in previa) + 10
    out = Image.new('RGB', (w, previa[0][1].height * Z + 24), (27, 22, 16))
    d = ImageDraw.Draw(out)
    x = 10
    for nome, r in previa:
        g = r.resize((r.width * Z, r.height * Z), Image.NEAREST)
        out.paste(g, (x, 22))
        d.text((x, 4), f'{nome}: {meta["fileiras"][nome]["n"]} variacoes sorteadas', fill=(201, 162, 39))
        x += r.width * Z + 10
    out.save(LEVAS / 'previa-chao.png')


if __name__ == '__main__':
    main()
