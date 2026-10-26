# -*- coding: utf-8 -*-
"""
Cria personagens no PixelLab a partir do goblin guerreiro.

ISTO GASTA GERACOES DA CONTA. Sem `--go` o script so imprime o que enviaria.

DOIS CAMINHOS, E A ESCOLHA DEPENDE DA POSE.

`create-character-state` EDITA um personagem existente: aplica uma frase as
oito rotacoes dele e salva o resultado como personagem novo, no mesmo grupo.
O corpo, o rosto e a pose sao os do original, e `use_color_palette_from_
reference` prende a paleta a dele. E o caminho para uma VARIANTE -- o mesmo
goblin com outra arma.

`create-character-pro` com `style_character_id` cria um personagem NOVO
usando as oito rotacoes de outro como referencia de estilo. E o caminho para
um INDIVIDUO diferente da mesma familia. Uma edicao de estado nao serviria
ao chefe: o look dele no jogo e definido pela postura OPOSTA a do goblin --
ereto, ombro reto, pes juntos --, e a edicao mantem a pose de quem e editado.

Os ids criados vao para `pixellab-personagens.json`, ao lado deste arquivo:
nao sao segredo, e sem eles nao da para animar depois.
"""
import argparse
import json
import os
import time
import urllib.error
import urllib.request
import zipfile
from pathlib import Path

BASE = 'https://api.pixellab.ai/v2'
AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parents[1]
REGISTRO = AQUI / 'pixellab-personagens.json'

# O goblin guerreiro, que e a referencia de estilo de toda a familia.
GUERREIRO = 'c6b04fab-c949-421e-abc9-467769f6da09'

# O BLOCO DE ESTILO do guerreiro, enxuto.
#
# A descricao tem teto de 2000 caracteres e a do guerreiro ja encostava
# nele. O chefe precisa de espaco para ser descrito, entao o estilo perdeu a
# redundancia e manteve o conteudo: pixel duro, contorno preto de um pixel
# por dentro e por fora, rampas com degrau, luz do alto a esquerda. Saiu o
# "exactly 13 colours" -- o PixelLab o ignorou no guerreiro (75 cores
# medidas) e o chefe tem materiais que o guerreiro nao tem.
ESTILO = (
    'TRUE PIXEL ART: hard square pixels on a visible 1:1 grid, no '
    'anti-aliasing, no blur, no gradients, no soft shading, no '
    'semi-transparent edge pixels. Every pixel is fully opaque or fully '
    'transparent. Flat colour fills with hard-edged tonal steps. A solid pure '
    'black #000000 outline one pixel wide around the entire figure and around '
    'every internal part. Skin ramp: #f8b800 light, #ac7c00 mid, #503000 deep '
    'shadow. Steel ramp: #bcbcbc, #7c7c7c, #4a4a4a. Hair: near-black. Eyes: '
    'burning orange. Light comes from the upper left; every material uses '
    'three hard tonal steps, never a gradient. '
)
FIM = (
    'Full body in frame. BACKGROUND: plain, empty. No ground, no shadow, no '
    'scenery, no text. NEGATIVE: anti-aliasing, blur, gradients, painted '
    'rendering, 3D render, multiple characters.'
)

PERSONAGENS = {
    # Mesmo goblin, outra arma. Sem o escudo -- a maior mancha da silhueta
    # do guerreiro --, com o arco e as pontas da aljava acima do ombro, o
    # contorno ja se separa sozinho.
    'goblinArqueiro': {
        'rota': '/create-character-state',
        'corpo': {
            'character_id': GUERREIRO,
            'state_name': 'goblin arqueiro',
            'edit_description': (
                'Replace the round wooden shield and the iron scimitar with a '
                'short recurve bow of dark wood held low in the left hand, with '
                'an arrow nocked and pointed at the ground. Add a brown leather '
                'quiver of black-fletched arrows slung across the back, the '
                'arrow tips showing above the right shoulder. Keep the face, '
                'hair, horn, ears, skin, pauldron, loincloth, leg wraps, pose '
                'and colours exactly the same.'
            ),
            'use_color_palette_from_reference': True,
            # O arco pode passar do quadro de 48 do guerreiro.
            'override_frame_size': {'width': 56, 'height': 56},
        },
    },
    # Individuo novo da mesma familia. Pele mostarda e nao o verde do look
    # procedural: o goblin saiu do verde por ser a cor do piso de pedra, e o
    # motivo vale igual para o chefe. Cimitarra e camisao de malha porque e o
    # que o bloco de regras diz; as azagaias tambem estao no bloco, e dao a
    # terceira quebra de contorno no alto.
    'goblinBoss': {
        'rota': '/create-character-pro',
        'corpo': {
            'method': 'create_with_style',
            'style_character_id': GUERREIRO,
            'template_id': 'mannequin',
            'view': 'low top-down',
            'image_size': {'width': 56, 'height': 56},
            'description': (
                'A pixel art game sprite of a goblin chief. ' + ESTILO +
                'Cloth: dark red #8a2f2f with #4a1818 shadow, gold trim '
                '#e0b84a. THE GOBLIN CHIEF: a goblin, but standing upright with '
                'a straight back and squared shoulders, feet close together - a '
                'military bearing, the opposite of a hunched goblin. Slightly '
                'taller and broader than a common goblin. Mustard-yellow ochre '
                'skin. Very large pointed ears swept back, heavy brow, two short '
                'tusks jutting up from the lower jaw, three red war-paint '
                'stripes across the face. A riveted iron helmet with a tall '
                'crest blade rising above the head. A chain shirt over a dark '
                'red tunic with gold trim. A dark red cloak hanging from one '
                'shoulder only, falling down the left side. WEAPONS: an iron '
                'scimitar in the right hand, a round iron-rimmed shield on the '
                'left arm, and two javelins strapped across the back with their '
                'points above the shoulder. POSE: facing the viewer, weapon '
                'held low and out from the body so the silhouette is broken and '
                'readable. ' + FIM
            ),
        },
    },
}

# PALETAS DAS EDICOES DE REVISAO, medidas nas rotacoes paradas.
#
# A edicao de estado pode travar a paleta na do personagem de origem
# (`use_color_palette_from_reference`). Para o arqueiro isso basta: a paleta
# dele ja tem os creme claros (#dcd5c6, #f7efdb) que fazem um arco de madeira
# descorada. Para o chefe NAO basta: o rosto dele nao tem um ponto que brilhe
# porque a paleta nao tem o laranja vivo do olho do guerreiro (#d24414 e
# #e47624). Travar na paleta de origem impediria o olho de existir. Entao o
# chefe recebe a propria paleta MAIS essas duas cores, e nada alem.
PALETA_ARQUEIRO = [
        '#000000', '#030205', '#060508', '#11111a', '#231611', '#23242f', '#2d2e39',
        '#33353d', '#3c2b19', '#412628', '#464b54', '#4a371e', '#542d1f', '#555a62',
        '#5a4521', '#643821', '#674f21', '#6e5944', '#707884', '#764827', '#765e4f',
        '#7f6524', '#818d9f', '#83432f', '#84663e', '#8f9dae', '#908671', '#957b29',
        '#a4872a', '#b3932d', '#b44618', '#bbc7d4', '#c2b9a5', '#d7b541', '#dcd5c6',
        '#e47624', '#e6c34d', '#eece5c', '#f7efdb', '#f7fbfd',
    ]
PALETA_CHEFE_COM_OLHOS = [
        '#000000', '#010100', '#010102', '#030000', '#0c0908', '#272125', '#2b1615',
        '#2d2c32', '#35373e', '#3b2622', '#40181b', '#41454b', '#492f24', '#4a515b',
        '#4e3b2a', '#596069', '#613d29', '#616b73', '#642626', '#6b522c', '#6d7881',
        '#7b4226', '#7c5e2c', '#7c8590', '#86682c', '#8a2612', '#8a949e', '#97a1ac',
        '#a16733', '#a28434', '#adb3b6', '#b6903f', '#bbc4ce', '#cca52e', '#d9b551',
        '#e2e7ea', '#f4ebb4', '#d24414', '#e47624',
    ]

# EDICOES DE REVISAO.
#
# Quatro especialistas revisaram os tres goblins, cada um com um verificador
# que tentava refutar os achados olhando as imagens. Destes dois o que
# sobreviveu foi pouco e pequeno, e e so isso que as edicoes mudam:
# - arqueiro: o arco e marrom-escuro sobre o piso (contraste 1,0 a 1,8:1) e
#   quase some na escala real, e por dentro ele tem as cores do guerreiro --
#   o aco brilhante da ombreira e o mesmo nos dois. A regra pede couro.
# - chefe: o rosto vira uma mancha alaranjada sem um ponto que brilhe.
# Ficou de fora a cimitarra embainhada do arqueiro: a familia divide o
# equipamento da ficha entre as variantes, e o guerreiro tambem nao carrega
# o arco.
#
# A edicao cria personagem NOVO; o original continua. Se sair pior, fica-se
# com o que ja existe.
PERSONAGENS['goblinArqueiro2'] = {
    'rota': '/create-character-state',
    'corpo': {
        'character_id': 'a42df5a0-a11f-4084-8d1c-af3fc5093d23',
        'state_name': 'goblin arqueiro 2',
        'edit_description': (
            'Make the bow pale bleached wood with a light cream bowstring so it '
            'stands out clearly, and replace the steel shoulder pauldron with a '
            'brown leather shoulder guard. Keep everything else exactly the '
            'same: face, hair, horn, ears, skin, quiver, arrow, loincloth, leg '
            'wraps, pose and colours.'
        ),
        'target_palette': {'colors': PALETA_ARQUEIRO},
        'override_frame_size': {'width': 56, 'height': 56},
    },
}
PERSONAGENS['goblinBoss2'] = {
    'rota': '/create-character-state',
    'corpo': {
        'character_id': '9b23d123-98d9-4c46-b0bb-21324dc17a66',
        'state_name': 'goblin chefe 2',
        'edit_description': (
            'Add two small glowing bright orange eyes, clearly visible under the '
            'helmet brim. Keep everything else exactly the same: helmet, crest, '
            'war paint, tusks, chain shirt, red tunic, cloak, shield, scimitar, '
            'javelins, pose and colours.'
        ),
        'target_palette': {'colors': PALETA_CHEFE_COM_OLHOS},
        'override_frame_size': {'width': 56, 'height': 56},
    },
}

# OS HEROIS.
#
# A rota e a `create-character-v3` em modo "do zero": o Pixen desenha a vista
# sul a partir da descricao e o v3 gira para as oito direcoes. E a MESMA rota
# que criou o goblin guerreiro (o meta dele diz `generation_mode: pixen_v3`),
# e o unico caminho que ja mostrou controlar a altura: quadro de 48, figura de
# 46. A rota pro com `style_character_id` prende a altura a da referencia --
# o chefe goblin foi pedido num quadro de 56 e saiu com 47 --, o que para um
# heroi de 65 px seria o defeito inteiro.
#
# O quadro sai da tabela de alturas do elenco (memoria do projeto): figura
# alvo / 0,95, a razao medida no guerreiro.
#
# O bloco de estilo e o dos goblins sem a rampa de pele mostarda, que era so
# deles. Cada heroi acrescenta os proprios materiais.
ESTILO_HEROI = (
    'TRUE PIXEL ART: hard square pixels on a visible 1:1 grid, no '
    'anti-aliasing, no blur, no gradients, no soft shading, no '
    'semi-transparent edge pixels. Every pixel is fully opaque or fully '
    'transparent. Flat colour fills with hard-edged tonal steps. A solid pure '
    'black #000000 outline one pixel wide around the entire figure and around '
    'every internal part. Light comes from the upper left; every material uses '
    'three hard tonal steps, never a gradient. '
)

# Dara, guerreira draconata vermelha. Alvo: 65 px de figura.
# Sem cauda e sem asas, como o draconato do Livro do Jogador -- e repetido na
# lista negativa, porque gerador costuma acrescentar os dois. Escudo de aco em
# brasao, nao redondo: os goblins tem escudo redondo de madeira, e o formato
# separa aliado de inimigo de longe. Sobreveste creme: clara sobre o piso
# azul-acinzentado e em contraste com as escamas vermelhas.
PERSONAGENS['fighter'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Dara, guerreira draconata',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 68, 'height': 68},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a female dragonborn fighter. ' + ESTILO_HEROI +
            'Scale ramp: #e0503a light, #a82a24 mid, #5a1418 deep shadow. Steel '
            'ramp: #d8dde3, #9aa3ad, #4e5660. Leather: warm brown. Tabard: cream '
            'white with a red trim. Eyes: amber gold. THE DRAGONBORN: a tall, '
            'powerfully built humanoid dragon, a head taller than a human, broad '
            'shoulders, no tail, no wings. Red scales cover the whole body. A '
            'draconic head with a short snout, a slender jaw, amber eyes and two '
            'long horns swept back behind the head, with a fringe of small spines '
            'down the back of the neck. Clawed hands. ARMOR: a full chain mail '
            'coat down to the knees, a cream-white tabard with a red trim over '
            'it, a leather belt, steel gauntlets and leather boots. WEAPONS: a '
            'steel longsword in the right hand and a steel heater shield with a '
            'red dragon emblem on the left arm. POSE: standing in a ready stance '
            'facing the viewer, feet apart, sword held low and out from the body, '
            'shield forward, so the silhouette is broken and readable. Full body '
            'in frame. BACKGROUND: plain, empty. No ground, no shadow, no scenery, '
            'no text. NEGATIVE: anti-aliasing, blur, gradients, painted '
            'rendering, 3D render, multiple characters, tail, wings.'
        ),
    },
}

# Dara de COTA DE MALHA, o visual principal: e a armadura inicial do guerreiro
# no Livro do Jogador e a que ela tem nas regras. O desenho nao e gerado de
# novo: as oito vistas sao as da edicao `dara-malha` (editar-pixellab.py),
# aprovadas na previa. A v3 em modo referencia usa a vista sul como
# referencia e as outras sete "exatamente como desenhadas", e so registra o
# conjunto como personagem -- que e o que falta para poder anima-lo.
PERSONAGENS['fighterMalha'] = {
    'rota': '/create-character-v3',
    'tira': '_referencias/pixellab/edicoes/dara-malha/tira-quantized_images.png',
    'corpo': {
        'name': 'Dara, guerreira draconata (malha)',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'n_directions': 8,
        'description': (
            'A pixel art game sprite of a female dragonborn fighter with red '
            'scales, two long horns swept back and amber eyes, no tail, no '
            'wings. She wears a full chain mail hauberk of small steel rings '
            'with long mail sleeves, a cream-white tabard with a red trim, a '
            'leather belt and cream trouser flaps. A steel longsword in the '
            'right hand and a steel heater shield with a red dragon emblem on '
            'the left arm.'
        ),
    },
}

