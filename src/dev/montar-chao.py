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
PIXELLAB = AQUI / '_referencias' / 'pixellab'
SAIDA = AQUI / 'src' / 'art' / 'folhas'

# A leva de cada superficie. Sao as duas geradas com `tile_view_angle: 30`,
# que e o angulo que da o losango 2:1; as levas anteriores tinham a projecao
# errada e ficam de fora.
FILEIRAS = [
    ('grama', '14578cc6-1049-42ef-81db-d6939425af88'),
    ('estrada', '5f9237e2-b95e-4436-84c5-b20bcdb115e6'),
    # O esconderijo: duas levas de varias superficies cada, com os indices de
    # cada uma. Na de caverna, 13 (poca d'agua) fica de fora: le como agua.
    # Na de rocha, 12 (pontos brancos) leria como cristal.
    ('caverna', '7936c366-c42a-481e-8c1e-8c5189fef90a', [0, 1, 2, 3, 4, 5, 10, 11, 12, 14, 15]),
    ('riacho', '7936c366-c42a-481e-8c1e-8c5189fef90a', [6, 7]),
    ('poco', '7936c366-c42a-481e-8c1e-8c5189fef90a', [8, 9]),
    ('rocha', 'be2f8c15-eb43-44d6-b6fe-40d67b3ea6d1', [0, 1, 2, 3, 8, 9, 13]),
    ('entulho', 'be2f8c15-eb43-44d6-b6fe-40d67b3ea6d1', [4, 5, 10, 14]),
    ('ponte', 'be2f8c15-eb43-44d6-b6fe-40d67b3ea6d1', [6, 7, 11, 15]),
    # O porao da Mansao Tresendar. Fora: 4 (poeira demais), 8-11 sao agua e
    # fosso, 12 e 14 (rachado e com poca, leem como outra coisa), 15 (buraco
    # com borda: o fosso tem 2 x 2 casas e a borda faria uma grade).
    # A laje do castelo. O piso que vem no KIT de construcao NAO serve de
    # ladrilho: e uma laje grande por casa, com junta preta larga, e repetido
    # vira uma grade de blocos; as quatro variacoes ainda pulam de tom. Esta
    # leva foi pedida como pedra miuda, de junta fina, na paleta do kit.
    # Fora: 5 e 13 (escuras demais), 1, 4, 9, 10 e 12 (rachadura ou sujeira
    # que repete e vira desenho), 6 (lisa demais).
    ('laje', 'de7011f0-a282-42df-b7cc-bf1fed4b48e7', [0, 2, 3, 7, 8, 11, 14, 15]),
    # DECALQUES DO CASTELO (leva `sujeiraCastelo`). Nao sao variacoes do
    # piso: sao marcas postas de proposito, uma a uma, pelo gerador do mapa,
    # porque cada uma CONTA alguma coisa da sala. Mesma pedra e mesma luz da
    # fileira `laje`, para a marca nao virar remendo de outro chao.
    # Fora: 12 (fuligem quase preta, com verde) e 13 (poca lavada).
    ('ossos', 'e460163d-dc68-4d58-adda-fb4e587d5bbb', [0, 8]),
    ('mancha', 'e460163d-dc68-4d58-adda-fb4e587d5bbb', [1, 9, 4]),
    ('cacos', 'e460163d-dc68-4d58-adda-fb4e587d5bbb', [3, 11, 7, 15]),
    ('musgoChao', 'e460163d-dc68-4d58-adda-fb4e587d5bbb', [2, 10, 5]),
    ('cisterna', '0275c74c-e80e-4191-84eb-8774ea880520', [8, 9]),
    ('fosso', '0275c74c-e80e-4191-84eb-8774ea880520', [10]),
    # O alto dos planaltos do Cume da Wyvern. Fora: 0 (brilho), 3 e 11 (tufo
    # grande, repete), 4 e 12 (escuros), 6 e 14 (buraco), 9 (racha funda),
    # 13 (manchas brancas).
    ('planalto', 'e2f1ffc5-6074-4aa7-9000-48c7ae76ff34', [1, 2, 5, 7, 8, 10, 15]),
    # ARVORE TROVAO (`ladrilhos-pro.py --conjunto lajeRuina|tabuaRuina|trigo|cinza|lago`).
    # O piso de dentro das casas: laje miuda com cinza nas juntas, e tabua
    # apodrecida. As marcas fortes da laje (buraco de terra, fuligem, entulho) saem
    # numa fileira a parte, para o gerador pingar com parcimonia.
    ('lajeRuina', 'ladrilhos-pro/4bb891ba-77be-4803-abd4-2d4802a1f42f', [0, 1, 2, 5, 7, 9, 10, 11, 15]),
    ('lajeEntulho', 'ladrilhos-pro/4bb891ba-77be-4803-abd4-2d4802a1f42f', [3, 8, 12, 14]),
    ('tabua', 'ladrilhos-pro/d514fb2f-7648-4354-9717-61f1b09df41d', [0, 1, 4, 5, 7, 9, 11, 12, 13, 15]),
    # O trigo do campo (era um colchao de palha sobre laje), a cinza do vulcao (era
    # uma mancha de sangue) e o lago (dois ladrilhos de riacho, sem margem).
    ('trigo', 'ladrilhos-pro/c5a7b816-6242-4e0a-a6ae-57c0826a0be6', [0, 1, 2, 3, 5, 6, 8, 9, 11, 12, 13, 14]),
    ('cinza', 'ladrilhos-pro/d02cf792-6777-4089-998c-201fa5ebe524', [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 15]),
    ('lago', 'ladrilhos-pro/1dace23a-dade-40f8-a183-e4ebd344d5e2', [0, 1, 2, 3]),
    ('margem', 'ladrilhos-pro/1dace23a-dade-40f8-a183-e4ebd344d5e2', [15]),
    # A teia no chao do armazem e da rua ao lado (terreno dificil).
    ('teia', 'ladrilhos-pro/aa8ebdee-8a44-4b02-b864-6b9b14004d8b', [0, 2, 3, 4, 5, 8, 10, 11, 13]),
    # CAVERNA ONDA ECO (`ladrilhos-pro.py --conjunto ondaEcoChao`): chao de mina, laje lavrada, canal seco,
    # margem de conchas, tapete de fungos e agua escura, todos da MESMA leva (o mesmo pintor).
    ('mina', 'ladrilhos-pro/3f925c44-c4d6-476e-bc04-8efae0ade1fa', [0, 1, 2, 3]),
    ('lajeMina', 'ladrilhos-pro/3f925c44-c4d6-476e-bc04-8efae0ade1fa', [4, 5, 6]),
    ('canal', 'ladrilhos-pro/3f925c44-c4d6-476e-bc04-8efae0ade1fa', [7, 8]),
    ('conchas', 'ladrilhos-pro/3f925c44-c4d6-476e-bc04-8efae0ade1fa', [9, 10]),
    ('fungos', 'ladrilhos-pro/3f925c44-c4d6-476e-bc04-8efae0ade1fa', [11, 12, 13]),
    ('aguaEscura', 'ladrilhos-pro/3f925c44-c4d6-476e-bc04-8efae0ade1fa', [14, 15]),
]


