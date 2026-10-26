# -*- coding: utf-8 -*-
"""
A tira das oito vistas do DRAGAO VERDE, montada a partir do desenho do dono,
sem geracao.

O dono gerou numa ferramenta dele uma folha com oito vistas rotuladas, de quatro
patas. Cinco vieram certas -- sul, sudeste, leste, nordeste e norte -- e tres
vieram erradas: oeste, noroeste e sudoeste sao a MESMA imagem repetida, o
dragao de frente com a cabeca virada a direita. Essas tres sao justamente as
que se fazem por ESPELHO das boas (oeste = leste invertido, e assim por
diante), entao saem daqui, e nao da folha.

Tres cuidados que as outras tiras do projeto nao precisaram:

1. UMA ESCALA SO para as cinco vistas. Cada uma veio de uma geracao separada,
   mas as alturas batem (281 a 291 px). Reduzir cada uma para a mesma altura
   apagaria essa proporcao; reduzir todas pelo mesmo fator a preserva.
2. UMA PALETA SO para as oito. Geracoes separadas dao verdes um pouco
   diferentes, e o dragao trocaria de tom ao virar. O corte por mediana roda
   sobre as oito juntas, e o olho vermelho e o dourado das garras ficam
   guardados a parte (pouco pixel, o corte os afogava).
3. OS PES NA MESMA LINHA. Cada figura e alinhada pelo pe, no fundo da celula,
   e centrada pela largura: e o que faz o bicho nao pular ao trocar de vista.

    python src/dev/dragao-tira.py
"""
from pathlib import Path

import numpy as np
from PIL import Image

RAIZ = Path(__file__).resolve().parents[2]
REF = RAIZ / '_referencias/pixellab/dragaoVerde-ref'
SAIDA = RAIZ / '_referencias/pixellab/edicoes/dragao-dono-oito/tira.png'

ALVO = 160          # altura de referencia: a media das cinco vistas vira isto
CORES = 22
MARGEM = 2          # px de folga no fundo e nos lados da celula
# O vermelho do olho: o mesmo do desenho de uma vista so que o dono aprovou
# antes desta folha (medido na conversao dele, `dono-final.png`).
OLHO = np.array([0xae, 0x2a, 0x35])


