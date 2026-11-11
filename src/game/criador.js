// O CRIADOR DE PERSONAGEM: o jogador faz o próprio herói — nome, raça, classe, antecedente, atributos, perícias e a
// imagem da ficha — em vez de escolher um dos doze prontos (que continuam lá, para quem não quer criar nada).
//
// O que sai daqui é uma DEFINIÇÃO no mesmo formato de `game/herois.js` (id, name, classe, raca, abilities, skills…).
// Daí para a frente o herói criado anda pelo mesmo caminho dos prontos: a tela de preparo (talento, magias,
// equipamento, subclasse) e `criacao.js montarHeroi`, que passa pelo motor de progressão. Nada de regra nova aqui:
// só a montagem das escolhas que o Livro do Jogador deixa fazer antes do 1º nível.
//
// REGRAS
//   raças       as do Livro do Jogador que o motor já joga (`rules/racas.js`). O HUMANO VARIANTE (desde 2026-11-09):
//               +1 em dois atributos quaisquer, uma perícia qualquer e um talento do Livro do Jogador de 2014
//               (`rules/talentos-phb.js`) no 1º nível, ALÉM do talento de origem que todo herói ganha (regra da casa);
//               o pré-requisito do talento se confere no herói do 1º nível, e o de origem não pode ser a versão de
//               2024 do mesmo talento (`criacao.js` cuida disso no preparo)
//   atributos   conjunto padrão (15, 14, 13, 12, 10, 8) ou compra de 27 pontos (8 a 15), mais o bônus da raça.
//               O meio-elfo escolhe mais dois +1 (fora o Carisma) e duas perícias quaisquer
//   antecedente os treze do Livro do Jogador (os quatro do SRD 5.2 e, desde 2026-11-09, os outros nove: Charlatão,
//               Artista, Herói do Povo, Artesão de Guilda, Eremita, Nobre, Forasteiro, Marinheiro, Órfão). Dão as duas
//               perícias do livro e sugerem um talento de origem — o que o livro de 2024 dá ao antecedente de mesmo nome,
//               ou ao mais parecido com ele quando o nome mudou —; o talento é escolhido na tela de preparo, como nos
//               prontos (regra da casa). O aumento de atributo do antecedente de 2024 NÃO entra: os atributos já
//               levam o bônus da raça de 2014, e os dois juntos dariam pontos demais.
//   perícias    as da classe, à escolha, mais as do antecedente e as da raça (o motor põe as da raça sozinho)
//
// A imagem: `arte` é uma imagem pequena (webp em data URL) que vai na definição. A ficha do tabuleiro a recorta no
// círculo e o jogo põe o anel em volta — o modelo do anel dinâmico do Foundry, em que o jogador manda só a arte.
// `look` é `arte:<id>`, e `art/arte-propria.js` faz o retrato sair dela em toda tela que pede um.
//
// Puro: roda em Node.

import { CLASSES } from '../rules/classes/index.js';
import { RACAS, ANCESTRALIDADES_DRACONICAS, racaDe } from '../rules/racas.js';
import { SKILLS, SKILL_NAME, ABILITY_NAME } from '../rules/abilities.js';
import { TALENTOS_PHB, porqueNaoTalento } from '../rules/talentos-phb.js';

export const ATRIBUTOS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
export const CONJUNTO_PADRAO = [15, 14, 13, 12, 10, 8];
export const PONTOS = 27;
export const CUSTO_DO_PONTO = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
export const MAX_NOME = 24;
export const MAX_HISTORIA = 600;

