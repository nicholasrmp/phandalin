# -*- coding: utf-8 -*-
"""
Gera as animacoes de um personagem ja criado no PixelLab e baixa a folha.

ISTO GASTA GERACOES DA CONTA. Sem `--go` o script so imprime o plano e o
custo; e proposital, porque o numero de gerações e dinheiro.

O CUSTO SAI DO MOTOR, NAO DO CATALOGO.
Cada animacao custa uma geracao POR DIRECAO. Entao a pergunta que decide o
preco nao e "quantas poses o PixelLab oferece", e sim "quantas direcoes o
jogo chega a DESENHAR". Tres das nossas sete poses sao no chao, e o
`board.js` usa a fileira 0 quando a criatura esta inconsciente ou morta --
"no chao nao ha direcao", diz o comentario de la. Pedir oito direcoes para
elas seria pagar por 21 desenhos que nunca aparecem.

    walk, attack, hurt     8 direcoes    24
    down, sleep, dead      1 direcao      3
                                        ---
                                         27

A PALETA NAO E TRAVADA, e isso e uma aposta declarada.
`target_palette` forcaria cada pixel as cores de uma lista. O PixelLab anima
a partir do `character_id`, entao em tese herda o visual sozinho. Travar
seria mais seguro e mais duro -- se o modelo quer um tom a mais para
sombrear um braco em movimento, a lista o achataria. A aposta e deixar
solto e MEDIR a deriva de cor depois; se derivar, o importador ja unifica
tudo numa paleta so, que e o passo que o goblin anterior ja atravessou.
"""
import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
import zipfile
from pathlib import Path

BASE = 'https://api.pixellab.ai/v2'
OITO = ['south', 'south-east', 'east', 'north-east',
        'north', 'north-west', 'west', 'south-west']
CHAO = ['south']
# As sete que faltam quando o sul ja foi gerado como teste.
SETE = [d for d in OITO if d != 'south']

# As descricoes sao especificas de proposito: `enhance_prompt` fica desligado,
# entao o texto daqui e o texto que o modelo recebe.
# DOIS MODOS, E A ESCOLHA NAO E DE GOSTO.
#
# `v3` inventa o movimento a partir do texto e do quadro parado. Serve para
# andar e atacar, que sao variacoes de uma figura em pe.
#
# Para as poses de CHAO ele falhou, e da para provar: o parado mede 1,02 de
# largura por altura e `down`, `sleep` e `dead` sairam entre 1,00 e 1,16 --
# ou seja, em pe. Deitado daria perto de 2. O `v3` nao vira o corpo para a
# horizontal; ele anima em torno da pose que ja existe.
#
# `template` resolve porque nao inventa nada: pega um esqueleto pronto e poe
# o personagem nele. Se o esqueleto deita, o personagem deita. Custa a mesma
# geracao por direcao.
#
# A lista de templates nao esta na documentacao, que trunca em "...". Foi
# descoberta sondando com um `character_id` inexistente: template valido
# falha com "personagem nao encontrado", invalido falha pelo nome, e nenhum
# dos dois gera. Os que existem incluem `lie-down`, `getting-up`, `stand-up`,
# `sitting`, `dying`, `falling-back-death`, `crouching`, `crouched-walking`,
# `walking`, `idle`, `breathing-idle`, `angry`, `bark`, `backflip`,
# `cross-punch` e `running-jump`.
POSES = [
    ('walk', OITO, {'mode': 'v3',
                    'action_description': 'walking forward, legs alternating in '
                                          'a full stride, arms swinging in opposition'}),
    ('attack', OITO, {'mode': 'v3',
                      'action_description': 'swinging the weapon down and forward in '
                                            'an overhead strike, lunging onto the front foot'}),
    # O DANO NAO E GERADO, e isso e uma decisao medida.
    #
    # Seriam 8 geracoes por criatura -- 424 no elenco de 53 combatentes --
    # para um quadro unico que fica 220 ms na tela. O `board.js` ja desenha o
    # recuo como efeito quando a folha nao traz o quadro: tremor de dois
    # pixels e tinta vermelha, a custo zero. As criaturas procedurais, que
    # TEM a pose desenhada, continuam usando a pose.
    #
    # ('hurt', OITO, 'struck hard, head snapped back, arms flung outward, '
    #                'torso bent backward, knees buckling'),
    # O ATAQUE OUTRA VEZ, NOUTRO MODELO.
    #
    # O `attack` do v3 acima tem o golpe estragado: contando os pixels da
    # madeira do escudo, ele cai de 112 para 68 ao sul, de 70 para 31 ao
    # norte e de 84 para 35 a oeste, sempre a partir do quadro 3. O v3
    # REDESENHA o personagem a cada quadro e perde primeiro o que e pequeno e
    # lateral.
    #
    # O `pixminimax` e outro modelo, e aceita duas coisas que o v3 nao tem:
    # `subject_description`, que diz o que a figura E, e `initial_pose`, que
    # diz de onde o movimento parte. As duas existem justamente para segurar
    # a identidade ao longo da sequencia -- e o escudo e o teste.
    #
    # Custa por tamanho e por quadro: 64x64 com 8 quadros e uma geracao. Por
    # isso este vai primeiro SO AO SUL, para medir antes de gastar oito.
    ('attack-pix', SETE, {
        'mode': 'pixminimax',
        'action_description': 'swinging the scimitar down and forward in one '
                              'overhead strike, lunging onto the front foot, '
                              'then recovering to the ready stance',
        'subject_description': 'a hunched goblin warrior with a round wooden '
                               'shield strapped to his left forearm and an iron '
                               'scimitar in his right hand',
        'initial_pose': 'standing in a ready stance, scimitar held low at his '
                        'side, round shield held across the chest',
        'frame_count': 8,
    }),
    # `getting-up` comeca NO CHAO e se levanta; o motor usa o primeiro quadro,
    # que e exatamente "derrubado mas acordado".
    ('down', CHAO, {'mode': 'template', 'template_animation_id': 'getting-up'}),
    ('dead', CHAO, {'mode': 'template', 'template_animation_id': 'falling-back-death'}),
]

# O ATAQUE CORRIGIDO, DIRECAO A DIRECAO.
#
# Tres especialistas acharam, cada um por conta propria, o mesmo defeito no
# `attack-pix`: em W e SW o goblin golpeia para o lado errado -- parado ele
# olha para a esquerda, no golpe a cara, a lamina e o rastro saem pela
# direita --, e em NW ele mostra o rosto quando deveria mostrar as costas.
#
# A causa provavel e o texto: "down and forward" nao diz para onde e a
# frente, e o modelo escolheu a dele. Aqui cada direcao vai num pedido
# proprio, dizendo para onde a figura olha e para onde o golpe vai, e que ela
# nao gira durante o movimento. Um pedido por direcao porque o texto e um so
# por pedido.
#
# O nome e `attack-fix`, e nao `attack-pix`: o servidor numeraria o repetido
# (`attack-pix_3`) e o importador juntaria os grupos sem saber qual vale.
# Com nome proprio, o importador prefere este direcao a direcao.
_SUJEITO = ('a hunched goblin warrior with a round wooden shield strapped to '
            'his left forearm and an iron scimitar in his right hand')
_LADO = {
    'west': ('facing left (west), seen in profile',
             'toward the left side of the image'),
    'south-west': ('facing down and to the left (south-west), three-quarter '
                   'front view', 'toward the lower left of the image'),
    'north-west': ('facing up and to the left (north-west), seen from behind '
                   'at three-quarters, back and hair toward the viewer, face '
                   'hidden', 'toward the upper left of the image'),
}
for _dir, (_olha, _para) in _LADO.items():
    POSES.append(('attack-fix', [_dir], {
        'mode': 'pixminimax',
        'action_description': (
            f'{_olha}, swinging the scimitar in one overhead strike {_para}, '
            'lunging a short step in that direction, then recovering. The body '
            'keeps facing the same way the whole time and never turns around.'),
        'subject_description': _SUJEITO,
        'initial_pose': (f'standing in a ready stance {_olha}, scimitar held low '
                         'at his side, round shield held across the chest'),
        'frame_count': 8,
    }))

