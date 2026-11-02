// O PASSEIO da Casa da Morte: um jogador automático que percorre a casa inteira, do jardim à saída, usando só o que o jogo oferece (as
// interações do botão direito, a caminhada que o motor permite, as lutas jogadas pelo motor). Serve para achar o que os testes soltos não
// pegam: ação que nunca aparece, sala que não se alcança, escada que não leva a lugar nenhum, luta que trava, laço sem fim.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/passeio-casadamorte.mjs [sacrificar|negar] [semente]
//
// O jogador: em cada cena anda até cada casa de onde se oferece alguma ação, faz a ação (cada herói tenta o que o outro não conseguiu, como o
// jogo pede), luta o que acordar com a política de `balance.js` (e cura o grupo depois, porque aqui o que se mede é o caminho, não a
// dificuldade), e só então toma uma escada. No ritual da câmara 38 escolhe sacrificar ou negar, como se pedir no primeiro argumento.
import { performance } from 'node:perf_hooks';

const P = new URL('../', import.meta.url).href;
const { montarCampo } = await import(P + 'game/campo.js');
const { Encounter } = await import(P + 'rules/combat.js');
const { makeParty } = await import(P + 'rules/party.js');
const { makeRng } = await import(P + 'core/rng.js');
const { mapaDo, buildFoes } = await import(P + 'game/encounter.js');
const { criarCasaDaMorte } = await import(P + 'game/capitulo-casadamorte.js');
const { Battlefield: BF } = await import(P + 'core/grid.js');
const { playCharacter } = await import(P + 'dev/balance.js');
const { takeMonsterTurn } = await import(P + 'rules/ai.js');
const { hasCondition } = await import(P + 'rules/conditions.js');
const { garantirInventario } = await import(P + 'rules/equipment.js');

const GRUPO_INICIAL = [];
const FIM = process.argv[2] === 'negar' ? 'negar' : 'sacrificar';
const SEMENTE = Number(process.argv[3] ?? 7);
const MAX_PASSOS = 2500;
const relatorio = { problemas: [], cenas: new Map(), lutas: [], acoes: 0 };
const problema = (m) => { relatorio.problemas.push(m); console.log('  !! ' + m); };

// ---------------------------------------------------------------------------------------------------- a cena ---
async function nova(variante, { campanha, entrada = null, party = null, seed = SEMENTE } = {}) {
  const mapa = mapaDo(variante);
  const field = montarCampo(mapa);
  const grupo = party ?? makeParty({ nivel: 1 });
  grupo.forEach((c, i) => { c.pos = { ...mapa.grupo[i] }; c.facingVec = { ...mapa.olhar }; });
  const foes = buildFoes(variante);
  const trocas = [];
  const app = {
    root: { classList: { add() {}, remove() {} } }, campanha, selected: null, inimigosEscondidos: foes,
    select(c) { this.selected = c; }, firstActive() { return enc.allOf('party').find((c) => !c.acted && !c.dead && c.hp > 0) ?? null; },
    refresh() {}, encerrarPartida() { app.encerrou = true; }, newEncounter(cfg) { trocas.push(cfg); },
  };
  const enc = new Encounter({ battlefield: field, party: grupo, foes: [], rng: makeRng(seed), emboscada: null, reinforcements: () => null, onEvent: (ev) => cena?.evento?.(ev) });
  app.enc = enc;
  enc.aoComecar = () => {};
  enc.protegidoDeSurpresa = () => false;
  const cena = criarCasaDaMorte(app, { variante, modo: 'campanha', aventura: 'cos', entrada });
  await cena.iniciar();
  return { app, enc, cena, field, party: grupo, foes, trocas, variante, mapa, casa: () => app.campanha.strahd.casa };
}

const chave = (x, y) => `${x},${y}`;
const vivos = (S) => S.party.filter((h) => !h.dead && h.hp > 0);

