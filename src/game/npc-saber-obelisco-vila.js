// O QUE A VILA E OS NOVOS NPCS DOS CAPÍTULOS 5 E 6 DO OBELISCO SABEM ("Phandelver and Below: The Shattered Obelisk").
// Mesma regra de `npc-saber.js`: fato é o que o livro dá àquele NPC ou o que a própria cena do jogo já diz, e a fala é nossa,
// na voz dele. O modelo só reformula o que está em `fatos`; o que não está na lista, ele não sabe.
//
// QUATRO PEÇAS, para quem junta isto às outras fichas:
//   - `FATOS_DO_OBELISCO`: o que cada MORADOR passa a saber nos capítulos 5 a 8. Cada fato espera a hora certa por `requer`
//     (`e.estagio` é 0 antes do capítulo 5 e depois da cura, e 5/6/7/8 em cada capítulo; `e.o5`, `e.o6`, `e.o7` e `e.o8` são os
//     ramos da campanha, de `perguntar.js estadoDoObelisco`). Quem recebe isto soma aos `fatos` da ficha da vila.
//   - `FICHAS_OBELISCO_5A6`: as fichas dos NPCs NOVOS com quem o grupo fala nos capítulos 5 e 6.
//   - `ASSUNTOS_NOVOS`: o que os fatos pedem de `perguntas.js ASSUNTOS` e ainda não existe lá.
//   - `ONDE_ESTA_CADA_UM`: onde cada um aparece no código, e se é combatente no tabuleiro ou só texto de painel.
//
// O que é segredo ou spoiler fica atrás de `apertado('<ficha>')` (o teste social vencido na conversa) ou de um marco da campanha.
// Puro: roda no navegador, no servidor e em Node.
import { apertado } from './npc-saber-comum.js';

// ---------------------------------------------------------------- as horas ----
const est = (n) => (e) => (e.estagio ?? 0) >= n;
const entre = (a, b) => (e) => (e.estagio ?? 0) >= a && (e.estagio ?? 0) <= b;
const nao = (f) => (e) => !f(e);
const ambos = (...fs) => (e) => fs.every((f) => f(e));
const ou = (...fs) => (e) => fs.some((f) => f(e));
const o5 = (k) => (e) => e.o5?.feito?.[k] === true;
const o5Luta = (k) => (e) => e.o5?.lutas?.[k] === true;
const o5Posto = (k) => (e) => Boolean(e.o5?.zorzula?.[k]);
const o6 = (k) => (e) => e.o6?.feito?.[k] === true;
const o6Luta = (k) => (e) => e.o6?.lutas?.[k] === true;
const cripta = (k) => (e) => e.o6?.cripta?.feito?.[k] === true;
const encruz = (k) => (e) => e.o6?.encruzilhada?.feito?.[k] === true;
const o7 = (k) => (e) => e.o7?.feito?.[k] === true;
const curada = (e) => e.refracaoVencida === true;
const pagou = (e) => e.pagoFim === true;
const noCap6 = (e) => e.o6?.iniciado === true;

// ---------------------------------------------------------- os assuntos ----
/**
 * Assuntos que os fatos abaixo usam e `perguntas.js ASSUNTOS` não tem. Chaves como o jogador digita: sem acento, e com os
 * nomes do livro em inglês. ATENÇÃO ao juntar: `senha` (Droop) já tem as chaves `cripta`, `palavra` e `esqueletos`; como a nota é
 * o tamanho da chave e o empate fica com o primeiro, "cripta" sozinha continua indo para a `senha` se `ASSUNTOS_NOVOS` entrar depois.
 */
export const ASSUNTOS_NOVOS = {
  obelisco: { nome: 'o obelisco partido', chaves: ['obelisco', 'obelisk', 'obelisco partido', 'netheril', 'netherese', 'o que e o obelisco'] },
  pedraNegra: { nome: 'a pedra negra', chaves: ['pedra negra', 'pedra preta', 'lasca', 'lascas', 'a pedra', 'pedra fundamental', 'pedra da sorte', 'pedra do gigante', 'tambor do sarilho', 'pedaco de pedra'] },
  fragmentos: { nome: 'os fragmentos que faltam', chaves: ['fragmento', 'fragmentos', 'as tres que faltam', 'tres lascas', 'tres pedacos', 'shard', 'shards', 'os pedacos'] },
  duergar: { nome: 'os duergar', chaves: ['duergar', 'anao cinzento', 'anoes cinzentos', 'runa', 'runas', 'machado cravado', 'o machado'] },
  goblinsPsiquicos: { nome: 'os goblins psíquicos', chaves: ['goblin psiquico', 'goblins psiquicos', 'psiquico', 'psiquicos', 'psionico', 'psionicos', 'sawplee', 'sawplees', 'os goblins', 'travessura', 'travessuras', 'goblins da vila'] },
  ataquesNaVila: { nome: 'os ataques na vila', chaves: ['os ataques', 'vandalos', 'o que aconteceu', 'o que houve', 'os crimes', 'quatro lugares', 'lugares atacados'] },
  zorzula: { nome: 'o Repouso de Zorzula', chaves: ['zorzula', 'repouso de zorzula', 'zorzulas rest', 'o repouso', 'o rest', 'posto duergar', 'posto de mineracao', 'o posto', 'santuario indigo', 'indigo'] },
  ruxithid: { nome: 'Ruxithid', chaves: ['ruxithid', 'o escolhido', 'goblin de cabeca grande', 'cristal na cabeca', 'o chefe dos goblins', 'chefe dos sawplee'] },
  contratoHarbin: { nome: 'o contrato do Harbin', chaves: ['contrato', 'pagamento', 'quanto paga', 'o combinado', 'harbin paga', 'cinquenta pecas', 'cento e cinquenta'] },
  medo: { nome: 'o medo', chaves: ['medo', 'com medo', 'assustado', 'tem medo', 'esta com medo'] },
  pocoDaBarthen: { nome: 'o poço da Barthen', chaves: ['poco', 'o poco', 'poco secou', 'sarilho', 'otyugh', 'o rosnado'] },
  gwyn: { nome: 'Gwyn Oresong', chaves: ['gwyn', 'oresong', 'a estudiosa', 'a ana de oculos', 'a ana estudiosa'] },
  elsa: { nome: 'a Elsa', chaves: ['elsa', 'irma de gwyn', 'irma da gwyn'] },
  ander: { nome: 'o Ander', chaves: ['ander', 'balconista', 'ajudante da barthen', 'o rapaz da loja'] },
  tamara: { nome: 'a Tamara', chaves: ['tamara', 'filha do toblen', 'a menina do santuario'] },
  trilena: { nome: 'a Trilena', chaves: ['trilena', 'mulher do toblen', 'esposa do toblen'] },
  pip: { nome: 'o Pip', chaves: ['pip', 'filho do toblen', 'o menino que sumiu', 'aventura de pip'] },
  vaca: { nome: 'a vaca Daisy', chaves: ['vaca', 'daisy', 'velho narth', 'narth', 'gosma', 'gosmas', 'brilho verde', 'o brilho verde'] },
  marthungrim: { nome: 'Marthungrim', chaves: ['marthungrim', 'casa de marthungrim', 'o diario', 'o valente', 'paladino de dumathoin'] },
  mineiros: { nome: 'os mineiros e a Mina Hardyhammer', chaves: ['mineiros', 'mineiro', 'hardyhammer', 'mina hardyhammer', 'verno', 'tharbun', 'wallin', 'kreeve', 'elise', 'karthim', 'humblepick', 'veio de prata', 'bolsa dos mineiros', 'monte errante', 'arbusto que anda'] },
  talhundereth: { nome: 'Talhundereth', chaves: ['talhundereth', 'talhund', 'templo anao', 'o templo', 'dumathoin', 'cofre do templo', 'colinas de starmetal', 'starmetal'] },
  criptaDosTalhund: { nome: 'a Cripta dos Talhund', chaves: ['cripta dos talhund', 'crypt of the talhund', 'a cripta sagrada', 'o selo', 'os sepultados', 'o disco', 'a fechadura da cripta'] },
  encruzilhada: { nome: 'a Encruzilhada da Forca', chaves: ['encruzilhada', 'encruzilhada da forca', 'gibbet crossing', 'a forca', 'entreposto', 'entreposto dos tres povos'] },
  devoradores: { nome: 'os devoradores de mentes', chaves: ['devorador de mentes', 'devoradores de mentes', 'devoradores', 'mind flayer', 'mind flayers', 'illithid', 'cabeca de polvo', 'cabecas de polvo', 'tentaculos'] },
  illithinoch: { nome: 'Illithinoch', chaves: ['illithinoch', 'fortaleza dos devoradores', 'cerebro anciao', 'elder brain', 'o buraco no porao', 'buraco no porao', 'o buraco', 'o porao'] },
  reinoDistante: { nome: 'o Reino Distante', chaves: ['reino distante', 'far realm', 'ilvaash', 'os tomados', 'infectado', 'infectados', 'contaminado', 'contaminados'] },
  vilaMudando: { nome: 'a vila mudando', chaves: ['a vila esta estranha', 'a vila mudou', 'o povo muda', 'mudando', 'transformacao', 'olho no pescoco', 'dialeto subterraneo', 'a ascensao', 'ceu verde', 'ceu cinzento'] },
  culto: { nome: 'o culto do obelisco', chaves: ['culto', 'o culto', 'fanaticos', 'os fanaticos', 'cultistas', 'culto do obelisco', 'mutantes', 'humanoid mutate'] },
  refensDoPosto: { nome: 'os reféns do posto', chaves: ['refens', 'os refens', 'sala dos refens', 'gente sumida', 'os sumidos', 'moradores sumidos', 'sequestrados', 'os levados'] },
  henlifel: { nome: 'os Henlifel e o Ontharyx', chaves: ['ontharyx', 'henlifel', 'nythalyn', 'yanthdel', 'seu pai', 'meu pai', 'o pai deles', 'periapto', 'periapto da saude'] },
  drow: { nome: 'os drow', chaves: ['drow', 'elfos negros', 'elfo negro', 'erdan', 'thiala', 'vellios'] },
  rivibiddel: { nome: 'Rivibiddel e Thorgran', chaves: ['rivibiddel', 'thorgran', 'ironquill', 'o historiador', 'gnomo', 'gnomo das profundezas', 'svirfneblin', 'alavanca', 'alavancas'] },
  torreLamacenta: { nome: 'a Torre Lamacenta e o Zoklork', chaves: ['zoklork', 'xorn', 'torre lamacenta', 'mudslick', 'a torre tombada', 'ametista', 'ametistas', 'roper', 'ropers', 'enroladores', 'palavra de comando'] },
  hjoldak: { nome: 'Hjoldak Hollowhelm', chaves: ['hjoldak', 'hollowhelm', 'capitao de mineracao', 'o jarro', 'vaso canopico', 'o elevador', 'a esteira'] },
  wheel: { nome: 'Wheel-of-Fortune', chaves: ['wheel', 'wheel of fortune', 'wheel-of-fortune', 'o tiferino', 'o atendente', 'mente enorme', 'trilhas verdes', 'os rastros'] },
};

// ------------------------------------------------- os moradores de Phandalin ----
/**
 * O QUE CADA MORADOR PASSA A SABER nos capítulos 5 a 8. Entra depois dos `fatos` de `npc-saber-vila.js` (que já trazem
 * `FATOS_DO_MUNDO`). Só os que o livro faz falar algo; Linene e Sildar ficam de fora, porque o livro não os usa.
 */
