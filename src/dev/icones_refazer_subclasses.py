# -*- coding: utf-8 -*-
"""
SEGUNDA RODADA dos ícones das subclasses: o que os quatro revisores reprovaram na primeira (folhas `sub-01` a `sub-06`, de 24 por folha).

O gerador DERIVOU nas folhas de 24: pôs o desenho de um conceito na célula do vizinho (sub-04 inteira, as pedras do transmutador, a Abjuração e
o Paladino), e na folha de 11 (sub-06) desenhou um ladrilho opaco de fundo. A correção é pedir MENOS por vez: folhas de 6 (3 colunas x 2
linhas), com os conceitos parecidos DISTRIBUÍDOS em folhas diferentes (o vizinho de célula é o que contamina). Também se reescreveram os
conceitos que levaram a desenho repetido (as pedras, os livros dos "Sábios", as árvores): cada um ganha um assunto principal diferente.

    python src/dev/icones_refazer_subclasses.py planejar     # escreve refazer-sNN/ e os vereditos de sub-NN/
"""
import json
import math
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
LOTE = RAIZ / '_referencias' / 'icones' / 'lote'

# O que a revisão APROVOU nas folhas sub-NN (fiel + legível + do conjunto). Todo o resto refaz.
FICA = {
    'classe-studentOfWar', 'classe-tripAttack', 'classe-infiltrationExpertise', 'classe-bearSpirit', 'classe-eagleSpirit',
    'classe-totemSpirit', 'classe-spiritSeeker', 'classe-mageHandLegerdemain',
    'classe-aspectOfTheBeast', 'classe-spiritWalker', 'classe-totemicAttunement', 'classe-undyingSentinel',
    'classe-valorProficiencies', 'classe-combatInspiration',
    'classe-arcaneCharge', 'classe-thirdEye', 'classe-alterMemories', 'classe-improvedMinorIllusion',
    'classe-inuredToUndeath', 'classe-shapechanger', 'classe-cloakOfShadows', 'classe-discipleOfTheElements',
    'classe-fistOfFourThunders', 'classe-clenchOfTheNorthWind', 'classe-gongOfTheSummit', 'classe-mistStance', 'classe-rideTheWind',
    'classe-breathOfWinter', 'classe-eternalMountainDefense', 'classe-companionLobo', 'classe-bestialFury', 'classe-shareSpells',
    'raca-superiorDarkvision', 'raca-fleetOfFoot', 'raca-maskOfTheWild', 'raca-highElfCantrip',
}

