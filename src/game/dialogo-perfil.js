// FALAS POR PERFIL: opções de diálogo que só existem para quem tem a RAÇA, a CLASSE ou o ATRIBUTO certo.
//
// O motor de conversa (`dialogo.js`) já escondia opção por `requer`; faltava dizer isso em uma linha, com a etiqueta e o
// herói que fala saindo sozinhos. Uma opção ganha o campo `perfil`:
//
//   { texto: 'Eu levanto isso.', perfil: { atributo: { for: 17 } }, vai: 'conta' }
//   { texto: 'Reconheço esse trabalho de pedra.', perfil: { raca: 'anao' }, vai: 'pedra' }
//   { texto: 'Mostro o símbolo sagrado.', perfil: { classe: ['clerigo', 'paladino'] }, teste: { pericia: 'religiao', cd: 10 }, ... }
//   { texto: 'Falo grosso.', perfil: { atributo: { for: 16, car: 13 }, classe: 'barbaro' }, ... }   // todas as condições, no MESMO herói
//
//   raca        'humano' | 'anao' | 'elfo' | 'halfling' | 'gnomo' | 'draconato' | 'meioOrc' | 'meioElfo' | 'tiferino' (um ou lista)
//   classe      'guerreiro' | 'ladino' | 'clerigo' | 'mago' | 'barbaro' | 'druida' | 'bruxo' | 'feiticeiro' | 'paladino'
//               | 'patrulheiro' | 'monge' | 'bardo' (um ou lista)
//   subclasse   o id da subclasse (um ou lista)
//   atributo    { for, des, con, int, sab, car }: o valor MÍNIMO de cada um (>=)
//   nivel       o nível mínimo
//   mostrar     true: a opção aparece cinza, com o motivo, para quem não tem o perfil (o padrão é sumir)
//
// O herói que atende o perfil FALA: a etiqueta mostra quem ("[Força 17+ · Dara]"), ele rola o teste da opção (o melhor entre os
// que atendem) e `ctx.quem` guarda o nome dele para o `texto`, o `efeito` e as falas seguintes. Puro: roda em Node.

/** O nome do atributo do jogo para o da opção. */
import { conditionEffects } from '../rules/conditions.js';

const ATRIBUTO = { for: 'str', des: 'dex', con: 'con', int: 'int', sab: 'wis', car: 'cha' };
const NOME_DO_ATRIBUTO = { for: 'Força', des: 'Destreza', con: 'Constituição', int: 'Inteligência', sab: 'Sabedoria', car: 'Carisma' };

const semAcento = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z-]/g, '');

/** A raça do herói, numa chave só (sem gênero nem acento): "Meio-elfa" e "Meio-elfo" são `meioElfo`. */
export function racaDe(heroi) {
  const s = semAcento(heroi?.ancestry ?? heroi?.raca);
  if (s.startsWith('meio-orc')) return 'meioOrc';
  if (s.startsWith('meio-elf')) return 'meioElfo';
  if (s.startsWith('draconat')) return 'draconato';
  if (s.startsWith('tiferin')) return 'tiferino';
  if (s.startsWith('humano') || s.startsWith('humana')) return 'humano';
  if (s.startsWith('anao') || s.startsWith('ana')) return 'anao';
  if (s.startsWith('elf')) return 'elfo';
  if (s.startsWith('halfling')) return 'halfling';
  if (s.startsWith('gnom')) return 'gnomo';
  return s;
}

const NOME_DA_RACA = {
  humano: 'Humano', anao: 'Anão', elfo: 'Elfo', halfling: 'Halfling', gnomo: 'Gnomo', draconato: 'Draconato',
  meioOrc: 'Meio-orc', meioElfo: 'Meio-elfo', tiferino: 'Tiferino',
};
const NOME_DA_CLASSE = {
  guerreiro: 'Guerreiro', ladino: 'Ladino', clerigo: 'Clérigo', mago: 'Mago', barbaro: 'Bárbaro', druida: 'Druida', bruxo: 'Bruxo',
  feiticeiro: 'Feiticeiro', paladino: 'Paladino', patrulheiro: 'Patrulheiro', monge: 'Monge', bardo: 'Bardo',
};

