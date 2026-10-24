# -*- coding: utf-8 -*-
"""
CATÁLOGO DE ÍCONES — AÇÕES, TRAÇOS DE RAÇA E RECURSOS DE CLASSE.

Ids de recurso e de traço em INGLÊS camelCase, porque é assim que o jogo já
os guarda em `c.features` (`secondWind`, `actionSurge`, `cunningAction`,
`preserveLife`). A chave do ícone é `acao-<id>`, `raca-<id>` ou
`classe-<id>`.

Raças e classes seguem o que o SRD 5.1 traz (uma subclasse por classe, as
sub-raças do SRD). Recurso que aparece em mais de uma classe — Ataque Extra,
Evasão, Especialização, Esquiva Sobrenatural, Corpo Atemporal, Defesa sem
Armadura, Passo da Terra — tem UM ícone só.

ALIAS: dois recursos que são a mesma coisa apontam para o mesmo ícone em vez
de gerar dois desenhos iguais. Visão no Escuro (traço) é a magia Visão no
Escuro; o estilo de luta Combate com Duas Armas é a ação de atacar com a mão
secundária.
"""

ALIAS = {
    'raca-darkvision': 'magia-visaoNoEscuro',
    'classe-twoWeaponFighting': 'acao-duasArmas',
    'classe-asi': 'classe-abilityScoreImprovement',
    'classe-dragonAncestor': 'raca-draconicAncestry',
    'classe-additionalFightingStyle': 'classe-fightingStyle',
    'classe-additionalMagicalSecrets': 'classe-magicalSecrets',
    # Marcador de subclasse = emblema da classe.
    'classe-primalPath': 'classe-barbaro', 'classe-bardCollege': 'classe-bardo',
    'classe-otherworldlyPatron': 'classe-bruxo', 'classe-divineDomain': 'classe-clerigo',
    'classe-druidCircle': 'classe-druida', 'classe-sorcerousOrigin': 'classe-feiticeiro',
    'classe-martialArchetype': 'classe-guerreiro', 'classe-roguishArchetype': 'classe-ladino',
    'classe-arcaneTradition': 'classe-mago', 'classe-monasticTradition': 'classe-monge',
    'classe-rangerArchetype': 'classe-patrulheiro',
}

ACOES = '''
atacar|Atacar|Attack|a longsword slashing diagonally with a bright arc
conjurar|Conjurar Magia|Cast a Spell|an open spellbook with a violet sparkle rising from it
disparada|Disparada|Dash|a running boot with long speed lines
desengajar|Desengajar|Disengage|a figure stepping backward away from a sword
esquivar|Esquivar|Dodge|a figure ducking under a sword swing
ajudar|Ajudar|Help|a hand reaching down to pull another hand up
esconder|Esconder-se|Hide|a hooded figure crouching behind a grey rock
preparar|Preparar Ação|Ready|an hourglass beside a raised sword
procurar|Procurar|Search|a magnifying glass over a trail of footprints
usarObjeto|Usar Objeto|Use an Object|a hand turning a brass key
agarrar|Agarrar|Grapple|two muscular arms locked in a wrestling hold
empurrar|Empurrar|Shove|a shoulder bashing forward with a white impact arrow
ataqueDeOportunidade|Ataque de Oportunidade|Opportunity Attack|a sword stabbing at the back of a figure walking away
duasArmas|Ataque com Duas Armas|Two-Weapon Fighting|two short swords held crossed, one in each hand
estabilizar|Estabilizar|Stabilize|a bandaged hand pressing on a bleeding wound
levantarSe|Levantar-se|Stand Up|a figure pushing up from the ground onto one knee
escapar|Escapar de Agarrão|Escape a Grapple|a hand breaking free from a grip with motion lines
'''

