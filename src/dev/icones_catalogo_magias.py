# -*- coding: utf-8 -*-
"""
CATÁLOGO DE ÍCONES — MAGIAS DO LIVRO DO JOGADOR.

O dono do projeto pediu o Livro do Jogador INTEIRO, não só o SRD. Então:
- `srd`  — magia do SRD 5.1 (CC-BY-4.0). A regra pode ser implementada a
           partir do SRD.
- `phb`  — magia do Livro do Jogador FORA do SRD. O ícone pode existir, mas a
           regra, quando for implementada, tem de ser escrita como conteúdo
           próprio (`fonte: 'propria'`), sem copiar o texto do livro.
Os nomes em português são tradução de trabalho; os ids seguem o estilo de
`rules/spells.js` (camelCase sem acento) e são a chave do ícone, `magia-<id>`.

Cada linha: id | nome pt | nome SRD/PHB em inglês | nível | fonte | conceito
`conceito` é o que vai para o gerador: UM objeto, forma grande, sem texto,
com a cor do tipo de dano (fogo vermelho-laranja, frio azul claro, elétrico
azul-branco, trovejante anéis, radiante dourado, necrótico roxo, veneno e
ácido verde, energético violeta, cura verde).

As 15 magias que já têm ícone ficam fora (`EXISTEM`), menos Perdição e
Infligir Ferimentos, que a revisão anterior reprovou por serem escuras demais
e voltam aqui com um conceito mais claro.
"""

EXISTEM = {'chamaSagrada', 'raioDeFogo', 'raioDeGelo', 'misselMagico', 'maosFlamejantes',
           'sono', 'curarFerimentos', 'palavraCurativa', 'bencao', 'toqueArrepiante',
           'ondaTrovejante', 'raioDeDoenca', 'raioGuiado'}

