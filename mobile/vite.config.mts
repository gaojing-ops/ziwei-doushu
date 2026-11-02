import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  resolve: { alias: { '@': fileURLToPath(new URL('..', import.meta.url)) } },
  build: {
    outDir: 'dist', emptyOutDir: true, target: 'es2020',
    // The APK loads these assets locally; shared Next.js client directives have no CSR semantics.
    chunkSizeWarningLimit: 1400,
    rolldownOptions: { checks: { moduleLevelDirective: false } },
  },
  preview: { host: '127.0.0.1', port: 3108, strictPort: true },
});
