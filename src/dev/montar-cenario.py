# -*- coding: utf-8 -*-
"""
Monta o atlas dos objetos de cenario a partir dos candidatos do PixelLab.

Cada objeto entra recortado na propria caixa e com uma ANCORA: o pixel do
desenho que cai no centro do losango da casa. E pela ancora que o tabuleiro
posiciona, nao pelo canto da imagem -- assim um objeto de qualquer tamanho
assenta no chao do mesmo jeito.

Como a ancora sai de cada tipo:
  tronco   a base do tronco: a fileira mais baixa do desenho e, nela, a
           mediana dos pixels acesos. Nao e o centro da caixa: uma arvore
           inclinada tem o tronco fora do centro, e ancorar pelo centro a
           deixaria pendurada ao lado da propria casa.
  base     objeto baixo e largo (arbusto, pedra): o centro da elipse da base,
           um quarto da altura acima do fundo.

A escolha dos quadros e uma decisao de arte, registrada aqui com o porque.
Nada e redimensionado: o tabuleiro desenha cenario 1:1.
"""
import json
from pathlib import Path

from PIL import Image

AQUI = Path(__file__).resolve().parents[2]
OBJ = AQUI / '_referencias' / 'pixellab' / 'objetos'
SAIDA = AQUI / 'src' / 'art' / 'folhas'

GRUPOS = {
    # Dos 16 candidatos: 0-5, 8 e 13 sao carvalhos de copa redonda e tronco
    # visivel, todos com a mesma luminancia mediana (51,8) -- nao fazem xadrez
    # quando sorteados. O 6 e massa densa e mais escura, para o miolo da mata.
    # Ficaram de fora 9 (retorcida), 11 (chorao), 12 (alamo), 14 (folha
    # espinhenta) e 15 (galho seco), que sao outras especies e quebrariam a
    # mata; 10, pequena demais; 7, de laterais retas, que le como sebe.
    'arvore': {
        'pasta': 'arvore/aabe3eab-4200-4cd4-9e6c-4c30b0963276',
        'quadros': {'borda': [0, 1, 2, 3, 4, 5, 8, 13], 'miolo': [6]},
        'ancora': 'tronco',
    },
    # As arvores altas da mata esparsa, 126-151 px: umas tres alturas de
    # personagem. De dois lotes de quatro. Fora: B1, quase preta (lum 22) --
    # vira buraco na mata --, e A2, estreita demais (80 px) para o quinconce,
    # onde cada copa precisa cobrir a casa vizinha.
    'arvore-alta': {
        'fontes': [('arvore-alta/9a197ca2-a5af-441f-85ae-f3f57e97da79', [0, 1, 3]),
                   ('arvore-alta-2/e3af68f5-b398-4ca7-80ce-4e96ac1719fb', [0, 2, 3])],
        'papel': 'todas',
        'ancora': 'tronco',
    },
    # Dos 16: 0, 3, 6, 8, 10, 11, 12 e 14 sao moitas de bolas redondas com a
    # mesma luminancia mediana (51,8). Fora: 1, claro demais (95); 2, chato,
    # le como pedra com musgo; 4, conifera; 5, 7 e 15, folhagem rala de outra
    # especie; 9, pequeno demais; 13, rasteiro demais para dar cobertura.
    'arbusto': {
        'pasta': 'arbusto/408d5c8d-1de7-4dc1-92f2-5dd5eac1790d',
        'quadros': {'todas': [0, 3, 6, 8, 10, 11, 12, 14]},
        'ancora': 'base',
    },
    # Dos 64: 0, 1, 12, 15, 32, 35, 43, 48 e 60 sao pedregulhos naturais com
    # volume -- a pedra do mapa e meia cobertura, precisa ler como algo atras
    # do que se agacha. Fora: degraus (36, 55, 63), lajes chatas (21, 22, 29,
    # 30, 33, 34, 41, 42, 51, 59), menires (38, 46), montes empilhados que
    # leem como feitos a mao (3, 7, 8, 20, 23, 28, 31, 53, 54, 61), as de
    # musgo escuro (5, 9, 10, 44, 45), cascalho (13, 16, 24) e lascas (11, 17,
    # 18, 25, 26, 49, 57).
    'pedra': {
        'pasta': 'pedra/aa8b067a-ea2a-488a-8a96-dd4470ca3c42',
        'quadros': {'todas': [0, 1, 12, 15, 32, 35, 43, 48, 60]},
        'ancora': 'base',
    },
}

DIRECOES = ['south', 'south-east', 'east', 'north-east',
            'north', 'north-west', 'west', 'south-west']

