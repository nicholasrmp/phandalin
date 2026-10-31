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

---

## Atualização 4 — o bruxo (Dádiva do Pacto e Invocações Místicas)

Mais **19 características** com mecânica e teste; 9 passaram a `semEfeito` com o motivo escrito. Suíte: 1059/1059, vitest 401/401, build verde. `pendente` caiu de 39 para **12**.

- **Dádivas do Pacto:** Lâmina (a arma é mágica), Tomo (três truques de qualquer lista), Corrente (Convocar Familiar sempre pronta).
- **Invocações de combate:** Lâmina Sedenta (um ataque a mais), Sorvedor de Vida (+CAR necrótico), Explosão Repelente (empurra 3 m), Lança Mística (alcance de 90 m).
- **Invocações passivas:** Armadura de Sombras (CA 13 + DES), Visão do Diabo (36 m, mágico também), Visão das Bruxas (visão verdadeira a 9 m), Influência Sedutora.
- **Invocações que dão magia, sem espaço:** Vigor Diabólico, Visões Nebulosas, Máscara das Muitas Faces, Visão Mística, Passo Ascendente (à vontade); Ladrão dos Cinco Destinos e Atolar a Mente (uma vez por descanso longo).

### Sem efeito no jogo (a ficha avisa)
Fala com Bestas, Olhar de Duas Mentes, Olhos do Guardião de Runas, Livro dos Segredos Antigos, Sussurros da Sepultura, Escultor de Carne, Mestre das Muitas Formas, Visões de Reinos Distantes, Um com as Sombras.

### Ainda pendente (12)
Forma Selvagem; Arcana Mística e Sobrecanalizar (magias de 6º a 9º círculo); Sussurros Enfeitiçantes, Palavra Terrível, Servos do Caos, Salto Transcendental, Sinal de Mau Agouro, Correntes de Carceri e Voz do Mestre das Correntes (cada uma precisa de uma magia que o jogo não tem); Percepção Primitiva e Habilidade Inigualável.

---

## Atualização 5 — Forma Selvagem (druida)

Mais **3 características** com mecânica: Forma Selvagem, Magias Bestiais e Arquidruida (usos ilimitados). Suíte: 1062/1062, vitest 401/401, build verde; `pendente` caiu de 12 para **11**. Verificado no jogo rodando: um herói com a característica ganha os azulejos de cada fera permitida, vira o Lobo (11 PV, CA 13, golpe "Mordida" na barra) e ganha o azulejo de voltar.

- **Fichas de animal reaproveitadas** das bestas que o jogo já tem (`rules/forma-selvagem.js`, `FERAS`); nenhuma arte nova foi preciso gerar. No 2º nível: ND 1/4 sem voar nem nadar; no 4º: ND 1/2 e nadar; no 8º: ND 1 e voar.
- A fera troca FOR, DES, CON, PV, CA, deslocamento, golpes e traços; INT, SAB, CAR, perícias e resistências ficam do druida.
- Zerar os PV da fera devolve o druida à forma normal, e o dano que sobrou desconta dos PV dele. Voltar por vontade custa a ação bônus.
- Na forma de fera não se conjura, a não ser com Magias Bestiais (18º).

### Aproximações
- A forma acaba quando a luta termina (o livro dá horas); por isso nada fica transformado num save.
- Só as bestas que o jogo tem existem como forma (lobo, rato gigante, javali, urso-negro, cabra gigante, aranha-lobo gigante e, do 8º, urso-pardo, aranha gigante, morcego gigante...).
- A Arquidruida só tem o efeito dos usos ilimitados; ignorar componentes simples não tem onde valer no jogo.
- O bônus de ataque da fera é o do bloco dela, não o do druida.

### Ainda pendente (11)
Arcana Mística e Sobrecanalizar (magias de 6º a 9º círculo); Sussurros Enfeitiçantes, Palavra Terrível, Servos do Caos, Salto Transcendental, Sinal de Mau Agouro, Correntes de Carceri e Voz do Mestre das Correntes (cada uma precisa de uma magia que o jogo não tem); Percepção Primitiva e Habilidade Inigualável.

