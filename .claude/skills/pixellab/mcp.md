# O servidor MCP do PixelLab

Resumo de <https://api.pixellab.ai/mcp/docs>, lido em 2026-10-26. É a MESMA conta
e o MESMO saldo do REST v2 que a [referencia.md](referencia.md) documenta — muda
a porta de entrada, não o que se gasta.

## Ligar

```
url    https://api.pixellab.ai/mcp
header Authorization: Bearer <token>
```

Transporte `http`. Alguns clientes prefixam os nomes com `mcp__pixellab__`.
Existe também um conector oficial empacotado: [pixellab-code/pixellab-mcp](https://github.com/pixellab-code/pixellab-mcp).

**O token continua valendo a regra de ouro do projeto:** nunca gravado em
arquivo. No MCP ele vai na configuração do cliente, que é do usuário, não do
repositório.

## MCP ou os nossos scripts?

Os dois falam com a mesma API. A escolha é de controle, não de capacidade.

| | MCP | nossos scripts (`src/dev/*.py`) |
|---|---|---|
| plano seco antes de gastar | não tem | `--go` é obrigatório para gastar |
| o que foi pedido fica escrito | na conversa | no código, com o porquê |
| repetir meses depois | refazer o pedido | rodar o script |
| explorar, perguntar, consertar um quadro | ótimo | não serve |

**Regra:** leva de produção (um elenco, um conjunto de ladrilhos) vai por
script, porque precisa ser revisível e repetível. Experimento, conserto pontual
e dúvida vão por MCP.

## As famílias de ferramentas

**Personagem e animação** — `create_character_pro_flash` (texto → 8 vistas numa
tacada), `create_character`, `create_character_state` (variante com edição
aplicada), `animate_character`, `get_character`, `list_characters`,
`delete_character`, `update_character_tags`.

**Ladrilhos** — `create_topdown_tileset` (Wang, autotiling),
`create_sidescroller_tileset`, `create_isometric_tile`, `create_tiles_pro`,
`create_path_tiles`, `create_building_kit`, mais os `get_`/`list_`/`delete_` de
cada um.

**Objetos e mapa** — `create_object_pro_flash`, `create_1_direction_object`,
`create_8_direction_object`, `create_map_object`, `animate_object`,
`create_object_state`, `select_object_frames`, `dismiss_review`, e para o mapa
`create_map`, `edit_map`, `place_map_tiles`, `place_map_object`,
`move_map_object`, `remove_map_object`, `view_map`.

**Imagem** — `create_image_pixflux`, `create_image_pixen`,
`create_image_pro_flash`, `edit_image`, `edit_image_pixen`, `inpaint_image`,
`image_to_pixelart`, `unzoom_image`, `correct_pixelart`, `reduce_colors`,
`create_normal_map`, `transfer_outfit`.

**Animação avulsa** — `animate_image`, `animate_image_pixminimax`,
`animate_with_skeleton_v3`, `vfx_workbench` (magias, impactos, explosões),
`pixelart_workbench` (linter, sombrear, dividir, juntar, escalar).

**UI, fonte, retrato, voz** — `create_ui_asset`, `create_font`,
`create_portrait_character`, `set_character_portrait`, `create_vocal_animation`,
`create_talking_gif`, `get_lip_sync`.

**Conta e trabalho** — `get_balance`, `list_jobs`, `cancel_job`,
`wait_for_jobs`, `get_upload_url`, `add_to_project`, `remove_from_project`,
`list_projects`, `search_help`, `search_knowledge`.

## As armadilhas que a documentação avisa

**Imagem grande em base64 é truncada pelo cliente MCP.** Passe URL, ou suba com
`get_upload_url` e referencie por `upload:<id>`. Isto é a causa provável de um
pedido que "funciona" e volta errado.

**`create_character_state` pode cobrar mais do que reserva.** Deixe ~25
gerações de folga, ou chame `get_balance` antes.

**Animação pro em objeto exige `confirm_cost=true`**, e só depois do usuário
aprovar o custo.

**Tamanho fora das tabelas não se estima.** O recibo do envio traz o custo real
e a contagem de candidatos antes de qualquer desenho sair.

**Tileset que falha não é cobrado.** Padrão custa 1 geração; pro, 15 ou mais.

## Esperar o trabalho terminar

Criar devolve um id de trabalho. Verifique com `get_image(job_id)` ou use
`wait_for_jobs` — tempo padrão de 240 s, retorna quando `min_finished`
terminam. **Se o seu cliente estoura perto de 60 s, peça um tempo menor e chame
de novo.** `list_jobs` mostra os ativos; com `include_recent`, também os que
terminaram nos últimos 30 minutos.

Isto resolve, pelo caminho do MCP, as duas coisas que custaram tempo nos nossos
scripts: o teto de trabalhos simultâneos (`list_jobs` mostra quantos estão em
voo) e a corrida de baixar a folha antes de a animação entrar (`wait_for_jobs`
em vez de insistir no download até o 423 parar).