# AS POSTURAS DE ARMA DA DARA, registradas do mesmo jeito: cada uma e a tira
# da sua edicao (`editar-pixellab.py dara-<postura>`). A arma de cada uma e
# verde puro de proposito -- e o marcador que o importador apaga depois de
# medir a mao. Ver `editar-pixellab.py`.
_DARA_BASE = ('A pixel art game sprite of a female red dragonborn fighter with '
              'two long horns swept back and amber eyes, no tail, no wings, in a '
              'full chain mail hauberk, a cream-white tabard with a red trim, a '
              'leather belt and cream trouser flaps. ')
for _chave, _edicao, _maos in (
        ('fighterSemEscudo', 'dara-sem-escudo',
         'A steel longsword in her right hand, the left hand empty, no shield.'),
        ('fighterArco', 'dara-arco',
         'A bright pure green longbow in her left hand, no shield.'),
        ('fighterBesta', 'dara-besta',
         'A bright pure green heavy crossbow held in both hands, no shield.'),
        ('fighterDuasMaos', 'dara-duas-maos',
         'A bright pure green greatsword held in both hands, no shield.')):
    PERSONAGENS[_chave] = {
        'rota': '/create-character-v3',
        'tira': f'_referencias/pixellab/edicoes/{_edicao}/tira.png',
        'corpo': {
            'name': f'Dara ({_edicao[5:]})',
            'template_id': 'mannequin',
            'view': 'low top-down',
            'n_directions': 8,
            'description': _DARA_BASE + _maos,
        },
    }

# Brenn, clerigo anao da colina (Dominio da Vida). Alvo: 50 px de figura,
# quadro 52 (multiplo de 4, exigencia da rota; a razao do guerreiro daria 53). O kit inicial dele pelo Livro do Jogador
# e o padrao da criacao: brunea, maca, escudo, besta leve. O resto do kit
# (martelo de guerra, malha, besta) sai por edicao, como na Dara.
# O retrato pintado (`src/art/retratos/cleric.webp`) manda nas cores: barba
# trancada cinza-castanha, sobreveste cinza-parda com barra dourada, o sol
# dourado no peito. O escudo e de aco com o sol, nao redondo de madeira (o
# dos goblins) nem o brasao do dragao (o da Dara). Cabeca descoberta: o
# capacete e do Torvik, o outro anao, e e o que separa os dois de longe.
PERSONAGENS['cleric'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Brenn, clerigo anao',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 52, 'height': 52},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a male hill dwarf cleric. ' + ESTILO_HEROI +
            'Skin ramp: #f0b890 light, #c98a64 mid, #7a4a34 deep shadow. Steel '
            'ramp: #d8dde3, #9aa3ad, #4e5660. Beard and hair: grey-brown, '
            '#b8a888 light, #8a7a5a mid, #4e4432 deep. Tabard: grey-tan #a89c80 '
            'with a gold #e0c24a trim. Leather: warm brown. Eyes: blue-grey. '
            'THE DWARF: short and very stout, as wide as he is tall at the '
            'shoulders, thick arms, short sturdy legs, a big head with a broad '
            'ruddy face, a big nose, bushy eyebrows, short grey-brown hair and '
            'a long thick braided grey-brown beard down to his belt, tied with '
            'gold rings. Bare head, no helmet. ARMOR: scale mail of overlapping '
            'steel scales covering the torso and the upper arms, a grey-tan '
            'tabard with a gold trim over it, a wide leather belt, a gold sun '
            'holy symbol on a chain on his chest, leather gloves and heavy '
            'leather boots. WEAPONS: a steel flanged mace in the right hand and '
            'a steel heater shield with a golden sun emblem on the left arm. '
            'POSE: standing in a ready stance facing the viewer, feet apart, '
            'mace held low and out from the body, shield forward, so the '
            'silhouette is broken and readable. Full body in frame. BACKGROUND: '
            'plain, empty. No ground, no shadow, no scenery, no text. NEGATIVE: '
            'anti-aliasing, blur, gradients, painted rendering, 3D render, '
            'multiple characters, helmet, tall slender body.'
        ),
    },
}

# A POSTURA DE BESTA DO BRENN, registrada da tira da edicao `brenn-besta`
# (arma ja desenhada, madeira e aco -- nada de verde).
PERSONAGENS['clericBesta'] = {
    'rota': '/create-character-v3',
    'tira': '_referencias/pixellab/edicoes/brenn-besta/tira.png',
    'corpo': {
        'name': 'Brenn (besta)',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'n_directions': 8,
        'description': (
            'A pixel art game sprite of a short, very stout male hill dwarf '
            'cleric with a long grey-brown beard and a bare head, in steel scale '
            'mail and a grey tabard with gold trim, holding a light crossbow of '
            'dark wood and steel in both hands, no shield.'),
    },
}

# Pip, ladino halfling. Alvo: 42 px de figura, quadro 44 (multiplo de 4).
# O kit inicial pelo Livro do Jogador e o da criacao: espada curta, arco curto,
# couro. A CAPA DE CAPUZ LEVANTADO e escolha do dono: e a cara do ladino. O
# verde-escuro da capa e o do retrato (`src/art/retratos/rogue.webp`).
PERSONAGENS['rogue'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Pip, ladino halfling',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 44, 'height': 44},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a male halfling rogue. ' + ESTILO_HEROI +
            'Skin ramp: #f6d0a8 light, #d9a07a mid, #8a5a40 deep shadow. Cloak: '
            'dark forest green, #3f5a3a light, #2b3d28 mid, #18241a deep. Leather: '
            'brown, #8a6440 light, #5e4430 mid, #33241a deep. Steel ramp: #d8dde3, '
            '#9aa3ad, #4e5660. Eyes: green. THE HALFLING: very small and slim, '
            'about half the height of a human, with adult proportions, a youthful '
            'cheeky face with a sly grin, small pointed ears. CLOTHES: a dark '
            'green hooded cloak with the HOOD UP over his head, the face visible '
            'under it, the cloak reaching his knees; under it a fitted brown '
            'leather armor jerkin, a belt with pouches and a sheathed dagger, '
            'dark trousers and soft leather boots. WEAPON: a steel shortsword in '
            'the right hand, the left hand empty and open. No shield. POSE: '
            'standing in a low ready crouch facing the viewer, feet apart, sword '
            'held low and forward, so the silhouette is broken and readable. Full '
            'body in frame. BACKGROUND: plain, empty. No ground, no shadow, no '
            'scenery, no text. NEGATIVE: anti-aliasing, blur, gradients, painted '
            'rendering, 3D render, multiple characters, shield, hood down.'
        ),
    },
}

# AS POSTURAS DO PIP, registradas das tiras das edicoes `pip-*`.
_PIP = ('A pixel art game sprite of a small male halfling rogue with a dark '
        'green hooded cloak with the hood up and brown leather armor, ')
for _chave, _edicao, _maos in (
        ('rogueAdagas', 'pip-duas-adagas', 'a steel dagger in each hand.'),
        ('rogueArco', 'pip-arco', 'a short bow of curved brown wood in his left hand.'),
        ('rogueBestaDeMao', 'pip-besta-de-mao', 'a hand crossbow of dark wood and steel in his right hand.')):
    PERSONAGENS[_chave] = {
        'rota': '/create-character-v3',
        'tira': f'_referencias/pixellab/edicoes/{_edicao}/tira.png',
        'corpo': {
            'name': f'Pip ({_edicao[4:]})',
            'template_id': 'mannequin',
            'view': 'low top-down',
            'n_directions': 8,
            'description': _PIP + _maos,
        },
    }

# Ilvan, mago alto elfo. Alvo: 60 px de figura, quadro 64. Sem armadura (o
# mago nao tem treino); o bordao e a arma e o foco arcano do kit inicial. As
# cores sao as do retrato (`src/art/retratos/wizard.webp`): cabelo
# branco-prateado comprido, manto indigo com bordado violeta.
PERSONAGENS['wizard'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Ilvan, mago alto elfo',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 64, 'height': 64},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a male high elf wizard. ' + ESTILO_HEROI +
            'Skin ramp: #f6dcc4 light, #dcb496 mid, #9a7058 deep shadow. Robe: '
            'deep indigo, #4a50a0 light, #343a7a mid, #1e2250 deep. Embroidery '
            'and trim: light violet #a8a0e8. Hair: silver white, #f0f2f6 light, '
            '#c8ced8 mid, #8a92a0 deep. Wood: warm brown. Eyes: pale blue. THE '
            'ELF: tall and slender, graceful, a narrow ageless face with high '
            'cheekbones, long pointed ears and long straight silver-white hair '
            'falling past his shoulders. CLOTHES: a long deep indigo wizard robe '
            'down to his feet with wide sleeves, a high collar and light violet '
            'embroidered trim, a dark leather belt with a small spellbook '
            'pouch, soft boots. No armor, no hat. WEAPON: a tall wooden '
            'quarterstaff, a little taller than he is, held upright in his '
            'right hand, a small pale blue crystal set in its top. POSE: standing '
            'calm and upright facing the viewer, the staff planted beside him, '
            'the left hand raised slightly with open fingers, so the silhouette '
            'is broken and readable. Full body in frame. BACKGROUND: plain, '
            'empty. No ground, no shadow, no scenery, no text. NEGATIVE: '
            'anti-aliasing, blur, gradients, painted rendering, 3D render, '
            'multiple characters, hat, armor, beard.'
        ),
    },
}

# A POSTURA DE ADAGA DO ILVAN, registrada da tira da edicao `ilvan-adaga`.
PERSONAGENS['wizardAdaga'] = {
    'rota': '/create-character-v3',
    'tira': '_referencias/pixellab/edicoes/ilvan-adaga/tira.png',
    'corpo': {
        'name': 'Ilvan (adaga)',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'n_directions': 8,
        'description': (
            'A pixel art game sprite of a tall slender male high elf wizard with '
            'long silver-white hair and pointed ears, in a long deep indigo robe '
            'with light violet trim, a steel dagger in his right hand.'),
    },
}

# Grask, barbaro meio-orc. Alvo: 62 px de figura, quadro 64. Sem armadura
# (a Defesa sem Armadura): peito nu, manto de pele nos ombros. Cores do
# retrato (`src/art/retratos/barbarian.webp`): pele cinza-esverdeada, cabelo
# preto comprido, olhos ambar, cicatriz no olho, faixa de pintura vermelha.
PERSONAGENS['barbarian'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Grask, barbaro meio-orc',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 64, 'height': 64},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a male half-orc barbarian. ' + ESTILO_HEROI +
            'Skin ramp: grey-green, #9aae86 light, #74886a mid, #44523e deep '
            'shadow. Hair: black. Fur: warm brown, #8a6a48 light, #5e4630 mid, '
            '#36281c deep. Leather: dark brown. Steel ramp: #d8dde3, #9aa3ad, '
            '#4e5660. War paint: red #c0392b. Eyes: amber. THE HALF-ORC: tall, '
            'massive and muscular, broad shoulders, a heavy jaw with two small '
            'tusks, a scar across one eye, long black hair tied back, a stripe of '
            'red war paint across his face. CLOTHES: bare muscular chest and arms, '
            'a thick brown fur mantle over his shoulders, leather bracers, a wide '
            'leather belt, a fur-trimmed leather kilt, wrapped legs and fur '
            'boots. No armor, no helmet. WEAPON: a huge steel greataxe with a '
            'wooden haft held in both hands across his body. POSE: standing in a '
            'wide aggressive ready stance facing the viewer, feet apart, the '
            'greataxe held diagonally, so the silhouette is broken and readable. '
            'Full body in frame. BACKGROUND: plain, empty. No ground, no shadow, '
            'no scenery, no text. NEGATIVE: anti-aliasing, blur, gradients, '
            'painted rendering, 3D render, multiple characters, armor, helmet, '
            'shield.'
        ),
    },
}

# AS POSTURAS DO GRASK, registradas das tiras das edicoes `grask-*`.
_GRASK = ('A pixel art game sprite of a huge muscular male half-orc barbarian '
          'with grey-green skin, tusks, long black hair, red war paint, a bare '
          'chest and a brown fur mantle, ')
for _chave, _edicao, _maos in (
        ('barbarianMachadinhas', 'grask-machadinhas', 'a steel handaxe in each hand.'),
        ('barbarianAzagaia', 'grask-azagaia', 'a wooden javelin raised in his right hand.')):
    PERSONAGENS[_chave] = {
        'rota': '/create-character-v3',
        'tira': f'_referencias/pixellab/edicoes/{_edicao}/tira.png',
        'corpo': {
            'name': f'Grask ({_edicao[6:]})',
            'template_id': 'mannequin',
            'view': 'low top-down',
            'n_directions': 8,
            'description': _GRASK + _maos,
        },
    }

# Torvik, paladino anao da montanha. Alvo: 53 px de figura, quadro 56. O kit
# inicial do Livro do Jogador: cota de malha, arma marcial e escudo. Capacete
# SEMPRE, liso de aco, e sobreveste AZUL com barra branca: e o que o separa do
# Brenn (cabeca descoberta, sobreveste cinza e ouro, sol no escudo).
PERSONAGENS['paladin'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Torvik, paladino anao',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 56, 'height': 56},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a male mountain dwarf paladin. ' + ESTILO_HEROI +
            'Skin ramp: #eab08a light, #c08060 mid, #7a4a34 deep shadow. Steel '
            'ramp: #d8dde3, #9aa3ad, #4e5660. Tabard: royal blue, #4a6cb8 light, '
            '#2e4a8a mid, #1c2c58 deep, with a white trim. Beard: dark brown. '
            'Leather: dark brown. Eyes: grey-blue. THE DWARF: short and very '
            'stout and broad-shouldered, thick arms, short sturdy legs, a stern '
            'face with a short thick dark brown beard. ARMOR: a steel chain mail '
            'hauberk with mail sleeves, a royal blue tabard with a white trim and a '
            'small white hammer emblem on the chest, a steel open-faced helm with '
            'a nose guard always on his head, steel gauntlets, a leather belt and '
            'heavy boots. WEAPONS: a steel longsword in the right hand and a steel '
            'heater shield painted royal blue with a white hammer emblem on the '
            'left arm. POSE: standing in a ready stance facing the viewer, feet '
            'apart, sword held low and out from the body, shield forward, so the '
            'silhouette is broken and readable. Full body in frame. BACKGROUND: '
            'plain, empty. No ground, no shadow, no scenery, no text. NEGATIVE: '
            'anti-aliasing, blur, gradients, painted rendering, 3D render, '
            'multiple characters, bare head, gold, long braided beard.'
        ),
    },
}

# AS POSTURAS DO TORVIK, registradas das tiras das edicoes `torvik-*`.
_TORVIK = ('A pixel art game sprite of a short stout male dwarf paladin with a '
           'dark brown beard, a steel open-faced helm, steel plate armor and a '
           'royal blue tabard and cape with white trim, ')
