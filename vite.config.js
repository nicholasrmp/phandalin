import { defineConfig, loadEnv } from 'vite';
import { pluginDialogo } from './src/dev/servidor-dialogo.mjs';
import { resolve } from 'node:path';

export default defineConfig(({ mode }) => ({
  // O diálogo com modelo: `POST /api/dialogo`, só em `npm run dev`. O '' lê o `.env` inteiro AQUI, no Node; o que vai
  // ao navegador continua sendo só o que começa com VITE_, e a chave não começa.
  plugins: [{ ...pluginDialogo(loadEnv(mode, process.cwd(), ''), process.cwd()), apply: 'serve' }],
  // O servidor de salas é o Worker (`src/worker`), não o Vite: em desenvolvimento,
  // `/api` vai para o `wrangler dev` (npx wrangler dev --port 8787 --local).
  server: { port: 5190, open: false, proxy: { '/api': { target: 'http://127.0.0.1:8787', ws: true, changeOrigin: false } } },
  build: {
    target: 'es2020',
    sourcemap: 'hidden',
    rollupOptions: {
      input: {
        // O jogo e a página de decisão das direções visuais.
        main: resolve(import.meta.dirname, 'index.html'),
        estilos: resolve(import.meta.dirname, 'estilos.html'),
        personagens: resolve(import.meta.dirname, 'personagens.html'),
        itens: resolve(import.meta.dirname, 'itens.html'),
        fatiar: resolve(import.meta.dirname, 'fatiar.html'),
        propostas: resolve(import.meta.dirname, 'propostas.html'),
        rig: resolve(import.meta.dirname, 'rig.html'),
        fichaSprite: resolve(import.meta.dirname, 'ficha-sprite.html'),
        editor: resolve(import.meta.dirname, 'editor.html'),
      },
    },
  },
}));
