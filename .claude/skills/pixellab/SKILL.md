---
name: pixellab
description: Use ao gerar arte com a API do PixelLab (pixel art generation, sprite sheet, ladrilho, tileset, kit de construção, objeto de cenário, animação de personagem, herói de 8 direções, editar quadros) ou ao escolher rota, estimar geração gasta e medir o aceite do resultado no Phandalin.
---

# PixelLab no Phandalin

Resumo operacional. A API inteira (todo endpoint, todo parâmetro, limites e formas de resposta) está em
[referencia.md](referencia.md), gerada do OpenAPI oficial. Base `https://api.pixellab.ai/v2`.
Tudo aqui vem do spec ou foi MEDIDO neste repositório; o que ninguém mediu está marcado **desconhecido**.

## Regras de ouro

1. **Toda geração gasta saldo.** Todo script do projeto é seco por padrão: sem `--go` só imprime o plano e o saldo.
   Rode seco primeiro, mostre o plano, só então `--go`.
2. **Token**: só em variável de ambiente `PIXELLAB_TOKEN`, passada INLINE na linha de comando, nunca gravada em arquivo
   (nem `.env`, nem `.sh`, nem log, nem JSON de configuração, nem commit):
   - bash: `PIXELLAB_TOKEN=<token> python src/dev/ladrilhos-pro.py --conjunto chao --go`
   - PowerShell: `$env:PIXELLAB_TOKEN="<token>"; python src/dev/...` (vale só para aquela sessão do shell)
   Os scripts leem `os.environ['PIXELLAB_TOKEN']` e abortam sem ele. Se o usuário não deu o token, peça; não procure em disco.
3. **Conferir o saldo antes e depois**: `GET /balance` → `subscription.generations` e `.total` (também há `credits.usd`).
   Os scripts imprimem "gastou N". Em sessões paralelas o delta mistura gastos de outras sessões.
4. **Reusar script, não reescrever.** Veja a tabela de scripts abaixo. Cada um já faz plano, POST, espera, baixa e mede.
5. **Baixar do CDN com `User-Agent: Mozilla/5.0`**: o CDN responde 403 ao UA padrão do Python (não é autenticação).
   Arquivos baixados vão para `_referencias/pixellab/...` (fora do código), nunca para perto de `src/`.
6. **Assíncrono**: POST devolve id; consulte `GET /background-jobs/{id}` ou o GET da família (`/tiles-pro/{id}`,
   `/objects/{id}`, `/characters/{id}`...). **HTTP 423 = ainda gerando, não é erro.** 429 = fila de jobs cheia (espere e repita;
   não custa nada, a geração só é debitada quando o job roda). `--buscar ID` nos scripts rebaixa um pedido já feito sem gastar.
7. **Não ampliar nem reduzir pixel art.** Entra 1:1 no motor. Arte ampliada que vá como referência: `POST /unzoom` antes.

## Geometria fixa do motor (não negociável)

Lida de `board.js` e `src/dev/losango.py` (`TW, TH, LIFT, no_losango, recortar_topo`):

| item | valor |
|---|---|
| TW x TH | 64 x 32 (losango 2:1, passo de tela (32,16) por casa) |
| LIFT | 22 px por nível de elevação |
| `tile_type` | `isometric`, `tile_size: 64` |
| `tile_view_angle` | **30** (seno 0,5 = 2:1). `tile_height` só define a LONA; sem o ângulo o losango sai 64x22 |
| `tile_height` | 32 para chão chato; 64 para blocos/kits com face lateral |
| `tile_flat_top_px` | **4** (ponta de 4 px = fileira 0 da partição exata de `losango.py`) |
| `tile_depth_ratio` | 0 para chão (o motor pinta a lateral); **0.6875** para blocos de parede (= 22 px = 1 LIFT) |
| `outline_mode` | **`segmentation`** (zonas de cor, sem contorno: contorno por ladrilho vira grade preta no mapa) |
| `target_palette` | `{"colors": ["#rrggbb", ...]}` quando a leva precisa de paleta travada (parede, objetos) |

Câmera/escala de personagem: figuras de 38 a 65 px (halfling 42, goblin 46, humano 61, draconata 65); árvore alta ~3,5 a 4x o personagem.

## Qual rota para qual trabalho

