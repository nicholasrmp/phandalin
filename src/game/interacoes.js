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
import { WEAPONS, consumiveisDe, garantirInventario } from '../rules/equipment.js';
import { hasCondition, maxHpEfetivo } from '../rules/conditions.js';
import { distanceFt, isAdjacent } from '../core/grid.js';
import { temEscuridaoEm, visaoDoGrupo, visaoNoEscuro } from '../rules/luz.js';
import { opcoesDeMagia, opcoesDoHeroi, ctxDe } from './magias-fora.js';
import { falaPorMensagem } from '../rules/utilidade.js';

/** O que se vê de longe, por superfície do mapa. Texto nosso. */
export const OLHAR = {
  cavalo: ['Dois cavalos', 'Mortos no meio da estrada, cheios de flechas de penas pretas. Os dois ainda estão selados.'],
  carroca: ['A carroça', 'A carga de Gundren debaixo da lona: uma dúzia de sacos de farinha, caixas de carne de porco salgada, dois barris de cerveja forte, pás, picaretas e pés de cabra, e cinco lanternas com um barrilete de óleo.'],
  arvore: ['Mata fechada', 'Árvores velhas, de tronco largo o bastante para esconder alguém atrás. Bloqueiam a passagem e a visão.'],
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
  ponte: ['A ponte', 'Tábuas e corda, bem acima do que passa por baixo. Range a cada passo.'],
  entulho: ['Entulho', 'Pedra solta e lixo. Atrapalha o passo.'],
  estalagmite: ['Estalagmite', 'Um cone de pedra subindo do chão. Dá para se esconder atrás dele.'],
  mantimentos: ['Suprimentos', 'Sacos, caixotes e barris empilhados. Bons para se proteger atrás.'],
  leito: ['Cama de palha', 'Peles sobre palha, amassadas por quem dormiu aqui. Ninguém dorme bem num lugar assim.'],
  fogueira: ['Fogueira', 'Brasa viva. Pisar nela queima; cair nela queima mais.'],
  bau: ['Um baú', 'Madeira com cinta de ferro, no meio dos caixotes.'],
  pedregal: ['Alto do planalto', 'Pedra nua e capim duro, lá em cima. De cá se vê o desfiladeiro inteiro.'],
  escada: ['Escada de cordas', 'Cordas grossas e degraus de galho, presas no alto do paredão. Rangem, mas aguentam.'],
  tenda: ['Uma tenda', 'Lona listrada de cores vivas, bem esticada. Coisa cara, para estas colinas.'],
  pocoVelho: ['O poço velho', 'Uma mureta de pedra gasta em volta de um buraco fundo. Lá embaixo, água limpa.'],
  seteira: ['Seteira', 'Uma fenda estreita na pedra, da largura de uma flecha. Do outro lado, alguém pode estar olhando.'],
  alvenaria: ['Parede de pedra', 'Blocos lavrados e bem assentados. Alguém construiu isto para durar.'],
  portaMadeira: ['Porta de madeira', 'Tábuas grossas com cintas de ferro, num vão de pedra. Alguém a mantém em ordem: as dobradiças têm graxa.'],
  portaAberta: ['Porta aberta', 'A folha de madeira está encostada na parede, e a soleira de pedra é gasta de tanto passar gente.'],
  passagemAberta: ['Passagem secreta', 'Uma laje inteira, girada para o lado sobre dobradiças escondidas. Do outro lado, o corredor continua.'],
  mesa: ['Uma mesa', 'Madeira grossa, manchada de vinho e de cera de vela.'],
  sarcofago: ['Um sarcófago', 'Pedra lavrada, com a tampa pesada no lugar.'],
  grade: ['Grade de ferro', 'Barras grossas, chumbadas na pedra. Dá para ver, e atirar, por entre elas.'],
  fosso: ['Um fosso', 'Um buraco escuro no meio do chão. Pular não dá; pelas beiradas, talvez.'],
  tocaia: ['O posto dos vigias', 'Ripas de madeira amarradas entre galhos, um abrigo para quem quer ver sem ser visto.'],
  espinheiro: ['Espinheiro', 'Mato baixo e cheio de espinho. Atrapalha o passo, não esconde ninguém.'],
  // O que tinha desenho e caía em "Chão: terra e pedrisco".
  mato: ['Mato', 'Capim alto e moita fechada. Atrapalha o passo e esconde quem se abaixa.'],
  caixote: ['Caixotes', 'Caixas de madeira empilhadas. Dá para se agachar atrás delas.'],
  caixotes: ['Caixotes', 'Caixas de madeira empilhadas. Dá para se agachar atrás delas.'],
  barris: ['Barris', 'Barris de madeira, cintados de ferro. Ouve-se o líquido bater lá dentro.'],
  laje: ['Piso de lajes', 'Lajes lavradas e assentadas, gastas pelo uso.'],
  cisterna: ['A cisterna', 'Água parada e escura, funda, num tanque de pedra. Dá para nadar, com esforço.'],
  casa: ['Uma casa', 'Paredes de pedra e madeira, janelas fechadas por dentro.'],
  taverna: ['A taverna', 'Janelas acesas e o barulho de quem bebe lá dentro.'],
  altar: ['Um altar', 'Pedra lisa e escura, manchada. Alguém fez disto um lugar de oferenda.'],
  banheira: ['Uma banheira', 'Cobre esverdeado, com um resto de água fria no fundo.'],
  mesaBanquete: ['A mesa do banquete', 'Uma mesa comprida, com pratos de estanho e restos que ninguém recolheu.'],
  camaRei: ['A cama do rei', 'Uma cama larga, com peles empilhadas e um baú aos pés. Fedor de bicho.'],
  portaoCaido: ['O portão caído', 'Uma folha de madeira e ferro, tombada das dobradiças. Dá para passar por cima.'],
  braseiro: ['Um braseiro', 'Ferro escurecido, com brasas vivas. Pisar nele queima.'],
  braseiroFrio: ['Um braseiro frio', 'Carvão apagado e cinza fria numa cuia de ferro.'],
  armeiro: ['O armeiro', 'Um suporte de armas, lanças e machados encostados, alguns tortos.'],
  palha: ['Palha', 'Palha amassada, usada de cama. Tem cheiro de gente suja.'],
  desabamento: ['Desabamento', 'Pedra caída do teto. Atrapalha o passo, mas dá para passar por cima.'],
  ossos: ['Ossos', 'Ossos velhos, roídos, espalhados pelo chão.'],
  mancha: ['Uma mancha', 'Uma mancha escura no chão de pedra. Já secou há tempo.'],
  cacos: ['Cacos', 'Cacos de cerâmica e vidro. Estalam sob a bota.'],
  musgoChao: ['Musgo', 'Musgo úmido e escorregadio entre as lajes.'],
  arca: ['Uma arca', 'Madeira escura, com cinta de ferro e fechadura.'],
  trigo: ['O trigo', 'Trigo seco, alto, de uma lavoura que ninguém colhe mais.'],
  cinza: ['Cinza', 'Cinza fina e cinzenta, de um fogo velho. Levanta ao menor vento.'],
  lago: ['O lago', 'Água parada e fria, de um verde escuro. Dá para atravessar, mas devagar.'],
  margem: ['A margem', 'Areia úmida e pedrinhas na beira da água.'],
  teia: ['Teia', 'Fios grossos e pegajosos de teia. Atrapalham o passo.'],
  prop: ['Uma peça', 'Mobília ou carga. Dá para se abrigar atrás dela.'],
  propBaixo: ['Uma peça baixa', 'Algo rente ao chão, que não impede o passo.'],
  mina: ['Chão da mina', 'Terra batida e cascalho, marcados por picaretas e rodas de carrinho.'],
  lajeMina: ['Laje da mina', 'Lajes anãs, lavradas rente e muito velhas.'],
  fungos: ['Tapete de fungos', 'Um tapete mole de fungos de formas estranhas. Pisar levanta uma poeira pálida.'],
  conchas: ['Margem de conchas', 'Cascalho de conchas quebradas, de um mexilhão claro.'],
  canal: ['O canal seco', 'Um canal fundo na pedra, seco há séculos, com rastros de lodo.'],
  aguaEscura: ['Água escura', 'Água preta, funda e fria. Dá para nadar, mas devagar.'],
  escuro: ['Escuridão', 'Breu. Daqui não se enxerga nada ali — nem chão, nem parede, nem quem estiver parado nela.'],
};

