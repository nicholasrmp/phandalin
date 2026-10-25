// O que se pode fazer numa casa do tabuleiro: o conteúdo do menu do botão
// direito.
//
// Depende de três coisas: o que está na casa (inimigo, aliado, NPC, corpo,
// objeto de cenário, chão), quem está selecionado e o momento (explorando,
// vez do grupo, vez dos inimigos). As ações de combate passam pelas MESMAS
// portas do clique comum (`app.tryAttack`, `app.tryCast`, `enc.useItem`):
// uma segunda porta com regra própria acabaria discordando da primeira.
//
// Olhar é sempre de graça. Examinar de perto, com teste, é a ação Estudar —
// na luta custa a ação do turno; explorando, não custa nada. A cena do
// capítulo pode acrescentar as suas (`app.capitulo.interacoes`): examinar os
// cavalos, vasculhar o mato, procurar rastros.

import { previsaoDeAtaque, previsaoDeMagia, chanceD20 } from '../rules/odds.js';
import { getSpell, magiasProntas, dadosDaMagia } from '../rules/spells.js';
import { spellAttackBonus, spellSaveDc, saveBonus, abilityMod } from '../rules/abilities.js';
import { iconeDaArma, iconeDeMagia } from '../art/icons.js';
import { WEAPONS, consumiveisDe } from '../rules/equipment.js';
import { hasCondition, maxHpEfetivo } from '../rules/conditions.js';
import { distanceFt, isAdjacent } from '../core/grid.js';
import { temEscuridaoEm, visaoDoGrupo, visaoNoEscuro } from '../rules/luz.js';
import { opcoesDeMagia, opcoesDoHeroi, ctxDe } from './magias-fora.js';
import { falaPorMensagem } from '../rules/utilidade.js';

/** O que se vê de longe, por superfície do mapa. Texto nosso. */
export const OLHAR = {
  cavalo: ['Dois cavalos', 'Mortos no meio da estrada, cheios de flechas de penas pretas. Um deles ainda tem a sela.'],
  carroca: ['A carroça', 'Dois bois e a carga de Gundren debaixo da lona: uma dúzia de sacos de farinha, caixas de carne de porco salgada, dois barris de cerveja forte, pás, picaretas e pés de cabra, e cinco lanternas com um barrilete de óleo.'],
  arvore: ['Mata fechada', 'Carvalhos velhos, de tronco largo o bastante para esconder alguém atrás. Bloqueiam a passagem e a visão.'],
  arbusto: ['Mato', 'Arbustos na altura da cintura. Dá para se agachar atrás deles e quase sumir.'],
  pedra: ['Pedra', 'Uma pedra coberta de musgo. Quem se abaixa atrás dela tem meia cobertura.'],
  estrada: ['A estrada', 'Terra batida, marcada por rodas de carroça e cascos.'],
  grama: ['Capim', 'Capim alto e úmido nos barrancos.'],
  chao: ['Chão', 'Terra e pedrisco.'],
  parede: ['Pedra', 'Rocha firme. Não dá para passar.'],
  // O esconderijo (capítulo 2).
  rocha: ['Rocha', 'Pedra úmida do morro, fria ao toque. Lá em cima, pontas de estalactite somem no escuro.'],
  caverna: ['Chão de caverna', 'Terra batida e pedra lisa, úmidas. O barulho da água vem de todo lado.'],
  riacho: ['O riacho', 'Meio metro de água fria e lenta. Dá para andar nele sem dificuldade.'],
  poco: ['Poço', 'Água parada e escura, funda. Um muro baixo de pedras soltas a segura.'],
  ponte: ['A ponte', 'Tábuas e corda, seis metros acima do riacho. Range a cada passo.'],
  entulho: ['Entulho', 'Pedra solta e lixo. Atrapalha o passo.'],
  estalagmite: ['Estalagmite', 'Um cone de pedra subindo do chão. Dá para se esconder atrás dele.'],
  mantimentos: ['Suprimentos roubados', 'Sacos e caixotes empilhados, muitos com a marca de um leão azul. Bons para se proteger atrás.'],
  leito: ['Cama de goblin', 'Pele fedida sobre palha. Ninguém dorme bem aqui.'],
  fogueira: ['Fogueira', 'Brasa viva. Pisar nela queima; cair nela queima mais.'],
  bau: ['Um baú', 'Madeira com cinta de ferro, no meio dos caixotes.'],
  pedregal: ['Alto do planalto', 'Pedra nua e capim duro, lá em cima. De cá se vê o desfiladeiro inteiro.'],
  escada: ['Escada de cordas', 'Cordas grossas e degraus de galho, presas no alto do paredão. Rangem, mas aguentam.'],
  tenda: ['Uma tenda', 'Lona listrada de cores vivas, bem esticada. Coisa cara, para estas colinas.'],
  pocoVelho: ['O poço velho', 'Uma mureta de pedra gasta em volta de um buraco fundo. Lá embaixo, água limpa.'],
  seteira: ['Seteira', 'Uma fenda estreita na pedra, da largura de uma flecha. Do outro lado, alguém pode estar olhando.'],
  alvenaria: ['Parede de pedra', 'Blocos lavrados e bem assentados. Alguém construiu isto para durar.'],
  mesa: ['Uma mesa', 'Madeira grossa, manchada de vinho e de cera de vela.'],
  sarcofago: ['Um sarcófago', 'Pedra lavrada, com a tampa pesada no lugar.'],
  grade: ['Grade de ferro', 'Barras grossas, chumbadas na pedra. Dá para ver, e atirar, por entre elas.'],
  fosso: ['Um fosso', 'Um buraco escuro no meio do chão. Pular não dá; pelas beiradas, talvez.'],
  tocaia: ['O posto dos vigias', 'Ripas de madeira amarradas entre galhos, um abrigo para quem quer ver sem ser visto.'],
  espinheiro: ['Espinheiro', 'Mato baixo e cheio de espinho. Atrapalha o passo, não esconde ninguém.'],
  escuro: ['Escuridão', 'Breu. Daqui não se enxerga nada ali — nem chão, nem parede, nem quem estiver parado nela.'],
};