/** Os treze antecedentes do Livro do Jogador. `talento` e `iniciado` são a sugestão do livro de 2024 para o padrão. */
export const ANTECEDENTES = {
  acolito: { nome: 'Acólito', nomeF: 'Acólita', pericias: ['intuicao', 'religiao'], talento: 'iniciadoEmMagia', iniciado: 'clerigo',
    resumo: 'Serviu num templo: conhece os ritos e lê as pessoas.' },
  criminoso: { nome: 'Criminoso', nomeF: 'Criminosa', pericias: ['prestidigitacao', 'furtividade'], talento: 'alerta',
    resumo: 'Viveu do outro lado da lei: mãos leves e passos que não se ouvem.' },
  sabio: { nome: 'Sábio', nomeF: 'Sábia', pericias: ['arcanismo', 'historia'], talento: 'iniciadoEmMagia', iniciado: 'mago',
    resumo: 'Anos de biblioteca: sabe o que os livros dizem do mundo e da magia.' },
  soldado: { nome: 'Soldado', nomeF: 'Soldado', pericias: ['atletismo', 'intimidacao'], talento: 'atacanteSelvagem',
    resumo: 'Marchou em fileira e voltou: corpo treinado e voz de comando.' },
  // Os outros nove do Livro do Jogador. O talento: o do antecedente de 2024 de mesmo nome (Charlatão, Artista, Eremita,
  // Nobre, Marinheiro) ou do mais parecido (Herói do Povo -> Fazendeiro, Artesão de Guilda -> Artesão, Forasteiro ->
  // Guia, Órfão -> Andarilho).
  charlatao: { nome: 'Charlatão', nomeF: 'Charlatã', pericias: ['enganacao', 'prestidigitacao'], talento: 'habilidoso',
    resumo: 'Vive de enganar: rosto de confiança, mãos rápidas e uma história pronta para cada ocasião.' },
  artista: { nome: 'Artista', nomeF: 'Artista', pericias: ['acrobacia', 'atuacao'], talento: 'musico',
    resumo: 'Ganha a vida no palco e na praça: sabe prender uma plateia e cair de pé.' },
  heroiDoPovo: { nome: 'Herói do Povo', nomeF: 'Heroína do Povo', pericias: ['lidarComAnimais', 'sobrevivencia'], talento: 'vigoroso',
    resumo: 'Gente simples que um dia enfrentou o que ninguém enfrentava: o povo o reconhece e o abriga.' },
  artesaoDeGuilda: { nome: 'Artesão de Guilda', nomeF: 'Artesã de Guilda', pericias: ['intuicao', 'persuasao'], talento: 'artesao',
    resumo: 'Aprendeu um ofício numa guilda: sabe negociar, e a guilda abre portas onde houver uma.' },
  eremita: { nome: 'Eremita', nomeF: 'Eremita', pericias: ['medicina', 'religiao'], talento: 'curandeiro',
    resumo: 'Anos de isolamento: cuida de feridas, reza sozinho e guarda uma descoberta que mudou tudo.' },
  nobre: { nome: 'Nobre', nomeF: 'Nobre', pericias: ['historia', 'persuasao'], talento: 'habilidoso',
    resumo: 'Nasceu com nome e brasão: sabe falar com quem manda, e quem manda o recebe.' },
  forasteiro: { nome: 'Forasteiro', nomeF: 'Forasteira', pericias: ['atletismo', 'sobrevivencia'], talento: 'iniciadoEmMagia', iniciado: 'druida',
    resumo: 'Cresceu longe das cidades: acha água e caça onde outros passam fome, e nunca se perde.' },
  marinheiro: { nome: 'Marinheiro', nomeF: 'Marinheira', pericias: ['atletismo', 'percepcao'], talento: 'brigaoDeTaverna',
    resumo: 'Anos de convés e de porto: braço forte, olho de vigia e briga de taverna no currículo.' },
  orfao: { nome: 'Órfão', nomeF: 'Órfã', pericias: ['prestidigitacao', 'furtividade'], talento: 'sortudo',
    resumo: 'Cresceu nas ruas sozinho: passa despercebido e conhece os atalhos da cidade.' },
};