/** O que cada peça de mobília de arte própria diz ao ser olhada (a variante vem da anotação `objetos` do mapa). */
const OLHAR_PROP = {
  estante: ['Estante', 'Tábuas empenadas cheias de livros com lombada de couro e frascos tampados com cera. Alguém aqui lê à noite.'],
  prateleira: ['Prateleira de frascos', 'Potes de vidro com pós, ervas secas e líquidos que não têm cor de coisa boa. Cada um tem uma etiqueta em letra miúda.'],
  mesaFerramentas: ['Bancada de ferramentas', 'Pinças, um pilão, balanças de latão e manchas de ácido na madeira. Trabalho fino, feito por quem tem paciência.'],
  tina: ['Tina de lavar', 'Uma tina de aduelas com água turva e vidraria suja boiando. A água tem um brilho prateado.'],
  saco: ['Saco de pó', 'Um saco de aniagem amarrado com barbante, cheio de pó cinzento que arde no nariz.'],
  ferramentas: ['Ferramentas de mineiro', 'Martelos, pés de cabra e uma pá, encostados num suporte de madeira. Estão limpos: alguém os usa.'],
  tabuas: ['Tábuas empilhadas', 'Tábuas de caixote desmontadas, com pregos tortos para fora. Ninguém jogou nada fora aqui.'],
  pilarQuebrado: ['Pilar quebrado', 'Um pilar de pedra lavrada partido ao meio, o toco ainda de pé. Dá para se abrigar atrás dele.'],
  cubaCerveja: ['Cuba de cerveja', 'Uma cuba grande de aduelas, com um dedo de cerveja choca no fundo e moscas em volta.'],
  barrisRack: ['Barris no suporte', 'Dois barris deitados num cavalete de madeira, com a torneira pingando no chão de pedra.'],
  ossos: ['Ossos', 'Ossos velhos, roídos, com um crânio no meio. Alguém os varreu para o canto e esqueceu.'],
};


