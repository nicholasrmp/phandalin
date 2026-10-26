// O que o jogador escolhe na entrada da aventura, para cada herói, no 1º
// nível: magias iniciais, talento de origem, subclasse (quando a classe tem
// uma no 1º nível) e equipamento inicial. E a montagem da ficha a partir
// dessas escolhas.
//
// REGRAS: o Livro do Jogador (2014) — listas de magias por classe, quantas
// cada classe escolhe, os domínios, patronos e origens de 1º nível e o
// equipamento inicial de cada classe —, mais o talento de origem do livro de
// 2024, como regra da casa. As descrições curtas são NOSSAS: a regra de jogo
// não tem dono, o texto do livro tem.
//
// O QUE O MOTOR JÁ JOGA E O QUE NÃO. Todas as opções do livro aparecem, mas
// nem todas têm regra no motor ainda. Cada opção sabe se está implementada
// (`temRegra`), a tela marca as que não estão, e o modo automático prefere as
// que estão. Na ficha montada só entra nas regras o que o motor sabe jogar; a
// escolha inteira do jogador fica guardada em `escolhaDeCriacao`, para nada
// se perder quando as regras chegarem.

import { SPELLS } from '../rules/spells.js';
import { CLASSES } from '../rules/classes/index.js';
import { criarPersonagem } from '../rules/progressao.js';
import { abilityMod } from '../rules/abilities.js';
import { HEROIS, heroiPorId } from './herois.js';
import { atributoDoIniciado } from '../rules/talentos.js';

// ---------------------------------------------------------------- magias ----

/** Truques e magias de 1º círculo do Livro do Jogador: id → [nome, círculo]. */
export const MAGIAS_INICIAIS = {
  amizade: ['Amizade', 0],
  arteDruidica: ['Druidismo', 0],
  ataqueCerteiro: ['Ataque Certeiro', 0],
  borrifoVenenoso: ['Borrifo Venenoso', 0],
  chamaSagrada: ['Chama Sagrada', 0],
  chicoteDeEspinhos: ['Chicote de Espinhos', 0],
  consertar: ['Consertar', 0],
  ilusaoMenor: ['Ilusão Menor', 0],
  luz: ['Luz', 0],
  luzesDancantes: ['Luzes Dançantes', 0],
  mensagem: ['Mensagem', 0],
  maoMagica: ['Mãos Mágicas', 0],
  orientacao: ['Orientação', 0],
  pouparOsMoribundos: ['Poupar os Moribundos', 0],
  prestidigitacao: ['Prestidigitação', 0],
  produzirChama: ['Produzir Chama', 0],
  protecaoContraLaminas: ['Proteção contra Lâminas', 0],
  raioDeFogo: ['Raio de Fogo', 0],
  raioDeGelo: ['Raio de Gelo', 0],
  rajadaMistica: ['Rajada Mística', 0],
  resistencia: ['Resistência', 0],
  respingoAcido: ['Respingo Ácido', 0],
  shillelagh: ['Shillelagh', 0],
  taumaturgia: ['Taumaturgia', 0],
  toqueArrepiante: ['Toque Arrepiante', 0],
  toqueChocante: ['Toque Chocante', 0],
  zombariaViciosa: ['Zombaria Viciosa', 0],
  alarme: ['Alarme', 1],
  amizadeAnimal: ['Amizade Animal', 1],
  armaduraArcana: ['Armadura Arcana', 1],
  armaduraDeAgathys: ['Armadura de Agathys', 1],
  bomFruto: ['Bom Fruto', 1],
  borrifoDeCores: ['Borrifo de Cores', 1],
  bracosDeHadar: ['Braços de Hadar', 1],
  bruxaria: ['Bruxaria', 1],
  bencao: ['Bênção', 1],
  comando: ['Comando', 1],
  compreenderIdiomas: ['Compreender Idiomas', 1],
  criarDestruirAgua: ['Criar ou Destruir Água', 1],
  curarFerimentos: ['Curar Ferimentos', 1],
  detectarMagia: ['Detectar Magia', 1],
  detectarVenenoDoenca: ['Detectar Veneno e Doença', 1],
  detectarBemMal: ['Detectar o Bem e o Mal', 1],
  discoFlutuante: ['Disco Flutuante', 1],
  disfarcarSe: ['Disfarçar-se', 1],
  dueloCompelido: ['Duelo Compelido', 1],
  emaranhar: ['Emaranhar', 1],
  encontrarFamiliar: ['Convocar Familiar', 1],
  enfeiticarPessoa: ['Enfeitiçar Pessoa', 1],
  escritaIlusoria: ['Escrita Ilusória', 1],
  escudoArcano: ['Escudo Arcano', 1],
  escudoDaFe: ['Escudo da Fé', 1],
  falarComAnimais: ['Falar com Animais', 1],
  favorDivino: ['Favor Divino', 1],
  fogoDasFadas: ['Fogo das Fadas', 1],
  golpeAbrasador: ['Golpe Abrasador', 1],
  golpeColerico: ['Golpe Colérico', 1],
  golpeConstritor: ['Golpe Constritor', 1],
  golpeTrovejante: ['Golpe Trovejante', 1],
  graxa: ['Graxa', 1],
  heroismo: ['Heroísmo', 1],
  identificar: ['Identificar', 1],
  imagemSilenciosa: ['Imagem Silenciosa', 1],
  infligirFerimentos: ['Infligir Ferimentos', 1],
  marcaDoCacador: ['Marca do Caçador', 1],
  maosFlamejantes: ['Mãos Flamejantes', 1],
  misselMagico: ['Míssil Mágico', 1],
  nevoaObscurecente: ['Névoa Obscurecente', 1],
  ondaTrovejante: ['Onda Trovejante', 1],
  orbeCromatico: ['Orbe Cromático', 1],
  palavraCurativa: ['Palavra Curativa', 1],
  passosLargos: ['Passos Largos', 1],
  perdicao: ['Perdição', 1],
  protecaoBemMal: ['Proteção contra o Bem e o Mal', 1],
  purificarAlimentos: ['Purificar Alimentos e Bebidas', 1],
  quedaSuave: ['Queda Suave', 1],
  raioGuiado: ['Raio Guiado', 1],
  raioDeBruxa: ['Raio de Bruxa', 1],
  raioDeDoenca: ['Raio de Doença', 1],
  recuoAcelerado: ['Recuo Acelerado', 1],
  repreensaoInfernal: ['Repreensão Infernal', 1],
  risoHisterico: ['Riso Histérico', 1],
  salto: ['Salto', 1],
  santuario: ['Santuário', 1],
  saraivadaDeEspinhos: ['Saraivada de Espinhos', 1],
  servoInvisivel: ['Servo Invisível', 1],
  sono: ['Sono', 1],
  sussurrosDissonantes: ['Sussurros Dissonantes', 1],
  vidaFalsa: ['Vida Falsa', 1],
};

