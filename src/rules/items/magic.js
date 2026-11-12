// Itens mágicos.
//
// FONTE
// A lista do Livro do Mestre, cuja maior parte está também no SRD 5.1
// (CC-BY-4.0, ver NOTICE.md). Nome, raridade, sintonia e efeito são mecânica.
// As descrições são escritas para este projeto, não transcritas.
//
// `fonte: 'srd'` é o que dá para conferir no SRD; `fonte: 'dmg'` é o que vem
// só do livro, com a mecânica implementada e a descrição nossa.
//
// O QUE O MOTOR LÊ
// `passivo` é o que o item faz só por estar com o herói (a CA e as resistências
// do anel de proteção, a Força das manoplas, a visão dos óculos), lido por
// `itens-passivos.js`; `conjura` é a magia que ele lança com cargas (as
// varinhas), lida por `itens-que-conjuram.js`. `acBonus` sozinho é só o número
// que a ficha e o catálogo mostram: quem põe a CA no herói é o `passivo`.
//
// SINTONIA conta: três itens por herói (`itens-que-conjuram.js sintonizar`), e
// o item que a pede só faz algo sintonizado. Sintoniza-se no inventário da ficha.

// A frase que declara o arremesso mora em `gear.js`, com a poção comum.
import { CASA_DO_ARREMESSO } from './gear.js';

const RARIDADE = {
  comum: 'comum', incomum: 'incomum', raro: 'raro',
  muitoRaro: 'muito raro', lendario: 'lendário', artefato: 'artefato',
};

const magico = (id, name, raridade, desc, extra = {}) => ({
  id, name, tipo: 'mágico', art: id, pilha: false,
  raridade, sintonia: false, peso: 1, desc, fonte: 'srd', ...extra,
});

// ------------------------------------------------------------- poções ----
const pocao = (id, name, raridade, desc, extra = {}) =>
  magico(id, name, raridade, desc, { tipo: 'poção', art: 'cura', pilha: true, peso: 0.5, ...extra });


/**
 * A frase que declara o ARREMESSO DE POÇÃO nas poções de cura.
 *
 * Regra da casa. O livro tem o ato de DAR a poção a outra criatura — uma ação,
 * ao alcance do toque — e não tem arremesso de poção de cura. O jogo deixa
 * jogar o frasco a até 6 m, e cobra o preço de molhar em vez de beber: metade
 * da cura. O alcance é o mesmo do frasco de ácido e da água benta, para a mão
 * do herói ter um alcance só.
 */

export const POTIONS = {
  pocaoDeCuraMaior: pocao('pocaoDeCuraMaior', 'Poção de cura maior', RARIDADE.incomum,
    'Uma ação para beber: 4d4+4 pontos de vida.' + CASA_DO_ARREMESSO, { consumivel: 'curar', cura: '4d4+4', acao: 'acao', jogavel: true }),
  pocaoDeCuraSuperior: pocao('pocaoDeCuraSuperior', 'Poção de cura superior', RARIDADE.raro,
    'Uma ação para beber: 8d4+8 pontos de vida.' + CASA_DO_ARREMESSO, { consumivel: 'curar', cura: '8d4+8', acao: 'acao', jogavel: true }),
  pocaoDeCuraSuprema: pocao('pocaoDeCuraSuprema', 'Poção de cura suprema', RARIDADE.muitoRaro,
    'Uma ação para beber: 10d4+20 pontos de vida.' + CASA_DO_ARREMESSO, { consumivel: 'curar', cura: '10d4+20', acao: 'acao', jogavel: true }),
  pocaoDeVitalidade: pocao('pocaoDeVitalidade', 'Poção de vitalidade', RARIDADE.muitoRaro,
    'Uma ação para beber: tira a exaustão inteira e o veneno, e no descanso longo seguinte os dados de vida voltam todos. (O motor ainda não tem doença, então essa parte do item não faz nada.)',
    { consumivel: 'restaurar', acao: 'acao' }),
  pocaoDeHeroismo: pocao('pocaoDeHeroismo', 'Poção de heroísmo', RARIDADE.raro,
    '10 pontos de vida temporários por uma hora, e Bênção de graça o tempo todo.'),
  pocaoDeEscalada: pocao('pocaoDeEscalada', 'Poção de escalada', RARIDADE.comum,
    'Deslocamento de escalada igual ao de caminhada por uma hora, e vantagem para escalar.'),
  pocaoDeVelocidade: pocao('pocaoDeVelocidade', 'Poção de velocidade', RARIDADE.muitoRaro,
    'Acelerar por um minuto, sem concentração.', { consumivel: 'condicao', condicao: 'acelerado', rodadas: 10, acao: 'acao' }),
  pocaoDeInvisibilidade: pocao('pocaoDeInvisibilidade', 'Poção de invisibilidade', RARIDADE.muitoRaro,
    'Invisível por uma hora, ou até atacar ou conjurar.', { consumivel: 'condicao', condicao: 'invisivel', rodadas: 600, acao: 'acao' }),
  pocaoDeRespiracaoAquatica: pocao('pocaoDeRespiracaoAquatica', 'Poção de respiração aquática', RARIDADE.incomum,
    'Respira debaixo da água por uma hora.'),
  pocaoDeResistencia: pocao('pocaoDeResistencia', 'Poção de resistência', RARIDADE.incomum,
    'Resistência a um tipo de dano por uma hora. O tipo é sorteado ao fabricar.'),
  pocaoDeCrescimento: pocao('pocaoDeCrescimento', 'Poção de crescimento', RARIDADE.incomum,
    'Aumentar por 1d4 horas: uma categoria de tamanho, vantagem em Força, +1d4 de dano.', { consumivel: 'condicao', condicao: 'aumentado', rodadas: 600, acao: 'acao' }),
  pocaoDeDiminuicao: pocao('pocaoDeDiminuicao', 'Poção de diminuição', RARIDADE.raro,
    'Reduzir por 1d4 horas: uma categoria menor, desvantagem em Força, −1d4 de dano.', { consumivel: 'condicao', condicao: 'reduzido', rodadas: 600, acao: 'acao' }),
  pocaoDeFormaGasosa: pocao('pocaoDeFormaGasosa', 'Poção de forma gasosa', RARIDADE.raro,
    'Forma gasosa por uma hora, sem concentração.', { consumivel: 'condicao', condicao: 'gasoso', rodadas: 600, acao: 'acao' }),
  pocaoDeSoproDeFogo: pocao('pocaoDeSoproDeFogo', 'Poção de sopro de fogo', RARIDADE.incomum,
    'Por uma hora, três vezes: uma ação bônus para cuspir um cone de 9 m, 4d6 de fogo, CD 13 de Destreza para metade.'),
  pocaoDeLeituraMental: pocao('pocaoDeLeituraMental', 'Poção de leitura mental', RARIDADE.raro,
    'Detectar pensamentos por dez minutos, CD 13.'),
  pocaoDeClarividencia: pocao('pocaoDeClarividencia', 'Poção de clarividência', RARIDADE.raro,
    'Clarividência, sem concentração.'),
  pocaoDeAmizadeAnimal: pocao('pocaoDeAmizadeAnimal', 'Poção de amizade animal', RARIDADE.incomum,
    'Amizade animal por uma hora, CD 13.'),
  pocaoDeVeneno: pocao('pocaoDeVeneno', 'Poção de veneno', RARIDADE.incomum,
    'Parece e cheira a poção de cura. CD 13 de Constituição ou 3d6 de veneno e envenenado por uma hora.'),
  pocaoDeForcaDeGigante: pocao('pocaoDeForcaDeGigante', 'Poção de força de gigante', RARIDADE.incomum,
    'Força vira a do gigante correspondente por uma hora: colina 21, pedra e gelo 23, fogo 25, nuvem 27, tempestade 29.'),
  pocaoDeLongevidade: pocao('pocaoDeLongevidade', 'Poção de longevidade', RARIDADE.muitoRaro,
    'Rejuvenesce 1d6+6 anos. Cada dose seguinte tem 10% de cumprir o contrário.'),
  oleoDeAfiar: pocao('oleoDeAfiar', 'Óleo de afiação', RARIDADE.muitoRaro,
    'Uma hora para aplicar: a arma ou vinte munições ganham +3 de ataque e dano por uma hora.',
    { bonusAtaque: 3, bonusDano: 3 }),
  oleoDeEscorregar: pocao('oleoDeEscorregar', 'Óleo de escorregar', RARIDADE.incomum,
    'Como Liberdade de Movimento por oito horas, ou Graxa no chão.'),
  oleoDeEtereidade: pocao('oleoDeEtereidade', 'Óleo de etereidade', RARIDADE.raro,
    'Forma etérea por uma hora.'),
  unguentoRestaurador: pocao('unguentoRestaurador', 'Unguento restaurador', RARIDADE.incomum,
    'Três doses. Cada uma cura 2d8+2 e encerra veneno ou doença.', { consumivel: 'curar', cura: '2d8+2', usos: 3 }),
  filtroDoAmor: pocao('filtroDoAmor', 'Filtro do amor', RARIDADE.incomum,
    'Enfeitiçado por uma hora pela primeira criatura que vir.'),
};