# A POSE DE CHAO, REFEITA.
#
# O ultimo quadro da `falling-back-death` virou um amontoado de pecas
# soltas: o escudo de madeira some, a juba vira um tufo. Confirmado pelo
# verificador como grave. Aqui a queda vai em `pixminimax` dizendo o que o
# corpo deitado ainda tem. So o sul: o motor desenha quem esta no chao
# sempre na fileira 0.
POSES.append(('queda-pix', ['south'], {
    'mode': 'pixminimax',
    'action_description': (
        'struck down, falling backward and landing flat on his back, then lying '
        'still: the round wooden shield still strapped to his left arm and '
        'resting on his chest, the scimitar dropped on the ground beside his '
        'right hand, long black hair spread on the ground'),
    'subject_description': _SUJEITO,
    'initial_pose': ('standing in a ready stance facing the viewer, scimitar '
                     'held low at his side, round shield held across the chest'),
    'frame_count': 8,
}))
POSES += [
    # DORMIR NAO GASTA GERACAO.
    #
    # A lista de templates e POR TEMPLATE DE PERSONAGEM: o nosso e `mannequin`
    # e nao tem `lie-down`, apesar de o nome existir no servidor. O que ha de
    # chao e `getting-up` (comeca deitado e se levanta) e
    # `falling-back-death` (cai de costas e fica).
    #
    # Dois grupos dao as TRES poses, porque sao animacoes e nao desenhos
    # soltos: o quadro 0 de `getting-up` e o corpo parado no chao, que e
    # dormir; um quadro do meio e o corpo apoiado num braco, que e derrubado
    # mas acordado; e o ultimo de `falling-back-death` e o corpo largado, que
    # e morto. Quem escolhe o quadro e o montador.
]

# O modo v3 exige de 4 a 16 quadros, par. Pedimos 4 em tudo: o motor usa 4 no
# andar, 2 no ataque e 1 nas demais, e escolher depois e de graca.
QUADROS = 4
SEMENTE = 20261023


def chamar(token, metodo, caminho, corpo=None, bruto=False, espera=300):
    req = urllib.request.Request(f'{BASE}{caminho}',
                                 data=json.dumps(corpo).encode() if corpo else None,
                                 method=metodo)
    req.add_header('Authorization', f'Bearer {token}')
    if corpo:
        req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, timeout=espera) as r:
            d = r.read()
            return d if bruto else json.loads(d)
    except urllib.error.HTTPError as e:
        detalhe = e.read().decode(errors='replace')[:600]
        if e.code == 429:
            raise Cheio(detalhe) from None
        if e.code == 423:
            raise Travado(detalhe) from None
        raise SystemExit(f'HTTP {e.code} em {metodo} {caminho}: {detalhe}')


class Cheio(RuntimeError):
    """A fila do servidor encheu."""


class Travado(RuntimeError):
    """A folha ainda tem animacoes gerando."""


def pedir(token, corpo, limite=3600):
    """
    Pede uma animacao, esperando a fila se ela estiver cheia.

    O TETO E DE TRABALHOS SIMULTANEOS, NAO DE GERACOES.
    O Tier 3 aceita 20 jobs ao mesmo tempo, e cada DIRECAO de cada animacao e
    um job. Mandar as seis poses de uma vez sao 27 jobs: as primeiras entram e
    o resto toma 429. Nao custa nada -- a geracao so e debitada quando o job
    roda --, mas derruba o script no meio e deixa o personagem pela metade.
    Entao aqui se espera a fila drenar em vez de desistir.
    """
    inicio = time.time()
    while time.time() - inicio < limite:
        try:
            return chamar(token, 'POST', '/characters/animations', corpo)
        except Cheio:
            print('    fila cheia; esperando 45s...', flush=True)
            time.sleep(45)
    raise SystemExit('a fila nunca abriu')



# O ELENCO ALEM DO GUERREIRO.
#
# A lista `POSES` acima e a historia do guerreiro: o `attack` do v3 que perdia
# o escudo, o `attack-pix` que golpeava para o lado errado em W e SW, o
# `attack-fix` que consertou so essas direcoes. Para as criaturas novas a
# receita ja nasce com a licao aprendida, e sai daqui.
#
# 1. O ATAQUE E PEDIDO DIRECAO A DIRECAO. Um texto por pedido, entao um
#    pedido por direcao, cada um dizendo para onde a figura olha e para onde
#    o golpe vai, e que ela nao gira. "Down and forward" sem direcao deixou o
#    modelo escolher a frente -- e ele escolheu errado em tres de oito.
# 2. O ATAQUE E A QUEDA SAO `pixminimax`, com `subject_description` dizendo o
#    que a figura E. O v3 redesenha a cada quadro e perde primeiro o que e
#    pequeno e lateral; o escudo do guerreiro sumia justo no golpe.
# 3. A QUEDA E SO AO SUL. O motor desenha quem esta no chao sempre na
#    fileira 0.
# 4. NAO HA DANO. O motor faz o recuo como tremor mais tinta vermelha.
OLHAR = {
    'south': ('facing the viewer (south), front view',
              'toward the bottom of the image, toward the viewer'),
    'south-east': ('facing down and to the right (south-east), three-quarter '
                   'front view', 'toward the lower right of the image'),
    'east': ('facing right (east), seen in profile',
             'toward the right side of the image'),
    'north-east': ('facing up and to the right (north-east), seen from behind '
                   'at three-quarters, back toward the viewer, face hidden',
                   'toward the upper right of the image'),
    'north': ('facing away from the viewer (north), seen from behind, face '
              'hidden', 'toward the top of the image, away from the viewer'),
    'north-west': ('facing up and to the left (north-west), seen from behind '
                   'at three-quarters, back toward the viewer, face hidden',
                   'toward the upper left of the image'),
    'west': ('facing left (west), seen in profile',
             'toward the left side of the image'),
    'south-west': ('facing down and to the left (south-west), three-quarter '
                   'front view', 'toward the lower left of the image'),
}

CRIATURAS = {
    'goblinArqueiro': {
        'sujeito': ('a hunched goblin archer with a pale bleached-wood recurve '
                    'bow in his left hand, an arrow in his right hand, a quiver '
                    'of arrows on his back and a brown leather shoulder guard'),
        'parado': 'bow held low in the left hand, an arrow in the right hand',
        'golpe': ('raising the bow, nocking the arrow and drawing it back to his '
                  'cheek, then loosing it {para}, then lowering the bow'),
        'chao': ('the pale bow dropped on the ground beside him, the quiver '
                 'still on his back'),
    },
    'goblinBoss': {
        'sujeito': ('an upright goblin chief in a crested iron helmet with '
                    'glowing orange eyes, a chain shirt over a dark red tunic, a '
                    'dark red cloak, a round iron-rimmed shield on his left arm, '
                    'an iron scimitar in his right hand and two javelins strapped '
                    'across his back'),
        'parado': ('standing upright, scimitar held low at his side, shield held '
                   'across the chest'),
        'golpe': ('swinging the scimitar in one overhead strike {para}, a short '
                  'step in that direction, then recovering'),
        'chao': ('the round shield still on his left arm resting on his chest, '
                 'the scimitar dropped beside his right hand, the crested helmet '
                 'still on his head'),
    },
    # A Dara de cota de malha, a mesma receita dos goblins. A cauda e as asas
    # entram no sujeito como ausentes porque o modelo costuma acrescenta-las
    # num draconato; a aba creme atras das pernas e a capa da calca.
    'fighterMalha': {
        'dela': 'her',
        'sujeito': ('a female red dragonborn fighter with long swept-back horns, '
                    'no tail, no wings, in a steel chain mail hauberk and a '
                    'cream tabard with red trim, a steel heater shield with a '
                    'red dragon emblem on her left arm, a steel longsword in her '
                    'right hand'),
        'parado': ('longsword held low at her side, shield held forward across '
                   'the body'),
        'golpe': ('swinging the longsword in one overhead strike {para}, a short '
                  'step in that direction, then recovering, the shield staying '
                  'on her left arm'),
        'chao': ('the heater shield still on her left arm resting on her chest, '
                 'the longsword dropped beside her right hand'),
    },
}