export const nomeDaMagia = (id) => MAGIAS_INICIAIS[id]?.[0] ?? id;
export const magiaTemRegra = (id) => Boolean(SPELLS[id]);

// As listas de cada classe no Livro do Jogador, só truques e 1º círculo.
const L = {
  bardo: {
    truques: ['luzesDancantes', 'amizade', 'luz', 'maoMagica', 'consertar', 'mensagem', 'ilusaoMenor',
      'prestidigitacao', 'ataqueCerteiro', 'zombariaViciosa', 'protecaoContraLaminas'],
    magias: ['amizadeAnimal', 'perdicao', 'enfeiticarPessoa', 'compreenderIdiomas', 'curarFerimentos',
      'detectarMagia', 'disfarcarSe', 'sussurrosDissonantes', 'fogoDasFadas', 'quedaSuave', 'palavraCurativa',
      'heroismo', 'identificar', 'escritaIlusoria', 'passosLargos', 'imagemSilenciosa', 'sono',
      'falarComAnimais', 'risoHisterico', 'ondaTrovejante', 'servoInvisivel'],
  },
  clerigo: {
    truques: ['orientacao', 'luz', 'consertar', 'resistencia', 'chamaSagrada', 'pouparOsMoribundos', 'taumaturgia'],
    magias: ['perdicao', 'bencao', 'comando', 'criarDestruirAgua', 'curarFerimentos', 'detectarBemMal',
      'detectarMagia', 'detectarVenenoDoenca', 'raioGuiado', 'palavraCurativa', 'infligirFerimentos',
      'protecaoBemMal', 'purificarAlimentos', 'santuario', 'escudoDaFe'],
  },
  druida: {
    truques: ['arteDruidica', 'orientacao', 'consertar', 'borrifoVenenoso', 'produzirChama', 'resistencia',
      'shillelagh', 'chicoteDeEspinhos'],
    magias: ['amizadeAnimal', 'enfeiticarPessoa', 'criarDestruirAgua', 'curarFerimentos', 'detectarMagia',
      'detectarVenenoDoenca', 'emaranhar', 'fogoDasFadas', 'nevoaObscurecente', 'bomFruto', 'palavraCurativa',
      'salto', 'passosLargos', 'purificarAlimentos', 'falarComAnimais', 'ondaTrovejante'],
  },
  feiticeiro: {
    truques: ['respingoAcido', 'protecaoContraLaminas', 'toqueArrepiante', 'luzesDancantes', 'raioDeFogo',
      'amizade', 'luz', 'maoMagica', 'consertar', 'mensagem', 'ilusaoMenor', 'borrifoVenenoso',
      'prestidigitacao', 'raioDeGelo', 'toqueChocante', 'ataqueCerteiro'],
    magias: ['maosFlamejantes', 'enfeiticarPessoa', 'orbeCromatico', 'borrifoDeCores', 'compreenderIdiomas',
      'detectarMagia', 'disfarcarSe', 'recuoAcelerado', 'vidaFalsa', 'quedaSuave', 'nevoaObscurecente',
      'salto', 'armaduraArcana', 'misselMagico', 'raioDeDoenca', 'escudoArcano', 'imagemSilenciosa', 'sono',
      'ondaTrovejante', 'raioDeBruxa'],
  },
  bruxo: {
    truques: ['protecaoContraLaminas', 'toqueArrepiante', 'rajadaMistica', 'amizade', 'maoMagica',
      'ilusaoMenor', 'borrifoVenenoso', 'prestidigitacao', 'ataqueCerteiro'],
    magias: ['armaduraDeAgathys', 'bracosDeHadar', 'enfeiticarPessoa', 'compreenderIdiomas', 'recuoAcelerado',
      'repreensaoInfernal', 'bruxaria', 'escritaIlusoria', 'protecaoBemMal', 'servoInvisivel', 'raioDeBruxa'],
  },
};
L.mago = {
  truques: L.feiticeiro.truques,
  magias: ['alarme', 'maosFlamejantes', 'enfeiticarPessoa', 'orbeCromatico', 'borrifoDeCores',
    'compreenderIdiomas', 'detectarMagia', 'disfarcarSe', 'recuoAcelerado', 'vidaFalsa', 'quedaSuave',
    'encontrarFamiliar', 'nevoaObscurecente', 'graxa', 'identificar', 'escritaIlusoria', 'salto',
    'passosLargos', 'armaduraArcana', 'misselMagico', 'protecaoBemMal', 'raioDeDoenca', 'escudoArcano',
    'imagemSilenciosa', 'sono', 'risoHisterico', 'discoFlutuante', 'ondaTrovejante', 'servoInvisivel',
    'raioDeBruxa'],
};

// Paladino e guardião só conjuram do 2º nível em diante: as listas deles
// entram para a subida de nível (`game/nivel.js`).
L.paladino = {
  truques: [],
  magias: ['bencao', 'comando', 'dueloCompelido', 'curarFerimentos', 'detectarBemMal', 'detectarMagia',
    'detectarVenenoDoenca', 'escudoDaFe', 'favorDivino', 'heroismo', 'protecaoBemMal', 'purificarAlimentos',
    'golpeAbrasador', 'golpeTrovejante', 'golpeColerico'],
};
L.patrulheiro = {
  truques: [],
  magias: ['alarme', 'amizadeAnimal', 'curarFerimentos', 'detectarMagia', 'detectarVenenoDoenca',
    'golpeConstritor', 'nevoaObscurecente', 'bomFruto', 'saraivadaDeEspinhos', 'marcaDoCacador', 'salto',
    'passosLargos', 'falarComAnimais'],
};

