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
// `acBonus` e `acBonusArmadura` já são campos do combatente e `armorClass()`
// os soma — então um Anel de Proteção funciona de verdade assim que entrar
// num encaixe que os aplique. `bonusAtaque` e `bonusDano` ainda NÃO são lidos
// por `combat.js`: estão aqui para que a arma +1 já nasça com o número certo
// no dia em que forem. Enquanto não forem, a ficha os mostra e o motor os
// ignora, e isso está dito aqui para ninguém achar que a espada +2 está
// batendo mais.
//
// SINTONIA é contabilidade de ficha: três itens por personagem. Não há nada
// no motor que conte, e não inventei um contador que o jogo não respeitaria.

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

export const POTIONS = {
  pocaoDeCuraMaior: pocao('pocaoDeCuraMaior', 'Poção de cura maior', RARIDADE.incomum,
    'Uma ação para beber: 4d4+4 pontos de vida.', { consumivel: 'curar', cura: '4d4+4', acao: 'acao' }),
  pocaoDeCuraSuperior: pocao('pocaoDeCuraSuperior', 'Poção de cura superior', RARIDADE.raro,
    'Uma ação para beber: 8d4+8 pontos de vida.', { consumivel: 'curar', cura: '8d4+8', acao: 'acao' }),
  pocaoDeCuraSuprema: pocao('pocaoDeCuraSuprema', 'Poção de cura suprema', RARIDADE.muitoRaro,
    'Uma ação para beber: 10d4+20 pontos de vida.', { consumivel: 'curar', cura: '10d4+20', acao: 'acao' }),
  pocaoDeVitalidade: pocao('pocaoDeVitalidade', 'Poção de vitalidade', RARIDADE.muitoRaro,
    'Remove exaustão e cura doença e veneno. No descanso seguinte, os dados de vida voltam todos.'),
  pocaoDeHeroismo: pocao('pocaoDeHeroismo', 'Poção de heroísmo', RARIDADE.raro,
    '10 pontos de vida temporários por uma hora, e Bênção de graça o tempo todo.'),
  pocaoDeEscalada: pocao('pocaoDeEscalada', 'Poção de escalada', RARIDADE.comum,
    'Deslocamento de escalada igual ao de caminhada por uma hora, e vantagem para escalar.'),
  pocaoDeVelocidade: pocao('pocaoDeVelocidade', 'Poção de velocidade', RARIDADE.muitoRaro,
    'Acelerar por um minuto, sem concentração.'),
  pocaoDeInvisibilidade: pocao('pocaoDeInvisibilidade', 'Poção de invisibilidade', RARIDADE.muitoRaro,
    'Invisível por uma hora, ou até atacar ou conjurar.'),
  pocaoDeVoo: pocao('pocaoDeVoo', 'Poção de voo', RARIDADE.muitoRaro,
    'Deslocamento de voo igual ao de caminhada por uma hora.'),
  pocaoDeRespiracaoAquatica: pocao('pocaoDeRespiracaoAquatica', 'Poção de respiração aquática', RARIDADE.incomum,
    'Respira debaixo da água por uma hora.'),
  pocaoDeResistencia: pocao('pocaoDeResistencia', 'Poção de resistência', RARIDADE.incomum,
    'Resistência a um tipo de dano por uma hora. O tipo é sorteado ao fabricar.'),
  pocaoDeCrescimento: pocao('pocaoDeCrescimento', 'Poção de crescimento', RARIDADE.incomum,
    'Aumentar por 1d4 horas: uma categoria de tamanho, vantagem em Força, +1d4 de dano.'),
  pocaoDeDiminuicao: pocao('pocaoDeDiminuicao', 'Poção de diminuição', RARIDADE.raro,
    'Reduzir por 1d4 horas: uma categoria menor, desvantagem em Força, −1d4 de dano.'),
  pocaoDeFormaGasosa: pocao('pocaoDeFormaGasosa', 'Poção de forma gasosa', RARIDADE.raro,
    'Forma gasosa por uma hora, sem concentração.'),
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
  municaoMais1: armaMagica('municaoMais1', 'Munição +1', RARIDADE.incomum, '+1 de ataque e dano. Some depois do acerto.', { pilha: true, peso: 0.05, bonusAtaque: 1, bonusDano: 1 }),
  municaoMais2: armaMagica('municaoMais2', 'Munição +2', RARIDADE.raro, '+2 de ataque e dano.', { pilha: true, peso: 0.05, bonusAtaque: 2, bonusDano: 2 }),
  municaoMais3: armaMagica('municaoMais3', 'Munição +3', RARIDADE.muitoRaro, '+3 de ataque e dano.', { pilha: true, peso: 0.05, bonusAtaque: 3, bonusDano: 3 }),
  linguaDeFogo: armaMagica('linguaDeFogo', 'Língua de fogo', RARIDADE.raro,
    'Ação bônus para acender: +2d6 de fogo no acerto e luz plena de 12 m.', { sintonia: true, bonusDano: 0 }),
  marcaDeGelo: armaMagica('marcaDeGelo', 'Marca de gelo', RARIDADE.muitoRaro,
    '+1d6 de frio no acerto, resistência a fogo, e apaga chama ao redor.', { sintonia: true }),
  espadaSolar: armaMagica('espadaSolar', 'Espada solar', RARIDADE.raro,
    'Lâmina de luz. +2 de ataque e dano, 1d8 de radiante extra, e +1d8 contra morto-vivo.', { sintonia: true, bonusAtaque: 2, bonusDano: 2 }),
  matadoraDeDragoes: armaMagica('matadoraDeDragoes', 'Matadora de dragões', RARIDADE.raro,
    '+1 de ataque e dano, e +3d6 contra dragão.', { bonusAtaque: 1, bonusDano: 1 }),
  matadoraDeGigantes: armaMagica('matadoraDeGigantes', 'Matadora de gigantes', RARIDADE.raro,
    '+1 de ataque e dano, e contra gigante +2d6 mais CD 15 de Força ou cai no chão.', { bonusAtaque: 1, bonusDano: 1 }),
  espadaDanca: armaMagica('espadaDanca', 'Espada dançante', RARIDADE.muitoRaro,
    'Ação bônus para soltá-la: luta sozinha por quatro turnos, a até 9 m de você.', { sintonia: true }),
  espadaDeGume: armaMagica('espadaDeGume', 'Espada do gume', RARIDADE.muitoRaro,
    'No 20 natural, o golpe decepa um membro.', { sintonia: true }),
  espadaVorpal: armaMagica('espadaVorpal', 'Espada vorpal', RARIDADE.lendario,
    '+3 de ataque e dano, ignora resistência a cortante, e no 20 natural decapita.', { sintonia: true, bonusAtaque: 3, bonusDano: 3 }),
  espadaDaSorte: armaMagica('espadaDaSorte', 'Espada da sorte', RARIDADE.lendario,
    '+1 de ataque e dano, e uma vez por descanso longo transforma um erro em acerto.', { sintonia: true, bonusAtaque: 1, bonusDano: 1 }),
  espadaDeRoubarVida: armaMagica('espadaDeRoubarVida', 'Espada ladra de vida', RARIDADE.raro,
    'No 20 natural, +3d6 de necrótico e você recupera o mesmo tanto.', { sintonia: true }),
  espadaDeFerir: armaMagica('espadaDeFerir', 'Espada de ferir', RARIDADE.raro,
    'No 20 natural, o ferimento não fecha: 1d4 por turno até alguém curar.', { sintonia: true }),
  defensora: armaMagica('defensora', 'Defensora', RARIDADE.lendario,
    'Três pontos de bônus para dividir, no começo do turno, entre ataque e CA.', { sintonia: true }),
  vingadoraSagrada: armaMagica('vingadoraSagrada', 'Vingadora sagrada', RARIDADE.lendario,
    '+3 de ataque e dano, +2d10 de radiante contra corruptor e morto-vivo, e aura de +1 em resistências.',
    { sintonia: true, bonusAtaque: 3, bonusDano: 3 }),
  machadoBerserker: armaMagica('machadoBerserker', 'Machado berserker', RARIDADE.raro,
    '+1 de ataque e dano. Enquanto sintonizado, +1 de PV máximo por nível — e um gosto de brigar que não é seu.',
    { sintonia: true, bonusAtaque: 1, bonusDano: 1, art: 'machado' }),
  ladraDeNoveVidas: armaMagica('ladraDeNoveVidas', 'Ladra de nove vidas', RARIDADE.muitoRaro,
    '+2 de ataque e dano. No 20 natural contra alvo com menos de 100 PV, nove cargas que matam na hora.',
    { sintonia: true, bonusAtaque: 2, bonusDano: 2 }),
  macaDaDisrupcao: armaMagica('macaDaDisrupcao', 'Maça da disrupção', RARIDADE.raro,
    '+2d6 de radiante contra morto-vivo e corruptor, e os fracos somem de vez.', { sintonia: true, art: 'maca' }),
  macaDoGolpe: armaMagica('macaDoGolpe', 'Maça do golpe', RARIDADE.raro,
    '+1 de ataque e dano, +2 e +2d6 contra constructo. No 20 natural contra constructo, +4d6.',
    { bonusAtaque: 1, bonusDano: 1, art: 'maca' }),
  macaDoTerror: armaMagica('macaDoTerror', 'Maça do terror', RARIDADE.raro,
    'Três cargas: uma ação para aterrorizar quem estiver a 9 m, CD 15.', { sintonia: true, art: 'maca' }),
  arremessadorAnao: armaMagica('arremessadorAnao', 'Arremessador anão', RARIDADE.muitoRaro,
    '+3 de ataque e dano. Arremessado, volta à mão, e +1d8 de dano (+2d8 contra gigante).',
    { sintonia: true, bonusAtaque: 3, bonusDano: 3, art: 'maca' }),
  azagaiaDoRaio: armaMagica('azagaiaDoRaio', 'Azagaia do raio', RARIDADE.incomum,
    'Ação bônus para virar um raio de 1,5 × 36 m: 4d6 de elétrico, CD 13 de Destreza para metade.', { art: 'cajado' }),
  tridenteDoComando: armaMagica('tridenteDoComando', 'Tridente do comando marinho', RARIDADE.incomum,
    'Três cargas: dominar monstro aquático, CD 15.', { sintonia: true, art: 'cajado' }),
  arcoJuramentado: armaMagica('arcoJuramentado', 'Arco juramentado', RARIDADE.muitoRaro,
    'Jure contra um alvo: vantagem, alcance dobrado e +3d6 contra ele até ele cair.', { sintonia: true, art: 'arco' }),
  flechaAssassina: armaMagica('flechaAssassina', 'Flecha assassina', RARIDADE.muitoRaro,
    'Feita contra um tipo de criatura. Nele, +6d10 e CD 17 de Constituição ou cai a zero.', { pilha: true, peso: 0.05, art: 'arco' }),
  armaDeAlerta: armaMagica('armaDeAlerta', 'Arma de alerta', RARIDADE.incomum,
    'Você e seus aliados não podem ser surpreendidos, e todos têm vantagem em iniciativa.', { sintonia: true }),
};

