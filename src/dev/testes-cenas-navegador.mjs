// AS CENAS NO NAVEGADOR DE VERDADE: o que os testes em Node não desenham. Cada cena abre como o JOGO a abre — a viagem
// pela região chama `newEncounter({ modo: 'campanha', capitulo: 4, cenaDaVila })`, e é o mesmo caminho aqui, com o roteiro
// do capítulo, as lutas da vila do capítulo 5 escolhendo o bando pelo `cenaDaVila` e o ermo com um encontro da tabela da
// estrada —, passa as narrações, anda pelo mapa como um jogador (clica casas ao alcance) e, se uma luta começa, joga até
// o fim pelo `__app.autoPlay` (a política do grupo de `dev/balance.js`). Acusa:
//   - erro no console e exceção sem tratamento (o "Look desconhecido" da cobra, o retrato que derruba a ordem de turno);
//   - cena que não abre (sem encontro, sem herói, sem tabuleiro desenhado);
//   - luta que trava (a rodada não anda) ou que não acaba em `--rodadas`.
// Não precisa de pacote nenhum: sobe o Vite numa porta própria e dirige o Chrome (ou o Edge) sem cabeça pelo protocolo de
// depuração, com o WebSocket que o Node 24 já traz. O perfil do navegador é uma pasta temporária, nunca o do usuário.
//
//   node src/dev/testes-cenas-navegador.mjs                    todas as cenas
//   node src/dev/testes-cenas-navegador.mjs labirintoSalgado vazioAnima     só estas
//   node src/dev/testes-cenas-navegador.mjs --capitulo 8       só as do capítulo (1 a 8)
//   opções: --passos N (cliques de andar, 12), --rodadas N (de luta, 20), --semente N, --url http://localhost:5190
//           (usa um servidor que já está de pé), --mostrar (abre a janela), --capturas (guarda a imagem de cada cena)
//
// As capturas e o relatório vão para `src/dev/_tmp/cenas-navegador/` (ignorado pelo git).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SAIDA = path.join(RAIZ, 'src', 'dev', '_tmp', 'cenas-navegador');

// AS CENAS, por capítulo, com o nível em que o grupo chega a elas (o da aventura; a arena monta o grupo pronto)
export const CENAS = {
  1: { nivel: 1, cenas: ['emboscada', 'esconderijo'] },
  2: { nivel: 3, cenas: ['rua', 'mansao', 'mansaoTunel'] },
  3: { nivel: 4, cenas: ['ermo', 'ermoNoite', 'poco', 'cume', 'castelo', 'arvoreTrovao', 'covilAgatha'] },
  4: { nivel: 5, cenas: ['ondaEco'] },
  5: { nivel: 6, cenas: ['cavernaDoPoco', 'acampamentoSawplee', 'telhadoGigante', 'giganteTerreo', 'zorzulaPosto', 'zorzulaMinas', 'santuarioIndigo'] },
  6: { nivel: 8, cenas: ['casaMarthungrim', 'minaHardyhammer', 'largoDaVaca', 'talhundereth', 'criptaTalhund', 'encruzilhada'] },
  7: { nivel: 9, cenas: ['santuarioInfectado', 'tunelGrells', 'tunelBehir', 'tunelGruta', 'illithinoch', 'fendaTrincheiras', 'fendaOco', 'fendaLabirinto'] },
  8: { nivel: 11, cenas: ['labirintoSalgado', 'covilLowarnizel', 'pocaSalgada', 'vazioCupula', 'vazioPonte', 'vazioCharco', 'vazioNematodeo', 'vazioMiasma', 'vazioEstatua', 'vazioCampo', 'vazioAnima'] },
};

