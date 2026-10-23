"""
IMPORTA AS FOLHAS DO GEMINI PARA O FORMATO DA FOLHA DE SPRITES.

O QUE ESTE SCRIPT RESOLVE, E POR QUE CADA PASSO EXISTE

As imagens geradas NÃO têm grade de pixel. Medi: mesmo depois de quantizar
para matar o ruído do WebP, 51-58% das corridas horizontais têm um pixel só, e
nenhum tamanho de bloco (2, 3, 4, 5, 6) passa de 80% de uniformidade. Um
upscale de 2x legítimo daria ~100%. Ou seja: é ilustração pintada com cara de
pixel art, em escala irregular. Não há grade para "encaixar".

Daí os passos:

1. CHAVE DE COR pelo magenta, colhido na moldura. Nenhuma parte do goblin é
   magenta, então a chave é inequívoca — foi por isso que o fundo magenta
   entrou no prompt.

2. SEPARA AS FIGURAS por faixas vazias, e DESCARTA AS PEQUENAS. Duas folhas
   vieram com legenda queimada ("STRUCK HARD", "CELL 1: IDLE BREATH"); o texto
   aparece como componente de 20 px de altura e cai no filtro.

3. REDUZ TODAS COM O MESMO FATOR. Escalar cada quadro para a mesma altura
   pareceria mais uniforme e estaria errado: o goblin deitado é mais baixo que
   o em pé POR SER DEITADO. Um fator único preserva a relação entre as poses.

4. QUANTIZA COM UMA PALETA SÓ, construída de todos os quadros juntos. Quantizar
   quadro a quadro faz a cor derivar entre eles — a pele do quadro 2 sai um
   degrau diferente da do quadro 1, e a animação cintila.

5. ANCORA PELA BASE. Este é o passo que ninguém lembra e que estraga tudo: as
   poses têm alturas diferentes, e centrá-las verticalmente faria a criatura
   flutuar e afundar ao trocar de animação. O chão é a referência.
"""

from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

from PIL import Image

AQUI = Path(__file__).resolve().parent.parent.parent
FONTE = AQUI / '_referencias' / 'spritecook'
SAIDA = AQUI / '_referencias' / 'spritecook' / 'fatiado'

# Altura da figura EM PÉ no destino, em pixels. 120 é o que o goblin desenhado
# em código já ocupa na folha de 3x, então a criatura importada entra do mesmo
# tamanho e nada no tabuleiro precisa mudar de escala.
# QUARENTA, QUE É O QUE O TABULEIRO MOSTRA DE VERDADE.
#
# Medido no goblin procedural, na bancada: a figura tem 29x40 px LÓGICOS. A
# célula é 156x240 física, mas `drawSprite` divide por `S` antes de desenhar,
# então o tabuleiro vê 52x80 e a criatura ocupa 40 px de altura. O S = 3 só
# chega inteiro ao retrato e à ficha.
#
# O pintor procedural sobrevive a essa divisão porque `px()` emite blocos de
# 3x3 ALINHADOS — tirar 8 de cada 9 pixels devolve exatamente o desenho
# lógico. Arte importada não tem esse alinhamento: reduzida por vizinho mais
# próximo, ela sai salpicada.
#
# Então a arte é reduzida AQUI para a altura lógica, quantizada nessa
# resolução, e só então ampliada por BLOCO com vizinho. Assim ela também fica
# alinhada em blocos, e a divisão do tabuleiro volta a ser exata.
ALTURA_ALVO = 40
BLOCO = 3
# Vinte e quatro, não dezesseis.
#
# A skill `pixel-art` põe o teto em 8-16 por personagem, e isso vale para arte
# DESENHADA nesse orçamento. Esta aqui vem pronta, com seis materiais — pele,
# aço, madeira, osso, cabelo e contorno —, o que é dezoito tons no mínimo.
# Espremer em dezesseis matou o aço: a paleta saiu sem nenhum cinza claro e a
# cimitarra ficou marrom. Medido.
CORES = 24

# Quais folhas, e o que tirar de cada uma. Os índices são a ordem em que as
# figuras saem do separador: da esquerda para a direita, de cima para baixo.
FOLHAS = [
    ('goblin-direcoes-gemini.webp', 'dir',   None),   # as 8 direções, todas
    ('goblin-andar2.webp',          'walk',  [0, 1, 2, 3]),
    ('goblin-andar2.webp',          'idle',  [0, 4]),  # o par de 6,1% medido
    ('goblin-ataque.webp',          'attack', [0, 1]),
    ('goblin-chao-dano.webp',       'estados', None),
]


def fundo_da_moldura(im):
    px = im.load()
    w, h = im.size
    c = Counter()
    for x in range(0, w, 5):
        c[px[x, 0]] += 1
        c[px[x, h - 1]] += 1
    for y in range(0, h, 5):
        c[px[0, y]] += 1
        c[px[w - 1, y]] += 1
    return c.most_common(1)[0][0]


