# -*- coding: utf-8 -*-
"""
CATÁLOGO DE ÍCONES — as 13 subclasses novas do Livro do Jogador (Mestre de Batalha, Totêmico, Lua, Vingança, Valor, Cavaleiro Místico,
Trapaceiro Arcano, Assassino, Sombra, Quatro Elementos, Anciões, Senhor das Feras e as sete escolas de mago), mais os traços de raça
que ainda não tinham desenho e as duas magias de característica (Transposição Benigna e Passo das Sombras).

Formato como o de `icones_catalogo_recursos.py`: `id|Nome|English|conceito`. Os ids são os de `c.features`, e a chave do ícone é
`classe-<id>`, `raca-<id>` ou `magia-<id>`. Cada conceito é UM objeto grande e chapado, nas cores da paleta do jogo.

Quatro grupos de características dividem ícone com outro, em vez de gerar desenhos quase iguais:
  - os sete "Sábio da <escola>" (cópia de magias no grimório) são um livro com o símbolo da escola;
  - as companheiras (lobo, javali, aranha-lobo, rato) são o rosto do bicho.
"""

CLASSES = '''
# --- guerreiro: Mestre de Batalha
combatSuperiority|Superioridade em Combate|Combat Superiority|four small bright gold dice stacked beside a crossed sword and shield
studentOfWar|Estudante da Guerra|Student of War|a smith's anvil with a small hammer and a rolled battle map
knowYourEnemy|Conheça seu Inimigo|Know Your Enemy|a large watching eye over a small red enemy helmet with a green check mark
improvedCombatSuperiority|Superioridade em Combate Aprimorada|Improved Combat Superiority|one large glowing gold ten-sided die with a bright white spark above a crossed sword
relentless|Implacável|Relentless|a gold die rising out of a pile of broken dice with a green circular arrow
tripAttack|Ataque Derrubador|Trip Attack|a steel sword sweeping low at a brown boot that is knocked off its foot with white motion lines
menacingAttack|Ataque Amedrontador|Menacing Attack|a steel sword with a scared pale face and three red exclamation marks
pushingAttack|Ataque Empurrão|Pushing Attack|a steel sword hilt slamming a round shield with a thick white arrow pushing it away
lungingAttack|Ataque Avançado|Lunging Attack|a long steel sword thrust far forward with three thick blue speed lines
precisionAttack|Ataque Preciso|Precision Attack|a red bullseye target with a steel sword tip hitting dead centre
# --- ladino: Assassino e Trapaceiro Arcano
assassinate|Assassinar|Assassinate|a steel dagger plunging down onto a red heart with a thick red drop
assassinProficiencies|Proficiências de Assassino|Assassin Proficiencies|a green poison vial beside a theatre mask
infiltrationExpertise|Perícia em Infiltração|Infiltration Expertise|two different masks side by side, one smiling and one plain, joined by a small gold chain
impostor|Impostor|Impostor|a pale face mask with a second hidden dark face peeking behind it
deathStrike|Golpe Mortal|Death Strike|a steel dagger piercing a white skull with a thick red crack
mageHandLegerdemain|Prestidigitação com Mão Mágica|Mage Hand Legerdemain|a translucent violet floating hand holding a small gold key
magicalAmbush|Emboscada Mágica|Magical Ambush|a hooded figure crouching in shadow with a glowing violet spark in its raised hand
versatileTrickster|Trapaceiro Versátil|Versatile Trickster|a violet floating hand waving in front of a surprised pale eye
spellThief|Ladrão de Magias|Spell Thief|a thin violet hand plucking a glowing blue spell scroll out of a sparkle
# --- bárbaro: Guerreiro Totêmico
spiritSeeker|Buscador de Espíritos|Spirit Seeker|a small ghostly white animal spirit rising from a feathered totem pole
totemSpirit|Espírito Totêmico|Totem Spirit|a tall carved wooden totem pole with a bear, an eagle and a wolf face stacked
bearSpirit|Espírito: Urso|Bear Spirit|a large brown bear head roaring with a faint white spirit glow
eagleSpirit|Espírito: Águia|Eagle Spirit|a white-headed eagle head with a sharp golden beak and wide spread wings
wolfSpirit|Espírito: Lobo|Wolf Spirit|a grey wolf head howling at a small gold moon
aspectOfTheBeast|Aspecto da Fera|Aspect of the Beast|a brown animal claw print inside a thin glowing green ring
spiritWalker|Caminhante dos Espíritos|Spirit Walker|a pair of footprints leading into a swirling white spirit mist
totemicAttunement|Sintonia Totêmica|Totemic Attunement|a wooden totem pole with a bright gold glowing aura ring around it
# --- druida: Círculo da Lua
combatWildShape|Forma Selvagem em Combate|Combat Wild Shape|a green bear paw print with a red heart and a small lightning bolt
circleForms|Formas do Círculo|Circle Forms|a silver crescent moon above three small animal silhouettes
primalStrike|Golpe Primitivo|Primal Strike|a large brown claw swipe with three glowing blue slash marks
elementalWildShape|Forma Selvagem Elemental|Elemental Wild Shape|a swirling mix of one orange flame, one blue water drop and one grey rock inside a silhouette of an animal
thousandForms|Mil Formas|Thousand Forms|five small different animal faces in a circle around a glowing violet star
# --- paladino: Vingança
abjureEnemy|Repelir o Inimigo|Abjure Enemy|a raised steel gauntlet with a golden holy symbol freezing a scared enemy skull in blue frost
vowOfEnmity|Voto de Inimizade|Vow of Enmity|a red sworn banner with a black sword stabbed through a small red target ring
relentlessAvenger|Vingador Implacável|Relentless Avenger|a running steel boot kicking up dust behind a swinging sword
soulOfVengeance|Alma de Vingança|Soul of Vengeance|a ghostly red sword slashing back from a purple spirit flame
avengingAngel|Anjo Vingador|Avenging Angel|a pair of large gleaming white wings behind a steel sword with a red glow
# --- paladino: Anciões
naturesWrath|Ira da Natureza|Nature's Wrath|thick green thorny vines wrapping around a grey fist
turnTheFaithless|Expulsar os Infiéis|Turn the Faithless|a green leaf holy symbol with golden rays pushing back a small purple horned fey face
auraOfWarding|Aura de Resguardo|Aura of Warding|a green translucent dome around a small silver shield with a violet spell spark bouncing off it
undyingSentinel|Sentinela Imortal|Undying Sentinel|a green tree with a red heart in its trunk and golden roots
elderChampion|Campeão Ancestral|Elder Champion|an ancient green oak tree with golden light and rising red healing crosses
# --- bardo: Valor
valorProficiencies|Proficiências do Valor|Valor Proficiencies|a round steel shield beside a medium chain shirt and a longsword
combatInspiration|Inspiração em Combate|Combat Inspiration|a golden lute with a flaming red sword rising from its strings
battleMagic|Magia de Batalha|Battle Magic|a steel sword with a violet magic spark burst at its tip
# --- guerreiro: Cavaleiro Místico
weaponBond|Vínculo com a Arma|Weapon Bond|a steel sword with a thin glowing violet chain around its blade
warMagic|Magia de Guerra|War Magic|a steel sword and a glowing violet cantrip orb crossed together
eldritchStrike|Golpe Místico|Eldritch Strike|a steel sword hit flashing a violet arcane rune burst
arcaneCharge|Investida Arcana|Arcane Charge|a steel armored knight dashing in a violet teleport swirl with a bright flash
improvedWarMagic|Magia de Guerra Aprimorada|Improved War Magic|a steel sword with a large glowing violet spellbook behind it
# --- mago: Abjuração
abjurationSavant|Sábio da Abjuração|Abjuration Savant|an open spellbook with a blue shield emblem on the page
arcaneWard|Proteção Arcana|Arcane Ward|a glowing blue spherical barrier around a small hooded wizard
projectedWard|Proteção Projetada|Projected Ward|a blue glowing shield projecting a bright beam towards a smaller ally figure
improvedAbjuration|Abjuração Aprimorada|Improved Abjuration|a blue shield with a bright gold plus mark on top
spellResistance|Resistência a Magia|Spell Resistance|a blue shield deflecting a thick orange spell bolt
# --- mago: Adivinhação
divinationSavant|Sábio da Adivinhação|Divination Savant|an open spellbook with a bright gold eye on the page
portent|Prodígio|Portent|two glowing blue twenty-sided dice floating above a crystal ball
expertDivination|Adivinhação Especialista|Expert Divination|a crystal ball with a bright gold eye and a small returning blue spell slot gem
thirdEye|O Terceiro Olho|The Third Eye|a bright gold eye in the middle of a pale forehead
greaterPortent|Prodígio Maior|Greater Portent|three glowing blue twenty-sided dice floating above a bright crystal ball
# --- mago: Conjuração
conjurationSavant|Sábio da Conjuração|Conjuration Savant|an open spellbook with a violet summoning circle on the page
minorConjuration|Conjuração Menor|Minor Conjuration|a small violet glowing wooden box appearing out of thin air with sparkles
benignTransposition|Transposição Benigna|Benign Transposition|two violet curved arrows swapping a small wizard silhouette between two portals
focusedConjuration|Conjuração Focada|Focused Conjuration|a violet summoning circle with a steady gold flame in the centre and a small rock shield
durableSummons|Convocação Duradoura|Durable Summons|a violet summoned wolf with a bright blue shield bubble of temporary hit points
# --- mago: Encantamento
enchantmentSavant|Sábio do Encantamento|Enchantment Savant|an open spellbook with a pink heart emblem on the page
hypnoticGaze|Olhar Hipnótico|Hypnotic Gaze|a violet eye with a spiral hypnotic swirl in the pupil
instinctiveCharm|Encanto Instintivo|Instinctive Charm|a violet heart redirecting a thick arrow that bends away to the side
splitEnchantment|Encantamento Dividido|Split Enchantment|a pink heart splitting into two glowing halves with a small violet spark
alterMemories|Alterar Memórias|Alter Memories|a human head profile with a violet glowing cloud being erased by a white eraser stroke
# --- mago: Ilusão
illusionSavant|Sábio da Ilusão|Illusion Savant|an open spellbook with a blue mirage swirl emblem on the page
improvedMinorIllusion|Ilusão Menor Aprimorada|Improved Minor Illusion|a small sparkling blue illusory sound wave and a ghostly translucent box
malleableIllusions|Ilusões Maleáveis|Malleable Illusions|a blue translucent shape morphing from a tree into a tower
illusorySelf|Eu Ilusório|Illusory Self|a pale wizard with a faded ghostly blue double stepping aside
illusoryReality|Realidade Ilusória|Illusory Reality|a blue shimmering rope turning solid brown at the end with white sparkles
# --- mago: Necromancia
necromancySavant|Sábio da Necromancia|Necromancy Savant|an open spellbook with a white skull emblem on the page
grimHarvest|Colheita Sombria|Grim Harvest|a dark scythe with a green wisp of life energy flowing into a red heart
undeadThralls|Servos Mortos-vivos|Undead Thralls|two small white skeleton minions rising from the ground with green glow
inuredToUndeath|Acostumado à Morte|Inured to Undeath|a pale grey shield with a skull blocked by a thin purple necrotic aura
commandUndead|Comandar Mortos-vivos|Command Undead|a pointing violet hand commanding a kneeling white skeleton with a green glow
# --- mago: Transmutação
transmutationSavant|Sábio da Transmutação|Transmutation Savant|an open spellbook with a green swirling arrows emblem on the page
minorAlchemy|Alquimia Menor|Minor Alchemy|a grey stone turning into a gold nugget with white sparkles
transmutersStone|Pedra do Transmutador|Transmuter's Stone|a glowing multicoloured polished gem set in a small brown pouch
stoneDarkvision|Pedra: Visão no Escuro|Stone: Darkvision|a bright gold eye glowing inside a dark purple stone
stoneSpeed|Pedra: Velocidade|Stone: Speed|a bright blue stone with a winged boot silhouette and speed lines
stoneConSave|Pedra: Constituição|Stone: Constitution|a bright red heart stone with a small shield
stoneResistFire|Pedra: Resistência a Fogo|Stone: Fire Resistance|a red stone with an orange flame deflected by a silver shield
stoneResistCold|Pedra: Resistência a Frio|Stone: Cold Resistance|a pale blue stone with a snowflake blocked by a silver shield
stoneResistLightning|Pedra: Resistência a Elétrico|Stone: Lightning Resistance|a yellow stone with a lightning bolt blocked by a silver shield
shapechanger|Mutante|Shapechanger|a wizard silhouette half turning into a brown bear silhouette with violet swirl
masterTransmuter|Transmutador Mestre|Master Transmuter|a cracked gem shattering and releasing a rainbow of sparkles
# --- monge: Sombra
shadowArts|Artes Sombrias|Shadow Arts|a dark purple crescent shadow with two glowing white ki eyes
shadowStep|Passo das Sombras|Shadow Step|a monk silhouette stepping out of a dark violet shadow portal
cloakOfShadows|Manto de Sombras|Cloak of Shadows|a hooded dark violet cloak with a faint see-through outline fading away
opportunist|Oportunista|Opportunist|a bare fist striking a grey armored figure from behind with a white impact star
# --- monge: Quatro Elementos
discipleOfTheElements|Discípulo dos Elementos|Disciple of the Elements|four small symbols in a circle: an orange flame, a blue water drop, a white wind swirl and a brown rock
fistOfFourThunders|Punho dos Quatro Trovões|Fist of Four Thunders|a clenched fist striking with a bright yellow thunder wave and lightning
rushOfTheGaleSpirits|Rajada dos Espíritos do Vendaval|Rush of the Gale Spirits|three thick white swirling wind gusts with a small spirit face
sweepingCinderStrike|Golpe de Cinzas Varridas|Sweeping Cinder Strike|an open hand sweeping a fan of orange fire and grey cinders
clenchOfTheNorthWind|Garra do Vento do Norte|Clench of the North Wind|a bare clenched hand frozen in pale blue ice with a snowflake
gongOfTheSummit|Gongo do Cume|Gong of the Summit|a large gold gong with bright white shockwave rings and a small hand
flamesOfThePhoenix|Chamas da Fênix|Flames of the Phoenix|an orange and gold phoenix bird bursting into a ball of fire
mistStance|Postura da Névoa|Mist Stance|a monk silhouette dissolving into soft white mist
rideTheWind|Cavalgar o Vento|Ride the Wind|a monk silhouette flying on swirling white wind with gold sparkles
breathOfWinter|Sopro do Inverno|Breath of Winter|a cone of pale blue frost breath with white snowflakes
eternalMountainDefense|Defesa da Montanha Eterna|Eternal Mountain Defense|a monk in a stance covered by grey stone skin plates
riverOfHungryFlame|Rio de Chama Faminta|River of Hungry Flame|a river of orange flame flowing as a wall with red embers
# --- paladino/patrulheiro: Senhor das Feras
rangersCompanion|Companheiro do Patrulheiro|Ranger's Companion|a green ranger's bow beside a wolf head on a leash
companionLobo|Companheiro: Lobo|Companion: Wolf|a grey wolf head in profile with bright yellow eyes
companionJavali|Companheiro: Javali|Companion: Boar|a brown boar head with white tusks
companionAranhaLobo|Companheiro: Aranha-lobo|Companion: Wolf Spider|a dark brown spider with a pattern on its back and eight legs
companionRato|Companheiro: Rato Gigante|Companion: Giant Rat|a large brown rat head with long whiskers
exceptionalTraining|Treinamento Excepcional|Exceptional Training|a wolf head wearing a gold training medal on a green ribbon
bestialFury|Fúria Bestial|Bestial Fury|a wolf head with two red claw slashes across it
shareSpells|Magias Compartilhadas|Share Spells|a green ranger hand and a wolf paw touching with a shared violet spark
# --- Mestre de Batalha: as quatro manobras acrescentadas na revisão; Pedra do Transmutador: ácido e trovejante
goadingAttack|Ataque Provocador|Goading Attack|a steel sword pointing at an angry red face with white steam puffs
distractingStrike|Ataque Distrativo|Distracting Strike|a steel sword with a bright white flash dazzling a pair of wide open eyes
riposte|Riposta|Riposte|two steel swords crossing with a bright white arrow curving back at the attacker
parry|Aparar|Parry|a steel sword blocking a smaller blade with a bright white spark at the crossing
stoneResistAcid|Pedra: Resistência a Ácido|Stone: Acid Resistance|a green acid drop being blocked by a big silver shield
stoneResistThunder|Pedra: Resistência a Trovejante|Stone: Thunder Resistance|a pale blue ring of sound waves being blocked by a big silver shield
'''