def eh_branco(a):
    """Fundo por saturacao e brilho, nao por igualdade a branco (ver reduzir.py)."""
    mx, mn = a.max(axis=2), a.min(axis=2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    return (mx > 215) & (sat < 0.12)


def maior_bloco(op):
    """So o maior pedaco contiguo (vizinhanca de 8) de uma mascara."""
    from collections import deque
    H, W = op.shape
    rot = np.zeros((H, W), dtype=np.int32)
    melhor, tam = 0, 0
    n = 0
    for y in range(H):
        for x in range(W):
            if op[y, x] and not rot[y, x]:
                n += 1
                fila, conta = deque([(y, x)]), 0
                rot[y, x] = n
                while fila:
                    cy, cx = fila.popleft()
                    conta += 1
                    for dy in (-1, 0, 1):
                        for dx in (-1, 0, 1):
                            ny, nx = cy + dy, cx + dx
                            if 0 <= ny < H and 0 <= nx < W and op[ny, nx] and not rot[ny, nx]:
                                rot[ny, nx] = n
                                fila.append((ny, nx))
                if conta > tam:
                    melhor, tam = n, conta
    return rot == melhor


def sem_fundo(caminho):
    """A figura recortada justa, com alfa: o fundo branco vira transparente."""
    a = np.array(Image.open(caminho).convert('RGB')).astype(int)
    fundo = eh_branco(a)
    # O recorte da folha trouxe LASCAS da vista vizinha (no norte, um pedaco de
    # asa na borda esquerda), e elas tambem empurravam o dragao para fora do
    # centro. Fica so o MAIOR bloco contiguo, que e o dragao.
    fundo = ~maior_bloco(~fundo)
    ys, xs = np.where(~fundo)
    a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    fundo = fundo[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    # O OLHO. Na folha do dono ele e um vermelho AMARRONZADO e escuro (#643e3b
    # no sudeste): de perto le como vermelho, mas tem dois ou tres pixels, e na
    # reducao vira um so, misturado ao verde -- some. Entao ele e marcado AQUI,
    # na imagem grande, e pintado de volta depois, como um pixel-artista faria a
    # mao. So na regiao da cabeca (terco de cima) e so pixel escuro, para nao
    # pegar o bege claro dos chifres, que tambem e "mais vermelho que verde".
    ver = a[:, :, 0] - np.maximum(a[:, :, 1], a[:, :, 2])
    cabeca = np.zeros_like(fundo)
    cabeca[: max(1, a.shape[0] * 35 // 100)] = True
    olho = cabeca & ~fundo & (((ver >= 12) & (a.max(axis=2) < 120)) | (ver >= 22))
    # sangra a cor do vizinho para dentro do fundo antes de reduzir (franja)
    cor, m = a.copy(), fundo.copy()
    for _ in range(10):
        if not m.any():
            break
        soma, cont = np.zeros_like(cor), np.zeros(m.shape)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            soma += np.roll(cor, (dy, dx), (0, 1)) * np.roll(~m, (dy, dx), (0, 1))[:, :, None]
            cont += np.roll(~m, (dy, dx), (0, 1))
        pode = m & (cont > 0)
        cor[pode] = soma[pode] / cont[pode][:, None]
        m = m & ~pode
    return Image.fromarray(np.dstack([cor, np.where(fundo, 0, 255)]).astype('uint8')), olho


def main():
    boas = {'south': 'sul', 'south-east': 'sudeste', 'east': 'leste',
            'north-east': 'nordeste', 'north': 'norte'}
    lidas = {d: sem_fundo(REF / f'dono8-{n}.png') for d, n in boas.items()}
    figs = {d: f for d, (f, _) in lidas.items()}
    olhos_grandes = {d: o for d, (_, o) in lidas.items()}
    fator = ALVO / np.mean([f.size[1] for f in figs.values()])
    print(f'alturas na folha: {[f.size[1] for f in figs.values()]}  fator {fator:.3f}')
    red = {}
    for d, f in figs.items():
        r = f.resize((round(f.size[0] * fator), round(f.size[1] * fator)), Image.LANCZOS)
        a = np.array(r)
        a[:, :, 3] = np.where(a[:, :, 3] >= 128, 255, 0)
        red[d] = a
    # o olho, levado para a escala reduzida: cada pixel de olho grande marca o
    # pixel pequeno em que cai
    olhos = {}
    for d, og in olhos_grandes.items():
        h, w = red[d].shape[:2]
        o = np.zeros((h, w), dtype=bool)
        ys, xs = np.where(og)
        o[np.clip((ys * fator).astype(int), 0, h - 1), np.clip((xs * fator).astype(int), 0, w - 1)] = True
        o = o & (red[d][:, :, 3] > 0)
        # Pixel de "olho" longe do grupo nao e olho. No sul, um ponto escuro e
        # avermelhado na base do chifre direito, a 25 px do rosto, passava no
        # detector. Os olhos de verdade ficam juntos (no sul, os dois a 15 px um
        # do outro, simetricos ao focinho): fica so o que esta perto da mediana.
        ys, xs = np.where(o)
        if len(ys):
            my, mx_ = np.median(ys), np.median(xs)
            longe = (np.abs(xs - mx_) > 18) | (np.abs(ys - my) > 8)
            o[ys[longe], xs[longe]] = False
        olhos[d] = o
        print(f'  olho {d:11s} {int(og.sum()):3d} px grandes -> {int(olhos[d].sum())} px')
    # as tres que faltam, por espelho (o olho espelha junto)
    for novo, base in (('west', 'east'), ('south-west', 'south-east'), ('north-west', 'north-east')):
        red[novo] = red[base][:, ::-1].copy()
        olhos[novo] = olhos[base][:, ::-1].copy()

    # UMA paleta para as oito: corte por mediana nos pixels opacos de todas
    todos = np.concatenate([a[a[:, :, 3] > 0][:, :3] for a in red.values()])
    amostra = Image.fromarray(todos.reshape(-1, 1, 3).astype('uint8'))
    pal = np.array([c for _, c in amostra.quantize(colors=CORES - 2, method=Image.MEDIANCUT,
                                                    dither=Image.NONE).convert('RGB')
                    .getcolors(1 << 16)], dtype=int)
    t = todos.astype(int)
    mx, mn = t.max(axis=1), t.min(axis=1)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    quente = (t[:, 0] > t[:, 2] + 40) & (t[:, 0] >= t[:, 1] - 10)
    dist = np.min(np.linalg.norm(t[:, None, :] - pal[None, :, :], axis=2), axis=1)
    acento = t[quente & (sat > 0.45) & (mx > 90) & (dist > 45)]
    if len(acento):
        # Separados pela MATIZ. A primeira versao separava pela razao verde/
        # vermelho, e o olho -- que na reducao se mistura ao verde escuro em
        # volta e vira vermelho-amarronzado -- caia no grupo do dourado e era
        # diluido nas garras: o olho vermelho sumiu da tira. Matiz abaixo de
        # 0,055 e vermelho (olho); acima e laranja/dourado (garra).
        import colorsys
        matiz = np.array([colorsys.rgb_to_hsv(*(c / 255))[0] for c in acento])
        verm = (matiz < 0.055) | (matiz > 0.95)
        extras = [g.mean(axis=0).round().astype(int) for g in (acento[verm], acento[~verm]) if len(g)]
        print(f'pixels de destaque: {int(verm.sum())} vermelhos, {int((~verm).sum())} dourados')
        pal = np.vstack([pal] + extras)
        print('destaques guardados:', ' '.join('#%02x%02x%02x' % tuple(e) for e in extras))

    larg = max(a.shape[1] for a in red.values()) + 2 * MARGEM
    alt = max(a.shape[0] for a in red.values()) + MARGEM
    cw, ch = (larg + 3) // 4 * 4, (alt + 3) // 4 * 4
    if cw > 256 or ch > 256:
        raise SystemExit(f'celula {cw}x{ch} passa de 256')
    ordem = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west']
    tira = np.zeros((ch, cw * 8, 4), dtype='uint8')
    for i, d in enumerate(ordem):
        a = red[d]
        op = a[:, :, 3] > 0
        idx = np.argmin(np.linalg.norm(a[:, :, None, :3].astype(int) - pal[None, None, :, :], axis=3), axis=2)
        cor = pal[idx].astype('uint8')
        cor[olhos[d]] = OLHO
        cel = np.dstack([cor, np.where(op, 255, 0)]).astype('uint8')
        cel[~op] = 0
        h, w = cel.shape[:2]
        x0 = i * cw + (cw - w) // 2
        y0 = ch - MARGEM - h                      # pe no fundo da celula
        dest = tira[y0:y0 + h, x0:x0 + w]
        dest[op] = cel[op]
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(tira).save(SAIDA)
    cores = len({tuple(p) for p in tira.reshape(-1, 4) if p[3]})
    print(f'tira {SAIDA.relative_to(RAIZ)}  celula {cw}x{ch}  {cores} cores')


if __name__ == '__main__':
    main()
