// AS MAGIAS DOS LIVROS COMO DADO: o irmão de `importar-bestiario.mjs`. Os NÚMEROS saem do dado do 5etools (círculo,
// escola, tempo, alcance, área, teste, dano e tipo, condição, duração, concentração, o que sobe em círculo maior); o
// TEXTO sai de `magias/<livro>-pt.json` (`traduzir-magias.mjs`, com as nossas palavras). Escreve
// `src/rules/magias-livro-<livro>.js`, que entra em `SPELLS` ANTES das magias feitas à mão (a feita à mão vence).
//
//   node src/dev/importar-magias.mjs phb
//
// Cada magia cai num dos tipos que o motor já conjura (`attack`, `save` com ou sem área, `debuff`, `heal`); a que não
// cabe em nenhum entra com o texto e `semMotor: true` — aparece na ficha e o motor a recusa ("ainda sem efeito no
// jogo"), em vez de fingir. A lista do que falta vai para `magias/<livro>-pendente.json`: é a fila do motor.
// E `bestiario/magias-en.json` ganha o de-para, para o conjurador do bestiário passar a ter estas magias.
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

/** As magias que mudariam o mundo de um jeito que o tabuleiro ainda não guarda: ficam fora do jogo (a regra do dono). */
const SO_SE_NARRARIAM = new Set(['Stone Shape', 'Move Earth', 'Control Water', 'Control Weather', 'Creation', 'Hallucinatory Terrain',
  'Mirage Arcane', 'Project Image', 'Programmed Illusion', 'Dream',
  // as de CONVERSA do Acquisitions Incorporated (lembrar outra fala, o serviço do enfeitiçado): numa luta não fazem nada
  'Fast Friends', 'Gift of Gab',
  // as de UMA AÇÃO do PHB que só abrem o que o jogo não tem: o semiplano vazio, o portal para outro plano, o baú guardado
  // no etéreo, o esconderijo mágico de um objeto (2026-11-16)
  'Demiplane', 'Gate', "Leomund's Secret Chest", 'Sequester',
  // as do Xanathar que só mudariam o que o tabuleiro não guarda: a forma da água, as letras no céu
  'Shape Water', 'Skywrite']);

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const LIVRO = (process.argv[2] ?? 'phb').toLowerCase();
const lerJson = (p, reserva) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return reserva; } };

const ESCOLA = { A: 'abjuração', C: 'conjuração', D: 'adivinhação', E: 'encantamento', V: 'evocação', I: 'ilusão', N: 'necromancia', T: 'transmutação' };
const DANO = {
  slashing: 'cortante', piercing: 'perfurante', bludgeoning: 'concussão', fire: 'fogo', cold: 'frio',
  lightning: 'elétrico', thunder: 'trovejante', acid: 'ácido', poison: 'veneno', necrotic: 'necrótico',
  radiant: 'radiante', force: 'energético', psychic: 'psíquico',
};
const CONDICAO = {
  blinded: 'cego', charmed: 'enfeiticado', deafened: 'surdo', frightened: 'amedrontado', grappled: 'agarrado',
  incapacitated: 'incapacitado', invisible: 'invisivel', paralyzed: 'paralisado', petrified: 'petrificado',
  poisoned: 'envenenado', prone: 'caido', restrained: 'contido', stunned: 'atordoado', unconscious: 'inconsciente',
};
const ATRIBUTO = { strength: 'str', dexterity: 'dex', constitution: 'con', intelligence: 'int', wisdom: 'wis', charisma: 'cha' };
const idDe = (nome) => nome.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/)
  .map((w, i) => (i ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase())).join('');
const semTags = (s) => String(s ?? '').replace(/\{@(\w+) ([^}]*)\}/g, (_, tag, tudo) => tudo.split('|')[0]);
const texto = (e) => (Array.isArray(e) ? e.map(texto).join(' ') : typeof e === 'string' ? e : e?.entries ? texto(e.entries) : e?.items ? texto(e.items) : e?.entry ? texto(e.entry) : '');

/** O tempo de conjuração: ação, ação bônus, reação, ou minutos (que só cabem fora da luta). */
export function tempo(s) {
  const t = s.time?.[0] ?? { unit: 'action' };
  if (t.unit === 'bonus') return { castTime: 'bonus' };
  if (t.unit === 'reaction') return { castTime: 'reaction' };
  if (t.unit === 'minute') return { castTime: 'action', minutos: t.number, soFora: true };
  if (t.unit === 'hour') return { castTime: 'action', minutos: t.number * 60, soFora: true };
  return { castTime: 'action' };
}

