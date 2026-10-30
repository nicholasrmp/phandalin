# Heróis contra o livro — 30/10/2026

Medido rodando o motor (`montarHeroi` dos 12 heróis, o catálogo `CARACTERISTICAS`, o registro de botões do `hud.js` e buscas no `combat.js`). Não é opinião: cada número sai de um script.

## Escopo

Contra o **Livro do Jogador (edição de 2014)**, por decisão do dono do projeto — o SRD 5.1 deixou de ser o limite. Com isso, o que falta de subclasses e sub-raças deixa de ser omissão por licença e passa a ser **lacuna**. (O `NOTICE.md` e o `README.md` ainda dizem "SRD 5.1"; vale decidir se eles mudam.)

## Veredito

A **estrutura está certa e a mecânica está pela metade.**

- Os níveis das classes base batem com o livro (Guerreiro conferido nível a nível; o parecer de 24/10 já tinha validado a progressão 1–20). As classes base são as mesmas no livro e no SRD; o que o livro acrescenta são as subclasses.
- Do 1º nível, cada herói traz as características certas da sua classe.
- **Mas só 47 de 173 características (27%) estão marcadas como aplicadas pelo motor.** As outras 126 estão na ficha e sobem de nível. O próprio `caracteristicas.js` declara isso (`motor: true` marca o que o combate aplica).
- **27% é um piso, não o valor exato.** O flag subestima as características *estruturais*: Magia de Pacto (espaços do pacto e recuperação no descanso curto) e Resiliência Dracônica funcionam no motor sem o flag. Em contrapartida, conferi por amostra que o flag **não** erra para o outro lado: 13 características marcadas sem motor, nenhuma consumida pelo código, e a Bênção do Obscuro (Bruxo) é texto de verdade. O número real fica **entre 27% e uns 35%**; eu não medi o resto característica a característica.
- **34 das 126 são ativas** (ação, ação bônus, reação, livre): é o que o jogador espera ver como botão e não vê.
- O que **tem** mecânica tem botão: o `hud.js` registra Retomar o Fôlego, Ação Surpreendente, Fúria, Ataque Descuidado, Expulsar Mortos-Vivos, Preservar a Vida, Destruição Divina, Sentido Divino, Defesa Paciente, Ataque Atordoante, Recuperação Arcana, Ação Ardilosa, Passo do Vento. Não achei mecânica pronta sem botão.

## Raças: o traço racial não chega à ficha

Da raça só entram na criação `pvPorNivel`, `resistencias`, `truques` e `sopro`, mais visão no escuro, porte pequeno e imunidade do elfo ao Sono. A lista `features` de cada herói tem **só** coisas de classe.

Traços do SRD que mudam uma rolagem e **não existem no motor** (busca por mecânica, sem resultado):

| Raça | Traço ausente |
|---|---|
| Halfling | Sorte (re-rolar 1 natural), Corajoso (vantagem contra amedrontado), Agilidade Halfling |
| Meio-orc | Resistência Implacável (cai a 1 PV), Ataques Selvagens (dado extra no crítico) |
| Elfo e meio-elfo | Ancestral Feérico — vantagem contra enfeitiçado (só a imunidade ao Sono existe) |
| Anão | Resiliência Anã — vantagem em resistência contra veneno (só a resistência a dano existe) |
| Gnomo | Esperteza Gnômica — vantagem em INT/SAB/CAR contra magia |

Nota: a Pip (halfling) e o Grask (meio-orc) são justamente quem mais sente.

## Sub-raças dos heróis

Torvik (anão da montanha), Sylwen (elfa da floresta) e Lirra (gnoma da floresta) usam sub-raças do livro. Os traços que as definem — Treino com Armaduras Anão, Máscara da Natureza e Pés Ligeiros, Ilusionista Nato e Falar com Bestas Pequenas — **não estão no motor**, pelo mesmo motivo dos traços da tabela acima: nada de racial além de resistência, truque, visão e PV por nível chega à ficha.

## O que o livro tem e o jogo não tem

