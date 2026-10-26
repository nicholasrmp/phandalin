# -*- coding: utf-8 -*-
"""
UMA IMAGEM SO, pela rota mais barata do PixelLab (`/create-image-pixen`).

PARA QUE SERVE: julgar o DESENHO antes de pagar o giro. `create-character-v3`
do zero custa 1 geracao pelo sprite mais 1 pelo giro das oito vistas; se o
desenho sai errado, as duas foram embora. Aqui sai so a vista da frente, por
uma geracao, e o giro so e pedido depois que o dono aprova.

Uso:
    PIXELLAB_TOKEN=... python src/dev/imagem-pixellab.py --chave espectro --go

Seco sem `--go`: imprime o plano e o saldo. As descricoes vivem em `IMAGENS`,
e a aprovada vira a vista sul de um personagem em `criar-pixellab.py`
(`'referencia'`), que e o mesmo caminho do grick e do stirge.

EDITAR UMA IMAGEM QUE JA EXISTE (`--editar`): `/edit-image-pixen` recebe a
imagem e uma frase e devolve a MESMA figura com so o pedido mudado -- pose,
composicao e pixel preservados. Serve para consertar a vista sul ANTES do
giro: consertada uma vez ali, o giro leva o conserto as oito vistas. Editar as
oito depois do giro custou 25 geracoes por 4 quadros no dragao, e saiu tosco.

    PIXELLAB_TOKEN=... python src/dev/imagem-pixellab.py --editar dragao-bracos --go
"""
import argparse
import base64
import importlib.util
import json
import os
import time
from pathlib import Path

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parents[1]
_spec = importlib.util.spec_from_file_location('cp', AQUI / 'criar-pixellab.py')
cp = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(cp)
_spec2 = importlib.util.spec_from_file_location('ep', AQUI / 'editar-pixellab.py')
ep = importlib.util.module_from_spec(_spec2)
_spec2.loader.exec_module(ep)

