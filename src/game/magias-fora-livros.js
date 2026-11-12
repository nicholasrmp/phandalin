// AS MAGIAS DE EXPLORAÇÃO DOS LIVROS na cena: o que só a cena resolve antes da regra (quem a Localizar Criatura acha)
// e o texto do que aconteceu. A regra mora em `rules/utilidade.js` (com a tabela de `rules/utilidade-livros.js`); a
// viagem, em `game/viagem-magica.js`. Texto nosso, como o resto: a magia conta o que fez no jogo.
import { distanceFt } from '../core/grid.js';
import { MONSTERS } from '../rules/monsters.js';
import { UTIL } from '../rules/utilidade.js';
import { NPCS } from '../rules/npcs.js';

/** Antes da regra. Devolve { opts } ou { erro }, ou null quando a magia não é destas. */
export function prepararDosLivros(x, c, spellId, opts) {
  const { app } = x;
  if (spellId === 'localizarCriatura') {
    // a criatura escondida mais perto (as que esperam fora do tabuleiro e as do tabuleiro que ninguém viu)
    const todas = [...(app.inimigosEscondidos ?? []), ...(app.enc?.combatants ?? []).filter((m) => m.side === 'foes' && m.conditions?.some((k) => k.id === 'invisivel' && k.data?.escondido))];
    const alvo = todas.filter((m) => !m.dead && m.pos && c.pos && distanceFt(c.pos, m.pos) <= 1000)
      .sort((a, b) => distanceFt(c.pos, a.pos) - distanceFt(c.pos, b.pos))[0];
    return { opts: { ...opts, dados: alvo ? { ponto: { x: alvo.pos.x, y: alvo.pos.y }, nome: alvo.name, cena: app.capitulo?.lugar } : {} } };
  }
  return null;
}

