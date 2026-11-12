// AS RAÇAS DOS OUTROS LIVROS: o Guia de Volo, o Tomo de Mordenkainen, o Guia da Costa da Espada, o Tesouro dos Dragões
// de Fizban, o Caldeirão de Tasha e o Acquisitions Incorporated (o plano em `revisoes/racas-plano-2026-11-12.md`).
//
// Mesmo formato de `racas.js`, que soma estas às do Livro do Jogador: cada raça é dado, cada traço tem nome, tipo e
// texto, e `motor: true` quer dizer que o motor faz (`rules/racas-motor.js` mora o que é só destas). `semEfeito` diz o
// que o jogo não tem como modelar, e por quê. Os números seguem os livros; os textos são nossos.
//
// Campos novos, que `racas.js aplicarRaca` lê:
//   nado, escalada, voo      deslocamentos em pés (`speeds.swimFt`, `speeds.climbFt`, `flyFt`)
//   imunidades               tipos de dano (`immune`); `imuneCondicao`, condições (`conditionImmunities`)
//   vantagens                [{ nome, condicoes?, magia?, salvas? }]: vantagem na resistência (`passivas.js vantagemPorTraco`)
//   armaduraNatural          a base da CA sem armadura (13 + Destreza, aceita escudo)
//   armasNaturais            ids de `items/weapons.js` que entram na mão do herói
//   respiraNaAgua            não se afoga
//   recursos                 [{ id, usos: n | 'prof', curto? }]: os usos de cada traço (volta no curto, ou só no longo)
//   escolhaDeTraco           [ids]: o criador pergunta UM deles (a estação do eladrin, a descendência do meio-elfo)
//   livres                   { mais2?, atributos?, pericias?, de? }: o que o criador deixa escolher (`criador.js`)
//   ancestralidades          a tabela de dragão da raça (o draconato do Fizban)
//   magiasRaciais            como no PHB; `curto: true` volta no descanso curto, `circulo` sobe o círculo
//   livro                    a sigla do livro, para o criador agrupar

const T = (nome, tipo, desc, extra = {}) => ({ nome, tipo, desc, fonte: 'racial', ...extra });
const SEM_IDIOMA = 'o jogo não modela idiomas';
const SEM_CARGA = 'o jogo não conta carga';

