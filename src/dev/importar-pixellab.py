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


# O SOPRO DO DRAGAO VERDE, quadro a quadro (preparar, soltar): os mesmos nas
# duas folhas dele. Ver o perfil `dragaoVerdeJovem`.
_DRAGAO_SOPRO = {'south': [3, 6], 'south-east': [3, 5], 'east': [2, 5], 'north-east': [4, 6],
                 'north': [2, 4], 'north-west': [4, 6], 'west': [2, 5], 'south-west': [1, 6]}


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
    # CORIN, patrulheiro humano. Espada ERGUIDA e GOLPE, pulando os rastros
    # brancos; ao nordeste o golpe (2) vem antes do erguido (5) no modelo.
    # O BUGBEAR: clava ERGUIDA e o GOLPE, pulando os rastros de terra e, ao
    # norte, o brilho branco dos quadros 4-5. Centro pela mediana de TODO o
    # pelo fulvo, sem `cabeca`: com a clava erguida a pele mais alta e a MAO,
    # e medir por ela jogava o corpo 45 px para o lado oposto.
    'bugbear80': {
        'ataque': ['attack-dir'], 'pele': (0.06, 0.13), 'pele_sv': (0.4, 0.92, 0.55), 'margem': 8,
        'quadros': [3, 6],
        'por_direcao': {'south': [3, 6], 'south-east': [2, 5], 'east': [3, 6], 'north-east': [3, 6], 'north': [2, 6], 'north-west': [4, 8], 'west': [4, 7], 'south-west': [3, 6]},
    },
    # O KLARG: o mesmo corpo de pelo descorado (`reskins-klarg.py`); o centro
    # e o pelo cor de osso, pouco saturado.
    'klarg': {
        'ataque': ['attack-dir'], 'pele': (0.06, 0.16), 'pele_sv': (0.06, 0.4, 0.55), 'margem': 8,
        'quadros': [3, 6],
        'por_direcao': {'south': [3, 6], 'south-east': [2, 5], 'east': [3, 6], 'north-east': [3, 6], 'north': [2, 6], 'north-west': [4, 8], 'west': [4, 7], 'south-west': [3, 6]},
    },
    # O MARCARRUBRA: espada ERGUIDA e o CORTE (um corte so: com dois o modelo
    # girava o corpo). A nordeste ele ainda vira de frente no meio do golpe;
    # valem o 5 e o 8, de costas.
    # Centro pela pele de toda a figura (sem `cabeca`, a mao erguida enganaria).
    'marcarrubra': {
        'ataque': ['attack-dir'], 'pele': (0.04, 0.11), 'pele_sv': (0.3, 0.75, 0.5), 'margem': 8,
        'quadros': [3, 6],
        'por_direcao': {'south': [3, 6], 'south-east': [4, 6], 'east': [2, 4], 'north-east': [5, 8],
                        'north': [1, 3], 'north-west': [2, 3], 'west': [2, 4], 'south-west': [3, 6]},
    },
    # O ESQUELETO: espada ERGUIDA e o GOLPE (a revisao trocou S, E e W: no
    # quadro de antes a espada sumia ou o corpo virava de perfil). Centro pelo osso (bege, meio
    # saturado); sem `cabeca`, que a mao erguida engana.
    'esqueleto': {
        'ataque': ['attack-dir'], 'pele': (0.06, 0.14), 'pele_sv': (0.2, 0.7, 0.5), 'margem': 8,
        'quadros': [2, 4],
        'por_direcao': {'south': [2, 7], 'south-east': [3, 5], 'east': [2, 4], 'north-east': [2, 4],
                        'north': [3, 6], 'north-west': [3, 5], 'west': [3, 4], 'south-west': [3, 6]},
    },
    # O RATO GIGANTE (quadrupede pequeno, esqueleto `cat`): AGACHADO e o BOTE
    # (ao norte o 5 erguia o rato nas patas de tras; ao sul o 5 virava para SE).
    # Centro pelo pelo pardo, como o lobo.
    'ratoGigante': {
        'ataque': ['attack-dir'], 'pele': (0.0, 1.0), 'pele_sv': (-0.01, 0.3, 0.3), 'margem': 8,
        'quadros': [2, 4],
        'por_direcao': {'south': [2, 3], 'south-east': [2, 4], 'east': [2, 4], 'north-east': [2, 4],
                        'north': [3, 6], 'north-west': [2, 4], 'west': [2, 5], 'south-west': [2, 4]},
    },
    # O VIGIA CICLOPICO (o personagem animado e o `vigiaDirecoes`: vistas
    # reordenadas, oeste espelhado do leste na tira). Golpe: ERGUE a garra e
    # RASGA. Centro pela pele marrom-escura.
    'vigiaDirecoes': {
        'ataque': ['attack-dir'], 'pele': (0.0, 0.1), 'pele_sv': (0.25, 0.8, 0.25), 'margem': 8,
        'quadros': [3, 5],
        'por_direcao': {'south': [3, 6], 'south-east': [2, 4], 'east': [3, 4], 'north-east': [4, 5],
                        'north': [4, 5], 'north-west': [4, 5], 'west': [3, 4], 'south-west': [3, 4]},
    },
    # O CAJAVIDRO: cajado ERGUIDO e o GOLPE; a magia, CARREGA e SOLTA. A oeste
    # e a sudoeste o meio da magia descora a tunica para rosa: valem os
    # quadros de fora dela.
    'cajavidro': {
        'ataque': ['attack-dir'], 'pele': (0.03, 0.1), 'pele_sv': (0.25, 0.6, 0.55), 'margem': 8,
        'quadros': [2, 5],
        'por_direcao': {'south': [2, 7], 'south-east': [2, 5], 'east': [3, 5], 'north-east': [3, 6],
                        'north': [2, 6], 'north-west': [3, 5], 'west': [3, 6], 'south-west': [4, 6]},
        'conjurar': {'south': [2, 6], 'south-east': [2, 3], 'east': [2, 3], 'north-east': [3, 5],
                     'north': [1, 4], 'north-west': [2, 3], 'west': [1, 2], 'south-west': [1, 4]},
    },
    # O LOBO (quadrupede). Nao ha pele: o centro e o PELO cinza (qualquer matiz,
    # pouca saturacao, nem o contorno nem o branco puro). Golpe: AGACHADO e o
    # BOTE de boca aberta. Sem edicoes, as oito direcoes sao do modelo.
    'loboDirecoes': {
        'ataque': ['attack-dir'], 'pele': (0.0, 1.0), 'pele_sv': (-0.01, 0.25, 0.3), 'margem': 8,
        'quadros': [2, 4],
        'por_direcao': {'south': [2, 4], 'south-east': [2, 4], 'east': [2, 4], 'north-east': [2, 4],
                        'north': [2, 4], 'north-west': [3, 5], 'west': [2, 4], 'south-west': [2, 4]},
    },
    # O LOBO ATROZ: o mesmo criterio do lobo, com o pelo quase preto azulado
    # (saturacao ate 0,6, valor desde 0,15: so o contorno preto fica de fora).
    # Ao norte o quadro 3 vira a cara para quem olha: o 1 e o 4.
    'loboAtrozDirecoes': {
        'ataque': ['attack-dir'], 'pele': (0.0, 1.0), 'pele_sv': (-0.01, 0.6, 0.15), 'margem': 8,
        'quadros': [2, 4],
        'por_direcao': {'south': [2, 4], 'south-east': [2, 5], 'east': [1, 3], 'north-east': [1, 4],
                        'north': [1, 4], 'north-west': [2, 4], 'west': [2, 4], 'south-west': [2, 4]},
    },
    # O ORC e o BRUGHOR: machado ERGUIDO e a PANCADA, olhando. Pele cinza:
    # o centro e o cinza claro pouco saturado (o pelo fulvo e o couro ficam
    # de fora pela saturacao; o ferro do machado e do elmo e mais escuro).
    'orc': {
        'ataque': ['attack-dir'], 'pele': (0.0, 1.0), 'pele_sv': (-0.01, 0.12, 0.5), 'margem': 8,
        # a calca oliva do golpe e da queda vira a cinza-azulada da parada
        'oliva_vira': [(21, 20, 26), (35, 37, 46), (58, 60, 72)],
        'quadros': [3, 6],
        'por_direcao': {'south': [4, 7], 'south-east': [3, 5], 'east': [3, 6], 'north-east': [3, 6],
                        'north': [4, 7], 'north-west': [3, 7], 'west': [3, 5], 'south-west': [3, 7]},
    },
    'brughor': {
        'ataque': ['attack-dir'], 'pele': (0.0, 1.0), 'pele_sv': (-0.01, 0.12, 0.5), 'margem': 8,
        'quadros': [3, 6],
        'por_direcao': {'south': [3, 6], 'south-east': [3, 6], 'east': [3, 5], 'north-east': [4, 6],
                        'north': [3, 5], 'north-west': [4, 7], 'west': [4, 7], 'south-west': [5, 8]},
    },
    # O OGRO (gordo, pelo modelo oficial): clava ERGUIDA e a PANCADA. Centro
    # pela pele bege-palida; o valor alto deixa a madeira da clava de fora. A
    # noroeste o modelo vira a cara para oeste no fim e o rastro cobre o corpo,
    # e ao norte a clava some na pancada: ali a clava erguida e depois baixa
    # (3 e 1, 3 e 0). Ao sul o 5 encostava na borda de baixo; a oeste o 5
    # achatava a clava.
    'ogroGordo': {
        'ataque': ['attack-dir'], 'pele': (0.05, 0.13), 'pele_sv': (0.2, 0.6, 0.55), 'margem': 8,
        'quadros': [3, 5],
        'por_direcao': {'south': [3, 7], 'south-east': [3, 5], 'east': [3, 5], 'north-east': [3, 5],
                        'north': [3, 1], 'north-west': [3, 0], 'west': [4, 6], 'south-west': [3, 6]},
    },
    # O REI GROL (o bugbear de 80 editado): machado ERGUIDO e a PANCADA. Pelo
    # quase preto: o centro e o do lobo atroz (qualquer matiz, valor desde
    # 0,15). Ao sul o 3 e uma explosao branca: o 2 e o 5.
    'reiGrol': {
        'ataque': ['attack-dir'], 'pele': (0.0, 1.0), 'pele_sv': (-0.01, 0.6, 0.15), 'margem': 8,
        'quadros': [3, 6],
        'por_direcao': {'south': [2, 5], 'south-east': [2, 5], 'east': [3, 6], 'north-east': [3, 5],
                        'north': [3, 7], 'north-west': [4, 7], 'west': [3, 6], 'south-west': [3, 6]},
    },
    # A CORUJA-URSO: a pata erguida e o bote de garra e bico. Centro pelo pelo
    # cinza-arroxeado. A nordeste, do 3 ao 5, sobram lascas soltas no ar: 2 e 6.
    'corujaUrsoDirecoes': {
        'ataque': ['attack-dir'], 'pele': (0.6, 0.95), 'pele_sv': (0.05, 0.45, 0.25), 'margem': 8,
        'quadros': [3, 5],
        'por_direcao': {'south': [3, 5], 'south-east': [3, 5], 'east': [3, 5], 'north-east': [2, 6],
                        'north': [3, 4], 'north-west': [3, 5], 'west': [3, 5], 'south-west': [3, 5]},
    },
    # O ZUMBI: os bracos ERGUIDOS e a PANCADA. Centro pela pele cinza-parda
    # (o colete verde-azulado e o cabelo cinza ficam de fora).
    'zumbi': {
        'ataque': ['attack-dir'], 'pele': (0.05, 0.15), 'pele_sv': (0.15, 0.6, 0.35), 'margem': 8,
        'quadros': [3, 5],
        'por_direcao': {'south': [4, 5], 'south-east': [3, 5], 'east': [2, 4], 'north-east': [3, 5],
                        'north': [3, 5], 'north-west': [4, 6], 'west': [4, 6], 'south-west': [4, 6]},
    },
    # O GRICK (vista sul aprovada pelo dono). O Multiataque do livro: o quadro 1
    # e os TENTACULOS chicoteando abertos (2), o 2 e o feixe fechado com o BICO
    # mordendo na ponta (4 ou 5). Centro pelo couro verde-oliva.
    'grick': {
        'ataque': ['attack-dir'], 'pele': (0.12, 0.25), 'pele_sv': (0.2, 0.6, 0.25), 'margem': 8,
        'quadros': [2, 4],
        'por_direcao': {'south': [2, 4], 'south-east': [2, 4], 'east': [1, 4], 'north-east': [2, 5],
                        'north': [2, 4], 'north-west': [2, 4], 'west': [2, 4], 'south-west': [2, 5]},
    },
    # O CARNICAL (aprovado pelo dono): o PREPARO e a GARRADA. Centro pela pele
    # cinza-azulada. Ao norte o 5 e o 6 deixam riscos no ar: o 4 e o 7.
    'carnical': {
        'ataque': ['attack-dir'], 'pele': (0.5, 0.66), 'pele_sv': (0.08, 0.45, 0.45), 'margem': 8,
        'quadros': [2, 4],
        'por_direcao': {'south': [2, 4], 'south-east': [2, 4], 'east': [2, 4], 'north-east': [2, 4],
                        'north': [4, 7], 'north-west': [3, 4], 'west': [2, 4], 'south-west': [2, 4]},
    },
    # HAMUN KOST (aprovado pelo dono): o PREPARO e a MAO ESPECTRAL saindo da
    # palma (o Toque Arrepiante). Centro pela pele palida da cabeca e das maos.
    # A oeste o primeiro pedido virou para a direita: pedido de novo (1 ger.).
    'hamunKost': {
        'ataque': ['attack-dir'], 'pele': (0.03, 0.11), 'pele_sv': (0.12, 0.5, 0.6), 'margem': 8,
        'quadros': [2, 4],
        'por_direcao': {'south': [2, 4], 'south-east': [1, 3], 'east': [1, 3], 'north-east': [3, 5],
                        'north': [1, 3], 'north-west': [2, 4], 'west': [3, 4], 'south-west': [2, 4]},
    },
    # O DOPPELGANGER (forma verdadeira, aprovada pelo dono): o braco ARMADO e o
    # GOLPE do punho. Centro pela pele cinza-azulada (pouca saturacao).
    'doppelganger': {
        'ataque': ['attack-dir'], 'pele': (0.5, 0.72), 'pele_sv': (0.05, 0.4, 0.3), 'margem': 8,
        'quadros': [3, 4],
        # A leste o modelo vira de costas no golpe duas vezes: o de oeste espelhado.
        'espelhar_ataque': {'east': 'west'},
        'por_direcao': {'south': [3, 4], 'south-east': [3, 4], 'east': [3, 4], 'north-east': [2, 4],
                        'north': [3, 4], 'north-west': [3, 4], 'west': [3, 4], 'south-west': [3, 4]},
    },
    # A DROW (aprovada pelo dono): o golpe de ESPADA CURTA (braco armado e o
    # corte, sem o quadro do rastro branco) e o TIRO de besta de mao (a mira e o
    # disparo), este pelo `--ataque-de` vindo do `drowTiro`. Centro pela pele
    # cinza-arroxeada (a armadura preta fica de fora pelo valor).
    'drowEspada': {
        'ataque': ['attack-dir'], 'pele': (0.65, 0.82), 'pele_sv': (0.06, 0.45, 0.28), 'margem': 8,
        'quadros': [2, 4],
        'por_direcao': {'south': [2, 4], 'south-east': [2, 4], 'east': [1, 5], 'north-east': [3, 4],
                        'north': [1, 3], 'north-west': [3, 5], 'west': [5, 6], 'south-west': [4, 6]},
    },
    # O CULTO DO DRAGAO de Arvore Trovao (aprovados pelo dono). O golpe sai do
    # `pixminimax`, que de COSTAS vira o personagem de frente no meio do golpe
    # (nordeste, norte e noroeste do acolito; nordeste, norte e noroeste do
    # sacerdote), e ainda deixa arcos de movimento riscados no ar. Os quadros
    # abaixo foram escolhidos olhando a grade das nove: so entram os que mantem o
    # rosto para o lado certo e sem arco. Onde nenhum serve, o lado da frente
    # vem do ESPELHO do outro (acolito: noroeste do nordeste; sacerdote: nordeste
    # do noroeste). CENTRO PELO MANTO verde (matiz 0,30-0,50): o corpo todo esta
    # sob ele em qualquer vista. Pela pele nao deu -- o brilho da clava tem o
    # mesmo tom da pele, e de costas o corpo escorregava 26 a 33 px de lado.
    'acolito': {
        'ataque': ['attack-dir'], 'pele': (0.30, 0.50), 'pele_sv': (0.2, 1.0, 0.2), 'margem': 8,
        'quadros': [3, 4],
        'espelhar_ataque': {'north-west': 'north-east'},
        'por_direcao': {'south': [3, 4], 'south-east': [3, 5], 'east': [3, 4], 'north-east': [6, 5],
                        'north': [1, 7], 'north-west': [6, 5], 'west': [4, 5], 'south-west': [4, 5]},
    },
    'sacerdote': {
        'ataque': ['attack-dir'], 'pele': (0.30, 0.50), 'pele_sv': (0.2, 1.0, 0.2), 'margem': 8,
        'quadros': [4, 6],
        'espelhar_ataque': {'north-east': 'north-west'},
        'por_direcao': {'south': [4, 6], 'south-east': [4, 6], 'east': [3, 5], 'north-east': [1, 2],
                        'north': [2, 7], 'north-west': [1, 2], 'west': [4, 6], 'south-west': [3, 5]},
    },
    # OS TRES DA ESTRADA (aprovados pelo dono): figuras paradas, so as vistas e a
    # queda. Centro irrelevante (sem golpe a recentrar).
    'sildar': {'estatico': True, 'margem': 8},
    'gundren': {'estatico': True, 'margem': 8},
    'reidoth': {'estatico': True, 'margem': 8},
    # A FAMILIA DENDRAR (parada, so a queda) e os FAMILIARES (andam, nao atacam).
    'mirna': {'estatico': True, 'margem': 8},
    'nars': {'estatico': True, 'margem': 8},
    'nilsa': {'estatico': True, 'margem': 8},
    # O RATO sai do PixelLab do tamanho do rato gigante (31 px) e e MIUDO: depois de
    # importar, `reduzir-folha.py --fator 0.8` (o original fica em
    # `_referencias/pixellab/familiares-tamanho-original`).
    'familiarRat': {'ataque_parado': True, 'margem': 8},
    'familiarBat': {'ataque_parado': True, 'margem': 8},
    # O STIRGE (aprovado pelo dono, 24 px): as asas recolhidas e o MERGULHO da
    # tromba (o Drenar Sangue). Centro pelo corpo ferrugem.
    'stirge': {
        'ataque': ['attack-dir'], 'pele': (0.97, 0.06), 'pele_sv': (0.3, 0.85, 0.2), 'margem': 8,
        'quadros': [2, 4],
        'por_direcao': {'south': [2, 4], 'south-east': [2, 4], 'east': [2, 4], 'north-east': [2, 4],
                        'north': [2, 4], 'north-west': [2, 4], 'west': [2, 4], 'south-west': [2, 4]},
    },
    # OS TRES INFECTADOS (aprovados pelo dono). O "centro do corpo" de cada um
    # e medido pela cor que ele TEM, e os tres sao casos diferentes:
    #   . o GALHO e madeira morna (matiz ~0,11) de saturacao baixa;
    #   . o ESPETO e QUASE PRETO: nao da para medir por matiz nenhum, entao o
    #     criterio e so o valor -- qualquer pixel acima do contorno conta;
    #   . a VINHA e azul-esverdeada (matiz ~0,5), a unica fria do trio.
    # Os quadros do golpe sao escolhidos depois de olhar; aqui fica o padrao.
    'galhoInfectado': {
        'ataque': ['attack-dir'], 'pele': (0.05, 0.16), 'pele_sv': (0.12, 0.6, 0.3),
        'margem': 6, 'quadros': [2, 4],
        'por_direcao': {'south': [2, 4], 'south-east': [2, 4], 'east': [2, 4],
                        'north-east': [2, 4], 'north': [2, 4], 'north-west': [2, 4],
                        'west': [2, 4], 'south-west': [2, 4]},
    },
    'espetoInfectado': {
        'ataque': ['attack-dir'], 'pele': (0.0, 1.0), 'pele_sv': (-0.01, 1.0, 0.07),
        'margem': 6, 'quadros': [2, 4],
        'por_direcao': {'south': [2, 4], 'south-east': [2, 4], 'east': [2, 4],
                        'north-east': [2, 4], 'north': [2, 4], 'north-west': [2, 4],
                        'west': [2, 4], 'south-west': [2, 4]},
    },
    # A GARRA do espeto, a segunda folha dele. Ele tem DOIS ataques no livro --
    # agulhas de 9 m e garras de perto -- e uma folha so fazia o chicote das
    # agulhas tambem quando ele batia colado. Mesmo caso do hobgoblin com a
    # espada e o arco: duas folhas, e `aparencias` troca pelo nome do ataque.
    # O andar e a queda vem da folha do chicote (--queda-de), que sao os mesmos.
    'espetoInfectadoGarra': {
        'ataque': ['attack-dir'], 'pele': (0.0, 1.0), 'pele_sv': (-0.01, 1.0, 0.07),
        'margem': 6, 'quadros': [2, 4],
        'por_direcao': {'south': [2, 4], 'south-east': [2, 4], 'east': [2, 4],
                        'north-east': [2, 4], 'north': [2, 4], 'north-west': [2, 4],
                        'west': [2, 4], 'south-west': [2, 4]},
    },
    # VENOMFANG, o DRAGAO VERDE JOVEM, de QUATRO PATAS -- o desenho do dono.
    #
    # Centro pela massa inteira (como o espeto): as asas aqui estao DOBRADAS nas
    # costas, e nao abertas para os lados como no empinado descartado, entao nao
    # arrastam a mediana. So o contorno quase preto fica de fora.
    #
    # Os quadros do golpe foram escolhidos MEDINDO: o bote e o quadro que mais se
    # afasta da pose do quadro 0, e o recolhido e o ultimo antes do salto. Os
    # indices mudam muito entre direcoes (o bote e o 3 ao sul e o 6 ao norte).
    #
    # NORDESTE ESPELHADO DO NOROESTE. A mordida gerada para nordeste e a unica
    # suja da folha: 25 pixels soltos flutuando em volta da figura, e no meio do
    # golpe o corpo gira de lado em vez de morder para a frente. As vistas do lado
    # oeste da tira sao espelho das do leste -- o dragao e simetrico --, entao a
    # mordida do noroeste, limpa, espelhada vira a do nordeste.
    # TAMANHO. O que o PixelLab devolve tem o tamanho de um dragao ADULTO (figura
    # de 155x160 px logicos, para 3x3 casas, Enorme): o jovem e Grande (2x2) e
    # sai REDUZIDO a 0,726 -- ~112x116, ao lado do ogro (87x82). Depois de
    # reimportar, rode `reduzir-folha.py --fator 0.726` e so entao `--enxugar`.
    # O tamanho grande fica em `_referencias/pixellab/dragaoVerde-ref/
    # folhas-tamanho-grande`, para o adulto.
    'dragaoVerdeJovem': {
        'ataque': ['attack-dir'], 'pele': (0.0, 1.0), 'pele_sv': (-0.01, 1.0, 0.2),
        'margem': 8, 'quadros': [2, 3],
        'espelhar_ataque': {'north-east': 'north-west'},
        'por_direcao': {'south': [2, 3], 'south-east': [2, 3], 'east': [2, 3],
                        'north-east': [3, 5], 'north': [4, 6], 'north-west': [3, 5],
                        'west': [3, 5], 'south-west': [3, 4]},
        # O SOPRO (`conjurar`), o gesto que o motor toca no Sopro Venenoso. O
        # modelo desenhou fagulhas e gas saindo da boca apesar do pedido; os
        # quadros foram escolhidos onde a boca esta aberta e a fagulha nao esta.
        # Ao sul a fagulha vai colada na boca do 4 ao 7 e quase some no 6; ao
        # norte a nuvem so aparece no 3. O oeste vem espelhado do leste (cone
        # branco desenhado). O resto da sujeira e solta e sai com `limpar_soltos`.
        'conjurar': _DRAGAO_SOPRO,
        'espelhar_conjurar': {'west': 'east'},
        'limpar_soltos': True,
        # A celula de 744 px tinha folga de sobra em volta do dragao: aparada
        # (`enxugar_folha`), a folha aberta cai de quase 500 MB.
        'aparar': True,
    },
    # A GARRA do dragao, a segunda folha: o golpe que ele mais usa (mordida +
    # garra + garra). Gerada como `attack2-dir`, nome PROPRIO, para nao se
    # misturar com a mordida (a licao do espeto). Leva o sopro tambem: depois de
    # uma garrada o motor segue nesta folha, e o sopro tocaria a garra.
    'dragaoVerdeJovemGarra': {
        'ataque': ['attack2-dir'], 'pele': (0.0, 1.0), 'pele_sv': (-0.01, 1.0, 0.2),
        'margem': 8, 'quadros': [1, 4],
        'por_direcao': {'south': [3, 5], 'south-east': [1, 3], 'east': [1, 4],
                        'north-east': [2, 4], 'north': [1, 5], 'north-west': [2, 5],
                        'west': [1, 4], 'south-west': [1, 4]},
        'conjurar': _DRAGAO_SOPRO,
        'espelhar_conjurar': {'west': 'east'},
        'limpar_soltos': True,
        # FOLHA PARCIAL: so o golpe e dela. Parado, andar, queda e o sopro vem
        # da folha base no jogo (`folhas/index.js`); repeti-los aqui custava
        # outra folha inteira aberta na memoria.
        'so_anims': ['attack'],
        'aparar': True,
    },
    # O DRAGAO NO AR: a folha `~voo`, que o tabuleiro pede no trecho VOADO e
    # larga quando ele pousa. O "andar" dela e o ciclo de asas do `fly-dir`
    # (`andar_de`), ancorado pelo grupo e nao pelo pe (o pe de quem voa e a
    # ponta da asa). A decolagem cai em quadros diferentes em cada direcao --
    # ao sul ele so sai do chao no 5, no sudeste ja no 3 --, entao os quatro sao
    # escolhidos por direcao, ja no ar, alternando asa erguida e abaixada. O 8
    # do sul fica de fora: ali o dragao ENCOLHE, como se fosse embora da camera.
    'dragaoVerdeJovemVoo': {
        'ataque': ['attack-dir'], 'pele': (0.0, 1.0), 'pele_sv': (-0.01, 1.0, 0.2),
        'margem': 8, 'quadros': [2, 3],
        'andar_de': 'fly-dir',
        'andar_por_direcao': {'south': [6, 7, 5, 7], 'south-east': [3, 4, 6, 8],
                              'east': [5, 7, 6, 8], 'north-east': [5, 7, 6, 8],
                              'north': [4, 7, 5, 8], 'north-west': [4, 6, 5, 7],
                              'west': [5, 6, 8, 7], 'south-west': [5, 7, 6, 8]},
        'limpar_soltos': True,
        # FOLHA PARCIAL: so o andar (o ciclo de asas) e dela; ela so e pedida
        # enquanto ele cruza o tabuleiro no ar.
        'so_anims': ['walk'],
        'aparar': True,
    },
    'vinhaInfectada': {
        'ataque': ['attack-dir'], 'pele': (0.42, 0.58), 'pele_sv': (0.25, 1.0, 0.2),
        'margem': 6, 'quadros': [2, 4],
        'por_direcao': {'south': [2, 4], 'south-east': [2, 4], 'east': [2, 4],
                        'north-east': [2, 4], 'north': [2, 4], 'north-west': [2, 4],
                        'west': [2, 4], 'south-west': [2, 4]},
    },
    # O SPECTATOR (aprovado pelo dono). Centro medido pelo VERDE-OLIVA do
    # corpo; a lingua rosada e os olhos amarelos ficam de fora.
    #
    # `parado`: a unica criatura com parado PROPRIO. Quatro quadros do
    # `idle-dir` em ciclo -- boca, lingua e as quatro hastes se mexendo sem a
    # figura sair do lugar.
    #
    # OS QUADROS DO GOLPE SAO OS DO CLARAO, NAO OS DO RAIO. O PixelLab desenha
    # o raio dentro da celula de 72 px, e ele morre cortado na borda: visto no
    # tabuleiro, seria um toco de luz do tamanho da criatura. Quem atravessa o
    # mapa e o `beam` do motor (`raioDasHastes` em `visuals.js`). Entao da
    # folha vale so o que acontece NA criatura -- as hastes acendendo -- e o
    # resto e desenhado por cima, do tamanho que a distancia pedir.
    'spectator': {
        'ataque': ['attack-dir'], 'pele': (0.17, 0.30), 'pele_sv': (0.2, 0.9, 0.2),
        'margem': 6,
        'parado': ('idle-dir', [0, 2, 4, 6], [14, 14, 14, 14]),
        # O SPRITE NAO SOLTA LUZ. Dos nove quadros do golpe, valem os que
        # mostram SO a criatura virando as hastes para o alvo. Os quadros de
        # clarao e de raio ficam de fora inteiros: o raio do PixelLab morre
        # cortado na borda da celula, e mesmo o clarao, que parece inofensivo,
        # dispara faixas de luz pelo quadro que brigam com o feixe do motor --
        # dois raios do mesmo bicho, um curto e um longo.
        #
        # O brilho dos olhos nao se perde: ele passou para o motor
        # (`raioDasHastes` em `visuals.js`), que acende as quatro hastes e
        # dispara os quatro feixes. Assim a luz e IGUAL nas oito direcoes, e
        # nao refem do que o modelo desenhou em cada uma.
        'quadros': [1, 2],
        'por_direcao': {'south': [1, 2], 'south-east': [1, 2], 'east': [2, 3],
                        'north-east': [1, 7], 'north': [0, 7], 'north-west': [1, 5],
                        'west': [2, 6], 'south-west': [1, 6]},
    },
    # A CAVEIRA CANDENTE (aprovada pelo dono). O centro e medido pelo OSSO
    # (creme, matiz quente), nao pela chama: a chama se mexe muito e e ela que
    # mudaria o centro de quadro a quadro.
    #
    # OS QUADROS DO GOLPE MUDAM MUITO POR DIRECAO, e por um defeito: nas tres
    # vistas do NORTE o texto "a chama inflando" virou uma bola verde que
    # ENGOLE o cranio nos quadros do meio, e a criatura some. Nessas tres o
    # golpe sai dos quadros em que o cranio ainda aparece -- o primeiro como
    # carga e um dos ultimos, ja com a fagulha. Nas cinco de frente o quadro
    # bom e o da mandibula aberta cuspindo.
    'caveiraCandente': {
        'ataque': ['attack-dir'], 'pele': (0.06, 0.14), 'pele_sv': (0.15, 0.6, 0.45),
        'margem': 6,
        'quadros': [2, 3],
        'por_direcao': {'south': [2, 3], 'south-east': [3, 4], 'east': [3, 4],
                        'north-east': [0, 6], 'north': [0, 7], 'north-west': [0, 5],
                        'west': [4, 5], 'south-west': [3, 4]},
    },
    # O WRAITH (Mormesk, aprovado pelo dono). Figura CINZA: nao ha pele nem
    # matiz nenhum para medir, entao o criterio e o do lobo -- qualquer matiz,
    # saturacao baixa, e um valor minimo que deixa de fora o contorno preto e
    # a fumaca mais escura. Os olhos amarelos sao poucos pixels e saturados
    # demais para entrar. `quadro_queda` pelo mesmo motivo do espectro: ele se
    # desmancha, e o ultimo quadro nao tem mais nada.
    'wraith': {
        'ataque': ['attack-dir'], 'pele': (0.0, 1.0), 'pele_sv': (-0.01, 0.22, 0.28),
        'margem': 8, 'quadro_queda': 4,
        'quadros': [3, 5],
        'por_direcao': {'south': [3, 5], 'south-east': [3, 5], 'east': [3, 5],
                        'north-east': [3, 5], 'north': [3, 5], 'north-west': [3, 5],
                        'west': [3, 5], 'south-west': [3, 5]},
    },
    # O ESPECTRO (a vista do OpenArt, aprovada pelo dono). Violeta por inteiro:
    # o "centro do corpo" e medido pelo proprio violeta (matiz 0,74), com
    # saturacao minima baixa porque o cabelo e quase branco. `quadro_queda`
    # existe por causa dele: a morte e um vulto que se desmancha, e o ultimo
    # quadro nao tem mais nada.
    'espectro': {
        'ataque': ['attack-dir'], 'pele': (0.68, 0.80), 'pele_sv': (0.10, 1.0, 0.25),
        'margem': 8, 'quadro_queda': 4,
        'quadros': [3, 5],
        'por_direcao': {'south': [3, 5], 'south-east': [3, 5], 'east': [3, 5],
                        'north-east': [3, 5], 'north': [3, 5], 'north-west': [3, 5],
                        'west': [3, 5], 'south-west': [3, 5]},
    },
    # A GELATINA OCRE (a tira montada da imagem do dono). A figura INTEIRA e
    # da mesma cor, entao o "centro da pele" e o centro da poca: matiz ocre
    # (0,10-0,15), saturacao alta, qualquer valor acima da sombra do contorno.
    # Sem `cabeca`: a gelatina nao tem alto nenhum, e contar so os px de cima
    # pegaria o toco, que e justamente a parte que se mexe.
    'gelatinaOcre': {
        'ataque': ['attack-dir'], 'pele': (0.08, 0.17), 'pele_sv': (0.35, 1.0, 0.22),
        'margem': 8,
        # O golpe: o toco ERGUIDO e o chicote descendo com os respingos.
        'quadros': [3, 5],
        'por_direcao': {'south': [3, 5], 'south-east': [3, 5], 'east': [3, 5],
                        'north-east': [3, 5], 'north': [3, 5], 'north-west': [3, 4],
                        'west': [3, 5], 'south-west': [3, 5]},
        'andar': [0, 1, 1, 0],
    },
    # O NEZZNAR, a Aranha Negra (aprovado pelo dono). Mago de cajado: o golpe e
    # a bordoada e `conjurar` e o gesto da magia, que o motor usa no lugar do
    # golpe quando ele lanca. A PELE e cinza-ARROXEADA de matiz quase igual ao
    # da armadura: o que as separa e o VALOR (rosto ~0,45, armadura ~0,25), e
    # `cabeca` manda contar so a pele do alto, que e o rosto. O golpe de SUL
    # vem da refacao (`--ataque-de`), porque no original o cajado sumia da mao.
    'nezznar': {
        'ataque': ['attack-dir'], 'pele': (0.62, 0.85), 'pele_sv': (0.08, 0.45, 0.33),
        'margem': 8, 'cabeca': 12,
        'quadros': [2, 4],
        'por_direcao': {'south': [1, 2], 'south-east': [2, 3], 'east': [2, 4],
                        'north-east': [3, 4], 'north': [2, 4], 'north-west': [3, 4],
                        'west': [3, 4], 'south-west': [2, 3]},
        'conjurar': {'south': [2, 4], 'south-east': [2, 5], 'east': [2, 4],
                     'north-east': [3, 4], 'north': [2, 3], 'north-west': [2, 4],
                     'west': [1, 4], 'south-west': [1, 4]},
    },
    # A ARANHA GIGANTE (aprovada pelo dono). Centro pelo corpo marrom-carvao
    # (cabeca e abdomen). A Mordida: o corpo ERGUIDO e as PRESAS cravando.
    'aranhaGigante': {
        'ataque': ['attack-dir'], 'pele': (0.03, 0.14), 'pele_sv': (0.08, 0.4, 0.25), 'margem': 8,
        'quadros': [3, 6],
        'por_direcao': {'south': [3, 6], 'south-east': [3, 6], 'east': [4, 7], 'north-east': [3, 6],
                        'north': [3, 5], 'north-west': [3, 5], 'west': [3, 6], 'south-west': [3, 7]},
    },
    # A Teia (o golpe da `anim-so-teia`): o abdomen erguendo e o JATO de seda
    # saindo; o fio ate o alvo e o motor que desenha (`fx.js`, estilo `teia`).
    'aranhaGiganteTeia': {
        'ataque': ['attack-dir'], 'pele': (0.03, 0.14), 'pele_sv': (0.08, 0.4, 0.25), 'margem': 8,
        'quadros': [3, 4],
        'por_direcao': {'south': [3, 4], 'south-east': [3, 4], 'east': [3, 5], 'north-east': [3, 4],
                        'north': [3, 4], 'north-west': [3, 5], 'west': [3, 5], 'south-west': [3, 4]},
    },
    'ranger': {
        'ataque': ['attack-dir'], 'pele': (0.03, 0.1), 'pele_sv': (0.25, 0.5, 0.7), 'margem': 8, 'cabeca': 10,
        'quadros': [3, 5],
        'por_direcao': {'south': [2, 5], 'south-east': [3, 5], 'east': [2, 4], 'north-east': [5, 2], 'north': [2, 5], 'north-west': [5, 2], 'west': [2, 4], 'south-west': [3, 5]},
    },
    # As duas espadas curtas: o golpe de uma mao e o da outra.
    'rangerEspadas': {
        'ataque': ['attack-dir'], 'pele': (0.03, 0.1), 'pele_sv': (0.25, 0.5, 0.7), 'margem': 8, 'cabeca': 10,
        'quadros': [3, 5],
        'por_direcao': {'south': [2, 4], 'south-east': [2, 5], 'east': [4, 3], 'north-east': [1, 4], 'north': [4, 6], 'north-west': [1, 4], 'west': [4, 3], 'south-west': [2, 5]},
    },
    # O arco longo: ARMADO e DISPARO (a flecha saindo). Ao norte o arco some
    # no disparo (6): valem o armado e o puxado.
    'rangerArco': {
        'ataque': ['attack-dir'], 'pele': (0.03, 0.1), 'pele_sv': (0.25, 0.5, 0.7), 'margem': 8, 'cabeca': 10,
        'quadros': [3, 5],
        'por_direcao': {'south': [3, 6], 'south-east': [3, 5], 'east': [3, 5], 'north-east': [3, 6], 'north': [3, 5], 'north-west': [3, 6], 'west': [3, 5], 'south-west': [3, 5]},
    },
    # O HOBGOBLIN de espada e escudo: espada ERGUIDA e o CORTE, olhando. A
    # leste o modelo vira de costas do 3 em diante (duas vezes): o 1 e o 2. A
    # revisao trocou N (espada sumida), O (escudo dobrado), S (o rastro branco
    # do corte encostava na borda) e SE (o rastro escondia o corpo).
    # Centro pela pele laranja-avermelhada; o valor minimo alto deixa de fora
    # a madeira do arco e o couro, que tem o mesmo matiz. Sem `cabeca`.
    'hob': {
        'ataque': ['attack-dir'], 'pele': (0.0, 0.06), 'pele_sv': (0.5, 0.8, 0.68), 'margem': 8,
        'quadros': [3, 5],
        'por_direcao': {'south': [5, 7], 'south-east': [4, 6], 'east': [1, 2], 'north-east': [2, 3],
                        'north': [1, 3], 'north-west': [3, 5], 'west': [2, 3], 'south-west': [5, 4]},
    },
    # O de ARCO: a corda puxada com a flecha e logo depois do disparo. A
    # noroeste e sudoeste o modelo guarda o arco nas costas logo depois de
    # soltar: ali sao dois quadros de corda puxada.
    'hobArco': {
        'ataque': ['attack-dir'], 'pele': (0.0, 0.06), 'pele_sv': (0.5, 0.8, 0.68), 'margem': 8,
        'quadros': [3, 6],
        'por_direcao': {'south': [4, 6], 'south-east': [3, 6], 'east': [3, 6], 'north-east': [4, 6],
                        'north': [3, 6], 'north-west': [3, 5], 'west': [3, 5], 'south-west': [3, 5]},
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


APAGADOS = {'px': 0}


def sem_soltos(cel, minimo=40):
    """
    Apaga os pedacos SOLTOS do quadro: manchas opacas desligadas do corpo e
    menores que `minimo` px (vizinhanca de 8).

    Opcional, por criatura (`limpar_soltos` no perfil), e nao para todas: numa
    figura de traco fino, uma ponta de garra separada do corpo por um pixel
    transparente seria apagada por engano. No dragao verde o modelo desenhou
    fagulhas saindo da boca no sopro e pontinhos flutuando em volta da mordida
    -- coisas que no tabuleiro viram poeira voando ao lado do bicho.
    """
    from collections import deque
    px = cel.load()
    W, H = cel.size
    vis = set()
    for y in range(H):
        for x in range(W):
            if px[x, y][3] and (x, y) not in vis:
                bloco, fila = [], deque([(x, y)])
                vis.add((x, y))
                while fila:
                    cx, cy = fila.popleft()
                    bloco.append((cx, cy))
                    for dy in (-1, 0, 1):
                        for dx in (-1, 0, 1):
                            nx, ny = cx + dx, cy + dy
                            if 0 <= nx < W and 0 <= ny < H and px[nx, ny][3] and (nx, ny) not in vis:
                                vis.add((nx, ny))
                                fila.append((nx, ny))
                if len(bloco) < minimo:
                    for q in bloco:
                        px[q] = (0, 0, 0, 0)
                    APAGADOS['px'] += len(bloco)
    return cel


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


def oliva_vira(cel, rampa):
    """
    O verde-oliva ESCURO vira a rampa dada, pelo valor. O orc: o modelo
    redesenha a figura a cada quadro e pinta a calca de oliva no golpe e na
    queda, onde a parada e o andar a tem cinza-azulada escura.
    """
    out = cel.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            p = px[x, y]
            if not p[3]:
                continue
            h, s, v = colorsys.rgb_to_hsv(*(c / 255 for c in p[:3]))
            if 0.12 <= h <= 0.26 and s > 0.3 and v < 0.32:
                px[x, y] = (*rampa[min(len(rampa) - 1, int(v / 0.32 * len(rampa)))], p[3])
    return out


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


def enxugar_folha(folha, meta, so_anims=None, aparar=True):
    """
    A folha PRONTA, com menos memoria: so as animacoes que a figura precisa
    desta folha (`so_anims`) e cada animacao aparada ate o que tem pixel
    (`aparar`).

    POR QUE. O navegador guarda a folha aberta, 4 bytes por pixel, e a do
    dragao (8 direcoes x 7 animacoes, celula de 744 px) passava de 470 MB. Eram
    TRES iguais -- a mordida, a garra e o voo -- para trocar uma animacao em
    cada. Com `so_anims` a garra traz so o golpe e o voo so o andar; o resto o
    jogo pega da folha base (`folhas/index.js`, folha parcial).

    O CORTE E POR ANIMACAO. Uma celula so para todas seguia a mais larga (o
    andar abre as patas, o golpe estica o pescoco) e o parado carregava o vazio
    dela. Cada animacao ganha a sua celula (`fw`, `fh`) e o seu chao
    (`ground`), e a figura continua no mesmo lugar do tabuleiro porque:
    dos lados o corte e SIMETRICO em volta da coluna do meio (que e onde
    `drawSprite` centra); em cima e livre; embaixo, o chao sobe na conta do que
    saiu. Tudo em multiplos de S, para nao partir um bloco 3x3.

    O ENCAIXE. Celulas de tamanhos diferentes empilhadas deixariam a folha da
    largura do andar (4 quadros) com metade vazia nas de 2. Entao as animacoes
    vao em PRATELEIRAS, da mais alta para a mais baixa, lado a lado enquanto
    couberem na largura -- cada uma com a sua coluna de partida (`x`).
    """
    if aparar and meta.get('armas'):
        raise SystemExit('aparar mexe na celula, e as medidas de arma sao dentro dela: falta converter')
    nomes = [n for n in meta['anims'] if not so_anims or n in so_anims]
    faltam = set(so_anims or []) - set(nomes)
    if faltam:
        raise SystemExit(f'a folha nao tem {sorted(faltam)}')
    nd = len(meta['dirs'])
    alfa = folha.getchannel('A')
    corte = {}
    for n in nomes:
        an = meta['anims'][n]
        fw, fh, ax = an['fw'], an['fh'], an.get('x', 0)
        chao = an.get('ground', meta['ground'])
        x0, y0, x1, y1 = fw, fh, 0, 0
        for linha in range(nd):
            for f in range(an['frames']):
                bb = alfa.crop((ax + f * fw, an['y'] + linha * fh,
                                ax + (f + 1) * fw, an['y'] + (linha + 1) * fh)).getbbox()
                if bb:
                    x0, y0, x1, y1 = min(x0, bb[0]), min(y0, bb[1]), max(x1, bb[2]), max(y1, bb[3])
        if not aparar or x1 == 0:
            x0, y0, x1, y1 = 0, 0, fw, fh
        meio = fw // 2
        meia = -(-max(meio - x0, x1 - meio) // S) * S
        topo, fundo = y0 // S * S, -(-y1 // S) * S
        corte[n] = {'esq': meio - meia, 'topo': topo, 'fw': 2 * meia, 'fh': fundo - topo,
                    'ground': chao - (fh - fundo) // S}
    # as prateleiras: a mais alta primeiro, e ao lado dela o que couber
    largura = max(meta['anims'][n]['frames'] * corte[n]['fw'] for n in nomes)
    lugar, prateleiras = {}, []           # prateleira: [y, altura, x livre]
    for n in sorted(nomes, key=lambda n: -corte[n]['fh']):
        w = meta['anims'][n]['frames'] * corte[n]['fw']
        p = next((p for p in prateleiras if p[2] + w <= largura), None)
        if p is None:
            p = [sum(q[1] for q in prateleiras), corte[n]['fh'] * nd, 0]
            prateleiras.append(p)
        lugar[n] = (p[2], p[0])
        p[2] += w
    altura = sum(p[1] for p in prateleiras)
    nova = Image.new('RGBA', (largura, altura), (0, 0, 0, 0))
    anims = {}
    for n in nomes:                       # a ordem do JSON continua a de antes
        an, c = meta['anims'][n], corte[n]
        x, y = lugar[n]
        anims[n] = dict(an, x=x, y=y, fw=c['fw'], fh=c['fh'], ground=c['ground'])
        for linha in range(nd):
            for f in range(an['frames']):
                sx = an.get('x', 0) + f * an['fw'] + c['esq']
                sy = an['y'] + linha * an['fh'] + c['topo']
                nova.paste(folha.crop((sx, sy, sx + c['fw'], sy + c['fh'])),
                           (x + f * c['fw'], y + linha * c['fh']))
        print(f'  {n:9} celula {an["fw"]}x{an["fh"]} -> {c["fw"]}x{c["fh"]}  chao {c["ground"]}')
    saida = dict(meta, w=largura, h=altura, anims=anims)
    # `cell` e `ground` da folha ficam como os da primeira animacao (o parado):
    # quem le a folha inteira por eles continua achando um valor que existe.
    primeira = anims[nomes[0]]
    saida['cell'], saida['ground'] = [primeira['fw'], primeira['fh']], primeira['ground']
    if so_anims:
        saida['parcial'] = True
    antes, depois = folha.width * folha.height * 4, largura * altura * 4
    print(f'enxugada: {len(meta["anims"])} -> {len(nomes)} animacoes, folha {folha.width}x{folha.height} '
          f'-> {largura}x{altura}, {antes / 2**20:.0f} -> {depois / 2**20:.0f} MB aberta')
    return nova, saida


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--fonte', help='pasta com o PNG e o JSON do PixelLab')
    p.add_argument('--enxugar', metavar='NOME',
                   help='so enxuga uma folha ja importada (src/art/folhas/NOME), pelo perfil de --chave; '
                        'nao precisa de --fonte nem gera nada')
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
    if a.enxugar:
        png, js = SAIDA / f'{a.enxugar}.png', SAIDA / f'{a.enxugar}.json'
        Image.MAX_IMAGE_PIXELS = None   # a folha e nossa; o limite e contra imagem de fora
        folha, meta = enxugar_folha(Image.open(png).convert('RGBA'), json.loads(js.read_text(encoding='utf-8')),
                                    perfil.get('so_anims'), perfil.get('aparar', False))
        folha.save(png, optimize=True)
        js.write_text(json.dumps(meta, indent=2), encoding='utf-8')
        print(f'{png}  {folha.width}x{folha.height}  {png.stat().st_size/1024:.0f} KB')
        return
    if not a.fonte:
        p.error('--fonte e obrigatorio (fora do --enxugar)')
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
    # FIGURA PARADA (`estatico`): quem so fica de pe e cai, sem andar nem golpe
    # (Sildar, Gundren e Reidoth). O andar e o golpe repetem o PARADO (a vista
    # da rotacao), e o motor so ve uma folha completa. Gerar as duas animacoes
    # custaria 16 geracoes por figura para um movimento que nunca acontece.
    if perfil.get('estatico'):
        PLANO = [(n, ('rotations', None), [0], h) if n in ('walk', 'attack') else (n, fonte_, q, h)
                 for n, fonte_, q, h in PLANO]
    # SO O GOLPE PARADO (`ataque_parado`): quem anda mas nao ataca (o familiar do
    # mago: a ficha dele nao tem ataques). O andar vem da animacao, o golpe
    # repete o parado.
    if perfil.get('ataque_parado'):
        PLANO = [(n, ('rotations', None), [0], h) if n == 'attack' else (n, fonte_, q, h)
                 for n, fonte_, q, h in PLANO]
    # A MAGIA (`conjurar`), para quem conjura: o gesto proprio do `cast-dir`,
    # CARREGA e SOLTA, que o motor usa nas magias no lugar do golpe. Quem nao
    # tem a animacao conjura com o golpe, como sempre.
    # O ANDAR, quando os quadros do meio nao servem. Na gelatina o `walk` do
    # PixelLab faz o toco crescer num talo alto quadro a quadro, em vez de a
    # massa se arrastar: dos cinco quadros, so os dois primeiros sao a gosma
    # baixa. `andar` escolhe quais entram e em que ordem, e [0, 1, 1, 0] vira
    # um pulso que vai e volta -- uma poca que ondula, que e o que ela faz.
    if 'andar' in perfil:
        PLANO = [(n, fonte_, perfil['andar'], h) if n == 'walk' else (n, fonte_, q, h)
                 for n, fonte_, q, h in PLANO]
    # O ANDAR DE OUTRO GRUPO (`andar_de`): a folha de VOO do dragao, em que o
    # "andar" -- o que toca enquanto ele cruza o tabuleiro -- e o ciclo de asas
    # do `fly-dir`, e nao o passo de quatro patas. Os quadros sao por direcao
    # (`andar_por_direcao`), porque a batida cai em indices diferentes.
    if 'andar_de' in perfil:
        PLANO = [(n, ('animation', perfil['andar_de']), q, h) if n == 'walk' else (n, fonte_, q, h)
                 for n, fonte_, q, h in PLANO]
        QUADROS_POR_DIRECAO.update({('walk', d): q for d, q in perfil.get('andar_por_direcao', {}).items()})
    # O PARADO DE VERDADE. Por padrao o `idle` e a VISTA PARADA da rotacao
    # mais um quadro de `respirar` (o tronco estica 1 px): e o suficiente para
    # quem so precisa nao parecer uma estatua. Quem tem um parado PROPRIO
    # gerado -- o spectator mexe boca, lingua e as quatro hastes oculares sem
    # sair do lugar -- troca a fonte aqui, e os quadros vem da animacao.
    if 'parado' in perfil:
        nome_p, quadros_p, hold_p = perfil['parado']
        PLANO = [('idle', ('animation', nome_p), quadros_p, hold_p) if n == 'idle'
                 else (n, fonte_, q, h) for n, fonte_, q, h in PLANO]
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
            # QUAL QUADRO VIRA A POSE DE CHAO. O padrao e o ULTIMO: um corpo
            # cai e fica caido. Nao serve para quem se DESMANCHA -- o ultimo
            # quadro do espectro e o ar vazio, e a figura sumiria do tabuleiro
            # enquanto ainda esta em jogo a 0 PV. `quadro_queda` escolhe outro.
            escolha = perfil.get('quadro_queda', quadro_q)
            queda = (r, escolha if escolha >= 0 else r['frame_count'] - 1)
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
        if perfil.get('oliva_vira'):
            cel = oliva_vira(cel, perfil['oliva_vira'])
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
        # O GOLPE ESPELHADO de outra direcao (`espelhar_ataque`: {'east': 'west'}):
        # quando o modelo vira de costas no golpe de um lado e acerta o outro,
        # e a figura e simetrica (o doppelganger, sem arma nem roupa).
        if fonte_[0] == 'animation' and fonte_[1] == perfil.get('ataque')                 and dir_ in perfil.get('espelhar_ataque', {}):
            outra = perfil['espelhar_ataque'][dir_]
            return quadro(fonte_, idx, outra).transpose(Image.FLIP_LEFT_RIGHT)
        # O mesmo para o GESTO DE CONJURAR (`espelhar_conjurar`). No sopro do
        # dragao, o oeste desenhou um cone branco saindo da boca -- o sopro que
        # e do motor -- e o leste veio limpo; a figura e simetrica.
        if fonte_ == ('animation', 'cast-dir') and dir_ in perfil.get('espelhar_conjurar', {}):
            outra = perfil['espelhar_conjurar'][dir_]
            return quadro(fonte_, idx, outra).transpose(Image.FLIP_LEFT_RIGHT)
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
                if perfil.get('limpar_soltos'):
                    cel = sem_soltos(cel.copy())
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
                # No VOO nao: o "pe" de quem voa e a ponta da asa, e ancorar por
                # ele jogaria o corpo para cima a cada batida para baixo. O voo
                # usa a ancora do grupo, a mesma em todos os quadros.
                elif (nome == 'walk' and not perfil.get('andar_de')) or (nome, dir_) in PE_NO_ATAQUE:
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
    saida = {
        'cell': [CW * S, CH * S], 's': S, 'ground': CHAO,
        'w': largura, 'h': altura, 'dirs': DIRECOES, 'anims': anims,
    }
    if perfil.get('aparar') and armas:
        raise SystemExit('aparar mexe na celula, e as medidas de arma sao dentro dela: falta converter')
    if perfil.get('so_anims') or perfil.get('aparar'):
        folha, saida = enxugar_folha(folha, saida, perfil.get('so_anims'), perfil.get('aparar', False))
        largura, altura = folha.width, folha.height
    folha.save(png, optimize=True)
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