const temTocha = (c) => (c.bag ?? []).some((i) => i.id === 'tocha' && i.qtd > 0);

/** Como a ferida de uma criatura se vê, sem dar o número. */
export function estadoAparente(c) {
  if (c.dead) return 'morto';
  if (hasCondition(c, 'inconsciente')) return 'caído, inconsciente';
  const f = c.hp / maxHpEfetivo(c);
  if (f >= 1) return 'ileso';
  if (f > 0.66) return 'arranhado';
  if (f > 0.33) return 'ferido';
  return 'muito ferido';
}

const pct = (x) => `${Math.round(x * 100)}%`;

/**
 * A chance e a conta de uma magia contra um alvo, para o menu: de acertar
 * (ataque de magia), de o alvo FALHAR a resistência, ou certa (Míssil
 * Mágico). Cura e bênção não têm chance — têm o quanto rendem.
 */
function contaDaMagia(enc, c, alvo, s) {
  const mod = abilityMod(c.abilities[c.spellcasting.ability]);
  const efeito = s.heal
    ? `cura ${s.heal}${s.addSpellMod ? ` + ${mod}` : ''}`
    : s.damage ? `${dadosDaMagia(s, { nivel: c.level ?? 1 })} ${s.damageType ?? ''}`.trim() : null;
  if (s.kind === 'attack') {
    const p = previsaoDeMagia(enc, c, alvo, s, { atkBonus: spellAttackBonus(c), dc: spellSaveDc(c) });
    return { chance: p.chance, chanceTexto: pct(p.chance), detalhe: ['ataque de magia', efeito].filter(Boolean).join(' · ') };
  }
  if (s.save) {
    const dc = spellSaveDc(c);
    const falha = 1 - chanceD20(saveBonus(alvo, s.save), dc);
    return {
      chance: falha, chanceTexto: pct(falha),
      detalhe: [`resistência CD ${dc}${s.halfOnSave ? ', metade se passar' : ''}`, efeito].filter(Boolean).join(' · '),
    };
  }
  if (s.kind === 'auto') return { chance: 1, chanceTexto: 'certo', detalhe: efeito ?? 'acerta sempre' };
  return { chance: null, chanceTexto: null, detalhe: efeito ?? (s.level ? `${s.level}º círculo` : 'truque') };
}

/**
 * As ações de uma casa: { titulo, subtitulo, opcoes }. Lista vazia = nada a
 * fazer (o menu nem abre).
 */
