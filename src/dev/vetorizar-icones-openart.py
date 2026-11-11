"""Transforma uma PÁGINA de ícones gerada no OpenArt (silhuetas pretas sobre branco, numa grade) em desenhos de traço do
jogo: um caminho SVG por ícone, na caixa de 512 da game-icons.net, com o mesmo enquadramento dela.

    python src/dev/vetorizar-icones-openart.py <imagem> <colunas>x<linhas> <chave1,chave2,...> [--saida arquivo.json]

A imagem vai para `_referencias/icones-openart/` (fora do repositório); o resultado, `{ chave: [d, ...] }`, vai para
`src/dev/icones-traco/proprios/<nome>.json`, que `importar-icones-traco.mjs` junta à coleção (o de-para aponta para
`proprio:<chave>`).

COMO: cada célula da grade é recortada, o cinza vira preto ou branco pelo limiar de Otsu, o OpenCV acha os contornos com
a hierarquia (fora e furo), cada um é simplificado a 0,6 px na escala de 512 e orientado ao contrário do pai (fora num
sentido, furo no outro), que é o que o preenchimento padrão do canvas (`nonzero`) precisa para o furo sair furo. O
desenho é enquadrado como a coleção: o lado maior em 92% da caixa, no meio.

A CONFERÊNCIA contra a coleção (ver `julgar`, com as medidas de `pranchas-icones.py`) e, antes dela, a primeira, que
é só de recorte (medida em 300 ícones dela: lado maior em 88% a 94% da caixa, tinta de 27% a 56% do
retângulo do desenho): reprova o ícone vazio, o que encosta na borda da célula (vazou da vizinha ou foi cortado) e o
que tem tinta fora de 8% a 68% (objeto fino na diagonal enche pouco: a flauta da coleção tem 13%). Peça solta NÃO reprova: o olho com anéis em volta, os passos de pata, a coleção
também tem desenho em várias peças (a primeira versão reprovava isso e errou na Consciência Primordial). O relatório diz o motivo de cada reprovação.
"""
import json
import os
import sys

import cv2
import numpy as np

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LADO = 512
OCUPA = 0.92
TINTA = (0.08, 0.68)  # abaixo de 0,08 é quase vazio; a flauta da coleção tem 0,13


def orientar(pts, positivo):
    area = cv2.contourArea(pts, oriented=True)
    return pts if (area > 0) == positivo else pts[::-1]


def vetorizar(celula):
    cinza = cv2.cvtColor(celula, cv2.COLOR_BGR2GRAY) if celula.ndim == 3 else celula
    _, bw = cv2.threshold(cinza, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    # tira o pó: componente de menos de 0,2% da célula some
    n, rotulos, stats, _ = cv2.connectedComponentsWithStats(bw, 8)
    minimo = 0.002 * bw.size
    grandes = [i for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] >= minimo]
    # PECINHA: menos de 1,5% da maior parte. Linha de movimento, gota e faísca somem em 20 px e foram o que a revisão
    # apontou como "estilo HQ" que a coleção não usa (a Ação, a Consciência Primordial). A estrela do atordoado fica:
    # ela é maior que isso.
    if grandes:
        maior = max(stats[i, cv2.CC_STAT_AREA] for i in grandes)
        grandes = [i for i in grandes if stats[i, cv2.CC_STAT_AREA] >= 0.015 * maior]
    limpo = np.isin(rotulos, grandes).astype(np.uint8) * 255
    ys, xs = np.nonzero(limpo)
    if not len(xs):
        return None, {'motivo': 'vazio'}
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    w, h = x1 - x0 + 1, y1 - y0 + 1
    tinta = float(limpo[y0:y1 + 1, x0:x1 + 1].sum() / 255 / (w * h))
    # partes soltas GRANDES (mais de 15% da tinta): figura que vazou de outra célula, ou duas figuras
    areas = sorted((stats[i, cv2.CC_STAT_AREA] for i in grandes), reverse=True)
    soltas = sum(1 for a in areas[1:] if a > 0.15 * sum(areas))
    medida = {'tinta': round(tinta, 2), 'partes': len(grandes), 'soltasGrandes': soltas}
    if not TINTA[0] <= tinta <= TINTA[1]:
        medida['motivo'] = f'tinta {tinta:.2f} fora de {TINTA}'
    escala = LADO * OCUPA / max(w, h)
    ox = (LADO - w * escala) / 2 - x0 * escala
    oy = (LADO - h * escala) / 2 - y0 * escala
    contornos, hier = cv2.findContours(limpo, cv2.RETR_TREE, cv2.CHAIN_APPROX_NONE)
    if hier is None:
        return None, {'motivo': 'sem contorno'}
    hier = hier[0]
    profundidade = []
    for i in range(len(contornos)):
        p, d = hier[i][3], 0
        while p != -1:
            d, p = d + 1, hier[p][3]
        profundidade.append(d)
    partes = []
    for c, prof in zip(contornos, profundidade):
        if cv2.contourArea(c) < 4:
            continue
        aprox = cv2.approxPolyDP(c, 0.6 / escala, True).reshape(-1, 2).astype(float)
        if len(aprox) < 3:
            continue
        aprox = orientar(aprox.astype(np.float32), prof % 2 == 0)
        pts = [(x * escala + ox, y * escala + oy) for x, y in aprox]
        partes.append('M' + 'L'.join(f'{x:.1f} {y:.1f}' for x, y in pts) + 'Z')
    return [''.join(partes)], medida