// Magias de 2º e 3º círculo que o motor já joga, por classe (Livro do Jogador).
// Só entram na escolha da subida de nível quando o herói já tem espaço delas;
// a criação (1º nível) continua lendo `L` direto. A lista cresce com o motor.
const ALTAS = {
  bardo: ['silencio', 'coroaDaLoucura', 'acalmarEmocoes', 'dissiparMagia', 'aprimorarAtributo', 'forcaFantasmagorica', 'sugestao', 'crescerPlantas', 'imagemMaior', 'glifoDeProtecao', 'abrir', 'detectarPensamentos', 'verOInvisivel', 'falarComOsMortos',
    'zonaDaVerdade', 'localizarObjeto', 'linguas', 'cativar', 'fingirDeMorto', 'falarComPlantas', 'localizarAnimaisPlantas',
    'pequenaCabana', 'bocaMagica', 'mensageiroAnimal', 'indetectavel',
    'enviarMensagem', 'clarividencia'],
  clerigo: ['silencio', 'eloDeProtecao', 'acalmarEmocoes', 'oracaoDeCura', 'dissiparMagia', 'aprimorarAtributo', 'luzDoDia', 'removerMaldicao', 'glifoDeProtecao', 'falarComOsMortos', 'animarMortos', 'circuloMagico',
    'encontrarArmadilhas', 'zonaDaVerdade', 'localizarObjeto', 'linguas', 'fingirDeMorto', 'criarComidaEAgua',
    'chamaContinua', 'repousoTranquilo', 'augurio', 'andarNaAgua', 'fundirSeComPedra',
    'enviarMensagem', 'clarividencia'],
  druida: ['lufadaDeVento', 'muralhaDeVento', 'convocarRelampagos', 'dissiparMagia', 'visaoNoEscuro', 'aprimorarAtributo', 'luzDoDia', 'crescerPlantas', 'passoSemRastro', 'conjurarAnimais',
    'encontrarArmadilhas', 'localizarObjeto', 'sentidosDaFera', 'fingirDeMorto', 'falarComPlantas', 'localizarAnimaisPlantas',
    'mensageiroAnimal', 'andarNaAgua', 'respirarNaAgua', 'fundirSeComPedra'],
  feiticeiro: ['escuridao', 'lufadaDeVento', 'aumentarReduzir', 'coroaDaLoucura', 'dissiparMagia', 'visaoNoEscuro', 'aprimorarAtributo', 'forcaFantasmagorica', 'sugestao', 'luzDoDia', 'voo', 'patasDeAranha', 'contramagia', 'imagemMaior', 'abrir', 'detectarPensamentos', 'verOInvisivel', 'levitacao', 'piscar',
    'alterarAparencia', 'linguas', 'andarNaAgua', 'respirarNaAgua', 'formaGasosa', 'clarividencia'],
  bruxo: ['escuridao', 'coroaDaLoucura', 'fomeDeHadar', 'dissiparMagia', 'sugestao', 'removerMaldicao', 'voo', 'patasDeAranha', 'contramagia', 'imagemMaior', 'circuloMagico',
    'cativar', 'linguas', 'formaGasosa'],
  mago: ['escuridao', 'lufadaDeVento', 'aumentarReduzir', 'coroaDaLoucura', 'dissiparMagia', 'visaoNoEscuro', 'forcaFantasmagorica', 'sugestao', 'removerMaldicao', 'voo', 'patasDeAranha', 'contramagia', 'imagemMaior', 'glifoDeProtecao', 'abrir', 'detectarPensamentos', 'verOInvisivel', 'animarMortos', 'levitacao', 'piscar', 'circuloMagico',
    'alterarAparencia', 'localizarObjeto', 'linguas', 'fingirDeMorto',
    'truqueDaCorda', 'chamaContinua', 'pequenaCabana', 'repousoTranquilo',
    'bocaMagica', 'auraMagicaDoArcanista', 'indetectavel',
    'respirarNaAgua', 'formaGasosa', 'montariaFantasmagorica',
    'enviarMensagem', 'clarividencia'],
  paladino: ['eloDeProtecao', 'oracaoDeCura', 'dissiparMagia', 'luzDoDia', 'removerMaldicao', 'circuloMagico',
    'zonaDaVerdade', 'localizarObjeto', 'criarComidaEAgua', 'encontrarMontaria'],
  patrulheiro: ['silencio', 'muralhaDeVento', 'flechaRelampago', 'visaoNoEscuro', 'luzDoDia', 'crescerPlantas', 'cordaoDeFlechas', 'passoSemRastro', 'conjurarAnimais',
    'encontrarArmadilhas', 'localizarObjeto', 'sentidosDaFera', 'falarComPlantas', 'localizarAnimaisPlantas',
    'mensageiroAnimal', 'indetectavel', 'andarNaAgua', 'respirarNaAgua'],
};

/**
 * A lista de magias de uma classe: truques e 1º círculo e, com `circuloMax`
 * maior, as de 2º e 3º que o motor joga.
 */
export const listaDaClasse = (classe, circuloMax = 1) => {
  const base = L[classe] ?? { truques: [], magias: [] };
  const altas = (ALTAS[classe] ?? []).filter((id) => (SPELLS[id]?.level ?? 9) <= circuloMax);
  return altas.length ? { ...base, magias: [...base.magias, ...altas] } : base;
};

/**
 * O que cada classe conjuradora escolhe no 1º nível.
 *   truques     quantos truques
 *   modo        'conhecidas' (bardo, feiticeiro, bruxo: aprende e pronto),
 *               'preparadas' (clérigo, druida: prepara da lista inteira),
 *               'livro' (mago: escreve 6 no livro e prepara parte delas)
 *   magias      quantas aprende (conhecidas) ou escreve no livro
 *   preparar    quantas deixa preparadas: modificador do atributo + 1
 * Paladino e guardião só conjuram a partir do 2º nível.
 */
export const CONJURACAO_1 = {
  bardo: { atributo: 'cha', truques: 2, modo: 'conhecidas', magias: 4 },
  clerigo: { atributo: 'wis', truques: 3, modo: 'preparadas' },
  druida: { atributo: 'wis', truques: 2, modo: 'preparadas' },
  feiticeiro: { atributo: 'cha', truques: 4, modo: 'conhecidas', magias: 2 },
  bruxo: { atributo: 'cha', truques: 2, modo: 'conhecidas', magias: 2 },
  mago: { atributo: 'int', truques: 3, modo: 'livro', magias: 6 },
};

