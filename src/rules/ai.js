// IA dos monstros. Simples de propósito: previsível o bastante para o jogador
// aprender a explorar, agressiva o bastante para punir descuido.
//
// Prioridades, em ordem:
//   1. terminar quem está caído perto (nocaute é vantagem grande)
//   2. bater em quem está ao alcance agora, preferindo o alvo mais fácil
//   3. andar até o alvo mais promissor e atacar
//   4. se não alcançar ninguém, aproximar o máximo possível
//
// Quem tem juízo (modificador de Inteligência 0 ou mais: goblin, bandido)
// contorna a Graxa no chão quando há outro caminho; bicho e morto-vivo
// (Inteligência negativa: lobo, zumbi, esqueleto) passa reto e escorrega.

import { distanceFt, isAdjacent, key, Battlefield } from '../core/grid.js';
import { hasCondition, getCondition, conditionEffects, addCondition, removeCondition } from './conditions.js';
import * as Livro from './livro-motor.js';
import { ARMORS } from './items/index.js';
import { abilityMod, saveBonus } from './abilities.js';
import { usoLivreDe } from './passivas.js';
import { SPELLS } from './spells.js';

/** Contorna zonas no chão? Só quem tem Inteligência de modificador 0 ou mais. */
export function contornaZonas(monster) {
  return abilityMod(monster.abilities?.int ?? 10) >= 0;
}

/**
 * PARAR AQUI QUEIMA? A faixa de 3 m do lado quente da Muralha de Fogo (`combat.js zonasNoCalor`).
 *
 * Ela não barra o passo, e é esse o ponto: atravessar é de graça, e o que cobra é TERMINAR
 * o turno ali. Pôr isso em `evitarZonas` tornaria a área intransponível e prenderia o monstro do
 * lado de lá, olhando para uma passagem que ele pode usar. Então entra aqui, na escolha de ONDE
 * PARAR, e pesa mais que qualquer caminho e menos que trocar de alvo: entre duas casas que alcançam
 * o mesmo alvo, a que não queima ganha sempre, e a que queima só é escolhida quando é a única —
 * porque parar a salvo é melhor que parar queimando, mas parar queimando é melhor que não atacar
 * ninguém. Vale para quem contorna a Graxa, pela mesma régua de juízo.
 *
 * NA FUGA o preço é a vida pelo mesmo motivo ao contrário: fugir é afastar-se de quem ameaça, e a
 * conta de distância empurrava o goblin ferido para o fundo da faixa. Medido num goblin de 2 PV com
 * Escapada Ágil: sem o filtro ele corre para a casa quente e MORRE queimado no fim do próprio turno;
 * com ele, para na casa fria à mesma distância. Cercado, a escolha antiga volta inteira.
 */
function pararQueima(enc, monster, spot) {
  if (!enc.zonas?.length || !contornaZonas(monster)) return false;
  return enc.zonasNoCalor({ x: spot.x, y: spot.y, f: monster.pos.f ?? 1 }).length > 0;
}

/** O peso de parar no fogo: mais que qualquer caminho, menos que trocar de alvo. */
const PESO_DO_FOGO = 10000;

/**
 * Roda um planejador de caminho primeiro no mapa que NÃO pisa na Graxa (para
 * quem tem juízo) e, se ele não achar nada, no mapa normal: o esperto desvia
 * quando dá, mas não fica parado se a única passagem é pela graxa.
 *
 * TENTEI PÔR UM MAPA NO MEIO — um que desviasse só do que FERE, para o monstro não atravessar a
 * Muralha de Fogo quando ela é a única passagem. Tirei-o de novo porque NÃO CONSEGUI MEDIR que ele
 * conserta alguma coisa: duas medições minhas do mesmo tabuleiro se contradisseram (34% de
 * travessia numa, 0% noutra, com o mesmo código), e o teste que escrevi para o caso passava com e
 * sem a mudança. Enquanto a travessia não for reproduzível, não há o que consertar aqui, e código
 * que entra por suposição é o que esta base já pagou caro para aprender a não aceitar. Quem for
 * tentar de novo: comece por um tabuleiro em que o monstro ENTRE na zona de forma estável.
 */
function comDesvio(enc, monster, planejar) {
  if (enc.zonas?.length && contornaZonas(monster)) {
    const desviando = planejar(enc.reachableFor(monster, { evitarZonas: true }));
    if (desviando) return desviando;
  }
  return planejar(enc.reachableFor(monster));
}

function scoreTarget(enc, monster, target) {
  // Menor é melhor.
  //
  // A DISTÂNCIA PESA TRÊS VEZES. Antes ela entrava em pé de igualdade com o
  // apetite, e a soma dos bônus (mago de armadura leve: 22) comprava 6 m de
  // caminhada — então o bando inteiro passava pela guerreira e ia no mago,
  // toda luta, desde o primeiro turno. Medido: em vinte sorteios do primeiro
  // turno da emboscada, os quatro goblins bateram só no clérigo e no mago.
  //
  // Isso não é só monótono, é jogar mal: atravessar a linha custa ataque de
  // oportunidade e deixa o goblin cercado. Com o peso em três, os bônus
  // decidem ENTRE alvos de distância parecida, que é o que eles são.
  let score = distanceFt(monster.pos, target.pos) * 2;
  // Duelo Compelido: quem o desafiou é o único alvo que ele quer.
  if (getCondition(monster, 'duelo')?.source === target.id) score -= 500;
  // O ALVO QUE A CENA ESCOLHEU PELO LIVRO: a serpente do poço escuro ataca quem vem por último na fila, e o polvo
  // vai em quem leva a luz. Pesa como meia sala de distância — manda na escolha, mas não faz o bicho atravessar
  // a caverna inteira ignorando quem está colado nele.
  if (monster.alvoPreferido === target.id) score -= 60;
  // QUEM JÁ ESTÁ COLADO NELE é o alvo. Sair de perto para procurar outro dá
  // ataque de oportunidade de graça, e atacar à distância com um inimigo ao
  // lado é com desvantagem — as duas coisas que um goblin não faria.
  if (enc.field.vizinhos(monster.pos, target.pos)) score -= 25;
  score -= (1 - target.hp / target.maxHp) * 30;        // machucado atrai
  if (target.ac <= 13) score -= 10;                     // alvo mole
  if (hasCondition(target, 'caido')) score -= 8;
  if (target.className === 'Mago' || target.className === 'Clérigo') score -= 12;
  return score;
}