# AS MEDIDAS são as de `pranchas-icones.py` (a mesma conta para a coleção e para o novo). Os limites saíram da coleção,
# medida em 400 ícones dela, e da revisão do teste de 8 (revisoes/interface-2026-11-09.md):
#   REPROVA  espessura < 3,0% do lado · detalhe > 25 · leitura em 20 px < 0,58 · tinta acima de 0,68
#   REVISAR  fora da faixa p10–p90 da coleção: espessura < 3,9 · detalhe > 21,5 · leitura20 < 0,60 · tinta fora de 0,25–0,59 (abaixo de 0,22: objeto fino)
# Detalhe BAIXO não conta: o ícone simples demais não destoa da coleção, que também tem os seus.
import importlib.util as _iu
_sp = _iu.spec_from_file_location('pranchas', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pranchas-icones.py'))
pranchas = _iu.module_from_spec(_sp)
_sp.loader.exec_module(pranchas)


def julgar(m):
    reprova = []
    if m['espessura%'] < 3.0: reprova.append(f"traço fino ({m['espessura%']}%)")
    if m['detalhe'] > 25: reprova.append(f"detalhe demais ({m['detalhe']})")
    if m['leitura20'] < 0.58: reprova.append(f"some em 20 px ({m['leitura20']})")
    # Tinta BAIXA não reprova: objeto fino na diagonal enche pouco o retângulo dele, e a coleção também (a flauta tem
    # 0,13 e a espada larga 0,22, medido). Só a tinta ALTA reprova, que é o borrão chapado sem miolo.
    if m['tinta'] > 0.68: reprova.append(f"tinta {m['tinta']} (borrão)")
    if reprova:
        return 'REPROVA', reprova
    revisar = []
    if m['espessura%'] < 3.9: revisar.append('traço no limite')
    if m['detalhe'] > 21.5: revisar.append('detalhe no limite')
    if m['leitura20'] < 0.60: revisar.append('20 px no limite')
    if m['tinta'] < 0.22: revisar.append('tinta baixa (objeto fino?)')
    elif not 0.25 <= m['tinta'] <= 0.59: revisar.append('tinta no limite')
    return ('REVISAR', revisar) if revisar else ('ok', [])


def main():
    imagem, grade, chaves = sys.argv[1], sys.argv[2], sys.argv[3].split(',')
    saida = sys.argv[sys.argv.index('--saida') + 1] if '--saida' in sys.argv else None
    cols, linhas = (int(v) for v in grade.lower().split('x'))
    img = cv2.imread(imagem, cv2.IMREAD_COLOR)
    H, W = img.shape[:2]
    resultado, relatorio = {}, []
    for i, chave in enumerate(chaves):
        c, r = i % cols, i // cols
        # um respiro de 3% da célula em cada lado: a figura que encosta na borda já é sinal de vazamento
        cx0, cx1 = int(W * c / cols), int(W * (c + 1) / cols)
        cy0, cy1 = int(H * r / linhas), int(H * (r + 1) / linhas)
        celula = img[cy0:cy1, cx0:cx1]
        d, medida = vetorizar(celula)
        # tinta encostando na borda da célula: vazou de/para a vizinha
        cinza = cv2.cvtColor(celula, cv2.COLOR_BGR2GRAY)
        borda = np.concatenate([cinza[0, :], cinza[-1, :], cinza[:, 0], cinza[:, -1]])
        if (borda < 128).mean() > 0.01:
            medida['motivo'] = medida.get('motivo') or 'encosta na borda da célula (cortado)'
        veredito, porque = ('REPROVA', [medida['motivo']]) if 'motivo' in medida else ('REPROVA', ['vazio'])
        if d and 'motivo' not in medida:
            m = pranchas.medidas(d)
            medida.update(m)
            veredito, porque = julgar(m)
            if veredito != 'REPROVA':
                resultado[chave] = d
        relatorio.append((chave, veredito, porque, medida))
    for chave, v, porque, m in relatorio:
        print(f"{v:8s} {chave:34s} {', '.join(porque) or ''}  {{espessura {m.get('espessura%')}, detalhe {m.get('detalhe')}, leitura20 {m.get('leitura20')}, tinta {m.get('tinta')}}}")
    print(f"{sum(1 for r in relatorio if r[1] == 'ok')} ok, {sum(1 for r in relatorio if r[1] == 'REVISAR')} para revisar, "
          f"{sum(1 for r in relatorio if r[1] == 'REPROVA')} reprovados, de {len(chaves)}.")
    if saida:
        os.makedirs(os.path.dirname(saida), exist_ok=True)
        antes = json.load(open(saida, encoding='utf8')) if os.path.exists(saida) else {}
        antes.update(resultado)
        json.dump(antes, open(saida, 'w', encoding='utf8'), indent=0)
        print('->', os.path.relpath(saida, RAIZ))


if __name__ == '__main__':
    main()
