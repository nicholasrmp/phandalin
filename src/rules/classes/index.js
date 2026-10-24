// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md
// As doze classes do SRD, cada uma com a subclasse que o SRD publica.
//
// Só as subclasses do SRD estão aqui: as outras do Livro do Jogador não
// estão na licença aberta (ver NOTICE.md). Uma subclasse nova entra em
// `subclasse.opcoes` da classe, com `fonte` dizendo de onde veio.

import barbaro from './barbaro.js';
import bardo from './bardo.js';
import bruxo from './bruxo.js';
import clerigo from './clerigo.js';
import druida from './druida.js';
import feiticeiro from './feiticeiro.js';
import guerreiro from './guerreiro.js';
import ladino from './ladino.js';
import mago from './mago.js';
import monge from './monge.js';
import paladino from './paladino.js';
import patrulheiro from './patrulheiro.js';

export const CLASSES = {
  barbaro, bardo, bruxo, clerigo, druida, feiticeiro,
  guerreiro, ladino, mago, monge, paladino, patrulheiro,
};

export { CARACTERISTICAS, nomeDaCaracteristica } from './caracteristicas.js';