/**
 * O PORQUÊ DE IR A PHANDALIN, por antecedente. O Obelisco sugere um gancho para cada antecedente do Livro do Jogador; o
 * herói criado sai com o do antecedente dele (o capítulo 1 mostra o motivo de cada um na carroça), e os doze heróis
 * prontos já têm o seu, escrito para eles (`herois.js`). Texto nosso: a ideia do gancho é do livro, a frase não.
 */
export const MOTIVO_DO_ANTECEDENTE = {
  acolito: 'O templo de Neverwinter mandou alguém rezar com os poucos fiéis da fronteira, onde não há sacerdote que chegue para todos.',
  criminoso: 'Em Neverwinter há quem o procure por coisas que fez. Uma vila pequena e longe é o melhor lugar para sumir por um tempo.',
  sabio: 'Leu tudo o que as bibliotecas de Neverwinter guardam sobre a mina perdida de Phandelver, e quer ouvir o que os moradores contam dela.',
  soldado: 'Ferido a serviço da guarda de Neverwinter, ainda não voltou às fileiras; até lá, escolta carroças pela estrada de Phandalin.',
  // os nove de 2026-11-09: texto nosso, sem gancho do livro por trás
  charlatao: 'Um golpe em Neverwinter deu errado demais; dizem que em Phandalin os mineiros pagam bem e perguntam pouco.',
  artista: 'Uma vila de garimpo que volta a crescer é plateia nova: ninguém ali ouviu as canções que ele sabe.',
  heroiDoPovo: 'O povo da fronteira pediu ajuda contra os goblins da estrada, e ele não é de recusar quando pedem.',
  artesaoDeGuilda: 'A guilda quer saber se as minas reabertas de Phandalin dão metal bom, e mandou alguém olhar de perto.',
  eremita: 'O que ele achou no isolamento aponta para as colinas em volta de Phandalin, e não deixa de chamá-lo.',
  nobre: 'A família tem terras e dívidas na fronteira; alguém do sangue precisa ir ver o que sobrou delas.',
  forasteiro: 'Conhece as trilhas da Floresta de Neverwinter melhor que ninguém, e quem precisa de um guia até Phandalin paga.',
  marinheiro: 'Desembarcou em Neverwinter sem navio e sem dinheiro; a escolta de uma carroça é o trabalho que apareceu.',
  orfao: 'Ouviu nas ruas de Neverwinter que em Phandalin sobra trabalho para quem não tem nome, e foi.',
};

/** As raças que o criador oferece, na ordem da tela. */
export const RACAS_DO_CRIADOR = ['humano', 'humanoVariante', 'anaoColina', 'anaoMontanha', 'altoElfo', 'elfoFloresta', 'drow', 'halflingPesLeves',
  'halflingRobusto', 'draconato', 'gnomoFloresta', 'gnomoRochas', 'meioElfo', 'meioOrc', 'tiferino'];

// O nome da raça e da classe no feminino. O texto da raça é o que a mesa diz ("Anã da montanha"); o motor reconhece a
// raça pelo texto e pelo grupo juntos (`racaDe`), e é por isso que o grupo vai em `ancestry`, no masculino do livro.
const RACA_F = {
  humano: 'Humana', humanoVariante: 'Humana (variante)', anaoColina: 'Anã da colina', anaoMontanha: 'Anã da montanha', altoElfo: 'Alta elfa',
  elfoFloresta: 'Elfa da floresta', drow: 'Elfa negra (drow)', halflingPesLeves: 'Halfling pés-leves',
  halflingRobusto: 'Halfling robusta', draconato: 'Draconata', gnomoFloresta: 'Gnoma da floresta', gnomoRochas: 'Gnoma das rochas',
  meioElfo: 'Meio-elfa', meioOrc: 'Meio-orc', tiferino: 'Tiferina',
};
const CLASSE_F = {
  barbaro: 'Bárbara', bardo: 'Barda', bruxo: 'Bruxa', clerigo: 'Clériga', druida: 'Druida', feiticeiro: 'Feiticeira',
  guerreiro: 'Guerreira', ladino: 'Ladina', mago: 'Maga', monge: 'Monja', paladino: 'Paladina', patrulheiro: 'Patrulheira',
};
// A cor do dragão, no gênero do herói: "Draconato vermelho", "Draconata vermelha", "de latão" para os dois.
const COR = {
  negro: ['negro', 'negra'], azul: ['azul', 'azul'], latao: ['de latão', 'de latão'], bronze: ['de bronze', 'de bronze'],
  cobre: ['de cobre', 'de cobre'], ouro: ['de ouro', 'de ouro'], verde: ['verde', 'verde'], vermelho: ['vermelho', 'vermelha'],
  prata: ['de prata', 'de prata'], branco: ['branco', 'branca'],
};
export const CORES_DO_DRACONATO = Object.keys(ANCESTRALIDADES_DRACONICAS);