// ----------------------------------------------------- armaduras mágicas ----
const armaduraMagica = (id, name, raridade, desc, extra = {}) =>
  magico(id, name, raridade, desc, { tipo: 'armadura mágica', art: 'escudo', peso: 20, ...extra });

export const MAGIC_ARMORS = {
  armaduraMais1: armaduraMagica('armaduraMais1', 'Armadura +1', RARIDADE.raro, '+1 de CA.', { acBonusArmadura: 1 }),
  armaduraMais2: armaduraMagica('armaduraMais2', 'Armadura +2', RARIDADE.muitoRaro, '+2 de CA.', { acBonusArmadura: 2 }),
  armaduraMais3: armaduraMagica('armaduraMais3', 'Armadura +3', RARIDADE.lendario, '+3 de CA.', { acBonusArmadura: 3 }),
  escudoMais1: armaduraMagica('escudoMais1', 'Escudo +1', RARIDADE.incomum, '+1 de CA além do +2 do escudo.', { peso: 6, acBonus: 1 }),
  escudoMais2: armaduraMagica('escudoMais2', 'Escudo +2', RARIDADE.raro, '+2 além do escudo.', { peso: 6, acBonus: 2 }),
  escudoMais3: armaduraMagica('escudoMais3', 'Escudo +3', RARIDADE.muitoRaro, '+3 além do escudo.', { peso: 6, acBonus: 3 }),
  armaduraAdamantina: armaduraMagica('armaduraAdamantina', 'Armadura adamantina', RARIDADE.incomum,
    'Todo acerto crítico contra você vira acerto normal.'),
  armaduraDeMithral: armaduraMagica('armaduraDeMithral', 'Armadura de mithral', RARIDADE.incomum,
    'Leve como couro: perde a desvantagem em Furtividade e a exigência de Força.'),
  armaduraDeResistencia: armaduraMagica('armaduraDeResistencia', 'Armadura de resistência', RARIDADE.raro,
    'Resistência a um tipo de dano, decidido na forja.', { sintonia: true }),
  armaduraDeInvulnerabilidade: armaduraMagica('armaduraDeInvulnerabilidade', 'Armadura da invulnerabilidade', RARIDADE.lendario,
    'Resistência a dano não mágico, e uma vez por dia dez minutos de imunidade.', { sintonia: true }),
  placasAnas: armaduraMagica('placasAnas', 'Placas anãs', RARIDADE.muitoRaro,
    '+2 de CA, e quem te empurrar perde 3 m do empurrão.', { acBonusArmadura: 2 }),
  malhaElfica: armaduraMagica('malhaElfica', 'Malha élfica', RARIDADE.raro,
    '+1 de CA, sem treino exigido e sem desvantagem em Furtividade.', { acBonusArmadura: 1, peso: 20 }),
  couroGlamourizado: armaduraMagica('couroGlamourizado', 'Couro batido glamourizado', RARIDADE.raro,
    '+1 de CA, e uma ação bônus faz a armadura parecer qualquer outra roupa.', { acBonusArmadura: 1, peso: 13 }),
  armaduraDeEscamasDeDragao: armaduraMagica('armaduraDeEscamasDeDragao', 'Brunea de escamas de dragão', RARIDADE.muitoRaro,
    '+1 de CA, resistência ao dano do dragão de origem, e sentir dragão uma vez por dia.', { sintonia: true, acBonusArmadura: 1 }),
  armaduraDeDemonio: armaduraMagica('armaduraDeDemonio', 'Armadura de demônio', RARIDADE.muitoRaro,
    '+1 de CA, garras de 1d8, e entender abissal. Tirá-la exige Remover Maldição.', { sintonia: true, acBonusArmadura: 1 }),
  placasDaEtereidade: armaduraMagica('placasDaEtereidade', 'Placas da etereidade', RARIDADE.lendario,
    '+1 de CA, e dez minutos de forma etérea por dia.', { sintonia: true, acBonusArmadura: 1 }),
  escudoAnimado: armaduraMagica('escudoAnimado', 'Escudo animado', RARIDADE.muitoRaro,
    'Ação bônus para soltá-lo: ele flutua e defende sozinho por um minuto, deixando as duas mãos livres.',
    { sintonia: true, peso: 6, acBonus: 2 }),
  escudoCaptador: armaduraMagica('escudoCaptador', 'Escudo captador de flechas', RARIDADE.raro,
    '+2 de CA contra ataques à distância, e a reação de aparar vale para aliado a 1,5 m.', { sintonia: true, peso: 6 }),
  escudoSentinela: armaduraMagica('escudoSentinela', 'Escudo sentinela', RARIDADE.incomum,
    'Vantagem em iniciativa e em Percepção.', { sintonia: true, peso: 6 }),
  escudoGuardaMagia: armaduraMagica('escudoGuardaMagia', 'Escudo guarda-magia', RARIDADE.muitoRaro,
    'Vantagem em resistências contra magia.', { sintonia: true, peso: 6 }),
  escudoAtraidor: armaduraMagica('escudoAtraidor', 'Escudo atraidor de projéteis', RARIDADE.raro,
    '+2 de CA, mas todo projétil a 3 m muda de alvo para você. Maldito.', { sintonia: true, peso: 6, acBonus: 2 }),
};

