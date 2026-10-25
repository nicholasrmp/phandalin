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
"""
import argparse
import base64
import importlib.util
import json
import os
from pathlib import Path

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parents[1]
_spec = importlib.util.spec_from_file_location('cp', AQUI / 'criar-pixellab.py')
cp = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(cp)

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
}


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--chave', required=True, choices=sorted(IMAGENS))
    p.add_argument('--go', action='store_true')
    p.add_argument('--saida', default=None)
    a = p.parse_args()

    token = os.environ.get('PIXELLAB_TOKEN')
    if not token:
        raise SystemExit('defina PIXELLAB_TOKEN no ambiente')
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