// ------------------------------------------------------------------------------------------------ argumentos ----
const args = process.argv.slice(2);
const opcao = (nome, padrao) => { const i = args.indexOf(`--${nome}`); return i >= 0 ? args[i + 1] : padrao; };
const tem = (nome) => args.includes(`--${nome}`);
const PASSOS = Number(opcao('passos', 12));
const RODADAS = Number(opcao('rodadas', 20));
const SEMENTE = Number(opcao('semente', 7));
const CAPITULO = opcao('capitulo', null);
const URL_DADA = opcao('url', null);
const valores = new Set(['passos', 'rodadas', 'semente', 'capitulo', 'url'].filter((n) => args.includes(`--${n}`)).map((n) => args[args.indexOf(`--${n}`) + 1]));
const nomesPedidos = args.filter((a) => !a.startsWith('--') && !valores.has(a));
const todas = Object.entries(CENAS).flatMap(([cap, { nivel, cenas }]) => cenas.map((cena) => ({ cena, nivel, cap: Number(cap) })));
const fila = nomesPedidos.length ? todas.filter((c) => nomesPedidos.includes(c.cena))
  : CAPITULO ? todas.filter((c) => c.cap === Number(CAPITULO)) : todas;
for (const n of nomesPedidos) if (!todas.some((c) => c.cena === n)) { console.error(`cena desconhecida: ${n}`); process.exit(2); }