// ------------------------------------------------------------------------------------------------- caminhar ---
/** O caminho de `de` até `para` (casas de jogo) e quanto custa, pelo motor. Null se não há. */
function caminho(S, h, para) {
  const alcance = BF.prototype.reachable.call(S.field, h.pos, 100000);
  const no = alcance.get(chave(para.x, para.y));
  if (!no) return null;
  return BF.pathFrom(alcance, no);
}

/** Anda o herói até `para`, em trechos do que o movimento do turno permite. Devolve true se chegou. */
async function ir(S, h, para) {
  for (let volta = 0; volta < 60; volta++) {
    if (h.pos.x === para.x && h.pos.y === para.y) return true;
    if (!S.cena.explorando) return false;
    const p = caminho(S, h, para);
    if (!p || p.length < 2) { if (process.env.DEPURA) console.log('   [ir: sem caminho]', h.name, JSON.stringify(h.pos), '->', JSON.stringify(para), p ? p.length : p); return false; }
    h.movementLeftFt = 60;
    // o maior trecho que cabe no movimento do turno e termina numa casa onde se pode parar (não em cima de um aliado)
    const alcancado = S.enc.reachableFor(h);
    let melhor = null;
    for (let k = p.length - 1; k >= 1; k--) {
      const no = alcancado.get(chave(p[k].x, p[k].y));
      if (no && no.parar !== false) { melhor = BF.pathFrom(alcancado, no); break; }   // o caminho que o motor cobra, e não o meu
    }
    if (!melhor) { if (process.env.DEPURA) console.log('   [ir: nenhum trecho cabe]', h.name, JSON.stringify(h.pos), '->', JSON.stringify(para), 'caminho', p.map((q) => q.x + ',' + q.y).join(' '), 'mov', h.movementLeftFt, 'outros', S.enc.combatants.filter((c) => c !== h && !c.dead).map((c) => c.name + '@' + c.pos.x + ',' + c.pos.y).join(' ')); return false; }
    const antes = { ...h.pos };
    const andou = S.enc.moveAlong(h, melhor);
    if (process.env.DEPURA && volta > 52) console.log('   [ir: andou', andou, ']', JSON.stringify(antes), 'caminho', melhor.map((q) => q.x + ',' + q.y).join(' '), '=> pos', JSON.stringify(h.pos), 'mov', h.movementLeftFt);
    if (andou === false && h.pos.x === antes.x && h.pos.y === antes.y) { if (process.env.DEPURA) console.log('   [ir falhou]', h.name, JSON.stringify(antes), '->', JSON.stringify(melhor.at(-1)), 'trecho', melhor.length, 'de', p.length, 'mov', h.movementLeftFt, 'outros', S.enc.combatants.filter((c) => c !== h).map((c) => c.pos.x + ',' + c.pos.y).join(' ')); return false; }
    await S.cena.depoisDeMover(h);
    if (!S.cena.explorando || S.trocas.length) { if (process.env.DEPURA) console.log('   [ir: cena mudou]', h.name, JSON.stringify(h.pos), 'explorando', S.cena.explorando, 'trocas', S.trocas.length); return false; }
    if (process.env.DEPURA && volta > 50) console.log('   [ir: volta', volta, ']', h.name, JSON.stringify(h.pos), '->', JSON.stringify(para), 'mov', h.movementLeftFt);
  }
  return false;
}

/** Os outros heróis chegam perto do primeiro (casas livres e alcançáveis em volta), como o grupo anda junto. */
function juntar(S, lider) {
  const alcance = BF.prototype.reachable.call(S.field, lider.pos, 6);
  const ocupadas = new Set(S.enc.combatants.map((c) => chave(c.pos.x, c.pos.y)));
  const candidatas = [...alcance.entries()].map(([k, n]) => ({ k, n })).sort((a, b) => a.n.cost - b.n.cost);
  for (const h of vivos(S)) {
    if (h === lider) continue;
    const c = candidatas.find((q) => !ocupadas.has(q.k) && !S.field.blocksMove(...q.k.split(',').map(Number)) && !S.enc.paraNaCasa?.(h, { x: Number(q.k.split(',')[0]), y: Number(q.k.split(',')[1]) }));   // casa onde o passo para (gatilho): ninguém é posto nela sem o gatilho andar
    if (!c) continue;
    const [x, y] = c.k.split(',').map(Number);
    ocupadas.delete(chave(h.pos.x, h.pos.y));
    h.pos = { x, y }; ocupadas.add(c.k);
  }
}