export function takeMonsterTurn(enc, monster) {
  // Incapacitado (atordoado, paralisado) não faz nada no turno.
  if (monster.dead || hasCondition(monster, 'inconsciente') || conditionEffects(monster).incapacitated) {
    enc.endTurn(monster);
    return;
  }

  // Stirge grudado: no começo do turno drena o sangue em vez de atacar.
  if (monster.grudadoEm && enc.drenarSangue(monster)) {
    enc.endTurn(monster);
    return;
  }
  // Saciado: voa para longe de todos e não ataca mais.
  if (monster.saciado) {
    const longe = enc.enemiesOf(monster).filter((e) => !e.dead);
    if (longe.length) retreat(enc, monster, longe);
    enc.endTurn(monster);
    return;
  }

  // CRIAR ESPECTRO (a aparição): com um humanoide recém-morto a até 3 m, a ação é erguê-lo.
  if (monster.traits?.includes('createSpecter')) {
    const corpo = enc.corposParaEspectro(monster)[0];
    if (corpo && enc.criarEspectro(monster, corpo)) {
      enc.endTurn(monster);
      return;
    }
  }

  // O FUROR DO GOLEM: enlouquecido, ele vai até a criatura mais perto que vê, de qualquer lado, e bate nela.
  if (monster.furioso) {
    const vistos = enc.combatants.filter((c) => c !== monster && !c.dead && c.hp > 0 && enc.field.hasLineOfSight(monster.pos, c.pos))
      .sort((a, b) => distanceFt(a.pos, monster.pos) - distanceFt(b.pos, monster.pos));
    const alvo = vistos[0];
    if (alvo) {
      const plano = planApproach(enc, monster, [alvo], { meleeOnly: true });
      if (plano?.path?.length > 1) enc.moveAlong(monster, plano.path);
      if (!monster.dead && enc.field.vizinhos(monster.pos, alvo.pos)) {
        const golpe = monster.attacks?.find((a) => !a.ranged)?.name;
        for (let i = 0; i < (monster.multiattack?.count ?? 1) && !alvo.dead; i++) enc.resolveAttack(monster, alvo, { weaponId: golpe });
        monster.actionUsed = true;
      }
    }
    enc.endTurn(monster);
    return;
  }

  // A PRESENÇA ATERRADORA sai junto do multiataque, de graça, enquanto houver quem ainda não resistiu a ela.
  if (monster.presencaAterradora) enc.presencaAterradoraDe(monster);

  // INVISÍVEL À VONTADE (Zeond, o quasit do Glasstaff): a tática é do livro, e ele tem uma só.
  if (monster.traits?.includes('invisivelAVontade') && turnoInvisivel(enc, monster)) return;

  // A cena pode gastar o turno do monstro antes da IA (os lobos acorrentados
  // do esconderijo puxando a corrente). Devolver true encerra o turno.
  if (enc.antesDoTurno?.(monster)) {
    enc.endTurn(monster);
    return;
  }

  // Comando ("Ajoelhe!"): cai e perde o turno.
  if (hasCondition(monster, 'comandado')) {
    removeCondition(monster, 'comandado');
    addCondition(monster, 'caido');
    enc.say('condicao', `${monster.name} obedece o comando: ajoelha e perde o turno.`);
    enc.endTurn(monster);
    return;
  }

  // Acalmar Emoções: indiferente, não ataca ninguém até o perigo ser real
  // (`acordaIndiferentes`, no motor, tira a calma quando um inimigo fere).
  if (getCondition(monster, 'calmo')?.data?.modo === 'indiferente') {
    enc.say('condicao', `${monster.name} observa, indiferente.`);
    enc.endTurn(monster);
    return;
  }

  // Sugestão: abandona a luta e se afasta do grupo (a sugestão é sempre esta, no jogo)
  // até ser ferido por quem a deu ou pelos aliados dela (`combat.js`, applyDamage).
  if (hasCondition(monster, 'sugerido')) {
    const grupo = enc.enemiesOf(monster);
    enc.say('condicao', `${monster.name} segue a sugestão: larga a luta e se afasta.`);
    if (grupo.length) {
      enc.dash(monster);
      retreat(enc, monster, grupo);
    }
    enc.endTurn(monster);
    return;
  }

  // Coroa da Loucura: antes de se mover, ataca de perto o aliado mais próximo
  // dele. Sem aliado vivo ou sem arma de perto, age normal.
  if (hasCondition(monster, 'coroaDaLoucura')) {
    const irmaos = enc.alliesOf(monster)
      .filter((a) => !hasCondition(a, 'inconsciente'))
      .sort((a, b) => distanceFt(monster.pos, a.pos) - distanceFt(monster.pos, b.pos));
    if (irmaos.length && monster.attacks?.some((a) => !a.ranged)) {
      if (hasCondition(monster, 'caido')) enc.standUp(monster);
      let golpe = pickReachableTarget(enc, monster, irmaos, { meleeOnly: true });
      if (!golpe) {
        const plano = planApproach(enc, monster, irmaos, { meleeOnly: true });
        if (plano) {
          if (plano.path.length > 1) enc.moveAlong(monster, plano.path);
          if (!monster.dead && !hasCondition(monster, 'inconsciente')) golpe = pickReachableTarget(enc, monster, irmaos, { meleeOnly: true });
        }
      }
      enc.say('condicao', `${monster.name}, coroado de loucura, volta-se contra os seus.`);
      if (golpe && !monster.dead) enc.attackAction(monster, golpe.target, golpe.weaponName);
      enc.endTurn(monster);
      return;
    }
  }

  // Medo: quem está amedrontado pela magia corre para longe de quem o
  // assustou (Disparada), pelo caminho que puder, e não ataca.
  const medo = getCondition(monster, 'amedrontado');
  // Só a magia Medo manda correr; o medo do Golpe Colérico só atrapalha.
  const assustador = medo?.data?.foge && enc.combatants.find((c) => c.id === medo.source && !c.dead);
  if (assustador) {
    enc.dash(monster);
    retreat(enc, monster, [assustador]);
    enc.endTurn(monster);
    return;
  }

  // Enfeitiçar Pessoa: quem está encantado não escolhe quem o encantou.
  const encanto = getCondition(monster, 'enfeiticado');
  const enemies = enc.enemiesOf(monster).filter((e) => e.id !== encanto?.source);
  if (enemies.length === 0) {
    enc.endTurn(monster);
    return;
  }

  // Derrubado: levanta antes de tudo (custa metade do deslocamento).
  if (hasCondition(monster, 'caido')) enc.standUp(monster);

  // EMPURRÃO TELECINÉTICO (ação bônus do goblin psíquico lutador): antes de bater, derruba quem ele vai bater —
  // caído, o alvo dá vantagem a quem está colado nele.
  if (monster.traits?.includes('empurraoTelecinetico') && !monster.bonusUsed) {
    const alvo = enemies.filter((e) => !e.dead && e.hp > 0 && !hasCondition(e, 'caido') && distanceFt(monster.pos, e.pos) <= 30
      && enc.field.hasLineOfSight(monster.pos, e.pos) && !e.conditionImmunities?.includes('caido'))
      .sort((a, b) => distanceFt(monster.pos, a.pos) - distanceFt(monster.pos, b.pos))[0];
    if (alvo) enc.empurraoTelecinetico(monster, alvo);
  }

  // A SANGUESSUGA (ação bônus da gêmula encefálica): gruda em quem está colado, antes de bater.
  if (monster.traits?.includes('sanguessuga') && !monster.bonusUsed && !monster.gemulaEm) {
    const alvo = enemies.filter((e) => !e.dead && e.hp > 0 && distanceFt(monster.pos, e.pos) <= 5 && !hasCondition(e, 'sanguessuga'))[0];
    if (alvo) enc.sanguessuga(monster, alvo);
  }
  // TALHUNDERETH. O galeb duhr anima os pedregulhos no primeiro turno em que vê alguém a 18 m (é a ação dele, uma vez por
  // dia); o aglomerado troca uma pancada pelas crias, uma vez; a armadilha de intelecto suga quem já está agarrado.
  if (monster.traits?.includes('animarPedregulhos') && monster.resources?.animarPedregulhos > 0 && !monster.actionUsed
    && enemies.some((e) => !e.dead && e.hp > 0 && distanceFt(monster.pos, e.pos) <= 60 && enc.field.hasLineOfSight(monster.pos, e.pos))) {
    enc.animarPedregulhos(monster);
    enc.endTurn(monster);
    return;
  }
  if (monster.traits?.includes('gerarCrias') && monster.resources?.gerarCrias > 0 && !monster.actionUsed
    && enemies.some((e) => !e.dead && e.hp > 0 && distanceFt(monster.pos, e.pos) <= 30)) {
    if (enc.gerarCrias(monster).length) monster.trocouUmGolpe = true;
  }
  if (monster.traits?.includes('sugarPensamentos')) enc.sugarPensamentos(monster);
  // A CRIPTA. O fantasma possuindo alguém não age (ele é o corpo). O revenant usa o olhar quando ninguém está paralisado
  // por ele e o alvo não está colado; a múmia olha junto do golpe; o fantasma apavora primeiro e depois possui.
  if (monster.possuindo) { enc.endTurn(monster); return; }
  // o olhar só sai quando ele não chega a socar ninguém neste turno: quem alcança, anda e bate
  const alcancaPunho = enemies.some((e) => !e.dead && e.hp > 0 && distanceFt(monster.pos, e.pos) <= (monster.movementLeftFt ?? enc.speedOf(monster)) + 5);
  if (monster.traits?.includes('olharVingativo') && !monster.actionUsed && !alcancaPunho
    && !enemies.some((e) => getCondition(e, 'paralisado')?.data?.olharDe === monster.id)) {
    const alvo = enemies.filter((e) => !e.dead && e.hp > 0 && distanceFt(monster.pos, e.pos) <= 30 && distanceFt(monster.pos, e.pos) > 5
      && enc.field.hasLineOfSight(monster.pos, e.pos))[0];
    if (alvo && enc.olharVingativo(monster, alvo)) { enc.endTurn(monster); return; }
  }
  if (monster.traits?.includes('olharTerrivel') && !monster.olhouNoTurno) {
    const alvo = enemies.filter((e) => !e.dead && e.hp > 0 && !e.imuneAoOlharDaMumia && distanceFt(monster.pos, e.pos) <= 60
      && enc.field.hasLineOfSight(monster.pos, e.pos)).sort((a, b) => distanceFt(monster.pos, a.pos) - distanceFt(monster.pos, b.pos))[0];
    if (alvo) enc.olharTerrivel(monster, alvo);
  }
  if (monster.tatica === 'fantasma') {
    const vivos = enemies.filter((e) => !e.dead && e.hp > 0);
    const aVista = vivos.filter((e) => distanceFt(monster.pos, e.pos) <= 60 && enc.field.hasLineOfSight(e.pos, monster.pos)
      && !e.imuneAVisagem?.includes(monster.id) && !hasCondition(e, 'amedrontado'));
    if (!monster.visagemUsada && aVista.length >= 2) { monster.visagemUsada = true; enc.visagemHorripilante(monster); enc.endTurn(monster); return; }
    const colado = vivos.find((e) => distanceFt(monster.pos, e.pos) <= 5 && !e.imuneAPossessao?.includes(monster.id));
    if (colado && !monster.recarregando?.['Possessão'] && enc.possuir(monster, colado)) { enc.endTurn(monster); return; }
  }
  // O ESMAGAMENTO PSÍQUICO (a gosma cinzenta psíquica, o livro: "usa o poder sempre que pode"): no inimigo mais perto
  // que ela sente (a percepção às cegas dela, 18 m).
  if (monster.traits?.includes('esmagamentoPsiquico') && !monster.actionUsed && !monster.recarregando?.['Esmagamento Psíquico']) {
    const alvo = enemies.filter((e) => !e.dead && e.hp > 0 && distanceFt(monster.pos, e.pos) <= 60)
      .sort((a, b) => distanceFt(monster.pos, a.pos) - distanceFt(monster.pos, b.pos))[0];
    if (alvo && enc.esmagamentoPsiquico(monster, alvo)) { enc.endTurn(monster); return; }
  }

  // AÇÕES DO BLOCO que vêm antes dos golpes ou no lugar deles (`turnoEspecial`): a Coroa Psiônica, as pancadas do
  // otyugh, a Rajada de Calor, os Tentáculos Cerebrais.
  if (turnoEspecial(enc, monster, enemies)) {
    enc.endTurn(monster);
    return;
  }

  // RASGO SINÁPTICO (o comandante goblin): quando a esfera pega dois ou mais inimigos e nenhum aliado.
  if (monster.traits?.includes('rasgoSinaptico') && turnoDoComandantePsi(enc, monster, enemies)) {
    enc.endTurn(monster);
    return;
  }
  if (monster.traits?.includes('psionicaDoComandante') && psionicaDoComandante(enc, monster, enemies)) {
    enc.endTurn(monster);
    return;
  }

  // CONJURADOR que joga as magias no turno (o Cajavidro): `conjuraNoTurno` no
  // bloco. A magia vem antes da arma; sem magia que sirva, segue a IA de sempre.
  // O drow abre com o FOGO DAS FADAS quando dois ou mais heróis cabem no cubo.
  // O DROW ferido e cercado some na Escuridão (ou na Invisibilidade) e recua.
  if (monster.spellcasting?.inata && fugaComMagia(enc, monster, enemies)) {
    enc.endTurn(monster);
    return;
  }
  if (fogoDasFadasNoTurno(enc, monster, enemies)) {
    enc.endTurn(monster);
    return;
  }
  // A MAGIA GUARDADA do guardião-escudo (o Santuário Índigo): o mestre manda, e ele solta o Assassino Fantasmagórico.
  if (magiaGuardadaNoTurno(enc, monster, enemies)) {
    enc.endTurn(monster);
    return;
  }
  if (monster.tatica === 'banshee' && turnoDaBanshee(enc, monster, enemies)) {
    enc.endTurn(monster);
    return;
  }
  // O CONJURADOR DO SRD (o mago, o acólito, o sacerdote): `conjuraNoTurno: 'geral'` usa o que tem preparado — cura,
  // Bênção, a magia de dano que mais rende, e o truque.
  if (monster.spellcasting?.conjuraNoTurno === 'geral' && conjuracaoGeral(enc, monster, enemies)) {
    enc.endTurn(monster);
    return;
  }
  if (monster.spellcasting?.conjuraNoTurno && monster.spellcasting.conjuraNoTurno !== 'geral' && conjurarNoTurno(enc, monster, enemies)) {
    enc.endTurn(monster);
    return;
  }

  // ARMA DE SOPRO (o Sopro Venenoso do dragão verde). Recarga 5-6: quando está
  // carregada, é quase sempre a melhor ação que ele tem — 12d6 num cone de 9 m
  // contra 2d10+4 de uma mordida. A regra de quando usar é o que torna o
  // encontro jogável: soprar em DOIS ou mais é o que pune o grupo amontoado, e
  // é por isso que a recarga existe. Em um alvo só, a mordida vale mais, a não
  // ser que ele não consiga encostar em ninguém e fosse perder o turno.
  //
  // A mira é escolhida medindo: para cada inimigo, monta o cone naquela direção
  // e conta quem cai dentro. Aliado dentro do cone pesa o dobro contra, porque
  // o sopro não poupa ninguém.
  if (monster.breath && !monster.recarregando?.[monster.breath.chaveRecarga ?? monster.breath.name] && !monster.actionUsed) {
    let melhor = null;
    for (const e of enemies) {
      const casas = enc.areaDaMagia(monster, { shape: monster.breath.shape, areaFt: monster.breath.areaFt, level: 0 }, e.pos);
      if (!casas?.length) continue;
      const dentro = new Set(casas.map((t) => key(t.x, t.y)));
      const pegos = enc.combatants.filter((c) => !c.dead && enc.pegadaEmAlgumaCasa(c, dentro));
      // o NEUTRO não é alvo: é o aliado que espera a vez (a guarda do Qunbraxel) ou o morador que não briga
      const inimigos = pegos.filter((c) => c.side !== monster.side && c.side !== 'neutro').length;
      const aliados = pegos.filter((c) => (c.side === monster.side || c.side === 'neutro') && c !== monster).length;
      const nota = inimigos - 2 * aliados;
      if (!melhor || nota > melhor.nota) melhor = { alvo: e.pos, nota, inimigos };
    }
    const semCorpoACorpo = !planApproach(enc, monster, enemies, { meleeOnly: true })
      && !pickReachableTarget(enc, monster, enemies);
    if (melhor && melhor.nota > 0 && (melhor.inimigos >= 2 || semCorpoACorpo) && enc.sopro(monster, melhor.alvo)) {
      enc.endTurn(monster);
      return;
    }
  }

  // OS FANTASMAS do espreitador (antes de tudo, longe da luz) e o INCITAR RAMPAGE do senhor da matilha (quando ele mesmo
  // não alcança ninguém e um gnoll dele alcança).
  if (monster.traits?.includes('fantasmas') && enemies.some((e) => distanceFt(e.pos, monster.pos) <= 60) && Livro.fantasmas(enc, monster)) {
    enc.endTurn(monster);
    return;
  }
  if (monster.traits?.includes('incitarRampage') && !pickReachableTarget(enc, monster, enemies) && Livro.incitarRampage(enc, monster)) {
    enc.endTurn(monster);
    return;
  }
  // OS RAIOS OCULARES (o observador, o tirano da morte): a ação é a dos raios, sempre que alguém está à vista fora do cone
  if (monster.raiosOculares && !monster.actionUsed && Livro.raiosOculares(enc, monster)) {
    monster.actionUsed = true;
    enc.endTurn(monster);
    return;
  }
  // AS AÇÕES ESPECIAIS dos bestiários importados (o olhar, o grito, a rajada, o toque, o teleporte).
  if (monster.acoesEspeciais?.length && acaoEspecialNoTurno(enc, monster, enemies)) {
    enc.endTurn(monster);
    return;
  }

  // A NUVEM DE TINTA (o polvo gigante): ferido, na água e com o inimigo perto, solta a tinta e foge nadando.
  if (monster.traits?.includes('nuvemDeTinta') && monster.hp <= monster.maxHp / 2
    && enemies.some((e) => distanceFt(e.pos, monster.pos) <= 20) && enc.nuvemDeTinta(monster)) {
    retreat(enc, monster, enemies.filter((e) => distanceFt(e.pos, monster.pos) <= 30));
    enc.endTurn(monster);
    return;
  }

  // Plantas Constritoras (a vinha infectada): com alguém a 4,5 m que as raízes
  // ainda não prenderam, a ação é sempre esta. A vinha anda 3 m por turno — ela
  // não persegue ninguém; ela prende e depois constringe quem não sai.
  if (
    monster.traits?.includes('plantasConstritoras')
    && enemies.some((e) => !hasCondition(e, 'contido') && distanceFt(e.pos, monster.pos) <= 15)
    && enc.plantasConstritoras(monster)
  ) {
    enc.endTurn(monster);
    return;
  }

  const ranged = monster.attacks?.some((a) => a.ranged);
  const melee = monster.attacks?.find((a) => !a.ranged);
  const adjacentFoes = enemies.filter((e) => enc.field.vizinhos(e.pos, monster.pos));

  // Ilusões: sem nada ao alcance para atacar, gasta a ação examinando a Força
  // Fantasmagórica que o fere ou uma Ilusão Menor colada nele.
  if ((hasCondition(monster, 'iludido') || enc.ilusoesAoAlcance(monster).length)
    && !pickReachableTarget(enc, monster, enemies)) {
    if (hasCondition(monster, 'iludido')) enc.investigarIlusao(monster);
    else {
      // Colado na ilusão: primeiro tenta chegar a alguém; só examina se continuar sem alvo.
      const plano = planApproach(enc, monster, enemies, { meleeOnly: true });
      if (plano?.path.length > 1) enc.moveAlong(monster, plano.path);
      if (monster.dead || hasCondition(monster, 'inconsciente')) { enc.endTurn(monster); return; }
      const depois = pickReachableTarget(enc, monster, enemies);
      if (depois) enc.attackAction(monster, depois.target, depois.weaponName);
      else enc.examinarIlusao(monster);
    }
    enc.endTurn(monster);
    return;
  }

  // Preso sem ninguém ao alcance: gasta a ação tentando se soltar.
  if ((hasCondition(monster, 'agarrado') || hasCondition(monster, 'contido') || hasCondition(monster, 'presoPorVinhas'))
    && !pickReachableTarget(enc, monster, enemies)) {
    enc.escapar(monster);
    enc.endTurn(monster);
    return;
  }

  // LIDERANÇA (o cavaleiro, SRD; o Sildar): uma vez por descanso, a ação dá 1d4 nos ataques e resistências dos aliados
  // a até 9 m por 1 minuto. Abre com ela quando há dois aliados ou mais perto.
  if (monster.traits?.includes('lideranca') && !monster.liderancaUsada && !monster.actionUsed
    && enc.combatants.filter((c) => c !== monster && c.side === monster.side && !c.dead && c.hp > 0 && distanceFt(c.pos, monster.pos) <= 30).length >= 2
    && enc.lideranca(monster)) {
    enc.endTurn(monster);
    return;
  }

  // AÇÃO ASTUTA (o espião, SRD): ação bônus de Desengajar, Disparar ou Esconder. Machucado e colado, desengaja e recua
  // atirando; inteiro, ataca e, se puder, se esconde depois.
  if (monster.traits?.includes('acaoAstuta') && !monster.bonusUsed && adjacentFoes.length && monster.hp <= monster.maxHp / 2) {
    enc.disengage(monster, { bonus: true });
    retreat(enc, monster, adjacentFoes);
    const far = pickReachableTarget(enc, monster, enemies);
    if (far) enc.attackAction(monster, far.target, far.weaponName);
    enc.endTurn(monster);
    return;
  }

  // Escapada Ágil: machucado e cercado → desengaja de graça e recua.
  if (
    monster.traits?.includes('nimbleEscape')
    && adjacentFoes.length > 0
    && monster.hp <= monster.maxHp * 0.4
    && !monster.bonusUsed
  ) {
    enc.disengage(monster, { bonus: true });
    retreat(enc, monster, adjacentFoes);
    const far = pickReachableTarget(enc, monster, enemies);
    if (far) enc.attackAction(monster, far.target, far.weaponName);
    enc.endTurn(monster);
    return;
  }

  const ordered = enemies.slice().sort((a, b) => scoreTarget(enc, monster, a) - scoreTarget(enc, monster, b));

  // 0: terreno alto com arma à distância — fica e atira.
  //
  // Esta regra vem antes da preferência por corpo a corpo porque, sem ela, quem
  // está no platô desce para brigar: perde a cobertura, dá cobertura ao inimigo
  // e gasta o dobro de movimento para voltar. Medido: sem esta regra o grupo
  // ganhava 90% dos combates; o platô virava armadilha para quem o ocupava.
  const rangedAtk = monster.attacks?.find((at) => at.ranged);
  if (rangedAtk && !adjacentFoes.length) {
    const myHeight = enc.field.heightAt(monster.pos.x, monster.pos.y);
    const lowerTarget = ordered.find(
      (t) => enc.field.heightAt(t.pos.x, t.pos.y) < myHeight
        && enc.canAttack(monster, t, rangedAtk.name).ok,
    );
    if (lowerTarget) {
      enc.attackAction(monster, lowerTarget, rangedAtk.name);
      enc.endTurn(monster);
      return;
    }
  }

  // 1: corpo a corpo daqui mesmo.
  const meleeNow = pickReachableTarget(enc, monster, ordered, { meleeOnly: true });
  if (meleeNow) {
    enc.attackAction(monster, meleeNow.target, meleeNow.weaponName);
    enc.endTurn(monster);
    return;
  }

  // 1b: ATIRADOR — atira de onde estiver; a lâmina é só para quem encostou.
  //
  // A regra 2 abaixo manda todo monstro fechar distância, e o motivo está
  // escrito lá: arco curto alcança o tabuleiro inteiro, e se todo mundo
  // atirasse desde o primeiro turno o posicionamento deixaria de importar.
  // Mas o goblin ARQUEIRO existe justamente para atirar, e quem tem
  // `tatica: 'atirador'` pula essa preferência.
  //
  // Chegar aqui já quer dizer que ninguém está colado: se estivesse, a regra
  // 1 acima teria usado a arma de corpo a corpo — o certo, porque atirar com
  // inimigo adjacente dá desvantagem. Então, em ordem:
  //   1. tiro no alcance NORMAL daqui;
  //   2. andar até um ponto de tiro normal, sem encostar em ninguém, e atirar;
  //   3. tiro no alcance LONGO daqui, com desvantagem — só quando não há como
  //      chegar ao normal neste turno.
  // `canAttack` aceita o alcance longo, então sem essa ordem o arqueiro
  // atiraria com desvantagem de onde está em vez de dar alguns passos.
  if (monster.tatica === 'atirador') {
    const atira = (alvo) => enc.attackAction(monster, alvo.target, alvo.weaponName);
    const tiro = pickReachableTarget(enc, monster, ordered, { rangedOnly: true, normalOnly: true });
    if (tiro) {
      atira(tiro);
      enc.endTurn(monster);
      return;
    }
    const posto = planShot(enc, monster, ordered, enemies);
    if (posto) {
      if (posto.path.length > 1) enc.moveAlong(monster, posto.path);
      if (!monster.dead && !hasCondition(monster, 'inconsciente')) {
        const depois = pickReachableTarget(enc, monster, ordered, { rangedOnly: true });
        if (depois) atira(depois);
      }
      enc.endTurn(monster);
      return;
    }
    const longo = pickReachableTarget(enc, monster, ordered, { rangedOnly: true });
    if (longo) {
      atira(longo);
      enc.endTurn(monster);
      return;
    }
    // Nenhum tiro possível neste turno: segue as regras de todos.
  }

  // 2: fechar a distância e bater.
  //
  // Esta preferência é deliberada. Sem ela, todo monstro com arma à distância
  // metralha do outro lado do mapa no primeiro turno (arco curto tem 24 m de
  // alcance — mais que o tabuleiro inteiro), o posicionamento deixa de importar
  // e o mago morre antes de agir. Goblin que fecha distância dá um combate.
  // Agressivo (o orc): quando o deslocamento normal não basta para encostar,
  // a ação bônus vira mais um deslocamento para chegar e bater no mesmo turno.
  let plan = planApproach(enc, monster, ordered, { meleeOnly: true });
  if (!plan && monster.traits?.includes('agressivo') && enc.investidaAgressiva(monster)) {
    plan = planApproach(enc, monster, ordered, { meleeOnly: true });
  }
  if (plan) {
    if (plan.path.length > 1) enc.moveAlong(monster, plan.path);
    if (!monster.dead && !hasCondition(monster, 'inconsciente')) {
      const after = pickReachableTarget(enc, monster, ordered);
      if (after) enc.attackAction(monster, after.target, after.weaponName);
    }
    enc.endTurn(monster);
    return;
  }

  // 3: não dá para encostar neste turno — aí sim usa o que tiver à distância.
  //
  // Só vale o tiro em alcance NORMAL, a não ser que a criatura seja atiradora
  // de verdade (`tatica: 'atirador'`). Antes bastava "consigo atacar daqui?",
  // e a azagaia do bugbear alcança 120 pés: medido, Grol ficava a 60 pés
  // jogando azagaia de 1d6+2 — e com desvantagem de alcance longo — por três
  // rodadas seguidas, em vez de fechar para o machado de 2d8+2. Valia também
  // para Klarg, Nosk, o ogro, os orcs, hobgoblins e goblins. Sem tiro em
  // alcance normal, cai na regra 4, que anda e ataca.
  const shot = pickReachableTarget(enc, monster, ordered, { normalOnly: monster.tatica !== 'atirador' });
  if (shot) {
    enc.attackAction(monster, shot.target, shot.weaponName);
    enc.endTurn(monster);
    return;
  }

  // 4: nem atirar dá — encosta o máximo que conseguir. A distância é a do
  // CAMINHO até o alvo, não a da linha reta: pela linha reta, quem está numa
  // caverna fica colado na parede do fundo mais perto do alvo, e nunca sai
  // pela boca (o bando do Cume da Wyvern ficou assim, parado).
  const closest = ordered[0];
  const ateOAlvo = enc.field.reachable(closest.pos, 2000, () => false, () => true, monster.pos.f ?? 1);
  const passo = comDesvio(enc, monster, (reached) => {
    let best = null;
    for (const node of reached.values()) {
      if (node.parar === false) continue;   // casa tomada por outra criatura (aliada que se atravessa): não serve de destino
      const d = ateOAlvo.get(key(node.x, node.y))?.cost ?? (5000 + distanceFt({ x: node.x, y: node.y }, closest.pos));
      if (!best || d < best.d) best = { d, node };
    }
    return best && best.node.cost > 0 ? Battlefield.pathFrom(reached, best.node) : null;
  });
  // 4a: sem passo que o aproxime de ninguém de pé (o nicho de uma casa, com o herói caído na boca dele), mas com um caído ao alcance da arma: bate
  // nele. A IA não procura herói caído (`enemiesOf` os deixa fora), e sem esta regra a luta nunca acabava: ninguém alcançava o monstro, e ele
  // não alcançava ninguém de pé. Só vale quando não há outro movimento: com para onde andar, ele anda atrás de quem está de pé.
  // Quem bate para DERRUBAR (`naoLetal`) não ataca quem já está no chão.
  if (!passo?.length && !monster.naoLetal) {
    const caidos = enc.combatants.filter((c) => c.side !== monster.side && c.side !== 'neutro' && !c.dead && hasCondition(c, 'inconsciente') && !conditionEffects(c).inalcancavel);
    const noChao = pickReachableTarget(enc, monster, caidos, { meleeOnly: true });
    if (noChao) {
      enc.attackAction(monster, noChao.target, noChao.weaponName);
      enc.endTurn(monster);
      return;
    }
  }
  if (passo) enc.moveAlong(monster, passo);
  // Depois de andar, ainda ha a acao: o que ficou ao alcance (o olhar do
  // vigia a 9 m, o arco que agora alcanca) e usado em vez de desperdicado.
  if (!monster.dead && !hasCondition(monster, 'inconsciente') && !monster.actionUsed) {
    const depois = pickReachableTarget(enc, monster, ordered);
    if (depois) enc.attackAction(monster, depois.target, depois.weaponName);
  }
  enc.endTurn(monster);
}