---

## Atualização 6 — telas de escolha ao subir de nível

O jogo deixava de decidir sozinho o que o livro deixa na mão do jogador. A tela de subir de nível (`view/nivel-tela.js`) agora mostra, já preenchido com o padrão do motor, e deixa trocar:

- **Metamagia** do feiticeiro (2 no 3º, mais uma no 10º e no 17º), com a descrição de cada opção.
- **Dádiva do Pacto** do bruxo (Lâmina, Corrente ou Tomo) e as **Invocações Místicas** novas de cada nível, só as que o pacto e o nível permitem. Trocar o pacto refaz o que dependia dele (truques do Tomo, familiar, magias das invocações) e derruba a invocação que exigia o pacto antigo.
- **Maestria em Magia** (uma de 1º e uma de 2º círculo) e as **duas Magias de Assinatura** do mago, entre as magias que ele conhece.

"Seguir" sem mexer em nada vale o padrão de antes. A escolha repetida volta à sugerida; o que não é opção é descartado (também para o jogador de outra máquina, pela mesma conferência das magias). Verificado no jogo rodando: um feiticeiro de 2º nível subiu ao 3º, trocou Acelerada e Duplicada por Cuidadosa e Sutil, clicou em Seguir e ficou com as duas escolhidas. Suíte: 1066/1066, vitest 401/401, build verde.

Ainda sem tela: a escolha das perícias de Especialização (bardo e ladino), de estilo de luta e de Inimigo Favorito/Explorador Natural, que o motor segue fazendo sozinho.

---

## Atualização 7 — o ícone da poção e o primeiro lote de magias de 4º a 6º círculo

**Ícone da poção de cura.** Vinha de uma folha do OpenArt e estava sujo (o líquido salpicado de pele e madeira, a rolha confusa, um pixel roxo solto). Redesenhei à mão, na paleta do jogo, a **poção de cura** (frasco redondo, brilho no vidro, superfície do líquido, bolhas) e a **poção de cura maior** (frasco comprido). Não gerei nada no OpenArt para isto.

**Magias.** O jogo tinha 7 magias acima do 3º círculo, todas de clérigo e bardo; mago, feiticeiro, bruxo e druida tinham espaços de 4º ao 9º e nada para gastar neles. Entraram **9 magias**, cada uma com teste:

| Círculo | Magia | Quem aprende |
|---|---|---|
| 4º | Tempestade de Gelo, Pele de Pedra, Invisibilidade Maior, Porta Dimensional | mago, feiticeiro (+ druida nas duas primeiras, bardo nas duas últimas, bruxo na Porta) |
| 5º | Cone de Frio, Imobilizar Monstro | mago, feiticeiro (+ bardo e bruxo na segunda) |
| 6º | Corrente de Relâmpagos, Desintegrar, Círculo da Morte | mago, feiticeiro (+ bruxo no Círculo da Morte) |

E o que elas destravaram: **Arcana Mística** (o bruxo de 11º conjura Círculo da Morte uma vez por descanso longo, sem espaço), **Sinal de Mau Agouro** (Rogar Maldição) e **Salto Transcendental** (Salto à vontade). Conferido no jogo rodando: Tempestade de Gelo conjurada por um mago de 9º nível limpou os quatro inimigos da estrada, sem erro no console.

### Aproximações
- Sem ícone próprio: cada magia nova usa o da mais parecida (Raio de Gelo, Passo Nebuloso, Relâmpago...). Um ícone de cada, no OpenArt, é o passo seguinte, se quiser.
- Tempestade de Gelo não deixa o terreno difícil do livro; Porta Dimensional leva só o conjurador; a Corrente de Relâmpagos salta para os mais próximos do primeiro alvo e não pede escolha; Pele de Pedra não cobra o pó de diamante.
- A Arcana Mística só tem magia no 6º círculo (as de 7º a 9º não existem no jogo); Correntes de Carceri continua pendente, porque o livro restringe o uso a celestiais, elementais e corruptores.