// ------------------------------------------------------------------------------------------------------ luta ---
async function lutar(S) {
  const enc = S.enc;
  const nome = [...new Set(enc.combatants.filter((c) => c.side === 'foes' && !c.dead).map((c) => c.name))].join(', ');
  let guarda = 3000;
  const t0 = performance.now();
  while (!enc.over && guarda-- > 0) {
    const lado = enc.side;
    const pend = enc.allOf(lado).filter((c) => !c.acted && !c.dead && !hasCondition(c, 'inconsciente'));
    if (!pend.length) { enc.maybeEndSide(); continue; }
    if (lado === 'party') playCharacter(enc, pend[0]); else takeMonsterTurn(enc, pend[0]);
    if (enc.round > 40) break;
  }
  if (!enc.over) {
    problema(`a luta contra ${nome} não terminou (rodada ${enc.round})`);
    const foe0 = enc.combatants.find((c) => c.side === 'foes' && !c.dead); const her0 = enc.combatants.find((c) => c.side === 'party' && !c.dead);
    if (foe0 && her0) {
      console.log('     enemiesOf(foe):', enc.enemiesOf(foe0).map((x) => x.name).join(','), '| enemiesOf(hero):', enc.enemiesOf(her0).map((x) => x.name).join(','));
      console.log('     foe condições:', JSON.stringify((foe0.conditions ?? []).map((q) => q.id)), 'traits', JSON.stringify(foe0.traits), 'ataques', JSON.stringify((foe0.attacks ?? []).map((q) => q.name)), 'side', foe0.side, 'defId', foe0.defId);
      console.log('     canAttack hero->foe:', JSON.stringify(enc.canAttack(her0, foe0, her0.weapons?.[0])), '| foe->hero:', JSON.stringify(enc.canAttack(foe0, her0, foe0.attacks?.[0]?.name)));
    }
    for (const c of enc.combatants) console.log(`     ${c.side} ${c.name} (${c.pos.x},${c.pos.y}) pv ${c.hp}/${c.maxHp}${c.dead ? ' morto' : ''}${c.conditions?.length ? ' ' + c.conditions.map((q) => q.id).join(',') : ''}`);
  }
  const mortos = S.party.filter((h) => h.dead).length;
  const hpPct = Math.round(S.party.reduce((s, h) => s + Math.max(0, h.hp), 0) / S.party.reduce((s, h) => s + h.maxHp, 0) * 100);
  relatorio.lutas.push({ cena: S.variante, contra: nome, resultado: enc.outcome, rodadas: enc.round, mortos, hpPct, ms: Math.round(performance.now() - t0) });
  console.log(`  luta: ${nome} -> ${enc.outcome} em ${enc.round} rodadas, ${mortos} morto(s), ${hpPct}% dos PV`);
  const venceu = enc.outcome === 'vitoria';
  // o que se mede é o caminho: depois da luta o grupo se refaz
  for (const h of S.party) { if (h.dead) { h.dead = false; } h.hp = h.maxHp; h.conditions = []; }
  // derrota: para seguir o caminho, o que sobrou do outro lado é dado como vencido (a derrota em si é medida no relatório de lutas)
  if (!venceu) for (const f of enc.combatants.filter((c) => c.side === 'foes' && !c.dead)) { f.dead = true; f.hp = 0; }
  await S.cena.fimDoCombate('vitoria');
}