# Brenn, clerigo anao, de brunea com maca e escudo: a folha base dele.
CRIATURAS['cleric'] = {
    'sujeito': ('a short, very stout male hill dwarf cleric with a long '
                'grey-brown beard, bare head, in steel scale mail and a '
                'grey tabard with gold trim, a steel heater shield with a '
                'golden sun emblem on his left arm, a steel flanged mace in '
                'his right hand'),
    'parado': 'mace held low at his side, shield held forward across the body',
    'golpe': ('swinging the mace in one overhead strike {para}, a short step '
              'in that direction, then recovering, the shield staying on his '
              'left arm'),
    'chao': ('the sun shield still on his left arm resting on his chest, the '
             'mace dropped beside his right hand'),
}

# A besta do Brenn. Sem queda: o corpo no chao sem escudo sai de uma edicao
# da queda da folha base (`brenn-queda-sem-escudo`).
CRIATURAS['clericBesta'] = {
    'sem_queda': True,
    'sujeito': ('a short, very stout male hill dwarf cleric with a long '
                'grey-brown beard, bare head, in steel scale mail and a grey '
                'tabard with gold trim, holding a light crossbow of dark wood '
                'and steel in both hands, no shield'),
    'parado': 'light crossbow held in both hands at waist level, pointing forward',
    'golpe': ('raising the light crossbow to his shoulder, aiming {para} and '
              'shooting a bolt, then lowering it'),
    # ao norte o modelo mira para a direita, de costas; foram tres tentativas
    # (incl. 'the crossbow points the same way he faces'), todas iguais.
}

# O PIP. A queda so na folha base (espada curta); as posturas usam a dela.
_PIP = ('a small male halfling rogue in a dark green hooded cloak with the '
        'hood up over his head and brown leather armor, ')
CRIATURAS.update({
    'rogue': {
        'sujeito': _PIP + 'a steel shortsword in his right hand, the left hand empty',
        'parado': 'shortsword held low and forward, in a low ready crouch',
        'golpe': ('lunging and thrusting the shortsword in one quick stab {para}, '
                  'then springing back'),
        'chao': 'the shortsword dropped beside his right hand, the cloak spread under him',
    },
    'rogueAdagas': {
        'sem_queda': True,
        'sujeito': _PIP + 'a steel dagger in each hand',
        'parado': 'a dagger in each hand held low and forward, in a low ready crouch',
        'golpe': ('slashing {para} with the dagger in his right hand and then '
                  'stabbing with the dagger in his left hand, one quick strike '
                  'after the other'),
    },
    'rogueArco': {
        'sem_queda': True,
        'sujeito': _PIP + 'a short bow of curved brown wood in his left hand, a quiver on his back',
        'parado': 'short bow held low in his left hand',
        'golpe': ('raising the short bow, drawing an arrow to his cheek and '
                  'loosing it {para}, then lowering the bow'),
    },
    'rogueBestaDeMao': {
        'sem_queda': True,
        'sujeito': _PIP + 'a small hand crossbow of dark wood and steel in his right hand',
        'parado': 'hand crossbow held low in his right hand',
        'golpe': ('raising the hand crossbow with his right arm extended, aiming '
                  '{para} and shooting a bolt, then lowering it'),
    },
})

# O ILVAN. O bordao e a arma; a magia e um gesto da mao livre com o cajado
# erguido, e a luz azul do cristal.
_ILVAN = ('a tall slender male high elf wizard with long silver-white hair and '
          'pointed ears, in a long deep indigo robe with light violet trim, ')
CRIATURAS.update({
    'wizard': {
        'sujeito': _ILVAN + 'a tall wooden quarterstaff with a pale blue crystal on top in his right hand',
        'parado': 'standing upright, the staff planted beside him',
        'golpe': ('swinging the quarterstaff in one strike {para} with both hands, '
                  'a short step in that direction, then recovering'),
        'magia': ('casting a spell: raising the staff with the crystal glowing pale '
                  'blue and thrusting his open left hand {para}, a burst of pale blue '
                  'light leaving his hand, then lowering both'),
        'chao': 'the staff dropped beside him, his silver hair spread on the ground',
    },
    'wizardAdaga': {
        'sem_queda': True,
        'sujeito': _ILVAN + 'a steel dagger in his right hand',
        'parado': 'standing upright, the dagger held low in his right hand',
        'golpe': ('stabbing the dagger {para} in one quick thrust, then stepping '
                  'back'),
        'magia': ('casting a spell: thrusting his open left hand {para}, a burst of '
                  'pale blue light leaving his hand, then lowering it'),
    },
})

# O GRASK. A queda so na folha base; as posturas usam a queda sem arma.
_GRASK = ('a huge muscular male half-orc barbarian with grey-green skin, tusks, '
          'long black hair and red war paint, a bare chest and a brown fur mantle, ')
CRIATURAS.update({
    'barbarian': {
        'sujeito': _GRASK + 'a huge steel greataxe held in both hands',
        'parado': 'greataxe held diagonally across the body in a wide stance',
        'golpe': ('swinging the greataxe in one huge overhead chop {para} with both '
                  'hands, a heavy step in that direction, then recovering'),
        'chao': 'the greataxe dropped beside him, the fur mantle spread under him',
    },
    'barbarianMachadinhas': {
        'sem_queda': True,
        'sujeito': _GRASK + 'a steel handaxe in each hand',
        'parado': 'a handaxe in each hand held low at his sides',
        'golpe': ('chopping {para} with the handaxe in his right hand and then with '
                  'the handaxe in his left hand, one quick blow after the other'),
    },
    'barbarianAzagaia': {
        'sem_queda': True,
        'sujeito': _GRASK + 'a wooden javelin with a steel point in his right hand',
        'parado': 'javelin raised at shoulder height in his right hand',
        'golpe': ('drawing back and hurling the javelin {para} with a powerful throw, '
                  'his arm following through'),
    },
})

# O TORVIK. Queda so na folha base; as posturas sem escudo usam a queda sem
# escudo, editada da base.
_TORVIK = ('a short stout male dwarf paladin with a dark brown beard, a steel '
           'open-faced helm, steel plate armor and a royal blue tabard and cape, ')
CRIATURAS.update({
    'paladin': {
        'sujeito': _TORVIK + 'a blue heater shield with a white hammer on his left arm, a steel longsword in his right hand',
        'parado': 'longsword held low at his side, shield held forward across the body',
        'golpe': ('swinging the longsword in one overhead strike {para}, a short step '
                  'in that direction, then recovering, the shield staying on his left arm'),
        'chao': 'the blue shield still on his left arm resting on his chest, the longsword dropped beside his right hand, the helm still on',
    },
    'paladinEspadaGrande': {
        'sem_queda': True,
        'sujeito': _TORVIK + 'a steel greatsword held in both hands',
        'parado': 'greatsword gripped in both hands in front of him, the blade pointing up',
        'golpe': ('swinging the greatsword in one huge overhead chop {para} with both '
                  'hands, a heavy step in that direction, then recovering'),
    },
    'paladinAzagaia': {
        'sem_queda': True,
        'sujeito': _TORVIK + 'a wooden javelin with a steel point in his right hand',
        'parado': 'javelin raised at shoulder height in his right hand',
        'golpe': ('drawing back and hurling the javelin {para} with a powerful throw, '
                  'his arm following through'),
    },
    'paladinBesta': {
        'sem_queda': True,
        'sujeito': _TORVIK + 'a heavy crossbow of dark wood and steel held in both hands',
        'parado': 'heavy crossbow held in both hands at waist level, pointing forward',
        'golpe': ('raising the heavy crossbow to his shoulder, aiming {para} and '
                  'shooting a bolt, then lowering it'),
    },
    'paladinArco': {
        'sem_queda': True,
        'sujeito': _TORVIK + 'a longbow of brown wood in his left hand, a quiver on his back',
        'parado': 'longbow held low in his left hand',
        'golpe': ('raising the longbow, drawing an arrow to his cheek and loosing it '
                  '{para}, then lowering the bow'),
    },
})