/** Listas, quantidades e limites de magia de um herói (com o bônus da raça). */
export function regrasDeMagia(heroi) {
  const conj = CONJURACAO_1[heroi.classe];
  if (!conj) return null;
  const preparar = Math.max(1, abilityMod(heroi.abilities[conj.atributo]) + 1);
  return {
    ...conj,
    truques: conj.truques + (heroi.racial?.truquesExtras ?? 0),
    preparar: conj.modo === 'conhecidas' ? null : preparar,
    // Escolher magias: conhecidas e livro, um número fixo; preparadas, o
    // limite de preparo, da lista inteira da classe.
    escolhe: conj.modo === 'preparadas' ? preparar : conj.magias,
    listaTruques: L[heroi.classe].truques,
    listaMagias: L[heroi.classe].magias,
  };
}

// ------------------------------------------------------------- subclasse ----

/**
 * As subclasses que o Livro do Jogador dá no 1º nível. `motor` é o id em
 * `rules/classes/` quando a subclasse já tem regra no motor; `magias`, as do
 * domínio/patrono que vêm sempre preparadas no 1º nível.
 */
export const SUBCLASSES_1 = {
  clerigo: {
    rotulo: 'Domínio divino',
    opcoes: [
      { id: 'vida', nome: 'Domínio da Vida', motor: 'vida', magias: ['bencao', 'curarFerimentos'],
        resumo: 'Toda cura sua rende mais. Treino em armadura pesada.' },
      { id: 'conhecimento', nome: 'Domínio do Conhecimento', magias: ['comando', 'identificar'],
        resumo: 'Dois idiomas e especialização em duas perícias de saber.' },
      { id: 'luz', nome: 'Domínio da Luz', magias: ['maosFlamejantes', 'fogoDasFadas'],
        resumo: 'O truque Luz e um clarão que atrapalha o ataque de quem você vê.' },
      { id: 'natureza', nome: 'Domínio da Natureza', magias: ['amizadeAnimal', 'falarComAnimais'],
        resumo: 'Um truque de druida, uma perícia da natureza e armadura pesada.' },
      { id: 'tempestade', nome: 'Domínio da Tempestade', magias: ['nevoaObscurecente', 'ondaTrovejante'],
        resumo: 'Armas marciais, armadura pesada e um revide de trovão em quem te acerta.' },
      { id: 'trapaca', nome: 'Domínio da Trapaça', magias: ['enfeiticarPessoa', 'disfarcarSe'],
        resumo: 'Dá vantagem em Furtividade a um aliado com um toque.' },
      { id: 'guerra', nome: 'Domínio da Guerra', magias: ['favorDivino', 'escudoDaFe'],
        resumo: 'Armas marciais, armadura pesada e um ataque extra de vez em quando.' },
    ],
  },
  bruxo: {
    rotulo: 'Patrono',
    opcoes: [
      { id: 'corruptor', nome: 'O Corruptor', motor: 'corruptor',
        resumo: 'Cada inimigo que você derruba te dá pontos de vida temporários.' },
      { id: 'arquifada', nome: 'A Arquifada',
        resumo: 'Um lampejo de presença feérica que encanta ou assusta quem está perto.' },
      { id: 'grandeAntigo', nome: 'O Grande Antigo',
        resumo: 'Você fala com qualquer criatura pela mente, a curta distância.' },
    ],
  },
  feiticeiro: {
    rotulo: 'Origem da feitiçaria',
    opcoes: [
      { id: 'draconica', nome: 'Linhagem Dracônica', motor: 'draconica',
        resumo: 'Escamas que protegem sem armadura e um ponto de vida a mais por nível.' },
      { id: 'magiaSelvagem', nome: 'Magia Selvagem',
        resumo: 'A magia às vezes escapa do controle, para o bem e para o mal.' },
    ],
  },
};

// ----------------------------------------------------- talento de origem ----

/**
 * Os talentos de origem do livro de 2024, tomados como regra da casa no 1º
 * nível. `temRegra`: o motor aplica o efeito na montagem da ficha.
 */
export const TALENTOS_DE_ORIGEM = [
  { id: 'vigoroso', nome: 'Vigoroso', temRegra: true,
    resumo: 'Dois pontos de vida máximos a mais por nível.' },
  { id: 'habilidoso', nome: 'Habilidoso', temRegra: true,
    resumo: 'Treino em três perícias a mais (escolhidas pelo papel do herói).' },
  { id: 'alerta', nome: 'Alerta', temRegra: true,
    resumo: 'Soma o bônus de proficiência à iniciativa. O grupo rola com o melhor bônus entre os heróis.' },
  { id: 'atacanteSelvagem', nome: 'Atacante Selvagem', temRegra: true,
    resumo: 'Uma vez por turno, ao acertar com arma, rola o dano duas vezes e fica com o maior.' },
  { id: 'sortudo', nome: 'Sortudo', temRegra: true,
    resumo: 'Pontos de sorte iguais ao bônus de proficiência. O jogo os gasta sozinho, só quando muda o resultado: vantagem num ataque ou resistência que falhou, ou desvantagem num ataque que ia te acertar.' },
  { id: 'curandeiro', nome: 'Curandeiro', temRegra: true,
    resumo: 'Com o kit de cura (vem junto), uma ação cura um aliado encostado: o dado de vida dele mais seu bônus de proficiência. Dados de cura que derem 1 são rolados de novo.' },
  { id: 'iniciadoEmMagia', nome: 'Iniciado em Magia', temRegra: true,
    resumo: 'Dois truques e uma magia de 1º círculo da lista do clérigo, do druida ou do mago. A magia sai uma vez de graça por encontro.' },
  { id: 'brigaoDeTaverna', nome: 'Brigão de Taverna', temRegra: true,
    resumo: 'Soco de 1d4 + Força, sempre treinado. No soco, dados de dano que derem 1 são rolados de novo, e uma vez por turno o acerto empurra 1,5 m.' },
  { id: 'artesao', nome: 'Artesão', temRegra: true, fora: true,
    resumo: 'Treino em três ferramentas de artesão e 20% de desconto em equipamento comum, quando houver loja.' },
  { id: 'musico', nome: 'Músico', temRegra: true,
    resumo: 'Treino em três instrumentos (vem uma flauta se não tiver nenhum). Antes de cada luta, inspira até [bônus de proficiência] aliados: cada um rola de novo um ataque ou resistência que falhar.' },
];

