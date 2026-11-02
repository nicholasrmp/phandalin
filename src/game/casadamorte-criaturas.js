// Livro do Jogador não é SRD: a Maldição de Strahd é conteúdo da Wizards. O TEXTO é nosso, os fatos são os do livro — ver NOTICE.md e STRAHD.md.
//
// As CRIATURAS da Casa da Morte, por andar. Ninguém está à vista: cada grupo espera escondido onde o livro o põe, e a cena
// (`capitulo-casadamorte.js`) o traz para o tabuleiro quando o gatilho do livro dispara.
//
//   3º andar   armadura animada (11)  ·  vassoura animada (14)  ·  espectro da babá (15B)
//   sótão      espectro da babá (18), se não foi vencido lá embaixo
//   masmorra 1 enxame de centopeias (23D)  ·  grick (28)  ·  quatro carniçais (29)  ·  cinco sombras (31)  ·  mímico (33)  ·  dois lívidos (34)
//   masmorra 2 o arbusto errante, Lorghoth, o Decadente (38)
//
// `grupo` é a chave que a cena usa; `olha`, para onde cada um olha ao nascer.

import { makeMonster } from '../rules/monsters.js';
import { casa } from './casadamorte-plantas.js';

/** Um quadrado do livro, em casas do mapa: `[x, y]`. */
const P = (x, y) => { const c = casa(x, y); return [c.x, c.y]; };

const m = (id, x, y, grupo, { sufixo = '', nome = null, olha = { dx: 0, dy: 1 } } = {}) => {
  const f = makeMonster(id, { x, y }, { nameSuffix: sufixo });
  f.grupo = grupo;
  f.facingVec = olha;
  if (nome) f.name = nome;
  return f;
};

/** As criaturas de cada variante da casa; a lista é vazia onde o livro não põe ninguém (1º e 2º andares). */
export function foesDaCasa(variante) {
  switch (variante) {
    case 'casaDaMorte3':
      return [
        m('armaduraAnimada', ...P(2, 3), 'armadura', { olha: { dx: 0, dy: 1 } }),
        m('vassouraAnimada', ...P(0, 6), 'vassoura', { olha: { dx: 1, dy: 0 } }),
        m('espectro', ...P(0, 8), 'espectroBaba', { nome: 'A babá', olha: { dx: 1, dy: 0 } }),
      ];
    case 'casaDaMorte4':
      return [m('espectro', ...P(1, 6), 'espectroBaba', { nome: 'A babá', olha: { dx: 1, dy: 0 } })];
    case 'casaDaMortePorao1':
      return [
        // 23D: o enxame sai da parede dos fundos se mexerem no caixão de Elisabeth.
        m('enxameDeCentopeias', 17, 19, 'centopeias', { olha: { dx: 0, dy: -1 } }),
        // 28: a despensa. O grick desliza para o primeiro que chegar a 1,5 m.
        m('grick', 15, 20, 'grick', { olha: { dx: 1, dy: 0 } }),
        // 29: os quatro carniçais (ex-cultistas) se levantam do chão nas quatro vias.
        m('ghoul', 9, 16, 'carnicais', { sufixo: 'A', olha: { dx: 1, dy: 0 } }),
        m('ghoul', 7, 16, 'carnicais', { sufixo: 'B', olha: { dx: 1, dy: 0 } }),
        m('ghoul', 10, 18, 'carnicais', { sufixo: 'C', olha: { dx: 0, dy: -1 } }),
        m('ghoul', 10, 17, 'carnicais', { sufixo: 'D', olha: { dx: 0, dy: -1 } }),
        // 31: as cinco sombras se formam ao redor da estátua de Strahd.
        ...[[9, 22], [8, 22], [7, 22], [7, 23], [8, 21]].map(([x, y], i) => m('sombra', x, y, 'sombras', { sufixo: 'ABCDE'[i], olha: { dx: 0, dy: -1 } })),
        // 33: a porta do canto sudoeste (a que dá no santuário) é um mímico.
        m('mimico', 5, 19, 'mimico', { nome: 'A porta', olha: { dx: 0, dy: 1 } }),
        // 34: Gustav e Elisabeth, nas cavidades atrás das paredes de terra.
        m('livido', 5, 13, 'livdos', { nome: 'Gustav Durst', olha: { dx: -1, dy: 0 } }),
        m('livido', 3, 11, 'livdos', { nome: 'Elisabeth Durst', olha: { dx: -1, dy: 0 } }),
      ];
    case 'casaDaMortePorao2':
      return [m('arbustoErrante', 1, 7, 'lorghoth', { nome: 'Lorghoth, o Decadente', olha: { dx: 1, dy: 0 } })];
    default:
      return [];
  }
}