Suíte: 1072/1072 em Node, vitest 401/401, build verde. `pendente`: 8 (Sobrecanalizar, Percepção Primitiva, Habilidade Inigualável e as invocações Sussurros Enfeitiçantes, Palavra Terrível, Servos do Caos, Correntes de Carceri e Voz do Mestre das Correntes).

---

## Atualização 8 — segundo lote de magias (4º ao 9º círculo) e Sobrecanalizar

Mais **7 magias**, cada uma com teste, e uma característica; `pendente` caiu para **7**. Suíte: 1078/1078 em Node, vitest 401/401, build verde.

| Círculo | Magia | Quem aprende |
|---|---|---|
| 4º | Muralha de Fogo (zona de 18 m, 5d8 de fogo) | mago, feiticeiro, druida |
| 4º | Banimento (CAR ou some até a concentração acabar) | mago, feiticeiro, bruxo, clérigo, paladino |
| 5º | Nuvem Mortal (zona de 6 m, 5d8 de veneno) | mago, feiticeiro |
| 6º | Cura (70 PV) | clérigo, druida |
| 7º | Dedo da Morte (7d8+30 necrótico) | mago, feiticeiro, bruxo |
| 9º | Palavra de Poder: Matar (≤100 PV morre, sem resistência) | mago, feiticeiro, bruxo, bardo |
| 9º | Chuva de Meteoros (20d6 de fogo + 20d6 de concussão) | mago, feiticeiro |

- **Arcana Mística completa o que o jogo tem:** 6º Círculo da Morte, 7º Dedo da Morte, 9º Palavra de Poder: Matar (o 8º continua sem magia no jogo).
- **Sobrecanalizar** (mago, 14º), como interruptor: o dano da próxima magia de até 5º círculo sai no máximo. O primeiro uso depois do descanso longo é de graça; o segundo custa 2d12 por círculo da magia ao próprio mago, e cada uso depois soma mais 1d12 por círculo.
- Conferido no jogo rodando: Banimento tirou o hobgoblin do tabuleiro, sem erro no console.

### Aproximações
- Todas usam o ícone da magia mais parecida (ainda sem ícone próprio).
- Muralha de Fogo fere só quem está nela (o livro fere também um dos lados); Nuvem Mortal fica parada (a do livro se afasta); Banimento devolve todos no fim (o livro bane de vez quem veio de outro plano); Cura não trata cegueira nem doença; Chuva de Meteoros é um impacto só (o livro tem quatro).
- Sobrecanalizar maximiza a primeira parcela de dano da magia; o dano que ele cobra do mago não ignora resistência, como o livro manda.

### Ainda pendente (7)
Percepção Primitiva e Habilidade Inigualável; e as invocações Sussurros Enfeitiçantes, Palavra Terrível, Servos do Caos, Correntes de Carceri e Voz do Mestre das Correntes (precisam de Compulsão, Confusão, Conjurar Elemental e de uma regra para restringir ao tipo celestial/elemental/corruptor).

---

## Correção — os ícones das 16 magias novas já existiam

Eu afirmei, nas atualizações 7 e 8, que as magias novas usavam "o ícone da magia mais parecida". Estava errado para todas: o catálogo de
ícones do OpenArt (`src/art/icones-magias.js`) cobre o Livro do Jogador inteiro, e 13 das 16 já tinham ícone próprio sob o mesmo id. As três
restantes só estavam com nome diferente (Porta Dimensional → `portaDimensional`, Cura → `curaCompleta`, Nuvem Mortal → `nevoaMortal`) e agora
apontam para ele. Nada foi gerado no OpenArt. Um teste novo exige que toda magia de 4º círculo para cima tenha ícone próprio.

---

## Atualização 9 — as animações próprias das magias novas (OpenArt, com os revisores)