# O ESPECTRO, tentativa 2. A primeira (`espectro-ff26541c`) foi recusada pelo
# dono: "parece um esqueleto de peruca e de saia". O modelo desenhou TRES
# pecas fechadas -- tronco com costelas, cabelo de contorno proprio e uma saia
# de lobulos redondos -- quando o espectro das imagens dele e UMA COISA SO, um
# vulto de vapor que se desfaz. O texto daqui ataca exatamente isso: nada de
# costela, nada de barra fechada embaixo, o cabelo saindo da cabeca como
# labareda e a metade de baixo esfiapada em tiras de larguras diferentes.
IMAGENS = {
    # TENTATIVA 3. A 2 (`pixen.png`) saiu ILEGIVEL: o texto tinha 2.120
    # caracteres e o Pixen a 64 px nao da conta -- ele desenha cada clausula e
    # o resultado vira ruido. A regra que sai daqui: num quadro pequeno, o
    # texto tem de ser CURTO e dizer a SILHUETA, nao o inventario de detalhes.
    'espectro': {
        'image_size': {'width': 64, 'height': 64},
        'outline': 'single color black outline',
        'detail': 'low detail',
        'view': 'low top-down',
        'direction': 'south',
        'no_background': True,
        'description': (
            'A glowing violet ghost facing the viewer: a screaming skull face with '
            'white glowing eyes, wild pale hair, two thin arms with claws reaching '
            'forward, and NO legs -- below the chest the purple body trails away '
            'into smoke. Flat purple colours, black outline, clear simple shape.'
        ),
    },
    # O WRAITH (Mormesk, a aparicao da Caverna do Eco das Ondas). Leitura
    # OPOSTA a do espectro de proposito (ver o look `wraith`): ele e quase
    # PRETO, o brilho e amarelo QUENTE em vez de branco-violeta frio, a cara
    # fica enterrada num elmo e o corpo AFINA para baixo em vez de alargar.
    # Texto CURTO, que foi o que o Pixen aceitou no espectro.
    'wraith': {
        'image_size': {'width': 72, 'height': 72},
        'outline': 'single color black outline',
        'detail': 'low detail',
        'view': 'low top-down',
        'direction': 'south',
        'no_background': True,
        # TENTATIVA 2. A 1 (`pixen.png`) virou um CAVALEIRO FANTASMA: elmo de
        # aco polido, ombreiras e dourado nos bracos. A imagem que o dono
        # mandou e o oposto -- carvao e cinza, sem brilho de metal e sem
        # ornamento, com uma coroa de espinhos finos e a cara virada um buraco
        # preto onde so os olhos acendem.
        'description': (
            'A wraith facing the viewer: a tall figure made of dark grey and black '
            'SMOKE. Its head wears a thin crown of crooked spikes, and the face is '
            'a black hollow with two small glowing yellow eyes. Two very long thin '
            'arms reach down and out, the hands ending in long thin claws. It has '
            'NO legs: the body trails away downward into ragged smoke. Charcoal '
            'grey and black only, no colour except the yellow eyes. No armour, no '
            'metal shine, no gold, no cloak, no robe.'
        ),
    },
    # A CAVEIRA CANDENTE (Mormesk guarda uma? nao: ela e a da Caverna do Eco
    # das Ondas). O look manda a INVERSAO que faz a figura: a chama e VERDE e
    # as orbitas sao VERMELHO-LARANJA. A versao anterior do projeto tinha
    # chama laranja com orbita azul, e o olhar caia na fogueira em vez de cair
    # na cabeca -- que e o que o jogador precisa mirar. Texto curto.
    'caveiraCandente': {
        'image_size': {'width': 56, 'height': 56},
        'outline': 'single color black outline',
        'detail': 'low detail',
        'view': 'low top-down',
        'direction': 'south',
        'no_background': True,
        'description': (
            'A flaming skull floating in the air, facing the viewer: a bare human '
            'skull of pale bone with no body, no neck and no jawbone attached, '
            'wrapped in bright GREEN fire that streams upward off the top and sides '
            'of the skull. Inside the two empty eye sockets burn small RED-ORANGE '
            'embers. Green flames, pale bone, red eye sockets, black outline.'
        ),
    },
    # O SPECTATOR (capitulo 4: a Caverna do Eco das Ondas). LICENCA: o nome e
    # o conceito sao conteudo de fa; a ARTE e nossa, e o texto daqui descreve
    # o que o LOOK do projeto define, nao uma ilustracao oficial. As cores sao
    # as de la: escama verde-oliva em valor MEDIO (entre o vigia quase preto e
    # a caveira verde-limao), goela e lingua rosadas como os unicos pontos
    # quentes, iris azul-acinzentada no olho central e olhos amarelos nas
    # hastes. O vaivem entre o olho frio em cima e a boca quente embaixo e o
    # que faz uma bola parecer que tem duas coisas acontecendo nela.
    'spectator': {
        # TENTATIVA 4, e a alavanca que faltava: GERAR GRANDE E REDUZIR. As
        # tres primeiras foram desenhadas direto em 64 px e sairam granuladas,
        # com as hastes boiando soltas -- a 64 px o modelo nao tem pixels para
        # separar bola, boca e tentaculos. Em 128 ele tem, e a reducao depois
        # e nossa, com a paleta travada. O teto da rota e area de 512x512.
        'image_size': {'width': 128, 'height': 128},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'view': 'low top-down',
        'direction': 'south',
        'no_background': True,
        # TENTATIVA 3. As duas primeiras saíram granuladas e com as hastes
        # BOIANDO soltas em volta da bola, porque eu as descrevi como "stalks"
        # finas. Pela imagem que o dono mandou elas sao TENTACULOS grossos e
        # curvos, presos ao corpo, e a boca e enorme e ABERTA com a lingua
        # pendurada para fora -- e a boca, nao o olho, que ocupa metade da
        # figura. A silhueta e o que importa num quadro de 64.
        'description': (
            'A cruel, menacing floating monster facing the viewer: a round scaly '
            'dark olive-green body like a '
            'ball, bristling with sharp spikes. In the upper half of the body there '
            'is ONE SINGLE ENORMOUS EYE, one eye only, centred, as wide as a third '
            'of the whole body, NARROWED into a hateful glare under a heavy bony '
            'brow -- NOT a pair of eyes, NOT two eyes. Below it a HUGE '
            'WIDE OPEN MOUTH filling the lower half of the body, crowded with long '
            'uneven jagged fangs and a deep dark red gullet, with a long pink TONGUE '
            'hanging down out of it below the body. FOUR thick green TENTACLES grow '
            'from the body and curve outward and upward, each one ending in a round '
            'yellow eye. No arms, no legs, no wings: it floats. Green scales, pink '
            'mouth and tongue, yellow eyes, black outline. NEGATIVE: two eyes, a pair '
            'of eyes, face with two eyes, nose, eyebrows.'
        ),
    },
    # OS TRES INFECTADOS de Thundertree. Gerados em 128 px e reduzidos depois,
    # que foi a licao do spectator: em 64 o modelo nao separa as partes.
    #
    # A FAMILIA SE LE PELA MADEIRA, e o que muda e quanto de vida sobrou --
    # galho morto marrom, espeto ressecado cinza, vinha verde. Cada texto diz
    # a mesma silhueta de base (um vulto vagamente humanoide feito de planta)
    # e UMA coisa que so aquele tem: os galhos retorcidos, as agulhas, as
    # vinhas. E assim que os tres parecem parentes sem parecerem o mesmo.
    # A PRIMEIRA LEVA SAIU DA DESCRICAO ESCRITA do livro e da paleta do
    # projeto, sem a arte oficial -- eu nao a tinha. O dono mandou as tres
    # imagens depois, e elas desmentem o que eu tinha desenhado em tres
    # pontos: a cor (o espeto e QUASE PRETO, nao madeira clara), o material
    # (o galho e TIRA DE CASCA trancada, nao graveto solto) e a brasa (nao
    # existe brasa no peito de nenhum dos tres; a luz, quando ha, e um OLHO).
    # Os textos abaixo descrevem as imagens oficiais; a arte continua sendo
    # nossa, desenhada do zero a partir dessa descricao.
    'galhoInfectado': {
        'image_size': {'width': 128, 'height': 128},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'view': 'low top-down',
        'direction': 'south',
        'no_background': True,
        'description': (
            'A plant creature standing upright and facing the viewer, made entirely '
            'of long twisted STRIPS OF GREY-BROWN BARK and dry twigs woven and '
            'braided together into a tall gaunt humanoid: braided bark legs, a '
            'braided bark chest, long thin arms with loose frayed bark strands '
            'hanging off them like rags. Its head is a crown of jagged splintered '
            'twigs pointing upward, with two small dark hollows where eyes would '
            'be and a faint orange glint deep inside them. Weathered grey and brown '
            'bark, pale grey highlights, black outline. NEGATIVE: leaves, flowers, '
            'green, glowing chest, face, mouth, teeth, muscles, person in a costume.'
        ),
    },
    'espetoInfectado': {
        'image_size': {'width': 128, 'height': 128},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'view': 'low top-down',
        'direction': 'south',
        'no_background': True,
        'description': (
            # TRES TENTATIVAS ERRADAS ate o dono dizer a frase que resolve: o
            # espeto e "um GALHO HUMANOIDE ESPINHOSO". Ou seja, e o MESMO ser do
            # galho infectado -- madeira trancada em forma de gente --, so que
            # eriçado de espinhos e mais escuro. Eu vinha descrevendo um bicho
            # coberto de agulhas, e o modelo entregava bicho; descrevi um homem
            # coberto de agulhas, e ele entregou homem. Faltava dizer MADEIRA.
            'A plant creature shaped like a person, facing the viewer: a tall gaunt '
            'humanoid built entirely of dark twisted BRANCHES AND BARK woven '
            'together -- branch legs, a braided branch chest, long thin branch arms '
            'hanging at its sides, and a head made of a knot of twigs. It is the '
            'same kind of wooden creature as a walking dead bush. Its whole body '
            'BRISTLES WITH LONG SHARP THORNS AND NEEDLES standing out from the '
            'head, shoulders, back, arms and legs. The wood is very dark, almost '
            'black-brown. NO FACE: no mouth, no nose, no snout -- only TWO SMALL '
            'RED GLOWING POINTS deep in the twigs of the head. Dark wood with '
            'grey highlights on the thorn tips, black outline. NEGATIVE: four '
            'legs, quadruped, animal, beast, fur, skin, flesh, bare chest, snout, '
            'muzzle, tail, leaves, flowers, green, glowing chest, person in a '
            'costume.'
        ),
    },
    'vinhaInfectada': {
        'image_size': {'width': 128, 'height': 128},
        'outline': 'single color black outline',
        'detail': 'medium detail',
        'view': 'low top-down',
        'direction': 'south',
        'no_background': True,
        'description': (
            'A plant creature standing and facing the viewer, built from HANGING '
            'TEAL-GREEN VINES: hundreds of long wet strands of vine draped over a '
            'humanoid shape, hanging down off the arms and from the shoulders like '
            'a curtain and trailing on the ground, so the figure has no clear feet. '
            'The head is bowed, covered by hanging tendrils, with two small dark '
            'hollows for eyes. Dark teal and blue-green vines, pale yellow-green at '
            'the tips, black outline. NEGATIVE: brown wood, bark, dry twigs, '
            'needles, leaves, flowers, glowing chest, mouth, teeth, person in a '
            'costume.'
        ),
    },
}


