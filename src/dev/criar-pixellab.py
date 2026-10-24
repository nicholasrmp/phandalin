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

# A ordem das oito vistas na tira de uma edicao, a mesma das rotacoes.
DIRECOES = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west',
            'west', 'south-west']

LIMITES = {'description': 2000, 'edit_description': 1000}


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
