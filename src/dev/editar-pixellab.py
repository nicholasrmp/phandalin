# -*- coding: utf-8 -*-
"""
Edita quadros de um personagem do PixelLab com uma frase, mantendo a pose.

ISTO GASTA GERACOES DA CONTA. Sem `--go` o script so imprime o pedido.

POR QUE ESTA ROTA E NAO A EDICAO DE PERSONAGEM.

A `create-character-state` cria um personagem NOVO a partir de outro e
custa caro -- as duas edicoes dos goblins derrubaram o saldo em perto de 80.
A `edit-animation-v2` pega quadros que ja existem e aplica uma frase a todos
de uma vez, "mantendo a coerencia entre quadros". Ate 9 quadros de 65-80 px
cabem num pedido so. E a ferramenta planejada para as trocas de armadura e de
arma dos herois: a pose fica, so a roupa muda.

Aqui ela e usada tambem para PREVIA: as 8 vistas paradas de um personagem vao
como se fossem quadros de uma animacao. O texto da edicao pede para manter a
direcao de cada quadro, porque o modelo foi feito para quadros que se
sucedem, nao para vistas de direcoes diferentes.
"""
import argparse
import base64
import io
import json
import os
import time
import urllib.error
import urllib.request
from pathlib import Path
from PIL import Image

BASE = 'https://api.pixellab.ai/v2'
RAIZ = Path(__file__).resolve().parents[2]
DIRECOES = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west',
            'west', 'south-west']

# O que fica igual em toda edicao de armadura da Dara: o que a faz ser ela.
_DARA_MANTEM = (
    ' Keep the cream-white tabard with the red trim, the leather belt and the '
    'trouser flaps. Keep everything else exactly the same: the red dragonborn '
    'head, horns and amber eyes, the clawed hands and feet, the steel heater '
    'shield with the red dragon emblem, the longsword, the pose, the direction '
    'each frame is facing and the colours.'
)

# As seis armaduras do jogo em seis desenhos. A Dara ja nasceu de placas.
EDICOES = {
    # O DRAGAO VERDE: a rotacao encolheu as garras dianteiras.
    #
    # RECUSADA PELO DONO -- a folha boa e a ORIGINAL, sem esta edicao. Fica
    # aqui para ninguem gastar as 25 geracoes de novo. O conserto funcionou
    # tecnicamente (silhueta 90,6-95,8% preservada, massa +2,7 a +8,5%, zero
    # pixel solto), mas as garras que ele desenha sao grandes e estendidas, e
    # ai quem passa a destoar e a vista SUL -- a aprovada --, cujas garras sao
    # pequenas e recolhidas, mais as tres de costas, que nao tem garra nenhuma.
    # Um bando coerente de membro dianteiro discreto ficou melhor que quatro
    # vistas com garra grande e quatro sem. Saida em
    # `_referencias/pixellab/edicoes/dragao-garras-RECUSADA`.
    #
    # A vista sul aprovada tem duas garras dianteiras erguidas junto ao peito,
    # com dedos. Nas sete rotacoes elas viraram tocos no ombro, e na south-west
    # sumiram: o peito ficou liso. E a mesma falha ja vista no draconato (cauda
    # inventada) e no guerreiro (escudo sumido no ataque) -- a rotacao perde
    # peca pequena. O segundo ataque do bicho na ficha e Garra, 2d6+4, duas por
    # turno; sem garra visivel a animacao de ataque nao teria o que mover.
    'dragao-garras': (
        'Give this dragon back its two FRONT LIMBS. It must have two muscular '
        'front legs that come out of its chest and shoulders, each bent at the '
        'elbow and ending in a hand of four long curved claws, held up in front '
        'of the chest. They are real limbs, thick as the hind legs, not small '
        'stubs and not hidden. Keep the direction each frame faces exactly as '
        'it is. Keep everything else exactly the same: the two hind legs, the '
        'two spread wings and their pale yellow-green membranes, the long tail, '
        'the backswept crest of spikes on the head, the row of spines down the '
        'neck and back, the olive green scales, the pale belly, the pose, the '
        'size and the position in the frame.'
    ),
    'dara-malha': ('Replace the polished steel plate armor with a full chain mail '
                   'hauberk of small riveted steel rings, with long mail sleeves, '
                   'worn over a padded gambeson.' + _DARA_MANTEM),
    'dara-escamas': ('Replace the polished steel plate armor with scale mail: a '
                     'coat of overlapping steel scales like fish scales down to '
                     'the thighs, worn over a leather jerkin.' + _DARA_MANTEM),
    'dara-couro': ('Replace the polished steel plate armor with a fitted brown '
                   'leather cuirass with leather shoulder guards and leather '
                   'bracers, studded with small steel rivets.' + _DARA_MANTEM),
    'dara-peles': ('Replace the polished steel plate armor with hide armor of '
                   'thick furs and tanned animal hides, a fur mantle over the '
                   'shoulders, bound with leather straps.' + _DARA_MANTEM),
    'dara-roupa': ('Remove the steel plate armor entirely: she wears a quilted '
                   'padded cloth gambeson tunic in muted brown over her clothes, '
                   'no metal on the body.' + _DARA_MANTEM),
}