const lista = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);

/** Este herói atende o perfil? Todas as condições juntas. */
export function atendePerfil(heroi, perfil) {
  if (!heroi || !perfil) return true;
  if (lista(perfil.raca).length && !lista(perfil.raca).includes(racaDe(heroi))) return false;
  if (lista(perfil.classe).length && !lista(perfil.classe).includes(heroi.classe)) return false;
  if (lista(perfil.subclasse).length && !lista(perfil.subclasse).includes(heroi.subclasse)) return false;
  if (perfil.nivel != null && (heroi.level ?? 1) < perfil.nivel) return false;
  for (const [chave, minimo] of Object.entries(perfil.atributo ?? {})) {
    if ((heroi.abilities?.[ATRIBUTO[chave]] ?? 0) < minimo) return false;
  }
  return true;
}

/** Quem do grupo atende o perfil: de pé e capaz de falar (quem dorme ou está incapacitado não puxa conversa). */
export const quemAtende = (herois, perfil) => herois.filter((h) => !conditionEffects(h).incapacitated && atendePerfil(h, perfil));

/** A etiqueta curta do perfil: "Anão", "Clérigo", "Força 17+", e em conjunto "Bárbaro · Força 16+". */
export function etiquetaDoPerfil(perfil) {
  const partes = [];
  const racas = lista(perfil.raca).map((r) => NOME_DA_RACA[r] ?? r);
  if (racas.length) partes.push(racas.join(' ou '));
  const classes = lista(perfil.classe).map((c) => NOME_DA_CLASSE[c] ?? c);
  if (classes.length) partes.push(classes.join(' ou '));
  for (const [chave, minimo] of Object.entries(perfil.atributo ?? {})) partes.push(`${NOME_DO_ATRIBUTO[chave] ?? chave} ${minimo}+`);
  if (perfil.nivel != null) partes.push(`nível ${perfil.nivel}+`);
  return partes.join(' · ');
}

/** O motivo, para a opção cinza de quem não atende. */
export const motivoDoPerfil = (perfil) => `só quem for ${etiquetaDoPerfil(perfil)}`;

/**
 * Prepara a lista de opções de um nó para o contexto: tira as que ninguém atende (ou deixa cinza, com `mostrar`), põe a
 * etiqueta e guarda quem fala. Devolve novas opções (não mexe nas da árvore). `escolheMelhor(candidatos, teste)` devolve o
 * melhor do grupo para o teste (quem tem a melhor chance).
 */
export function opcoesComPerfil(opcoes, herois, escolheMelhor) {
  const out = [];
  for (const o of opcoes) {
    const perfil = o.perfil ?? null;
    if (!perfil) { out.push(o); continue; }
    const quem = quemAtende(herois, perfil);
    if (!quem.length) {
      if (o.mostrar) out.push({ ...o, requer: () => motivoDoPerfil(perfil), etiqueta: o.etiqueta ?? etiquetaDoPerfil(perfil), teste: undefined, perfil: undefined, _semPerfil: true });
      continue;
    }
    const falante = o.teste ? escolheMelhor(quem, o.teste) : quem[0];
    const etiqueta = `${etiquetaDoPerfil(perfil)} · ${falante.name}`;
    const requerOriginal = o.requer;
    out.push({
      ...o,
      etiqueta: o.etiqueta ? `${o.etiqueta}] [${etiqueta}` : etiqueta,
      requer: requerOriginal,
      teste: o.teste ? { ...o.teste, heroi: falante } : undefined,
      _falante: falante,
    });
  }
  return out;
}

/** O texto da opção, que pode ser uma função do contexto (`ctx.quem` é o herói que fala). */
export const textoDaOpcao = (o, ctx) => (typeof o.texto === 'function' ? o.texto(ctx) : o.texto);