// --------------------------------------------------------- armas mágicas ----
const armaMagica = (id, name, raridade, desc, extra = {}) =>
  magico(id, name, raridade, desc, { tipo: 'arma mágica', art: 'espada', peso: 3, ...extra });

export const MAGIC_WEAPONS = {
  armaMais1: armaMagica('armaMais1', 'Arma +1', RARIDADE.incomum, '+1 de ataque e de dano.', { bonusAtaque: 1, bonusDano: 1 }),
  armaMais2: armaMagica('armaMais2', 'Arma +2', RARIDADE.raro, '+2 de ataque e de dano.', { bonusAtaque: 2, bonusDano: 2 }),
  armaMais3: armaMagica('armaMais3', 'Arma +3', RARIDADE.muitoRaro, '+3 de ataque e de dano.', { bonusAtaque: 3, bonusDano: 3 }),
  municaoMais1: armaMagica('municaoMais1', 'Munição +1', RARIDADE.incomum, '+1 de ataque e dano para o arco, a besta, a funda ou a zarabatana de quem a leva: a arma atira a melhor que houver na mochila, e a que acerta deixa de ser mágica.', { pilha: true, peso: 0.05, bonusAtaque: 1, bonusDano: 1 }),
  municaoMais2: armaMagica('municaoMais2', 'Munição +2', RARIDADE.raro, '+2 de ataque e dano para o arco, a besta, a funda ou a zarabatana de quem a leva: a arma atira a melhor que houver na mochila, e a que acerta deixa de ser mágica.', { pilha: true, peso: 0.05, bonusAtaque: 2, bonusDano: 2 }),
  municaoMais3: armaMagica('municaoMais3', 'Munição +3', RARIDADE.muitoRaro, '+3 de ataque e dano para o arco, a besta, a funda ou a zarabatana de quem a leva: a arma atira a melhor que houver na mochila, e a que acerta deixa de ser mágica.', { pilha: true, peso: 0.05, bonusAtaque: 3, bonusDano: 3 }),
  linguaDeFogo: armaMagica('linguaDeFogo', 'Língua de fogo', RARIDADE.raro,
    'Ação bônus para acender: +2d6 de fogo no acerto e luz plena de 12 m.', { base: 'espadaLonga', danoExtra: '2d6', tipoExtra: 'fogo', sintonia: true, bonusDano: 0 }),
  marcaDeGelo: armaMagica('marcaDeGelo', 'Marca de gelo', RARIDADE.muitoRaro,
    '+1d6 de frio no acerto, resistência a fogo, e apaga chama ao redor.', { base: 'espadaLonga', danoExtra: '1d6', tipoExtra: 'frio', sintonia: true, passivo: { resiste: ['fogo'] } }),
  espadaSolar: armaMagica('espadaSolar', 'Espada solar', RARIDADE.raro,
    'Lâmina de luz. +2 de ataque e dano, 1d8 de radiante extra, e +1d8 contra morto-vivo.', { base: 'espadaLonga', tipoDano: 'radiante', propsExtra: ['acuidade'], danoExtra: '1d8', tipoExtra: 'radiante', contra: 'morto-vivo', sintonia: true, bonusAtaque: 2, bonusDano: 2 }),
  matadoraDeDragoes: armaMagica('matadoraDeDragoes', 'Matadora de dragões', RARIDADE.raro,
    '+1 de ataque e dano, e +3d6 contra dragão.', { base: 'espadaLonga', danoExtra: '3d6', contra: 'dragão', bonusAtaque: 1, bonusDano: 1 }),
  matadoraDeGigantes: armaMagica('matadoraDeGigantes', 'Matadora de gigantes', RARIDADE.raro,
    '+1 de ataque e dano, e contra gigante +2d6 mais CD 15 de Força ou cai no chão.', { poder: 'derrubaGigante', base: 'espadaLonga', danoExtra: '2d6', contra: 'gigante', bonusAtaque: 1, bonusDano: 1 }),
  espadaDanca: armaMagica('espadaDanca', 'Espada dançante', RARIDADE.muitoRaro,
    'Ação bônus para soltá-la: luta sozinha por quatro turnos, a até 9 m de você.', { base: 'espadaLonga', sintonia: true }),
  espadaDeGume: armaMagica('espadaDeGume', 'Espada do gume', RARIDADE.muitoRaro,
    'No 20 natural, +4d6 de cortante. (O membro decepado do livro não entra.)', { poder: 'gume', base: 'espadaLonga', sintonia: true }),
  espadaVorpal: armaMagica('espadaVorpal', 'Espada vorpal', RARIDADE.lendario,
    '+3 de ataque e dano, ignora resistência a cortante, e no 20 natural decapita.', { poder: 'vorpal', base: 'espadaLonga', sintonia: true, bonusAtaque: 3, bonusDano: 3 }),
  espadaDaSorte: armaMagica('espadaDaSorte', 'Espada da sorte', RARIDADE.lendario,
    '+1 de ataque e dano, e uma vez por descanso longo transforma um erro em acerto.', { base: 'espadaLonga', sintonia: true, bonusAtaque: 1, bonusDano: 1 }),
  espadaDeRoubarVida: armaMagica('espadaDeRoubarVida', 'Espada ladra de vida', RARIDADE.raro,
    'No 20 natural, contra quem não é constructo nem morto-vivo: +3d6 de necrótico, e você ganha o mesmo tanto em PV temporários.', { poder: 'roubarVida', base: 'espadaLonga', sintonia: true }),
  espadaDeFerir: armaMagica('espadaDeFerir', 'Espada de ferir', RARIDADE.raro,
    'No 20 natural, o ferimento não fecha: 1d4 por turno até alguém curar.', { base: 'espadaLonga', sintonia: true }),
  defensora: armaMagica('defensora', 'Defensora', RARIDADE.lendario,
    'Três pontos de bônus para dividir, no começo do turno, entre ataque e CA.', { base: 'espadaLonga', bonusAtaque: 3, bonusDano: 3, sintonia: true }),
  vingadoraSagrada: armaMagica('vingadoraSagrada', 'Vingadora sagrada', RARIDADE.lendario,
    '+3 de ataque e dano, +2d10 de radiante contra corruptor e morto-vivo, e aura de +1 em resistências.',
    { base: 'espadaLonga', danoExtra: '2d10', tipoExtra: 'radiante', contra: ['corruptor', 'morto-vivo'], sintonia: true, bonusAtaque: 3, bonusDano: 3 }),
  machadoBerserker: armaMagica('machadoBerserker', 'Machado berserker', RARIDADE.raro,
    '+1 de ataque e dano. Enquanto sintonizado, +1 de PV máximo por nível — e um gosto de brigar que não é seu.',
    { base: 'machadoDeBatalha', sintonia: true, bonusAtaque: 1, bonusDano: 1, art: 'machado' }),
  ladraDeNoveVidas: armaMagica('ladraDeNoveVidas', 'Ladra de nove vidas', RARIDADE.muitoRaro,
    '+2 de ataque e dano. No 20 natural, contra quem tem menos de 100 PV e não é constructo nem morto-vivo: Constituição CD 15 ou morre. O livro dá 1d8+1 cargas; aqui são seis.',
    { poder: 'noveVidas', recarregavel: { cargas: 6, recarga: 0 }, base: 'espadaLonga', sintonia: true, bonusAtaque: 2, bonusDano: 2 }),
  macaDaDisrupcao: armaMagica('macaDaDisrupcao', 'Maça da disrupção', RARIDADE.raro,
    '+2d6 de radiante contra morto-vivo e corruptor, e os fracos somem de vez.', { base: 'maca', danoExtra: '2d6', tipoExtra: 'radiante', contra: ['corruptor', 'morto-vivo'], sintonia: true, art: 'maca' }),
  macaDoGolpe: armaMagica('macaDoGolpe', 'Maça do golpe', RARIDADE.raro,
    '+1 de ataque e dano. No 20 natural, +2d6 de concussão (4d6 contra constructo), e o constructo que fica com 25 PV ou menos se desfaz.',
    { poder: 'golpe', base: 'maca', bonusAtaque: 1, bonusDano: 1, art: 'maca' }),
  macaDoTerror: armaMagica('macaDoTerror', 'Maça do terror', RARIDADE.raro,
    'Três cargas: uma ação para aterrorizar quem estiver a 9 m, CD 15.', { base: 'maca', sintonia: true, art: 'maca' }),
  arremessadorAnao: armaMagica('arremessadorAnao', 'Arremessador anão', RARIDADE.muitoRaro,
    '+3 de ataque e dano. Arremessado, volta à mão, e +1d8 de dano (+2d8 contra gigante).',
    { base: 'marteloDeGuerra', sintonia: true, bonusAtaque: 3, bonusDano: 3, art: 'maca' }),
  azagaiaDoRaio: armaMagica('azagaiaDoRaio', 'Azagaia do raio', RARIDADE.incomum,
    'Ação bônus para virar um raio de 1,5 × 36 m: 4d6 de elétrico, CD 13 de Destreza para metade.', { base: 'azagaia', art: 'cajado' }),
  tridenteDoComando: armaMagica('tridenteDoComando', 'Tridente do comando marinho', RARIDADE.incomum,
    'Três cargas: dominar monstro aquático, CD 15.', { base: 'tridente', sintonia: true, art: 'cajado' }),
  arcoJuramentado: armaMagica('arcoJuramentado', 'Arco juramentado', RARIDADE.muitoRaro,
    'Jure contra um alvo: vantagem, alcance dobrado e +3d6 contra ele até ele cair.', { base: 'arcoLongo', sintonia: true, art: 'arco' }),
  flechaAssassina: armaMagica('flechaAssassina', 'Flecha assassina', RARIDADE.muitoRaro,
    'Feita contra um tipo de criatura. Nele, +6d10 e CD 17 de Constituição ou cai a zero.', { pilha: true, peso: 0.05, art: 'arco' }),
  armaDeAlerta: armaMagica('armaDeAlerta', 'Arma de alerta', RARIDADE.incomum,
    'Você e seus aliados não podem ser surpreendidos, e todos têm vantagem em iniciativa.', { base: 'espadaLonga', sintonia: true, passivo: { iniciativa: true } }),
};