/** O alcance em pés: pessoal 0, toque 5, milhas convertidas, visão e ilimitado como "longe". */
export function alcance(s) {
  const r = s.range ?? {};
  if (r.type === 'point') {
    const d = r.distance ?? {};
    if (d.type === 'self') return 0;
    if (d.type === 'touch') return 5;
    if (d.type === 'feet') return d.amount;
    if (d.type === 'miles') return d.amount * 5280;
    return 1000;
  }
  return 0;
}

/** A área, lida do texto: esfera, cone, cubo, linha, cilindro (que no tabuleiro é a esfera do mesmo raio). */
export function area(txt) {
  const t = semTags(txt);
  let m = t.match(/(\d+)-foot-radius sphere/) ?? t.match(/(\d+)-foot[- ]radius(?:,? [\d-]+foot[- ]high)? cylinder/) ?? t.match(/sphere with a (\d+)-foot radius/) ?? t.match(/(\d+)-foot radius/);
  if (m) return { shape: 'sphere', areaFt: Number(m[1]) };
  m = t.match(/(\d+)-foot cone/);
  if (m) return { shape: 'cone', areaFt: Number(m[1]) };
  m = t.match(/(\d+)-foot cube/);
  if (m) return { shape: 'cube', areaFt: Number(m[1]) };
  m = t.match(/line (\d+) feet long and (\d+) feet wide/) ?? t.match(/(\d+)-foot-long, (\d+)-foot-wide line/);
  if (m) return { shape: 'linha', areaFt: Number(m[1]), larguraFt: Number(m[2]) };
  return null;
}

/** A duração: rodadas (1 minuto = 10), e se pede concentração. */
export function duracao(s) {
  const d = s.duration?.[0] ?? {};
  if (d.type !== 'timed') return {};
  const q = d.duration ?? {};
  const rodadas = { round: 1, minute: 10, hour: 600, day: 14400 }[q.type] * (q.amount ?? 1);
  return { ...(d.concentration ? { concentration: true } : {}), ...(rodadas ? { duracaoRodadas: rodadas } : {}) };
}

/** O que sobe em círculo maior: "+1d8 por círculo" (dados), ou "+1 alvo por círculo". */
export function emCirculoMaior(s) {
  const t = texto(s.entriesHigherLevel ?? []);
  const sobe = t.match(/\{@scaledamage ([^|]+)\|[^|]+\|(\d+)d(\d+)\}/);
  if (sobe) {
    const base = sobe[1].match(/(\d+)d(\d+)/);
    if (base && base[2] === sobe[3]) return { dados: Number(sobe[2]) };
  }
  if (/one additional creature for each slot level/.test(t)) return { alvos: 1 };
  return null;
}

/**
 * A MECÂNICA: em que tipo do motor a magia cabe. Devolve os campos, ou `null` quando ela não cabe em nenhum (e entra
 * sem motor). O que se lê: ataque de magia; teste com dano (em área ou num alvo); teste com condição; cura.
 */
export function mecanica(s) {
  const t = texto(s.entries);
  const danos = [...t.matchAll(/\{@damage ([^}]+)\}/g)].map((x) => x[1].replace(/\s+/g, ''));
  const tipos = (s.damageInflict ?? []).map((x) => DANO[x]).filter(Boolean);
  const save = ATRIBUTO[s.savingThrow?.[0]];
  const cond = (s.conditionInflict ?? []).map((x) => CONDICAO[x]).find(Boolean);
  const ar = area(t);
  const repete = /repeat the saving throw/.test(t);
  const dano = danos[0] && tipos[0] ? { damage: danos[0], damageType: tipos[0], ...(danos[1] && tipos[1] ? { damage2: danos[1], damageType2: tipos[1] } : {}) } : null;
  if (s.spellAttack?.length && dano) {
    return { kind: 'attack', ...(s.spellAttack[0] === 'M' ? { melee: true } : {}), ...dano };
  }
  if (save && dano) {
    return {
      kind: 'save', save, ...dano, halfOnSave: /half as much damage/.test(t), ...(ar ?? {}),
      ...(cond ? { onFail: { condition: cond, rounds: duracao(s).duracaoRodadas ?? 1, repete } } : {}),
    };
  }
  if (save && cond) {
    if (ar) return { kind: 'save', save, ...ar, onFail: { condition: cond, rounds: duracao(s).duracaoRodadas ?? 10, repete } };
    const varios = t.match(/up to (\w+) creatures/);
    const n = { two: 2, three: 3, four: 4, five: 5, six: 6, ten: 10, twelve: 12 }[varios?.[1]] ?? 1;
    return { kind: 'debuff', targets: n, save, condition: cond, ...(repete ? { repete: true } : {}) };
  }
  const cura = t.match(/regains? (?:a number of )?hit points equal to \{@dice ([^}]+)\}/) ?? t.match(/regains? \{@dice ([^}]+)\} hit points/);
  if (cura && !save) {
    const muitos = /(?:up to (\w+)|any number of) creatures/.exec(t);
    return { kind: muitos ? 'healGrupo' : 'heal', heal: cura[1].replace(/\s*\+\s*your spellcasting ability modifier/, '').replace(/\s+/g, ''), ...(/spellcasting ability modifier/.test(t) ? { addSpellMod: true } : {}), ...(muitos ? { targets: 6 } : {}) };
  }
  return null;
}