for _chave, _edicao, _maos in (
        ('paladinEspadaGrande', 'torvik-espada-grande', 'a steel greatsword held in both hands.'),
        ('paladinAzagaia', 'torvik-azagaia', 'a wooden javelin raised in his right hand.'),
        ('paladinBesta', 'torvik-besta', 'a heavy crossbow of dark wood and steel held in both hands.'),
        ('paladinArco', 'torvik-arco', 'a longbow of brown wood in his left hand.')):
    PERSONAGENS[_chave] = {
        'rota': '/create-character-v3',
        'tira': f'_referencias/pixellab/edicoes/{_edicao}/tira.png',
        'corpo': {
            'name': f'Torvik ({_edicao[7:]})',
            'template_id': 'mannequin',
            'view': 'low top-down',
            'n_directions': 8,
            'description': _TORVIK + _maos,
        },
    }

# Corin, patrulheiro humano. Alvo: 61 px de figura, quadro 64. Kit decidido
# com o dono: espada longa, duas espadas curtas e arco longo; couro (a base),
# couro batido e camisao de malha. Cores do retrato (`src/art/retratos/
# ranger.webp`): cabelo castanho curto, barba curta, capa verde-musgo de capuz
# ABAIXADO, couro marrom com correias cruzadas no peito. O capuz abaixado e o
# porte alto o separam do Pip (capa verde de capuz levantado, halfling).
PERSONAGENS['ranger'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Corin, patrulheiro humano',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 64, 'height': 64},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a male human ranger. ' + ESTILO_HEROI +
            'Skin ramp: #e2b08c light, #c08866 mid, #7e5440 deep shadow. Hair '
            'and beard: brown, #7a5a3c light, #5a4028 mid, #36261a deep. Cloak: '
            'moss green, #5e6e48 light, #44523a mid, #2a3424 deep. Leather: '
            'brown, #8a6444 light, #624630 mid, #3a2a1e deep. Steel ramp: '
            '#d8dde3, #9aa3ad, #4e5660. Eyes: grey-green. THE HUMAN: a lean, '
            'athletic man of average height, a weathered face, short tousled '
            'brown hair and a short brown beard. ARMOR: a fitted brown leather '
            'cuirass with leather shoulder guards and leather bracers, two '
            'leather straps crossing his chest, a belt with pouches, dark '
            'trousers and tall leather boots. A long moss green cloak over his '
            'shoulders, the HOOD DOWN on his back, his head bare. A leather '
            'quiver of arrows on his back. WEAPON: a steel longsword in his '
            'right hand. POSE: standing in a ready stance facing the viewer, '
            'feet apart, the longsword held low and out from the body, the left '
            'hand free and slightly forward, so the silhouette is broken and '
            'readable. Full body in frame. BACKGROUND: plain, empty. No ground, '
            'no shadow, no scenery, no text. NEGATIVE: anti-aliasing, blur, '
            'gradients, painted rendering, 3D render, multiple characters, hood '
            'up, helmet, shield, metal armor.'
        ),
    },
}

# AS POSTURAS DO CORIN, registradas das tiras das edicoes `corin-*`.
_CORIN = ('A pixel art game sprite of a lean male human ranger with short brown '
          'hair and a short beard, a brown leather cuirass and a moss green cloak '
          'with the hood down, ')
for _chave, _edicao, _maos in (
        ('rangerEspadas', 'corin-espadas', 'a steel shortsword in each hand.'),
        ('rangerArco', 'corin-arco', 'a longbow of brown wood in his left hand.')):
    PERSONAGENS[_chave] = {
        'rota': '/create-character-v3',
        'tira': f'_referencias/pixellab/edicoes/{_edicao}/tira.png',
        'corpo': {
            'name': f'Corin ({_edicao[6:]})',
            'template_id': 'mannequin',
            'view': 'low top-down',
            'n_directions': 8,
            'description': _CORIN + _maos,
        },
    }

# O LOBO (capitulo 2: o canil dos goblins e o Ripper do Klarg). Medio, um
# quadro de 48: no de 64 ele saiu com 57 px, a altura de um humano. Um
# quadrupede: o esqueleto `dog` do PixelLab, que a rota tem desde a v3. Cores do
# look procedural `wolf` (`src/art/looks/feras.js`): cinza de pelo, olho ambar.
PERSONAGENS['lobo'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Lobo cinzento',
        'template_id': 'dog',
        'view': 'low top-down',
        'image_size': {'width': 48, 'height': 48},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a wild grey wolf, a lean hunting beast. '
            + ESTILO_HEROI +
            'Fur ramp: grey, #a4a4ae light, #7a7a84 mid, #454550 deep shadow, '
            'with a paler #c8c4bc throat and belly and a darker #2e2e38 saddle '
            'along the back. Nose and lips: near black. Eyes: amber #ffd24a. '
            'THE WOLF: a big lean grey wolf standing on all four legs in a '
            'tense hunting stance, head low and forward, ears up, long muzzle '
            'with the lips pulled back showing white fangs, thick shaggy neck '
            'ruff, long legs, bushy tail held low. Side-on three-quarter body, '
            'the whole animal readable. No collar, no saddle, no rider. Full '
            'body in frame. BACKGROUND: plain, empty. No ground, no shadow, no '
            'scenery, no text. NEGATIVE: anti-aliasing, blur, gradients, '
            'painted rendering, 3D render, multiple animals, dog collar, cute '
            'puppy.'
        ),
    },
}

# O LOBO ATROZ (a matilha do capitulo 4, a Conjuracao de Animais). Grande:
# quadro de 72, cerca de 1,5 vez o lobo de 48. Cores do look `direWolf`
# (`src/art/looks/feras.js`): quase preto azulado, valor baixo, e o olho CLARO
# e frio no lugar do ambar do lobo comum -- le como "nao e o lobo de antes".
PERSONAGENS['loboAtroz'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Lobo atroz',
        'template_id': 'dog',
        'view': 'low top-down',
        'image_size': {'width': 72, 'height': 72},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a dire wolf, a huge primeval wolf as big '
            'as a horse. ' + ESTILO_HEROI +
            'Fur ramp: near-black blue-grey, #5a6270 light, #3e4452 mid, #23272f '
            'deep shadow, with a slightly paler #6a7282 throat and a black '
            '#1a1d24 saddle along the back. Nose and lips: black. Eyes: pale icy '
            'white-blue #e8f0ff. THE DIRE WOLF: massive and heavily muscled, a '
            'broad deep chest, a huge head with a heavy jaw, the lips pulled back '
            'over long white fangs, a thick shaggy mane of bristling fur over the '
            'neck and shoulders, ragged fur at the edges, powerful long legs with '
            'big paws, a bushy tail held low. Standing on all four legs in a '
            'menacing stalking stance, head low and forward, ears flat back. '
            'Side-on three-quarter body, the whole animal readable. No collar, '
            'no saddle, no rider. Full body in frame. BACKGROUND: plain, empty. '
            'No ground, no shadow, no scenery, no text. NEGATIVE: anti-aliasing, '
            'blur, gradients, painted rendering, 3D render, multiple animals, '
            'dog collar, cute puppy, grey wolf, amber eyes.'
        ),
    },
}

# O lobo atroz que se anima: as vistas no lugar e o pelo quase preto
# (`src/dev/atroz-tira.py`, sem geracao).
PERSONAGENS['loboAtrozDirecoes'] = {
    'rota': '/create-character-v3',
    'tira': '_referencias/pixellab/edicoes/lobo-atroz-direcoes/tira.png',
    'corpo': {
        'name': 'Lobo atroz (direcoes)',
        'template_id': 'dog',
        'view': 'low top-down',
        'n_directions': 8,
        'description': ('A pixel art game sprite of a huge dire wolf with near-black blue-grey '
                        'fur, a bristling mane and pale icy eyes.'),
    },
}

# O ORC (capitulo 4: o Cume da Wyvern e a estrada). Medio, quadro de 72 com
# folga para o machado grande erguido. Cores do look `orc`
# O DONO MANDOU O MODELO OFICIAL (descrito aqui em texto; arte oficial nao vai
# para o gerador): pele CINZA, cabelo curto escuro no alto, manto de pele
# fulva, ombreira de presas no ombro esquerdo, tunica de couro, faixa
# vermelho-escura, avental com borda de pele. A primeira leva (verde, de
# trancas, `orc-a6bda240`) foi descartada. O Brughor, o chefe deles, e uma
# edicao deste corpo (`editar-pixellab.py brughor`).
PERSONAGENS['orc'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Orc',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 72, 'height': 72},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of an orc warrior. ' + ESTILO_HEROI +
            'Skin ramp: ash GREY, #b4b6b8 light, #8e9094 mid, #5a5c62 deep. '
            'Hair: dark brown #2e2620. Fur: tawny yellow-brown, #c8a85a light, '
            '#9a7c3e mid, #5e4a26 deep. Leather tunic: dull brown #6e5c48. Sash: '
            'dark red-brown #5a2e26. Trousers: dark olive #3e4232. Boots: '
            'near black #2a2826. Bone: ivory #d8cc98. THE ORC: a huge, hulking, '
            'heavily muscled brute with ASH GREY skin, a massive jaw with two '
            'big lower tusks, a flat nose, a heavy brow, pointed ears, short '
            'dark hair swept up on top of the head. CLOTHES: a big mantle of '
            'shaggy tawny fur over both shoulders, a huge trophy pauldron of '
            'curved bone tusks and claws on his left shoulder, a brown leather '
            'tunic with a strap across the chest, a wide dark red-brown sash, a '
            'leather apron with ragged fur edges, forearms wrapped in leather '
            'with fur cuffs, dark trousers and heavy black boots. WEAPON: a big '
            'iron GREATAXE with a wide crescent blade, held in BOTH HANDS low '
            'across the body. POSE: a wide heavy ready stance facing the viewer, '
            'knees bent. Nothing reaches far above the head. Full body in frame. '
            'BACKGROUND: plain, empty. No ground, no shadow, no scenery, no '
            'text. NEGATIVE: anti-aliasing, blur, gradients, 3D render, '
            'multiple characters, green skin, braids, shield, helmet, cape.'
        ),
    },
}

# O BRUGHOR que se anima: o orc com elmo de chifres, colar de dentes e pintura
# de guerra (edicao `brughor`).
PERSONAGENS['brughor'] = {
    'rota': '/create-character-v3',
    'tira': '_referencias/pixellab/edicoes/brughor/tira.png',
    'corpo': {
        'name': 'Brughor, chefe orc',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'n_directions': 8,
        'description': ('A pixel art game sprite of an ash-grey orc war chief with a horned '
                        'iron helmet, a tawny fur mantle, a necklace of teeth, red war paint '
                        'and a greataxe.'),
    },
}

# O OGRO (capitulo 4: o Cume da Wyvern, a arena e a estrada). Grande: quadro
# de 96, mais alto que o bugbear (69 px no de 80). Pelo modelo oficial que o
# dono mandou, descrito em texto: pele bege-palida, barriga enorme, curvado,
# cabeca pequena e careca, queixo para a frente com presas, tanga de couro
# rasgada e trapos amarrados, clava de madeira com cravos de ferro.
PERSONAGENS['ogro'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Ogro',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 96, 'height': 96},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of an ogre, a huge brutish giant. '
            + ESTILO_HEROI +
            'Skin ramp: pale tan, #e0c8a0 light, #c2a677 mid, #8a6e48 deep shadow. '
            'Leather and rags: #6a5038 with #3e2e20 shadow. Wood: #8a6440. Iron '
            'spikes: #8e8e8e. Eyes: small dull yellow. THE OGRE: a towering, '
            'hunched, OBESE giant, NOT muscular: a gigantic soft round pot belly '
            'that sags over the belt and is the widest part of the body, flabby '
            'chest and arms, heavy sloping shoulders, short bowed legs, a SMALL BALD '
            'head sunk low between the shoulders, a jutting underbite jaw with '
            'two lower tusks, a wide angry mouth, pale tan skin with no hair. '
            'CLOTHES: a ragged hide loincloth on a rope belt, a leather strap '
            'across the chest, dirty cloth rags wrapped around the forearms, '
            'shins and bare feet. WEAPON: a huge crude wooden GREATCLUB studded '
            'with iron spikes, held in the right hand, its head resting low near '
            'the ground at his side. POSE: standing hunched forward facing the '
            'viewer, the free left hand hanging open, so the silhouette is '
            'broken and readable. Full body in frame. BACKGROUND: plain, empty. '
            'No ground, no shadow, no scenery, no text. NEGATIVE: anti-aliasing, '
            'blur, gradients, painted rendering, 3D render, multiple characters, '
            'hair, armor plate, helmet, shield, green skin, tail, six-pack abs, '
            'bodybuilder.'
        ),
    },
}

# O OGRO QUE SE ANIMA: a primeira leva (`ogro-e357ff45`, clava de madeira)
# engordada pela edicao `ogro-gordo` em duas metades de 4 vistas (acima de 80
# px o pedido aceita so 4 quadros). O texto sozinho o fez musculoso duas vezes.
PERSONAGENS['ogroGordo'] = {
    'rota': '/create-character-v3',
    'tira': '_referencias/pixellab/edicoes/ogro-gordo/tira.png',
    'corpo': {
        'name': 'Ogro (gordo)',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'n_directions': 8,
        'description': ('A pixel art game sprite of an obese pale tan ogre with a huge pot belly, '
                        'a small bald head, tusks, a hide loincloth and a spiked wooden greatclub.'),
    },
}

# O REI GROL que se anima: o bugbear de 80 editado em rei (`rei-grol`).
PERSONAGENS['reiGrol'] = {
    'rota': '/create-character-v3',
    'tira': '_referencias/pixellab/edicoes/rei-grol/tira.png',
    'corpo': {
        'name': 'Rei Grol',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'n_directions': 8,
        'description': ('A pixel art game sprite of a hunched bugbear king with near-black fur, '
                        'a horned iron crown, an eyepatch, black leather gear, a dark red loincloth '
                        'and a big iron battleaxe.'),
    },
}

# A CORUJA-URSO (capitulo 4: o Castelo Cragmaw e a estrada). Grande, de quatro:
# o esqueleto `bear`, quadro de 80. Pelas imagens que o dono mandou, descritas
# em texto: corpo de urso de pelo-pena cinza-arroxeado escuro, cabeca de
# coruja com disco facial creme, bico curvo, crista de penas, garras pretas.
PERSONAGENS['corujaUrso'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Coruja-urso',
        'template_id': 'bear',
        'view': 'low top-down',
        'image_size': {'width': 80, 'height': 80},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of an owlbear, a monstrous beast with the body '
            'of a bear and the head of an owl. ' + ESTILO_HEROI +
            'Feathered fur ramp: dusky purple-grey, #8a8098 light, #5e5668 mid, '
            '#36303e deep shadow, with darker feather stripes. Facial disc: pale '
            'cream #e8d8c0 with a tan #b89878 rim. Beak: tan-yellow #c8a060 with '
            'a dark tip. Claws: black. Eyes: big round black eyes with a dark rim. '
            'THE OWLBEAR: a huge heavy bear body on four thick legs, a hunched '
            'muscular back, shaggy fur that turns into ragged feathers at the '
            'shoulders and forelegs, big paws with long curved black claws. The '
            'head of a great horned OWL: a round pale facial disc, a short hooked '
            'beak open in a screech, two tufts of feathers like horns, a crest of '
            'spiky feathers over the head. Standing on all four legs in a '
            'menacing stance, head low and forward. Side-on three-quarter body, '
            'the whole animal readable. Full body in frame. BACKGROUND: plain, '
            'empty. No ground, no shadow, no scenery, no text. NEGATIVE: '
            'anti-aliasing, blur, gradients, painted rendering, 3D render, '
            'multiple animals, wings, tail feathers fan, cute, brown bear face.'
        ),
    },
}

