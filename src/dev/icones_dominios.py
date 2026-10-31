# -*- coding: utf-8 -*-
"""
ÍCONES dos domínios do clérigo do Livro do Jogador (Guerra, Tempestade, Luz): 16 características novas, em folhas de 6 (3x2) como as rodadas
das subclasses. As folhas vão para `_referencias/icones/lote/refazer-xNN/` e o consolidador as junta.

    python src/dev/icones_dominios.py     # escreve refazer-xNN/ (prompt.txt e especificacao.json)
"""
import json
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from icones_refazer_subclasses import CABECALHO, RODAPE, LOTE  # noqa: E402

NOVOS = {
    'classe-warPriest': 'a steel mace swinging out of an armored glove with a small gold holy symbol and a bright white motion arc',
    'classe-destructiveWrath': 'one huge yellow lightning bolt ending in a bright white explosion',
    'classe-radianceOfTheDawn': 'a big gold sun rising over a flat horizon with thick bright rays and a white starburst',
    'classe-guidedStrike': 'a steel mace guided by a thick bright white beam of light from above onto a red target ring',
    'classe-thunderboltStrike': 'a yellow lightning bolt hitting a small brown boot that flies away with white motion lines',
    'classe-lightCantrip': 'a gold candle flame glowing inside a small round holy symbol with soft white rays',
    'classe-warGodsBlessing': 'a gold helmet with two big white wings on its sides and a bright white glow',
    'classe-stormborn': 'a hooded figure with two big grey feathered wings flying through blue storm clouds',
    'classe-coronaOfLight': 'a dark head silhouette crowned with a big ring of gold sun rays',
    'classe-divineStrikeWeapon': 'a steel sword with a big glowing gold ring around its blade and bright white sparks',
    'classe-wrathOfTheStorm': 'a big dark blue storm cloud with a yellow lightning bolt striking down onto a small grey shield',
    'classe-improvedFlare': 'a bright white flash starburst with a steel shield and two small friendly pale faces beside it',
    'classe-avatarOfBattle': 'a big grey steel breastplate with a bright gold sun on the chest and a faint white glow',
    'classe-divineStrikeThunder': 'a steel sword wrapped by blue and white thunder lightning arcs',
    'classe-wardingFlare': 'a bright white flash starburst in front of a pair of squeezed shut pale eyes',
    'classe-potentSpellcasting': 'a bright gold open hand holding a big glowing gold orb with three thick gold sparks',
}


# Segunda leva: Conhecimento, Natureza e Enganação, mais dois refeitos da primeira (a cabeça escura sumia no fundo do HUD; o halo branco do trovão).
NOVOS2 = {
    'classe-blessingsOfKnowledge': 'an open brown book with a big glowing blue star above it and two small gold skill stars',
    'classe-knowledgeOfTheAges': 'a gold hourglass with a small open scroll and a bright white spark',
    'classe-readThoughts': 'a pale face in profile with a glowing violet thought bubble holding a bright gold eye',
    'classe-visionsOfThePast': 'a pale blue ghostly picture of a ruined tower fading out of a round gold looking glass',
    'classe-acolyteOfNature': 'a green oak leaf in front of a small gold holy symbol',
    'classe-acolyteCantrip': 'a green sprouting seedling growing out of a glowing gold spark',
    'classe-charmAnimalsAndPlants': 'a small brown deer and a green flower both with glowing pink hearts above them',
    'classe-dampenElements': 'a silver shield with a blue water drop, a red flame and a yellow lightning bolt fading into it',
    'classe-divineStrikeNature': 'a steel mace wrapped in orange flames and pale blue frost',
    'classe-masterOfNature': 'a green pointing hand commanding a small grey wolf and a green sprouting vine',
    'classe-blessingOfTheTrickster': 'a pale hand touching a small violet cloak with a bright white sparkle',
    'classe-invokeDuplicity': 'two identical pale hooded figures side by side, one solid and one translucent blue',
    'classe-divineStrikePoison': 'a steel mace dripping thick green poison drops',
    'classe-improvedDuplicity': 'four small pale hooded figures in a row, the last three translucent blue',
    'classe-coronaOfLight': 'a pale face in front of a big ring of bright gold sun rays, with bright white eyes',
    'classe-divineStrikeThunder': 'a steel sword with two thick blue lightning bolts coiling around its blade, nothing else around it',
    'classe-trickeryCloak': 'a violet hooded cloak fading to translucent at the edges with a bright white spark',
}

# Terceira leva: o que o revisor de fidelidade reprovou nas duas primeiras (raio dourado = radiante, formas ambíguas).
NOVOS3 = {
    'classe-destructiveWrath': 'a blue-white lightning bolt striking through a big white six-sided die showing its top face',
    'classe-thunderboltStrike': 'a blue-white lightning bolt striking a round grey shield that slides away with white motion streaks',
    'classe-wrathOfTheStorm': 'a dark storm cloud discharging a thick blue-white lightning bolt downward',
    'classe-wardingFlare': 'a blinding white starburst flash held in front of a raised pale open palm',
    'classe-guidedStrike': 'a steel sword point striking the centre of a golden crosshair target ring',
    'classe-warPriest': 'a steel mace with a double golden swing trail showing two blows',
    'classe-masterOfNature': 'a green fist gripping a thick green vine rope',
    'classe-avatarOfBattle': 'a full grey plate armor torso with a bright gold sun emblem on the chest and a faint white glow',
}


def planejar(destino='x', novos=None):
    itens = list((novos or NOVOS).items())
    folhas = math.ceil(len(itens) / 6)
    grupos = [[] for _ in range(folhas)]
    for i, item in enumerate(itens):
        grupos[i % folhas].append(item)
    for k, g in enumerate(grupos, 1):
        pasta = LOTE / f'refazer-{destino}{k:02d}'
        pasta.mkdir(exist_ok=True)
        corpo = '\n'.join(f'Row {r + 1}: ' + '; '.join(f'({r * 3 + i + 1}) {g[r * 3 + i][1]}' for i in range(3) if r * 3 + i < len(g)) + '.'
                          for r in range(2) if r * 3 < len(g))
        vazias = 6 - len(g)
        fim = f' Leave the last {vazias} cell(s) at the bottom-right completely empty (flat magenta).' if vazias else ''
        (pasta / 'prompt.txt').write_text(CABECALHO.format(n=len(g)).rstrip('\n') + fim + '\n' + corpo + '\n' + RODAPE, encoding='utf-8')
        (pasta / 'especificacao.json').write_text(json.dumps({
            'paleta': ['#e8eef5', '#aab6c6', '#6b7686', '#b0875a', '#8a6236', '#e8c35a', '#a6822c', '#e0553c', '#6ea8e8', '#e2b183',
                       '#f4f0e4', '#6fc07a', '#a579d8', '#2a2430'],
            'colunas': 3, 'linhas': 2, 'icones': [[nome, c] for nome, c in g]}, indent=1, ensure_ascii=False), encoding='utf-8')
    print(f'{len(itens)} ícones em {folhas} folhas')


if __name__ == '__main__':
    planejar('y', NOVOS2) if sys.argv[1:] == ['y'] else planejar('z', NOVOS3) if sys.argv[1:] == ['z'] else planejar()
