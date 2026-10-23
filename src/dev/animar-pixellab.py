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


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--character-id', required=True)
    p.add_argument('--saida', required=True)
    p.add_argument('--go', action='store_true', help='sem isto, so o plano')
    p.add_argument('--pular', default='',
                   help='nomes ja pedidos, separados por virgula')
    p.add_argument('--somente', default='',
                   help='so estes nomes, separados por virgula')
    a = p.parse_args()

    token = os.environ.get('PIXELLAB_TOKEN')
    if not token:
        raise SystemExit('defina PIXELLAB_TOKEN no ambiente')

    custo = sum(len(d) for _, d, _ in POSES)
    print('PLANO')
    for nome, dirs, extra in POSES:
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
    for nome, dirs, extra in POSES:
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