# AS POSTURAS DE ARMA, para o motor desenhar a arma por cima.
#
# A arma de cada postura e pedida em VERDE PURO: e a cor que nao existe em
# nenhum lugar da Dara. Depois o importador acha o verde, mede a mao e o
# angulo em cada quadro e apaga a arma -- a folha fica sem arma e o motor
# desenha a que estiver equipada. Pedir de maos vazias perderia justamente a
# pose de quem segura alguma coisa, e a medida da mao.
_POSTURA_MANTEM = (
    ' Keep everything else exactly the same: the red dragonborn head, horns '
    'and amber eyes, no tail, the chain mail, the cream tabard with red trim, '
    'the belt, the cream trouser flaps, the pose of the legs, the direction '
    'each frame is facing and the colours.'
)
_VERDE = 'painted entirely in flat bright pure green #00ff00, a single solid colour'
EDICOES.update({
    'dara-sem-escudo': (
        'Remove the steel shield completely: her left arm hangs free and relaxed '
        'at her side with an empty clawed hand. Keep the longsword in her right '
        'hand.' + _POSTURA_MANTEM),
    'dara-arco': (
        'Remove the steel shield and the longsword. She holds a longbow ' + _VERDE +
        ', upright in her left hand at her side, and her right hand is empty.'
        + _POSTURA_MANTEM),
    'dara-besta': (
        'Remove the steel shield and the longsword. She holds a heavy crossbow ' +
        _VERDE + ', with both hands at waist level, pointing forward.'
        + _POSTURA_MANTEM),
    'dara-duas-maos': (
        'Remove the steel shield and the longsword. She holds a greatsword ' +
        _VERDE + ', gripped with both hands in front of her, the blade pointing '
        'up diagonally.' + _POSTURA_MANTEM),
})


# AS POSTURAS DO BRENN. A arma vem JA DESENHADA, com madeira e aco: o verde
# recolorido depois sai chapado, sem textura (foi o defeito da espada grande,
# do arco e da besta da Dara, e o dono nao quer que se repita).
_BRENN_MANTEM = (
    ' Keep everything else exactly the same: the short stout dwarf body, the '
    'bearded face and bare head, the steel scale mail, the grey tabard with '
    'the gold trim, the belt, the boots, the pose of the legs, the direction '
    'each frame is facing and the colours.'
)
EDICOES.update({
    'brenn-besta': (
        'Remove the steel shield with the sun emblem and the mace. He holds one '
        'light crossbow with both hands at waist level, pointing forward: a '
        'dark brown wooden stock with visible wood grain, a short curved steel '
        'bow across the front with a taut string, and a steel trigger.'
        + _BRENN_MANTEM),
})