function pickReachableTarget(enc, monster, targets, { meleeOnly = false, rangedOnly = false, normalOnly = false } = {}) {
  for (const target of targets) {
    for (const atk of monster.attacks ?? []) {
      if (meleeOnly && atk.ranged) continue;
      if (rangedOnly && !atk.ranged) continue;
      const check = enc.canAttack(monster, target, atk.name);
      if (!check.ok) continue;
      if (normalOnly && check.longRange) continue;
      // Ataque corpo a corpo precisa estar no alcance de verdade.
      if (!atk.ranged && distanceFt(monster.pos, target.pos) > (atk.reachFt ?? 5)) continue;
      return { target, weaponName: atk.name };
    }
  }
  return null;
}

function planApproach(enc, monster, targets, opcoes = {}) {
  return comDesvio(enc, monster, (reached) => planApproachEm(enc, monster, targets, reached, opcoes));
}

function planApproachEm(enc, monster, targets, reached, { meleeOnly = false } = {}) {
  const meleeAtk = monster.attacks?.find((a) => !a.ranged);
  const meleeReach = meleeAtk?.reachFt ?? 5;
  if (meleeOnly && !meleeAtk) return null;

  let best = null;
  for (const node of reached.values()) {
    if (node.parar === false) continue;   // casa tomada por outra criatura (aliada que se atravessa): não serve de destino
    const spot = { x: node.x, y: node.y };
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      const d = distanceFt(spot, t.pos);
      // O corpo a corpo precisa de CONTATO, não só de distância: `distanceFt`
      // não sabe de parede de borda, e o castelo é todo feito delas. Sem isto,
      // o monstro na diagonal do herói, do outro lado de uma quina, se dava
      // por posicionado — não andava — e depois `canAttack` recusava o golpe
      // pela parede. Medido: hobgoblins parados mais de 20 rodadas, e 15 de 40
      // lutas de terraço travadas.
      const naReach = meleeReach <= 5
        ? enc.field.contato(spot, t.pos)
        : d <= meleeReach && enc.field.hasLineOfSight(spot, t.pos);
      const canHit = naReach
        || (!meleeOnly && monster.attacks?.some((a) => a.ranged && d <= a.rangeFt) && enc.field.hasLineOfSight(spot, t.pos));
      if (!canHit) continue;
      // Prefere o alvo melhor pontuado; entre iguais, a casa que não queima; e só então o caminho
      // mais curto. As três escalas não se misturam: o alvo manda sobre o fogo, e o fogo sobre o
      // caminho, por mais longo que ele seja.
      const rank = i * 100000 + (pararQueima(enc, monster, spot) ? PESO_DO_FOGO : 0) + node.cost;
      if (!best || rank < best.rank) best = { rank, node, target: t };
    }
  }
  if (!best) return null;
  return { path: Battlefield.pathFrom(reached, best.node), target: best.target };
}

