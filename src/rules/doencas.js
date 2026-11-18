// AS DOENÇAS DO LIVRO DO MESTRE: a febre do riso, a peste do esgoto e a podridão da vista. Os números são do livro; o
// texto, nosso. Antes delas o jogo tinha só a doença da mordida do otyugh (`descanso.js`), e as curas de doença das
// classes (a Saúde Divina, a Pureza do Corpo) e das magias (a Restauração Menor) não tinham o que curar.
//
// Uma doença é uma CONDIÇÃO (`conditions.js`, as de `DOENCAS`) com o estado na `data`:
//   incubando   descansos longos que faltam para os sintomas (enquanto > 0 ela não faz nada: `conditionEffects` pula)
//   nivel       os degraus de exaustão que a peste e a febre põem (a condição tem `porNivel`, como a exaustão)
//   cd          a CD da febre, que cai a cada descanso em que ela passa
//   penalidade  o −N da podridão da vista nos ataques
// O tempo do livro conta em descanso longo: o dia do jogo. A incubação de horas da febre vira zero (os sintomas já vêm),
// a de dias da peste e da podridão vira um descanso.
//
// Quem chama: `contrairDoenca` (a cena, a região — `regioes.js` aplica qualquer condição —, o golpe do monstro),
// `descanso.js descansoLongo` (o teste diário, `avancarDoencas`), `combat.js applyDamage` (a febre ri quando apanha).
import { addCondition, removeCondition, getCondition, hasCondition, CONDITIONS } from './conditions.js';

export const DOENCAS = ['febreDoRiso', 'pesteDoEsgoto', 'podridaoDaVista', 'doencaDoOtyugh', 'esporosDeZuggtmoy'];

/** Quem não pega doença: a Saúde Divina do paladino, a Pureza do Corpo do monge, a Bênção da Natureza do druida da Terra. */
export const imuneADoenca = (c) => Boolean(c?.features?.some((f) => ['divineHealth', 'purityOfBody', 'naturesWard'].includes(f))
  || ['morto-vivo', 'constructo'].includes(c?.tipo));

const INICIO = {
  febreDoRiso: () => ({ incubando: 0, nivel: 1, cd: 13 }),
  pesteDoEsgoto: () => ({ incubando: 1, nivel: 1 }),
  podridaoDaVista: () => ({ incubando: 1, penalidade: 1 }),
};

/** Contrai a doença (o teste de quem expõe já passou). Devolve o motivo de não pegar, ou null. */
export function contrairDoenca(c, id) {
  if (!INICIO[id]) return 'doença desconhecida';
  if (imuneADoenca(c)) return `${c.name} não adoece`;
  if (hasCondition(c, id)) return null;
  addCondition(c, id, { rounds: Infinity, data: INICIO[id]() });
  return null;
}

const mod = (v) => Math.floor(((v ?? 10) - 10) / 2);
/** A resistência de Constituição fora da luta (o descanso), com a proficiência de quem a tem. */
const conDe = (c, d20) => d20 + mod(c.abilities?.con) + ((c.saves ?? []).includes('con') ? (c.proficiency ?? 2) : 0);

/**
 * O DIA QUE PASSA (o descanso longo): cada doença incuba, piora ou cede. `rolar(lados)` dá o dado (no jogo, o acaso; na
 * prova, fixo). Devolve as linhas do que aconteceu, para o diário.
 */
export function avancarDoencas(c, rolar = (n) => 1 + Math.floor(Math.random() * n)) {
  const linhas = [];
  // os ESPOROS DE ZUGGTMOY (o golpe dela, na luta): a cada dia, Con 19; passa, cura; três falhas, morre
  const esporos = getCondition(c, 'esporosDeZuggtmoy');
  if (esporos) {
    esporos.data ??= {};
    if (conDe(c, rolar(20)) >= 19) { removeCondition(c, 'esporosDeZuggtmoy'); linhas.push(`${c.name} expulsa os esporos de Zuggtmoy.`); }
    else {
      esporos.data.falhas = (esporos.data.falhas ?? 0) + 1;
      linhas.push(`O fungo cresce em ${c.name} (${esporos.data.falhas} de 3).`);
      if (esporos.data.falhas >= 3) { c.dead = true; c.hp = 0; linhas.push(`${c.name} é tomado pelo fungo e morre.`); }
    }
  }
  for (const id of ['febreDoRiso', 'pesteDoEsgoto', 'podridaoDaVista']) {
    const d = getCondition(c, id);
    if (!d) continue;
    d.data ??= {};
    if ((d.data.incubando ?? 0) > 0) {
      d.data.incubando -= 1;
      if (d.data.incubando === 0) linhas.push(`${c.name} acorda com os primeiros sinais: ${CONDITIONS[id].name.toLowerCase()}.`);
      continue;
    }
    if (id === 'febreDoRiso') {
      // passa: a CD cai 1d6; a zero, curou. Falha: nada muda.
      if (conDe(c, rolar(20)) >= d.data.cd) {
        d.data.cd -= rolar(6);
        if (d.data.cd <= 0) { removeCondition(c, id); linhas.push(`A febre de ${c.name} cede de vez.`); } else linhas.push(`A febre de ${c.name} baixa um pouco.`);
      } else linhas.push(`A febre de ${c.name} não cede.`);
    } else if (id === 'pesteDoEsgoto') {
      // CD 11: passa, um degrau a menos (a zero, curou); falha, um a mais (no sexto, morre)
      if (conDe(c, rolar(20)) >= 11) {
        d.data.nivel -= 1;
        if (d.data.nivel <= 0) { removeCondition(c, id); linhas.push(`${c.name} vence a peste do esgoto.`); } else linhas.push(`A peste de ${c.name} recua um pouco.`);
      } else {
        d.data.nivel += 1;
        linhas.push(`A peste de ${c.name} piora.`);
        if (d.data.nivel >= 6) { c.dead = true; c.hp = 0; linhas.push(`${c.name} não resiste à peste.`); }
      }
    } else if (id === 'podridaoDaVista') {
      // piora 1 por dia; em −5, a vista se vai (cego até a magia curar)
      d.data.penalidade = Math.min(5, (d.data.penalidade ?? 1) + 1);
      if (d.data.penalidade >= 5 && !hasCondition(c, 'cego')) {
        addCondition(c, 'cego', { rounds: Infinity, data: { daPodridao: true } });
        linhas.push(`A vista de ${c.name} se apaga de vez.`);
      } else linhas.push(`A vista de ${c.name} turva mais (−${d.data.penalidade}).`);
    }
  }
  return linhas;
}

/** A peste do esgoto não deixa o descanso longo curar, e o dado de vida cura a metade (`descanso.js`). */
export const pesteAtiva = (c) => { const d = getCondition(c, 'pesteDoEsgoto'); return Boolean(d && !(d.data?.incubando > 0)); };

/** Cura toda doença (a Restauração Menor, a Cura pelas Mãos, o elixir da saúde): tira a cegueira que a podridão pôs. */
export function curarDoencas(c) {
  const curadas = DOENCAS.filter((id) => hasCondition(c, id));
  for (const id of curadas) removeCondition(c, id);
  const cego = getCondition(c, 'cego');
  if (cego?.data?.daPodridao) removeCondition(c, 'cego');
  if (curadas.includes('doencaDoOtyugh') && c.pvMaxDaDoenca) { c.maxHp += c.pvMaxDaDoenca; delete c.pvMaxDaDoenca; }
  return curadas;
}