# AS EDICOES: uma imagem que ja existe mais uma frase (ate 500 caracteres).
#
# AS DUAS DO DRAGAO FALHARAM, e ficam aqui para ninguem pagar de novo pela mesma
# aposta. O editor do Pixen preserva pose e estilo quando o pedido TROCA uma
# coisa (cor, roupa); quando o pedido ACRESCENTA anatomia, ele reinterpreta o
# bicho inteiro. A 1a tirou as asas e fez um homem-lagarto de academia; a 2a
# manteve as asas mas desenhou um LAGARTINHO agarrado no peito, lendo "como as
# patas de um lagarto" ao pe da letra. Silhueta igual so 45,7% e 63,0% -- uma
# edicao que so acrescenta bracos fica acima de 90%. Duas geracoes no total.
# Membro novo se resolve no DESENHO de origem, nao no editor.
EDICOES = {
    # O DRAGAO DO DONO lia como wyvern. No desenho dele as patas da frente sao
    # duas garrinhas penduradas na altura do joelho, quase confundidas com a
    # asa e a perna; o giro foi fiel e, de lado e de costas, sobraram duas
    # pernas e duas asas. A frase pede bracos de verdade -- grossos como as
    # pernas, dobrados no cotovelo, para a frente da barriga -- e manda manter
    # o resto, que o dono desenhou e aprovou.
    'dragao-bracos': {
        'fonte': '_referencias/pixellab/dragaoVerde-ref/dono-sul.png',
        'description': (
            'Give this dragon two clearly visible front arms. Two thick muscular '
            'front legs come out of its chest and shoulders, bent at the elbow '
            'and held forward in front of the belly, each ending in a hand of '
            'curved orange-gold claws. They are as thick as the hind legs and '
            'clearly separate from the wings. Keep everything else exactly the '
            'same: the pose, the two hind legs, the wings, the head, the horns, '
            'the crest, the red eye, the colours and the size.'
        ),
    },
    # TENTATIVA 2. A primeira (1 geracao) arrancou as asas e fez um homem-lagarto
    # de academia: peitoral, abdomen, bracos pendendo como os de uma pessoa. Dois
    # gatilhos no pedido: "muscular" puxou o tronco humano, e "mantenha as asas"
    # veio no FIM, depois de tres frases sobre bracos. Aqui a ordem inverte -- o
    # que fica vem primeiro --, as patas sao de REPTIL, e o peito humano e
    # proibido na letra.
    'dragao-bracos-2': {
        'fonte': '_referencias/pixellab/dragaoVerde-ref/dono-sul.png',
        'description': (
            'This is a winged dragon. Keep its two big wings exactly as they are, '
            'hanging down at its sides. Keep the long neck, the head, the horns, '
            'the crest, the red eye, the hind legs, the tail and the colours exactly '
            'the same. Only add two small scaly reptile forelegs, like the front legs '
            'of a lizard, coming out of the chest under the neck and bent forward in '
            'front of the belly, with orange-gold claws. Not a person: no human '
            'chest, no abs.'
        ),
    },
}