export const FATOS_DO_OBELISCO = {
  toblen: [
    { id: 'obGoblins', assunto: 'goblinsPsiquicos', fato: 'Goblins andam infernizando a vila: quebram o que acham, roubam bobagem e somem. Todo mundo está nervoso.', requer: ambos(est(5), nao(curada)), fala: 'Goblins, na minha vila! Quebram tudo e somem antes de alguém levantar do banco. Ninguém dorme direito.' },
    { id: 'obSanta', assunto: 'tamara', fato: 'A esposa dele, Trilena, e a filha dos dois, Tamara, de dez anos, viram o arco do santuário de Tymora cair de manhã cedo, quando levavam a oferenda da semana.', requer: ambos(est(5), nao(curada)), fala: 'A Trilena e a Tamara viram o arco do santuário desabar, na hora da oferenda. A menina levou um susto, mas não larga as pedras.' },
    { id: 'obGwyn', assunto: 'gwyn', fato: 'Uma anã estudiosa de Neverwinter, Gwyn Oresong, é irmã da Elsa, que atende o balcão da estalagem, e se instalou na casa dele, com papéis espalhados por uma mesa inteira.', requer: o5('gwyn'), fala: 'A Gwyn é irmã da Elsa, lá do balcão. Veio de Neverwinter e tomou uma mesa inteira com papel. Fala mais que tudo, mas paga a conta.' },
    { id: 'obPipSumiu', assunto: 'pip', fato: 'O filho dele, Pip, saiu para brincar nos campos de manhã cedo e não voltou. Trilena está desesperada.', requer: ambos(est(6), noCap6, nao(o6('pipRecompensa'))), fala: 'O Pip saiu de manhã e não voltou. A Trilena não larga o avental de tanto torcer. Se vocês puderem…' },
    { id: 'obPipVolta', assunto: 'pip', fato: 'Pip foi trazido de volta pelo grupo. Em agradecimento, comida e cama na estalagem são de graça para o grupo enquanto estiver na região, e ele deu a eles a casa de Marthungrim como base.', requer: o6('pipRecompensa'), fala: 'Meu menino em casa, graças a vocês. Comida e cama são da casa enquanto estiverem por aqui. E aquele buraco lá nos campos fica com vocês.' },
    { id: 'obVaca', assunto: 'vaca', fato: 'A vaca Daisy, do Velho Narth, enlouqueceu e anda pelo largo. Dizem que há um brilho verde no pomar do Daran.', requer: ambos(est(6), noCap6, nao(o6Luta('vaca'))), fala: 'A vaca do Velho Narth endoideceu. E dizem que tem uma luz esverdeada no pomar do Daran. Coisa boa não é.' },
    { id: 'obFechada', assunto: 'estalagem', fato: 'A estalagem está fechada por tempo indeterminado, porque a família teme que algum hóspede perca a cabeça. O galpão de Qelline Alderleaf recebe quem precisa dormir.', requer: ambos(entre(8, 8), nao(curada)), fala: 'Fechada até segunda ordem. Se um hóspede enlouquece aqui dentro, quem paga são os outros. O galpão da Qelline recebe quem precisar.' },
    { id: 'obPovoMuda', assunto: 'vilaMudando', fato: 'Ele diz que o povo está mudando e que as casas parecem tortas. Quer que o grupo acabe com a causa.', requer: ambos(entre(7, 8), nao(curada)), fala: 'Reparou nas casas tortas? E no povo falando sozinho numa língua que ninguém ensinou? Acabem com isso, por favor.' },
    { id: 'obCurada', assunto: 'vilaMudando', fato: 'A vila voltou ao normal. Todos agradecem ao grupo.', requer: curada, fala: 'Tudo no lugar, como antes. A casa está aberta para vocês, e não é só modo de falar.' },
  ],

  harbin: [
    { id: 'obQuatro', assunto: 'ataquesNaVila', fato: 'Goblins atacaram quatro lugares da vila: o poço atrás do armazém da Elmina, a pedra fundamental do Câmbio de Minério, o arco do santuário de Tymora e o balcão do Gigante Adormecido. Ele não sabe por quê.', requer: ambos(est(5), nao(pagou)), fala: 'Quatro lugares: o poço da Barthen, a pedra do Câmbio, o arco do santuário e o balcão do Gigante. O chefe da vila não sabe por quê, e jura que tentou resolver.' },
    { id: 'obContrato', assunto: 'contratoHarbin', fato: 'Ele contratou o grupo: cinquenta peças de ouro para cada um agora, e cento e cinquenta no fim, quando o problema acabar.', requer: ambos(est(5), nao(pagou), (e) => (e.o5?.pagamento?.fim ?? 150) === 150), fala: 'Cinquenta peças a cada um agora, cento e cinquenta quando acabar. É o que o Salão pode pagar.' },
    { id: 'obContratoDobro', assunto: 'contratoHarbin', fato: 'Depois de ser pressionado, ele contratou o grupo pelo dobro: cem peças de ouro para cada um agora e trezentas no fim.', requer: ambos(est(5), nao(pagou), (e) => e.o5?.pagamento?.fim === 300), fala: 'Cem agora e trezentas no fim, como acertamos. O chefe da vila cumpre o que assina.' },
    { id: 'obPresos', assunto: 'trabalho', fato: 'Se o grupo trouxer algum goblin vivo, as celas do Salão estão vazias e ele guarda o preso, a contragosto.', requer: ambos(est(5), nao(pagou)), fala: 'Se pegarem um desses goblins vivo, as celas estão vazias. O chefe da vila guarda, a contragosto.' },
    { id: 'obMedo', assunto: 'medo', fato: 'O motivo de verdade de ele pedir ajuda é o medo: teme perder o cargo e que a vila o culpe por não ter feito nada antes.', requer: ambos(est(5), apertado('harbin')), fala: 'Sim, tenho medo! Medo de que a vila inteira me cobre, e de ter de explicar por que esperei tanto. Satisfeito?' },
    { id: 'obPago', assunto: 'contratoHarbin', fato: 'Ele pagou o resto do contrato quando o grupo voltou com os reféns do Repouso de Zorzula. O primo dele, Dareth Grint, estava entre eles.', requer: pagou, fala: 'Pago, cada centavo. E o Dareth é primo meu, de segundo grau, e voltou vivo. O chefe da vila agradece. Duas vezes.' },
    { id: 'obZorzula', assunto: 'zorzula', fato: 'O grupo descobriu que os goblins vêm do Repouso de Zorzula, um posto duergar abandonado a leste.', requer: ambos(o5('zorzula'), nao(pagou)), fala: 'Dizem que vocês descobriram de onde vêm os goblins: um posto velho de anões cinzentos, a leste. Acabem com isso.' },
  ],

  halia: [
    { id: 'obPredio', assunto: 'pedraNegra', fato: 'A pedra fundamental do Câmbio foi arrancada pelos goblins numa tarde em que ela estava sozinha. Era uma pedra preta e lisa, embutida desde que o prédio foi erguido, que ela chamava de pedra da sorte. Sem ela, o prédio tombou.', requer: ambos(est(5), o5('acampamentoSabido')), fala: 'Levaram só a pedra fundamental, preta e lisa, a nossa pedra da sorte. Sem ela o prédio quase foi ao chão. Por que a pedra, não sei.' },
    { id: 'obFuga', assunto: 'goblinsPsiquicos', fato: 'Ela brigou com os goblins e feriu alguns. Um deles a empurrou para trás sem encostar nela, com uma força estranha. Fugiram para a mata ao sul, e não devem ter ido longe.', requer: ambos(est(5), o5('acampamentoSabido')), fala: 'Feri alguns, sei disso. Um me empurrou sem me tocar, com uma força que eu nunca vi. Foram para a mata ao sul, e feridos não vão longe.' },
    { id: 'obMineiros', assunto: 'mineiros', fato: 'Ela mandou quatro mineiros procurar outra Onda Eco, a sudoeste, nas Montanhas da Espada. Só Verno Tharbun voltou, contando de um arbusto que anda e atraiu o velho Wallin Kreeve para dentro de uma caverna. A filha dele, Elise, e o anão Karthim Humblepick foram atrás.', requer: ambos(est(6), o6('mineirosContados')), fala: 'Mandei quatro mineiros procurar outra Onda Eco. Só o Verno Tharbun voltou, falando de um arbusto que anda. O Wallin foi atrás dele, e a Elise e o Karthim foram atrás do Wallin.' },
    { id: 'obHardyhammer', assunto: 'mineiros', fato: 'Pelo que Verno contou, ela deduz que o lugar é a Mina Hardyhammer, uma mina velha cujo dono morreu sem herdeiros, a sudoeste de Phandalin.', requer: ambos(est(6), o6('sabeHardyhammer')), fala: 'Pelo que o Verno descreveu, é a Hardyhammer, uma mina velha cujo dono morreu sem herdeiro. A sudoeste daqui. Quero certeza.' },
    { id: 'obRenda', assunto: 'mineiros', fato: 'Os mineiros achados no fundo da Hardyhammer acharam um veio de prata e dão ao grupo uma parte: duzentas e cinquenta peças de ouro por mês, durante um ano, pagas na Bolsa dos Mineiros.', requer: o6Luta('mina'), fala: 'Duzentas e cinquenta por mês, durante um ano, do veio de prata deles. Passem aqui na Bolsa para buscar.' },
    { id: 'obTrancada', assunto: 'reinoDistante', fato: 'Ela está transformada pelo ritual dos fanáticos e fala do Câmbio fechado por uma fresta, sem abrir a porta: quer que o grupo conte tudo o que achou lá embaixo, mas depois.', requer: ambos(est(8), nao(curada)), fala: 'Contem tudo o que acharam lá embaixo. Depois. Agora vão, por favor.' },
  ],

  irmaGaraele: [
    { id: 'obArco', assunto: 'santuario', fato: 'O arco do santuário caiu num monte de pedras. Ela voltou de viagem horas depois do ataque e não viu nada; manda o grupo falar com Trilena Stonehill e com a filha dela, Tamara, que viram tudo.', requer: ambos(est(5), nao(pagou)), fala: 'Eu estava fora, e só voltei horas depois do desabamento. Falem com a Trilena e com a Tamara: elas viram.' },
    { id: 'obReerguer', assunto: 'santuario', fato: 'Ela agradece ao grupo por ter reerguido o arco e o abençoa com o sinal de Tymora.', requer: o5('arcoDePe'), fala: 'O arco está de pé, um pouco torto. Que Tymora sorria a vocês.' },
    { id: 'obTrancada', assunto: 'reinoDistante', fato: 'Ela está tomada pelo ritual dos fanáticos e fechada por dentro do santuário, rezando rápido, e a reza às vezes escorrega para uma língua que não é de gente. Pede que não entrem, porque ainda é ela.', requer: ambos(est(8), nao(curada)), fala: 'Não entrem. Ainda sou eu. Acabem com aquilo, e eu abro a porta.' },
    { id: 'obCurada', assunto: 'santuario', fato: 'Ela está curada e varre o santuário, rindo.', requer: curada, fala: 'Estou inteira de novo. Varrendo, vejam só. Que a sorte as acompanhe, a vocês e a quem vier.' },
  ],

  daran: [
    { id: 'obBrilho', assunto: 'vaca', fato: 'Um brilho esverdeado sobe do pomar dele de vez em quando, e ele não sabe a causa. Não gosta nada disso, e está de olho.', requer: ambos(est(6), noCap6, nao(o6Luta('vaca'))), fala: 'Há um brilho verde subindo do pomar, de noite. Não sei de onde vem. Não gosto. Fiquem de olho comigo.' },
  ],

  qelline: [
    { id: 'obCarp', assunto: 'carp', fato: 'O Carp está de castigo e não pode sair da fazenda. Ele é amigo do Pip, filho de Toblen, e os dois costumam brincar nos campos a sudeste.', requer: ambos(est(6), noCap6, nao(o6('pipRecompensa'))), fala: 'O Carp está de castigo, e não sai daqui. Ele e o Pip vivem nos campos a sudeste. Perguntem a ele, mas aqui dentro.' },
    { id: 'obGalpao', assunto: 'estalagem', fato: 'O galpão dela está aberto a quem precisar dormir, depois que a estalagem Stonehill fechou.', requer: ambos(est(8), nao(curada)), fala: 'A estalagem fechou, mas o meu galpão não. Seco e sem custo, como sempre.' },
  ],

  elmar: [
    { id: 'obPoco', assunto: 'pocoDaBarthen', fato: 'O poço atrás do armazém secou depois que os goblins arrancaram o tambor do sarilho. Ela quer a água de volta, e o rapaz Ander viu os goblins.', requer: ambos(est(5), nao(o5Luta('poco')), nao(curada)), fala: 'O poço secou, e levaram o tambor do sarilho inteiro. Fala com o Ander, ele viu. Eu só quero a água de volta.' },
    { id: 'obPocoFeito', assunto: 'pocoDaBarthen', fato: 'O grupo desceu ao poço e livrou o fundo do que rosnava lá embaixo.', requer: o5Luta('poco'), fala: 'Vocês limparam o fundo do poço, soube. Ainda não tem água, mas já é um começo.' },
    { id: 'obAnder', assunto: 'ander', fato: 'Ander, o rapaz do balcão, está trancado no andar de cima por vontade própria, depois de tomado pelo ritual. À noite bate na parede num ritmo que não é música.', requer: ambos(est(8), nao(curada)), fala: 'O Ander está lá em cima, trancado, e pediu para ficar. De noite bate na parede num ritmo estranho. A loja continua aberta: alguém tem de vender corda para quem vai descer.' },
  ],

  grista: [
    { id: 'obBalcao', assunto: 'pedraNegra', fato: 'Goblins quebraram o balcão do Gigante Adormecido de madrugada. Ela acordou, desceu e viu cinco criaturinhas armadas. Correu atrás delas com uma vassoura e várias fugiram pela chaminé. Quase não levaram comida: queriam o balcão. A pedra preta embutida nele ninguém achava especial.', requer: ambos(est(5), nao(curada)), fala: 'Madeira quebrando de madrugada. Cinco coisinhas com orelha e dente, armadas. Corri com a vassoura, e subiram pela chaminé. Queriam o balcão, não a comida.' },
    { id: 'obWheel', assunto: 'wheel', fato: 'Wheel-of-Fortune, um tiferino de pele roxa, serve o balcão com ela. Ela confia nele e nunca viu ele pegar uma moeda.', requer: est(5), fala: 'O tiferino do balcão é de confiança. Nunca vi ele pegar uma moeda sequer. Quem diz o contrário que venha me dizer na cara.' },
    { id: 'obApagou', assunto: 'wheel', fato: 'Ela apagou todas as luzes menos uma vela, a pedido do Wheel-of-Fortune, que sofre com a luz. Pede que o grupo faça alguma coisa por ele.', requer: ambos(est(7), nao(curada)), fala: 'Apaguei tudo porque ele pediu. Trabalha comigo, nunca roubou uma moeda. Façam alguma coisa.' },
  ],
};

