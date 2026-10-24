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
import colorsys
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
    #
    # `attack-fix` vem antes: e o golpe refeito em W, SW e NW, onde o
    # `attack-pix` golpeava para o lado errado. Direcao a direcao, vale o
    # primeiro grupo da lista que tiver aquela direcao.
    ('attack', ('animation', ['attack-fix', 'attack-pix']), [3, 5], [8, 14]),
    ('down',   ('queda', None), [0],              [60]),
    ('sleep',  ('queda', None), [0],              [50, 50]),
    ('dead',   ('queda', None), [0],              [60]),
    # `hurt` nao existe aqui de proposito: sem o quadro, o `board.js` desenha
    # o recuo como tremor mais tinta vermelha, a custo zero de geracao.
]

# A POSE DE CHAO, em ordem de preferencia: (grupo, quadro). -1 e o ultimo.
#
# `queda-pix` e a queda refeita em `pixminimax` dizendo o que o corpo deitado
# ainda tem -- escudo no peito, cimitarra ao lado. O ultimo quadro da
# `falling backward` virou um amontoado de pecas soltas sem o escudo, e fica
# so como reserva.
QUEDAS = [('queda-pix', -1), ('falling backward', 6)]

# QUADROS POR DIRECAO, quando a escolha global nao serve numa direcao so.
#
# No ataque a leste, o quadro 5 corta 1-2 px da ponta da lamina na borda da
# celula de 68; o 6 e praticamente a mesma pose e nao encosta na borda.
#
# W e NW vem do `attack-fix`, refeito direcao a direcao, e o golpe nao cai nos
# mesmos indices do `attack-pix`. A oeste a espada sobe atras dele no 3 e a
# estocada sai para a esquerda no 7 -- o 6 e a mesma pose, mas a lamina ja
# vem cortada 6 px na borda contra 4 do 7. A noroeste, de costas, a espada
# sobe a direita no 2 e termina adiante, em cima a esquerda, no 6. A sudoeste
# os indices batem com os do `attack-pix`.
QUADROS_POR_DIRECAO = {
    ('attack', 'east'): [3, 6],
    ('attack', 'west'): [3, 7],
    ('attack', 'north-west'): [2, 6],
}

# O SENTIDO HORIZONTAL DE CADA DIRECAO NA TELA, para o bote do ataque.
SENTIDO_X = {'south': 0, 'south-east': 1, 'east': 1, 'north-east': 1,
             'north': 0, 'north-west': -1, 'west': -1, 'south-west': -1}
BOTE = 3        # px logicos que o golpe pode avancar no sentido da direcao


# PERFIS POR CRIATURA.
#
# `PLANO` e `QUADROS_POR_DIRECAO` acima sao o guerreiro, com a historia dele
# (`attack-pix`, depois `attack-fix` so em tres direcoes). O arqueiro e o
# chefe ja nasceram com o ataque pedido direcao a direcao, num grupo so,
# `attack-dir`; o que muda e de onde vem o ataque e quais quadros dele
# valem. Os quadros sao escolhidos OLHANDO, direcao a direcao, como foram os
# do guerreiro: o modelo nao poe o golpe sempre no mesmo indice.
PERFIS = {
    'goblin': {},
    # Arco ARMADO e DISPARO, escolhidos olhando os 9 quadros de cada direcao.
    # A noroeste e a oeste o disparo e o 5: do 6 em diante o modelo vira a
    # figura e a flecha sai para o lado errado. Ao sul o arco arma de lado,
    # com a flecha para a direita -- e o jeito usual de desenhar arqueiro de
    # frente --, e no disparo a flecha desce para a camera.
    'goblinArqueiro': {
        'ataque': ['attack-dir'],
        'quadros': [3, 7],
        'por_direcao': {
            'south': [4, 8], 'south-east': [3, 7], 'east': [4, 7],
            'north-east': [3, 7], 'north': [4, 7], 'north-west': [3, 5],
            'west': [3, 5], 'south-west': [4, 7],
        },
    },
    # Espada ERGUIDA e GOLPE. Ao norte e a noroeste o modelo vira a figura no
    # fim do movimento e mostra a face do escudo, entao o golpe e pego antes
    # da virada: ao norte, o arco da espada indo adiante (4); a noroeste, a
    # lamina subindo para cima e para a esquerda (6), ja com a face do escudo
    # aparecendo -- o mesmo caso do guerreiro, que o verificador da revisao
    # aceitou como menor. Onde o golpe tem um borrao grande (sul 5, sudoeste
    # 6), fica o quadro seguinte, sem borrao, como no resto da familia.
    'goblinBoss': {
        'ataque': ['attack-dir'],
        'quadros': [3, 5],
        'por_direcao': {
            'south': [4, 6], 'south-east': [3, 5], 'east': [4, 5],
            'north-east': [3, 7], 'north': [2, 4], 'north-west': [3, 6],
            'west': [3, 5], 'south-west': [4, 7],
        },
    },
    # A Dara de malha. Mesmo criterio: espada ERGUIDA e GOLPE, escolhidos
    # olhando. Ao norte o golpe para baixo e o quadro 2, que vem ANTES do
    # erguido (4) na sequencia do modelo; a ordem aqui e a do motor, nao a do
    # PixelLab. A nordeste o 3 e um borrao, e do 4 ao 7 a figura mostra a face
    # do escudo de costas -- o mesmo caso aceito no chefe --; o 8 e o golpe ja
    # sem a virada. A oeste e a sudoeste o 4 e um borrao enorme.
    # A pele e escama vermelha: a faixa de matiz da volta no vermelho.
    'fighter': {
        'ataque': ['attack-dir'],
        'pele': (0.94, 0.04),
        'cabeca': 14,
        'pe_no_ataque': ['north-east', 'north-west'],
        'quadros': [3, 5],
        'por_direcao': {
            'south': [2, 5], 'south-east': [3, 5], 'east': [2, 4],
            'north-east': [5, 8], 'north': [4, 2], 'north-west': [3, 6],
            'west': [3, 6], 'south-west': [3, 6],
        },
    },
}