| Trabalho | Rota | Notas medidas |
|---|---|---|
| Variações de CHÃO (grama, estrada, laje, água) | `POST /create-tiles-pro` (sem `tile_feature`), descrição numerada "1). ... 2). ..." | Sempre devolve 16 ladrilhos; ~10 gerações pedindo 1 ou 8 variações (medido). Variações da mesma leva saem do mesmo "pintor" |
| Blocos de parede com face lateral | `create-tiles-pro` + `tile_depth_ratio 0.6875`, `tile_height 64` + paleta | `montar-faces.py` fatia a faixa de 22 px por face |
| KIT DE CONSTRUÇÃO (chão, paredes que emendam, portas, pilar, escada) | `create-tiles-pro` com `tile_feature: "building"`, `building_layout: grid`, `building_wall_tiles` 1-3, `building_wall/floor/floor2_description` | Devolveu 58 peças + `tile_rules` (encaixe), **25 gerações** (usage medido) |
| Transição de terreno (Wang 16 cantos) | `create-tiles-pro` `tile_feature: "tileset"` ou `POST /create-tileset` (16x16/32x32; 64 só `mode=pro`) | Wang: seleciona-se por `pattern_4x4`. Não usado no jogo ainda |
| Estrada autotile | `create-tiles-pro` `tile_feature: "roads"` (18 configs) | Não usado no jogo; custo **desconhecido** |
| UM ladrilho isométrico | `POST /create-isometric-tile` | Legado neste projeto: cada chamada = um pintor, quatro gramas saem com quatro luzes. Custo por chamada **desconhecido** (o script imprime `usage`) |
| Objeto de cenário QUASE SIMÉTRICO (árvore, arbusto, pedra, móvel de 1 casa, fogueira) | `POST /create-1-direction-object` com `item_descriptions` | `size` 16-256; 10-25 gerações por chamada (spec); rende 64 candidatos até 32 px, 16 a 84 px, 4 a 168 px. **Não aceita `seed`** (422) nem `size` junto de `style_images` |
| Objeto ASSIMÉTRICO que gira com a câmera (carroça, cavalo, casa, altar, tenda) | `POST /create-object-pro-flash`, `n_directions: 8`, `view: low top-down` | Estimado em 8 gerações (6 primeira imagem + 2 rotações; `GET /pro-flash/cost`); deltas de saldo observados 13 e 25 (pode incluir outras sessões). Paleta sem `smart` (422 em multi-direção) |
| Objeto de 8 direções (alternativa) | `POST /create-8-direction-object` | `size` 24-168; 10-25 gerações (spec). Não usado no repo |
| Estilo herdado de objeto já aprovado | `style_images` (base64 `{type,format,base64}`) na 1-direção; `style_object_id` na 8-direções | O tamanho sai da imagem de estilo |
| HERÓI/criatura de 8 direções | `POST /create-character-v3` (de zero ou com `reference_image` sul) ou `create-character-pro` (`method`, `style_character_id`) | v3 de referência: `ceil(w*h*8/65536)`; Pro 10-25. Quadro múltiplo de 4. `style_character_id` mantém a família coerente |
| Variante do mesmo herói (outra arma/armadura) com 8 vistas | `POST /create-character-state` | CARO: duas edições derrubaram ~80. Preferir `edit-animation-v2` |
| Animar personagem existente | `POST /characters/animations` (`mode`: `template` 1 ger/dir, `v3` default, `pixminimax`, `pro` legado) | Um JOB por direção. Fila ~20 jobs simultâneos (Tier 3). Ver "Animação" abaixo |
| Trocar arma/armadura mantendo a pose | `POST /edit-animation-v2` (até 9 quadros de 65-80 px, 16 até 64 px, 4 acima de 80) | 10 gerações por pedido (declarado); `editar-quadros.py` |
| Animar uma imagem solta | `POST /animate-with-text-v3` (≤256 px, `w*h*frames ≤ 524288`) | Tipicamente 30-180 s |
| Animar por esqueleto | `POST /estimate-skeleton` (0,1 ger) + `/animate-with-skeleton-v3` (2-4 ger, 3-15 quadros) | Mantém identidade melhor que v3; não usado no repo |
| Imagem solta | `/create-image-pixen` (rápido), `/generate-image-v2` (Pro), `/create-image-pro-flash` (5 ger) | Ícones do jogo vêm de conversão, ver `icones_*.py` |
| Foto/render → pixel art | `/image-to-pixelart-pro-flash` (6 ger), `/image-to-pixelart-pro`, ou `pixelizar.py` (grátis, local) | |
| Limpeza: recorte de fundo, paleta única, regrilha | `/remove-background`, `/reduce-colors` (várias imagens = UMA paleta), `/correct-pixelart`, `/unzoom`, `/normal-map`, `/resize` | Custos: `/reduce-colors` etc. **desconhecidos** no spec; normal-map 0,1/0,5 |
| Efeitos (explosão, aura, golpe) | `POST /vfx` | lite 1 ger, pro 6+; ver referência |
| Retrato, fala, fonte, UI | `/portrait-character-pro`, `/vocal-animation`, `/generate-font-pro` (15 ger), `/generate-ui-v2` | Não usados no repo; `talking-gif` e `lip-sync` são grátis |
| Mapa-objeto temporário | `POST /map-objects` | Apaga sozinho em 8 h; não usar para arte final |