// -------------------------------------------------- anéis, varinhas, cajados ----
const anel = (id, name, raridade, desc, extra = {}) =>
  magico(id, name, raridade, desc, { tipo: 'anel', art: 'arcano', peso: 0, sintonia: true, ...extra });

export const RINGS = {
  anelDeProtecao: anel('anelDeProtecao', 'Anel de proteção', RARIDADE.raro, '+1 de CA e +1 em todas as resistências.', { acBonus: 1 }),
  anelDeQuedaSuave: anel('anelDeQuedaSuave', 'Anel de queda suave', RARIDADE.raro, 'Você cai 18 m por turno e nunca se machuca na queda.'),
  anelDeAcaoLivre: anel('anelDeAcaoLivre', 'Anel de ação livre', RARIDADE.raro, 'Terreno difícil não custa nada, e nada te prende nem te paralisa.'),
  anelDeInvisibilidade: anel('anelDeInvisibilidade', 'Anel de invisibilidade', RARIDADE.lendario, 'Uma ação para sumir, outra para voltar.'),
  anelDeSalto: anel('anelDeSalto', 'Anel de salto', RARIDADE.incomum, 'Saltar à vontade, como a magia.'),
  anelDeEscudoMental: anel('anelDeEscudoMental', 'Anel de escudo mental', RARIDADE.incomum, 'Ninguém lê sua mente nem descobre que você mentiu.'),
  anelDeRegeneracao: anel('anelDeRegeneracao', 'Anel de regeneração', RARIDADE.muitoRaro, '1d6 de vida a cada dez minutos, e membro perdido volta.'),
  anelDeResistencia: anel('anelDeResistencia', 'Anel de resistência', RARIDADE.raro, 'Resistência a um tipo de dano, decidido na forja.'),
  anelDeNatacao: anel('anelDeNatacao', 'Anel de natação', RARIDADE.incomum, 'Deslocamento de natação de 12 m.', { sintonia: false }),
  anelDeCalor: anel('anelDeCalor', 'Anel de calor', RARIDADE.incomum, 'Resistência a frio e conforto até −45 °C.'),
  anelDeAndarSobreAgua: anel('anelDeAndarSobreAgua', 'Anel de andar sobre a água', RARIDADE.incomum, 'A superfície vira chão.', { sintonia: false }),
  anelDeTelecinesia: anel('anelDeTelecinesia', 'Anel de telecinesia', RARIDADE.muitoRaro, 'Telecinesia à vontade.'),
  anelDeArmazenarMagia: anel('anelDeArmazenarMagia', 'Anel de armazenar magias', RARIDADE.raro, 'Guarda até cinco níveis de magia para outro conjurar.'),
  anelDeReflexao: anel('anelDeReflexao', 'Anel de reflexão de magia', RARIDADE.lendario, 'Devolve ao conjurador a magia de alvo único que falhar contra você.'),
  anelDoAriete: anel('anelDoAriete', 'Anel do aríete', RARIDADE.raro, 'Três cargas: 2d10 de força e empurra 4,5 m.'),
  anelDeEstrelasCadentes: anel('anelDeEstrelasCadentes', 'Anel de estrelas cadentes', RARIDADE.muitoRaro, 'Luz, relâmpago e esferas de fogo, à noite e ao ar livre.'),
  anelDeVisaoDeRaioX: anel('anelDeVisaoDeRaioX', 'Anel de visão de raio X', RARIDADE.raro, 'Enxerga através de 30 cm de madeira ou 2,5 cm de metal.'),
  anelDeTresDesejos: anel('anelDeTresDesejos', 'Anel de três desejos', RARIDADE.lendario, 'Três desejos, e depois é só um anel.', { sintonia: false }),
};