# Objetos com direcao: as oito vistas de `rotation_urls`, uma por papel, e o
# tabuleiro escolhe pela rotacao da camera. `ancora` aqui e o centro da
# pegada no chao: o centro da caixa em x e, em y, o fundo menos `meia_pegada`
# -- a roda da frente ou o corpo deitado tocam o chao na borda da FRENTE da
# pegada, que fica meia pegada abaixo do centro dela. Calibrado na medicao.
DIRIGIDOS = {
    'carroca': {'pasta': 'carroca/e391322f-b2a9-4b1c-a7ef-4c1b55116880', 'meia_pegada': 14},
    'cavalo': {'pasta': 'cavalo/2d4dd2f2-d929-454d-bf40-97ae971d184d', 'meia_pegada': 9,
               'recolor': ('tordilho', None)},
}

# O cavalo B e o mesmo desenho com a pelagem trocada, cor por cor exata: baio
# para tordilho. A sela usa as mesmas cores do pelo e fica cinza junto; o
# sangue (#4a1510) e o contorno ficam. Custa zero geracao e os dois nunca leem como copia, porque
# alem da pelagem eles cairam em sentidos opostos (o B usa as vistas opostas).
PELAGEM = {
    '#3e2a1b': '#4e4e52', '#45291a': '#5a5a5c', '#5e4029': '#7a7874',
    '#683d25': '#8e8b84', '#8a6a44': '#b4afa2',
}


def recolorir(im, mapa):
    alvo = {tuple(int(k[i:i + 2], 16) for i in (1, 3, 5)): tuple(int(v[i:i + 2], 16) for i in (1, 3, 5))
            for k, v in mapa.items()}
    out = im.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a and (r, g, b) in alvo:
                px[x, y] = alvo[(r, g, b)] + (a,)
    return out


def ancora(im, modo):
    px = im.load()
    w, h = im.size
    if modo == 'tronco':
        for y in range(h - 1, -1, -1):
            xs = [x for x in range(w) if px[x, y][3] > 0]
            if xs:
                return xs[len(xs) // 2], y
    # base: centro da elipse da base
    return w // 2, h - 1 - h // 4


def main():
    LARG = 1024
    quadros = []          # (grupo, papel, origem, imagem, ancora)
    for nome, g in GRUPOS.items():
        if 'fontes' in g:
            for sub, idxs in g['fontes']:
                pasta = OBJ / sub
                if not pasta.exists():
                    print(f'  ({nome}: {sub} ainda nao existe, pulando)')
                    continue
                for i in idxs:
                    im = Image.open(pasta / f'frame_urls_{i}.png').convert('RGBA')
                    im = im.crop(im.getbbox())
                    quadros.append((nome, g['papel'], f'{sub.split("/")[0]}:{i}', im, ancora(im, g['ancora'])))
            continue
        pasta = OBJ / g['pasta']
        if not pasta.exists():
            print(f'  ({nome}: pasta ainda nao existe, pulando)')
            continue
        for papel, idxs in g['quadros'].items():
            for i in idxs:
                im = Image.open(pasta / f'frame_urls_{i}.png').convert('RGBA')
                im = im.crop(im.getbbox())
                quadros.append((nome, papel, i, im, ancora(im, g['ancora'])))
    for nome, g in DIRIGIDOS.items():
        pasta = OBJ / g['pasta']
        if not pasta.exists():
            print(f'  ({nome}: pasta ainda nao existe, pulando)')
            continue
        for d in DIRECOES:
            im = Image.open(pasta / f'storage_urls_{d}.png').convert('RGBA')
            im = im.crop(im.getbbox())
            a = (im.width // 2, im.height - 1 - g['meia_pegada'])
            quadros.append((nome, d, d, im, a))
            if 'recolor' in g:
                variante, mapa = g['recolor']
                mapa = mapa or PELAGEM
                quadros.append((f'{nome}-{variante}', d, d, recolorir(im, mapa), a))

    # Empacotamento em fileiras, da esquerda para a direita.
    x = y = alt_fileira = 0
    posicoes = []
    for _, _, _, im, _ in quadros:
        if x + im.width > LARG:
            x, y, alt_fileira = 0, y + alt_fileira + 1, 0
        posicoes.append((x, y))
        x += im.width + 1
        alt_fileira = max(alt_fileira, im.height)
    atlas = Image.new('RGBA', (LARG, y + alt_fileira), (0, 0, 0, 0))
    meta = {}
    for (nome, papel, i, im, (ax, ay)), (px, py) in zip(quadros, posicoes):
        atlas.alpha_composite(im, (px, py))
        meta.setdefault(nome, {}).setdefault(papel, []).append(
            {'x': px, 'y': py, 'w': im.width, 'h': im.height, 'ax': ax, 'ay': ay, 'origem': i})
    atlas.save(SAIDA / 'cenario.png', optimize=True)
    (SAIDA / 'cenario.json').write_text(json.dumps(meta, indent=1), encoding='utf-8')
    print(f'{SAIDA / "cenario.png"}  {atlas.size}  {(SAIDA / "cenario.png").stat().st_size / 1024:.0f} KB')
    for nome, papeis in meta.items():
        for papel, fs in papeis.items():
            print(f'  {nome}/{papel}: {len(fs)} quadros, alturas {[f["h"] for f in fs]}')


if __name__ == '__main__':
    main()
