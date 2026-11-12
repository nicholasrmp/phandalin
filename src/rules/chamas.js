// AS MAGIAS QUE MEXEM NA CHAMA DO MAPA (Guia de Xanathar): Controlar Chamas e Pirotecnia. A chama é a LUZ do mapa que queima
// (a tocha, o braseiro, a fogueira, a vela — `field.luzes`, menos a que ilumina sem queimar, `semChama`), a mesma que o menu
// de fogo apaga e acende (`game/fogo.js`). O livro fala de chama NÃO mágica: a fogueira da Criar Fogueira e a zona de fogo de
// uma magia não entram.
//
// Mora em `rules/` (e não em `game/fogo.js`) porque o motor da luta a chama (`livro-motor.js conjurarDoLivro`).
import { distanceFt } from '../core/grid.js';

/** A chama acesa (luz que queima) nesta casa, ou null. */
export const chamaNaCasa = (field, p) => (field.luzes ?? []).find((l) => l.pos?.x === p?.x && l.pos?.y === p?.y && !l.semChama && !l.apagada) ?? null;

/** Apaga a chama e a arte acesa que vai com ela (o mesmo que `fogo.js mudarFogo`). */
export function apagarChama(field, luz) {
  luz.apagada = true;
  if (luz.sobreposicao) field.alternarSobreposicao?.(luz.sobreposicao, false);
  field.versao = (field.versao ?? 0) + 1;
}

/** O alcance da luz em pés: o claro e a penumbra, que Controlar Chamas dobra ou corta pela metade. */
function mudarAlcance(field, luz, fator) {
  luz.claroOriginal ??= luz.claro ?? 0;
  luz.penumbraOriginal ??= luz.penumbra ?? 0;
  luz.claro = Math.round((luz.claro ?? 0) * fator);
  luz.penumbra = Math.round((luz.penumbra ?? 0) * fator);
  field.versao = (field.versao ?? 0) + 1;
}

export const EFEITOS_DAS_CHAMAS = {
  /** CONTROLAR CHAMAS: apaga a chama, ou dobra, ou corta pela metade a luz dela (por uma hora: no jogo, até a cena acabar). */
  controlarChamas(enc, actor, spell, { point, opcao }) {
    const luz = chamaNaCasa(enc.field, point);
    if (!luz) { enc.say('aviso', 'Não há chama acesa ali.'); return false; }
    const nome = luz.nome ?? 'a chama';
    if (opcao === 'dobrar') { mudarAlcance(enc.field, luz, 2); enc.say('magia', `${actor.name} sopra vida em ${nome}: a luz dobra.`); return true; }
    if (opcao === 'metade') { mudarAlcance(enc.field, luz, 0.5); enc.say('magia', `${actor.name} fecha a mão e ${nome} encolhe: a luz cai à metade.`); return true; }
    apagarChama(enc.field, luz);
    enc.say('magia', `${actor.name} fecha a mão, e ${nome} se apaga de uma vez.`);
    return true;
  },
  /**
   * PIROTECNIA: a chama se apaga e vira FOGOS (quem está a 3 m dela testa Constituição ou fica cego até o fim do próximo
   * turno de quem conjurou) ou FUMAÇA (uma nuvem de 6 m de raio, escuridão pesada, por 1 minuto).
   */
  pirotecnia(enc, actor, spell, { point, opcao, dc }) {
    const luz = chamaNaCasa(enc.field, point);
    if (!luz) { enc.say('aviso', 'Não há chama acesa ali.'); return false; }
    apagarChama(enc.field, luz);
    if (opcao === 'fumaca') {
      const spec = { ...spell, shape: 'sphere', areaFt: 20, zona: { rodadas: 10, quando: 'nunca', aoEntrar: false, dificil: false, semTeste: true, obscuro: 'pesada' } };
      const casas = enc.areaDaMagia(actor, spec, point) ?? [];
      enc.criarZona(actor, spec, casas, dc, { centro: point });
      enc.say('magia', `${luz.nome ?? 'A chama'} se apaga num rolo de fumaça grossa que toma 6 m em volta.`);
      return true;
    }
    enc.say('magia', `${luz.nome ?? 'A chama'} estoura em fogos de artifício.`);
    for (const c of enc.combatants.filter((x) => !x.dead && x.hp > 0 && distanceFt(x.pos, point) <= 10)) {
      const s = enc.resistencia(c, 'con', dc, { contra: { condicao: 'cego', magico: true, conjurador: actor } });
      if (s.success) continue;
      enc.aplicarCondicao(c, 'cego', { rounds: 1, quando: 'fim', lado: actor.side, source: actor.id });
      enc.say('condicao', `${c.name} fica cego com o clarão.`);
    }
    return true;
  },
};