/**
 * Um ponto de tiro para o atirador: alcançável neste turno, livre, SEM
 * encostar em nenhum inimigo, com linha de visão e dentro do alcance NORMAL
 * do arco de pelo menos um alvo. O alcance longo fica de fora de propósito:
 * dá desvantagem, e andar até o normal custa só movimento.
 *
 * Entre os pontos possíveis vence o do alvo mais bem pontuado e, entre
 * iguais, o caminho mais curto — o mesmo critério de `planApproach`.
 */
function planShot(enc, monster, targets, enemies) {
  return comDesvio(enc, monster, (reached) => planShotEm(enc, monster, targets, enemies, reached));
}

function planShotEm(enc, monster, targets, enemies, reached) {
  const arco = monster.attacks?.find((a) => a.ranged);
  if (!arco) return null;
  let best = null;
  for (const node of reached.values()) {
    if (node.parar === false) continue;   // casa tomada por outra criatura (aliada que se atravessa): não serve de destino
    const spot = { x: node.x, y: node.y, f: monster.pos.f };
    if (enemies.some((e) => enc.field.vizinhos(spot, e.pos))) continue;
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      if (distanceFt(spot, t.pos) > arco.rangeFt) continue;
      if (!enc.field.hasLineOfSight(spot, t.pos)) continue;
      const rank = i * 100000 + (pararQueima(enc, monster, spot) ? PESO_DO_FOGO : 0) + node.cost;
      if (!best || rank < best.rank) best = { rank, node };
      break;
    }
  }
  if (!best) return null;
  return { path: Battlefield.pathFrom(reached, best.node) };
}

