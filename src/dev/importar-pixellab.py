# -*- coding: utf-8 -*-
"""
Converte a folha do PixelLab para o formato que `sheet.js` le.

POR QUE ESTE IMPORTADOR E TAO MENOR QUE O DO GEMINI.

O do Gemini tinha de adivinhar tudo: achar a grade na marra, separar as
figuras por chave de magenta, jogar fora texto queimado, deduzir qual quadro
era qual direcao medindo largura e fracao de pele na cabeca, e reancorar cada
um pela base. Aqui nada disso e preciso -- a folha vem com um JSON que diz o
tamanho da celula, quantas colunas, e o que e cada fileira: animacao,
direcao e numero de quadros. Entao este arquivo so recorta, escolhe quadros e
reempacota.

TRES DECISOES QUE PRECISAM ESTAR ESCRITAS:

1. A ARTE NAO E REDIMENSIONADA.
   O goblin do PixelLab tem 46 px de altura no original. O procedural tem 40.
   Reduzir para 40 perderia exatamente o que o faz melhor -- a borda limpa,
   medida em 20,6 de perimetro por raiz da area contra 34,4 da arte reduzida
   do Gemini. Entao ele entra no tamanho nativo e fica ~15% mais alto que as
   criaturas pintadas em codigo, ate elas serem refeitas.

2. DUAS ANCORAS, E A DIFERENCA IMPORTA.
   Quem esta EM PE -- parado, andando, atacando -- usa uma ancora so, medida
   no quadro parado. Reancorar esses quadro a quadro achataria o movimento,
   porque o balanco do andar e a queda do golpe existem como deslocamento
   DENTRO da celula.
   Quem esta NO CHAO usa a propria base. A primeira versao deste arquivo
   aplicava a ancora do parado tambem ao deitado, e o corpo ficava flutuando
   um palmo acima do ladrilho: deitado, a figura ocupa o MEIO da celula, nao
   o fundo, entao o pixel mais baixo dela esta muito acima de onde estaria um
   pe. Como as poses de chao sao um quadro estatico, sem movimento a
   preservar, reancorar pela propria base nao custa nada e e o certo.

3. AS TRES POSES DE CHAO SAO O MESMO DESENHO.
   `down`, `sleep` e `dead` usam o ultimo quadro da queda. O PixelLab nao faz
   pose deitada confiavel -- o template `getting-up` saiu com a figura
   desmontada no meio -- e o que distingue os tres estados no tabuleiro e o
   icone de condicao, nao a silhueta. Um corpo no chao e um corpo no chao.
"""
import argparse
import json
from pathlib import Path
from PIL import Image

AQUI = Path(__file__).resolve().parents[2]
SAIDA = AQUI / 'src' / 'art' / 'folhas'

S = 3                 # px fisicos por px logico, igual a `S` de sheet.js
GROUND = 5            # igual ao `GROUND` de draw.js
DIRECOES = ['south', 'south-east', 'east', 'north-east',
            'north', 'north-west', 'west', 'south-west']

# (nome no motor, fonte, quadros escolhidos, hold)
#
# `hold` tem de bater com `ANIMS` em sheet.js: e `frameAt` que le os tiques, e
# um numero diferente faria o motor pedir um quadro que a folha nao tem.
#
# Os quadros foram escolhidos olhando: no ataque, o 2 e o corpo recolhido e o
# 3 e a investida; no andar, o 0 e a referencia parada e o ciclo e 1 a 4; na
# queda, o 6 e o corpo ja no chao.
PLANO = [
    ('idle',   ('rotations', None), [0],          [40, 40]),
    ('walk',   ('animation', 'walk'), [1, 2, 3, 4], [9, 9, 9, 9]),
    # ATAQUE SAI NOS QUADROS 1 E 2, E ISSO E UM REMENDO DECLARADO.
    #
    # O golpe de verdade esta nos quadros 3 e 4, e os dois estao estragados:
    # o escudo se desfaz. Medido contando os pixels da madeira do escudo, por
    # direcao -- sul 112 -> 68, norte 70 -> 31, oeste 84 -> 35. Cai entre um
    # terco e metade, nas oito direcoes, sempre a partir do quadro 3.
    #
    # E a mesma deriva de identidade da queda: o modo `v3` REDESENHA o
    # personagem a cada quadro, e o que e pequeno e lateral -- um escudo de
    # perfil -- e a primeira coisa que ele perde. Entao aqui ficam os dois
    # quadros intactos, que leem como preparacao sem golpe. Fraco, mas
    # inteiro, ate o ataque ser refeito.
    ('attack', ('animation', 'attack'), [1, 2],   [8, 14]),
    ('down',   ('queda', 6), [0],                 [60]),
    ('sleep',  ('queda', 6), [0],                 [50, 50]),
    ('dead',   ('queda', 6), [0],                 [60]),
    # `hurt` nao existe aqui de proposito: sem o quadro, o `board.js` desenha
    # o recuo como tremor mais tinta vermelha, a custo zero de geracao.
]

