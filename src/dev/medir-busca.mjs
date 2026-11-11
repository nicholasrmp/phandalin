// O QUANTO O JOGO RESPONDE SEM API, medido com frases escritas de outro jeito. De graça. Roda só o banco e a busca, sem servidor nenhum.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/medir-busca.mjs [--erros]
//
// Cada caso diz o NPC, a situação e a frase, com o que seria uma resposta CERTA: um fato que ela deve citar, ou o tipo dela. "Achou" é ter
// fala do banco; "certa" é ela responder o que se perguntou. A que importa é a segunda: fala errada é pior que fala nenhuma.
import fs from 'node:fs';
import { FICHAS, fatosLiberados, flagDeApertado } from '../game/npc-saber.js';
import { buscarNoBanco, responderSemModelo } from '../game/dialogo-ia.js';

const banco = JSON.parse(fs.readFileSync('public/dialogos/banco.json', 'utf8'));
const AP = (id) => ({ [flagDeApertado(id)]: true });

/** [npc, estado, frase, fato esperado (ou lista), ou null para "não deve citar fato"] */
export const CASOS = [
  ['toblen', {}, 'cadê um lugar pra dormir?', 'casa'],
  ['toblen', {}, 'tem quarto vago?', 'casa'],
  ['toblen', {}, 'o que andam falando dos mantos vermelhos?', 'gangue'],
  ['toblen', {}, 'quais são os boatos da vila?', ['dendrar', 'orcs', 'halia', 'garaele', 'carp', 'gangue']],
  ['toblen', {}, 'o que houve com o marceneiro?', 'dendrar'],
  ['toblen', {}, 'como vc se chama?', 'quem'],
  ['elmar', {}, 'o que vc vende?', 'loja'],
  ['elmar', {}, 'conhece o Gundren?', ['gundren', null]],
  ['elmar', {}, 'e os irmãos dele?', 'irmaos'],
  ['linene', {}, 'vende armadura?', 'loja'],
  ['linene', {}, 'o que aconteceu com a sua caravana?', 'caravana'],
  ['halia', {}, 'sabe onde fica o castelo dos goblins?', 'castelo'],
  ['halia', {}, 'tem algum serviço pra gente?', ['gangue', 'cambio']],
  ['sildar', {}, 'quanto a Aliança paga?', ['pagaCastelo', 'pagaGangue']],
  ['sildar', {}, 'o que sabe do Iarno?', 'iarno'],
  ['sildar', {}, 'como posso achar a fortaleza dos goblins?', 'castelo'],
  ['irmaGaraele', {}, 'por que você foi ver a banshee?', ['agatha', 'grimorio']],
  ['irmaGaraele', {}, 'quem é a sua deusa?', 'tymora'],
  ['daran', {}, 'quem manda nos bandidos?', 'gangue'],
  ['daran', {}, 'precisa de ajuda com alguma coisa?', 'torre'],
  ['qelline', {}, 'seu filho viu o quê?', 'carp'],
  ['qelline', {}, 'onde acho o druida?', 'reidoth'],
  ['harbin', {}, 'qual o problema com os orcs?', 'orcs'],
  ['grista', {}, 'como vc se chama?', 'quem'],
  ['droop', {}, 'onde ficam as portas secretas?', 'secretas'],
  ['droop', {}, 'como passo pelos esqueletos?', 'senha'],
  ['droop', {}, 'quem é o de tapa-olho?', 'bugbears'],
  ['bugbears', {}, 'cadê a Onda Eco?', null],
  ['bugbears', { apertadoBugbears: true }, 'pra que lado fica a mina?', 'ondaEco'],
  ['bugbears', { apertadoBugbears: true }, 'como chego ao castelo?', 'castelo'],
  ['yeemik', {}, 'onde eu acho o Klarg?', 'klarg'],
  ['yeemik', {}, 'o que você quer da gente?', ['quem', 'klarg', 'refem']],
  ['yeemik', AP('yeemik'), 'pra onde levaram o anão?', 'anao'],
  ['goblinCapturado', {}, 'cadê o anão?', null],
  ['goblinCapturado', AP('goblinCapturado'), 'pra onde foi o anão?', 'anao'],
  ['goblinCapturado', AP('goblinCapturado'), 'quantos goblins tem lá?', 'bando'],
  ['marcarrubra', AP('marcarrubra'), 'quem é o chefe de vocês?', 'chefe'],
  ['iarno', {}, 'quem é a Aranha Negra?', 'aranha'],
  ['iarno', {}, 'sabe o caminho da mina?', ['forja', 'bugbears']],
  ['klarg', {}, 'quem manda aqui?', 'quem'],
  ['vigia', {}, 'o que você come?', 'fome'],
  ['mirna', {}, 'quem é você, senhora?', 'quem'],
  ['mirna', {}, 'como posso te ajudar? tem alguma coisa de valor?', 'colar'],
  ['reidoth', {}, 'o que é perigoso por aqui?', 'perigos'],
  ['reidoth', {}, 'me leva até a Onda Eco?', ['favor', null]],
  ['reidoth', {}, 'onde fica o castelo?', 'castelo'],
  ['gundren', {}, 'cadê os seus irmãos?', 'irmaos'],
  ['gundren', {}, 'quanto você paga?', 'pagamento'],
  ['kost', {}, 'o que você quer em troca?', 'favor'],
  ['kost', { kostPagou: true }, 'onde fica a Onda Eco?', 'onda'],
  ['nezznar', {}, 'é você o Aranha Negra?', 'quem'],
  ['mormesk', {}, 'o que tem no baú?', 'bau'],
  ['espectador', {}, 'quem é você?', 'quem'],
  ['venomfang', {}, 'quem é você, dragão?', 'quem'],
  ['favric', {}, 'o que vocês fazem aqui?', ['quem', 'dragao']],
  ['sildar', {}, 'sobre iarno: e onde ele sumiu?', 'iarno'],
  ['elmar', {}, 'sobre gundren: e os irmãos dele?', 'irmaos'],
];

