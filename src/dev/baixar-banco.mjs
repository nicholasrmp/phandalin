// Traz para `public/dialogos/banco.json` as falas que o jogo publicado aprendeu no Durable Object. Só acrescenta, e não gasta crédito.
// Depois disso as falas vão junto no próximo deploy, e valem mesmo com a API desligada.
//
//   node src/dev/baixar-banco.mjs https://endereco-do-jogo
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const CAMINHO = fileURLToPath(new URL('../../public/dialogos/banco.json', import.meta.url));

/** Junta `novo` em `banco`; a mesma pergunta, no mesmo estado da ficha, fica como estava. Devolve quantas falas entraram. */
export function juntarBancos(banco, novo) {
  let entraram = 0;
  for (const [npc, falas] of Object.entries(novo?.falas ?? {})) {
    const lista = (banco.falas[npc] ??= []);
    for (const f of falas) {
      if (lista.some((e) => e.q === f.q && e.marca === f.marca && e.versao === f.versao)) continue;
      lista.push(f);
      entraram += 1;
    }
  }
  return entraram;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const base = process.argv[2];
  if (!base) { console.error('use: node src/dev/baixar-banco.mjs <endereço do jogo>'); process.exit(1); }
  const r = await fetch(new URL('/api/dialogo', base));
  if (!r.ok) { console.error(`o servidor respondeu ${r.status}`); process.exit(1); }
  const banco = JSON.parse(fs.readFileSync(CAMINHO, 'utf8'));
  const entraram = juntarBancos(banco, await r.json());
  fs.writeFileSync(CAMINHO, `${JSON.stringify(banco, null, 1)}\n`);
  console.log(`${entraram} fala(s) nova(s) em public/dialogos/banco.json`);
}