export const TRACOS_DOS_LIVROS = {
  // ---- aasimar (Volo) ----------------------------------------------------
  celestialResistance: T('Resistência Celestial', 'passiva', 'Resistência a dano necrótico e radiante.', { motor: true }),
  healingHands: T('Mãos Curativas', 'acao',
    'Ação: toca uma criatura e ela recupera PV iguais ao seu nível. Uma vez por descanso longo.', { motor: true }),
  lightBearer: T('Portador da Luz', 'passiva', 'Conhece o truque Luz, com Carisma.', { motor: true }),
  radiantSoulAasimar: T('Alma Radiante', 'acao',
    'A partir do 3º nível, ação: por 1 minuto, asas de luz dão 9 m de voo, e uma vez em cada turno um acerto de ataque soma dano radiante igual ao seu nível. Uma vez por descanso longo.',
    { motor: true }),
  radiantConsumption: T('Consumo Radiante', 'acao',
    'A partir do 3º nível, ação: por 1 minuto, irradia luz que queima. No fim de cada turno seu, você e cada criatura a até 3 m sofrem dano radiante igual à metade do seu nível, e uma vez em cada turno um acerto de ataque soma dano radiante igual ao seu nível. Uma vez por descanso longo.',
    { motor: true }),
  necroticShroud: T('Mortalha Necrótica', 'acao',
    'A partir do 3º nível, ação: por 1 minuto, asas de sombra se abrem; cada criatura a até 3 m faz resistência de Carisma (CD 8 + proficiência + CAR) ou fica amedrontada até o fim do seu próximo turno, e uma vez em cada turno um acerto de ataque soma dano necrótico igual ao seu nível. Uma vez por descanso longo.',
    { motor: true }),

  // ---- goblinoides (Volo) ------------------------------------------------
  longLimbed: T('Braços Longos', 'passiva', 'No seu turno, o ataque corpo a corpo alcança 1,5 m a mais.', { motor: true }),
  powerfulBuild: T('Constituição Poderosa', 'fora', 'Conta como um tamanho maior para carregar, empurrar e erguer peso.', { semEfeito: SEM_CARGA }),
  sneaky: T('Sorrateiro', 'passiva', 'Treinado em Furtividade.', { motor: true }),
  surpriseAttack: T('Ataque Surpresa', 'passiva',
    'No primeiro turno da luta, o acerto contra uma criatura surpresa soma 2d6 de dano. Uma vez por luta.', { motor: true }),
  furyOfTheSmall: T('Fúria dos Pequenos', 'passiva',
    'Quando acerta uma criatura de tamanho maior que o seu, soma dano igual ao seu nível. Uma vez por descanso curto ou longo. No jogo é automática: vale no primeiro acerto em criatura maior que o golpe sozinho não derrubaria.',
    { motor: true }),
  nimbleEscapeRacial: T('Fuga Ágil', 'passiva', 'Desengajar ou Esconder-se como ação bônus, em cada turno seu.', { motor: true }),
  martialTraining: T('Treino Marcial', 'passiva',
    'Treinado com armadura leve e com duas armas marciais. O livro deixa escolher as duas; no jogo são a espada longa e o arco longo.',
    { motor: true }),
  savingFace: T('Salvar as Aparências', 'passiva',
    'Quando erra um ataque ou falha num teste ou numa resistência, soma +1 por aliado que vê a até 9 m (até +5). Uma vez por descanso curto ou longo. No jogo é automática: só vale quando o bônus vira o fracasso em sucesso.',
    { motor: true }),

  // ---- firbolg (Volo) ----------------------------------------------------
  firbolgMagic: T('Magia Firbolg', 'passiva',
    'Conjura Detectar Magia e Disfarçar-se uma vez cada por descanso curto ou longo, com Sabedoria.', { motor: true }),
  hiddenStep: T('Passo Oculto', 'acao',
    'Ação bônus: fica invisível até o começo do seu próximo turno, ou até atacar, causar dano ou forçar alguém a uma resistência. Uma vez por descanso curto ou longo.',
    { motor: true }),
  speechOfBeastAndLeaf: T('Fala de Fera e Folha', 'fora', 'Animais e plantas entendem o sentido do que diz, e tem vantagem para influenciá-los.',
    { semEfeito: 'o jogo não tem conversa com animais nem plantas' }),

  // ---- golias (Volo) -----------------------------------------------------
  naturalAthlete: T('Atleta Natural', 'passiva', 'Treinado em Atletismo.', { motor: true }),
  stonesEndurance: T('Resistência da Pedra', 'reacao',
    'Reação ao sofrer dano: rola 1d12 + CON e tira isso do dano. Uma vez por descanso curto ou longo. No jogo é automática, no primeiro golpe que tira pelo menos um quarto dos PV máximos.',
    { motor: true }),
  mountainBorn: T('Nascido na Montanha', 'passiva', 'Resistência a dano de frio; acostumado ao ar rarefeito das alturas.', { motor: true }),

  // ---- kenku (Volo) ------------------------------------------------------
  expertForgery: T('Falsificador Exímio', 'fora', 'Vantagem para copiar letra e obra de outra pessoa.', { semEfeito: 'o jogo não tem falsificação' }),
  kenkuTraining: T('Treino Kenku', 'passiva', 'Treinado em duas perícias à escolha entre Acrobacia, Enganação, Furtividade e Prestidigitação.', { motor: true }),
  mimicry: T('Imitação', 'fora', 'Imita qualquer som ou voz que já ouviu.', { semEfeito: 'o jogo não tem imitação de voz' }),

  // ---- kobold (Volo) -----------------------------------------------------
  grovelCowerAndBeg: T('Rastejar, Encolher e Implorar', 'acao',
    'Ação: encolhe-se e implora, e até o fim do seu próximo turno os aliados têm vantagem nos ataques contra inimigos a até 3 m de você que o vejam. Uma vez por descanso curto ou longo.',
    { motor: true }),
  packTacticsRacial: T('Táticas de Matilha', 'passiva', 'Vantagem no ataque contra uma criatura com um aliado seu a 1,5 m dela, de pé e consciente.', { motor: true }),

  // ---- povo-lagarto (Volo) -----------------------------------------------
  bite: T('Mordida', 'passiva', 'A mordida é uma arma natural: 1d6 + FOR de dano perfurante.', { motor: true }),
  cunningArtisan: T('Artesão Astuto', 'fora', 'Depois de um descanso curto, faz um escudo, uma clava ou dardos com osso e couro de uma fera morta.',
    { semEfeito: 'o jogo não tem ofício de descanso' }),
  holdBreath: T('Prender a Respiração', 'passiva', 'Fica até 15 minutos sem respirar: nenhuma luta debaixo d\'água chega a tanto.', { motor: true }),
  huntersLore: T('Saber do Caçador', 'passiva', 'Treinado em duas perícias à escolha entre Lidar com Animais, Natureza, Percepção, Furtividade e Sobrevivência.', { motor: true }),
  naturalArmor: T('Armadura Natural', 'passiva', 'Sem armadura, a CA é 13 + DES. Escudo soma.', { motor: true }),
  hungryJaws: T('Mandíbulas Famintas', 'acao',
    'Ação bônus: uma mordida; se acertar, ganha PV temporários iguais ao modificador de CON (mínimo 1). Uma vez por descanso curto ou longo.', { motor: true }),

  // ---- orc (Volo) --------------------------------------------------------
  aggressive: T('Agressivo', 'acao', 'Ação bônus: anda até o seu deslocamento em direção a um inimigo que vê.', { motor: true }),

  // ---- tabaxi (Volo) -----------------------------------------------------
  felineAgility: T('Agilidade Felina', 'acao',
    'No seu turno, dobra o deslocamento até o fim do turno. Para usar de novo, precisa passar um turno inteiro sem andar.', { motor: true }),
  catsClaws: T('Garras de Gato', 'passiva', 'Escalada de 6 m, e as garras são arma natural: 1d4 + FOR de dano cortante.', { motor: true }),
  catsTalent: T('Talento Felino', 'passiva', 'Treinado em Percepção e Furtividade.', { motor: true }),

  // ---- tritão (Volo) -----------------------------------------------------
  amphibious: T('Anfíbio', 'passiva', 'Respira ar e água.', { motor: true }),
  controlAirAndWater: T('Controle do Ar e da Água', 'passiva',
    'Conjura Névoa Obscurecente; no 3º nível, Lufada de Vento; no 5º, Muralha de Água. Uma vez cada por descanso longo, com Carisma.', { motor: true }),
  emissaryOfTheSea: T('Emissário do Mar', 'fora', 'Troca ideias simples com feras que respiram água.', { semEfeito: 'o jogo não tem conversa com animais' }),
  guardiansOfTheDepths: T('Guardião das Profundezas', 'passiva', 'Resistência a dano de frio, acostumado ao fundo do mar.', { motor: true }),

  // ---- yuan-ti (Volo) ----------------------------------------------------
  yuantiSpellcasting: T('Conjuração Inata', 'passiva',
    'Conhece Borrifo Venenoso. No 3º nível conjura Sugestão uma vez por descanso longo, com Carisma. (A Amizade Animal à vontade, só com cobras, fica de fora: não há cobra amiga no jogo.)',
    { motor: true }),
  magicResistanceRacial: T('Resistência a Magia', 'passiva', 'Vantagem nas resistências contra magias e outros efeitos mágicos.', { motor: true }),
  poisonImmunity: T('Imunidade a Veneno', 'passiva', 'Imune a dano de veneno e à condição envenenado.', { motor: true }),

  // ---- gith (Mordenkainen) -----------------------------------------------
  decadentMastery: T('Maestria Decadente', 'passiva', 'Treinado numa perícia à escolha, e fala um idioma a mais.', { motor: true }),
  martialProdigy: T('Prodígio Marcial', 'passiva', 'Treinado com armadura leve e média, espada curta, espada longa e espada grande.', { motor: true }),
  githyankiPsionics: T('Psiônica Githyanki', 'passiva',
    'Conhece Mão Mágica. No 3º nível conjura Salto e no 5º, Passo Nebuloso, uma vez cada por descanso longo, com Inteligência.', { motor: true }),
  mentalDiscipline: T('Disciplina Mental', 'passiva', 'Vantagem nas resistências contra ficar enfeitiçado ou amedrontado.', { motor: true }),
  githzeraiPsionics: T('Psiônica Githzerai', 'passiva',
    'Conhece Mão Mágica. No 3º nível conjura Escudo Arcano e no 5º, Detectar Pensamentos, uma vez cada por descanso longo, com Sabedoria.', { motor: true }),

  // ---- duergar (Mordenkainen) --------------------------------------------
  duergarResilience: T('Resiliência Duergar', 'passiva',
    'Vantagem nas resistências contra ficar enfeitiçado ou paralisado. (O livro dá também contra ilusão; o jogo não marca a escola da magia na resistência.)', { motor: true }),
  duergarMagic: T('Magia Duergar', 'passiva',
    'No 3º nível conjura Aumentar/Reduzir em si mesmo, e no 5º, Invisibilidade em si mesmo, uma vez cada por descanso longo, com Inteligência.', { motor: true }),

  // ---- eladrin, elfo do mar, shadar-kai (Mordenkainen) -------------------
  feyStep: T('Passo Feérico', 'acao',
    'Ação bônus: teleporta-se até 9 m para uma casa livre que vê. Uma vez por descanso curto ou longo. A partir do 3º nível o passo leva o efeito da estação.',
    { motor: true }),
  estacaoOutono: T('Estação: Outono', 'passiva',
    'Do 3º nível, logo depois do Passo Feérico, até duas criaturas a até 3 m de você fazem resistência de Sabedoria (CD 8 + proficiência + CAR) ou ficam enfeitiçadas por 1 minuto, ou até sofrerem dano.', { motor: true }),
  estacaoInverno: T('Estação: Inverno', 'passiva',
    'Do 3º nível, ao usar o Passo Feérico, uma criatura a até 1,5 m de você faz resistência de Sabedoria (CD 8 + proficiência + CAR) ou fica amedrontada até o fim do seu próximo turno.', { motor: true }),
  estacaoVerao: T('Estação: Verão', 'passiva',
    'Do 3º nível, logo depois do Passo Feérico, cada criatura a até 1,5 m de onde você chega sofre dano de fogo igual ao seu modificador de CAR (mínimo 1).', { motor: true }),
  childOfTheSea: T('Filho do Mar', 'passiva', 'Nado de 9 m, e respira ar e água.', { motor: true }),
  friendOfTheSea: T('Amigo do Mar', 'fora', 'Troca ideias simples com feras que nadam.', { semEfeito: 'o jogo não tem conversa com animais' }),
  seaElfTraining: T('Treino do Elfo do Mar', 'passiva', 'Treinado com lança, tridente, besta leve e rede.', { motor: true }),
  necroticResistance: T('Resistência Necrótica', 'passiva', 'Resistência a dano necrótico.', { motor: true }),
  blessingOfTheRavenQueen: T('Bênção da Rainha Corvo', 'acao',
    'Ação bônus: teleporta-se até 4,5 m para uma casa livre que vê. A partir do 3º nível, ganha resistência a todo dano até o começo do seu próximo turno. Uma vez por descanso longo.',
    { motor: true }),

  // ---- gnomo das profundezas (Mordenkainen, Costa da Espada) -------------
  stoneCamouflage: T('Camuflagem Rochosa', 'fora', 'Vantagem em Furtividade para se esconder em terreno de pedra.',
    { semEfeito: 'o jogo não tem a ação de se esconder em luta' }),

  // ---- os tiferinos dos senhores do Inferno (Mordenkainen) e as variantes da Costa da Espada
  legacyOfMaladomini: T('Legado de Maladomini', 'passiva', 'Conhece Taumaturgia. No 3º nível conjura Raio de Doença (como de 2º círculo) e no 5º, Coroa da Loucura, uma vez cada por descanso longo, com Carisma.', { motor: true }),
  legacyOfDis: T('Legado de Dis', 'passiva', 'Conhece Taumaturgia. No 3º nível conjura Disfarçar-se e no 5º, Detectar Pensamentos, uma vez cada por descanso longo, com Carisma.', { motor: true }),
  legacyOfPhlegethos: T('Legado de Flegetos', 'passiva', 'Conhece Amizade. No 3º nível conjura Enfeitiçar Pessoa (como de 2º círculo) e no 5º, Sugestão, uma vez cada por descanso longo, com Carisma.', { motor: true }),
  legacyOfMalbolge: T('Legado de Malbolge', 'passiva', 'Conhece Ilusão Menor. No 3º nível conjura Disfarçar-se e no 5º, Invisibilidade, uma vez cada por descanso longo, com Carisma.', { motor: true }),
  legacyOfStygia: T('Legado da Estígia', 'passiva', 'Conhece Raio de Gelo. No 3º nível conjura Armadura de Agathys (como de 2º círculo) e no 5º, Escuridão, uma vez cada por descanso longo, com Carisma.', { motor: true }),
  legacyOfMinauros: T('Legado de Minauros', 'passiva', 'Conhece Mão Mágica. No 3º nível conjura Disco Flutuante uma vez por descanso longo, com Carisma. (A Tranca Arcana do 5º nível fica de fora: o jogo não tem a magia.)', { motor: true }),
  legacyOfCania: T('Legado de Cânia', 'passiva', 'Conhece Mão Mágica. No 3º nível conjura Mãos Flamejantes (como de 2º círculo) e no 5º, Lâmina Flamejante, uma vez cada por descanso longo, com Carisma.', { motor: true }),
  legacyOfAvernus: T('Legado de Avernus', 'passiva', 'Conhece Taumaturgia. No 3º nível conjura Golpe Abrasador (como de 2º círculo) e no 5º, Golpe Marcante, uma vez cada por descanso longo, com Carisma.', { motor: true }),
  devilsTongue: T('Língua do Diabo', 'passiva', 'Conhece Zombaria Viciosa. No 3º nível conjura Enfeitiçar Pessoa (como de 2º círculo) e no 5º, Cativar, uma vez cada por descanso longo, com Carisma.', { motor: true }),
  hellfire: T('Fogo Infernal', 'passiva', 'Conhece Taumaturgia. No 3º nível conjura Mãos Flamejantes (como de 2º círculo) e no 5º, Escuridão, uma vez cada por descanso longo, com Carisma.', { motor: true }),
  winged: T('Alado', 'passiva', 'Asas de morcego dão 9 m de voo. (No lugar do Legado Infernal.)', { motor: true }),

  // ---- meio-elfo e halfling (Costa da Espada) ----------------------------
  silentSpeech: T('Fala Silenciosa', 'fora', 'Fala por telepatia com uma criatura a até 9 m que entenda um idioma.', { semEfeito: 'o jogo não modela idiomas nem telepatia' }),
  swimHalfElf: T('Nadador', 'passiva', 'Nado de 9 m (descendência de elfo aquático, no lugar da Versatilidade em Perícias).', { motor: true }),

  // ---- o draconato do Fizban ---------------------------------------------
  ancestralidadeCromatica: T('Ancestralidade Cromática', 'passiva', 'O dragão cromático de que descende define o tipo de dano do sopro, da resistência e da proteção.', { motor: true }),
  ancestralidadeMetalica: T('Ancestralidade Metálica', 'passiva', 'O dragão metálico de que descende define o tipo de dano do sopro e da resistência.', { motor: true }),
  ancestralidadeGema: T('Ancestralidade de Gema', 'passiva', 'O dragão de gema de que descende define o tipo de dano do sopro e da resistência.', { motor: true }),
  soproDoFizban: T('Arma de Sopro', 'acao',
    'Na ação de Atacar, troca um dos ataques por um sopro (o cromático numa linha de 9 m por 1,5 m; o metálico e o de gema num cone de 4,5 m). Resistência de DES (CD 8 + CON + proficiência): 1d10 do tipo da ancestralidade, metade se passar; 2d10 no 5º nível, 3d10 no 11º, 4d10 no 17º. Usos iguais ao bônus de proficiência por descanso longo.',
    { motor: true }),
  resistenciaDoFizban: T('Resistência Dracônica', 'passiva', 'Resistência ao tipo de dano da ancestralidade.', { motor: true }),
  chromaticWarding: T('Proteção Cromática', 'acao', 'A partir do 5º nível, ação: por 1 minuto, imune ao tipo de dano da ancestralidade. Uma vez por descanso longo.', { motor: true }),
  metallicBreath: T('Sopro Metálico', 'acao',
    'A partir do 5º nível, um segundo sopro, no lugar de um ataque, num cone de 4,5 m: o Enervante (CON ou incapacitado até o começo do seu próximo turno) ou o de Repulsão (FOR ou empurrado 6 m e caído). Uma vez por descanso longo.',
    { motor: true }),
  psionicMind: T('Mente Psiônica', 'fora', 'Manda mensagens telepáticas a quem vê a até 9 m.', { semEfeito: 'o jogo não modela telepatia' }),
  gemFlight: T('Voo de Gema', 'acao', 'A partir do 5º nível, ação bônus: asas espectrais dão voo igual ao deslocamento por 1 minuto. Uma vez por descanso longo.', { motor: true }),

  // ---- verdan (Acquisitions Incorporated) --------------------------------
  blackBloodHealing: T('Cura do Sangue Negro', 'passiva', 'No descanso curto, o 1 ou o 2 num dado de vida rola de novo, e vale o novo.', { motor: true }),
  limitedTelepathy: T('Telepatia Limitada', 'fora', 'Manda pensamentos simples a quem vê a até 9 m.', { semEfeito: 'o jogo não modela telepatia' }),
  persuasive: T('Persuasivo', 'passiva', 'Treinado em Persuasão.', { motor: true }),
  telepathicInsight: T('Intuição Telepática', 'passiva', 'Vantagem nas resistências de Sabedoria e de Carisma.', { motor: true }),

  // ---- linhagem personalizada (Tasha) ------------------------------------
  linhagemTalento: T('Talento', 'passiva', 'Um talento do Livro do Jogador à escolha no 1º nível, além do de origem.', { motor: true }),
  linhagemPericia: T('Perícia da Linhagem', 'passiva', 'Treinado numa perícia à escolha (no lugar da visão no escuro).', { motor: true }),
};