# AS POSTURAS DO PIP. Armas ja desenhadas, com textura, como as do Brenn.
_PIP_MANTEM = (
    ' Keep everything else exactly the same: the small halfling body, the dark '
    'green cloak with the hood UP over his head, the face under the hood, the '
    'brown leather armor, the belt, the boots, the pose of the legs, the '
    'direction each frame is facing and the colours.'
)
EDICOES.update({
    'pip-duas-adagas': (
        'Replace the shortsword with a steel dagger in his right hand, and put a '
        'second steel dagger in his left hand: one short double-edged dagger in '
        'each hand, blades pointing forward, held low and ready.' + _PIP_MANTEM),
    'pip-arco': (
        'Remove the shortsword. He holds one short bow of curved brown wood with '
        'a taut string, upright in his left hand at his side; his right hand is '
        'empty. A small leather quiver of arrows on his back, under the cloak.'
        + _PIP_MANTEM),
    'pip-besta-de-mao': (
        'Replace the shortsword with one hand crossbow held in his right hand, '
        'pointing forward: a small pistol-sized crossbow with a dark wooden stock '
        'and a short steel bow with a taut string. His left hand is empty.'
        + _PIP_MANTEM),
})


# A POSTURA DE ADAGA DO ILVAN.
EDICOES.update({
    'ilvan-adaga': (
        'Remove the wooden quarterstaff completely. He holds one steel dagger in '
        'his right hand, held low and pointing forward; his left hand stays raised '
        'with open fingers. Keep everything else exactly the same: the tall slender '
        'elf, the long silver-white hair and pointed ears, the long indigo robe '
        'with light violet trim, the belt and pouch, the pose of the legs, the '
        'direction each frame is facing and the colours.'),
})


# AS POSTURAS DO GRASK.
_GRASK_MANTEM = (
    ' Keep everything else exactly the same: the huge muscular half-orc with '
    'grey-green skin, tusks, long black hair and red war paint, the bare chest, '
    'the brown fur mantle, the belt and kilt, the pose of the legs, the '
    'direction each frame is facing and the colours.'
)
EDICOES.update({
    'grask-machadinhas': (
        'Replace the greataxe with two handaxes, one in each hand: each a short '
        'wooden handle with a small steel axe head, held low and ready at his '
        'sides.' + _GRASK_MANTEM),
    'grask-azagaia': (
        'Replace the greataxe with one javelin: a long thin wooden throwing spear '
        'with a small steel point, held in his right hand raised at shoulder '
        'height ready to throw, his left hand empty and forward.' + _GRASK_MANTEM),
})


# AS POSTURAS DO TORVIK (a base dele saiu de placas).
_TORVIK_MANTEM = (
    ' Keep everything else exactly the same: the short stout dwarf with the '
    'dark brown beard, the steel open-faced helm, the steel plate armor, the '
    'royal blue tabard and cape with white trim, the belt, the boots, the pose '
    'of the legs, the direction each frame is facing and the colours.'
)
EDICOES.update({
    'torvik-espada-grande': (
        'Remove the blue shield and the longsword. He holds one steel greatsword, '
        'a long broad two-handed blade with a cross guard, gripped with both hands '
        'in front of him, the blade pointing up diagonally.' + _TORVIK_MANTEM),
    'torvik-azagaia': (
        'Remove the blue shield and the longsword. He holds one javelin, a long '
        'thin wooden throwing spear with a small steel point, raised in his right '
        'hand at shoulder height ready to throw; his left hand is empty.'
        + _TORVIK_MANTEM),
    'torvik-besta': (
        'Remove the blue shield and the longsword. He holds one heavy crossbow of '
        'dark wood with a steel bow and a taut string, with both hands at waist '
        'level, pointing forward.' + _TORVIK_MANTEM),
    'torvik-arco': (
        'Remove the blue shield and the longsword. He holds one longbow of curved '
        'brown wood with a taut string, upright in his left hand at his side; his '
        'right hand is empty. A leather quiver of arrows on his back.'
        + _TORVIK_MANTEM),
})