/** O Iniciado em Magia escolhe de uma destas três listas. */
export const LISTAS_DO_INICIADO = {
  clerigo: { nome: 'Clérigo', truques: L.clerigo.truques, magias: L.clerigo.magias },
  druida: { nome: 'Druida', truques: L.druida.truques, magias: L.druida.magias },
  mago: { nome: 'Mago', truques: L.mago.truques, magias: L.mago.magias },
};

// --------------------------------------------------- equipamento inicial ----

// Os pacotes do livro, com o que o motor tem de item. O que não tem item no
// jogo (pitões, saco de esferas, incensário) fica de fora sem fazer falta.
const PACOTES = {
  explorador: { nome: 'Pacote de explorador',
    itens: [['mochila', 1], ['sacoDeDormir', 1], ['kitDeRefeicao', 1], ['caixaDeIsca', 1], ['tocha', 10], ['racoes', 10], ['cantil', 1], ['cordaCanhamo', 1]] },
  masmorra: { nome: 'Pacote de aventureiro',
    itens: [['mochila', 1], ['pedeCabra', 1], ['martelo', 1], ['tocha', 10], ['caixaDeIsca', 1], ['racoes', 10], ['cantil', 1], ['cordaCanhamo', 1]] },
  sacerdote: { nome: 'Pacote de sacerdote',
    itens: [['mochila', 1], ['cobertor', 1], ['vela', 10], ['caixaDeIsca', 1], ['vestes', 1], ['racoes', 2], ['cantil', 1]] },
  estudioso: { nome: 'Pacote de estudioso',
    itens: [['mochila', 1], ['livro', 1], ['tinta', 1], ['pena', 1]] },
  artista: { nome: 'Pacote de artista',
    itens: [['mochila', 1], ['sacoDeDormir', 1], ['roupaDeFantasia', 2], ['vela', 5], ['racoes', 5], ['cantil', 1]] },
  diplomata: { nome: 'Pacote de diplomata',
    itens: [['bau', 1], ['estojoDeMapas', 2], ['roupaFina', 1], ['tinta', 1], ['pena', 1], ['lampada', 1], ['perfume', 1], ['cera', 1], ['sabao', 1]] },
  assaltante: { nome: 'Pacote de assaltante',
    itens: [['mochila', 1], ['vela', 5], ['pedeCabra', 1], ['martelo', 1], ['lanternaFuraco', 1], ['racoes', 5], ['caixaDeIsca', 1], ['cantil', 1], ['cordaCanhamo', 1]] },
};

const pacote = (id) => ({ rotulo: PACOTES[id].nome, pacote: id });
export const nomeDoPacote = (id) => PACOTES[id]?.nome ?? id;

/**
 * O equipamento inicial de cada classe no Livro do Jogador: grupos de "(a) ou
 * (b)", mais o que vem de qualquer jeito. Onde o livro diz "qualquer arma
 * marcial", a tela oferece as que fazem sentido para o herói em vez da tabela
 * inteira.
 *   opção: { rotulo, armas?: [ids], armadura?, escudo?, itens?: [[id, qtd]], pacote? }
 */