// ----------------------------------------------------------- os novos NPCs ----
const quem = (assunto, fato, fala) => ({ id: 'quem', assunto, fato, fala });

export const FICHAS_OBELISCO_5A6 = {
  gwyn: {
    nome: 'Gwyn Oresong',
    quem: 'Anã estudiosa de Neverwinter, de óculos redondos e mochila maior que ela, que sabe de história antiga, de impérios velhos e de cultura goblin. É irmã da Elsa, que atende o balcão da Estalagem Stonehill. Boa e curiosa, não luta, e fala demais.',
    voz: 'Fala atropelando as frases, solta uma curiosidade histórica no meio de qualquer resposta e tira os óculos para limpar quando está com medo. Chama o grupo de "vocês" e pede que lhe tragam tudo o que acharem.',
    naoSei: 'Hm, isso eu não sei. Nunca li nada sobre isso, e olha que eu li muito.',
    naoConta: 'Isso eu prefiro não dizer enquanto não tiver certeza. Pode estar errado.',
    foraDoTema: 'Não entendi o que isso tem a ver com a nossa investigação. Querem um chá?',
    fatos: [
      quem('quemEVoce', 'Ela é Gwyn Oresong, estudiosa de Neverwinter, especialista em história antiga e cultura goblin.', 'Gwyn Oresong, de Neverwinter! Estudo história antiga e os goblins, os de verdade, não os dos contos.'),
      { id: 'elsa', assunto: 'elsa', fato: 'Ela veio a Phandalin procurar a irmã, Elsa, que trabalha como atendente na Estalagem Stonehill.', fala: 'A minha irmã, a Elsa, trabalha no balcão da Stonehill. Vim vê-la, e acabei no meio disto tudo.' },
      { id: 'pedra', assunto: 'pedraNegra', fato: 'Os goblins não roubam por roubar: caçam lascas de uma pedra negra e estranha, embutida há anos nas obras da vila. Ela quer que o grupo lhe traga tudo o que achar sobre elas.', requer: o5('gwyn'), fala: 'Eles não roubam, caçam! Lascas de uma pedra escura, embutida nas obras daqui há anos. Tragam-me tudo o que acharem sobre elas.' },
      { id: 'duergar', assunto: 'duergar', fato: 'Ela reconhece à primeira vista as runas do machado cravado perto do santuário: são de duergar, os anões cinzentos do subterrâneo. Ninguém faz runa assim por aqui.', requer: o5('gwyn'), fala: 'Aquelas runas são duergar, os anões cinzentos do fundo da terra! Ninguém faz runa assim por aqui.' },
      { id: 'sawplee', assunto: 'goblinsPsiquicos', fato: 'Os goblins são do clã Sawplee, que vive há gerações num velho posto de mineração duergar. Parte do clã ganhou poderes psíquicos depois que devoradores de mentes tomaram o lugar, séculos atrás.', requer: o5('zorzula'), fala: 'São os Sawplee, um clã que mora há gerações num posto duergar abandonado. Alguns têm poder na cabeça, desde que os devoradores de mentes tomaram o lugar.' },
      { id: 'zorzula', assunto: 'zorzula', fato: 'O posto dos goblins é o Repouso de Zorzula, um posto de mineração duergar abandonado há séculos, a um dia de viagem para o leste, nas Montanhas da Espada.', requer: o5('zorzula'), fala: 'Repouso de Zorzula. Um posto duergar abandonado, a um dia de viagem para o leste, nas Montanhas da Espada.' },
      { id: 'talhund', assunto: 'talhundereth', fato: 'No mapa dos goblins, Talhundereth quer dizer "presentes escondidos" na língua velha e vem dos sacerdotes de Dumathoin. Ela recomenda começar por aí, porque é o lugar que conhece melhor.', requer: ambos(est(6), noCap6), fala: 'Talhundereth quer dizer "presentes escondidos", e é coisa dos sacerdotes de Dumathoin. É o que conheço melhor, e é por onde eu começaria.' },
      { id: 'cripta', assunto: 'criptaDosTalhund', fato: 'A lenda diz que a cripta dos sacerdotes tem um selo que só os fiéis de Dumathoin sabem abrir.', requer: ambos(est(6), noCap6), fala: 'A lenda fala de uma cripta com um selo que só os fiéis de Dumathoin abrem. Quem for fiel entra mais fácil.' },
      { id: 'encruz', assunto: 'encruzilhada', fato: 'A Encruzilhada da Forca foi um entreposto onde drow, duergar e gnomos das profundezas negociavam, debaixo da terra.', requer: ambos(est(6), noCap6), fala: 'A Encruzilhada da Forca era um entreposto subterrâneo: drow, duergar e gnomos das profundezas comerciando. Imaginem as conversas.' },
      { id: 'devoradores', assunto: 'devoradores', fato: 'Os devoradores de mentes arrasaram os três lugares ao mesmo tempo, séculos atrás: o posto de Zorzula, Talhundereth e a Encruzilhada.', requer: ambos(est(6), noCap6), fala: 'Os três lugares foram arrasados no mesmo tempo, séculos atrás, pelos devoradores de mentes. Isso não pode ser coincidência.' },
      { id: 'faltam', assunto: 'fragmentos', fato: 'Das sete partes do obelisco, os goblins já entregaram quatro, as lascas de Phandalin. Faltam três, uma em Talhundereth, uma na cripta debaixo dele e uma na Encruzilhada da Forca.', requer: ambos(est(6), noCap6), fala: 'Quatro lascas já foram levadas daqui. Faltam três: em Talhundereth, na cripta e na Encruzilhada. É o que o mapa deles mostra.' },
      { id: 'marthungrim', assunto: 'marthungrim', fato: 'Ela conhece a lenda de Marthungrim, o Valente, um paladino anão de Dumathoin que morreu ferido por uma criatura de tentáculos depois de tentar devolver ao descanso os espíritos de uma cripta corrompida.', requer: o6('diario'), fala: 'Marthungrim, o Valente! Paladino anão de Dumathoin. Eu conhecia a lenda, não que ele tinha mesmo morado ali.' },
      { id: 'illithinoch', assunto: 'illithinoch', fato: 'O buraco no porão do Gigante Adormecido desce ao Subterrâneo. A força que o tiferino sente lá embaixo deve ser um cérebro ancião, e "Illithinoch" é o nome que ela conhece da antiga fortaleza dos devoradores de mentes. Ela não sabe nada além disso.', requer: ambos(est(7), o7('wheelOuvido')), fala: 'Um buraco para o Subterrâneo, debaixo de uma taverna, e uma mente enorme embaixo dele. É um cérebro ancião, em Illithinoch, a velha fortaleza dos devoradores de mentes. É tudo o que eu sei.' },
      { id: 'infeccao', assunto: 'reinoDistante', fato: 'Quem passou muito tempo perto dos cacos do obelisco está sendo contaminado pelo Reino Distante: a Irmã Garaele, a Halia Thornton, o Ander e o Wheel-of-Fortune.', requer: ambos(est(7), nao(curada)), fala: 'Quem ficou perto das lascas muito tempo está sendo mudado pelo Reino Distante: a Garaele, a Halia, o Ander e o Wheel-of-Fortune. É a magia velha dos nethereses, entrando neles.' },
      { id: 'olho', assunto: 'vilaMudando', fato: 'Um olho de íris dupla abriu no pescoço dela, e ela o esconde com um cachecol. Só aceita a irmã e o grupo por perto. Pede que acabem logo com isso.', requer: ambos(est(8), nao(curada)), fala: 'Vejam. Abriu esta coisa no pescoço. Não sei mais nada que ajude, só acabem com isso logo. Por favor.' },
      { id: 'rivi', assunto: 'rivibiddel', fato: 'Rivibiddel, o gnomo das profundezas, jura que o livro que tirou da cripta mudou de texto e só fala de caos. O livro não mudou, ele é que lê errado e não consegue parar.', requer: ambos(est(8), nao(curada), cripta('rivibiddelFora')), fala: 'O Rivibiddel está desesperado, jura que o livro da cripta agora só fala de caos. O livro não mudou. Ele é que lê errado.' },
      { id: 'curada', assunto: 'reinoDistante', fato: 'A vila está curada. Ela quer cada detalhe do Reino Distante para os livros dela.', requer: curada, fala: 'A vila está curada! Agora quero cada detalhe do Reino Distante, desde o começo. Peço ao Toblen uma mesa maior.' },
    ],
  },

  ander: {
    nome: 'Ander',
    quem: 'Rapaz halfling, ajudante e balconista do armazém Barthen Provisões. Nervoso, quer falar bem de todo mundo. Tirava água do poço da loja e, desde então, dormia mal.',
    voz: 'Acanhado e rápido, completa as frases do jeito que acha que o outro quer ouvir. Olha para o chão quando mente por educação.',
    naoSei: 'Eu não vi isso, juro. Eu estava na loja.',
    naoConta: 'Não conta para o senhor Barthen, por favor.',
    foraDoTema: 'Hã? Eu só mexo nas prateleiras.',
    fatos: [
      quem('quemEVoce', 'Ele é Ander, rapaz que ajuda no armazém.', 'Ander. Ajudo a dona Barthen. Não sou de nada importante.'),
      { id: 'goblins', assunto: 'goblinsPsiquicos', fato: 'Os vândalos eram um pouco maiores que ele, com orelhas compridas e chatas, cabeças grandes e mãos que brilhavam. Chegaram ao pôr do sol, foram direto ao poço sem nem olhar o estoque, e pularam lá dentro quando ele gritou.', requer: est(5), fala: 'Eram um pouco maiores que eu, de orelha chata e cabeça grande, e as mãos brilhavam. Foram direto ao poço, nem olharam a loja. Quando gritei, pularam lá dentro.' },
      { id: 'rest', assunto: 'zorzula', fato: 'Um dos goblins berrou para os outros voltarem "para o Repouso" antes de sumir pelo poço.', requer: est(5), fala: 'Um deles berrou para os outros voltarem "para o Repouso". Foi o que ouvi antes de sumirem.' },
      { id: 'poco', assunto: 'pocoDaBarthen', fato: 'Depois que os goblins sumiram, o poço secou. Ele acha que eles represaram a fonte.', requer: est(5), fala: 'Depois que eles pularam, o poço secou. Acho que represaram a água lá embaixo.' },
      { id: 'pesadelos', assunto: 'pedraNegra', fato: 'Ele confessa que toda vez que tirava água do poço tinha pesadelos horríveis na noite seguinte, e achava o poço amaldiçoado. Desde que os goblins levaram a pedra do sarilho, ele dorme bem.', requer: apertado('ander'), fala: 'Não conta para a dona Barthen. Cada vez que eu tirava água, tinha pesadelo horrível. Desde que levaram aquela pedra, eu durmo.' },
      { id: 'trancado', assunto: 'reinoDistante', fato: 'Ele está trancado no andar de cima da loja por vontade própria depois de ser tomado pelo ritual dos fanáticos, para não ferir ninguém, e bate na parede num ritmo estranho à noite.', requer: ambos(est(8), nao(curada)), fala: 'Prefiro ficar aqui em cima, trancado. Não quero ferir ninguém. Às vezes eu bato na parede, e não sei por quê.' },
    ],
  },

  tamara: {
    nome: 'Tamara Stonehill',
    quem: 'Menina de dez anos, filha do Toblen e da Trilena, que separa as pedras do arco caído do santuário de Tymora. Séria, ocupada, responde o que sabe e nada mais.',
    voz: 'Séria demais para a idade, de olhos na tarefa, frases curtas e diretas. Corrige quem fala errado do santuário.',
    naoSei: 'Não sei. Eu só ajudo a separar as pedras.',
    naoConta: 'Depois. Estou ocupada.',
    foraDoTema: 'Não entendi. Estou contando as pedras.',
    fatos: [
      quem('quemEVoce', 'Ela é Tamara Stonehill, filha do dono da estalagem.', 'Tamara, filha do Toblen. Tenho dez anos e muito trabalho.'),
      { id: 'viu', assunto: 'goblinsPsiquicos', fato: 'Ela viu três sombras baixinhas fugirem rindo de manhã cedo, falando fino numa língua que não entendeu.', requer: ou(o5('arcoDePe'), apertado('tamara')), fala: 'Três sombras baixinhas, fugindo e rindo, com voz fina, numa língua que eu não conheço.' },
      { id: 'pedra', assunto: 'pedraNegra', fato: 'Alguém tirou a pedra do meio do arco sem pôr outra no lugar. Era preta e brilhava.', requer: ou(o5('arcoDePe'), apertado('tamara')), fala: 'Tiraram a pedra do meio do arco e não puseram outra. Era preta e brilhava.' },
      { id: 'oferenda', assunto: 'santuario', fato: 'Ela e a mãe, Trilena, estavam levando a oferenda semanal ao santuário de Tymora ao amanhecer, quando o arco cedeu. Tymora é a deusa da boa sorte.', requer: ou(o5('arcoDePe'), apertado('tamara')), fala: 'Eu e a mãe viemos trazer a oferenda da semana para a Tymora, a deusa da boa sorte, e o arco cedeu.' },
      { id: 'apertada', assunto: 'saida', fato: 'O grupo conseguiu fazê-la parar de trabalhar um instante, e ela conta o que viu.', requer: apertado('tamara'), fala: 'Está bem, paro um pouquinho. Pergunta rápido.' },
    ],
  },

  trilena: {
    nome: 'Trilena Stonehill',
    quem: 'Esposa de Toblen e mãe de Tamara e de Pip, que cuida da cozinha da Estalagem Stonehill. Preocupada com os filhos.',
    voz: 'Torce o avental enquanto fala, frases curtas e cansadas. Muda de assunto para a comida quando está nervosa.',
    naoSei: 'Isso eu não sei. Só sei da minha cozinha e dos meus filhos.',
    naoConta: 'Não vou falar disso agora. Estou com a cabeça no meu filho.',
    foraDoTema: 'Não entendi. Querem pão?',
    fatos: [
      quem('quemEVoce', 'Ela é Trilena Stonehill, mulher do dono da estalagem.', 'Trilena, mulher do Toblen. Cuido da cozinha.'),
      { id: 'filhos', assunto: 'tamara', fato: 'Ela tem dois filhos: Tamara, de dez anos, e Pip. Ela estava com Tamara quando o arco do santuário cedeu.', requer: est(5), fala: 'A Tamara e o Pip. Eu estava com a Tamara quando o arco cedeu, e vimos três sombras baixinhas fugindo.' },
      { id: 'pip', assunto: 'pip', fato: 'Pip saiu para brincar nos campos a sudeste de manhã cedo e não voltou. Ele vive indo para lá com Carp, o filho dos Alderleaf.', requer: ambos(est(6), noCap6, nao(o6('pipRecompensa'))), fala: 'O Pip saiu cedo, para os campos a sudeste, e não voltou. Ele vive lá com o Carp, dos Alderleaf. Por favor, procurem.' },
      { id: 'pipVolta', assunto: 'pip', fato: 'O Pip voltou graças ao grupo. A família não quer voltar ao buraco onde ele se meteu, e dá ao grupo comida e cama de graça.', requer: o6('pipRecompensa'), fala: 'Meu filho está em casa. Não sei como agradecer. Comida e cama são de vocês enquanto estiverem aqui.' },
    ],
  },

  pip: {
    nome: 'Pip Stonehill',
    quem: 'Menino de dez anos, filho de Toblen e Trilena, aventureiro de quintal e amigo de Carp Alderleaf. Seguiu três criaturinhas até uma ruína anã e ficou vigiando o buraco, esperando ajuda.',
    voz: 'Cochicha empolgado, de olhos brilhando, exagera um pouco as coisas. Trata o grupo como heróis.',
    naoSei: 'Eu não sei. Eu só segui eles.',
    naoConta: 'Eu prometi que não contava.',
    foraDoTema: 'Hã? Não entendi!',
    fatos: [
      quem('quemEVoce', 'Ele é Pip, filho do dono da estalagem.', 'Pip! Sou aventureiro. Quase.'),
      { id: 'seguiu', assunto: 'pip', fato: 'Ele seguiu desde o riacho três criaturinhas de pernas finas e cabeça mole. Elas caíram pelo teto de uma ruína anã e não conseguem sair, porque a escada desabou.', requer: est(6), fala: 'Eu segui eles desde o riacho. Três bichinhos de perna fina. Caíram na ruína e não conseguem sair.' },
      { id: 'barulho', assunto: 'devoradores', fato: 'Quando ele ia pegar uma das criaturas, elas fizeram um barulho com a cabeça que ele não soube explicar.', requer: est(6), fala: 'Eu ia pegar um, aí eles fizeram um barulho com a cabeça. Doeu atrás dos olhos.' },
      { id: 'casa', assunto: 'marthungrim', fato: 'A ruína é a casa de um anão, Marthungrim, morto antes de os pais de Pip nascerem. Ele nunca entrou nela.', requer: est(6), fala: 'É uma casa de anão. Muito velha, mais velha que meu pai. Eu não entrei, juro.' },
    ],
  },

  carp: {
    nome: 'Carp Alderleaf',
    quem: 'Menino de dez anos, filho de Qelline Alderleaf e amigo de Pip. Está de castigo e não pode sair da fazenda, mas viu para onde o Pip foi.',
    voz: 'Fala aos gritos baixos, apontando com o braço inteiro, e se defende antes de ser acusado.',
    naoSei: 'Eu não vi! Eu estava de castigo!',
    naoConta: 'A mamãe disse que não posso falar disso.',
    foraDoTema: 'Hã? Não entendi!',
    fatos: [
      quem('quemEVoce', 'Ele é Carp Alderleaf, filho de Qelline.', 'Carp! Filho da dona Qelline. E eu não fiz nada.'),
      { id: 'pip', assunto: 'pip', fato: 'Ele não pode sair da fazenda, mas aponta a direção em que Pip foi: atrás dos bichinhos de cabeça mole, nos campos a sudeste. Ele avisou que era perigoso.', requer: ambos(est(6), noCap6, nao(o6('pipRecompensa'))), fala: 'Ele foi atrás dos bichinhos de cabeça mole! Para lá, nos campos! Eu falei que era perigoso!' },
    ],
  },

  wheel: {
    nome: 'Wheel-of-Fortune',
    quem: 'Tiferino alto, de pele roxa, atendente do Gigante Adormecido, recém-chegado a Phandalin. Toda bebida que servia saía errada, e batia na pedra do balcão a cada dose, por hábito, para dar sorte.',
    voz: 'Cordial e nervoso, oferece bebida por conta da casa antes de qualquer resposta. No capítulo 7 fala baixo e aperta as têmporas, com medo da luz.',
    naoSei: 'Isso eu não vi. Eu dormia lá em cima.',
    naoConta: 'Prefiro não falar disso. Não agora.',
    foraDoTema: 'Hã? Querem mais uma caneca?',
    fatos: [
      quem('quemEVoce', 'Ele é Wheel-of-Fortune, atendente do balcão do Gigante Adormecido.', 'Wheel-of-Fortune, a seu dispor. Bebida por conta da casa.'),
      { id: 'nada', assunto: 'ataquesNaVila', fato: 'Ele não viu o ataque ao balcão porque dormia lá em cima, e manda falar com a Greska, que correu atrás dos goblins com uma vassoura.', requer: ambos(est(5), nao(est(7))), fala: 'Não vi nada, eu dormia lá em cima. Falem com a Greska, ela correu atrás deles de vassoura.' },
      { id: 'maldito', assunto: 'pedraNegra', fato: 'Toda bebida que servia saía errada: a cerveja dava dor de cabeça, o hidromel brilhava como óleo. Ele batia na pedra do balcão a cada dose, para dar sorte, e achava que a maldição era dele.', requer: ambos(est(5), apertado('wheel')), fala: 'Tá bom. Toda bebida que eu servia saía errada, e eu batia na pedra a cada dose, para dar sorte. Achei que a maldição era minha.' },
      { id: 'porao', assunto: 'illithinoch', fato: 'Dias atrás, ao descer ao porão para buscar um barril, ele achou goblins e um buraco redondo que não existia, com uma rampa descendo. Muitos goblins fugiram por ele, e de noite viu gente da vila sendo levada por ali.', requer: ambos(est(7), nao(curada)), fala: 'Desci ao porão e tinha goblins, e um buraco redondo que não existia, com uma rampa. Os goblins fugiram por ele. Depois vi gente da vila sendo levada de noite.' },
      { id: 'mente', assunto: 'wheel', fato: 'Muito embaixo da vila, ele sente uma mente enorme que não dorme e às vezes olha para cá. Também vê trilhas verdes no ar, por onde pessoas e bichos passaram.', requer: ambos(est(7), nao(curada)), fala: 'Lá embaixo tem uma mente enorme que não dorme. Às vezes olha para cá, e eu escondo a cabeça debaixo do balcão. E vejo trilhas verdes no ar, por onde as pessoas passaram.' },
      { id: 'sente', assunto: 'reinoDistante', fato: 'Alguma coisa está mexendo na mente e no corpo dele, e ele sente que está ganhando. A luz acima de uma vela lhe dói, e ele pede um canto isolado para não ferir ninguém.', requer: ambos(est(7), nao(curada)), fala: 'Alguma coisa mexe em mim por dentro, e está ganhando. Não cheguem com luz. Peço um canto longe de todo mundo, para não ferir ninguém.' },
      { id: 'trancado', assunto: 'vilaMudando', fato: 'Ele está trancado por vontade própria, para não ferir ninguém, depois de piorar muito.', requer: ambos(est(8), nao(curada)), fala: 'Piorou. Estou trancado porque eu quis. Os amigos passam para conversar, e é isso que me segura.' },
    ],
  },

  wallin: {
    nome: 'Wallin Kreeve',
    quem: 'Mineiro velho de Phandalin, pai de Elise Kreeve, preso com ela e com o anão Karthim Humblepick numa câmara da Mina Hardyhammer. Atraído para lá por uma voz dentro da cabeça.',
    voz: 'Cansado e envergonhado, fala devagar. Desculpa-se mais do que explica.',
    naoSei: 'Não me lembro disso. Minha cabeça ainda dói.',
    naoConta: 'Não quero falar disso.',
    foraDoTema: 'Não entendi. Só quero voltar para casa.',
    fatos: [
      quem('quemEVoce', 'Ele é Wallin Kreeve, mineiro.', 'Wallin Kreeve, mineiro. Ou fui.'),
      { id: 'voz', assunto: 'mineiros', fato: 'Uma coisa de mato que anda, um arbusto, falou dentro da cabeça dele e o atraiu para dentro da caverna da Hardyhammer. A filha dele, Elise, e o Karthim vieram atrás, e agora ninguém sai.', requer: est(6), fala: 'Tem uma coisa de mato lá fora, que anda. Falou dentro da minha cabeça, e eu vim. A Elise e o Karthim vieram atrás de mim. Agora ninguém sai.' },
      { id: 'veio', assunto: 'mineiros', fato: 'Presos, os mineiros acharam um veio de prata no fundo da câmara e dão uma parte ao grupo: duzentas e cinquenta peças de ouro por mês, durante um ano, pagas na Bolsa dos Mineiros.', requer: o6Luta('mina'), fala: 'Achamos prata no fundo da câmara. Uma parte é de vocês: duzentas e cinquenta por mês, por um ano. A Halia paga na Bolsa.' },
    ],
  },

  elise: {
    nome: 'Elise Kreeve',
    quem: 'Filha do mineiro Wallin Kreeve. Foi atrás do pai na Mina Hardyhammer e ficou presa com ele e com o anão Karthim. Firme e prática.',
    voz: 'Prática e direta, de braços cruzados. Agradece com franqueza e sem enfeite.',
    naoSei: 'Não sei. Ficamos presos no escuro.',
    naoConta: 'Isso é do meu pai.',
    foraDoTema: 'Não entendi. Podemos sair daqui?',
    fatos: [
      quem('quemEVoce', 'Ela é Elise Kreeve, filha do velho Wallin.', 'Elise Kreeve, filha do Wallin.'),
      { id: 'veio', assunto: 'mineiros', fato: 'Os mineiros presos acharam um veio de prata nos fundos da câmara e dão ao grupo uma parte: duzentas e cinquenta peças por mês, durante um ano, pagas na Bolsa dos Mineiros, em Phandalin.', requer: o6Luta('mina'), fala: 'Uma parte do veio é de vocês. Duzentas e cinquenta por mês, por um ano. A Halia paga na Bolsa.' },
      { id: 'monte', assunto: 'mineiros', fato: 'Uma coisa de mato, que anda e fala dentro da cabeça, atraiu o pai dela, e não os deixa sair. A câmara onde estão é estreita demais para a coisa entrar.', requer: est(6), fala: 'Uma coisa de mato, que anda e fala na cabeça. Pegou meu pai. A nossa câmara é estreita demais para ela entrar, e é isso que nos mantém vivos.' },
    ],
  },

  karthim: {
    nome: 'Karthim Humblepick',
    quem: 'Anão de barba trançada e poucas palavras, mineiro preso na Mina Hardyhammer com Wallin e Elise Kreeve. Ouviu falar de grandes tesouros no cofre e na cripta de um templo anão abandonado.',
    voz: 'Quase mudo, responde com gestos e frases secas. Quando fala, aperta a mão de quem está falando.',
    naoSei: 'Não sei.',
    naoConta: 'Isso fica comigo.',
    foraDoTema: 'Não entendi.',
    fatos: [
      quem('quemEVoce', 'Ele é Karthim Humblepick, mineiro anão.', 'Karthim. Humblepick.'),
      { id: 'sorte', assunto: 'mineiros', fato: 'Ele diz que o grupo teve sorte de não cair numa ruína anã mais velha que a Mina Hardyhammer.', requer: o6Luta('mina'), fala: 'Sorte de vocês não terem caído numa ruína anã mais velha que esta.' },
      { id: 'talhundereth', assunto: 'talhundereth', fato: 'Ele marcou no mapa o lugar de Talhundereth, o templo anão nas colinas de Starmetal, e ouviu falar de grandes tesouros no cofre do templo e na cripta sagrada. Ele não volta lá.', requer: o6Luta('mina'), fala: 'Talhundereth, aqui nas colinas de Starmetal. Dizem que o cofre do templo e a cripta estão cheios. Eu é que não volto lá.' },
    ],
  },

  dareth: {
    nome: 'Dareth Grint',
    quem: 'Agricultor humano, primo de segundo grau do Harbin Wester, preso com outros dois no Santuário Índigo, no Repouso de Zorzula. Fraco, ainda consegue rir.',
    voz: 'Ri e tosse ao mesmo tempo, fala por frases partidas e quer saber se o primo vai pagar.',
    naoSei: 'Não sei. Eu quase não via nada lá dentro.',
    naoConta: 'Não consigo falar disso agora.',
    foraDoTema: 'Hã? Estou muito cansado para entender.',
    fatos: [
      quem('quemEVoce', 'Ele é Dareth Grint, agricultor, primo de segundo grau do Harbin.', 'Dareth Grint. Sou primo do Harbin, de segundo grau. Ele vai pagar, não vai?'),
      { id: 'refens', assunto: 'refensDoPosto', fato: 'Ele e outros dois, Paulina Previne e Tumblewick Rollins, estavam presos na ala oeste do santuário. Havia mais gente presa, que foi levada para um propósito especial e não voltou.', requer: est(5), fala: 'Eu, a Paulina e o Tumblewick. Havia mais gente presa, levaram para um "propósito especial", e não voltaram.' },
      { id: 'coluna', assunto: 'obelisco', fato: 'Os goblins queriam montar uma coluna de pedra grande e quebrada, e falavam disso o dia inteiro.', requer: est(5), fala: 'Eles queriam montar uma coluna de pedra, uma coluna grande e quebrada. Falavam disso o dia inteiro.' },
    ],
  },

  paulina: {
    nome: 'Paulina Previne',
    quem: 'Moça humana que cuida de cavalos e faz bicos na Estalagem Stonehill, presa no Santuário Índigo, no Repouso de Zorzula. Exausta e assustada.',
    voz: 'Fala baixo e devagar, agradece o tempo todo, e não olha para a lava.',
    naoSei: 'Não sei. Estava escuro.',
    naoConta: 'Não consigo falar disso.',
    foraDoTema: 'Não entendi. Estou muito cansada.',
    fatos: [
      quem('quemEVoce', 'Ela é Paulina Previne, cuida de cavalos e faz bicos na Stonehill.', 'Paulina Previne. Cuido de cavalos e faço bicos na Stonehill.'),
      { id: 'coluna', assunto: 'obelisco', fato: 'Os goblins queriam montar uma coluna de pedra grande e quebrada, e falavam disso o dia inteiro.', requer: est(5), fala: 'Eles falavam de uma coluna de pedra, grande e quebrada, o dia todo. Queriam montar.' },
      { id: 'refens', assunto: 'refensDoPosto', fato: 'Ela, Dareth Grint e Tumblewick Rollins estavam presos juntos. Outros foram levados para um propósito especial e não voltaram.', requer: est(5), fala: 'Éramos três, eu, o Dareth e o Tumblewick. Os outros levaram para um propósito especial. Não voltaram.' },
    ],
  },

  tumblewick: {
    nome: 'Tumblewick Rollins',
    quem: 'Boticário gnomo, preso no Santuário Índigo, no Repouso de Zorzula, com Dareth Grint e Paulina Previne. Atento e curioso, ouviu o chefe dos goblins planejar numa sala.',
    voz: 'Fala rápido e preciso, como quem pesa ervas. Conta o que ouviu sem opinar.',
    naoSei: 'Não ouvi isso.',
    naoConta: 'Isso eu prefiro não dizer.',
    foraDoTema: 'Não entendi. Tenho ervas na mochila, se alguém precisar.',
    fatos: [
      quem('quemEVoce', 'Ele é Tumblewick Rollins, boticário gnomo.', 'Tumblewick Rollins, boticário. Estive melhor.'),
      { id: 'refens', assunto: 'refensDoPosto', fato: 'Havia mais gente presa, que foi levada para um "propósito especial" e não voltou.', requer: est(5), fala: 'Tinha mais gente presa. Levaram para um "propósito especial", e ninguém voltou.' },
      { id: 'plano', assunto: 'ruxithid', fato: 'O chefe usava a sala do outro lado do santuário para fazer planos. Ele ouvia as conversas dali, mas não entendia tudo.', requer: est(5), fala: 'O chefe usava a sala do outro lado para planejar. Eu ouvia, mas não entendia tudo.' },
    ],
  },

  goblinSawplee: {
    nome: 'o goblin do posto',
    quem: 'Goblin psíquico do clã Sawplee, que mora no Repouso de Zorzula. Crédulo, de mal com o chefe Ruxithid, e quer subjugar quem entra, não matar. Se parar a briga, propõe um trato.',
    voz: 'Frases curtas de goblin, medrosas e curiosas, sempre olhando para a porta atrás de si.',
    naoSei: 'Goblin não sabe. Goblin só sabe do posto.',
    naoConta: 'Se o chefe souber que goblin falou, goblin vira sopa.',
    foraDoTema: 'Goblin não entendeu. Goblin quer só comer em paz.',
    fatos: [
      quem('quemEVoce', 'É um goblin do clã Sawplee, que mora no posto.', 'Goblin é Sawplee! Mora aqui desde sempre.'),
      { id: 'chefe', assunto: 'ruxithid', fato: 'O chefe deles, Ruxithid, anda esquisito: nunca avisa nada e some cada vez mais, lendo papéis. Muitos do clã estão de mal com ele.', requer: est(5), fala: 'O chefe anda esquisito! Nunca avisa nada, lê papel e sai correndo. Muito goblin está de mal com ele.' },
      { id: 'cedeu', assunto: 'saida', fato: 'O grupo o convenceu a não gritar nem lutar, e ele propõe um trato: o grupo passa, se limpar a forja dos monstros que a ocuparam.', requer: apertado('goblinSawplee'), fala: 'Trato! Goblin deixa passar, se vocês limparem a forja dos monstros. Goblin não gosta de forja.' },
      { id: 'salaAzul', assunto: 'zorzula', fato: 'O chefe deve estar na "sala azul", falando com os deuses que deram poder aos psiônicos. É o Santuário Índigo, depois da ponte sobre a lava. Eles não sabem mais nada.', requer: apertado('goblinSawplee'), fala: 'O chefe está na sala azul, falando com os deuses. Depois da ponte. Goblin não sabe mais nada.' },
      { id: 'deuses', assunto: 'devoradores', fato: 'Os goblins acham que há "deuses" que lhes falam na mente e deram poder a parte do clã. Eles não sabem quem são.', requer: apertado('goblinSawplee'), fala: 'Deuses falam na cabeça de goblin. Deram poder para alguns. Quem são, goblin não sabe.' },
    ],
  },

  hjoldak: {
    nome: 'Hjoldak Hollowhelm',
    quem: 'Alma de um duergar, último capitão de mineração do Repouso de Zorzula, presa num vaso canopico pelos devoradores de mentes. Solta, aparece como um anão cinzento de barba trançada e olhos de brasa apagada. Pacífico, conhece o posto inteiro.',
    voz: 'Formal e duro, de capitão, com mesuras curtas. Fala do posto como quem fala de um filho.',
    naoSei: 'Isso nunca passou pelo meu posto.',
    naoConta: 'Isso é segredo da mineração.',
    foraDoTema: 'Não compreendo. Falemos do posto.',
    fatos: [
      quem('quemEVoce', 'Ele é Hjoldak Hollowhelm, o último capitão de mineração do posto.', 'Hjoldak Hollowhelm, capitão de mineração deste posto.'),
      { id: 'jarro', assunto: 'hjoldak', fato: 'Os devoradores de mentes o prenderam dentro de um jarro, e ele agradece ao grupo por tê-lo libertado.', requer: o5Posto('hjoldak'), fala: 'Os cabeças-de-polvo me puseram naquele jarro. Obrigado por me tirarem de lá.' },
      { id: 'runas', assunto: 'zorzula', fato: 'A ordem das runas do cofre é tempestade, morte, luz e vento. Ele mesmo as pôs.', requer: o5Posto('hjoldak'), fala: 'As runas do cofre: tempestade, morte, luz e vento, nessa ordem. Eu mesmo as pus.' },
      { id: 'elevador', assunto: 'hjoldak', fato: 'O elevador e a esteira do posto andam a cristal. Uma magia no cristal e um bom par de mãos no mecanismo os consertam.', requer: o5Posto('hjoldak'), fala: 'O elevador e a esteira andam a cristal. Uma magia no cristal e um bom par de mãos no mecanismo.' },
      { id: 'ruxithid', assunto: 'ruxithid', fato: 'O goblin de cabeça grande, Ruxithid, aparece cada vez menos, sempre distraído, lendo papéis e saindo às pressas. Ele acha que trabalha em algum lugar mais fundo.', requer: o5Posto('hjoldak'), fala: 'O goblin de cabeça grande some cada vez mais. Lê, sai correndo, volta. Trabalha em algum lugar mais fundo.' },
      { id: 'cama', assunto: 'tesouro', fato: 'Há um compartimento escondido na cabeceira da cama dele, que ele guardava.', requer: o5Posto('hjoldak'), fala: 'Pé da cama. Há um compartimento. Era meu.' },
    ],
  },

  ruxithid: {
    nome: 'Ruxithid, o Escolhido',
    quem: 'Chefe dos goblins psíquicos do Repouso de Zorzula, com um cristal azul cravado no crânio que pulsa. Cordial e calmo, diz-se arauto divino de uma metamorfose do mundo, mas conversa com outra mente ao mesmo tempo. Vai lutar até morrer.',
    voz: 'Manso, quase cantado, e polido demais. De vez em quando inclina a cabeça como quem escuta alguém. Chama o grupo de "vocês" e sugere que estão do lado certo da "muda".',
    naoSei: 'As vozes não me disseram isso.',
    naoConta: 'Isso eu só conto aos que se unirem a nós.',
    foraDoTema: 'Isso não importa à muda, meus caros.',
    fatos: [
      quem('quemEVoce', 'Ele é Ruxithid, o Escolhido, chefe dos goblins do posto.', 'Ruxithid, o Escolhido. Um arauto, nada mais.'),
      { id: 'muda', assunto: 'obelisco', fato: 'Ele diz que o mundo vai mudar de pele, como uma cobra, e que os deuses o escolheram para anunciar isso. Convida o grupo a juntar-se a eles.', fala: 'O mundo vai mudar de pele, como uma cobra, e os deuses me escolheram para anunciar. Vocês podem estar do lado certo da muda.' },
      { id: 'prova', assunto: 'refensDoPosto', fato: 'As vozes querem uma prova de lealdade do grupo: que entreguem os três reféns da ala oeste.', fala: 'As vozes querem uma prova. Os três da ala oeste. Entreguem-nos, e a muda será gentil com vocês.' },
      { id: 'fragmentos', assunto: 'fragmentos', fato: 'Quando seu cristal se parte, as vozes dos mandantes mandam buscar as três lascas que restam, em Talhundereth, na Cripta dos Talhund e na Encruzilhada da Forca, e dizem que Phandalin será deles.', requer: o5('zorzula'), fala: 'As três que restam. Talhundereth, a cripta e a Encruzilhada. E Phandalin será nossa.' },
    ],
  },

  nythalyn: {
    nome: 'Nythalyn Henlifel',
    quem: 'Drow elite guerreiro, irmão de Yanthdel, filho do Ontharyx. Vieram buscar o pai em Talhundereth, que disse ter recebido um chamado psíquico. Esperam o pai na Sala de Leitura e na Biblioteca. Cauteloso, mas disposto a aliar-se.',
    voz: 'Seco e militar, fala por ordens suaves, deixa que a irmã traduza o que não entende. Evita briga.',
    naoSei: 'Isso eu não sei. Pergunte a minha irmã.',
    naoConta: 'Isso é assunto da família.',
    foraDoTema: 'Não entendo. Estamos aqui por meu pai.',
    fatos: [
      quem('quemEVoce', 'Ele é Nythalyn Henlifel, drow, irmão de Yanthdel.', 'Nythalyn Henlifel. Meu irmão e eu viemos buscar nosso pai.'),
      { id: 'pai', assunto: 'henlifel', fato: 'Eles vieram buscar o pai, Ontharyx, que disse ter recebido um chamado psíquico. Temem que ele tenha entrado num culto perigoso, e não sabem que ele é o líder.', requer: est(6), fala: 'Viemos buscar nosso pai, Ontharyx. Ele disse que ouvia um chamado na cabeça. Tememos que tenha entrado num culto.' },
      { id: 'captura', assunto: 'henlifel', fato: 'Eles querem que o grupo capture o Ontharyx vivo e o traga de volta, subjugado e inconsciente. Eles não ligam para os outros cultistas.', requer: est(6), fala: 'Capturem meu pai vivo, desacordado se preciso, e tragam-no aqui. Os outros cultistas não nos importam.' },
    ],
  },

  yanthdel: {
    nome: 'Yanthdel Henlifel',
    quem: 'Drow elite guerreira, irmã de Nythalyn e filha do Ontharyx. Lê comum, élfico, subcomum e anão, e traduz para os guardas. Quer salvar o pai do culto e acredita que consegue convencê-lo do erro.',
    voz: 'Calma, calorosa e firme, passa a fala para o comum devagar e fala de negócios no fim. Mostra o periapto na hora de trocar.',
    naoSei: 'Isso eu não sei, infelizmente.',
    naoConta: 'Isso fica entre mim e meu pai.',
    foraDoTema: 'Não entendi. Falemos do que importa, meu pai.',
    fatos: [
      quem('quemEVoce', 'Ela é Yanthdel Henlifel, drow, filha do Ontharyx e irmã de Nythalyn.', 'Yanthdel Henlifel. Meu irmão e eu estamos aqui por nosso pai.'),
      { id: 'pai', assunto: 'henlifel', fato: 'O pai deles, Ontharyx, não apareceu onde esperavam, na estátua. Está mais fundo. Não virá por vontade própria. Ela pede que o grupo o traga subjugado e vivo, e tem certeza de que o convence do erro.', requer: est(6), fala: 'Nosso pai se chama Ontharyx. Esperávamos encontrá-lo junto da estátua, e ele não veio. Está mais fundo. Tragam-no vivo, e eu o convenço.' },
      { id: 'mapa', assunto: 'talhundereth', fato: 'Ela tem um mapa de pano das salas do templo, com a porta secreta do quarto dela, e abre-o para o grupo.', requer: est(6), fala: 'Tenho um mapa de pano do salão e das salas em volta, até a estátua lá embaixo. Há uma porta secreta neste quarto.' },
      { id: 'periapto', assunto: 'henlifel', fato: 'Ela troca o periapto da saúde, que usa no pescoço, pelo pai. Se o grupo trouxer a notícia da morte dele, ela ainda dá o periapto, se acreditar que tentaram primeiro uma aproximação pacífica.', requer: est(6), fala: 'Meu pingente vermelho, o periapto da saúde, é de vocês se me trouxerem meu pai. Se o pior acontecer, desde que tenham tentado conversar.' },
      { id: 'psiquica', assunto: 'devoradores', fato: 'Há uma criatura psíquica na sala comum, e eles evitam a imagem de lá, que acham ser isca. Os cultistas são fortes demais para eles com os bichos estranhos que criam, as gêmulas.', requer: est(6), fala: 'Há uma coisa psíquica na sala comum. Evitamos a imagem de lá, é uma isca. E os cultistas têm bichos estranhos, as gêmulas.' },
      { id: 'livro', assunto: 'talhundereth', fato: 'Na biblioteca ao lado há muitos livros, e só ela lê as línguas deles. Os drow não acharam nada útil.', requer: est(6), fala: 'A biblioteca está cheia de livros, e só eu leio as línguas deles. Não achamos nada útil.' },
    ],
  },

  drowT14: {
    nome: 'o drow da Sala de Leitura',
    quem: 'Um dos três guardas e trabalhadores da família Henlifel (Erdan Vosselth, Thiala Sharne e Vellios Keethe), que chegaram há pouco ao templo pelo Subterrâneo. Cautelosos com forasteiros, querem evitar briga e talvez ganhar aliados.',
    voz: 'Formal e desconfiado, fala devagar em comum, e chama os líderes para traduzir o que não entende.',
    naoSei: 'Isso nós não sabemos. Os nossos líderes sabem mais.',
    naoConta: 'Isso é da família Henlifel.',
    foraDoTema: 'Não entendi. Chamem meus líderes.',
    fatos: [
      quem('quemEVoce', 'É um dos três drow guardas da família Henlifel: Erdan Vosselth, Thiala Sharne ou Vellios Keethe.', 'Servimos a família Henlifel a vida inteira.'),
      { id: 'chegada', assunto: 'drow', fato: 'Eles chegaram há pouco ao templo, pelo Subterrâneo, pela entrada, junto de Nythalyn e Yanthdel Henlifel.', requer: est(6), fala: 'Chegamos há pouco, pelo Subterrâneo, pela entrada principal, com os irmãos Nythalyn e Yanthdel.' },
      { id: 'pai', assunto: 'henlifel', fato: 'Os irmãos vieram convencer o pai, Ontharyx, a voltar, porque ele disse ter ouvido um chamado psíquico. Eles temem que tenha entrado num culto, mas ninguém sabe que ele é o líder.', requer: est(6), fala: 'Os irmãos querem trazer o pai de volta. Ele ouviu um chamado na cabeça. Temem que esteja num culto perigoso.' },
      { id: 'isca', assunto: 'devoradores', fato: 'Há uma criatura psíquica na sala comum, e eles evitam a imagem de lá, achando ser isca. Querem avançar, mas os cultistas são fortes demais com os bichos estranhos que criam, as gêmulas.', requer: est(6), fala: 'Há uma coisa psíquica na sala comum. É isca. E os cultistas têm bichos estranhos, fortes demais para nós.' },
    ],
  },

  ontharyx: {
    nome: 'Ontharyx Henlifel',
    quem: 'Drow que largou a família e lidera o culto do obelisco em Talhundereth, na Câmara da Purificação. É um dos mutados do obelisco. Faz cena de conversa para enganar. Acha os filhos ignorantes e ataca se puder dividir o grupo.',
    voz: 'Polido e sedutor, com ironia por baixo. Elogia o grupo antes de tudo e chama os filhos de "meus pobres meninos".',
    naoSei: 'Isso nem os mestres me disseram.',
    naoConta: 'Isso só se conta a quem se une a nós.',
    foraDoTema: 'Isso não importa. Falemos do que vale.',
    fatos: [
      quem('quemEVoce', 'Ele é Ontharyx Henlifel, drow, líder do culto.', 'Ontharyx Henlifel, para servi-los. Ou não.'),
      { id: 'culto', assunto: 'culto', fato: 'Ele e os seus seguem um chamado psíquico e acham que o obelisco é um canal para uma entidade do Reino Distante. Os cultistas gostam de ver gente para matar e dar ao monstro da sala de baixo.', requer: est(6), fala: 'O chamado nos veio na cabeça. O obelisco é um canal para algo muito maior, do Reino Distante. E o que sobra de visitantes, damos ao monstro.' },
      { id: 'filhos', assunto: 'henlifel', fato: 'Seus filhos, Nythalyn e Yanthdel, vieram buscá-lo, e ele os acha ignorantes. Não tem intenção de sair, e a conversa que oferece ao grupo é uma farsa.', requer: ambos(est(6), apertado('ontharyx')), fala: 'Meus pobres meninos, ignorantes. Não vou sair, claro. A conversa era para ganhar tempo, até alguém ficar sozinho.' },
      { id: 'disco', assunto: 'criptaDosTalhund', fato: 'Ele ou outros mutados podem revelar que o encaixe central do disco da cripta pode ser sobrecarregado com vinte de dano psíquico ou mais, que o quebra e abre a fechadura, seja qual for o disco.', requer: ambos(est(6), apertado('ontharyx')), fala: 'O disco da cripta? O encaixe se sobrecarrega com vinte de dano psíquico ou mais. Quebra e abre, seja qual for o disco.' },
    ],
  },

  rivibiddel: {
    nome: 'Rivibiddel',
    quem: 'Gnomo das profundezas, historiador e convertido de Dumathoin, quase morto de fome e muito envelhecido, preso na Cripta dos Talhund. Não pode usar reações e anda devagar. Quer uma lasca da grande "esmeralda" como relíquia para os fiéis.',
    voz: 'Gentil, erudito e frágil, fala devagar e come devagar. Chama o que sabe de "o que me coube ver".',
    naoSei: 'Isso nunca me coube ver.',
    naoConta: 'Isso eu só conto depois de uma refeição.',
    foraDoTema: 'Receio não compreender, meu bom amigo.',
    fatos: [
      quem('quemEVoce', 'Ele é Rivibiddel, historiador e fiel de Dumathoin.', 'Rivibiddel, historiador. E fiel de Dumathoin, para o que valha.'),
      { id: 'entrada', assunto: 'criptaDosTalhund', fato: 'Ele entrou na cripta nadando, pelo poço do sul, por uma passagem do fundo, passando pelos moradores perigosos da câmara alagada. Era muito mais jovem quando entrou: procurando comida ao norte, topou com dois fantasmas, e o Semblante Horripilante deles o envelheceu. Está à beira da morte.', requer: est(6), fala: 'Entrei nadando, pelo poço do sul. Era bem mais jovem. Procurando comida, topei com dois fantasmas e o semblante deles me envelheceu.' },
      { id: 'obra', assunto: 'rivibiddel', fato: 'Ele já copiou a obra inteira do historiador Thorgran Ironquill, escrita nas paredes do túmulo. A segunda metade ficou com letra trêmula. Guarda tudo numa bolsa a tiracolo.', requer: est(6), fala: 'Copiei a obra do Thorgran Ironquill inteira. A segunda metade, com a letra trêmula. Está nesta bolsa.' },
      { id: 'alavanca', assunto: 'rivibiddel', fato: 'A alavanca do túmulo só se move ao mesmo tempo que a do túmulo da general, e as duas juntas giram o santuário. Ele só conhece da câmara alagada à sala dos valentes.', requer: est(6), fala: 'A alavanca só se move junto com a do túmulo da general. Juntas, giram o santuário. Eu só conheço daqui até a sala dos valentes.' },
      { id: 'lasca', assunto: 'criptaDosTalhund', fato: 'Ele quer uma lasca da grande "esmeralda" da cripta como relíquia para levar aos fiéis antes de morrer. Não sobrevive ao nado de volta e aceitaria ficar em Phandalin.', requer: est(6), fala: 'Uma lasca da grande "esmeralda" da cripta, como relíquia. Não aguento o nado de volta, mas aceitaria ficar em Phandalin.' },
      { id: 'cripta', assunto: 'criptaDosTalhund', fato: 'A cripta era um dos lugares mais sagrados de Dumathoin. O sarcófago de Thorgran está vazio: Thorgran fingiu a morte.', requer: ambos(est(6), apertado('rivibiddel')), fala: 'A cripta era dos lugares mais sagrados de Dumathoin. E o túmulo do Thorgran está vazio. Ele fingiu a morte.' },
    ],
  },

  zoklork: {
    nome: 'Zoklork',
    quem: 'Xorn de três braços e três olhos, que vive junto da Torre Lamacenta tombada na Encruzilhada da Forca. Veio atrás das ametistas que os gnomos deixaram e está furioso com o colega de pedra que as comeu. Fala gnômico, subcomum e terrano.',
    voz: 'Mastiga pedra entre as frases, fala num comum cheio de pedregulho e bate o punho na torre quando se irrita.',
    naoSei: 'Zoklork não sabe. Pedra não conta.',
    naoConta: 'Primeiro as pedras roxas.',
    foraDoTema: 'Zoklork não entendeu. Zoklork quer as pedras roxas.',
    fatos: [
      quem('quemEVoce', 'Ele é Zoklork, um xorn.', 'Zoklork. Xorn. Gosta de pedra.'),
      { id: 'colega', assunto: 'torreLamacenta', fato: 'O colega de pedra do Zoklork achou e comeu todas as ametistas que os gnomos deixaram, sem dividir. Depois saiu e os enroladores do túnel o comeram, com as ametistas dentro.', requer: est(6), fala: 'O colega achou todas as pedras roxas e comeu. Não dividiu. Depois saiu, e as pedras-que-comem o comeram.' },
      { id: 'vinganca', assunto: 'torreLamacenta', fato: 'Ele quer vingança contra os dois enroladores e as ametistas de volta. Quem as dê, ou mate os enroladores mesmo sem recuperá-las, ganha dele uma informação.', requer: est(6), fala: 'Zoklork quer vingança e as pedras. Quem trouxer as roxas, ou matar os enroladores, ganha uma palavra.' },
      { id: 'torre', assunto: 'torreLamacenta', fato: 'A torre tombada é um item raro do Plano da Terra, ativado por acidente. Ele não sabe do fragmento. A palavra de comando dela é "petrificação" em terrano.', requer: ou(encruz('zoklorkPago'), encruz('enroladorRecuou'), apertado('zoklork')), fala: 'A torre é coisa rara do Plano da Terra, ativada sem querer. A palavra para ela é "petrificação", em terrano.' },
      { id: 'recusa', assunto: 'torreLamacenta', fato: 'Ele não vai explorar o lugar para o grupo, porque há perigo demais por perto.', requer: est(6), fala: 'Zoklork não vai explorar para vocês. Perigo demais por perto.' },
    ],
  },
};