# O CORIN. Queda so na folha base (espada longa); as posturas usam a queda
# sem arma, editada da base.
_CORIN = ('a lean male human ranger with short brown hair and a short beard, a '
          'brown leather cuirass and a moss green cloak with the hood down, ')
CRIATURAS.update({
    'ranger': {
        'sujeito': _CORIN + 'a steel longsword in his right hand, the left hand empty',
        'parado': 'longsword held low at his side, the left hand free',
        'golpe': ('swinging the longsword in one overhead strike {para}, a short step '
                  'in that direction, then recovering'),
        'chao': 'the longsword dropped beside his right hand, the green cloak spread under him',
    },
    'rangerEspadas': {
        'sem_queda': True,
        'sujeito': _CORIN + 'a steel shortsword in each hand',
        'parado': 'a shortsword in each hand held low at his sides',
        'golpe': ('slashing {para} with the shortsword in his right hand and then with '
                  'the shortsword in his left hand, one quick blow after the other'),
    },
    'rangerArco': {
        'sem_queda': True,
        'sujeito': _CORIN + 'a longbow of brown wood in his left hand, a quiver on his back',
        'parado': 'longbow held low in his left hand',
        'golpe': ('raising the longbow, drawing an arrow to his cheek and loosing it '
                  '{para}, then lowering the bow'),
    },
})

# O BUGBEAR (e o Klarg, que e este corpo recolorido). Clava de cravos.
_BUGBEAR = ('a huge hunched hairy bugbear with tawny gold fur, a rust-red mane, lynx '
            'ears, a black leather pauldron, gauntlet, belt and strip kilt, ')
CRIATURAS.update({
    'bugbear80': {
        'sujeito': _BUGBEAR + 'a wooden club studded with iron spikes in his right hand',
        'parado': 'hunched, the spiked club raised at shoulder height in his right hand',
        'golpe': ('raising the spiked club high and smashing it down {para} in one heavy '
                  'overhead blow, a heavy step in that direction, then recovering'),
        'chao': 'the spiked club dropped beside his right hand, the shaggy fur spread on the ground',
    },
})

# O MARCARRUBRA: dois golpes de espada curta por turno (o bloco da aventura).
_MARCARRUBRA = ('a stocky bald human thug with a broken nose, a dark brown studded leather '
                'jerkin and a long grimy scarlet cloak, ')
CRIATURAS.update({
    'marcarrubra': {
        'sujeito': _MARCARRUBRA + 'a steel shortsword in his right hand',
        'parado': 'shortsword held low and out from the body, the left fist clenched',
        # Dois cortes no texto faziam o modelo girar o corpo no meio do golpe
        # (de frente ou de costas em metade das direcoes): um corte so.
        'golpe': ('swinging the shortsword in one overhead strike {para}, a short step '
                  'in that direction, then recovering'),
        'chao': 'the shortsword dropped beside his hand, the scarlet cloak spread under him',
    },
})

# O HOBGOBLIN: espada e escudo (a base) e o arco longo (`hobArco`, troca quando
# ataca de longe). Canhoto como nasceu: escudo no braco direito.
_HOB = ('a stocky hobgoblin soldier with red-orange skin, long pointed ears, black hair '
        'tied back, dark blue-grey steel plate and chain armor with spiked pauldrons '
        'and a brown fur skirt, ')
CRIATURAS.update({
    'hob': {
        'sujeito': _HOB + 'a round steel shield on one arm and a steel longsword in the other hand, a longbow on his back',
        'parado': 'the shield raised in front of the body, the longsword held low and ready',
        'golpe': ('stepping in behind the shield and slashing the longsword {para} in one '
                  'strong overhead strike, the shield kept up, then recovering'),
        'chao': 'the longsword and the round shield dropped beside him',
    },
    'hobArco': {
        'sem_queda': True,
        'sujeito': _HOB + 'a longbow of dark wood in one hand, a round shield slung on his back',
        'parado': 'longbow held low at his side',
        'golpe': ('raising the longbow, drawing an arrow to his cheek and loosing it '
                  '{para}, then lowering the bow'),
    },
})

# AS CRIATURAS DA MANSAO.
CRIATURAS.update({
    'esqueleto': {
        'sujeito': 'an animated human skeleton with a rusty iron shortsword in its right hand and brown rags on the hips',
        'parado': 'stiff ready stance, the shortsword held out from the body',
        'golpe': ('swinging the rusty shortsword in one overhead strike {para}, a short '
                  'step in that direction, then recovering'),
        'chao': 'collapsed into a heap of loose bones, the skull resting on top, the rusty shortsword beside it',
        'cair': ('struck down, the skeleton falls apart and collapses into a heap of loose '
                 'bones on the ground, the skull on top, the rusty shortsword beside it, '
                 'then lies still'),
    },
    'ratoGigante': {
        'sujeito': 'a giant grey-brown sewer rat with big pink ears, a long naked pink tail and red eyes',
        'andar': ('scurrying forward on all four legs, body low, the long tail '
                  'swaying behind'),
        'parado': 'crouched on all four legs, snout forward, whiskers twitching',
        'golpe': ('crouching, then lunging {para} with a snapping bite of the long '
                  'yellow incisors, then landing back on all fours'),
        'cair': ('struck down, the rat flips onto its side, legs curled up and the '
                 'long tail limp, and lies still'),
    },
    'vigia': {
        'sujeito': ('a hunched gaunt one-eyed cave creature with very dark brown skin, a '
                    'single huge yellow-green eye in its face and long curved claws'),
        'parado': 'crouched and leaning forward, the clawed hands raised and spread',
        'golpe': ('lunging {para} and raking with the long claws of both hands, one '
                  'swipe after the other, then recovering'),
        'chao': 'the claws spread on the ground, the huge eye closed',
        'cair': ('struck down, the creature falls onto its back with the long clawed '
                 'arms sprawled out and the huge eye closed, and lies still'),
    },
})

# O VIGIA de verdade (o `vigia` de antes ficou descartado: o dono mostrou que
# ele e agachado em quatro membros, com espinhos e bocarra).
CRIATURAS['vigiaDirecoes'] = {
    'sujeito': ('a gaunt crouching cave aberration with one enormous yellow-green eye, a '
                'gaping toothy mouth, bone spikes on the head and back and mottled dark '
                'brown and red skin'),
    'andar': ('prowling forward low on all four long limbs like a hunting beast, '
              'head low, the spiny back arched'),
    'parado': 'crouched on all four long limbs, head low and forward, claws on the ground',
    'golpe': ('rearing up and raking {para} with the long claws of one arm, the jaws '
              'gaping, then dropping back onto all fours'),
    'cair': ('struck down, the creature collapses onto its side with its long limbs '
             'sprawled out and the huge eye closed, and lies still'),
}

# O CAJAVIDRO: o cajado de vidro e a magia (mãos e luz), como o Ilvan.
_CAJAVIDRO = ('a lean human wizard with long dark hair and a short beard, in a long deep '
              'crimson robe with pale embroidered trim, a crimson sash and a satchel, ')