/** O texto. Devolve as linhas, ou null quando a magia não é destas. */
export function contarDosLivros(x, c, r, { alvo = null } = {}) {
  const id = r.spell.id;
  const u = UTIL[id];
  const res = r.resultado;
  if (!u || !['phb', 'xge'].includes(r.spell.fonte)) return null;
  const nome = alvo?.name ?? 'o alvo';
  const t = [];
  if (u.efeito === 'comunhao') {
    if (res.risco && !res.risco.passou) {
      t.push(`A mente de ${c.name} toca algo grande demais (Inteligência ${res.risco.total} contra ${res.risco.cd}): ${res.risco.dano} de dano psíquico, e a razão foge. Até o descanso longo, ${c.name} não age nem entende o que ouve.`);
      return t;
    }
    t.push(id === 'comunhaoComANatureza'
      ? `${c.name} põe a mão no chão e a terra conta o que sabe do lugar.`
      : id === 'contatarOutroPlano'
        ? `${c.name} manda a mente para longe e alguma coisa, de muito longe, responde${res.risco ? ` (Inteligência ${res.risco.total}, a mente aguenta)` : ''}.`
        : `${c.name} faz a oferenda e pergunta. A resposta vem curta, e verdadeira.`);
    for (const q of res.comunhao ?? []) t.push(`— ${q.pergunta} ${q.sim ? 'Sim.' : 'Não.'}`);
    return t;
  }
  switch (u.efeito) {
    case 'lenda': {
      const def = MONSTERS[alvo?.defId];
      t.push(`Dez minutos de incenso e silêncio, e o que se conta de ${nome} vem à cabeça de ${c.name}.`);
      t.push(def?.lore || def?.blurb || 'Pouca coisa: ninguém que tenha contado histórias dele viveu para contar mais.');
      return t;
    }
    case 'olho':
      t.push(id === 'videncia'
        ? `${c.name} olha na água parada e vê longe. Por dez minutos ele enxerga o que se move a até 9 m de onde o olho abriu, e uma parede não atrapalha: as três coisas mais próximas aparecem marcadas no mapa.`
        : `Um olho que ninguém vê se abre no ar diante de ${c.name}. Por uma hora ele enxerga o que se move a até 9 m, e uma parede não atrapalha: as três coisas mais próximas aparecem marcadas no mapa.`);
      return t;
    case 'localizarCriatura':
      t.push(res.achou
        ? `${c.name} pensa em quem procura, e a magia aponta: ${res.achou} está ali, marcado no mapa.`
        : `${c.name} procura, e a magia não aponta ninguém escondido a até 300 m.`);
      return t;
    case 'mensagem': {
      const m = res.mensagem;
      const quem = NPCS[m?.quem]?.nome ?? 'alguém';
      t.push(`A mente de ${c.name} encontra a de ${quem}, e os dois conversam sem som nenhum${m?.destino === 'morto' ? ' — ou deveriam: do outro lado não há ninguém, e ' + quem + ' está morto' : ''}.`);
      return t;
    }
    case 'alarme':
      t.push(`${c.name} protege o lugar com ${r.spell.name}. Enquanto durar, quem chegar sem ser chamado é notado antes de chegar: numa emboscada aqui, ninguém do grupo é pego de surpresa. (O resto do que a magia faz no livro o tabuleiro ainda não guarda.)`);
      return t;
    case 'cabana':
      t.push(`${c.name} desenha uma porta no ar, e do outro lado há uma casa inteira: salões, camas e um banquete servido por criados que ninguém vê. O grupo passa a noite ali, a salvo, e come como nunca.`);
      return t;
    case 'disfarce':
      t.push(`O grupo inteiro muda de cara, de roupa e de jeito. Por oito horas, todos passam pelo que ${c.name} quis: vantagem em Enganação.`);
      return t;
    case 'labia':
      t.push(`A fala de ${c.name} fica macia e firme. Por uma hora, num teste de Carisma, o d20 que vier abaixo de 15 conta como 15.`);
      return t;
    case 'sugestao':
      t.push(res.resistiu
        ? `${nome} sacode a cabeça: a ordem não pegou (Sabedoria ${res.resistencia?.total} contra ${res.dc}).`
        : `${nome} recebe a ordem como se fosse dele (Sabedoria ${res.resistencia?.total} contra ${res.dc}). Por trinta dias, o próximo pedido que o grupo lhe fizer, ele cumpre.`);
      return t;
    case 'memoria':
      t.push(res.resistiu
        ? `${nome} pisca e afasta a mão de ${c.name} da cabeça (Sabedoria ${res.resistencia?.total} contra ${res.dc}): lembra de tudo, e agora lembra disto também.`
        : `${nome} esquece o que o grupo fez com ele: a desconfiança, a sensação de ter sido influenciado, a mente que foi lida (Sabedoria ${res.resistencia?.total} contra ${res.dc}).`);
      return t;
    case 'reviver':
      t.push(u.corpoNovo
        ? `Uma hora de ritual, e um corpo novo se forma onde estava o velho. ${res.revivido?.name ?? 'Ele'} abre os olhos inteiro, com outro rosto. (A raça nova não muda nada no jogo ainda.)`
        : `Uma hora de ritual, e ${res.revivido?.name ?? 'ele'} volta da morte com toda a vida${u.penalidade ? ' — e com a conta de ter ido: por um tempo a mão falha e a cabeça atrasa' : ', sem marca nenhuma'}.`);
      return t;
    case 'regenerar':
      t.push(`O corpo de ${res.regenerou?.name ?? nome} se refaz em uma hora: a carne fecha, o osso solda e toda a vida volta.`);
      return t;
    case 'cochilo':
      t.push(`${c.name} canta baixo e ${(res.cochilo ?? []).map((x) => x.h.name).join(', ') || 'ninguém'} dorme${(res.cochilo ?? []).length > 1 ? 'm' : ''} dez minutos. Acorda${(res.cochilo ?? []).length > 1 ? 'm' : ''} como de uma hora de descanso${(res.cochilo ?? []).some((x) => x.curou) ? `: ${(res.cochilo ?? []).filter((x) => x.curou).map((x) => `${x.h.name} +${x.curou} PV`).join(', ')}` : ''}.`);
      return t;
    case 'banqueteDosHerois':
      t.push(`Dez minutos de banquete servido do nada. Por um dia inteiro, quem comeu não sente medo nem veneno, resiste melhor com a cabeça (vantagem em Sabedoria) e aguenta mais: ${(res.banquete ?? []).map((b) => `${b.h.name} +${b.pv} PV`).join(', ')}.`);
      return t;
    case 'viagem':
      t.push(`${r.spell.name} se conjura na tela da região.`);
      return t;
    default:
      return null;
  }
}