const varinha = (id, name, raridade, desc, extra = {}) =>
  magico(id, name, raridade, desc, { tipo: 'varinha', art: 'arcano', peso: 1, sintonia: true, ...extra });

export const WANDS = {
  varinhaDeMisseisMagicos: varinha('varinhaDeMisseisMagicos', 'Varinha de mísseis mágicos', RARIDADE.incomum,
    'Sete cargas. Uma carga por nível de Míssil Mágico.', { sintonia: false }),
  varinhaDeTeia: varinha('varinhaDeTeia', 'Varinha de teia', RARIDADE.incomum, 'Sete cargas de Teia, CD 15.'),
  varinhaDeBolaDeFogo: varinha('varinhaDeBolaDeFogo', 'Varinha de bola de fogo', RARIDADE.raro, 'Sete cargas de Bola de Fogo, CD 15.'),
  varinhaDeRaios: varinha('varinhaDeRaios', 'Varinha de relâmpagos', RARIDADE.raro, 'Sete cargas de Relâmpago, CD 15.'),
  varinhaDeParalisia: varinha('varinhaDeParalisia', 'Varinha de paralisia', RARIDADE.raro, 'Sete cargas: CD 15 de Constituição ou paralisado por um minuto.'),
  varinhaDeMedo: varinha('varinhaDeMedo', 'Varinha de medo', RARIDADE.raro, 'Sete cargas: ordem de fuga ou cone de pavor, CD 15.'),
  varinhaDeDeteccaoDeInimigos: varinha('varinhaDeDeteccaoDeInimigos', 'Varinha de detecção de inimigos', RARIDADE.raro, 'Sete cargas: um minuto sentindo quem quer te machucar a 18 m.'),
  varinhaDeAtadura: varinha('varinhaDeAtadura', 'Varinha de atadura', RARIDADE.raro, 'Sete cargas: escapa de agarrão ou prende extraplanar.'),
  varinhaDePolimorfia: varinha('varinhaDePolimorfia', 'Varinha de polimorfia', RARIDADE.muitoRaro, 'Sete cargas de Polimorfia, CD 15.'),
  varinhaDeSegredos: varinha('varinhaDeSegredos', 'Varinha de segredos', RARIDADE.incomum, 'Duas cargas: aponta porta e armadilha escondidas a 9 m.', { sintonia: false }),
  varinhaDoMagoDeGuerra: varinha('varinhaDoMagoDeGuerra', 'Varinha do mago de guerra', RARIDADE.incomum, '+1 em ataque de magia e na CD, e ignora meia cobertura.'),
  varinhaDasMaravilhas: varinha('varinhaDasMaravilhas', 'Varinha das maravilhas', RARIDADE.raro, 'Sete cargas, e uma tabela de efeitos que ninguém controla.'),
};