// ----------------------------------------------------------------------------------------------------- ações ---
const ESCADA = /escada|escadaria|alçapão|portão|sair|saída|porão|descer|subir/i;
const ehEscada = (o) => (ESCADA.test(o.rotulo) && /descer|subir|sair|saída|abrir o portão|passar/i.test(o.rotulo)) || /^Voltar à estrada/.test(o.rotulo);

/** Todas as ações disponíveis em cada casa alcançável, com o herói parado ao lado. */
function oferecidas(S, h, feitas) {
  const alcance = BF.prototype.reachable.call(S.field, h.pos, 100000);
  const lista = [];
  const origem = { ...h.pos };
  const saidas = new Set([chave(origem.x, origem.y)]);
  for (const [k] of alcance) saidas.add(k);
  const w = S.field.w; const hh = S.field.h;
  const ocupadas = new Set(S.enc.combatants.filter((c) => c !== h).map((c) => chave(c.pos.x, c.pos.y)));
  for (let y = 0; y < hh; y++) {
    for (let x = 0; x < w; x++) {
      // de pé em volta da casa clicada (ou nela)
      const pes = [[x, y], [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].filter(([px, py]) => saidas.has(chave(px, py)) && !S.field.blocksMove(px, py) && !ocupadas.has(chave(px, py)) && ((px === x && py === y) || S.field.passa(px, py, x, y)));   // de pé do mesmo lado da parede
      if (!pes.length) continue;
      const [px, py] = pes[0];
      h.pos = { x: px, y: py };
      let ops = [];
      try { ops = S.cena.interacoes({ x, y }, S.field.surfaceAt(x, y), h) ?? []; } catch (e) { problema(`interacoes(${x},${y}) quebrou em ${S.variante}: ${e.message}`); }
      for (const o of ops) {
        if (o.motivo || /^Olhar|^Rever as pistas/.test(o.rotulo)) continue;
        if (/^Girar a roda/.test(o.rotulo) && ((feitas.get(`${S.variante}|roda`) ?? 0) >= 1 || /erguer a ponte/.test(o.rotulo))) continue;
        const id = `${S.variante}|${o.grupo ?? ''}|${o.rotulo}|${x},${y}`;
        if ((feitas.get(id) ?? 0) >= 5 || (feitas.get(`${S.variante}|${o.grupo ?? ''}|${o.rotulo}`) ?? 0) >= 8) continue;
        lista.push({ id, o, tile: { x, y }, pe: { x: px, y: py } });
      }
    }
  }
  h.pos = origem;
  return lista;
}

// ---------------------------------------------------------------------------------------------------- passeio ---
globalThis.__escolher = (esc) => {
  const por = (v) => esc.find((e) => e.valor === v);
  // o ritual: entender uma vez, e então o fim escolhido; vítima: o último herói; o resto, a opção primária ou a primeira
  if (esc.some((e) => e.valor === 'negar')) return (por('entender') && !globalThis.__entendeu ? (globalThis.__entendeu = true, 'entender') : (por(FIM === 'negar' ? 'negar' : 'sacrificar') ?? esc[0]).valor);
  if (esc.some((e) => e.valor === 'voltar') && esc.some((e) => /^pc-/.test(e.valor))) return esc.filter((e) => /^pc-/.test(e.valor)).at(-1).valor;
  return (esc.find((e) => e.primaria) ?? esc[0]).valor;
};

// o caminho do passeio: sobe a casa, desce pela espiral do sótão às masmorras, e depois volta pelo alçapão até a saída
const IDA = {
  casaDaMorte1: /Subir/, casaDaMorte2: /Subir a escadaria$/, casaDaMorte3: /Subir/, casaDaMorte4: /Descer.*espiral/,
  casaDaMortePorao1: /Descer a escada$/, casaDaMortePorao2: /Subir/,
};
const VOLTA = { casaDaMortePorao2: /Subir/, casaDaMortePorao1: /alçapão/, casaDaMorte1: /^Voltar à estrada/ };
const campanha = {};
// o grupo leva o que um grupo de aventureiros leva: o ladino, as ferramentas de ladrão; todos, tochas (a masmorra é escura)
{
  const g = makeParty({ nivel: 1 });
  GRUPO_INICIAL.push(...g);
  for (const h of g) {
    const inv = garantirInventario(h);
    inv.bag.push({ id: 'tocha', tipo: 'item', qtd: 4 });
    if (/ladino/i.test(h.className)) inv.bag.push({ id: 'ferramentasDeLadrao', tipo: 'item', qtd: 1 });
  }
}
let S = await nova('casaDaMorte1', { campanha, party: GRUPO_INICIAL });
const visitadas = new Set();
const marca = (v) => { if (!relatorio.cenas.has(v)) relatorio.cenas.set(v, { acoes: 0 }); };
const feitas = new Map();
let ator = 0;
let t0 = performance.now();
console.log(`Passeio da Casa da Morte (fim: ${FIM}, semente ${SEMENTE})`);
console.log(`\n== ${S.variante}`);
marca(S.variante); visitadas.add(S.variante);

for (let passo = 0; passo < MAX_PASSOS; passo++) {
  if (performance.now() - t0 > 240000) { problema('o passeio passou de 4 minutos: laço sem fim?'); break; }
  if (S.trocas.length) {
    const cfg = S.trocas.shift();
    const destino = cfg.variante;
    console.log(`\n== ${destino} (vindo de ${cfg.entrada ?? '?'})`);
    S = await nova(destino, { campanha: S.app.campanha, entrada: cfg.entrada, party: S.party });
    marca(destino); visitadas.add(destino);
    continue;
  }
  if (S.app.encerrou) break;
  if (!S.cena.explorando) {
    if (S.cena.encerrado) { problema(`a cena encerrou em ${S.variante}`); break; }
    if (S.enc.combatants.some((c) => c.side === 'foes' && !c.dead)) { await lutar(S); continue; }
    problema(`${S.variante}: a cena não está explorando e não há luta (travou?)`); break;
  }
  // cada herói vê ações diferentes (quem já tentou uma busca não a vê mais): o primeiro, na vez, que tem algo a fazer; senão, o que tem escada
  let h = vivos(S)[ator++ % vivos(S).length];
  let todas = oferecidas(S, h, feitas);
  if (!todas.some((a) => !ehEscada(a.o))) {
    for (const outro of vivos(S)) {
      if (outro === h) continue;
      const t = oferecidas(S, outro, feitas);
      if (t.some((a) => !ehEscada(a.o))) { h = outro; todas = t; break; }
    }
  }
  const sobem = todas.filter((a) => ehEscada(a.o));
  const outras = todas.filter((a) => !ehEscada(a.o));
  let alvo = outras.sort((a, b) => Math.abs(a.pe.x - h.pos.x) + Math.abs(a.pe.y - h.pos.y) - (Math.abs(b.pe.x - h.pos.x) + Math.abs(b.pe.y - h.pos.y)))[0];
  // a câmara 38: ninguém tem ação que leve ao estrado; o ritual dispara é por andar. Feito o resto da masmorra, o grupo sobe nele
  if (!alvo && S.variante === 'casaDaMortePorao2' && !S.casa().ritual && S.cena.explorando) {
    const degrau = [[6, 8], [7, 8], [8, 8], [9, 8], [6, 9], [9, 9], [7, 10], [8, 10]].map(([x, y]) => ({ x, y })).find((q) => !S.field.blocksMove(q.x, q.y));
    console.log(`  (o grupo sobe no estrado da câmara, em ${degrau.x},${degrau.y})`);
    const chegou = await ir(S, h, degrau);
    if (!chegou && S.cena.explorando) problema('o grupo não conseguiu subir no estrado da câmara 38');
    if (S.casa().ritual) continue;
    if (S.cena.explorando) { problema(`o estrado não disparou o ritual (ritual=${S.casa().ritual})`); }
    continue;
  }
  if (!alvo) {
    // nada mais a fazer aqui: a escada que leva à próxima parte da casa; vistas todas, o caminho de volta e a saída
    const todasVistas = visitadas.size >= 6;
    const quer = todasVistas ? VOLTA[S.variante] : IDA[S.variante];
    alvo = sobem.find((a) => quer?.test(a.o.rotulo)) ?? (todasVistas ? sobem.find((a) => /^Voltar à estrada/.test(a.o.rotulo)) : undefined);
    if (!alvo && !todasVistas) { console.log('  (nenhuma escada para o que falta ver)'); }
  }
  if (!alvo) { console.log('  (nada mais a fazer nesta cena)'); break; }
  feitas.set(alvo.id, (feitas.get(alvo.id) ?? 0) + 1);
  const kr = `${S.variante}|${alvo.o.grupo ?? ''}|${alvo.o.rotulo}`; feitas.set(kr, (feitas.get(kr) ?? 0) + 1);
  const chegou = await ir(S, h, alvo.pe);
  if (!chegou && S.cena.explorando && !S.trocas.length) {
    const al = BF.prototype.reachable.call(S.field, h.pos, 100000);
    const quem = S.enc.combatants.find((c) => !c.dead && c.pos.x === alvo.pe.x && c.pos.y === alvo.pe.y);
    problema(`${S.variante}: ${h.name} (${h.pos.x},${h.pos.y}) não chegou a ${alvo.pe.x},${alvo.pe.y} para "${alvo.o.rotulo}" [alcançável: ${al.has(chave(alvo.pe.x, alvo.pe.y))}; ocupada por: ${quem?.name ?? 'ninguém'}; glifo: ${S.mapa.terreno[alvo.pe.y][alvo.pe.x]}]`);
    feitas.set(alvo.id, 99); continue;
  }
  if (!S.cena.explorando || S.trocas.length) continue;
  juntar(S, h);
  // a ação pode ter mudado de estado quando chegamos: pede de novo, com o herói no lugar
  const agora = S.cena.interacoes(alvo.tile, S.field.surfaceAt(alvo.tile.x, alvo.tile.y), h).find((o) => o.rotulo === alvo.o.rotulo && (o.grupo ?? '') === (alvo.o.grupo ?? ''));
  if (!agora || agora.motivo) { feitas.set(alvo.id, 99); continue; }
  try { await agora.fazer(); } catch (e) { problema(`"${agora.rotulo}" em ${S.variante} quebrou: ${e.message}`); feitas.set(alvo.id, 99); continue; }
  if (/^Girar a roda/.test(agora.rotulo)) feitas.set(`${S.variante}|roda`, 1);
  relatorio.acoes += 1; relatorio.cenas.get(S.variante).acoes += 1;
  console.log(`  ${h.name}: ${agora.grupo ? agora.grupo + ' / ' : ''}${agora.rotulo}`);
}

const casa = S.app.campanha.strahd?.casa ?? {};
console.log('\n================ RELATÓRIO');
console.log('cenas vistas:', [...visitadas].join(' -> '));
console.log('ações feitas:', relatorio.acoes, '| lutas:', relatorio.lutas.length);
console.log('estado da casa:', JSON.stringify({ fim: casa.fim, ritual: casa.ritual, nivel2: casa.nivel2, escada: casa.escada, ponte: casa.ponte, portaPrisao: casa.portaPrisao, alcapao: casa.alcapao, criptas: casa.criptas, vencidos: casa.vencidos }));
for (const v of ['casaDaMorte1', 'casaDaMorte2', 'casaDaMorte3', 'casaDaMorte4', 'casaDaMortePorao1', 'casaDaMortePorao2']) if (!visitadas.has(v)) problema(`a cena ${v} nunca foi alcançada`);
console.log(relatorio.problemas.length ? `\n${relatorio.problemas.length} problema(s):\n- ` + relatorio.problemas.join('\n- ') : '\nnenhum problema.');
process.exit(relatorio.problemas.length ? 1 : 0);