# Conceitos REESCRITOS (o que o gerador desenhou igual a outro, ou que a revisão achou fraco). Quem não está aqui usa o do catálogo.
NOVOS = {
    'classe-combatSuperiority': 'four bright gold six-sided dice in a pile on the ground',
    'classe-knowYourEnemy': 'a big watching human eye with a bright gold iris looking out from behind a small red spiked helmet',
    'classe-improvedCombatSuperiority': 'one big glowing gold ten-sided die with a bright white spark',
    'classe-relentless': 'a gold six-sided die springing up from a heap of broken grey dice with a green circular arrow',
    'classe-menacingAttack': 'a big steel sword held up in front of a pale terrified face with wide eyes, with three red exclamation marks',
    'classe-pushingAttack': 'a round steel shield being shoved sideways by a big white arrow with an armored fist behind it',
    'classe-lungingAttack': 'one very long steel sword thrust to the right across the whole cell with three thick blue speed lines behind it',
    'classe-precisionAttack': 'a big red and white archery target with the tip of a steel arrow in the exact centre',
    'classe-assassinate': 'a steel dagger pointing down into a big red heart with a thick red drop',
    'classe-assassinProficiencies': 'a black theatre mask with a small green poison vial leaning on it',
    'classe-impostor': 'a pale smiling face mask with a dark face mask peeking from behind it and a green sparkle',
    'classe-deathStrike': 'a steel dagger stabbing straight down into the top of a plain white skull with a thin straight dark crack',
    'classe-magicalAmbush': 'a hooded figure with bright pale blue glowing eyes crouching beside a big bright violet spell orb',
    'classe-versatileTrickster': 'a violet floating hand waving in front of a surprised big pale eye',
    'classe-spellThief': 'a violet hand pulling a glowing blue spell scroll out of a sparkle',
    'classe-wolfSpirit': 'a grey wolf head howling at a big gold full moon, with a faint white spirit glow',
    'classe-combatWildShape': 'a big green bear paw print with a red heart inside it and a small yellow lightning bolt',
    'classe-circleForms': 'a silver crescent moon with three small animal silhouettes standing below it',
    'classe-primalStrike': 'a big brown claw with three glowing blue slash marks across it',
    'classe-elementalWildShape': 'a silhouette of a wolf filled with an orange flame, a blue water drop and a grey rock',
    'classe-thousandForms': 'five different small animal faces in a ring around a glowing violet star',
    'classe-abjureEnemy': 'a raised steel gauntlet holding a golden holy symbol, with a small scared enemy frozen in pale blue ice',
    'classe-vowOfEnmity': 'a red banner flag with a black sword stabbed through a red target ring',
    'classe-relentlessAvenger': 'a running brown boot with dust trailing behind and a steel sword swinging',
    'classe-soulOfVengeance': 'a ghostly red sword slashing out of a purple spirit flame',
    'classe-avengingAngel': 'a pair of big gleaming white wings behind a steel sword with a red glow',
    'classe-naturesWrath': 'thick green thorny vines wrapped tight around a grey armored fist',
    'classe-turnTheFaithless': 'a green leaf holy symbol with golden rays, pushing back a small purple horned fey face',
    'classe-auraOfWarding': 'a small green translucent dome over a small silver shield, with a violet spell spark bouncing off it',
    'classe-elderChampion': 'a gold laurel crown around a big green oak leaf with three small red hearts rising',
    'classe-battleMagic': 'a big steel sword with a violet spell spark burst at its tip',
    'classe-weaponBond': 'a big steel sword wrapped in a thin glowing violet chain',
    'classe-warMagic': 'a big steel sword crossed with a bright glowing violet orb',
    'classe-eldritchStrike': 'a steel sword blade hitting and flashing a big violet arcane rune burst',
    'classe-improvedWarMagic': 'a big steel sword in front of a big glowing violet open spellbook',
    'classe-abjurationSavant': 'a thick closed spellbook with a big blue shield symbol on its cover',
    'classe-arcaneWard': 'a small hooded wizard figure inside a glowing blue bubble barrier',
    'classe-projectedWard': 'a blue glowing shield sending a bright beam towards a smaller ally figure',
    'classe-improvedAbjuration': 'a blue shield with a bright gold five-pointed star and gold sparkles',
    'classe-spellResistance': 'a blue shield deflecting a thick orange magic bolt that bounces away',
    'classe-divinationSavant': 'a thick closed spellbook with a big gold eye symbol on its cover',
    'classe-portent': 'two big glowing blue twenty-sided dice floating above a round crystal ball',
    'classe-expertDivination': 'a round crystal ball with a bright gold eye inside and a small blue gem returning beside it',
    'classe-greaterPortent': 'three big glowing blue twenty-sided dice in a row above a bright violet crystal ball',
    'classe-conjurationSavant': 'a thick closed spellbook with a big violet summoning circle symbol on its cover',
    'classe-minorConjuration': 'a small violet glowing wooden box appearing from thin air with white sparkles',
    'classe-benignTransposition': 'two violet curved arrows swapping a small wizard silhouette between two glowing portals',
    'classe-focusedConjuration': 'a violet summoning circle with a steady gold flame in the centre and a small grey rock shield',
    'classe-durableSummons': 'a violet wolf with a big bright blue bubble shield around it',
    'classe-enchantmentSavant': 'a thick closed spellbook with a big salmon-red heart symbol on its cover',
    'classe-hypnoticGaze': 'a big violet eye with a spiral hypnotic swirl in the pupil',
    'classe-instinctiveCharm': 'a salmon-red heart with a thick arrow bending away around it to the side',
    'classe-splitEnchantment': 'a salmon-red heart cracked in two glowing halves with a small violet spark',
    'classe-illusionSavant': 'a thick closed spellbook with a big blue mirage swirl symbol on its cover',
    'classe-malleableIllusions': 'a blue translucent tree shape turning into a blue translucent tower',
    'classe-illusorySelf': 'a pale wizard stepping aside while a faded ghostly blue double of him stays behind',
    'classe-illusoryReality': 'a blue shimmering rope with its end turning solid brown, with white sparkles',
    'classe-necromancySavant': 'a thick closed spellbook with a big white skull symbol on its cover',
    'classe-grimHarvest': 'a dark curved scythe with a green wisp of life flowing into a red heart',
    'classe-undeadThralls': 'two small white skeletons climbing out of the ground with a green glow',
    'classe-commandUndead': 'a pointing violet hand commanding a kneeling white skeleton with a green glow',
    'classe-transmutationSavant': 'a thick closed spellbook with big green swirling arrows on its cover',
    'classe-minorAlchemy': 'a grey stone turning into a gold nugget with white sparkles',
    'classe-transmutersStone': 'one large glowing multicoloured polished gem on a small brown cloth',
    'classe-stoneDarkvision': 'a big bright gold eye glowing inside a dark purple stone',
    'classe-stoneSpeed': 'one big brown leather boot with white wings and thick blue speed lines',
    'classe-stoneConSave': 'a big red heart with a small silver shield in front of it',
    'classe-stoneResistFire': 'an orange flame being blocked by a big silver shield',
    'classe-stoneResistCold': 'a pale blue snowflake being blocked by a big silver shield',
    'classe-stoneResistLightning': 'a yellow lightning bolt being blocked by a big silver shield',
    'classe-masterTransmuter': 'a big cracked gem shattering and releasing a rainbow of sparkles',
    'classe-shadowArts': 'a dark purple crescent moon shadow with two big glowing white eyes',
    'classe-shadowStep': 'a pale grey monk stepping out of a bright violet glowing swirl portal',
    'classe-opportunist': 'a bare fist striking a grey armored figure with a white impact star',
    'classe-rushOfTheGaleSpirits': 'three thick white swirling wind gusts with a small smiling spirit face in the middle',
    'classe-sweepingCinderStrike': 'an open hand sweeping a wide fan of orange fire and grey cinders',
    'classe-flamesOfThePhoenix': 'a big orange and gold phoenix bird with spread wings in a ball of fire',
    'classe-riverOfHungryFlame': 'a long wall of orange flames with red embers spreading across the whole cell',
    'classe-rangersCompanion': 'a green ranger longbow with a small grey wolf head beside it',
    'classe-companionJavali': 'a brown wild boar head with two big white curved tusks',
    'classe-companionAranhaLobo': 'a big brown spider with a pale bright pattern on its back and eight legs, drawn in bright light browns with white highlights',
    'classe-companionRato': 'a big brown rat head with a light tan nose, big round ears and long whiskers',
    'classe-exceptionalTraining': 'a grey wolf head with a gold training medal on a green ribbon',
    'raca-dwarvenArmorTraining': 'a dwarven round shield beside a chain mail shirt',
    'raca-sunlightSensitivity': 'a bright gold sun with a big squinting dark purple eye',
    'raca-drowMagic': 'a pale white magic spark inside a dark purple spider-web circle',
    'raca-drowWeaponTraining': 'a black hand crossbow beside a thin steel rapier',
    'raca-stoutResilience': 'a small round shield blocking a green poison droplet',
    'raca-variantSkilled': 'a human figure with three small coloured skill stars around it',
    'raca-variantFeat': 'a gold star medal on a red ribbon',
    'raca-draconicDamageResistance': 'a shield made of overlapping red dragon scales',
    'raca-naturalIllusionist': 'a small gnome face with a blue shimmering illusion sparkle floating above its hand',
    'raca-speakWithSmallBeasts': 'a small gnome face beside a tiny squirrel with two speech marks',
    'magia-transposicaoBenigna': 'two violet curved arrows swapping a small wizard silhouette between two glowing portals',
    'magia-passoDasSombras': 'a bright violet glowing swirl portal with a pale monk leg and foot stepping out of it',
}

