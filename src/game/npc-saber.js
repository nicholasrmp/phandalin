// O QUE CADA PRISIONEIRO E INIMIGO DOBRADO SABE, e como ele fala. É a TRAVA do diálogo com modelo (`game/dialogo-ia.js`) e também a
// reserva de quando não há modelo nenhum: cada fato traz a fala escrita à mão na voz do NPC.
//
// A REGRA DESTE ARQUIVO: fato aqui é o que o LIVRO dá àquele NPC, ou o que a própria cena já diz. O modelo só
// reformula o que está em `fatos`; o que não está na lista, ele não sabe. Por isso `npcs.js` (o que o NPC quer e
// esconde, em grandes linhas) não basta: o que importa à trava é a lista fechada, por NPC e com id.
//
// `requer(estado)` segura o fato até a cena permitir. O estado sai do cliente (`estadoDoSaber`), a partir das
// flags da campanha e das magias de pé: o bugbear só solta o caminho do Castelo depois de apertado (Intimidação
// CD 15, como no livro), e o Yeemik só admite o resgate sob a Zona da Verdade.
//
// A Agatha NÃO está aqui de propósito: o livro dá a ela UMA pergunta, e essa pergunta é a cena inteira. Conversa
// livre com ela desmontaria o que a torna a Agatha.
//
// O DADO MUDA O QUE ELE CONTA: um teste social vencido na conversa grava `apertado:<ficha>` nas flags (`game/dialogo.js`), e o fato
// com `requer: apertado('...')` só aparece a partir daí. Antes disso a caixa recusa, com a fala `naoConta` dele.
//
// Puro: roda no navegador, no servidor e em Node.
import { apertado, flagDeApertado } from './npc-saber-comum.js';
import { FICHAS_DA_VILA, IDS_DA_VILA } from './npc-saber-vila.js';
import { FICHAS_DAS_CENAS } from './npc-saber-cenas.js';
import { FICHAS_OBELISCO_5A6, somarFatosDoObelisco } from './npc-saber-obelisco-vila.js';
import { FICHAS_OBELISCO_7A8 } from './npc-saber-obelisco-reino.js';

export { flagDeApertado };

