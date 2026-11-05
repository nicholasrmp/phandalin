// A ARMADILHA NO CAMINHO, passo a passo.
//
// Antes a cena só olhava a casa onde o herói PAROU (`capitulo.depoisDeMover`). O ressalto frágil do esconderijo
// desabava em quem terminava o passo em cima dele — e quem o atravessava de um clique, de (13,7) a (6,6), passava
// sem nada. Medido no passeio de 2026-11-04. A regra do livro é outra: a armadilha dispara em quem PISA.
//
// Então o caminho é conferido casa a casa ANTES de andar, e corta-se onde algo acontece:
//
//   notou    a Percepção passiva do herói alcança a CD de uma armadilha ainda não descoberta a até 5 pés da casa
//            que ele vai pisar, e o grupo enxerga a armadilha: ele PARA antes, e ela fica descoberta;
//   pisou    a casa é da armadilha, ninguém a notou: ele para EM CIMA, e ela dispara.
//
// A armadilha descoberta não dispara nem para ninguém — o grupo sabe dela e passa por fora. Quem a armadilha
// não pega (`afeta`, o goblin pequeno no ressalto) também não.
//
// A cena declara as dela em `capitulo.armadilhas()`:
//   { id, nome, casas: [{x,y}], cd, descoberta, achado, afeta?(c), notar?(c, {mostrar}), disparar?(c) }
import { passivePerception } from '../rules/abilities.js';
import { visaoDoGrupo, temEscuridaoEm } from '../rules/luz.js';
import { armadilhasDasRegioes } from '../rules/regioes.js';

/** As armadilhas da cena (`capitulo.armadilhas`) e as do MAPA (regiões escondidas, desenhadas no editor). */
export function armadilhasDaCena(app) {
  return [...(app.capitulo?.armadilhas?.() ?? []), ...armadilhasDasRegioes(app.enc)];
}

/**
 * Os ganchos das magias de fora da luta (`capitulo.ganchosMagicos`) e, das regiões escondidas, um gancho de
 * armadilha por região — é o que o Encontrar Armadilhas revela e o Augúrio pergunta, sem a cena saber dela.
 */
export function ganchosMagicosDaCena(app, c) {
  const daCena = app.capitulo?.ganchosMagicos?.(c) ?? [];
  const dasRegioes = armadilhasDasRegioes(app.enc).map((a) => {
    // a casa da região mais perto de quem conjura: é dela que se mede o alcance e a linha de visão
    const casa = [...a.casas].sort((p, q) => Math.hypot(p.x - c.pos.x, p.y - c.pos.y) - Math.hypot(q.x - c.pos.x, q.y - c.pos.y))[0];
    return { tipo: 'armadilha', id: a.id, x: casa.x, y: casa.y, nome: a.nome, texto: a.achado, vista: a.descoberta, revelar: () => { a.descobrir(); return true; } };
  });
  return [...daCena, ...dasRegioes];
}

const naCasa = (a, p) => a.casas.some((q) => q.x === p.x && q.y === p.y);
const aoLado = (a, p) => a.casas.some((q) => Math.abs(q.x - p.x) <= 1 && Math.abs(q.y - p.y) <= 1);

/**
 * Onde o caminho `path` (de `Battlefield.pathFrom`, a primeira casa é onde o herói está) tem de parar.
 * Devolve `{ caminho, evento }`; `evento` é `{ tipo: 'notou' | 'pisou', armadilha }` ou `null`.
 */
export function cortarNoPerigo(enc, c, path, armadilhas) {
  const vivas = (armadilhas ?? []).filter((a) => !a.descoberta && (a.afeta?.(c) ?? true));
  if (!vivas.length || !path?.length) return { caminho: path, evento: null };
  const passiva = passivePerception(c);
  const visao = temEscuridaoEm(enc) ? visaoDoGrupo(enc) : null;
  const ve = (a) => !visao || a.casas.some((q) => visao.has(`${q.x},${q.y}`));
  for (let i = 1; i < path.length; i++) {
    const p = path[i];
    for (const a of vivas) {
      if (!aoLado(a, p)) continue;
      if (passiva >= (a.cd ?? 10) && ve(a)) {
        // notou: só para se o caminho ia PISAR nela adiante; passando ao lado, segue — e fica sabendo
        const pisaria = path.slice(i).some((q) => naCasa(a, q));
        return { caminho: pisaria ? path.slice(0, i) : path, evento: { tipo: 'notou', armadilha: a } };
      }
      if (naCasa(a, p)) return { caminho: path.slice(0, i + 1), evento: { tipo: 'pisou', armadilha: a } };
    }
  }
  return { caminho: path, evento: null };
}

/** O que acontece depois do passo cortado: a cena narra o que o herói notou, ou a armadilha dispara. */
export async function resolverPerigo(c, evento) {
  if (!evento) return;
  if (evento.tipo === 'notou') await evento.armadilha.notar?.(c, { mostrar: true });
  else await evento.armadilha.disparar?.(c);
}
