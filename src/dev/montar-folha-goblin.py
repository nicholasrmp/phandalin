# -*- coding: utf-8 -*-
"""
Monta a folha de sprites do goblin importado no formato que `sheet.js` le.

O MOTOR NAO MUDA DE FORMATO POR CAUSA DESTA FOLHA.
A folha e que chega no formato dele: blocos de animacao empilhados, uma
fileira por direcao dentro de cada bloco, um quadro por coluna. `drawSprite`
recorta `(quadro*fw, y + fileira*fh, fw, fh)` e desenha com a base no ladrilho.

TRES DECISOES QUE PRECISAM ESTAR ESCRITAS:

1. A CELULA E MAIS LARGA QUE A PROCEDURAL - 192 em vez de 156 fisicos.
   O quadro mais largo (`estados 4`, o goblin recuando com os bracos abertos)
   tem 165 px e nao cabe em 156. Alargar a celula NAO aumenta a figura: o
   `drawSprite` desenha `fw/S` px de largura com a base centrada, entao uma
   celula mais larga e so mais margem transparente em volta. A escala do
   desenho vem da altura, que continua 240.

2. TUDO E COLADO EM MULTIPLOS DE 3.
   Os quadros vem ampliados por blocos de 3x3 justamente para o tabuleiro
   poder dividir por `S` sem perder nada. Um deslocamento de 1 ou 2 px
   quebraria esse alinhamento e devolveria o salpicado.

3. O CENTRO E O PE, NAO A CAIXA.
   Centrar pela caixa delimitadora joga o corpo para o lado toda vez que a
   cimitarra se estende - e ai o goblin fica fora do proprio ladrilho. O
   centro horizontal sai da mediana dos pixels do quinto inferior da figura,
   que sao os pes.
"""
import json
import math
from pathlib import Path
from PIL import Image

AQUI = Path(__file__).resolve().parents[2]
FATIADO = AQUI / '_referencias' / 'spritecook' / 'fatiado'
SAIDA = AQUI / 'src' / 'art' / 'folhas'

S = 3
CELL_W, CELL_H = 64, 80          # logicos; a procedural usa 52x80
GROUND = 5                        # igual ao `GROUND` de draw.js
CELL_PW, CELL_PH = CELL_W * S, CELL_H * S
BASE = (CELL_H - GROUND) * S      # 225: onde o pe encosta

# A BUSSOLA, LIDA DOS QUADROS E NAO SUPOSTA.
#
# A folha do Gemini nao saiu na ordem da bussola. A ordem abaixo foi deduzida
# medindo largura (frente e larga, perfil e estreito), fracao de pele na
# cabeca (de costas a juba cobre o rosto) e, no fim, olhando os oito quadros
# ampliados. `dir 4` e quase identico a `dir 0` - o Gemini nao diferenciou sul
# de sudeste -, e sudeste e a vaga que sobra.
DIRECOES = ['south', 'south-east', 'east', 'north-east',
            'north', 'north-west', 'west', 'south-west']
QUADRO_DA_DIRECAO = {
    'south': 0, 'south-east': 4, 'east': 5, 'north-east': 7,
    'north': 6, 'north-west': 3, 'west': 2, 'south-west': 1,
}
# Vetor de tela de cada direcao: sul e para BAIXO.
ANGULO = {'east': 0, 'south-east': 45, 'south': 90, 'south-west': 135,
          'west': 180, 'north-west': 225, 'north': 270, 'north-east': 315}

# Mesmos nomes, mesma contagem de quadros e mesmo `hold` de `ANIMS` em
# sheet.js. Se divergirem, `frameAt` escolhe um quadro que nao existe.
#
# O DANO NAO ENTRA NA FOLHA, de proposito.
#
# Uma folha que NAO declara `hurt` faz o `board.js` desenhar o recuo como
# efeito: a figura parada, tremendo dois pixels, com tinta vermelha. E o
# mesmo que todas as criaturas importadas vao fazer, porque gerar o dano
# custaria uma geracao por direcao para um quadro de 220 ms. Omitir aqui e
# como o goblin passa a reagir igual ao resto do elenco -- nao ha chave para
# ligar, a ausencia E a chave.
ANIMS = [
    ('idle',   2, [40, 40]),
    ('walk',   4, [9, 9, 9, 9]),
    ('attack', 2, [8, 14]),
    ('down',   1, [60]),
    ('sleep',  2, [50, 50]),
    ('dead',   1, [60]),
]


