# -*- coding: utf-8 -*-
"""
Transforma uma folha de icones gerada (OpenArt) em grades de texto 32x32 na
paleta `P` de src/art/icons.js.

POR QUE ESTE CAMINHO
Os icones de condicao foram decididos medindo: a folha do OpenArt contra o
PixelLab, pelos mesmos criterios. O arquivo bruto do OpenArt NAO e pixel art
de verdade -- milhares de cores por icone, 70% de trechos de 1 px, nenhuma
grade -- mas ele desenha formas grandes e chapadas que ocupam a celula, e
reduzir por media de area prendendo a paleta recupera um icone limpo. Ficou
com menos salpicado (11,0% de pixels orfaos contra 18,5%) e ocupando mais da
celula (54,7% contra 22,8%) que o PixelLab nativo.

Este arquivo e esse conversor, e so funciona por causa dele: a folha nunca
entra no jogo como esta.

ENTRADA
Uma pasta com `folha.png` (fundo chapado, de preferencia magenta, icones numa
grade regular) e `especificacao.json` com `paleta` (as 14 cores de `P`, na
ordem das chaves 1-9, a-e) e `icones` (lista de [nome, descricao], na ordem
das celulas, da esquerda para a direita e de cima para baixo).

SAIDA
Um arquivo .js com as grades, no formato de icons.js, e os PNG 32x32 numa
subpasta `embarcado/` para conferir no olho.

    python src/dev/importar-icones.py <pasta> --colunas 5 --linhas 3 \
        --saida src/art/icones-magias.js --export ICONES_MAGIAS --prefixo magia-
"""
import argparse
import json
from collections import Counter
from pathlib import Path
from PIL import Image

LADO = 32
CHAVES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e']


def rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('pasta')
    ap.add_argument('--colunas', type=int, required=True)
    ap.add_argument('--linhas', type=int, required=True)
    ap.add_argument('--saida', required=True)
    ap.add_argument('--export', required=True)
    ap.add_argument('--prefixo', default='')
    ap.add_argument('--cabecalho', default='')
    a = ap.parse_args()

    pasta = Path(a.pasta)
    esp = json.loads((pasta / 'especificacao.json').read_text(encoding='utf-8'))
    pal = [rgb(h) for h in esp['paleta']]
    chave_de = dict(zip(pal, CHAVES))

    def mais_perto(c, permitidas=None):
        return min(permitidas or pal, key=lambda p: sum((x - y) ** 2 for x, y in zip(c, p)))

    im = Image.open(pasta / 'folha.png').convert('RGB')
    W, H = im.size

    # O fundo e medido, nao suposto: o gerador pede #FF00FF e entrega perto.
    borda = Counter()
    for x in range(0, W, 7):
        borda[im.getpixel((x, 2))] += 1
        borda[im.getpixel((x, H - 3))] += 1
    fundo = borda.most_common(1)[0][0]

    def e_fundo(c):
        return sum(abs(p - q) for p, q in zip(c, fundo)) < 60

    print(f'folha {W}x{H}, fundo #{fundo[0]:02x}{fundo[1]:02x}{fundo[2]:02x}')
    (pasta / 'embarcado').mkdir(exist_ok=True)
    cw, ch = W / a.colunas, H / a.linhas
    blocos = []
    for i, item in enumerate(esp['icones']):
        nome, desc = item[0], item[1]
        # EXCLUIR CORES, POR ICONE.
        #
        # A paleta tem um verde so, e a distancia em RGB decide mal no meio do
        # caminho: o verde-amarelado do Raio de Doenca fica mais perto do OURO
        # (3.329) que do verde (9.441), e o raio saiu mostarda, com cara de
        # queijo. Quando isso acontece, o icone declara as cores que nao pode
        # usar e o resto da paleta decide.
        #
        # Excluir nem sempre basta: tirando o ouro, o mesmo verde-amarelado
        # caiu no tom de PELE, porque o verde da paleta continua longe. Por
        # isso existe tambem `somente`, a lista do que o icone PODE usar.
        opcoes = item[2] if len(item) > 2 else {}
        hexa = lambda p: f'#{p[0]:02x}{p[1]:02x}{p[2]:02x}'
        permitidas = [p for p in pal
                      if hexa(p) not in opcoes.get('excluir', [])
                      and (not opcoes.get('somente') or hexa(p) in opcoes['somente'])]
        cx, cy = i % a.colunas, i // a.colunas
        # MARGEM INTERNA DE 3%. A grade do gerador não cai exatamente nas
        # divisões da imagem, e o recorte pela divisão exata trazia pixels do
        # ícone VIZINHO grudados na borda — o revisor de legibilidade achou
        # isso em 7 dos 24 ícones do piloto, sempre na coluna 0 ou na linha
        # 31. Os ícones vêm centralizados com folga, então a margem não corta
        # desenho: corta só o vizinho.
        mx, my = int(cw * 0.03), int(ch * 0.03)
        cel = im.crop((int(cx * cw) + mx, int(cy * ch) + my,
                       int((cx + 1) * cw) - mx, int((cy + 1) * ch) - my))
        px = cel.load()
        pts = [(x, y) for y in range(cel.height) for x in range(cel.width) if not e_fundo(px[x, y])]
        if not pts:
            # Celula vazia nao derruba o lote: com 24 por folha o gerador as
            # vezes pula uma. O icone fica de fora e a revisao o pede de novo.
            print(f'  AVISO {a.prefixo}{nome}: celula vazia, icone nao gerado')
            continue
        # A FRANJA MAGENTA.
        #
        # Gerador barato devolve JPEG, e brilho difuso em volta do desenho
        # mistura com o fundo: sai um anel rosado que a paleta transforma em
        # VIOLETA (#a579d8), e o ícone ganha um halo roxo que não foi pedido.
        # Medido no piloto: Luz, Mão Mágica e Alarme vieram assim.
        #
        # O conserto é crescer o fundo para dentro dos pixels de tom magenta
        # — vermelho e azul bem acima do verde — mas SÓ os que estão ligados
        # ao fundo. Um roxo no MEIO do ícone (a língua da Zombaria, o cubo da
        # Ilusão) não encosta no fundo e fica.
        def magentoso(c):
            return c[0] - c[1] > 70 and c[2] - c[1] > 70 and abs(c[0] - c[2]) < 90

        #
        # Um ícone que é violeta DE PROPÓSITO na borda (a chama meio laranja,
        # meio violeta do feiticeiro) declara `manterVioleta` e pula isto: sem
        # a opção, a metade violeta inteira era comida como franja.
        fundo_cel = set()
        fila = [(x, y) for y in range(cel.height) for x in range(cel.width) if e_fundo(px[x, y])]
        fundo_cel.update(fila)
        if opcoes.get('manterVioleta'):
            fila = []
        while fila:
            x, y = fila.pop()
            for a2, b2 in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if 0 <= a2 < cel.width and 0 <= b2 < cel.height and (a2, b2) not in fundo_cel \
                        and magentoso(px[a2, b2]):
                    fundo_cel.add((a2, b2))
                    fila.append((a2, b2))
        # FRAGMENTOS SOLTOS.
        #
        # Ruído de JPEG e pedaços do vizinho que a margem não alcançou viram
        # ilhas de poucos pixels longe do desenho; reduzidas a 32 px, cada uma
        # vira um pixel solto na beirada do ícone. Uma ilha é descartada se
        # tiver menos de 0,2% da área da maior (e no mínimo 30 px): uma
        # faísca de verdade, desenhada de propósito, passa disso com folga.
        frente = {(x, y) for y in range(cel.height) for x in range(cel.width) if (x, y) not in fundo_cel}
        ilhas, visto = [], set()
        for p0 in frente:
            if p0 in visto:
                continue
            ilha, pilha = [], [p0]
            visto.add(p0)
            while pilha:
                x, y = pilha.pop()
                ilha.append((x, y))
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        q = (x + dx, y + dy)
                        if q in frente and q not in visto:
                            visto.add(q)
                            pilha.append(q)
            ilhas.append(ilha)
        if ilhas:
            maior = max(len(i) for i in ilhas)
            corte = max(30, int(maior * 0.002))
            W_, H_ = cel.width, cel.height
            for ilha in ilhas:
                # Ilha que ENCOSTA na borda da célula e não é o corpo do desenho
                # é pedaço do vizinho, por maior que seja: os ícones vêm
                # centralizados com folga, e só o vizinho chega até a borda.
                na_borda = len(ilha) < maior and any(
                    x == 0 or y == 0 or x == W_ - 1 or y == H_ - 1 for x, y in ilha)
                if len(ilha) < corte or na_borda:
                    fundo_cel.update(ilha)
        pts = [(x, y) for y in range(cel.height) for x in range(cel.width) if (x, y) not in fundo_cel]
        if not pts:
            print(f'  AVISO {a.prefixo}{nome}: so franja, icone nao gerado')
            continue
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        x0, y0 = min(xs), min(ys)
        rec = cel.crop((x0, y0, max(xs) + 1, max(ys) + 1))
        rp = rec.load()
        alfa = Image.new('L', rec.size, 0)
        ap_ = alfa.load()
        soma = [0, 0, 0]
        n = 0
        for y in range(rec.height):
            for x in range(rec.width):
                if (x + x0, y + y0) not in fundo_cel:
                    ap_[x, y] = 255
                    n += 1
                    for k in range(3):
                        soma[k] += rp[x, y][k]
        # O fundo vira a cor MEDIA do desenho antes de reduzir: senao o magenta
        # entra na media da borda e o contorno sai rosado.
        media = tuple(v // max(1, n) for v in soma)
        cheio = Image.new('RGB', rec.size, media)
        cheio.paste(rec, (0, 0), alfa)

        k = LADO / max(rec.size)
        nw, nh = max(1, round(rec.width * k)), max(1, round(rec.height * k))
        cor = cheio.resize((nw, nh), Image.BOX).load()
        al = alfa.resize((nw, nh), Image.BOX).load()
        ox, oy = (LADO - nw) // 2, (LADO - nh) // 2
        out = Image.new('RGBA', (LADO, LADO), (0, 0, 0, 0))
        op = out.load()
        grade = [['.'] * LADO for _ in range(LADO)]
        for y in range(nh):
            for x in range(nw):
                if al[x, y] >= 128:
                    c = mais_perto(cor[x, y], permitidas)
                    op[ox + x, oy + y] = c + (255,)
                    grade[oy + y][ox + x] = chave_de[c]
        out.save(pasta / 'embarcado' / f'{nome}.png')
        linhas = '\n'.join(f"    '{''.join(l)}'," for l in grade)
        blocos.append(f"  // {desc}\n  '{a.prefixo}{nome}': [\n{linhas}\n  ],")
        print(f'  {a.prefixo}{nome}')

    cab = a.cabecalho or (
        f'// Icones gerados pelo OpenArt e convertidos por src/dev/importar-icones.py.\n'
        f'// 32x32, na paleta `P` de icons.js. Nao editar a folha: editar a grade.\n')
    Path(a.saida).write_text(cab + f'\nexport const {a.export} = {{\n' + '\n'.join(blocos) + '\n};\n',
                             encoding='utf-8', newline='\n')
    print(f'{len(blocos)} icones -> {a.saida}')


if __name__ == '__main__':
    main()
