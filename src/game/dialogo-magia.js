// Como as magias de utilidade mudam UM nó de conversa (`game/dialogo.js`), sem tela: para dar
// para testar.
//
// Um nó pode trazer dois "avessos", escritos pelo cenário:
//
//   zona    o que o NPC diz (e faz) SE está sob a Zona da Verdade: a mentira do nó vira verdade.
//           { narra?, fala, ao?, opcoes?, fim? } — o que vier aqui troca o que o nó diz.
//   ajuda   o que acontece SE o NPC está cativado (Cativar): ele não grita nem chama ajuda.
//           { narra?, fala?, fim? }
//
// O nó original continua valendo para quem não está sob a magia.

const AVISO_DA_ZONA = 'A Zona da Verdade segura a língua dele: o que sai é verdade, ou nada.';

/** O nó que o jogador vê, dadas as magias sobre o NPC. */
export function noSobMagia(no, { zona = false, cativado = false } = {}) {
  let out = no;
  if (zona && no.zona) {
    const { narra, ...resto } = no.zona;
    out = { ...out, ...resto, narra: narra ?? AVISO_DA_ZONA };
  }
  if (cativado && no.ajuda) out = { ...out, ...no.ajuda };
  return out;
}

/** O nó tem um avesso que a Zona da Verdade vira? (Para a etiqueta "a mentira aparece".) */
export const temAvessoDaZona = (no) => Boolean(no?.zona);