// ----------------------------------------------------- armaduras mágicas ----
const armaduraMagica = (id, name, raridade, desc, extra = {}) =>
  magico(id, name, raridade, desc, { tipo: 'armadura mágica', art: 'escudo', peso: 20, ...extra });

export const MAGIC_ARMORS = {
  armaduraMais1: armaduraMagica('armaduraMais1', 'Armadura +1', RARIDADE.raro, '+1 de CA.', { acBonusArmadura: 1 }),
  armaduraMais2: armaduraMagica('armaduraMais2', 'Armadura +2', RARIDADE.muitoRaro, '+2 de CA.', { acBonusArmadura: 2 }),
  armaduraMais3: armaduraMagica('armaduraMais3', 'Armadura +3', RARIDADE.lendario, '+3 de CA.', { acBonusArmadura: 3 }),
  escudoMais1: armaduraMagica('escudoMais1', 'Escudo +1', RARIDADE.incomum, '+1 de CA além do +2 do escudo.', { base: 'escudo', peso: 6, acBonus: 1 }),
  escudoMais2: armaduraMagica('escudoMais2', 'Escudo +2', RARIDADE.raro, '+2 além do escudo.', { base: 'escudo', peso: 6, acBonus: 2 }),
  escudoMais3: armaduraMagica('escudoMais3', 'Escudo +3', RARIDADE.muitoRaro, '+3 além do escudo.', { base: 'escudo', peso: 6, acBonus: 3 }),
  armaduraAdamantina: armaduraMagica('armaduraAdamantina', 'Armadura adamantina', RARIDADE.incomum,
    'Todo acerto crítico contra você vira acerto normal.', { base: 'cotaDeMalha', passivo: { semCritico: true } }),
  armaduraDeMithral: armaduraMagica('armaduraDeMithral', 'Armadura de mithral', RARIDADE.incomum,
    'Leve como couro: perde a desvantagem em Furtividade e a exigência de Força.', { base: 'cotaDeMalha', semDesvantagemFurtividade: true, semForcaMinima: true }),
  armaduraDeResistencia: armaduraMagica('armaduraDeResistencia', 'Armadura de resistência', RARIDADE.raro,
    'Resistência a um tipo de dano, decidido na forja.', { sintonia: true }),
  armaduraDeInvulnerabilidade: armaduraMagica('armaduraDeInvulnerabilidade', 'Armadura da invulnerabilidade', RARIDADE.lendario,
    'Resistência a dano não mágico, e uma vez por dia dez minutos de imunidade.', { base: 'placas', passivo: { resisteNaoMagico: ['cortante', 'perfurante', 'concussão'] }, sintonia: true }),
  placasAnas: armaduraMagica('placasAnas', 'Placas anãs', RARIDADE.muitoRaro,
    '+2 de CA, e quem te empurrar perde 3 m do empurrão.', { base: 'placas', acBonusArmadura: 2 }),
  malhaElfica: armaduraMagica('malhaElfica', 'Malha élfica', RARIDADE.raro,
    '+1 de CA, sem treino exigido e sem desvantagem em Furtividade.', { base: 'camisaoDeMalha', semTreino: true, acBonusArmadura: 1, peso: 20 }),
  couroGlamourizado: armaduraMagica('couroGlamourizado', 'Couro batido glamourizado', RARIDADE.raro,
    '+1 de CA, e uma ação bônus faz a armadura parecer qualquer outra roupa.', { base: 'couroBatido', acBonusArmadura: 1, peso: 13 }),
  armaduraDeEscamasDeDragao: armaduraMagica('armaduraDeEscamasDeDragao', 'Brunea de escamas de dragão', RARIDADE.muitoRaro,
    '+1 de CA, resistência ao dano do dragão de origem, e sentir dragão uma vez por dia.', { base: 'brunea', sintonia: true, acBonusArmadura: 1 }),
  armaduraDeDemonio: armaduraMagica('armaduraDeDemonio', 'Armadura de demônio', RARIDADE.muitoRaro,
    '+1 de CA, garras de 1d8, e entender abissal. Tirá-la exige Remover Maldição.', { base: 'placas', sintonia: true, acBonusArmadura: 1 }),
  placasDaEtereidade: armaduraMagica('placasDaEtereidade', 'Placas da etereidade', RARIDADE.lendario,
    '+1 de CA, e dez minutos de forma etérea por dia.', { base: 'placas', sintonia: true, acBonusArmadura: 1 }),
  escudoAnimado: armaduraMagica('escudoAnimado', 'Escudo animado', RARIDADE.muitoRaro,
    'Ação bônus para soltá-lo: ele flutua e defende sozinho por um minuto, deixando as duas mãos livres.',
    { base: 'escudo', sintonia: true, peso: 6, acBonus: 2 }),
  escudoCaptador: armaduraMagica('escudoCaptador', 'Escudo captador de flechas', RARIDADE.raro,
    '+2 de CA contra ataques à distância, e a reação de aparar vale para aliado a 1,5 m.', { base: 'escudo', sintonia: true, peso: 6 }),
  escudoSentinela: armaduraMagica('escudoSentinela', 'Escudo sentinela', RARIDADE.incomum,
    'Vantagem em iniciativa e em Percepção.', { base: 'escudo', sintonia: true, peso: 6, passivo: { iniciativa: true, vantagemPericia: ['percepcao'] } }),
  escudoGuardaMagia: armaduraMagica('escudoGuardaMagia', 'Escudo guarda-magia', RARIDADE.muitoRaro,
    'Vantagem em resistências contra magia.', { base: 'escudo', sintonia: true, peso: 6, passivo: { vantagemContraMagia: true } }),
  escudoAtraidor: armaduraMagica('escudoAtraidor', 'Escudo atraidor de projéteis', RARIDADE.raro,
    '+2 de CA, mas todo projétil a 3 m muda de alvo para você. Maldito.', { base: 'escudo', sintonia: true, peso: 6, acBonus: 2 }),
};

