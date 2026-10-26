# -*- coding: utf-8 -*-
"""
O Toblen e os frequentadores da TAVERNA no PixelLab (MULTIJOGADOR.md, T-09 e T-15).

ISTO GASTA GERACOES. Sem `--go` so imprime o plano e o saldo.

    PIXELLAB_TOKEN=<token> python -P src/dev/taverna-personagens-pixellab.py toblen
    PIXELLAB_TOKEN=<token> python -P src/dev/taverna-personagens-pixellab.py toblen magoVermelho --go

So CRIA as oito vistas (`create-character-v3`, do zero, quadro de 64 como o Sildar).
Animar e outra etapa, e so depois de o dono aprovar a figura: mostre as oito vistas e
espere o ok. Os ids criados vao para `pixellab-personagens.json`, ao lado de
`criar-pixellab.py`, e as folhas para `_referencias/pixellab/<chave>-<id>/`.

Reaproveita `criar-pixellab.py` inteiro (a rota, o registro, a espera e o download):
este arquivo so ACRESCENTA personagens ao dicionario dele e chama o `main` dele.

Sao inspirados na pintura de referencia do dono (a taverna de madeira e tijolo), mas sao
desenhos novos: nenhuma figura copia a pintura.

O token vem SO da variavel de ambiente, nunca de arquivo.
"""
import importlib.util
from pathlib import Path


def carregar(nome_do_arquivo, apelido):
    spec = importlib.util.spec_from_file_location(apelido, Path(__file__).with_name(nome_do_arquivo))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


cri = carregar('criar-pixellab.py', 'criar_pixellab')
ESTILO = cri.ESTILO_HEROI

FIM = (
    'Full body in frame, standing in a relaxed, readable pose facing the viewer. BACKGROUND: '
    'plain, empty. No ground, no shadow, no scenery, no text. NEGATIVE: anti-aliasing, blur, '
    'gradients, painted rendering, 3D render, multiple characters, '
)


def npc(nome, descricao, nao=''):
    return {
        'rota': '/create-character-v3',
        'corpo': {
            'name': nome,
            'template_id': 'mannequin',
            'view': 'low top-down',
            'image_size': {'width': 64, 'height': 64},
            'outline': 'single color black outline',
            'detail': 'medium detail',
            'enhance_prompt': False,
            'description': f'A pixel art game sprite of {descricao} {FIM}{nao or "extra limbs"}.',
        },
    }


# Toblen Stonehill, o dono da Estalagem Stonehill (o livro o descreve como um homem amigavel e
# simples). Careca e de bigode, avental de couro por cima da camisa de mangas arregacadas, uma
# caneca e um pano nas maos: e o taverneiro que fica atras do balcao (T-09).
cri.PERSONAGENS['toblen'] = npc(
    'Toblen Stonehill, o taverneiro',
    'a friendly, stocky middle-aged human innkeeper. ' + ESTILO +
    'Skin ramp: ruddy, #eab08a light, #c4825f mid, #7c4a34 deep. Bald head with a fringe of '
    'short grey-brown hair at the sides, a thick brown handlebar moustache, round cheerful face. '
    'Shirt: cream linen #e8dcc0 light, #b8a888 mid, #6e6048 deep, with the sleeves rolled up to '
    'the elbows. Apron: dark brown leather #7a5a38 light, #5a3e24 mid, #34220f deep, tied at the '
    'waist, with a white cloth hanging from the belt. Trousers: dark brown. Boots: black-brown. '
    'POSE: broad and sturdy, a pewter mug held in the right hand and a white rag in the left, '
    'as if wiping a drink. ',
    'hat, hair on top of the head, beard')