# A coruja-urso que se anima: vistas no lugar e sem as manchas laranja
# (`src/dev/coruja-tira.py`, sem geracao).
PERSONAGENS['corujaUrsoDirecoes'] = {
    'rota': '/create-character-v3',
    'tira': '_referencias/pixellab/edicoes/coruja-urso-direcoes/tira.png',
    'corpo': {
        'name': 'Coruja-urso (direcoes)',
        'template_id': 'bear',
        'view': 'low top-down',
        'n_directions': 8,
        'description': ('A pixel art game sprite of an owlbear: a bear body with dusky purple-grey '
                        'feathered fur and the head of a horned owl with a pale cream facial disc.'),
    },
}

# O ZUMBI (capitulo 4: o Poco da Coruja Velha). Medio, quadro de 64. Pelo
# modelo oficial que o dono mandou, descrito em texto: magro e cinza-pardo,
# cabelo grisalho ralo e comprido, boca aberta, colete verde-azulado rasgado
# e aberto, barriga rasgada e vermelha, calca oliva em farrapos, pes descalcos.
PERSONAGENS['zumbi'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Zumbi',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 64, 'height': 64},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a shambling zombie, a rotting walking '
            'corpse. ' + ESTILO_HEROI +
            'Skin ramp: dead grey-brown, #a8988a light, #7e6e62 mid, #4a3e38 '
            'deep, with dark red #6e1e1e wounds. Hair: dirty grey #8e8e88. Vest: '
            'faded teal #3e8a84 with #245a56 shadow. Trousers: olive #6e6a3a '
            'with #44422a shadow. Eyes: pale yellow. THE ZOMBIE: a tall, gaunt '
            'dead man with grey-brown rotting skin stretched over the ribs, a '
            'balding head with long thin stringy grey hair, a gaping mouth, '
            'hollow eyes. CLOTHES: a torn sleeveless teal vest hanging open, '
            'a torn-open belly with a dark red wound, ragged olive trousers '
            'ripped at one knee, bare feet. POSE: shambling forward facing the '
            'viewer, hunched, head tilted, both arms hanging forward with '
            'clawed fingers, one leg dragging. Full body in frame. BACKGROUND: '
            'plain, empty. No ground, no shadow, no scenery, no text. NEGATIVE: '
            'anti-aliasing, blur, gradients, painted rendering, 3D render, '
            'multiple characters, weapon, armor, green skin, skeleton.'
        ),
    },
}

# O GRICK (capitulo 4: o Castelo Cragmaw). Medio, quadro de 64. Pelo modelo
# oficial que o dono mandou, descrito em texto: verme grosso de couro
# verde-acinzentado, erguido em S, com a ponta da cabeca aberta em quatro
# tentaculos de ventosas com garras e um bico no meio. O PixelLab so tem
# esqueleto de humanoide e de quadrupede: o `mannequin` em pe e o mais perto do
# verme erguido.
PERSONAGENS['grick'] = {
    'rota': '/create-character-v3',
    # A VISTA SUL APROVADA PELO DONO: o OpenArt redesenhou a imagem oficial em
    # pixel art (o texto sozinho deu rosto e bracos duas vezes) e ela foi
    # reduzida a 68 px (`_referencias/pixellab/grick-ref/reduzir.py`).
    'referencia': '_referencias/pixellab/edicoes/grick-sul/sul.png',
    'corpo': {
        'name': 'Grick',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 64, 'height': 64},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a grick, a monstrous worm. ' + ESTILO_HEROI +
            'Hide ramp: olive green, #8e9a68 light, #66704a mid, #3a4028 deep, with '
            'a pale tan #c8b896 ribbed underside. Tentacles: pale grey #b8b0b8 with '
            'rows of round dark suckers. Beak and claws: ivory #e0d8c0. Mouth: dark '
            'red #6e1e22. THE GRICK: a thick, heavy, segmented worm body coiled on '
            'the ground in an S curve, its front half reared UPRIGHT. It has NO '
            'HEAD, NO FACE, NO EYES, NO ARMS, NO HANDS and NO LEGS. The top end of '
            'the worm body simply splits open into FOUR thick tentacles spread in '
            'an X, each lined with suckers and ending in a curved hooked claw. At '
            'the very center of the four tentacles is only a hooked beak in a red '
            'gaping maw. POSE: reared up facing the viewer, the four tentacles '
            'spread wide, coils on the ground below. Full body in frame. '
            'BACKGROUND: plain, empty. No ground, no shadow, no text. NEGATIVE: '
            'anti-aliasing, blur, gradients, 3D render, face, eyes, nose, teeth '
            'face, head, arms, hands, legs, human, medusa, snake head.'
        ),
    },
}

# O CARNICAL (ghoul; a estrada da regiao). Medio, quadro de 64. Pela imagem
# que o dono mandou, descrita em texto: magro, pele cinza-azulada palida,
# careca, orelha pontuda, boca de presas com a lingua vermelha comprida para
# fora, bracos longos de garras pretas, tanga e tiras de pano encardido nos
# bracos e numa canela, pes descalcos de garra, curvado e avancando. A arte
# do OpenArt reduzida a 64 px virou fiapos (o dono rejeitou).
PERSONAGENS['carnical'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Carnical',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 64, 'height': 64},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a ghoul, a ravenous undead flesh-eater. '
            + ESTILO_HEROI +
            'Skin ramp: pale ashen blue-grey, #c8d4dc light, #98a8b4 mid, #5e6a78 '
            'deep shadow. Rags: dirty tan, #c8a878 light, #9a7a52 mid, #5e4830 '
            'deep. Claws and toenails: black. Tongue and gums: red #b83a3a. Eyes: '
            'pale. THE GHOUL: a gaunt, wiry humanoid of human height, sinewy '
            'muscles and visible ribs under the pale grey-blue skin, a bald '
            'elongated head with long pointed ears, a gaping mouth full of sharp '
            'fangs with a LONG RED TONGUE hanging out over the chin. Very long '
            'thin arms reaching to the knees, ending in big hands with long '
            'curved black claws. CLOTHES: only a ragged dirty tan loincloth, '
            'strips of torn tan cloth wrapped around both forearms and around '
            'one shin, bare clawed feet. POSE: hunched and stalking forward '
            'toward the viewer, knees bent, the long clawed hands held low and '
            'spread at the sides, ready to pounce. Full body in frame. '
            'BACKGROUND: plain, empty. No ground, no shadow, no scenery, no '
            'text. NEGATIVE: anti-aliasing, blur, gradients, painted rendering, '
            '3D render, multiple characters, clothes, armor, weapon, hair, green '
            'skin, zombie shirt.'
        ),
    },
}

# HAMUN KOST (capitulo 4: o Poco da Coruja Velha), o Mago Vermelho de Thay.
# Medio, quadro de 64. Pela imagem que o dono mandou, descrita em texto:
# careca com tatuagens pretas na cabeca, brinco, manto vermelho de gola larga
# sobre roupa preta, chamas verdes na barra, amuleto dourado, cetro dourado
# de cravos nas duas maos.
PERSONAGENS['hamunKost'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Hamun Kost',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 64, 'height': 64},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a Red Wizard, a sinister human necromancer. '
            + ESTILO_HEROI +
            'Skin ramp: pale, #e8d2bc light, #c8a890 mid, #8a6a58 deep. Robe: '
            'deep red, #c8382a light, #8a1e1e mid, #561010 deep, with an orange-red '
            'heavy collar. Undergarment: black #242024 with #3e3a40 highlights. '
            'Gold: #d4a63c with #8a6a20 shadow. Hem flames: sickly green #7ac83a. '
            'THE WIZARD: a lean stern man, a completely BALD head covered with '
            'black tattoo patterns over the scalp and brow, a hard frowning face, '
            'a gold earring. CLOTHES: a long flowing deep red robe with a wide '
            'heavy turned-up collar around the shoulders, worn open over black '
            'tight sleeves and a black tunic, a black leather belt with a gold '
            'buckle, gold bracers, a gold amulet on the chest, the robe hem '
            'embroidered with green flames, dark boots. WEAPON: an ornate GOLDEN '
            'SCEPTER with a spiked flanged head, held diagonally across the body '
            'in both hands, its head low. POSE: standing facing the viewer, a '
            'menacing stance. Full body in frame. BACKGROUND: plain, empty. No '
            'ground, no shadow, no scenery, no text. NEGATIVE: anti-aliasing, '
            'blur, gradients, painted rendering, 3D render, multiple characters, '
            'hair, beard, hood, hat, armor, shield, sword.'
        ),
    },
}

# O DOPPELGANGER (capitulo 4: Vyerith, no Castelo Cragmaw), na FORMA
# VERDADEIRA. Medio, quadro de 64. Pela imagem que o dono mandou, descrita em
# texto: alto e esguio, sem roupa e sem feicoes marcadas, pele cinza-azulada
# lisa, careca, olhos brancos sem pupila, bracos compridos e maos grandes.
PERSONAGENS['doppelganger'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Doppelganger',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 64, 'height': 64},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a doppelganger in its true form, an eerie '
            'shapeshifter. ' + ESTILO_HEROI +
            'Skin ramp: smooth slate blue-grey, #8aa0b8 light, #5e7288 mid, '
            '#36445a deep shadow, with faint purple-brown tints in the shadows. '
            'Eyes: blank glowing white, no pupils. THE DOPPELGANGER: a tall, '
            'thin, lanky humanoid with NO clothes and no visible genitals, '
            'smooth hairless featureless grey-blue skin over long sinewy '
            'muscles, a completely bald elongated head, a flat face with only '
            'two big blank white eyes, a tiny nose and a thin lipless mouth, '
            'small pointed ears. Very long thin arms hanging down to the '
            'knees, big long-fingered hands, long thin legs, bare feet. POSE: '
            'standing upright and still facing the viewer, slightly hunched, '
            'the long arms hanging loose at its sides, unsettling and calm. '
            'Full body in frame. BACKGROUND: plain, empty. No ground, no '
            'shadow, no scenery, no text. NEGATIVE: anti-aliasing, blur, '
            'gradients, painted rendering, 3D render, multiple characters, '
            'clothes, armor, weapon, hair, tail, wings, horns.'
        ),
    },
}

# A DROW (o monstro `drow` e o DISFARCE do Vyerith, o doppelganger do
# Castelo Cragmaw). Media, quadro de 64. Pela imagem que o dono mandou e o
# Manual dos Monstros dele, descritos em texto: pele cinza-arroxeada escura,
# cabelo branco num rabo alto, armadura de placas roxo-escuras de espinhos
# sobre camisao de malha, espada curta numa mao e besta de mao na outra.
PERSONAGENS['drow'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Drow',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 64, 'height': 64},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a female drow warrior, a dark elf. '
            + ESTILO_HEROI +
            'Skin ramp: dark purple-grey, #6e6680 light, #4a4258 mid, #2c2638 deep. '
            'Hair: pure white #f4f2f6 with light grey #c8c6cc shadow. Armor: BLACK, '
            '#3a3a40 light, #222226 mid, #0e0e10 deep, with dark steel grey '
            '#6a6a74 edges. Chain mail: dark grey #48484e. Blades: pale steel '
            '#c8c4d8. Eyes: '
            'pale white. THE DROW: a slender, tall female elf with dark purple-grey '
            'skin, long pointed ears, pale glowing eyes and long WHITE hair tied '
            'in a high ponytail. ARMOR, ALL BLACK: a fitted dark chain mail shirt '
            'under spiked BLACK plate pieces: pointed spiky pauldrons, a sculpted '
            'breastplate, a plated belt, plated thigh guards and tall pointed '
            'black boots, a small quiver of bolts at the hip. NO CLOAK, NO CAPE: '
            'her back is the armor. WEAPONS: a slim curved SHORTSWORD held low '
            'in the right hand, and a tiny one-handed HAND CROSSBOW in the left '
            'hand: a short straight black stock no longer than her forearm with '
            'a small horizontal bow at the front, held level and pointing '
            'forward at waist height, like a pistol. POSE: standing confident '
            'facing the viewer. Full body in frame. BACKGROUND: plain, empty. No '
            'ground, no shadow, no scenery, no text. NEGATIVE: anti-aliasing, '
            'blur, gradients, 3D render, multiple characters, cloak, cape, '
            'hood, helmet, shield, longbow, big crossbow, staff.'
        ),
    },
}

# A DROW QUE SE ANIMA (aprovada pelo dono): armadura preta, sem capa, espada
# curta e besta de mao (edicao `drow-preta`). Registrada DUAS vezes, de graca:
# `drowEspada` anima andar, golpe e queda; `drowTiro` so o tiro de besta.
for _chave in ('drowEspada', 'drowTiro'):
    PERSONAGENS[_chave] = {
        'rota': '/create-character-v3',
        'tira': '_referencias/pixellab/edicoes/drow-preta/tira.png',
        'corpo': {
            'name': f'Drow ({_chave[4:].lower()})',
            'template_id': 'mannequin',
            'view': 'low top-down',
            'n_directions': 8,
            'description': ('A pixel art game sprite of a female drow with dark purple-grey skin, '
                            'white hair in a high ponytail, black spiked armor, a shortsword and a '
                            'small hand crossbow.'),
        },
    }

