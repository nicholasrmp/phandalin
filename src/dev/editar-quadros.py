# -*- coding: utf-8 -*-
"""
Edita, por frase, SO os quadros de uma folha do PixelLab que o motor usa, e
grava uma copia da folha com eles trocados. O importador le a copia.

ISTO GASTA GERACOES DA CONTA. Sem `--go` o script so imprime o plano.

POR QUE ESTE E NAO O `editar-pixellab.py`. Aquele edita as oito vistas
paradas para uma PREVIA. Este conserta uma animacao ja gerada: a cauda que o
modelo inventou na Dara, onde a capa creme da calca virou escama vermelha.
Gerar a animacao de novo sortearia outro defeito; a `edit-animation-v2`
mantem a pose (94-100% da silhueta nas previas) e muda so o que a frase pede.

UMA DIRECAO POR PEDIDO. Os quadros de uma direcao -- o parado, os quatro do
andar e os dois do ataque -- sao a mesma figura vista do mesmo lado, que e o
caso para o qual a edicao foi feita ("coerencia entre quadros").

A JANELA DE 80. A edicao aceita 9 quadros ate 80 px e so 4 acima disso, e as
celulas das animacoes sao de 96. Entao cada direcao e recortada numa janela de
80x80, a MESMA para os sete quadros, centrada na uniao das figuras. Se a
uniao passa de 80 -- ao sul, a espada erguida e a ponta baixada somam 84 --,
o que fica fora da janela volta do original sem mudanca: a frase mexe na
cintura e nas pernas, nunca na ponta da espada.

Custo declarado: 10 geracoes por pedido.
"""
import argparse
import base64
import io
import json
import os
import re
import shutil
import time
import urllib.error
import urllib.request
from pathlib import Path
from PIL import Image

BASE = 'https://api.pixellab.ai/v2'
RAIZ = Path(__file__).resolve().parents[2]
JANELA = 80

EDICOES = {
    'dara-sem-cauda': (
        'Remove the dragon tail: she is a dragonborn and has NO tail. The red '
        'scaly tail behind her legs must disappear completely. In its place keep '
        'only a short cream-white cloth flap of her trousers hanging straight '
        'down behind the knees, plain cream with no red, not pointed and not '
        'curling. Keep everything else exactly the same: the red dragonborn '
        'head and horns, the chain mail, the cream tabard with red trim, the '
        'belt, the steel shield with the red dragon emblem, the longsword, the '
        'pose and position in every frame, the direction each frame faces and '
        'the colours.'
    ),
    # As posturas de arma: a arma e o MARCADOR verde (ou a espada de aco), e
    # tem de sair igual -- e por ela que o extrator mede a mao.
    # Ao sul, a besta saiu com uma cauda CREME e comprida curvando para a
    # direita, e a edicao generica nao a reconheceu como cauda.
    'cauda-creme': (
        'Remove the long cream-coloured tail that curves out from behind her '
        'legs to the right side of the image. She has NO tail at all: nothing '
        'sticks out sideways from behind her legs. Keep the bright green '
        'crossbow exactly as it is in every frame, and keep everything else '
        'exactly the same: the red dragonborn head and horns, the chain mail, '
        'the cream tabard with red trim, the belt, the legs and feet, the pose '
        'and position in every frame and the colours.'
    ),
    # AS FAMILIAS DE ARMA, desenhadas DENTRO da animacao. A edicao troca so
    # a arma e mantem a pose: a nova arma inclina e borra junto com o golpe,
    # o que nenhuma arma colada por cima consegue. Uma arma por familia --
    # maca serve a martelo e estrela, machado a machadinha e Hew.
    'arma-maca': (
        'Replace the longsword in her right hand with a flanged mace: a wooden '
        'handle about as long as her forearm topped by a heavy round steel head '
        'with flanges, held the same way, in the same position and pointing the '
        'same direction as the sword in every frame. Keep the steel heater '
        'shield with the red dragon emblem on her left arm. She has no tail. '
        'Keep everything else exactly the same: the red dragonborn head and '
        'horns, the chain mail, the cream tabard with red trim, the belt, the '
        'pose and position in every frame, the direction each frame faces and '
        'the colours.'
    ),
    'arma-machado': (
        'Replace the longsword in her right hand with a battleaxe: a wooden haft '
        'a bit longer than her forearm with a wide single-bladed steel axe head '
        'at the top, held the same way, in the same position and pointing the '
        'same direction as the sword in every frame. Keep the steel heater '
        'shield with the red dragon emblem on her left arm. She has no tail. '
        'Keep everything else exactly the same: the red dragonborn head and '
        'horns, the chain mail, the cream tabard with red trim, the belt, the '
        'pose and position in every frame, the direction each frame faces and '
        'the colours.'
    ),
    # o corpo no chao das posturas SEM escudo (espada so, duas maos, arco, besta)
    'queda-sem-escudo': (
        'Remove the shield and any weapon she is holding. The dragonborn fighter '
        'keeps the same armor, the same pose and the same colors; where the shield '
        'was, draw her arm and her armored body instead. Nothing else changes.'
    ),
    'arma-machado-grande': (
        'Replace the bright green greatsword with a greataxe: a long wooden haft '
        'gripped in both of her hands with a huge double-bladed steel axe head at '
        'the far end, in the same position and pointing the same direction as '
        'the sword in every frame. Nothing green remains. She has no tail. Keep '
        'everything else exactly the same: the red dragonborn head and horns, the '
        'chain mail, the cream tabard with red trim, the belt, the pose and '
        'position in every frame, the direction each frame faces and the colours.'
    ),
    'arma-malho': (
        'Replace the bright green greatsword with a maul: a long wooden haft '
        'gripped in both of her hands with a massive square iron hammer head at '
        'the far end, in the same position and pointing the same direction as '
        'the sword in every frame. Nothing green remains. She has no tail. Keep '
        'everything else exactly the same: the red dragonborn head and horns, the '
        'chain mail, the cream tabard with red trim, the belt, the pose and '
        'position in every frame, the direction each frame faces and the colours.'
    ),
    'postura-sem-cauda': (
        'Remove the dragon tail: she is a dragonborn and has NO tail. Any red '
        'scaly tail behind her legs must disappear completely; behind the knees '
        'keep only a short plain cream cloth flap of her trousers, not pointed '
        'and not curling. Keep the weapon she holds exactly as it is, the same '
        'shape, position and colour in every frame; if it is a bow, it is one '
        'single unbroken curved bow. Keep everything else exactly the same: '
        'the red dragonborn head and horns, the chain mail, the cream tabard with '
        'red trim, the belt, the pose and position in every frame, the direction '
        'each frame faces and the colours.'
    ),
}