/** Para o conjunto padrão automático: os atributos de cada classe, do mais importante ao menos. */
const PRIORIDADE = {
  barbaro: ['str', 'con', 'dex', 'wis', 'cha', 'int'], bardo: ['cha', 'dex', 'con', 'wis', 'int', 'str'],
  bruxo: ['cha', 'con', 'dex', 'wis', 'int', 'str'], clerigo: ['wis', 'con', 'str', 'dex', 'cha', 'int'],
  druida: ['wis', 'con', 'dex', 'int', 'cha', 'str'], feiticeiro: ['cha', 'con', 'dex', 'wis', 'int', 'str'],
  guerreiro: ['str', 'con', 'dex', 'wis', 'cha', 'int'], ladino: ['dex', 'con', 'wis', 'int', 'cha', 'str'],
  mago: ['int', 'con', 'dex', 'wis', 'cha', 'str'], monge: ['dex', 'wis', 'con', 'str', 'int', 'cha'],
  paladino: ['str', 'cha', 'con', 'wis', 'dex', 'int'], patrulheiro: ['dex', 'wis', 'con', 'str', 'int', 'cha'],
};
/** O antecedente que combina com cada classe, para o primeiro rascunho. */
const ANTECEDENTE_DA_CLASSE = {
  barbaro: 'forasteiro', bardo: 'criminoso', bruxo: 'sabio', clerigo: 'acolito', druida: 'eremita', feiticeiro: 'sabio',
  guerreiro: 'soldado', ladino: 'criminoso', mago: 'sabio', monge: 'eremita', paladino: 'nobre', patrulheiro: 'forasteiro',
};

export const nomeDaRaca = (raca, sexo, cor = 'vermelho') => {
  const base = sexo === 'F' ? RACA_F[raca] : RACAS[raca]?.nome;
  if (raca !== 'draconato') return base ?? raca;
  return `${base} ${COR[cor]?.[sexo === 'F' ? 1 : 0] ?? cor}`;
};
export const nomeDaClasse = (classe, sexo) => (sexo === 'F' ? CLASSE_F[classe] : CLASSES[classe]?.nome) ?? classe;
export const nomeDoAntecedente = (id, sexo) => (sexo === 'F' ? ANTECEDENTES[id]?.nomeF : ANTECEDENTES[id]?.nome) ?? id;

/** O conjunto padrão posto na ordem da classe. */
export function padraoDaClasse(classe) {
  const ordem = PRIORIDADE[classe] ?? ATRIBUTOS;
  return Object.fromEntries(ordem.map((a, i) => [a, CONJUNTO_PADRAO[i]]));
}

/** As perícias que a classe deixa escolher, e quantas. */
export function periciasDaClasse(classe) {
  const p = CLASSES[classe]?.pericias;
  if (!p) return { quantas: 0, de: [] };
  return { quantas: p.quantas, de: p.de === 'qualquer' || !p.de ? Object.keys(SKILLS) : p.de };
}