# LICAO DO PRIMEIRO TENTATIVO DO ACOLITO: a descricao dizia "dragon cultist" e
# "dragon scale", e o gerador desenhou um DRACONATO -- focinho verde, chifres e
# cauda --, mesmo com "horns, tail" na lista negativa. Palavra de dragao na
# descricao puxa o desenho para dragao. Aqui o culto e "a hooded cult" e a
# escama e um pingente oval; o rosto e HUMANO por extenso.
# O CULTO DO DRAGAO de Arvore Trovao: o ACOLITO (os tres que rezam em volta
# da fogueira) e o SACERDOTE (o que fala por eles). Desenho NOSSO, a partir do
# que a cena diz -- mantos verdes e uma escama de dragao no altar --, e nada do
# livro. Medios, quadro de 64. Os dois sao da mesma familia (manto verde-floresta,
# escama pendurada no pescoco); o sacerdote se le de longe: cabeca de fora,
# barra dourada, malha de aco por baixo e a maca de cabeca de flanges.
_CULTO_ESTILO = (
    'Cloak ramp: deep forest green, #4f8a3c light, #2f5c2a mid, #183a1c deep. '
    'Pendant: pale cream-green #d8e8b0 light, #a0b878 mid, #566e3c deep. '
    'Cloth: dirty cream-grey #b8ae98 light, #8a8270 mid, #5a5448 deep. Wood: '
    '#a06a38 light, #6e4422 mid, #3e2412 deep. '
)
_CULTO_FIM = (
    'POSE: standing facing the viewer. Full body in frame. BACKGROUND: plain, '
    'empty. No ground, no shadow, no scenery, no text. NEGATIVE: anti-aliasing, '
    'blur, gradients, painted rendering, 3D render, multiple characters, '
    'wings, tail, horns, snout, reptile, lizard, dragon, dragonborn, scaly '
    'skin, green skin, fire, glow, shield, armor plates, helmet.'
)
PERSONAGENS['acolito'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Acolito do Culto do Dragao',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 64, 'height': 64},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a lowly hooded cultist, a young HUMAN '
            'acolyte. ' + ESTILO_HEROI + _CULTO_ESTILO +
            'Skin ramp: warm tan, #e8b888 light, #c08a5c mid, #7a5034 deep. '
            'THE ACOLYTE: a lean young HUMAN man with a normal human face, tan '
            'skin, small round ears, a thin worried face half in shadow under a '
            'pulled-up HOOD. CLOTHES: a plain long deep forest '
            'green hooded CLOAK hanging to the shins, open at the front over a '
            'dirty cream-grey tunic, a frayed rope belt, simple brown cloth '
            'boots. A single small pale oval PENDANT hangs on a cord at the '
            'chest. WEAPON: a short plain wooden CLUB held low in the right '
            'hand. ' + _CULTO_FIM
        ),
    },
}
PERSONAGENS['sacerdote'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Sacerdote do Culto do Dragao',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 64, 'height': 64},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of the leader of a hooded cult, a stern '
            'middle-aged HUMAN man. ' + ESTILO_HEROI + _CULTO_ESTILO +
            'Skin ramp: ruddy, #e8b080 light, #b87a50 mid, #744428 deep. Gold '
            'trim: #e0b83c light, #a07c20 mid, #5a4210 deep. Mail: steel '
            '#9a9aa4 light, #686872 mid, #3a3a44 deep. THE PRIEST: a broad, '
            'imposing HUMAN man with a normal human face, ruddy skin, a bald head, a short grey beard and a hard '
            'unblinking stare, HEAD BARE (no hood). CLOTHES: a long heavy deep '
            'forest green CLOAK with a high stiff collar and a wide GOLD border '
            'down the front and along the hem, open over a steel chain MAIL '
            'shirt and a cream-grey tunic, a thick black belt with a gold '
            'buckle, dark boots. A large pale oval PENDANT hangs on a gold '
            'chain over the mail. WEAPON: a heavy flanged iron MACE with a '
            'wooden haft held upright in the right hand. ' + _CULTO_FIM
        ),
    },
}

# OS TRES DA ESTRADA, pelas imagens que o dono mandou, descritas em texto: SILDAR
# HALLWINTER (refem no covil), GUNDREN ROCKSEEKER (o anao desacordado do
# castelo) e REIDOTH (o druida de Arvore Trovao). Nenhum luta no tabuleiro:
# so as oito vistas e a pose de queda. Mao: de frente, a mao ESQUERDA do
# personagem fica a DIREITA da imagem.
_FIM_ESTRADA = (
    'POSE: standing facing the viewer. Full body in frame. BACKGROUND: plain, '
    'empty. No ground, no shadow, no scenery, no text. NEGATIVE: anti-aliasing, '
    'blur, gradients, painted rendering, 3D render, multiple characters, '
    'wings, tail, fire, glow, '
)
PERSONAGENS['sildar'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Sildar Hallwinter',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 64, 'height': 64},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a weary veteran human knight in full steel '
            'armor. ' + ESTILO_HEROI +
            'Skin ramp: weathered, #e8b890 light, #c08a68 mid, #7a5038 deep. Hair: '
            'short swept-back grey-white #d8d8dc with #9a9aa2 shadow, black thick '
            'moustache. Steel ramp: #d4d8dc light, #98a0a8 mid, #5a6068 deep. '
            'Cloak: crimson #b03038 light, #7a1e28 mid, #4a1018 deep, with a gold '
            'trim #d8b04a. Leather: brown #8a5a30. THE KNIGHT: a lean stern '
            'middle-aged man with a lined face, grey-white hair and a thick black '
            'moustache. ARMOR: polished silver plate harness, big rounded '
            'pauldrons, a breastplate with a small gold gorget crest, steel arm '
            'and leg guards, gauntlets, chain mail showing at the waist, a '
            'broad brown belt with a sheathed sword on the hip, brown leather '
            'boots with steel greaves. A crimson cloak hangs from his shoulders '
            'down his back. EQUIPMENT: a long narrow steel kite SHIELD with a '
            'red stripe and dark blood stains on his LEFT arm, resting on the '
            'ground at his side; a dented steel HELMET held in his RIGHT hand '
            'down by his thigh. ' + _FIM_ESTRADA + 'helmet on head, hood, horns.'
        ),
    },
}
PERSONAGENS['gundren'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Gundren Rockseeker',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 64, 'height': 64},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a cheerful dwarf prospector and merchant. '
            + ESTILO_HEROI +
            'Skin ramp: dark brown, #a06a48 light, #7a4a30 mid, #4a2a1a deep. '
            'Beard and moustache: black #2a2a30 with #4a4a54 highlights, gold '
            'beads #d8b04a. Coat: pale grey-cream #d8d4cc light, #a8a49c mid, '
            '#686460 deep, with brown shoulder straps. Tunic tan #b8a888. Leather: '
            'brown #8a5a30. THE DWARF: a short, very stout, broad dwarf with a '
            'wide-brimmed pale grey-cream HAT with a brown band and a small metal '
            'badge, a friendly smiling face, and a long black BEARD braided in '
            'two plaits with gold beads, reaching his chest. CLOTHES: a long '
            'pale grey-cream travelling coat with brown shoulder straps and '
            'white trim, a tan tunic, a brown belt with two leather pouches, '
            'dark grey trousers, brown boots with steel toe-caps and grey '
            'spats, gold rings on his fingers. His RIGHT hand is held out open, '
            'palm up, as if offering a deal; his left arm hangs relaxed. '
            + _FIM_ESTRADA + 'tall, slim, armor, weapon, helmet.'
        ),
    },
}
PERSONAGENS['reidoth'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Reidoth',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 64, 'height': 64},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a very old human druid, a hermit of the '
            'wilds. ' + ESTILO_HEROI +
            'Skin ramp: weathered tan, #e0b890 light, #b88a64 mid, #70503a deep. '
            'Hair and beard: white #f0eee8 with #b8b6b0 shadow. Robe: olive-ochre '
            '#b8a040 light, #8a7428 mid, #564814 deep, with gold-embroidered '
            'trim #d8b04a. Sash: deep purple #4a3060. Bracers: green-bronze '
            '#6a8a58. Wood: #8a6a3a light, #5a4020 mid, #342210 deep. THE DRUID: '
            'a tall, thin, very old man, bald on top, with long white hair '
            'falling past his shoulders and a very long white beard to his '
            'belt, a deeply lined face with bushy white eyebrows. CLOTHES: a long '
            'loose olive-ochre robe with wide sleeves, a tattered hem and '
            'gold embroidered edges, a purple sash belt with a leather pouch '
            'and an iron ring hanging from it, green-bronze bracers on both '
            'forearms, bare feet in leather sandals. A small brown HAWK perches '
            'on his RIGHT forearm. In his LEFT hand he holds a tall twisted '
            'wooden STAFF taller than himself, topped with a carved wooden '
            'animal skull with two curved pale bone horns (the horns are on the '
            'staff only, his own head has none), red cloth wrapped around it, '
            'with feathers and small charms hanging. ' + _FIM_ESTRADA +
            'armor, helmet, hood, hat.'
        ),
    },
}

# A FAMILIA DENDRAR, presa nas jaulas do esconderijo dos Marcarrubra (capitulo 3).
# MIRNA e a mae, viuva de Thel; NARS e NILSA sao os filhos (o dialogo da cena
# diz "segura os dois filhos pelos ombros"). Desenho NOSSO, sem imagem do dono:
# a mesma pele e o mesmo cabelo escuro para o parentesco ler, e roupa diferente
# para cada um. Presos e sujos, sem arma. A tela da crianca e menor (figura
# menor): Mirna 64, Nars 56, Nilsa 48.
_DENDRAR_ESTILO = (
    'Skin ramp: warm tan, #e0b088 light, #b88458 mid, #7a5232 deep. Hair: dark '
    'brown, #6a4a34 light, #46301f mid, #2a1c12 deep. '
)
_DENDRAR_FIM = (
    'POSE: standing facing the viewer, shoulders slumped. Full body in frame. '
    'BACKGROUND: plain, empty. No ground, no shadow, no scenery, no text. '
    'NEGATIVE: anti-aliasing, blur, gradients, painted rendering, 3D render, '
    'multiple characters, weapon, armor, helmet, hat, wings, tail, horns, '
    'pointed ears, elf, glow, fire.'
)
PERSONAGENS['mirna'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Mirna Dendrar',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 64, 'height': 64},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a weary human woman, a captive mother. '
            + ESTILO_HEROI + _DENDRAR_ESTILO +
            'Dress: faded blue-grey wool, #7a869a light, #56627a mid, #343e50 '
            'deep. Shawl: brown wool #8a6a48 light, #5e4630 mid. Apron: dirty '
            'cream #c8bca0. THE WOMAN: a thin human woman of about forty with a '
            'tired, worried face with dark circles under her eyes, long dark '
            'brown hair tied back in a loose bun with strands escaping. CLOTHES: '
            'a long faded blue-grey woolen dress with a patched dirty cream apron, '
            'a brown wool shawl over her shoulders, a frayed rope belt, scuffed '
            'brown boots. Her hands are clasped in front of her. ' + _DENDRAR_FIM
        ),
    },
}
PERSONAGENS['nars'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Nars Dendrar',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 56, 'height': 56},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a thin human teenage boy, a captive. '
            + ESTILO_HEROI + _DENDRAR_ESTILO +
            'Shirt: torn cream linen, #d8ccae light, #b0a484 mid, #766c52 deep. '
            'Vest: worn brown leather #8a5a30 light, #5e3c20 mid. Trousers: '
            'patched dark brown #6a4a34. THE BOY: a skinny human boy of about '
            'fifteen with messy dark brown hair and a smudged, tired, frightened '
            'face. CLOTHES: a torn cream linen shirt with rolled sleeves, a worn '
            'brown leather vest, patched dark brown trousers with frayed hems, '
            'scuffed brown boots. His arms hang at his sides. ' + _DENDRAR_FIM
        ),
    },
}
PERSONAGENS['nilsa'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Nilsa Dendrar',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 48, 'height': 48},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a small human girl, a captive child. '
            + ESTILO_HEROI + _DENDRAR_ESTILO +
            'Smock: faded green-grey wool, #8a9a78 light, #647454 mid, #3e4a34 '
            'deep. Shawl: small brown knitted #8a6a48. THE GIRL: a small human '
            'girl of about ten with dark brown hair in two messy braids and a '
            'dirty, frightened face with big eyes. CLOTHES: a faded green-grey '
            'smock dress with a torn hem, a small brown knitted shawl, bare '
            'feet. Her hands hold the shawl closed in front of her. '
            + _DENDRAR_FIM
        ),
    },
}
# OS FAMILIARES do mago (Convocar Familiar): o RATO e o MORCEGO, miudos. O rato e
# menor e mais limpo que o rato gigante (32 contra 40); o morcego voa de asas
# abertas, como o stirge (mannequin: o `cat`/`dog` poe a figura de quatro).
PERSONAGENS['familiarRat'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Rato familiar',
        'template_id': 'cat',
        'view': 'low top-down',
        'image_size': {'width': 32, 'height': 32},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a small pet rat, tidy and bright-eyed. '
            + ESTILO_HEROI +
            'Fur ramp: warm rust-brown, #b88a60 light, #8a6440 mid, #583c24 deep, '
            'with a cream belly #e8dcc0. Bare skin: pink #e0a0a0 on the round ears, '
            'the long thin tail, the paws and the nose. Eyes: bright black with a '
            'white glint. THE RAT: a small clean rat on all four legs, alert, a '
            'pointed snout with whiskers, big round pink ears, a long thin pink '
            'tail curving behind, neat sleek fur. Side-on three-quarter body, the '
            'whole animal readable. Full body in frame. BACKGROUND: plain, empty. '
            'No ground, no shadow, no scenery, no text. NEGATIVE: anti-aliasing, '
            'blur, gradients, painted rendering, 3D render, multiple animals, '
            'giant, filthy, cartoon mouse, cheese.'
        ),
    },
}
PERSONAGENS['familiarBat'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Morcego familiar',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 40, 'height': 40},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a small bat hovering in the air. '
            + ESTILO_HEROI +
            'Fur ramp: dark brown, #7a6048 light, #54402e mid, #30241a deep. Wing '
            'membranes: warm brown #8a6c52 light, #5e4632 mid, with darker finger '
            'bones #30241a. Ears and nose: pink-brown #a07068. Eyes: tiny bright '
            'black with a white glint. THE BAT: a small round furry body, a '
            'little face with big pointed ears and a tiny nose, two wide '
            'leathery WINGS spread open with visible finger bones, tiny feet '
            'tucked under the body. POSE: hovering in the air, wings spread wide, '
            'seen from the front. Full body in frame. BACKGROUND: plain, empty. '
            'No ground, no shadow, no scenery, no text. NEGATIVE: anti-aliasing, '
            'blur, gradients, painted rendering, 3D render, multiple animals, '
            'vampire, human, cloak, fangs dripping, red eyes, bird, feathers.'
        ),
    },
}