// -------------------------------------------------- anéis, varinhas, cajados ----
const anel = (id, name, raridade, desc, extra = {}) =>
  magico(id, name, raridade, desc, { tipo: 'anel', art: 'arcano', peso: 0, sintonia: true, ...extra });

export const RINGS = {
  anelDeProtecao: anel('anelDeProtecao', 'Anel de proteção', RARIDADE.raro, '+1 de CA e +1 em todas as resistências.', { acBonus: 1, passivo: { ca: 1, salvas: 1 } }),
  // O ANEL NETHERESE do Poço da Coruja Velha (o Obelisco): um Anel de Proteção feito de uma peça só de vidro verde
  // místico, mais duro que aço, e que segura o que a mão dele segura (+4 contra largar ou ser desarmado). O motor não
  // tem desarmar; o +4 fica dito.
  anelDeProtecaoNetherese: anel('anelDeProtecaoNetherese', 'Anel de proteção netherese', RARIDADE.raro,
    '+1 de CA e +1 em todas as resistências. Vidro verde de Netheril, mais duro que aço: a mão que o usa não larga o que segura (+4 contra ser desarmado ou deixar cair).', { acBonus: 1, passivo: { ca: 1, salvas: 1 } }),
  anelDeQuedaSuave: anel('anelDeQuedaSuave', 'Anel de queda suave', RARIDADE.raro, 'Você cai 18 m por turno e nunca se machuca na queda.'),
  anelDeAcaoLivre: anel('anelDeAcaoLivre', 'Anel de ação livre', RARIDADE.raro, 'Terreno difícil não custa nada, e nada te prende nem te paralisa.', { passivo: { liberdade: true } }),
  anelDeInvisibilidade: anel('anelDeInvisibilidade', 'Anel de invisibilidade', RARIDADE.lendario, 'Uma ação para sumir, outra para voltar.'),
  anelDeSalto: anel('anelDeSalto', 'Anel de salto', RARIDADE.incomum, 'Saltar à vontade, como a magia.'),
  anelDeEscudoMental: anel('anelDeEscudoMental', 'Anel de escudo mental', RARIDADE.incomum, 'Ninguém lê sua mente nem descobre que você mentiu.'),
  anelDeRegeneracao: anel('anelDeRegeneracao', 'Anel de regeneração', RARIDADE.muitoRaro, '1d6 de vida a cada dez minutos, e membro perdido volta.'),
  anelDeResistencia: anel('anelDeResistencia', 'Anel de resistência', RARIDADE.raro, 'Resistência a um tipo de dano, decidido na forja.'),
  anelDeNatacao: anel('anelDeNatacao', 'Anel de natação', RARIDADE.incomum, 'Deslocamento de natação de 12 m.', { sintonia: false }),
  anelDeCalor: anel('anelDeCalor', 'Anel de calor', RARIDADE.incomum, 'Resistência a frio e conforto até −45 °C.', { passivo: { resiste: ['frio'] } }),
  anelDeAndarSobreAgua: anel('anelDeAndarSobreAgua', 'Anel de andar sobre a água', RARIDADE.incomum, 'A superfície vira chão.', { sintonia: false }),
  anelDeTelecinesia: anel('anelDeTelecinesia', 'Anel de telecinesia', RARIDADE.muitoRaro, 'Telecinesia à vontade.'),
  anelDeArmazenarMagia: anel('anelDeArmazenarMagia', 'Anel de armazenar magias', RARIDADE.raro, 'Guarda até cinco níveis de magia para outro conjurar.'),
  anelDeReflexao: anel('anelDeReflexao', 'Anel de reflexão de magia', RARIDADE.lendario, 'Devolve ao conjurador a magia de alvo único que falhar contra você.'),
  anelDoAriete: anel('anelDoAriete', 'Anel do aríete', RARIDADE.raro, 'Três cargas: 2d10 de dano energético e empurra 4,5 m.'),
  anelDeEstrelasCadentes: anel('anelDeEstrelasCadentes', 'Anel de estrelas cadentes', RARIDADE.muitoRaro, 'Luz, relâmpago e esferas de fogo, à noite e ao ar livre.'),
  anelDeVisaoDeRaioX: anel('anelDeVisaoDeRaioX', 'Anel de visão de raio X', RARIDADE.raro, 'Enxerga através de 30 cm de madeira ou 2,5 cm de metal.'),
  anelDeTresDesejos: anel('anelDeTresDesejos', 'Anel de três desejos', RARIDADE.lendario, 'Três desejos, e depois é só um anel.', { sintonia: false }),
};

const varinha = (id, name, raridade, desc, extra = {}) =>
  magico(id, name, raridade, desc, { tipo: 'varinha', art: 'arcano', peso: 1, sintonia: true, ...extra });

export const WANDS = {
  // AS VARINHAS QUE CONJURAM (`itens-que-conjuram.js`): sete cargas, 1d6+1 de volta ao amanhecer, a CD 15 do livro
  varinhaDeMisseisMagicos: varinha('varinhaDeMisseisMagicos', 'Varinha de mísseis mágicos', RARIDADE.incomum,
    'Sete cargas. Uma carga por nível de Míssil Mágico.', { sintonia: false,
      conjura: { cargas: 7, recarga: '1d6+1', magias: { misselMagico: { custo: 1, circulo: 1, maisPorCarga: 2 } } } }),
  varinhaDeTeia: varinha('varinhaDeTeia', 'Varinha de teia', RARIDADE.incomum, 'Sete cargas de Teia, CD 15.',
    { conjura: { cargas: 7, recarga: '1d6+1', cd: 15, exigeConjurador: true, magias: { teia: { custo: 1 } } } }),
  varinhaDeBolaDeFogo: varinha('varinhaDeBolaDeFogo', 'Varinha de bola de fogo', RARIDADE.raro, 'Sete cargas de Bola de Fogo, CD 15.',
    { conjura: { cargas: 7, recarga: '1d6+1', cd: 15, exigeConjurador: true, magias: { bolaDeFogo: { custo: 1, circulo: 3, maisPorCarga: 3 } } } }),
  varinhaDeRaios: varinha('varinhaDeRaios', 'Varinha de relâmpagos', RARIDADE.raro, 'Sete cargas de Relâmpago, CD 15.',
    { conjura: { cargas: 7, recarga: '1d6+1', cd: 15, exigeConjurador: true, magias: { relampago: { custo: 1, circulo: 3, maisPorCarga: 3 } } } }),
  varinhaDeParalisia: varinha('varinhaDeParalisia', 'Varinha de paralisia', RARIDADE.raro, 'Sete cargas: CD 15 de Constituição ou paralisado por um minuto.'),
  varinhaDeMedo: varinha('varinhaDeMedo', 'Varinha de medo', RARIDADE.raro, 'Sete cargas: Comando por uma (a ordem é fugir), Medo em cone de 18 m por duas, CD 15.',
    { conjura: { cargas: 7, recarga: '1d6+1', cd: 15, magias: { comando: { custo: 1 }, medo: { custo: 2 } } } }),
  varinhaDeDeteccaoDeInimigos: varinha('varinhaDeDeteccaoDeInimigos', 'Varinha de detecção de inimigos', RARIDADE.raro, 'Sete cargas: um minuto sentindo quem quer te machucar a 18 m.'),
  varinhaDeAtadura: varinha('varinhaDeAtadura', 'Varinha de atadura', RARIDADE.raro, 'Sete cargas: escapa de agarrão ou prende extraplanar.'),
  varinhaDePolimorfia: varinha('varinhaDePolimorfia', 'Varinha de polimorfia', RARIDADE.muitoRaro, 'Sete cargas de Metamorfose, CD 15.',
    { conjura: { cargas: 7, recarga: '1d6+1', cd: 15, exigeConjurador: true, magias: { metamorfose: { custo: 1 } } } }),
  varinhaDeSegredos: varinha('varinhaDeSegredos', 'Varinha de segredos', RARIDADE.incomum, 'Duas cargas: aponta porta e armadilha escondidas a 9 m.', { sintonia: false }),
  varinhaDoMagoDeGuerra: varinha('varinhaDoMagoDeGuerra', 'Varinha do mago de guerra', RARIDADE.incomum, '+1 no ataque de magia (há de +2 e de +3), e ignora meia cobertura.', { passivo: { ataqueMagia: 1 } }),
  varinhaDasMaravilhas: varinha('varinhaDasMaravilhas', 'Varinha das maravilhas', RARIDADE.raro, 'Sete cargas, e uma tabela de efeitos que ninguém controla.'),
};