/**
 * A NOTA DE CADA MAGIA NOVA (`tom`, que `core/audio.js conjuracaoSoundFor` lê). O timbre diz a família e a nota diz qual
 * magia; a nota que o id sorteia empilha cem magias novas em cima das feitas à mão. Aqui cada magia do livro que o jogo
 * conjura pega, no timbre dela, a nota MENOS usada até ali — em ordem fixa (o id), para a escolha não mudar de uma
 * rodada do importador para outra. A sem motor não toca, e não pega nota.
 */
export async function notasDasMagias(SPELLS, novas) {
  const { conjuracaoSoundFor, GRAUS, GRAUS_EXTRA, GRAUS_DO_DANO } = await import(pathToFileURL(`${RAIZ}src/core/audio.js`).href);
  const { familiaDaMagia } = await import(pathToFileURL(`${RAIZ}src/rules/familias-de-magia.js`).href);
  const timbre = (fam) => { const { nome, opts } = conjuracaoSoundFor(fam); return `${nome}${nome === 'castUtility' ? `/${opts.escola}` : ''}`; };
  const uso = new Map();
  const conta = (t, n) => uso.set(t, (uso.get(t) ?? 0) + 1);
  // A NOTA QUE JÁ EXISTIA FICA (2026-11-16): antes, toda rodada do importador sorteava de novo a nota de todas as magias do
  // livro, e a que o jogador já tinha aprendido mudava de altura. Agora a magia que já tinha nota, no mesmo timbre, a mantém,
  // e só a nova (ou a que mudou de timbre) ganha uma.
  const antiga = (id) => (SPELLS[id] && !SPELLS[id].semMotor && SPELLS[id].tom != null ? SPELLS[id] : null);
  for (const sp of Object.values(SPELLS)) {
    if (sp.semMotor || (novas[sp.id] && !antiga(sp.id))) continue;
    const fam = familiaDaMagia(sp);
    conta(`${timbre(fam)}@${conjuracaoSoundFor(fam).opts.semitom ?? 0}`);
  }
  for (const id of Object.keys(novas).sort()) {
    const sp = novas[id];
    delete sp.tom;
    if (sp.semMotor) continue;
    const velha = antiga(id);
    if (velha && timbre(familiaDaMagia({ ...sp, tom: velha.tom })) === timbre(familiaDaMagia(velha))) { sp.tom = velha.tom; continue; }
    const fam = familiaDaMagia(sp);
    const opcoes = fam.familia === 'dano' ? GRAUS_DO_DANO : conjuracaoSoundFor(fam).opts.semitom != null && fam.familia !== 'sopro' ? [...GRAUS, ...GRAUS_EXTRA] : [0];
    if (opcoes.length < 2) continue;
    const t = timbre(fam);
    const tom = [...opcoes].sort((a, b) => (uso.get(`${t}@${a}`) ?? 0) - (uso.get(`${t}@${b}`) ?? 0))[0];
    sp.tom = tom;
    conta(`${t}@${tom}`);
  }
}