RACAS = '''
superiorDarkvision|Visão no Escuro Superior|Superior Darkvision|a bright gold eye with a larger dark purple ring around it
dwarvenArmorTraining|Treinamento com Armaduras Anãs|Dwarven Armor Training|a dwarven round shield beside a chain mail shirt
highElfCantrip|Truque de Alto Elfo|High Elf Cantrip|a small elven hand casting a violet spark with a blue star
fleetOfFoot|Pés Ligeiros|Fleet of Foot|a winged brown boot with blue speed lines
maskOfTheWild|Máscara da Natureza|Mask of the Wild|a green leafy hood with a pair of eyes peeking from foliage
sunlightSensitivity|Sensibilidade à Luz Solar|Sunlight Sensitivity|a bright gold sun with a pale squinting dark purple eye
drowMagic|Magia Drow|Drow Magic|a dark purple spider-web magic circle with a pale white spark
drowWeaponTraining|Treino Drow com Armas|Drow Weapon Training|a black hand crossbow beside a thin rapier
stoutResilience|Resiliência Robusta|Stout Resilience|a small round shield blocking a green poison droplet with a halfling hand
variantSkilled|Perícia Adicional|Skill Versatility|a human figure with three small coloured skill stars around it
variantFeat|Talento|Feat|a gold star medal on a red ribbon
draconicDamageResistance|Resistência Dracônica|Draconic Damage Resistance|a shield made of overlapping red dragon scales
naturalIllusionist|Ilusionista Nato|Natural Illusionist|a small gnome hand with a blue shimmering illusion spark
speakWithSmallBeasts|Falar com Bestas Pequenas|Speak with Small Beasts|a small gnome face beside a tiny squirrel with speech marks
'''

MAGIAS = '''
transposicaoBenigna|Transposição Benigna|Benign Transposition|two violet curved arrows swapping a small wizard silhouette between two portals
passoDasSombras|Passo das Sombras|Shadow Step|a monk silhouette stepping out of a dark violet shadow portal
'''


def entradas():
    for linha in CLASSES.strip().splitlines():
        if linha.startswith('#'):
            continue
        id_, pt, en, conceito = [x.strip() for x in linha.split('|')]
        yield {'id': id_, 'pt': pt, 'en': en, 'fonte': 'phb', 'categoria': 'classe', 'prefixo': 'classe-', 'conceito': conceito}
    for linha in RACAS.strip().splitlines():
        id_, pt, en, conceito = [x.strip() for x in linha.split('|')]
        yield {'id': id_, 'pt': pt, 'en': en, 'fonte': 'phb', 'categoria': 'raca', 'prefixo': 'raca-', 'conceito': conceito}
    for linha in MAGIAS.strip().splitlines():
        id_, pt, en, conceito = [x.strip() for x in linha.split('|')]
        yield {'id': id_, 'pt': pt, 'en': en, 'fonte': 'propria', 'categoria': 'magia', 'prefixo': 'magia-', 'conceito': conceito}
