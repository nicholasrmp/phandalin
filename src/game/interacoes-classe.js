// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md
// As opções de CLASSE no menu do botão direito sobre um aliado (ou sobre o
// próprio herói): os poderes que pedem ALVO e por isso não cabem num azulejo
// da barra. Hoje: Cura pelas Mãos (paladino) e Inspiração Bárdica (bardo).
//
// O motor já fazia as duas (`Encounter.useFeature`); faltava o caminho
// clique -> `app.usarFeature`. As condições de `motivo` espelham as recusas
// de `useFeature`, para a opção aparecer apagada DIZENDO por quê em vez de
// sumir ou de clicar e não acontecer nada.
//
// Cada opção segue o formato das vizinhas de `interacoes.js`:
// { grupo, rotulo, icone, detalhe, motivo, alvoPrevia, fazer }.

import { hasCondition, maxHpEfetivo, CONDITIONS } from '../rules/conditions.js';
import { distanceFt } from '../core/grid.js';

/**
 * @param app  a aplicação (`app.usarFeature(c, id, { target })`)
 * @param c    o herói selecionado (quem age)
 * @param occ  a criatura da casa clicada: um aliado, ou o próprio `c`
 * @param ctx  { enc, vez, explorando } — `vez` = turno do grupo em combate
 * @returns    a lista de opções (vazia quando não há nada de classe a oferecer)
 */
export function opcoesDeClasse(app, c, occ, { enc, vez = false, explorando = false } = {}) {
  const opcoes = [];
  if (!c || !occ || occ.dead || occ.side !== c.side) return opcoes;

  // ---- Cura pelas Mãos -----------------------------------------------------
  // Em combate gasta a ação; fora dele (explorando, ou a luta acabada) gasta só
  // a reserva — curar entre as lutas é o uso normal. O motor decide pelo mesmo
  // critério (`this.over || this.explorando`) e recusa, antes de cobrar, o que
  // as linhas abaixo apagam com o motivo: morto-vivo, constructo, quem não
  // recupera PV (`semCura`) e quem a mão não alcança (parede e porta contam).
  if (c.features?.includes('layOnHands') && (vez || explorando || enc?.over)) {
    const semTurno = Boolean(explorando || enc?.over || enc?.explorando);
    const reserva = c.resources?.layOnHands ?? 0;
    const falta = maxHpEfetivo(occ) - occ.hp;
    const cura = Math.min(Math.max(0, falta), reserva);
    const semAcao = !semTurno && c.actionUsed ? 'a ação deste turno já foi usada' : null;
    const longe = occ !== c && enc?.field && !enc.field.vizinhos(c.pos, occ.pos) ? 'encoste nele primeiro' : null;
    const semEfeito = ['morto-vivo', 'constructo'].includes(occ.tipo) ? 'a cura não funciona em morto-vivo nem em constructo'
      : (occ.conditions ?? []).some((k) => CONDITIONS[k.id]?.semCura) ? `${occ.name} não recupera PV agora` : null;
    const motivoBase = semAcao ?? longe ?? semEfeito ?? (reserva <= 0 ? 'a reserva de Cura pelas Mãos acabou' : null);
    const detalheCusto = semTurno ? 'sem custo de ação' : 'ação';
    opcoes.push({
      grupo: 'Socorrer',
      rotulo: occ === c ? `Cura pelas Mãos (reserva ${reserva})` : `Cura pelas Mãos em ${occ.name} (reserva ${reserva})`,
      icone: 'classe-layOnHands',
      alvoPrevia: occ,
      detalhe: `${detalheCusto} · ${falta > 0 ? `cura ${cura} de ${falta} PV` : 'sem ferida'}`,
      motivo: motivoBase ?? (falta <= 0 ? `${occ.name} não está ferido` : null),
      fazer: () => app.usarFeature(c, 'layOnHands', { target: occ }),
    });
    // O uso clássico: o aliado a 0 PV levanta com 1 PV, gastando só 1 ponto da reserva.
    if (occ !== c && occ.hp <= 0 && hasCondition(occ, 'inconsciente')) {
      opcoes.push({
        grupo: 'Socorrer', rotulo: `Levantar ${occ.name} com 1 PV`, icone: 'classe-layOnHands', alvoPrevia: occ,
        detalhe: `${detalheCusto} · 1 ponto da reserva (${reserva})`,
        motivo: motivoBase,
        fazer: () => app.usarFeature(c, 'layOnHands', { target: occ, valor: 1 }),
      });
    }
    // 5 pontos tiram o veneno (sem curar).
    if (hasCondition(occ, 'envenenado')) {
      opcoes.push({
        grupo: 'Socorrer', rotulo: occ === c ? 'Tirar o próprio veneno' : `Tirar o veneno de ${occ.name}`, icone: 'classe-layOnHands', alvoPrevia: occ,
        detalhe: `${detalheCusto} · 5 pontos da reserva (${reserva})`,
        motivo: semAcao ?? longe ?? semEfeito ?? (reserva < 5 ? 'precisa de 5 pontos na reserva' : null),
        fazer: () => app.usarFeature(c, 'layOnHands', { target: occ, modo: 'veneno' }),
      });
    }
  }

  // ---- Inspiração Bárdica --------------------------------------------------
  // Ação bônus, um aliado (não o próprio bardo) a até 18 m. Só em combate.
  if (c.features?.includes('bardicInspiration') && occ !== c && vez) {
    const dado = c.dadoDeInspiracao ?? 'd6';
    opcoes.push({
      grupo: 'Apoiar',
      rotulo: `Inspirar ${occ.name} (${c.resources?.bardicInspiration ?? 0} cargas)`,
      icone: 'classe-bardicInspiration',
      alvoPrevia: occ,
      detalhe: `ação bônus · ${dado} para somar num ataque, teste ou resistência`,
      motivo: c.bonusUsed ? 'a ação bônus deste turno já foi usada'
        : !(c.resources?.bardicInspiration > 0) ? 'sem cargas de Inspiração Bárdica'
          : hasCondition(occ, 'inspirado') ? `${occ.name} já está inspirado`
            : distanceFt(c.pos, occ.pos) > 60 ? 'longe demais (alcance de 18 m)' : null,
      fazer: () => app.usarFeature(c, 'bardicInspiration', { target: occ }),
    });
  }

  return opcoes;
}
