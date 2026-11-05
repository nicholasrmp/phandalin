"""Baixa as fichas de criatura da galeria do imgur e as converte para o jogo.

    python src/dev/baixar-fichas.py          # seco: mostra o plano (quantas, quanto pesa)
    python src/dev/baixar-fichas.py --go     # baixa e converte

A lista é `src/dev/fichas-imgur.json` (id da criatura no jogo -> id da imagem no imgur). O original vai para
`_referencias/fichas-imgur/<id>.png`, sem mexer; o jogo recebe `public/fichas/<criatura>.webp`, reduzido a 160 px
(a ficha no tabuleiro tem ~54 px de diâmetro na abertura e 64 no zoom máximo: 160 sobra para o retrato do HUD e
para tela de alta densidade) e com o alfa preservado, para o anel ficar redondo sobre o mapa.
"""
import io
import json
import os
import sys
import urllib.request

from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LISTA = os.path.join(RAIZ, 'src', 'dev', 'fichas-imgur.json')
CRU = os.path.join(RAIZ, '_referencias', 'fichas-imgur')
SAIDA = os.path.join(RAIZ, 'public', 'fichas')
LADO = 160


def baixar(img_id):
    destino = os.path.join(CRU, f'{img_id}.png')
    if os.path.exists(destino):
        return destino, False
    req = urllib.request.Request(f'https://i.imgur.com/{img_id}.png', headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=30) as r:
        dados = r.read()
    Image.open(io.BytesIO(dados)).verify()   # é imagem mesmo: o imgur devolve página de erro com status 200 às vezes
    with open(destino, 'wb') as f:
        f.write(dados)
    return destino, True


def main():
    lista = {k: v for k, v in json.load(open(LISTA, encoding='utf-8')).items() if not k.startswith('_')}
    ids = sorted({v[0] for v in lista.values()})
    print(f'{len(lista)} criaturas, {len(ids)} imagens distintas no imgur')
    if '--go' not in sys.argv:
        print('seco: rode com --go para baixar e converter')
        return
    os.makedirs(CRU, exist_ok=True)
    os.makedirs(SAIDA, exist_ok=True)
    baixadas = 0
    for i in ids:
        _, novo = baixar(i)
        baixadas += novo
    # os personagens com nome que têm a arte deles (`fichas-proprias.py`) não levam a ficha genérica por cima
    proprias = {k for k in json.load(open(os.path.join(RAIZ, 'src', 'dev', 'fichas-proprias.json'), encoding='utf-8')) if not k.startswith('_')}
    total = 0
    for criatura, (img_id, nome) in sorted(lista.items()):
        if criatura in proprias and os.path.exists(os.path.join(SAIDA, f'{criatura}.webp')):
            continue
        im = Image.open(os.path.join(CRU, f'{img_id}.png')).convert('RGBA')
        # A galeria desenha a ficha de criatura Miúda menor, no meio da tela (rato, morcego, estirge, caveira): o
        # anel ocupava 40% da imagem e a ficha saía minúscula na casa. O tamanho na casa é o motor que decide pela
        # pegada; aqui recorta-se pelo próprio anel (o que não é transparente) e a ficha enche a imagem.
        caixa = im.getchannel('A').point(lambda a: 255 if a > 16 else 0).getbbox()
        if caixa:
            im = im.crop(caixa)
        lado = max(im.size)
        quadrado = Image.new('RGBA', (lado, lado), (0, 0, 0, 0))
        quadrado.paste(im, ((lado - im.width) // 2, (lado - im.height) // 2))
        im = quadrado.resize((LADO, LADO), Image.LANCZOS)
        caminho = os.path.join(SAIDA, f'{criatura}.webp')
        im.save(caminho, 'WEBP', quality=88, method=6)
        total += os.path.getsize(caminho)
    print(f'baixadas {baixadas} (as outras já estavam em _referencias), {len(lista)} fichas em public/fichas, {total / 1024:.0f} KB no total')


if __name__ == '__main__':
    main()