const cajado = (id, name, raridade, desc, extra = {}) =>
  magico(id, name, raridade, desc, { tipo: 'cajado', art: 'cajado', peso: 4, sintonia: true, ...extra });

export const STAVES = {
  cajadoDeCura: cajado('cajadoDeCura', 'Cajado de cura', RARIDADE.raro, 'Dez cargas (1d6+4 ao amanhecer): Curar Ferimentos, uma carga por círculo até o 4º; Restauração Menor, duas; Curar Ferimentos em Massa, cinco.',
    { conjura: { cargas: 10, recarga: '1d6+4', exigeConjurador: true, magias: { curarFerimentos: { custo: 1, maisPorCarga: 3 }, restauracaoMenor: { custo: 2 }, curarFerimentosEmMassa: { custo: 5 } } } , base: 'bordao' }),
  cajadoDeFogo: cajado('cajadoDeFogo', 'Cajado de fogo', RARIDADE.muitoRaro, 'Dez cargas (1d6+4 ao amanhecer): Mãos Flamejantes por uma, Bola de Fogo por três, Muralha de Fogo por quatro. Resistência a fogo.',
    { passivo: { resiste: ['fogo'] }, conjura: { cargas: 10, recarga: '1d6+4', exigeConjurador: true, magias: { maosFlamejantes: { custo: 1 }, bolaDeFogo: { custo: 3 }, muralhaDeFogo: { custo: 4 } } } , base: 'bordao' }),
  cajadoDeGelo: cajado('cajadoDeGelo', 'Cajado de gelo', RARIDADE.muitoRaro, 'Dez cargas (1d6+4 ao amanhecer): Névoa Obscurecente por uma, Tempestade de Gelo e Muralha de Gelo por quatro, Cone de Frio por cinco. Resistência a frio.',
    { passivo: { resiste: ['frio'] }, conjura: { cargas: 10, recarga: '1d6+4', exigeConjurador: true, magias: { nevoaObscurecente: { custo: 1 }, tempestadeDeGelo: { custo: 4 }, muralhaDeGelo: { custo: 4 }, coneDeFrio: { custo: 5 } } } , base: 'bordao' }),
  cajadoDoGolpe: cajado('cajadoDoGolpe', 'Cajado do golpe', RARIDADE.muitoRaro, 'Arma +3. Dez cargas: até três a mais por golpe, 1d6 de dano energético cada.', { base: 'bordao', bonusAtaque: 3, bonusDano: 3 }),
  cajadoDeEnxame: cajado('cajadoDeEnxame', 'Cajado de enxame de insetos', RARIDADE.raro, 'Dez cargas (1d6+4 ao amanhecer): Inseto Gigante por quatro, Praga de Insetos por cinco.',
    { conjura: { cargas: 10, recarga: '1d6+4', exigeConjurador: true, magias: { insetoGigante: { custo: 4 }, pragaDeInsetos: { custo: 5 } } } , base: 'bordao' }),
  cajadoDaSerpente: cajado('cajadoDaSerpente', 'Cajado da serpente', RARIDADE.incomum, 'Uma ação bônus e ele vira uma cobra venenosa que luta por você.', { base: 'bordao' }),
  cajadoDoEncanto: cajado('cajadoDoEncanto', 'Cajado do encanto', RARIDADE.raro, 'Dez cargas (1d8+2 ao amanhecer): Enfeitiçar Pessoa, Comando e Compreender Idiomas, uma cada.',
    { conjura: { cargas: 10, recarga: '1d8+2', exigeConjurador: true, magias: { enfeiticarPessoa: { custo: 1 }, comando: { custo: 1 } } } , base: 'bordao' }),
  cajadoDeMurchar: cajado('cajadoDeMurchar', 'Cajado de murchar', RARIDADE.raro, 'Três cargas: +2d10 de necrótico, com desvantagem em Força e Constituição.', { base: 'bordao' }),
  cajadoDoTrovaoERaio: cajado('cajadoDoTrovaoERaio', 'Cajado do trovão e do raio', RARIDADE.muitoRaro, 'Arma +2, e cinco poderes de trovão e relâmpago, um por dia cada.', { base: 'bordao', bonusAtaque: 2, bonusDano: 2 }),
  cajadoDasFlorestas: cajado('cajadoDasFlorestas', 'Cajado das florestas', RARIDADE.raro, 'Arma +2. Dez cargas (1d6+4 ao amanhecer) de magias de mata (Amizade Animal, Pele de Árvore, Muralha de Espinhos e as de conversar), e vira uma árvore.',
    { bonusAtaque: 2, bonusDano: 2, conjura: { cargas: 10, recarga: '1d6+4', exigeConjurador: true, magias: { amizadeAnimal: { custo: 1 }, peleDeArvore: { custo: 2 }, muralhaDeEspinhos: { custo: 6 } } } , base: 'bordao' }),
  cajadoDoPoder: cajado('cajadoDoPoder', 'Cajado do poder', RARIDADE.muitoRaro, 'Arma +2, +1 de CA e de resistências, e vinte cargas (2d8+4 ao amanhecer) de magia de ataque, a Bola de Fogo e o Relâmpago no 5º círculo.',
    { bonusAtaque: 2, bonusDano: 2, acBonus: 1, passivo: { ca: 1, salvas: 1 }, conjura: { cargas: 20, recarga: '2d8+4', exigeConjurador: true, magias: { misselMagico: { custo: 1 }, levitacao: { custo: 2 }, bolaDeFogo: { custo: 5, circulo: 5 }, relampago: { custo: 5, circulo: 5 }, coneDeFrio: { custo: 5 }, imobilizarMonstro: { custo: 5 }, muralhaDeForca: { custo: 5 }, globoDeInvulnerabilidade: { custo: 6 } } } , base: 'bordao' }),
  cajadoDoMagi: cajado('cajadoDoMagi', 'Cajado do magi', RARIDADE.lendario, 'Arma +2, absorve magia, e cinquenta cargas de quase tudo.', { base: 'bordao', bonusAtaque: 2, bonusDano: 2, passivo: { vantagemContraMagia: true } }),
};

const cetro = (id, name, raridade, desc, extra = {}) =>
  magico(id, name, raridade, desc, { tipo: 'cetro', art: 'arcano', peso: 2, sintonia: true, ...extra });