export const FICHAS = {
  droop: {
    nome: 'Droop',
    quem: 'Goblin de serviço dos bugbears, covarde, último da fila. Quer seguir quem for mais forte e bater menos nele.',
    voz: 'Fala de si na terceira pessoa ("Droop acha"). Frases curtas, repete palavras, chama o grupo de "chefe". Confunde detalhes, mas nunca acrescenta um fato novo.',
    naoSei: 'Droop não sabe, chefe. Droop não sabe disso.',
    naoConta: 'Droop tem medo de falar disso. Os grandes escutam.',
    foraDoTema: 'Droop não entendeu, chefe. Droop só sabe de porão e de pontapé.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ele é Droop, goblin que servia os bugbears e apanhava deles.', fala: 'Droop é Droop, chefe! Droop servia os grandes peludos. Os grandes davam pontapé no Droop.' },
      { id: 'secretas', assunto: 'secretas', fato: 'Há portas secretas: no canto do porão da cisterna; duas no depósito grande, uma para o depósito de armas e outra para o lado do mago; e uma no quarto do mago. Ele lembra disso meio confuso.', fala: 'Tem porta na pedra, chefe! No porão da água, no canto. No depósito grande, duas. E no quarto do mago, uma. Droop acha. Droop quase acha.' },
      { id: 'senha', assunto: 'senha', fato: 'Os esqueletos da cripta não atacam quem usa manto vermelho nem quem diz a palavra Illefarn. Ele ouviu o mago dizer a palavra.', fala: 'Os ossos não batem em manto vermelho, chefe. Nem em quem fala Illefarn. Droop ouviu o mago. Droop nunca falou.' },
      { id: 'castelo', assunto: 'castelo', fato: 'Ele não lembra o caminho do Castelo Dentefino; só sabe que fica ao norte, na floresta. Goblins Dentefino patrulham em volta de Phandalin, e um deles, capturado, saberia mais.', fala: 'Droop não lembra o caminho, chefe. É para o norte, na floresta. Mas os Dentefino rondam a vila. Pega um, aperta, ele fala!' },
      { id: 'bugbears', assunto: 'klarg', fato: 'Os três bugbears, liderados por Nosk, trabalham para o Aranha Negra e vigiam os Marcarrubra. Nosk usa um tapa-olho de joias por vaidade: tem os dois olhos bons.', fala: 'Os grandes são do Aranha Negra, chefe. O de tapa-olho é Nosk. Nosk tem dois olhos! Droop viu.' },
      { id: 'mago', assunto: 'cajavidro', fato: 'O mago do cajado de vidro manda nos Marcarrubra e fica do outro lado da oficina. Um rato vigia a oficina para ele.', fala: 'O mago do vidro fica depois da sala dos livros, chefe. O rato dele vê tudo. Droop não gosta do rato.' },
      { id: 'vigia', assunto: 'vigia', fato: 'Na fenda da caverna vive um bicho de um olho só. Os outros jogam comida de longe.', fala: 'Tem um olho na fenda, chefe. Um só! Jogam comida de longe. Droop joga de mais longe ainda.' },
    ],
  },

  yeemik: {
    nome: 'Yeemik',
    quem: 'Goblin magro, segundo em comando do esconderijo. Quer o lugar de Klarg e usa o refém humano para negociar. Não é de confiança.',
    voz: 'Fala de si na terceira pessoa ("Yeemik quer"). Empolado, imita ordem de oficial, sempre volta à barganha: a cabeça de Klarg em troca do humano.',
    naoSei: 'Yeemik não perde tempo com isso. A cabeça de Klarg, é disso que Yeemik fala.',
    naoConta: 'Isso custa. Traz a cabeça de Klarg, depois Yeemik conta.',
    foraDoTema: 'Que conversa é essa? Yeemik tem um humano e um punhal. Fala do que importa.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ele é Yeemik, segundo em comando, e acha que deveria ser o chefe no lugar de Klarg.', fala: 'Yeemik! O segundo daqui, e o primeiro assim que Klarg perder a cabeça.' },
      { id: 'klarg', assunto: 'klarg', fato: 'Klarg é o chefe, um bugbear, e fica no fundo do esconderijo, a leste, depois dos poços. Yeemik quer que o grupo traga a cabeça dele.', fala: 'Klarg mora no fundo, no leste, depois dos poços. Grande e burro. Traz a cabeça dele para Yeemik.' },
      { id: 'refem', assunto: 'sildar', fato: 'O humano amarrado foi pego na estrada e está fraco. Yeemik promete soltá-lo em troca da cabeça de Klarg.', fala: 'O humano é de Yeemik. Respira, por enquanto. Cabeça de Klarg, e ele é de vocês.' },
      { id: 'bando', assunto: 'marcarrubra', fato: 'Há menos de vinte goblins no esconderijo.', fala: 'Menos de vinte goblins aqui, e cada um escuta Yeemik. Quase cada um.' },
      { id: 'cedeu', assunto: 'saida', fato: 'O grupo acabou de dobrá-lo num teste e ele está acuado: agora conta o que sabe se perguntarem, de má vontade.', requer: apertado('yeemik'), fala: 'Está bem, está bem! Pergunta, e tira essa cara de cima de Yeemik.' },
      { id: 'grol', requer: apertado('yeemik'), assunto: 'castelo', fato: 'Klarg responde ao Rei Grol, chefe da tribo, no Castelo Dentefino, na Floresta de Neverwinter, a noroeste daqui.', fala: 'Klarg lambe a bota do Rei Grol, no Castelo Dentefino. Noroeste, dentro da floresta. Longe de Yeemik, e é assim que Yeemik gosta.' },
      { id: 'aranha', requer: apertado('yeemik'), assunto: 'aranhaNegra', fato: 'Veio recado do Rei Grol: alguém chamado Aranha Negra paga para pegar o anão Gundren. Yeemik não sabe quem é.', fala: 'Aranha Negra paga o rei, o rei manda em Klarg. Quem é, Yeemik não sabe. Sabe que paga.' },
      { id: 'anao', requer: apertado('yeemik'), assunto: 'gundren', fato: 'O anão Gundren e o mapa dele já foram levados para o Rei Grol. Não estão mais aqui.', fala: 'O anão? Já foi, e o mapa junto, para o Rei Grol. Aqui só sobrou o humano.' },
      { id: 'resgate', assunto: 'tesouro', fato: 'Mesmo com a cabeça de Klarg entregue, ele pretende cobrar ouro pelo humano. Uma magia de verdade o prende agora: ele NÃO consegue mentir sobre isso e, se perguntarem, admite, furioso, como "responde".', requer: (e) => e.zona === true, fala: 'Yeemik… Yeemik vai cobrar ouro também! Mesmo com a cabeça. Yeemik não consegue dizer que não!' },
    ],
  },

  // O goblin que caiu vivo na emboscada do capítulo 1. Os fatos são os do nó `conta` de `capitulo1.js`: antes do dado, ele só treme.
  goblinCapturado: {
    nome: 'o goblin capturado',
    quem: 'Goblin da tribo Dentefino, pego vivo na emboscada da estrada, amarrado e apavorado. Quer sair vivo e não tem lealdade a ninguém.',
    voz: 'Fala de si como "goblin", em frases curtas e aos atropelos, repetindo palavras. Implora ("não mata!"), mas nunca acrescenta um fato novo.',
    naoSei: 'Goblin não sabe! Goblin não sabe disso, não mata!',
    naoConta: 'Goblin não pode falar! Klarg arranca a orelha de goblin!',
    foraDoTema: 'Goblin não entende! Goblin só sabe da trilha e do chefe.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'É só um goblin do bando, que fazia o que mandavam.', fala: 'Goblin é só goblin! Goblin fazia o que mandaram!' },
      { id: 'cedeu', assunto: 'saida', fato: 'O grupo já o dobrou e ele está em pânico: agora conta o que sabe se perguntarem.', requer: apertado('goblinCapturado'), fala: 'Goblin fala, goblin fala tudo! Só não mata!' },
      { id: 'anao', assunto: 'gundren', fato: 'O anão e as coisas dele já foram levados para o Rei Grol, no Castelo Dentefino.', requer: apertado('goblinCapturado'), fala: 'O anão já foi! Levaram ele e as coisas dele para o Rei Grol!' },
      { id: 'castelo', assunto: 'castelo', fato: 'O Castelo Dentefino fica longe, a noroeste, dentro da floresta.', requer: apertado('goblinCapturado'), fala: 'Castelo do rei é longe, longe! Noroeste, dentro da floresta!' },
      { id: 'sildar', assunto: 'sildar', fato: 'O humano de cabelo cinza ficou: está amarrado na caverna onde os goblins comem.', requer: apertado('goblinCapturado'), fala: 'O humano de cabelo cinza ficou! Está na caverna de comer, amarrado!' },
      { id: 'aranha', assunto: 'aranhaNegra', fato: 'Veio recado do rei: alguém chamado Aranha Negra paga para ter o anão e o que ele carrega. Ele não sabe quem é.', requer: apertado('goblinCapturado'), fala: 'Aranha Negra paga o rei pelo anão! Quem é, goblin não sabe!' },
      { id: 'klarg', assunto: 'klarg', fato: 'Klarg, um bugbear grandão, é o chefe do esconderijo, e gosta de cumprir as ordens do rei antes dos outros.', requer: apertado('goblinCapturado'), fala: 'Klarg é o chefe, bugbear grandão! Klarg faz o que o rei manda antes de todo mundo!' },
      { id: 'bando', assunto: 'marcarrubra', fato: 'O esconderijo é perto, por esta mesma trilha, com menos de vinte goblins. Há laços e buracos no caminho, e ele sabe onde.', requer: apertado('goblinCapturado'), fala: 'É perto, por esta trilha! Menos de vinte! Tem laço e buraco, e goblin sabe onde!' },
    ],
  },

  // O Marcarrubra que caiu vivo na briga da rua. Os fatos são os do nó `conta` de `capitulo3-rua.js`.
  marcarrubra: {
    nome: 'o Marcarrubra capturado',
    quem: 'Bandido humano dos Marcarrubra, de manto vermelho, preso depois da briga na rua. Valentão de taverna, com mais medo do chefe e do que mora embaixo da mansão do que do grupo.',
    voz: 'Grosseiro e cheio de bravata, mas a voz falha quando o assunto é a mansão. Xinga pouco e curto. Trata o grupo por "vocês".',
    naoSei: 'Não sei, e mesmo se soubesse. Pergunta pra outro.',
    naoConta: 'Vão se danar. Disso eu não falo.',
    foraDoTema: 'Que conversa é essa? Me entrega logo pro chefe da vila.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'É um dos Marcarrubra, e acha que o grupo não sabe com quem está mexendo.', fala: 'Sou dos Marcarrubra, e vocês não sabem com quem estão mexendo.' },
      { id: 'cedeu', assunto: 'saida', fato: 'O grupo já o dobrou, e a bravata acabou: agora conta o que sabe se perguntarem.', requer: apertado('marcarrubra'), fala: 'Tá bom, tá bom! Pergunta logo.' },
      { id: 'presos', assunto: 'dendrar', fato: 'Embaixo da mansão há gente presa, perto dos túmulos velhos, vigiada por esqueletos. Ele não chega perto.', requer: apertado('marcarrubra'), fala: 'Tem gente presa lá embaixo da mansão, perto dos túmulos velhos. Esqueletos vigiam. Eu não chego perto.' },
      { id: 'chefe', assunto: 'cajavidro', fato: 'O chefe é um mago chamado Cajavidro, por causa do cajado de vidro que brilha. Fica na ala oeste, embaixo da mansão. Ninguém sabe o nome verdadeiro dele.', requer: apertado('marcarrubra'), fala: 'A gente chama de Cajavidro, pelo cajado de vidro. É mago, fica na ala oeste lá embaixo. Nome de verdade, ninguém sabe.' },
      { id: 'vigia', assunto: 'vigia', fato: 'Na parte mais funda, numa fenda, vive uma coisa de um olho só, que fala dentro da cabeça da gente.', requer: apertado('marcarrubra'), fala: 'Lá no fundo, numa fenda, tem uma coisa de um olho só. Fala dentro da cabeça. Eu desço o mínimo.' },
      { id: 'aranha', assunto: 'aranhaNegra', fato: 'O chefe recebe ordem de um tal Aranha Negra, que quer a vila quieta e os aventureiros longe, e que mandou uns bugbears para ajudar.', requer: apertado('marcarrubra'), fala: 'Ele recebe ordem de um tal Aranha Negra. Quer a vila quieta e aventureiro longe. Mandou até bugbear.' },
    ],
  },

  iarno: {
    nome: 'o Cajavidro',
    quem: 'Iarno Albrek, mago da Aliança dos Lordes que traiu a Aliança e virou chefe dos Marcarrubra sob o nome de Cajavidro. Está preso e amarrado, vaidoso e educado até o fim.',
    voz: 'Cortês e condescendente, como num salão. Frases bem-acabadas, ironia seca. Não implora. Trata o grupo por "meus caros".',
    naoSei: 'Lamento, meus caros: isso está além do que me confiaram.',
    naoConta: 'Ora, meus caros. Um cavalheiro guarda alguma coisa para a própria defesa.',
    foraDoTema: 'Meus caros, estou amarrado, não entediado. Perguntem algo que valha a corda.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ele é Iarno Albrek, o Cajavidro, mago da Aliança dos Lordes que passou a chefiar os Marcarrubra em Phandalin.', fala: 'Iarno Albrek, ao seu dispor, dadas as circunstâncias. Por aqui preferiam me chamar de Cajavidro.' },
      { id: 'aranha', assunto: 'aranhaNegra', fato: 'O Aranha Negra é um drow que procura a Forja das Magias e prometeu dividir com ele.', fala: 'Um elfo das profundezas, meus caros. Um drow, dos de verdade. Prometeu-me uma parte do que achasse.' },
      { id: 'forja', assunto: 'ondaEco', fato: 'A Forja das Magias é a velha forja do pacto entre anões, gnomos e magos. Ele próprio NÃO sabe o caminho da mina.', fala: 'A velha forja do pacto entre anões, gnomos e magos. O caminho até ela, infelizmente, nunca me confiaram.' },
      { id: 'bugbears', assunto: 'klarg', fato: 'Os três bugbears foram mandados pelo Aranha Negra para ajudar; eles sabem o caminho da mina, ele não.', fala: 'Três brutos que me mandaram para "ajudar". O caminho da mina ficou com eles. Vejam onde me puseram na conta.' },
      { id: 'alianca', assunto: 'marcarrubra', fato: 'Chefiava os Marcarrubra. Ninguém mais na Aliança dos Lordes sabe da traição dele.', fala: 'Os rapazes de capa vermelha eram meus, sim. E na Aliança ninguém mais sabe, se é o que temem.' },
      { id: 'sildar', assunto: 'sildar', fato: 'Sildar Hallwinter é seu colega da Aliança, que veio a Phandalin procurá-lo.', fala: 'O bom Sildar veio me procurar. Comovente. Terá muito o que escrever a Neverwinter.' },
    ],
  },

  bugbears: {
    nome: 'Nosk',
    quem: 'Bugbear que chefia os três guardas do esconderijo. Trabalha para o Aranha Negra e foi mandado para vigiar os Marcarrubra. Teme o Aranha Negra mais do que teme o grupo. Usa tapa-olho de joias por vaidade.',
    voz: 'Bruto e entediado, poucas palavras, desprezo por gente pequena.',
    naoSei: '— Sei lá. Pergunta pra outro.',
    naoConta: '— Isso não sai da minha boca. Ele é pior que vocês.',
    foraDoTema: '— Conversa mole. Fala logo o que quer.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ele é Nosk, chefe dos bugbears daqui.', fala: '— Nosk. É só o que precisa saber.' },
      { id: 'servico', assunto: 'marcarrubra', fato: 'Os bugbears foram mandados para manter os Marcarrubra e a vila na linha, e evitam os humanos do bando.', fala: '— Mandaram a gente segurar os capas vermelhas e a vila na linha. Não sento com eles.' },
      // Com este fato liberado o modelo sabe que a hora de calar já passou: sem ele, recusava mesmo depois de apertado.
      { id: 'apertado', assunto: 'saida', fato: 'O grupo acabou de apertá-lo e ele está com medo: agora conta o que sabe se perguntarem, resmungando.', requer: (e) => e.apertadoBugbears === true, fala: '— Tá bom, tá bom. Pergunta logo e me larga.' },
      { id: 'chave', assunto: 'tesouro', fato: 'Nosk carrega a chave de ferro que abre as portas do esconderijo.', requer: (e) => e.apertadoBugbears === true, fala: '— A chave fica comigo, abre quase tudo aqui. Agora larga.' },
      { id: 'mago', assunto: 'cajavidro', fato: 'O mago dorme do outro lado, passando a oficina; o rato dele vê tudo por lá; atrás do quarto há uma porta para o depósito.', requer: (e) => e.apertadoBugbears === true, fala: '— O mago dorme passando a oficina. O rato dele vê tudo. Atrás do quarto tem porta pro depósito.' },
      { id: 'aranha', assunto: 'aranhaNegra', fato: 'Trabalham para o Aranha Negra. Não diz mais nada sobre ele.', requer: (e) => e.apertadoBugbears === true, fala: '— É dele que a gente recebe ordem. Não pergunta mais. Ele é pior que vocês.' },
      { id: 'castelo', assunto: 'castelo', fato: 'O Castelo Dentefino fica dentro da Floresta de Neverwinter, ao norte da Trilha de Triboar.', requer: (e) => e.apertadoBugbears === true, fala: '— O Dentefino? Na Floresta de Neverwinter, ao norte da Trilha de Triboar.' },
      { id: 'ondaEco', assunto: 'ondaEco', fato: 'A Caverna Onda Eco fica nos morros a leste de Phandalin, ao pé das Montanhas Espada.', requer: (e) => e.apertadoBugbears === true, fala: '— A mina? Nos morros a leste da vila, ao pé das Montanhas Espada. Se ele souber que falei, eu morro.' },
    ],
  },
};