# AS POSTURAS DO CORIN (a base e a espada longa).
_CORIN_MANTEM = (
    ' Keep everything else exactly the same: the lean human ranger with short '
    'brown hair and a short beard, the brown leather cuirass with the crossed '
    'straps, the moss green cloak with the hood down, the quiver on his back, '
    'the belt, the boots, the pose of the legs, the direction each frame is '
    'facing and the colours.'
)
EDICOES.update({
    'corin-espadas': (
        'Replace the longsword with two steel shortswords, one in each hand: each '
        'a straight steel blade with a small cross guard, held low and ready at '
        'his sides, blades pointing forward.' + _CORIN_MANTEM),
    'corin-arco': (
        'Remove the longsword. He holds one longbow of curved brown wood with a '
        'taut string, tall and upright in his left hand at his side; his right '
        'hand is empty.' + _CORIN_MANTEM),
})


# O HOBGOBLIN DE ARCO: a mesma figura com o arco longo na mao. Ele nasceu
# canhoto (escudo no braco direito, espada na mao esquerda) e assim ficou: o
# escudo vai para as costas e a espada para a bainha, porque o bloco do
# livro tem as tres coisas e ele so troca o que esta na mao.
EDICOES.update({
    'hob-arco': (
        'Remove the shield from his arm and the sword from his hand. He now holds '
        'EXACTLY ONE longbow of curved dark wood with a taut string, tall and '
        'upright in ONE hand only, the hand that held the sword, on the same side '
        'of the body in every frame. The other hand is empty and open. Only one '
        'bow in each frame, never two, never a bow on both sides. The longsword is '
        'sheathed in a scabbard at his hip and the round steel shield is slung '
        'on his back. Keep everything else exactly the same: the red-orange '
        'skin, the long pointed ears, the red-brown hair tied back, the steel '
        'plate and chain armor with the spiked pauldrons, the brown belt and '
        'fur skirt, the boots, the pose of the legs, the direction each frame is '
        'facing and the colours.'),
})

# O CABELO PRETO (pedido do dono): o PixelLab o fez carmim. Por codigo nao
# separa: a sombra do rosto e o verso da orelha sao do mesmo carmim.
_HOB_PRETO = (
    'Make his hair BLACK: jet black with dark blue-grey highlights, the same '
    'hairstyle, the same shape. Keep the red-orange skin of the face and ears '
    'exactly as it is. Keep everything else exactly the same: the armor, the '
    'weapons, the pose, the direction each frame is facing and the colours.')
EDICOES.update({'hob-base-preto': _HOB_PRETO, 'hob-arco-preto': _HOB_PRETO})

# O BRUGHOR: o orc com a marca de chefe. Pelo que se ve de longe: o elmo de
# chifres muda a silhueta e o manto escuro muda a massa dos ombros.
EDICOES['brughor'] = (
    'Make him the orc war chief: put a battered iron helmet with two big curved '
    'horns on his head, a necklace of large teeth on his chest and bold red war '
    'paint in stripes across his face and arms. Keep everything else exactly the '
    'same: the ash grey skin, the tusks, the tawny fur mantle, the bone tusk '
    'pauldron, the brown leather tunic, the red sash, the greataxe, the pose, the '
    'direction each frame is facing and the colours.')

# O OGRO GORDO: o PixelLab o faz musculoso duas vezes seguidas (o esqueleto
# `mannequin` puxa para o atleta); o modelo oficial do dono e obeso.
EDICOES['ogro-gordo-a'] = EDICOES['ogro-gordo-b'] = (
    'Make him OBESE instead of muscular: a gigantic soft round pot belly that sags '
    'over the belt and is the widest part of the body, flabby chest, thick soft '
    'arms, no visible abs or defined muscles, a double chin under the jutting '
    'tusked jaw. Keep everything else exactly the same: the small bald head, the '
    'pale tan skin, the leather straps, the ragged hide loincloth, the wrapped '
    'shins and bare feet, the wooden spiked greatclub, the pose of the legs, the '
    'direction each frame is facing and the colours.')