**8 efeitos novos em sprite**, no jogo (`src/art/efeitos.js`, ligados em `src/view/visuals.js`): `banimento-vortice` (Banimento), `porta-dimensional` (Porta Dimensional), `pele-de-pedra` (Pele de Pedra), `correntes-prender` (Imobilizar Monstro), `muralha-de-fogo`, `nuvem-mortal`, `corrente-de-relampagos` e `meteoros` (Chuva de Meteoros). Tempestade de Gelo, Cone de Frio, Círculo da Morte, Dedo da Morte, Palavra de Poder: Matar, Desintegrar, Cura e Invisibilidade Maior reaproveitam os efeitos aprovados (gelo, necrótico, arcano, cura, névoa).

**Como foi feito.** Os dois primeiros pedidos, sem folha de referência (Kling), saíram inúteis: células com cartão escuro, texto, 7 a 8 colunas. O que funcionou foi mandar as folhas já aprovadas do jogo como referência de estilo e de layout (via URL assinada do próprio OpenArt) e pedir o conteúdo linha a linha: **Wan 2.7 Image, 6 créditos por folha**, 2 folhas boas e 2 de refação. Uma folha do GPT Image 2 (42 créditos) foi o ponto de partida do estilo e passou do limite de 15 por página que você fixou depois; as seguintes ficaram todas em 15 ou menos.

**Revisão.** Dois revisores rodaram duas vezes cada (`revisor-magia-recorte` mede em pixel, `revisor-magia-beleza` julga a arte). Na 1ª rodada três efeitos foram reprovados (Pele de Pedra, Correntes, Porta Dimensional) e os cinco outros pediram ajuste: foram regerados e reconvertidos. O conversor ganhou `semFaixas`, `soMaiores` e `esmaecerTopo` por fileira, e as alturas no jogo foram refeitas para a figura assentar no chão. Na 2ª rodada: Banimento e Porta Dimensional 4/5, Correntes 4/5, Nuvem, Relâmpago e Muralha 3,5/5, Meteoros 3/5, Pele de Pedra reprovada como "manequim no lugar da criatura" — por isso virou o anel de pedras que se fecha com clarão dourado.

**Medido no que está no jogo:** nenhum efeito tem cor fora da paleta nem quadro vazio; Banimento, Relâmpago, Porta, Correntes, Muralha e Pele não tocam a borda; Nuvem toca a borda direita em 1 quadro; Meteoros ainda toca topo e esquerda (a cauda do meteoro é cortada pelo quadro; o topo foi dissolvido em pontilhado).

### O que continua fraco
Meteoros (o corte da cauda), Pele de Pedra (é um anel de pedras, não uma casca sobre o corpo) e a Nuvem Mortal (o miolo escuro esconde a criatura). Nenhum deles foi visto em movimento no jogo: a animação dura menos que o intervalo entre um comando meu e a captura de tela, então só o rastro estático da Muralha de Fogo apareceu.

---

## Atualização 10 — o que o revisor-chefe mediu, e as correções grátis

O `revisor-magias` (chefe) mediu os 8 efeitos novos contra os 77 aprovados: lado do quadro igual (mediana 64), ocupação média 31% contra 20% (dentro da faixa já aprovada: dissipar-sigilo 48%, ilusao-veu 46%), 6 dos 8 sem pixel na borda (vários aprovados cortam mais), mesmo contorno. Derrubou três afirmações dos sub-revisores: "os aprovados não têm halo escuro" (a família das sombras tem 41 a 78%), "Correntes e Porta são objeto isolado" (cobrem 31% e 37% do quadro) e "o Relâmpago está cortado" (zero pixel na borda depois da reconversão). Pediu: alturas menores nos efeitos de área, menos cores em Meteoros e Pele de Pedra, base alinhada na Nuvem Mortal, e refazer a Pele de Pedra.

Feito: alturas da Muralha 28→20, Nuvem 34→20 (`sumir` maior) e Correntes 28→22; Meteoros reduzido a 6 cores e Nuvem a 5, com a base alinhada (conversor: `maxCores`, `alinharBase`, `casca`). **Pele de Pedra:** refeita no OpenArt (Wan 2.7, 6 créditos) e o modelo desenhou de novo uma estátua cheia; em vez de gastar outra geração, o conversor esvazia o miolo (`casca`): sobra um traje de pedra rachada com veios dourados e o tronco vazado, o personagem fica à vista. São só 4 quadros e dois pares quase iguais: continua o efeito mais fraco do lote.

