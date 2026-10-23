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
import re
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
    # O ATAQUE VEM DO `attack-pix`, NAO DO `attack`.
    #
    # Sao duas geracoes do mesmo golpe, em modelos diferentes, e a folha
    # guarda as duas. A do modo `v3` (`attack`) tem o golpe estragado: os
    # pixels da madeira do escudo caem de 112 para 68 ao sul, 70 para 31 ao
    # norte e 84 para 35 a oeste, sempre do quadro 3 em diante -- justo os
    # quadros em que o golpe acontece. O `v3` redesenha o personagem a cada
    # quadro e perde primeiro o que e pequeno e lateral.
    #
    # A do `pixminimax` (`attack-pix`) recebeu `subject_description` e
    # `initial_pose`, que dizem ao modelo o que a figura E e de onde o
    # movimento parte. O escudo sobrevive: no quadro 3 a espada esta acima da
    # cabeca com o escudo inteiro no braco esquerdo.
    #
    # Quadro 3 e a espada erguida, quadro 5 e o golpe descido.
    ('attack', ('animation', 'attack-pix'), [3, 5], [8, 14]),
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
    # O SERVIDOR REPARTE UM NOME EM VARIOS GRUPOS.
    #
    # Pedir uma animacao com um nome que ja existe no personagem cria um
    # grupo novo chamado `nome_2`, `nome_3`... Gerar o ataque em duas levas
    # -- uma direcao para testar, sete depois -- deixou as oito repartidas
    # entre `attack-pix` e `attack-pix_2`, e o importador quebrou procurando
    # sudeste onde so havia sul. Aqui o sufixo e removido e os grupos se
    # juntam de volta numa coisa so.
    porDir = {}
    for r in meta['rows']:
        if r['type'] == 'animation':
            nome = re.sub(r'_\d+$', '', r['animation'] or '')
            porDir.setdefault(nome, {})[r['direction']] = r
    queda = porDir.get(QUEDA, {}).get('south')
    if queda is None:
        raise SystemExit(f'a folha nao tem "{QUEDA}" ao sul')

    def recorte(row, f):
        return im.crop((f * CW, row * CH, (f + 1) * CW, (row + 1) * CH))

    alvo = CH - GROUND - 1

    def quadro(fonte_, idx, dir_):
        tipo, arg = fonte_
        if tipo == 'rotations':
            return recorte(rot['row'], DIRECOES.index(dir_))
        if tipo == 'queda':
            return recorte(queda['row'], arg)
        r = porDir[arg][dir_]
        return recorte(r['row'], idx)

    def ancora(fonte_, dir_):
        """
        O deslocamento vertical do GRUPO, medido no quadro de referencia dele.

        Uma ancora global nao serve. Cada animacao sai de uma geracao
        propria, e geracoes diferentes enquadram o personagem na celula de
        um jeito proprio: o ataque do `pixminimax` vinha 2 px mais baixo que
        as rotacoes, e com a ancora global o goblin atacava afundado no
        chao. Medindo no quadro 0 de cada grupo -- que e sempre a pose de
        referencia, a mesma do parado -- os grupos ficam alinhados ENTRE SI,
        e o movimento dentro de cada um fica preservado, porque todos os
        quadros do grupo recebem o mesmo deslocamento.
        """
        tipo = fonte_[0]
        if tipo == 'queda':
            return None          # o chao ancora quadro a quadro
        base = base_do_quadro(quadro(fonte_, 0, dir_))
        return alvo - base

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
            desloca = ancora(fonte_, dir_)
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
                # grupo. Ver a nota 2 no topo do arquivo.
                desce = (alvo - base_do_quadro(cel)) if desloca is None else desloca
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