# A laje vem clara (e pedra ao sol). Escurecer e multiplicar: o desenho e as
# juntas ficam, e o fator deixa o chao um degrau abaixo da parede do kit --
# chao mais escuro que parede e o que separa um do outro de longe.
# As fileiras de decalque sairam da leva com a pedra mais clara que a da
# `laje`, e no tabuleiro cada marca lia como um losango PALIDO posto por
# cima do chao, em vez de uma marca NO chao. Medido: 0,86 poe a laje no tom
# do kit de construcao, e 0,74 poe os decalques no tom da laje.
ESCURECER = {'fungos': 1.3, 'mina': 0.8, 'lajeMina': 0.88, 'canal': 0.86, 'cinza': 0.72, 'margem': 0.8, 'lajeRuina': 0.92, 'lajeEntulho': 0.92, 'laje': 0.86, 'ossos': 0.74, 'mancha': 0.74, 'cacos': 0.74, 'musgoChao': 0.74}


def escurecer(t, f):
    t = t.copy()
    px = t.load()
    for y in range(t.height):
        for x in range(t.width):
            r, g, b, a = px[x, y]
            if a:
                px[x, y] = (int(r * f), int(g * f), int(b * f), a)
    return t


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


# Os chaos da Onda Eco (ladrilhos-pro `ondaEcoChao`) vieram com uma FAIXA escura de 4 px nas duas bordas de cima do
# losango (o PixelLab pinta ali a "quina" do bloco). `limpar_aresta` so refaz o pixel da aresta; a faixa, de 4 px,
# virava no tabuleiro um vao escuro entre uma casa e outra, como se fossem lajotas soltas. A faixa e refeita a partir do
# miolo do proprio ladrilho, sem inventar cor.
FAIXA_ESCURA = {'mina', 'lajeMina', 'canal', 'conchas', 'fungos', 'aguaEscura'}
LARGURA_FAIXA = 10