**Atualização 10b — Pele de Pedra, nova geração (Wan 2.7, 6 créditos).** Pedi uma aura de estilhaços de pedra, sem corpo nem estátua. O modelo devolveu duas versões: um anel de estilhaços com brilho dourado (limpo) e uma coluna de pedras (descartada: cobriria o personagem). O anel virou o efeito `pele-de-pedra-aura` (6 quadros): os estilhaços giram e se fecham em volta do alvo, e 0,5 s depois entra o traje de pedra vazado. Continua sem ter sido visto em movimento no jogo, e o desenho do anel é regular demais; nenhum revisor viu esta versão.

**Atualização 10c — Pele de Pedra, terceira geração (Wan 2.7, 6 créditos).** Pedido: espiral irregular de estilhaços de tamanhos diferentes, sem anel. Saiu um redemoinho de lajes, lascas e pedrinhas, com brilho dourado, bem mais natural que o anel regular, e substitui o `pele-de-pedra-aura`. O defeito: o modelo repetiu quase o mesmo desenho nos seis quadros, então a "animação" é um redemoinho parado que pisca em dourado (5 quadros: cinza, cinza, dourado, dourado, cinza; o sexto foi cortado na borda direita). Para movimento de verdade seria preciso outra geração pedindo cada quadro com os estilhaços em posições diferentes, ou girar os quadros no código.

## Atualização 11 — Pele de Pedra pelo PixelLab

- Leitura: `doc.md`, skill `pixellab`, `vfx-workbench.md` do Pip. O `/vfx` com o sprite real do herói devolve o próprio sprite virando pedra; sem sprite, o resultado foi fraco (2/5 no revisor de beleza).
- Custo: 2 chamadas `/vfx` lite (~1 geração cada, saldo ~3048). Nenhuma geração no OpenArt.
- No jogo: estado visual `pedra` (tinta cinza-pedra fixa em `estado-visual.js`, enquanto a condição `peleDePedra` vale) + brilho dourado do game pack (`pele-de-pedra`, 10 quadros 33x45) na conjuração. A Fúria continua mandando se as duas valem.
- Não verificado: a animação em movimento no jogo (as capturas não pegam ~1 s de efeito) e o tom da tinta num zoom grande.
- Scripts novos: `src/dev/efeito-pixellab.py`, `src/dev/importar-pixellab-efeito.py` (`--clip whole` importa a peça do pacote).

### 11b — revisão da Pele de Pedra
Recorte: conversão fiel; o brilho do pacote tem só 66 px em 10 quadros (poeira). Beleza: tinta 4/5, brilho 1/5, conjunto 2/5. Aplicado (grátis): tinta 0,55→0,42 (a 0,55 o contraste caía 55%), 5 quadros vazios cortados, lascas cinza (`smash` + `shards`) na conjuração. Pendente (1 geração): casca de granito com ≥300 px no quadro de pico.

### 11c — casca de granito pelo PixelLab: não serviu
Terceira chamada `/vfx` lite (1 geração, saldo ~3047), com o sprite do Brenn e pedido de casca de placas. O clip sem sprite saiu com 303 px em 10 quadros (pedrinhas soltas, sem forma de casca); a peça com sprite só serve ao Brenn. Nada importado. Para uma casca de verdade, o caminho é `artist: pro` (6 a 8 gerações) ou desenhar à mão.

### 11d — casca de granito pelo `/vfx` pro (6 gerações, saldo ~3041)
Efeito de 24 quadros 36x52 (21.815 px). Beleza: 2,5/5 — tem peso e ritmo (cresce dos pés, fecha, racha), mas no pico cobre 77% do herói e 71% dos pixels são o contorno quase preto (lê como golem). Aplicado (grátis): cortados os quadros finais (contorno solto) e os repetidos (24→13), fps 14, lascas aos 0,7 s, tinta mais clara (#b4bcc6, 0,5). Pendente (1 geração): casca vazada, contorno fino, 40–48 px de largura para cobrir escudo e arma.