/**
 * Recuar de quem ameaça — sem cair no colo de outro.
 *
 * A conta media só a distância dos inimigos passados em `threats`, que na
 * Escapada Ágil são apenas os COLADOS. O resultado é que um goblin ferido
 * desengajava e ia parar grudado noutro herói, o que anula o traço: medido no
 * esconderijo, Yeemik fazia isso em 6 dos 333 turnos dele, sempre descendo a
 * saliência para perto do grupo.
 *
 * Agora casa colada em QUALQUER inimigo é descartada, e o desempate é a
 * distância de todos. Se nenhuma casa passar no filtro — cercado de verdade —,
 * vale a conta antiga, para o monstro não ficar parado por preciosismo.
 */
function retreat(enc, monster, threats) {
  const inimigos = enc.enemiesOf(monster).filter((c) => !c.dead);
  const escolher = (reached, evitarColado) => {
    let best = null;
    for (const node of reached.values()) {
      if (node.parar === false) continue;   // casa tomada por outra criatura (aliada que se atravessa): não serve de destino
      const spot = { x: node.x, y: node.y };
      if (evitarColado && inimigos.some((c) => isAdjacent(spot, c.pos))) continue;
      // Fugir para dentro do fogo não é fugir: a casa quente é descartada como a casa colada no
      // inimigo, e só volta a servir se nenhuma outra passar (o segundo `escolher`, sem filtro).
      if (evitarColado && pararQueima(enc, monster, spot)) continue;
      const deQuemAmeaca = Math.min(...threats.map((t) => distanceFt(spot, t.pos)));
      const deTodos = inimigos.length
        ? Math.min(...inimigos.map((c) => distanceFt(spot, c.pos)))
        : deQuemAmeaca;
      // Primeiro longe de quem ameaça; empatado, longe de todo o resto.
      const score = -(deQuemAmeaca * 100 + deTodos);
      if (!best || score < best.score) best = { score, node };
    }
    return best;
  };
  const fuga = comDesvio(enc, monster, (reached) => {
    const best = escolher(reached, true) ?? escolher(reached, false);
    return best && best.node.cost > 0 ? Battlefield.pathFrom(reached, best.node) : null;
  });
  if (fuga) enc.moveAlong(monster, fuga);
}

/**
 * O TURNO DE QUEM FICA INVISÍVEL À VONTADE — o quasit. O livro diz o que ele faz, e é diferente de tudo o que a IA
 * fazia: invisível quando o grupo entra, NÃO ataca logo; espera alguém ficar fraco, ataca, e no turno seguinte some
 * de novo para esperar outra vez. Então:
 *   - visível (acabou de atacar, ou começou assim): gasta a ação para sumir, e se afasta de quem está colado;
 *   - invisível, com alguém do grupo pela METADE dos PV ou menos ao alcance neste turno: anda e ataca — e o ataque
 *     o revela (`combat.js quebraInvisibilidade`);
 *   - invisível e ninguém fraco: fica onde está, sem se denunciar, e só sai de perto de quem encostar nele.
 * "Fraco" é metade dos PV porque é a palavra do livro posta em número, e é o ponto em que um golpe de 1d4+3 com
 * veneno começa a derrubar alguém do 2º nível.
 */
function turnoInvisivel(enc, monster) {
  const inimigos = enc.enemiesOf(monster).filter((e) => !e.dead && !hasCondition(e, 'inconsciente'));
  if (!inimigos.length) return false;
  const colados = inimigos.filter((e) => isAdjacent(monster.pos, e.pos));
  if (!hasCondition(monster, 'invisivel')) {
    addCondition(monster, 'invisivel', { rounds: Infinity, source: monster.id, data: { escondido: true } });
    enc.say('magia', `${monster.name} some no ar.`);
    if (colados.length) retreat(enc, monster, colados);
    enc.endTurn(monster);
    return true;
  }
  const fracos = inimigos.filter((e) => e.hp <= e.maxHp / 2).sort((a, b) => a.hp - b.hp);
  if (fracos.length) {
    const plano = planApproach(enc, monster, fracos, { meleeOnly: true });
    // sem caminho a pé até o ferido, vira morcego (o quasit muda de forma) e voa no turno seguinte
    if (!plano && monster.traits?.includes('mudaDeForma') && monster.forma !== 'morcego' && enc.mudarDeForma(monster, 'morcego')) {
      enc.endTurn(monster);
      return true;
    }
    if (plano) {
      if (plano.path.length > 1) enc.moveAlong(monster, plano.path);
      if (!monster.dead && !hasCondition(monster, 'inconsciente')) {
        const golpe = pickReachableTarget(enc, monster, fracos, { meleeOnly: true });
        if (golpe) enc.attackAction(monster, golpe.target, golpe.weaponName);
      }
      enc.endTurn(monster);
      return true;
    }
  }
  // O SUSTO (uma vez por dia): sem ferido a quem chegar, assusta quem está mais perto, a até 6 m
  const perto = inimigos.filter((e) => distanceFt(e.pos, monster.pos) <= 20 && !hasCondition(e, 'amedrontado'))
    .sort((a, b) => distanceFt(a.pos, monster.pos) - distanceFt(b.pos, monster.pos));
  if (perto.length && enc.sustoDoQuasit(monster, perto[0])) {
    if (colados.length) retreat(enc, monster, colados);
    enc.endTurn(monster);
    return true;
  }
  if (colados.length) retreat(enc, monster, colados);
  enc.endTurn(monster);
  return true;
}

/** Roda todos os monstros em sequência, com pausa entre eles para dar leitura. */
export async function runMonsterSide(enc, { delayMs = 520, onStep = () => {} } = {}) {
  const pending = () => enc.allOf('foes').filter((c) => !c.acted && !hasCondition(c, 'inconsciente'));
  while (enc.side === 'foes' && !enc.over) {
    const list = pending();
    if (list.length === 0) break;
    const monster = list[0];
    onStep(monster);
    takeMonsterTurn(enc, monster);
    if (enc.over) break;
    // delayMs pode ser função: o jogo passa uma que soma a animação em curso.
    const espera = typeof delayMs === 'function' ? delayMs() : delayMs;
    await new Promise((r) => setTimeout(r, espera));
  }
}

/**
 * Criaturas invocadas em "agir sozinho": quando chega a vez do grupo, a IA aliada
 * joga o turno de cada uma (`takeMonsterTurn` só pergunta por `enemiesOf`, que olha
 * o lado). `donoId` restringe aos invocados de um herói; sem ele, todos do lado.
 */
export async function runAutoSummons(enc, { delayMs = 0, onStep = () => {}, donoId = null } = {}) {
  const pendentes = () => enc.combatants.filter((c) => c.invocado?.auto && c.side === enc.side && !c.acted && !c.dead
    && !hasCondition(c, 'inconsciente') && (!donoId || c.invocado.donoId === donoId));
  while (!enc.over) {
    const c = pendentes()[0];
    if (!c) break;
    onStep(c);
    takeMonsterTurn(enc, c);
    if (enc.over) break;
    const espera = typeof delayMs === 'function' ? delayMs() : delayMs;
    if (espera > 0) await new Promise((r) => setTimeout(r, espera));
  }
}

/**
 * "Terminar turno" de um herói: encerra também os invocados dele que ainda não agiram.
 * Os que estão em "agir sozinho" jogam o turno (IA aliada); os manuais só passam a vez.
 * Um invocado que termina o próprio turno encerra só a si.
 */
export async function encerrarTurnoComInvocados(enc, actor, { delayMs = 0, onStep = () => {} } = {}) {
  if (!actor.invocado) {
    const meus = enc.combatants.filter((c) => c.invocado?.donoId === actor.id && !c.acted && !c.dead
      && !hasCondition(c, 'inconsciente'));
    for (const c of meus) {
      if (c.acted) continue;
      if (c.invocado.auto) {
        onStep(c);
        takeMonsterTurn(enc, c);
        const espera = typeof delayMs === 'function' ? delayMs() : delayMs;
        if (espera > 0) await new Promise((r) => setTimeout(r, espera));
      } else {
        enc.endTurn(c);
      }
      if (enc.over) return;
    }
  }
  if (!actor.acted) enc.endTurn(actor);
}


/**
 * A tática de quem conjura pelo bloco (o Cajavidro, do livro da aventura):
 *   1. ferido (metade dos PV ou menos) e com inimigo colado: Passo Nebuloso
 *      para longe, como ação bônus, e o turno continua;
 *   2. sem concentração: Imobilizar Pessoa no humanoide mais perto que ainda
 *      não tentou prender;
 *   3. preso alguém e outro colado: Enfeitiçar Pessoa nele (não o ataca);
 *   4. Mísseis Mágicos no 1º círculo (o 2º fica para prender e fugir);
 *   5. sem espaço: anda até colar e usa Toque Chocante.
 * Devolve true se gastou a ação numa magia.
 */