const cajado = (id, name, raridade, desc, extra = {}) =>
  magico(id, name, raridade, desc, { tipo: 'cajado', art: 'cajado', peso: 4, sintonia: true, ...extra });

export const STAVES = {
  cajadoDeCura: cajado('cajadoDeCura', 'Cajado de cura', RARIDADE.raro, 'Dez cargas: Curar Ferimentos, Restauração Menor e Revigorar em Massa.'),
  cajadoDeFogo: cajado('cajadoDeFogo', 'Cajado de fogo', RARIDADE.muitoRaro, 'Dez cargas: Mãos Flamejantes, Esfera Flamejante e Parede de Fogo. Resistência a fogo.'),
  cajadoDeGelo: cajado('cajadoDeGelo', 'Cajado de gelo', RARIDADE.muitoRaro, 'Dez cargas: Raio de Gelo, Névoa, Parede de Gelo e Tempestade de Granizo. Resistência a frio.'),
  cajadoDoGolpe: cajado('cajadoDoGolpe', 'Cajado do golpe', RARIDADE.muitoRaro, 'Arma +3. Dez cargas: até três a mais por golpe, 1d6 de força cada.', { bonusAtaque: 3, bonusDano: 3 }),
  cajadoDeEnxame: cajado('cajadoDeEnxame', 'Cajado de enxame de insetos', RARIDADE.raro, 'Dez cargas: Praga de Insetos e Nuvem de Mosquitos.'),
  cajadoDaSerpente: cajado('cajadoDaSerpente', 'Cajado da serpente', RARIDADE.incomum, 'Uma ação bônus e ele vira uma cobra venenosa que luta por você.'),
  cajadoDoEncanto: cajado('cajadoDoEncanto', 'Cajado do encanto', RARIDADE.raro, 'Dez cargas: Enfeitiçar Pessoa, Comando e Sugestão, CD 17.'),
  cajadoDeMurchar: cajado('cajadoDeMurchar', 'Cajado de murchar', RARIDADE.raro, 'Três cargas: +2d10 de necrótico, com desvantagem em Força e Constituição.'),
  cajadoDoCantoDosPassaros: cajado('cajadoDoCantoDosPassaros', 'Cajado do canto dos pássaros', RARIDADE.comum, 'Dez cargas: imita qualquer canto de ave.', { sintonia: false }),
  cajadoDasFlores: cajado('cajadoDasFlores', 'Cajado das flores', RARIDADE.comum, 'Dez cargas: faz brotar flores na terra.', { sintonia: false }),
  cajadoDoTrovaoERaio: cajado('cajadoDoTrovaoERaio', 'Cajado do trovão e do raio', RARIDADE.muitoRaro, 'Arma +2, e cinco poderes de trovão e relâmpago, um por dia cada.', { bonusAtaque: 2, bonusDano: 2 }),
  cajadoDasFlorestas: cajado('cajadoDasFlorestas', 'Cajado das florestas', RARIDADE.raro, 'Arma +2. Dez cargas de magias de mata, e vira uma árvore.', { bonusAtaque: 2, bonusDano: 2 }),
  cajadoDoPoder: cajado('cajadoDoPoder', 'Cajado do poder', RARIDADE.muitoRaro, 'Arma +2, +1 de CA e de resistências, e vinte cargas de magia de ataque.', { bonusAtaque: 2, bonusDano: 2, acBonus: 1 }),
  cajadoDoMagi: cajado('cajadoDoMagi', 'Cajado do magi', RARIDADE.lendario, 'Arma +2, absorve magia, e cinquenta cargas de quase tudo.', { bonusAtaque: 2, bonusDano: 2 }),
};