Custo grátis por reskin: recolor por paleta em Python (`recolorir.py`, `reskins-*.py`) NÃO gasta geração; item mágico =
reskin da base.

## Custo observado neste repositório (em gerações)

| Operação | Custo |
|---|---|
| tiles-pro, 16 ladrilhos de chão | ~10 |
| tiles-pro, kit de construção (`building`) | 25 |
| 1-direção, 16 candidatos a 84 px | 25 (arbusto) |
| 1-direção pedra (64 cand.) / árvore alta 4 cand. a 168 px | 44 / 74 no delta de saldo (spec: 10-25; delta pode incluir outras sessões) |
| Pro Flash objeto, 8 vistas | 8 estimado; 13 e 25 em deltas |
| `edit-animation-v2` | 10 por pedido |
| `characters/animations` template | 1 por direção |
| `pixminimax` 64x64, 8 quadros | 1 por direção |
| Animar 6 poses de um guerreiro (walk, attack, hurt em 8 dir + down, sleep, dead em 1) | 27 planejado (hurt acabou não gerado) |
| Herói completo (corpo + posturas + armaduras + armas) | ~430 a ~610 (Brenn 600, Pip 610, Torvik 600, Corin 430, Ilvan 80) |
| Saldo no início do trabalho dos objetos | ~9.800 gerações |

## Aceite medido (rodar em TODO candidato antes de aprovar)

**Objeto de cenário** (`medir()` em `objetos-pixellab.py`):
1. `alfa_parcial == 0` (qualquer pixel com 0 < alfa < 255 vira halo sobre o chão escuro);
2. `borda = perímetro / raiz(área) <= 24` (arte nativa dá ~7 a 20; arte reduzida de ilustração deu 34);
3. **sem chão nem sombra pintados** nas linhas de baixo (peça `no ground, no cast shadow`, `transparent background`);
4. luminância mediana e nº de cores batendo com a paleta pedida (copa/colmo mais escuros que a estrada).

**Ladrilho de chão** (`medir()` em `ladrilho-pixellab.py`, `losango.py`):
1. losango de 64x32 cabendo exato, sem vazar acima (`vazou_acima == 0`); cobertura do topo ~100%;
2. `alfa_parcial == 0` (alfa meio = costura entre vizinhos);
3. emenda pela PARTIÇÃO EXATA `no_losango` (fileiras crescem 4,8..64 e voltam 60..0; área 1024): zero buraco, zero sobreposição num remendo 8x8;
4. conteúdo: variações sem feição marcante (uma feição repetida vira papel de parede); detalhes no INTERIOR, nunca na borda.

**Personagem/animação** (`importar-pixellab.py`, `medir_folha.py`, skill `sprite-phandalin`): mesma criatura entre células
(altura ±10%, massa ±15%), estados distintos (>3% da célula), paleta unificada no importador, sem inventar cauda/escudo
sumido; conferir cada fileira `walk` depois de animar (com fila cheia o PixelLab aceita só parte das direções).

## Armadilhas aprendidas