function conjurarNoTurno(enc, m, enemies) {
  const podeVer = (t) => enc.field.hasLineOfSight(m.pos, t.pos);
  const perto = enemies
    .filter((e) => !e.dead && !hasCondition(e, 'inconsciente'))
    .sort((a, b) => distanceFt(m.pos, a.pos) - distanceFt(m.pos, b.pos));
  if (!perto.length) return false;
  const colado = perto.find((e) => enc.field.vizinhos(e.pos, m.pos));

  if (colado && m.hp <= m.maxHp / 2 && !m.bonusUsed && temUso(m, 'passoNebuloso', 2)) {
    const destino = casaLonge(enc, m, perto, 30);
    if (destino) enc.castSpell(m, 'passoNebuloso', { point: destino, circulo: 2 });
  }
  if (m.dead || hasCondition(m, 'inconsciente') || m.actionUsed) return m.actionUsed;
  // O NEZZNAR: ferido e colado, some (Invisibilidade, ou a Escuridão) e recua; inteiro, manda o mais forte embora (Sugestão)
  if (fugaComMagia(enc, m, enemies) || sugestaoNoTurno(enc, m, enemies)) return true;
  const depoisDoBonus = (m.magiasNoTurno ?? []).some((x) => x.castTime === 'bonus');

  const tenta = (id, opts) => enc.castSpell(m, id, opts).ok;
  // Com espaço de magia, guarda um de 2º para o Passo Nebuloso; com o uso por dia do bloco, cada um tem o seu.
  if (!depoisDoBonus && !m.concentrating && temUso(m, 'imobilizarPessoa', 2, 2)) {
    m.tentouPrender ??= new Set();
    const humanoide = (e) => !e.tipo || e.tipo === 'humanoide';
    const alvo = perto.find((e) => humanoide(e) && !m.tentouPrender.has(e.id)
      && distanceFt(m.pos, e.pos) <= 60 && podeVer(e) && !hasCondition(e, 'paralisado'));
    if (alvo) {
      m.tentouPrender.add(alvo.id);
      if (tenta('imobilizarPessoa', { target: alvo, point: alvo.pos, circulo: 2 })) return true;
    }
  }
  const livre = perto.find((e) => enc.field.vizinhos(e.pos, m.pos) && !hasCondition(e, 'paralisado') && !hasCondition(e, 'enfeiticado'));
  if (!depoisDoBonus && m.concentrating && livre && temUso(m, 'enfeiticarPessoa', 1)
    && tenta('enfeiticarPessoa', { target: livre, point: livre.pos, circulo: 1 })) return true;
  // Os dardos vão no mais fraco só até bastar para derrubá-lo (3,5 cada);
  // o resto vai no próximo. Dardo em quem já caiu é falha no teste de morte.
  const aoAlcance = perto
    .filter((e) => distanceFt(m.pos, e.pos) <= 120 && podeVer(e))
    .sort((a, b) => a.hp - b.hp);
  if (!depoisDoBonus && aoAlcance.length && temUso(m, 'misselMagico', 1)) {
    const dardos = [];
    for (const e of aoAlcance) {
      const precisa = Math.max(1, Math.ceil(e.hp / 3.5));
      for (let k = 0; k < precisa && dardos.length < 3; k++) dardos.push(e);
      if (dardos.length >= 3) break;
    }
    while (dardos.length < 3) dardos.push(dardos[dardos.length - 1]);
    if (tenta('misselMagico', { target: dardos[0], targets: dardos, point: dardos[0].pos, circulo: 1 })) return true;
  }
  // Truque de toque: se não está colado, anda até colar antes.
  let junto = perto.find((e) => enc.field.vizinhos(e.pos, m.pos));
  if (!junto && !depoisDoBonus && magiasProntasTem(m, 'toqueChocante')) {
    const alvo = perto[0];
    const reach = enc.reachableFor(m);
    let melhor = null;
    for (const n of reach.values()) {
      if (n.parar === false || !enc.field.vizinhos({ x: n.x, y: n.y }, alvo.pos)) continue;
      if (!melhor || n.cost < melhor.cost) melhor = n;
    }
    if (melhor) {
      enc.moveAlong(m, Battlefield.pathFrom(reach, melhor));
      if (!m.dead && enc.field.vizinhos(m.pos, alvo.pos)) junto = alvo;
    }
  }
  if (junto && tenta('toqueChocante', { target: junto, point: junto.pos })) return true;
  // Depois do Passo Nebuloso só cabe truque: um mago não volta para o cajado.
  if (depoisDoBonus) {
    enc.dodge(m);
    return true;
  }
  return false;
}

/**
 * O CONJURADOR GERAL. Na ordem: cura um aliado a meia vida ou menos; abre com a Bênção com dois aliados perto; a magia
 * de dano de maior círculo que pega mais inimigos e nenhum aliado (uma área tem de pegar dois ou mais); o truque de
 * dano. Cada tentativa passa pelo `canCast` do motor, então alcance, espaço e linha de visão são os do jogo.
 */
function conjuracaoGeral(enc, m, enemies) {
  const sc = m.spellcasting;
  if (!sc || m.actionUsed) return false;
  const vivos = enemies.filter((e) => !e.dead && e.hp > 0);
  const aliados = enc.combatants.filter((c) => c.side === m.side && !c.dead && c.hp > 0);
  const prontas = [...(sc.prepared ?? [])].map((id) => SPELLS[id]).filter(Boolean);
  const truques = [...(sc.cantrips ?? [])].map((id) => SPELLS[id]).filter(Boolean);
  const tenta = (spell, opts) => {
    const circulo = spell.level || undefined;
    if (spell.level && !temUso(m, spell.id, spell.level)) return false;
    if (!enc.canCast(m, spell.id, { ...opts, circulo }).ok) return false;
    return enc.castSpell(m, spell.id, { ...opts, circulo }).ok;
  };
  // 1. cura
  const ferido = aliados.filter((a) => a.hp <= a.maxHp / 2).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  if (ferido) {
    for (const s of prontas.filter((x) => ['heal', 'healGrupo'].includes(x.kind))) {
      if (tenta(s, { target: ferido, point: ferido.pos })) return true;
    }
  }
  // 2. a Bênção, antes de tudo, com dois aliados a 9 m
  const bencao = prontas.find((x) => x.id === 'bencao');
  if (bencao && !m.concentrating && aliados.filter((a) => distanceFt(a.pos, m.pos) <= 30).length >= 2) {
    const alvos = aliados.filter((a) => distanceFt(a.pos, m.pos) <= 30).slice(0, 3);
    if (tenta(bencao, { target: alvos[0], targets: alvos, point: alvos[0].pos })) return true;
  }
  // 2b. a magia que TIRA ALGUÉM DA LUTA sem dano (Dominar, Palavra de Poder, Imobilizar): no inimigo mais forte que
  // ela pega, uma tentativa por alvo e por magia
  m.tentouCondicao ??= new Set();
  // (só a de círculo igual ou maior que a melhor de dano que ele ainda pode lançar: o senhor das múmias abre com o Ferir,
  // não com o Imobilizar Pessoa)
  const melhorDano = Math.max(0, ...prontas.filter((x) => x.damage && x.damageType && temUso(m, x.id, x.level)).map((x) => x.level));
  const deCondicao = prontas.filter((x) => ((x.kind === 'debuff' && x.condition && !x.damage) || x.kind === 'matar') && x.level >= melhorDano).sort((a, b) => b.level - a.level);
  for (const s of deCondicao) {
    if (s.concentration && m.concentrating) continue;
    const alvo = vivos.filter((e) => !m.tentouCondicao.has(`${s.id}:${e.id}`) && distanceFt(m.pos, e.pos) <= (s.rangeFt || 5)
      && enc.field.hasLineOfSight(m.pos, e.pos) && (!s.limitePv || e.hp <= s.limitePv) && (!s.condition || !hasCondition(e, s.condition))
      && (!s.condicao || !hasCondition(e, s.condicao)) && !enc.porqueNaoAlvo(m, s, e))
      .sort((a, b) => b.hp - a.hp)[0];
    if (!alvo) continue;
    m.tentouCondicao.add(`${s.id}:${alvo.id}`);
    if (tenta(s, { target: alvo, targets: [alvo], point: alvo.pos })) return true;
  }
  // 3. dano: a área que pega mais inimigos (2+) sem aliado; senão o alvo único mais ferido ao alcance
  const deDano = prontas.filter((x) => x.damage && x.damageType).sort((a, b) => b.level - a.level);
  for (const s of deDano) {
    if (s.concentration && m.concentrating) continue;
    if (s.shape) {
      let melhor = null;
      for (const e of vivos) {
        const casas = enc.areaDaMagia(m, s, e.pos, s.level) ?? [];
        const k = new Set(casas.map((c) => `${c.x},${c.y}`));
        const pega = vivos.filter((v) => k.has(`${v.pos.x},${v.pos.y}`)).length;
        const amigo = aliados.some((a) => k.has(`${a.pos.x},${a.pos.y}`));
        if (!amigo && pega >= 2 && (!melhor || pega > melhor.pega)) melhor = { pega, e };
      }
      if (melhor && tenta(s, { target: melhor.e, point: melhor.e.pos })) return true;
    } else {
      const alvo = vivos.filter((e) => distanceFt(m.pos, e.pos) <= (s.rangeFt ?? 60) && enc.field.hasLineOfSight(m.pos, e.pos))
        .sort((a, b) => a.hp - b.hp)[0];
      if (alvo && tenta(s, { target: alvo, point: alvo.pos })) return true;
    }
  }
  // 4. o truque de dano, no mais perto à vista
  for (const s of truques.filter((x) => x.damage)) {
    const alvo = vivos.filter((e) => distanceFt(m.pos, e.pos) <= (s.rangeFt ?? 60) && enc.field.hasLineOfSight(m.pos, e.pos))
      .sort((a, b) => distanceFt(m.pos, a.pos) - distanceFt(m.pos, b.pos))[0];
    if (alvo && tenta(s, { target: alvo, point: alvo.pos })) return true;
  }
  return false;
}

/**
 * As ações especiais dos blocos do capítulo 5. Devolve true se a ação do turno foi gasta aqui; o que é só ação bônus
 * ou vem JUNTO dos golpes (a Coroa) não gasta, e a IA de sempre segue com os golpes.
 */