CRIATURAS['cajavidro'] = {
    'sujeito': _CAJAVIDRO + 'a tall staff of pale translucent glass in his right hand',
    'parado': 'standing upright, the glass staff planted beside him, the left hand raised',
    'golpe': ('swinging the glass staff in one strike {para} with both hands, a short '
              'step in that direction, then recovering'),
    'magia': ('casting a spell: raising the glass staff, its top glowing pale blue-white, '
              'and thrusting his open left hand {para}, a burst of pale violet light '
              'leaving his hand, then lowering both'),
    'chao': 'the glass staff dropped beside him, the crimson robe spread on the ground',
}

# O LOBO. Quadrupede (esqueleto `dog`): trota, da o bote com a mordida e cai
# de lado. O personagem animado e o `loboDirecoes` (a tira com as vistas no
# lugar certo).
_LOBO = 'a lean grey wolf with amber eyes, a pale throat and a darker saddle along the back'
CRIATURAS.update({
    'loboDirecoes': {
        'sujeito': _LOBO,
        'andar': ('trotting forward on all four legs in a steady diagonal gait, '
                  'head low, tail level, body steady'),
        'parado': 'standing on all four legs, head low and forward, ears up',
        'golpe': ('crouching, then lunging {para} with a snapping bite of the open '
                  'jaws, front paws lifting off the ground, then landing back on all fours'),
        # Na primeira leva as pernas viraram listras e o corpo lia como tapete:
        # o texto pede as quatro patas e a cabeca de perfil.
        'cair': ('struck down, the wolf collapses onto its side and lies still: the body '
                 'lying sideways on the ground, all four legs limp with the paws clearly '
                 'visible, the head resting on the ground in profile, eyes closed, '
                 'the bushy tail lying flat behind'),
    },
})

# O LOBO ATROZ: o lobo em grande, quase preto, de juba eriçada. A mordida
# derruba (CD 13 de FOR): o bote pesado, com o peso do corpo. Animado o
# `loboAtrozDirecoes` (vistas reordenadas e escurecidas, `atroz-tira.py`).
CRIATURAS['loboAtrozDirecoes'] = {
    'sujeito': ('a huge massive dire wolf with near-black blue-grey fur, a thick bristling '
                'mane over the neck and shoulders, pale icy eyes and long white fangs'),
    'andar': ('loping forward on all four legs in a heavy powerful stride, head low, '
              'the bristling mane rolling, tail level'),
    'parado': 'standing on all four legs, head low and forward, ears flat back, fangs bared',
    'golpe': ('crouching, then lunging {para} with a savage snapping bite of the huge '
              'jaws, the front paws lifting off the ground, then landing back heavily on '
              'all fours'),
    'cair': ('struck down, the dire wolf collapses onto its side and lies still: the body '
             'lying sideways on the ground, all four legs limp with the paws clearly '
             'visible, the head resting on the ground in profile, eyes closed, the bushy '
             'tail lying flat behind'),
}

# O ORC e o BRUGHOR (o chefe, edicao do mesmo corpo). Machado grande nas duas
# maos: um golpe de cima para baixo.
_ORC = ('a hulking ash-grey orc with big lower tusks and short dark hair, a tawny fur '
        'mantle on the shoulders, a bone tusk pauldron, a brown leather tunic, a dark red '
        'sash, dark trousers and black boots, ')
CRIATURAS.update({
    'orc': {
        'sujeito': _ORC + 'a big iron greataxe held in both hands',
        'parado': 'the greataxe held low across the body in both hands',
        'golpe': ('raising the greataxe high over his head with both hands and chopping '
                  'it down {para} in one heavy blow, a heavy step in that direction, then '
                  'recovering'),
        'chao': 'the greataxe dropped beside him',
    },
    'brughor': {
        'sujeito': (_ORC + 'a battered horned iron helmet, a necklace of teeth, red war '
                    'paint, a big iron greataxe held in both hands'),
        'parado': 'the greataxe held low across the body in both hands',
        'golpe': ('raising the greataxe high over his head with both hands and chopping '
                  'it down {para} in one heavy blow, a heavy step in that direction, then '
                  'recovering'),
        # Na primeira queda o elmo sumiu: o texto diz que ele fica na cabeca.
        'chao': ('the horned iron helmet still on his head, the greataxe dropped beside '
                 'him, the fur mantle spread under him'),
    },
})

# O OGRO: a clava grande de madeira com cravos, numa mao so (o modelo oficial).
CRIATURAS['ogroGordo'] = {
    'sujeito': ('a huge obese pale tan ogre with a gigantic pot belly, a small bald head, a '
                'tusked underbite, leather straps, a ragged hide loincloth, a crude wooden '
                'greatclub studded with iron spikes in his right hand'),
    'andar': ('lumbering forward with heavy slow steps, the huge belly swaying, hunched, '
              'the greatclub dragging low at his side'),
    'parado': 'hunched, the spiked greatclub held low at his side',
    'golpe': ('raising the spiked greatclub high and smashing it down {para} in one heavy '
              'overhead blow, a heavy step in that direction, then recovering'),
    'chao': 'the spiked greatclub dropped beside him, the huge belly up',
}

# O REI GROL: o bugbear rei, de machado de batalha.
CRIATURAS['reiGrol'] = {
    'sujeito': ('a huge hunched bugbear king with near-black fur, a black mane, a crude horned '
                'iron crown, an eyepatch, a black leather pauldron, gauntlet and belt, a dark red '
                'loincloth, a big iron battleaxe in his right hand'),
    'parado': 'hunched, the battleaxe held upright at his right side',
    'golpe': ('raising the battleaxe high and chopping it down {para} in one heavy overhead '
              'blow, a heavy step in that direction, then recovering'),
    'chao': 'the battleaxe dropped beside him, the horned crown fallen off beside his head',
}

# A CORUJA-URSO: anda de quatro como urso; o ataque e o Multiataque do livro,
# a patada de garras e a bicada no mesmo bote.
CRIATURAS['corujaUrsoDirecoes'] = {
    'sujeito': ('an owlbear: a huge bear body with dusky purple-grey feathered fur, big paws '
                'with long black claws, and the head of a horned owl with a pale cream facial '
                'disc and a hooked beak'),
    'andar': ('lumbering forward on all four legs like a bear, heavy shoulders rolling, '
              'head low'),
    'parado': 'standing on all four legs, head low and forward, beak open',
    'golpe': ('rearing up on the hind legs, raking {para} with the long claws of a front paw '
              'and snapping the hooked beak down {para}, then dropping back onto all fours'),
    'cair': ('struck down, the owlbear collapses onto its side and lies still: the heavy body '
             'lying sideways on the ground, the four legs limp with the claws visible, the owl '
             'head resting on the ground in profile, eyes closed'),
}

# O ZUMBI: arrasta o pe e bate com os dois bracos de cima para baixo (o Golpe
# do bloco, concussao).
CRIATURAS['zumbi'] = {
    'sujeito': ('a gaunt shambling zombie with grey-brown rotting skin, thin stringy grey hair, '
                'a torn open teal vest, a red wound on the belly, ragged olive trousers and '
                'bare feet'),
    'andar': ('shambling forward slowly, dragging one foot, hunched, arms hanging forward, '
              'head lolling'),
    'parado': 'hunched, both arms hanging forward with clawed fingers',
    'golpe': ('raising both arms high and clubbing them down {para} together in one heavy '
              'blow, lurching a step in that direction, then recovering'),
    'chao': 'sprawled face up, arms flung out, motionless',
}

