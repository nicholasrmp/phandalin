# -*- coding: utf-8 -*-
"""
Transforma um vídeo de efeito, gerado no OpenArt sobre fundo preto, numa folha de quadros com transparência: `public/efeitos/anim/<nome>.webp`.

É o que separa uma magia que MEXE de uma imagem que gira: o fogo revolve e o tentáculo se contorce de verdade, quadro a quadro.

    python src/dev/importar-video-efeito.py <nome> <url ou arquivo> [--quadros 16] [--lado 256] [--de 0] [--ate 1] [--contorno]

O preto vira alfa pela mesma conta de `importar-arte-efeito.py`. O vídeo é cortado no quadrado do meio, e `--de` e `--ate` (fração da duração)
escolhem o trecho. A folha tem N colunas por N linhas, e o script imprime a linha pronta para a tabela `ANIMADAS` de `view/fx.js`.
O vídeo original fica em `_referencias/efeitos/video/`.
"""
import math
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image

RAIZ = Path(__file__).resolve().parents[2]
ORIG = RAIZ / '_referencias' / 'efeitos' / 'video'
SAIDA = RAIZ / 'public' / 'efeitos' / 'anim'
PISO = 22   # o vídeo comprime o preto pior que a imagem: abaixo disto é chiado de compressão


def opcao(nome, padrao, tipo=int):
    return tipo(sys.argv[sys.argv.index(nome) + 1]) if nome in sys.argv else padrao


def obter(origem, nome):
    ORIG.mkdir(parents=True, exist_ok=True)
    if not origem.startswith('http'):
        return Path(origem)
    guardado = ORIG / f'{nome}.mp4'
    req = urllib.request.Request(origem, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=120) as r:
        guardado.write_bytes(r.read())
    return guardado


def duracao(video):
    saida = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(video)], capture_output=True, text=True, check=True)
    return float(saida.stdout.strip())


def quadros_do_video(video, n, lado, de, ate):
    total = duracao(video)
    inicio, fim = total * de, total * ate
    filtro = f"crop='min(iw,ih)':'min(iw,ih)',fps={n / (fim - inicio):.5f},scale={lado}:{lado}:flags=lanczos"
    with tempfile.TemporaryDirectory() as pasta:
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{inicio:.3f}', '-to', f'{fim:.3f}', '-i', str(video), '-vf', filtro, str(Path(pasta) / 'q%03d.png')], check=True)
        return [Image.open(p).convert('RGB').copy() for p in sorted(Path(pasta).glob('q*.png'))][:n]


def preto_para_alfa(im, contorno):
    rgb = np.asarray(im, dtype=np.float32)
    m = rgb.max(axis=2)
    alfa = np.clip((m - PISO) * 255 / (255 - PISO), 0, 255)
    cor = np.where(m[..., None] > 0, rgb * 255 / np.maximum(m[..., None], 1), 0)
    if contorno:
        h, w = m.shape
        yy, xx = np.mgrid[0:h, 0:w]
        d = np.hypot(xx + 0.5 - w / 2, yy + 0.5 - h / 2) / (min(w, h) / 2)
        alfa = alfa * np.clip((1 - d) / 0.1, 0, 1)
    return Image.fromarray(np.dstack([np.clip(cor, 0, 255), alfa]).astype(np.uint8), 'RGBA')


def main():
    args = [a for i, a in enumerate(sys.argv[1:], 1) if not a.startswith('--') and not sys.argv[i - 1].startswith('--')]
    nome, origem = args[0], args[1]
    n = opcao('--quadros', 16)
    lado = opcao('--lado', 256)
    quadros = quadros_do_video(obter(origem, nome), n, lado, opcao('--de', 0.0, float), opcao('--ate', 1.0, float))
    colunas = math.ceil(math.sqrt(len(quadros)))
    linhas = math.ceil(len(quadros) / colunas)
    folha = Image.new('RGBA', (colunas * lado, linhas * lado))
    for i, q in enumerate(quadros):
        folha.paste(preto_para_alfa(q, '--contorno' in sys.argv), ((i % colunas) * lado, (i // colunas) * lado))
    SAIDA.mkdir(parents=True, exist_ok=True)
    destino = SAIDA / f'{nome}.webp'
    folha.save(destino, 'WEBP', quality=72, method=6, alpha_quality=80)
    print(f"{nome}: {len(quadros)} quadros de {lado}px, {destino.stat().st_size // 1024} KB")
    print(f"  '{nome}': {{ n: {len(quadros)}, colunas: {colunas} }},")


if __name__ == '__main__':
    main()