| | Livro | Jogo |
|---|---|---|
| **Subclasses** | 40 (2 bárbaro, 2 bardo, 7 clérigo, 2 druida, 3 guerreiro, 3 monge, 3 paladino, 2 patrulheiro, 3 ladino, 2 feiticeiro, 3 bruxo, 8 mago) | **12 com texto e níveis** (uma por classe) + **9 só nomeadas** na criação, **sem mecânica** (6 domínios de clérigo, 2 patronos de bruxo, Magia Selvagem). **19 não existem**: Totêmico, Valor, Círculo da Lua, Mestre de Batalha, Cavaleiro Místico, Sombra, Quatro Elementos, Anciões, Vingança, Senhor das Feras, Assassino, Trapaceiro Arcano e 7 escolas de mago |
| **Magias** | mais de 300, do truque ao 9º círculo | 204 com regra: 27 truques, 62 de 1º, 58 de 2º, 50 de 3º, **3 de 4º, 4 de 5º, nenhuma de 6º a 9º** |
| **Invocações do bruxo** | 32 | 32 (completas como dado) |
| **Metamagias** | 8 | 8 (completas como dado) |
| **Antecedentes** | 13 | 10 em uso nos 12 heróis (faltam Artesão de Guilda, Marinheiro, Órfão) |
| **Talentos** | 42 | 10 "talentos de origem" na criação; não achei escolha de talento no lugar do aumento de atributo ao subir de nível |
| **Criador de personagem** | escolher raça, classe, atributos, antecedente | **não existe**: escolhe-se entre 12 heróis prontos, cada um com raça e classe fixas |
| **Raças e sub-raças** | 9 raças; sub-raças: anão da colina e da montanha, alto elfo, elfo da floresta e drow, halfling pés-leves e robusto, gnomo da floresta e das rochas; mais o humano variante | só as dos 12 heróis. Sem nenhum herói: **drow, halfling robusto, gnomo das rochas e humano variante** |

**Atenção, mistura de edições:** os heróis têm antecedente **e** talento de origem (Vigoroso, Alerta, Habilidoso, Brigão de Taverna, Curandeiro, Artesão, Músico). Talento ligado ao antecedente é do Livro do Jogador de **2024**; as raças meio-orc e meio-elfo e as sub-raças são de **2014**. O jogo está nas duas ao mesmo tempo, e a comparação com "o livro" depende de qual: **decidir antes de mexer em raças e antecedentes**.

As **invocações e metamagias estarem completas como dado não diz nada sobre a mecânica**: a pergunta da seção seguinte vale para elas também.

## Por classe: o que falta de mecânica

> Leia os "X de Y" com a ressalva acima. Bruxo (0 de 10), Druida (1 de 13) e Feiticeiro (1 de 11) parecem os piores, mas parte disso é estrutura que funciona sem o flag (Magia de Pacto, Conjuração). As **ativas sem mecânica** de cada lista, essas sim, são lacunas reais.

### Bárbaro — 6 de 17 com mecânica

**Ativas, sem mecânica (deveriam ter botão):**
- 3º · **Frenesi** (ação bônus) — _Caminho do Berserker_
- 10º · **Presença Intimidante** (ação) — _Caminho do Berserker_
- 14º · **Retaliação** (reação) — _Caminho do Berserker_

**Passivas / fora de combate, só texto:**
- 3º · **Caminho Primitivo** (passiva)
- 6º · **Fúria Irracional** (passiva) — _Caminho do Berserker_
- 7º · **Instinto Selvagem** (passiva)
- 9º · **Crítico Brutal** (passiva)
- 11º · **Fúria Implacável** (passiva)
- 15º · **Fúria Persistente** (passiva)
- 18º · **Poder Indomável** (passiva)
- 20º · **Campeão Primitivo** (passiva)

### Bardo — 3 de 14 com mecânica

**Ativas, sem mecânica (deveriam ter botão):**
- 3º · **Palavras Cortantes** (reação) — _Colégio do Conhecimento_
- 6º · **Contraencanto** (ação)
- 14º · **Perícia Inigualável** (livre) — _Colégio do Conhecimento_

**Passivas / fora de combate, só texto:**
- 2º · **Pau pra Toda Obra** (passiva)
- 2º · **Canção de Descanso** (fora de combate)
- 3º · **Colégio de Bardo** (passiva)
- 3º · **Proficiências Adicionais** (passiva) — _Colégio do Conhecimento_
- 5º · **Fonte de Inspiração** (passiva)
- 6º · **Segredos Mágicos Adicionais** (passiva) — _Colégio do Conhecimento_
- 10º · **Segredos Mágicos** (passiva)
- 20º · **Inspiração Superior** (passiva)

