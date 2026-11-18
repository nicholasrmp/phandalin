// A VIAGEM POR MAGIA na tela da região: Teletransporte, Palavra de Recordação, Transporte pelas Plantas e Caminhar no
// Vento. A regra de cada uma é a do livro, com as nossas palavras; o que ela gasta (o espaço, o tempo) passa pelo mesmo
// `conjurarFora` das outras magias de utilidade (`rules/utilidade.js`, a tabela em `rules/utilidade-livros.js`).
//
//   - TELETRANSPORTE: o grupo some e aparece no destino; quanto o mago conhece o lugar decide a chance de errar, pela
//     tabela do livro. Phandalin, a base do grupo, é "muito familiar"; o lugar já visitado, "visto de passagem"; o que
//     só se conhece de ouvir falar, "por descrição". O acidente fere cada um com 3d10 de energético e rola de novo; o
//     "lugar parecido" é o lugar conhecido mais perto do destino; o "fora do alvo" põe o grupo longe e o dia se vai
//     andando até lá.
//   - PALAVRA DE RECORDAÇÃO: o clérigo e quem está com ele voltam ao santuário — aqui, Phandalin.
//   - TRANSPORTE PELAS PLANTAS: de uma árvore a outra que o druida conhece, no mesmo plano: o destino tem de ter mata.
//   - CAMINHAR NO VENTO: o grupo vira nuvem e voa a 300 pés por rodada, sem estrada nem terreno: qualquer destino da
//     região num só dia, sem os testes de encontro da estrada.
import { roll } from '../core/dice.js';
import { conjurarFora, podeConjurarFora, avancar as avancarTempo, estadoDe as estadoDeUtilidade } from '../rules/utilidade.js';
import { kmEntre } from '../rules/regiao-mapa.js';
import { celulaDe, terrenoEm } from '../rules/regiao-rota.js';
import { getSpell } from '../rules/spells.js';

export const VIAGENS = ['teletransporte', 'palavraDeRecordacao', 'transportePelasPlantas', 'caminharNoVento'];

/**
 * O destino tem mata por perto, no mapa do terreno? Três células em volta (uns 6 km): a Árvore-Trovão é a vila na borda
 * da Floresta de Neverwinter, e a célula dela mesma é de colina.
 */
export function temMata(id) {
  const cel = celulaDe(id);
  if (!cel) return false;
  for (let dj = -3; dj <= 3; dj++) for (let di = -3; di <= 3; di++) if (terrenoEm(cel[0] + di, cel[1] + dj) === 'f') return true;
  return false;
}

/** Quanto o grupo conhece o lugar, para a tabela do Teletransporte. */
export function familiaridade(id, feitos = {}) {
  if (id === 'phandalin') return 'muito';
  if (feitos[`visitou_${id}`]) return 'visto';
  return 'descricao';
}
// d100: até onde vai o acidente, o lugar parecido, o fora do alvo; acima, no alvo (o livro)
const TABELA = { muito: [5, 13, 24], visto: [33, 43, 53], descricao: [43, 53, 73] };

/** As viagens por magia que o grupo pode fazer de `de` para `para`: [{ c, spellId, rotulo, detalhe }]. */
export function viagensPossiveis(grupo, de, para, { feitos = {} } = {}) {
  const out = [];
  if (de === para) return out;
  // (quem não conjura entra também: o Elmo do Teletransporte conjura pelas cargas dele)
  for (const c of grupo.filter((h) => !h.dead && h.hp > 0)) {
    for (const id of VIAGENS) {
      if (out.some((o) => o.spellId === id)) continue;
      if (id === 'palavraDeRecordacao' && para !== 'phandalin') continue;
      if (id === 'transportePelasPlantas' && (!temMata(para) || !feitos[`visitou_${para}`])) continue;
      if (!podeConjurarFora(c, id).ok) continue;
      const s = getSpell(id);
      const detalhe = id === 'teletransporte'
        ? `${c.name} · o lugar é ${{ muito: 'muito familiar', visto: 'visto de passagem', descricao: 'conhecido só de ouvir falar' }[familiaridade(para, feitos)]}`
        : id === 'caminharNoVento' ? `${c.name} · chega no mesmo dia, sem estrada` : c.name;
      out.push({ c, spellId: id, rotulo: s.name, detalhe });
    }
  }
  return out;
}

