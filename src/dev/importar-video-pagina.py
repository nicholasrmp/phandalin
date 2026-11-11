# -*- coding: utf-8 -*-
"""
Corta um vídeo de PÁGINA — várias magias lado a lado num quadro só — em uma folha de quadros por magia, em `public/efeitos/anim/`.

POR QUE EXISTE: a animação é a parte cara. Uma página de três cones custa UM vídeo em vez de três, e medido aqui as células animam
cada uma no seu lugar sem a câmera andar. O preço por magia cai de 30 para 14 créditos (um vídeo de 720p dividido por três).

    python src/dev/importar-video-pagina.py <url ou arquivo> <nome1> <nome2> ... [--quadros 12] [--lado 192] [--quadrado]

`--quadrado` estica cada coluna para um quadrado: é o que um CONE pede, porque no cone do livro a boca é tão larga quanto ele é
comprido, e a coluna de uma página 21:9 sai mais alta que larga. Sem ele, a coluna é cortada no quadrado do meio.
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
PISO = 22   # o vídeo comprime o preto pior que a imagem


def opcao(nome, padrao, tipo=int):
    return tipo(sys.argv[sys.argv.index(nome) + 1]) if nome in sys.argv else padrao


def obter(origem):
    if not origem.startswith('http'):
        return Path(origem)
    ORIG.mkdir(parents=True, exist_ok=True)
    destino = ORIG / 'pagina.mp4'
    req = urllib.request.Request(origem, headers={'User-Agent': 'Mozilla/5.0'})
    destino.write_bytes(urllib.request.urlopen(req, timeout=180).read())
    return destino


def quadros_do_video(video, n):
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(video)],
                               capture_output=True, text=True, check=True).stdout.strip())
    with tempfile.TemporaryDirectory() as pasta:
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(video), '-vf', f'fps={n / dur:.5f}',
                        str(Path(pasta) / 'q%03d.png')], check=True)
        return [Image.open(p).convert('RGB').copy() for p in sorted(Path(pasta).glob('q*.png'))][:n]


def preto_para_alfa(im):
    rgb = np.asarray(im.convert('RGB'), dtype=np.float32)
    m = rgb.max(axis=2)
    alfa = np.clip((m - PISO) * 255 / (255 - PISO), 0, 255)
    cor = np.where(m[..., None] > 0, rgb * 255 / np.maximum(m[..., None], 1), 0)
    return Image.fromarray(np.dstack([np.clip(cor, 0, 255), alfa]).astype(np.uint8), 'RGBA')


def main():
    args = [a for i, a in enumerate(sys.argv[1:], 1) if not a.startswith('--') and not sys.argv[i - 1].startswith('--')]
    origem, nomes = args[0], args[1:]
    if not nomes:
        sys.exit('diga o nome de cada magia da página, da esquerda para a direita')
    n = opcao('--quadros', 12)
    lado = opcao('--lado', 192)
    quadrado = '--quadrado' in sys.argv
    quadros = quadros_do_video(obter(origem), n)
    w, h = quadros[0].size
    t = w // len(nomes)
    for i, nome in enumerate(nomes):
        corte = []
        for q in quadros:
            col = q.crop((i * t, 0, (i + 1) * t, h))
            if not quadrado:
                m = min(col.size)
                col = col.crop(((col.width - m) // 2, (col.height - m) // 2, (col.width + m) // 2, (col.height + m) // 2))
            corte.append(preto_para_alfa(col.resize((lado, lado), Image.LANCZOS)))
        colunas = math.ceil(math.sqrt(len(corte)))
        linhas = math.ceil(len(corte) / colunas)
        folha = Image.new('RGBA', (colunas * lado, linhas * lado))
        for j, q in enumerate(corte):
            folha.paste(q, ((j % colunas) * lado, (j // colunas) * lado))
        SAIDA.mkdir(parents=True, exist_ok=True)
        destino = SAIDA / f'{nome}.webp'
        folha.save(destino, 'WEBP', quality=72, method=6, alpha_quality=80)
        print(f'{nome}: {len(corte)} quadros de {lado}px, {destino.stat().st_size // 1024} KB')
        print(f"  '{nome}': {{ n: {len(corte)}, colunas: {colunas} }},")


if __name__ == '__main__':
    main()