# O GRICK (a vista sul aprovada pelo dono). O ataque segue o Multiataque do
# Livro dos Monstros: os TENTACULOS chicoteiam e agarram, e so entao o BICO
# morde no meio deles (`seAcertar` no bloco). O quadro 1 do golpe e o agarrao
# dos tentaculos; o 2, o bico mordendo.
CRIATURAS['grick'] = {
    'sujeito': ('a grick: a thick segmented olive-green worm with a pale tan underside and no '
                'face, no eyes, no arms and no legs, its body coiled in an S and its front end '
                'reared up and split into four sucker-lined tentacles with hooked ivory claws '
                'around a hooked beak in a red maw'),
    'andar': ('slithering forward like a snake, the coiled body undulating along the ground, '
              'the four tentacles swaying, no legs'),
    'parado': 'reared up on its coils, the four tentacles spread wide around the beak',
    'golpe': ('lashing all four tentacles out {para} and wrapping them around the prey, then '
              'lunging forward {para} and stabbing the hooked beak between the closed '
              'tentacles in a bite, then rearing back up'),
    'cair': ('struck down, the grick collapses: the worm body falls flat and sprawls on the '
             'ground in a loose coil, the four tentacles limp and splayed, and lies still'),
}

# O CARNICAL (aprovado pelo dono). No livro ele nao tem Multiataque: a acao e
# a garra (que paralisa) OU a mordida; a IA usa a garra. O golpe e o bote de
# garras.
CRIATURAS['carnical'] = {
    'sujeito': ('a gaunt hunched ghoul with pale ashen blue-grey skin, a bald head with pointed '
                'ears, a fanged mouth with a long red tongue hanging out, very long arms with '
                'long black claws, a ragged tan loincloth and strips of tan cloth wrapped on the '
                'forearms and one shin, bare feet'),
    'andar': ('stalking forward in a fast hunched lope like a hungry predator, knees bent, the '
              'long clawed arms swinging low'),
    'parado': 'hunched, knees bent, the long clawed hands held low and spread, tongue out',
    'golpe': ('lunging forward {para} and raking down with the long black claws of both hands '
              'in a vicious swipe, then recoiling into a crouch'),
    'chao': 'sprawled on his back, the long arms flung out, the tongue lolling, motionless',
}

# HAMUN KOST (aprovado pelo dono). O ataque que ele mais usa e o Toque
# Arrepiante de longe: o golpe e o gesto da magia, o cetro erguido e a mao
# aberta soltando a mao espectral.
CRIATURAS['hamunKost'] = {
    'sujeito': ('a bald tattooed Red Wizard necromancer in a long deep red robe with a wide '
                'collar over black clothes, green flames on the hem, gold amulet and bracers, '
                'holding an ornate golden spiked scepter'),
    'parado': 'standing upright, the golden scepter held across the body',
    'golpe': ('casting a necromantic spell: raising the golden scepter in one hand and '
              'thrusting the other open hand {para}, a ghostly green skeletal hand of energy '
              'flying from his palm {para}, then lowering both'),
    'chao': 'the golden scepter dropped beside him, the red robe spread on the ground',
}

# O DOPPELGANGER (forma verdadeira, aprovada pelo dono). O ataque e o Golpe do
# bloco (concussao), duas vezes por turno: a pancada com o punho comprido.
CRIATURAS['doppelganger'] = {
    'sujeito': ('a tall thin lanky doppelganger in its true form, smooth hairless slate blue-grey '
                'skin, a bald elongated head with blank white eyes, very long arms with big '
                'long-fingered hands, no clothes'),
    'andar': ('walking forward with a smooth, eerie, gliding gait, the long arms hanging loose'),
    'parado': 'standing still, slightly hunched, the long arms hanging loose at its sides',
    'golpe': ('swinging a long arm and slamming its fist down {para} in one fast heavy blow, a '
              'step in that direction, then recovering'),
    'chao': 'sprawled on its back, the long thin limbs flung out, motionless',
}

# A DROW (aprovada pelo dono): espada curta numa mao e besta de mao na outra.
# Ataques Multiplos de espada no `drowEspada`; o tiro no `drowTiro` (so o
# golpe; o andar e a queda vem do outro, `--ataque-de` no importador).
_DROW = ('a slender female drow with dark purple-grey skin, white hair in a high ponytail, '
         'black spiked plate armor over dark chain mail, a slim curved shortsword in the right '
         'hand and a small hand crossbow in the left hand')
CRIATURAS.update({
    'drowEspada': {
        'sujeito': _DROW,
        'parado': 'the shortsword held low at her side, the hand crossbow pointing forward',
        'golpe': ('slashing {para} with the shortsword in one quick strike, a short step in '
                  'that direction, then recovering'),
        'chao': 'the shortsword and the hand crossbow dropped beside her, the white hair spread',
    },
    'drowTiro': {
        'sem_queda': True,
        'sujeito': _DROW,
        'parado': 'the shortsword held low at her side, the hand crossbow pointing forward',
        'golpe': ('raising the small hand crossbow in her left hand, aiming {para} with the arm '
                  'stretched out and shooting a bolt, the crossbow kicking back, then lowering it'),
    },
})

# O STIRGE (aprovado pelo dono, 24 px): voa batendo as quatro asas, o ataque e
# o Drenar Sangue (o mergulho e a tromba cravando), e cai de asas abertas.
CRIATURAS['stirge'] = {
    'sujeito': ('a tiny stirge: a small rust-red flying blood-sucker with four pale cream bat '
                'wings in an X, a bulbous head with orange eyes and a long needle proboscis, '
                'thin pincer legs dangling'),
    'andar': 'flying forward, flapping its four bat wings fast, hovering in the air',
    'parado': 'hovering in the air, the four wings spread, the proboscis pointing forward',
    'golpe': ('diving {para} and stabbing its long needle proboscis forward, the wings swept '
              'back, then pulling back up and hovering'),
    'cair': ('struck down, the stirge falls out of the air and lands on the ground, its four '
             'wings crumpled and splayed, and lies still'),
}

# AS POSTURAS DE ARMA DA DARA. Sem queda: o corpo no chao e o mesmo em todas,
# e vem da folha de espada e escudo. A arma de arco, besta e duas maos e verde
# puro (marcador; ver `editar-pixellab.py`) e o texto repete isso, porque o
# pixminimax redesenha a figura a cada quadro e precisa ser lembrado.
_DARA = ('a female red dragonborn fighter with long swept-back horns, no tail, '
         'no wings, in a steel chain mail hauberk and a cream tabard with red '
         'trim, ')
CRIATURAS.update({
    'fighterSemEscudo': {
        'sujeito': _DARA + 'a steel longsword in her right hand, no shield, the '
                           'left hand empty',
        'parado': 'longsword held low at her side, the left arm free',
        'golpe': ('swinging the longsword in one overhead strike {para}, a short '
                  'step in that direction, then recovering'),
        'sem_queda': True,
    },
    'fighterArco': {
        'sujeito': _DARA + 'a bright pure green longbow in her left hand, no shield',
        'parado': 'the green bow held upright in the left hand at her side',
        'golpe': ('raising the green bow, nocking an arrow and drawing it back to '
                  'her cheek, then loosing it {para}, then lowering the bow'),
        'sem_queda': True,
    },
    'fighterBesta': {
        'sujeito': _DARA + 'a bright pure green heavy crossbow in both hands, no shield',
        'parado': 'the green crossbow held in both hands at waist level',
        'golpe': ('raising the green crossbow to her shoulder, aiming and shooting '
                  'a bolt {para}, the recoil jolting it, then lowering it'),
        'sem_queda': True,
    },
    'fighterDuasMaos': {
        'sujeito': _DARA + 'a bright pure green greatsword gripped in both hands, no shield',
        'parado': 'the green greatsword held in both hands, blade up diagonally',
        'golpe': ('swinging the green greatsword with both hands in one heavy '
                  'overhead strike {para}, a step in that direction, then recovering'),
        'sem_queda': True,
    },
})