### Bruxo — 0 de 10 com mecânica

**Ativas, sem mecânica (deveriam ter botão):**
- 6º · **Sorte do Próprio Obscuro** (livre) — _O Corruptor_
- 11º · **Arcano Místico** (ação)
- 14º · **Lançar no Inferno** (livre) — _O Corruptor_

**Passivas / fora de combate, só texto:**
- 1º · **Patrono Transcendental** (passiva)
- 1º · **Magia de Pacto** (passiva)
- 1º · **Bênção do Obscuro** (passiva) — _O Corruptor_
- 2º · **Invocações Místicas** (passiva)
- 3º · **Dádiva do Pacto** (passiva)
- 10º · **Resiliência Infernal** (passiva) — _O Corruptor_
- 20º · **Mestre Místico** (fora de combate)

### Clérigo — 6 de 11 com mecânica

**Ativas, sem mecânica (deveriam ter botão):**
- 10º · **Intervenção Divina** (ação)

**Passivas / fora de combate, só texto:**
- 1º · **Domínio Divino** (passiva)
- 6º · **Curandeiro Abençoado** (passiva) — _Domínio da Vida_
- 8º · **Golpe Divino** (passiva) — _Domínio da Vida_
- 17º · **Cura Suprema** (passiva) — _Domínio da Vida_

### Druida — 1 de 13 com mecânica

**Ativas, sem mecânica (deveriam ter botão):**
- 2º · **Forma Selvagem** (ação)

**Passivas / fora de combate, só texto:**
- 1º · **Druídico** (fora de combate)
- 2º · **Círculo Druídico** (passiva)
- 2º · **Truque Adicional** (passiva) — _Círculo da Terra_
- 2º · **Recuperação Natural** (fora de combate) — _Círculo da Terra_
- 2º · **Magias do Círculo** (passiva) — _Círculo da Terra_
- 6º · **Passo da Terra** (passiva) — _Círculo da Terra_
- 10º · **Proteção da Natureza** (passiva) — _Círculo da Terra_
- 14º · **Santuário da Natureza** (passiva) — _Círculo da Terra_
- 18º · **Corpo Atemporal** (fora de combate)
- 18º · **Magias Bestiais** (passiva)
- 20º · **Arquidruida** (passiva)

### Feiticeiro — 1 de 11 com mecânica

**Ativas, sem mecânica (deveriam ter botão):**
- 2º · **Fonte de Magia** (ação bônus)
- 6º · **Afinidade Elemental** (livre) — _Linhagem Dracônica_
- 14º · **Asas de Dragão** (ação bônus) — _Linhagem Dracônica_
- 18º · **Presença Dracônica** (ação) — _Linhagem Dracônica_

**Passivas / fora de combate, só texto:**
- 1º · **Origem Feiticeira** (passiva)
- 1º · **Ancestral Dracônico** (passiva) — _Linhagem Dracônica_
- 1º · **Resiliência Dracônica** (passiva) — _Linhagem Dracônica_
- 2º · **Pontos de Feitiçaria** (passiva)
- 3º · **Metamagia** (passiva)
- 20º · **Restauração Feiticeira** (fora de combate)

### Guerreiro — 4 de 11 com mecânica

**Ativas, sem mecânica (deveriam ter botão):**
- 9º · **Indomável** (livre)

**Passivas / fora de combate, só texto:**
- 3º · **Arquétipo Marcial** (passiva)
- 3º · **Crítico Aprimorado** (passiva) — _Campeão_
- 7º · **Atleta Notável** (passiva) — _Campeão_
- 10º · **Estilo de Luta Adicional** (passiva) — _Campeão_
- 15º · **Crítico Superior** (passiva) — _Campeão_
- 18º · **Sobrevivente** (passiva) — _Campeão_

### Ladino — 4 de 17 com mecânica

**Ativas, sem mecânica (deveriam ter botão):**
- 3º · **Mãos Rápidas** (ação bônus) — _Ladrão_
- 20º · **Golpe de Sorte** (livre)