QUEDA = 'falling backward'


def base_do_quadro(cel):
    """A fileira mais baixa com pixel aceso, ou None se o quadro for vazio."""
    bb = cel.getbbox()
    return None if bb is None else bb[3] - 1


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--fonte', required=True, help='pasta com o PNG e o JSON do PixelLab')
    p.add_argument('--chave', default='goblin')
    a = p.parse_args()

    fonte = Path(a.fonte)
    meta = json.loads(next(fonte.glob('*.json')).read_text(encoding='utf-8'))['spritesheet']
    CW = meta['cell_size']['width']
    CH = meta['cell_size']['height']
    im = Image.open(fonte / meta['path']).convert('RGBA')

    rot = next(r for r in meta['rows'] if r['type'] == 'rotations')
    porDir = {}
    for r in meta['rows']:
        if r['type'] == 'animation':
            porDir.setdefault(r['animation'], {})[r['direction']] = r
    queda = porDir.get(QUEDA, {}).get('south')
    if queda is None:
        raise SystemExit(f'a folha nao tem "{QUEDA}" ao sul')

    def recorte(row, f):
        return im.crop((f * CW, row * CH, (f + 1) * CW, (row + 1) * CH))

    # A ancora, tirada do parado ao sul.
    pe = base_do_quadro(recorte(rot['row'], 0))
    alvo = CH - GROUND - 1
    desloca = alvo - pe
    print(f'celula {CW}x{CH} | pe do parado em y={pe} -> y={alvo}  (desloca {desloca:+})')

    def quadro(fonte_, idx, dir_):
        tipo, arg = fonte_
        if tipo == 'rotations':
            return recorte(rot['row'], DIRECOES.index(dir_))
        if tipo == 'queda':
            return recorte(queda['row'], arg)
        r = porDir[arg][dir_]
        return recorte(r['row'], idx)

    maxq = max(len(q) if len(q) > 1 else len(h) for _, _, q, h in PLANO)
    largura = CW * S * maxq
    altura = CH * S * len(DIRECOES) * len(PLANO)
    folha = Image.new('RGBA', (largura, altura), (0, 0, 0, 0))

    anims = {}
    for i, (nome, fonte_, quadros, hold) in enumerate(PLANO):
        bloco = i * len(DIRECOES) * CH * S
        nq = len(hold)
        anims[nome] = {'y': bloco, 'fw': CW * S, 'fh': CH * S,
                       'frames': nq, 'hold': hold, 'total': sum(hold)}
        for linha, dir_ in enumerate(DIRECOES):
            for f in range(nq):
                idx = quadros[f] if f < len(quadros) else quadros[-1]
                cel = quadro(fonte_, idx, dir_)
                # Respirar: um pixel logico para cima quando a animacao tem
                # mais quadros do que a fonte, que e o caso de `idle` e
                # `sleep` -- os dois usam um desenho so.
                sobe = -1 if (len(quadros) == 1 and nq > 1 and f % 2) else 0
                # Ampliar primeiro e deslocar em passos de S mantem o
                # alinhamento de blocos 3x3, que e o que permite ao tabuleiro
                # dividir por S sem perder pixel.
                # No chao a ancora e a propria base do quadro; em pe, a do
                # parado. Ver a nota 2 no topo do arquivo.
                desce = (alvo - base_do_quadro(cel)) if fonte_[0] == 'queda' else desloca
                grande = cel.resize((CW * S, CH * S), Image.NEAREST)
                folha.alpha_composite(
                    grande,
                    (f * CW * S, bloco + linha * CH * S + (desce + sobe) * S),
                )

    SAIDA.mkdir(parents=True, exist_ok=True)
    png = SAIDA / f'{a.chave}.png'
    folha.save(png, optimize=True)
    (SAIDA / f'{a.chave}.json').write_text(json.dumps({
        'cell': [CW * S, CH * S], 's': S, 'ground': GROUND,
        'w': largura, 'h': altura, 'dirs': DIRECOES, 'anims': anims,
    }, indent=2), encoding='utf-8')
    print(f'{png}  {largura}x{altura}  {png.stat().st_size/1024:.0f} KB')
    print(f'{len(PLANO)} animacoes x {len(DIRECOES)} direcoes')


if __name__ == '__main__':
    main()
