# Revisão: manobras do Mestre de Batalha, tabela de surtos e efeitos novos (2026-10-31)

Commits revisados: ff27441, 95ee176, cf14ade, 9395bd6, a92239b, 243ddbe. Nove sub-revisores (sonnet): classes marciais, classes conjuradoras,
motor de combate, recorte, beleza, e os quatro de ícones (legibilidade, fidelidade, conjunto, licença). Correções no commit 43582e9 e seguintes.

## Corrigido (medido antes e depois, com teste em `testes-passivas.mjs`)
- Golpe do Comandante tirava um golpe do guerreiro para sempre (`golpeCedido` nunca zerava): agora zera no começo do turno e se gasta na ação de Ataque seguinte.
- Durações "até o fim do próximo turno" que caíam no fim do mesmo turno: Ataque Desarmante (até o fim do turno do alvo), Provocador, Amedrontador e Presença Feérica (2 contagens),
  surtos Plano Astral e Medo.
- Ataque Fintado: desfaz-se depois de um ataque (errando também) e não cobra o dado de quem está a mais de 1,5 m.
- Ataque Varredura: escolhe o vizinho que a rolagem acertaria, dá o MESMO valor do dado e só vale corpo a corpo.
- Reagrupar recusa aliado caído, inconsciente ou incapacitado.
- Surtos: raios só em inimigos; graxa derruba de fato; onda necrótica cura o que o dano causou; teleporte exige linha de visão; confusão tira a reação na hora;
  `surtoRapidoAte` e `surtoDesvSaveAte` não vazam mais entre combates e descansos; o surto não herda Metamagia nem gasta as Marés do Caos do próprio feiticeiro.
- `surtoFx` entra em `EVENTOS_VISUAIS` (o convidado do coop vê as animações).
- Efeitos: "?" (glifo de texto) saiu da confusão; onda necrótica deitada no chão (altura 3) e mais lenta; surto-caos refeito sem a cor trocada; 5 ícones de manobra refeitos.

## Aceito e declarado
- Desarmante vira desvantagem de ataque; Estratégico não move o aliado na hora; Comandante exige 2+ golpes; Passo Evasivo vale o turno todo.
- Confusão e Polimorfia resumidas; efeitos de mestre (modron, flumphs, unicórnio) e de cor sem regra; um efeito do livro com regra segue sem ela: tamanho (mexe na pegada da figura). Visão de invisíveis, olho, brilho que cega, névoa, reencarnar
  e passo do caos (botão no HUD, ação bônus, 6 m) entraram depois.
- Dobrar a Sorte só cobre ataque e resistência (não teste de atributo de outra criatura), tem alcance de 9 m e só gasta quando muda o resultado.
- Onda necrótica saiu cinza-azulada (a conversão para a paleta do jogo levou o roxo escuro ao cinza) e quase parada; confusão gira pouco.
- Bombardeio de Magia não reconhece o surto "máximo" (dado máximo sem lista de rolagens).

## Custo
OpenArt (Wan 2.7, 2K, 6 créditos por folha): 2 folhas de ícones + 3 de efeitos nesta frente de trabalho, 1 folha de ícones e 1 de efeitos na refação.

## Segunda rodada (surtos novos, efeitos por código)

Revisores: render dos efeitos de chão (duas passadas), direção de arte (duas passadas, nota 2/5 para 3/5), mecânica dos surtos novos e regressões do motor.

Corrigido: Passo do Caos fora da regra de conjuração; tamanho sem empilhar e devolvido na hora; reencarnar com corpo limpo; efeitos de surto limpos no fim do combate e nos descansos; brilho que ilumina; Olho do Caos na Percepção passiva; coop com `surtoFx` (src/view/surto-fx.js); chão copiado casa a casa e no plano do relevo; pixels duros, sem alfa parcial; `willReadFrequently` no canvas de chão (mapa grande).

Aceito: o anel no chão baixo usa o plano do platô quando nasce nele; a lateral vertical do platô não recebe a poça; a nuvem do vaso serve também à ovelha.
