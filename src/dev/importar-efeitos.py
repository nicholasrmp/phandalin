# -*- coding: utf-8 -*-
"""
Transforma uma folha de ANIMAÇÃO de efeito (OpenArt) em quadros de pixel art
na paleta `P` de src/art/icons.js, e escreve src/art/efeitos.js.

POR QUE NÃO É O CONVERSOR DE ÍCONES
`importar-icones.py` recorta cada célula pela borda do desenho e centraliza.
Num ícone isso é o certo; numa animação faz a explosão tremer, porque cada
quadro sai recortado num tamanho e centralizado num ponto diferentes. Aqui
TODOS os quadros de uma fileira são reduzidos na mesma escala, a partir do
mesmo recorte da célula: o que estava parado na folha fica parado no jogo.

ENTRADA
Uma pasta com `folha.png` (fundo magenta, uma animação por fileira, quadros
da esquerda para a direita) e `especificacao.json`:

    {"colunas": 6, "linhas": 4, "lado": 40,
     "fileiras": [{"nome": "fogo-projetil", "somente": ["#e0553c", ...]}, ...]}

`lado` é o tamanho de cada quadro em pixels de arte; uma fileira pode ter o
seu (a explosão pede mais pixels que o projétil, porque o jogo desenha 1:1). `somente`, opcional,
restringe as cores daquela fileira (o mesmo papel que tem nos ícones).

SAÍDA
- `src/art/efeitos.js` com as fileiras desta pasta somadas às que já estavam lá;
- `quadros.png` na pasta, cada fileira ampliada 4x, para conferir no olho.

    python src/dev/importar-efeitos.py _referencias/efeitos/piloto
"""
import json
import re
import sys
from pathlib import Path
from PIL import Image, ImageDraw

RAIZ = Path(__file__).resolve().parents[2]
SAIDA = RAIZ / 'src' / 'art' / 'efeitos.js'
PALETA = ['#e8eef5', '#aab6c6', '#6b7686', '#b0875a', '#8a6236', '#e8c35a', '#a6822c',
          '#e0553c', '#6ea8e8', '#e2b183', '#f4f0e4', '#6fc07a', '#a579d8', '#2a2430']
CHAVES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e']


def rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def magenta(c):
    """Fundo e a franja dele: vermelho e azul altos, verde baixo."""
    r, g, b = c[:3]
    return r - g > 70 and b - g > 70 and abs(r - b) < 90


def escuro(c):
    """Fundo escuro que o gerador às vezes põe atrás de cada quadro."""
    r, g, b = c[:3]
    return max(r, g, b) < 70 and max(r, g, b) - min(r, g, b) < 30


def claro(c):
    """Fundo branco ou rosa-claro que o gerador às vezes pinta no lugar do magenta."""
    r, g, b = c[:3]
    return (r + g + b) / 3 > 185 and max(r, g, b) - min(r, g, b) <= 65


def converter_celula(cel, lado, paleta, fundo_escuro=False, largo=None, franja_estreita=False, fundo_claro=False):
    W, H = cel.size
    px = cel.load()
    # `franjaEstreita`: lilás translúcido sobre o magenta (anel da maldição,
    # névoa do sono) passa no teste de magenta e virava fundo. Com a opção, só
    # é fundo o que também tem verde baixo de verdade.
    mag = (lambda c: magenta(c) and c[1] < 60) if franja_estreita else magenta
    eh_fundo = (lambda c: mag(c) or escuro(c)) if fundo_escuro else mag
    # `fundoClaro`: o claro LIGADO À BORDA também é fundo (o desenho claro
    # solto no meio, cercado de cor, fica).
    if fundo_claro:
        base = eh_fundo
        eh_fundo = lambda c: base(c) or claro(c)
    # Fundo: o magenta ligado à borda, e a franja magenta encostada nele.
    fundo = set()
    fila = [(x, y) for x in range(W) for y in (0, H - 1)] + [(x, y) for y in range(H) for x in (0, W - 1)]
    fila = [p for p in fila if eh_fundo(px[p])]
    fundo.update(fila)
    # Com `fundoEscuro`, o quadro escuro atrás do desenho também fica preso
    # DENTRO de um anel; aí tira todo escuro, ligado à borda ou não. Só serve
    # para folhas cujos efeitos não têm contorno escuro (brilho sobre o fundo).
    if fundo_escuro:
        fundo.update((x, y) for y in range(H) for x in range(W) if escuro(px[x, y]))
    while fila:
        x, y = fila.pop()
        for a, b in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= a < W and 0 <= b < H and (a, b) not in fundo and eh_fundo(px[a, b]):
                fundo.add((a, b))
                fila.append((a, b))
    largo = largo or lado
    passo = H / lado
    out = []
    for ty in range(lado):
        linha = ''
        for tx in range(largo):
            x0, x1 = int(tx * passo), max(int(tx * passo) + 1, int((tx + 1) * passo))
            y0, y1 = int(ty * passo), max(int(ty * passo) + 1, int((ty + 1) * passo))
            cores = [px[x, y][:3] for y in range(y0, min(y1, H)) for x in range(x0, min(x1, W))
                     if (x, y) not in fundo and not mag(px[x, y])]
            total = (x1 - x0) * (y1 - y0)
            if len(cores) < total * 0.5:
                linha += '.'
                continue
            m = tuple(sum(c[i] for c in cores) / len(cores) for i in range(3))
            k = min(paleta, key=lambda p: sum((m[i] - p[1][i]) ** 2 for i in range(3)))
            linha += k[0]
        out.append(linha)
    return out