export const RODS = {
  cetroDeAbsorcao: cetro('cetroDeAbsorcao', 'Cetro de absorção', RARIDADE.muitoRaro, 'Engole a magia de alvo único lançada em você e devolve como espaço de magia.'),
  cetroDeAlerta: cetro('cetroDeAlerta', 'Cetro de alerta', RARIDADE.raro, 'Vantagem em Percepção e na iniciativa, e uma aura que protege os aliados.', { passivo: { iniciativa: true, vantagemPericia: ['percepcao'] } }),
  cetroDoGuardiaoDoPacto: cetro('cetroDoGuardiaoDoPacto', 'Cetro do guardião do pacto', RARIDADE.incomum, '+1 a +3 na CD e no ataque de magia, e recupera um espaço por descanso longo.', { fonte: 'dmg' }),
  cetroDeSeguranca: cetro('cetroDeSeguranca', 'Cetro de segurança', RARIDADE.muitoRaro, 'Leva você e até 199 pessoas para um paraíso de bolso, por até duzentos dias somados.'),
  cetroDoDominio: cetro('cetroDoDominio', 'Cetro do domínio', RARIDADE.raro, 'Uma vez por dia: todos a 36 m ficam enfeitiçados por oito horas, CD 15.'),
  cetroDoPoderioSenhorial: cetro('cetroDoPoderioSenhorial', 'Cetro do poderio senhorial', RARIDADE.lendario, 'Vira maça, machado ou lança, estica como vara, e ainda assusta e cura.'),
  cetroDaRessurreicao: cetro('cetroDaRessurreicao', 'Cetro da ressurreição', RARIDADE.lendario, 'Cinco cargas: curar tudo ou trazer alguém de volta.'),
};

// ------------------------------------------------------- itens maravilhosos ----
const maravilhoso = (id, name, raridade, desc, extra = {}) =>
  magico(id, name, raridade, desc, { tipo: 'maravilhoso', art: 'arcano', ...extra });