# AS ARMADURAS DA DARA, por edicao de cada folha de arma. A arma, o escudo e
# a pose ficam; so a armadura muda. A arma verde de algumas folhas (o
# marcador da espada grande, do arco e da besta) tem de continuar verde: e
# ela que o importador troca por madeira ou aco depois.
_ARMADURA_MANTEM = (
    ' Keep the weapon she holds, and the shield if she has one, exactly as they '
    'are in every frame: same shape, position and colour, and a bright green '
    'weapon stays bright green. She has no tail. Keep everything else exactly '
    'the same: the red dragonborn head and horns, the cream tabard with red '
    'trim, the belt, the pose and position in every frame, the direction each '
    'frame faces and the colours of her scales.'
)
for _nome, _armadura in (
        ('placas', 'full plate armor: polished steel breastplate, steel pauldrons, '
                   'steel vambraces and steel greaves'),
        ('escamas', 'scale mail: a coat of overlapping steel scales like fish scales '
                    'down to the thighs, worn over a leather jerkin'),
        ('couro', 'a fitted brown leather cuirass with leather shoulder guards and '
                  'leather bracers, studded with small steel rivets'),
        ('peles', 'hide armor of thick brown furs and tanned animal hides, a fur '
                  'mantle over the shoulders, bound with leather straps'),
        ('roupa', 'no armor at all: a quilted padded cloth gambeson tunic in muted '
                  'brown, no metal on the body')):
    EDICOES[f'armadura-{_nome}'] = (
        f'Replace her steel chain mail hauberk with {_armadura}.' + _ARMADURA_MANTEM)

# O KIT DO BRENN, pela mesma receita: a pose fica, troca a arma ou a armadura.
_BRENN_MANTEM = (
    ' Keep everything else exactly the same: the short stout dwarf body, the '
    'bearded face and bare head, the grey tabard with the gold trim, the belt, '
    'the boots, the pose and position in every frame, the direction each frame '
    'faces and the colours.'
)
EDICOES.update({
    'brenn-arma-martelo': (
        'Replace the flanged mace in his right hand with a dwarven warhammer: a '
        'wooden handle about as long as his forearm topped by a heavy square '
        'steel hammer head with a short spike on the back, held the same way, in '
        'the same position and pointing the same direction as the mace in every '
        'frame. Keep the steel heater shield with the golden sun emblem on his '
        'left arm and the steel scale mail.' + _BRENN_MANTEM),
    'brenn-armadura-malha': (
        'Replace his steel scale mail with a full chain mail hauberk of small '
        'riveted steel rings, with mail sleeves, down to the thighs. Keep the '
        'weapon he holds, and the shield if he has one, exactly as they are in '
        'every frame: same shape, position and colour, and a bright green weapon '
        'stays bright green.' + _BRENN_MANTEM),
    'brenn-armadura-placas': (
        'Replace his steel scale mail with full plate armor: a polished steel '
        'breastplate, rounded steel pauldrons, steel vambraces and steel greaves. '
        'Keep the grey tabard cape hanging over his back. '
        'Keep the weapon he holds, and the shield if he has one, exactly as they '
        'are in every frame: same shape, position and colour.' + _BRENN_MANTEM),
    # De placas ele vai de capacete (pedido do dono). Aro dourado e o sol na
    # testa: o Torvik, o outro anao, usa um capacete liso de aco e azul.
    'brenn-capacete': (
        'Add a helmet to his head: a rounded steel dwarven helm with a gold rim '
        'and a small golden sun on the brow, open-faced so his face and his '
        'long grey-brown beard stay visible. Keep the plate armor, the weapon he '
        'holds and the shield if he has one exactly as they are in every frame. '
        'Keep everything else exactly the same: the short stout dwarf body, the '
        'pose and position in every frame, the direction each frame faces and '
        'the colours.'),
    'brenn-queda-sem-escudo': (
        'Remove the shield and any weapon he is holding. The dwarf keeps the same '
        'armor, the same pose and the same colours; where the shield was, draw '
        'his arm and his armored body instead. Nothing else changes.'),
})