# O STIRGE (a estrada da regiao). Miudo e voador: quadro de 48, esqueleto
# `dog` (nao ha esqueleto de bicho voador). Pela imagem que o dono mandou,
# descrita em texto: morcego cruzado com mosquito, asas de membrana creme com
# dedos ferrugem, corpo ferrugem de barriga palida, tromba longa de agulha e
# quatro patas finas de pinca.
PERSONAGENS['stirge'] = {
    'rota': '/create-character-v3',
    # A VISTA SUL APROVADA PELO DONO: o texto deu asas de inseto; o OpenArt
    # redesenhou as imagens oficiais (`stirge-ref/openart-2.jpg`) e o dono
    # escolheu a menor, 24 px (`stirge-ref/reduzir2.py`): e Miudo. O esqueleto
    # e o `mannequin`: o `dog` o punha em pe como um dragaozinho.
    'referencia': '_referencias/pixellab/edicoes/stirge-sul/sul.png',
    'corpo': {
        'name': 'Stirge',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 48, 'height': 48},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a stirge, a small flying blood-sucking beast, '
            'a cross between a bat and a giant mosquito. ' + ESTILO_HEROI +
            'Body and wing bones: rust red-brown, #b8644a light, #8a4430 mid, '
            '#52261a deep. Wing membranes and belly: pale cream, #e8dcc0 light, '
            '#c8b898 mid. Proboscis: dark red-brown. Eyes: small orange. THE '
            'STIRGE: a small wiry rust-red body with a pale cream belly, two big '
            'BAT WINGS spread wide with long finger bones and pale cream '
            'membranes, a long thin needle-like PROBOSCIS pointing forward from '
            'the small head, four thin jointed legs ending in pincer claws '
            'hanging under the body, a short barbed tail. POSE: hovering in the '
            'air, wings spread wide, proboscis forward, legs dangling. Full body '
            'in frame. BACKGROUND: plain, empty. No ground, no shadow, no '
            'scenery, no text. NEGATIVE: anti-aliasing, blur, gradients, '
            'painted rendering, 3D render, multiple creatures, standing on legs, '
            'fur, dog, cat, bird, feathers.'
        ),
    },
}

# O BUGBEAR (capitulo 2: Klarg; capitulo 3: os da mansao). Alvo: 69 px de
# figura (a escala de `looks/bestiario.js`), quadro 72. Cores do look
# `bugbear`: pelo fulvo dourado, cabelo ruivo, couro PRETO no equipamento. O
# Klarg e este mesmo corpo com o pelo descorado (recolor, sem geracao). A clava
# vai BAIXA: erguida, passava do topo do quadro e o cravo saia cortado.
PERSONAGENS['bugbear'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Bugbear',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 72, 'height': 72},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a bugbear, a huge hairy goblinoid brute. '
            + ESTILO_HEROI +
            'Fur ramp: tawny gold, #d8a45a light, #bd8a46 mid, #8f5b29 deep shadow. '
            'Mane: rust red-brown #7a3c1c. Leather gear: near black #241f1e with '
            '#3a3432 highlights. Iron: #9a948e. Eyes: amber #e0a53a. THE BUGBEAR: '
            'very tall, hunched and heavily muscled, covered in shaggy tawny fur '
            'with ragged tufts at the edges, a bear-like face with a broad flat '
            'nose, small fangs and a shaggy rust-red mane, big lynx ears with '
            'tufted tips, long arms, bare clawed feet. GEAR: one spiked black '
            'leather pauldron on the left shoulder, a black leather gauntlet on '
            'the left forearm, a wide black leather belt and a kilt of black '
            'leather strips to mid-thigh. WEAPON: a big wooden morningstar club '
            'studded with iron spikes held in the right hand. POSE: standing in a '
            'hunched ready stance facing the viewer, feet apart, the spiked club '
            'held low at his right side with its head near the knee, the left '
            'clawed hand open and forward, so the silhouette is broken and '
            'readable. Nothing reaches above the top of his ears. '
            'Full body in frame. BACKGROUND: plain, empty. No ground, no shadow, '
            'no scenery, no text. NEGATIVE: anti-aliasing, blur, gradients, '
            'painted rendering, 3D render, multiple characters, armor plate, '
            'helmet, shield, shoes.'
        ),
    },
}

# O MARCARRUBRA (capitulo 3): o bandido da gangue que domina Phandalin. Humano,
# 61 px, quadro 64. O manto escarlate encardido e o uniforme deles e o que os
# separa de qualquer outro humano no tabuleiro; couro batido e espada curta
# (o bloco da aventura).
PERSONAGENS['marcarrubra'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Bandido Marcarrubra',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 64, 'height': 64},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a male human thug of a street gang. '
            + ESTILO_HEROI +
            'Skin ramp: #d8a47c light, #b07a50 mid, #6e4630 deep shadow. Cloak: '
            'grimy scarlet, #b0302a light, #842220 mid, #4e1414 deep, with a '
            'frayed dirty hem. Leather: dark brown #453222 with small steel '
            'rivets #8a9298. Trousers: dull brown. Eyes: dark. THE THUG: a stocky '
            'broad-shouldered man with a shaved head, a broken nose, a scar on '
            'the cheek and a heavy jaw with stubble. CLOTHES: a dark brown studded '
            'leather jerkin, a long grimy scarlet cloak over his shoulders with the '
            'hood down, a belt with a pouch, dull brown trousers and worn boots. '
            'WEAPON: a steel shortsword in his right hand. POSE: standing in a '
            'cocky menacing stance facing the viewer, feet apart, the shortsword '
            'held low and out from the body, the left fist clenched, so the '
            'silhouette is broken and readable. Full body in frame. BACKGROUND: '
            'plain, empty. No ground, no shadow, no scenery, no text. NEGATIVE: '
            'anti-aliasing, blur, gradients, painted rendering, 3D render, '
            'multiple characters, helmet, shield, hair, metal armor.'
        ),
    },
}

# AS CRIATURAS DA MANSAO (capitulo 3). Cores dos looks procedurais.
#   esqueleto  medio, a altura de um humano (quadro 64); osso bege-claro, a
#              figura mais clara do tabuleiro, orbitas vazias e sem brilho
#   rato       pequeno (quadro 40), esqueleto `cat`; pelo pardo de valor morto,
#              pele nua rosa (orelha, cauda, focinho) e olho vermelho
#   vigia      o "vigia ciclopico": medio e encurvado (quadro 56), o marrom mais
#              escuro do bestiario e um olho unico de iris verde-amarela. Arte
#              NOSSA (ver `looks/aberracoes.js`): nada copiado de ilustracao.
PERSONAGENS['esqueleto'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Esqueleto',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 64, 'height': 64},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of an animated human skeleton warrior. '
            + ESTILO_HEROI +
            'Bone ramp: warm pale beige, #f2ead0 light, #e4d8b4 mid, #a8987a deep '
            'shadow. Eye sockets: empty and dark #17131d, no glow. Rusty iron: '
            '#8a7a6a. Rags: faded dark brown #4a3a2c. THE SKELETON: a full human '
            'skeleton of normal height, clearly visible skull with empty eye '
            'sockets and a grinning jaw, ribcage, spine, pelvis and long arm and '
            'leg bones, a few scraps of rotten brown cloth hanging from the hips. '
            'WEAPON: a notched rusty iron shortsword in the right hand. POSE: '
            'standing in a stiff ready stance facing the viewer, feet apart, the '
            'shortsword held out from the body, the left bony hand open, so the '
            'silhouette is broken and readable. Full body in frame. BACKGROUND: '
            'plain, empty. No ground, no shadow, no scenery, no text. NEGATIVE: '
            'anti-aliasing, blur, gradients, painted rendering, 3D render, '
            'multiple characters, glowing eyes, flesh, armor, helmet, shield.'
        ),
    },
}
PERSONAGENS['ratoGigante'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Rato gigante',
        'template_id': 'cat',
        'view': 'low top-down',
        'image_size': {'width': 40, 'height': 40},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a giant rat, a filthy sewer rat as big as a '
            'dog. ' + ESTILO_HEROI +
            'Fur ramp: dull grey-brown, #8a7e74 light, #6b6058 mid, #453d37 deep '
            'shadow, with a paler #b5a894 belly. Bare skin: pink #d59a9a on the big '
            'round ears, the long naked tail, the paws and the pointed snout tip. '
            'Teeth: two long yellow-white incisors #f2ead2. Eyes: small beady red '
            '#e04a3a. THE RAT: a hunched rat on all four legs, a pointed snout with '
            'whiskers, big round pink ears, a long thick naked pink tail longer '
            'than the body, ragged greasy fur. Side-on three-quarter body, the '
            'whole animal readable. Full body in frame. BACKGROUND: plain, empty. '
            'No ground, no shadow, no scenery, no text. NEGATIVE: anti-aliasing, '
            'blur, gradients, painted rendering, 3D render, multiple animals, '
            'cute, cartoon mouse.'
        ),
    },
}
PERSONAGENS['vigia'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Vigia ciclopico',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 56, 'height': 56},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a hunched one-eyed cave aberration. '
            + ESTILO_HEROI +
            'Skin ramp: very dark brown, #6a5440 light, #4a3a2c mid, #231a13 deep '
            'shadow. The eye: a single huge round eye with a pale ivory #e4dcba '
            'white, a bright yellow-green #c2cf36 iris and a black pupil. Claws: '
            'pale yellowed bone. THE CREATURE: a gaunt, stooped humanoid with a '
            'hairless lumpy head that is almost all one enormous staring eye in '
            'the middle of the face, a small mouth of jagged teeth under it, a '
            'thin bony body with a hunched spine, long thin arms ending in long '
            'curved claws that hang to the knees, bent legs and clawed feet, a few '
            'grey rags. POSE: crouched and leaning forward facing the viewer, the '
            'clawed hands raised and spread, so the silhouette is broken and '
            'readable. Full body in frame. BACKGROUND: plain, empty. No ground, no '
            'shadow, no scenery, no text. NEGATIVE: anti-aliasing, blur, '
            'gradients, painted rendering, 3D render, multiple characters, two '
            'eyes, tentacles, weapon, clothing.'
        ),
    },
}

# O VIGIA, segunda leva: o dono mostrou como ele tem de ser -- agachado sobre
# quatro membros longos, espinhos de osso na cabeca e nas costas, bocarra de
# dentes sob o olho, pele manchada. A descricao e nossa (nenhuma imagem de
# terceiros vai ao gerador).
# (terceira tentativa: na segunda o olho saiu pequeno e nasceu um rabo)
PERSONAGENS['vigia2'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Vigia ciclopico (2)',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 56, 'height': 56},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a hunched one-eyed cave aberration. '
            + ESTILO_HEROI +
            'Skin ramp: dark mottled brown, #6e5446 light, #4a3a2c mid, #231a13 deep '
            'shadow, with blotchy dark red #7a2e24 patches. Spikes: long pale bone '
            '#d8cbb0 with dark tips. The eye: one huge round eye, bright yellow-green '
            '#c2cf36 iris with a black pupil and a pale rim. Teeth: long yellowed '
            '#e4dcba. Claws: long, curved, near black. THE CREATURE: a gaunt, '
            'emaciated thing crouched low on four long thin limbs like a hunting '
            'beast, its back arched high, NO TAIL. THE HEAD IS DOMINATED BY ONE '
            'ENORMOUS EYE: a single cyclops eye bigger than the mouth, covering the '
            'whole upper face, glowing yellow-green, no other eyes; right under it '
            'a wide gaping mouth full of long jagged teeth; a crest of long sharp '
            'bone spikes on top of the head and a row '
            'of spikes running down the spine; thin sinewy arms and legs with '
            'visible ribs, big hands and feet ending in long curved black claws. '
            'POSE: crouched on all fours leaning toward the viewer, head low and '
            'forward, claws spread on the ground, so the silhouette is broken and '
            'readable. Full body in frame. BACKGROUND: plain, empty. No ground, no '
            'shadow, no scenery, no text. NEGATIVE: anti-aliasing, blur, gradients, '
            'painted rendering, 3D render, multiple characters, two eyes, clothing, '
            'rags, weapon, standing upright, tail, small eyes, green skin, stripes.'
        ),
    },
}

# O vigia que se anima: as vistas do `vigia2` vieram deslocadas uma casa do sul
# ao norte, e sem uma vista de costas para a esquerda; o lado oeste e o leste
# espelhado (a criatura e simetrica). Registro de tira: de graca.
PERSONAGENS['vigiaDirecoes'] = {
    'rota': '/create-character-v3',
    'tira': '_referencias/pixellab/edicoes/vigia-direcoes/tira.png',
    'corpo': {
        'name': 'Vigia ciclopico (direcoes)',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'n_directions': 8,
        'description': ('A pixel art game sprite of a gaunt crouching cave aberration with one '
                        'enormous yellow-green eye, a gaping toothy mouth, bone spikes on the '
                        'head and back and mottled dark brown and red skin.'),
    },
}

# O CAJAVIDRO (Iarno Albrek), chefe dos Marcarrubra. Humano, 61 px, quadro 64.
# Pelo que o dono mostrou: tunica carmesim com bordado claro, faixa, bolsa a
# tiracolo, cabelo escuro comprido e barba curta, e o cajado de VIDRO que da o
# nome. Descricao nossa; nenhuma imagem de terceiros vai ao gerador.
PERSONAGENS['cajavidro'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Cajavidro (Iarno)',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 64, 'height': 64},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a male human evil wizard. ' + ESTILO_HEROI +
            'Skin ramp: #e2b490 light, #c08c68 mid, #7e5440 deep shadow. Hair and '
            'beard: dark brown #3a2a20. Robes: deep crimson, #b0302e light, #842222 '
            'mid, #4e1416 deep, with pale cream #e8dcc0 embroidered trim. Leather: '
            'dark brown. Glass: pale icy translucent white-blue, #e8f0f8 light, '
            '#b8c8d8 mid, #8090a8 deep, with white glints. THE WIZARD: a lean man '
            'with long dark brown hair to the shoulders, a short pointed beard and a '
            'haughty sneer. CLOTHES: a long deep crimson robe with wide sleeves and '
            'pale embroidered trim on the collar and cuffs, a wide crimson sash at '
            'the waist with a ring of keys, a leather strap across the chest to a '
            'satchel on the hip, crimson trousers and soft boots. No hat, no armor. '
            'WEAPON: a tall staff made entirely of pale translucent glass, taller '
            'than he is, its top twisting into an ornate swirl, held upright in his '
            'right hand. POSE: standing facing the viewer, the glass staff planted '
            'beside him, the left hand raised with open fingers as if about to cast, '
            'so the silhouette is broken and readable. Full body in frame. '
            'BACKGROUND: plain, empty. No ground, no shadow, no scenery, no text. '
            'NEGATIVE: anti-aliasing, blur, gradients, painted rendering, 3D render, '
            'multiple characters, hat, armor, wooden staff.'
        ),
    },
}

