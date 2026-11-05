"""As fichas dos PERSONAGENS com nome: o retrato deles, recortado e posto no anel da galeria.

    python src/dev/fichas-proprias.py          # monta as que têm a imagem de origem no disco
    python src/dev/fichas-proprias.py --prova  # e a prancha de conferência em _referencias/fichas-personagens/

A galeria do imgur (`baixar-fichas.py`) só tem os monstros do livro dos monstros: Klarg saía com a ficha do chefe
bugbear, Nezznar com a do mago drow. Aqui cada um ganha a arte DELE — do livro da aventura ou da wiki —, no mesmo
anel dourado das outras, para o elenco parecer um conjunto só.

A lista é `src/dev/fichas-proprias.json`: `fonte` (caminho da imagem), `centro` e `lado` (o quadrado do recorte, em
pixels da fonte, em volta do rosto), `fundo` ("vermelho" troca o branco da página pelo fundo vermelho da galeria;
"original" mantém o que está atrás) e `credito`. Quem está aqui `baixar-fichas.py` não sobrescreve.
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LISTA = os.path.join(RAIZ, 'src', 'dev', 'fichas-proprias.json')
MOLDE = os.path.join(RAIZ, '_referencias', 'fichas-imgur', 'wZyZJHr.png')   # a ficha do goblin: o anel de molde
SAIDA = os.path.join(RAIZ, 'public', 'fichas')
PROVA = os.path.join(RAIZ, '_referencias', 'fichas-personagens')
BASE = 280            # o lado do molde
DENTRO = 114          # medido: o anel começa no raio 113 e acaba no 140
LADO = 160            # o lado da ficha no jogo (o mesmo de `baixar-fichas.py`)


def anel():
    """O anel da galeria, sem o retrato de dentro: a ficha do goblin com o miolo transparente."""
    im = Image.open(MOLDE).convert('RGBA')
    mascara = Image.new('L', im.size, 255)
    ImageDraw.Draw(mascara).ellipse((BASE / 2 - DENTRO, BASE / 2 - DENTRO, BASE / 2 + DENTRO, BASE / 2 + DENTRO), fill=0)
    im.putalpha(Image.fromarray(np.minimum(np.array(im.getchannel('A')), np.array(mascara))))
    return im


def fundo_vermelho():
    """O fundo das fichas da galeria: vermelho, mais claro no meio."""
    ys, xs = np.mgrid[0:BASE, 0:BASE]
    r = np.clip(np.hypot(xs - BASE / 2, ys - BASE / 2) / DENTRO, 0, 1)[..., None]
    cor = (1 - r) * np.array([150, 44, 36]) + r * np.array([78, 16, 14])
    return Image.fromarray(np.dstack([cor, np.full((BASE, BASE, 1), 255)]).astype('uint8'), 'RGBA')


def sem_papel(im):
    """Tira o branco da página (o retrato do livro vem sobre papel): o claro e pouco saturado vira transparente."""
    a = np.array(im.convert('RGBA')).astype(int)
    rgb = a[..., :3]
    claro = rgb.min(axis=2)
    sat = rgb.max(axis=2) - rgb.min(axis=2)
    papel = (claro > 205) & (sat < 40)
    alfa = np.where(papel, 0, 255).astype('uint8')
    alfa = np.array(Image.fromarray(alfa).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2)))
    a[..., 3] = np.minimum(a[..., 3], alfa)
    return Image.fromarray(a.astype('uint8'), 'RGBA')


def montar(item, molde):
    fonte = Image.open(os.path.join(RAIZ, item['fonte'])).convert('RGBA')
    cx, cy = item['centro']
    m = item['lado'] / 2
    recorte = fonte.crop((int(cx - m), int(cy - m), int(cx + m), int(cy + m)))
    if item.get('fundo', 'vermelho') == 'vermelho':
        recorte = sem_papel(recorte)
    retrato = recorte.resize((DENTRO * 2 + 4, DENTRO * 2 + 4), Image.LANCZOS)
    ficha = fundo_vermelho() if item.get('fundo', 'vermelho') == 'vermelho' else Image.new('RGBA', (BASE, BASE), (0, 0, 0, 0))
    disco = Image.new('L', (BASE, BASE), 0)
    ImageDraw.Draw(disco).ellipse((BASE / 2 - DENTRO - 2, BASE / 2 - DENTRO - 2, BASE / 2 + DENTRO + 2, BASE / 2 + DENTRO + 2), fill=255)
    camada = Image.new('RGBA', (BASE, BASE), (0, 0, 0, 0))
    camada.paste(retrato, (BASE // 2 - DENTRO - 2, BASE // 2 - DENTRO - 2), retrato)
    camada.putalpha(Image.fromarray(np.minimum(np.array(camada.getchannel('A')), np.array(disco))))
    ficha = Image.alpha_composite(ficha, camada)
    # o que fica fora do disco, transparente (a ficha é redonda), e o anel por cima
    ficha.putalpha(Image.fromarray(np.minimum(np.array(ficha.getchannel('A')), np.array(disco))))
    ficha = Image.alpha_composite(ficha, molde)
    return ficha


def main():
    lista = {k: v for k, v in json.load(open(LISTA, encoding='utf-8')).items() if not k.startswith('_')}
    molde = anel()
    feitas, faltam = [], []
    for criatura, item in lista.items():
        if not os.path.exists(os.path.join(RAIZ, item['fonte'])):
            faltam.append(f"{criatura} ({item['fonte']})")
            continue
        ficha = montar(item, molde)
        ficha.resize((LADO, LADO), Image.LANCZOS).save(os.path.join(SAIDA, f'{criatura}.webp'), 'WEBP', quality=88, method=6)
        feitas.append((criatura, ficha))
    print(f'{len(feitas)} fichas próprias em public/fichas' + (f'; sem a imagem de origem: {", ".join(faltam)}' if faltam else ''))
    if '--prova' in sys.argv and feitas:
        os.makedirs(PROVA, exist_ok=True)
        prancha = Image.new('RGB', (len(feitas) * 300, 300), (13, 12, 17))
        for i, (_, f) in enumerate(feitas):
            prancha.paste(f, (i * 300 + 10, 10), f)
        prancha.save(os.path.join(PROVA, 'prancha.png'))


if __name__ == '__main__':
    main()
