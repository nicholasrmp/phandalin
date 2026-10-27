// Falas por perfil (raça, classe, atributo). Formato em `../dialogos-extras.js`.
//
// A CAVERNA ONDA ECO: Nezznar (o Aranha Negra), Mormesk, o Espectador da Forja e Nundro. As árvores estão em `../ondaeco-dados.js`
// e o que cada `fim` faz está em `../capitulo5-ondaeco.js` (`resolver`). Nenhuma opção daqui abre um desfecho que o caminho normal
// já não abra: os destinos são nós da árvore ou os mesmos `fim` que ela usa, e o que muda é a PERÍCIA, a CD, a vantagem ou o sabor.
//
//   'sai'            a conversa fecha e nada acontece (Nezznar, Mormesk, Nundro, Espectador).
//   'luta'           (Mormesk) a luta começa; vem sempre pelos nós 'raiva' da árvore, nunca direto daqui.
//   'acordo'         (Mormesk) o pacto de caçar o espectador: chega aqui só por 'acordo' da árvore, com a mesma exigência de oferta.
//   'luta-surpresa'  (Nezznar) quem chega por 'surpresa' da árvore; 'luta-revelado' por 'revela'; 'luta' pelos outros.

import { itemDeId } from '../../rules/equipment.js';

/** A mesma exigência da árvore de Mormesk (`temOferta` em `capitulo5-ondaeco.js`): algo de valor de mago na mochila. */
const semOferta = (ctx) => (ctx.herois.some((h) => (h.bag ?? []).some((i) => (itemDeId(i.id)?.dados.raridade ?? null) && i.qtd > 0))
  ? null : 'o grupo não tem nada que ele valorize');

/** Há o falso Nundro amarrado ao lado de Nezznar (o doppelganger)? Só então a Intuição sobre o anão faz sentido. */
const haRefem = (ctx) => ((ctx.enc?.combatants ?? []).some((c) => c.refem && !c.dead) ? null : 'não há prisioneiro à vista');

/** O espectador já desconfiou de uma mentira? É a mesma marca que o `desconfia` da árvore grava (`espectadorEnganou`). */
const espectadorDesconfia = (ctx) => (ctx.app?.campanha?.ondaEco?.espectadorEnganou ? 'ele já desconfia de vocês' : null);