CABECALHO = ('Sprite sheet of {n} icons for a dark fantasy RPG, TRUE PIXEL ART. Match the attached reference sheets EXACTLY in style (pixel '
             'size, 1px dark outline, flat fills with hard steps, light from upper left, bold silhouettes, icon size in cell) but draw ONLY the '
             'new subjects below; never copy a reference icon.\n'
             'Grid of 3 columns x 2 rows, six big cells, evenly spaced, one icon centered per cell, left to right, top to bottom, this exact order.\n')
RODAPE = ('Each icon on a 32x32 pixel grid upscaled nearest-neighbour: crisp square pixels, no anti-aliasing, blur, gradients or soft shading. '
          '1px #2a2430 outline around EVERY icon, never omitted. Subject fills most of its cell; use bright light colours so each icon reads on '
          'a dark background. No background shape behind icons: no cards, tiles, squares, panels or discs; every icon floats directly on the '
          'magenta. Each icon is ONE connected shape, centered, with a clear margin: nothing touches the cell edges. Draw each concept exactly '
          'as described in its own cell. No pink. Nothing else on the sheet.\n'
          'Only these colours: #e8eef5 #aab6c6 #6b7686 #b0875a #8a6236 #e8c35a #a6822c #e0553c #6ea8e8 #e2b183 #f4f0e4 #6fc07a #a579d8 #2a2430.\n'
          'Background: flat pure magenta #FF00FF everywhere. No text, letters, numbers, labels, grid lines or frames.')


