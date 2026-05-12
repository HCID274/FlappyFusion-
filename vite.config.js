import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  base: './',
  server: {
    host: '127.0.0.1',
    port: 8000,
    strictPort: false,
    open: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 8000,
    strictPort: false,
    open: true,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