RACAS = '''
dwarvenResilience|Resiliência Anã|Dwarven Resilience|a stout dwarven shield blocking a green poison droplet
dwarvenCombatTraining|Treinamento Anão em Combate|Dwarven Combat Training|a dwarven battleaxe and warhammer crossed
toolProficiency|Proficiência com Ferramentas|Tool Proficiency|a smith's hammer and tongs crossed
stonecunning|Especialização em Rochas|Stonecunning|a dwarven eye studying a grey stone block
dwarvenToughness|Robustez Anã|Dwarven Toughness|a red heart encased in grey stone
keenSenses|Sentidos Aguçados|Keen Senses|a long pointed elven ear with sound arcs
feyAncestry|Ancestralidade Feérica|Fey Ancestry|a glowing butterfly-winged sparkle over a green leaf
trance|Transe|Trance|a meditating elven figure with closed eyes and a soft glow
elfWeaponTraining|Treinamento Élfico com Armas|Elf Weapon Training|an elegant longbow and longsword crossed
elvenCantrip|Truque Élfico|Cantrip (High Elf)|an elegant elven hand casting a small violet spark
extraLanguage|Idioma Adicional|Extra Language|an open book with two ribbons of different colours
lucky|Sortudo|Lucky|a green four-leaf clover with a golden sparkle
brave|Corajoso|Brave|a small round shield bearing a lion paw
halflingNimbleness|Agilidade Halfling|Halfling Nimbleness|a small figure slipping between two giant legs
naturallyStealthy|Furtividade Natural|Naturally Stealthy|a small hooded figure hiding behind a large silhouette
humanVersatility|Versatilidade Humana|Human Ability Increase|a human figure surrounded by six small coloured stars
draconicAncestry|Ancestralidade Dracônica|Draconic Ancestry|a large dragon scale with a dragon eye
breathWeapon|Arma de Sopro|Breath Weapon|a dragon head breathing a cone of fire
draconicResistance|Resistência Dracônica|Damage Resistance (Dragonborn)|a shield made of dragon scales
gnomeCunning|Esperteza Gnômica|Gnome Cunning|a gnome head with a glowing gear above it
artificersLore|Conhecimento de Artífice|Artificer's Lore|a magnifying glass over a small magical gem
tinker|Engenhoqueiro|Tinker|a tiny clockwork toy with a wind-up key
skillVersatility|Versatilidade em Perícias|Skill Versatility|a half-elf ear above two small crossed tools
menacing|Ameaçador|Menacing|a snarling half-orc face with tusks
relentlessEndurance|Resistência Implacável|Relentless Endurance|a cracked red heart still beating inside a clenched fist
savageAttacks|Ataques Selvagens|Savage Attacks|a heavy greataxe with a red critical slash
hellishResistance|Resistência Infernal|Hellish Resistance|a curved red tiefling horn with a small flame
infernalLegacy|Legado Infernal|Infernal Legacy|a tiefling tail curling around a small violet flame
'''