def carregar():
    man = json.loads((FATIADO / 'manifesto.json').read_text(encoding='utf-8'))
    por = {}
    for q in man['quadros']:
        por[(q['anim'], q['quadro'])] = Image.open(FATIADO / q['arquivo']).convert('RGBA')
    return por


def medidas(im):
    """Caixa da figura e o x do PE, que e por onde ela se alinha ao ladrilho."""
    px = im.load()
    pontos = [(x, y) for y in range(im.height) for x in range(im.width) if px[x, y][3] >= 8]
    ys = [p[1] for p in pontos]
    y0, y1 = min(ys), max(ys)
    corte = y1 - int((y1 - y0) * 0.20)
    pes = sorted(x for x, y in pontos if y >= corte)
    return y1, pes[len(pes) // 2]


def colar(folha, im, col, linha, bloco, dx=0, dy=0):
    """
    Cola um quadro na celula (col, linha) do bloco, pe no chao e centrado pelo
    pe. `dx`/`dy` sao deslocamentos LOGICOS - multiplicados por S aqui, para
    que nada saia do alinhamento de blocos.
    """
    baixo, pe = medidas(im)
    ox = col * CELL_PW + CELL_PW // 2 - pe + dx * S
    oy = bloco + linha * CELL_PH + BASE - 1 - baixo + dy * S
    # O corte de 3 em 3 e o que mantem a divisao do tabuleiro exata.
    ox -= ox % S
    oy -= oy % S
    folha.alpha_composite(im, (ox, oy))


def main():
    q = carregar()
    maxq = max(a[1] for a in ANIMS)
    largura = CELL_PW * maxq
    altura = CELL_PH * len(DIRECOES) * len(ANIMS)
    folha = Image.new('RGBA', (largura, altura), (0, 0, 0, 0))

    anims = {}
    for i, (nome, nq, hold) in enumerate(ANIMS):
        bloco = i * len(DIRECOES) * CELL_PH
        anims[nome] = {'y': bloco, 'fw': CELL_PW, 'fh': CELL_PH,
                       'frames': nq, 'hold': hold, 'total': sum(hold)}
        for linha, dir_ in enumerate(DIRECOES):
            base = q[('dir', QUADRO_DA_DIRECAO[dir_])]
            rad = math.radians(ANGULO[dir_])
            fx, fy = math.cos(rad), math.sin(rad)
            for f in range(nq):
                if nome == 'idle':
                    # Respirar: um pixel logico para cima no segundo quadro.
                    colar(folha, base, f, linha, bloco, dy=-1 if f == 1 else 0)
                elif nome == 'walk':
                    # O CICLO DE PERNAS SO EXISTE DE FRENTE.
                    # O Gemini desenhou `andar` numa direcao so. Repetir esses
                    # quatro quadros nas oito fileiras faria o goblin andar
                    # para o norte olhando para o sul - num tabuleiro tatico, o
                    # erro mais visivel que existe. Entao a direcao manda: as
                    # outras sete fileiras ganham o balanco vertical do mesmo
                    # ciclo sobre o proprio quadro. Anda discreto, mas olha
                    # para onde vai.
                    if dir_ == 'south':
                        colar(folha, q[('walk', f)], f, linha, bloco)
                    else:
                        colar(folha, base, f, linha, bloco, dy=-1 if f % 2 else 0)
                elif nome == 'attack':
                    if dir_ == 'south':
                        colar(folha, q[('attack', f)], f, linha, bloco)
                    else:
                        k = f + 1
                        colar(folha, base, f, linha, bloco,
                              dx=round(fx * k), dy=round(fy * k))
                elif nome == 'hurt':
                    colar(folha, q[('estados', 4)], f, linha, bloco)
                elif nome == 'down':
                    colar(folha, q[('estados', 5)], f, linha, bloco)
                elif nome == 'sleep':
                    colar(folha, q[('estados', 5)], f, linha, bloco, dy=-1 if f == 1 else 0)
                elif nome == 'dead':
                    colar(folha, q[('estados', 6)], f, linha, bloco)

    SAIDA.mkdir(parents=True, exist_ok=True)
    png = SAIDA / 'goblin.png'
    folha.save(png, optimize=True)
    meta = {'cell': [CELL_PW, CELL_PH], 's': S, 'ground': GROUND,
            'w': largura, 'h': altura, 'dirs': DIRECOES, 'anims': anims}
    (SAIDA / 'goblin.json').write_text(json.dumps(meta, indent=2), encoding='utf-8')
    print(f'{png}  {largura}x{altura}  {png.stat().st_size/1024:.0f} KB')
    print(f'{len(ANIMS)} animacoes x {len(DIRECOES)} direcoes')


if __name__ == '__main__':
    main()