# O REI GROL: o bugbear do PixelLab (`bugbear-80`) como o rei dos Cragmaw. O
# look `reiGrol`: pelo quase preto, tapa-olho, chifres, e o MACHADO no lugar
# da clava (o "Machado do rei" do bloco).
EDICOES['rei-grol'] = (
    'Make him the bugbear king: dye all his fur NEAR BLACK with dark brown-grey '
    'highlights and a black mane, put a black leather EYEPATCH over his left eye '
    'and a scar across his face, a crude iron crown with two big curved horns on '
    'his head, a tattered dark red cloth hanging from the belt. Replace the spiked '
    'club with a big iron BATTLEAXE with a wide crescent blade, held the same way. '
    'Keep everything else exactly the same: the bugbear body and lynx ears, the '
    'black leather pauldron, gauntlet, belt and strip kilt, the pose, the direction '
    'each frame is facing and the colours of the leather.')

# A DROW DE ARMADURA PRETA (pedido do dono): a versao sem capa e com a besta de
# mao certa (`drow-2-violeta`), so com a armadura recolorida. Criar de novo
# pelo texto trouxe a capa de volta.
EDICOES['drow-preta'] = (
    'Recolor ALL of her armor to BLACK: the spiked plate pauldrons, the breastplate, '
    'the plated belt, the thigh guards and the tall boots become black with dark grey '
    'edges, and the chain mail becomes dark grey. Make her hair pure white. Keep '
    'everything else exactly the same: her dark purple-grey skin, the pointed ears, '
    'the high ponytail, the shortsword, the small hand crossbow, no cloak, the pose, '
    'the direction each frame is facing.')

def chamar(token, metodo, caminho, corpo=None):
    req = urllib.request.Request(f'{BASE}{caminho}',
                                 data=json.dumps(corpo).encode() if corpo else None,
                                 method=metodo)
    req.add_header('Authorization', f'Bearer {token}')
    if corpo:
        req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f'HTTP {e.code} em {metodo} {caminho}: '
                         f'{e.read().decode(errors="replace")[:800]}')


def rotacoes(pasta):
    pasta = Path(pasta)
    j = next(p for p in pasta.glob('*.json') if p.name != 'meta.json')
    s = json.loads(j.read_text(encoding='utf-8'))['spritesheet']
    im = Image.open(pasta / s['path']).convert('RGBA')
    cw, ch = s['cell_size']['width'], s['cell_size']['height']
    r = next(x for x in s['rows'] if x['type'] == 'rotations')
    return [(d, im.crop((i * cw, r['row'] * ch, (i + 1) * cw, (r['row'] + 1) * ch)))
            for i, d in enumerate(r['directions'])], (cw, ch)


def b64(img):
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return base64.b64encode(buf.getvalue()).decode()


