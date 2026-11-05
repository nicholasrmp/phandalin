// O CRIADOR DE PERSONAGEM: o jogador faz o próprio herói — nome, raça, classe, antecedente, atributos, perícias e a
// imagem da ficha — em vez de escolher um dos doze prontos (que continuam lá, para quem não quer criar nada).
//
// O que sai daqui é uma DEFINIÇÃO no mesmo formato de `game/herois.js` (id, name, classe, raca, abilities, skills…).
// Daí para a frente o herói criado anda pelo mesmo caminho dos prontos: a tela de preparo (talento, magias,
// equipamento, subclasse) e `criacao.js montarHeroi`, que passa pelo motor de progressão. Nada de regra nova aqui:
// só a montagem das escolhas que o Livro do Jogador deixa fazer antes do 1º nível.
//
// REGRAS
//   raças       as do Livro do Jogador que o motor já joga (`rules/racas.js`), menos o humano variante (talento e
//               perícia a mais pedem outra tela; fica para depois)
//   atributos   conjunto padrão (15, 14, 13, 12, 10, 8) ou compra de 27 pontos (8 a 15), mais o bônus da raça.
//               O meio-elfo escolhe mais dois +1 (fora o Carisma) e duas perícias quaisquer
//   antecedente os quatro do SRD 5.2 (CC-BY-4.0): Acólito, Criminoso, Sábio, Soldado. Dão duas perícias e sugerem o
//               talento de origem que o livro de 2024 lhes dá — o talento é escolhido na tela de preparo, como nos
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

export const ATRIBUTOS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
export const CONJUNTO_PADRAO = [15, 14, 13, 12, 10, 8];
export const PONTOS = 27;
export const CUSTO_DO_PONTO = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
export const MAX_NOME = 24;
export const MAX_HISTORIA = 600;

/** Os quatro antecedentes do SRD 5.2. `talento` e `iniciado` são a sugestão do livro de 2024 para o padrão. */
export const ANTECEDENTES = {
  acolito: { nome: 'Acólito', nomeF: 'Acólita', pericias: ['intuicao', 'religiao'], talento: 'iniciadoEmMagia', iniciado: 'clerigo',
    resumo: 'Serviu num templo: conhece os ritos e lê as pessoas.' },
  criminoso: { nome: 'Criminoso', nomeF: 'Criminosa', pericias: ['prestidigitacao', 'furtividade'], talento: 'alerta',
    resumo: 'Viveu do outro lado da lei: mãos leves e passos que não se ouvem.' },
  sabio: { nome: 'Sábio', nomeF: 'Sábia', pericias: ['arcanismo', 'historia'], talento: 'iniciadoEmMagia', iniciado: 'mago',
    resumo: 'Anos de biblioteca: sabe o que os livros dizem do mundo e da magia.' },
  soldado: { nome: 'Soldado', nomeF: 'Soldado', pericias: ['atletismo', 'intimidacao'], talento: 'atacanteSelvagem',
    resumo: 'Marchou em fileira e voltou: corpo treinado e voz de comando.' },
};

/** As raças que o criador oferece, na ordem da tela. */
export const RACAS_DO_CRIADOR = ['humano', 'anaoColina', 'anaoMontanha', 'altoElfo', 'elfoFloresta', 'drow', 'halflingPesLeves',
  'halflingRobusto', 'draconato', 'gnomoFloresta', 'gnomoRochas', 'meioElfo', 'meioOrc', 'tiferino'];

// O nome da raça e da classe no feminino. O texto da raça é o que a mesa diz ("Anã da montanha"); o motor reconhece a
// raça pelo texto e pelo grupo juntos (`racaDe`), e é por isso que o grupo vai em `ancestry`, no masculino do livro.
const RACA_F = {
  humano: 'Humana', anaoColina: 'Anã da colina', anaoMontanha: 'Anã da montanha', altoElfo: 'Alta elfa',
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
  barbaro: 'soldado', bardo: 'criminoso', bruxo: 'sabio', clerigo: 'acolito', druida: 'acolito', feiticeiro: 'sabio',
  guerreiro: 'soldado', ladino: 'criminoso', mago: 'sabio', monge: 'acolito', paladino: 'soldado', patrulheiro: 'soldado',
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
    historia: '', arte: null,
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

/** Os atributos finais: a base, o bônus da raça e os +1 livres do meio-elfo. */
export function atributosFinais(r) {
  const bonus = RACAS[r.raca]?.atributos ?? {};
  const out = {};
  for (const a of ATRIBUTOS) out[a] = (r.base[a] ?? 8) + (bonus[a] ?? 0) + (r.raca === 'meioElfo' && r.livres?.includes(a) ? 1 : 0);
  return out;
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
  if (r.raca === 'meioElfo') {
    const livres = [...new Set(r.livres ?? [])];
    if (livres.length !== 2 || livres.includes('cha') || livres.some((a) => !ATRIBUTOS.includes(a))) {
      p.push('Meio-elfo: escolha dois atributos (fora o Carisma) para ganhar +1.');
    }
    const ok = (r.periciasLivres ?? []).filter((s) => SKILLS[s]);
    if (new Set(ok).size !== 2) p.push('Meio-elfo: escolha duas perícias quaisquer.');
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
  const skills = [...new Set([...r.periciasEscolhidas, ...periciasFixas(r), ...(r.raca === 'meioElfo' ? r.periciasLivres : [])])];
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
    motivo: '', traco: '', ideal: '', vinculo: '', defeito: '',
    arte: r.arte ?? null,
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
  return true;
}

export { SKILL_NAME, ABILITY_NAME };
