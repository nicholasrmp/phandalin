// O TEXTO DAS SUBCLASSES DOS LIVROS no formato do jogo. Lê a tabela escrita à mão (`rules/classes/subclasses-<livro>.js`:
// as subclasses que o jogo joga, com os ids dos recursos) e o texto traduzido (`src/dev/subclasses/<livro>-pt.json`, de
// `traduzir-subclasses.mjs`), e escreve `rules/classes/caracteristicas-<livro>.js`: o nome em pt-br de cada subclasse e o
// nome e a regra de cada recurso, pelo id.
//
//   node src/dev/importar-subclasses.mjs xge
//
// Recusa (e não escreve) se um recurso da tabela não acha o texto, ou se um id dos níveis não tem nem texto do livro nem
// característica feita à mão.
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const LIVRO = (process.argv[2] ?? 'xge').toLowerCase();
const MAIUSC = LIVRO.toUpperCase();

const texto = (e) => (Array.isArray(e) ? e.map(texto).join(' ') : typeof e === 'string' ? e
  : e?.type === 'refSubclassFeature' ? '' : e?.entries ? texto(e.entries) : e?.items ? texto(e.items) : e?.entry ? texto(e.entry) : '');

/** A lista do livro, na MESMA ordem que foi à tradução: (nível, nome em inglês) de cada recurso. */
function recursosDoLivro(chave) {
  const pasta = `${RAIZ}_referencias/5etools/class`;
  for (const f of fs.readdirSync(pasta)) {
    const d = JSON.parse(fs.readFileSync(`${pasta}/${f}`, 'utf8'));
    for (const s of d.subclass ?? []) {
      if (s._copy || s.source !== MAIUSC || `${s.className}|${s.name}` !== chave) continue;
      return (d.subclassFeature ?? []).filter((x) => x.subclassShortName === s.shortName && x.subclassSource === s.source && x.name !== s.name)
        .map((x) => ({ nivel: x.level, en: x.name, texto: texto(x.entries) }));
    }
  }
  return null;
}

const tabela = await import(pathToFileURL(`${RAIZ}src/rules/classes/subclasses-${LIVRO}.js`).href);
const SUBS = tabela[`SUBCLASSES_${MAIUSC}`];
const RECURSOS = tabela[`RECURSOS_${MAIUSC}`];
const pt = JSON.parse(fs.readFileSync(`${RAIZ}src/dev/subclasses/${LIVRO}-pt.json`, 'utf8'));
// As características feitas à mão (Ataque Extra, Estilo de Luta...): um recurso do livro pode repetir uma delas.
const { CARACTERISTICAS } = await import(pathToFileURL(`${RAIZ}src/rules/classes/caracteristicas.js`).href);

const erros = [];
const nomes = {};
const recursos = {};
const deFora = [];
for (const [classe, subs] of Object.entries(SUBS)) {
  for (const [id, s] of Object.entries(subs)) {
    const traducao = pt[s.chave];
    const livro = recursosDoLivro(s.chave);
    if (!traducao || !livro) { erros.push(`${classe}.${id}: sem texto traduzido ou sem a subclasse no dado do livro (${s.chave})`); continue; }
    if (traducao.recursos.length !== livro.length) { erros.push(`${s.chave}: a tradução tem ${traducao.recursos.length} recursos e o livro ${livro.length}`); continue; }
    nomes[`${classe}.${id}`] = traducao.nome;
    const lista = livro.map((r, i) => ({ ...r, nome: traducao.recursos[i].nome, desc: traducao.recursos[i].desc }));
    const usados = new Set();
    for (const [nivel, ids] of Object.entries(s.niveis)) {
      for (const f of ids) {
        const r = RECURSOS[f];
        if (!r) {
          if (!CARACTERISTICAS[f]) erros.push(`${classe}.${id}: o recurso "${f}" do ${nivel}º nível não tem texto nem característica feita à mão`);
          continue;
        }
        if (r.texto) { recursos[f] = { nome: r.texto.nome, desc: r.texto.desc }; continue; }
        const nv = r.nivel ?? Number(nivel);
        const achado = lista.find((x) => x.en === r.en && x.nivel === nv) ?? lista.find((x) => x.en === r.en);
        if (!achado) { erros.push(`${classe}.${id}: "${r.en}" não está no livro`); continue; }
        usados.add(achado);
        // `junta`: os pedaços do livro que são opções DESTE recurso (o Deserto, o Mar e a Tundra da aura; os três floreios).
        const partes = [achado.desc];
        for (const en of r.junta ?? []) {
          const peca = lista.find((x) => x.en === en && x.nivel === nv && !usados.has(x)) ?? lista.find((x) => x.en === en && !usados.has(x));
          if (!peca) { erros.push(`${classe}.${id}: a opção "${en}" de "${r.en}" não está no livro`); continue; }
          usados.add(peca);
          partes.push(`${peca.nome}: ${peca.desc}`);
        }
        if (r.nota) partes.push(r.nota);
        recursos[f] = { nome: achado.nome, desc: partes.join(' ') };
      }
    }
    for (const x of lista) if (!usados.has(x)) deFora.push(`${s.chave}: ${x.nivel}º ${x.en}`);
  }
}
// o texto à mão que não está em nível nenhum (as opções escolhidas, como os Disparos Arcanos)
for (const [f, r] of Object.entries(RECURSOS)) if (r.texto && !recursos[f]) recursos[f] = { nome: r.texto.nome, desc: r.texto.desc };
if (erros.length) {
  for (const e of erros) console.log(`ERRO ${e}`);
  process.exit(1);
}
const saida = `${RAIZ}src/rules/classes/caracteristicas-${LIVRO}.js`;
fs.writeFileSync(saida, `// GERADO por src/dev/importar-subclasses.mjs ${LIVRO}: o nome e a regra, em texto nosso, das subclasses de
// \`subclasses-${LIVRO}.js\` (o texto vem de src/dev/subclasses/${LIVRO}-pt.json).
export const NOMES_DAS_SUBCLASSES_${MAIUSC} = ${JSON.stringify(nomes, null, 1)};

export const TEXTO_${MAIUSC} = ${JSON.stringify(recursos, null, 1)};
`);
console.log(`${Object.keys(nomes).length} subclasses, ${Object.keys(recursos).length} recursos -> ${saida.replace(RAIZ, '')}`);
if (deFora.length) console.log(`Do livro, fora do jogo (feitos à mão com outro id, ou opcionais de outro livro):\n  ${deFora.join('\n  ')}`);

// o que entrou sem ícone de traço (tema Obsidiana): `inventario-icones.mjs`
(await import('./icones-faltando.mjs')).avisarIconesFaltando('classe');
