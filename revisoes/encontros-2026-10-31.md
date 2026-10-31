# Encontros táticos — 2026-10-31

Parecer do agente `revisor-encontro-tatico` (somente leitura), com simulação no motor real (`balance.js` e política de herói própria; números dos capítulos 2 a 4 são ordem de grandeza, o grupo simulado não conjura Sono nem usa gargalo).

## Aplicado neste commit
- **Poço da Coruja Velha** (21% de morte de herói no 3º nível): levas de zumbis passam a chegar na rodada 5 e depois a cada 4 (antes 4 e 3). Medido pelo revisor: 89% → 94% de vitória, morte de herói 21% → 9%. `daTorre()` usava 12 e 8 zumbis; o array tem 6, agora usa `ZUMBIS`.
- **Vitrine `grandes`**: a Vinha Infectada saiu do caixote em (7,2) para (8,2).

## Decisões suas (não mexi)
1. **Cume da Wyvern, 3º nível: 52% de vitória, morte de herói 10%, alguém cai em 76%.** Atrasar levas não ajuda (o `lotePendente` as antecipa). Cortar gente ajuda: sem o ogro 62%; alarme só com vigia, A, B, Brughor, D e ogro, 84%. Isso afasta o encontro do livro e do XP (1.600 pago, 1.250 no livro).
2. **Terraço do Castelo com o alarme dos arqueiros:** 86% de vitória e 22% de morte de herói no 3º nível (confiança baixa: posição inicial do revisor era de longe). Opção: hobgoblins na rodada 6, ou um só.
3. **Emboscada sem assimetria:** cobertura do terreno alto vale para os dois lados e os goblins nunca se escondem depois de atirar (0 usos de `esconder` em 200 lutas). Correção possível em `ai.js:250-262`: goblin com Fuga Ágil esconde-se depois de atirar.
4. **Arena da emboscada fácil (98%)** porque os lobos só existem no arena. Variante medida: + goblin D e 2 arqueiros na rodada 3 → 95% de vitória, alguém cai em 37%.
5. **Esconderijo:** quem pula as salas chega a Klarg com o 1º nível: 52% de vitória, 32% de morte de herói. Correção: pagar o XP que falta ao primeiro ataque no covil ou em Klarg.
6. **Comentários velhos** da emboscada (`encounter.js:644-676`, `main.js:586`) falam de 4 goblins e lobos; o código tem 3. Posição do grupo tem duas fontes (`PARTY_SPOTS_EMBOSCADA` e `LUGARES`).

## Conferido, sem achado
Posições da emboscada, visão e alcance; fuga do bando (3 turnos); rua (96% no 2º nível); padrão (91%); posições do esconderijo. Mansão, Árvore Trovão e Onda Eco não simuladas.
