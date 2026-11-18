# Os recursos de subclasse que ficaram sem efeito (2026-11-17)

As tabelas à mão das subclasses dos livros (`rules/classes/subclasses-xge.js`, `-tce.js`, `-scag.js`) dizem, recurso a
recurso, o que o motor faz (`M`) e por que não faz (`S`, o motivo). Eram **42** sem efeito. Relidos um a um contra o que
o jogo ganhou desde que as tabelas foram escritas: **16 entraram**, e ficam **26**.

## Os que entraram

| Recurso | Subclasse | No jogo |
|---|---|---|
| Ouvido para Mentiras | ladino Inquisitivo | na Intuição, 7 ou menos no d20 conta como 8 (na luta, `testeDeAtributo`; fora dela, `rolarPericia`). Vale em todo teste de Intuição |
| Olho para Detalhes | ladino Inquisitivo | ação bônus na luta (o botão na barra): Percepção contra a Furtividade de quem se escondeu (`esconder` passou a guardá-la), e quem é achado deixa de estar escondido. A Investigação de pistas é o verbo Investigar, fora da luta |
| Olhar Firme | ladino Inquisitivo | Percepção e Investigação com vantagem andando no máximo metade do deslocamento (`corridaFt`); fora da luta não há turno, e vale sempre; +5 na Percepção passiva |
| Escaramuçador | ladino Batedor | a reação sai sozinha quando um inimigo termina o turno colado nele (`livro-motor.js escaramucador`, no `endTurn`): até metade do deslocamento, sem ataque de oportunidade, para a casa mais longe dos inimigos. O jogo decide: só com metade dos PV ou menos (o ladino inteiro quer ficar colado para o Ataque Furtivo) |
| Olhos da Sepultura | clérigo da Sepultura | a ação do botão (o molde é o Sentido Divino): os mortos-vivos a 18 m que não estão atrás de cobertura total, no registro; o escondido deixa de estar. Usos pela Sabedoria |
| Consultar os Espíritos | bárbaro do Guardião Ancestral | o Augúrio e a Clarividência no menu de magia fora da luta, sem espaço, uma vez por descanso curto (`utilidade.js podeConjurarFora`, a mesma porta do Elmo do Teletransporte). **O menu de magia fora da luta passou a abrir para quem não conjura** se um item ou uma característica lhe dá magia; e a viagem por magia da região também |
| Consciência Mágica | bárbaro da Magia Selvagem | a ação do botão: quem mantém que magia (com a escola), quem leva item mágico e que zona de magia está a 18 m, no registro. Usos pelo bônus de proficiência |
| Talento Psi-Reforçado | ladino Lâmina da Alma | no teste com CD de fora da luta (`utilidade.js rolarTeste`): o teste treinado que falhou soma um dado psiônico, que só se gasta se passar. Na luta o teste não tem CD sabida |
| Olhar Infalível | ladino Inquisitivo (13º) | a ação do botão: a 9 m, quem está numa forma que não é a dele, o metamorfo, as cópias da Imagem Espelhada, o borrado, a Duplicidade, a zona de ilusão e "há alguém invisível por perto", no registro. **Não desfaz o engano**, como o livro. Usos pela Sabedoria |
| Movimento Telecinético | guerreiro Psiônico | a ação concedida (`magias-concedidas.js movimentoTelecinetico`), na mira de dois pontos dos Ossos da Terra: Ctrl+clique no aliado, Grande ou menor, a até 9 m e à vista, e o clique na casa livre de chegada, a até 9 m dele e à vista. Uma vez por descanso curto; de novo, um dado psiônico. O objeto solto não entra: o tabuleiro não tem objeto solto |
| Detectar Portal | patrulheiro Andarilho do Horizonte | a ação do botão, uma vez por descanso curto: a distância em metros e o rumo do portal planar mais perto. Os portais são dado do mapa (`mapa.portais`, que `campo.js` copia para `field.portais`) ou da cena: o nicho de X16 e as três fendas de Illithinoch, o portal de B1 do Labirinto Salgado (e o segundo, depois da Refração); e o Portal Arcano |
| Andarilho dos Sonhos | druida dos Sonhos (14º) | o descanso curto deixa a Vidência pronta (`descanso.js recuperarNoCurto`), e ela aparece no menu de magia fora da luta, sem espaço, uma vez por descanso longo. O Sonho e o Círculo de Teletransporte, as outras duas do livro, não estão no jogo |
| Mente Manifesta | mago dos Escribas (6º) | a ação bônus concedida põe a mente numa casa a até 18 m (uma vez por descanso longo) ou a move 9 m; ela é uma penumbra de 3 m. Com o interruptor ligado, a magia de mago do turno sai do lugar dela (`combat.js naMente`: o motor troca a posição de quem conjura durante a pergunta, a conjuração e a prévia da área), o bônus de proficiência de vezes por descanso longo. Ficam de fora o teleporte e a reação; a mente some a mais de 90 m e no começo de outra luta |
| Manipulador Perspicaz | ladino Mentor (9º) | no botão direito sobre quem conversa, fora da luta: "Medir a mente" (Inteligência e Sabedoria) e "Medir a presença" (Carisma e níveis de classe), maior, igual ou menor que as do herói, uma vez por criatura e por par (`investigar.js opcoesDoManipulador`). O livro deixa escolher quaisquer duas; aqui são esses dois pares |
| Fala dos Bosques | druida Pastor | vale como um Falar com Animais que nunca acaba (`utilidade.js ativaDe`): o "Falar com o animal" do botão direito e a vantagem em Lidar com Animais. O silvestre não entra |
| Guerreiro dos Deuses | bárbaro Zelote | o jogo não cobra componente material de magia nenhuma, então quem traz o Zelote de volta à vida já não paga o diamante: o recurso já vale, e a tabela passou a dizer isso em vez de dar um motivo |

