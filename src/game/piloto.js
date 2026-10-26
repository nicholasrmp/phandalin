// O PILOTO AUTOMÁTICO da sala (MULTIJOGADOR.md, L-08, F6.2).
//
// Se o dono de um herói cai no meio da luta, o grupo não pode esperar por ele: o anfitrião joga os heróis dele. O piloto é
// deliberadamente BÁSICO (ataca o inimigo mais perto com a arma na mão, depois termina o turno): não decide magias, itens
// nem posição. Serve para a luta andar até a pessoa voltar; ao voltar, ela retoma os heróis na hora (A-04).
//
// Puro: roda em Node. Quem executa é o `App` (`main.js: pilotoDaSala`).

import { PILOTO } from './sala.js';

/**
 * Os heróis que o piloto joga: os de quem está desconectado e os que o anfitrião mandou para o piloto de propósito. `v` é a
 * visão da sala (a mesma que os clientes recebem). Os do próprio anfitrião nunca entram (ele está aqui, jogando).
 */
export function heroisDoPiloto(v) {
  if (!v?.herois || !v.jogadores) return new Set();
  const ausentes = new Set(v.jogadores.filter((j) => !j.conectado).map((j) => j.id));
  const ids = Object.entries(v.herois)
    .filter(([, dono]) => dono !== v.voce && (dono === PILOTO || ausentes.has(dono)))
    .map(([heroi]) => heroi);
  return new Set(ids);
}

const casas = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

/** O inimigo vivo mais perto de `heroi` (desempate pelo id, para o piloto ser previsível). `null` se não há. */
export function inimigoMaisPerto(heroi, combatentes) {
  const vivos = combatentes.filter((c) => c.side !== heroi.side && !c.dead && c.hp > 0 && c.pos);
  vivos.sort((a, b) => casas(heroi.pos, a.pos) - casas(heroi.pos, b.pos) || String(a.id).localeCompare(String(b.id)));
  return vivos[0] ?? null;
}

/** O que o piloto faz com `heroi` agora: atacar `alvo` com `arma`, ou só terminar o turno. */
export function jogadaDoPiloto(heroi, combatentes) {
  if (heroi.dead || heroi.hp <= 0 || heroi.acted) return { tipo: 'nada' };
  const alvo = inimigoMaisPerto(heroi, combatentes);
  if (!alvo || !heroi.equippedWeapon || heroi.actionUsed) return { tipo: 'terminar' };
  return { tipo: 'atacar', alvo, arma: heroi.equippedWeapon };
}