MAGIAS = '''
respingoAcido|Respingo Ácido|Acid Splash|0|srd|a burst of bright green acid splashing outward in round droplets
protecaoContraLaminas|Proteção contra Lâminas|Blade Ward|0|phb|a sword blade glancing off a small glowing blue round ward
luzesDancantes|Luzes Dançantes|Dancing Lights|0|srd|four small floating golden orbs of light arranged in a loose ring
arteDruidica|Arte Druídica|Druidcraft|0|srd|a sprouting green seedling with two leaves and a small white sparkle
rajadaMistica|Rajada Mística|Eldritch Blast|0|srd|a crackling violet beam of eldritch energy with a bright white core
amizade|Amizade|Friends|0|phb|two hands clasped in a friendly handshake with a small golden sparkle
orientacao|Orientação|Guidance|0|srd|a glowing golden four-pointed guiding star above an open palm
luz|Luz|Light|0|srd|a bright white-gold orb of light radiating short rays
maoMagica|Mão Mágica|Mage Hand|0|srd|a floating translucent pale-blue spectral hand with no arm
consertar|Consertar|Mending|0|srd|a cracked clay pot being sealed by a glowing golden seam
mensagem|Mensagem|Message|0|srd|a pale ear with a thin blue wisp of whispered sound flowing into it
ilusaoMenor|Ilusão Menor|Minor Illusion|0|srd|a shimmering violet translucent crate drawn in faint glowing outline
borrifoVenenoso|Borrifo Venenoso|Poison Spray|0|srd|a thick puff of bright green poisonous gas cloud
prestidigitacao|Prestidigitação|Prestidigitation|0|srd|an open hand with small multicoloured sparkles dancing above the fingertips
produzirChama|Produzir Chama|Produce Flame|0|srd|a small bright flame burning in an open palm
resistencia|Resistência|Resistance|0|srd|a small round amulet glowing with a protective light blue aura
shillelagh|Shillelagh|Shillelagh|0|srd|a gnarled wooden club glowing with green nature magic
toqueChocante|Toque Chocante|Shocking Grasp|0|srd|a gauntleted hand crackling with blue-white lightning
pouparOsMoribundos|Poupar os Moribundos|Spare the Dying|0|srd|a small white candle with a steady bright flame
taumaturgia|Taumaturgia|Thaumaturgy|0|srd|a golden starburst of a minor divine wonder above a small stone altar
ataqueCerteiro|Ataque Certeiro|True Strike|0|srd|a golden glowing eye inside a red target crosshair
zombariaViciosa|Zombaria Viciosa|Vicious Mockery|0|srd|a jeering jester mouth sticking out its tongue with purple sparkles
alarme|Alarme|Alarm|1|srd|a small brass bell ringing with blue sound arcs
amizadeAnimal|Amizade Animal|Animal Friendship|1|srd|a fox head beside a small green heart
armaduraDeAgathys|Armadura de Agathys|Armor of Agathys|1|phb|a breastplate covered in sharp pale blue ice crystals
bracosDeHadar|Braços de Hadar|Arms of Hadar|1|phb|dark violet tentacles erupting upward from a small black void, outlined in bright purple
perdicao|Perdição|Bane|1|srd|a bright silver iron shackle with one glowing violet chain link
enfeiticarPessoa|Enfeitiçar Pessoa|Charm Person|1|srd|a purple heart with a small white spiral in its center
orbeCromatico|Orbe Cromático|Chromatic Orb|1|phb|a glowing orb split into red, blue, green and gold quarters
borrifoDeCores|Borrifo de Cores|Color Spray|1|srd|a fan of red, gold, green and blue light rays spreading out
comando|Comando|Command|1|srd|a pointing hand with golden rays of authority
dueloCompelido|Duelo Compelido|Compelled Duel|1|phb|two crossed swords inside a golden ring
compreenderIdiomas|Compreender Idiomas|Comprehend Languages|1|srd|an open book with a glowing golden eye above its blank pages
criarDestruirAgua|Criar ou Destruir Água|Create or Destroy Water|1|srd|a blue water droplet half evaporating into white steam
detectarBemMal|Detectar o Bem e o Mal|Detect Evil and Good|1|srd|an eye whose iris is half gold and half purple
detectarMagia|Detectar Magia|Detect Magic|1|srd|an eye surrounded by a ring of violet sparkles
detectarVenenoDoenca|Detectar Veneno e Doença|Detect Poison and Disease|1|srd|a magnifying glass over a green droplet
disfarcarSe|Disfarçar-se|Disguise Self|1|srd|a plain pale half-mask held up on a stick
sussurrosDissonantes|Sussurros Dissonantes|Dissonant Whispers|1|phb|a jagged purple sound wave entering a pale ear
favorDivino|Favor Divino|Divine Favor|1|srd|a sword blade glowing with golden radiant light
golpeConstritor|Golpe Constritor|Ensnaring Strike|1|phb|an arrow wrapped in thorny green vines
emaranhar|Emaranhar|Entangle|1|srd|green grasping vines sprouting from the ground in a tangle
recuoAcelerado|Recuo Acelerado|Expeditious Retreat|1|srd|a winged boot with speed lines
fogoDasFadas|Fogo das Fadas|Faerie Fire|1|srd|a small humanoid silhouette outlined in glowing violet fairy sparkles
vidaFalsa|Vida Falsa|False Life|1|srd|a pale violet heart with a bright glowing outline
quedaSuave|Queda Suave|Feather Fall|1|srd|a single white feather drifting down with a soft glow
encontrarFamiliar|Encontrar Familiar|Find Familiar|1|srd|a small brown owl with a violet magic sparkle
discoFlutuante|Disco Flutuante|Floating Disk|1|srd|a flat silvery force disk hovering above the ground
nevoaObscurecente|Névoa Obscurecente|Fog Cloud|1|srd|a thick billowing grey-white fog cloud
bomFruto|Bom Fruto|Goodberry|1|srd|a sprig with three glowing red berries and green leaves
graxa|Graxa|Grease|1|srd|a slick puddle of shiny brown grease with a slipping boot
saraivadaDeEspinhos|Saraivada de Espinhos|Hail of Thorns|1|phb|an arrow bursting into a spray of green thorns
repreensaoInfernal|Repreensão Infernal|Hellish Rebuke|1|srd|a horned demonic hand engulfed in orange flames
heroismo|Heroísmo|Heroism|1|srd|a golden lion head emblem glowing with courage
bruxaria|Bruxaria|Hex|1|phb|a crooked dark finger pointing with a bright violet curse wisp
risoHisterico|Riso Histérico|Hideous Laughter|1|srd|a wide cackling laughing mouth with tears of joy
marcaDoCacador|Marca do Caçador|Hunter's Mark|1|srd|a red target crosshair over a green arrowhead
identificar|Identificar|Identify|1|srd|a magnifying glass over a glowing golden ring
escritaIlusoria|Escrita Ilusória|Illusory Script|1|srd|a rolled parchment scroll shimmering with violet light
infligirFerimentos|Infligir Ferimentos|Inflict Wounds|1|srd|a bright violet glowing claw of necrotic energy above a dripping red wound
salto|Salto|Jump|1|srd|a leaping boot arcing over a small rock
passosLargos|Passos Largos|Longstrider|1|srd|a trail of three footprints with green speed lines
armaduraArcana|Armadura Arcana|Mage Armor|1|srd|a translucent light blue magical breastplate
protecaoBemMal|Proteção contra o Bem e o Mal|Protection from Evil and Good|1|srd|a silver shield with an emblem half gold and half purple
purificarAlimentos|Purificar Alimentos e Bebidas|Purify Food and Drink|1|srd|a silver goblet with a small golden purifying sparkle
santuario|Santuário|Sanctuary|1|srd|a small glowing white dome of protective light
golpeAbrasador|Golpe Abrasador|Searing Smite|1|phb|a sword blade wreathed in searing flames striking down
escudoArcano|Escudo Arcano|Shield|1|srd|a hexagonal translucent light blue force barrier
escudoDaFe|Escudo da Fé|Shield of Faith|1|srd|a round shield glowing with a golden radiant halo
imagemSilenciosa|Imagem Silenciosa|Silent Image|1|srd|a translucent ghostly wolf drawn in faint violet light
falarComAnimais|Falar com Animais|Speak with Animals|1|srd|a grey wolf head with a small sound wave from its mouth
golpeTrovejante|Golpe Trovejante|Thunderous Smite|1|phb|a war hammer striking with blue-white thunder rings
servoInvisivel|Servo Invisível|Unseen Servant|1|srd|a floating feather duster with no one holding it and a faint sparkle
raioDeBruxa|Raio de Bruxa|Witch Bolt|1|phb|a crackling blue lightning arc tethered between two points
golpeColerico|Golpe Colérico|Wrathful Smite|1|phb|a sword with a dark purple aura of dread and a bright purple edge
flechaAcida|Flecha Ácida|Acid Arrow|2|srd|a green arrow dripping bright green acid
ajuda|Ajuda|Aid|2|srd|three small golden hearts in a row
alterarSe|Alterar-se|Alter Self|2|srd|a face half human and half fish with gills
mensageiroAnimal|Mensageiro Animal|Animal Messenger|2|srd|a small bird carrying a rolled message tied to its leg
trancaArcana|Tranca Arcana|Arcane Lock|2|srd|a closed padlock glowing with violet magic
auraMagicaDoArcanista|Aura Mágica do Arcanista|Arcanist's Magic Aura|2|srd|a sword wrapped in a false shimmering violet aura
augurio|Augúrio|Augury|2|srd|three carved bone sticks falling with a golden glow
peleDeArvore|Pele de Árvore|Barkskin|2|srd|a forearm covered in brown tree bark
sentidoBestial|Sentido Bestial|Beast Sense|2|phb|a hawk eye overlapping a human eye
cegueiraSurdez|Cegueira/Surdez|Blindness/Deafness|2|srd|an eye and an ear both covered by a dark band
borrao|Borrão|Blur|2|srd|a figure blurred into two overlapping copies with motion smears
golpeMarcante|Golpe Marcante|Branding Smite|2|phb|a sword burning a glowing golden brand mark
acalmarEmocoes|Acalmar Emoções|Calm Emotions|2|srd|a calm light blue wave smoothing a jagged red line
nuvemDeAdagas|Nuvem de Adagas|Cloud of Daggers|2|phb|a swirling cloud of small spinning silver daggers
chamaContinua|Chama Contínua|Continual Flame|2|srd|an everburning flame on a stone torch holder
coroaDaLoucura|Coroa da Loucura|Crown of Madness|2|phb|a twisted thorny purple crown
escuridao|Escuridão|Darkness|2|srd|a sphere of pure black darkness with a bright violet rim
visaoNoEscuro|Visão no Escuro|Darkvision|2|srd|a dark eye with a glowing green pupil
detectarPensamentos|Detectar Pensamentos|Detect Thoughts|2|srd|a head silhouette with violet thought waves rising from it
aprimorarAtributo|Aprimorar Atributo|Enhance Ability|2|srd|a flexed arm with an upward golden arrow
aumentarReduzir|Aumentar/Reduzir|Enlarge/Reduce|2|srd|a big and a small mushroom side by side with a violet sparkle
fascinar|Fascinar|Enthrall|2|srd|a golden lyre with entranced glowing musical notes
encontrarMontaria|Encontrar Montaria|Find Steed|2|srd|a spectral white horse head glowing with golden light
encontrarArmadilhas|Encontrar Armadilhas|Find Traps|2|srd|a steel bear trap highlighted by a golden glow
laminaFlamejante|Lâmina Flamejante|Flame Blade|2|srd|a scimitar blade made entirely of fire
esferaFlamejante|Esfera Flamejante|Flaming Sphere|2|srd|a rolling ball of fire leaving a burning trail
repousoTranquilo|Repouso Tranquilo|Gentle Repose|2|srd|a closed coffin with a soft white glow
lufadaDeVento|Lufada de Vento|Gust of Wind|2|srd|strong curved light blue wind gust lines
esquentarMetal|Esquentar Metal|Heat Metal|2|srd|a red-hot glowing iron helmet
imobilizarPessoa|Imobilizar Pessoa|Hold Person|2|srd|a human silhouette bound by bright violet magic chains
invisibilidade|Invisibilidade|Invisibility|2|srd|a dotted outline of a figure fading to nothing
arrombar|Arrombar|Knock|2|srd|an open padlock with a golden burst
restauracaoMenor|Restauração Menor|Lesser Restoration|2|srd|a small green healing leaf over a white droplet
levitacao|Levitação|Levitate|2|srd|a figure floating above the ground with a violet upward glow
localizarAnimaisPlantas|Localizar Animais ou Plantas|Locate Animals or Plants|2|srd|a compass needle pointing at a green leaf
localizarObjeto|Localizar Objeto|Locate Object|2|srd|a compass needle pointing at a small golden key
bocaMagica|Boca Mágica|Magic Mouth|2|srd|a carved stone mouth on a wall, open
armaMagica|Arma Mágica|Magic Weapon|2|srd|a longsword glowing with violet enchantment
imagemEspelhada|Imagem Espelhada|Mirror Image|2|srd|three overlapping copies of the same figure
passoNebuloso|Passo Nebuloso|Misty Step|2|srd|a puff of silver mist with a footprint appearing out of it
raioLunar|Raio Lunar|Moonbeam|2|srd|a pale silver beam of moonlight falling from a small crescent moon
passosSemPegadas|Passos sem Pegadas|Pass without Trace|2|srd|a footprint fading into green leaves
forcaFantasmagorica|Força Fantasmagórica|Phantasmal Force|2|phb|a shadowy phantom claw emerging from a head, outlined in bright purple
oracaoDeCura|Oração de Cura|Prayer of Healing|2|srd|three small green hearts under a golden halo
protecaoContraVeneno|Proteção contra Veneno|Protection from Poison|2|srd|a silver shield with a green droplet emblem
raioDoEnfraquecimento|Raio do Enfraquecimento|Ray of Enfeeblement|2|srd|a black ray hitting a drooping weakened arm
truqueDaCorda|Truque da Corda|Rope Trick|2|srd|a rope rising straight up into a small glowing portal
raioArdente|Raio Ardente|Scorching Ray|2|srd|three fiery orange rays shooting in parallel
verInvisibilidade|Ver o Invisível|See Invisibility|2|srd|an eye revealing a faint dotted ghost figure
despedacar|Despedaçar|Shatter|2|srd|a shattering crystal with blue-white sound cracks
silencio|Silêncio|Silence|2|srd|a grey bubble of silence around a bell with no sound
patasDeAranha|Patas de Aranha|Spider Climb|2|srd|a hand clinging to a wall next to a small spider
crescimentoDeEspinhos|Crescimento de Espinhos|Spike Growth|2|srd|sharp thorny spikes sprouting from the ground
armaEspiritual|Arma Espiritual|Spiritual Weapon|2|srd|a floating spectral golden mace
sugestao|Sugestão|Suggestion|2|srd|a swaying golden pendulum
eloDeProtecao|Elo de Proteção|Warding Bond|2|srd|two silver rings linked together
teia|Teia|Web|2|srd|a sticky white spider web
zonaDaVerdade|Zona da Verdade|Zone of Truth|2|srd|a glowing golden circle on the ground with an eye in the center
animarMortos|Animar Mortos|Animate Dead|3|srd|a skeletal hand rising from a grave
auraDeVitalidade|Aura de Vitalidade|Aura of Vitality|3|phb|a green glowing ring aura with small hearts
farolDeEsperanca|Farol de Esperança|Beacon of Hope|3|srd|a beacon tower radiating warm golden light
rogarMaldicao|Rogar Maldição|Bestow Curse|3|srd|a broken circle mark dripping bright purple curse
piscar|Piscar|Blink|3|srd|a figure half solid and half fading into a violet portal
golpeCegante|Golpe Cegante|Blinding Smite|3|phb|a sword flashing with a blinding white light burst
convocarRelampagos|Convocar Relâmpagos|Call Lightning|3|srd|a dark storm cloud shooting a blue-white lightning bolt down
clarividencia|Clarividência|Clairvoyance|3|srd|a crystal ball with a glowing eye inside
conjurarAnimais|Conjurar Animais|Conjure Animals|3|srd|a spectral wolf leaping out of a green magic circle
conjurarRajada|Conjurar Rajada|Conjure Barrage|3|phb|a cone of many spectral daggers flying outward
contramagica|Contramágica|Counterspell|3|srd|a violet magic bolt snapped in half by an open hand
criarAlimentoAgua|Criar Alimento e Água|Create Food and Water|3|srd|a loaf of bread next to a water jug
mantoDoCruzado|Manto do Cruzado|Crusader's Mantle|3|phb|a golden-trimmed cape billowing with radiant light
luzDoDia|Luz do Dia|Daylight|3|srd|a bright sun-like sphere of daylight
dissiparMagia|Dissipar Magia|Dispel Magic|3|srd|a violet sparkle being blown apart into fragments
armaElemental|Arma Elemental|Elemental Weapon|3|phb|a sword whose blade glows red, blue and green
medo|Medo|Fear|3|srd|a dark looming shadow with two glowing red eyes
fingirMorte|Fingir Morte|Feign Death|3|phb|a pale sleeping face with x-shaped closed eyes
bolaDeFogo|Bola de Fogo|Fireball|3|srd|a huge exploding fireball
voo|Voo|Fly|3|srd|a pair of white feathered wings
formaGasosa|Forma Gasosa|Gaseous Form|3|srd|a figure dissolving into misty grey vapor
glifoDeProtecao|Glifo de Proteção|Glyph of Warding|3|srd|a glowing golden circular glyph on the floor
velocidade|Velocidade|Haste|3|srd|a golden lightning bolt over a running figure
fomeDeHadar|Fome de Hadar|Hunger of Hadar|3|phb|a sphere of black void with tiny glowing purple eyes and a bright purple rim
padraoHipnotico|Padrão Hipnótico|Hypnotic Pattern|3|srd|a swirling multicoloured hypnotic spiral
flechaRelampago|Flecha Relâmpago|Lightning Arrow|3|phb|an arrow turning into a blue-white lightning bolt
relampago|Relâmpago|Lightning Bolt|3|srd|a long jagged blue-white lightning bolt
circuloMagico|Círculo Mágico|Magic Circle|3|srd|a glowing violet magic circle on the ground
imagemMaior|Imagem Maior|Major Image|3|srd|a large translucent ghostly dragon made of violet light
palavraCurativaEmMassa|Palavra Curativa em Massa|Mass Healing Word|3|srd|a green heart sending sound waves to several smaller hearts
fundirSeComPedra|Fundir-se com a Pedra|Meld into Stone|3|srd|a figure half merged into a grey stone wall
indetectavel|Indetectável|Nondetection|3|srd|a closed eye behind a grey veil
montariaFantasmagorica|Montaria Fantasmagórica|Phantom Steed|3|srd|a ghostly translucent galloping horse
crescimentoDePlantas|Crescimento de Plantas|Plant Growth|3|srd|a thick overgrowth of leafy green plants
protecaoContraEnergia|Proteção contra Energia|Protection from Energy|3|srd|a shield bearing small fire, ice and lightning symbols
removerMaldicao|Remover Maldição|Remove Curse|3|srd|a broken black chain with a golden glow
revivificar|Revivificar|Revivify|3|srd|a red heart restarting with a golden spark
enviarMensagem|Enviar Mensagem|Sending|3|srd|a white paper bird flying with a violet trail
tempestadeDeGranizo|Tempestade de Granizo|Sleet Storm|3|srd|a grey cloud dropping sleet and small ice pellets
lentidao|Lentidão|Slow|3|srd|a clock face wrapped in a heavy chain
falarComOsMortos|Falar com os Mortos|Speak with Dead|3|srd|a skull with a sound wave coming from its jaw
falarComPlantas|Falar com Plantas|Speak with Plants|3|srd|a leafy plant with a small sound wave
espiritosGuardioes|Espíritos Guardiões|Spirit Guardians|3|srd|glowing golden spirit wisps circling in a ring
nuvemFetida|Nuvem Fétida|Stinking Cloud|3|srd|a putrid yellow-green cloud of gas
cabanaMinuscula|Cabana Minúscula|Tiny Hut|3|srd|a small translucent force dome hut
idiomas|Idiomas|Tongues|3|srd|a tongue glowing with a golden aura
toqueVampirico|Toque Vampírico|Vampiric Touch|3|srd|a pale hand draining a red stream of blood
respirarNaAgua|Respirar na Água|Water Breathing|3|srd|a head underwater with rising bubbles
andarNaAgua|Andar na Água|Water Walk|3|srd|a boot standing on rippling blue water
muralhaDeVento|Muralha de Vento|Wind Wall|3|srd|a tall wall of swirling light blue wind
olhoArcano|Olho Arcano|Arcane Eye|4|srd|a floating eyeball with a violet glow
auraDeVida|Aura de Vida|Aura of Life|4|phb|a white glowing ring aura around a small red heart
auraDePureza|Aura de Pureza|Aura of Purity|4|phb|a pure white glowing ring aura around a white droplet
banimento|Banimento|Banishment|4|srd|a figure being pulled into a swirling portal
tentaculosNegros|Tentáculos Negros|Black Tentacles|4|srd|black tentacles reaching up from the ground, outlined in bright purple
praga|Praga|Blight|4|srd|a withered dead plant with a purple necrotic aura
compulsao|Compulsão|Compulsion|4|srd|marionette strings attached to a hand
confusao|Confusão|Confusion|4|srd|a head with tangled swirling arrows above it
conjurarElementaisMenores|Conjurar Elementais Menores|Conjure Minor Elementals|4|srd|small fire, water and earth wisps in a circle
conjurarSeresDaFloresta|Conjurar Seres da Floresta|Conjure Woodland Beings|4|srd|a glowing woodland sprite with leaf wings
controlarAgua|Controlar Água|Control Water|4|srd|a towering blue water wave
protecaoContraAMorte|Proteção contra a Morte|Death Ward|4|srd|a white skull blocked by a golden shield
portaDimensional|Porta Dimensional|Dimension Door|4|srd|a glowing violet doorway
adivinhacao|Adivinhação|Divination|4|srd|a fan of glowing tarot cards
dominarBesta|Dominar Besta|Dominate Beast|4|srd|a wolf head with a glowing violet collar
fabricar|Fabricar|Fabricate|4|srd|a pile of raw wood turning into a chair
caoFiel|Cão Fiel|Faithful Hound|4|srd|a spectral watchful hound
escudoDeFogo|Escudo de Fogo|Fire Shield|4|srd|a figure surrounded by a ring of flames
liberdadeDeMovimento|Liberdade de Movimento|Freedom of Movement|4|srd|a broken shackle next to a running boot
insetoGigante|Inseto Gigante|Giant Insect|4|srd|a giant green beetle
vinhaAgarradora|Vinha Agarradora|Grasping Vine|4|phb|a green vine whip grasping forward
invisibilidadeMaior|Invisibilidade Maior|Greater Invisibility|4|srd|a dotted figure outline holding a sword, fading
guardiaoDaFe|Guardião da Fé|Guardian of Faith|4|srd|a large spectral golden knight with a glowing sword
terrenoAlucinatorio|Terreno Alucinatório|Hallucinatory Terrain|4|srd|a hill shimmering like a mirage
tempestadeDeGelo|Tempestade de Gelo|Ice Storm|4|srd|large hailstones of ice falling from a dark cloud
localizarCriatura|Localizar Criatura|Locate Creature|4|srd|a compass needle pointing at a footprint
assassinoFantasmagorico|Assassino Fantasmagórico|Phantasmal Killer|4|srd|a nightmare shadow creature looming over a sleeping head, outlined in purple
metamorfose|Metamorfose|Polymorph|4|srd|a green frog with a violet swirl
santuarioParticular|Santuário Particular|Private Sanctum|4|srd|a box room of translucent violet walls
esferaResiliente|Esfera Resiliente|Resilient Sphere|4|srd|a shimmering translucent force bubble
bauSecreto|Baú Secreto|Secret Chest|4|srd|a small treasure chest glowing violet, half transparent
golpeEstonteante|Golpe Estonteante|Staggering Smite|4|phb|a sword strike with dizzy purple stars
moldarRocha|Moldar Rocha|Stone Shape|4|srd|a hand shaping soft grey stone
peleDePedra|Pele de Pedra|Stoneskin|4|srd|an arm covered in grey stone plating
muralhaDeFogo|Muralha de Fogo|Wall of Fire|4|srd|a tall wall of flames
animarObjetos|Animar Objetos|Animate Objects|5|srd|a sword and a chair moving with violet sparkles
conchaAntivida|Concha Antivida|Antilife Shell|5|srd|a shimmering barrier shell pushing away a creature
despertar|Despertar|Awaken|5|srd|a tree with glowing eyes awakening
golpeBanidor|Golpe Banidor|Banishing Smite|5|phb|a sword strike opening a swirling violet portal
circuloDePoder|Círculo de Poder|Circle of Power|5|phb|a golden aura ring around a shield
comunhao|Comunhão|Commune|5|srd|a kneeling figure under a beam of golden light
comunhaoComANatureza|Comunhão com a Natureza|Commune with Nature|5|srd|a green leaf inside a glowing green circle
conjurarSaraivada|Conjurar Saraivada|Conjure Volley|5|phb|many arrows raining down
coneDeFrio|Cone de Frio|Cone of Cold|5|srd|a cone-shaped blast of icy light blue frost
conjurarElemental|Conjurar Elemental|Conjure Elemental|5|srd|a large fire elemental rising
nevoaMortal|Névoa Mortal|Cloudkill|5|srd|a sickly yellow-green poison fog rolling forward
reencarnacao|Reencarnação|Reincarnate|5|srd|a glowing green spirit rising out of an opening flower bud
maoArcana|Mão Arcana|Arcane Hand|5|srd|a large translucent violet magical hand with spread fingers
contatoOutroPlano|Contato com Outro Plano|Contact Other Plane|5|srd|a head linked to a distant star by a violet line
contagio|Contágio|Contagion|5|srd|a diseased green rotting hand
criacao|Criação|Creation|5|srd|a glowing violet cube forming from sparkles
ondaDestrutiva|Onda Destrutiva|Destructive Wave|5|phb|a ground-shattering golden shockwave ring
dissiparBemMal|Dissipar o Bem e o Mal|Dispel Evil and Good|5|srd|a golden burst repelling a purple wisp
dominarPessoa|Dominar Pessoa|Dominate Person|5|srd|a human head wearing a glowing violet crown of control
sonho|Sonho|Dream|5|srd|a sleeping head with a glowing dream cloud
golpeDeChama|Golpe de Chama|Flame Strike|5|srd|a column of red-orange fire falling from above
missao|Missão|Geas|5|srd|a glowing golden chain tied to a heart
restauracaoMaior|Restauração Maior|Greater Restoration|5|srd|a big green healing star
consagrar|Consagrar|Hallow|5|srd|a golden consecrated ground circle with a holy flame
imobilizarMonstro|Imobilizar Monstro|Hold Monster|5|srd|a monster silhouette bound by violet chains
pragaDeInsetos|Praga de Insetos|Insect Plague|5|srd|a swarm of black insects, outlined against a yellow haze
lendaETradicao|Lenda e Tradição|Legend Lore|5|srd|an ancient tome glowing golden
curarFerimentosEmMassa|Curar Ferimentos em Massa|Mass Cure Wounds|5|srd|four small glowing green crosses
enganar|Enganar|Mislead|5|srd|a faint invisible figure next to its solid illusory double
modificarMemoria|Modificar Memória|Modify Memory|5|srd|a head with a swirl being erased
atravessarParedes|Atravessar Paredes|Passwall|5|srd|a hole opening in a brick wall
ligacaoPlanar|Ligação Planar|Planar Binding|5|srd|a demon inside a glowing binding circle
reviverOsMortos|Reviver os Mortos|Raise Dead|5|srd|a hand rising from a coffin in golden light
videncia|Vidência|Scrying|5|srd|a silver scrying mirror showing a distant eye
semblante|Semblante|Seeming|5|srd|several masks floating in a row
aljavaVeloz|Aljava Veloz|Swift Quiver|5|phb|a quiver with glowing arrows shooting out
telecinesia|Telecinésia|Telekinesis|5|srd|a rock floating above a hand with violet lines
eloTelepatico|Elo Telepático|Telepathic Bond|5|srd|two heads linked by a violet line
circuloDeTeletransporte|Círculo de Teletransporte|Teleportation Circle|5|srd|a glowing circle of teleportation light
caminharEntreArvores|Caminhar entre Árvores|Tree Stride|5|srd|a figure stepping into a tree trunk
muralhaDeForca|Muralha de Força|Wall of Force|5|srd|a translucent light blue wall
muralhaDePedra|Muralha de Pedra|Wall of Stone|5|srd|a thick grey stone wall
portaoArcano|Portão Arcano|Arcane Gate|6|phb|two linked glowing portals
barreiraDeLaminas|Barreira de Lâminas|Blade Barrier|6|srd|a whirling wall of blades
correnteDeRelampagos|Corrente de Relâmpagos|Chain Lightning|6|srd|a lightning bolt chaining between three points
circuloDaMorte|Círculo da Morte|Circle of Death|6|srd|a black and violet necrotic ring burst
esferaCongelante|Esfera Congelante|Freezing Sphere|6|srd|a glowing pale blue frozen orb with frost spikes
conjurarFada|Conjurar Fada|Conjure Fey|6|srd|a glowing fey creature with butterfly wings
contingencia|Contingência|Contingency|6|srd|a glowing gem set into a small trigger mechanism
criarMortoVivo|Criar Morto-Vivo|Create Undead|6|srd|a zombie rising from the ground
desintegrar|Desintegrar|Disintegrate|6|srd|a green ray turning a target into dust
olharMordaz|Olhar Mordaz|Eyebite|6|srd|a staring red evil eye with dark rays
encontrarOCaminho|Encontrar o Caminho|Find the Path|6|srd|a glowing path of footsteps
carneEmPedra|Carne em Pedra|Flesh to Stone|6|srd|a hand turning into grey stone
proibicao|Proibição|Forbiddance|6|srd|a glowing warding barrier across a doorway
globoDeInvulnerabilidade|Globo de Invulnerabilidade|Globe of Invulnerability|6|srd|a shimmering sphere deflecting a magic bolt
guardasEProtecoes|Guardas e Proteções|Guards and Wards|6|srd|a fortress gate with glowing wards
ferir|Ferir|Harm|6|srd|a violet necrotic burst striking a red heart
curaCompleta|Cura Completa|Heal|6|srd|a large radiant green heart
banqueteDosHerois|Banquete dos Heróis|Heroes' Feast|6|srd|a feast table with a roast and goblets
convocacaoInstantanea|Convocação Instantânea|Instant Summons|6|srd|a sapphire gem with an item appearing from it
dancaIrresistivel|Dança Irresistível|Irresistible Dance|6|srd|a dancing figure with musical notes
jarroMagico|Jarro Mágico|Magic Jar|6|srd|a glowing soul inside a glass jar
sugestaoEmMassa|Sugestão em Massa|Mass Suggestion|6|srd|several swaying golden pendulums
moverTerra|Mover Terra|Move Earth|6|srd|a rising mound of brown earth
aliadoPlanar|Aliado Planar|Planar Ally|6|srd|a winged celestial figure
ilusaoProgramada|Ilusão Programada|Programmed Illusion|6|srd|an illusory figure next to a small clock
raioSolar|Raio Solar|Sunbeam|6|srd|a beam of intense golden sunlight
transportePorPlantas|Transporte por Plantas|Transport via Plants|6|srd|a figure stepping out of a large plant
visaoDaVerdade|Visão da Verdade|True Seeing|6|srd|a golden all-seeing eye with rays
muralhaDeGelo|Muralha de Gelo|Wall of Ice|6|srd|a wall of jagged light blue ice
muralhaDeEspinhos|Muralha de Espinhos|Wall of Thorns|6|srd|a wall of thorny green brambles
caminharNoVento|Caminhar no Vento|Wind Walk|6|srd|a figure turning into a white cloud
palavraDeRetorno|Palavra de Retorno|Word of Recall|6|srd|a figure vanishing in a golden beam
espadaArcana|Espada Arcana|Arcane Sword|7|srd|a giant floating violet force sword
conjurarCelestial|Conjurar Celestial|Conjure Celestial|7|srd|a radiant angelic figure with white wings
bolaDeFogoControlavel|Bola de Fogo Controlável|Delayed Blast Fireball|7|srd|a glowing bead of fire with a lit fuse
palavraDivina|Palavra Divina|Divine Word|7|srd|a golden radiant shout burst
formaEterea|Forma Etérea|Etherealness|7|srd|a transparent ghostly white figure
dedoDaMorte|Dedo da Morte|Finger of Death|7|srd|a skeletal finger pointing with a violet death ray
tempestadeDeFogo|Tempestade de Fogo|Fire Storm|7|srd|a storm of fire columns
jaulaDeForca|Jaula de Força|Forcecage|7|srd|a cage of glowing violet force bars
mansaoMagnifica|Mansão Magnífica|Magnificent Mansion|7|srd|a grand magical door with a golden glow
miragemArcana|Miragem Arcana|Mirage Arcane|7|srd|a shimmering mirage landscape
mudancaDePlano|Mudança de Plano|Plane Shift|7|srd|a silver tuning fork glowing violet
borrifoPrismatico|Borrifo Prismático|Prismatic Spray|7|srd|a spray of seven coloured rays
projetarImagem|Projetar Imagem|Project Image|7|srd|a figure and a glowing projected duplicate
regenerar|Regenerar|Regenerate|7|srd|a limb regrowing with a green glow
ressurreicao|Ressurreição|Resurrection|7|srd|a coffin opening with golden radiance
inverterGravidade|Inverter Gravidade|Reverse Gravity|7|srd|rocks falling upward
sequestrar|Sequestrar|Sequester|7|srd|a figure sealed inside a hidden box
simulacro|Simulacro|Simulacrum|7|srd|a duplicate figure made of snow
simbolo|Símbolo|Symbol|7|srd|a glowing red trap sigil on the floor
teletransporte|Teletransporte|Teleport|7|srd|a figure dissolving into violet particles
formasAnimais|Formas Animais|Animal Shapes|8|srd|a group of three animal silhouettes
campoAntimagia|Campo Antimagia|Antimagic Field|8|srd|a grey dome cancelling violet sparkles
antipatiaSimpatia|Antipatia/Simpatia|Antipathy/Sympathy|8|srd|a horseshoe magnet with one side repelling and one attracting
clone|Clone|Clone|8|srd|a glass vat with a growing duplicate figure
controlarOClima|Controlar o Clima|Control Weather|8|srd|a sun and a storm cloud split in half
semiplano|Semiplano|Demiplane|8|srd|a door opening into a starry void
dominarMonstro|Dominar Monstro|Dominate Monster|8|srd|a dragon head with a violet crown of control
terremoto|Terremoto|Earthquake|8|srd|the ground cracking open
debilitarMente|Debilitar Mente|Feeblemind|8|srd|a cracked head with a broken spark
labia|Lábia|Glibness|8|srd|a shining silver tongue
auraSagrada|Aura Sagrada|Holy Aura|8|srd|a radiant golden aura around a figure
nuvemIncendiaria|Nuvem Incendiária|Incendiary Cloud|8|srd|a burning cloud of embers
labirinto|Labirinto|Maze|8|srd|a small stone maze
menteVazia|Mente Vazia|Mind Blank|8|srd|a head with a shielded blank mind
palavraDePoderAtordoar|Palavra de Poder Atordoar|Power Word Stun|8|srd|a shouting mouth with dizzy yellow stars
explosaoSolar|Explosão Solar|Sunburst|8|srd|a blazing sun explosion
telepatia|Telepatia|Telepathy|8|phb|a head emitting violet waves to a far star
tsunami|Tsunami|Tsunami|8|phb|a giant blue ocean wave
projecaoAstral|Projeção Astral|Astral Projection|9|srd|a silver cord linking a body to a floating spirit
pressagio|Presságio|Foresight|9|srd|a glowing eye seeing branching golden timelines
portal|Portal|Gate|9|srd|a huge swirling portal gate
aprisionamento|Aprisionamento|Imprisonment|9|srd|a tiny figure trapped inside a gem
curaEmMassa|Cura em Massa|Mass Heal|9|srd|a huge radiant green heart burst
chuvaDeMeteoros|Chuva de Meteoros|Meteor Swarm|9|srd|flaming meteors falling from the sky
palavraDePoderCurar|Palavra de Poder Curar|Power Word Heal|9|phb|a shouting mouth with green healing hearts
palavraDePoderMatar|Palavra de Poder Matar|Power Word Kill|9|srd|a shouting mouth with a black skull
muralhaPrismatica|Muralha Prismática|Prismatic Wall|9|srd|a wall of seven coloured bands
alterarForma|Alterar Forma|Shapechange|9|srd|a figure transforming into a dragon
tempestadeDaVinganca|Tempestade da Vingança|Storm of Vengeance|9|srd|a massive dark storm with lightning and green acid rain
pararOTempo|Parar o Tempo|Time Stop|9|srd|a stopped clock with frozen hands
metamorfoseVerdadeira|Metamorfose Verdadeira|True Polymorph|9|srd|a frog turning into a dragon
ressurreicaoVerdadeira|Ressurreição Verdadeira|True Resurrection|9|srd|a golden radiant burst rising from a skeleton
estranho|Estranho|Weird|9|srd|a terrifying shadow nightmare face outlined in bright purple
desejo|Desejo|Wish|9|srd|a glowing golden genie lamp
'''


def entradas():
    for linha in MAGIAS.strip().splitlines():
        id_, pt, en, nivel, fonte, conceito = [x.strip() for x in linha.split('|')]
        if id_ in EXISTEM:
            continue
        yield {'id': id_, 'pt': pt, 'en': en, 'nivel': int(nivel), 'fonte': fonte,
               'categoria': 'magia', 'prefixo': 'magia-', 'conceito': conceito}