# O HOBGOBLIN (capitulo 4: o castelo Cragmaw). Alvo: 64 px de figura (a escala
# de `looks/bestiario.js`), quadro 72, com folga para o golpe. O kit e o do
# bloco do Livro dos Monstros: cota de malha, escudo, espada longa e arco longo
# (nas costas enquanto luta de espada). A descricao veio da imagem que o dono
# mandou, em texto: arte oficial nao vai para o gerador. Cores do look
# `hobgoblin`: pele laranja-avermelhada, armadura de aco azul-acinzentado.
PERSONAGENS['hobgoblin'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Hobgoblin',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 72, 'height': 72},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a hobgoblin soldier, a disciplined '
            'goblinoid. ' + ESTILO_HEROI +
            'Skin ramp: red-orange, #e07a4a light, #c05c34 mid, #7e3420 deep '
            'shadow. Hair: dark red-brown #52221a. Armor plates: dark blue-grey '
            'steel, #5f6d82 light, #394659 mid, #222a37 deep. Chain mail: '
            '#9aa3b2 with #5f6d82 shadow. Leather and fur: #4e3b28. Eyes: '
            'orange #ff8a2a. LEFT ARM: a LARGE dark steel SHIELD strapped to '
            'the left forearm, tall as his torso, with a jagged spiked rim, held '
            'forward on his left side and covering him from shoulder to knee. '
            'RIGHT HAND: ONE steel longsword with a hooked notch near the tip. '
            'Only one sword. THE HOBGOBLIN: a stocky broad-shouldered goblinoid '
            'of human height, red-orange skin, long pointed ears swept back, a '
            'heavy brow, a scowling face with small lower fangs, dark hair '
            'shaved on the sides and tied back on top. ARMOR: a chain mail '
            'hauberk under dark blue-grey steel plates, one big SPIKED pauldron '
            'on the left shoulder, a plate belt, armored greaves and pointed '
            'steel boots, a short brown fur skirt below the belt. A quiver at '
            'the right hip. A LONGBOW slung diagonally across his BACK, its '
            'upper tip above the right shoulder. POSE: a low wide ready stance '
            'facing the viewer, knees bent, the shield forward, the longsword '
            'held low and out to the right side. Full body in frame. '
            'BACKGROUND: plain, empty. No ground, no shadow, no scenery, no '
            'text. NEGATIVE: anti-aliasing, blur, gradients, 3D render, '
            'multiple characters, two swords, dual wielding, helmet, crest, '
            'cape, green skin.'
        ),
    },
}

# O HOBGOBLIN QUE SE ANIMA: as oito vistas de cabelo preto (o dono pediu; o
# PixelLab o fez carmim e a edicao `hob-base-preto` trocou). Ele saiu canhoto:
# escudo no braco direito, espada na esquerda, igual em todas as vistas. A
# postura de ARCO e a edicao `hob-arco` (espada na bainha, escudo nas costas).
_HOB = ('A pixel art game sprite of a stocky hobgoblin with red-orange skin, long '
        'pointed ears, black hair tied back, dark blue-grey steel plate and chain '
        'armor with spiked pauldrons and a brown fur skirt, ')
for _chave, _edicao, _maos in (
        ('hob', 'hob-base-preto', 'a steel shield and a longsword, a longbow on his back.'),
        ('hobArco', 'hob-arco-preto', 'a longbow in one hand, a shield on his back.')):
    PERSONAGENS[_chave] = {
        'rota': '/create-character-v3',
        'tira': f'_referencias/pixellab/edicoes/{_edicao}/tira.png',
        'corpo': {
            'name': f'Hobgoblin ({_edicao[4:]})',
            'template_id': 'mannequin',
            'view': 'low top-down',
            'n_directions': 8,
            'description': _HOB + _maos,
        },
    }

# O BUGBEAR QUE SE ANIMA: as oito vistas da primeira leva (a5aafa..., clava
# erguida, a melhor) num quadro de 80, com folga em cima para o golpe. A
# segunda leva, de clava baixa, inventou rabo e trocou a clava por um barril.
PERSONAGENS['bugbear80'] = {
    'rota': '/create-character-v3',
    'tira': '_referencias/pixellab/edicoes/bugbear-80/tira.png',
    'corpo': {
        'name': 'Bugbear (80)',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'n_directions': 8,
        'description': ('A pixel art game sprite of a hunched hairy bugbear with tawny fur, a '
                        'rust-red mane, black leather pauldron, gauntlet, belt and strip kilt, '
                        'and an iron-spiked wooden club.'),
    },
}

# O lobo veio com as vistas GIRADAS uma casa (a "sul" olhava para sudeste, a
# "sudoeste" de frente). A tira reordenada vira o personagem que se anima; o
# registro de tira e de graca.
PERSONAGENS['loboDirecoes'] = {
    'rota': '/create-character-v3',
    'tira': '_referencias/pixellab/edicoes/lobo-direcoes/tira.png',
    'corpo': {
        'name': 'Lobo cinzento (direcoes)',
        'template_id': 'dog',
        'view': 'low top-down',
        'n_directions': 8,
        'description': ('A pixel art game sprite of a lean grey wolf with amber eyes, a pale '
                         'throat and a darker saddle along the back.'),
    },
}

# A ordem das oito vistas na tira de uma edicao, a mesma das rotacoes.
DIRECOES = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west',
            'west', 'south-west']

LIMITES = {'description': 2000, 'edit_description': 1000}

# OS TRES INFECTADOS DE THUNDERTREE (aprovados pelo dono). As vistas sul vem
# de UMA geracao do OpenArt com os tres lado a lado (15 creditos, e nao 45) a
# partir das imagens oficiais que o dono mandou; `infectados-ref/reduzir.py`
# corta a folha em tres e reduz cada um na ALTURA DA FICHA -- o galho e
# Pequeno e sai menor que os outros dois, que sao Medios.
#
# Antes disso foram NOVE geracoes no PixelLab so de texto, todas descartadas:
# sem a arte oficial eu desenhei o espeto como bicho de quatro patas duas
# vezes, e puz uma brasa no peito dos tres que nao existe no original. A
# licao: criatura com arte conhecida comeca pela arte, nao pela descricao.
_INFECTADOS = {
    # 48 de quadro, e nao 64: Pequeno e cerca de METADE de um humano (61 px),
    # entao a figura tem 34. Na primeira leva ele saiu com 48 e ficou quase
    # do tamanho de gente -- o bando tem de ler como bichinhos de joelho.
    'galhoInfectado': (
        'Galho Infectado', 48,
        'A walking plant shaped like a person, woven from twisted strips of '
        'grey-brown bark and small branches, with loose bark strands hanging from '
        'the arms and a tuft of broken twigs on its head, and two dark hollows '
        'where eyes would be. No face, no mouth.'),
    'espetoInfectado': (
        'Espeto Infectado', 72,
        'A walking plant shaped like a person, made of almost black bark and '
        'covered all over with short pointed thorns standing out from the head, '
        'shoulders, back and arms, with two tiny red points of light where eyes '
        'would be. No face, no mouth.'),
    'vinhaInfectada': (
        'Vinha Infectada', 72,
        'A walking plant shaped like a person, made of long hanging teal-green '
        'vine strands draped over the body and down from the arms, trailing to the '
        'ground so the feet are hidden, the head bowed under hanging tendrils. No '
        'face, no mouth.'),
}
for _id, (_nome, _lado, _desc) in _INFECTADOS.items():
    PERSONAGENS[_id] = {
        'rota': '/create-character-v3',
        'referencia': f'_referencias/pixellab/infectados-ref/{_id}-sul.png',
        'corpo': {
            'name': _nome,
            'template_id': 'mannequin',
            'view': 'low top-down',
            'image_size': {'width': _lado, 'height': _lado},
            'enhance_prompt': False,
            'description': _desc + ' NEGATIVE: face, mouth, teeth, eyes, four legs, '
                                   'animal, beast, leaves, flowers, person in a costume.',
        },
    }

# VENOMFANG, o DRAGAO VERDE JOVEM de Thundertree. O chefe do jogo.
#
# A VISTA SUL E O DESENHO DO DONO. Antes dela vieram sete tentativas -- cinco
# no OpenArt (perfil em vez de frente, chifres, pata fantasma, o decalque
# empinado de asas abertas) e duas no PixelLab (a empinada girada, e uma de
# quatro patas pelo esqueleto `dog`, que saiu boa mas com dois chifres). O dono
# descartou todas e trouxe o dele: ereto nas patas traseiras, asas meio abertas
# caindo dos lados, cabeca virada a direita, crista de espinhos, dois chifres
# pequenos e claros, olho vermelho. Os chifres e a pose ereta sao ESCOLHA dele.
#
# O desenho veio de um gerador de imagem no ESTILO pixel art: 53.368 cores e o
# "pixel" variando de 2 a 6 px de tela. Convertido sem gerar nada pelo
# `_referencias/pixellab/dragaoVerde-ref/reduzir.py`: fundo branco tirado por
# saturacao e brilho, alfa duro, 20 cores com o olho vermelho e o dourado das
# garras guardados a parte (o corte por mediana os afogava nos verdes).
# 151x160, alinhado a 152x160.
#
# Proporcao 0,94: cabe na celula como as outras criaturas, ao contrario do
# decalque empinado, que tinha 1,54 e passava as asas pelas casas vizinhas.
#
# A VERSAO FINAL e a que o dono passou pelo conversor do proprio site do
# PixelLab (340x340, pixel de 1 px, 245 cores) e mandou dizendo "esse e o
# dragao que eu quero animar". Mesmo desenho da conversao anterior, mais vivo
# e de mais contraste. Reduzida igual (160 de altura) e alinhada a 160x160.
# Antes disso o dono pediu bracos visiveis; o editor do Pixen falhou duas
# vezes (ver `imagem-pixellab.py`), e o dono ficou com o desenho como e.
#
# Custo da rotacao: ceil(160*160*8/65536) = 4 geracoes.
# A VERSAO DE QUATRO PATAS, e e a que vale. O dono apontou duas vezes que o
# dragao em pe lia como wyvern -- de lado e de costas sobravam duas pernas -- e
# que o rabo parecia colado na perna. As duas coisas vinham da pose ereta: os
# bracos ficam pequenos no peito e o rabo desce por tras das pernas. De quatro,
# as patas se abrem sob o corpo e o rabo sai reto do quadril.
#
# O dono gerou numa ferramenta dele uma folha de oito vistas de quatro patas.
# Cinco vieram certas; tres (oeste, noroeste, sudoeste) eram a mesma imagem de
# frente repetida, e saem por ESPELHO das boas. A tira e montada sem geracao
# pelo `src/dev/dragao-tira.py`: uma escala so, uma paleta so, os pes na mesma
# linha, e o olho vermelho repintado (na reducao ele sumia). Registrada pela
# rota de tira: as oito vao prontas e o PixelLab nao desenha nenhuma.
#
# Esqueleto `dog`: e ele que da o andar de quadrupede na animacao, como no
# lobo atroz.
PERSONAGENS['dragaoVerdeJovem'] = {
    'rota': '/create-character-v3',
    'tira': '_referencias/pixellab/edicoes/dragao-dono-oito/tira.png',
    'corpo': {
        'name': 'Dragao Verde Jovem',
        'template_id': 'dog',
        'view': 'low top-down',
        'n_directions': 8,
        'description': ('A pixel art game sprite of a young green dragon standing on all four '
                        'legs, wings folded on its back, a crest of spikes, two small pale '
                        'horns, a red eye, a pale yellow-green belly and a long tail.'),
    },
}

# O SPECTATOR (capitulo 4: a Caverna do Eco das Ondas). LICENCA: o nome e o
# conceito sao conteudo de fa; a ARTE e nossa.
#
# CINCO TENTATIVAS NO PIXELLAB antes desta, e a licao esta no
# `imagem-pixellab.py`: desenhar direto em 64 px deixa o corpo granulado e as
# hastes boiando soltas, porque nesse tamanho o modelo nao tem pixels para
# separar bola, boca e tentaculos. Em 128 px ele separa. Mesmo assim o dono
# preferiu o desenho do OpenArt, que ja estava pago, e e dele que sai a vista
# sul: reduzida a 70 px de largura (a figura e MAIS LARGA QUE ALTA, os quatro
# tentaculos abrem para os lados) num quadro de 72.
PERSONAGENS['spectator'] = {
    'rota': '/create-character-v3',
    'referencia': '_referencias/pixellab/spectator-ref/sul.png',
    'corpo': {
        'name': 'Spectator',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 72, 'height': 72},
        'enhance_prompt': False,
        'description': (
            'A floating one-eyed aberration: a round scaly dark olive-green body '
            'bristling with spikes, ONE single enormous narrowed eye in the upper '
            'half, a huge wide open mouth below it with long uneven fangs and a '
            'dark red gullet, a long pink tongue hanging down out of the mouth, and '
            'FOUR thick green tentacles curving outward, each ending in a yellow '
            'eye. It floats. NEGATIVE: two eyes, arms, legs, wings, human face.'
        ),
    },
}

# A CAVEIRA CANDENTE (capitulo 4: a Caverna do Eco das Ondas). A VISTA SUL
# APROVADA PELO DONO veio do `imagem-pixellab.py`, a rota de UMA imagem, e
# saiu boa na primeira. Quadro de 56: ela e so a cabeca flutuando, nao tem
# corpo, entao ocupa menos que um humanoide Medio.
PERSONAGENS['caveiraCandente'] = {
    'rota': '/create-character-v3',
    'referencia': '_referencias/pixellab/caveira-ref/sul.png',
    'corpo': {
        'name': 'Caveira candente',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 56, 'height': 56},
        'enhance_prompt': False,
        'description': (
            'A flaming skull floating in the air: a bare pale human skull with no '
            'body and no neck, wrapped in bright GREEN fire streaming upward off '
            'the top and sides, with small RED-ORANGE embers burning inside the two '
            'empty eye sockets. NEGATIVE: body, neck, shoulders, arms, hands, '
            'orange flames, blue eyes, helmet, hair, candle.'
        ),
    },
}

# O WRAITH (Mormesk, a aparicao da Caverna do Eco das Ondas). A VISTA SUL
# APROVADA PELO DONO veio do `imagem-pixellab.py`, a rota de UMA imagem: a
# primeira tentativa virou um cavaleiro fantasma de elmo polido e dourado nos
# bracos, e a imagem que o dono mandou e o oposto -- carvao e cinza, coroa de
# espinhos, cara virada um buraco com dois olhos amarelos. Julgar o desenho
# por 1 geracao, e so entao pagar o giro, e o que essa rota resolve.
PERSONAGENS['wraith'] = {
    'rota': '/create-character-v3',
    'referencia': '_referencias/pixellab/wraith-ref/sul.png',
    'corpo': {
        'name': 'Wraith',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 72, 'height': 72},
        'enhance_prompt': False,
        'description': (
            'A wraith: a tall figure of dark grey and black smoke, a thin crown of '
            'crooked spikes on its head, the face a black hollow with two small '
            'glowing yellow eyes, two very long thin arms with long claws, and NO '
            'legs -- the body trails away downward into ragged smoke. Charcoal grey '
            'and black only, no colour except the yellow eyes. NEGATIVE: armour, '
            'metal shine, gold, helmet visor, cloak, robe, legs, feet, weapon.'
        ),
    },
}