_GRASK_MANTEM = (
    ' Keep everything else exactly the same: the huge muscular half-orc with '
    'grey-green skin, tusks, long black hair and red war paint, the brown fur '
    'mantle, the belt and kilt, the pose and position in every frame, the '
    'direction each frame faces and the colours.'
)

_TORVIK_MANTEM = (
    ' Keep everything else exactly the same: the short stout dwarf with the dark '
    'brown beard, the steel open-faced helm, the steel plate armor, the royal blue '
    'tabard and cape with white trim, the belt, the boots, the pose and position in '
    'every frame, the direction each frame faces and the colours.'
)

_CORIN_MANTEM = (
    ' Keep everything else exactly the same: the lean human ranger with short '
    'brown hair and a short beard, the brown leather cuirass with the crossed '
    'straps, the moss green cloak with the hood down, the quiver on his back, '
    'the belt, the boots, the pose and position in every frame, the direction '
    'each frame faces and the colours.'
)

# O KIT DO PIP: as armas por edicao da folha base (espada curta) e da de duas
# adagas; o couro batido por edicao de todas.
_PIP_MANTEM = (
    ' Keep everything else exactly the same: the small halfling body, the dark '
    'green cloak with the hood up over his head, the face under the hood, the '
    'belt, the boots, the pose and position in every frame, the direction each '
    'frame faces and the colours.'
)
EDICOES.update({
    'pip-arma-rapieira': (
        'Replace the shortsword in his right hand with a rapier: a long, thin, '
        'straight steel blade with a swept steel basket hilt, held the same way, '
        'in the same position and pointing the same direction as the shortsword '
        'in every frame. Keep the brown leather armor.' + _PIP_MANTEM),
    # A espada tem de ler como ESPADA ao lado da adaga: na primeira leva o
    # modelo so repintou a lamina e as duas armas sairam do mesmo tamanho.
    'pip-arma-espadas': (
        'Replace the dagger in each of his hands with a steel shortsword: one '
        'shortsword in each hand, each with a straight blade about TWICE as long '
        'as the dagger it replaces and a small cross guard, held the same way, in '
        'the same position and pointing the same direction as the dagger in every '
        'frame. Both blades must be visible. Keep the brown leather armor.'
        + _PIP_MANTEM),
    'pip-arma-espada-adaga': (
        'Replace only the dagger in his right hand with a steel shortsword: a '
        'straight blade about TWICE as long as the dagger, with a small cross '
        'guard, held the same way, in the same position and pointing the same '
        'direction in every frame. Keep the short dagger in his left hand exactly '
        'as it is, so the long sword and the short dagger are clearly different. '
        'Keep the brown leather armor.' + _PIP_MANTEM),
    # o corpo no chao das posturas que nao sao a da espada curta
    'pip-queda-sem-arma': (
        'Remove the sword and any weapon near him. The halfling keeps the same '
        'cloak, armor, pose and colours; where the weapon was, only the ground. '
        'Nothing else changes.'),
    # o Ilvan no chao sem o cajado, para a postura de adaga
    'ilvan-queda-sem-cajado': (
        'Remove the wooden staff and any weapon near him. The elf keeps the same '
        'robe, hair, pose and colours; where the staff was, only the ground. '
        'Nothing else changes.'),
    # O KIT DO GRASK: as armas de duas maos por edicao da folha do machado
    # grande; o gibao de peles por edicao de todas.
    'grask-arma-espada-grande': (
        'Replace the greataxe with a greatsword: a long, broad two-handed steel '
        'blade with a cross guard and a leather-wrapped grip, gripped in both hands '
        'the same way, in the same position and pointing the same direction as the '
        'greataxe in every frame.' + _GRASK_MANTEM),
    'grask-arma-malho': (
        'Replace the greataxe with a maul: a long wooden haft with a massive square '
        'iron hammer head, gripped in both hands the same way, in the same position '
        'and pointing the same direction as the greataxe in every frame.'
        + _GRASK_MANTEM),
    'grask-queda-sem-arma': (
        'Remove the greataxe and any weapon near him. The half-orc keeps the same '
        'body, fur mantle, pose and colours; where the weapon was, only the ground. '
        'Nothing else changes.'),
    'grask-armadura-peles': (
        'Dress him in hide armor: a thick vest of stitched brown animal hides and '
        'furs covering his chest and belly, bound with leather straps, hide '
        'shoulder guards over the fur mantle. Keep the weapons he holds exactly as '
        'they are in every frame: same shape, position and colour.' + _GRASK_MANTEM),
    # O KIT DO TORVIK: a base saiu de PLACAS; a cota de malha (a das regras) e
    # as armas de uma mao sao edicoes.
    'torvik-arma-martelo': (
        'Replace the longsword in his right hand with a dwarven warhammer: a wooden '
        'handle about as long as his forearm topped by a heavy square steel hammer '
        'head, held the same way, in the same position and pointing the same '
        'direction as the sword in every frame. Keep the blue shield with the white '
        'hammer on his left arm.' + _TORVIK_MANTEM),
    'torvik-arma-maca': (
        'Replace the longsword in his right hand with a flanged mace: a wooden '
        'handle about as long as his forearm topped by a heavy round steel head with '
        'flanges, held the same way, in the same position and pointing the same '
        'direction as the sword in every frame. Keep the blue shield with the white '
        'hammer on his left arm.' + _TORVIK_MANTEM),
    'torvik-armadura-malha': (
        'Replace his steel plate armor with a steel chain mail hauberk of small '
        'riveted rings with mail sleeves, no pauldrons, no breastplate. Keep the '
        'steel open-faced helm, the royal blue tabard and cape with white trim, and '
        'keep the weapon he holds, and the shield if he has one, exactly as they '
        'are in every frame.' + _TORVIK_MANTEM.replace('the steel plate armor, ', '')),
    'torvik-queda-sem-escudo': (
        'Remove the shield and any weapon near him. The dwarf keeps the same armor, '
        'helm, blue tabard, pose and colours; where the shield was, draw his arm '
        'and his armored body instead. Nothing else changes.'),
    # O BUGBEAR: a leste a clava sumia atras do corpo (parado e andando) e ao
    # norte o quadro da pancada saia sem ela.
    'bugbear-clava': (
        'The bugbear always holds his wooden club studded with iron spikes in his '
        'right hand, and the club is clearly VISIBLE in every frame, never hidden '
        'behind his body: when he stands or walks it is held at his side or '
        'resting on his shoulder in front of the body, and in the striking frame '
        'it is swung down in front of him. Keep everything else exactly the same: '
        'the hunched hairy bugbear with tawny gold fur, the rust-red mane, the '
        'lynx ears, the black leather pauldron, gauntlet, belt and strip kilt, the '
        'pose and position in every frame, the direction each frame faces and the '
        'colours.'),
    # O REI GROL: a leste (parado e andando) o machado sumia, como a clava do
    # bugbear de onde ele veio.
    'grol-machado': (
        'The bugbear king always holds his big iron battleaxe with a wide crescent '
        'blade in his right hand, and the axe is clearly VISIBLE in every frame, '
        'never hidden behind his body: when he stands or walks it is held upright '
        'at his side in front of the body, and in the striking frame it is swung '
        'down in front of him. Keep everything else exactly the same: the hunched '
        'bugbear with near-black fur, the horned iron crown, the black leather '
        'pauldron, gauntlet and belt, the dark red loincloth, the pose and position '
        'in every frame, the direction each frame faces and the colours.'),
    # A DROW: a besta de mao virava um laco retorcido junto a mao (parada e
    # andando) ao sul, sudoeste, oeste, noroeste e norte.
    'drow-besta': (
        'Redraw the small HAND CROSSBOW in her left hand so it is clean and readable in '
        'every frame: a short straight black wooden stock no longer than her forearm, '
        'held level in one hand like a pistol, with a small straight horizontal bow '
        'across its front end and a taut string, pointing forward. Never a loop, never a '
        'curl, never tangled. Keep everything else exactly the same: the female drow with '
        'dark purple-grey skin and white ponytail, the black spiked armor, the shortsword '
        'in the other hand, the pose and position in every frame, the direction each frame '
        'faces and the colours.'),
    # O KIT DO CORIN: as armaduras por edicao de todas as posturas.
    'corin-armadura-couro-batido': (
        'Replace his plain brown leather cuirass with studded leather armor: a '
        'darker brown leather jerkin covered with rows of small round steel '
        'rivets, with studded leather shoulder guards. His legs are always covered '
        'by dark trousers and tall leather boots, never bare skin. Keep the weapons '
        'he holds exactly as they are in every frame: same shape, position and colour.'
        + _CORIN_MANTEM.replace('the brown leather cuirass with the crossed straps, ', '')),
    'corin-armadura-malha': (
        'Replace his brown leather cuirass with a steel chain shirt: a short '
        'hauberk of small riveted steel rings covering his chest and belly down to '
        'the hips, with short mail sleeves, worn under the crossed leather straps. '
        'His legs are always covered by dark trousers and tall leather boots, never bare skin. '
        'Keep the weapons he holds exactly as they are in every frame: same shape, '
        'position and colour.'
        + _CORIN_MANTEM.replace('the brown leather cuirass with the crossed straps, ', '')),
    # no golpe do arco a nordeste o modelo despiu as pernas (e o importador,
    # que centra pela pele, fez a figura pular de lado)
    'corin-calca': (
        'Dress his bare legs: he wears dark grey-brown trousers down to tall brown '
        'leather boots, no bare skin on the legs or thighs. Keep the bow and arrow '
        'exactly as they are in every frame: same shape, position and colour.'
        + _CORIN_MANTEM),
    'corin-queda-sem-arma': (
        'Remove the longsword and any weapon near him. The ranger keeps the same '
        'cloak, armor, pose and colours; where the sword was, only the ground. '
        'Nothing else changes.'),
    'pip-armadura-couro-batido': (
        'Replace his plain brown leather armor with studded leather armor: a '
        'darker brown leather jerkin covered with rows of small round steel '
        'rivets, with studded leather shoulder guards. Keep the weapons he holds '
        'exactly as they are in every frame: same shape, position and colour.'
        + _PIP_MANTEM),
})