def todos():
    """Todos os ids dos seis lotes na ordem das folhas, com o conceito original."""
    out = []
    for n in range(1, 7):
        esp = json.loads((LOTE / f'sub-{n:02d}' / 'especificacao.json').read_text(encoding='utf-8'))
        out.extend((nome, conceito) for nome, conceito in esp['icones'])
    return out


def planejar():
    refazer = [(nome, NOVOS.get(nome, conceito)) for nome, conceito in todos() if nome not in FICA]
    # Vereditos: cada sub-NN diz o que o consolidador deve deixar de fora.
    for n in range(1, 7):
        esp = json.loads((LOTE / f'sub-{n:02d}' / 'especificacao.json').read_text(encoding='utf-8'))
        fora = [nome for nome, _ in esp['icones'] if nome not in FICA]
        (LOTE / f'sub-{n:02d}' / 'veredito.json').write_text(json.dumps({'refazer': fora}, indent=1, ensure_ascii=False), encoding='utf-8')
    # Espalha: o item i vai para a folha i % folhas, assim os parecidos (as cinco pedras, os sete livros) NÃO dividem folha.
    folhas = math.ceil(len(refazer) / 6)
    grupos = [[] for _ in range(folhas)]
    for i, item in enumerate(refazer):
        grupos[i % folhas].append(item)
    indice = []
    for k, g in enumerate(grupos, 1):
        pasta = LOTE / f'refazer-s{k:02d}'
        pasta.mkdir(exist_ok=True)
        linhas = [', '.join(f'({r * 3 + i + 1}) {g[r * 3 + i][1]}' for i in range(3) if r * 3 + i < len(g)) for r in range(2)]
        corpo = '\n'.join(f'Row {r + 1}: ' + '; '.join(f'({r * 3 + i + 1}) {g[r * 3 + i][1]}' for i in range(3) if r * 3 + i < len(g)) + '.'
                          for r in range(2) if r * 3 < len(g))
        vazias = 6 - len(g)
        fim = f' Leave the last {vazias} cell(s) at the bottom-right completely empty (flat magenta).' if vazias else ''
        (pasta / 'prompt.txt').write_text(CABECALHO.format(n=len(g)).rstrip('\n') + fim + '\n' + corpo + '\n' + RODAPE, encoding='utf-8')
        (pasta / 'especificacao.json').write_text(json.dumps({
            'paleta': ['#e8eef5', '#aab6c6', '#6b7686', '#b0875a', '#8a6236', '#e8c35a', '#a6822c', '#e0553c', '#6ea8e8', '#e2b183',
                       '#f4f0e4', '#6fc07a', '#a579d8', '#2a2430'],
            'colunas': 3, 'linhas': 2, 'icones': [[nome, c] for nome, c in g]}, indent=1, ensure_ascii=False), encoding='utf-8')
        indice.append([nome for nome, _ in g])
    (LOTE / 'indice-refazer-s.json').write_text(json.dumps(indice, indent=1, ensure_ascii=False), encoding='utf-8')
    print(f'{len(refazer)} ícones a refazer em {folhas} folhas de 6; {len(FICA)} ficam')


if __name__ == '__main__':
    planejar()
