// QUANTO PESA O NOSSO BANDIDO MARCARRUBRA, em vez do bandido do SRD que o livro usa. Rode com:
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/medir-marcarrubra.mjs [amostra] [nível]
//
// O bloco `marcarrubra` (`rules/monsters/humanoides.js`) é NOSSO, derivado do Bandido do SRD: CA 13 em vez de
// 12, 16 PV em vez de 11, e DOIS golpes de cimitarra por turno em vez de um — ND 1/2 contra ND 1/8. É a maior
// divergência numérica do capítulo 3, e o comentário do bloco dizia só "a briga da rua mantém a mesma faixa",
// que mede a RUA (capítulo 3 ao ar livre) e não as três lutas de bandido lá dentro da Mansão.
//
// Este arquivo mede as três: o alojamento (área 2, três bandidos), as jaulas (área 5, dois) e a sala de estar
// (área 10, quatro bêbados, que o jogo deixa envenenados por três rodadas). Cada uma roda duas vezes — com o
// nosso bloco e com o bandido do SRD —, com o mesmo grupo, as mesmas sementes e o mesmo campo
// aberto, para que a única coisa diferente entre as duas colunas seja o bloco.
//
// O que ele NÃO mede: posição inicial, parede, surpresa e o roteiro da cena. É a luta nua, que é o que a
// pergunta pede — "este bloco é duro demais?" —, e não a dificuldade da sala.
import { makeRng } from '../core/rng.js';
import { Battlefield } from '../core/grid.js';
import { Encounter } from '../rules/combat.js';
import { makeParty } from '../rules/party.js';
import { makeMonster, MONSTERS } from '../rules/monsters.js';
import { takeMonsterTurn } from '../rules/ai.js';
import { hasCondition } from '../rules/conditions.js';
import { addCondition } from '../rules/conditions.js';
import { playCharacter } from './balance.js';

const N = Number(process.argv[2] ?? 400);
const NIVEL = Number(process.argv[3] ?? 3);   // o livro põe o grupo no 2º ao chegar a Phandalin e no 3º aqui

// Campo aberto de 14x10, grupo a oeste e bando a leste, a 30 pés — a distância de uma sala da Mansão.
const MAPA = Array.from({ length: 10 }, () => '.'.repeat(14));
const CASAS_GRUPO = [{ x: 1, y: 4 }, { x: 1, y: 5 }, { x: 2, y: 4 }, { x: 2, y: 5 }];
const CASAS_BANDO = [{ x: 9, y: 4 }, { x: 9, y: 5 }, { x: 10, y: 4 }, { x: 10, y: 5 }];

const LUTAS = [
  { id: 'alojamento', nome: 'área 2, o alojamento', quantos: 3, envenenados: false },
  { id: 'jaulas', nome: 'área 5, as jaulas', quantos: 2, envenenados: false },
  { id: 'estar', nome: 'área 10, os bêbados', quantos: 4, envenenados: true },
];

function umaLuta(seed, { quantos, envenenados }, bloco) {
  const rng = makeRng(seed);
  const field = new Battlefield(MAPA[0].length, MAPA.length, MAPA);
  const party = makeParty({ nivel: NIVEL });
  party.forEach((c, i) => { c.pos = { ...CASAS_GRUPO[i] }; });
  const foes = Array.from({ length: quantos }, (_, i) => {
    const m = makeMonster(bloco, { pos: { ...CASAS_BANDO[i] } });
    m.pos = { ...CASAS_BANDO[i] };
    return m;
  });
  const enc = new Encounter({ battlefield: field, party, foes, rng, reinforcements: () => null });
  const hpTotal = party.reduce((s, c) => s + c.maxHp, 0);
  enc.start();
  // os bêbados da sala 10 começam envenenados por três rodadas, como na cena
  if (envenenados) for (const f of foes) addCondition(f, 'envenenado', { rounds: 3, quando: 'fim', lado: 'foes' });

  let guarda = 600;
  while (!enc.over && guarda-- > 0) {
    const lado = enc.side;
    const vez = enc.allOf(lado).filter((c) => !c.acted && !c.dead && !hasCondition(c, 'inconsciente'));
    if (!vez.length) { enc.maybeEndSide(); continue; }
    if (lado === 'party') playCharacter(enc, vez[0]); else takeMonsterTurn(enc, vez[0]);
    if (enc.round > 30) break;
  }
  const pcs = enc.combatants.filter((c) => c.side === 'party');
  return {
    venceu: enc.combatants.filter((c) => c.side === 'foes').every((f) => f.dead),
    rodadas: enc.round,
    hpPct: Math.round((pcs.reduce((s, c) => s + Math.max(0, c.hp), 0) / hpTotal) * 100),
    caidos: pcs.filter((c) => c.dead || c.hp <= 0).length,
    mortos: pcs.filter((c) => c.dead).length,
  };
}

const media = (xs, f) => +(xs.reduce((s, d) => s + f(d), 0) / xs.length).toFixed(1);
const pct = (xs, f) => Math.round((xs.filter(f).length / xs.length) * 100);

console.log(`${N} lutas por caso, grupo de 3º nível, campo aberto, mesmas sementes nas duas colunas.\n`);
console.log('                        |        O NOSSO BLOCO        |     O BANDIDO DO SRD');
console.log('luta                    |  vit   PV   rod  caiu morre |  vit   PV   rod  caiu morre');
console.log('------------------------+-----------------------------+-----------------------------');
const linhas = [];
for (const luta of LUTAS) {
  const col = (bloco) => {
    const xs = Array.from({ length: N }, (_, i) => umaLuta(0x51b0 + i * 7919, luta, bloco));
    return { vit: pct(xs, (d) => d.venceu), hp: media(xs, (d) => d.hpPct), rod: media(xs, (d) => d.rodadas),
      caiu: pct(xs, (d) => d.caidos > 0), morre: pct(xs, (d) => d.mortos > 0) };
  };
  const a = col('marcarrubra');
  const b = col('bandido');
  linhas.push({ luta, a, b });
  const f = (x) => `${String(x.vit).padStart(4)}% ${String(x.hp).padStart(4)}% ${String(x.rod).padStart(5)} ${String(x.caiu).padStart(4)}% ${String(x.morre).padStart(4)}%`;
  console.log(`${luta.nome.padEnd(23)} | ${f(a)} | ${f(b)}`);
}
console.log(`
LEGENDA  vit: vitórias do grupo · PV: vida do grupo que sobra · rod: rodadas · caiu: lutas com alguém a 0 PV
         morre: lutas com alguém morto de verdade.
`);
const soma = (k, lado) => Math.round(linhas.reduce((s, l) => s + l[lado][k], 0) / linhas.length);
console.log(`NO CONJUNTO DAS TRÊS: com o nosso bloco o grupo vence ${soma('vit', 'a')}% e termina com ${soma('hp', 'a')}% de vida,`);
console.log(`cai alguém em ${soma('caiu', 'a')}% das lutas e morre alguém em ${soma('morre', 'a')}%.`);
console.log(`Com o bandido do SRD: ${soma('vit', 'b')}%, ${soma('hp', 'b')}% de vida, ${soma('caiu', 'b')}% e ${soma('morre', 'b')}%.`);
console.log(`\nO PREÇO DO NOSSO BLOCO: ${soma('hp', 'b') - soma('hp', 'a')} pontos percentuais de vida do grupo por luta.`);