def editar(token, chave, go, saida):
    """Uma edicao de imagem: manda, espera o trabalho, grava o resultado."""
    from PIL import Image
    ed = EDICOES[chave]
    fonte = RAIZ / ed['fonte']
    w, h = Image.open(fonte).size
    if w > 256 or h > 256 or w % 4 or h % 4:
        raise SystemExit(f'{fonte.name}: {w}x{h} -- a rota quer lados <= 256 e multiplos de 4')
    corpo = {
        'image': {'type': 'base64', 'base64': base64.b64encode(fonte.read_bytes()).decode(), 'format': 'png'},
        'description': ed['description'],
        'width': w, 'height': h,
        'no_background': True,
    }
    saldo = cp.chamar(token, 'GET', '/balance')['subscription']
    print(f'{chave}: POST /edit-image-pixen  {fonte.name} {w}x{h}  ({len(ed["description"])} caracteres)')
    print(f'saldo: {saldo["generations"]:.0f}')
    if not go:
        print('\n(seco: nada foi gerado. use --go)')
        return
    r = cp.chamar(token, 'POST', '/edit-image-pixen', corpo)
    if '_erro' in r:
        raise SystemExit(f'{r["_erro"]}: {r["_detalhe"]}')
    job = r.get('background_job_id')
    print(f'trabalho {job}  usage={json.dumps(r.get("usage"))}')
    inicio = time.time()
    while True:
        j = cp.chamar(token, 'GET', f'/background-jobs/{job}')
        estado = j.get('status') if isinstance(j, dict) else None
        if estado == 'completed':
            break
        if estado in ('failed', 'error') or (isinstance(j, dict) and j.get('_erro') not in (None, 423)):
            raise SystemExit(f'falhou: {json.dumps(j)[:600]}')
        if time.time() - inicio > 900:
            raise SystemExit('demorou mais de 15 minutos')
        time.sleep(6)
    imgs = ep.imagens_em(j)
    if not imgs:
        raise SystemExit(f'concluido, mas sem imagem: {json.dumps(j)[:600]}')
    destino = Path(saida or RAIZ / '_referencias' / 'pixellab' / 'edicoes' / chave / 'editada.png')
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_bytes(base64.b64decode(imgs[0]))
    print(f'pronto em {time.time() - inicio:.0f}s -> {destino}')
    depois = cp.chamar(token, 'GET', '/balance')['subscription']
    print(f'saldo depois: {depois["generations"]:.0f}  '
          f'(gastou {saldo["generations"] - depois["generations"]:.0f})')


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--chave', choices=sorted(IMAGENS))
    p.add_argument('--editar', choices=sorted(EDICOES), help='edita uma imagem que ja existe')
    p.add_argument('--go', action='store_true')
    p.add_argument('--saida', default=None)
    a = p.parse_args()
    if not a.chave and not a.editar:
        raise SystemExit('passe --chave ou --editar')

    token = os.environ.get('PIXELLAB_TOKEN')
    if not token:
        raise SystemExit('defina PIXELLAB_TOKEN no ambiente')
    if a.editar:
        editar(token, a.editar, a.go, a.saida)
        return
    corpo = dict(IMAGENS[a.chave])
    saldo = cp.chamar(token, 'GET', '/balance')['subscription']
    print(f'{a.chave}: POST /create-image-pixen  ({len(corpo["description"])} caracteres)')
    print(f'saldo: {saldo["generations"]:.0f}')
    if not a.go:
        print('\n(seco: nada foi gerado. use --go)')
        return

    r = cp.chamar(token, 'POST', '/create-image-pixen', corpo)
    if '_erro' in r:
        raise SystemExit(f'{r["_erro"]}: {r["_detalhe"]}')
    destino = Path(a.saida or RAIZ / '_referencias' / 'pixellab'
                   / f'{a.chave}-ref' / 'pixen.png')
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_bytes(base64.b64decode(r['image']['base64']))
    print(f'{a.chave}: -> {destino}')
    print('usage:', json.dumps(r.get('usage')))
    depois = cp.chamar(token, 'GET', '/balance')['subscription']
    print(f'saldo depois: {depois["generations"]:.0f}  '
          f'(gastou {saldo["generations"] - depois["generations"]:.0f})')


if __name__ == '__main__':
    main()