/** As tabelas de ancestralidade do Fizban: o dano de cada dragão. A forma do sopro é da raça. */
export const ANCESTRALIDADES_DO_FIZBAN = {
  draconatoCromatico: { negro: 'ácido', azul: 'elétrico', verde: 'veneno', vermelho: 'fogo', branco: 'frio' },
  draconatoMetalico: { latao: 'fogo', bronze: 'elétrico', cobre: 'ácido', ouro: 'fogo', prata: 'frio' },
  draconatoGema: { ametista: 'energético', cristal: 'radiante', esmeralda: 'psíquico', safira: 'trovejante', topazio: 'necrótico' },
};
/** O nome de cada dragão, no masculino e no feminino ("de" junto quando o livro fala do metal ou da pedra). */
export const DRAGOES_DO_FIZBAN = {
  negro: ['negro', 'negra'], azul: ['azul', 'azul'], verde: ['verde', 'verde'], vermelho: ['vermelho', 'vermelha'], branco: ['branco', 'branca'],
  latao: ['de latão', 'de latão'], bronze: ['de bronze', 'de bronze'], cobre: ['de cobre', 'de cobre'], ouro: ['de ouro', 'de ouro'], prata: ['de prata', 'de prata'],
  ametista: ['de ametista', 'de ametista'], cristal: ['de cristal', 'de cristal'], esmeralda: ['de esmeralda', 'de esmeralda'], safira: ['de safira', 'de safira'], topazio: ['de topázio', 'de topázio'],
};

