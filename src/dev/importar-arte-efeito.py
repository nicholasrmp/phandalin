# -*- coding: utf-8 -*-
"""
Baixa a arte de um efeito visto de cima, gerada no OpenArt sobre fundo preto, e a deixa pronta para o jogo em `public/efeitos/<nome>.webp`.

POR QUE NÃO É O `importar-efeitos.py`: aquele reduz uma folha animada à paleta de 14 cores, em pixels. Estes são desenho inteiro, com
transparência, numa imagem só, e o movimento vem do código (`fx.js arte`): nascer, girar, pulsar e sumir. Assim o efeito pode ter o tamanho
real da magia em casas, o que a folha de 84 px não tinha como dar.

O FUNDO PRETO VIRA ALFA. O alfa de cada pixel é o canal mais forte dele, e a cor é dividida por esse alfa. É o que deixa fogo, luz e fumaça
translúcidos sobre o mapa sem halo escuro em volta.

    python src/dev/importar-arte-efeito.py <nome> <url ou arquivo> [--lado 512] [--contorno] [--fundo-branco]

`--contorno` recorta o que está fora do círculo inscrito, para o quadrado da imagem nunca aparecer. As originais ficam em `_referencias/efeitos/arte/`.
"""
import io
import math
import sys
import urllib.request
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parents[2]
ORIG = RAIZ / '_referencias' / 'efeitos' / 'arte'
SAIDA = RAIZ / 'public' / 'efeitos'
PISO = 14   # abaixo disto é o preto que o gerador não deixou perfeito


def ler(origem, nome):
    ORIG.mkdir(parents=True, exist_ok=True)
    guardada = ORIG / f'{nome}.png'
    if origem.startswith('http'):
        req = urllib.request.Request(origem, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=60) as r:
            guardada.write_bytes(r.read())
    else:
        guardada = Path(origem)
    return Image.open(guardada).convert('RGB')


def preto_para_alfa(im):
    im = im.convert('RGB')
    w, h = im.size
    saida = Image.new('RGBA', (w, h))
    fonte = im.load()
    alvo = saida.load()
    for y in range(h):
        for x in range(w):
            r, g, b = fonte[x, y]
            m = max(r, g, b)
            if m <= PISO:
                alvo[x, y] = (0, 0, 0, 0)
                continue
            a = min(255, round((m - PISO) * 255 / (255 - PISO)))
            alvo[x, y] = (min(255, r * 255 // m), min(255, g * 255 // m), min(255, b * 255 // m), a)
    return saida


def branco_para_alfa(im):
    """O contrário, para quando o gerador insiste em fundo branco: fica o que é escuro, e é o que se quer em tentáculo e em sombra."""
    im = im.convert('RGB')
    w, h = im.size
    saida = Image.new('RGBA', (w, h))
    fonte = im.load()
    alvo = saida.load()
    for y in range(h):
        for x in range(w):
            r, g, b = fonte[x, y]
            m = 255 - min(r, g, b)
            if m <= PISO:
                alvo[x, y] = (0, 0, 0, 0)
                continue
            a = min(255, round((m - PISO) * 255 / (255 - PISO)))
            cor = [max(0, min(255, 255 - (255 - c) * 255 // m)) for c in (r, g, b)]
            alvo[x, y] = (cor[0], cor[1], cor[2], a)
    return saida


def recortar_circulo(im):
    """Some até a borda do círculo inscrito, com uma faixa suave."""
    w, h = im.size
    px = im.load()
    cx, cy, raio = w / 2, h / 2, min(w, h) / 2
    for y in range(h):
        for x in range(w):
            d = math.hypot(x + 0.5 - cx, y + 0.5 - cy) / raio
            if d >= 0.9:
                r, g, b, a = px[x, y]
                px[x, y] = (r, g, b, round(a * max(0, (1 - d) / 0.1)))
    return im


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    nome, origem = args[0], args[1]
    lado = int(sys.argv[sys.argv.index('--lado') + 1]) if '--lado' in sys.argv else 512
    if '--lado' in sys.argv:
        args = [a for a in args if a != str(lado)]
    fonte = ler(origem, nome)
    im = branco_para_alfa(fonte) if '--fundo-branco' in sys.argv else preto_para_alfa(fonte)
    if '--contorno' in sys.argv:
        im = recortar_circulo(im)
    im = im.resize((lado, lado), Image.LANCZOS)
    SAIDA.mkdir(parents=True, exist_ok=True)
    destino = SAIDA / f'{nome}.webp'
    im.save(destino, 'WEBP', quality=82, method=6)
    a = im.getchannel('A').getdata()
    cobre = sum(1 for v in a if v > 25) / len(a)
    print(f'{nome}: {destino.stat().st_size // 1024} KB, cobre {cobre:.0%} do quadrado')


if __name__ == '__main__':
    main()