export function opcoesDaCasa(app, tile) {
  const enc = app.enc;
  if (!enc) return null;
  const c = app.selected;
  const occ = enc.at(tile.x, tile.y);
  const sup = enc.field.surfaceAt(tile.x, tile.y);
  const explorando = Boolean(app.capitulo?.explorando);
  const vez = !explorando && enc.side === 'party' && !enc.over && !app.busy;
  const opcoes = [];
  const olhar = (titulo, texto) => ({ rotulo: 'Olhar', icone: 'acao-procurar', detalhe: 'de graça', fazer: () => app.mostrarTexto(titulo, texto) });

  // No escuro, o que o grupo não vê não existe para o menu: nem o goblin
  // parado ali, nem o chão. Mostrar o nome dele já seria entregá-lo.
  if (temEscuridaoEm(enc) && !visaoDoGrupo(enc).has(`${tile.x},${tile.y}`) && occ?.side !== 'party') {
    const [nome, texto] = OLHAR.escuro;
    return { titulo: nome, subtitulo: null, opcoes: [olhar(nome, texto)], alvo: { icone: 'acao-procurar', lado: 'objeto', etiquetas: [] } };
  }

  // ------------------------------------------------------------ criatura ----
  if (occ) {
    const inimigo = occ.side !== 'party' && occ.side !== 'neutro';
    const titulo = occ.name;
    const subtitulo = `${occ.dead ? 'morto' : estadoAparente(occ)}${inimigo ? ' · inimigo' : occ.side === 'party' ? ' · aliado' : ''}`;
    // O cabeçalho da janela: retrato, vida e etiquetas. Do aliado se vê o
    // número; do inimigo, só como a ferida parece.
    const alvo = {
      look: occ.look, lado: inimigo ? 'inimigo' : occ.side === 'party' ? 'aliado' : 'neutro',
      vida: { atual: Math.max(0, occ.hp), max: maxHpEfetivo(occ), numero: !inimigo },
      estado: occ.dead ? 'morto' : estadoAparente(occ),
      etiquetas: [occ.className ?? occ.raca ?? null, `CA ${occ.ac}`,
        c && c !== occ ? `${distanceFt(c.pos, occ.pos)} pés de ${c.name}` : null].filter(Boolean),
    };

    // Magias de utilidade (explorando): Falar com os Mortos, Amizade, Mensagem...
    const magias = explorando ? opcoesDeMagia(app, c, { occ }) : [];

    if (occ.dead) {
      opcoes.push(olhar(occ.name, `${occ.name} está morto. ${occ.blurb ?? ''}`.trim()));
      opcoes.push(...magias);
      return { titulo, subtitulo, alvo, opcoes };
    }

    if (occ.side === 'neutro' || occ.falas) {
      // A Mensagem leva a voz até 36 m: ele responde baixinho.
      const porMensagem = c && explorando && falaPorMensagem(ctxDe(app).estado, ctxDe(app).herois(), occ);
      const longe = c && distanceFt(c.pos, occ.pos) > (porMensagem ? 120 : 30);
      opcoes.push({
        rotulo: 'Conversar', icone: 'acao-ajudar', detalhe: porMensagem ? 'por Mensagem' : undefined,
        motivo: longe ? `longe demais para conversar — chegue a 30 pés (está a ${distanceFt(c.pos, occ.pos)})` : null,
        fazer: () => app.conversar(occ),
      });
    }

    if (inimigo) {
      opcoes.push(olhar(occ.name, [`${occ.name}: ${estadoAparente(occ)}.`, occ.blurb].filter(Boolean).join(' ')));
      if (c && vez) {
        for (const w of c.weapons ?? []) {
          const p = previsaoDeAtaque(enc, c, occ, w);
          const nome = WEAPONS[w]?.name ?? w;
          const ranged = p.perfil.ranged;
          let motivo = null;
          if (c.actionUsed) motivo = 'a ação deste turno já foi usada';
          else if (ranged && p.semVisao) motivo = 'sem linha de visão';
          else if (ranged && p.foraDeAlcance) motivo = `fora de alcance — ${p.dist} pés`;
          else if (!ranged && p.foraDeAlcance && c.movementLeftFt <= 0) motivo = 'longe, e sem movimento para chegar';
          // Corpo a corpo longe: o herói anda até o alvo antes. A previsão dá
          // 0% para quem está fora do alcance AGORA, o que aqui enganaria.
          const andar = !ranged && p.foraDeAlcance;
          opcoes.push({
            grupo: 'Atacar', rotulo: nome, motivo, alvoPrevia: occ,
            icone: iconeDaArma(w, WEAPONS[w]),
            chance: andar ? null : p.chance, chanceTexto: andar ? null : pct(p.chance),
            // O furtivo aparece no rótulo: é a maior parte do dano do ladino,
            // e saber ANTES se ele pega é o que decide de onde atacar.
            detalhe: `${p.perfil.damage} ${p.perfil.type}${p.furtivo ? ` · +${p.furtivo} furtivo` : ''}${andar ? ' · anda até ele' : ''}${p.alcanceLongo ? ' · alcance longo, desvantagem' : ''}`,
            fazer: () => app.tryAttack(c, occ, w),
          });
        }
        for (const id of magiasProntas(c)) {
          const s = getSpell(id);
          if (s.shape || enc.miraAliados(s)) continue;
          const r = enc.canCast(c, id, { target: occ });
          opcoes.push({
            grupo: 'Conjurar', rotulo: s.name, motivo: r.ok ? null : r.why, alvoPrevia: occ,
            icone: iconeDeMagia(s), circulo: s.level, ...contaDaMagia(enc, c, occ, s),
            fazer: () => app.tryCast(c, id, { target: occ, point: occ.pos }),
          });
        }
      } else if (!c) {
        opcoes.push({ rotulo: 'Atacar', icone: 'acao-atacar', motivo: 'selecione um herói primeiro', fazer: () => {} });
      } else if (!vez && !explorando) {
        opcoes.push({ rotulo: 'Atacar', icone: 'acao-atacar', motivo: 'espere a vez do grupo', fazer: () => {} });
      }
      opcoes.push(...magias);
      return { titulo, subtitulo, alvo, opcoes };
    }

    // Aliado. As magias de utilidade são a lista longa (vinte linhas e os
    // rituais): vão DEPOIS das poucas opções que estão sempre aqui, ou a ficha,
    // a tocha e o descanso ficam a telas de rolagem de distância.
    if (c !== occ && !app.capitulo?.encerrado) {
      opcoes.push({ rotulo: 'Selecionar', icone: 'acao-preparar', detalhe: 'passar o comando para ele', fazer: () => app.select(occ) });
    }
    opcoes.push({ rotulo: 'Abrir a ficha', icone: 'acao-usarObjeto', detalhe: 'atributos, magias e inventário', fazer: () => app.ficha?.abrir(occ, 'ficha') });
    if (c && vez) {
      for (const id of magiasProntas(c)) {
        const s = getSpell(id);
        if (s.shape || !enc.miraAliados(s)) continue;
        const r = enc.canCast(c, id, { target: occ });
        opcoes.push({
          grupo: 'Conjurar', rotulo: s.name, motivo: r.ok ? null : r.why, alvoPrevia: occ,
          icone: iconeDeMagia(s), circulo: s.level, ...contaDaMagia(enc, c, occ, s),
          fazer: () => app.tryCast(c, id, { target: occ, point: occ.pos }),
        });
      }
      for (const it of consumiveisDe(c)) {
        if (it.dados.consumivel === 'arremesso') continue;
        const veto = c.actionUsed && it.dados.acao !== 'bonus' ? 'a ação deste turno já foi usada' : enc.vetoDeItem(c, it.dados, occ);
        opcoes.push({
          grupo: 'Usar item', rotulo: occ === c ? it.dados.name : `${it.dados.name} em ${occ.name}`,
          motivo: veto, alvoPrevia: occ,
          detalhe: [it.dados.cura ? `cura ${it.dados.cura}` : null, `tem ${it.qtd}`].filter(Boolean).join(' · '),
          icone: it.dados.consumivel === 'estabilizar' ? 'acao-estabilizar' : 'acao-usarObjeto',
          fazer: () => app.usarItem(c, it.id, occ),
        });
      }
      if (occ !== c && hasCondition(occ, 'inconsciente') && !occ.stable) {
        const motivo = c.actionUsed ? 'a ação deste turno já foi usada' : !enc.field.vizinhos(c.pos, occ.pos) ? 'encoste nele primeiro' : null;
        opcoes.push({
          grupo: 'Socorrer', rotulo: 'Estabilizar', detalhe: 'Medicina, CD 10', icone: 'acao-estabilizar', motivo, alvoPrevia: occ,
          fazer: () => { app.enc.stabilize(c, occ); app.afterAct(); },
        });
      }
    }
    // Golpe não letal: escolhido antes de bater, vale para o corpo a corpo.
    if (occ.side === 'party') {
      opcoes.push({
        grupo: 'Combate', rotulo: occ.naoLetal ? 'Voltar a golpes letais' : 'Golpes não letais',
        icone: 'acao-agarrar',
        detalhe: occ.naoLetal ? 'quem cair no corpo a corpo morre' : 'quem cair pelo corpo a corpo fica desacordado, vivo',
        fazer: () => { occ.naoLetal = !occ.naoLetal; app.enc.say('acao', `${occ.name} ${occ.naoLetal ? 'passa a bater para derrubar, não para matar' : 'volta a bater para matar'}.`); app.refresh(); },
      });
    }
    // Tocha: acender pede a pederneira, uma ação no meio da luta; apagar é
    // de graça. Explorando, nada disso custa turno.
    if (temTocha(occ) || occ.tochaAcesa) {
      const acesa = Boolean(occ.tochaAcesa);
      const podeAgir = explorando || (vez && occ === c);
      const motivo = !podeAgir ? (explorando || vez ? `só ${occ.name} mexe na própria tocha — selecione-o` : 'espere a vez do grupo')
        : !acesa && !explorando && c.actionUsed ? 'a ação deste turno já foi usada' : null;
      const vision = visaoNoEscuro(occ);
      opcoes.push({
        grupo: 'Luz', rotulo: acesa ? 'Apagar a tocha' : 'Acender a tocha', icone: acesa ? 'magia-escuridao' : 'magia-luz', motivo,
        detalhe: acesa
          ? `volta ao escuro${vision ? ` — ${occ.name} vê ${vision} pés no escuro` : ''}`
          : `luz em 20 pés, penumbra em mais 20${explorando ? '' : ' · uma ação'} · também mostra ${occ.name} a quem está no escuro`,
        fazer: () => app.alternarTocha(occ),
      });
    }
    // Descanso: só fora da luta, e se a cena deixa (ninguém dorme ao lado
    // do covil sem pagar o preço).
    if (explorando && occ.side === 'party') {
      for (const [tipo, rotulo, detalhe] of [['curto', 'Descanso curto', 'uma hora · dados de vida'], ['longo', 'Descanso longo', 'oito horas · tudo volta']]) {
        opcoes.push({
          grupo: 'Grupo', rotulo, detalhe, icone: tipo === 'curto' ? 'classe-secondWind' : 'magia-sono',
          motivo: app.capitulo?.motivoSemDescanso?.(tipo) ?? null,
          fazer: () => app.descansar(tipo),
        });
      }
    }
    // O que a cena deixa o herói fazer consigo mesmo (vestir um disfarce…).
    if (occ === c) for (const o of app.capitulo?.interacoesDoHeroi?.(c) ?? []) opcoes.push(o);
    opcoes.push(...magias);
    if (occ === c && explorando) opcoes.push(...opcoesDoHeroi(app, c, occ));
    return { titulo, subtitulo: `${estadoAparente(occ)} · aliado`, alvo, opcoes };
  }

  // ------------------------------------------------------- objeto / chão ----
  const [nome, texto] = OLHAR[sup] ?? OLHAR.chao;
  opcoes.push(olhar(nome, texto));
  // Uma imagem ilusória do outro lado nesta casa: examinar gasta a ação.
  const imagem = (app.enc?.zonas ?? []).find((z) => z.ilusao && z.lado !== c?.side && z.casas.has(`${tile.x},${tile.y}`));
  if (imagem && c && app.enc.side === 'party') {
    const perto = app.enc.ilusoesAoAlcance(c).includes(imagem);
    opcoes.push({
      rotulo: 'Examinar a ilusão', icone: 'acao-procurar', detalhe: 'Investigação contra a CD — gasta a ação',
      motivo: c.actionUsed ? 'a ação deste turno já foi usada' : !perto ? 'longe — chegue a 1,5 m da imagem' : null,
      fazer: () => app.chooseAction({ kind: 'examinar', zona: imagem }),
    });
  }
  for (const o of app.capitulo?.interacoes?.(tile, sup, c) ?? []) opcoes.push(o);
  if (explorando) opcoes.push(...opcoesDeMagia(app, c, { tile }));
  const dist = c ? distanceFt(c.pos, tile) : null;
  return {
    titulo: nome, subtitulo: null, opcoes,
    alvo: { icone: 'acao-procurar', lado: 'objeto', etiquetas: c ? [`${dist} pés de ${c.name}`] : [] },
  };
}