const cetro = (id, name, raridade, desc, extra = {}) =>
  magico(id, name, raridade, desc, { tipo: 'cetro', art: 'arcano', peso: 2, sintonia: true, ...extra });

export const RODS = {
  cetroDeAbsorcao: cetro('cetroDeAbsorcao', 'Cetro de absorção', RARIDADE.muitoRaro, 'Engole a magia de alvo único lançada em você e devolve como espaço de magia.'),
  cetroDeAlerta: cetro('cetroDeAlerta', 'Cetro de alerta', RARIDADE.raro, '+1 em iniciativa e Percepção, e uma aura que protege os aliados.'),
  cetroDoGuardiaoDoPacto: cetro('cetroDoGuardiaoDoPacto', 'Cetro do guardião do pacto', RARIDADE.incomum, '+1 a +3 na CD e no ataque de magia, e recupera um espaço por descanso longo.'),
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
  manoplasDeForcaDeOgro: maravilhoso('manoplasDeForcaDeOgro', 'Manoplas de força de ogro', RARIDADE.incomum, 'Sua Força vira 19, se já não for maior.', { sintonia: true, peso: 2 }),
  faixaDeIntelecto: maravilhoso('faixaDeIntelecto', 'Faixa de intelecto', RARIDADE.incomum, 'Sua Inteligência vira 19, se já não for maior.', { sintonia: true, peso: 0 }),
  mantoDeProtecao: maravilhoso('mantoDeProtecao', 'Manto de proteção', RARIDADE.incomum, '+1 de CA e +1 em resistências.', { sintonia: true, acBonus: 1, peso: 1 }),
  mantoElfico: maravilhoso('mantoElfico', 'Manto élfico', RARIDADE.incomum, 'Vantagem em Furtividade, e quem procura você tem desvantagem.', { sintonia: true, peso: 1 }),
  mantoDeDeslocamento: maravilhoso('mantoDeDeslocamento', 'Manto de deslocamento', RARIDADE.raro, 'Uma imagem sua desloca o alvo: quem te ataca tem desvantagem.', { sintonia: true, peso: 1 }),
  mantoDoMorcego: maravilhoso('mantoDoMorcego', 'Manto do morcego', RARIDADE.raro, 'Vantagem em Furtividade, e no escuro você voa.', { sintonia: true, peso: 1 }),
  mantoDaArraia: maravilhoso('mantoDaArraia', 'Manto da arraia', RARIDADE.incomum, 'Respira e nada debaixo da água.', { peso: 1 }),
  capaDoCharlatao: maravilhoso('capaDoCharlatao', 'Capa do charlatão', RARIDADE.raro, 'Uma vez por dia, uma ação bônus que te teleporta 360 m.', { sintonia: true, peso: 1 }),
  botasElficas: maravilhoso('botasElficas', 'Botas élficas', RARIDADE.incomum, 'Seus passos não fazem barulho nenhum.', { sintonia: true, peso: 1 }),
  botasDeLevitacao: maravilhoso('botasDeLevitacao', 'Botas de levitação', RARIDADE.raro, 'Levitar à vontade.', { sintonia: true, peso: 1 }),
  botasDeVelocidade: maravilhoso('botasDeVelocidade', 'Botas de velocidade', RARIDADE.raro, 'Ação bônus: deslocamento dobrado e ataques de oportunidade com desvantagem.', { sintonia: true, peso: 1 }),
  botasDeMarchaESalto: maravilhoso('botasDeMarchaESalto', 'Botas de marcha e salto', RARIDADE.incomum, 'Deslocamento 9 m e saltos triplicados.', { sintonia: true, peso: 1 }),
  botasAladas: maravilhoso('botasAladas', 'Botas aladas', RARIDADE.incomum, 'Quatro horas de voo por dia, na sua velocidade de caminhada.', { sintonia: true, peso: 1 }),
  asasDeVoo: maravilhoso('asasDeVoo', 'Asas de voo', RARIDADE.raro, 'Uma hora e meia de voo a 18 m por turno, uma vez por descanso.', { sintonia: true, peso: 2 }),
  chinelosDeEscalarParedes: maravilhoso('chinelosDeEscalarParedes', 'Chinelos de escalar paredes', RARIDADE.raro, 'Anda em parede e teto como no chão.', { sintonia: true, peso: 1 }),
  braceletesDeArqueiro: maravilhoso('braceletesDeArqueiro', 'Braceletes de arqueiro', RARIDADE.incomum, 'Proficiência com arcos e +2 de dano com eles.', { sintonia: true, peso: 1 }),
  braceletesDeDefesa: maravilhoso('braceletesDeDefesa', 'Braceletes de defesa', RARIDADE.raro, '+2 de CA, se você estiver sem armadura e sem escudo.', { sintonia: true, acBonus: 2, peso: 1 }),
  brocheDeEscudo: maravilhoso('brocheDeEscudo', 'Broche de escudo', RARIDADE.incomum, 'Resistência a dano de força, e imune a Míssil Mágico.', { sintonia: true, peso: 0 }),
  luvasDeAgarrarProjetis: maravilhoso('luvasDeAgarrarProjetis', 'Luvas de agarrar projéteis', RARIDADE.incomum, 'Reação para reduzir o dano de um tiro em 1d10 + Destreza — e às vezes devolvê-lo.', { sintonia: true, peso: 0 }),
  luvasDeNadarEEscalar: maravilhoso('luvasDeNadarEEscalar', 'Luvas de nadar e escalar', RARIDADE.incomum, 'Nadar e escalar sem custo extra, e vantagem em Atletismo para isso.', { sintonia: true, peso: 0 }),
  luvasDeLadrao: maravilhoso('luvasDeLadrao', 'Luvas de ladrão', RARIDADE.incomum, '+5 em Prestidigitação.', { sintonia: true, peso: 0 }),
  oculosDeNoite: maravilhoso('oculosDeNoite', 'Óculos de visão noturna', RARIDADE.incomum, 'Visão no escuro de 18 m.', { peso: 0 }),
  olhosDaAguia: maravilhoso('olhosDaAguia', 'Olhos da águia', RARIDADE.incomum, 'Vantagem em Percepção visual; a 1,6 km você distingue um rosto.', { sintonia: true, peso: 0 }),
  olhosDeVisaoMinuciosa: maravilhoso('olhosDeVisaoMinuciosa', 'Olhos de visão minuciosa', RARIDADE.incomum, 'Visão no escuro de 36 m, se já tiver alguma.', { peso: 0 }),
  olhosDoEncanto: maravilhoso('olhosDoEncanto', 'Olhos do encanto', RARIDADE.incomum, 'Três cargas: Enfeitiçar Pessoa só com o olhar, CD 13.', { sintonia: true, peso: 0 }),
  chapeuDeDisfarce: maravilhoso('chapeuDeDisfarce', 'Chapéu de disfarce', RARIDADE.incomum, 'Disfarçar-se à vontade.', { sintonia: true, peso: 0 }),
  elmoDeTelepatia: maravilhoso('elmoDeTelepatia', 'Elmo de telepatia', RARIDADE.incomum, 'Detectar pensamentos e falar pela mente.', { sintonia: true, peso: 3 }),
  elmoDeCompreenderIdiomas: maravilhoso('elmoDeCompreenderIdiomas', 'Elmo de compreender idiomas', RARIDADE.comum, 'Compreender Idiomas à vontade.', { peso: 3 }),
  elmoDeBrilho: maravilhoso('elmoDeBrilho', 'Elmo do fulgor', RARIDADE.muitoRaro, 'Luz do Dia, Chama Sagrada, Raio de Fogo e Fogo Divino, com cargas.', { sintonia: true, peso: 3 }),
  medalhaoDosPensamentos: maravilhoso('medalhaoDosPensamentos', 'Medalhão dos pensamentos', RARIDADE.incomum, 'Três cargas de Detectar Pensamentos, CD 13.', { sintonia: true, peso: 0 }),
  amuletoDeAdaptacao: maravilhoso('amuletoDeAdaptacao', 'Amuleto de adaptação', RARIDADE.incomum, 'Você respira em qualquer lugar, inclusive debaixo da água.', { sintonia: true, peso: 0 }),
  amuletoDeSaude: maravilhoso('amuletoDeSaude', 'Amuleto de saúde', RARIDADE.raro, 'Sua Constituição vira 19, se já não for maior.', { sintonia: true, peso: 0 }),
  amuletoContraVeneno: maravilhoso('amuletoContraVeneno', 'Amuleto contra veneno', RARIDADE.incomum, 'Imune a veneno e à condição envenenado.', { sintonia: true, peso: 0 }),
  amuletoDeFecharFeridas: maravilhoso('amuletoDeFecharFeridas', 'Amuleto de fechar feridas', RARIDADE.incomum, 'Dobra o que você cura com dado de vida, e estabiliza sozinho.', { sintonia: true, peso: 0 }),
  colarDeBolasDeFogo: maravilhoso('colarDeBolasDeFogo', 'Colar de bolas de fogo', RARIDADE.raro, 'Contas que se arrancam e se arremessam, de 2d6 a 7d6.', { peso: 0 }),
  colarDeContasDeOracao: maravilhoso('colarDeContasDeOracao', 'Colar de contas de oração', RARIDADE.raro, 'Contas que guardam Bênção, Curar Ferimentos, Favor Divino e outras.', { sintonia: true, peso: 0 }),
  perolaDoPoder: maravilhoso('perolaDoPoder', 'Pérola do poder', RARIDADE.incomum, 'Uma ação bônus por dia recupera um espaço de até 3º círculo.', { sintonia: true, peso: 0 }),
  pedraDaBoaSorte: maravilhoso('pedraDaBoaSorte', 'Pedra da boa sorte', RARIDADE.incomum, '+1 em testes de perícia e em resistências.', { sintonia: true, peso: 0 }),
  escaravelhoDeProtecao: maravilhoso('escaravelhoDeProtecao', 'Escaravelho de proteção', RARIDADE.lendario, 'Vantagem contra magia, e doze cargas que anulam dano necrótico.', { sintonia: true, peso: 0 }),
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
  mantoDeOlhos: maravilhoso('mantoDeOlhos', 'Manto de olhos', RARIDADE.raro, 'Visão em todas as direções, no escuro e no invisível. Luz forte cega você.', { sintonia: true, peso: 1 }),
  mantoDasEstrelas: maravilhoso('mantoDasEstrelas', 'Manto das estrelas', RARIDADE.muitoRaro, '+1 em resistências, viagem ao Astral, e seis estrelas que viram Míssil Mágico.', { sintonia: true, peso: 1 }),
  mantoDeCoresCintilantes: maravilhoso('mantoDeCoresCintilantes', 'Manto de cores cintilantes', RARIDADE.raro, 'Uma vez por dia: todos a 9 m ficam atordoados e cegos, CD 15.', { sintonia: true, peso: 1 }),
  mantoDoArquimago: maravilhoso('mantoDoArquimago', 'Manto do arquimago', RARIDADE.lendario, 'CA 15 + Destreza sem armadura, vantagem contra magia, e +2 na CD e no ataque.', { sintonia: true, peso: 1 }),
  mantoDeItensUteis: maravilhoso('mantoDeItensUteis', 'Manto de itens úteis', RARIDADE.incomum, 'Remendos que se arrancam e viram escada, barco, janela, mastim ou fosso.', { peso: 1 }),
  pedraDeControlarElemental: maravilhoso('pedraDeControlarElemental', 'Pedra de controlar elemental da terra', RARIDADE.incomum, 'Convoca um elemental da terra por uma hora.', { peso: 5 }),
  bracadeirasDeBilarro: maravilhoso('bracadeirasDeBilarro', 'Braçadeiras de Bilarro', RARIDADE.raro, 'Esfera arremessada que prende uma criatura Enorme ou menor, CD 20.', { peso: 1 }),
  fichaDePenaDeQuaal: maravilhoso('fichaDePenaDeQuaal', 'Ficha de pena', RARIDADE.raro, 'Uma pena que vira âncora, árvore, barco, pássaro, chicote ou baú.', { peso: 0 }),
  aljavaDeEhlonna: maravilhoso('aljavaDeEhlonna', 'Aljava de Ehlonna', RARIDADE.incomum, 'Três compartimentos que guardam sessenta flechas e seis arcos sem pesar nada.', { peso: 2, art: 'arco' }),
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