// -------------------------------------------------------- onde está cada um ----
/**
 * ONDE CADA UM APARECE NO CÓDIGO (arquivo:linha) e se é combatente no tabuleiro ou só texto de painel. Linhas conferidas em
 * 2026-11-13: se os arquivos andarem, procure pelo nome. As cenas apontam a ficha de quem não tem id de morador com `npc.ficha`
 * (como `capitulo3-mansao.js:163`); `idDaFicha` só acha sozinho o que tem `npcId`/`id` igual a um id de `IDS_DA_VILA`.
 */
export const ONDE_ESTA_CADA_UM = {
  // ---- moradores com fatos novos ----
  toblen: { onde: 'src/game/obelisco6-vila.js:44-49 (a Gwyn e a Trilena na cozinha), :86-95 (a volta do Pip); src/game/obelisco7-vila.js:83-91 (a Stonehill fechada no capítulo 8)', tipo: 'texto de painel; a conversa livre sai da Estalagem em `phandalin.js` (id `toblen`)' },
  harbin: { onde: 'src/game/obelisco5-vila.js:120 (`ctx.falar(\'harbin\', ...)`, a árvore do contrato) e :98-118 (o pagamento do resto)', tipo: 'árvore de diálogo da vila (`falar`); sem combatente. O contrato mora em `camp.obelisco5.pagamento`' },
  halia: { onde: 'src/game/obelisco5-vila.js:197 (`ctx.falar(\'halia\')`, o Câmbio); src/game/obelisco6-vila.js:107-132 (a Bolsa dos Mineiros); src/game/obelisco7-vila.js:96-99 (a fresta do Câmbio no capítulo 8)', tipo: 'árvore/painel da vila; sem combatente (no capítulo 7 ela é "Morador Infectado" na briga do santuário, `obelisco7-lugares.js`, `obelisco7-mapas.js:20`)' },
  irmaGaraele: { onde: 'src/game/obelisco5-vila.js:216-221 (o arco, só narrado); src/game/obelisco7-vila.js:92-95 (a porta trancada no capítulo 8)', tipo: 'texto de painel; no capítulo 7 é combatente da briga (`obelisco7-mapas.js:19`)' },
  grista: { onde: 'src/game/obelisco5-terreo.js:54-55 (a Greska: `makeMonster(\'plebeu\', P.greska)`, `name: \'Greska\'`, `side: \'neutro\'`), árvores em :171 (capítulo 5) e :146 (capítulo 7, `arvoreGreska7`), `dialogoDe` em :273-276', tipo: 'COMBATENTE neutro no tabuleiro do salão. `defId` `plebeu` e nome `Greska`: `idDaFicha` não o acha sozinho; a cena precisa de `greska.ficha = \'grista\'`' },
  elmar: { onde: 'src/game/obelisco5-vila.js:134-158 (o poço); src/game/obelisco7-vila.js:100-103 (a loja no capítulo 8)', tipo: 'texto de painel (a Elmina não tem combatente; a conversa livre sai da loja em `phandalin.js`, id `elmar`)' },
  daran: { onde: 'não há cena do pomar no código dos capítulos 5 e 6; o brilho verde é do livro (cap6.md 3.2). A conversa livre sai do pomar em `phandalin.js`', tipo: 'texto de painel' },
  qelline: { onde: 'src/game/obelisco6-vila.js:61-76 (o Carp de castigo, narrado: opção "Perguntar ao Carp, na fazenda Alderleaf" em :63); galpão no capítulo 8 em obelisco7-vila.js:84', tipo: 'texto de painel' },

  // ---- fichas novas ----
  gwyn: { onde: 'src/game/obelisco5-vila.js:338-349 (`conhecerGwyn`, na rua) e :352-390 (`gwynNaEstalagem`); src/game/obelisco6-vila.js:44-55 (a refeição e a tradução do mapa); src/game/obelisco5-terreo.js:58-59 (`makeMonster(\'plebeu\', P.grupo[0])`, `name: \'Gwyn Oresong\'`, só no modo cap7); src/game/obelisco7-vila.js:85-88 (o olho no pescoço, capítulo 8)', tipo: 'texto de painel nos capítulos 5 e 6; COMBATENTE neutro (`plebeu`, `name` \'Gwyn Oresong\') só no salão do capítulo 7. A cena precisa de `gwyn.ficha = \'gwyn\'`' },
  ander: { onde: 'src/game/obelisco5-vila.js:157-176 (`ctx.falar(\'ander\', ..., pessoa(\'ander\', \'Ander\'))`, `pessoa` = `{ id, name, look: null }`)', tipo: 'árvore de diálogo (`falar`); `pessoa` não é combatente. `id: \'ander\'` só é reconhecido se a ficha entrar em `IDS_DA_VILA`; senão marque `ficha: \'ander\'` na pessoa' },
  tamara: { onde: 'src/game/obelisco5-vila.js:241-258 (`ctx.falar(\'tamara\', ..., pessoa(\'tamara\', \'Tamara Stonehill\'))`)', tipo: 'árvore de diálogo (`falar`); sem combatente. Mesma observação do Ander' },
  trilena: { onde: 'src/game/obelisco6-vila.js:49 (porta da cozinha), :61 e :92 (a volta do Pip)', tipo: 'só texto de painel; não há objeto nem `falar` no código. Quem quiser conversa livre precisa criar o ponto na cena da Stonehill' },
  pip: { onde: 'src/game/obelisco6-vila.js:79-83 (o Pip no buraco, só painel) e :86-95 (a volta)', tipo: 'só texto de painel. A cena da casa de Marthungrim (`obelisco6-lugares.js:52`) não põe o Pip no tabuleiro' },
  carp: { onde: 'src/game/obelisco6-vila.js:63 e :76 (aponta o caminho, só narrado)', tipo: 'só texto de painel; o assunto `carp` já existe na ficha da Qelline' },
  wheel: { onde: 'src/game/obelisco5-terreo.js:56-57 (`makeMonster(\'plebeu\', P.wheel)`, `name: \'Wheel-of-Fortune\'`, `side: \'neutro\'`), árvores em :90 (capítulo 5, `arvoreWheel`) e :111 (capítulo 7, `arvoreWheel7`), `dialogoDe` em :273-277; também obelisco7-mapas.js:21', tipo: 'COMBATENTE neutro no tabuleiro do salão. `defId` `plebeu`, `name` \'Wheel-of-Fortune\': a cena precisa de `wheel.ficha = \'wheel\'`' },
  wallin: { onde: 'src/game/obelisco6-lugares.js:65-71 (`[\'Wallin Kreeve\', \'Elise Kreeve\', \'Karthim Humblepick\'].map(...)`: `makeMonster(\'plebeu\', P.MINA_HARDYHAMMER.mineiros[i])`, `refem: true`, `falas`), saem para `side: \'neutro\'` em :212-232', tipo: 'COMBATENTES (`plebeu`, `refem: true` e depois `side: \'neutro\'`) no tabuleiro da câmara. `m.ficha = \'wallin\' | \'elise\' | \'karthim\'` por índice' },
  elise: { onde: 'a mesma lista, obelisco6-lugares.js:65-71, índice 1', tipo: 'COMBATENTE (`plebeu`, `name` \'Elise Kreeve\')' },
  karthim: { onde: 'a mesma lista, obelisco6-lugares.js:65-71, índice 2; a despedida dele está em :213-216', tipo: 'COMBATENTE (`plebeu`, `name` \'Karthim Humblepick\')' },
  dareth: { onde: 'src/game/zorzula-santuario.js:49-52 (`REFENS`), :89 (`Object.assign(m, { name: r.nome, refem: true, hp: 1, falas: [r.fala] })`), :295 (`side: \'neutro\'`); a volta com eles em obelisco5-vila.js:98-118 (o Harbin)', tipo: 'COMBATENTE (`refem: true`, depois neutro) no Santuário Índigo; `name` \'Dareth Grint\'' },
  paulina: { onde: 'a mesma lista: zorzula-santuario.js:49-52, :89, :295; `name` \'Paulina Previne\'', tipo: 'COMBATENTE (`refem: true`)' },
  tumblewick: { onde: 'a mesma lista: zorzula-santuario.js:49-52, :89, :295; `name` \'Tumblewick Rollins\'', tipo: 'COMBATENTE (`refem: true`)' },
  goblinSawplee: { onde: 'src/game/zorzula-posto.js:104 (vigias da seteira, `goblinPsiComandante`), :111-118 (refeitório e dormitório, `goblinPsiLutador` e `goblinPsiComandante`); a conversa com os vigias já tem painel em :245-270 (`falarComOsVigias`, :479) e o trato em :288-332', tipo: 'COMBATENTES (`goblinPsiComandante`, `goblinPsiLutador`), neutros no refeitório e no dormitório (:125, :460). `ficha = \'goblinSawplee\'` por cima do `nasce`' },
  hjoldak: { onde: 'src/game/zorzula-posto.js:730-742 (`soltarHjoldak`: `nasce(\'ashenwightPsionico\', ..., \'Hjoldak Hollowhelm\')`, `falas` em :735-738, `entrarNeutro` em :734)', tipo: 'COMBATENTE neutro (`defId` `ashenwightPsionico`, `name` \'Hjoldak Hollowhelm\'); só existe depois de solto do jarro (`z.hjoldak = \'livre\'`)' },
  ruxithid: { onde: 'src/game/zorzula-santuario.js:76-77 (`makeMonster(\'ruxithid\')`, `name` \'Ruxithid, o Escolhido\'), a conversa em :151-182 (`conversa`: Observar os olhos, Perguntar o que ele quer, Atacar), neutro em :296 antes da luta', tipo: 'COMBATENTE (`defId` `ruxithid`), neutro antes da luta; a conversa é painel que acaba em luta. A ficha serve só ao "Perguntar" antes de atacar' },
  nythalyn: { onde: 'src/game/talhundereth.js:77 (`[\'nythalyn\', \'drowGuerreiroDeElite\', P.irmaos[0], \'Nythalyn Henlifel\', \'T15\', false]`), `side: \'neutro\'` em :127; os pedidos em :425-431', tipo: 'COMBATENTE neutro (`defId` `drowGuerreiroDeElite`, `name` \'Nythalyn Henlifel\', `chaveDoTemplo` \'nythalyn\')' },
  yanthdel: { onde: 'src/game/talhundereth.js:78 (`\'yanthdel\'`, `drowGuerreiroDeElite`, \'Yanthdel Henlifel\'); o mapa de pano em :425-431; a troca do periapto em :682-690', tipo: 'COMBATENTE neutro (`name` \'Yanthdel Henlifel\')' },
  drowT14: { onde: 'src/game/talhundereth.js:73-75 (`erdan`, `thiala`, `vellios`: `drow`, \'Erdan Vosselth\', \'Thiala Sharne\', \'Vellios Keethe\', sala `T14`)', tipo: 'COMBATENTES neutros (`defId` `drow`). Uma ficha serve aos três: a cena marca `ficha: \'drowT14\'` nos três' },
  ontharyx: { onde: 'src/game/talhundereth.js:81 (`\'ontharyx\'`, `mutanteHumanoide`, \'Ontharyx Henlifel\', sala `T18`), `skills` com enganação em :128; a farsa de conversa em :449-470 e o "Perguntar ao Ontharyx" preso em :805-807', tipo: 'COMBATENTE (`mutanteHumanoide`, `name` \'Ontharyx Henlifel\'), neutro até a farsa acabar; a conversa é painel (:460-470) que vira luta' },
  rivibiddel: { onde: 'src/game/cripta-talhund.js:143-144 (`makeMonster(\'gnomoDasProfundezas\', P.rivibiddel)`, `name` \'Rivibiddel\', `speedFt` 15, `semReacoes`), neutro; a conversa em :626-640 (`conversaRivibiddel`, aberta por "Falar com o gnomo" em :563), a saída com o grupo em :499 (`rivibiddelFora`)', tipo: 'COMBATENTE neutro (`defId` `gnomoDasProfundezas`, `name` \'Rivibiddel\'); a conversa é painel' },
  zoklork: { onde: 'src/game/encruzilhada.js:64 (`[\'zoklork\', \'xorn\', P.zoklork, \'Zoklork\', \'G14\', false]`), neutro em :130; a conversa em :371-410 (`torreTombada` / `conversaComZoklork`)', tipo: 'COMBATENTE neutro (`defId` `xorn`, `name` \'Zoklork\'); a conversa é painel com Dar as ametistas, Contar que os enroladores morreram, Perguntar sobre a torre, Atacar' },
};

// ----------------------------------------------------------- junção ----
/** Soma os `FATOS_DO_OBELISCO` aos `fatos` de cada ficha de morador (`fichas.toblen`, ...), sem repetir id. Devolve quantos somou por ficha. */
export function somarFatosDoObelisco(fichas) {
  const somados = {};
  for (const [id, fatos] of Object.entries(FATOS_DO_OBELISCO)) {
    if (!fichas[id]) continue;
    const ja = new Set(fichas[id].fatos.map((f) => f.id));
    const novos = fatos.filter((f) => !ja.has(f.id));
    fichas[id].fatos = [...fichas[id].fatos, ...novos];
    somados[id] = novos.length;
  }
  return somados;
}