# Quadros que o motor usa por direcao, nos grupos da folha do PixelLab: o
# parado (rotacoes), o andar 1-4 e os dois do ataque escolhidos no perfil
# `fighter` de `importar-pixellab.py`.
ATAQUE_DARA = {'south': [2, 5], 'south-east': [3, 5], 'east': [2, 4],
               'north-east': [5, 8], 'north': [4, 2], 'north-west': [3, 6],
               'west': [3, 6], 'south-west': [3, 6]}

# Os mesmos quadros, por postura. Tem de bater com os perfis de
# `importar-pixellab.py`: e so neles que vale gastar a edicao.
ATAQUE_POR_PERFIL = {
    'drowEspada': {'south': [2, 4], 'south-east': [2, 4], 'east': [1, 5], 'north-east': [3, 4],
                   'north': [1, 3], 'north-west': [3, 5], 'west': [5, 6], 'south-west': [4, 6]},
    'zumbi': {'south': [4, 5], 'south-east': [3, 5], 'east': [2, 4], 'north-east': [3, 5],
              'north': [3, 5], 'north-west': [4, 6], 'west': [4, 6], 'south-west': [4, 6]},
    'reiGrol': {'south': [2, 5], 'south-east': [2, 5], 'east': [3, 6], 'north-east': [3, 5],
                'north': [3, 7], 'north-west': [4, 7], 'west': [3, 6], 'south-west': [3, 6]},
    'brughor': {'south': [3, 6], 'south-east': [3, 6], 'east': [3, 5], 'north-east': [4, 6],
                'north': [3, 5], 'north-west': [4, 7], 'west': [4, 7], 'south-west': [5, 8]},
    'fighter': ATAQUE_DARA,
    'fighterSemEscudo': {'south': [2, 5], 'south-east': [2, 5], 'east': [2, 3], 'north-east': [1, 3],
                         'north': [2, 3], 'north-west': [4, 6], 'west': [3, 6], 'south-west': [3, 5]},
    'fighterArco': {'south': [3, 7], 'south-east': [3, 6], 'east': [2, 5], 'north-east': [3, 5],
                    'north': [4, 6], 'north-west': [3, 6], 'west': [3, 6], 'south-west': [3, 6]},
    'fighterBesta': {'south': [3, 6], 'south-east': [3, 5], 'east': [2, 5], 'north-east': [3, 6],
                     'north': [3, 6], 'north-west': [3, 6], 'west': [3, 6], 'south-west': [3, 6]},
    # a espada grande ao sul: o quadro 2 tem o borrao do golpe, o 1 e o erguido limpo
    'fighterEspadaGrande': {'south': [1, 5], 'south-east': [1, 6], 'east': [2, 5], 'north-east': [1, 3],
                            'north': [6, 1], 'north-west': [3, 6], 'west': [1, 7], 'south-west': [1, 6]},
    'fighterDuasMaos': {'south': [2, 5], 'south-east': [1, 6], 'east': [2, 5], 'north-east': [1, 3],
                        'north': [6, 1], 'north-west': [3, 6], 'west': [1, 7], 'south-west': [1, 6]},
    # o Brenn: os mesmos quadros do perfil `cleric` de `importar-pixellab.py`
    'cleric': {'south': [3, 5], 'south-east': [3, 4], 'east': [3, 4], 'north-east': [4, 8], 'north': [3, 1], 'north-west': [4, 8], 'west': [3, 4], 'south-west': [3, 4]},
    'clericBesta': {'south': [3, 4], 'south-east': [3, 5], 'east': [4, 5], 'north-east': [4, 5],
                    'north': [3, 5], 'north-west': [3, 4], 'west': [3, 4], 'south-west': [3, 5]},
    # o Pip: os mesmos quadros dos perfis de `importar-pixellab.py`
    'rogue': {'south': [3, 5], 'south-east': [2, 4], 'east': [2, 4], 'north-east': [3, 5], 'north': [2, 4], 'north-west': [3, 5], 'west': [2, 4], 'south-west': [2, 4]},
    'rogueAdagas': {'south': [3, 7], 'south-east': [4, 7], 'east': [3, 7], 'north-east': [1, 7], 'north': [2, 6], 'north-west': [1, 7], 'west': [3, 7], 'south-west': [4, 7]},
    'rogueArco': {'south': [5, 7], 'south-east': [3, 6], 'east': [3, 5], 'north-east': [2, 6], 'north': [2, 6], 'north-west': [2, 6], 'west': [3, 5], 'south-west': [3, 6]},
    'rogueBestaDeMao': {'south': [4, 5], 'south-east': [3, 4], 'east': [4, 5], 'north-east': [3, 4], 'north': [4, 5], 'north-west': [3, 4], 'west': [4, 5], 'south-west': [3, 4]},
    'wizard': {'south': [2, 4], 'south-east': [2, 4], 'east': [2, 4], 'north-east': [2, 5],
               'north': [1, 4], 'north-west': [3, 5], 'west': [3, 5], 'south-west': [2, 5]},
    # o Grask
    'barbarian': {'south': [3, 6], 'south-east': [4, 6], 'east': [3, 5], 'north-east': [6, 1], 'north': [1, 2], 'north-west': [6, 1], 'west': [3, 5], 'south-west': [4, 6]},
    'barbarianMachadinhas': {'south': [1, 5], 'south-east': [4, 2], 'east': [2, 7], 'north-east': [3, 5], 'north': [4, 6], 'north-west': [3, 5], 'west': [2, 7], 'south-west': [4, 2]},
    'barbarianAzagaia': {'south': [3, 4], 'south-east': [4, 5], 'east': [3, 6], 'north-east': [4, 6], 'north': [2, 6], 'north-west': [4, 6], 'west': [3, 6], 'south-west': [4, 5]},
    # o Torvik
    'paladin': {'south': [3, 6], 'south-east': [3, 6], 'east': [3, 5], 'north-east': [1, 8], 'north': [3, 2], 'north-west': [1, 8], 'west': [3, 5], 'south-west': [3, 6]},
    'paladinEspadaGrande': {'south': [3, 7], 'south-east': [2, 6], 'east': [2, 7], 'north-east': [4, 8], 'north': [5, 8], 'north-west': [4, 8], 'west': [2, 7], 'south-west': [2, 6]},
    'paladinAzagaia': {'south': [3, 5], 'south-east': [3, 5], 'east': [3, 5], 'north-east': [2, 7], 'north': [3, 5], 'north-west': [2, 7], 'west': [3, 5], 'south-west': [3, 5]},
    'paladinBesta': {'south': [3, 6], 'south-east': [3, 5], 'east': [2, 3], 'north-east': [3, 5], 'north': [3, 5], 'north-west': [3, 5], 'west': [2, 3], 'south-west': [3, 5]},
    'paladinArco': {'south': [4, 6], 'south-east': [3, 6], 'east': [4, 6], 'north-east': [1, 8], 'north': [3, 6], 'north-west': [1, 8], 'west': [4, 6], 'south-west': [3, 6]},
    # o bugbear (e o Klarg, recolorido dele)
    'bugbear80': {'south': [3, 6], 'south-east': [2, 5], 'east': [3, 6], 'north-east': [3, 6], 'north': [2, 6], 'north-west': [4, 8], 'west': [4, 7], 'south-west': [3, 6]},
    # as criaturas da mansao (para `limpar-soltos.py`)
    'esqueleto': {'south': [2, 7], 'south-east': [3, 5], 'east': [2, 4], 'north-east': [2, 4], 'north': [3, 6], 'north-west': [3, 5], 'west': [3, 4], 'south-west': [3, 6]},
    'ratoGigante': {'south': [2, 3], 'south-east': [2, 4], 'east': [2, 4], 'north-east': [2, 4], 'north': [3, 6], 'north-west': [2, 4], 'west': [2, 5], 'south-west': [2, 4]},
    # o Corin
    'ranger': {'south': [2, 5], 'south-east': [3, 5], 'east': [2, 4], 'north-east': [5, 2], 'north': [2, 5], 'north-west': [5, 2], 'west': [2, 4], 'south-west': [3, 5]},
    'rangerEspadas': {'south': [2, 4], 'south-east': [2, 5], 'east': [4, 3], 'north-east': [1, 4], 'north': [4, 6], 'north-west': [1, 4], 'west': [4, 3], 'south-west': [2, 5]},
    'rangerArco': {'south': [3, 6], 'south-east': [3, 5], 'east': [3, 5], 'north-east': [3, 6], 'north': [3, 5], 'north-west': [3, 6], 'west': [3, 5], 'south-west': [3, 5]},
}
ATAQUE = ATAQUE_DARA
COM_QUEDA = False