**Passivas / fora de combate, só texto:**
- 1º · **Gíria dos Ladrões** (fora de combate)
- 3º · **Arquétipo de Ladino** (passiva)
- 3º · **Trabalho no Segundo Andar** (passiva) — _Ladrão_
- 7º · **Evasão** (passiva)
- 9º · **Furtividade Suprema** (passiva) — _Ladrão_
- 11º · **Talento Confiável** (passiva)
- 13º · **Usar Dispositivo Mágico** (passiva) — _Ladrão_
- 14º · **Sentido Cego** (passiva)
- 15º · **Mente Escorregadia** (passiva)
- 17º · **Reflexos de Ladrão** (passiva) — _Ladrão_
- 18º · **Elusivo** (passiva)

### Mago — 3 de 10 com mecânica

**Ativas, sem mecânica (deveriam ter botão):**
- 14º · **Sobrecarga** (livre) — _Escola de Evocação_

**Passivas / fora de combate, só texto:**
- 2º · **Tradição Arcana** (passiva)
- 2º · **Especialista em Evocação** (fora de combate) — _Escola de Evocação_
- 6º · **Truque Potente** (passiva) — _Escola de Evocação_
- 10º · **Evocação Fortalecida** (passiva) — _Escola de Evocação_
- 18º · **Domínio de Magia** (passiva)
- 20º · **Magias de Assinatura** (passiva)

### Monge — 9 de 25 com mecânica

**Ativas, sem mecânica (deveriam ter botão):**
- 3º · **Desviar Projéteis** (reação)
- 4º · **Queda Lenta** (reação)
- 6º · **Integridade do Corpo** (ação) — _Caminho da Mão Aberta_
- 7º · **Mente Tranquila** (ação)
- 17º · **Palma Trêmula** (ação) — _Caminho da Mão Aberta_
- 18º · **Corpo Vazio** (ação)

**Passivas / fora de combate, só texto:**
- 3º · **Tradição Monástica** (passiva)
- 3º · **Técnica da Mão Aberta** (passiva) — _Caminho da Mão Aberta_
- 6º · **Golpes de Ki** (passiva)
- 7º · **Evasão** (passiva)
- 10º · **Pureza do Corpo** (passiva)
- 11º · **Tranquilidade** (fora de combate) — _Caminho da Mão Aberta_
- 13º · **Língua do Sol e da Lua** (fora de combate)
- 14º · **Alma de Diamante** (passiva)
- 15º · **Corpo Atemporal** (fora de combate)
- 20º · **Perfeição** (passiva)

### Paladino — 7 de 18 com mecânica

**Ativas, sem mecânica (deveriam ter botão):**
- 3º · **Arma Sagrada** (ação) — _Juramento de Devoção_
- 3º · **Expulsar o Profano** (ação) — _Juramento de Devoção_
- 14º · **Toque Purificador** (ação)
- 20º · **Halo Sagrado** (ação) — _Juramento de Devoção_

**Passivas / fora de combate, só texto:**
- 3º · **Saúde Divina** (passiva)
- 3º · **Juramento Sagrado** (passiva)
- 6º · **Aura de Proteção** (passiva)
- 7º · **Aura de Devoção** (passiva) — _Juramento de Devoção_
- 10º · **Aura de Coragem** (passiva)
- 11º · **Destruição Divina Aprimorada** (passiva)
- 15º · **Pureza de Espírito** (passiva) — _Juramento de Devoção_

### Patrulheiro — 3 de 16 com mecânica

**Ativas, sem mecânica (deveriam ter botão):**
- 3º · **Consciência Primitiva** (ação)
- 11º · **Ataque Múltiplo** (ação) — _Caçador_
- 14º · **Desaparecer** (ação bônus)
- 15º · **Defesa Superior do Caçador** (reação) — _Caçador_
- 20º · **Matador de Inimigos** (livre)

**Passivas / fora de combate, só texto:**
- 1º · **Inimigo Favorito** (passiva)
- 1º · **Explorador Natural** (fora de combate)
- 3º · **Arquétipo de Patrulheiro** (passiva)
- 3º · **Presa do Caçador** (passiva) — _Caçador_
- 7º · **Táticas Defensivas** (passiva) — _Caçador_
- 8º · **Passo da Terra** (passiva)
- 10º · **Esconder-se à Plena Vista** (fora de combate)
- 18º · **Sentidos Selvagens** (passiva)