# O NEZZNAR, a Aranha Negra (aprovado pelo dono). Mago com cajado: o golpe e a
# bordoada do Cajado Aranha e a `magia` e o gesto de conjurar, que o motor usa
# no lugar do golpe quando ele lanca (`conjurar`). O dourado da barra da capa
# entra no texto porque o pixminimax redesenha a figura a cada quadro.
_NEZZNAR = ('a slender male drow archmage with grey-purple skin, long white hair and red '
            'eyes, in a dark charcoal plated leather coat and a dark slate cloak with a '
            'crimson lining and a gold-trimmed hem, holding a tall black staff topped '
            'with a metal spider')
CRIATURAS['nezznar'] = {
    'sujeito': _NEZZNAR,
    'parado': 'standing upright, the black spider staff planted vertically at his right side',
    'golpe': ('swinging the black spider staff in one hard strike {para} with both hands, '
              'a short step in that direction, then recovering'),
    'magia': ('casting a spell: raising the black spider staff, the metal spider at its top '
              'glowing crimson, and thrusting his open left hand {para}, a burst of crimson '
              'light leaving his hand, then lowering both'),
    'chao': 'the black spider staff dropped beside him, the crimson-lined cloak spread on the ground',
}

# A REFACAO DO SUL: no golpe de sul o cajado SUMIU das maos nos quadros do
# meio, e a queda virou um vulto agachado em vez de um corpo deitado. O texto
# daqui repete o cajado em todo quadro e diz o corpo esticado no chao.
CRIATURAS['nezznarSul'] = {
    'sujeito': _NEZZNAR,
    'parado': 'standing upright, the black spider staff planted vertically at his right side',
    'golpe': ('gripping the black spider staff IN BOTH HANDS the whole time, raising it and '
              'striking {para} in one hard overhead blow, the black staff and its metal '
              'spider clearly visible in his hands in EVERY frame, a short step in that '
              'direction, then recovering'),
    'cair': ('struck down, the drow archmage falls backward and lands FLAT ON HIS BACK, then '
             'lies still: the body stretched out flat on the ground, arms spread wide, legs '
             'straight, the long white hair spread out, the dark cloak open under him showing '
             'its crimson lining, the black spider staff fallen on the ground beside him'),
}

# O WRAITH (Mormesk, aprovado pelo dono). Mesmo caso do espectro: flutua, o
# golpe e o Dreno de Vida (a garra atravessa, entao e um avanco de mao aberta)
# e a morte e um desmanche no ar, nao um corpo que cai. O que muda e a
# LEITURA: ele e carvao, nao violeta, e afina para baixo em vez de alargar.
_WRAITH = ('a wraith: a tall figure of dark grey and black smoke with a thin crown of '
           'crooked spikes, a black hollow face with two glowing yellow eyes, two very '
           'long thin arms with long claws, and no legs -- the body trails away '
           'downward into ragged smoke')
CRIATURAS['wraith'] = {
    'sujeito': _WRAITH,
    'andar': ('gliding forward through the air without legs, the smoke of the body '
              'streaming behind, never touching the ground'),
    'parado': 'hovering in the air, the smoke trailing below, the long arms hanging open',
    'golpe': ('gliding {para} and thrusting one long clawed hand forward {para} in a slow '
              'reaching grasp, the arm stretching unnaturally long, then drawing back'),
    'cair': ('destroyed, the wraith comes apart in the air: the crown falls through the '
             'smoke, the dark body unravels into thinning black wisps that scatter and '
             'fade to nothing, leaving NO body on the ground'),
}

# O ESPECTRO (a vista do OpenArt, aprovada pelo dono). Incorporeo: nao anda,
# FLUTUA, e a "queda" nao e um corpo caindo -- e um vulto que se desmancha no
# ar (`cair`). O ataque e o Dreno de Vida do bloco: a garra atravessa o alvo,
# entao e um avanco de mao aberta, nao uma porrada. Os textos repetem "sem
# costela, sem saia, sem pernas" porque o pixminimax redesenha a figura a
# cada quadro e foram esses tres os erros da primeira leva.
_ESPECTRO = ('a specter: a ghost of glowing violet vapour with a gaunt screaming skull-like '
             'face, pale violet hair streaming up in thin flames, a hollow chest with no '
             'ribs, long thin arms with hooked claws, and no legs -- below the chest the '
             'body frays into ragged trailing streamers of smoke')
CRIATURAS['espectro'] = {
    'sujeito': _ESPECTRO,
    'andar': ('floating forward through the air without legs, the body drifting and the '
              'smoke streamers trailing behind, never touching the ground'),
    'parado': 'hovering in the air, the smoke streamers drifting below, arms raised and open',
    'golpe': ('gliding {para} and thrusting one open clawed hand forward {para} in a slow '
              'reaching grasp, the arm stretching unnaturally long, then drawing back'),
    'cair': ('destroyed, the specter comes apart in the air: the face and arms dissolve, '
             'the violet smoke scatters outward into thinning wisps, and the last shreds '
             'fade away to nothing, leaving NO body on the ground'),
}

# A GELATINA OCRE (a tira montada, aprovada pelo dono). Gosma: nao anda, se
# ARRASTA, e o ataque e o Pseudopode -- o toco se estica e desaba sobre o
# alvo. A queda nao e um corpo caindo: a massa perde a forma e se espalha no
# chao numa poca lisa. Os textos repetem "sem rosto, sem olhos, sem membros"
# porque o pixminimax redesenha a figura a cada quadro e, sem isso, inventa
# cara e bracos (foi o que aconteceu na primeira leva so de texto).
_GELATINA = ('an ochre jelly: a low wide puddle of thick golden-brown slime on the ground '
             'with one short blunt stump of slime rising from it, no face, no eyes, no '
             'mouth, no head, no arms and no legs')
CRIATURAS['gelatinaOcre'] = {
    'sujeito': _GELATINA,
    'andar': ('oozing slowly forward along the ground, the whole mass stretching forward '
              'and then pulling its back end along, rippling, never lifting off the floor'),
    'parado': 'resting on the ground, the slime surface rippling slowly, the short stump leaning',
    'golpe': ('the short stump of slime stretching up and lashing down {para} in one heavy '
              'wet slap, splattering drops, then sinking back into the mass'),
    'cair': ('killed, the ochre jelly loses its shape: the stump melts down into the mass, '
             'the whole body sags and spreads out flat on the ground into a thin still '
             'puddle of slime with runny edges'),
}

# A ARANHA GIGANTE (aprovada pelo dono): anda nas oito patas, a Mordida e o
# bote com as presas, e a Teia (`aranhaGiganteTeia`, so o golpe, no mesmo
# personagem) e o jato de seda do abdomen.
_ARANHA = ('a giant hairy spider as big as a horse: dark charcoal-brown bristly body, a big '
           'round abdomen with red stripes, eight long hairy legs with red bands at the joints, '
           'eight small red eyes and two big ivory-tipped fangs')
CRIATURAS.update({
    'aranhaGigante': {
        'sujeito': _ARANHA,
        'andar': ('scuttling forward on its eight legs, the legs moving in alternating waves, '
                  'the body low and level, the abdomen bobbing slightly'),
        'parado': 'crouched low on its eight legs, the front legs slightly raised, fangs spread',
        'golpe': ('rearing up on the back legs with the front legs raised high, then lunging '
                  '{para} and sinking its two big fangs down in a fast bite, then dropping '
                  'back low on all eight legs'),
        'cair': ('struck down, the giant spider collapses: the body slumps flat on the ground, '
                 'then flips onto its back with the eight legs curled up into the air, and lies '
                 'still'),
    },
    'aranhaGiganteTeia': {
        'sem_queda': True,
        'sujeito': _ARANHA,
        'parado': 'crouched low on its eight legs, the front legs slightly raised, fangs spread',
        'golpe': ('raising and tilting its big abdomen forward and shooting a thick white strand '
                  'of sticky web {para}, the web flying out in a long line, then lowering the '
                  'abdomen and crouching back low'),
    },
})


