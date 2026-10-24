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
    p.add_argument('--go', action='store_true')
    a = p.parse_args()

    if a.tira:
        # A tira de uma edicao anterior: as 8 vistas na ordem das rotacoes.
        tira = Image.open(RAIZ / a.tira).convert('RGBA')
        lado = tira.width // len(DIRECOES)
        quadros = [(d, tira.crop((i * lado, 0, (i + 1) * lado, tira.height)))
                   for i, d in enumerate(DIRECOES)]
        cw, ch = lado, tira.height
    elif a.fonte:
        quadros, (cw, ch) = rotacoes(RAIZ / a.fonte)
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
