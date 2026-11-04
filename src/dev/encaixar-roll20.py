"""Casa a planta de uma cena DO JOGO com o mapa oficial da mesma cena no Roll20, e imprime o `fundo`.

    node --import ./src/dev/cena-node/register.mjs src/dev/exportar-plantas.mjs mansao > src/dev/_tmp/plantas.json
    python src/dev/encaixar-roll20.py mansao            # mede e grava a prova visual
    python src/dev/encaixar-roll20.py --todas

Mede, nao acha. Compara o CHAO das duas plantas (a nossa, em casas; a do Roll20, extraida da propria pagina) e
procura a escala e o deslocamento que mais fazem as duas coincidirem. Devolve o IoU, que diz se a nossa planta e
uma copia da oficial (acima de ~0,8) ou um desenho proprio que so lembra ela (abaixo disso) — e, no primeiro
caso, o bloco `fundo` pronto para colar em `game/encounter.js`.

POR QUE A ESCALA NAO E 70. A pagina do Roll20 tem a casa travada em 70 px, mas a IMAGEM que o CDN entrega vem
reduzida (2048 px no lado maior) e e esticada de volta na pagina. A conta que vale e `lado da pagina em px / lado
da imagem em px`: no Esconderijo e na Mansao da 68,267 px por casa, no Castelo 67,15 e na Onda Eco 40,95. Medir
a grade desenhada na imagem NAO funciona — ja foi tentado, e a faixa estreita cai num harmonico.

A imagem fica em `_referencias/roll20/imagens/`, fora do versionamento: e mapa publicado de terceiro, serve de
referencia de trabalho. Em jogo, o `fundo.url` aponta para o CDN do Roll20 — nada e copiado para o repositorio.
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R20 = os.path.join(RAIZ, '_referencias', 'roll20')
TMP = os.path.join(RAIZ, 'src', 'dev', '_tmp')

PARES = {
    'esconderijo': '2-cragmaw-hideout',
    'mansao': '4-redbrand-hideout',
    'castelo': '5-cragmaw-castle',
    'ondaEco': '6-wave-echo-cave',
    'arvoreTrovao': 'ruins-of-thundertree',
}
# A nossa planta traz `bloqueia` vindo do MOTOR (`exportar-plantas.mjs`), e nao um conjunto de letras chutado:
# cada cena tem o seu alfabeto — o Castelo nem usa `R` — e comparar por glifo ja deu numero sem sentido.
# A do Roll20 nasce da propria pagina, com `_` de chao e `R` de rocha.


def chaoNosso(planta):
    return np.array([[0.0 if c == '1' else 1.0 for c in l] for l in planta['bloqueia']], dtype=np.float32)


def chaoDeles(linhas):
    return np.array([[1.0 if c == '_' else 0.0 for c in l] for l in linhas], dtype=np.float32)


def pagina(nome):
    """A pagina extraida, com o terreno, a colocacao da imagem e quantos px da imagem valem uma casa."""
    d = json.load(open(os.path.join(R20, f'{nome}-mapa.json'), encoding='utf-8'))
    bruto = json.load(open(os.path.join(R20, 'paginas.json'), encoding='utf-8'))
    posta = next(v['mapa'] for v in bruto.values() if v['mapa'] and nome.split('-', 1)[1] in v['mapa']['src'] or
                 v['mapa'] and d['fundo']['url'].split('/images/')[-1].split('/')[0] in v['mapa']['src'])
    img = Image.open(os.path.join(R20, 'imagens', f'{nome}.jpg'))
    return d, posta, img


def encaixar(cena, plantas, provas=True):
    nome = PARES[cena]
    d, posta, img = pagina(nome)
    a = chaoNosso(plantas[cena])
    b = chaoDeles(d['terreno'])
    H, W = b.shape

    def iou(s, dx, dy):
        ys = np.clip(((np.arange(H) + .5 - dy) / s).astype(int), 0, a.shape[0] - 1)
        xs = np.clip(((np.arange(W) + .5 - dx) / s).astype(int), 0, a.shape[1] - 1)
        r = a[np.ix_(ys, xs)]
        uniao = ((r > 0) | (b > 0)).sum()
        return float(((r > 0) & (b > 0)).sum()) / uniao if uniao else 0.0

    # O deslocamento e procurado em CASAS INTEIRAS: a planta ou e um decalque da oficial, e ai cai na grade
    # dela, ou nao e — meia casa de desvio faria a grade do jogo nunca coincidir com a grade desenhada no mapa.
    # No desempate fica a escala mais perto de 1: 0,97 e 1,00 empatam no IoU, mas 3% somam uma casa de deriva
    # ao longo de trinta.
    todos = [(round(iou(s, dx, dy), 4), -abs(s - 1), -abs(dx) - abs(dy), s, dx, dy)
             for s in np.arange(0.40, 1.61, 0.01)
             for dy in range(-6, 7)
             for dx in range(-6, 7)]
    qual, _, _, s, dx, dy = max(todos)

    # px da IMAGEM por casa DA PAGINA, e depois por casa NOSSA (que a escala `s` encolhe ou estica)
    porCasaDaPagina = posta['w'] / img.width
    escala = d['fundo']['escala'] / porCasaDaPagina * s
    x0 = (dx * d['fundo']['escala'] - (posta['x'] - posta['w'] / 2)) / porCasaDaPagina
    y0 = (dy * d['fundo']['escala'] - (posta['y'] - posta['h'] / 2)) / porCasaDaPagina

    print(f'{cena:14s} {a.shape[1]}x{a.shape[0]} casas  vs  {nome} {W}x{H}')
    print(f'   chao em comum (IoU): {qual:.3f}   escala relativa {s:.2f}   desloc {dx:+.1f},{dy:+.1f} casas')
    print(f"   fundo: {{ nome: '{nome}.jpg', url: '{d['fundo']['url']}', "
          f'escala: {escala:.3f}, x0: {x0:.1f}, y0: {y0:.1f}, giro: 0, opacidade: 1 }},')

    if provas:
        k = 1.0
        capa = img.convert('RGBA')
        tinta = Image.new('RGBA', capa.size, (0, 0, 0, 0))
        dr = ImageDraw.Draw(tinta)
        bloq = plantas[cena]['bloqueia']
        for y, linha in enumerate(plantas[cena]['terreno']):
            for x, c in enumerate(linha):
                px, py = (x * escala + x0) * k, (y * escala + y0) * k
                cor = (210, 40, 30, 110) if bloq[y][x] == '1' else (40, 190, 255, 55)
                dr.rectangle([px, py, px + escala * k, py + escala * k], fill=cor, outline=(255, 255, 255, 50))
        saida = os.path.join(TMP, f'encaixe-roll20-{cena}.png')
        out = Image.alpha_composite(capa, tinta).convert('RGB')
        out.resize((out.width // 2, out.height // 2), Image.LANCZOS).save(saida)
        print('   prova:', saida)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    plantas = json.load(open(os.path.join(TMP, 'plantas-phandelver.json'), encoding='utf-8'))
    cenas = args or list(PARES)
    for cena in cenas:
        if cena not in plantas:
            print(f'{cena}: nao esta em plantas-phandelver.json (rode o exportar-plantas.mjs com ela)')
            continue
        encaixar(cena, plantas, provas='--sem-prova' not in sys.argv)


if __name__ == '__main__':
    main()