export const WONDROUS = {
  bolsaDeConter: maravilhoso('bolsaDeConter', 'Bolsa de conter', RARIDADE.incomum, 'Quinhentas libras numa bolsa de quinze. Não a ponha dentro de outra.', { peso: 15, sintonia: false }),
  buracoPortatil: maravilhoso('buracoPortatil', 'Buraco portátil', RARIDADE.raro, 'Um pano que vira um poço de 1,8 m de fundo onde você o abrir.', { peso: 0 }),
  manoplasDeForcaDeOgro: maravilhoso('manoplasDeForcaDeOgro', 'Manoplas de força de ogro', RARIDADE.incomum, 'Sua Força vira 19, se já não for maior.', { sintonia: true, peso: 2, passivo: { atributos: { str: 19 } } }),
  faixaDeIntelecto: maravilhoso('faixaDeIntelecto', 'Faixa de intelecto', RARIDADE.incomum, 'Sua Inteligência vira 19, se já não for maior.', { sintonia: true, peso: 0, passivo: { atributos: { int: 19 } } }),
  mantoDeProtecao: maravilhoso('mantoDeProtecao', 'Manto de proteção', RARIDADE.incomum, '+1 de CA e +1 em resistências.', { sintonia: true, acBonus: 1, peso: 1, passivo: { ca: 1, salvas: 1 } }),
  mantoElfico: maravilhoso('mantoElfico', 'Manto élfico', RARIDADE.incomum, 'Vantagem em Furtividade, e quem procura você tem desvantagem.', { sintonia: true, peso: 1, passivo: { vantagemPericia: ['furtividade'] } }),
  mantoDeDeslocamento: maravilhoso('mantoDeDeslocamento', 'Manto de deslocamento', RARIDADE.raro, 'Uma imagem sua desloca o alvo: quem te ataca tem desvantagem.', { sintonia: true, peso: 1 }),
  mantoDoMorcego: maravilhoso('mantoDoMorcego', 'Manto do morcego', RARIDADE.raro, 'Vantagem em Furtividade, e no escuro você voa.', { sintonia: true, peso: 1, passivo: { vantagemPericia: ['furtividade'] } }),
  mantoDaArraia: maravilhoso('mantoDaArraia', 'Manto da arraia', RARIDADE.incomum, 'Respira e nada debaixo da água.', { peso: 1, passivo: { respiraNaAgua: true } }),
  capaDoCharlatao: maravilhoso('capaDoCharlatao', 'Capa do charlatão', RARIDADE.raro, 'Uma vez por dia, uma ação bônus que te teleporta 360 m.', { sintonia: true, peso: 1 }),
  botasElficas: maravilhoso('botasElficas', 'Botas élficas', RARIDADE.incomum, 'Seus passos não fazem barulho nenhum.', { sintonia: true, peso: 1, passivo: { vantagemPericia: ['furtividade'] } }),
  botasDeLevitacao: maravilhoso('botasDeLevitacao', 'Botas de levitação', RARIDADE.raro, 'Levitar à vontade.', { sintonia: true, peso: 1 }),
  botasDeVelocidade: maravilhoso('botasDeVelocidade', 'Botas de velocidade', RARIDADE.raro, 'Ação bônus: deslocamento dobrado e ataques de oportunidade com desvantagem.', { sintonia: true, peso: 1 }),
  botasDeMarchaESalto: maravilhoso('botasDeMarchaESalto', 'Botas de marcha e salto', RARIDADE.incomum, 'Deslocamento 9 m e saltos triplicados.', { sintonia: true, peso: 1 }),
  botasAladas: maravilhoso('botasAladas', 'Botas aladas', RARIDADE.incomum, 'Quatro horas de voo por dia, na sua velocidade de caminhada.', { sintonia: true, peso: 1 }),
  asasDeVoo: maravilhoso('asasDeVoo', 'Asas de voo', RARIDADE.raro, 'Uma hora e meia de voo a 18 m por turno, uma vez por descanso.', { sintonia: true, peso: 2 }),
  chinelosDeEscalarParedes: maravilhoso('chinelosDeEscalarParedes', 'Chinelos de escalar paredes', RARIDADE.raro, 'Anda em parede e teto como no chão.', { sintonia: true, peso: 1 }),
  braceletesDeArqueiro: maravilhoso('braceletesDeArqueiro', 'Braceletes de arqueiro', RARIDADE.incomum, 'Proficiência com arcos e +2 de dano com eles.', { sintonia: true, peso: 1 }),
  braceletesDeDefesa: maravilhoso('braceletesDeDefesa', 'Braceletes de defesa', RARIDADE.raro, '+2 de CA, se você estiver sem armadura e sem escudo.', { sintonia: true, acBonus: 2, peso: 1, passivo: { caSemArmadura: 2 } }),
  brocheDeEscudo: maravilhoso('brocheDeEscudo', 'Broche de escudo', RARIDADE.incomum, 'Resistência a dano energético, e imune a Míssil Mágico.', { sintonia: true, peso: 0, passivo: { resiste: ['energético'] } }),
  luvasDeAgarrarProjetis: maravilhoso('luvasDeAgarrarProjetis', 'Luvas de agarrar projéteis', RARIDADE.incomum, 'Reação para reduzir o dano de um tiro em 1d10 + Destreza — e às vezes devolvê-lo.', { sintonia: true, peso: 0 }),
  luvasDeNadarEEscalar: maravilhoso('luvasDeNadarEEscalar', 'Luvas de nadar e escalar', RARIDADE.incomum, 'Nadar e escalar sem custo extra, e vantagem em Atletismo para isso.', { sintonia: true, peso: 0 }),
  luvasDeLadrao: maravilhoso('luvasDeLadrao', 'Luvas de ladrão', RARIDADE.incomum, '+5 em Prestidigitação.', { sintonia: true, peso: 0, passivo: { pericias: { prestidigitacao: 5 } } }),
  oculosDeNoite: maravilhoso('oculosDeNoite', 'Óculos de visão noturna', RARIDADE.incomum, 'Visão no escuro de 18 m.', { peso: 0, passivo: { visao: 60 } }),
  olhosDaAguia: maravilhoso('olhosDaAguia', 'Olhos da águia', RARIDADE.incomum, 'Vantagem em Percepção visual; a 1,6 km você distingue um rosto.', { sintonia: true, peso: 0, passivo: { vantagemPericia: ['percepcao'] } }),
  olhosDeVisaoMinuciosa: maravilhoso('olhosDeVisaoMinuciosa', 'Olhos de visão minuciosa', RARIDADE.incomum, 'Visão no escuro de 36 m, se já tiver alguma.', { peso: 0 }),
  olhosDoEncanto: maravilhoso('olhosDoEncanto', 'Olhos do encanto', RARIDADE.incomum, 'Três cargas: Enfeitiçar Pessoa só com o olhar, CD 13.', { sintonia: true, peso: 0,
    conjura: { cargas: 3, recarga: null, cd: 13, magias: { enfeiticarPessoa: { custo: 1 } } } }),
  chapeuDeDisfarce: maravilhoso('chapeuDeDisfarce', 'Chapéu de disfarce', RARIDADE.incomum, 'Disfarçar-se à vontade.', { sintonia: true, peso: 0 }),
  elmoDeTelepatia: maravilhoso('elmoDeTelepatia', 'Elmo de telepatia', RARIDADE.incomum, 'Detectar pensamentos e falar pela mente.', { sintonia: true, peso: 3 }),
  elmoDeCompreenderIdiomas: maravilhoso('elmoDeCompreenderIdiomas', 'Elmo de compreender idiomas', RARIDADE.comum, 'Compreender Idiomas à vontade.', { peso: 3 }),
  elmoDeBrilho: maravilhoso('elmoDeBrilho', 'Elmo do fulgor', RARIDADE.muitoRaro, 'Luz do Dia, Chama Sagrada, Raio de Fogo e Fogo Divino, com cargas.', { sintonia: true, peso: 3 }),
  medalhaoDosPensamentos: maravilhoso('medalhaoDosPensamentos', 'Medalhão dos pensamentos', RARIDADE.incomum, 'Três cargas de Detectar Pensamentos, CD 13.', { sintonia: true, peso: 0 }),
  amuletoDeAdaptacao: maravilhoso('amuletoDeAdaptacao', 'Amuleto de adaptação', RARIDADE.incomum, 'Você respira em qualquer lugar, inclusive debaixo da água.', { sintonia: true, peso: 0, passivo: { respiraNaAgua: true } }),
  amuletoDeSaude: maravilhoso('amuletoDeSaude', 'Amuleto de saúde', RARIDADE.raro, 'Sua Constituição vira 19, se já não for maior.', { sintonia: true, peso: 0, passivo: { atributos: { con: 19 } } }),
  amuletoContraVeneno: maravilhoso('amuletoContraVeneno', 'Amuleto contra veneno', RARIDADE.incomum, 'Imune a veneno e à condição envenenado.', { sintonia: true, peso: 0, passivo: { imune: ['veneno'], imuneCondicao: ['envenenado'] } }),
  amuletoDeFecharFeridas: maravilhoso('amuletoDeFecharFeridas', 'Amuleto de fechar feridas', RARIDADE.incomum, 'Dobra o que você cura com dado de vida, e estabiliza sozinho.', { sintonia: true, peso: 0 }),
  colarDeBolasDeFogo: maravilhoso('colarDeBolasDeFogo', 'Colar de bolas de fogo', RARIDADE.raro, 'Contas que se arrancam e se arremessam, de 2d6 a 7d6.', { peso: 0 }),
  colarDeContasDeOracao: maravilhoso('colarDeContasDeOracao', 'Colar de contas de oração', RARIDADE.raro, 'Contas que guardam Bênção, Curar Ferimentos, Favor Divino e outras.', { sintonia: true, peso: 0 }),
  perolaDoPoder: maravilhoso('perolaDoPoder', 'Pérola do poder', RARIDADE.incomum, 'Uma ação bônus por dia recupera um espaço de até 3º círculo.', { sintonia: true, peso: 0 }),
  pedraDaBoaSorte: maravilhoso('pedraDaBoaSorte', 'Pedra da boa sorte', RARIDADE.incomum, '+1 em testes de perícia e em resistências.', { sintonia: true, peso: 0, passivo: { testes: 1, salvas: 1 } }),
  escaravelhoDeProtecao: maravilhoso('escaravelhoDeProtecao', 'Escaravelho de proteção', RARIDADE.lendario, 'Vantagem contra magia, e doze cargas que anulam dano necrótico.', { sintonia: true, peso: 0, passivo: { vantagemContraMagia: true } }),
  gemaDeVidencia: maravilhoso('gemaDeVidencia', 'Gema de vidência', RARIDADE.raro, 'Vê o invisível e enxerga através de ilusão e disfarce.', { sintonia: true, peso: 0 }),
  gemaDeBrilho: maravilhoso('gemaDeBrilho', 'Gema de brilho', RARIDADE.incomum, 'Cinquenta cargas de luz, inclusive um clarão que cega.', { peso: 1 }),
  cordaDeEscalada: maravilhoso('cordaDeEscalada', 'Corda de escalada', RARIDADE.incomum, 'Dezoito metros que sobem, amarram e desamarram ao seu comando.', { peso: 3, art: 'corda' }),
  cordaDeEnredar: maravilhoso('cordaDeEnredar', 'Corda de enredar', RARIDADE.raro, 'Enlaça sozinha quem estiver a 6 m, CD 15 para escapar.', { peso: 3, art: 'corda' }),
  varaImovel: maravilhoso('varaImovel', 'Vara imóvel', RARIDADE.incomum, 'Aperta o botão e ela para no ar, aguentando 8.000 libras.', { peso: 2 }),
  decantadorDeAguaInfinita: maravilhoso('decantadorDeAguaInfinita', 'Decantador de água infinita', RARIDADE.incomum, 'Até 120 litros de água por dia, em jorro, fluxo ou gêiser.', { peso: 2 }),
  solventeUniversal: maravilhoso('solventeUniversal', 'Solvente universal', RARIDADE.lendario, 'Dissolve qualquer cola, inclusive a soberana.', { peso: 0 }),
  colaSoberana: maravilhoso('colaSoberana', 'Cola soberana', RARIDADE.lendario, 'Gruda duas coisas para sempre, ou até o solvente aparecer.', { peso: 0 }),
  poDeDesaparecimento: maravilhoso('poDeDesaparecimento', 'Pó do desaparecimento', RARIDADE.incomum, 'Você e todos a 3 m ficam invisíveis por 2d4 minutos.', { peso: 0, pilha: true }),
  poDeSecura: maravilhoso('poDeSecura', 'Pó da secura', RARIDADE.incomum, 'Suga 400 litros de água numa pelota, ou desidrata um elemental.', { peso: 0, pilha: true }),
  poDeEspirroETosse: maravilhoso('poDeEspirroETosse', 'Pó do espirro e da tosse', RARIDADE.incomum, 'Parece pó do desaparecimento. Não é: todos a 9 m sufocam, CD 15.', { peso: 0, pilha: true }),
  algemasDimensionais: maravilhoso('algemasDimensionais', 'Algemas dimensionais', RARIDADE.raro, 'Impedem teleporte e viagem planar de quem as veste.', { peso: 6 }),
  gemaElemental: maravilhoso('gemaElemental', 'Gema elemental', RARIDADE.incomum, 'Quebre-a e um elemental amigo de nível 5 aparece por uma hora.', { peso: 1 }),
  figuraDePoderMaravilhoso: maravilhoso('figuraDePoderMaravilhoso', 'Figura de poder maravilhoso', RARIDADE.raro, 'Estatueta que vira o animal que representa e luta ao seu lado.', { peso: 1 }),
  corcelDeObsidiana: maravilhoso('corcelDeObsidiana', 'Corcel de obsidiana', RARIDADE.muitoRaro, 'Vira um nightmare que te serve — e que pode te levar aonde você não quer.', { peso: 1 }),
  lanternaReveladora: maravilhoso('lanternaReveladora', 'Lanterna reveladora', RARIDADE.incomum, 'Além de iluminar, mostra o invisível no seu cone.', { peso: 2, art: 'luz' }),
  espelhoDeAprisionarVida: maravilhoso('espelhoDeAprisionarVida', 'Espelho de aprisionar vida', RARIDADE.muitoRaro, 'Doze células onde ficam presas as criaturas que se virem nele.', { peso: 50 }),
  vassouraVoadora: maravilhoso('vassouraVoadora', 'Vassoura voadora', RARIDADE.incomum, 'Voa a 15 m por turno, com ou sem você em cima.', { peso: 3 }),
  tapeteVoador: maravilhoso('tapeteVoador', 'Tapete voador', RARIDADE.muitoRaro, 'Voa carregando peso de verdade, em quatro tamanhos.', { peso: 15 }),
  lequeDoVento: maravilhoso('lequeDoVento', 'Leque do vento', RARIDADE.incomum, 'Rajada de Vento à vontade, com risco de rasgar.', { peso: 0 }),
  gaitasDoAssombro: maravilhoso('gaitasDoAssombro', 'Gaitas do assombro', RARIDADE.incomum, 'Três cargas: todos a 9 m ficam amedrontados, CD 13.', { peso: 2 }),
  gaitasDosEsgotos: maravilhoso('gaitasDosEsgotos', 'Gaitas dos esgotos', RARIDADE.incomum, 'Chamam ratos, e às vezes mandam neles.', { sintonia: true, peso: 2 }),
  trompaDeExplosao: maravilhoso('trompaDeExplosao', 'Trompa da explosão', RARIDADE.raro, 'Cone de 9 m: 5d6 de trovejante e ensurdecido, CD 15.', { peso: 2 }),
  trompaDeValhalla: maravilhoso('trompaDeValhalla', 'Trompa de Valhalla', RARIDADE.raro, 'Convoca guerreiros espectrais que lutam por uma hora.', { peso: 2 }),
  baralhoDeIlusoes: maravilhoso('baralhoDeIlusoes', 'Baralho de ilusões', RARIDADE.raro, 'Trinta e quatro cartas; cada uma vira a ilusão de uma criatura.', { peso: 0 }),
  mantoDeOlhos: maravilhoso('mantoDeOlhos', 'Manto de olhos', RARIDADE.raro, 'Visão em todas as direções, no escuro e no invisível. Luz forte cega você.', { sintonia: true, peso: 1, passivo: { visao: 120, vantagemPericia: ['percepcao'] } }),
  mantoDasEstrelas: maravilhoso('mantoDasEstrelas', 'Manto das estrelas', RARIDADE.muitoRaro, '+1 em resistências, viagem ao Astral, e seis estrelas (1d6 de volta ao anoitecer) que viram Míssil Mágico de 5º círculo.', { sintonia: true,
    conjura: { cargas: 6, recarga: '1d6', magias: { misselMagico: { custo: 1, circulo: 5 } } }, peso: 1, passivo: { salvas: 1 } }),
  mantoDeCoresCintilantes: maravilhoso('mantoDeCoresCintilantes', 'Manto de cores cintilantes', RARIDADE.raro, 'Uma vez por dia: todos a 9 m ficam atordoados e cegos, CD 15.', { sintonia: true, peso: 1 }),
  mantoDoArquimago: maravilhoso('mantoDoArquimago', 'Manto do arquimago', RARIDADE.lendario, 'CA 15 + Destreza sem armadura, vantagem contra magia, e +2 na CD e no ataque.', { sintonia: true, peso: 1, passivo: { caBase: 15, vantagemContraMagia: true, cdMagia: 2, ataqueMagia: 2 } }),
  mantoDeItensUteis: maravilhoso('mantoDeItensUteis', 'Manto de itens úteis', RARIDADE.incomum, 'Remendos que se arrancam e viram escada, barco, janela, mastim ou fosso.', { peso: 1 }),
  pedraDeControlarElemental: maravilhoso('pedraDeControlarElemental', 'Pedra de controlar elemental da terra', RARIDADE.incomum, 'Convoca um elemental da terra por uma hora.', { peso: 5 }),
  bracadeirasDeBilarro: maravilhoso('bracadeirasDeBilarro', 'Faixas de aprisionamento', RARIDADE.raro, 'Esfera arremessada que prende uma criatura Enorme ou menor, CD 20.', { peso: 1 }),
  fichaDePenaDeQuaal: maravilhoso('fichaDePenaDeQuaal', 'Ficha de pena', RARIDADE.raro, 'Uma pena que vira âncora, árvore, barco, pássaro, chicote ou baú.', { peso: 0 }),
  aljavaEficiente: maravilhoso('aljavaEficiente', 'Aljava eficiente', RARIDADE.incomum, 'O mesmo: sessenta munições, dezoito hastes, seis arcos, dois quilos.', { peso: 2, art: 'arco' }),
  instrumentoDosBardos: maravilhoso('instrumentoDosBardos', 'Instrumento dos bardos', RARIDADE.incomum, 'Sete tipos, cada um com a sua lista de magias por dia.', { sintonia: true, peso: 2 }),
  pedraIoun: maravilhoso('pedraIoun', 'Pedra ioun', RARIDADE.raro, 'Orbita a sua cabeça. Cada cor faz uma coisa: atributo, CA, reserva, absorção, sustento.', { sintonia: true, peso: 0 }),
  talismaDoBemSupremo: maravilhoso('talismaDoBemSupremo', 'Talismã do bem supremo', RARIDADE.lendario, 'Sete cargas que abrem um fosso sob um corruptor. +2 na CD e no ataque de magia divina.', { sintonia: true, peso: 0 }),
  talismaDoMalSupremo: maravilhoso('talismaDoMalSupremo', 'Talismã do mal supremo', RARIDADE.lendario, 'O mesmo, do outro lado: o fosso se abre sob um celestial.', { sintonia: true, peso: 0 }),
  tomoDoPensamentoClaro: maravilhoso('tomoDoPensamentoClaro', 'Tomo do pensamento claro', RARIDADE.muitoRaro, 'Quarenta e oito horas de estudo em seis dias: +2 de Inteligência, e o limite sobe junto.', { peso: 5 }),
  tomoDaLideranca: maravilhoso('tomoDaLideranca', 'Tomo da liderança e da influência', RARIDADE.muitoRaro, 'O mesmo, para Carisma.', { peso: 5 }),
  tomoDoEntendimento: maravilhoso('tomoDoEntendimento', 'Tomo do entendimento', RARIDADE.muitoRaro, 'O mesmo, para Sabedoria.', { peso: 5 }),
  manualDoGolemDeCarne: maravilhoso('manualDoGolemDeCarne', 'Manual de golens', RARIDADE.muitoRaro, 'Ensina a construir um golem — e consome meses e uma fortuna no processo.', { peso: 5 }),
  manualDeExercicioRapido: maravilhoso('manualDeExercicioRapido', 'Manual do exercício rápido', RARIDADE.muitoRaro, '+2 de Força em seis dias de treino.', { peso: 5 }),
  manualDaAgilidade: maravilhoso('manualDaAgilidade', 'Manual da agilidade corporal', RARIDADE.muitoRaro, '+2 de Destreza em seis dias.', { peso: 5 }),
  manualDaSaude: maravilhoso('manualDaSaude', 'Manual da saúde corporal', RARIDADE.muitoRaro, '+2 de Constituição em seis dias.', { peso: 5 }),
  pocoDeMuitosMundos: maravilhoso('pocoDeMuitosMundos', 'Poço de muitos mundos', RARIDADE.lendario, 'Um pano que abre um portal para outro plano, sorteado.', { peso: 0 }),
};

/** Tudo junto, para quem só quer procurar por id. */
export const MAGIC_ITEMS = {
  ...POTIONS, ...MAGIC_WEAPONS, ...MAGIC_ARMORS,
  ...RINGS, ...WANDS, ...STAVES, ...RODS, ...WONDROUS,
};

export { RARIDADE };
