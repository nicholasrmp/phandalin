import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
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
      },
    },
  },
});