export default {
  // ------------------------------------------------------------------------------------------------ Nezznar ----
  Nezznar: {
    nos: {
      // O que a Intuição enxerga no convite dele: o mesmo que `traicao` conta (os bugbears já sabem o fim da conversa).
      'x:convite-isca': {
        narra: 'A voz é doce, mas a mão dele não solta o cajado, e os bugbears, atrás, nem fingem interesse na proposta. Não é um convite: é um jeito de manter vocês parados enquanto ele decide o que fazer com vocês.',
        fala: 'Então? Aceitam, ou será preciso outra pergunta?',
        opcoes: [
          { texto: 'Aceitar mesmo assim, de olho nele.', vai: 'traicao' },
          { texto: 'Recusar e seguir sozinhos.', fim: 'sai' },
        ],
      },
      // Quando a leitura falha: ele segue esperando, sem repetir o discurso. As saídas são as de `curioso`.
      'x:espera': {
        narra: 'Nada no rosto dele ajuda: o sorriso de cortesia não muda, e a mão no cajado não se mexe.',
        fala: 'Estou esperando uma resposta. Não costumo repetir o convite.',
        opcoes: [
          { texto: 'Queremos.', vai: 'traicao' },
          { texto: 'Preferimos seguir sozinhos.', fim: 'sai' },
        ],
      },
    },
    porNo: {
      oi: [
        // Os caminhos para 'admite' e 'recusa' já existem ("Você é o Aranha Negra", "Entregue Nundro"): aqui entram com a voz de quem fala.
        { texto: (ctx) => `${ctx.quem.name} reconhece o sotaque do subsolo e o cumprimenta em élfico: "A aranha no seu cajado o entrega. Você é o Aranha Negra."`,
          perfil: { raca: ['elfo', 'meioElfo'] }, vai: 'admite' },
        { texto: (ctx) => `${ctx.quem.name} aponta a estátua sentada atrás dele: "Nundro é gente de pedra, e esta é casa de anão. Entregue-o e renda-se."`,
          perfil: { raca: 'anao' }, vai: 'recusa' },
        { texto: (ctx) => `${ctx.quem.name} o encara de igual para igual, como quem conhece gente que negocia com o que mora debaixo da terra: "Você é o Aranha Negra."`,
          perfil: { raca: 'tiferino' }, vai: 'admite' },
        // Uma história de palco para 'Ninguém nos mandou' (Enganação 15 na árvore): outra perícia, a do ofício.
        { texto: 'Contar a história de uma trupe de menestréis que desceu a mina atrás de uma lenda e se perdeu no escuro.',
          perfil: { classe: 'bardo' }, teste: { pericia: 'atuacao', cd: 13 }, sucesso: 'curioso', falha: 'descoberto' },
        // Com o falso Nundro à mesa (o 'revela' / 'traicao' da árvore): outros jeitos de olhar. A CD é a da opção comum.
        { texto: 'Ignorar o drow por um instante e observar o anão amarrado: a respiração, para onde ele olha, o jeito de se mexer.',
          perfil: { atributo: { sab: 16 } }, teste: { pericia: 'intuicao', cd: 15 }, sucesso: 'revela', falha: 'traicao',
          requer: haRefem, oculta: true },
        { texto: 'Examinar de perto a barba e as cordas do anão.',
          perfil: { atributo: { int: 16 } }, teste: { pericia: 'investigacao', cd: 15 }, sucesso: 'revela', falha: 'traicao',
          requer: haRefem, oculta: true },
      ],
      curioso: [
        { texto: 'Ouvir o que a voz dele não diz, mais do que o convite.',
          perfil: { atributo: { sab: 15 } }, teste: { pericia: 'intuicao', cd: 10 }, sucesso: 'x:convite-isca', falha: 'x:espera', uma: true },
      ],
      traicao: [
        // A surpresa pela mesma CD da árvore (18), por quem tem o gesto: a mão que esconde a lâmina.
        { texto: (ctx) => `${ctx.quem.name} larga as armas devagar, uma a uma, e deixa uma lâmina fina deslizar para dentro da manga.`,
          perfil: { classe: 'ladino' }, teste: { pericia: 'prestidigitacao', cd: 18 }, sucesso: 'surpresa', falha: 'desmascarado' },
      ],
    },
  },

  // ------------------------------------------------------------------------------------------------ Mormesk ----
  // Só o nó 'conversa' (que só existe na conversa inteira): o 'oi' também serve aos estados 'acordo' e 'pago', onde não há 'conversa'.
  Mormesk: {
    porNo: {
      conversa: [
        { texto: (ctx) => `${ctx.quem.name} fala de escola, de grimório e de feitiço de ofício, de mago para mago.`,
          perfil: { classe: 'mago' }, teste: { pericia: 'arcanismo', cd: 8 }, sucesso: 'acordo', falha: 'raiva', requer: semOferta },
        { texto: (ctx) => `${ctx.quem.name} oferece um pergaminho copiado com esmero: "Não é feitiço, mas é saber. Troco por passagem e por uma palavra."`,
          perfil: { classe: ['bardo', 'clerigo'] }, teste: { pericia: 'persuasao', cd: 10 }, sucesso: 'acordo', falha: 'raiva', requer: semOferta },
        // O bruxo negocia saber proibido com o patrono: a vantagem vem desse ofício, e a fala responde ao que ele pediu em `conversa`.
        { texto: (ctx) => `${ctx.quem.name}, que já pagou em saber proibido a quem não devia: "Eu pago em saber. Que saber o senhor quer?"`,
          perfil: { classe: 'bruxo' }, teste: { pericia: 'persuasao', cd: 10, vantagem: true }, sucesso: 'acordo', falha: 'raiva', requer: semOferta },
      ],
    },
  },

  // ---------------------------------------------------------------------------------------------- Espectador ----
  // O desfecho de 'dispensado' e o 'desconfia' são os da árvore; a exigência é a mesma de lá: depois que ele desconfia, nada o engana.
  Espectador: {
    porNo: {
      oi: [
        { texto: (ctx) => `${ctx.quem.name} fala em fórmula de convocação, como quem anula uma ordem velha: "O dono desfez o chamado. A guarda acabou."`,
          perfil: { classe: ['mago', 'bruxo', 'feiticeiro'] }, teste: { pericia: 'arcanismo', cd: 12 }, sucesso: 'dispensado', falha: 'desconfia',
          requer: espectadorDesconfia },
        { texto: (ctx) => `${ctx.quem.name} fala como capataz de mina, sem pressa, dando o apito do turno por encerrado e a guarda por dispensada.`,
          perfil: { raca: 'anao' }, teste: { pericia: 'enganacao', cd: 15, vantagem: true }, sucesso: 'dispensado', falha: 'desconfia',
          requer: espectadorDesconfia },
        { texto: 'Fingir a voz de um capataz cansado e dar o turno por encerrado, com sotaque de mina e um bocejo.',
          perfil: { classe: 'bardo' }, teste: { pericia: 'atuacao', cd: 14 }, sucesso: 'dispensado', falha: 'desconfia',
          requer: espectadorDesconfia },
      ],
    },
  },

  // ------------------------------------------------------------------------------------------------- Nundro ----
  // Só o nó 'livre' (o 'oi' também serve ao estado em que ele já foi libertado, onde não existe 'livre'). Todas levam a 'luto',
  // que fecha em 'resgatado': o mesmo resgate da árvore. Cada fala traz a notícia de Tharden (a pergunta dele), que `luto` responde.
  Nundro: {
    porNo: {
      livre: [
        { texto: (ctx) => `${ctx.quem.name} segura o ombro dele, de anão para anão: "Tharden caiu na entrada da mina. Respira: você é de pedra, e pedra aguenta."`,
          perfil: { raca: 'anao' }, vai: 'luto' },
        { texto: (ctx) => `${ctx.quem.name} pousa a mão sobre o peito dele, numa prece curta: "Tharden morreu na entrada da mina. Descanse: estamos aqui."`,
          perfil: { classe: ['clerigo', 'paladino', 'druida'] }, vai: 'luto' },
        { texto: (ctx) => `${ctx.quem.name} se abaixa até a altura dele e fala baixo: "Não sou dos que prenderam você. Tharden morreu na entrada da mina, e viemos tirá-lo daqui."`,
          perfil: { raca: 'meioOrc' }, vai: 'luto' },
      ],
    },
  },
};