/** As perícias que já vêm sem escolha: as do antecedente e as da raça. */
export function periciasFixas(r) {
  return [...new Set([...(ANTECEDENTES[r.antecedente]?.pericias ?? []), ...(RACAS[r.raca]?.pericias ?? [])])];
}

/** Um rascunho novo, já válido: guerreira humana, soldado, conjunto padrão. */
export function novoRascunho(classe = 'guerreiro') {
  const r = {
    nome: '', sexo: 'F', raca: 'humano', cor: 'vermelho', classe, antecedente: ANTECEDENTE_DA_CLASSE[classe] ?? 'soldado',
    metodo: 'padrao', base: padraoDaClasse(classe), livres: [], periciasEscolhidas: [], periciasLivres: [],
    talentoVariante: null, historia: '', arte: null,
  };
  r.periciasEscolhidas = sugerirPericias(r);
  return r;
}

/** Troca a classe e refaz o que depende dela (atributos no conjunto padrão, perícias). */
export function trocarClasse(r, classe) {
  r.classe = classe;
  if (r.metodo === 'padrao') r.base = padraoDaClasse(classe);
  r.periciasEscolhidas = sugerirPericias(r);
}

/** As perícias da classe que o rascunho ainda pode escolher, as primeiras que não vêm de outro lugar. */
export function sugerirPericias(r) {
  const { quantas, de } = periciasDaClasse(r.classe);
  const fixas = periciasFixas(r);
  const ja = (r.periciasEscolhidas ?? []).filter((s) => de.includes(s) && !fixas.includes(s));
  for (const s of de) {
    if (ja.length >= quantas) break;
    if (!fixas.includes(s) && !ja.includes(s)) ja.push(s);
  }
  return ja.slice(0, quantas);
}

/** Quantos pontos a compra está gastando. */
export const custoDosPontos = (base) => ATRIBUTOS.reduce((s, a) => s + (CUSTO_DO_PONTO[base[a]] ?? 99), 0);

/** Quantos +1 livres e quantas perícias livres a raça dá (o meio-elfo: dois e duas; o humano variante: dois e uma). */
export const LIVRES_DA_RACA = { meioElfo: { atributos: 2, pericias: 2, semCarisma: true }, humanoVariante: { atributos: 2, pericias: 1 } };

/** Os atributos finais: a base, o bônus da raça e os +1 livres (meio-elfo, humano variante). */
export function atributosFinais(r) {
  const bonus = RACAS[r.raca]?.atributos ?? {};
  const livres = LIVRES_DA_RACA[r.raca] ? (r.livres ?? []) : [];
  const out = {};
  for (const a of ATRIBUTOS) out[a] = (r.base[a] ?? 8) + (bonus[a] ?? 0) + (livres.includes(a) ? 1 : 0);
  return out;
}

/**
 * O herói do 1º nível, do jeito que o pré-requisito do talento o vê: os atributos finais, o treino de armadura da classe
 * e se ele já conjura no 1º nível (bardo, bruxo, clérigo, druida, feiticeiro, mago; o paladino e o patrulheiro só no 2º).
 */
function heroiDoPrimeiroNivel(r) {
  const def = CLASSES[r.classe];
  const conjura = (def?.niveis?.[1] ?? []).some((f) => f === 'spellcasting' || f === 'pactMagic');
  return {
    abilities: atributosFinais(r), classe: r.classe, talentos: [], features: [],
    armorTraining: [...(def?.armaduras ?? [])], weaponTraining: [...(def?.armas ?? [])], skills: [],
    spellcasting: conjura ? { cantrips: [], prepared: [], sempreProntas: [], slotsMax: [0, 1] } : null,
  };
}

/** Os talentos que o humano variante pode tomar no 1º nível, com o motivo dos que não pode: [{ id, motivo }]. */
export function talentosDoVariante(r) {
  const c = heroiDoPrimeiroNivel(r);
  return Object.keys(TALENTOS_PHB).map((id) => ({ id, motivo: porqueNaoTalento(c, id) }));
}