export const EQUIPAMENTO_1 = {
  barbaro: {
    grupos: [
      [{ rotulo: 'Machado grande', armas: ['machadoGrande'] }, { rotulo: 'Espada grande', armas: ['espadaGrande'] },
        { rotulo: 'Malho', armas: ['malho'] }],
      [{ rotulo: 'Duas machadinhas', armas: ['machadinha'], itens: [['machadinha', 1]] }, { rotulo: 'Uma clava', armas: ['clava'] }],
    ],
    fixo: { armas: ['azagaia'], itens: [['azagaia', 3]], pacote: 'explorador' },
  },
  bardo: {
    grupos: [
      [{ rotulo: 'Rapieira', armas: ['rapieira'] }, { rotulo: 'Espada longa', armas: ['espadaLonga'] }, { rotulo: 'Bordão', armas: ['bordao'] }],
      [pacote('diplomata'), pacote('artista')],
      [{ rotulo: 'Alaúde', itens: [['alaude', 1]] }, { rotulo: 'Flauta', itens: [['flauta', 1]] }],
    ],
    fixo: { armadura: 'couro', armas: ['adaga'] },
  },
  clerigo: {
    grupos: [
      [{ rotulo: 'Maça', armas: ['maca'] }, { rotulo: 'Martelo de guerra (com treino)', armas: ['marteloDeGuerra'], exige: 'marcial' }],
      [{ rotulo: 'Brunea', armadura: 'brunea' }, { rotulo: 'Armadura de couro', armadura: 'couro' },
        { rotulo: 'Cota de malha (com treino)', armadura: 'cotaDeMalha', exige: 'pesada' }],
      [{ rotulo: 'Besta leve e 20 virotes', armas: ['bestaLeve'], itens: [['virotes', 20]] }, { rotulo: 'Lança curta', armas: ['lancaCurta'] }],
      [pacote('sacerdote'), pacote('explorador')],
    ],
    fixo: { escudo: true, itens: [['simboloSagradoAmuleto', 1]] },
  },
  druida: {
    grupos: [
      [{ rotulo: 'Escudo de madeira', escudo: true }, { rotulo: 'Bordão', armas: ['bordao'] }],
      [{ rotulo: 'Cimitarra', armas: ['cimitarra'] }, { rotulo: 'Foice curta', armas: ['foice'] }],
    ],
    fixo: { armadura: 'couro', itens: [['azevinho', 1]], pacote: 'explorador' },
  },
  guerreiro: {
    grupos: [
      [{ rotulo: 'Cota de malha', armadura: 'cotaDeMalha' },
        { rotulo: 'Couro, arco longo e 20 flechas', armadura: 'couro', armas: ['arcoLongo'], itens: [['flechas', 20]] }],
      [{ rotulo: 'Espada longa e escudo', armas: ['espadaLonga'], escudo: true },
        { rotulo: 'Espada longa e machado de batalha', armas: ['espadaLonga', 'machadoDeBatalha'] }],
      [{ rotulo: 'Besta leve e 20 virotes', armas: ['bestaLeve'], itens: [['virotes', 20]] },
        { rotulo: 'Duas machadinhas', armas: ['machadinha'], itens: [['machadinha', 1]] }],
      [pacote('masmorra'), pacote('explorador')],
    ],
    fixo: {},
  },
  monge: {
    grupos: [
      [{ rotulo: 'Espada curta', armas: ['espadaCurta'] }, { rotulo: 'Bordão', armas: ['bordao'] }],
      [pacote('masmorra'), pacote('explorador')],
    ],
    fixo: { armas: ['dardo'], itens: [['dardo', 9]] },
  },
  paladino: {
    grupos: [
      [{ rotulo: 'Espada longa e escudo', armas: ['espadaLonga'], escudo: true },
        { rotulo: 'Martelo de guerra e escudo', armas: ['marteloDeGuerra'], escudo: true },
        { rotulo: 'Espada grande', armas: ['espadaGrande'] }],
      [{ rotulo: 'Cinco azagaias', armas: ['azagaia'], itens: [['azagaia', 4]] }, { rotulo: 'Maça', armas: ['maca'] }],
      [pacote('sacerdote'), pacote('explorador')],
    ],
    fixo: { armadura: 'cotaDeMalha', itens: [['simboloSagradoEmblema', 1]] },
  },
  patrulheiro: {
    grupos: [
      [{ rotulo: 'Brunea', armadura: 'brunea' }, { rotulo: 'Armadura de couro', armadura: 'couro' }],
      [{ rotulo: 'Duas espadas curtas', armas: ['espadaCurta'], itens: [['espadaCurta', 1]] },
        { rotulo: 'Duas machadinhas', armas: ['machadinha'], itens: [['machadinha', 1]] }],
      [pacote('masmorra'), pacote('explorador')],
    ],
    fixo: { armas: ['arcoLongo'], itens: [['flechas', 20], ['aljava', 1]] },
  },
  ladino: {
    grupos: [
      [{ rotulo: 'Rapieira', armas: ['rapieira'] }, { rotulo: 'Espada curta', armas: ['espadaCurta'] }],
      [{ rotulo: 'Arco curto e 20 flechas', armas: ['arcoCurto'], itens: [['flechas', 20]] },
        { rotulo: 'Outra espada curta', armas: ['espadaCurta'] }],
      [pacote('assaltante'), pacote('masmorra'), pacote('explorador')],
    ],
    fixo: { armadura: 'couro', armas: ['adaga'], itens: [['adaga', 1], ['ferramentasDeLadrao', 1]] },
  },
  feiticeiro: {
    grupos: [
      [{ rotulo: 'Besta leve e 20 virotes', armas: ['bestaLeve'], itens: [['virotes', 20]] }, { rotulo: 'Bordão', armas: ['bordao'] }],
      [{ rotulo: 'Bolsa de componentes', itens: [['bolsaDeComponentes', 1]] }, { rotulo: 'Cristal arcano', itens: [['focoArcanoCristal', 1]] }],
      [pacote('masmorra'), pacote('explorador')],
    ],
    fixo: { armas: ['adaga'], itens: [['adaga', 1]] },
  },
  bruxo: {
    grupos: [
      [{ rotulo: 'Besta leve e 20 virotes', armas: ['bestaLeve'], itens: [['virotes', 20]] }, { rotulo: 'Lança curta', armas: ['lancaCurta'] }],
      [{ rotulo: 'Bolsa de componentes', itens: [['bolsaDeComponentes', 1]] }, { rotulo: 'Orbe arcano', itens: [['focoArcanoOrbe', 1]] }],
      [pacote('estudioso'), pacote('masmorra')],
    ],
    fixo: { armadura: 'couro', armas: ['adaga'], itens: [['adaga', 1]] },
  },
  mago: {
    grupos: [
      [{ rotulo: 'Bordão', armas: ['bordao'] }, { rotulo: 'Adaga', armas: ['adaga'] }],
      [{ rotulo: 'Bolsa de componentes', itens: [['bolsaDeComponentes', 1]] }, { rotulo: 'Cajado arcano', itens: [['focoArcanoCajado', 1]] }],
      [pacote('estudioso'), pacote('explorador')],
    ],
    fixo: { itens: [['livroDeMagias', 1]] },
  },
};

// ------------------------------------------------------ escolha automática --

// O que o modo automático escolhe para cada herói: o que joga melhor com as
// regras que o motor já tem, e o que combina com a história dele.
const AUTOMATICO = {
  'pc-guerreiro': { talento: 'vigoroso', equipamento: [0, 0, 0, 1] },
  'pc-ladino': { talento: 'alerta', equipamento: [1, 0, 0] },
  'pc-clerigo': { talento: 'curandeiro', subclasse: 'vida', equipamento: [0, 0, 0, 0],
    truques: ['chamaSagrada', 'pouparOsMoribundos', 'resistencia'],
    magias: ['palavraCurativa', 'raioGuiado', 'infligirFerimentos', 'perdicao'] },
  'pc-mago': { talento: 'alerta', equipamento: [0, 1, 0],
    truques: ['raioDeFogo', 'raioDeGelo', 'toqueArrepiante', 'luz'],
    magias: ['misselMagico', 'sono', 'maosFlamejantes', 'ondaTrovejante', 'raioDeDoenca', 'armaduraArcana'] },
  'pc-barbaro': { talento: 'vigoroso', equipamento: [0, 0] },
  'pc-druida': { talento: 'vigoroso', equipamento: [0, 0],
    truques: ['resistencia', 'produzirChama'], magias: ['curarFerimentos', 'palavraCurativa', 'emaranhar', 'ondaTrovejante'] },
  'pc-bruxo': { talento: 'alerta', subclasse: 'corruptor', equipamento: [0, 1, 1],
    truques: ['rajadaMistica', 'toqueArrepiante'], magias: ['bruxaria', 'armaduraDeAgathys'] },
  'pc-feiticeira': { talento: 'vigoroso', subclasse: 'draconica', equipamento: [0, 1, 1],
    truques: ['raioDeFogo', 'raioDeGelo', 'toqueArrepiante', 'luz'], magias: ['misselMagico', 'maosFlamejantes'] },
  'pc-paladino': { talento: 'vigoroso', equipamento: [0, 0, 0] },
  'pc-guardiao': { talento: 'alerta', equipamento: [1, 0, 1] },
  'pc-monja': { talento: 'alerta', equipamento: [0, 1] },
  'pc-barda': { talento: 'sortudo', equipamento: [0, 1, 0],
    truques: ['zombariaViciosa', 'ilusaoMenor'], magias: ['palavraCurativa', 'sono', 'perdicao', 'ondaTrovejante'] },
};

