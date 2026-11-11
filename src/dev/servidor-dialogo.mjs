// O SERVIDOR DO DIÁLOGO COM MODELO no `npm run dev`, como plugin do Vite: `POST /api/dialogo`. A chave vem do `.env` (fora do
// repositório, sem o prefixo VITE_ que a mandaria ao navegador). O que ele faz com a pergunta está em `game/dialogo-servidor.js`,
// o mesmo que o Worker usa na publicação; aqui mora só o HTTP e o disco: as falas em `public/dialogos/banco.json` e o caixa em
// `.dialogo-gastos.json`, por token e pelo preço de cada modelo.
import fs from 'node:fs';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { bancoVazio } from '../game/dialogo-ia.js';
import { PRECOS, chamarModelo, custoDe, gastosVazios, responderPergunta as responderComGuarda } from '../game/dialogo-servidor.js';

export { chamarModelo, custoDe };

const lerJson = (p, reserva) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return reserva; } };
function gravarJson(p, dados) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const tmp = `${p}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(dados, null, 1)}\n`);
  fs.renameSync(tmp, p);
}

/** O tratamento de uma pergunta, guardando em arquivo. Separado do HTTP para os testes o rodarem com um modelo de mentira. */
export function responderPergunta(corpo, { chamar, modelo, teto, raiz }) {
  const pBanco = path.join(raiz, 'public', 'dialogos', 'banco.json');
  const pGastos = path.join(raiz, '.dialogo-gastos.json');
  return responderComGuarda(corpo, {
    chamar, modelo, teto,
    guarda: {
      lerBanco: () => lerJson(pBanco, bancoVazio()),
      gravarBanco: (b) => gravarJson(pBanco, b),
      lerGastos: () => lerJson(pGastos, gastosVazios()),
      gravarGastos: (g) => gravarJson(pGastos, g),
    },
  });
}

/** O plugin. `env` vem do `loadEnv` do `vite.config.js`. */
export function pluginDialogo(env, raiz) {
  const modelo = env.DIALOGO_MODELO || 'claude-opus-5-5';
  const teto = Number(env.DIALOGO_TETO_USD ?? 10);
  const client = env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1, timeout: 30000 }) : null;
  const chamar = client && PRECOS[modelo] ? (m, f, l, p, mem) => chamarModelo(client, m, f, l, p, mem) : null;
  return {
    name: 'phandalin-dialogo',
    configureServer(server) {
      // O caderno das perguntas (`dev/relatorio-dialogos.mjs`). Fora do repositório.
      server.middlewares.use('/api/dialogo-registro', (req, res) => {
        let bruto = '';
        req.on('data', (c) => { bruto += c; if (bruto.length > 2000) req.destroy(); });
        req.on('end', () => {
          try { fs.appendFileSync(path.join(raiz, '.dialogo-registro.jsonl'), `${JSON.stringify({ em: Date.now(), ...JSON.parse(bruto) })}\n`); } catch { /* caderno não derruba o jogo */ }
          res.statusCode = 204;
          res.end();
        });
      });
      server.middlewares.use('/api/dialogo', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
        let bruto = '';
        req.on('data', (c) => { bruto += c; if (bruto.length > 9000) req.destroy(); });
        req.on('end', async () => {
          let corpo = null;
          try { corpo = JSON.parse(bruto); } catch { /* cai no 400 */ }
          const r = await responderPergunta(corpo, { chamar, modelo, teto, raiz });
          res.statusCode = r.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(r.corpo));
        });
      });
    },
  };
}
