# Publicar o Phandalin no Cloudflare (com o servidor de salas)

O site e o servidor de salas são **um só Worker** (`wrangler.toml`): os arquivos estáticos do build do Vite e três Durable Objects
(`SalaDO`, `LimitadorDO`, `DiretorioDO`). O endereço de hoje é <https://phandalin.sdz-games.workers.dev>.

## Estado de hoje (conferido em 2026-10-26)

- O que está no ar é **só o site** (assets): `/api/*` responde 404. A **primeira publicação com servidor** aplica as três
  migrações de uma vez (`v1` SalaDO, `v2` LimitadorDO, `v3` DiretorioDO), todas com armazenamento SQLite (o plano grátis exige).
- Login do `wrangler`: conta `nicholas.rmpimentel@gmail.com`. O ensaio (`wrangler deploy --dry-run`) passou, com os quatro bindings.

## Passo a passo

1. **Publique de um checkout limpo**, não da pasta de trabalho: ela pode ter arquivos de outras sessões pela metade.

   ```bash
   git worktree add ../phandalin-deploy HEAD     # o commit que você quer publicar
   cd ../phandalin-deploy
   # junction/symlink para o node_modules da pasta principal (ou npm ci)
   npm run build
   npx wrangler deploy --dry-run                  # confere bindings e migrações
   ```

2. **Publique ligando o código do servidor** (só na produção; o `wrangler.toml` fica em `"0"` para desenvolvimento e testes):

   ```bash
   npx wrangler deploy --var CODIGO_DO_SERVIDOR:1
   ```

   Com `"1"`, só abre sala quem pediu o código ao servidor (`POST /api/nova-sala`, 6 por hora por IP) e só o servidor abre
   uma taverna pública. Sem isso, qualquer navegador escolhe o código que quiser.

3. **Conferir** (o endereço é o do Worker):

   ```bash
   curl -s https://phandalin.sdz-games.workers.dev/api/taverna        # {"codigo":"XXXXXX","nova":true}
   curl -s -X POST https://phandalin.sdz-games.workers.dev/api/nova-sala
   ```

4. **Roteiro de teste com 4 pessoas** (cada uma num navegador/aba diferente, com o link do site):
   1. Todas: Multijogador → **Taverna pública** → nome → sentar na **Mesa 1** (a primeira a sentar é a dona).
   2. A dona aperta **Abrir a sala**; as outras três entram sozinhas na sala privada.
   3. Cada uma pega **um herói**, marca *pronto*; a dona inicia.
   4. Jogar até a primeira luta; pedir um **descanso rápido** (votação), usar uma **frase** e uma **marca** (Alt+clique).
   5. A dona **fecha a aba**: depois de ~20 s outra pessoa assume e a partida continua do último save.
   6. Quem **recarrega a aba** volta à sala sozinho.
   Anote: o que travou, o que ficou lento, quantos pedidos o painel do Cloudflare mostra no fim.

5. **Olhar o consumo** (painel do Cloudflare → Workers → `phandalin` → Metrics): o plano grátis dá **100 mil requisições por
   dia** (cada mensagem de WebSocket que chega conta 1 para 20), 13.000 GB-s de Durable Object por dia e 100 mil linhas
   gravadas por dia. Uma sessão de 4 pessoas por 1 hora é o número que falta medir.

## Desfazer

- `npx wrangler rollback` volta à versão anterior do Worker (o código; as classes de Durable Object que já existem ficam).
- Para tirar só o servidor de salas sem mexer no site: publique de um commit antigo (o site sozinho, sem `main`).

## O que NÃO está resolvido (decida antes de abrir ao público)

- **Moderação:** não há denúncia, silenciar nem banir; o nome de exibição é livre (sem filtro). Taverna pública só tem frases
  prontas, o que reduz o risco, mas não o elimina.
- **Celular:** a partida em sala ainda não foi pensada para celular.
- **Luta sem save:** o save só acontece explorando; se o anfitrião cair no meio de uma luta, a cena recomeça.
- **Custo real** de uma sessão no plano grátis ainda não foi medido.