/**
 * A escolha completa e válida do modo automático para um herói. Também é o
 * ponto de partida da tela: o jogador muda o que quiser a partir dela.
 */
export function escolhaAutomatica(id) {
  const h = heroiPorId(id);
  const a = AUTOMATICO[id] ?? {};
  const m = regrasDeMagia(h);
  const preferir = (lista, quantos, sugeridas = []) => {
    const ok = sugeridas.filter((s) => lista.includes(s));
    const comRegra = lista.filter((s) => magiaTemRegra(s) && !ok.includes(s));
    const resto = lista.filter((s) => !ok.includes(s) && !comRegra.includes(s));
    return [...ok, ...comRegra, ...resto].slice(0, quantos);
  };
  const sub = SUBCLASSES_1[h.classe];
  return {
    talento: a.talento ?? 'vigoroso',
    subclasse: sub ? (a.subclasse ?? sub.opcoes[0].id) : null,
    equipamento: (EQUIPAMENTO_1[h.classe]?.grupos ?? []).map((_, i) => a.equipamento?.[i] ?? 0),
    truques: m ? preferir(m.listaTruques, m.truques, a.truques) : [],
    magias: m ? preferir(m.listaMagias, m.escolhe, a.magias) : [],
    // Mago: das seis do livro, quais ficam preparadas.
    preparadas: m?.modo === 'livro' ? preferir(m.listaMagias, m.preparar, a.magias) : null,
    iniciado: escolhaDoIniciado(h),
  };
}

/** O padrão do Iniciado em Magia: a lista do melhor atributo mental. */
export function escolhaDoIniciado(h, lista = null) {
  lista ??= h.abilities.int >= h.abilities.wis ? 'mago' : 'clerigo';
  const l = LISTAS_DO_INICIADO[lista];
  // Preferência do automático: o que funciona sozinho e não acerta aliado.
  // Sem isto o padrão era a primeira da lista com regra — Mãos Flamejantes,
  // um cone que queima quem está na linha de frente junto com o goblin.
  const PREFERIDAS = ['misselMagico', 'palavraCurativa', 'raioGuiado', 'curarFerimentos', 'sono', 'bencao',
    'raioDeFogo', 'chamaSagrada', 'raioDeGelo', 'produzirChama', 'resistencia', 'pouparOsMoribundos'];
  const ordem = (xs) => [
    ...PREFERIDAS.filter((x) => xs.includes(x) && magiaTemRegra(x)),
    ...xs.filter((x) => magiaTemRegra(x) && !PREFERIDAS.includes(x)),
    ...xs.filter((x) => !magiaTemRegra(x)),
  ];
  return { lista, truques: ordem(l.truques).slice(0, 2), magia: ordem(l.magias)[0] };
}

/** O que falta para a escolha valer: lista de frases; vazia = pode seguir. */
export function problemasDaEscolha(id, e) {
  const h = heroiPorId(id);
  const m = regrasDeMagia(h);
  const p = [];
  if (m) {
    if (e.truques.length !== m.truques) p.push(`Escolha ${m.truques} truques (tem ${e.truques.length}).`);
    if (e.magias.length !== m.escolhe) {
      p.push(`Escolha ${m.escolhe} magias de 1º círculo (tem ${e.magias.length}).`);
    }
    if (m.modo === 'livro' && e.preparadas?.length !== m.preparar) {
      p.push(`Prepare ${m.preparar} das magias do livro (tem ${e.preparadas?.length ?? 0}).`);
    }
  }
  if (SUBCLASSES_1[h.classe] && !e.subclasse) p.push('Escolha a subclasse.');
  if (!e.talento) p.push('Escolha o talento de origem.');
  if (e.talento === 'iniciadoEmMagia') {
    if ((e.iniciado?.truques?.length ?? 0) !== 2) p.push('Iniciado em Magia: escolha 2 truques.');
    if (!e.iniciado?.magia) p.push('Iniciado em Magia: escolha 1 magia de 1º círculo.');
  }
  return p;
}

// -------------------------------------------------------------- montagem ----

// Perícias que o Habilidoso dá, por papel: as três primeiras que o herói
// ainda não tem.
const PERICIAS_HABILIDOSO = ['percepcao', 'furtividade', 'atletismo', 'intuicao', 'medicina',
  'persuasao', 'investigacao', 'sobrevivencia', 'acrobacia', 'arcanismo'];

/**
 * A ficha de combate de um herói com as escolhas feitas. Passa pelo mesmo
 * motor de progressão do resto do jogo (`criarPersonagem`), então PV,
 * proficiência e características saem da classe; o que é escolha de 1º nível
 * entra por cima.
 */