- `tile_height` não achata o losango; o ângulo (30) sim. Pedir altura E ângulo.
- Variações pedidas separadas = pintores diferentes. Peça a família inteira numa chamada só (descrição numerada ou `item_descriptions`).
- Não misture árvore, arbusto e pedra numa chamada: cada candidato enche a tela e o arbusto sai do tamanho da árvore. Arbusto e pedra herdam estilo da árvore escolhida via `style_images` (então sem `size`).
- 1-direção recusa `seed`; Pro Flash e tiles-pro aceitam. `smart` na paleta é recusado em objeto de várias direções.
- Arma de herói: pedir JÁ DESENHADA com textura na edição; nunca verde puro para recolorir (rejeitado pelo dono).
- Animações podem inventar cauda no draconato e perder o escudo no ataque v3 (v3 redesenha a cada quadro): revisar e corrigir por `editar-quadros.py`, não regerar. Ataque pede um pedido por direção, dizendo para onde a figura olha.
- Poses de chão (`down`, `sleep`, `dead`) = o mesmo desenho (último quadro da queda); uma direção só. Dano não é gerado (o motor faz tremor + tinta vermelha).
- Templates de animação não têm endpoint de lista; conhecidos por sondagem: `walking`, `idle`, `breathing-idle`, `getting-up`, `falling-back-death`, `dying`, `lie-down`, `stand-up`, `sitting`, `crouching`, `crouched-walking`, `angry`, `bark`, `backflip`, `cross-punch`, `running-jump`. Quadrúpedes: `template_id` bear, cat, dog, horse, lion.
- O PixelLab derrubou ~1/4 dos pedidos com "Generation stalled" (sem custo): os scripts gravam `trabalhos.txt` antes de esperar e seguem com o que deu certo.
- Ponte e rota Pro Flash desenhando estrutura com perspectiva própria NÃO bateu com o ângulo da grade (ponte torta, eixo do altar 19-28° contra 26,6° da grade): desenhar por casa com tabuleiro do atlas.
- Pro Flash/objeto: peça `The object FILLS THE WHOLE CANVAS WIDTH` e dê a altura em px na descrição; o modelo enche ~70% da tela.

## Scripts existentes (reuse; todos em `src/dev/`, seco sem `--go`)

| Script | Para quê |
|---|---|
| `ladrilhos-pro.py --conjunto chao|estrada|caverna|masmorra|paredes|planalto|rocha|sonda [--profundidade 0.6875] [--angulo 30] --go` / `--buscar TILE_ID` | leva de chão pelo tiles-pro, baixa `_referencias/pixellab/ladrilhos-pro/<id>` |
| `ladrilho-pixellab.py --descricao ... --nome ...` | um ladrilho (create-isometric-tile) + `medir` |
| `kit-predio.py --kit castelo --andares 2` | kit de construção `tile_feature: building` + `regras.json` |
| `montar-chao.py`, `montar-faces.py`, `losango.py` | atlas do chão/faces, partição exata do losango |
| `objetos-pixellab.py --conjunto <nome>` | objetos 1-direção (`CONJUNTOS`) e Pro Flash (`PRO_FLASH`: carroça, cavalo, casas, tenda, altar, mesa...), com `medir` |
| `montar-cenario.py` | recorta candidatos escolhidos, define âncora (tronco/base), monta o atlas |
| `criar-pixellab.py` | cria herói/criatura (`create-character-pro`/`state`); ids em `pixellab-personagens.json` |
| `animar-pixellab.py` | `/characters/animations`, espera fila, baixa a folha (`spritesheet`) |
| `editar-pixellab.py`, `editar-quadros.py` | `edit-animation-v2` (previa 8 vistas / consertar quadros de uma direção, janela 80x80) |
| `importar-pixellab.py`, `importar-<herói>.sh` | folha → formato do `sheet.js`; sem redimensionar, duas âncoras (em pé/no chão) |
| `reskins-*.py`, `recolorir.py`, `pixelizar.py` | reskin/pixelização local, SEM gerar |
| `src/dev/pixellab-personagens.json`, `_referencias/pixellab/LEIA.md` | ids criados (não são segredo) e a receita dos goblins |

Agentes de revisão relacionados: `revisor-cenario-iso` (especifica e revisa cenário), `revisor-motor-mapa`, `revisor-mapa-iso`.
Skills irmãs: `sprite-phandalin` (placar de sprite), `pixel-art` (fundamentos).

## Antes de gerar, checklist

1. A rota da tabela é a mais barata que serve? (reskin por recolor custa 0)
2. Geometria fixa copiada (`tile_view_angle 30`, `tile_flat_top_px 4`, `outline_mode segmentation`, altura certa)?
3. Paleta travada se a leva precisa casar com outras? Estilo/descrição idêntico entre peças da mesma família?
4. Plano seco mostrado e saldo anotado; `--go` só com ok do usuário.
5. Depois: rodar o aceite medido e olhar a imagem de verdade, antes de dizer que ficou bom.