function turnoEspecial(enc, m, enemies) {
  const vivos = enemies.filter((e) => !e.dead && e.hp > 0);
  const ve = (e) => enc.field.hasLineOfSight(m.pos, e.pos);
  // COROA PSIÔNICA: junto do multiataque, no inimigo à vista que ainda não está coroado (o mais perto).
  if (m.traits?.includes('coroaPsionica') && !m.recarregando?.['Coroa Psiônica']) {
    const alvo = vivos.filter((e) => distanceFt(m.pos, e.pos) <= 60 && ve(e) && !hasCondition(e, 'coroaPsionica'))
      .sort((a, b) => distanceFt(m.pos, a.pos) - distanceFt(m.pos, b.pos))[0];
    if (alvo) enc.coroaPsionica(m, alvo);
  }
  // EMINÊNCIA DIVINA (o sacerdote, SRD): ação bônus, gasta o menor espaço; os golpes corpo a corpo do turno somam 3d6
  // radiantes (+1d6 por círculo acima do 1º). Só com um inimigo colado.
  if (m.traits?.includes('eminenciaDivina') && !m.bonusUsed && vivos.some((e) => enc.field.vizinhos(e.pos, m.pos))) {
    const slots = m.spellcasting?.slots ?? [];
    const i = slots.findIndex((n, k) => k >= 1 && n > 0);
    if (i >= 1) {
      slots[i] -= 1;
      m.bonusUsed = true;
      m.eminencia = { rodada: enc.round, dano: `${3 + (i - 1)}d6` };
      enc.say('recurso', `${m.name} ergue o símbolo sagrado: a arma dele brilha (Eminência Divina).`);
    }
  }
  // RAJADA DE CALOR (ação bônus): com dois inimigos ou mais a 9 m.
  if (m.traits?.includes('rajadaDeCalor') && !m.bonusUsed && !m.recarregando?.['Rajada de Calor']
    && vivos.filter((e) => distanceFt(m.pos, e.pos) <= 30).length >= 2) enc.rajadaDeCalor(m);
  // TENTÁCULOS CEREBRAIS (ação bônus): no inimigo mais perto a 9 m.
  if (m.traits?.includes('tentaculosCerebrais') && !m.bonusUsed && !m.recarregando?.['Tentáculos Cerebrais']) {
    const alvo = vivos.filter((e) => distanceFt(m.pos, e.pos) <= 30 && ve(e) && !hasCondition(e, 'atordoado'))
      .sort((a, b) => distanceFt(m.pos, a.pos) - distanceFt(m.pos, b.pos))[0];
    if (alvo) enc.tentaculosCerebrais(m, alvo);
  }
  // COMANDO DE COMBATE (ação bônus): um aliado colado num inimigo e com a reação livre bate agora.
  if (m.traits?.includes('comandoDeCombate') && !m.bonusUsed) {
    for (const a of enc.combatants.filter((c) => c !== m && c.side === m.side && !c.dead && c.hp > 0 && !c.reactionUsed && c.attacks)) {
      const alvo = vivos.find((e) => enc.field.vizinhos(e.pos, a.pos));
      if (alvo && enc.comandoDeCombate(m, a, alvo)) break;
    }
  }
  const presos = enc.combatants.filter((c) => !c.dead && c.hp > 0 && c.conditions?.some((k) => k.id === 'contido' && k.source === m.id));
  // PANCADA DE TENTÁCULOS (o otyugh): com dois agarrados, bate um no outro em vez dos três golpes.
  if (m.traits?.includes('pancadaDeTentaculos') && presos.length >= 2 && !m.actionUsed) {
    m.actionUsed = true;
    return enc.golpeNosAgarrados(m, { nome: 'Pancada de Tentáculos', dc: 14, dano: '2d6+3', metade: true });
  }
  // PANCADA DE QUITINA (o mutante): troca um dos dois golpes, em quem ele já segura.
  if (m.traits?.includes('pancadaDeQuitina') && presos.length && !m.actionUsed && !m.trocouUmGolpe) {
    enc.golpeNosAgarrados(m, { nome: 'Pancada de Quitina', dc: 15, dano: '3d10', um: true });
    m.trocouUmGolpe = true;
  }
  return false;
}

/**
 * O RASGO SINÁPTICO do comandante goblin: o ponto a até 18 m, que ele vê, cuja esfera de 9 m pega MAIS inimigos sem
 * pegar aliado nenhum (ele mesmo incluído). Dois inimigos ou mais, senão a Lâmina Psíquica vale mais.
 */
function turnoDoComandantePsi(enc, m, enemies) {
  if (m.recarregando?.['Rasgo Sináptico'] || m.actionUsed) return false;
  const vivos = enemies.filter((e) => !e.dead && e.hp > 0);
  const aliados = enc.combatants.filter((c) => c.side === m.side && !c.dead && c.hp > 0);
  let melhor = null;
  for (const e of vivos) {
    if (distanceFt(m.pos, e.pos) > 60 || !enc.field.hasLineOfSight(m.pos, e.pos)) continue;
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      const ponto = { x: e.pos.x + dx, y: e.pos.y + dy };
      const area = new Set(enc.field.circulo(ponto, 30).map((q) => `${q.x},${q.y}`));
      if (aliados.some((a) => area.has(`${a.pos.x},${a.pos.y}`))) continue;
      const n = vivos.filter((v) => area.has(`${v.pos.x},${v.pos.y}`)).length;
      if (n >= 2 && (!melhor || n > melhor.n)) melhor = { n, ponto };
    }
  }
  return melhor ? enc.rasgoSinaptico(m, melhor.ponto) : false;
}

/**
 * A BANSHEE: a Visagem primeiro, enquanto houver dois ou mais à vista que ainda não a encararam; o Lamento quando
 * pega dois ou mais a 9 m, ou quando ela já perdeu metade dos PV e há alguém ao alcance. Sem nada disso, o Toque
 * Corruptor da IA de sempre.
 */
function turnoDaBanshee(enc, m, enemies) {
  const vivos = enemies.filter((e) => !e.dead && e.hp > 0);
  const aVista = vivos.filter((e) => distanceFt(m.pos, e.pos) <= 60 && enc.field.hasLineOfSight(e.pos, m.pos)
    && !e.imuneAVisagem?.includes(m.id) && !hasCondition(e, 'amedrontado'));
  if (!m.visagemUsada && aVista.length >= 2) {
    m.visagemUsada = true;
    enc.visagemHorripilante(m);
    return true;
  }
  const aoLamento = vivos.filter((e) => distanceFt(m.pos, e.pos) <= 30 && !hasCondition(e, 'surdo'));
  if ((m.resources?.lamento ?? 0) > 0 && (aoLamento.length >= 2 || (m.hp <= m.maxHp / 2 && aoLamento.length >= 1))) {
    return enc.lamentoDaBanshee(m);
  }
  return false;
}

/**
 * Ainda dá para conjurar `id`? O uso livre do bloco (uma vez por dia, à vontade: `monsters.js usosDoBloco`) ou um
 * espaço do círculo — `minimo` espaços, quando a IA quer guardar um para outra coisa.
 */
function temUso(m, id, circulo, minimo = 1) {
  if (!magiasProntasTem(m, id)) return false;
  if (usoLivreDe(m, SPELLS[id])) return true;
  return ((m.spellcasting?.slots ?? [])[circulo] ?? 0) >= minimo;
}

const magiasProntasTem = (m, id) => (m.spellcasting?.cantrips ?? []).includes(id)
  || (m.spellcasting?.prepared ?? []).includes(id);

/** A casa livre e visível até `pes` que fica mais longe do inimigo mais próximo. */
/** Para a ação lendária de teleporte (`combat.js lendariasDepoisDe`): a mesma casa longe da IA. */
export const casaLongeDe = (enc, m, inimigos, pes) => casaLonge(enc, m, inimigos, pes);

/**
 * A MAGIA DA AÇÃO LENDÁRIA (as esfinges: uma magia; o lich: um truque). É a conjuração geral da IA, fora do turno dele:
 * a ação fica de pé, e o truque só olha os truques.
 */
export function magiaLendaria(enc, m, soTruque) {
  const sc = m.spellcasting;
  if (!sc) return false;
  const guarda = { acao: m.actionUsed, sc };
  m.actionUsed = false;
  if (soTruque) m.spellcasting = { ...sc, prepared: [] };
  try {
    return conjuracaoGeral(enc, m, enc.enemiesOf(m));
  } finally {
    if (soTruque) { sc.slots = m.spellcasting.slots; m.spellcasting = sc; }
    m.actionUsed = guarda.acao;
  }
}

function casaLonge(enc, m, inimigos, pes) {
  const r = pes / 5;
  let melhor = null;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const x = m.pos.x + dx;
      const y = m.pos.y + dy;
      if (!enc.field.inside(x, y) || enc.field.blocksMove(x, y) || enc.occupied(x, y, m)) continue;
      if (!enc.field.hasLineOfSight(m.pos, { x, y })) continue;
      const d = Math.min(...inimigos.map((e) => distanceFt({ x, y }, e.pos)));
      if (!melhor || d > melhor.d) melhor = { d, x, y };
    }
  }
  return melhor && melhor.d > 5 ? { x: melhor.x, y: melhor.y } : null;
}

/**
 * Fogo das Fadas (o drow, por conjuração inata): sem concentração ativa e com
 * espaço, mira o cubo de 6 m que pega mais heróis a até 18 m. Só com dois ou
 * mais: um alvo só não paga a ação de dois golpes de espada.
 */
function magiaGuardadaNoTurno(enc, m, enemies) {
  const id = m.magiaGuardada;
  const spell = id && SPELLS[id];
  if (!spell || m.actionUsed || m.concentrating || !temUso(m, id, spell.level)) return false;
  // quem manda é o mestre: sem ele vivo, ninguém dá a ordem
  if (m.comandadoPor && !enc.combatants.some((c) => c.id === m.comandadoPor && !c.dead)) return false;
  // com alguém ao alcance do punho, os dois socos rendem mais que a magia: ela fica para quem está longe (medido: soltá-la
  // no primeiro turno, colado, deixava a luta MAIS FÁCIL, 78% de vitória do grupo contra 63% sem ela)
  if (enemies.some((e) => !e.dead && e.hp > 0 && distanceFt(m.pos, e.pos) <= 5)) return false;
  // ... e se ele CHEGA a alguém neste turno, anda e soca: a magia é para quem ele não alcança
  if (planApproach(enc, m, enemies.filter((e) => !e.dead && e.hp > 0), { meleeOnly: true })) return false;
  const alvos = enemies.filter((e) => !e.dead && e.hp > 0 && !hasCondition(e, spell.condition)
    && distanceFt(m.pos, e.pos) <= (spell.rangeFt ?? 120) && enc.field.hasLineOfSight(m.pos, e.pos));
  if (!alvos.length) return false;
  // a mente mais fraca: o pior bônus de resistência do atributo da magia
  const alvo = alvos.reduce((a, b) => (saveBonus(b, spell.save) < saveBonus(a, spell.save) ? b : a));
  return enc.castSpell(m, id, { target: alvo, circulo: spell.level }).ok;
}

/**
 * A IA das AÇÕES ESPECIAIS. Área: quando pega dois inimigos ou mais e mais inimigos que aliados (ou um, se não há a quem
 * golpear). Alvo: o inimigo à vista no alcance que ainda não tem a condição dela (ou, se ela só fere, o mais ferido).
 * Cura: o aliado colado com meia vida ou menos. Teleporte: ferido e cercado, para a casa livre mais longe deles.
 */