CLASSES = '''
barbaro|rage|Fúria|Rage|a muscular arm with red rage veins and a red burst
barbaro|unarmoredDefense|Defesa sem Armadura|Unarmored Defense|a bare muscular chest with a faint blue shield outline
barbaro|recklessAttack|Ataque Descuidado|Reckless Attack|a wild greataxe swing with red slash lines
barbaro|dangerSense|Sentido de Perigo|Danger Sense|an alert eye with a red warning spark
barbaro|extraAttack|Ataque Extra|Extra Attack|two swords striking in sequence with motion arcs
barbaro|fastMovement|Movimento Rápido|Fast Movement|a bare foot running with a dust cloud
barbaro|feralInstinct|Instinto Selvagem|Feral Instinct|a wolf eye glowing in shadow
barbaro|brutalCritical|Crítico Brutal|Brutal Critical|a bone shattered by an axe with red cracks
barbaro|relentlessRage|Fúria Implacável|Relentless Rage|a flaming red heart refusing to break
barbaro|persistentRage|Fúria Persistente|Persistent Rage|an endless loop of red flames
barbaro|indomitableMight|Poder Indomável|Indomitable Might|a fist cracking a stone block
barbaro|primalChampion|Campeão Primitivo|Primal Champion|a horned primal crown
barbaro|frenzy|Frenesi|Frenzy|a blur of red axe swings
barbaro|mindlessRage|Fúria Irracional|Mindless Rage|a red head with a shield blocking purple charm hearts
barbaro|intimidatingPresence|Presença Intimidante|Intimidating Presence|a roaring barbarian mouth with red shockwaves
barbaro|retaliation|Retaliação|Retaliation|a sword striking back out of a red wound
bardo|bardicInspiration|Inspiração Bárdica|Bardic Inspiration|a golden musical note with a bright sparkle
bardo|jackOfAllTrades|Pau pra Toda Obra|Jack of All Trades|a bundle of small tools tied together
bardo|songOfRest|Canção de Descanso|Song of Rest|a lute beside a small campfire
bardo|expertise|Especialização|Expertise|a golden star medal on a ribbon
bardo|fontOfInspiration|Fonte de Inspiração|Font of Inspiration|a fountain of golden musical notes
bardo|countercharm|Contraencanto|Countercharm|a musical note breaking a purple charm heart
bardo|magicalSecrets|Segredos Mágicos|Magical Secrets|a locked book with a violet glowing keyhole
bardo|superiorInspiration|Inspiração Superior|Superior Inspiration|a radiant golden note with three stars
bardo|cuttingWords|Palavras Cortantes|Cutting Words|a sharp quill shaped like a blade
bardo|peerlessSkill|Perícia Inigualável|Peerless Skill|a golden note above a sharp tool
clerigo|channelDivinity|Canalizar Divindade|Channel Divinity|a golden sun disk holy symbol pouring light
clerigo|turnUndead|Expulsar Mortos-Vivos|Turn Undead|a golden sun disk repelling a white skull
clerigo|destroyUndead|Destruir Mortos-Vivos|Destroy Undead|a white skull shattering under golden light
clerigo|divineIntervention|Intervenção Divina|Divine Intervention|a giant golden hand reaching down from clouds
clerigo|discipleOfLife|Discípulo da Vida|Disciple of Life|a green heart with a small golden sun disk
clerigo|preserveLife|Preservar a Vida|Preserve Life|a golden sun disk spreading green healing rays
clerigo|blessedHealer|Curandeiro Abençoado|Blessed Healer|two green hearts exchanging light
clerigo|divineStrike|Golpe Divino|Divine Strike|a mace striking with radiant golden light
clerigo|supremeHealing|Cura Suprema|Supreme Healing|a large green heart wearing a golden crown
druida|druidic|Druídico|Druidic|a carved standing stone engraved with a leaf
druida|wildShape|Forma Selvagem|Wild Shape|a druid silhouette turning into a brown bear
druida|timelessBody|Corpo Atemporal|Timeless Body|an hourglass with a green leaf inside
druida|beastSpells|Magias Bestiais|Beast Spells|a bear paw with a violet spark
druida|archdruid|Arquidruida|Archdruid|a crown of antlers and leaves
druida|naturalRecovery|Recuperação Natural|Natural Recovery|a green spiral of regrowing energy around a leaf
druida|landsStride|Passo da Terra|Land's Stride|a boot walking through brambles unharmed
druida|naturesWard|Proteção da Natureza|Nature's Ward|a shield made of a large green leaf
druida|naturesSanctuary|Santuário da Natureza|Nature's Sanctuary|a ring of protective leaves around a figure
druida|circleSpells|Magias do Círculo|Circle Spells|a small circle of standing stones
guerreiro|archery|Arquearia|Fighting Style: Archery|a bow with an arrow hitting a bullseye
guerreiro|defense|Defesa|Fighting Style: Defense|a heavy steel breastplate
guerreiro|dueling|Duelismo|Fighting Style: Dueling|a single rapier raised in a duelist's salute
guerreiro|greatWeaponFighting|Combate com Armas Grandes|Fighting Style: Great Weapon Fighting|a huge two-handed greatsword
guerreiro|protection|Proteção|Fighting Style: Protection|a shield raised in front of a smaller ally
guerreiro|secondWind|Retomar o Fôlego|Second Wind|a figure catching a deep breath with a green swirl
guerreiro|actionSurge|Ação Surpreendente|Action Surge|a golden lightning bolt behind a raised sword
guerreiro|indomitable|Indomável|Indomitable|a cracked shield still standing firm
guerreiro|improvedCritical|Crítico Aprimorado|Improved Critical|a sword with a red critical star at its tip
guerreiro|remarkableAthlete|Atleta Notável|Remarkable Athlete|a flexed arm next to a running boot
guerreiro|superiorCritical|Crítico Superior|Superior Critical|a sword with two red critical stars
guerreiro|survivor|Sobrevivente|Survivor|a battered shield with a green heart
monge|martialArts|Artes Marciais|Martial Arts|a clenched fist with motion lines
monge|ki|Ki|Ki|a glowing light blue energy orb above a palm
monge|flurryOfBlows|Rajada de Golpes|Flurry of Blows|several fists striking in a blur
monge|patientDefense|Defesa Paciente|Patient Defense|a calm open palm deflecting a blow
monge|stepOfTheWind|Passo do Vento|Step of the Wind|a monk leaping with wind swirls
monge|unarmoredMovement|Movimento sem Armadura|Unarmored Movement|bare feet running up a wall
monge|deflectMissiles|Desviar Projéteis|Deflect Missiles|a hand catching an arrow in flight
monge|slowFall|Queda Lenta|Slow Fall|a monk drifting down softly on a small cloud
monge|stunningStrike|Ataque Atordoante|Stunning Strike|a fist strike with yellow dizzy stars
monge|kiEmpoweredStrikes|Golpes de Ki|Ki-Empowered Strikes|a fist glowing with light blue ki energy
monge|evasion|Evasão|Evasion|a figure leaping aside from a fireball
monge|stillnessOfMind|Mente Tranquila|Stillness of Mind|a single calm water drop with ripples
monge|purityOfBody|Pureza do Corpo|Purity of Body|a glowing white monk figure
monge|tongueOfSunAndMoon|Língua do Sol e da Lua|Tongue of the Sun and Moon|a golden sun and a silver moon together
monge|diamondSoul|Alma de Diamante|Diamond Soul|a shining white diamond
monge|emptyBody|Corpo Vazio|Empty Body|a translucent monk silhouette
monge|perfectSelf|Perfeição|Perfect Self|a glowing golden lotus
monge|openHandTechnique|Técnica da Mão Aberta|Open Hand Technique|an open palm pushing out a shockwave
monge|wholenessOfBody|Integridade do Corpo|Wholeness of Body|a monk wrapped in a green healing glow
monge|tranquility|Tranquilidade|Tranquility|a lotus on calm water with a protective glow
monge|quiveringPalm|Palma Trêmula|Quivering Palm|a palm sending out trembling vibration waves
paladino|divineSense|Sentido Divino|Divine Sense|a glowing golden eye with a white aura
paladino|layOnHands|Cura pelas Mãos|Lay on Hands|two hands glowing with golden-green healing light
paladino|divineSmite|Destruição Divina|Divine Smite|a sword striking with a bolt of radiant golden light
paladino|divineHealth|Saúde Divina|Divine Health|a white shield bearing a green leaf
paladino|auraOfProtection|Aura de Proteção|Aura of Protection|a golden ring aura around a shield
paladino|auraOfCourage|Aura de Coragem|Aura of Courage|a golden ring aura around a lion head
paladino|improvedDivineSmite|Destruição Divina Aprimorada|Improved Divine Smite|a sword permanently glowing with radiant light
paladino|cleansingTouch|Toque Purificador|Cleansing Touch|a glowing hand dispelling purple smoke
paladino|sacredWeapon|Arma Sagrada|Sacred Weapon|a sword glowing white with a golden halo
paladino|turnTheUnholy|Expulsar o Profano|Turn the Unholy|a golden sun disk repelling a red demon
paladino|auraOfDevotion|Aura de Devoção|Aura of Devotion|a golden ring aura around a red heart
paladino|purityOfSpirit|Pureza de Espírito|Purity of Spirit|a white dove
paladino|holyNimbus|Halo Sagrado|Holy Nimbus|a radiant golden halo
patrulheiro|favoredEnemy|Inimigo Favorito|Favored Enemy|a hunting knife over a monster footprint
patrulheiro|naturalExplorer|Explorador Natural|Natural Explorer|a compass beside a pine tree
patrulheiro|primevalAwareness|Consciência Primitiva|Primeval Awareness|a ranger eye with green sensing waves
patrulheiro|hideInPlainSight|Esconder-se à Plena Vista|Hide in Plain Sight|a camouflaged cloak covered in leaves
patrulheiro|vanish|Desaparecer|Vanish|a ranger fading into green leaves
patrulheiro|feralSenses|Sentidos Selvagens|Feral Senses|a wolf ear and a wolf eye together
patrulheiro|foeSlayer|Matador de Inimigos|Foe Slayer|a bow with a red slaying arrow
patrulheiro|colossusSlayer|Matador de Colossos|Colossus Slayer|an arrow striking a giant's heel
patrulheiro|giantKiller|Matador de Gigantes|Giant Killer|a sword parrying a giant club
patrulheiro|hordeBreaker|Quebrador de Hordas|Horde Breaker|an arrow piercing two targets in a row
patrulheiro|escapeTheHorde|Escapar da Horda|Escape the Horde|a figure slipping between two enemies
patrulheiro|multiattackDefense|Defesa contra Múltiplos Ataques|Multiattack Defense|a shield blocking three claws
patrulheiro|steelWill|Vontade de Aço|Steel Will|a steel helmet with a calm eye
patrulheiro|volley|Rajada|Volley|many arrows fired in a fan
patrulheiro|whirlwindAttack|Ataque Giratório|Whirlwind Attack|a spinning sword whirlwind
patrulheiro|standAgainstTheTide|Resistir à Maré|Stand Against the Tide|a shield redirecting a blow toward another enemy
patrulheiro|uncannyDodge|Esquiva Sobrenatural|Uncanny Dodge|a figure twisting away from a sword with a half-broken slash
ladino|sneakAttack|Ataque Furtivo|Sneak Attack|a dagger striking out of a dark shadow
ladino|thievesCant|Gíria dos Ladrões|Thieves' Cant|a secret chalk mark scratched on a stone wall
ladino|cunningAction|Ação Ardilosa|Cunning Action|a hooded figure dashing away in a puff of smoke
ladino|reliableTalent|Talento Confiável|Reliable Talent|a lockpick with a golden sparkle
ladino|blindsense|Sentido Cego|Blindsense|a blindfolded head with sound waves
ladino|slipperyMind|Mente Escorregadia|Slippery Mind|a head with a slippery fish sliding away
ladino|elusive|Elusivo|Elusive|a shadowy figure that a sword passes through
ladino|strokeOfLuck|Golpe de Sorte|Stroke of Luck|a golden coin flipping in the air
ladino|fastHands|Mãos Rápidas|Fast Hands|a gloved hand snatching a coin pouch
ladino|secondStoryWork|Trabalho no Segundo Andar|Second-Story Work|a figure climbing a wall with a rope
ladino|supremeSneak|Furtividade Suprema|Supreme Sneak|a soft silent footstep on tiptoe
ladino|useMagicDevice|Usar Dispositivo Mágico|Use Magic Device|a hand holding a glowing wand
ladino|thiefsReflexes|Reflexos de Ladrão|Thief's Reflexes|a figure with a double motion afterimage
feiticeiro|fontOfMagic|Fonte de Magia|Font of Magic|a glowing violet crystal spring
feiticeiro|sorceryPoints|Pontos de Feitiçaria|Sorcery Points|three glowing violet gems
feiticeiro|carefulSpell|Magia Cuidadosa|Careful Spell|a violet spell bubble shielding an ally
feiticeiro|distantSpell|Magia Distante|Distant Spell|a violet spark with a long arrow
feiticeiro|empoweredSpell|Magia Potencializada|Empowered Spell|a violet spark with a red power burst
feiticeiro|extendedSpell|Magia Prolongada|Extended Spell|an hourglass with a violet spark
feiticeiro|heightenedSpell|Magia Elevada|Heightened Spell|a violet spark with an upward arrow
feiticeiro|quickenedSpell|Magia Acelerada|Quickened Spell|a violet spark with a golden lightning bolt
feiticeiro|subtleSpell|Magia Sutil|Subtle Spell|a silent violet spark beside a closed mouth
feiticeiro|twinnedSpell|Magia Duplicada|Twinned Spell|two identical violet sparks
feiticeiro|sorcerousRestoration|Restauração Feiticeira|Sorcerous Restoration|a violet crystal refilling with light
feiticeiro|draconicResilience|Resiliência Dracônica|Draconic Resilience|dragon scales covering skin
feiticeiro|elementalAffinity|Afinidade Elemental|Elemental Affinity|a dragon scale with a flame
feiticeiro|dragonWings|Asas de Dragão|Dragon Wings|a pair of dragon wings
feiticeiro|draconicPresence|Presença Dracônica|Draconic Presence|a dragon head silhouette with a golden aura
bruxo|pactMagic|Magia de Pacto|Pact Magic|a violet pact contract with a wax seal
bruxo|pactOfTheChain|Pacto da Corrente|Pact of the Chain|a small imp familiar on a chain
bruxo|pactOfTheBlade|Pacto da Lâmina|Pact of the Blade|a violet spectral blade
bruxo|pactOfTheTome|Pacto do Tomo|Pact of the Tome|a dark grimoire with a violet glow
bruxo|mysticArcanum|Arcano Místico|Mystic Arcanum|a glowing violet arcane seal
bruxo|eldritchMaster|Mestre Místico|Eldritch Master|a crowned violet eye
bruxo|darkOnesBlessing|Bênção do Obscuro|Dark One's Blessing|a dark heart with red flames
bruxo|darkOnesOwnLuck|Sorte do Próprio Obscuro|Dark One's Own Luck|a red demonic coin
bruxo|fiendishResilience|Resiliência Infernal|Fiendish Resilience|a red infernal shield
bruxo|hurlThroughHell|Lançar no Inferno|Hurl Through Hell|a figure falling into a fiery pit
bruxo|agonizingBlast|Explosão Agonizante|Agonizing Blast|a violet eldritch beam with red spikes
bruxo|armorOfShadows|Armadura de Sombras|Armor of Shadows|a violet shadowy breastplate
bruxo|ascendantStep|Passo Ascendente|Ascendant Step|a figure floating upward on violet wisps
bruxo|beastSpeech|Fala Bestial|Beast Speech|a cat head with a violet speech wave
bruxo|beguilingInfluence|Influência Sedutora|Beguiling Influence|a violet smiling mask
bruxo|bewitchingWhispers|Sussurros Enfeitiçantes|Bewitching Whispers|a violet whisper flowing into an ear with a heart
bruxo|bookOfAncientSecrets|Livro de Segredos Antigos|Book of Ancient Secrets|an ancient book with a violet ritual circle
bruxo|chainsOfCarceri|Correntes de Carceri|Chains of Carceri|glowing red infernal chains
bruxo|devilsSight|Visão do Diabo|Devil's Sight|a red devil eye in darkness
bruxo|dreadfulWord|Palavra Terrível|Dreadful Word|a violet mouth with a dark shockwave
bruxo|eldritchSight|Visão Mística|Eldritch Sight|a violet glowing eye
bruxo|eldritchSpear|Lança Mística|Eldritch Spear|a long violet spear of energy
bruxo|eyesOfTheRuneKeeper|Olhos do Guardião das Runas|Eyes of the Rune Keeper|an eye above glowing carved stones
bruxo|fiendishVigor|Vigor Infernal|Fiendish Vigor|a red heart with a dark violet aura
bruxo|gazeOfTwoMinds|Olhar de Duas Mentes|Gaze of Two Minds|two overlapping eyes
bruxo|lifedrinker|Bebedor de Vida|Lifedrinker|a violet blade draining a red drop
bruxo|maskOfManyFaces|Máscara de Muitas Faces|Mask of Many Faces|a violet mask with shifting faces
bruxo|masterOfMyriadForms|Mestre das Miríades de Formas|Master of Myriad Forms|a figure with several shifting silhouettes
bruxo|minionsOfChaos|Lacaios do Caos|Minions of Chaos|a summoning circle with a small elemental
bruxo|mireTheMind|Atolar a Mente|Mire the Mind|a head sinking into violet mud
bruxo|mistyVisions|Visões Nebulosas|Misty Visions|a violet mist with a faint illusion inside
bruxo|oneWithShadows|Um com as Sombras|One with Shadows|a figure merging into shadow, outlined in violet
bruxo|otherworldlyLeap|Salto Extraplanar|Otherworldly Leap|a violet boot leaping high
bruxo|repellingBlast|Explosão Repulsora|Repelling Blast|a violet beam pushing a figure back
bruxo|sculptorOfFlesh|Escultor da Carne|Sculptor of Flesh|a violet hand reshaping a small figure
bruxo|signOfIllOmen|Sinal de Mau Agouro|Sign of Ill Omen|a black crow with a violet aura
bruxo|thiefOfFiveFates|Ladrão dos Cinco Destinos|Thief of Five Fates|five violet threads being cut by scissors
bruxo|thirstingBlade|Lâmina Sedenta|Thirsting Blade|two violet blades striking together
bruxo|visionsOfDistantRealms|Visões de Reinos Distantes|Visions of Distant Realms|a violet portal with an eye
bruxo|voiceOfTheChainMaster|Voz do Mestre da Corrente|Voice of the Chain Master|a small imp with a speech wave
bruxo|whispersOfTheGrave|Sussurros da Sepultura|Whispers of the Grave|a gravestone with a violet whisper
bruxo|witchSight|Visão da Bruxa|Witch Sight|a witch eye revealing a shapechanger's shadow
mago|arcaneRecovery|Recuperação Arcana|Arcane Recovery|a spellbook with a violet circular arrow
mago|spellMastery|Domínio de Magia|Spell Mastery|a violet spark wearing a golden crown
mago|signatureSpells|Magias de Assinatura|Signature Spells|two violet sparks beside a golden quill
mago|evocationSavant|Especialista em Evocação|Evocation Savant|a violet book with a fire spark
mago|sculptSpells|Esculpir Magias|Sculpt Spells|a fireball curving around an ally silhouette
mago|potentCantrip|Truque Potente|Potent Cantrip|a small spark with a red burst
mago|empoweredEvocation|Evocação Fortalecida|Empowered Evocation|a fire spark with a violet power aura
mago|overchannel|Sobrecarga|Overchannel|a cracked violet orb overflowing with energy
geral|spellcasting|Conjuração|Spellcasting|a glowing rolled spell scroll with a violet seal
geral|abilityScoreImprovement|Aumento no Valor de Atributo|Ability Score Improvement|a golden upward arrow over a stone bust
# --- emblemas das classes, das subclasses do SRD e das características de escolha
# (entraram com o motor de progressão do 1º ao 20º). Os marcadores de subclasse
# (primalPath, divineDomain...) usam o emblema da classe por ALIAS.
barbaro|barbaro|Bárbaro|Barbarian|a heavy steel greataxe with a fur-wrapped handle
bardo|bardo|Bardo|Bard|a golden lute with a bright violet music note above it
bruxo|bruxo|Bruxo|Warlock|a dark violet tome with a glowing bright violet eye on its cover
clerigo|clerigo|Clérigo|Cleric|a silver mace whose head is a bright golden sunburst
druida|druida|Druida|Druid|a gnarled wooden staff topped with bright green leaves
feiticeiro|feiticeiro|Feiticeiro|Sorcerer|an open palm with a bright orange and violet flame swirling above it
guerreiro|guerreiro|Guerreiro|Fighter|a steel longsword standing in front of a round wooden shield
ladino|ladino|Ladino|Rogue|a dark gray hood with a bright silver dagger blade crossing under it
mago|mago|Mago|Wizard|a tall pointed blue wizard hat with bright silver stars
monge|monge|Monge|Monk|a bamboo staff with a white cloth band wrapped around its middle
paladino|paladino|Paladino|Paladin|a bright silver great helm with a golden halo ring above it
patrulheiro|patrulheiro|Patrulheiro|Ranger|a green longbow with a nocked arrow and a single leaf
barbaro|subBerserker|Caminho do Berserker|Path of the Berserker|a horned iron helm with glowing red eyes in its visor
bardo|subConhecimento|Colégio do Conhecimento|College of Lore|a white feather quill crossing an open book with a golden page
bruxo|subCorruptor|O Corruptor|The Fiend|a red horned demon skull wreathed in orange flames
clerigo|subVida|Domínio da Vida|Life Domain|a white lily flower with a soft golden glow
druida|subTerra|Círculo da Terra|Circle of the Land|a small floating rock island with a green tree on top
feiticeiro|subDraconica|Linhagem Dracônica|Draconic Bloodline|a small red dragon curled around a glowing violet orb
guerreiro|subCampeao|Campeão|Champion|a golden laurel wreath around a steel sword hilt
ladino|subLadrao|Ladrão|Thief|a fat brown coin purse spilling bright gold coins
mago|subEvocacao|Escola de Evocação|School of Evocation|a violet orb bursting with orange fire and blue lightning
monge|subMaoAberta|Caminho da Mão Aberta|Way of the Open Hand|an open palm pushing a bright white circular shockwave
paladino|subDevocao|Juramento de Devoção|Oath of Devotion|an upright silver sword with bright golden wings at its hilt
patrulheiro|subCacador|Caçador|Hunter|a curved hunting horn with a green cord and a white fang
geral|fightingStyle|Estilo de Luta|Fighting Style|a wooden training dummy with a sword stuck in its chest
bardo|bonusProficiencies|Proficiências Adicionais|Bonus Proficiencies|an open book with three bright colored bookmarks
druida|bonusCantrip|Truque Adicional|Bonus Cantrip|a tiny bright green spark sprouting from a seed
paladino|sacredOath|Juramento Sagrado|Sacred Oath|a raised steel gauntlet with a glowing golden palm
patrulheiro|huntersPrey|Presa do Caçador|Hunter's Prey|a red target ring over a large beast paw print
patrulheiro|defensiveTactics|Táticas Defensivas|Defensive Tactics|a green cloak swirling around a round shield
patrulheiro|multiattack|Ataque Múltiplo|Multiattack|three arrows flying in a fan
patrulheiro|superiorHuntersDefense|Defesa Superior do Caçador|Superior Hunter's Defense|a steel bracer with a green leaf emblem deflecting an arrow
feiticeiro|metamagic|Metamagia|Metamagic|a violet spell spark inside a turning golden gear
bruxo|eldritchInvocations|Invocações Místicas|Eldritch Invocations|three floating violet rune stones glowing
bruxo|pactBoon|Dádiva do Pacto|Pact Boon|a parchment contract scroll with a red wax seal and a golden ribbon
'''


def entradas():
    for linha in ACOES.strip().splitlines():
        id_, pt, en, conceito = [x.strip() for x in linha.split('|')]
        yield {'id': id_, 'pt': pt, 'en': en, 'fonte': 'srd', 'categoria': 'acao',
               'prefixo': 'acao-', 'conceito': conceito}
    for linha in RACAS.strip().splitlines():
        id_, pt, en, conceito = [x.strip() for x in linha.split('|')]
        yield {'id': id_, 'pt': pt, 'en': en, 'fonte': 'srd', 'categoria': 'raca',
               'prefixo': 'raca-', 'conceito': conceito}
    for linha in CLASSES.strip().splitlines():
        if linha.startswith('#'):
            continue
        classe, id_, pt, en, conceito = [x.strip() for x in linha.split('|')]
        yield {'id': id_, 'pt': pt, 'en': en, 'fonte': 'srd', 'categoria': 'classe',
               'classe': classe, 'prefixo': 'classe-', 'conceito': conceito}