## Os 26 que ficam, e por quê

São quase todos do que o jogo não tem: idiomas e conversa à distância (Fala Universal, Sussurros Psíquicos, Fala
Telepática, Falante do Vento), disfarce e intriga (Mestre da Intriga, Manto de Sussurros, Alma da Enganação), criar objetos (Performance da Criação, Crescendo Criativo), montaria (Nascido para a Sela),
planos (Mergulho Insondável, os espaços do receptáculo do gênio), o que é
só aparência ou restrição (as Formas do Eu Astral, os Estilos do Cantor da Lâmina, as restrições do Furioso e do Cavaleiro)
e o que pede tela que o jogo não tem (o Desejo Limitado do gênio, a Pena Arcana do Escriba).

Os que ainda caberiam com mais motor: a **Força Antes da Morte** do Samurai (o jogo não tem turno fora da ordem: a vez do herói só vem na do lado dele) e o **Guia da
Tempestade** (o jogo não tem chuva, e o vento da Controlar Ventos não tem direção). Os motivos dos dois últimos foram
reescritos na tabela.

Provas em `testes-subclasses-xge.mjs` (73, 9 novas) e `testes-subclasses-tce.mjs` (51, 4 novas).

## Um achado de fora, no teste das cenas

O teste das cenas no navegador parou a Ânima (`vazioAnima`) em 2 de 3 passadas: os dois profetas de A3 ficavam no pé da
borda de 3 m, fora da vista do grupo lá em cima, e ninguém perdia PV. Era a regra 4 da IA (encostar no alvo quando não
alcança ninguém), que media o caminho até o alvo com a busca crua da grade, sem o voo: para ela, o degrau de dois níveis é
parede, e o ponto mais perto em linha reta era um beco. Hoje ela liga `field.voando` durante a busca, como
`reachableFor` faz. A prova em `testes-regras.mjs` ("quem VOA não para no pé de um degrau") falha sem o conserto (o lobo
voador fica encostado na parede) e passa com ele.
