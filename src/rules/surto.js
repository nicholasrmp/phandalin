// Livro do Jogador (não é SRD) — conteúdo próprio, ver NOTICE.md
// A TABELA DE SURTOS DE MAGIA SELVAGEM (feiticeiro): os 50 efeitos do livro (d100, dois números por efeito, então pesos iguais).
// `valor` ordena o bom (2), o neutro (1) e o ruim (0) para o Caos Controlado, que rola duas vezes e fica com o melhor.
// Os efeitos que o livro entrega ao mestre (criatura controlada pelo mestre, mudança de altura ou idade) ou que são só cor
// (barba de penas, pele azul, borboletas, música etérea...) entram na tabela e saem no registro, sem regra: `aplica` vazio.
// Magias conjuradas "em você" (bola de fogo, mísseis, confusão, graxa, espelho) não gastam ação nem espaço: o surto as dispara
// direto, com a CD de magia do feiticeiro.
import { addCondition } from './conditions.js';
import { damageRoll } from '../core/dice.js';
import { distanceFt } from '../core/grid.js';
import { spellSaveDc } from './abilities.js';

const sobre = (enc, actor, id, rounds, extra = {}) => enc.aplicarCondicao(actor, id, { rounds, source: actor.id, ...extra });
const vivos = (enc) => enc.combatants.filter((x) => !x.dead);
const perto = (enc, a, ft, comAutor = false) => vivos(enc).filter((x) => (comAutor || x !== a) && distanceFt(a.pos, x.pos) <= ft);
const maisPerto = (enc, a) => perto(enc, a, 600).sort((x, y) => distanceFt(a.pos, x.pos) - distanceFt(a.pos, y.pos))[0];
const sorteia = (enc, lista) => (lista.length ? lista[enc.rng.int(lista.length)] : null);
const cor = () => {};
// Pede à camada de desenho uma animação em uma casa (`surtoFx` em main.js); sem desenho, o evento cai no vazio.
const fx = (enc, nome, pos) => enc.onEvent?.({ type: 'surtoFx', fx: nome, pos: { x: pos.x, y: pos.y, f: pos.f ?? 1 } });