if (process.argv[1]?.endsWith('medir-busca.mjs')) {
  let achou = 0; let certa = 0; const erradas = []; const faltou = [];
  // O jogo sem API inteiro: a fala do banco, a do assunto, e por fim a escrita à mão.
  let semApi = 0; const erradasSemApi = [];
  for (const [npc, estado, frase, esperado] of CASOS) {
    const ficha = FICHAS[npc];
    const lib = fatosLiberados(ficha, estado);
    const acerta = (x) => [].concat(esperado).some((f) => (f === null ? x.fatos.length === 0 : x.fatos.includes(f)));
    const final = buscarNoBanco(banco, npc, ficha, lib, frase, { semModelo: true }) ?? responderSemModelo(ficha, lib, frase);
    if (acerta(final)) semApi += 1; else erradasSemApi.push(`${npc} | ${frase} | [${final.fatos}] ${final.fala.slice(0, 80)}`);
    const r = buscarNoBanco(banco, npc, ficha, lib, frase);
    if (!r) { faltou.push(`${npc} | ${frase}`); continue; }
    achou += 1;
    const ok = [].concat(esperado).some((f) => (f === null ? r.fatos.length === 0 : r.fatos.includes(f)));
    if (ok) certa += 1; else erradas.push(`${npc} | ${frase} | veio [${r.fatos}] de "${r.pergunta}": ${r.fala.slice(0, 90)}`);
  }
  const n = CASOS.length;
  console.log(`${n} frases: achou ${achou} (${Math.round((achou / n) * 100)}%), certa ${certa} (${Math.round((certa / n) * 100)}%), errada ${achou - certa} (${achou ? Math.round(((achou - certa) / achou) * 100) : 0}% do que achou)`);
  console.log(`sem API nenhuma, com a fala escrita à mão por último: certa ${semApi} (${Math.round((semApi / n) * 100)}%)`);
  if (process.argv.includes('--erros')) {
    console.log('\nSEM API, FALA QUE NÃO RESPONDE'); for (const l of erradasSemApi) console.log(`  ${l}`);
    console.log('\nERRADAS'); for (const l of erradas) console.log(`  ${l}`);
    console.log('\nFALTOU'); for (const l of faltou) console.log(`  ${l}`);
  }
}