/** O que falta para o rascunho virar herói: lista de frases (vazia = pode seguir). */
export function problemasDoRascunho(r) {
  const p = [];
  const nome = String(r.nome ?? '').trim();
  if (!nome) p.push('Dê um nome ao herói.');
  else if ([...nome].length > MAX_NOME) p.push(`O nome passa de ${MAX_NOME} letras.`);
  if (!RACAS_DO_CRIADOR.includes(r.raca)) p.push('Escolha a raça.');
  if (r.raca === 'draconato' && !CORES_DO_DRACONATO.includes(r.cor)) p.push('Escolha a cor do dragão.');
  if (!CLASSES[r.classe]) p.push('Escolha a classe.');
  if (!ANTECEDENTES[r.antecedente]) p.push('Escolha o antecedente.');
  const valores = ATRIBUTOS.map((a) => r.base?.[a]);
  if (r.metodo === 'padrao') {
    const ordenados = [...valores].sort((a, b) => b - a);
    if (ordenados.join() !== CONJUNTO_PADRAO.join()) p.push('No conjunto padrão, cada valor (15, 14, 13, 12, 10, 8) vai em um atributo.');
  } else if (r.metodo === 'pontos') {
    if (valores.some((v) => !(v in CUSTO_DO_PONTO))) p.push('Na compra de pontos, cada atributo vai de 8 a 15.');
    else if (custoDosPontos(r.base) > PONTOS) p.push(`A compra passou de ${PONTOS} pontos (${custoDosPontos(r.base)}).`);
  } else p.push('Escolha como distribuir os atributos.');
  const livresDaRaca = LIVRES_DA_RACA[r.raca];
  if (livresDaRaca) {
    const quem = r.raca === 'meioElfo' ? 'Meio-elfo' : 'Humano variante';
    const livres = [...new Set(r.livres ?? [])];
    if (livres.length !== livresDaRaca.atributos || (livresDaRaca.semCarisma && livres.includes('cha')) || livres.some((a) => !ATRIBUTOS.includes(a))) {
      p.push(`${quem}: escolha dois atributos${livresDaRaca.semCarisma ? ' (fora o Carisma)' : ' diferentes'} para ganhar +1.`);
    }
    const ok = (r.periciasLivres ?? []).filter((s) => SKILLS[s]);
    if (new Set(ok).size !== livresDaRaca.pericias) p.push(`${quem}: escolha ${livresDaRaca.pericias === 1 ? 'uma perícia qualquer' : 'duas perícias quaisquer'}.`);
  }
  if (r.raca === 'humanoVariante') {
    const t = r.talentoVariante;
    const motivo = !t?.id ? 'escolha o talento' : talentosDoVariante(r).find((x) => x.id === t.id)?.motivo ?? null;
    if (motivo) p.push(`Humano variante: ${t?.id && TALENTOS_PHB[t.id] ? `${motivo} (${t.id})` : motivo}.`);
    const lista = TALENTOS_PHB[t?.id]?.atributo;
    if (t?.id && Array.isArray(lista) && t.atributo && !lista.includes(t.atributo)) p.push('Humano variante: o +1 do talento vai num atributo que ele permite.');
  }
  const { quantas, de } = periciasDaClasse(r.classe);
  const fixas = periciasFixas(r);
  const escolhidas = [...new Set(r.periciasEscolhidas ?? [])];
  if (escolhidas.length !== quantas || escolhidas.some((s) => !de.includes(s) || fixas.includes(s))) {
    p.push(`Escolha ${quantas} perícias da classe (que o antecedente e a raça ainda não dão).`);
  }
  if ((r.periciasLivres ?? []).some((s) => escolhidas.includes(s) || fixas.includes(s))) p.push('Uma perícia escolhida se repete.');
  if (String(r.historia ?? '').length > MAX_HISTORIA) p.push(`A história passa de ${MAX_HISTORIA} letras.`);
  if (r.arte != null && !arteValida(r.arte)) p.push('A imagem da ficha não é uma imagem válida.');
  return p;
}

