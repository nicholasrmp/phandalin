"""Acha o enquadramento de um BATTLEMAP DE TERCEIRO na planta de uma cena nossa, e diz o quanto ele casa.

    python src/dev/encaixar-fa.py esconderijo public/mapas/esconderijo-fa.webp

Imprime o `fundo` pronto para colar em `game/encounter.js` e, antes dele, a nota do encaixe.

O QUE ELE MEDE. A nota é o IoU (interseção sobre união) entre duas manchas: o nosso CHÃO — toda casa que não
barra passo — e o INTERIOR do desenho — todo pixel que não é o vazio preto de fora da caverna. IoU, e não
"quanto do nosso chão caiu em chão pintado", porque essa segunda conta se ganha trapaceando: encolher a planta
até ela caber num canto da caverna dá 100%. O IoU pune os dois erros, o de encolher e o de transbordar.

COMO LER A NOTA. 1,0 é a mesma planta. A Mansão, que É um decalque da página oficial do Roll20, cobre 83% das
paredes oficiais. O Esconderijo contra o Cragmaw Hideout da Forgotten Adventures deu 0,449: menos de metade, que
é o número de duas plantas DIFERENTES do mesmo lugar — e é o esperado, porque a nossa foi desenhada casa a casa
(ver o cabeçalho de `game/esconderijo.js`), nunca decalcada.

SOBRE A ARTE. Battlemap de terceiro não entra no repositório. A licença da Forgotten Adventures proíbe embutir a
arte deles em video game, e isso vale para o release grátis igual. O arquivo fica no disco de quem o baixou
(`mapas/` e `public/mapas/esconderijo-fa*.webp` estão no `.gitignore`) e serve de REFERÊNCIA DE MEDIDA; a arte
que o jogo mostra é nossa, em `public/mapas/`.
"""
import json
import os
import pathlib
import subprocess
import sys

import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PASSO = 20          # 1 pixel da busca vale 20 px da imagem: a 100 px por casa, é 1/5 de casa
VAZIO = 18          # brilho abaixo disto é o preto de fora da caverna, e não desenho


def planta(cena):
    """O terreno da cena e a tabela de glifos, pedidos ao próprio motor — nada de copiar coordenada à mão."""
    # `-e` não tem pasta de base, então o import vai por URL absoluta; a cena vai por variável de ambiente,
    # que é o que não se confunde com os argumentos que o próprio node come.
    base = pathlib.Path(RAIZ).as_uri()
    programa = (
        f"const {{mapaDo}}=await import('{base}/src/game/encounter.js');"
        f"const {{GLIFOS}}=await import('{base}/src/core/grid.js');"
        "const m=mapaDo(process.env.CENA);"
        "console.log(JSON.stringify({terreno:m.terreno,"
        "barra:Object.entries(GLIFOS).filter(([,v])=>(v.kind??v)===1).map(([c])=>c)}));"
    )
    saida = subprocess.run(
        ['node', '--import', './src/dev/cena-node/register.mjs', '--input-type=module', '-e', programa],
        cwd=RAIZ, capture_output=True, text=True, env={**os.environ, 'CENA': cena},
    )
    if saida.returncode:
        sys.exit(f'não consegui ler a cena "{cena}":\n{saida.stderr.strip()}')
    return json.loads(saida.stdout)


def carregar(caminho):
    im = Image.open(os.path.join(RAIZ, caminho)).convert('RGB')
    pequena = im.resize((im.width // PASSO, im.height // PASSO), Image.BOX)
    return im, np.asarray(pequena).astype(np.float32).mean(axis=2) > VAZIO


def main():
    cena = sys.argv[1]
    caminho = sys.argv[2]
    d = planta(cena)
    t = d['terreno']
    h = len(t)
    w = len(t[0])
    barra = set(d['barra'])
    chao = np.array([[t[y][x] not in barra for x in range(w)] for y in range(h)])

    im, dentro = carregar(caminho)
    ih, iw = dentro.shape
    px = np.arange(iw)[None, :] * PASSO
    py = np.arange(ih)[:, None] * PASSO
    print(f'planta de "{cena}": {w}x{h} casas, {chao.sum()} de chão', file=sys.stderr)
    print(f'desenho: {im.width}x{im.height} px, {100 * dentro.mean():.1f}% dele é interior', file=sys.stderr)

    def nota(escala, x0, y0):
        cx = np.floor((px - x0) / escala).astype(np.int32)
        cy = np.floor((py - y0) / escala).astype(np.int32)
        ok = (cx >= 0) & (cx < w) & (cy >= 0) & (cy < h)
        nosso = np.zeros((ih, iw), bool)
        nosso[ok] = chao[np.clip(cy, 0, h - 1) + np.zeros_like(cx), np.clip(cx, 0, w - 1)][ok]
        uniao = (nosso | dentro).sum()
        return (nosso & dentro).sum() / uniao if uniao else 0.0

    def buscar(escalas, xs, ys):
        melhor = (-1.0, (0, 0, 0))
        for e in escalas:
            for x0 in xs:
                for y0 in ys:
                    s = nota(e, x0, y0)
                    if s > melhor[0]:
                        melhor = (s, (e, x0, y0))
        return melhor

    # grosso, médio e fino: a busca inteira num passo só levaria minutos e não acharia nada melhor
    s, (e, x0, y0) = buscar(range(50, 165, 10), range(-1200, 1201, 100), range(-900, 901, 100))
    print(f'grosso: IoU {s:.3f}  escala {e}  x0 {x0}  y0 {y0}', file=sys.stderr)
    s, (e, x0, y0) = buscar([e + k for k in range(-9, 10, 3)], range(x0 - 90, x0 + 91, 30), range(y0 - 90, y0 + 91, 30))
    print(f'médio : IoU {s:.3f}  escala {e}  x0 {x0}  y0 {y0}', file=sys.stderr)
    s, (e, x0, y0) = buscar([e + k for k in range(-2, 3)], range(x0 - 25, x0 + 26, 10), range(y0 - 25, y0 + 26, 10))
    print(f'fino  : IoU {s:.3f}  escala {e}  x0 {x0}  y0 {y0}', file=sys.stderr)
    print(f'\nencaixe: IoU {s:.3f} — '
          f'{"a mesma planta" if s > 0.85 else "decalque com folga" if s > 0.7 else "PLANTAS DIFERENTES"}',
          file=sys.stderr)
    nome = os.path.basename(caminho)
    print(f"fundo: {{ nome: '{nome}', url: '/mapas/{nome}', escala: {e}, x0: {x0}, y0: {y0}, giro: 0, opacidade: 1 }},")


if __name__ == '__main__':
    main()
