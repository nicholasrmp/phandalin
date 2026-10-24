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


def poses_de(chave):
    c = CRIATURAS[chave]
    poses = [('walk', OITO, {'mode': 'v3',
                             'action_description': 'walking forward, legs alternating in '
                                                   'a full stride, arms swinging in opposition'})]
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
    poses.append(('queda-pix', ['south'], {
        'mode': 'pixminimax',
        'action_description': ('struck down, falling backward and landing flat on '
                               f'{c.get("dela", "his")} back, then lying still: '
                               + c['chao']),
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
    a = p.parse_args()
    poses = poses_de(a.criatura) if a.criatura else POSES
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