BAYER4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]


def esmaecer_topo(grade, n):
    """Dissolve as `n` primeiras fileiras em pontilhado ordenado (Bayer 4x4):
    a coluna de luz que vem do céu some para cima em vez de terminar numa
    linha reta onde o desenho encostou no alto da célula."""
    out = []
    for y, linha in enumerate(grade):
        if y >= n:
            out.append(linha)
            continue
        fica = (y + 1) / (n + 1) * 16
        out.append(''.join(k if k == '.' or BAYER4[y % 4][x % 4] < fica else '.' for x, k in enumerate(linha)))
    return out


def ler_existentes():
    if not SAIDA.exists():
        return {}
    t = SAIDA.read_text(encoding='utf-8')
    m = re.search(r'EFEITOS = (\{.*?\n\});', t, re.S)
    return json.loads(m.group(1)) if m else {}


def main():
    pasta = Path(sys.argv[1])
    esp = json.loads((pasta / 'especificacao.json').read_text(encoding='utf-8'))
    folha = Image.open(pasta / 'folha.png').convert('RGB')
    cols, lins = esp['colunas'], esp['linhas']
    maior = max(f.get('lado', esp['lado']) for f in esp['fileiras'] if f)
    cw, ch = folha.width / cols, folha.height / lins
    # Célula QUADRADA no centro de cada célula da grade: a mesma para todos os
    # quadros, para não mexer o centro da animação.
    efeitos = ler_existentes()
    maxcol = max(f.get('colunas', cols) for f in esp['fileiras'] if f)
    maior_x = max(round(f.get('lado', esp['lado']) * f.get('largura', 1)) for f in esp['fileiras'] if f)
    previa = Image.new('RGBA', (maxcol * maior_x * 4, lins * maior * 4), (36, 30, 24, 255))
    for r, fil in enumerate(esp['fileiras']):
        if not fil:
            continue
        lado = fil.get('lado', esp['lado'])
        # Ajustes de recorte por fileira: `colunas` (o gerador desenhou 7
        # quadros em vez de 6), `dy` (desce o recorte, para fugir de um rótulo
        # que ele escreveu em cima), `escala` (recorte menor) e `pular`
        # (quadros que saíram errados e ficam de fora). `esmaecerTopo` (n
        # fileiras) dissolve o topo do que desce do céu.
        ncol = fil.get('colunas', cols)
        cwr = folha.width / ncol
        qr = min(cwr, ch) * 0.96 * fil.get('escala', 1)
        # `largura`: efeito mais largo que alto (a onda de choque, a névoa).
        # O recorte e o quadro esticam só na horizontal.
        largura = fil.get('largura', 1)
        largo = round(lado * largura)
        pal = [(k, rgb(h)) for k, h in zip(CHAVES, PALETA) if not fil.get('somente') or h in fil['somente']]
        quadros = []
        for c in range(ncol):
            if c in fil.get('pular', []):
                continue
            cx, cy = (c + 0.5) * cwr, (r + 0.5 + fil.get('dy', 0)) * ch
            qx = qr * largura
            cel = folha.crop((int(cx - qx / 2), int(cy - qr / 2), int(cx + qx / 2), int(cy + qr / 2)))
            grade = converter_celula(cel, lado, pal, esp.get('fundoEscuro', False), largo, fil.get('franjaEstreita', False), fil.get('fundoClaro', False))
            if fil.get('esmaecerTopo'):
                grade = esmaecer_topo(grade, fil['esmaecerTopo'])
            quadros.append(grade)
            for y, linha in enumerate(grade):
                for x, k in enumerate(linha):
                    if k == '.':
                        continue
                    cor = rgb(PALETA[CHAVES.index(k)])
                    ImageDraw.Draw(previa).rectangle(
                        [((len(quadros) - 1) * maior_x + x) * 4, (r * maior + y) * 4, ((len(quadros) - 1) * maior_x + x) * 4 + 3, (r * maior + y) * 4 + 3], fill=cor)
        efeitos[fil['nome']] = {'lado': lado, 'quadros': quadros}
        print(f"{fil['nome']}: {len(quadros)} quadros de {lado}x{lado}")
    previa.save(pasta / 'quadros.png')
    corpo = json.dumps(efeitos, indent=1, ensure_ascii=False)
    SAIDA.write_text(
        '// Quadros de animação dos efeitos de magia, em pixel art na paleta `P`.\n'
        '// GERADO por src/dev/importar-efeitos.py a partir de folhas do OpenArt.\n'
        '// Para refazer um efeito, gere a folha de novo e rode o conversor.\n\n'
        f'export const EFEITOS = {corpo};\n', encoding='utf-8')


if __name__ == '__main__':
    main()
