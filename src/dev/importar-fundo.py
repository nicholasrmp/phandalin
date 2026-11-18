"""Traz uma arte GERADA (nossa, do OpenArt) para fundo de mapa, no tamanho da grade.

    python src/dev/importar-fundo.py <url ou arquivo> <saida.webp> <casas_largura> [casas_altura]

Grava em `public/mapas/<saida>` com 100 px por casa, que é a `escala` que os outros fundos usam. A arte de terceiro
(FA, Wizards) não passa por aqui: ela fica em `public/mapas/fa/`, fora do repositório. Esta é a que entra.
"""
import io
import sys
import urllib.request
from pathlib import Path

from PIL import Image

PX_POR_CASA = 100


def ler(origem):
    if origem.startswith('http'):
        req = urllib.request.Request(origem, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=60) as r:
            return Image.open(io.BytesIO(r.read()))
    return Image.open(origem)


def main():
    if len(sys.argv) < 4:
        print(__doc__)
        sys.exit(1)
    origem, saida, cw = sys.argv[1], sys.argv[2], int(sys.argv[3])
    ch = int(sys.argv[4]) if len(sys.argv) > 4 else cw
    img = ler(origem).convert('RGB')
    alvo = (cw * PX_POR_CASA, ch * PX_POR_CASA)
    # corta ao centro na proporção da grade antes de redimensionar, para não esticar a arte
    w, h = img.size
    pa = alvo[0] / alvo[1]
    if w / h > pa:
        nw = round(h * pa)
        img = img.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    elif w / h < pa:
        nh = round(w / pa)
        img = img.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    img = img.resize(alvo, Image.LANCZOS)
    destino = Path(__file__).resolve().parents[2] / 'public' / 'mapas' / saida
    destino.parent.mkdir(parents=True, exist_ok=True)
    img.save(destino, 'WEBP', quality=82, method=6)
    print(f'{destino} {alvo[0]}x{alvo[1]} ({destino.stat().st_size // 1024} KB)')


if __name__ == '__main__':
    main()