// `garantirInventario`: a mochila nasce preguiçosa, e ler `c.bag` cru dizia
// que ninguém tinha tocha — some a opção de acender, e os heróis sem visão
// no escuro entravam no esconderijo às cegas com duas tochas na mochila.
const temTocha = (c) => garantirInventario(c).bag.some((i) => i.id === 'tocha' && i.qtd > 0);

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
            grupo: 'Conjurar', rotulo: s.name, spellId: id, motivo: r.ok ? null : r.why, alvoPrevia: occ,
            icone: iconeDeMagia(s), circulo: s.level, ...contaDaMagia(enc, c, occ, s),
            fazer: () => app.tryCast(c, id, { target: occ, point: occ.pos }),
          });
        }
      } else if (!c) {
        opcoes.push({ rotulo: 'Atacar', icone: 'acao-atacar', motivo: 'selecione um herói primeiro', fazer: () => {} });
      } else if (!vez && !explorando) {
        opcoes.push({ rotulo: 'Atacar', icone: 'acao-atacar', motivo: 'espere a vez do grupo', fazer: () => {} });
      }
      // O golpe com a outra mão, depois da ação de Atacar.
      if (c && vez && c.offhandWeapon && WEAPONS[c.offhandWeapon]) {
        const leve = (w) => (w?.props ?? []).includes('leve');
        const dupla = leve(WEAPONS[c.equippedWeapon]) && leve(WEAPONS[c.offhandWeapon]);
        if (dupla) {
          const comEstilo = c.features?.includes('twoWeaponFighting');
          opcoes.push({
            grupo: 'Atacar', rotulo: `Outra mão: ${WEAPONS[c.offhandWeapon].name}`,
            icone: iconeDaArma(c.offhandWeapon, WEAPONS[c.offhandWeapon]),
            detalhe: `ação bônus · ${WEAPONS[c.offhandWeapon].damage}${comEstilo ? ' + atributo (estilo: duas armas)' : ' · sem o atributo no dano'}`,
            motivo: c.bonusUsed ? 'a ação bônus deste turno já foi usada'
              : !c.actionUsed ? 'primeiro ataque com a mão principal'
                : distanceFt(c.pos, occ.pos) > 5 ? 'longe demais' : null,
            fazer: () => app.usarFeature(c, 'twoWeaponFighting', { target: occ }),
          });
        }
      }
      // O golpe de ação bônus do monge, depois da ação de Atacar.
      if (c && vez && c.features?.includes('martialArts')) {
        opcoes.push({
          grupo: 'Atacar', rotulo: 'Golpe desarmado', icone: 'classe-martialArts',
          detalhe: `ação bônus · ${c.dadoDeArtesMarciais ?? 'd4'}`,
          motivo: c.bonusUsed ? 'a ação bônus deste turno já foi usada'
            : !c.atacouDeMonge ? 'só depois de atacar com o punho ou arma de monge'
              : distanceFt(c.pos, occ.pos) > 5 ? 'longe demais' : null,
          fazer: () => app.usarFeature(c, 'martialArts', { target: occ }),
        });
      }
      // Os dois gastos de ki que miram um inimigo.
      if (c && vez && c.features?.includes('flurryOfBlows')) {
        opcoes.push({
          grupo: 'Atacar', rotulo: 'Rajada de Golpes', icone: 'classe-flurryOfBlows',
          detalhe: `ação bônus · 1 ki · dois golpes de ${c.dadoDeArtesMarciais ?? 'd4'}`,
          motivo: c.bonusUsed ? 'a ação bônus deste turno já foi usada'
            : !(c.resources?.ki > 0) ? 'sem pontos de ki'
              : !c.atacouDeMonge ? 'só depois de atacar com o punho ou arma de monge'
                : distanceFt(c.pos, occ.pos) > 5 ? 'longe demais' : null,
          fazer: () => app.usarFeature(c, 'flurryOfBlows', { target: occ }),
        });
      }
      opcoes.push(...magias);
      return { titulo, subtitulo, alvo, opcoes };
    }

    // Aliado. As magias de utilidade são a lista longa (vinte linhas e os
    // rituais): vão DEPOIS das poucas opções que estão sempre aqui, ou a ficha,
    // a tocha e o descanso ficam a telas de rolagem de distância.
    if (c !== occ && !app.capitulo?.encerrado) {
      opcoes.push({ rotulo: 'Selecionar', icone: 'acao-preparar', detalhe: 'passar o comando para ele', local: 'selecionar', alvoId: occ.id, fazer: () => app.select(occ) });
    }
    opcoes.push({ rotulo: 'Abrir a ficha', icone: 'acao-usarObjeto', detalhe: 'atributos, magias e inventário', local: 'ficha', alvoId: occ.id, fazer: () => app.ficha?.abrir(occ, 'ficha') });
    if (c && vez) {
      for (const id of magiasProntas(c)) {
        const s = getSpell(id);
        if (s.shape || !enc.miraAliados(s)) continue;
        const r = enc.canCast(c, id, { target: occ });
        opcoes.push({
          grupo: 'Conjurar', rotulo: s.name, spellId: id, motivo: r.ok ? null : r.why, alvoPrevia: occ,
          icone: iconeDeMagia(s), circulo: s.level, ...contaDaMagia(enc, c, occ, s),
          fazer: () => app.tryCast(c, id, { target: occ, point: occ.pos }),
        });
      }
      for (const it of consumiveisDe(c)) {
        if (it.dados.consumivel === 'arremesso') continue;
        // JOGAR A POÇÃO (regra da casa). Num aliado que está longe do toque,
        // a poção de cura deixa de ser "dar" e passa a ser "jogar": o frasco
        // se quebra nele e cura metade. É a mesma linha do menu, trocando de
        // verbo quando a mão não alcança — quem está ao lado continua
        // recebendo a poção inteira.
        const longe = occ !== c && !enc.field.vizinhos(c.pos, occ.pos);
        const jogando = longe && Boolean(it.dados.jogavel) && it.dados.consumivel === 'curar';
        const semAcao = c.actionUsed && it.dados.acao !== 'bonus' ? 'a ação deste turno já foi usada' : null;
        const veto = semAcao ?? enc.vetoDeItem(c, it.dados, occ, { jogando });
        const cura = it.dados.cura
          ? (jogando ? `cura metade de ${it.dados.cura}` : `cura ${it.dados.cura}`)
          : null;
        opcoes.push({
          grupo: 'Usar item',
          rotulo: occ === c ? it.dados.name
            : jogando ? `Jogar ${it.dados.name.toLowerCase()} em ${occ.name}`
              : `${it.dados.name} em ${occ.name}`,
          motivo: veto, alvoPrevia: occ,
          detalhe: [cura, `tem ${it.qtd}`].filter(Boolean).join(' · '),
          icone: it.dados.consumivel === 'estabilizar' ? 'acao-estabilizar' : 'acao-usarObjeto',
          fazer: () => app.usarItem(c, it.id, occ, { jogando }),
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
  // A mobília de arte própria diz o que é (a variante vem da anotação do mapa); sem texto próprio, vale o da superfície.
  const variante = sup === 'prop' || sup === 'propBaixo'
    ? app.enc?.field?.objetos?.find((o) => o.tipo === 'prop' && o.x === tile.x && o.y === tile.y)?.variante : null;
  const [nome, texto] = OLHAR_PROP[variante] ?? OLHAR[sup] ?? OLHAR.chao;
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