def imagens_em(obj):
    """Todas as imagens base64 de uma resposta, na ordem em que aparecem."""
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
    p.add_argument('--fonte', help='pasta do personagem baixado')
    p.add_argument('--tira', help='ou uma tira de 8 vistas lado a lado (sul primeiro)')
    p.add_argument('--de', type=int, default=0, help='a primeira direcao da tira (0 = sul)')
    p.add_argument('--direcoes', help='com --fonte: so estas direcoes, separadas por virgula '
                                     '(acima de 80 px o pedido aceita 4 por vez)')
    p.add_argument('--go', action='store_true')
    a = p.parse_args()

    if a.tira:
        # A tira de uma edicao anterior: as 8 vistas na ordem das rotacoes.
        tira = Image.open(RAIZ / a.tira).convert('RGBA')
        # Quadros quadrados: a tira pode ter menos de 8 (acima de 80 px o
        # pedido aceita so 4, e o ogro vai em duas metades: `--de 4`).
        lado = tira.height
        quadros = [(DIRECOES[a.de + i], tira.crop((i * lado, 0, (i + 1) * lado, tira.height)))
                   for i in range(tira.width // lado)]
        cw, ch = lado, tira.height
    elif a.fonte:
        quadros, (cw, ch) = rotacoes(RAIZ / a.fonte)
        # Acima de 80 px o pedido aceita so 4 quadros, e a celula do dragao
        # verde e 248x160. Entao da para mandar as direcoes aos punhados, em
        # vez de fatiar uma tira -- a tira so sabe recortar quadro QUADRADO.
        if a.direcoes:
            querem = [d.strip() for d in a.direcoes.split(',')]
            faltam = [d for d in querem if d not in dict(quadros)]
            if faltam:
                raise SystemExit(f'direcao desconhecida: {", ".join(faltam)}')
            quadros = [(d, img) for d, img in quadros if d in querem]
    else:
        raise SystemExit('passe --fonte ou --tira')
    corpo = {
        'description': EDICOES[a.edicao],
        'image_size': {'width': cw, 'height': ch},
        'no_background': True,
        'frames': [{'image': {'type': 'base64', 'base64': b64(img), 'format': 'png'},
                    'size': {'width': cw, 'height': ch}} for _, img in quadros],
    }
    print(f'{a.edicao}: {len(quadros)} quadros de {cw}x{ch}, '
          f'{len(corpo["description"])} caracteres')
    token = os.environ.get('PIXELLAB_TOKEN')
    if not token:
        raise SystemExit('defina PIXELLAB_TOKEN no ambiente')
    antes = chamar(token, 'GET', '/balance')['subscription']['generations']
    print(f'saldo: {antes:.0f}')
    if not a.go:
        print('(seco: nada foi enviado. use --go)')
        return

    r = chamar(token, 'POST', '/edit-animation-v2', corpo)
    job = r['background_job_id']
    print(f'trabalho {job}  usage={r.get("usage")}', flush=True)
    inicio = time.time()
    while True:
        d = chamar(token, 'GET', f'/background-jobs/{job}')
        if d.get('status') == 'completed':
            break
        if d.get('status') == 'failed':
            raise SystemExit(f'falhou: {json.dumps(d)[:600]}')
        if time.time() - inicio > 1800:
            raise SystemExit('tempo esgotado')
        time.sleep(10)

    saida = RAIZ / '_referencias' / 'pixellab' / 'edicoes' / a.edicao
    saida.mkdir(parents=True, exist_ok=True)
    (saida / 'resposta.json').write_text(
        json.dumps({k: v for k, v in d.items() if k != 'last_response'} |
                   {'chaves_da_resposta': list((d.get('last_response') or {}).keys())},
                   indent=2), encoding='utf-8')
    # A resposta traz dois jogos de quadros: `images`, a edicao crua, e
    # `quantized_images`, a mesma com as cores reduzidas para a quantidade do
    # original. Fica a quantizada; a outra so se ela faltar. O custo vem
    # declarado em `usage` -- esse numero, ao contrario do saldo, nao se
    # mistura com o gasto de outra sessao.
    lr = d.get('last_response') or {}
    imgs = imagens_em(lr.get('quantized_images') or lr.get('images'))
    print(f'pronto em {int(time.time() - inicio)}s, {len(imgs)} quadros; '
          f'custo declarado: {d.get("usage")}')
    tira = None
    for i, s64 in enumerate(imgs[:len(quadros)]):
        img = Image.open(io.BytesIO(base64.b64decode(s64))).convert('RGBA')
        img.save(saida / f'{i}-{quadros[i][0]}.png')
        if tira is None:
            tira = Image.new('RGBA', (img.width * len(quadros), img.height))
        tira.alpha_composite(img, (i * img.width, 0))
    if tira:
        tira.save(saida / 'tira.png')
    depois = chamar(token, 'GET', '/balance')['subscription']['generations']
    print(f'saldo depois: {depois:.0f}  (caiu {antes - depois:.0f}; pode incluir '
          f'gasto de outra sessao rodando ao mesmo tempo)')


if __name__ == '__main__':
    main()