// ------------------------------------------------------------------------------------------------- o lote ----
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const dado = lerJson(`${RAIZ}_referencias/5etools/spells/spells-${LIVRO}.json`, null);
  const pt = lerJson(`${RAIZ}src/dev/magias/${LIVRO}-pt.json`, {});
  const deParaPath = `${RAIZ}src/dev/bestiario/magias-en.json`;
  const dePara = lerJson(deParaPath, {});
  const { SPELLS } = await import(pathToFileURL(`${RAIZ}src/rules/spells.js`).href);
  // QUEM APRENDE CADA MAGIA, pelo livro: o de-para do 5etools (`spells/sources.json`), magia -> classes
  const CLASSE = { Bard: 'bardo', Cleric: 'clerigo', Druid: 'druida', Paladin: 'paladino', Ranger: 'patrulheiro', Sorcerer: 'feiticeiro', Warlock: 'bruxo', Wizard: 'mago' };
  const fontes = lerJson(`${RAIZ}_referencias/5etools/spells/sources.json`, {})[LIVRO.toUpperCase()] ?? {};
  // A classe do PHB que aprende a magia; no Xanathar a lista vem em `classVariant`, com o livro que a definiu (o próprio
  // Xanathar: as listas expandidas dele). As variantes de OUTRO livro (as opcionais do Tasha) não entram aqui.
  const classesDe = (nome) => [...new Set([...(fontes[nome]?.class ?? []), ...(fontes[nome]?.classVariant ?? []).filter((c) => c.definedInSource === LIVRO.toUpperCase())]
    .filter((c) => c.source === 'PHB').map((c) => CLASSE[c.name]).filter(Boolean))];
  // as de EXPLORAÇÃO que o sistema de magia fora da luta conjura (`rules/utilidade-livros.js`)
  const { UTIL_DOS_LIVROS } = await import(pathToFileURL(`${RAIZ}src/rules/utilidade-livros.js`).href);
  const AJUSTES = (await import(pathToFileURL(`${RAIZ}src/dev/magias/ajustes-${LIVRO}.mjs`).href).catch(() => ({})))[`AJUSTES_${LIVRO.toUpperCase()}`] ?? {};
  const feitasAMao = new Set(Object.values(SPELLS).filter((s) => s.fonte !== LIVRO).map((s) => s.id));
  const saida = {};
  const pendente = [];
  let semTexto = 0;
  for (const s of dado.spell) {
    const en = s.name.toLowerCase();
    if (dePara[en] && feitasAMao.has(dePara[en])) continue;
    const tx = pt[s.name];
    if (!tx) { semTexto += 1; continue; }
    let id = idDe(tx.nome);
    if (feitasAMao.has(id)) id = `${id}${LIVRO[0].toUpperCase()}${LIVRO.slice(1)}`;
    // dois nomes em pt-br iguais (a tradução que deu a duas magias o mesmo nome) apagariam uma: o lote PARA
    if (saida[id]) throw new Error(`${s.name} e ${saida[id].nomeOriginal} saíram com o mesmo nome em pt-br ("${tx.nome}"): corrija em magias/${LIVRO}-pt.json`);
    // a mecânica é a da tabela escrita à mão; a leitura automática (`mecanica`) só vale de rascunho, e não entra
    const { nota, ...mec0 } = AJUSTES[s.name] ?? {};
    // a de 1 MINUTO ou mais de conjuração não cabe num turno de luta, e o jogo ainda não prepara nada antes dela: a
    // mecânica fica escrita na tabela, mas a magia entra sem motor, com o motivo na fila
    const demorada = Object.keys(mec0).length > 0 && ['minute', 'hour'].includes(s.time?.[0]?.unit);
    const mec = demorada ? {} : mec0;
    const temMotor = Object.keys(mec).length > 0;
    const fora = temMotor ? null : UTIL_DOS_LIVROS[id] ?? null;
    // a invocação mostra os pacotes como opções, como o Conjurar Animais
    if (mec.pacotes && !mec.opcoes) mec.opcoes = Object.entries(mec.pacotes).map(([pid, pc]) => ({ id: pid, rotulo: pc.rotulo, detalhe: pc.detalhe }));
    const sobe = emCirculoMaior(s);
    const magia = {
      id, name: tx.nome, nomeOriginal: s.name, level: s.level, school: ESCOLA[s.school] ?? s.school, fonte: LIVRO,
      ...tempo(s), rangeFt: alcance(s), ...duracao(s),
      ...(s.meta?.ritual ? { ritual: true } : {}),
      // as classes que a aprendem, pelo livro (a lista de cada classe lê `rules/magias-por-classe-phb.js`, que tem também as feitas à mão)
      classes: classesDe(s.name),
      ...(temMotor && sobe && !mec.upcast ? { upcast: sobe } : {}),
      ...(temMotor ? mec : fora ? { kind: 'utilidade', utilidade: true, soFora: true } : { kind: 'utilidade', semMotor: true }),
      desc: temMotor ? `${tx.desc}${nota ? ` (Simplificação: ${nota.charAt(0).toLowerCase()}${nota.slice(1)})` : ''}`
        : fora ? `${tx.desc}${fora.soNaRegiao ? ' (No jogo, conjura-se na tela da região.)' : ' (Só fora de combate.)'}`
          : `${tx.desc} (No jogo, ainda sem efeito.)`,
    };
    // A MAGIA QUE O JOGO NÃO FAZ FICA FORA DO JOGO (pedido do dono, 2026-11-09): a sem efeito e a que só se narraria não
    // entram em `SPELLS` nem no de-para — o conjurador do bestiário volta a tê-la como "magia que ainda não temos", e
    // nenhuma lista de classe a oferece. Ficam na fila, com o motivo, para quando o motor as fizer.
    // AS QUE SÓ SE NARRARIAM, pela regra do dono (`rules/utilidade-livros.js`, o cabeçalho): moldar a rocha, mover a terra e a
    // água, as ilusões que o tabuleiro não mostra. Ditas aqui pelo nome, para a fila do bestiário saber que não são dívida.
    const narrada = !temMotor && SO_SE_NARRARIAM.has(s.name);
    if ((!temMotor && !fora) || fora?.efeito === 'narra' || narrada) {
      pendente.push({ magia: id, en: s.name, circulo: s.level,
        motivo: fora?.efeito === 'narra' || narrada ? 'só se narraria: o tabuleiro ainda não guarda o que ela muda'
          : demorada ? 'a mecânica está na tabela; leva 1 minuto ou mais para conjurar, e espera a preparação fora da luta'
            // a de 1 minuto ou mais SEM tabela e sem uso fora da luta (`utilidade-livros.js`): fica fora do jogo pela regra
            : ['minute', 'hour'].includes(s.time?.[0]?.unit) ? 'leva 1 minuto ou mais para conjurar: não cabe num turno de luta, e fora da luta o jogo não tem o que ela muda'
              : 'o motor ainda não faz o que ela faz', rascunho: mecanica(s)?.kind ?? null });
      if (dePara[en] === id) delete dePara[en];
      continue;
    }
    saida[id] = magia;
    dePara[en] = id;
  }
  await notasDasMagias(SPELLS, saida);
  const nomeConst = `MAGIAS_${LIVRO.toUpperCase()}`;
  const corpo = `// GERADO por src/dev/importar-magias.mjs ${LIVRO} — não editar à mão: mude o conversor e rode de novo.\n`
    + `// Os números saem do dado do livro; o texto, de src/dev/magias/${LIVRO}-pt.json, com as nossas palavras.\n`
    + `export const ${nomeConst} = ${JSON.stringify(saida, null, 1)};\n`;
  fs.writeFileSync(`${RAIZ}src/rules/magias-livro-${LIVRO}.js`, corpo);
  fs.writeFileSync(`${RAIZ}src/dev/magias/${LIVRO}-pendente.json`, `${JSON.stringify(pendente, null, 1)}\n`);
  fs.writeFileSync(deParaPath, `${JSON.stringify(dePara, null, 1)}\n`);
  // QUEM APRENDE CADA MAGIA DO JOGO, as feitas à mão inclusive: o de-para inglês -> id, e o livro diz as classes.
  // `game/criacao.js listaDaClasse` lê daqui. Sem isto a lista de cada classe era a escrita à mão, e faltavam nela 114
  // magias que o livro dá (a Bola de Fogo do mago, o Imobilizar Pessoa de seis classes).
  const porClasse = {};
  for (const [en, id] of Object.entries(dePara)) {
    const nome = Object.keys(fontes).find((k) => k.toLowerCase() === en);
    const cls = nome ? classesDe(nome) : [];
    if (cls.length) porClasse[id] = cls;
  }
  fs.writeFileSync(`${RAIZ}src/rules/magias-por-classe-${LIVRO}.js`, `// GERADO por src/dev/importar-magias.mjs ${LIVRO}: quem aprende cada magia, pelo livro (magia -> classes).\n`
    + `export const CLASSES_DAS_MAGIAS_${LIVRO.toUpperCase()} = ${JSON.stringify(porClasse, null, 1)};\n`);
  const porTipo = {};
  for (const m of Object.values(saida)) porTipo[m.kind] = (porTipo[m.kind] ?? 0) + 1;
  console.log(`escreveu ${Object.keys(saida).length} magias em src/rules/magias-livro-${LIVRO}.js: ${Object.entries(porTipo).map(([k, v]) => `${v} ${k}`).join(', ')}`);
  console.log(`sem motor: ${pendente.length}; sem texto ainda: ${semTexto}`);
}

// o que entrou sem ícone de traço (tema Obsidiana): `inventario-icones.mjs`
(await import('./icones-faltando.mjs')).avisarIconesFaltando('magia');
