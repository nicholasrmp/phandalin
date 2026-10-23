// Registro de LOOKS. Não existe arquivo de arte neste repositório: o pintor
// desenha cada figura pixel a pixel a partir destes dados.
//
// Num RPG isso rende mais do que num jogo de ação: equipamento é um traço do
// look, então vestir um item muda o boneco na hora, sem pipeline de asset.
//
// Está dividido por família para que o elenco cresça sem um arquivo gigante —
// e para que dá para mexer no bestiário sem encostar no grupo.

import { PARTY_LOOKS } from './looks/party.js';
import { BESTIARIO_LOOKS } from './looks/bestiario.js';
import { NPC_LOOKS } from './looks/npcs.js';
import { HUMANOIDES_LOOKS } from './looks/humanoides.js';
import { FERAS_LOOKS } from './looks/feras.js';
import { MORTOS_VIVOS_LOOKS } from './looks/mortosvivos.js';
import { ABERRACOES_LOOKS } from './looks/aberracoes.js';
import { DRAGAO_LOOKS } from './looks/dragao.js';

export const LOOKS = {
  ...PARTY_LOOKS,
  ...BESTIARIO_LOOKS,
  ...HUMANOIDES_LOOKS,
  ...FERAS_LOOKS,
  ...MORTOS_VIVOS_LOOKS,
  ...ABERRACOES_LOOKS,
  ...DRAGAO_LOOKS,
  ...NPC_LOOKS,
};

export function resolveLook(key) {
  const look = LOOKS[key];
  if (!look) throw new Error(`Look desconhecido: "${key}"`);
  return look;
}

export const allLookKeys = () => Object.keys(LOOKS);
