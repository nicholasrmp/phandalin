# -*- coding: utf-8 -*-
"""
TERCEIRA RODADA dos ícones das subclasses: o que a revisão da segunda ainda reprovou (fidelidade errada, escuro demais no HUD, duplicata,
colisão com um aprovado, ruído sem silhueta). As folhas são de 6 (3x2) e os parecidos vão em folhas diferentes, como na segunda rodada.

    python src/dev/icones_refazer3.py     # escreve refazer-tNN/ e o veredito de refazer-sNN/ (o que sai do consolidador)

Os sete livros dos "Sábios" viram o SÍMBOLO da escola, grande, com um livro pequeno na base: seis livros pretos iguais não se distinguiam.
"""
import json
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from icones_refazer_subclasses import CABECALHO, RODAPE, LOTE  # noqa: E402

NOVOS = {
    'classe-abjurationSavant': 'a big blue shield emblem with a small open white spellbook at its base',
    'classe-divinationSavant': 'a big bright gold eye with a small open white spellbook at its base',
    'classe-conjurationSavant': 'a big violet summoning circle star with a small open white spellbook at its base',
    'classe-illusionSavant': 'a big blue mirage spiral swirl with a small open white spellbook at its base',
    'classe-necromancySavant': 'a big white skull with a small open pale green spellbook at its base',
    'classe-transmutationSavant': 'two big green circular arrows chasing each other with a small open white spellbook at its base',
    'classe-versatileTrickster': 'a violet floating hand with spread fingers waving, with one big pale eye above it',
    'classe-spellThief': 'a violet hand grabbing a big glowing blue spell scroll that unrolls out of a sparkle',
    'classe-circleForms': 'a silver full moon disc with three brown animal paw prints in a row on it',
    'classe-improvedCombatSuperiority': 'one big bright gold ten-sided die with a white shine and a ring of gold sparks',
    'classe-battleMagic': 'a steel sword with big violet magic flames wrapping its blade',
    'classe-warMagic': 'a big glowing violet orb with a small steel sword crossed behind it',
    'classe-improvedWarMagic': 'a large open violet spellbook with a steel sword standing in front of it',
    'classe-weaponBond': 'a steel sword with a thick glowing violet chain of big links wrapped around its blade',
    'classe-masterTransmuter': 'a big cracked rainbow gem splitting in two halves with a bright white flash',
    'classe-commandUndead': 'a big violet hand with a pointing finger in front of a small white skull',
    'classe-benignTransposition': 'a violet portal ring on the left and another on the right with two curved arrows between them and a tiny wizard hat above each',
    'raca-drowWeaponTraining': 'a light grey hand crossbow beside a slim silver rapier',
    'classe-relentlessAvenger': 'a big brown running boot with white speed streaks and dust',
    'classe-malleableIllusions': 'a translucent blue tower shape with a ghostly blue outline of a tree beside it',
    'classe-illusoryReality': 'a solid brown rope coil with a blue shimmering ghost rope fading out of it and white sparkles',
    'classe-rangersCompanion': 'a big green longbow with a big grey wolf head in front of it',
    'classe-instinctiveCharm': 'a salmon-red heart with a big white arrow curving around it away to the side',
    'classe-thousandForms': 'five different animal faces (wolf, bear, eagle, boar, rat) in a ring around a violet star, big and clear',
    'classe-stoneSpeed': 'one big brown leather boot with two big white feathered wings and blue speed lines',
    'classe-assassinProficiencies': 'a bright pale smiling theatre mask with a small green poison vial beside it',
    'raca-drowMagic': 'a big pale purple spider web circle with a bright white spark in the centre',
    'classe-lungingAttack': 'a long steel sword thrust to the right with a big blue motion trail',
    'classe-wolfSpirit': 'a grey wolf head howling up at a big gold moon, with no frame and no border',
    'classe-impostor': 'a smiling white mask with a dark grey mask peeking out behind it and a bright green spark',
    'magia-passoDasSombras': 'a pair of bare feet leaving two violet footprints between two small violet portals',
    'raca-variantSkilled': 'a big human figure with three large coloured skill stars around it',
    'classe-turnTheFaithless': 'a big green holy leaf symbol with golden rays, filling the whole cell',
    'classe-bestialFury': 'a grey wolf head with three red claw scratches across it',
}


def planejar():
    refazer = list(NOVOS.items())
    # O que sai do consolidador: tudo que esta rodada refaz (nas folhas sub-NN e refazer-sNN).
    ids = set(NOVOS)
    for pasta in list(LOTE.glob('sub-0*')) + list(LOTE.glob('refazer-s*')):
        vf = pasta / 'veredito.json'
        base = set(json.loads(vf.read_text(encoding='utf-8')).get('refazer', [])) if vf.exists() else set()
        esp = json.loads((pasta / 'especificacao.json').read_text(encoding='utf-8'))
        daqui = {nome for nome, _ in esp['icones']} & ids
        if pasta.name.startswith('refazer-s'):
            base |= daqui
        else:
            base |= daqui
        vf.write_text(json.dumps({'refazer': sorted(base)}, indent=1, ensure_ascii=False), encoding='utf-8')
    folhas = math.ceil(len(refazer) / 6)
    grupos = [[] for _ in range(folhas)]
    for i, item in enumerate(refazer):
        grupos[i % folhas].append(item)
    for k, g in enumerate(grupos, 1):
        pasta = LOTE / f'refazer-t{k:02d}'
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
    print(f'{len(refazer)} ícones em {folhas} folhas de 6')


if __name__ == '__main__':
    planejar()