Object.assign(FICHAS, FICHAS_DA_VILA, FICHAS_DAS_CENAS);
// O OBELISCO (capítulos 5 a 8): as fichas dos NPCs novos, e o que os moradores passam a saber em cada capítulo (os fatos esperam o
// capítulo por `e.estagio`, `perguntar.js estadoDoObelisco`).
Object.assign(FICHAS, FICHAS_OBELISCO_5A6, FICHAS_OBELISCO_7A8);
somarFatosDoObelisco(FICHAS);

/**
 * QUEM DO OBELISCO SE RECONHECE PELO NOME. Vem ANTES do bloco: o Jomlus é um `spectator`, que o bloco daria à ficha do espectador
 * da Onda Eco, e os reféns, os presos e os mineiros são todos `plebeu`. O nome é o que a cena dá ao combatente.
 */
const POR_NOME = {
  // capítulos 5 e 6
  Greska: 'grista', 'Wheel-of-Fortune': 'wheel', 'Gwyn Oresong': 'gwyn', Gwyn: 'gwyn',
  Ander: 'ander', 'Tamara Stonehill': 'tamara',
  'Wallin Kreeve': 'wallin', 'Elise Kreeve': 'elise', 'Karthim Humblepick': 'karthim',
  'Dareth Taggert': 'dareth', 'Paulina Previne': 'paulina', 'Tumblewick Rollins': 'tumblewick',
  'Hjoldak Hollowhelm': 'hjoldak', 'Ruxithid, o Escolhido': 'ruxithid',
  'Nythalyn Henlifel': 'nythalyn', 'Yanthdel Henlifel': 'yanthdel', 'Ontharyx Henlifel': 'ontharyx',
  'Erdan Vosselth': 'drowT14', 'Thiala Sharne': 'drowT14', 'Vellios Keethe': 'drowT14',
  Rivibiddel: 'rivibiddel', Zoklork: 'zoklork',
  // capítulos 7 e 8
  Shalghast: 'devoradoresDaEntrada', Ulthundul: 'devoradoresDaEntrada', 'Duoro Engletor': 'duoro', Ahooshathan: 'ahooshathan',
  'Oskar Ninebough': 'presosDoTunel', 'Cathlette Camber': 'presosDoTunel', 'Aida Camber': 'presosDoTunel',
  Naruv: 'naruv', Chalaag: 'chalaag', Golcuus: 'golcuus',
  'Shalfi Lewin': 'shalfi', Jomlus: 'jomlus', 'Sábio Borblish': 'flumphs', Mublinesh: 'mublinesh', Gossa: 'gossa', Ashripask: 'ashripask',
  Nouashu: 'zelotes', Groushim: 'zelotes', Chishinix: 'chishinix', Hashutu: 'hashutu', Valsyx: 'nagas', Charnyz: 'nagas',
  'Thawnia Browne': 'refensCupula', Shansa: 'refensCupula', Wramble: 'refensCupula', Unmiel: 'refensCupula',
  'Hovnar Tartesh': 'refensEstatua', 'Menvin Tartesh': 'refensEstatua', 'Nalpina Goldstone': 'refensEstatua', 'Mildra Merkel': 'refensEstatua',
};
/** E pelo bloco, quando o bloco é do NPC e de mais ninguém. */
const POR_BLOCO_DO_OBELISCO = {
  oshundo: 'oshundo', varakkta: 'varakkta', lowarnizel: 'lowarnizel', nellik: 'nellik', behir: 'behir', flumph: 'flumphs', ruxithid: 'ruxithid',
  goblinPsiComandante: 'goblinSawplee', goblinPsiLutador: 'goblinSawplee',
};