def limpar_faixa(t):
    """Refaz a faixa espelhando o miolo logo abaixo dela; onde o espelho cairia num veio escuro (o rejunte), usa o tom
    mediano do miolo. Assim o ladrilho fica liso nas bordas de cima e a casa ao lado emenda sem vao."""
    from losango import no_losango

    def dist(x, y):               # quantos pixels do losango ha acima, seguidos
        k = 0
        while y - k - 1 >= 0 and no_losango(x, y - k - 1):
            k += 1
        return k

    out = t.copy()
    s, d = t.load(), out.load()
    miolo = [s[x, y] for y in range(TH) for x in range(TW) if no_losango(x, y) and dist(x, y) >= LARGURA_FAIXA]
    miolo.sort(key=_lum)
    mediano = miolo[len(miolo) // 2]
    claro = _lum(mediano) * 0.85
    for x in range(TW):
        ys = [y for y in range(TH) if no_losango(x, y)]
        if not ys:
            continue
        limpo = next((y for y in ys if dist(x, y) >= LARGURA_FAIXA), None)
        if limpo is None:               # as pontas esquerda e direita: so ha faixa, sem miolo por baixo
            for y in ys:
                if _lum(s[x, y]) < claro:
                    d[x, y] = mediano
            continue
        for y in ys:
            if dist(x, y) >= LARGURA_FAIXA or _lum(s[x, y]) >= claro:
                continue
            fonte = limpo + (limpo - 1 - y)
            ok = fonte in ys and dist(x, fonte) >= LARGURA_FAIXA and _lum(s[x, fonte]) >= claro
            d[x, y] = s[x, fonte] if ok else mediano
    return out


# MAIS VARIACAO nos chaos da Onda Eco: uma superficie com 2 ladrilhos vira papel de parede (a mesma cruz de rejunte, os
# mesmos pontinhos no mesmo canto em cada casa). Cada ladrilho ganha o seu espelho (o losango e simetrico) e, na laje, uma
# versao sem o rejunte em cruz (as lajes de verdade ora tem junta, ora nao).
VARIANTES_EXTRA = {'mina', 'lajeMina', 'canal', 'conchas', 'fungos', 'aguaEscura'}


def reencaixar(t):
    """A particao exata do losango (fileiras de 4, 8 .. 64 e de volta a 0) e simetrica em x mas NAO em y: virado de cabeca
    para baixo, 64 pixels caem fora e 64 ficam vazios. Os de fora saem, e os vazios copiam o vizinho de dentro mais perto."""
    from losango import no_losango
    out = t.copy()
    s, d = t.load(), out.load()
    for y in range(TH):
        for x in range(TW):
            if not no_losango(x, y):
                d[x, y] = (0, 0, 0, 0)
            elif s[x, y][3] == 0:
                for r in range(1, 4):
                    viz = [s[x + i, y + j] for i in range(-r, r + 1) for j in range(-r, r + 1)
                           if 0 <= x + i < TW and 0 <= y + j < TH and no_losango(x + i, y + j) and s[x + i, y + j][3]]
                    if viz:
                        d[x, y] = viz[0]
                        break
    return out


def sem_rejunte(t):
    from losango import no_losango
    out = t.copy()
    s, d = t.load(), out.load()
    vivos = sorted(_lum(s[x, y]) for y in range(TH) for x in range(TW) if no_losango(x, y) and s[x, y][3])
    limite = vivos[len(vivos) // 2] * 0.86
    for y in range(TH):
        for x in range(TW):
            if not (no_losango(x, y) and s[x, y][3]) or _lum(s[x, y]) >= limite:
                continue
            claros = [s[x + i, y + j] for i in range(-2, 3) for j in range(-2, 3)
                      if 0 <= x + i < TW and 0 <= y + j < TH and no_losango(x + i, y + j) and s[x + i, y + j][3]
                      and _lum(s[x + i, y + j]) >= limite]
            if claros:
                claros.sort(key=_lum)
                d[x, y] = claros[len(claros) // 2]
    return out


def tapar_furos(t):
    """
    Pinta os furos do losango com a cor mais escura do proprio ladrilho.

    As tabuas da ponte vem com o vao entre uma e outra transparente: no
    tabuleiro o vao mostraria o fundo do canvas. A cor mais escura da peca e a
    sombra entre as tabuas -- nao inventa cor.
    """
    from losango import no_losango
    out = t.copy()
    px = out.load()
    acesos = [px[x, y] for y in range(TH) for x in range(TW) if no_losango(x, y) and px[x, y][3]]
    if not acesos:
        return out
    escura = min(acesos, key=_lum)
    for y in range(TH):
        for x in range(TW):
            if no_losango(x, y) and px[x, y][3] == 0:
                px[x, y] = escura[:3] + (255,)
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
    for linha, (nome, leva, *quais) in enumerate(FILEIRAS):
        pasta = (PIXELLAB / leva) if '/' in leva else (LEVAS / leva)
        arqs = sorted(pasta.glob('tile_*.png'), key=lambda p: int(p.stem.split('_')[1]))
        # Uma leva de ladrilhos tem 16; um kit de construcao tem 58, e dele so
        # interessam os indices do piso.
        assert len(arqs) in (16, 58), f'{nome}: esperava 16 ou 58, achei {len(arqs)}'
        # Leva de varias superficies (chao, riacho e poco juntos): a fileira
        # pega so os ladrilhos dela.
        if quais:
            arqs = [arqs[i] for i in quais[0]]
        candidatos = []
        for a in arqs:
            im = Image.open(a).convert('RGBA')
            base = im.getbbox()[3]
            t = recortar_topo(im, 0, base - TH)
            if quais:
                t = tapar_furos(t)
            if nome in FAIXA_ESCURA:
                t = limpar_faixa(t)
            if nome in ESCURECER:
                t = escurecer(t, ESCURECER[nome])
            candidatos.append(t)
        medidas = [tom_e_aresta(t) for t in candidatos]
        mediana = sorted(m for m, _ in medidas)[len(medidas) // 2]
        topos = []
        fora = []
        # Fileira escolhida a dedo (as do esconderijo): a escolha ja foi feita
        # olhando, e o filtro fica mais largo. A pedra da caverna escurece a
        # aresta mais que a grama (ate -19; a ponte, -26), e a limpeza tira a fileira de
        # fora de qualquer jeito; com dois ladrilhos so, nao ha mediana.
        desvio, aresta_min = (9.0, -30.0) if quais else (DESVIO_MAX, ARESTA_MIN)
        # O campo e a agua ficam em extensao: sem aresta escura e sem tom que pule, ou viram grade.
        if nome in ('lago', 'cinza'):
            desvio, aresta_min = 8.0, -40.0
        if nome == 'teia':          # o fio claro da teia escurece a aresta antes da limpeza
            desvio, aresta_min = 14.0, -60.0
        if quais and len(candidatos) <= 2:
            desvio = 99.0
        for i, (t, (m, a)) in enumerate(zip(candidatos, medidas)):
            if abs(m - mediana) <= desvio and a >= aresta_min:
                t = limpar_aresta(t)
                if nome in ('lago', 'cinza') and tom_e_aresta(t)[1] < -9.0:
                    fora.append(f'{i} (aresta depois da limpeza {tom_e_aresta(t)[1]:+.1f})')
                    continue
                atlas.alpha_composite(t, (len(topos) * TW, linha * TH))
                topos.append(t)
            else:
                fora.append(f'{i} (tom {m - mediana:+.1f}, aresta {a:+.1f})')
        if nome in VARIANTES_EXTRA:
            for k, base in enumerate(list(topos)):
                if nome in ('mina', 'rocha'):  # terra batida e rocha nao tem rejunte: a cruz e defeito
                    base = sem_rejunte(base)
                    atlas.alpha_composite(base, (k * TW, linha * TH))
                    topos[k] = base
                # O losango e simetrico nos dois eixos: o espelho em x, em y e a volta de 180 graus tambem encaixam, e o
                # "carimbo" (a mancha, o cogumelo) cai num canto diferente em cada um.
                def giros(im):
                    return [im.transpose(Image.FLIP_LEFT_RIGHT), reencaixar(im.transpose(Image.FLIP_TOP_BOTTOM)),
                            reencaixar(im.transpose(Image.ROTATE_180))]
                extras = giros(base)
                if nome == 'lajeMina':         # as juntas ficam so nos originais: poucas casas, nao todas
                    solta = sem_rejunte(base)
                    extras = [solta, *giros(solta)]
                for e in extras:
                    atlas.alpha_composite(e, (len(topos) * TW, linha * TH))
                    topos.append(e)
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
    out = Image.new('RGB', (w, max(r.height for _, r in previa) * Z + 24), (27, 22, 16))
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
    # A arte da taverna entra DEPOIS dos atlas (e regerar um atlas a apaga): refaz sozinho, sem gastar geração.
    import subprocess
    import sys
    from pathlib import Path
    subprocess.run([sys.executable, '-P', str(Path(__file__).with_name('acrescentar-taverna.py'))], check=True)
