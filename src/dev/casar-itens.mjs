// O CASAMENTO DOS ITENS DO LIVRO com os que o jogo já tem: escreve `src/dev/itens/ja-temos.json` (o nome no livro -> o id
// do item do jogo), que `importar-itens.mjs` pula. Casa pelo nome em pt-br que a tradução deu (`itens/<livro>-pt.json`),
// mais os pares e as FAMÍLIAS conferidos à mão: o jogo tem o genérico (a Poção de Resistência, a Pedra Ioun, a Arma +1) e
// o livro uma variante por tipo.
//
//   node src/dev/casar-itens.mjs
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const { ITEMS, WEAPONS, ARMORS, SHIELDS } = await import('../rules/items/index.js');
const pt = JSON.parse(fs.readFileSync(RAIZ + 'src/dev/itens/dmg-pt.json', 'utf8'));
const norm = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\b(de|da|do|das|dos|e)\b/g, ' ').replace(/[^a-z0-9+]+/g, ' ').trim();
const jogo = new Map();
// o que o próprio importador trouxe de um livro (`fonte: 'livro-...'`) não conta como "o jogo já tinha": senão a segunda
// rodada acha os itens que a primeira importou e os tira do arquivo que os importa
for (const cat of [ITEMS, WEAPONS, ARMORS, SHIELDS]) for (const [id, d] of Object.entries(cat)) if (d.raridade && !String(d.fonte ?? '').startsWith('livro')) jogo.set(norm(d.name), id);