# O ESPECTRO (capitulo 4: a Caverna do Eco das Ondas). Medio, quadro de 64.
# Pelas duas imagens oficiais que o dono mandou, descritas aqui em texto: um
# morto-vivo de VIOLETA LUMINOSO, cara de caveira gritando, cabelo branco em
# filamentos abertos em coroa, bracos magros dobrados longe do corpo com
# dedos em garra, e da cintura para baixo SEM PERNAS -- o corpo se desfaz num
# sino de nevoa que alarga e nao encosta no chao. As cores sao as do look
# `specter` (`src/art/looks/mortosvivos.js`), e a descricao da silhueta de la
# e a mesma daqui. O sprite sai OPACO; quem o faz translucido no tabuleiro e
# o motor (`incorporeo` no `board.js`), porque pixel art nao tem meio-alfa.
PERSONAGENS['espectro'] = {
    'rota': '/create-character-v3',
    # A VISTA SUL APROVADA PELO DONO. A primeira leva so de texto
    # (`espectro-ff26541c`) foi recusada -- "parece um esqueleto de peruca e
    # de saia": o modelo desenhou tres pecas fechadas (tronco com costelas,
    # cabelo de contorno proprio, saia de lobulos) quando o espectro e UM
    # vulto de vapor. Duas tentativas baratas pelo `imagem-pixellab.py`
    # tambem nao prestaram. O OpenArt redesenhou as duas imagens oficiais do
    # dono e a reducao e em DUAS PARTES
    # (`_referencias/pixellab/espectro-ref/reduzir3.py`): tronco na escala que
    # salva o rosto, rastro espremido na vertical. 68 px num quadro de 72 --
    # mais alto que um humano porque ele flutua acima do chao.
    'referencia': '_referencias/pixellab/espectro-ref/sul.png',
    'corpo': {
        'name': 'Espectro',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 72, 'height': 72},
        'enhance_prompt': False,
        # Em modo referencia so o texto guia o GIRO: ele diz o que nao pode
        # voltar a aparecer (costela, saia, pernas) e o que tem de seguir o
        # corpo em todas as vistas (o rastro de fumaca).
        'description': (
            'A pixel art game sprite of a specter: a ghost made entirely of glowing '
            'violet vapour, floating. A gaunt screaming skull-like face with empty '
            'glowing eye sockets, pale violet hair streaming up off the head in thin '
            'flames, a thin hollow chest with NO RIBS, two long thin arms with hooked '
            'claw fingers, and NO LEGS: below the chest the body frays into ragged '
            'trailing streamers of smoke of uneven length. NEGATIVE: ribs, skeleton, '
            'bones, skirt, dress, bell shape, legs, feet, clothes, armour, weapon.'
        ),
    },
}

# A GELATINA OCRE (capitulo 4: a Caverna do Eco das Ondas). Grande, baixa e
# larga: quadro de 80, como a aranha. Pela imagem oficial que o dono mandou,
# descrita em texto: uma poca de gosma ocre brilhante, baixa e espalhada, com
# UM pseudopode erguido num arco e dois fiapos finos do outro lado. Sem rosto,
# sem olhos, sem membros. Cores do look `gelatinaOcre`.
# A PRIMEIRA LEVA SO DE TEXTO (`gelatinaOcre-80a82c4a`) saiu um POLVO: cabeca
# redonda, dois olhos e tentaculos de ventosa. O esqueleto `mannequin` e o
# unico que existe para quem nao e quadrupede, e ele puxa para uma criatura
# com cabeca e membros por mais que o texto negue. A saida foi a mesma do
# grick e do stirge: dar a VISTA SUL pronta e deixar o PixelLab so girar. A
# vista sul e a imagem oficial que o dono mandou, reduzida a 46 px de altura
# num quadro de 80 (`_referencias/pixellab/gelatina-ref/reduzir.py`, de graca).
# A VOLTA 3 (`-1fc7506c`) ainda esticou o toco: o texto nao segura o giro. A
# tira abaixo e montada aqui (`src/dev/gelatina-tira.py`, de graca) e vai
# "exatamente como desenhada" -- uma gosma nao tem frente nem costas, entao a
# mesma figura serve para as oito, espelhada nas tres do oeste.
PERSONAGENS['gelatinaOcre'] = {
    'rota': '/create-character-v3',
    'tira': '_referencias/pixellab/gelatina-ref/tira.png',
    'corpo': {
        'name': 'Gelatina ocre',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 80, 'height': 80},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of an ochre jelly, a big amorphous blob of '
            'living slime. ' + ESTILO_HEROI +
            'Slime ramp: ochre yellow-brown, #e8c75a light, #b98a22 mid, #6a4a10 '
            'deep shadow, with a few pale #f2dd86 glossy highlights on the top of '
            'the bulges and a darker #4a3208 wet shadow where it meets the ground. '
            'THE OCHRE JELLY: a low, wide, heavy puddle of thick golden-brown '
            'slime spread out on the ground, its surface smooth, rounded and '
            'glossy like honey, with soft lumpy bulges. Drips and runny tongues of '
            'slime hang off the lower edge. ONE thick PSEUDOPOD rises from the '
            'back of the mass in a tall curved arc, like a blunt hooked arm, and '
            'TWO thin slime tendrils rise on the other side. It has NO FACE, NO '
            'EYES, NO MOUTH, NO HEAD, NO ARMS, NO LEGS and NO BONES: only slime. '
            'Seen from a slightly high three-quarter view, wider than it is tall. '
            'Full body in frame. BACKGROUND: plain, empty. No ground, no shadow, '
            'no scenery, no text. NEGATIVE: anti-aliasing, blur, gradients, '
            'painted rendering, 3D render, face, eyes, mouth, teeth, arms, hands, '
            'legs, feet, creature, animal, slug, snail, cube, green slime, cute.'
        ),
    },
}

# O NEZZNAR, a Aranha Negra (capitulo 4: a Caverna do Eco das Ondas). Medio,
# quadro de 64, do mesmo tamanho da drow. Pelo modelo oficial que o dono
# mandou, descrito em texto: drow magro de cabelo branco comprido, casaco de
# couro escuro em placas, capa cinza de FORRO CARMIM e o cajado preto com a
# aranha de metal no topo. As cores sao as do look `nezznar`
# (`src/art/looks/npcs.js`): o vermelho so aparece onde a capa abre, e e por
# ele que o olho acha o chefe numa sala cinza.
PERSONAGENS['nezznar'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Nezznar',
        'template_id': 'mannequin',
        'view': 'low top-down',
        'image_size': {'width': 64, 'height': 64},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a drow archmage, a male dark elf wizard. '
            + ESTILO_HEROI +
            'Skin ramp: grey-purple, #6e6680 light, #5b5466 mid, #332e3e deep '
            'shadow. Hair: white #f0ece6 light with #bcb8b4 shadow. Coat and '
            'armor: dark charcoal, #39353f light, #242029 mid, #14121a deep. '
            'Cloak outside: dark slate #2e2b38. Cloak lining: bright CRIMSON, '
            '#9e2434 light, #6e1624 deep. Metal trim: #8a8696. Staff: black '
            'wood #1a1620 with a dark metal #4d4858 spider. Eyes: red #e05a6a. '
            'THE DROW: a tall, slender, severe male elf with grey-purple skin, '
            'long pointed ears, white eyebrows, narrow red eyes, a hard frowning '
            'face and LONG WHITE HAIR falling straight past his shoulders. CLOTHES: a high-collared dark charcoal leather coat '
            'layered with sculpted plates over the chest and shoulders, a small '
            'crimson gem at the throat, armored bracers on both forearms, a wide '
            'belt with a crimson gem, dark trousers and tall boots. CLOAK: a long '
            'dark slate cloak hanging from both shoulders, open at the front, its '
            'inner LINING BRIGHT CRIMSON RED, visible where the cloak flares. WEAPON: a tall slim BLACK staff held upright in '
            'his right hand, taller than he is, topped with a black metal SPIDER '
            'with spread legs. POSE: standing facing the viewer, the staff '
            'vertical at his right side, the left hand open at his side. Full '
            'body in frame. BACKGROUND: plain, empty. No ground, no shadow, no '
            'scenery, no web, no text. NEGATIVE: anti-aliasing, blur, gradients, '
            'painted rendering, 3D render, multiple characters, hood, hat, '
            'beard, bald, sword, bow, shield, green skin, pink skin, ponytail.'
        ),
    },
}

# A ARANHA GIGANTE (capitulo 4: as aranhas do Nezznar na Caverna do Eco das
# Ondas). Grande, baixa e larga: quadro de 80. Pelo Livro dos Monstros, uma
# aranha peluda escura do tamanho de um cavalo, oito patas longas e oito olhos.
# Nao ha esqueleto de aranha no PixelLab; o `cat` e o quadrupede mais baixo.
PERSONAGENS['aranhaGigante'] = {
    'rota': '/create-character-v3',
    'corpo': {
        'name': 'Aranha gigante',
        'template_id': 'cat',
        'view': 'low top-down',
        'image_size': {'width': 80, 'height': 80},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'enhance_prompt': False,
        'description': (
            'A pixel art game sprite of a giant spider, a monstrous hairy spider as '
            'big as a horse. ' + ESTILO_HEROI +
            'Body ramp: dark charcoal brown, #5e5048 light, #3e342e mid, #1e1916 '
            'deep shadow, covered in short bristly hairs. Markings: a dull blood-red '
            '#8a2a22 hourglass pattern on top of the abdomen and red bands on the '
            'leg joints. Fangs: glossy black with ivory tips. Eyes: EIGHT small '
            'glossy red #e04a3a eyes clustered on the front of the head. THE GIANT '
            'SPIDER: a big bulbous round ABDOMEN at the back, a smaller head and '
            'thorax at the front with two large curved FANGS (chelicerae) and two '
            'short pedipalps. EXACTLY EIGHT long jointed hairy LEGS, four on each '
            'side, arching high above the body and spread wide on the ground. Body '
            'low to the ground in a crouching hunting stance, front legs raised '
            'slightly. Three-quarter view from above, the whole spider readable. '
            'Full body in frame. BACKGROUND: plain, empty. No ground, no shadow, no '
            'web, no scenery, no text. NEGATIVE: anti-aliasing, blur, gradients, '
            'painted rendering, 3D render, multiple animals, insect wings, six '
            'legs, ten legs, human face, cute, tarantula toy, scorpion tail.'
        ),
    },
}


def imagens_da_tira(caminho):
    """Vista sul como referencia e as outras sete como direcoes prontas."""
    import base64
    import io
    from PIL import Image
    tira = Image.open(RAIZ / caminho).convert('RGBA')
    lado = tira.width // len(DIRECOES)

    def b64(i):
        buf = io.BytesIO()
        tira.crop((i * lado, 0, (i + 1) * lado, tira.height)).save(buf, format='PNG')
        return {'type': 'base64', 'base64': base64.b64encode(buf.getvalue()).decode(),
                'format': 'png'}
    return b64(0), {d: b64(i) for i, d in enumerate(DIRECOES) if i}


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
        return {'_erro': e.code, '_detalhe': e.read().decode(errors='replace')[:900]}


def achar_id(resp):
    """A resposta das duas rotas nao tem o mesmo formato; o id pode vir em lugares diferentes."""
    if not isinstance(resp, dict):
        return None
    for k in ('character_id', 'id', 'new_character_id'):
        if isinstance(resp.get(k), str):
            return resp[k]
    for v in resp.values():
        if isinstance(v, dict):
            achado = achar_id(v)
            if achado:
                return achado
    return None


def main():
    p = argparse.ArgumentParser()
    p.add_argument('chaves', nargs='+', choices=sorted(PERSONAGENS))
    p.add_argument('--go', action='store_true')
    a = p.parse_args()

    for chave in a.chaves:
        corpo = PERSONAGENS[chave]['corpo']
        if 'tira' in PERSONAGENS[chave]:
            corpo['reference_image'], corpo['direction_images'] = imagens_da_tira(
                PERSONAGENS[chave]['tira'])
        elif 'referencia' in PERSONAGENS[chave]:
            # So a vista SUL, ja em pixel art: o v3 gira nas outras sete.
            import base64
            dados = (RAIZ / PERSONAGENS[chave]['referencia']).read_bytes()
            corpo['reference_image'] = {'type': 'base64', 'format': 'png',
                                        'base64': base64.b64encode(dados).decode()}
        for campo, teto in LIMITES.items():
            if campo in corpo and len(corpo[campo]) > teto:
                raise SystemExit(f'{chave}: {campo} tem {len(corpo[campo])} '
                                 f'caracteres, o teto e {teto}')

    token = os.environ.get('PIXELLAB_TOKEN')
    if not token:
        raise SystemExit('defina PIXELLAB_TOKEN no ambiente')

    saldo = chamar(token, 'GET', '/balance')['subscription']['generations']
    print(f'saldo: {saldo:.0f}')
    for chave in a.chaves:
        c = PERSONAGENS[chave]
        texto = c['corpo'].get('description') or c['corpo'].get('edit_description')
        print(f'\n{chave}: POST {c["rota"]}  ({len(texto)} caracteres)')
    if not a.go:
        print('\n(seco: nada foi enviado. use --go)')
        return

    registro = json.loads(REGISTRO.read_text(encoding='utf-8')) if REGISTRO.exists() else {
        'goblin': GUERREIRO}
    pendentes = {}
    for chave in a.chaves:
        c = PERSONAGENS[chave]
        r = chamar(token, 'POST', c['rota'], c['corpo'])
        if '_erro' in r:
            print(f'\n{chave}: HTTP {r["_erro"]}  {r["_detalhe"]}')
            continue
        cid = achar_id(r)
        print(f'\n{chave}: id {cid}  ({json.dumps(r)[:200]})')
        if cid:
            pendentes[chave] = cid
            registro[chave] = cid
    REGISTRO.write_text(json.dumps(registro, indent=2) + '\n', encoding='utf-8')

    inicio = time.time()
    while pendentes and time.time() - inicio < 1800:
        for chave, cid in list(pendentes.items()):
            d = chamar(token, 'GET', f'/characters/{cid}')
            st = d.get('status')
            if st == 'completed':
                destino = RAIZ / '_referencias' / 'pixellab' / f'{chave}-{cid[:8]}'
                destino.mkdir(parents=True, exist_ok=True)
                (destino / 'meta.json').write_text(json.dumps(d, indent=2), encoding='utf-8')
                z = destino / 'folha.zip'
                z.write_bytes(chamar(token, 'GET', f'/characters/{cid}/spritesheet', bruto=True))
                with zipfile.ZipFile(z) as f:
                    f.extractall(destino)
                print(f'{chave}: pronto em {int(time.time()-inicio)}s -> {destino}')
                del pendentes[chave]
            elif st == 'failed':
                print(f'{chave}: FALHOU  {json.dumps(d)[:400]}')
                del pendentes[chave]
        if pendentes:
            time.sleep(15)

    fim = chamar(token, 'GET', '/balance')['subscription']['generations']
    print(f'\nsaldo depois: {fim:.0f}  (gastou {saldo - fim:.0f})')


if __name__ == '__main__':
    main()
