"""Casa a planta de uma cena do jogo com um MAPA PINTADO de verdade (visto de cima).

Mede, nao acha. Faz duas mascaras — a pedra escura da imagem e as arestas `#` da planta — e procura
o giro, a escala e o deslocamento que melhor encaixam uma na outra, por correlacao cruzada (FFT).
Devolve px por casa e onde cai, em pixels, a casa (0,0) do terreno.

    node --import ./src/dev/cena-node/register.mjs src/dev/exportar-plantas.mjs > src/dev/_tmp/plantas.json
    python src/dev/alinhar-mapa-pintado.py                 # todas as cenas
    python src/dev/alinhar-mapa-pintado.py casaDaMorte1    # so uma
    python src/dev/alinhar-mapa-pintado.py --provas        # grava a prova visual de cada encaixe
    python src/dev/alinhar-mapa-pintado.py casaDaMortePorao1 --giro 90 --escala 70 88 --fino --provas

O que ja se aprendeu medindo nestes mapas, para nao repetir o caminho errado:

- O corte de claridade da pedra tem de ser RELATIVO a imagem. Fixo, marcava 77% dos andares de cima como pedra,
  porque eles sao muito mais escuros que o terreo.
- Na MASMORRA, claridade nao separa chao de parede: o chao tem mediana 0,16 e a parede fica na mesma faixa.
  O unico sinal forte ali e o RECORTE do desenho sobre o fundo branco da folha (`molde_silhueta`).
- As marquinhas de ~100 px que o desenho tem nos cantos das lajes NAO sao a grade de 1,5 m: sao as lajotas que o
  artista desenhou. Medir por elas da uma escala ~30% maior que a verdadeira.
- `--fino` repete a busca na imagem inteira, numa faixa estreita de escala. Vale quando a busca reduzida deixa
  duvida: na masmorra 1 ela confirmou, em resolucao cheia, o mesmo 76,8 px/casa que a reduzida tinha achado.
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TMP = os.path.join(RAIZ, 'src', 'dev', '_tmp')
ARTE = os.path.join(RAIZ, '_referencias', 'casa-da-morte-morvold')

PARES = {
    'casaDaMorte1': 'morvold-press-jeff-todd-deathhouse1floor.jpg',
    'casaDaMorte2': 'morvold-press-jeff-todd-deathhouse2floor.jpg',
    'casaDaMorte3': 'morvold-press-jeff-todd-deathhouse3floor.jpg',
    'casaDaMorte4': 'morvold-press-jeff-todd-deathhouse4floor.jpg',
    'casaDaMortePorao1': 'morvold-press-jeff-todd-deathhousebasement1floor.jpg',
    'casaDaMortePorao2': 'morvold-press-jeff-todd-deathhousebasement2floor.jpg',
}
FORA = set('ZRM')      # o que nao e chao de sala: anel de fora da casa e rocha macica
REDUZ = 4             # a busca roda na imagem reduzida; o resultado volta para a escala cheia
FINO = 1              # `--fino`: a mesma busca na imagem inteira, numa faixa estreita de escala


ALVO_PEDRA = 0.28   # fracao da imagem que costuma ser parede num mapa de masmorra/casa


def mascara_pedra(im, alvo=ALVO_PEDRA):
    """Parede: o que e escuro e sem cor.

    O corte de claridade e RELATIVO a imagem, nao fixo: os andares de cima da Casa da Morte sao bem mais
    escuros que o terreo, e um corte fixo marcava 77% da imagem como pedra. Pega-se a fatia mais escura
    entre os pixels sem cor ate cobrir `alvo` da imagem.
    """
    a = np.asarray(im.convert('RGB'), dtype=np.float32) / 255.0
    mx, mn = a.max(axis=2), a.min(axis=2)
    sat = (mx - mn) / np.maximum(mx, 1e-6)
    sem_cor = sat < 0.40
    if sem_cor.mean() <= alvo:
        return sem_cor.astype(np.float32)
    corte = float(np.quantile(mx[sem_cor], alvo / sem_cor.mean()))
    return (sem_cor & (mx <= corte)).astype(np.float32)


def mascara_conteudo(im):
    """O que NAO e o fundo branco da folha. Na masmorra o contorno do desenho e o sinal mais forte que ha."""
    a = np.asarray(im.convert('RGB'), dtype=np.float32) / 255.0
    return (a.min(axis=2) < 0.90).astype(np.float32)


def interior(p):
    """As casas que o mapa pintado desenha.

    Na casa, a parede e de ARESTA: o dentro sai de uma inundacao a partir da borda, barrada por parede e porta.
    Na masmorra nao ha aresta nenhuma — a parede e a ROCHA macica em volta —, entao o dentro e o que nao e rocha.
    """
    w, h, gn, go = p['w'], p['h'], p['n'], p['o']
    if gn is None:
        return {(x, y) for y in range(h) for x in range(w) if p['terreno'][y][x] not in FORA}
    veda = set('#/')
    fora = [[False] * w for _ in range(h)]
    pilha = [(x, y) for y in range(h) for x in range(w) if x in (0, w - 1) or y in (0, h - 1)]
    for x, y in pilha:
        fora[y][x] = True
    while pilha:
        x, y = pilha.pop()
        vizinhos = (
            (x, y - 1, gn[y][x]), (x, y + 1, gn[y + 1][x] if y + 1 < h else '#'),
            (x - 1, y, go[y][x]), (x + 1, y, go[y][x + 1] if x + 1 < w else '#'),
        )
        for nx, ny, aresta in vizinhos:
            if 0 <= nx < w and 0 <= ny < h and aresta not in veda and not fora[ny][nx]:
                fora[ny][nx] = True
                pilha.append((nx, ny))
    return {(x, y) for y in range(h) for x in range(w) if not fora[y][x]}


def caixa(dentro, folga=1):
    """O retangulo que o mapa pintado cobre: o interior mais a espessura da parede."""
    xs = [x for x, _ in dentro]
    ys = [y for _, y in dentro]
    return min(xs) - folga, min(ys) - folga, max(xs) + 1 + folga, max(ys) + 1 + folga


def molde_silhueta(p, dentro, s, cx1, cy1, cx2, cy2):
    """O recorte do desenho: +1 no chao e na parede que o cerca, -1 no vazio em volta.

    Serve a masmorra, onde o fundo da folha e branco: o contorno do mapa inteiro encaixa muito melhor
    do que a pedra, que ali tem quase a mesma cor do chao.
    """
    w, h = int((cx2 - cx1) * s), int((cy2 - cy1) * s)
    perto = {(x + dx, y + dy) for x, y in dentro for dx in (-1, 0, 1) for dy in (-1, 0, 1)}
    desenho = Image.new('F', (w, h), 0.0)
    vazio = Image.new('F', (w, h), 0.0)
    dd, dv = ImageDraw.Draw(desenho), ImageDraw.Draw(vazio)
    for y in range(cy1, cy2):
        for x in range(cx1, cx2):
            caixinha = [(x - cx1) * s, (y - cy1) * s, (x - cx1 + 1) * s, (y - cy1 + 1) * s]
            (dd if (x, y) in perto else dv).rectangle(caixinha, fill=1.0)
    a, b = np.asarray(desenho, dtype=np.float32), np.asarray(vazio, dtype=np.float32)
    if a.sum() < 1 or b.sum() < 1:
        return None
    return a / a.sum() - b / b.sum()


def molde(p, dentro, s, cx1, cy1, cx2, cy2):
    """A planta desenhada em pixels: +1 em cima das paredes, -1 no meio do chao, 0 no resto."""
    w, h = int((cx2 - cx1) * s), int((cy2 - cy1) * s)
    gros = max(2, int(round(s * 0.26)))
    par = Image.new('F', (w, h), 0.0)
    cha = Image.new('F', (w, h), 0.0)
    dp, dc = ImageDraw.Draw(par), ImageDraw.Draw(cha)
    gn, go = p['n'], p['o']
    for y in range(cy1, cy2):
        for x in range(cx1, cx2):
            px, py = (x - cx1) * s, (y - cy1) * s
            # a aresta de cima e parede se o codigo diz, ou se ela separa o dentro do fora
            if (gn and gn[y][x] == '#') or (((x, y) in dentro) != ((x, y - 1) in dentro)):
                dp.rectangle([px, py - gros / 2, px + s, py + gros / 2], fill=1.0)
            if (go and go[y][x] == '#') or (((x, y) in dentro) != ((x - 1, y) in dentro)):
                dp.rectangle([px - gros / 2, py, px + gros / 2, py + s], fill=1.0)
            if (x, y) in dentro:
                dc.rectangle([px + s * 0.3, py + s * 0.3, px + s * 0.7, py + s * 0.7], fill=1.0)
    a, b = np.asarray(par, dtype=np.float32), np.asarray(cha, dtype=np.float32)
    if a.sum() < 1 or b.sum() < 1:
        return None
    return a / a.sum() - b / b.sum()


def correlacionar(M, P):
    """S[dy,dx] = soma de P sobre M deslocada. Devolve o melhor e onde (dy, dx podem ser negativos)."""
    H, W = M.shape
    ph, pw = P.shape
    N = (H + ph, W + pw)
    C = np.fft.irfft2(np.fft.rfft2(M, s=N) * np.conj(np.fft.rfft2(P, s=N)), s=N)
    i = int(np.argmax(C))
    dy, dx = divmod(i, N[1])
    if dy > H:
        dy -= N[0]
    if dx > W:
        dx -= N[1]
    return float(C.flat[i]), dy, dx


def alinhar(planta, caminho, verboso=True, faixa=None, giros=(0, 90, 180, 270), pedra=False, reduz=REDUZ, passo=0.25):
    im = Image.open(caminho)
    dentro = interior(planta)
    silhueta = planta['n'] is None and not pedra   # masmorra: sem aresta, o sinal bom e o recorte sobre o branco
    cx1, cy1, cx2, cy2 = caixa(dentro, 2 if silhueta else 1)
    cw, ch = cx2 - cx1, cy2 - cy1
    cw, ch = cx2 - cx1, cy2 - cy1          # com a moldura de uma casa em volta
    iw, ih = cw - 2, ch - 2                # so o interior, que e o que a imagem enquadra
    melhor = None
    for giro, espelho in [(g, e) for g in giros for e in (False, True)]:
        img = im.transpose(Image.FLIP_LEFT_RIGHT) if espelho else im
        img = img.rotate(-giro, expand=True) if giro else img
        peq = img.resize((img.width // reduz, img.height // reduz), Image.BILINEAR) if reduz > 1 else img
        M0 = mascara_conteudo(peq) if silhueta else mascara_pedra(peq)
        # a escala maxima e o interior enchendo a imagem; a moldura sobra fora, entao a imagem ganha margem
        s_max = min(M0.shape[1] / iw, M0.shape[0] / ih)
        margem = int(np.ceil(s_max))
        M = np.pad(M0, margem)
        H, W = M.shape
        lo, hi = (faixa[0] / reduz, faixa[1] / reduz) if faixa else (s_max * 0.70, s_max)
        for s in np.arange(lo, min(hi, s_max) + 0.01, passo / reduz):
            fazer = molde_silhueta if silhueta else molde
            P = fazer(planta, dentro, float(s), cx1, cy1, cx2, cy2)
            if P is None or P.shape[0] > H or P.shape[1] > W:
                continue
            v, dy, dx = correlacionar(M, P)
            if melhor is None or v > melhor[0]:
                melhor = (v, float(s), dx - margem, dy - margem, giro, img.size, espelho)
        if verboso and melhor:
            print(f'    giro {giro:3d}{" espelhado" if espelho else "":>10}: melhor nota {melhor[0]:+.3f} (giro {melhor[4]}{", espelhado" if melhor[6] else ""}, {melhor[1] * reduz:.1f} px/casa)')
    v, s, dx, dy, giro, tam, espelho = melhor
    # volta para a escala cheia e para a casa (0,0) do terreno
    S = s * reduz
    return {'nota': round(v, 4), 'giro': giro, 'espelho': espelho, 'escala': round(S, 2),
            'x0': round(dx * reduz - cx1 * S, 1), 'y0': round(dy * reduz - cy1 * S, 1),
            'imagem': list(tam)}


def prova(cena, planta, caminho, a):
    """Desenha a planta por cima da imagem, para o olho conferir o que a conta disse."""
    im = Image.open(caminho)
    if a.get('espelho'):
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
    if a['giro']:
        im = im.rotate(-a['giro'], expand=True)
    im = im.convert('RGB')
    d = ImageDraw.Draw(im)
    S, x0, y0 = a['escala'], a['x0'], a['y0']
    dentro = interior(planta)
    gn, go = planta['n'], planta['o']
    for y in range(planta['h']):
        for x in range(planta['w']):
            px, py = x0 + x * S, y0 + y * S
            for grade, viz, fim in ((gn, (x, y - 1), (px + S, py)), (go, (x - 1, y), (px, py + S))):
                codigo = grade[y][x] if grade else '.'
                fronteira = ((x, y) in dentro) != (viz in dentro)
                if codigo == '#' or fronteira:
                    d.line([px, py, *fim], fill=(0, 255, 0), width=5)
                elif codigo == '/':
                    d.line([px, py, *fim], fill=(255, 220, 0), width=5)
    destino = os.path.join(TMP, f'prova-{cena}.png')
    im.save(destino)
    return destino


def main():
    argv = sys.argv[1:]
    cenas = [a for a in argv if not a.startswith('--') and not a.replace('.', '').isdigit()] or list(PARES)
    provas = '--provas' in argv
    faixa = None
    if '--escala' in argv:
        i = argv.index('--escala')
        faixa = (float(argv[i + 1]), float(argv[i + 2]))
    giros = (int(argv[argv.index('--giro') + 1]),) if '--giro' in argv else (0, 90, 180, 270)
    plantas = json.load(open(os.path.join(TMP, 'plantas.json'), encoding='utf-8'))
    destino = os.path.join(TMP, 'alinhamento.json')
    saida = json.load(open(destino, encoding='utf-8')) if os.path.exists(destino) else {}
    for cena in cenas:
        caminho = os.path.join(ARTE, PARES[cena])
        print(f'{cena}  ({PARES[cena]})')
        fino = '--fino' in argv
        a = alinhar(plantas[cena], caminho, faixa=faixa, giros=giros, pedra='--pedra' in argv,
                    reduz=FINO if fino else REDUZ, passo=0.2 if fino else 1.0)
        a['arquivo'] = PARES[cena]
        print(f"  >> giro {a['giro']}{' ESPELHADO' if a['espelho'] else ''}  {a['escala']} px/casa  origem ({a['x0']}, {a['y0']})  nota {a['nota']:+.4f}")
        if provas:
            print('     prova:', prova(cena, plantas[cena], caminho, a))
        saida[cena] = a
    json.dump(saida, open(destino, 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
    print('\ngravado em', destino)


if __name__ == '__main__':
    main()