/** Quem se reconhece pelo bloco. Quem não tem bloco próprio é apontado pela cena, com `npc.ficha`. */
const POR_BLOCO = {
  klarg: 'klarg', vigiaCiclopico: 'vigia', dragaoVerdeJovem: 'venomfang', hamunKost: 'kost', nezznar: 'nezznar', mormesk: 'mormesk',
  spectator: 'espectador',
};

/** A ficha deste NPC, ou `null`. Os guardas bugbears dividem a do Nosk; outro bugbear (Klarg) tem a dele. */
export function idDaFicha(npc) {
  if (!npc) return null;
  if (npc.ficha && Object.hasOwn(FICHAS, npc.ficha)) return npc.ficha;
  if (npc.name && Object.hasOwn(POR_NOME, npc.name)) return POR_NOME[npc.name];
  if (Object.hasOwn(POR_BLOCO_DO_OBELISCO, npc.defId ?? '')) return POR_BLOCO_DO_OBELISCO[npc.defId];
  // `makeNpc` guarda a pessoa em `npcId`; a vila cria a sua só com `id`.
  const pessoa = npc.npcId ?? npc.id;
  if (IDS_DA_VILA.includes(pessoa)) return pessoa;
  if (pessoa === 'reidoth') return 'reidoth';
  if (pessoa === 'mormesk') return 'mormesk';
  if (Object.hasOwn(POR_BLOCO, npc.defId ?? '')) return POR_BLOCO[npc.defId];
  if (npc.grupo === 'estar' && npc.defId === 'marcarrubra') return 'bebados';
  if (npc.defId === 'droop') return 'droop';
  if (npc.capturado && npc.defId === 'goblin') return 'goblinCapturado';
  if (npc.capturado && npc.defId === 'marcarrubra') return 'marcarrubra';
  if (npc.defId === 'yeemik') return 'yeemik';
  if (npc.defId === 'iarno' || npc.defId === 'cajavidro' || npc.id === 'iarno') return 'iarno';
  if (npc.name === 'Nosk' || (npc.grupo === 'guardas' && npc.defId === 'bugbear')) return 'bugbears';
  return null;
}

/** Os ids dos fatos que a cena permite agora. */
export function fatosLiberados(ficha, estado = {}) {
  return ficha.fatos.filter((f) => !f.requer || f.requer(estado)).map((f) => f.id);
}
