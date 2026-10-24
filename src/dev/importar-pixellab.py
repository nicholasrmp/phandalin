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
ESPELHO = {'west': 'east', 'south-west': 'south-east', 'north-west': 'north-east'}
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
    # AS POSTURAS DE ARMA DA DARA. Os quadros sao os mesmos que a edicao de
    # cauda limpou (`ATAQUE_POR_PERFIL` em `editar-quadros.py`); a queda vem da
    # folha principal; arco e besta trocam o verde por madeira e ferro.
    'fighterSemEscudo': {
        'ataque': ['attack-dir'], 'pele': (0.94, 0.04), 'cabeca': 14, 'quadros': [3, 5],
        'queda_de': '_referencias/pixellab/fighterMalha-65b1e8af/anim-dara-sem-cauda-sem-arma',
        'por_direcao': {'south': [2, 5], 'south-east': [2, 5], 'east': [2, 3], 'north-east': [1, 3],
                        'north': [2, 3], 'north-west': [4, 6], 'west': [3, 6], 'south-west': [3, 5]},
    },
    'fighterArco': {
        'ataque': ['attack-dir'], 'pele': (0.94, 0.04), 'cabeca': 14, 'quadros': [3, 5],
        'queda_de': '_referencias/pixellab/fighterMalha-65b1e8af/anim-dara-sem-cauda-sem-arma',
        'verde_vira': 'madeira',
        'arco_do_parado': ['south-east', 'east', 'north-east', 'north', 'south-west'],
        'por_direcao': {'south': [3, 7], 'south-east': [3, 6], 'east': [2, 5], 'north-east': [3, 5],
                        'north': [4, 6], 'north-west': [3, 6], 'west': [3, 6], 'south-west': [3, 6]},
    },
    'fighterBesta': {
        'ataque': ['attack-dir'], 'pele': (0.94, 0.04), 'cabeca': 14, 'quadros': [3, 5],
        'queda_de': '_referencias/pixellab/fighterMalha-65b1e8af/anim-dara-sem-cauda-sem-arma',
        'verde_vira': 'besta',
        'por_direcao': {'south': [3, 6], 'south-east': [3, 5], 'east': [2, 5], 'north-east': [3, 6],
                        'north': [3, 6], 'north-west': [3, 6], 'west': [3, 6], 'south-west': [3, 6]},
    },
    # A espada grande: a propria espada verde da postura de duas maos, que ja
    # e uma espada grande desenhada no golpe -- so troca o verde por aco.
    'fighterEspadaGrande': {
        'ataque': ['attack-dir'], 'pele': (0.94, 0.04), 'cabeca': 14, 'quadros': [3, 5],
        'queda_de': '_referencias/pixellab/fighterMalha-65b1e8af/anim-dara-sem-cauda-sem-arma',
        'verde_vira': 'aco',
        'por_direcao': {'south': [1, 5], 'south-east': [1, 6], 'east': [2, 5], 'north-east': [1, 3],
                        'north': [6, 1], 'north-west': [3, 6], 'west': [1, 4], 'south-west': [1, 6]},
    },
    'fighterDuasMaos': {
        'ataque': ['attack-dir'], 'pele': (0.94, 0.04), 'cabeca': 14, 'quadros': [3, 5],
        'queda_de': '_referencias/pixellab/fighterMalha-65b1e8af/anim-dara-sem-cauda-sem-arma',
        'por_direcao': {'south': [2, 5], 'south-east': [1, 6], 'east': [2, 5], 'north-east': [1, 3],
                        'north': [6, 1], 'north-west': [3, 6], 'west': [1, 4], 'south-west': [1, 6]},
    },
    # BRENN, clerigo anao. Maca ERGUIDA e GOLPE, escolhidos olhando os 9
    # quadros de cada direcao. Ao norte, do 4 em diante o modelo vira o anao
    # de frente; o golpe e pego antes (3 erguida, 2 descendo). A nordeste os
    # quadros 1-3 olham para a esquerda; valem o 4 (maca no alto, de costas) e
    # o 8 (baixada). O oeste veio fraco -- a maca vai para o lado de tras --,
    # entao a folha e importada com `--espelho` e o lado oeste sai do leste.
    # A pele e rosada; a barba castanha fica fora da faixa pelo valor baixo.
    'cleric': {
        'ataque': ['attack-dir'], 'pele': (0.02, 0.09), 'pele_sv': (0.3, 0.75, 0.78), 'margem': 8, 'cabeca': 10,
        'quadros': [3, 5],
        'por_direcao': {'south': [3, 5], 'south-east': [3, 4], 'east': [3, 4], 'north-east': [4, 8], 'north': [3, 1], 'north-west': [4, 8], 'west': [3, 4], 'south-west': [3, 4]},
    },
    # A besta do Brenn: MIRA e DISPARO (o quadro com o virote saindo). A
    # besta ja vem desenhada, madeira e aco -- nada de verde para trocar.
    'clericBesta': {
        'ataque': ['attack-dir'], 'pele': (0.02, 0.09), 'pele_sv': (0.3, 0.75, 0.78), 'margem': 8, 'cabeca': 10,
        'quadros': [3, 5],
        'por_direcao': {'south': [3, 4], 'south-east': [3, 5], 'east': [4, 5],
                        'north-east': [4, 5], 'north': [3, 5], 'north-west': [3, 4],
                        'west': [3, 4], 'south-west': [3, 5]},
    },
    # PIP, ladino halfling. Estocada: ERGUIDA e BOTE, escolhidos olhando. Ao
    # norte, do 2 em diante o modelo vira o Pip de lado; vale o golpe antes.
    'rogue': {
        'ataque': ['attack-dir'], 'pele': (0.03, 0.11), 'pele_sv': (0.3, 0.75, 0.75), 'margem': 8, 'cabeca': 8,
        'quadros': [3, 5],
        'por_direcao': {'south': [3, 5], 'south-east': [2, 4], 'east': [2, 4], 'north-east': [3, 5], 'north': [2, 4], 'north-west': [3, 5], 'west': [2, 4], 'south-west': [2, 4]},
    },
    # As duas adagas: o golpe da DIREITA e o da ESQUERDA. O modelo pos rastros
    # brancos enormes no 1-2 e no 5; ficam os quadros sem rastro. A nordeste
    # do 3 ao 6 ele vira de frente: valem o 1 e o 7.
    'rogueAdagas': {
        'ataque': ['attack-dir'], 'pele': (0.03, 0.11), 'pele_sv': (0.3, 0.75, 0.75), 'margem': 8, 'cabeca': 8,
        'quadros': [3, 5],
        'por_direcao': {'south': [3, 7], 'south-east': [4, 7], 'east': [3, 7], 'north-east': [1, 7], 'north': [2, 6], 'north-west': [1, 7], 'west': [3, 7], 'south-west': [4, 7]},
    },
    # O arco curto: ARMADO e DISPARO (a flecha saindo).
    'rogueArco': {
        'ataque': ['attack-dir'], 'pele': (0.03, 0.11), 'pele_sv': (0.3, 0.75, 0.75), 'margem': 8, 'cabeca': 8,
        'quadros': [3, 5],
        'por_direcao': {'south': [5, 7], 'south-east': [3, 6], 'east': [3, 5], 'north-east': [2, 6], 'north': [2, 6], 'north-west': [2, 6], 'west': [3, 5], 'south-west': [3, 6]},
    },
    # A besta de mao: MIRA e DISPARO (o virote saindo).
    'rogueBestaDeMao': {
        'ataque': ['attack-dir'], 'pele': (0.03, 0.11), 'pele_sv': (0.3, 0.75, 0.75), 'margem': 8, 'cabeca': 8,
        'quadros': [3, 5],
        'por_direcao': {'south': [4, 5], 'south-east': [3, 4], 'east': [4, 5], 'north-east': [3, 4], 'north': [4, 5], 'north-west': [3, 4], 'west': [4, 5], 'south-west': [3, 4]},
    },
    # ILVAN, mago alto elfo. Sem edicoes de armadura, entao as oito direcoes
    # sao as do modelo, sem espelho (o cajado fica na mao certa). Golpe:
    # ERGUIDO e DESCIDO, pulando os rastros azuis do 3. Magia: o cristal
    # CARREGANDO e a luz SAINDO da mao.
    'wizard': {
        'ataque': ['attack-dir'], 'pele': (0.02, 0.08), 'pele_sv': (0.25, 0.52, 0.78), 'margem': 8, 'cabeca': 10,
        'quadros': [2, 4],
        'por_direcao': {'south': [2, 4], 'south-east': [2, 4], 'east': [2, 4],
                        'north-east': [2, 5], 'north': [1, 4], 'north-west': [3, 5],
                        'west': [3, 5], 'south-west': [2, 5]},
        'conjurar': {'south': [4, 5], 'south-east': [2, 3], 'east': [3, 4],
                     'north-east': [3, 4], 'north': [2, 3], 'north-west': [2, 3],
                     'west': [3, 4], 'south-west': [2, 3]},
    },
    # A adaga do Ilvan: ERGUIDA e ESTOCADA; a magia, CARREGA e SOLTA.
    'wizardAdaga': {
        'ataque': ['attack-dir'], 'pele': (0.02, 0.08), 'pele_sv': (0.25, 0.52, 0.78), 'margem': 8, 'cabeca': 10,
        'quadros': [2, 4],
        'por_direcao': {'south': [1, 3], 'south-east': [2, 4], 'east': [2, 1],
                        'north-east': [3, 5], 'north': [2, 4], 'north-west': [2, 4],
                        'west': [2, 4], 'south-west': [2, 3]},
        'conjurar': {'south': [2, 3], 'south-east': [1, 2], 'east': [2, 3],
                     'north-east': [2, 3], 'north': [2, 3], 'north-west': [1, 2],
                     'west': [2, 3], 'south-west': [3, 4]},
    },
    # GRASK, barbaro meio-orc. Machado ERGUIDO e DESCIDO, pulando os rastros
    # do 4. Ao norte o modelo apaga o machado no rastro (3-6): valem 2 e 7.
    'barbarian': {
        'ataque': ['attack-dir'], 'pele': (0.18, 0.32), 'pele_sv': (0.15, 0.6, 0.3), 'margem': 8, 'cabeca': 10,
        'quadros': [3, 5],
        'por_direcao': {'south': [3, 6], 'south-east': [4, 6], 'east': [3, 5], 'north-east': [6, 1], 'north': [1, 2], 'north-west': [6, 1], 'west': [3, 5], 'south-west': [4, 6]},
    },
    # As duas machadinhas: o golpe de uma mao e o da outra.
    'barbarianMachadinhas': {
        'ataque': ['attack-dir'], 'pele': (0.18, 0.32), 'pele_sv': (0.15, 0.6, 0.3), 'margem': 8, 'cabeca': 10,
        'quadros': [3, 5],
        'por_direcao': {'south': [1, 5], 'south-east': [4, 2], 'east': [2, 7], 'north-east': [3, 5], 'north': [4, 6], 'north-west': [3, 5], 'west': [2, 7], 'south-west': [4, 2]},
    },
    # A azagaia: PREPARA e ARREMESSA.
    'barbarianAzagaia': {
        'ataque': ['attack-dir'], 'pele': (0.18, 0.32), 'pele_sv': (0.15, 0.6, 0.3), 'margem': 8, 'cabeca': 10,
        'quadros': [3, 5],
        'por_direcao': {'south': [3, 4], 'south-east': [4, 5], 'east': [3, 6], 'north-east': [4, 6], 'north': [2, 6], 'north-west': [4, 6], 'west': [3, 6], 'south-west': [4, 5]},
    },
    # TORVIK, paladino anao (a base saiu de placas; a malha e edicao). Quadros
    # escolhidos olhando: sem rastro, sem o giro para a camera, e na azagaia
    # ao norte antes das manchas vermelhas do 6 em diante.
    'paladin': {
        'ataque': ['attack-dir'], 'pele': (0.02, 0.09), 'pele_sv': (0.25, 0.46, 0.85), 'margem': 8, 'cabeca': 10,
        'quadros': [3, 5],
        'por_direcao': {'south': [3, 6], 'south-east': [3, 6], 'east': [3, 5], 'north-east': [1, 8], 'north': [3, 2], 'north-west': [1, 8], 'west': [3, 5], 'south-west': [3, 6]},
    },
    'paladinEspadaGrande': {
        'ataque': ['attack-dir'], 'pele': (0.02, 0.09), 'pele_sv': (0.25, 0.46, 0.85), 'margem': 8, 'cabeca': 10,
        'quadros': [3, 5],
        'por_direcao': {'south': [3, 7], 'south-east': [2, 6], 'east': [2, 7], 'north-east': [4, 8], 'north': [5, 8], 'north-west': [4, 8], 'west': [2, 7], 'south-west': [2, 6]},
    },
    'paladinAzagaia': {
        'ataque': ['attack-dir'], 'pele': (0.02, 0.09), 'pele_sv': (0.25, 0.46, 0.85), 'margem': 8, 'cabeca': 10,
        'quadros': [3, 5],
        'por_direcao': {'south': [3, 5], 'south-east': [3, 5], 'east': [3, 5], 'north-east': [2, 7], 'north': [3, 5], 'north-west': [2, 7], 'west': [3, 5], 'south-west': [3, 5]},
    },
    'paladinBesta': {
        'ataque': ['attack-dir'], 'pele': (0.02, 0.09), 'pele_sv': (0.25, 0.46, 0.85), 'margem': 8, 'cabeca': 10,
        'quadros': [3, 5],
        'por_direcao': {'south': [3, 6], 'south-east': [3, 5], 'east': [2, 3], 'north-east': [3, 5], 'north': [3, 5], 'north-west': [3, 5], 'west': [2, 3], 'south-west': [3, 5]},
    },
    'paladinArco': {
        'ataque': ['attack-dir'], 'pele': (0.02, 0.09), 'pele_sv': (0.25, 0.46, 0.85), 'margem': 8, 'cabeca': 10,
        'quadros': [3, 5],
        'por_direcao': {'south': [4, 6], 'south-east': [3, 6], 'east': [4, 6], 'north-east': [1, 8], 'north': [3, 6], 'north-west': [1, 8], 'west': [4, 6], 'south-west': [3, 6]},
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
# Saturacao (min, max) e valor minimo da pele. A matiz sozinha nao separa: a
# madeira do cajado, o couro do cinto e o bronze da Dragonguard tem a matiz da
# pele clara, e o centro do corpo ia atras deles -- a figura pulava de lado no
# golpe, e o mesmo golpe saia em lugares diferentes em cada armadura.
PELE_SV = (0.35, 1.01, 0.35)
# Direcoes em que o ataque e ancorado pelo pe, quadro a quadro, como o andar.
# Na Dara o modelo SOBE a figura no golpe a noroeste (5 px) e a nordeste
# (3 px), e com a ancora do grupo ela golpeava flutuando sobre a sombra.
PE_NO_ATAQUE = set()


def e_pele(c):
    r, g, b = (x / 255 for x in c[:3])
    h, sat, v = colorsys.rgb_to_hsv(r, g, b)
    lo, hi = PELE
    dentro = lo <= h <= hi if lo <= hi else (h >= lo or h <= hi)
    smin, smax, vmin = PELE_SV
    return dentro and smin < sat < smax and v > vmin


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


# O MARCADOR VERDE VIRA MATERIAL. Arco e besta foram gerados em verde puro
# (ver `editar-pixellab.py`) e ficam no desenho: o tiro e um movimento
# proprio e a arma gerada ja esta no angulo de cada quadro. Aqui o verde vira
# a rampa do material pela luminosidade, e o resto da figura nao muda.
RAMPAS_DO_VERDE = {
    'madeira': [(86, 54, 32), (128, 82, 48), (170, 116, 70), (204, 154, 98)],
    'besta': [(66, 66, 74), (104, 72, 44), (140, 96, 58), (176, 130, 80)],
    # a espada grande verde da postura de duas maos ja e uma espada grande:
    # vira aco, com a rampa da espada original da Dara
    'aco': [(46, 50, 62), (98, 106, 120), (160, 170, 182), (232, 236, 240)],
}


def verde_vira(cel, material):
    """
    O verde vira o material. Onde o verde tem tons, a luminosidade escolhe o
    degrau da rampa. Onde e CHAPADO -- a espada grande saiu num verde so --,
    a luminosidade nao diz nada e tudo viraria um branco liso; ai o degrau
    sai da FORMA: a borda virada para a luz (cima e esquerda) e clara, a do
    lado oposto e escura, o miolo e o tom medio. E o sombreado de tres tons do
    resto da figura.
    """
    out = cel.copy()
    px = out.load()
    W, H = out.size
    if material == 'apagar':
        # Sobra do marcador fora da janela da edicao: some, com o contorno.
        def verde(p):
            h, s, v = colorsys.rgb_to_hsv(*(c / 255 for c in p[:3]))
            return p[3] and 0.2 <= h <= 0.47 and s > 0.35 and v > 0.15
        vs = {(x, y) for y in range(H) for x in range(W) if verde(px[x, y])}
        for x, y in list(vs):
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    q = (x + dx, y + dy)
                    if 0 <= q[0] < W and 0 <= q[1] < H and px[q][3] and max(px[q][:3]) < 40:
                        vs.add(q)
        for q in vs:
            px[q] = (0, 0, 0, 0)
        return out
    rampa = RAMPAS_DO_VERDE[material]

    def e_verde(p):
        h, s, v = colorsys.rgb_to_hsv(*(c / 255 for c in p[:3]))
        return p[3] and 0.2 <= h <= 0.47 and s > 0.35 and v > 0.15
    verdes = {(x, y) for y in range(H) for x in range(W) if e_verde(px[x, y])}
    tons = {px[q][:3] for q in verdes}
    chapado = len(tons) <= 2
    for x, y in verdes:
        if chapado:
            luz = (x - 1, y - 1) not in verdes or (x - 1, y) not in verdes and (x, y - 1) not in verdes
            sombra = (x + 1, y + 1) not in verdes or (x + 1, y) not in verdes and (x, y + 1) not in verdes
            r = rampa[3] if luz and not sombra else rampa[1] if sombra and not luz else rampa[2]
        else:
            v = colorsys.rgb_to_hsv(*(c / 255 for c in px[x, y][:3]))[2]
            r = rampa[min(len(rampa) - 1, int(v * len(rampa) * 0.999))]
        px[x, y] = (*r, px[x, y][3])
    return out


# As pecas de apagar marcador que o conserto do arco usa (vieram do extrator
# de arma, que saiu do projeto quando a arma colada foi abandonada).
def hsv(p):
    return colorsys.rgb_to_hsv(*(x / 255 for x in p[:3]))


def _escuro(p):
    return p[3] and hsv(p)[2] < 0.2


def _escama(p):
    h, s, v = hsv(p)
    return p[3] and (h > 0.94 or h < 0.06) and s > 0.45 and v > 0.2


def _verde(p):
    h, s, v = hsv(p)
    return p[3] and 0.2 <= h <= 0.47 and s > 0.35 and v > 0.15


def _apagar(img, mask):
    """
    Tira a arma e fecha o buraco.

    O buraco e decidido pelos vizinhos: se em volta ha mais fundo (ou
    contorno preto, que e borda e nao corpo) do que corpo, o buraco e fundo.
    Senao e corpo, e a cor vem do vizinho de MESMA PARIDADE -- (x+y) par com
    par, impar com impar. A malha e as escamas sao xadrez de dois tons; copiar
    o vizinho colado da a cor errada em metade dos pixels e o remendo vira
    borrao, copiar o de mesma paridade continua a trama.
    """
    out = img.copy()
    px = out.load()
    W, H = img.size
    falta = set(mask)
    for p in falta:
        px[p] = (0, 0, 0, 0)
    perto = ((1, 0), (-1, 0), (0, 1), (0, -1))
    mesma = ((1, 1), (-1, -1), (1, -1), (-1, 1), (2, 0), (-2, 0), (0, 2), (0, -2))
    for _ in range(30):
        if not falta:
            break
        novo = {}
        for (x, y) in falta:
            viz = [px[x + dx, y + dy] for dx, dy in perto
                   if 0 <= x + dx < W and 0 <= y + dy < H and (x + dx, y + dy) not in falta]
            # Um vizinho so nao decide: na base de uma lamina que sai da mao, o
            # unico vizinho conhecido e a mao, e preencher por ele estendia a
            # mao lamina acima como um palito.
            if len(viz) < 2:
                continue
            opacos = [v for v in viz if v[3] and not _escuro(v)]
            if len(opacos) * 2 <= len(viz):
                novo[(x, y)] = (0, 0, 0, 0)
                continue
            par = [px[x + dx, y + dy] for dx, dy in mesma
                   if 0 <= x + dx < W and 0 <= y + dy < H and (x + dx, y + dy) not in falta
                   and px[x + dx, y + dy][3] and not _escuro(px[x + dx, y + dy])]
            if par:
                novo[(x, y)] = max(set(par), key=par.count)
            elif opacos:
                novo[(x, y)] = max(set(opacos), key=opacos.count)
        if not novo:
            break
        for p, c in novo.items():
            px[p] = c
        falta -= set(novo)
    for p in falta:
        px[p] = (0, 0, 0, 0)
    # FIOS SOLTOS: sobra do contorno da arma fora do corpo, uma linha preta de
    # 1 px com quase nada em volta. Corpo de verdade nunca e assim.
    # Vale para o cinza do aco tambem: um fio de lamina de 1 px que sobrou.
    def cinza(p):
        h, s_, v = hsv(p)
        return _escuro(p) or s_ < 0.3
    for _ in range(5):
        tirar = []
        for y in range(H):
            for x in range(W):
                if not px[x, y][3]:
                    continue
                n = sum(1 for dx in (-1, 0, 1) for dy in (-1, 0, 1) if (dx or dy)
                        and 0 <= x + dx < W and 0 <= y + dy < H and px[x + dx, y + dy][3])
                if n <= 2 and cinza(px[x, y]):
                    tirar.append((x, y))
        for p in tirar:
            px[p] = (0, 0, 0, 0)
    return out


class _Marcador:
    escuro = staticmethod(_escuro)
    escama = staticmethod(_escama)
    verde = staticmethod(_verde)
    apagar = staticmethod(_apagar)


def colar_arco(cel, parado):
    """
    O ARCO DO PARADO NO QUADRO DO ANDAR.

    No andar o modelo quebra o arco em metade das direcoes: some, se parte em
    pedacos, gira de lado. Aqui o arco do quadro (o verde) sai e entra o do
    parado, inteiro, deslocado o quanto a cabeca se deslocou -- a cabeca e a
    parte do corpo que melhor acompanha o balanco do passo. O braco do arco
    no andar quase nao mexe, entao o arco parado no lugar le como segurado.
    """
    ea = _Marcador
    W, H = cel.size
    pc = cel.load()
    verde_q = {(x, y) for y in range(H) for x in range(W) if ea.verde(pc[x, y])}
    # o contorno do arco velho: escuro encostado no verde
    contorno = {(x + dx, y + dy) for x, y in verde_q for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
                if 0 <= x + dx < W and 0 <= y + dy < H and (x + dx, y + dy) not in verde_q
                and ea.escuro(pc[x + dx, y + dy])}
    limpo = ea.apagar(cel, verde_q | contorno)

    def topo_da_cabeca(img):
        p = img.load()
        pts = [(x, y) for y in range(img.height) for x in range(img.width) if ea.escama(p[x, y])]
        if not pts:
            return None
        t = pts[0][1]
        cab = [x for x, y in pts if y < t + 12]
        return sorted(cab)[len(cab) // 2], t
    a, b = topo_da_cabeca(parado), topo_da_cabeca(limpo)
    dx, dy = (b[0] - a[0], b[1] - a[1]) if a and b else (0, 0)
    pp = parado.load()
    verde_p = {(x, y) for y in range(H) for x in range(W) if ea.verde(pp[x, y])}
    out = limpo.copy()
    po = out.load()
    novos = set()
    for x, y in verde_p:
        q = (x + dx, y + dy)
        if 0 <= q[0] < W and 0 <= q[1] < H:
            po[q] = pp[x, y]
            novos.add(q)
    for x, y in novos:
        for ex, ey in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            q = (x + ex, y + ey)
            if 0 <= q[0] < W and 0 <= q[1] < H and q not in novos and not po[q][3]:
                po[q] = (13, 11, 17, 255)
    return out


def base_do_quadro(cel):
    """A fileira mais baixa com pixel aceso, ou None se o quadro for vazio."""
    bb = cel.getbbox()
    return None if bb is None else bb[3] - 1


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--fonte', required=True, help='pasta com o PNG e o JSON do PixelLab')
    p.add_argument('--chave', default='goblin')
    p.add_argument('--nome', help='nome do arquivo de saida (padrao: a chave)')
    p.add_argument('--espelho', action='store_true',
                   help='o lado oeste sai do leste virado (folhas editadas so em 5 direcoes)')
    p.add_argument('--verde', help='o verde que sobrar vira este material (ver RAMPAS_DO_VERDE)')
    p.add_argument('--queda-de', help='pasta de onde tirar o corpo no chao (padrao: a do perfil)')
    p.add_argument('--ataque-de', action='append', default=[],
                   help='direcao=pasta:q1,q2 -- o golpe dessa direcao vem de OUTRA pasta (um golpe '
                        'regerado e vestido a parte, o REMENDO), com os quadros dados')
    a = p.parse_args()
    global PLANO, QUADROS_POR_DIRECAO, PELE, PELE_SV, CABECA, PE_NO_ATAQUE
    perfil = dict(PERFIS.get(a.chave, {}))
    if a.espelho:
        perfil['espelho'] = True
    if a.verde:
        perfil['verde_vira'] = a.verde
    if a.queda_de:
        perfil['queda_de'] = a.queda_de
    PE_NO_ATAQUE = {('attack', d) for d in perfil.get('pe_no_ataque', [])}
    PELE = perfil.get('pele', PELE)
    PELE_SV = perfil.get('pele_sv', PELE_SV)
    CABECA = perfil.get('cabeca', CABECA)
    if 'ataque' in perfil:
        PLANO = [(n, ('animation', perfil['ataque']), perfil['quadros'], h)
                 if n == 'attack' else (n, fonte_, q, h)
                 for n, fonte_, q, h in PLANO]
        QUADROS_POR_DIRECAO = {('attack', d): q
                               for d, q in perfil.get('por_direcao', {}).items()}
    # A MAGIA (`conjurar`), para quem conjura: o gesto proprio do `cast-dir`,
    # CARREGA e SOLTA, que o motor usa nas magias no lugar do golpe. Quem nao
    # tem a animacao conjura com o golpe, como sempre.
    if 'conjurar' in perfil:
        PLANO = PLANO + [('conjurar', ('animation', 'cast-dir'), [3, 5], [10, 16])]
        QUADROS_POR_DIRECAO.update({('conjurar', d): q for d, q in perfil['conjurar'].items()})

    fonte = Path(a.fonte)
    meta = json.loads(next(j for j in fonte.glob('*.json') if j.name not in ('armas.json', 'meta.json')).read_text(encoding='utf-8'))['spritesheet']
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
    # A POSE DE CHAO PODE VIR DE OUTRA FOLHA. As posturas de arma da Dara
    # (sem escudo, arco, besta, duas maos) nao geraram queda: o corpo no chao
    # e o mesmo em todas, e vem da folha principal dela (`queda_de`).
    im_queda, porDir_queda = im, porDir
    if perfil.get('queda_de'):
        fq = AQUI / perfil['queda_de']
        mq = json.loads(next(j for j in fq.glob('*.json') if j.name not in ('armas.json', 'meta.json'))
                        .read_text(encoding='utf-8'))['spritesheet']
        im_queda = Image.open(fq / mq['path']).convert('RGBA')
        # Celula de outro tamanho (a besta do Brenn tem 76, a maca 72): cada
        # celula da queda e recentrada numa celula do tamanho desta folha.
        cq, cn = mq['cell_size']['width'], meta['cell_size']['width']
        if cq != cn:
            colunas, linhas = im_queda.width // cq, im_queda.height // cq
            nova = Image.new('RGBA', (colunas * cn, linhas * cn), (0, 0, 0, 0))
            for lin in range(linhas):
                for col in range(colunas):
                    cel = im_queda.crop((col * cq, lin * cq, (col + 1) * cq, (lin + 1) * cq))
                    nova.paste(cel, (col * cn + (cn - cq) // 2, lin * cn + (cn - cq) // 2))
            im_queda = nova
        porDir_queda = {}
        for r in mq['rows']:
            if r['type'] == 'animation':
                porDir_queda.setdefault(re.sub(r'_\d+$', '', r['animation'] or ''), {})[r['direction']] = r
    queda = None
    for nome_q, quadro_q in QUEDAS:
        r = porDir_queda.get(nome_q, {}).get('south')
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

    # A MARGEM: a celula do motor e maior que a do PixelLab, `margem` px de
    # folga em volta. O importador puxa o corpo de volta para o centro no
    # golpe, e a arma que o modelo desenhou encostada na borda saia cortada
    # pela celula; o machado que desce abaixo dos pes, tambem. Com a margem
    # embaixo o chao sobe na celula, e a folha diz onde ele fica (`ground`):
    # `drawSprite` desce a figura o tanto que o chao subiu.
    SCW, SCH = CW, CH
    M = perfil.get('margem', 0)
    CW, CH = SCW + 2 * M, SCH + 2 * M
    CHAO = GROUND + M

    def com_margem(cel):
        if not M:
            return cel
        nova = Image.new('RGBA', (CW, CH), (0, 0, 0, 0))
        nova.paste(cel, (M, M))
        return nova

    def recorte(row, f, fonte_im=None):
        cel = com_margem((fonte_im or im).crop((f * SCW, row * SCH, (f + 1) * SCW, (row + 1) * SCH)))
        return verde_vira(cel, perfil['verde_vira']) if perfil.get('verde_vira') else cel

    alvo = CH - CHAO - 1

    def origem(fonte_, idx, dir_):
        '''(fileira, coluna) do quadro na folha do PixelLab.'''
        tipo, arg = fonte_
        if tipo == 'rotations':
            return rot['row'], rot['directions'].index(dir_)
        if tipo == 'queda':
            return queda[0]['row'], queda[1]
        return grupo(arg, dir_)['row'], idx

    # O REMENDO: o golpe de algumas direcoes vem de outra pasta.
    remendos = {}
    for r_ in a.ataque_de:
        dir_r, resto = r_.split('=', 1)
        pasta_r, qs = resto.rsplit(':', 1)
        pr = Path(pasta_r)
        mr = json.loads(next(j for j in pr.glob('*.json') if j.name not in ('armas.json', 'meta.json'))
                        .read_text(encoding='utf-8'))['spritesheet']
        imr = Image.open(pr / mr['path']).convert('RGBA')
        linhas = [x for x in mr['rows'] if x['type'] == 'animation'
                  and re.sub(r'_\d+$', '', x['animation'] or '') in (
                      [perfil['ataque']] if isinstance(perfil.get('ataque'), str) else perfil.get('ataque', []))
                  and x['direction'] == dir_r]
        remendos[dir_r] = (imr, linhas[-1]['row'])          # o grupo mais novo da direcao
        QUADROS_POR_DIRECAO[('attack', dir_r)] = [int(q) for q in qs.split(',')]

    def quadro(fonte_, idx, dir_):
        if fonte_[0] == 'animation' and fonte_[1] == perfil.get('ataque') and dir_ in remendos:
            imr, row = remendos[dir_]
            return recorte(row, idx, fonte_im=imr)
        if fonte_[0] == 'queda':
            return recorte(*origem(fonte_, idx, dir_), fonte_im=im_queda)
        if fonte_ == ('animation', 'walk') and dir_ in perfil.get('arco_do_parado', ()):
            row, col = origem(fonte_, idx, dir_)
            bruto = com_margem(im.crop((col * SCW, row * SCH, (col + 1) * SCW, (row + 1) * SCH)))
            parado = com_margem(im.crop((rot['directions'].index(dir_) * SCW, rot['row'] * SCH,
                                         (rot['directions'].index(dir_) + 1) * SCW, (rot['row'] + 1) * SCH)))
            cel = colar_arco(bruto, parado)
            return verde_vira(cel, perfil['verde_vira']) if perfil.get('verde_vira') else cel
        return recorte(*origem(fonte_, idx, dir_))

    # A ARMA, quando a folha veio de `extrair-arma.py`: a mao, o eixo e o
    # alcance de cada quadro, medidos na folha do PixelLab. Seguem o quadro
    # para a folha do motor com o mesmo deslocamento que o quadro sofre.
    medidas = fonte / 'armas.json'
    armas_fonte = json.loads(medidas.read_text(encoding='utf-8')) if medidas.exists() else None
    armas = {}

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
        for linha, dir_real in enumerate(DIRECOES):
            # ESPELHO: o lado oeste sai do leste virado. Gera-se 5 direcoes em
            # vez de 8 (a arma e o escudo trocam de mao olhando para oeste,
            # como em muito jogo isometrico); ver `espelho` nos perfis.
            dir_ = ESPELHO.get(dir_real, dir_real) if perfil.get('espelho') else dir_real
            desloca = ancora(fonte_, dir_)
            escolha = QUADROS_POR_DIRECAO.get((nome, dir_), quadros)
            ref_x = centro_do_corpo(quadro(fonte_, 0, dir_)) if nome in ('attack', 'conjurar') else None
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
                if armas_fonte is not None:
                    row, col = origem(fonte_, idx, dir_)
                    m = armas_fonte.get(str(row), {}).get(str(col))
                    if m:
                        m = dict(m, mao=[round(m['mao'][0] + dx, 1), round(m['mao'][1] + dy, 1)])
                    armas.setdefault(nome, [[] for _ in DIRECOES])[linha].append(m)
                # Ampliar depois de deslocar mantem o alinhamento de blocos
                # 3x3, que e o que permite ao tabuleiro dividir por S sem
                # perder pixel.
                if dir_ != dir_real:
                    celula = celula.transpose(Image.FLIP_LEFT_RIGHT)
                folha.alpha_composite(celula.resize((CW * S, CH * S), Image.NEAREST),
                                      (f * CW * S, bloco + linha * CH * S))

    SAIDA.mkdir(parents=True, exist_ok=True)
    nome_saida = a.nome or a.chave
    png = SAIDA / f'{nome_saida}.png'
    folha.save(png, optimize=True)
    saida = {
        'cell': [CW * S, CH * S], 's': S, 'ground': CHAO,
        'w': largura, 'h': altura, 'dirs': DIRECOES, 'anims': anims,
    }
    # As medidas da arma, em px LOGICOS dentro da celula: armas[anim][dir][quadro].
    # `null` onde o quadro nao tem arma (no chao, ou o extrator nao achou).
    if armas:
        # QUADRO SEM ARMA VISIVEL: de costas e de lado a arma fica atras do
        # corpo, e o extrator nao acha nada. Sem medida a arma sumiria por um
        # quadro do andar e voltaria no seguinte. Vale a medida do vizinho da
        # mesma direcao -- outro quadro da animacao, depois o andar, depois o
        # parado, e por ultimo o ataque -- desenhada ATRAS do corpo, que e
        # onde ela estava.
        for n, ds in armas.items():
            if n in ('down', 'sleep', 'dead'):
                continue
            for d, qs in enumerate(ds):
                for q, m in enumerate(qs):
                    if m is not None:
                        continue
                    for fonte_viz in (qs, armas.get('walk', [[]] * 8)[d], armas.get('idle', [[]] * 8)[d],
                                      armas.get('attack', [[]] * 8)[d]):
                        viz = [v for v in fonte_viz if v and not v.get('inferida')]
                        if viz:
                            qs[q] = dict(viz[0], frente=False, inferida=True)
                            break
        saida['armas'] = armas
        faltam = [(n, DIRECOES[d], q) for n, ds in armas.items() if n not in ('down', 'sleep', 'dead')
                  for d, qs in enumerate(ds) for q, m in enumerate(qs) if m is None]
        print(f'medidas de arma: {sum(len(q) for ds in armas.values() for q in ds)} quadros, '
              f'{len(faltam)} sem medida em pe: {faltam}')
    (SAIDA / f'{nome_saida}.json').write_text(json.dumps(saida, indent=2), encoding='utf-8')
    print(f'{png}  {largura}x{altura}  {png.stat().st_size/1024:.0f} KB')
    print(f'{len(PLANO)} animacoes x {len(DIRECOES)} direcoes')


if __name__ == '__main__':
    main()