## Prioridade sugerida (impacto no jogo, custo de motor)

1. **Fúria Implacável, Crítico Brutal e Evasão** — passivas de combate, baratas de ligar. Evasão está sem motor no Ladino e no Monge (e no Patrulheiro, como opção).
2. **Traços raciais que mexem em rolagem** — Sorte, Resistência Implacável, Ataques Selvagens, Ancestral Feérico, Resiliência Anã. São 8 traços, um por mecânica, e fecham o buraco dos heróis halfling e meio-orc.
3. **Forma Selvagem (Druida, 2º nível)** — é a assinatura da classe e não existe. Custo alto: precisa de blocos de fera e troca de ficha.
4. **Pontos de Feitiçaria e Metamagia (Feiticeiro, 2º nível)** — o recurso que define a classe.
5. **Monge** — 6 ativas sem motor (Desviar Projéteis, Queda Suave, Quietude da Mente, Corpo Pleno, Palma Vibrante, Corpo Vazio): é a classe com mais ativas sem botão.
6. **Ranger e Paladino de nível alto** — o jogo começa no 1º nível; fica para depois.
7. **Subclasses do livro** — 19 não existem e 9 são só nome. O ganho de jogo é grande (Mestre de Batalha, Totêmico, Círculo da Lua, Assassino), mas só vale depois do item 3 e do 4: uma subclasse nova em cima de uma classe cujas características são texto duplica o problema.
8. **Magias de 4º a 9º círculo** — 7 de 4º/5º e nenhuma acima; só pesa quando o grupo passar do 7º nível.
9. **Criador de personagem** — decisão de produto, não de motor: hoje são 12 heróis prontos.

## Como esta medida foi feita

`montarHeroi` para os 12; `CLASSES` + `CARACTERISTICAS` para cruzar cada id de `niveis` (classe e subclasse) com `motor: true`; busca por mecânica no `combat.js` e no `conditions.js` para os traços raciais; registro `feats` do `hud.js` para os botões. O flag `motor` foi conferido por amostra contra o código (13 características marcadas sem motor, nenhuma consumida): está acertado.

---

## Atualização — passivas e traços raciais (PHB 2014), depois da implementação

Medido com `node --import ./src/dev/cena-node/register.mjs src/dev/testes-passivas.mjs` (93 testes, cada passiva com controle negativo)
e a suíte inteira: **1031/1031 em Node, 401/401 no vitest, build verde.** A ficha foi aberta no jogo rodando (Brenn, anão):
lista os 11 traços e características dele, com o aviso nos que o jogo não modela.

### O que passou a funcionar

- **Raças como dado** (`rules/racas.js`): 15 raças e sub-raças, 40 traços, aplicados na criação (atributos, deslocamento, visão no
  escuro, perícias, armas, armaduras, resistências, truques, +1 PV por nível do anão, Sopro do draconato).
- **Defeito antigo corrigido:** a criação gravava `resistances` e o motor lê `resist`, então **nenhuma resistência racial valia**.
- **Sopro do Draconato** como ação com mira (as 10 cores; cone ou linha como no livro; CD de 8 + CON + proficiência; 2d6 a 5d6; um
  uso por descanso curto). A Dara estava com linha: o vermelho é cone.
- **Sorte, Corajoso, Ancestral Feérico, Resiliência Anã/Robusta, Esperteza Gnômica, Vontade de Aço** (vantagens contra o que o
  livro diz, só contra isso), **Agilidade Halfling**, **Resistência Implacável**, **Ataque Selvagem**, **Transe** (vigia até 4 h),
  **Legado Infernal e magias da Drow** (uso livre uma vez por descanso longo).
- **Classes:** Crítico Aprimorado/Superior, Brutal, Fúria Implacável e Persistente, Aura de Proteção/Coragem/Devoção, Pureza de
  Espírito/Corpo, Evasão, Esquiva Sobrenatural, Alma de Diamante, Mente Escorregadia, Elusivo, Talento Confiável, Pau pra Toda Obra,
  Ki reforçado, Golpe Divino, Destruição Divina Aprimorada, Matador de Colossos/Gigantes, Quebra-Hordas, Escapar da Horda, Defesa
  contra Multiataque, Canção de Descanso, Fonte de Inspiração, Inspiração Superior, Recuperação Natural, Restauração Feiticeira
  (pronta para quando houver pontos), Tranquilidade, Mestre Místico, Maestria e Assinaturas do mago, Truque Potente, Evocação
  Potencializada, Afinidade Elemental, Bênção do Obscuro, Resiliência Infernal.