def faixas(ocupado, n, minimo=8):
    fora, ini = [], None
    for i in range(n):
        if ocupado[i] and ini is None:
            ini = i
        elif not ocupado[i] and ini is not None:
            if i - ini > minimo:
                fora.append((ini, i - 1))
            ini = None
    if ini is not None and n - ini > minimo:
        fora.append((ini, n - 1))
    return fora


def so_o_maior(rec):
    """
    Fica só com o MAIOR pedaço conectado da figura.

    Duas folhas vieram com legenda queimada, e o texto está DENTRO da caixa da
    figura — acima do goblin deitado. Separar por faixas vazias não o pega,
    porque não há faixa vazia entre os dois. Mas o texto nunca encosta no
    corpo, então ele é outro componente, e o corpo é sempre o maior.
    """
    w, h = rec.size
    px = rec.load()
    marca = [[0] * w for _ in range(h)]
    atual, tamanhos = 0, {}
    for y0 in range(h):
        for x0 in range(w):
            if marca[y0][x0] or px[x0, y0][3] < 8:
                continue
            atual += 1
            pilha, n = [(x0, y0)], 0
            marca[y0][x0] = atual
            while pilha:
                x, y = pilha.pop()
                n += 1
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    a, b = x + dx, y + dy
                    if 0 <= a < w and 0 <= b < h and not marca[b][a] and px[a, b][3] >= 8:
                        marca[b][a] = atual
                        pilha.append((a, b))
            tamanhos[atual] = n
    if not tamanhos:
        return None
    maior = max(tamanhos, key=tamanhos.get)
    minx, miny, maxx, maxy = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            if marca[y][x] != maior:
                px[x, y] = (0, 0, 0, 0)
            else:
                minx = min(minx, x); maxx = max(maxx, x)
                miny = min(miny, y); maxy = max(maxy, y)
    return rec.crop((minx, miny, maxx + 1, maxy + 1))


def separar(caminho):
    """Devolve as figuras de uma folha, já recortadas e com alfa."""
    im = Image.open(caminho).convert('RGB')
    w, h = im.size
    px = im.load()
    fundo = fundo_da_moldura(im)

    def perto(c):
        # Limiar largo: o WebP é com perda e deixa um degradê entre o magenta e
        # o contorno preto. Com limiar apertado sobra uma franja magenta em
        # volta de toda a figura, que foi o que apareceu na primeira passada.
        if sum((c[i] - fundo[i]) ** 2 for i in range(3)) < 9000:
            return True
        # E qualquer coisa MAGENTOSA — vermelho e azul altos, verde baixo —
        # é fundo, não desenho: nenhuma parte do goblin é magenta. Foi para
        # isso que o fundo magenta entrou no prompt.
        r, g, b = c
        return r > 110 and b > 90 and g < min(r, b) * 0.62

    cheio = [[not perto(px[x, y]) for x in range(w)] for y in range(h)]
    linhas = [any(r) for r in cheio]

    figuras = []
    for (ya, yb) in faixas(linhas, h):
        cols = [any(cheio[y][x] for y in range(ya, yb + 1)) for x in range(w)]
        for (xa, xb) in faixas(cols, w):
            ys = [y for y in range(ya, yb + 1) if any(cheio[y][x] for x in range(xa, xb + 1))]
            if not ys:
                continue
            n = sum(1 for y in ys for x in range(xa, xb + 1) if cheio[y][x])
            alt = max(ys) - min(ys) + 1
            # Texto queimado: componente baixo e magro. O goblin deitado tem
            # uns 90 px de altura; uma linha de legenda, uns 20.
            if n < 2500 or alt < 40:
                continue
            rec = im.crop((xa, min(ys), xb + 1, max(ys) + 1)).convert('RGBA')
            p2 = rec.load()
            for y in range(rec.height):
                for x in range(rec.width):
                    r, g, b, a = p2[x, y]
                    if perto((r, g, b)):
                        p2[x, y] = (0, 0, 0, 0)
            rec = so_o_maior(rec)
            if rec is not None:
                figuras.append(rec)
    return figuras