/** A imagem vem do navegador do jogador e vai para o save: só data URL de imagem, e pequena. */
export const MAX_ARTE = 80_000;
export const arteValida = (a) => typeof a === 'string' && a.length <= MAX_ARTE && /^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(a);

/** Um id novo para o herói criado. */
export const novoId = (aleatorio = Math.random) => `pc-criado-${Math.floor(aleatorio() * 36 ** 8).toString(36).padStart(8, '0')}`;

/** A definição do herói, no formato de `game/herois.js`. Supõe o rascunho sem problemas. */
export function definicaoDoRascunho(r, id = novoId()) {
  const raca = RACAS[r.raca];
  const sexo = r.sexo === 'M' ? 'M' : 'F';
  const skills = [...new Set([...r.periciasEscolhidas, ...periciasFixas(r), ...(LIVRES_DA_RACA[r.raca] ? r.periciasLivres : [])])];
  const historia = String(r.historia ?? '').trim();
  return {
    id, criado: true,
    name: String(r.nome).trim(),
    classe: r.classe, className: nomeDaClasse(r.classe, sexo),
    raca: nomeDaRaca(r.raca, sexo, r.cor), ancestry: raca.grupo, racaId: r.raca, sexo,
    look: `arte:${id}`,
    abilities: atributosFinais(r),
    skills,
    speedFt: raca.deslocamento,
    racial: {},
    antecedente: nomeDoAntecedente(r.antecedente, sexo), antecedenteId: r.antecedente,
    origem: `${nomeDaRaca(r.raca, sexo, r.cor)}, ${nomeDoAntecedente(r.antecedente, sexo).toLowerCase()}.`,
    historia: historia ? [historia] : [],
    motivo: MOTIVO_DO_ANTECEDENTE[r.antecedente] ?? '', traco: '', ideal: '', vinculo: '', defeito: '',
    arte: r.arte ?? null,
    // o TALENTO DO HUMANO VARIANTE, que `criacao.js montarHeroi` põe na ficha por cima do de origem
    ...(r.raca === 'humanoVariante' && r.talentoVariante?.id ? { talentoDaRaca: { ...r.talentoVariante } } : {}),
    // o rascunho inteiro, para editar depois do jeito que foi feito
    rascunho: { ...structuredClone({ ...r, arte: null }) },
  };
}

/** O rascunho de volta, de uma definição já criada (para editar). */
export function rascunhoDaDefinicao(def) {
  return { ...structuredClone(def.rascunho ?? novoRascunho(def.classe)), arte: def.arte ?? null };
}

/** Confere uma definição que veio de fora (o navegador, um save): o formato e o que o motor vai ler. */
export function definicaoValida(d) {
  if (!d || typeof d !== 'object' || !d.criado) return false;
  if (typeof d.id !== 'string' || !/^pc-criado-[a-z0-9]{1,12}$/.test(d.id)) return false;
  if (d.look !== `arte:${d.id}`) return false;
  if (typeof d.name !== 'string' || !d.name.trim() || [...d.name].length > MAX_NOME) return false;
  if (!CLASSES[d.classe] || !RACAS_DO_CRIADOR.includes(d.racaId) || racaDe(d) !== d.racaId) return false;
  if (!ATRIBUTOS.every((a) => Number.isInteger(d.abilities?.[a]) && d.abilities[a] >= 3 && d.abilities[a] <= 20)) return false;
  if (!Array.isArray(d.skills) || d.skills.some((s) => !SKILLS[s])) return false;
  if (d.arte != null && !arteValida(d.arte)) return false;
  if (d.talentoDaRaca != null && (d.racaId !== 'humanoVariante' || !TALENTOS_PHB[d.talentoDaRaca.id])) return false;
  return true;
}

export { SKILL_NAME, ABILITY_NAME };