- **Esta rodada:** Segredos Mágicos (bardo 10º/14º/18º e Conhecimento 6º: duas magias de qualquer lista, tiradas do total),
  Passo da Terra (mato do mapa não atrasa; vantagem contra plantas mágicas), Santuário da Natureza, **Técnica da Mão Aberta**
  (derrubar, empurrar ou tirar a reação; três botões da Rajada), Reflexos de Ladrão, Trabalho de Andar de Cima, Furtividade
  Suprema, **Explorador Natural** e **Inimigo Favorito** (o terreno da paisagem e o tipo do rastro entram nos testes; Corin escolheu
  goblinoides e mata), Matador de Inimigos, **Indomável**.
- **A ficha** lista agora TODAS as características do herói (classe, subclasse e raça) e diz o estado de cada uma.

### Limites assumidos (nada disto finge funcionar)

- **O jogo não modela, e a ficha avisa:** idiomas (Druídico, Gíria de Ladrões, Língua do Sol e da Lua), doença (Saúde Divina),
  Corpo Atemporal, Usar Dispositivo Mágico (não há sintonização), Saber de Evocação, Esconder-se à Vista de Todos, Visão às Cegas.
- **Aproximações:** Reflexos de Ladrão dá o segundo turno logo depois do primeiro (a iniciativa é por lado, não por criatura);
  Instinto Selvagem vale para o lado inteiro; Indomável gasta o uso sozinho na primeira falha; Resiliência Infernal escolhe o tipo
  que mais machucou, sem tela; Maestria e Assinaturas do mago são escolhidas por padrão; Santuário da Natureza dura a campanha
  e não 24 h; a Sensibilidade à Luz Solar do drow ainda não tem regra (não há mapa com sol).
- **Decisão sua pendente (2014 × 2024):** o jogo mistura as duas edições. Raças e sub-raças são do 2014; o **antecedente com talento
  de origem** (Vigoroso, Alerta, Habilidoso, Brigão de Taverna, Curandeiro, Artesão, Músico) é do 2024. Não removi nada.

### O que ainda falta (77 características marcadas `pendente` no catálogo)

São, quase todas, **ações ativas**, não passivas: Frenesi, Presença Intimidadora, Retaliação, Contracanto, Palavras Cortantes,
Intervenção Divina, Defletir Projéteis, Queda Lenta, Quietude da Mente, Corpo Vazio, Integridade do Corpo, Palma Vibrante, Toque
Purificador, Arma Sagrada, Expulsar os Profanos, Nimbo Sagrado, Percepção Primitiva, Sumir, Saraivada, Ataque Giratório, Defesa
Contra a Maré, Golpe de Sorte, Mãos Rápidas, Asas de Dragão, Presença Dracônica, Arcana Mística, Sorte do Obscuro, Lançar pelo
Inferno, Sobrecanalizar.

Dependem de **sistemas que não existem**: Forma Selvagem (e Magias Bestiais, Arquidruida), Pontos de Feitiçaria, Fonte de Magia e
as oito Metamagias, Invocações Místicas (25) e Dádiva do Pacto. Nenhum deles é uma passiva; cada um é uma frente de trabalho.
Faltam ainda 19 das 40 subclasses do livro e as magias de 4º a 9º círculo.

---

## Atualização 2 — ações ativas (depois do commit 65297a0)

Mais **24 características** passaram de `pendente` a `motor`, cada uma com teste e controle negativo
(`testes-passivas.mjs`: 113 testes; suíte inteira 1051/1051, vitest 401/401, build verde):