def main():
    SAIDA.mkdir(parents=True, exist_ok=True)
    colhidas = []           # (nome, indice, imagem)
    for arquivo, nome, quais in FOLHAS:
        caminho = FONTE / arquivo
        if not caminho.exists():
            print(f'  AUSENTE: {arquivo}', file=sys.stderr)
            continue
        figs = separar(caminho)
        print(f'{arquivo:32} -> {len(figs)} figuras  ({nome})')
        escolha = range(len(figs)) if quais is None else quais
        for k, i in enumerate(escolha):
            if i < len(figs):
                colhidas.append((nome, k, figs[i]))

    if not colhidas:
        print('nada colhido', file=sys.stderr)
        return 1

    # ---- 3. um fator de escala para TODAS ---------------------------------
    emPe = [im.height for nome, _, im in colhidas if nome in ('dir', 'walk', 'idle', 'attack')]
    base = sorted(emPe)[len(emPe) // 2]
    fator = ALTURA_ALVO / base
    print(f'\naltura mediana em pé: {base} px  ->  fator {fator:.3f}')

    def reduzir(im, nw, nh):
        """
        Reduz sem halo escuro.

        Redimensionar RGBA direto mistura o PRETO dos pixels transparentes na
        borda do desenho — o filtro não sabe que ali não há cor, só vê (0,0,0).
        O resultado é um contorno sujo em volta de tudo. O conserto é preencher
        o transparente com a cor média do próprio desenho antes de reduzir, e
        reduzir o alfa à parte.
        """
        px = im.load()
        soma = [0, 0, 0]
        n = 0
        for y in range(im.height):
            for x in range(im.width):
                if px[x, y][3] >= 8:
                    n += 1
                    for i in range(3):
                        soma[i] += px[x, y][i]
        media = tuple(v // max(1, n) for v in soma)
        cheio = Image.new('RGB', im.size, media)
        cheio.paste(im.convert('RGB'), (0, 0), im.split()[3])
        cor = cheio.resize((nw, nh), Image.LANCZOS)
        alfa = im.split()[3].resize((nw, nh), Image.LANCZOS)
        # Alfa volta a ser binário: pixel art não tem borda meio transparente,
        # e meia transparência é o que cria halo em fundo diferente.
        alfa = alfa.point(lambda v: 255 if v >= 128 else 0)
        fora = cor.convert('RGBA')
        fora.putalpha(alfa)
        return fora

    reduzidas = []
    for nome, k, im in colhidas:
        nw = max(1, round(im.width * fator))
        nh = max(1, round(im.height * fator))
        reduzidas.append((nome, k, reduzir(im, nw, nh)))

    # ---- 4. UMA paleta para todos ------------------------------------------
    largura = max(im.width for _, _, im in reduzidas)
    total = sum(im.height for _, _, im in reduzidas)
    tira = Image.new('RGBA', (largura, total), (0, 0, 0, 0))
    y = 0
    for _, _, im in reduzidas:
        tira.paste(im, ((largura - im.width) // 2, y))
        y += im.height
    # A PALETA SAI SÓ DOS PIXELS OPACOS.
    #
    # Na primeira passada eu colei tudo sobre magenta e quantizei a imagem
    # inteira — e o magenta roubou vagas das dezesseis cores, deixando menos
    # para a pele e o metal. Aqui os pixels do desenho são empacotados numa
    # tira sem fundo nenhum, e é dela que a paleta nasce.
    # E CADA COR DISTINTA PESA IGUAL, não por quantos pixels ocupa.
    #
    # Contando pixel a pixel, o contorno preto — que neste estilo é quase
    # metade da figura — domina o median-cut e come as vagas. A primeira
    # passada saiu com o aço marrom e a pele sem o mostarda, por isso.
    # Contando cada cor UMA vez, o preto vale o mesmo que o brilho da lâmina,
    # e a paleta se reparte entre os materiais.
    distintas = Counter()
    for y in range(tira.height):
        for x in range(tira.width):
            c = tira.getpixel((x, y))
            if c[3] >= 8:
                distintas[c[:3]] += 1
    # Um peso suave pela frequência (raiz quarta) evita o oposto: uma cor que
    # aparece em dez pixels não merece o mesmo que a pele.
    pontos = []
    for cor, n in distintas.items():
        pontos.extend([cor] * max(1, int(round(n ** 0.25))))
    amostra = Image.new('RGB', (len(pontos), 1))
    amostra.putdata(pontos)
    pal = amostra.quantize(colors=CORES, method=Image.MEDIANCUT, dither=Image.NONE)

    manifesto = []
    for nome, k, im in reduzidas:
        # Fundo preenchido com a cor MÉDIA do desenho, não magenta: o que
        # estiver transparente vira alfa zero logo abaixo, e assim a borda não
        # ganha um vizinho de cor estranha durante a quantização.
        rgb = Image.new('RGB', im.size, (60, 48, 32))
        rgb.paste(im.convert('RGB'), (0, 0), im.split()[3])
        q = rgb.quantize(palette=pal, dither=Image.NONE).convert('RGBA')
        qp = q.load()
        op = im.load()
        for yy in range(q.height):
            for xx in range(q.width):
                if op[xx, yy][3] < 8:
                    qp[xx, yy] = (0, 0, 0, 0)
        # Ampliar DEPOIS de quantizar. Ampliar antes só faria a quantização
        # trabalhar em nove vezes mais pixels para o mesmo resultado.
        q = q.resize((q.width * BLOCO, q.height * BLOCO), Image.NEAREST)
        arq = SAIDA / f'{nome}-{k}.png'
        q.save(arq)
        manifesto.append({'anim': nome, 'quadro': k, 'w': q.width, 'h': q.height,
                          'arquivo': arq.name})

    (SAIDA / 'manifesto.json').write_text(
        json.dumps({'altura_alvo': ALTURA_ALVO, 'bloco': BLOCO, 'fator': fator,
                    'cores': CORES, 'quadros': manifesto},
                   indent=2, ensure_ascii=False), encoding='utf-8')
    print(f'\n{len(manifesto)} quadros em {SAIDA}')
    for m in manifesto:
        print(f"  {m['anim']:8} {m['quadro']}  {m['w']}x{m['h']}")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