export function montarHeroi(id, escolha = escolhaAutomatica(id)) {
  const h = heroiPorId(id);
  const def = CLASSES[h.classe];
  const eq = EQUIPAMENTO_1[h.classe] ?? { grupos: [], fixo: {} };
  // A escolha primeiro: a primeira arma da lista é a que o herói empunha.
  const partes = [...eq.grupos.map((g, i) => g[escolha.equipamento?.[i] ?? 0]), eq.fixo];

  const armas = [];
  const bag = [];
  let armadura = 'nenhuma';
  let escudo = false;
  const poe = (id2, qtd) => {
    const ja = bag.find((b) => b.id === id2);
    if (ja) ja.qtd += qtd; else bag.push({ id: id2, tipo: 'item', qtd });
  };
  for (const parte of partes) {
    if (!parte) continue;
    for (const a of parte.armas ?? []) if (!armas.includes(a)) armas.push(a);
    if (parte.armadura) armadura = parte.armadura;
    if (parte.escudo) escudo = true;
    for (const [i, q] of parte.itens ?? []) poe(i, q);
    if (parte.pacote) for (const [i, q] of PACOTES[parte.pacote].itens) poe(i, q);
  }
  poe('moedaDeOuro', 10);
  poe('pocaoDeCura', 1);

  // Magias: nas regras, só as que o motor sabe jogar.
  const m = regrasDeMagia(h);
  const sub = SUBCLASSES_1[h.classe]?.opcoes.find((o) => o.id === escolha.subclasse) ?? null;
  let spellcasting;
  if (m) {
    const doDominio = (sub?.magias ?? []).filter(magiaTemRegra);
    // Os truques da raça (tiferino, gnomo da floresta) vêm de graça.
    const truques = [...new Set([...escolha.truques, ...(h.racial?.truques ?? [])])].filter(magiaTemRegra);
    const preparadas = (m.modo === 'livro' ? escolha.preparadas : escolha.magias).filter(magiaTemRegra);
    spellcasting = {
      ability: m.atributo,
      cantrips: truques,
      prepared: preparadas,
      sempreProntas: doDominio,
      ...(m.modo === 'livro' ? { livro: escolha.magias.filter(magiaTemRegra) } : {}),
      ...(m.modo === 'preparadas' ? { lista: m.listaMagias.filter(magiaTemRegra) } : {}),
    };
  }

  // Perícias: as do herói, mais o Habilidoso.
  const skills = [...h.skills];
  if (escolha.talento === 'habilidoso') {
    for (const s of PERICIAS_HABILIDOSO) {
      if (skills.length >= h.skills.length + 3) break;
      if (!skills.includes(s)) skills.push(s);
    }
  }

  const escolhas = {};
  if (sub?.motor && def.subclasse?.nivel === 1) escolhas[1] = { subclasse: sub.motor };
  if (h.classe === 'guerreiro') escolhas[1] = { ...escolhas[1], estiloDeLuta: 'defense' };

  const c = criarPersonagem({
    id: h.id, name: h.name, className: h.className, ancestry: h.ancestry, look: h.look,
    abilities: h.abilities, skills, armor: armadura, shield: escudo, speedFt: h.speedFt,
    weapons: armas.length ? armas : ['adaga'],
    ...(spellcasting ? { spellcasting } : {}),
  }, { classe: h.classe, nivel: 1, escolhas });

  // O que a raça e o talento dão e a classe não sabe.
  const extraPv = (h.racial?.pvPorNivel ?? 0) + (escolha.talento === 'vigoroso' ? 2 : 0);
  if (extraPv) { c.maxHp += extraPv; c.hp = c.maxHp; }
  if (h.racial?.resistencias) c.resistances = [...new Set([...(c.resistances ?? []), ...h.racial.resistencias])];
  c.bag = bag;
  c.offhandWeapon = null;
  c.equippedWeapon = c.weapons[0];
  c.raca = h.raca;
  c.blurb = `${h.raca}, ${h.antecedente.toLowerCase()}.`;
  // A escolha inteira, inclusive o que o motor ainda não joga.
  c.escolhaDeCriacao = structuredClone(escolha);
  c.talentos = [escolha.talento];
  aplicarTalento(c, h, escolha);
  if (sub && !sub.motor) c.subclasseDoLivro = sub.id;
  return c;
}

const INSTRUMENTOS = ['alaude', 'lira', 'flauta', 'tambor', 'trompa', 'viola', 'dulcimer', 'charamela', 'flautaDePa'];
const FERRAMENTAS_DO_ARTESAO = ['ferramentasDeFerreiro', 'ferramentasDeCarpinteiro', 'ferramentasDeCouro'];

/**
 * O que o talento de origem põe na ficha. A regra em combate mora em
 * `rules/talentos.js`; aqui só o que vem de saída: arma, item, magia, treino.
 */
function aplicarTalento(c, h, escolha) {
  const poe = (id, qtd = 1) => {
    if (!c.bag.some((b) => b.id === id)) c.bag.push({ id, tipo: 'item', qtd });
  };
  switch (escolha.talento) {
    case 'brigaoDeTaverna':
      if (!c.weapons.includes('punhos')) c.weapons.push('punhos');
      break;
    case 'curandeiro':
      poe('kitDeCura');
      break;
    case 'artesao':
      c.ferramentasTreinadas = [...new Set([...(c.ferramentasTreinadas ?? []), ...FERRAMENTAS_DO_ARTESAO])];
      break;
    case 'musico': {
      const tem = INSTRUMENTOS.filter((i) => c.bag.some((b) => b.id === i));
      if (!tem.length) poe('flauta');
      // Três instrumentos: os que já carrega primeiro, depois os comuns.
      c.ferramentasTreinadas = [...new Set([...(c.ferramentasTreinadas ?? []),
        ...[...(tem.length ? tem : ['flauta']), 'flauta', 'alaude', 'tambor'].filter((i, n, xs) => xs.indexOf(i) === n).slice(0, 3)])];
      break;
    }
    case 'iniciadoEmMagia': {
      const ini = escolha.iniciado ?? escolhaDoIniciado(h);
      const truques = ini.truques.filter(magiaTemRegra);
      const magia = magiaTemRegra(ini.magia) ? ini.magia : null;
      if (c.spellcasting) {
        // Já conjura: as magias do talento entram na lista dele, sempre
        // preparadas, conjuradas com o atributo que ele já usa.
        c.spellcasting.cantrips = [...new Set([...(c.spellcasting.cantrips ?? []), ...truques])];
        if (magia) c.spellcasting.sempreProntas = [...new Set([...(c.spellcasting.sempreProntas ?? []), magia])];
      } else {
        // Não conjura: ganha uma conjuração mínima, sem espaço de magia — a
        // magia de 1º círculo sai só pela vez grátis do talento.
        c.spellcasting = {
          ability: atributoDoIniciado(c.abilities), cantrips: truques, prepared: [],
          sempreProntas: magia ? [magia] : [], slots: [0], slotsMax: [0],
        };
      }
      if (magia) c.magiaGratis = { id: magia, usada: false };
      break;
    }
    default:
  }
}

export { HEROIS };