def poses_de(chave):
    c = CRIATURAS[chave]
    # Quem nao anda em duas pernas diz como anda (`andar`): o lobo trota.
    poses = [('walk', OITO, {'mode': 'v3',
                             'action_description': c.get('andar') or (
                                 'walking forward, legs alternating in '
                                 'a full stride, arms swinging in opposition')})]
    for d in OITO:
        olha, para = OLHAR[d]
        poses.append(('attack-dir', [d], {
            'mode': 'pixminimax',
            'action_description': (
                f'{olha}, ' + c['golpe'].format(para=para) + '. The body keeps '
                'facing the same way the whole time and never turns around.'),
            'subject_description': c['sujeito'],
            'initial_pose': f'standing in a ready stance {olha}, ' + c['parado'],
            'frame_count': 8,
        }))
    # A MAGIA, para quem conjura: um gesto proprio por direcao, que o motor usa
    # nas magias no lugar do golpe de arma (`conjurar`).
    if c.get('magia'):
        for d in OITO:
            olha, para = OLHAR[d]
            poses.append(('cast-dir', [d], {
                'mode': 'pixminimax',
                'action_description': (
                    f'{olha}, ' + c['magia'].format(para=para) + '. The body keeps '
                    'facing the same way the whole time and never turns around.'),
                'subject_description': c['sujeito'],
                'initial_pose': f'standing {olha}, ' + c['parado'],
                'frame_count': 8,
            }))
    if c.get('sem_queda'):
        return poses
    poses.append(('queda-pix', ['south'], {
        'mode': 'pixminimax',
        'action_description': c.get('cair') or (
            'struck down, falling backward and landing flat on '
            f'{c.get("dela", "his")} back, then lying still: ' + c['chao']),
        'subject_description': c['sujeito'],
        'initial_pose': 'standing in a ready stance facing the viewer, ' + c['parado'],
        'frame_count': 8,
    }))
    return poses


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--character-id', help='padrao: o id da --criatura no registro')
    p.add_argument('--criatura', choices=sorted(CRIATURAS),
                   help='gera a receita completa dessa criatura')
    p.add_argument('--saida', required=True)
    p.add_argument('--go', action='store_true', help='sem isto, so o plano')
    p.add_argument('--pular', default='',
                   help='nomes ja pedidos, separados por virgula')
    p.add_argument('--somente', default='',
                   help='so estes nomes, separados por virgula')
    p.add_argument('--direcoes', default='',
                   help='so estas direcoes, separadas por virgula: com a fila cheia o '
                        'servidor aceita parte de um pedido de oito, e o resto se repede assim')
    a = p.parse_args()
    poses = poses_de(a.criatura) if a.criatura else POSES
    if a.direcoes:
        so = [d.strip() for d in a.direcoes.split(',') if d.strip()]
        poses = [(n, [d for d in ds if d in so], e) for n, ds, e in poses]
        poses = [(n, ds, e) for n, ds, e in poses if ds]
    if not a.character_id:
        if not a.criatura:
            raise SystemExit('passe --character-id ou --criatura')
        registro = json.loads((Path(__file__).resolve().parent /
                               'pixellab-personagens.json').read_text(encoding='utf-8'))
        a.character_id = registro[a.criatura]

    token = os.environ.get('PIXELLAB_TOKEN')
    if not token:
        raise SystemExit('defina PIXELLAB_TOKEN no ambiente')

    # O servidor recusa `subject_description` acima de 300 caracteres -- e so
    # depois de ja ter aceitado as poses anteriores da lista.
    for nome, _, extra in poses:
        if len(extra.get('subject_description', '')) > 300:
            raise SystemExit(f'{nome}: subject_description tem '
                             f'{len(extra["subject_description"])} caracteres, o teto e 300')

    custo = sum(len(d) for _, d, _ in poses)
    print('PLANO')
    for nome, dirs, extra in poses:
        alvo = extra.get('template_animation_id', '')
        print(f'  {nome:8} {extra["mode"]:9} {alvo:20} {len(dirs)} direcao(oes)'
              f'  ->  {len(dirs)} geracoes')
    print(f'  {"TOTAL":8} {custo} geracoes')

    saldo = chamar(token, 'GET', '/balance')['subscription']
    print(f'\nsaldo: {saldo["generations"]:.0f} de {saldo["total"]:.0f} '
          f'({saldo.get("plan")})')
    if not a.go:
        print('\n(seco: nada foi gerado. use --go)')
        return
    if saldo['generations'] < custo:
        raise SystemExit(f'saldo insuficiente: {saldo["generations"]} < {custo}')

    pular = {x.strip() for x in a.pular.split(',') if x.strip()}
    somente = {x.strip() for x in a.somente.split(',') if x.strip()}
    gasto = []
    for nome, dirs, extra in poses:
        if nome in pular or (somente and nome not in somente):
            print(f'\n"{nome}" fora desta rodada; pulando')
            continue
        print(f'\npedindo "{nome}" ({extra["mode"]}) em {len(dirs)} direcao(oes)...',
              flush=True)
        corpo = {
            'character_id': a.character_id,
            'animation_name': nome,
            'directions': dirs,
            'seed': SEMENTE,
            **extra,
        }
        # `frame_count` e `enhance_prompt` sao do modo custom; no template o
        # numero de quadros vem do proprio esqueleto.
        if extra['mode'] != 'template':
            # `setdefault`: a pose pode trazer o proprio numero de quadros --
            # o pixminimax exige multiplo de 4, o v3 exige par entre 4 e 16.
            corpo.setdefault('frame_count', QUADROS)
            corpo.setdefault('enhance_prompt', False)
        r = pedir(token, corpo)
        if r.get('usage'):
            gasto.append((nome, r['usage']))
            print(f'  usage: {r["usage"]}')

    # QUEM DIZ QUE ACABOU E O DOWNLOAD, NAO A CONTAGEM.
    #
    # `animation_count` nao conta POSES, conta DIRECOES: as seis poses deste
    # script sao 19 entradas la. Comparar com `len(POSES)` deu "9 de 6
    # prontas" e um download cedo demais, que o servidor recusou com 423.
    # Entao o fim e simplesmente o 423 parar de acontecer -- o proprio
    # servidor sabe quantas faltam, e ate diz na mensagem.
    print('\nesperando o servidor terminar...', flush=True)
    # O 423 so aparece depois que o servidor CONTA o trabalho. Logo apos o
    # POST ha uma janela em que ele ainda nao contou, e o download passa e
    # traz a folha velha -- aconteceu com a queda do guerreiro. Meio minuto
    # fecha a janela.
    time.sleep(30)
    destino = Path(a.saida)
    destino.mkdir(parents=True, exist_ok=True)
    z = destino / 'folha.zip'
    inicio = time.time()
    while True:
        try:
            z.write_bytes(chamar(token, 'GET', f'/characters/{a.character_id}/spritesheet',
                                 bruto=True, espera=600))
            break
        except Travado as e:
            if time.time() - inicio > 3600:
                raise SystemExit('tempo esgotado esperando as animacoes')
            print(f'  {e}  ({int(time.time()-inicio)}s)', flush=True)
            time.sleep(20)
    with zipfile.ZipFile(z) as f:
        f.extractall(destino)
        print('\narquivos:', f.namelist())

    fim = chamar(token, 'GET', '/balance')['subscription']
    print(f'\nsaldo depois: {fim["generations"]:.0f}  '
          f'(gastou {saldo["generations"] - fim["generations"]:.0f})')
    for nome, u in gasto:
        print(f'  {nome}: {u}')


if __name__ == '__main__':
    main()