// ---------------------------------------------------------------------------------------------- o navegador ----
function acharNavegador() {
  const candidatos = [
    process.env.CHROME,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    path.join(process.env.LOCALAPPDATA ?? '', 'Google/Chrome/Application/chrome.exe'),
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  return candidatos.find((p) => fs.existsSync(p)) ?? null;
}
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
async function esperarHttp(url, ms) {
  const fim = Date.now() + ms;
  while (Date.now() < fim) {
    try { const r = await fetch(url); if (r.ok) return r; } catch { /* ainda subindo */ }
    await esperar(250);
  }
  throw new Error(`${url} não respondeu em ${ms / 1000} s`);
}

/** Um cliente mínimo do protocolo de depuração: manda, espera a resposta, ouve os eventos. */
class Cdp {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pendentes = new Map(); this.ouvintes = [];
    ws.addEventListener('message', (m) => {
      const msg = JSON.parse(typeof m.data === 'string' ? m.data : Buffer.from(m.data).toString());
      if (msg.id && this.pendentes.has(msg.id)) {
        const { ok, falha } = this.pendentes.get(msg.id);
        this.pendentes.delete(msg.id);
        if (msg.error) falha(new Error(msg.error.message)); else ok(msg.result);
      } else if (msg.method) for (const f of this.ouvintes) f(msg);
    });
  }
  static async abrir(url) {
    const ws = new WebSocket(url);
    await new Promise((ok, falha) => { ws.addEventListener('open', ok); ws.addEventListener('error', falha); });
    return new Cdp(ws);
  }
  mandar(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((ok, falha) => this.pendentes.set(id, { ok, falha }));
  }
  /** Roda uma expressão na página e devolve o valor (com `await`). */
  async avaliar(expr, ms = 120000) {
    const r = await Promise.race([
      this.mandar('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }),
      esperar(ms).then(() => ({ tempo: true })),
    ]);
    if (r.tempo) throw new Error(`a página não respondeu em ${ms / 1000} s`);
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
    return r.result?.value;
  }
}

// ------------------------------------------------------------------------- o que roda DENTRO da página ----
// Uma função só, injetada como texto. Ela passa as narrações, anda e luta, e devolve o relatório da cena.
const NA_PAGINA = String.raw`async (opts) => {
  const app = window.__app;
  if (!app) return { erroDeAbertura: 'a página não montou o jogo (__app)' };
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  // um sorteio com semente, para a mesma semente andar o mesmo caminho
  let s = opts.semente >>> 0 || 1;
  const sorte = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const rel = { passos: 0, lutas: 0, rodadas: 0, desfecho: null, dialogos: 0, travou: null, notas: [] };
  // FECHAR O QUE ESTÁ ABERTO: a narração (o botão principal, senão a primeira opção que deixa), a dica do tutorial, a ficha
  const fecharDialogos = () => {
    let fechou = 0;
    for (let k = 0; k < 30; k++) {
      const caixa = [...document.querySelectorAll('.narrativa')].filter((c) => !c.classList.contains('saindo')).at(-1);
      if (!caixa) break;
      const b = caixa.querySelector('.narrativa-btn.primario:not([disabled])')
        ?? [...caixa.querySelectorAll('.narrativa-opcao:not([disabled]), .narrativa-btn:not([disabled]):not(.discreto)')][0];
      if (!b) break;
      b.click(); fechou++; rel.dialogos++;
    }
    for (const b of document.querySelectorAll('button')) if (/^(Entendi|Fechar)$/.test(b.textContent.trim()) && b.offsetParent) b.click();
    return fechou;
  };
  const assentar = async (ms = 400) => { for (let i = 0; i < 40; i++) { const n = fecharDialogos(); await dormir(n ? 220 : ms); if (!n && !app.busy) return; } };
  await assentar(600);
  const enc = () => app.enc;
  if (!enc()) return { ...rel, erroDeAbertura: 'sem encontro (__app.enc)' };
  const herois = () => enc().combatants.filter((c) => c.side === 'party' && !c.dead && c.hp > 0);
  rel.herois = herois().length;
  rel.cenaComRoteiro = Boolean(app.capitulo);
  // A LUTA PARADA: ninguém perde PV por 8 rodadas. O diagnóstico diz, de cada inimigo de pé, onde está, se voa, o que o
  // prende, a que distância está do herói mais perto, se algum herói o VÊ e se algum o ALCANÇA andando (orçamento de 300 pés)
  const vidaTotal = () => enc().combatants.reduce((t, c) => t + Math.max(0, c.hp) + (c.dead ? 1000 : 0), 0);
  const diagnostico = () => enc().combatants.filter((c) => c.side === 'foes' && !c.dead && c.hp > 0 && c.pos).map((f) => {
    const hs = herois();
    const d = (h) => Math.max(Math.abs(h.pos.x - f.pos.x), Math.abs(h.pos.y - f.pos.y)) * 5;
    const perto = hs.slice().sort((a, b) => d(a) - d(b))[0];
    const ve = hs.some((h) => enc().field.hasLineOfSight(h.pos, f.pos));
    // a busca do MOTOR (reachableFor), que conta o voo, a pegada e quem atravessa: a da grade crua ignorava o voo, e no
    // Vazio, onde todos voam, dava todo inimigo por inalcançável (a Ânima, 2026-11-13)
    const alcanca = hs.some((h) => {
      const r = enc().reachableFor ? enc().reachableFor(h, { orcamentoFt: 300 })
        : enc().field.reachable(h.pos, 300, () => false, () => true, h.pos.f ?? 1, enc().atravessaPara?.(h));
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (r.has((f.pos.x + dx) + ',' + (f.pos.y + dy))) return true;
      return false;
    });
    return f.name + ' em ' + f.pos.x + ',' + f.pos.y + (f.flyFt ? ' (voa)' : '') + ', ' + f.hp + ' PV'
      + ((f.conditions ?? []).length ? ', ' + f.conditions.map((k) => k.id).join('/') : '')
      + '; herói mais perto a ' + (perto ? d(perto) : '?') + ' pés; ' + (ve ? 'à vista' : 'FORA DA VISTA') + '; ' + (alcanca ? 'alcançável' : 'INALCANÇÁVEL');
  });
  const emLuta = () => !enc().over && !app.capitulo?.explorando && enc().combatants.some((c) => c.side === 'foes' && !c.dead && c.hp > 0 && !c.naoSeguraALuta);
  // DESTRAVAR, o que um jogador faria e o autoPlay não faz (2026-11-13): o grupo do autoPlay mira o inimigo mais perto e
  // nunca abre porta. Com 3 rodadas sem dano, o teste (1) abre a porta fechada que separa o grupo de um inimigo que ele
  // não alcança, a mais perto desse inimigo — trancada ou não, como quem arromba —, e (2) se não há porta assim, foca o
  // grupo no inimigo de pé mais perto que ele ainda não estava acertando (o gancho ignora do motor). Cada intervenção vai
  // para as notas. Se mesmo assim ninguém perder PV em 8 rodadas, a luta parada é acusada como antes: aí é do jogo.
  const { ARESTA } = await (app.modulos?.grid?.() ?? import('/src/core/grid.js')); // no build não há /src: o gancho do main.js importa
  const focados = new Set();
  const destravar = (soPorta = false) => {
    const f = enc().field;
    const hs = herois();
    const inimigos = enc().combatants.filter((c) => c.side === 'foes' && !c.dead && c.hp > 0 && c.pos && !c.naoSeguraALuta);
    if (!hs.length || !inimigos.length) return null;
    const alcance = new Set();
    for (const h of hs) for (const k of enc().reachableFor(h, { orcamentoFt: 5000 }).keys()) alcance.add(k);
    const k = (x, y) => x + ',' + y;
    const longe = inimigos.filter((m) => ![[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].some(([dx, dy]) => alcance.has(k(m.pos.x + dx, m.pos.y + dy))));
    if (longe.length) {
      let melhor = null;
      for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
        for (const [lado, ax, ay] of [['N', x, y - 1], ['O', x - 1, y]]) {
          if (ax < 0 || ay < 0) continue;
          const cod = lado === 'N' ? f.paredeN[y * f.w + x] : f.paredeO[y * f.w + x];
          if (cod !== ARESTA.porta) continue;
          const daqui = alcance.has(k(ax, ay)), dali = alcance.has(k(x, y));
          if (daqui === dali) continue;
          const d = Math.min(...longe.map((m) => Math.max(Math.abs(m.pos.x - x), Math.abs(m.pos.y - y))));
          if (!melhor || d < melhor.d) melhor = { d, a: { x: ax, y: ay }, b: { x, y }, chave: lado === 'N' ? x + ',' + y + ',N' : x + ',' + y + ',O' };
        }
      }
      if (melhor) {
        f.porAresta(melhor.a.x, melhor.a.y, melhor.b.x, melhor.b.y, ARESTA.aberta);
        f.trancas?.delete(melhor.chave);
        f.versao = (f.versao ?? 0) + 1;
        return 'o teste abriu a porta ' + melhor.chave;
      }
    }
    if (soPorta) return null;
    const meio = hs[0].pos;
    const foco = inimigos.filter((m) => !focados.has(m.id))
      .sort((a, b) => Math.max(Math.abs(a.pos.x - meio.x), Math.abs(a.pos.y - meio.y)) - Math.max(Math.abs(b.pos.x - meio.x), Math.abs(b.pos.y - meio.y)))[0];
    if (!foco) return null;
    focados.add(foco.id);
    for (const h of hs) h.ignora = (o) => o !== foco && !o.dead && !foco.dead;
    return 'o teste focou o grupo em ' + foco.name;
  };
  const soltarFoco = () => { for (const h of enc()?.combatants ?? []) if (h.side === 'party') delete h.ignora; };
  // A LUTA: o autoPlay do jogo, vigiado — se a rodada não anda em 20 s, a luta travou
  const lutar = async () => {
    rel.lutas++;
    const r0 = enc().round;
    let ultimo = { round: enc().round, side: enc().side, t: Date.now() };
    let semDano = { vida: vidaTotal(), desde: enc().round };
    const vigia = setInterval(() => { const a = { round: enc().round, side: enc().side }; if (a.round !== ultimo.round || a.side !== ultimo.side) ultimo = { ...a, t: Date.now() }; fecharDialogos(); }, 300);
    try {
      let teto = r0 + opts.rodadas;
      let corrida = app.autoPlay(teto);
      while (true) {
        const fim = await Promise.race([corrida.then((v) => ({ v })), dormir(500).then(() => null)]);
        // A LUTA LONGA que ainda anda (alguém perdeu PV nas últimas 4 rodadas) ganha mais rodadas, até o triplo: varrer o
        // Castelo sala a sala passa de 20 rodadas, e isso não é luta travada
        if (fim && !fim.v.over && enc().round - semDano.desde < 4 && teto < r0 + 3 * opts.rodadas) {
          teto += opts.rodadas;
          rel.notas.push('luta longa: mais ' + opts.rodadas + ' rodadas a partir da ' + enc().round);
          corrida = app.autoPlay(teto);
          continue;
        }
        if (fim) {
          rel.desfecho = fim.v.outcome ?? (fim.v.over ? 'acabou' : 'sem fim em ' + (teto - r0) + ' rodadas');
          if (!fim.v.over) rel.semFim = diagnostico();
          break;
        }
        if (Date.now() - ultimo.t > 20000) { rel.travou = 'a luta não andou em 20 s (rodada ' + enc().round + ', vez de ' + enc().side + ')'; break; }
        const v = vidaTotal();
        // a luta anda, mas alguém do outro lado está atrás de porta (o arqueiro no posto do Castelo): a cada 3 rodadas
        // o teste procura a porta, como no travamento
        if (enc().round - (rel._porta ?? r0) >= 3) {
          rel._porta = enc().round;
          const fez = destravar(true);
          if (fez) rel.notas.push(fez + ' (rodada ' + enc().round + ')');
        }
        if (v !== semDano.vida) semDano = { vida: v, desde: enc().round };
        else if (enc().round - semDano.desde >= 3 && (semDano.destravou ?? -1) < enc().round - 2 && enc().round - semDano.desde < 8) {
          const fez = destravar();
          semDano.destravou = enc().round;
          if (fez) rel.notas.push(fez + ' (rodada ' + enc().round + ')');
        } else if (enc().round - semDano.desde >= 8) {
          rel.parada = { desde: semDano.desde, inimigos: diagnostico() };
          enc().over = true; // encerra a luta parada: o resto da cena não roda numa luta que ninguém joga
          break;
        }
      }
    } finally { clearInterval(vigia); soltarFoco(); }
    rel.rodadas += Math.max(0, enc().round - r0);
    await assentar();
  };
  // ANDAR COMO UM JOGADOR: um herói por vez, para uma casa sorteada ao alcance, pelo clique de verdade
  for (let i = 0; i < opts.passos && !rel.travou; i++) {
    if (!enc() || enc().over) break;
    if (emLuta()) { await lutar(); if (rel.travou || !app.capitulo?.explorando) break; continue; }
    const hs = herois();
    if (!hs.length) break;
    const h = hs[i % hs.length];
    app.select(h);
    const alcance = [...enc().reachableFor(h).values()].filter((n) => n.x !== h.pos.x || n.y !== h.pos.y);
    if (!alcance.length) { rel.notas.push(h.name + ' sem casa ao alcance'); continue; }
    const longe = alcance.filter((n) => Math.abs(n.x - h.pos.x) + Math.abs(n.y - h.pos.y) >= 3);
    const pool = longe.length ? longe : alcance;
    const alvo = pool[Math.floor(sorte() * pool.length)];
    const antes = { x: h.pos.x, y: h.pos.y };
    app.onTileClick({ x: alvo.x, y: alvo.y });
    rel.passos++;
    for (let k = 0; k < 60 && app.busy; k++) await dormir(100);
    await assentar();
    if (h.pos.x === antes.x && h.pos.y === antes.y && !emLuta()) rel.notas.push(h.name + ' não andou para ' + alvo.x + ',' + alvo.y);
  }
  if (!rel.travou && emLuta()) await lutar();
  rel.rodada = enc()?.round;
  rel.inimigosNoFim = enc()?.combatants.filter((c) => c.side === 'foes').map((c) => c.name + (c.dead ? ' (morto)' : ' ' + c.hp + ' PV'));
  rel.ultimas = (enc()?.log ?? []).slice(-8).map((l) => l.text ?? String(l));
  rel.explorando = Boolean(app.capitulo?.explorando);
  // o que tem de estar na tela: a ordem de turno do HUD e o tabuleiro desenhado
  const tela = document.querySelector('canvas');
  rel.canvas = tela ? [tela.width, tela.height] : null;
  rel.retratos = document.querySelectorAll('.hud-ordem img, .ordem-turno img, .hud-retrato, .retrato canvas, .ficha-mini').length;
  return rel;
}`;

/** A configuração com que o jogo abre a cena (a da viagem pela região). O ermo leva o encontro da tabela da estrada. */
const ABRIR = String.raw`async ({ cena, nivel }) => {
  const extra = {};
  if (cena === 'ermo' || cena === 'ermoNoite') {
    const { ENCONTROS } = await (window.__app.modulos?.estrada?.() ?? import('/src/rules/encontros-estrada.js'));
    const periodo = cena === 'ermo' ? 'dia' : 'noite';
    const e = ENCONTROS.find((x) => x.id === 'goblin' && x[periodo]) ?? ENCONTROS.find((x) => x[periodo]);
    extra.encontro = { id: e.id, nome: e.nome, um: e.um ?? e.nome, qtd: 4, periodo, chefe: e.chefe ?? null };
  }
  window.__app.newEncounter({ modo: 'campanha', capitulo: 4, cenaDaVila: cena, nivel, ...extra });
  return window.__app.varianteAtual;
}`;

// ---------------------------------------------------------------------------------------------- principal ----
async function principal() {
  const navegador = acharNavegador();
  if (!navegador) { console.error('não achei o Chrome nem o Edge (passe o caminho em CHROME=...)'); process.exit(2); }
  fs.mkdirSync(SAIDA, { recursive: true });
  const filhos = [];
  const fechar = () => { for (const f of filhos) { try { f.kill(); } catch { /* já saiu */ } } };
  process.on('exit', fechar);
  process.on('SIGINT', () => { fechar(); process.exit(130); });

  // O SERVIDOR: o que já está de pé (`--url`), ou um Vite numa porta própria
  let base = URL_DADA;
  if (!base) {
    const porta = 5299;
    const vite = spawn(process.execPath, [path.join(RAIZ, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(porta), '--strictPort'], { cwd: RAIZ, stdio: 'ignore' });
    filhos.push(vite);
    base = `http://localhost:${porta}`;
    await esperarHttp(base, 60000);
  }
  // O NAVEGADOR: sem cabeça, perfil temporário, som mudo
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'phandalin-cenas-'));
  const portaCdp = 9339;
  const chrome = spawn(navegador, [
    `--remote-debugging-port=${portaCdp}`, `--user-data-dir=${perfil}`, '--no-first-run', '--no-default-browser-check',
    '--mute-audio', '--window-size=1280,800', ...(tem('mostrar') ? [] : ['--headless=new']), 'about:blank',
  ], { stdio: 'ignore' });
  filhos.push(chrome);
  await esperarHttp(`http://127.0.0.1:${portaCdp}/json/version`, 20000);
  const alvos = await (await fetch(`http://127.0.0.1:${portaCdp}/json/list`)).json();
  const pagina = alvos.find((a) => a.type === 'page');
  const cdp = await Cdp.abrir(pagina.webSocketDebuggerUrl);
  await cdp.mandar('Page.enable');
  await cdp.mandar('Runtime.enable');
  await cdp.mandar('Log.enable');
  await cdp.mandar('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });

  // O QUE A PÁGINA DIZ: erro no console, exceção sem tratamento, recurso que não carregou (este só avisa: a arte de terceiros
  // é opcional por desenho, e a cena abre sem ela)
  let erros = []; let avisos = [];
  cdp.ouvintes.push((msg) => {
    if (msg.method === 'Runtime.exceptionThrown') erros.push(`exceção: ${msg.params.exceptionDetails.exception?.description?.split('\n').slice(0, 3).join(' | ') ?? msg.params.exceptionDetails.text}`);
    else if (msg.method === 'Runtime.consoleAPICalled' && ['error', 'assert'].includes(msg.params.type)) {
      erros.push(`console.error: ${msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 400)}`);
    } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'warning') {
      const t = msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ');
      if (/\?encontro=/.test(t)) erros.push(`a cena não abriu: ${t.slice(0, 300)}`); else avisos.push(t.slice(0, 200));
    } else if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
      const e = msg.params.entry;
      if (e.source === 'network') avisos.push(`recurso: ${e.url ?? e.text}`); else erros.push(`log: ${e.text.slice(0, 300)}`);
    }
  });

  // O PRIMEIRO CARREGAMENTO: o Vite otimiza as dependências e RECARREGA a página. Espera a página parar de se recarregar
  // antes da primeira cena (foi isto que derrubou a emboscada na primeira rodada: o teste começava na página que ia sumir).
  await cdp.mandar('Page.navigate', { url: `${base}/?teste&encontro=arena&nivel=2` });
  let origem = null;
  for (let i = 0; i < 40; i++) {
    await esperar(1500);
    const agora = await cdp.avaliar('window.__app?.enc ? performance.timeOrigin : null', 5000).catch(() => null);
    if (agora && agora === origem) break;
    origem = agora;
  }

  const relatorio = [];
  console.log(`${fila.length} cena(s), ${PASSOS} passos e até ${RODADAS} rodadas de luta cada, semente ${SEMENTE}, em ${base}\n`);
  for (const { cena, nivel, cap } of fila) {
    erros = []; avisos = [];
    const t0 = Date.now();
    let r = null; let falha = null;
    try {
      // a página sobe na arena (sem o menu), e a cena se abre pela configuração da campanha
      // pronta quando o jogo montou e a página ficou um segundo sem se recarregar (o Vite às vezes recarrega no meio)
      const subir = async () => {
        await cdp.mandar('Page.navigate', { url: `${base}/?teste&encontro=arena&nivel=${nivel}` });
        const fim = Date.now() + 45000;
        let origem = null;
        while (Date.now() < fim) {
          const agora = await cdp.avaliar('window.__app && window.__app.enc && window.__app.board ? performance.timeOrigin : null', 5000).catch(() => null);
          if (agora && agora === origem) return true;
          origem = agora;
          await esperar(1000);
        }
        return false;
      };
      if (!(await subir()) && !(await subir())) throw new Error('a página não montou o jogo em duas tentativas');
      erros = [];
      const aberta = await cdp.avaliar(`(${ABRIR})(${JSON.stringify({ cena, nivel })})`, 60000);
      if (aberta !== cena) throw new Error(`a cena aberta foi "${aberta}", e não "${cena}"`);
      r = await cdp.avaliar(`(${NA_PAGINA})(${JSON.stringify({ passos: PASSOS, rodadas: RODADAS, semente: SEMENTE })})`, 15 * 60000);
    } catch (e) { falha = e.message; }
    if (tem('capturas') || erros.length || falha || r?.travou) {
      try {
        const shot = await cdp.mandar('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(SAIDA, `${cena}.png`), Buffer.from(shot.data, 'base64'));
      } catch { /* sem captura */ }
    }
    const problemas = [
      ...(falha ? [`o teste não terminou: ${falha}`] : []),
      ...(r?.erroDeAbertura ? [r.erroDeAbertura] : []),
      ...(r && !r.herois ? ['nenhum herói na cena'] : []),
      ...(r && !r.canvas ? ['sem tabuleiro desenhado'] : []),
      ...(r?.travou ? [r.travou] : []),
      ...(r?.semFim ? [`a luta não acabou em ${RODADAS} rodadas`, ...r.semFim.map((x) => `  ${x}`)] : []),
      ...(r?.parada ? [`luta parada desde a rodada ${r.parada.desde} (8 rodadas sem ninguém perder PV)`, ...r.parada.inimigos.map((x) => `  ${x}`)] : []),
      ...erros,
    ];
    const ok = problemas.length === 0;
    const seg = ((Date.now() - t0) / 1000).toFixed(1);
    const resumo = r ? `${r.passos} passos, ${r.dialogos} diálogos, ${r.lutas} luta(s) em ${r.rodadas} rodada(s)${r.desfecho ? ` (${r.desfecho})` : ''}${r.explorando ? ', explorando' : ''}` : '';
    console.log(`${ok ? 'ok   ' : 'FALHA'} cap ${cap} ${cena.padEnd(20)} ${seg.padStart(5)} s  ${resumo}`);
    for (const p of problemas) console.log(`        ${p}`);
    relatorio.push({ cena, cap, nivel, ok, segundos: Number(seg), problemas, avisos: [...new Set(avisos)].slice(0, 20), ...(r ?? {}) });
  }
  fs.writeFileSync(path.join(SAIDA, 'relatorio.json'), `${JSON.stringify(relatorio, null, 1)}\n`);
  const falhas = relatorio.filter((x) => !x.ok);
  console.log(`\n${relatorio.length - falhas.length}/${relatorio.length} cenas sem problema. Relatório e capturas em ${path.relative(RAIZ, SAIDA)}.`);
  try { cdp.ws.close(); } catch { /* já fechou */ }
  fechar();
  try { fs.rmSync(perfil, { recursive: true, force: true }); } catch { /* o Chrome ainda segura algum arquivo */ }
  process.exit(falhas.length ? 1 : 0);
}

await principal();