- **Bárbaro (Berserker):** Frenesi (ataque como ação bônus; 1 nível de exaustão quando a fúria acaba), Presença Intimidadora, Retaliação (reação automática).
- **Bardo:** Contracanto (vantagem de grupo contra medo e encantamento), Palavras Cortantes (reação automática: só gasta a Inspiração se o dado transforma o acerto em erro).
- **Clérigo e paladino:** Intervenção Divina (d100; atendida cura o grupo, o deus se cala 7 dias), Arma Sagrada, Expulsar os Profanos, Nimbo Sagrado (10 radiante por turno; vantagem contra magia de corruptor e morto-vivo), Toque Purificador.
- **Monge:** Defletir Projéteis (e devolver com 1 ki), Queda Lenta (inclusive nas quedas dos capítulos), Quietude da Mente, Integridade do Corpo, Corpo Vazio, Palma Vibrante (armar, marcar, encerrar).
- **Patrulheiro e ladino:** Saraivada, Ataque Giratório, Defesa Contra a Maré, Sumir, Mãos Rápidas, Golpe de Sorte; e **esconder-se em luta** (Ação Ardilosa ganhou o terceiro modo, que o jogo não tinha).
- **Bruxo do Corruptor:** Sorte do Obscuro, Lançar pelo Inferno.

### Aproximações novas (dizem-se na ficha e aqui)
- Esconder-se exige cobertura contra todo inimigo que vê o herói e Furtividade acima da maior Percepção passiva.
- Intervenção Divina: o "efeito do mestre" é a cura total do grupo e o fim dos efeitos de magia.
- Lançar pelo Inferno dá o dano psíquico; o sumiço do alvo até o fim do turno seguinte não é modelado.
- Golpe de Sorte vale para o ataque; o teste de atributo não tem CD que dê para salvar no jogo.
- Sumir não tem onde "não deixar rastro": a luta não rastreia.

### O que continua `pendente` (54, caiu de 77)
Todas dependem de sistema que o jogo não tem: **Forma Selvagem** (e Magias Bestiais, Arquidruida), **Pontos de Feitiçaria, Fonte de Magia e as oito Metamagias** (e Presença/Asas Dracônicas, Restauração Feiticeira), **Invocações Místicas** (25) e **Dádiva do Pacto**; além de **Arcana Mística** e **Sobrecanalizar** (precisam de magias de 6º a 9º círculo, que o jogo não tem), Percepção Primitiva e Habilidade Inigualável.

---

## Atualização 3 — o feiticeiro (Pontos de Feitiçaria, Metamagia, Linhagem Dracônica)

Mais **15 características** com mecânica, teste e botão. Suíte: 1055/1055 em Node, 401/401 no vitest, build verde; `pendente` caiu de 54 para 39.

- **Fonte de Magia:** espaço em pontos (o menor espaço que houver, pontos iguais ao círculo) e pontos em espaço (o maior até o 5º que os pontos pagam; 1º 2, 2º 3, 3º 5, 4º 6, 5º 7). Dois botões, ação bônus.
- **Metamagia, as oito do livro**, como interruptores: armada, vale na próxima magia que servir e que os pontos pagarem.
  Cuidadosa (CAR criaturas passam sozinhas e não sofrem nem a metade do dano), À Distância, Potencializada (rerrola até CAR dados baixos), Prolongada (dobra efeitos e o limite da concentração), Elevada (1ª resistência com desvantagem), Rápida (ação vira ação bônus), Sutil (ninguém contraria) e Gêmea (segundo alvo, custo = círculo, sem espaço extra).
- **Linhagem Dracônica:** Asas Dracônicas (voo, sem armadura, uma vez por descanso longo) e Presença Dracônica (5 pontos, inimigos a 18 m testam SAB ou ficam enfeitiçados).
- **Restauração Feiticeira** (20º) agora tem pontos para restaurar.

### Aproximações novas
- A escolha de metamagia continua automática (as duas primeiras da lista); não há tela de escolha.
- A Gêmea não vale para magia de concentração nem de área; o segundo alvo é o mais próximo do mesmo lado do primeiro.
- Os espaços criados pela Fonte de Magia não somem no descanso longo como no livro: o descanso reajusta tudo ao máximo.
- A Presença Dracônica não pede concentração e só enfeitiça (o livro deixa escolher amedrontar).

### Ainda pendente (39)
Forma Selvagem (e Magias Bestiais, Arquidruida), Invocações Místicas (25) e Dádiva do Pacto, Arcana Mística e Sobrecanalizar (magias de 6º a 9º círculo), Percepção Primitiva e Habilidade Inigualável.