def quadros_da_direcao(meta, dir_):
    """[(fileira, coluna)] dos quadros usados nesta direcao."""
    rot = next(r for r in meta['rows'] if r['type'] == 'rotations')
    grupos = {}
    for r in meta['rows']:
        if r['type'] == 'animation':
            grupos.setdefault(re.sub(r'_\d+$', '', r['animation']), {})[r['direction']] = r
    pos = ([(rot['row'], rot['directions'].index(dir_))] +
           [(grupos['walk'][dir_]['row'], f) for f in (1, 2, 3, 4)] +
           [(grupos['attack-dir'][dir_]['row'], f) for f in ATAQUE[dir_]])
    # O corpo no chao tambem veste a armadura: o quadro da queda vai junto ao
    # sul, onde ele e desenhado (8 quadros, ainda dentro dos 9 do pedido).
    if COM_QUEDA and dir_ == 'south' and 'queda-pix' in grupos:
        q = grupos['queda-pix']['south']
        pos.append((q['row'], q['frame_count'] - 1))
    return pos


def janela(celulas, lado):
    """Uma janela JANELAxJANELA, igual para todas, centrada na uniao."""
    bbs = [c.getbbox() for c in celulas if c.getbbox()]
    u = (min(b[0] for b in bbs), min(b[1] for b in bbs),
         max(b[2] for b in bbs), max(b[3] for b in bbs))
    x = max(0, min(lado - JANELA, (u[0] + u[2]) // 2 - JANELA // 2))
    y = max(0, min(lado - JANELA, (u[1] + u[3]) // 2 - JANELA // 2))
    return (x, y, x + JANELA, y + JANELA), u


def b64(img):
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return base64.b64encode(buf.getvalue()).decode()


def chamar(token, metodo, caminho, corpo=None):
    req = urllib.request.Request(f'{BASE}{caminho}',
                                 data=json.dumps(corpo).encode() if corpo else None,
                                 method=metodo)
    req.add_header('Authorization', f'Bearer {token}')
    if corpo:
        req.add_header('Content-Type', 'application/json')
    for _ in range(80):
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            # Fila cheia (20 trabalhos ao mesmo tempo no Tier 3): espera e
            # tenta de novo. Nao custa nada -- so roda quando entra.
            if e.code == 429:
                time.sleep(45)
                continue
            raise SystemExit(f'HTTP {e.code} em {metodo} {caminho}: '
                             f'{e.read().decode(errors="replace")[:800]}')
    raise SystemExit('a fila nunca abriu')


def imagens_em(obj):
    achadas = []
    if isinstance(obj, dict):
        if isinstance(obj.get('base64'), str):
            achadas.append(obj['base64'])
        for v in obj.values():
            achadas += imagens_em(v)
    elif isinstance(obj, list):
        for v in obj:
            achadas += imagens_em(v)
    return achadas


def main():
    p = argparse.ArgumentParser()
    p.add_argument('edicao', choices=sorted(EDICOES))
    p.add_argument('--fonte', required=True, help='pasta da folha de animacoes do PixelLab')
    p.add_argument('--direcoes', required=True, help='separadas por virgula')
    p.add_argument('--perfil', default='fighter', choices=sorted(ATAQUE_POR_PERFIL))
    p.add_argument('--com-queda', action='store_true', help='o quadro do corpo no chao vai junto ao sul')
    p.add_argument('--janela', help='x,y do canto da janela, no lugar da centrada na uniao '
                   '(para uma arma que passa dos 80 px: mira a janela no quadro que cortou)')
    p.add_argument('--colar', help='indices dos quadros da direcao que voltam para a folha '
                   '(os outros vao so de contexto, cortados pela janela)')
    p.add_argument('--trabalhos', help='direcao=id,... de pedidos ja enviados (o log os imprime): '
                   'busca o resultado sem pagar de novo, se o processo morreu esperando')
    p.add_argument('--saida', help='nome da pasta de saida, ao lado da fonte (padrao: <fonte>-<edicao>); '
                   'para um REMENDO: a fonte mudou (golpe regerado) e a pasta de sempre e uma copia da velha')
    p.add_argument('--go', action='store_true')
    a = p.parse_args()
    global ATAQUE, COM_QUEDA, JANELA
    ATAQUE = ATAQUE_POR_PERFIL[a.perfil]
    COM_QUEDA = a.com_queda

    fonte = RAIZ / a.fonte
    jmeta = next(j for j in fonte.glob('*.json') if j.name not in ('armas.json', 'meta.json'))
    meta = json.loads(jmeta.read_text(encoding='utf-8'))['spritesheet']
    lado = meta['cell_size']['width']
    # celula menor que a janela (o Brenn, de 72): a janela e a celula inteira
    JANELA = min(JANELA, lado)
    folha = Image.open(fonte / meta['path']).convert('RGBA')
    texto = EDICOES[a.edicao]
    if len(texto) > 1000:
        raise SystemExit(f'a frase tem {len(texto)} caracteres, o teto e 1000')

    plano = []
    for d in [x.strip() for x in a.direcoes.split(',') if x.strip()]:
        pos = quadros_da_direcao(meta, d)
        cels = [folha.crop((c * lado, r * lado, (c + 1) * lado, (r + 1) * lado)) for r, c in pos]
        jan, u = janela(cels, lado)
        if a.janela:
            x, y = (int(v) for v in a.janela.split(','))
            jan = (x, y, x + JANELA, y + JANELA)
        fora = (u[0] < jan[0] or u[1] < jan[1] or u[2] > jan[2] or u[3] > jan[3])
        print(f'{d:11} {len(pos)} quadros  janela {jan}  uniao {u}'
              + ('  (passa da janela: o excesso volta do original)' if fora else ''))
        plano.append((d, pos, cels, jan))
    print(f'{len(plano)} pedidos x 10 = {10 * len(plano)} geracoes declaradas')

    token = os.environ.get('PIXELLAB_TOKEN')
    if not token:
        raise SystemExit('defina PIXELLAB_TOKEN no ambiente')
    print(f'saldo: {chamar(token, "GET", "/balance")["subscription"]["generations"]:.0f}')
    if not a.go:
        print('(seco: nada foi enviado. use --go)')
        return

    saida = RAIZ / '_referencias' / 'pixellab' / 'edicoes' / a.edicao / f'{a.perfil}-{fonte.parent.name[:12]}-{fonte.name}'
    saida.mkdir(parents=True, exist_ok=True)
    jobs = []
    ja = dict(t.split('=') for t in a.trabalhos.split(',')) if a.trabalhos else None
    for d, pos, cels, jan in plano:
        if ja is not None:
            jobs.append((d, pos, cels, jan, ja[d]))
            continue
        corpo = {
            'description': texto,
            'image_size': {'width': JANELA, 'height': JANELA},
            'no_background': True,
            'frames': [{'image': {'type': 'base64', 'base64': b64(c.crop(jan)), 'format': 'png'},
                        'size': {'width': JANELA, 'height': JANELA}} for c in cels],
        }
        r = chamar(token, 'POST', '/edit-animation-v2', corpo)
        print(f'{d}: trabalho {r["background_job_id"]}  usage={r.get("usage")}', flush=True)
        jobs.append((d, pos, cels, jan, r['background_job_id']))
        # O id vai para o disco ANTES da espera: se o processo morrer, o
        # resultado (ja pago) volta com `--trabalhos` sem pagar de novo.
        with open(saida / 'trabalhos.txt', 'a', encoding='utf-8') as f:
            f.write(f'{d}={r["background_job_id"]}\n')

    # A copia da folha: os quadros editados por cima, o resto igual.
    destino = fonte.parent / (a.saida or f'{fonte.name}-{a.edicao}')
    if not destino.exists():
        shutil.copytree(fonte, destino)
    nova = Image.open(destino / meta['path']).convert('RGBA')
    colar = {int(v) for v in a.colar.split(',')} if a.colar else None
    inicio = time.time()
    falhas = []
    for d, pos, cels, jan, job in jobs:
        # Uma direcao que falha (o servidor derruba trabalho parado) nao leva
        # as outras junto: a folha sai com as prontas e a falha e repedida so.
        while True:
            try:
                st = chamar(token, 'GET', f'/background-jobs/{job}')
            except SystemExit as e:   # 500 passageiro na consulta
                print(f'{d}: consulta falhou ({e}); tentando de novo', flush=True)
                time.sleep(30)
                continue
            if st.get('status') in ('completed', 'failed') or time.time() - inicio > 5400:
                break
            time.sleep(10)
        if st.get('status') != 'completed':
            print(f'{d} FALHOU ({job}): {json.dumps(st)[:300]}', flush=True)
            falhas.append(d)
            continue
        lr = st.get('last_response') or {}
        imgs = imagens_em(lr.get('quantized_images') or lr.get('images'))
        print(f'{d}: pronto, {len(imgs)} quadros, custo {st.get("usage")}', flush=True)
        tira = Image.new('RGBA', (JANELA * 2 * len(pos), JANELA))
        for i, ((r, c), cel) in enumerate(zip(pos, cels)):
            ed = Image.open(io.BytesIO(base64.b64decode(imgs[i]))).convert('RGBA')
            if colar is None or i in colar:
                nova_cel = cel.copy()
                # Dentro da janela, o editado inteiro (inclusive o transparente,
                # para a cauda sumir); fora dela, o original.
                nova_cel.paste(ed, jan[:2])
                nova.paste(nova_cel, (c * lado, r * lado))
            tira.alpha_composite(cel.crop(jan), (i * 2 * JANELA, 0))
            tira.alpha_composite(ed, ((i * 2 + 1) * JANELA, 0))
        tira.save(saida / f'{d}.png')
    nova.save(destino / meta['path'])
    print(f'folha editada: {destino}' + (f'  FALTAM: {",".join(falhas)}' if falhas else ''))


if __name__ == '__main__':
    main()