// os pares que o nome não casa (o jogo traduziu de outro jeito), conferidos à mão
const MAO = {
  'Potion of Water Breathing': 'pocaoDeRespiracaoAquatica', 'Potion of Mind Reading': 'pocaoDeLeituraMental',
  'Oil of Slipperiness': 'oleoDeEscorregar', "Keoghtom's Ointment": 'unguentoRestaurador', 'Frost Brand': 'marcaDeGelo',
  'Sun Blade': 'espadaSolar', 'Sword of Sharpness': 'espadaDeGume', 'Luck Blade': 'espadaDaSorte', 'Sword of Life Stealing': 'espadaDeRoubarVida',
  'Sword of Wounding': 'espadaDeFerir', 'Mace of Disruption': 'macaDaDisrupcao', 'Mace of Smiting': 'macaDoGolpe', 'Dwarven Thrower': 'arremessadorAnao',
  'Javelin of Lightning': 'azagaiaDoRaio', 'Trident of Fish Command': 'tridenteDoComando', 'Oathbow': 'arcoJuramentado', 'Arrow of Slaying (*)': 'flechaAssassina',
  'Adamantine Armor': 'armaduraAdamantina', 'Dwarven Plate': 'placasAnas', 'Elven Chain': 'malhaElfica', 'Glamoured Studded Leather': 'couroGlamourizado',
  'Demon Armor': 'armaduraDeDemonio', 'Plate Armor of Etherealness': 'placasDaEtereidade', 'Arrow-Catching Shield': 'escudoCaptador',
  'Shield of Missile Attraction': 'escudoAtraidor', 'Ring of Mind Shielding': 'anelDeEscudoMental', 'Ring of Water Walking': 'anelDeAndarSobreAgua',
  'Ring of the Ram': 'anelDoAriete', 'Wand of Fireballs': 'varinhaDeBolaDeFogo', 'Wand of Binding': 'varinhaDeAtadura', 'Wand of Polymorph': 'varinhaDePolimorfia',
  'Staff of Swarming Insects': 'cajadoDeEnxame', 'Staff of the Python': 'cajadoDaSerpente', 'Staff of Charming': 'cajadoDoEncanto',
  'Staff of Withering': 'cajadoDeMurchar', 'Staff of Thunder and Lightning': 'cajadoDoTrovaoERaio', 'Staff of the Woodlands': 'cajadoDasFlorestas',
  'Rod of Absorption': 'cetroDeAbsorcao', 'Rod of Alertness': 'cetroDeAlerta', 'Rod of Security': 'cetroDeSeguranca', 'Rod of Rulership': 'cetroDoDominio',
  'Rod of Lordly Might': 'cetroDoPoderioSenhorial', 'Rod of Resurrection': 'cetroDaRessurreicao', 'Bag of Holding': 'bolsaDeConter',
  'Gauntlets of Ogre Power': 'manoplasDeForcaDeOgro', 'Headband of Intellect': 'faixaDeIntelecto', 'Cloak of the Manta Ray': 'mantoDaArraia',
  'Bracers of Archery': 'braceletesDeArqueiro', 'Bracers of Defense': 'braceletesDeDefesa', 'Brooch of Shielding': 'brocheDeEscudo',
  'Gloves of Missile Snaring': 'luvasDeAgarrarProjetis', 'Gloves of Swimming and Climbing': 'luvasDeNadarEEscalar', 'Goggles of Night': 'oculosDeNoite',
  'Eyes of Charming': 'olhosDoEncanto', 'Helm of Comprehending Languages': 'elmoDeCompreenderIdiomas', 'Helm of Brilliance': 'elmoDeBrilho',
  'Necklace of Adaptation': 'amuletoDeAdaptacao', 'Periapt of Proof against Poison': 'amuletoContraVeneno', 'Periapt of Wound Closure': 'amuletoDeFecharFeridas',
  'Gem of Seeing': 'gemaDeVidencia', 'Rope of Entanglement': 'cordaDeEnredar', 'Immovable Rod': 'varaImovel', 'Decanter of Endless Water': 'decantadorDeAguaInfinita',
  'Dust of Sneezing and Choking': 'poDeEspirroETosse', 'Lantern of Revealing': 'lanternaReveladora', 'Mirror of Life Trapping': 'espelhoDeAprisionarVida',
  'Pipes of Haunting': 'gaitasDoAssombro', 'Pipes of the Sewers': 'gaitasDosEsgotos', 'Horn of Blasting': 'trompaDeExplosao', 'Iron Bands of Bilarro': 'bracadeirasDeBilarro',
  'Quiver of Ehlonna': 'aljavaEficiente', 'Tome of Understanding': 'tomoDoEntendimento', 'Manual of Gainful Exercise': 'manualDeExercicioRapido',
  'Manual of Quickness of Action': 'manualDaAgilidade', 'Periapt of Health': 'periaptoDaSaude', 'Alchemy Jug': 'jarraAlquimica',
  'Wand of Magic Detection': 'varinhaDeDeteccaoDeMagia', 'Dagger of Venom': 'adagaDeVeneno', 'Wand of Magic Missiles': 'varinhaDeMisseisMagicos',
  'Wand of Web': 'varinhaDeTeia', 'Wand of Lightning Bolts': 'varinhaDeRaios', 'Amulet of Proof against Detection and Location': 'amuletoContraDeteccao',
  'Figurine of Wondrous Power, Obsidian Steed': 'corcelDeObsidiana', 'Stone of Controlling Earth Elementals': 'pedraDeControlarElemental',
  'Potion of Hill Giant Strength': 'pocaoDeForcaDeGigante', 'Flame Tongue': 'linguaDeFogo',
  'Potion of Healing': 'pocaoDeCura', 'Slippers of Spider Climbing': 'chinelosDeEscalarParedes', 'Boots of Striding and Springing': 'botasDeMarchaESalto',
};
// as FAMÍLIAS: o livro tem uma variante por tipo, o jogo tem o genérico
// AS PEÇAS POR TIPO (`rules/items/variantes.js`): o anel e a poção de resistência casam com a peça do tipo; a armadura de
// resistência e a cota de escamas, com a de cota de malha e a da cor (a armadura de resistência existe em toda base, e a
// cota de malha é a que o livro desenha)
const TIPO_EN = { Acid: 'Acido', Cold: 'Frio', Fire: 'Fogo', Force: 'Energetico', Lightning: 'Eletrico', Necrotic: 'Necrotico', Poison: 'Veneno', Psychic: 'Psiquico', Radiant: 'Radiante', Thunder: 'Trovejante' };
const COR_EN = { Black: 'Negro', Blue: 'Azul', Brass: 'DeLatao', Bronze: 'DeBronze', Copper: 'DeCobre', Gold: 'Dourado', Green: 'Verde', Red: 'Vermelho', Silver: 'Prateado', White: 'Branco' };
function pecaDoTipo(en) {
  let m = en.match(/^(Ring|Potion|Armor) of (\w+) Resistance$/);
  if (m && TIPO_EN[m[2]]) return { Ring: 'anelDeResistencia', Potion: 'pocaoDeResistencia', Armor: 'cotaDeMalhaDeResistencia' }[m[1]] + TIPO_EN[m[2]];
  m = en.match(/^(\w+) Dragon Scale Mail$/);
  if (m && COR_EN[m[1]]) return `cotaDeEscamasDeDragao${COR_EN[m[1]]}`;
  return null;
}
const FAMILIAS = [
  [/^Potion of (?:Hill|Frost|Stone|Fire|Cloud|Storm) Giant Strength$/, 'pocaoDeForcaDeGigante'],
  [/^Potion of \w+ Resistance$/, 'pocaoDeResistencia'], [/^Armor of \w+ Resistance$/, 'armaduraDeResistencia'],
  [/^Ring of \w+ Resistance$/, 'anelDeResistencia'], [/Dragon Scale Mail$/, 'armaduraDeEscamasDeDragao'],
  [/^Elemental Gem/, 'gemaElemental'], [/^Figurine of Wondrous Power/, 'figuraDePoderMaravilhoso'], [/^Ioun Stone/, 'pedraIoun'],
  [/^Instrument of the Bards/, 'instrumentoDosBardos'], [/^Carpet of Flying/, 'tapeteVoador'], [/^Horn of Valhalla/, 'trompaDeValhalla'],
  [/^Quaal's Feather Token/, 'fichaDePenaDeQuaal'], [/^Spell Scroll/, 'pergaminhoDeMagia'], [/Wand of the War Mage/, 'varinhaDoMagoDeGuerra'],
  [/Rod of the Pact Keeper/, 'cetroDoGuardiaoDoPacto'], [/^Manual of \w+ Golems$/, 'manualDoGolemDeCarne'],
  [/^\+1 Weapon/, 'armaMais1'], [/^\+2 Weapon/, 'armaMais2'], [/^\+3 Weapon/, 'armaMais3'],
  [/^\+1 Ammunition/, 'municaoMais1'], [/^\+2 Ammunition/, 'municaoMais2'], [/^\+3 Ammunition/, 'municaoMais3'],
  [/^\+1 Armor/, 'armaduraMais1'], [/^\+2 Armor/, 'armaduraMais2'], [/^\+3 Armor/, 'armaduraMais3'],
  [/^\+1 Shield/, 'escudoMais1'], [/^\+2 Shield/, 'escudoMais2'], [/^\+3 Shield/, 'escudoMais3'],
];
const ja = { _nota: 'Nome no livro (5etools) -> id do item que o jogo já tem. O importador pula estes. Casado pelo nome em pt-br, mais os pares e as famílias conferidos à mão (o jogo tem o genérico, o livro uma variante por tipo).' };
const todos = new Set([...Object.values(jogo)]);
for (const en of Object.keys(pt)) {
  const fam = FAMILIAS.find(([re]) => re.test(en));
  const id = MAO[en] ?? pecaDoTipo(en) ?? fam?.[1] ?? jogo.get(norm(pt[en].nome));
  if (id && (ITEMS[id] || WEAPONS[id] || ARMORS[id] || SHIELDS[id]) && !String((ITEMS[id] ?? {}).fonte ?? '').startsWith('livro')) ja[en] = id;
  else if (id) console.log('par para id que não existe:', en, id);
}
fs.writeFileSync(RAIZ + 'src/dev/itens/ja-temos.json', JSON.stringify(ja, null, 1) + '\n');
console.log('já temos', Object.keys(ja).length - 1, 'de', Object.keys(pt).length, '; novos', Object.keys(pt).length - (Object.keys(ja).length - 1));