export const SURTOS = [
  {
    id: 'bolaDeFogo', nome: 'uma bola de fogo estoura sobre você', valor: 0,
    aplica(enc, a) {
      const dano = damageRoll(enc.rng, '8d6').total;
      const cd = spellSaveDc(a);
      fx(enc, 'bola-de-fogo', a.pos);
      for (const c of perto(enc, a, 20, true)) {
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
      fx(enc, 'arcano-impacto', alvo.pos);
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
  // 33-34: só a PRÓXIMA magia de dano (o gancho em `castSpell` apaga a marca depois dela).
  { id: 'maximo', nome: 'a magia chia de poder: a próxima magia de dano que você conjurar em um minuto sai no máximo', valor: 2, aplica: (enc, a) => { a.surtoMaximoAte = enc.round + 10; } },
  {
    id: 'planta', nome: 'você vira um vaso de planta até o começo do seu próximo turno', valor: 0,
    // Incapacitado e vulnerável a todo dano. (O vaso que quebra aos 0 PV não é modelado: quem cai fica caído como de costume.)
    aplica: (enc, a) => { fx(enc, 'poof-vaso', a.pos); sobre(enc, a, 'vasoDePlanta', 1, { quando: 'inicio', lado: a.side }); },
  },
  { id: 'levita', nome: 'você levita por um minuto', valor: 1, aplica: (enc, a) => sobre(enc, a, 'levitando', 10) },
  // 81-82: uma ação a mais agora (o antigo "outro turno" inteiro era invenção do jogo).
  { id: 'turno', nome: 'o tempo dobra: você ganha uma ação extra agora', valor: 2, aplica: (enc, a) => { a.actionUsed = false; } },
  { id: 'musica', nome: 'uma música etérea fraquinha cerca você por um minuto', valor: 1, aplica: cor },
  { id: 'barba', nome: 'uma barba comprida de penas brota no seu rosto até você espirrar', valor: 1, aplica: cor },
  { id: 'bolhas', nome: 'bolhas cor-de-rosa saem da sua boca quando você fala, por um minuto', valor: 1, aplica: cor },
  { id: 'azul', nome: 'sua pele fica azul vivo até alguém dissipar a magia', valor: 1, aplica: cor },

  // ---- o resto da tabela do livro --------------------------------------------------------------------------------------
  {
    id: 'repete', nome: 'a magia continua a vazar: role de novo no começo de cada turno seu por um minuto', valor: 0,
    aplica: (enc, a) => addCondition(a, 'surtoRepetido', { rounds: 10, source: a.id }),
  },
  { id: 'invisiveis', nome: 'você enxerga criaturas invisíveis por um minuto', valor: 1, aplica: cor },
  { id: 'modron', nome: 'um modron do mestre surge ao seu lado e some em um minuto', valor: 1, aplica: cor },
  { id: 'altura', nome: 'sua altura muda 1d10 polegadas', valor: 1, aplica: cor },
  {
    id: 'confusao', nome: 'uma confusão estoura em volta de você', valor: 0,
    aplica(enc, a) {
      const cd = spellSaveDc(a);
      for (const c of perto(enc, a, 10, true)) {
        const sv = enc.resistencia(c, 'wis', cd, { contra: { magico: true } });
        if (!sv.success) { sobre(enc, c, 'confuso', 10); fx(enc, 'confusao-estrelas', c.pos); }
      }
    },
  },
  {
    id: 'graxa', nome: 'o chão em volta de você vira graxa', valor: 0,
    aplica(enc, a) {
      const cd = spellSaveDc(a);
      fx(enc, 'graxa', a.pos);
      for (const c of perto(enc, a, 5, true)) {
        const sv = enc.resistencia(c, 'dex', cd, { contra: { magico: true } });
        if (!sv.success) sobre(enc, c, 'caido', 1);
      }
    },
  },
  { id: 'desvantagem', nome: 'a próxima magia sua com resistência, em um minuto, dá desvantagem a todos os alvos', valor: 2, aplica: (enc, a) => { a.surtoDesvSaveAte = enc.round + 10; } },
  { id: 'olho', nome: 'um olho brota na sua testa: vantagem em Percepção pela visão por um minuto', valor: 1, aplica: cor },
  { id: 'rapida', nome: 'suas magias de uma ação passam a custar uma ação bônus por um minuto', valor: 2, aplica: (enc, a) => { a.surtoRapidoAte = enc.round + 10; } },
  {
    id: 'astral', nome: 'você é levado ao Plano Astral até o fim do seu próximo turno', valor: 0,
    aplica: (enc, a) => sobre(enc, a, 'banido', 1, { quando: 'fim', lado: a.side }),
  },
  { id: 'idade', nome: 'sua idade muda 1d10 anos', valor: 1, aplica: cor },
  { id: 'flumphs', nome: '1d6 flumphs do mestre surgem a 18 m, com medo de você, e somem em um minuto', valor: 1, aplica: cor },
  { id: 'passoDoCaos', nome: 'você pode se teleportar 6 m como ação bônus por um minuto', valor: 1, aplica: cor },
  { id: 'unicornio', nome: 'um unicórnio do mestre surge ao seu lado e some em um minuto', valor: 1, aplica: cor },
  { id: 'bebado', nome: 'você fica imune a embriaguez por 5d6 dias', valor: 1, aplica: cor },
  { id: 'careca', nome: 'seu cabelo cai e volta em 24 horas', valor: 1, aplica: cor },
  { id: 'chamas', nome: 'tudo inflamável que você tocar pega fogo por um minuto', valor: 1, aplica: cor },
  {
    id: 'espaco', nome: 'você recupera o espaço de magia gasto de menor círculo', valor: 2,
    aplica(enc, a) {
      const sc = a.spellcasting;
      if (!sc?.slots) return;
      const i = sc.slots.findIndex((n, k) => k >= 1 && n < (sc.slotsMax?.[k] ?? 0));
      if (i > 0) sc.slots[i] += 1;
    },
  },
  { id: 'grita', nome: 'você precisa gritar quando fala, por um minuto', valor: 1, aplica: cor },
  { id: 'nevoa', nome: 'uma nuvem de névoa cerca você', valor: 1, aplica: cor },
  {
    id: 'raios', nome: 'raios caem em até três criaturas a 9 m de você: 4d10 elétrico', valor: 0,
    aplica(enc, a) {
      const alvos = perto(enc, a, 30).sort((x, y) => (y.side !== a.side) - (x.side !== a.side)).slice(0, 3);
      for (const c of alvos) {
        const dano = damageRoll(enc.rng, '4d10').total;
        fx(enc, 'raio-queda', c.pos);
        enc.applyDamage(c, dano, 'elétrico', a, { magico: true });
      }
    },
  },
  {
    id: 'medo', nome: 'a criatura mais próxima te dá medo até o fim do seu próximo turno', valor: 0,
    aplica(enc, a) {
      const c = maisPerto(enc, a);
      if (c) sobre(enc, a, 'amedrontado', 1, { source: c.id, quando: 'fim', lado: a.side });
    },
  },
  {
    id: 'invisiveisTodos', nome: 'todas as criaturas a 9 m de você ficam invisíveis por um minuto', valor: 1,
    aplica: (enc, a) => { for (const c of perto(enc, a, 30, true)) sobre(enc, c, 'invisivel', 10); },
  },
  { id: 'resistencia', nome: 'você ganha resistência a todo dano por um minuto', valor: 2, aplica: (enc, a) => sobre(enc, a, 'resistenciaTotal', 10) },
  {
    id: 'veneno', nome: 'uma criatura aleatória a 18 m fica envenenada por 1d4 horas', valor: 1,
    aplica(enc, a) {
      const c = sorteia(enc, perto(enc, a, 60, true));
      if (c) sobre(enc, c, 'envenenado', 100000);
    },
  },
  { id: 'luz', nome: 'você brilha: luz forte a 9 m por um minuto; quem termina o turno a 1,5 m de você fica cego até o fim do próximo turno', valor: 1, aplica: cor },
  {
    id: 'ovelha', nome: 'você vira ovelha, a não ser que resista (Sabedoria)', valor: 0,
    aplica(enc, a) {
      const sv = enc.resistencia(a, 'wis', spellSaveDc(a), { contra: { magico: true } });
      if (!sv.success) { fx(enc, 'poof-vaso', a.pos); sobre(enc, a, 'ovelha', 10); }
    },
  },
  { id: 'borboletas', nome: 'borboletas e pétalas ilusórias esvoaçam a 3 m de você por um minuto', valor: 1, aplica: cor },
  {
    id: 'necrotico', nome: 'uma onda necrótica atinge tudo a 9 m: 1d10, e você recupera o que causou', valor: 1,
    aplica(enc, a) {
      let curado = 0;
      fx(enc, 'onda-necrotica', a.pos);
      for (const c of perto(enc, a, 30)) {
        const d = damageRoll(enc.rng, '1d10').total;
        enc.applyDamage(c, d, 'necrótico', a, { magico: true });
        curado += d;
      }
      if (curado) enc.heal(a, curado, a);
    },
  },
  { id: 'espelho', nome: 'três imagens espelhadas cercam você', valor: 2, aplica: (enc, a) => sobre(enc, a, 'imagens', 10, { data: { n: 3 } }) },
  {
    id: 'voo', nome: 'uma criatura aleatória a 18 m ganha voo por 10 minutos', valor: 1,
    aplica(enc, a) {
      const c = sorteia(enc, perto(enc, a, 60, true));
      if (c) sobre(enc, c, 'voando', 100);
    },
  },
  { id: 'invisivelSurdo', nome: 'você fica invisível e ninguém o ouve por um minuto, até atacar ou conjurar', valor: 2, aplica: (enc, a) => sobre(enc, a, 'invisivel', 10) },
  { id: 'reencarna', nome: 'se você morrer em um minuto, volta à vida como se reencarnado', valor: 1, aplica: cor },
  { id: 'tamanho', nome: 'seu tamanho sobe uma categoria por um minuto', valor: 1, aplica: cor },
  {
    id: 'perfurante', nome: 'você e todos a 9 m ficam vulneráveis a dano perfurante por um minuto', valor: 0,
    aplica: (enc, a) => { for (const c of perto(enc, a, 30, true)) sobre(enc, c, 'vulnerabilidadePerfurante', 10); },
  },
];