/**
 * Faz a viagem. Devolve { ok, chegou: id do lugar onde o grupo está agora, texto: [linhas] } ou { ok: false, why }.
 * `conhecidos`: os ids dos lugares que o grupo conhece (para o "lugar parecido").
 */
export function viajarPorMagia(campanha, grupo, rng, { c, spellId, de, para, conhecidos = [] }) {
  const estado = estadoDeUtilidade(campanha);
  const r = conjurarFora(estado, c, spellId, { herois: grupo, rng });
  if (!r.ok) return r;
  const texto = [];
  const feitos = campanha.feitos ?? {};
  if (spellId === 'teletransporte') {
    const fam = familiaridade(para, feitos);
    const [acid, pareci, fora] = TABELA[fam];
    for (let tent = 0; tent < 6; tent++) {
      const d = roll(rng, '1d100').total;
      if (d <= acid) {
        texto.push(`A magia escapa (d100 = ${d}): o grupo é rasgado no caminho.`);
        for (const h of grupo.filter((x) => !x.dead)) {
          const dano = roll(rng, '3d10').total;
          h.hp = Math.max(1, h.hp - dano);
          texto.push(`${h.name} sofre ${dano} de dano energético.`);
        }
        continue;
      }
      if (d <= pareci) {
        const perto = conhecidos.filter((id) => id !== para && id !== de).sort((a, b) => (kmEntre(a, para) ?? 999) - (kmEntre(b, para) ?? 999))[0];
        if (perto) {
          texto.push(`O grupo aparece num lugar parecido (d100 = ${d}): não é o destino, é o que há de mais próximo dele.`);
          return { ok: true, chegou: perto, texto };
        }
      }
      if (d <= fora) {
        const km = Math.max(1, Math.round(((kmEntre(de, para) ?? 10) * roll(rng, '1d10').total * roll(rng, '1d10').total) / 100));
        avancarTempo(estado, Math.min(480, km * 15), grupo);
        texto.push(`O grupo aparece fora do alvo (d100 = ${d}), a uns ${km} km do destino, e o resto do dia vai na caminhada até lá.`);
        return { ok: true, chegou: para, texto };
      }
      texto.push(`${c.name} conclui as palavras e o grupo está lá (d100 = ${d}).`);
      return { ok: true, chegou: para, texto };
    }
    texto.push('Depois de tantas tentativas tortas, o grupo para onde está.');
    return { ok: true, chegou: de, texto };
  }
  if (spellId === 'palavraDeRecordacao') {
    texto.push(`${c.name} diz a palavra, e o grupo está de volta a Phandalin, num piscar.`);
    return { ok: true, chegou: 'phandalin', texto };
  }
  if (spellId === 'transportePelasPlantas') {
    texto.push(`${c.name} entra numa árvore e sai de outra, e o grupo vem atrás, pelo mesmo caminho de seiva.`);
    return { ok: true, chegou: para, texto };
  }
  if (spellId === 'caminharNoVento') {
    const km = kmEntre(de, para) ?? 30;
    // 300 pés por rodada são uns 90 km por hora no ar; com o minuto de virar nuvem e o de voltar, horas de viagem
    const horas = Math.max(1, Math.ceil(km / 90));
    avancarTempo(estado, horas * 60, grupo);
    texto.push(`O grupo vira nuvem e o vento o leva: ${km} km em ${horas === 1 ? 'uma hora' : `${horas} horas`}, por cima de mata, colina e rio.`);
    return { ok: true, chegou: para, texto };
  }
  return { ok: false, why: 'viagem desconhecida' };
}