// ---- as bases que as sub-raças repetem ----------------------------------
const ANAO = ['darkvision', 'dwarvenResilience', 'dwarvenCombatTraining', 'toolProficiency', 'stonecunning'];
const ARMAS_DO_ANAO = ['machadoDeBatalha', 'machadinha', 'marteloLeve', 'marteloDeGuerra'];
const ELFO = ['darkvision', 'keenSenses', 'feyAncestry', 'trance'];
const MEIO_ELFO = ['darkvision', 'feyAncestry', 'extraLanguage'];
const TIFERINO = ['darkvision', 'hellishResistance'];
const tiferino = (nome, nomeF, legado, atributos, truque, magias, livro = 'MTF') => ({
  nome, nomeF, grupo: 'Tiferino', porte: 'médio', deslocamento: 30, visao: 60, atributos, livro,
  tracos: [...TIFERINO, legado], resistencias: ['fogo'], truques: [truque], atributoRacial: 'cha', magiasRaciais: magias,
});

export const RACAS_DOS_LIVROS = {
  // =========================================================== Guia de Volo
  aasimarProtetor: {
    nome: 'Aasimar protetor', nomeF: 'Aasimar protetora', grupo: 'Aasimar', porte: 'médio', deslocamento: 30, visao: 60, livro: 'VGM',
    atributos: { cha: 2, wis: 1 }, tracos: ['darkvision', 'celestialResistance', 'healingHands', 'lightBearer', 'radiantSoulAasimar'],
    resistencias: ['necrótico', 'radiante'], truques: ['luz'], atributoRacial: 'cha',
    recursos: [{ id: 'healingHands', usos: 1 }, { id: 'radiantSoulAasimar', usos: 1, nivel: 3 }],
  },
  aasimarFlagelo: {
    nome: 'Aasimar flagelo', nomeF: 'Aasimar flagelo', grupo: 'Aasimar', porte: 'médio', deslocamento: 30, visao: 60, livro: 'VGM',
    atributos: { cha: 2, con: 1 }, tracos: ['darkvision', 'celestialResistance', 'healingHands', 'lightBearer', 'radiantConsumption'],
    resistencias: ['necrótico', 'radiante'], truques: ['luz'], atributoRacial: 'cha',
    recursos: [{ id: 'healingHands', usos: 1 }, { id: 'radiantConsumption', usos: 1, nivel: 3 }],
  },
  aasimarCaido: {
    nome: 'Aasimar caído', nomeF: 'Aasimar caída', grupo: 'Aasimar', porte: 'médio', deslocamento: 30, visao: 60, livro: 'VGM',
    atributos: { cha: 2, str: 1 }, tracos: ['darkvision', 'celestialResistance', 'healingHands', 'lightBearer', 'necroticShroud'],
    resistencias: ['necrótico', 'radiante'], truques: ['luz'], atributoRacial: 'cha',
    recursos: [{ id: 'healingHands', usos: 1 }, { id: 'necroticShroud', usos: 1, nivel: 3 }],
  },
  bugbear: {
    nome: 'Bugbear', nomeF: 'Bugbear', grupo: 'Goblinoide', porte: 'médio', deslocamento: 30, visao: 60, livro: 'VGM',
    atributos: { str: 2, dex: 1 }, tracos: ['darkvision', 'longLimbed', 'powerfulBuild', 'sneaky', 'surpriseAttack'], pericias: ['furtividade'],
  },
  firbolg: {
    nome: 'Firbolg', nomeF: 'Firbolg', grupo: 'Firbolg', porte: 'médio', deslocamento: 30, visao: 0, livro: 'VGM',
    atributos: { wis: 2, str: 1 }, tracos: ['firbolgMagic', 'hiddenStep', 'powerfulBuild', 'speechOfBeastAndLeaf'], atributoRacial: 'wis',
    magiasRaciais: [{ nivel: 1, magia: 'detectarMagia', curto: true }, { nivel: 1, magia: 'disfarcarSe', curto: true }],
    recursos: [{ id: 'hiddenStep', usos: 1, curto: true }],
  },
  goblin: {
    nome: 'Goblin', nomeF: 'Goblin', grupo: 'Goblinoide', porte: 'pequeno', deslocamento: 30, visao: 60, livro: 'VGM',
    atributos: { dex: 2, con: 1 }, tracos: ['darkvision', 'furyOfTheSmall', 'nimbleEscapeRacial'],
    recursos: [{ id: 'furyOfTheSmall', usos: 1, curto: true }],
  },
  golias: {
    nome: 'Golias', nomeF: 'Golias', grupo: 'Golias', porte: 'médio', deslocamento: 30, visao: 0, livro: 'VGM',
    atributos: { str: 2, con: 1 }, tracos: ['naturalAthlete', 'stonesEndurance', 'powerfulBuild', 'mountainBorn'],
    pericias: ['atletismo'], resistencias: ['frio'], recursos: [{ id: 'stonesEndurance', usos: 1, curto: true }],
  },
  hobgoblin: {
    nome: 'Hobgoblin', nomeF: 'Hobgoblin', grupo: 'Goblinoide', porte: 'médio', deslocamento: 30, visao: 60, livro: 'VGM',
    atributos: { con: 2, int: 1 }, tracos: ['darkvision', 'martialTraining', 'savingFace'],
    armas: ['espadaLonga', 'arcoLongo'], armaduras: ['leve'], recursos: [{ id: 'savingFace', usos: 1, curto: true }],
  },
  kenku: {
    nome: 'Kenku', nomeF: 'Kenku', grupo: 'Kenku', porte: 'médio', deslocamento: 30, visao: 0, livro: 'VGM',
    atributos: { dex: 2, wis: 1 }, tracos: ['expertForgery', 'kenkuTraining', 'mimicry'],
    livres: { pericias: 2, de: ['acrobacia', 'enganacao', 'furtividade', 'prestidigitacao'] },
  },
  kobold: {
    nome: 'Kobold', nomeF: 'Kobold', grupo: 'Kobold', porte: 'pequeno', deslocamento: 30, visao: 60, livro: 'VGM',
    // o −2 de FOR do Volo é dele: o criador o soma como qualquer bônus
    atributos: { dex: 2, str: -2 }, tracos: ['darkvision', 'grovelCowerAndBeg', 'packTacticsRacial', 'sunlightSensitivity'],
    recursos: [{ id: 'grovelCowerAndBeg', usos: 1, curto: true }],
  },
  povoLagarto: {
    nome: 'Povo-lagarto', nomeF: 'Povo-lagarto', grupo: 'Povo-lagarto', porte: 'médio', deslocamento: 30, visao: 0, nado: 30, livro: 'VGM',
    atributos: { con: 2, wis: 1 }, tracos: ['bite', 'cunningArtisan', 'holdBreath', 'huntersLore', 'naturalArmor', 'hungryJaws'],
    armaduraNatural: 13, armasNaturais: ['mordidaRacial'], respiraNaAgua: true,
    livres: { pericias: 2, de: ['lidarComAnimais', 'natureza', 'percepcao', 'furtividade', 'sobrevivencia'] },
    recursos: [{ id: 'hungryJaws', usos: 1, curto: true }],
  },
  orc: {
    nome: 'Orc', nomeF: 'Orc', grupo: 'Orc', porte: 'médio', deslocamento: 30, visao: 60, livro: 'VGM',
    atributos: { str: 2, con: 1, int: -2 }, tracos: ['darkvision', 'aggressive', 'menacing', 'powerfulBuild'], pericias: ['intimidacao'],
  },
  tabaxi: {
    nome: 'Tabaxi', nomeF: 'Tabaxi', grupo: 'Tabaxi', porte: 'médio', deslocamento: 30, visao: 60, escalada: 20, livro: 'VGM',
    atributos: { dex: 2, cha: 1 }, tracos: ['darkvision', 'felineAgility', 'catsClaws', 'catsTalent'],
    pericias: ['percepcao', 'furtividade'], armasNaturais: ['garrasRaciais'], recursos: [{ id: 'felineAgility', usos: 1 }],
  },
  tritao: {
    nome: 'Tritão', nomeF: 'Tritão', grupo: 'Tritão', porte: 'médio', deslocamento: 30, visao: 0, nado: 30, livro: 'VGM',
    atributos: { str: 1, con: 1, cha: 1 }, tracos: ['amphibious', 'controlAirAndWater', 'emissaryOfTheSea', 'guardiansOfTheDepths'],
    resistencias: ['frio'], respiraNaAgua: true, atributoRacial: 'cha',
    magiasRaciais: [{ nivel: 1, magia: 'nevoaObscurecente' }, { nivel: 3, magia: 'lufadaDeVento' }, { nivel: 5, magia: 'muralhaDeAgua' }],
  },
  yuantiPuroSangue: {
    nome: 'Yuan-ti puro-sangue', nomeF: 'Yuan-ti puro-sangue', grupo: 'Yuan-ti', porte: 'médio', deslocamento: 30, visao: 60, livro: 'VGM',
    atributos: { cha: 2, int: 1 }, tracos: ['darkvision', 'yuantiSpellcasting', 'magicResistanceRacial', 'poisonImmunity'],
    truques: ['borrifoVenenoso'], atributoRacial: 'cha', magiasRaciais: [{ nivel: 3, magia: 'sugestao' }],
    imunidades: ['veneno'], imuneCondicao: ['envenenado'], vantagens: [{ nome: 'Resistência a Magia', magia: true }],
  },

  // ====================================================== Tomo de Mordenkainen
  githyanki: {
    nome: 'Githyanki', nomeF: 'Githyanki', grupo: 'Gith', porte: 'médio', deslocamento: 30, visao: 0, livro: 'MTF',
    atributos: { str: 2, int: 1 }, tracos: ['decadentMastery', 'martialProdigy', 'githyankiPsionics'],
    armas: ['espadaCurta', 'espadaLonga', 'espadaGrande'], armaduras: ['leve', 'média'], truques: ['maoMagica'], atributoRacial: 'int',
    magiasRaciais: [{ nivel: 3, magia: 'salto' }, { nivel: 5, magia: 'passoNebuloso' }], livres: { pericias: 1 },
  },
  githzerai: {
    nome: 'Githzerai', nomeF: 'Githzerai', grupo: 'Gith', porte: 'médio', deslocamento: 30, visao: 0, livro: 'MTF',
    atributos: { wis: 2, int: 1 }, tracos: ['mentalDiscipline', 'githzeraiPsionics'], truques: ['maoMagica'], atributoRacial: 'wis',
    magiasRaciais: [{ nivel: 3, magia: 'escudoArcano' }, { nivel: 5, magia: 'detectarPensamentos' }],
    vantagens: [{ nome: 'Disciplina Mental', condicoes: ['enfeiticado', 'amedrontado'] }],
  },
  duergar: {
    nome: 'Duergar', nomeF: 'Duergar', grupo: 'Anão', porte: 'médio', deslocamento: 25, visao: 120, livro: 'MTF',
    atributos: { con: 2, str: 1 }, tracos: ['superiorDarkvision', ...ANAO.slice(1), 'duergarResilience', 'duergarMagic', 'sunlightSensitivity'],
    resistencias: ['veneno'], armas: ARMAS_DO_ANAO, atributoRacial: 'int',
    magiasRaciais: [{ nivel: 3, magia: 'aumentarReduzir' }, { nivel: 5, magia: 'invisibilidade' }],
    vantagens: [{ nome: 'Resiliência Duergar', condicoes: ['enfeiticado', 'paralisado'] }],
  },
  eladrin: {
    nome: 'Eladrin', nomeF: 'Eladrin', grupo: 'Elfo', porte: 'médio', deslocamento: 30, visao: 60, livro: 'MTF',
    atributos: { dex: 2, cha: 1 }, tracos: [...ELFO, 'feyStep'], pericias: ['percepcao'], atributoRacial: 'cha',
    escolhaDeTraco: ['estacaoOutono', 'estacaoInverno', 'estacaoVerao'], recursos: [{ id: 'feyStep', usos: 1, curto: true }],
  },
  elfoDoMar: {
    nome: 'Elfo do mar', nomeF: 'Elfa do mar', grupo: 'Elfo', porte: 'médio', deslocamento: 30, visao: 60, nado: 30, livro: 'MTF',
    atributos: { dex: 2, con: 1 }, tracos: [...ELFO, 'childOfTheSea', 'friendOfTheSea', 'seaElfTraining'], pericias: ['percepcao'],
    armas: ['lancaCurta', 'tridente', 'bestaLeve', 'rede'], respiraNaAgua: true,
  },
  shadarKai: {
    nome: 'Shadar-kai', nomeF: 'Shadar-kai', grupo: 'Elfo', porte: 'médio', deslocamento: 30, visao: 60, livro: 'MTF',
    atributos: { dex: 2, con: 1 }, tracos: [...ELFO, 'necroticResistance', 'blessingOfTheRavenQueen'], pericias: ['percepcao'],
    resistencias: ['necrótico'], recursos: [{ id: 'blessingOfTheRavenQueen', usos: 1 }],
  },
  gnomoDasProfundezas: {
    nome: 'Gnomo das profundezas', nomeF: 'Gnoma das profundezas', grupo: 'Gnomo', porte: 'pequeno', deslocamento: 25, visao: 120, livro: 'MTF',
    atributos: { int: 2, dex: 1 }, tracos: ['superiorDarkvision', 'gnomeCunning', 'stoneCamouflage'],
  },
  tiferinoBaalzebul: tiferino('Tiferino de Baalzebul', 'Tiferina de Baalzebul', 'legacyOfMaladomini', { cha: 2, int: 1 }, 'taumaturgia',
    [{ nivel: 3, magia: 'raioDeDoenca', circulo: 2 }, { nivel: 5, magia: 'coroaDaLoucura' }]),
  tiferinoDispater: tiferino('Tiferino de Dispater', 'Tiferina de Dispater', 'legacyOfDis', { cha: 2, dex: 1 }, 'taumaturgia',
    [{ nivel: 3, magia: 'disfarcarSe' }, { nivel: 5, magia: 'detectarPensamentos' }]),
  tiferinoFierna: tiferino('Tiferino de Fierna', 'Tiferina de Fierna', 'legacyOfPhlegethos', { cha: 2, wis: 1 }, 'amizade',
    [{ nivel: 3, magia: 'enfeiticarPessoa', circulo: 2 }, { nivel: 5, magia: 'sugestao' }]),
  tiferinoGlasya: tiferino('Tiferino de Glasya', 'Tiferina de Glasya', 'legacyOfMalbolge', { cha: 2, dex: 1 }, 'ilusaoMenor',
    [{ nivel: 3, magia: 'disfarcarSe' }, { nivel: 5, magia: 'invisibilidade' }]),
  tiferinoLevistus: tiferino('Tiferino de Levistus', 'Tiferina de Levistus', 'legacyOfStygia', { cha: 2, con: 1 }, 'raioDeGelo',
    [{ nivel: 3, magia: 'armaduraDeAgathys', circulo: 2 }, { nivel: 5, magia: 'escuridao' }]),
  tiferinoMammon: tiferino('Tiferino de Mammon', 'Tiferina de Mammon', 'legacyOfMinauros', { cha: 2, int: 1 }, 'maoMagica',
    [{ nivel: 3, magia: 'discoFlutuante' }]),
  tiferinoMefistofeles: tiferino('Tiferino de Mefistófeles', 'Tiferina de Mefistófeles', 'legacyOfCania', { cha: 2, int: 1 }, 'maoMagica',
    [{ nivel: 3, magia: 'maosFlamejantes', circulo: 2 }, { nivel: 5, magia: 'laminaFlamejante' }]),
  tiferinoZariel: tiferino('Tiferino de Zariel', 'Tiferina de Zariel', 'legacyOfAvernus', { cha: 2, str: 1 }, 'taumaturgia',
    [{ nivel: 3, magia: 'golpeAbrasador', circulo: 2 }, { nivel: 5, magia: 'golpeMarcante' }]),

  // ================================================== Guia da Costa da Espada
  halflingPesFantasma: {
    nome: 'Halfling pés-fantasma', nomeF: 'Halfling pés-fantasma', grupo: 'Halfling', porte: 'pequeno', deslocamento: 25, visao: 0, livro: 'SCAG',
    atributos: { dex: 2, wis: 1 }, tracos: ['lucky', 'brave', 'halflingNimbleness', 'silentSpeech'],
  },
  meioElfoAquatico: {
    nome: 'Meio-elfo (elfo aquático)', nomeF: 'Meio-elfa (elfo aquático)', grupo: 'Meio-elfo', porte: 'médio', deslocamento: 30, visao: 60, nado: 30, livro: 'SCAG',
    atributos: { cha: 2 }, tracos: [...MEIO_ELFO, 'swimHalfElf'], livres: { atributos: 2, semCarisma: true },
  },
  meioElfoDrow: {
    nome: 'Meio-elfo (drow)', nomeF: 'Meio-elfa (drow)', grupo: 'Meio-elfo', porte: 'médio', deslocamento: 30, visao: 60, livro: 'SCAG',
    atributos: { cha: 2 }, tracos: [...MEIO_ELFO, 'drowMagic'], livres: { atributos: 2, semCarisma: true },
    truques: ['luzesDancantes'], atributoRacial: 'cha', magiasRaciais: [{ nivel: 3, magia: 'fogoDasFadas' }, { nivel: 5, magia: 'escuridao' }],
  },
  meioElfoLuaSol: {
    nome: 'Meio-elfo (elfo da lua ou do sol)', nomeF: 'Meio-elfa (elfo da lua ou do sol)', grupo: 'Meio-elfo', porte: 'médio', deslocamento: 30, visao: 60, livro: 'SCAG',
    atributos: { cha: 2 }, tracos: [...MEIO_ELFO], livres: { atributos: 2, semCarisma: true },
    escolhaDeTraco: ['elfWeaponTraining', 'highElfCantrip'],
  },
  meioElfoFloresta: {
    nome: 'Meio-elfo (elfo da floresta)', nomeF: 'Meio-elfa (elfo da floresta)', grupo: 'Meio-elfo', porte: 'médio', deslocamento: 30, visao: 60, livro: 'SCAG',
    atributos: { cha: 2 }, tracos: [...MEIO_ELFO], livres: { atributos: 2, semCarisma: true },
    escolhaDeTraco: ['elfWeaponTraining', 'fleetOfFoot', 'maskOfTheWild'],
  },
  tiferinoLinguaDoDiabo: tiferino('Tiferino (língua do diabo)', 'Tiferina (língua do diabo)', 'devilsTongue', { cha: 2, int: 1 }, 'zombariaViciosa',
    [{ nivel: 3, magia: 'enfeiticarPessoa', circulo: 2 }, { nivel: 5, magia: 'cativar' }], 'SCAG'),
  tiferinoFogoInfernal: tiferino('Tiferino (fogo infernal)', 'Tiferina (fogo infernal)', 'hellfire', { cha: 2, int: 1 }, 'taumaturgia',
    [{ nivel: 3, magia: 'maosFlamejantes', circulo: 2 }, { nivel: 5, magia: 'escuridao' }], 'SCAG'),
  tiferinoAlado: {
    nome: 'Tiferino alado', nomeF: 'Tiferina alada', grupo: 'Tiferino', porte: 'médio', deslocamento: 30, visao: 60, voo: 30, livro: 'SCAG',
    atributos: { cha: 2, int: 1 }, tracos: [...TIFERINO, 'winged'], resistencias: ['fogo'],
  },

  // ========================================== Tesouro dos Dragões de Fizban
  draconatoCromatico: {
    nome: 'Draconato cromático', nomeF: 'Draconata cromática', grupo: 'Draconato', porte: 'médio', deslocamento: 30, visao: 0, livro: 'FTD',
    atributos: {}, livres: { mais2: 1, atributos: 1 }, ancestralidades: 'draconatoCromatico', forma: 'linha',
    tracos: ['ancestralidadeCromatica', 'soproDoFizban', 'resistenciaDoFizban', 'chromaticWarding'],
    recursos: [{ id: 'soproDoFizban', usos: 'prof' }, { id: 'chromaticWarding', usos: 1, nivel: 5 }],
  },
  draconatoMetalico: {
    nome: 'Draconato metálico', nomeF: 'Draconata metálica', grupo: 'Draconato', porte: 'médio', deslocamento: 30, visao: 0, livro: 'FTD',
    atributos: {}, livres: { mais2: 1, atributos: 1 }, ancestralidades: 'draconatoMetalico', forma: 'cone',
    tracos: ['ancestralidadeMetalica', 'soproDoFizban', 'resistenciaDoFizban', 'metallicBreath'],
    recursos: [{ id: 'soproDoFizban', usos: 'prof' }, { id: 'metallicBreath', usos: 1, nivel: 5 }],
  },
  draconatoGema: {
    nome: 'Draconato de gema', nomeF: 'Draconata de gema', grupo: 'Draconato', porte: 'médio', deslocamento: 30, visao: 0, livro: 'FTD',
    atributos: {}, livres: { mais2: 1, atributos: 1 }, ancestralidades: 'draconatoGema', forma: 'cone',
    tracos: ['ancestralidadeGema', 'soproDoFizban', 'resistenciaDoFizban', 'psionicMind', 'gemFlight'],
    recursos: [{ id: 'soproDoFizban', usos: 'prof' }, { id: 'gemFlight', usos: 1, nivel: 5 }],
  },

  // ========================================================= os outros dois
  verdan: {
    nome: 'Verdan', nomeF: 'Verdan', grupo: 'Verdan', porte: 'pequeno', deslocamento: 30, visao: 0, livro: 'AI',
    atributos: { cha: 2, con: 1 }, tracos: ['blackBloodHealing', 'limitedTelepathy', 'persuasive', 'telepathicInsight'],
    pericias: ['persuasao'], vantagens: [{ nome: 'Intuição Telepática', salvas: ['wis', 'cha'] }],
  },
  linhagemPersonalizada: {
    nome: 'Linhagem personalizada', nomeF: 'Linhagem personalizada', grupo: 'Humano', porte: 'médio', deslocamento: 30, visao: 0, livro: 'TCE',
    atributos: {}, livres: { mais2: 1 }, tracos: ['linhagemTalento'], escolhaDeTraco: ['darkvision', 'linhagemPericia'], talentoDaRaca: true,
  },
};

/** Os livros, na ordem em que o criador os mostra. */
export const LIVROS_DAS_RACAS = [
  ['PHB', 'Livro do Jogador'], ['VGM', 'Guia de Volo'], ['MTF', 'Tomo de Mordenkainen'], ['SCAG', 'Costa da Espada'],
  ['FTD', 'Fizban'], ['TCE', 'Tasha'], ['AI', 'Acquisitions Inc.'],
];
