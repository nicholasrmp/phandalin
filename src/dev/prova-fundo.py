"""A PROVA VISUAL de um enquadramento: a nossa regra desenhada por cima do mapa pintado.

    python src/dev/prova-fundo.py <cena> <imagem> <escala> <x0> <y0> [saida.png]

O `encaixar-fa.py` dá uma NOTA (IoU) e o `fundo` pronto; este aqui dá a FIGURA, que é o que decide. A nota
compara manchas e não sabe dizer *onde* erra: 0,7 tanto pode ser "quase encaixa, falta meia casa" quanto
"planta completamente diferente, com a mesma área de chão". A figura mostra na hora qual dos dois é.

Por cima do desenho, na nossa grade:

    VERMELHO cheio   a casa que o jogo BLOQUEIA (rocha, maciço)
    AMARELO linha    a PAREDE de aresta (`paredeN`/`paredeO`) — é assim que quase toda cena nossa barra passo
    verde fino       a grade

Encaixe certo: o amarelo corre em cima da parede pintada e o vermelho cai no que o desenho também mostra
sólido; o chão pintado fica limpo. Encaixe errado se reconhece de longe — amarelo cortando sala pintada, ou
vermelho em cima de piso.

MEDIDO ASSIM (2026-11-05), com os battlemaps da Forgotten Adventures:

    Onda Eco    bate. 73x90 da grade deles cai 1 para 1 na nossa, escala 100, origem (0,0), sem enquadrar.
                A nota diz 0,695 e a figura diz que está certo: o vermelho contorna a caverna pintada de
                ponta a ponta. A nota cai porque o desenho tem área pintada que não é chão nosso.
    Castelo     NÃO bate. A nossa parede corre pelo mato e a nossa rocha cai dentro do salão pintado: a
                planta do livro e a redesenhada por eles são outra coisa. Não há origem que conserte.
    Poço        NÃO bate. A pedra solta da nossa planta cai em cima de laje limpa.

A arte de terceiro NÃO ENTRA no repositório nem na publicação: ver a nota no topo do `encaixar-fa.py`.
"""
import json
import os
import pathlib
import subprocess
import sys

from PIL import Image, ImageDraw

Image.MAX_IMAGE_PIXELS = None
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LADO = 1600          # o lado maior da prova, em px: o bastante para ver uma casa e leve de abrir


def campo(cena):
    """Pede ao MOTOR o campo montado da cena — bloqueio por casa e parede por aresta. Nada copiado à mão."""
    base = pathlib.Path(RAIZ).as_uri()
    programa = (
        f"const {{mapaDo}}=await import('{base}/src/game/encounter.js');"
        f"const {{montarCampo}}=await import('{base}/src/game/campo.js');"
        "const f=montarCampo(mapaDo(process.env.CENA));"
        "const bloq=[];for(let y=0;y<f.h;y++){const l=[];for(let x=0;x<f.w;x++)l.push(f.blocksMove(x,y)?1:0);bloq.push(l);}"
        "console.log(JSON.stringify({w:f.w,h:f.h,bloq,n:[...f.paredeN],o:[...f.paredeO]}));"
    )
    r = subprocess.run(
        ['node', '--import', './src/dev/cena-node/register.mjs', '--input-type=module', '-e', programa],
        cwd=RAIZ, capture_output=True, text=True, env={**os.environ, 'CENA': cena},
    )
    if r.returncode:
        sys.exit(f'não consegui montar a cena "{cena}":\n{r.stderr.strip()}')
    return json.loads(r.stdout)


def main():
    if len(sys.argv) < 6:
        sys.exit(__doc__)
    cena, caminho = sys.argv[1], sys.argv[2]
    escala, x0, y0 = float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5])
    saida = sys.argv[6] if len(sys.argv) > 6 else os.path.join(RAIZ, 'src', 'dev', '_tmp', f'prova-{cena}.png')
    os.makedirs(os.path.dirname(saida), exist_ok=True)

    d = campo(cena)
    w, h = d['w'], d['h']
    im = Image.open(os.path.join(RAIZ, caminho)).convert('RGB')
    # a tela cobre a NOSSA grade inteira, mesmo onde o desenho não chega: é lá que se vê o que sobra e o que falta
    tela = Image.new('RGB', (int(w * escala), int(h * escala)), (16, 18, 28))
    tela.paste(im, (int(-x0), int(-y0)))

    capa = Image.new('RGBA', tela.size, (0, 0, 0, 0))
    g = ImageDraw.Draw(capa)
    grossura = max(2, int(escala * 0.08))
    bloqueadas = paredes = 0
    for y in range(h):
        for x in range(w):
            cx, cy = x * escala, y * escala
            if d['bloq'][y][x]:
                g.rectangle([cx, cy, cx + escala, cy + escala], fill=(220, 40, 40, 85))
                bloqueadas += 1
            g.rectangle([cx, cy, cx + escala, cy + escala], outline=(80, 220, 120, 45))
            i = y * w + x
            if d['n'][i]:
                g.line([cx, cy, cx + escala, cy], fill=(255, 215, 0, 220), width=grossura)
                paredes += 1
            if d['o'][i]:
                g.line([cx, cy, cx, cy + escala], fill=(255, 215, 0, 220), width=grossura)
                paredes += 1
    tela = Image.alpha_composite(tela.convert('RGBA'), capa).convert('RGB')
    k = LADO / max(tela.size)
    tela.resize((int(tela.width * k), int(tela.height * k)), Image.LANCZOS).save(saida)

    print(f'planta de "{cena}": {w}x{h} casas, {bloqueadas} bloqueadas, {paredes} arestas de parede')
    print(f'desenho: {im.width}x{im.height} px = {im.width / escala:.1f}x{im.height / escala:.1f} casas,'
          f' com o canto na casa ({-x0 / escala:.2f}, {-y0 / escala:.2f})')
    print(f'prova: {saida}')


if __name__ == '__main__':
    main()
