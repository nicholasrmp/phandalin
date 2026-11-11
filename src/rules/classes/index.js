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
import { SUBCLASSES_XGE } from './subclasses-xge.js';
import { NOMES_DAS_SUBCLASSES_XGE } from './caracteristicas-xge.js';
import { SUBCLASSES_TCE } from './subclasses-tce.js';
import { NOMES_DAS_SUBCLASSES_TCE } from './caracteristicas-tce.js';
import { SUBCLASSES_SCAG } from './subclasses-scag.js';
import { NOMES_DAS_SUBCLASSES_SCAG } from './caracteristicas-scag.js';
import { SUBCLASSES_DMG } from './subclasses-dmg.js';
import { NOMES_DAS_SUBCLASSES_DMG } from './caracteristicas-dmg.js';
import { SUBCLASSES_FTD } from './subclasses-ftd.js';
import { NOMES_DAS_SUBCLASSES_FTD } from './caracteristicas-ftd.js';
import { SUBCLASSES_BGG } from './subclasses-bgg.js';
import { NOMES_DAS_SUBCLASSES_BGG } from './caracteristicas-bgg.js';

export const CLASSES = {
  barbaro, bardo, bruxo, clerigo, druida, feiticeiro,
  guerreiro, ladino, mago, monge, paladino, patrulheiro,
};

// AS SUBCLASSES DOS LIVROS (Xanathar...): a tabela à mão de cada livro, com o nome em pt-br do texto traduzido. Entram
// DEPOIS das feitas à mão, então a subclasse do SRD continua sendo a primeira opção (o padrão de `subirNivel`).
for (const [livro, nomes] of [[SUBCLASSES_XGE, NOMES_DAS_SUBCLASSES_XGE], [SUBCLASSES_TCE, NOMES_DAS_SUBCLASSES_TCE], [SUBCLASSES_SCAG, NOMES_DAS_SUBCLASSES_SCAG],
  [SUBCLASSES_DMG, NOMES_DAS_SUBCLASSES_DMG], [SUBCLASSES_FTD, NOMES_DAS_SUBCLASSES_FTD], [SUBCLASSES_BGG, NOMES_DAS_SUBCLASSES_BGG]]) {
  for (const [classe, subs] of Object.entries(livro)) {
    for (const [id, s] of Object.entries(subs)) {
      // a MESMA subclasse de novo é o módulo rodando duas vezes (o Vite recarrega este arquivo e não o da classe); outra com
      // o mesmo id é erro de tabela
      const ja = CLASSES[classe].subclasse.opcoes[id];
      if (ja && ja.chave !== s.chave) throw new Error(`Subclasse repetida: ${classe}.${id}`);
      CLASSES[classe].subclasse.opcoes[id] = { nome: nomes[`${classe}.${id}`] ?? id, ...s };
    }
  }
}

export { CARACTERISTICAS, nomeDaCaracteristica } from './caracteristicas.js';
