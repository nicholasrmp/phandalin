// Livro do Jogador (não é SRD) — conteúdo próprio, ver NOTICE.md
// A TABELA DE SURTOS DE MAGIA SELVAGEM (feiticeiro). O livro tem 50 efeitos; o jogo tem os que cabem no motor (tabela reduzida, 16
// entradas de pesos iguais): os de regra e os que no livro são só cor (barba de penas, música etérea...). `valor` ordena o bom (2), o
// neutro (1) e o ruim (0) para o Caos Controlado, que rola duas vezes e fica com o melhor.
import { addCondition } from './conditions.js';
import { damageRoll } from '../core/dice.js';
import { distanceFt } from '../core/grid.js';
import { spellSaveDc } from './abilities.js';

const sobre = (enc, actor, id, rounds) => enc.aplicarCondicao(actor, id, { rounds, source: actor.id });

export const SURTOS = [
  {
    id: 'bolaDeFogo', nome: 'uma bola de fogo estoura sobre você', valor: 0,
    aplica(enc, a) {
      const dano = damageRoll(enc.rng, '8d6').total;
      const cd = spellSaveDc(a);
      for (const c of enc.combatants.filter((x) => !x.dead && distanceFt(a.pos, x.pos) <= 20)) {
        const sv = enc.resistencia(c, 'dex', cd, { contra: { magico: true, tipoDano: 'fogo' } });
        enc.applyDamage(c, sv.success ? Math.floor(dano / 2) : dano, 'fogo', a, { magico: true });
      }
    },
  },
  {
    id: 'misseisMagicos', nome: 'sete mísseis mágicos saem das suas mãos', valor: 2,
    aplica(enc, a) {
      const alvo = enc.enemiesOf(a).filter((m) => !m.dead).sort((x, y) => distanceFt(a.pos, x.pos) - distanceFt(a.pos, y.pos))[0];
      if (!alvo) return;
      let total = 0;
      for (let i = 0; i < 7; i += 1) total += damageRoll(enc.rng, '1d4+1').total;
      enc.applyDamage(alvo, total, 'energético', a, { magico: true });
    },
  },
  { id: 'regenera', nome: 'uma luz restauradora: você recupera 5 PV a cada turno por um minuto', valor: 2, aplica: (enc, a) => addCondition(a, 'regenCaos', { rounds: 10, source: a.id }) },
  {
    id: 'pontos', nome: 'a magia transborda: seus pontos de feitiçaria voltam todos', valor: 2,
    aplica: (enc, a) => { if (a.resourcesMax?.sorceryPoints) a.resources.sorceryPoints = a.resourcesMax.sorceryPoints; },
  },
  {
    id: 'teleporte', nome: 'você é lançado a até 18 m dali', valor: 1,
    aplica(enc, a) {
      const livres = [];
      for (let x = a.pos.x - 12; x <= a.pos.x + 12; x += 1) {
        for (let y = a.pos.y - 12; y <= a.pos.y + 12; y += 1) {
          if (enc.field.inside(x, y) && !enc.field.blocksMove(x, y) && !enc.at(x, y)) livres.push({ x, y });
        }
      }
      if (!livres.length) return;
      const p = livres[enc.rng.int(livres.length)];
      const de = { ...a.pos };
      a.pos = { x: p.x, y: p.y, f: a.pos.f ?? 1 };
      enc.onEvent({ type: 'teleporte', actor: a, from: de, to: { ...a.pos } });
    },
  },
  {
    id: 'cura', nome: 'uma onda de vitalidade: você recupera 2d10 PV', valor: 2,
    aplica: (enc, a) => enc.heal(a, damageRoll(enc.rng, '2d10').total, a),
  },
  { id: 'escudo', nome: 'um escudo espectral de energia: +2 de CA por um minuto', valor: 2, aplica: (enc, a) => addCondition(a, 'escudoEspectral', { rounds: 10, source: a.id }) },
  { id: 'maximo', nome: 'a magia chia de poder: por um minuto, suas magias de dano saem no máximo', valor: 2, aplica: (enc, a) => { a.surtoMaximoAte = enc.round + 10; } },
  { id: 'planta', nome: 'você vira um vaso de planta até o começo do seu próximo turno', valor: 0, aplica: (enc, a) => sobre(enc, a, 'atordoado', 1) },
  { id: 'cego', nome: 'você fica cego e surdo por um minuto', valor: 0, aplica: (enc, a) => sobre(enc, a, 'cego', 10) },
  { id: 'levita', nome: 'você levita por um minuto', valor: 1, aplica: (enc, a) => sobre(enc, a, 'levitando', 10) },
  { id: 'turno', nome: 'o tempo dobra: você faz outro turno agora', valor: 2, aplica: (enc, a) => { a.actionUsed = false; a.bonusUsed = false; } },
  { id: 'musica', nome: 'uma música etérea fraquinha cerca você por um minuto', valor: 1, aplica: () => {} },
  { id: 'barba', nome: 'uma barba comprida de penas brota no seu rosto até o próximo surto', valor: 1, aplica: () => {} },
  { id: 'bolhas', nome: 'bolhas cor-de-rosa saem da sua boca quando você fala, por um minuto', valor: 1, aplica: () => {} },
  { id: 'azul', nome: 'sua pele fica azul vivo até alguém dissipar a magia', valor: 1, aplica: () => {} },
];
