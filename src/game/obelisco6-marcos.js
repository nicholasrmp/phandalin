// OS MARCOS DO CAPÍTULO 6 (o Obelisco): o grupo chega no 7º nível, e o livro dá mais dois, por marco e não por XP —
//   o 8º depois de ENFRENTAR o guardião do fragmento em Talhundereth OU na Encruzilhada da Forca (o primeiro dos dois);
//   o 9º depois de VENCER os guardiões dos três fragmentos (Talhundereth, a Cripta dos Talhund e a Encruzilhada).
// O teto do capítulo é o 9º.
//
// Os guardiões: o aglomerado encefálico de T21 (Talhundereth), os espectros de P18 (a cripta) e o Qunbraxel (a
// Encruzilhada). Cada cena chama `guardiaoVencido` quando a luta contra o seu guardião acaba em vitória.

import { darMarco } from './obelisco5-vila.js';
import { telaDeSubirNivel } from '../view/nivel-tela.js';

/** Marca o guardião vencido e devolve os níveis de marco que isso libera (nenhum, o 8º, o 9º ou os dois). */
export function marcosDoCapitulo6(o6, lugar) {
  (o6.guardioes ??= {})[lugar] = true;
  const g = o6.guardioes;
  const marcos = [];
  if (!o6.marco8 && (g.talhundereth || g.encruzilhada)) { o6.marco8 = true; marcos.push(8); }
  if (!o6.marco9 && g.talhundereth && g.cripta && g.encruzilhada) { o6.marco9 = true; marcos.push(9); }
  return marcos;
}

/** O guardião de `lugar` caiu: dá os marcos, com a tela de subir de nível. */
export async function guardiaoVencido(app, o6, lugar, herois) {
  for (const nivel of marcosDoCapitulo6(o6, lugar)) {
    const sobem = darMarco(herois, nivel);
    app.enc?.say?.('cura', `Marco: o grupo chega ao ${nivel}º nível.`);
    if (sobem.length && app.root) for (const txt of await telaDeSubirNivel(app.root, sobem)) app.enc?.say?.('cura', txt);
  }
}