# A faixa de matiz da pele, de 0 a 1. Padrao: a mostarda dos goblins. Um
# perfil pode trocar (`'pele'`); se o comeco for maior que o fim, a faixa da
# a volta no vermelho, que fica nas duas pontas do circulo de matiz.
PELE = (0.08, 0.18)
CABECA = 0       # px; ver `centro_do_corpo`
# Direcoes em que o ataque e ancorado pelo pe, quadro a quadro, como o andar.
# Na Dara o modelo SOBE a figura no golpe a noroeste (5 px) e a nordeste
# (3 px), e com a ancora do grupo ela golpeava flutuando sobre a sombra.
PE_NO_ATAQUE = set()


def e_pele(c):
    r, g, b = (x / 255 for x in c[:3])
    h, sat, v = colorsys.rgb_to_hsv(r, g, b)
    lo, hi = PELE
    dentro = lo <= h <= hi if lo <= hi else (h >= lo or h <= hi)
    return dentro and sat > 0.35 and v > 0.35


def centro_do_corpo(cel):
    """
    A coluna do CORPO, nao da figura: a mediana x dos pixels de pele.

    O ataque do `pixminimax` desliza a figura inteira 8 a 15 px para a
    direita nos quadros do golpe -- quase sempre para a direita, qualquer que
    seja a direcao, entao nao e bote: e o modelo reenquadrando. Para medir
    isso e preciso um centro que a lamina e o rastro nao puxem. A caixa
    delimitadora e puxada pela espada; a pele so do topo enlouquece de
    costas, onde quase so ha cabelo. A mediana de toda a pele ficou estavel
    nas oito direcoes.

    Com `CABECA`, so a pele dos `CABECA` px de cima conta, a partir do pixel
    de pele mais alto. Na Dara a mediana de toda a pele nao serve: o emblema
    do escudo tem o vermelho das escamas e puxava 12-14 px quando o modelo
    mostra a face do escudo, e embaixo, nos pes, o ataque inventa uma cauda.
    A cabeca e sempre a escama mais alta -- a espada erguida e aco.
    """
    px = cel.load()
    pontos = [(x, y) for y in range(cel.height) for x in range(cel.width)
              if px[x, y][3] and e_pele(px[x, y])]
    if CABECA and pontos:
        topo = pontos[0][1]
        pontos = [(x, y) for x, y in pontos if y < topo + CABECA]
    xs = sorted(x for x, _ in pontos)
    return xs[len(xs) // 2] if xs else None


def pe_no_centro(cel, faixa=10):
    """
    A fileira mais baixa acesa numa faixa central de +-`faixa` px.

    No andar, o pixel mais baixo da figura inteira as vezes e a ponta da
    cimitarra, que pende do lado. Na faixa central so entra pe.
    """
    px = cel.load()
    meio = cel.width // 2
    for y in range(cel.height - 1, -1, -1):
        for x in range(max(0, meio - faixa), min(cel.width, meio + faixa + 1)):
            if px[x, y][3]:
                return y
    return base_do_quadro(cel)


def respirar(cel):
    """
    Respiracao que nao tira o pe do chao.

    Antes o quadro de respirar subia a figura INTEIRA 1 px, e o pe descolava
    da sombra, que o motor desenha fixa no chao. Agora sobe so a parte de
    cima (os 55% superiores) e a fileira do corte se repete: o tronco estica
    1 px, como um peito enchendo, e o pe fica onde esta.
    """
    bb = cel.getbbox()
    if not bb:
        return cel
    corte = bb[1] + int(0.55 * (bb[3] - bb[1]))
    topo = cel.crop((0, 0, cel.width, corte))
    out = cel.copy()
    out.paste((0, 0, 0, 0), (0, 0, cel.width, corte - 1))
    out.paste(topo, (0, -1), topo)
    return out


def base_do_quadro(cel):
    """A fileira mais baixa com pixel aceso, ou None se o quadro for vazio."""
    bb = cel.getbbox()
    return None if bb is None else bb[3] - 1


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--fonte', required=True, help='pasta com o PNG e o JSON do PixelLab')
    p.add_argument('--chave', default='goblin')
    a = p.parse_args()
    global PLANO, QUADROS_POR_DIRECAO, PELE, CABECA, PE_NO_ATAQUE
    perfil = PERFIS.get(a.chave, {})
    PE_NO_ATAQUE = {('attack', d) for d in perfil.get('pe_no_ataque', [])}
    PELE = perfil.get('pele', PELE)
    CABECA = perfil.get('cabeca', CABECA)
    if 'ataque' in perfil:
        PLANO = [(n, ('animation', perfil['ataque']), perfil['quadros'], h)
                 if n == 'attack' else (n, fonte_, q, h)
                 for n, fonte_, q, h in PLANO]
        QUADROS_POR_DIRECAO = {('attack', d): q
                               for d, q in perfil.get('por_direcao', {}).items()}

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
    queda = None
    for nome_q, quadro_q in QUEDAS:
        r = porDir.get(nome_q, {}).get('south')
        if r is not None:
            queda = (r, quadro_q if quadro_q >= 0 else r['frame_count'] - 1)
            print(f'pose de chao: "{nome_q}", quadro {queda[1]}')
            break
    if queda is None:
        raise SystemExit('a folha nao tem nenhuma das quedas de QUEDAS ao sul')

    def grupo(nomes, dir_):
        '''O primeiro grupo da lista de preferencia que tem esta direcao.'''
        for n in ([nomes] if isinstance(nomes, str) else nomes):
            if dir_ in porDir.get(n, {}):
                return porDir[n][dir_]
        raise SystemExit(f'nenhum de {nomes} tem a direcao {dir_}')

    def recorte(row, f):
        return im.crop((f * CW, row * CH, (f + 1) * CW, (row + 1) * CH))

    alvo = CH - GROUND - 1

    def quadro(fonte_, idx, dir_):
        tipo, arg = fonte_
        if tipo == 'rotations':
            return recorte(rot['row'], DIRECOES.index(dir_))
        if tipo == 'queda':
            return recorte(queda[0]['row'], queda[1])
        return recorte(grupo(arg, dir_)['row'], idx)

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
            escolha = QUADROS_POR_DIRECAO.get((nome, dir_), quadros)
            ref_x = centro_do_corpo(quadro(fonte_, 0, dir_)) if nome == 'attack' else None
            for f in range(nq):
                idx = escolha[f] if f < len(escolha) else escolha[-1]
                cel = quadro(fonte_, idx, dir_)
                # Respirar: o segundo quadro de `idle` e `sleep`, que usam um
                # desenho so. Estica o tronco em vez de subir a figura.
                if len(escolha) == 1 and nq > 1 and f % 2:
                    cel = respirar(cel)
                # VERTICAL. No chao, a propria base. No andar, o pe na faixa
                # central, quadro a quadro: a ancora do grupo vem do quadro 0,
                # que nao e um dos quadros usados, e o pe ficava 1-2 px acima ou
                # abaixo do chao em metade das direcoes. Pe no chao em todo
                # quadro nao achata o balanco: e o corpo que sobe e desce sobre
                # o pe de apoio. No resto, a ancora do grupo.
                if desloca is None:
                    dy = alvo - base_do_quadro(cel)
                elif nome == 'walk' or (nome, dir_) in PE_NO_ATAQUE:
                    dy = alvo - pe_no_centro(cel)
                else:
                    dy = desloca
                # HORIZONTAL, so no ataque: devolve o corpo a coluna do quadro
                # de referencia, deixando ate BOTE px de avanco no sentido da
                # direcao. Ver `centro_do_corpo`.
                dx = 0
                if ref_x is not None:
                    cx = centro_do_corpo(cel)
                    if cx is not None:
                        anda = cx - ref_x
                        sx = SENTIDO_X[dir_]
                        lim = (0, BOTE) if sx > 0 else (-BOTE, 0) if sx < 0 else (-1, 1)
                        dx = max(lim[0], min(lim[1], anda)) - anda
                        if dx:
                            print(f'  {nome:6} {dir_:10} q{idx}: corpo {anda:+d} px -> {anda + dx:+d}')
                # O deslocamento acontece DENTRO da celula, recortado nela.
                # Colar a celula deslocada direto na folha vazava pixels para o
                # quadro vizinho quando o deslocamento era grande.
                celula = Image.new('RGBA', (CW, CH), (0, 0, 0, 0))
                celula.paste(cel, (dx, dy), cel)
                # Ampliar depois de deslocar mantem o alinhamento de blocos
                # 3x3, que e o que permite ao tabuleiro dividir por S sem
                # perder pixel.
                folha.alpha_composite(celula.resize((CW * S, CH * S), Image.NEAREST),
                                      (f * CW * S, bloco + linha * CH * S))

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