# O mago velho de chapeu e manto vermelhos, de barba longa e branca e um cachimbo.
cri.PERSONAGENS['magoVermelho'] = npc(
    'Mago velho de chapeu vermelho',
    'an elderly human wizard regular of a tavern. ' + ESTILO +
    'Skin ramp: pale, #f0cfb0 light, #cf9d80 mid, #85604c deep. A very long white beard '
    '#f4f0e8 light, #c4bdb0 mid, #7e786e deep, and bushy white eyebrows. Tall pointed hat and a '
    'long robe of red #c8402a light, #8c2418 mid, #50120c deep, with a gold #d8b04a trim and '
    'a few gold stars. Brown leather belt with a small pouch. Boots: dark brown. POSE: standing '
    'a little stooped, a wooden pipe in the right hand and a dark wooden walking staff in the '
    'left, wise and amused. ',
    'sword, shield, armour')

# O aventureiro de chapeu roxo de ponta e colete de couro, com uma bolsa a tiracolo.
cri.PERSONAGENS['chapeuRoxo'] = npc(
    'Aventureiro de chapeu roxo',
    'a wiry human traveller adventurer. ' + ESTILO +
    'Skin ramp: tanned, #e0a67e light, #b87a58 mid, #70442e deep. Short light-brown hair and a '
    'thin goatee. A tall floppy pointed hat of purple #7a4aa8 light, #55307c mid, #321a4c deep with '
    'a small brass buckle. Tunic: cream shirt with a brown leather vest #8a5a30 light, #5e3c1e mid, '
    '#37210e deep, and a wide belt. Dark trousers tucked into brown boots. A brown leather satchel '
    'slung across the body on the left hip. POSE: relaxed, thumbs hooked in the belt. ',
    'sword drawn, shield')

# O lenhador de barba preta e camisa xadrez, que joga carta.
cri.PERSONAGENS['lenhador'] = npc(
    'Lenhador de camisa xadrez',
    'a big bearded human lumberjack. ' + ESTILO +
    'Skin ramp: ruddy, #e8aa84 light, #c07c58 mid, #76462e deep. Thick black beard and short '
    'black hair, a knitted dark blue-grey cap #4a5468. Shirt: red and black plaid flannel '
    '#c03a2a light red, #2a2024 black squares, sleeves rolled up over hairy forearms. Brown '
    'canvas trousers #7a5a3c and heavy dark boots. A wide leather belt with an axe hanging at '
    'the hip. POSE: broad shoulders, holding a fan of playing cards in the right hand against his chest. ',
    'weapon drawn')

# O corsario de bandana vermelha e colete aberto, com uma faca.
cri.PERSONAGENS['corsario'] = npc(
    'Corsario de bandana vermelha',
    'a rough human sailor-pirate. ' + ESTILO +
    'Skin ramp: sun-weathered, #e0a07a light, #b4704e mid, #6c3e2a deep. A red bandana #c8402a '
    'light, #8c2418 mid, #50120c deep tied over the hair, short dark stubble beard, a pale scar '
    'across one cheek. A sleeveless grey-brown vest #8a8478 open over a bare muscular chest, '
    'a wide dark leather belt with a brass buckle, ragged knee-length dark trousers, bare '
    'forearms with a rope bracer. POSE: leaning forward a little, a short knife held low in the '
    'right hand. ',
    'hat, armour')

# A jogadora mascarada de capuz e capa roxos.
cri.PERSONAGENS['mascarada'] = npc(
    'Jogadora mascarada de capa roxa',
    'a mysterious human woman gambler. ' + ESTILO +
    'Skin ramp: pale, #f2d4bc light, #d0a088 mid, #86604e deep. A white half-mask #f4f0e8 light, '
    '#c4bdb0 mid, #7e786e deep over the eyes with dark violet eye slits. Hood and cape of deep '
    'purple #7a4aa8 light, #55307c mid, #321a4c deep, lined with dark violet, a black corset-like '
    'bodice with silver studs and pale arms. Dark trousers and tall black boots. POSE: standing '
    'poised, a fan of playing cards held in the right hand, the left hand on her hip. ',
    'weapon')


if __name__ == '__main__':
    cri.main()
