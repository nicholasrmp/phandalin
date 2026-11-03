// Os GATILHOS da Casa da Morte, um a um: para cada ação de cada casa, de cada casa de onde se pode fazê-la, faz a ação numa cena nova e, se ela
// começa uma luta, confere que os dois lados se alcançam. Luta em que ninguém alcança ninguém nunca acaba (e o combate trava as interações).
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/gatilhos-casadamorte.mjs
const P = new URL('../', import.meta.url).href;
const { montarCampo } = await import(P + 'game/campo.js');
const { Encounter } = await import(P + 'rules/combat.js');
const { makeParty } = await import(P + 'rules/party.js');
const { makeRng } = await import(P + 'core/rng.js');
const { mapaDo, buildFoes } = await import(P + 'game/encounter.js');
const { criarCasaDaMorte } = await import(P + 'game/capitulo-casadamorte.js');
const { Battlefield: BF } = await import(P + 'core/grid.js');
const { garantirInventario } = await import(P + 'rules/equipment.js');

const SEMENTE = 7;
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
const VARIANTES = (process.env.SO ? process.env.SO.split(',') : ['casaDaMorte1', 'casaDaMorte2', 'casaDaMorte3', 'casaDaMorte4', 'casaDaMortePorao1', 'casaDaMortePorao2']);
const achados = [];
let acoes = 0; let lutas = 0;

for (const v of VARIANTES) {
  // as casas e as ações, vistas de uma cena parada
  const base = await nova(v, { campanha: {} });
  const h0 = base.party[0];
  const alcance = BF.prototype.reachable.call(base.field, h0.pos, 100000);
  const livres = [...alcance.keys()].map((k) => k.split(',').map(Number)).filter(([x, y]) => !base.field.blocksMove(x, y));
  const catalogo = new Map();   // id da ação -> { tile, paradas: [casas de onde ela aparece] }
  for (const [px, py] of livres) {
    h0.pos = { x: px, y: py };
    for (let y = Math.max(0, py - 4); y <= Math.min(base.field.h - 1, py + 4); y++) {
      for (let x = Math.max(0, px - 4); x <= Math.min(base.field.w - 1, px + 4); x++) {
        let ops = [];
        try { ops = base.cena.interacoes({ x, y }, base.field.surfaceAt(x, y), h0) ?? []; } catch { continue; }
        for (const o of ops) {
          if (o.motivo || /^Olhar|^Rever|escada|Voltar|Subir|Descer/i.test(o.rotulo)) continue;
          const id = `${o.grupo ?? ''}|${o.rotulo}|${x},${y}`;
          if (!catalogo.has(id)) catalogo.set(id, { x, y, rotulo: o.rotulo, grupo: o.grupo, de: [] });
          catalogo.get(id).de.push([px, py]);
        }
      }
    }
  }
  console.log(v + ': ' + catalogo.size + ' ações em ' + livres.length + ' casas');
  for (const [id, a] of catalogo) {
    for (const [px, py] of a.de) {
      const S = await nova(v, { campanha: {} });
      const h = S.party[0];
      S.party.slice(1).forEach((q) => { q.pos = { x: px, y: py }; });
      h.pos = { x: px, y: py };
      let op;
      try { op = S.cena.interacoes({ x: a.x, y: a.y }, S.field.surfaceAt(a.x, a.y), h).find((o) => (o.grupo ?? '') + '|' + o.rotulo + '|' + a.x + ',' + a.y === id); } catch { continue; }
      if (!op || op.motivo) continue;
      globalThis.__escolher = (esc) => (esc.find((e) => e.primaria) ?? esc[0]).valor;
      acoes += 1;
      try { await op.fazer(); } catch { continue; }
      if (S.cena.explorando) continue;
      lutas += 1;
      const foes = S.enc.combatants.filter((c) => c.side === 'foes' && !c.dead);
      const heroiAlcanca = BF.prototype.reachable.call(S.field, h.pos, 100000);
      const sem = foes.filter((f) => {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (heroiAlcanca.has(chave(f.pos.x + dx, f.pos.y + dy))) return false;
        return true;
      });
      if (sem.length) {
        const msg = v + ': "' + a.rotulo + '" em ' + a.x + ',' + a.y + ', de ' + px + ',' + py + ': ' + sem.map((f) => f.name + '@' + f.pos.x + ',' + f.pos.y).join(', ') + ' não se alcança a pé';
        if (!achados.includes(msg)) { achados.push(msg); console.log('  !! ' + msg); }
      }
    }
  }
}
const NL = String.fromCharCode(10);
console.log(NL + acoes + ' ações tentadas, ' + lutas + ' começaram luta.');
console.log(achados.length ? achados.length + ' gatilho(s) sem caminho:' + NL + '- ' + achados.join(NL + '- ') : 'nenhum gatilho dispara luta sem caminho.');
process.exit(achados.length ? 1 : 0);