function acaoEspecialNoTurno(enc, m, enemies) {
  const vivos = enemies.filter((e) => !e.dead && e.hp > 0);
  const semGolpe = !pickReachableTarget(enc, m, vivos) && !planApproach(enc, m, vivos, { meleeOnly: true });
  for (const a of m.acoesEspeciais) {
    if (!enc.acaoEspecialPronta(m, a)) continue;
    if (especialDoLivro(enc, m, a, vivos, semGolpe)) return true;
    if (['etereo', 'nevoa', 'engolir', 'engolfar', 'puxarAgarrados', 'arremessar', 'aumentar', 'escuridao', 'gritoDeGuerra', 'telecinese', 'corroerArmadura', 'invocar', 'estagios'].includes(a.tipo) || a.soDepoisDeSaltar) continue;
    if (a.tipo === 'teleporte') {
      const colados = vivos.filter((e) => enc.field.vizinhos(e.pos, m.pos));
      if (!colados.length || m.hp > m.maxHp / 2) continue;
      const destino = casaLonge(enc, m, vivos, a.alcanceFt);
      if (destino && enc.usarAcaoEspecial(m, a, destino)) return true;
      continue;
    }
    if (a.tipo === 'cura') {
      const ferido = enc.combatants.filter((c) => c.side === m.side && !c.dead && c.hp > 0 && c.hp <= c.maxHp / 2 && distanceFt(c.pos, m.pos) <= 5)
        .sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0];
      if (ferido && enc.usarAcaoEspecial(m, a, ferido)) return true;
      continue;
    }
    if (a.tipo === 'alvo') {
      const alvo = vivos.filter((e) => Livro.alvoServe(enc, m, a, e) && enc.field.hasLineOfSight(m.pos, e.pos)
        && !e.imuneAEspecial?.includes(`${m.id}:${a.nome}`) && (!a.condition || !hasCondition(e, a.condition)))
        .sort((x, y) => x.hp - y.hp)[0];
      if (alvo && enc.usarAcaoEspecial(m, a, alvo)) return true;
      continue;
    }
    let melhor = null;
    const candidatos = a.shape === 'raio' ? [m] : vivos;
    for (const e of candidatos) {
      const pegos = enc.pegosDaAcaoEspecial(m, a, e);
      // o NEUTRO conta como aliado: a Rajada Mental do Qunbraxel matava a guarda dele que esperava a vez de entrar
      const inimigos = pegos.filter((c) => c.side !== m.side && c.side !== 'neutro').length;
      const aliados = pegos.filter((c) => c.side === m.side || c.side === 'neutro').length;
      const nota = inimigos - 2 * aliados;
      if (!melhor || nota > melhor.nota) melhor = { alvo: e, nota, inimigos };
    }
    if (melhor && melhor.nota > 0 && (melhor.inimigos >= 2 || semGolpe) && enc.usarAcaoEspecial(m, a, melhor.alvo)) return true;
  }
  return false;
}

/**
 * AS AÇÕES ESPECIAIS NOVAS dos bestiários (`livro-motor.js`): quando cada uma vale a ação. Devolve true quando agiu.
 * A fuga (o etéreo, a névoa) é de quem está a um terço da vida; o engolir, de quem já segura alguém; as que preparam
 * a luta (o grito, o aumentar, a escuridão, a invocação) saem no primeiro turno com inimigo à vista.
 */
function especialDoLivro(enc, m, a, vivos, semGolpe) {
  const perto = (pes) => vivos.filter((e) => distanceFt(m.pos, e.pos) <= pes && enc.field.hasLineOfSight(m.pos, e.pos));
  switch (a.tipo) {
    case 'etereo':
    case 'nevoa':
      return m.hp <= m.maxHp / 3 && perto(30).length > 0 && enc.usarAcaoEspecial(m, a, null);
    case 'engolir': {
      const alvo = vivos.find((e) => Livro.presoPor(e, m) && Livro.cabeNoTamanho(e, a.tamanhoMax));
      return !!alvo && !Livro.engolidosDe(enc, m).length && enc.usarAcaoEspecial(m, a, alvo);
    }
    case 'engolfar': {
      const colado = () => vivos.some((e) => enc.field.vizinhos(m.pos, e.pos) && !hasCondition(e, 'engolido') && Livro.cabeNoTamanho(e, 'large'));
      if (!colado()) {
        const plano = planApproach(enc, m, vivos.filter((e) => !hasCondition(e, 'engolido')), { meleeOnly: true });
        if (plano?.path?.length > 1) enc.moveAlong(m, plano.path);
      }
      return !m.dead && colado() && enc.usarAcaoEspecial(m, a, null);
    }
    case 'puxarAgarrados':
      return vivos.some((e) => Livro.presoPor(e, m) && distanceFt(e.pos, m.pos) > 5) && enc.usarAcaoEspecial(m, a, null);
    case 'arremessar':
      return vivos.filter((e) => Livro.presoPor(e, m)).length >= 2 && enc.usarAcaoEspecial(m, a, null);
    case 'aumentar':
    case 'escuridao':
      return perto(30).length > 0 && enc.usarAcaoEspecial(m, a, null);
    case 'gritoDeGuerra':
      return perto(30).length > 0 && enc.alliesOf(m).filter((c) => c !== m && !c.dead && distanceFt(c.pos, m.pos) <= 30).length >= 2 && enc.usarAcaoEspecial(m, a, null);
    case 'invocar':
      return perto(60).length > 0 && enc.usarAcaoEspecial(m, a, null);
    case 'telecinese': {
      const alvo = perto(30).filter((e) => !enc.field.vizinhos(m.pos, e.pos) && Livro.cabeNoTamanho(e, 'medium'))[0];
      return !!alvo && semGolpe && enc.usarAcaoEspecial(m, a, alvo);
    }
    case 'corroerArmadura': {
      const alvo = vivos.find((e) => distanceFt(m.pos, e.pos) <= 5 && Livro.metalAoAlcance(e, ARMORS));
      return !!alvo && enc.usarAcaoEspecial(m, a, alvo);
    }
    case 'estagios': {
      const fase = Livro.estagioDoRugido(a, m.usosEspeciais?.[a.nome] ?? 0);
      return perto(fase.areaFt ?? 500).length >= 2 && enc.usarAcaoEspecial(m, a, null);
    }
    default:
      if (!a.soDepoisDeSaltar) return false;
      // o SALTO MORTAL: o inimigo a 4,5 a 9 m, de preferência onde caem dois
      return vivos.filter((e) => distanceFt(m.pos, e.pos) >= a.soDepoisDeSaltar && distanceFt(m.pos, e.pos) <= 30)
        .sort((x, y) => x.hp - y.hp).some((e) => enc.usarAcaoEspecial(m, a, e));
  }
}

/** Ferido (meia vida ou menos) e colado num inimigo: some na Invisibilidade ou na Escuridão, e recua. */
function fugaComMagia(enc, m, enemies) {
  const vivos = enemies.filter((e) => !e.dead && e.hp > 0);
  const colados = vivos.filter((e) => enc.field.vizinhos(e.pos, m.pos));
  if (!colados.length || m.hp > m.maxHp / 2 || m.concentrating || m.actionUsed) return false;
  if (temUso(m, 'invisibilidade', 2) && enc.castSpell(m, 'invisibilidade', { target: m, point: m.pos, circulo: 2 }).ok) {
    retreat(enc, m, colados);
    return true;
  }
  if (temUso(m, 'escuridao', 2) && enc.castSpell(m, 'escuridao', { point: m.pos, circulo: 2 }).ok) {
    retreat(enc, m, colados);
    return true;
  }
  return false;
}

/** SUGESTÃO ("largue a luta e vá embora"): no herói de maior nível a até 9 m, uma tentativa por alvo. */
function sugestaoNoTurno(enc, m, enemies) {
  if (m.concentrating || m.actionUsed || !temUso(m, 'sugestao', 2)) return false;
  m.tentouSugerir ??= new Set();
  const alvo = enemies.filter((e) => !e.dead && e.hp > 0 && !m.tentouSugerir.has(e.id) && !hasCondition(e, 'sugerido')
    && distanceFt(m.pos, e.pos) <= 30 && enc.field.hasLineOfSight(m.pos, e.pos))
    .sort((a, b) => (b.level ?? 0) - (a.level ?? 0) || distanceFt(m.pos, a.pos) - distanceFt(m.pos, b.pos))[0];
  if (!alvo) return false;
  m.tentouSugerir.add(alvo.id);
  return enc.castSpell(m, 'sugestao', { target: alvo, point: alvo.pos, circulo: 2 }).ok;
}

/**
 * A PSIÔNICA DO COMANDANTE GOBLIN (o livro, uma vez por dia cada): Enfeitiçar Pessoa no humanoide mais perto a 9 m,
 * na primeira chance; ferido e colado, Sussurros Dissonantes em quem está colado (ele foge na reação); e a Telecinese
 * para arrancar de perto quem o cerca.
 */
function psionicaDoComandante(enc, m, enemies) {
  if (m.actionUsed) return false;
  const vivos = enemies.filter((e) => !e.dead && e.hp > 0);
  const colados = vivos.filter((e) => enc.field.vizinhos(e.pos, m.pos));
  const ferido = m.hp <= m.maxHp / 2;
  if (ferido && colados.length && !m.telecineseUsada && enc.telecinese(m, colados[0])) return true;
  if (ferido && colados.length && temUso(m, 'sussurrosDissonantes', 1)
    && enc.castSpell(m, 'sussurrosDissonantes', { target: colados[0], point: colados[0].pos, circulo: 1 }).ok) return true;
  if (!m.tentouEnfeiticar && temUso(m, 'enfeiticarPessoa', 1)) {
    const alvo = vivos.filter((e) => (!e.tipo || e.tipo === 'humanoide') && distanceFt(m.pos, e.pos) <= 30 && enc.field.hasLineOfSight(m.pos, e.pos))
      .sort((a, b) => distanceFt(m.pos, a.pos) - distanceFt(m.pos, b.pos))[0];
    if (alvo) {
      m.tentouEnfeiticar = true;
      if (enc.castSpell(m, 'enfeiticarPessoa', { target: alvo, point: alvo.pos, circulo: 1 }).ok) return true;
    }
  }
  return false;
}

function fogoDasFadasNoTurno(enc, m, enemies) {
  const sc = m.spellcasting;
  if (!sc?.prepared?.includes('fogoDasFadas') || m.concentrating || !temUso(m, 'fogoDasFadas', 1)) return false;
  const vivos = enemies.filter((e) => !e.dead && !hasCondition(e, 'inconsciente') && !hasCondition(e, 'feerico'));
  let melhor = null;
  for (const e of vivos) {
    if (distanceFt(m.pos, e.pos) > 60 || !enc.field.hasLineOfSight(m.pos, e.pos)) continue;
    const pegos = vivos.filter((o) => Math.abs(o.pos.x - e.pos.x) <= 1 && Math.abs(o.pos.y - e.pos.y) <= 1).length;
    if (!melhor || pegos > melhor.pegos) melhor = { pegos, e };
  }
  if (!melhor || melhor.pegos < 2) return false;
  return enc.castSpell(m, 'fogoDasFadas', { target: melhor.e, point: melhor.e.pos, circulo: 1 }).ok;
}
