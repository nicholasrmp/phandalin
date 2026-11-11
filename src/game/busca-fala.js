// A BUSCA POR SENTIDO NO BANCO DE FALAS, sem modelo e sem baixar nada: acha a pergunta guardada mais parecida com a que o jogador digitou,
// para "cadê a fortaleza dos goblins?" encontrar "onde fica o Castelo Dentefino". Puro: roda no navegador, no servidor e em Node.
//
// ERRAR AQUI É PIOR QUE NÃO ACHAR. Fala do assunto errado sai com a confiança de uma resposta certa, e "não achei" só vira a fala escrita
// à mão ou uma chamada ao modelo. Por isso há duas portas antes da nota: o ASSUNTO tem de ser o mesmo, e a CLASSE da pergunta também
// (quem pergunta "onde" não quer ouvir "quem"). `src/dev/medir-busca.mjs` mede o quanto isso acerta, e é ele quem decide o limiar.
import { assuntoDe, normal } from './perguntas.js';

/** A nota mínima para valer. Medido em `medir-busca.mjs`. */
export const LIMIAR_DA_BUSCA = 0.45;   // medido: 0,40 já traz fala de outro assunto; 0,45 traz zero errada

const VAZIAS = new Set(('a o as os um uma uns umas de do da dos das em no na nos nas num numa por para pra pro com sem e ou que se ja la aqui ai ali me te lhe nos vos meu minha seu sua teu tua '
  + 'ele ela eles elas voce voces eu tu isso esse essa este esta aquele aquela aquilo ser e sao era foi fica ficam esta estao tem ha vai vou sabe sabem saber acha conta contar diz dizer fala falar '
  + 'pode podem poderia queria quero gostaria favor chefe amigo ei oi ola bom boa dia entao mas so mesmo muito pouco coisa alguma algum sobre onde cade aonde quem qual quais como quando quanto quantos quantas porque pq').split(' '));

/** O mesmo sentido, com outra palavra. Só o que é do mundo e do jeito de perguntar: lista curta, porque sinônimo solto erra. */
const SINONIMOS = {
  fortaleza: 'castelo', forte: 'castelo', torres: 'castelo', caverna: 'esconderijo', covil: 'esconderijo', toca: 'esconderijo', refugio: 'esconderijo', base: 'esconderijo',
  mina: 'mina', minas: 'mina', jazida: 'mina', forja: 'forja', anao: 'gundren', prospector: 'gundren', buscapedra: 'gundren', humano: 'sildar',
  rei: 'grol', soberano: 'grol', drow: 'aranha', vilao: 'aranha', patrao: 'chefe', lider: 'chefe', comandante: 'chefe', mandachuva: 'chefe', bando: 'gangue', quadrilha: 'gangue',
  bandido: 'gangue', bandidos: 'gangue', mago: 'cajavidro', feiticeiro: 'cajavidro', dinheiro: 'tesouro', ouro: 'tesouro', riqueza: 'tesouro', moedas: 'tesouro', fortuna: 'tesouro',
  emprego: 'trabalho', servico: 'trabalho', tarefa: 'trabalho', missao: 'trabalho', recompensa: 'trabalho', pagamento: 'trabalho', perigoso: 'perigo', perigosa: 'perigo', perigos: 'perigo', ameaca: 'perigo', armadilha: 'perigo', armadilhas: 'perigo',
  nome: 'chama', chamam: 'chama', chamado: 'chama', cama: 'dormir', quarto: 'dormir', pousada: 'dormir', hospedar: 'dormir', descansar: 'dormir', comida: 'comer', bebida: 'comer', cerveja: 'comer',
  cadeia: 'presos', prisioneiros: 'presos', prisioneiro: 'presos', preso: 'presos', refem: 'presos', acontecendo: 'novidade', noticia: 'novidade', noticias: 'novidade', novidades: 'novidade', rumor: 'novidade', rumores: 'novidade',
  medo: 'medo', teme: 'medo', receia: 'medo', sair: 'saida', escapar: 'saida', fugir: 'saida', achar: 'encontrar', acho: 'encontrar', chegar: 'encontrar', chego: 'encontrar', ir: 'encontrar', caminho: 'encontrar', rota: 'encontrar',
};

const CLASSES = [
  ['onde', /^(e )?(onde|cade|aonde|em que lugar|pra onde|para onde|como (chego|chegar|acho|achar|encontro|encontrar|vou|ir))\b/],
  ['quem', /^(e )?(quem|qual e o nome|como se chama|qual o nome|qual seu nome)\b/],
  ['porque', /^(e )?(por que|porque|pq|por qual motivo|qual o motivo)\b/],
  ['quantos', /^(e )?(quantos|quantas|quanto)\b/],
  ['quando', /^(e )?(quando|desde quando|ha quanto tempo)\b/],
];

/** O tipo da pergunta, depois do "sobre klarg:" que a memória por assunto põe na frente. */
export function classeDe(pergunta) {
  const t = normal(pergunta).replace(/^sobre .*?(?= (e |por |pq|onde|cade|quem|quando|quanto|como|qual|o que|tem |mas ))/, '').trim();
  return CLASSES.find(([, re]) => re.test(t))?.[0] ?? null;
}

const raiz = (p) => (p.length > 4 ? p.replace(/(oes|aes|ais|eis|ns|s)$/, '') : p);

export function tokensDe(pergunta) {
  const lista = normal(pergunta).split(' ').filter((p) => p && !VAZIAS.has(p)).map((p) => SINONIMOS[p] ?? raiz(p));
  return [...new Set(lista)];
}

function trigramas(texto) {
  const t = ` ${normal(texto)} `;
  const g = new Set();
  for (let i = 0; i + 3 <= t.length; i += 1) g.add(t.slice(i, i + 3));
  return g;
}

/** De 0 a 1: as palavras que importam pesam mais, e as letras seguram o erro de digitação. */
export function notaEntre(a, b) {
  const ta = tokensDe(a); const tb = new Set(tokensDe(b));
  if (!ta.length || !tb.size) return 0;
  const comuns = ta.filter((p) => tb.has(p)).length;
  const palavras = comuns / (ta.length + tb.size - comuns);
  const ga = trigramas(a); const gb = trigramas(b);
  let juntos = 0;
  for (const g of ga) if (gb.has(g)) juntos += 1;
  return 0.75 * palavras + 0.25 * ((2 * juntos) / (ga.size + gb.size));
}

/** A entrada do banco mais parecida com a pergunta, ou `null`. `entradas` já vem filtrada por quem pode responder agora. */
export function maisParecida(pergunta, entradas) {
  const assunto = assuntoDe(pergunta)?.id ?? null;
  const classe = classeDe(pergunta);
  let melhor = null; let nota = 0;
  for (const e of entradas) {
    if ((e.assunto ?? null) !== assunto) continue;
    const c = classeDe(e.pergunta ?? e.q);
    if (classe && c && classe !== c) continue;
    const n = notaEntre(pergunta, e.pergunta ?? e.q);
    if (n > nota) { nota = n; melhor = e; }
  }
  return melhor && nota >= LIMIAR_DA_BUSCA ? { entrada: melhor, nota } : null;
}
